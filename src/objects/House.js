import Phaser from 'phaser';
import {
  DEPTH, FONT, GROUND_Y, HOUSE_W, HOUSE_H, STOREY_H, STOREYS, CELLAR_TOP, CELLAR_H, SHAFT_W,
} from '../config.js';
import { ROOF, CELLAR_WINDOWS, ROOM_PROPS, roomType } from '../textures/city.js';
import { sfx } from '../sfx.js';

const SPOT_SIZE = { wardrobe: [20, 40], door: [18, 38], bed: [40, 18], crates: [26, 26] };
const OPENABLE = new Set(['wardrobe', 'door']);
const EYES_Y = { wardrobe: 22, bed: 2, crates: 20 };
const REAPPEAR_DELAY = 2.6;
const SHOUTS = ['Ein Geist!', 'Ahh!', 'Hilfe!', 'Iiieh!'];
const KID_SHOUTS = ['Mama, Papa!', 'Ein Geist!', 'Ahh!'];
const ADD = Phaser.BlendModes.ADD;

class HideSpot {
  constructor(scene, type, x, floorY) {
    this.scene = scene;
    this.type = type;
    const [w, h] = SPOT_SIZE[type];
    this.w = w;
    this.h = h;
    this.x = x;
    this.cx = x + w / 2;
    this.floorY = floorY;
    this.occupant = null;
    this.reservedBy = null;
    this.sprite = scene.add.image(x, floorY, type).setOrigin(0, 1).setDepth(DEPTH.spot);
    this.eyes = scene.add.image(this.cx + (type === 'bed' ? 4 : 0), floorY - (EYES_Y[type] || 22), 'eyes')
      .setDepth(DEPTH.spot + 0.5).setVisible(false);
    this.blink = 0;
  }

  get free() { return !this.occupant && !this.reservedBy; }

  occupy(res) {
    this.occupant = res;
    this.reservedBy = null;
    sfx.hide();
    if (OPENABLE.has(this.type)) {
      this.sprite.setTexture(`${this.type}_open`);
      this.scene.time.delayedCall(160, () => { if (this.occupant) this.sprite.setTexture(this.type); });
    }
    this.shake = this.scene.tweens.add({
      targets: this.sprite, x: this.x + 1, duration: 60, yoyo: true, repeat: -1, delay: 200,
    });
    this.scene.time.delayedCall(500, () => { if (this.occupant && this.type !== 'door') this.eyes.setVisible(true); });
  }

  release() {
    this.occupant = null;
    this.shake?.stop();
    this.sprite.x = this.x;
    this.eyes.setVisible(false);
    if (OPENABLE.has(this.type)) {
      this.sprite.setTexture(`${this.type}_open`);
      this.scene.time.delayedCall(220, () => { if (!this.occupant) this.sprite.setTexture(this.type); });
    }
  }

  update(dt) {
    if (!this.occupant || this.type === 'door') return;
    this.blink -= dt;
    if (this.blink <= 0) {
      this.eyes.setVisible(!this.eyes.visible);
      this.blink = this.eyes.visible ? 1 + Math.random() * 2 : 0.12;
    }
  }
}

class Resident {
  constructor(scene, house, kind, floorY, minX, maxX, spots) {
    this.scene = scene;
    this.house = house;
    this.kind = kind;
    this.floorY = floorY;
    this.minX = minX;
    this.maxX = maxX;
    this.spots = spots;
    this.x = Phaser.Math.Between(minX, maxX);
    this.state = 'idle';
    this.target = this.x;
    this.wait = Math.random() * 2;
    this.sprite = scene.add.sprite(this.x, floorY, `p_${kind}_0`).setOrigin(0.5, 1).setDepth(DEPTH.resident);
  }

