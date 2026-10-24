import Phaser from 'phaser';
import { W, H, FLOOR, CEIL, FONT } from '../config.js';
import { Ghost } from '../objects/Ghost.js';
import { Wizard, WIZ_SPOTS } from '../objects/Wizard.js';
import { Chandelier, Bookshelf, Armor, Cage } from '../objects/BossProps.js';
import { sfx, playMusic } from '../sfx.js';

const ADD = Phaser.BlendModes.ADD;
const MAX_HEARTS = 5;
const REPAIR_DELAY = 6500;

export class BossScene extends Phaser.Scene {
  constructor() { super('Boss'); }

  create() {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.bringToTop('UI');
    this.over = false;
    this.canContinue = false;
    this.freed = false;
    this.hearts = MAX_HEARTS;
    this.sparks = [];
    this.t = 0;

    const cellar = this.registry.get('bossLair') === 'cellar';
    this.add.image(0, 0, cellar ? 'bossroom_cellar' : 'bossroom').setOrigin(0).setDepth(0);
    for (const x of [170, 260]) {
      const g = this.add.image(x, 128, 'glow').setTint(0xffb050).setBlendMode(ADD).setScale(0.8).setAlpha(0.5).setDepth(1);
      this.tweens.add({ targets: g, alpha: 0.3, duration: 110, yoyo: true, repeat: -1, repeatDelay: 300 });
    }

    this.props = [
      new Bookshelf(this, 'L'),
      new Chandelier(this, 128),
      new Armor(this, 213),
      new Chandelier(this, 298),
      new Bookshelf(this, 'R'),
    ];
    this.cages = [
      new Cage(this, 178, 18, 0x9fd8ff),
      new Cage(this, 213, 30, 0xb8ffb0),
      new Cage(this, 248, 18, 0xffb3e6),
    ];

    this.ghost = new Ghost(this, 46, 110, { minX: 8, maxX: W - 8, minY: CEIL + 10, maxY: FLOOR - 12 });
    this.wizard = new Wizard(this, 330);
    this.wizard.sprite.setAlpha(0);

    this.trail = this.add.particles(0, 0, 'spark', {
      speed: { min: 0, max: 10 }, lifespan: 260, scale: { start: 0.8, end: 0 },
      tint: [0xff8cf0, 0xc86bff], blendMode: 'ADD', emitting: false,
    }).setDepth(11);
    this.burst = this.add.particles(0, 0, 'spark', {
      speed: { min: 40, max: 120 }, lifespan: 500, scale: { start: 1, end: 0 }, gravityY: 200,
      tint: [0xff8cf0, 0xffffff, 0xc86bff], blendMode: 'ADD', emitting: false,
    }).setDepth(11);
    this.debris = this.add.particles(0, 0, 'spark', {
      speed: { min: 40, max: 140 }, angle: { min: 200, max: 340 }, lifespan: 700, gravityY: 400,
      tint: [0xb8902c, 0x6b4226, 0xf0ead8, 0x7a1f2a, 0x2a3a6a], emitting: false,
    }).setDepth(11);
    this.smoke = this.add.particles(0, 0, 'smoke', {
      speed: { min: 10, max: 40 }, lifespan: 600, scale: { start: 1, end: 2 }, alpha: { start: 0.8, end: 0 },
      tint: [0x8a5ad0, 0x5a3a8a, 0xb08ae0], emitting: false,
    }).setDepth(10);
    this.magic = this.add.particles(0, 0, 'star', {
      speed: { min: 5, max: 30 }, lifespan: 700, scale: { start: 1, end: 0 }, gravityY: -20,
      tint: [0xc86bff, 0xff8cf0], blendMode: 'ADD', emitting: false,
    }).setDepth(11);

    this.events.off('ghost-boo');
    this.events.on('ghost-boo', (x, y) => {
      const w = this.wizard;
      if (Phaser.Math.Distance.Between(x, y, w.x, FLOOR - 24) < 60) w.startle();
    });

    const ui = (...a) => this.game.events.emit(...a);
    this.time.delayedCall(50, () => {
      ui('ui:clear');
      ui('ui:boss', true);
      ui('ui:hearts', this.hearts, MAX_HEARTS);
      ui('ui:wizhp', 3, 3);
      ui('ui:objective', 'Ziel: Besiege den Zauberer!');
    });

    playMusic('boss');
    this.cameras.main.fadeIn(600, 20, 0, 40);
    this.ghost.locked = true;

    // wizard entrance
    this.time.delayedCall(700, () => {
      this.poof(330, FLOOR - 22, 16);
      sfx.poof();
      this.tweens.add({ targets: this.wizard.sprite, alpha: 1, duration: 300 });
      sfx.laugh();
      this.wizard.say('Du willst deine Freunde?\nVersuch\'s doch!', '#d08aff', 2200);
    });
    this.time.delayedCall(1000, () => {
      ui('ui:message', 'Weiche den Zauberfunken aus!', 2200);
      ui('ui:message', 'Lass die Funken Kronleuchter, Regale oder die Rüstung treffen - sie fallen auf den Zauberer!', 3800);
    });
    this.time.delayedCall(2900, () => { this.ghost.locked = false; });
    this.time.delayedCall(7000, () => this.wizard.start());

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.over && this.canContinue) this.continueGame();
    });
  }

  // ------------------------------------------------------------------ helpers
  poof(x, y, n = 10) {
    this.smoke.explode(n, x, y);
  }

  spawnSpark(x, y, vx, vy, big) {
    if (this.over) return;
    const img = this.add.image(x, y, big ? 'bolt' : 'spark').setBlendMode(ADD).setDepth(12);
    if (!big) img.setTint(0xffa0f8).setScale(1.5);
    this.sparks.push({ img, x, y, vx, vy, r: big ? 4 : 2, big });
  }

  removeSpark(s, burst = 6) {
    if (burst) this.burst.explode(burst, s.x, s.y);
    s.img.destroy();
    s.dead = true;
  }

  pickWizardSpot(current) {
    const ok = WIZ_SPOTS.filter((x) => Math.abs(x - current) > 20 && Math.abs(x - this.ghost.x) > 36);
    const pool = ok.length ? ok : WIZ_SPOTS.filter((x) => x !== current);
    const covered = pool.filter((x) => this.props.some((p) => p.state === 'up' && p.covers(x)));
    const from = covered.length && Math.random() < 0.7 ? covered : pool;
    return Phaser.Utils.Array.GetRandom(from);
  }

  onImpact(prop, fxX, fxY, range) {
    sfx.crash();
    this.cameras.main.shake(220, 0.012);
    this.debris.explode(26, fxX, fxY);
    this.smoke.explode(8, fxX, FLOOR - 4);
    const w = this.wizard;
    const hitW = range ? (w.x >= range[0] - 4 && w.x <= range[1] + 4) : prop.covers(w.x);
    if (hitW && w.vulnerable) w.hit();
    else if (w.state !== 'dead' && w.state !== 'hurt') w.say(Phaser.Utils.Array.GetRandom(['Daneben!', 'Hihi!', 'Ha! Verfehlt!']), '#d08aff', 900);

    this.time.delayedCall(REPAIR_DELAY, () => {
      if (this.over || prop.state !== 'down') return;
      sfx.repair();
      const x = prop.x;
      this.magic.explode(14, x, FLOOR - 20);
      const t = this.add.text(x, FLOOR - 40, 'Reparo!', {
        fontFamily: FONT, fontSize: '8px', color: '#c86bff', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: t, y: t.y - 10, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
      prop.repair();
    });
  }

  // ------------------------------------------------------------------ outcome
  onWizardDefeated() {
    this.over = true;
    this.freed = true;
    for (const s of this.sparks) if (!s.dead) this.removeSpark(s, 4);
    this.sparks = [];
    this.ghost.invuln = 0;
    playMusic('world');
    this.time.delayedCall(900, () => {
      this.cages.forEach((c, i) => this.time.delayedCall(i * 350, () => {
        c.release();
        this.magic.explode(10, c.x, c.top + 16);
        const f = c.friend;
        this.tweens.add({
          targets: f, y: f.y + 24, x: f.x + (i - 1) * 14, scale: 1, duration: 600, ease: 'Sine.easeOut',
          onComplete: () => { f.free = true; f.setDepth(19); },
        });
      }));
    });
    this.time.delayedCall(2200, () => {
      sfx.win();
      this.game.events.emit('ui:message', 'Danke, kleiner Geist! Wir sind frei!', 3500);
    });
    this.time.delayedCall(4200, () => {
      const n = this.registry.get('scared') || 0;
      const secs = Math.round((Date.now() - (this.registry.get('startTime') || Date.now())) / 1000);
      const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      this.game.events.emit('ui:banner', {
        title: 'GESCHAFFT!',
        lines: [
          'Der Zauberer ist platt wie ein Pfannkuchen,',
          'die Geister-Freunde sind frei!',
          `Erschreckte Bewohner: ${n}   Zeit: ${time}`,
          'LEERTASTE: Nochmal spielen',
        ],
      });
      this.canContinue = true;
      this.result = 'win';
    });
  }

  defeat() {
    this.over = true;
    this.ghost.locked = true;
    for (const s of this.sparks) if (!s.dead) this.removeSpark(s, 4);
    this.sparks = [];
    this.wizard.state = 'gloat';
    this.wizard.setPose('cast');
    this.wizard.say('MUAHAHA!', '#d08aff', 2000);
    sfx.lose();
    this.tweens.add({ targets: [this.ghost.sprite, this.ghost.glow], alpha: 0, duration: 1200 });
    this.ghost.sparkler.emitting = false;
    this.time.delayedCall(1600, () => {
      this.game.events.emit('ui:clear');
      this.game.events.emit('ui:banner', {
        title: 'OH NEIN!', color: '#ff8a8a',
        lines: ['Der Zauberer hat dich erwischt...', '', 'LEERTASTE: Nochmal versuchen'],
      });
      this.canContinue = true;
      this.result = 'lose';
    });
  }

  continueGame() {
    this.canContinue = false;
    this.game.events.emit('ui:clear');
    if (this.result === 'lose') {
      this.scene.restart();
    } else {
      this.game.events.emit('ui:boss', false);
      this.scene.stop('UI');
      this.scene.start('Title');
    }
  }

  // ------------------------------------------------------------------ loop
  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.t += dt;
    const g = this.ghost;
    g.update(dt);
    this.wizard.update(dt);

    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.img.setPosition(Math.round(s.x), Math.round(s.y));
      if (s.big) s.img.rotation += dt * 12;
      if (Math.random() < 0.6) this.trail.emitParticleAt(s.x, s.y, 1);

      if (Phaser.Math.Distance.Between(s.x, s.y, g.x, g.y + g.bobY) < s.r + 6) {
        if (g.hurt(s.x)) {
          this.removeSpark(s, 10);
          this.hearts--;
          this.game.events.emit('ui:hearts', this.hearts, MAX_HEARTS);
          if (this.hearts <= 0) { this.defeat(); break; }
          continue;
        }
      }
      for (const p of this.props) {
        if (p.state === 'up' && Phaser.Geom.Rectangle.Contains(p.hitRect, s.x, s.y)) {
          sfx.zap();
          p.trigger();
          this.removeSpark(s, 12);
          break;
        }
      }
      if (s.dead) continue;
      if (s.x < -6 || s.x > W + 6 || s.y < CEIL || s.y > FLOOR) {
        sfx.fizzle();
        this.removeSpark(s, 5);
      }
    }
    this.sparks = this.sparks.filter((s) => !s.dead);

    if (this.freed) {
      this.cages.forEach((c, i) => {
        const f = c.friend;
        if (!f.free) return;
        const a = this.t * 2 + (i * Math.PI * 2) / 3;
        const tx = g.x + Math.cos(a) * 26;
        const ty = g.y + Math.sin(a) * 12 - 4;
        f.x += (tx - f.x) * Math.min(1, dt * 3);
        f.y += (ty - f.y) * Math.min(1, dt * 3);
        f.setFlipX(Math.sin(a) > 0);
      });
    }
  }
}
