import { buildReferenceContext } from '../lib/glyphReferences';
import { getLetterHint } from '../lib/glyphPrompts';

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4.1-nano';

const SYSTEM_PROMPT = `You are a font designer. You receive a BASE TEMPLATE glyph and modify it to match a requested style.

COORDINATE SYSTEM (fixed, never change these rules):
- x: 0 (left) to ~advanceWidth (right), glyph body stays between 40-advanceWidth-40
- y: UP direction. 0 = baseline, 700 = cap height (top of tall letters), -200 = descender
- Small letters (a-z): body between y=0 and y=520, ascenders to y=700, descenders to y=-200

OUTPUT FORMAT - return ONLY valid JSON:
{
  "name": "A",
  "unicode": 65,
  "advanceWidth": 650,
  "path": "M40 0 L290 720 L340 720 L590 0 L530 0 L460 180 L170 180 L100 0 Z M190 240 L440 240 L315 580 Z"
}

PATH RULES:
- Commands: M (moveTo), L (lineTo), C (cubic bezier: C x1 y1 x2 y2 x y), Q (quadratic), Z (close)
- Every contour starts with M and ends with Z
- Letters with holes (A, B, O, etc): outer contour M...Z then hole M...Z
- All coordinates must be reasonable numbers (no negative x, no y above 750 or below -250)
- KEEP the same advanceWidth as the template unless the style demands wider/narrower
- KEEP the letter recognizable - it must look like the intended letter`;

export async function generateGlyph(letter, style, existingGlyphs = {}, customHint = '', glyphOverride = null) {
  const referenceTemplate = glyphOverride
    ? JSON.stringify({ name: glyphOverride.name, unicode: glyphOverride.unicode, advanceWidth: glyphOverride.advanceWidth, path: glyphOverride.path })
    : buildReferenceContext(letter);
  const letterHint = getLetterHint(letter);

  const existingContext = Object.keys(existingGlyphs).length > 0
    ? `\n\nAlready generated for style reference:\n${JSON.stringify(Object.fromEntries(Object.entries(existingGlyphs).slice(-3)), null, 2)}`
    : '';

  const extraInstructions = customHint
    ? `\n\nAdditional user instructions: ${customHint}`
    : '';

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Here is the BASE TEMPLATE for the letter "${letter}":
${referenceTemplate}

Apply this style: "${style}"

Letter structure: ${letterHint}

Instructions:
- Start from the template shape above
- Modify the path to reflect the "${style}" style
- The letter must be recognizable as "${letter}" — ${letterHint}
- Keep coordinates in valid range (x: 0-advanceWidth, y: -200 to 750)
- You can use curves (C, Q) for rounder styles, or straight lines (L) for geometric styles
- Return ONLY the modified JSON object${extraInstructions}
${existingContext}`
        }
      ],
      temperature: 0.75,
      max_tokens: 1000,
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`[font-gen] API error ${response.status}:`, err);
    throw new Error(`API ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error('[font-gen] Empty response:', data);
    throw new Error('Empty response from API');
  }

  console.log(`[font-gen] "${letter}" raw:`, content.slice(0, 400));

  try {
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return {
      name: parsed.name || letter,
      unicode: parsed.unicode || letter.charCodeAt(0),
      advanceWidth: parsed.advanceWidth || 600,
      path: parsed.path || '',
    };
  } catch (e) {
    console.error(`[font-gen] Parse failed "${letter}":`, e.message, '\nRaw:', content);
    throw new Error(`Parse error "${letter}": ${e.message}`);
  }
}

export async function generateGlyphBatch(letters, style, onProgress) {
  const results = {};
  const existingForContext = {};

  for (let i = 0; i < letters.length; i++) {
    const letter = letters[i];
    try {
      const glyph = await generateGlyph(letter, style, existingForContext);
      results[letter] = glyph;
      existingForContext[letter] = glyph;
      onProgress?.({ done: i + 1, total: letters.length, letter, glyph, status: 'done' });
    } catch (err) {
      console.error(`[font-gen] Failed "${letter}":`, err.message);
      onProgress?.({ done: i + 1, total: letters.length, letter, error: err.message, status: 'error' });
    }

    if (i < letters.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}
