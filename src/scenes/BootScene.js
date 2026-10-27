import Phaser from 'phaser';
import { makeCharacters, PEOPLE, DOGS } from '../textures/characters.js';
import { makeEnvironment, SKELHANDS, CAROUSEL_FRAMES } from '../textures/env.js';
import { makeCity } from '../textures/city.js';
import { makeBoss } from '../textures/boss.js';
import { makeInn } from '../textures/inn.js';
import { makeMetro } from '../textures/metro.js';
import { makeRace } from '../textures/race.js';
import { makeTitle } from '../textures/title.js';
import { makeFair } from '../textures/fair.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    makeCharacters(this);
    makeEnvironment(this);
    makeCity(this);
    makeBoss(this);
    makeInn(this);
    makeMetro(this);
    makeRace(this);
    makeTitle(this);
    makeFair(this);

    const a = this.anims;
    a.create({ key: 'ghost-float', frames: [{ key: 'ghost0' }, { key: 'ghost1' }], frameRate: 4, repeat: -1 });
    // mouth flaps twice as fast as the hem waves
    a.create({ key: 'ghost-talk', frames: [{ key: 'ghost_t0' }, { key: 'ghost0' }, { key: 'ghost_t1' }, { key: 'ghost1' }], frameRate: 8, repeat: -1 });
    a.create({ key: 'ghost-boo', frames: [{ key: 'ghost_b0' }, { key: 'ghost_b1' }], frameRate: 4, repeat: -1 });
    a.create({ key: 'friend-float', frames: [{ key: 'friend0' }, { key: 'friend1' }], frameRate: 4, repeat: -1 });
    a.create({ key: 'potion-fly', frames: [{ key: 'potion0' }, { key: 'potion1' }], frameRate: 8, repeat: -1 });
    for (const name of Object.keys(SKELHANDS)) {
      a.create({ key: `skelhand-${name}`, frames: [{ key: `skelhand_${name}_0` }, { key: `skelhand_${name}_1` }], frameRate: 5, repeat: -1 });
    }
    a.create({ key: 'carousel-spin', frames: [...Array(CAROUSEL_FRAMES).keys()].map((f) => ({ key: `carousel${f}` })), frameRate: 10, repeat: -1 });
    a.create({ key: 'bat-flap', frames: [{ key: 'bat0' }, { key: 'bat1' }], frameRate: 8, repeat: -1 });
    a.create({ key: 'torch', frames: [{ key: 'torch0' }, { key: 'torch1' }], frameRate: 6, repeat: -1 });
    a.create({ key: 'cat', frames: [{ key: 'cat0' }, { key: 'cat1' }], frameRate: 1, repeat: -1, repeatDelay: 2000 });
    for (const kind of Object.keys(DOGS)) {
      a.create({ key: `dog-walk-${kind}`, frames: [{ key: `dog_${kind}_0` }, { key: `dog_${kind}_1` }], frameRate: 7, repeat: -1 });
      a.create({ key: `dog-bark-${kind}`, frames: [{ key: `dog_${kind}_2` }, { key: `dog_${kind}_0` }], frameRate: 6, repeat: -1 });
    }
    for (const kind of Object.keys(PEOPLE)) {
      a.create({ key: `walk_${kind}`, frames: [{ key: `p_${kind}_0` }, { key: `p_${kind}_1` }], frameRate: 5, repeat: -1 });
    }
    this.registry.set('scared', 0);
    this.registry.set('startTime', Date.now());
    // Dev shortcuts: ?start=city, ?start=boss, ?start=boss-cellar, ?start=boss2 (attic),
    // ?start=race (scare race) or ?start=podium (its award ceremony with made-up results)
    const start = new URLSearchParams(location.search).get('start');
    if (start === 'boss' || start === 'boss-cellar' || start === 'boss2') {
      this.registry.set('bossLair', start === 'boss-cellar' ? 'cellar' : 'house');
      this.registry.set('bossStage', start === 'boss2' ? 2 : 1);
      this.scene.start('Boss');
    }
    else if (start === 'race') { this.registry.set('mode', 'race'); this.scene.start('World'); }
    else if (start === 'podium') {
      this.registry.set('raceResults', [{ i: 2, score: 14 }, { i: 0, score: 12 }, { i: 3, score: 9 }, { i: 1, score: 7 }]);
      this.scene.start('Podium');
    }
    else if (start === 'city') { this.registry.set('skipIntro', true); this.scene.start('World'); }
    else this.scene.start('Title');
  }
}
