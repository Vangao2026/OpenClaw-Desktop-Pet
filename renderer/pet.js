/**
 * Claw Pet - Lobster Animation Engine (v4 - SVG-Accurate)
 * Uses exact SVG paths from openclaw.ai homepage, converted to Canvas.
 * Body: M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110...
 * Claws: M20 45 C5 40 0 50 5 60... / M100 45 C115 40 120 50 115 60...
 * Eyes: circles at (45,35) r=6 and (75,35) r=6, cyan dots at (46,34) r=2
 * Antennae: M45 15 Q35 5 30 8 / M75 15 Q85 5 90 8
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

    // Scale: SVG is 120x120, we draw at 2.2x centered
    this.scale = 2.2;
    this.offsetX = 180 - 60 * this.scale; // center horizontally
    this.offsetY = 155 - 55 * this.scale; // center vertically

    this.startLoop();
  }

  startLoop() {
    const loop = () => { this.update(); this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  update() {
    this.tick++;
    this.breathOffset = Math.sin(this.tick * 0.03) * 1.5;
    this.antennaSwing = Math.sin(this.tick * 0.035) * 0.12;
    this.clawSwing = Math.sin(this.tick * 0.04) * 0.06;
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
      this.mouthOpen = 2 + Math.sin(this.tick * 0.35) * 2;
    } else {
      this.mouthOpen *= 0.88;
    }

    if (this.state === 'happy' && this.tick % 10 === 0) {
      this.particles.push({
        x: 180 + (Math.random() - 0.5) * 50, y: 130,
        vx: (Math.random() - 0.5) * 1, vy: -0.8 - Math.random() * 1.2,
        life: 1, size: 3 + Math.random() * 3, type: 'sparkle',
      });
    }
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

  // ---- SVG Path helpers ----

  // Convert SVG path to Canvas, with optional transform
  svgBodyPath(ctx) {
    // M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100
    // C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55
    // C105 35 90 10 60 10Z
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

  svgLeftClawPath(ctx) {
    // M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z
    ctx.moveTo(20, 45);
    ctx.bezierCurveTo(5, 40, 0, 50, 5, 60);
    ctx.bezierCurveTo(10, 70, 20, 65, 25, 55);
    ctx.bezierCurveTo(28, 48, 25, 45, 20, 45);
    ctx.closePath();
  }

  svgRightClawPath(ctx) {
    // M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z
    ctx.moveTo(100, 45);
    ctx.bezierCurveTo(115, 40, 120, 50, 115, 60);
    ctx.bezierCurveTo(110, 70, 100, 65, 95, 55);
    ctx.bezierCurveTo(92, 48, 95, 45, 100, 45);
    ctx.closePath();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const s = this.scale;
    const ox = this.offsetX;
    const oy = this.offsetY + this.bounceY;
    const b = this.breathOffset;

    ctx.save();

    // Outer glow
    const glowR = 140 + Math.sin(this.tick * 0.02) * 6;
    const glow = ctx.createRadialGradient(180, 160, 50, 180, 160, glowR);
    glow.addColorStop(0, 'rgba(255, 107, 107, 0.06)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 360, 300);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.beginPath();
    ctx.ellipse(180, oy + 120 * s, 50, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- Draw with SVG gradient ----
    const grad = ctx.createLinearGradient(ox, oy, ox + 120 * s, oy + 120 * s);
    grad.addColorStop(0, '#FF6B6B');
    grad.addColorStop(1, '#E53935');

    // Claws (behind body)
    ctx.save();
    ctx.translate(ox, oy + b * 0.3);
    ctx.scale(s, s);

    // Apply claw swing rotation around their attachment points
    ctx.save();
    ctx.translate(20, 45);
    ctx.rotate(-this.clawSwing);
    ctx.translate(-20, -45);
    ctx.fillStyle = grad;
    ctx.beginPath();
    this.svgLeftClawPath(ctx);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(100, 45);
    ctx.rotate(this.clawSwing);
    ctx.translate(-100, -45);
    ctx.fillStyle = grad;
    ctx.beginPath();
    this.svgRightClawPath(ctx);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = grad;
    ctx.beginPath();
    this.svgBodyPath(ctx);
    ctx.fill();

    // Subtle body shine
    const shine = ctx.createRadialGradient(50, 35, 0, 60, 55, 55);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    shine.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
    shine.addColorStop(1, 'transparent');
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.ellipse(60, 55, 45, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    // Antennae (SVG: M45 15 Q35 5 30 8 / M75 15 Q85 5 90 8)
    const coralColor = '#FF6B6B';
    ctx.strokeStyle = coralColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Left antenna with swing
    ctx.save();
    ctx.translate(45, 15);
    ctx.rotate(-0.1 + this.antennaSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(35 - 45, 5 - 15, 30 - 45, 8 - 15);
    ctx.stroke();
    ctx.restore();

    // Right antenna with swing
    ctx.save();
    ctx.translate(75, 15);
    ctx.rotate(0.1 - this.antennaSwing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(85 - 75, 5 - 15, 90 - 75, 8 - 15);
    ctx.stroke();
    ctx.restore();

    // Eyes (SVG: cx=45 cy=35 r=6, cx=75 cy=35 r=6)
    if (this.isBlinking || this.state === 'sleep') {
      // Closed eyes
      ctx.strokeStyle = '#050810';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      [45, 75].forEach(ex => {
        ctx.beginPath();
        ctx.arc(ex, 35, 4, 0.3, Math.PI - 0.3);
        ctx.stroke();
      });
    } else {
      [45, 75].forEach(ex => {
        // Eye fill (black)
        ctx.fillStyle = '#050810';
        ctx.beginPath();
        ctx.arc(ex, 35, 6, 0, Math.PI * 2);
        ctx.fill();

        // Cyan glow dot (SVG: cx+1, cy-1, r=2)
        const glowR2 = 2 + this.eyeGlowPhase * 0.5;
        ctx.fillStyle = '#00E5CC';
        ctx.beginPath();
        ctx.arc(ex + 1, 34, glowR2, 0, Math.PI * 2);
        ctx.fill();

        // Glow aura
        const eg = ctx.createRadialGradient(ex + 1, 34, 0, ex + 1, 34, 10);
        eg.addColorStop(0, `rgba(0, 229, 204, ${0.15 + this.eyeGlowPhase * 0.1})`);
        eg.addColorStop(1, 'transparent');
        ctx.fillStyle = eg;
        ctx.fillRect(ex - 10, 24, 22, 22);
      });
    }

    ctx.restore();

    // Particles (draw in screen space)
    this.drawParticles(ctx);

    ctx.restore();

    if (this.state === 'sleep') this.drawSleepZzz(ctx, 180, 155);
  }

  drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.type === 'sparkle' ? '#00E5CC' : '#FF6B6B';
      ctx.beginPath();
      ctx.arc(p.x - 180, p.y - 155, p.size, 0, Math.PI * 2);
      ctx.fill();
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
