import React from 'react';

const severityByType = {
  peak: 'info',
  idle: 'info',
  low_pf: 'warn',
  phase_imbalance: 'danger',
};

const Insights = ({ insights = [], onHighlight }) => (
  <div className="card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0, fontSize: 18 }}>Insights</h2>
      <span className="muted">{insights.length} findings</span>
    </div>
    <div className="insights-list" style={{ marginTop: 10 }}>
      {insights.map((ins) => (
        <div className="insight" key={ins.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{ins.title}</strong>
            <span className={`badge ${severityByType[ins.type] || 'info'}`}>{ins.type}</span>
          </div>
          <p className="muted">{ins.description}</p>
          {ins.evidence ? (
            <p className="muted">
              {ins.evidence.start ? `Start: ${ins.evidence.start}` : null}{' '}
              {ins.evidence.end ? `End: ${ins.evidence.end}` : null}
              {ins.evidence.at ? `At: ${ins.evidence.at}` : null}
            </p>
          ) : null}
          {ins.evidence?.start ? (
            <button
              className="btn"
              onClick={() => onHighlight?.(ins.evidence)}
              aria-label="Highlight insight window on chart"
            >
              Show evidence
            </button>
          ) : null}
        </div>
      ))}
      {!insights.length ? <p className="muted">No insights in this window.</p> : null}
    </div>
  </div>
);

export default Insights;
