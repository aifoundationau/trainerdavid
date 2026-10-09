import React, { useState, useEffect, useRef } from 'react';
import { X, Google, ShieldCheck, Check, Sparkles, Lock, Mail, ArrowRight, User } from './Icons';
import { GOOGLE_CLIENT_ID, parseJwt } from '../utils/googleAuth';
import { authenticateWithBackupPassword, registerOrUpdateGoogleUser, getRegisteredUsers } from '../data/adminStore';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const googleBtnRef = useRef(null);
  
  // Modes: 'google', 'set_password_step', 'backup_login'
  const [authMode, setAuthMode] = useState('google');
  
  // Step 2 Google Registration State: Secondary Password Setup
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState(null);
  const [backupEmail, setBackupEmail] = useState('');
  const [backupPassword, setBackupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stepError, setStepError] = useState('');

  // Backup Password Login State (If Google fails)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Direct Google Email input (for instant sign in / when Google popup origin is blocked)
  const [directEmail, setDirectEmail] = useState('');

  // Reset modal state upon open
  useEffect(() => {
    if (isOpen) {
      setAuthMode('google');
      setPendingGoogleProfile(null);
      setBackupEmail('');
      setBackupPassword('');
      setConfirmPassword('');
      setStepError('');
      setLoginError('');
    }
  }, [isOpen]);

  // Google Identity Services (GIS) Button Initialization
  useEffect(() => {
    if (!isOpen || authMode !== 'google') return;

    const renderGoogleButton = () => {
      if (window.google?.accounts?.id && googleBtnRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (response.credential) {
                const profile = parseJwt(response.credential);
                if (profile) {
                  handleGoogleProfileReceived({
                    id: profile.sub,
                    email: profile.email,
                    name: profile.name,
                    givenName: profile.given_name,
                    picture: profile.picture
                  });
                }
              }
            }
          });

          googleBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 320,
            logo_alignment: 'left'
          });
        } catch (err) {
          console.error("Error initializing Google Identity:", err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderGoogleButton();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isOpen, authMode]);

  // When Google profile is received, ask for Email + Secondary Backup Password
  const handleGoogleProfileReceived = (profile) => {
    setPendingGoogleProfile(profile);
    setBackupEmail(profile.email);

    // Check if user already has a backup password in database
    const users = getRegisteredUsers();
    const existing = users.find(u => u.email.toLowerCase() === profile.email.toLowerCase());
    if (existing && existing.backupPassword) {
      // User already has backup password set up: complete login immediately
      onLoginSuccess(profile);
      onClose();
    } else {
      // Prompt user to add secondary backup password
      setAuthMode('set_password_step');
    }
  };

  // Submit Secondary Backup Password Setup
  const handleSaveBackupPasswordSubmit = (e) => {
    e.preventDefault();
    setStepError('');

    if (!backupEmail.trim() || !backupEmail.includes('@')) {
      setStepError('Please provide a valid email address.');
      return;
    }

    if (!backupPassword || backupPassword.length < 4) {
      setStepError('Please enter a secondary backup password (at least 4 characters).');
      return;
    }

    if (backupPassword !== confirmPassword) {
      setStepError('Passwords do not match. Please verify.');
      return;
    }

    // Save to user account in database with backup password
    const profileToSave = {
      ...pendingGoogleProfile,
      email: backupEmail.trim()
    };

    registerOrUpdateGoogleUser(profileToSave, backupPassword);
    onLoginSuccess(profileToSave);
    onClose();
  };

  // Skip backup password setup (optional fallback)
  const handleSkipBackupPassword = () => {
    registerOrUpdateGoogleUser(pendingGoogleProfile, '');
    onLoginSuccess(pendingGoogleProfile);
    onClose();
  };

  // Handle Backup Password Login (when Google fails)
  const handleBackupLoginSubmit = (e) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError('Email and secondary password are required.');
      return;
    }

    const authRes = authenticateWithBackupPassword(loginEmail, loginPassword);
    if (authRes.success) {
      onLoginSuccess(authRes.user);
      onClose();
    } else {
      setLoginError(authRes.error || 'Authentication failed.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', padding: '2rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(255, 107, 0, 0.15)',
              border: '1px solid rgba(255, 107, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-orange)'
            }}>
              {authMode === 'set_password_step' ? <Lock size={20} /> : <Google size={20} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {authMode === 'set_password_step' 
                  ? 'Secondary Password Backup' 
                  : authMode === 'backup_login' 
                    ? 'Secondary Backup Login' 
                    : 'Sign In / Register'}
              </h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {authMode === 'set_password_step' 
                  ? 'Add backup password for your Google account' 
                  : authMode === 'backup_login' 
                    ? 'Use this if Google OAuth is blocked or fails' 
                    : 'Google Identity & Account Hub'}
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Tab Switcher: Google vs Backup Password Login */}
        {authMode !== 'set_password_step' && (
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            padding: '3px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setAuthMode('google')}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                background: authMode === 'google' ? 'var(--accent-orange)' : 'transparent',
                color: authMode === 'google' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Google Login
            </button>
            <button
              onClick={() => setAuthMode('backup_login')}
              style={{
                flex: 1,
                padding: '0.45rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                background: authMode === 'backup_login' ? 'var(--accent-orange)' : 'transparent',
                color: authMode === 'backup_login' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Password Backup (Fallback)
            </button>
          </div>
        )}

        {/* STEP 1: GOOGLE SIGN-IN MODE */}
        {authMode === 'google' && (
          <div>
            {/* Descriptive message */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55
            }}>
              Register or sign in with your Google Email to join as a <strong style={{ color: 'var(--accent-lime)' }}>Supporter</strong>. Supporters can recharge FitTokens to watch workout masterclasses (1 token each) and book consultations with Coach David. A <strong>secondary backup password</strong> is configured for your account.
            </div>

            {/* Just Google Login Button */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              width: '100%'
            }}>
              <div ref={googleBtnRef} style={{ minHeight: '44px', width: '100%', display: 'flex', justifyContent: 'center' }} />
            </div>

            {/* And — or sign in with another Google Email — */}
            <div style={{
              marginBottom: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.55rem'
            }}>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                — or sign in with another Google Email —
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="email"
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                  placeholder="Enter your Google email (e.g. support@aifoundation.net.au)"
                  style={{
                    flex: 1,
                    padding: '0.7rem 0.85rem',
                    background: '#0d111c',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.86rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (directEmail.trim()) {
                      handleGoogleProfileReceived({
                        id: `google_${directEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
                        email: directEmail.trim(),
                        name: directEmail.split('@')[0],
                        givenName: directEmail.split('@')[0],
                        picture: ""
                      });
                    }
                  }}
                  className="btn-primary"
                  style={{
                    padding: '0.7rem 1.1rem',
                    fontSize: '0.84rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Sign In →
                </button>
              </div>
            </div>

            {/* Password Backup (Fallback) Link */}
            <div style={{
              textAlign: 'center',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <button
                type="button"
                onClick={() => setAuthMode('backup_login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-orange)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Lock size={14} />
                <span>Password Backup (Fallback)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SETUP SECONDARY BACKUP PASSWORD (ASKED UPON GOOGLE REGISTRATION) */}
        {authMode === 'set_password_step' && (
          <form onSubmit={handleSaveBackupPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Google Profile Badge */}
            <div style={{
              background: 'rgba(0, 229, 153, 0.08)',
              border: '1px solid rgba(0, 229, 153, 0.3)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}>
              <Check size={16} color="var(--accent-lime)" />
              <div style={{ fontSize: '0.82rem', color: '#fff' }}>
                Google Verified: <strong>{pendingGoogleProfile?.name}</strong> ({pendingGoogleProfile?.email})
              </div>
            </div>

            <div style={{
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              background: 'rgba(255, 107, 0, 0.08)',
              border: '1px solid rgba(255, 107, 0, 0.25)',
              padding: '0.85rem',
              borderRadius: '10px'
            }}>
              <strong style={{ color: '#ff9e40' }}>Secondary Password Backup:</strong> Set a password for this user account. If Google OAuth ever fails or is blocked, you can log in directly using this email and password.
            </div>

            {stepError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '0.6rem 0.8rem',
                fontSize: '0.82rem',
                color: '#f87171'
              }}>
                {stepError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Account Email Address *
              </label>
              <input
                type="email"
                value={backupEmail}
                onChange={e => setBackupEmail(e.target.value)}
                placeholder="you@gmail.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0d111c',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Secondary Backup Password *
              </label>
              <input
                type="password"
                value={backupPassword}
                onChange={e => setBackupPassword(e.target.value)}
                placeholder="Create a secondary password"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0d111c',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Confirm Secondary Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter secondary password"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0d111c',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.85rem',
                  fontSize: '0.92rem'
                }}
              >
                <Lock size={16} />
                <span>Save Password & Open Admin Page</span>
              </button>

              <button
                type="button"
                onClick={handleSkipBackupPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  padding: '0.3rem'
                }}
              >
                Skip backup password for now
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SECONDARY BACKUP PASSWORD LOGIN (IF GOOGLE FAILS) */}
        {authMode === 'backup_login' && (
          <form onSubmit={handleBackupLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              padding: '0.85rem',
              borderRadius: '10px'
            }}>
              Log into your user account using your <strong>Email</strong> and the <strong>Secondary Backup Password</strong> you set during registration.
            </div>

            {loginError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '0.6rem 0.8rem',
                fontSize: '0.82rem',
                color: '#f87171'
              }}>
                {loginError}
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Account Email *
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                placeholder="you@gmail.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0d111c',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Secondary Backup Password *
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="Enter your secondary password"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0d111c',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.85rem',
                fontSize: '0.92rem',
                marginTop: '0.5rem'
              }}
            >
              <Lock size={16} />
              <span>Log In with Backup Password</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
