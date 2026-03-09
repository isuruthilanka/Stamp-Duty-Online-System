import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const ExternalApplicationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { applications, updateApplication } = useAppContext();
    const fileInputRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentSlip, setPaymentSlip] = useState(null);
    const [slipName, setSlipName] = useState('');

    const app = applications.find(a => a.id === parseInt(id));

    let opinionData = null;
    try {
        if (app?.opinionForm) {
            opinionData = typeof app.opinionForm === 'string'
                ? JSON.parse(app.opinionForm)
                : app.opinionForm;
        }
    } catch (e) {
        console.error("External opinion parsing error:", e);
    }
    const data = app?.fullData || {};
    const paymentData = Array.isArray(app?.paymentData) ? app.paymentData : [];

    const rawDuty = (app?.category === 'FI' || app?.category === 'RT')
        ? opinionData?.totalPayable
        : opinionData?.stampDutyPayable;
    const totalDuty = parseInt(String(rawDuty || 0).replace(/[^0-9]/g, '') || 0);
    const totalPaid = paymentData.reduce((sum, p) => p.status === 'VERIFIED' ? sum + parseFloat(p.amount || 0) : sum, 0);
    const pendingVerification = paymentData.reduce((sum, p) => p.status === 'PENDING' ? sum + parseFloat(p.amount || 0) : sum, 0);
    const totalCommitted = totalPaid + pendingVerification;
    const remainingBalance = totalDuty - totalPaid;
    const effectiveBalance = totalDuty - totalCommitted;

    const canPay = (app?.status === 'OPINION_ISSUED' || app?.status === 'PARTIALLY_PAID' || app?.status === 'SLIP_PENDING_VERIFICATION') && remainingBalance > 0;
    const showPaymentSection = !!opinionData && totalDuty > 0;

    // REJECTED: can only edit if Assessor explicitly allowed resubmission
    // INFORMATION_REQUESTED / AMENDED: always editable
    const isRejected = app && app.status === 'REJECTED';
    const isClosed = app && app.status === 'CLOSED';
    const canEdit = app && (
        ['AMENDED', 'INFORMATION_REQUESTED'].includes(app.status) ||
        (app.status === 'REJECTED' && app.allowResubmission === true)
    );

    if (!app) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2 style={{ color: '#1a237e', fontWeight: 900 }}>Application not found</h2>
            <button
                className="btn-primary"
                onClick={() => navigate('/external')}
                style={{ marginTop: '1rem', background: '#1a237e', color: 'white', padding: '0.8rem 2rem', borderRadius: '12px', border: 'none', fontWeight: 800 }}
            >
                Back to Dashboard
            </button>
        </div>
    );

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
            case 'REJECTED': return '🚫 Rejected';
            case 'CLOSED': return '🔒 Permanently Closed';
            case 'RESUBMITTED': return 'Resubmitted';
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
        if (s.includes('finalized') || s.includes('issued') || s.includes('verified')) return 'bg-completed text-white';
        if (s.includes('fully_paid')) return 'bg-completed text-white';
        if (s.includes('partially_paid') || s.includes('pending_verification')) return 'bg-received text-blue-800';
        if (s.includes('rejected')) return 'bg-rejected text-white';
        if (s.includes('amended')) return 'bg-amended text-orange-900';
        return `bg-${s}`;
    };

    const getHighlightStyle = (sectionKey) => {
        if (app?.fullData?.amendments?.includes(sectionKey)) {
            return {
                border: '2px solid #f97316',
                background: '#fff7ed',
                position: 'relative'
            };
        }
        return {};
    };

    const renderHighlightBadge = (sectionKey) => {
        if (app?.fullData?.amendments?.includes(sectionKey)) {
            const badgeText = app.status === 'RESUBMITTED' ? '⚠️ Corrected Section' : '⚠️ Amendment Required';
            return (
                <span style={{
                    position: 'absolute', top: '-12px', right: '20px',
                    background: '#f97316', color: 'white', padding: '4px 12px',
                    borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                    boxShadow: '0 2px 4px rgba(249, 115, 22, 0.3)', zIndex: 10
                }}>
                    {badgeText}
                </span>
            );
        }
        return null;
    };

    const handlePrint = () => {
        window.print();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSlipName(file.name);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPaymentSlip(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!paymentAmount || !paymentSlip) return alert('Please enter amount and upload payment slip');

        const amount = parseFloat(paymentAmount);
        if (amount <= 0) return alert('Please enter a valid amount');
        if (amount > effectiveBalance) return alert(`Amount exceeds committable balance of LKR ${effectiveBalance.toLocaleString()}. Please enter a lesser amount.`);
        if (paymentData.length >= 3) return alert('Maximum of 3 installments allowed');

        setIsSubmitting(true);
        try {
            const newPayment = {
                id: `pay-${Date.now()}`,
                amount: amount,
                slipUrl: paymentSlip,
                slipName: slipName,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                status: 'PENDING', // Pending Assessor Verification
                remarks: ''
            };

            const updatedPaymentData = [...paymentData, newPayment];

            await updateApplication(app.id, {
                paymentData: updatedPaymentData,
                status: 'SLIP_PENDING_VERIFICATION',
                lastActionComment: `New payment installment of LKR ${amount.toLocaleString()} submitted`,
                lastActionDate: new Date().toLocaleString('en-GB'),
                activityLog: [
                    ...(app.activityLog || []),
                    {
                        action: 'Payment Installment Submitted',
                        date: new Date().toLocaleString('en-GB'),
                        user: app.applicant || 'External User',
                        comment: `New slip uploaded for LKR ${amount.toLocaleString()}. Status: Pending Verification.`
                    }
                ]
            });

            alert('Payment installment submitted successfully for verification');
            setPaymentAmount('');
            setPaymentSlip(null);
            setSlipName('');
        } catch (error) {
            console.error('Payment submission failed:', error);
            alert('Failed to submit payment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh' }}>
            {/* Action Bar (Buttons) - Hidden during print */}
            <div className="no-print" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                background: 'white',
                padding: '1.2rem 2rem',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                border: '1px solid #e2e8f0'
            }}>
                <button
                    onClick={() => navigate('/external')}
                    style={{ background: 'white', color: '#1a237e', border: '2px solid #1a237e', padding: '0.6rem 1.2rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                    ← BACK TO DASHBOARD
                </button>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handlePrint}
                        style={{ background: '#1a237e', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        🖨️ PRINT APPLICATION
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{ background: '#059669', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        📄 DOWNLOAD AS PDF
                    </button>
                </div>
            </div>

            {/* MAIN DOCUMENT AREA */}
            <div className="official-a4-document">
                {/* Government Header (Visible in Print) */}
                <div className="print-only-header" style={{ display: 'none', textAlign: 'center', marginBottom: '1.5rem', borderBottom: '3px double #000', paddingBottom: '1rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <img src="/emblem-sri-lanka.svg" alt="Emblem" width="60" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 700, textTransform: 'uppercase' }}>Department of Revenue - Western Province</h2>
                    <h3 style={{ margin: '0.2rem 0', fontSize: '14pt', fontWeight: 600 }}>Stamp Duty Online System</h3>
                    <p style={{ margin: 0, fontSize: '10pt', fontStyle: 'italic' }}>Official Application Record</p>
                </div>

                {/* Main Header / Status */}
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '24px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #e2e8f0'
                }} className="document-header-box">
                    <div>
                        <h1 style={{ margin: 0, color: '#1a237e', fontWeight: 900, fontSize: '2rem' }}>{app.permFileNo || app.tempFileNo}</h1>
                        <p style={{ color: '#64748b', marginTop: '0.5rem', fontWeight: 600 }}>Reference: {app.tempFileNo || 'N/A'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className={`status-badge ${(app.status || '').toLowerCase()}`} style={{ fontSize: '1rem', padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 800 }}>
                            {getStatusLabel(app.status)}
                        </span>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem', fontWeight: 700 }}>SUBMITTED ON: {app.date} | {app.time}</p>
                    </div>
                </div>

                {/* Activity Timeline (Horizontal/Compact for External) */}
                <div className="no-print" style={{
                    background: 'white',
                    padding: '1.5rem 2rem',
                    borderRadius: '20px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    marginBottom: '2rem',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ margin: '0 0 1.2rem 0', color: '#1a237e', fontSize: '1.1rem', fontWeight: 800 }}>⏳ Application Processing Timeline</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {app.activityLog && app.activityLog.length > 0 ? (
                            [...app.activityLog].reverse().map((log, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-start',
                                    borderLeft: `3px solid ${index === 0 ? '#1a237e' : '#e2e8f0'}`,
                                    paddingLeft: '1rem',
                                    paddingBottom: index === app.activityLog.length - 1 ? 0 : '0.5rem'
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: index === 0 ? '#1a237e' : '#475569' }}>{log.action}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>{log.date}</span>
                                        </div>
                                        {log.comment && <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>{log.comment}</p>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ margin: 0, color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>Initial submission recorded on {app.date}.</p>
                        )}
                    </div>
                </div>

                {/* Rejection / Closure Alert - replaces normal edit alert for REJECTED/CLOSED */}
                {(isRejected || isClosed) && (
                    <div className="no-print" style={{
                        background: isClosed ? '#1f2937' : '#fff1f2',
                        padding: '1.5rem 2rem',
                        borderRadius: '20px',
                        border: `1px solid ${isClosed ? '#374151' : '#fda4af'}`,
                        marginBottom: '2rem'
                    }}>
                        {isClosed ? (
                            <>
                                <h3 style={{ color: '#f9fafb', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    🔒 File Permanently Closed
                                </h3>
                                <p style={{ color: '#9ca3af', margin: 0 }}>This application has been permanently closed by the department. No further actions are possible.</p>
                            </>
                        ) : (
                            <>
                                <h3 style={{ color: '#be123c', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    🚫 Application Rejected
                                </h3>
                                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #fecdd3', marginBottom: '1rem' }}>
                                    <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.8rem', fontWeight: 800, color: '#be123c', textTransform: 'uppercase' }}>Rejection Scenario</p>
                                    <p style={{ margin: '0 0 0.8rem 0', fontWeight: 700 }}>{app.rejectionScenario || 'General Rejection'}</p>
                                    <p style={{ margin: '0 0 0.3rem 0', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Instructions from Assessor</p>
                                    <p style={{ margin: 0, lineHeight: '1.6' }}>{app.rejectionInstructions || app.lastActionComment}</p>
                                </div>
                                {canEdit ? (
                                    <button
                                        onClick={() => navigate(`/external/edit-application/${app.id}`)}
                                        style={{ background: '#be123c', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer' }}
                                    >
                                        ✅ Correct &amp; Resubmit Application
                                    </button>
                                ) : (
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic', fontWeight: 600 }}>Resubmission has not been permitted for this rejection. Please contact the department for further guidance.</p>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Alert Box for OTHER action-required statuses (NOT rejection) */}
                {canEdit && !isRejected && (
                    <div className="no-print" style={{
                        background: '#fff7ed',
                        borderRadius: '20px',
                        border: '1px solid #fed7aa',
                        marginBottom: '2rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ flex: 1, marginRight: '2rem' }}>
                            <h3 style={{ color: '#9a3412', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 900 }}>
                                ⚠️ Action Required
                            </h3>
                            <p style={{ color: '#c2410c', fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>
                                {app.lastActionComment || "Updates/corrections have been requested for this application."}
                            </p>
                        </div>
                        <button
                            onClick={() => navigate(`/external/edit-application/${app.id}`)}
                            style={{ background: '#ea580c', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '12px', border: 'none', fontWeight: 900, cursor: 'pointer' }}
                        >
                            MODIFY & RESUBMIT
                        </button>
                    </div>
                )}

                {/* Content Grid (Linearized in Print) */}
                <div className="application-content-layout">

                    {/* 1. BASIC INFORMATION */}
                    <div className="detail-section">
                        <h3 className="section-title">1. GENERAL APPLICATION INFORMATION</h3>
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td><strong>Temporary File No:</strong></td>
                                    <td>{app.tempFileNo || '-'}</td>
                                    <td><strong>Permanent File No:</strong></td>
                                    <td>{app.permFileNo || 'Pending'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Application Type:</strong></td>
                                    <td>{app.category === 'OP' ? 'Opinion (OP)' : app.category === 'FI' ? 'Financial (FI)' : 'Rate Tax (RT)'}</td>
                                    <td><strong>Submission Region:</strong></td>
                                    <td>{app.region || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Submission Date:</strong></td>
                                    <td>{app.date}</td>
                                    <td><strong>Submission Time:</strong></td>
                                    <td>{app.time}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 2. APPLICANT DETAILS */}
                    <div className="detail-section">
                        <h3 className="section-title">2. PRIMARY APPLICANT / GRANTEE DETAILS</h3>
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td><strong>Full Name:</strong></td>
                                    <td colSpan="3">{app.applicant || data.grantees?.[0]?.name || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td><strong>NIC / Passport / Reg No:</strong></td>
                                    <td>{data.applicant?.reference || data.grantees?.[0]?.reference || 'N/A'}</td>
                                    <td><strong>Taxpayer ID (TIN):</strong></td>
                                    <td>{data.applicant?.tin || data.grantees?.[0]?.tin || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Contact Number:</strong></td>
                                    <td>{data.applicant?.contact || data.grantees?.[0]?.contact || 'N/A'}</td>
                                    <td><strong>Email Address:</strong></td>
                                    <td>{data.applicant?.email || data.grantees?.[0]?.email || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 3. NOTARY / LEGAL REP */}
                    {data.notary && (
                        <div className="detail-section" style={{ ...getHighlightStyle('notary') }}>
                            {renderHighlightBadge('notary')}
                            <h3 className="section-title">3. NOTARY / LEGAL REPRESENTATIVE DETAILS</h3>
                            <table className="info-table">
                                <tbody>
                                    <tr>
                                        <td><strong>Notary Name:</strong></td>
                                        <td colSpan="3">{data.notary.name}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Bar Association No:</strong></td>
                                        <td>{data.notary.barNo || '-'}</td>
                                        <td><strong>Taxpayer ID (TIN):</strong></td>
                                        <td>{data.notary.tin || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Office Address:</strong></td>
                                        <td colSpan="3">{data.notary.address}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Contact:</strong></td>
                                        <td>{data.notary.contact}</td>
                                        <td><strong>Email:</strong></td>
                                        <td>{data.notary.email}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 4. TRANSFERORS / SELLERS */}
                    <div className="detail-section" style={{ ...getHighlightStyle('grantors') }}>
                        {renderHighlightBadge('grantors')}
                        <h3 className="section-title">4. GRANTORS / TRANSFERORS DETAILS</h3>
                        <table className="info-table bordered">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Full Name</th>
                                    <th>NIC / Passport</th>
                                    <th>TIN</th>
                                    <th>Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.grantors || []).map((g, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td><strong>{g.name}</strong></td>
                                        <td>{g.reference}</td>
                                        <td>{g.tin || '-'}</td>
                                        <td>{g.address}</td>
                                    </tr>
                                ))}
                                {(!data.grantors || data.grantors.length === 0) && (
                                    <tr><td colSpan="5" className="text-center">No grantors listed</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 5. TRANSFEREES / BUYERS */}
                    <div className="detail-section" style={{ ...getHighlightStyle('grantees') }}>
                        {renderHighlightBadge('grantees')}
                        <h3 className="section-title">5. GRANTEES / TRANSFEREES DETAILS</h3>
                        <table className="info-table bordered">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Full Name</th>
                                    <th>NIC / Passport / Reg No</th>
                                    <th>TIN</th>
                                    <th>Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.grantees || []).map((g, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td><strong>{g.name}</strong></td>
                                        <td>{g.reference}</td>
                                        <td>{g.tin || '-'}</td>
                                        <td>{g.address}</td>
                                    </tr>
                                ))}
                                {(!data.grantees || data.grantees.length === 0) && (
                                    <tr><td colSpan="5" className="text-center">No grantees listed</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 6. PROPERTY DETAILS */}
                    <div className="detail-section" style={{ ...getHighlightStyle('property') }}>
                        {renderHighlightBadge('property')}
                        <h3 className="section-title">6. PROPERTY & LAND DETAILS</h3>
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td><strong>Local Authority:</strong></td>
                                    <td>{data.property?.localAuthority}</td>
                                    <td><strong>Instrument Nature:</strong></td>
                                    <td>{data.property?.nature}</td>
                                </tr>
                                <tr>
                                    <td><strong>Property Address:</strong></td>
                                    <td colSpan="3">{data.property?.address}</td>
                                </tr>
                                <tr>
                                    <td><strong>Land Type:</strong></td>
                                    <td>{data.property?.landType}</td>
                                    <td><strong>Total Extent:</strong></td>
                                    <td>{data.property?.extent ? `${data.property.extent.acre}A ${data.property.extent.rood}R ${data.property.extent.perch}P` : 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td><strong>Plan Number:</strong></td>
                                    <td>{data.property?.planNo}</td>
                                    <td><strong>Plan Date:</strong></td>
                                    <td>{data.property?.planDate}</td>
                                </tr>
                                <tr>
                                    <td><strong>Lot / Plot Number:</strong></td>
                                    <td>{data.property?.lotNo}</td>
                                    <td><strong>Surveyor Name:</strong></td>
                                    <td>{data.property?.surveyor}</td>
                                </tr>
                                <tr>
                                    <td><strong>Coordinates:</strong></td>
                                    <td>Lat: {data.property?.lat || 'N/A'} | Lng: {data.property?.lng || 'N/A'}</td>
                                    <td><strong>Maps Link:</strong></td>
                                    <td><a href={data.property?.mapUrl} target="_blank" rel="noreferrer" style={{ color: '#1a237e', textDecoration: 'underline' }}>View on Google Maps</a></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* 7. BUILDING INFORMATION */}
                    {data.building && (
                        <div className="detail-section" style={{ ...getHighlightStyle('building') }}>
                            {renderHighlightBadge('building')}
                            <h3 className="section-title">7. BUILDING / STRUCTURE INFORMATION</h3>
                            <table className="info-table">
                                <tbody>
                                    <tr>
                                        <td><strong>Structure Type:</strong></td>
                                        <td>{data.building.type}</td>
                                        <td><strong>Building Plan No:</strong></td>
                                        <td>{data.building.planNo || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Construction Year:</strong></td>
                                        <td>{data.building.year || '-'}</td>
                                        <td><strong>Unit / Assessment No:</strong></td>
                                        <td>{data.building.unitNo || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Floor Count:</strong></td>
                                        <td>{data.building.floors?.length || 1}</td>
                                        <td><strong>Is Rented:</strong></td>
                                        <td>{data.building.isRented ? 'Yes' : 'No'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Facilities:</strong></td>
                                        <td colSpan="3">{data.building.facilities || 'Basic'}</td>
                                    </tr>
                                    {data.building.isRented && (
                                        <tr>
                                            <td><strong>Monthly Rent:</strong></td>
                                            <td colSpan="3">LKR {(parseFloat(data.building.rent || 0)).toLocaleString()}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {data.building.floors && data.building.floors.length > 0 && (
                                <table className="info-table bordered" style={{ marginTop: '1rem' }}>
                                    <thead>
                                        <tr>
                                            <th>Floor Level</th>
                                            <th>Floor Area (Sq. Ft.)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.building.floors.map((f, i) => (
                                            <tr key={i}>
                                                <td>{f.floorNo}</td>
                                                <td>{f.area || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* 8. TRANSACTION VALUE */}
                    <div className="detail-section" style={{ ...getHighlightStyle('value') }}>
                        {renderHighlightBadge('value')}
                        <h3 className="section-title">8. TRANSACTION VALUATION SUMMARY</h3>
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td><strong>Consideration Value:</strong></td>
                                    <td><strong style={{ color: '#1a237e' }}>LKR {(parseFloat(data.value?.purchase || 0)).toLocaleString()}</strong></td>
                                    <td><strong>Reported Market Value:</strong></td>
                                    <td><strong>LKR {(parseFloat(data.value?.marketValue || 0)).toLocaleString()}</strong></td>
                                </tr>
                                <tr>
                                    <td><strong>Crops / Plantation Value:</strong></td>
                                    <td>LKR {(parseFloat(data.value?.cropsValue || 0)).toLocaleString()}</td>
                                    <td><strong>Loan / Mortgage Info:</strong></td>
                                    <td>{data.value?.loanDetails || 'None'}</td>
                                </tr>
                                {data.previousOpinion?.hasOne && (
                                    <tr>
                                        <td><strong>Previous Opinion Ref:</strong></td>
                                        <td colSpan="3">{data.previousOpinion.no}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 8.5 OFFICIAL OPINION / APPROVED VALUES OR DEFICIENCY NOTICE */}
                    {opinionData && (app.status === 'OPINION_ISSUED' || (app.status || '').includes('PAID')) && (
                        <div className="detail-section">
                            {opinionData.isDeficiencyNotice ? (
                                <>
                                    <h3 className="section-title" style={{ color: '#991b1b', borderBottomColor: '#fca5a5' }}>8.5. OFFICIAL DEFICIENCY & PENALTY NOTICE</h3>
                                    <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                                        <table className="info-table" style={{ background: 'transparent' }}>
                                            <tbody>
                                                <tr>
                                                    <td><strong>Reported Value:</strong></td>
                                                    <td><strong style={{ color: '#047857', fontSize: '1.05rem' }}>LKR {opinionData.propertyValue}</strong></td>
                                                    <td><strong>Required Stamp Duty:</strong></td>
                                                    <td><strong style={{ color: '#1d4ed8', fontSize: '1.05rem' }}>LKR {opinionData.stampDutyPayable}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Stamp Duty Paid:</strong></td>
                                                    <td><strong style={{ color: '#059669', fontSize: '1.05rem' }}>LKR {opinionData.stampAffixed}</strong></td>
                                                    <td><strong>Deficiency Amount:</strong></td>
                                                    <td><strong style={{ color: '#b45309', fontSize: '1.05rem' }}>LKR {opinionData.deficiencyAmount}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Penalty Form:</strong></td>
                                                    <td><strong style={{ color: '#b91c1c', fontSize: '1.05rem' }}>{opinionData.penaltyRate}% (LKR {opinionData.penaltyAmount})</strong></td>
                                                    <td><strong>Total Amount Payable:</strong></td>
                                                    <td><strong style={{ color: '#b91c1c', fontSize: '1.1rem' }}>LKR {opinionData.totalPayable}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Assessor Remarks:</strong></td>
                                                    <td colSpan="3">{opinionData.assessorRemarks || 'None'}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Notice Issued By:</strong></td>
                                                    <td>{opinionData.issuedBy} ({opinionData.designation})</td>
                                                    <td><strong>Issue Date:</strong></td>
                                                    <td>{opinionData.issuedDate}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="section-title" style={{ color: '#8a6d3b', borderBottomColor: '#fde073' }}>8.5. OFFICIAL OPINION & APPROVED STAMP DUTY</h3>
                                    <div style={{ background: '#fdf8e3', padding: '1rem', borderRadius: '8px', border: '1px solid #fde073' }}>
                                        <table className="info-table" style={{ background: 'transparent' }}>
                                            <tbody>
                                                <tr>
                                                    <td><strong>Approved Property Value:</strong></td>
                                                    <td><strong style={{ color: '#0d47a1', fontSize: '1.05rem' }}>LKR {opinionData.propertyValue}</strong></td>
                                                    <td><strong>Approved Stamp Duty:</strong></td>
                                                    <td><strong style={{ color: '#b71c1c', fontSize: '1.05rem' }}>LKR {opinionData.stampDutyPayable}</strong></td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Assessor Remarks:</strong></td>
                                                    <td colSpan="3">{opinionData.assessorRemarks || 'None'}</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Opinion Issued By:</strong></td>
                                                    <td>{opinionData.issuedBy} ({opinionData.designation})</td>
                                                    <td><strong>Issue Date:</strong></td>
                                                    <td>{opinionData.issuedDate}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* NEW: 8.6 STAMP DUTY PAYMENT TRACKING */}
                    {showPaymentSection && (
                        <div className="detail-section">
                            <h3 className="section-title" style={{ color: '#2563eb', borderBottomColor: '#93c5fd' }}>8.6. STAMP DUTY PAYMENT TRACKING</h3>

                            {/* Summary Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '12px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#1e40af', fontWeight: 800 }}>{(app?.category === 'FI' || app?.category === 'RT') ? 'TOTAL AMOUNT PAYABLE' : 'TOTAL DUTY'}</p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', color: '#1e3a8a', fontWeight: 900 }}>LKR {totalDuty.toLocaleString()}</p>
                                </div>
                                <div style={{ background: '#ecfdf5', padding: '1rem', borderRadius: '12px', border: '1px solid #a7f3d0', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#065f46', fontWeight: 800 }}>AMOUNT PAID</p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', color: '#064e3b', fontWeight: 900 }}>LKR {Number(totalPaid || 0).toLocaleString()}</p>
                                </div>
                                <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '12px', border: '1px solid #fde68a', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e', fontWeight: 800 }}>VERIFICATION PENDING</p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', color: '#78350f', fontWeight: 900 }}>LKR {pendingVerification.toLocaleString()}</p>
                                </div>
                                <div style={{ background: effectiveBalance <= 0 ? '#f0fdf4' : '#fef2f2', padding: '1rem', borderRadius: '12px', border: `1px solid ${effectiveBalance <= 0 ? '#bbf7d0' : '#fecaca'}`, textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: effectiveBalance <= 0 ? '#166534' : '#991b1b', fontWeight: 800 }}>FINAL BALANCE TO PAY</p>
                                    <p style={{ margin: '0.2rem 0 0', fontSize: '1.2rem', color: effectiveBalance <= 0 ? '#14532d' : '#7f1d1d', fontWeight: 900 }}>LKR {Math.max(0, effectiveBalance).toLocaleString()}</p>
                                    {pendingVerification > 0 && <span style={{ fontSize: '0.65rem', color: '#64748b' }}>(After pending verification)</span>}
                                </div>
                            </div>

                            {/* Payment History Table */}
                            <h4 style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 800, marginBottom: '0.8rem' }}>PAYMENT INSTALLMENT HISTORY ({paymentData.length}/3)</h4>
                            <table className="info-table bordered" style={{ marginBottom: '2rem' }}>
                                <thead>
                                    <tr>
                                        <th>Installment</th>
                                        <th>Amount (LKR)</th>
                                        <th>Date Submitted</th>
                                        <th>Slip Reference</th>
                                        <th>Verification Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentData.map((p, index) => (
                                        <tr key={p.id}>
                                            <td style={{ fontWeight: 700 }}>{index + 1}/3</td>
                                            <td style={{ fontWeight: 800 }}>{Number(p.amount || 0).toLocaleString()}</td>
                                            <td>{p.date}</td>
                                            <td>
                                                <button
                                                    onClick={() => window.open(p.slipUrl, '_blank')}
                                                    style={{ background: 'none', border: 'none', color: '#2563eb', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem' }}
                                                >
                                                    {p.slipName || 'View Slip'}
                                                </button>
                                            </td>
                                            <td>
                                                <span style={{
                                                    padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900,
                                                    background: p.status === 'VERIFIED' ? '#dcfce7' : p.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                                    color: p.status === 'VERIFIED' ? '#166534' : p.status === 'REJECTED' ? '#991b1b' : '#92400e',
                                                    border: `1px solid ${p.status === 'VERIFIED' ? '#bbf7d0' : p.status === 'REJECTED' ? '#fecaca' : '#fde68a'}`
                                                }}>
                                                    {p.status === 'VERIFIED' ? '✅ VERIFIED' : p.status === 'REJECTED' ? '❌ REJECTED' : '⏳ PENDING'}
                                                </span>
                                                {p.remarks && <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem', fontStyle: 'italic' }}>Note: {p.remarks}</p>}
                                            </td>
                                        </tr>
                                    ))}
                                    {paymentData.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                No payment installments submitted yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Submit New Installment Form */}
                            {remainingBalance > 0 && paymentData.length < 3 && canPay && (
                                <div className="no-print" style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontWeight: 800, fontSize: '1rem' }}>📤 Submit New Payment Installment</h4>
                                    {effectiveBalance <= 0 ? (
                                        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '1rem', color: '#92400e', fontSize: '0.9rem', fontWeight: 600 }}>
                                            ⏳ Your previous payment slip is currently pending verification. Once verified, you can submit the next installment for the remaining balance of <strong>LKR {remainingBalance.toLocaleString()}</strong>.
                                        </div>
                                    ) : (
                                        <>
                                            <form onSubmit={handlePaymentSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Amount to Pay (LKR)</label>
                                                    <input
                                                        type="number"
                                                        value={paymentAmount}
                                                        onChange={e => setPaymentAmount(e.target.value)}
                                                        placeholder={`Max LKR ${effectiveBalance.toLocaleString()}`}
                                                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                                        max={effectiveBalance}
                                                    />
                                                </div>
                                                <div className="form-group" style={{ marginBottom: 0 }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b' }}>Upload Bank Slip (PDF/JPG/PNG)</label>
                                                    <div
                                                        onClick={() => fileInputRef.current.click()}
                                                        style={{
                                                            padding: '0.8rem', borderRadius: '8px', border: '2px dashed #cbd5e1',
                                                            textAlign: 'center', cursor: 'pointer', background: '#f8fafc',
                                                            fontSize: '0.85rem', color: slipName ? '#059669' : '#64748b', fontWeight: slipName ? 700 : 500
                                                        }}
                                                    >
                                                        {slipName || 'Click to select slip file'}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleFileChange}
                                                        style={{ display: 'none' }}
                                                        accept="image/*,.pdf"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    style={{
                                                        background: '#2563eb', color: 'white', border: 'none',
                                                        padding: '0.8rem 2rem', borderRadius: '12px', fontWeight: 800,
                                                        cursor: 'pointer', transition: 'all 0.2s', opacity: isSubmitting ? 0.7 : 1
                                                    }}
                                                >
                                                    {isSubmitting ? 'SUBMITTING...' : 'SUBMIT SLIP'}
                                                </button>
                                            </form>
                                            <p style={{ margin: '1rem 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                * You can pay in a maximum of 3 installments. Each slip must be verified by the department.
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}

                            {paymentData.length >= 3 && remainingBalance > 0 && (
                                <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '12px', border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem', fontWeight: 600 }}>
                                    ⚠️ Maximum installment limit (3) reached. Please contact the department for balance payment instructions.
                                </div>
                            )}
                        </div>
                    )}

                    {/* 9. ATTACHMENTS */}
                    <div className="detail-section" style={{ ...getHighlightStyle('attachments') }}>
                        {renderHighlightBadge('attachments')}
                        <h3 className="section-title">9. SUBMITTED DOCUMENTS &amp; ATTACHMENTS</h3>

                        {/* 9a. Supporting Application Documents */}
                        <h4 style={{ fontSize: '0.85rem', color: '#1a237e', fontWeight: 800, marginBottom: '0.8rem', marginTop: 0 }}>
                            9a. Supporting Application Documents
                        </h4>
                        <table className="info-table bordered" style={{ marginBottom: '1.5rem' }}>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Document Name / Type</th>
                                    <th>Original Filename</th>
                                    <th className="no-print">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // Build a clean list of valid attachments only
                                    const rawAtts = data.attachments;
                                    if (!rawAtts) return (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '1rem' }}>No documents submitted.</td></tr>
                                    );

                                    let items = [];
                                    if (Array.isArray(rawAtts)) {
                                        // Filter: must be object with name and fileName (real attachment)
                                        items = rawAtts.filter(att => att && typeof att === 'object' && att.name && att.fileName);
                                    } else {
                                        // Object format — filter out numeric-index keys and string values
                                        items = Object.entries(rawAtts)
                                            .filter(([key, val]) => {
                                                if (!isNaN(key)) return false; // skip numeric keys (corrupted)
                                                if (!val || typeof val === 'string') return false; // skip string values
                                                return true;
                                            })
                                            .map(([name, val]) => ({
                                                name,
                                                fileName: val.fileName || val.name || '',
                                                url: val.url || val.data || ''
                                            }));
                                    }

                                    if (items.length === 0) return (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '1rem' }}>No supporting documents attached.</td></tr>
                                    );

                                    return items.map((doc, i) => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{doc.name}</td>
                                            <td>{doc.fileName || '-'}</td>
                                            <td className="no-print">
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button
                                                        title="View file in new tab"
                                                        onClick={() => {
                                                            const url = doc.url;
                                                            if (!url) return alert('No file data available.');
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
                                                            } catch (e) { alert('Could not open file preview.'); }
                                                        }}
                                                        style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                                                    >👁️</button>
                                                    <button
                                                        title="Download file"
                                                        onClick={() => { if (doc.url) { const a = document.createElement('a'); a.href = doc.url; a.download = doc.fileName || doc.name; a.click(); } }}
                                                        style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', border: 'none', background: '#1a237e', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}
                                                    >⬇️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>

                        {/* 9b. Stamp Duty Payment Installment Slips */}
                        {paymentData.length > 0 && (
                            <>
                                <h4 style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 800, marginBottom: '0.8rem' }}>
                                    9b. Stamp Duty Payment Installment Slips
                                </h4>
                                <table className="info-table bordered">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Document Name / Type</th>
                                            <th>Slip Filename</th>
                                            <th>Amount (LKR)</th>
                                            <th>Status</th>
                                            <th className="no-print">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paymentData.map((p, i) => (
                                            <tr key={p.id || i}>
                                                <td>{i + 1}</td>
                                                <td>Photocopy of the Receipt of Stamp Duty Paid</td>
                                                <td>{p.slipName || 'payment_slip.pdf'}</td>
                                                <td>{Number(p.amount || 0).toLocaleString()}</td>
                                                <td>
                                                    <span style={{
                                                        padding: '0.2rem 0.6rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800,
                                                        background: p.status === 'VERIFIED' ? '#dcfce7' : p.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                                        color: p.status === 'VERIFIED' ? '#166534' : p.status === 'REJECTED' ? '#991b1b' : '#92400e'
                                                    }}>
                                                        {p.status === 'VERIFIED' ? '✅ VERIFIED' : p.status === 'REJECTED' ? '❌ REJECTED' : '⏳ PENDING'}
                                                    </span>
                                                </td>
                                                <td className="no-print">
                                                    <button
                                                        onClick={() => {
                                                            if (!p.slipUrl) return alert('Slip not available.');
                                                            try {
                                                                if (p.slipUrl.startsWith('data:')) {
                                                                    const [meta, base64] = p.slipUrl.split(',');
                                                                    const mime = meta.match(/data:([^;]+)/)?.[1] || 'application/pdf';
                                                                    const binary = atob(base64);
                                                                    const bytes = new Uint8Array(binary.length);
                                                                    for (let n = 0; n < binary.length; n++) bytes[n] = binary.charCodeAt(n);
                                                                    const blob = new Blob([bytes], { type: mime });
                                                                    window.open(URL.createObjectURL(blob), '_blank');
                                                                } else { window.open(p.slipUrl, '_blank'); }
                                                            } catch (e) { alert('Could not open slip.'); }
                                                        }}
                                                        style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                                    >👁️ View Slip</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>

                    {/* 10. PAYMENT DETAILS (LKR 250 fee) */}
                    {(!app.category || app.category === 'OP') && (
                        <div className="detail-section" style={{ borderBottom: 'none' }}>
                            <h3 className="section-title" style={{ color: '#059669', borderBottomColor: '#059669' }}>10. APPLICATION PAYMENT DETAILS (LKR 250.00)</h3>
                            <div style={{ background: '#ecfdf5', padding: '1.5rem', borderRadius: '16px', border: '1px solid #10b981' }}>
                                <table className="info-table" style={{ background: 'transparent' }}>
                                    <tbody>
                                        <tr>
                                            <td><strong>Payment Reference:</strong></td>
                                            <td><strong style={{ color: '#065f46' }}>{data.payment?.receiptNo || 'SYSTEM-VERIFIED'}</strong></td>
                                            <td><strong>Payment Amount:</strong></td>
                                            <td><strong style={{ color: '#065f46' }}>LKR 250.00</strong></td>
                                        </tr>
                                        <tr>
                                            <td><strong>Payment Date:</strong></td>
                                            <td>{data.payment?.date || app.date}</td>
                                            <td><strong>Payment Method:</strong></td>
                                            <td>{data.payment?.bank || 'Online Payment'} / {data.payment?.branch || 'Head Office'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Payment Status:</strong></td>
                                            <td><span style={{ color: '#047857', fontWeight: 800 }}>✅ PAID & CONFIRMED</span></td>
                                            <td><strong>Bank Reference No:</strong></td>
                                            <td>{data.payment?.receiptNo || 'BOC-00123-REF'}</td>
                                        </tr>
                                        {data.payment?.receiptFileData && (
                                            <tr>
                                                <td><strong>Payment Receipt:</strong></td>
                                                <td colSpan="3">
                                                    <button
                                                        onClick={() => {
                                                            const dataUrl = data.payment.receiptFileData;
                                                            if (!dataUrl) return alert('No receipt file available.');
                                                            try {
                                                                if (dataUrl.startsWith('data:')) {
                                                                    const [meta, base64] = dataUrl.split(',');
                                                                    const mime = meta.match(/data:([^;]+)/)?.[1] || 'application/pdf';
                                                                    const binary = atob(base64);
                                                                    const bytes = new Uint8Array(binary.length);
                                                                    for (let n = 0; n < binary.length; n++) bytes[n] = binary.charCodeAt(n);
                                                                    const blob = new Blob([bytes], { type: mime });
                                                                    const blobUrl = URL.createObjectURL(blob);
                                                                    window.open(blobUrl, '_blank');
                                                                    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
                                                                } else {
                                                                    window.open(dataUrl, '_blank');
                                                                }
                                                            } catch (e) {
                                                                alert('Could not open receipt. Try downloading it.');
                                                            }
                                                        }}
                                                        style={{ background: 'white', border: '1px solid #10b981', color: '#065f46', padding: '0.4rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                                                    >
                                                        👁️ View Uploaded Receipt ({data.payment.receiptFileName || 'Scroll'})
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* 11. ADDITIONAL REMARKS */}
                    {data.otherDetails && (
                        <div className="detail-section">
                            <h3 className="section-title">11. ADDITIONAL REMARKS / NOTES</h3>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem' }}>
                                {data.otherDetails}
                            </div>
                        </div>
                    )}

                </div>

                {/* Print Footer */}
                <div className="print-footer" style={{ display: 'none', marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem', fontSize: '8pt', textAlign: 'center', color: '#666' }}>
                    <p style={{ fontWeight: 600, margin: '0 0 5px 0' }}>*** THIS IS A SYSTEM GENERATED DOCUMENT ***</p>
                    <p style={{ margin: 0 }}>This record reflects the original application details as submitted by the user. Generated on {new Date().toLocaleString()}</p>
                </div>
            </div>

            <style>{`
                @page {
                    size: A4;
                    margin: 20mm 15mm;
                }

                @media print {
                    * { 
                        overflow: visible !important; 
                        height: auto !important; 
                        min-height: 0 !important;
                    }

                    .no-print { display: none !important; }
                    .print-only-header { display: block !important; }
                    .print-footer { display: block !important; }
                    
                    body, html { 
                        background: white !important; 
                        margin: 0 !important; 
                        padding: 0 !important; 
                        display: block !important;
                    }

                    /* 
                       CRITICAL: Force all possible wrappers to allow height to grow 
                       and content to flow across pages.
                    */
                    #root, 
                    .dashboard-view,
                    div[style*="min-height: 100vh"],
                    .application-content-layout {
                        display: block !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100% !important;
                        position: relative !important;
                    }

                    .official-a4-document { 
                        width: 100% !important; 
                        border: none !important; 
                        box-shadow: none !important; 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        display: block !important;
                        background: white !important;
                    }

                    .detail-section { 
                        page-break-inside: auto !important; /* Changed from avoid to allow splitting very long sections */
                        margin-bottom: 25px !important; 
                        border-bottom: 1pt solid #eee !important;
                        display: block !important;
                        width: 100% !important;
                    }

                    .info-table {
                        background: transparent !important;
                        page-break-inside: auto !important;
                        width: 100% !important;
                    }

                    .info-table tr {
                        page-break-inside: avoid !important; /* Keep rows together */
                    }

                    .info-table td { 
                        font-size: 10.5pt !important; 
                        padding: 6px 10px !important; 
                        border: 0.5pt solid #e2e8f0 !important;
                    }

                    .section-title { 
                        font-size: 11pt !important; 
                        background: #f8fafc !important; 
                        color: #1a237e !important; 
                        border-bottom: 1.5pt solid #1a237e !important;
                        padding: 5px 10px !important;
                        margin-top: 15px !important;
                        -webkit-print-color-adjust: exact;
                    }

                    .document-header-box { 
                        border: none !important; 
                        box-shadow: none !important; 
                        padding: 0 0 20px 0 !important; 
                        margin-bottom: 30px !important; 
                        border-bottom: 2pt solid #1a237e !important; 
                        border-radius: 0 !important; 
                    }

                    .status-badge {
                        border: 1pt solid #ccc !important;
                        -webkit-print-color-adjust: exact;
                    }
                }

                .official-a4-document {
                    background: white;
                    padding: 3rem;
                    border-radius: 24px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.05);
                    border: 1px solid #e2e8f0;
                }

                .detail-section {
                    margin-bottom: 2.5rem;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 1.5rem;
                }

                .section-title {
                    font-size: 1rem;
                    font-weight: 900;
                    color: #1a237e;
                    margin-bottom: 1.2rem;
                    border-bottom: 2px solid #e8eaf6;
                    padding-bottom: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.95rem;
                    background: #fbfcfe;
                    border-radius: 12px;
                    overflow: hidden;
                }

                .info-table td {
                    padding: 10px 15px;
                    border: 1px solid #f1f5f9;
                    vertical-align: top;
                }

                .info-table strong {
                    color: #475569;
                }

                .info-table.bordered th {
                    background: #f8fafc;
                    padding: 12px 15px;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: #64748b;
                    font-weight: 800;
                    text-align: left;
                    border: 1px solid #e2e8f0;
                }

                .info-table.bordered td {
                    border: 1px solid #e2e8f0;
                }

                .text-center { text-align: center; }
            `}</style>
        </div>
    );
};

export default ExternalApplicationDetail;
