import Phaser from 'phaser';
import { t, tl } from '../i18n.js';
import { DEPTH, FONT, GROUND_Y, CELLAR_TOP } from '../config.js';
import { sfx, playMusic, stopMusic } from '../sfx.js';

// Scare race: the ghost and its three friends try to scare the most people
// within one minute. Against the computer racer 0 is the player and 1–3 are the
// friends; with two players racer 0 is red (WASD) and racer 1 blue (arrow keys).
export const RACE_SECS = 60;
// `glow`: halo colour; `tint`: for the two hat ghosts of the two-player race.
export const RACERS = [
  { color: 0xffd27a, css: '#ffd27a', icon: 'ghost0', glow: 0xff9a3c, player: true },
  { color: 0x9fd8ff, css: '#9fd8ff', icon: 'friend0', glow: 0x9fd8ff, speed: 86 },
  { color: 0xb8ffb0, css: '#b8ffb0', icon: 'friend0', glow: 0xb8ffb0, speed: 78 },
  { color: 0xffb3e6, css: '#ffb3e6', icon: 'friend0', glow: 0xffb3e6, speed: 71 },
];
export const DUO_RACERS = [
  { color: 0xff6a6a, css: '#ff7a7a', icon: 'ghost0', tint: 0xff3a64, glow: 0xff2a3a, player: true, controls: 'p1' },
  { color: 0x6aa4ff, css: '#7ab0ff', icon: 'ghost0', tint: 0x6e9eff, glow: 0x2a6aff, player: true, controls: 'p2' },
];
export const getRacers = (duo) => (duo ? DUO_RACERS : RACERS);
export const racerName = (i, duo = false) => {
  if (duo) return tl('race.players')[i];
  return i === 0 ? t('race.you') : tl('race.names')[i - 1];
};

// Friends pick the inn and the metro station this much more eagerly (lower = closer).
const RICH_BIAS = 0.55;
// Proximity rule for the friends, a little stricter than the player's.
const NEAR_X = 28;
const NEAR_Y = 26;
const BOO_COOLDOWN = 2.4;
// Waypoints for the stair shafts: just above the street and inside the cellar.
const SHAFT_TOP = GROUND_Y - 24;
const CELLAR_MID = CELLAR_TOP + 36;
// hall guests at the party only fear a BUH, then anyone close (Inn.ALARM_RADIUS)
const HALL_ALARM = 36;

