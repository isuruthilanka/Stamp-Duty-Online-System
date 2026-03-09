import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../AppContext';

const OfficialDeficiencyNotice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { applications, calculatorData, issueOpinionForm, currentUser } = useAppContext();
    const fileInputRef = useRef(null);

    const app = applications.find(a => a.id === parseInt(id));

    const [formDetails, setFormDetails] = useState({
        propertyValue: '',
        stampDutyPayable: '',
        stampAffixed: '',
        deficiencyAmount: '',
        penaltyRate: '',
        penaltyAmount: '',
        totalPayable: '',
        allocationReference: '',
        assessorRemarks: '',
        attachmentName: '',
        attachmentFile: null,
        attachmentDataUrl: null,
    });

    const [dragOver, setDragOver] = useState(false);
    const isAdmin = currentUser?.role === 'ADMIN';

    useEffect(() => {
        if (app) {
            let existingNotice = null;
            if (app.opinionForm) {
                try {
                    existingNotice = typeof app.opinionForm === 'string'
                        ? JSON.parse(app.opinionForm)
                        : app.opinionForm;
                } catch (e) {
                    console.error("Notice parsing error:", e);
                }
            }

            setFormDetails(prev => ({
                ...prev,
                propertyValue: calculatorData?.propertyValue || existingNotice?.propertyValue || '',
                stampDutyPayable: calculatorData?.stampDutyPayable || existingNotice?.stampDutyPayable || '',
                stampAffixed: calculatorData?.stampAffixed || existingNotice?.stampAffixed || '',
                deficiencyAmount: calculatorData?.deficiencyAmount || existingNotice?.deficiencyAmount || '',
                penaltyRate: calculatorData?.penaltyRate || existingNotice?.penaltyRate || '',
                penaltyAmount: calculatorData?.penaltyAmount || existingNotice?.penaltyAmount || '',
                totalPayable: calculatorData?.totalPayable || existingNotice?.totalPayable || '',
                allocationReference: existingNotice?.allocationReference || app.permFileNo || app.tempFileNo || '',
                assessorRemarks: existingNotice?.assessorRemarks || '',
                attachmentName: existingNotice?.attachmentName || '',
                attachmentDataUrl: existingNotice?.attachmentDataUrl || null,
            }));
        }
    }, [app, calculatorData]);

    if (!app) return <div style={{ padding: '2rem' }}>Application not found.</div>;

    if (app.status === 'OPINION_ISSUED' && !isAdmin) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto', marginTop: '4rem', background: '#fff0f0', borderRadius: '12px', border: '1px solid #ffcdd2' }}>
                <h2 style={{ color: '#d32f2f' }}>Access Denied</h2>
                <p style={{ color: '#555', marginBottom: '2rem' }}>This Official Notice has already been issued and locked. You do not have permission to modify it.</p>
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
            alert('Missing calculation data. Please compute deficiency first.');
            return;
        }

        try {
            let existingNotice = {};
            if (app.opinionForm) {
                try {
                    existingNotice = typeof app.opinionForm === 'string'
                        ? JSON.parse(app.opinionForm)
                        : app.opinionForm;
                } catch (e) { }
            }

            const isEdit = app.status === 'OPINION_ISSUED';

            const payload = {
                propertyValue: formDetails.propertyValue,
                stampDutyPayable: formDetails.stampDutyPayable,
                stampAffixed: formDetails.stampAffixed,
                deficiencyAmount: formDetails.deficiencyAmount,
                penaltyRate: formDetails.penaltyRate,
                penaltyAmount: formDetails.penaltyAmount,
                totalPayable: formDetails.totalPayable,
                allocationReference: formDetails.allocationReference,
                assessorRemarks: formDetails.assessorRemarks,
                attachmentName: formDetails.attachmentName || existingNotice.attachmentName || 'Official_Notice.pdf',
                attachmentDataUrl: formDetails.attachmentDataUrl || existingNotice.attachmentDataUrl || null,
                isDeficiencyNotice: true // Flag to render as deficiency on the external portal
            };

            if (isEdit) {
                payload.issuedDate = existingNotice.issuedDate;
                payload.issuedBy = existingNotice.issuedBy;
                payload.designation = existingNotice.designation;
                if (isAdmin) {
                    payload.lastModifiedBy = currentUser?.name;
                    payload.lastModifiedDate = new Date().toLocaleString();
                }
            }

            // We reuse issueOpinionForm since it fundamentally updates the same field and fires the same status
            await issueOpinionForm(app.id, payload);
            alert(isEdit ? 'Official Notice has been updated.' : 'Official Notice has been issued to the applicant.');
            navigate('/internal');
        } catch (error) {
            console.error('Submission failed:', error);
            alert('Failed to issue notice. The file might be too large or there was a connection error.');
        }
    };

    const formatCurr = (val) => val ? parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

    return (
        <div style={{ maxWidth: '860px', margin: '2rem auto', background: 'white', padding: '2.5rem', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', border: '1px solid #e1e8ed' }}>
            {/* Header / Letterhead */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #b91c1c', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                <h1 style={{ color: '#b91c1c', margin: 0, fontSize: '1.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Department of Revenue</h1>
                <p style={{ margin: '0.5rem 0 0', fontWeight: 600, color: '#546e7a' }}>Western Province - Sri Lanka</p>
                <div style={{ marginTop: '1rem', display: 'inline-block', padding: '0.4rem 1.2rem', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                    OFFICIAL DEFICIENCY & PENALTY NOTICE
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* ── Valuation Fields ── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                    <div className="form-group">
                        <label style={{ fontWeight: 700, color: '#37474f', display: 'block', marginBottom: '0.4rem' }}>
                            Value of the Property (LKR)
                        </label>
                        <input type="text" value={formatCurr(formDetails.propertyValue)} readOnly style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #66bb6a', background: '#f1f8e9', fontWeight: 600, fontSize: '1rem' }} />
                    </div>

                    <div className="form-group">
                        <label style={{ fontWeight: 700, color: '#37474f', display: 'block', marginBottom: '0.4rem' }}>
                            Allocation Reference / File No
                        </label>
                        <input type="text" value={formDetails.allocationReference} readOnly style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #eee', background: '#f5f5f5', fontWeight: 600, fontSize: '1rem' }} />
                    </div>

                    <div style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📊</span> Calculation Breakdown
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Stamp Duty Payable</span>
                                <span style={{ color: '#1e293b', fontWeight: 700 }}>{formatCurr(formDetails.stampDutyPayable)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Stamp Affixed / Paid</span>
                                <span style={{ color: '#059669', fontWeight: 700 }}>- {formatCurr(formDetails.stampAffixed)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#fffbeb', borderRadius: '6px' }}>
                                <span style={{ color: '#d97706', fontWeight: 700 }}>Deficiency Amount</span>
                                <span style={{ color: '#d97706', fontWeight: 800 }}>{formatCurr(formDetails.deficiencyAmount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px' }}>
                                <span style={{ color: '#ef4444', fontWeight: 700 }}>Penalty ({formDetails.penaltyRate}%)</span>
                                <span style={{ color: '#ef4444', fontWeight: 800 }}>{formatCurr(formDetails.penaltyAmount)}</span>
                            </div>
                            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#1e293b', color: 'white', borderRadius: '8px', marginTop: '0.5rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Total Amount Payable</span>
                                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fbbf24' }}>LKR {formatCurr(formDetails.totalPayable)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ fontWeight: 700, color: '#37474f', display: 'block', marginBottom: '0.4rem' }}>
                            Assessor's Remarks / Observations
                        </label>
                        <textarea
                            value={formDetails.assessorRemarks}
                            onChange={e => setFormDetails({ ...formDetails, assessorRemarks: e.target.value })}
                            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '2px solid #cfd8dc', minHeight: '100px', boxSizing: 'border-box', resize: 'vertical' }}
                            placeholder="Provide any additional justifications or instructions for payment..."
                        />
                    </div>
                </div>

                {/* ── Attach Official Notice Document ── */}
                <div style={{
                    background: '#f8fafc',
                    border: `2px dashed ${dragOver ? '#b91c1c' : (formDetails.attachmentName ? '#4caf50' : '#90a4ae')}`,
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '2.5rem' }}>📄</div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 700, color: '#1b5e20', fontSize: '1rem' }}>
                                    ✅ {formDetails.attachmentName}
                                </p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#546e7a' }}>
                                    Finalized Official Notice Document — ready to issue
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
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📎</div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#b91c1c', fontSize: '1rem' }}>
                                Attach Executed Deficiency Notice
                            </p>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: '#607d8b' }}>
                                Drag & drop the signed PDF here, or <strong style={{ color: '#b91c1c' }}>click to browse</strong>
                            </p>
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#90a4ae' }}>
                                Accepted: PDF, DOC, DOCX, JPG, PNG
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Assessor Signature Block ── */}
                <div style={{ background: '#fef2f2', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem', border: '1px solid #fecaca' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 700, color: '#991b1b' }}>{currentUser?.name}</p>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#b91c1c' }}>{currentUser?.designation} - {currentUser?.region}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b' }}>Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* ── Actions ── */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="action-btn" onClick={() => navigate(-1)}>Cancel</button>
                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ padding: '0.8rem 2.5rem', background: '#b91c1c', color: 'white', border: 'none' }}
                    >
                        📤 Issue Official Notice
                    </button>
                </div>
            </form>
        </div>
    );
};

export default OfficialDeficiencyNotice;
