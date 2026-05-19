// SVG Path parsing and manipulation utilities

// Parse SVG path string into structured commands
export function parsePath(pathStr) {
  if (!pathStr) return [];
  const commands = [];
  const re = /([MmLlCcQqZz])\s*([\d\s.,-]*)/g;
  let match;
  while ((match = re.exec(pathStr)) !== null) {
    const type = match[1];
    const nums = match[2].trim()
      .replace(/-/g, ' -')
      .split(/[\s,]+/)
      .filter(s => s !== '')
      .map(Number);

    if (type === 'Z' || type === 'z') {
      commands.push({ type, points: [] });
      continue;
    }

    // Group numbers into point pairs
    const step = (type === 'C' || type === 'c') ? 6 :
                 (type === 'Q' || type === 'q') ? 4 : 2;

    for (let i = 0; i < nums.length; i += step) {
      const pts = [];
      for (let j = 0; j < step; j += 2) {
        if (i + j + 1 < nums.length) {
          pts.push({ x: nums[i + j], y: nums[i + j + 1] });
        }
      }
      commands.push({ type, points: pts });
    }
  }
  return commands;
}

// Convert parsed commands back to SVG path string
export function serializePath(commands) {
  return commands.map(cmd => {
    if (cmd.type === 'Z' || cmd.type === 'z') return cmd.type;
    const coords = cmd.points.map(p => `${round(p.x)} ${round(p.y)}`).join(' ');
    return `${cmd.type} ${coords}`;
  }).join(' ');
}

function round(n) {
  return Math.round(n * 10) / 10;
}

// Get all editable points from parsed path (flat list with refs back to commands)
export function getEditablePoints(commands) {
  const points = [];
  commands.forEach((cmd, ci) => {
    cmd.points.forEach((pt, pi) => {
      points.push({
        x: pt.x,
        y: pt.y,
        cmdIndex: ci,
        ptIndex: pi,
        type: cmd.type,
      });
    });
  });
  return points;
}

// Update a single point in the commands array
export function updatePoint(commands, cmdIndex, ptIndex, newX, newY) {
  const updated = commands.map((cmd, ci) => {
    if (ci !== cmdIndex) return cmd;
    return {
      ...cmd,
      points: cmd.points.map((pt, pi) =>
        pi === ptIndex ? { x: round(newX), y: round(newY) } : { ...pt }
      ),
    };
  });
  return updated;
}

// Scale path vertically (height adjustment)
export function scalePathY(pathStr, scale, baseline = 0) {
  const commands = parsePath(pathStr);
  const scaled = commands.map(cmd => ({
    ...cmd,
    points: cmd.points.map(pt => ({
      x: pt.x,
      y: baseline + (pt.y - baseline) * scale,
    })),
  }));
  return serializePath(scaled);
}

// Apply stroke weight (offset path outward)
export function applyWeight(pathStr, weight) {
  // Use SVG stroke simulation: returns the same path but with weight metadata
  // Actual rendering uses stroke-width + paint-order
  return pathStr;
}

// Render a phrase using glyph paths
export function renderPhrase(phrase, glyphs, options = {}) {
  const {
    fontSize = 48,
    letterSpacing = 0,
    lineHeight = 1.4,
  } = options;

  const lines = [];
  let currentLine = [];
  let cursorX = 0;

  for (const char of phrase) {
    if (char === '\n') {
      lines.push({ chars: currentLine, width: cursorX });
      currentLine = [];
      cursorX = 0;
      continue;
    }

    const glyph = glyphs[char];
    if (!glyph) {
      // Space or missing glyph
      cursorX += fontSize * 0.3;
      currentLine.push({ char, x: cursorX, path: null, advanceWidth: 300 });
      continue;
    }

    currentLine.push({
      char,
      x: cursorX,
      path: glyph.path,
      advanceWidth: glyph.advanceWidth || 600,
    });
    cursorX += (glyph.advanceWidth || 600) / 1000 * fontSize + letterSpacing;
  }

  if (currentLine.length > 0) {
    lines.push({ chars: currentLine, width: cursorX });
  }

  return lines;
}
