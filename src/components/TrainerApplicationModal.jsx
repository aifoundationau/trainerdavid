import React, { useState, useRef } from 'react';
import { X, CheckCircle2, ExternalLink, Trash2, ShieldCheck, Dumbbell, Sparkles } from './Icons';
import { ACCEPT_ATTR, formatSize } from '../services/driveUploadApi';
import { uploadCredentialsToDrive, submitTrainerApplication } from '../services/trainerApi';

export const HEALTH_FITNESS_ROLES = [
  { id: 'trainer', label: '🏋️ Personal Trainer / Fitness Coach', description: 'Conduct 1-on-1 coaching, periodized programming & technique reviews.' },
  { id: 'strength_coach', label: '⚡ Strength & Conditioning Specialist', description: 'Prescribe barbell power training, athletic RFD & sport conditioning.' },
  { id: 'physiotherapist', label: '🩺 Licensed Physiotherapist', description: 'Diagnose kinetic imbalances, joint mobilizations & clinical rehabilitation.' },
  { id: 'nutritionist', label: '🥗 Accredited Nutritionist / Dietitian', description: 'Formulate bespoke caloric targets, macro splits & metabolic plans.' },
  { id: 'doctor', label: '🏥 Sports Medicine Physician', description: 'Assess musculoskeletal pathologies & issue return-to-play clearances.' },
  { id: 'exercise_physiologist', label: '🧬 Accredited Exercise Physiologist (AEP)', description: 'Deliver clinical exercise physiology for chronic health conditions.' },
  { id: 'rehab_specialist', label: '🩹 Injury Rehabilitation Specialist', description: 'Guide return-to-sport mobility progressions & neuromuscular rebuilds.' },
  { id: 'yoga_pilates', label: '🧘 Yoga & Pilates Instructor', description: 'Instruct core stabilization, postural alignment & mobility flows.' }
];

