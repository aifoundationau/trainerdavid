import React, { useState, useEffect, useMemo } from 'react';
import { Instagram, Facebook, Search, Plus, Coins, Lock, Check, Sparkles, ExternalLink, ArrowLeft } from './Icons';
import { fetchSocialPosts, publishSocialPost } from '../services/socialApi';
import SocialPostcardModal from './SocialPostcardModal';
import { isUserSuperAdmin } from '../data/adminStore';

export default function SocialPage({
  user,
  tokens,
  unlockedPostIds = [],
  onUnlockSuccess,
  onTokensChanged,
  onOpenAuth,
  onGoHome,
  onOpenTokenStore
}) {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);

  // New post form state
  const [newPlatform, setNewPlatform] = useState('instagram');
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newThumb, setNewThumb] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const isSuperAdmin = user ? (isUserSuperAdmin(user.email) && !user.isImpersonating) : false;

  const loadPosts = async () => {
    try {
      const data = await fetchSocialPosts();
      if (Array.isArray(data)) setPosts(data);
    } catch (err) {
      console.warn('Failed to load social posts:', err);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesPlatform = platformFilter === 'All' || post.platform === platformFilter.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        post.title.toLowerCase().includes(q) ||
        post.caption.toLowerCase().includes(q) ||
        post.author.toLowerCase().includes(q) ||
        post.platform.toLowerCase().includes(q) ||
        (Array.isArray(post.tags) && post.tags.some(t => t.toLowerCase().includes(q)));
      return matchesPlatform && matchesSearch;
    });
  }, [posts, platformFilter, searchQuery]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!newUrl.trim()) {
      setFormError('Please enter the Instagram or Facebook post URL.');
      return;
    }
    if (!newTitle.trim()) {
      setFormError('Please enter a title or headline for the post.');
      return;
    }

    setIsPublishing(true);
    setFormError('');
    setFormSuccess('');

    try {
      const tagsArray = newTags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
      const res = await publishSocialPost({
        platform: newPlatform,
        url: newUrl.trim(),
        title: newTitle.trim(),
        caption: newCaption.trim(),
        thumbnailUrl: newThumb.trim() || undefined,
        tags: tagsArray
      });

      setFormSuccess(res.message || 'Post published live!');
      setNewUrl('');
      setNewTitle('');
      setNewCaption('');
      setNewThumb('');
      setNewTags('');
      loadPosts();
      setTimeout(() => {
        setShowPostForm(false);
        setFormSuccess('');
      }, 1500);
    } catch (err) {
      setFormError(err.message || 'Failed to publish post.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#07090e', color: '#fff', paddingBottom: '4rem' }}>
      
      {/* Top Banner Header */}
      <section style={{
        background: 'radial-gradient(ellipse at top, #151b2e 0%, #07090e 70%)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '3rem 0 2.5rem'
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <button
              onClick={onGoHome}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
            >
              <ArrowLeft size={14} />
              <span>Back to Workouts</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                onClick={() => setShowPostForm(!showPostForm)}
                className="btn-primary"
                style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem', gap: '0.45rem' }}
              >
                <Plus size={16} />
                <span>{showPostForm ? 'Close Post Form' : 'Post to Social'}</span>
              </button>

              {user && (
                <button
                  onClick={onOpenTokenStore}
                  className="btn-token"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                  title="Your FitToken Balance"
                >
                  <Coins size={14} />
                  <span>{tokens} Tokens</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(225,48,108,0.2) 0%, rgba(24,119,242,0.2) 100%)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}>
                📸 Instagram & 📘 Facebook Feed
              </span>
              <span className="badge badge-orange">
                <Coins size={12} />
                <span>1 Token to Unlock • 1 Token to Message</span>
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: 800,
              marginBottom: '0.85rem',
              color: '#fff',
              letterSpacing: '-0.02em'
            }}>
              SOCIAL POSTCARD BANNERS
            </h1>

            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '640px', margin: '0 auto' }}>
              Explore verified workout tips, nutrition reels, and coaching takeaways. Unlock any postcard for 1 token to read full technique notes and message the creator directly.
            </p>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="container" style={{ marginTop: '2rem' }}>

        {/* Creator Post Form Expander */}
        {showPostForm && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(13, 17, 28, 0.95) 100%)',
            border: '1px solid rgba(255, 107, 0, 0.35)',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '2.5rem',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Sparkles size={18} color="var(--accent-orange)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                Publish an Instagram or Facebook Postcard
              </h3>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {/* Platform */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Platform *
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#07090e',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="instagram">📸 Instagram Post / Reel</option>
                    <option value="facebook">📘 Facebook Post / Video</option>
                  </select>
                </div>

                {/* URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    {newPlatform === 'instagram' ? 'Instagram URL *' : 'Facebook URL *'}
                  </label>
                  <input
                    type="url"
                    placeholder={newPlatform === 'instagram' ? 'https://www.instagram.com/reel/...' : 'https://www.facebook.com/...'}
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#07090e',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Post Title / Key Cue *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Scapular Retraction & Bar Path on Incline Dumbbell Press"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#07090e',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              {/* Caption */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Coaching Notes / Breakdown (Revealed when unlocked)
                </label>
                <textarea
                  rows={3}
                  placeholder="Share the full anatomical cues, repetitions, biomechanical setup, and takeaways..."
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    background: '#07090e',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.88rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Thumbnail URL & Tags */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Thumbnail Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://... image preview"
                    value={newThumb}
                    onChange={(e) => setNewThumb(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#07090e',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="bench, chest, biomechanics, reels"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#07090e',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              {formError && (
                <div style={{ color: '#ef4444', fontSize: '0.82rem' }}>
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div style={{ color: '#22c55e', fontSize: '0.82rem' }}>
                  ✓ {formSuccess}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPostForm(false)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.3rem', fontSize: '0.85rem' }}
                >
                  {isPublishing ? 'Publishing…' : 'Publish Postcard (1 Token Rate)'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div style={{
          background: 'rgba(15, 20, 32, 0.7)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '1.25rem',
          backdropFilter: 'blur(10px)',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search 
              size={18} 
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }} 
            />
            <input
              type="text"
              placeholder="Search social posts (e.g. bench press, macros, yoga, biomechanics)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.5rem',
                background: '#07090e',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem'
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Platform Filter Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { id: 'All', label: 'All Postcards' },
              { id: 'instagram', label: '📸 Instagram' },
              { id: 'facebook', label: '📘 Facebook' }
            ].map(tab => {
              const active = platformFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPlatformFilter(tab.id)}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    background: active ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.04)',
                    color: active ? '#fff' : 'var(--text-secondary)',
                    border: active ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Postcard Grid */}
        {filteredPosts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '16px',
            border: '1px dashed var(--border-subtle)'
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
              No Social Postcards Found
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.25rem' }}>
              No posts matched your search criteria. Be the first to share an Instagram or Facebook post!
            </p>
            <button
              onClick={() => setShowPostForm(true)}
              className="btn-primary"
              style={{ padding: '0.55rem 1.2rem', fontSize: '0.85rem' }}
            >
              Post to Social
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.75rem'
          }}>
            {filteredPosts.map(post => {
              const isUnlocked = isSuperAdmin || unlockedPostIds.includes(post.id);
              const isIg = post.platform === 'instagram';

              return (
                <div
                  key={post.id}
                  className="glass-panel"
                  style={{
                    borderRadius: '16px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: isIg ? '1px solid rgba(225, 48, 108, 0.3)' : '1px solid rgba(24, 119, 242, 0.3)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    background: '#0a0d16'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = isIg 
                      ? '0 15px 30px rgba(225, 48, 108, 0.2)' 
                      : '0 15px 30px rgba(24, 119, 242, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {/* Postcard Banner Header */}
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: isIg 
                      ? 'linear-gradient(135deg, rgba(131,58,180,0.2) 0%, rgba(253,29,29,0.2) 50%, rgba(252,176,69,0.2) 100%)' 
                      : 'linear-gradient(135deg, rgba(24,119,242,0.2) 0%, rgba(13,71,161,0.2) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {isIg ? <Instagram size={16} color="#e1306c" /> : <Facebook size={16} color="#1877f2" />}
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>
                        {isIg ? 'Instagram' : 'Facebook'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {post.author}
                    </span>
                  </div>

                  {/* Postcard Media Thumbnail */}
                  <div 
                    onClick={() => setSelectedPost(post)}
                    style={{
                      position: 'relative',
                      height: '200px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      background: '#05070c'
                    }}
                  >
                    <img
                      src={post.thumbnailUrl}
                      alt={post.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: (isUnlocked || Number(post.tokenCost) === 0) ? 'none' : 'blur(6px) brightness(0.7)',
                        transition: 'transform 0.3s ease'
                      }}
                    />

                    {/* Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      zIndex: 2
                    }}>
                      {Number(post.tokenCost) === 0 ? (
                        <span className="badge" style={{ fontSize: '0.7rem', background: 'rgba(34, 197, 94, 0.25)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
                          <Sparkles size={11} />
                          <span>Free to View</span>
                        </span>
                      ) : isUnlocked ? (
                        <span className="badge badge-lime" style={{ fontSize: '0.7rem' }}>
                          <Check size={11} strokeWidth={2.5} />
                          <span>Unlocked</span>
                        </span>
                      ) : (
                        <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>
                          <Lock size={11} />
                          <span>{post.tokenCost || 1} {post.tokenCost === 1 ? 'Token' : 'Tokens'}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Postcard Body */}
                  <div style={{ padding: '1.1rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 
                      onClick={() => setSelectedPost(post)}
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: '#fff',
                        marginBottom: '0.45rem',
                        lineHeight: 1.35,
                        cursor: 'pointer'
                      }}
                    >
                      {post.title}
                    </h3>

                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      flex: 1
                    }}>
                      {isUnlocked 
                        ? (post.caption.length > 120 ? `${post.caption.slice(0, 120)}...` : post.caption)
                        : `${post.caption.slice(0, 65)}... (Unlock for full coaching notes)`}
                    </p>

                    {/* Action Footer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      <button
                        onClick={() => setSelectedPost(post)}
                        className={isUnlocked ? 'btn-secondary' : 'btn-primary'}
                        style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', gap: '0.35rem', flex: 1, justifyContent: 'center' }}
                      >
                        {isUnlocked ? (
                          <>
                            <span>View & Message</span>
                          </>
                        ) : (
                          <>
                            <Coins size={13} />
                            <span>Unlock (1 Token)</span>
                          </>
                        )}
                      </button>

                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}
                        title="Open on social platform"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Social Postcard Detail Modal */}
      {selectedPost && (
        <SocialPostcardModal
          post={selectedPost}
          isUnlocked={isSuperAdmin || unlockedPostIds.includes(selectedPost.id)}
          user={user}
          tokens={tokens}
          onClose={() => setSelectedPost(null)}
          onUnlockSuccess={(postId) => {
            if (onUnlockSuccess) onUnlockSuccess(postId);
          }}
          onTokensChanged={onTokensChanged}
          onOpenAuth={onOpenAuth}
        />
      )}

    </div>
  );
}

