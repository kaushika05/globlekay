import { lazy, Suspense, useEffect, useRef, useState, useCallback } from "react";
import { GlobeMethods } from "react-globe.gl";
import { Country } from "../lib/country";
import { answerCountry } from "../util/answer";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Guesses, Stats } from "../lib/localStorage";
import { dateDiffInDays, getToday } from "../util/dates";
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
  const [, storeGuesses] = useLocalStorage<Guesses>("guesses", {
    day: getToday(),
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
  const [socketConnected, setSocketConnected] = useState(false);

  // Safe JSON parsing utility
  const safeJsonParse = useCallback((jsonString: string | null, fallback: any) => {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      return fallback;
    }
  }, []);

  function enterPracticeMode() {
    const practiceAnswer =
      countryData[Math.floor(Math.random() * countryData.length)];
    localStorage.setItem("practice", JSON.stringify(practiceAnswer));
    navigate("/game?practice_mode=true");
    setGuesses([]);
    setWin(false);
  }

  const createRoom = useCallback(() => {
    console.log("Creating room...");
    if (!socketConnected) {
      console.error("Socket not connected");
      return;
    }
    socket.emit("createRoom");
  }, [socketConnected]);

  const joinRoom = useCallback((code: string) => {
    console.log("Joining room:", code);
    if (!socketConnected) {
      console.error("Socket not connected");
      return;
    }
    socket.emit("joinRoom", code);
  }, [socketConnected]);

  // Game state
  const [guesses, setGuesses] = useState<Country[]>(practiceMode ? [] : []);
  const [win, setWin] = useState(false);
  const globeRef = useRef<GlobeMethods>(null!);

  // Socket connection management
  useEffect(() => {
    if (practiceMode) return;

    console.log("Game: Connecting socket...");
    socket.connect();

    const handleConnect = () => {
      console.log("Socket connected with ID:", socket.id);
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setSocketConnected(false);
    };

    const handleConnectError = (error: any) => {
      console.error("Socket connection error:", error);
      setSocketConnected(false);
    };

    const handleCreateRoom = (code: string) => {
      console.log("Room created with code:", code);
      setRoomCode(code);
      setShowRoomModal(false);
    };

    const handleRoomJoined = (room: any) => {
      console.log("Room joined:", room);
      setRoomCode(room.code);
      const list = room.guesses
        .map((g: any) => {
          const found = countryData.find((c) => c.properties.WB_A3 === g.country);
          if (!found) return null;
          const copy = { ...found } as Country;
          copy["proximity"] = polygonDistance(copy, answerCountry);
          return copy;
        })
        .filter(Boolean) as Country[];
      setGuesses(list);
    };

    const handleNewGuess = (info: any) => {
      const found = countryData.find((c) => c.properties.WB_A3 === info.country);
      if (!found) return;
      const copy = { ...found } as Country;
      copy["proximity"] = polygonDistance(copy, answerCountry);
      setGuesses((prev) => [...prev, copy]);
    };

    const handleGameOver = () => {
      setWin(true);
    };

    // Add event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("createRoom", handleCreateRoom);
    socket.on("roomJoined", handleRoomJoined);
    socket.on("newGuess", handleNewGuess);
    socket.on("gameOver", handleGameOver);

    // Cleanup function
    return () => {
      console.log("Game: Cleaning up socket listeners");
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("createRoom", handleCreateRoom);
      socket.off("roomJoined", handleRoomJoined);
      socket.off("newGuess", handleNewGuess);
      socket.off("gameOver", handleGameOver);
      
      // Only disconnect if we're not in practice mode
      if (!practiceMode) {
        socket.disconnect();
      }
    };
  }, [practiceMode]);

  // Whenever there's a new guess
  useEffect(() => {
    if (practiceMode) {
      const guessNames = guesses.map((country) => country.properties.NAME);
      storeGuesses({
        day: getToday(),
        countries: guessNames,
      });
    }
  }, [guesses, storeGuesses, practiceMode]);

  // When the player wins!
  useEffect(() => {
    const today = getToday();
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
        socketConnected={socketConnected}
      />
      <Guesser
        guesses={guesses}
        setGuesses={setGuesses}
        win={win}
        setWin={setWin}
        practiceMode={practiceMode}
        roomCode={roomCode}
        safeJsonParse={safeJsonParse}
      />
      {!reSpin && (
        <div className="pb-4 mb-5">
          <Globe
            guesses={guesses}
            globeRef={globeRef}
            practiceMode={practiceMode}
            safeJsonParse={safeJsonParse}
          />
          <List
            guesses={guesses}
            win={win}
            globeRef={globeRef}
            practiceMode={practiceMode}
            safeJsonParse={safeJsonParse}
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
