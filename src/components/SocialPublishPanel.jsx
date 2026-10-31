import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Coins, 
  CheckCircle2, 
  Lock, 
  ExternalLink, 
  Plus, 
  Trash2,
  Instagram,
  Facebook,
  Play
} from './Icons';
import { publishSocialPost, fetchSocialPosts, deleteSocialPost } from '../services/socialApi';

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📸', placeholder: 'https://www.instagram.com/reel/...' },
  { id: 'facebook', name: 'Facebook', icon: '📘', placeholder: 'https://www.facebook.com/TrainerDavid/posts/...' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', placeholder: 'https://www.tiktok.com/@trainer/video/...' },
  { id: 'youtube', name: 'YouTube Shorts', icon: '🔴', placeholder: 'https://www.youtube.com/shorts/...' },
  { id: 'x', name: 'X / Twitter', icon: '🐦', placeholder: 'https://x.com/trainer/status/...' },
  { id: 'threads', name: 'Threads', icon: '🧵', placeholder: 'https://www.threads.net/@trainer/post/...' },
  { id: 'other', name: 'Other Social Link', icon: '🌐', placeholder: 'https://...' }
];

export default function SocialPublishPanel({ user, showToast, onPostPublished, onExploreSocial }) {
  const [platform, setPlatform] = useState('instagram');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tokenCost, setTokenCost] = useState(1);
  const [messageTokenCost, setMessageTokenCost] = useState(1);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['biomechanics', 'workout']);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState('');
  const [myPosts, setMyPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadMyPosts = async () => {
    try {
      const all = await fetchSocialPosts();
      const mine = (all || []).filter(p => 
        p.creatorUid === user?.uid || 
        p.creatorEmail?.toLowerCase() === user?.email?.toLowerCase() ||
        (user?.email === 'support@aifoundation.net.au' && p.creatorRole === 'superadmin')
      );
      setMyPosts(mine);
    } catch (err) {
      console.warn('Could not load user posts:', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    loadMyPosts();
  }, [user]);

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean && !tags.includes(clean) && tags.length < 5) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a headline or title for your post.');
      return;
    }
    if (!url.trim()) {
      setError('Please provide the social media post link.');
      return;
    }

    const price = Math.max(0, Math.round(Number(tokenCost !== undefined ? tokenCost : 1)));
    const msgPrice = Math.max(0, Math.round(Number(messageTokenCost !== undefined ? messageTokenCost : 1)));
    setError('');
    setIsPublishing(true);

    try {
      const res = await publishSocialPost({
        platform,
        url: url.trim(),
        title: title.trim(),
        caption: caption.trim(),
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        tokenCost: price,
        messageTokenCost: msgPrice,
        tags
      });

      if (showToast) {
        showToast(price === 0 
          ? `🎉 Social post "${title}" published for FREE viewing!` 
          : `💰 Social post "${title}" published live at ${price} FitTokens!`);
      }

      setTitle('');
      setUrl('');
      setCaption('');
      setThumbnailUrl('');
      setTokenCost(1);
      setMessageTokenCost(1);
      setTags(['biomechanics', 'workout']);
      await loadMyPosts();
      if (onPostPublished) onPostPublished(res.post);
    } catch (err) {
      setError(err.message || 'Failed to publish social post.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (confirmDeleteId !== postId) {
      setConfirmDeleteId(postId);
      return;
    }

    setDeletingId(postId);
    try {
      await deleteSocialPost(postId);
      if (showToast) showToast('Social post was deleted.');
      setConfirmDeleteId(null);
      await loadMyPosts();
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to delete post.');
    } finally {
      setDeletingId(null);
    }
  };

  const currentPlatformObj = PLATFORMS.find(p => p.id === platform) || PLATFORMS[0];
  const isFree = tokenCost === 0;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }} data-agent-id="social-publish-panel">
      {/* Header Banner */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, rgba(235, 94, 40, 0.12), rgba(20, 20, 20, 0.95))',
        border: '1px solid rgba(235, 94, 40, 0.35)',
        padding: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📱</span>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                Sell & Publish Social Media Posts
              </h2>
              <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>
                CUSTOM TOKEN RATE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Monetize posts from all your social accounts (Instagram, Facebook, TikTok, YouTube Shorts, X, Threads). Choose how much it costs to view each post and how much it costs to send you a message!
            </p>
          </div>

          {onExploreSocial && (
            <button
              onClick={onExploreSocial}
              className="btn btn-secondary"
              style={{ fontSize: '0.84rem' }}
            >
              ← View Social Page
            </button>
          )}
        </div>
      </div>

      {/* Main Publishing Form & Live Preview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.3fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Left: Form */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.84rem'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Platform Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.45rem', color: 'var(--text-secondary)' }}>
                Select Social Platform
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {PLATFORMS.map(p => {
                  const isSelected = platform === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPlatform(p.id)}
                      style={{
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: isSelected ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.04)',
                        color: isSelected ? '#fff' : 'var(--text-secondary)',
                        border: isSelected ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <span>{p.icon}</span>
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Post URL */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                {currentPlatformObj.name} Post Link / URL *
              </label>
              <input
                type="url"
                required
                placeholder={currentPlatformObj.placeholder}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            {/* Post Title */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Post Title / Hook *
              </label>
              <input
                type="text"
                required
                maxLength={120}
                placeholder="e.g. Scapular Arch Setup for Pain-Free Bench Press"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            {/* Caption / Breakdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Post Caption / Coaching Breakdown
              </label>
              <textarea
                rows={3}
                maxLength={800}
                placeholder="Explain the biomechanics, cues, or macro breakdown in this post..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Image / Thumbnail URL (Optional) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Custom Thumbnail / Image URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/... or leave blank for platform default"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem'
                }}
              />
            </div>

            {/* Token Rate Selector for Viewing (0 for Free!) */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Token Rate to View & Unlock
                </label>
                <span style={{ fontSize: '0.75rem', color: isFree ? '#4ade80' : 'var(--accent-orange)', fontWeight: 800 }}>
                  {isFree ? '🎉 FREE POST' : `💰 ${tokenCost} TOKENS`}
                </span>
              </div>

              {/* Preset buttons including 0 tokens (Free) */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {[0, 1, 2, 3, 5, 10].map(rate => (
                  <button
                    type="button"
                    key={rate}
                    onClick={() => setTokenCost(rate)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: tokenCost === rate ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.05)',
                      color: tokenCost === rate ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    {rate === 0 ? '0 (Free to View)' : `${rate} ${rate === 1 ? 'Token' : 'Tokens'}`}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={tokenCost}
                  onChange={(e) => setTokenCost(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                  style={{
                    width: '100px',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    background: '#0d111c',
                    border: '1px solid var(--accent-orange)',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 800,
                    textAlign: 'center'
                  }}
                />
                <div style={{ fontSize: '0.8rem', color: isFree ? '#4ade80' : 'var(--text-secondary)' }}>
                  {isFree 
                    ? 'Members can unlock and view this post completely free (0 tokens spent)!' 
                    : `You earn tokens directly each time a member unlocks your post!`}
                </div>
              </div>
            </div>

            {/* Direct Message Fee Selector */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', display: 'block' }}>
                    💬 Direct Message Fee for this Post
                  </label>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Choose how many FitTokens viewers pay to message you about this post (0 = Free).
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {[0, 1, 2, 5, 10].map(rate => (
                    <button
                      type="button"
                      key={rate}
                      onClick={() => setMessageTokenCost(rate)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: messageTokenCost === rate ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.05)',
                        color: messageTokenCost === rate ? '#fff' : 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      {rate === 0 ? '0 (Free)' : `${rate} ${rate === 1 ? 'Token' : 'Tokens'}`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={messageTokenCost}
                  onChange={(e) => setMessageTokenCost(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                  style={{
                    width: '100px',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    background: '#0d111c',
                    border: '1px solid var(--accent-orange)',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    textAlign: 'center'
                  }}
                />
                <div style={{ fontSize: '0.8rem', color: messageTokenCost === 0 ? '#4ade80' : 'var(--text-secondary)' }}>
                  {messageTokenCost === 0 
                    ? '🎉 Members who unlock this post can message you for FREE (0 tokens)!' 
                    : `Viewers will pay ${messageTokenCost} FitTokens directly to you per message.`}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Tags / Topics (Press Enter to add, max 5)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.45rem' }}>
                {tags.map(t => (
                  <span
                    key={t}
                    style={{
                      background: 'rgba(235, 94, 40, 0.18)',
                      border: '1px solid rgba(235, 94, 40, 0.4)',
                      color: '#ff9e40',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      style={{ background: 'transparent', border: 'none', color: '#ff9e40', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="e.g. nutrition, hypertrophy, benchpress"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.84rem'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPublishing}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '0.5rem'
              }}
            >
              {isPublishing ? (
                <span>Publishing Social Post...</span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>
                    {isFree 
                      ? 'Publish Social Post (Free to View)' 
                      : `Publish Social Post (${tokenCost} Tokens)`}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Live Interactive Postcard Preview */}
        <div>
          <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
            Live Social Postcard Preview
          </div>

          <div style={{
            background: '#161922',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            transition: 'all 0.2s ease'
          }}>
            {/* Thumbnail Header */}
            <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden', background: '#0a0d14' }}>
              <img
                src={thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80'}
                alt={title || 'Social Post Preview'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(4px)',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#fff'
              }}>
                <span>{currentPlatformObj.icon}</span>
                <span style={{ textTransform: 'capitalize' }}>{currentPlatformObj.name}</span>
              </div>

              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: isFree ? 'rgba(34, 197, 94, 0.9)' : 'rgba(235, 94, 40, 0.9)',
                color: '#fff',
                fontSize: '0.74rem',
                fontWeight: 800,
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
              }}>
                {isFree ? 'FREE TO VIEW' : `${tokenCost} TOKENS`}
              </div>
            </div>

            {/* Post Details */}
            <div style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                By <strong>{user?.name || user?.email?.split('@')[0] || 'You'}</strong> (Creator)
              </div>

              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
                {title || 'Your Post Headline Will Appear Here'}
              </h4>

              <p style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                margin: '0 0 0.85rem 0',
                lineHeight: 1.45,
                maxHeight: '3.6em',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {caption || 'Your coaching breakdown, biomechanical cues, and form advice will be displayed here for viewers to unlock.'}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {tags.map(t => (
                  <span key={t} style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    #{t}
                  </span>
                ))}
              </div>

              {/* View Button */}
              <div style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: '8px',
                background: isFree ? 'rgba(34, 197, 94, 0.15)' : 'rgba(235, 94, 40, 0.15)',
                border: isFree ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(235, 94, 40, 0.4)',
                color: isFree ? '#4ade80' : 'var(--accent-orange)',
                fontWeight: 800,
                fontSize: '0.84rem',
                textAlign: 'center'
              }}>
                {isFree ? '🔓 View Free Post' : `🔒 Unlock Post (${tokenCost} Tokens)`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Published Social Media Posts Section */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
              My Published Social Media Posts ({myPosts.length})
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Manage your active social media listings, view rates, and delete posts anytime.
            </div>
          </div>
        </div>

        {loadingPosts ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Loading your posts...
          </div>
        ) : myPosts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '8px',
            border: '1px dashed var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem'
          }}>
            You have not published any social posts yet. Use the form above to publish your first post!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myPosts.map(post => {
              const isConfirming = confirmDeleteId === post.id;
              const isDeleting = deletingId === post.id;
              return (
                <div
                  key={post.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: '#0a0d14'
                    }}>
                      <img
                        src={post.thumbnailUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200'}
                        alt={post.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <span className="badge" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>
                          {post.platform}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          color: post.tokenCost === 0 ? '#4ade80' : 'var(--accent-orange)'
                        }}>
                          {post.tokenCost === 0 ? 'Free to View' : `${post.tokenCost} Tokens`}
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          color: 'var(--text-muted)'
                        }}>
                          • Message: {post.messageTokenCost === 0 ? 'Free' : `${post.messageTokenCost || 1} Token${post.messageTokenCost === 1 ? '' : 's'}`}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        color: '#fff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {post.title}
                      </div>
                    </div>
                  </div>

                  {/* Actions: View & Confirm Delete Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
                    >
                      <ExternalLink size={13} />
                      View Link
                    </a>

                    {/* Strict Rule: Always needs a confirm delete button, once confirmed, it gets deleted */}
                    {isConfirming ? (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={isDeleting}
                          style={{
                            padding: '0.4rem 0.75rem',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            borderRadius: '6px',
                            background: '#ef4444',
                            color: '#fff',
                            border: '1px solid #dc2626',
                            cursor: 'pointer'
                          }}
                        >
                          {isDeleting ? 'Deleting...' : 'Confirm Delete?'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={{
                            padding: '0.4rem 0.65rem',
                            fontSize: '0.78rem',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            color: '#fff',
                            border: '1px solid var(--border-subtle)',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(post.id)}
                        style={{
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.78rem',
                          borderRadius: '6px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
