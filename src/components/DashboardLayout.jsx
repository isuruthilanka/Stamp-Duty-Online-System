import React from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom'; // Added Navigate
import { useAppContext } from '../AppContext';
import '../styles/Dashboard.css';

const DashboardLayout = ({ children }) => {
    const { currentUser, loading, logout } = useAppContext(); // Added logout
    const navigate = useNavigate();
    const location = useLocation();

    // Handle loading state first
    if (loading) {
        return <div className="loading-screen">Authenticating Session...</div>;
    }

    // If not loading and no current user, redirect
    if (!currentUser) {
        return <Navigate to="/department-login" replace />;
    }

    const handleLogout = () => {
        logout();
        navigate('/department-login');
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
            <aside className="sidebar">
                <div className="sidebar-header">
                    <h2 style={{ fontSize: '1.1rem' }}>STAMP DUTY ONLINE SYSTEM</h2>
                    <p style={{ fontSize: '0.7rem', opacity: 0.6 }}>Department of Revenue - Western Province</p>
                </div>

                <nav className="nav-list">
                    {navItems.filter(item => item.roles.includes(currentUser.role)).map(item => (
                        <div
                            key={item.name}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
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
