import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
            fontFamily: '"Inter", sans-serif',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <h1 style={{ fontSize: '8rem', margin: 0, color: '#1e4b8a', fontWeight: 900, letterSpacing: '-0.05em' }}>404</h1>
            <h2 style={{ fontSize: '2rem', color: '#334155', marginTop: '-1rem' }}>Page Not Found</h2>
            <p style={{ color: '#64748b', maxWidth: '400px', lineHeight: '1.6', fontSize: '1.1rem', marginBottom: '2rem' }}>
                The page you are looking for might have been moved, deleted, or does not exist.
            </p>
            <button
                onClick={() => navigate('/')}
                style={{
                    padding: '0.8rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'white',
                    background: '#1e4b8a',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(30, 75, 138, 0.3)',
                    transition: 'transform 0.2s'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
            >
                Return to Home
            </button>
        </div>
    );
};

export default NotFound;
