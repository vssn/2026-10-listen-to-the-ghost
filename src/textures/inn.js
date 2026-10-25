import { canvasTex, rng, shade } from '../gfx.js';
import { INN_W, HOUSE_H, STOREY_H } from '../config.js';

// Layout shared with objects/Inn.js (inn-local coordinates).
// Hotel rooms per storey (top storey first), deliberately uneven: x/w of the
// room, which side the bed stands on and what else is in there.
export const HOTEL = [
  [
    { x: 4, w: 98, paper: '#4a5a4a', bed: 'L', wardrobe: 'R', extra: 'armchair' }, // the suite
    { x: 106, w: 54, paper: '#5a4a5e', bed: 'R' },
    { x: 164, w: 62, paper: '#4e4a3a', bed: 'L' },
  ],
  [
    { x: 4, w: 60, paper: '#5a4a3e', bed: 'L' },
    { x: 68, w: 76, paper: '#3e4a5a', bed: 'R', wardrobe: 'L', awake: true },
    { x: 148, w: 78, paper: '#5a3e46', bed: 'R', extra: 'desk' },
  ],
];
export const bedX = (r) => (r.bed === 'L' ? r.x + 4 : r.x + r.w - 44);
export const wardrobeX = (r) => (r.wardrobe === 'L' ? r.x + 4 : r.x + r.w - 24);

export const INN = {
  hallTop: 2 * STOREY_H,        // the party hall spans the two lower storeys
  roofW: INN_W + 8,
  roofH: 48,
  dormers: [50, 119, 188],
  chimneys: [24, 214],
  windows: [[22, 72], [158, 208]], // big lit hall windows (x from..to) on the facade
};

// Tiny 3x5 pixel font for the signs.
const GLYPHS = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'],
  E: ['111', '100', '110', '100', '111'], G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'],
  K: ['101', '110', '100', '110', '101'], L: ['100', '100', '100', '100', '111'],
  M: ['10001', '11011', '10101', '10001', '10001'], N: ['1001', '1101', '1011', '1001', '1001'],
  O: ['010', '101', '101', '101', '010'], P: ['110', '101', '110', '100', '100'],
  R: ['110', '101', '110', '101', '101'], S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'], U: ['101', '101', '101', '101', '111'],
  W: ['10001', '10001', '10101', '11011', '10001'], Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'], Ü: ['101', '101', '101', '101', '111'],
};

function textWidth(str, scale = 1) {
  let w = 0;
  for (const ch of str) w += (ch === ' ' ? 3 : GLYPHS[ch][0].length + 1) * scale;
  return w - scale;
}

function drawText(P, str, x, y, color, scale = 1) {
  for (const ch of str) {
    if (ch === ' ') { x += 3 * scale; continue; }
    const g = GLYPHS[ch];
    g.forEach((row, yy) => [...row].forEach((b, xx) => b === '1' && P.rect(x + xx * scale, y + yy * scale, scale, scale, color)));
    if (ch === 'Ü') { P.rect(x, y - 2 * scale, scale, scale, color); P.rect(x + 2 * scale, y - 2 * scale, scale, scale, color); }
    x += (g[0].length + 1) * scale;
  }
}

function signBoard(P, cx, y, str, scale = 1) {
  const w = textWidth(str, scale) + 8;
  const x = Math.round(cx - w / 2);
  const h = 5 * scale + 6;
  P.rect(x, y, w, h, '#3a2416');
  P.rect(x + 1, y + 1, w - 2, h - 2, '#5a3a20');
  P.rect(x + 1, y + 1, w - 2, 1, '#7a5430');
  drawText(P, str, x + 4, y + 3, '#f2c45a', scale);
}

