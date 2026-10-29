import Phaser from 'phaser';
import { W, H, FONT, TITLE_FONT } from '../config.js';
import { initAudio, sfx } from '../sfx.js';
import { t, getLang, setLang } from '../i18n.js';
import { makeLocalizedTextures } from '../textures/localized.js';
import { TITLE_WIZ } from '../textures/title.js';
import { RACERS, DUO_RACERS } from '../objects/Race.js';

const ADD = Phaser.BlendModes.ADD;
const GROUND = 206;
// the big wizard and the empty cage hanging from the tree beside him
const WIZ_X = 382;
const CAGE_X = 410;
const CAGE_TOP = 96;
const BRANCH_Y = 46;
// scare race preview: the racing pack, and where startled people stand
const PACK_SPEED = 96;
const MAX_PEOPLE = 5;
const PEOPLE_SLOTS = [16, 34, 54, 362, 382, 402];
const PEOPLE_KINDS = ['dad', 'mom', 'kid', 'grandpa', 'teen', 'granny'];
// The two menu levels: game mode, then (for the scare race) who races.
const MENUS = {
  main: [{ id: 'adventure', label: 'title.modeAdventure' }, { id: 'race', label: 'title.modeRace' }],
  race: [{ id: 'ai', label: 'title.vsAi' }, { id: 'duo', label: 'title.duo' }],
};

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.add.image(0, 0, 'sky').setOrigin(0);
    this.add.image(W / 2 + 120, 50, 'glow').setTint(0xfff0c0).setBlendMode(Phaser.BlendModes.ADD).setScale(2.2).setAlpha(0.35);
    this.add.image(W / 2 + 120, 50, 'moon');
    this.add.image(-120, -120, 'far').setOrigin(0);
    this.add.image(-60, -100, 'mid').setOrigin(0);
    this.add.image(-200, 0, 'castle').setOrigin(0).setAlpha(0.9).setTint(0x8a80b0);
    this.add.rectangle(0, 205, W, 40, 0x0c0816).setOrigin(0);
    this.add.image(330, 206, 'tree2').setOrigin(0.5, 1);
    this.add.image(40, 206, 'tree1').setOrigin(0.5, 1).setFlipX(true);
    this.add.image(140, 206, 'tomb_rip').setOrigin(0.5, 1);
    this.add.image(175, 206, 'gargoyle_pedestal').setOrigin(0.5, 1);
    this.add.image(286, 206, 'pumpkin').setOrigin(0.5, 1);
    this.add.image(286, 200, 'glow').setTint(0xff8a1a).setBlendMode(Phaser.BlendModes.ADD).setScale(0.5).setAlpha(0.6);

    for (let i = 0; i < 5; i++) {
      const b = this.add.sprite(Phaser.Math.Between(0, W), Phaser.Math.Between(20, 90), 'bat0').play('bat-flap');
      this.tweens.add({ targets: b, x: b.x + Phaser.Math.Between(-80, 80), y: b.y + Phaser.Math.Between(-15, 15), duration: Phaser.Math.Between(2000, 4000), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // what was chosen last time
    this.mode = this.registry.get('mode') === 'race' ? 'race' : 'adventure';
    this.raceKind = this.registry.get('raceDuo') ? 'duo' : 'ai';

    // a little scene for the highlighted game mode
    this.buildAdventurePreview();
    this.buildRacePreview();
    const ghost = this.hero;

    // every few seconds the ghost shouts BUH! with wide eyes and open mouth
    const boo = () => {
      ghost.play('ghost-boo');
      sfx.boo();
      this.tweens.add({ targets: ghost, scale: 2.2, duration: 110, yoyo: true });
      const label = this.add.text(ghost.x + 34, ghost.y - 30, t('ghost.boo'), {
        fontFamily: FONT, fontSize: '16px', color: '#ffd27a', stroke: '#3a1500', strokeThickness: 3,
      }).setOrigin(0.5).setAngle(-8).setScale(0.4);
      this.tweens.add({ targets: label, scale: 1, duration: 160, ease: 'Back.easeOut' });
      this.tweens.add({ targets: label, alpha: 0, y: label.y - 10, delay: 700, duration: 300, onComplete: () => label.destroy() });
      this.time.delayedCall(1000, () => ghost.play('ghost-float'));
    };
    this.time.addEvent({ delay: 3600, loop: true, startAt: 1800, callback: () => { if (this.mode === 'adventure') boo(); } });
    // ... and in between the wizard laughs at it
    this.time.addEvent({ delay: 3600, loop: true, callback: () => { if (this.mode === 'adventure') this.wizardLaugh(); } });

    // The title wobbles. In the 426x240 pixel canvas a rotated text jumps pixel by
    // pixel, so it is an HTML element on top instead: the browser draws it at full
    // screen resolution with smooth edges, and Phaser scales and rotates it with the game.
    const titleEl = document.createElement('div');
    titleEl.textContent = 'Listen to the Ghost';
    titleEl.style.cssText = [
      `font-family: ${TITLE_FONT}`, 'font-size: 36px', 'color: #ff9a3c', 'white-space: nowrap',
      '-webkit-text-stroke: 4px #2a0a00', 'paint-order: stroke fill', 'pointer-events: none', 'user-select: none',
    ].join(';');
    const title = this.add.dom(W / 2, 40, titleEl).setOrigin(0.5);
    this.tweens.add({ targets: title, angle: { from: -1.5, to: 1.5 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.add.text(W / 2, 68, t('title.subtitle'), {
      fontFamily: FONT, fontSize: '8px', color: '#c8b8f0', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.helpLines = [155, 166, 177].map((y) => this.add.text(W / 2, y, '', {
      fontFamily: FONT, fontSize: '8px', color: '#9a8ac0',
    }).setOrigin(0.5));

    // Two buttons: game mode first (adventure / scare race), then for the race
    // whether you race the computer or a second player.
    this.menu = 'main';
    this.buttons = [0, 1].map((i) => {
      const x = W / 2 + (i ? 58 : -58);
      const frame = this.add.rectangle(x, 202, 104, 17, 0x1a0f2a, 0.85).setStrokeStyle(1, 0x6a5a8a);
      const label = this.add.text(x, 202, '', {
        fontFamily: FONT, fontSize: '8px', stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);
      const zone = this.add.zone(x, 202, 104, 17).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => { this.select(MENUS[this.menu][i].id); this.confirm(); });
      return { frame, label, bounds: new Phaser.Geom.Rectangle(x - 52, 193, 104, 18) };
    });
    this.startText = this.add.text(W / 2, 225, '', {
      fontFamily: FONT, fontSize: '8px', color: '#ffd27a', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.tweens.add({ targets: this.startText, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
    // back to the game modes (in the race menu)
    this.backText = this.add.text(5, 5, t('title.back'), {
      fontFamily: FONT, fontSize: '8px', color: '#ffd27a', stroke: '#000', strokeThickness: 2,
    }).setInteractive({ useHandCursor: true }).setVisible(false);
    this.backText.on('pointerdown', () => this.openMenu('main'));
    this.backBounds = new Phaser.Geom.Rectangle(0, 0, 80, 18);
    this.openMenu('main', true);

    // language switch in the top-right corner: "DE / EN", the active one lit
    const current = getLang();
    const langStyle = (code) => ({
      fontFamily: FONT, fontSize: '8px', stroke: '#000', strokeThickness: 2,
      color: code === current ? '#ffd27a' : '#6a5a8a',
    });
    this.langBounds = new Phaser.Geom.Rectangle(W - 56, 0, 56, 18);
    const en = this.add.text(W - 5, 5, 'EN', langStyle('en')).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    this.add.text(W - 30, 5, '/', { fontFamily: FONT, fontSize: '8px', color: '#6a5a8a' }).setOrigin(0.5, 0);
    const de = this.add.text(W - 40, 5, 'DE', langStyle('de')).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    en.on('pointerdown', () => this.switchLang('en'));
    de.on('pointerdown', () => this.switchLang('de'));

    // The scene object is reused when returning to the title, so reset the flag.
    this.starting = false;
    this.heroBoo = boo;
    // clicks on the language switch, the back link and the buttons do their own thing;
    // anywhere else confirms the highlighted choice
    const onPointer = (p) => {
      if (Phaser.Geom.Rectangle.Contains(this.langBounds, p.x, p.y)) return;
      if (this.menu === 'race' && Phaser.Geom.Rectangle.Contains(this.backBounds, p.x, p.y)) return;
      if (this.buttons.some((b) => Phaser.Geom.Rectangle.Contains(b.bounds, p.x, p.y))) return;
      this.confirm();
    };
    const kb = this.input.keyboard;
    kb.on('keydown-SPACE', () => this.confirm());
    kb.on('keydown-ENTER', () => this.confirm());
    kb.on('keydown-ESC', () => { if (!this.starting && this.menu === 'race') this.openMenu('main'); });
    kb.on('keydown-BACKSPACE', () => { if (!this.starting && this.menu === 'race') this.openMenu('main'); });
    for (const key of ['LEFT', 'RIGHT', 'UP', 'DOWN', 'A', 'D', 'W', 'S']) {
      kb.on(`keydown-${key}`, () => {
        if (this.starting) return;
        const [a, b] = MENUS[this.menu].map((o) => o.id);
        this.select(this.current === a ? b : a);
      });
    }
    this.input.on('pointerdown', onPointer);
    this.events.once('shutdown', () => this.input.off('pointerdown', onPointer));
  }

  // ---------------------------------------------------------------- menu
  get current() { return this.menu === 'main' ? this.mode : this.raceKind; }

  openMenu(menu, quiet = false) {
    this.menu = menu;
    if (!quiet) sfx.squeak();
    MENUS[menu].forEach((o, i) => this.buttons[i].label.setText(t(o.label)));
    this.backText.setVisible(menu === 'race');
    this.startText.setText(t(menu === 'race' ? 'title.startBack' : 'title.start'));
    this.select(this.current, true);
  }

  // Highlight a choice of the open menu and show its preview.
  select(id, quiet = false) {
    if (!quiet && id !== this.current) sfx.squeak();
    if (this.menu === 'main') this.selectMode(id, quiet);
    else this.showRacers(id);
    MENUS[this.menu].forEach((o, i) => {
      const on = o.id === id;
      const b = this.buttons[i];
      b.label.setColor(on ? '#ffd27a' : '#6a5a8a');
      b.frame.setStrokeStyle(1, on ? 0xff9a3c : 0x3a2f55).setFillStyle(on ? 0x2a1636 : 0x120a1e, 0.85);
    });
    this.updateHelp();
  }

  // SPACE / ENTER / click: the race opens its own menu, everything else starts.
  confirm() {
    if (this.starting) return;
    if (this.menu === 'main' && this.mode === 'race') { this.openMenu('race'); return; }
    this.start();
  }

  start() {
    this.starting = true;
    initAudio();
    if (this.mode === 'adventure') this.heroBoo();
    else sfx.boo();
    this.registry.set('mode', this.mode);
    this.registry.set('raceDuo', this.mode === 'race' && this.raceKind === 'duo');
    this.registry.set('scared', 0);
    this.registry.set('startTime', Date.now());
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('World'));
  }

  // Controls: the usual help, or who plays with which keys in a two-player race.
  updateHelp() {
    const duo = this.menu === 'race' && this.raceKind === 'duo';
    const lines = duo
      ? [[t('title.duoHelp1'), DUO_RACERS[0].css], [t('title.duoHelp2'), DUO_RACERS[1].css], [t('title.help3'), '#9a8ac0']]
      : [[t('title.help1'), '#9a8ac0'], [t('title.help2'), '#9a8ac0'], [t('title.help3'), '#9a8ac0']];
    lines.forEach(([text, color], i) => this.helpLines[i].setText(text).setColor(color));
  }

  // ---------------------------------------------------------------- mode previews
  // Adventure: the ghost hero in the middle, facing the evil wizard with an empty cage.
  buildAdventurePreview() {
    const layer = this.advLayer = this.add.container(0, 0);
    const add = (o) => { layer.add(o); return o; };

    const gx = W / 2, gy = 120;
    const glow = add(this.add.image(gx, gy, 'glow').setTint(0xff9a3c).setBlendMode(ADD).setScale(1.6).setAlpha(0.6));
    const ghost = this.hero = add(this.add.sprite(gx, gy, 'ghost0').play('ghost-float').setScale(2));
    const sparkler = add(this.add.particles(0, 0, 'spark', {
      follow: ghost, followOffset: { x: -22, y: 2 },
      speed: { min: 10, max: 40 }, lifespan: 400, scale: { start: 1, end: 0 }, frequency: 40, quantity: 2,
      tint: [0xffe066, 0xffb020, 0xffffff], blendMode: 'ADD', gravityY: 30,
    }));
    this.tweens.add({ targets: [ghost, glow], y: gy - 6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // the empty cage swinging from a branch – waiting for a new prisoner
    add(this.add.tileSprite(CAGE_X, BRANCH_Y + 6, 3, CAGE_TOP - BRANCH_Y - 6, 'chain').setOrigin(0.5, 0));
    add(this.add.image(W, BRANCH_Y, 'title_branch').setOrigin(1, 0));
    const magic = add(this.add.image(CAGE_X, CAGE_TOP + 17, 'glow').setTint(0xa040ff).setBlendMode(ADD).setScale(0.7).setAlpha(0.45));
    this.tweens.add({ targets: magic, scale: 0.5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    add(this.add.image(CAGE_X, CAGE_TOP, 'cage_open').setOrigin(0.5, 0));

    // the wizard: purple aura, glowing eyes, sparks from the wand
    const top = GROUND - TITLE_WIZ.h;
    const left = WIZ_X - TITLE_WIZ.w / 2;
    const aura = add(this.add.image(WIZ_X + 4, GROUND - 34, 'glow').setTint(0xb04dff).setBlendMode(ADD).setScale(2).setAlpha(0.4));
    this.tweens.add({ targets: aura, scale: 1.7, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const wiz = this.wiz = add(this.add.image(WIZ_X, GROUND + 1, 'wiz_title_idle').setOrigin(0.5, 1));
    const eyes = TITLE_WIZ.eyes.map((e) => add(this.add.image(left + e.x, top + 1 + e.y, 'glow').setTint(0xff4a1a)
      .setBlendMode(ADD).setScale(0.07).setAlpha(0.9)));
    this.tweens.add({ targets: eyes, scale: 0.11, duration: 160, yoyo: true, repeat: -1, repeatDelay: 700 });
    // breathing (one pixel, so it stays crisp)
    this.tweens.add({ targets: [wiz, ...eyes], y: '-=1', duration: 900, yoyo: true, repeat: -1, ease: 'Stepped' });
    this.wandSparks = add(this.add.particles(0, 0, 'spark', {
      speed: { min: 6, max: 26 }, lifespan: { min: 300, max: 700 }, scale: { start: 1, end: 0 }, frequency: 70, quantity: 1,
      tint: [0xff7bff, 0xc86bff, 0xffffff], blendMode: 'ADD', gravityY: -10,
    }));
    this.setWandTip('idle');
    this.advEmitters = [sparkler, this.wandSparks];
  }

  setWandTip(pose) {
    const tip = TITLE_WIZ.wandTip[pose];
    this.wandSparks.setPosition(WIZ_X - TITLE_WIZ.w / 2 + tip.x, GROUND + 1 - TITLE_WIZ.h + tip.y);
  }

  // MUAHAHA! – wand up, mouth open, sparks flying.
  wizardLaugh() {
    const wiz = this.wiz;
    wiz.setTexture('wiz_title_laugh');
    this.setWandTip('laugh');
    this.wandSparks.explode(14);
    sfx.laugh();
    this.tweens.add({ targets: wiz, x: WIZ_X + 1, duration: 70, yoyo: true, repeat: 7 });
    const label = this.add.text(WIZ_X - 6, GROUND - TITLE_WIZ.h - 8, 'MUAHAHA!', {
      fontFamily: FONT, fontSize: '8px', color: '#e0a0ff', stroke: '#1a0a2a', strokeThickness: 2,
    }).setOrigin(0.5).setAngle(6);
    this.advLayer.add(label);
    this.tweens.add({ targets: label, y: label.y - 8, alpha: 0, delay: 600, duration: 500, onComplete: () => label.destroy() });
    this.time.delayedCall(1100, () => { wiz.setTexture('wiz_title_idle'); this.setWandTip('idle'); });
  }

  // Scare race: ghosts overtaking each other on a swooping track; people at the
  // sides jump up in fright and vanish. Against the computer it's the ghost and
  // its three friends, with two players a red and a blue hat ghost.
  buildRacePreview() {
    const layer = this.raceLayer = this.add.container(0, 0);
    const add = (o) => { layer.add(o); return o; };
    this.raceTime = 0;
    this.packX = W * 0.35;
    const makeSet = (defs, lanes, phases) => defs.map((def, i) => {
      const hat = def.icon === 'ghost0';
      const glow = add(this.add.image(0, 0, 'glow').setTint(def.glow).setBlendMode(ADD).setScale(0.9).setAlpha(0.4));
      const sprite = add(this.add.sprite(0, 0, def.icon).play({ key: hat ? 'ghost-float' : 'friend-float', startFrame: i % 2 }));
      if (def.tint || !hat) sprite.setTint(def.tint ?? def.color);
      // the hat ghosts carry their fizzing sparkler
      const sparkler = hat && add(this.add.particles(0, 0, 'spark', {
        follow: sprite, followOffset: { x: -11, y: 1 },
        speed: { min: 8, max: 30 }, lifespan: 300, scale: { start: 1, end: 0 }, frequency: 50, quantity: 2,
        tint: [0xffe066, 0xffb020, 0xffffff], blendMode: 'ADD', gravityY: 30,
      }));
      return { def, sprite, glow, sparkler, lane: lanes[i], phase: phases[i], x: 0, y: 0 };
    });
    this.racerSets = {
      ai: makeSet(RACERS, [-3, 7, -9, 2], [0, 1.6, 3.2, 4.8]),
      duo: makeSet(DUO_RACERS, [-4, 6], [0, 2.6]),
    };
    this.poof = add(this.add.particles(0, 0, 'smoke', {
      speed: { min: 8, max: 30 }, lifespan: 520, scale: { start: 0.6, end: 1.5 }, alpha: { start: 0.75, end: 0 },
      tint: [0xb8b0d0, 0x8a80a8], emitting: false,
    }));
    this.raceEmitters = [];
    this.showRacers(this.raceKind);
    this.people = [];
    this.spawnWait = 0;
    for (const slot of Phaser.Utils.Array.Shuffle([...PEOPLE_SLOTS]).slice(0, 4)) this.spawnPerson(slot, true);
    this.moveRacers(0);
  }

  // Which pack races in the preview: 'ai' or 'duo'.
  showRacers(kind) {
    this.raceKind = kind;
    this.racers = this.racerSets[kind];
    for (const [k, set] of Object.entries(this.racerSets)) {
      for (const r of set) {
        const on = k === kind;
        r.sprite.setVisible(on);
        r.glow.setVisible(on);
        if (r.sparkler) r.sparkler.emitting = on && this.mode === 'race';
      }
    }
    this.raceEmitters = this.racers.filter((r) => r.sparkler).map((r) => r.sparkler);
  }

  // Height of the race track: low at the screen edges, high over the middle.
  trackY(x) {
    const u = Phaser.Math.Clamp(x / W, 0, 1);
    return 183 - 80 * Math.pow(Math.sin(Math.PI * u), 0.6);
  }

  moveRacers(dt) {
    this.raceTime += dt;
    this.packX += PACK_SPEED * dt;
    if (this.packX > W + 50) this.packX = -50;
    const t = this.raceTime;
    for (const r of this.racers) {
      // everyone surges and falls back at their own rhythm, so they keep overtaking
      r.x = this.packX + 28 * Math.sin(t * 0.9 + r.phase) + 10 * Math.sin(t * 2.1 + r.phase * 1.3);
      r.y = this.trackY(r.x) + r.lane + Math.sin(t * 3.2 + r.phase) * 1.5;
      r.sprite.setPosition(Math.round(r.x), Math.round(r.y));
      r.glow.setPosition(r.x, r.y);
    }
  }

  spawnPerson(slot, instant = false) {
    const kind = Phaser.Utils.Array.GetRandom(PEOPLE_KINDS);
    const sprite = this.add.sprite(slot, GROUND, `p_${kind}_0`).setOrigin(0.5, 1).setFlipX(Math.random() < 0.5);
    this.raceLayer.addAt(sprite, 0);
    const p = { slot, kind, sprite, state: 'stand' };
    if (!instant) {
      sprite.setAlpha(0);
      this.tweens.add({ targets: sprite, alpha: 1, duration: 500 });
    }
    this.people.push(p);
  }

  scarePerson(p, racer) {
    p.state = 'scared';
    const s = p.sprite;
    s.setTexture(`p_${p.kind}_s`).setFlipX(racer.x > p.slot);
    if (this.mode === 'race') sfx.scream();
    this.tweens.add({ targets: s, y: GROUND - 9, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
    const mark = this.add.text(p.slot, GROUND - 26, '!', {
      fontFamily: FONT, fontSize: '8px', color: '#ff5a5a', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 1);
    const boo = this.add.text(racer.x, racer.y - 18, t('ghost.boo'), {
      fontFamily: FONT, fontSize: '8px', color: racer.def.css, stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.raceLayer.add([mark, boo]);
    this.tweens.add({ targets: mark, y: mark.y - 6, duration: 160, yoyo: true, repeat: 1, onComplete: () => mark.destroy() });
    this.tweens.add({ targets: boo, y: boo.y - 10, alpha: 0, duration: 700, onComplete: () => boo.destroy() });
    // ... and gone: a puff of smoke, back later somewhere else
    this.time.delayedCall(520, () => {
      this.poof.explode(8, p.slot, GROUND - 9);
      this.tweens.add({
        targets: s, alpha: 0, scaleY: 0.3, duration: 180, onComplete: () => {
          s.destroy();
          this.people = this.people.filter((q) => q !== p);
        },
      });
    });
  }

  update(_time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.moveRacers(dt);
    // new people keep turning up where the pack is not right now
    this.spawnWait -= dt;
    if (this.spawnWait <= 0 && this.people.length < MAX_PEOPLE) {
      const free = PEOPLE_SLOTS.filter((x) => !this.people.some((q) => q.slot === x)
        && this.racers.every((r) => Math.abs(r.x - x) > 50));
      if (free.length) {
        this.spawnPerson(Phaser.Utils.Array.GetRandom(free));
        this.spawnWait = 0.5 + Math.random() * 0.6;
      }
    }
    for (const p of this.people) {
      if (p.state !== 'stand' || p.sprite.alpha < 1) continue;
      const r = this.racers.find((q) => Math.abs(q.x - p.slot) < 10);
      if (r) this.scarePerson(p, r);
    }
  }

  selectMode(mode, quiet = false) {
    this.mode = mode;
    // cross-fade the two little scenes
    for (const [layer, emitters, on] of [[this.advLayer, this.advEmitters, mode === 'adventure'], [this.raceLayer, this.raceEmitters, mode === 'race']]) {
      this.tweens.killTweensOf(layer);
      if (quiet) layer.setAlpha(on ? 1 : 0);
      else this.tweens.add({ targets: layer, alpha: on ? 1 : 0, duration: 350 });
      for (const e of emitters) e.emitting = on;
    }
  }

  // Rebuild the texts that are baked into textures, then redraw the menu.
  switchLang(code) {
    if (code === getLang()) return;
    setLang(code);
    this.registry.set('mode', this.mode);
    this.registry.set('raceDuo', this.raceKind === 'duo');
    makeLocalizedTextures(this);
    this.scene.restart();
  }
}
