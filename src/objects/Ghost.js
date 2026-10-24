import Phaser from 'phaser';
import { DEPTH, FONT } from '../config.js';
import { GHOST_WAND } from '../textures/characters.js';
import { sfx } from '../sfx.js';

const ACCEL = 620;
const MAX_SPEED = 115;

export class Ghost {
  constructor(scene, x, y, bounds) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.bounds = bounds;
    this.t = 0;
    this.locked = false;
    this.booCooldown = 0;
    this.invuln = 0;
    this.facing = 1;
    this.bobY = 0;
    this.clamp = true;

    this.glow = scene.add.image(x, y, 'glow').setTint(0xff9a3c).setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.55).setScale(1.3).setDepth(DEPTH.glow);
    this.sprite = scene.add.sprite(x, y, 'ghost0').setDepth(DEPTH.ghost);
    this.sprite.play('ghost-float');

    this.sparkler = scene.add.particles(0, 0, 'spark', {
      speed: { min: 8, max: 34 },
      angle: { min: 0, max: 360 },
      lifespan: { min: 180, max: 420 },
      scale: { start: 1, end: 0 },
      gravityY: 30,
      frequency: 45,
      quantity: 2,
      tint: [0xffe066, 0xffb020, 0xffffff, 0xff7a1a],
      blendMode: 'ADD',
    }).setDepth(DEPTH.fx);
    this.tipGlow = scene.add.image(x, y, 'glow').setTint(0xffc040).setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.6).setScale(0.3).setDepth(DEPTH.fx);

    const kb = scene.input.keyboard;
    this.keys = kb.addKeys({
      up: 'UP', down: 'DOWN', left: 'LEFT', right: 'RIGHT',
      w: 'W', a: 'A', s: 'S', d: 'D',
    });
    scene.input.mouse?.disableContextMenu();
    scene.input.on('pointerdown', (p) => { if (p.rightButtonDown() && !this.locked) this.boo(); });
    kb.on('keydown-SPACE', () => { if (!this.locked) this.boo(); });
  }

  get wandTip() {
    return { x: this.x + GHOST_WAND.x * this.facing, y: this.y + this.bobY + GHOST_WAND.y - 1 };
  }

  setVisible(v) {
    this.sprite.setVisible(v);
    this.glow.setVisible(v);
    this.tipGlow.setVisible(v);
    this.sparkler.emitting = v;
  }

  update(dt) {
    this.t += dt;
    this.booCooldown -= dt;
    const k = this.keys;
    let ax = 0, ay = 0;
    if (!this.locked) {
      if (k.left.isDown || k.a.isDown) ax -= 1;
      if (k.right.isDown || k.d.isDown) ax += 1;
      if (k.up.isDown || k.w.isDown) ay -= 1;
      if (k.down.isDown || k.s.isDown) ay += 1;
      const p = this.scene.input.activePointer;
      if (p.isDown && p.leftButtonDown() && ax === 0 && ay === 0) {
        const wp = p.positionToCamera(this.scene.cameras.main);
        const dx = wp.x - this.x, dy = wp.y - this.y;
        const d = Math.hypot(dx, dy);
        if (d > 6) { ax = dx / d; ay = dy / d; }
      }
    }
    const len = Math.hypot(ax, ay);
    if (len > 0) { ax /= len; ay /= len; }
    this.vx += ax * ACCEL * dt;
    this.vy += ay * ACCEL * dt;
    const damp = Math.pow(0.03, dt);
    if (ax === 0) this.vx *= damp;
    if (ay === 0) this.vy *= damp;
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > MAX_SPEED) { this.vx *= MAX_SPEED / sp; this.vy *= MAX_SPEED / sp; }

    const ox = this.x, oy = this.y;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.clamp) {
      this.clampToBounds(this.bounds);
      // Optional scene rule for where the ghost may be (e.g. underground only in cellars).
      if (this.constrain) {
        const [cx, cy] = this.constrain(this.x, this.y, ox, oy, dt);
        if (cx === ox && this.x !== ox) this.vx = 0;
        if (cy === oy && this.y !== oy) this.vy = 0;
        this.x = cx;
        this.y = cy;
      }
    }

    if (this.vx < -8) this.facing = -1;
    else if (this.vx > 8) this.facing = 1;
    this.sprite.setFlipX(this.facing < 0);

    this.bobY = Math.round(Math.sin(this.t * 3.2) * 1.6);
    this.sprite.setPosition(Math.round(this.x), Math.round(this.y + this.bobY));
    this.glow.setPosition(this.x, this.y + this.bobY);
    this.glow.setAlpha(0.5 + Math.sin(this.t * 7) * 0.05);
    const tip = this.wandTip;
    this.sparkler.setPosition(tip.x, tip.y);
    this.tipGlow.setPosition(tip.x, tip.y).setAlpha(0.45 + Math.random() * 0.3);

    if (this.invuln > 0) {
      this.invuln -= dt;
      this.sprite.setAlpha(Math.floor(this.invuln * 14) % 2 ? 0.25 : 1);
      if (this.invuln <= 0) { this.sprite.setAlpha(1); this.sprite.clearTint(); }
    }
  }

  clampToBounds(b) {
    if (this.x < b.minX) { this.x = b.minX; this.vx = 0; }
    if (this.x > b.maxX) { this.x = b.maxX; this.vx = 0; }
    if (this.y < b.minY) { this.y = b.minY; this.vy = 0; }
    if (this.y > b.maxY) { this.y = b.maxY; this.vy = 0; }
  }

  boo() {
    if (this.booCooldown > 0) return false;
    this.booCooldown = 0.6;
    sfx.boo();
    const s = this.scene;
    const ring = s.add.image(this.x, this.y, 'ring').setTint(0xffb050).setDepth(DEPTH.fx).setScale(0.3).setAlpha(0.9);
    s.tweens.add({ targets: ring, scale: 3.2, alpha: 0, duration: 450, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    const t = s.add.text(this.x, this.y - 22, 'BUH!', {
      fontFamily: FONT, fontSize: '8px', color: '#ffd27a', stroke: '#3a1500', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH.text);
    s.tweens.add({ targets: t, y: t.y - 12, alpha: 0, duration: 800, ease: 'Sine.easeOut', onComplete: () => t.destroy() });
    s.tweens.add({ targets: this.sprite, scaleX: 1.25, scaleY: 1.25, duration: 90, yoyo: true });
    s.events.emit('ghost-boo', this.x, this.y);
    return true;
  }

  hurt(fromX) {
    if (this.invuln > 0) return false;
    this.invuln = 1.4;
    sfx.hurt();
    this.sprite.setTint(0xff6a8a);
    const dir = this.x < fromX ? -1 : 1;
    this.vx = dir * 160;
    this.vy = -40;
    this.scene.cameras.main.shake(180, 0.01);
    return true;
  }

  destroy() {
    this.sprite.destroy();
    this.glow.destroy();
    this.tipGlow.destroy();
    this.sparkler.destroy();
  }
}