// One of the ghost friends, flying from person to person on its own.
class Rival {
  constructor(scene, race, index, x, y) {
    this.scene = scene;
    this.race = race;
    this.index = index;
    const def = race.racers[index];
    this.def = def;
    this.speed = def.speed;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.t = Math.random() * 6;
    this.target = null;
    this.path = [];
    this.cellar = null; // the house whose cellar the friend is in
    this.wait = 0;
    this.booCd = 0;
    this.stuck = 0;
    this.glow = scene.add.image(x, y, 'glow').setTint(def.color).setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.45).setScale(1.1).setDepth(DEPTH.glow);
    this.sprite = scene.add.sprite(x, y, 'friend0').play({ key: 'friend-float', startFrame: index % 2 })
      .setTint(def.color).setDepth(DEPTH.ghost - 0.1);
  }

  get onScreen() {
    return Phaser.Geom.Rectangle.Contains(this.scene.cameras.main.worldView, this.x, this.y);
  }

  // ---------------------------------------------------------------- choosing a victim
  pickTarget() {
    const now = this.scene.time.now;
    const claimed = new Set(this.race.rivals.filter((r) => r !== this).map((r) => r.target));
    let best = null, bestCost = Infinity;
    for (const r of this.race.people) {
      if ((r.state !== 'idle' && r.state !== 'sleep') || claimed.has(r) || r.skipUntil > now) continue;
      if (!r.spots.some((s) => s.free)) continue;
      // the inn and the metro are worth the detour: lots of people in one place
      const bias = this.race.richPlaces.includes(r.house) ? RICH_BIAS : 1;
      const cost = (this.pathLength(this.route(r)) + Math.random() * 120) * bias;
      if (cost < bestCost) { bestCost = cost; best = r; }
    }
    this.target = best;
    this.path = best ? this.route(best) : [];
  }

  // x of the stair that leads down into building b: a house's shaft, or the metro
  // exit nearest to x.
  stairX(b, x) {
    if (!b.exitXs) return b.shaft.cx;
    return b.exitXs.reduce((best, e) => (Math.abs(e - x) < Math.abs(best - x) ? e : best));
  }

  // Waypoints to a person: up out of the current cellar or station, down the right stair.
  route(r) {
    const pts = [];
    const b = r.house;
    // cellars and the metro lie well below the street (the fair stands right on it)
    const under = r.floorY > GROUND_Y + 20;
    if (this.cellar && !(under && b === this.cellar)) {
      const x = this.stairX(this.cellar, this.x);
      pts.push({ x, y: CELLAR_MID }, { x, y: SHAFT_TOP, leave: true });
    }
    if (under && b !== this.cellar) {
      const x = this.stairX(b, this.x);
      pts.push({ x, y: SHAFT_TOP }, { x, y: r.floorY - 20, enter: b });
    }
    pts.push({ person: r });
    return pts;
  }

  pathLength(pts) {
    let x = this.x, y = this.y, d = 0;
    for (const p of pts) {
      const q = p.person ? { x: p.person.x, y: p.person.floorY - 12 } : p;
      d += Math.hypot(q.x - x, q.y - y);
      x = q.x;
      y = q.y;
    }
    return d;
  }

  // ---------------------------------------------------------------- scaring
  boo() {
    if (this.booCd > 0) return;
    this.booCd = BOO_COOLDOWN;
    const s = this.scene;
    const color = this.def.color;
    if (this.onScreen) sfx.boo();
    const ring = s.add.image(this.x, this.y, 'ring').setTint(color).setDepth(DEPTH.fx).setScale(0.3).setAlpha(0.9);
    s.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 450, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    const label = s.add.text(this.x, this.y - 20, t('ghost.boo'), {
      fontFamily: FONT, fontSize: '8px', color: this.def.css, stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH.text);
    s.tweens.add({ targets: label, y: label.y - 12, alpha: 0, duration: 800, onComplete: () => label.destroy() });
    s.tweens.add({ targets: this.sprite, scale: 1.25, duration: 90, yoyo: true });
    for (const b of this.race.targets) {
      if (!b.contains(this.x, this.y) && !b.inCellar(this.x, this.y)) continue;
      const n = b.scareAt(this.x, this.y, 85);
      if (n > 0) this.race.add(this.index, n, this.x, this.y);
    }
  }

  // Everyone close enough flees – like with the player, but the party in the
  // inn's hall needs a BUH first.
  scareNearby() {
    const inn = this.race.inn;
    const inHall = inn.inHall(this.x, this.y);
    let wantBoo = false;
    let idleNear = 0;
    for (const r of this.race.people) {
      if (r.state !== 'idle' && r.state !== 'sleep') continue;
      const dx = Math.abs(r.x - this.x), dy = Math.abs(r.floorY - 9 - this.y);
      if (dy >= NEAR_Y + 8) continue;
      const hall = r.house === inn && r.floorY === inn.floorY;
      if (dx < 70 && r.state === 'idle') idleNear++;
      if (dx >= NEAR_X || dy >= NEAR_Y) continue;
      if (r.state === 'sleep' || (hall && !inn.alarmed)) { wantBoo = true; continue; }
      if (hall && (!inHall || dx >= HALL_ALARM)) continue;
      if (r.scare()) this.race.add(this.index, 1, r.x, r.floorY - 10);
    }
    // a whole group close by: one BUH gets them all
    if (wantBoo || idleNear >= 3) this.boo();
  }

  // ---------------------------------------------------------------- moving
  update(dt, running) {
    this.t += dt;
    this.booCd -= dt;
    let tx = this.x, ty = this.y;
    if (running) {
      this.wait -= dt;
      const r = this.target;
      if (!r || (r.state !== 'idle' && r.state !== 'sleep')) {
        // got it (or someone else did): a short breather, then the next one
        if (r) {
          this.wait = Math.max(this.wait, 0.6 + Math.random() * 0.7);
          this.path = this.path.filter((p) => !p.person);
        }
        this.target = null;
        if (this.wait <= 0) this.pickTarget();
      }
      const p = this.path[0];
      if (p) {
        if (p.person) { tx = p.person.x; ty = p.person.floorY - 12; }
        else { tx = p.x; ty = p.y; }
        if (!p.person && Math.hypot(tx - this.x, ty - this.y) < 4) {
          if (p.enter) this.cellar = p.enter;
          if (p.leave) this.cellar = null;
          this.path.shift();
        }
        // nobody can be scared here (all hiding places taken): try someone else
        if (p.person && Math.abs(tx - this.x) < 10 && Math.abs(ty - this.y) < 10) {
          this.stuck += dt;
          if (this.stuck > 1.2) {
            p.person.skipUntil = this.scene.time.now + 6000;
            this.target = null;
            this.path = [];
            this.stuck = 0;
          }
        } else {
          this.stuck = 0;
        }
      }
      this.scareNearby();
    }
    const dx = tx - this.x, dy = ty - this.y;
    const d = Math.hypot(dx, dy);
    // in the narrow stair shafts the friends slow down a little
    const max = this.cellar || this.y > GROUND_Y - 20 ? this.speed * 0.8 : this.speed;
    const want = d > 1 ? Math.min(max, d * 5) : 0;
    const k = Math.min(1, dt * 6);
    this.vx += ((d > 1 ? (dx / d) * want : 0) - this.vx) * k;
    this.vy += ((d > 1 ? (dy / d) * want : 0) - this.vy) * k;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.vx < -8) this.sprite.setFlipX(true);
    else if (this.vx > 8) this.sprite.setFlipX(false);
    const bob = Math.round(Math.sin(this.t * 3.4) * 1.6);
    this.sprite.setPosition(Math.round(this.x), Math.round(this.y + bob));
    this.glow.setPosition(this.x, this.y + bob);
  }
}

