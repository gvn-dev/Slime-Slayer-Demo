const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const outDir = path.join(__dirname, '..', 'Art');
const colors = {
  ink: '#15171c', shadow: '#22262b', armor: '#393b3e', armorLight: '#54565a',
  silver: '#9ea9ae', silverLight: '#e1e8e8', silverShade: '#69777f',
  cloak: '#283a34', cloakMid: '#344a40', cloakLight: '#4d6254',
  leather: '#553c30', leatherMid: '#74523b', leatherLight: '#9c7048',
  gold: '#bd914f', goldLight: '#e6c278', skin: '#bd8b63', skinLight: '#d7a678',
  skinShade: '#865d46', hair: '#1b1e24', hairLight: '#343840', cloth: '#c4c2b8',
  boot: '#27292e'
};

function rgba(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}
function canvas(width, height) { return { width, height, data: Buffer.alloc(width * height * 4) }; }
function pixel(c, x, y, color) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= c.width || y >= c.height) return;
  c.data.set(rgba(color), (y * c.width + x) * 4);
}
function rect(c, x, y, w, h, color) {
  for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) pixel(c, px, py, color);
}
function line(c, x0, y0, x1, y1, color, thickness = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
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
function stroke(c, points, color = colors.ink) {
  for (let i = 0; i < points.length; i++) line(c, ...points[i], ...points[(i + 1) % points.length], color);
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let value = n;
  for (let i = 0; i < 8; i++) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const tag = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([len, tag, data, sum]);
}
function writePng(name, c) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(c.width, 0); header.writeUInt32BE(c.height, 4); header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((c.width * 4 + 1) * c.height);
  for (let y = 0; y < c.height; y++) c.data.copy(rows, y * (c.width * 4 + 1) + 1, y * c.width * 4, (y + 1) * c.width * 4);
  fs.writeFileSync(path.join(outDir, name), Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(rows, { level: 9 })), pngChunk('IEND', Buffer.alloc(0))
  ]));
}

