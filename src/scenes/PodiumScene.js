import Phaser from 'phaser';
import { W, H, FONT } from '../config.js';
import { t } from '../i18n.js';
import { sfx, playMusic, stopMusic } from '../sfx.js';
import { getRacers, racerName } from '../objects/Race.js';
import { PODIUM } from '../textures/race.js';

const GROUND = 212;
// Block centres: 2 – 1 – 3 in the middle, 4 a little apart on the right;
// after a two-player race just 2 – 1, side by side.
const SLOTS = { 1: W / 2, 2: W / 2 - 62, 3: W / 2 + 62, 4: W / 2 + 124 };
const DUO_SLOTS = { 1: W / 2 + 31, 2: W / 2 - 31 };
const PLACE_COLORS = { 1: '#ffd27a', 2: '#d8d8ea', 3: '#d89058', 4: '#9a8ac0' };
const ADD = Phaser.BlendModes.ADD;

// After the scare race: the four ghosts take their places on the podium,
// from fourth place up to the winner.
export class PodiumScene extends Phaser.Scene {
  constructor() { super('Podium'); }

  create() {
    // results: racer indices with scores, best first
    this.duo = !!this.registry.get('raceDuo');
    this.racers = getRacers(this.duo);
    this.slots = this.duo ? DUO_SLOTS : SLOTS;
    const results = this.registry.get('raceResults') || this.racers.map((_, i) => ({ i, score: 0 }));
    const places = results.map((_, k) => k + 1);
    const xs = places.map((p) => this.slots[p]);
    this.leaving = false;
    stopMusic();

    this.add.image(0, 0, 'sky').setOrigin(0);
    this.add.image(330, 46, 'glow').setTint(0xfff0c0).setBlendMode(ADD).setScale(2.2).setAlpha(0.3);
    this.add.image(330, 46, 'moon');
    this.add.image(-200, -110, 'far').setOrigin(0);
    this.add.image(-120, -92, 'mid').setOrigin(0);
    this.add.rectangle(0, GROUND, W, H - GROUND, 0x0c0816).setOrigin(0);
    this.add.rectangle(0, GROUND, W, 1, 0x2a2240).setOrigin(0);
    this.add.image(28, GROUND, 'tree1').setOrigin(0.5, 1).setFlipX(true);
    this.add.image(70, GROUND, 'tomb_rip').setOrigin(0.5, 1);
    this.add.image(400, GROUND, 'tree2').setOrigin(0.5, 1);
    for (const [x, frame] of [[Math.min(...xs) - 44, 0], [Math.max(...xs) + 44, 1]]) {
      this.add.image(x, GROUND, 'pumpkin').setOrigin(0.5, 1);
      this.add.image(x, GROUND - 6, 'glow').setTint(0xff8a1a).setBlendMode(ADD).setScale(0.5).setAlpha(0.6);
      this.add.sprite(x, GROUND - 26, 'torch0').play({ key: 'torch', startFrame: frame });
      const g = this.add.image(x, GROUND - 32, 'glow').setTint(0xff8a1a).setBlendMode(ADD).setScale(1.1).setAlpha(0.5);
      this.tweens.add({ targets: g, alpha: 0.3, duration: 130, yoyo: true, repeat: -1, repeatDelay: 200 });
    }
    for (let i = 0; i < 4; i++) {
      const b = this.add.sprite(Phaser.Math.Between(0, W), Phaser.Math.Between(70, 120), 'bat0').play('bat-flap');
      this.tweens.add({ targets: b, x: b.x + Phaser.Math.Between(-70, 70), y: b.y + Phaser.Math.Between(-15, 15), duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    const title = this.add.text(W / 2, 20, t('podium.title'), {
      fontFamily: FONT, fontSize: '16px', color: '#ff9a3c', stroke: '#2a0a00', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, angle: { from: -2, to: 2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // the blocks with their numbers
    for (const place of places) {
      const { h } = PODIUM[place];
      this.add.image(this.slots[place], GROUND + 1, `podium_${place}`).setOrigin(0.5, 1);
      this.add.text(this.slots[place], GROUND - h + 8 + (h - 8) / 2, String(place), {
        fontFamily: FONT, fontSize: place === 4 ? '8px' : '16px', color: PLACE_COLORS[place], stroke: '#1a1428', strokeThickness: 3,
      }).setOrigin(0.5);
    }

    this.sparkles = this.add.particles(0, 0, 'spark', {
      speed: { min: 30, max: 110 }, angle: { min: 200, max: 340 }, gravityY: 90,
      lifespan: { min: 700, max: 1400 }, scale: { start: 1.4, end: 0 }, quantity: 3, frequency: -1,
      tint: this.racers.map((r) => r.color), blendMode: 'ADD',
    });

    // fourth place first, the winner last after a drum roll
    sfx.drumroll(0.6);
    [...results].reverse().forEach((res, k) => {
      const place = results.length - k;
      const last = place === 1;
      this.time.delayedCall(800 + k * 1000 + (last ? 1200 : 0), () => this.reveal(res, place));
      if (last) this.time.delayedCall(800 + k * 1000, () => sfx.drumroll(1.1));
    });
    this.time.delayedCall(800 + (results.length - 1) * 1000 + 1200 + 900, () => this.finale(results[0]));
  }

  reveal({ i, score }, place) {
    const def = this.racers[i];
    const hat = def.icon === 'ghost0';
    const x = this.slots[place];
    const top = GROUND - PODIUM[place].h;
    const y = top - 25;
    const glow = this.add.image(x, y, 'glow').setTint(def.color).setBlendMode(ADD).setScale(1.5).setAlpha(0);
    const ghost = this.add.sprite(x, -40, def.icon).setScale(2);
    if (hat) ghost.play('ghost-float');
    else ghost.play({ key: 'friend-float', startFrame: i % 2 });
    if (def.tint || !hat) ghost.setTint(def.tint ?? def.color);
    ghost.setFlipX(place === 2);
    ghost.setData('hat', hat);
    if (hat) {
      // the players' sparkler wands keep fizzing
      this.add.particles(0, 0, 'spark', {
        follow: ghost, followOffset: { x: place === 2 ? 22 : -22, y: 2 },
        speed: { min: 8, max: 30 }, lifespan: 380, scale: { start: 1, end: 0 }, frequency: 50, quantity: 2,
        tint: [0xffe066, 0xffb020, 0xffffff], blendMode: 'ADD', gravityY: 30,
      });
    }
    this.tweens.add({
      targets: ghost, y, duration: 650, ease: 'Bounce.easeOut',
      onComplete: () => {
        sfx.poof();
        this.tweens.add({ targets: glow, alpha: 0.55, duration: 300 });
        this.tweens.add({ targets: [ghost, glow], y: y - 4, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const name = this.add.text(x, top - 66, racerName(i, this.duo), {
          fontFamily: FONT, fontSize: '8px', color: def.css, stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setAlpha(0);
        const pts = this.add.text(x, top - 56, String(score), {
          fontFamily: FONT, fontSize: '8px', color: '#f3e9d2', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({ targets: [name, pts], alpha: 1, duration: 300 });
      },
    });
    if (place === 1) {
      this.winner = ghost;
      this.winnerY = y;
    } else {
      sfx.point();
    }
  }

  finale(best) {
    const x = this.slots[1];
    sfx.cymbal();
    sfx.win();
    this.cameras.main.flash(250, 255, 220, 140);
    for (let k = 0; k < 6; k++) this.time.delayedCall(k * 260, () => this.sparkles.explode(14, x + Phaser.Math.Between(-30, 30), this.winnerY - 10));
    if (this.winner.getData('hat')) this.winner.play('ghost-boo');
    this.tweens.add({ targets: this.winner, scale: 2.3, duration: 160, yoyo: true, repeat: 2 });

    const caption = !this.duo && best.i === 0 ? t('podium.youWin') : t('podium.otherWins', { name: racerName(best.i, this.duo) });
    const cap = this.add.text(W / 2, 42, caption, {
      fontFamily: FONT, fontSize: '8px', color: this.racers[best.i].css, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setScale(0.3);
    this.tweens.add({ targets: cap, scale: 1, duration: 300, ease: 'Back.easeOut' });

    this.time.delayedCall(1800, () => {
      playMusic('world');
      this.addButton(W / 2 - 58, t('podium.again'), () => this.leave('World'));
      this.addButton(W / 2 + 58, t('podium.menu'), () => this.leave('Title'));
      const kb = this.input.keyboard;
      kb.once('keydown-SPACE', () => this.leave('World'));
      kb.once('keydown-ENTER', () => this.leave('World'));
      kb.once('keydown-ESC', () => this.leave('Title'));
    });
  }

  addButton(x, label, onClick) {
    const y = 226;
    const frame = this.add.rectangle(x, y, 100, 15, 0x2a1636, 0.9).setStrokeStyle(1, 0xff9a3c);
    const text = this.add.text(x, y, label, {
      fontFamily: FONT, fontSize: '8px', color: '#ffd27a', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    frame.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
    [frame, text].forEach((o) => o.setAlpha(0));
    this.tweens.add({ targets: [frame, text], alpha: 1, duration: 300 });
  }

  // `World` races again (the mode stays 'race'), `Title` goes back to the menu.
  leave(scene) {
    if (this.leaving) return;
    this.leaving = true;
    stopMusic();
    this.registry.set('scared', 0);
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(scene));
  }
}
