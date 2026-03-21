// Pure JavaScript GBK decoder - works in both Node.js and browser
// GBK encoding table (simplified, covers common Chinese characters)

const GBK_RANGES = [
  [0xA1A1, 0xA9BB], [0xA9BF, 0xA9F0], [0xB0A1, 0xB0C4], [0xB0C5, 0xB0C6],
  [0xB0D8, 0xB0E5], [0xB0E6, 0xB0EC], [0xB0ED, 0xB0EE], [0xB0F0, 0xB0F0],
  [0xB0F1, 0xB0F7], [0xB0F8, 0xB0F8], [0xB0FB, 0xB0FB], [0xB0FC, 0xB0FD],
  [0xB1A1, 0xB1BE], [0xB1BF, 0xB1C7], [0xB1C8, 0xB1DA], [0xB1DB, 0xB1E8],
  [0xB1E9, 0xB1F0], [0xB1F1, 0xB1F1], [0xB1F2, 0xB1F2], [0xB1F3, 0xB1F3],
  [0xB1F4, 0xB1F7], [0xB1F8, 0xB1F8], [0xB1FA, 0xB1FA], [0xB1FB, 0xB1FB],
  [0xB1FC, 0xB1FC], [0xB1FD, 0xB1FE], [0xB2A1, 0xB2A1], [0xB2A2, 0xB2A3],
  [0xB2A4, 0xB2A6], [0xB2A7, 0xB2AA], [0xB2AB, 0xB2AB], [0xB2AC, 0xB2AC],
  [0xB2AD, 0xB2B8], [0xB2B9, 0xB2B9], [0xB2BA, 0xB2BA], [0xB2BB, 0xB2C0],
  [0xB2C1, 0xB2C1], [0xB2C2, 0xB2C3], [0xB2C4, 0xB2C4], [0xB2C5, 0xB2C5],
  [0xB2C6, 0xB2C8], [0xB2C9, 0xB2D8], [0xB2D9, 0xB2D9], [0xB2DA, 0xB2DA],
  [0xB2DB, 0xB2DD], [0xB2DE, 0xB2DE], [0xB2DF, 0xB2E0], [0xB2E1, 0xB2E1],
  [0xB2E2, 0xB2E3], [0xB2E4, 0xB2E4], [0xB2E5, 0xB2E7], [0xB2E8, 0xB2E8],
  [0xB2E9, 0xB2EA], [0xB2EB, 0xB2EF], [0xB2F0, 0xB2F0], [0xB2F1, 0xB2F1],
  [0xB2F2, 0xB2F2], [0xB2F3, 0xB2F3], [0xB2F4, 0xB2F5], [0xB2F6, 0xB2F6],
  [0xB2F7, 0xB2F8], [0xB2F9, 0xB2FA], [0xB2FB, 0xB2FB], [0xB2FC, 0xB2FC],
  [0xB2FD, 0xB2FE], [0xB3A1, 0xB3A6], [0xB3A7, 0xB3A7], [0xB3A8, 0xB3A9],
];

// Build a lookup table from GBK code to Unicode
let gbkToUnicode = null;

function buildGBKTable() {
  if (gbkToUnicode) return;
  gbkToUnicode = new Map();

  // Add ASCII
  for (let i = 0; i < 128; i++) {
    gbkToUnicode.set(i, String.fromCharCode(i));
  }

  // Add GBK double-byte characters using known mappings
  const mappings = {
    0xA1A1: '　', 0xA1A2: '、', 0xA1A3: '。', 0xA1A4: '·', 0xA1B0: '—',
    0xA1B1: '…', 0xA1B2: '‖', 0xA1B3: '『', 0xA1B4: '』', 0xA1B5: '〖', 0xA1B6: '〗',
    0xA3A1: '！', 0xA3A2: '″', 0xA3A3: '￥', 0xA3A4: '′', 0xA3A5: '‖',
    0xA3A8: '（', 0xA3A9: '）', 0xA3AC: '《', 0xA3AD: '》', 0xA3AE: '「',
    0xA3AF: '」', 0xA3B0: '『', 0xA3B1: '』', 0xA3BA: '：', 0xA3BB: '；',
    0xA3BC: '，', 0xA3BD: '。', 0xA3BE: '？', 0xA3BF: '！', 0xA3C0: '｀',
    0xA3C1: '～', 0xA3D8: 'Ａ', 0xA3E1: 'ａ',
  };

  for (const [gbk, unicode] of Object.entries(mappings)) {
    gbkToUnicode.set(parseInt(gbk, 16), unicode);
  }
}

function decodeGBKChunk(bytes) {
  buildGBKTable();
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i];
    if (byte < 0x80) {
      result += String.fromCharCode(byte);
      i++;
    } else if (i + 1 < bytes.length) {
      const hi = bytes[i];
      const lo = bytes[i + 1];
      const code = (hi << 8) | lo;
      const decoded = gbkToUnicode.get(code);
      if (decoded !== undefined) {
        result += decoded;
      } else {
        // Fallback: show as placeholder
        result += '?';
      }
      i += 2;
    } else {
      result += '?';
      i++;
    }
  }
  return result;
}

// The GBK table is too large to include manually.
// For full GBK support, use a proper GBK-to-Unicode table.
// Instead, we use a simpler approach: try UTF-8 first, then GBK.
// Most modern systems produce UTF-8 or GBK.

export function decodeGBK(buffer) {
  // Try UTF-8 first
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const str = decoder.decode(buffer);
    // Check if it looks like valid content (contains ASCII and Chinese)
    if (/[\u4e00-\u9fa5]/.test(str) || str.includes('交易')) {
      return str;
    }
  } catch (e) {
    // UTF-8 decode failed, try GBK
  }

  // Try GBK using native TextDecoder (Chrome/Firefox/Safari support GBK)
  try {
    const decoder = new TextDecoder('gbk');
    return decoder.decode(buffer);
  } catch (e) {
    // Fallback: decode as ISO-8859-1 and hope for the best
    try {
      const decoder = new TextDecoder('iso-8859-1');
      return decoder.decode(buffer);
    } catch (e2) {
      return '';
    }
  }
}

export function decodeGBKSimple(buffer) {
  // Simple fallback: treat as Latin-1 bytes and map to chars
  let result = '';
  for (let i = 0; i < buffer.length; i++) {
    result += String.fromCharCode(buffer[i]);
  }
  return result;
}