function buildBody() {
  const c = canvas(64, 64);
  const cloak = [[22, 11], [42, 11], [50, 21], [55, 36], [51, 48], [47, 60], [38, 58], [31, 62], [24, 58], [16, 61], [11, 48], [8, 36], [13, 22]];
  polygon(c, cloak, colors.ink); stroke(c, cloak);
  polygon(c, [[23, 14], [41, 14], [47, 23], [51, 36], [47, 48], [43, 56], [37, 54], [31, 58], [25, 55], [19, 57], [14, 47], [12, 36], [16, 24]], colors.cloak);
  polygon(c, [[17, 32], [24, 35], [27, 53], [23, 57], [18, 55], [13, 45]], colors.cloakMid);
  polygon(c, [[43, 29], [49, 27], [53, 38], [48, 52], [43, 56], [39, 52]], colors.cloakMid);
  line(c, 18, 38, 23, 52, colors.cloakLight, 2); line(c, 46, 35, 43, 49, colors.cloakLight, 2);
  polygon(c, [[21, 50], [30, 53], [29, 62], [22, 63], [18, 58]], colors.ink);
  polygon(c, [[34, 53], [44, 49], [47, 58], [41, 63], [35, 61]], colors.ink);
  rect(c, 21, 57, 7, 4, colors.boot); rect(c, 38, 57, 7, 4, colors.boot);
  rect(c, 22, 57, 2, 2, colors.silverShade); rect(c, 39, 57, 2, 2, colors.silverShade);

  const tunic = [[20, 21], [27, 18], [38, 18], [46, 23], [48, 39], [43, 49], [21, 49], [15, 39]];
  polygon(c, tunic, colors.ink); stroke(c, tunic);
  polygon(c, [[22, 24], [28, 21], [37, 21], [43, 25], [45, 39], [40, 46], [23, 46], [18, 38]], colors.leather);
  polygon(c, [[23, 26], [29, 23], [33, 26], [32, 44], [24, 44], [19, 38]], colors.leatherMid);
  polygon(c, [[37, 23], [42, 26], [44, 38], [39, 43], [34, 41], [34, 27]], colors.armor);
  line(c, 23, 25, 28, 22, colors.leatherLight, 2);
  rect(c, 23, 44, 18, 3, colors.ink); rect(c, 25, 44, 14, 2, colors.gold);
  rect(c, 31, 43, 4, 4, colors.goldLight); pixel(c, 32, 44, colors.ink);
  line(c, 26, 29, 29, 27, colors.silverShade, 2); line(c, 39, 30, 41, 35, colors.armorLight, 2);

  const leftShoulder = [[10, 24], [16, 19], [23, 22], [23, 30], [19, 37], [12, 35], [8, 30]];
  const rightShoulder = [[41, 22], [48, 19], [55, 24], [56, 30], [51, 36], [44, 35], [40, 29]];
  for (const shape of [leftShoulder, rightShoulder]) { polygon(c, shape, colors.ink); stroke(c, shape); }
  polygon(c, [[11, 25], [16, 22], [20, 24], [19, 29], [13, 32], [9, 29]], colors.leatherMid);
  polygon(c, [[45, 24], [49, 22], [53, 25], [53, 30], [47, 32], [43, 29]], colors.leatherMid);
  line(c, 11, 24, 16, 20, colors.gold, 2); line(c, 48, 20, 54, 24, colors.gold, 2);
  pixel(c, 15, 26, colors.goldLight); pixel(c, 49, 26, colors.goldLight);
  polygon(c, [[10, 33], [17, 35], [18, 43], [14, 47], [9, 41]], colors.cloth);
  polygon(c, [[47, 35], [54, 33], [56, 41], [51, 47], [46, 43]], colors.cloth);
  line(c, 10, 36, 15, 38, colors.silverShade, 2); line(c, 53, 36, 49, 39, colors.silverShade, 2);

  const hair = [[21, 4], [26, 2], [32, 4], [37, 2], [43, 6], [46, 11], [44, 17], [40, 20], [34, 18], [28, 20], [21, 17], [17, 12], [18, 7]];
  polygon(c, hair, colors.ink); stroke(c, hair);
  polygon(c, [[22, 6], [27, 4], [32, 6], [37, 4], [42, 8], [44, 12], [41, 16], [36, 16], [31, 18], [25, 16], [20, 12]], colors.hair);
  polygon(c, [[25, 8], [30, 5], [32, 9], [28, 13], [23, 13]], colors.hairLight);
  polygon(c, [[35, 7], [40, 8], [42, 11], [38, 14], [34, 13]], colors.hairLight);
  polygon(c, [[25, 10], [39, 10], [41, 15], [38, 20], [33, 23], [27, 21], [23, 17]], colors.skinShade);
  polygon(c, [[26, 11], [38, 11], [39, 16], [36, 19], [31, 20], [26, 17]], colors.skin);
  rect(c, 27, 11, 8, 3, colors.skinLight);
  line(c, 26, 15, 30, 15, colors.ink, 2); line(c, 35, 15, 39, 14, colors.ink, 2);
  pixel(c, 28, 16, colors.ink); pixel(c, 36, 15, colors.ink); line(c, 31, 17, 33, 18, colors.skinShade, 1);
  polygon(c, [[28, 20], [35, 20], [37, 24], [33, 26], [29, 24]], colors.cloth);
  polygon(c, [[29, 20], [34, 20], [35, 22], [32, 23], [29, 22]], colors.silverLight);
  rect(c, 30, 23, 4, 2, colors.gold); pixel(c, 32, 23, colors.goldLight);
  return c;
}

function buildSword() {
  const c = canvas(50, 22);
  const blade = [[15, 6], [39, 6], [48, 11], [39, 16], [15, 16]];
  polygon(c, blade, colors.ink); stroke(c, blade);
  polygon(c, [[17, 8], [38, 8], [44, 11], [38, 14], [17, 14]], colors.silver);
  line(c, 18, 8, 39, 8, colors.silverLight, 1);
  line(c, 19, 12, 39, 12, colors.silverShade, 1);
  pixel(c, 45, 11, colors.silverLight); pixel(c, 42, 10, colors.silverLight);
  const guard = [[12, 5], [15, 4], [18, 7], [18, 15], [15, 18], [12, 17], [14, 12], [14, 10]];
  polygon(c, guard, colors.ink); stroke(c, guard);
  line(c, 14, 6, 16, 8, colors.goldLight, 2); line(c, 16, 15, 14, 17, colors.gold, 2);
  line(c, 3, 11, 13, 11, colors.ink, 6);
  line(c, 4, 11, 13, 11, colors.leatherMid, 3);
  line(c, 6, 9, 8, 13, colors.gold, 1); line(c, 9, 9, 11, 13, colors.gold, 1);
  polygon(c, [[1, 8], [4, 8], [5, 11], [4, 14], [1, 14], [0, 11]], colors.ink);
  rect(c, 1, 10, 3, 2, colors.gold); pixel(c, 2, 10, colors.goldLight);
  return c;
}

fs.mkdirSync(outDir, { recursive: true });
writePng('Aram top-down sprite.png', buildBody());
writePng('Aram shortsword.png', buildSword());
