const toMs = (ts) => Date.parse(ts);

const computeStateDurations = (samples) => {
  const durations = { RUN: 0, IDLE: 0, OFF: 0 };
  if (samples.length < 2) return durations;
  for (let i = 0; i < samples.length - 1; i += 1) {
    const curr = samples[i];
    const next = samples[i + 1];
    const delta = Math.max(0, toMs(next.ts) - toMs(curr.ts));
    durations[curr.state] = (durations[curr.state] || 0) + delta;
  }
  // Assume 1s for the tail sample
  const last = samples[samples.length - 1];
  durations[last.state] = (durations[last.state] || 0) + 1000;
  return durations;
};

const mean = (arr) => {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

const computePhaseImbalance = (samples) => {
  if (!samples.length) return 0;
  const imbalances = samples.map((s) => {
    const currents = [s.ir, s.iy, s.ib].map((v) => Number(v) || 0);
    const maxI = Math.max(...currents);
    const minI = Math.min(...currents);
    const avg = mean(currents) || 1;
    return ((maxI - minI) / avg) * 100;
  });
  return mean(imbalances);
};

export const computeKPIs = (samples, windowMinutes) => {
  if (!samples || !samples.length) {
    return {
      uptimePct: 0,
      idlePct: 0,
      offPct: 0,
      avgKw: 0,
      energyKwh: 0,
      pfAvg: 0,
      throughputPerMin: 0,
      rolling60Rate: 0,
      phaseImbalance: 0,
    };
  }

  const durations = computeStateDurations(samples);
  const totalDuration = Object.values(durations).reduce((a, b) => a + b, 0) || 1;
  const uptimePct = ((durations.RUN || 0) / totalDuration) * 100;
  const idlePct = ((durations.IDLE || 0) / totalDuration) * 100;
  const offPct = ((durations.OFF || 0) / totalDuration) * 100;

  const kwValues = samples.map((s) => Number(s.kw) || 0);
  const avgKw = mean(kwValues);

  const kwhTotals = samples.map((s) => Number(s.kwh_total)).filter((v) => !Number.isNaN(v));
  const energyKwh =
    kwhTotals.length > 1 ? Math.max(...kwhTotals) - Math.min(...kwhTotals) : 0;

  const pfValues = samples
    .filter((s) => s.state !== 'OFF')
    .map((s) => Number(s.pf))
    .filter((v) => !Number.isNaN(v));
  const pfAvg = mean(pfValues);

  const first = samples[0];
  const last = samples[samples.length - 1];
  const countDelta = (Number(last.count_total) || 0) - (Number(first.count_total) || 0);
  const durationMinutes = windowMinutes || Math.max(0.001, (toMs(last.ts) - toMs(first.ts)) / 60000);
  const throughputPerMin = countDelta / durationMinutes;

  // Rolling 60s rate
  const lastTsMs = toMs(last.ts);
  const start60 = lastTsMs - 60000;
  const recent = samples.filter((s) => toMs(s.ts) >= start60);
  let rolling60Rate = 0;
  if (recent.length > 1) {
    const startRecent = recent[0];
    const endRecent = recent[recent.length - 1];
    const deltaRecent =
      (Number(endRecent.count_total) || 0) - (Number(startRecent.count_total) || 0);
    const sec = Math.max(1, (toMs(endRecent.ts) - toMs(startRecent.ts)) / 1000);
    rolling60Rate = (deltaRecent / sec) * 60; // units per minute
  }

  const phaseImbalance = computePhaseImbalance(samples);

  return {
    uptimePct,
    idlePct,
    offPct,
    avgKw,
    energyKwh,
    pfAvg,
    throughputPerMin,
    rolling60Rate,
    phaseImbalance,
  };
};
