import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { GlobeMethods } from "react-globe.gl";
import { Country } from "../lib/country";
import { answerCountry, answerName } from "../util/answer";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Guesses, Stats } from "../lib/localStorage";
import { dateDiffInDays, today } from "../util/dates";
import { polygonDistance } from "../util/distance";
import { getColourEmoji } from "../util/colour";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import socket from "../socket";
import RoomModal from "../components/RoomModal";

const Globe = lazy(() => import("../components/Globe"));
const Guesser = lazy(() => import("../components/Guesser"));
const List = lazy(() => import("../components/List"));
const countryData: Country[] = require("../data/countries.geo.json").features;

type Props = {
  reSpin: boolean;
  setShowStats: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function Game({ reSpin, setShowStats }: Props) {
  // Get data from local storage
  const [storedGuesses, storeGuesses] = useLocalStorage<Guesses>("guesses", {
    day: today,
    countries: [],
  });

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

  // Set up practice mode
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const practiceMode = !!params.get("practice_mode");

  const [roomCode, setRoomCode] = useState("");
  const [showRoomModal, setShowRoomModal] = useState(!practiceMode);

  function enterPracticeMode() {
    const practiceAnswer =
      countryData[Math.floor(Math.random() * countryData.length)];
    localStorage.setItem("practice", JSON.stringify(practiceAnswer));
    navigate("/game?practice_mode=true");
    setGuesses([]);
    setWin(false);
  }

  function createRoom() {
    socket.emit("createRoom");
  }

  function joinRoom(code: string) {
    socket.emit("joinRoom", code);
  }

  const storedCountries = useMemo(() => {
    if (today <= storedGuesses.day && !practiceMode) {
      const names = storedGuesses.countries;
      return names.map((guess) => {
        const foundCountry = countryData.find((country) => {
          return country.properties.NAME === guess;
        });
        if (!foundCountry) throw new Error("Country mapping broken");
        foundCountry["proximity"] = polygonDistance(
          foundCountry,
          answerCountry
        );
        return foundCountry;
      });
    }
    return [];
    // eslint-disable-next-line
  }, [practiceMode]);

  // Game state
  const [guesses, setGuesses] = useState<Country[]>(practiceMode ? [] : []);
  const [win, setWin] = useState(false);
  const globeRef = useRef<GlobeMethods>(null!);

  useEffect(() => {
    if (practiceMode) return;

    function isoToCountry(iso: string) {
      const found = countryData.find((c) => c.properties.WB_A3 === iso);
      if (!found) return null;
      const copy = { ...found } as Country;
      copy["proximity"] = polygonDistance(copy, answerCountry);
      return copy;
    }

    socket.on("createRoom", (code: string) => {
      setRoomCode(code);
    });

    socket.on("roomJoined", (room: any) => {
      setRoomCode(room.code);
      const list = room.guesses
        .map((g: any) => isoToCountry(g.country))
        .filter(Boolean) as Country[];
      setGuesses(list);
    });

    socket.on("newGuess", (info: any) => {
      const c = isoToCountry(info.country);
      if (c) setGuesses((prev) => [...prev, c]);
    });

    socket.on("gameOver", () => {
      setWin(true);
    });

    return () => {
      socket.off("createRoom");
      socket.off("roomJoined");
      socket.off("newGuess");
      socket.off("gameOver");
    };
  }, [practiceMode]);

  // Whenever there's a new guess
  useEffect(() => {
    if (practiceMode) {
      const guessNames = guesses.map((country) => country.properties.NAME);
      storeGuesses({
        day: today,
        countries: guessNames,
      });
    }
  }, [guesses, storeGuesses, practiceMode]);

  // When the player wins!
  useEffect(() => {
    if (win && storedStats.lastWin !== today && !practiceMode) {
      // Store new stats in local storage
      const lastWin = today;
      const gamesWon = storedStats.gamesWon + 1;
      const streakBroken = dateDiffInDays(storedStats.lastWin, lastWin) > 1;
      const currentStreak = streakBroken ? 1 : storedStats.currentStreak + 1;
      const maxStreak =
        currentStreak > storedStats.maxStreak
          ? currentStreak
          : storedStats.maxStreak;
      const usedGuesses = [...storedStats.usedGuesses, guesses.length];
      const chunks = [];
      for (let i = 0; i < guesses.length; i += 8) {
        chunks.push(guesses.slice(i, i + 8));
      }
      const emojiGuesses = chunks
        .map((each) =>
          each
            .map((guess) => getColourEmoji(guess, guesses[guesses.length - 1]))
            .join("")
        )
        .join("\n");
      const newStats = {
        lastWin,
        gamesWon,
        currentStreak,
        maxStreak,
        usedGuesses,
        emojiGuesses,
      };
      storeStats(newStats);

      // Show stats
      setTimeout(() => setShowStats(true), 3000);
    }
  }, [win, guesses, setShowStats, storeStats, storedStats, practiceMode]);

  // Practice mode

  // Fallback while loading
  const renderLoader = () => (
    <p className="dark:text-gray-200">
      <FormattedMessage id="Loading" />
    </p>
  );

  return (
    <Suspense fallback={renderLoader()}>
      <RoomModal
        show={!practiceMode && showRoomModal}
        roomCode={roomCode}
        onCreate={createRoom}
        onJoin={joinRoom}
        onClose={() => setShowRoomModal(false)}
      />
      <Guesser
        guesses={guesses}
        setGuesses={setGuesses}
        win={win}
        setWin={setWin}
        practiceMode={practiceMode}
        roomCode={roomCode}
      />
      {!reSpin && (
        <div className="pb-4 mb-5">
          <Globe
            guesses={guesses}
            globeRef={globeRef}
            practiceMode={practiceMode}
          />
          <List
            guesses={guesses}
            win={win}
            globeRef={globeRef}
            practiceMode={practiceMode}
          />
          {practiceMode && (
            <div className="my-4 flex flex-wrap gap-3 items-center">
              <span className="dark:text-gray-200">
                <FormattedMessage id="PracticeMode" />
              </span>
              <button
                className="text-white bg-blue-700 hover:bg-blue-800
        focus:ring-4 focus:ring-blue-300 rounded-lg text-sm
        px-4 py-2.5 text-center items-center
        dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={() => navigate("/")}
              >
                {" "}
                <FormattedMessage id="PracticeExit" />
              </button>
              <button
                className="text-white bg-blue-700 hover:bg-blue-800
        focus:ring-4 focus:ring-blue-300 rounded-lg text-sm
        px-4 py-2.5 text-center items-center
        dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                onClick={enterPracticeMode}
              >
                <FormattedMessage id="PracticeNew" />
              </button>
            </div>
          )}
        </div>
      )}
    </Suspense>
  );
}
