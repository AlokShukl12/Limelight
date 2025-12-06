import Papa from 'papaparse';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Charts from './components/Charts.jsx';
import Insights from './components/Insights.jsx';
import KPIs from './components/KPIs.jsx';
import ReplayControls from './components/ReplayControls.jsx';
import createReplayPlayer from './services/replayPlayer.js';
import { connectSSE, getLastMsgTime } from './services/sseClient.js';
import { computeInsights } from './utils/insights.js';
import { computeKPIs } from './utils/stats.js';
import createWindowBuffer from './utils/windowBuffer.js';

const LIVE_URL = 'http://localhost:8080/stream';
const REPLAY_URL = '/device_stream_20min.jsonl';
const WINDOW_OPTIONS = [5, 15, 30];

const App = () => {
  const [mode, setMode] = useState('LIVE');
  const [windowMinutes, setWindowMinutes] = useState(15);
  const [windowSamples, setWindowSamples] = useState([]);
  const [kpis, setKpis] = useState({});
  const [insights, setInsights] = useState([]);
  const [highlightWindow, setHighlightWindow] = useState(null);
  const [gap, setGap] = useState(false);
  const [replayMeta, setReplayMeta] = useState({ total: 0, position: 0, speed: 1 });
  const [playing, setPlaying] = useState(false);
  const [lastTs, setLastTs] = useState(null);

  const bufferRef = useRef(createWindowBuffer());
  const sseRef = useRef(null);
  const replayRef = useRef(null);
  const replayLoaded = useRef(false);

  const refreshWindow = React.useCallback(
    (minutes = windowMinutes) => {
      const snapshot = bufferRef.current.getWindow(minutes);
      const insightConfig = {
        // Spec asks for 30 min idle; allow shorter when window is smaller to surface insights on sample data.
        idleMinutes: Math.min(30, Math.max(10, minutes)),
        pfThreshold: 0.8,
        lowPfMinutes: 5,
        imbalancePct: 15,
        imbalanceMinutes: 2,
      };
      setWindowSamples(snapshot);
      setKpis(computeKPIs(snapshot, minutes));
      setInsights(computeInsights(snapshot, insightConfig));
    },
    [windowMinutes]
  );

  const handleSample = (sample) => {
    bufferRef.current.add(sample);
    bufferRef.current.prune(windowMinutes);
    setLastTs(sample.ts);
    refreshWindow();
    if (replayRef.current) setReplayMeta(replayRef.current.getMeta());
  };

  // Initialise replay controller
  useEffect(() => {
    replayRef.current = createReplayPlayer(
      (s) => handleSample(s),
      (state) => setPlaying(state === 'playing')
    );
  }, []);

  // Live connection
  useEffect(() => {
    if (mode === 'LIVE') {
      bufferRef.current = createWindowBuffer();
      refreshWindow();
      sseRef.current = connectSSE(LIVE_URL, handleSample, console.error, () =>
        console.info('SSE connected')
      );
    } else if (sseRef.current) {
      sseRef.current.close();
    }
    return () => {
      if (sseRef.current) sseRef.current.close();
    };
  }, [mode]);

  // Load default replay on first switch to REPLAY
  useEffect(() => {
    const loadDefault = async () => {
      if (replayRef.current && !replayLoaded.current) {
        replayLoaded.current = true;
        const samples = await replayRef.current.loadFromFile(REPLAY_URL);
        setReplayMeta(replayRef.current.getMeta());
        // Prime the buffer with first sample for initial view
        if (samples[0]) handleSample(samples[0]);
      }
    };
    if (mode === 'REPLAY') {
      bufferRef.current = createWindowBuffer();
      refreshWindow();
      loadDefault();
    }
  }, [mode]);

  // Gap detector for live mode
  useEffect(() => {
    const id = setInterval(() => {
      const last = lastTs ? Date.parse(lastTs) : getLastMsgTime();
      setGap(mode === 'LIVE' && last && Date.now() - last > 10000);
    }, 1000);
    return () => clearInterval(id);
  }, [mode, lastTs]);

  const onExportCSV = () => {
    try {
      const data = windowSamples.length
        ? windowSamples
        : bufferRef.current.getWindow(windowMinutes);
      if (!data.length) {
        console.warn('CSV export skipped: no samples in window.');
        return;
      }
      const plain = data.map((s) => ({ ...s }));
      const csv = Papa.unparse(plain);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `window_${windowMinutes}min_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 250);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export CSV. Check console for details.');
    }
  };

  const onCopyLink = () => {
    const params = new URLSearchParams({
      mode,
      window: windowMinutes,
      ts: lastTs || '',
    });
    const permalink = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(permalink);
  };

  const handleHighlight = (evidence) => {
    setHighlightWindow(evidence);
  };

  const onReplayFile = async (file) => {
    bufferRef.current = createWindowBuffer();
    refreshWindow();
    await replayRef.current.loadFromFile(file);
    setReplayMeta(replayRef.current.getMeta());
  };

  const onSeek = (idx) => {
    bufferRef.current = createWindowBuffer();
    refreshWindow();
    replayRef.current.seek(idx);
    setReplayMeta(replayRef.current.getMeta());
  };

  const onPlay = () => {
    replayRef.current?.play();
    setReplayMeta(replayRef.current?.getMeta());
  };

  const onPause = () => {
    replayRef.current?.pause();
  };

  const onSpeedChange = (s) => {
    replayRef.current?.setSpeed(s);
    setReplayMeta(replayRef.current?.getMeta());
  };

  const headerSub = useMemo(
    () =>
      mode === 'LIVE'
        ? 'Streaming from SSE'
        : `Replay: ${replayMeta.total} samples, speed ${replayMeta.speed || 1}x`,
    [mode, replayMeta]
  );

  return (
    <>
      <div className="header">
        <div>
          <p className="title">Limelight Dashboard</p>
          <p className="muted">{headerSub}</p>
        </div>
        <div className="controls-row">
          <button
            className={`mode-toggle ${mode === 'LIVE' ? 'active' : ''}`}
            onClick={() => setMode('LIVE')}
          >
            Live
          </button>
          <button
            className={`mode-toggle ${mode === 'REPLAY' ? 'active' : ''}`}
            onClick={() => setMode('REPLAY')}
          >
            Replay
          </button>
          <div className="controls-row" aria-label="Window selector">
            {WINDOW_OPTIONS.map((w) => (
              <button
                key={w}
                className={`window-btn ${windowMinutes === w ? 'active' : ''}`}
                onClick={() => {
                  setWindowMinutes(w);
                  refreshWindow(w);
                }}
              >
                {w} min
              </button>
            ))}
          </div>
          {gap ? <span className="gap-indicator">Gap &gt; 10s</span> : null}
        </div>
      </div>

      <div className="app-shell">
        <div>
          <KPIs
            kpis={kpis}
            samples={windowSamples}
            onExportCSV={onExportCSV}
            onCopyLink={onCopyLink}
          />
        </div>
        <div>
          <Charts samples={windowSamples} highlightWindow={highlightWindow} />
        </div>
        <div>
          <Insights insights={insights} onHighlight={handleHighlight} />
          {mode === 'REPLAY' ? (
            <ReplayControls
              total={replayMeta.total}
              position={replayMeta.position}
              playing={playing}
              speed={replayMeta.speed}
              onPlay={onPlay}
              onPause={onPause}
              onSpeedChange={onSpeedChange}
              onSeek={onSeek}
              onLoadFile={onReplayFile}
            />
          ) : null}
        </div>
      </div>
    </>
  );
};

export default App;
