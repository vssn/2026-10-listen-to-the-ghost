import { canvasTex, rng, shade } from '../gfx.js';
import { HOUSE_W, HOUSE_H, HOUSE_COUNT, STOREY_H, CELLAR_H } from '../config.js';

// ---------------- 50s cars ----------------
function drawCar(P, body, accent) {
  const dark = shade(body, -0.35);
  const light = shade(body, 0.25);
  // cabin
  P.poly([[17, 9], [20, 3], [23, 2], [37, 2], [41, 4], [44, 9]], body);
  P.poly([[19, 8], [22, 4], [29, 4], [29, 8]], '#1b2333');
  P.poly([[31, 8], [31, 4], [38, 4], [41, 8]], '#1b2333');
  P.px(23, 5, '#5a6a8a'); P.px(33, 5, '#5a6a8a');
  P.rect(30, 3, 1, 6, body);
  // body with tail fin
  P.poly([[2, 11], [6, 9], [50, 8], [55, 5], [57, 6], [58, 11], [58, 17], [1, 17]], body);
  P.rect(1, 9, 57, 1, light);
  P.rect(2, 13, 55, 1, accent);
  P.rect(1, 16, 57, 1, dark);
  // bumpers
  P.rect(0, 14, 4, 3, '#c9c9d6'); P.rect(55, 14, 4, 3, '#c9c9d6');
  // lights
  P.rect(0, 11, 2, 2, '#ffe69a');
  P.rect(57, 9, 2, 3, '#e03a3a');
  // wheel arches + wheels
  for (const wx of [13, 46]) {
    P.circle(wx, 17, 5, '#0d0b12');
    P.circle(wx, 18, 4, '#141218');
    P.circle(wx, 18, 3, '#e8e8ee');
    P.circle(wx, 18, 2, '#141218');
    P.px(wx, 18, '#9a9aa8');
  }
}

function makeCars(scene) {
  const variants = [['#7fc8a9', '#e8e8ee'], ['#b8323c', '#f2e6d0'], ['#4fa3a5', '#f0e0b0'], ['#d9b0c8', '#ffffff']];
  variants.forEach(([b, a], i) => canvasTex(scene, `car${i}`, 59, 23, (P) => drawCar(P, b, a)));
}

// ---------------- Street props ----------------
function makeStreetProps(scene) {
  canvasTex(scene, 'lamp', 12, 66, (P) => {
    const iron = '#1a1822';
    P.rect(5, 14, 2, 46, iron);
    P.rect(3, 58, 6, 8, iron); P.rect(2, 62, 8, 4, iron);
    P.rect(3, 22, 6, 1, iron);
    // lantern head
    P.poly([[2, 4], [10, 4], [8, 1], [4, 1]], iron);
    P.rect(5, 0, 2, 1, iron);
    P.rect(3, 5, 6, 8, '#ffd36b');
    P.rect(4, 6, 4, 6, '#fff1b8');
    P.rect(2, 4, 1, 10, iron); P.rect(9, 4, 1, 10, iron); P.rect(5, 5, 2, 8, iron);
    P.rect(2, 13, 8, 2, iron);
  });
  canvasTex(scene, 'hydrant', 8, 12, (P) => {
    P.rect(2, 2, 4, 10, '#a3242c'); P.rect(1, 1, 6, 2, '#c4333b'); P.rect(0, 5, 8, 2, '#c4333b'); P.px(3, 0, '#c4333b');
  });
  canvasTex(scene, 'trash', 12, 14, (P) => {
    P.rect(1, 2, 10, 12, '#4a4a55'); P.rect(0, 1, 12, 2, '#5c5c68');
    for (let x = 2; x < 11; x += 3) P.rect(x, 4, 1, 9, '#3a3a44');
  });
  canvasTex(scene, 'cat0', 10, 8, (P) => {
    const k = '#0c0a10';
    P.rect(2, 3, 6, 5, k); P.rect(1, 0, 1, 2, k); P.rect(4, 0, 1, 2, k); P.rect(1, 1, 4, 3, k);
    P.px(2, 2, '#ffe14d'); P.px(4, 2, '#ffe14d');
    P.rect(8, 2, 1, 5, k); P.px(9, 1, k);
  });
  canvasTex(scene, 'cat1', 10, 8, (P) => {
    const k = '#0c0a10';
    P.rect(2, 3, 6, 5, k); P.rect(1, 0, 1, 2, k); P.rect(4, 0, 1, 2, k); P.rect(1, 1, 4, 3, k);
    P.rect(8, 3, 1, 4, k); P.px(9, 3, k);
  });
  canvasTex(scene, 'fence', 60, 40, (P) => {
    const c = '#15121c';
    P.rect(0, 12, 60, 2, c); P.rect(0, 30, 60, 2, c);
    for (let x = 1; x < 60; x += 6) { P.rect(x, 4, 2, 36, c); P.poly([[x - 1, 5], [x + 3, 5], [x + 1, 0]], c); }
  });
}

