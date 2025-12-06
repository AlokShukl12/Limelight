import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Tooltip,
  Legend,
  ReferenceArea,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

const stateToBand = (state) => {
  if (state === 'RUN') return 2;
  if (state === 'IDLE') return 1;
  return 0;
};

const formatTs = (ts) => new Date(ts).toLocaleTimeString();

const Charts = ({ samples = [], highlightWindow }) => {
  const data = samples.map((s) => ({
    ...s,
    stateBand: stateToBand(s.state),
  }));

  const reference =
    highlightWindow && highlightWindow.start && highlightWindow.end ? (
      <ReferenceArea
        x1={highlightWindow.start}
        x2={highlightWindow.end}
        strokeOpacity={0.3}
        fill="#fde2e4"
      />
    ) : null;

  const tooltipContent = ({ label, payload }) => {
    if (!payload || !payload.length) return null;
    return (
      <div className="card" style={{ padding: 8 }}>
        <div style={{ fontWeight: 700 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="card charts">
      <div className="chart-block" aria-label="kW and state chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ts" tickFormatter={formatTs} minTickGap={20} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" hide />
            <Tooltip content={tooltipContent} />
            <Legend />
            {reference}
            <Area
              yAxisId="right"
              type="stepAfter"
              dataKey="stateBand"
              name="State"
              fill="#e8f6ee"
              stroke="#b2dfc2"
              strokeWidth={1}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="kw"
              name="kW"
              stroke="#2f7bed"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mini-chart" aria-label="Voltage mini chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="vr" stroke="#2f7bed" dot={false} name="VR" />
            <Line type="monotone" dataKey="vy" stroke="#e09f3e" dot={false} name="VY" />
            <Line type="monotone" dataKey="vb" stroke="#22a06b" dot={false} name="VB" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mini-chart" aria-label="Current mini chart">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ir" stroke="#2f7bed" dot={false} name="IR" />
            <Line type="monotone" dataKey="iy" stroke="#e09f3e" dot={false} name="IY" />
            <Line type="monotone" dataKey="ib" stroke="#22a06b" dot={false} name="IB" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mini-chart" aria-label="Throughput sparkline">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <Tooltip />
            <Line type="monotone" dataKey="count_total" stroke="#6b21a8" dot={false} name="Units" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;
