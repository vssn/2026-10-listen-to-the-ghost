import Phaser from 'phaser';
import { tl } from '../i18n.js';
import { DEPTH, FONT, GROUND_Y } from '../config.js';
import { WHEEL, WHEEL_STEP, GONDOLA, CAROUSEL } from '../textures/fair.js';
import { sfx } from '../sfx.js';
import { HideSpot, Resident } from './House.js';

const ADD = Phaser.BlendModes.ADD;

// The Halloween fair in the forest (scare race only) spans this stretch.
export const FAIR_X0 = 846;
export const FAIR_X1 = 1324;
const FLOOR = GROUND_Y + 1;
const WHEEL_X = 972;
const HUB_Y = FLOOR - WHEEL.standH + 4;
const CAROUSEL_X = 1180;
// the wheel turns one pre-rendered step this often (seconds)
const WHEEL_TICK = 0.1;
const CAROUSEL_SPEED = 0.55; // radians per second
const HORSES = 6;
// The fair stands on the forest floor, so everything sits just above the ground layer.
const D = {
  lights: DEPTH.ground + 0.3, back: DEPTH.ground + 0.4, mid: DEPTH.ground + 0.43, front: DEPTH.ground + 0.46,
  roof: DEPTH.ground + 0.48, spot: DEPTH.props + 0.1, people: DEPTH.props + 0.3,
};
// riders duck this far down into their seat
const DUCK = 8;
// riders and visitors come back out once no ghost has been within this distance for a while
const CALM_DIST = 100;
const REAPPEAR = 2.6;

const WALKER_KINDS = [
  { kind: 'dad' }, { kind: 'mom' }, { kind: 'kid' }, { kind: 'teen' }, { kind: 'granny' },
  { kind: 'vampire' }, { kind: 'witch', acc: { key: 'acc_witchhat', dy: -15 } },
  { kind: 'devil', acc: { key: 'acc_horns', dy: -16 } }, { kind: 'pumpkin' }, { kind: 'mummy' },
];
const RIDER_KINDS = ['kid', 'teen', 'mom', 'dad', 'grandpa', 'vampire', 'pumpkin', 'mummy', 'kid', 'teen'];
// riders can always duck down in their seat
const CAN_DUCK = [{ free: true }];

// Somebody on a ride: only head and shoulders show; when frightened they
// scream and duck down until the ghosts have gone.
class Rider {
  constructor(fair, kind, depth) {
    this.scene = fair.scene;
    this.house = fair;
    this.kind = kind;
    this.state = 'idle';
    this.duck = 0;
    this.away = 99;
    this.x = 0;
    this.floorY = 0;
    this.sprite = fair.scene.add.image(0, 0, `p_${kind}_0`).setOrigin(0.5, 0).setDepth(depth);
  }

  get spots() { return CAN_DUCK; }

  // top: where the head is when sitting up; cover: below this line the ride hides them.
  place(x, top, cover) {
    this.x = x;
    this.floorY = top + 17; // where the feet would be, like for people standing around
    const y = Math.round(top + this.duck);
    const h = Phaser.Math.Clamp(Math.round(cover) - y, 0, 12);
    this.sprite.setPosition(Math.round(x), y).setCrop(0, 0, 10, h).setVisible(h > 0);
  }