// ---------------- Townhouses ----------------
export const HOUSE_STYLES = [
  { wall: '#4a3b5c', trim: '#a89fb8', door: '#6b1f2a', paper: '#5e4a6b' },
  { wall: '#2f4f4f', trim: '#a8b8a8', door: '#3a2a1a', paper: '#3e5e57' },
  { wall: '#5c3a2e', trim: '#c8b090', door: '#2a3a5a', paper: '#6b5038' },
  { wall: '#3b4a2e', trim: '#b0b890', door: '#5a1f3a', paper: '#57603d' },
  { wall: '#5a2e3e', trim: '#d0a8b0', door: '#1f3a3a', paper: '#6e3e52' },
  { wall: '#2e3b5c', trim: '#a8b0d0', door: '#6b4a1a', paper: '#45507a' },
];
export const houseStyle = (i) => {
  const b = HOUSE_STYLES[i % HOUSE_STYLES.length];
  if (i < HOUSE_STYLES.length) return b;
  return { ...b, wall: shade(b.wall, 0.14), paper: shade(b.paper, -0.12), door: shade(b.door, 0.2) };
};

// Roof features in roof-texture coordinates (the roof is drawn 4px wider than the house).
export const ROOF = { w: HOUSE_W + 8, h: 48, dormers: [40, 118], dormerY: 30, chimneys: [26, 132] };
// Small barred cellar windows in the facade's plinth (facade coordinates).
export const CELLAR_WINDOWS = [26, 124];

function facadeWindow(P, x, y, w, h, lit, trim, R, arched = false) {
  const r = Math.floor(w / 2);
  if (arched) P.circle(x + r, y + 2, r + 2, trim);
  P.rect(x - 2, y - 2, w + 4, h + 4, trim);
  const glass = lit ? '#f2c45a' : '#141a33';
  if (arched) P.circle(x + r, y + 2, r, glass);
  P.rect(x, y + (arched ? 2 : 0), w, h - (arched ? 2 : 0), glass);
  if (lit) {
    P.rect(x, y + h - 7, w, 7, '#e0a842');
    if (R() < 0.45) {
      const sx = x + 3 + Math.floor(R() * (w - 8));
      P.circle(sx + 2, y + h - 12, 2, '#3a2418');
      P.rect(sx, y + h - 9, 5, 9, '#3a2418');
    }
    P.rect(x, y, 3, h, '#c0602a'); P.rect(x + w - 3, y, 3, h, '#c0602a');
  } else {
    P.px(x + 3, y + 5, '#3a4a7a'); P.px(x + 4, y + 6, '#3a4a7a');
  }
  P.rect(x + Math.floor(w / 2), y, 1, h, trim);
  P.rect(x, y + Math.floor(h * 0.4), w, 1, trim);
  P.rect(x - 3, y + h + 2, w + 6, 2, shade(trim, 0.1));
}

