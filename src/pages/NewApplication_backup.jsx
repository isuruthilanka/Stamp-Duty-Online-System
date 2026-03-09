import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../AppContext';

// Helper Components defined outside to prevent focus loss on rerender
const SectionTitle = ({ title, sectionKey, isAmendedMode, unlockedSections }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>{title}</h3>
        {isAmendedMode && sectionKey && unlockedSections[sectionKey] && (
            <span style={{
                padding: '0.4rem 1rem',
                fontSize: '0.75rem',
                borderRadius: '20px',
                background: '#e8f5e9',
                color: '#2e7d32',
                fontWeight: 700,
                border: '1px solid #2e7d32'
            }}>
                🔓 Unlocked by Assessor for Correction
            </span>
        )}
    </div>
);

const EntitySection = ({ title, field, sectionKey, formData, updateEntity, removeEntity, addEntity, isDisabled, isAmendedMode, unlockedSections, setUnlockedSections }) => (
    <>
        <SectionTitle
            title={title}
            sectionKey={sectionKey || field}
            isAmendedMode={isAmendedMode}
            unlockedSections={unlockedSections}
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
                            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Name in Full</label><input type="text" value={entity.name} onChange={e => updateEntity(field, idx, 'name', e.target.value)} disabled={isDisabled(sectionKey || field)} required /></div>
                            <div className="form-group"><label>NIC/Passport</label><input type="text" value={entity.reference} onChange={e => updateEntity(field, idx, 'reference', e.target.value)} disabled={isDisabled(sectionKey || field)} required /></div>
                            <div className="form-group"><label>Contact</label><input type="text" value={entity.contact} onChange={e => updateEntity(field, idx, 'contact', e.target.value)} disabled={isDisabled(sectionKey || field)} /></div>
                            <div className="form-group"><label>Email</label><input type="email" value={entity.email} onChange={e => updateEntity(field, idx, 'email', e.target.value)} disabled={isDisabled(sectionKey || field)} /></div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Address</label><input type="text" value={entity.address} onChange={e => updateEntity(field, idx, 'address', e.target.value)} disabled={isDisabled(sectionKey || field)} required /></div>
                        </>
                    ) : (
                        <>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Company Name</label><input type="text" value={entity.name} onChange={e => updateEntity(field, idx, 'name', e.target.value)} disabled={isDisabled(sectionKey || field)} required /></div>
                            <div className="form-group"><label>Registration No</label><input type="text" value={entity.reference} onChange={e => updateEntity(field, idx, 'reference', e.target.value)} disabled={isDisabled(sectionKey || field)} required /></div>
                            <div className="form-group"><label>Category</label>
                                <select value={entity.companyCategory} onChange={e => updateEntity(field, idx, 'companyCategory', e.target.value)} disabled={isDisabled(sectionKey || field)}>
                                    <option value="Private">Private</option>
                                    <option value="Public">Public</option>
                                    <option value="Government">Government</option>
                                    <option value="Bank">Bank</option>
                                    <option value="Finance">Finance Company</option>
                                </select>
                            </div>
                            <div className="form-group"><label>Registration Date</label><input type="date" value={entity.regDate} onChange={e => updateEntity(field, idx, 'regDate', e.target.value)} disabled={isDisabled(sectionKey || field)} /></div>
                            <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Official Address</label><input type="text" value={entity.address} onChange={e => updateEntity(field, idx, 'address', e.target.value)} disabled={isDisabled(sectionKey || field)} required /></div>
                        </>
                    )}
                </div>
            </div>
        ))}
        {!isDisabled(sectionKey || field) && <button type="button" className="action-btn" style={{ marginBottom: '2rem' }} onClick={() => addEntity(field)}>+ Add Another</button>}
    </>
);

const FileUploadField = ({ label, onFileSelect, fileName, disabled, required }) => (
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
                    <span style={{ fontSize: '1.2rem' }}>✅</span>
                    <span style={{ fontSize: '0.85rem' }}>{fileName}</span>
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
);

