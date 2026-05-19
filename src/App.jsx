import { useState, useEffect } from 'react';
import PromptInput from './components/PromptInput';
import GlyphGrid from './components/GlyphGrid';
import GlyphEditor from './components/GlyphEditor';
import ExportButton from './components/ExportButton';
import PhrasePreview from './components/PhrasePreview';
import FontUpload from './components/FontUpload';
import useFontGeneration from './hooks/useFontGeneration';
import './App.css';

export default function App() {
  const {
    glyphs,
    style,
    fontFamily,
    setFontFamily,
    progress,
    generating,
    loadingLetters,
    errors,
    loadReferences,
    loadUploadedFont,
    generateAlphabet,
    regenerateGlyph,
    updateGlyph,
    abort,
    clearGlyphs,
  } = useFontGeneration();

  const [editingLetter, setEditingLetter] = useState(null);

  useEffect(() => {
    loadReferences('upper');
  }, []);

  const glyphCount = Object.keys(glyphs).length;
  const generatedCount = Object.values(glyphs).filter(g => !g.isReference).length;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Font Generator</h1>
        <p className="subtitle">type a vibe. get a font. tweak it. ship it.</p>
      </header>

      <div className="bento-grid">
        <div className="bento-card">
          <div className="bento-card-label"><span className="dot" /> Identity</div>
          <div className="font-name-row">
            <label>Font Family
              <input type="text" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} placeholder="UntitledFont" />
            </label>
          </div>
        </div>

        <div className="bento-card">
          <div className="bento-card-label"><span className="dot" style={{ background: 'var(--neon-yellow)' }} /> Upload Base</div>
          <FontUpload onUpload={loadUploadedFont} disabled={generating} />
        </div>

        <div className="bento-card">
          <div className="bento-card-label"><span className="dot" style={{ background: 'var(--neon-green)' }} /> Export</div>
          <ExportButton glyphs={glyphs} fontFamily={fontFamily} generatedCount={generatedCount} />
        </div>

        <div className="bento-card full-width">
          <div className="bento-card-label"><span className="dot" style={{ background: 'var(--neon-pink)' }} /> Style</div>
          <PromptInput
            onGenerate={(prompt, charset) => generateAlphabet(prompt, charset)}
            onLoadReferences={loadReferences}
            generating={generating}
          />
          <div className="actions-row">
            {generating && <button className="abort-btn" onClick={abort}>Stop generation</button>}
            {glyphCount > 0 && !generating && <button className="clear-btn" onClick={clearGlyphs}>Clear all</button>}
          </div>
        </div>

        {/* Phrase Preview */}
        <div className="bento-card full-width">
          <div className="bento-card-label"><span className="dot" style={{ background: 'var(--neon-yellow)' }} /> Preview</div>
          <PhrasePreview glyphs={glyphs} />
        </div>

        <div className="bento-card full-width">
          <div className="bento-card-label">
            <span className="dot" style={{ background: 'var(--neon-blue)' }} /> Glyphs
            {glyphCount > 0 && <span className="glyph-stats">{generatedCount}/{glyphCount} generated</span>}
          </div>
          <GlyphGrid
            glyphs={glyphs}
            loadingLetters={loadingLetters}
            onSelect={setEditingLetter}
            progress={progress}
            generating={generating}
          />
        </div>

        {errors.length > 0 && (
          <div className="bento-card full-width">
            <div className="errors">
              {errors.map((e, i) => <div key={i} className="error-item">"{e.letter}": {e.error}</div>)}
            </div>
          </div>
        )}
      </div>

      {editingLetter && glyphs[editingLetter] && (
        <GlyphEditor
          letter={editingLetter}
          glyphData={glyphs[editingLetter]}
          style={style}
          onRegenerate={regenerateGlyph}
          onUpdate={updateGlyph}
          onClose={() => setEditingLetter(null)}
          generating={!!loadingLetters[editingLetter]}
        />
      )}
    </div>
  );
}
