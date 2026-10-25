import Phaser from 'phaser';
import { DEPTH, FONT, GROUND_Y, HOUSE_H, INN_W, STOREY_H } from '../config.js';
import { INN } from '../textures/inn.js';
import { HideSpot, Resident } from './House.js';

const ADD = Phaser.BlendModes.ADD;

// Hall hiding spots (inn-local x of the left edge) and how many fit behind each.
const HALL_SPOTS = [
  { type: 'kitchendoor', x: 6, cap: 4 },
  { type: 'table', x: 44, cap: 3 },
  { type: 'coffin', x: 84, cap: 2 },
  { type: 'table', x: 104, cap: 3 },
  { type: 'table', x: 158, cap: 3 },
  { type: 'bigpumpkin', x: 198, cap: 2 },
];
const GUESTS = [
  { kind: 'vampire' }, { kind: 'witch', acc: { key: 'acc_witchhat', dy: -15 } },
  { kind: 'devil', acc: { key: 'acc_horns', dy: -16 } }, { kind: 'pumpkin' }, { kind: 'mummy' },
  { kind: 'dad' }, { kind: 'mom' }, { kind: 'teen' }, { kind: 'granny' }, { kind: 'grandpa' },
];
const STAFF = ['waiter', 'waitress'];
const SLEEPERS = ['grandpa', 'mom', 'dad', 'granny', 'kid', 'teen'];

const PARTY_SHOUTS = ['Ein echter Geist!', 'Aaah!', 'Das ist kein Kostüm!', 'Hilfe!'];
const SLEEPER_SHOUTS = ['Huch?!', 'Wa...? Ein Geist!', 'Hilfe!', 'Mama!'];
const PARTY_LINES = ['Tolles Kostüm!', 'Prost, Gespenst!', 'Hihi, süßer Geist!', 'Schicke Verkleidung!', 'Party!', 'Willst du tanzen?'];
const STAFF_LINES = ['Noch einen Kürbissaft?', 'Darf\'s was sein?', 'Platz da, heiße Suppe!'];

// The inn: a two-storey party hall with hotel rooms above. The party guests
// think the ghost is just another costume – only a BUH! frightens them.
export class Inn {
  constructor(scene, x) {
    this.scene = scene;
    this.x = x;
    this.top = GROUND_Y - HOUSE_H;
    this.lair = null;
    this.walkable = [];
    this.rect = new Phaser.Geom.Rectangle(x, this.top, INN_W, HOUSE_H);
    this.hallTop = this.top + INN.hallTop;
    this.floorY = GROUND_Y - 4;
    this.ghostAway = 99;
    this.chatCooldown = 0;
    this.zTimer = 0;

    scene.add.image(x, this.top, 'inn_interior').setOrigin(0).setDepth(DEPTH.interior);
    this.facade = scene.add.image(x, this.top, 'inn_facade').setOrigin(0).setDepth(DEPTH.facade);
    const roofX = x - 4, roofY = this.top - INN.roofH;
    scene.add.image(roofX, this.top, 'inn_roof').setOrigin(0, 1).setDepth(DEPTH.facade);
    for (const cx of INN.chimneys) {
      scene.add.particles(roofX + cx, roofY, 'smoke', {
        speedY: { min: -14, max: -8 }, speedX: { min: 2, max: 7 }, lifespan: 2600, frequency: 300,
        scale: { start: 0.6, end: 1.6 }, alpha: { start: 0.25, end: 0 }, tint: 0x8a8698,
      }).setDepth(DEPTH.facade - 0.5);
    }

    // party light glowing out of the big windows (fades with the facade)
    this.windowGlows = INN.windows.map(([x0, x1], k) => {
      const g = scene.add.image(x + (x0 + x1) / 2, this.top + 175, 'glow').setBlendMode(ADD)
        .setTint(k ? 0xb060ff : 0xff8a2a).setScale(1.3).setDepth(DEPTH.facade + 0.5);
      scene.time.addEvent({ delay: 450, loop: true, callback: () => g.setTint(g.tintTopLeft === 0xff8a2a ? 0xb060ff : 0xff8a2a) });
      return g;
    });
    // light inside the hall
    const inGlow = (lx, ly, tint, scale, alpha) => scene.add.image(x + lx, ly, 'glow').setTint(tint).setBlendMode(ADD)
      .setScale(scale).setAlpha(alpha).setDepth(DEPTH.interior + 0.3);
    const chandelier = inGlow(115, this.hallTop + 12, 0xffc860, 1.2, 0.5);
    scene.tweens.add({ targets: chandelier, alpha: 0.35, duration: 140, yoyo: true, repeat: -1, repeatDelay: 300 });
    inGlow(211, this.floorY - 10, 0xff8a1a, 0.7, 0.6);
    // pumpkins by the entrance
    for (const px of [86, 144]) {
      scene.add.image(x + px, GROUND_Y + 1, 'pumpkin').setOrigin(0.5, 1).setDepth(DEPTH.props);
      scene.add.image(x + px, GROUND_Y - 5, 'glow').setTint(0xff8a1a).setBlendMode(ADD).setScale(0.5).setAlpha(0.6).setDepth(DEPTH.props + 0.5);
    }

    this.spots = [];
    this.residents = [];
    this.populate();
  }

