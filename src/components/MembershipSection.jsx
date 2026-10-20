import React, { useState } from 'react';
import { ShieldCheck, Check, Sparkles, Lock, Coins, Crown, CheckCircle2, CreditCard, StripeIcon } from './Icons';
import { membershipTiers } from '../data/services';
import { startStripeCheckout } from '../utils/stripeCheckout';

export default function MembershipSection({ 
  user, 
  isSubscriber, 
  tokens, 
  onSubscribeWithTokens, 
  onOpenTokenStore, 
  onExploreWorkouts 
}) {
  const tier = membershipTiers[0];
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  const handleStripeSubscribe = async () => {
    setIsRedirecting(true);
    try {
      await startStripeCheckout({ packageId: 'monthly-pass', user });
    } catch (err) {
      alert(err.message || "Failed to launch Stripe Checkout.");
      setIsRedirecting(false);
    }
  };

  const handleTokenSubscribe = () => {
    if (isSubscriber) {
      onExploreWorkouts();
      return;
    }
    if (tokens < 99) {
      if (onOpenTokenStore) onOpenTokenStore();
      return;
    }

    if (onSubscribeWithTokens) {
      const success = onSubscribeWithTokens();
      if (success) {
        setSubscribeSuccess(true);
        setTimeout(() => setSubscribeSuccess(false), 3000);
      }
    }
  };

  return (
    <section id="membership" style={{ padding: '4.5rem 0', position: 'relative' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 2.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <span className="badge badge-orange">
              <Crown size={13} />
              <span>Membership</span>
            </span>
            <span className="badge badge-lime">
              <span>All Videos Free For Subscribers</span>
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)',
            fontWeight: 800,
            marginBottom: '0.85rem',
            color: '#fff'
          }}>
            MONTHLY ALL-ACCESS PASS
          </h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Individual videos cost 1 token each. Subscribe to the Monthly All-Access Pass for $99 USD/month (or 99 FitTokens) and stream every single tutorial completely free with zero deductions.
          </p>
        </div>

        {/* Pricing Card Centerpiece */}
        <div style={{
          maxWidth: '640px',
          margin: '0 auto',
          background: 'linear-gradient(145deg, rgba(22, 27, 40, 0.9) 0%, rgba(13, 16, 24, 0.95) 100%)',
          border: isSubscriber ? '2px solid var(--accent-lime)' : '2px solid rgba(255, 107, 0, 0.4)',
          borderRadius: '24px',
          padding: 'clamp(1.75rem, 4vw, 2.75rem)',
          boxShadow: isSubscriber ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 229, 153, 0.2)' : '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(255, 107, 0, 0.2)',
          position: 'relative'
        }}>
          {/* Top Banner Tag */}
          <div style={{
            position: 'absolute',
            top: '-13px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: isSubscriber ? 'linear-gradient(135deg, #00e599 0%, #059669 100%)' : 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)',
            color: isSubscriber ? '#000' : '#fff',
            fontWeight: 800,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            padding: '4px 16px',
            borderRadius: 'var(--radius-full)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
            whiteSpace: 'nowrap'
          }}>
            {isSubscriber ? '⭐ Active Subscription' : '👑 $99 USD / Month'}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                {tier.name}
              </h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--accent-orange)', fontWeight: 600 }}>
                Unlimited Access to All 31+ Workout Masterclasses
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#00e599' }}>
                $99
              </span>
              <span style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                USD / mo
              </span>
            </div>
          </div>

          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.75rem' }}>
            {tier.description}
          </p>

          {/* Features bullet list */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            marginBottom: '2rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.25rem'
          }}>
            {(tier.features || []).map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '0.9rem', color: '#fff' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(0, 229, 153, 0.15)',
                  color: 'var(--accent-lime)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Check size={13} strokeWidth={3} />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Success banner if subscribed */}
          {subscribeSuccess && (
            <div style={{
              background: 'rgba(0, 229, 153, 0.15)',
              border: '1px solid rgba(0, 229, 153, 0.4)',
              color: '#00e599',
              padding: '0.75rem',
              borderRadius: '12px',
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircle2 size={18} />
              <span>Subscription activated! All 31+ videos are now 100% free to stream.</span>
            </div>
          )}

          {/* CTA Buttons */}
          {isSubscriber ? (
            <button
              onClick={onExploreWorkouts}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.95rem',
                fontSize: '1rem',
                marginBottom: '1.25rem',
                background: 'linear-gradient(135deg, #00e599 0%, #059669 100%)',
                boxShadow: '0 4px 20px rgba(0, 229, 153, 0.35)'
              }}
            >
              <CheckCircle2 size={18} />
              <span>Subscribed: Watch Any Video Free</span>
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {/* Primary Stripe Button */}
              <button
                onClick={handleStripeSubscribe}
                disabled={isRedirecting}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1.02rem',
                  background: 'linear-gradient(135deg, #635bff 0%, #4338ca 100%)',
                  boxShadow: '0 4px 20px rgba(99, 91, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem'
                }}
              >
                <StripeIcon size={22} />
                <span>{isRedirecting ? "Connecting to Stripe..." : "Subscribe with Stripe ($99 USD / mo)"}</span>
              </button>

              {/* Alternative: Subscribe with tokens */}
              <button
                onClick={handleTokenSubscribe}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.88rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <Coins size={16} color="#f59e0b" />
                <span>
                  {tokens >= 99 
                    ? 'Or Activate with 99 Tokens' 
                    : `Or Activate with 99 Tokens (Current: ${tokens})`}
                </span>
              </button>
            </div>
          )}

          {/* Access Note */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <Lock size={15} color="var(--accent-lime)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#fff' }}>Secure Checkout & No Lock-in:</strong> Processed through Stripe's 256-bit encrypted checkout. Card, Apple Pay & Google Pay supported. Cancel anytime with 1-click.
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
