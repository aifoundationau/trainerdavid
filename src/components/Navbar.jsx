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
  onOpenConsultation,
  onOpenAiChat,
  onOpenTrainerApplication,
  onGoHome 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const isSuperAdmin = user ? isUserSuperAdmin(user.email) : false;
  const userRole = user?.role || (isSuperAdmin ? 'superadmin' : (isUserAdmin(user?.email) ? 'admin' : 'supporter'));
  const isMainAdmin = userRole === 'mainadmin';
  const isAdmin = isSuperAdmin || isMainAdmin || userRole !== 'supporter';

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (onGoHome) onGoHome();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        {/* Brand Logo - Returns to home screen */}
        <a 
          href="#" 
          onClick={handleLogoClick}
          data-agent-id="navbar-brand-logo"
          data-testid="navbar-brand-logo"
          aria-label="Trainer David - Return to Home Screen"
          title="Return to Home Screen"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            flexShrink: 0, 
            textDecoration: 'none', 
            cursor: 'pointer' 
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff6b00 0%, #ff8a00 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 15px rgba(255, 107, 0, 0.35)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <Dumbbell size={22} strokeWidth={2.4} />
          </div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.2rem',
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#fff'
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
          gap: '1.4rem'
        }} className="desktop-nav">
          <a href="#workouts" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Workouts
          </a>

          <a href="#services" style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-secondary)', transition: 'color 0.2s', whiteSpace: 'nowrap' }}>
            Services
          </a>
          <button 
            onClick={onOpenAiChat}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15) 0%, rgba(255, 138, 0, 0.1) 100%)',
              border: '1px solid rgba(255, 107, 0, 0.35)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.85rem',
              color: '#ff9e40',
              fontSize: '0.82rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={14} color="#ff9e40" />
            <span>Ask AI Coach</span>
          </button>
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
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isSuperAdmin ? '#ef4444' : 'var(--accent-orange)',
                  display: user.picture ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 800
                }}>
                  {isSuperAdmin ? '🔥' : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.givenName || user.name?.split(' ')[0] || 'User'}
                  </span>
                  <span style={{ 
                    fontSize: '0.64rem', 
                    fontWeight: 700, 
                    color: isSuperAdmin ? '#ff6b6b' : 
                           userRole === 'doctor' ? '#38bdf8' : 
                           userRole === 'accountant' ? '#c084fc' : 
                           (userRole === 'admin' || userRole === 'trainer') ? '#ff9e40' : 
                           'var(--accent-lime)',
                    textTransform: 'capitalize' 
                  }}>
                    {isSuperAdmin ? 'SuperAdmin' : userRole}
                  </span>
                </div>
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

                  {/* Supporter Opt-In to Become a Trainer / Specialist */}
                  {userRole === 'supporter' && (
                    <button
                      onClick={() => {
                        if (onOpenTrainerApplication) onOpenTrainerApplication();
                        setUserDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.15) 0%, rgba(255, 138, 0, 0.1) 100%)',
                        border: '1px solid rgba(255, 107, 0, 0.35)',
                        color: '#ff9e40',
                        padding: '0.45rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        width: '100%',
                        cursor: 'pointer'
                      }}
                    >
                      <span>💼</span>
                      <span>Apply as Coach / Specialist</span>
                    </button>
                  )}

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

          <button
            onClick={() => { onOpenAiChat(); setMobileMenuOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(255, 107, 0, 0.2) 0%, rgba(255, 138, 0, 0.15) 100%)',
              border: '1px solid rgba(255, 107, 0, 0.4)',
              color: '#ff9e40',
              fontWeight: 800,
              fontSize: '0.92rem',
              cursor: 'pointer'
            }}
          >
            <Sparkles size={16} color="#ff9e40" />
            <span>Ask Coach David AI (Gemini RAG)</span>
          </button>

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

          {user && (
            <div style={{ marginTop: '0.5rem' }}>
              <button onClick={() => { onOpenTokenStore(); setMobileMenuOpen(false); }} className="btn-token" style={{ width: '100%', justifyContent: 'center' }}>
                <Coins size={16} /> Recharge ({tokens})
              </button>
            </div>
          )}
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
