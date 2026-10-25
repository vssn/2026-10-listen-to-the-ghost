import { canvasTex, rng, shade } from '../gfx.js';
import { GROUND_Y, HOUSE_W, METRO_HOUSES, METRO_TOP, METRO_FLOOR, houseX } from '../config.js';
import { drawText, textWidth } from './inn.js';

// Station geometry in world coordinates (shared with objects/Metro.js).
// Two exits: in the gaps just before the first and just after the last house above.
export const METRO = (() => {
  const front = houseX(METRO_HOUSES[0]) - 40;
  const back = houseX(METRO_HOUSES[2]) + HOUSE_W + 40;
  const x0 = front - 30;
  const x1 = back + 30;
  return {
    x0, x1, w: x1 - x0,
    top: METRO_TOP,
    floor: METRO_FLOOR,
    h: METRO_FLOOR + 12 - METRO_TOP,
    // stair centres; dir = which way the steps run down into the station
    exits: [{ x: front, dir: 1 }, { x: back, dir: -1 }],
    carW: 150,
    carH: 36,
  };
})();
// Ceiling lamps along the platform (station-local x).
export const METRO_LAMPS = (() => {
  const xs = [];
  for (let x = 60; x < METRO.w - 50; x += 56) xs.push(x);
  return xs;
})();

