import React from 'react';

function SummaryPanel({ summary, demoMode, demoNotice }) {
  return (
    <div>
      {demoMode && demoNotice && (
        <div className="demo-notice" role="alert">
          <span>⚠️</span>
          <span>{demoNotice}</span>
        </div>
      )}
      <p className="summary-text" id="summary-output">
        {summary || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No summary generated.</span>}
      </p>
    </div>
  );
}

export default SummaryPanel;
