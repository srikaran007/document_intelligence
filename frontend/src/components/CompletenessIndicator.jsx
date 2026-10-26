import React, { useEffect, useState } from 'react';

function CompletenessIndicator({ completeness }) {
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    if (!completeness) return;
    const target = completeness.percentage;
    let current = 0;
    const step = target / 40;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setAnimPct(Math.round(current));
    }, 25);
    return () => clearInterval(timer);
  }, [completeness]);

  if (!completeness) return null;

  const pct = completeness.percentage;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animPct / 100) * circumference;

  // Color based on percentage
  const color = pct >= 75 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171';

  return (
    <div className="completeness-meter" id="completeness-indicator">
      {/* Donut chart */}
      <div className="donut-wrapper">
        <svg className="donut-svg" width="140" height="140" viewBox="0 0 140 140">
          <circle className="donut-bg" cx="70" cy="70" r={radius} />
          <circle
            className="donut-fill"
            cx="70"
            cy="70"
            r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="donut-label">
          <span className="donut-pct" style={{ color }}>{animPct}%</span>
          <span className="donut-sub">Complete</span>
        </div>
      </div>

      {/* Field lists */}
      <div className="completeness-lists">
        <div className="completeness-section present">
          <h4>✓ Present</h4>
          {completeness.present_fields.map((f, i) => (
            <div className="comp-item" key={i}>
              <span className="comp-dot present" />
              {f}
            </div>
          ))}
          {completeness.present_fields.length === 0 && (
            <div className="comp-item" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</div>
          )}
        </div>

        <div className="completeness-section missing">
          <h4>✗ Missing</h4>
          {completeness.missing_fields.map((f, i) => (
            <div className="comp-item" key={i}>
              <span className="comp-dot missing" />
              {f}
            </div>
          ))}
          {completeness.missing_fields.length === 0 && (
            <div className="comp-item" style={{ color: 'var(--success)' }}>All fields present 🎉</div>
          )}
        </div>
      </div>

      {/* Note */}
      {completeness.note && (
        <p className="completeness-note">{completeness.note}</p>
      )}
    </div>
  );
}

export default CompletenessIndicator;
