import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import '../styles/Auth.css';

const ExternalLogin = () => {
    const [error, setError] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { externalLogin } = useAppContext();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await externalLogin(email, password);
        if (result.success) {
            navigate('/external');
        } else {
            setError(result.error || 'Invalid credentials for public portal');
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-form-container">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Please log in to your account</p>
                </div>

                {error && (
                    <div style={{
                        background: '#ffebee',
                        color: '#c62828',
                        padding: '0.8rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        fontWeight: '500',
                        border: '1px solid #ffcdd2'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Username / Email</label>
                        <input
                            type="text"
                            placeholder="Enter your username or email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-submit">Sign In</button>
                </form>

                <a href="#" className="back-link" onClick={() => navigate('/register')} style={{ color: 'var(--primary-color)', fontWeight: '600', marginBottom: '0.5rem' }}>
                    New User? Register here
                </a>
                <a href="#" className="back-link" onClick={() => navigate('/forgot-password')} style={{ color: 'var(--primary-color)', fontWeight: '600', marginBottom: '1.5rem' }}>
                    Forgot Password?
                </a>
                <a href="#" className="back-link" onClick={() => navigate('/')}>
                    ← Back to system information
                </a>
            </div>
        </div>
    );
};

export default ExternalLogin;