  scare() {
    if (this.state !== 'idle') return false;
    const s = this.scene;
    this.state = 'scared';
    this.timer = 0.45;
    this.sprite.setTexture(`p_${this.kind}_s`);
    if (s.isAudible?.(this.x, this.floorY) ?? true) sfx.scream();
    if (Math.random() < 0.35) {
      s.bubbles.say(this, () => ({ x: this.x, y: this.floorY - 21 }), Phaser.Utils.Array.GetRandom(tl('house.shouts')),
        { style: 'resident', ms: 1400, interrupt: true });
    } else {
      const mark = s.add.text(this.x, this.floorY - 20, '!', {
        fontFamily: FONT, fontSize: '8px', color: '#ff5a5a', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(DEPTH.text);
      s.tweens.add({ targets: mark, y: mark.y - 6, duration: 160, yoyo: true, repeat: 1, onComplete: () => mark.destroy() });
    }
    return true;
  }

  update(dt) {
    if (this.state === 'scared') {
      this.timer -= dt;
      if (this.timer <= 0) { this.state = 'hidden'; this.hiddenFor = 0; }
    } else if (this.state === 'hidden') {
      this.duck = Math.min(DUCK, this.duck + dt * 40);
      this.hiddenFor += dt;
      if (this.away > REAPPEAR && this.hiddenFor > 2) {
        this.state = 'rising';
        this.sprite.setTexture(`p_${this.kind}_0`);
      }
    } else if (this.state === 'rising') {
      this.duck = Math.max(0, this.duck - dt * 16);
      if (this.duck === 0) this.state = 'idle';
    }
  }
}

// The whole fair behaves like a building of the town: it can be scared with
// BUH (scareAt), by floating close (onGhostNear) and gets updated every frame.
export class Fair {
  constructor(scene) {
    this.scene = scene;
    this.rect = new Phaser.Geom.Rectangle(FAIR_X0, GROUND_Y - 150, FAIR_X1 - FAIR_X0, 156);
    this.time = 0;
    this.spots = [];
    this.walkers = [];
    this.riders = [];
    this.bulbs = [];

    this.buildLights();
    this.buildWheel();
    this.buildCarousel();
    this.buildStands();
    this.residents = [...this.walkers, ...this.riders];
    this.spin(0);
  }

  // ---------------------------------------------------------------- building
  buildLights() {
    const s = this.scene;
    s.add.image(FAIR_X0 + 4, FLOOR, 'fair_sign').setOrigin(0.5, 1).setDepth(DEPTH.props);
    // warm light over the whole fair
    for (const [x, y, scale] of [[WHEEL_X, HUB_Y, 3.2], [CAROUSEL_X, FLOOR - 50, 2.6], [1080, FLOOR - 20, 2]]) {
      s.add.image(x, y, 'glow').setTint(0xff9a3c).setBlendMode(ADD).setScale(scale).setAlpha(0.16).setDepth(D.lights);
    }
    // lanterns with strings of coloured bulbs between them
    const poles = [906, 1034, 1126, 1234, 1318];
    const headY = FLOOR + 7 - 66 + 9;
    for (const x of poles) {
      s.add.image(x, FLOOR + 7, 'lamp').setOrigin(0.5, 1).setDepth(D.lights);
      s.glowAt(x, headY, 0xffc860, 0.9, 0.5);
    }
    const wire = s.add.graphics().setDepth(D.lights);
    const colors = [0xff8a1a, 0xc97bff, 0x6aff8a, 0xffe14a];
    for (const [a, b] of [[1034, 1126], [1234, 1318]]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const f = i / 24;
        pts.push({ x: a + (b - a) * f, y: headY - 2 + Math.sin(f * Math.PI) * 12 });
      }
      wire.lineStyle(1, 0x1a1420, 1).strokePoints(pts);
      const set = [];
      pts.forEach((p, i) => {
        if (i % 2 || i === 0 || i === 24) return;
        const c = colors[(i / 2) % colors.length];
        const bulb = s.add.image(p.x, p.y + 1, 'px').setTint(c).setScale(2).setDepth(D.lights + 0.01);
        const halo = s.add.image(p.x, p.y + 1, 'glow').setTint(c).setBlendMode(ADD).setScale(0.16).setAlpha(0.6).setDepth(D.lights);
        set.push(bulb, halo);
        this.bulbs.push(bulb);
      });
      // the bulbs flicker when a ghost floats past
      s.addHaunt((a + b) / 2, headY + 6, 46, () => {
        sfx.fizzle();
        s.flicker((on) => set.forEach((o) => o.setVisible(on)), 9, 70);
      }, 4);
    }
    // glowing pumpkins by the stands
    for (const x of [910, 1078, 1236]) {
      s.add.image(x, FLOOR, 'pumpkin').setOrigin(0.5, 1).setDepth(DEPTH.props + 0.15);
      s.glowAt(x, FLOOR - 6, 0xff8a1a, 0.5, 0.6);
    }
  }

  buildWheel() {
    const s = this.scene;
    this.wheel = s.add.image(WHEEL_X, HUB_Y, 'fair_wheel_0').setDepth(D.back);
    s.add.image(WHEEL_X, FLOOR, 'fair_wheel_stand').setOrigin(0.5, 1).setDepth(D.back + 0.01);
    s.add.image(WHEEL_X, HUB_Y, 'fair_hub').setDepth(D.back + 0.02);
    s.glowAt(WHEEL_X, HUB_Y, 0xff8a1a, 0.6, 0.6);
    this.gondolas = [];
    for (let k = 0; k < WHEEL.gondolas; k++) {
      const back = s.add.image(0, 0, 'fair_gondola_back').setOrigin(0.5, 0).setDepth(D.mid);
      const front = s.add.image(0, 0, 'fair_gondola').setOrigin(0.5, 0).setDepth(D.mid + 0.02);
      // two of the gondolas are empty
      const rider = k % 4 === 3 ? null : new Rider(this, RIDER_KINDS[k], D.mid + 0.01);
      if (rider) this.riders.push(rider);
      this.gondolas.push({ back, front, rider });
    }
  }

  buildCarousel() {
    const s = this.scene;
    const C = CAROUSEL;
    s.add.image(CAROUSEL_X, FLOOR, 'fair_carousel_base').setOrigin(0.5, 1).setDepth(D.back);
    s.add.image(CAROUSEL_X, FLOOR + C.poleBottom, 'fair_carousel_core').setOrigin(0.5, 1).setDepth(D.mid);
    s.add.image(CAROUSEL_X, FLOOR + C.roofY, 'fair_carousel_roof').setOrigin(0.5, 0).setDepth(D.roof);
    // the skeleton reaper on the roof looks this way and that
    const reaper = s.add.image(CAROUSEL_X + 1, FLOOR + C.roofY + 5, 'fair_skeleton').setOrigin(0.5, 1).setDepth(D.roof + 0.01);
    s.time.addEvent({ delay: 2800, loop: true, callback: () => reaper.setFlipX(!reaper.flipX) });
    s.glowAt(CAROUSEL_X, FLOOR + C.roofY + 30, 0xc97bff, 1.2, 0.35);
    this.horses = [];
    for (let k = 0; k < HORSES; k++) {
      const pole = s.add.image(0, FLOOR + C.poleTop, 'px').setTint(0xd9b13b).setOrigin(0.5, 0)
        .setScale(1, C.poleBottom - C.poleTop);
      const horse = s.add.image(0, 0, 'fair_horse').setOrigin(0.5, 1);
      const rider = k % 3 === 2 ? null : new Rider(this, RIDER_KINDS[(k + 5) % RIDER_KINDS.length], D.mid);
      if (rider) this.riders.push(rider);
      this.horses.push({ pole, horse, rider, phase: (k * Math.PI * 2) / HORSES });
    }
  }

  buildStands() {
    const s = this.scene;
    const spot = (type, x, capacity) => {
      const sp = new HideSpot(s, type, x, FLOOR, capacity);
      sp.sprite.setDepth(D.spot);
      sp.eyes?.setDepth(D.spot + 0.05);
      this.spots.push(sp);
      return sp;
    };
    spot('foodstand', 864, 3);
    spot('fairtable', 1040, 2);
    spot('drinkstand', 1086, 3);
    spot('fairtable', 1240, 2);
    spot('bench', 1286, 1);
    // visitors strolling between the attractions
    for (const { kind, acc } of WALKER_KINDS) {
      const r = new Resident(s, this, kind, FLOOR, FAIR_X0 + 20, FAIR_X1 - 20, this.spots, { acc });
      r.sprite.setDepth(D.people);
      r.acc?.setDepth(D.people + 0.01);
      r.away = 99;
      this.walkers.push(r);
    }
  }

  // ---------------------------------------------------------------- motion
  spin(dt) {
    this.time += dt;
    // Ferris wheel: whole pre-rendered steps, the gondolas follow the same angle
    const step = Math.floor(this.time / WHEEL_TICK);
    this.wheel.setTexture(`fair_wheel_${step % WHEEL.frames}`);
    const rot = step * WHEEL_STEP;
    this.gondolas.forEach((g, k) => {
      const a = rot + (k * Math.PI * 2) / WHEEL.gondolas;
      const x = Math.round(WHEEL_X + Math.cos(a) * WHEEL.r);
      const y = Math.round(HUB_Y + Math.sin(a) * WHEEL.r);
      g.back.setPosition(x, y);
      g.front.setPosition(x, y);
      g.rider?.place(x, y + GONDOLA.riderTop, y + GONDOLA.cover);
    });

    // carousel: horses run round an ellipse, bobbing up and down
    const C = CAROUSEL;
    for (const h of this.horses) {
      const a = this.time * CAROUSEL_SPEED + h.phase;
      const x = Math.round(CAROUSEL_X + Math.cos(a) * C.rx);
      const front = Math.sin(a) > 0;
      const bottom = Math.round(FLOOR + C.horseY + Math.sin(this.time * 3 + h.phase * 2) * 2);
      const depth = front ? D.front : D.back + 0.02;
      h.horse.setPosition(x, bottom).setFlipX(front).setDepth(depth).setTint(front ? 0xffffff : 0x8a80a0);
      h.pole.setPosition(x, FLOOR + C.poleTop).setDepth(depth - 0.002);
      if (h.rider) {
        const saddle = bottom - 10;
        h.rider.sprite.setDepth(depth - 0.001);
        h.rider.place(x + (front ? 1 : -1), saddle - 11, saddle + 4);
      }
    }
  }

  // ---------------------------------------------------------------- building interface
  contains(x, y) { return Phaser.Geom.Rectangle.Contains(this.rect, x, y); }

  inCellar() { return false; }

  // BUH!: visitors close by on the ground, and riders near the ghost.
  scareAt(x, y, radius) {
    let n = 0;
    for (const r of this.walkers) {
      if (r.state === 'idle' && Math.abs(r.x - x) <= radius && Math.abs(r.floorY - 9 - y) < 34 && r.scare()) n++;
    }
    for (const r of this.riders) {
      if (Math.hypot(r.x - x, r.floorY - 9 - y) < 50 && r.scare()) n++;
    }
    return n;
  }

  // Called every frame while the ghost is at the fair; returns who got scared.
  onGhostNear(g) {
    const scared = [];
    for (const r of this.walkers) {
      if (r.state === 'idle' && Math.abs(r.x - g.x) < 32 && Math.abs(r.floorY - 9 - g.y) < 26 && r.scare()) scared.push(r);
    }
    for (const r of this.riders) {
      if (Math.abs(r.x - g.x) < 22 && Math.abs(r.floorY - 9 - g.y) < 20 && r.scare()) scared.push(r);
    }
    return scared;
  }

  update(dt, ghost, others = []) {
    const inside = this.contains(ghost.x, ghost.y);
    this.spin(dt);
    // everyone keeps their own "the ghosts have gone" timer – the fair is wide
    const ghosts = [ghost, ...others];
    for (const r of this.residents) {
      const near = ghosts.some((o) => Math.abs(o.x - r.x) < CALM_DIST && o.y > GROUND_Y - 160);
      r.away = near ? 0 : r.away + dt;
    }
    for (const sp of this.spots) sp.update(dt);
    for (const r of this.walkers) r.update(dt, r.away);
    for (const r of this.riders) r.update(dt);
    // now and then a bulb flickers on its own
    if (Math.random() < dt * 3) {
      const b = Phaser.Utils.Array.GetRandom(this.bulbs);
      b.setAlpha(0.3);
      this.scene.time.delayedCall(120, () => b.setAlpha(1));
    }
    return { inside, cellar: false };
  }
}
