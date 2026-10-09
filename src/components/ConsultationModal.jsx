import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle, Calendar, Dumbbell, ShieldCheck } from './Icons';
import { addAdminBooking, addAdminPurchase } from '../data/adminStore';

export default function ConsultationModal({ isOpen, onClose, preselectedService, user }) {
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    serviceType: preselectedService || '1-on-1 Online Personal Training',
    fitnessGoal: 'Muscle Hypertrophy & Strength',
    injuryHistory: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        fullName: user?.name || prev.fullName,
        email: user?.email || prev.email,
        serviceType: preselectedService || prev.serviceType || '1-on-1 Online Personal Training'
      }));
    }
  }, [isOpen, preselectedService, user]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Full name is required';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Valid email is required';
    if (!formData.phone.trim()) errs.phone = 'Contact number is required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    
    // Save to Admin bookings store
    addAdminBooking(formData);

    // Also record in the Purchases & Master Transaction Ledger
    addAdminPurchase({
      clientName: formData.fullName,
      clientEmail: formData.email,
      itemName: `Booking: ${formData.serviceType}`,
      category: 'Coaching Booking',
      tokensOrCost: 'Consultation Inquiry',
      status: 'Pending'
    });

    setSubmitted(true);

    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 3000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px', padding: '2rem' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              Book with Trainer David
            </h2>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              1-on-1 coaching, custom nutrition plan, sports performance or physiotherapy
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

        {submitted ? (
          <div style={{
            background: 'rgba(0, 229, 153, 0.12)',
            border: '1px solid rgba(0, 229, 153, 0.3)',
            borderRadius: '16px',
            padding: '2.5rem 1.5rem',
            textAlign: 'center'
          }}>
            <CheckCircle size={50} color="var(--accent-lime)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.35rem', color: '#fff', marginBottom: '0.5rem' }}>
              Consultation Inquiry Sent!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>
              Thank you, <strong style={{ color: '#fff' }}>{formData.fullName}</strong>. Coach David has received your consultation inquiry for <strong style={{ color: 'var(--accent-orange)' }}>{formData.serviceType}</strong> and will contact you directly via WhatsApp or Email within 24 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Your Full Name *
              </label>
              <input 
                type="text" 
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Michael Smith"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: errors.fullName ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
              {errors.fullName && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem' }}>{errors.fullName}</div>}
            </div>

            {/* Email & Phone in 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Email Address *
                </label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: errors.email ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
                {errors.email && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem' }}>{errors.email}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Mobile / WhatsApp *
                </label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+61 400 000 000"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: errors.phone ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
                {errors.phone && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.2rem' }}>{errors.phone}</div>}
              </div>
            </div>

            {/* Service Selection - No pricing listed */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Service Requested
              </label>
              <select
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#121622',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                <option value="1-on-1 Online Personal Training">1-on-1 Online Personal Training</option>
                <option value="Nutrition & Macro Blueprint">Nutrition & Macro Blueprint</option>
                <option value="Sports Performance Coaching">Sports Performance Coaching</option>
                <option value="Physiotherapy & Rehab Assessment">Physiotherapy & Rehab Assessment</option>
              </select>
            </div>

            {/* Primary Goal / Injury history */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Primary Goal or Health / Injury Notes (Optional)
              </label>
              <textarea 
                rows={3}
                value={formData.injuryHistory}
                onChange={(e) => setFormData({ ...formData, injuryHistory: e.target.value })}
                placeholder="Share your goals, gym experience, or any joint pain or injuries..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Reassurance note */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShieldCheck size={16} color="var(--accent-lime)" style={{ flexShrink: 0 }} />
              <span>Coach David reviews all consultation requests personally within 24 hours.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.3rem' }}
            >
              <Sparkles size={18} />
              <span>Submit Consultation Request</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
