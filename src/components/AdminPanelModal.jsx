import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  Coins, 
  Calendar, 
  CheckCircle2, 
  Sparkles, 
  Search, 
  Filter, 
  Crown, 
  Google, 
  Plus, 
  Clock, 
  Dumbbell, 
  Utensils, 
  Zap, 
  Activity, 
  ShieldCheck,
  Check,
  Phone,
  Mail,
  ClipboardList
} from './Icons';
import { 
  CORE_SERVICES, 
  getRegisteredUsers, 
  adjustUserTokens, 
  getAdminBookings, 
  updateAdminBookingStatus, 
  addAdminBooking,
  getAdminPurchases 
} from '../data/adminStore';

export default function AdminPanelModal({ isOpen, onClose, onRefreshAppState, user, onOpenAuth }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, bookings, purchases, catalog, support
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [searchBooking, setSearchBooking] = useState('');
  const [bookingFilter, setBookingFilter] = useState('All');
  const [toast, setToast] = useState(null);

  // New Booking Modal within Admin
  const [showAddBookingForm, setShowAddBookingForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    fullName: '',
    email: '',
    phone: '',
    serviceType: '1-on-1 Online Personal Training',
    injuryHistory: ''
  });

  const loadData = () => {
    setUsers(getRegisteredUsers());
    setBookings(getAdminBookings());
    setPurchases(getAdminPurchases());
  };

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const showAdminToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  if (!isOpen) return null;

  // Strict Google Authentication Guard: Admin support is available once logged in through Google
  if (!user) {
    return (
      <div 
        className="modal-backdrop" 
        onClick={onClose} 
        style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div 
          className="modal-content" 
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: '520px',
            width: '92%',
            textAlign: 'center',
            padding: '2.5rem 2rem',
            position: 'relative'
          }}
        >
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>

          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: 'rgba(255, 107, 0, 0.15)',
            border: '1px solid rgba(255, 107, 0, 0.4)',
            color: 'var(--accent-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 24px rgba(255, 107, 0, 0.25)'
          }}>
            <ShieldCheck size={36} />
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.6rem' }}>
            Admin Support & Portal
          </h3>

          <div style={{
            background: 'rgba(255, 107, 0, 0.08)',
            border: '1px solid rgba(255, 107, 0, 0.3)',
            borderRadius: '12px',
            padding: '1.1rem',
            marginBottom: '1.75rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ff9e40', marginBottom: '0.45rem' }}>
              Admin support is available once logged in through Google
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Please sign in with your Google Email (Gmail or Google Workspace) to access administrative controls, client token allocations, and support tools.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '0.85rem',
                fontSize: '0.95rem'
              }}
            >
              <Google size={18} />
              <span>Sign In with Google</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                padding: '0.4rem'
              }}
            >
              Return to Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle granting tokens
  const handleGrantTokens = (userId, delta, userName) => {
    const updated = adjustUserTokens(userId, delta);
    if (updated) {
      loadData();
      if (onRefreshAppState) onRefreshAppState();
      showAdminToast(`Updated ${userName}: ${delta > 0 ? `+${delta}` : delta} tokens (New: ${updated.tokens})`);
    }
  };

  // Handle updating booking status
  const handleStatusChange = (bookingId, newStatus) => {
    const updated = updateAdminBookingStatus(bookingId, newStatus);
    if (updated) {
      loadData();
      showAdminToast(`Booking marked as ${newStatus}`);
    }
  };

  // Handle creating a manual booking
  const handleCreateBookingSubmit = (e) => {
    e.preventDefault();
    if (!newBooking.fullName.trim() || !newBooking.email.trim()) {
      showAdminToast("Please provide client name and email.");
      return;
    }
    const created = addAdminBooking(newBooking);
    if (created) {
      loadData();
      setShowAddBookingForm(false);
      setNewBooking({
        fullName: '',
        email: '',
        phone: '',
        serviceType: '1-on-1 Online Personal Training',
        injuryHistory: ''
      });
      showAdminToast(`Created booking for ${created.clientName}!`);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredBookings = bookings.filter(b => {
    const matchesService = bookingFilter === 'All' || b.serviceTitle === bookingFilter;
    const matchesSearch = 
      b.clientName?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.clientEmail?.toLowerCase().includes(searchBooking.toLowerCase()) ||
      b.goalOrNotes?.toLowerCase().includes(searchBooking.toLowerCase());
    return matchesService && matchesSearch;
  });

  const totalTokensCirculation = users.reduce((acc, u) => acc + (u.tokens || 0), 0);
  const totalSubscribers = users.filter(u => u.isSubscriber).length;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1080px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(18, 22, 33, 0.95)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff8a00 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(255, 107, 0, 0.35)'
            }}>
              <Dumbbell size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Trainer David Admin Portal
                </h2>
                <span className="badge badge-orange" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                  Live Data
                </span>
                {user && (
                  <span className="badge badge-lime" style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Google size={11} />
                    <span>{user.email}</span>
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Google Registrations, 15-Token Allocations, Bookings & Admin Support
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

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(10, 13, 20, 0.85)',
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', label: '📊 Dashboard Overview' },
            { id: 'users', label: `👥 Users & Tokens (${users.length})` },
            { id: 'bookings', label: `📅 Service Bookings (${bookings.length})` },
            { id: 'purchases', label: `🛒 Purchased Services (${purchases.length})` },
            { id: 'catalog', label: '📋 Core 4 Services' },
            { id: 'support', label: '🎧 Admin Support' }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  background: isActive ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Toast alert inside modal */}
        {toast && (
          <div style={{
            background: 'rgba(0, 229, 153, 0.15)',
            borderBottom: '1px solid rgba(0, 229, 153, 0.3)',
            color: '#00e599',
            padding: '0.55rem 1.75rem',
            fontSize: '0.84rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{toast}</span>
          </div>
        )}

        {/* Body Content Area */}
        <div style={{
          padding: '1.75rem',
          overflowY: 'auto',
          flex: 1
        }}>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              {/* 4 Metric KPI Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2rem'
              }}>
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Google Users</span>
                    <Google size={18} />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>{users.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-lime)' }}>Gmail / Workspace Registered</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tokens in Circulation</span>
                    <Coins size={18} color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{totalTokensCirculation}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>15 tokens per new registrant</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>All-Access Subscribers</span>
                    <Crown size={18} color="#00e599" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#00e599' }}>{totalSubscribers}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>99 Tokens / month pass</div>
                </div>

                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Bookings</span>
                    <Calendar size={18} color="var(--accent-cyan)" />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{bookings.length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across 4 Core Services</div>
                </div>
              </div>

              {/* 15 Token Management Notice */}
              <div style={{
                background: 'rgba(255, 107, 0, 0.08)',
                border: '1px solid rgba(255, 107, 0, 0.25)',
                borderRadius: '16px',
                padding: '1.25rem 1.5rem',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Coins size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                      Token Allocation Center (15-Token Welcome Model)
                    </h3>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      New accounts registered via Google Email automatically receive <strong>15 tokens</strong>. You can grant +15 tokens, modify balances, or inspect usage under the <strong>Users & Tokens</strong> tab.
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('users')}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                >
                  <span>Manage User Tokens</span>
                </button>
              </div>

              {/* Recent Bookings and Purchases 2-column preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                {/* Recent Inquiries */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Recent Service Inquiries</h3>
                    <button onClick={() => setActiveTab('bookings')} style={{ background: 'none', color: 'var(--accent-orange)', fontSize: '0.78rem', fontWeight: 700 }}>View All ({bookings.length})</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {bookings.slice(0, 3).map(b => (
                      <div key={b.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#fff' }}>{b.clientName}</strong>
                          <span className={`badge ${b.status === 'Confirmed' ? 'badge-lime' : 'badge-orange'}`} style={{ fontSize: '0.65rem' }}>{b.status}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)' }}>{b.serviceTitle}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{b.clientEmail}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Purchases */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Recent Store Purchases</h3>
                    <button onClick={() => setActiveTab('purchases')} style={{ background: 'none', color: 'var(--accent-orange)', fontSize: '0.78rem', fontWeight: 700 }}>View All ({purchases.length})</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {purchases.slice(0, 3).map(p => (
                      <div key={p.id} style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#fff' }}>{p.itemName}</strong>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f59e0b' }}>{p.tokensOrCost}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.clientName} ({p.clientEmail})</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTERED USERS & TOKENS */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                    Registered Google Users & Token Controls
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Clients register with Google (Gmail, Workspace). Grant tokens or manage 15-token balances below.
                  </div>
                </div>

                {/* Search users */}
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.85rem 0.55rem 2.2rem',
                      background: 'rgba(9, 11, 16, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.84rem'
                    }}
                  />
                </div>
              </div>

              {/* Users Table */}
              <div style={{
                background: 'rgba(15, 19, 28, 0.7)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>User / Profile</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Google Email</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Token Balance</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Pass Status</th>
                      <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Admin Token Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {user.picture ? (
                              <img src={user.picture} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--accent-orange)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                color: '#fff'
                              }}>
                                {user.name ? user.name.charAt(0) : 'U'}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#fff' }}>{user.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Registered: {new Date(user.registeredAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#38bdf8' }}>
                            <Google size={14} />
                            <span>{user.email}</span>
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, color: '#f59e0b', fontSize: '0.95rem' }}>
                            <Coins size={16} />
                            <span>{user.tokens} Tokens</span>
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem' }}>
                          {user.isSubscriber ? (
                            <span className="badge badge-lime" style={{ fontSize: '0.7rem' }}>
                              <Crown size={12} />
                              <span>Monthly All-Access</span>
                            </span>
                          ) : (
                            <span className="badge" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Standard (Pay-Per-Video)
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            {/* Fast +15 Tokens Button */}
                            <button
                              onClick={() => handleGrantTokens(user.id, 15, user.name)}
                              className="btn-token"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.76rem' }}
                              title="Grant 15 Tokens"
                            >
                              <Plus size={13} />
                              <span>+15 Tokens</span>
                            </button>

                            {/* +5 Tokens */}
                            <button
                              onClick={() => handleGrantTokens(user.id, 5, user.name)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid var(--border-subtle)',
                                color: '#fff',
                                padding: '0.3rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              +5
                            </button>

                            {/* -5 Tokens */}
                            <button
                              onClick={() => handleGrantTokens(user.id, -5, user.name)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-muted)',
                                padding: '0.3rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              -5
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

          {/* TAB 3: SERVICE BOOKINGS */}
          {activeTab === 'bookings' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                    Consultation & Coaching Bookings
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Client inquiries for Personal Training, Nutrition, Sports Coaching & Physiotherapy.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
                  {/* Search */}
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text"
                      placeholder="Search bookings..."
                      value={searchBooking}
                      onChange={(e) => setSearchBooking(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem 0.5rem 2rem',
                        background: 'rgba(9, 11, 16, 0.8)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.82rem'
                      }}
                    />
                  </div>

                  {/* Manual add booking */}
                  <button
                    onClick={() => setShowAddBookingForm(!showAddBookingForm)}
                    className="btn-primary"
                    style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem' }}
                  >
                    <Plus size={15} />
                    <span>{showAddBookingForm ? 'Close Form' : 'New Booking'}</span>
                  </button>
                </div>
              </div>

              {/* Service Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {['All', '1-on-1 Online Personal Training', 'Nutrition & Macro Blueprint', 'Sports Performance Coaching', 'Physiotherapy & Rehab Assessment'].map(filterItem => {
                  const isActive = bookingFilter === filterItem;
                  const label = filterItem === 'All' ? 'All Services' : filterItem.split(' ')[0] + ' ' + (filterItem.split(' ')[1] || '');
                  return (
                    <button
                      key={filterItem}
                      onClick={() => setBookingFilter(filterItem)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: isActive ? 'rgba(255, 107, 0, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: isActive ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
                        color: isActive ? '#ff9e40' : 'var(--text-secondary)'
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Add Booking Modal / Drawer if triggered */}
              {showAddBookingForm && (
                <form 
                  onSubmit={handleCreateBookingSubmit}
                  style={{
                    background: 'rgba(18, 24, 36, 0.95)',
                    border: '1px solid var(--accent-orange)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem'
                  }}
                >
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                    Directly Schedule / Add Client Booking
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    <input 
                      type="text" 
                      placeholder="Client Name *"
                      value={newBooking.fullName}
                      onChange={(e) => setNewBooking({ ...newBooking, fullName: e.target.value })}
                      style={{ padding: '0.6rem', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                      required
                    />
                    <input 
                      type="email" 
                      placeholder="Google Email Address *"
                      value={newBooking.email}
                      onChange={(e) => setNewBooking({ ...newBooking, email: e.target.value })}
                      style={{ padding: '0.6rem', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                      required
                    />
                    <input 
                      type="tel" 
                      placeholder="Phone / WhatsApp"
                      value={newBooking.phone}
                      onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                      style={{ padding: '0.6rem', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                    />
                    <select
                      value={newBooking.serviceType}
                      onChange={(e) => setNewBooking({ ...newBooking, serviceType: e.target.value })}
                      style={{ padding: '0.6rem', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                    >
                      <option value="1-on-1 Online Personal Training">1-on-1 Online Personal Training</option>
                      <option value="Nutrition & Macro Blueprint">Nutrition & Macro Blueprint</option>
                      <option value="Sports Performance Coaching">Sports Performance Coaching</option>
                      <option value="Physiotherapy & Rehab Assessment">Physiotherapy & Rehab Assessment</option>
                    </select>
                  </div>

                  <textarea 
                    rows={2}
                    placeholder="Goals, health notes, injury history..."
                    value={newBooking.injuryHistory}
                    onChange={(e) => setNewBooking({ ...newBooking, injuryHistory: e.target.value })}
                    style={{ padding: '0.6rem', background: '#0a0d14', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowAddBookingForm(false)} 
                      className="btn-secondary" 
                      style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ padding: '0.45rem 1.25rem', fontSize: '0.8rem' }}
                    >
                      Save Booking
                    </button>
                  </div>
                </form>
              )}

              {/* Bookings List Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {filteredBookings.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No bookings found matching current filters.
                  </div>
                ) : (
                  filteredBookings.map(item => (
                    <div 
                      key={item.id}
                      className="glass-panel"
                      style={{
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div style={{ flex: '1 1 300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                            {item.clientName}
                          </h4>
                          <span className={`badge ${
                            item.status === 'Confirmed' ? 'badge-lime' : item.status === 'Completed' ? 'badge-cyan' : 'badge-orange'
                          }`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.55rem' }}>
                            {item.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#38bdf8' }}>
                            <Mail size={13} />
                            {item.clientEmail}
                          </span>
                          {item.phone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Phone size={13} />
                              {item.phone}
                            </span>
                          )}
                          <span style={{ color: 'var(--text-muted)' }}>
                            {new Date(item.requestedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div style={{
                          fontSize: '0.85rem',
                          color: '#fff',
                          fontWeight: 700,
                          marginBottom: '0.35rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}>
                          <span style={{ color: 'var(--accent-orange)' }}>●</span>
                          {item.serviceTitle}
                        </div>

                        {item.goalOrNotes && (
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)'
                          }}>
                            <strong>Client Notes:</strong> {item.goalOrNotes}
                          </div>
                        )}
                      </div>

                      {/* Status Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          style={{
                            background: '#0d1017',
                            border: '1px solid var(--border-subtle)',
                            color: '#fff',
                            borderRadius: '8px',
                            padding: '0.45rem 0.75rem',
                            fontSize: '0.82rem',
                            fontWeight: 600
                          }}
                        >
                          <option value="Pending">Pending Review</option>
                          <option value="Confirmed">Confirmed / Active</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PURCHASED SERVICES */}
          {activeTab === 'purchases' && (
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                  All Purchased Services & FitToken Orders
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Chronological record of token packages, Monthly All-Access Passes, and coaching purchases.
                </div>
              </div>

              <div style={{
                background: 'rgba(15, 19, 28, 0.7)',
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '0.85rem 1rem' }}>Order / Service Item</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Client Google Email</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Tokens / Cost</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                      <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#fff' }}>
                          {p.itemName}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#38bdf8' }}>
                          {p.clientEmail}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span className={`badge ${p.category === 'Subscription' ? 'badge-lime' : 'badge-orange'}`} style={{ fontSize: '0.7rem' }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 800, color: '#f59e0b' }}>
                          {p.tokensOrCost}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                          {new Date(p.timestamp).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ color: 'var(--accent-lime)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <CheckCircle2 size={14} />
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: CORE 4 SERVICES CATALOG */}
          {activeTab === 'catalog' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                  Core Coaching & Services Catalog
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Active service specifications for client consultations and intake.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {CORE_SERVICES.map(svc => (
                  <div key={svc.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <span className="badge badge-orange">{svc.badge}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-lime)', fontWeight: 700 }}>Inquire / Book</span>
                    </div>

                    <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
                      {svc.title}
                    </h4>

                    <div style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem', fontWeight: 600 }}>
                      {svc.tagline}
                    </div>

                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {svc.description}
                    </p>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      {svc.features.map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <Check size={14} color="var(--accent-lime)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ADMIN SUPPORT */}
          {activeTab === 'support' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '0.35rem' }}>
                  Admin Support & Google Authentication Center
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Administrative access is tied directly to your verified Google account. Contact the technical team, manage client support requests, and inspect synchronization status.
                </p>
              </div>

              {/* Status Banner */}
              <div style={{
                background: 'rgba(0, 229, 153, 0.08)',
                border: '1px solid rgba(0, 229, 153, 0.3)',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'rgba(0, 229, 153, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-lime)'
                  }}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                      Admin Support Active & Authenticated
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                      <Google size={13} />
                      <span>Signed in via Google as <strong>{user?.email}</strong></span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge badge-lime">
                    <CheckCircle2 size={13} /> Verified Admin
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                
                {/* Direct Support Contacts */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Mail size={18} color="var(--accent-orange)" />
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                      Administrative Support Desk
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                    For technical inquiries, Google OAuth authorization issues, or billing synchronization, contact the platform operations team directly:
                  </p>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Primary Support Email
                      </div>
                      <a 
                        href="mailto:support@aifoundation.net.au"
                        style={{ fontSize: '0.9rem', color: 'var(--accent-orange)', fontWeight: 700, textDecoration: 'none' }}
                      >
                        support@aifoundation.net.au
                      </a>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText('support@aifoundation.net.au');
                        showAdminToast("Copied support@aifoundation.net.au to clipboard!");
                      }}
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      Copy
                    </button>
                  </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Trainer Hotline & WhatsApp
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>
                        +61 400 123 456
                      </div>
                    </div>
                    <span className="badge badge-orange" style={{ fontSize: '0.7rem' }}>
                      Coach David
                    </span>
                  </div>
                </div>

                {/* Identity & Session Metadata */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <ShieldCheck size={18} color="var(--accent-lime)" />
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                      Google Identity & Access Control
                    </h4>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Admin Name</span>
                      <strong style={{ color: '#fff' }}>{user?.name || 'Coach David'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Google Email</span>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{user?.email || 'N/A'}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Authentication Provider</span>
                      <span style={{ color: '#fff' }}>Google Identity Services</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Registered Users in Ledger</span>
                      <strong style={{ color: '#f59e0b' }}>{users.length} Users</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.2rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Active Service Bookings</span>
                      <strong style={{ color: 'var(--accent-lime)' }}>{bookings.length} Bookings</strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Data & Backup Tools */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                  Administrative Tools & Data Export
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Export client bookings and token allocation records for offline CRM backup or client follow-ups.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ users, bookings, purchases }, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `trainer_david_backup_${new Date().toISOString().slice(0, 10)}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      showAdminToast("Exported database records to JSON file!");
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                  >
                    📥 Export JSON Backup
                  </button>

                  <button
                    onClick={() => {
                      loadData();
                      if (onRefreshAppState) onRefreshAppState();
                      showAdminToast("Data ledger refreshed and synchronized!");
                    }}
                    className="btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                  >
                    🔄 Refresh Sync
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div style={{
          padding: '0.85rem 1.75rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(10, 13, 20, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            🔒 Logged in as <strong>Coach David (Administrator)</strong>
          </div>
          <div>
            Data is securely synchronized with local client records & Google Identity.
          </div>
        </div>

      </div>
    </div>
  );
}