function makeFacade(scene) {
  canvasTex(scene, 'inn_facade', INN_W, HOUSE_H, (P) => {
    const R = rng(515);
    const beam = '#2e1f14', plaster = '#7a7260';
    // ---- half-timbered hotel storeys
    P.rect(0, 0, INN_W, 112, plaster);
    for (let k = 0; k < 160; k++) P.px(R() * INN_W, R() * 108, R() < 0.5 ? '#6e6656' : '#857d6a');
    for (const y of [0, 52, 104]) P.rect(0, y, INN_W, 4, beam);
    // timber posts follow the room walls behind; one window per room
    HOTEL.forEach((rooms, t) => {
      const y0 = t * 52;
      for (const r of rooms) {
        P.rect(r.x - 4, y0, 4, 56, beam);
        P.line(r.x, y0 + 52, r.x + 10, y0 + 4, 2, beam);
        P.line(r.x + r.w, y0 + 52, r.x + r.w - 10, y0 + 4, 2, beam);
        const x = Math.round(r.x + r.w / 2 - 9);
        const lit = r.awake;
        P.rect(x - 2, y0 + 12, 22, 30, '#d8cfb8');
        P.rect(x, y0 + 14, 18, 26, lit ? '#f2c45a' : '#141a33');
        P.poly([[x, y0 + 14], [x + 9, y0 + 14], [x + 3, y0 + 40], [x, y0 + 40]], '#7a3a5a');
        P.poly([[x + 18, y0 + 14], [x + 9, y0 + 14], [x + 15, y0 + 40], [x + 18, y0 + 40]], '#7a3a5a');
        P.rect(x - 3, y0 + 42, 24, 2, '#d8cfb8');
      }
    });
    P.rect(INN_W - 4, 0, 4, 108, beam);
    signBoard(P, INN_W / 2, 3, 'HOTEL');
    // ---- stone ground floor with the party hall
    P.rect(0, 108, INN_W, 116, '#4a4458');
    for (let y = 112; y < 214; y += 7) {
      const off = (y / 7) % 2 ? 6 : 0;
      P.rect(0, y, INN_W, 1, '#3a3446');
      for (let x = off; x < INN_W; x += 12) P.rect(x, y, 1, 7, '#3a3446');
    }
    // big arched party windows with dancing silhouettes
    for (const [x0, x1] of INN.windows) {
      const w = x1 - x0;
      P.circle(x0 + w / 2, 152, w / 2 + 3, '#d8cfb8');
      P.rect(x0 - 3, 152, w + 6, 52, '#d8cfb8');
      P.circle(x0 + w / 2, 152, w / 2, '#f2a040');
      P.rect(x0, 152, w, 48, '#f2a040');
      P.rect(x0, 180, w, 20, '#e08a30');
      for (let k = 0; k < 4; k++) {
        const sx = x0 + 5 + k * 11;
        const hop = k % 2 ? 2 : 0;
        P.circle(sx + 2, 182 - hop, 2, '#3a1a10');
        P.rect(sx, 185 - hop, 5, 15 + hop, '#3a1a10');
        P.line(sx, 187 - hop, sx - 3, 181 - hop, 1, '#3a1a10');
      }
      // bunting inside
      for (let x = x0; x < x1 - 3; x += 6) P.poly([[x, 156], [x + 5, 156], [x + 2.5, 161]], ['#1a1a1a', '#8a3ab0', '#1a1a1a'][(x / 6) % 3 | 0]);
      P.rect(x0 + w / 2, 140, 1, 60, '#d8cfb8');
      P.rect(x0, 170, w, 1, '#d8cfb8');
      // pumpkin on the sill
      P.ellipse(x0 + 8, 205, 5, 4, '#e3711b'); P.rect(x0 + 6, 204, 1, 1, '#ffd23f'); P.rect(x0 + 10, 204, 1, 1, '#ffd23f');
      P.rect(x0 - 4, 204, w + 8, 3, '#5a5668');
    }
    // entrance: double door with fanlight
    P.circle(115, 176, 18, '#d8cfb8');
    P.rect(97, 176, 37, 44, '#d8cfb8');
    P.circle(115, 176, 15, '#f2a040');
    P.rect(100, 176, 31, 44, '#4a1a10');
    P.rect(115, 176, 1, 44, '#2a0a06');
    for (const dx of [102, 118]) { P.rect(dx, 182, 11, 14, '#3a120a'); P.rect(dx, 200, 11, 16, '#3a120a'); }
    P.rect(112, 198, 2, 2, '#d9b13b'); P.rect(117, 198, 2, 2, '#d9b13b');
    P.rect(92, 218, 47, 3, '#5a5668'); P.rect(88, 221, 55, 3, '#4a4658');
    // the inn's name
    signBoard(P, INN_W / 2, 113, 'GASTHAUS ZUM KÜRBIS');
    // string lights along the hall
    P.line(4, 132, INN_W - 4, 132, 1, '#1a1a1a');
    for (let x = 6; x < INN_W - 4; x += 5) P.rect(x, 133, 2, 2, ['#ff8a1a', '#a040ff', '#7aff5a'][(x / 5) % 3 | 0]);
    // plinth
    P.rect(0, 214, INN_W, 10, '#3a3644');
    P.rect(0, 214, INN_W, 1, '#55506a');
    // cobweb in the corner
    for (let k = 0; k < 5; k++) P.line(INN_W - 4, 112 + k * 3, INN_W - 18 + k * 3, 112, 1, 'rgba(220,220,240,0.4)');
  });
}

