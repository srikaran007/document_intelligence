import React from 'react';

function ExtractedInfoPanel({ extracted }) {
  if (!extracted) return null;

  const nullDisplay = (val) => val
    ? <span className="info-value">{val}</span>
    : <span className="info-value null-val">Not found</span>;

  return (
    <div className="info-grid" id="extracted-info">
      {/* Scalar fields */}
      <div className="info-row">
        <span className="info-label">Name</span>
        {nullDisplay(extracted.name)}
      </div>
      <div className="info-row">
        <span className="info-label">Email</span>
        {extracted.email
          ? <span className="info-value"><a href={`mailto:${extracted.email}`} style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>{extracted.email}</a></span>
          : <span className="info-value null-val">Not found</span>}
      </div>
      <div className="info-row">
        <span className="info-label">Phone</span>
        {nullDisplay(extracted.phone)}
      </div>

      {/* Skills */}
      <div className="info-row">
        <span className="info-label">Skills</span>
        {extracted.skills?.length > 0
          ? <div className="info-value">
              <div className="tag-list">
                {extracted.skills.map((s, i) => <span className="tag" key={i}>{s}</span>)}
              </div>
            </div>
          : <span className="info-value null-val">None listed</span>}
      </div>

      {/* Education */}
      <div className="info-row" style={{ flexDirection: 'column' }}>
        <span className="info-label" style={{ marginBottom: '0.5rem' }}>Education</span>
        {extracted.education?.length > 0
          ? extracted.education.map((edu, i) => (
              <div className="edu-entry" key={i}>
                <h4>{edu.degree || 'Degree not specified'}</h4>
                <div className="institution">{edu.institution || '—'}</div>
                <div className="year">{edu.year || ''}</div>
              </div>
            ))
          : <span className="info-value null-val">No education details found</span>}
      </div>

      {/* Experience */}
      <div className="info-row" style={{ flexDirection: 'column' }}>
        <span className="info-label" style={{ marginBottom: '0.5rem' }}>Experience</span>
        {extracted.experience?.length > 0
          ? extracted.experience.map((exp, i) => (
              <div className="exp-entry" key={i}>
                <h4>{exp.title || 'Role not specified'}</h4>
                <div className="company">{exp.company || '—'}</div>
                <div className="duration">{exp.duration || ''}</div>
                {exp.description && <div className="desc">{exp.description}</div>}
              </div>
            ))
          : <span className="info-value null-val">No experience details found</span>}
      </div>

      {/* Certifications */}
      {extracted.certifications?.length > 0 && (
        <div className="info-row">
          <span className="info-label">Certs</span>
          <div className="info-value">
            <div className="tag-list">
              {extracted.certifications.map((c, i) => <span className="tag" key={i}>{c}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Professional Summary */}
      {extracted.summary_profile && (
        <div className="info-row">
          <span className="info-label">Profile</span>
          <span className="info-value">{extracted.summary_profile}</span>
        </div>
      )}

      {extracted._parse_warning && (
        <div className="demo-notice" role="alert" style={{ marginTop: '0.5rem' }}>
          <span>⚠️</span>
          <span>{extracted._parse_warning}</span>
        </div>
      )}
    </div>
  );
}

export default ExtractedInfoPanel;
