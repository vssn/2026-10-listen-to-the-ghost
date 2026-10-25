import Phaser from 'phaser';
import { t, tl } from '../i18n.js';
import { W, FLOOR, CEIL, FONT } from '../config.js';
import { Ghost } from '../objects/Ghost.js';
import { Wizard, WIZ_SPOTS } from '../objects/Wizard.js';
import { Hanging, Shelf, Topple, Cage } from '../objects/BossProps.js';
import { Bubbles } from '../objects/Bubbles.js';
import { sfx, playMusic } from '../sfx.js';

const ADD = Phaser.BlendModes.ADD;
const MAX_HEARTS = 5;
const REPAIR_DELAY = 6500;
const HATCH_X = 213;

// Two-stage showdown. Stage 1: the wizard's apprentice in the hall (or cellar
// vault). Stage 2: the wizard himself in the attic observatory.
export class BossScene extends Phaser.Scene {
  constructor() { super('Boss'); }

  create() {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.bringToTop('UI');
    this.stage = this.registry.get('bossStage') || 1;
    this.over = false;
    this.fightDone = false;
    this.canContinue = false;
    this.freed = false;
    this.exitOpen = false;
    this.potions = [];
    this.hearts = this.stage === 2 ? (this.registry.get('ghostHearts') ?? MAX_HEARTS) : MAX_HEARTS;
    this.sparks = [];
    this.t = 0;

    if (this.stage === 1) this.buildHall();
    else this.buildAttic();
    this.cages = [
      new Cage(this, 178, 18, 0x9fd8ff),
      new Cage(this, 213, 30, 0xb8ffb0),
      new Cage(this, 248, 18, 0xffb3e6),
    ];

    this.bubbles = new Bubbles(this);
    this.ghost = new Ghost(this, 46, 110, { minX: 8, maxX: W - 8, minY: CEIL + 10, maxY: FLOOR - 12 });
    this.boss = new Wizard(this, 330, this.stage === 1 ? 'apprentice' : 'wizard');
    this.boss.sprite.setAlpha(0);

    this.makeParticles();

    this.events.off('ghost-boo');
    this.events.on('ghost-boo', (x, y) => {
      const b = this.boss;
      if (Phaser.Math.Distance.Between(x, y, b.x, FLOOR - 24) < 60) b.startle();
    });

    const ui = (...a) => this.game.events.emit(...a);
    this.time.delayedCall(50, () => {
      ui('ui:clear');
      ui('ui:boss', true);
      ui('ui:bossname', this.stage === 1 ? t('hud.apprentice') : t('hud.wizard'));
      ui('ui:hearts', this.hearts, MAX_HEARTS);
      ui('ui:wizhp', 3, 3);
      ui('ui:objective', this.stage === 1 ? t('obj.apprentice') : t('obj.wizard'));
    });

    playMusic('boss');
    this.cameras.main.fadeIn(600, 20, 0, 40);
    this.ghost.locked = true;
    if (this.stage === 1) this.introApprentice();
    else this.introWizard();

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.over && this.canContinue) this.continueGame();
    });
  }

  // ------------------------------------------------------------------ rooms
  buildHall() {
    const cellar = this.registry.get('bossLair') === 'cellar';
    this.add.image(0, 0, cellar ? 'bossroom_cellar' : 'bossroom').setOrigin(0).setDepth(0);
    for (const x of [170, 260]) this.flame(x, 128, 0xffb050, 0.8);
    this.props = [
      new Shelf(this, 'L', 'bookshelf'),
      new Hanging(this, 128),
      new Topple(this, 213, 'armor'),
      new Hanging(this, 298),
      new Shelf(this, 'R', 'bookshelf'),
    ];
  }

  buildAttic() {
    this.add.image(0, 0, 'bossroom_attic').setOrigin(0).setDepth(0);
    for (const x of [60, 366]) this.flame(x, 150, 0xffc860, 0.7);
    this.props = [
      new Shelf(this, 'L', 'scrollshelf'),
      new Hanging(this, 128, { key: 'planet_saturn', broken: 'planet_saturn_broken', glow: 0x8aa0ff, chainLen: 30 }),
      new Topple(this, 150, 'armillary'),
      new Hanging(this, 298, { key: 'planet_jupiter', broken: 'planet_jupiter_broken', glow: 0x8aa0ff, chainLen: 26 }),
      new Topple(this, 276, 'telescope'),
      new Shelf(this, 'R', 'scrollshelf'),
    ];
  }

  flame(x, y, tint, scale) {
    const g = this.add.image(x, y, 'glow').setTint(tint).setBlendMode(ADD).setScale(scale).setAlpha(0.5).setDepth(1);
    this.tweens.add({ targets: g, alpha: 0.3, duration: 110, yoyo: true, repeat: -1, repeatDelay: 300 });
  }

  makeParticles() {
    this.trail = this.add.particles(0, 0, 'spark', {
      speed: { min: 0, max: 10 }, lifespan: 260, scale: { start: 0.8, end: 0 },
      tint: this.boss.look.sparks.slice(0, 2), blendMode: 'ADD', emitting: false,
    }).setDepth(11);
    this.burst = this.add.particles(0, 0, 'spark', {
      speed: { min: 40, max: 120 }, lifespan: 500, scale: { start: 1, end: 0 }, gravityY: 200,
      tint: this.boss.look.sparks, blendMode: 'ADD', emitting: false,
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
  }

  ghostSays(text, ms) {
    const g = this.ghost;
    this.bubbles.say('ghost', () => ({ x: g.x, y: g.y - 15 }), text, { ms });
  }

  // ------------------------------------------------------------------ intros
  introApprentice() {
    // the wizard shows up, hands over to his apprentice and vanishes with the cages
    const master = this.add.image(330, FLOOR, 'wiz_cast').setOrigin(0.5, 1).setDepth(8).setAlpha(0).setFlipX(true);
    const aura = this.add.image(330, FLOOR - 24, 'glow').setTint(0x8a3fff).setBlendMode(ADD).setScale(1.3).setAlpha(0).setDepth(7.9);
    const masterSays = (text, ms) => this.bubbles.say('wizard', () => ({ x: 330, y: FLOOR - 50 }), text, { style: 'wizard', ms });
    this.time.delayedCall(700, () => {
      this.poof(330, FLOOR - 22, 16);
      sfx.poof();
      sfx.laugh();
      this.tweens.add({ targets: [master], alpha: 1, duration: 300 });
      this.tweens.add({ targets: [aura], alpha: 0.35, duration: 300 });
      masterSays(t('boss.master1'), 2800);
    });
    this.time.delayedCall(3600, () => {
      masterSays(t('boss.master2'), 1400);
      sfx.poof();
      this.poof(330, FLOOR - 22, 18);
      this.tweens.add({ targets: [master, aura], alpha: 0, duration: 250, delay: 300 });
      this.cages.forEach((c, i) => this.time.delayedCall(350 + i * 120, () => c.vanish()));
    });
    this.time.delayedCall(4800, () => {
      this.poof(330, FLOOR - 22, 14);
      sfx.poof();
      this.tweens.add({ targets: this.boss.sprite, alpha: 1, duration: 300 });
      this.boss.say(t('boss.apprentice1'), undefined, 2200);
      this.ghost.locked = false;
    });
    this.time.delayedCall(5400, () => {
      this.ghostSays(t('boss.ghost1'), 2400);
      this.ghostSays(t('boss.ghost2'), 3600);
    });
    this.time.delayedCall(9800, () => this.boss.start());
  }

  introWizard() {
    this.time.delayedCall(700, () => {
      this.poof(330, FLOOR - 22, 16);
      sfx.poof();
      sfx.laugh();
      this.tweens.add({ targets: this.boss.sprite, alpha: 1, duration: 300 });
      this.boss.say(t('boss.wizard1'), undefined, 3000);
    });
    this.time.delayedCall(1400, () => {
      this.ghostSays(t('boss.ghost3'), 3400);
    });
    this.time.delayedCall(2400, () => { this.ghost.locked = false; });
    this.time.delayedCall(5600, () => this.boss.start());
  }

  // ------------------------------------------------------------------ helpers
  poof(x, y, n = 10) {
    this.smoke.explode(n, x, y);
  }

  spawnSpark(x, y, vx, vy, big, tint) {
    if (this.over || this.fightDone) return;
    const img = this.add.image(x, y, big ? (this.stage === 1 ? 'bolt_green' : 'bolt') : 'spark').setBlendMode(ADD).setDepth(12);
    if (!big) img.setTint(tint ?? 0xffa0f8).setScale(1.5);
    this.sparks.push({ img, x, y, vx, vy, r: big ? 4 : 2, big });
  }

  removeSpark(s, burst = 6) {
    if (burst) this.burst.explode(burst, s.x, s.y);
    s.img.destroy();
    s.dead = true;
  }

  clearSparks() {
    for (const s of this.sparks) if (!s.dead) this.removeSpark(s, 4);
    this.sparks = [];
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
    const b = this.boss;
    const hit = range ? (b.x >= range[0] - 4 && b.x <= range[1] + 4) : prop.covers(b.x);
    if (hit && b.vulnerable) b.hit();
    else if (b.state !== 'dead' && b.state !== 'hurt') b.say(Phaser.Utils.Array.GetRandom(tl('boss.miss')), undefined, 1000);

    this.time.delayedCall(REPAIR_DELAY, () => {
      if (this.over || this.fightDone || prop.state !== 'down') return;
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

  setHearts(n) {
    this.hearts = n;
    this.game.events.emit('ui:hearts', n, MAX_HEARTS);
  }

  // ------------------------------------------------------------------ stage 1 → 2
  onBossDefeated(boss) {
    if (this.stage === 2) { this.onWizardDefeated(); return; }
    this.fightDone = true;
    this.clearSparks();
    this.ghost.invuln = 0;
    // up to three flying heart potions are revealed where the apprentice stood
    this.time.delayedCall(900, () => {
      const n = Phaser.Math.Clamp(MAX_HEARTS - this.hearts, 1, 3);
      const offsets = [[0], [-14, 14], [-20, 0, 20]][n - 1];
      offsets.forEach((dx, i) => {
        const x = Phaser.Math.Clamp(boss.x + dx, 30, W - 30);
        const y = FLOOR - 30 - i * 6;
        this.magic.explode(10, x, y);
        const img = this.add.sprite(x, y, 'potion0').play('potion-fly').setDepth(15).setScale(0);
        const glow = this.add.image(x, y, 'glow').setTint(0xff4a7a).setBlendMode(ADD).setScale(0.45).setAlpha(0.6).setDepth(14);
        this.tweens.add({ targets: img, scale: 1, duration: 300, ease: 'Back.easeOut' });
        this.potions.push({ img, glow, x, y, phase: i * 2.1 });
      });
      sfx.repair();
      this.ghostSays(t('boss.potions'), 2800);
    });
    this.time.delayedCall(3200, () => this.openHatch());
  }

  openHatch() {
    this.exitOpen = true;
    sfx.creak();
    this.cameras.main.shake(200, 0.004);
    this.add.image(HATCH_X, 0, 'hatch').setOrigin(0.5, 0).setDepth(4);
    const beam = this.add.image(HATCH_X, 20, 'lightcone').setOrigin(0.5, 0).setBlendMode(ADD).setScale(1.4, 1.6).setAlpha(0.6).setDepth(4);
    this.tweens.add({ targets: beam, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });
    const arrow = this.add.image(HATCH_X, 46, 'arrow_up').setDepth(30);
    this.tweens.add({ targets: arrow, y: 38, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.ghostSays(t('boss.hatch'), 3000);
    this.game.events.emit('ui:objective', t('obj.hatch'));
  }

  goUpstairs() {
    this.exitOpen = false;
    const g = this.ghost;
    g.locked = true;
    g.clamp = false;
    g.vx = g.vy = 0;
    sfx.rise();
    this.tweens.add({ targets: g, x: HATCH_X, y: -30, duration: 900, ease: 'Sine.easeIn' });
    this.cameras.main.fadeOut(900, 10, 5, 25);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.registry.set('bossStage', 2);
      this.registry.set('ghostHearts', this.hearts);
      this.scene.restart();
    });
  }

  // ------------------------------------------------------------------ outcome
  onWizardDefeated() {
    this.over = true;
    this.freed = true;
    this.clearSparks();
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
      const f = this.cages[1].friend;
      this.bubbles.say('friend', () => ({ x: f.x, y: f.y - 10 }), t('boss.friend'), { style: 'friend', ms: 3500 });
    });
    this.time.delayedCall(4200, () => {
      const n = this.registry.get('scared') || 0;
      const secs = Math.round((Date.now() - (this.registry.get('startTime') || Date.now())) / 1000);
      const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      this.game.events.emit('ui:banner', {
        title: t('banner.win.title'),
        lines: [
          t('banner.win.l1'),
          t('banner.win.l2'),
          t('banner.win.l3', { n, time }),
          t('banner.win.again'),
        ],
      });
      this.canContinue = true;
      this.result = 'win';
    });
  }

  defeat() {
    this.over = true;
    this.ghost.locked = true;
    this.clearSparks();
    this.boss.state = 'gloat';
    this.boss.setPose('cast');
    this.bubbles.clear();
    this.boss.say(this.stage === 1 ? t('boss.gloat') : t('boss.muahaha'), undefined, 2400);
    sfx.lose();
    this.tweens.add({ targets: [this.ghost.sprite, this.ghost.glow], alpha: 0, duration: 1200 });
    this.ghost.sparkler.emitting = false;
    this.time.delayedCall(1600, () => {
      this.game.events.emit('ui:clear');
      this.game.events.emit('ui:banner', {
        title: t('banner.lose.title'), color: '#ff8a8a',
        lines: [this.stage === 1 ? t('banner.lose.apprentice') : t('banner.lose.wizard'), '', t('banner.lose.again')],
      });
      this.canContinue = true;
      this.result = 'lose';
    });
  }

  continueGame() {
    this.canContinue = false;
    this.game.events.emit('ui:clear');
    if (this.result === 'lose') {
      // retry the same stage with full energy
      this.registry.set('ghostHearts', MAX_HEARTS);
      this.scene.restart();
    } else {
      this.registry.set('bossStage', 1);
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
    this.boss.update(dt);

    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.img.setPosition(Math.round(s.x), Math.round(s.y));
      if (s.big) s.img.rotation += dt * 12;
      if (Math.random() < 0.6) this.trail.emitParticleAt(s.x, s.y, 1);

      if (Phaser.Math.Distance.Between(s.x, s.y, g.x, g.y + g.bobY) < s.r + 6) {
        if (g.hurt(s.x)) {
          this.removeSpark(s, 10);
          this.setHearts(this.hearts - 1);
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

    // fluttering heart potions
    for (const p of this.potions) {
      if (p.taken) continue;
      const px = p.x + Math.sin(this.t * 1.3 + p.phase) * 10;
      const py = p.y + Math.sin(this.t * 2.1 + p.phase) * 6;
      p.img.setPosition(Math.round(px), Math.round(py));
      p.glow.setPosition(px, py);
      if (Phaser.Math.Distance.Between(px, py, g.x, g.y) < 13) {
        p.taken = true;
        if (this.hearts < MAX_HEARTS) this.setHearts(this.hearts + 1);
        sfx.point();
        sfx.repair();
        this.magic.explode(12, px, py);
        const t = this.add.text(px, py - 8, '+1', {
          fontFamily: FONT, fontSize: '8px', color: '#ff6a8a', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: t, y: t.y - 12, alpha: 0, duration: 800, onComplete: () => t.destroy() });
        p.img.destroy();
        p.glow.destroy();
      }
    }

    if (this.exitOpen && Math.abs(g.x - HATCH_X) < 20 && g.y < CEIL + 30) this.goUpstairs();

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
