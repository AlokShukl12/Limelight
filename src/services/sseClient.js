let lastMsgTime = 0;
let currentSource = null;

// Minimal schema guard (aligned to schema_v2.json)
const REQUIRED_FIELDS = [
  'ts',
  'machine_id',
  'state',
  'mode',
  'status',
  'vr',
  'vy',
  'vb',
  'ir',
  'iy',
  'ib',
  'kw',
  'kwh_total',
  'pf',
  'count_total',
];

const enums = {
  state: ['RUN', 'IDLE', 'OFF'],
  mode: ['ACTIVE', 'STANDBY', 'MAINT'],
  status: ['OK', 'WARN', 'FAULT'],
};

const isNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isInt = (v) => Number.isInteger(v);

const validateSample = (sample) => {
  if (!sample || typeof sample !== 'object') return false;
  if (!sample.ts || Number.isNaN(Date.parse(sample.ts))) return false;
  if (typeof sample.machine_id !== 'string' || !sample.machine_id.trim()) return false;
  // Required presence
  const hasAll = REQUIRED_FIELDS.every((f) => sample[f] !== undefined && sample[f] !== null);
  if (!hasAll) return false;
  // Enums
  if (!enums.state.includes(sample.state)) return false;
  if (!enums.mode.includes(sample.mode)) return false;
  if (!enums.status.includes(sample.status)) return false;
  // Numbers and ranges
  if (![sample.vr, sample.vy, sample.vb, sample.ir, sample.iy, sample.ib].every(isNumber)) {
    return false;
  }
  if (!isNumber(sample.kw) || sample.kw < 0) return false;
  if (!isNumber(sample.kwh_total) || sample.kwh_total < 0) return false;
  if (!isNumber(sample.pf) || sample.pf < 0 || sample.pf > 1) return false;
  if (!isInt(sample.count_total) || sample.count_total < 0) return false;
  return true;
};

const connectSSE = (url, onData, onError = console.error, onOpen = () => {}) => {
  let retry = 0;

  const start = () => {
    if (currentSource) currentSource.close();
    const es = new EventSource(url);
    currentSource = es;

    es.onopen = () => {
      retry = 0;
      onOpen();
    };

    es.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data);
        if (validateSample(payload)) {
          lastMsgTime = Date.now();
          onData(payload);
        } else {
          console.warn('Dropping invalid sample', payload);
        }
      } catch (e) {
        console.warn('Failed to parse SSE payload', e);
      }
    };

    es.onerror = (err) => {
      es.close();
      const backoff = Math.min(30000, 1000 * 2 ** retry);
      retry += 1;
      setTimeout(start, backoff);
      onError(err);
    };
  };

  start();

  return {
    close() {
      if (currentSource) currentSource.close();
    },
  };
};

const getLastMsgTime = () => lastMsgTime;

export { connectSSE, getLastMsgTime };
