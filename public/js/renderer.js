const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const PADDLE_W = 15;
const PADDLE_H = 110;
const PADDLE_MARGIN = 20;
const BALL_R = 8;

class PongRenderer {
  constructor() {
    this.app = null;
    this.ready = false;
    this.prevScores = [0, 0];
    this.trailPositions = [];
    this.particles = [];
    this.init();
  }

  async init() {
    const container = document.getElementById('pixiCanvas');

    this.app = new PIXI.Application();
    await this.app.init({
      background: 0x0a0a0f,
      resizeTo: container,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    container.appendChild(this.app.canvas);

    // Main game container (scaled to fit)
    this.gameContainer = new PIXI.Container();
    this.app.stage.addChild(this.gameContainer);

    this.createBackground();
    this.createCenterLine();
    this.createScoreTexts();
    this.createTrailContainer();
    this.createPaddles();
    this.createBall();
    this.createParticleContainer();

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.ready = true;
  }

  resize() {
    if (!this.app) return;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    const scale = Math.min(w / GAME_WIDTH, h / GAME_HEIGHT) * 0.92;
    this.gameContainer.scale.set(scale);
    this.gameContainer.x = (w - GAME_WIDTH * scale) / 2;
    this.gameContainer.y = (h - GAME_HEIGHT * scale) / 2;
  }

  createBackground() {
    // Dark background with subtle border
    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, GAME_WIDTH, GAME_HEIGHT, 8);
    bg.fill({ color: 0x0d0d14 });
    bg.roundRect(0, 0, GAME_WIDTH, GAME_HEIGHT, 8);
    bg.stroke({ color: 0x1e1e2e, width: 2 });
    this.gameContainer.addChild(bg);

    // Subtle grid
    const grid = new PIXI.Graphics();
    const gridAlpha = 0.04;
    for (let x = 0; x <= GAME_WIDTH; x += 40) {
      grid.moveTo(x, 0);
      grid.lineTo(x, GAME_HEIGHT);
    }
    for (let y = 0; y <= GAME_HEIGHT; y += 40) {
      grid.moveTo(0, y);
      grid.lineTo(GAME_WIDTH, y);
    }
    grid.stroke({ color: 0xffffff, width: 0.5, alpha: gridAlpha });
    this.gameContainer.addChild(grid);

    // Vignette overlay (corners darker)
    const vignette = new PIXI.Graphics();
    vignette.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    vignette.fill({ color: 0x000000, alpha: 0.0 });
    this.gameContainer.addChild(vignette);
  }

  createCenterLine() {
    const line = new PIXI.Graphics();
    const dashLen = 12;
    const gap = 10;
    for (let y = 0; y < GAME_HEIGHT; y += dashLen + gap) {
      line.roundRect(GAME_WIDTH / 2 - 1.5, y, 3, dashLen, 1);
    }
    line.fill({ color: 0xffffff, alpha: 0.1 });
    this.gameContainer.addChild(line);
  }

  createScoreTexts() {
    const style = new PIXI.TextStyle({
      fontFamily: 'Inter, sans-serif',
      fontSize: 72,
      fontWeight: '900',
      fill: 0xffffff,
      alpha: 0.12,
    });
    this.scoreLeft = new PIXI.Text({ text: '0', style });
    this.scoreLeft.anchor.set(0.5, 0);
    this.scoreLeft.x = GAME_WIDTH * 0.35;
    this.scoreLeft.y = 20;
    this.scoreLeft.alpha = 0.12;
    this.gameContainer.addChild(this.scoreLeft);

    this.scoreRight = new PIXI.Text({ text: '0', style });
    this.scoreRight.anchor.set(0.5, 0);
    this.scoreRight.x = GAME_WIDTH * 0.65;
    this.scoreRight.y = 20;
    this.scoreRight.alpha = 0.12;
    this.gameContainer.addChild(this.scoreRight);
  }

  createTrailContainer() {
    this.trailContainer = new PIXI.Container();
    this.gameContainer.addChild(this.trailContainer);
    this.trailGraphics = [];
    for (let i = 0; i < 12; i++) {
      const g = new PIXI.Graphics();
      this.trailContainer.addChild(g);
      this.trailGraphics.push(g);
    }
  }

  createPaddles() {
    // Left paddle (purple)
    this.paddleLeft = new PIXI.Graphics();
    this.drawPaddleGraphic(this.paddleLeft, 0xa855f7);
    this.gameContainer.addChild(this.paddleLeft);

    // Left glow
    this.paddleLeftGlow = new PIXI.Graphics();
    this.drawPaddleGlow(this.paddleLeftGlow, 0xa855f7);
    this.gameContainer.addChild(this.paddleLeftGlow);

    // Right paddle (cyan)
    this.paddleRight = new PIXI.Graphics();
    this.drawPaddleGraphic(this.paddleRight, 0x06b6d4);
    this.gameContainer.addChild(this.paddleRight);

    // Right glow
    this.paddleRightGlow = new PIXI.Graphics();
    this.drawPaddleGlow(this.paddleRightGlow, 0x06b6d4);
    this.gameContainer.addChild(this.paddleRightGlow);
  }

  drawPaddleGraphic(g, color) {
    g.roundRect(0, 0, PADDLE_W, PADDLE_H, 6);
    g.fill({ color });
  }

  drawPaddleGlow(g, color) {
    g.roundRect(-4, -4, PADDLE_W + 8, PADDLE_H + 8, 8);
    g.fill({ color, alpha: 0.15 });
  }

  createBall() {
    // Ball glow
    this.ballGlow = new PIXI.Graphics();
    this.ballGlow.circle(0, 0, BALL_R * 3);
    this.ballGlow.fill({ color: 0xffffff, alpha: 0.08 });
    this.gameContainer.addChild(this.ballGlow);

    // Ball
    this.ball = new PIXI.Graphics();
    this.ball.circle(0, 0, BALL_R);
    this.ball.fill({ color: 0xffffff });
    this.gameContainer.addChild(this.ball);
  }

  createParticleContainer() {
    this.particleContainer = new PIXI.Container();
    this.gameContainer.addChild(this.particleContainer);
  }

  spawnParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
      const color = Math.random() > 0.5 ? 0xa855f7 : 0x06b6d4;
      const g = new PIXI.Graphics();
      const size = 2 + Math.random() * 3;
      g.circle(0, 0, size);
      g.fill({ color });
      g.x = x;
      g.y = y;
      this.particleContainer.addChild(g);
      this.particles.push({
        graphic: g,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 1,
        decay: 0.015 + Math.random() * 0.02,
      });
    }
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.graphic.x += p.vx;
      p.graphic.y += p.vy;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= p.decay;
      p.graphic.alpha = p.life;
      if (p.life <= 0) {
        this.particleContainer.removeChild(p.graphic);
        p.graphic.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  render(state) {
    if (!this.ready || !state) return;
    const [bx, by, p0y, p1y, s0, s1] = state;

    // Score change -> particles
    if (s0 !== this.prevScores[0]) {
      this.spawnParticles(GAME_WIDTH * 0.35, 60, 25);
      this.prevScores[0] = s0;
    }
    if (s1 !== this.prevScores[1]) {
      this.spawnParticles(GAME_WIDTH * 0.65, 60, 25);
      this.prevScores[1] = s1;
    }

    // Scores
    this.scoreLeft.text = String(s0);
    this.scoreRight.text = String(s1);

    // Paddles
    this.paddleLeft.x = PADDLE_MARGIN;
    this.paddleLeft.y = p0y;
    this.paddleLeftGlow.x = PADDLE_MARGIN;
    this.paddleLeftGlow.y = p0y;

    const rpX = GAME_WIDTH - PADDLE_MARGIN - PADDLE_W;
    this.paddleRight.x = rpX;
    this.paddleRight.y = p1y;
    this.paddleRightGlow.x = rpX;
    this.paddleRightGlow.y = p1y;

    // Ball trail
    this.trailPositions.push({ x: bx, y: by });
    if (this.trailPositions.length > 12) this.trailPositions.shift();

    for (let i = 0; i < this.trailGraphics.length; i++) {
      const g = this.trailGraphics[i];
      g.clear();
      if (i < this.trailPositions.length) {
        const t = this.trailPositions[i];
        const alpha = (i / this.trailPositions.length) * 0.25;
        const r = BALL_R * (i / this.trailPositions.length) * 0.7;
        g.circle(t.x, t.y, r);
        g.fill({ color: 0xffffff, alpha });
      }
    }

    // Ball
    this.ball.x = bx;
    this.ball.y = by;
    this.ballGlow.x = bx;
    this.ballGlow.y = by;

    // Particles
    this.updateParticles();
  }

  reset() {
    this.trailPositions = [];
    this.prevScores = [0, 0];
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particleContainer.removeChild(this.particles[i].graphic);
      this.particles[i].graphic.destroy();
    }
    this.particles = [];
    for (const g of this.trailGraphics) g.clear();
  }
}
