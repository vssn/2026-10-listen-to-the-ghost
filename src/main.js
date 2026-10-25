import Phaser from 'phaser';
import { W, H } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { BossScene } from './scenes/BossScene.js';
import { UIScene } from './scenes/UIScene.js';

async function loadFonts() {
  if (!document.fonts) return;
  const timeout = new Promise((r) => setTimeout(r, 2500));
  await Promise.race([
    Promise.all([
      document.fonts.load('8px "Press Start 2P"'),
      document.fonts.load('32px Creepster'),
    ]).catch(() => {}),
    timeout,
  ]);
}

loadFonts().then(() => {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#07050f',
    pixelArt: true,
    roundPixels: true,
    // HTML overlay for text that must stay smooth (the wobbling title)
    dom: { createContainer: true },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, TitleScene, WorldScene, BossScene, UIScene],
  });
  window.__game = game;
  // The parent can report a zero size while the page is still hidden.
  const refresh = () => game.scale.refresh();
  setTimeout(refresh, 300);
  document.addEventListener('visibilitychange', refresh);
});
