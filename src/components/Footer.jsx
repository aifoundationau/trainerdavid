import React from 'react';
import { Dumbbell, ShieldCheck, Heart, Mail, Phone, ExternalLink } from './Icons';

export default function Footer({ onOpenTokenStore, onOpenConsultation }) {
  return (
    <footer style={{
      background: '#06070a',
      borderTop: '1px solid var(--border-subtle)',
      padding: '4.5rem 0 2.5rem',
      position: 'relative'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '3rem',
          marginBottom: '3.5rem'
        }}>
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff6b00 0%, #ff8a00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Dumbbell size={20} />
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800 }}>
                TRAINER <span style={{ color: 'var(--accent-orange)' }}>DAVID</span>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Premier online personal training, sports conditioning, and physiotherapy rehabilitation. Master 31+ lifts with injury-free biomechanics.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={16} color="var(--accent-lime)" />
              <span>Certified Trainer & Biomechanics Coach</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
              Workout Categories
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <li><a href="#workouts" style={{ transition: 'color 0.2s' }}>Chest & Shoulders (8 Videos)</a></li>
              <li><a href="#workouts">Back & Posture (6 Videos)</a></li>
              <li><a href="#workouts">Arms & Triceps (5 Videos)</a></li>
              <li><a href="#workouts">Legs & Glutes (8 Videos)</a></li>
              <li><a href="#workouts">Core & Abs (4 Videos)</a></li>
            </ul>
          </div>

          {/* Coaching & Offerings */}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
              Services & Tokens
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <li><button onClick={() => onOpenConsultation("1-on-1 Online Personal Training")} style={{ background: 'none', color: 'inherit', textAlign: 'left', fontSize: 'inherit' }}>1-on-1 Personal Training</button></li>
              <li><button onClick={() => onOpenConsultation("Custom Nutrition & Macro Blueprint")} style={{ background: 'none', color: 'inherit', textAlign: 'left', fontSize: 'inherit' }}>Custom Nutrition Plans</button></li>
              <li><button onClick={() => onOpenConsultation("Physiotherapy & Rehab Assessment")} style={{ background: 'none', color: 'inherit', textAlign: 'left', fontSize: 'inherit' }}>Physiotherapy & Rehab</button></li>
              <li><button onClick={() => onOpenConsultation("Sports Performance Coaching")} style={{ background: 'none', color: 'inherit', textAlign: 'left', fontSize: 'inherit' }}>Sports Performance</button></li>
              <li><button onClick={onOpenTokenStore} style={{ background: 'none', color: '#f59e0b', fontWeight: 700, textAlign: 'left', fontSize: 'inherit' }}>Recharge FitTokens 💎</button></li>
            </ul>
          </div>

          {/* Compliance & Regulatory Notice */}
          <div>
            <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
              Integrity & Privacy
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.85rem' }}>
              Compliant with the Australian Privacy Principles (Privacy Act 1988 Cth) & international standards. Health notes and intake data are treated with strict medical confidentiality.
            </p>
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.65rem',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)'
            }}>
              🔒 Secure client intake & confidential health records management.
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.82rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © {new Date().getFullYear()} Trainer David. All rights reserved. Developed with precision biomechanics.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>FitTokens & Access</span>
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
