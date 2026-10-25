// Touch gestures that stand in for the BUH key:
//  - a two-finger tap (both fingers land together, lift quickly, barely move)
//  - a double tap with one finger (two quick taps at about the same spot)
// Both only count while the touch input is in use; mouse and keyboard are untouched.

const TAP_MS = 260;        // a tap lasts at most this long
const TAP_MOVE = 18;       // ... and the finger may wander this far (px, game space)
const PAIR_MS = 180;       // both fingers of a two-finger tap land within this window
const DOUBLE_MS = 340;     // the second tap of a double tap comes this soon
const DOUBLE_DIST = 40;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Calls onBoo() for each recognised gesture. Returns nothing; listeners live on the scene.
export function installTouchBoo(scene, onBoo) {
  const touches = new Map(); // pointer id -> record of one finger
  let pair = null;           // the two records of a two-finger touch, while both are down
  let lastTap = null;        // the previous single tap, for double-tap detection

  const onDown = (p) => {
    if (!p.wasTouch) return;
    const rec = { id: p.id, t: scene.time.now, x: p.x, y: p.y, moved: 0, up: false, small: false, paired: false };
    touches.set(p.id, rec);
    if (touches.size === 2 && !pair) {
      const [a, b] = [...touches.values()];
      pair = { a, b, done: false };
      a.paired = true;
      b.paired = true;
    }
  };

  const onMove = (p) => {
    const rec = touches.get(p.id);
    if (rec) rec.moved = Math.max(rec.moved, dist(rec, p));
  };

  const onUp = (p) => {
    const rec = touches.get(p.id);
    if (!rec) return;
    touches.delete(p.id);
    const now = scene.time.now;
    rec.up = true;
    rec.small = now - rec.t <= TAP_MS && rec.moved <= TAP_MOVE;

    // two-finger tap: once both fingers have lifted, both must have been quick taps
    if (pair && (rec === pair.a || rec === pair.b) && !pair.done) {
      const { a, b } = pair;
      if (a.up && b.up) {
        pair.done = true;
        if (a.small && b.small && Math.abs(a.t - b.t) <= PAIR_MS) onBoo();
        pair = null;
      }
      return;
    }
    if (rec.paired) return;

    // single finger: two quick taps close together count as a double tap
    if (!rec.small) { lastTap = null; return; }
    if (lastTap && now - lastTap.t <= DOUBLE_MS && dist(lastTap, rec) <= DOUBLE_DIST) {
      lastTap = null;
      onBoo();
    } else {
      lastTap = { t: now, x: rec.x, y: rec.y };
    }
  };

  scene.input.on('pointerdown', onDown);
  scene.input.on('pointermove', onMove);
  scene.input.on('pointerup', onUp);
  scene.input.on('pointerupoutside', onUp);
}
