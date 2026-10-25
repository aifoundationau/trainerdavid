import React, { useEffect } from 'react';
import { X, Play, CheckCircle2, ShieldCheck, Dumbbell, Sparkles, Check, Lock, Coins, Google, ExternalLink } from './Icons';

export default function VideoModal({ 
  video, 
  isUnlocked,
  isSubscriber = false,
  user,
  tokens,
  onClose, 
  onOpenConsultation,
  onOpenAuth,
  onGoToAdminTokens
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  const canPlay = isUnlocked || isSubscriber;

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      data-agent-id="video-modal-backdrop"
      data-testid="video-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(14px)',
        overflowY: 'auto'
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          // 142vh wide keeps the 16:9 player under 80vh tall, so it always fits inside the 90vh modal
          maxWidth: 'min(860px, 142vh)',
          width: '100%',
          margin: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 35px rgba(255, 107, 0, 0.12)'
        }}
      >
        {/* Close Button Header */}
        <div style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          zIndex: 30
        }}>
          <button 
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              cursor: 'pointer'
            }}
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Embedded YouTube Video Player OR Locked Overlay */}
        {canPlay ? (
          <div className="video-player-container">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={video.title}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block'
              }}
            />
          </div>
        ) : (
          <div style={{
            aspectRatio: '16/9',
            flexShrink: 0,
            background: 'radial-gradient(circle at center, #151928 0%, #080a11 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
            borderBottom: '1px solid var(--border-subtle)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'rgba(255, 107, 0, 0.14)',
              border: '1px solid rgba(255, 107, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-orange)',
              marginBottom: '1rem',
              boxShadow: '0 8px 24px rgba(255, 107, 0, 0.2)'
            }}>
              <Lock size={30} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '0.45rem' }}>
              Token Required to Stream Masterclass
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '460px', lineHeight: 1.55, marginBottom: '1.4rem' }}>
              {!user 
                ? "You are not signed in. You must sign in with your Google Email and have tokens in order to watch the workout videos (1 token per video)."
                : "You have 0 tokens. You must have tokens in order to watch videos. Please recharge tokens on the Tokens page (1 token per video)."}
            </p>

            {!user ? (
              <button 
                onClick={() => { onClose(); if (onOpenAuth) onOpenAuth(); }}
                className="btn-primary"
                style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem', gap: '0.5rem' }}
              >
                <Google size={16} />
                <span>Sign In with Google</span>
              </button>
            ) : (
              <button 
                onClick={() => { if (onGoToAdminTokens) onGoToAdminTokens(); }}
                className="btn-primary"
                style={{ padding: '0.75rem 1.4rem', fontSize: '0.9rem', gap: '0.5rem' }}
              >
                <Coins size={16} />
                <span>Recharge Tokens on Admin Page</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Video Information & Coaching Notes */}
        <div style={{ padding: '1.5rem 1.75rem' }}>
          {/* Tags Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.85rem'
          }}>
            <span className="badge badge-orange">{video.category}</span>
            <span className="badge badge-lime">🎯 {video.muscleGroup}</span>
            <span className="badge badge-cyan">⚙️ {video.equipment}</span>
            <span className="badge">{video.difficulty}</span>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            marginBottom: '0.65rem',
            color: '#fff'
          }}>
            {video.title}
          </h2>

          {/* Description */}
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '1.25rem'
          }}>
            {video.shortDescription}
          </p>

          {/* Key Coaching Cues Checklist */}
          {video.keyCues && video.keyCues.length > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '1.15rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldCheck size={17} color="var(--accent-orange)" />
                <span>Trainer David's Biomechanical Checklist</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                {video.keyCues.map((cue, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={15} color="var(--accent-lime)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{cue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="badge badge-lime">
                <Check size={13} />
                <span>Unlocked (1 Token)</span>
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Unlimited replays for this workout session
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              {video.youtubeId && (
                <a 
                  href={video.youtubeUrl || `https://www.youtube.com/watch?v=${video.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{
                    padding: '0.55rem 1rem',
                    fontSize: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    textDecoration: 'none'
                  }}
                  title="Open video directly on YouTube in new tab"
                >
                  <ExternalLink size={14} />
                  <span>YouTube ↗</span>
                </a>
              )}

              <button 
                onClick={() => {
                  onClose();
                  onOpenConsultation(video.title);
                }}
                className="btn-primary"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
              >
                <Sparkles size={15} />
                <span>Book Coaching</span>
              </button>

              <button 
                onClick={onClose}
                className="btn-secondary"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
