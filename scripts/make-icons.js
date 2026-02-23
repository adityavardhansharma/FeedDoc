import { writeFileSync } from 'fs';

function createPNG(size) {
  function crc32(buf) {
    let c = 0xffffffff;
    const table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let v = n;
      for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
      table[n] = v;
    }
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function chunk(type, data) {
    const typeBytes = new TextEncoder().encode(type);
    const len = new Uint8Array(4);
    new DataView(len.buffer).setUint32(0, data.length);
    const combined = new Uint8Array(typeBytes.length + data.length);
    combined.set(typeBytes);
    combined.set(data, 4 - (4 - typeBytes.length));
    const forCrc = new Uint8Array(typeBytes.length + data.length);
    forCrc.set(typeBytes);
    forCrc.set(data, typeBytes.length);
    const crcVal = crc32(forCrc);
    const crcBytes = new Uint8Array(4);
    new DataView(crcBytes.buffer).setUint32(0, crcVal);
    const result = new Uint8Array(4 + typeBytes.length + data.length + 4);
    result.set(len);
    result.set(typeBytes, 4);
    result.set(data, 8);
    result.set(crcBytes, 8 + data.length);
    return result;
  }

  const raw = new Uint8Array(size * (size * 4 + 1));
  const purple = [124, 58, 237, 255];
  const white = [255, 255, 255, 230];
  const darkPurple = [124, 58, 237, 255];
  const r = size * 0.2;

  function inRoundRect(x, y, w, h, rad) {
    if (x >= rad && x < w - rad && y >= 0 && y < h) return true;
    if (y >= rad && y < h - rad && x >= 0 && x < w) return true;
    const corners = [[rad, rad], [w - rad, rad], [rad, h - rad], [w - rad, h - rad]];
    for (const [cx, cy] of corners) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= rad * rad) return true;
    }
    return false;
  }

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const offset = rowStart + 1 + x * 4;
      if (inRoundRect(x, y, size, size, r)) {
        const s = size / 16;
        const dx = x / s, dy = y / s;
        const inDoc = dx >= 4 && dx <= 12 && dy >= 2 && dy <= 14;
        const isLine1 = dy >= 8.5 && dy <= 9.5 && dx >= 6 && dx <= 10;
        const isLine2 = dy >= 10.5 && dy <= 11.5 && dx >= 6 && dx <= 8;
        if (isLine1 || isLine2) {
          raw.set(darkPurple, offset);
        } else if (inDoc) {
          raw.set(white, offset);
        } else {
          raw.set(purple, offset);
        }
      } else {
        raw.set([0, 0, 0, 0], offset);
      }
    }
  }

  const deflateRaw = (data) => {
    const blocks = [];
    const maxBlock = 65535;
    for (let i = 0; i < data.length; i += maxBlock) {
      const end = Math.min(i + maxBlock, data.length);
      const isLast = end === data.length;
      const blockData = data.slice(i, end);
      const header = new Uint8Array(5);
      header[0] = isLast ? 1 : 0;
      const len = blockData.length;
      header[1] = len & 0xff;
      header[2] = (len >> 8) & 0xff;
      header[3] = ~len & 0xff;
      header[4] = (~len >> 8) & 0xff;
      blocks.push(header, blockData);
    }
    let total = 0;
    for (const b of blocks) total += b.length;
    const result = new Uint8Array(total);
    let off = 0;
    for (const b of blocks) { result.set(b, off); off += b.length; }
    return result;
  };

  function adler32(data) {
    let a = 1, b = 0;
    for (let i = 0; i < data.length; i++) {
      a = (a + data[i]) % 65521;
      b = (b + a) % 65521;
    }
    return ((b << 16) | a) >>> 0;
  }

  const deflated = deflateRaw(raw);
  const adler = adler32(raw);
  const compressed = new Uint8Array(2 + deflated.length + 4);
  compressed[0] = 0x78;
  compressed[1] = 0x01;
  compressed.set(deflated, 2);
  new DataView(compressed.buffer).setUint32(2 + deflated.length, adler);

  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, size);
  ihdrView.setUint32(4, size);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', new Uint8Array(0));

  const png = new Uint8Array(sig.length + ihdrChunk.length + idatChunk.length + iendChunk.length);
  let pos = 0;
  png.set(sig, pos); pos += sig.length;
  png.set(ihdrChunk, pos); pos += ihdrChunk.length;
  png.set(idatChunk, pos); pos += idatChunk.length;
  png.set(iendChunk, pos);

  return png;
}

writeFileSync('icons/icon16.png', createPNG(16));
writeFileSync('icons/icon48.png', createPNG(48));
writeFileSync('icons/icon128.png', createPNG(128));
console.log('Icons generated.');
