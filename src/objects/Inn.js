import Phaser from 'phaser';
import { t, tl } from '../i18n.js';
import { DEPTH, FONT, GROUND_Y, HOUSE_H, INN_W, STOREY_H } from '../config.js';
import { INN, HOTEL, bedX, wardrobeX } from '../textures/inn.js';
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
const DANCE_MOVES = ['sway', 'step', 'pump']; // handed out in turn, so neighbours differ
const STAFF = ['waiter', 'waitress'];
const SLEEPERS = ['grandpa', 'mom', 'dad', 'granny', 'kid', 'teen'];

const BUH_REACH = 36;      // a BUH in the hall only frightens the people close by ...
const ALARM_RADIUS = 36;   // ... but afterwards everyone flees when the ghost comes near
const CHAT_GAP = 4.5;      // seconds between two guests admiring the "costume"
const CHAT_AGAIN = 15000;  // ms before the same guest comments again

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
        mode: 'dance', dance: DANCE_MOVES[k % DANCE_MOVES.length], x: gx, acc: g.acc, shouts: tl('inn.partyShouts'), shoutChance: 0.6,
      }));
    });
    const targets = hall.filter((h) => h.type === 'table' || h.type === 'kitchendoor').map((h) => h.cx);
    for (const kind of STAFF) {
      this.residents.push(new Resident(s, this, kind, this.floorY, minX, maxX, hall, {
        mode: 'waiter', targets, acc: { key: 'acc_tray', dx: 6, dy: -7, idleOnly: true },
        shouts: tl('inn.partyShouts'), shoutChance: 0.6,
      }));
    }
    // hotel guests upstairs: all asleep except one who is still up
    let n = 0;
    HOTEL.forEach((rooms, t) => {
      const floorY = this.top + t * STOREY_H + 52;
      for (const r of rooms) {
        const bed = new HideSpot(s, 'bed', this.x + bedX(r), floorY);
        const spots = [bed];
        if (r.wardrobe) spots.push(new HideSpot(s, 'wardrobe', this.x + wardrobeX(r), floorY));
        this.spots.push(...spots);
        if (r.awake) {
          this.residents.push(new Resident(s, this, 'teen', floorY, this.x + r.x + 12, this.x + r.x + r.w - 12, spots, { mode: 'walk' }));
        } else {
          this.residents.push(new Resident(s, this, SLEEPERS[n++ % SLEEPERS.length], floorY, bed.x, bed.x + 40, [bed], {
            mode: 'sleep', bed, shouts: tl('inn.sleeperShouts'), shoutChance: 0.8,
          }));
        }
      }
    });
  }

  contains(x, y) { return Phaser.Geom.Rectangle.Contains(this.rect, x, y); }

  inCellar() { return false; }

  inHall(x, y) { return this.contains(x, y) && y > this.hallTop; }

  // A BUH! in the hall frightens the guests close by and alarms the party;
  // upstairs it wakes the sleepers nearby on that storey.
  scareAt(x, y, radius) {
    const hall = this.inHall(x, y);
    if (hall) {
      this.alarmed = true;
      this.scene.bubbles.stop('ghost');
    }
    const hit = this.residents.filter((r) => {
      if (r.state !== 'idle' && r.state !== 'sleep') return false;
      return r.floorY === this.floorY
        ? hall && Math.abs(r.x - x) <= BUH_REACH
        : !hall && Math.abs(r.x - x) <= radius * 0.7 && Math.abs(r.floorY - 9 - y) < 34;
    });
    // only one of them shouts out loud, otherwise the bubbles pile up
    Phaser.Utils.Array.Shuffle(hit).forEach((r, k) => { r.shoutChance = k === 0 ? 1 : 0; });
    return hit.filter((r) => r.scare()).length;
  }

  // Called every frame while the ghost is inside; returns who got scared.
  onGhostNear(g, dt) {
    const scared = [];
    const near = (r, dx) => r.state === 'idle' && Math.abs(r.x - g.x) < dx && Math.abs(r.floorY - 9 - g.y) < 26;
    // the hotel guest who is still awake reacts like anyone else
    for (const r of this.residents) {
      if (r.mode === 'walk' && near(r, 32) && r.scare()) scared.push(r);
    }
    this.chatCooldown -= dt;
    if (!this.inHall(g.x, g.y)) return scared;
    if (this.alarmed) {
      // after the first BUH nobody believes in the costume any more
      for (const r of this.residents) {
        if (r.floorY !== this.floorY || !near(r, ALARM_RADIUS)) continue;
        r.shoutChance = this.anyoneTalking() ? 0 : 0.5;
        if (r.scare()) scared.push(r);
      }
      return scared;
    }
    if (!this.greeted) {
      this.greeted = true;
      this.scene.ghostSays?.(t('ghost.party'));
      this.chatCooldown = 3;
    }
    this.chat(g);
    return scared;
  }

  anyoneTalking() {
    return this.residents.some((r) => this.scene.bubbles.isShowing(r));
  }

  // Guests admire the "costume" now and then – one bubble at a time.
  chat(g) {
    const b = this.scene.bubbles;
    if (this.chatCooldown > 0 || b.isShowing('ghost') || (this.lastChat && b.isShowing(this.lastChat))) return;
    const now = this.scene.time.now;
    const r = this.residents.find((p) => p.state === 'idle' && p.floorY === this.floorY
      && Math.abs(p.x - g.x) < 34 && !(p.chatUntil > now));
    if (!r) return;
    r.chatUntil = now + CHAT_AGAIN;
    this.chatCooldown = CHAT_GAP;
    this.lastChat = r;
    const lines = r.mode === 'waiter' ? tl('inn.staffLines') : tl('inn.partyLines');
    b.say(r, () => ({ x: r.x, y: r.sprite.y - 19 }), Phaser.Utils.Array.GetRandom(lines),
      { style: 'resident', color: '#3a2a6a', ms: 1800 });
  }

  update(dt, ghost, others = []) {
    const inside = this.contains(ghost.x, ghost.y);
    const visited = inside || others.some((o) => this.contains(o.x, o.y));
    this.ghostAway = visited ? 0 : this.ghostAway + dt;
    // once the ghost has been gone a while, the party carries on as if nothing happened
    if (this.ghostAway > 4) this.alarmed = false;
    this.facade.alpha += ((visited ? 0.07 : 1) - this.facade.alpha) * Math.min(1, dt * 8);
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
