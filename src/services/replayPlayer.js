// Lightweight replay controller for 1Hz JSONL streams.
const DEFAULT_INTERVAL_MS = 1000;

const parseJsonl = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        console.warn('Bad JSONL line skipped', line);
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts));

const loadFromSource = async (source) => {
  if (!source) return [];
  if (typeof source === 'string') {
    const res = await fetch(source);
    const txt = await res.text();
    return parseJsonl(txt);
  }
  if (source instanceof File || source?.text) {
    const txt = await source.text();
    return parseJsonl(txt);
  }
  if (Array.isArray(source)) return source;
  return [];
};

const createReplayPlayer = (onSample = () => {}, onStateChange = () => {}) => {
  let samples = [];
  let idx = 0;
  let timer = null;
  let speed = 1;

  const emitState = (state) => onStateChange(state);

  const play = () => {
    if (!samples.length) return;
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (idx >= samples.length) {
        pause();
        return;
      }
      onSample(samples[idx]);
      idx += 1;
    }, DEFAULT_INTERVAL_MS / speed);
    emitState('playing');
  };

  const pause = () => {
    if (timer) clearInterval(timer);
    timer = null;
    emitState('paused');
  };

  const seek = (target) => {
    if (!samples.length) return;
    if (typeof target === 'number') {
      idx = Math.min(samples.length - 1, Math.max(0, target));
      return;
    }
    const ts = Date.parse(target);
    if (Number.isNaN(ts)) return;
    idx = samples.findIndex((s) => Date.parse(s.ts) >= ts);
    if (idx === -1) idx = samples.length - 1;
  };

  const setSpeed = (mult) => {
    if (!mult || mult <= 0) return;
    speed = mult;
    if (timer) play(); // restart interval with new speed
  };

  const loadFromFile = async (source) => {
    samples = await loadFromSource(source);
    idx = 0;
    emitState('loaded');
    return samples;
  };

  const getMeta = () => ({
    total: samples.length,
    position: idx,
    startTs: samples[0]?.ts,
    endTs: samples[samples.length - 1]?.ts,
    speed,
  });

  return {
    loadFromFile,
    play,
    pause,
    seek,
    setSpeed,
    getMeta,
  };
};

export default createReplayPlayer;
