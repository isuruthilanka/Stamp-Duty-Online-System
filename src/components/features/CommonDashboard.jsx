import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import GlobalSearch from './GlobalSearch';

const CommonDashboard = () => {
    const { applications, currentUser, updateAppStatus, distributeToRegion, REGIONS } = useAppContext();
    const navigate = useNavigate();

    const [filter, setFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedAppId, setSelectedAppId] = useState(null);
    const [quickSelectedRegion, setQuickSelectedRegion] = useState({});

    const isAdmin = currentUser.role === 'ADMIN';
    const isCommissioner = currentUser.role === 'COMMISSIONER';
    const isDC = currentUser.role === 'DC';
    const isAssessor = currentUser.role === 'ASSESSOR';

    const handleQuickReject = (app) => {
        const reason = prompt('Enter a reason for rejection:');
        if (reason) {
            updateAppStatus(app.id, 'REJECTED', reason);
            alert('Application rejected successfully.');
        }
    };

    const handleViewAndPrint = (appId, triggerPrint = false) => {
        navigate(`/internal/view/${appId}${triggerPrint ? '?print=true' : ''}`);
    };

    const handleQuickDistribute = (appId) => {
        const region = quickSelectedRegion[appId];
        if (!region) return alert('Please select a regional office');
        distributeToRegion(appId, region);
        alert(`Application distributed to ${region} successfully.`);
        setSelectedAppId(null);
    };

    const getStatusLabel = (status) => {
        const s = (status || '').toUpperCase();
        switch (s) {
            case 'RECEIVED': return 'Pending Review';
            case 'ALLOCATED_TO_REGION': return 'Regional Processing';
            case 'ALLOCATED_TO_ASSESSOR': return 'Assessment in Progress';
            case 'PROCESSING': return 'Processing Stage';
            case 'FINALIZED': return 'Finalized';
            case 'REJECTED': return 'Rejected';
            case 'AMENDED': return 'Amendment Required';
            case 'INFORMATION_REQUESTED': return 'Action Required';
            case 'OPINION_ISSUED': return 'OPINION ISSUED / READY';
            case 'SLIP_PENDING_VERIFICATION': return 'PAYMENT SLIP PENDING';
            case 'PARTIALLY_PAID': return 'PARTIALLY PAID';
            case 'FULLY_PAID': return 'FULLY PAID';
            case 'PAID_VERIFIED': return 'PAYMENT FULLY VERIFIED';
            case 'RESUBMITTED': return 'Amended File – Resubmitted by External User';
            default: return status;
        }
    };

    const getStatusClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('resubmitted')) return 'bg-amended text-orange-900 border border-orange-500';
        if (s.includes('allocated')) return 'bg-received text-blue-800';
        if (s.includes('processing')) return 'bg-amended text-blue-800';
        if (s.includes('information_requested') || s.includes('action_required')) return 'bg-rejected text-white';
        if (s.includes('finalized') || s.includes('issued') || s.includes('verified') || s.includes('fully_paid')) return 'bg-completed text-white';
        if (s.includes('partially_paid') || s.includes('pending_verification')) return 'bg-received text-blue-800';
        if (s.includes('rejected')) return 'bg-rejected text-white';
        if (s.includes('amended')) return 'bg-amended text-orange-900';
        return `bg-${s}`;
    };

    const renderFullDetailsSection = (app) => {
        const data = app.fullData || {};
        const canAction = (isCommissioner && app.status === 'RECEIVED') ||
            (isDC && app.status === 'ALLOCATED_TO_REGION') ||
            (isAssessor && (app.status === 'ALLOCATED_TO_ASSESSOR' || app.status === 'RESUBMITTED'));

        return (
            <tr style={{ background: '#f8fafc' }}>
                <td colSpan="6" style={{ padding: '0', borderBottom: '3px solid var(--primary-color)' }}>
                    <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.5rem', animation: 'fadeInUp 0.3s ease-out' }}>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                            <p style={{ fontWeight: 800, color: '#1a237e', borderBottom: '2px solid #e8eaf6', fontSize: '0.75rem', paddingBottom: '0.5rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stakeholders & Docs</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <p style={{ fontSize: '0.85rem', color: '#4a5568' }}><strong style={{ color: '#2d3748' }}>Grantee:</strong> {data.grantees?.[0]?.name || 'N/A'} {data.grantees?.[0]?.tin ? `(TIN: ${data.grantees[0].tin})` : ''}</p>
                                <p style={{ fontSize: '0.85rem', color: '#4a5568' }}><strong style={{ color: '#2d3748' }}>Grantor:</strong> {data.grantors?.[0]?.name || 'N/A'} {data.grantors?.[0]?.tin ? `(TIN: ${data.grantors[0].tin})` : ''}</p>
                                <div>
                                    <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600, color: '#2d3748' }}>📎 Attachments ({data.attachments ? (Array.isArray(data.attachments) ? data.attachments.length : Object.keys(data.attachments).length) : 0})</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                                        {data.attachments && (Array.isArray(data.attachments) ? data.attachments.slice(0, 4) : Object.entries(data.attachments).slice(0, 4)).map((item, idx) => {
                                            const name = Array.isArray(data.attachments) ? item.name : (typeof item[1] === 'object' ? item[0] : item[0]);
                                            const url = Array.isArray(data.attachments) ? (item.url || item.data || '') : (typeof item[1] === 'object' ? (item[1].url || item[1].data || '') : '');
                                            const openBlob = () => {
                                                if (!url) { alert('No file data available.'); return; }
                                                try {
                                                    if (url.startsWith('data:')) {
                                                        const [meta, base64] = url.split(',');
                                                        const mime = meta.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
                                                        const binary = atob(base64);
                                                        const bytes = new Uint8Array(binary.length);
                                                        for (let n = 0; n < binary.length; n++) bytes[n] = binary.charCodeAt(n);
                                                        const blob = new Blob([bytes], { type: mime });
                                                        const blobUrl = URL.createObjectURL(blob);
                                                        window.open(blobUrl, '_blank');
                                                        setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
                                                    } else { window.open(url, '_blank'); }
                                                } catch (e) { alert('Could not preview file.'); }
                                            };
                                            return (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                                    <span>📄 {name}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); openBlob(); }} title="View" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '0.8rem' }}>👁️</button>
                                                    {url && <button onClick={(e) => { e.stopPropagation(); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); }} title="Download" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: '0.8rem' }}>⬇️</button>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                            <p style={{ fontWeight: 800, color: '#1a237e', borderBottom: '2px solid #e8eaf6', fontSize: '0.75rem', paddingBottom: '0.5rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Property Detail</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                <p style={{ fontSize: '0.85rem', color: '#4a5568' }}><strong style={{ color: '#2d3748' }}>Address:</strong> {data.property?.address || 'N/A'}</p>
                                <p style={{ fontSize: '0.85rem', color: '#4a5568' }}><strong style={{ color: '#2d3748' }}>LA Town:</strong> {data.property?.town || 'N/A'}</p>
                                <p style={{ fontSize: '0.85rem', color: '#4a5568' }}><strong style={{ color: '#2d3748' }}>Extent:</strong> {data.property?.extent ? `${data.property.extent.acre}A ${data.property.extent.rood}R ${data.property.extent.perch}P` : 'N/A'}</p>
                            </div>
                        </div>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                            <p style={{ fontWeight: 800, color: '#1a237e', borderBottom: '2px solid #e8eaf6', fontSize: '0.75rem', paddingBottom: '0.5rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Actions</p>

                            {isCommissioner && app.status === 'RECEIVED' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <select
                                            className="action-btn"
                                            style={{ width: '100%', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem' }}
                                            value={quickSelectedRegion[app.id] || ''}
                                            onChange={(e) => setQuickSelectedRegion({ ...quickSelectedRegion, [app.id]: e.target.value })}
                                        >
                                            <option value="">-- Distribute to Region --</option>
                                            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        className="btn-primary"
                                        style={{ background: '#f57f17', color: 'white', width: '100%' }}
                                        onClick={() => handleQuickDistribute(app.id)}
                                    >
                                        🚀 Instant Distribution
                                    </button>
                                    <button className="action-btn" style={{ fontSize: '0.8rem' }} onClick={() => navigate(`/internal/view/${app.id}`)}>
                                        🔍 Full Audit & Review
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem' }}>
                                    <button className="btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', borderRadius: '10px', color: 'white', boxShadow: '0 4px 10px rgba(26, 35, 126, 0.2)' }} onClick={() => navigate(`/internal/view/${app.id}`)}>
                                        {canAction ? '🚀 Process Application' : '📄 View Full Audit'}
                                    </button>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="action-btn" style={{ fontSize: '0.8rem', flex: 1, borderRadius: '8px' }} onClick={() => handleViewAndPrint(app.id)}>🖨️ Print Form</button>
                                        {canAction && (
                                            <button
                                                className="action-btn"
                                                style={{ fontSize: '0.8rem', background: '#fff1f2', color: '#e11d48', borderColor: '#fecdd3', flex: 1, borderRadius: '8px' }}
                                                onClick={(e) => { e.stopPropagation(); handleQuickReject(app); }}
                                            >
                                                ❌ Reject
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </td>
            </tr>
        );
    };

    // Server already returns only the correct data for each role (filtered by assignedToId for
    // ASSESSORs, by region for DCs, and by applicantId for external users). No client-side
    // re-filtering needed — use the dataset as-is.
    const roleBaseApps = applications;

    // Apply UI filters
    const filteredApps = roleBaseApps.filter(app => {
        const status = (app.status || '').toUpperCase();
        let statusMatch = false;

        if (filter === 'ALL') {
            statusMatch = true;
        } else if (filter === 'ACTION_REQUIRED') {
            statusMatch = ['AMENDED', 'INFORMATION_REQUESTED', 'REJECTED', 'RESUBMITTED'].includes(status);
        } else if (filter === 'PROCESSING') {
            statusMatch = ['PROCESSING', 'ALLOCATED_TO_ASSESSOR', 'ALLOCATED_TO_REGION'].includes(status);
        } else if (filter === 'FINALIZED') {
            statusMatch = ['FINALIZED', 'OPINION_ISSUED', 'FULLY_PAID', 'PAID_VERIFIED'].includes(status);
        } else {
            statusMatch = status === filter.toUpperCase();
        }

        const categoryMatch = categoryFilter === 'ALL' || app.category === categoryFilter;

        const searchLower = searchQuery.toLowerCase().trim();
        const searchMatch = !searchLower ||
            (app.permFileNo || '').toLowerCase().includes(searchLower) ||
            (app.tempFileNo || '').toLowerCase().includes(searchLower) ||
            (app.applicant || '').toLowerCase().includes(searchLower) ||
            (app.fullData?.property?.address || '').toLowerCase().includes(searchLower) ||
            (app.fullData?.property?.town || '').toLowerCase().includes(searchLower) ||
            (app.fullData?.grantor?.name || '').toLowerCase().includes(searchLower) ||
            (app.fullData?.grantee?.name || '').toLowerCase().includes(searchLower) ||
            (app.fullData?.grantor?.TIN || '').toLowerCase().includes(searchLower) ||
            (app.fullData?.grantee?.TIN || '').toLowerCase().includes(searchLower);

        return statusMatch && categoryMatch && searchMatch;
    }).sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
    });

    const stats = {
        received: roleBaseApps.filter(app => app.status === 'RECEIVED').length,
        allocated: roleBaseApps.filter(app => ['ALLOCATED_TO_REGION', 'ALLOCATED_TO_ASSESSOR'].includes(app.status)).length,
        processing: roleBaseApps.filter(app => ['PROCESSING', 'ALLOCATED_TO_ASSESSOR', 'SLIP_PENDING_VERIFICATION', 'PARTIALLY_PAID', 'RESUBMITTED'].includes(app.status)).length,
        finalized: roleBaseApps.filter(app => ['FINALIZED', 'OPINION_ISSUED', 'FULLY_PAID', 'PAID_VERIFIED'].includes(app.status)).length,
        amended: roleBaseApps.filter(app => ['AMENDED', 'INFORMATION_REQUESTED', 'RESUBMITTED'].includes(app.status)).length,
        rejected: roleBaseApps.filter(app => app.status === 'REJECTED').length,
    };

    return (
        <div className="dashboard-view">
            <div className="content-header" style={{ background: 'white', padding: '1.5rem 2rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #f0f4f8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--primary-color), #303f9f)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.8rem',
                        fontWeight: 800,
                        boxShadow: '0 8px 16px rgba(26, 35, 126, 0.2)'
                    }}>
                        {currentUser.name.charAt(0)}
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#1a237e' }}>Welcome back, {currentUser.name}</h1>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.4rem', alignItems: 'center' }}>
                            <span style={{ background: '#e8eaf6', color: '#1a237e', padding: '0.2rem 1rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                {currentUser.designation || (currentUser.role === 'COMMISSIONER' ? 'Commissioner of Revenue' : (currentUser.role === 'DC' ? 'Deputy Commissioner' : currentUser.role))}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 500 }}>
                                • {isCommissioner ? 'Head Office Overview' :
                                    isDC ? `${currentUser.region}` :
                                        isAssessor ? `${currentUser.region}` : 'System Overview'}
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <GlobalSearch value={searchQuery} onChange={setSearchQuery} />
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {new Date().toLocaleDateString(undefined, { weekday: 'long' })}
                        </div>
                        <div style={{ fontSize: '1.1rem', color: '#2d3748', fontWeight: 800, marginTop: '2px' }}>
                            {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="stats-grid">
                <div className={`stat-card ${filter === 'RECEIVED' ? 'active' : ''}`}
                    onClick={() => { setFilter('RECEIVED'); document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                    style={{ borderLeft: '4px solid #1a237e', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    <div className="stat-info">
                        <span className="stat-label">Queue</span>
                        <span className="stat-value">{stats.received}</span>
                    </div>
                    <div className="stat-icon">📥</div>
                </div>
                <div className={`stat-card ${filter === 'PROCESSING' ? 'active' : ''}`}
                    onClick={() => { setFilter('PROCESSING'); document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                    style={{ borderLeft: '4px solid #1565c0', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    <div className="stat-info">
                        <span className="stat-label">In Processing</span>
                        <span className="stat-value" style={{ color: '#1565c0' }}>{stats.allocated + stats.processing}</span>
                    </div>
                    <div className="stat-icon">⚙️</div>
                </div>
                <div className={`stat-card ${filter === 'FINALIZED' ? 'active' : ''}`}
                    onClick={() => { setFilter('FINALIZED'); document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                    style={{ borderLeft: '4px solid #2e7d32', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    <div className="stat-info">
                        <span className="stat-label">Finalized</span>
                        <span className="stat-value" style={{ color: '#2e7d32' }}>{stats.finalized}</span>
                    </div>
                    <div className="stat-icon">✅</div>
                </div>
                <div className={`stat-card ${filter === 'ACTION_REQUIRED' ? 'active' : ''}`}
                    onClick={() => { setFilter('ACTION_REQUIRED'); document.getElementById('archive-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                    style={{ borderLeft: '4px solid #ef6c00', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    <div className="stat-info">
                        <span className="stat-label">Amend/Reject</span>
                        <span className="stat-value" style={{ color: '#ef6c00' }}>{stats.amended + stats.rejected}</span>
                    </div>
                    <div className="stat-icon">⚠️</div>
                </div>
            </div>

            {/* ACTION REQUIRED SECTION */}
            <div className="data-table-container" style={{ borderTop: '4px solid #e11d48', marginTop: '1rem', boxShadow: '0 15px 30px rgba(225, 29, 72, 0.08)' }}>
                <div className="table-header" style={{ background: '#fff1f2' }}>
                    <h3 style={{ color: '#e11d48', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>⚠️</span> Action Required - Immediate Attention
                    </h3>
                    <span style={{ background: '#e11d48', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 800 }}>
                        {roleBaseApps.filter(app => {
                            if (isAdmin) return app.status === 'RECEIVED';
                            if (isCommissioner) return app.status === 'RECEIVED';
                            if (isDC) return app.status === 'ALLOCATED_TO_REGION';
                            if (isAssessor) return app.status === 'ALLOCATED_TO_ASSESSOR';
                            return false;
                        }).length} PENDING
                    </span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '200px', background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>📂 FILE NUMBER</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>🏷️ TYPE</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>📅 RECEIVED</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>👤 APPLICANT</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>⚡ STATUS</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textAlign: 'right' }}>⚙️ ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roleBaseApps.filter(app => {
                            if (isAdmin) return app.status === 'RECEIVED';
                            if (isCommissioner) return app.status === 'RECEIVED';
                            if (isDC) return app.status === 'ALLOCATED_TO_REGION';
                            if (isAssessor) return app.status === 'ALLOCATED_TO_ASSESSOR';
                            return false;
                        }).sort((a, b) => {
                            const dateA = new Date(a.date || 0).getTime();
                            const dateB = new Date(b.date || 0).getTime();
                            if (dateB !== dateA) return dateB - dateA;
                            return (b.id || 0) - (a.id || 0);
                        }).map(app => (
                            <React.Fragment key={app.id}>
                                <tr
                                    onClick={() => setSelectedAppId(selectedAppId === `pending-${app.id}` ? null : `pending-${app.id}`)}
                                    style={{ cursor: 'pointer', background: selectedAppId === `pending-${app.id}` ? '#fff1f2' : 'white' }}
                                >
                                    <td><div style={{ fontWeight: 800, color: '#1a237e' }}>{app.permFileNo || app.tempFileNo}</div></td>
                                    <td><span className="category-tag" style={{ background: '#e2e8f0', color: '#1e293b', fontWeight: 700 }}>{app.category}</span></td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{app.date}</div>
                                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{app.time}</span>
                                    </td>
                                    <td><div style={{ fontWeight: 600 }}>{app.applicant}</div></td>
                                    <td><span className={`status-badge ${getStatusClass(app.status)}`}>{getStatusLabel(app.status)}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem', borderRadius: '8px', background: 'var(--primary-color)', color: 'white' }} onClick={(e) => { e.stopPropagation(); handleViewAndPrint(app.id); }}>
                                                Process Now
                                            </button>
                                            <button className="action-btn" style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: '#f8fafc', fontWeight: 700 }} onClick={(e) => { e.stopPropagation(); handleViewAndPrint(app.id, true); }} title="View & Print">
                                                🖨️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {selectedAppId === `pending-${app.id}` && renderFullDetailsSection(app)}
                            </React.Fragment>
                        ))}
                        {roleBaseApps.filter(app => {
                            if (isAdmin) return app.status === 'RECEIVED';
                            if (isCommissioner) return app.status === 'RECEIVED';
                            if (isDC) return app.status === 'ALLOCATED_TO_REGION';
                            if (isAssessor) return app.status === 'ALLOCATED_TO_ASSESSOR';
                            return false;
                        }).length === 0 && (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6, fontStyle: 'italic' }}>No new applications requiring immediate action</td></tr>
                            )}
                    </tbody>
                </table>
            </div>

            {/* FILTERABLE ALL APPLICATIONS SECTION */}
            <div id="archive-section" className="data-table-container" style={{ marginTop: '2.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
                <div className="table-header" style={{ padding: '1.5rem 2rem', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <h3 style={{ margin: 0, color: '#1a237e' }}>Review History & Regional Archive</h3>
                        <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 500 }}>Comprehensive view of all processed and pending files</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <select
                            onChange={(e) => setFilter(e.target.value)}
                            className="action-btn"
                            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 1rem', fontWeight: 600 }}
                            value={filter}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTION_REQUIRED">⚠️ Action Required</option>
                            <option value="RECEIVED">Received</option>
                            <option value="PROCESSING">In Processing</option>
                            <option value="SLIP_PENDING_VERIFICATION">⌛ Payment Slip Pending</option>
                            <option value="PARTIALLY_PAID">🌗 Partially Paid</option>
                            <option value="FULLY_PAID">💰 Fully Paid</option>
                            <option value="FINALIZED">Finalized</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="AMENDED">Amended</option>
                        </select>
                        <select
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="action-btn"
                            style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.4rem 1rem', fontWeight: 600 }}
                            value={categoryFilter}
                        >
                            <option value="ALL">All Categories</option>
                            <option value="OP">Opinion (OP)</option>
                            <option value="FI">Financial (FI)</option>
                            <option value="RT">Rate Tax (RT)</option>
                        </select>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '200px', background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>📂 FILE NUMBER</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>🏷️ TYPE</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>📅 SUBMITTED</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>👤 APPLICANT</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>⚡ STATUS</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textAlign: 'right' }}>⚙️ ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredApps.map((app, idx) => (
                            <React.Fragment key={app.id}>
                                <tr
                                    onClick={() => setSelectedAppId(selectedAppId === `history-${app.id}` ? null : `history-${app.id}`)}
                                    style={{ cursor: 'pointer', background: selectedAppId === `history-${app.id}` ? '#f1f5f9' : 'white' }}
                                >
                                    <td>
                                        <div style={{ fontWeight: 800, color: '#2d3748' }}>{app.permFileNo || app.tempFileNo}</div>
                                        {app.permFileNo && <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>Temp: {app.tempFileNo}</div>}
                                    </td>
                                    <td><span className="category-tag" style={{ background: '#f1f5f9', color: '#475569', fontWeight: 700, borderRadius: '6px' }}>{app.category}</span></td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{app.date}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{app.time}</div>
                                    </td>
                                    <td><div style={{ fontWeight: 600, color: '#444' }}>{app.applicant}</div></td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(app.status)}`}>
                                            {getStatusLabel(app.status)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="action-btn" style={{
                                                padding: '0.5rem 1.2rem',
                                                borderRadius: '8px',
                                                border: '1px solid #e2e8f0',
                                                background: selectedAppId === `history-${app.id}` ? 'var(--primary-color)' : '#f8fafc',
                                                color: selectedAppId === `history-${app.id}` ? 'white' : 'var(--primary-color)',
                                                fontSize: '0.75rem',
                                                fontWeight: 700
                                            }} onClick={(e) => { e.stopPropagation(); setSelectedAppId(selectedAppId === `history-${app.id}` ? null : `history-${app.id}`); }}>
                                                Track
                                            </button>
                                            <button className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem', borderRadius: '8px', background: 'var(--primary-color)', color: 'white' }} onClick={(e) => { e.stopPropagation(); handleViewAndPrint(app.id); }}>
                                                View
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                {selectedAppId === `history-${app.id}` && renderFullDetailsSection(app)}
                            </React.Fragment>
                        ))}
                        {filteredApps.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8', fontStyle: 'italic' }}>No records found matching your filters</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CommonDashboard;