// Spooky art-nouveau letters for the METROPOLITAIN sign (with little drips).
const SPOOKY = {
  M: ['10001', '11011', '10101', '10001', '10001', '10001'],
  E: ['1111', '1000', '1110', '1000', '1000', '1111'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100'],
  R: ['1110', '1001', '1110', '1010', '1001', '1001'],
  O: ['0110', '1001', '1001', '1001', '1001', '0110'],
  P: ['1110', '1001', '1001', '1110', '1000', '1000'],
  L: ['1000', '1000', '1000', '1000', '1000', '1111'],
  I: ['111', '010', '010', '010', '010', '111'],
  A: ['0110', '1001', '1001', '1111', '1001', '1001'],
  N: ['1001', '1101', '1101', '1011', '1011', '1001'],
};
const DRIPS = { E: [1, 2], O: [2, 1], A: [0, 2], N: [3, 1], T: [2, 2] };

function spookyText(P, str, x, y, color) {
  [...str].forEach((ch, k) => {
    const g = SPOOKY[ch];
    const dy = k % 2; // letters dance up and down a little
    g.forEach((row, yy) => [...row].forEach((b, xx) => b === '1' && P.px(x + xx, y + yy + dy, color)));
    const drip = DRIPS[ch];
    if (drip && k % 3 !== 1) P.rect(x + drip[0], y + 6 + dy, 1, drip[1], color);
    x += g[0].length + 1;
  });
}
const spookyWidth = (str) => [...str].reduce((w, ch) => w + SPOOKY[ch][0].length + 1, -1);

// Guimard entrance arch with the red globe lamps (like the Paris Métro).
function makeArch(scene) {
  canvasTex(scene, 'metro_arch', 110, 72, (P) => {
    const iron = '#2e5a4a', dark = '#1a3a30', hi = '#4a7a6a';
    // posts curving inwards at the top
    for (const [x, dir] of [[8, 1], [101, -1]]) {
      P.rect(x, 26, 3, 46, iron);
      P.rect(x + (dir > 0 ? 0 : 2), 26, 1, 46, hi);
      P.rect(x - 2, 66, 7, 6, dark);
      P.line(x + 1, 28, x + 1 + dir * 10, 14, 3, iron);
      P.line(x + 1 + dir * 10, 14, x + 1 + dir * 20, 18, 3, iron);
      // lamp neck bending outwards
      P.line(x + 1, 26, x + 1 - dir * 4, 12, 2, iron);
      P.line(x + 1 - dir * 4, 12, x + 1 + dir * 2, 4, 2, iron);
      // red globe
      const lx = x + 3 + (dir > 0 ? 0 : -2);
      P.circle(lx, 8, 5, '#2a0808');
      P.circle(lx, 8, 4, '#d01818');
      P.circle(lx - 1, 7, 2, '#ff6a4a');
      P.rect(lx - 4, 2, 9, 2, dark);
    }
    // the sign
    const sw = spookyWidth('METROPOLITAIN') + 10;
    const sx = Math.round(55 - sw / 2);
    P.ellipse(55, 22, sw / 2 + 2, 9, dark);
    P.ellipse(55, 22, sw / 2, 7, '#d8e0a0');
    P.ellipse(55, 22, sw / 2 - 2, 5, '#e4ebb4');
    spookyText(P, 'METROPOLITAIN', sx + 5, 17, '#1a3a3a');
    // leafy ornaments on top
    P.circle(55, 12, 3, iron); P.px(55, 9, hi);
  });
}

// Stairs from the sidewalk down to the station (texture y 14 = ground line).
function makeStairs(scene) {
  canvasTex(scene, 'metro_stairs', 48, METRO_TOP - GROUND_Y + 24, (P) => {
    const h = METRO_TOP - GROUND_Y + 24;
    P.rect(0, 10, 48, h - 10, '#120f18');
    for (let y = 10; y < h; y += 4) {
      for (let x = 0; x < 4; x += 2) { P.rect(x, y, 2, 3, '#a8a090'); P.rect(44 + x, y, 2, 3, '#a8a090'); }
    }
    for (let k = 0; k < 7; k++) {
      const y = 16 + k * 7;
      P.rect(6, y + 2, 36, 5, '#24212c');
      P.rect(6, y, 36, 2, '#6a6478');
    }
    // Guimard railings
    const iron = '#2e5a4a';
    P.rect(0, 2, 48, 1, iron);
    for (let x = 1; x < 48; x += 5) {
      P.rect(x, 2, 1, 11, iron);
      P.circle(x + 2, 7, 1, iron);
    }
  });
}

function makeStation(scene) {
  const { w, h } = METRO;
  const floor = METRO.floor - METRO.top;
  canvasTex(scene, 'metro_station', w, h, (P) => {
    const R = rng(909);
    P.rect(0, 0, w, h, '#1a1814');
    // white bevelled tiles, grimy with age
    for (let y = 6; y < floor; y += 4) {
      const off = (y / 4) % 2 ? 4 : 0;
      for (let x = -off; x < w; x += 8) {
        const c = R() < 0.06 ? '#7a7464' : R() < 0.5 ? '#a8a090' : '#b4ac9c';
        P.rect(x + 1, y + 1, 7, 3, c);
        if (R() < 0.02) P.line(x + 2, y + 1, x + 6, y + 3, 1, '#4a4438');
      }
    }
    for (let i = 0; i < 6; i++) {
      P.ctx.fillStyle = `rgba(10,8,12,${0.04 + i * 0.05})`;
      P.ctx.fillRect(0, floor - 30 + i * 5, w, 5);
    }
    P.ctx.fillStyle = 'rgba(10,8,12,0.35)';
    P.ctx.fillRect(0, 6, w, 6);
    // vaulted ceiling
    P.rect(0, 0, w, 6, '#2a2620');
    for (let x = 0; x < w; x += 28) P.rect(x, 0, 2, 8, '#3a342c');
    // tunnel mouths at both ends
    for (const tx of [0, w - 26]) {
      P.rect(tx, 40, 26, floor - 40 + 12, '#4a443a');
      P.circle(tx + 13, 52, 12, '#4a443a');
      P.circle(tx + 13, 52, 10, '#05040a');
      P.rect(tx + 3, 52, 20, floor - 52 + 12, '#05040a');
    }
    const nearExit = (x) => METRO.exits.some((e) => Math.abs(x - (e.x - METRO.x0)) < 44);
    // station name plaques
    for (const px of [0.22, 0.5, 0.78]) {
      const name = 'TUILERIES';
      const pw = textWidth(name) + 10;
      const x = Math.round(w * px - pw / 2);
      P.rect(x, 18, pw, 11, '#1a2a5a');
      P.rect(x, 18, pw, 1, '#3a4a8a');
      drawText(P, name, x + 5, 21, '#f0f0f0');
    }
    // spooky posters
    const posters = [
      [0.32, '#e3711b', (x, y) => { P.poly([[x + 4, y + 12], [x + 11, y + 8], [x + 18, y + 12], [x + 11, y + 15]], '#1a1a1a'); }],
      [0.44, '#2a5a3a', (x, y) => { P.circle(x + 11, y + 11, 5, '#e8e0d0'); P.px(x + 9, y + 10, '#000'); P.px(x + 13, y + 10, '#000'); }],
      [0.74, '#4a2a6a', (x, y) => { P.ellipse(x + 11, y + 12, 6, 5, '#e3711b'); P.rect(x + 8, y + 10, 2, 2, '#ffd23f'); P.rect(x + 12, y + 10, 2, 2, '#ffd23f'); }],
      [0.95, '#2a3a6a', (x, y) => { P.circle(x + 11, y + 10, 5, '#fff4dc'); P.rect(x + 6, y + 10, 11, 7, '#fff4dc'); P.px(x + 9, y + 10, '#000'); P.px(x + 13, y + 10, '#000'); }],
    ];
    for (const [fx, bg, art] of posters) {
      const x = Math.round(w * fx - 11), y = 8;
      if (nearExit(x + 11) || x + 22 > w - 30) continue;
      P.rect(x - 1, y - 1, 24, 30, '#d8d0c0');
      P.rect(x, y, 22, 28, bg);
      art(x, y);
      P.rect(x + 3, y + 22, 16, 1, '#f0e8d0'); P.rect(x + 5, y + 24, 12, 1, '#f0e8d0');
    }
    // stairs coming down from the street at both exits, running inwards
    for (const { x, dir } of METRO.exits) {
      const ex = x - METRO.x0;
      for (let k = 0; k < 9; k++) {
        const sy = 2 + k * 8;
        if (sy > floor - 4) break;
        const sx = dir > 0 ? ex - 22 + k * 3 : ex - 8 - k * 3;
        P.rect(sx, sy + 2, 30, 6, '#24212c');
        P.rect(sx, sy, 30, 2, '#6a6478');
      }
      P.line(ex - 24 * dir, 0, ex + 6 * dir, floor, 1, '#2e5a4a');
    }
    // lamp fixtures
    for (const lx of METRO_LAMPS) {
      P.rect(lx - 1, 0, 2, 8, '#2a2620');
      P.rect(lx - 3, 8, 7, 3, '#fff0c0');
      P.rect(lx - 3, 8, 7, 1, '#c8c0a0');
    }
    // platform floor
    P.rect(0, floor - 2, w, 2, '#6a6458');
  });
  // the platform edge strip stands in front of the train
  canvasTex(scene, 'metro_platform', w, 12, (P) => {
    P.rect(0, 0, w, 12, '#3a3630');
    P.rect(0, 0, w, 2, '#8a8478');
    P.rect(0, 2, w, 1, '#c9a227');
    for (let x = 0; x < w; x += 12) P.rect(x, 3, 1, 9, '#2a2620');
  });
}

function makeTrain(scene) {
  const { carW: w, carH: h } = METRO;
  // shell with see-through windows; the lit interior and passengers sit behind it
  canvasTex(scene, 'metro_car', w, h, (P) => {
    const green = '#2f5a44', dark = '#1e3a2c';
    P.rect(2, 0, w - 4, 5, '#1e2a24');
    P.rect(0, 4, w, 30, green);
    P.rect(0, 4, w, 1, shade(green, 0.25));
    P.rect(0, 26, w, 2, '#8a2a2a');
    P.rect(0, 28, w, 8, dark);
    for (const dx of [30, 104]) {
      P.rect(dx, 6, 16, 28, dark);
      P.rect(dx + 7, 6, 1, 28, '#14261c');
      P.rect(dx + 3, 18, 2, 2, '#c9a227');
    }
    P.erase((c) => {
      for (const wx of [6, 52, 76, 126]) P.rect(wx, 10, 18, 13, c);
      for (const dx of [30, 104]) { P.rect(dx + 2, 9, 4, 10, c); P.rect(dx + 10, 9, 4, 10, c); }
    });
    for (const wx of [6, 52, 76, 126]) P.rect(wx + 8, 10, 1, 13, dark);
    P.rect(1, 12, 2, 3, '#ffe69a'); P.rect(w - 3, 12, 2, 3, '#e03a3a');
  });
  canvasTex(scene, 'metro_car_in', w, h, (P) => {
    P.rect(2, 4, w - 4, 30, '#d8b860');
    P.rect(2, 6, w - 4, 2, '#fff6d0');
    P.rect(2, 22, w - 4, 6, '#7a4a2a');
    for (const x of [44, 118]) P.rect(x, 6, 1, 22, '#c0c0c8');
  });
}

function makePlatformProps(scene) {
  canvasTex(scene, 'bench', 26, 12, (P) => {
    const iron = '#2e5a4a';
    P.rect(0, 4, 26, 3, '#6a4428'); P.rect(0, 4, 26, 1, '#8a6040');
    P.rect(1, 0, 24, 2, '#6a4428');
    P.rect(2, 2, 1, 2, iron); P.rect(23, 2, 1, 2, iron);
    P.rect(2, 7, 2, 5, iron); P.rect(22, 7, 2, 5, iron);
    P.rect(4, 7, 18, 5, '#07050a');
  });
  canvasTex(scene, 'kiosk', 24, 30, (P) => {
    P.rect(0, 6, 24, 24, '#2e5a4a');
    P.rect(2, 8, 20, 12, '#d8c89a');
    for (let k = 0; k < 4; k++) P.rect(3 + k * 5, 9, 4, 5, ['#a02a2a', '#2a4a8a', '#e3711b', '#1a1a1a'][k]);
    for (let k = 0; k < 4; k++) P.rect(3 + k * 5, 15, 4, 4, ['#e8dcb0', '#c04060', '#3a6a3a', '#e8dcb0'][k]);
    P.poly([[-1, 6], [25, 6], [21, 0], [3, 0]], '#1a3a30');
    P.rect(0, 22, 24, 8, '#24402f');
  });
  canvasTex(scene, 'ticketmachine', 16, 28, (P) => {
    P.rect(0, 0, 16, 28, '#3a4a6a');
    P.rect(0, 0, 16, 2, '#5a6a8a');
    P.rect(3, 4, 10, 7, '#0e1a2a'); P.rect(4, 5, 8, 5, '#7affd0');
    P.rect(5, 6, 4, 1, '#0e3a2a'); P.rect(5, 8, 6, 1, '#0e3a2a');
    for (let k = 0; k < 3; k++) P.rect(3 + k * 4, 13, 2, 2, ['#e03a3a', '#ffd23f', '#3ae03a'][k]);
    P.rect(4, 18, 8, 2, '#0a0a12');
    P.rect(2, 22, 12, 6, '#2a3a5a');
  });
  canvasTex(scene, 'ticket', 5, 3, (P) => {
    P.rect(0, 0, 5, 3, '#f0e6b0');
    P.rect(1, 1, 3, 1, '#7a6a3a');
  });
}

export function makeMetro(scene) {
  makeArch(scene);
  makeStairs(scene);
  makeStation(scene);
  makeTrain(scene);
  makePlatformProps(scene);
}
