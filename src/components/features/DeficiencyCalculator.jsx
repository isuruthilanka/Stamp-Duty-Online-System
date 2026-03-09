import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const formatNumberWithCommas = (val) => {
    if (val === '' || val == null) return '';
    const parts = val.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
};
const unformat = (str) => str.replace(/,/g, '');
const formatCurrency = (num) =>
    isNaN(num) ? '0.00' : num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const CurrencyInput = ({ id, placeholder, rawValue, onChange }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
                id={id}
                type="text"
                placeholder={placeholder}
                value={focused ? rawValue : formatNumberWithCommas(rawValue)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onChange={(e) => {
                    const raw = unformat(e.target.value);
                    if (raw === '' || /^\d*\.?\d*$/.test(raw)) onChange(raw);
                }}
                style={{
                    width: '100%', padding: '0.95rem 4.5rem 0.95rem 1.2rem',
                    fontSize: '1.1rem', background: 'rgba(0,0,0,0.35)',
                    border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '30px',
                    outline: 'none', color: 'white', fontWeight: 500,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: focused ? '0 0 0 3px rgba(129,140,248,0.25)' : 'none',
                    borderColor: focused ? '#818cf8' : 'rgba(255,255,255,0.08)',
                }}
            />
            <span style={{
                position: 'absolute', right: '1rem',
                background: 'rgba(255,255,255,0.06)', padding: '0.3rem 1rem',
                borderRadius: '30px', fontSize: '0.82rem', fontWeight: 600,
                color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)', pointerEvents: 'none',
            }}>LKR</span>
        </div>
    );
};

