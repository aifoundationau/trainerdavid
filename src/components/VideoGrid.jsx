import React, { useState, useMemo, useEffect } from 'react';
import { Play, Search, Dumbbell, Clock, Check, ChevronRight, ChevronLeft, Coins, Lock, Sparkles } from './Icons';
import { videoLibrary, categories } from '../data/videos';
import { fetchCommunityVideos } from '../services/trainerApi';

const PAGE_SIZE = 9; // 3 videos across x 3 rows down = 9 videos max per panel

export default function VideoGrid({ onSelectVideo, tokens, unlockedVideoIds = [], user, isSubscriber = false }) {
  const [selectedCategory, setSelectedCategory] = useState("All Workouts");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [communityVideos, setCommunityVideos] = useState([]);

  useEffect(() => {
    fetchCommunityVideos()
      .then(vids => {
        if (Array.isArray(vids) && vids.length > 0) {
          setCommunityVideos(vids);
        }
      })
      .catch(() => {});
  }, []);

  const allVideos = useMemo(() => {
    const communityIds = new Set(communityVideos.map(v => v.id));
    const dedupedLibrary = videoLibrary.filter(v => !communityIds.has(v.id));
    return [...communityVideos, ...dedupedLibrary];
  }, [communityVideos]);

  // Filter videos
  const filteredVideos = useMemo(() => {
    return allVideos.filter(video => {
      const matchesCategory = selectedCategory === "All Workouts" || video.category === selectedCategory;
      const matchesSearch = 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.author || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.equipment.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDifficulty = difficultyFilter === "All" || video.difficulty === difficultyFilter;

      return matchesCategory && matchesSearch && matchesDifficulty;
    });
  }, [allVideos, selectedCategory, searchQuery, difficultyFilter]);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, difficultyFilter]);

  const totalPages = Math.ceil(filteredVideos.length / PAGE_SIZE) || 1;

  // Paginated videos (exact 3x3 = 9 items max)
  const currentVideos = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredVideos.slice(start, start + PAGE_SIZE);
  }, [filteredVideos, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const sectionEl = document.getElementById('workouts');
      if (sectionEl) {
        sectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <section id="workouts" style={{ padding: '4rem 0', position: 'relative' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{
          textAlign: 'center',
          maxWidth: '740px',
          margin: '0 auto 2.5rem'
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <span className="badge badge-orange">
              <Play size={12} fill="#ff6b00" />
              <span>Instructional Library</span>
            </span>
            <span className="badge badge-cyan">
              <Coins size={12} />
              <span>1 Token Per Video ($1 USD)</span>
            </span>
          </div>

          <h2 style={{
            fontSize: 'clamp(1.9rem, 3.5vw, 2.5rem)',
            fontWeight: 800,
            marginBottom: '0.85rem',
            color: '#fff'
          }}>
            EXPLORE 31+ VIDEO WORKOUTS
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Step-by-step biomechanical execution, key cues, and muscle activation. Spend tokens once to own permanent lifetime access. Every video you unlock is yours to watch for life on any device.
          </p>
        </div>

        {/* Filter and Search Bar Controls */}
        <div style={{
          background: 'rgba(17, 21, 30, 0.7)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '18px',
          padding: '1.25rem',
          backdropFilter: 'blur(12px)',
          marginBottom: '2rem'
        }}>
          {/* Search Input Row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{
              position: 'relative',
              flex: '1 1 280px'
            }}>
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
                placeholder="Search workouts (e.g. chest, row, hack squat, deadlift, triceps, abs)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem 0.7rem 2.5rem',
                  background: 'rgba(9, 11, 16, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-orange)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                id="workout-search-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Results count badge */}
            <div style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              padding: '0.35rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px'
            }}>
              Showing <span style={{ color: 'var(--accent-orange)', fontWeight: 800 }}>{filteredVideos.length}</span> Videos (Page {currentPage} of {totalPages})
            </div>
          </div>

          {/* Category Tabs */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            {categories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    background: isActive ? 'linear-gradient(135deg, #ff6b00 0%, #ff8a00 100%)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    border: isActive ? '1px solid #ff6b00' : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isActive ? '0 4px 15px rgba(255, 107, 0, 0.35)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Video Postcards Grid - Strictly 3 across x 3 rows down (9 per page max) */}
        {filteredVideos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            background: 'var(--bg-card)',
            borderRadius: '20px',
            border: '1px dashed var(--border-subtle)'
          }}>
            <Dumbbell size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No workouts match your search</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Try clearing your filters or search term to browse all 31 video tutorials.</p>
            <button 
              onClick={() => { setSelectedCategory("All Workouts"); setSearchQuery(""); }}
              className="btn-secondary"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid-cards">
              {currentVideos.map((video) => {
                const cost = Math.max(1, Math.round(Number(video.tokenCost) || 1));
                const isUnlocked = unlockedVideoIds.includes(video.id);
                const hasTokens = tokens >= cost;
                const canWatch = isSubscriber || isUnlocked || (user && hasTokens);

                return (
                  <div 
                    key={video.id} 
                    className="video-postcard"
                    id={`postcard-${video.id}`}
                  >
                    {/* Thumbnail Wrap */}
                    <div 
                      className="postcard-thumb-wrap"
                      onClick={() => onSelectVideo(video)}
                      title={canWatch ? (isUnlocked ? `Watch for Life: ${video.title} (Lifetime Access)` : `Watch: ${video.title}`) : !user ? `Sign in with Google required (${cost} ${cost === 1 ? 'Token' : 'Tokens'} • Watch for Life)` : `${cost} ${cost === 1 ? 'Token' : 'Tokens'} to unlock for life`}
                    >
                      <img 
                        src={video.thumbnailUrl} 
                        alt={video.title} 
                        className="postcard-thumb"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
                        }}
                      />

                      {/* Gradient overlay */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)'
                      }} />

                      {/* Play or Lock Button Overlay */}
                      <div className="play-overlay-btn" style={{
                        background: canWatch ? 'rgba(255, 107, 0, 0.95)' : 'rgba(20, 24, 35, 0.9)'
                      }}>
                        {canWatch ? (
                          <Play size={20} fill="#fff" strokeWidth={0} />
                        ) : (
                          <Lock size={18} color="#ff9e40" />
                        )}
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
                        {video.category}
                      </div>

                      {/* Duration Tag */}
                      <div className="postcard-duration-badge">
                        <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                        {video.duration}
                      </div>
                    </div>

                    {/* Postcard Body Content */}
                    <div className="postcard-body">
                      {/* Coach Author & Target Muscle Tag */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem', gap: '0.5rem' }}>
                        <div style={{
                          fontSize: '0.74rem',
                          color: 'var(--accent-lime)',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          🎯 {video.muscleGroup}
                        </div>
                        {video.author && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {video.author}
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3 
                        className="postcard-title" 
                        onClick={() => onSelectVideo(video)}
                        style={{ cursor: 'pointer' }}
                      >
                        {video.title}
                      </h3>

                      {/* Short Description */}
                      <p className="postcard-desc">
                        {video.shortDescription}
                      </p>

                      {/* Equipment & Cues Preview */}
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '0.55rem 0.7rem',
                        borderRadius: '8px',
                        marginBottom: '0.9rem',
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                          ⚙️ {video.equipment}
                        </div>
                        {video.keyCues && video.keyCues[0] && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Check size={12} color="var(--accent-lime)" />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              Cue: {video.keyCues[0]}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Meta & Action Row */}
                      <div className="postcard-meta-row">
                        {!user ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            <Lock size={13} color="var(--accent-orange)" />
                            <span>{cost} {cost === 1 ? 'Token' : 'Tokens'} • Sign In</span>
                          </div>
                        ) : isSubscriber ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-lime)', fontSize: '0.75rem', fontWeight: 700 }}>
                            <Check size={14} color="var(--accent-lime)" strokeWidth={3} />
                            <span>Pass Active</span>
                          </div>
                        ) : isUnlocked ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent-lime)', fontSize: '0.75rem', fontWeight: 800 }}>
                            <Check size={14} color="var(--accent-lime)" strokeWidth={2.5} />
                            <span>Watch for Life</span>
                          </div>
                        ) : !hasTokens ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>
                            <Lock size={13} color="#f87171" />
                            <span>{cost} {cost === 1 ? 'Token' : 'Tokens'}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f59e0b', fontSize: '0.78rem', fontWeight: 700 }}>
                            <Coins size={14} />
                            <span>{cost} {cost === 1 ? 'Token' : 'Tokens'}</span>
                          </div>
                        )}

                        <button 
                          onClick={() => onSelectVideo(video)}
                          className={canWatch ? "btn-primary" : "btn-secondary"}
                          style={{
                            padding: '0.42rem 0.9rem',
                            fontSize: '0.8rem',
                            gap: '0.35rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {isSubscriber ? (
                            <>
                              <span>Stream Free</span>
                              <Play size={12} fill="#fff" />
                            </>
                          ) : !user ? (
                            <>
                              <Lock size={12} color="#ff9e40" />
                              <span>Sign In ({cost} {cost === 1 ? 'Token' : 'Tokens'})</span>
                            </>
                          ) : !canWatch ? (
                            <>
                              <Lock size={12} color="#ff9e40" />
                              <span>{cost} {cost === 1 ? 'Token' : 'Tokens'} Needed</span>
                            </>
                          ) : isUnlocked ? (
                            <>
                              <span>Watch for Life</span>
                              <Play size={12} fill="#fff" />
                            </>
                          ) : (
                            <>
                              <span>Watch ({cost} {cost === 1 ? 'Token' : 'Tokens'})</span>
                              <Play size={12} fill="#fff" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Pagination Controls - Previous / Next Page Button */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                marginTop: '3rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary"
                  style={{
                    padding: '0.6rem 1.1rem',
                    fontSize: '0.85rem',
                    opacity: currentPage === 1 ? 0.4 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                  id="pagination-prev-btn"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                {/* Page Number Pills */}
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                    const isCurrent = pageNum === currentPage;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          border: isCurrent ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                          background: isCurrent ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.05)',
                          color: isCurrent ? '#fff' : 'var(--text-secondary)',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next Page Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-primary"
                  style={{
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.85rem',
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                  id="pagination-next-btn"
                >
                  <span>Next Page</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
}
