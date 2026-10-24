import Phaser from 'phaser';
import { FLOOR, CEIL } from '../config.js';
import { sfx } from '../sfx.js';

const ADD = Phaser.BlendModes.ADD;

// Every falling prop has: state ('up' | 'falling' | 'down' | 'repairing'),
// hitRect (where a spark knocks it over), covers(x) (would it crush someone
// standing at x) and trigger()/repair().

export class Chandelier {
  constructor(scene, x) {
    this.scene = scene;
    this.name = 'Kronleuchter';
    this.x = x;
    this.state = 'up';
    this.chainLen = 36;
    this.bodyY = CEIL + this.chainLen;
    this.chain = scene.add.tileSprite(x, CEIL, 3, this.chainLen, 'chain').setOrigin(0.5, 0).setDepth(5);
    this.stub = scene.add.tileSprite(x, CEIL, 3, 6, 'chain').setOrigin(0.5, 0).setDepth(5).setVisible(false);
    this.body = scene.add.image(x, this.bodyY, 'chandelier').setOrigin(0.5, 0).setDepth(6);
    this.glow = scene.add.image(x, this.bodyY + 6, 'glow').setTint(0xffb050).setBlendMode(ADD)
      .setScale(1.5).setAlpha(0.45).setDepth(6.5);
    scene.tweens.add({ targets: this.glow, alpha: 0.32, duration: 120, yoyo: true, repeat: -1, repeatDelay: 250 });
    this.hitRect = new Phaser.Geom.Rectangle(x - 22, CEIL, 44, this.chainLen + 22);
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
      targets: this.body, y: FLOOR - 22, duration: 430, ease: 'Quad.easeIn',
      onComplete: () => {
        this.body.setTexture('chandelier_broken').setOrigin(0.5, 1).setY(FLOOR);
        this.state = 'down';
        this.scene.onImpact(this, this.x, FLOOR - 6);
      },
    });
  }

  repair() {
    this.state = 'repairing';
    this.body.setTexture('chandelier').setOrigin(0.5, 0).setY(FLOOR - 22);
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

export class Bookshelf {
  constructor(scene, side) {
    this.scene = scene;
    this.name = 'Bücherregal';
    this.state = 'up';
    const left = side === 'L';
    this.dir = left ? 1 : -1;
    this.pivotX = left ? 44 : 382;
    this.sprite = scene.add.image(this.pivotX, FLOOR, 'bookshelf').setOrigin(left ? 1 : 0, 1).setDepth(7);
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

export class Armor {
  constructor(scene, x) {
    this.scene = scene;
    this.name = 'Ritterrüstung';
    this.x = x;
    this.state = 'up';
    this.sprite = scene.add.image(x, FLOOR, 'armor').setOrigin(0.5, 1).setDepth(7);
    this.hitRect = new Phaser.Geom.Rectangle(x - 10, FLOOR - 46, 20, 46);
  }

  // The armor always topples towards the wizard (it never liked him).
  covers(x) {
    const d = Math.abs(x - this.x);
    return d >= 8 && d <= 58;
  }

  trigger() {
    if (this.state !== 'up') return;
    this.state = 'falling';
    sfx.creak();
    const dir = this.scene.wizard.x < this.x ? -1 : 1;
    this.sprite.setOrigin(dir > 0 ? 1 : 0, 1).setX(this.x + dir * 10);
    this.scene.tweens.add({
      targets: this.sprite, angle: 90 * dir, duration: 520, ease: 'Quad.easeIn',
      onComplete: () => {
        this.state = 'down';
        this.fallDir = dir;
        this.scene.onImpact(this, this.x + dir * 33, FLOOR - 8, [this.x + dir * 8, this.x + dir * 58].sort((a, b) => a - b));
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
    scene.add.tileSprite(x, CEIL, 3, chainLen, 'chain').setOrigin(0.5, 0).setDepth(5);
    this.magic = scene.add.image(x, this.top + 17, 'glow').setTint(0xa040ff).setBlendMode(ADD).setScale(0.75).setAlpha(0.5).setDepth(6);
    scene.tweens.add({ targets: this.magic, alpha: 0.25, scale: 0.65, duration: 700, yoyo: true, repeat: -1 });
    this.friend = scene.add.sprite(x, this.top + 20, 'friend0').play('friend-float').setScale(0.7).setTint(tint).setDepth(7);
    this.cage = scene.add.image(x, this.top, 'cage').setOrigin(11.5 / 27, 0).setDepth(8);
    this.wiggle = scene.tweens.add({ targets: this.friend, x: x + 2, duration: 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  release() {
    this.open = true;
    this.cage.setTexture('cage_open');
    this.magic.destroy();
    this.wiggle.stop();
    sfx.repair();
  }
}
