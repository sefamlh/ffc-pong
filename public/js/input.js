class InputHandler {
  constructor(onInput) {
    this.onInput = onInput;
    this.currentDir = 'stop';
    this.keys = { up: false, down: false };
    this.setupKeyboard();
    this.setupTouch();
  }

  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = true;
      this.updateDirection();
      e.preventDefault();
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.down = false;
      this.updateDirection();
    });
  }

  updateDirection() {
    let dir = 'stop';
    if (this.keys.up && !this.keys.down) dir = 'up';
    else if (this.keys.down && !this.keys.up) dir = 'down';

    if (dir !== this.currentDir) {
      this.currentDir = dir;
      this.onInput(dir);
    }
  }

  setupTouch() {
    const el = document.getElementById('gameContainer');
    if (!el) return;

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleTouch(e.touches[0]);
    }, { passive: false });

    el.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handleTouch(e.touches[0]);
    }, { passive: false });

    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      if (this.currentDir !== 'stop') {
        this.currentDir = 'stop';
        this.onInput('stop');
      }
    }, { passive: false });
  }

  handleTouch(touch) {
    const rect = document.getElementById('gameContainer').getBoundingClientRect();
    const y = touch.clientY - rect.top;
    const mid = rect.height / 2;
    const dir = y < mid ? 'up' : 'down';
    if (dir !== this.currentDir) {
      this.currentDir = dir;
      this.onInput(dir);
    }
  }
}
