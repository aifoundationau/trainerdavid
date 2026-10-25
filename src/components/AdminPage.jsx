import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, 
  Coins, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Users, 
  Search, 
  Filter, 
  Google, 
  Plus, 
  Clock, 
  ShieldCheck, 
  Check, 
  Phone, 
  Mail, 
  LogOut, 
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  CreditCard,
  Lock,
  Utensils,
  Zap,
  Activity,
  ClipboardList,
  StripeIcon,
  ChevronDown,
  ChevronUp
} from './Icons';
import { 
  getRegisteredUsers, 
  adjustUserTokens, 
  getAdminPurchases,
  addAdminPurchase,
  isUserAdmin,
  isUserSuperAdmin,
  FIREBASE_SUPERADMIN_EMAIL,
  ADMIN_CREDENTIALS,
  updateUserRole,
  preauthorizeUserRole
} from '../data/adminStore';
import { listPtUsers, setUserRole } from '../services/userDirectory';
import { grantTokens, getTokenBalance } from '../services/tokenApi';
import { auth, onAuthStateChanged } from '../firebase';
import { tokenPackages } from '../data/services';
import { startStripeCheckout } from '../utils/stripeCheckout';
import AdminUploadPanel from './AdminUploadPanel';
import TokensPanel from './TokensPanel';
import AdminApplicationsPanel from './AdminApplicationsPanel';
import VideoPublishPanel from './VideoPublishPanel';
import RolesRubricModal from './RolesRubricModal';

