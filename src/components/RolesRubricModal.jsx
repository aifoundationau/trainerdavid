import React, { useState, useEffect } from 'react';

export const ROLES_LIST = [
  { id: 'superadmin', name: 'SuperAdmin', badge: '👑 Sovereign Master', color: '#ef4444', short: 'SuperAdmin' },
  { id: 'mainadmin', name: 'Main Admin', badge: '⚡ Executive Assistant', color: '#6366f1', short: 'Main Admin' },
  { id: 'admin', name: 'Admin', badge: '🛡️ System Operator', color: '#f59e0b', short: 'Admin' },
  { id: 'trainer', name: 'Trainer', badge: '🏋️ Coach & Creator', color: '#10b981', short: 'Trainer' },
  { id: 'doctor', name: 'Doctor', badge: '🩺 Rehab Specialist', color: '#06b6d4', short: 'Doctor' },
  { id: 'accountant', name: 'Accountant', badge: '💼 Ledgers & GST', color: '#8b5cf6', short: 'Accountant' },
  { id: 'supporter', name: 'Supporter', badge: '⭐ Community Member', color: '#94a3b8', short: 'Supporter' }
];

export const PERMISSION_CATEGORIES = [
  'All Categories',
  'Ecosystem & Sovereignty',
  'User & Credentials',
  'Videos & Content',
  'Tokens & Financials',
  'Messaging & CS Desk'
];

