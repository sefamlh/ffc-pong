const socket = io();

// DOM Elements
const waitingOverlay = document.getElementById('waitingOverlay');
const waitingText = document.getElementById('waitingText');
const waitingShareBox = document.getElementById('waitingShareBox');
const gameShareLink = document.getElementById('gameShareLink');
const gameCopyBtn = document.getElementById('gameCopyBtn');
const readyBtn = document.getElementById('readyBtn');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNum = document.getElementById('countdownNum');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultScores = document.getElementById('resultScores');
const playAgainBtn = document.getElementById('playAgainBtn');
const backBtn = document.getElementById('backBtn');
const gameHeader = document.getElementById('gameHeader');
const p1Name = document.getElementById('p1Name');
const p2Name = document.getElementById('p2Name');
const canvas = document.getElementById('gameCanvas');

// State
const roomId = window.location.pathname.split('/play/')[1];
let playerIndex = -1;
let gameActive = false;
let currentState = null;

// Renderer
const renderer = new PongRenderer(canvas);

// Input
const input = new InputHandler((direction) => {
  if (gameActive) {
    socket.emit('paddle_move', { roomId, direction });
  }
});

// Connection - everyone joins with join_room
socket.on('connect', () => {
  socket.emit('join_room', { roomId, playerName: 'Player' });
});

// Waiting for opponent (first player in room)
socket.on('waiting_for_opponent', () => {
  playerIndex = 0;
  const shareUrl = `${window.location.origin}/play/${roomId}`;
  gameShareLink.textContent = shareUrl;
  waitingShareBox.style.display = 'block';
  waitingText.textContent = 'Waiting for opponent...';
});

// Copy button
gameCopyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(gameShareLink.textContent);
  gameCopyBtn.textContent = '✅';
  setTimeout(() => gameCopyBtn.textContent = '📋', 1500);
});

// Room full - both players joined
socket.on('room_full', ({ players, yourIndex }) => {
  playerIndex = yourIndex;
  p1Name.textContent = players[0];
  p2Name.textContent = players[1];
  waitingText.textContent = `${players[0]} vs ${players[1]}`;
  waitingShareBox.style.display = 'none';
  readyBtn.style.display = 'block';
});

// Join error
socket.on('join_error', ({ error }) => {
  waitingText.textContent = error;
});

// Ready
readyBtn.addEventListener('click', () => {
  socket.emit('player_ready', roomId);
  readyBtn.textContent = 'Waiting for opponent...';
  readyBtn.disabled = true;
  readyBtn.style.opacity = '0.5';
});

socket.on('opponent_ready', () => {
  waitingText.textContent = 'Opponent is ready!';
});

// Countdown
socket.on('countdown', ({ seconds }) => {
  waitingOverlay.classList.add('hidden');
  countdownOverlay.classList.remove('hidden');
  countdownNum.textContent = seconds;
});

// Game start
socket.on('game_start', () => {
  countdownOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  gameHeader.style.display = 'flex';
  gameActive = true;
  renderLoop();
});

// Game state
socket.on('game_state', (state) => {
  currentState = state;
});

// Game over
socket.on('game_over', ({ winner, scores, winnerName }) => {
  gameActive = false;
  const won = winner === playerIndex;
  resultTitle.textContent = won ? 'You Win!' : 'You Lose';
  resultTitle.className = `overlay-title ${won ? 'gold' : 'purple'}`;
  resultScores.textContent = `${scores[0]} - ${scores[1]}`;
  gameOverOverlay.classList.remove('hidden');
});

// Opponent left
socket.on('opponent_left', () => {
  gameActive = false;
  resultTitle.textContent = 'Opponent Left';
  resultTitle.className = 'overlay-title purple';
  resultScores.textContent = '';
  gameOverOverlay.classList.remove('hidden');
});

// Room reset (play again)
socket.on('room_reset', ({ players }) => {
  gameOverOverlay.classList.add('hidden');
  waitingOverlay.classList.remove('hidden');
  waitingText.textContent = `${players[0]} vs ${players[1]}`;
  readyBtn.style.display = 'block';
  readyBtn.textContent = 'Ready!';
  readyBtn.disabled = false;
  readyBtn.style.opacity = '1';
  currentState = null;
  renderer.trail = [];
  renderer.particles = [];
  renderer.prevScores = [0, 0];
});

// Play again
playAgainBtn.addEventListener('click', () => {
  socket.emit('play_again', roomId);
});

// Back to lobby
backBtn.addEventListener('click', () => {
  window.location.href = '/';
});

// Render loop
function renderLoop() {
  if (currentState) {
    renderer.render(currentState);
  }
  if (gameActive) {
    requestAnimationFrame(renderLoop);
  } else if (currentState) {
    renderer.render(currentState);
  }
}
