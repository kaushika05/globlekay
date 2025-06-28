import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import type { Country } from '../src/lib/country';
import { polygonDistance } from '../src/util/distance';
import { getColour } from '../src/util/colour';
import { answerCountry } from '../src/util/answer';

const app = express();
app.use(cors());

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*'
  }
});

if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../build');
  app.use(express.static(buildPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

interface Player {
  id: string;
  score: number;
}

interface GuessInfo {
  playerId: string;
  country: string;
  distanceColor: string;
}

interface Room {
  code: string;
  players: Record<string, Player>;
  guesses: GuessInfo[];
}

const countryData: Country[] = require('../src/data/country_data.json').features;
const validCodes = new Set(countryData.map(c => c.properties.WB_A3));

const rooms: Record<string, Room> = {};

function generateCode(): string {
  let code = '';
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]);
  return code;
}

function joinRoom(code: string, playerId: string): Room {
  if (!rooms[code]) {
    rooms[code] = { code, players: {}, guesses: [] };
  }
  if (!rooms[code].players[playerId]) {
    rooms[code].players[playerId] = { id: playerId, score: 0 };
  }
  return rooms[code];
}

function addGuess(room: Room, playerId: string, iso: string): GuessInfo | null {
  const country = countryData.find(c => c.properties.WB_A3 === iso);
  if (!country) return null;
  country['proximity'] = polygonDistance(country, answerCountry);
  const distanceColor = getColour(country, answerCountry, false, false, false);
  room.guesses.push({ playerId, country: iso, distanceColor });
  if (room.players[playerId]) {
    room.players[playerId].score += 1;
  }
  return { playerId, country: iso, distanceColor };
}

io.on('connection', socket => {
  socket.on('createRoom', () => {
    const code = generateCode();
    joinRoom(code, socket.id);
    socket.join(code);
    socket.emit('createRoom', code);
  });

  socket.on('joinRoom', (code: string) => {
    const room = joinRoom(code, socket.id);
    socket.join(code);
    socket.emit('roomJoined', room);
  });

  socket.on('guess', ({ roomCode, country }: { roomCode: string; country: string }) => {
    const room = rooms[roomCode];
    if (!room || !validCodes.has(country)) return;
    const guessInfo = addGuess(room, socket.id, country);
    if (!guessInfo) return;
    io.to(roomCode).emit('newGuess', guessInfo);
    const leaderboard = Object.values(room.players).map(p => ({ playerId: p.id, score: p.score }));
    io.to(roomCode).emit('leaderboardUpdate', leaderboard);
    if (country === answerCountry.properties.WB_A3) {
      io.to(roomCode).emit('gameOver', leaderboard);
    }
  });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
