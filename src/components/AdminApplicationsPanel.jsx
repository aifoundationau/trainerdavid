import React, { useState, useEffect } from 'react';
import { ExternalLink, Check, X, ShieldCheck, Mail, Phone, Calendar, Clock, RefreshCw } from './Icons';
import { listTrainerApplications, reviewTrainerApplication } from '../services/trainerApi';
import { ADMIN_CREDENTIALS } from '../data/adminStore';

export default function AdminApplicationsPanel({ user, isSuperAdmin, isMainAdmin, showToast, onRefreshUsers }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoles, setSelectedRoles] = useState({});
  const [processingUid, setProcessingUid] = useState(null);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const list = await listTrainerApplications();
      setApplications(list);
      // Pre-fill selected role mapping
      const initialRoles = {};
      list.forEach(app => {
        initialRoles[app.uid] = app.assignedRole || app.requestedRole || 'trainer';
      });
      setSelectedRoles(initialRoles);
    } catch (err) {
      console.error('Failed to load applications:', err);
      showToast('Could not load trainer applications from the database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleRoleSelection = (uid, role) => {
    setSelectedRoles(prev => ({ ...prev, [uid]: role }));
  };

  const handleReview = async (applicantUid, action) => {
    const roleToAssign = selectedRoles[applicantUid] || 'trainer';

    // MainAdmin check: cannot assign superadmin or mainadmin
    if (isMainAdmin && !isSuperAdmin && (roleToAssign === 'superadmin' || roleToAssign === 'mainadmin')) {
      showToast('Access Denied: MainAdmin cannot assign SuperAdmin or MainAdmin credentials.');
      return;
    }

    setProcessingUid(applicantUid);
    try {
      const res = await reviewTrainerApplication({
        applicantUid,
        action,
        assignedRole: roleToAssign
      });

      if (action === 'approve') {
        showToast(`✅ Approved! Granted ${roleToAssign.toUpperCase()} role to applicant.`);
      } else {
        showToast('Application marked as declined.');
      }

      await fetchApps();
      if (onRefreshUsers) onRefreshUsers();
    } catch (err) {
      console.error('Review error:', err);
      showToast(err.message || 'Failed to review application.');
    } finally {
      setProcessingUid(null);
    }
  };

  const filteredApps = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const pendingCount = applications.filter(a => a.status === 'pending').length;

  // Filter available credentials: if MainAdmin, remove superadmin and mainadmin
  const assignableRoles = ADMIN_CREDENTIALS.filter(c => {
    if (isSuperAdmin) return true;
    return c.id !== 'superadmin' && c.id !== 'mainadmin';
  });

  return (
    <div>
      {/* Header Banner */}
      <div style={{
        background: 'rgba(255, 107, 0, 0.08)',
        border: '1px solid rgba(255, 107, 0, 0.25)',
        borderRadius: '14px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>📋</span>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Coach & Specialist Applications
            </h3>
            {pendingCount > 0 && (
              <span className="badge badge-orange" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '640px', lineHeight: 1.5 }}>
            Supporters who opt-in to become trainers submit their professional qualifications directly to Google Drive.
            As <strong>{isSuperAdmin ? 'SuperAdmin' : 'MainAdmin'}</strong>, you can inspect their Google Drive credentials and grant or edit their accredited role.
          </p>
        </div>

        <button
          onClick={fetchApps}
          disabled={loading}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `All (${applications.length})` },
          { id: 'pending', label: `Pending (${pendingCount})`, highlight: pendingCount > 0 },
          { id: 'approved', label: `Approved (${applications.filter(a => a.status === 'approved').length})` },
          { id: 'rejected', label: `Declined (${applications.filter(a => a.status === 'rejected').length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: statusFilter === tab.id ? 'var(--accent-orange)' : 'rgba(255, 255, 255, 0.05)',
              color: statusFilter === tab.id ? '#fff' : tab.highlight ? '#ff9e40' : 'var(--text-secondary)',
              border: statusFilter === tab.id ? '1px solid var(--accent-orange)' : '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          Loading applications from database...
        </div>
      ) : filteredApps.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: '12px',
          border: '1px dashed var(--border-subtle)',
          color: 'var(--text-muted)'
        }}>
          No applications found for this filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredApps.map(app => {
            const isPending = app.status === 'pending';
            const isApproved = app.status === 'approved';
            const isDeclined = app.status === 'rejected';
            const chosenRole = selectedRoles[app.uid] || app.requestedRole || 'trainer';
            const isBusy = processingUid === app.uid;

            return (
              <div
                key={app.uid}
                style={{
                  background: 'rgba(13, 17, 28, 0.85)',
                  border: isPending ? '1px solid rgba(255, 107, 0, 0.4)' : '1px solid var(--border-subtle)',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.9rem'
                }}
              >
                {/* Top Row: Applicant Meta & Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'var(--accent-orange)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 800
                    }}>
                      {app.name ? app.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                        {app.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Mail size={13} />
                        <span>{app.email}</span>
                        {app.phone && (
                          <>
                            <span>•</span>
                            <Phone size={13} />
                            <span>{app.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span 
                      className={
                        isApproved ? "badge badge-lime" :
                        isDeclined ? "badge badge-red" :
                        "badge badge-orange"
                      }
                      style={{ fontSize: '0.76rem', fontWeight: 800, padding: '0.25rem 0.65rem' }}
                    >
                      {isApproved ? '✓ Approved' : isDeclined ? '✕ Declined' : '⚡ Pending Review'}
                    </span>
                  </div>
                </div>

                {/* Details Box */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '0.9rem 1.1rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.85rem',
                  fontSize: '0.82rem'
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Requested Discipline:</span>
                    <div style={{ color: 'var(--accent-orange)', fontWeight: 700, fontSize: '0.9rem', marginTop: '2px' }}>
                      {app.requestedRoleLabel || app.requestedRole}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Certifications & Experience:</span>
                    <div style={{ color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                      {app.experience || 'None specified'}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Submitted:</span>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                </div>

                {/* Short Bio */}
                {app.bio && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
                    "{app.bio}"
                  </div>
                )}

                {/* Google Drive Credentials Verification Bar */}
                <div style={{
                  background: 'rgba(255, 107, 0, 0.05)',
                  border: '1px solid rgba(255, 107, 0, 0.2)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>📁</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                        Google Drive Credentials Folder
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Folder ID: <code>{app.folderId || 'Shared Drive'}</code>
                        {app.fileName && ` • File: ${app.fileName}`}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {app.webViewLink && (
                      <a
                        href={app.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <ExternalLink size={12} />
                        <span>View Document</span>
                      </a>
                    )}

                    {app.folderUrl && (
                      <a
                        href={app.folderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                        style={{ padding: '0.35rem 0.85rem', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <ExternalLink size={12} />
                        <span>Open Drive Folder</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Review & Role Assignment Row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  paddingTop: '0.6rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {/* Role Selector: Defaulted to requested role, but editable by SuperAdmin/MainAdmin */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Role to Assign:
                    </label>
                    <select
                      value={chosenRole}
                      disabled={isBusy}
                      onChange={e => handleRoleSelection(app.uid, e.target.value)}
                      style={{
                        padding: '0.35rem 0.7rem',
                        background: '#0d111c',
                        border: '1px solid var(--accent-orange)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {assignableRoles.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.icon} {c.label} ({c.title})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleReview(app.uid, 'reject')}
                      disabled={isBusy}
                      className="btn-secondary"
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.8rem',
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <X size={14} />
                      <span>Decline</span>
                    </button>

                    <button
                      onClick={() => handleReview(app.uid, 'approve')}
                      disabled={isBusy}
                      className="btn-primary"
                      style={{
                        padding: '0.4rem 1.1rem',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        borderColor: '#22c55e'
                      }}
                    >
                      <Check size={14} />
                      <span>{isApproved ? 'Update Role' : 'Approve & Grant Role'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
