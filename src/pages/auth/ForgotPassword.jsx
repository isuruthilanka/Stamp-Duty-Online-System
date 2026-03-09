import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Auth.css';
import { api } from '../../services/api';

const ForgotPassword = () => {
    const [formData, setFormData] = useState({
        email: '',
        referenceNo: '', // NIC or Passport
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            await api.resetPassword(formData.email, formData.referenceNo, formData.newPassword);
            setSubmitted(true);
            setMessage('Password reset successful. You can now login with your new password.');
        } catch (err) {
            setError(err.message);
        }
    };

    if (submitted) {
        return (
            <div className="auth-page">
                <div className="auth-form-container" style={{ textAlign: 'center' }}>
                    <div className="auth-header">
                        <h2 style={{ color: '#2e7d32' }}>Request Submitted</h2>
                        <p>{message}</p>
                    </div>
                    <button className="btn-submit" onClick={() => navigate('/login')}>Back to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-form-container">
                <div className="auth-header">
                    <h2>Reset Password</h2>
                    <p>Enter your details to request a password reset</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Registered Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>NIC / Passport Number</label>
                        <input
                            type="text"
                            name="referenceNo"
                            placeholder="e.g. 199012345678"
                            value={formData.referenceNo}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                placeholder="••••••••"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>
                    {error && <p style={{ color: '#c62828', fontSize: '0.8rem', marginTop: '-0.5rem', marginBottom: '1rem' }}>{error}</p>}

                    <button type="submit" className="btn-submit">Request Password Reset</button>
                </form>

                <a href="#" className="back-link" onClick={() => navigate('/login')} style={{ color: 'var(--primary-color)', fontWeight: '600' }}>
                    Back to Login
                </a>
            </div>
        </div>
    );
};

export default ForgotPassword;
