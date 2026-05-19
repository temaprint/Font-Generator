import opentype from 'opentype.js';

const UNITS_PER_EM = 1000;
const ASCENDER = 800;
const DESCENDER = -200;

function parseSVGPath(pathStr) {
  const path = new opentype.Path();
  if (!pathStr) return path;

  const commands = pathStr.match(/[MmLlCcQqZz][^MmLlCcQqZz]*/g);
  if (!commands) return path;

  for (const cmd of commands) {
    const type = cmd[0];
    const nums = cmd.slice(1).trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));

    switch (type) {
      case 'M':
        for (let i = 0; i < nums.length; i += 2) {
          if (i === 0) path.moveTo(nums[i], nums[i + 1]);
          else path.lineTo(nums[i], nums[i + 1]);
        }
        break;
      case 'L':
        for (let i = 0; i < nums.length; i += 2) {
          path.lineTo(nums[i], nums[i + 1]);
        }
        break;
      case 'C':
        for (let i = 0; i < nums.length; i += 6) {
          path.curveTo(nums[i], nums[i + 1], nums[i + 2], nums[i + 3], nums[i + 4], nums[i + 5]);
        }
        break;
      case 'Q':
        for (let i = 0; i < nums.length; i += 4) {
          path.quadTo(nums[i], nums[i + 1], nums[i + 2], nums[i + 3]);
        }
        break;
      case 'Z':
      case 'z':
        path.close();
        break;
    }
  }

  return path;
}

export function createFontFromGlyphs(glyphsMap, fontFamily = 'GeneratedFont') {
  const notdefGlyph = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 650,
    path: new opentype.Path()
  });

  // Space glyph
  const spaceGlyph = new opentype.Glyph({
    name: 'space',
    unicode: 32,
    advanceWidth: 250,
    path: new opentype.Path()
  });

  const glyphList = [notdefGlyph, spaceGlyph];

  for (const [char, data] of Object.entries(glyphsMap)) {
    const code = char.charCodeAt(0);
    const glyph = new opentype.Glyph({
      name: data.name || char,
      unicode: data.unicode || code,
      advanceWidth: data.advanceWidth || 600,
      path: parseSVGPath(data.path),
    });
    glyphList.push(glyph);
  }

  const font = new opentype.Font({
    familyName: fontFamily,
    styleName: 'Regular',
    unitsPerEm: UNITS_PER_EM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs: glyphList,
  });

  return font;
}

export function downloadFont(font, format = 'ttf') {
  const buffer = font.download();
  // opentype.js .download() triggers browser download automatically
}

export function getFontBlob(font) {
  return font.download();
}

export function renderGlyphToSVG(glyphData, size = 64) {
  const path = parseSVGPath(glyphData.path);
  const scale = size / UNITS_PER_EM;
  const svgPath = path.toPathData(scale);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 -${ASCENDER * scale} ${UNITS_PER_EM * scale} ${UNITS_PER_EM * scale}">
    <path d="${svgPath}" fill="currentColor"/>
  </svg>`;
}

export function getGlyphPathData(glyphData) {
  const path = parseSVGPath(glyphData.path);
  return path.toPathData(1);
}
