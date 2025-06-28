import { useState, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import { Country } from "../lib/country";
import { getColourEmoji } from "../util/colour";
import { polygonDistance } from "../util/distance";
import { answerCountry } from "../util/answer";

interface LeaderboardPlayer {
  playerId: string;
  playerName: string;
  score: number;
  guesses: string[];
  hasWon: boolean;
  isCreator: boolean;
}

interface GuessInfo {
  playerId: string;
  playerName: string;
  country: string;
  countryName: string;
  distanceColor: string;
  proximity: number;
  timestamp: number;
}

type Props = {
  leaderboard: LeaderboardPlayer[];
  guesses: GuessInfo[];
  roomCode: string;
  isCreator: boolean;
  onEndGame: () => void;
  show: boolean;
  onClose: () => void;
};

export default function Leaderboard({ 
  leaderboard, 
  guesses, 
  roomCode, 
  isCreator, 
  onEndGame, 
  show, 
  onClose 
}: Props) {
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score');
  
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'score') {
      if (a.hasWon && !b.hasWon) return -1;
      if (!a.hasWon && b.hasWon) return 1;
      return a.score - b.score;
    } else {
      return a.playerName.localeCompare(b.playerName);
    }
  });

  const getPlayerGuesses = (playerId: string) => {
    return guesses
      .filter(g => g.playerId === playerId)
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const formatGuessEmoji = (countryCode: string) => {
    const country = require("../data/countries.geo.json").features.find(
      (c: Country) => c.properties.WB_A3 === countryCode
    );
    if (!country) return "❓";
    
    country.proximity = polygonDistance(country, answerCountry);
    return getColourEmoji(country, answerCountry);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            <FormattedMessage id="Leaderboard" defaultMessage="Leaderboard" />
          </h2>
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'name')}
              className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded px-3 py-1"
            >
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Name</option>
            </select>
            {isCreator && (
              <button
                onClick={onEndGame}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                <FormattedMessage id="EndGame" defaultMessage="End Game" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Room Code: <span className="font-mono font-bold">{roomCode}</span>
              </p>
            </div>
            
            <div className="space-y-4">
              {sortedLeaderboard.map((player, index) => {
                const playerGuesses = getPlayerGuesses(player.playerId);
                const emojiGuesses = player.guesses.map(formatGuessEmoji).join('');
                
                return (
                  <div
                    key={player.playerId}
                    className={`border rounded-lg p-4 ${
                      player.hasWon 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                          #{index + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {player.playerName}
                            {player.isCreator && (
                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                Creator
                              </span>
                            )}
                            {player.hasWon && (
                              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                Winner! 🎉
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <FormattedMessage 
                              id="Guesses" 
                              defaultMessage="Guesses" 
                            />: {player.score}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {playerGuesses.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          <FormattedMessage id="GuessHistory" defaultMessage="Guess History" />:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {playerGuesses.map((guess, guessIndex) => (
                            <div
                              key={guessIndex}
                              className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm"
                            >
                              <span>{formatGuessEmoji(guess.country)}</span>
                              <span className="text-gray-700 dark:text-gray-300">
                                {guess.countryName}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="text-lg font-mono">
                          {emojiGuesses}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {leaderboard.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FormattedMessage id="NoPlayers" defaultMessage="No players in the room" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 