export const DEFAULT_PERMISSIONS_RUBRIC = [
  // 1. Ecosystem & Sovereignty
  {
    id: 'system.pricing',
    name: 'Universal Token Pricing (USD baseline & live AUD conversion)',
    category: 'Ecosystem & Sovereignty',
    description: 'Configure 1 Token pricing, baseline currency rates, and live AUD display',
    roles: { superadmin: true, mainadmin: false, admin: false, trainer: false, doctor: false, accountant: false, supporter: false },
    hardlocked: { superadmin: true }
  },
  {
    id: 'system.rubric',
    name: 'Define Roles & Permissions Rubric Matrix',
    category: 'Ecosystem & Sovereignty',
    description: 'Click dots to grant or revoke system capabilities across all roles',
    roles: { superadmin: true, mainadmin: false, admin: false, trainer: false, doctor: false, accountant: false, supporter: false },
    hardlocked: { superadmin: true }
  },
  {
    id: 'system.split_50',
    name: 'Receive Sovereign 50% Platform Share on Video Unlocks',
    category: 'Ecosystem & Sovereignty',
    description: 'Automatically receives half of all video view tokens into superadmin account',
    roles: { superadmin: true, mainadmin: false, admin: false, trainer: false, doctor: false, accountant: false, supporter: false },
    hardlocked: { superadmin: true }
  },
  {
    id: 'system.custom_claims',
    name: 'Firebase Custom Claims & Whitelist Governance',
    category: 'Ecosystem & Sovereignty',
    description: 'Authorize backend operations and token claim verification via Firebase Admin SDK',
    roles: { superadmin: true, mainadmin: false, admin: false, trainer: false, doctor: false, accountant: false, supporter: false },
    hardlocked: { superadmin: true }
  },

  // 2. User & Credentials
  {
    id: 'users.view_directory',
    name: 'View Registered Users Directory',
    category: 'User & Credentials',
    description: 'Inspect registered accounts, email addresses, and active roles',
    roles: { superadmin: true, mainadmin: true, admin: true, trainer: false, doctor: false, accountant: true, supporter: false }
  },
  {
    id: 'users.preauthorize',
    name: 'Pre-authorize Google Email Sign-up Permissions',
    category: 'User & Credentials',
    description: 'Grant role credentials to Google emails before their first sign-in',
    roles: { superadmin: true, mainadmin: false, admin: false, trainer: false, doctor: false, accountant: false, supporter: false }
  },
  {
    id: 'users.inspect_drive',
    name: 'Inspect Google Drive Credential Submissions',
    category: 'User & Credentials',
    description: 'Review qualification certificates and folders uploaded to Google Drive',
    roles: { superadmin: true, mainadmin: true, admin: true, trainer: false, doctor: false, accountant: false, supporter: false }
  },
  {
    id: 'users.assign_professionals',
    name: 'Assign & Edit Roles (Trainers, Doctors, Accountants)',
    category: 'User & Credentials',
    description: 'Promote verified applicants or update user role assignments',
    roles: { superadmin: true, mainadmin: true, admin: false, trainer: false, doctor: false, accountant: false, supporter: false }
  },
  {
    id: 'users.promote_super_main',
    name: 'Promote / Demote SuperAdmin or MainAdmin Accounts',
    category: 'User & Credentials',
    description: 'Assign or revoke top sovereign and executive assistant credentials',
    roles: { superadmin: true, mainadmin: false, admin: false, trainer: false, doctor: false, accountant: false, supporter: false },
    hardlocked: { mainadmin: false, admin: false, trainer: false, doctor: false, accountant: false, supporter: false }
  },

  // 3. Videos & Content
  {
    id: 'videos.upload',
    name: 'Upload Masterclasses & Training Routines',
    category: 'Videos & Content',
    description: 'Publish workout masterclasses, exercise breakdowns, and routines',
    roles: { superadmin: true, mainadmin: true, admin: true, trainer: true, doctor: true, accountant: false, supporter: false }
  },
  {
    id: 'videos.set_rate',
    name: 'Charge Custom Video Token Rate (1, 5, 10 tokens)',
    category: 'Videos & Content',
    description: 'Specify the token price required for community members to watch',
    roles: { superadmin: true, mainadmin: false, admin: false, trainer: true, doctor: true, accountant: false, supporter: false }
  },
  {
    id: 'videos.receive_split',
    name: 'Receive 50% Video Revenue Share into Personal Account',
    category: 'Videos & Content',
    description: 'Directly earn half of the sale price whenever a user unlocks their video',
    roles: { superadmin: false, mainadmin: false, admin: false, trainer: true, doctor: true, accountant: false, supporter: false }
  },
  {
    id: 'videos.stream_paid',
    name: 'Unlock & Stream Paid Creator Masterclasses',
    category: 'Videos & Content',
    description: 'Spend tokens to unlock full video playback on creator workouts',
    roles: { superadmin: true, mainadmin: true, admin: true, trainer: true, doctor: true, accountant: true, supporter: true }
  },
  {
    id: 'videos.free_library',
    name: 'Access Free Public Workout Library',
    category: 'Videos & Content',
    description: 'Stream all open community workout programs without token deduction',
    roles: { superadmin: true, mainadmin: true, admin: true, trainer: true, doctor: true, accountant: true, supporter: true }
  },

  // 4. Tokens & Financials
  {
    id: 'tokens.buy_stripe',
    name: 'Purchase FitTokens Securely via Stripe',
    category: 'Tokens & Financials',
    description: 'Purchase tokens by card with immediate balance crediting',
    roles: { superadmin: true, mainadmin: true, admin: true, trainer: true, doctor: true, accountant: true, supporter: true }
  },
  {
    id: 'tokens.manual_adjust',
    name: 'Manually Adjust User Token Balances (Sandbox & Ledger)',
    category: 'Tokens & Financials',
    description: 'Directly credit or debit tokens from any account via admin console',
    roles: { superadmin: true, mainadmin: false, admin: false, trainer: false, doctor: false, accountant: false, supporter: false }
  },
  {
    id: 'tokens.audit_ledger',
    name: 'Audit Universal Token Transaction Ledgers',
    category: 'Tokens & Financials',
    description: 'View full audit trail of checkouts, spends, transfers, and splits',
    roles: { superadmin: true, mainadmin: true, admin: false, trainer: false, doctor: false, accountant: true, supporter: false }
  },
  {
    id: 'tokens.export_tax',
    name: 'Export Financial Reports & GST Tax Statements',
    category: 'Tokens & Financials',
    description: 'Export transaction summaries for Australian GST and accounting ledgers',
    roles: { superadmin: true, mainadmin: false, admin: false, trainer: false, doctor: false, accountant: true, supporter: false }
  },

  // 5. Messaging & CS Desk
  {
    id: 'comm.opt_in_application',
    name: 'Opt-in & Submit Professional Credentials via Google Drive',
    category: 'Messaging & CS Desk',
    description: 'Apply for Trainer, Doctor, or Specialist status with credential verification',
    roles: { superadmin: false, mainadmin: false, admin: false, trainer: false, doctor: false, accountant: false, supporter: true }
  },
  {
    id: 'comm.client_messaging',
    name: 'Direct Messaging with Enrolled Clients & Patients',
    category: 'Messaging & CS Desk',
    description: 'Communicate with trainees regarding workout plans and clinical advice',
    roles: { superadmin: true, mainadmin: true, admin: true, trainer: true, doctor: true, accountant: false, supporter: false }
  },
  {
    id: 'comm.priority_announcements',
    name: 'Unlimited Priority System Broadcast Messaging',
    category: 'Messaging & CS Desk',
    description: 'Send high-priority system alerts and direct messages to all accounts',
    roles: { superadmin: true, mainadmin: false, admin: false, trainer: false, doctor: false, accountant: false, supporter: false }
  },
  {
    id: 'comm.contact_support',
    name: 'Message Customer Service Desk & Support',
    category: 'Messaging & CS Desk',
    description: 'Send direct support inquiries to administrators and support personnel',
    roles: { superadmin: true, mainadmin: true, admin: true, trainer: true, doctor: true, accountant: true, supporter: true }
  }
];

