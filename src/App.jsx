import React, { useState, useEffect } from 'react';
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
import { Flame, Sparkles, X, Coins, CheckCircle2 } from './components/Icons';
import { getStoredUser, setStoredUser, clearStoredUser } from './utils/googleAuth';
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
  const [unlockedVideoIds, setUnlockedVideoIds] = useState([]); // Videos unlocked for 1 token
  const [activeVideo, setActiveVideo] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
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
    if (user) {
      const allUsers = getRegisteredUsers();
      const match = allUsers.find(u => u.email?.toLowerCase() === user.email?.toLowerCase());
      if (match) {
        setTokens(match.tokens);
      }
    }
  };

  // Process Stripe Checkout redirect callbacks (?session_id=...&stripe_success=true)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSuccess = params.get('stripe_success');
    const sessionId = params.get('session_id');
    const pkgId = params.get('package');
    const urlTokens = parseInt(params.get('tokens'), 10);

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
      } else {
        const toAdd = !isNaN(urlTokens) && urlTokens > 0 
          ? urlTokens 
          : (pkgId === 'recharge-100' ? 100 : (pkgId === 'recharge-300' ? 300 : (pkgId === 'recharge-600' ? 600 : 100)));
        
        setTokens(prev => prev + toAdd);
        addAdminPurchase({
          clientName: user?.name || 'Stripe Customer',
          clientEmail: user?.email || 'customer@stripe.com',
          itemName: `FitToken Recharge (+${toAdd} Tokens via Stripe)`,
          category: 'Stripe Payment',
          tokensOrCost: `$${toAdd} USD (+${toAdd} Tokens)`
        });
        showToast(`💳 Stripe Checkout Confirmed! Recharged ${toAdd} FitTokens to your balance.`);
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
  const handleLoginSuccess = (userProfile) => {
    // Register or retrieve user from Admin store with given role
    const registered = registerOrUpdateGoogleUser(userProfile, '', userProfile.role);
    const updatedUser = registered ? { ...userProfile, role: registered.role, tokens: registered.tokens } : { ...userProfile, role: userProfile.role || 'supporter', tokens: 0 };
    setUser(updatedUser);
    setStoredUser(updatedUser);

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

  const handleLogout = () => {
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

  const handleAddTokens = (amount) => {
    setTokens(prev => prev + amount);
    // Log to Admin store purchases (1 token = USD $1)
    addAdminPurchase({
      clientName: user?.name || 'Registered User',
      clientEmail: user?.email || 'guest@gmail.com',
      itemName: `Token Recharge (+${amount} Tokens)`,
      category: 'Token Recharge',
      tokensOrCost: `$${amount} USD (+${amount} Tokens)`
    });
    showToast(`Added ${amount} FitTokens to your balance!`);
  };

  const handleSubscribeWithTokens = () => {
    if (tokens < 99) {
      showToast(`You have ${tokens} tokens. 99 tokens needed for Monthly All-Access Pass.`);
      setAdminTab('tokens');
      setCurrentView('admin');
      return false;
    }

    setTokens(prev => prev - 99);
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
  // Active Subscribers watch freely. Otherwise 1 token required.
  const handleWatchVideo = (video) => {
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

    // 4. Must have at least 1 token
    if (tokens < 1) {
      showToast("You have 0 tokens. Please recharge via Stripe on the Admin page or get an All-Access Pass.");
      setAdminTab('tokens');
      setCurrentView('admin');
      return;
    }

    // Deduct 1 token and unlock
    setTokens(prev => prev - 1);
    setUnlockedVideoIds(prev => [...prev, video.id]);
    setActiveVideo(video);
    showToast(`1 Token deducted. "${video.title}" unlocked! Remaining: ${tokens - 1} Tokens.`);
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
          onBackToPublic={() => setCurrentView('public')}
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

    </div>
  );
}
