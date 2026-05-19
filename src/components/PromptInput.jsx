import { useState } from 'react';

const PRESETS = [
  { label: 'Y2K Chrome', prompt: 'Y2K metallic chrome, liquid metal, reflective, futuristic 2000s' },
  { label: 'Blobby', prompt: 'blobby organic shapes, inflated, 3D bubbly, soft rounded' },
  { label: 'Brutalist', prompt: 'brutalist, raw, heavy, geometric, architectural, concrete' },
  { label: 'Glitch', prompt: 'digital glitch, corrupted, pixel distortion, cyberpunk' },
  { label: 'Folk', prompt: 'folk art hand-drawn, naive, imperfect, warm, earthy' },
  { label: 'Neo Grotesk', prompt: 'neo-grotesque, swiss design, clean, precise, helvetica-inspired' },
  { label: 'Blob Serif', prompt: 'blob serif, exaggerated serifs, playful, chunky, modern editorial' },
  { label: 'Neon', prompt: 'neon light tube, glowing, outlined, bright on dark, electric' },
  { label: 'Graffiti', prompt: 'street graffiti, wildstyle, spray paint, urban, bold' },
  { label: 'Gothic', prompt: 'blackletter gothic, medieval, ornate, dramatic' },
  { label: 'Handwritten', prompt: 'casual handwritten, organic, flowing, personal, ink pen' },
  { label: 'Pixel', prompt: '8-bit pixel art, retro gaming, blocky, nintendo, chunky' },
  { label: 'Sticker', prompt: 'sticker bomb, street art, die-cut, thick outline, bold colors' },
  { label: 'Thin Hairline', prompt: 'ultra thin hairline, delicate, fashion, luxury, minimal weight' },
];

const CHARSETS = [
  { label: 'A-Z', value: 'upper' },
  { label: 'a-z', value: 'lower' },
  { label: 'A-Z a-z 0-9', value: 'all' },
  { label: '0-9', value: 'digits' },
];

export default function PromptInput({ onGenerate, onLoadReferences, generating }) {
  const [prompt, setPrompt] = useState('');
  const [charset, setCharset] = useState('upper');

  const handleCharsetChange = (value) => {
    setCharset(value);
    onLoadReferences(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim() && !generating) {
      onGenerate(prompt.trim(), charset);
    }
  };

  const selectPreset = (preset) => {
    setPrompt(prev => prev === preset.prompt ? '' : preset.prompt);
  };

  return (
    <div className="prompt-input">
      <div className="presets">
        {PRESETS.map(p => (
          <button
            key={p.label}
            className={`preset-btn ${prompt === p.prompt ? 'active' : ''}`}
            onClick={() => selectPreset(p)}
            type="button"
          >
            {p.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-row">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="describe your font style... or pick a vibe above"
            disabled={generating}
          />
          <select value={charset} onChange={(e) => handleCharsetChange(e.target.value)} disabled={generating}>
            {CHARSETS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button type="submit" disabled={!prompt.trim() || generating} className="generate-btn">
            {generating ? (
              <><span className="btn-spinner" /> Generating...</>
            ) : 'Generate'}
          </button>
        </div>
      </form>
    </div>
  );
}
