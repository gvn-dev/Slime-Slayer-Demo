const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const outDir = path.join(__dirname, '..', 'Art');
const palette = {
  outline: '#17171d', nearBlack: '#24242a', blackIron: '#302f34', iron: '#49474b',
  ironLight: '#68615d', ironBright: '#8a7866', goldDark: '#76502d', gold: '#c48a3e',
  goldLight: '#f0c16a', hairDark: '#6f2b15', hair: '#a9431d', hairLight: '#d3652a',
  hairBright: '#eb8a3c', skin: '#b78359', skinLight: '#d6a36d', skinShadow: '#80543d',
  cloth: '#662f2b', clothLight: '#883c31', steel: '#aeb0ac', steelLight: '#d2d1c7',
  wood: '#71432d', woodLight: '#a66a3a', ember: '#c94e24'
};

function rgba(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

function canvas(width, height) {
  return { width, height, data: Buffer.alloc(width * height * 4) };
}

function pixel(c, x, y, color) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= c.width || y >= c.height) return;
  const i = (y * c.width + x) * 4;
  c.data.set(rgba(color), i);
}

function rect(c, x, y, width, height, color) {
  for (let py = y; py < y + height; py++) for (let px = x; px < x + width; px++) pixel(c, px, py, color);
}

function line(c, x0, y0, x1, y1, color, thickness = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;
  while (true) {
    rect(c, x0 - Math.floor(thickness / 2), y0 - Math.floor(thickness / 2), thickness, thickness, color);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * error;
    if (e2 >= dy) { error += dy; x0 += sx; }
    if (e2 <= dx) { error += dx; y0 += sy; }
  }
}

function polygon(c, points, color) {
  const ys = points.map(p => p[1]);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(c.height - 1, Math.ceil(Math.max(...ys)));
  for (let y = minY; y <= maxY; y++) {
    const intersections = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i], [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) intersections.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1));
    }
    intersections.sort((a, b) => a - b);
    for (let i = 0; i + 1 < intersections.length; i += 2) {
      for (let x = Math.ceil(intersections[i]); x <= Math.floor(intersections[i + 1]); x++) pixel(c, x, y, color);
    }
  }
}

function outline(c, points, color = palette.outline) {
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    line(c, a[0], a[1], b[0], b[1], color);
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, 'ascii');
  const header = Buffer.alloc(4); header.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([header, name, data, checksum]);
}

function writePng(filename, c) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(c.width, 0); header.writeUInt32BE(c.height, 4);
  header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((c.width * 4 + 1) * c.height);
  for (let y = 0; y < c.height; y++) c.data.copy(rows, y * (c.width * 4 + 1) + 1, y * c.width * 4, (y + 1) * c.width * 4);
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
  fs.writeFileSync(path.join(outDir, filename), png);
}

