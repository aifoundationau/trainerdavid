import React, { useState } from 'react';
import { Play, Coins, Plus, CheckCircle2, Film } from './Icons';
import { publishWorkoutVideo } from '../services/trainerApi';

export default function VideoPublishPanel({ user, showToast, onVideoPublished }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Chest & Shoulders');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('Dumbbells & Bench');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [duration, setDuration] = useState('10 mins');
  const [tokenCost, setTokenCost] = useState(5);
  const [videoUrl, setVideoUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [cues, setCues] = useState(['', '']);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');

  const handleCueChange = (index, value) => {
    const next = [...cues];
    next[index] = value;
    setCues(next);
  };

  const handleAddCue = () => {
    if (cues.length < 4) setCues([...cues, '']);
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
        shortDescription: shortDescription.trim(),
        keyCues: cues.filter(c => c.trim().length > 0)
      });

      showToast(`🎬 Video "${title}" published live with a ${price} FitToken rate!`);
      setTitle('');
      setVideoUrl('');
      setShortDescription('');
      setMuscleGroup('');
      setCues(['', '']);
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

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', maxWidth: '780px', margin: '0 auto' }}>
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

      <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0.35rem 0 1.5rem', lineHeight: 1.5 }}>
        Upload instructional videos to the public workout library. When viewers pay tokens to watch your video, you receive <strong>50%</strong> of the tokens credited to your account, and <strong>50%</strong> goes to the SuperAdmin platform.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Title */}
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
            Tutorial Title
          </label>
          <input
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

        {/* Video URL & Duration */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              YouTube / Video Embed URL
            </label>
            <input
              type="url"
              required
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
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
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Duration
            </label>
            <input
              type="text"
              placeholder="e.g. 12 mins"
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
        </div>

        {/* Category & Difficulty */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Target Category
            </label>
            <select
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

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Difficulty Level
            </label>
            <select
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
        </div>

        {/* Muscle Group & Equipment */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Anatomical Muscle Groups
            </label>
            <input
              type="text"
              placeholder="e.g. Pectoralis Major, Clavicular Head, Anterior Deltoids"
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
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
              Equipment Required
            </label>
            <input
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
          <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
            Biomechanical Description & Benefit
          </label>
          <textarea
            rows={2}
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
