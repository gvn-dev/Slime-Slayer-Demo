const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const outDir = path.join(__dirname, '..', 'Art');
const P = {
  ink: '#171923', blue: '#327dc0', blueHi: '#70c6f5', blueLight: '#c1edff', blueShade: '#1d4e87',
  green: '#5aab43', greenHi: '#93d75c', greenLight: '#dbf59d', greenShade: '#35713b',
  red: '#c8433b', redHi: '#f47752', redLight: '#ffc181', redShade: '#812b35',
  yellow: '#d6b332', yellowHi: '#ffe568', yellowLight: '#fff4a6', yellowShade: '#8a6828',
  black: '#393344', blackHi: '#74668d', blackLight: '#b2a0cc', blackShade: '#211f2d',
  glass: '#e6eee4', glassHi: '#fff8dd', cork: '#71472d', corkHi: '#bd8650'
};
const palettes = {
  blue: { ink: P.ink, base: P.blue, light: P.blueHi, shine: P.blueLight, shade: P.blueShade },
  green: { ink: P.ink, base: P.green, light: P.greenHi, shine: P.greenLight, shade: P.greenShade },
  red: { ink: P.ink, base: P.red, light: P.redHi, shine: P.redLight, shade: P.redShade },
  yellow: { ink: P.ink, base: P.yellow, light: P.yellowHi, shine: P.yellowLight, shade: P.yellowShade },
  black: { ink: P.ink, base: P.black, light: P.blackHi, shine: P.blackLight, shade: P.blackShade }
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
function outline(c, points, color) { for (let i = 0; i < points.length; i++) line(c, ...points[i], ...points[(i + 1) % points.length], color); }

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let value = n;
  for (let i = 0; i < 8; i++) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(buffer) { let value = 0xffffffff; for (const byte of buffer) value = crcTable[(value ^ byte) & 255] ^ (value >>> 8); return (value ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const tag = Buffer.from(type, 'ascii'), len = Buffer.alloc(4), sum = Buffer.alloc(4);
  len.writeUInt32BE(data.length); sum.writeUInt32BE(crc32(Buffer.concat([tag, data])));
  return Buffer.concat([len, tag, data, sum]);
}
function writePng(name, c) {
  const header = Buffer.alloc(13); header.writeUInt32BE(c.width, 0); header.writeUInt32BE(c.height, 4); header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc((c.width * 4 + 1) * c.height);
  for (let y = 0; y < c.height; y++) c.data.copy(rows, y * (c.width * 4 + 1) + 1, y * c.width * 4, (y + 1) * c.width * 4);
  fs.writeFileSync(path.join(outDir, name), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]));
}

const bodies = {
  blue: [[12, 41], [9, 34], [11, 25], [17, 18], [26, 14], [35, 15], [45, 19], [52, 27], [53, 36], [48, 44], [41, 50], [29, 52], [19, 49]],
  green: [[10,40],[9,33],[12,25],[18,19],[25,16],[32,15],[39,16],[46,20],[51,26],[54,34],[53,41],[48,47],[40,51],[32,53],[24,52],[16,48]],
  red: [[10,40],[9,33],[12,25],[18,19],[25,16],[32,15],[39,16],[46,20],[51,26],[54,34],[53,41],[48,47],[40,51],[32,53],[24,52],[16,48]],
  yellow: [[10,40],[9,33],[12,25],[18,19],[25,16],[32,15],[39,16],[46,20],[51,26],[54,34],[53,41],[48,47],[40,51],[32,53],[24,52],[16,48]],
  black: [[10,40],[9,33],[12,25],[18,19],[25,16],[32,15],[39,16],[46,20],[51,26],[54,34],[53,41],[48,47],[40,51],[32,53],[24,52],[16,48]]
};