function makeRoof(scene) {
  const w = INN.roofW, h = INN.roofH;
  canvasTex(scene, 'inn_roof', w, h, (P) => {
    const zinc = '#76838e';
    const seam = shade(zinc, -0.25), hi = shade(zinc, 0.3), dk = shade(zinc, -0.45);
    for (const cx of INN.chimneys) {
      P.rect(cx - 6, 2, 12, 24, '#5a3530');
      for (let y = 5; y < 26; y += 4) P.rect(cx - 6, y, 12, 1, '#43272a');
      P.rect(cx - 7, 0, 14, 3, '#6e4842');
    }
    P.poly([[10, 13], [w - 10, 13], [w - 16, 7], [16, 7]], shade(zinc, 0.12));
    P.poly([[0, 48], [w, 48], [w - 8, 13], [8, 13]], zinc);
    for (let x = 3; x < w; x += 6) {
      const top = x + (w / 2 - x) * 0.07;
      P.line(x, 46, top, 14, 1, seam);
      P.line(x + 1, 46, top + 1, 14, 1, shade(zinc, 0.08));
    }
    P.rect(8, 13, w - 16, 1, hi);
    P.rect(0, 45, w, 3, dk); P.rect(0, 45, w, 1, hi);
    for (const dx of INN.dormers) {
      P.rect(dx - 9, 21, 18, 21, '#5a5244');
      P.rect(dx - 9, 21, 2, 21, '#2e1f14'); P.rect(dx + 7, 21, 2, 21, '#2e1f14');
      P.rect(dx - 5, 25, 10, 13, '#0e0b18');
      P.rect(dx, 25, 1, 13, '#2e1f14'); P.rect(dx - 5, 31, 10, 1, '#2e1f14');
      P.poly([[dx - 12, 22], [dx + 12, 22], [dx, 12]], zinc);
      P.line(dx - 12, 22, dx, 12, 1, hi); P.line(dx, 12, dx + 12, 22, 1, seam);
    }
  });
}

function nightWindow(P, x, y, w, h) {
  P.rect(x - 2, y - 2, w + 4, h + 4, '#3a2a20');
  P.rect(x, y, w, h, '#16224a');
  P.px(x + 3, y + 3, '#ffffff'); P.px(x + w - 4, y + 6, '#9fa8d0');
  P.rect(x + Math.floor(w / 2), y, 1, h, '#3a2a20');
}

