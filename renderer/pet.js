/**
 * Claw Pet - Lobster Animation Engine (v5 - Optimized)
 * Uses exact SVG paths from openclaw.ai homepage.
 * Fixed: relative coordinates, destroy method, consistent positioning.
 */

class PetRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'idle';
    this.tick = 0;
    this.idleTimer = 0;
    this.blinkTimer = 0;
    this.isBlinking = false;
    this.bounceY = 0;
    this.antennaSwing = 0;
    this.clawSwing = 0;
    this.mouthOpen = 0;
    this.particles = [];
    this.breathOffset = 0;
    this.eyeGlowPhase = 0;
    this._rafId = null;

    // SVG is 120x120, draw at 1.6x
    this.scale = 1.6;
    this.size = 120 * this.scale; // 192px
    this.offsetX = (this.canvas.width - this.size) / 2;
    this.offsetY = 160;

    this._startLoop();
  }

  // Public: center of the lobster in canvas coords
  get centerX() { return this.offsetX + this.size / 2; }
  get centerY() { return this.offsetY + this.size / 2; }

  // Public: bounding rect for hit-testing
  get bounds() {
    return {
      x: this.offsetX,
      y: this.offsetY,
      w: this.size,
      h: this.size,
    };
  }

  _startLoop() {
    const loop = () => {
      this._update();
      this._draw();
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  setState(state) {
    if (this.state === state) return;
    this.state = state;
    this.tick = 0;
    this.idleTimer = 0;
    if (state === 'bounce') this.bounceY = -16;
  }

  wake() {
    if (this.state === 'sleep') {
      this.setState('alert');
      setTimeout(() => this.setState('idle'), 2000);
    }
    this.idleTimer = 0;
  }

  // ---- Internal update ----

  _update() {
    this.tick++;
    this.breathOffset = Math.sin(this.tick * 0.03) * 1.5;
    this.antennaSwing = Math.sin(this.tick * 0.035) * 0.12;
    this.clawSwing = Math.sin(this.tick * 0.04) * 0.06;
    this.eyeGlowPhase = (Math.sin(this.tick * 0.05) + 1) * 0.5;

    // Blink
    this.blinkTimer++;
    if (!this.isBlinking && this.blinkTimer > 200 + Math.random() * 160) {
      this.isBlinking = true;
      this.blinkTimer = 0;
    }
    if (this.isBlinking && this.blinkTimer > 8) {
      this.isBlinking = false;
      this.blinkTimer = 0;
    }

    // Idle → sleep
    if (this.state === 'idle') {
      this.idleTimer++;
      if (this.idleTimer > 600) this.setState('sleep');
    } else {
      this.idleTimer = 0;
    }

    // Bounce decay
    if (this.bounceY < 0) {
      this.bounceY *= 0.88;
      if (this.bounceY > -0.5) this.bounceY = 0;
    }

    // Mouth
    if (this.state === 'talk') {
      this.mouthOpen = 2 + Math.sin(this.tick * 0.35) * 2;
    } else {
      this.mouthOpen *= 0.88;
    }

    // Particles
    if (this.state === 'happy' && this.tick % 10 === 0) {
      this._addParticle('sparkle');
    }
    if (this.state === 'talk' && this.tick % 14 === 0) {
      this._addParticle('dot');
    }
    this._updateParticles();
  }

  _addParticle(type) {
    const cx = this.centerX;
    const cy = this.offsetY + 30;
    this.particles.push({
      x: cx + (Math.random() - 0.5) * 50,
      y: cy,
      vx: (Math.random() - 0.5) * 1,
      vy: -0.8 - Math.random() * 1.2,
      life: 1,
      size: type === 'sparkle' ? 3 + Math.random() * 3 : 2 + Math.random() * 2,
      type,
    });
  }

  _updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.016;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  // ---- SVG paths (exact from openclaw.ai) ----

  _bodyPath(ctx) {
    ctx.moveTo(60, 10);
    ctx.bezierCurveTo(30, 10, 15, 35, 15, 55);
    ctx.bezierCurveTo(15, 75, 30, 95, 45, 100);
    ctx.lineTo(45, 110);
    ctx.lineTo(55, 110);
    ctx.lineTo(55, 100);
    ctx.bezierCurveTo(55, 100, 60, 102, 65, 100);
    ctx.lineTo(65, 110);
    ctx.lineTo(75, 110);
    ctx.lineTo(75, 100);
    ctx.bezierCurveTo(90, 95, 105, 75, 105, 55);
    ctx.bezierCurveTo(105, 35, 90, 10, 60, 10);
    ctx.closePath();
  }

  _leftClawPath(ctx) {
    ctx.moveTo(20, 45);
    ctx.bezierCurveTo(5, 40, 0, 50, 5, 60);
    ctx.bezierCurveTo(10, 70, 20, 65, 25, 55);
    ctx.bezierCurveTo(28, 48, 25, 45, 20, 45);
    ctx.closePath();
  }

  _rightClawPath(ctx) {
    ctx.moveTo(100, 45);
    ctx.bezierCurveTo(115, 40, 120, 50, 115, 60);
    ctx.bezierCurveTo(110, 70, 100, 65, 95, 55);
    ctx.bezierCurveTo(92, 48, 95, 45, 100, 45);
    ctx.closePath();
  }

  // ---- Draw ----

  _draw() {
    const ctx = this.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    const s = this.scale;
    const ox = this.offsetX;
    const oy = this.offsetY + this.bounceY;
    const b = this.breathOffset;

    ctx.save();

    // Ambient glow
    const glowR = 140 + Math.sin(this.tick * 0.02) * 6;
    const glow = ctx.createRadialGradient(this.centerX, this.centerY, 50, this.centerX, this.centerY, glowR);
    glow.addColorStop(0, 'rgba(255, 107, 107, 0.06)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.beginPath();
    ctx.ellipse(this.centerX, oy + 120 * s, 50, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gradient (matches CSS var(--logo-gradient-start/end))
    const grad = ctx.createLinearGradient(ox, oy, ox + 120 * s, oy + 120 * s);
    grad.addColorStop(0, '#FF6B6B');
    grad.addColorStop(1, '#E53935');

    // -- Draw in SVG-scaled space --
    ctx.save();
    ctx.translate(ox, oy + b * 0.3);
    ctx.scale(s, s);

    // Claws (behind body)
    this._drawClaws(ctx, grad);

    // Body
    ctx.fillStyle = grad;
    ctx.beginPath();
    this._bodyPath(ctx);
    ctx.fill();

    // Body shine
    const shine = ctx.createRadialGradient(50, 35, 0, 60, 55, 55);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
    shine.addColorStop(1, 'transparent');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.ellipse(60, 55, 45, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae
    this._drawAntennae(ctx);

    // Eyes
    this._drawEyes(ctx);

    ctx.restore(); // end SVG space

    // Particles (screen space)
    this._drawParticles(ctx);

    ctx.restore();

    // Sleep Zzz
    if (this.state === 'sleep') {
      this._drawSleepZzz(ctx);
    }
  }

  _drawClaws(ctx, grad) {
    // Left claw
    ctx.save();
    ctx.translate(20, 45);
    ctx.rotate(-this.clawSwing);
    ctx.translate(-20, -45);
    ctx.fillStyle = grad;
    ctx.beginPath();
    this._leftClawPath(ctx);
    ctx.fill();
    ctx.restore();

    // Right claw
    ctx.save();
    ctx.translate(100, 45);
    ctx.rotate(this.clawSwing);
    ctx.translate(-100, -45);
    ctx.fillStyle = grad;
    ctx.beginPath();
    this._rightClawPath(ctx);
    ctx.fill();
    ctx.restore();
  }

  _drawAntennae(ctx) {
    ctx.strokeStyle = '#FF6B6B';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Left: M45 15 Q35 5 30 8
    ctx.save();
    ctx.translate(45, 15);
    ctx.rotate(-0.1 + this.antennaSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-10, -10, -15, -7);
    ctx.stroke();
    ctx.restore();

    // Right: M75 15 Q85 5 90 8
    ctx.save();
    ctx.translate(75, 15);
    ctx.rotate(0.1 - this.antennaSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(10, -10, 15, -7);
    ctx.stroke();
    ctx.restore();
  }

  _drawEyes(ctx) {
    if (this.isBlinking || this.state === 'sleep') {
      ctx.strokeStyle = '#050810';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      [45, 75].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, 35, 4, 0.3, Math.PI - 0.3);
        ctx.stroke();
      });
      return;
    }

    [45, 75].forEach(ex => {
      // Black eye
      ctx.fillStyle = '#050810';
      ctx.beginPath();
      ctx.arc(ex, 35, 6, 0, Math.PI * 2);
      ctx.fill();

      // Cyan glow dot (SVG: cx+1, cy-1, r=2)
      const r = 2 + this.eyeGlowPhase * 0.5;
      ctx.fillStyle = '#00E5CC';
      ctx.beginPath();
      ctx.arc(ex + 1, 34, r, 0, Math.PI * 2);
      ctx.fill();

      // Glow aura
      const eg = ctx.createRadialGradient(ex + 1, 34, 0, ex + 1, 34, 10);
      eg.addColorStop(0, `rgba(0, 229, 204, ${0.15 + this.eyeGlowPhase * 0.1})`);
      eg.addColorStop(1, 'transparent');
      ctx.fillStyle = eg;
      ctx.fillRect(ex - 10, 24, 22, 22);
    });
  }

  _drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.type === 'sparkle' ? '#00E5CC' : '#FF6B6B';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _drawSleepZzz(ctx) {
    const cx = this.centerX + 42;
    const cy = this.offsetY + 20;
    const t = this.tick * 0.02;

    for (let i = 0; i < 3; i++) {
      const x = cx + i * 10 + Math.sin(t + i) * 3;
      const baseY = cy - i * 16;
      const y = baseY - ((this.tick * 0.2 + i * 25) % 50);
      const size = 10 + i * 3;
      const alpha = Math.max(0, 1 - ((this.tick * 0.2 + i * 25) % 50) / 50);

      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = '#00E5CC';
      ctx.font = `bold ${size}px sans-serif`;
      ctx.fillText('z', x, y);
    }
    ctx.globalAlpha = 1;
  }
}
