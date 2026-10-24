// Native pixel resolution – the canvas is scaled up crisply to fit the window.
export const W = 426;
export const H = 240;

// The world is taller than the screen: the camera follows the ghost up over
// the roofs and down into the cellars.
export const GROUND_Y = 330;
export const WORLD_W = 4600;
export const WORLD_H = 442;

export const CASTLE_END = 760;
export const FOREST_END = 1700;

// 4-storey townhouses
export const STOREY_H = 56;
export const STOREYS = 4;
export const HOUSE_W = 150;
export const HOUSE_H = STOREY_H * STOREYS;
export const HOUSE_COUNT = 12;
export const HOUSE_X0 = 1770;
export const HOUSE_STEP = 230;
export const houseX = (i) => HOUSE_X0 + i * HOUSE_STEP;

// Cellars lie below the street, reached through an outside stair shaft.
export const CELLAR_TOP = GROUND_Y + 42;
export const CELLAR_H = 60;
export const SHAFT_W = 28;

// Background art was drawn for a ground line at this height inside its texture.
export const LAYER_BASE = 322;

// Boss room
export const FLOOR = 222;
export const CEIL = 16;

export const FONT = '"Press Start 2P", monospace';
export const TITLE_FONT = 'Creepster, "Press Start 2P", fantasy';

export const DEPTH = {
  sky: 0, moon: 1, far: 2, mid: 3, castle: 5, backTrees: 6, earth: 7,
  interior: 8, spot: 9, resident: 10, facade: 11, ground: 12, shaft: 12.5,
  props: 13, cars: 14, glow: 19, ghost: 20, fx: 21, fgTrees: 22, fog: 23, text: 30,
};
