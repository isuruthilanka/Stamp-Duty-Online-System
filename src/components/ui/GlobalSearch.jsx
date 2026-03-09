import React from 'react';

const GlobalSearch = ({ value, onChange, placeholder = "Search by File No, Applicant or Property..." }) => {
    return (
        <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: '500px',
            marginRight: '1rem'
        }}>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                style={{
                    width: '100%',
                    padding: '0.8rem 1.2rem 0.8rem 3rem',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: '#1a237e',
                    boxShadow: '0 4px 12px rgba(26, 35, 126, 0.05)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none'
                }}
                className="global-search-input"
            />
            <span style={{
                position: 'absolute',
                left: '1.2rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '1.2rem',
                opacity: 0.5,
                pointerEvents: 'none'
            }}>
                🔍
            </span>
            {value && (
                <button
                    onClick={() => onChange('')}
                    style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#f1f5f9',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        color: '#64748b',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}
                >
                    ✕
                </button>
            )}
            <style>
                {`
                .global-search-input:focus {
                    border-color: #1a237e !important;
                    box-shadow: 0 8px 20px rgba(26, 35, 126, 0.1) !important;
                    transform: translateY(-1px);
                }
                .global-search-input::placeholder {
                    color: #94a3b8;
                    font-weight: 500;
                }
                `}
            </style>
        </div>
    );
};

export default GlobalSearch;
