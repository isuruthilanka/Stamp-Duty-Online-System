import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const OfficialOpinionForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { applications, calculatorData, issueOpinionForm, currentUser, checkDuplicateOpinion } = useAppContext();
    const fileInputRef = useRef(null);

    const app = applications.find(a => a.id === parseInt(id));

    const [formDetails, setFormDetails] = useState({
        propertyValue: '',
        stampDutyPayable: '',
        allocationReference: '',
        assessorRemarks: '',
        attachmentName: '',
        attachmentFile: null,
        attachmentDataUrl: null,
    });

    const [dragOver, setDragOver] = useState(false);
    const [duplicateOpinion, setDuplicateOpinion] = useState(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);

    const isAdmin = currentUser?.role === 'ADMIN';

    useEffect(() => {
        if (app) {
            let existingOpinion = null;
            if (app.opinionForm) {
                try {
                    existingOpinion = typeof app.opinionForm === 'string'
                        ? JSON.parse(app.opinionForm)
                        : app.opinionForm;
                } catch (e) {
                    console.error("Opinion form parsing error in Form:", e);
                }
            }

            // Use calculator data if available (non-zero), otherwise existing opinion, otherwise application data
            const propValue = (calculatorData?.marketValue && calculatorData.marketValue !== 0)
                ? calculatorData.marketValue
                : (existingOpinion?.propertyValue || app.fullData?.value?.marketValue || '');
            const stampDuty = (calculatorData?.dutyAmount && calculatorData.dutyAmount !== 0)
                ? calculatorData.dutyAmount
                : (existingOpinion?.stampDutyPayable || '');

            setFormDetails(prev => ({
                ...prev,
                propertyValue: propValue,
                stampDutyPayable: stampDuty,
                allocationReference: existingOpinion?.allocationReference || app.permFileNo || app.tempFileNo || '',
                assessorRemarks: existingOpinion?.assessorRemarks || '',
                attachmentName: existingOpinion?.attachmentName || '',
                attachmentDataUrl: existingOpinion?.attachmentDataUrl || null,
            }));

            // Check for duplicate opinion
            const { planNo, lotNo, localAuthority } = app.fullData?.property || {};
            if (planNo && lotNo && localAuthority) {
                checkDuplicateOpinion({ planNo, lotNo, localAuthority }).then(res => {
                    if (res.found) {
                        setDuplicateOpinion(res.details);
                        setShowDuplicateModal(true);
                    }
                });
            }
        }
    }, [app, calculatorData, checkDuplicateOpinion]);

    if (!app) return <div style={{ padding: '2rem' }}>Application not found.</div>;

    if (app.status === 'OPINION_ISSUED' && !isAdmin) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto', marginTop: '4rem', background: '#fff0f0', borderRadius: '12px', border: '1px solid #ffcdd2' }}>
                <h2 style={{ color: '#d32f2f' }}>Access Denied</h2>
                <p style={{ color: '#555', marginBottom: '2rem' }}>This Official Opinion Form has already been issued and locked. You do not have permission to modify it.</p>
                <button className="btn-primary" onClick={() => navigate('/internal')}>Return to Dashboard</button>
            </div>
        );
    }

    const handleFileSelect = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormDetails(prev => ({
                ...prev,
                attachmentName: file.name,
                attachmentFile: file,
                attachmentDataUrl: reader.result
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formDetails.propertyValue || !formDetails.stampDutyPayable) {
            alert('Please provide both Property Value and Stamp Duty Payable.');
            return;
        }

        try {
            let existingOpinion = {};
            if (app.opinionForm) {
                try {
                    existingOpinion = typeof app.opinionForm === 'string'
                        ? JSON.parse(app.opinionForm)
                        : app.opinionForm;
                } catch (e) { }
            }

            const isEdit = app.status === 'OPINION_ISSUED';

            const payload = {
                propertyValue: formDetails.propertyValue,
                stampDutyPayable: formDetails.stampDutyPayable,
                allocationReference: formDetails.allocationReference,
                assessorRemarks: formDetails.assessorRemarks,
                attachmentName: formDetails.attachmentName || existingOpinion.attachmentName || 'Official_Opinion.pdf',
                attachmentDataUrl: formDetails.attachmentDataUrl || existingOpinion.attachmentDataUrl || null,
            };

            if (isEdit) {
                payload.issuedDate = existingOpinion.issuedDate;
                payload.issuedBy = existingOpinion.issuedBy;
                payload.designation = existingOpinion.designation;
                if (isAdmin) {
                    payload.lastModifiedBy = currentUser?.name;
                    payload.lastModifiedDate = new Date().toLocaleString();
                }
            }

            await issueOpinionForm(app.id, payload);
            alert(isEdit ? 'Official Opinion Form has been updated.' : 'Official Opinion Form has been issued to the applicant.');
            navigate('/internal');
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Failed to issue opinion. The file might be too large or there was a connection error.');
        }
    };

    const isAutoFilledValue = calculatorData?.marketValue && calculatorData.marketValue !== 0;
    const isAutoFilledDuty = calculatorData?.dutyAmount && calculatorData.dutyAmount !== 0;

    return (
        <div style={{ maxWidth: '860px', margin: '2rem auto', background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #e1e8ed' }}>
            {/* Duplicate Opinion Modal */}
            {showDuplicateModal && duplicateOpinion && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                    animation: 'fadeIn 0.3s ease-out'
                }} onClick={() => setShowDuplicateModal(false)}>
                    <div style={{
                        background: 'white', padding: '2.5rem', borderRadius: '24px',
                        maxWidth: '550px', width: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        border: '1px solid #e2e8f0', position: 'relative', overflow: 'hidden'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }}></div>

                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '64px', height: '64px', background: '#fffbeb', color: '#f59e0b',
                                borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '2rem', margin: '0 auto 1rem', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.1)'
                            }}>⚠️</div>
                            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem', fontWeight: 800 }}>Existing Opinion Identified</h2>
                            <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                                A land opinion has already been issued for this specific land lot. Please review the details below.
                            </p>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '18px', border: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>File Number:</span>
                                <span style={{ color: '#1e293b', fontWeight: 700, fontFamily: 'monospace' }}>{duplicateOpinion.fileNumber}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Issued Date:</span>
                                <span style={{ color: '#1e293b', fontWeight: 700 }}>{duplicateOpinion.dateIssued}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Assessed Value:</span>
                                <span style={{ color: '#059669', fontWeight: 800 }}>LKR {parseInt(duplicateOpinion.propertyValue).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Stamp Duty:</span>
                                <span style={{ color: '#2563eb', fontWeight: 800 }}>LKR {parseInt(duplicateOpinion.stampDutyAmount).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.6rem' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Assessor:</span>
                                <span style={{ color: '#1e293b', fontWeight: 700 }}>{duplicateOpinion.assessorName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>Office/Division:</span>
                                <span style={{ color: '#1e293b', fontWeight: 700 }}>{duplicateOpinion.officeDivision}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem' }}>
                            <button
                                onClick={() => setShowDuplicateModal(false)}
                                style={{
                                    width: '100%', padding: '0.8rem', borderRadius: '12px',
                                    background: '#1e293b', color: 'white', border: 'none',
                                    fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#334155'}
                                onMouseOut={e => e.currentTarget.style.background = '#1e293b'}
                            >
                                Understood, Proceed with Review
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header / Letterhead */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #1a237e', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <h1 style={{ color: '#1a237e', margin: 0, fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Department of Revenue</h1>
                <p style={{ margin: '0.5rem 0 0', fontWeight: 600, color: '#546e7a' }}>Western Province - Sri Lanka</p>
                <div style={{ marginTop: '1rem', display: 'inline-block', padding: '0.4rem 1.2rem', background: '#e8eaf6', color: '#1a237e', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                    OFFICIAL OPINION FORM
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* ── Valuation Fields ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Property Value */}
                    <div className="form-group">
                        <label style={{ fontWeight: 700, color: '#37474f', display: 'block', marginBottom: '0.4rem' }}>
                            Value of the Property (LKR)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="number"
                                value={formDetails.propertyValue}
                                onChange={e => setFormDetails({ ...formDetails, propertyValue: e.target.value })}
                                style={{
                                    width: '100%', padding: '0.8rem', borderRadius: '8px',
                                    border: `2px solid ${isAutoFilledValue ? '#66bb6a' : '#cfd8dc'}`,
                                    boxSizing: 'border-box',
                                    background: isAutoFilledValue ? '#f1f8e9' : 'white',
                                    fontWeight: 600, fontSize: '1rem'
                                }}
                                placeholder="Enter property market value"
                                required
                            />
                        </div>
                        <small style={{ color: isAutoFilledValue ? '#2e7d32' : '#78909c', fontWeight: isAutoFilledValue ? 600 : 400 }}>
                            {isAutoFilledValue ? '✨ Auto-filled from Stamp Duty Calculator' : '✏️ Manual entry required'}
                        </small>

                    </div>

                    {/* Stamp Duty */}
                    <div className="form-group">
                        <label style={{ fontWeight: 700, color: '#37474f', display: 'block', marginBottom: '0.4rem' }}>
                            Stamp Duty Payable (LKR)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="number"
                                value={formDetails.stampDutyPayable}
                                onChange={e => setFormDetails({ ...formDetails, stampDutyPayable: e.target.value })}
                                style={{
                                    width: '100%', padding: '0.8rem', borderRadius: '8px',
                                    border: `2px solid ${isAutoFilledDuty ? '#42a5f5' : '#cfd8dc'}`,
                                    boxSizing: 'border-box',
                                    background: isAutoFilledDuty ? '#e3f2fd' : 'white',
                                    fontWeight: 700, fontSize: '1rem', color: '#2e7d32'
                                }}
                                placeholder="Enter stamp duty amount"
                                required
                            />
                        </div>
                        <small style={{ color: isAutoFilledDuty ? '#1565c0' : '#78909c', fontWeight: isAutoFilledDuty ? 600 : 400 }}>
                            {isAutoFilledDuty ? '✨ Auto-filled from Stamp Duty Calculator' : '✏️ Manual entry required'}
                        </small>

                    </div>

                    {/* Allocation Reference */}
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: 700, color: '#37474f', display: 'block', marginBottom: '0.4rem' }}>
                            Allocation Reference / File No
                        </label>
                        <input
                            type="text"
                            value={formDetails.allocationReference}
                            readOnly
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #eee', background: '#f5f5f5', boxSizing: 'border-box', fontWeight: 600 }}
                        />
                    </div>

                    {/* Assessor Remarks */}
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: 700, color: '#37474f', display: 'block', marginBottom: '0.4rem' }}>
                            Assessor's Remarks / Observations
                        </label>
                        <textarea
                            value={formDetails.assessorRemarks}
                            onChange={e => setFormDetails({ ...formDetails, assessorRemarks: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #cfd8dc', minHeight: '100px', boxSizing: 'border-box', resize: 'vertical' }}
                            placeholder="Provide any additional justifications or notes..."
                        />
                    </div>
                </div>

                {/* ── Attach Official Opinion Document ── */}
                <div style={{
                    background: '#f8fafc',
                    border: `2px dashed ${dragOver ? '#1a237e' : (formDetails.attachmentName ? '#4caf50' : '#90a4ae')}`,
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem',
                    transition: 'border-color 0.2s',
                    cursor: 'pointer'
                }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={e => handleFileSelect(e.target.files[0])}
                    />

                    {formDetails.attachmentName ? (
                        /* File selected state */
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '2.5rem' }}>📄</div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 700, color: '#1b5e20', fontSize: '1rem' }}>
                                    ✅ {formDetails.attachmentName}
                                </p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#546e7a' }}>
                                    Finalized Official Opinion Document — ready to issue
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={e => {
                                    e.stopPropagation();
                                    setFormDetails(prev => ({ ...prev, attachmentName: '', attachmentFile: null, attachmentDataUrl: null }));
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                style={{ background: '#ffebee', border: '1px solid #ffcdd2', color: '#c62828', borderRadius: '6px', padding: '0.3rem 0.8rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                            >
                                ✕ Remove
                            </button>
                        </div>
                    ) : (
                        /* Empty / drag state */
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📎</div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#1a237e', fontSize: '1rem' }}>
                                Attach Finalized Official Opinion Document
                            </p>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#607d8b' }}>
                                Drag & drop the signed PDF here, or <strong style={{ color: '#1a237e' }}>click to browse</strong>
                            </p>
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#90a4ae' }}>
                                Accepted: PDF, DOC, DOCX, JPG, PNG
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Assessor Signature Block ── */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #edf2f7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#1a237e' }}>{currentUser?.name}</p>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>{currentUser?.designation} - {currentUser?.region}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="action-btn" onClick={() => navigate(-1)}>Cancel</button>
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ padding: '0.8rem 2.5rem', background: 'var(--primary-color)', color: 'white' }}
                    >
                        📤 Issue Official Opinion
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OfficialOpinionForm;
