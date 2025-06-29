import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import type { Country } from '../src/lib/country';
import { polygonDistance } from '../src/util/distance';
import { getColour } from '../src/util/colour';

const app = express();
app.use(cors());

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
  name: string;
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

interface Room {
  code: string;
  answerCountry: Country;
  players: Record<string, Player>;
  guesses: GuessInfo[];
  isGameOver: boolean;
  createdAt: number;
}

const countryData: Country[] = require('../data/countries.geo.json').features;
const validCodes = new Set(countryData.map(c => c.properties.WB_A3));

const rooms: Record<string, Room> = {};

function generateCode(): string {
  let code = '';
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]);
  return code;
}

function getRandomCountry(): Country {
  return countryData[Math.floor(Math.random() * countryData.length)];
}

function joinRoom(code: string, playerId: string, playerName: string, isCreator: boolean = false): Room {
  if (!rooms[code]) {
    const answerCountry = getRandomCountry();
    rooms[code] = { 
      code, 
      answerCountry,
      players: {}, 
      guesses: [],
      isGameOver: false,
      createdAt: Date.now()
    };
  }
  if (!rooms[code].players[playerId]) {
    rooms[code].players[playerId] = { 
      id: playerId, 
      name: playerName,
      score: 0, 
      guesses: [],
      hasWon: false,
      isCreator
    };
  }
  return rooms[code];
}

function addGuess(room: Room, playerId: string, playerName: string, iso: string): GuessInfo | null {
  const country = countryData.find(c => c.properties.WB_A3 === iso);
  if (!country) return null;
  
  country['proximity'] = polygonDistance(country, room.answerCountry);
  const distanceColor = getColour(country, room.answerCountry, false, false, false);
  
  const guessInfo: GuessInfo = { 
    playerId, 
    playerName,
    country: iso, 
    countryName: country.properties.NAME,
    distanceColor, 
    proximity: country['proximity'],
    timestamp: Date.now()
  };
  
  room.guesses.push(guessInfo);
  
  if (room.players[playerId]) {
    room.players[playerId].score += 1;
    room.players[playerId].guesses.push(iso);
    
    // Check if player has won
    if (iso === room.answerCountry.properties.WB_A3) {
      room.players[playerId].hasWon = true;
    }
  }
  
  return guessInfo;
}

function getLeaderboard(room: Room) {
  return Object.values(room.players).map(p => ({
    playerId: p.id,
    playerName: p.name,
    score: p.score,
    guesses: p.guesses,
    hasWon: p.hasWon,
    isCreator: p.isCreator
  }));
}

function checkGameOver(room: Room): boolean {
  const allPlayers = Object.values(room.players);
  const allPlayersWon = allPlayers.every(p => p.hasWon);
  const atLeastOnePlayerWon = allPlayers.some(p => p.hasWon);
  
  // Game ends if all players have won or if at least one player has won and it's been 5 minutes
  const fiveMinutes = 5 * 60 * 1000;
  const timeElapsed = Date.now() - room.createdAt;
  
  return allPlayersWon || (atLeastOnePlayerWon && timeElapsed > fiveMinutes);
}

function cleanupRoom(roomCode: string) {
  delete rooms[roomCode];
  console.log(`Room ${roomCode} cleaned up`);
}

io.on('connection', socket => {
  console.log('Client connected:', socket.id);
  
  socket.on('createRoom', (playerName: string = 'Player') => {
    console.log('Creating room for client:', socket.id, 'Name:', playerName);
    const code = generateCode();
    const room = joinRoom(code, socket.id, playerName, true);
    socket.join(code);
    console.log('Room created with code:', code, 'Answer:', room.answerCountry.properties.NAME);
    socket.emit('createRoom', { code, answerCountry: room.answerCountry });
  });

  socket.on('joinRoom', ({ code, playerName }: { code: string; playerName: string }) => {
    console.log('Client joining room:', code, 'Client ID:', socket.id, 'Name:', playerName);
    const room = joinRoom(code, socket.id, playerName);
    socket.join(code);
    
    // Send room info to the joining player
    socket.emit('roomJoined', {
      code: room.code,
      players: Object.values(room.players),
      guesses: room.guesses,
      isGameOver: room.isGameOver
    });
    
    // Notify other players in the room
    socket.to(code).emit('playerJoined', {
      playerId: socket.id,
      playerName,
      players: Object.values(room.players)
    });
  });

  socket.on('guess', ({ roomCode, country }: { roomCode: string; country: string }) => {
    const room = rooms[roomCode];
    if (!room || !validCodes.has(country) || room.isGameOver) return;
    
    const player = room.players[socket.id];
    if (!player) return;
    
    // Check if player already guessed this country
    if (player.guesses.includes(country)) {
      socket.emit('error', 'Country already guessed');
      return;
    }
    
    const guessInfo = addGuess(room, socket.id, player.name, country);
    if (!guessInfo) return;
    
    // Broadcast new guess to all players in the room
    io.to(roomCode).emit('newGuess', guessInfo);
    
    // Update leaderboard
    const leaderboard = getLeaderboard(room);
    io.to(roomCode).emit('leaderboardUpdate', leaderboard);
    
    // Check if game should end
    if (checkGameOver(room)) {
      room.isGameOver = true;
      io.to(roomCode).emit('gameOver', {
        leaderboard,
        answerCountry: room.answerCountry,
        winner: guessInfo.country === room.answerCountry.properties.WB_A3 ? player.name : null
      });
      
      // Clean up room after 30 seconds
      setTimeout(() => cleanupRoom(roomCode), 30000);
    }
  });

  socket.on('endGame', (roomCode: string) => {
    const room = rooms[roomCode];
    if (!room) return;
    
    const player = room.players[socket.id];
    if (!player || !player.isCreator) {
      socket.emit('error', 'Only room creator can end the game');
      return;
    }
    
    room.isGameOver = true;
    const leaderboard = getLeaderboard(room);
    io.to(roomCode).emit('gameOver', {
      leaderboard,
      answerCountry: room.answerCountry,
      endedByCreator: true
    });
    
    // Clean up room after 30 seconds
    setTimeout(() => cleanupRoom(roomCode), 30000);
  });

  socket.on('getLeaderboard', (roomCode: string) => {
    const room = rooms[roomCode];
    if (!room) return;
    
    const leaderboard = getLeaderboard(room);
    socket.emit('leaderboardUpdate', leaderboard);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Remove player from all rooms they were in
    Object.keys(rooms).forEach(roomCode => {
      const room = rooms[roomCode];
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        
        // Notify other players
        socket.to(roomCode).emit('playerLeft', {
          playerId: socket.id,
          players: Object.values(room.players)
        });
        
        // If no players left, clean up room
        if (Object.keys(room.players).length === 0) {
          cleanupRoom(roomCode);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
