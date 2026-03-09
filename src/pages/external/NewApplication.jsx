import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaBuilding, FaMapMarkedAlt, FaFileContract, FaFileUpload, FaPrint } from 'react-icons/fa';

import './NewApplication.css';

const steps = [
    { id: 1, title: 'Application Type', icon: FaFileContract },
    { id: 2, title: 'Applicant Info', icon: FaBuilding },
    { id: 3, title: 'Property Details', icon: FaMapMarkedAlt },
    { id: 4, title: 'Transaction Values', icon: FaFileContract },
    { id: 5, title: 'Documents', icon: FaFileUpload },
    { id: 6, title: 'Review & Submit', icon: FaCheck }
];

// Reusing original components from NewApplication to preserve layout and functionality where possible,
// but adapting them for step-based wizard
const SectionTitle = React.memo(({ title, sectionKey, isAmendedMode, unlockedSections, amendedFields }) => {
    const isSectionUnlocked = sectionKey && unlockedSections[sectionKey];
    const hasAmendedFields = sectionKey && amendedFields && Object.keys(amendedFields).some(k => k.startsWith(sectionKey) && amendedFields[k]);

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>{title}</h3>
            {isAmendedMode && (isSectionUnlocked || hasAmendedFields) && (
                <span style={{
                    padding: '0.4rem 1rem',
                    fontSize: '0.75rem',
                    borderRadius: '20px',
                    background: '#fff3e0',
                    color: '#e65100',
                    fontWeight: 700,
                    border: '1px solid #ff9800'
                }}>
                    🔓 {isSectionUnlocked ? 'Section Unlocked' : 'Fields Unlocked'} for Correction
                </span>
            )}
        </div>
    );
});

