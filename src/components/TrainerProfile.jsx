import React from 'react';
import { Award, ShieldCheck, Dumbbell, Sparkles, CheckCircle, Target, ArrowRight } from './Icons';

export default function TrainerProfile({ onOpenConsultation }) {
  return (
    <section id="about" style={{ padding: '5rem 0', position: 'relative' }}>
      <div className="container">
        <div style={{
          background: 'linear-gradient(135deg, rgba(17, 21, 31, 0.9) 0%, rgba(10, 12, 18, 0.95) 100%)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '28px',
          padding: 'clamp(2rem, 5vw, 3.5rem)',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle background glow */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255, 107, 0, 0.12) 0%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none'
          }} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: '0.9fr 1.1fr',
            gap: '3.5rem',
            alignItems: 'center'
          }} className="profile-grid">

            {/* Left Column: Photo Showcase */}
            <div>
              <div style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '1.2fr 0.8fr',
                gap: '1.25rem',
                alignItems: 'end'
              }}>
                {/* Gym Shot */}
                <div style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '2px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
                }}>
                  <img 
                    src="/assets/david-gym.jpg" 
                    alt="Trainer David Gym Training"
                    style={{ width: '100%', height: '360px', objectFit: 'cover' }}
                  />
                </div>

                {/* Portrait Shot */}
                <div style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '2px solid rgba(255, 107, 0, 0.3)',
                  boxShadow: '0 20px 40px rgba(255, 107, 0, 0.15)',
                  marginBottom: '1.5rem'
                }}>
                  <img 
                    src="/assets/david-portrait.jpg" 
                    alt="Trainer David Portrait"
                    style={{ width: '100%', height: '240px', objectFit: 'cover' }}
                  />
                  <div style={{
                    background: '#121622',
                    padding: '0.75rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Trainer David</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-orange)' }}>Head Coach</div>
                  </div>
                </div>
              </div>

              {/* Core Philosophy Banner */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1rem 1.25rem',
                background: 'rgba(255, 107, 0, 0.08)',
                border: '1px solid rgba(255, 107, 0, 0.25)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem'
              }}>
                <Award size={28} color="var(--accent-orange)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#fff' }}>"No ego lifting.</strong> Master the anatomy, protect the joints, and stimulate the exact muscle fibers for lifelong strength."
                </div>
              </div>
            </div>

            {/* Right Column: Bio & Credentials */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <span className="badge badge-orange">Meet Your Coach</span>
                <span className="badge badge-lime">Evidence-Based Training</span>
              </div>

              <h2 style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.5rem)',
                fontWeight: 800,
                color: '#fff',
                marginBottom: '1.25rem',
                lineHeight: 1.15
              }}>
                PERSONALIZED COACHING THAT GETS UNBREAKABLE RESULTS
              </h2>

              <p style={{ fontSize: '1.02rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                Welcome! I created <strong style={{ color: '#fff' }}>Trainer David</strong> to give people access to elite personal training and physiotherapy-informed exercise instruction without confusion, dangerous bro-science, or overpriced gym memberships.
              </p>

              <p style={{ fontSize: '0.96rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
                Whether you are stepping into a gym for the first time, coming back from a rotator cuff or knee injury, or seeking athletic conditioning for sports, my step-by-step video postcards and 1-on-1 coaching give you the exact biomechanical blueprint to succeed.
              </p>

              {/* 4 Pillars Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.25rem',
                marginBottom: '2rem'
              }} className="pillars-grid">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <CheckCircle size={20} color="var(--accent-orange)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>Biomechanical Accuracy</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target muscles directly without wear on tendons.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <CheckCircle size={20} color="var(--accent-lime)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>Physiotherapy Protocols</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rehab kinetic chains and build posture durability.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <CheckCircle size={20} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>Practical Nutrition</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fuel performance with macros you can actually stick to.</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <CheckCircle size={20} color="#a855f7" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.92rem' }}>Sports Conditioning</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Speed, power, stamina, and agility for competitive play.</div>
                  </div>
                </div>
              </div>

              {/* CTA button */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <button 
                  onClick={() => onOpenConsultation("Personal Training with David")}
                  className="btn-primary"
                  style={{ padding: '0.85rem 1.75rem' }}
                >
                  <Sparkles size={18} />
                  <span>Start 1-on-1 Coaching</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .profile-grid {
            grid-template-columns: 1fr !important;
            gap: 2.5rem !important;
          }
          .pillars-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
