import React from 'react';

export function Slider({ value, min = 0, max = 100, step = 1, onChange, label, displayValue }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {label && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray)' }}>{label}</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--pink)' }}>{displayValue ?? value}</span>
                </div>
            )}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--pink)', height: '4px', cursor: 'pointer' }}
            />
        </div>
    )
}
