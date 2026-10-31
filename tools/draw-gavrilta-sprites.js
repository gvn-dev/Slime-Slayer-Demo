const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const outDir = path.join(__dirname, '..', 'Art');
const C = {
  outline: '#17151e', shadow: '#292438', cloak: '#363052', cloakMid: '#49416f', cloakLight: '#665b91',
  violet: '#514786', violetLight: '#7772b8', gold: '#b47d3e', goldLight: '#e0b361',
  hair: '#452a22', hairLight: '#70432d', hairHi: '#95603a', skin: '#82a543', skinLight: '#a9c45b',
  skinShade: '#5d7837', boot: '#302723', wood: '#573d2e', woodLight: '#876044', crystal: '#44cf5d',
  crystalLight: '#a5f178', crystalDark: '#198c43'
};

function rgba(hex) { const n = Number.parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255]; }
function canvas(width, height) { return { width, height, data: Buffer.alloc(width * height * 4) }; }
function pixel(c, x, y, color) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= c.width || y >= c.height) return;
  c.data.set(rgba(color), (y * c.width + x) * 4);
}
function rect(c, x, y, w, h, color) { for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) pixel(c, px, py, color); }
function line(c, x0, y0, x1, y1, color, thickness = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    rect(c, x0 - Math.floor(thickness / 2), y0 - Math.floor(thickness / 2), thickness, thickness, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function polygon(c, points, color) {
  const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
  const maxY = Math.min(c.height - 1, Math.ceil(Math.max(...points.map(p => p[1]))));
  for (let y = minY; y <= maxY; y++) {
    const xs = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.ceil(xs[i]); x <= Math.floor(xs[i + 1]); x++) pixel(c, x, y, color);
  }
}
function outline(c, points, color = C.outline) { for (let i = 0; i < points.length; i++) line(c, ...points[i], ...points[(i + 1) % points.length], color); }

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let value = n;
  for (let i = 0; i < 8; i++) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(buffer) { let value = 0xffffffff; for (const byte of buffer) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8); return (value ^ 0xffffffff) >>> 0; }
