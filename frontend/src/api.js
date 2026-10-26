/**
 * api.js — Centralised fetch wrapper for the Flask backend.
 * The API base URL is read from import.meta.env.VITE_API_BASE_URL
 * which defaults to '' (relative path, works with Vite proxy in dev).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Upload a document file and return the analysis result.
 * @param {File} file
 * @param {{ summaryStyle: string, analysisLevel: string, fields: string[] }} opts
 * @returns {Promise<object>}
 */
export async function uploadDocument(file, { summaryStyle, analysisLevel, fields }) {
  const form = new FormData();
  form.append('file', file);
  form.append('summary_style', summaryStyle);
  form.append('analysis_level', analysisLevel);
  form.append('fields', fields.join(','));

  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: form,
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned an invalid response (HTTP ${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(data?.error ?? `Server error (HTTP ${res.status}).`);
  }

  return data;
}

/**
 * Check the backend health endpoint.
 * @returns {Promise<object>}
 */
export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error(`Health check failed (HTTP ${res.status}).`);
  return res.json();
}
