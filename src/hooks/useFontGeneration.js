import { useState, useCallback, useRef } from 'react';
import { generateGlyph } from '../utils/openrouter';
import { createFontFromGlyphs } from '../utils/fontBuilder';
import { REFERENCE_GLYPHS } from '../lib/glyphReferences';
import { parseUploadedFont } from '../utils/fontParser';

const ALPHABET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ALPHABET_LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
const DIGITS = '0123456789'.split('');

const STORAGE_KEY = 'font-generator-project';

function getLetters(charset) {
  switch (charset) {
    case 'upper': return ALPHABET_UPPER;
    case 'lower': return ALPHABET_LOWER;
    case 'digits': return DIGITS;
    case 'all': return [...ALPHABET_UPPER, ...ALPHABET_LOWER, ...DIGITS];
    default: return ALPHABET_UPPER;
  }
}

export default function useFontGeneration() {
  const [glyphs, setGlyphs] = useState(() => {
    // Restore from localStorage on init
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.glyphs && Object.keys(data.glyphs).length > 0) return data.glyphs;
      }
    } catch {}
    return {};
  });
  const [style, setStyle] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).style || '';
    } catch {}
    return '';
  });
  const [fontFamily, setFontFamily] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).fontFamily || 'GeneratedFont';
    } catch {}
    return 'GeneratedFont';
  });
  const [progress, setProgress] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loadingLetters, setLoadingLetters] = useState({});
  const [errors, setErrors] = useState([]);
  const abortRef = useRef(false);

  // Auto-save to localStorage whenever glyphs, style, or fontFamily change
  const saveProject = useCallback((g, s, f) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        glyphs: g,
        style: s,
        fontFamily: f,
        savedAt: Date.now(),
      }));
    } catch (e) {
      console.warn('[font-gen] Save failed:', e);
    }
  }, []);

  const loadReferences = useCallback((charset = 'upper') => {
    const letters = getLetters(charset);
    const refs = {};
    for (const letter of letters) {
      if (REFERENCE_GLYPHS[letter]) {
        refs[letter] = { ...REFERENCE_GLYPHS[letter], isReference: true };
      }
    }
    setGlyphs(refs);
    setErrors([]);
    setLoadingLetters({});
    saveProject(refs, style, fontFamily);
  }, [style, fontFamily, saveProject]);

  const loadUploadedFont = useCallback((arrayBuffer, fileName) => {
    const parsed = parseUploadedFont(arrayBuffer);
    const refs = {};
    for (const [char, data] of Object.entries(parsed.glyphs)) {
      refs[char] = { ...data, isReference: true };
    }
    if (Object.keys(refs).length === 0) {
      setErrors(prev => [...prev, { letter: '?', error: 'No printable glyphs found in font' }]);
      return false;
    }
    setGlyphs(refs);
    setErrors([]);
    setLoadingLetters({});
    const newName = parsed.familyName || fileName?.replace(/\.(ttf|otf|woff)$/i, '') || 'Uploaded Font';
    setFontFamily(newName);
    saveProject(refs, style, newName);
    return true;
  }, [style, saveProject]);

  const generateAlphabet = useCallback(async (prompt, charset = 'upper') => {
    const letters = getLetters(charset);

    setGlyphs(prev => {
      if (Object.keys(prev).length === 0) {
        const refs = {};
        for (const l of letters) {
          if (REFERENCE_GLYPHS[l]) refs[l] = { ...REFERENCE_GLYPHS[l], isReference: true };
        }
        return refs;
      }
      return prev;
    });

    setStyle(prompt);
    setGenerating(true);
    setErrors([]);
    abortRef.current = false;

    const existingForContext = {};
    const newGlyphs = {};

    // Capture current glyphs snapshot for template overrides (uploaded fonts)
    const currentGlyphsSnapshot = { ...glyphs };

    for (let i = 0; i < letters.length; i++) {
      if (abortRef.current) break;

      const letter = letters[i];
      setLoadingLetters(prev => ({ ...prev, [letter]: true }));
      setProgress({ done: i, total: letters.length, letter, status: 'generating' });

      try {
        const templateGlyph = currentGlyphsSnapshot[letter] || null;
        const glyph = await generateGlyph(letter, prompt, existingForContext, '', templateGlyph);
        const cleanGlyph = { ...glyph, isReference: false };
        newGlyphs[letter] = cleanGlyph;
        existingForContext[letter] = cleanGlyph;
        setGlyphs(prev => {
          const updated = { ...prev, [letter]: cleanGlyph };
          saveProject(updated, prompt, fontFamily);
          return updated;
        });
        setProgress({ done: i + 1, total: letters.length, letter, glyph: cleanGlyph, status: 'done' });
      } catch (err) {
        setErrors(prev => [...prev, { letter, error: err.message }]);
        setProgress({ done: i + 1, total: letters.length, letter, error: err.message, status: 'error' });
      }

      setLoadingLetters(prev => {
        const next = { ...prev };
        delete next[letter];
        return next;
      });

      if (i < letters.length - 1 && !abortRef.current) {
        await new Promise(r => setTimeout(r, 400));
      }
    }

    setGenerating(false);
    setProgress(null);
  }, [fontFamily, saveProject]);

  // Regenerate a single glyph with optional custom hint
  const regenerateGlyph = useCallback(async (letter, customHint = '') => {
    if (!style) return;

    setLoadingLetters(prev => ({ ...prev, [letter]: true }));

    try {
      const templateGlyph = glyphs[letter] || null;
      const glyph = await generateGlyph(letter, style, glyphs, customHint, templateGlyph);
      const cleanGlyph = { ...glyph, isReference: false };
      setGlyphs(prev => {
        const updated = { ...prev, [letter]: cleanGlyph };
        saveProject(updated, style, fontFamily);
        return updated;
      });
    } catch (err) {
      setErrors(prev => [...prev, { letter, error: err.message }]);
    }

    setLoadingLetters(prev => {
      const next = { ...prev };
      delete next[letter];
      return next;
    });
  }, [style, glyphs, fontFamily, saveProject]);

  // Update a single glyph manually (from path editor)
  const updateGlyph = useCallback((letter, data) => {
    setGlyphs(prev => {
      const updated = { ...prev, [letter]: { ...data, isReference: false } };
      saveProject(updated, style, fontFamily);
      return updated;
    });
  }, [style, fontFamily, saveProject]);

  const abort = useCallback(() => {
    abortRef.current = true;
    setGenerating(false);
    setProgress(null);
    setLoadingLetters({});
  }, []);

  const clearGlyphs = useCallback(() => {
    setGlyphs({});
    setErrors([]);
    setLoadingLetters({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportFont = useCallback(() => {
    if (Object.keys(glyphs).length === 0) return null;
    return createFontFromGlyphs(glyphs, fontFamily);
  }, [glyphs, fontFamily]);

  return {
    glyphs,
    style,
    fontFamily,
    setFontFamily: (name) => {
      setFontFamily(name);
      saveProject(glyphs, style, name);
    },
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
    exportFont,
    clearGlyphs,
  };
}
