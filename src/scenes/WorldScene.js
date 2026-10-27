import Phaser from 'phaser';
import { t } from '../i18n.js';
import {
  WORLD_W, WORLD_H, GROUND_Y, CASTLE_END, FOREST_END, HOUSE_COUNT, HOUSE_W, HOUSE_H, STOREY_H, houseX, LOTS, DEPTH, FONT, LAYER_BASE,
  METRO_HOUSES,
} from '../config.js';
import { Ghost } from '../objects/Ghost.js';
import { House } from '../objects/House.js';
import { Inn } from '../objects/Inn.js';
import { Metro } from '../objects/Metro.js';
import { Bats } from '../objects/Bats.js';
import { Bubbles } from '../objects/Bubbles.js';
import { sfx, playMusic, stopMusic } from '../sfx.js';
import { Race } from '../objects/Race.js';
import { Fair, FAIR_X0, FAIR_X1 } from '../objects/Fair.js';
import { SKELHANDS } from '../textures/env.js';
import { CLOTHES } from '../textures/city.js';

const HAND_KINDS = Object.keys(SKELHANDS);

const GRAVE_X = 150;
const CASTLE_Y = GROUND_Y - 262;
// Camera centre while above ground: keeps the whole street in view.
const STREET_VIEW_Y = GROUND_Y - 82;
// Camera centre while looking down a cellar stair.
const CELLAR_VIEW_Y = GROUND_Y + 56;
// How close (horizontally) the ghost may come before residents flee on their own.
const SCARE_RADIUS = 32;
// The scare race starts at the far end of the castle ruin: first through the
// forest with its Halloween fair, then on into town.
const RACE_START_X = CASTLE_END - 30;