function makeFacade(scene, i, style) {
  canvasTex(scene, `facade_${i}`, HOUSE_W, HOUSE_H, (P) => {
    const R = rng(100 + i * 7);
    const wall = style.wall;
    const dark = shade(wall, -0.32);
    const light = shade(wall, 0.16);
    P.rect(0, 0, HOUSE_W, HOUSE_H, wall);
    for (let k = 0; k < 220; k++) P.px(R() * HOUSE_W, R() * HOUSE_H, R() < 0.5 ? shade(wall, -0.12) : shade(wall, 0.06));
    // quoins
    for (let y = 8; y < 168; y += 8) {
      const w = (y / 8) % 2 ? 5 : 8;
      P.rect(0, y, w, 7, light); P.rect(HOUSE_W - w, y, w, 7, light);
    }
    // rusticated ground floor
    P.rect(0, 168, HOUSE_W, 56, shade(wall, -0.12));
    for (let y = 172; y < 214; y += 6) P.rect(0, y, HOUSE_W, 1, dark);
    // cornices between the storeys
    for (const cy of [56, 112, 168]) {
      P.rect(0, cy - 3, HOUSE_W, 4, style.trim);
      P.rect(0, cy + 1, HOUSE_W, 1, dark);
    }
    // main cornice with dentils
    P.rect(0, 0, HOUSE_W, 6, style.trim);
    P.rect(0, 6, HOUSE_W, 1, dark);
    for (let x = 2; x < HOUSE_W; x += 5) P.rect(x, 7, 3, 2, shade(style.trim, -0.25));
    // upper storeys
    for (let t = 0; t < 3; t++) {
      const y0 = t * STOREY_H;
      const h = t === 0 ? 26 : 32;
      const wy = y0 + (t === 0 ? 18 : 13);
      for (const wx of [20, 66, 112]) {
        facadeWindow(P, wx, wy, 18, h, R() < 0.55, style.trim, R, t === 0);
        if (t === 2) P.poly([[wx - 4, wy - 3], [wx + 22, wy - 3], [wx + 9, wy - 10]], style.trim);
        if (t === 1) { P.rect(wx - 4, wy - 6, 26, 3, style.trim); P.rect(wx - 4, wy - 3, 26, 1, dark); }
        if (t > 0 && wx !== 66 && R() < 0.5) {
          P.rect(wx - 1, wy + h + 4, 20, 3, '#5a3a24');
          for (let f = 0; f < 6; f++) P.px(wx + 1 + f * 3, wy + h + 3, R() < 0.5 ? '#c04060' : '#e08a30');
        }
      }
    }
    // balcony on the first floor
    P.rect(56, 158, 38, 3, style.trim);
    P.rect(56, 161, 38, 1, dark);
    P.rect(57, 149, 36, 1, '#1a1822');
    for (let x = 57; x <= 93; x += 3) P.rect(x, 149, 1, 9, '#1a1822');
    // ground floor windows
    for (const wx of [18, 110]) facadeWindow(P, wx, 181, 22, 25, R() < 0.6, style.trim, R);
    // plinth with cellar windows
    P.rect(0, 213, HOUSE_W, 11, '#3a3644');
    P.rect(0, 213, HOUSE_W, 1, '#55506a');
    for (const cx of CELLAR_WINDOWS) {
      P.rect(cx - 6, 215, 12, 7, '#0e0b14');
      for (let x = cx - 5; x < cx + 6; x += 3) P.rect(x, 215, 1, 7, '#55506a');
    }
    // entrance with fanlight
    P.circle(75, 182, 13, style.trim);
    P.rect(62, 182, 27, 36, style.trim);
    P.circle(75, 182, 10, '#f2c45a');
    P.rect(65, 182, 21, 36, style.door);
    P.rect(75, 172, 1, 10, style.trim);
    P.rect(67, 186, 8, 12, shade(style.door, -0.3)); P.rect(77, 186, 7, 12, shade(style.door, -0.3));
    P.rect(67, 202, 8, 12, shade(style.door, -0.3)); P.rect(77, 202, 7, 12, shade(style.door, -0.3));
    P.rect(83, 200, 2, 2, '#d9b13b');
    P.rect(58, 218, 35, 3, '#5a5668'); P.rect(55, 221, 41, 3, '#4a4658');
    // house number
    P.rect(94, 188, 9, 7, '#d8cfc0');
    P.rect(96, 190, 1, 3, '#222'); P.rect(99, 190, 2, 1, '#222'); P.rect(100, 191, 1, 2, '#222');
    // crack + ivy
    let cx = 30 + R() * 90, cy = 10;
    for (let k = 0; k < 26; k++) { P.px(cx, cy, dark); cy++; cx += Math.round(R() * 2 - 1); }
    if (R() < 0.6) {
      for (let k = 0; k < 5; k++) {
        let vx = 4 + R() * 10, vy = 120 + R() * 80;
        for (let s = 0; s < 50; s++) {
          P.px(vx, vy, s % 3 ? '#2a3f26' : '#3c5a32');
          vy -= 1; vx += Math.round(Math.sin(s * 0.5 + k) * 0.7);
        }
      }
    }
  });
}

