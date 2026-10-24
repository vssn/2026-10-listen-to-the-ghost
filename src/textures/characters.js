import { pixelTex, canvasTex } from '../gfx.js';

// ---------------- Ghost (modelled after the reference picture) ----------------
const GHOST_ROWS = [
  '..................GG..',
  '................gH..G.',
  '...............gHG..G.',
  '..............gHHG....',
  '.............gHHHG....',
  '............gHHHHG....',
  '...........gHHHHHG....',
  '..........gHHHHHHG....',
  '.........gHHHHHHHG....',
  '....gHHHHHHHHHHHHHHG..',
  '.....oGGGGGGGGGGGo....',
  '.....oWWWWWWWWWWWo....',
  '....oWWWWWWWWWWWWWo...',
  '....oWWeeWWWWWeeWWo...',
  '....oWeEheWWWeEheWo...',
  '.S..oWeEEeWWWeEEeWo...',
  '..S.oWWeeWWWWWeeWWo...',
  '...SoWWWWWWWWWWWWWo...',
  '..wwoWWWWmWWWmWWWWow..',
  '..oooWWWWWmmmWWWWWoo..',
  '....owWWWWWWWWWWWwo...',
  '...owWWWWWWWWWWWWWwo..',
  '...owwWWWWWWWWWWWwwo..',
  '...owwwWWWWWWWWWwwwo..',
  '...owwwwwwwwwwwwwwwo..',
];
const HEM_A = '....oo..ooo..ooo..oo..';
const HEM_B = '...ooo..ooo..ooo..o...';

const GHOST_PAL = {
  W: '#fff4dc', w: '#ffd9a6', o: '#f2a046', E: '#ff8c1a', e: '#b84a08', h: '#fffbe8',
  m: '#7a2a05', H: '#6f6a80', G: '#47424f', g: '#9a94ab', S: '#7a4b22',
  k: '#2a0a00', r: '#d2504a',
};

// Face variants: replace some rows of GHOST_ROWS.
const withRows = (rows, changes) => rows.map((r, i) => changes[i] ?? r);
const FACES = {
  // talking: small open mouth with tongue
  t: withRows(GHOST_ROWS, {
    18: '..wwoWWWWWmmmWWWWWow..',
    19: '..oooWWWWWmrmWWWWWoo..',
  }),
  // BUH!: slightly bigger eyes and a wide open mouth
  b: withRows(GHOST_ROWS, {
    12: '....oWeeeWWWWWeeeWo...',
    13: '....oeEhEeWWWeEhEeo...',
    14: '....oeEEEeWWWeEEEeo...',
    15: '.S..oeEEEeWWWeEEEeo...',
    16: '..S.oWeeeWWWWWeeeWo...',
    18: '..wwoWWWWmmmmmWWWWow..',
    19: '..oooWWWWmkkkmWWWWoo..',
    20: '....owWWWmkrkmWWWwo...',
    21: '...owWWWWWmmmWWWWWwo..',
  }),
};

// Wand tip relative to sprite centre (texture faces right / un-flipped).
export const GHOST_WAND = { x: -11, y: 1 };

const FRIEND_TOP = ['.......oWWWWWWWo......', '.....oWWWWWWWWWWWo....'];

function makeGhost(scene) {
  pixelTex(scene, 'ghost0', [...GHOST_ROWS, HEM_A], GHOST_PAL);
  pixelTex(scene, 'ghost1', [...GHOST_ROWS, HEM_B], GHOST_PAL);
  for (const [face, rows] of Object.entries(FACES)) {
    pixelTex(scene, `ghost_${face}0`, [...rows, HEM_A], GHOST_PAL);
    pixelTex(scene, `ghost_${face}1`, [...rows, HEM_B], GHOST_PAL);
  }
  const body = GHOST_ROWS.slice(12).map((r) => r.replace(/S/g, '.'));
  pixelTex(scene, 'friend0', [...FRIEND_TOP, ...body, HEM_A], GHOST_PAL);
  pixelTex(scene, 'friend1', [...FRIEND_TOP, ...body, HEM_B], GHOST_PAL);
}