function buildFjordBody() {
  const c = canvas(64, 64);
  const cloak = [[21, 12], [42, 12], [52, 24], [57, 39], [51, 52], [45, 61], [35, 57], [27, 62], [17, 54], [8, 41], [11, 25]];
  polygon(c, cloak, palette.outline); outline(c, cloak);
  polygon(c, [[22, 15], [41, 15], [49, 25], [53, 39], [47, 51], [43, 57], [35, 53], [28, 58], [20, 51], [13, 40], [16, 26]], palette.blackIron);
  polygon(c, [[20, 38], [44, 38], [49, 48], [42, 59], [35, 55], [28, 60], [20, 51], [15, 43]], palette.cloth);
  polygon(c, [[23, 42], [41, 42], [44, 50], [38, 57], [34, 53], [29, 57], [22, 50]], palette.clothLight);
  line(c, 25, 45, 27, 53, palette.goldDark, 2);
  line(c, 39, 45, 37, 53, palette.goldDark, 2);
  polygon(c, [[19, 52], [29, 54], [29, 62], [25, 63], [19, 60]], palette.outline);
  polygon(c, [[35, 54], [45, 51], [48, 59], [42, 63], [36, 61]], palette.outline);
  rect(c, 21, 56, 7, 4, palette.iron); rect(c, 38, 56, 7, 4, palette.iron);
  rect(c, 22, 56, 2, 2, palette.ironLight); rect(c, 39, 56, 2, 2, palette.ironLight);

  const torso = [[18, 21], [25, 18], [39, 18], [47, 23], [50, 37], [45, 46], [19, 46], [14, 37]];
  polygon(c, torso, palette.outline); outline(c, torso);
  polygon(c, [[20, 23], [26, 21], [38, 21], [45, 25], [47, 36], [42, 42], [22, 42], [17, 36]], palette.iron);
  polygon(c, [[21, 24], [26, 22], [29, 26], [28, 40], [22, 40], [18, 35]], palette.blackIron);
  polygon(c, [[38, 22], [44, 26], [46, 35], [41, 40], [36, 39], [35, 27]], palette.ironLight);
  line(c, 22, 23, 27, 22, palette.gold, 2); line(c, 38, 22, 43, 24, palette.gold, 2);
  line(c, 18, 36, 22, 41, palette.goldDark, 2); line(c, 42, 41, 46, 36, palette.goldDark, 2);
  rect(c, 30, 24, 5, 2, palette.ironBright); rect(c, 30, 28, 2, 2, palette.ironLight); rect(c, 35, 31, 2, 2, palette.ironLight);
  polygon(c, [[32, 31], [36, 34], [33, 39], [30, 35]], palette.goldDark);
  polygon(c, [[32, 32], [34, 34], [32, 37], [31, 35]], palette.goldLight);
  rect(c, 24, 42, 16, 3, palette.outline); rect(c, 26, 42, 12, 2, palette.goldDark);
  rect(c, 31, 41, 4, 4, palette.gold); pixel(c, 32, 42, palette.goldLight); pixel(c, 34, 43, palette.goldDark);

  const leftShoulder = [[8, 22], [15, 18], [22, 22], [23, 30], [19, 36], [11, 34], [6, 29]];
  const rightShoulder = [[42, 22], [49, 18], [56, 22], [58, 29], [53, 35], [45, 35], [41, 29]];
  for (const shape of [leftShoulder, rightShoulder]) {
    polygon(c, shape, palette.outline); outline(c, shape);
    polygon(c, shape.map(([x, y]) => [x + (x < 32 ? 2 : -2), y + 2]), palette.iron);
  }
  polygon(c, [[10, 23], [16, 21], [20, 24], [18, 29], [12, 30], [8, 27]], palette.ironLight);
  polygon(c, [[45, 24], [50, 21], [55, 24], [54, 29], [47, 30], [43, 27]], palette.ironLight);
  line(c, 9, 22, 15, 19, palette.gold, 2); line(c, 48, 19, 55, 22, palette.gold, 2);
  pixel(c, 14, 25, palette.goldLight); pixel(c, 50, 25, palette.goldLight);
  polygon(c, [[10, 32], [17, 34], [17, 42], [13, 45], [8, 40]], palette.blackIron);
  polygon(c, [[47, 34], [54, 31], [57, 39], [51, 45], [46, 41]], palette.blackIron);
  line(c, 10, 34, 14, 36, palette.goldDark, 2); line(c, 53, 34, 50, 37, palette.goldDark, 2);

  const mane = [[21, 4], [26, 2], [31, 4], [35, 2], [42, 5], [46, 10], [45, 17], [50, 22], [47, 28], [42, 32], [37, 36], [31, 35], [27, 32], [21, 28], [17, 23], [18, 17], [16, 11]];
  polygon(c, mane, palette.outline); outline(c, mane);
  polygon(c, [[22, 6], [27, 4], [31, 6], [35, 4], [41, 7], [44, 11], [42, 17], [46, 22], [43, 26], [39, 30], [35, 33], [30, 31], [25, 28], [20, 23], [21, 17], [18, 12]], palette.hair);
  polygon(c, [[23, 7], [27, 5], [30, 8], [28, 14], [24, 17], [21, 13]], palette.hairLight);
  polygon(c, [[34, 6], [40, 8], [42, 12], [39, 17], [35, 18], [32, 12]], palette.hairLight);
  polygon(c, [[21, 16], [26, 13], [30, 17], [29, 23], [24, 26], [20, 22]], palette.hairDark);
  polygon(c, [[37, 16], [43, 14], [46, 20], [42, 25], [37, 24], [34, 20]], palette.hairDark);
  polygon(c, [[27, 9], [37, 9], [40, 14], [38, 20], [35, 23], [28, 21], [25, 16]], palette.skinShadow);
  rect(c, 28, 10, 8, 5, palette.skin); rect(c, 30, 10, 5, 3, palette.skinLight);
  line(c, 27, 15, 31, 16, palette.outline, 2); line(c, 35, 16, 39, 14, palette.outline, 2);
  pixel(c, 30, 16, palette.outline); pixel(c, 36, 16, palette.outline);
  polygon(c, [[26, 19], [30, 20], [32, 24], [34, 20], [39, 19], [43, 23], [40, 29], [36, 34], [31, 33], [27, 30], [23, 25]], palette.hairDark);
  polygon(c, [[27, 20], [30, 22], [31, 27], [29, 31], [26, 28], [24, 24]], palette.hair);
  polygon(c, [[36, 21], [40, 21], [42, 24], [38, 29], [35, 32], [34, 27]], palette.hairLight);
  line(c, 30, 23, 31, 29, palette.hairBright, 2); line(c, 36, 24, 37, 29, palette.hair, 2);
  polygon(c, [[17, 13], [21, 14], [21, 20], [18, 22], [15, 19]], palette.hairDark);
  polygon(c, [[42, 11], [46, 12], [47, 18], [44, 21], [42, 17]], palette.hairDark);
  line(c, 18, 14, 20, 18, palette.hairLight, 2); line(c, 44, 13, 45, 17, palette.hairLight, 2);
  return c;
}

