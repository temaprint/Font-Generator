import opentype from 'opentype.js';

/**
 * Parse an uploaded font file and extract glyph data as our reference format.
 * Returns an object keyed by character: { "A": { name, unicode, advanceWidth, path }, ... }
 */
export function parseUploadedFont(arrayBuffer) {
  const font = opentype.parse(arrayBuffer);

  const glyphs = {};
  const unitsPerEm = font.unitsPerEm || 1000;

  // Scale factor to normalize to 1000 units-per-em
  const scale = 1000 / unitsPerEm;

  for (let i = 0; i < font.glyphs.length; i++) {
    const glyph = font.glyphs.get(i);

    // Skip glyphs without unicode (like .notdef, .null)
    if (glyph.unicode === undefined || glyph.unicode === 0) continue;

    // Only take printable ASCII range: 33-126 + common whitespace
    if (glyph.unicode < 33 || glyph.unicode > 126) continue;

    const char = String.fromCharCode(glyph.unicode);

    // Get path data scaled to 1000 units
    let pathData = '';
    try {
      const path = glyph.path;
      // Scale path commands to 1000 upm
      pathData = scalePath(path, scale);
    } catch {
      continue;
    }

    if (!pathData || pathData.trim() === '') continue;

    glyphs[char] = {
      name: glyph.name || char,
      unicode: glyph.unicode,
      advanceWidth: Math.round(glyph.advanceWidth * scale),
      path: pathData,
    };
  }

  return {
    glyphs,
    familyName: font.names.fontFamily?.en || 'Uploaded Font',
    unitsPerEm,
  };
}

function scalePath(path, scale) {
  if (!path || !path.commands) return '';

  const commands = path.commands.map(cmd => {
    const c = { type: cmd.type };
    if (cmd.x !== undefined) c.x = round(cmd.x * scale);
    if (cmd.y !== undefined) c.y = round(cmd.y * scale);
    if (cmd.x1 !== undefined) c.x1 = round(cmd.x1 * scale);
    if (cmd.y1 !== undefined) c.y1 = round(cmd.y1 * scale);
    if (cmd.x2 !== undefined) c.x2 = round(cmd.x2 * scale);
    if (cmd.y2 !== undefined) c.y2 = round(cmd.y2 * scale);
    return c;
  });

  return commands.map(cmd => {
    switch (cmd.type) {
      case 'M': return `M${cmd.x} ${cmd.y}`;
      case 'L': return `L${cmd.x} ${cmd.y}`;
      case 'C': return `C${cmd.x1} ${cmd.y1} ${cmd.x2} ${cmd.y2} ${cmd.x} ${cmd.y}`;
      case 'Q': return `Q${cmd.x1} ${cmd.y1} ${cmd.x} ${cmd.y}`;
      case 'Z': return 'Z';
      default: return '';
    }
  }).filter(Boolean).join(' ');
}

function round(n) {
  return Math.round(n * 10) / 10;
}
