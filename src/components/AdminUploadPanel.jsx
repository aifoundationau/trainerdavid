import React, { useRef, useState } from 'react';
import { CheckCircle2, ExternalLink, Mail, Trash2, X } from './Icons';
import { ACCEPT_ATTR, checkFile, uploadToDrive } from '../services/driveUploadApi';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const labelStyle = { display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 };

export default function AdminUploadPanel({ showToast, defaultEmail = '' }) {
  // Starts as the signed-in user's email; admins can change it to upload for a member
  const [email, setEmail] = useState(defaultEmail);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  const pickFile = async (picked) => {
    if (!picked) return;
    const problem = await checkFile(picked);
    setError(problem);
    setFile(problem ? null : picked);
    if (problem && inputRef.current) inputRef.current.value = '';
  };

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 1) {
      setError('Drop one file at a time.');
      return;
    }
    pickFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Choose a file to upload.');
      return;
    }
    setError('');
    setProgress(0);
    setIsUploading(true);
    try {
      const result = await uploadToDrive(email, file, setProgress);
      setResults(prev => [result, ...prev]);
      clearFile();
      showToast(`✅ Uploaded ${result.name} to ${result.folderPath}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', maxWidth: '760px', margin: '0 auto' }}>
      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
        📤 Upload to Google Drive
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.35rem 0 1.5rem' }}>
        Files are saved in the member's folder, under today's date (e.g. <code>member@example.com/2026-10-23/</code>).
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.1rem' }}>
          <label htmlFor="upload-email" style={labelStyle}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              id="upload-email"
              type="email"
              required
              autoComplete="off"
              placeholder="member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem 0.65rem 2.2rem',
                background: '#0d111c',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.95rem'
              }}
            />
          </div>
        </div>

        <span style={labelStyle}>File</span>
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? 'var(--accent-orange)' : 'var(--border-subtle)'}`,
            background: isDragging ? 'rgba(255, 107, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            borderRadius: '12px',
            padding: '2rem 1rem',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            onChange={(e) => pickFile(e.target.files[0])}
            style={{ display: 'none' }}
          />
          {file ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#fff', fontWeight: 700, wordBreak: 'break-all' }}>{file.name}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearFile(); }}
                title="Remove file"
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <>
              <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.3rem' }}>
                Drag a file here, or click to choose
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                JPG, PNG, WEBP, PDF or DOCX · up to 100 MB
              </div>
            </>
          )}
        </div>

        {error && (
          <div style={{
            marginTop: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#f87171',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.6rem 0.85rem',
            fontSize: '0.85rem'
          }}>
            <X size={15} />
            <span>{error}</span>
          </div>
        )}

        {isUploading && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${Math.round(progress * 100)}%`,
                height: '100%',
                background: 'var(--accent-orange)',
                transition: 'width 0.2s'
              }} />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          style={{
            marginTop: '1.25rem',
            width: '100%',
            padding: '0.75rem',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--accent-orange)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.95rem',
            cursor: isUploading ? 'wait' : 'pointer',
            opacity: isUploading ? 0.7 : 1
          }}
        >
          {isUploading ? `Uploading… ${Math.round(progress * 100)}%` : 'Upload'}
        </button>
      </form>

      {results.length > 0 && (
        <div style={{ marginTop: '1.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: '0 0 0.75rem' }}>Uploaded this session</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {results.map(r => (
              <div key={r.fileId} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(34, 197, 94, 0.07)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                borderRadius: '10px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.85rem'
              }}>
                <CheckCircle2 size={17} color="#22c55e" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {r.folderPath} · {formatSize(r.size)} · {r.status}
                  </div>
                </div>
                {r.webViewLink && (
                  <a href={r.webViewLink} target="_blank" rel="noopener noreferrer" title="Open in Google Drive" style={{ color: 'var(--accent-orange)', display: 'flex' }}>
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