function buildShield() {
  const c = canvas(40, 48);
  const rim = [[20, 1], [33, 6], [37, 17], [35, 30], [29, 39], [20, 46], [11, 39], [5, 30], [3, 17], [7, 6]];
  polygon(c, rim, palette.outline); outline(c, rim);
  polygon(c, [[20, 4], [31, 8], [34, 18], [32, 29], [27, 37], [20, 43], [13, 37], [8, 29], [6, 18], [9, 8]], palette.goldDark);
  polygon(c, [[20, 6], [29, 10], [32, 18], [30, 28], [25, 35], [20, 40], [15, 35], [10, 28], [8, 18], [11, 10]], palette.gold);
  polygon(c, [[20, 9], [27, 12], [29, 19], [27, 27], [23, 34], [20, 37], [17, 34], [13, 27], [11, 19], [13, 12]], palette.cloth);
  polygon(c, [[13, 13], [19, 10], [19, 35], [16, 31], [12, 25], [10, 18]], palette.clothLight);
  line(c, 20, 8, 20, 39, palette.goldDark, 1);
  line(c, 8, 16, 12, 13, palette.goldLight, 2); line(c, 32, 14, 34, 19, palette.goldLight, 2);
  pixel(c, 20, 7, palette.goldLight); pixel(c, 20, 42, palette.goldDark);
  for (const [x, y] of [[9, 15], [31, 15], [8, 27], [32, 27], [14, 37], [26, 37]]) {
    pixel(c, x, y, palette.goldLight); pixel(c, x + 1, y, palette.outline);
  }
  const flame = [[20, 15], [23, 20], [22, 24], [25, 22], [26, 27], [23, 31], [20, 33], [17, 31], [14, 28], [16, 24], [18, 26], [17, 21]];
  polygon(c, flame, palette.goldDark);
  polygon(c, [[20, 18], [22, 22], [21, 26], [24, 25], [23, 29], [20, 31], [17, 29], [16, 27], [19, 28], [18, 23]], palette.goldLight);
  pixel(c, 20, 24, palette.ember); pixel(c, 20, 27, palette.ember);
  return c;
}

function buildMace() {
  const c = canvas(52, 32);
  line(c, 5, 25, 34, 8, palette.outline, 6);
  line(c, 6, 24, 34, 9, palette.wood, 3);
  line(c, 8, 22, 13, 22, palette.goldDark, 2);
  line(c, 15, 18, 20, 18, palette.ironLight, 2);
  line(c, 23, 14, 28, 14, palette.goldDark, 2);
  line(c, 31, 10, 35, 10, palette.ironBright, 3);
  pixel(c, 5, 27, palette.outline); pixel(c, 7, 27, palette.gold);
  const head = [[30, 8], [32, 3], [37, 5], [40, 1], [44, 5], [49, 5], [48, 10], [52, 13], [48, 17], [49, 22], [44, 22], [41, 28], [36, 24], [31, 25], [32, 19], [28, 16], [32, 12]];
  polygon(c, head, palette.outline); outline(c, head);
  polygon(c, [[32, 9], [35, 6], [38, 8], [41, 4], [44, 8], [48, 8], [46, 12], [49, 14], [46, 17], [46, 20], [42, 19], [40, 24], [37, 21], [33, 22], [34, 17], [31, 15], [34, 12]], palette.iron);
  polygon(c, [[35, 8], [38, 7], [39, 11], [36, 13], [33, 12]], palette.ironLight);
  polygon(c, [[41, 8], [44, 9], [45, 12], [42, 14], [39, 12]], palette.steel);
  polygon(c, [[37, 15], [42, 13], [46, 15], [43, 19], [39, 20], [35, 18]], palette.ironLight);
  polygon(c, [[39, 14], [42, 15], [41, 18], [38, 17]], palette.ember);
  pixel(c, 40, 15, palette.goldLight); pixel(c, 41, 16, palette.gold);
  polygon(c, [[31, 9], [33, 7], [35, 9], [34, 12]], palette.goldDark);
  polygon(c, [[46, 7], [49, 7], [47, 10]], palette.steelLight);
  polygon(c, [[48, 18], [51, 16], [49, 21], [46, 21]], palette.gold);
  line(c, 31, 23, 35, 21, palette.goldDark, 2);
  return c;
}

fs.mkdirSync(outDir, { recursive: true });
writePng('Fjord top-down sprite.png', buildFjordBody());
writePng('Fjord fire shield.png', buildShield());
writePng('Fjord war mace.png', buildMace());
