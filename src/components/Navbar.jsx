import React, { useState } from 'react';
import { Dumbbell, Coins, Sparkles, Menu, X, Google, User, LogOut, ShieldCheck } from './Icons';
import { isUserAdmin, isUserSuperAdmin, FIREBASE_SUPERADMIN_EMAIL } from '../data/adminStore';

export default function Navbar({ 
  user, 
  onOpenAuth, 
  onLogout, 
  onOpenAdmin,
  tokens, 
  onOpenTokenStore, 
  onOpenConsultation 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const isSuperAdmin = user ? isUserSuperAdmin(user.email) : false;
  const userRole = user?.role || (isSuperAdmin ? 'superadmin' : (isUserAdmin(user?.email) ? 'admin' : 'supporter'));
  const isAdmin = isSuperAdmin || userRole !== 'supporter';

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
        gap: '0.75rem'
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

        {/* Desktop Navigation */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.6rem'
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
        </nav>

        {/* Action Buttons & Auth / Token Tracker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>

          {/* Token Counter Button - only visible once logged in */}
          {user && (
            <button 
              onClick={onOpenTokenStore}
              className="btn-token"
              title="Click to view & recharge FitTokens"
              id="navbar-token-btn"
              style={{ padding: '0.4rem 0.8rem' }}
            >
              <Coins size={15} />
              <span>{tokens}</span>
              <span style={{
                background: 'rgba(0,0,0,0.25)',
                padding: '2px 5px',
                borderRadius: '5px',
                fontSize: '0.7rem'
              }}>+</span>
            </button>
          )}

          {/* Google Auth Status / User Profile */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0.3rem 0.65rem 0.3rem 0.35rem',
                  borderRadius: 'var(--radius-full)',
                  color: '#fff',
                  cursor: 'pointer'
                }}
                id="user-profile-btn"
                title={user.email}
              >
                {user.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--accent-orange)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 800
                  }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span style={{ fontSize: '0.82rem', fontWeight: 600, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.givenName || user.name?.split(' ')[0] || 'User'}
                </span>
                <span 
                  className={
                    isSuperAdmin ? "badge badge-red" :
                    userRole === 'doctor' ? "badge badge-cyan" :
                    userRole === 'accountant' ? "badge badge-purple" :
                    (userRole === 'admin' || userRole === 'trainer') ? "badge badge-orange" :
                    "badge badge-lime"
                  } 
                  style={{ fontSize: '0.62rem', padding: '1px 6px', fontWeight: 800 }}
                >
                  {isSuperAdmin ? 'SuperAdmin' : (userRole.charAt(0).toUpperCase() + userRole.slice(1))}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    width: '230px',
                    background: '#121622',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '14px',
                    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.7)',
                    padding: '0.85rem',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </div>
                    <div style={{ marginTop: '4px' }}>
                      <span 
                        className={
                          isSuperAdmin ? "badge badge-red" :
                          userRole === 'doctor' ? "badge badge-cyan" :
                          userRole === 'accountant' ? "badge badge-purple" :
                          (userRole === 'admin' || userRole === 'trainer') ? "badge badge-orange" :
                          "badge badge-lime"
                        } 
                        style={{ fontSize: '0.66rem', fontWeight: 700 }}
                      >
                        {isSuperAdmin ? '🔥 Firebase SuperAdmin' :
                         userRole === 'trainer' ? '🏋️ Coach / Trainer' :
                         userRole === 'doctor' ? '🩺 Medical / Rehab Doctor' :
                         userRole === 'accountant' ? '💼 Financial Auditor' :
                         userRole === 'admin' ? '👑 System Administrator' :
                         '⭐ Registered Supporter'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Balance: <strong style={{ color: '#f59e0b' }}>{tokens} Tokens</strong>
                  </div>

                  {/* Open Admin / Supporter Portal Link in Dropdown */}
                  <button
                    onClick={() => {
                      onOpenAdmin();
                      setUserDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: isSuperAdmin ? 'rgba(239, 68, 68, 0.15)' : isAdmin ? 'rgba(255, 107, 0, 0.12)' : 'rgba(0, 229, 153, 0.12)',
                      border: isSuperAdmin ? '1px solid rgba(239, 68, 68, 0.4)' : isAdmin ? '1px solid rgba(255, 107, 0, 0.3)' : '1px solid rgba(0, 229, 153, 0.3)',
                      color: isSuperAdmin ? '#ff6b6b' : isAdmin ? '#ff9e40' : 'var(--accent-lime)',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginTop: '0.2rem',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    <ShieldCheck size={14} color={isSuperAdmin ? "#ff6b6b" : isAdmin ? "#ff9e40" : "var(--accent-lime)"} />
                    <span>{isSuperAdmin ? '🔥 SuperAdmin Console' : (isAdmin ? 'Admin Management Hub' : 'Supporter Portal')}</span>
                  </button>

                  <button
                    onClick={() => {
                      onLogout();
                      setUserDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      marginTop: '0.1rem',
                      width: '100%',
                      cursor: 'pointer'
                    }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-secondary"
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap'
              }}
              id="google-signin-nav-btn"
            >
              <Google size={15} />
              <span>Sign In</span>
            </button>
          )}

          {/* Dedicated SuperAdmin Button for Firebase SuperAdmin */}
          {isSuperAdmin && (
            <button
              onClick={() => onOpenAdmin('users')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                whiteSpace: 'nowrap'
              }}
              id="navbar-superadmin-btn"
              title="Open Firebase SuperAdmin Master Console"
            >
              🔥 <span>SuperAdmin</span>
            </button>
          )}

          {/* Book Consultation */}
          <button 
            onClick={onOpenConsultation}
            className="btn-primary"
            style={{ padding: '0.48rem 0.95rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
            id="navbar-book-btn"
          >
            <Sparkles size={14} />
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
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {user.picture && <img src={user.picture} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />}
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
              </div>
              <button 
                onClick={() => { onLogout(); setMobileMenuOpen(false); }}
                style={{ background: 'none', color: '#f87171', fontSize: '0.8rem', fontWeight: 600 }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => { onOpenAuth(); setMobileMenuOpen(false); }}
              className="btn-secondary"
              style={{ justifyContent: 'center' }}
            >
              <Google size={16} /> Sign In with Google
            </button>
          )}

          <a href="#workouts" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600 }}>
            Workouts
          </a>
          <a href="#services" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600 }}>
            Services
          </a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: 600 }}>
            About
          </a>

          {/* Portal link in mobile drawer - available once logged in */}
          {user && (
            <button
              onClick={() => { onOpenAdmin(isSuperAdmin ? 'users' : 'tokens'); setMobileMenuOpen(false); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.6rem',
                borderRadius: '8px',
                background: isSuperAdmin ? 'rgba(239, 68, 68, 0.2)' : isAdmin ? 'rgba(255, 107, 0, 0.15)' : 'rgba(0, 229, 153, 0.15)',
                border: isSuperAdmin ? '1px solid rgba(239, 68, 68, 0.5)' : isAdmin ? '1px solid rgba(255, 107, 0, 0.4)' : '1px solid rgba(0, 229, 153, 0.4)',
                color: isSuperAdmin ? '#ff6b6b' : isAdmin ? '#ff9e40' : 'var(--accent-lime)',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              <ShieldCheck size={16} color={isSuperAdmin ? "#ff6b6b" : isAdmin ? "#ff9e40" : "var(--accent-lime)"} />
              <span>{isSuperAdmin ? '🔥 SuperAdmin Console' : isAdmin ? 'Admin Management Hub' : 'Supporter Portal'}</span>
            </button>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            {user && (
              <button onClick={() => { onOpenTokenStore(); setMobileMenuOpen(false); }} className="btn-token" style={{ flex: 1, justifyContent: 'center' }}>
                <Coins size={16} /> Recharge ({tokens})
              </button>
            )}
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
