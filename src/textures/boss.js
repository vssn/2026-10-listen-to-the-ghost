import { canvasTex, rng, shade } from '../gfx.js';
import { W, H, FLOOR, CEIL } from '../config.js';

// cellar = the wizard's vault below a townhouse instead of his hall upstairs
function makeRoom(scene, key, cellar) {
  canvasTex(scene, key, W, H, (P) => {
    const R = rng(77);
    // stone wall
    P.rect(0, 0, W, H, '#150d22');
    for (let row = 0; row * 8 < FLOOR; row++) {
      const off = row % 2 ? 8 : 0;
      for (let x = -off; x < W; x += 16) {
        const c = (cellar ? ['#2a2228', '#2e2529', '#33292c', '#262024'] : ['#24183a', '#271b3e', '#2b1e44', '#221636'])[Math.floor(R() * 4)];
        P.rect(x + 1, row * 8 + 1, 15, 7, c);
      }
    }
    // windows with moon
    const win = (x, moon) => {
      P.arch(x - 2, 38, 38, 80, '#3a2a4a');
      P.arch(x, 40, 34, 76, '#121036');
      for (let k = 0; k < 14; k++) P.px(x + 3 + R() * 28, 44 + R() * 66, '#8a86c0');
      if (moon) { P.circle(x + 22, 64, 8, '#f2e6bd'); P.circle(x + 25, 62, 7, '#fbf3d6'); }
      P.rect(x + 16, 40, 2, 76, '#3a2a4a');
      P.rect(x, 78, 34, 2, '#3a2a4a');
      P.rect(x - 4, 116, 42, 4, '#4a3a5a');
    };
    // vaulted niches with barrels and wine racks in the cellar
    const niche = (x, kind) => {
      P.arch(x - 2, 38, 38, 80, '#3a3036');
      P.arch(x, 40, 34, 76, '#0e0a0e');
      if (kind === 'barrels') {
        for (const [bx, by] of [[x + 9, 104], [x + 25, 104], [x + 17, 90]]) {
          P.ellipse(bx, by, 7, 7, '#5a3a20'); P.ellipse(bx, by, 5, 5, '#6b4628');
          P.rect(bx - 7, by - 1, 15, 1, '#3a3a44'); P.circle(bx, by, 1, '#2a1a10');
        }
      } else {
        for (let y = 50; y < 114; y += 8) {
          P.rect(x + 2, y + 6, 30, 1, '#3a2418');
          for (let bx = x + 4; bx < x + 31; bx += 5) P.circle(bx, y + 3, 2, (bx + y) % 3 ? '#2a4a2a' : '#5a1a2a');
        }
      }
      P.rect(x - 4, 116, 42, 4, '#4a3e44');
    };
    if (cellar) { niche(44, 'barrels'); niche(195, 'wine'); niche(346, 'barrels'); } else { win(44, false); win(195, true); win(346, false); }
    // wainscot
    P.rect(0, 168, W, FLOOR - 168, '#2a1a14');
    for (let x = 0; x < W; x += 24) { P.rect(x + 3, 174, 18, FLOOR - 180, '#22140f'); P.rect(x, 168, 1, FLOOR - 168, '#1a0f0a'); }
    P.rect(0, 166, W, 3, '#4a2e1e');
    // ceiling beams
    P.rect(0, 0, W, CEIL, '#1e130d');
    for (let x = 0; x < W; x += 40) P.rect(x, 0, 6, CEIL, '#2e1e14');
    P.rect(0, CEIL - 2, W, 2, '#3a2618');
    // floor
    P.rect(0, FLOOR, W, H - FLOOR, '#3a2418');
    for (let x = 0; x < W; x += 20) P.rect(x, FLOOR + 1, 1, H - FLOOR, '#2a180f');
    P.rect(0, FLOOR, W, 1, '#5a3a24');
    P.rect(120, FLOOR, 186, 3, '#6b1a2a');
    // portraits
    const portrait = (x, y) => {
      P.rect(x, y, 22, 28, '#8a6a2a'); P.rect(x + 2, y + 2, 18, 24, '#1a2a22');
      P.circle(x + 11, y + 12, 5, '#c8b090'); P.rect(x + 5, y + 18, 12, 8, '#3a1f5a');
      P.px(x + 9, y + 11, '#ff2a2a'); P.px(x + 13, y + 11, '#ff2a2a');
      P.poly([[x + 5, y + 8], [x + 17, y + 8], [x + 11, y - 2]], '#3a1f5a');
    };
    if (cellar) {
      // pipes along the vault and potion shelves
      P.rect(0, CEIL + 4, W, 3, '#5a4a3a'); P.rect(0, CEIL + 4, W, 1, '#7a6a5a');
      for (const sx of [92, 304]) {
        for (const sy of [128, 146]) {
          P.rect(sx, sy, 30, 2, '#3a2418');
          for (let x = sx + 2; x < sx + 28; x += 5) P.rect(x, sy - 6, 3, 6, ['#7aff7a', '#ff5ad1', '#5ad1ff', '#ffd23f'][(x + sy) % 4]);
        }
      }
    } else {
      portrait(96, 120); portrait(308, 120);
    }
    // cobwebs
    for (const [cx, dir] of [[0, 1], [W, -1]]) {
      for (let k = 0; k < 6; k++) P.line(cx, CEIL + k * 4, cx + dir * (24 - k * 4), CEIL, 1, 'rgba(220,220,240,0.35)');
    }
    // sconces
    for (const sx of [168, 258]) { P.rect(sx, 136, 4, 8, '#5a5a6a'); P.rect(sx + 1, 130, 2, 6, '#eee'); P.rect(sx + 1, 127, 2, 3, '#ffcc33'); }
  });
}

