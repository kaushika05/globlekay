import { useContext, useEffect, useRef, useState } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Stats } from "../lib/localStorage";
import { isMobile } from "react-device-detect";
import { getPath } from "../util/svg";
import { today } from "../util/dates";
import { isFirefox } from "react-device-detect";
import { FormattedMessage } from "react-intl";
import { LocaleContext } from "../i18n/LocaleContext";
import localeList from "../i18n/messages";
import Fade from "../transitions/Fade";

type Props = {
  setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Statistics({ setShowStats }: Props) {
  const localeContext = useContext(LocaleContext);
  const { locale } = localeContext;

  // Stats data
  const firstStats = {
    gamesWon: 0,
    lastWin: new Date(0).toLocaleDateString("en-CA"),
    currentStreak: 0,
    maxStreak: 0,
    usedGuesses: [],
    emojiGuesses: "",
  };

  const [storedStats, storeStats] = useLocalStorage<Stats>(
    "statistics",
    firstStats
  );
  const {
    gamesWon,
    lastWin,
    currentStreak,
    maxStreak,
    usedGuesses,
    emojiGuesses,
  } = storedStats;

  const sumGuesses = usedGuesses.reduce((a, b) => a + b, 0);
  const avgGuesses = Math.round((sumGuesses / usedGuesses.length) * 100) / 100;
  const showAvgGuesses = usedGuesses.length === 0 ? "--" : avgGuesses;
  const todaysGuesses =
    lastWin === today ? usedGuesses[usedGuesses.length - 1] : "--";

  const showLastWin = lastWin >= "2022-01-01" ? lastWin : "--";

  const avgShorthand = isMobile
    ? localeList[locale]["Stats7"]
    : localeList[locale]["Stats6"];

  const statsTable = [
    { label: localeList[locale]["Stats1"], value: showLastWin },
    { label: localeList[locale]["Stats2"], value: todaysGuesses },
    { label: localeList[locale]["Stats3"], value: gamesWon },
    { label: localeList[locale]["Stats4"], value: currentStreak },
    { label: localeList[locale]["Stats5"], value: maxStreak },
    { label: avgShorthand, value: showAvgGuesses },
  ];

  // Closing the modal
  const modalRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    function closeModal(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!modalRef.current?.contains(target)) {
        setShowStats(false);
      }
    }
    document.addEventListener("click", closeModal);
    return () => {
      document.removeEventListener("click", closeModal);
    };
  }, [setShowStats]);

  // Reset stats
  const [msg, setMsg] = useState("");
  const [showResetMsg, setShowResetMsg] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  // const [question, setQuestion] = useState(false);
  function promptReset() {
    setMsg(localeList[locale]["Stats10"]);
    // setQuestion(true);
    setResetComplete(false);
    setShowResetMsg(true);
  }
  function resetStats() {
    storeStats(firstStats);
    setShowResetMsg(false);
    setTimeout(() => {
      setMsg(localeList[locale]["Stats11"]);
      setShowCopyMsg(true);
    }, 200);
    setTimeout(() => setShowCopyMsg(false), 2200);
  }

  // Clipboard
  const [showCopyMsg, setShowCopyMsg] = useState(false);
  const options = { year: "numeric", month: "short", day: "numeric" };
  const event = new Date();
  // @ts-ignore
  const unambiguousDate = event.toLocaleDateString(locale, options);
  const date = unambiguousDate === "Invalid Date" ? today : unambiguousDate;
  async function copyToClipboard() {
    const shareString = `🌎 ${date} 🌍
🔥 ${currentStreak} | ${localeList[locale]["Stats7"]}: ${showAvgGuesses}
${lastWin === today ? emojiGuesses : "--"} = ${todaysGuesses}

#kaysgloblemod`;

    try {
      if ("canShare" in navigator && isMobile && !isFirefox) {
        await navigator.share({ title: "Kay's Globle Mod Stats", text: shareString });
        setMsg("Shared!");
        setShowCopyMsg(true);
        return setTimeout(() => setShowCopyMsg(false), 2000);
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareString);
        setMsg("Copied!");
        setShowCopyMsg(true);
        return setTimeout(() => setShowCopyMsg(false), 2000);
      } else {
        document.execCommand("copy", true, shareString);
        setMsg("Copied!");
        setShowCopyMsg(true);
        return setTimeout(() => setShowCopyMsg(false), 2000);
      }
    } catch (e) {
      setMsg("This browser cannot share");
      setShowCopyMsg(true);
      return setTimeout(() => setShowCopyMsg(false), 2000);
    }
  }

  return (
    <div ref={modalRef} className="max-w-sm">
      <button
        className="absolute top-3 right-4"
        onClick={() => setShowStats(false)}
      >
        <svg
          x="0px"
          y="0px"
          viewBox="0 0 460.775 460.775"
          width="12px"
          className=" dark:fill-gray-300"
        >
          <path d={getPath("x")} />
        </svg>
      </button>
      <h2
        className="text-3xl text-center font-extrabold dark:text-gray-200"
        style={{ fontFamily: "'Montserrat'" }}
      >
        <FormattedMessage id="StatsTitle" />
      </h2>
      <table
        cellPadding="4rem"
        className="mx-auto dark:text-gray-200"
        width="100%"
      >
        <tbody>
          {statsTable.map((row, idx) => {
            return (
              <tr key={idx}>
                <td
                  className="pt-4 border-b-2 border-dotted border-slate-700 
                text-lg font-medium"
                >
                  {row.label}
                </td>
                <td
                  className="pt-4 border-b-2 border-dotted border-slate-700 
                text-lg font-medium"
                >
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="py-6 flex w-full justify-around">
        <button
          className=" text-red-700 border-red-700 border rounded-md px-6 py-2 block
          text-base font-medium hover:bg-red-700 hover:text-gray-300
          focus:outline-none focus:ring-2 focus:ring-red-300 sm:mx-4"
          onClick={promptReset}
        >
          <FormattedMessage id="Stats8" />
        </button>
        <button
          className="bg-blue-700 hover:bg-blue-900 dark:bg-purple-800 dark:hover:bg-purple-900
          text-white dark:text-gray-200 rounded-md px-8 py-2 block text-base font-medium 
          focus:outline-none focus:ring-2 focus:ring-blue-300 
          justify-around sm:flex-grow sm:mx-10"
          onClick={copyToClipboard}
        >
          <FormattedMessage id="Stats9" />
        </button>
      </div>
      <Fade
        show={showResetMsg}
        background="border-4 border-sky-300 dark:border-slate-700 bg-sky-100 
        dark:bg-slate-900 drop-shadow-xl 
        absolute z-10 top-24 w-fit inset-x-0 mx-auto py-4 px-4 rounded-md space-y-2"
      >
        <p className="text-gray-900 dark:text-gray-200">{msg}</p>
        <div className="py-4 flex justify-center sm:space-x-8">
          <button
            className="bg-red-700 text-white rounded-md px-6 py-2 block 
            text-base font-medium hover:bg-red-900 disabled:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-300"
            onClick={resetStats}
            disabled={resetComplete}
          >
            Yes
          </button>
          <button
            className="bg-blue-700 text-white rounded-md px-6 py-2 block 
            text-base font-medium hover:bg-blue-900 disabled:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={() => setShowResetMsg(false)}
            disabled={resetComplete}
          >
            No
          </button>
        </div>
      </Fade>
      <Fade
        show={showCopyMsg}
        background="border-4 border-sky-300 dark:border-slate-700 
        bg-sky-100 dark:bg-slate-900 drop-shadow-xl 
      absolute z-10 top-24 w-fit inset-x-0 mx-auto py-4 px-4 rounded-md space-y-2"
      >
        <p className="text-gray-900 dark:text-gray-200">{msg}</p>
      </Fade>
    </div>
  );
}
