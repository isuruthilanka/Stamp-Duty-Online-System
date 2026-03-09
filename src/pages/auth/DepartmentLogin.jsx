import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import '../../styles/Auth.css';

const DepartmentLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAppContext(); // Keep this as it's not explicitly changed in the snippet's scope
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(email, password, 'INTERNAL');
        if (result.success) {
            navigate('/internal');
        } else {
            setError(result.error || 'Invalid credentials for official portal');
        }
    };

    return (
        <div className="auth-page department-theme">
            <div className="auth-form-container">
                <div className="auth-header">
                    <div style={{ color: '#D4AF37', fontWeight: 'bold', marginBottom: '1rem' }}>OFFICIAL PORTAL</div>
                    <h2>Department Login</h2>
                    <p>Internal access for Department Revenue Officers</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
                    <div className="form-group">
                        <label>Official Email</label>
                        <input
                            type="text"
                            placeholder="name@revenue.wp.gov.lk"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Access Key</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-submit">Login to Dashboard</button>
                </form>

                <a href="#" className="back-link" onClick={() => navigate('/')}>
                    ← Back to general information
                </a>
            </div>
        </div>
    );
};

export default DepartmentLogin;
