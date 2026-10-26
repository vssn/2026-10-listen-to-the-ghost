import { canvasTex } from '../gfx.js';
import { WIZARD_LOOKS } from './characters.js';

// The big evil wizard of the title screen and the attic fight: facing left,
// with a nasty grin. Per pose: hand height, wand tip, eyes and mouth.
const POSES = {
  idle: { hand: 36, tip: [2, 25], eyes: 'glow', mouth: 'sneer' },
  laugh: { hand: 30, tip: [2, 19], eyes: 'squint', mouth: 'open' },
  cast: { hand: 24, tip: [4, 7], eyes: 'blaze', mouth: 'open' },
  hurt: { hand: 44, tip: [1, 58], eyes: 'dizzy', mouth: 'wavy' },
};

export const TITLE_WIZ = {
  w: 56, h: 72,
  wandTip: Object.fromEntries(Object.entries(POSES).map(([k, p]) => [k, { x: p.tip[0] + 1, y: p.tip[1] }])),
  eyes: [{ x: 26.5, y: 32.5 }, { x: 35.5, y: 32.5 }],
};

const L = WIZARD_LOOKS.wiz;
// sallow, slightly green skin
const SKIN = '#b4b88a';
const SKIN_D = '#848a62';
const SKIN_DD = '#4a4e36';
const HAIR = '#c8c8d8';
const HAIR_D = '#8e8ea6';
const OUTLINE = '#120818';

