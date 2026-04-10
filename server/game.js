const WIDTH = 800;
const HEIGHT = 500;

const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 110;
const PADDLE_SPEED = 9;
const PADDLE_MARGIN = 20;

const BALL_RADIUS = 8;
const BALL_BASE_SPEED = 6;
const BALL_SPEED_INCREMENT = 0.3;
const BALL_MAX_SPEED = 12;

const WIN_SCORE = 5;
const TICK_RATE = 60;
const TICK_INTERVAL = 1000 / TICK_RATE;

function createGame(roomId, onState, onFinish) {
  let interval = null;
  let paused = false;
  let pauseTimer = null;

  const state = {
    ball: { x: WIDTH / 2, y: HEIGHT / 2, vx: 0, vy: 0, speed: BALL_BASE_SPEED },
    paddles: [
      { y: HEIGHT / 2 - PADDLE_HEIGHT / 2 },
      { y: HEIGHT / 2 - PADDLE_HEIGHT / 2 }
    ],
    scores: [0, 0],
    status: 'playing'
  };

  const inputs = ['stop', 'stop'];

  function resetBall(serveToward) {
    state.ball.x = WIDTH / 2;
    state.ball.y = HEIGHT / 2;
    state.ball.speed = BALL_BASE_SPEED;
    const angle = (Math.random() * 0.8 - 0.4); // -0.4 to 0.4 radians
    const dir = serveToward === 0 ? -1 : 1;
    state.ball.vx = dir * Math.cos(angle) * state.ball.speed;
    state.ball.vy = Math.sin(angle) * state.ball.speed;
  }

  function tick() {
    if (paused) return;

    // Move paddles
    for (let i = 0; i < 2; i++) {
      if (inputs[i] === 'up') {
        state.paddles[i].y = Math.max(0, state.paddles[i].y - PADDLE_SPEED);
      } else if (inputs[i] === 'down') {
        state.paddles[i].y = Math.min(HEIGHT - PADDLE_HEIGHT, state.paddles[i].y + PADDLE_SPEED);
      }
    }

    // Move ball
    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;

    // Wall collision (top/bottom)
    if (state.ball.y - BALL_RADIUS <= 0) {
      state.ball.y = BALL_RADIUS;
      state.ball.vy = Math.abs(state.ball.vy);
    }
    if (state.ball.y + BALL_RADIUS >= HEIGHT) {
      state.ball.y = HEIGHT - BALL_RADIUS;
      state.ball.vy = -Math.abs(state.ball.vy);
    }

    // Left paddle collision (player 0)
    const lp = state.paddles[0];
    if (
      state.ball.vx < 0 &&
      state.ball.x - BALL_RADIUS <= PADDLE_MARGIN + PADDLE_WIDTH &&
      state.ball.x - BALL_RADIUS >= PADDLE_MARGIN &&
      state.ball.y >= lp.y &&
      state.ball.y <= lp.y + PADDLE_HEIGHT
    ) {
      state.ball.x = PADDLE_MARGIN + PADDLE_WIDTH + BALL_RADIUS;
      const hitPos = (state.ball.y - lp.y) / PADDLE_HEIGHT; // 0 to 1
      const angle = (hitPos - 0.5) * (Math.PI / 3); // -60 to 60 degrees
      state.ball.speed = Math.min(state.ball.speed + BALL_SPEED_INCREMENT, BALL_MAX_SPEED);
      state.ball.vx = Math.cos(angle) * state.ball.speed;
      state.ball.vy = Math.sin(angle) * state.ball.speed;
    }

    // Right paddle collision (player 1)
    const rp = state.paddles[1];
    const rightPaddleX = WIDTH - PADDLE_MARGIN - PADDLE_WIDTH;
    if (
      state.ball.vx > 0 &&
      state.ball.x + BALL_RADIUS >= rightPaddleX &&
      state.ball.x + BALL_RADIUS <= rightPaddleX + PADDLE_WIDTH &&
      state.ball.y >= rp.y &&
      state.ball.y <= rp.y + PADDLE_HEIGHT
    ) {
      state.ball.x = rightPaddleX - BALL_RADIUS;
      const hitPos = (state.ball.y - rp.y) / PADDLE_HEIGHT;
      const angle = (hitPos - 0.5) * (Math.PI / 3);
      state.ball.speed = Math.min(state.ball.speed + BALL_SPEED_INCREMENT, BALL_MAX_SPEED);
      state.ball.vx = -Math.cos(angle) * state.ball.speed;
      state.ball.vy = Math.sin(angle) * state.ball.speed;
    }

    // Scoring
    if (state.ball.x - BALL_RADIUS <= 0) {
      state.scores[1]++;
      if (state.scores[1] >= WIN_SCORE) {
        state.status = 'finished';
        onState(serializeState());
        onFinish({ winner: 1, scores: [...state.scores] });
        stop();
        return;
      }
      pauseAndServe(0);
      return;
    }

    if (state.ball.x + BALL_RADIUS >= WIDTH) {
      state.scores[0]++;
      if (state.scores[0] >= WIN_SCORE) {
        state.status = 'finished';
        onState(serializeState());
        onFinish({ winner: 0, scores: [...state.scores] });
        stop();
        return;
      }
      pauseAndServe(1);
      return;
    }

    onState(serializeState());
  }

  function pauseAndServe(toward) {
    paused = true;
    state.ball.vx = 0;
    state.ball.vy = 0;
    state.ball.x = WIDTH / 2;
    state.ball.y = HEIGHT / 2;
    onState(serializeState());

    pauseTimer = setTimeout(() => {
      paused = false;
      resetBall(toward);
    }, 1000);
  }

  function serializeState() {
    return [
      Math.round(state.ball.x),
      Math.round(state.ball.y),
      Math.round(state.paddles[0].y),
      Math.round(state.paddles[1].y),
      state.scores[0],
      state.scores[1]
    ];
  }

  function start() {
    resetBall(Math.random() < 0.5 ? 0 : 1);
    interval = setInterval(tick, TICK_INTERVAL);
  }

  function stop() {
    if (interval) clearInterval(interval);
    if (pauseTimer) clearTimeout(pauseTimer);
    interval = null;
  }

  function setInput(playerIndex, direction) {
    if (playerIndex === 0 || playerIndex === 1) {
      inputs[playerIndex] = direction;
    }
  }

  return { start, stop, setInput };
}

module.exports = { createGame, WIDTH, HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_MARGIN, BALL_RADIUS, WIN_SCORE };
