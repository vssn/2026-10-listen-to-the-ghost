import Phaser from 'phaser';
import { tl } from '../i18n.js';
import { DEPTH, GROUND_Y } from '../config.js';
import { METRO, METRO_LAMPS, STAIR } from '../textures/metro.js';
import { HideSpot, Resident } from './House.js';
import { sfx } from '../sfx.js';

const ADD = Phaser.BlendModes.ADD;
const D_TRAIN = DEPTH.interior + 0.2;   // interior 8.2, passengers 8.3, shell 8.4
const D_PLATFORM = DEPTH.interior + 0.6;
const FIRST_TRAIN = 20;   // seconds after the world starts
const TRAIN_EVERY = 60;   // one train a minute
const DWELL = 14;         // seconds standing at the platform
const RIDERS = ['dad', 'mom', 'grandpa', 'granny', 'teen', 'kid', 'waiter', 'vampire'];
const PLATFORM_KINDS = ['dad', 'mom', 'teen', 'grandpa', 'granny'];
const D_STAIRS = D_TRAIN + 0.3;            // the stair blocks stand in front of the train
const D_SHADE = DEPTH.resident + 0.6;      // darkness falls over people and train alike
const LAMP_REACH = 50;                     // the ghost puts out lamps this close
// window holes in the carriage shell (car-local): four big windows, two per door
const CAR_WINDOWS = [
  ...[6, 52, 76, 126].map((x) => ({ x, y: 10, w: 18, h: 13 })),
  ...[30, 104].flatMap((d) => [{ x: d + 2, y: 9, w: 4, h: 10 }, { x: d + 10, y: 9, w: 4, h: 10 }]),
];

// The metro station below three houses. Platform passengers behave like
// residents; once a minute a two-car train stops and its riders can be scared.
export class Metro {
  constructor(scene) {
    this.scene = scene;
    const M = METRO;
    this.lair = null;
    this.x0 = M.x0;
    this.exitXs = M.exits.map((e) => e.x);
    this.rect = new Phaser.Geom.Rectangle(M.x0, M.top, M.w, M.h);
    this.stairsRects = M.exits.map((e) => new Phaser.Geom.Rectangle(e.x - 24, GROUND_Y - 30, 48, M.top - GROUND_Y + 40));
    // reach: the stairs run 40px into the station, so the ghost is guided in from further away
    this.shafts = M.exits.map((e) => ({ x: e.x - 14, cx: e.x, kind: 'metro', reach: 56 }));
    this.walkable = [
      ...M.exits.map((e) => new Phaser.Geom.Rectangle(e.x - 7, GROUND_Y - 20, 14, M.top + 30 - (GROUND_Y - 20))),
      new Phaser.Geom.Rectangle(M.x0 + 12, M.top + 12, M.w - 24, M.floor - 12 - (M.top + 12)),
    ];
    this.ghostAway = 99;
    this.clock = 0;

    // ---- art
    scene.add.image(M.x0, M.top, 'metro_station').setOrigin(0).setDepth(DEPTH.interior);
    scene.add.image(M.x0, M.floor, 'metro_platform').setOrigin(0).setDepth(D_PLATFORM);
    this.cover = scene.add.tileSprite(M.x0, M.top, M.w, M.h, 'earth').setOrigin(0).setDepth(DEPTH.facade);
    for (const ex of this.exitXs) {
      scene.add.image(ex - 24, GROUND_Y - 14, 'metro_stairs').setOrigin(0).setDepth(DEPTH.shaft);
      scene.add.image(ex, GROUND_Y + 4, 'metro_arch').setOrigin(0.5, 1).setDepth(DEPTH.props + 0.2);
      for (const dx of [-52, 52]) {
        const g = scene.add.image(ex + dx, GROUND_Y + 4 - 72 + 8, 'glow').setTint(0xff2020).setBlendMode(ADD)
          .setScale(0.6).setAlpha(0.7).setDepth(DEPTH.props + 0.3);
        scene.tweens.add({ targets: g, alpha: 0.45, duration: 160, yoyo: true, repeat: -1, repeatDelay: Phaser.Math.Between(200, 900) });
      }
    }
    // solid stair blocks down to the platform, in front of the tunnel mouths
    for (const { x, dir } of M.exits) {
      const left = dir > 0 ? x - STAIR.anchor : x + STAIR.anchor - STAIR.w;
      scene.add.image(left, M.top, 'metro_stairmass').setOrigin(0).setDepth(D_STAIRS).setFlipX(dir < 0);
    }
    // ceiling lamps: the glow, a dark cap for the bulb and a shadow that falls when they go out
    this.lamps = METRO_LAMPS.map((lx) => ({
      x: M.x0 + lx,
      t: 0,
      state: 'on',
      g: scene.add.image(M.x0 + lx, M.top + 14, 'glow').setTint(0xfff0c0).setBlendMode(ADD).setScale(0.9).setAlpha(0.5)
        .setDepth(DEPTH.interior + 0.5),
      bulb: scene.add.rectangle(M.x0 + lx, M.top + 9.5, 7, 3, 0x3a3428).setDepth(DEPTH.interior + 0.4).setVisible(false),
      shade: scene.add.image(M.x0 + lx, M.top + 42, 'glow').setTint(0x000000).setScale(1.5, 1.9).setAlpha(0)
        .setDepth(D_SHADE),
    }));

    // ---- people on the platform and where they hide
    this.spots = [
      new HideSpot(scene, 'bench', M.x0 + 150, M.floor, 2),
      new HideSpot(scene, 'kiosk', M.x0 + 370, M.floor, 2),
      new HideSpot(scene, 'bench', M.x0 + 570, M.floor, 2),
    ];
    this.residents = PLATFORM_KINDS.map((kind) => new Resident(scene, this, kind, M.floor, M.x0 + 60, M.x1 - 60, this.spots));

    // ---- a ticket machine at the foot of each staircase
    for (const { x, dir } of M.exits) {
      const tmX = x + dir * 60;
      scene.add.image(tmX, M.floor, 'ticketmachine').setOrigin(0.5, 1).setDepth(D_PLATFORM + 0.1).setFlipX(dir < 0);
      scene.addHaunt?.(tmX, M.floor - 14, 30, () => this.spitTickets(tmX, M.floor - 10, dir), 3);
    }

    this.makeTrain();
  }

