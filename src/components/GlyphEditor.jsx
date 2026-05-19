import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getGlyphPathData } from '../utils/fontBuilder';
import { parsePath, serializePath, getEditablePoints, updatePoint } from '../lib/pathUtils';

const SVG_VB = 1000;

export default function GlyphEditor({ letter, glyphData, style, onRegenerate, onUpdate, onClose, generating }) {
  const [editPath, setEditPath] = useState(glyphData?.path || '');
  const [editWidth, setEditWidth] = useState(glyphData?.advanceWidth || 600);
  const [customHint, setCustomHint] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [history, setHistory] = useState([]);
  const [weight, setWeight] = useState(0);
  const [heightScale, setHeightScale] = useState(1);
  const [showPoints, setShowPoints] = useState(false);
  const [dragPoint, setDragPoint] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(`glyph-history-${letter}`);
    if (saved) try { setHistory(JSON.parse(saved)); } catch { setHistory([]); }
  }, [letter]);

  useEffect(() => {
    if (glyphData?.path) setEditPath(glyphData.path);
    if (glyphData?.advanceWidth) setEditWidth(glyphData.advanceWidth);
    setWeight(0);
    setHeightScale(1);
  }, [glyphData?.path, glyphData?.advanceWidth]);

  // Apply height scale to path for rendering
  const displayPath = heightScale !== 1
    ? applyHeightScale(editPath, heightScale)
    : editPath;

  const pathData = (() => {
    try { return getGlyphPathData({ ...glyphData, path: displayPath }); }
    catch { return ''; }
  })();

  const parsedCommands = useMemo(() => parsePath(displayPath), [displayPath]);
  const editPoints = useMemo(() => getEditablePoints(parsedCommands), [parsedCommands]);

  // Convert font coords to SVG display coords
  const toSvg = useCallback((fx, fy) => ({ x: fx, y: 750 - fy }), []);
  const toFont = useCallback((sx, sy) => ({ x: sx, y: 750 - sy }), []);

  const handleMouseDown = useCallback((e, pt) => {
    e.preventDefault();
    e.stopPropagation();
    setDragPoint(pt);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragPoint || !svgRef.current) return;
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const vbSize = 1080; // viewBox size
    const scale = vbSize / rect.width;
    const svgX = (e.clientX - rect.left) * scale - 40;
    const svgY = (e.clientY - rect.top) * scale - 40;
    const font = toFont(svgX, svgY);

    const updated = updatePoint(parsedCommands, dragPoint.cmdIndex, dragPoint.ptIndex, font.x, font.y);
    const newPath = serializePath(updated);
    setEditPath(newPath);
  }, [dragPoint, parsedCommands, toFont]);

  const handleMouseUp = useCallback(() => {
    if (dragPoint) {
      setDragPoint(null);
      // Auto-save on drag end
      onUpdate(letter, { ...glyphData, path: editPath, advanceWidth: editWidth, isReference: false });
    }
  }, [dragPoint, editPath, editWidth, glyphData, letter, onUpdate]);

  useEffect(() => {
    if (!dragPoint) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragPoint, handleMouseMove, handleMouseUp]);

  const handleRegenerate = () => {
    if (glyphData?.path) {
      const entry = { path: glyphData.path, advanceWidth: glyphData.advanceWidth, timestamp: Date.now(), source: 'ai' };
      const newHistory = [entry, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem(`glyph-history-${letter}`, JSON.stringify(newHistory));
    }
    onRegenerate(letter, customHint);
  };

  const handleSaveManual = () => {
    const pathToSave = heightScale !== 1 ? applyHeightScale(editPath, heightScale) : editPath;
    const updated = { ...glyphData, path: pathToSave, advanceWidth: editWidth, isReference: false };
    if (glyphData?.path) {
      const entry = { path: glyphData.path, advanceWidth: glyphData.advanceWidth, timestamp: Date.now(), source: 'manual' };
      const newHistory = [entry, ...history].slice(0, 20);
      setHistory(newHistory);
      localStorage.setItem(`glyph-history-${letter}`, JSON.stringify(newHistory));
    }
    onUpdate(letter, updated);
    setHeightScale(1);
  };

  const handleRestore = (entry) => {
    setEditPath(entry.path);
    setEditWidth(entry.advanceWidth);
    setHeightScale(1);
    setWeight(0);
    onUpdate(letter, { ...glyphData, path: entry.path, advanceWidth: entry.advanceWidth, isReference: false });
  };

  const pad = 40;

  return (
    <div className="editor-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="editor-modal editor-full">
        <div className="editor-header">
          <div className="editor-title">
            <h2><span>{letter}</span></h2>
            <span className="editor-unicode">U+{letter.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}</span>
          </div>
          <button className="close-btn" onClick={onClose}>Esc</button>
        </div>

        <div className="editor-body">
          {/* Left: Preview with draggable points */}
          <div className="editor-left">
            <div className="editor-preview" style={{ aspectRatio: '1' }}>
              {pathData ? (
                <svg
                  ref={svgRef}
                  viewBox={`${-pad} ${-pad} ${SVG_VB + pad * 2} ${SVG_VB + pad * 2}`}
                  className="editor-svg"
                  style={{ cursor: dragPoint ? 'grabbing' : 'default' }}
                >
                  <rect x="0" y="0" width="1000" height="1000" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                  <line x1="-40" y1="50" x2="1040" y2="50" stroke="rgba(192,132,252,0.3)" strokeWidth="1.5" />
                  <line x1="-40" y1="230" x2="1040" y2="230" stroke="rgba(251,191,36,0.2)" strokeWidth="1" strokeDasharray="6 3" />
                  <line x1="-40" y1="750" x2="1040" y2="750" stroke="rgba(34,211,167,0.4)" strokeWidth="2" />
                  <line x1="-40" y1="950" x2="1040" y2="950" stroke="rgba(239,68,68,0.15)" strokeWidth="1" strokeDasharray="6 3" />
                  <line x1={editWidth} y1="-20" x2={editWidth} y2="1020" stroke="rgba(255,255,255,0.08)" strokeWidth="1" strokeDasharray="4 4" />

                  <g transform="translate(0, 750) scale(1, -1)">
                    <path d={pathData}
                      fill={weight > 0 ? 'var(--accent)' : 'currentColor'}
                      stroke={weight > 0 ? 'currentColor' : 'none'}
                      strokeWidth={weight * 20}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      paintOrder="stroke"
                    />
                  </g>

                  {/* Draggable points */}
                  {showPoints && editPoints.map((pt, i) => {
                    const svg = toSvg(pt.x, pt.y);
                    return (
                      <g key={i}>
                        <circle
                          cx={svg.x} cy={svg.y} r="14"
                          fill={dragPoint?.cmdIndex === pt.cmdIndex && dragPoint?.ptIndex === pt.ptIndex ? 'var(--accent)' : 'rgba(34,211,167,0.6)'}
                          stroke="white" strokeWidth="2"
                          style={{ cursor: 'grab' }}
                          onMouseDown={(e) => handleMouseDown(e, pt)}
                        />
                        <text x={svg.x + 10} y={svg.y - 10} fontSize="16" fill="rgba(255,255,255,0.4)" fontFamily="monospace">
                          {Math.round(pt.x)},{Math.round(pt.y)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : <div className="no-preview">No preview</div>}
            </div>
            <div className="preview-word">
              <span className="preview-label">Test:</span>
              <span className="preview-text">{letter}{letter.toLowerCase()}</span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="editor-right">
            <div className="editor-tabs">
              <button className={`editor-tab ${activeTab === 'preview' ? 'active' : ''}`} onClick={() => setActiveTab('preview')}>Generate</button>
              <button className={`editor-tab ${activeTab === 'adjust' ? 'active' : ''}`} onClick={() => setActiveTab('adjust')}>Adjust</button>
              <button className={`editor-tab ${activeTab === 'path' ? 'active' : ''}`} onClick={() => setActiveTab('path')}>Path</button>
              <button className={`editor-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
            </div>

            {/* Tab: Generate */}
            {activeTab === 'preview' && (
              <div className="editor-tab-content">
                <div className="editor-field">
                  <label>Custom instructions</label>
                  <textarea value={customHint} onChange={(e) => setCustomHint(e.target.value)}
                    placeholder={`e.g. "make crossbar thinner", "more rounded"`} rows={3} />
                </div>
                <button className="regenerate-btn" onClick={handleRegenerate} disabled={generating}>
                  {generating ? <><span className="btn-spinner" /> Generating...</> : 'Regenerate with AI'}
                </button>
              </div>
            )}

            {/* Tab: Adjust */}
            {activeTab === 'adjust' && (
              <div className="editor-tab-content">
                <div className="editor-field">
                  <label>Weight (thickness): {weight}</label>
                  <input type="range" min="0" max="5" step="0.1" value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))} />
                  <div className="range-labels"><span>Light</span><span>Bold</span></div>
                </div>
                <div className="editor-field">
                  <label>Height scale: {heightScale.toFixed(2)}x</label>
                  <input type="range" min="0.5" max="1.5" step="0.02" value={heightScale}
                    onChange={(e) => setHeightScale(Number(e.target.value))} />
                  <div className="range-labels"><span>Short</span><span>Normal</span><span>Tall</span></div>
                </div>
                <div className="editor-field">
                  <label>Advance Width: {editWidth}</label>
                  <input type="range" min="200" max="1000" step="10" value={editWidth}
                    onChange={(e) => setEditWidth(Number(e.target.value))} />
                </div>
                <div className="editor-field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} />
                    Show edit points (drag to move)
                  </label>
                </div>
                <button className="save-path-btn" onClick={handleSaveManual}>
                  Apply changes
                </button>
              </div>
            )}

            {/* Tab: Path */}
            {activeTab === 'path' && (
              <div className="editor-tab-content">
                <div className="editor-field">
                  <label>SVG Path Data</label>
                  <textarea value={editPath} onChange={(e) => setEditPath(e.target.value)}
                    placeholder="M100 0 L300 700 L500 0 Z" rows={8} className="path-editor" />
                </div>
                <button className="save-path-btn" onClick={handleSaveManual}>Save path</button>
              </div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
              <div className="editor-tab-content">
                {history.length === 0 ? (
                  <p className="no-history">No history yet</p>
                ) : (
                  <div className="history-list">
                    {history.map((entry, i) => {
                      const ep = (() => { try { return getGlyphPathData({ path: entry.path }); } catch { return ''; } })();
                      return (
                        <div key={entry.timestamp + i} className="history-item">
                          <div className="history-preview">
                            <svg viewBox="0 0 1000 1000" className="history-svg">
                              <g transform="translate(0, 750) scale(1, -1)">
                                {ep && <path d={ep} fill="currentColor" />}
                              </g>
                            </svg>
                          </div>
                          <div className="history-info">
                            <span className="history-source">{entry.source}</span>
                            <span className="history-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <button className="history-restore" onClick={() => handleRestore(entry)}>Restore</button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="editor-footer">
          <button className="cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function applyHeightScale(pathStr, scale) {
  const commands = parsePath(pathStr);
  const baseline = 0;
  const scaled = commands.map(cmd => ({
    ...cmd,
    points: cmd.points.map(pt => ({
      x: pt.x,
      y: baseline + (pt.y - baseline) * scale,
    })),
  }));
  return serializePath(scaled);
}
