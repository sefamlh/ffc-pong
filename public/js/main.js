const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const roomInput = document.getElementById('roomInput');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const errorMsg = document.getElementById('errorMsg');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('visible');
  setTimeout(() => errorMsg.classList.remove('visible'), 3000);
}

// Generate a random 6-char room code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

createBtn.addEventListener('click', () => {
  const roomId = generateCode();
  const url = `${window.location.origin}/play/${roomId}`;
  navigator.clipboard.writeText(url).catch(() => {});
  window.location.href = `/play/${roomId}`;
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

// Connection status (optional, just visual)
const socket = io();
socket.on('connect', () => {
  statusDot.classList.remove('disconnected');
  statusText.textContent = 'Connected';
});
socket.on('disconnect', () => {
  statusDot.classList.add('disconnected');
  statusText.textContent = 'Disconnected';
});