  // ------------------------------------------------------------------ train
  makeTrain() {
    const s = this.scene;
    const M = METRO;
    const shape = s.make.graphics({}, false);
    shape.fillStyle(0xffffff).fillRect(M.x0 + 18, M.top, M.w - 36, M.h);
    this.mask = shape.createGeometryMask();
    this.train = { state: 'away', x: M.x1 + 20, next: FIRST_TRAIN };
    this.carTop = M.floor - 30;
    this.cars = [0, 1].map(() => {
      const interior = s.add.image(0, this.carTop, 'metro_car_in').setOrigin(0).setDepth(D_TRAIN).setMask(this.mask);
      const shell = s.add.image(0, this.carTop, 'metro_car').setOrigin(0).setDepth(D_TRAIN + 0.2).setMask(this.mask);
      // each window can go dark on its own (darkened, not see-through)
      const windows = CAR_WINDOWS.map((w) => ({
        ...w,
        dark: false,
        flicker: 0,
        until: 0,
        rect: s.add.rectangle(0, this.carTop + w.y, w.w, w.h, 0x07050c, 0.86).setOrigin(0)
          .setDepth(D_TRAIN + 0.15).setMask(this.mask).setVisible(false),
      }));
      return { interior, shell, windows, riders: [] };
    });
    this.trainLen = 2 * M.carW + 4;
    this.stopX = Math.round(M.x0 + M.w / 2 - this.trainLen / 2 + 40);
    this.placeTrain();
  }

  carX(i) { return this.train.x + i * (METRO.carW + 4); }

  placeTrain() {
    this.cars.forEach((c, i) => {
      const x = Math.round(this.carX(i));
      c.interior.x = x;
      c.shell.x = x;
      for (const w of c.windows) w.rect.x = x + w.x;
      for (const r of c.riders) r.sprite.x = Math.round(x + r.lx);
    });
  }

  boardRiders() {
    const s = this.scene;
    for (const c of this.cars) {
      for (const r of c.riders) r.sprite.destroy();
      c.riders = [];
      for (const w of c.windows) { w.dark = false; w.flicker = 0; w.rect.setVisible(false); }
      const n = Phaser.Math.Between(2, 4);
      for (let k = 0; k < n; k++) {
        const kind = Phaser.Utils.Array.GetRandom(RIDERS);
        const lx = 14 + Math.round(((k + 0.5) / n) * 122) + Phaser.Math.Between(-6, 6);
        const sprite = s.add.sprite(0, this.carTop + 33, `p_${kind}_0`).setOrigin(0.5, 1)
          .setDepth(D_TRAIN + 0.1).setMask(this.mask).setFlipX(Math.random() < 0.5);
        c.riders.push({ kind, lx, sprite, state: 'ride', get x() { return this.sprite.x; }, get floorY() { return this.sprite.y; } });
      }
    }
    this.placeTrain();
  }

