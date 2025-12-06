import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';

const number = (v, digits = 1) => (Number.isFinite(v) ? v.toFixed(digits) : '0');

const Spark = ({ data, dataKey }) => (
  <ResponsiveContainer width="100%" height={40}>
    <LineChart data={data}>
      <Line type="monotone" dataKey={dataKey} stroke="#2f7bed" dot={false} strokeWidth={2} />
      <Tooltip
        formatter={(value) => number(value, 2)}
        labelFormatter={(label) => label}
        contentStyle={{ fontSize: 12 }}
      />
    </LineChart>
  </ResponsiveContainer>
);

const AreaSpark = ({ data, dataKey }) => (
  <ResponsiveContainer width="100%" height={40}>
    <AreaChart data={data}>
      <Area
        type="monotone"
        dataKey={dataKey}
        stroke="#22a06b"
        fill="#e8f6ee"
        strokeWidth={2}
        isAnimationActive={false}
      />
    </AreaChart>
  </ResponsiveContainer>
);

const KPIs = ({ kpis, samples = [], onExportCSV = () => {}, onCopyLink = () => {} }) => {
  const sparkData = samples.slice(-80).map((s) => ({
    ts: s.ts,
    kw: Number(s.kw) || 0,
    throughput: Number(s.count_total) || 0,
    pf: Number(s.pf) || 0,
  }));

  return (
    <div className="card">
      <div className="export-row">
        <button type="button" className="btn primary" onClick={onExportCSV} aria-label="Export visible window to CSV">
          Export CSV
        </button>
        <button type="button" className="btn" onClick={onCopyLink} aria-label="Copy permalink to current window">
          Copy Permalink
        </button>
      </div>
      <div className="kpi-grid" style={{ marginTop: 12 }}>
        <div className="kpi">
          <h3>Uptime</h3>
          <p className="value">{number(kpis.uptimePct)}%</p>
          <p className="muted">Run state share</p>
        </div>
        <div className="kpi">
          <h3>Idle</h3>
          <p className="value">{number(kpis.idlePct)}%</p>
          <p className="muted">Idle share</p>
        </div>
        <div className="kpi">
          <h3>Off</h3>
          <p className="value">{number(kpis.offPct)}%</p>
          <p className="muted">Offline share</p>
        </div>
        <div className="kpi">
          <h3>Avg kW</h3>
          <p className="value">{number(kpis.avgKw, 2)} kW</p>
          <Spark data={sparkData} dataKey="kw" />
        </div>
        <div className="kpi">
          <h3>Energy</h3>
          <p className="value">{number(kpis.energyKwh, 2)} kWh</p>
          <p className="muted">ΔkWh in window</p>
        </div>
        <div className="kpi">
          <h3>PF Avg</h3>
          <p className="value">{number(kpis.pfAvg, 2)}</p>
          <Spark data={sparkData} dataKey="pf" />
        </div>
        <div className="kpi">
          <h3>Units / min</h3>
          <p className="value">{number(kpis.throughputPerMin, 2)}</p>
          <p className="muted">Window rate</p>
        </div>
        <div className="kpi">
          <h3>Rolling 60s</h3>
          <p className="value">{number(kpis.rolling60Rate, 2)}</p>
          <AreaSpark data={sparkData} dataKey="throughput" />
        </div>
        <div className="kpi">
          <h3>Phase Imbalance</h3>
          <p className="value">{number(kpis.phaseImbalance, 2)}%</p>
          <p className="muted">Avg imbalance</p>
        </div>
      </div>
    </div>
  );
};

export default KPIs;
