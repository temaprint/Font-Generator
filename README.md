# AI Font Generator

**type a vibe. get a font. tweak it. ship it.**

![AI Font Generator Preview](pic/generator.allbestfonts.com.png)

AI Font Generator is a web app that turns a text description of a style into a fully functional font. Describe a vibe — and the AI generates unique glyphs you can customize, edit, and download as a `.ttf` file.

---

## Features

### AI-Powered Font Generation
- Type a style description in plain English (e.g. "Y2K metallic chrome", "brutalist geometric", "handwritten ink")
- **14 preset vibes**: Y2K Chrome, Blobby, Brutalist, Glitch, Folk, Neo Grotesk, Blob Serif, Neon, Graffiti, Gothic, Handwritten, Pixel, Sticker, Thin Hairline
- The AI generates each character individually, considering the letter's structural features and previously generated glyphs for stylistic consistency
- Character set support: **A-Z**, **a-z**, **0-9**, or the full **A-Z + a-z + 0-9** set (62 characters)

### Glyph Editor
- Click any glyph to open a full-featured editor with 4 tabs:
  - **Generate** — re-generate with custom instructions ("make the crossbar thinner")
  - **Adjust** — weight, height, and width sliders, plus draggable control points mode
  - **Path** — raw SVG path data editing
  - **History** — timestamped change history with one-click restore

### Base Font Upload
- Upload an existing `.ttf`, `.otf`, or `.woff` font file
- Uploaded glyphs are used as base templates for AI modification

### Phrase Preview
- Live text preview rendered in SVG using the generated glyphs
- 6 built-in pangrams ("The quick brown fox jumps over the lazy dog" and more)
- Custom text input and adjustable font size (24–120px)

### Export
- Download as a **.ttf** font file (built with opentype.js)
- Export as **.svg**

### Auto-Save
- All glyphs, style, and settings are persisted in `localStorage`
- Per-glyph edit history is saved independently

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 |
| Build | Vite 6 |
| Fonts | opentype.js |
| AI | OpenRouter API (GPT-4.1-nano) |
| Styling | CSS (dark neon + glassmorphism) |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/artem3321/font-generator.git
cd font-generator

# Install dependencies
npm install

# Create .env with your OpenRouter API key
echo "OPENROUTER_API_KEY=your_key_here" > .env

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |

---

## Project Structure

```
src/
├── main.jsx                  # React entry point
├── App.jsx                   # Root component, bento-grid layout
├── App.css                   # Styles, dark neon theme
├── components/
│   ├── ExportButton.jsx      # Export to .ttf / .svg
│   ├── FontUpload.jsx        # Drag-and-drop font upload
│   ├── GlyphEditor.jsx       # Modal glyph editor
│   ├── GlyphGrid.jsx         # Glyph grid with loading animation
│   ├── PhrasePreview.jsx     # Live text preview with generated glyphs
│   └── PromptInput.jsx       # Prompt input + presets + charset selector
├── hooks/
│   └── useFontGeneration.js  # State management and generation logic hook
├── lib/
│   ├── glyphPrompts.js       # Structural hints for each letter
│   ├── glyphReferences.js    # Base template glyphs for A-Z, a-z, 0-9
│   └── pathUtils.js          # SVG path utilities (parsing, serialization, scaling)
└── utils/
    ├── fontBuilder.js        # Build .ttf via opentype.js
    ├── fontParser.js         # Parse uploaded font files
    └── openrouter.js         # OpenRouter API client
```

---

## How It Works

1. **Prompt** — the user describes the desired style or picks a preset
2. **Context** — for each letter, the AI receives a structural description of the shape, a base glyph template, and previously generated characters for style consistency
3. **Generation** — GPT-4.1-nano via OpenRouter returns SVG path data for each glyph
4. **Editing** — the user can fine-tune any glyph through the visual editor, sliders, or direct path editing
5. **Export** — the finished font is assembled with opentype.js and downloaded as `.ttf`

---

## Requirements

- Node.js 18+
- [OpenRouter](https://openrouter.ai/) API key for generation

---

## License

MIT
