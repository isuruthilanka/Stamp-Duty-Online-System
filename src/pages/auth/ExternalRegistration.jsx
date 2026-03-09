import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import '../styles/Auth.css';

const ExternalRegistration = () => {
    const [formData, setFormData] = useState({
        entityType: 'Individual', // Individual person or Company
        username: '',
        password: '',
        confirmPassword: '',
        referenceNo: '', // NIC or Passport or Incorporated Number
        fullName: '',
        title: 'Mr', // Mr/Ms/Mrs/Miss/Rev
        initials: '',
        address: '',
        telephone: '',
        email: '',
        applicantType: 'LAWYER', // Lawyer/Notary, Public, Financial Co
        barNumber: '',
        relevantDetails: '', // Nature of business or other info
        contactPersonName: '',
        contactPersonAddress: '',
        contactPersonReference: '', // NIC/Passport
        contactPersonNo: '',
        contactPersonEmail: ''
    });

    const [submitted, setSubmitted] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const { requestRegistration } = useAppContext();
    const navigate = useNavigate();

    const validatePassword = (pass, confirm = formData.confirmPassword) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!regex.test(pass)) {
            setPasswordError('Password must be at least 8 characters, include uppercase, lowercase, number and special character.');
        } else if (confirm && pass !== confirm) {
            setPasswordError('Passwords do not match');
        } else {
            setPasswordError('');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const newFormData = { ...formData, [name]: value };
        setFormData(newFormData);

        if (name === 'password' || name === 'confirmPassword') {
            validatePassword(newFormData.password, newFormData.confirmPassword);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwordError) return;
        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        // Map form data to match the structure expected
        const registrationData = {
            ...formData,
            name: formData.fullName,
            organization: formData.entityType === 'Company' ? formData.fullName : (formData.relevantDetails || 'Individual'),
            role: formData.entityType === 'Company' ? 'FINANCIAL_CO' : formData.applicantType
        };

        const result = await requestRegistration(registrationData);
        if (result && result.success) {
            setSubmitted(true);
        } else {
            alert('Registration Failed: ' + (result?.error || 'Unknown error. Username or Email might already be taken.'));
        }
    };

    if (submitted) {
        return (
            <div className="auth-page">
                <div className="auth-form-container" style={{ textAlign: 'center' }}>
                    <div className="auth-header">
                        <h2 style={{ color: '#2e7d32' }}>Request Sent Successfully</h2>
                        <p>Your request to register as a <strong>{formData.applicantType} ({formData.entityType})</strong> has been sent.</p>
                    </div>
                    <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'left' }}>
                        <p><strong>Next Steps:</strong></p>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>
                            1. Department Admin will review your potential as a user.<br />
                            2. Upon verification, the department will allow your registration.<br />
                            3. You will receive an activation email with your credentials.
                        </p>
                    </div>
                    <button className="btn-submit" onClick={() => navigate('/')}>Back to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-form-container" style={{ maxWidth: '700px' }}>
                <div className="auth-header">
                    <h2>Registration Request</h2>
                    <p>Department of Revenue - Western Province Stamp Duty System</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Section 1: Entity Type */}
                    <div className="form-group">
                        <label>Registering As</label>
                        <div className="type-selector" style={{ background: '#f0f0f0', padding: '0.3rem', borderRadius: '8px' }}>
                            <div
                                className={`type-tab ${formData.entityType === 'Individual' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, entityType: 'Individual' })}
                            >
                                Individual Person
                            </div>
                            <div
                                className={`type-tab ${formData.entityType === 'Company' ? 'active' : ''}`}
                                onClick={() => setFormData({ ...formData, entityType: 'Company' })}
                            >
                                Company / Institution
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Identity & Basics */}
                    <div className="form-grid" style={{ display: formData.entityType === 'Individual' ? 'grid' : 'block', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {formData.entityType === 'Individual' && (
                            <div className="form-group">
                                <label>Applicant Title</label>
                                <select name="title" value={formData.title} onChange={handleInputChange}>
                                    <option value="Mr">Mr.</option>
                                    <option value="Ms">Ms.</option>
                                    <option value="Mrs">Mrs.</option>
                                    <option value="Miss">Miss</option>
                                    <option value="Rev">Rev.</option>
                                </select>
                            </div>
                        )}
                        <div className="form-group">
                            <label>{formData.entityType === 'Individual' ? 'Applicant Reference (NIC / Passport)' : 'Incorporated Number'} <span style={{ color: '#f44336' }}>*</span></label>
                            <input
                                name="referenceNo"
                                type="text"
                                placeholder={formData.entityType === 'Individual' ? 'e.g. 199012345678' : 'e.g. PV-XXXXXX'}
                                value={formData.referenceNo}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>{formData.entityType === 'Individual' ? 'Full Name of Applicant' : 'Company / Institution Name'} <span style={{ color: '#f44336' }}>*</span></label>
                        <input
                            name="fullName"
                            type="text"
                            placeholder={formData.entityType === 'Individual' ? 'Enter full legal name' : 'Enter registered company name'}
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>{formData.entityType === 'Individual' ? 'Name with Initials' : 'Short Name / Acronym'} <span style={{ color: '#f44336' }}>*</span></label>
                        <input
                            name="initials"
                            type="text"
                            placeholder={formData.entityType === 'Individual' ? 'e.g. A.P. Sunil Perera' : 'e.g. ABC Finance'}
                            value={formData.initials}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    {/* Section 3: Contact Details */}
                    <div className="form-group">
                        <label>{formData.entityType === 'Individual' ? 'Permanent Address' : 'Official Registered Address'} <span style={{ color: '#f44336' }}>*</span></label>
                        <textarea
                            name="address"
                            placeholder="Enter complete address"
                            value={formData.address}
                            onChange={handleInputChange}
                            required
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label>Relevant Details / Nature of Business</label>
                        <textarea
                            name="relevantDetails"
                            placeholder="Briefly describe the business activities"
                            value={formData.relevantDetails}
                            onChange={handleInputChange}
                        ></textarea>
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Telephone Number <span style={{ color: '#f44336' }}>*</span></label>
                            <input name="telephone" type="text" placeholder="+94 XX XXX XXXX" value={formData.telephone} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email Address <span style={{ color: '#f44336' }}>*</span></label>
                            <input name="email" type="email" placeholder="email@example.com" value={formData.email} onChange={handleInputChange} required />
                        </div>
                    </div>

                    {formData.entityType === 'Individual' && (
                        <>
                            <div className="form-group">
                                <label>Applicant Category <span style={{ color: '#f44336' }}>*</span></label>
                                <select name="applicantType" value={formData.applicantType} onChange={handleInputChange} required>
                                    <option value="LAWYER">Lawyer / Notary</option>
                                    <option value="PUBLIC">Public User</option>
                                </select>
                            </div>

                            {formData.applicantType === 'LAWYER' && (
                                <div className="form-group">
                                    <label>Bar Association's Number <span style={{ color: '#f44336' }}>*</span></label>
                                    <input
                                        name="barNumber"
                                        type="text"
                                        placeholder="e.g. BASL-XXXX"
                                        value={formData.barNumber}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {formData.entityType === 'Company' && (
                        <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e0e0e0', marginTop: '1rem', marginBottom: '2rem' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#1a237e', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Contact Person's Details</h4>
                            <div className="form-group">
                                <label>Contact Person’s Name in Full</label>
                                <input name="contactPersonName" type="text" placeholder="Enter full name of contact person" value={formData.contactPersonName} onChange={handleInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Contact Person's Address</label>
                                <textarea
                                    name="contactPersonAddress"
                                    placeholder="Enter contact person's address"
                                    value={formData.contactPersonAddress}
                                    onChange={handleInputChange}
                                    required
                                ></textarea>
                            </div>
                            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>NIC / Passport Number</label>
                                    <input name="contactPersonReference" type="text" placeholder="e.g. 199012345678" value={formData.contactPersonReference} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Contact Number</label>
                                    <input name="contactPersonNo" type="text" placeholder="+94 XX XXX XXXX" value={formData.contactPersonNo} onChange={handleInputChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Contact Email Address</label>
                                <input name="contactPersonEmail" type="email" placeholder="contact@example.com" value={formData.contactPersonEmail} onChange={handleInputChange} required />
                            </div>
                        </div>
                    )}

                    <hr style={{ margin: '2rem 0', opacity: 0.1 }} />

                    {/* Section 4: Security */}
                    <div className="form-group">
                        <label>Desired Username <span style={{ color: '#f44336' }}>*</span></label>
                        <input name="username" type="text" placeholder="e.g. sunil_lawyer" value={formData.username} onChange={handleInputChange} required />
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                            <label>Password <span style={{ color: '#f44336' }}>*</span></label>
                            <input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password <span style={{ color: '#f44336' }}>*</span></label>
                            <input name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleInputChange} required />
                        </div>
                    </div>
                    {passwordError && <p style={{ color: '#c62828', fontSize: '0.8rem', marginTop: '-1rem', marginBottom: '1rem' }}>{passwordError}</p>}

                    <button type="submit" className="btn-submit">
                        Send Registration Request to Department
                    </button>
                </form>

                <a href="#" className="back-link" onClick={() => navigate('/login')}>
                    Back to Login
                </a>
            </div>
        </div>
    );
};

export default ExternalRegistration;
