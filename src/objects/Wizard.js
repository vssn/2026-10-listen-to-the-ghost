import Phaser from 'phaser';
import { FLOOR, FONT } from '../config.js';
import { WIZ_TIP } from '../textures/characters.js';
import { sfx } from '../sfx.js';

const ADD = Phaser.BlendModes.ADD;
export const WIZ_SPOTS = [96, 128, 180, 246, 298, 330];

const PATTERNS = {
  3: ['bolt', 'spread', 'bolt'],
  2: ['bolt', 'spread', 'stream'],
  1: ['spread', 'stream', 'ring', 'stream'],
};

// The two opponents share all the fight logic; the apprentice is a bit slower.
const KINDS = {
  wizard: {
    tex: 'wiz', aura: 0x8a3fff, tip: 0xff60ff, sparks: [0xff8cf0, 0xc86bff, 0xffffff], speed: 1, bubble: 'wizard',
    hurt: ['Grrr! Das wirst du bereuen!', 'Jetzt werde ich richtig wütend!'], last: 'NEEEIN!',
  },
  apprentice: {
    tex: 'appr', aura: 0x2fc0a0, tip: 0x7affd0, sparks: [0x7affd0, 0x2fc0a0, 0xffffff], speed: 0.85, bubble: 'apprentice',
    hurt: ['Autsch! Meister, hilf mir!', 'Das steht so nicht im Zauberbuch!'], last: 'Ich kündige!',
  },
};

export class Wizard {
  constructor(scene, x, kind = 'wizard') {
    this.scene = scene;
    this.x = x;
    this.kind = kind;
    this.look = KINDS[kind];
    this.maxHp = 3;
    this.hp = 3;
    this.state = 'intro';
    this.timer = 0;
    this.attacks = 0;
    this.pose = 'idle';

    const L = this.look;
    this.aura = scene.add.image(x, FLOOR - 24, 'glow').setTint(L.aura).setBlendMode(ADD)
      .setScale(1.3).setAlpha(0.35).setDepth(7.9);
    this.sprite = scene.add.image(x, FLOOR, `${L.tex}_idle`).setOrigin(0.5, 1).setDepth(8);
    this.tipGlow = scene.add.image(x, FLOOR, 'glow').setTint(L.tip).setBlendMode(ADD)
      .setScale(0.25).setAlpha(0.7).setDepth(9);
    this.charge = scene.add.particles(0, 0, 'spark', {
      speed: { min: 10, max: 35 }, lifespan: 320, scale: { start: 1, end: 0 },
      tint: L.sparks, blendMode: 'ADD', frequency: 25, quantity: 2, emitting: false,
    }).setDepth(9);
  }

  get ghost() { return this.scene.ghost; }
  get facing() { return this.ghost.x < this.x ? -1 : 1; }
  get rage() { return (1 + (this.maxHp - this.hp) * 0.3) * this.look.speed; }
  get vulnerable() { return ['idle', 'charge', 'recover'].includes(this.state); }

  tip() {
    const t = WIZ_TIP[this.pose === 'cast' ? 'cast' : 'idle'];
    return { x: this.x + t.x * this.facing, y: FLOOR + t.y };
  }

  setPose(p) {
    this.pose = p;
    this.sprite.setTexture(`${this.look.tex}_${p}`);
  }

  say(text, color, ms = 1400) {
    this.scene.bubbles.say(this.kind, () => ({ x: this.x, y: FLOOR - 50 }), text, { style: this.look.bubble, color, ms, interrupt: true });
  }

  start() {
    this.state = 'idle';
    this.timer = 0.8;
  }

  update(dt) {
    if (this.state !== 'dead' && this.state !== 'hurt') this.sprite.setFlipX(this.facing < 0);
    this.aura.setPosition(this.x, FLOOR - 24).setVisible(this.sprite.alpha > 0.5 && this.state !== 'dead');
    const tip = this.tip();
    this.tipGlow.setPosition(tip.x, tip.y);
    this.charge.setPosition(tip.x, tip.y);
    this.tipGlow.setVisible(this.state !== 'dead' && this.state !== 'hurt' && this.sprite.alpha > 0.5);

    this.timer -= dt;
    switch (this.state) {
      case 'idle':
        this.tipGlow.setScale(0.25);
        if (this.timer <= 0) this.beginCharge();
        break;
      case 'charge':
        this.tipGlow.setScale(0.25 + (1 - Math.max(0, this.timer) / this.chargeTime) * 0.7);
        if (this.timer <= 0) this.fire();
        break;
      case 'recover':
        if (this.timer <= 0) {
          this.attacks++;
          this.setPose('idle');
          if (this.attacks >= (this.hp === 1 ? 1 : 2)) this.teleport();
          else { this.state = 'idle'; this.timer = 0.9 / this.rage; }
        }
        break;
      default:
        break;
    }
  }

  beginCharge() {
    this.state = 'charge';
    this.chargeTime = 0.7 / this.rage;
    this.timer = this.chargeTime;
    this.setPose('cast');
    this.charge.emitting = true;
    sfx.charge();
  }

  aim(spread = 0) {
    const tip = this.tip();
    const a = Phaser.Math.Angle.Between(tip.x, tip.y, this.ghost.x, this.ghost.y) + spread;
    return { tip, a };
  }

