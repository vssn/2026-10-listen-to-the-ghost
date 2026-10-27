import { canvasTex, rng } from '../gfx.js';
import { t } from '../i18n.js';
import { drawText, textWidth } from './inn.js';

// The Halloween fair in the forest (scare race only): a spooky Ferris wheel,
// a big carousel with a skeleton reaper on its roof, food and drink stands,
// trestle tables.

// Ferris wheel: pre-rendered rotation steps (8 spokes, so 45° repeat) keep the
// pixels crisp instead of rotating one sprite.
export const WHEEL = { size: 124, r: 54, frames: 24, gondolas: 8, standH: 72 };
export const WHEEL_STEP = (Math.PI / 4) / WHEEL.frames;
// Gondola: hangs from its top centre; the rider's head shows in the window
// rows 6..10, the front panel (rows 11..16) hides the rest.
export const GONDOLA = { w: 16, h: 17, riderTop: 5, cover: 17 };
// Carousel parts and where things sit, relative to its centre on the ground.
export const CAROUSEL = {
  w: 108, roofY: -80, roofH: 40, coreH: 44, baseH: 12, rx: 40, horseY: -24, poleTop: -46, poleBottom: -8,
};

const IRON = '#3d2c52', IRON_L = '#5e4880', IRON_D = '#24182f';
const ORANGE = '#e8741c', ORANGE_L = '#ffb347', BLACK = '#1e1428', PURPLE = '#7a3fb0', PURPLE_L = '#c97bff';
const GOLD = '#d9b13b', GOLD_D = '#8a6f22';
const WOOD = '#6b4226', WOOD_L = '#8a5a34', WOOD_D = '#3e2614';

function ring(P, cx, cy, r, c) {
  const n = Math.ceil(r * 8);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    P.px(cx + Math.cos(a) * r, cy + Math.sin(a) * r, c);
  }
}

function drawWheel(P, rot) {
  const c = WHEEL.size / 2, R = WHEEL.r, inner = 34;
  for (let k = 0; k < 8; k++) {
    const a = rot + (k * Math.PI) / 4;
    const b = a + Math.PI / 4;
    // zig-zag bracing between the inner ring and the rim
    P.line(c + Math.cos(a) * inner, c + Math.sin(a) * inner, c + Math.cos(b) * R, c + Math.sin(b) * R, 1, IRON_D);
    P.line(c, c, c + Math.cos(a) * R, c + Math.sin(a) * R, 1, IRON);
  }
  ring(P, c, c, R, IRON_L);
  ring(P, c, c, R - 1, IRON);
  ring(P, c, c, inner, IRON);
  ring(P, c, c, 12, IRON_L);
  // light bulbs around the rim, orange and purple
  for (let k = 0; k < 16; k++) {
    const a = rot + (k * Math.PI) / 8 + Math.PI / 16;
    const x = c + Math.cos(a) * R, y = c + Math.sin(a) * R;
    P.rect(x - 1, y - 1, 2, 2, k % 2 ? ORANGE_L : PURPLE_L);
  }
}

// The A-frame the wheel turns on; the hub sits at (62, 4).
function drawWheelStand(P) {
  const w = WHEEL.size, h = WHEEL.standH, c = w / 2;
  // back legs (darker), then front legs
  P.line(c, 4, 22, h - 1, 2, IRON_D);
  P.line(c, 4, w - 22, h - 1, 2, IRON_D);
  P.line(c, 4, 8, h - 1, 3, IRON);
  P.line(c, 4, w - 8, h - 1, 3, IRON);
  P.line(c - 1, 4, 8, h - 1, 1, IRON_L);
  // cross bars
  for (const y of [34, 56]) {
    const f = (y - 4) / (h - 5);
    P.line(c - (c - 8) * f, y, c + (c - 8) * f, y, 1, IRON);
  }
  P.rect(0, h - 3, w, 3, WOOD_D);
  P.rect(0, h - 3, w, 1, WOOD);
}

// Jack-o'-lantern hub in the middle of the wheel (does not turn).
function drawHub(P) {
  P.circle(8, 8, 7, ORANGE);
  P.circle(7, 7, 4, '#f08a2c');
  P.rect(7, 0, 2, 2, '#3c6a2a');
  P.poly([[3, 6], [6, 6], [4.5, 3.5]], '#ffe14a');
  P.poly([[10, 6], [13, 6], [11.5, 3.5]], '#ffe14a');
  P.rect(4, 10, 8, 2, '#ffe14a');
  P.px(5, 10, ORANGE); P.px(8, 11, ORANGE); P.px(10, 10, ORANGE);
}