  scare() {
    if (this.state !== 'idle') return false;
    const free = this.spots.filter((s) => s.free);
    if (!free.length) return false;
    free.sort((a, b) => Math.abs(a.cx - this.x) - Math.abs(b.cx - this.x));
    this.spot = free[0];
    this.spot.reservedBy = this;
    this.state = 'flee';
    this.sprite.anims.stop();
    this.sprite.setTexture(`p_${this.kind}_s`);
    this.sprite.setFlipX(this.spot.cx < this.x);
    sfx.scream();
    const s = this.scene;
    if (Math.random() < 0.45) {
      // now and then a real shout instead of the plain "!"
      const lines = this.kind === 'kid' || this.kind === 'teen' ? KID_SHOUTS : SHOUTS;
      s.bubbles.say(this, () => ({ x: this.x, y: this.sprite.y - 19 }), Phaser.Utils.Array.GetRandom(lines),
        { style: 'resident', ms: 1600, interrupt: true });
    } else {
      const t = s.add.text(this.x, this.floorY - 24, '!', {
        fontFamily: FONT, fontSize: '8px', color: '#ff5a5a', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(DEPTH.text);
      s.tweens.add({ targets: t, y: t.y - 6, duration: 160, yoyo: true, repeat: 1, onComplete: () => t.destroy() });
    }
    s.tweens.add({ targets: this.sprite, y: this.floorY - 5, duration: 120, yoyo: true, ease: 'Quad.easeOut' });
    this.pause = 0.25;
    return true;
  }

  update(dt, ghostAway) {
    const sp = this.sprite;
    switch (this.state) {
      case 'idle': {
        if (this.wait > 0) {
          this.wait -= dt;
          if (sp.anims.isPlaying) { sp.anims.stop(); sp.setTexture(`p_${this.kind}_0`); }
          if (this.wait <= 0) this.target = Phaser.Math.Between(this.minX, this.maxX);
          break;
        }
        const dx = this.target - this.x;
        if (Math.abs(dx) < 1) { this.wait = 1 + Math.random() * 3; break; }
        this.x += Math.sign(dx) * Math.min(Math.abs(dx), 14 * dt);
        sp.setFlipX(dx < 0);
        if (!sp.anims.isPlaying) sp.play(`walk_${this.kind}`);
        break;
      }
      case 'flee': {
        if (this.pause > 0) { this.pause -= dt; break; }
        const dx = this.spot.cx - this.x;
        this.x += Math.sign(dx) * Math.min(Math.abs(dx), 80 * dt);
        sp.y = this.floorY - (Math.floor(this.x / 4) % 2);
        if (Math.abs(dx) < 1) {
          this.state = 'hidden';
          sp.setVisible(false);
          this.spot.occupy(this);
          this.hiddenFor = 0;
        }
        break;
      }
      case 'hidden': {
        this.hiddenFor += dt;
        if (ghostAway > REAPPEAR_DELAY && this.hiddenFor > 1.5) {
          this.spot.release();
          this.spot = null;
          this.state = 'idle';
          sp.setVisible(true).setTexture(`p_${this.kind}_0`);
          sp.y = this.floorY;
          this.wait = 0.8;
          const t = this.scene.add.text(this.x, this.floorY - 22, 'puh...', {
            fontFamily: FONT, fontSize: '8px', color: '#cfe8ff', stroke: '#000', strokeThickness: 2,
          }).setOrigin(0.5, 1).setDepth(DEPTH.text).setAlpha(0);
          this.scene.tweens.add({ targets: t, alpha: 1, y: t.y - 6, duration: 400, hold: 600, yoyo: true, onComplete: () => t.destroy() });
        }
        break;
      }
    }
    sp.x = Math.round(this.x);
  }
}

// Hiding spots per storey (0 = top floor) in un-mirrored house coordinates;
// x is the spot's left edge. Furniture art keeps x 50..100 free for them.
const LAYOUT = [
  [{ type: 'bed', x: 6 }, { type: 'door', x: 126 }],
  [{ type: 'wardrobe', x: 6 }, { type: 'door', x: 126 }],
  [{ type: 'bed', x: 6 }, { type: 'wardrobe', x: 124 }],
  [{ type: 'door', x: 6 }, { type: 'wardrobe', x: 124 }],
];
const CELLAR_LAYOUT = [{ type: 'crates', x: 8 }, { type: 'wardrobe', x: 116 }];
const KINDS = ['dad', 'mom', 'kid', 'grandpa', 'teen', 'granny'];

export class House {
  // lair: null, 'house' or 'cellar' – where the wizard hides, if here.
  constructor(scene, index, x, lair) {
    this.scene = scene;
    this.index = index;
    this.x = x;
    this.top = GROUND_Y - HOUSE_H;
    this.lair = lair;
    this.mirror = index % 2 === 1;
    this.rect = new Phaser.Geom.Rectangle(x, this.top, HOUSE_W, HOUSE_H);
    this.cellarRect = new Phaser.Geom.Rectangle(x, CELLAR_TOP, HOUSE_W, CELLAR_H);
    this.ghostAway = 99;

    // The stair shaft sits in the gap beside the house, on the side of the cellar door.
    const sx = this.mirror ? x - SHAFT_W - 2 : x + HOUSE_W + 2;
    this.shaft = { x: sx, cx: sx + SHAFT_W / 2 };
    const bottom = CELLAR_TOP + CELLAR_H - 13;
    // Where the ghost's centre may be below the street.
    this.walkable = [
      new Phaser.Geom.Rectangle(sx + 7, GROUND_Y - 20, 14, bottom - (GROUND_Y - 20)),
      this.mirror
        ? new Phaser.Geom.Rectangle(sx + 7, CELLAR_TOP + 13, x + 140 - (sx + 7), CELLAR_H - 26)
        : new Phaser.Geom.Rectangle(x + 10, CELLAR_TOP + 13, sx + 21 - (x + 10), CELLAR_H - 26),
    ];

    scene.add.image(x, this.top, lair === 'house' ? 'interior_wizard' : `interior_${index}`).setOrigin(0).setDepth(DEPTH.interior);
    scene.add.image(x, CELLAR_TOP, lair === 'cellar' ? 'cellar_wizard' : `cellar_${index}`).setOrigin(0).setDepth(DEPTH.interior);
    this.facade = scene.add.image(x, this.top, `facade_${index}`).setOrigin(0).setDepth(DEPTH.facade);
    this.cover = scene.add.image(x, CELLAR_TOP, 'cellar_cover').setOrigin(0).setDepth(DEPTH.facade);
    const roofX = x - 4;
    const roofY = this.top - ROOF.h;
    scene.add.image(roofX, this.top, `roof_${index}`).setOrigin(0, 1).setDepth(DEPTH.facade);
    scene.add.image(sx, GROUND_Y - 14, 'shaft').setOrigin(0).setDepth(DEPTH.shaft).setFlipX(this.mirror);

    // chimney smoke – purple for the wizard's house
    const wiz = !!lair;
    ROOF.chimneys.forEach((cx, k) => {
      if (!wiz && (index + k) % 2) return;
      scene.add.particles(roofX + cx, roofY, 'smoke', {
        speedY: { min: -14, max: -8 }, speedX: { min: 2, max: 7 },
        lifespan: 2600, frequency: wiz ? 160 : 340,
        scale: { start: 0.6, end: 1.6 }, alpha: { start: wiz ? 0.55 : 0.22, end: 0 },
        tint: wiz ? [0xb060ff, 0x7a30d0, 0xff70e0] : 0x8a8698,
      }).setDepth(DEPTH.facade - 0.5);
    });

    // dormer windows
    ROOF.dormers.forEach((dx, k) => {
      const wx = roofX + dx, wy = roofY + ROOF.dormerY;
      if (lair === 'house') this.purpleLight(wx, wy, 10, 12, 0.6);
      else if ((index + k) % 3 === 0) scene.add.rectangle(wx, wy, 10, 12, 0x6a5020, 0.75).setDepth(DEPTH.facade + 0.4);
    });
    // cellar hints: lit plinth windows and a lamp at the cellar door
    const lampX = sx + 15;
    const lampY = GROUND_Y + 68;
    if (lair === 'cellar') {
      for (const cx of CELLAR_WINDOWS) this.purpleLight(x + cx, GROUND_Y - 5, 11, 6, 0.45);
      this.purpleLight(lampX, lampY, 3, 4, 0.9);
      scene.add.image(lampX, lampY + 30, 'glow').setTint(0xb04dff).setBlendMode(ADD).setScale(0.9).setAlpha(0.5).setDepth(DEPTH.shaft + 0.1);
    } else {
      scene.add.image(lampX, lampY, 'glow').setTint(0xffc860).setBlendMode(ADD).setScale(0.4).setAlpha(0.6).setDepth(DEPTH.shaft + 0.1);
    }

    this.spots = [];
    this.residents = [];
    this.populate();
    if (lair !== 'house') this.addHaunts();
  }

  // Lamps, TVs, bookshelves and clocks inside that react when the ghost floats by.
  addHaunts() {
    const s = this.scene;
    const D = DEPTH.interior + 0.3;
    const mx = (x, w = 0) => this.x + (this.mirror ? HOUSE_W - x - w : x);
    for (let t = 0; t < STOREYS; t++) {
      const y0 = this.top + t * STOREY_H;
      for (const p of ROOM_PROPS[roomType(this.index, t)]) {
        if (p.type === 'lamp') {
          const x = mx(p.x), y = y0 + p.y;
          const glow = s.add.image(x, y + 4, 'glow').setTint(0xffc860).setBlendMode(ADD).setScale(0.5).setAlpha(0.45).setDepth(D);
          const off = s.add.rectangle(x, y, p.w, p.h, 0x2a2018).setDepth(D - 0.1).setVisible(false);
          s.addHaunt(x, y + 6, 26, () => {
            sfx.fizzle();
            s.flicker((on) => { glow.setVisible(on); off.setVisible(!on); }, 9, 80);
          });
        } else if (p.type === 'tv') {
          const x = mx(p.x, p.w) + p.w / 2, y = y0 + p.y + p.h / 2;
          const screen = s.add.rectangle(x, y, p.w, p.h, 0x111111).setDepth(D).setVisible(false);
          s.addHaunt(x, y, 28, () => {
            sfx.static();
            // off – snow – off – snow ... then back to the normal picture
            s.flicker((on, last) => {
              if (last) { screen.setVisible(false); return; }
              const grey = Phaser.Math.Between(0x70, 0xe0);
              screen.setVisible(true).setFillStyle(on ? Phaser.Display.Color.GetColor(grey, grey, grey) : 0x111111);
            }, 8, 110);
          });
        } else if (p.type === 'clock') {
          const x = mx(p.x), y = y0 + p.y;
          s.add.image(x, y, 'clockface').setDepth(D);
          const minute = s.add.image(x, y, 'px').setTint(0x222222).setScale(1, 3).setOrigin(0.5, 1).setDepth(D + 0.1);
          const hour = s.add.image(x, y, 'px').setTint(0x222222).setScale(1, 2).setOrigin(0.5, 1).setAngle(90).setDepth(D + 0.1);
          s.addHaunt(x, y, 26, () => {
            sfx.tick();
            // the hands spin backwards
            s.tweens.add({ targets: minute, angle: minute.angle - 720, duration: 1200, ease: 'Cubic.easeInOut' });
            s.tweens.add({ targets: hour, angle: hour.angle - 60, duration: 1200, ease: 'Cubic.easeInOut' });
          });
        } else if (p.type === 'books') {
          const sx = mx(p.x, p.w);
          s.addHaunt(sx + p.w / 2, y0 + 30, 28, () => this.dropBooks(sx, y0 + p.y, p.w, p.rows, y0 + 52));
        }
      }
    }
  }

  dropBooks(sx, top, w, rows, floorY) {
    const s = this.scene;
    const dir = this.mirror ? -1 : 1; // towards the middle of the room
    const n = Phaser.Math.Between(2, 3);
    for (let k = 0; k < n; k++) {
      const bx = sx + 2 + Math.random() * (w - 4);
      const by = top + Phaser.Math.Between(0, rows - 1) * 9 + 3;
      const color = Phaser.Utils.Array.GetRandom([0x7a1f2a, 0x1f4a3a, 0x2a3a6a, 0x6a5a1a, 0x4a2a5a]);
      const book = s.add.rectangle(bx, by, 2, 7, color).setDepth(DEPTH.interior + 0.4);
      s.time.delayedCall(k * 180, () => {
        s.tweens.add({ targets: book, x: bx + dir * (6 + Math.random() * 12), duration: 520 });
        s.tweens.add({
          targets: book, y: floorY - 1, angle: 90 * dir, duration: 520, ease: 'Bounce.easeOut',
          onStart: () => sfx.thud(),
        });
        s.tweens.add({ targets: book, alpha: 0, delay: 6000, duration: 600, onComplete: () => book.destroy() });
      });
    }
  }

  purpleLight(x, y, w, h, scale) {
    const s = this.scene;
    s.add.rectangle(x, y, w, h, 0xc070ff, 0.85).setDepth(DEPTH.facade + 0.4);
    const g = s.add.image(x, y, 'glow').setTint(0xb04dff).setBlendMode(ADD).setScale(scale).setDepth(DEPTH.facade + 0.5);
    s.tweens.add({ targets: g, alpha: 0.3, duration: 140, yoyo: true, repeat: -1, repeatDelay: 300 + Math.random() * 300 });
  }

  populate() {
    const s = this.scene;
    const lx = (x, w) => this.x + (this.mirror ? HOUSE_W - x - w : x);
    const kinds = Phaser.Utils.Array.Shuffle([...KINDS]);
    const addFloor = (defs, floorY, count) => {
      const spots = defs.map((d) => new HideSpot(s, d.type, lx(d.x, SPOT_SIZE[d.type][0]), floorY));
      this.spots.push(...spots);
      for (let n = 0; n < count && kinds.length; n++) {
        this.residents.push(new Resident(s, this, kinds.pop(), floorY, this.x + 50, this.x + HOUSE_W - 50, spots));
      }
    };
    if (this.lair !== 'house') {
      for (let t = 0; t < STOREYS; t++) {
        const floorY = this.top + t * STOREY_H + 52;
        const count = t === STOREYS - 1 ? Phaser.Math.Between(1, 2) : (Math.random() < 0.7 ? 1 : 0);
        addFloor(LAYOUT[t], floorY, count);
      }
    }
    if (this.lair !== 'cellar') addFloor(CELLAR_LAYOUT, CELLAR_TOP + 56, Math.random() < 0.5 ? 1 : 0);
  }

  contains(x, y) {
    return Phaser.Geom.Rectangle.Contains(this.rect, x, y);
  }

  inCellar(x, y) {
    return Phaser.Geom.Rectangle.Contains(this.cellarRect, x, y);
  }

  // Floor line of whatever level (storey or cellar) the point is on.
  floorAt(y) {
    if (y > GROUND_Y) return CELLAR_TOP + 56;
    const t = Phaser.Math.Clamp(Math.floor((y - this.top) / STOREY_H), 0, STOREYS - 1);
    return this.top + t * STOREY_H + 52;
  }

  scareAt(x, y, radius) {
    let n = 0;
    for (const r of this.residents) {
      if (r.state !== 'idle') continue;
      if (Math.abs(r.x - x) <= radius && Math.abs(r.floorY - 9 - y) < 34 && r.scare()) n++;
    }
    return n;
  }

  update(dt, ghost) {
    const inside = this.contains(ghost.x, ghost.y);
    const cellar = this.inCellar(ghost.x, ghost.y);
    this.ghostAway = inside || cellar ? 0 : this.ghostAway + dt;
    const fade = (img, on) => { img.alpha += ((on ? 0.07 : 1) - img.alpha) * Math.min(1, dt * 8); };
    fade(this.facade, inside);
    fade(this.cover, cellar);
    for (const sp of this.spots) sp.update(dt);
    for (const r of this.residents) r.update(dt, this.ghostAway);
    return { inside, cellar };
  }
}
