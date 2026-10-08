import React from 'react';
import { Play, Sparkles, ShieldCheck, Flame, Award, CheckCircle2, ChevronRight, Coins, Crown } from './Icons';

export default function Hero({ onExploreWorkouts, onOpenTokenStore, onOpenConsultation }) {
  return (
    <section style={{
      position: 'relative',
      padding: '4.5rem 0 3.5rem',
      overflow: 'hidden'
    }}>
      <div className="container hero-grid" style={{
        display: 'grid',
        gridTemplateColumns: '1.15fr 0.85fr',
        alignItems: 'center',
        gap: '3.5rem'
      }}>
        
        {/* Left Column: Headline & Value Prop */}
        <div>
          {/* Badges */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <span className="badge badge-orange">
              <Play size={13} fill="#ff6b00" />
              <span>1 Token Per Video</span>
            </span>
            <span className="badge badge-lime">
              <Crown size={13} />
              <span>Monthly All-Access: 99 Tokens</span>
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            color: '#fff'
          }}>
            ELITE PERSONAL TRAINING & BIOMECHANICS BY <span style={{
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff9e40 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>TRAINER DAVID</span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '2rem',
            maxWidth: '560px'
          }}>
            Master every lift with pinpoint anatomical form. Stream 31+ high-yield instructional videos, unlock custom nutrition plans, receive 1-on-1 sports coaching, and get physiotherapy-backed injury rehab.
          </p>

          {/* Call to action buttons */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2.5rem'
          }}>
            <button 
              onClick={onExploreWorkouts}
              className="btn-primary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '0.96rem' }}
              id="hero-explore-btn"
            >
              <Play size={17} fill="#fff" />
              <span>Watch 31 Videos (1 Token)</span>
            </button>

            <button 
              onClick={onOpenTokenStore}
              className="btn-secondary"
              style={{ padding: '0.85rem 1.75rem', fontSize: '0.96rem' }}
              id="hero-tokens-btn"
            >
              <Coins size={17} color="#f59e0b" />
              <span>Get FitTokens</span>
            </button>
          </div>

          {/* Quick Credibility Trust Badges */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            paddingTop: '1.75rem',
            borderTop: '1px solid var(--border-subtle)'
          }} className="hero-trust-grid">
            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-orange)', fontFamily: 'var(--font-heading)' }}>
                31+
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Video Masterclasses
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-heading)' }}>
                1 Token
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Cost Per Video
              </div>
            </div>

            <div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-lime)', fontFamily: 'var(--font-heading)' }}>
                99 Tokens
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                All-Access Pass / Mo
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Visual with Real Trainer David Photo */}
        <div style={{ position: 'relative' }}>
          {/* Glowing backlight */}
          <div style={{
            position: 'absolute',
            inset: '-15px',
            background: 'radial-gradient(circle, rgba(255, 107, 0, 0.28) 0%, transparent 70%)',
            filter: 'blur(35px)',
            zIndex: 0
          }} />

          {/* Main Photo Card */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            borderRadius: '24px',
            overflow: 'hidden',
            border: '2px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(255, 107, 0, 0.2)',
            background: '#10131d'
          }}>
            <img 
              src="/assets/david-gym.jpg" 
              alt="Trainer David in gym condition"
              style={{
                width: '100%',
                height: '520px',
                objectFit: 'cover',
                objectPosition: 'center 18%',
                display: 'block'
              }}
            />

            {/* Dark gradient overlay at bottom of photo */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(9, 10, 15, 0.95) 0%, rgba(9, 10, 15, 0.6) 45%, transparent 100%)',
              padding: '1.75rem 1.5rem 1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#fff' }}>
                    David
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-orange)', fontWeight: 600 }}>
                    Certified Personal Trainer & Sports Conditioning Coach
                  </div>
                </div>

                <div style={{
                  background: 'rgba(0, 229, 153, 0.18)',
                  border: '1px solid rgba(0, 229, 153, 0.4)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#00e599',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                  <CheckCircle2 size={15} />
                  <span>Accepting Clients</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Feature Card 1: Physiotherapy & Biomechanics */}
          <div style={{
            position: 'absolute',
            top: '8%',
            left: '-25px',
            zIndex: 2,
            background: 'rgba(14, 18, 27, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)'
          }} className="hero-floating-card">
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 107, 0, 0.2)',
              color: 'var(--accent-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                Biomechanics First
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Target muscles, protect joints
              </div>
            </div>
          </div>

          {/* Floating Feature Card 2: Token Pay-Per-View */}
          <div style={{
            position: 'absolute',
            bottom: '18%',
            right: '-25px',
            zIndex: 2,
            background: 'rgba(14, 18, 27, 0.92)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            padding: '0.85rem 1.15rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)'
          }} className="hero-floating-card">
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Coins size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                1 Token / Video
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Or 99 tokens/mo all-access
              </div>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 960px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .hero-floating-card {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