function drawGondola(P) {
  const { w } = GONDOLA;
  // hanger
  P.rect(7, 0, 2, 3, IRON_D);
  // roof: purple dome with orange trim
  P.rect(2, 3, w - 4, 2, PURPLE);
  P.rect(1, 5, w - 2, 1, ORANGE);
  P.px(2, 3, IRON_D); P.px(w - 3, 3, IRON_D);
  // corner posts
  P.rect(1, 6, 1, 5, IRON);
  P.rect(w - 2, 6, 1, 5, IRON);
  // front panel with a bat
  P.rect(0, 11, w, 6, ORANGE);
  P.rect(0, 11, w, 1, ORANGE_L);
  P.rect(0, 16, w, 1, '#a04a10');
  P.poly([[4, 13], [8, 12.5], [12, 13], [10, 14], [8, 15], [6, 14]], BLACK);
  P.px(5, 12, BLACK); P.px(10, 12, BLACK);
}

function drawGondolaBack(P) {
  P.rect(1, 6, GONDOLA.w - 2, 11, '#1a1022');
}

function drawCarouselRoof(P) {
  const { w } = CAROUSEL;
  const base = 28, c = w / 2;
  // striped cone: wedges from the spire to the rim
  const n = 9;
  for (let k = 0; k < n; k++) {
    const x0 = (k / n) * w, x1 = ((k + 1) / n) * w;
    P.poly([[c, 4], [x0, base], [x1, base]], k % 2 ? BLACK : ORANGE);
  }
  // highlight along the left slope
  P.line(c, 4, 2, base, 1, ORANGE_L);
  // scalloped valance with bulbs
  P.rect(0, base, w, 3, PURPLE);
  for (let x = 0; x < w; x += 8) {
    const col = (x / 8) % 2 ? ORANGE : PURPLE;
    P.ellipse(x + 4, base + 3, 4, 3, col);
    P.rect(x + 3, base + 1, 2, 2, (x / 8) % 2 ? PURPLE_L : '#ffe9a8');
  }
  P.rect(0, base + 6, w, 1, BLACK);
  // gold spire
  P.rect(c - 1, 0, 2, 5, GOLD);
  P.px(c, 0, '#fff2a8');
}

function drawCarouselCore(P) {
  const w = 22, h = CAROUSEL.coreH;
  P.rect(0, 0, w, h, '#2a1638');
  P.rect(0, 0, w, 2, GOLD);
  P.rect(0, h - 2, w, 2, GOLD);
  // mirror panels with a moon and stars
  for (const x of [2, 12]) {
    P.rect(x, 5, 8, h - 10, '#4a3a6a');
    P.rect(x, 5, 1, h - 10, '#7a6aa0');
  }
  P.circle(6, 12, 2, '#fff2c0');
  P.px(15, 10, '#fff2c0'); P.px(17, 18, '#fff2c0'); P.px(5, 24, '#fff2c0');
  for (let y = 4; y < h - 4; y += 6) { P.px(1, y, '#ffe9a8'); P.px(w - 2, y, '#ffe9a8'); }
}

function drawCarouselBase(P) {
  const w = 112, h = CAROUSEL.baseH, c = w / 2;
  P.ellipse(c, 5, c - 1, 4, WOOD_L);
  P.rect(1, 5, w - 2, h - 5, '#7a2a1a');
  P.rect(1, 5, w - 2, 1, '#a04030');
  for (let x = 4; x < w - 3; x += 6) P.px(x, 8, GOLD);
  P.rect(1, h - 1, w - 2, 1, '#3a1208');
}

// A black nightmare horse with a purple saddle, galloping to the right.
function drawHorse(P) {
  const body = '#1a1420', hi = '#3a3046';
  // tail
  P.line(3, 5, 0, 9, 1, ORANGE);
  P.line(2, 5, 0, 7, 1, ORANGE);
  // body
  P.ellipse(8, 7, 5, 3, body);
  P.rect(5, 5, 6, 1, hi);
  // neck and head
  P.poly([[11, 6], [13, 2], [16, 1], [17, 3], [15, 4], [13, 8]], body);
  P.px(15, 2, '#ff6a1a');
  // orange mane
  P.line(12, 2, 11, 5, 1, ORANGE);
  // legs: galloping
  P.line(5, 9, 3, 12, 1, body);
  P.line(7, 9, 7, 12, 1, body);
  P.line(10, 9, 13, 11, 1, body);
  P.line(11, 9, 14, 12, 1, body);
  // saddle
  P.rect(6, 3, 5, 2, PURPLE);
  P.px(8, 3, GOLD);
}

