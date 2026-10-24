import Phaser from 'phaser';
import { DEPTH } from '../config.js';
import { sfx } from '../sfx.js';

class Bat {
  constructor(scene, area) {
    this.scene = scene;
    this.area = area;
    this.x = Phaser.Math.Between(area.x0, area.x1);
    this.y = Phaser.Math.Between(area.y0, area.y1);
    this.vx = 0;
    this.vy = 0;
    this.flee = 0;
    this.pickTarget();
    this.sprite = scene.add.sprite(this.x, this.y, 'bat0').setDepth(DEPTH.props);
    this.sprite.play({ key: 'bat-flap', startFrame: Phaser.Math.Between(0, 1) });
    this.sprite.anims.timeScale = 0.8 + Math.random() * 0.6;
  }

  pickTarget() {
    const a = this.area;
    this.tx = Phaser.Math.Between(a.x0, a.x1);
    this.ty = Phaser.Math.Between(a.y0, a.y1);
  }

  scatter(gx, gy) {
    const dx = this.x - gx, dy = this.y - gy;
    const d = Math.hypot(dx, dy) || 1;
    this.vx = (dx / d) * 150;
    this.vy = (dy / d) * 150 - 30;
    this.flee = 1.2;
    this.tx = this.x + (dx / d) * 160;
    this.ty = this.y - 60;
  }

  update(dt, ghost) {
    const gd = Phaser.Math.Distance.Between(this.x, this.y, ghost.x, ghost.y);
    if (gd < 38 && this.flee <= 0) { this.scatter(ghost.x, ghost.y); if (Math.random() < 0.3) sfx.squeak(); }
    if (this.flee > 0) {
      this.flee -= dt;
      if (this.flee <= 0) this.pickTarget();
    } else {
      const dx = this.tx - this.x, dy = this.ty - this.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 8) this.pickTarget();
      const speed = 45;
      this.vx += ((dx / d) * speed - this.vx) * Math.min(1, dt * 1.5);
      this.vy += ((dy / d) * speed - this.vy) * Math.min(1, dt * 1.5);
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt + Math.sin(this.scene.time.now / 120 + this.tx) * 0.3;
    this.y = Phaser.Math.Clamp(this.y, this.area.y0 - 10, this.area.y1 + 30);
    this.sprite.setPosition(Math.round(this.x), Math.round(this.y));
    this.sprite.setFlipX(this.vx < 0);
  }
}

export class Bats {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
  }

  add(n, area) {
    for (let i = 0; i < n; i++) this.list.push(new Bat(this.scene, area));
  }

  scatterNear(x, y, r) {
    for (const b of this.list) if (Phaser.Math.Distance.Between(x, y, b.x, b.y) < r) b.scatter(x, y);
  }

  update(dt, ghost) {
    for (const b of this.list) b.update(dt, ghost);
  }
}
