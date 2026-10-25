import Phaser from 'phaser';
import { FLOOR, CEIL } from '../config.js';
import { sfx } from '../sfx.js';

const ADD = Phaser.BlendModes.ADD;

// Every falling prop has: state ('up' | 'falling' | 'down' | 'repairing'),
// hitRect (where a spark knocks it over), covers(x) (would it crush someone
// standing at x) and trigger()/repair().

// Something hanging from the ceiling on a chain: chandeliers, planet models.
export class Hanging {
  constructor(scene, x, { key = 'chandelier', broken = 'chandelier_broken', glow = 0xffb050, chainLen = 36 } = {}) {
    this.scene = scene;
    this.x = x;
    this.key = key;
    this.brokenKey = broken;
    this.state = 'up';
    this.chainLen = chainLen;
    this.bodyY = CEIL + chainLen;
    this.chain = scene.add.tileSprite(x, CEIL, 3, chainLen, 'chain').setOrigin(0.5, 0).setDepth(5);
    this.stub = scene.add.tileSprite(x, CEIL, 3, 6, 'chain').setOrigin(0.5, 0).setDepth(5).setVisible(false);
    this.body = scene.add.image(x, this.bodyY, key).setOrigin(0.5, 0).setDepth(6);
    this.h = this.body.height;
    const w = this.body.width;
    this.glow = scene.add.image(x, this.bodyY + this.h / 2, 'glow').setTint(glow).setBlendMode(ADD)
      .setScale(1.5).setAlpha(0.45).setDepth(6.5);
    scene.tweens.add({ targets: this.glow, alpha: 0.32, duration: 120, yoyo: true, repeat: -1, repeatDelay: 250 });
    this.hitRect = new Phaser.Geom.Rectangle(x - w / 2, CEIL, w, chainLen + this.h);
  }

  covers(x) { return Math.abs(x - this.x) <= 26; }

  trigger() {
    if (this.state !== 'up') return;
    this.state = 'falling';
    sfx.creak();
    this.chain.setVisible(false);
    this.stub.setVisible(true);
    this.glow.setVisible(false);
    this.scene.tweens.add({
      targets: this.body, y: FLOOR - this.h, duration: 430, ease: 'Quad.easeIn',
      onComplete: () => {
        this.body.setTexture(this.brokenKey).setOrigin(0.5, 1).setY(FLOOR);
        this.state = 'down';
        this.scene.onImpact(this, this.x, FLOOR - 6);
      },
    });
  }

  repair() {
    this.state = 'repairing';
    this.body.setTexture(this.key).setOrigin(0.5, 0).setY(FLOOR - this.h);
    this.scene.tweens.add({
      targets: this.body, y: this.bodyY, duration: 900, ease: 'Back.easeOut',
      onComplete: () => {
        this.chain.setVisible(true);
        this.stub.setVisible(false);
        this.glow.setVisible(true);
        this.state = 'up';
      },
    });
  }
}

// Tall shelf against a side wall that tips over into the room.
export class Shelf {
  constructor(scene, side, key = 'bookshelf') {
    this.scene = scene;
    this.state = 'up';
    const left = side === 'L';
    this.dir = left ? 1 : -1;
    this.pivotX = left ? 44 : 382;
    this.sprite = scene.add.image(this.pivotX, FLOOR, key).setOrigin(left ? 1 : 0, 1).setDepth(7);
    this.hitRect = new Phaser.Geom.Rectangle(left ? 12 : 382, FLOOR - 120, 32, 120);
    this.zone = left ? [44, 164] : [262, 382];
  }

  get x() { return this.pivotX - this.dir * 16; }

  covers(x) { return x >= this.zone[0] && x <= this.zone[1]; }

  trigger() {
    if (this.state !== 'up') return;
    this.state = 'falling';
    sfx.creak();
    this.scene.tweens.add({
      targets: this.sprite, angle: 90 * this.dir, duration: 650, ease: 'Quad.easeIn',
      onComplete: () => {
        this.state = 'down';
        this.scene.onImpact(this, (this.zone[0] + this.zone[1]) / 2, FLOOR - 16);
      },
    });
  }

  repair() {
    this.state = 'repairing';
    this.scene.tweens.add({
      targets: this.sprite, angle: 0, duration: 900, ease: 'Back.easeOut',
      onComplete: () => { this.state = 'up'; },
    });
  }
}

// Free-standing thing on the floor (armor, telescope, armillary sphere) that
// always topples towards the wizard – it never liked him.
export class Topple {
  constructor(scene, x, key = 'armor') {
    this.scene = scene;
    this.x = x;
    this.state = 'up';
    this.sprite = scene.add.image(x, FLOOR, key).setOrigin(0.5, 1).setDepth(7);
    this.w = this.sprite.width;
    this.h = this.sprite.height;
    this.hitRect = new Phaser.Geom.Rectangle(x - this.w / 2, FLOOR - this.h, this.w, this.h);
  }

  covers(x) {
    const d = Math.abs(x - this.x);
    return d >= this.w / 2 - 2 && d <= this.h + this.w / 2 + 2;
  }

  trigger() {
    if (this.state !== 'up') return;
    this.state = 'falling';
    sfx.creak();
    const dir = this.scene.boss.x < this.x ? -1 : 1;
    const half = this.w / 2;
    this.sprite.setOrigin(dir > 0 ? 1 : 0, 1).setX(this.x + dir * half);
    this.scene.tweens.add({
      targets: this.sprite, angle: 90 * dir, duration: 520, ease: 'Quad.easeIn',
      onComplete: () => {
        this.state = 'down';
        const a = this.x + dir * (half - 2), b = this.x + dir * (this.h + half + 2);
        this.scene.onImpact(this, (a + b) / 2, FLOOR - 8, [Math.min(a, b), Math.max(a, b)]);
      },
    });
  }

  repair() {
    this.state = 'repairing';
    this.scene.tweens.add({
      targets: this.sprite, angle: 0, duration: 800, ease: 'Back.easeOut',
      onComplete: () => {
        this.sprite.setOrigin(0.5, 1).setX(this.x);
        this.state = 'up';
      },
    });
  }
}

export class Cage {
  constructor(scene, x, chainLen, tint) {
    this.scene = scene;
    this.x = x;
    this.top = CEIL + chainLen;
    this.open = false;
    this.chain = scene.add.tileSprite(x, CEIL, 3, chainLen, 'chain').setOrigin(0.5, 0).setDepth(5);
    this.magic = scene.add.image(x, this.top + 17, 'glow').setTint(0xa040ff).setBlendMode(ADD).setScale(0.75).setAlpha(0.5).setDepth(6);
    scene.tweens.add({ targets: this.magic, alpha: 0.25, scale: 0.65, duration: 700, yoyo: true, repeat: -1 });
    this.friend = scene.add.sprite(x, this.top + 20, 'friend0').play('friend-float').setScale(0.7).setTint(tint).setDepth(7);
    this.cage = scene.add.image(x, this.top, 'cage').setOrigin(11.5 / 27, 0).setDepth(8);
    this.wiggle = scene.tweens.add({ targets: this.friend, x: x + 2, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  // The wizard whisks the cage away (it reappears in the next room).
  vanish() {
    const s = this.scene;
    s.poof(this.x, this.top + 14, 12);
    s.tweens.add({ targets: [this.chain, this.magic, this.friend, this.cage], alpha: 0, duration: 250 });
  }

  release() {
    this.open = true;
    this.cage.setTexture('cage_open');
    this.magic.destroy();
    this.wiggle.stop();
    sfx.repair();
  }
}
