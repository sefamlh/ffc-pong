const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const PADDLE_W = 15;
const PADDLE_H = 100;
const PADDLE_MARGIN = 20;
const BALL_R = 8;

class PongRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.trail = [];
    this.particles = [];
    this.prevScores = [0, 0];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const maxW = window.innerWidth * 0.95;
    const maxH = window.innerHeight * 0.85;
    this.scale = Math.min(maxW / GAME_WIDTH, maxH / GAME_HEIGHT);
    this.canvas.width = GAME_WIDTH * this.scale;
    this.canvas.height = GAME_HEIGHT * this.scale;
  }

  render(state) {
    if (!state) return;
    const [bx, by, p0y, p1y, s0, s1] = state;
    const ctx = this.ctx;
    const s = this.scale;

    // Check for score changes -> particles
    if (s0 !== this.prevScores[0] || s1 !== this.prevScores[1]) {
      this.spawnScoreParticles(bx * s, by * s);
      this.prevScores = [s0, s1];
    }

    // Clear
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Center line
    ctx.setLineDash([8 * s, 8 * s]);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH / 2 * s, 0);
    ctx.lineTo(GAME_WIDTH / 2 * s, GAME_HEIGHT * s);
    ctx.stroke();
    ctx.setLineDash([]);

    // Scores
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = `${64 * s}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(s0, GAME_WIDTH * 0.35 * s, 80 * s);
    ctx.fillText(s1, GAME_WIDTH * 0.65 * s, 80 * s);

    // Left paddle (purple)
    this.drawPaddle(PADDLE_MARGIN * s, p0y * s, '#a855f7');

    // Right paddle (cyan)
    this.drawPaddle((GAME_WIDTH - PADDLE_MARGIN - PADDLE_W) * s, p1y * s, '#06b6d4');

    // Ball trail
    this.trail.push({ x: bx * s, y: by * s });
    if (this.trail.length > 8) this.trail.shift();

    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 0.3;
      const r = BALL_R * s * (i / this.trail.length) * 0.8;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }

    // Ball
    ctx.beginPath();
    ctx.arc(bx * s, by * s, BALL_R * s, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15 * s;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Particles
    this.updateParticles(ctx);
  }

  drawPaddle(x, y, color) {
    const ctx = this.ctx;
    const s = this.scale;
    const w = PADDLE_W * s;
    const h = PADDLE_H * s;
    const r = 4 * s;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20 * s;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  spawnScoreParticles(x, y) {
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1,
        color: Math.random() > 0.5 ? '#a855f7' : '#06b6d4'
      });
    }
  }

  updateParticles(ctx) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3 * this.scale, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
}
