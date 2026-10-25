import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import VideoGrid from './components/VideoGrid';

import ServicesSection from './components/ServicesSection';
import TrainerProfile from './components/TrainerProfile';
import Footer from './components/Footer';
import VideoModal from './components/VideoModal';
import AuthModal from './components/AuthModal';
import ConsultationModal from './components/ConsultationModal';
import AdminPage from './components/AdminPage';
import CoachDavidAiModal from './components/CoachDavidAiModal';
import GeoTimeWidget from './components/GeoTimeWidget';
import TrainerApplicationModal from './components/TrainerApplicationModal';
import { Flame, Sparkles, X, Coins, CheckCircle2 } from './components/Icons';
import { getStoredUser, setStoredUser, clearStoredUser } from './utils/googleAuth';
import { auth, onAuthStateChanged, logoutUser } from './firebase';
import { syncUserProfile, toAppRole } from './services/userDirectory';
import { spendTokens, grantTokens, claimStripeSession } from './services/tokenApi';
import { unlockVideoWithSplit } from './services/trainerApi';
import { registerOrUpdateGoogleUser, addAdminPurchase, getRegisteredUsers } from './data/adminStore';

export default function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [currentView, setCurrentView] = useState('public'); // 'public' | 'admin'
  const [adminTab, setAdminTab] = useState('tokens'); // 'tokens' | 'users' | 'purchases'
  const [tokens, setTokens] = useState(() => {
    const savedUser = getStoredUser();
    if (savedUser) {
      const allUsers = getRegisteredUsers();
      const match = allUsers.find(u => u.email?.toLowerCase() === savedUser.email?.toLowerCase());
      return match ? (match.tokens ?? 0) : 0;
    }
    return 0; // Supporters start with 0 tokens
  });
  const [isSubscriber, setIsSubscriber] = useState(() => {
    return localStorage.getItem('trainer_david_subscriber') === 'true';
  });
  const [unlockedVideoIds, setUnlockedVideoIds] = useState([]); // Videos unlocked for tokens
  const [activeVideo, setActiveVideo] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [isTrainerAppModalOpen, setIsTrainerAppModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('1-on-1 Online Personal Training');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync state when Admin panel updates tokens
  const refreshAppStateFromStore = () => {
    // Google members: the balance lives on the server, so re-read the Firestore profile
    if (user?.provider === 'firebase' && auth.currentUser) {
      applyFirestoreProfile(auth.currentUser, { register: false });
      return;
    }
    if (user) {
      const allUsers = getRegisteredUsers();
      const match = allUsers.find(u => u.email?.toLowerCase() === user.email?.toLowerCase());
      if (match) {
        setTokens(match.tokens);
      }
    }
  };

  // Load (or create, as supporter) the user's Firestore profile and apply its role and tokens.
  // Returns the session user, or null when the user is not a #pt member and `register` is false.
  const applyFirestoreProfile = async (fbUser, { register = true } = {}) => {
    try {
      const localMatch = getRegisteredUsers().find(u => u.email?.toLowerCase() === fbUser.email?.toLowerCase());
      const profile = await syncUserProfile(fbUser, { register });
      if (!profile) return null;

      const stored = getStoredUser();
      const sameUser = stored?.email?.toLowerCase() === fbUser.email?.toLowerCase();
      const sessionUser = {
        ...(sameUser ? stored : {}),
        id: fbUser.uid,
        email: fbUser.email,
        name: profile.displayName || localMatch?.name || fbUser.email.split('@')[0],
        givenName: (profile.displayName || localMatch?.givenName || '').split(' ')[0] || 'User',
        picture: profile.photoURL || profile.avatar || fbUser.photoURL || localMatch?.picture || '',
        role: toAppRole(profile, fbUser.email),
        tokens: Number.isFinite(profile.token_balance) ? Math.trunc(profile.token_balance) : (profile.fitTokens ?? 0),
        token_balance: Number.isFinite(profile.token_balance) ? Math.trunc(profile.token_balance) : (profile.fitTokens ?? 0),
        provider: 'firebase'
      };
      setUser(sessionUser);
      setStoredUser(sessionUser);
      setTokens(sessionUser.tokens);
      return sessionUser;
    } catch (e) {
      console.error('Failed to sync user profile with Firestore:', e);
      return null;
    }
  };

  // Keep the session in sync with Firebase Auth across page reloads
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        // Restore an existing #pt member's session from the verified Firebase identity.
        // New users finish registration in the AuthModal flow instead.
        applyFirestoreProfile(fbUser, { register: false });
      } else {
        if (getStoredUser()?.provider === 'firebase') {
          // Firebase session ended (signed out or expired): drop the stored Google session.
          // Backup-password sessions have no Firebase session and are left alone.
          setUser(null);
          clearStoredUser();
          setTokens(0);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Stripe session already sent to the server for crediting (effects can run more than once)
  const claimedSessionRef = useRef(null);

  // Process Stripe Checkout redirect callbacks (?session_id=...&stripe_success=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSuccess = params.get('stripe_success');
    const sessionId = params.get('session_id');
    const pkgId = params.get('package');

    if (stripeSuccess === 'true' || sessionId) {
      if (pkgId === 'monthly-pass') {
        setIsSubscriber(true);
        localStorage.setItem('trainer_david_subscriber', 'true');
        addAdminPurchase({
          clientName: user?.name || 'Stripe Customer',
          clientEmail: user?.email || 'customer@stripe.com',
          itemName: 'Monthly All-Access Pass (Stripe Checkout)',
          category: 'Membership Subscription',
          tokensOrCost: '$99.00 USD/mo'
        });
        showToast('🎉 Stripe Subscription Confirmed! Monthly All-Access Pass is now active.');
      } else if (sessionId) {
        // The server checks the payment with Stripe and credits it once; wait until signed in
        if (!auth.currentUser) return;
        if (claimedSessionRef.current === sessionId) return;
        claimedSessionRef.current = sessionId;
        claimStripeSession(sessionId)
          .then(({ balance, tokens: added }) => {
            setTokens(balance);
            addAdminPurchase({
              clientName: user?.name || 'Stripe Customer',
              clientEmail: user?.email || 'customer@stripe.com',
              itemName: `FitToken Recharge (+${added} Tokens via Stripe)`,
              category: 'Stripe Payment',
              tokensOrCost: `${added} USD (+${added} Tokens)`
            });
            showToast(`💳 Stripe Checkout Confirmed! Recharged ${added} FitTokens to your balance.`);
          })
          .catch(err => showToast(err.status === 409 ? 'This Stripe payment has already been added to your balance.' : err.message));
      } else {
        // Payment Links don't return a session ID, so the server can't verify the payment here
        showToast('Payment received. Your FitTokens will be added once the payment is confirmed. Contact support if they do not appear.');
      }

      // Clean up URL parameters without refreshing
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('stripe_cancel') === 'true') {
      showToast('Stripe checkout was cancelled. No charges were made.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user]);

  // Google Login & Registration:
  // Rule: If people register now, they become a supporter, no other functions given (0 tokens)
  const handleLoginSuccess = async (userProfile) => {
    // Register or retrieve user from Admin store (new users default to Supporter; existing roles are kept)
    let registered = registerOrUpdateGoogleUser(userProfile, '');
    const updatedUser = registered ? { ...userProfile, role: registered.role, tokens: registered.tokens } : { ...userProfile, role: userProfile.role || 'supporter', tokens: 0 };
    setUser(updatedUser);
    setStoredUser(updatedUser);

    // Google sign-ins are registered in Firestore (#pt); its role and FitTokens are authoritative
    if (userProfile.provider === 'firebase' && auth.currentUser) {
      const remoteUser = await applyFirestoreProfile(auth.currentUser);
      if (remoteUser) {
        registered = { ...(registered || {}), ...remoteUser };
      }
    }

    if (registered) {
      setTokens(registered.tokens);
      if (registered.role === 'superadmin') {
        showToast(`🔥 Welcome SuperAdmin (${registered.email})! Firebase Master Credential Authority active.`);
      } else if (registered.role === 'admin') {
        showToast(`👑 Welcome Administrator ${registered.givenName || registered.name}!`);
      } else if (registered.role === 'trainer') {
        showToast(`🏋️ Welcome Trainer ${registered.givenName || registered.name}! Coaching console active.`);
      } else if (registered.role === 'doctor') {
        showToast(`🩺 Welcome Doctor ${registered.givenName || registered.name}! Medical & Rehab console active.`);
      } else if (registered.role === 'accountant') {
        showToast(`💼 Welcome Accountant ${registered.givenName || registered.name}! Financial audit console active.`);
      } else {
        showToast(`Welcome ${registered.givenName || registered.name}! Registered as Supporter.`);
      }
    } else {
      setTokens(0);
      showToast(`Welcome, ${userProfile.name}! Registered as Supporter.`);
    }

    // After log in, go directly to the admin page
    setIsAuthOpen(false);
    setCurrentView('admin');
    setAdminTab(registered?.role === 'superadmin' ? 'users' : 'tokens');
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    clearStoredUser();
    setTokens(0);
    setIsSubscriber(false);
    localStorage.removeItem('trainer_david_subscriber');
    setCurrentView('public');
    showToast("Signed out. Register or sign in with Google to access your tokens.");
  };

  // Book coach directly on the front page when logged in
  const handleOpenConsultation = (serviceName) => {
    if (serviceName) setSelectedService(serviceName);
    if (user) {
      setIsConsultationOpen(true);
    } else {
      showToast("Please sign in with Google first to book a consultation with Coach David.");
      setIsAuthOpen(true);
    }
  };

  // All token funds are on the admin page
  const handleOpenTokenStore = () => {
    if (user) {
      setAdminTab('tokens');
      setCurrentView('admin');
    } else {
      showToast("Sign in with Google to view and recharge your FitToken funds.");
      setIsAuthOpen(true);
    }
  };

  const handleOpenAdmin = (tab = 'tokens') => {
    if (!user) {
      showToast("Admin support is available once logged in through Google.");
      setIsAuthOpen(true);
      return;
    }
    setAdminTab(tab);
    setCurrentView('admin');
  };

  // SuperAdmin sandbox credit: added on the server, to the SuperAdmin's own balance
  const handleAddTokens = async (amount) => {
    if (!auth.currentUser) {
      showToast('Sign in with Google to use FitTokens.');
      return;
    }
    try {
      const { balance } = await grantTokens(auth.currentUser.uid, amount);
      setTokens(balance);
    } catch (err) {
      showToast(err.message);
      return false;
    }
    // Log to Admin store purchases
    addAdminPurchase({
      clientName: user?.name || 'Registered User',
      clientEmail: user?.email || 'guest@gmail.com',
      itemName: `Token Recharge (+${amount} Tokens)`,
      category: 'Token Recharge',
      tokensOrCost: `+${amount} Tokens`
    });
    showToast(`Added ${amount} FitTokens to your balance!`);
    return true;
  };

  const handleSubscribeWithTokens = async () => {
    if (tokens < 99) {
      showToast(`You have ${tokens} tokens. 99 tokens needed for Monthly All-Access Pass.`);
      setAdminTab('tokens');
      setCurrentView('admin');
      return false;
    }

    try {
      const { balance } = await spendTokens('monthly-pass');
      setTokens(balance);
    } catch (err) {
      showToast(err.message);
      return false;
    }
    setIsSubscriber(true);
    localStorage.setItem('trainer_david_subscriber', 'true');
    addAdminPurchase({
      clientName: user?.name || 'Registered Supporter',
      clientEmail: user?.email || 'supporter@gmail.com',
      itemName: 'Monthly All-Access Pass (Tokens)',
      category: 'Membership Subscription',
      tokensOrCost: '99 Tokens ($99 USD value)'
    });
    showToast('👑 Monthly All-Access Pass activated! All 31+ workouts free to stream.');
    return true;
  };

  // Video watching logic:
  // Active Subscribers watch freely. Otherwise video's custom token rate (1 token, 5 tokens, etc.) applies.
  // When paid, SuperAdmin receives 50% and the video's creator receives 50%.
  const handleWatchVideo = async (video) => {
    // 1. Must be signed in
    if (!user) {
      showToast("Sign in with Google required. You must have tokens in order to watch videos.");
      setIsAuthOpen(true);
      return;
    }

    // 2. Active Subscriber: unlimited free access
    if (isSubscriber) {
      setActiveVideo(video);
      return;
    }

    // 3. If already unlocked during this session
    if (unlockedVideoIds.includes(video.id)) {
      setActiveVideo(video);
      return;
    }

    const cost = Math.max(1, Math.round(Number(video.tokenCost) || 1));

    // 4. Must have enough tokens for this video's custom rate
    if (tokens < cost) {
      showToast(`You have ${tokens} token${tokens === 1 ? '' : 's'}. ${cost} token${cost === 1 ? '' : 's'} required to unlock "${video.title}".`);
      setAdminTab('tokens');
      setCurrentView('admin');
      return;
    }

    // Deduct tokens on the server and trigger the 50/50 revenue split
    try {
      const unlockRes = await unlockVideoWithSplit(video.id);
      const remaining = Number.isFinite(unlockRes.balance) ? unlockRes.balance : (tokens - cost);
      setTokens(remaining);
      setUnlockedVideoIds(prev => [...prev, video.id]);
      setActiveVideo(video);
      showToast(unlockRes.message || `Unlocked "${video.title}" for ${cost} tokens!`);
    } catch (err) {
      // Graceful fallback to spendTokens
      try {
        const { balance: remaining } = await spendTokens(cost, `video_${video.id}`, `Watch: ${video.title}`);
        setTokens(remaining);
        setUnlockedVideoIds(prev => [...prev, video.id]);
        setActiveVideo(video);
        showToast(`${cost} token${cost === 1 ? '' : 's'} deducted. "${video.title}" unlocked! Remaining: ${remaining} tokens.`);
      } catch (fallbackErr) {
        showToast(fallbackErr.message || err.message);
      }
    }
  };

  const scrollToWorkouts = () => {
    const el = document.getElementById('workouts');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Render Full-Page Admin View (Not a popup)
  if (currentView === 'admin' && user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdminPage 
          user={user}
          tokens={tokens}
          onAddTokens={handleAddTokens}
          onLogout={handleLogout}
          onBackToPublic={() => {
            setCurrentView('public');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          initialTab={adminTab}
          onRefreshAppState={refreshAppStateFromStore}
        />

        {/* Video Modal if active */}
        {activeVideo && (
          <VideoModal 
            video={activeVideo}
            isUnlocked={unlockedVideoIds.includes(activeVideo.id)}
            isSubscriber={isSubscriber}
            user={user}
            tokens={tokens}
            onClose={() => setActiveVideo(null)}
            onOpenConsultation={handleOpenConsultation}
            onOpenAuth={() => setIsAuthOpen(true)}
            onGoToAdminTokens={() => {
              setActiveVideo(null);
              setAdminTab('tokens');
            }}
          />
        )}

        {/* Google Authentication Modal */}
        <AuthModal 
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />

        {/* Coach David AI Assistant Modal */}
        <CoachDavidAiModal 
          isOpen={isAiChatOpen}
          onClose={() => setIsAiChatOpen(false)}
          user={user}
          onSelectVideo={handleWatchVideo}
          onOpenConsultation={handleOpenConsultation}
        />

        {/* Geo, Weather & Time Settings Widget */}
        <GeoTimeWidget />
      </div>
    );
  }

  // Public View
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '44px',
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
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation with Google Authentication & Admin Portal Link */}
      <Navbar 
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => handleOpenAdmin('tokens')}
        tokens={tokens}
        onOpenTokenStore={handleOpenTokenStore}
        onOpenConsultation={() => handleOpenConsultation('1-on-1 Online Personal Training')}
        onOpenAiChat={() => setIsAiChatOpen(true)}
        onOpenTrainerApplication={() => setIsTrainerAppModalOpen(true)}
        onGoHome={() => {
          setCurrentView('public');
          setActiveVideo(null);
          setIsAuthOpen(false);
          setIsConsultationOpen(false);
          setIsAiChatOpen(false);
          setIsTrainerAppModalOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <Hero 
          onExploreWorkouts={scrollToWorkouts}
          onOpenTokenStore={handleOpenTokenStore}
          onOpenConsultation={() => handleOpenConsultation('1-on-1 Online Personal Training')}
        />

        <VideoGrid 
          onSelectVideo={handleWatchVideo}
          tokens={tokens}
          unlockedVideoIds={unlockedVideoIds}
          user={user}
          isSubscriber={isSubscriber}
        />



        <ServicesSection 
          onBookService={(serviceTitle) => handleOpenConsultation(serviceTitle)}
        />

        <TrainerProfile 
          onOpenConsultation={handleOpenConsultation}
        />
      </main>

      {/* Footer */}
      <Footer 
        user={user}
        onOpenTokenStore={handleOpenTokenStore}
        onOpenConsultation={handleOpenConsultation}
        onOpenAdmin={() => handleOpenAdmin('tokens')}
        onOpenAuth={() => {
          showToast("Admin support is available once logged in through Google.");
          setIsAuthOpen(true);
        }}
      />

      {/* Modals */}
      {activeVideo && (
        <VideoModal 
          video={activeVideo}
          isUnlocked={unlockedVideoIds.includes(activeVideo.id)}
          isSubscriber={isSubscriber}
          user={user}
          tokens={tokens}
          onClose={() => setActiveVideo(null)}
          onOpenConsultation={handleOpenConsultation}
          onOpenAuth={() => setIsAuthOpen(true)}
          onGoToAdminTokens={() => {
            setActiveVideo(null);
            setAdminTab('tokens');
            setCurrentView('admin');
          }}
        />
      )}

      {/* Google Authentication Modal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Front-Page Consultation Booking Modal */}
      <ConsultationModal 
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        preselectedService={selectedService}
        user={user}
      />



      {/* Coach David AI Assistant Modal */}
      <CoachDavidAiModal 
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        user={user}
        onSelectVideo={handleWatchVideo}
        onOpenConsultation={handleOpenConsultation}
      />

      {/* Trainer & Health Professional Application Modal */}
      {isTrainerAppModalOpen && (
        <TrainerApplicationModal
          user={user}
          onClose={() => setIsTrainerAppModalOpen(false)}
          showToast={showToast}
          onSuccess={(app) => {
            showToast(`Application for ${app.requestedRoleLabel || app.requestedRole} submitted to Google Drive!`);
          }}
        />
      )}

      {/* Geo, Weather & Time Settings Widget */}
      <GeoTimeWidget />

    </div>
  );
}
