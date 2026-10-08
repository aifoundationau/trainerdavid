import React, { useState } from 'react';
import { Dumbbell, Coins, Sparkles, Menu, X, Crown } from './Icons';

export default function Navbar({ tokens, isSubscriber, onOpenTokenStore, onOpenConsultation }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(16px)',
      backgroundColor: 'rgba(8, 9, 13, 0.9)',
      borderBottom: '1px solid var(--border-subtle)',
      transition: 'all 0.25s ease'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '72px',
        gap: '1rem'
      }}>
        {/* Brand Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff6b00 0%, #ff8a00 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 15px rgba(255, 107, 0, 0.35)'
          }}>
            <Dumbbell size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 800,
              lineHeight: 1.1
            }}>
              TRAINER <span style={{ color: 'var(--accent-orange)' }}>DAVID</span>
            </div>
            <div style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              fontWeight: 600
            }}>
              Fitness & Rehab
            </div>
          </div>
        </a>

        {/* Desktop Navigation - Concise, no overlapping words */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.75rem'
        }} className="desktop-nav">
          <a href="#workouts" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Workouts
          </a>
          <a href="#services" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Services
          </a>
          <a href="#about" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            About
          </a>
          <a href="#membership" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Membership
          </a>
        </nav>

        {/* Action Buttons & Token Tracker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {/* Subscriber Status Badge */}
          {isSubscriber && (
            <span className="badge badge-lime" style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}>
              <Crown size={13} />
              <span>All-Access</span>
            </span>
          )}

          {/* Token Counter Button */}
          <button 
            onClick={onOpenTokenStore}
            className="btn-token"
            title="Click to view & recharge FitTokens"
            id="navbar-token-btn"
            style={{ padding: '0.4rem 0.85rem' }}
          >
            <Coins size={15} />
            <span>{tokens} Tokens</span>
            <span style={{
              background: 'rgba(0,0,0,0.25)',
              padding: '2px 5px',
              borderRadius: '5px',
              fontSize: '0.7rem'
            }}>+</span>
          </button>

          {/* Book Consultation */}
          <button 
            onClick={onOpenConsultation}
            className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.84rem', whiteSpace: 'nowrap' }}
            id="navbar-book-btn"
          >
            <Sparkles size={15} />
            <span>Book Coach</span>
          </button>

          {/* Mobile hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'transparent',
              color: '#fff',
              padding: '0.4rem',
              display: 'none'
            }}
            className="mobile-toggle-btn"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#0c0e14',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <a href="#workouts" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600 }}>
            Workouts
          </a>
          <a href="#services" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600 }}>
            Services
          </a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600 }}>
            About
          </a>
          <a href="#membership" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600 }}>
            Membership
          </a>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button onClick={() => { onOpenTokenStore(); setMobileMenuOpen(false); }} className="btn-token" style={{ flex: 1, justifyContent: 'center' }}>
              <Coins size={16} /> Recharge ({tokens})
            </button>
            <button onClick={() => { onOpenConsultation(); setMobileMenuOpen(false); }} className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
              Book Coach
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 980px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}