  fire() {
    this.charge.emitting = false;
    const list = PATTERNS[this.hp] || PATTERNS[1];
    const pattern = list[Math.floor(Math.random() * list.length)];
    const s = this.scene;
    const r = this.rage;
    let recover = 0.8;
    const shoot = (a, speed, big, tip) => s.spawnSpark(tip.x, tip.y, Math.cos(a) * speed, Math.sin(a) * speed, big, this.look.sparks[0]);
    switch (pattern) {
      case 'bolt': {
        const { tip, a } = this.aim();
        shoot(a, 150 * r, true, tip);
        sfx.zap();
        break;
      }
      case 'spread': {
        const { tip, a } = this.aim();
        for (const d of [-0.3, 0, 0.3]) shoot(a + d, 125 * r, d === 0, tip);
        sfx.zap();
        break;
      }
      case 'stream': {
        recover = 1.4;
        for (let i = 0; i < 8; i++) {
          s.time.delayedCall(i * 110, () => {
            if (this.state !== 'recover') return;
            const { tip, a } = this.aim((Math.random() - 0.5) * 0.25);
            shoot(a, 165 * r, false, tip);
            sfx.fizzle();
          });
        }
        sfx.zap();
        break;
      }
      case 'ring': {
        recover = 1.1;
        const { tip } = this.aim();
        for (let i = 0; i <= 10; i++) shoot(Math.PI + (i / 10) * Math.PI, 95 * r, i % 5 === 0, tip);
        sfx.zap();
        break;
      }
      default:
        break;
    }
    this.state = 'recover';
    this.timer = recover / Math.sqrt(r);
  }

  teleport(first = false) {
    this.state = 'teleport';
    this.attacks = 0;
    this.charge.emitting = false;
    const s = this.scene;
    sfx.poof();
    s.poof(this.x, FLOOR - 22);
    s.tweens.add({
      targets: this.sprite, alpha: 0, scaleX: 0.2, duration: 200,
      onComplete: () => {
        this.x = s.pickWizardSpot(this.x);
        this.sprite.setX(this.x);
        s.poof(this.x, FLOOR - 22);
        s.tweens.add({
          targets: this.sprite, alpha: 1, scaleX: 1, duration: 200,
          onComplete: () => {
            if (this.state !== 'teleport') return;
            this.state = 'idle';
            this.timer = (first ? 1.2 : 0.7) / this.rage;
          },
        });
      },
    });
  }

  // BUH! right next to the wizard interrupts a spell.
  startle() {
    if (this.state !== 'charge') return;
    this.charge.emitting = false;
    this.state = 'idle';
    this.timer = 1.1;
    this.setPose('idle');
    this.say('Huch!', undefined, 700);
    this.scene.tweens.add({ targets: this.sprite, y: FLOOR - 6, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
  }

  hit() {
    if (!this.vulnerable) return false;
    this.hp--;
    this.state = 'hurt';
    this.charge.emitting = false;
    this.setPose('hurt');
    const s = this.scene;
    sfx.bonk();
    s.game.events.emit('ui:wizhp', this.hp, this.maxHp);
    s.tweens.add({ targets: this.sprite, scaleY: 0.35, scaleX: 1.35, duration: 120, ease: 'Quad.easeOut' });
    this.say(this.hp > 0 ? 'AUA!' : this.look.last, '#ffe14d', 1000);
    const stars = [0, 1, 2].map(() => s.add.image(this.x, FLOOR - 20, 'star').setDepth(9));
    const st = { a: 0 };
    s.tweens.add({
      targets: st, a: Math.PI * 4, duration: 1400,
      onUpdate: () => stars.forEach((img, i) => {
        const ang = st.a + (i * Math.PI * 2) / 3;
        img.setPosition(this.x + Math.cos(ang) * 12, FLOOR - 22 + Math.sin(ang) * 4);
      }),
      onComplete: () => stars.forEach((img) => img.destroy()),
    });
    if (this.hp <= 0) {
      s.time.delayedCall(1000, () => this.die());
      return true;
    }
    s.time.delayedCall(1500, () => {
      s.tweens.add({ targets: this.sprite, scaleY: 1, scaleX: 1, duration: 250, ease: 'Back.easeOut' });
      this.setPose('idle');
      this.sprite.setTint(0xff7070);
      s.time.delayedCall(400, () => this.sprite.clearTint());
      this.say(this.look.hurt[this.hp === 2 ? 0 : 1], '#ff8a8a', 1600);
      s.time.delayedCall(900, () => this.teleport());
    });
    return true;
  }

  die() {
    this.state = 'dead';
    const s = this.scene;
    sfx.poof();
    for (let i = 0; i < 3; i++) s.time.delayedCall(i * 120, () => s.poof(this.x + Phaser.Math.Between(-8, 8), FLOOR - 10 - i * 8, 18));
    s.tweens.add({ targets: [this.sprite, this.aura], alpha: 0, duration: 400 });
    const hat = s.add.image(this.x, FLOOR - 30, `${this.look.tex}_hat`).setOrigin(0.5, 1).setDepth(9);
    s.tweens.add({ targets: hat, y: FLOOR + 1, angle: 15, duration: 700, ease: 'Bounce.easeOut', delay: 200 });
    s.onBossDefeated(this);
  }
}
