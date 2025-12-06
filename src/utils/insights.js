const MINUTE = 60 * 1000;

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

const findIdleStretches = (samples, thresholdMin = 30) => {
  const insights = [];
  let start = null;

  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i];
    if (s.state === 'IDLE') {
      if (!start) start = s;
    } else if (start) {
      const duration = Date.parse(samples[i - 1].ts) - Date.parse(start.ts);
      if (duration >= thresholdMin * MINUTE) {
        insights.push({
          id: `idle-${start.ts}`,
          type: 'idle',
          title: 'Extended Idle',
          description: `Idle stretch for ${Math.round(duration / MINUTE)} minutes.`,
          evidence: { start: start.ts, end: samples[i - 1].ts },
        });
      }
      start = null;
    }
  }

  if (start) {
    const duration = Date.parse(samples[samples.length - 1].ts) - Date.parse(start.ts);
    if (duration >= thresholdMin * MINUTE) {
      insights.push({
        id: `idle-${start.ts}`,
        type: 'idle',
        title: 'Extended Idle',
        description: `Idle stretch for ${Math.round(duration / MINUTE)} minutes.`,
        evidence: { start: start.ts, end: samples[samples.length - 1].ts },
      });
    }
  }
  return insights;
};

const findPeakDemand = (samples, windowMin = 15) => {
  if (!samples.length) return [];
  let best = { avg: 0, at: samples[0].ts };
  const windowMs = windowMin * MINUTE;

  for (let i = 0; i < samples.length; i += 1) {
    const endTs = Date.parse(samples[i].ts);
    const startTs = endTs - windowMs;
    const window = [];
    for (let j = i; j >= 0; j -= 1) {
      if (Date.parse(samples[j].ts) >= startTs) {
        window.push(samples[j].kw || 0);
      } else break;
    }
    const rollingAvg = avg(window);
    if (rollingAvg > best.avg) best = { avg: rollingAvg, at: samples[i].ts };
  }

  return [
    {
      id: `peak-${best.at}`,
      type: 'peak',
      title: 'Peak 15-min Demand',
      description: `Highest 15-min average kW: ${best.avg.toFixed(2)}`,
      evidence: { at: best.at, avgKw: best.avg },
    },
  ];
};

const findLowPf = (samples, threshold = 0.8, minMinutes = 5) => {
  const insights = [];
  let startIdx = null;

  for (let i = 0; i < samples.length; i += 1) {
    const pf = Number(samples[i].pf);
    if (!Number.isNaN(pf) && pf < threshold && samples[i].state !== 'OFF') {
      if (startIdx === null) startIdx = i;
    } else if (startIdx !== null) {
      const duration = Date.parse(samples[i - 1].ts) - Date.parse(samples[startIdx].ts);
      if (duration >= minMinutes * MINUTE) {
        insights.push({
          id: `lowpf-${samples[startIdx].ts}`,
          type: 'low_pf',
          title: 'Low Power Factor',
          description: `PF below ${threshold} for ${Math.round(duration / MINUTE)} minutes.`,
          evidence: { start: samples[startIdx].ts, end: samples[i - 1].ts },
        });
      }
      startIdx = null;
    }
  }

  if (startIdx !== null) {
    const duration = Date.parse(samples[samples.length - 1].ts) - Date.parse(samples[startIdx].ts);
    if (duration >= minMinutes * MINUTE) {
      insights.push({
        id: `lowpf-${samples[startIdx].ts}`,
        type: 'low_pf',
        title: 'Low Power Factor',
        description: `PF below ${threshold} for ${Math.round(duration / MINUTE)} minutes.`,
        evidence: { start: samples[startIdx].ts, end: samples[samples.length - 1].ts },
      });
    }
  }

  return insights;
};

const computeImbalance = (s) => {
  const currents = [s.ir, s.iy, s.ib].map((v) => Number(v) || 0);
  const maxI = Math.max(...currents);
  const minI = Math.min(...currents);
  const avgCurrent = avg(currents) || 1;
  return ((maxI - minI) / avgCurrent) * 100;
};

const findPhaseImbalance = (samples, thresholdPct = 15, minMinutes = 2) => {
  const spans = [];
  let startIdx = null;

  for (let i = 0; i < samples.length; i += 1) {
    const imbalance = computeImbalance(samples[i]);
    if (imbalance > thresholdPct) {
      if (startIdx === null) startIdx = i;
    } else if (startIdx !== null) {
      const duration = Date.parse(samples[i - 1].ts) - Date.parse(samples[startIdx].ts);
      if (duration >= minMinutes * MINUTE) {
        spans.push({
          id: `imb-${samples[startIdx].ts}`,
          type: 'phase_imbalance',
          title: 'Phase Imbalance',
          description: `Imbalance over ${thresholdPct}% for ${Math.round(duration / MINUTE)} minutes.`,
          evidence: { start: samples[startIdx].ts, end: samples[i - 1].ts },
        });
      }
      startIdx = null;
    }
  }

  if (startIdx !== null) {
    const duration = Date.parse(samples[samples.length - 1].ts) - Date.parse(samples[startIdx].ts);
    if (duration >= minMinutes * MINUTE) {
      spans.push({
        id: `imb-${samples[startIdx].ts}`,
        type: 'phase_imbalance',
        title: 'Phase Imbalance',
        description: `Imbalance over ${thresholdPct}% for ${Math.round(duration / MINUTE)} minutes.`,
        evidence: { start: samples[startIdx].ts, end: samples[samples.length - 1].ts },
      });
    }
  }
  return spans;
};

export const computeInsights = (samples, config = {}) => {
  const idleInsights = findIdleStretches(samples, config.idleMinutes || 30);
  const peakInsight = findPeakDemand(samples, 15);
  const lowPf = findLowPf(samples, config.pfThreshold || 0.8, config.lowPfMinutes || 5);
  const imbalance = findPhaseImbalance(
    samples,
    config.imbalancePct || 15,
    config.imbalanceMinutes || 2
  );
  return [...peakInsight, ...idleInsights, ...lowPf, ...imbalance];
};
