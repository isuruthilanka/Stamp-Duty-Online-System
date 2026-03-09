import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import '../../styles/Dashboard.css';

const DashboardLayout = ({ children }) => {
    const { currentUser, loading, logout } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (loading) {
        return <div className="loading-screen">Authenticating Session...</div>;
    }

    if (!currentUser) {
        return <Navigate to="/department-login" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/department-login');
    };

    const handleNavClick = (path) => {
        navigate(path);
        setSidebarOpen(false);
    };

    const isTaxOfficer = currentUser?.role === 'TAX_OFFICER';

    const navItems = [
        { name: 'Dashboard', icon: '📊', path: '/internal', roles: ['ADMIN', 'COMMISSIONER', 'DC', 'ASSESSOR'] },
        { name: 'User Management', icon: '👥', path: '/internal/users', roles: ['ADMIN'] },
        { name: 'Registration Request to Department', icon: '✅', path: '/internal/approvals', roles: ['ADMIN'] },
        { name: 'Field Management', icon: '⚙️', path: '/internal/fields', roles: ['ADMIN'] },
        { name: 'Applications', icon: '📄', path: '/internal/applications', roles: ['ADMIN', 'COMMISSIONER', 'DC', 'ASSESSOR'] },
        { name: 'Calculation Sheet', icon: '🧮', path: '/internal/calculator', roles: ['COMMISSIONER', 'DC', 'ASSESSOR'] },
        { name: 'Deficiency Calculator', icon: '⚖️', path: '/internal/deficiency-calculator', roles: ['COMMISSIONER', 'DC', 'ASSESSOR'] },
        { name: 'Registration System', icon: '📋', path: isTaxOfficer ? '/internal' : '/internal/registration', roles: ['ADMIN', 'TAX_OFF_OFFICER', 'TAX_OFFICER'] }
    ];

    return (
        <div className="dashboard-container">
            {/* Mobile top bar */}
            <div className="mobile-topbar">
                <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
                    <span /><span /><span />
                </button>
                <span className="mobile-topbar-title">Stamp Duty System</span>
                <button className="mobile-logout-btn" onClick={handleLogout}>Logout</button>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`sidebar ${sidebarOpen ? 'sidebar-mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <h2 style={{ fontSize: '1.1rem' }}>STAMP DUTY ONLINE SYSTEM</h2>
                    <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Department of Revenue - Western Province</p>
                    <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close menu">✕</button>
                </div>

                <nav className="nav-list">
                    {navItems.filter(item => item.roles.includes(currentUser.role)).map(item => (
                        <div
                            key={item.name}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => handleNavClick(item.path)}
                        >
                            <span>{item.icon}</span>
                            <span>{item.name}</span>
                        </div>
                    ))}
                </nav>

                <div className="sidebar-user">
                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{currentUser.name}</p>
                    <p style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '1rem' }}>
                        {currentUser.role === 'COMMISSIONER' ? 'Commissioner of Revenue' : (currentUser.role === 'DC' ? 'Deputy Commissioner' : currentUser.role)}
                    </p>
                    <button className="btn-primary" onClick={handleLogout} style={{ width: '100%', padding: '0.5rem', background: '#f44336', border: 'none' }}>Logout</button>
                </div>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