const STORAGE_KEY = 'trainer_david_roles_rubric_matrix';

export function hasRolePermission(roleId, permissionId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const matrix = raw ? JSON.parse(raw) : DEFAULT_PERMISSIONS_RUBRIC;
    const perm = matrix.find(p => p.id === permissionId);
    return perm?.roles?.[roleId] ?? false;
  } catch (_) {
    const perm = DEFAULT_PERMISSIONS_RUBRIC.find(p => p.id === permissionId);
    return perm?.roles?.[roleId] ?? false;
  }
}

export default function RolesRubricModal({ isOpen, onClose, isSuperAdmin, showToast }) {
  const [matrix, setMatrix] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_PERMISSIONS_RUBRIC;
  });

  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'cards'
  const [activeRoleTab, setActiveRoleTab] = useState('superadmin');

  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setMatrix(JSON.parse(saved));
        } else {
          setMatrix(DEFAULT_PERMISSIONS_RUBRIC);
        }
      } catch (_) {
        setMatrix(DEFAULT_PERMISSIONS_RUBRIC);
      }
      setHasPendingChanges(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle dot handler: ONLY SuperAdmin can toggle dots
  const handleToggleDot = (permissionId, roleId) => {
    if (!isSuperAdmin) {
      showToast?.('Access Denied: Only SuperAdmin can define permissions in this rubric.');
      return;
    }

    const perm = matrix.find(p => p.id === permissionId);
    if (!perm) return;

    // Check if hardlocked
    if (perm.hardlocked && perm.hardlocked[roleId] !== undefined) {
      const lockedVal = perm.hardlocked[roleId];
      if (lockedVal === true && perm.roles[roleId] === true) {
        showToast?.(`This dot is sovereign and locked: "${perm.name}" is permanent for ${roleId.toUpperCase()}.`);
        return;
      }
      if (lockedVal === false && perm.roles[roleId] === false) {
        showToast?.(`This dot is sovereign and restricted: "${perm.name}" cannot be granted to ${roleId.toUpperCase()}.`);
        return;
      }
    }

    setMatrix(prev => prev.map(item => {
      if (item.id === permissionId) {
        const current = item.roles?.[roleId] ?? false;
        return {
          ...item,
          roles: {
            ...item.roles,
            [roleId]: !current
          }
        };
      }
      return item;
    }));
    setHasPendingChanges(true);
  };

  const handleSaveRubric = () => {
    if (!isSuperAdmin) {
      showToast?.('Access Denied: Only SuperAdmin can save rubric definitions.');
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(matrix));
      window.dispatchEvent(new CustomEvent('rolesRubricUpdated', { detail: matrix }));
      setHasPendingChanges(false);
      showToast?.('⚡ Roles & Permissions Rubric saved successfully by SuperAdmin!');
    } catch (e) {
      showToast?.('Failed to save rubric: ' + (e.message || 'Storage error'));
    }
  };

  const handleResetDefaults = () => {
    if (!isSuperAdmin) {
      showToast?.('Access Denied: Only SuperAdmin can reset the rubric.');
      return;
    }
    setMatrix(DEFAULT_PERMISSIONS_RUBRIC);
    setHasPendingChanges(true);
    showToast?.('Reset all dots to Sovereign Platform Defaults. Click "Save Rubric" to persist.');
  };

  // Filter permissions by category and search term
  const filteredPermissions = matrix.filter(p => {
    const matchesCategory = selectedCategory === 'All Categories' || p.category === selectedCategory;
    const matchesSearch = !searchTerm.trim() || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate statistics (number of active dots per role)
  const roleDotCounts = ROLES_LIST.reduce((acc, role) => {
    acc[role.id] = matrix.reduce((count, p) => count + (p.roles?.[role.id] ? 1 : 0), 0);
    return acc;
  }, {});

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="roles-rubric-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(5, 7, 12, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        data-agent-id="roles-rubric-modal-container"
        data-testid="roles-rubric-modal-container"
        style={{
          background: '#0a0d16',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '1240px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.15)',
          overflow: 'hidden',
          color: '#fff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'linear-gradient(180deg, rgba(99, 102, 241, 0.08) 0%, transparent 100%)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.4rem' }}>📋</span>
              <h2 id="roles-rubric-title" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                Roles & Permissions Rubric
              </h2>
              <span style={{
                background: isSuperAdmin ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                letterSpacing: '0.04em'
              }}>
                {isSuperAdmin ? '⚡ SUPERADMIN DEFINED' : '🔒 READ ONLY (SUPERADMIN)'}
              </span>
            </div>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
              Permissions are defined by clicking the dots for each role. Permissions are not written in.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  data-agent-id="reset-rubric-btn"
                  data-testid="reset-rubric-btn"
                  onClick={handleResetDefaults}
                  style={{
                    padding: '0.5rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--text-secondary)',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
                >
                  ↺ Reset Defaults
                </button>

                <button
                  type="button"
                  data-agent-id="save-rubric-btn"
                  data-testid="save-rubric-btn"
                  onClick={handleSaveRubric}
                  disabled={!hasPendingChanges}
                  style={{
                    padding: '0.5rem 1.1rem',
                    background: hasPendingChanges 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid ' + (hasPendingChanges ? '#10b981' : 'rgba(255, 255, 255, 0.15)'),
                    color: hasPendingChanges ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: hasPendingChanges ? 'pointer' : 'not-allowed',
                    boxShadow: hasPendingChanges ? '0 0 15px rgba(16, 185, 129, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>💾</span>
                  <span>{hasPendingChanges ? 'Save Changes' : 'Saved'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              data-agent-id="close-rubric-modal-btn"
              data-testid="close-rubric-modal-btn"
              onClick={onClose}
              aria-label="Close Rubric Modal"
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'; e.currentTarget.style.borderColor = '#ef4444'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Roles Quick-Stats & Legend Bar */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: '#070910',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Roles dots tally */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Roles:
            </span>
            {ROLES_LIST.map(role => (
              <div 
                key={role.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${role.color}35`,
                  fontSize: '0.75rem'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: role.color,
                  boxShadow: `0 0 6px ${role.color}`
                }} />
                <span style={{ fontWeight: 700, color: '#fff' }}>{role.short}</span>
                <span style={{
                  fontSize: '0.68rem',
                  color: role.color,
                  fontWeight: 800,
                  background: `${role.color}15`,
                  padding: '0.05rem 0.35rem',
                  borderRadius: '4px'
                }}>
                  {roleDotCounts[role.id]}/{matrix.length}
                </span>
              </div>
            ))}
          </div>

          {/* Dots Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                border: '2px solid #10b981',
                background: 'radial-gradient(circle, #10b981 40%, transparent 45%)',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)',
                display: 'inline-block'
              }} />
              <span><strong>Active Dot</strong> (Granted)</span>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.25)',
                background: 'rgba(255, 255, 255, 0.03)',
                display: 'inline-block'
              }} />
              <span><strong>Hollow Dot</strong> (Denied)</span>
            </div>

            {isSuperAdmin && (
              <span style={{ color: '#f87171', fontWeight: 600 }}>
                💡 Click any dot to toggle
              </span>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{
          padding: '0.75rem 1.5rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {PERMISSION_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.76rem',
                  fontWeight: selectedCategory === cat ? 700 : 500,
                  borderRadius: '20px',
                  background: selectedCategory === cat ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid ' + (selectedCategory === cat ? '#6366f1' : 'rgba(255, 255, 255, 0.1)'),
                  color: selectedCategory === cat ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box & View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search permissions..."
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                borderRadius: '8px',
                background: '#0d111c',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                width: '180px'
              }}
            />

            <div style={{ display: 'inline-flex', borderRadius: '8px', background: '#0d111c', padding: '2px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: viewMode === 'matrix' ? 700 : 500,
                  background: viewMode === 'matrix' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: viewMode === 'matrix' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                ⊞ Matrix
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                style={{
                  padding: '0.3rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: viewMode === 'cards' ? 700 : 500,
                  background: viewMode === 'cards' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                  color: viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                📑 Role Tabs
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '1.25rem 1.5rem',
          minHeight: '380px'
        }}>
          {viewMode === 'matrix' ? (
            /* Matrix Grid View */
            <div style={{ minWidth: '860px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    {/* Permission Column Header */}
                    <th style={{
                      textAlign: 'left',
                      padding: '0.85rem 1rem',
                      background: '#0d111c',
                      color: 'var(--text-secondary)',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                      width: '38%'
                    }}>
                      Permission Capability ({filteredPermissions.length})
                    </th>

                    {/* Role Column Headers */}
                    {ROLES_LIST.map(role => (
                      <th 
                        key={role.id}
                        style={{
                          textAlign: 'center',
                          padding: '0.85rem 0.5rem',
                          background: '#0d111c',
                          borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
                          position: 'sticky',
                          top: 0,
                          zIndex: 2,
                          width: `${62 / ROLES_LIST.length}%`
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: role.color }}>
                            {role.name}
                          </span>
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '4px',
                            background: `${role.color}18`,
                            color: role.color
                          }}>
                            {roleDotCounts[role.id]} dots
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredPermissions.map((perm, idx) => (
                    <tr 
                      key={perm.id}
                      style={{
                        background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255, 255, 255, 0.015)' : 'transparent'; }}
                    >
                      {/* Permission Title & Description */}
                      <td style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        verticalAlign: 'middle'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-secondary)'
                          }}>
                            {perm.category}
                          </span>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff' }}>
                            {perm.name}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                          {perm.description}
                        </div>
                      </td>

                      {/* Clickable Dots for each Role */}
                      {ROLES_LIST.map(role => {
                        const isGranted = !!perm.roles?.[role.id];
                        const isHardlocked = perm.hardlocked && perm.hardlocked[role.id] !== undefined;

                        return (
                          <td 
                            key={role.id}
                            style={{
                              textAlign: 'center',
                              padding: '0.75rem 0.5rem',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                              verticalAlign: 'middle'
                            }}
                          >
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isGranted}
                              aria-label={`${isGranted ? 'Revoke' : 'Grant'} ${perm.name} for ${role.name}`}
                              data-agent-id={`rubric-dot-${perm.id}-${role.id}`}
                              data-testid={`rubric-dot-${perm.id}-${role.id}`}
                              disabled={!isSuperAdmin}
                              onClick={() => handleToggleDot(perm.id, role.id)}
                              title={
                                isSuperAdmin 
                                  ? `Click dot to ${isGranted ? 'REVOKE' : 'GRANT'} "${perm.name}" for ${role.name}`
                                  : `Defined by SuperAdmin: ${perm.name} is ${isGranted ? 'GRANTED' : 'DENIED'} for ${role.name}`
                              }
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                border: isGranted ? `2px solid ${role.color}` : '2px solid rgba(255, 255, 255, 0.2)',
                                background: isGranted 
                                  ? `radial-gradient(circle, ${role.color} 38%, transparent 42%)` 
                                  : 'rgba(255, 255, 255, 0.03)',
                                boxShadow: isGranted ? `0 0 10px ${role.color}55` : 'none',
                                cursor: isSuperAdmin ? (isHardlocked ? 'not-allowed' : 'pointer') : 'default',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                                padding: 0,
                                opacity: !isSuperAdmin && !isGranted ? 0.4 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (isSuperAdmin && !isHardlocked) {
                                  e.currentTarget.style.transform = 'scale(1.22)';
                                  e.currentTarget.style.borderColor = role.color;
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (isSuperAdmin) {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.borderColor = isGranted ? role.color : 'rgba(255, 255, 255, 0.2)';
                                }
                              }}
                            >
                              {/* Inner illuminated dot */}
                              <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: isGranted ? role.color : 'transparent',
                                boxShadow: isGranted ? `0 0 6px ${role.color}` : 'none',
                                transition: 'all 0.18s ease'
                              }} />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Role Tabs View (Responsive / focused inspection) */
            <div>
              {/* Role selector tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {ROLES_LIST.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setActiveRoleTab(role.id)}
                    style={{
                      padding: '0.5rem 0.9rem',
                      borderRadius: '8px',
                      background: activeRoleTab === role.id ? `${role.color}25` : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${activeRoleTab === role.id ? role.color : 'rgba(255, 255, 255, 0.1)'}`,
                      color: activeRoleTab === role.id ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: role.color }} />
                    <span>{role.name}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      color: role.color
                    }}>
                      {roleDotCounts[role.id]}/{matrix.length}
                    </span>
                  </button>
                ))}
              </div>

              {/* List of Permissions with Dots for the active role */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '0.85rem' }}>
                {filteredPermissions.map(perm => {
                  const role = ROLES_LIST.find(r => r.id === activeRoleTab);
                  const isGranted = !!perm.roles?.[activeRoleTab];
                  const isHardlocked = perm.hardlocked && perm.hardlocked[activeRoleTab] !== undefined;

                  return (
                    <div
                      key={perm.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: `1px solid ${isGranted ? `${role.color}40` : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '10px',
                        padding: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.85rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '0.08rem 0.35rem',
                            borderRadius: '3px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-secondary)'
                          }}>
                            {perm.category}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                          {perm.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          {perm.description}
                        </div>
                      </div>

                      {/* Clickable Dot */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isGranted}
                        aria-label={`${isGranted ? 'Revoke' : 'Grant'} ${perm.name} for ${role.name}`}
                        disabled={!isSuperAdmin}
                        onClick={() => handleToggleDot(perm.id, activeRoleTab)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: isGranted ? `2px solid ${role.color}` : '2px solid rgba(255, 255, 255, 0.2)',
                          background: isGranted 
                            ? `radial-gradient(circle, ${role.color} 38%, transparent 42%)` 
                            : 'rgba(255, 255, 255, 0.03)',
                          boxShadow: isGranted ? `0 0 12px ${role.color}55` : 'none',
                          cursor: isSuperAdmin ? (isHardlocked ? 'not-allowed' : 'pointer') : 'default',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: 0,
                          flexShrink: 0
                        }}
                      >
                        <span style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: isGranted ? role.color : 'transparent',
                          boxShadow: isGranted ? `0 0 8px ${role.color}` : 'none'
                        }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div style={{
          padding: '0.9rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#070910',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            🔒 Platform Governance: Only the Firebase SuperAdmin can define and persist the permissions matrix.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {hasPendingChanges && (
              <span style={{ color: '#10b981', fontWeight: 700 }}>
                ● Unsaved dot changes
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