export class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }

  create() {
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.scene.bringToTop('UI');
    this.flags = {};
    this.transitioning = false;
    this.haunts = [];
    this.isRace = this.registry.get('mode') === 'race';
    this.race = null;

    this.buildBackdrop();
    this.buildCastle();
    this.buildForest();
    this.buildCity();

    this.bats = new Bats(this);
    this.bats.add(4, { x0: 60, x1: 620, y0: GROUND_Y - 170, y1: GROUND_Y - 80 });
    this.bats.add(16, { x0: CASTLE_END + 40, x1: FOREST_END - 40, y0: GROUND_Y - 230, y1: GROUND_Y - 60 });
    this.bats.add(10, { x0: FOREST_END + 20, x1: WORLD_W - 60, y0: 30, y1: GROUND_Y - 240 });

    this.fog = this.add.tileSprite(0, GROUND_Y - 30, WORLD_W, 36, 'fog').setOrigin(0).setDepth(DEPTH.fog).setAlpha(0.7);

    // in the scare race the ghost does not go back into the castle
    const [gx, gy] = this.isRace ? [RACE_START_X, GROUND_Y - 30] : [GRAVE_X, GROUND_Y + 16];
    this.ghost = new Ghost(this, gx, gy, { minX: this.isRace ? CASTLE_END - 120 : 8, maxX: WORLD_W - 8, minY: 16, maxY: WORLD_H - 14 });
    this.ghost.constrain = this.constrain.bind(this);
    this.camY = STREET_VIEW_Y;
    this.camTarget = this.add.zone(gx, this.camY, 1, 1);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.startFollow(this.camTarget, true, 0.12, 1);
    cam.fadeIn(800);

    this.bubbles = new Bubbles(this);
    this.events.off('ghost-boo');
    this.events.on('ghost-boo', this.onBoo, this);
    if (this.isRace) {
      // no hints and no wizard – just the race (the music starts with the GO)
      stopMusic();
      this.heroMound.setTexture('mound_open');
      Object.assign(this.flags, { city: true, shaft: true, metro: true });
      this.inn.greeted = true;
      this.race = new Race(this, RACE_START_X);
      return;
    }
    playMusic('world');
    if (this.registry.get('skipIntro')) {
      this.registry.set('skipIntro', false);
      this.ghost.x = FOREST_END + 10;
      this.ghost.y = GROUND_Y - 40;
      this.heroMound.setTexture('mound_open');
    } else {
      this.intro();
    }
  }

  ui(ev, ...args) { this.game.events.emit(ev, ...args); }

  // Sounds from far off-screen (the friends' victims in the race) stay quiet.
  isAudible(x, y) {
    const v = this.cameras.main.worldView;
    return x > v.x - 40 && x < v.right + 40 && y > v.y - 40 && y < v.bottom + 40;
  }

  // Register a prop that plays an animation when the ghost floats within `radius`.
  addHaunt(x, y, radius, play, cooldown = 4) {
    this.haunts.push({ x, y, r2: radius * radius, play, cooldown, wait: 0 });
  }

  // Toggle something on/off a few times; `set(on)` is called for every step.
  flicker(set, steps = 7, ms = 90, after) {
    let n = 0;
    this.time.addEvent({
      delay: ms, repeat: steps - 1,
      callback: () => {
        n++;
        const last = n === steps;
        set(last ? true : n % 2 === 1, last);
        if (last && after) after();
      },
    });
    set(false, false);
  }

  // The ghost thinks out loud in a bubble above its hat (above the grave while still buried).
  ghostSays(text, ms) {
    const g = this.ghost;
    this.bubbles.say('ghost', () => ({ x: g.x, y: Math.min(g.y, GROUND_Y - 6) - 15 }), text, { style: 'ghost', ms });
  }

  // ---------------------------------------------------------------- building
  buildBackdrop() {
    this.add.image(0, 0, 'sky').setOrigin(0).setScrollFactor(0).setDepth(DEPTH.sky);
    this.add.image(330, 46, 'glow').setTint(0xfff0c0).setBlendMode(Phaser.BlendModes.ADD).setScale(2.4).setAlpha(0.3)
      .setScrollFactor(0).setDepth(DEPTH.moon);
    this.add.image(330, 46, 'moon').setScrollFactor(0).setDepth(DEPTH.moon);
    this.add.image(0, GROUND_Y - LAYER_BASE, 'far').setOrigin(0).setScrollFactor(0.3, 1).setDepth(DEPTH.far);
    this.add.image(0, GROUND_Y - LAYER_BASE, 'mid').setOrigin(0).setScrollFactor(0.6, 1).setDepth(DEPTH.mid);
    this.add.image(0, GROUND_Y - 4, 'ground').setOrigin(0).setDepth(DEPTH.ground);
    this.add.tileSprite(0, GROUND_Y + 38, WORLD_W, WORLD_H - GROUND_Y - 38, 'earth').setOrigin(0).setDepth(DEPTH.earth);
  }

  glowAt(x, y, tint, scale, alpha, flicker = true) {
    const g = this.add.image(x, y, 'glow').setTint(tint).setBlendMode(Phaser.BlendModes.ADD)
      .setScale(scale).setAlpha(alpha).setDepth(DEPTH.props + 0.5);
    if (flicker) {
      this.tweens.add({
        targets: g, alpha: alpha * 0.65, scale: scale * 0.94, duration: Phaser.Math.Between(90, 180),
        yoyo: true, repeat: -1, repeatDelay: Phaser.Math.Between(0, 400),
      });
    }
    return g;
  }

  buildCastle() {
    this.add.image(0, CASTLE_Y, 'castle').setOrigin(0).setDepth(DEPTH.castle);
    for (const x of [110, 300, 450, 610]) {
      this.add.sprite(x, GROUND_Y - 116, 'torch0').play({ key: 'torch', startFrame: x % 2 }).setDepth(DEPTH.props);
      this.glowAt(x, GROUND_Y - 122, 0xff8a1a, 1.2, 0.55);
    }
    // graves where a skeleton hand may wave back after a BUH (x of the hand)
    this.graves = [];
    for (const [x, key] of [[215, 'tomb_round'], [330, 'tomb_rip'], [520, 'tomb_round']]) {
      this.add.image(x, GROUND_Y + 1, key).setOrigin(0.5, 1).setDepth(DEPTH.props);
      this.add.image(x, GROUND_Y + 3, 'mound').setOrigin(0.5, 1).setDepth(DEPTH.ground + 0.1);
      this.graves.push({ x: x + 9 });
    }
    // crypt stones and grave slabs
    for (const x of [72, 400, 585]) {
      this.add.image(x, GROUND_Y + 1, 'crypt').setOrigin(0.5, 1).setDepth(DEPTH.props);
      this.graves.push({ x: x + 20 });
    }
    for (const x of [250, 455]) {
      this.add.image(x, GROUND_Y + 3, 'slab').setOrigin(0.5, 1).setDepth(DEPTH.ground + 0.1);
      this.graves.push({ x });
    }
    // gargoyles: on pedestals, on the broken pillars and on the gate tower
    const gargoyles = [
      [272, GROUND_Y + 1, 'gargoyle_pedestal', false], [36, GROUND_Y + 1, 'gargoyle_pedestal', false],
      [159, CASTLE_Y + 73, 'gargoyle', true], [419, CASTLE_Y + 73, 'gargoyle', false],
      [645, CASTLE_Y + 10, 'gargoyle', true], [771, CASTLE_Y + 10, 'gargoyle', false],
    ];
    for (const [x, y, key, flip] of gargoyles) {
      this.add.image(x, y, key).setOrigin(0.5, 1).setDepth(DEPTH.props).setFlipX(flip);
      const eyeY = y - (key === 'gargoyle' ? 20 : 38);
      this.glowAt(x + (flip ? -5 : 5), eyeY, 0xff3030, 0.12, 0.7);
    }
    this.heroTomb = this.add.image(GRAVE_X, GROUND_Y + 1, 'tomb_rip').setOrigin(0.5, 1).setDepth(DEPTH.props);
    this.heroMound = this.add.image(GRAVE_X, GROUND_Y + 3, 'mound').setOrigin(0.5, 1).setDepth(DEPTH.ground + 0.1);
    this.dirt = this.add.particles(0, 0, 'spark', {
      speed: { min: 30, max: 90 }, angle: { min: 220, max: 320 }, gravityY: 260, lifespan: 700,
      tint: [0x4a362a, 0x3a2a22, 0x2f4a28], emitting: false,
    }).setDepth(DEPTH.fx);
  }

  buildForest() {
    const R = new Phaser.Math.RandomDataGenerator(['forest']);
    // in the scare race the Halloween fair takes this stretch of the forest
    const free = (x) => !this.isRace || x < FAIR_X0 - 12 || x > FAIR_X1 + 12;
    for (let x = CASTLE_END + 30; x < FOREST_END - 40; x += R.between(55, 90)) {
      this.add.image(x, GROUND_Y + 2, `tree${R.between(0, 3)}`).setOrigin(0.5, 1).setDepth(DEPTH.backTrees)
        .setAlpha(0.75).setFlipX(R.frac() < 0.5);
    }
    for (const x of [905, 1180, 1470].filter(free)) {
      this.add.image(x, GROUND_Y + 6, `tree${R.between(0, 2)}`).setOrigin(0.5, 1).setDepth(DEPTH.fgTrees).setFlipX(x % 2 === 0);
    }
    for (let x = CASTLE_END + 10; x < FOREST_END; x += R.between(40, 110)) {
      this.add.image(x, GROUND_Y + 3, 'bush').setOrigin(0.5, 1).setDepth(DEPTH.ground + 0.2);
    }
    for (const x of [835, 1010, 1190, 1520, 1630].filter(free)) {
      const p = this.add.image(x, GROUND_Y + 1, 'pumpkin').setOrigin(0.5, 1).setDepth(DEPTH.props);
      const glow = this.glowAt(x, GROUND_Y - 5, 0xff8a1a, 0.55, 0.65);
      this.addHaunt(x, GROUND_Y - 8, 30, () => {
        sfx.fizzle();
        this.flicker((on) => { p.setTexture(on ? 'pumpkin' : 'pumpkin_off'); glow.setVisible(on); }, 9, 70);
      });
    }
    const tombs = [
      [935, 'tomb_old'], [962, 'tomb_rip'], [1120, 'tomb_round'], [1142, 'tomb_old'], [1350, 'tomb_old'],
      [1390, 'tomb_rip'], [1412, 'tomb_round'], [1565, 'tomb_old'],
    ];
    for (const [x, key] of tombs.filter(([x]) => free(x))) {
      this.add.image(x, GROUND_Y + 1, key).setOrigin(0.5, 1).setDepth(DEPTH.props).setFlipX(x % 3 === 0);
      this.graves.push({ x: x + 9 });
    }
    for (const x of [880, 948, 1060, 1135, 1372, 1400, 1480, 1590].filter(free)) {
      this.add.image(x, GROUND_Y + 3, 'brush').setOrigin(0.5, 1).setDepth(DEPTH.props + 0.1).setFlipX(x % 2 === 0);
    }
    // the abandoned playground makes way for the fair
    if (this.isRace) this.fair = new Fair(this);
    else this.buildPlayground();
    this.add.image(1665, GROUND_Y + 1, 'sign').setOrigin(0.5, 1).setDepth(DEPTH.props);
    const owl = this.add.image(1659, GROUND_Y - 28, 'owl').setOrigin(0.5, 1).setDepth(DEPTH.props);
    this.time.addEvent({ delay: 2600, loop: true, callback: () => { owl.setFlipX(!owl.flipX); } });
    this.addHaunt(1659, GROUND_Y - 34, 34, () => {
      sfx.hoot();
      const frames = ['owl_l', 'owl_r', 'owl_l', 'owl_r', 'owl_u', 'owl_b', 'owl'];
      frames.forEach((f, k) => this.time.delayedCall(k * 220, () => owl.setTexture(f)));
    }, 3);
    // fireflies
    this.add.particles(0, 0, 'spark', {
      x: { min: CASTLE_END, max: FOREST_END }, y: { min: GROUND_Y - 80, max: GROUND_Y - 10 },
      speed: { min: 2, max: 8 }, lifespan: 3000, frequency: 120, scale: { start: 0.5, end: 0.5 },
      alpha: { start: 0.9, end: 0 }, tint: 0xd8ff6a, blendMode: 'ADD',
    }).setDepth(DEPTH.props);
  }

  // An abandoned playground in the forest: swings, seesaw and roundabout start
  // moving on their own when the ghost floats past.
  buildPlayground() {
    const D = DEPTH.props;
    // a value from 0 to 1 over `ms`, driving a fading motion
    const fade = (ms, step) => this.tweens.addCounter({ from: 0, to: 1, duration: ms, onUpdate: (tw) => step(tw.getValue()) });

    const sx = 1225;
    this.add.image(sx, GROUND_Y + 1, 'swing_frame').setOrigin(0.5, 1).setDepth(D);
    const barY = GROUND_Y + 1 - 36 + 3;
    const seats = [
      this.add.image(sx - 8, barY, 'swing_seat').setOrigin(0.5, 0).setDepth(D - 0.1),
      this.add.image(sx + 8, barY, 'swing_seat_broken').setOrigin(0.5, 0).setDepth(D - 0.1).setAngle(4),
    ];
    this.addHaunt(sx, GROUND_Y - 20, 40, () => {
      seats.forEach((seat, k) => {
        const amp = k ? 22 : 34, phase = k * 0.7;
        let lastSide = 0;
        fade(4200 + k * 600, (p) => {
          const a = amp * Math.sin(p * Math.PI * 2 * 4 + phase) * (1 - p);
          seat.setAngle(a + (k ? 4 * p : 0));
          const side = Math.sign(a);
          if (k === 0 && side !== lastSide && Math.abs(a) > 4) { sfx.swingSqueak(); lastSide = side; }
        });
      });
    }, 5);

    const wx = 1272, pivotY = GROUND_Y + 1 - 8;
    this.add.image(wx, GROUND_Y + 1, 'seesaw_base').setOrigin(0.5, 1).setDepth(D);
    const plank = this.add.image(wx, pivotY, 'seesaw_plank').setOrigin(0.5, 0.65).setDepth(D - 0.1).setAngle(14);
    this.addHaunt(wx, GROUND_Y - 16, 38, () => {
      const from = plank.angle;
      let lastSide = Math.sign(from);
      fade(2600, (p) => {
        // tips over to the other side two and a half times and comes to rest there
        const a = from * Math.cos(p * Math.PI * 5);
        plank.setAngle(a);
        if (Math.abs(a) > 13 && Math.sign(a) !== lastSide) { lastSide = Math.sign(a); sfx.thud(); }
      });
    }, 4);

    const cx = 1318;
    const carousel = this.add.sprite(cx, GROUND_Y + 1, 'carousel0').setOrigin(0.5, 1).setDepth(D);
    this.addHaunt(cx, GROUND_Y - 14, 36, () => {
      carousel.play('carousel-spin');
      sfx.creak();
      fade(4500, (p) => {
        // pushed hard, then slowly running down
        carousel.anims.timeScale = Math.max(0.05, 2.4 * (1 - p) * (1 - p));
        if (p >= 1) carousel.anims.stop();
      });
    }, 5);
  }

  buildCity() {
    // The wizard hides in the back third of the street – upstairs or in a cellar.
    this.wizardIndex = this.isRace ? -1 : Phaser.Math.Between(Math.ceil(HOUSE_COUNT * 2 / 3), HOUSE_COUNT - 1);
    this.wizardLair = Math.random() < 0.5 ? 'house' : 'cellar';
    // a third of the houses keep a dog
    const dogCandidates = [...Array(HOUSE_COUNT).keys()]
      .filter((i) => !(i === this.wizardIndex && this.wizardLair === 'house'));
    const dogHouses = new Set(Phaser.Utils.Array.Shuffle(dogCandidates).slice(0, Math.round(HOUSE_COUNT / 3)));
    this.houses = [];
    for (let i = 0; i < HOUSE_COUNT; i++) {
      this.houses.push(new House(this, i, houseX(i), i === this.wizardIndex ? this.wizardLair : null, {
        cellar: !METRO_HOUSES.includes(i), dog: dogHouses.has(i),
      }));
    }
    this.wizardHouse = this.houses[this.wizardIndex];
    const innLot = LOTS.find((l) => l.inn);
    this.inn = new Inn(this, innLot.x);
    this.metro = new Metro(this);
    this.buildings = [...this.houses, this.inn, this.metro];
    if (this.fair) this.buildings.push(this.fair);
    this.buildLaundry();
    this.buildFrontGardens();
    this.shafts = [...this.houses.filter((h) => h.shaft).map((h) => h.shaft), ...this.metro.shafts];
    this.walkable = [...this.houses.flatMap((h) => h.walkable), ...this.metro.walkable];

    // gas lanterns in every gap between houses
    const lastLot = LOTS[LOTS.length - 1];
    const lastEnd = lastLot.x + lastLot.w;
    const lamps = [FOREST_END + 35, lastEnd + 45];
    for (let i = 1; i < LOTS.length; i++) lamps.push(LOTS[i].x - 40);
    const nearMetro = (x) => this.metro.exitXs.some((ex) => Math.abs(x - ex) < 60);
    for (const x of lamps.filter((lx) => !nearMetro(lx))) {
      this.add.image(x, GROUND_Y + 8, 'lamp').setOrigin(0.5, 1).setDepth(DEPTH.props);
      const headY = GROUND_Y + 8 - 66 + 9;
      const cone = this.add.image(x, headY + 4, 'lightcone').setOrigin(0.5, 0).setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(DEPTH.props - 0.5).setAlpha(0.8);
      const g = this.glowAt(x, headY, 0xffc860, 0.8, 0.75);
      const dark = this.add.rectangle(x, headY, 6, 8, 0x2a2418).setDepth(DEPTH.props + 0.1).setVisible(false);
      this.addHaunt(x, headY + 20, 34, () => {
        sfx.fizzle();
        // flicker, stay dark for a moment, then come back on
        this.flicker((on) => { cone.setVisible(on); g.setVisible(on); dark.setVisible(!on); }, 4, 80, () => {
          cone.setVisible(false); g.setVisible(false); dark.setVisible(true);
          this.time.delayedCall(900, () => {
            this.flicker((on) => { cone.setVisible(on); g.setVisible(on); dark.setVisible(!on); }, 5, 70);
          });
        });
      }, 5);
      this.time.addEvent({
        delay: Phaser.Math.Between(2000, 6000), loop: true,
        callback: () => {
          if (Math.random() < 0.5) return;
          this.tweens.add({ targets: [cone, g], alpha: 0.1, duration: 50, yoyo: true, repeat: 2 });
        },
      });
    }
    // 50s cars parked in front of the houses (never over a cellar stair)
    for (let i = 0; i < HOUSE_COUNT; i++) {
      if (i % 3 === 2) continue;
      const x = houseX(i) + 75 + ((i * 37) % 30) - 15;
      this.add.image(x, GROUND_Y + 27, `car${i % 4}`).setOrigin(0.5, 1).setDepth(DEPTH.cars).setFlipX(i % 2 === 1);
    }
    this.add.image(innLot.x + 60, GROUND_Y + 27, 'car2').setOrigin(0.5, 1).setDepth(DEPTH.cars);
    this.add.image(innLot.x + 172, GROUND_Y + 27, 'car3').setOrigin(0.5, 1).setDepth(DEPTH.cars).setFlipX(true);
    // street clutter in the gaps without stairs (odd house → even house)
    for (let i = 2; i < HOUSE_COUNT; i += 2) {
      const gx = houseX(i) - 40;
      if (nearMetro(gx)) continue;
      if (i % 4 === 2) {
        this.add.image(gx - 14, GROUND_Y + 8, 'trash').setOrigin(0.5, 1).setDepth(DEPTH.props);
        this.add.sprite(gx - 14, GROUND_Y - 5, 'cat0').setOrigin(0.5, 1).setDepth(DEPTH.props).play('cat');
      } else {
        this.add.image(gx + 14, GROUND_Y + 8, 'hydrant').setOrigin(0.5, 1).setDepth(DEPTH.props);
      }
    }
    const fenceX = lastEnd + 70;
    this.add.image(fenceX, GROUND_Y + 8, 'fence').setOrigin(0, 1).setDepth(DEPTH.props);
    this.add.text(fenceX + 12, GROUND_Y - 44, t('world.alley'), {
      fontFamily: FONT, fontSize: '8px', color: '#8a7a9a', align: 'center', lineSpacing: 2,
    }).setDepth(DEPTH.props);
  }

  // Some houses have an overgrown hedge by the door; some have glowing pumpkins beside it.
  buildFrontGardens() {
    const R = new Phaser.Math.RandomDataGenerator(['gardens']);
    for (const h of this.houses) {
      if (R.frac() < 0.5) {
        const key = R.frac() < 0.5 ? 'hedge' : 'hedge2';
        this.add.image(h.x + R.between(12, 26), GROUND_Y + 5, key).setOrigin(0.5, 1).setDepth(DEPTH.props);
      }
      if (R.frac() < 0.45) {
        const px = R.frac() < 0.5 ? h.x + 52 : h.x + 102;
        this.add.image(px, GROUND_Y + 1, 'pumpkin').setOrigin(0.5, 1).setDepth(DEPTH.props);
        this.glowAt(px, GROUND_Y - 5, 0xff8a1a, 0.7, 0.8);
      }
    }
  }

  // Washing lines strung between neighbouring houses, with clothes swaying in the wind.
  buildLaundry() {
    const R = new Phaser.Math.RandomDataGenerator(['laundry']);
    LOTS.forEach((lot, k) => {
      const next = LOTS[k + 1];
      if (!next || lot.inn || next.inn || R.frac() < 0.45) return;
      const y = GROUND_Y - HOUSE_H + 2 * STOREY_H + R.between(4, 10);
      const x0 = lot.x + HOUSE_W - 4, x1 = next.x + 4;
      const sag = R.between(4, 7);
      const yAt = (t) => y + sag * 4 * t * (1 - t);
      const line = this.add.graphics().setDepth(DEPTH.facade + 0.3);
      line.lineStyle(1, 0x9a8a72, 0.9); // a light rope, readable against the night sky
      line.beginPath();
      line.moveTo(x0, y);
      for (let t = 1 / 16; t <= 1; t += 1 / 16) line.lineTo(x0 + (x1 - x0) * t, yAt(t));
      line.strokePath();
      const n = R.between(3, 5);
      for (let c = 0; c < n; c++) {
        const t = (c + 0.5) / n;
        const cloth = this.add.image(x0 + (x1 - x0) * t, yAt(t), Phaser.Utils.Array.GetRandom(CLOTHES))
          .setOrigin(0.5, 0).setDepth(DEPTH.facade + 0.35);
        this.tweens.add({
          targets: cloth, angle: { from: -6, to: 6 }, duration: R.between(1200, 1900),
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: R.between(0, 800),
        });
      }
    });
  }

  // Below the street the ghost may only float in stair shafts and cellars.
  canBeAt(x, y) {
    return y <= GROUND_Y - 12 || this.walkable.some((r) => r.contains(x, y));
  }

  constrain(nx, ny, ox, oy, dt) {
    if (this.canBeAt(nx, ny)) return [nx, ny];
    // blocked on one axis: slide along the wall on the other one
    if (ny !== oy && this.canBeAt(ox, ny)) return [ox, ny];
    if (nx !== ox && this.canBeAt(nx, oy)) return [nx, oy];
    // pushing down from the street or up from below next to a stair shaft glides the
    // ghost into it – but never against the player's own sideways push
    const towardsOpening = (ny > oy && oy < GROUND_Y) || (ny < oy && oy > GROUND_Y - 20);
    if (towardsOpening) {
      const s = this.shafts.find((sh) => Math.abs(sh.cx - ox) < (sh.reach || 24));
      if (s && (nx - ox) * (s.cx - ox) >= 0) {
        const x = ox + Phaser.Math.Clamp(s.cx - ox, -90 * dt, 90 * dt);
        if (this.canBeAt(x, ny)) return [x, ny];
        if (this.canBeAt(x, oy)) return [x, oy];
      }
    }
    return [ox, oy];
  }

  // ---------------------------------------------------------------- story
  intro() {
    const g = this.ghost;
    g.locked = true;
    g.clamp = false;
    g.sprite.setDepth(DEPTH.ground - 0.5);
    g.glow.setDepth(DEPTH.ground - 0.6).setAlpha(0);
    g.sparkler.emitting = false;
    g.tipGlow.setVisible(false);

    this.time.delayedCall(300, () => this.ghostSays(t('ghost.intro'), 3000));
    const shakeTomb = () => {
      this.tweens.add({ targets: this.heroTomb, x: GRAVE_X + 1, duration: 50, yoyo: true, repeat: 5 });
      this.dirt.explode(12, GRAVE_X, GROUND_Y);
      sfx.dirt();
    };
    this.time.delayedCall(1200, shakeTomb);
    this.time.delayedCall(2000, shakeTomb);
    this.time.delayedCall(2800, () => {
      shakeTomb();
      this.dirt.explode(30, GRAVE_X, GROUND_Y);
      this.heroMound.setTexture('mound_open');
      this.cameras.main.shake(250, 0.006);
      sfx.rise();
      this.tweens.add({ targets: g.glow, alpha: 0.55, duration: 1200 });
      this.tweens.add({
        targets: g, y: GROUND_Y - 34, duration: 1800, ease: 'Sine.easeOut',
        onUpdate: () => { if (g.y < GROUND_Y - 14) { g.sprite.setDepth(DEPTH.ghost); g.glow.setDepth(DEPTH.glow); } },
        onComplete: () => {
          g.locked = false;
          g.clamp = true;
          g.sparkler.emitting = true;
          g.tipGlow.setVisible(true);
          this.ghostSays(t('ghost.friends'));
          this.ghostSays(t('ghost.caged'));
          this.ui('ui:objective', t('obj.findWizard'));
        },
      });
    });
  }

  addScore(n, x, y) {
    if (this.race) { this.race.add(0, n, x, y); return; }
    const total = (this.registry.get('scared') || 0) + n;
    this.registry.set('scared', total);
    this.ui('ui:score', total);
    sfx.point();
    const t = this.add.text(x, y - 20, `+${n}`, {
      fontFamily: FONT, fontSize: '8px', color: '#ffd27a', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH.text);
    this.tweens.add({ targets: t, y: t.y - 14, alpha: 0, duration: 900, delay: 200, onComplete: () => t.destroy() });
  }

  onBoo(x, y) {
    this.bats.followNear(x, y, 110);
    this.raiseHands(x, y);
    for (const h of this.buildings) {
      if (!h.contains(x, y) && !h.inCellar(x, y)) continue;
      const n = h.scareAt(x, y, 85);
      if (n > 0) this.addScore(n, x, y);
    }
  }

  // A BUH near graves makes a skeleton hand pop up and wave hello.
  raiseHands(x, y) {
    if (y < GROUND_Y - 130) return;
    const near = this.graves.filter((gr) => !gr.busy && Math.abs(gr.x - x) < 80)
      .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x)).slice(0, 2);
    near.forEach((gr, k) => this.time.delayedCall(250 + k * 300, () => this.raiseHand(gr, k === 0)));
  }

  raiseHand(gr, greet) {
    gr.busy = true;
    // every hand is different: size, missing fingers and the way it waves
    const kind = Phaser.Utils.Array.GetRandom(HAND_KINDS);
    const big = kind.startsWith('big');
    const style = Phaser.Utils.Array.GetRandom(big ? ['slow', 'pump'] : ['sway', 'wiggle', 'pump', 'sway']);
    const hand = this.add.sprite(gr.x, GROUND_Y + 1, `skelhand_${kind}_0`).setOrigin(0.5, 1)
      .setDepth(DEPTH.props + 0.2).setFlipX(Math.random() < 0.5);
    const h = hand.height;
    const st = { p: 0 };
    // grow out of the ground by revealing the texture from its top
    const apply = () => {
      const vis = Math.round(h * st.p);
      hand.setCrop(0, 0, hand.width, vis);
      hand.y = GROUND_Y + 1 + (h - vis);
    };
    apply();
    this.dirt.explode(10, gr.x, GROUND_Y);
    sfx.dirt();
    this.tweens.add({
      targets: st, p: 1, duration: 450, ease: 'Back.easeOut', onUpdate: apply,
      onComplete: () => {
        sfx.rattle();
        hand.play(`skelhand-${kind}`);
        if (style === 'sway') {
          this.tweens.add({ targets: hand, angle: { from: -14, to: 14 }, duration: 260, yoyo: true, repeat: 3, ease: 'Sine.easeInOut' });
        } else if (style === 'slow') {
          hand.anims.timeScale = 0.6;
          this.tweens.add({ targets: hand, angle: { from: -8, to: 8 }, duration: 480, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
        } else if (style === 'wiggle') {
          // just the finger bones waggling, fast
          hand.anims.timeScale = 2.6;
          this.tweens.add({ targets: hand, x: gr.x + 1, duration: 90, yoyo: true, repeat: 9 });
        } else {
          // pump: bobbing in and out of the ground
          this.tweens.add({ targets: st, p: 0.72, duration: 200, yoyo: true, repeat: 3, ease: 'Sine.easeInOut', onUpdate: apply });
        }
        if (greet) {
          const label = this.add.text(gr.x, GROUND_Y - h - 6, t('world.hello'), {
            fontFamily: FONT, fontSize: '8px', color: '#e8e0d0', stroke: '#000', strokeThickness: 2,
          }).setOrigin(0.5, 1).setDepth(DEPTH.text);
          this.tweens.add({ targets: label, y: label.y - 8, alpha: 0, delay: 900, duration: 600, onComplete: () => label.destroy() });
        }
        this.time.delayedCall(2300, () => {
          hand.anims.stop();
          hand.setAngle(0);
          this.tweens.add({
            targets: st, p: 0, duration: 400, ease: 'Quad.easeIn', onUpdate: apply,
            onComplete: () => { hand.destroy(); gr.busy = false; },
          });
        });
      },
    });
  }

  checkRegions() {
    const gx = this.ghost.x;
    const f = this.flags;
    if (!f.city && gx > FOREST_END + 20) {
      f.city = true;
      this.ghostSays(t('ghost.city'));
      this.ui('ui:objective', t('obj.findHouse'));
    }
  }

  enterWizardHouse() {
    this.transitioning = true;
    const g = this.ghost;
    g.locked = true;
    g.vx = g.vy = 0;
    const h = this.wizardHouse;
    (this.wizardLair === 'cellar' ? h.cover : h.facade).setAlpha(0.07);
    const floorY = h.floorAt(g.y);
    const wx = Phaser.Math.Clamp(g.x + (g.x < h.x + HOUSE_W / 2 ? 40 : -40), h.x + 20, h.x + HOUSE_W - 20);
    // the big wizard art faces left; scaled down to fit under the ceiling of a room
    const wiz = this.add.image(wx, floorY, 'wiz_title_cast').setOrigin(0.5, 1).setDepth(DEPTH.resident).setAlpha(0)
      .setFlipX(g.x > wx).setScale(0.72);
    const glow = this.add.image(wx, floorY - 26, 'glow').setTint(0xb04dff).setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.6).setAlpha(0).setDepth(DEPTH.resident - 0.1);
    this.tweens.add({ targets: [wiz, glow], alpha: 1, duration: 500 });
    sfx.laugh();
    this.cameras.main.shake(600, 0.008);
    this.bubbles.clear();
    this.bubbles.say('wizard', () => ({ x: wx, y: floorY - 54 }), t('wiz.collect'), { style: 'wizard', ms: 2600 });
    this.registry.set('bossLair', this.wizardLair);
    this.registry.set('bossStage', 1);
    this.time.delayedCall(2200, () => {
      this.cameras.main.flash(300, 160, 80, 255);
      this.cameras.main.fadeOut(700, 20, 0, 40);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Boss'));
    });
  }

  updateCamera(dt) {
    const g = this.ghost;
    const shaft = this.shafts.find((s) => Math.abs(g.x - s.cx) < 26 && g.y > GROUND_Y - 70);
    if (shaft && !g.locked) {
      const key = shaft.kind === 'metro' ? 'metro' : 'shaft';
      if (!this.flags[key]) {
        this.flags[key] = true;
        this.ghostSays(key === 'metro'
          ? t('ghost.metro')
          : t('ghost.cellar'));
      }
    }
    const underground = g.y > GROUND_Y - 6;
    const ty = underground || shaft ? Math.max(g.y, CELLAR_VIEW_Y) : Math.min(g.y, STREET_VIEW_Y);
    this.camY += (ty - this.camY) * Math.min(1, dt * 2.6);
    this.camTarget.setPosition(g.x, this.camY);
  }

  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const g = this.ghost;
    g.update(dt);
    this.updateCamera(dt);
    this.bats.update(dt, g);
    for (const h of this.haunts) {
      if (h.wait > 0) { h.wait -= dt; continue; }
      const dx = g.x - h.x, dy = g.y - h.y;
      if (dx * dx + dy * dy < h.r2 && !g.locked) { h.wait = h.cooldown; h.play(); }
    }
    this.fog.tilePositionX += dt * 8;
    this.race?.update(dt);
    const rivals = this.race?.rivals ?? [];

    for (const h of this.buildings) {
      const { inside, cellar } = h.update(dt, g, rivals);
      if ((!inside && !cellar) || this.transitioning) continue;
      if ((h.lair === 'house' && inside) || (h.lair === 'cellar' && cellar)) { this.enterWizardHouse(); continue; }
      // the inn has its own rules (party guests only fear a BUH!)
      if (h.onGhostNear) {
        for (const r of h.onGhostNear(g, dt)) this.addScore(1, r.x, r.floorY - 10);
        continue;
      }
      // residents panic as soon as the ghost floats close (same storey only)
      for (const r of h.residents) {
        if (r.state === 'idle' && Math.abs(r.x - g.x) < SCARE_RADIUS && Math.abs(r.floorY - 9 - g.y) < 26 && r.scare()) {
          this.addScore(1, r.x, r.floorY - 10);
        }
      }
    }
    if (!this.transitioning) this.checkRegions();
  }
}
