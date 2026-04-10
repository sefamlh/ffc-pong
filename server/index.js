const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { createRoom, joinRoom, setReady, startGame, handleInput, leaveRoom, getRoom, findRoomBySocket, resetRoom } = require('./room');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/rooms/:id', (req, res) => {
  const room = getRoom(req.params.id);
  if (!room) return res.status(404).json({ error: 'Room not found' });
  res.json({
    id: room.id,
    players: room.players.length,
    status: room.status
  });
});

// Serve game.html for /play/:roomId
app.get('/play/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'game.html'));
});

io.on('connection', (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on('create_room', (playerName) => {
    const room = createRoom(socket.id, playerName || 'Player 1');
    socket.join(room.id);
    socket.emit('room_created', { roomId: room.id });
    console.log(`Room ${room.id} created by ${socket.id}`);
  });

  socket.on('join_room', ({ roomId, playerName }) => {
    const result = joinRoom(roomId, socket.id, playerName || 'Player 2');
    if (result.error) {
      socket.emit('join_error', { error: result.error });
      return;
    }
    socket.join(roomId);
    io.to(roomId).emit('room_full', {
      players: result.room.playerNames
    });
    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on('player_ready', (roomId) => {
    const result = setReady(roomId, socket.id);
    if (!result) return;

    socket.to(roomId).emit('opponent_ready');

    if (result.allReady) {
      io.to(roomId).emit('countdown', { seconds: 3 });
      let count = 3;
      const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
          io.to(roomId).emit('countdown', { seconds: count });
        } else {
          clearInterval(countInterval);
          io.to(roomId).emit('game_start');
          startGame(roomId, io);
        }
      }, 1000);
    }
  });

  socket.on('paddle_move', ({ roomId, direction }) => {
    handleInput(roomId, socket.id, direction);
  });

  socket.on('play_again', (roomId) => {
    const room = resetRoom(roomId);
    if (room) {
      io.to(roomId).emit('room_reset', { players: room.playerNames });
    }
  });

  socket.on('disconnect', () => {
    const room = findRoomBySocket(socket.id);
    if (room) {
      const result = leaveRoom(room.id, socket.id);
      if (result && !result.deleted) {
        io.to(room.id).emit('opponent_left');
      }
    }
    console.log(`Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`FFC Pong server running on port ${PORT}`);
});
