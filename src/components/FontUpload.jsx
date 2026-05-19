import { useRef, useState } from 'react';

export default function FontUpload({ onUpload, disabled }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);

    if (!/\.(ttf|otf|woff)$/i.test(file.name)) {
      setError('Only .ttf, .otf, .woff files supported');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const result = onUpload(buffer, file.name);
      if (result) setFileName(file.name);
    } catch (e) {
      setError('Failed to parse font file');
    }
  };

  const handleChange = (e) => {
    handleFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={`font-upload ${dragging ? 'dragging' : ''} ${fileName ? 'has-file' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".ttf,.otf,.woff"
        onChange={handleChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />
      <div className="upload-content">
        {fileName ? (
          <>
            <span className="upload-icon">&#10003;</span>
            <span className="upload-label">{fileName}</span>
          </>
        ) : (
          <>
            <span className="upload-icon">&#8593;</span>
            <span className="upload-label">Drop .ttf .otf .woff or click</span>
          </>
        )}
      </div>
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
}
