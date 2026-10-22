import React, { useState, useEffect } from 'react';
import { X, Google, Check, Sparkles, Lock, Mail, ArrowRight, User } from './Icons';
import { signInWithGoogle } from '../firebase';
import { authenticateWithBackupPassword, registerOrUpdateGoogleUser, getRegisteredUsers } from '../data/adminStore';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  // Firebase Google sign-in state
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

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
      setGoogleError('');
    }
  }, [isOpen]);

  // Firebase Google Sign-In (identity verified by Firebase Auth)
  const handleFirebaseGoogle = async () => {
    setGoogleError('');
    setGoogleLoading(true);
    const { user, error } = await signInWithGoogle();
    setGoogleLoading(false);

    if (error || !user) {
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        setGoogleError('Google sign-in failed. Please try again, or use the Password Backup option.');
      }
      return;
    }

    handleGoogleProfileReceived({
      id: user.uid,
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      givenName: user.displayName?.split(' ')[0],
      picture: user.photoURL || '',
      provider: 'firebase'
    });
  };

  // When Google profile is received, ask for Email + Secondary Backup Password
  const handleGoogleProfileReceived = (profile) => {
    setPendingGoogleProfile(profile);
    setBackupEmail(profile.email);

    // Check if user already has a backup password in database
    const users = getRegisteredUsers();
    const existing = users.find(u => u.email.toLowerCase() === profile.email.toLowerCase());
    if (existing && existing.backupPassword) {
      // User already has backup password set up: complete login immediately with their stored role
      const updatedUser = registerOrUpdateGoogleUser(profile, '');
      onLoginSuccess({ ...(updatedUser || { ...profile, role: 'supporter' }), provider: profile.provider });
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

    // Save to user account in database with backup password (role is never chosen by the user).
    // Email stays the one verified by Google.
    const profileToSave = {
      ...pendingGoogleProfile,
    };

    const saved = registerOrUpdateGoogleUser(profileToSave, backupPassword);
    onLoginSuccess({ ...(saved || profileToSave), provider: profileToSave.provider });
    onClose();
  };

  // Skip backup password setup (optional fallback)
  const handleSkipBackupPassword = () => {
    const profileToSave = {
      ...pendingGoogleProfile,
    };
    const saved = registerOrUpdateGoogleUser(profileToSave, '');
    onLoginSuccess({ ...(saved || profileToSave), provider: profileToSave.provider });
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
              marginBottom: '1rem',
              width: '100%'
            }}>
              <button
                type="button"
                onClick={handleFirebaseGoogle}
                disabled={googleLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  width: '100%',
                  maxWidth: '320px',
                  minHeight: '44px',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '999px',
                  border: '1px solid var(--border-subtle)',
                  background: '#131314',
                  color: '#fff',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  cursor: googleLoading ? 'wait' : 'pointer',
                  opacity: googleLoading ? 0.7 : 1
                }}
              >
                <Google size={18} />
                {googleLoading ? 'Signing in…' : 'Continue with Google'}
              </button>

              {googleError && (
                <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#f87171', textAlign: 'center' }}>
                  {googleError}
                </div>
              )}
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
                readOnly
                placeholder="you@gmail.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#0d111c',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  cursor: 'not-allowed'
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