// ---------------- Bat ----------------
function makeBat(scene) {
  const pal = { K: '#1a1020', r: '#ff4040' };
  pixelTex(scene, 'bat0', [
    'KK.........KK',
    '.KKK.K.K.KKK.',
    '..KKKKKKKKK..',
    '....KrKrK....',
    '.....KKK.....',
  ], pal);
  pixelTex(scene, 'bat1', [
    '.....K.K.....',
    '....KKKKK....',
    '..KKKrKrKKK..',
    '.KKK.KKK.KKK.',
    'KK.........KK',
  ], pal);
}

// ---------------- Residents ----------------
const P_TOP = [
  '...hhhh...',
  '..hhhhhh..',
  '..hssssh..',
  '..skssks..',
  '..ssssss..',
  '...smms...',
  '....ss....',
  '..cccccc..',
  '.cccccccc.',
  '.cccccccc.',
  '.cccccccc.',
  '.s.cccc.s.',
  '...pppp...',
];
const LEGS_A = ['..pp..pp..', '..pp..pp..', '..pp..pp..', '.bbb..bbb.'];
const LEGS_B = ['...pppp...', '...pppp...', '....pp....', '...bbbb...'];
const P_SCARED = [
  '.h.h..h.h.',
  '..hhhhhh..',
  's.hssssh.s',
  's.skssks.s',
  'c.ssssss.c',
  'c..skks..c',
  '.c..ss..c.',
  '..cccccc..',
  '..cccccc..',
  '..cccccc..',
  '..cccccc..',
  '..cccccc..',
  '...pppp...',
  '..pp..pp..',
  '..pp..pp..',
  '..pp..pp..',
  '.bbb..bbb.',
];

export const PEOPLE = {
  dad: { h: '#3b2a1a', s: '#f1c27d', c: '#3a5f8a', p: '#2e2e3a', b: '#111111' },
  mom: { h: '#c0392b', s: '#f5d0a9', c: '#d35d8c', p: '#b24a76', b: '#5a1e2e' },
  kid: { h: '#e3c16f', s: '#f1c27d', c: '#6aa84f', p: '#5a9442', b: '#f0f0f0' },
  grandpa: { h: '#dddddd', s: '#e0b48c', c: '#7a5c3e', p: '#444444', b: '#222222' },
  teen: { h: '#151515', s: '#8d5524', c: '#f1c232', p: '#1f3b73', b: '#dddddd' },
  granny: { h: '#b9b9d0', s: '#f0c8a0', c: '#6a4c93', p: '#6a4c93', b: '#2a2a2a' },
};

function makePeople(scene) {
  for (const [name, colors] of Object.entries(PEOPLE)) {
    const pal = { ...colors, k: '#1a1a1a', m: '#a83a3a' };
    pixelTex(scene, `p_${name}_0`, [...P_TOP, ...LEGS_A], pal);
    pixelTex(scene, `p_${name}_1`, [...P_TOP, ...LEGS_B], pal);
    pixelTex(scene, `p_${name}_s`, P_SCARED, { ...pal, k: '#1a1a1a' });
  }
}