function makeProps(scene) {
  const gold = '#b8902c', goldD = '#7a5c1a', goldL = '#e8c860';
  canvasTex(scene, 'chain', 3, 6, (P) => {
    P.rect(1, 0, 1, 4, '#6a6a78'); P.rect(0, 3, 3, 3, '#8a8a98'); P.px(1, 4, '#3a3a44');
  });
  canvasTex(scene, 'chandelier', 44, 22, (P) => {
    P.rect(20, 0, 4, 10, gold); P.circle(22, 10, 4, goldL); P.circle(22, 10, 2, goldD);
    P.rect(2, 14, 40, 3, gold); P.rect(2, 14, 40, 1, goldL);
    P.line(22, 12, 4, 14, 1, goldD); P.line(22, 12, 40, 14, 1, goldD);
    P.rect(18, 17, 8, 3, gold); P.px(22, 21, goldD);
    for (const x of [3, 12, 21, 30, 39]) {
      P.rect(x - 1, 12, 4, 2, goldD);
      P.rect(x, 7, 2, 5, '#f0ead8');
      P.rect(x, 4, 2, 3, '#ffb020'); P.px(x, 3, '#ffe066');
    }
    for (const x of [8, 26, 35]) { P.rect(x, 17, 1, 3, '#a8d8ff'); P.px(x, 20, '#d8f0ff'); }
  });
  canvasTex(scene, 'chandelier_broken', 48, 10, (P) => {
    P.rect(4, 6, 40, 3, gold); P.rect(4, 6, 40, 1, goldL);
    P.line(6, 6, 2, 1, 1, goldD); P.line(42, 6, 47, 2, 1, goldD);
    P.circle(24, 6, 4, goldD);
    P.rect(10, 8, 5, 2, '#f0ead8'); P.rect(32, 7, 6, 2, '#f0ead8');
    for (const x of [16, 28, 36]) P.px(x, 9, '#a8d8ff');
  });
  canvasTex(scene, 'bookshelf', 32, 120, (P) => {
    const R = rng(55);
    P.rect(0, 0, 32, 120, '#3a2214');
    P.rect(2, 4, 28, 114, '#1a0e08');
    P.rect(0, 0, 32, 4, '#5a3a24');
    const colors = ['#7a1f2a', '#1f4a3a', '#2a3a6a', '#6a5a1a', '#4a2a5a', '#8a5a2a', '#3a3a3a'];
    for (let sy = 4; sy < 116; sy += 22) {
      let x = 3;
      while (x < 28) {
        const bw = 2 + Math.floor(R() * 3);
        const bh = 12 + Math.floor(R() * 7);
        if (x + bw > 29) break;
        const c = colors[Math.floor(R() * colors.length)];
        P.rect(x, sy + 20 - bh, bw, bh, c);
        P.rect(x, sy + 22 - bh, bw, 1, shade(c, 0.4));
        x += bw + (R() < 0.15 ? 2 : 0);
      }
      P.rect(0, sy + 20, 32, 2, '#5a3a24');
    }
    // skull on top shelf
    P.circle(22, 34, 3, '#d8d0c0'); P.px(21, 34, '#000'); P.px(23, 34, '#000');
    P.rect(0, 116, 32, 4, '#3a2214');
  });
  canvasTex(scene, 'armor', 20, 46, (P) => {
    const s = '#9aa0ad', sD = '#5a6070', sL = '#d0d6e0';
    // halberd
    P.rect(17, 0, 1, 46, '#5a3a1a');
    P.poly([[14, 2], [20, 4], [14, 8]], sL);
    P.px(17, 0, sL);
    // helmet
    P.rect(5, 0, 9, 10, s); P.rect(5, 0, 9, 1, sL); P.rect(6, 4, 7, 2, '#151518'); P.rect(9, 0, 1, 10, sD);
    P.rect(8, -1 + 1, 3, 1, '#a83a3a');
    // torso
    P.rect(3, 10, 13, 14, s); P.rect(3, 10, 3, 14, sL); P.rect(13, 10, 3, 14, sD);
    P.rect(1, 11, 3, 10, s); P.rect(15, 11, 3, 10, s);
    P.rect(4, 24, 11, 3, sD);
    // legs
    P.rect(4, 27, 4, 16, s); P.rect(11, 27, 4, 16, s); P.rect(4, 27, 1, 16, sL); P.rect(14, 27, 1, 16, sD);
    P.rect(3, 43, 6, 3, sD); P.rect(10, 43, 6, 3, sD);
  });
  const cage = (open) => (P) => {
    const iron = '#c9a227', ironD = '#7a5c1a';
    P.rect(10, 0, 3, 4, ironD);
    P.circle(11, 13, 10, iron);
    P.erase((c) => { P.circle(11, 13, 8, c); P.rect(0, 13, 23, 20, c); });
    P.rect(1, 13, 21, 2, iron);
    for (const x of [1, 6, 11, 16, 21]) {
      if (open && (x === 6 || x === 11 || x === 16)) continue;
      P.rect(x, 13, 1, 16, iron);
    }
    P.rect(11, 4, 1, 10, iron);
    P.rect(0, 28, 23, 3, ironD);
    P.rect(0, 28, 23, 1, iron);
    if (open) {
      // door swung outwards (drawn foreshortened at the right)
      P.line(21, 15, 26, 18, 1, iron); P.line(21, 28, 26, 30, 1, iron);
      P.rect(26, 18, 1, 13, iron); P.rect(24, 17, 1, 13, iron);
    }
  };
  canvasTex(scene, 'cage', 27, 31, cage(false));
  canvasTex(scene, 'cage_open', 27, 31, cage(true));
}

export function makeBoss(scene) {
  makeRoom(scene, 'bossroom', false);
  makeRoom(scene, 'bossroom_cellar', true);
  makeProps(scene);
}
