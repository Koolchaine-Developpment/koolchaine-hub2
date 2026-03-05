import React from 'react';

export function Checkbox({ checked, onChange, label, description }) {
    return (
        <div
            onClick={() => onChange(!checked)}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', borderRadius: 'var(--radius-md, 10px)',
                cursor: 'pointer', transition: 'background 150ms',
                background: checked ? 'rgba(245,57,90,0.04)' : 'transparent',
            }}
        >
            <div style={{
                width: '18px', height: '18px', borderRadius: '5px', flexShrink: 0,
                border: checked ? '2px solid var(--pink)' : '2px solid var(--border)',
                background: checked ? 'var(--pink)' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 150ms',
            }}>
                {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </div>
            <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--dark)' }}>{label}</div>
                {description && <div style={{ fontSize: '11px', color: 'var(--gray)', marginTop: '1px' }}>{description}</div>}
            </div>
        </div>
    )
}