  populate() {
    const s = this.scene;
    const hall = HALL_SPOTS.map((d) => new HideSpot(s, d.type, this.x + d.x, this.floorY, d.cap));
    this.spots.push(...hall);
    for (const g of hall) {
      if (g.type === 'table') inGlowAt(s, g.cx - 5, this.floorY - 15);
    }
    const minX = this.x + 30, maxX = this.x + INN_W - 36;
    GUESTS.forEach((g, k) => {
      const gx = minX + ((k + 0.5) / GUESTS.length) * (maxX - minX) + Phaser.Math.Between(-6, 6);
      this.residents.push(new Resident(s, this, g.kind, this.floorY, minX, maxX, hall, {
        mode: 'dance', x: gx, acc: g.acc, shouts: PARTY_SHOUTS, shoutChance: 0.6,
      }));
    });
    const targets = hall.filter((h) => h.type === 'table' || h.type === 'kitchendoor').map((h) => h.cx);
    for (const kind of STAFF) {
      this.residents.push(new Resident(s, this, kind, this.floorY, minX, maxX, hall, {
        mode: 'waiter', targets, acc: { key: 'acc_tray', dx: 6, dy: -7, idleOnly: true },
        shouts: PARTY_SHOUTS, shoutChance: 0.6,
      }));
    }
    // hotel guests asleep upstairs
    let n = 0;
    for (let t = 0; t < 2; t++) {
      const floorY = this.top + t * STOREY_H + 52;
      for (const rx of INN.rooms) {
        const bed = new HideSpot(s, 'bed', this.x + rx + 4, floorY);
        this.spots.push(bed);
        this.residents.push(new Resident(s, this, SLEEPERS[n++ % SLEEPERS.length], floorY, bed.x, bed.x + 40, [bed], {
          mode: 'sleep', bed, shouts: SLEEPER_SHOUTS, shoutChance: 0.8,
        }));
      }
    }
  }

  contains(x, y) { return Phaser.Geom.Rectangle.Contains(this.rect, x, y); }

  inCellar() { return false; }

  inHall(x, y) { return this.contains(x, y) && y > this.hallTop; }

  // Only a BUH! scares anyone in here. In the hall it reaches the whole party,
  // upstairs it wakes the sleepers on that storey nearby.
  scareAt(x, y, radius) {
    const hall = this.inHall(x, y);
    const hit = this.residents.filter((r) => {
      if (r.state !== 'idle' && r.state !== 'sleep') return false;
      return r.floorY === this.floorY
        ? hall
        : !hall && Math.abs(r.x - x) <= radius * 0.7 && Math.abs(r.floorY - 9 - y) < 34;
    });
    // at most two shout out loud, otherwise the bubbles pile up
    Phaser.Utils.Array.Shuffle(hit).forEach((r, k) => { r.shoutChance = k < 2 ? 1 : 0; });
    return hit.filter((r) => r.scare()).length;
  }

  // Ghost floating around without saying BUH: the guests admire the "costume".
  onGhostNear(g, dt) {
    this.chatCooldown -= dt;
    if (!this.inHall(g.x, g.y)) return;
    if (!this.greeted) {
      this.greeted = true;
      this.scene.ghostSays?.('Eine Halloween-Party! Die halten mich für verkleidet...');
    }
    if (this.chatCooldown > 0) return;
    const now = this.scene.time.now;
    const r = this.residents.find((p) => p.state === 'idle' && p.mode !== 'sleep'
      && Math.abs(p.x - g.x) < 34 && !(p.chatUntil > now));
    if (!r) return;
    r.chatUntil = now + 6000;
    this.chatCooldown = 1.6;
    const lines = r.mode === 'waiter' ? STAFF_LINES : PARTY_LINES;
    this.scene.bubbles.say(r, () => ({ x: r.x, y: r.sprite.y - 19 }), Phaser.Utils.Array.GetRandom(lines),
      { style: 'resident', color: '#3a2a6a', ms: 1800 });
  }

  update(dt, ghost) {
    const inside = this.contains(ghost.x, ghost.y);
    this.ghostAway = inside ? 0 : this.ghostAway + dt;
    this.facade.alpha += ((inside ? 0.07 : 1) - this.facade.alpha) * Math.min(1, dt * 8);
    for (const g of this.windowGlows) g.setAlpha(0.55 * this.facade.alpha);
    for (const sp of this.spots) sp.update(dt);
    for (const r of this.residents) r.update(dt, this.ghostAway);
    // snoring hotel guests
    this.zTimer -= dt;
    if (this.zTimer <= 0) {
      this.zTimer = 0.7;
      const sleepers = this.residents.filter((r) => r.state === 'sleep');
      const r = sleepers.length && Phaser.Utils.Array.GetRandom(sleepers);
      if (r) {
        const z = this.scene.add.text(r.bed.x + 8, r.floorY - 14, 'z', {
          fontFamily: FONT, fontSize: '8px', color: '#cfe8ff',
        }).setOrigin(0.5, 1).setDepth(DEPTH.resident + 0.5).setScale(0.6);
        this.scene.tweens.add({
          targets: z, y: z.y - 14, x: z.x + 6, scale: 1, alpha: 0, duration: 1600, onComplete: () => z.destroy(),
        });
      }
    }
    return { inside, cellar: false };
  }
}

function inGlowAt(scene, x, y) {
  const g = scene.add.image(x, y, 'glow').setTint(0xff8a1a).setBlendMode(ADD).setScale(0.35).setAlpha(0.6)
    .setDepth(DEPTH.spot + 0.4);
  scene.tweens.add({ targets: g, alpha: 0.35, duration: 120, yoyo: true, repeat: -1, repeatDelay: Math.random() * 400 });
}
