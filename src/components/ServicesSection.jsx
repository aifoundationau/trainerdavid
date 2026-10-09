import React from 'react';
import { Dumbbell, Utensils, Zap, Activity, Check, ArrowRight } from './Icons';
import { servicesData } from '../data/services';

const iconMap = {
  Dumbbell: Dumbbell,
  Utensils: Utensils,
  Zap: Zap,
  Activity: Activity
};

export default function ServicesSection({ onBookService }) {
  return (
    <section id="services" style={{ padding: '4.5rem 0', position: 'relative' }}>
      <div className="container">

        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 2.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <span className="badge badge-orange">Specialized Coaching</span>
            <span className="badge badge-lime">Customized Programming</span>
          </div>
          <h2 style={{
            fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)',
            fontWeight: 800,
            marginBottom: '0.85rem',
            color: '#fff'
          }}>
            PERSONAL TRAINING, NUTRITION & PHYSIOTHERAPY
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Beyond instructional videos, get tailored support customized specifically to your physique, biomechanics, recovery needs, and lifestyle.
          </p>
        </div>

        {/* Services Cards Grid - Exactly 2 across, 2 rows */}
        <div className="services-2x2-grid">
          {servicesData.map((svc) => {
            const Icon = iconMap[svc.icon] || Dumbbell;
            return (
              <div 
                key={svc.id}
                className="glass-panel"
                style={{
                  padding: '2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative'
                }}
              >
                {/* Header row with icon & badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 107, 0, 0.4) 100%)',
                    border: '1px solid rgba(255, 107, 0, 0.4)',
                    color: 'var(--accent-orange)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={24} />
                  </div>

                  <span className="badge badge-orange" style={{ fontSize: '0.72rem' }}>
                    {svc.badge}
                  </span>
                </div>

                {/* Service Title */}
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
                  {svc.title}
                </h3>

                <div style={{ fontSize: '0.85rem', color: 'var(--accent-lime)', fontWeight: 600, marginBottom: '0.85rem' }}>
                  {svc.tagline}
                </div>

                {/* Description */}
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: '1.5rem', flexGrow: 1 }}>
                  {svc.description}
                </p>

                {/* Features list */}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '1.25rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}>
                  {svc.features.map((feat, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <Check size={15} color="var(--accent-lime)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action footer - No pricing displayed */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1.25rem',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    1-on-1 Consultation
                  </div>

                  <button
                    onClick={() => onBookService(svc.title)}
                    className="btn-primary"
                    style={{ padding: '0.55rem 1.15rem', fontSize: '0.85rem' }}
                  >
                    <span>Inquire / Book</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
