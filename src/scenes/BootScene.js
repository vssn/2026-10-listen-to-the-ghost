import Phaser from 'phaser';
import { makeCharacters, PEOPLE } from '../textures/characters.js';
import { makeEnvironment } from '../textures/env.js';
import { makeCity } from '../textures/city.js';
import { makeBoss } from '../textures/boss.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    makeCharacters(this);
    makeEnvironment(this);
    makeCity(this);
    makeBoss(this);

    const a = this.anims;
    a.create({ key: 'ghost-float', frames: [{ key: 'ghost0' }, { key: 'ghost1' }], frameRate: 4, repeat: -1 });
    a.create({ key: 'friend-float', frames: [{ key: 'friend0' }, { key: 'friend1' }], frameRate: 4, repeat: -1 });
    a.create({ key: 'bat-flap', frames: [{ key: 'bat0' }, { key: 'bat1' }], frameRate: 8, repeat: -1 });
    a.create({ key: 'torch', frames: [{ key: 'torch0' }, { key: 'torch1' }], frameRate: 6, repeat: -1 });
    a.create({ key: 'cat', frames: [{ key: 'cat0' }, { key: 'cat1' }], frameRate: 1, repeat: -1, repeatDelay: 2000 });
    for (const kind of Object.keys(PEOPLE)) {
      a.create({ key: `walk_${kind}`, frames: [{ key: `p_${kind}_0` }, { key: `p_${kind}_1` }], frameRate: 5, repeat: -1 });
    }
    this.registry.set('scared', 0);
    this.registry.set('startTime', Date.now());
    // Dev shortcuts: ?start=city, ?start=boss or ?start=boss-cellar
    const start = new URLSearchParams(location.search).get('start');
    if (start === 'boss' || start === 'boss-cellar') {
      this.registry.set('bossLair', start === 'boss' ? 'house' : 'cellar');
      this.scene.start('Boss');
    }
    else if (start === 'city') { this.registry.set('skipIntro', true); this.scene.start('World'); }
    else this.scene.start('Title');
  }
}