// Zinc mansard roof with dormers and brick chimneys.
function makeRoof(scene, i, style) {
  canvasTex(scene, `roof_${i}`, ROOF.w, ROOF.h, (P) => {
    const zinc = i % 3 === 0 ? '#7b8794' : i % 3 === 1 ? '#6f7c87' : '#83909a';
    const seam = shade(zinc, -0.25), hi = shade(zinc, 0.3), dk = shade(zinc, -0.45);
    for (const cx of ROOF.chimneys) {
      P.rect(cx - 6, 2, 12, 24, '#5a3530');
      for (let y = 5; y < 26; y += 4) P.rect(cx - 6, y, 12, 1, '#43272a');
      P.rect(cx - 7, 0, 14, 3, '#6e4842');
      P.rect(cx - 3, 0, 2, 1, '#2a1a1a'); P.rect(cx + 2, 0, 2, 1, '#2a1a1a');
    }
    // flat-ish upper slope
    P.poly([[10, 13], [148, 13], [142, 7], [16, 7]], shade(zinc, 0.12));
    // steep lower slope
    P.poly([[0, 48], [ROOF.w, 48], [150, 13], [8, 13]], zinc);
    for (let x = 3; x < ROOF.w; x += 6) {
      const top = x + (79 - x) * 0.1;
      P.line(x, 46, top, 14, 1, seam);
      P.line(x + 1, 46, top + 1, 14, 1, shade(zinc, 0.08));
    }
    P.rect(8, 13, 142, 1, hi);
    for (let x = 18; x < 142; x += 8) P.rect(x, 8, 1, 5, seam);
    // gutter
    P.rect(0, 45, ROOF.w, 3, dk); P.rect(0, 45, ROOF.w, 1, hi);
    // dormers
    for (const dx of ROOF.dormers) {
      P.rect(dx - 9, 21, 18, 21, shade(style.wall, -0.1));
      P.rect(dx - 9, 21, 2, 21, style.trim); P.rect(dx + 7, 21, 2, 21, style.trim);
      P.rect(dx - 5, 25, 10, 13, '#0e0b18');
      P.rect(dx, 25, 1, 13, style.trim); P.rect(dx - 5, 31, 10, 1, style.trim);
      P.rect(dx - 6, 38, 12, 2, style.trim);
      P.poly([[dx - 12, 22], [dx + 12, 22], [dx, 12]], zinc);
      P.line(dx - 12, 22, dx, 12, 1, hi); P.line(dx, 12, dx + 12, 22, 1, seam);
      P.rect(dx - 12, 22, 24, 1, dk);
    }
    // finial
    P.rect(78, 1, 2, 6, '#3a3a44'); P.circle(79, 1, 1, '#9aa4ae');
  });
}

function wallpaper(P, x, y, w, h, base) {
  P.rect(x, y, w, h, base);
  for (let xx = x; xx < x + w; xx += 6) P.rect(xx, y, 2, h, shade(base, 0.08));
  for (let xx = x + 3; xx < x + w; xx += 12) for (let yy = y + 4; yy < y + h; yy += 10) P.px(xx, yy, shade(base, 0.2));
  P.rect(x, y + h - 12, w, 12, shade(base, -0.35));
  P.rect(x, y + h - 12, w, 1, shade(base, -0.1));
}

function nightWindow(P, x, y, w, h) {
  P.rect(x - 2, y - 2, w + 4, h + 4, '#3a2a20');
  P.rect(x, y, w, h, '#16224a');
  P.px(x + 4, y + 4, '#ffffff'); P.px(x + w - 5, y + 7, '#9fa8d0');
  P.circle(x + w - 6, y + 6, 3, '#e8dfb8');
  P.rect(x + Math.floor(w / 2), y, 1, h, '#3a2a20');
  P.poly([[x - 3, y - 3], [x + 4, y - 3], [x + 2, y + h + 3], [x - 3, y + h + 3]], '#7a2030');
  P.poly([[x + w + 3, y - 3], [x + w - 4, y - 3], [x + w - 2, y + h + 3], [x + w + 3, y + h + 3]], '#7a2030');
}