function makeInterior(scene) {
  canvasTex(scene, 'inn_interior', INN_W, HOUSE_H, (P) => {
    const R = rng(616);
    P.rect(0, 0, INN_W, HOUSE_H, '#1e1824');
    // ---- hotel storeys: rooms of different sizes and furnishing
    HOTEL.forEach((rooms, t) => {
      const y0 = t * STOREY_H;
      for (const r of rooms) {
        const top = t === 0 ? 4 : y0;
        const { x: rx, w, paper } = r;
        P.rect(rx, top, w, y0 + 52 - top, paper);
        for (let x = rx; x < rx + w; x += 6) P.rect(x, top, 2, y0 + 52 - top, shade(paper, 0.08));
        P.rect(rx, y0 + 40, w, 12, shade(paper, -0.35));
        nightWindow(P, Math.round(rx + w / 2 - 7), y0 + 8, 14, 16);
        // nightstand with a small lamp next to the bed (lit only for the guest who is awake)
        const ns = r.bed === 'L' ? rx + 46 : rx + w - 54;
        P.rect(ns, y0 + 44, 8, 8, '#5a3a24');
        P.rect(ns + 3, y0 + 40, 2, 4, '#b8a080');
        P.poly([[ns, y0 + 40], [ns + 8, y0 + 40], [ns + 6, y0 + 36], [ns + 2, y0 + 36]], r.awake ? '#f2c45a' : '#8a7a50');
        if (w >= 70) {
          // picture above the bed in the bigger rooms
          const px = r.bed === 'L' ? rx + 14 : rx + w - 30;
          P.rect(px, y0 + 12, 14, 10, '#8a6a2a'); P.rect(px + 1, y0 + 13, 12, 8, '#2a3a4a'); P.circle(px + 7, y0 + 17, 2, '#c8b090');
        }
        if (r.extra === 'armchair') {
          const ax = rx + 58;
          P.rect(ax, y0 + 40, 14, 12, '#7a3a4a'); P.rect(ax, y0 + 34, 14, 7, '#8a4a5a');
          P.rect(ax - 2, y0 + 38, 3, 14, '#6a2a3a'); P.rect(ax + 13, y0 + 38, 3, 14, '#6a2a3a');
          P.rect(rx + 8, y0 + 51, w - 16, 1, '#8a6a2a');
        }
        if (r.extra === 'desk') {
          P.rect(rx + 3, y0 + 38, 18, 3, '#6b4226'); P.rect(rx + 4, y0 + 41, 2, 11, '#4a2c18'); P.rect(rx + 18, y0 + 41, 2, 11, '#4a2c18');
          P.rect(rx + 6, y0 + 34, 6, 4, '#e8dcb0'); P.rect(rx + 15, y0 + 31, 2, 7, '#c9a227'); P.px(rx + 15, y0 + 30, '#ffb020');
        }
        P.rect(rx + Math.round(w / 2) - 3, y0 + 4, 6, 3, '#c9a227'); // room number
      }
      for (const r of rooms.slice(1)) P.rect(r.x - 4, y0, 4, 52, '#2a1a10');
      P.rect(0, y0 + 52, INN_W, 4, '#4a3222');
      P.rect(0, y0 + 52, INN_W, 1, '#6a4a32');
    });
    // ---- party hall (two storeys tall)
    const hallTop = INN.hallTop;
    const floor = HOUSE_H - 4;
    P.rect(4, hallTop, INN_W - 8, floor - hallTop, '#3a1a1e');
    for (let x = 4; x < INN_W - 4; x += 10) P.rect(x, hallTop, 1, floor - hallTop, '#2e1418');
    P.rect(4, floor - 34, INN_W - 8, 34, '#2a1a10');
    for (let x = 4; x < INN_W - 4; x += 16) P.rect(x + 2, floor - 30, 12, 26, '#22140c');
    P.rect(4, floor - 35, INN_W - 8, 2, '#5a3a20');
    // tall arched windows
    for (const wx of [40, 104, 168]) {
      P.circle(wx + 11, 132, 13, '#2a1a10');
      P.rect(wx - 2, 132, 26, 44, '#2a1a10');
      P.circle(wx + 11, 132, 11, '#16224a');
      P.rect(wx, 132, 22, 42, '#16224a');
      P.rect(wx + 11, 120, 1, 56, '#2a1a10');
      for (let k = 0; k < 5; k++) P.px(wx + 2 + R() * 18, 124 + R() * 46, '#9fa8d0');
    }
    P.circle(126, 128, 4, '#e8dfb8');
    // bunting across the hall
    for (let x = 6; x < INN_W - 8; x += 7) {
      const sag = Math.sin(((x - 6) / (INN_W - 14)) * Math.PI) * 6;
      P.poly([[x, 117 + sag], [x + 6, 117 + sag], [x + 3, 123 + sag]], ['#ff7a1a', '#1a1a1a', '#8a3ab0'][(x / 7 | 0) % 3]);
    }
    // banner
    const banner = 'HALLOWEEN PARTY';
    const bw = textWidth(banner, 1) + 10;
    P.rect(115 - bw / 2, 179, bw, 11, '#1a1a1a');
    P.rect(115 - bw / 2, 179, bw, 1, '#ff7a1a'); P.rect(115 - bw / 2, 189, bw, 1, '#ff7a1a');
    drawText(P, banner, 115 - bw / 2 + 5, 182, '#ff9a3c', 1);
    // paper bats hanging from the ceiling
    for (const [bx, by] of [[20, 128], [70, 136], [150, 130], [205, 138], [92, 142]]) {
      P.rect(bx, hallTop, 1, by - hallTop, '#555');
      P.poly([[bx - 5, by], [bx, by + 2], [bx + 5, by], [bx + 3, by + 3], [bx, by + 4], [bx - 3, by + 3]], '#111');
    }
    // chandelier
    P.rect(115, hallTop, 1, 10, '#555');
    P.rect(105, hallTop + 10, 21, 2, '#b8902c');
    for (const cx of [106, 115, 124]) { P.rect(cx, hallTop + 7, 2, 3, '#eee'); P.px(cx, hallTop + 6, '#ffb020'); }
    // cobwebs
    for (let k = 0; k < 5; k++) {
      P.line(4, hallTop + k * 3, 18 - k * 3, hallTop, 1, 'rgba(220,220,240,0.35)');
      P.line(INN_W - 4, hallTop + k * 3, INN_W - 18 + k * 3, hallTop, 1, 'rgba(220,220,240,0.35)');
    }
    // bar shelf with bottles behind the tables
    P.rect(130, 160, 30, 2, '#5a3a20');
    for (let x = 132; x < 158; x += 4) P.rect(x, 153, 2, 7, ['#2a6a2a', '#8a2a2a', '#c9a227'][(x / 4 | 0) % 3]);
    // floor
    P.rect(0, floor, INN_W, 4, '#4a3222');
    P.rect(0, floor, INN_W, 1, '#6a4a32');
  });
}

