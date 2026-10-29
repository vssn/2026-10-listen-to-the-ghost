// Translations. German is the fallback for any key missing in English.
// Language: the saved choice wins, otherwise the browser language decides
// (German browsers get German, everything else English).

const DICT = {
  de: {
    'title.subtitle': 'Ein gruseliges Geister-Abenteuer',
    'title.help1': 'Pfeiltasten / WASD / Maus: fliegen',
    'title.help2': 'LEERTASTE / Rechtsklick: BUH!',
    'title.help3': 'M: Ton an/aus',
    'title.start': 'LEERTASTE oder Klick zum Start',
    'title.modeAdventure': 'Abenteuer',
    'title.modeRace': 'Gruselrennen',
    'title.vsAi': 'Gegen KI',
    'title.duo': 'Zu zweit',
    'title.back': '< ZURÜCK',
    'title.startBack': 'LEERTASTE: Start   ESC: zurück',
    'title.duoHelp1': 'Rot: WASD + LEERTASTE',
    'title.duoHelp2': 'Blau: PFEILTASTEN + ENTER',

    'ghost.boo': 'BUH!',
    'ghost.intro': "Die Geisterstunde beginnt - auf geht's, meine Freunde!",
    'ghost.friends': 'Huch! Wo sind meine Freunde?',
    'ghost.caged': 'Der böse Zauberer hat sie in Zauberkäfige gesperrt!',
    'ghost.city': 'Die Stadt! Mit BUH (Leertaste) erschrecke ich die Leute!',
    'ghost.metro': 'Eine U-Bahn! Mal sehen, wer da unten auf den Zug wartet...',
    'ghost.cellar': 'Ein Kellerabgang! Hier geht es runter in den Keller...',
    'ghost.party': 'Eine Halloween-Party! Die halten mich für verkleidet...',

    'hud.muteOn': 'M: Ton an',
    'hud.muteOff': 'M: Ton aus',
    'hud.wizard': 'ZAUBERER',
    'hud.apprentice': 'LEHRLING',

    'obj.findWizard': 'Ziel: Finde den Zauberer!',
    'obj.findHouse': 'Ziel: Finde das Haus des Zauberers!',
    'obj.apprentice': 'Ziel: Besiege den Zauberlehrling!',
    'obj.wizard': 'Ziel: Besiege den Zauberer!',
    'obj.hatch': 'Ziel: Flieg durch die Luke nach oben!',

    'banner.win.title': 'GESCHAFFT!',
    'banner.win.l1': 'Der Zauberer ist platt wie ein Pfannkuchen,',
    'banner.win.l2': 'die Geister-Freunde sind frei!',
    'banner.win.l3': 'Erschreckte Bewohner: {n}   Zeit: {time}',
    'banner.win.again': 'LEERTASTE: Nochmal spielen',
    'banner.lose.title': 'OH NEIN!',
    'banner.lose.apprentice': 'Der Lehrling hat dich erwischt...',
    'banner.lose.wizard': 'Der Zauberer hat dich erwischt...',
    'banner.lose.again': 'LEERTASTE: Nochmal versuchen',

    'boss.master1': 'Du willst deine Freunde? Erst musst du an meinem Lehrling vorbei!',
    'boss.master2': 'Wir sehen uns oben... MUAHAHA!',
    'boss.apprentice1': 'Jawohl, Meister! Äh... Hokuspokus!',
    'boss.ghost1': 'Ich muss den Zauberfunken ausweichen!',
    'boss.ghost2': 'Wenn die Funken Kronleuchter, Regale oder die Rüstung treffen, fallen die auf ihn!',
    'boss.wizard1': 'Du hast meinen Lehrling besiegt? Jetzt bekommst du es mit MIR zu tun!',
    'boss.ghost3': 'Teleskope, Planeten und Schriftrollen-Regale können auf ihn fallen!',
    'boss.potions': 'Herz-Tränke! Die füllen meine Energie wieder auf.',
    'boss.hatch': "Da oben geht's weiter - die Käfige sind im Dachgeschoss!",
    'boss.gloat': 'Hehe! Der Meister wird stolz sein!',
    'boss.muahaha': 'MUAHAHA!',
    'boss.miss': ['Daneben!', 'Hihi!', 'Ha! Verfehlt!'],
    'boss.friend': 'Danke, kleiner Geist! Wir sind frei!',

    'wiz.huch': 'Huch!',
    'wiz.ouch': 'AUA!',
    'wiz.nooo': 'NEEEIN!',
    'wiz.hurt': ['Grrr! Das wirst du bereuen!', 'Jetzt werde ich richtig wütend!'],
    'wiz.collect': 'MUAHAHA! Noch ein Geist für meine Sammlung!',
    'appr.hurt': ['Autsch! Meister, hilf mir!', 'Das steht so nicht im Zauberbuch!'],
    'appr.quit': 'Ich kündige!',

    'world.alley': 'SACK-\nGASSE',
    'world.hello': 'Huhu!',
    'house.puh': 'puh...',
    'house.shouts': ['Ein Geist!', 'Ahh!', 'Hilfe!', 'Iiieh!'],
    'house.kidShouts': ['Mama, Papa!', 'Ein Geist!', 'Ahh!'],
    'inn.partyShouts': ['Ein echter Geist!', 'Aaah!', 'Das ist kein Kostüm!', 'Hilfe!'],
    'inn.partyLines': ['Tolles Kostüm!', 'Prost, Gespenst!', 'Hihi, süßer Geist!', 'Schicke Verkleidung!', 'Party!', 'Willst du tanzen?'],
    'inn.staffLines': ['Noch einen Kürbissaft?', "Darf's was sein?", 'Platz da, heiße Suppe!'],
    'inn.sleeperShouts': ['Huch?!', 'Wa...? Ein Geist!', 'Hilfe!', 'Mama!'],
    'dog.yelp': 'Jauul!',
    'dog.woof': 'Wuff!',
    'metro.riderShouts': ['Ein Geist in der Bahn!', 'Aaah!', 'Hilfe!', 'Nächster Halt: Panik!'],

    'sign.forest': 'STADT',
    'sign.inn': 'GASTHAUS ZUM KÜRBIS',
    'sign.fair': 'HALLOWEEN FEST',

    'race.you': 'DU',
    'race.names': ['NEBEL', 'MOOS', 'ROSA'],
    'race.players': ['ROT', 'BLAU'],
    'race.goal': 'Wer erschreckt in 1 Minute die meisten Leute?',
    'race.go': 'LOS!',
    'race.timeUp': 'ZEIT!',
    'race.taunts': ['Hihi!', 'Meiner!', 'Zu langsam!', 'Huhu!', 'Erste!'],
    'podium.title': 'GEISTERPODEST',
    'podium.youWin': 'Du hast gewonnen!',
    'podium.otherWins': '{name} gewinnt!',
    'podium.again': 'Nochmal',
    'podium.menu': 'Menü',
  },

  en: {
    'title.subtitle': 'A spooky ghost adventure',
    'title.help1': 'Arrow keys / WASD / mouse: fly',
    'title.help2': 'SPACE / right click: BOO!',
    'title.help3': 'M: sound on/off',
    'title.start': 'SPACE or click to start',
    'title.modeAdventure': 'Adventure',
    'title.modeRace': 'Scare Race',
    'title.vsAi': 'Vs. computer',
    'title.duo': 'Two players',
    'title.back': '< BACK',
    'title.startBack': 'SPACE: start   ESC: back',
    'title.duoHelp1': 'Red: WASD + SPACE',
    'title.duoHelp2': 'Blue: ARROWS + ENTER',

    'ghost.boo': 'BOO!',
    'ghost.intro': "The witching hour begins - let's go, my friends!",
    'ghost.friends': 'Whoa! Where are my friends?',
    'ghost.caged': 'The evil wizard locked them in magic cages!',
    'ghost.city': 'The city! With BOO (space) I scare the people!',
    'ghost.metro': "A subway! Let's see who's waiting for the train down there...",
    'ghost.cellar': 'A cellar stairway! It leads down into the cellar...',
    'ghost.party': "A Halloween party! They think I'm in costume...",

    'hud.muteOn': 'M: Sound on',
    'hud.muteOff': 'M: Sound off',
    'hud.wizard': 'WIZARD',
    'hud.apprentice': 'APPRENTICE',

    'obj.findWizard': 'Goal: Find the wizard!',
    'obj.findHouse': "Goal: Find the wizard's house!",
    'obj.apprentice': 'Goal: Defeat the apprentice!',
    'obj.wizard': 'Goal: Defeat the wizard!',
    'obj.hatch': 'Goal: Fly through the hatch upstairs!',

    'banner.win.title': 'YOU DID IT!',
    'banner.win.l1': 'The wizard is flat as a pancake,',
    'banner.win.l2': 'the ghost friends are free!',
    'banner.win.l3': 'Residents scared: {n}   Time: {time}',
    'banner.win.again': 'SPACE: play again',
    'banner.lose.title': 'OH NO!',
    'banner.lose.apprentice': 'The apprentice got you...',
    'banner.lose.wizard': 'The wizard got you...',
    'banner.lose.again': 'SPACE: try again',

    'boss.master1': 'You want your friends back? First get past my apprentice!',
    'boss.master2': 'See you upstairs... MUAHAHA!',
    'boss.apprentice1': 'Yes, master! Uh... hocus pocus!',
    'boss.ghost1': 'I have to dodge the magic sparks!',
    'boss.ghost2': 'If the sparks hit chandeliers, shelves or the armour, they fall on him!',
    'boss.wizard1': 'You beat my apprentice? Now you get to deal with ME!',
    'boss.ghost3': 'Telescopes, planets and scroll shelves can fall on him!',
    'boss.potions': 'Heart potions! They refill my energy.',
    'boss.hatch': "It goes on up there - the cages are in the attic!",
    'boss.gloat': 'Hehe! The master will be proud!',
    'boss.muahaha': 'MUAHAHA!',
    'boss.miss': ['Missed!', 'Hee hee!', 'Ha! Wrong!'],
    'boss.friend': 'Thank you, little ghost! We are free!',

    'wiz.huch': 'Whoa!',
    'wiz.ouch': 'OUCH!',
    'wiz.nooo': 'NOOOO!',
    'wiz.hurt': ["Grrr! You'll regret this!", 'Now I am really angry!'],
    'wiz.collect': 'MUAHAHA! Another ghost for my collection!',
    'appr.hurt': ['Ouch! Master, help me!', "That's not in the spellbook!"],
    'appr.quit': 'I quit!',

    'world.alley': 'DEAD\nEND',
    'world.hello': 'Hello!',
    'house.puh': 'phew...',
    'house.shouts': ['A ghost!', 'Ahh!', 'Help!', 'Eeek!'],
    'house.kidShouts': ['Mommy, Daddy!', 'A ghost!', 'Ahh!'],
    'inn.partyShouts': ['A real ghost!', 'Aaah!', "That's no costume!", 'Help!'],
    'inn.partyLines': ['Great costume!', 'Cheers, spook!', 'Hehe, sweet ghost!', 'Nice disguise!', 'Party!', 'Want to dance?'],
    'inn.staffLines': ['Another pumpkin juice?', 'What can I get you?', 'Coming through, hot soup!'],
    'inn.sleeperShouts': ['Huh?!', 'Wha...? A ghost!', 'Help!', 'Mommy!'],
    'dog.yelp': 'Yelp!',
    'dog.woof': 'Woof!',
    'metro.riderShouts': ['A ghost on the train!', 'Aaah!', 'Help!', 'Next stop: panic!'],

    'sign.forest': 'CITY',
    'sign.inn': 'PUMPKIN INN',
    'sign.fair': 'HALLOWEEN FAIR',

    'race.you': 'YOU',
    'race.names': ['MISTY', 'MOSSY', 'ROSIE'],
    'race.players': ['RED', 'BLUE'],
    'race.goal': 'Who scares the most people in 1 minute?',
    'race.go': 'GO!',
    'race.timeUp': "TIME'S UP!",
    'race.taunts': ['Hehe!', 'Mine!', 'Too slow!', 'Boo-hoo!', 'Got one!'],
    'podium.title': 'GHOST PODIUM',
    'podium.youWin': 'You win!',
    'podium.otherWins': '{name} wins!',
    'podium.again': 'Again',
    'podium.menu': 'Menu',
  },
};

const LANGS = ['de', 'en'];
const STORE_KEY = 'ghost-lang';

function detect() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch (e) {
    // storage can be blocked (private windows) – fall back to the browser
  }
  const nav = (typeof navigator !== 'undefined' && (navigator.language || navigator.languages?.[0])) || 'en';
  return nav.toLowerCase().startsWith('de') ? 'de' : 'en';
}

let current = detect();
if (typeof document !== 'undefined') document.documentElement.lang = current;

export const getLang = () => current;

export function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  current = lang;
  try {
    localStorage.setItem(STORE_KEY, lang);
  } catch (e) {
    // not persisted – still applies for this page view
  }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

// Text for a key; {name} placeholders are filled from `vars`.
export function t(key, vars) {
  let s = DICT[current][key] ?? DICT.de[key] ?? key;
  if (vars) for (const [name, value] of Object.entries(vars)) s = s.replaceAll(`{${name}}`, String(value));
  return s;
}

// List of alternatives for a key (picked from at random by the caller).
export function tl(key) {
  const v = DICT[current][key] ?? DICT.de[key];
  return Array.isArray(v) ? v : [v];
}
