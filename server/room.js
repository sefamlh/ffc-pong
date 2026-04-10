const crypto = require('crypto');
const { createGame } = require('./game');

const rooms = new Map();

function generateRoomId() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function createRoom(socketId, playerName) {
  const id = generateRoomId();
  const room = {
    id,
    players: [socketId],
    playerNames: [playerName],
    readyState: [false, false],
    game: null,
    status: 'waiting',
    createdAt: Date.now()
  };
  rooms.set(id, room);
  return room;
}

function joinRoom(roomId, socketId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  if (room.players.length >= 2) return { error: 'Room is full' };
  if (room.players.includes(socketId)) return { error: 'Already in room' };

  room.players.push(socketId);
  room.playerNames.push(playerName);
  room.status = 'ready';
  return { room };
}

function setReady(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  const playerIndex = room.players.indexOf(socketId);
  if (playerIndex === -1) return null;

  room.readyState[playerIndex] = true;

  if (room.readyState[0] && room.readyState[1]) {
    return { allReady: true, room };
  }
  return { allReady: false, room };
}

function startGame(roomId, io) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.status = 'playing';
  room.game = createGame(roomId, (state) => {
    io.to(roomId).emit('game_state', state);
  }, (result) => {
    room.status = 'finished';
    io.to(roomId).emit('game_over', {
      winner: result.winner,
      scores: result.scores,
      winnerName: room.playerNames[result.winner]
    });
  });
  room.game.start();
}

function handleInput(roomId, socketId, direction) {
  const room = rooms.get(roomId);
  if (!room || !room.game) return;

  const playerIndex = room.players.indexOf(socketId);
  if (playerIndex === -1) return;

  room.game.setInput(playerIndex, direction);
}

function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return null;

  if (room.game) {
    room.game.stop();
  }

  const playerIndex = room.players.indexOf(socketId);
  if (playerIndex === -1) return null;

  room.players.splice(playerIndex, 1);
  room.playerNames.splice(playerIndex, 1);
  room.readyState = [false, false];

  if (room.players.length === 0) {
    rooms.delete(roomId);
    return { deleted: true };
  }

  room.status = 'waiting';
  room.game = null;
  return { room, remainingPlayer: room.players[0] };
}

function getRoom(roomId) {
  return rooms.get(roomId);
}

function findRoomBySocket(socketId) {
  for (const [id, room] of rooms) {
    if (room.players.includes(socketId)) {
      return room;
    }
  }
  return null;
}

function resetRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.game) room.game.stop();
  room.readyState = [false, false];
  room.status = 'ready';
  room.game = null;
  return room;
}

// Cleanup stale rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.createdAt > 30 * 60 * 1000) {
      if (room.game) room.game.stop();
      rooms.delete(id);
    }
  }
}, 5 * 60 * 1000);

module.exports = { createRoom, joinRoom, setReady, startGame, handleInput, leaveRoom, getRoom, findRoomBySocket, resetRoom, _rooms: rooms };