const DeficiencyCalculator = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { setCalculatorData } = useAppContext();

    const { appId, permFileNo, category, calculatedValue, calculatedDuty } = location.state || {};

    const [deedType, setDeedType] = useState('transfer');
    const [propertyValue, setPropertyValue] = useState('');
    const [stamp, setStamp] = useState('');
    const [penalty, setPenalty] = useState('');
    const [result, setResult] = useState(null);
    const [errors, setErrors] = useState({});

    // Pre-fill values if coming from StampDutyCalculator
    useEffect(() => {
        if (calculatedValue !== undefined && calculatedValue !== null && calculatedValue !== 0) {
            setPropertyValue(calculatedValue.toString());
        }
    }, [calculatedValue]);

    // Auto-compute whenever inputs change
    useEffect(() => {
        if (propertyValue || stamp || penalty) {
            compute();
        }
    }, [propertyValue, stamp, penalty, deedType]);

    const compute = () => {
        const mv = parseFloat(propertyValue);
        const sa = parseFloat(stamp);
        const pr = parseFloat(penalty);
        const newErrors = {};
        if (isNaN(mv) || mv < 0) newErrors.propertyValue = 'Required · non-negative';
        if (isNaN(sa) || sa < 0) newErrors.stamp = 'Required · non-negative';
        if (isNaN(pr) || pr < 0) newErrors.penalty = 'Required · non-negative';
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) { setResult(null); return; }

        let duty;
        if (deedType === 'transfer') {
            duty = mv <= 100000 ? mv * 0.03 : 100000 * 0.03 + (mv - 100000) * 0.04;
        } else {
            duty = mv <= 50000 ? mv * 0.03 : 50000 * 0.03 + (mv - 50000) * 0.02;
        }
        const deficiency = Math.max(0, duty - sa);
        const penaltyAmt = deficiency * (pr / 100);
        const total = deficiency + penaltyAmt;
        setResult({ duty, deficiency, penaltyAmt, total, pr, mv, sa, deedType });
    };

    const handlePrint = () => window.print();

    const handleApplyToNotice = () => {
        if (result && appId) {
            // Save state for the Official Notice form
            setCalculatorData({
                propertyValue: result.mv,
                stampDutyPayable: result.duty,
                stampAffixed: result.sa,
                deficiencyAmount: result.deficiency,
                penaltyRate: result.pr,
                penaltyAmount: result.penaltyAmt,
                totalPayable: result.total,
                deedType: result.deedType
            });
            // Redirect to the new Official Deficiency Notice page
            navigate(`/internal/view/${appId}/deficiency-notice`, { state: { permFileNo, category } });
        }
    };

    const labelStyle = {
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.5px', color: '#94a3b8', marginBottom: '0.5rem',
    };
    const groupStyle = { marginBottom: '1.4rem' };
    const errorStyle = { color: '#f87171', fontSize: '0.75rem', marginTop: '0.35rem', marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' };

    return (
        <>
            <style>{`
                /* ── Screen component styles ── */
                .pill-tab { flex:1; padding:0.85rem 1rem; border:none; border-radius:50px; font-size:1rem; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.6rem; transition:all 0.2s; background:transparent; color:#94a3b8; }
                .pill-tab.active { background:rgba(255,255,255,0.9); color:#0f172a; box-shadow:0 6px 20px -6px rgba(0,0,0,0.4); }
                .compute-btn { width:100%; padding:1.15rem; background:linear-gradient(145deg,#1e2b47,#0f1a2f); border:1px solid rgba(255,255,255,0.06); border-radius:50px; font-size:1.2rem; font-weight:700; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:0.8rem; margin:1.8rem 0 0; transition:all 0.15s; box-shadow:0 6px 20px -6px #00000080; }
                .compute-btn:hover { transform:scale(1.01); background:linear-gradient(145deg,#253450,#121f38); box-shadow:0 14px 28px -8px black; }
                .result-row { display:flex; justify-content:space-between; align-items:center; padding:0.75rem 0.25rem; border-bottom:1px solid rgba(255,255,255,0.05); }
                .result-label { display:flex; align-items:center; gap:0.5rem; color:#94a3b8; font-weight:500; }
                .result-value { font-size:1.35rem; font-weight:700; color:#e2e8f0; }
                .total-value { font-size:2rem; font-weight:800; background:linear-gradient(145deg,#fbbf24,#c084fc); -webkit-background-clip:text; background-clip:text; color:transparent; }
                .sig-label { font-size:0.8rem; text-transform:uppercase; letter-spacing:1px; color:#334155; font-weight:700; margin-bottom:0.4rem; }
                .sig-line { height:2px; background:#64748b; border-radius:2px; }

                /* ── Keep print div off-screen on screen (NOT display:none) ── */
                #dc-print-root {
                    position: absolute;
                    left: -9999px;
                    top: -9999px;
                    width: 210mm;
                    visibility: hidden;
                }

                /* ── Print media ── */
                @media print {
                    /* Hide everything */
                    body * { visibility: hidden !important; }

                    /* Un-hide the print root and all its children */
                    #dc-print-root,
                    #dc-print-root * {
                        visibility: visible !important;
                    }

                    /* Place it at the origin */
                    #dc-print-root {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        padding: 1.5cm 2cm !important;
                        background: #ffffff !important;
                        color: #000000 !important;
                        font-family: 'Segoe UI', Arial, sans-serif !important;
                        font-size: 11pt !important;
                        box-sizing: border-box !important;
                        overflow: visible !important;
                    }

                    /* Print typography */
                    #dc-print-root h1 { font-size:16pt !important; font-weight:700 !important; color:#000 !important; margin:0 0 4pt !important; }
                    #dc-print-root .p-org { font-size:10pt !important; color:#444 !important; margin:0 0 2pt !important; }
                    #dc-print-root .p-date { font-size:9pt !important; color:#666 !important; margin:0 0 14pt !important; }
                    #dc-print-root .p-divider { border:none !important; border-top:1.5pt solid #000 !important; margin:8pt 0 !important; }
                    #dc-print-root .p-section { font-size:9pt !important; font-weight:700 !important; text-transform:uppercase !important; letter-spacing:1pt !important; color:#333 !important; margin:12pt 0 4pt !important; border-bottom:0.5pt solid #ccc !important; padding-bottom:3pt !important; }
                    #dc-print-root .p-badge { font-size:9pt !important; color:#555 !important; border:0.5pt solid #aaa !important; padding:2pt 8pt !important; border-radius:3pt !important; display:inline-block !important; margin-bottom:8pt !important; background:transparent !important; }
                    #dc-print-root .p-row { display:flex !important; justify-content:space-between !important; padding:5pt 0 !important; border-bottom:0.5pt solid #ddd !important; color:#000 !important; }
                    #dc-print-root .p-lbl { color:#333 !important; font-size:10pt !important; }
                    #dc-print-root .p-val { font-weight:600 !important; color:#000 !important; font-size:10pt !important; text-align:right !important; }
                    #dc-print-root .p-total-row { display:flex !important; justify-content:space-between !important; padding:7pt 0 4pt !important; border-top:2pt solid #000 !important; margin-top:3pt !important; }
                    #dc-print-root .p-total-lbl { font-size:13pt !important; font-weight:700 !important; color:#000 !important; }
                    #dc-print-root .p-total-val { font-size:14pt !important; font-weight:800 !important; color:#000 !important; }
                    #dc-print-root .p-sig-grid { display:flex !important; gap:3cm !important; flex-wrap:wrap !important; margin-top:8pt !important; }
                    #dc-print-root .p-sig-item { flex:1 1 4cm !important; margin-bottom:1cm !important; }
                    #dc-print-root .p-sig-lbl { font-size:8pt !important; text-transform:uppercase !important; letter-spacing:1pt !important; color:#333 !important; font-weight:600 !important; margin-bottom:16pt !important; display:block !important; }
                    #dc-print-root .p-sig-line { height:1pt !important; background:#000 !important; display:block !important; }
                    #dc-print-root .p-stamp { text-align:right !important; font-size:9pt !important; color:#666 !important; font-style:italic !important; margin-top:6pt !important; }
                    #dc-print-root .p-footer { text-align:center !important; font-size:8pt !important; color:#777 !important; border-top:0.5pt solid #ccc !important; padding-top:6pt !important; margin-top:16pt !important; }
                }
            `}</style>

            {/* ════════════════ SCREEN UI ════════════════ */}
            <div style={{ padding: '1.5rem 1.5rem 2rem', maxWidth: '820px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(145deg,#1e2b47,#0f1a2f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', flexShrink: 0 }}>
                        ⚖️
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>Stamp Duty Deficiency Calculator</h2>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Compute duty, deficiency &amp; penalty for stamp instruments</p>
                    </div>
                    <div style={{ marginLeft: 'auto', padding: '0.4rem 1rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '30px', fontSize: '0.78rem', fontWeight: 600, color: '#818cf8' }}>
                        🛡️ v3.0
                    </div>
                </div>

                {/* Main Card */}
                <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px', padding: '1.8rem', backdropFilter: 'blur(12px)' }}>
                    {/* Deed Type Toggle */}
                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '60px', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <button className={`pill-tab${deedType === 'transfer' ? ' active' : ''}`} onClick={() => { setDeedType('transfer'); setResult(null); }}>📝 Transfer</button>
                        <button className={`pill-tab${deedType === 'gift' ? ' active' : ''}`} onClick={() => { setDeedType('gift'); setResult(null); }}>🎁 Gift</button>
                    </div>

                    {/* Inputs */}
                    <div>
                        <div style={groupStyle}>
                            <label style={labelStyle}><span>🏢</span> Property Value (Rs.)</label>
                            <CurrencyInput id="mkt" placeholder="0.00" rawValue={propertyValue} onChange={(v) => { setPropertyValue(v); setResult(null); setErrors(e => ({ ...e, propertyValue: null })); }} />
                            {errors.propertyValue && <div style={errorStyle}>⚠️ {errors.propertyValue}</div>}
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}><span>📜</span> Stamp Affixed (Rs.)</label>
                            <CurrencyInput id="stp" placeholder="0.00" rawValue={stamp} onChange={(v) => { setStamp(v); setResult(null); setErrors(e => ({ ...e, stamp: null })); }} />
                            {errors.stamp && <div style={errorStyle}>⚠️ {errors.stamp}</div>}
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle}><span>%</span> Penalty Rate (%)</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    id="pen"
                                    type="text"
                                    placeholder="e.g. 10"
                                    value={penalty}
                                    onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) { setPenalty(v); setResult(null); setErrors(err => ({ ...err, penalty: null })); } }}
                                    style={{ width: '100%', padding: '0.95rem 4.5rem 0.95rem 1.2rem', fontSize: '1.1rem', background: 'rgba(0,0,0,0.35)', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: '30px', outline: 'none', color: 'white', fontWeight: 500, transition: 'border-color 0.2s' }}
                                    onFocus={e => e.target.style.borderColor = '#818cf8'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                />
                                <span style={{ position: 'absolute', right: '1rem', background: 'rgba(255,255,255,0.06)', padding: '0.3rem 1rem', borderRadius: '30px', fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', border: '1px solid rgba(255,255,255,0.07)', pointerEvents: 'none' }}>%</span>
                            </div>
                            {errors.penalty && <div style={errorStyle}>⚠️ {errors.penalty}</div>}
                        </div>
                        <button className="compute-btn" onClick={compute}><span>🧮</span> Compute Stamp Duty &amp; Penalty</button>
                    </div>

                    {/* Screen Results */}
                    {result && (
                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1', fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.8rem' }}>
                                📊 Settlement Breakdown
                            </div>
                            <div style={{ background: 'rgba(99,102,241,0.06)', padding: '0.4rem 1rem', borderRadius: '30px', fontSize: '0.8rem', color: '#94a3b8', display: 'inline-block', border: '1px solid rgba(255,215,0,0.15)', marginBottom: '1rem' }}>
                                ℹ️ {deedType === 'transfer' ? 'Transfer deed' : 'Gift deed'}
                            </div>
                            <div className="result-row"><span className="result-label"><span>📄</span> Stamp Duty Payable</span><span className="result-value">Rs. {formatCurrency(result.duty)}</span></div>
                            <div className="result-row"><span className="result-label"><span>⚠️</span> Deficiency</span><span className="result-value">Rs. {formatCurrency(result.deficiency)}</span></div>
                            <div className="result-row"><span className="result-label"><span>⚖️</span> Penalty ({result.pr}%)</span><span className="result-value">Rs. {formatCurrency(result.penaltyAmt)}</span></div>
                            <div className="result-row" style={{ borderBottom: 'none', marginTop: '0.5rem' }}>
                                <span className="result-label" style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '1.05rem' }}><span>💰</span> Full amount of stamp duty payable</span>
                                <span className="total-value">Rs. {formatCurrency(result.total)}</span>
                            </div>

                            {/* Signature section (screen) */}
                            <div style={{ marginTop: '1.8rem', paddingTop: '1.2rem', borderTop: '2px dashed rgba(255,255,255,0.15)' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '1rem' }}>
                                    {[['Signature', 'Full Name'], ['Designation', 'Date']].map((col, i) => (
                                        <div key={i} style={{ flex: '1 1 200px' }}>
                                            {col.map(lbl => (
                                                <div key={lbl} style={{ marginBottom: '1.2rem' }}>
                                                    <div className="sig-label">{lbl}</div>
                                                    <div className="sig-line" />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', color: '#fbbf24', opacity: 0.65, fontSize: '1rem', marginTop: '0.5rem' }}>
                                    <span>●</span><span>●</span><span>●</span> (official stamp)
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button
                                    onClick={handlePrint}
                                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '30px', padding: '0.75rem 2rem', color: '#fbbf24', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.7rem', transition: 'all 0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,215,0,0.15)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                                >🖨️ Print Report</button>
                                {appId && (
                                    <button
                                        onClick={handleApplyToNotice}
                                        style={{ background: 'linear-gradient(145deg, #10b981, #059669)', border: 'none', borderRadius: '30px', padding: '0.75rem 2.5rem', color: 'white', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.7rem', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                    >✅ Apply to Official Notice</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ marginTop: '1.2rem', textAlign: 'center', color: '#475569', fontSize: '0.78rem' }}>
                    <span style={{ color: '#4ade80' }}>✅</span> Department of Revenue (Western Province) © 2026
                </div>
            </div>

            {/* ════════════════ PRINT-ONLY OUTPUT ════════════════
                IMPORTANT: NOT display:none — positioned off-screen so
                visibility:visible in @media print can show it.            */}
            <div id="dc-print-root" aria-hidden="true">
                {result ? (
                    <>
                        {/* Print Page Header */}
                        <div style={{ textAlign: 'center', borderBottom: '2pt solid #000', paddingBottom: '10pt', marginBottom: '10pt' }}>
                            <h1>Stamp Duty Deficiency Calculator</h1>
                            <div className="p-org">Department of Revenue — Western Province</div>
                            <div className="p-date">
                                Report Date: {new Date().toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                        </div>

                        <hr className="p-divider" />

                        {/* Input Details */}
                        <div className="p-section">Input Details</div>
                        <div className="p-badge">
                            {result.deedType === 'transfer' ? 'Transfer Deed' : 'Gift Deed'}
                        </div>
                        <div className="p-row"><span className="p-lbl">Property Value</span><span className="p-val">Rs. {formatCurrency(result.mv)}</span></div>
                        <div className="p-row"><span className="p-lbl">Stamp Affixed</span><span className="p-val">Rs. {formatCurrency(result.sa)}</span></div>
                        <div className="p-row"><span className="p-lbl">Penalty Rate</span><span className="p-val">{result.pr}%</span></div>

                        {/* Settlement Breakdown */}
                        <div className="p-section">Settlement Breakdown</div>
                        <div className="p-row"><span className="p-lbl">Stamp Duty Payable</span><span className="p-val">Rs. {formatCurrency(result.duty)}</span></div>
                        <div className="p-row"><span className="p-lbl">Deficiency Amount</span><span className="p-val">Rs. {formatCurrency(result.deficiency)}</span></div>
                        <div className="p-row"><span className="p-lbl">Penalty ({result.pr}%)</span><span className="p-val">Rs. {formatCurrency(result.penaltyAmt)}</span></div>
                        <div className="p-total-row">
                            <span className="p-total-lbl">Full amount of stamp duty payable</span>
                            <span className="p-total-val">Rs. {formatCurrency(result.total)}</span>
                        </div>

                        {/* Signature Section */}
                        <div style={{ marginTop: '20pt', paddingTop: '14pt', borderTop: '1pt dashed #aaa' }}>
                            <div className="p-section">Official Signatures</div>
                            <div className="p-sig-grid">
                                {[['Signature', 'Full Name'], ['Designation', 'Date']].map((col, i) => (
                                    <div key={i} style={{ flex: '1 1 4cm' }}>
                                        {col.map(lbl => (
                                            <div key={lbl} className="p-sig-item">
                                                <span className="p-sig-lbl">{lbl}</span>
                                                <span className="p-sig-line" />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <div className="p-stamp">[ Official Stamp ]</div>
                        </div>

                        {/* Print Footer */}
                        <div className="p-footer">
                            Department of Revenue (Western Province) © 2026 &nbsp;·&nbsp; Computer-generated document — no signature required for digital copies.
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '1cm', color: '#999', fontStyle: 'italic' }}>
                        No results to print. Please compute first.
                    </div>
                )}
            </div>
        </>
    );
};

export default DeficiencyCalculator;