function makeSpots(scene) {
  canvasTex(scene, 'table', 34, 16, (P) => {
    P.rect(2, 12, 2, 4, '#3a2416'); P.rect(30, 12, 2, 4, '#3a2416');
    P.rect(0, 12, 34, 4, '#07050a');
    P.rect(0, 4, 34, 2, '#1a1a1a');
    P.rect(0, 6, 34, 6, '#1a1a1a');
    for (let x = 0; x < 34; x += 4) P.poly([[x, 11], [x + 4, 11], [x + 2, 13]], '#1a1a1a');
    P.rect(0, 6, 34, 1, '#ff7a1a');
    P.ellipse(12, 2, 4, 2, '#e3711b'); P.px(11, 2, '#ffd23f'); P.px(13, 2, '#ffd23f');
    P.rect(22, 0, 2, 4, '#eee'); P.px(22, -1, '#ffb020');
    P.rect(26, 2, 2, 2, '#a03040');
  });
  canvasTex(scene, 'coffin', 16, 36, (P) => {
    P.poly([[4, 0], [12, 0], [16, 8], [13, 36], [3, 36], [0, 8]], '#3a2418');
    P.poly([[5, 2], [11, 2], [14, 8], [11, 34], [5, 34], [2, 8]], '#5a3a20');
    P.circle(8, 12, 3, '#d8d0c0'); P.px(7, 12, '#000'); P.px(9, 12, '#000'); P.rect(7, 15, 3, 1, '#d8d0c0');
    P.rect(5, 22, 6, 1, '#3a2418'); P.rect(5, 26, 6, 1, '#3a2418');
  });
  canvasTex(scene, 'bigpumpkin', 26, 22, (P) => {
    P.ellipse(13, 13, 13, 9, '#e3711b');
    P.ellipse(13, 13, 5, 9, '#f08a2a');
    P.rect(7, 5, 1, 17, '#b5530f'); P.rect(18, 5, 1, 17, '#b5530f');
    P.rect(12, 0, 3, 5, '#3d5a22');
    P.poly([[5, 9], [10, 9], [7.5, 13]], '#ffd23f'); P.poly([[16, 9], [21, 9], [18.5, 13]], '#ffd23f');
    P.poly([[5, 16], [21, 16], [18, 19], [8, 19]], '#ffd23f');
    P.rect(10, 16, 2, 1, '#e3711b'); P.rect(15, 18, 2, 1, '#e3711b');
  });
  canvasTex(scene, 'kitchendoor', 20, 40, (P) => {
    P.rect(0, 0, 20, 40, '#2a1a10');
    P.rect(2, 2, 16, 38, '#6a4a2a');
    P.circle(10, 12, 4, '#3a2a1a'); P.circle(10, 12, 3, '#f2c45a');
    P.rect(2, 32, 16, 6, '#8a8a98');
    P.rect(2, 20, 16, 1, '#4a3018');
  });
  canvasTex(scene, 'kitchendoor_open', 20, 40, (P) => {
    P.rect(0, 0, 20, 40, '#2a1a10');
    P.rect(2, 2, 16, 38, '#3a2614');
    P.rect(4, 6, 12, 30, '#5a3a1a');
    P.poly([[2, 2], [7, 5], [7, 40], [2, 40]], '#6a4a2a');
  });
}

export function makeInn(scene) {
  makeFacade(scene);
  makeRoof(scene);
  makeInterior(scene);
  makeSpots(scene);
}
