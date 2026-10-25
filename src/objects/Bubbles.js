import Phaser from 'phaser';
import { FONT, DEPTH } from '../config.js';

const STYLES = {
  ghost: { bg: 0xfff4dc, border: 0xc86a1a, text: '#3a1a00' },
  wizard: { bg: 0x1e1030, border: 0xc86bff, text: '#f0d8ff' },
  apprentice: { bg: 0x0e2a28, border: 0x2fc0a0, text: '#d8fff0' },
  friend: { bg: 0xe6f6ff, border: 0x5aa0d0, text: '#14324a' },
  resident: { bg: 0xffffff, border: 0x3a2a2a, text: '#b02a2a' },
};
const WRAP = 168;
const HUD_H = 28; // keep clear of the score/objective lines at the top

// Comic speech bubbles that hang above a speaker and follow it around.
// Every speaker has its own queue, so the ghost and the wizard can talk at once.
export class Bubbles {
  constructor(scene) {
    this.scene = scene;
    this.speakers = new Map();
    scene.events.on('postupdate', this.update, this);
    scene.events.once('shutdown', () => scene.events.off('postupdate', this.update, this));
  }

  // anchor: () => ({ x, y }) – the point the tail points at (top of the head).
  say(id, anchor, text, { style = 'ghost', color, ms, interrupt = false } = {}) {
    let sp = this.speakers.get(id);
    if (!sp) {
      sp = { queue: [], current: null };
      this.speakers.set(id, sp);
    }
    const item = { anchor, text, style, color, ms: ms ?? Phaser.Math.Clamp(1800 + text.length * 45, 2200, 6500) };
    if (interrupt) {
      sp.queue = [];
      this.close(sp, true);
      this.open(sp, item);
    } else if (!sp.current) {
      this.open(sp, item);
    } else {
      sp.queue.push(item);
    }
  }

  // Does this speaker have a bubble up right now?
  isShowing(id) {
    return !!this.speakers.get(id)?.current;
  }

  // Is this speaker still saying its current line? (drives mouth animation)
  isTalking(id) {
    const c = this.speakers.get(id)?.current;
    return !!c && this.scene.time.now < c.talkUntil;
  }

  // Close one speaker's bubble and drop whatever it still had to say.
  stop(id) {
    const sp = this.speakers.get(id);
    if (sp) { sp.queue = []; this.close(sp, false); }
  }

  clear() {
    for (const sp of this.speakers.values()) { sp.queue = []; this.close(sp, true); }
  }

  open(sp, item) {
    const s = this.scene;
    const st = STYLES[item.style];
    const g = s.add.graphics().setDepth(DEPTH.text);
    const t = s.add.text(0, 0, item.text, {
      fontFamily: FONT, fontSize: '8px', color: item.color || st.text, lineSpacing: 3,
      wordWrap: { width: WRAP }, align: 'center',
    }).setDepth(DEPTH.text + 0.1);
    sp.current = { ...item, g, t, st, w: Math.ceil(t.width) + 10, h: Math.ceil(t.height) + 8 };
    // roughly as long as it takes to say the words
    sp.current.talkUntil = s.time.now + Math.min(item.ms - 300, item.text.length * 70);
    g.setAlpha(0); t.setAlpha(0);
    s.tweens.add({ targets: [g, t], alpha: 1, duration: 120 });
    sp.timer = s.time.delayedCall(item.ms, () => this.next(sp));
    this.layout(sp.current);
  }

  next(sp) {
    this.close(sp, false);
    const item = sp.queue.shift();
    if (item) this.scene.time.delayedCall(180, () => { if (!sp.current) this.open(sp, item); });
  }

  close(sp, instant) {
    sp.timer?.remove();
    const c = sp.current;
    sp.current = null;
    if (!c) return;
    if (instant) { c.g.destroy(); c.t.destroy(); return; }
    this.scene.tweens.add({ targets: [c.g, c.t], alpha: 0, duration: 150, onComplete: () => { c.g.destroy(); c.t.destroy(); } });
  }

  layout(c) {
    const view = this.scene.cameras.main.worldView;
    const a = c.anchor();
    const { w, h, st, g } = c;
    let bx = Math.round(Phaser.Math.Clamp(a.x - w / 2, view.x + 3, view.right - 3 - w));
    let by = Math.round(a.y - 7 - h);
    let below = false;
    if (by < view.y + HUD_H) {
      // no room above the speaker: hang the bubble underneath instead
      below = true;
      by = Math.round(a.y + 30);
    }
    by = Math.round(Phaser.Math.Clamp(by, view.y + HUD_H, view.bottom - 3 - h));
    const tx = Math.round(Phaser.Math.Clamp(a.x, bx + 6, bx + w - 6));

    g.clear();
    // pixel-rounded box: border first, then the fill one pixel inside
    g.fillStyle(st.border);
    g.fillRect(bx + 1, by - 1, w - 2, h + 2);
    g.fillRect(bx - 1, by + 1, w + 2, h - 2);
    g.fillRect(bx, by, w, h);
    g.fillStyle(st.bg);
    g.fillRect(bx + 1, by, w - 2, h);
    g.fillRect(bx, by + 1, w, h - 2);
    // tail towards the speaker
    if (below) {
      g.fillStyle(st.border);
      g.fillTriangle(tx - 4, by, tx + 4, by, tx, by - 7);
      g.fillStyle(st.bg);
      g.fillTriangle(tx - 2, by + 1, tx + 2, by + 1, tx, by - 4);
    } else {
      g.fillStyle(st.border);
      g.fillTriangle(tx - 4, by + h - 1, tx + 4, by + h - 1, tx, by + h + 6);
      g.fillStyle(st.bg);
      g.fillTriangle(tx - 2, by + h - 1, tx + 2, by + h - 1, tx, by + h + 3);
    }
    c.t.setPosition(bx + 5, by + 4);
  }

  update() {
    for (const sp of this.speakers.values()) if (sp.current) this.layout(sp.current);
  }
}