function pngChunk(type, data) {
  const tag = Buffer.from(type, 'ascii'), len = Buffer.alloc(4), sum = Buffer.alloc(4);
  len.writeUInt32BE(data.length); sum.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([len, tag, data, sum]);
}
function writePng(name, c) {
  const header = Buffer.alloc(13); header.writeUInt32BE(c.width, 0); header.writeUInt32BE(c.height, 4); header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((c.width * 4 + 1) * c.height);
  for (let y = 0; y < c.height; y++) c.data.copy(rows, y * (c.width * 4 + 1) + 1, y * c.width * 4, (y + 1) * c.width * 4);
  fs.writeFileSync(path.join(outDir, name), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', header), pngChunk('IDAT', zlib.deflateSync(rows, { level: 9 })), pngChunk('IEND', Buffer.alloc(0))]));
}

function buildBody() {
  const c = canvas(64, 64);
  const cape = [[23, 18], [41, 18], [49, 26], [53, 43], [48, 55], [40, 60], [32, 57], [24, 61], [15, 55], [10, 43], [14, 28]];
  polygon(c, cape, C.outline); outline(c, cape);
  polygon(c, [[24, 21], [40, 21], [46, 27], [50, 42], [45, 52], [39, 57], [32, 54], [25, 57], [18, 52], [14, 42], [17, 29]], C.cloak);
  polygon(c, [[16, 32], [23, 28], [25, 49], [20, 54], [15, 47], [13, 40]], C.cloakMid);
  polygon(c, [[42, 28], [48, 31], [51, 41], [47, 50], [42, 54], [39, 48]], C.cloakMid);
  polygon(c, [[18, 42], [24, 45], [26, 54], [22, 58], [17, 53]], C.violet);
  polygon(c, [[39, 47], [46, 43], [49, 51], [43, 58], [38, 56]], C.violet);
  line(c, 17, 37, 22, 49, C.cloakLight, 2); line(c, 47, 36, 43, 49, C.cloakLight, 2);
  line(c, 17, 50, 24, 57, C.gold, 2); line(c, 47, 49, 41, 57, C.gold, 2);
  polygon(c, [[22, 51], [29, 54], [28, 62], [20, 62], [17, 57]], C.outline);
  polygon(c, [[35, 54], [43, 50], [47, 57], [42, 62], [35, 61]], C.outline);
  rect(c, 20, 58, 7, 3, C.boot); rect(c, 39, 58, 7, 3, C.boot);
  rect(c, 21, 58, 2, 1, C.goldLight); rect(c, 40, 58, 2, 1, C.goldLight);
  // Gold filigree down the back of the cloak.
  polygon(c, [[30, 29], [33, 27], [36, 31], [34, 35], [37, 39], [33, 44], [32, 50], [29, 45], [31, 40], [28, 36], [31, 33]], C.gold);
  pixel(c, 32, 31, C.goldLight); pixel(c, 33, 39, C.goldLight); pixel(c, 31, 46, C.goldLight);

  // Brown hair framing a green face, viewed from above.
  const hair = [[21, 7], [27, 3], [37, 4], [43, 10], [45, 19], [42, 25], [37, 29], [27, 28], [20, 24], [17, 17]];
  polygon(c, hair, C.outline); outline(c, hair);
  polygon(c, [[23, 8], [28, 5], [36, 6], [41, 11], [43, 18], [39, 23], [35, 27], [28, 26], [22, 22], [19, 16]], C.hair);
  polygon(c, [[22, 9], [28, 6], [31, 8], [28, 14], [23, 16], [20, 14]], C.hairLight);
  polygon(c, [[33, 7], [38, 8], [42, 13], [40, 17], [35, 15], [32, 11]], C.hairLight);
  polygon(c, [[22, 17], [27, 15], [29, 20], [26, 25], [22, 23], [19, 20]], C.hair);
  polygon(c, [[38, 17], [42, 18], [41, 22], [37, 26], [34, 23]], C.hairLight);
  const face = [[26, 11], [36, 11], [39, 16], [38, 21], [34, 25], [28, 24], [24, 20], [24, 15]];
  polygon(c, face, C.skinShade); outline(c, face);
  polygon(c, [[27, 12], [35, 12], [37, 16], [36, 20], [33, 23], [29, 22], [26, 19], [26, 15]], C.skin);
  line(c, 27, 15, 31, 15, C.outline, 2); line(c, 34, 15, 37, 15, C.outline, 2);
  pixel(c, 29, 16, C.goldLight); pixel(c, 35, 16, C.goldLight);
  pixel(c, 32, 18, C.skinLight); line(c, 30, 21, 34, 21, C.skinShade, 1);
  // A small jeweled collar echoes the gold rune stitching in her portrait.
  polygon(c, [[26, 26], [32, 24], [38, 27], [35, 31], [29, 30]], C.gold);
  pixel(c, 32, 27, C.crystal); pixel(c, 32, 28, C.crystalLight);
  return c;
}

function buildStaff() {
  const c = canvas(28, 72);
  line(c, 12, 64, 16, 22, C.outline, 6);
  line(c, 13, 63, 16, 22, C.wood, 3);
  line(c, 14, 57, 15, 52, C.gold, 2); line(c, 14, 43, 15, 38, C.gold, 2); line(c, 15, 30, 16, 26, C.goldLight, 2);
  // Forked, thorn-wrapped crown around a green crystal.
  line(c, 15, 28, 8, 19, C.outline, 4); line(c, 15, 28, 22, 18, C.outline, 4);
  line(c, 15, 28, 8, 19, C.woodLight, 2); line(c, 15, 28, 22, 18, C.woodLight, 2);
  line(c, 9, 20, 5, 13, C.outline, 3); line(c, 21, 20, 24, 12, C.outline, 3);
  line(c, 9, 20, 5, 13, C.wood, 1); line(c, 21, 20, 24, 12, C.wood, 1);
  const gem = [[14, 2], [19, 8], [19, 15], [15, 22], [9, 16], [8, 9]];
  polygon(c, gem, C.outline); outline(c, gem);
  polygon(c, [[14, 4], [17, 9], [17, 14], [15, 19], [11, 15], [10, 9]], C.crystalDark);
  polygon(c, [[14, 4], [17, 9], [14, 13], [10, 9]], C.crystal);
  polygon(c, [[14, 4], [14, 13], [11, 15], [10, 9]], C.crystalLight);
  pixel(c, 12, 7, '#dcffad'); pixel(c, 13, 8, '#dcffad');
  line(c, 11, 23, 19, 23, C.gold, 2); pixel(c, 12, 24, C.goldLight);
  return c;
}

fs.mkdirSync(outDir, { recursive: true });
writePng('Gavrilta top-down sprite.png', buildBody());
writePng('Gavrilta thorn staff.png', buildStaff());