// ---------------- Wizard ----------------
function drawWizard(P, pose) {
  const robe = '#3b1f63', robeD = '#2a1548', robeL = '#57328f';
  const hat = '#3d2466', gold = '#d9b13b', skin = '#d9b38c';
  // back arm
  P.poly([[9, 25], [5, 31], [6, 36], [10, 33]], robeD);
  P.rect(5, 35, 3, 3, skin);
  // robe
  P.poly([[9, 24], [23, 24], [28, 48], [4, 48]], robe);
  P.poly([[9, 24], [11, 24], [7, 48], [4, 48]], robeL);
  for (const x of [12, 17, 22]) P.line(x, 30, x + (x - 16) * 0.3, 47, 1, robeD);
  for (const [x, y] of [[8, 42], [14, 44], [20, 40], [24, 45], [11, 36], [22, 33]]) {
    P.px(x, y, gold); P.px(x - 1, y, '#8a6f22'); P.px(x + 1, y, '#8a6f22'); P.px(x, y - 1, '#8a6f22'); P.px(x, y + 1, '#8a6f22');
  }
  P.rect(5, 46, 23, 2, robeD);
  // hat
  P.poly([[9, 17], [24, 17], [17, 2]], hat);
  P.poly([[15, 5], [18, 2], [24, 0], [28, 2], [25, 3], [21, 3], [18, 6]], hat);
  P.poly([[9, 17], [12, 17], [17, 2], [16, 3]], '#55348a');
  P.rect(10, 13, 13, 2, gold);
  P.px(15, 8, gold); P.px(19, 11, gold); P.px(17, 5, gold);
  P.rect(4, 17, 25, 2, '#2c1a4d');
  // face
  P.rect(11, 19, 11, 6, skin);
  P.rect(11, 19, 11, 1, '#9a7552');
  if (pose === 'hurt') {
    for (const ex of [13, 18]) { P.px(ex, 20, '#fff'); P.px(ex + 1, 21, '#fff'); P.px(ex + 1, 20, '#fff'); P.px(ex, 21, '#fff'); }
  } else {
    P.rect(13, 21, 2, 1, '#ffeb3b');
    P.rect(18, 21, 2, 1, '#ffeb3b');
    P.line(12, 20, 15, 21, 1, '#e0e0f0');
    P.line(21, 20, 18, 21, 1, '#e0e0f0');
  }
  P.rect(16, 22, 1, 2, '#b98d65');
  // beard
  P.poly([[10, 23], [23, 23], [20, 35], [16, 40], [13, 35]], '#e6e6f0');
  P.line(14, 26, 15, 36, 1, '#b8b8cc');
  P.line(19, 26, 18, 35, 1, '#b8b8cc');
  P.rect(12, 24, 9, 1, '#ffffff');
  if (pose === 'hurt') P.rect(15, 25, 3, 2, '#3a1010');
  // front arm + wand
  if (pose === 'cast') {
    P.poly([[20, 25], [24, 21], [28, 16], [31, 18], [26, 27]], robeL);
    P.rect(28, 14, 3, 3, skin);
    P.line(30, 14, 31, 7, 1, '#6a4422');
    P.px(31, 6, '#ffffff');
    P.px(30, 6, '#ff7bff'); P.px(31, 5, '#ff7bff');
  } else {
    P.poly([[21, 25], [26, 27], [27, 34], [23, 34]], robeL);
    P.rect(24, 33, 3, 3, skin);
    P.line(27, 35, 30, 40, 1, '#6a4422');
    P.px(31, 41, pose === 'hurt' ? '#6a4422' : '#ff7bff');
  }
}

// Wand tip relative to origin (0.5, 1) for the 32x48 sprite.
export const WIZ_TIP = { idle: { x: 15, y: -7 }, cast: { x: 15, y: -42 } };

function makeWizard(scene) {
  for (const pose of ['idle', 'cast', 'hurt']) {
    canvasTex(scene, `wiz_${pose}`, 32, 48, (P) => drawWizard(P, pose));
  }
  canvasTex(scene, 'wiz_hat', 26, 18, (P) => {
    P.poly([[5, 16], [20, 16], [13, 1]], '#3d2466');
    P.rect(6, 12, 13, 2, '#d9b13b');
    P.rect(0, 16, 25, 2, '#2c1a4d');
  });
}

export function makeCharacters(scene) {
  makeGhost(scene);
  makeBat(scene);
  makePeople(scene);
  makeWizard(scene);
}