function drawTitleWizard(P, pose) {
  const def = POSES[pose];
  const o = 10; // the body sits right of the wand arm

  // robe: wide at the hem, gold trim along the front opening and the hem
  P.poly([[o + 9, 40], [o + 33, 40], [o + 44, 71], [o - 2, 71]], L.robe);
  P.poly([[o + 9, 40], [o + 14, 40], [o + 6, 71], [o - 2, 71]], L.robeL);
  P.poly([[o + 28, 40], [o + 33, 40], [o + 44, 71], [o + 36, 71]], L.robeD);
  for (const [x0, x1] of [[o + 16, o + 12], [o + 25, o + 28], [o + 31, o + 38]]) P.line(x0, 46, x1, 70, 1, L.robeD);
  P.line(o + 21, 44, o + 19, 70, 1, L.gold);
  P.rect(o - 2, 69, 47, 2, L.gold);
  P.rect(o - 2, 70, 47, 1, L.goldD);
  // embroidered stars and a crescent moon
  for (const [x, y] of [[o + 6, 62], [o + 13, 57], [o + 30, 60], [o + 37, 66], [o + 26, 50]]) {
    P.px(x, y, L.gold); P.px(x - 1, y, L.goldD); P.px(x + 1, y, L.goldD); P.px(x, y - 1, L.goldD); P.px(x, y + 1, L.goldD);
  }
  P.rect(o + 9, 64, 3, 1, L.gold); P.px(o + 8, 63, L.gold); P.px(o + 12, 63, L.gold);
  // belt with a skull buckle
  P.rect(o + 6, 52, 30, 3, '#24123c');
  P.rect(o + 18, 51, 5, 5, '#e8e2d0');
  P.px(o + 19, 53, OUTLINE); P.px(o + 21, 53, OUTLINE); P.px(o + 20, 55, '#8a8070');

  // right hand: bony claw at the belt
  P.poly([[o + 33, 42], [o + 40, 46], [o + 38, 54], [o + 33, 50]], L.robeD);
  P.rect(o + 36, 53, 4, 3, SKIN);
  P.px(o + 36, 56, SKIN_D); P.px(o + 38, 57, SKIN_D); P.px(o + 40, 56, SKIN_D);

  // beard: long, pointed, curling at the tip
  P.poly([[o + 13, 38], [o + 29, 38], [o + 27, 50], [o + 22, 60], [o + 19, 63], [o + 17, 58], [o + 15, 49]], HAIR);
  P.px(o + 18, 63, HAIR); P.px(o + 17, 62, HAIR_D); P.px(o + 16, 61, HAIR_D);
  for (const [x0, x1] of [[o + 17, o + 19], [o + 21, o + 21], [o + 25, o + 22]]) P.line(x0, 41, x1, 57, 1, HAIR_D);
  P.line(o + 15, 38, o + 16, 47, 1, '#e8e8f4');

  // wand arm, reaching out to the left
  const handY = def.hand;
  P.poly([[o + 12, 41], [o + 2, handY + 1], [o, handY + 5], [o + 12, 49]], L.robe);
  P.poly([[o + 12, 41], [o + 2, handY + 1], [o + 1, handY + 3], [o + 12, 44]], L.robeL);
  P.rect(o - 1, handY + 1, 3, 5, L.gold);
  P.rect(o - 4, handY + 1, 4, 4, SKIN);
  P.px(o - 5, handY + 1, SKIN_D); P.px(o - 5, handY + 3, SKIN_D); P.px(o - 4, handY + 5, SKIN_D);
  // the wand: gnarled wood with a pale tip
  const [tipX, tipY] = def.tip;
  P.line(o - 3, handY + 2, tipX + 1, tipY + 1, 1, '#5a3a22');
  P.line(o - 2, handY + 2, tipX + 2, tipY + 1, 1, '#3a2414');
  P.rect(tipX, tipY - 1, 2, 2, '#f8e0ff');

  // face under the brim, in the shadow of the hat
  P.rect(o + 13, 27, 17, 12, SKIN);
  P.rect(o + 13, 27, 17, 3, SKIN_DD);
  P.rect(o + 13, 30, 17, 1, SKIN_D);
  P.rect(o + 28, 30, 2, 9, SKIN_D);
  // hollow cheeks
  P.line(o + 14, 36, o + 15, 39, 1, SKIN_D);
  P.line(o + 28, 35, o + 27, 39, 1, SKIN_DD);
  // wild hair sticking out on both sides
  P.poly([[o + 9, 26], [o + 14, 27], [o + 13, 36], [o + 10, 33], [o + 8, 35], [o + 9, 30]], HAIR);
  P.poly([[o + 29, 27], [o + 35, 26], [o + 36, 31], [o + 33, 35], [o + 30, 34]], HAIR_D);
  // glowing eyes in dark sockets (squinting while laughing)
  for (const ex of [o + 14, o + 23]) {
    P.rect(ex, 31, 5, 4, '#1a0812');
    if (def.eyes === 'squint') {
      P.rect(ex + 1, 33, 3, 1, '#ff3a1a');
    } else if (def.eyes === 'dizzy') {
      P.px(ex + 1, 32, '#ffffff'); P.px(ex + 3, 32, '#ffffff'); P.px(ex + 2, 33, '#ffffff');
      P.px(ex + 1, 34, '#ffffff'); P.px(ex + 3, 34, '#ffffff');
    } else if (def.eyes === 'blaze') {
      P.rect(ex + 1, 32, 3, 2, '#ffe14a');
      P.px(ex + 2, 32, '#ffffff');
      P.px(ex, 31, '#ff3a1a'); P.px(ex + 4, 31, '#ff3a1a');
    } else {
      P.rect(ex + 1, 32, 3, 2, '#ff3a1a');
      P.px(ex + 2, 32, '#ffe14a');
      P.px(ex + 2, 33, '#ff9a1a');
    }
  }
  // thick brows in a furious V down to the nose
  P.line(o + 12, 29, o + 20, 32, 1, '#101018');
  P.line(o + 12, 30, o + 20, 33, 1, '#101018');
  P.line(o + 22, 33, o + 30, 29, 1, '#101018');
  P.line(o + 22, 32, o + 30, 28, 1, '#101018');
  P.px(o + 12, 28, HAIR_D); P.px(o + 30, 27, HAIR_D);
  // long hooked nose, pointing left and down over the moustache
  P.poly([[o + 20, 32], [o + 23, 32], [o + 23, 36], [o + 19, 40], [o + 14, 41], [o + 13, 40], [o + 17, 38], [o + 19, 36]], SKIN);
  P.line(o + 23, 33, o + 21, 38, 1, SKIN_D);
  P.line(o + 19, 40, o + 15, 41, 1, SKIN_DD);
  P.px(o + 13, 41, SKIN_D);
  // warts
  P.px(o + 17, 39, '#5a6a2a');
  P.px(o + 27, 37, '#5a6a2a'); P.px(o + 27, 38, '#7a8a4a');
  // thin drooping moustache, then the grin: a crooked sneer, or wide open when laughing
  P.line(o + 18, 41, o + 14, 44, 1, HAIR_D);
  P.line(o + 23, 40, o + 28, 43, 1, HAIR_D);
  if (def.mouth === 'wavy') {
    P.poly([[o + 17, 42], [o + 26, 41], [o + 25, 46], [o + 18, 46]], '#2a0810');
    for (let x = o + 18; x < o + 25; x++) P.px(x, 43 + (x % 2), '#f0ead0');
  } else if (def.mouth === 'open') {
    P.poly([[o + 15, 42], [o + 28, 41], [o + 26, 47], [o + 18, 47]], '#2a0810');
    P.rect(o + 17, 42, 10, 1, '#f0ead0');
    P.px(o + 18, 43, '#f0ead0'); P.px(o + 25, 43, '#f0ead0');
    P.rect(o + 20, 45, 4, 2, '#b0303a');
  } else {
    P.poly([[o + 16, 43], [o + 28, 40], [o + 27, 43], [o + 18, 45]], '#2a0810');
    P.rect(o + 18, 43, 8, 1, '#f0ead0');
    P.px(o + 26, 42, '#f0ead0');
    // two pointy fangs
    P.px(o + 19, 44, '#f0ead0'); P.px(o + 25, 43, '#f0ead0');
  }

  // hat: tall and crooked, tip bending back over the shoulder
  P.poly([[o + 8, 25], [o + 36, 25], [o + 27, 6], [o + 20, 9]], L.hat);
  P.poly([[o + 20, 9], [o + 27, 6], [o + 33, 1], [o + 40, 0], [o + 43, 3], [o + 38, 3], [o + 33, 6], [o + 29, 10]], L.hat);
  P.poly([[o + 8, 25], [o + 13, 25], [o + 22, 9], [o + 20, 9]], L.hatL);
  P.poly([[o + 31, 25], [o + 36, 25], [o + 29, 10], [o + 28, 12]], L.brim);
  P.px(o + 43, 4, L.hat); P.px(o + 43, 5, L.hatL);
  // patch and stitches
  P.rect(o + 24, 13, 4, 4, '#4a2d7a');
  P.px(o + 23, 14, '#8a7aa8'); P.px(o + 28, 15, '#8a7aa8');
  // gold band with a buckle
  P.rect(o + 10, 20, 24, 3, L.gold);
  P.rect(o + 10, 22, 24, 1, L.goldD);
  P.rect(o + 19, 19, 6, 5, L.goldD);
  P.rect(o + 20, 20, 4, 3, L.robe);
  // stars on the hat
  P.px(o + 16, 16, L.gold); P.px(o + 30, 17, L.gold); P.px(o + 26, 9, L.gold); P.px(o + 35, 3, L.gold);
  // brim
  P.rect(o + 2, 25, 40, 3, L.brim);
  P.rect(o + 2, 25, 40, 1, L.hatL);
  P.px(o + 1, 26, L.brim); P.px(o + 42, 26, L.brim);
}