  near() {
    const g = this.scene.ghost;
    return Math.abs(g.x - (METRO.x0 + METRO.w / 2)) < 480;
  }

  updateTrain(dt) {
    const t = this.train;
    const s = this.scene;
    if (t.state === 'away' && this.clock >= t.next) {
      t.next += TRAIN_EVERY;
      t.state = 'arriving';
      t.x = METRO.x1 + 20;
      this.boardRiders();
      if (this.near()) { sfx.rumble(); s.time.delayedCall(1600, () => this.near() && sfx.brake()); }
      s.tweens.add({
        targets: t, x: this.stopX, duration: 3400, ease: 'Cubic.easeOut',
        onComplete: () => {
          t.state = 'stopped';
          if (this.near()) sfx.chime();
          s.time.delayedCall(DWELL * 1000, () => {
            t.state = 'leaving';
            if (this.near()) { sfx.chime(); s.time.delayedCall(700, () => this.near() && sfx.rumble()); }
            s.tweens.add({
              targets: t, x: METRO.x0 - this.trainLen - 30, duration: 3600, delay: 700, ease: 'Cubic.easeIn',
              onComplete: () => { t.state = 'away'; },
            });
          });
        },
      });
    }
    // scared riders run back and forth inside their carriage
    for (const c of this.cars) {
      for (const r of c.riders) {
        if (r.state !== 'scared') continue;
        r.lx += r.dir * r.speed * dt;
        if (r.lx < 8 || r.lx > METRO.carW - 8) { r.dir *= -1; r.lx = Phaser.Math.Clamp(r.lx, 8, METRO.carW - 8); }
        r.sprite.setFlipX(r.dir < 0);
        r.sprite.y = this.carTop + 33 - (Math.floor(r.lx / 5) % 2);
      }
    }
    this.placeTrain();
  }

  carAt(x, y) {
    if (this.train.state === 'away') return -1;
    for (let i = 0; i < this.cars.length; i++) {
      const cx = this.carX(i);
      if (x >= cx && x <= cx + METRO.carW && y >= this.carTop && y <= this.carTop + METRO.carH) return i;
    }
    return -1;
  }

  scareRider(r) {
    if (r.state !== 'ride') return false;
    r.state = 'scared';
    r.sprite.setTexture(`p_${r.kind}_s`);
    sfx.scream();
    if (!this.anyoneTalking()) {
      this.scene.bubbles.say(r, () => ({ x: r.sprite.x, y: r.sprite.y - 19 }), Phaser.Utils.Array.GetRandom(tl('metro.riderShouts')),
        { style: 'resident', ms: 1500 });
    }
    // panic: run up and down the carriage until the train is gone
    r.dir = Math.random() < 0.5 ? -1 : 1;
    r.speed = 45 + Math.random() * 25;
    return true;
  }

  anyoneTalking() {
    const b = this.scene.bubbles;
    return this.residents.some((r) => b.isShowing(r)) || this.cars.some((c) => c.riders.some((r) => b.isShowing(r)));
  }

  // ------------------------------------------------------------------ effects
  spitTickets(x, y, dir = 1) {
    const s = this.scene;
    sfx.tickets();
    for (let k = 0; k < 6; k++) {
      s.time.delayedCall(k * 90, () => {
        const t = s.add.image(x - 2 * dir, y, 'ticket').setDepth(D_PLATFORM + 0.2);
        const tx = x - dir * (6 + Math.random() * 30);
        s.tweens.add({ targets: t, x: tx, duration: 700, ease: 'Sine.easeOut' });
        s.tweens.add({
          targets: t, y: { from: y, to: METRO.floor - 1 }, angle: Phaser.Math.Between(-200, 200), duration: 700, ease: 'Bounce.easeOut',
        });
        s.tweens.add({ targets: t, alpha: 0, delay: 5000, duration: 600, onComplete: () => t.destroy() });
      });
    }
  }

