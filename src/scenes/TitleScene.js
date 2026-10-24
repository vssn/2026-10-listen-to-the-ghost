import Phaser from 'phaser';
import { W, H, FONT, TITLE_FONT } from '../config.js';
import { initAudio, sfx } from '../sfx.js';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.add.image(0, 0, 'sky').setOrigin(0);
    this.add.image(W / 2 + 120, 50, 'glow').setTint(0xfff0c0).setBlendMode(Phaser.BlendModes.ADD).setScale(2.2).setAlpha(0.35);
    this.add.image(W / 2 + 120, 50, 'moon');
    this.add.image(-120, -120, 'far').setOrigin(0);
    this.add.image(-60, -100, 'mid').setOrigin(0);
    this.add.image(-200, 0, 'castle').setOrigin(0).setAlpha(0.9).setTint(0x8a80b0);
    this.add.rectangle(0, 205, W, 40, 0x0c0816).setOrigin(0);
    this.add.image(330, 206, 'tree2').setOrigin(0.5, 1);
    this.add.image(40, 206, 'tree1').setOrigin(0.5, 1).setFlipX(true);
    this.add.image(140, 206, 'tomb_rip').setOrigin(0.5, 1);
    this.add.image(175, 206, 'gargoyle_pedestal').setOrigin(0.5, 1);
    this.add.image(286, 206, 'pumpkin').setOrigin(0.5, 1);
    this.add.image(286, 200, 'glow').setTint(0xff8a1a).setBlendMode(Phaser.BlendModes.ADD).setScale(0.5).setAlpha(0.6);

    for (let i = 0; i < 5; i++) {
      const b = this.add.sprite(Phaser.Math.Between(0, W), Phaser.Math.Between(20, 90), 'bat0').play('bat-flap');
      this.tweens.add({ targets: b, x: b.x + Phaser.Math.Between(-80, 80), y: b.y + Phaser.Math.Between(-15, 15), duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ghost hero
    const gx = W / 2, gy = 132;
    const glow = this.add.image(gx, gy, 'glow').setTint(0xff9a3c).setBlendMode(Phaser.BlendModes.ADD).setScale(1.6).setAlpha(0.6);
    const ghost = this.add.sprite(gx, gy, 'ghost0').play('ghost-float').setScale(2);
    this.add.particles(0, 0, 'spark', {
      follow: ghost, followOffset: { x: -22, y: 2 },
      speed: { min: 10, max: 40 }, lifespan: 400, scale: { start: 1, end: 0 }, frequency: 40, quantity: 2,
      tint: [0xffe066, 0xffb020, 0xffffff], blendMode: 'ADD', gravityY: 30,
    });
    this.tweens.add({ targets: [ghost, glow], y: gy - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // every few seconds the ghost shouts BUH! with wide eyes and open mouth
    const boo = () => {
      ghost.play('ghost-boo');
      sfx.boo();
      this.tweens.add({ targets: ghost, scale: 2.2, duration: 110, yoyo: true });
      const t = this.add.text(ghost.x + 34, ghost.y - 30, 'BUH!', {
        fontFamily: FONT, fontSize: '16px', color: '#ffd27a', stroke: '#3a1500', strokeThickness: 3,
      }).setOrigin(0.5).setAngle(-8).setScale(0.4);
      this.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.easeOut' });
      this.tweens.add({ targets: t, alpha: 0, y: t.y - 10, delay: 700, duration: 300, onComplete: () => t.destroy() });
      this.time.delayedCall(1000, () => ghost.play('ghost-float'));
    };
    this.time.addEvent({ delay: 3600, loop: true, startAt: 1800, callback: boo });

    const title = this.add.text(W / 2, 40, 'Listen to the Ghost', {
      fontFamily: TITLE_FONT, fontSize: '36px', color: '#ff9a3c', stroke: '#2a0a00', strokeThickness: 4,
    }).setOrigin(0.5);
    this.tweens.add({ targets: title, angle: { from: -1.5, to: 1.5 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(W / 2, 68, 'Ein gruseliges Geister-Abenteuer', {
      fontFamily: FONT, fontSize: '8px', color: '#c8b8f0', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    const help = [
      'Pfeiltasten / WASD / Maus: fliegen',
      'LEERTASTE / Rechtsklick: BUH!',
      'M: Ton an/aus',
    ];
    this.add.text(W / 2, 176, help.join('\n'), {
      fontFamily: FONT, fontSize: '8px', color: '#9a8ac0', align: 'center', lineSpacing: 3,
    }).setOrigin(0.5);

    const start = this.add.text(W / 2, 222, 'LEERTASTE oder Klick zum Start', {
      fontFamily: FONT, fontSize: '8px', color: '#ffd27a', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });

    // The scene object is reused when returning to the title, so reset the flag.
    this.starting = false;
    const go = () => {
      if (this.starting) return;
      this.starting = true;
      initAudio();
      boo();
      this.registry.set('scared', 0);
      this.registry.set('startTime', Date.now());
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('World'));
    };
    this.input.keyboard.once('keydown-SPACE', go);
    this.input.keyboard.once('keydown-ENTER', go);
    this.input.once('pointerdown', go);
  }
}