const AcknowledgmentReceipt = ({ appData, onBack, onPrint }) => (
    <div className="fadeInUp" style={{ maxWidth: '900px', margin: '1rem auto', background: 'white', borderRadius: '32px', boxShadow: '0 25px 70px rgba(0,0,0,0.12)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        {/* Premium Header */}
        <div style={{ background: 'linear-gradient(135deg, #1a237e, #3949ab)', padding: '3rem 2rem', color: 'white', textAlign: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '20px', right: '30px', fontSize: '5rem', opacity: 0.08, transform: 'rotate(15deg)' }}>🏛️</div>

            <div style={{
                position: 'absolute',
                top: '0',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#ffd700',
                color: '#1a237e',
                padding: '0.8rem 2.5rem',
                borderRadius: '0 0 20px 20px',
                fontWeight: 900,
                fontSize: '1rem',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                zIndex: 10,
                letterSpacing: '1px'
            }}>
                REFERENCE: {appData.tempFileNo}
            </div>

            {/* Custom Close Button in Header Corner */}
            <button
                onClick={onBack}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'white',
                    border: 'none',
                    color: '#1a237e',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    zIndex: 20,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
            >
                ✕ CLOSE
            </button>

            <h2 style={{ margin: '1.5rem 0 0.5rem', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Department of Revenue</h2>
            <p style={{ margin: 0, opacity: 0.8, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '2px' }}>Western Province | Government of Sri Lanka</p>
            <div style={{ marginTop: '2rem', display: 'inline-block', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)', padding: '0.6rem 2rem', borderRadius: '40px', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                🎉 Submission Acknowledgment Receipt
            </div>
        </div>

        {/* Dynamic Content Body */}
        <div style={{ padding: '3rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={{ width: '80px', height: '80px', background: '#f0fdf4', color: '#16a34a', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1.5rem', boxShadow: '0 10px 25px rgba(22, 163, 74, 0.15)', transform: 'rotate(-5deg)' }}>✓</div>
                <h3 style={{ color: '#1e293b', fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>Application Successfully Filed</h3>
                <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '1rem', fontWeight: 500 }}>Your file has been securely transmitted and assigned to our assessment queue.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.8rem', background: '#f8fafc', padding: '2.5rem', borderRadius: '28px', border: '1px solid #f1f5f9' }}>
                <div style={{ gridColumn: 'span 2', background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 900, letterSpacing: '1.5px', display: 'block', marginBottom: '0.5rem' }}>OFFICIAL LEDGER NUMBER</label>
                    <p style={{ margin: 0, fontWeight: 900, color: '#1a237e', fontSize: '2rem', fontFamily: 'Inter, monospace', letterSpacing: '1px' }}>{appData.tempFileNo}</p>
                </div>

                <div style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 900, letterSpacing: '1px', display: 'block', marginBottom: '0.4rem' }}>TIMESTAMP</label>
                    <p style={{ margin: 0, fontWeight: 800, color: '#334155', fontSize: '0.95rem' }}>{new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 900, letterSpacing: '1px', display: 'block', marginBottom: '0.4rem' }}>FILING CATEGORY</label>
                    <p style={{ margin: 0, fontWeight: 800, color: '#334155', fontSize: '0.95rem' }}>
                        {appData.category === 'OP' ? '📜 Official Opinion' : appData.category === 'FI' ? '💰 Financial Instrument' : '🏘️ Rate Tax'}
                    </p>
                </div>

                <div style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 900, letterSpacing: '1px', display: 'block', marginBottom: '0.4rem' }}>ASSESSMENT REGION</label>
                    <p style={{ margin: 0, fontWeight: 800, color: '#334155', fontSize: '0.95rem' }}>{appData.region || 'Western Province HQ'}</p>
                </div>

                <div style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                    <label style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 900, letterSpacing: '1px', display: 'block', marginBottom: '0.4rem' }}>PRIMARY GRANTEE</label>
                    <p style={{ margin: 0, fontWeight: 800, color: '#334155', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{appData.fullData?.grantees?.[0]?.name || 'N/A'}</p>
                </div>
            </div>

            {/* Premium Footer Actions */}
            <div style={{ marginTop: '3.5rem', textAlign: 'center' }}>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '1rem 2rem', borderRadius: '16px', display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📫</span>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
                        A copy of this receipt has been logged in your dashboard repository.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="action-btn"
                        style={{
                            padding: '1rem 2.5rem',
                            borderRadius: '16px',
                            fontWeight: 800,
                            border: '1px solid #1a237e',
                            background: '#1a237e',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            boxShadow: '0 8px 20px rgba(26, 35, 126, 0.2)'
                        }}
                        onClick={onPrint}
                    >
                        🖨️ PRINT RECEIPT
                    </button>
                    <button className="btn-primary"
                        style={{
                            padding: '1rem 2.5rem',
                            borderRadius: '16px',
                            background: '#1a237e',
                            color: 'white',
                            border: 'none',
                            fontWeight: 900,
                            letterSpacing: '0.5px',
                            boxShadow: '0 8px 20px rgba(26, 35, 126, 0.2)'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = '#3949ab'; }}
                        onMouseOut={e => { e.currentTarget.style.background = '#1a237e'; }}
                        onClick={onBack}
                    >
                        🚪 CLOSE & EXIT
                    </button>
                </div>
            </div>
        </div>
        <style>{`
            @media print {
                @page {
                    size: A4;
                    margin: 20mm;
                }
                body * { visibility: hidden; }
                .fadeInUp, .fadeInUp * { visibility: visible; }
                .fadeInUp { 
                    position: absolute; 
                    left: 0; 
                    top: 0; 
                    width: 100%; 
                    margin: 0; 
                    box-shadow: none; 
                    border: none;
                    background: white !important;
                    height: auto;
                    border-radius: 0 !important;
                }
                /* Preserve backgrounds for premium feel */
                .fadeInUp div {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .btn-primary, .action-btn, button { display: none !important; }
            }
        `}</style>
    </div>
);

const NewApplication = () => {
    const { addApplication, applications, updateApplication, currentUser } = useAppContext();
    const navigate = useNavigate();
    const { id } = useParams();
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const leafletMap = useRef(null);

    const [category, setCategory] = useState('OP');
    const [isEditing, setIsEditing] = useState(false);
    const [isAmendedMode, setIsAmendedMode] = useState(false);
    const [unlockedSections, setUnlockedSections] = useState({
        grantees: false, grantors: false, notary: false, property: false, building: false, value: false, attachments: false, other: false, payment: false
    });

    const [showAcknowledgment, setShowAcknowledgment] = useState(false);
    const [submittedAppData, setSubmittedAppData] = useState(null);

    const [formData, setFormData] = useState({
        grantees: [{ type: 'Person', name: '', address: '', reference: '', contact: '', email: '', companyCategory: 'Private', companyType: '', regDate: '' }],
        grantors: [{ type: 'Person', name: '', address: '', reference: '', contact: '', email: '', companyCategory: 'Private', companyType: '', regDate: '' }],
        notary: { name: '', reference: '', barNo: '', address: '', contact: '', email: '' },
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
    });

    useEffect(() => {
        if (id && Array.isArray(applications)) {
            const existingApp = applications.find(a => a.id?.toString() === id.toString());
            if (existingApp) {
                setIsEditing(true);
                setCategory(existingApp.category);
                if (existingApp.fullData) {
                    let dataToSet = { ...existingApp.fullData };
                    // Convert standardized array back to object for the form's local state
                    if (Array.isArray(dataToSet.attachments)) {
                        const attObj = {};
                        dataToSet.attachments.forEach(att => {
                            attObj[att.name] = att.fileName || att.name;
                        });
                        dataToSet.attachments = attObj;
                    }

                    // Defensively merge with defaults to avoid missing properties
                    setFormData(prev => ({
                        ...prev,
                        ...dataToSet,
                        property: { ...prev.property, ...dataToSet.property },
                        building: { ...prev.building, ...dataToSet.building },
                        value: { ...prev.value, ...dataToSet.value },
                        payment: { ...prev.payment, ...dataToSet.payment }
                    }));
                }
                if (existingApp.status === 'AMENDED' || existingApp.status === 'REJECTED' || existingApp.status === 'INFORMATION_REQUESTED') {
                    setIsAmendedMode(true);

                    // Auto-unlock sections if specified by assessor
                    if (existingApp.fullData?.amendments && Array.isArray(existingApp.fullData.amendments)) {
                        const newUnlocked = { ...unlockedSections };
                        existingApp.fullData.amendments.forEach(section => {
                            if (newUnlocked.hasOwnProperty(section)) {
                                newUnlocked[section] = true;
                            }
                        });
                        setUnlockedSections(newUnlocked);
                    }
                }
            }
        }
    }, [id, applications]);

    // Initialize Map
    useEffect(() => {
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
                ...prev,
                property: {
                    ...prev.property,
                    lat: position.lat.toFixed(6),
                    lng: position.lng.toFixed(6),
                    mapUrl: `https://www.google.com/maps?q=${position.lat.toFixed(6)},${position.lng.toFixed(6)}`
                }
            }));
        });

        leafletMap.current.on('click', function (e) {
            if (isAmendedMode && !unlockedSections.property) return;
            const { lat, lng } = e.latlng;
            markerRef.current.setLatLng([lat, lng]);
            setFormData(prev => ({
                ...prev,
                property: {
                    ...prev.property,
                    lat: lat.toFixed(6),
                    lng: lng.toFixed(6),
                    mapUrl: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`
                }
            }));
        });

        return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
    }, [isAmendedMode, unlockedSections.property]);

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
                    ...prev,
                    property: {
                        ...prev.property,
                        lat: lat.toFixed(6),
                        lng: lng.toFixed(6),
                        mapUrl: `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`
                    }
                }));
            } else {
                alert('Location not found in database.');
            }
        } catch (err) { console.error('Search error:', err); } finally { setIsSearching(false); }
    };

    const addEntity = (field) => {
        if (isAmendedMode && !unlockedSections[field]) return;
        const newEntity = { type: 'Person', name: '', address: '', reference: '', contact: '', email: '', companyCategory: 'Private', companyType: '', regDate: '' };
        setFormData({ ...formData, [field]: [...formData[field], newEntity] });
    };

    const removeEntity = (field, index) => {
        if (isAmendedMode && !unlockedSections[field]) return;
        const list = [...formData[field]];
        list.splice(index, 1);
        setFormData({ ...formData, [field]: list });
    };

    const updateEntity = (field, index, key, value) => {
        if (isAmendedMode && !unlockedSections[field]) return;
        const list = [...formData[field]];
        list[index][key] = value;
        setFormData({ ...formData, [field]: list });
    };

    const addFloor = () => {
        if (isAmendedMode && !unlockedSections.building) return;
        setFormData({ ...formData, building: { ...formData.building, floors: [...formData.building.floors, { floorNo: '', area: '' }] } });
    };

    const updateFloor = (index, key, value) => {
        if (isAmendedMode && !unlockedSections.building) return;
        const floors = [...formData.building.floors];
        floors[index][key] = value;
        setFormData({ ...formData, building: { ...formData.building, floors } });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const existingApp = isEditing ? applications.find(a => a.id === parseInt(id)) : null;

        const appPayload = {
            category,
            fullData: formData,
            region: formData.property.localAuthority,
            tempFileNo: existingApp ? existingApp.tempFileNo : '', // Will be set by addApplication for new ones
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'RECEIVED'
        };

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

        setSubmittedAppData(finalAppData);
        setShowAcknowledgment(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const isDisabled = (sectionKey) => isAmendedMode && !unlockedSections[sectionKey];

    const getAttachments = () => {
        if (category === 'OP') return [
            'Draft Deed',
            'Copy of Previous Deed',
            'Survey Plan for Property',
            'Photocopy of Building Plan (if applicable)',
            'Photographs of the Building (if applicable)',
            'Photographs of the Land',
            'Rough Sketch to Approach Property from Main Town',
            'Report on Assessment Rate (if available)',
            'Certified Photocopy of Bank Valuation Report (if available)',
            'Photocopy of Grantee\'s / Donee NIC',
            'Photocopy of Grantor\'s / Donor NIC',
            'Form 20 / Directory of Directors (if buyer is a Company)',
        ];
        if (category === 'FI') return [
            'Draft Deed',
            'Copy of Previous Deed',
            'Certified Photocopy of Bank Valuation Report',
            'Survey Plan for Property',
            'Photocopy of Building Plan (if applicable)',
            'Photographs of the Building (if applicable)',
            'Photographs of the Land',
            'Rough Sketch to Approach Property from Main Town',
            'Report on Assessment Rate (if available)',
            'Photocopy of Grantee\'s / Donee NIC',
            'Photocopy of Grantor\'s / Donor NIC',
            'Form 20 / Directory of Directors (if buyer is a Company)',
        ];
        // RT
        return [
            'Photocopy of the Deed / Instrument to be Endorsed',
            'Photocopy of the Receipt of Stamp Duty Paid',
            'Photocopy of the Previous Deed / Instrument',
            'Photocopy of the Survey Plan of the Property',
            'Rough Sketch to Approach Property from Main Town',
            'Photocopy of Building Plan (if applicable)',
            'Photographs of the Building (if applicable)',
            'Photographs of the Land',
            'Report on Assessment Rate (if available)',
            'Certified Photocopy of Bank Valuation Report (if available)',
        ];
    };

    if (showAcknowledgment && submittedAppData) {
        return (
            <div className="dashboard-view" style={{
                minHeight: '100vh',
                overflowY: 'auto',
                background: '#f8fafc',
                padding: '1rem',
                display: 'block'
            }}>
                <AcknowledgmentReceipt
                    appData={submittedAppData}
                    onBack={() => navigate('/external')}
                    onPrint={() => window.print()}
                />
            </div>
        );
    }

    return (
        <div className="dashboard-view">
            <div className="content-header">
                <h1>{isAmendedMode ? 'Amend Application' : isEditing ? 'Edit Application' : 'New Application'}</h1>
            </div>

            {isAmendedMode && (
                <div style={{ background: '#fff3e0', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ffe0b2', marginBottom: '2rem' }}>
                    <h4 style={{ color: '#e65100', marginTop: 0 }}>⚠️ Application Returned for Amendment</h4>

                    {/* Display Assessor's Specific Comments */}
                    {(() => {
                        const app = Array.isArray(applications) && applications.find(a => a.id?.toString() === id?.toString());
                        const comment = app?.fullData?.amendmentComment;
                        if (!comment) return null;
                        return (
                            <div style={{ background: '#fff9c4', padding: '1rem', borderRadius: '8px', border: '1px solid #fff176', marginBottom: '1rem' }}>
                                <p style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: '#f57f17', textTransform: 'uppercase' }}>💬 Assessor's Instructions:</p>
                                <p style={{ margin: '0.4rem 0 0 0', fontSize: '1rem', color: '#424242' }}>{comment}</p>
                            </div>
                        );
                    })()}

                    <p style={{ fontSize: '0.9rem', marginBottom: '0' }}>Please review the sections below. Only sections marked by the assessor have been automatically unlocked for your correction.</p>
                </div>
            )}

            <div className="management-form" style={{ maxWidth: '1000px' }}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: '2rem' }}>
                        <label>Application Category</label>
                        <div className={`type-selector ${isAmendedMode ? 'pointer-events-none' : ''}`}>
                            <div className={`type-tab ${category === 'OP' ? 'active' : ''}`} onClick={() => !isAmendedMode && setCategory('OP')}>Opinion (OP)</div>
                            <div className={`type-tab ${category === 'FI' ? 'active' : ''}`} onClick={() => !isAmendedMode && setCategory('FI')}>Financial (FI)</div>
                            <div className={`type-tab ${category === 'RT' ? 'active' : ''}`} onClick={() => !isAmendedMode && setCategory('RT')}>Rate Tax (RT)</div>
                        </div>
                    </div>

                    <EntitySection
                        title="Details of Grantee"
                        field="grantees"
                        formData={formData}
                        updateEntity={updateEntity}
                        removeEntity={removeEntity}
                        addEntity={addEntity}
                        isDisabled={isDisabled}
                        isAmendedMode={isAmendedMode}
                        unlockedSections={unlockedSections}
                        setUnlockedSections={setUnlockedSections}
                    />
                    <EntitySection
                        title="Details of Grantor"
                        field="grantors"
                        formData={formData}
                        updateEntity={updateEntity}
                        removeEntity={removeEntity}
                        addEntity={addEntity}
                        isDisabled={isDisabled}
                        isAmendedMode={isAmendedMode}
                        unlockedSections={unlockedSections}
                        setUnlockedSections={setUnlockedSections}
                    />

                    <SectionTitle
                        title="Details of Notary/Lawyer"
                        sectionKey="notary"
                        isAmendedMode={isAmendedMode}
                        unlockedSections={unlockedSections}
                    />
                    <div className="form-grid" style={{ opacity: isDisabled('notary') ? 0.7 : 1 }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Name in Full</label><input type="text" value={formData.notary.name} disabled={isDisabled('notary')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, name: e.target.value } })} required /></div>
                        <div className="form-group"><label>NIC/Passport No</label><input type="text" value={formData.notary.reference} disabled={isDisabled('notary')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, reference: e.target.value } })} required /></div>
                        <div className="form-group"><label>Bar Association No</label><input type="text" value={formData.notary.barNo} disabled={isDisabled('notary')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, barNo: e.target.value } })} required /></div>
                        <div className="form-group"><label>Contact</label><input type="text" value={formData.notary.contact} disabled={isDisabled('notary')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, contact: e.target.value } })} /></div>
                        <div className="form-group"><label>Email</label><input type="email" value={formData.notary.email} disabled={isDisabled('notary')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, email: e.target.value } })} /></div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Address</label><input type="text" value={formData.notary.address} disabled={isDisabled('notary')} onChange={e => setFormData({ ...formData, notary: { ...formData.notary, address: e.target.value } })} /></div>
                    </div>

                    <SectionTitle
                        title="Details of Property"
                        sectionKey="property"
                        isAmendedMode={isAmendedMode}
                        unlockedSections={unlockedSections}
                    />
                    <div className="form-grid" style={{ opacity: isDisabled('property') ? 0.7 : 1 }}>
                        <div className="form-group"><label>Nature of Instrument</label>
                            <select value={formData.property.nature} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, nature: e.target.value } })} required>
                                <option value="Transfer">Transfer</option>
                                <option value="Gift">Gift</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Local Authority</label><input type="text" value={formData.property.localAuthority} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, localAuthority: e.target.value } })} required /></div>
                        <div className="form-group"><label>Town / Post Office</label><input type="text" value={formData.property.town} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, town: e.target.value } })} required /></div>
                        <div className="form-group"><label>Address of the Property</label><input type="text" value={formData.property.address} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, address: e.target.value } })} required /></div>
                        <div className="form-group"><label>Distance from Town (km)</label><input type="text" value={formData.property.distance} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, distance: e.target.value } })} /></div>
                        <div className="form-group"><label>Land Type</label>
                            <select value={formData.property.landType} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, landType: e.target.value } })}>
                                <option value="Commercial">Commercial</option>
                                <option value="Residential">Residential</option>
                                <option value="Agricultural">Agricultural</option>
                                <option value="Industrial">Industrial</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Surveyor Name</label><input type="text" value={formData.property.surveyor} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, surveyor: e.target.value } })} /></div>
                        <div className="form-group"><label>Plan No</label><input type="text" value={formData.property.planNo} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, planNo: e.target.value } })} /></div>
                        <div className="form-group"><label>Plan Date</label><input type="date" value={formData.property.planDate} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, planDate: e.target.value } })} /></div>
                        <div className="form-group"><label>Lot No</label><input type="text" value={formData.property.lotNo} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, lotNo: e.target.value } })} /></div>
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

                    <SectionTitle
                        title="Extent of Land"
                        sectionKey="property"
                        isAmendedMode={isAmendedMode}
                        unlockedSections={unlockedSections}
                    />
                    <div className="form-grid" style={{ opacity: isDisabled('property') ? 0.7 : 1 }}>
                        <div className="form-group"><label>Acre</label><input type="number" value={formData.property.extent.acre} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, extent: { ...formData.property.extent, acre: e.target.value } } })} /></div>
                        <div className="form-group"><label>Rood</label><input type="number" value={formData.property.extent.rood} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, extent: { ...formData.property.extent, rood: e.target.value } } })} /></div>
                        <div className="form-group"><label>Perch</label><input type="number" value={formData.property.extent.perch} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, extent: { ...formData.property.extent, perch: e.target.value } } })} /></div>
                        <div className="form-group"><label>Hectare</label><input type="number" step="0.0001" value={formData.property.extent.hectare} disabled={isDisabled('property')} onChange={e => setFormData({ ...formData, property: { ...formData.property, extent: { ...formData.property.extent, hectare: e.target.value } } })} /></div>
                    </div>

                    <SectionTitle
                        title="Details of Building"
                        sectionKey="building"
                        isAmendedMode={isAmendedMode}
                        unlockedSections={unlockedSections}
                    />
                    <div className="form-grid" style={{ opacity: isDisabled('building') ? 0.7 : 1 }}>
                        <div className="form-group"><label>Building Type</label>
                            <select value={formData.building.type} disabled={isDisabled('building')} onChange={e => setFormData({ ...formData, building: { ...formData.building, type: e.target.value } })}>
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Industrial">Industrial</option>
                                <option value="Agricultural">Agricultural</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Building Plan No</label><input type="text" value={formData.building.planNo} disabled={isDisabled('building')} onChange={e => setFormData({ ...formData, building: { ...formData.building, planNo: e.target.value } })} /></div>
                        <div className="form-group"><label>Unit No (if applicable)</label><input type="text" value={formData.building.unitNo} disabled={isDisabled('building')} onChange={e => setFormData({ ...formData, building: { ...formData.building, unitNo: e.target.value } })} /></div>
                        <div className="form-group"><label>Year of Construction</label><input type="text" value={formData.building.year} disabled={isDisabled('building')} onChange={e => setFormData({ ...formData, building: { ...formData.building, year: e.target.value } })} /></div>
                        <div className="form-group"><label>Facilities Available</label><input type="text" placeholder="Water, Electricity, etc." value={formData.building.facilities} disabled={isDisabled('building')} onChange={e => setFormData({ ...formData, building: { ...formData.building, facilities: e.target.value } })} /></div>
                    </div>

                    <div className="nested-section" style={{ marginTop: '1rem', background: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', border: '1px solid #eee', opacity: isDisabled('building') ? 0.7 : 1 }}>
                        <strong>Floor Details</strong>
                        {formData.building?.floors?.map((floor, idx) => (
                            <div key={idx} className="form-grid" style={{ marginTop: '1rem' }}>
                                <div className="form-group"><label>Floor No / Name</label><input type="text" value={floor.floorNo} disabled={isDisabled('building')} onChange={e => updateFloor(idx, 'floorNo', e.target.value)} /></div>
                                <div className="form-group"><label>Floor Area (Sq. Ft.)</label><input type="number" value={floor.area} disabled={isDisabled('building')} onChange={e => updateFloor(idx, 'area', e.target.value)} /></div>
                            </div>
                        ))}
                        {!isDisabled('building') && <button type="button" className="action-btn" onClick={addFloor}>+ Add Floor</button>}
                    </div>

                    <SectionTitle title="Rental Details" sectionKey="building" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} />
                    <div className="form-grid" style={{ opacity: isDisabled('building') ? 0.7 : 1 }}>
                        <div className="form-group"><label>Is Property Rented?</label>
                            <select value={formData.building.isRented} disabled={isDisabled('building')} onChange={e => setFormData({ ...formData, building: { ...formData.building, isRented: e.target.value === 'true' } })}>
                                <option value="false">No</option>
                                <option value="true">Yes</option>
                            </select>
                        </div>
                        {formData.building.isRented && <div className="form-group"><label>Monthly Rent (LKR)</label><input type="number" value={formData.building.rent} disabled={isDisabled('building')} onChange={e => setFormData({ ...formData, building: { ...formData.building, rent: e.target.value } })} /></div>}
                    </div>

                    <SectionTitle title="Transaction Values (Disclosure Sections 6-10)" sectionKey="value" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} />
                    <div className="form-grid" style={{ opacity: isDisabled('value') ? 0.7 : 1 }}>
                        <div className="form-group"><label>Consideration Value (LKR)</label><input type="number" value={formData.value.purchase} disabled={isDisabled('value')} onChange={e => setFormData({ ...formData, value: { ...formData.value, purchase: e.target.value } })} /></div>
                        <div className="form-group"><label>Market Value on Deed Date (LKR)</label><input type="number" value={formData.value.marketValue} disabled={isDisabled('value')} onChange={e => setFormData({ ...formData, value: { ...formData.value, marketValue: e.target.value } })} /></div>
                        <div className="form-group"><label>Value of Crops / Plantation (LKR)</label><input type="number" value={formData.value.cropsValue} disabled={isDisabled('value')} onChange={e => setFormData({ ...formData, value: { ...formData.value, cropsValue: e.target.value } })} /></div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Loan / Mortgage Details (if any)</label><textarea value={formData.value.loanDetails} disabled={isDisabled('value')} onChange={e => setFormData({ ...formData, value: { ...formData.value, loanDetails: e.target.value } })} /></div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Has a previous Opinion been obtained for this property?</label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                                <input type="checkbox" style={{ width: '22px', height: '22px', cursor: 'pointer' }} checked={formData.previousOpinion.hasOne} disabled={isDisabled('value')} onChange={e => setFormData({ ...formData, previousOpinion: { ...formData.previousOpinion, hasOne: e.target.checked } })} />
                                {formData.previousOpinion.hasOne && <input type="text" placeholder="Reference File No (e.g. SD/OP/2026/001)" style={{ flex: 1, padding: '0.8rem' }} value={formData.previousOpinion.no} disabled={isDisabled('value')} onChange={e => setFormData({ ...formData, previousOpinion: { ...formData.previousOpinion, no: e.target.value } })} />}
                            </div>
                        </div>
                    </div>

                    {category === 'OP' && (
                        <>
                            <SectionTitle
                                title="Opinion Fee Payment (LKR 250/=)"
                                sectionKey="payment"
                                isAmendedMode={isAmendedMode}
                                unlockedSections={unlockedSections}
                            />
                            <div className="nested-section" style={{ background: '#e3f2fd', border: '1px solid #bbdefb', opacity: isDisabled('payment') ? 0.7 : 1 }}>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Paid Bank</label>
                                        <select
                                            value={formData.payment.bank}
                                            disabled={isDisabled('payment')}
                                            onChange={e => setFormData({ ...formData, payment: { ...formData.payment, bank: e.target.value } })}
                                        >
                                            <option value="Bank of Ceylon">Bank of Ceylon</option>
                                            <option value="People's Bank">People's Bank</option>
                                            <option value="Other Bank">Other Bank</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Paid Bank Branch</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Battaramulla / Head Office"
                                            value={formData.payment.branch}
                                            disabled={isDisabled('payment')}
                                            onChange={e => setFormData({ ...formData, payment: { ...formData.payment, branch: e.target.value } })}
                                            required={category === 'OP'}
                                        />
                                    </div>
                                    <div className="form-group"><label>Receipt / Reference No</label><input type="text" value={formData.payment.receiptNo} disabled={isDisabled('payment')} onChange={e => setFormData({ ...formData, payment: { ...formData.payment, receiptNo: e.target.value } })} placeholder="Enter scroll NO or Ref NO" required={category === 'OP'} /></div>
                                    <div className="form-group"><label>Payment Date</label><input type="date" value={formData.payment.date} disabled={isDisabled('payment')} onChange={e => setFormData({ ...formData, payment: { ...formData.payment, date: e.target.value } })} required={category === 'OP'} /></div>
                                    <div className="form-group"><label>Fee Amount (LKR)</label><input type="text" value="250/=" readOnly style={{ background: '#eee', fontWeight: 'bold' }} /></div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <FileUploadField
                                            label="Upload Payment Receipt (Scroll)"
                                            fileName={formData.payment.receiptFileName}
                                            disabled={isDisabled('payment')}
                                            required={category === 'OP' && !isEditing}
                                            onFileSelect={file => setFormData({
                                                ...formData,
                                                payment: {
                                                    ...formData.payment,
                                                    receiptFileName: file.name,
                                                    receiptFileData: file.data
                                                }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <SectionTitle title="Other Details" sectionKey="other" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} />
                    <div className="form-grid" style={{ opacity: isDisabled('other') ? 0.7 : 1 }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}><label>Any other relevant details regarding this application</label><textarea value={formData.otherDetails} disabled={isDisabled('other')} onChange={e => setFormData({ ...formData, otherDetails: e.target.value })} /></div>
                    </div>

                    <SectionTitle title="Document Attachments" sectionKey="attachments" isAmendedMode={isAmendedMode} unlockedSections={unlockedSections} />
                    <div className="form-grid" style={{ opacity: isDisabled('attachments') ? 0.7 : 1 }}>
                        {getAttachments().map(doc => (
                            <FileUploadField
                                key={doc}
                                label={doc}
                                fileName={formData.attachments[doc]?.name || formData.attachments[doc]}
                                disabled={isDisabled('attachments')}
                                onFileSelect={file => setFormData({ ...formData, attachments: { ...formData.attachments, [doc]: file } })}
                            />
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', borderTop: '2px solid #eee', paddingTop: '2rem' }}>
                        <button type="submit" className="btn-primary" style={{ padding: '1rem 4rem', color: 'white' }}>
                            {isAmendedMode ? 'Resubmit Amended File' : 'Submit Application'}
                        </button>
                        <button type="button" className="action-btn" onClick={() => navigate('/external')}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewApplication;
