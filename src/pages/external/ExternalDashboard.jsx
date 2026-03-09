import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';
import GlobalSearch from '../components/GlobalSearch';

const ExternalDashboard = () => {
    const { applications, currentUser, logout } = useAppContext();
    const navigate = useNavigate();
    const [filter, setFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedAppId, setExpandedAppId] = useState(null);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // Show all applications as requested (previously filtered by currentUser)
    const myApps = applications;

    // Robust Unified Filtering Engine
    const filteredApps = (applications || []).filter(app => {
        const appStatus = (app.status || '').trim().toUpperCase();
        const selFilter = (filter || 'ALL').trim().toUpperCase();
        const selCat = (categoryFilter || 'ALL').trim().toUpperCase();
        const appCat = (app.category || '').trim().toUpperCase();

        // Status Matching Logic
        let statusMatch = false;
        if (selFilter === 'ALL') {
            statusMatch = true;
        } else if (selFilter === 'PROCESSING' || selFilter === 'IN PROCESSING' || selFilter === 'PROCESSING STAGE') {
            statusMatch = ['PROCESSING', 'ALLOCATED_TO_REGION', 'ALLOCATED_TO_ASSESSOR'].includes(appStatus);
        } else if (selFilter === 'ACTION_REQUIRED' || selFilter === 'ACTION REQUIRED') {
            statusMatch = ['AMENDED', 'INFORMATION_REQUESTED', 'REJECTED'].includes(appStatus);
        } else if (selFilter === 'FINALIZED') {
            statusMatch = ['FINALIZED', 'OPINION_ISSUED'].includes(appStatus) || appStatus.includes('FINALIZED');
        } else if (selFilter === 'RECEIVED') {
            statusMatch = appStatus === 'RECEIVED' || appStatus.includes('RECEIVED');
        } else {
            // Precise fallbacks
            statusMatch = appStatus === selFilter || getStatusLabel(appStatus).toUpperCase().includes(selFilter);
        }

        // Category Matching Logic
        const categoryMatch = selCat === 'ALL' || appCat === selCat || appCat.includes(selCat);

        // Global Search Logic
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
        // Sort descending: newest first — by date string, then by ID as fallback
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return (b.id || 0) - (a.id || 0); // Higher ID = more recently added
    });

    const getStatusStep = (status) => {
        switch (status) {
            case 'RECEIVED': return 0;
            case 'ALLOCATED_TO_REGION': return 1;
            case 'ALLOCATED_TO_ASSESSOR': return 2;
            case 'PROCESSING': return 2;
            case 'OPINION_ISSUED': return 3;
            case 'SLIP_PENDING_VERIFICATION': return 3;
            case 'PARTIALLY_PAID': return 4;
            case 'FULLY_PAID': return 5;
            case 'PAID_VERIFIED': return 5;
            case 'FINALIZED': return 5;
            default: return 0;
        }
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
            default: return status;
        }
    };

    const getStatusClass = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('allocated')) return 'bg-received text-blue-800';
        if (s.includes('processing')) return 'bg-amended text-blue-800';
        if (s.includes('information_requested') || s.includes('action_required')) return 'bg-rejected text-white';
        if (s.includes('finalized') || s.includes('issued') || s.includes('verified') || s.includes('fully_paid')) return 'bg-completed text-white';
        if (s.includes('partially_paid') || s.includes('pending_verification')) return 'bg-received text-blue-800';
        if (s.includes('rejected')) return 'bg-rejected text-white';
        if (s.includes('amended')) return 'bg-amended text-orange-900';
        return `bg-${s}`;
    };

    const toggleTimeline = (id) => {
        setExpandedAppId(expandedAppId === id ? null : id);
    };

    const actionApps = (myApps || []).filter(app => ['AMENDED', 'REJECTED', 'INFORMATION_REQUESTED'].includes((app.status || '').toUpperCase()));
    const activeApps = (myApps || []).filter(app => ['RECEIVED', 'ALLOCATED_TO_REGION', 'ALLOCATED_TO_ASSESSOR', 'PROCESSING', 'SLIP_PENDING_VERIFICATION', 'PARTIALLY_PAID'].includes((app.status || '').toUpperCase()));
    const queueApps = (myApps || []).filter(app => (app.status || '').toUpperCase() === 'RECEIVED');
    const opinionApps = (myApps || []).filter(app => (app.status || '').toUpperCase() === 'OPINION_ISSUED');
    const finalizedApps = (myApps || []).filter(app => ['FINALIZED', 'OPINION_ISSUED', 'FULLY_PAID', 'PAID_VERIFIED'].includes((app.status || '').toUpperCase()));

    const renderOpinionDetails = (app) => {
        if (!app.opinionForm) return null;

        let opinion = {};
        try {
            opinion = typeof app.opinionForm === 'string' ? JSON.parse(app.opinionForm) : app.opinionForm;
        } catch (e) { opinion = {}; }

        const propertyValue = parseFloat(opinion.propertyValue || 0);
        const stampDuty = parseFloat(opinion.stampDutyPayable || 0);

        return (
            <div style={{ background: 'linear-gradient(135deg, #e3f2fd, #ffffff)', padding: '1.2rem', borderRadius: '16px', border: '1px solid #bbdefb', marginBottom: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#1565c0', fontSize: '1rem', borderBottom: '2px solid #bbdefb', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📜 Official Opinion Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ background: '#f1f8e9', borderRadius: '10px', padding: '0.9rem', border: '1px solid #c8e6c9' }}>
                        <div style={{ fontSize: '0.7rem', color: '#388e3c', fontWeight: 700, textTransform: 'uppercase' }}>Value of the Property</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1b5e20', marginTop: '0.2rem' }}>
                            LKR {propertyValue > 0 ? propertyValue.toLocaleString() : 'Not specified'}
                        </div>
                    </div>
                    <div style={{ background: '#e3f2fd', borderRadius: '10px', padding: '0.9rem', border: '1px solid #90caf9' }}>
                        <div style={{ fontSize: '0.7rem', color: '#1565c0', fontWeight: 700, textTransform: 'uppercase' }}>Stamp Duty Payable</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0d47a1', marginTop: '0.2rem' }}>
                            LKR {stampDuty > 0 ? stampDuty.toLocaleString() : 'Not specified'}
                        </div>
                    </div>
                </div>
                {opinion.assessorRemarks && (
                    <div style={{ background: '#fffde7', padding: '0.8rem', borderRadius: '8px', border: '1px solid #fff176', marginBottom: '1rem', fontSize: '0.85rem' }}>
                        <strong style={{ color: '#f57f17', display: 'block', marginBottom: '0.2rem', fontSize: '0.7rem' }}>ASSESSOR REMARKS:</strong>
                        <div style={{ fontStyle: 'italic', color: '#37474f' }}>"{opinion.assessorRemarks}"</div>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>📄</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a237e' }}>{opinion.attachmentName || 'Official_Opinion.pdf'}</span>
                    </div>
                    <button
                        className="btn-primary"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', borderRadius: '6px' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (opinion.attachmentDataUrl) {
                                const a = document.createElement('a');
                                a.href = opinion.attachmentDataUrl;
                                a.download = opinion.attachmentName || 'Official_Opinion.pdf';
                                a.click();
                            } else {
                                alert('No file attached.');
                            }
                        }}
                    >
                        ⬇️ Download Opinion
                    </button>
                </div>
            </div>
        );
    };

    const renderAppFullDetails = (app) => {
        const data = app.fullData || {};
        return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'white', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.8rem', color: '#1a237e', fontSize: '0.85rem', borderBottom: '2px solid #e8eaf6', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>📂 Stakeholders & Docs</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <p style={{ fontSize: '0.85rem', color: '#4a5568', margin: 0 }}><strong style={{ color: '#2d3748' }}>Grantee:</strong> {data.grantees?.[0]?.name || 'N/A'} {data.grantees?.[0]?.tin ? `(TIN: ${data.grantees[0].tin})` : ''}</p>
                        <p style={{ fontSize: '0.85rem', color: '#4a5568', margin: 0 }}><strong style={{ color: '#2d3748' }}>Grantor:</strong> {data.grantors?.[0]?.name || 'N/A'} {data.grantors?.[0]?.tin ? `(TIN: ${data.grantors[0].tin})` : ''}</p>
                        <div>
                            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600, color: '#2d3748', margin: 0 }}>📎 Attachments ({data.attachments ? (Array.isArray(data.attachments) ? data.attachments.length : Object.keys(data.attachments).length) : 0})</p>
                        </div>
                    </div>
                </div>
                <div style={{ background: 'white', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 0.8rem', color: '#1a237e', fontSize: '0.85rem', borderBottom: '2px solid #e8eaf6', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>📍 Property Detail</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <p style={{ fontSize: '0.85rem', color: '#4a5568', margin: 0 }}><strong style={{ color: '#2d3748' }}>Address:</strong> {data.property?.address || 'N/A'}</p>
                        <p style={{ fontSize: '0.85rem', color: '#4a5568', margin: 0 }}><strong style={{ color: '#2d3748' }}>Town:</strong> {data.property?.town || 'N/A'}</p>
                        <p style={{ fontSize: '0.85rem', color: '#4a5568', margin: 0 }}><strong style={{ color: '#2d3748' }}>Extent:</strong> {data.property?.extent ? `${data.property.extent.acre}A ${data.property.extent.rood}R ${data.property.extent.perch}P` : 'N/A'}</p>
                    </div>
                </div>
            </div>
        );
    };

    const renderExpandedContent = (app) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.3s ease-out' }}>
            {/* Professional Timeline */}
            <div className="timeline-container" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div className="timeline">
                    <div className={`timeline-item ${getStatusStep(app.status) >= 1 ? 'completed' : ''} active`}>
                        <div className="timeline-dot"></div>
                        <p style={{ fontWeight: 700, fontSize: '0.75rem' }}>Filed</p>
                    </div>
                    <div className={`timeline-item ${getStatusStep(app.status) >= 2 ? 'completed' : ''} ${['ALLOCATED_TO_ASSESSOR', 'PROCESSING'].includes(app.status) ? 'active' : ''}`}>
                        <div className="timeline-dot"></div>
                        <p style={{ fontWeight: 700, fontSize: '0.75rem' }}>Assessing</p>
                    </div>
                    <div className={`timeline-item ${getStatusStep(app.status) >= 3 ? 'completed' : ''} ${app.status === 'OPINION_ISSUED' ? 'active' : ''}`}>
                        <div className="timeline-dot"></div>
                        <p style={{ fontWeight: 700, fontSize: '0.75rem' }}>Opinion Ready</p>
                    </div>
                    <div className={`timeline-item ${getStatusStep(app.status) >= 4 ? 'completed' : ''} ${app.status === 'FINALIZED' ? 'active' : ''}`}>
                        <div className="timeline-dot"></div>
                        <p style={{ fontWeight: 700, fontSize: '0.75rem' }}>Finalized</p>
                    </div>
                </div>
            </div>

            {/* Audit Detail for Issues */}
            {(app.status === 'AMENDED' || app.status === 'REJECTED' || app.lastActionComment) && (
                <div style={{
                    background: app.status === 'REJECTED' ? '#fff1f2' : (app.status === 'AMENDED' ? '#fff7ed' : '#f8fafc'),
                    padding: '1.2rem',
                    borderRadius: '12px',
                    borderLeft: `5px solid ${app.status === 'REJECTED' ? '#e11d48' : (app.status === 'AMENDED' ? '#f59e0b' : '#1a237e')}`,
                }}>
                    <p style={{ fontWeight: '800', color: app.status === 'REJECTED' ? '#e11d48' : (app.status === 'AMENDED' ? '#b45309' : '#1e293b'), marginBottom: '0.6rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {app.status === 'AMENDED' ? '⚠️ Amendment Required' : (app.status === 'REJECTED' ? '🚫 Application Rejected' : 'ℹ️ Department Update')}
                        <span style={{ fontWeight: 600, marginLeft: '0.8rem', color: '#64748b' }}>• {app.lastActionDate || 'Just now'}</span>
                    </p>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#334155', lineHeight: '1.5', fontWeight: 500 }}>
                        "{app.lastActionComment || `Your application status has been updated to ${getStatusLabel(app.status)}.`}"
                    </div>
                    {(app.status === 'AMENDED' || app.status === 'INFORMATION_REQUESTED') && (
                        <button
                            className="btn-primary"
                            style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                            onClick={() => navigate(`/external/edit-application/${app.id}`)}
                        >
                            ✏️ Open Application to Correct & Resubmit
                        </button>
                    )}
                </div>
            )}

            {renderOpinionDetails(app)}
            {renderAppFullDetails(app)}

            {/* Documents Section */}
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 1.2rem 0', color: '#1a237e', fontSize: '0.85rem', borderBottom: '2px solid #f0f4f8', paddingBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>📂 Submitted Documents</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                    {app.fullData?.attachments && (Array.isArray(app.fullData.attachments) ? app.fullData.attachments : Object.entries(app.fullData.attachments)).length > 0 ? (
                        (Array.isArray(app.fullData.attachments) ? app.fullData.attachments : Object.entries(app.fullData.attachments).map(([name, fileName], idx) => ({ id: idx, name, fileName }))).map((doc) => (
                            <div key={doc.id || doc.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #edf2f7' }}>
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{doc.fileName || doc.url?.split('/').pop()}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        className="action-btn"
                                        style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '6px', background: 'white', fontWeight: 700 }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const url = doc.url || '';
                                            if (!url) { alert('File data not available for this attachment.'); return; }
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
                                                } else {
                                                    window.open(url, '_blank');
                                                }
                                            } catch (err) {
                                                alert('Could not open file preview. Try downloading it instead.');
                                            }
                                        }}
                                    >
                                        👁️ View
                                    </button>
                                    <button
                                        className="action-btn"
                                        style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '6px', background: '#1a237e', color: 'white', fontWeight: 700, border: 'none' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const url = doc.url || '';
                                            if (url) {
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = doc.fileName || doc.name;
                                                a.click();
                                            } else {
                                                alert('File data not available for this attachment.');
                                            }
                                        }}
                                    >
                                        ⬇️ Download
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ gridColumn: 'span 2', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '10px', fontStyle: 'italic' }}>No documents attached.</p>
                    )}
                </div>
            </div>
        </div>
    );

    const renderActionRequiredBox = (apps) => {
        if (apps.length === 0) return null;
        return (
            <div className="data-table-container" style={{ borderTop: '4px solid #e11d48', marginTop: '1.5rem', boxShadow: '0 8px 30px rgba(225, 29, 72, 0.08)', borderRadius: '16px', overflow: 'hidden' }}>
                <div className="table-header" style={{ background: '#fff1f2', padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                        <div>
                            <h3 style={{ margin: 0, color: '#e11d48', fontSize: '1rem', fontWeight: 800 }}>Action Required - Immediate Attention</h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>Files requiring corrections</p>
                        </div>
                    </div>
                    <span style={{ background: '#e11d48', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>{apps.length} PENDING</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '200px', background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>📂 REFERENCE</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>🏷️ TYPE</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>📅 DATE</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800 }}>⚡ STATUS</th>
                            <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textAlign: 'right' }}>OPTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {apps.map(app => (
                            <React.Fragment key={app.id}>
                                <tr onClick={() => toggleTimeline(app.id)} style={{ cursor: 'pointer', background: expandedAppId === app.id ? '#fff1f2' : 'white' }}>
                                    <td><div style={{ fontWeight: 800, color: '#1a237e' }}>{app.permFileNo || app.tempFileNo}</div></td>
                                    <td><span className="category-tag" style={{ background: '#e2e8f0', color: '#1e293b', fontWeight: 700, borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>{app.category}</span></td>
                                    <td><div style={{ fontWeight: 700, color: '#455a64' }}>{app.date}</div></td>
                                    <td><span className={`status-badge ${getStatusClass(app.status)}`} style={{ fontWeight: 800, fontSize: '0.7rem' }}>{getStatusLabel(app.status)}</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', borderRadius: '8px', background: '#e11d48' }} onClick={(e) => { e.stopPropagation(); navigate(`/external/edit-application/${app.id}`); }}>Fix</button>
                                            <button className="action-btn" style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', fontWeight: 700 }} onClick={(e) => { e.stopPropagation(); navigate(`/external/view-application/${app.id}`); }}>🔍 View Full</button>
                                        </div>
                                    </td>
                                </tr>
                                {expandedAppId === app.id && (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '2rem', background: '#fff1f2', borderBottom: '3px solid #e11d48' }}>
                                            {renderExpandedContent(app)}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderAppTable = (apps, title, icon, emptyMsg, accentColor = 'var(--primary-color)', customHeader = null) => (
        <div className="data-table-container" style={{ borderTop: `4px solid ${accentColor}`, marginTop: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', borderRadius: '16px', overflow: 'hidden' }}>
            {customHeader ? customHeader : (
                <div className="table-header" style={{ padding: '1.2rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                        <div>
                            <h3 style={{ margin: 0, color: '#1a237e', fontSize: '1rem', fontWeight: 800 }}>{title}</h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>Total of {apps.length} items found</p>
                        </div>
                    </div>
                </div>
            )}
            <table>
                <thead>
                    <tr>
                        <th style={{ width: '200px', background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📦 FILE NUMBER</th>
                        <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏷️ TYPE</th>
                        <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>📅 SUBMITTED</th>
                        <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚡ STATUS</th>
                        <th style={{ background: 'transparent', padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.75rem', fontWeight: 800, textAlign: 'right', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚙️ ACTIONS</th>
                    </tr>
                </thead>
                <tbody>
                    {apps.map((app) => (
                        <React.Fragment key={app.id}>
                            <tr onClick={() => toggleTimeline(app.id)} style={{ cursor: 'pointer', background: expandedAppId === app.id ? '#f1f5f9' : 'white' }}>
                                <td><div style={{ fontWeight: 800, color: '#1a237e' }}>{app.permFileNo || app.tempFileNo}</div></td>
                                <td><span className="category-tag" style={{ background: '#e8eaf6', color: '#3f51b5', fontWeight: 800, borderRadius: '8px', padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>{app.category}</span></td>
                                <td><div style={{ fontWeight: 700, color: '#455a64' }}>{app.date}</div></td>
                                <td><span className={`status-badge ${getStatusClass(app.status)}`} style={{ fontWeight: 800, fontSize: '0.7rem' }}>{getStatusLabel(app.status)}</span></td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <button className="action-btn" style={{
                                            padding: '0.5rem 1.2rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            background: expandedAppId === app.id ? 'var(--primary-color)' : '#f8fafc',
                                            color: expandedAppId === app.id ? 'white' : 'var(--primary-color)',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }} onClick={(e) => { e.stopPropagation(); toggleTimeline(app.id); }}>
                                            Track
                                        </button>
                                        <button className="action-btn" style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', fontSize: '0.75rem', background: '#f8fafc', fontWeight: 700 }} onClick={(e) => { e.stopPropagation(); navigate(`/external/view-application/${app.id}`); }}>
                                            View
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            {expandedAppId === app.id && (
                                <tr>
                                    <td colSpan="5" style={{ padding: '2rem', background: '#f8fafc', borderBottom: `3px solid ${accentColor}` }}>
                                        {renderExpandedContent(app)}
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                    {apps.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6, fontStyle: 'italic' }}>{emptyMsg}</td></tr>}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="dashboard-view" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '3rem' }}>
            {/* --- PREMIUM HEADER --- */}
            <div className="content-header" style={{
                background: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                padding: '2rem',
                borderRadius: '0 0 32px 32px',
                boxShadow: '0 10px 40px rgba(26, 35, 126, 0.08)',
                border: '1px solid rgba(255,255,255,0.3)',
                marginBottom: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '22px',
                        background: 'linear-gradient(135deg, #1a237e, #3949ab)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 900,
                        boxShadow: '0 12px 24px rgba(26, 35, 126, 0.3)',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#1a237e', fontWeight: 900, letterSpacing: '-0.5px' }}>Dashboard Command Center</h1>
                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.4rem', alignItems: 'center' }}>
                            <span style={{ background: '#e8eaf6', color: '#1a237e', padding: '0.3rem 1.2rem', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                ✨ {currentUser?.name || 'User'}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Official Public Portal</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <button className="btn-primary"
                        style={{
                            padding: '0.8rem 2rem',
                            borderRadius: '14px',
                            fontWeight: 800,
                            fontSize: '0.9rem',
                            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))',
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 20px rgba(0, 43, 73, 0.2)',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                        onClick={() => navigate('/external/new-application')}
                    >
                        🚀 NEW APPLICATION
                    </button>
                    <div style={{ borderLeft: '2px solid #f1f5f9', paddingLeft: '2rem', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>{new Date().toLocaleDateString(undefined, { weekday: 'long' })}</div>
                        <div style={{ fontSize: '1.2rem', color: '#1a237e', fontWeight: 900, marginTop: '2px' }}>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                </div>
            </div>

            <div style={{ padding: '0 2.5rem' }}>
                {/* --- ANALYTICS QUICK GRID --- */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    {[
                        { label: 'Queue', val: queueApps.length, color: '#1a237e', icon: '📥', f: 'RECEIVED' },
                        { label: 'In Processing', val: activeApps.length, color: '#1e88e5', icon: '⚙️', f: 'PROCESSING' },
                        { label: 'Finalized', val: finalizedApps.length, color: '#2e7d32', icon: '✅', f: 'FINALIZED' },
                        { label: 'Amend/Reject', val: actionApps.length, color: '#e53935', icon: '⚠️', f: 'ACTION_REQUIRED' }
                    ].map((stat, i) => (
                        <div key={i}
                            onClick={() => setFilter(stat.f)}
                            style={{
                                background: 'white',
                                padding: '1.8rem',
                                borderRadius: '24px',
                                border: `1px solid ${filter === stat.f ? stat.color : '#f1f5f9'}`,
                                boxShadow: filter === stat.f ? `0 15px 35px rgba(0,0,0,0.06), 0 0 15px ${stat.color}15` : '0 10px 30px rgba(0,0,0,0.02)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px' }}>{stat.label}</span>
                                <div style={{ fontSize: '2.2rem', fontWeight: 900, color: stat.color, marginTop: '0.5rem' }}>{stat.val}</div>
                            </div>
                            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4.5rem', opacity: 0.05, transform: 'rotate(-15deg)' }}>{stat.icon}</div>
                            {filter === stat.f && <div style={{ position: 'absolute', top: 0, right: 0, width: '40px', height: '40px', background: stat.color, borderRadius: '0 0 0 100%', display: 'flex', justifyContent: 'flex-end', padding: '5px' }}>
                                <span style={{ color: 'white', fontSize: '0.8rem' }}>✓</span>
                            </div>}
                        </div>
                    ))}
                </div>

                {/* --- GLOBAL UNIFIED FILTER BAR --- */}
                <div style={{
                    background: 'white',
                    padding: '1.2rem 2rem',
                    borderRadius: '20px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #f1f5f9'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ background: '#1a237e', color: 'white', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 900 }}>LIVE TRACKER</span>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                Displaying <span style={{ color: '#1a237e' }}>{filteredApps.length}</span> results found
                            </p>
                        </div>
                        <GlobalSearch value={searchQuery} onChange={setSearchQuery} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <select
                                onChange={(e) => setFilter(e.target.value)}
                                value={filter}
                                style={{
                                    appearance: 'none',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '0.7rem 2.5rem 0.7rem 1.2rem',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    color: '#1a237e',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    minWidth: '200px'
                                }}
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="ACTION_REQUIRED">⚠️ Action Required</option>
                                <option value="RECEIVED">Pending Review</option>
                                <option value="PROCESSING">In Processing</option>
                                <option value="SLIP_PENDING_VERIFICATION">⌛ Payment Slip Pending</option>
                                <option value="PARTIALLY_PAID">🌗 Partially Paid</option>
                                <option value="FULLY_PAID">💰 Fully Paid</option>
                                <option value="FINALIZED">Finalized</option>
                                <option value="REJECTED">Rejected</option>
                                <option value="AMENDED">Amended Required</option>
                            </select>
                            <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔽</span>
                        </div>

                        <div style={{ position: 'relative' }}>
                            <select
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                value={categoryFilter}
                                style={{
                                    appearance: 'none',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '0.7rem 2.5rem 0.7rem 1.2rem',
                                    fontWeight: 800,
                                    fontSize: '0.85rem',
                                    color: '#1a237e',
                                    cursor: 'pointer',
                                    outline: 'none',
                                    minWidth: '200px'
                                }}
                            >
                                <option value="ALL">All Categories</option>
                                <option value="OP">Opinion (OP)</option>
                                <option value="FI">Financial (FI)</option>
                                <option value="RT">Rate Tax (RT)</option>
                            </select>
                            <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>🔽</span>
                        </div>
                    </div>
                </div>

                {/* --- PRIORITY ALERT AREA (If filters allow) --- */}
                {filter === 'ALL' || filter === 'ACTION_REQUIRED' ? renderActionRequiredBox(filteredApps.filter(app => ['AMENDED', 'REJECTED', 'INFORMATION_REQUESTED'].includes(app.status?.toUpperCase()))) : null}

                {/* --- MAIN DATA TABLE --- */}
                <div style={{ marginTop: '2.5rem' }}>
                    {renderAppTable(
                        filteredApps,
                        'Application Records',
                        '📜',
                        'No applications found matching the current global filters.',
                        '#1a237e',
                        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(to right, #fafafa, #ffffff)' }}>
                            <h3 style={{ margin: 0, color: '#1a237e', fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                📋 Detailed Log Ledger
                                <span style={{ background: '#e8eaf6', color: '#1a237e', fontSize: '0.7rem', padding: '0.2rem 0.8rem', borderRadius: '10px' }}>SECURE</span>
                            </h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExternalDashboard;
