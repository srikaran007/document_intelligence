import React, { useState, useEffect } from 'react';

const STEPS = [
  'Extracting document text…',
  'Analyzing content with Gemini AI…',
  'Parsing structured fields…',
  'Computing completeness…',
  'Building your dashboard…',
];

function LoadingSpinner() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-overlay" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem' }}>
        Processing your document
      </p>
      <div className="loading-steps">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={`loading-step ${i <= stepIdx ? 'active' : ''}`}
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <span className="step-dot" />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

export default LoadingSpinner;
