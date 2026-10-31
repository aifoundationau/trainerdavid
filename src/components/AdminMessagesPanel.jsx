import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Plus, 
  Users, 
  LogOut, 
  X,
  Coins
} from './Icons';
import { fetchMessages, sendDirectMessage, markMessageAsRead, updateCreatorMessageRate } from '../services/messagesApi';

export default function AdminMessagesPanel({
  user,
  isSuperAdmin,
  tokens = 0,
  onRefreshAppState,
  onOpenRechargeModal
}) {
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContactUid, setSelectedContactUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeRecipientUid, setComposeRecipientUid] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [myMessageRate, setMyMessageRate] = useState(1);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadMessagesData = async () => {
    try {
      const data = await fetchMessages();
      if (data && data.success) {
        setMessages(data.messages || []);
        setContacts(data.eligibleContacts || []);
        if (data.callerMessageTokenCost !== undefined) {
          setMyMessageRate(data.callerMessageTokenCost);
        }
      }
    } catch (err) {
      console.warn('[Messages Panel] Could not fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMyRate = async (newRate) => {
    const rate = Math.max(0, Math.round(Number(newRate) || 0));
    setIsUpdatingRate(true);
    try {
      await updateCreatorMessageRate(rate);
      setMyMessageRate(rate);
      showToast(rate === 0 
        ? 'Your direct message fee is now FREE (0 tokens)!' 
        : `Your direct message fee updated to ${rate} ${rate === 1 ? 'Token' : 'Tokens'}!`);
    } catch (err) {
      showToast(err.message || 'Failed to update message rate.');
    } finally {
      setIsUpdatingRate(false);
    }
  };

  useEffect(() => {
    loadMessagesData();
    const interval = setInterval(loadMessagesData, 15000); // Poll updates every 15s
    return () => clearInterval(interval);
  }, [user]);

  // Group messages by contact
  const currentUid = user?.uid || (isSuperAdmin ? 'ZK79FRQoVlYhsgvMibhi81dRUWj2' : '');

  // Calculate unique conversation threads
  const threadsMap = new Map();
  messages.forEach(msg => {
    const isSender = msg.senderUid === currentUid;
    const otherUid = isSender ? msg.creatorUid : msg.senderUid;
    const otherName = isSender ? (msg.creatorName || msg.creatorEmail || 'Recipient') : (msg.senderName || msg.senderEmail || 'Sender');
    const otherEmail = isSender ? msg.creatorEmail : msg.senderEmail;

    if (!threadsMap.has(otherUid)) {
      threadsMap.set(otherUid, {
        contactUid: otherUid,
        contactName: otherName,
        contactEmail: otherEmail,
        lastMessage: msg,
        unreadCount: (!isSender && !msg.read) ? 1 : 0,
        messages: [msg]
      });
    } else {
      const thread = threadsMap.get(otherUid);
      thread.messages.push(msg);
      if (!isSender && !msg.read) {
        thread.unreadCount += 1;
      }
    }
  });

  // Ensure eligible contacts without messages yet also appear or are available to start a conversation
  contacts.forEach(contact => {
    if (!threadsMap.has(contact.uid)) {
      threadsMap.set(contact.uid, {
        contactUid: contact.uid,
        contactName: contact.name,
        contactEmail: contact.email,
        contactRole: contact.role,
        lastMessage: null,
        unreadCount: 0,
        messages: [],
        reason: contact.reason
      });
    }
  });

  const threads = Array.from(threadsMap.values()).filter(t => {
    if (!searchFilter) return true;
    const q = searchFilter.toLowerCase();
    return (t.contactName || '').toLowerCase().includes(q) ||
           (t.contactEmail || '').toLowerCase().includes(q) ||
           t.messages.some(m => (m.message || '').toLowerCase().includes(q));
  });

  // Automatically select first thread if none selected
  const activeThread = threads.find(t => t.contactUid === selectedContactUid) || threads[0] || null;
  const activeContact = contacts.find(c => c.uid === activeThread?.contactUid);
  const activeCost = isSuperAdmin ? 0 : (activeContact?.messageTokenCost !== undefined ? activeContact.messageTokenCost : 1);
  const isCostFree = activeCost === 0;

  const handleSendMessage = async (e, recipientUid, text) => {
    if (e) e.preventDefault();
    const cleanText = (text || '').trim();
    if (!cleanText) {
      showToast('Please enter a message.');
      return;
    }
    if (!recipientUid) {
      showToast('Please select a recipient.');
      return;
    }

    const targetContact = contacts.find(c => c.uid === recipientUid);
    const requiredTokens = isSuperAdmin ? 0 : (targetContact?.messageTokenCost !== undefined ? targetContact.messageTokenCost : 1);

    if (!isSuperAdmin && requiredTokens > 0 && tokens < requiredTokens) {
      showToast(`You need at least ${requiredTokens} FitTokens to message this creator. Please recharge tokens.`);
      if (onOpenRechargeModal) onOpenRechargeModal();
      return;
    }

    setSending(true);
    try {
      const res = await sendDirectMessage({
        recipientUid,
        message: cleanText
      });

      if (res.success) {
        showToast(isSuperAdmin 
          ? 'Message sent (0 tokens, SuperAdmin free).' 
          : requiredTokens === 0 
            ? 'Message sent for free (0 tokens spent)!' 
            : `Message sent! (${requiredTokens} ${requiredTokens === 1 ? 'token' : 'tokens'} spent).`);
        setReplyText('');
        setComposeMessage('');
        setIsComposeOpen(false);
        await loadMessagesData();
        if (onRefreshAppState) onRefreshAppState();
      }
    } catch (err) {
      showToast(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleSelectThread = (contactUid) => {
    setSelectedContactUid(contactUid);
    // Mark unread messages in this thread as read
    const thread = threadsMap.get(contactUid);
    if (thread) {
      thread.messages.forEach(m => {
        if (m.creatorUid === currentUid && !m.read) {
          markMessageAsRead(m.id).catch(() => {});
        }
      });
    }
  };

  return (
    <div style={{ marginTop: '1rem' }} data-agent-id="admin-messages-panel">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'var(--accent-orange)',
          color: '#fff',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 10000,
          fontWeight: 700,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={16} />
          {toast}
        </div>
      )}

      {/* Header Banner */}
      <div className="card" style={{
        marginBottom: '1.25rem',
        background: 'linear-gradient(135deg, rgba(235, 94, 40, 0.12), rgba(20, 20, 20, 0.95))',
        border: '1px solid rgba(235, 94, 40, 0.35)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <MessageSquare size={22} color="var(--accent-orange)" />
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
              Community & Creator Messaging
            </h2>
            {isSuperAdmin && (
              <span className="badge badge-orange" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                SUPERADMIN MASTER (0 TOKENS)
              </span>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            {isSuperAdmin 
              ? 'SuperAdmin Master Access: You can message any platform member at any time for 0 tokens.'
              : 'Message creators and trainers once payment has been made (1 token per message sent).'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: 'rgba(0,0,0,0.4)',
            padding: '0.45rem 0.9rem',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem'
          }}>
            <Coins size={16} color="var(--accent-orange)" />
            <span style={{ color: 'var(--text-secondary)' }}>Balance:</span>
            <strong style={{ color: isSuperAdmin ? '#ff9e40' : '#fff' }}>
              {isSuperAdmin ? 'Unlimited (Free)' : `${tokens} Tokens`}
            </strong>
          </div>

          <button
            onClick={() => setIsComposeOpen(true)}
            data-testid="compose-message-button"
            className="btn btn-primary"
            style={{
              padding: '0.55rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.88rem'
            }}
          >
            <Plus size={16} />
            New Message
          </button>
        </div>
      </div>

      {/* Creator Direct Message Fee Settings Bar */}
      <div className="card" style={{
        marginBottom: '1.25rem',
        padding: '0.85rem 1.25rem',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚙️</span>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>
              Your Default Messaging Fee:{' '}
              <strong style={{ color: myMessageRate === 0 ? '#4ade80' : 'var(--accent-orange)' }}>
                {myMessageRate === 0 ? 'FREE (0 Tokens)' : `${myMessageRate} ${myMessageRate === 1 ? 'Token' : 'Tokens'}`}
              </strong>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              Choose how much members pay you to send a direct message (0 = Free to message you).
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          {[0, 1, 2, 5, 10].map(rate => (
            <button
              key={rate}
              type="button"
              disabled={isUpdatingRate}
              onClick={() => handleUpdateMyRate(rate)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: myMessageRate === rate ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.05)',
                color: myMessageRate === rate ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                opacity: isUpdatingRate ? 0.6 : 1
              }}
            >
              {rate === 0 ? '0 (Free)' : `${rate} ${rate === 1 ? 'Token' : 'Tokens'}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Interface */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 350px) 1fr',
        gap: '1.25rem',
        minHeight: '520px'
      }}>
        {/* Left Side: Threads & Contacts List */}
        <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Search Contacts */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.84rem'
              }}
            />
          </div>

          {/* Threads List */}
          <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Loading conversations...
              </div>
            ) : threads.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '8px',
                border: '1px dashed var(--border-subtle)'
              }}>
                <MessageSquare size={28} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <div>No message threads yet.</div>
                <div style={{ fontSize: '0.78rem', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                  {isSuperAdmin 
                    ? 'Click "New Message" to start a chat with any user.'
                    : 'Unlock a workout video or social post to message the creator!'}
                </div>
              </div>
            ) : (
              threads.map(thread => {
                const isSelected = activeThread?.contactUid === thread.contactUid;
                const lastMsg = thread.messages[0];
                return (
                  <div
                    key={thread.contactUid}
                    onClick={() => handleSelectThread(thread.contactUid)}
                    data-testid={`thread-item-${thread.contactUid}`}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isSelected 
                        ? 'rgba(235, 94, 40, 0.14)' 
                        : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected 
                        ? '1px solid var(--accent-orange)' 
                        : '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <strong style={{ fontSize: '0.88rem', color: isSelected ? 'var(--accent-orange)' : '#fff' }}>
                        {thread.contactName}
                      </strong>
                      {thread.unreadCount > 0 && (
                        <span style={{
                          background: 'var(--accent-orange)',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          borderRadius: '10px',
                          padding: '1px 6px'
                        }}>
                          {thread.unreadCount} new
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      {thread.contactEmail || thread.reason || 'Verified Member'}
                    </div>

                    {lastMsg ? (
                      <div style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {lastMsg.senderUid === currentUid ? 'You: ' : ''}{lastMsg.message}
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', fontStyle: 'italic' }}>
                        Ready to start chat • {thread.reason || 'Eligible Contact'}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Conversation Thread & Composer */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
          {activeThread ? (
            <>
              {/* Active Thread Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '0.85rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                      {activeThread.contactName}
                    </h3>
                    <span className="badge" style={{ fontSize: '0.7rem' }}>
                      {activeThread.contactEmail || 'Platform Member'}
                    </span>
                  </div>
                  {activeThread.reason && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', marginTop: '0.2rem' }}>
                      🔒 Connected via: {activeThread.reason}
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {isSuperAdmin ? (
                    <span style={{ color: '#ff9e40', fontWeight: 700 }}>Free (SuperAdmin Master)</span>
                  ) : isCostFree ? (
                    <span style={{ color: '#4ade80', fontWeight: 700 }}>🎉 Free to Message (0 Tokens)</span>
                  ) : (
                    <span>Cost: <strong style={{ color: 'var(--accent-orange)' }}>{activeCost} {activeCost === 1 ? 'Token' : 'Tokens'}</strong> per message</span>
                  )}
                </div>
              </div>

              {/* Message Bubbles History */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column-reverse',
                gap: '0.85rem',
                paddingRight: '0.35rem',
                marginBottom: '1rem',
                maxHeight: '400px'
              }}>
                {activeThread.messages.length === 0 ? (
                  <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No messages yet with {activeThread.contactName}. Type a message below to start the conversation!
                  </div>
                ) : (
                  activeThread.messages.map(msg => {
                    const isMe = msg.senderUid === currentUid;
                    return (
                      <div
                        key={msg.id}
                        data-testid={`message-bubble-${msg.id}`}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div style={{
                          maxWidth: '75%',
                          padding: '0.75rem 1rem',
                          borderRadius: '12px',
                          background: isMe 
                            ? 'var(--accent-orange)' 
                            : 'rgba(255, 255, 255, 0.08)',
                          color: '#fff',
                          border: isMe 
                            ? '1px solid rgba(255, 107, 0, 0.8)' 
                            : '1px solid var(--border-subtle)',
                          fontSize: '0.88rem',
                          lineHeight: 1.45,
                          wordBreak: 'break-word'
                        }}>
                          {/* Attached content reference */}
                          {(msg.videoTitle || msg.postTitle) && (
                            <div style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              marginBottom: '0.4rem',
                              paddingBottom: '0.35rem',
                              borderBottom: isMe ? '1px solid rgba(255,255,255,0.25)' : '1px solid rgba(255,255,255,0.1)',
                              color: isMe ? '#ffe2d1' : 'var(--accent-orange)'
                            }}>
                              {msg.videoTitle ? `🎬 Video: ${msg.videoTitle}` : `📸 Post: ${msg.postTitle}`}
                            </div>
                          )}

                          <div>{msg.message}</div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '0.35rem',
                            marginTop: '0.4rem',
                            fontSize: '0.68rem',
                            color: isMe ? 'rgba(255,255,255,0.75)' : 'var(--text-secondary)'
                          }}>
                            <span>
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {isMe && (
                              <span>• {msg.tokenCost === 0 ? 'Free (SuperAdmin)' : '1 Token'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Bottom Quick Reply Input */}
              <form 
                onSubmit={(e) => handleSendMessage(e, activeThread.contactUid, replyText)}
                style={{
                  display: 'flex',
                  gap: '0.65rem',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.65rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <input
                  type="text"
                  placeholder={`Write a message to ${activeThread.contactName}...`}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  maxLength={2000}
                  data-testid="message-reply-input"
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    padding: '0.35rem 0.5rem'
                  }}
                />

                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  data-testid="message-reply-send-button"
                  className="btn btn-primary"
                  style={{
                    padding: '0.55rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.84rem',
                    opacity: (sending || !replyText.trim()) ? 0.6 : 1
                  }}
                >
                  <Send size={14} />
                  {sending ? 'Sending...' : (isSuperAdmin ? 'Send (Free)' : isCostFree ? 'Send (Free to Message)' : `Send (${activeCost} Tokens)`)}
                </button>
              </form>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <MessageSquare size={48} style={{ opacity: 0.25, marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>No Active Conversation</h3>
              <p style={{ maxWidth: '400px', fontSize: '0.86rem', margin: '0 0 1rem 0' }}>
                {isSuperAdmin
                  ? 'As SuperAdmin, you can message any user at any time without tokens.'
                  : 'You can message any creator or trainer once payment has been made (unlocked a video or social post).'}
              </p>
              <button
                onClick={() => setIsComposeOpen(true)}
                className="btn btn-primary"
                style={{ fontSize: '0.86rem' }}
              >
                Start a New Message
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Compose New Message Modal */}
      {isComposeOpen && (
        <div className="modal-backdrop" onClick={() => setIsComposeOpen(false)}>
          <div 
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px', padding: '1.75rem' }}
            data-testid="compose-message-modal"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={20} color="var(--accent-orange)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>New Direct Message</h3>
              </div>
              <button 
                onClick={() => setIsComposeOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {(() => {
              const selectedRecipientContact = contacts.find(c => c.uid === composeRecipientUid);
              const selectedRecipientFee = isSuperAdmin ? 0 : (selectedRecipientContact?.messageTokenCost ?? 1);
              return (
                <form onSubmit={(e) => handleSendMessage(e, composeRecipientUid, composeMessage)}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                      Recipient
                    </label>
                    <select
                      value={composeRecipientUid}
                      onChange={(e) => setComposeRecipientUid(e.target.value)}
                      required
                      data-testid="compose-recipient-select"
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff',
                        fontSize: '0.88rem'
                      }}
                    >
                      <option value="" style={{ background: '#1c1c1c' }}>Select a recipient...</option>
                      {contacts.map(contact => (
                        <option key={contact.uid} value={contact.uid} style={{ background: '#1c1c1c' }}>
                          {contact.name} ({contact.email || contact.role}) • {contact.reason || 'Eligible'} • {contact.messageTokenCost === 0 ? 'Free' : `${contact.messageTokenCost || 1} Token${(contact.messageTokenCost || 1) > 1 ? 's' : ''}`}
                        </option>
                      ))}
                    </select>
                    {contacts.length === 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#ff9e40', marginTop: '0.35rem' }}>
                        ⚠️ No eligible recipients found yet. Unlocking a workout video or social post enables direct messaging with creators.
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                      Message (Max 2,000 characters)
                    </label>
                    <textarea
                      value={composeMessage}
                      onChange={(e) => setComposeMessage(e.target.value)}
                      required
                      maxLength={2000}
                      rows={4}
                      placeholder="Type your message here..."
                      data-testid="compose-message-textarea"
                      style={{
                        width: '100%',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: '#fff',
                        fontSize: '0.88rem',
                        resize: 'vertical'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      <span>
                        {isSuperAdmin 
                          ? '✨ SuperAdmin Master: 0 Tokens Spent' 
                          : (selectedRecipientFee === 0 
                              ? '✨ Free Direct Message (0 Tokens)' 
                              : `🪙 Cost: ${selectedRecipientFee} FitToken${selectedRecipientFee > 1 ? 's' : ''} (transfers to recipient)`)}
                      </span>
                      <span>{composeMessage.length} / 2,000</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setIsComposeOpen(false)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sending || !composeRecipientUid || !composeMessage.trim()}
                      data-testid="compose-submit-button"
                      className="btn btn-primary"
                      style={{
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        opacity: (sending || !composeRecipientUid || !composeMessage.trim()) ? 0.6 : 1
                      }}
                    >
                      <Send size={15} />
                      {sending ? 'Sending...' : (isSuperAdmin || selectedRecipientFee === 0 ? 'Send (Free)' : `Send (${selectedRecipientFee} Token${selectedRecipientFee > 1 ? 's' : ''})`)}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