// Dark outline around everything that was drawn – a comic look.
function outline(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  const add = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) add.push([x, y]);
    }
  }
  ctx.fillStyle = OUTLINE;
  for (const [x, y] of add) ctx.fillRect(x, y, 1, 1);
}

// A gnarled dead branch reaching in from the right edge (the cage hangs from it).
function drawBranch(P) {
  const bark = '#1e1626', barkL = '#3a2e44';
  P.poly([[60, 4], [60, 13], [34, 11], [14, 9], [0, 7], [0, 5], [16, 6], [36, 7]], bark);
  P.line(1, 5, 34, 7, 1, barkL);
  // twigs
  P.line(22, 7, 14, 1, 1, bark);
  P.line(14, 1, 10, 0, 1, bark);
  P.line(42, 8, 38, 2, 1, bark);
  P.line(6, 7, 1, 11, 1, bark);
  P.line(48, 11, 46, 14, 1, bark);
  P.px(30, 10, '#4a5a2a'); P.px(31, 10, '#4a5a2a');
}

// The big wizard in the fight uses the same art; his hat falls off when he loses.
export function makeTitle(scene) {
  canvasTex(scene, 'title_branch', 60, 15, (P, ctx) => { drawBranch(P); outline(ctx, 60, 15); });
  for (const pose of Object.keys(POSES)) {
    canvasTex(scene, `wiz_title_${pose}`, TITLE_WIZ.w, TITLE_WIZ.h, (P, ctx) => {
      drawTitleWizard(P, pose);
      outline(ctx, TITLE_WIZ.w, TITLE_WIZ.h);
    });
  }
  const idle = scene.textures.get('wiz_title_idle').getSourceImage();
  canvasTex(scene, 'wiz_title_hat', 46, 28, (P, ctx) => ctx.drawImage(idle, 9, 0, 46, 28, 0, 0, 46, 28));
}
