import React, { useRef, useState } from 'react';

const SAMPLE_RESUME = `Alex Johnson
alex.johnson@email.com | +1 (555) 123-4567 | linkedin.com/in/alexjohnson

PROFESSIONAL SUMMARY
Results-driven software engineer with 5+ years of experience building scalable web applications and data pipelines. Passionate about AI/ML and cloud-native architectures.

SKILLS
Python, JavaScript, React, Flask, Django, SQL, PostgreSQL, MongoDB, Machine Learning, Docker, AWS, GCP, Git, REST APIs, GraphQL, Redis, Kubernetes

WORK EXPERIENCE

Senior Software Engineer | Tech Corp | Jan 2022 – Present
- Led development of a microservices architecture serving 1M+ daily active users
- Reduced API latency by 40% through caching strategies and query optimisation
- Mentored a team of 4 junior engineers and conducted code reviews

Software Engineer | StartupXYZ | Jun 2019 – Dec 2021
- Built full-stack web applications using React and Django for an EdTech platform
- Implemented CI/CD pipelines using GitHub Actions, reducing deployment time by 60%
- Developed RESTful APIs consumed by iOS and Android mobile clients

Junior Developer | WebAgency | Aug 2018 – May 2019
- Developed responsive landing pages and e-commerce features for 15+ clients
- Maintained WordPress sites and integrated third-party payment gateways

EDUCATION

M.Sc. Data Science | Tech Institute | 2021
B.Sc. Computer Science | State University | 2019

CERTIFICATIONS
- AWS Certified Developer – Associate
- Google Professional Data Engineer
- MongoDB Certified Developer`;

function UploadSection({ onFileChange, onSampleLoad, file, onClearFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onFileChange(dropped);
  };

  const handleInputChange = (e) => {
    const f = e.target.files[0];
    if (f) onFileChange(f);
    e.target.value = '';
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      <div
        id="upload-dropzone"
        className={`upload-zone ${dragging ? 'dragging' : ''}`}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload document area"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          id="file-input"
          accept=".pdf,.txt"
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
        <span className="upload-icon">📄</span>
        <h3>Drop your document here</h3>
        <p>or click to browse &nbsp;·&nbsp; PDF and TXT accepted &nbsp;·&nbsp; Max 10 MB</p>
      </div>

      {file && (
        <div className="file-selected">
          <span className="file-icon">{file.name.endsWith('.pdf') ? '📕' : '📝'}</span>
          <div style={{ flex: 1 }}>
            <div className="file-name">{file.name}</div>
            <div className="file-size">{formatSize(file.size)}</div>
          </div>
          <button
            id="clear-file-btn"
            className="btn btn-ghost"
            onClick={(e) => { e.stopPropagation(); onClearFile(); }}
            aria-label="Remove file"
          >
            ✕ Remove
          </button>
        </div>
      )}

      <div className="sample-strip">
        <span style={{ fontSize: '1.1rem' }}>🧪</span>
        <p>No document? Load the built-in sample resume to try the platform.</p>
        <button
          id="sample-resume-btn"
          className="btn btn-secondary"
          onClick={onSampleLoad}
        >
          Load Sample
        </button>
      </div>
    </div>
  );
}

export default UploadSection;
