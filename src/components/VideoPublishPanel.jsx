import React, { useState } from 'react';
import { Play, Coins, Plus, CheckCircle2, Film, Sparkles, Clock, Lock } from './Icons';
import { publishWorkoutVideo, extractVideoMetadata } from '../services/trainerApi';

export default function VideoPublishPanel({ user, showToast, onVideoPublished }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Chest & Shoulders');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('Dumbbells & Bench');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [duration, setDuration] = useState('10 mins');
  const [tokenCost, setTokenCost] = useState(5);
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [cues, setCues] = useState(['', '']);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleCueChange = (index, value) => {
    const next = [...cues];
    next[index] = value;
    setCues(next);
  };

  const handleAddCue = () => {
    if (cues.length < 4) setCues([...cues, '']);
  };

  // Extract metadata and thumbnail from YouTube
  const handleExtract = async (targetUrl) => {
    const url = (targetUrl !== undefined ? targetUrl : videoUrl).trim();
    if (!url) {
      setError('Please provide a YouTube URL to extract details.');
      return;
    }

    setIsExtracting(true);
    setError('');
    setExtractSuccess(false);

    try {
      const data = await extractVideoMetadata(url);
      if (data.title) {
        setTitle(data.title);
      }
      if (data.description) {
        setShortDescription(data.description);
      }
      if (data.thumbnailUrl) {
        setThumbnailUrl(data.thumbnailUrl);
      }
      setExtractSuccess(true);
      if (showToast) {
        showToast('✨ YouTube thumbnail, title, and description extracted!');
      }
    } catch (err) {
      console.warn('Extraction fallback notice:', err);
      // Graceful local regex fallback
      const match = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
      if (match) {
        const ytId = match[1];
        setThumbnailUrl(`https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`);
        setExtractSuccess(true);
        if (showToast) {
          showToast('🎬 YouTube thumbnail detected from video ID.');
        }
      } else {
        setError(err.message || 'Could not extract YouTube details. Please check the URL.');
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const handleUrlBlur = () => {
    if (videoUrl.trim() && !thumbnailUrl && !isExtracting) {
      handleExtract(videoUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a video title.');
      return;
    }
    if (!videoUrl.trim()) {
      setError('Please provide a YouTube URL or video embed link.');
      return;
    }

    const price = Math.max(1, Math.round(Number(tokenCost) || 1));
    setError('');
    setIsPublishing(true);

    try {
      const res = await publishWorkoutVideo({
        title: title.trim(),
        category,
        muscleGroup: muscleGroup.trim() || 'Target Muscles',
        equipment,
        difficulty,
        duration: duration.trim() || '10 mins',
        tokenCost: price,
        videoUrl: videoUrl.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        shortDescription: shortDescription.trim(),
        keyCues: cues.filter(c => c.trim().length > 0)
      });

      showToast(`🎬 Video "${title}" published live with a ${price} FitToken rate!`);
      setTitle('');
      setVideoUrl('');
      setThumbnailUrl('');
      setShortDescription('');
      setMuscleGroup('');
      setCues(['', '']);
      setExtractSuccess(false);
      if (onVideoPublished) onVideoPublished(res.video);
    } catch (err) {
      console.error('Publishing error:', err);
      setError(err.message || 'Failed to publish video.');
    } finally {
      setIsPublishing(false);
    }
  };

  const trainer50Split = Math.round(tokenCost * 0.5);
  const platform50Split = tokenCost - trainer50Split;

  // Resolved thumbnail for preview
  const resolvedThumbnail = thumbnailUrl || (() => {
    const match = String(videoUrl).match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
    return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : '';
  })();

  const coachName = user?.name || user?.email?.split('@')[0] || 'Coach';

  return (
    <div 
      className="glass-panel" 
      data-agent-id="video-publish-panel"
      style={{ padding: '1.75rem', maxWidth: '820px', margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
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
          <Film size={20} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Publish Workout Tutorial & Masterclass
          </h3>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-orange)', fontWeight: 600 }}>
            ⚡ 50 / 50 Token Revenue Split Enabled
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0.35rem 0 1.25rem', lineHeight: 1.5 }}>
        Upload instructional videos to the public workout library. When viewers pay tokens to buy your video, they receive permanent lifetime access to watch it for life, and you receive <strong>50%</strong> of the tokens credited to your account.
      </p>

      {/* Mandatory Unlisted YouTube Requirement Notice */}
      <div 
        data-testid="unlisted-instruction-callout"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 107, 0, 0.08) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '12px',
          padding: '1.15rem 1.35rem',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}
      >
        <div style={{
          background: '#f59e0b',
          color: '#0d111c',
          borderRadius: '8px',
          padding: '0.45rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: '1.1rem',
          flexShrink: 0
        }}>
          ⚠️
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 800, color: '#fef08a' }}>
              Mandatory YouTube Setting: Always List as "Unlisted"
            </h4>
            <span style={{
              background: 'rgba(245, 158, 11, 0.25)',
              color: '#fde047',
              padding: '0.15rem 0.5rem',
              borderRadius: '999px',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              UNLISTED REQUIRED
            </span>
          </div>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.45 }}>
            Before submitting, ensure your video's visibility is set to <strong>Unlisted</strong> in YouTube Studio:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.5rem', fontSize: '0.78rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(34, 197, 94, 0.35)', borderRadius: '8px', padding: '0.5rem 0.65rem' }}>
              <strong style={{ color: '#4ade80' }}>✓ Unlisted (Required):</strong> Allows paying members on Trainer David to unlock and stream your video for life using FitTokens while keeping it protected.
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px', padding: '0.5rem 0.65rem' }}>
              <strong style={{ color: '#f87171' }}>✗ Do NOT set to Private:</strong> Private videos block YouTube embedding completely, causing playback errors for viewers.
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(234, 179, 8, 0.35)', borderRadius: '8px', padding: '0.5rem 0.65rem' }}>
              <strong style={{ color: '#facc15' }}>✗ Do NOT set to Public:</strong> Public videos allow anyone to watch for free on YouTube, bypassing your 50% token earnings.
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} data-testid="form-publish-video">
        {/* Video URL & Auto-Extract Action */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <label htmlFor="input-video-url" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              YouTube Video URL (Watch, Short, or Share Link)
            </label>
            {extractSuccess && (
              <span style={{ fontSize: '0.75rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700 }}>
                <CheckCircle2 size={13} color="#22c55e" />
                <span>Extracted & Synchronized</span>
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <input
              id="input-video-url"
              data-testid="input-youtube-url"
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              onBlur={handleUrlBlur}
              style={{
                flex: '1 1 280px',
                padding: '0.65rem 0.85rem',
                background: '#0d111c',
                border: extractSuccess ? '1px solid #22c55e' : '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />

            <button
              type="button"
              data-testid="btn-extract-youtube"
              disabled={isExtracting || !videoUrl.trim()}
              onClick={() => handleExtract()}
              style={{
                padding: '0.65rem 1.1rem',
                borderRadius: '8px',
                background: isExtracting ? 'rgba(255, 107, 0, 0.4)' : 'linear-gradient(135deg, #ff6b00 0%, #ff8a00 100%)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isExtracting || !videoUrl.trim() ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                boxShadow: '0 2px 8px rgba(255, 107, 0, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <Sparkles size={16} />
              <span>{isExtracting ? 'Extracting...' : 'Extract Details'}</span>
            </button>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            ⚡ Automatically extracts YouTube video thumbnail, title, and biomechanical description into the form.
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label htmlFor="input-video-title" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
            Tutorial Title
          </label>
          <input
            id="input-video-title"
            data-testid="input-tutorial-title"
            type="text"
            required
            placeholder="e.g. Master Incline Dumbbell Press for Upper Chest Growth"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              background: '#0d111c',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.92rem'
            }}
          />
        </div>

        {/* Duration & Category */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <label htmlFor="input-duration" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Duration
            </label>
            <input
              id="input-duration"
              data-testid="input-video-duration"
              type="text"
              placeholder="e.g. 10 mins"
              value={duration}
              onChange={e => setDuration(e.target.value)}
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

          <div>
            <label htmlFor="select-category" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Target Category
            </label>
            <select
              id="select-category"
              data-testid="select-video-category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: '#0d111c',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.88rem'
              }}
            >
              <option value="Chest & Shoulders">Chest & Shoulders</option>
              <option value="Back & Posture">Back & Posture</option>
              <option value="Arms & Triceps">Arms & Triceps</option>
              <option value="Legs & Glutes">Legs & Glutes</option>
              <option value="Core & Abs">Core & Abs</option>
              <option value="Mobility & Rehab">Mobility & Rehab</option>
              <option value="Nutrition & Prep">Nutrition & Prep</option>
              <option value="Full Body Conditioning">Full Body Conditioning</option>
            </select>
          </div>
        </div>

        {/* Difficulty, Muscle Group & Equipment */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <label htmlFor="select-difficulty" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Difficulty Level
            </label>
            <select
              id="select-difficulty"
              data-testid="select-video-difficulty"
              value={difficulty}
              onChange={e => setDifficulty(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                background: '#0d111c',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.88rem'
              }}
            >
              <option value="Beginner Friendly">Beginner Friendly</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced Masterclass">Advanced Masterclass</option>
            </select>
          </div>

          <div>
            <label htmlFor="input-muscle-group" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Anatomical Muscle Groups
            </label>
            <input
              id="input-muscle-group"
              data-testid="input-muscle-group"
              type="text"
              placeholder="e.g. Pectoralis Major, Anterior Deltoids"
              value={muscleGroup}
              onChange={e => setMuscleGroup(e.target.value)}
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

          <div>
            <label htmlFor="input-equipment" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Equipment Required
            </label>
            <input
              id="input-equipment"
              data-testid="input-equipment"
              type="text"
              placeholder="e.g. Incline Bench & Dumbbells"
              value={equipment}
              onChange={e => setEquipment(e.target.value)}
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
        </div>

        {/* Custom Token Rate & 50/50 Revenue Split Calculator */}
        <div style={{
          background: 'rgba(255, 107, 0, 0.06)',
          border: '1px solid rgba(255, 107, 0, 0.25)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <label htmlFor="token-cost-input" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Coins size={16} color="#f59e0b" />
              <span>Your Custom Watch Rate (FitTokens)</span>
            </label>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[1, 2, 5, 10, 15].map(rate => (
                <button
                  type="button"
                  key={rate}
                  onClick={() => setTokenCost(rate)}
                  style={{
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    background: tokenCost === rate ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.05)',
                    color: tokenCost === rate ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  {rate} {rate === 1 ? 'Token' : 'Tokens'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              id="token-cost-input"
              data-testid="input-token-cost"
              type="number"
              min="1"
              max="100"
              step="1"
              value={tokenCost}
              onChange={e => setTokenCost(Math.max(1, Math.round(Number(e.target.value) || 1)))}
              style={{
                width: '120px',
                padding: '0.55rem 0.75rem',
                background: '#0d111c',
                border: '1px solid var(--accent-orange)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 800,
                textAlign: 'center'
              }}
            />

            {/* Live 50/50 Split Preview */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
              <div style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>You Earn (50%): </span>
                <strong style={{ color: '#22c55e', fontSize: '0.9rem' }}>+{trainer50Split} Tokens</strong>
              </div>

              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>SuperAdmin Fee (50%): </span>
                <strong style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>+{platform50Split} Tokens</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label htmlFor="textarea-description" style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
            Biomechanical Description & Benefit
          </label>
          <textarea
            id="textarea-description"
            data-testid="textarea-description"
            rows={3}
            placeholder="Explain the specific joint action, line of resistance, and technique nuances..."
            value={shortDescription}
            onChange={e => setShortDescription(e.target.value)}
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

        {/* Technique Cues */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Coaching Form Cues (Highlights)
            </label>
            {cues.length < 4 && (
              <button
                type="button"
                onClick={handleAddCue}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-orange)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                <Plus size={12} />
                <span>Add Cue</span>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {cues.map((cue, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={`Cue #${idx + 1}: e.g. Maintain slight elbow bend throughout full adduction`}
                value={cue}
                onChange={e => handleCueChange(idx, e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  background: '#0d111c',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            ))}
          </div>
        </div>

        {/* Interactive Live Postcard Preview (Exactly as rendered in Workout Library) */}
        <div style={{
          marginTop: '1.75rem',
          marginBottom: '1.75rem',
          background: 'rgba(9, 11, 16, 0.75)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Film size={16} color="var(--accent-orange)" />
              <span>Live Postcard Preview</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Real-time representation in the 31+ Workout Library
            </span>
          </div>

          <div style={{ maxWidth: '380px', margin: '0 auto' }}>
            <div 
              className="video-postcard"
              data-testid="postcard-preview"
              style={{ margin: 0, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}
            >
              {/* Thumbnail Wrap */}
              <div className="postcard-thumb-wrap">
                {resolvedThumbnail ? (
                  <img 
                    src={resolvedThumbnail} 
                    alt={title || 'Video preview thumbnail'} 
                    className="postcard-thumb"
                    loading="lazy"
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #141824 0%, #0d111c 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    gap: '0.5rem'
                  }}>
                    <Film size={36} opacity={0.4} />
                    <span style={{ fontSize: '0.76rem' }}>Pasting YouTube link extracts thumbnail</span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)'
                }} />

                {/* Play Button Overlay */}
                <div className="play-overlay-btn" style={{ background: 'rgba(255, 107, 0, 0.95)' }}>
                  <Play size={20} fill="#fff" strokeWidth={0} />
                </div>

                {/* Category Pill */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(10, 12, 18, 0.85)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--accent-orange)'
                }}>
                  {category}
                </div>

                {/* Duration Tag */}
                <div className="postcard-duration-badge">
                  <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                  {duration}
                </div>
              </div>

              {/* Postcard Body Content */}
              <div className="postcard-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', gap: '0.5rem' }}>
                  <div style={{
                    fontSize: '0.74rem',
                    color: 'var(--accent-lime)',
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    🎯 {muscleGroup.trim() || 'Target Muscles'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {coachName}
                  </div>
                </div>

                {/* Title */}
                <h3 className="postcard-title">
                  {title.trim() || 'Masterclass Video Title'}
                </h3>

                {/* Short Description */}
                <p className="postcard-desc">
                  {shortDescription.trim() || 'Biomechanical description and key joint actions will display here...'}
                </p>

                {/* Equipment & Split Preview */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.55rem 0.7rem',
                  borderRadius: '8px',
                  marginBottom: '0.9rem',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🏋️ {equipment}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{difficulty}</span>
                  </div>
                </div>

                {/* Postcard Footer: Token Rate & Watch for Life */}
                <div className="postcard-footer">
                  <div className="token-price-tag">
                    <Coins size={14} color="#f59e0b" />
                    <span>{tokenCost} {tokenCost === 1 ? 'Token' : 'Tokens'}</span>
                    <span className="usd-hover-price">(${tokenCost}.00 USD)</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-lime)', fontWeight: 800 }}>
                      ✓ Watch for Life
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 700 }}>
                      50% Earned: +{trainer50Split} Tokens
                    </span>
                  </div>
                </div>
              </div>
            </div>
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

        {/* Submit */}
        <button
          type="submit"
          data-testid="btn-publish-masterclass"
          disabled={isPublishing}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          {isPublishing ? (
            <span>Publishing Video Masterclass...</span>
          ) : (
            <>
              <Play size={16} fill="#fff" />
              <span>Publish Video Masterclass ({tokenCost} Tokens • 50% Split)</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
