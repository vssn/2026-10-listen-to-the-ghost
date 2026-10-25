import Phaser from 'phaser';
import { DEPTH, FONT } from '../config.js';
import { DOGS } from '../textures/characters.js';
import { sfx } from '../sfx.js';

const BARK_RANGE = 70;
const REAPPEAR_DELAY = 2.6;

// A house dog: it barks at the ghost instead of running away – until it hears a BUH!
export class Dog {
  constructor(scene, kind, floorY, minX, maxX, spots) {
    this.scene = scene;
    this.kind = kind;
    this.floorY = floorY;
    this.minX = minX;
    this.maxX = maxX;
    this.spots = spots;
    this.x = Phaser.Math.Between(minX, maxX);
    this.target = this.x;
    this.state = 'idle';
    this.wait = Math.random() * 2;
    this.barkTimer = 0;
    this.sprite = scene.add.sprite(this.x, floorY, `dog_${kind}_0`).setOrigin(0.5, 1).setDepth(DEPTH.resident);
    // when hiding, only the trembling tail sticks out
    this.tail = scene.add.image(0, 0, 'px').setTint(Phaser.Display.Color.HexStringToColor(DOGS[kind][0]).color)
      .setScale(3, 2).setDepth(DEPTH.spot + 0.6).setVisible(false);
  }

  ghostNear(g) {
    return Math.abs(g.x - this.x) < BARK_RANGE && Math.abs(this.floorY - 8 - g.y) < 30;
  }

  scare() {
    if (this.state !== 'idle' && this.state !== 'bark') return false;
    this.spot = this.spots.length
      ? this.spots.reduce((a, b) => (Math.abs(a.cx - this.x) < Math.abs(b.cx - this.x) ? a : b))
      : null;
    this.state = 'flee';
    sfx.yelp();
    this.sprite.play(`dog-walk-${this.kind}`);
    this.sprite.anims.timeScale = 2.5;
    this.float('Jauul!', '#cfe8ff');
    return true;
  }

  float(text, color) {
    const s = this.scene;
    const t = s.add.text(this.x, this.floorY - 14, text, {
      fontFamily: FONT, fontSize: '8px', color, stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(DEPTH.resident + 0.5);
    s.tweens.add({ targets: t, y: t.y - 8, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  update(dt, ghost, ghostAway) {
    const sp = this.sprite;
    switch (this.state) {
      case 'idle': {
        if (this.ghostNear(ghost)) { this.state = 'bark'; this.barkTimer = 0; this.calm = 0; break; }
        if (this.wait > 0) {
          this.wait -= dt;
          if (sp.anims.isPlaying) { sp.anims.stop(); sp.setTexture(`dog_${this.kind}_0`); }
          if (this.wait <= 0) this.target = Phaser.Math.Between(this.minX, this.maxX);
          break;
        }
        const dx = this.target - this.x;
        if (Math.abs(dx) < 1) { this.wait = 1 + Math.random() * 3; break; }
        this.x += Math.sign(dx) * Math.min(Math.abs(dx), 20 * dt);
        sp.setFlipX(dx < 0);
        if (!sp.anims.isPlaying) { sp.play(`dog-walk-${this.kind}`); sp.anims.timeScale = 1; }
        break;
      }
      case 'bark': {
        sp.setFlipX(ghost.x < this.x);
        if (sp.anims.currentAnim?.key !== `dog-bark-${this.kind}`) sp.play(`dog-bark-${this.kind}`);
        sp.y = this.floorY - (Math.floor(this.scene.time.now / 120) % 2);
        this.barkTimer -= dt;
        if (this.barkTimer <= 0) {
          this.barkTimer = 0.65;
          sfx.bark();
          this.float('Wuff!', '#ffe14d');
        }
        this.calm = this.ghostNear(ghost) ? 0 : this.calm + dt;
        if (this.calm > 1) { this.state = 'idle'; sp.y = this.floorY; this.wait = 0.5; }
        break;
      }
      case 'flee': {
        const tx = this.spot ? this.spot.cx : this.x;
        const dx = tx - this.x;
        this.x += Math.sign(dx) * Math.min(Math.abs(dx), 95 * dt);
        sp.setFlipX(dx < 0);
        sp.y = this.floorY;
        if (Math.abs(dx) < 1) {
          this.state = 'hidden';
          this.hiddenFor = 0;
          sp.setVisible(false).anims.stop();
          if (this.spot) {
            const side = this.spot.x + this.spot.w + 1;
            this.tail.setPosition(side, this.floorY - 4).setVisible(true);
            this.shake = this.scene.tweens.add({ targets: this.tail, y: this.floorY - 5, duration: 70, yoyo: true, repeat: -1 });
          }
        }
        break;
      }
      case 'hidden': {
        this.hiddenFor += dt;
        if (ghostAway > REAPPEAR_DELAY && this.hiddenFor > 1.5) {
          this.shake?.stop();
          this.tail.setVisible(false);
          this.state = 'idle';
          this.wait = 0.8;
          sp.setVisible(true).setTexture(`dog_${this.kind}_0`);
          sp.anims.timeScale = 1;
        }
        break;
      }
      default:
        break;
    }
    sp.x = Math.round(this.x);
  }
}