// Furniture stays between x 50..100 so the hiding spots at both sides stay clear.
const ROOMS = {
  study(P, y0) {
    nightWindow(P, 78, y0 + 8, 16, 16);
    P.rect(52, y0 + 14, 16, 38, '#4a2c18');
    for (let sy = y0 + 16; sy < y0 + 50; sy += 9) {
      for (let x = 53; x < 67; x += 2) P.rect(x, sy, 2, 7, ['#7a1f2a', '#1f4a3a', '#2a3a6a', '#6a5a1a'][(x + sy) % 4]);
      P.rect(52, sy + 7, 16, 2, '#5a3a24');
    }
    P.rect(72, y0 + 38, 26, 3, '#6b4226'); P.rect(73, y0 + 41, 2, 11, '#4a2c18'); P.rect(95, y0 + 41, 2, 11, '#4a2c18');
    P.rect(76, y0 + 34, 8, 4, '#2a2a2a'); P.rect(77, y0 + 32, 6, 2, '#eee');
    P.circle(92, y0 + 33, 3, '#3a7ab8'); P.px(91, y0 + 32, '#6ac06a'); P.rect(92, y0 + 36, 1, 2, '#c9a227');
    P.rect(30, y0 + 51, 70, 1, '#5a3040');
  },
  kitchen(P, y0) {
    for (let y = y0 + 30; y < y0 + 52; y += 4) for (let x = 50; x < 100; x += 4) P.rect(x, y, 3, 3, ((x + y) / 4) % 2 ? '#cfd8d0' : '#b8c4bc');
    nightWindow(P, 58, y0 + 6, 16, 14);
    P.rect(52, y0 + 32, 14, 20, '#e8e0d0'); P.rect(52, y0 + 32, 14, 2, '#bbb');
    P.rect(54, y0 + 38, 10, 8, '#333'); P.rect(55, y0 + 31, 4, 1, '#222'); P.rect(60, y0 + 31, 4, 1, '#222');
    P.rect(55, y0 + 27, 6, 4, '#8a8a98'); P.rect(54, y0 + 27, 8, 1, '#aaa');
    P.rect(68, y0 + 20, 13, 32, '#d8e8e0'); P.circle(74, y0 + 21, 6, '#d8e8e0'); P.rect(68, y0 + 21, 13, 31, '#d8e8e0');
    P.rect(68, y0 + 34, 13, 1, '#a8b8b0'); P.rect(79, y0 + 26, 1, 6, '#888'); P.rect(79, y0 + 37, 1, 6, '#888');
    P.rect(84, y0 + 40, 15, 2, '#8a5a36'); P.rect(85, y0 + 42, 1, 10, '#6a4226'); P.rect(97, y0 + 42, 1, 10, '#6a4226');
    P.rect(88, y0 + 38, 4, 2, '#e8e0d0');
    P.rect(91, y0, 1, 8, '#222'); P.poly([[87, y0 + 11], [96, y0 + 11], [94, y0 + 7], [89, y0 + 7]], '#c04040');
  },
  bedroom(P, y0) {
    nightWindow(P, 66, y0 + 8, 18, 20);
    P.rect(52, y0 + 36, 20, 16, '#6b4226');
    P.rect(53, y0 + 40, 18, 1, '#4a2c18'); P.rect(53, y0 + 45, 18, 1, '#4a2c18');
    P.ellipse(62, y0 + 28, 6, 6, '#8a6a2a'); P.ellipse(62, y0 + 28, 4, 4, '#9fb8d0');
    P.rect(78, y0 + 42, 9, 10, '#5a3a24'); P.rect(81, y0 + 37, 2, 5, '#b8a080');
    P.poly([[78, y0 + 37], [87, y0 + 37], [85, y0 + 32], [80, y0 + 32]], '#e8c870');
    P.rect(90, y0 + 14, 10, 12, '#8a6a2a'); P.rect(91, y0 + 15, 8, 10, '#2a3a2a'); P.circle(95, y0 + 20, 2, '#c8b090');
    P.rect(50, y0 + 51, 50, 1, '#8a3040');
  },
  living(P, y0) {
    nightWindow(P, 58, y0 + 8, 20, 18);
    P.rect(52, y0 + 40, 32, 8, '#8a4a5a'); P.rect(52, y0 + 34, 32, 7, '#7a3a4a');
    P.rect(50, y0 + 38, 4, 14, '#6a2a3a'); P.rect(82, y0 + 38, 4, 14, '#6a2a3a');
    P.rect(87, y0 + 34, 13, 18, '#5a3a24'); P.rect(89, y0 + 36, 9, 8, '#8fd3ff'); P.rect(90, y0 + 37, 3, 2, '#d0f0ff');
    P.line(92, y0 + 34, 89, y0 + 27, 1, '#888'); P.line(94, y0 + 34, 98, y0 + 27, 1, '#888');
    P.circle(36, y0 + 14, 5, '#8a6a2a'); P.circle(36, y0 + 14, 4, '#e8dcc0'); P.rect(36, y0 + 11, 1, 4, '#222'); P.rect(36, y0 + 14, 3, 1, '#222');
    P.rect(30, y0 + 51, 70, 1, '#3a5a7a');
  },
};
const UPPER_ROOMS = ['study', 'kitchen', 'bedroom'];
export const roomType = (house, storey) => (storey === 3 ? 'living' : UPPER_ROOMS[(storey + house) % 3]);

// Props in each room that react when the ghost floats by. House coordinates
// (un-mirrored), y relative to the storey top; must match the ROOMS art.
export const ROOM_PROPS = {
  study: [{ type: 'books', x: 52, y: 16, w: 16, rows: 4 }],
  kitchen: [{ type: 'lamp', x: 91.5, y: 9, w: 10, h: 5 }],
  bedroom: [{ type: 'lamp', x: 82.5, y: 34.5, w: 10, h: 6 }],
  living: [{ type: 'tv', x: 89, y: 36, w: 9, h: 8 }, { type: 'clock', x: 36.5, y: 14.5 }],
};

function makeInterior(scene, i, style) {
  canvasTex(scene, `interior_${i}`, HOUSE_W, HOUSE_H, (P) => {
    const wood = '#4a3222';
    P.rect(0, 0, HOUSE_W, HOUSE_H, '#1e1824');
    for (let t = 0; t < 4; t++) {
      const y0 = t * STOREY_H;
      const top = t === 0 ? 4 : y0;
      wallpaper(P, 4, top, HOUSE_W - 8, y0 + 52 - top, shade(style.paper, (t % 2 ? -0.1 : 0.04)));
      ROOMS[roomType(i, t)](P, y0);
      P.rect(0, y0 + 52, HOUSE_W, 4, wood);
      P.rect(0, y0 + 52, HOUSE_W, 1, '#6a4a32');
      for (let x = (t * 5) % 12; x < HOUSE_W; x += 12) P.rect(x, y0 + 53, 1, 3, '#3a2618');
    }
    for (let k = 0; k < 4; k++) P.line(4, 60 + k * 3, 16 - k * 3, 60, 1, 'rgba(220,220,240,0.35)');
  }, { mirror: i % 2 === 1 });
}

