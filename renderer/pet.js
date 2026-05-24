/**
 * Claw Pet - Ladybug Animation Engine (v3 - Gradient Style)
 * Smooth gradient red body, large light-blue-pupil eyes,
 * thin red antennae, heart hands, stick legs. Animated.
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
    this.legSwing = 0;
    this.mouthOpen = 0;
    this.heartPulse = 0;
    this.particles = [];
    this.breathOffset = 0;
    this.eyeGlowPhase = 0;

    this.startLoop();
  }

  startLoop() {
    const loop = () => { this.update(); this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  update() {
    this.tick++;
    this.breathOffset = Math.sin(this.tick * 0.03) * 2;
    this.antennaSwing = Math.sin(this.tick * 0.035) * 0.12;
    this.legSwing = Math.sin(this.tick * 0.05) * 0.06;
    this.heartPulse = 1 + Math.sin(this.tick * 0.07) * 0.06;
    this.eyeGlowPhase = (Math.sin(this.tick * 0.04) + 1) * 0.5;

    // Blink
    this.blinkTimer++;
    if (!this.isBlinking && this.blinkTimer > 200 + Math.random() * 160) {
      this.isBlinking = true; this.blinkTimer = 0;
    }
    if (this.isBlinking && this.blinkTimer > 8) {
      this.isBlinking = false; this.blinkTimer = 0;
    }

    // Idle → sleep
    if (this.state === 'idle') {
      this.idleTimer++;
      if (this.idleTimer > 600) this.setState('sleep');
    } else {
      this.idleTimer = 0;
    }

    // Bounce decay
    if (this.bounceY < 0) { this.bounceY *= 0.88; if (this.bounceY > -0.5) this.bounceY = 0; }

    // Mouth
    if (this.state === 'talk') {
      this.mouthOpen = 3 + Math.sin(this.tick * 0.35) * 2.5;
    } else {
      this.mouthOpen *= 0.88;
    }

    // Happy hearts
    if (this.state === 'happy' && this.tick % 10 === 0) {
      this.particles.push({
        x: 180 + (Math.random() - 0.5) * 50, y: 130,
        vx: (Math.random() - 0.5) * 1, vy: -0.8 - Math.random() * 1.2,
        life: 1, size: 6 + Math.random() * 4, type: 'heart',
      });
    }

    // Talk sparkles
    if (this.state === 'talk' && this.tick % 14 === 0) {
      this.particles.push({
        x: 180 + (Math.random() - 0.5) * 30, y: 95,
        vx: (Math.random() - 0.5) * 0.8, vy: -0.4 - Math.random() * 0.8,
        life: 1, size: 2 + Math.random() * 2, type: 'sparkle',
      });
    }

    this.particles = this.particles.filter(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.016; return p.life > 0;
    });
  }

  setState(state) {
    if (this.state === state) return;
    this.state = state; this.tick = 0; this.idleTimer = 0;
    if (state === 'bounce') this.bounceY = -16;
  }

  wake() {
    if (this.state === 'sleep') {
      this.setState('alert');
      setTimeout(() => this.setState('idle'), 2000);
    }
    this.idleTimer = 0;
  }

  // ---- Gradient helpers ----

  bodyGradient(ctx, cx, cy, r) {
    const g = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#FF6B6B');    // bright highlight
    g.addColorStop(0.4, '#E53935');  // main red
    g.addColorStop(0.85, '#C62828'); // darker edge
    g.addColorStop(1, '#B71C1C');    // deepest edge
    return g;
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const cx = 180;
    const cy = 155 + this.bounceY;
    const b = this.breathOffset;

    ctx.save();
    ctx.translate(cx, cy);

    // Outer glow (subtle red ambient)
    const glowR = 80 + Math.sin(this.tick * 0.02) * 4;
    const glow = ctx.createRadialGradient(0, 8, 40, 0, 8, glowR);
    glow.addColorStop(0, 'rgba(229, 57, 53, 0.08)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(-glowR, 8 - glowR, glowR * 2, glowR * 2);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.ellipse(0, 58 - this.bounceY * 0.3, 40, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (behind body)
    this.drawLegs(ctx);

    // Body
    this.drawBody(ctx, b);

    // Heart hands
    this.drawHearts(ctx);

    // Face
    this.drawFace(ctx);

    // Antennae
    this.drawAntennae(ctx, b);

    // Particles
    this.drawParticles(ctx);

    ctx.restore();

    if (this.state === 'sleep') this.drawSleepZzz(ctx, cx, cy);
  }

  drawBody(ctx, b) {
    const squish = 1 + b * 0.003;
    const r = 46 * squish;

    // Main body with gradient
    ctx.fillStyle = this.bodyGradient(ctx, 0, 8, r);
    ctx.beginPath();
    ctx.ellipse(0, 8, r, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // Subtle rim light (top-left arc)
    ctx.strokeStyle = 'rgba(255, 200, 200, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 8, r - 1, r - 1, -Math.PI * 0.7, -Math.PI * 0.3, Math.PI * 0.2);
    ctx.stroke();
  }

  drawFace(ctx) {
    const eyeY = -4;
    const eyeSpacing = 16;
    const eyeR = 12;

    if (this.isBlinking || this.state === 'sleep') {
      // Closed eyes
      ctx.strokeStyle = '#80DEEA';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      [-eyeSpacing, eyeSpacing].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * 0.55, 0.3, Math.PI - 0.3);
        ctx.stroke();
      });
    } else {
      [-eyeSpacing, eyeSpacing].forEach(ex => {
        // Eye white
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();

        // Light blue pupil/iris (large, fills most of eye)
        const pupilR = eyeR * 0.68;
        const pg = ctx.createRadialGradient(ex, eyeY, 0, ex, eyeY, pupilR);
        pg.addColorStop(0, '#B3E5FC');     // light center
        pg.addColorStop(0.5, '#4FC3F7');   // mid blue
        pg.addColorStop(1, '#0288D1');     // edge blue
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(ex, eyeY, pupilR, 0, Math.PI * 2);
        ctx.fill();

        // Dark inner pupil dot
        ctx.fillStyle = '#0D2137';
        ctx.beginPath();
        ctx.arc(ex + 1, eyeY + 1, eyeR * 0.28, 0, Math.PI * 2);
        ctx.fill();

        // Eye glow (subtle cyan aura)
        const eg = ctx.createRadialGradient(ex, eyeY, eyeR * 0.8, ex, eyeY, eyeR * 1.5);
        eg.addColorStop(0, `rgba(79, 195, 247, ${0.12 + this.eyeGlowPhase * 0.08})`);
        eg.addColorStop(1, 'transparent');
        ctx.fillStyle = eg;
        ctx.fillRect(ex - eyeR * 1.5, eyeY - eyeR * 1.5, eyeR * 3, eyeR * 3);

        // Highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(ex + 3.5, eyeY - 3.5, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.arc(ex - 2, eyeY + 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Blush
    ctx.fillStyle = 'rgba(255, 138, 128, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-26, 8, 7, 4.5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(26, 8, 7, 4.5, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    if (this.mouthOpen > 0.5) {
      ctx.fillStyle = '#C62828';
      ctx.beginPath();
      ctx.ellipse(0, 16, 4.5, this.mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#C62828';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 13, 6, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
  }

  drawHearts(ctx) {
    const p = this.heartPulse;
    const s = 10 * p;
    this.drawHeart(ctx, -48, 4, s, -0.15);
    this.drawHeart(ctx, 48, 4, s, 0.15);
  }

  drawHeart(ctx, x, y, size, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Gradient heart
    const hg = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    hg.addColorStop(0, '#FF6B6B');
    hg.addColorStop(0.7, '#E53935');
    hg.addColorStop(1, '#C62828');
    ctx.fillStyle = hg;

    const r = size * 0.28;
    ctx.beginPath();
    ctx.arc(-r * 1.1, -r * 0.3, r, Math.PI, 0, false);
    ctx.arc(r * 1.1, -r * 0.3, r, Math.PI, 0, false);
    ctx.lineTo(0, r * 2.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawAntennae(ctx, b) {
    const swing = this.antennaSwing;

    ctx.lineCap = 'round';

    [{ x: -12, rot: -0.35 + swing, cx: -4, ex: -10 },
     { x: 12, rot: 0.35 - swing, cx: 4, ex: 10 }].forEach(a => {
      ctx.save();
      ctx.translate(a.x, -42 + b * 0.3);
      ctx.rotate(a.rot);

      // Antenna shaft with gradient
      const ag = ctx.createLinearGradient(0, 0, a.ex, -26);
      ag.addColorStop(0, '#E53935');
      ag.addColorStop(1, '#C62828');
      ctx.strokeStyle = ag;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(a.cx, -16, a.ex, -26);
      ctx.stroke();

      // Tip ball with gradient
      const tg = ctx.createRadialGradient(a.ex - 1, -27, 0, a.ex, -26, 4);
      tg.addColorStop(0, '#FF6B6B');
      tg.addColorStop(1, '#E53935');
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.arc(a.ex, -26, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  drawLegs(ctx) {
    const sw = this.legSwing;

    ctx.lineCap = 'round';

    const legs = [
      { x: -28, y: 28, angle: 0.5 + sw, len: 14 },
      { x: -36, y: 12, angle: 0.85 + sw * 0.7, len: 14 },
      { x: -28, y: -2, angle: 1.15 + sw * 0.4, len: 14 },
      { x: 28, y: 28, angle: Math.PI - 0.5 - sw, len: 14 },
      { x: 36, y: 12, angle: Math.PI - 0.85 - sw * 0.7, len: 14 },
      { x: 28, y: -2, angle: Math.PI - 1.15 - sw * 0.4, len: 14 },
    ];

    legs.forEach(leg => {
      const ex = leg.x + Math.cos(leg.angle) * leg.len;
      const ey = leg.y + Math.sin(leg.angle) * leg.len;

      const lg = ctx.createLinearGradient(leg.x, leg.y, ex, ey);
      lg.addColorStop(0, '#E53935');
      lg.addColorStop(1, '#C62828');
      ctx.strokeStyle = lg;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(leg.x, leg.y);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    });
  }

  drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      if (p.type === 'heart') {
        this.drawHeart(ctx, p.x - 180, p.y - 155, p.size, 0);
      } else {
        ctx.fillStyle = '#4FC3F7';
        ctx.beginPath();
        ctx.arc(p.x - 180, p.y - 155, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  drawSleepZzz(ctx, cx, cy) {
    const t = this.tick * 0.02;
    for (let i = 0; i < 3; i++) {
      const x = cx + 38 + i * 10 + Math.sin(t + i) * 3;
      const baseY = cy - 45 - i * 16;
      const y = baseY - ((this.tick * 0.2 + i * 25) % 50);
      const size = 10 + i * 3;
      const alpha = Math.max(0, 1 - ((this.tick * 0.2 + i * 25) % 50) / 50);
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = '#4FC3F7';
      ctx.font = `bold ${size}px sans-serif`;
      ctx.fillText('z', x, y);
    }
    ctx.globalAlpha = 1;
  }
}
