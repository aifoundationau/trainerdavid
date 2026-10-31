import React, { useState, useEffect } from 'react';
import { X, Lock, Coins, Check, ExternalLink, Instagram, Facebook, Send } from './Icons';
import { unlockSocialPost, messageSocialCreator } from '../services/socialApi';
import { isUserSuperAdmin } from '../data/adminStore';
import { getLocalSystemSettings } from '../services/systemSettings';

export default function SocialPostcardModal({
  post,
  isUnlocked,
  user,
  tokens,
  onClose,
  onUnlockSuccess,
  onTokensChanged,
  onOpenAuth
}) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState('');
  const [messageError, setMessageError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!post) return null;

  const isSuperAdmin = user ? (isUserSuperAdmin(user.email) && !user.isImpersonating) : false;
  const isTokenSystemOff = !getLocalSystemSettings().isTokenSystemEnabled;
  const isFree = Number(post.tokenCost) === 0 || isTokenSystemOff;
  const messageFee = (isSuperAdmin || isTokenSystemOff) ? 0 : (Number.isInteger(Number(post?.messageTokenCost)) ? Math.max(0, Number(post.messageTokenCost)) : 1);
  const canView = isSuperAdmin || isUnlocked || isFree || isTokenSystemOff;
  const isInstagram = post.platform === 'instagram';

  const handleUnlock = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (!isSuperAdmin && !isFree && (tokens || 0) < (post.tokenCost || 1)) {
      setUnlockError(`You need at least ${post.tokenCost || 1} tokens to unlock this social post.`);
      return;
    }

    setIsUnlocking(true);
    setUnlockError('');
    try {
      const res = await unlockSocialPost(post.id);
      if (onUnlockSuccess) onUnlockSuccess(post.id);
      if (typeof onTokensChanged === 'function' && typeof res.balance === 'number') {
        onTokensChanged(res.balance);
      }
    } catch (err) {
      setUnlockError(err.message || 'Failed to unlock post.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) {
      setMessageError('Please enter a message for the creator.');
      return;
    }
    if (!isSuperAdmin && messageFee > 0 && (tokens || 0) < messageFee) {
      setMessageError(`You need at least ${messageFee} token${messageFee > 1 ? 's' : ''} to message the creator.`);
      return;
    }

    setIsSendingMessage(true);
    setMessageError('');
    setMessageSuccess('');
    try {
      const res = await messageSocialCreator({ postId: post.id, message: messageText });
      setMessageSuccess(res.message || 'Message delivered to creator!');
      setMessageText('');
      if (!isSuperAdmin && typeof onTokensChanged === 'function' && typeof res.balance === 'number') {
        onTokensChanged(res.balance);
      }
    } catch (err) {
      setMessageError(err.message || 'Failed to send message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div 
      className="modal-backdrop" 
      onClick={onClose}
      data-testid="social-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        background: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(14px)',
        overflowY: 'auto'
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '100%',
          margin: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          background: '#0d111c',
          border: isInstagram ? '1px solid rgba(225, 48, 108, 0.35)' : '1px solid rgba(24, 119, 242, 0.35)',
          boxShadow: isInstagram 
            ? '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 35px rgba(225, 48, 108, 0.15)' 
            : '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 35px rgba(24, 119, 242, 0.15)'
        }}
      >
        {/* Close Button */}
        <div style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 30 }}>
          <button 
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Postcard Header Ribbon */}
        <div style={{
          padding: '1rem 1.4rem',
          background: isInstagram 
            ? 'linear-gradient(135deg, rgba(131,58,180,0.3) 0%, rgba(253,29,29,0.3) 50%, rgba(252,176,69,0.3) 100%)' 
            : 'linear-gradient(135deg, rgba(24,119,242,0.3) 0%, rgba(13,71,161,0.3) 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: isInstagram 
                ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' 
                : '#1877f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff'
            }}>
              {isInstagram ? <Instagram size={18} /> : <Facebook size={18} />}
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
                {isInstagram ? 'Instagram Postcard' : 'Facebook Postcard'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                By {post.author} • {new Date(post.createdAt || Date.now()).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '40px' }}>
            {canView ? (
              <span className="badge badge-lime" style={{ fontSize: '0.74rem' }}>
                <Check size={12} strokeWidth={2.5} />
                <span>{isSuperAdmin ? '🔥 SuperAdmin Master Access' : (isFree ? '🎉 Free to View' : 'Unlocked')}</span>
              </span>
            ) : (
              <span className="badge badge-orange" style={{ fontSize: '0.74rem' }}>
                <Coins size={12} />
                <span>{post.tokenCost || 1} {post.tokenCost === 1 ? 'Token' : 'Tokens'} to Unlock</span>
              </span>
            )}
          </div>
        </div>

        {/* Media Preview / Locked Overlay */}
        <div style={{ position: 'relative', width: '100%', height: '280px', background: '#07090e', overflow: 'hidden' }}>
          <img 
            src={post.thumbnailUrl} 
            alt={post.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: canView ? 'none' : 'blur(10px) brightness(0.65)',
              transform: canView ? 'none' : 'scale(1.05)',
              transition: 'all 0.3s ease'
            }}
          />

          {/* If Locked, overlay lock CTA */}
          {!canView && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.65)',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(255, 107, 0, 0.2)',
                border: '1px solid rgba(255, 107, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-orange)',
                marginBottom: '0.85rem'
              }}>
                <Lock size={26} />
              </div>

              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
                Unlock Social Postcard for 1 Token
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '1rem', lineHeight: 1.5 }}>
                Spend 1 FitToken to reveal the full post, creator technique notes, and unlock direct 1-on-1 creator messaging.
              </p>

              {unlockError && (
                <div style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                  {unlockError}
                </div>
              )}

              <button
                onClick={handleUnlock}
                disabled={isUnlocking}
                className="btn-primary"
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem', gap: '0.5rem' }}
              >
                <Coins size={15} />
                <span>{isUnlocking ? 'Unlocking…' : 'Unlock Post (1 Token)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Post Content */}
        <div style={{ padding: '1.4rem 1.6rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.65rem' }}>
            {post.title}
          </h2>

          <p style={{
            fontSize: '0.92rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.65,
            marginBottom: '1.25rem',
            whiteSpace: 'pre-line'
          }}>
            {canView ? post.caption : `${post.caption.slice(0, 90)}... [Unlock to read complete coaching breakdown]`}
          </p>

          {/* Tags */}
          {Array.isArray(post.tags) && post.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
              {post.tags.map((tag, idx) => (
                <span key={idx} className="badge" style={{ fontSize: '0.72rem' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Locked Notice for Messaging */}
          {!canView && (
            <div 
              data-testid="message-social-locked-notice"
              style={{
                background: 'rgba(255, 107, 0, 0.05)',
                border: '1px dashed rgba(255, 107, 0, 0.35)',
                borderRadius: '12px',
                padding: '0.85rem 1.15rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              <Lock size={16} color="var(--accent-orange)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.86rem', color: '#ffbe8a' }}>
                <strong style={{ color: '#fff' }}>Creator Q&A:</strong> You must unlock this post before you can message the creator.
              </div>
            </div>
          )}

          {/* Message Creator Form (when unlocked) */}
          {canView && (
            <div style={{
              background: isSuperAdmin ? 'rgba(34, 197, 94, 0.06)' : 'rgba(255, 107, 0, 0.05)',
              border: isSuperAdmin ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255, 107, 0, 0.25)',
              borderRadius: '14px',
              padding: '1rem 1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>
                    <Coins size={15} color={isSuperAdmin || messageFee === 0 ? '#22c55e' : '#f59e0b'} />
                    <span>{isSuperAdmin ? 'Message Creator (Free • SuperAdmin Master Access)' : (messageFee === 0 ? 'Message Creator (Free)' : `Message Creator for ${messageFee} Token${messageFee > 1 ? 's' : ''}`)}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {isSuperAdmin 
                      ? 'SuperAdmin master access: You can message any creator with 0 tokens spent.' 
                      : (messageFee === 0 
                          ? `Direct messaging with ${post.author || 'the creator'} is free for this post.` 
                          : `People who unlock this post can message ${post.author || 'the creator'} for ${messageFee} token${messageFee > 1 ? 's' : ''}.`)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMessageForm(!showMessageForm)}
                  className="btn-secondary"
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: showMessageForm ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.06)',
                    color: '#fff',
                    borderColor: showMessageForm ? 'var(--accent-orange)' : 'var(--border-subtle)'
                  }}
                >
                  <Coins size={12} color={isSuperAdmin || messageFee === 0 ? '#22c55e' : '#f59e0b'} />
                  <span>{showMessageForm ? 'Cancel' : (isSuperAdmin || messageFee === 0 ? 'Message Creator (Free)' : `Message Creator (${messageFee} Token${messageFee > 1 ? 's' : ''})`)}</span>
                </button>
              </div>

              {showMessageForm && (
                <form onSubmit={handleSendMessage} style={{ marginTop: '0.85rem' }}>
                  <textarea
                    rows={3}
                    placeholder={`Ask ${post.author || 'the creator'} a question about this post...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      background: '#07090e',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '0.88rem',
                      resize: 'vertical'
                    }}
                  />

                  {messageError && (
                    <div style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                      {messageError}
                    </div>
                  )}

                  {messageSuccess && (
                    <div style={{ color: '#22c55e', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                      ✓ {messageSuccess}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.6rem' }}>
                    <button
                      type="submit"
                      disabled={isSendingMessage}
                      className="btn-primary"
                      style={{ padding: '0.42rem 1rem', fontSize: '0.8rem', gap: '0.4rem' }}
                    >
                      <Send size={13} />
                      <span>{isSendingMessage ? 'Sending…' : (isSuperAdmin || messageFee === 0 ? 'Send Question (Free)' : `Send Question (${messageFee} Token${messageFee > 1 ? 's' : ''})`)}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Action Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
            paddingTop: '0.9rem',
            borderTop: '1px solid var(--border-subtle)'
          }}>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{
                padding: '0.5rem 0.95rem',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                textDecoration: 'none'
              }}
            >
              <ExternalLink size={13} />
              <span>Open on {isInstagram ? 'Instagram ↗' : 'Facebook ↗'}</span>
            </a>

            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '0.5rem 1.1rem', fontSize: '0.82rem' }}
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