function makeCellar(scene, i) {
  canvasTex(scene, `cellar_${i}`, HOUSE_W, CELLAR_H, (P) => {
    const R = rng(300 + i);
    P.rect(0, 0, HOUSE_W, CELLAR_H, '#1a1418');
    for (let row = 0; row * 6 < 56; row++) {
      const off = row % 2 ? 6 : 0;
      for (let x = 4 - off; x < 146; x += 12) P.rect(x + 1, row * 6 + 1, 11, 5, R() < 0.5 ? '#3a2e2e' : '#342828');
    }
    P.rect(0, 0, 4, CELLAR_H, '#141014'); P.rect(146, 0, 4, CELLAR_H, '#141014');
    // vault arches
    for (const ax of [4, 54, 104]) {
      P.ellipse(ax + 21, 0, 25, 9, '#141014');
      P.ellipse(ax + 21, 0, 23, 7, '#2a2024');
    }
    // pipes
    P.rect(4, 12, 142, 2, '#6a5a4a'); P.rect(4, 12, 142, 1, '#8a7a6a');
    for (const x of [40, 98]) P.rect(x, 10, 3, 6, '#5a4a3a');
    // boiler
    P.rect(52, 26, 16, 30, '#8a5a2a'); P.ellipse(60, 26, 8, 3, '#a87a3a');
    P.rect(52, 26, 3, 30, '#a87a3a'); P.rect(57, 44, 6, 5, '#1a1010'); P.rect(58, 45, 4, 3, '#ff7a1a');
    P.rect(59, 14, 2, 10, '#6a5a4a');
    // shelf with jars
    P.rect(72, 32, 26, 2, '#5a3a24'); P.rect(72, 44, 26, 2, '#5a3a24');
    for (let x = 73; x < 96; x += 5) {
      P.rect(x, 27, 3, 5, ['#c86a2a', '#6aa84f', '#d9b13b', '#a03030'][Math.floor(R() * 4)]);
      P.rect(x, 39, 3, 5, ['#c86a2a', '#6aa84f', '#d9b13b', '#a03030'][Math.floor(R() * 4)]);
    }
    // bulb
    P.rect(84, 0, 1, 8, '#222'); P.circle(84, 9, 2, '#ffe69a');
    // doorway to the outside stairs
    P.rect(144, 28, 6, 28, '#07050a');
    P.rect(142, 26, 2, 30, '#5a3a20');
    // floor
    P.rect(0, 56, HOUSE_W, 4, '#3a3440');
    P.rect(0, 56, HOUSE_W, 1, '#55506a');
    for (let k = 0; k < 4; k++) P.line(4, 2 + k * 3, 16 - k * 3, 2, 1, 'rgba(220,220,240,0.3)');
  }, { mirror: i % 2 === 1 });
}

// Earth hiding the cellar until the ghost goes down there.
function makeCellarCover(scene) {
  canvasTex(scene, 'cellar_cover', HOUSE_W, CELLAR_H, (P) => {
    const R = rng(404);
    P.rect(0, 0, HOUSE_W, CELLAR_H, '#1a1217');
    for (let k = 0; k < 220; k++) P.px(R() * HOUSE_W, R() * CELLAR_H, R() < 0.5 ? '#241a20' : '#130d11');
    for (let k = 0; k < 8; k++) P.circle(R() * HOUSE_W, R() * CELLAR_H, 1 + Math.floor(R() * 2), '#2c2530');
    // foundation outline
    P.rect(0, 0, HOUSE_W, 3, '#2e2a36'); P.rect(0, 0, 3, CELLAR_H, '#2e2a36'); P.rect(HOUSE_W - 3, 0, 3, CELLAR_H, '#2e2a36');
    P.rect(0, CELLAR_H - 3, HOUSE_W, 3, '#2e2a36');
    for (let y = 6; y < CELLAR_H; y += 8) { P.rect(0, y, 3, 1, '#1a1622'); P.rect(HOUSE_W - 3, y, 3, 1, '#1a1622'); }
  });
}

