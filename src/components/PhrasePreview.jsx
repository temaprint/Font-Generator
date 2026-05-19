import { useState, useMemo } from 'react';
import { getGlyphPathData } from '../utils/fontBuilder';

const PANGRAMS = [
  { label: 'Classic', text: 'The quick brown fox jumps over the lazy dog' },
  { label: 'Numbers', text: 'Pack my box with five dozen liquor jugs 1234567890' },
  { label: 'Sphinx', text: 'Sphinx of black quartz judge my vow 0123456789' },
  { label: 'Wizards', text: 'Grumpy wizards make toxic brew for the evil queen' },
  { label: 'Disco', text: 'Amazingly few discotheques provide jukeboxes' },
  { label: 'Alphabet', text: 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz 0123456789' },
];

export default function PhrasePreview({ glyphs }) {
  const [text, setText] = useState(PANGRAMS[0].text);
  const [fontSize, setFontSize] = useState(64);
  const [activePangram, setActivePangram] = useState(0);

  const selectPangram = (i) => {
    setActivePangram(i);
    setText(PANGRAMS[i].text);
  };

  const renderedChars = useMemo(() => {
    const chars = [];
    let cursorX = 0;
    const maxH = fontSize * 1.2;

    for (const char of text) {
      const glyph = glyphs[char];
      if (!glyph) {
        cursorX += fontSize * 0.3;
        continue;
      }

      let pathData = '';
      try { pathData = getGlyphPathData(glyph); } catch {}

      if (pathData) {
        const scale = fontSize / 1000;
        const advance = (glyph.advanceWidth || 600) * scale;
        chars.push({ char, x: cursorX, pathData, advance, scale });
        cursorX += advance + fontSize * 0.02;
      } else {
        cursorX += fontSize * 0.3;
      }
    }

    return { chars, width: cursorX, height: maxH };
  }, [text, glyphs, fontSize]);

  const svgWidth = Math.max(renderedChars.width + 20, 200);
  const svgHeight = renderedChars.height + 20;

  return (
    <div className="phrase-preview-card">
      <div className="phrase-pangrams">
        {PANGRAMS.map((p, i) => (
          <button
            key={p.label}
            className={`pangram-btn ${activePangram === i ? 'active' : ''}`}
            onClick={() => selectPangram(i)}
            type="button"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="phrase-controls">
        <input
          type="text"
          value={text}
          onChange={(e) => { setText(e.target.value); setActivePangram(-1); }}
          placeholder="Type something..."
          className="phrase-input"
        />
        <input
          type="range"
          min="24"
          max="120"
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
          className="phrase-size"
        />
        <span className="phrase-size-label">{fontSize}px</span>
      </div>

      <div className="phrase-canvas">
        {renderedChars.chars.length > 0 ? (
          <svg
            width="100%"
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="phrase-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <line x1="0" y1={svgHeight - 10} x2={svgWidth} y2={svgHeight - 10}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            {renderedChars.chars.map((c, i) => (
              <g key={i} transform={`translate(${c.x}, ${svgHeight - 10}) scale(${c.scale})`}>
                <g transform="scale(1, -1)">
                  <path d={c.pathData} fill="currentColor" />
                </g>
              </g>
            ))}
          </svg>
        ) : (
          <p className="phrase-empty">Generate glyphs to preview your font</p>
        )}
      </div>
    </div>
  );
}
