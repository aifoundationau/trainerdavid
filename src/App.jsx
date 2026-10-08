import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import VideoGrid from './components/VideoGrid';
import ServicesSection from './components/ServicesSection';
import TrainerProfile from './components/TrainerProfile';
import MembershipSection from './components/MembershipSection';
import Footer from './components/Footer';
import VideoModal from './components/VideoModal';
import TokenStoreModal from './components/TokenStoreModal';
import ConsultationModal from './components/ConsultationModal';
import { Flame, Sparkles, X, Coins, Crown, CheckCircle2 } from './components/Icons';

export default function App() {
  const [tokens, setTokens] = useState(15); // Initial user tokens
  const [isSubscriber, setIsSubscriber] = useState(false); // Monthly All-Access Pass status
  const [unlockedVideoIds, setUnlockedVideoIds] = useState([]); // Videos unlocked for 1 token
  const [activeVideo, setActiveVideo] = useState(null);
  const [isTokenStoreOpen, setIsTokenStoreOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('1-on-1 Online Personal Training');
  const [showLaunchBanner, setShowLaunchBanner] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenConsultation = (serviceName) => {
    if (serviceName) setSelectedService(serviceName);
    setIsConsultationOpen(true);
  };

  const handleAddTokens = (amount) => {
    setTokens(prev => prev + amount);
    showToast(`Added ${amount} FitTokens to your balance!`);
  };

  // Video watching logic:
  // - If subscriber: all videos are free
  // - If already unlocked: free to watch
  // - Otherwise: costs 1 token
  // - No free preview
  const handleWatchVideo = (video) => {
    if (isSubscriber) {
      setActiveVideo(video);
      return;
    }

    if (unlockedVideoIds.includes(video.id)) {
      setActiveVideo(video);
      return;
    }

    // Needs 1 token
    if (tokens >= 1) {
      setTokens(prev => prev - 1);
      setUnlockedVideoIds(prev => [...prev, video.id]);
      setActiveVideo(video);
      showToast(`1 Token used. "${video.title}" unlocked!`);
    } else {
      // 0 tokens and no free preview
      showToast("You need 1 token to watch this video. Please recharge tokens or get the All-Access Pass.");
      setIsTokenStoreOpen(true);
    }
  };

  // Monthly All-Access Pass: 99 tokens per month
  const handleSubscribe = () => {
    if (tokens >= 99) {
      setTokens(prev => prev - 99);
      setIsSubscriber(true);
      showToast("Monthly All-Access Pass activated! All 31+ videos are now 100% free.");
      return true;
    } else {
      showToast(`You have ${tokens} tokens. 99 tokens needed for Monthly All-Access.`);
      setIsTokenStoreOpen(true);
      return false;
    }
  };

  const scrollToWorkouts = () => {
    const el = document.getElementById('workouts');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Launch Announcement Bar */}
      {showLaunchBanner && (
        <div style={{
          background: 'linear-gradient(90deg, #ff6b00 0%, #ff8a00 50%, #ea580c 100%)',
          color: '#fff',
          padding: '0.55rem 1rem',
          fontSize: '0.85rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 60,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'center', paddingRight: '2rem' }}>
            <Coins size={16} />
            <span>
              <strong>NEW:</strong> Watch any workout video for <strong>1 token</strong>, or subscribe to the <strong>Monthly All-Access Pass (99 tokens/mo)</strong> for unlimited free streaming!
            </span>
          </div>
          <button
            onClick={() => setShowLaunchBanner(false)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1100,
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

      {/* Navigation */}
      <Navbar 
        tokens={tokens}
        isSubscriber={isSubscriber}
        onOpenTokenStore={() => setIsTokenStoreOpen(true)}
        onOpenConsultation={() => handleOpenConsultation('1-on-1 Online Personal Training')}
      />

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <Hero 
          onExploreWorkouts={scrollToWorkouts}
          onOpenTokenStore={() => setIsTokenStoreOpen(true)}
          onOpenConsultation={() => handleOpenConsultation('1-on-1 Online Personal Training')}
        />

        <VideoGrid 
          onSelectVideo={handleWatchVideo}
          tokens={tokens}
          isSubscriber={isSubscriber}
          unlockedVideoIds={unlockedVideoIds}
        />

        <ServicesSection 
          onBookService={(serviceTitle) => handleOpenConsultation(serviceTitle)}
        />

        <TrainerProfile 
          onOpenConsultation={handleOpenConsultation}
        />

        <MembershipSection 
          isSubscriber={isSubscriber}
          tokens={tokens}
          onSubscribe={handleSubscribe}
          onOpenTokenStore={() => setIsTokenStoreOpen(true)}
          onExploreWorkouts={scrollToWorkouts}
        />
      </main>

      {/* Footer */}
      <Footer 
        onOpenTokenStore={() => setIsTokenStoreOpen(true)}
        onOpenConsultation={handleOpenConsultation}
      />

      {/* Modals */}
      {activeVideo && (
        <VideoModal 
          video={activeVideo}
          isSubscriber={isSubscriber}
          onClose={() => setActiveVideo(null)}
          onOpenConsultation={handleOpenConsultation}
        />
      )}

      {isTokenStoreOpen && (
        <TokenStoreModal 
          isOpen={isTokenStoreOpen}
          onClose={() => setIsTokenStoreOpen(false)}
          currentTokens={tokens}
          onAddTokens={handleAddTokens}
        />
      )}

      {isConsultationOpen && (
        <ConsultationModal 
          isOpen={isConsultationOpen}
          onClose={() => setIsConsultationOpen(false)}
          preselectedService={selectedService}
        />
      )}

    </div>
  );
}
