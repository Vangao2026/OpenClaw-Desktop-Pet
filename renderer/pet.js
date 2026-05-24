/**
 * Claw Pet - Lobster Animation Engine (OpenClaw Style)
 * Matches openclaw.ai mascot: rounded body, side claws, antennae,
 * black eyes with cyan glow dots, coral gradient.
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

    this.startLoop();
  }

  startLoop() {
    const loop = () => { this.update(); this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  update() {
    this.tick++;
    this.breathOffset = Math.sin(this.tick * 0.03) * 2;
    this.antennaSwing = Math.sin(this.tick * 0.035) * 0.15;
    this.clawSwing = Math.sin(this.tick * 0.04) * 0.08;
    this.eyeGlowPhase = (Math.sin(this.tick * 0.05) + 1) * 0.5;

    this.blinkTimer++;
    if (!this.isBlinking && this.blinkTimer > 200 + Math.random() * 160) {
      this.isBlinking = true; this.blinkTimer = 0;
    }
    if (this.isBlinking && this.blinkTimer > 8) {
      this.isBlinking = false; this.blinkTimer = 0;
    }

    if (this.state === 'idle') {
      this.idleTimer++;
      if (this.idleTimer > 600) this.setState('sleep');
    } else {
      this.idleTimer = 0;
    }

    if (this.bounceY < 0) { this.bounceY *= 0.88; if (this.bounceY > -0.5) this.bounceY = 0; }

    if (this.state === 'talk') {
      this.mouthOpen = 3 + Math.sin(this.tick * 0.35) * 2.5;
    } else {
      this.mouthOpen *= 0.88;
    }

    // Happy sparkles
    if (this.state === 'happy' && this.tick % 10 === 0) {
      this.particles.push({
        x: 180 + (Math.random() - 0.5) * 50, y: 130,
        vx: (Math.random() - 0.5) * 1, vy: -0.8 - Math.random() * 1.2,
        life: 1, size: 3 + Math.random() * 3, type: 'sparkle',
      });
    }

    // Talk sparkles
    if (this.state === 'talk' && this.tick % 14 === 0) {
      this.particles.push({
        x: 180 + (Math.random() - 0.5) * 30, y: 95,
        vx: (Math.random() - 0.5) * 0.8, vy: -0.4 - Math.random() * 0.8,
        life: 1, size: 2 + Math.random() * 2, type: 'dot',
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
  bodyGradient(ctx, x1, y1, x2, y2) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, '#FF6B6B');
    g.addColorStop(1, '#E53935');
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

    // Outer glow
    const glowR = 85 + Math.sin(this.tick * 0.02) * 4;
    const glow = ctx.createRadialGradient(0, 5, 40, 0, 5, glowR);
    glow.addColorStop(0, 'rgba(255, 107, 107, 0.08)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(-glowR, 5 - glowR, glowR * 2, glowR * 2);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.ellipse(0, 65 - this.bounceY * 0.3, 38, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Claws (behind body)
    this.drawClaws(ctx, b);

    // Body
    this.drawBody(ctx, b);

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

    // Main body - rounded dome shape (like the SVG)
    const bodyGrad = this.bodyGradient(ctx, -50, -50, 50, 60);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    // Top dome
    ctx.moveTo(0, -55);
    ctx.bezierCurveTo(45, -55, 55, -15, 50, 20);
    ctx.bezierCurveTo(48, 45, 30, 60, 0, 62);
    ctx.bezierCurveTo(-30, 60, -48, 45, -50, 20);
    ctx.bezierCurveTo(-55, -15, -45, -55, 0, -55);
    ctx.closePath();
    ctx.fill();

    // Body shine
    const shine = ctx.createRadialGradient(-15, -25, 0, 0, 0, 50);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.04)');
    shine.addColorStop(1, 'transparent');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.ellipse(0, 0, 48, 55, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawClaws(ctx, b) {
    const sw = this.clawSwing;

    // Left claw
    ctx.save();
    ctx.translate(-45, 10 + b * 0.3);
    ctx.rotate(-0.15 + sw);

    const clawGrad = this.bodyGradient(ctx, -25, -15, 5, 15);
    ctx.fillStyle = clawGrad;

    // Claw arm
    ctx.beginPath();
    ctx.ellipse(-12, 0, 14, 10, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Claw pincer top
    ctx.beginPath();
    ctx.moveTo(-20, -5);
    ctx.quadraticCurveTo(-32, -18, -22, -22);
    ctx.quadraticCurveTo(-14, -18, -14, -8);
    ctx.closePath();
    ctx.fill();

    // Claw pincer bottom
    ctx.beginPath();
    ctx.moveTo(-20, 5);
    ctx.quadraticCurveTo(-32, 18, -22, 22);
    ctx.quadraticCurveTo(-14, 18, -14, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Right claw
    ctx.save();
    ctx.translate(45, 10 + b * 0.3);
    ctx.rotate(0.15 - sw);

    ctx.fillStyle = clawGrad;

    ctx.beginPath();
    ctx.ellipse(12, 0, 14, 10, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(20, -5);
    ctx.quadraticCurveTo(32, -18, 22, -22);
    ctx.quadraticCurveTo(14, -18, 14, -8);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(20, 5);
    ctx.quadraticCurveTo(32, 18, 22, 22);
    ctx.quadraticCurveTo(14, 18, 14, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawFace(ctx) {
    const eyeY = -15;
    const eyeSpacing = 18;
    const eyeR = 8;

    if (this.isBlinking || this.state === 'sleep') {
      // Closed eyes - cute arcs
      ctx.strokeStyle = '#050810';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      [-eyeSpacing, eyeSpacing].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * 0.6, 0.3, Math.PI - 0.3);
        ctx.stroke();
      });
    } else {
      [-eyeSpacing, eyeSpacing].forEach(ex => {
        // Eye (black, like the SVG)
        ctx.fillStyle = '#050810';
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
        ctx.fill();

        // Cyan glow dot (like the SVG: cx+1, cy-1, r=2)
        ctx.fillStyle = '#00E5CC';
        const glowSize = 2.5 + this.eyeGlowPhase * 0.5;
        ctx.beginPath();
        ctx.arc(ex + 2, eyeY - 2, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Glow aura
        const eg = ctx.createRadialGradient(ex + 2, eyeY - 2, 0, ex + 2, eyeY - 2, 8);
        eg.addColorStop(0, `rgba(0, 229, 204, ${0.2 + this.eyeGlowPhase * 0.1})`);
        eg.addColorStop(1, 'transparent');
        ctx.fillStyle = eg;
        ctx.fillRect(ex - 8, eyeY - 10, 20, 20);

        // Small white highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(ex + 3, eyeY - 3, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Mouth
    if (this.mouthOpen > 0.5) {
      ctx.fillStyle = '#C62828';
      ctx.beginPath();
      ctx.ellipse(0, 8, 4, this.mouthOpen, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#C62828';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 5, 5, 0.15, Math.PI - 0.15);
      ctx.stroke();
    }
  }

  drawAntennae(ctx, b) {
    const sw = this.antennaSwing;

    ctx.lineCap = 'round';

    // Left antenna (like SVG: M45 15 Q35 5 30 8)
    ctx.save();
    ctx.translate(-18, -50 + b * 0.3);
    ctx.rotate(-0.4 + sw);

    const ag = ctx.createLinearGradient(0, 0, -15, -25);
    ag.addColorStop(0, '#FF6B6B');
    ag.addColorStop(1, '#E53935');
    ctx.strokeStyle = ag;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-8, -15, -15, -22);
    ctx.stroke();

    // Tip
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(-15, -22, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right antenna (like SVG: M75 15 Q85 5 90 8)
    ctx.save();
    ctx.translate(18, -50 + b * 0.3);
    ctx.rotate(0.4 - sw);

    ctx.strokeStyle = ag;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(8, -15, 15, -22);
    ctx.stroke();

    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(15, -22, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      if (p.type === 'sparkle') {
        ctx.fillStyle = '#00E5CC';
        ctx.beginPath();
        ctx.arc(p.x - 180, p.y - 155, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#FF6B6B';
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
      const x = cx + 42 + i * 10 + Math.sin(t + i) * 3;
      const baseY = cy - 50 - i * 16;
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
