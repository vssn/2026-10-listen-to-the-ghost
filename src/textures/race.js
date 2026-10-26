import { canvasTex, rng, shade } from '../gfx.js';

// Podium blocks for the scare race: [place] -> width, height.
export const PODIUM = {
  1: { w: 62, h: 66 },
  2: { w: 62, h: 50 },
  3: { w: 62, h: 38 },
  4: { w: 50, h: 26 },
};

// Old mossy graveyard stone, one block per place.
function makeBlock(scene, place) {
  const { w, h } = PODIUM[place];
  const R = rng(700 + place);
  canvasTex(scene, `podium_${place}`, w, h, (P) => {
    const stone = '#4d4862';
    const mortar = '#2b2738';
    P.rect(0, 0, w, h, mortar);
    // brick rows, offset every other row
    for (let y = 4, row = 0; y < h; y += 9, row++) {
      const off = row % 2 ? 0 : -8;
      for (let x = off; x < w; x += 16) {
        const c = shade(stone, (R() - 0.5) * 0.18);
        P.rect(Math.max(0, x + 1), y + 1, Math.min(15, w - x - 1, x + 15), 8, c);
        P.rect(Math.max(0, x + 1), y + 1, Math.min(15, w - x - 1, x + 15), 1, shade(c, 0.15));
      }
    }
    // top slab with a lighter edge
    P.rect(0, 0, w, 5, '#6a6484');
    P.rect(0, 0, w, 1, '#8a84a6');
    P.rect(0, 4, w, 1, '#2b2738');
    // side shading
    P.rect(0, 5, 1, h - 5, '#5c5676');
    P.rect(w - 2, 5, 2, h - 5, '#2f2b40');
    // cracks
    for (let k = 0; k < 2; k++) {
      let x = 6 + R() * (w - 12), y = 6 + R() * (h - 14);
      for (let s = 0; s < 6; s++) {
        P.px(x, y, '#1e1b28');
        x += R() < 0.5 ? 1 : 0;
        y += 1;
      }
    }
    // moss on the slab, dripping down
    for (let x = 0; x < w; x++) {
      if (R() < 0.35) {
        P.px(x, 0, '#4f7a3e');
        if (R() < 0.4) P.rect(x, 1, 1, 1 + Math.floor(R() * 4), '#3c6030');
      }
    }
    // cobweb in the upper left corner of the winner's block
    if (place === 1) {
      for (let i = 0; i < 9; i++) { P.px(1 + i, 5, '#a8a2c0'); P.px(1, 5 + i, '#a8a2c0'); }
      for (let i = 0; i < 7; i++) P.px(1 + i, 11 - i, '#8c86a6');
      for (let i = 0; i < 4; i++) P.px(1 + i, 8 - i, '#8c86a6');
    }
  });
}

export function makeRace(scene) {
  for (const place of [1, 2, 3, 4]) makeBlock(scene, place);
}