export class Race {
  constructor(scene, startX) {
    this.scene = scene;
    this.duo = scene.isDuo;
    this.racers = getRacers(this.duo);
    // the ghosts steered by people (racer index = position in this list)
    this.players = scene.players;
    this.phase = 'countdown';
    this.left = RACE_SECS;
    this.shownSecs = RACE_SECS;
    this.scores = this.racers.map(() => 0);
    this.reachedAt = this.racers.map(() => 0);
    this.inn = scene.inn;
    this.targets = [...scene.houses, scene.inn, scene.metro, ...(scene.fair ? [scene.fair] : [])];
    this.richPlaces = [scene.inn, scene.metro];
    this.people = this.targets.flatMap((b) => b.residents);
    // starting grid: the player at the bottom, the friends stacked above (two players: no friends)
    this.rivals = this.duo ? [] : [1, 2, 3].map((i) => new Rival(scene, this, i, startX, GROUND_Y - 30 - i * 30));
    // edge arrows, one layer per split-screen half (each camera only draws its own)
    this.arrows = scene.views.map((v) => {
      const g = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.text);
      for (const o of scene.views) if (o !== v) o.cam.ignore(g);
      return g;
    });

    for (const p of this.players) p.locked = true;
    scene.time.delayedCall(700, () => this.countdown());
  }

  ui(ev, ...args) { this.scene.game.events.emit(ev, ...args); }

  countdown() {
    const s = this.scene;
    this.ui('ui:race-count', null, t('race.goal'));
    ['3', '2', '1'].forEach((n, k) => s.time.delayedCall(900 + k * 1000, () => { sfx.count(); this.ui('ui:race-count', n); }));
    s.time.delayedCall(3900, () => {
      sfx.go();
      this.ui('ui:race-count', t('race.go'));
      this.phase = 'run';
      for (const p of this.players) p.locked = false;
      playMusic('race');
      this.ui('ui:race-time', RACE_SECS);
    });
  }

  // Racer `i` scared `n` people at x, y.
  add(i, n, x, y) {
    if (this.phase !== 'run' || n <= 0) return;
    this.scores[i] += n;
    this.reachedAt[i] = this.scene.time.now;
    const s = this.scene;
    if (this.racers[i].player) sfx.point();
    const label = s.add.text(x, y - 20, `+${n}`, {
      fontFamily: FONT, fontSize: '8px', color: this.racers[i].css, stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH.text);
    s.tweens.add({ targets: label, y: label.y - 14, alpha: 0, duration: 900, delay: 200, onComplete: () => label.destroy() });
    this.ui('ui:race-scores', this.standings());
    // the friends tease now and then
    const rival = this.rivals[i - 1];
    if (rival && rival.onScreen && Math.random() < 0.3 && !s.bubbles.isShowing(`rival${i}`)) {
      s.bubbles.say(`rival${i}`, () => ({ x: rival.x, y: rival.y - 14 }), Phaser.Utils.Array.GetRandom(tl('race.taunts')),
        { style: 'friend', ms: 1100 });
    }
  }

  // Racer indices with scores, best first; on a tie whoever got there first wins.
  standings() {
    return this.racers.map((_, i) => ({ i, score: this.scores[i], at: this.reachedAt[i] }))
      .sort((a, b) => b.score - a.score || a.at - b.at || a.i - b.i);
  }

  update(dt) {
    const running = this.phase === 'run';
    for (const r of this.rivals) r.update(dt, running);
    this.drawArrows();
    if (!running) return;
    this.left -= dt;
    const secs = Math.max(0, Math.ceil(this.left));
    if (secs !== this.shownSecs) {
      this.shownSecs = secs;
      this.ui('ui:race-time', secs);
      if (secs <= 10 && secs > 0) sfx.clock();
    }
    if (this.left <= 0) this.finish();
  }

  // Little arrows at the screen edge point to the other ghosts out of sight
  // (in split screen each half points to the other player).
  drawArrows() {
    this.scene.views.forEach((view, k) => {
      const a = this.arrows[k];
      a.clear();
      const v = view.cam.worldView;
      const others = [
        ...this.rivals.map((r) => ({ x: r.x, y: r.y, color: r.def.color })),
        ...this.players.filter((p) => p !== view.ghost).map((p) => ({ x: p.x, y: p.y, color: this.racers[p.racer].color })),
      ];
      for (const o of others) this.drawArrow(a, v, o);
    });
  }

  // One arrow on layer `a` towards r ({ x, y, color }) for the view rectangle v.
  drawArrow(a, v, r) {
    if (Phaser.Geom.Rectangle.Contains(v, r.x, r.y)) return;
    const dx = r.x - v.centerX, dy = r.y - v.centerY;
    // scale the direction so that it just touches the inset screen border
    const f = Math.min((v.width / 2 - 8) / Math.max(1, Math.abs(dx)), (v.height / 2 - 8) / Math.max(1, Math.abs(dy)));
    const x = v.width / 2 + dx * f, y = v.height / 2 + dy * f;
    const ang = Math.atan2(dy, dx);
    const tip = (k, d) => [x + Math.cos(ang + k) * d, y + Math.sin(ang + k) * d];
    const [x1, y1] = tip(0, 5), [x2, y2] = tip(2.5, 4), [x3, y3] = tip(-2.5, 4);
    a.fillStyle(0x000000, 0.6).fillTriangle(x1 + 1, y1 + 1, x2 + 1, y2 + 1, x3 + 1, y3 + 1);
    a.fillStyle(r.color, 0.95).fillTriangle(x1, y1, x2, y2, x3, y3);
  }

  finish() {
    this.phase = 'over';
    const s = this.scene;
    for (const p of this.players) {
      p.locked = true;
      p.vx = p.vy = 0;
    }
    stopMusic();
    sfx.whistle();
    this.ui('ui:race-over', t('race.timeUp'));
    this.scene.registry.set('raceResults', this.standings().map(({ i, score }) => ({ i, score })));
    s.time.delayedCall(2200, () => {
      for (const v of s.views) v.cam.fadeOut(700, 0, 0, 0);
      s.cameras.main.once('camerafadeoutcomplete', () => {
        s.scene.stop('UI');
        s.scene.start('Podium');
      });
    });
  }
}
