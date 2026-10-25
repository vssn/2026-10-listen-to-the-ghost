import { makeForestSign } from './env.js';
import { makeInnFacade } from './inn.js';

// Textures with words painted into them. They are built at boot and rebuilt
// when the language is switched on the title screen.
export function makeLocalizedTextures(scene) {
  makeForestSign(scene);
  makeInnFacade(scene);
}
