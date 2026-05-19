import { createFontFromGlyphs } from '../utils/fontBuilder';

export default function ExportButton({ glyphs, fontFamily, generatedCount = 0 }) {
  const handleExport = (format) => {
    if (Object.keys(glyphs).length === 0) return;

    const font = createFontFromGlyphs(glyphs, fontFamily);

    if (format === 'ttf') {
      font.download();
    } else if (format === 'svg') {
      exportAsSVG(glyphs, fontFamily);
    }
  };

  const count = Object.keys(glyphs).length;

  return (
    <div className="export-section">
      <span className="glyph-count">
        <strong>{generatedCount}</strong>/{count} glyphs styled
      </span>
      <div className="export-buttons">
        <button
          onClick={() => handleExport('ttf')}
          disabled={count === 0}
          className="export-btn"
        >
          Download .ttf
        </button>
        <button
          onClick={() => handleExport('svg')}
          disabled={count === 0}
          className="export-btn secondary"
        >
          Export .svg
        </button>
      </div>
    </div>
  );
}

function exportAsSVG(glyphs, fontFamily) {
  const entries = Object.entries(glyphs);
  let svgContent = `<?xml version="1.0" standalone="no"?>\n`;
  svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${entries.length * 1200}">\n`;

  entries.forEach(([letter, data], i) => {
    const y = i * 1200;
    svgContent += `  <g transform="translate(0, ${y + 1000})">\n`;
    svgContent += `    <text x="0" y="0" font-size="14" fill="#999">${letter}</text>\n`;
    svgContent += `    <path d="${data.path}" transform="translate(50, 0)" fill="black"/>\n`;
    svgContent += `  </g>\n`;
  });

  svgContent += `</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fontFamily}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}
