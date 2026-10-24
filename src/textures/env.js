import { canvasTex, rng, bands, shade } from '../gfx.js';
import { W, H, WORLD_W, CASTLE_END, FOREST_END, LAYER_BASE } from '../config.js';

// ---------------- Generic FX ----------------
function makeFx(scene) {
  canvasTex(scene, 'px', 1, 1, (P) => P.px(0, 0, '#ffffff'));
  canvasTex(scene, 'spark', 2, 2, (P) => P.rect(0, 0, 2, 2, '#ffffff'));
  canvasTex(scene, 'glow', 64, 64, (P, ctx) => {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  canvasTex(scene, 'ring', 33, 33, (P) => {
    P.circle(16, 16, 16, '#ffffff');
    P.erase((c) => P.circle(16, 16, 13, c));
  });
  canvasTex(scene, 'bolt', 9, 9, (P) => {
    P.rect(4, 0, 1, 9, '#c86bff');
    P.rect(0, 4, 9, 1, '#c86bff');
    P.rect(3, 2, 3, 5, '#ff8cf0');
    P.rect(2, 3, 5, 3, '#ff8cf0');
    P.rect(3, 3, 3, 3, '#ffffff');
  });
  canvasTex(scene, 'smoke', 7, 7, (P) => P.circle(3, 3, 3, '#ffffff'));
  canvasTex(scene, 'star', 5, 5, (P) => {
    P.rect(2, 0, 1, 5, '#ffe66b'); P.rect(0, 2, 5, 1, '#ffe66b'); P.px(2, 2, '#ffffff');
  });
  canvasTex(scene, 'heart', 7, 6, (P) => {
    const rows = ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
    rows.forEach((r, y) => [...r].forEach((ch, x) => ch === 'r' && P.px(x, y, '#ff4d6d')));
    P.px(1, 1, '#ffd0d8');
  });
  canvasTex(scene, 'heart_empty', 7, 6, (P) => {
    const rows = ['.rr.rr.', 'r..r..r', 'r.....r', '.r...r.', '..r.r..', '...r...'];
    rows.forEach((r, y) => [...r].forEach((ch, x) => ch === 'r' && P.px(x, y, '#6b4a5a')));
  });
  canvasTex(scene, 'lightcone', 40, 60, (P, ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 60);
    g.addColorStop(0, 'rgba(255,220,130,0.55)');
    g.addColorStop(1, 'rgba(255,220,130,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(15, 0); ctx.lineTo(25, 0); ctx.lineTo(40, 60); ctx.lineTo(0, 60);
    ctx.closePath();
    ctx.fill();
  });
  canvasTex(scene, 'fog', 256, 36, (P, ctx) => {
    const R = rng(91);
    for (let i = 0; i < 26; i++) {
      const x = R() * 256, y = 14 + R() * 16, r = 10 + R() * 18;
      for (const dx of [-256, 0, 256]) {
        const g = ctx.createRadialGradient(x + dx, y, 0, x + dx, y, r);
        g.addColorStop(0, 'rgba(190,180,230,0.35)');
        g.addColorStop(1, 'rgba(190,180,230,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x + dx - r, y - r, r * 2, r * 2);
      }
    }
  });
}

// ---------------- Sky + moon ----------------
function makeSky(scene) {
  canvasTex(scene, 'sky', W, H, (P) => {
    bands(P, 0, 0, W, H, ['#07051a', '#0b0822', '#100b2b', '#160f35', '#1d1340', '#25184a', '#2e1d52', '#3a2459']);
    const R = rng(3);
    for (let i = 0; i < 140; i++) {
      const x = Math.floor(R() * W), y = Math.floor(R() * H * 0.75);
      const c = R() < 0.15 ? '#ffffff' : R() < 0.5 ? '#9f95c9' : '#5e5590';
      P.px(x, y, c);
      if (R() < 0.04) { P.px(x - 1, y, '#5e5590'); P.px(x + 1, y, '#5e5590'); P.px(x, y - 1, '#5e5590'); P.px(x, y + 1, '#5e5590'); }
    }
  });
  canvasTex(scene, 'moon', 41, 41, (P) => {
    P.circle(20, 20, 20, '#f2e6bd');
    P.circle(23, 18, 18, '#fbf3d6');
    P.circle(12, 14, 4, '#dccf9f');
    P.circle(26, 27, 5, '#e3d6a8');
    P.circle(28, 11, 2, '#dccf9f');
    P.circle(15, 29, 2, '#dccf9f');
    P.circle(31, 20, 2, '#e3d6a8');
  });
}

// ---------------- Castle ruin ----------------
function makeCastle(scene) {
  const h = 262; // castle art height; placed so its floor sits on GROUND_Y
  canvasTex(scene, 'castle', 780, h, (P) => {
    const R = rng(11);
    const mortar = '#1c1828';
    const bricks = ['#2b2639', '#2f2a3e', '#332d44', '#29243a', '#373049'];
    // back wall bricks
    P.rect(0, 0, 780, h, mortar);
    for (let row = 0; row * 7 < h; row++) {
      const off = row % 2 ? 7 : 0;
      for (let x = -off; x < 780; x += 14) {
        const c = bricks[Math.floor(R() * bricks.length)];
        P.rect(x + 1, row * 7 + 1, 13, 6, c);
        if (R() < 0.3) P.rect(x + 1, row * 7 + 1, 13, 1, shade(c, 0.12));
      }
    }
    // darker towards the floor
    for (let i = 0; i < 6; i++) {
      P.ctx.fillStyle = `rgba(5,3,12,${0.08 + i * 0.05})`;
      P.ctx.fillRect(0, h - 140 + i * 24, 780, 24);
    }
    // ruined top edge of the hall wall (x 36..640)
    P.erase((c) => {
      let top = 70;
      for (let x = 36; x < 640; x += 6) {
        top = Math.max(48, Math.min(110, top + Math.floor((R() - 0.5) * 22)));
        P.rect(x, 0, 6, top, c);
      }
      // big break
      P.poly([[300, 0], [380, 0], [365, 130], [345, 150], [330, 125], [318, 90]], c);
      // gothic windows
      for (const wx of [80, 200, 470, 560]) P.arch(wx, 112, 26, 62, c);
      // holes
      P.poly([[140, 150], [158, 142], [170, 160], [160, 176], [143, 170]], c);
      P.poly([[520, 90], [540, 86], [548, 104], [528, 112]], c);
      // castle gate in right tower
      P.arch(690, 180, 46, 82, c);
      // sky above the towers
      P.rect(0, 0, 36, 30, c);
      P.rect(640, 0, 140, 20, c);
    });
    // window bars + sills
    for (const wx of [80, 200, 470, 560]) {
      P.rect(wx + 12, 112, 2, 62, '#1a1622');
      P.rect(wx, 140, 27, 2, '#1a1622');
      P.rect(wx - 2, 174, 31, 3, '#4a4360');
    }
    // left tower
    P.rect(0, 30, 36, h - 30, '#2d283c');
    for (let y = 34; y < h; y += 7) P.rect(0, y, 36, 1, mortar);
    for (let x = 0; x < 36; x += 10) P.rect(x, 22, 6, 8, '#2d283c');
    P.rect(30, 30, 6, h - 30, '#231f30');
    // right tower (castle exit)
    P.rect(640, 20, 140, h - 20, '#2a2538');
    for (let y = 26; y < h; y += 7) {
      const off = (y / 7) % 2 ? 7 : 0;
      P.rect(640, y, 140, 1, mortar);
      for (let x = 640 - off; x < 780; x += 14) P.rect(x, y, 1, 7, mortar);
    }
    for (let x = 640; x < 780; x += 14) P.rect(x, 10, 9, 10, '#2a2538');
    P.rect(640, 20, 4, h - 20, '#3b3550');
    P.erase((c) => P.arch(690, 180, 46, 82, c));
    // portcullis (raised)
    for (let x = 694; x < 736; x += 6) P.rect(x, 184, 2, 22, '#14111c');
    P.rect(690, 204, 47, 2, '#14111c');
    // tower windows
    P.erase((c) => { P.arch(670, 70, 10, 24, c); P.arch(744, 70, 10, 24, c); });
    // pillars
    for (const px of [150, 410]) {
      P.rect(px, 64, 18, h - 64, '#3d3650');
      P.rect(px + 2, 64, 3, h - 64, '#4b4362');
      P.rect(px + 14, 64, 4, h - 64, '#2e2940');
      P.rect(px - 3, 64, 24, 6, '#4b4362');
      P.rect(px - 3, h - 8, 24, 8, '#4b4362');
      P.erase((c) => P.poly([[px, 64], [px + 8, 58], [px + 18, 64], [px + 18, 70], [px, 72]], c));
    }
    // torn banners
    for (const bx of [250, 520]) {
      P.rect(bx - 2, 118, 24, 3, '#4a3a2a');
      P.poly([[bx, 121], [bx + 20, 121], [bx + 20, 170], [bx + 14, 162], [bx + 10, 172], [bx + 4, 160], [bx, 168]], '#6b1a24');
      P.rect(bx + 2, 121, 2, 44, '#851f2c');
      P.circle(bx + 10, 138, 5, '#c9a227');
      P.circle(bx + 10, 138, 3, '#6b1a24');
    }
    // vines
    for (let i = 0; i < 14; i++) {
      let x = 40 + R() * 590, y = 60 + R() * 60;
      const len = 20 + R() * 60;
      for (let k = 0; k < len; k++) {
        P.px(x, y, k % 5 === 0 ? '#3c5a32' : '#2a3f26');
        y += 1; x += Math.round(Math.sin(k * 0.4 + i) * 0.6);
      }
    }
    // cobwebs
    const web = (x, y, dir) => {
      for (let i = 0; i < 5; i++) P.line(x, y, x + dir * (20 - i * 4), y + i * 5, 1, 'rgba(220,220,240,0.45)');
      for (let r = 6; r <= 18; r += 6) {
        for (let a = 0; a <= 10; a++) {
          const ang = (a / 10) * (Math.PI / 2);
          P.px(x + dir * Math.cos(ang) * r, y + Math.sin(ang) * r, 'rgba(220,220,240,0.4)');
        }
      }
    };
    web(36, 112, 1); web(640, 112, -1); web(168, 70, 1); web(410, 70, -1);
  });
}

// ---------------- Graves, pumpkins, torches ----------------
function makeGraveyard(scene) {
  canvasTex(scene, 'tomb_rip', 16, 20, (P) => {
    P.rect(0, 6, 16, 14, '#5a5670');
    P.circle(8, 7, 7, '#5a5670');
    P.rect(12, 6, 4, 14, '#47445a');
    P.rect(0, 18, 16, 2, '#3a374a');
    const t = '#2e2b3c';
    // R
    P.rect(2, 8, 1, 5, t); P.rect(3, 8, 2, 1, t); P.rect(4, 9, 1, 1, t); P.rect(3, 10, 1, 1, t); P.rect(4, 11, 1, 2, t);
    // I
    P.rect(7, 8, 1, 5, t);
    // P
    P.rect(10, 8, 1, 5, t); P.rect(11, 8, 2, 1, t); P.rect(12, 9, 1, 1, t); P.rect(11, 10, 2, 1, t);
    P.px(3, 3, '#3c5a32'); P.px(4, 2, '#3c5a32'); P.px(13, 14, '#3c5a32');
  });
  // stone sarcophagus with a carved skull
  canvasTex(scene, 'crypt', 34, 16, (P) => {
    P.rect(1, 6, 32, 10, '#4a465c');
    P.rect(1, 6, 32, 1, '#5e5974');
    P.rect(28, 6, 5, 10, '#3a3749');
    P.poly([[0, 6], [34, 6], [31, 2], [3, 2]], '#56526a');
    P.rect(3, 2, 28, 1, '#6a6582');
    for (const x of [5, 25]) { P.rect(x, 9, 4, 5, '#3a3749'); P.rect(x + 1, 10, 2, 3, '#2e2b3c'); }
    P.circle(17, 11, 3, '#6a6582');
    P.px(16, 11, '#2e2b3c'); P.px(18, 11, '#2e2b3c'); P.rect(16, 13, 3, 1, '#2e2b3c');
    P.px(4, 15, '#2f4a28'); P.px(5, 14, '#3c5a32'); P.px(30, 3, '#3c5a32');
  });
  // grave slab set into the floor, with a cracked corner
  canvasTex(scene, 'slab', 30, 6, (P) => {
    P.rect(0, 1, 30, 5, '#45415a');
    P.rect(0, 1, 30, 1, '#5e5974');
    P.line(22, 1, 26, 5, 1, '#2a2836');
    P.rect(5, 3, 12, 1, '#35324a');
  });
  // crouching gargoyle with folded wings and glowing eyes
  const gargoyle = (P, base) => {
    const s = '#5a566e', d = '#3e3b4e', l = '#77728c';
    P.rect(2, base, 18, 4, '#3a3749');               // pedestal top
    P.rect(2, base, 18, 1, '#5e5974');
    P.poly([[3, base], [5, base - 12], [10, base - 16], [14, base - 12], [12, base]], s);   // body
    P.poly([[9, base - 14], [2, base - 22], [1, base - 15], [4, base - 10]], d);            // wing
    P.poly([[9, base - 14], [4, base - 21], [5, base - 16]], l);
    P.ellipse(15, base - 15, 4, 3, s);                // head
    P.poly([[13, base - 18], [12, base - 22], [15, base - 18]], d); // horns
    P.poly([[17, base - 18], [18, base - 22], [19, base - 17]], d);
    P.rect(18, base - 14, 3, 2, d);                   // snout
    P.px(20, base - 12, '#e8e0d0'); P.px(18, base - 12, '#e8e0d0'); // fangs
    P.px(15, base - 16, '#ff3b3b'); P.px(17, base - 16, '#ff3b3b');
    P.rect(12, base - 6, 5, 2, s); P.rect(15, base - 4, 3, 4, s); // claws on ledge
    P.rect(5, base - 3, 4, 3, d);
    P.line(3, base - 2, 0, base - 6, 1, d);           // tail
  };
  canvasTex(scene, 'gargoyle', 22, 26, (P) => gargoyle(P, 22));
  canvasTex(scene, 'gargoyle_pedestal', 22, 44, (P) => {
    gargoyle(P, 22);
    P.rect(4, 26, 14, 18, '#47435a');
    P.rect(4, 26, 3, 18, '#57536c');
    P.rect(15, 26, 3, 18, '#3a3749');
    P.rect(2, 41, 18, 3, '#3a3749');
  });
  canvasTex(scene, 'tomb_round', 14, 14, (P) => {
    P.rect(0, 5, 14, 9, '#45425a');
    P.circle(7, 6, 6, '#45425a');
    P.rect(3, 6, 8, 1, '#35324a'); P.rect(3, 9, 8, 1, '#35324a');
  });
  // weathered, sunken tombstone with a crack and moss
  canvasTex(scene, 'tomb_old', 16, 18, (P) => {
    P.poly([[2, 18], [1, 7], [3, 3], [8, 1], [13, 3], [15, 8], [14, 18]], '#4d4a5e');
    P.poly([[11, 3], [13, 3], [15, 8], [14, 18], [11, 18]], '#3d3a4c');
    P.line(7, 2, 6, 7, 1, '#2a2836'); P.line(6, 7, 8, 11, 1, '#2a2836');
    P.rect(4, 9, 8, 1, '#35324a'); P.rect(4, 12, 6, 1, '#35324a');
    P.rect(1, 15, 5, 3, '#2f4a28'); P.px(3, 4, '#3c5a32'); P.px(4, 3, '#3c5a32'); P.px(12, 14, '#3c5a32');
  });
  canvasTex(scene, 'mound', 26, 6, (P) => {
    P.ellipse(13, 6, 13, 5, '#3a2a22');
    P.ellipse(13, 6, 10, 3, '#4a362a');
    P.px(6, 3, '#2f4a28'); P.px(18, 2, '#2f4a28');
  });
  canvasTex(scene, 'mound_open', 30, 8, (P) => {
    P.ellipse(4, 8, 5, 4, '#4a362a');
    P.ellipse(26, 8, 5, 5, '#4a362a');
    P.rect(7, 6, 16, 2, '#120c10');
    P.px(10, 3, '#4a362a'); P.px(20, 2, '#4a362a'); P.px(15, 1, '#4a362a');
  });
  // 'pumpkin_off' is the same pumpkin with its candle out (used for flickering eyes)
  for (const [key, face] of [['pumpkin', '#ffd23f'], ['pumpkin_off', '#5a2a08']]) {
    canvasTex(scene, key, 14, 11, (P) => {
      P.ellipse(7, 6, 7, 5, '#e3711b');
      P.rect(4, 2, 1, 9, '#b5530f'); P.rect(9, 2, 1, 9, '#b5530f');
      P.rect(6, 0, 2, 2, '#3d5a22');
      P.rect(3, 4, 2, 2, face); P.rect(9, 4, 2, 2, face);
      P.rect(4, 7, 6, 1, face); P.px(5, 8, face); P.px(8, 8, face);
    });
  }
  canvasTex(scene, 'torch0', 6, 14, (P) => {
    P.rect(2, 6, 2, 8, '#5a3a1a'); P.rect(1, 5, 4, 2, '#3a3a44');
    P.rect(1, 1, 4, 4, '#ff8a1a'); P.rect(2, 0, 2, 3, '#ffd23f'); P.px(2, 2, '#fff6c0');
  });
  canvasTex(scene, 'torch1', 6, 14, (P) => {
    P.rect(2, 6, 2, 8, '#5a3a1a'); P.rect(1, 5, 4, 2, '#3a3a44');
    P.rect(1, 2, 4, 3, '#ff8a1a'); P.rect(2, 0, 2, 4, '#ffd23f'); P.px(3, 1, '#fff6c0'); P.px(1, 1, '#ff8a1a');
  });
}

// ---------------- Dead trees ----------------
function branch(P, R, x, y, ang, len, w, depth, c) {
  const x2 = x + Math.cos(ang) * len;
  const y2 = y + Math.sin(ang) * len;
  P.line(x, y, x2, y2, w, c);
  if (depth <= 0 || len < 4) return;
  const n = R() < 0.4 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const na = ang + (R() - 0.5) * 1.4 + (i - (n - 1) / 2) * 0.5;
    branch(P, R, x2, y2, na, len * (0.6 + R() * 0.2), Math.max(1, w * 0.65), depth - 1, c);
  }
}

function makeTrees(scene) {
  const defs = [
    { w: 90, h: 150, seed: 5 }, { w: 80, h: 120, seed: 9 }, { w: 100, h: 170, seed: 21 }, { w: 70, h: 100, seed: 33 },
  ];
  defs.forEach((d, i) => {
    canvasTex(scene, `tree${i}`, d.w, d.h, (P) => {
      const R = rng(d.seed);
      const c = '#140e1f';
      const cx = d.w / 2;
      // roots
      P.poly([[cx - 9, d.h], [cx + 9, d.h], [cx + 4, d.h - 8], [cx - 4, d.h - 8]], c);
      // twisted trunk
      let x = cx, y = d.h;
      const trunkH = d.h * 0.45;
      for (let k = 0; k < trunkH; k++) {
        const w = 7 - (k / trunkH) * 3;
        P.rect(x - w / 2, y - k, w, 1, c);
        x += Math.sin(k * 0.08 + d.seed) * 0.35;
      }
      const topY = d.h - trunkH;
      branch(P, R, x, topY, -Math.PI / 2, d.h * 0.25, 4, 4, c);
      branch(P, R, x, topY + 10, -Math.PI / 2 - 0.9, d.h * 0.2, 3, 3, c);
      branch(P, R, x, topY + 16, -Math.PI / 2 + 0.9, d.h * 0.2, 3, 3, c);
      // knot hole with glowing eyes on one tree
      if (i === 2) { P.ellipse(x, d.h - 30, 3, 4, '#05030a'); P.px(x - 1, d.h - 31, '#ffd23f'); P.px(x + 1, d.h - 31, '#ffd23f'); }
      // subtle moonlight rim on the right side
      P.ctx.globalCompositeOperation = 'source-atop';
      P.ctx.fillStyle = 'rgba(120,110,170,0.25)';
      P.ctx.fillRect(cx + 1, 0, 2, d.h);
      P.ctx.globalCompositeOperation = 'source-over';
    });
  });
  canvasTex(scene, 'bush', 34, 14, (P) => {
    const R = rng(4);
    for (let i = 0; i < 9; i++) P.circle(4 + R() * 26, 9 + R() * 3, 3 + Math.floor(R() * 3), '#120d1c');
    P.rect(0, 12, 34, 2, '#120d1c');
  });
  // thorny undergrowth (Gestrüpp)
  canvasTex(scene, 'brush', 40, 22, (P) => {
    const R = rng(12);
    for (let i = 0; i < 16; i++) {
      const x = 3 + R() * 34;
      branch(P, R, x, 22, -Math.PI / 2 + (R() - 0.5) * 1.6, 6 + R() * 8, 1, 2, i % 3 ? '#1a1224' : '#24331f');
    }
    for (let i = 0; i < 6; i++) P.circle(6 + R() * 28, 19 + R() * 2, 2 + Math.floor(R() * 2), '#140e1c');
    P.rect(0, 21, 40, 1, '#140e1c');
  });
  // owl: pupils looking centre / left / right / up, plus a blink frame
  const owl = (key, dx, dy, blink = false) => canvasTex(scene, key, 9, 11, (P) => {
    P.ellipse(4, 6, 4, 5, '#3a2a22');
    P.ellipse(4, 7, 3, 3, '#5a4433');
    P.px(1, 0, '#3a2a22'); P.px(7, 0, '#3a2a22');
    if (blink) {
      P.rect(1, 4, 3, 1, '#1a120e'); P.rect(5, 4, 3, 1, '#1a120e');
    } else {
      P.rect(1, 3, 3, 3, '#ffd23f'); P.rect(5, 3, 3, 3, '#ffd23f');
      P.px(2 + dx, 4 + dy, '#000'); P.px(6 + dx, 4 + dy, '#000');
    }
    P.px(4, 6, '#c9781a');
  });
  owl('owl', 0, 0); owl('owl_l', -1, 0); owl('owl_r', 1, 0); owl('owl_u', 0, -1); owl('owl_b', 0, 0, true);
  canvasTex(scene, 'sign', 34, 30, (P) => {
    P.rect(15, 8, 3, 22, '#3a2618');
    P.poly([[0, 2], [28, 2], [33, 8], [28, 14], [0, 14]], '#5a3c24');
    P.rect(0, 2, 28, 1, '#6e4c30');
    const t = '#e8d9b0';
    // "STADT" in tiny letters  (3x5 font)
    const glyphs = {
      S: ['111', '100', '111', '001', '111'], T: ['111', '010', '010', '010', '010'],
      A: ['010', '101', '111', '101', '101'], D: ['110', '101', '101', '101', '110'],
    };
    let gx = 3;
    for (const ch of 'STADT') {
      glyphs[ch].forEach((row, yy) => [...row].forEach((b, xx) => b === '1' && P.px(gx + xx, 6 + yy, t)));
      gx += 4;
    }
    P.poly([[24, 5], [27, 8], [24, 11]], t);
  });
}

// ---------------- Ground strip (whole world) ----------------
function makeGround(scene) {
  canvasTex(scene, 'ground', WORLD_W, 42, (P) => {
    const R = rng(17);
    const top = 4;
    // castle stone floor
    P.rect(0, top, CASTLE_END, 38, '#2a2536');
    for (let x = 0; x < CASTLE_END; x += 16) {
      for (let row = 0; row < 5; row++) {
        const off = row % 2 ? 8 : 0;
        P.rect(x + off + 1, top + 1 + row * 8, 14, 7, R() < 0.5 ? '#3a3448' : '#342f42');
      }
    }
    P.rect(0, top, CASTLE_END, 1, '#4f4766');
    // forest soil
    P.rect(CASTLE_END, top, FOREST_END - CASTLE_END, 38, '#1e1520');
    for (let i = 0; i < 400; i++) P.px(CASTLE_END + R() * (FOREST_END - CASTLE_END), top + 3 + R() * 36, R() < 0.5 ? '#2a1e26' : '#160f18');
    for (let x = CASTLE_END; x < FOREST_END; x++) {
      P.rect(x, top, 1, 2 + Math.floor(R() * 2), '#1f3322');
      if (R() < 0.35) P.rect(x, top - 1 - Math.floor(R() * 3), 1, 2, R() < 0.5 ? '#2a4a2a' : '#1f3322');
    }
    // city: sidewalk, curb, road
    const cx = FOREST_END;
    const cw = WORLD_W - FOREST_END;
    P.rect(cx, top, cw, 8, '#4a4757');
    for (let x = cx; x < WORLD_W; x += 16) P.rect(x, top, 1, 8, '#3a3846');
    P.rect(cx, top, cw, 1, '#5e5a6e');
    P.rect(cx, top + 8, cw, 3, '#6a6678');
    P.rect(cx, top + 11, cw, 27, '#1f1d27');
    for (let i = 0; i < 600; i++) P.px(cx + R() * cw, top + 12 + R() * 26, R() < 0.5 ? '#2a2733' : '#18161f');
    for (let x = cx + 6; x < WORLD_W; x += 26) P.rect(x, top + 25, 12, 2, '#8a7a3a');
    // blend castle → forest
    for (let x = CASTLE_END - 20; x < CASTLE_END + 20; x++) {
      if (R() < (x - CASTLE_END + 20) / 40) P.rect(x, top, 1, 38, '#1e1520');
    }
    // blend forest → city
    for (let x = cx - 10; x < cx; x++) P.rect(x, top + 8, 1, 30, '#1e1520');
  });
}

// ---------------- Parallax layers ----------------
// Both layers are drawn with their ground line at LAYER_BASE; their width
// covers the whole world at their scroll factor.
function makeLayers(scene) {
  const LH = 360;
  const B = LAYER_BASE;
  const farW = Math.ceil(0.3 * (WORLD_W - W) + W) + 4;
  const midW = Math.ceil(0.6 * (WORLD_W - W) + W) + 4;
  const cityFar = Math.round(0.3 * (FOREST_END - W)) + 140;
  const cityMid = Math.round(0.6 * (FOREST_END - W)) + 220;

  canvasTex(scene, 'far', farW, LH, (P) => {
    const R = rng(23);
    const c = '#1b1432';
    for (let x = 0; x < farW; x++) {
      const y = B - 57 + Math.sin(x * 0.012) * 14 + Math.sin(x * 0.031 + 1) * 6;
      P.rect(x, y, 1, LH - y, c);
      if (x < cityFar && R() < 0.08) P.rect(x, y - 3 - R() * 6, 1, 8, c);
    }
    // distant castle silhouette on a hill
    const cy = B - 262;
    P.rect(70, cy + 160, 40, 50, c); P.rect(64, cy + 140, 12, 70, c); P.rect(104, cy + 130, 12, 80, c);
    P.poly([[62, cy + 140], [70, cy + 124], [78, cy + 140]], c); P.poly([[102, cy + 130], [110, cy + 112], [118, cy + 130]], c);
    // modern skyline
    let x = cityFar;
    while (x < farW) {
      const w = 18 + Math.floor(R() * 40);
      const hgt = 60 + Math.floor(R() * 200 * Math.min(1, (x - cityFar + 20) / 300));
      const top = B - 47 - hgt;
      const col = R() < 0.5 ? '#1a1330' : '#1e1736';
      P.rect(x, top, w, LH - top, col);
      if (R() < 0.35) P.rect(x + Math.floor(w / 2), top - 14, 1, 14, col);
      if (R() < 0.2) P.poly([[x, top], [x + w, top], [x + w / 2, top - 16]], col);
      for (let wy = top + 4; wy < B - 52; wy += 5) {
        for (let wx = x + 2; wx < x + w - 2; wx += 4) {
          if (R() < 0.12) P.px(wx, wy, R() < 0.7 ? '#5c4a2a' : '#7d6a3a');
        }
      }
      if (R() < 0.25) P.px(x + Math.floor(w / 2), top - 15, '#ff3b3b');
      x += w + Math.floor(R() * 6);
    }
  });

  canvasTex(scene, 'mid', midW, LH, (P) => {
    const R = rng(29);
    const tc = '#160f25';
    P.rect(0, B - 12, midW, LH - B + 12, tc);
    for (let i = 0; i < 80; i++) {
      const x = R() * (cityMid + 100);
      const h = 50 + R() * 80;
      branch(P, R, x, B - 10, -Math.PI / 2, h * 0.5, 4, 3, tc);
    }
    let x = cityMid;
    while (x < midW) {
      const w = 34 + Math.floor(R() * 60);
      const hgt = 70 + Math.floor(R() * 150);
      const top = B - 12 - hgt;
      const col = R() < 0.5 ? '#211836' : '#251b3d';
      P.rect(x, top, w, LH - top, col);
      P.rect(x, top, w, 2, shade(col, 0.15));
      for (let wy = top + 6; wy < B - 18; wy += 9) {
        for (let wx = x + 4; wx < x + w - 5; wx += 7) {
          const lit = R() < 0.22;
          P.rect(wx, wy, 3, 4, lit ? (R() < 0.8 ? '#c79a3e' : '#7fd1c4') : '#191329');
        }
      }
      if (R() < 0.3) {
        const tx = x + 6 + R() * (w - 20);
        P.rect(tx, top - 14, 12, 9, col); P.rect(tx + 1, top - 5, 1, 5, col); P.rect(tx + 10, top - 5, 1, 5, col);
        P.poly([[tx - 1, top - 14], [tx + 13, top - 14], [tx + 6, top - 20]], col);
      }
      if (R() < 0.25) {
        const sx = x + 4;
        P.rect(sx, top + 10, 4, 22, '#b03a7a');
        for (let k = 0; k < 4; k++) P.rect(sx + 1, top + 12 + k * 5, 2, 3, '#ff7ac8');
      }
      x += w + Math.floor(R() * 10);
    }
  });
}

// Soil below the ground line (seen when the camera dips underground).
function makeEarth(scene) {
  canvasTex(scene, 'earth', 64, 64, (P) => {
    const R = rng(81);
    P.rect(0, 0, 64, 64, '#1a1217');
    for (let i = 0; i < 90; i++) P.px(R() * 64, R() * 64, R() < 0.5 ? '#241a20' : '#130d11');
    for (let i = 0; i < 5; i++) {
      const x = R() * 60, y = R() * 60, r = 1 + Math.floor(R() * 2);
      P.circle(x, y, r, '#2c2530');
      P.px(x - r + 1, y - r + 1, '#3a3240');
    }
    let x = R() * 64, y = 0;
    for (let k = 0; k < 30; k++) { P.px(x, y, '#2a1c14'); y += 1; x += Math.round(R() * 2 - 1); }
  });
}

export function makeEnvironment(scene) {
  makeFx(scene);
  makeSky(scene);
  makeCastle(scene);
  makeGraveyard(scene);
  makeTrees(scene);
  makeGround(scene);
  makeLayers(scene);
  makeEarth(scene);
}
