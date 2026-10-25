// Native pixel resolution – the canvas is scaled up crisply to fit the window.
export const W = 426;
export const H = 240;

// The world is taller than the screen: the camera follows the ghost up over
// the roofs and down into the cellars.
export const GROUND_Y = 330;
export const WORLD_W = 4920;
export const WORLD_H = 460;

export const CASTLE_END = 760;
export const FOREST_END = 1700;

// 4-storey townhouses
export const STOREY_H = 56;
export const STOREYS = 4;
export const HOUSE_W = 150;
export const HOUSE_H = STOREY_H * STOREYS;
export const HOUSE_COUNT = 12;
export const HOUSE_X0 = 1770;
export const LOT_GAP = 80;

// The inn (Gasthaus) is a wider building in the middle of the street.
export const INN_LOT = 5;
export const INN_W = 230;

// Building plots along the street, left to right: 12 houses plus the inn.
export const LOTS = (() => {
  const lots = [];
  let x = HOUSE_X0;
  let house = 0;
  for (let lot = 0; lot <= HOUSE_COUNT; lot++) {
    const inn = lot === INN_LOT;
    const w = inn ? INN_W : HOUSE_W;
    lots.push({ x, w, inn, house: inn ? null : house++ });
    x += w + LOT_GAP;
  }
  return lots;
})();
export const houseX = (i) => LOTS.find((l) => l.house === i).x;

// Cellars lie below the street, reached through an outside stair shaft.
export const CELLAR_TOP = GROUND_Y + 42;
export const CELLAR_H = 60;
export const SHAFT_W = 28;

// Metro station under houses 2–4 (they have no cellars); entrance in the gap
// between house 2 and 3.
export const METRO_HOUSES = [2, 3, 4];
export const METRO_TOP = CELLAR_TOP;
export const METRO_FLOOR = GROUND_Y + 118;

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
