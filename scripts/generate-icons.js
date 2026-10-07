import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = data.length;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(len, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function generateIconPNG(size) {
  const width = size;
  const height = size;
  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);

  // Colors in RGBA
  // Background: Soft luxury cream-mint gradient
  // Center: Warm ivory squircle card with soft gold P and sparkle
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowBytes + 1);
    raw[rowOffset] = 0; // Filter byte: None

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const nx = (x / width) * 2 - 1; // -1 to 1
      const ny = (y / height) * 2 - 1; // -1 to 1

      // Rounded squircle mask for Apple iOS
      const dist = Math.pow(Math.abs(nx), 4) + Math.pow(Math.abs(ny), 4);

      // Default background: elegant pastel cream/mint
      let r = 246 - Math.floor(ny * 10);
      let g = 244 - Math.floor(ny * 12);
      let b = 238 - Math.floor(ny * 8);
      let a = 255;

      // Inner squircle tile
      const innerDist = Math.pow(Math.abs(nx * 1.3), 3.5) + Math.pow(Math.abs(ny * 1.3), 3.5);
      if (innerDist < 0.85) {
        // Inner card: Soft pastel mint-white
        r = 230 + Math.floor(nx * 15);
        g = 244 + Math.floor(ny * 10);
        b = 236 + Math.floor(ny * 15);
      }

      // Draw elegant central "P" shape
      // Stem of P: x between -0.35 and -0.15, y between -0.45 and 0.45
      const inStem = nx >= -0.32 && nx <= -0.16 && ny >= -0.42 && ny <= 0.42;
      // Loop of P: x between -0.2 and 0.28, y between -0.42 and 0.05
      const inLoopOuter = Math.pow((nx - -0.05) / 0.32, 2) + Math.pow((ny - -0.18) / 0.24, 2) <= 1.0;
      const inLoopInner = Math.pow((nx - -0.05) / 0.17, 2) + Math.pow((ny - -0.18) / 0.11, 2) < 1.0;
      const inLoop = inLoopOuter && !inLoopInner && nx >= -0.25;

      // Sparkle star at top right: center at (0.32, -0.32)
      const sx = Math.abs(nx - 0.28);
      const sy = Math.abs(ny - -0.28);
      const inSparkle = (sx < 0.04 && sy < 0.16) || (sy < 0.04 && sx < 0.16) || (Math.pow(sx, 0.5) + Math.pow(sy, 0.5) < 0.18);

      if (inStem || inLoop) {
        // Dark slate charcoal for bold, luxury contrast (#1E232A)
        r = 30;
        g = 35;
        b = 43;
      } else if (inSparkle) {
        // Warm gold sparkle star (#D97706)
        r = 217;
        g = 119;
        b = 6;
      }

      raw[pxOffset] = Math.min(255, Math.max(0, r));
      raw[pxOffset + 1] = Math.min(255, Math.max(0, g));
      raw[pxOffset + 2] = Math.min(255, Math.max(0, b));
      raw[pxOffset + 3] = a;
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdr = makeChunk('IHDR', ihdrData);
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

const publicDir = path.resolve(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate apple-touch-icon (180x180)
const icon180 = generateIconPNG(180);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), icon180);

// Generate pwa-192x192.png
const icon192 = generateIconPNG(192);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);

// Generate pwa-512x512.png
const icon512 = generateIconPNG(512);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);

console.log('Successfully generated iOS apple-touch-icon.png and PWA icons in /public!');
