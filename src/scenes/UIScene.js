import Phaser from 'phaser';
import { W, H, FONT } from '../config.js';
import { toggleMute, isMuted } from '../sfx.js';

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
    const wizLabel = this.add.text(W - 6, 14, 'ZAUBERER', style('#d08aff', { stroke: '#000', strokeThickness: 2 })).setOrigin(1, 0);
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
    on('ui:wizhp', (n, max) => { this.wizBar.setSize(Math.max(0, 70 * (n / max)), 4); });
    on('ui:banner', this.showBanner);
    on('ui:clear', this.clearAll);
    this.events.once('shutdown', () => {
      for (const ev of ['ui:score', 'ui:objective', 'ui:boss', 'ui:hearts', 'ui:wizhp', 'ui:banner', 'ui:clear']) g.off(ev, undefined, this);
    });

    this.input.keyboard.on('keydown-M', () => { toggleMute(); this.updateMute(); });
    this.setScore(this.registry.get('scared') || 0);
  }

  updateMute() { this.muteText.setText(isMuted() ? 'M: Ton aus' : 'M: Ton an'); }

  setScore(n) {
    this.scoreText.setText(`x ${n}`);
    this.tweens.add({ targets: this.scoreText, scale: 1.3, duration: 80, yoyo: true });
  }

  setHearts(n) {
    this.hearts.forEach((h, i) => h.setTexture(i < n ? 'heart' : 'heart_empty'));
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