// Skeleton with a scythe, standing guard on the carousel roof.
function drawSkeleton(P) {
  const bone = '#e8e2d0', boneD = '#a8a290';
  // scythe: staff and curved blade over the head
  P.line(16, 3, 16, 29, 1, WOOD);
  P.line(16, 3, 11, 1, 1, '#c8ccd8');
  P.line(11, 1, 5, 2, 1, '#c8ccd8');
  P.line(5, 2, 2, 5, 1, '#c8ccd8');
  P.line(15, 4, 9, 3, 1, '#8a8ea0');
  // skull
  P.circle(8, 7, 3, bone);
  P.rect(6, 9, 5, 2, bone);
  P.px(7, 7, BLACK); P.px(9, 7, BLACK); P.px(7, 6, BLACK); P.px(9, 6, BLACK);
  P.px(8, 9, boneD); P.px(7, 10, BLACK); P.px(9, 10, BLACK);
  // spine and ribs
  P.rect(8, 11, 1, 9, bone);
  for (const y of [12, 14, 16]) P.rect(6, y, 5, 1, bone);
  // arms: one holds the scythe
  P.line(6, 12, 4, 17, 1, bone);
  P.line(10, 12, 15, 14, 1, bone);
  P.px(15, 13, bone);
  // pelvis and legs
  P.rect(6, 20, 5, 2, bone);
  P.line(6, 22, 5, 29, 1, bone);
  P.line(10, 22, 11, 29, 1, bone);
  P.px(4, 29, bone); P.px(12, 29, bone);
}

// Striped awning over a stand (the stand is w wide).
function awning(P, w, a, b) {
  for (let x = 0; x < w; x += 6) P.rect(x, 0, Math.min(6, w - x), 7, (x / 6) % 2 ? b : a);
  for (let x = 0; x < w; x += 6) P.ellipse(x + 3, 7, 3, 2, (x / 6) % 2 ? b : a);
  P.rect(0, 0, w, 1, '#ffffff33');
}

function drawFoodStand(P) {
  const w = 40, h = 36;
  const R = rng(51);
  // posts and dark back wall
  P.rect(1, 6, 2, h - 6, WOOD_D);
  P.rect(w - 3, 6, 2, h - 6, WOOD_D);
  P.rect(3, 9, w - 6, 12, '#24161c');
  // hanging sausages and a lantern
  for (let x = 6; x < 22; x += 3) P.rect(x, 10, 1, 4, '#b0503a');
  P.rect(29, 10, 1, 2, IRON_D);
  P.rect(28, 12, 3, 4, '#ffd27a');
  awning(P, w, ORANGE, BLACK);
  // counter with planks
  P.rect(0, 21, w, h - 21, WOOD);
  for (let y = 24; y < h; y += 4) P.rect(0, y, w, 1, WOOD_D);
  P.rect(0, 20, w, 2, WOOD_L);
  // goods: pumpkin pies and candy apples on sticks
  for (const x of [5, 13]) { P.ellipse(x + 2, 18, 3, 2, '#d0701c'); P.rect(x, 17, 4, 1, '#f0a050'); }
  for (const x of [24, 28, 32]) { P.rect(x, 15, 1, 3, '#e8d8b0'); P.circle(x, 17, 1, '#c01828'); }
  // a crooked sign plank with a skull
  P.rect(13, 27, 14, 6, '#e8d8b0');
  P.circle(20, 30, 1, BLACK);
  for (let i = 0; i < 6; i++) P.px(2 + R() * (w - 4), 23 + R() * 12, WOOD_L);
}

