import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const AdminPanel = ({ activeTab = 'DASHBOARD' }) => {
    const {
        users, addUser, deleteUser, editUser, externalUsers,
        approveExternal, fields, addField, deleteField, REGIONS,
        logout, sendOpinionToExternalUser
    } = useAppContext();
    const navigate = useNavigate();
    const [newUserName, setNewUserName] = useState('');
    const [newUserDesignation, setNewUserDesignation] = useState('');
    const [newUserUsername, setNewUserUsername] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('TAX_OFFICER');
    const [newUserRegion, setNewUserRegion] = useState('Main');
    const [newFieldName, setNewFieldName] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [notification, setNotification] = useState(null);
    const [opinionText, setOpinionText] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');

    // Password Reset State
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [resetPasswordValue, setResetPasswordValue] = useState('');

    // Edit User State
    const [isEditingUser, setIsEditingUser] = useState(false);
    const [editUserData, setEditUserData] = useState({});

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleResetPassword = (user) => {
        if (!resetPasswordValue) return alert('Please enter a new password');
        editUser({ ...user, password: resetPasswordValue });
        showNotification(`Password for ${user.name} has been reset successfully!`);
        setIsResettingPassword(false);
        setResetPasswordValue('');
    };

    const handleEditUserSubmit = (user) => {
        if (!editUserData.name || !editUserData.email) return alert('Name and Email are required');
        const mergedUser = { ...user, ...editUserData };
        editUser(mergedUser);
        showNotification(`Profile for ${editUserData.name} updated successfully!`);
        setIsEditingUser(false);
        setEditUserData({});
    };

    const renderDashboard = () => {
        return (
            <>
                <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                    <div className="stat-card" onClick={() => navigate('/internal/users')} style={{ cursor: 'pointer', borderLeft: '4px solid #1a237e' }}>
                        <div className="stat-info">
                            <span className="stat-label">Internal Staff (Active)</span>
                            <span className="stat-value">{users.filter(u => ['COMMISSIONER', 'DC', 'ASSESSOR', 'TAX_OFFICER'].includes(u.role) && u.status === 'ACTIVE').length}</span>
                        </div>
                        <div className="stat-icon">👥</div>
                    </div>
                    <div className="stat-card" onClick={() => navigate('/internal/users')} style={{ cursor: 'pointer', borderLeft: '4px solid #D4AF37' }}>
                        <div className="stat-info">
                            <span className="stat-label">Registered External</span>
                            <span className="stat-value" style={{ color: '#D4AF37' }}>{users.filter(u => u.isExternal === 1 && u.status === 'ACTIVE').length}</span>
                        </div>
                        <div className="stat-icon">⚖️</div>
                    </div>
                    <div className="stat-card" onClick={() => navigate('/internal/approvals')} style={{ cursor: 'pointer', borderLeft: '4px solid #ef6c00' }}>
                        <div className="stat-info">
                            <span className="stat-label">Pending Approvals</span>
                            <span className="stat-value" style={{ color: '#ef6c00' }}>{externalUsers.length}</span>
                        </div>
                        <div className="stat-icon">⏳</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div className="data-table-container">
                        <h4 style={{ color: '#1a237e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem 0' }}>
                            👥 Active Department Staff
                        </h4>
                        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            <table style={{ fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>Name</th>
                                        <th style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>Role</th>
                                        <th style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>Office</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users
                                        .filter(u => ['COMMISSIONER', 'DC', 'ASSESSOR', 'TAX_OFFICER'].includes(u.role) && u.status === 'ACTIVE')
                                        .sort((a, b) => b.id - a.id)
                                        .map(u => (
                                            <tr key={u.id}>
                                                <td>{u.name}</td>
                                                <td>{u.role}</td>
                                                <td>{u.region}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="data-table-container">
                        <h4 style={{ color: '#D4AF37', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.5rem 0' }}>
                            ⚖️ Approved External Users
                        </h4>
                        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            <table style={{ fontSize: '0.85rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>Name</th>
                                        <th style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>Entity</th>
                                        <th style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users
                                        .filter(u => ['LAWYER', 'FINANCIAL_CO'].includes(u.role))
                                        .sort((a, b) => b.id - a.id)
                                        .map(u => (
                                            <tr key={u.id}>
                                                <td>{u.name}</td>
                                                <td>{u.organization || 'Individual'}</td>
                                                <td>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        background: u.status === 'DELETED' ? '#ffebee' : '#e8f5e9',
                                                        color: u.status === 'DELETED' ? '#c62828' : '#2e7d32',
                                                        fontWeight: 800
                                                    }}>
                                                        {u.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderUserManagement = () => {
        const q = userSearchQuery.toLowerCase().trim();
        const internalStaff = users.filter(u => u.isExternal !== 1 && (
            !q ||
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.designation?.toLowerCase().includes(q)
        ));
        const registeredExternal = users.filter(u => u.isExternal === 1 && u.status === 'ACTIVE' && (
            !q ||
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.organization?.toLowerCase().includes(q)
        ));

        const renderUserRow = (user, type) => (
            <React.Fragment key={user.id}>
                <tr onClick={() => {
                    setSelectedUser(selectedUser === user.id ? null : user.id);
                    setIsResettingPassword(false);
                    setIsEditingUser(false);
                }} style={{ cursor: 'pointer' }}>
                    <td>{user.name}</td>
                    <td>{type === 'INTERNAL' ? user.designation : (user.organization || 'Individual')}</td>
                    <td>{user.role === 'DC' ? 'Deputy Commissioner' : user.role}</td>
                    <td>{type === 'INTERNAL' ? user.region : 'External Portal'}</td>
                    <td>
                        <span className={`status-badge ${user.status.toLowerCase()}`} style={{
                            fontSize: '0.65rem',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            background: user.status === 'DELETED' ? '#fdecea' : '#edf7ed',
                            color: user.status === 'DELETED' ? '#d32f2f' : '#2e7d32',
                            fontWeight: 700
                        }}>
                            {user.status}
                        </span>
                    </td>
                    <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="action-btn" style={{ padding: '4px 8px', fontSize: '0.75rem', background: '#e3f2fd', color: '#1565c0' }}>View</button>
                            {user.status !== 'DELETED' && (
                                <button className="action-btn btn-delete" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); deleteUser(user.id); }}>Deactivate</button>
                            )}
                        </div>
                    </td>
                </tr>
                {selectedUser === user.id && (
                    <tr>
                        <td colSpan="6" style={{ background: type === 'INTERNAL' ? '#f8f9fa' : '#fffde7', padding: '1.5rem', borderBottom: '2px solid var(--primary-color)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <p><strong>{type === 'INTERNAL' ? 'Staff Information' : 'Organization/Identity'}</strong></p>
                                    {!isEditingUser ? (
                                        <>
                                            <p>Name: {user.name}</p>
                                            {type === 'INTERNAL' ? (
                                                <>
                                                    <p>Designation: {user.designation}</p>
                                                    <p>Regional Assignment: {user.region || 'Western Province Main'}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <p>Organization: {user.organization || 'N/A'}</p>
                                                    <p>NIC/Passport/Reg: {user.referenceNo || 'N/A'}</p>
                                                    <p>Address: {user.address || 'N/A'}</p>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #1a237e' }}>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#1a237e' }}>Edit Profile</p>
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={editUserData.name || ''}
                                                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                            />
                                            {type === 'INTERNAL' && (
                                                <input
                                                    type="text"
                                                    placeholder="Designation"
                                                    value={editUserData.designation || ''}
                                                    onChange={(e) => setEditUserData({ ...editUserData, designation: e.target.value })}
                                                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                                />
                                            )}
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                value={editUserData.email || ''}
                                                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                                                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                            />
                                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                <button className="action-btn" style={{ flex: 1, background: '#1a237e', color: 'white' }} onClick={() => handleEditUserSubmit(user)}>Save</button>
                                                <button className="action-btn" style={{ flex: 1, background: '#f5f5f5', color: '#666' }} onClick={() => setIsEditingUser(false)}>Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    {!isEditingUser && (
                                        <button
                                            className="action-btn"
                                            style={{ marginTop: '1rem', background: '#e3f2fd', color: '#1565c0', border: '1px solid #bbdefb', padding: '0.4rem 0.8rem' }}
                                            onClick={() => {
                                                setIsEditingUser(true);
                                                setIsResettingPassword(false);
                                                setEditUserData({
                                                    name: user.name,
                                                    designation: user.designation,
                                                    email: user.email
                                                });
                                            }}
                                        >
                                            ✏️ Edit Profile Details
                                        </button>
                                    )}
                                </div>
                                <div>
                                    <p><strong>System & Contact</strong></p>
                                    <p>Email: {user.email}</p>
                                    <p>Role: {user.role === 'DC' ? 'Deputy Commissioner' : user.role}</p>
                                    {type === 'EXTERNAL' && user.contactPersonName && (
                                        <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#fff', borderRadius: '4px', border: '1px dashed #ccc' }}>
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem' }}>Default Contact Person:</p>
                                            <p style={{ margin: 0, fontSize: '0.85rem' }}>{user.contactPersonName} ({user.contactPersonNo})</p>
                                        </div>
                                    )}

                                    {/* Password Reset Facility */}
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <p style={{ margin: '0 0 0.8rem 0', fontWeight: 700, fontSize: '0.9rem', color: '#d32f2f' }}>Security Management</p>
                                        {!isResettingPassword ? (
                                            <button
                                                className="action-btn"
                                                style={{ background: '#ffebee', color: '#c62828', border: '1px solid #ffcdd2', width: '100%', padding: '0.6rem' }}
                                                onClick={() => setIsResettingPassword(true)}
                                            >
                                                Reset User Password
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                                <input
                                                    type="password"
                                                    placeholder="Enter New Password"
                                                    value={resetPasswordValue}
                                                    onChange={(e) => setResetPasswordValue(e.target.value)}
                                                />
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        className="action-btn"
                                                        style={{ background: '#4caf50', color: 'white', flex: 1 }}
                                                        onClick={() => handleResetPassword(user)}
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        style={{ background: '#f5f5f5', color: '#666', flex: 1 }}
                                                        onClick={() => {
                                                            setIsResettingPassword(false);
                                                            setResetPasswordValue('');
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </td>
                    </tr>
                )}
            </React.Fragment>
        );

        return (
            <section className="management-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Official Staff Directory</h3>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search users by name, email..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.6rem 1rem 0.6rem 2.5rem',
                                borderRadius: '20px',
                                border: '1px solid #ddd',
                                fontSize: '0.9rem',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                            }}
                        />
                        <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}></span>
                    </div>
                </div>
                <div className="management-form" style={{ background: '#fcfcfc', padding: '2rem', borderRadius: '12px', border: '1px solid #eee', marginBottom: '2rem' }}>
                    <div className="form-grid" style={{ gap: '1.5rem' }}>
                        <div className="form-group" style={{ gridColumn: 'span 1' }}>
                            <label style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Full Name of Officer</label>
                            <input
                                type="text"
                                placeholder="e.g. Kamal Perera"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Designation</label>
                            <input
                                type="text"
                                placeholder="e.g. Senior Assessor"
                                value={newUserDesignation}
                                onChange={(e) => setNewUserDesignation(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Official Email Address</label>
                            <input
                                type="email"
                                placeholder="name@revenue.wp.gov.lk"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>System Username</label>
                            <input
                                type="text"
                                placeholder="Required for Login"
                                value={newUserUsername}
                                onChange={(e) => setNewUserUsername(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Secret Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={newUserPassword}
                                onChange={(e) => setNewUserPassword(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Assigned Departmental Role</label>
                            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                                <option value="COMMISSIONER">Commissioner</option>
                                <option value="DC">Deputy Commissioner</option>
                                <option value="ASSESSOR">Assessor</option>
                                <option value="TAX_OFFICER">Tax Officer</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Regional Office</label>
                            <select
                                value={newUserRegion}
                                onChange={(e) => setNewUserRegion(e.target.value)}
                            >
                                {['Main', ...REGIONS].map(r => <option key={r} value={r}>{r === 'Main' ? 'Western Province (Main)' : r}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn-primary" style={{ padding: '0.6rem 2rem', fontSize: '1rem', borderRadius: '8px', color: 'white' }} onClick={() => {
                            if (!newUserUsername || !newUserPassword || !newUserEmail) return alert('Username, Email and Password are required');
                            addUser({
                                name: newUserName,
                                designation: newUserDesignation,
                                username: newUserUsername,
                                email: newUserEmail,
                                password: newUserPassword,
                                role: newUserRole,
                                region: newUserRegion
                            });
                            showNotification(`Official Account for ${newUserName} created successfully!`);
                            setNewUserName('');
                            setNewUserDesignation('');
                            setNewUserUsername('');
                            setNewUserEmail('');
                            setNewUserPassword('');
                            setNewUserRegion('Main');
                        }}>Create Official Account</button>
                    </div>
                </div>

                <div className="data-table-container">
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary-color)', padding: '0.5rem 1.5rem 0' }}>Internal Staff Records</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Designation</th>
                                <th>Role</th>
                                <th>Office / Region</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {internalStaff.map(user => renderUserRow(user, 'INTERNAL'))}
                        </tbody>
                    </table>
                </div>

                <div className="data-table-container" style={{ marginTop: '3rem' }}>
                    <h4 style={{ marginBottom: '1rem', color: '#D4AF37', padding: '0.5rem 1.5rem 0' }}>Registered External Portal Users</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Name / Entity</th>
                                <th>Organization</th>
                                <th>Portal Role</th>
                                <th>Office</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registeredExternal.map(user => renderUserRow(user, 'EXTERNAL'))}
                            {registeredExternal.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>No external users registered yet</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        );
    };

    const renderApprovals = () => (
        <section className="management-section">
            <h3>Registration Request to Department</h3>
            <div className="data-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Organization</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {externalUsers.map(user => (
                            <React.Fragment key={user.id}>
                                <tr onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)} style={{ cursor: 'pointer' }}>
                                    <td>{user.name}</td>
                                    <td>{user.organization}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <button className="action-btn" style={{ background: '#e3f2fd', color: '#1565c0' }}>Details</button>
                                        <button className="action-btn btn-approve" style={{ background: '#2e7d32', color: 'white' }} onClick={(e) => {
                                            e.stopPropagation();
                                            approveExternal(user.id);
                                            showNotification(`Registration for ${user.name} approved and activated!`);
                                        }}>Approve</button>
                                    </td>
                                </tr>
                                {selectedUser === user.id && (
                                    <tr>
                                        <td colSpan="4" style={{ background: '#fffde7', padding: '1.5rem', borderBottom: '2px solid #D4AF37' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                                <div>
                                                    <p><strong>Identity & Contact</strong></p>
                                                    <p>{user.entityType === 'Company' ? 'Company Name' : 'Full Name'}: {user.name}</p>
                                                    <p>{user.entityType === 'Company' ? 'Short Name' : 'Initials'}: {user.initials}</p>
                                                    <p>Organization: {user.organization || 'N/A'}</p>
                                                    <p>{user.entityType === 'Company' ? 'Incorporated No' : 'NIC/Passport'}: {user.referenceNo}</p>
                                                    <p>Email: {user.email}</p>
                                                    <p>Address: {user.address}</p>
                                                    {user.barNumber && <p><strong>Bar Association No:</strong> {user.barNumber}</p>}
                                                </div>
                                                <div>
                                                    <p><strong>System Access & Details</strong></p>
                                                    <p>Role Type: {user.role}</p>
                                                    {user.entityType === 'Company' && (
                                                        <>
                                                            <div style={{ background: '#f0f0f0', padding: '0.8rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                                                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>Relevant Details / Nature of Business:</p>
                                                                <p style={{ margin: 0, fontSize: '0.9rem' }}>{user.relevantDetails || 'No details provided'}</p>
                                                            </div>
                                                            <div style={{ background: '#e8eaf6', padding: '0.8rem', borderRadius: '4px', marginTop: '0.5rem', borderLeft: '4px solid #3f51b5' }}>
                                                                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', color: '#1a237e' }}>Contact Person Details:</p>
                                                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}><strong>Name:</strong> {user.contactPersonName}</p>
                                                                <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Address:</strong> {user.contactPersonAddress}</p>
                                                                <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>NIC/Passport:</strong> {user.contactPersonReference}</p>
                                                                <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Contact No:</strong> {user.contactPersonNo}</p>
                                                                <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>Email:</strong> {user.contactPersonEmail}</p>
                                                            </div>
                                                        </>
                                                    )}
                                                    <button className="action-btn btn-approve" style={{ marginTop: '1rem', background: '#2e7d32', color: 'white', fontWeight: 800 }} onClick={(e) => {
                                                        e.stopPropagation();
                                                        approveExternal(user.id);
                                                        showNotification(`Registration for ${user.name} approved and activated!`);
                                                    }}>
                                                        Activate Registration
                                                    </button>

                                                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                                                        <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Send Opinion/Query to Applicant:</p>
                                                        <textarea
                                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                                                            rows="3"
                                                            placeholder="Enter your opinion or query here..."
                                                            value={opinionText}
                                                            onChange={(e) => setOpinionText(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <button
                                                            className="action-btn"
                                                            style={{ marginTop: '0.5rem', background: '#e8eaf6', color: '#1a237e' }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!opinionText.trim()) return alert('Please enter some text');
                                                                sendOpinionToExternalUser(user.id, opinionText);
                                                                showNotification(`Opinion sent to ${user.name}`);
                                                                setOpinionText('');
                                                            }}
                                                        >
                                                            📧 Send Opinion
                                                        </button>
                                                        {user.adminOpinion && (
                                                            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#666', fontStyle: 'italic' }}>
                                                                Last sent: {user.adminOpinion}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        {externalUsers.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No pending approvals</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );

    const renderFieldManagement = () => (
        <section className="management-section">
            <h3>System Field Management</h3>
            <div className="management-form">
                <div className="form-grid">
                    <input
                        type="text"
                        placeholder="Field/Section Name"
                        value={newFieldName}
                        onChange={(e) => setNewFieldName(e.target.value)}
                    />
                    <button className="btn-primary" onClick={() => {
                        addField(newFieldName, false);
                        showNotification(`Section "${newFieldName}" added successfully!`);
                        setNewFieldName('');
                    }}>Add Section</button>
                    <button className="btn-primary" style={{ background: '#555' }} onClick={() => {
                        addField(newFieldName, true);
                        showNotification(`File Upload field "${newFieldName}" added successfully!`);
                        setNewFieldName('');
                    }}>Add File Upload</button>
                </div>
            </div>

            <div className="data-table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Field Name</th>
                            <th>Type</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fields.map(field => (
                            <tr key={field.id}>
                                <td>{field.name}</td>
                                <td>{field.isFile ? '📁 File Attachment' : '📝 Data Section'}</td>
                                <td>
                                    <button className="action-btn btn-delete" onClick={() => deleteField(field.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );

    return (
        <div className="dashboard-view">
            <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>
                    {activeTab === 'USERS' ? 'User Management' :
                        activeTab === 'APPROVALS' ? 'Registration Request to Department' :
                            activeTab === 'FIELDS' ? 'Field Management' : 'Admin Overview'}
                </h1>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>

                {notification && (
                    <div className={`notification-banner ${notification.type}`} style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        background: notification.type === 'success' ? '#4caf50' : '#f44336',
                        color: 'white',
                        padding: '1rem 2rem',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 1000,
                        animation: 'slideInRight 0.3s ease-out',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem'
                    }}>
                        {notification.type === 'success' ? '✅' : '❌'} {notification.message}
                    </div>
                )}
            </div>

            {activeTab === 'DASHBOARD' ? (
                renderDashboard()
            ) : (
                <>
                    {activeTab === 'USERS' && renderUserManagement()}
                    {activeTab === 'APPROVALS' && renderApprovals()}
                    {activeTab === 'FIELDS' && renderFieldManagement()}
                </>
            )}
        </div>
    );
};

export default AdminPanel;