function buildSlime(type) {
  const c = canvas(64, 64), p = palettes[type], shape = bodies[type];
  polygon(c, shape, p.ink); outline(c, shape, p.ink);
  const inner = shape.map(([x, y]) => [32 + (x - 32) * 0.84, 33 + (y - 33) * 0.84]);
  polygon(c, inner, p.shade);
  const body = inner.map(([x, y]) => [32 + (x - 32) * 0.88, 33 + (y - 33) * 0.88 - 2]);
  polygon(c, body, p.base);
  polygon(c, [[18, 31], [20, 25], [26, 21], [31, 23], [27, 27], [24, 33], [19, 36]], p.light);
  polygon(c, [[38, 23], [44, 25], [48, 31], [46, 35], [42, 30]], p.light);
  line(c, 16, 41, 22, 46, p.shade, 2); line(c, 43, 45, 48, 40, p.shade, 2);
  // Shared expressive pixel face keeps the five silhouettes in one game style.
  rect(c, 22, 31, 5, 7, p.ink); rect(c, 37, 31, 5, 7, p.ink);
  pixel(c, 23, 32, p.shine); pixel(c, 38, 32, p.shine);
  if (type === 'red') {
    line(c, 20, 28, 27, 30, p.ink, 2); line(c, 36, 30, 43, 28, p.ink, 2);
    line(c, 29, 41, 35, 41, p.ink, 2); pixel(c, 31, 43, p.light);
  } else if (type === 'yellow') {
    line(c, 28, 41, 35, 38, p.ink, 2); pixel(c, 36, 38, p.ink);
    pixel(c, 16, 34, p.shine);
  } else if (type === 'black') {
    line(c, 28, 42, 35, 42, p.ink, 2); pixel(c, 31, 39, p.shine);

  } else {
    line(c, 28, 41, 35, 41, p.ink, 2); pixel(c, 34, 43, p.ink);
  }

  if (type === 'blue') { pixel(c, 48, 29, p.shine); pixel(c, 47, 28, p.shine); }
  if (type === 'red') { pixel(c, 32, 15, p.shine); pixel(c, 31, 17, p.shine); }
  if (type === 'yellow') { pixel(c, 45, 29, p.shine); pixel(c, 43, 27, p.shine); }
  if (type === 'black') {
    pixel(c, 14, 33, p.shine); pixel(c, 48, 36, p.shine);
    line(c, 21, 48, 16, 53, p.ink, 2); line(c, 44, 48, 49, 53, p.ink, 2);
  }
  return c;
}

function buildPotion(type) {
  const c = canvas(48, 48), p = palettes[type];
  const bottle = [[17, 7], [31, 7], [31, 14], [35, 18], [39, 23], [39, 39], [35, 43], [13, 43], [9, 39], [9, 23], [13, 18], [17, 14]];
  polygon(c, bottle, P.ink);
  polygon(c, [[18, 10], [30, 10], [30, 16], [34, 20], [37, 24], [37, 38], [34, 40], [14, 40], [11, 38], [11, 24], [14, 20], [18, 16]], P.glass);
  // Colored potion liquid, with a staggered surface and bright pixel reflections.
  polygon(c, [[12, 27], [17, 25], [22, 27], [28, 25], [36, 27], [36, 37], [33, 39], [15, 39], [12, 37]], p.shade);
  polygon(c, [[12, 29], [18, 27], [23, 29], [29, 27], [36, 29], [36, 36], [33, 38], [15, 38], [12, 36]], p.base);
  rect(c, 17, 4, 14, 5, P.ink); rect(c, 18, 2, 12, 6, P.cork); rect(c, 20, 3, 7, 2, P.corkHi);
  rect(c, 14, 21, 3, 13, P.glassHi); pixel(c, 17, 19, P.glassHi); pixel(c, 33, 23, p.shine);
  line(c, 14, 41, 33, 41, p.light, 1);
  // A bright stopper mark and bubbles make the small bottles read at arena scale.
  pixel(c, 22, 12, P.glassHi); pixel(c, 25, 13, P.glassHi);
  pixel(c, 28, 31, p.shine); pixel(c, 20, 34, p.light);
  return c;
}

fs.mkdirSync(outDir, { recursive: true });
for (const type of Object.keys(palettes)) {
  const title = type[0].toUpperCase() + type.slice(1);
  writePng(`${title} slime pixel sprite.png`, buildSlime(type));
  writePng(`${title} slime potion.png`, buildPotion(type));
}

const king=buildSlime('blue');
polygon(king,[[14,20],[11,5],[23,12],[32,2],[41,12],[53,5],[50,20]],'#493119');
polygon(king,[[16,18],[14,9],[24,15],[32,6],[40,15],[50,9],[48,18]],'#efbd43');
rect(king,16,18,33,5,'#ffd96b');
rect(king,20,18,4,4,'#e64d66');rect(king,30,17,5,5,'#5de4d3');rect(king,41,18,4,4,'#a772ec');
// Two layered, curled lobes with jagged tips give the king a bushy white mustache.
const whisker=[[32,39],[27,37],[23,38],[19,40],[14,39],[10,35],[11,42],[15,47],[20,49],[25,48],[30,44],[32,42]];
for(const flip of [false,true]) {
 const points=whisker.map(([x,y])=>[flip?64-x:x,y]);
 polygon(king,points,'#aabacb');outline(king,points,'#35465d');
 polygon(king,points.map(([x,y])=>[32+(x-32)*.92,y-1]),'#fffdf5');
}
line(king,16,43,23,44,'#e0e8ef');line(king,41,44,48,43,'#e0e8ef');
writePng('King slime pixel sprite.png',king);
