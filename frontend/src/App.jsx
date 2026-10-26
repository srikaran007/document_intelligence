import React, { useState, useEffect, useCallback } from 'react';
import { uploadDocument, checkHealth } from './api';
import UploadSection from './components/UploadSection';
import SummaryPanel from './components/SummaryPanel';
import ExtractedInfoPanel from './components/ExtractedInfoPanel';
import SkillsChart from './components/SkillsChart';
import CompletenessIndicator from './components/CompletenessIndicator';
import LoadingSpinner from './components/LoadingSpinner';

const SUMMARY_STYLES  = ['brief', 'detailed', 'bullet'];
const ANALYSIS_LEVELS = ['basic', 'standard', 'detailed'];
const FIELD_OPTIONS   = ['Skills', 'Education', 'Experience', 'Certifications', 'Summary'];

const SAMPLE_RESUME_TEXT = `Alex Johnson
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

function App() {
  // State
  const [file, setFile]                   = useState(null);
  const [summaryStyle, setSummaryStyle]   = useState('brief');
  const [analysisLevel, setAnalysisLevel] = useState('standard');
  const [selectedFields, setSelectedFields] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [results, setResults]             = useState(null);
  const [error, setError]                 = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

  // Health check on mount
  useEffect(() => {
    checkHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const handleFileChange = useCallback((f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['pdf', 'txt'].includes(ext)) {
      setError('Unsupported file type. Please upload a PDF or TXT file.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 10 MB.');
      return;
    }
    setFile(f);
    setError(null);
    setResults(null);
  }, []);

  const handleSampleLoad = useCallback(() => {
    const blob = new Blob([SAMPLE_RESUME_TEXT], { type: 'text/plain' });
    const sampleFile = new File([blob], 'sample_resume.txt', { type: 'text/plain' });
    setFile(sampleFile);
    setError(null);
    setResults(null);
  }, []);

  const toggleField = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a document or load the sample resume first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await uploadDocument(file, {
        summaryStyle,
        analysisLevel,
        fields: selectedFields,
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please check that the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="app-wrapper">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">🧠</div>
            <span className="logo-text">Doc<span>Intel</span></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="status-bar">
              <span
                className={`status-dot ${backendStatus === 'online' ? 'online' : ''}`}
                title={`Backend: ${backendStatus}`}
              />
              <span>
                {backendStatus === 'checking' ? 'Connecting…'
                  : backendStatus === 'online' ? 'Backend online'
                  : 'Backend offline'}
              </span>
            </div>
            <span className="header-badge">AI Powered</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* ── Hero ── */}
        <section className="hero" aria-labelledby="hero-heading">
          <h1 id="hero-heading">
            <span className="hero-gradient-text">AI-Powered</span> Document Intelligence
          </h1>
          <p>
            Upload a resume or document, configure your analysis, and let Gemini AI extract
            structured insights — all visualised in a live dashboard.
          </p>
        </section>

        {/* ── Upload Card ── */}
        <section className="card" aria-label="Document upload">
          <div className="card-title">
            <span className="card-title-icon">📤</span>
            Upload Document
          </div>
          <UploadSection
            file={file}
            onFileChange={handleFileChange}
            onSampleLoad={handleSampleLoad}
            onClearFile={() => { setFile(null); setResults(null); setError(null); }}
          />
        </section>

        {/* ── Controls ── */}
        <div className="controls-grid">
          {/* Summary Style */}
          <section className="card" aria-label="Summary style selector">
            <div className="card-title">
              <span className="card-title-icon">📝</span>
              Summary Style
            </div>
            <div className="segment" role="group" aria-label="Summary style options">
              {SUMMARY_STYLES.map((s) => (
                <button
                  key={s}
                  id={`summary-style-${s}`}
                  className={`segment-btn ${summaryStyle === s ? 'active' : ''}`}
                  onClick={() => setSummaryStyle(s)}
                  aria-pressed={summaryStyle === s}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* Analysis Level */}
          <section className="card" aria-label="Analysis level selector">
            <div className="card-title">
              <span className="card-title-icon">🔍</span>
              Analysis Level
            </div>
            <div className="segment" role="group" aria-label="Analysis level options">
              {ANALYSIS_LEVELS.map((l) => (
                <button
                  key={l}
                  id={`analysis-level-${l}`}
                  className={`segment-btn ${analysisLevel === l ? 'active' : ''}`}
                  onClick={() => setAnalysisLevel(l)}
                  aria-pressed={analysisLevel === l}
                >
                  {l.charAt(0).toUpperCase() + l.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* Field Selection */}
          <section className="card" style={{ gridColumn: '1 / -1' }} aria-label="Field selection">
            <div className="card-title">
              <span className="card-title-icon">🎯</span>
              Focus Fields <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)' }}>(leave empty to analyse all)</span>
            </div>
            <div className="pill-group" role="group" aria-label="Field options">
              {FIELD_OPTIONS.map((f) => (
                <button
                  key={f}
                  id={`field-${f.toLowerCase()}`}
                  className={`pill ${selectedFields.includes(f) ? 'selected' : ''}`}
                  onClick={() => toggleField(f)}
                  aria-pressed={selectedFields.includes(f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ── Action bar ── */}
        <div className="actions-bar">
          <div>
            {file && (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Ready to analyse: <strong style={{ color: 'var(--text-secondary)' }}>{file.name}</strong>
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {results && (
              <button id="reset-btn" className="btn btn-secondary" onClick={handleReset}>
                ↺ Reset
              </button>
            )}
            <button
              id="analyze-btn"
              className="btn btn-primary"
              onClick={handleAnalyze}
              disabled={!file || loading}
            >
              {loading ? '⏳ Analysing…' : '🚀 Analyse Document'}
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="error-banner" role="alert">
            <span className="error-icon">⛔</span>
            <div>
              <h4>Error</h4>
              <p>{error}</p>
              {backendStatus === 'offline' && (
                <p style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Make sure the Flask backend is running: <code>cd backend &amp;&amp; python app.py</code>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <section className="card" aria-label="Loading">
            <LoadingSpinner />
          </section>
        )}

        {/* ── Results Dashboard ── */}
        {results && !loading && (
          <div id="results-dashboard">
            {/* Demo banner */}
            {results.demo_mode && (
              <div className="demo-notice" role="alert" style={{ marginTop: '1.5rem' }}>
                <span>⚠️</span>
                <strong>Demo Mode:</strong>&nbsp;{results.demo_notice}
              </div>
            )}

            <div className="results-grid">
              {/* Summary */}
              <section className="card full-width" aria-label="AI Summary">
                <div className="card-title">
                  <span className="card-title-icon">✨</span>
                  AI Summary — {summaryStyle.charAt(0).toUpperCase() + summaryStyle.slice(1)}
                </div>
                <SummaryPanel
                  summary={results.summary}
                  demoMode={results.demo_mode}
                  demoNotice={results.demo_notice}
                />
              </section>

              {/* Extracted Info */}
              <section className="card" aria-label="Extracted Information">
                <div className="card-title">
                  <span className="card-title-icon">🗂️</span>
                  Extracted Information
                </div>
                <ExtractedInfoPanel extracted={results.extracted} />
              </section>

              {/* Completeness */}
              <section className="card" aria-label="Document Completeness">
                <div className="card-title">
                  <span className="card-title-icon">📊</span>
                  Completeness Score
                </div>
                <CompletenessIndicator completeness={results.completeness} />
              </section>

              {/* Skills Chart */}
              <section className="card full-width" aria-label="Skills Visualization">
                <div className="card-title">
                  <span className="card-title-icon">🛠️</span>
                  Skills Breakdown
                </div>
                <SkillsChart skills={results.extracted?.skills} />
              </section>

              {/* Adaptive Analysis */}
              {results.analysis && (
                <section className="card full-width" aria-label="Adaptive Analysis">
                  <div className="card-title">
                    <span className="card-title-icon">🔎</span>
                    Adaptive Analysis — {analysisLevel.charAt(0).toUpperCase() + analysisLevel.slice(1)}
                    {selectedFields.length > 0 && (
                      <span style={{ color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0, marginLeft: '0.5rem', fontWeight: 400 }}>
                        · Focused on: {selectedFields.join(', ')}
                      </span>
                    )}
                  </div>
                  <p className="analysis-text">{results.analysis}</p>
                </section>
              )}

              {/* Metadata */}
              {results.filename && (
                <section className="card full-width" aria-label="Document Metadata">
                  <div className="card-title">
                    <span className="card-title-icon">ℹ️</span>
                    Document Metadata
                  </div>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filename</span>
                      <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{results.filename}</p>
                    </div>
                    {results.char_count !== undefined && (
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Characters Extracted</span>
                        <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{results.char_count.toLocaleString()}</p>
                      </div>
                    )}
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Analysis Mode</span>
                      <p style={{ fontSize: '0.9rem', marginTop: '0.2rem' }}>{results.demo_mode ? '⚠️ Demo (no API key)' : '✅ Gemini AI'}</p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
      }}>
        DocIntel — AI-Powered Document Intelligence Platform &nbsp;·&nbsp; IBEE Analytics Assessment &nbsp;·&nbsp; Built with React + Flask + Gemini
      </footer>
    </div>
  );
}

export default App;