const EntitySection = React.memo(({ title, field, sectionKey, formData, updateEntity, removeEntity, addEntity, isDisabled, isAmendedMode, unlockedSections, amendedFields }) => (
    <div className="card-section">
        <SectionTitle
            title={title}
            sectionKey={sectionKey || field}
            isAmendedMode={isAmendedMode}
            unlockedSections={unlockedSections}
            amendedFields={amendedFields}
        />
        {formData[field]?.map((entity, idx) => (
            <div key={idx} className="nested-section" style={{ background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #eee', opacity: isDisabled(sectionKey || field) ? 0.7 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <strong>{title.split(' ').slice(2).join(' ')}</strong>
                    <div style={{ flex: 1, marginLeft: '2rem' }}>
                        <div className={`type-selector ${isDisabled(sectionKey || field) ? 'pointer-events-none' : ''}`} style={{ marginBottom: 0 }}>
                            <div className={`type-tab ${entity.type === 'Person' ? 'active' : ''}`} onClick={() => updateEntity(field, idx, 'type', 'Person')}>Person</div>
                            <div className={`type-tab ${entity.type === 'Company' ? 'active' : ''}`} onClick={() => updateEntity(field, idx, 'type', 'Company')}>Company</div>
                        </div>
                    </div>
                    {idx > 0 && !isDisabled(sectionKey || field) && <button type="button" className="action-btn btn-delete" style={{ marginLeft: '1rem' }} onClick={() => removeEntity(field, idx)}>Remove</button>}
                </div>
                <div className="form-grid">
                    {entity.type === 'Person' ? (
                        <>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Name in Full {amendedFields?.[`${field}.${idx}.name`] && '🔓'}</label>
                                <input type="text" value={entity.name} onChange={e => updateEntity(field, idx, 'name', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.name`)} required />
                            </div>
                            <div className="form-group">
                                <label>NIC/Passport {amendedFields?.[`${field}.${idx}.reference`] && '🔓'}</label>
                                <input type="text" value={entity.reference} onChange={e => updateEntity(field, idx, 'reference', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.reference`)} required />
                            </div>
                            <div className="form-group">
                                <label>Taxpayer Identification Number (TIN) {amendedFields?.[`${field}.${idx}.tin`] && '🔓'}</label>
                                <input type="text" pattern="\d{9}" title="TIN must be a 9-digit number" value={entity.tin} onChange={e => updateEntity(field, idx, 'tin', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.tin`)} />
                            </div>
                            <div className="form-group">
                                <label>Contact {amendedFields?.[`${field}.${idx}.contact`] && '🔓'}</label>
                                <input type="text" value={entity.contact} onChange={e => updateEntity(field, idx, 'contact', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.contact`)} />
                            </div>
                            <div className="form-group">
                                <label>Email {amendedFields?.[`${field}.${idx}.email`] && '🔓'}</label>
                                <input type="email" value={entity.email} onChange={e => updateEntity(field, idx, 'email', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.email`)} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Address {amendedFields?.[`${field}.${idx}.address`] && '🔓'}</label>
                                <input type="text" value={entity.address} onChange={e => updateEntity(field, idx, 'address', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.address`)} required />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Company Name {amendedFields?.[`${field}.${idx}.name`] && '🔓'}</label>
                                <input type="text" value={entity.name} onChange={e => updateEntity(field, idx, 'name', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.name`)} required />
                            </div>
                            <div className="form-group">
                                <label>Registration No {amendedFields?.[`${field}.${idx}.reference`] && '🔓'}</label>
                                <input type="text" value={entity.reference} onChange={e => updateEntity(field, idx, 'reference', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.reference`)} required />
                            </div>
                            <div className="form-group">
                                <label>Taxpayer Identification Number (TIN) {amendedFields?.[`${field}.${idx}.tin`] && '🔓'}</label>
                                <input type="text" pattern="\d{9}" title="TIN must be a 9-digit number" value={entity.tin} onChange={e => updateEntity(field, idx, 'tin', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.tin`)} />
                            </div>
                            <div className="form-group">
                                <label>Category {amendedFields?.[`${field}.${idx}.companyCategory`] && '🔓'}</label>
                                <select value={entity.companyCategory} onChange={e => updateEntity(field, idx, 'companyCategory', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.companyCategory`)}>
                                    <option value="Private">Private</option>
                                    <option value="Public">Public</option>
                                    <option value="Government">Government</option>
                                    <option value="Bank">Bank</option>
                                    <option value="Finance">Finance Company</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Registration Date {amendedFields?.[`${field}.${idx}.regDate`] && '🔓'}</label>
                                <input type="date" value={entity.regDate} onChange={e => updateEntity(field, idx, 'regDate', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.regDate`)} />
                            </div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                <label>Official Address {amendedFields?.[`${field}.${idx}.address`] && '🔓'}</label>
                                <input type="text" value={entity.address} onChange={e => updateEntity(field, idx, 'address', e.target.value)} disabled={isDisabled(field, `${field}.${idx}.address`)} required />
                            </div>
                        </>
                    )}
                </div>
            </div>
        ))}
        {!isDisabled(sectionKey || field) && <button type="button" className="action-btn" style={{ marginBottom: '2rem' }} onClick={() => addEntity(field)}>+ Add Another</button>}
    </div>
));

const FileUploadField = React.memo(({ label, onFileSelect, fileName, disabled, required }) => (
    <div className="form-group" style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#444', display: 'block', marginBottom: '0.5rem' }}>{label}</label>
        <div
            style={{
                border: '2px dashed #ccc',
                padding: '1.2rem',
                borderRadius: '12px',
                textAlign: 'center',
                background: fileName ? '#f1f8e9' : '#fff',
                borderColor: fileName ? '#4caf50' : '#ccc',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: disabled ? 0.6 : 1,
                minHeight: '80px',
                justifyContent: 'center'
            }}
            onMouseOver={e => !disabled && (e.currentTarget.style.borderColor = 'var(--primary-color)')}
            onMouseOut={e => !disabled && (e.currentTarget.style.borderColor = fileName ? '#4caf50' : '#ccc')}
        >
            <input
                type="file"
                accept=".pdf,image/*,.doc,.docx"
                disabled={disabled}
                required={required}
                onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            onFileSelect({
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: event.target.result
                            });
                        };
                        reader.onerror = (err) => {
                            console.error(`FileReader error:`, err);
                            alert('Failed to read file. Please try again.');
                        };
                        reader.readAsDataURL(file);
                    }
                }}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2
                }}
            />
            {fileName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2e7d32', fontWeight: 600 }}>
                    <span style={{ fontSize: '1.2rem', cursor: 'pointer' }} title="Preview file" onClick={(e) => {
                        e.stopPropagation();
                        const url = typeof fileName === 'object' ? (fileName.url || fileName.data) : null;
                        if (!url) return;
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
                            alert('Could not open file preview.');
                        }
                    }}>👁️</span>
                    <span style={{ fontSize: '0.85rem' }}>{typeof fileName === 'object' ? fileName.fileName || fileName.name : fileName}</span>
                </div>
            ) : (
                <>
                    <span style={{ fontSize: '1.5rem', color: '#888' }}>📤</span>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Click or Drop File Here</span>
                    <span style={{ fontSize: '0.65rem', color: '#999' }}>PDF, Images, or Word Docs</span>
                </>
            )}
        </div>
    </div>
));

const AcknowledgmentReceipt = ({ appData, onBack, onPrint }) => {
    const submissionDate = new Date().toLocaleDateString('en-GB');
    const submissionTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const appTypeLabel = appData.category === 'OP' ? 'Official Opinion (OP)' : appData.category === 'FI' ? 'Financial Instrument (FI)' : 'Rate Tax (RT)';

    // Safety checks for nested data
    const granteeName = appData.fullData?.grantees?.[0]?.name || 'N/A';
    const granteeNIC = appData.fullData?.grantees?.[0]?.reference || 'N/A';
    const granteeAddress = appData.fullData?.grantees?.[0]?.address || 'N/A';
    const granteeContact = appData.fullData?.grantees?.[0]?.contact || 'N/A';
    const granteeEmail = appData.fullData?.grantees?.[0]?.email || 'N/A';

    const propertyAddress = appData.fullData?.property?.address || 'N/A';
    const lotNo = appData.fullData?.property?.lotNo || 'N/A';
    const transactionType = appData.fullData?.property?.nature || 'N/A';
    const declaredValue = appData.fullData?.value?.purchase
        ? `LKR ${parseFloat(appData.fullData.value.purchase).toLocaleString()}`
        : 'N/A';

    return (
        <div className="receipt-container">
            {/* Action buttons (hidden when printing) */}
            <div className="receipt-actions no-print">
                <button className="btn-secondary" onClick={onBack}>
                    ← Back to Dashboard
                </button>
                <button className="btn-print" onClick={onPrint}>
                    🖨️ Print Receipt
                </button>
            </div>

            {/* A4 Print Document Area */}
            <div className="official-document A4-page">

                {/* Header Section */}
                <div className="document-header">
                    <div className="emblem-placeholder">
                        <img src="/emblem-sri-lanka.svg" alt="Government Emblem" width="70" />
                    </div>
                    <div className="header-text">
                        <h2 className="ministry-name">Department of Revenue - Western Province</h2>
                        <h3 className="system-name">Stamp Duty Online System</h3>
                    </div>
                </div>

                <div className="document-title-wrapper">
                    <h1 className="document-title">SUBMISSION ACKNOWLEDGMENT RECEIPT</h1>
                    <div className="title-underline"></div>
                </div>

                {/* Application Information Table */}
                <div className="section-block">
                    <h4 className="section-heading">1. APPLICATION INFORMATION</h4>
                    <table className="info-table">
                        <tbody>
                            <tr>
                                <td className="label-cell">Application Number</td>
                                <td className="value-cell"><strong>{appData.id || 'PENDING ASSIGNMENT'}</strong></td>
                                <td className="label-cell">File Number (Ref)</td>
                                <td className="value-cell"><strong>{appData.tempFileNo || 'N/A'}</strong></td>
                            </tr>
                            <tr>
                                <td className="label-cell">Application Type</td>
                                <td className="value-cell">{appTypeLabel}</td>
                                <td className="label-cell">Status</td>
                                <td className="value-cell"><strong>Submitted / Pending Review</strong></td>
                            </tr>
                            <tr>
                                <td className="label-cell">Date of Submission</td>
                                <td className="value-cell">{submissionDate}</td>
                                <td className="label-cell">Time of Submission</td>
                                <td className="value-cell">{submissionTime}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Applicant Details */}
                <div className="section-block">
                    <h4 className="section-heading">2. PRIMARY APPLICANT DETAILS (GRANTEE)</h4>
                    <table className="info-table">
                        <tbody>
                            <tr>
                                <td className="label-cell" style={{ width: '25%' }}>Applicant Name</td>
                                <td className="value-cell" colSpan="3"><strong>{granteeName}</strong></td>
                            </tr>
                            <tr>
                                <td className="label-cell">National ID / Reg No.</td>
                                <td className="value-cell">{granteeNIC}</td>
                                <td className="label-cell">Taxpayer ID (TIN)</td>
                                <td className="value-cell">{appData.fullData?.grantees?.[0]?.tin || 'N/A'}</td>
                            </tr>
                            <tr>
                                <td className="label-cell">Address</td>
                                <td className="value-cell" colSpan="3">{granteeAddress}</td>
                            </tr>
                            <tr>
                                <td className="label-cell" style={{ width: '25%' }}>Contact Number</td>
                                <td className="value-cell" style={{ width: '25%' }}>{granteeContact}</td>
                                <td className="label-cell" style={{ width: '25%' }}>Email Address</td>
                                <td className="value-cell" style={{ width: '25%' }}>{granteeEmail}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Property / Transaction Details */}
                <div className="section-block">
                    <h4 className="section-heading">3. PROPERTY & TRANSACTION SUMMARY</h4>
                    <table className="info-table">
                        <tbody>
                            <tr>
                                <td className="label-cell" style={{ width: '25%' }}>Transaction Type</td>
                                <td className="value-cell" style={{ width: '25%' }}>{transactionType}</td>
                                <td className="label-cell" style={{ width: '25%' }}>Declared Value</td>
                                <td className="value-cell" style={{ width: '25%' }}><strong>{declaredValue}</strong></td>
                            </tr>
                            <tr>
                                <td className="label-cell">Property Address</td>
                                <td className="value-cell" colSpan="3">{propertyAddress}</td>
                            </tr>
                            <tr>
                                <td className="label-cell">Land Lot / Plot No.</td>
                                <td className="value-cell" colSpan="3">{lotNo}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Confirmation Message */}
                <div className="confirmation-box">
                    <p>
                        This is to acknowledge that the above application has been successfully
                        submitted through the Stamp Duty Online System. The application will be
                        reviewed by the relevant authority, and further communication will be
                        provided through the system portal.
                    </p>
                </div>

                {/* Footer Section */}
                <div className="document-footer">
                    <div className="signature-area">
                        <div className="signature-line"></div>
                        <p>Authorized Officer / System Administrator</p>
                    </div>

                    <div className="system-notice">
                        <p className="notice-bold">*** SYSTEM GENERATED DOCUMENT ***</p>
                        <p className="notice-standard">This is a digitally generated document and does not require a physical signature.</p>
                        <p className="notice-small">Generated on: {submissionDate} {submissionTime}</p>
                    </div>
                </div>

            </div>

            <style>{`
                /* Receipt Container & Actions */
                .receipt-container {
                    padding: 2rem;
                    background-color: #f1f5f9;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    font-family: 'Times New Roman', Times, serif;
                }
                
                .receipt-actions {
                    width: 100%;
                    max-width: 210mm; /* A4 width */
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2rem;
                }

                .btn-print {
                    background-color: #1e293b;
                    color: white;
                    border: none;
                    padding: 0.8rem 1.5rem;
                    border-radius: 8px;
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    transition: background 0.2s;
                }

                .btn-print:hover { background-color: #0f172a; }

                /* A4 Document Styling */
                .A4-page {
                    width: 210mm;
                    min-height: 297mm;
                    padding: 20mm;
                    background: white;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                    box-sizing: border-box;
                    color: #000;
                }

                /* Header */
                .document-header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    margin-bottom: 20px;
                }

                .emblem-placeholder {
                    margin-bottom: 15px;
                }

                .ministry-name {
                    font-size: 16pt;
                    font-weight: bold;
                    margin: 0 0 5px 0;
                    text-transform: uppercase;
                }

                .system-name {
                    font-size: 14pt;
                    font-weight: bold;
                    margin: 0 0 5px 0;
                }

                .gov-title {
                    font-size: 12pt;
                    margin: 0;
                }

                /* Title */
                .document-title-wrapper {
                    text-align: center;
                    margin: 30px 0;
                }

                .document-title {
                    font-size: 16pt;
                    font-weight: bold;
                    text-decoration: underline;
                    margin: 0;
                    letter-spacing: 1px;
                }

                /* Sections */
                .section-block {
                    margin-bottom: 25px;
                }

                .section-heading {
                    font-size: 12pt;
                    font-weight: bold;
                    margin: 0 0 10px 0;
                    text-transform: uppercase;
                    border-bottom: 1px solid #000;
                    padding-bottom: 3px;
                }

                /* Tables */
                .info-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 11pt;
                }

                .info-table td {
                    border: 1px solid #000;
                    padding: 8px;
                    vertical-align: top;
                }

                .label-cell {
                    background-color: #f8f8f8;
                    font-weight: bold;
                    width: 25%;
                }

                .value-cell {
                    width: 25%;
                }

                /* Confirmation Message */
                .confirmation-box {
                    margin: 30px 0;
                    padding: 15px;
                    border: 1px solid #000;
                    background-color: #fafafa;
                    text-align: justify;
                    font-size: 11.5pt;
                    line-height: 1.5;
                }

                /* Footer */
                .document-footer {
                    margin-top: 60px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .signature-area {
                    margin-bottom: 40px;
                    width: 250px;
                }

                .signature-line {
                    border-top: 1px dashed #000;
                    margin-bottom: 10px;
                }

                .signature-area p {
                    margin: 0;
                    font-size: 11pt;
                    font-weight: bold;
                }

                .system-notice {
                    margin-top: 30px;
                    border-top: 2px solid #000;
                    padding-top: 15px;
                    width: 100%;
                }

                .notice-bold {
                    font-weight: bold;
                    font-size: 10pt;
                    margin: 0 0 5px 0;
                }

                .notice-standard {
                    font-size: 9pt;
                    margin: 0 0 5px 0;
                    font-style: italic;
                }

                .notice-small {
                    font-size: 8pt;
                    color: #555;
                    margin: 0;
                }

                /* Print Styles */
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 10mm; 
                    }
                    
                    body {
                        background: none !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 0;
                        padding: 0;
                    }

                    body * {
                        visibility: hidden;
                    }

                    .receipt-container, .receipt-container * {
                        visibility: visible;
                    }

                    .no-print, .no-print * {
                        display: none !important;
                        visibility: hidden !important;
                    }

                    .receipt-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        padding: 0;
                        margin: 0;
                        background: white;
                        min-height: auto;
                        display: block;
                        width: 100%;
                    }

                    .A4-page {
                        box-shadow: none;
                        border: none;
                        width: 100%;
                        max-width: 190mm; /* A4 width minus margins */
                        height: auto !important;
                        min-height: 0 !important; /* Prevents blank 2nd page */
                        padding: 0;
                        margin: 0 auto;
                        box-sizing: border-box;
                        overflow: hidden;
                    }
                    
                    .document-header {
                        display: block;
                        text-align: center;
                        margin-bottom: 10px;
                        transform: none;
                    }

                    .document-title-wrapper {
                        margin: 15px 0;
                    }

                    .document-title {
                        font-size: 14pt;
                    }

                    .section-block {
                        margin-bottom: 12px;
                    }

                    .section-heading {
                        font-size: 10pt;
                        margin: 0 0 5px 0;
                    }

                    .document-footer {
                        display: block;
                        text-align: center;
                        margin-top: 20px;
                        page-break-inside: avoid;
                    }

                    .emblem-placeholder img {
                        display: block;
                        margin: 0 auto;
                        max-width: 55px;
                    }

                    .signature-area {
                        margin: 0 auto 15px auto;
                    }

                    .info-table td {
                        padding: 4px;
                        font-size: 9.5pt;
                    }
                    
                    .label-cell {
                        background-color: #f8f8f8 !important;
                    }
                    
                    .confirmation-box {
                        background-color: #fafafa !important;
                        padding: 8px;
                        margin: 15px 0;
                        font-size: 10pt;
                    }

                    .notice-bold { font-size: 9pt; }
                    .notice-standard { font-size: 8pt; }
                    .notice-small { font-size: 7.5pt; }
                }
            `}</style>
        </div>
    );
};

const NewApplication = () => {
    const { addApplication, applications, updateApplication, currentUser } = useAppContext();
    const navigate = useNavigate();
    const { id } = useParams();
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const leafletMap = useRef(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [category, setCategory] = useState('OP');
    const [isEditing, setIsEditing] = useState(false);
    const [isAmendedMode, setIsAmendedMode] = useState(false);
    const [unlockedSections, setUnlockedSections] = useState({
        grantees: false, grantors: false, notary: false, property: false, building: false, value: false, attachments: false, other: false, payment: false
    });
    const [amendedFields, setAmendedFields] = useState({});

    const [showAcknowledgment, setShowAcknowledgment] = useState(false);
    const [submittedAppData, setSubmittedAppData] = useState(null);

    const initialFormData = {
        grantees: [{ type: 'Person', name: '', address: '', reference: '', tin: '', contact: '', email: '', companyCategory: 'Private', companyType: '', regDate: '' }],
        grantors: [{ type: 'Person', name: '', address: '', reference: '', tin: '', contact: '', email: '', companyCategory: 'Private', companyType: '', regDate: '' }],
        notary: { name: '', reference: '', barNo: '', tin: '', address: '', contact: '', email: '' },
        property: {
            nature: 'Transfer', address: '', localAuthority: '', town: '', distance: '', crops: '',
            surveyor: '', planNo: '', landType: 'Commercial', lotNo: '', planDate: '',
            extent: { acre: '', rood: '', perch: '', hectare: '' },
            other: '',
            lat: '6.9271', lng: '79.8612', mapUrl: 'https://www.google.com/maps?q=6.9271,79.8612'
        },
        building: {
            type: 'Residential', planNo: '', date: '', unitNo: '', year: '', floorsCount: 1,
            floors: [{ floorNo: 'Ground', area: '' }],
            facilities: '', isRented: false, rent: ''
        },
        value: { purchase: '', marketValue: '', loanDetails: '', cropsValue: '' },
        previousOpinion: { hasOne: false, no: '' },
        payment: { bank: 'Bank of Ceylon', branch: '', amount: '250', receiptNo: '', date: '', receiptFileName: '' },
        otherDetails: '',
        attachments: {}
    };

    const [formData, setFormData] = useState(() => {
        const savedDraft = localStorage.getItem('applicationDraft');
        if (savedDraft && !id) {
            try {
                const parsed = JSON.parse(savedDraft);
                // Sanitize: if attachments was saved as an array (old/corrupted draft format),
                // reset it to an empty object to avoid the mislabeling bug
                if (Array.isArray(parsed.attachments)) {
                    parsed.attachments = {};
                }
                // Also sanitize if attachments has numeric-index keys (array stored as object)
                if (parsed.attachments && typeof parsed.attachments === 'object') {
                    const keys = Object.keys(parsed.attachments);
                    if (keys.length > 0 && keys.every(k => !isNaN(k))) {
                        parsed.attachments = {};
                    }
                }
                return parsed;
            } catch (e) {
                return initialFormData;
            }
        }
        return initialFormData;
    });

    // Debounced draft save with sanitization
    useEffect(() => {
        if (id || isEditing || isAmendedMode) return;

        const saveTimeout = setTimeout(() => {
            try {
                // Create a shallow copy and strip out large Base64 strings to prevent QuotaExceededError and UI hangs
                const sanitizedData = {
                    ...formData,
                    attachments: {},
                    payment: { ...formData.payment, receiptFileData: '' }
                };

                // Only keep filenames
                Object.keys(formData.attachments).forEach(key => {
                    const att = formData.attachments[key];
                    if (att && typeof att === 'object') {
                        sanitizedData.attachments[key] = { name: att.name, fileName: att.fileName, type: att.type, size: att.size };
                    } else if (att) {
                        sanitizedData.attachments[key] = att;
                    }
                });

                localStorage.setItem('applicationDraft', JSON.stringify(sanitizedData));
            } catch (e) {
                console.warn('Failed to save draft to localStorage:', e);
            }
        }, 1500); // 1.5 second debounce

        return () => clearTimeout(saveTimeout);
    }, [formData, id, isEditing, isAmendedMode]);

    useEffect(() => {
        if (id && Array.isArray(applications)) {
            const existingApp = applications.find(a => a.id?.toString() === id.toString());
            if (existingApp) {
                // Block access if file is permanently closed or rejected without resubmission rights
                if (existingApp.status === 'CLOSED') {
                    alert('This file is permanently closed and cannot be edited.');
                    navigate('/external');
                    return;
                }
                if (existingApp.status === 'REJECTED' && !existingApp.allowResubmission) {
                    alert('This application has been rejected. Resubmission has not been permitted.');
                    navigate('/external');
                    return;
                }

                setIsEditing(true);
                setCategory(existingApp.category);
                if (existingApp.fullData) {
                    let dataToSet = { ...existingApp.fullData };
                    if (Array.isArray(dataToSet.attachments)) {
                        // Array of attachment objects from the DB — convert to label-keyed object
                        const attObj = {};
                        dataToSet.attachments.forEach(att => {
                            // Only include real attachment objects (skip label-only string entries)
                            if (att && typeof att === 'object' && att.name && att.fileName) {
                                attObj[att.name] = { fileName: att.fileName, name: att.name, url: att.url };
                            }
                        });
                        dataToSet.attachments = attObj;
                    } else if (dataToSet.attachments && typeof dataToSet.attachments === 'object') {
                        // Sanitize object format: remove numeric-indexed entries (corrupted array-as-object)
                        const keys = Object.keys(dataToSet.attachments);
                        if (keys.length > 0 && keys.every(k => !isNaN(k))) {
                            dataToSet.attachments = {};
                        }
                    }
                    setFormData(prev => ({
                        ...prev, ...dataToSet,
                        property: { ...prev.property, ...dataToSet.property },
                        building: { ...prev.building, ...dataToSet.building },
                        value: { ...prev.value, ...dataToSet.value },
                        payment: { ...prev.payment, ...dataToSet.payment }
                    }));
                }
                if (existingApp.status === 'AMENDED' || existingApp.status === 'REJECTED' || existingApp.status === 'INFORMATION_REQUESTED') {
                    setIsAmendedMode(true);
                    if (existingApp.fullData?.amendments && Array.isArray(existingApp.fullData.amendments)) {
                        const newUnlocked = { ...unlockedSections };
                        existingApp.fullData.amendments.forEach(section => {
                            if (newUnlocked.hasOwnProperty(section)) { newUnlocked[section] = true; }
                        });
                        setUnlockedSections(newUnlocked);
                        if (existingApp.fullData.amendedFields) {
                            setAmendedFields(existingApp.fullData.amendedFields);
                        }
                    }
                }
            }
        }
    }, [id, applications]);

    useEffect(() => {
        // Only initialize map if we are on step 3
        if (currentStep !== 3) return;
        if (!mapRef.current || leafletMap.current) return;
        const L = window.L;
        if (!L) return;
        const initialLat = parseFloat(formData.property.lat) || 6.9271;
        const initialLng = parseFloat(formData.property.lng) || 79.8612;

        leafletMap.current = L.map(mapRef.current).setView([initialLat, initialLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(leafletMap.current);
        markerRef.current = L.marker([initialLat, initialLng], { draggable: !isAmendedMode || unlockedSections.property }).addTo(leafletMap.current);

        markerRef.current.on('dragend', function (e) {
            const position = markerRef.current.getLatLng();
            setFormData(prev => ({
                ...prev, property: {
                    ...prev.property, lat: position.lat.toFixed(6), lng: position.lng.toFixed(6),
                    mapUrl: `https://www.google.com/maps?q=${position.lat.toFixed(6)},${position.lng.toFixed(6)}`
                }
            }));
        });

        leafletMap.current.on('click', function (e) {
            if (isAmendedMode && !unlockedSections.property) return;
            const { lat, lng } = e.latlng;
            markerRef.current.setLatLng([lat, lng]);
            setFormData(prev => ({
                ...prev, property: {
                    ...prev.property, lat: lat.toFixed(6), lng: lng.toFixed(6),
                    mapUrl: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`
                }
            }));
        });

        return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
    }, [isAmendedMode, unlockedSections.property, currentStep]);

    const updateMapPosition = (lat, lng) => {
        if (leafletMap.current && markerRef.current && !isNaN(lat) && !isNaN(lng)) {
            const newPos = [parseFloat(lat), parseFloat(lng)];
            leafletMap.current.setView(newPos);
            markerRef.current.setLatLng(newPos);
        }
    };

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    const handleAddressSearch = async () => {
        if (!searchQuery.trim() || (isAmendedMode && !unlockedSections.property)) return;
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);
                updateMapPosition(lat, lng);
                setFormData(prev => ({
                    ...prev, property: {
                        ...prev.property, lat: lat.toFixed(6), lng: lng.toFixed(6),
                        mapUrl: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`
                    }
                }));
            } else { alert('Location not found in database.'); }
        } catch (err) { console.error('Search error:', err); } finally { setIsSearching(false); }
    };

    const addEntity = React.useCallback((field) => {
        if (isAmendedMode && !unlockedSections[field]) return;
        const newEntity = { type: 'Person', name: '', address: '', reference: '', tin: '', contact: '', email: '', companyCategory: 'Private', companyType: '', regDate: '' };
        setFormData(prev => ({ ...prev, [field]: [...prev[field], newEntity] }));
    }, [isAmendedMode, unlockedSections]);

    const removeEntity = React.useCallback((field, index) => {
        if (isAmendedMode && !unlockedSections[field]) return;
        setFormData(prev => {
            const list = [...prev[field]];
            list.splice(index, 1);
            return { ...prev, [field]: list };
        });
    }, [isAmendedMode, unlockedSections]);

    const updateEntity = React.useCallback((field, index, key, value) => {
        if (isAmendedMode && !unlockedSections[field]) return;
        setFormData(prev => {
            const list = [...prev[field]];
            list[index] = { ...list[index], [key]: value };
            return { ...prev, [field]: list };
        });
    }, [isAmendedMode, unlockedSections]);

    const addFloor = React.useCallback(() => {
        if (isAmendedMode && !unlockedSections.building) return;
        setFormData(prev => ({ ...prev, building: { ...prev.building, floors: [...prev.building.floors, { floorNo: '', area: '' }] } }));
    }, [isAmendedMode, unlockedSections.building]);

    const updateFloor = React.useCallback((index, key, value) => {
        if (isAmendedMode && !unlockedSections.building) return;
        setFormData(prev => {
            const floors = [...prev.building.floors];
            floors[index] = { ...floors[index], [key]: value };
            return { ...prev, building: { ...prev.building, floors } };
        });
    }, [isAmendedMode, unlockedSections.building]);

    const validateStep = () => {
        // Very basic validation - HTML5 required attributes will handle the real validation on Next
        // We ensure forms try to submit correctly
        return true;
    };

    const nextStep = () => {
        const form = document.getElementById('wizard-form');
        if (form.reportValidity()) {
            if (currentStep < 6) setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const existingApp = isEditing ? applications.find(a => a.id === parseInt(id)) : null;

        const finalFormData = { ...formData };
        if (existingApp?.fullData?.amendments) {
            finalFormData.amendments = existingApp.fullData.amendments;
        }

        const appPayload = {
            category, fullData: finalFormData, region: formData.property.localAuthority,
            tempFileNo: existingApp ? existingApp.tempFileNo : '',
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: isAmendedMode ? 'RESUBMITTED' : 'RECEIVED'
        };

        if (isEditing && existingApp) {
            const now = new Date().toLocaleString('en-GB');
            const action = isAmendedMode ? 'Application Amended & Resubmitted' : 'Application Updated';
            appPayload.activityLog = [
                ...(existingApp.activityLog || []),
                {
                    action: action,
                    date: now,
                    user: currentUser?.name || 'External User',
                    comment: isAmendedMode ? 'Corrections submitted as requested' : 'Application data updated'
                }
            ];
            appPayload.lastActionDate = now;
            appPayload.lastActionComment = action;
        }

        let finalAppData = appPayload;
        try {
            if (isEditing) {
                await updateApplication(parseInt(id), appPayload);
                finalAppData = { ...existingApp, ...appPayload };
            } else {
                const newApp = await addApplication(appPayload);
                finalAppData = newApp || appPayload;
            }
        } catch (err) {
            console.error('Submission error:', err);
            alert('Failed to submit application. Please try again.');
            return;
        }

        localStorage.removeItem('applicationDraft');
        setSubmittedAppData(finalAppData);
        setShowAcknowledgment(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const isDisabled = (sectionKey, fieldKey) => {
        if (!isAmendedMode) return false;
        if (unlockedSections[sectionKey]) return false;
        if (fieldKey && amendedFields[fieldKey]) return false;
        return true;
    };

    const getAttachments = () => {
        if (category === 'OP') return [
            'Draft Deed', 'Copy of Previous Deed', 'Survey Plan for Property',
            'Photocopy of Building Plan', 'Photographs of the Building',
            'Photographs of the Land', 'Rough Sketch to Approach Property',
            'Report on Assessment Rate', 'Certified Photocopy of Bank Valuation Report',
            'Photocopy of Grantee NIC', 'Photocopy of Grantor NIC',
            'Form 20 / Directory of Directors',
        ];
        if (category === 'FI') return [
            'Draft Deed', 'Copy of Previous Deed', 'Certified Photocopy of Bank Valuation Report',
            'Survey Plan for Property', 'Photocopy of Building Plan',
            'Photographs of the Building', 'Photographs of the Land',
            'Rough Sketch to Approach Property', 'Report on Assessment Rate',
            'Photocopy of Grantee NIC', 'Photocopy of Grantor NIC',
            'Form 20 / Directory of Directors',
        ];
        return [
            'Photocopy of the Deed to be Endorsed', 'Photocopy of the Receipt of Stamp Duty Paid',
            'Photocopy of the Previous Deed', 'Photocopy of the Survey Plan of the Property',
            'Rough Sketch to Approach Property', 'Photocopy of Building Plan',
            'Photographs of the Building', 'Photographs of the Land',
            'Report on Assessment Rate', 'Certified Photocopy of Bank Valuation Report',
        ];
    };

    if (showAcknowledgment && submittedAppData) {
        return (
            <div className="dashboard-view dashboard-ack" style={{ minHeight: '100vh', overflowY: 'auto', background: '#f8fafc', padding: '1rem', display: 'block' }}>
                <AcknowledgmentReceipt appData={submittedAppData} onBack={() => navigate('/external')} onPrint={() => window.print()} />
            </div>
        );
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="wizard-card step-card">
                        <h2>Select Application Type</h2>
                        <p className="step-desc">Choose the appropriate category for your application submission.</p>
                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <div className={`type-selector large ${isAmendedMode ? 'pointer-events-none' : ''}`}>
                                <div className={`type-tab ${category === 'OP' ? 'active' : ''}`} onClick={() => !isAmendedMode && setCategory('OP')}>
                                    <strong>Opinion (OP)</strong>
                                    <span>Request an official opinion</span>
                                </div>
                                <div className={`type-tab ${category === 'FI' ? 'active' : ''}`} onClick={() => !isAmendedMode && setCategory('FI')}>
                                    <strong>Financial (FI)</strong>
                                    <span>Financial Instrument submission</span>
                                </div>
                                <div className={`type-tab ${category === 'RT' ? 'active' : ''}`} onClick={() => !isAmendedMode && setCategory('RT')}>
                                    <strong>Rate Tax (RT)</strong>
                                    <span>Rate Tax documentation</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="wizard-card step-card">
                        <h2>Applicant Information</h2>
                        <p className="step-desc">Enter details for Grantees, Grantors, and the representing Notary/Lawyer.</p>

                        <EntitySection title="Details of Grantee" field="grantees" formData={formData} updateEntity={updateEntity} removeEntity={removeEntity} addEntity={addEntity} isDisabled={isDisabled} isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} setUnlockedSections={setUnlockedSections} />
                        <EntitySection title="Details of Grantor" field="grantors" formData={formData} updateEntity={updateEntity} removeEntity={removeEntity} addEntity={addEntity} isDisabled={isDisabled} isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} setUnlockedSections={setUnlockedSections} />

                        <div className="card-section">
                            <SectionTitle title="Details of Notary/Lawyer" sectionKey="notary" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} amendedFields={amendedFields} />
                            <div className="form-grid" style={{ opacity: isDisabled('notary') ? 0.7 : 1 }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Name in Full {amendedFields?.['notary.name'] && '🔓'}</label><input type="text" value={formData.notary.name} disabled={isDisabled('notary', 'notary.name')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, name: e.target.value } })} required /></div>
                                <div className="form-group"><label>NIC/Passport No {amendedFields?.['notary.reference'] && '🔓'}</label><input type="text" value={formData.notary.reference} disabled={isDisabled('notary', 'notary.reference')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, reference: e.target.value } })} required /></div>
                                <div className="form-group"><label>Bar Association No {amendedFields?.['notary.barNo'] && '🔓'}</label><input type="text" value={formData.notary.barNo} disabled={isDisabled('notary', 'notary.barNo')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, barNo: e.target.value } })} required /></div>
                                <div className="form-group"><label>Taxpayer Identification Number (TIN) {amendedFields?.['notary.tin'] && '🔓'}</label><input type="text" pattern="\d{9}" title="TIN must be a 9-digit number" value={formData.notary.tin} disabled={isDisabled('notary', 'notary.tin')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, tin: e.target.value } })} /></div>
                                <div className="form-group"><label>Contact {amendedFields?.['notary.contact'] && '🔓'}</label><input type="text" value={formData.notary.contact} disabled={isDisabled('notary', 'notary.contact')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, contact: e.target.value } })} /></div>
                                <div className="form-group"><label>Email {amendedFields?.['notary.email'] && '🔓'}</label><input type="email" value={formData.notary.email} disabled={isDisabled('notary', 'notary.email')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, email: e.target.value } })} /></div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Address {amendedFields?.['notary.address'] && '🔓'}</label><input type="text" value={formData.notary.address} disabled={isDisabled('notary', 'notary.address')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, address: e.target.value } })} /></div>
                            </div>
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="wizard-card step-card">
                        <h2>Property & Land Details</h2>
                        <p className="step-desc">Enter the location, extent, and building information for the subject property.</p>

                        <div className="card-section">
                            <SectionTitle title="Details of Property" sectionKey="property" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} amendedFields={amendedFields} />
                            <div className="form-grid" style={{ opacity: isDisabled('property') ? 0.7 : 1 }}>
                                <div className="form-group"><label>Nature: {amendedFields?.['property.nature'] && '🔓'}</label>
                                    <select value={formData.property.nature} disabled={isDisabled('property', 'property.nature')} onChange={e => setFormData({ ...formData, property: { ...formData.property, nature: e.target.value } })} required>
                                        <option value="Transfer">Transfer</option>
                                        <option value="Gift">Gift</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Local Authority {amendedFields?.['property.localAuthority'] && '🔓'}</label><input type="text" value={formData.property.localAuthority} disabled={isDisabled('property', 'property.localAuthority')} onChange={e => setFormData({ ...formData, property: { ...formData.property, localAuthority: e.target.value } })} required /></div>
                                <div className="form-group"><label>Town / Post Office {amendedFields?.['property.town'] && '🔓'}</label><input type="text" value={formData.property.town} disabled={isDisabled('property', 'property.town')} onChange={e => setFormData({ ...formData, property: { ...formData.property, town: e.target.value } })} required /></div>
                                <div className="form-group"><label>Address {amendedFields?.['property.address'] && '🔓'}</label><input type="text" value={formData.property.address} disabled={isDisabled('property', 'property.address')} onChange={e => setFormData({ ...formData, property: { ...formData.property, address: e.target.value } })} required /></div>
                                <div className="form-group"><label>Distance (km) {amendedFields?.['property.distance'] && '🔓'}</label><input type="text" value={formData.property.distance} disabled={isDisabled('property', 'property.distance')} onChange={e => setFormData({ ...formData, property: { ...formData.property, distance: e.target.value } })} /></div>
                                <div className="form-group"><label>Land Type {amendedFields?.['property.landType'] && '🔓'}</label>
                                    <select value={formData.property.landType} disabled={isDisabled('property', 'property.landType')} onChange={e => setFormData({ ...formData, property: { ...formData.property, landType: e.target.value } })}>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Residential">Residential</option>
                                        <option value="Agricultural">Agricultural</option>
                                        <option value="Industrial">Industrial</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Surveyor {amendedFields?.['property.surveyor'] && '🔓'}</label><input type="text" value={formData.property.surveyor} disabled={isDisabled('property', 'property.surveyor')} onChange={e => setFormData({ ...formData, property: { ...formData.property, surveyor: e.target.value } })} /></div>
                                <div className="form-group"><label>Plan No {amendedFields?.['property.planNo'] && '🔓'}</label><input type="text" value={formData.property.planNo} disabled={isDisabled('property', 'property.planNo')} onChange={e => setFormData({ ...formData, property: { ...formData.property, planNo: e.target.value } })} /></div>
                                <div className="form-group"><label>Plan Date {amendedFields?.['property.planDate'] && '🔓'}</label><input type="date" value={formData.property.planDate} disabled={isDisabled('property', 'property.planDate')} onChange={e => setFormData({ ...formData, property: { ...formData.property, planDate: e.target.value } })} /></div>
                                <div className="form-group"><label>Lot No {amendedFields?.['property.lotNo'] && '🔓'}</label><input type="text" value={formData.property.lotNo} disabled={isDisabled('property', 'property.lotNo')} onChange={e => setFormData({ ...formData, property: { ...formData.property, lotNo: e.target.value } })} /></div>
                            </div>

                            <div className="nested-section" style={{ marginTop: '1rem', background: '#f0f4f8', padding: '1.5rem', borderRadius: '12px', border: '1px solid #d1d9e6', opacity: isDisabled('property') ? 0.7 : 1 }}>
                                <strong>Property Location & Coordinates</strong>
                                <div style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0', alignItems: 'flex-start' }}>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <input type="text" placeholder="Search address..." value={searchQuery} disabled={isDisabled('property')} onChange={(e) => setSearchQuery(e.target.value)} />
                                    </div>
                                    <button type="button" className="action-btn" onClick={handleAddressSearch} disabled={isSearching || isDisabled('property')} style={{ marginTop: '0.2rem', padding: '0.8rem 1.5rem', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px' }}>Search</button>
                                </div>
                                <div ref={mapRef} style={{ height: '300px', background: '#ddd', borderRadius: '8px', marginBottom: '1rem' }}></div>

                                <div className="form-grid" style={{ marginTop: '1rem' }}>
                                    <div className="form-group"><label>Latitude</label><input type="text" value={formData.property.lat} readOnly style={{ background: '#eee' }} /></div>
                                    <div className="form-group"><label>Longitude</label><input type="text" value={formData.property.lng} readOnly style={{ background: '#eee' }} /></div>
                                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                        <label>Google Maps URL</label>
                                        <input type="text" value={formData.property.mapUrl} readOnly style={{ background: '#eee', color: '#1565c0', textDecoration: 'underline' }} />
                                    </div>
                                </div>
                            </div>

                            <SectionTitle title="Extent of Land" sectionKey="property" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} amendedFields={amendedFields} />
                            <div className="form-grid" style={{ opacity: isDisabled('property') ? 0.7 : 1 }}>
                                <div className="form-group"><label>Acre {amendedFields?.['property.extent.acre'] && '🔓'}</label><input type="number" value={formData.property.extent.acre} disabled={isDisabled('property', 'property.extent.acre')} onChange={e => setFormData({ ...formData, property: { ...formData.property, extent: { ...formData.property.extent, acre: e.target.value } } })} /></div>
                                <div className="form-group"><label>Rood {amendedFields?.['property.extent.rood'] && '🔓'}</label><input type="number" value={formData.property.extent.rood} disabled={isDisabled('property', 'property.extent.rood')} onChange={e => setFormData({ ...formData, property: { ...formData.property, extent: { ...formData.property.extent, rood: e.target.value } } })} /></div>
                                <div className="form-group"><label>Perch {amendedFields?.['property.extent.perch'] && '🔓'}</label><input type="number" value={formData.property.extent.perch} disabled={isDisabled('property', 'property.extent.perch')} onChange={e => setFormData({ ...formData, property: { ...formData.property, extent: { ...formData.property.extent, perch: e.target.value } } })} /></div>
                                <div className="form-group"><label>Hectare {amendedFields?.['property.extent.hectare'] && '🔓'}</label><input type="number" step="0.0001" value={formData.property.extent.hectare} disabled={isDisabled('property', 'property.extent.hectare')} onChange={e => setFormData({ ...formData, property: { ...formData.property, extent: { ...formData.property.extent, hectare: e.target.value } } })} /></div>
                            </div>
                        </div>

                        <div className="card-section">
                            <SectionTitle title="Details of Building" sectionKey="building" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} amendedFields={amendedFields} />
                            <div className="form-grid" style={{ opacity: isDisabled('building') ? 0.7 : 1 }}>
                                <div className="form-group"><label>Building Type {amendedFields?.['building.type'] && '🔓'}</label>
                                    <select value={formData.building.type} disabled={isDisabled('building', 'building.type')} onChange={e => setFormData({ ...formData, building: { ...formData.building, type: e.target.value } })}>
                                        <option value="Residential">Residential</option>
                                        <option value="Commercial">Commercial</option>
                                        <option value="Industrial">Industrial</option>
                                        <option value="Agricultural">Agricultural</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group"><label>Building Plan No {amendedFields?.['building.planNo'] && '🔓'}</label><input type="text" value={formData.building.planNo} disabled={isDisabled('building', 'building.planNo')} onChange={e => setFormData({ ...formData, building: { ...formData.building, planNo: e.target.value } })} /></div>
                                <div className="form-group"><label>Unit No {amendedFields?.['building.unitNo'] && '🔓'}</label><input type="text" value={formData.building.unitNo} disabled={isDisabled('building', 'building.unitNo')} onChange={e => setFormData({ ...formData, building: { ...formData.building, unitNo: e.target.value } })} /></div>
                                <div className="form-group"><label>Construction Year {amendedFields?.['building.year'] && '🔓'}</label><input type="text" value={formData.building.year} disabled={isDisabled('building', 'building.year')} onChange={e => setFormData({ ...formData, building: { ...formData.building, year: e.target.value } })} /></div>
                                <div className="form-group"><label>Facilities {amendedFields?.['building.facilities'] && '🔓'}</label><input type="text" placeholder="Water, Electricity, etc." value={formData.building.facilities} disabled={isDisabled('building', 'building.facilities')} onChange={e => setFormData({ ...formData, building: { ...formData.building, facilities: e.target.value } })} /></div>
                            </div>

                            <div className="nested-section" style={{ marginTop: '1rem', background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee', opacity: isDisabled('building') ? 0.7 : 1 }}>
                                <strong>Floor Details</strong>
                                {formData.building?.floors?.map((floor, idx) => (
                                    <div key={idx} className="form-grid" style={{ marginTop: '1rem' }}>
                                        <div className="form-group"><label>Floor No / Name {amendedFields?.[`building.floors.${idx}.floorNo`] && '🔓'}</label><input type="text" value={floor.floorNo} disabled={isDisabled('building', `building.floors.${idx}.floorNo`)} onChange={e => updateFloor(idx, 'floorNo', e.target.value)} /></div>
                                        <div className="form-group"><label>Floor Area (Sq. Ft.) {amendedFields?.[`building.floors.${idx}.area`] && '🔓'}</label><input type="number" value={floor.area} disabled={isDisabled('building', `building.floors.${idx}.area`)} onChange={e => updateFloor(idx, 'area', e.target.value)} /></div>
                                    </div>
                                ))}
                                {!isDisabled('building') && <button type="button" className="action-btn" onClick={addFloor}>+ Add Floor</button>}
                            </div>

                            <SectionTitle title="Rental Details" sectionKey="building" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} amendedFields={amendedFields} />
                            <div className="form-grid" style={{ opacity: isDisabled('building') ? 0.7 : 1 }}>
                                <div className="form-group"><label>Is Property Rented? {amendedFields?.['building.isRented'] && '🔓'}</label>
                                    <select value={formData.building.isRented} disabled={isDisabled('building', 'building.isRented')} onChange={e => setFormData({ ...formData, building: { ...formData.building, isRented: e.target.value === 'true' } })}>
                                        <option value="false">No</option>
                                        <option value="true">Yes</option>
                                    </select>
                                </div>
                                {formData.building.isRented && <div className="form-group"><label>Monthly Rent (LKR) {amendedFields?.['building.rent'] && '🔓'}</label><input type="number" value={formData.building.rent} disabled={isDisabled('building', 'building.rent')} onChange={e => setFormData({ ...formData, building: { ...formData.building, rent: e.target.value } })} /></div>}
                            </div>
                        </div>
                    </motion.div>
                );
            case 4:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="wizard-card step-card">
                        <h2>Transaction Details</h2>
                        <p className="step-desc">Enter the valuation and financial specifics of the transaction.</p>

                        <div className="card-section">
                            <SectionTitle title="Transaction Values" sectionKey="value" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} amendedFields={amendedFields} />
                            <div className="form-grid" style={{ opacity: isDisabled('value') ? 0.7 : 1 }}>
                                <div className="form-group"><label>Consideration (LKR) {amendedFields?.['value.purchase'] && '🔓'}</label><input type="number" value={formData.value.purchase} disabled={isDisabled('value', 'value.purchase')} onChange={e => setFormData({ ...formData, value: { ...formData.value, purchase: e.target.value } })} /></div>
                                <div className="form-group"><label>Market Value (LKR) {amendedFields?.['value.marketValue'] && '🔓'}</label><input type="number" value={formData.value.marketValue} disabled={isDisabled('value', 'value.marketValue')} onChange={e => setFormData({ ...formData, value: { ...formData.value, marketValue: e.target.value } })} /></div>
                                <div className="form-group"><label>Crops Value (LKR) {amendedFields?.['value.cropsValue'] && '🔓'}</label><input type="number" value={formData.value.cropsValue} disabled={isDisabled('value', 'value.cropsValue')} onChange={e => setFormData({ ...formData, value: { ...formData.value, cropsValue: e.target.value } })} /></div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Loan Details {amendedFields?.['value.loanDetails'] && '🔓'}</label><textarea value={formData.value.loanDetails} disabled={isDisabled('value', 'value.loanDetails')} onChange={e => setFormData({ ...formData, value: { ...formData.value, loanDetails: e.target.value } })} /></div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Previous Opinion Obtained? {amendedFields?.['value.previousOpinion'] && '🔓'}</label>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                        <input type="checkbox" style={{ width: '22px', height: '22px', cursor: 'pointer' }} checked={formData.previousOpinion.hasOne} disabled={isDisabled('value', 'value.previousOpinion')} onChange={e => setFormData({ ...formData, previousOpinion: { ...formData.previousOpinion, hasOne: e.target.checked } })} />
                                        {formData.previousOpinion.hasOne && <input type="text" placeholder="Ref No" style={{ flex: 1, padding: '0.8rem' }} value={formData.previousOpinion.no} disabled={isDisabled('value', 'value.previousOpinion')} onChange={e => setFormData({ ...formData, previousOpinion: { ...formData.previousOpinion, no: e.target.value } })} />}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {category === 'OP' && (
                            <div className="card-section">
                                <SectionTitle title="Opinion Fee Payment" sectionKey="payment" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} amendedFields={amendedFields} />
                                <div className="nested-section" style={{ background: '#e3f2fd', border: '1px solid #bbdefb', opacity: isDisabled('payment') ? 0.7 : 1 }}>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>Paid Bank {amendedFields?.['payment.bank'] && '🔓'}</label>
                                            <select value={formData.payment.bank} disabled={isDisabled('payment', 'payment.bank')} onChange={e => setFormData({ ...formData, payment: { ...formData.payment, bank: e.target.value } })}>
                                                <option value="Bank of Ceylon">Bank of Ceylon</option>
                                                <option value="People's Bank">People's Bank</option>
                                                <option value="Other Bank">Other Bank</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Branch {amendedFields?.['payment.branch'] && '🔓'}</label>
                                            <input type="text" placeholder="Branch" value={formData.payment.branch} disabled={isDisabled('payment', 'payment.branch')} onChange={e => setFormData({ ...formData, payment: { ...formData.payment, branch: e.target.value } })} required={category === 'OP'} />
                                        </div>
                                        <div className="form-group"><label>Reference No {amendedFields?.['payment.receiptNo'] && '🔓'}</label><input type="text" value={formData.payment.receiptNo} disabled={isDisabled('payment', 'payment.receiptNo')} onChange={e => setFormData({ ...formData, payment: { ...formData.payment, receiptNo: e.target.value } })} placeholder="Ref No" required={category === 'OP'} /></div>
                                        <div className="form-group"><label>Payment Date {amendedFields?.['payment.date'] && '🔓'}</label><input type="date" value={formData.payment.date} disabled={isDisabled('payment', 'payment.date')} onChange={e => setFormData({ ...formData, payment: { ...formData.payment, date: e.target.value } })} required={category === 'OP'} /></div>
                                        <div className="form-group"><label>Fee Amount (LKR)</label><input type="text" value="250/=" readOnly style={{ background: '#eee', fontWeight: 'bold' }} /></div>
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <FileUploadField label="Payment Receipt {amendedFields?.['payment.receiptFileName'] && '🔓'}" fileName={formData.payment.receiptFileName} disabled={isDisabled('payment', 'payment.receiptFileName')} required={category === 'OP' && !isEditing} onFileSelect={file => setFormData({ ...formData, payment: { ...formData.payment, receiptFileName: file.name, receiptFileData: file.data } })} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                );
            case 5:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="wizard-card step-card">
                        <h2>Document Uploads & Extras</h2>
                        <p className="step-desc">Attach all necessary evidential documents and any additional notes.</p>

                        <div className="card-section">
                            <SectionTitle title="Other Details" sectionKey="other" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} amendedFields={amendedFields} />
                            <div className="form-grid" style={{ opacity: isDisabled('other') ? 0.7 : 1 }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label>Any other relevant details regarding this application {amendedFields?.['otherDetails'] && '🔓'}</label>
                                    <textarea value={formData.otherDetails} disabled={isDisabled('other', 'otherDetails')} onChange={e => setFormData({ ...formData, otherDetails: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="card-section">
                            <SectionTitle title="Document Attachments" sectionKey="attachments" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} amendedFields={amendedFields} />
                            <div className="form-grid" style={{ opacity: isDisabled('attachments') ? 0.7 : 1 }}>
                                {getAttachments().map(doc => (
                                    <FileUploadField key={doc} label={<>{doc} {amendedFields?.[`attachments.${doc}`] && '🔓'}</>} fileName={formData.attachments[doc]} disabled={isDisabled('attachments', `attachments.${doc}`)} onFileSelect={file => {
                                        setFormData(prev => {
                                            const newAttachments = { ...prev.attachments, [doc]: file };
                                            return { ...prev, attachments: newAttachments };
                                        });
                                    }} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            case 6:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="wizard-card step-card review-step">
                        <h2>Review & Submit</h2>
                        <p className="step-desc">Please verify all the information before final submission.</p>

                        <div className="review-summary">
                            <div className="review-block">
                                <h3>Application Type</h3>
                                <div className="review-grid">
                                    <div className="review-item"><span>Category</span><strong>{category === 'OP' ? 'Opinion' : category === 'FI' ? 'Financial Instrument' : 'Rate Tax'}</strong></div>
                                </div>
                            </div>

                            <div className="review-block">
                                <h3>Primary Grantee</h3>
                                <div className="review-grid">
                                    <div className="review-item"><span>Name</span><strong>{formData.grantees[0]?.name || 'N/A'}</strong></div>
                                    <div className="review-item"><span>NIC/Ref</span><strong>{formData.grantees[0]?.reference || 'N/A'}</strong></div>
                                </div>
                            </div>

                            <div className="review-block">
                                <h3>Property Details</h3>
                                <div className="review-grid">
                                    <div className="review-item"><span>Address</span><strong>{formData.property.address || 'N/A'}</strong></div>
                                    <div className="review-item"><span>Local Authority</span><strong>{formData.property.localAuthority || 'N/A'}</strong></div>
                                </div>
                            </div>

                            <div className="review-block">
                                <h3>Notary / Lawyer</h3>
                                <div className="review-grid">
                                    <div className="review-item"><span>Name</span><strong>{formData.notary.name || 'N/A'}</strong></div>
                                    <div className="review-item"><span>Bar No</span><strong>{formData.notary.barNo || 'N/A'}</strong></div>
                                </div>
                            </div>

                            <div className="review-block">
                                <h3>Declarations</h3>
                                <div className="declare-checkbox" style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', background: '#e8f5e9', padding: '1rem', borderRadius: '8px' }}>
                                        <input type="checkbox" required style={{ width: '20px', height: '20px' }} />
                                        <span>I hereby declare that all the information provided above is true and correct to the best of my knowledge. I understand that submitting false documents is a punishable offense.</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="dashboard-view smart-wizard-container">
            <div className="content-header wizard-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <h1>{isAmendedMode ? 'Amend Application' : isEditing ? 'Edit Application' : 'New Smart Application'}</h1>
                    {!isEditing && <span className="draft-badge">Draft Auto-Saved</span>}
                </div>
            </div>

            {isAmendedMode && (
                <div className="amendment-warning">
                    <h4>⚠️ Application Returned for Amendment</h4>
                    {(() => {
                        const app = Array.isArray(applications) && applications.find(a => a.id?.toString() === id?.toString());
                        const comment = app?.fullData?.amendmentComment;
                        if (!comment) return null;
                        return (
                            <div className="assessor-note">
                                <p className="note-title">💬 Assessor's Instructions:</p>
                                <p className="note-text">{comment}</p>
                            </div>
                        );
                    })()}
                    <p style={{ fontSize: '0.9rem', marginBottom: '0', marginTop: '1rem' }}>Please review all steps. Only sections marked by the assessor have been automatically unlocked for your correction.</p>
                </div>
            )}

            <div className="stepper-wrapper">
                <div className="stepper">
                    {steps.map((step) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;
                        return (
                            <div key={step.id} className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`} onClick={() => setCurrentStep(step.id)}>
                                <div className="step-circle">
                                    {isCompleted ? <FaCheck /> : <Icon />}
                                </div>
                                <div className="step-title">{step.title}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}></div>
                </div>
            </div>

            <div className="wizard-form-container">
                <form id="wizard-form" onSubmit={handleSubmit}>
                    <AnimatePresence mode='wait'>
                        {renderStepContent()}
                    </AnimatePresence>

                    <div className="wizard-actions">
                        <button type="button" className="action-btn" onClick={() => navigate('/external')} style={{ marginRight: 'auto', background: 'transparent', color: '#666', border: 'none' }}>
                            Cancel
                        </button>

                        <div className="navigation-buttons">
                            {currentStep > 1 && (
                                <button type="button" className="btn-secondary" onClick={prevStep}>
                                    &larr; Back
                                </button>
                            )}

                            {currentStep < steps.length ? (
                                <button type="button" className="btn-primary" onClick={nextStep}>
                                    Next Step &rarr;
                                </button>
                            ) : (
                                <button type="submit" className="btn-submit">
                                    {isAmendedMode ? 'Resubmit Amended File' : 'Submit Final Application'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewApplication;
