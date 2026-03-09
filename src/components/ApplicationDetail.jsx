import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../AppContext';

const ApplicationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const {
        applications, currentUser, users, assessors,
        distributeToRegion, assignToAssessor, REGIONS, updateAppStatus, updateApplication, OFFICE_CODES,
        rejectApplication, transferApplication, closeApplication, addApplicationComment,
        setCalculatorData, calculatorData
    } = useAppContext();

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedAssessor, setSelectedAssessor] = useState('');

    // File Number Component States
    const [office, setOffice] = useState('');
    const [year1, setYear1] = useState(new Date().getFullYear().toString());
    const [year2, setYear2] = useState(new Date().getFullYear().toString());
    const [alphabet, setAlphabet] = useState('A');
    const [fileNumPart, setFileNumPart] = useState('');
    const [permFileNo, setPermFileNo] = useState('');
    const [showAmendModal, setShowAmendModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionScenario, setRejectionScenario] = useState('');
    const [rejectionInstructions, setRejectionInstructions] = useState('');
    const [allowResubmission, setAllowResubmission] = useState(false);
    const [transferRegion, setTransferRegion] = useState('');
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);
    const [amendSections, setAmendSections] = useState({
        grantors: false,
        grantees: false,
        property: false,
        attachments: false,
        notary: false,
        building: false,
        value: false,
        payment: false,
        other: false
    });
    const [amendedFields, setAmendedFields] = useState({});
    const [amendComment, setAmendComment] = useState('');
    const iframeRef = useRef(null);

    const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    useEffect(() => {
        const handleMessage = (event) => {
            if (event.data.type === 'STAMP_DUTY_CALCULATION') {
                setCalculatorData(event.data.data);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [setCalculatorData]);

    const app = applications.find(a => a.id === parseInt(id));

    useEffect(() => {
        if (!app) return;
        let constructed = "";
        const category = app.category; // OP, FI, RT

        if (category === 'OP') {
            constructed = `${office}/SD/OP/${year1}/${alphabet}/${fileNumPart}`;
        } else {
            // FI and RT have two years
            constructed = `${office}/SD/${category}/${year1}/${year2}/${alphabet}/${fileNumPart}`;
        }

        // Clean up double slashes if parts are empty (initial state)
        constructed = constructed.replace(/\/+/g, '/');
        if (constructed.startsWith('/')) constructed = constructed.slice(1);

        setPermFileNo(constructed);
    }, [office, year1, year2, alphabet, fileNumPart, app]);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.get('print') === 'true') {
            setShowPrintPreview(true);
        }
    }, [location.search]);

    if (!app) return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Application not found</h2>
            <button className="btn-primary" style={{ marginTop: '1rem', color: 'white' }} onClick={() => navigate('/internal')}>Back to Dashboard</button>
        </div>
    );

    const data = app.fullData || {};
    const isAdmin = currentUser?.role === 'ADMIN';
    const isCommissioner = currentUser?.role === 'COMMISSIONER';
    const isDC = currentUser?.role === 'DC';
    const isAssessor = currentUser?.role === 'ASSESSOR';

    let opinionData = null;
    try {
        if (app.opinionForm) {
            opinionData = typeof app.opinionForm === 'string'
                ? JSON.parse(app.opinionForm)
                : app.opinionForm;
        }
    } catch (e) {
        console.error("Opinion form parsing error:", e);
    }
    const paymentData = Array.isArray(app.paymentData) ? app.paymentData : [];

    const rawDuty = (app?.category === 'FI' || app?.category === 'RT')
        ? opinionData?.totalPayable
        : opinionData?.stampDutyPayable;
    const totalDuty = parseInt(String(rawDuty || 0).replace(/[^0-9]/g, '') || 0);
    const totalPaid = paymentData.reduce((sum, p) => p.status === 'VERIFIED' ? sum + parseFloat(p.amount || 0) : sum, 0);
    const pendingVerification = paymentData.reduce((sum, p) => p.status === 'PENDING' ? sum + parseFloat(p.amount || 0) : sum, 0);
    const remainingBalance = totalDuty - totalPaid;

    const openBlob = (url) => {
        if (!url) { alert('File data not available.'); return; }
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
        } catch (e) {
            alert('Could not open file preview. Try downloading it instead.');
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
            case 'REJECTED': return '🚫 REJECTED';
            case 'CLOSED': return '🔒 PERMANENTLY CLOSED';
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

    const getHighlightStyle = (sectionKey, fieldKey) => {
        const isAmended = app?.status === 'RESUBMITTED' || app?.status === 'AMENDED' || app?.status === 'INFORMATION_REQUESTED';
        const isSectionAmended = app?.fullData?.amendments?.includes(sectionKey);
        const isFieldAmended = app?.fullData?.amendedFields?.[fieldKey];

        if (isAmended && (isSectionAmended || isFieldAmended)) {
            return {
                border: isFieldAmended ? '2px solid #ef4444' : '2px solid #f97316',
                background: isFieldAmended ? '#fef2f2' : '#fff7ed',
                position: 'relative',
                padding: '4px',
                borderRadius: '4px'
            };
        }
        return {};
    };

    const renderHighlightBadge = (sectionKey, fieldKey) => {
        const isAmended = app?.status === 'RESUBMITTED';
        const isSectionAmended = app?.fullData?.amendments?.includes(sectionKey);
        const isFieldAmended = app?.fullData?.amendedFields?.[fieldKey];

        if (isAmended && (isFieldAmended || (isSectionAmended && !fieldKey))) {
            return (
                <span style={{
                    position: 'absolute', top: fieldKey ? '-8px' : '-12px', right: fieldKey ? '5px' : '20px',
                    background: fieldKey ? '#ef4444' : '#f97316', color: 'white', padding: fieldKey ? '2px 8px' : '4px 12px',
                    borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10
                }}>
                    {fieldKey ? 'Corrected Field' : 'Corrected Section'}
                </span>
            );
        }
        return null;
    };

    const toggleFieldAmendment = (fieldKey) => {
        setAmendedFields(prev => ({
            ...prev,
            [fieldKey]: !prev[fieldKey]
        }));
    };

    const renderUnlockToggle = (fieldKey) => {
        if (!showAmendModal) return null;
        const isUnlocked = amendedFields[fieldKey];
        return (
            <button
                type="button"
                onClick={() => toggleFieldAmendment(fieldKey)}
                style={{
                    marginLeft: '8px',
                    padding: '2px 6px',
                    fontSize: '0.7rem',
                    borderRadius: '4px',
                    border: '1px solid',
                    cursor: 'pointer',
                    background: isUnlocked ? '#ef4444' : '#fff',
                    color: isUnlocked ? '#fff' : '#ef4444',
                    borderColor: '#ef4444'
                }}
            >
                {isUnlocked ? '🔓 Unlocked' : '🔒 Lock'}
            </button>
        );
    };

    const handleDistribute = () => {
        if (!selectedRegion) return alert('Please select a regional office');
        distributeToRegion(app.id, selectedRegion);
        alert(`Application distributed to ${selectedRegion}`);
        navigate('/internal');
    };

    const handleAssign = () => {
        if (!selectedAssessor) return alert('Please select an assessor');
        assignToAssessor(app.id, selectedAssessor, ''); // DC no longer provides permFileNo
        alert('Application assigned to assessor successfully');
        navigate('/internal');
    };

    const handleSavePermFileNo = () => {
        if (!office || !fileNumPart) return alert('Please complete all file number components');
        const now = new Date().toLocaleString('en-GB');
        updateApplication(app.id, {
            permFileNo,
            status: 'PROCESSING',
            lastActionDate: now,
            lastActionComment: `Permanent File Number Generated: ${permFileNo}`,
            activityLog: [
                ...(app.activityLog || []),
                {
                    action: 'Permanent File Number Generated',
                    date: now,
                    user: currentUser?.name || 'Assessor',
                    comment: `File No: ${permFileNo}`
                }
            ]
        });
        alert('Permanent File Number generated and saved');
    };

    const handleReject = () => {
        if (!rejectionScenario) return alert('Please select a rejection scenario');
        if (!rejectionInstructions) return alert('Please provide instructions/reason');

        rejectApplication(app.id, rejectionScenario, rejectionInstructions, allowResubmission);
        alert('Application rejected successfully');
        setShowRejectModal(false);
        navigate('/internal');
    };

    const handleTransfer = () => {
        if (!transferRegion) return alert('Please select a region to transfer to');
        transferApplication(app.id, transferRegion, `Transferred per Assessor instructions: ${app.rejectionInstructions}`);
        alert(`Application transferred to ${transferRegion}`);
        navigate('/internal');
    };

    const handleCloseFile = () => {
        if (!window.confirm('Are you sure you want to PERMANENTLY CLOSE this file? This action cannot be undone.')) return;
        closeApplication(app.id, `File closed per Assessor instructions: ${app.rejectionInstructions}`);
        alert('Application has been permanently closed');
        navigate('/internal');
    };

    const handleSendAmendment = () => {
        const selected = Object.keys(amendSections).filter(k => amendSections[k]);
        if (selected.length === 0) return alert('Please select at least one section for amendment');

        const updatedFullData = {
            ...app.fullData,
            amendments: selected,
            amendedFields: amendedFields,
            amendmentComment: amendComment
        };

        const now = new Date().toLocaleString('en-GB');
        const logComment = `Amendment requested for: ${selected.join(', ')}. ${amendComment}`;
        updateApplication(app.id, {
            status: 'INFORMATION_REQUESTED',
            fullData: updatedFullData,
            lastActionComment: logComment,
            lastActionDate: now,
            activityLog: [
                ...(app.activityLog || []),
                {
                    action: 'Amendment Requested',
                    date: now,
                    user: currentUser?.name || 'Assessor',
                    comment: logComment
                }
            ]
        });

        alert('Amendment request sent to applicant');
        setShowAmendModal(false);
        navigate('/internal');
    };

    const handleVerifyPayment = async (paymentId, status) => {
        const remarks = prompt(`Enter remarks for this ${status.toLowerCase()} payment:`);
        if (remarks === null) return; // Cancelled

        const updatedPaymentData = paymentData.map(p =>
            p.id === paymentId ? { ...p, status, remarks } : p
        );

        // Determine new application status
        const hasVerified = updatedPaymentData.some(p => p.status === 'VERIFIED');
        const hasPending = updatedPaymentData.some(p => p.status === 'PENDING');
        const totalVerifiedAmount = updatedPaymentData.reduce((sum, p) => p.status === 'VERIFIED' ? sum + parseFloat(p.amount || 0) : sum, 0);

        let newStatus = 'OPINION_ISSUED';
        if (totalVerifiedAmount >= totalDuty && totalDuty > 0) {
            newStatus = 'FULLY_PAID';
        } else if (hasPending) {
            newStatus = 'SLIP_PENDING_VERIFICATION';
        } else if (hasVerified) {
            newStatus = 'PARTIALLY_PAID';
        }

        try {
            await updateApplication(app.id, {
                paymentData: updatedPaymentData,
                status: newStatus,
                lastActionComment: `Payment installment ${status}: ${remarks}`,
                lastActionDate: new Date().toLocaleString('en-GB'),
                activityLog: [
                    ...(app.activityLog || []),
                    {
                        action: `Payment Installment ${status}`,
                        date: new Date().toLocaleString('en-GB'),
                        user: currentUser?.name || 'Department Officer',
                        comment: `Amount verified: LKR ${paymentData.find(p => p.id === paymentId)?.amount?.toLocaleString()}. Remarks: ${remarks}`
                    }
                ]
            });
            alert(`Payment installment marked as ${status}`);
        } catch (error) {
            console.error('Failed to verify payment:', error);
            alert('Error updating payment status');
        }
    };

    const renderActionSection = () => {
        if (isCommissioner && app.status === 'RECEIVED') {
            return (
                <div style={{ background: '#fff9c4', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem', border: '1px solid #fbc02d' }}>
                    <h3 style={{ color: '#f57f17', marginTop: 0 }}>🚀 Commissioner of Revenue Action: Distribution</h3>
                    <p style={{ fontSize: '0.9rem' }}>Select a Regional Office to forward this application for assessment.</p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                        >
                            <option value="">-- Select Regional Office --</option>
                            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <button className="btn-primary" style={{ color: 'white' }} onClick={handleDistribute}>Distribute to Region</button>
                    </div>
                </div>
            );
        }

        if (isDC && app.status === 'ALLOCATED_TO_REGION') {
            // Use pre-fetched assessors list (already scoped to DC's region by the server)
            const regionalAssessors = assessors.length > 0
                ? assessors
                : users.filter(u => u.role === 'ASSESSOR' && u.region === currentUser.region);
            return (
                <div style={{ background: '#e3f2fd', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem', border: '1px solid #2196f3' }}>
                    <h3 style={{ color: '#0d47a1', marginTop: 0 }}>⚖️ DC Action: Assessor Allocation</h3>
                    <p style={{ fontSize: '0.9rem' }}>Assign this application to a regional assessor.</p>
                    <div style={{ marginTop: '1rem' }}>
                        <div className="form-group">
                            <label>Assigned Assessor</label>
                            <select
                                value={selectedAssessor}
                                onChange={(e) => setSelectedAssessor(e.target.value)}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px' }}
                            >
                                <option value="">-- Select Assessor --</option>
                                {regionalAssessors.map(u => <option key={u.id} value={u.id}>{u.name} ({u.designation})</option>)}
                            </select>
                        </div>
                    </div>
                    <button className="btn-primary" style={{ marginTop: '1rem', width: '100%', color: 'white' }} onClick={handleAssign}>Finalize Allocation</button>
                </div>
            );
        }

        if (isAssessor && (app.status === 'ALLOCATED_TO_ASSESSOR' || app.status === 'PROCESSING' || app.status === 'INFORMATION_REQUESTED' || app.status === 'RESUBMITTED')) {
            const isOP = app.category === 'OP';

            return (
                <div style={{ background: '#e8f5e9', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem', border: '1px solid #4caf50' }}>
                    <h3 style={{ color: '#1b5e20', marginTop: 0 }}>📝 Assessor Action: Examination & File Generation</h3>

                    {!app.permFileNo && (
                        <div style={{ background: 'white', padding: '1.2rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #c8e6c9' }}>
                            <h4 style={{ margin: '0 0 1rem 0', color: '#2e7d32' }}>🗂️ Generate Permanent File Number</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: isOP ? 'repeat(5, 1fr)' : 'repeat(6, 1fr)', gap: '12px', alignItems: 'end' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem' }}>Office</label>
                                    <select value={office} onChange={e => setOffice(e.target.value)} style={{ width: '100%', padding: '0.6rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                                        <option value="">--</option>
                                        {OFFICE_CODES.map(o => <option key={o.value} value={o.value}>{o.value}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0, textAlign: 'center' }}>
                                    <label style={{ fontSize: '0.75rem' }}>Dept</label>
                                    <div style={{ width: '100%', padding: '0.6rem', background: '#f5f5f5', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', border: '1px solid #ccc', boxSizing: 'border-box' }}>SD</div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0, textAlign: 'center' }}>
                                    <label style={{ fontSize: '0.75rem' }}>Cat</label>
                                    <div style={{ width: '100%', padding: '0.6rem', background: '#f5f5f5', borderRadius: '4px', fontSize: '1rem', fontWeight: 'bold', border: '1px solid #ccc', boxSizing: 'border-box' }}>{app.category}</div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem' }}>{isOP ? 'Year' : 'Year 1'}</label>
                                    <input type="text" value={year1} onChange={e => setYear1(e.target.value)} style={{ width: '100%', padding: '0.6rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                </div>
                                {!isOP && (
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label style={{ fontSize: '0.75rem' }}>Year 2</label>
                                        <input type="text" value={year2} onChange={e => setYear2(e.target.value)} style={{ width: '100%', padding: '0.6rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                    </div>
                                )}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem' }}>Alpha</label>
                                    <select value={alphabet} onChange={e => setAlphabet(e.target.value)} style={{ width: '100%', padding: '0.6rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                                        {alphabets.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label style={{ fontSize: '0.75rem' }}>File No</label>
                                    <input type="text" value={fileNumPart} onChange={e => setFileNumPart(e.target.value)} placeholder="001" style={{ width: '100%', padding: '0.6rem', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                                </div>
                            </div>
                            <div style={{ marginTop: '1rem', padding: '0.8rem', background: '#f1f8e9', borderRadius: '4px', border: '1px dashed #4caf50' }}>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>Preview: </span>
                                <strong style={{ color: '#2e7d32', fontFamily: 'monospace', fontSize: '1rem' }}>{permFileNo}</strong>
                            </div>
                            <button type="button" className="btn-primary" style={{ marginTop: '1rem', width: '100%', background: '#2e7d32', color: 'white' }} onClick={handleSavePermFileNo}>✅ Save & Generate Permanent File No</button>
                        </div>
                    )}

                    <p style={{ fontSize: '0.9rem' }}>
                        {isOP ? 'Review documents and prepare the Official Opinion Form.' : 'Calculate property value, determine duty deficiency, and prepare Official Notice.'}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        {isOP ? (
                            <>
                                <button className="btn-primary" style={{ color: 'white', flex: 1 }} onClick={() => navigate('/internal/calculator', { state: { permFileNo: app.permFileNo || app.tempFileNo, appId: app.id, category: app.category } })}>🔍 Open Calculation Sheet</button>
                                <button className="btn-primary" style={{ background: '#2e7d32', color: 'white', flex: 1 }} onClick={() => navigate(`/internal/view/${app.id}/opinion`)}>📜 Prepare Official Opinion</button>
                            </>
                        ) : (
                            <>
                                <button className="btn-primary" style={{ background: '#1e40af', color: 'white', flex: 1 }} onClick={() => navigate('/internal/calculator', { state: { permFileNo: app.permFileNo || app.tempFileNo, appId: app.id, category: app.category } })}>🔍 Calculate Value & Duty</button>
                                <button className="btn-primary" style={{ background: '#b91c1c', color: 'white', flex: 1 }} onClick={() => navigate('/internal/deficiency-calculator', { state: { permFileNo: app.permFileNo || app.tempFileNo, appId: app.id } })}>🧮 Deficiency & Penalty Calc</button>
                                <button className="btn-primary" style={{ background: '#2e7d32', color: 'white', flex: 1 }} onClick={() => navigate(`/internal/view/${app.id}/deficiency-notice`)}>📜 Prepare Official Notice</button>
                            </>
                        )}
                    </div>

                    <div style={{ borderTop: '1px solid #c8e6c9', marginTop: '1.5rem', paddingTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                        <button
                            className="btn-primary"
                            style={{ background: '#ffa000', color: 'white', flex: 1 }}
                            onClick={() => setShowAmendModal(true)}
                        >
                            ⚠️ Request Amendment
                        </button>
                        <button
                            className="btn-primary"
                            style={{ background: '#d32f2f', color: 'white', flex: 1 }}
                            onClick={() => setShowRejectModal(true)}
                        >
                            ❌ Reject Application
                        </button>
                    </div>
                </div>
            );
        }

        if (app.status === 'REJECTED' || app.status === 'CLOSED') {
            return (
                <div style={{ background: '#fff1f2', padding: '1.5rem', borderRadius: '12px', marginTop: '2rem', border: '1px solid #fda4af' }}>
                    <h3 style={{ color: '#be123c', marginTop: 0 }}>🚫 Assessor Instructions / Post-Rejection Actions</h3>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #fecdd3', marginBottom: '1.2rem' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#be123c', textTransform: 'uppercase' }}>Scenario & Reason</p>
                        <p style={{ margin: '0.4rem 0', fontSize: '0.95rem', fontWeight: 700 }}>{app.rejectionScenario || 'General Rejection'}</p>
                        <p style={{ margin: '0.8rem 0 0.3rem 0', fontSize: '0.75rem', fontWeight: 800, color: '#4b5563', textTransform: 'uppercase' }}>Instructions</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', lineHeight: '1.5' }}>{app.rejectionInstructions || app.lastActionComment}</p>
                    </div>

                    {app.status === 'REJECTED' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {app.rejectionScenario === 'Not Relevant to Kalutara Regional Office' && (
                                <div style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                    <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', fontWeight: 600 }}>Action: Transfer to Correct Region</p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <select
                                            value={transferRegion}
                                            onChange={(e) => setTransferRegion(e.target.value)}
                                            style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        >
                                            <option value="">-- Select Target Region --</option>
                                            {REGIONS.filter(r => r !== 'Kalutara Regional Office').map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                        <button onClick={handleTransfer} className="btn-primary" style={{ background: '#0369a1', color: 'white', fontSize: '0.8rem' }}>Forward File</button>
                                    </div>
                                </div>
                            )}

                            {app.rejectionScenario === 'Requires Submission to Another Department' && (
                                <div style={{ background: '#f5f3ff', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                                    <p style={{ margin: '0 0 0.8rem 0', fontSize: '0.85rem', fontWeight: 600 }}>Action: Redirect to Authority</p>
                                    <button
                                        onClick={() => {
                                            const dept = prompt('Enter the department/authority to redirect to:');
                                            if (dept) {
                                                addApplicationComment(app.id, `Redirected to: ${dept}`);
                                                alert(`Forwarding record updated for ${dept}`);
                                            }
                                        }}
                                        className="btn-primary"
                                        style={{ background: '#6d28d9', color: 'white', width: '100%' }}
                                    >
                                        Log Redirect / Forwarding
                                    </button>
                                </div>
                            )}

                            {(app.rejectionScenario === 'Application Not Eligible' || !app.rejectionScenario) && (
                                <button
                                    onClick={handleCloseFile}
                                    className="btn-primary"
                                    style={{ background: '#111827', color: 'white', width: '100%' }}
                                >
                                    🔒 Permanently Close File
                                </button>
                            )}

                            {app.rejectionScenario === 'Incorrect Information / Missing Documents' && (
                                <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fef3c7', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                                        {app.allowResubmission ? '✅ Resubmission has been allowed for the applicant.' : '❌ Resubmission is currently disabled for this rejection.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {app.status === 'CLOSED' && (
                        <div style={{ textAlign: 'center', padding: '0.5rem', color: '#be123c', fontWeight: 800, fontSize: '0.9rem' }}>
                            FILE PERMANENTLY CLOSED
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="application-detail-container" style={{ padding: '0', maxWidth: '100%', margin: '0 auto', background: showPrintPreview ? 'white' : '#f8fafc', minHeight: '100vh' }}>
            {/* The Internal View UI (Hidden on Print) */}
            <div className="no-print" style={{ display: showPrintPreview ? 'none' : 'block', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ margin: 0, color: 'var(--primary-color)' }}>{app.permFileNo || app.tempFileNo}</h1>
                        <p style={{ color: '#666', marginTop: '0.5rem' }}>Application Detail & Processing Portal</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className={`status-badge ${getStatusClass(app.status)}`} style={{ fontSize: '1rem', padding: '0.6rem 1.2rem' }}>
                            {getStatusLabel(app.status)}
                        </span>
                        <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>Received: {app.date} at {app.time}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Grantors/Grantees */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', ...getHighlightStyle('stakeholders') }}>
                            {renderHighlightBadge('stakeholders')}
                            <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '0.8rem', marginBottom: '1.2rem', color: '#1a237e' }}>👥 Stakeholders</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h4 style={{ color: '#d32f2f', marginBottom: '0.8rem', fontSize: '0.9rem' }}>Grantors (Sellers/Transferors)</h4>
                                    {data.grantors?.map((g, i) => (
                                        <div key={i} style={{ marginBottom: '0.6rem', padding: '0.6rem', background: '#fff5f5', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                                            <p style={{ fontSize: '0.85rem', margin: '0 0 0.3rem 0', ...getHighlightStyle('grantors', `grantors.${i}.name`) }}><strong>{g.name}</strong>{renderUnlockToggle(`grantors.${i}.name`)}</p>
                                            <p style={{ fontSize: '0.8rem', margin: '0 0 0.2rem 0', color: '#666', ...getHighlightStyle('grantors', `grantors.${i}.reference`) }}>ID: {g.reference} {g.tin && `| TIN: ${g.tin}`}{renderUnlockToggle(`grantors.${i}.reference`)}{g.tin && renderUnlockToggle(`grantors.${i}.tin`)}</p>
                                            <p style={{ fontSize: '0.8rem', margin: '0', color: '#666', ...getHighlightStyle('grantors', `grantors.${i}.address`) }}>{g.address}{renderUnlockToggle(`grantors.${i}.address`)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h4 style={{ color: '#2e7d32', marginBottom: '0.8rem', fontSize: '0.9rem' }}>Grantees (Buyers/Receivers)</h4>
                                    {data.grantees?.map((g, i) => (
                                        <div key={i} style={{ marginBottom: '0.6rem', padding: '0.6rem', background: '#f1f8e9', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                                            <p style={{ fontSize: '0.85rem', margin: '0 0 0.3rem 0', ...getHighlightStyle('grantees', `grantees.${i}.name`) }}><strong>{g.name}</strong>{renderUnlockToggle(`grantees.${i}.name`)}</p>
                                            <p style={{ fontSize: '0.8rem', margin: '0 0 0.2rem 0', color: '#666', ...getHighlightStyle('grantees', `grantees.${i}.reference`) }}>ID: {g.reference} {g.tin && `| TIN: ${g.tin}`}{renderUnlockToggle(`grantees.${i}.reference`)}{g.tin && renderUnlockToggle(`grantees.${i}.tin`)}</p>
                                            <p style={{ fontSize: '0.8rem', margin: '0', color: '#666', ...getHighlightStyle('grantees', `grantees.${i}.address`) }}>{g.address}{renderUnlockToggle(`grantees.${i}.address`)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {data.notary && (
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', ...getHighlightStyle('notary') }}>
                                {renderHighlightBadge('notary')}
                                <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '0.8rem', marginBottom: '1.2rem', color: '#1a237e' }}>⚖️ Notary / Lawyer Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <p style={getHighlightStyle('notary', 'notary.name')}><strong>Name:</strong> {data.notary.name}{renderUnlockToggle('notary.name')}</p>
                                        <p style={getHighlightStyle('notary', 'notary.reference')}><strong>ID/Reference:</strong> {data.notary.reference}{renderUnlockToggle('notary.reference')}</p>
                                        {data.notary.tin && <p style={getHighlightStyle('notary', 'notary.tin')}><strong>TIN:</strong> {data.notary.tin}{renderUnlockToggle('notary.tin')}</p>}
                                        <p style={getHighlightStyle('notary', 'notary.barNo')}><strong>Bar No:</strong> {data.notary.barNo}{renderUnlockToggle('notary.barNo')}</p>
                                    </div>
                                    <div>
                                        <p style={getHighlightStyle('notary', 'notary.contact')}><strong>Contact:</strong> {data.notary.contact}{renderUnlockToggle('notary.contact')}</p>
                                        <p style={getHighlightStyle('notary', 'notary.email')}><strong>Email:</strong> {data.notary.email}{renderUnlockToggle('notary.email')}</p>
                                        <p style={getHighlightStyle('notary', 'notary.address')}><strong>Address:</strong> {data.notary.address}{renderUnlockToggle('notary.address')}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Property Detail */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', ...getHighlightStyle('property') }}>
                            {renderHighlightBadge('property')}
                            <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '0.8rem', marginBottom: '1.2rem', color: '#1a237e' }}>📍 Property Particulars</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <p style={getHighlightStyle('property', 'property.nature')}><strong>Nature of Instrument:</strong> {data.property?.nature || 'N/A'}{renderUnlockToggle('property.nature')}</p>
                                    <p style={getHighlightStyle('property', 'property.localAuthority')}><strong>Local Authority:</strong> {data.property?.localAuthority || 'N/A'}{renderUnlockToggle('property.localAuthority')}</p>
                                    <p style={getHighlightStyle('property', 'property.town')}><strong>Town/Village:</strong> {data.property?.town || 'N/A'}{renderUnlockToggle('property.town')}</p>
                                    <p style={getHighlightStyle('property', 'property.address')}><strong>Address:</strong> {data.property?.address || 'N/A'}{renderUnlockToggle('property.address')}</p>
                                    <p style={getHighlightStyle('property', 'property.distance')}><strong>Distance from Town:</strong> {data.property?.distance ? `${data.property.distance} km` : 'N/A'}{renderUnlockToggle('property.distance')}</p>
                                    <p style={getHighlightStyle('property', 'property.landType')}><strong>Land Type:</strong> {data.property?.landType || 'N/A'}{renderUnlockToggle('property.landType')}</p>
                                    {data.property?.lat && <p style={getHighlightStyle('property', 'property.coordinates')}><strong>Location:</strong> <a href={data.property.mapUrl} target="_blank" rel="noreferrer" style={{ color: '#1565c0' }}>View Map ({data.property.lat}, {data.property.lng})</a>{renderUnlockToggle('property.coordinates')}</p>}
                                </div>
                                <div>
                                    <p style={getHighlightStyle('property', 'property.surveyor')}><strong>Surveyor:</strong> {data.property?.surveyor || 'N/A'}{renderUnlockToggle('property.surveyor')}</p>
                                    <p style={getHighlightStyle('property', 'property.planNo')}><strong>Plan No & Date:</strong> {data.property?.planNo} ({data.property?.planDate}){renderUnlockToggle('property.planNo')}{renderUnlockToggle('property.planDate')}</p>
                                    <p style={getHighlightStyle('property', 'property.lotNo')}><strong>Lot No:</strong> {data.property?.lotNo || 'N/A'}{renderUnlockToggle('property.lotNo')}</p>
                                    <p style={getHighlightStyle('property', 'property.extent')}><strong>Extent:</strong> {data.property?.extent ? `${data.property.extent.acre}A ${data.property.extent.rood}R ${data.property.extent.perch}P (${data.property.extent.hectare || 0} Ha)` : 'N/A'}{renderUnlockToggle('property.extent')}</p>
                                    {data.property?.crops && <p style={getHighlightStyle('property', 'property.crops')}><strong>Crops/Plantation:</strong> {data.property.crops}{renderUnlockToggle('property.crops')}</p>}
                                </div>
                            </div>
                        </div>

                        {data.building && (
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', ...getHighlightStyle('building') }}>
                                {renderHighlightBadge('building')}
                                <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '0.8rem', marginBottom: '1.2rem', color: '#1a237e' }}>🏢 Building & Rental Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <p style={getHighlightStyle('building', 'building.type')}><strong>Structure Type:</strong> {data.building.type}{renderUnlockToggle('building.type')}</p>
                                        <p style={getHighlightStyle('building', 'building.planNo')}><strong>Building Plan No:</strong> {data.building.planNo || 'N/A'}{renderUnlockToggle('building.planNo')}</p>
                                        <p style={getHighlightStyle('building', 'building.year')}><strong>Construction Year:</strong> {data.building.year || '-'}{renderUnlockToggle('building.year')}</p>
                                    </div>
                                    <div>
                                        <p style={getHighlightStyle('building', 'building.unitNo')}><strong>Unit / Assessment No:</strong> {data.building.unitNo || 'N/A'}{renderUnlockToggle('building.unitNo')}</p>
                                        <p style={getHighlightStyle('building', 'building.floors')}><strong>Floor Count:</strong> {data.building.floors?.length || 1}{renderUnlockToggle('building.floors')}</p>
                                        <p style={getHighlightStyle('building', 'building.isRented')}><strong>Is Rented:</strong> {data.building.isRented ? 'Yes' : 'No'}{renderUnlockToggle('building.isRented')}</p>
                                        {data.building.isRented && <p style={getHighlightStyle('building', 'building.rent')}><strong>Monthly Rent:</strong> LKR {(parseFloat(data.building.rent || 0)).toLocaleString()}{renderUnlockToggle('building.rent')}</p>}
                                    </div>
                                </div>
                                {data.building.facilities && <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', ...getHighlightStyle('building', 'building.facilities') }}><strong>Facilities:</strong> {data.building.facilities}{renderUnlockToggle('building.facilities')}</p>}
                                {data.building.floors && data.building.floors.length > 0 && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <strong>Floors:</strong>
                                        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem', fontSize: '0.9rem' }}>
                                            {data.building.floors.map((f, i) => (
                                                <li key={i}>{f.floorNo || `Floor ${i + 1}`}: {f.area} Sq.Ft</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {data.value && (
                            <div className="print-section" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', ...getHighlightStyle('value') }}>
                                {renderHighlightBadge('value')}
                                <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '0.8rem', marginBottom: '1.2rem', color: '#1a237e' }}>💰 Transaction Value & History</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    <div>
                                        <p style={getHighlightStyle('value', 'value.purchase')}><strong>Reported Consideration:</strong> LKR {(parseFloat(data.value?.purchase || 0)).toLocaleString()}{renderUnlockToggle('value.purchase')}</p>
                                        <p style={getHighlightStyle('value', 'value.marketValue')}><strong>Reported Market Value:</strong> LKR {(parseFloat(data.value?.marketValue || 0)).toLocaleString()}{renderUnlockToggle('value.marketValue')}</p>
                                        <p style={getHighlightStyle('value', 'value.cropsValue')}><strong>Value of Crops:</strong> LKR {(parseFloat(data.value?.cropsValue || 0)).toLocaleString()}{renderUnlockToggle('value.cropsValue')}</p>
                                    </div>
                                    <div>
                                        <p style={getHighlightStyle('value', 'value.loanDetails')}><strong>Loan Details:</strong> {data.value?.loanDetails || 'None'}{renderUnlockToggle('value.loanDetails')}</p>
                                        <p style={getHighlightStyle('value', 'value.previousOpinion')}><strong>Previous Opinion Ref:</strong> {data.value?.previousOpinion || 'N/A'}{renderUnlockToggle('value.previousOpinion')}</p>
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* Supporting Documents (Previously Section 9) */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', ...getHighlightStyle('attachments') }}>
                            {renderHighlightBadge('attachments')}
                            <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '0.8rem', marginBottom: '1.2rem', color: '#1a237e' }}>📎 Supporting Documents</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                                {data.attachments && (Array.isArray(data.attachments) ? data.attachments : Object.entries(data.attachments)).filter((item) => {
                                    if (Array.isArray(data.attachments)) {
                                        // Filter: must be object with name and fileName
                                        return item && typeof item === 'object' && item.name && item.fileName;
                                    } else {
                                        const [name, val] = item;
                                        // Filter: skip numeric-index keys (corrupted array-as-object)
                                        if (!isNaN(name)) return false;
                                        // Filter: skip entries with no real file object
                                        if (!val || typeof val === 'string') return false;
                                        return true;
                                    }
                                }).map((item, i) => {
                                    let attachment = { name: '', fileName: '', url: '' };
                                    if (Array.isArray(data.attachments)) {
                                        attachment = { ...item, url: item.url || item.data || '' };
                                    } else {
                                        const [name, val] = item;
                                        attachment = {
                                            name,
                                            fileName: (val && typeof val === 'object') ? (val.fileName || val.name) : val,
                                            url: (val && typeof val === 'object') ? (val.url || val.data || '') : ''
                                        };
                                    }

                                    return (
                                        <div key={i} style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                                            <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>{attachment.name}</p>
                                            <p style={{ fontSize: '0.7rem', color: '#64748b', margin: '0 0 0.8rem 0' }}>{attachment.fileName || ''}</p>
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                                                <button
                                                    className="action-btn"
                                                    style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'white', border: '1px solid #e2e8f0' }}
                                                    title="View file"
                                                    onClick={() => openBlob(attachment.url)}
                                                >
                                                    👁️ View
                                                </button>
                                                <button
                                                    className="action-btn"
                                                    style={{ fontSize: '0.75rem', padding: '4px 10px', background: '#1a237e', color: 'white', border: 'none' }}
                                                    title="Download file"
                                                    onClick={() => {
                                                        if (attachment.url) {
                                                            const a = document.createElement('a');
                                                            a.href = attachment.url;
                                                            a.download = attachment.fileName || attachment.name;
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
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '0.8rem', marginBottom: '1.2rem', color: '#1a237e' }}>🛂 Application Status</h3>
                            <p><strong>Category:</strong> {app.category}</p>
                            <p><strong>Submitted by:</strong> {app.applicant}</p>
                            <p><strong>Current Status:</strong> <span className={`status-badge ${getStatusClass(app.status)}`}>{getStatusLabel(app.status)}</span></p>
                            {app.region && <p><strong>Regional Office:</strong> {app.region}</p>}
                            {app.assignedToName && <p><strong>Assigned To:</strong> {app.assignedToName} ({app.assignedToDesignation})</p>}

                            {app.lastActionComment && (
                                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 800, color: '#1a237e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💬 Status Remark</p>
                                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.9rem', color: '#4a5568', lineHeight: '1.4' }}>{app.lastActionComment}</p>
                                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>{app.lastActionDate}</p>
                                </div>
                            )}

                            {isAdmin && app.status === 'OPINION_ISSUED' && (
                                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
                                    <button
                                        onClick={() => navigate(`/internal/view/${app.id}/opinion`)}
                                        className="hide-on-print"
                                        style={{ background: '#f57f17', color: 'white', border: 'none', padding: '0.8rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        🔓 Unlock & Edit Opinion (Admin)
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Activity Timeline */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '0.8rem', marginBottom: '1.2rem', color: '#1a237e' }}>⏳ Activity Timeline</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '11px', top: '5px', bottom: '5px', width: '2px', background: '#e2e8f0', zIndex: 0 }}></div>
                                {app.activityLog && app.activityLog.length > 0 ? (
                                    [...app.activityLog].reverse().map((log, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: index === 0 ? '#1a237e' : '#cbd5e1', border: '4px solid white', flexShrink: 0, boxShadow: '0 0 0 1px #e2e8f0' }}></div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: index === 0 ? '#1a237e' : '#475569' }}>{log.action}</p>
                                                <p style={{ margin: '0.2rem 0', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{log.date} • {log.user}</p>
                                                {log.comment && <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#1e293b', fontStyle: 'italic', background: '#f8fafc', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>{log.comment}</p>}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                        No historical activity recorded.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Unified Financials & Payments Management */}
                        <div className="hide-on-print" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                                <h3 style={{ color: '#059669', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>💰 Financial Ledger</h3>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, display: 'block' }}>REMAINING BALANCE</span>
                                    <span style={{ fontWeight: 900, color: '#b91c1c', fontSize: '1.1rem' }}>LKR {remainingBalance.toLocaleString()}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Initial Fee Payment */}
                                {data.payment && (app.category === 'OP' || !app.category) && (
                                    <div style={{ padding: '0.8rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', ...getHighlightStyle('payment') }}>
                                        {renderHighlightBadge('payment')}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>Opinion Fee Payment</span>
                                            <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 800 }}>✅ PAID</span>
                                        </div>
                                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>LKR {data.payment.amount}</p>
                                        <button
                                            onClick={() => openBlob(data.payment.receiptFileData)}
                                            style={{ width: '100%', padding: '0.4rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                        >
                                            👁️ View Fee Receipt
                                        </button>
                                    </div>
                                )}

                                {/* Installments Ledger */}
                                {paymentData.length > 0 ? (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Stamp Duty Installments</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {paymentData.map((p, index) => (
                                                <div key={p.id || index} style={{ padding: '0.8rem', background: p.status === 'VERIFIED' ? '#f0fff4' : p.status === 'REJECTED' ? '#fff5f5' : '#fefce8', borderRadius: '8px', border: '1px solid', borderColor: p.status === 'VERIFIED' ? '#c6f6d5' : p.status === 'REJECTED' ? '#fed7d7' : '#fef08a' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>#{index + 1} - LKR {Number(p.amount || 0).toLocaleString()}</span>
                                                        <span style={{
                                                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900,
                                                            background: p.status === 'VERIFIED' ? '#166534' : p.status === 'REJECTED' ? '#991b1b' : '#a16207',
                                                            color: 'white'
                                                        }}>
                                                            {p.status}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={() => openBlob(p.slipUrl)}
                                                            style={{ flex: 1, padding: '0.4rem', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                                                        >
                                                            👁️ View
                                                        </button>
                                                        {p.status === 'PENDING' && (isAssessor || isAdmin) && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleVerifyPayment(p.id, 'VERIFIED')}
                                                                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}
                                                                >
                                                                    ✅
                                                                </button>
                                                                <button
                                                                    onClick={() => handleVerifyPayment(p.id, 'REJECTED')}
                                                                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700 }}
                                                                >
                                                                    ❌
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                    {p.remarks && <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>{p.remarks}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '1rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                        No stamp duty installments submitted.
                                    </div>
                                )}
                            </div>
                        </div>

                        {renderActionSection()}

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowPrintPreview(true)}
                                style={{ background: '#f5f5f5', color: '#1a237e', border: '1px solid #1a237e', flex: 1, padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                className="hide-on-print"
                            >
                                👁️ View Full Application
                            </button>

                            <button
                                onClick={() => window.print()}
                                style={{ background: '#e3f2fd', color: '#1976d2', border: '1px solid #90caf9', flex: 1, padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                className="print-btn hide-on-print"
                            >
                                🖨️ Download / Print Complete File
                            </button>
                        </div>

                        <button
                            onClick={() => navigate('/internal')}
                            style={{ background: '#f5f5f5', color: '#444', border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                            className="hide-on-print"
                        >
                            ← Return to Dashboard
                        </button>
                    </div>
                </div>
            </div> {/* End .no-print wrapper */}

            {/* REJECTION SCENARIO MODAL */}
            {showRejectModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '560px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
                        <h2 style={{ color: '#be123c', margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>🚫 Reject Application</h2>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select the rejection scenario and provide detailed instructions for the officer and applicant.</p>

                        <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>Rejection Scenario <span style={{ color: 'red' }}>*</span></label>
                            <select
                                value={rejectionScenario}
                                onChange={(e) => setRejectionScenario(e.target.value)}
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                            >
                                <option value="">-- Select a Scenario --</option>
                                <option value="Not Relevant to Kalutara Regional Office">Not Relevant to Kalutara Regional Office (Transfer Required)</option>
                                <option value="Incorrect Information / Missing Documents">Incorrect Information / Missing Documents</option>
                                <option value="Application Not Eligible">Application Not Eligible (Permanent Close)</option>
                                <option value="Requires Submission to Another Department">Requires Submission to Another Department</option>
                            </select>
                        </div>

                        {rejectionScenario === 'Incorrect Information / Missing Documents' && (
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '0.8rem 1rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                                    <input
                                        type="checkbox"
                                        checked={allowResubmission}
                                        onChange={(e) => setAllowResubmission(e.target.checked)}
                                    />
                                    Allow applicant to correct and resubmit
                                </label>
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '0.4rem' }}>Instructions / Reason <span style={{ color: 'red' }}>*</span></label>
                            <textarea
                                value={rejectionInstructions}
                                onChange={(e) => setRejectionInstructions(e.target.value)}
                                placeholder="Provide clear instructions for the officer and/or applicant regarding the next steps..."
                                rows={4}
                                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem', lineHeight: '1.5', boxSizing: 'border-box', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowRejectModal(false)}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700 }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '10px', border: 'none', background: '#be123c', color: 'white', cursor: 'pointer', fontWeight: 700 }}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN PRINTABLE DOCUMENT AREA (Exact Match to ExternalApplicationDetail) */}
            <div className="official-a4-document" style={{ display: showPrintPreview ? 'block' : 'none', padding: showPrintPreview ? '2rem' : '0', maxWidth: '900px', margin: '0 auto' }}>
                {showPrintPreview && (
                    <div className="hide-on-print" style={{ position: 'sticky', top: 0, background: '#f8fafc', padding: '1rem', borderBottom: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, marginBottom: '2rem', borderRadius: '8px' }}>
                        <h3 style={{ margin: 0, color: '#1a237e' }}>📝 Previewing Formal Application Record</h3>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => window.print()} style={{ background: '#e3f2fd', color: '#1976d2', border: '1px solid #90caf9', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>🖨️ Print Document</button>
                            <button onClick={() => setShowPrintPreview(false)} style={{ background: '#f5f5f5', color: '#444', border: '1px solid #ddd', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>❌ Close Preview</button>
                        </div>
                    </div>
                )}


                {/* Government Header (Visible in Print) */}
                <div className="print-only-header" style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '3px double #000', paddingBottom: '1rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Emblem_of_Sri_Lanka.svg" alt="Emblem" width="60" />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '16pt', fontWeight: 700, textTransform: 'uppercase' }}>Department of Revenue - Western Province</h2>
                    <h3 style={{ margin: '0.2rem 0', fontSize: '14pt', fontWeight: 600 }}>Stamp Duty Online System</h3>
                    <p style={{ margin: 0, fontSize: '10pt', fontStyle: 'italic' }}>Official Application Record</p>
                </div>

                {/* Main Header / Status */}
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '0',
                    boxShadow: 'none',
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: 'none',
                    borderBottom: '2px solid #1a237e'
                }} className="document-header-box">
                    <div>
                        <h1 style={{ margin: 0, color: '#1a237e', fontWeight: 900, fontSize: '2rem' }}>{app.permFileNo || app.tempFileNo}</h1>
                        <p style={{ color: '#64748b', marginTop: '0.5rem', fontWeight: 600 }}>Reference: {app.tempFileNo || 'N/A'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className={`status-badge bg-${(app.status || '').toLowerCase()}`} style={{ fontSize: '1rem', padding: '0.6rem 1.5rem', borderRadius: '12px', fontWeight: 800, border: '1px solid #ccc' }}>
                            {app.status || 'N/A'}
                        </span>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem', fontWeight: 700 }}>SUBMITTED ON: {app.date} | {app.time}</p>
                    </div>
                </div>

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
                        <div className="detail-section">
                            <h3 className="section-title">3. NOTARY / LEGAL REPRESENTATIVE DETAILS</h3>
                            <table className="info-table">
                                <tbody>
                                    <tr style={getHighlightStyle('notary', 'notary.name')}>
                                        <td><strong>Notary Name:</strong></td>
                                        <td colSpan="3">{data.notary.name} {renderUnlockToggle('notary.name')}</td>
                                    </tr>
                                    <tr>
                                        <td style={getHighlightStyle('notary', 'notary.barNo')}><strong>Bar Association No:</strong></td>
                                        <td style={getHighlightStyle('notary', 'notary.barNo')}>{data.notary.barNo || '-'} {renderUnlockToggle('notary.barNo')}</td>
                                        <td style={getHighlightStyle('notary', 'notary.tin')}><strong>Taxpayer ID (TIN):</strong></td>
                                        <td style={getHighlightStyle('notary', 'notary.tin')}>{data.notary.tin || '-'} {renderUnlockToggle('notary.tin')}</td>
                                    </tr>
                                    <tr style={getHighlightStyle('notary', 'notary.address')}>
                                        <td><strong>Office Address:</strong></td>
                                        <td colSpan="3">{data.notary.address} {renderUnlockToggle('notary.address')}</td>
                                    </tr>
                                    <tr>
                                        <td style={getHighlightStyle('notary', 'notary.contact')}><strong>Contact:</strong></td>
                                        <td style={getHighlightStyle('notary', 'notary.contact')}>{data.notary.contact} {renderUnlockToggle('notary.contact')}</td>
                                        <td style={getHighlightStyle('notary', 'notary.email')}><strong>Email:</strong></td>
                                        <td style={getHighlightStyle('notary', 'notary.email')}>{data.notary.email} {renderUnlockToggle('notary.email')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* 4. TRANSFERORS / SELLERS */}
                    <div className="detail-section">
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
                                    <tr key={i} style={getHighlightStyle('grantors')}>
                                        <td>{i + 1}</td>
                                        <td style={getHighlightStyle('grantors', `grantors.${i}.name`)}>
                                            <strong>{g.name}</strong> {renderUnlockToggle(`grantors.${i}.name`)}
                                        </td>
                                        <td style={getHighlightStyle('grantors', `grantors.${i}.reference`)}>
                                            {g.reference} {renderUnlockToggle(`grantors.${i}.reference`)}
                                        </td>
                                        <td style={getHighlightStyle('grantors', `grantors.${i}.tin`)}>
                                            {g.tin || '-'} {renderUnlockToggle(`grantors.${i}.tin`)}
                                        </td>
                                        <td style={getHighlightStyle('grantors', `grantors.${i}.address`)}>
                                            {g.address} {renderUnlockToggle(`grantors.${i}.address`)}
                                        </td>
                                    </tr>
                                ))}
                                {(!data.grantors || data.grantors.length === 0) && (
                                    <tr><td colSpan="5" className="text-center">No grantors listed</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 5. TRANSFEREES / BUYERS */}
                    <div className="detail-section">
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
                                    <tr key={i} style={getHighlightStyle('grantees')}>
                                        <td>{i + 1}</td>
                                        <td style={getHighlightStyle('grantees', `grantees.${i}.name`)}>
                                            <strong>{g.name}</strong> {renderUnlockToggle(`grantees.${i}.name`)}
                                        </td>
                                        <td style={getHighlightStyle('grantees', `grantees.${i}.reference`)}>
                                            {g.reference} {renderUnlockToggle(`grantees.${i}.reference`)}
                                        </td>
                                        <td style={getHighlightStyle('grantees', `grantees.${i}.tin`)}>
                                            {g.tin || '-'} {renderUnlockToggle(`grantees.${i}.tin`)}
                                        </td>
                                        <td style={getHighlightStyle('grantees', `grantees.${i}.address`)}>
                                            {g.address} {renderUnlockToggle(`grantees.${i}.address`)}
                                        </td>
                                    </tr>
                                ))}
                                {(!data.grantees || data.grantees.length === 0) && (
                                    <tr><td colSpan="5" className="text-center">No grantees listed</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 6. PROPERTY DETAILS */}
                    <div className="detail-section">
                        <h3 className="section-title">6. PROPERTY & LAND DETAILS</h3>
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td style={getHighlightStyle('property', 'property.localAuthority')}><strong>Local Authority:</strong></td>
                                    <td style={getHighlightStyle('property', 'property.localAuthority')}>{data.property?.localAuthority} {renderUnlockToggle('property.localAuthority')}</td>
                                    <td style={getHighlightStyle('property', 'property.nature')}><strong>Instrument Nature:</strong></td>
                                    <td style={getHighlightStyle('property', 'property.nature')}>{data.property?.nature} {renderUnlockToggle('property.nature')}</td>
                                </tr>
                                <tr>
                                    <td style={getHighlightStyle('property', 'property.address')}><strong>Property Address:</strong></td>
                                    <td colSpan="3" style={getHighlightStyle('property', 'property.address')}>{data.property?.address} {renderUnlockToggle('property.address')}</td>
                                </tr>
                                <tr>
                                    <td style={getHighlightStyle('property', 'property.landType')}><strong>Land Type:</strong></td>
                                    <td style={getHighlightStyle('property', 'property.landType')}>{data.property?.landType} {renderUnlockToggle('property.landType')}</td>
                                    <td><strong>Total Extent:</strong></td>
                                    <td>{data.property?.extent ? `${data.property.extent.acre}A ${data.property.extent.rood}R ${data.property.extent.perch}P` : 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style={getHighlightStyle('property', 'property.planNo')}><strong>Plan Number:</strong></td>
                                    <td style={getHighlightStyle('property', 'property.planNo')}>{data.property?.planNo} {renderUnlockToggle('property.planNo')}</td>
                                    <td style={getHighlightStyle('property', 'property.planDate')}><strong>Plan Date:</strong></td>
                                    <td style={getHighlightStyle('property', 'property.planDate')}>{data.property?.planDate} {renderUnlockToggle('property.planDate')}</td>
                                </tr>
                                <tr>
                                    <td style={getHighlightStyle('property', 'property.lotNo')}><strong>Lot / Plot Number:</strong></td>
                                    <td style={getHighlightStyle('property', 'property.lotNo')}>{data.property?.lotNo} {renderUnlockToggle('property.lotNo')}</td>
                                    <td style={getHighlightStyle('property', 'property.surveyor')}><strong>Surveyor Name:</strong></td>
                                    <td style={getHighlightStyle('property', 'property.surveyor')}>{data.property?.surveyor} {renderUnlockToggle('property.surveyor')}</td>
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
                        <div className="detail-section">
                            <h3 className="section-title">7. BUILDING / STRUCTURE INFORMATION</h3>
                            <table className="info-table">
                                <tbody>
                                    <tr>
                                        <td style={getHighlightStyle('building', 'building.type')}><strong>Structure Type:</strong></td>
                                        <td style={getHighlightStyle('building', 'building.type')}>{data.building.type} {renderUnlockToggle('building.type')}</td>
                                        <td style={getHighlightStyle('building', 'building.planNo')}><strong>Building Plan No:</strong></td>
                                        <td style={getHighlightStyle('building', 'building.planNo')}>{data.building.planNo || 'N/A'} {renderUnlockToggle('building.planNo')}</td>
                                    </tr>
                                    <tr>
                                        <td style={getHighlightStyle('building', 'building.year')}><strong>Construction Year:</strong></td>
                                        <td style={getHighlightStyle('building', 'building.year')}>{data.building.year || '-'} {renderUnlockToggle('building.year')}</td>
                                        <td style={getHighlightStyle('building', 'building.unitNo')}><strong>Unit / Assessment No:</strong></td>
                                        <td style={getHighlightStyle('building', 'building.unitNo')}>{data.building.unitNo || 'N/A'} {renderUnlockToggle('building.unitNo')}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Floor Count:</strong></td>
                                        <td>{data.building.floors?.length || 1}</td>
                                        <td style={getHighlightStyle('building', 'building.isRented')}><strong>Is Rented:</strong></td>
                                        <td style={getHighlightStyle('building', 'building.isRented')}>{data.building.isRented ? 'Yes' : 'No'} {renderUnlockToggle('building.isRented')}</td>
                                    </tr>
                                    <tr style={getHighlightStyle('building', 'building.facilities')}>
                                        <td><strong>Facilities:</strong></td>
                                        <td colSpan="3">{data.building.facilities || 'Basic'} {renderUnlockToggle('building.facilities')}</td>
                                    </tr>
                                    {data.building.isRented && (
                                        <tr style={getHighlightStyle('building', 'building.rent')}>
                                            <td><strong>Monthly Rent:</strong></td>
                                            <td colSpan="3">LKR {(parseFloat(data.building.rent || 0)).toLocaleString()} {renderUnlockToggle('building.rent')}</td>
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
                                                <td style={getHighlightStyle('building', `building.floors.${i}.floorNo`)}>{f.floorNo} {renderUnlockToggle(`building.floors.${i}.floorNo`)}</td>
                                                <td style={getHighlightStyle('building', `building.floors.${i}.area`)}>{f.area || 'N/A'} {renderUnlockToggle(`building.floors.${i}.area`)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {/* 8. TRANSACTION VALUE & OFFICIAL OPINION */}
                    <div className="detail-section">
                        <h3 className="section-title">8. TRANSACTION VALUATION & OFFICIAL OPINION</h3>
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td><strong>Reported Consideration:</strong></td>
                                    <td><strong style={{ color: '#1a237e' }}>LKR {(parseFloat(data.value?.purchase || 0)).toLocaleString()}</strong></td>
                                    <td><strong>Reported Market Value:</strong></td>
                                    <td><strong>LKR {(parseFloat(data.value?.marketValue || 0)).toLocaleString()}</strong></td>
                                </tr>
                                <tr>
                                    <td><strong>Approved Property Value:</strong></td>
                                    <td style={{ background: '#f8fafc' }}><strong style={{ color: '#0d47a1', fontSize: '1.05rem' }}>{opinionData ? `LKR ${opinionData.propertyValue}` : 'PENDING'}</strong></td>
                                    <td><strong>Approved Stamp Duty:</strong></td>
                                    <td style={{ background: '#f8fafc' }}><strong style={{ color: '#b71c1c', fontSize: '1.05rem' }}>{opinionData ? `LKR ${opinionData.stampDutyPayable}` : 'PENDING'}</strong></td>
                                </tr>
                                <tr>
                                    <td><strong>Assessor Remarks:</strong></td>
                                    <td colSpan="3">{opinionData ? opinionData.assessorRemarks || 'None' : 'Pending assessment...'}</td>
                                </tr>
                                {opinionData && (
                                    <tr>
                                        <td><strong>Opinion Issued By:</strong></td>
                                        <td>{opinionData.issuedBy} ({opinionData.designation})</td>
                                        <td><strong>Issue Date:</strong></td>
                                        <td>{opinionData.issuedDate}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 9. ATTACHMENTS */}
                    <div className="detail-section">
                        <h3 className="section-title">9. SUBMITTED DOCUMENTS & ATTACHMENTS</h3>
                        <table className="info-table bordered">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Document Name / Type</th>
                                    <th>Original Filename</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(data.attachments && (Array.isArray(data.attachments) ? data.attachments : Object.entries(data.attachments))).filter((item) => {
                                    if (Array.isArray(data.attachments)) {
                                        return item && typeof item === 'object' && item.name && item.fileName;
                                    } else {
                                        const [name, val] = item;
                                        if (!isNaN(name)) return false;
                                        if (!val || typeof val === 'string') return false;
                                        return true;
                                    }
                                }).map((item, i) => {
                                    let doc = { name: '', fileName: '' };
                                    if (Array.isArray(data.attachments)) {
                                        doc = item;
                                    } else {
                                        const [name, val] = item;
                                        doc = {
                                            name,
                                            fileName: (val && typeof val === 'object') ? (val.fileName || val.name) : val
                                        };
                                    }
                                    return (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{doc.name}</td>
                                            <td>{doc.fileName || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* 10. PAYMENT DETAILS */}
                    <div className="detail-section" style={{ borderBottom: 'none' }}>
                        <h3 className="section-title" style={{ color: '#059669', borderBottomColor: '#059669' }}>10. APPLICATION PAYMENT DETAILS</h3>
                        <table className="info-table">
                            <tbody>
                                <tr>
                                    <td><strong>{(app?.category === 'FI' || app?.category === 'RT') ? 'Total Amount Payable:' : 'Total Assessed Duty:'}</strong></td>
                                    <td><strong style={{ color: '#b71c1c' }}>LKR {totalDuty.toLocaleString()}</strong></td>
                                    <td><strong>Total Verified Paid:</strong></td>
                                    <td><strong style={{ color: '#059669' }}>LKR {totalPaid.toLocaleString()}</strong></td>
                                </tr>
                                <tr>
                                    <td><strong>Remaining Balance:</strong></td>
                                    <td><strong style={{ color: totalPaid >= totalDuty && totalDuty > 0 ? '#059669' : '#b71c1c' }}>LKR {remainingBalance.toLocaleString()}</strong></td>
                                    <td><strong>Payment Status:</strong></td>
                                    <td>
                                        <span style={{ color: totalPaid >= totalDuty && totalDuty > 0 ? '#059669' : '#b91c1c', fontWeight: 800 }}>
                                            {totalPaid >= totalDuty && totalDuty > 0 ? '✅ FULLY PAID' : (totalPaid > 0 ? '🌗 PARTIALLY PAID' : '❌ UNPAID')}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={getHighlightStyle('payment', 'payment.bank')}><strong>Paid Bank:</strong></td>
                                    <td style={getHighlightStyle('payment', 'payment.bank')}>{data.payment?.bank || 'N/A'} {renderUnlockToggle('payment.bank')}</td>
                                    <td style={getHighlightStyle('payment', 'payment.branch')}><strong>Branch:</strong></td>
                                    <td style={getHighlightStyle('payment', 'payment.branch')}>{data.payment?.branch || 'N/A'} {renderUnlockToggle('payment.branch')}</td>
                                </tr>
                                <tr>
                                    <td style={getHighlightStyle('payment', 'payment.receiptNo')}><strong>Reference No:</strong></td>
                                    <td style={getHighlightStyle('payment', 'payment.receiptNo')}>{data.payment?.receiptNo || 'N/A'} {renderUnlockToggle('payment.receiptNo')}</td>
                                    <td style={getHighlightStyle('payment', 'payment.date')}><strong>Payment Date:</strong></td>
                                    <td style={getHighlightStyle('payment', 'payment.date')}>{data.payment?.date || 'N/A'} {renderUnlockToggle('payment.date')}</td>
                                </tr>
                                <tr>
                                    <td><strong>Pending Verification:</strong></td>
                                    <td colSpan="3">LKR {pendingVerification.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>

                        {paymentData.length > 0 && (
                            <table className="info-table bordered" style={{ marginTop: '1rem' }}>
                                <thead>
                                    <tr>
                                        <th>Installment</th>
                                        <th>Date</th>
                                        <th>Amount (LKR)</th>
                                        <th>Status</th>
                                        <th>Verification Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentData.map((p, idx) => (
                                        <tr key={idx}>
                                            <td>#{idx + 1}</td>
                                            <td>{p.date}</td>
                                            <td>{p.amount?.toLocaleString()}</td>
                                            <td>{p.status}</td>
                                            <td>{p.remarks || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Print Footer */}
                <div className="print-footer" style={{ marginTop: '2rem', borderTop: '1px solid #ccc', paddingTop: '1rem', fontSize: '8pt', textAlign: 'center', color: '#666' }}>
                    <p style={{ fontWeight: 600, margin: '0 0 5px 0' }}>*** THIS IS A SYSTEM GENERATED DOCUMENT ***</p>
                    <p style={{ margin: 0 }}>This record reflects the internal application details processed by the Western Province. Generated on {new Date().toLocaleString()}</p>
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
                        display: block !important; /* Revealing the hidden document only on print */
                        background: white !important;
                    }

                    .detail-section { 
                        page-break-inside: auto !important; 
                        margin-bottom: 25px !important; 
                        border-bottom: 1pt solid #eee !important;
                        display: block !important;
                        width: 100% !important;
                    }

                    .info-table {
                        background: transparent !important;
                        page-break-inside: auto !important;
                        width: 100% !important;
                        border-collapse: collapse;
                        font-size: 0.95rem;
                    }

                    .info-table tr {
                        page-break-inside: avoid !important;
                    }

                    .info-table td { 
                        font-size: 10.5pt !important; 
                        padding: 6px 10px !important; 
                        border: 0.5pt solid #e2e8f0 !important;
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

                    .section-title { 
                        font-size: 11pt !important; 
                        background: #f8fafc !important; 
                        color: #1a237e !important; 
                        border-bottom: 1.5pt solid #1a237e !important;
                        padding: 5px 10px !important;
                        margin-top: 15px !important;
                        font-weight: 900;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
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

                    .text-center { text-align: center; }
                }
            `}</style>

            {/* Amendment Modal */}
            {
                showAmendModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '500px', width: '90%' }}>
                            <h2 style={{ marginTop: 0, color: '#f57f17' }}>⚠️ Request Amendment</h2>
                            <p style={{ color: '#666', fontSize: '0.9rem' }}>Specify which sections need correction by the applicant.</p>

                            <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={amendSections.grantors} onChange={e => setAmendSections({ ...amendSections, grantors: e.target.checked })} />
                                    Grantors (Section 2.1)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={amendSections.grantees} onChange={e => setAmendSections({ ...amendSections, grantees: e.target.checked })} />
                                    Grantees (Section 2.2)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={amendSections.notary} onChange={e => setAmendSections({ ...amendSections, notary: e.target.checked })} />
                                    Notary/Lawyer (Section 2.3)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={amendSections.property} onChange={e => setAmendSections({ ...amendSections, property: e.target.checked })} />
                                    Property Particulars (Section 3)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={amendSections.building} onChange={e => setAmendSections({ ...amendSections, building: e.target.checked })} />
                                    Building Details (Section 3.1)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={amendSections.value} onChange={e => setAmendSections({ ...amendSections, value: e.target.checked })} />
                                    Transaction Value (Section 4)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={amendSections.payment} onChange={e => setAmendSections({ ...amendSections, payment: e.target.checked })} />
                                    Opinion Fee Payment (Section 4.1)
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={amendSections.attachments} onChange={e => setAmendSections({ ...amendSections, attachments: e.target.checked })} />
                                    Attachments (Section 5)
                                </label>
                                <hr style={{ margin: '0.5rem 0', borderColor: '#eee' }} />
                                <p style={{ fontSize: '0.8rem', color: '#1a237e', fontWeight: 600 }}>💡 Tip: You can also unlock specific fields by clicking the 🔒 icons next to them in the detail view while this modal is open.</p>
                            </div>

                            <div className="form-group">
                                <label>Assessor's Comment/Instructions</label>
                                <textarea
                                    value={amendComment}
                                    onChange={e => setAmendComment(e.target.value)}
                                    placeholder="Details about what needs to be fixed..."
                                    style={{ width: '100%', minHeight: '100px', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button className="btn-primary" style={{ background: '#ffa000', color: 'white', flex: 1 }} onClick={handleSendAmendment}>Send for Correction</button>
                                <button className="action-btn" style={{ flex: 1 }} onClick={() => setShowAmendModal(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ApplicationDetail;
