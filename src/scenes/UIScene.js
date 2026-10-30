import Phaser from 'phaser';
import { t } from '../i18n.js';
import { W, H, FONT } from '../config.js';
import { toggleMute, isMuted } from '../sfx.js';
import { getRacers, RACE_SECS } from '../objects/Race.js';

// height of the black cinema bars over the opening cutscene
const CUT_BAR = 22;

const style = (color = '#f3e9d2', extra = {}) => ({
  fontFamily: FONT, fontSize: '8px', color, lineSpacing: 4, ...extra,
});

// Overlay HUD shared by the world and the boss fight. Talks to the other
// scenes only through game-level events.
export class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    const g = this.game.events;

    // score
    this.scoreIcon = this.add.image(10, 10, 'friend0').setOrigin(0, 0.5).setScale(0.6);
    this.scoreText = this.add.text(26, 6, '', style('#ffd27a', { stroke: '#000', strokeThickness: 2 }));
    this.objective = this.add.text(6, 18, '', style('#b9a8e8', { stroke: '#000', strokeThickness: 2 }));
    this.muteText = this.add.text(W - 4, 4, '', style('#7a6a9a')).setOrigin(1, 0);
    this.updateMute();

    // boss HUD
    this.bossUi = this.add.container(0, 0).setVisible(false);
    this.hearts = [];
    for (let i = 0; i < 5; i++) {
      const h = this.add.image(70 + i * 9, 10, 'heart').setOrigin(0, 0.5);
      this.hearts.push(h);
      this.bossUi.add(h);
    }
    const wizLabel = this.wizLabel = this.add.text(W - 6, 14, t('hud.wizard'), style('#d08aff', { stroke: '#000', strokeThickness: 2 })).setOrigin(1, 0);
    this.wizBarBg = this.add.rectangle(W - 6, 26, 72, 6, 0x1a0f2a).setOrigin(1, 0).setStrokeStyle(1, 0x6a3fb0);
    this.wizBar = this.add.rectangle(W - 7, 27, 70, 4, 0xb060ff).setOrigin(1, 0);
    this.bossUi.add([wizLabel, this.wizBarBg, this.wizBar]);

    // banner (victory / defeat)
    this.banner = this.add.container(W / 2, H / 2).setVisible(false);

    const on = (ev, fn) => { g.on(ev, fn, this); };
    on('ui:score', this.setScore);
    on('ui:objective', (t) => this.objective.setText(t));
    on('ui:boss', (v) => this.bossUi.setVisible(v));
    on('ui:hearts', this.setHearts);
    on('ui:bossname', (n) => this.wizLabel.setText(n));
    on('ui:wizhp', (n, max) => { this.wizBar.setSize(Math.max(0, 70 * (n / max)), 4); });
    on('ui:banner', this.showBanner);
    on('ui:clear', this.clearAll);
    on('ui:race-scores', this.setStandings);
    on('ui:race-time', this.setTime);
    on('ui:race-count', this.showCount);
    on('ui:race-over', this.showCount);
    on('ui:cutscene', this.setCutscene);
    this.events.once('shutdown', () => {
      for (const ev of ['ui:score', 'ui:objective', 'ui:boss', 'ui:hearts', 'ui:bossname', 'ui:wizhp', 'ui:banner', 'ui:clear',
        'ui:race-scores', 'ui:race-time', 'ui:race-count', 'ui:race-over', 'ui:cutscene']) g.off(ev, undefined, this);
    });
    if (this.registry.get('mode') === 'race') this.buildRaceHud();

    this.input.keyboard.on('keydown-M', () => { toggleMute(); this.updateMute(); });
    this.setScore(this.registry.get('scared') || 0);
  }

  // Scare race: live ranking top left, the clock top centre, big countdown numbers.
  buildRaceHud() {
    this.scoreIcon.setVisible(false);
    this.scoreText.setVisible(false);
    this.objective.setVisible(false);
    this.duo = !!this.registry.get('raceDuo');
    const racers = getRacers(this.duo);
    const icon = (r) => {
      const img = this.add.image(0, 0, r.icon).setScale(0.45);
      if (r.tint || r.icon !== 'ghost0') img.setTint(r.tint ?? r.color);
      return img;
    };
    if (this.duo) {
      // split screen: a line down the middle, each player's score in their own top corner
      this.add.rectangle(W / 2, 0, 3, H, 0x07050f).setOrigin(0.5, 0);
      this.add.rectangle(W / 2, 0, 1, H, 0x4a3a6a).setOrigin(0.5, 0);
      this.raceRows = racers.map((r, i) => {
        const right = i === 1;
        const score = this.add.text(right ? -9 : 9, -4, '0', style(r.css, { stroke: '#000', strokeThickness: 2 })).setOrigin(right ? 1 : 0, 0);
        return this.add.container(right ? W - 12 : 12, 10, [icon(r), score]).setData('score', score);
      });
      this.muteText.setOrigin(0.5, 1).setPosition(W / 2, H - 3);
    } else {
      const rowY = (rank) => 9 + rank * 11;
      for (let k = 0; k < racers.length; k++) {
        this.add.text(4, rowY(k) - 4, `${k + 1}.`, style('#7a6a9a', { stroke: '#000', strokeThickness: 2 }));
      }
      this.raceRows = racers.map((r, i) => {
        const score = this.add.text(9, -4, '0', style(r.css, { stroke: '#000', strokeThickness: 2 }));
        return this.add.container(26, rowY(i), [icon(r), score]).setData('score', score);
      });
      this.rowY = rowY;
    }
    this.timeText = this.add.text(W / 2, 4, this.clock(RACE_SECS), {
      fontFamily: FONT, fontSize: '16px', color: '#f3e9d2', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0);
    this.countText = this.add.text(W / 2, H / 2 - 18, '', {
      fontFamily: FONT, fontSize: '32px', color: '#ff9a3c', stroke: '#2a0a00', strokeThickness: 5,
    }).setOrigin(0.5).setVisible(false);
    this.goalText = this.add.text(W / 2, H / 2 + 22, '', style('#f3e9d2', { stroke: '#000', strokeThickness: 3 }))
      .setOrigin(0.5).setVisible(false);
  }

  clock(secs) { return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`; }

  setTime(secs) {
    if (!this.timeText) return;
    this.timeText.setText(this.clock(secs));
    if (secs <= 10) {
      this.timeText.setColor('#ff5a5a');
      this.tweens.add({ targets: this.timeText, scale: 1.25, duration: 90, yoyo: true });
    }
  }

  setStandings(list) {
    if (!this.raceRows) return;
    list.forEach(({ i, score }, rank) => {
      const row = this.raceRows[i];
      const label = row.getData('score');
      if (label.text !== String(score)) {
        label.setText(String(score));
        this.tweens.add({ targets: row, scale: 1.3, duration: 80, yoyo: true });
      }
      // the ranking re-sorts itself; in split screen each score stays in its corner
      if (!this.duo && row.y !== this.rowY(rank)) this.tweens.add({ targets: row, y: this.rowY(rank), duration: 220, ease: 'Quad.easeOut' });
    });
  }

  // A big word popping up in the middle (3, 2, 1, GO! and TIME'S UP!); with
  // `goal` alone just the line underneath.
  showCount(text, goal) {
    if (!this.countText) return;
    if (goal) this.goalText.setText(goal).setVisible(true).setAlpha(1);
    if (!text) return;
    const c = this.countText;
    this.tweens.killTweensOf(c);
    c.setText(text).setVisible(true).setAlpha(1).setScale(2.2);
    this.tweens.add({ targets: c, scale: 1, duration: 260, ease: 'Back.easeOut' });
    const final = text.length > 1;
    if (final) {
      // GO! / TIME'S UP!: the goal line goes, the word lingers a little
      this.tweens.add({ targets: this.goalText, alpha: 0, duration: 300 });
      this.tweens.add({ targets: c, alpha: 0, delay: 900, duration: 400 });
    } else {
      this.tweens.add({ targets: c, alpha: 0.2, delay: 600, duration: 300 });
    }
  }

  updateMute() { this.muteText.setText(isMuted() ? t('hud.muteOff') : t('hud.muteOn')); }

  setScore(n) {
    this.scoreText.setText(`x ${n}`);
    this.tweens.add({ targets: this.scoreText, scale: 1.3, duration: 80, yoyo: true });
  }

  setHearts(n) {
    this.hearts.forEach((h, i) => h.setTexture(i < n ? 'heart' : 'heart_empty'));
  }

  // Cinema bars (with a caption and the skip hint) slide in over the opening
  // cutscene; the HUD hides meanwhile.
  setCutscene(on) {
    if (!this.cut) {
      const bar = (y, oy) => this.add.rectangle(0, y, W, CUT_BAR, 0x000000).setOrigin(0, oy);
      this.cut = {
        top: bar(-CUT_BAR, 0),
        bottom: bar(H + CUT_BAR, 1),
        caption: this.add.text(W / 2, CUT_BAR / 2, t('cut.caption'), style('#b9a8e8')).setOrigin(0.5).setAlpha(0),
        skip: this.add.text(W - 6, H - CUT_BAR / 2, t('cut.skip'), style('#6a5a8a')).setOrigin(1, 0.5).setAlpha(0),
      };
    }
    const c = this.cut;
    this.tweens.killTweensOf(Object.values(c));
    const ease = 'Sine.easeInOut';
    this.tweens.add({ targets: c.top, y: on ? 0 : -CUT_BAR, duration: 500, ease });
    this.tweens.add({ targets: c.bottom, y: on ? H : H + CUT_BAR, duration: 500, ease });
    this.tweens.add({ targets: c.skip, alpha: on ? 1 : 0, duration: 400, delay: on ? 500 : 0 });
    if (on) this.tweens.add({ targets: c.caption, alpha: 1, duration: 600, delay: 500, hold: 3200, yoyo: true });
    else c.caption.setAlpha(0);
    for (const o of [this.scoreIcon, this.scoreText, this.objective, this.muteText]) o.setVisible(!on);
  }

  clearAll() {
    this.banner.removeAll(true);
    this.banner.setVisible(false);
  }

  showBanner({ title, lines = [], color = '#ffd27a' }) {
    this.banner.removeAll(true);
    const bg = this.add.rectangle(0, 0, 380, 40 + lines.length * 13, 0x0d0818, 0.92).setStrokeStyle(2, 0x8a6ad0);
    const t = this.add.text(0, -bg.height / 2 + 16, title, {
      fontFamily: FONT, fontSize: '16px', color, stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);
    this.banner.add([bg, t]);
    lines.forEach((l, i) => {
      this.banner.add(this.add.text(0, -bg.height / 2 + 36 + i * 13, l, style('#f3e9d2', { align: 'center' })).setOrigin(0.5, 0));
    });
    this.banner.setVisible(true).setScale(0.6).setAlpha(0);
    this.tweens.add({ targets: this.banner, scale: 1, alpha: 1, duration: 400, ease: 'Back.easeOut' });
  }
}
