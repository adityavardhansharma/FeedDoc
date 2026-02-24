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

  const bg = [2, 2, 4, 255];
  const green = [0, 255, 159, 255];
  const raw = new Uint8Array(size * (size * 4 + 1));

  const borderW = Math.max(1, Math.round(size / 32));

  // Bitmap for "FD" glyphs on a 7-column x 9-row grid per character
  // F glyph (7 wide)
  const F = [
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,1,0],
    [1,1,0,0,0,0,0],
    [1,1,1,1,1,0,0],
    [1,1,1,1,1,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
    [1,1,0,0,0,0,0],
  ];
  // D glyph (7 wide)
  const D = [
    [1,1,1,1,1,0,0],
    [1,1,1,1,1,1,0],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,0,0,0,1,1],
    [1,1,1,1,1,1,0],
    [1,1,1,1,1,0,0],
  ];

  const glyphH = 9;
  const glyphW = 7;
  const gap = 1;
  const totalGlyphW = glyphW * 2 + gap;

  const pixelSize = Math.max(1, Math.floor(size * 0.055));
  const textW = totalGlyphW * pixelSize;
  const textH = glyphH * pixelSize;
  const startX = Math.floor((size - textW) / 2);
  const startY = Math.floor((size - textH) / 2) + Math.round(size * 0.02);

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size; x++) {
      const offset = rowStart + 1 + x * 4;

      const isBorderX = x < borderW || x >= size - borderW;
      const isBorderY = y < borderW || y >= size - borderW;

      if (isBorderX || isBorderY) {
        raw.set(green, offset);
        continue;
      }

      const gx = x - startX;
      const gy = y - startY;
      if (gx >= 0 && gx < textW && gy >= 0 && gy < textH) {
        const col = Math.floor(gx / pixelSize);
        const row = Math.floor(gy / pixelSize);
        let hit = false;
        if (col < glyphW && row < glyphH) {
          hit = F[row][col] === 1;
        } else if (col >= glyphW + gap && col < totalGlyphW && row < glyphH) {
          hit = D[row][col - glyphW - gap] === 1;
        }
        raw.set(hit ? green : bg, offset);
      } else {
        raw.set(bg, offset);
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
  ihdr[8] = 8;
  ihdr[9] = 6;

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
console.log('FD icons generated: 16, 48, 128');
