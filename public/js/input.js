class InputHandler {
  constructor(onInput) {
    this.onInput = onInput;
    this.currentDir = 'stop';
    this.setupKeyboard();
    this.setupTouch();
  }

  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      let dir = null;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dir = 'up';
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dir = 'down';

      if (dir && dir !== this.currentDir) {
        this.currentDir = dir;
        this.onInput(dir);
      }
    });

    document.addEventListener('keyup', (e) => {
      if (['ArrowUp', 'ArrowDown', 'w', 'W', 's', 'S'].includes(e.key)) {
        this.currentDir = 'stop';
        this.onInput('stop');
      }
    });
  }

  setupTouch() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;

    let activeTouch = null;

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const y = touch.clientY - rect.top;
      const mid = rect.height / 2;

      activeTouch = y < mid ? 'up' : 'down';
      if (activeTouch !== this.currentDir) {
        this.currentDir = activeTouch;
        this.onInput(activeTouch);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const y = touch.clientY - rect.top;
      const mid = rect.height / 2;

      const dir = y < mid ? 'up' : 'down';
      if (dir !== this.currentDir) {
        this.currentDir = dir;
        this.onInput(dir);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.currentDir = 'stop';
      this.onInput('stop');
    }, { passive: false });
  }
}
