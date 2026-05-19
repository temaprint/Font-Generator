import { getGlyphPathData } from '../utils/fontBuilder';

export default function GlyphGrid({ glyphs, loadingLetters, onSelect, progress, generating }) {
  const entries = Object.entries(glyphs);

  const renderGlyph = (data, isLoading) => {
    if (isLoading) {
      return (
        <div className="glyph-spinner">
          <svg viewBox="0 0 50 50" className="spinner-svg">
            <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(192,132,252,0.2)" strokeWidth="4" />
            <circle cx="25" cy="25" r="20" fill="none" stroke="var(--accent)" strokeWidth="4"
              strokeDasharray="80 40" strokeLinecap="round" className="spinner-arc" />
          </svg>
        </div>
      );
    }

    try {
      const pathData = getGlyphPathData(data);
      if (!pathData || pathData === '') return <span className="glyph-empty">?</span>;

      return (
        <svg viewBox="0 0 1000 1000" className="glyph-svg" preserveAspectRatio="xMidYMid meet">
          <g transform="translate(0, 750) scale(1, -1)">
            <path d={pathData} fill="currentColor" />
          </g>
        </svg>
      );
    } catch {
      return <span className="glyph-error">!</span>;
    }
  };

  return (
    <div className="glyph-grid-container">
      {entries.length === 0 && !generating && (
        <div className="glyph-grid-empty">
          <span className="hint-icon">Aa</span>
          <p>Pick a charset above to load reference glyphs</p>
        </div>
      )}

      <div className="glyph-grid">
        {entries.map(([letter, data]) => {
          const isLoading = !!loadingLetters[letter];
          const isRef = data.isReference;

          return (
            <div
              key={letter}
              className={`glyph-cell ${isLoading ? 'loading' : ''} ${isRef ? 'reference' : 'generated'}`}
              onClick={() => !isLoading && onSelect?.(letter)}
            >
              <div className="glyph-preview">
                {renderGlyph(data, isLoading)}
              </div>
              <div className="glyph-label">
                {letter}
                {isRef && !isLoading && <span className="ref-badge">ref</span>}
              </div>
            </div>
          );
        })}
      </div>

      {generating && progress && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(progress.done / progress.total) * 100}%` }}
          />
          <span className="progress-text">
            {progress.letter} — {progress.done}/{progress.total}
          </span>
        </div>
      )}
    </div>
  );
}