  // Lamps near the ghost flicker, then go out and stay dark for a few moments
  // (a shadow replaces their glow); single carriage windows do the same.
  flickerLamps(dt, g, inStation) {
    const now = this.scene.time.now;
    for (const l of this.lamps) {
      const near = inStation && Math.abs(l.x - g.x) < LAMP_REACH;
      if (l.state === 'on' && near) { l.state = 'flicker'; l.t = 0.45; l.blink = 0; }
      if (l.state === 'flicker') {
        l.t -= dt;
        l.blink -= dt;
        if (l.blink <= 0) {
          l.blink = 0.04 + Math.random() * 0.08;
          const on = Math.random() < 0.5;
          l.g.setAlpha(on ? 0.6 : 0.05);
          l.bulb.setVisible(!on);
        }
        if (l.t <= 0) {
          l.state = 'dark';
          l.until = now + 1500 + Math.random() * 1500;
          l.g.setVisible(false);
          l.bulb.setVisible(true);
          this.scene.tweens.add({ targets: l.shade, alpha: 0.75, duration: 250 });
        }
      } else if (l.state === 'dark') {
        if (near) l.until = Math.max(l.until, now + 700);
        if (now > l.until) {
          l.state = 'on';
          l.g.setVisible(true).setAlpha(0.5);
          l.bulb.setVisible(false);
          this.scene.tweens.add({ targets: l.shade, alpha: 0, duration: 400 });
        }
      }
    }
    if (this.train.state === 'away') return;
    const inBand = inStation && g.y > this.carTop - 8 && g.y < this.carTop + METRO.carH + 4;
    this.cars.forEach((c, i) => {
      const cx = this.carX(i);
      for (const w of c.windows) {
        const near = inBand && Math.abs(cx + w.x + w.w / 2 - g.x) < 16;
        if (!w.dark && w.flicker <= 0 && near) w.flicker = 0.35;
        if (w.flicker > 0) {
          w.flicker -= dt;
          w.rect.setVisible(Math.random() < 0.5);
          if (w.flicker <= 0) { w.dark = true; w.until = now + 1000 + Math.random() * 1000; w.rect.setVisible(true); }
        } else if (w.dark) {
          if (near) w.until = Math.max(w.until, now + 500);
          if (now > w.until) { w.dark = false; w.rect.setVisible(false); }
        }
      }
    });
  }

  // ------------------------------------------------------------------ building interface
  contains(x, y) { return Phaser.Geom.Rectangle.Contains(this.rect, x, y); }

  inCellar() { return false; }

  scareAt(x, y, radius) {
    let n = 0;
    if (!this.contains(x, y)) return 0;
    for (const r of this.residents) {
      if (r.state === 'idle' && Math.abs(r.x - x) <= radius && r.scare()) n++;
    }
    // a BUH inside a carriage frightens everyone in it
    const car = this.carAt(x, y);
    if (car >= 0) for (const r of this.cars[car].riders) if (this.scareRider(r)) n++;
    return n;
  }

  // Called every frame while the ghost is in the station; returns who got scared.
  onGhostNear(g) {
    const scared = [];
    for (const r of this.residents) {
      if (r.state === 'idle' && Math.abs(r.x - g.x) < 32 && Math.abs(r.floorY - 9 - g.y) < 26) {
        r.shoutChance = this.anyoneTalking() ? 0 : 0.45;
        if (r.scare()) scared.push(r);
      }
    }
    const car = this.carAt(g.x, g.y);
    if (car >= 0) {
      for (const r of this.cars[car].riders) {
        if (Math.abs(r.sprite.x - g.x) < 28 && this.scareRider(r)) scared.push(r);
      }
    }
    return scared;
  }

  update(dt, ghost) {
    this.clock += dt;
    const inside = this.contains(ghost.x, ghost.y);
    const visible = inside || this.stairsRects.some((r) => Phaser.Geom.Rectangle.Contains(r, ghost.x, ghost.y));
    this.ghostAway = inside ? 0 : this.ghostAway + dt;
    this.cover.alpha += ((visible ? 0.05 : 1) - this.cover.alpha) * Math.min(1, dt * 8);
    this.updateTrain(dt);
    this.flickerLamps(dt, ghost, inside);
    for (const sp of this.spots) sp.update(dt);
    for (const r of this.residents) r.update(dt, this.ghostAway);
    return { inside, cellar: false };
  }
}
