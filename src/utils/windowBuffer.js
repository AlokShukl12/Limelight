// Simple sliding window buffer tuned for 1Hz streams.
export default function createWindowBuffer() {
  const buffer = [];

  const add = (sample) => {
    buffer.push(sample);
  };

  const prune = (windowMinutes) => {
    if (!buffer.length) return;
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    // Drop entries older than cutoff
    while (buffer.length && Date.parse(buffer[0].ts) < cutoff) {
      buffer.shift();
    }
  };

  const getWindow = (windowMinutes) => {
    if (!buffer.length) return [];
    const cutoff = Date.now() - windowMinutes * 60 * 1000;
    let idx = 0;
    while (idx < buffer.length && Date.parse(buffer[idx].ts) < cutoff) idx += 1;
    return buffer.slice(idx);
  };

  const getLastTimestamp = () => buffer[buffer.length - 1]?.ts;

  return {
    add,
    prune,
    getWindow,
    getLastTimestamp,
  };
}
