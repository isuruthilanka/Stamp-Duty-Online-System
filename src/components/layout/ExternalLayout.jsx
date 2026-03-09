import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import '../../styles/Dashboard.css';

const ExternalLayout = () => {
    const { currentUser, logout, loading } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1a237e' }}>Syncing with Department Registry...</div>
            <div style={{ marginTop: '1rem', color: '#64748b' }}>Please wait while we secure your session.</div>
        </div>
    );

    if (!currentUser) return <Navigate to="/login" replace />;
    if (!currentUser.isExternal && currentUser.role !== 'PUBLIC') return <Navigate to="/internal" replace />;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleNavClick = (path) => {
        navigate(path);
        setSidebarOpen(false);
    };

    const navItems = [
        { name: 'My Dashboard', path: '/external', icon: '🏠' },
        { name: 'New Application', path: '/external/new-application', icon: '📝' },
        { name: 'My Profile', path: '/external/profile', icon: '👤' },
        { name: 'Help Desk', path: '/external/help', icon: '❓' },
    ];

    return (
        <div className="dashboard-container external-portal">
            {/* Mobile top bar */}
            <div className="mobile-topbar">
                <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                    <span /><span /><span />
                </button>
                <span className="mobile-topbar-title">E-Submission Portal</span>
                <button className="mobile-logout-btn" onClick={handleLogout}>Sign Out</button>
            </div>

            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            <aside className={`sidebar ${sidebarOpen ? 'sidebar-mobile-open' : ''}`} style={{
                background: 'linear-gradient(180deg, #002B49 0%, #001a2c 100%)',
                boxShadow: '10px 0 30px rgba(0,0,0,0.05)',
                borderRight: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div className="sidebar-header" style={{ padding: '2.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ background: 'rgba(255,255,255,0.1)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1rem' }}>🏛️</div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>STAMP DUTY ONLINE SYSTEM</h2>
                    <p style={{ fontSize: '0.65rem', color: '#81a1c1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Department of Revenue - Western Province</p>
                    <p style={{ fontSize: '0.65rem', color: '#81a1c1', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, marginTop: '2px' }}>E-Submission Portal</p>
                    <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>
                </div>

                <nav className="nav-list" style={{ padding: '1.5rem 1rem' }}>
                    {navItems.map(item => {
                        const isActive = location.pathname === item.path || (item.path !== '/external' && location.pathname.startsWith(item.path));
                        return (
                            <div
                                key={item.name}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => handleNavClick(item.path)}
                                style={{
                                    padding: '0.9rem 1.2rem',
                                    borderRadius: '12px',
                                    marginBottom: '0.5rem',
                                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                    color: isActive ? '#fff' : '#b0bec5',
                                    fontWeight: isActive ? 700 : 500,
                                    border: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent'
                                }}
                            >
                                <span style={{ fontSize: '1.2rem', opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
                                <span>{item.name}</span>
                            </div>
                        );
                    })}
                </nav>

                <div className="sidebar-user" style={{
                    padding: '1.5rem',
                    background: 'rgba(0,0,0,0.2)',
                    margin: '1rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#303f9f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                            {currentUser.name.charAt(0)}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ fontWeight: '700', fontSize: '0.85rem', color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</p>
                            <p style={{ fontSize: '0.65rem', color: '#90a4ae', margin: 0 }}>Public User</p>
                        </div>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '0.8rem',
                            fontSize: '0.9rem',
                            borderRadius: '12px',
                            background: '#e11d48',
                            border: 'none',
                            color: '#ffffff',
                            fontWeight: 800,
                            boxShadow: '0 4px 12px rgba(225, 29, 72, 0.2)',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                        }}
                    >
                        🚪 Sign Out
                    </button>
                </div>
            </aside>


            <main className="main-content" style={{ background: '#fcfdfe' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default ExternalLayout;