export default function TrainerApplicationModal({ user, onClose, onSuccess, showToast }) {
  const [requestedRole, setRequestedRole] = useState('trainer');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState(''); // 'uploading' | 'submitting' | 'done'
  const [submittedResult, setSubmittedResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFilePicked = (picked) => {
    if (!picked) return;
    setError('');
    setFile(picked);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handleFilePicked(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose or drop your professional credential file (PDF, JPG, PNG, or DOCX).');
      return;
    }

    setError('');
    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadStage('uploading');

    try {
      // 1. Upload credential document to Google Drive under "Trainer Applications/<email>/"
      const driveRes = await uploadCredentialsToDrive(file, (p) => setUploadProgress(p));

      // 2. Submit application record to Firestore and notify SuperAdmin/MainAdmin
      setUploadStage('submitting');
      const submitRes = await submitTrainerApplication({
        requestedRole,
        phone,
        experience,
        bio,
        fileId: driveRes.fileId,
        fileName: driveRes.fileName,
        fileSize: driveRes.fileSize,
        webViewLink: driveRes.webViewLink,
        folderId: driveRes.folderId,
        folderPath: driveRes.folderPath
      });

      setSubmittedResult(submitRes.application);
      setUploadStage('done');
      if (showToast) {
        showToast('✅ Application submitted! SuperAdmin has been notified with your Google Drive credentials.');
      }
      if (onSuccess) onSuccess(submitRes.application);
    } catch (err) {
      console.error('Application submission error:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
      setUploadStage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 7, 12, 0.85)',
        backdropFilter: 'blur(10px)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto'
      }}
    >
      <div 
        className="glass-panel" 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          overflowY: 'auto',
          borderRadius: '20px',
          padding: '2rem',
          position: 'relative',
          border: '1px solid rgba(255, 107, 0, 0.3)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            borderRadius: '50%',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title="Close"
        >
          <X size={18} />
        </button>

        {uploadStage === 'done' && submittedResult ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '2px solid #22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#22c55e'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '0.5rem' }}>
              Application Successfully Submitted!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Your credentials have been securely uploaded to our Google Drive repository. The <strong>SuperAdmin</strong> and <strong>MainAdmin</strong> have received notification of your application and Google Drive folder.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.1rem',
              textAlign: 'left',
              marginBottom: '1.75rem'
            }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Applied Role</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.8rem' }}>
                {submittedResult.requestedRoleLabel || submittedResult.requestedRole}
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Google Drive Destination</div>
              <div style={{ fontSize: '0.84rem', color: 'var(--accent-orange)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{submittedResult.folderPath}</span>
                {submittedResult.folderUrl && (
                  <a href={submittedResult.folderUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-orange)', display: 'inline-flex' }}>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-primary"
              style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
            >
              Done & Return to Site
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff6b00 0%, #ff8a00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Dumbbell size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Apply as Coach or Health Specialist
                </h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--accent-lime)', fontWeight: 600 }}>
                  ⭐ Registered Supporter Opt-In
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem', lineHeight: 1.5 }}>
              Elevate your supporter account to publish workout videos, charge custom token rates (1 token, 5 tokens, etc.), and earn <strong>50% revenue share</strong> on all video views.
            </p>

            {/* Role Dropdown */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="trainer-role-select" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.45rem' }}>
                Select Your Health & Fitness Discipline
              </label>
              <select
                id="trainer-role-select"
                value={requestedRole}
                onChange={e => setRequestedRole(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  background: '#0d111c',
                  border: '1px solid var(--accent-orange)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {HEALTH_FITNESS_ROLES.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                {HEALTH_FITNESS_ROLES.find(r => r.id === requestedRole)?.description}
              </div>
            </div>

            {/* Applicant Name & Email (Pre-filled from Google) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Google Full Name
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ''}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  Google Account Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>
            </div>

            {/* Phone Number */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label htmlFor="applicant-phone" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Phone Number / WhatsApp
              </label>
              <input
                id="applicant-phone"
                type="tel"
                placeholder="+61 400 000 000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#0d111c',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Experience & Certifications */}
            <div style={{ marginBottom: '1.1rem' }}>
              <label htmlFor="applicant-experience" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Certifications, Diplomas & Years of Experience
              </label>
              <input
                id="applicant-experience"
                type="text"
                placeholder="e.g. Cert IV in Fitness, NASM-CPT, 5 years coaching experience"
                value={experience}
                onChange={e => setExperience(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#0d111c',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            {/* Short Bio */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="applicant-bio" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                Coaching Philosophy & Specialty
              </label>
              <textarea
                id="applicant-bio"
                rows={2}
                placeholder="Briefly outline your training philosophy, target clientele, and specialties..."
                value={bio}
                onChange={e => setBio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: '#0d111c',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* File Upload Zone */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
                Upload Professional Credentials (Google Drive)
              </label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                  border: `2px dashed ${isDragging ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.2)'}`,
                  background: isDragging ? 'rgba(255, 107, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  padding: '1.5rem 1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_ATTR}
                  onChange={e => handleFilePicked(e.target.files?.[0])}
                  style={{ display: 'none' }}
                />

                {file ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#fff', fontWeight: 700, wordBreak: 'break-all' }}>{file.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{formatSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setFile(null); }}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex' }}
                      title="Remove file"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ color: '#fff', fontWeight: 700, marginBottom: '0.3rem', fontSize: '0.92rem' }}>
                      Drag credential file here or click to browse
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      PDF, JPG, PNG, WEBP, or DOCX (Certificates, Insurance, Degrees) · up to 100 MB
                    </div>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div style={{
                color: '#f87171',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                {error}
              </div>
            )}

            {isSubmitting && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  <span>
                    {uploadStage === 'uploading' 
                      ? `Uploading credentials to Google Drive... (${Math.round(uploadProgress * 100)}%)` 
                      : 'Saving application and alerting SuperAdmin...'}
                  </span>
                  <span>{Math.round(uploadProgress * 100)}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.round(uploadProgress * 100)}%`,
                    height: '100%',
                    background: 'var(--accent-orange)',
                    transition: 'width 0.2s'
                  }} />
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="btn-secondary"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem' }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{
                  padding: '0.65rem 1.6rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                {isSubmitting ? (
                  <span>Submitting to Google Drive...</span>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Submit Application & Credentials</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