// Outside stair down to the cellar door. Unflipped, the house is on the left.
// Texture y 14 is the ground line.
function makeShaft(scene) {
  canvasTex(scene, 'shaft', 28, 120, (P) => {
    const iron = '#1a1822';
    P.rect(0, 10, 28, 110, '#120f18');
    for (let y = 10; y < 118; y += 5) {
      P.rect(0, y, 3, 4, '#3a3646'); P.rect(25, y, 3, 4, '#3a3646');
    }
    // steps going down towards the door
    for (let k = 0; k < 11; k++) {
      const x = 16 - k * 0.6, y = 16 + k * 8.4;
      P.rect(x, y + 2, 10, 6, '#24212c');
      P.rect(x, y, 10, 2, '#5a5668');
    }
    P.rect(2, 114, 24, 4, '#4a4658'); P.rect(2, 114, 24, 1, '#6a6680');
    // cellar door
    P.rect(1, 86, 12, 28, '#2a1a10');
    P.rect(2, 88, 10, 26, '#5a3a20');
    P.rect(2, 94, 10, 1, '#3a3a44'); P.rect(2, 106, 10, 1, '#3a3a44');
    P.rect(4, 90, 5, 3, '#0e0b14'); P.rect(6, 90, 1, 3, '#3a3a44');
    P.px(10, 101, '#d9b13b');
    // lamp above the door
    P.rect(13, 79, 4, 1, iron); P.rect(14, 80, 3, 4, '#ffd36b'); P.rect(14, 80, 3, 1, iron);
    // railing at street level
    P.rect(0, 2, 28, 1, iron);
    for (const x of [1, 9, 18, 26]) P.rect(x, 2, 1, 12, iron);
    for (let x = 3; x < 26; x += 3) P.rect(x, 3, 1, 8, iron);
    P.circle(1, 1, 1, iron); P.circle(26, 1, 1, iron);
  });
}

function makeWizardInterior(scene) {
  canvasTex(scene, 'interior_wizard', HOUSE_W, HOUSE_H, (P) => {
    const R = rng(66);
    P.rect(0, 0, HOUSE_W, HOUSE_H, '#120a1c');
    for (let t = 0; t < 4; t++) {
      const y0 = t * STOREY_H;
      P.rect(4, Math.max(4, y0), HOUSE_W - 8, y0 + 52 - Math.max(4, y0), '#1e1030');
      for (let y = y0 + 6; y < y0 + 52; y += 6) for (let x = 4 + ((y / 6) % 2) * 6; x < HOUSE_W - 4; x += 12) P.rect(x, y, 11, 5, '#241438');
      if (t % 2 === 0) {
        P.circle(75, y0 + 26, 16, '#6a2fb0'); P.circle(75, y0 + 26, 14, '#1e1030');
        P.poly([[75, y0 + 12], [88, y0 + 34], [62, y0 + 34]], '#6a2fb0');
        P.poly([[75, y0 + 16], [85, y0 + 32], [65, y0 + 32]], '#1e1030');
      } else {
        for (const sy of [y0 + 22, y0 + 38]) {
          P.rect(40, sy, 70, 2, '#3a2418');
          for (let x = 42; x < 108; x += 5) {
            P.rect(x, sy - 6, 3, 6, ['#7aff7a', '#ff5ad1', '#5ad1ff', '#ffd23f'][Math.floor(R() * 4)]);
            P.rect(x + 1, sy - 8, 1, 2, '#ccc');
          }
        }
      }
      P.circle(20, y0 + 30, 4, '#d8d0c0'); P.rect(18, y0 + 33, 5, 3, '#d8d0c0');
      P.rect(18, y0 + 29, 2, 2, '#120a1c'); P.rect(21, y0 + 29, 2, 2, '#120a1c');
      P.rect(0, y0 + 52, HOUSE_W, 4, '#2a1a12');
    }
    P.ellipse(110, 214, 13, 7, '#151515'); P.ellipse(110, 208, 11, 2, '#5aff5a');
  });
}

function makeWizardCellar(scene) {
  canvasTex(scene, 'cellar_wizard', HOUSE_W, CELLAR_H, (P) => {
    const R = rng(67);
    P.rect(0, 0, HOUSE_W, CELLAR_H, '#120a1c');
    for (let row = 0; row * 6 < 56; row++) {
      const off = row % 2 ? 6 : 0;
      for (let x = 4 - off; x < 146; x += 12) P.rect(x + 1, row * 6 + 1, 11, 5, R() < 0.5 ? '#241438' : '#1e1030');
    }
    P.ellipse(75, 55, 40, 4, '#6a2fb0'); P.ellipse(75, 55, 36, 2, '#2a1040');
    P.ellipse(40, 50, 10, 6, '#151515'); P.ellipse(40, 45, 8, 2, '#5aff5a');
    for (const x of [20, 70, 120]) { P.rect(x, 44, 2, 8, '#eee'); P.rect(x, 41, 2, 3, '#c86bff'); }
    P.rect(144, 28, 6, 28, '#07050a');
    P.rect(0, 56, HOUSE_W, 4, '#2a1a12');
  });
}

