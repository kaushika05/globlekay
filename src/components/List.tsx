import { SyntheticEvent, useEffect, useState } from "react";
import { GlobeMethods } from "react-globe.gl";
import { FormattedMessage } from "react-intl";
import { Country } from "../lib/country";
import { answerName } from "../util/answer";
import { findCentre, turnGlobe } from "../util/globe";
import Toggle from "./Toggle";

type Props = {
  guesses: Country[];
  win: boolean;
  globeRef: React.MutableRefObject<GlobeMethods>;
  practiceMode: boolean;
  safeJsonParse: (jsonString: string | null, fallback: any) => any;
};

function reorderGuesses(guessList: Country[], practiceMode: boolean, safeJsonParse: (jsonString: string | null, fallback: any) => any) {
  return [...guessList].sort((a, b) => {
    // practice
    if (practiceMode) {
      const answerCountry = safeJsonParse(
        localStorage.getItem("practice"),
        null
      ) as Country;
      if (!answerCountry) return a.proximity - b.proximity;
      const answerName = answerCountry.properties.NAME;
      if (a.properties.NAME === answerName) {
        return -1;
      } else if (b.properties.NAME === answerName) {
        return 1;
      } else {
        return a.proximity - b.proximity;
      }
    }

    // daily
    if (a.properties.NAME === answerName) {
      return -1;
    } else if (b.properties.NAME === answerName) {
      return 1;
    } else {
      return a.proximity - b.proximity;
    }
  });
}

export default function List({ guesses, win, globeRef, practiceMode, safeJsonParse }: Props) {
  const [orderedGuesses, setOrderedGuesses] = useState(
    reorderGuesses(guesses, practiceMode, safeJsonParse)
  );
  const [miles, setMiles] = useState(false);

  useEffect(() => {
    setOrderedGuesses(reorderGuesses(guesses, practiceMode, safeJsonParse));
  }, [guesses, practiceMode, safeJsonParse]);

  function formatKm(m: number, miles: boolean) {
    const METERS_PER_MILE = 1609.34;
    const BIN = 10;
    const value = miles ? m / METERS_PER_MILE : m / 1000;
    if (value < BIN) return "< " + BIN;

    const rounded = Math.round(value / BIN) * BIN;
    // const max = min + BIN;
    const format = (num: number) =>
      num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return `~ ${format(rounded)}`;
  }

  const qualifier = win ? "Answer" : "Closest";

  function turnToCountry(e: SyntheticEvent, idx: number) {
    const clickedCountry = isSortedByDistance
      ? orderedGuesses[idx]
      : guesses[idx];
    const { lat, lng, altitude } = findCentre(clickedCountry);
    turnGlobe({ lat, lng, altitude }, globeRef, "zoom");
  }

  const closest = orderedGuesses[0];
  const farthest = orderedGuesses[orderedGuesses.length - 1];

  const [isSortedByDistance, setIsSortedByDistance] = useState(true);
  const guessesToDisplay = isSortedByDistance ? orderedGuesses : guesses;

  return (
    <div className="md:ml-10 md:mr-0 py-8 dark:text-white z-30 mb-20">
      {orderedGuesses.length > 0 && (
        <p className="my-1">
          {isSortedByDistance ? (
            <b>
              <FormattedMessage id={qualifier} />
            </b>
          ) : (
            <b>
              <FormattedMessage id="Guessed" />
            </b>
          )}
        </p>
      )}
      <ul className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {guessesToDisplay.map((guess, idx) => {
          const { NAME_LEN, ABBREV, NAME, FLAG } = guess.properties;
          const flag = (FLAG || "").toLocaleLowerCase();
          let name = NAME_LEN >= 10 ? ABBREV : NAME;

          return (
            <li key={idx}>
              <button
                onClick={(e) => turnToCountry(e, idx)}
                className="flex items-center cursor-pointer"
              >
                <img
                  src={`https://flagcdn.com/w20/${flag.toLowerCase()}.png`}
                  alt={name}
                  className=""
                />
                <span className="ml-2 text-md text-left">{name}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {closest && farthest && (
        <div className="mt-8">
          <div className="flex items-center space-x-1">
            <p>
              <FormattedMessage id="Game8" />:{" "}
              {formatKm(closest?.proximity, miles)}
            </p>
            <Toggle
              name="miles"
              setToggle={setMiles}
              toggle={miles}
              on="km"
              off="miles"
            />
          </div>
          <p>
            <button
              onClick={() => setIsSortedByDistance(!isSortedByDistance)}
              className="mt-2"
            >
              <span className="text-md underline">
                <FormattedMessage
                  id={isSortedByDistance ? "SortByGuesses" : "SortByDistance"}
                />
              </span>
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
