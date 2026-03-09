import React from 'react';
import { useAppContext } from '../AppContext';
// Layout is already provided by parent route

const MyProfile = () => {
    const { currentUser } = useAppContext();

    if (!currentUser) return null;

    return (
        <div className="dashboard-view" style={{ animation: 'slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="content-header">
                <h1>My Account Details</h1>
                <p style={{ opacity: 0.7 }}>Manage your personal information and security settings</p>
            </div>

            <div style={{ maxWidth: '800px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem', background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '90px', height: '90px', borderRadius: '24px', background: 'linear-gradient(135deg, #1a237e 0%, #303f9f 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 900, boxShadow: '0 10px 20px rgba(26, 35, 126, 0.2)' }}>
                        {currentUser.name.charAt(0)}
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 900, color: '#1a237e' }}>{currentUser.name}</h2>
                        <p style={{ color: '#64748b', margin: '0.2rem 0 0 0', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>{currentUser.role === 'LAWYER' ? '📌 Professional Notary' : '👤 Public Beneficiary'}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Email Address</label>
                        <p style={{ fontSize: '1rem', padding: '0.6rem', background: '#f8f9fa', borderRadius: '4px', margin: 0 }}>{currentUser.email}</p>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Username</label>
                        <p style={{ fontSize: '1rem', padding: '0.6rem', background: '#f8f9fa', borderRadius: '4px', margin: 0 }}>{currentUser.username || 'N/A'}</p>
                    </div>
                    {currentUser.role === 'LAWYER' && (
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Bar Association No</label>
                            <p style={{ fontSize: '1rem', padding: '0.6rem', background: '#f8f9fa', borderRadius: '4px', margin: 0 }}>{currentUser.barNo || 'BASL/7721'}</p>
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#666', marginBottom: '0.4rem' }}>Organization</label>
                        <p style={{ fontSize: '1rem', padding: '0.6rem', background: '#f8f9fa', borderRadius: '4px', margin: 0 }}>{currentUser.organization || 'Individual'}</p>
                    </div>
                </div>
            </div>

            <div className="stat-card">
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem' }}>Security & Authentication</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontWeight: 600, margin: 0 }}>Change Password</p>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>It's a good idea to use a strong password that you don't use elsewhere</p>
                    </div>
                    <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', background: '#f5f5f5', color: 'var(--primary-color)', border: '1px solid var(--primary-color)', borderRadius: '6px' }}>
                        Update Password
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MyProfile;