// ---------------- Hiding spots ----------------
function makeSpots(scene) {
  const wood = '#6b4226', woodD = '#4a2c18', woodL = '#8a5a36';
  canvasTex(scene, 'wardrobe', 20, 40, (P) => {
    P.rect(0, 0, 20, 40, woodD); P.rect(1, 2, 18, 36, wood);
    P.rect(0, 0, 20, 2, woodL);
    P.rect(9, 3, 2, 34, woodD);
    P.rect(3, 6, 5, 12, woodL); P.rect(12, 6, 5, 12, woodL);
    P.rect(3, 22, 5, 12, woodL); P.rect(12, 22, 5, 12, woodL);
    P.px(8, 20, '#d9b13b'); P.px(11, 20, '#d9b13b');
    P.rect(1, 38, 3, 2, woodD); P.rect(16, 38, 3, 2, woodD);
  });
  canvasTex(scene, 'wardrobe_open', 20, 40, (P) => {
    P.rect(0, 0, 20, 40, woodD); P.rect(1, 2, 18, 36, '#140c08');
    P.rect(0, 0, 20, 2, woodL);
    P.rect(2, 5, 16, 1, '#555'); P.rect(4, 6, 3, 12, '#7a3a4a'); P.rect(9, 6, 3, 14, '#3a5a7a');
    P.rect(1, 38, 3, 2, woodD); P.rect(16, 38, 3, 2, woodD);
  });
  canvasTex(scene, 'door', 18, 38, (P) => {
    P.rect(0, 0, 18, 38, '#2a1a10');
    P.rect(2, 2, 14, 36, '#7a4a2a');
    P.rect(4, 5, 10, 12, '#6a3a1a'); P.rect(4, 21, 10, 13, '#6a3a1a');
    P.rect(13, 19, 2, 2, '#d9b13b');
  });
  canvasTex(scene, 'door_open', 18, 38, (P) => {
    P.rect(0, 0, 18, 38, '#2a1a10');
    P.rect(2, 2, 14, 36, '#07050a');
    P.poly([[2, 2], [6, 5], [6, 38], [2, 38]], '#7a4a2a');
  });
  canvasTex(scene, 'bed', 40, 18, (P) => {
    P.rect(0, 0, 4, 18, woodD); P.rect(36, 6, 4, 12, woodD);
    P.rect(0, 0, 4, 2, woodL);
    P.rect(4, 8, 32, 5, '#e8e0d0');
    P.rect(5, 5, 9, 4, '#ffffff');
    P.rect(12, 6, 24, 6, '#5a7ab8'); P.rect(12, 6, 24, 1, '#7a9ad8');
    for (let x = 14; x < 36; x += 5) P.px(x, 9, '#3a5a98');
    P.rect(4, 13, 32, 2, woodD);
    P.rect(4, 15, 32, 3, '#07050a');
    P.rect(2, 15, 2, 3, woodD); P.rect(36, 15, 2, 3, woodD);
  });
  canvasTex(scene, 'crates', 26, 26, (P) => {
    const c = (x, y, w, h) => {
      P.rect(x, y, w, h, '#5a3a20'); P.rect(x, y, w, 1, '#7a5a30');
      P.rect(x, y, 1, h, '#3a2410'); P.rect(x + w - 1, y, 1, h, '#3a2410'); P.rect(x, y + h - 1, w, 1, '#3a2410');
      P.line(x + 1, y + 1, x + w - 2, y + h - 2, 1, '#3a2410');
    };
    c(0, 12, 14, 14); c(13, 14, 13, 12); c(4, 0, 13, 12);
  });
  // clock face without hands – the hands are separate sprites so they can spin
  canvasTex(scene, 'clockface', 9, 9, (P) => P.circle(4, 4, 4, '#e8dcc0'));
  canvasTex(scene, 'eyes', 7, 2, (P) => {
    P.rect(0, 0, 2, 2, '#ffffff'); P.rect(5, 0, 2, 2, '#ffffff');
    P.px(1, 1, '#000'); P.px(6, 1, '#000');
  });
}

export function makeCity(scene) {
  makeCars(scene);
  makeStreetProps(scene);
  for (let i = 0; i < HOUSE_COUNT; i++) {
    const style = houseStyle(i);
    makeFacade(scene, i, style);
    makeRoof(scene, i, style);
    makeInterior(scene, i, style);
    makeCellar(scene, i);
  }
  makeCellarCover(scene);
  makeShaft(scene);
  makeWizardInterior(scene);
  makeWizardCellar(scene);
  makeSpots(scene);
}