export default function AdminPage({ 
  user, 
  tokens, 
  onAddTokens, 
  onLogout, 
  onBackToPublic, 
  initialTab = 'tokens',
  onRefreshAppState 
}) {
  const isSuperAdmin = isUserSuperAdmin(user?.email);
  const userRole = user?.role || (isSuperAdmin ? 'superadmin' : (isUserAdmin(user?.email) ? 'admin' : 'supporter'));
  const isMainAdmin = userRole === 'mainadmin';
  const isAdmin = isSuperAdmin || isMainAdmin || userRole !== 'supporter';
  // Allowed uploaders & video creators
  const canUpload = isSuperAdmin || isMainAdmin || [
    'admin', 'trainer', 'strength_coach', 'physiotherapist', 
    'nutritionist', 'doctor', 'exercise_physiologist', 'rehab_specialist', 'yoga_pilates'
  ].includes(userRole);
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'users' : isMainAdmin ? 'applications' : initialTab);
  const [uploadSubTab, setUploadSubTab] = useState('drive'); // 'drive' | 'video'
  const [users, setUsers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('All');
  const [purchaseCategoryFilter, setPurchaseCategoryFilter] = useState('All');
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Universal Token Price state (configured dynamically by SuperAdmin)
  const [tokenPriceUsd, setTokenPriceUsd] = useState(1.00);
  const [tokenPriceAud, setTokenPriceAud] = useState(1.43);

  // Token Purchase processing state on Admin Page
  const [processingPackId, setProcessingPackId] = useState(null);

  const loadData = async () => {
    const localUsers = getRegisteredUsers();
    setUsers(localUsers);
    setPurchases(getAdminPurchases());

    try {
      const balanceData = await getTokenBalance();
      if (balanceData?.priceUsd?.amount) {
        setTokenPriceUsd(balanceData.priceUsd.amount);
      }
      if (balanceData?.priceAud?.amount) {
        setTokenPriceAud(balanceData.priceAud.amount);
      } else if (balanceData?.exchangeRate?.rate && balanceData?.priceUsd?.amount) {
        setTokenPriceAud(Number((balanceData.priceUsd.amount * balanceData.exchangeRate.rate).toFixed(2)));
      }
    } catch (e) {
      // Graceful fallback to live exchange rate
      try {
        const res = await fetch('https://api.frankfurter.dev/v2/rate/USD/AUD');
        if (res.ok) {
          const fxData = await res.json();
          if (fxData?.rate) {
            setTokenPriceAud(Number((tokenPriceUsd * fxData.rate).toFixed(2)));
          }
        }
      } catch (_) {}
    }

    // SuperAdmins and admins (the roles Firestore rules allow to read all profiles) also see
    // every Trainer David (#pt) member. Local-only entries (e.g. pre-authorized emails) follow.
    if (!isSuperAdmin && userRole !== 'admin') return;
    if (!auth.currentUser) {
      // Firestore rules need a Firebase (Google) session; Password Backup logins don't have one
      showToast('Sign in with Google (not Password Backup) to load registered members from the database.');
      return;
    }
    try {
      const remoteUsers = await listPtUsers();
      const remoteEmails = new Set(remoteUsers.map(u => u.email?.toLowerCase()));
      const localByEmail = new Map(localUsers.map(u => [u.email?.toLowerCase(), u]));
      setUsers([
        ...remoteUsers.map(u => ({ ...u, hasBackupPassword: localByEmail.get(u.email?.toLowerCase())?.hasBackupPassword || false })),
        ...localUsers.filter(u => !remoteEmails.has(u.email?.toLowerCase()))
      ]);
    } catch (e) {
      console.error('Failed to load users from Firestore:', e);
      showToast('Could not load registered users from the database.');
    }
  };

  useEffect(() => {
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Re-run loadData when Firebase auth state resolves upon user sign-in
    const unsubAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        loadData();
      }
    });

    const handlePriceChange = (e) => {
      if (e.detail?.usd) setTokenPriceUsd(e.detail.usd);
      if (e.detail?.aud) setTokenPriceAud(e.detail.aud);
      else if (e.detail?.usd) setTokenPriceAud(Number((e.detail.usd * 1.43).toFixed(2)));
    };
    window.addEventListener('tokenPriceChanged', handlePriceChange);
    return () => {
      unsubAuth();
      window.removeEventListener('tokenPriceChanged', handlePriceChange);
    };
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // FitToken Recharge State (dynamic pricing set by SuperAdmin)
  const [customAmount, setCustomAmount] = useState(100);
  const [isRedirectingStripe, setIsRedirectingStripe] = useState(null);

  const handleStripeRecharge = async (packId) => {
    setIsRedirectingStripe(packId);
    try {
      await startStripeCheckout({ packageId: packId, user });
    } catch (err) {
      showToast(err.message || "Failed to start Stripe Checkout.");
      setIsRedirectingStripe(null);
    }
  };

  const handleStripeCustomRecharge = async (amt) => {
    if (!amt || amt <= 0) {
      showToast("Please enter a valid token amount.");
      return;
    }
    setIsRedirectingStripe('custom');
    try {
      await startStripeCheckout({ customAmount: amt, user });
    } catch (err) {
      showToast(err.message || "Failed to start Stripe Checkout.");
      setIsRedirectingStripe(null);
    }
  };

  // SuperAdmin sandbox credit: added to the SuperAdmin's own balance on the server
  const handleRechargeTokens = (amountToRecharge) => {
    const num = parseInt(amountToRecharge, 10);
    if (isNaN(num) || num <= 0) {
      showToast("Please enter a valid token amount (1 or more).");
      return;
    }
    setProcessingPackId(`recharge-${num}`);
    setTimeout(async () => {
      const ok = await onAddTokens(num);
      if (!ok) {
        setProcessingPackId(null);
        return;
      }

      const totalCostUsd = (num * tokenPriceUsd).toFixed(2);
      // Register purchase in Admin Store (using SuperAdmin configured token price)
      addAdminPurchase({
        clientName: user?.name || 'Admin / Client',
        clientEmail: user?.email || 'admin@gmail.com',
        itemName: `FitToken Recharge (${num} Tokens)`,
        category: 'Token Recharge',
        tokensOrCost: `$${totalCostUsd} USD (${num} Tokens)`
      });

      loadData();
      if (onRefreshAppState) onRefreshAppState();

      setProcessingPackId(null);
      showToast(`Successfully recharged ${num} FitTokens ($${totalCostUsd} USD) to your account!`);
    }, 500);
  };

  // Handle Manual Token Adjustment for Users
  const handleGrantTokens = async (userId, delta, userName) => {
    const target = users.find(u => u.id === userId);
    let updated = null;
    if (target?.source === 'firestore') {
      try {
        const { balance, email } = await grantTokens(target.uid, delta);
        updated = { ...target, email: email || target.email, tokens: balance };
      } catch (e) {
        console.error('Failed to update FitTokens:', e);
        showToast(e.message || 'Failed to update FitTokens.');
        return;
      }
    } else {
      updated = adjustUserTokens(userId, delta);
    }
    if (updated) {
      addAdminPurchase({
        clientName: userName,
        clientEmail: updated.email || 'user@gmail.com',
        itemName: delta > 0 ? `Token Grant (+${delta} Tokens)` : `Token Deduction (${delta} Tokens)`,
        category: 'Token Adjustment',
        tokensOrCost: `${delta > 0 ? `+${delta}` : delta} Tokens`
      });
      loadData();
      if (onRefreshAppState) onRefreshAppState();
      showToast(`Updated ${userName}: ${delta > 0 ? `+${delta}` : delta} tokens (New balance: ${updated.tokens})`);
    }
  };

  // SuperAdmin & MainAdmin Function: Grant Credentials to Registered Users
  const handleRoleChange = async (userId, newRole, userName) => {
    if (!isSuperAdmin && !isMainAdmin) {
      showToast("Access Denied: Only SuperAdmin or MainAdmin can assign credentials.");
      return;
    }
    if (isMainAdmin && (newRole === 'superadmin' || newRole === 'mainadmin')) {
      showToast("Access Denied: MainAdmin cannot assign SuperAdmin or MainAdmin credentials.");
      return;
    }
    const target = users.find(u => u.id === userId);
    if (isMainAdmin && (target?.role === 'superadmin' || target?.role === 'mainadmin')) {
      showToast("Access Denied: MainAdmin cannot modify SuperAdmin or MainAdmin accounts.");
      return;
    }
    if (target?.source === 'firestore') {
      try {
        await setUserRole(target.uid, newRole, user?.email, userRole);
      } catch (e) {
        console.error('Failed to update role in Firestore:', e);
        showToast(e.message || 'Failed to update user credential in the database.');
        return;
      }
      loadData();
      if (onRefreshAppState) onRefreshAppState();
      showToast(`Granted ${newRole.toUpperCase()} credentials to ${userName}!`);
      return;
    }
    const res = updateUserRole(userId, newRole);
    if (res.success) {
      loadData();
      if (onRefreshAppState) onRefreshAppState();
      showToast(`Granted ${newRole.toUpperCase()} credentials to ${userName}!`);
    } else {
      showToast(res.error || "Failed to update user credential.");
    }
  };

  // SuperAdmin Function: Pre-authorize / Grant Permission for New User Signup (Trainer, Doctor, Accountant, Admin)
  const [newAuthEmail, setNewAuthEmail] = useState('');
  const [newAuthName, setNewAuthName] = useState('');
  const [newAuthRole, setNewAuthRole] = useState('trainer');
  const [newAuthTokens, setNewAuthTokens] = useState(50);
  const [showPreAuthForm, setShowPreAuthForm] = useState(false);
  const [isPermissionsCardCollapsed, setIsPermissionsCardCollapsed] = useState(false);
  const [showRubricModal, setShowRubricModal] = useState(false);

  const handlePreauthorizeSubmit = (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      showToast("Access Denied: Only Firebase SuperAdmin can grant signup permissions.");
      return;
    }
    if (!newAuthEmail.trim() || !newAuthEmail.includes('@')) {
      showToast("Please enter a valid Google email address.");
      return;
    }
    const res = preauthorizeUserRole(newAuthEmail, newAuthName, newAuthRole, newAuthTokens);
    if (res.success) {
      loadData();
      if (onRefreshAppState) onRefreshAppState();
      showToast(`⚡ Granted permissions! ${newAuthEmail} will now sign up with ${newAuthRole.toUpperCase()} credentials.`);
      setNewAuthEmail('');
      setNewAuthName('');
      setShowPreAuthForm(false);
    } else {
      showToast(res.error || "Failed to grant signup permissions.");
    }
  };

  // Filter Registered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchUser.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchUser.toLowerCase());
    const matchesRole = userRoleFilter === 'All' || (u.role || 'supporter') === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Filter Purchases & Ledger items (includes all ledger items)
  const displayedPurchases = purchases.filter(p => {
    // If standard supporter, only show their own transactions
    if (!isSuperAdmin && !isAdmin && user?.email) {
      if (p.clientEmail?.toLowerCase() !== user.email.toLowerCase()) return false;
    }
    const matchesCategory = purchaseCategoryFilter === 'All' || p.category === purchaseCategoryFilter;
    const matchesSearch = !purchaseSearch.trim() || 
      p.clientName?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
      p.clientEmail?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
      p.itemName?.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
      p.tokensOrCost?.toLowerCase().includes(purchaseSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#080a10', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      
      {/* Admin Top Navigation Bar */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(10, 13, 20, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.85rem 0'
      }}>
        <div className="container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          {/* Logo & Portal Badge - Clickable to return to Home Screen */}
          <div 
            onClick={onBackToPublic}
            role="button"
            tabIndex={0}
            data-agent-id="admin-brand-logo-btn"
            data-testid="admin-brand-logo-btn"
            aria-label="Trainer David - Return to Home Screen"
            title="Return to Home Screen"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onBackToPublic();
              }
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.85rem',
              cursor: 'pointer',
              userSelect: 'none',
              padding: '0.35rem 0.6rem',
              borderRadius: '12px',
              transition: 'background 0.2s ease, transform 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff8a00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(255, 107, 0, 0.35)',
              flexShrink: 0
            }}>
              <Dumbbell size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: 800 }}>
                  TRAINER <span style={{ color: 'var(--accent-orange)' }}>DAVID</span>
                </span>
                <span className={isSuperAdmin ? "badge badge-red" : (isAdmin ? "badge badge-orange" : "badge badge-lime")} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', fontWeight: 800 }}>
                  {isSuperAdmin ? "🔥 Firebase SuperAdmin" : (isAdmin ? "Admin Hub" : "Supporter Portal")}
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {isSuperAdmin 
                  ? `Firebase Master (${FIREBASE_SUPERADMIN_EMAIL}) • Sole Authority to Assign Admin Credentials` 
                  : (isAdmin ? "Tokens, Bookings, Client Ledger & Google Administration" : "Supporter Account • Token Funds & Direct Coaching Access")}
              </div>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Live Token Balance Display */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              color: '#f59e0b',
              fontWeight: 700,
              fontSize: '0.88rem'
            }}>
              <Coins size={16} />
              <span>{tokens} Tokens</span>
            </div>

            {/* Google Profile Pill */}
            {user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid var(--border-subtle)',
                padding: '0.3rem 0.75rem 0.3rem 0.4rem',
                borderRadius: 'var(--radius-full)'
              }}>
                {user.picture ? (
                  <img 
                    src={user.picture} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    style={{ width: '26px', height: '26px', borderRadius: '50%' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isSuperAdmin ? '#ef4444' : 'var(--accent-orange)',
                  display: user.picture ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  {isSuperAdmin ? '🔥' : (user.name ? user.name.charAt(0) : 'U')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.name}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: isSuperAdmin ? '#ef4444' : 'var(--text-muted)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isSuperAdmin ? 700 : 400 }}>
                    {user.email}
                  </span>
                </div>
              </div>
            )}

            {/* Switch to Public Site / Workout Videos */}
            <button
              onClick={onBackToPublic}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.85rem',
                fontSize: '0.82rem',
                whiteSpace: 'nowrap'
              }}
              id="back-to-workouts-btn"
            >
              <ArrowLeft size={15} />
              <span>Workout Videos</span>
            </button>

            {/* Sign Out */}
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Sign out of Google"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="container" style={{ marginTop: '0.85rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem'
          }}>
            {(isSuperAdmin ? [
              { id: 'users', label: '🔥 SuperAdmin', highlight: true },
              { id: 'applications', label: '📋 Applications' },
              { id: 'tokens', label: '💎 Universal Tokens' },
              { id: 'purchases', label: `🛒 Purchases & Ledger (${purchases.length})` },
              { id: 'upload', label: '📤 Upload & Videos' }
            ] : isMainAdmin ? [
              { id: 'applications', label: '📋 Applications', highlight: true },
              { id: 'users', label: `👥 User Directory (${users.length})` },
              { id: 'tokens', label: '💎 Token Funds' },
              { id: 'purchases', label: `🛒 Purchases & Ledger (${purchases.length})` },
              { id: 'upload', label: '📤 Upload & Videos' }
            ] : isAdmin ? [
              { id: 'tokens', label: '💎 Token Funds', highlight: true },
              { id: 'users', label: `👥 User Directory (${users.length})` },
              { id: 'purchases', label: `🛒 Purchases & Ledger (${purchases.length})` },
              ...(canUpload ? [{ id: 'upload', label: '📤 Upload & Videos' }] : [])
            ] : [
              { id: 'tokens', label: '💎 Token Funds', highlight: true },
              { id: 'purchases', label: `🛒 My Purchases & Ledger (${purchases.filter(p => p.clientEmail?.toLowerCase() === user?.email?.toLowerCase()).length})` }
            ]).map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '10px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    background: isActive 
                      ? 'var(--accent-orange)' 
                      : tab.highlight 
                        ? 'rgba(255, 107, 0, 0.09)' 
                        : 'rgba(255, 255, 255, 0.04)',
                    color: isActive 
                      ? '#fff' 
                      : tab.highlight 
                        ? '#ff9e40' 
                        : 'var(--text-secondary)',
                    border: isActive 
                      ? '1px solid var(--accent-orange)' 
                      : tab.highlight 
                        ? '1px solid rgba(255, 107, 0, 0.3)' 
                        : '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Floating Notification Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1300,
          background: 'rgba(15, 20, 30, 0.95)',
          border: '1px solid var(--accent-orange)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.7)',
          padding: '0.85rem 1.25rem',
          borderRadius: '14px',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 600,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          maxWidth: '420px',
          animation: 'scaleUp 0.25s ease-out'
        }}>
          <Sparkles size={18} color="var(--accent-orange)" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Admin Page Body */}
      <main style={{ flex: 1, padding: '2rem 0 4rem' }}>
        <div className="container">

          {/* Universal Tokens Panel (keeps DOM mounted to preserve tokens-ui.js event listeners per PROCESS 127) */}
          <div style={{ display: activeTab === 'tokens' ? 'block' : 'none', marginBottom: '2.5rem' }}>
            <TokensPanel hidden={activeTab !== 'tokens'} />
          </div>

          {/* TAB 1: ALL TOKEN FUNDS ARE ON THE ADMIN PAGE */}
          {activeTab === 'tokens' && (
            <div>
              {/* Token Funds Hero Card */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 107, 0, 0.08) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '18px',
                padding: '2rem',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem'
              }}>
                <div>
                  <span className={isAdmin ? "badge badge-orange" : "badge badge-lime"} style={{ marginBottom: '0.6rem' }}>
                    {isAdmin ? "💎 Administrator Wallet" : "⭐ Supporter Token Wallet"}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#f59e0b', margin: 0, lineHeight: 1 }}>
                      {tokens}
                    </h1>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                      FitTokens Funds
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '540px', margin: 0, lineHeight: 1.6 }}>
                    {isAdmin 
                      ? `All token transactions and balances are managed on this admin page. Individual workout tutorials cost 1 token each. Universal token pricing is configured by the SuperAdmin (Current: 1 Token = USD $${tokenPriceUsd.toFixed(2)}).` 
                      : `Welcome to Trainer David's community! As a registered Supporter, you can recharge FitTokens below to stream video masterclasses (1 token each) or book personalized coaching sessions. Universal token pricing is configured by the SuperAdmin (Current: 1 Token = USD $${tokenPriceUsd.toFixed(2)}).`}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '240px' }}>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    fontSize: '0.82rem'
                  }}>
                    <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Account Associated:</div>
                    <div style={{ color: '#fff', fontWeight: 700 }}>{user?.email}</div>
                  </div>

                  <div style={{
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#f59e0b',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}>
                    <Coins size={16} />
                    <span>SuperAdmin Token Price: 1 Token = USD ${tokenPriceUsd.toFixed(2)}{tokenPriceAud ? ` (≈ AUD $${tokenPriceAud.toFixed(2)})` : ''}</span>
                  </div>
                </div>
              </div>

              {/* Recharge FitTokens Section (Amounts: 100, 300, 600, and Custom) */}
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      Recharge FitTokens
                    </h3>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                      Recharge in amounts of 100, 300, 600, or enter a custom amount. Universal token pricing is set by the SuperAdmin (<strong>1 token = USD ${tokenPriceUsd.toFixed(2)}</strong>).
                    </p>
                  </div>
                  <span className="badge badge-lime" style={{ fontSize: '0.75rem' }}>
                    Instant Balance Credit
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  {tokenPackages.map(pack => {
                    const isProcessing = processingPackId === `recharge-${pack.tokens}`;

                    return (
                      <div 
                        key={pack.id} 
                        className="glass-panel" 
                        style={{
                          padding: '1.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          position: 'relative',
                          border: pack.popular ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                          background: pack.popular ? 'linear-gradient(180deg, rgba(255, 107, 0, 0.08) 0%, rgba(18, 22, 34, 0.7) 100%)' : 'rgba(18, 22, 34, 0.7)'
                        }}
                      >
                        {pack.popular && (
                          <div style={{
                            position: 'absolute',
                            top: '-12px',
                            right: '20px',
                            background: 'var(--accent-orange)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full)',
                            textTransform: 'uppercase'
                          }}>
                            Most Popular
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                              {pack.name}
                            </h4>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: 'rgba(245, 158, 11, 0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#f59e0b'
                            }}>
                              <Coins size={18} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fff' }}>
                              ${(pack.tokens * tokenPriceUsd).toFixed(2)}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              USD
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700 }}>
                              (≈ AUD ${(pack.tokens * (tokenPriceAud || (tokenPriceUsd * 1.43))).toFixed(2)})
                            </span>
                          </div>

                          <div style={{
                            background: 'rgba(0, 0, 0, 0.25)',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tokens Credited:</span>
                            <strong style={{ fontSize: '1rem', color: '#f59e0b' }}>{pack.tokens} Tokens</strong>
                          </div>

                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                            {pack.description}
                          </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleStripeRecharge(pack.id)}
                            disabled={isRedirectingStripe === pack.id}
                            className="btn-primary"
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                              padding: '0.8rem',
                              fontSize: '0.92rem',
                              background: 'linear-gradient(135deg, #635bff 0%, #4338ca 100%)',
                              boxShadow: '0 4px 15px rgba(99, 91, 255, 0.35)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <StripeIcon size={18} />
                            <span>{isRedirectingStripe === pack.id ? "Connecting to Stripe..." : `Pay $${(pack.tokens * tokenPriceUsd).toFixed(2)} with Stripe`}</span>
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={() => handleRechargeTokens(pack.tokens)}
                              disabled={isProcessing}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                fontSize: '0.78rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.35rem',
                                cursor: 'pointer'
                              }}
                            >
                              <Coins size={13} color="#f59e0b" />
                              <span>{isProcessing ? "Crediting..." : `Sandbox Free Credit (+${pack.tokens})`}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Custom Recharge Amount Card */}
                  <div 
                    className="glass-panel" 
                    style={{
                      padding: '1.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(0, 229, 153, 0.35)',
                      background: 'linear-gradient(180deg, rgba(0, 229, 153, 0.05) 0%, rgba(18, 22, 34, 0.7) 100%)'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                          Custom Amount
                        </h4>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'rgba(0, 229, 153, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-lime)'
                        }}>
                          <Sparkles size={18} />
                        </div>
                      </div>

                      <div style={{ margin: '0.75rem 0' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                          Enter Desired Tokens:
                        </label>
                        <input 
                          type="number" 
                          min="1" 
                          step="1"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(Math.max(1, parseInt(e.target.value) || 0))}
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            background: '#0d111c',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '1.1rem',
                            fontWeight: 800
                          }}
                        />
                      </div>

                      <div style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.4rem'
                      }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Cost:</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                          <strong style={{ fontSize: '1.1rem', color: 'var(--accent-lime)' }}>${((customAmount || 0) * tokenPriceUsd).toFixed(2)} USD</strong>
                          <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 700 }}>
                            (≈ AUD ${((customAmount || 0) * (tokenPriceAud || (tokenPriceUsd * 1.43))).toFixed(2)})
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                        Universal token price is set by the SuperAdmin (1 token = USD ${tokenPriceUsd.toFixed(2)}). Enter any amount of tokens to credit your balance immediately.
                      </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleStripeCustomRecharge(customAmount)}
                        disabled={isRedirectingStripe === 'custom'}
                        className="btn-primary"
                        style={{
                          width: '100%',
                          justifyContent: 'center',
                          padding: '0.8rem',
                          fontSize: '0.92rem',
                          background: 'linear-gradient(135deg, #635bff 0%, #4338ca 100%)',
                          boxShadow: '0 4px 15px rgba(99, 91, 255, 0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <StripeIcon size={18} />
                        <span>{isRedirectingStripe === 'custom' ? "Connecting to Stripe..." : `Pay $${((customAmount || 0) * tokenPriceUsd).toFixed(2)} with Stripe`}</span>
                      </button>

                      {isSuperAdmin && (
                        <button
                          onClick={() => handleRechargeTokens(customAmount)}
                          disabled={processingPackId === `recharge-${customAmount}`}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            fontSize: '0.78rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Coins size={13} color="#f59e0b" />
                          <span>{processingPackId === `recharge-${customAmount}` ? "Crediting..." : `Sandbox Free Credit (+${customAmount || 0})`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Token Allocation Ledger (Admin Only - No other functions given to supporters) */}
              {isAdmin && (
                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <ShieldCheck size={20} color="var(--accent-orange)" />
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        Coach David Admin Token Ledger
                      </h4>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Total Registered Users: {users.length} | Roles: Admin & Supporters
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                    Registered users have the Supporter role with 0 initial tokens. As system administrator, you can grant bonus tokens or adjust balances in real-time below.
                  </p>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.75rem 0.5rem' }}>User / Google Account</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Role</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Token Balance</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Password Backup</th>
                          <th style={{ padding: '0.75rem 0.5rem' }}>Admin Balance Adjust</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.slice(0, 10).map(u => (
                          <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <div style={{ fontWeight: 700, color: '#fff' }}>{u.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span className={u.role === 'admin' ? "badge badge-orange" : "badge badge-lime"} style={{ fontSize: '0.7rem' }}>
                                {u.role === 'admin' ? 'Admin' : 'Supporter'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span style={{ color: '#f59e0b', fontWeight: 800 }}>{u.tokens} 💎</span>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              {u.hasBackupPassword ? (
                                <span className="badge badge-lime" style={{ fontSize: '0.68rem' }}>Password Set ✓</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Google Account</span>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  onClick={() => handleGrantTokens(u.id, 15, u.name)}
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.76rem', color: 'var(--accent-orange)' }}
                                  title="Grant 15 tokens"
                                >
                                  +15
                                </button>
                                <button
                                  onClick={() => handleGrantTokens(u.id, 50, u.name)}
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.76rem', color: 'var(--accent-lime)' }}
                                  title="Grant 50 tokens"
                                >
                                  +50
                                </button>
                                <button
                                  onClick={() => handleGrantTokens(u.id, -1, u.name)}
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.76rem', color: '#f87171' }}
                                  title="Deduct 1 token"
                                >
                                  -1
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USERS & SUPERADMIN CREDENTIALS LEDGER (ONE SUPERADMIN BUTTON) */}
          {activeTab === 'users' && (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              {/* SuperAdmin Authority Banner */}
              {isSuperAdmin ? (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(255, 107, 0, 0.1) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1.75rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                      <span className="badge badge-red" style={{ fontSize: '0.78rem', fontWeight: 800 }}>
                        🔥 Firebase SuperAdmin Authority
                      </span>
                      <span style={{ fontSize: '0.88rem', color: '#ff6b6b', fontWeight: 700 }}>
                        {FIREBASE_SUPERADMIN_EMAIL}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0 0.4rem' }}>
                      Master User Directory & Credential Assignment
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.5 }}>
                      As the registered Firebase SuperAdmin, you have direct access to all registered users. When users sign in, they become a <strong>Supporter</strong> with 0 tokens. You have exclusive authority to grant administrator credentials: <strong>Supporter</strong>, <strong>Trainer</strong>, <strong>Doctor</strong>, <strong>Accountant</strong>, or <strong>Admin</strong>.
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '0.85rem 1.1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    minWidth: '220px'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered Database Records:</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                      {users.length} <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Accounts</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-lime)' }}>
                      SuperAdmin Privilege: Live Real-Time Role Assignment
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tokens')}
                      style={{
                        marginTop: '0.4rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        borderRadius: '8px',
                        color: '#f59e0b',
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      title="Open Universal TokensPanel (Buy, Pricing & Accounts)"
                    >
                      <Coins size={14} />
                      <span>Manage Universal Tokens & Pricing →</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Registered Users Directory
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>
                    User accounts registered via Google. Roles and admin credentials are administered by the Firebase SuperAdmin ({FIREBASE_SUPERADMIN_EMAIL}).
                  </p>
                </div>
              )}

              {/* SuperAdmin Action: Grant Signup Permissions for Trainers, Doctors, etc. */}
              {isSuperAdmin && (
                <div 
                  data-agent-id="admin-signup-permissions-card"
                  data-testid="admin-signup-permissions-card"
                  style={{
                    background: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '12px',
                    padding: '1.1rem',
                    marginBottom: '1.5rem',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div 
                      onClick={() => setIsPermissionsCardCollapsed(prev => !prev)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={!isPermissionsCardCollapsed}
                      aria-label="Toggle Grant Sign Up Permissions Section"
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter' || e.key === ' ') { 
                          e.preventDefault(); 
                          setIsPermissionsCardCollapsed(prev => !prev); 
                        } 
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '0.75rem', 
                        cursor: 'pointer', 
                        flex: 1, 
                        minWidth: '260px',
                        userSelect: 'none'
                      }}
                    >
                      {/* Responsive Lightning Badge directly in front of Grant Sign Up Permissions text */}
                      <div 
                        aria-hidden="true"
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.12) 100%)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ef4444',
                          boxShadow: '0 0 12px rgba(239, 68, 68, 0.2)',
                          flexShrink: 0,
                          marginTop: '1px'
                        }}
                      >
                        <Zap size={17} color="#ef4444" fill="#ef4444" />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontWeight: 800, 
                            color: '#fff', 
                            fontSize: 'clamp(0.92rem, 1.8vw, 1.05rem)',
                            lineHeight: 1.3,
                            letterSpacing: '-0.01em'
                          }}>
                            Grant Sign Up Permissions (Trainers, Doctors, Accountants, Admins)
                          </span>

                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            background: isPermissionsCardCollapsed ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.2)',
                            color: isPermissionsCardCollapsed ? 'var(--text-secondary)' : '#fca5a5',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            flexShrink: 0
                          }}>
                            {isPermissionsCardCollapsed ? 'Collapsed • Click to Expand' : 'Collapsible'}
                            {isPermissionsCardCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                          </span>
                        </div>

                        {!isPermissionsCardCollapsed && (
                          <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            Assign role credentials in advance. When the person signs up or logs in with their Google account, they automatically receive their assigned role and privileges instead of defaulting to Supporter.
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {/* Roles and Permissions Rubric Button - Defined by SuperAdmin only */}
                      <button
                        type="button"
                        data-agent-id="admin-roles-rubric-btn"
                        data-testid="admin-roles-rubric-btn"
                        aria-label="Open Roles and Permissions Rubric"
                        onClick={() => setShowRubricModal(true)}
                        style={{
                          padding: '0.55rem 0.95rem',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)',
                          border: '1px solid rgba(139, 92, 246, 0.5)',
                          color: '#e0e7ff',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.15)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.4) 0%, rgba(139, 92, 246, 0.4) 100%)';
                          e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.8)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)';
                          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                        }}
                      >
                        <span>📋</span>
                        <span>Roles & Permissions Rubric</span>
                        <span style={{
                          fontSize: '0.68rem',
                          background: '#ef4444',
                          color: '#fff',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          fontWeight: 800,
                          letterSpacing: '0.03em'
                        }}>
                          SUPERADMIN
                        </span>
                      </button>

                      <button
                        type="button"
                        data-agent-id="admin-grant-permissions-toggle-btn"
                        data-testid="admin-grant-permissions-toggle-btn"
                        aria-label="Toggle Grant Permissions to Email form"
                        onClick={() => {
                          if (isPermissionsCardCollapsed) {
                            setIsPermissionsCardCollapsed(false);
                            setShowPreAuthForm(true);
                          } else {
                            setShowPreAuthForm(!showPreAuthForm);
                          }
                        }}
                        className="btn-primary"
                        style={{
                          padding: '0.55rem 1rem',
                          fontSize: '0.82rem',
                          background: showPreAuthForm && !isPermissionsCardCollapsed ? 'rgba(255, 255, 255, 0.1)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          borderColor: '#ef4444'
                        }}
                      >
                        {showPreAuthForm && !isPermissionsCardCollapsed ? 'Close Form' : '+ Grant Permissions to Email'}
                      </button>
                    </div>
                  </div>

                  {!isPermissionsCardCollapsed && showPreAuthForm && (
                    <form onSubmit={handlePreauthorizeSubmit} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(239, 68, 68, 0.2)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                          Google Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={newAuthEmail}
                          onChange={e => setNewAuthEmail(e.target.value)}
                          placeholder="e.g. dr.sarah@clinic.com"
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.75rem',
                            background: '#0d111c',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.84rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                          Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={newAuthName}
                          onChange={e => setNewAuthName(e.target.value)}
                          placeholder="e.g. Dr. Sarah"
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.75rem',
                            background: '#0d111c',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.84rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                          Permission / Credential To Grant *
                        </label>
                        <select
                          value={newAuthRole}
                          onChange={e => setNewAuthRole(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.6rem 0.75rem',
                            background: '#0d111c',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.84rem',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="trainer">🏋️ Trainer (Coaching & Programs)</option>
                          <option value="doctor">🩺 Doctor (Physiotherapy & Rehab)</option>
                          <option value="accountant">💼 Accountant (Finances & Ledgers)</option>
                          <option value="admin">👑 Admin (Full System Operations)</option>
                          <option value="supporter">⭐ Supporter (Community Member)</option>
                        </select>
                      </div>

                      <div>
                        <button
                          type="submit"
                          className="btn-primary"
                          style={{
                            width: '100%',
                            padding: '0.6rem 1rem',
                            fontSize: '0.84rem',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            borderColor: '#ef4444',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.45rem'
                          }}
                        >
                          <Zap size={15} color="#fff" fill="#fff" />
                          <span>Authorize Permissions</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Filter Tabs & Search Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'All', label: `All (${users.length})` },
                    { id: 'superadmin', label: `🔥 SuperAdmin (${users.filter(u => u.role === 'superadmin').length})` },
                    { id: 'admin', label: `👑 Admin (${users.filter(u => u.role === 'admin').length})` },
                    { id: 'trainer', label: `🏋️ Trainer (${users.filter(u => u.role === 'trainer').length})` },
                    { id: 'doctor', label: `🩺 Doctor (${users.filter(u => u.role === 'doctor').length})` },
                    { id: 'accountant', label: `💼 Accountant (${users.filter(u => u.role === 'accountant').length})` },
                    { id: 'supporter', label: `⭐ Supporter (${users.filter(u => !u.role || u.role === 'supporter').length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setUserRoleFilter(tab.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: userRoleFilter === tab.id ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.05)',
                        color: userRoleFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                        border: userRoleFilter === tab.id ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={searchUser}
                    onChange={e => setSearchUser(e.target.value)}
                    placeholder="Search name or email..."
                    style={{
                      width: '100%',
                      background: '#0d111c',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem 0.5rem 2rem',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Users & Role Credentials Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>User / Google Account</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Current Credential</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>
                        {isSuperAdmin ? '⚡ Assign Credential (SuperAdmin)' : 'Credential Authority'}
                      </th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Token Balance</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Backup Password</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Token Adjust</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                          No users found matching filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => {
                        const currentRole = u.role || 'supporter';
                        const credentialInfo = ADMIN_CREDENTIALS.find(c => c.id === currentRole) || ADMIN_CREDENTIALS[0];
                        const isUserSA = isUserSuperAdmin(u.email);

                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            {/* User Profile */}
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                {u.picture ? (
                                  <img src={u.picture} alt="" style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    background: isUserSA ? '#ef4444' : 'var(--accent-orange)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: 800
                                  }}>
                                    {isUserSA ? '🔥' : (u.name ? u.name.charAt(0) : 'U')}
                                  </div>
                                )}
                                <div>
                                  <div style={{ fontWeight: 700, color: '#fff' }}>{u.name}</div>
                                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* Active Credential Badge */}
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span 
                                className={`badge ${credentialInfo.badgeClass}`}
                                style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', fontWeight: 800 }}
                              >
                                {credentialInfo.icon} {credentialInfo.label}
                              </span>
                            </td>

                            {/* SuperAdmin & MainAdmin Role Assignor */}
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              {isUserSA ? (
                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  color: '#ef4444',
                                  padding: '0.25rem 0.5rem',
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(239, 68, 68, 0.3)'
                                }}>
                                  🔥 Master SuperAdmin
                                </span>
                              ) : (currentRole === 'mainadmin' && isMainAdmin) ? (
                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  color: '#f59e0b',
                                  padding: '0.25rem 0.5rem',
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(245, 158, 11, 0.3)'
                                }}>
                                  🛡️ MainAdmin
                                </span>
                              ) : (isSuperAdmin || isMainAdmin) ? (
                                <select
                                  value={currentRole}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value, u.name)}
                                  style={{
                                    background: '#0d111c',
                                    border: '1px solid var(--accent-orange)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    padding: '0.35rem 0.6rem',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Change credential"
                                >
                                  {ADMIN_CREDENTIALS.filter(c => {
                                    if (c.id === 'superadmin') return false;
                                    if (isMainAdmin && c.id === 'mainadmin') return false;
                                    return true;
                                  }).map(c => (
                                    <option key={c.id} value={c.id}>
                                      {c.icon} {c.label} ({c.title})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                  SuperAdmin & MainAdmin Only
                                </span>
                              )}
                            </td>

                            {/* Token Balance */}
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span style={{ color: '#f59e0b', fontWeight: 800 }}>{u.tokens} 💎</span>
                            </td>

                            {/* Password Backup */}
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              {u.hasBackupPassword ? (
                                <span className="badge badge-lime" style={{ fontSize: '0.68rem' }}>Password Set ✓</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Google Account</span>
                              )}
                            </td>

                            {/* Quick Token Adjustments */}
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <div style={{ display: 'flex', gap: '0.4rem' }}>
                                <button
                                  onClick={() => handleGrantTokens(u.id, 15, u.name)}
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', color: 'var(--accent-orange)' }}
                                  title="Add 15 tokens"
                                >
                                  +15
                                </button>
                                <button
                                  onClick={() => handleGrantTokens(u.id, 50, u.name)}
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', color: 'var(--accent-lime)' }}
                                  title="Add 50 tokens"
                                >
                                  +50
                                </button>
                                <button
                                  onClick={() => handleGrantTokens(u.id, -1, u.name)}
                                  className="btn-secondary"
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.74rem', color: '#f87171' }}
                                  title="Deduct 1 token"
                                >
                                  -1
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PURCHASES & ALL LEDGER ITEMS */}
          {activeTab === 'purchases' && (
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    🛒 Purchases & Transaction Ledger
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.35rem 0 0' }}>
                    {isSuperAdmin || isAdmin 
                      ? 'Master ledger recording all token recharges, purchases, subscriptions, and administrative adjustments.' 
                      : 'Your complete account transaction history, token recharge receipts, and active passes.'}
                  </p>
                </div>

                <div style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: '10px',
                  padding: '0.55rem 0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#f59e0b',
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}>
                  <Coins size={16} />
                  <span>Total Ledger Items: {displayedPurchases.length}</span>
                </div>
              </div>

              {/* Category Filter Tabs & Search Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    { id: 'All', label: `All (${purchases.length})` },
                    { id: 'Token Recharge', label: `💎 Recharges (${purchases.filter(p => p.category === 'Token Recharge').length})` },
                    { id: 'Subscription', label: `👑 Passes (${purchases.filter(p => p.category === 'Subscription').length})` },
                    { id: 'Token Pack', label: `🎁 Packs (${purchases.filter(p => p.category === 'Token Pack').length})` },
                    { id: 'Coaching Booking', label: `📅 Bookings (${purchases.filter(p => p.category === 'Coaching Booking').length})` },
                    { id: 'Token Adjustment', label: `⚡ Adjustments (${purchases.filter(p => p.category === 'Token Adjustment').length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPurchaseCategoryFilter(tab.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: purchaseCategoryFilter === tab.id ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.05)',
                        color: purchaseCategoryFilter === tab.id ? '#fff' : 'var(--text-secondary)',
                        border: purchaseCategoryFilter === tab.id ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={purchaseSearch}
                    onChange={e => setPurchaseSearch(e.target.value)}
                    placeholder="Search ledger items..."
                    style={{
                      width: '100%',
                      background: '#0d111c',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.75rem 0.5rem 2rem',
                      color: '#fff',
                      fontSize: '0.85rem'
                    }}
                  />
                </div>
              </div>

              {/* Ledger Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Date & Time</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Client / Account</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Transaction Item</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Category</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Amount / Tokens</th>
                      <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                          No ledger records match the selected filter or search.
                        </td>
                      </tr>
                    ) : (
                      displayedPurchases.map(p => {
                        const dateFormatted = p.timestamp ? new Date(p.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : (p.date || 'Recent');
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {dateFormatted}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <div style={{ color: '#fff', fontWeight: 700 }}>{p.clientName}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{p.clientEmail}</div>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#fff' }}>
                              {p.itemName}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span 
                                className={
                                  p.category === 'Token Recharge' ? "badge badge-lime" :
                                  p.category === 'Subscription' ? "badge badge-orange" :
                                  p.category === 'Token Adjustment' ? "badge badge-red" : "badge badge-orange"
                                } 
                                style={{ fontSize: '0.7rem', padding: '0.2rem 0.55rem' }}
                              >
                                {p.category}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem', color: '#f59e0b', fontWeight: 800, whiteSpace: 'nowrap' }}>
                              {p.tokensOrCost}
                            </td>
                            <td style={{ padding: '0.75rem 0.5rem' }}>
                              <span style={{
                                padding: '0.2rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: p.status === 'Active' || p.status === 'Completed' ? 'rgba(0, 229, 153, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                                color: p.status === 'Active' || p.status === 'Completed' ? 'var(--accent-lime)' : 'var(--text-secondary)',
                                border: '1px solid rgba(0, 229, 153, 0.25)'
                              }}>
                                {p.status || 'Completed'} ✓
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (isSuperAdmin || isMainAdmin) && (
            <AdminApplicationsPanel
              user={user}
              isSuperAdmin={isSuperAdmin}
              isMainAdmin={isMainAdmin}
              showToast={showToast}
              onRefreshUsers={loadData}
            />
          )}

          {activeTab === 'upload' && canUpload && (
            <div>
              <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => setUploadSubTab('drive')}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    background: uploadSubTab === 'drive' ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.05)',
                    color: uploadSubTab === 'drive' ? '#fff' : 'var(--text-secondary)',
                    border: uploadSubTab === 'drive' ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  📁 Google Drive Documents
                </button>
                <button
                  type="button"
                  onClick={() => setUploadSubTab('video')}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '10px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    background: uploadSubTab === 'video' ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.05)',
                    color: uploadSubTab === 'video' ? '#fff' : 'var(--text-secondary)',
                    border: uploadSubTab === 'video' ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  🎬 Publish Workout Masterclass (50/50 Split)
                </button>
              </div>

              {uploadSubTab === 'drive' ? (
                <AdminUploadPanel showToast={showToast} defaultEmail={auth.currentUser?.email || user?.email || ''} />
              ) : (
                <VideoPublishPanel 
                  user={user} 
                  showToast={showToast} 
                  onVideoPublished={() => { 
                    if (onRefreshAppState) onRefreshAppState(); 
                  }} 
                />
              )}
            </div>
          )}

        </div>
      </main>

      {/* Admin Page Footer */}
      <footer style={{
        backgroundColor: '#05070a',
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.5rem 0',
        fontSize: '0.82rem',
        color: 'var(--text-muted)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            🔒 Trainer David Admin Hub • Logged in as <strong>{user?.name}</strong> ({user?.email})
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <button onClick={onBackToPublic} style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', cursor: 'pointer', fontSize: 'inherit' }}>
              ← Return to Workout Library
            </button>
            <span>Confidential Client Health Records</span>
          </div>
        </div>
      </footer>

      {/* SuperAdmin Defined Roles & Permissions Rubric Modal */}
      <RolesRubricModal
        isOpen={showRubricModal}
        onClose={() => setShowRubricModal(false)}
        isSuperAdmin={isSuperAdmin}
        showToast={showToast}
      />

    </div>
  );
}
