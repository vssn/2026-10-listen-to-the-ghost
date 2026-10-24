// Small helpers to paint crisp pixel-art into canvas textures.

export function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function painter(ctx) {
  const P = {
    ctx,
    rect(x, y, w, h, c) {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    },
    px(x, y, c) {
      ctx.fillStyle = c;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    },
    circle(cx, cy, r, c) {
      ctx.fillStyle = c;
      for (let y = -r; y <= r; y++) {
        const hw = Math.round(Math.sqrt(r * r - y * y));
        ctx.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
      }
    },
    ellipse(cx, cy, rx, ry, c) {
      ctx.fillStyle = c;
      for (let y = -ry; y <= ry; y++) {
        const hw = Math.round(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
        ctx.fillRect(Math.round(cx - hw), Math.round(cy + y), hw * 2 + 1, 1);
      }
    },
    line(x0, y0, x1, y1, w, c) {
      ctx.fillStyle = c;
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
      const s = Math.max(1, Math.round(w));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t;
        ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s);
      }
    },
    // Scanline polygon fill – no anti-aliasing.
    poly(pts, c) {
      ctx.fillStyle = c;
      let minY = Infinity, maxY = -Infinity;
      for (const [, y] of pts) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
      for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
        const yc = y + 0.5;
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [xi, yi] = pts[i];
          const [xj, yj] = pts[(i + 1) % pts.length];
          if ((yi <= yc && yj > yc) || (yj <= yc && yi > yc)) {
            xs.push(xi + ((yc - yi) * (xj - xi)) / (yj - yi));
          }
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) {
          const a = Math.round(xs[k]);
          const b = Math.round(xs[k + 1]);
          if (b > a) ctx.fillRect(a, y, b - a, 1);
        }
      }
    },
    // Run drawing calls in "eraser" mode (punch transparent holes).
    erase(fn) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      fn('#000');
      ctx.restore();
    },
    // Arched (gothic) window shape: rect with round top.
    arch(x, y, w, h, c) {
      const r = Math.floor(w / 2);
      P.circle(x + r, y + r, r, c);
      P.rect(x, y + r, w + (w % 2 === 0 ? 1 : 0), h - r, c);
    },
  };
  return P;
}

export function canvasTex(scene, key, w, h, draw, { mirror = false } = {}) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  if (mirror) {
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  draw(painter(ctx), ctx);
  if (mirror) ctx.restore();
  tex.refresh();
  return tex;
}

// Build a texture from a list of strings, one char per pixel.
export function pixelTex(scene, key, rows, palette) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  return canvasTex(scene, key, w, h, (P) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const c = palette[row[x]];
        if (c) P.px(x, y, c);
      }
    });
  });
}

// Vertical banded gradient (pixel-art style, no smooth blending).
export function bands(P, x, y, w, h, colors) {
  const n = colors.length;
  for (let i = 0; i < n; i++) {
    const y0 = y + Math.round((h * i) / n);
    const y1 = y + Math.round((h * (i + 1)) / n);
    P.rect(x, y0, w, y1 - y0, colors[i]);
  }
}

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  const h = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}`;
}
