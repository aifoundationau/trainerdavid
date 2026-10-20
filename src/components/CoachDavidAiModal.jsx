import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  Play, 
  Dumbbell, 
  ShieldCheck, 
  Activity, 
  Utensils, 
  Zap,
  MessageSquare
} from './Icons';
import { askCoachDavidAi } from '../utils/geminiAi';
import { videoLibrary } from '../data/videos';

const SUGGESTED_PROMPTS = [
  "🔥 Recommend an upper body hypertrophy workout",
  "🩹 I have lower back soreness, what should I avoid?",
  "🥩 How do I calculate my daily protein & calorie targets?",
  "⚡ What are the best exercises for explosive power?"
];

export default function CoachDavidAiModal({ 
  isOpen, 
  onClose, 
  user, 
  onSelectVideo, 
  onOpenConsultation 
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'coach',
      text: `G'day ${user?.name ? user.name : 'there'}! I'm **Coach David AI**, grounded with Google Gemini Flash RAG across our 31+ workout masterclasses, biomechanics guides, and injury rehab protocols. 

Ask me anything about exercise technique, muscle programming, nutrition, or injury management!`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await askCoachDavidAi({
        userMessage: query,
        chatHistory: messages,
        user
      });

      const coachMsg = {
        id: `coach-${Date.now()}`,
        sender: 'coach',
        text: response.text
      };

      setMessages(prev => [...prev, coachMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev, 
        {
          id: `err-${Date.now()}`,
          sender: 'coach',
          text: `⚠️ **Connection issue:** ${err.message || 'Unable to connect to Gemini AI service. Please verify your API key.'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse [VIDEO:id:title] tokens in AI message text
  const renderMessageContent = (text) => {
    const videoRegex = /\[VIDEO:([a-zA-Z0-9_-]{11}):([^\]]+)\]/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = videoRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }

      const videoId = match[1];
      const videoTitle = match[2];
      const videoObj = videoLibrary.find(v => v.id === videoId);

      parts.push({
        type: 'video',
        videoId,
        videoTitle,
        videoObj
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    if (parts.length === 0) {
      return <div>{text}</div>;
    }

    return (
      <div>
        {parts.map((p, idx) => {
          if (p.type === 'text') {
            return (
              <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>
                {p.content}
              </span>
            );
          }

          if (p.type === 'video') {
            return (
              <div 
                key={idx}
                onClick={() => {
                  if (p.videoObj && onSelectVideo) {
                    onSelectVideo(p.videoObj);
                  }
                }}
                style={{
                  margin: '0.85rem 0',
                  background: 'rgba(255, 107, 0, 0.08)',
                  border: '1px solid rgba(255, 107, 0, 0.35)',
                  borderRadius: '12px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ position: 'relative', width: '64px', height: '42px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden' }}>
                  <img 
                    src={`https://i.ytimg.com/vi/${p.videoId}/hqdefault.jpg`} 
                    alt={p.videoTitle}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Play size={14} fill="#fff" />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-orange)', fontWeight: 800, textTransform: 'uppercase' }}>
                    Recommended Video
                  </div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.videoTitle}
                  </div>
                </div>

                <span className="badge badge-orange" style={{ fontSize: '0.7rem', flexShrink: 0 }}>
                  Watch Tutorial
                </span>
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '720px',
          height: '85vh',
          maxHeight: '740px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0e121d 0%, #07090f 100%)',
          border: '1px solid rgba(255, 107, 0, 0.35)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 107, 0, 0.15)'
        }}
      >
        {/* Chat Header */}
        <div style={{
          padding: '1.1rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(15, 20, 32, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(255, 107, 0, 0.3)'
            }}>
              <Dumbbell size={22} strokeWidth={2.4} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Coach David AI
                </h3>
                <span className="badge badge-lime" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                  Gemini Flash RAG
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00e599', display: 'inline-block' }} />
                <span>Online • 31+ Workout Masterclasses Ingested</span>
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
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Feed */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div 
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  gap: '0.75rem',
                  maxWidth: '100%'
                }}
              >
                {!isUser && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <Dumbbell size={16} />
                  </div>
                )}

                <div style={{
                  maxWidth: '82%',
                  padding: '0.85rem 1.1rem',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isUser ? 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)' : 'rgba(255, 255, 255, 0.05)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  lineHeight: 1.55,
                  boxShadow: isUser ? '0 4px 15px rgba(255, 107, 0, 0.25)' : 'none'
                }}>
                  {renderMessageContent(msg.text)}
                </div>

                {isUser && user && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    overflow: 'hidden',
                    marginTop: '2px'
                  }}>
                    {user.picture ? (
                      <img src={user.picture} alt="" style={{ width: '100%', height: '100%' }} />
                    ) : (
                      user.name?.charAt(0) || 'U'
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ff6b00 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0
              }}>
                <Sparkles size={16} />
              </div>
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '16px 16px 16px 4px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.84rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span className="loading-spinner" style={{ width: '14px', height: '14px' }} />
                <span>Coach David AI is retrieving biomechanics from catalog...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pill Carousel */}
        <div style={{
          padding: '0.5rem 1.25rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          background: 'rgba(10, 13, 20, 0.8)',
          display: 'flex',
          gap: '0.5rem',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={isLoading}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.75rem',
                color: 'var(--text-secondary)',
                fontSize: '0.76rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-orange)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          style={{
            padding: '1rem 1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(12, 16, 26, 0.98)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexShrink: 0
          }}
        >
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about workouts, form cues, injury rehab, or nutrition..."
            disabled={isLoading}
            style={{
              flex: 1,
              background: '#090b12',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="btn-primary"
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              opacity: (!inputValue.trim() || isLoading) ? 0.6 : 1
            }}
          >
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>

      </div>
    </div>
  );
}