function drawDrinkStand(P) {
  const w = 36, h = 36;
  P.rect(1, 6, 2, h - 6, WOOD_D);
  P.rect(w - 3, 6, 2, h - 6, WOOD_D);
  P.rect(3, 9, w - 6, 12, '#16202a');
  // bottles on a shelf
  for (let x = 6; x < 30; x += 4) { P.rect(x, 11, 2, 4, x % 8 ? '#6aff8a' : '#ff6aa0'); P.px(x, 10, '#e8e2d0'); }
  P.rect(4, 15, w - 8, 1, WOOD);
  awning(P, w, PURPLE, '#3c8a3a');
  // counter
  P.rect(0, 21, w, h - 21, '#4a3a5a');
  P.rect(0, 20, w, 2, '#6a5a7a');
  for (let x = 4; x < w; x += 8) P.rect(x, 23, 1, h - 23, '#2e2440');
  // cauldron of green punch and cups
  P.ellipse(10, 18, 5, 3, '#1a1a1a');
  P.ellipse(10, 16, 4, 1, '#6aff6a');
  P.px(8, 15, '#bfffbf'); P.px(12, 14, '#bfffbf');
  for (const x of [20, 24, 28]) { P.rect(x, 17, 3, 3, '#e8e2d0'); P.px(x + 1, 17, '#6aff6a'); }
  // barrel at the front
  P.rect(25, 27, 9, 9, WOOD_L);
  P.rect(25, 29, 9, 1, IRON_D);
  P.rect(25, 33, 9, 1, IRON_D);
}

// Trestle table with benches and a little pumpkin candle.
function drawTable(P) {
  const w = 32;
  P.rect(0, 9, w, 2, WOOD_L);
  P.rect(2, 11, 2, 3, WOOD_D); P.rect(w - 4, 11, 2, 3, WOOD_D);
  P.rect(0, 4, w, 2, WOOD_L);
  P.rect(0, 6, w, 1, WOOD_D);
  P.rect(4, 7, 2, 7, WOOD_D); P.rect(w - 6, 7, 2, 7, WOOD_D);
  P.ellipse(16, 2, 3, 2, ORANGE);
  P.px(15, 2, '#ffe14a'); P.px(17, 2, '#ffe14a');
  P.px(16, 0, '#3c6a2a');
}

// Sign at the entrance – its words are localized.
export function makeFairSign(scene) {
  const label = t('sign.fair');
  const tw = textWidth(label);
  const w = tw + 12, h = 34;
  canvasTex(scene, 'fair_sign', w, h, (P) => {
    P.rect(3, 6, 2, h - 6, WOOD_D);
    P.rect(w - 5, 6, 2, h - 6, WOOD_D);
    P.rect(0, 0, w, 13, BLACK);
    P.rect(1, 1, w - 2, 11, PURPLE);
    for (let x = 1; x < w - 1; x += 3) { P.px(x, 0, x % 2 ? ORANGE_L : PURPLE_L); P.px(x, 12, x % 2 ? PURPLE_L : ORANGE_L); }
    drawText(P, label, 6, 4, '#ffe9a8');
  });
}

export function makeFair(scene) {
  for (let f = 0; f < WHEEL.frames; f++) {
    canvasTex(scene, `fair_wheel_${f}`, WHEEL.size, WHEEL.size, (P) => drawWheel(P, f * WHEEL_STEP));
  }
  canvasTex(scene, 'fair_wheel_stand', WHEEL.size, WHEEL.standH, drawWheelStand);
  canvasTex(scene, 'fair_hub', 16, 16, drawHub);
  canvasTex(scene, 'fair_gondola', GONDOLA.w, GONDOLA.h, drawGondola);
  canvasTex(scene, 'fair_gondola_back', GONDOLA.w, GONDOLA.h, drawGondolaBack);
  canvasTex(scene, 'fair_carousel_roof', CAROUSEL.w, CAROUSEL.roofH, drawCarouselRoof);
  canvasTex(scene, 'fair_carousel_core', 22, CAROUSEL.coreH, drawCarouselCore);
  canvasTex(scene, 'fair_carousel_base', 112, CAROUSEL.baseH, drawCarouselBase);
  canvasTex(scene, 'fair_horse', 18, 13, drawHorse);
  canvasTex(scene, 'fair_skeleton', 18, 30, drawSkeleton);
  canvasTex(scene, 'foodstand', 40, 36, drawFoodStand);
  canvasTex(scene, 'drinkstand', 36, 36, drawDrinkStand);
  canvasTex(scene, 'fairtable', 32, 14, drawTable);
  makeFairSign(scene);
}
