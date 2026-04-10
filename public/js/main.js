const socket = io();

const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const actions = document.getElementById('actions');
const shareSection = document.getElementById('shareSection');
const shareLink = document.getElementById('shareLink');
const copyBtn = document.getElementById('copyBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const errorMsg = document.getElementById('errorMsg');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('visible');
  setTimeout(() => errorMsg.classList.remove('visible'), 3000);
}

socket.on('connect', () => {
  statusDot.classList.remove('disconnected');
  statusText.textContent = 'Connected';
});

socket.on('disconnect', () => {
  statusDot.classList.add('disconnected');
  statusText.textContent = 'Disconnected';
});

createBtn.addEventListener('click', () => {
  socket.emit('create_room', 'Player 1');
});

socket.on('room_created', ({ roomId }) => {
  const url = `${window.location.origin}/play/${roomId}`;
  shareLink.textContent = url;
  actions.style.display = 'none';
  shareSection.classList.add('active');

  // Also navigate creator to game page after a brief moment
  setTimeout(() => {
    window.location.href = `/play/${roomId}?host=1`;
  }, 100);
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(shareLink.textContent);
  copyBtn.textContent = '✅';
  setTimeout(() => copyBtn.textContent = '📋', 1500);
});

joinBtn.addEventListener('click', () => {
  const code = roomInput.value.trim().toUpperCase();
  if (!code) {
    showError('Enter a room code');
    return;
  }
  window.location.href = `/play/${code}`;
});

roomInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') joinBtn.click();
});
