import React, { useRef } from 'react';

const speeds = [0.25, 0.5, 1, 2, 4];

const ReplayControls = ({
  total = 0,
  position = 0,
  playing = false,
  speed = 1,
  onPlay,
  onPause,
  onSpeedChange,
  onSeek,
  onLoadFile,
}) => {
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file && onLoadFile) onLoadFile(file);
  };

  const handleSeek = (e) => {
    const idx = Number(e.target.value) || 0;
    onSeek?.(idx);
  };

  return (
    <div className="card">
      <div className="controls-stack">
        <button className="btn primary" onClick={playing ? onPause : onPlay}>
          {playing ? 'Pause' : 'Play'}
        </button>
        <div className="controls-row" role="group" aria-label="Playback speed">
          {speeds.map((s) => (
            <button
              key={s}
              className={`window-btn ${speed === s ? 'active' : ''}`}
              onClick={() => onSpeedChange?.(s)}
            >
              {s}x
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => fileRef.current?.click()}>
          Load JSONL
        </button>
        <input
          type="file"
          accept=".jsonl,application/json"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <label className="muted" htmlFor="seek">
          Seek
        </label>
        <input
          id="seek"
          type="range"
          min={0}
          max={Math.max(total - 1, 0)}
          value={Math.min(position, Math.max(total - 1, 0))}
          onChange={handleSeek}
        />
        <div className="muted">
          {position} / {total} samples
        </div>
      </div>
    </div>
  );
};

export default ReplayControls;
