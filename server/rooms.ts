export const MAX_PLAYERS = 10;

export interface RoomState {
  answer: string;
  guesses: string[];
  scores: Record<string, number>;
  leaderboard: { playerId: string; guesses: number }[];
}

type Room = {
  state: RoomState;
  players: Set<string>;
  timeout: NodeJS.Timeout;
};

const rooms: Record<string, Room> = {};

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createRoom(answer: string): string {
  let code = generateCode();
  while (rooms[code]) {
    code = generateCode();
  }
  const state: RoomState = {
    answer,
    guesses: [],
    scores: {},
    leaderboard: [],
  };
  const timeout = setTimeout(() => {
    delete rooms[code];
  }, 1000 * 60 * 60 * 2); // 2 hours

  rooms[code] = { state, players: new Set(), timeout };
  return code;
}

export function joinRoom(code: string, playerId: string): RoomState | null {
  const room = rooms[code];
  if (!room) return null;
  if (room.players.size >= MAX_PLAYERS) return null;
  room.players.add(playerId);
  if (!(playerId in room.state.scores)) {
    room.state.scores[playerId] = 0;
  }
  return room.state;
}

export function addGuess(
  code: string,
  playerId: string,
  country: string
): RoomState | null {
  const room = rooms[code];
  if (!room) return null;
  if (!room.players.has(playerId)) return null;

  room.state.guesses.push(country);
  if (!(playerId in room.state.scores)) {
    room.state.scores[playerId] = 0;
  }
  room.state.scores[playerId] += 1;

  if (country.toLowerCase() === room.state.answer.toLowerCase()) {
    const exists = room.state.leaderboard.some(
      (e) => e.playerId === playerId
    );
    if (!exists) {
      room.state.leaderboard.push({
        playerId,
        guesses: room.state.scores[playerId],
      });
      room.state.leaderboard.sort((a, b) => a.guesses - b.guesses);
    }
  }

  return room.state;
}
