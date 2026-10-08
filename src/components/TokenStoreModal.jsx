import React, { useState } from 'react';
import { X, Coins, Sparkles, ShieldCheck, Check, CreditCard, Lock, ArrowRight } from './Icons';
import { tokenPackages } from '../data/services';

export default function TokenStoreModal({ isOpen, onClose, currentTokens, onAddTokens }) {
  const [selectedPack, setSelectedPack] = useState(tokenPackages[1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddPackTokens = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPurchaseSuccess(true);
      const bonusTokens = selectedPack.id === 'pro' ? 15 : selectedPack.id === 'elite' ? 50 : 0;
      onAddTokens(selectedPack.tokens + bonusTokens);
      setTimeout(() => {
        setPurchaseSuccess(false);
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', padding: '2rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              fontWeight: 900
            }}>
              <Coins size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>FitToken Store</h2>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Current Balance: <strong style={{ color: '#f59e0b' }}>{currentTokens} Tokens</strong>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Value explanation */}
        <div style={{
          background: 'rgba(255, 107, 0, 0.08)',
          border: '1px solid rgba(255, 107, 0, 0.25)',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          marginBottom: '1.75rem',
          fontSize: '0.88rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5
        }}>
          FitTokens give you flexible on-demand workout access. Watch any video masterclass for <strong>1 token</strong>, or subscribe to the <strong>Monthly All-Access Pass for 99 tokens/month</strong> for unlimited free streaming of all 31+ workouts.
        </div>

        {/* Packages Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {tokenPackages.map((pack) => {
            const isSelected = selectedPack.id === pack.id;
            return (
              <div
                key={pack.id}
                onClick={() => setSelectedPack(pack)}
                style={{
                  background: isSelected ? 'rgba(255, 107, 0, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '2px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                  borderRadius: '16px',
                  padding: '1.25rem',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {pack.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--accent-orange)',
                    color: '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)'
                  }}>
                    Most Popular
                  </div>
                )}

                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                  {pack.name}
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', margin: '0.5rem 0' }}>
                  <span style={{ fontSize: '1.75rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff' }}>
                    ${pack.price}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>USD</span>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  color: '#f59e0b',
                  marginBottom: '0.5rem'
                }}>
                  <Coins size={16} />
                  <span>{pack.tokens} Tokens</span>
                </div>

                {pack.bonus && (
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-lime)',
                    fontWeight: 700,
                    marginBottom: '0.5rem'
                  }}>
                    {pack.bonus}
                  </div>
                )}

                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, flexGrow: 1 }}>
                  {pack.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Token Activation Notice */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)'
        }}>
          <Lock size={18} color="var(--accent-lime)" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#fff' }}>Instant Token Activation:</strong> Select your package below to instantly add tokens to your balance, watch video tutorials (1 token each), or activate your 99 tokens/month All-Access Pass.
          </div>
        </div>

        {/* Purchase Action Button */}
        {purchaseSuccess ? (
          <div style={{
            background: 'rgba(0, 229, 153, 0.15)',
            border: '1px solid rgba(0, 229, 153, 0.4)',
            color: '#00e599',
            padding: '1rem',
            borderRadius: '12px',
            textAlign: 'center',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <Check size={20} />
            <span>Success! Tokens added to your account balance.</span>
          </div>
        ) : (
          <button
            onClick={handleAddPackTokens}
            disabled={isProcessing}
            className="btn-primary"
            style={{ width: '100%', padding: '0.95rem', fontSize: '1rem' }}
          >
            {isProcessing ? (
              <span>Activating Tokens...</span>
            ) : (
              <>
                <Coins size={18} />
                <span>Get {selectedPack.tokens} Tokens (${selectedPack.price})</span>
              </>
            )}
          </button>
        )}

      </div>
    </div>
  );
}
