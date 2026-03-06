import React from 'react';

export function Modal({ open, onClose, title, children, width = 520 }) {
    if (!open) return null
    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
                zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(2px)',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'white', borderRadius: 'var(--radius-lg, 14px)',
                    padding: '28px', width, maxWidth: '90vw',
                    boxShadow: 'var(--shadow-lg, 0 20px 60px rgba(0,0,0,0.15))',
                    maxHeight: '90vh', overflowY: 'auto',
                    display: 'flex', flexDirection: 'column'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display, "Archivo Black")', fontSize: '16px', color: 'var(--dark)' }}>{title}</div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            background: 'var(--surface-2)', border: 'none',
                            cursor: 'pointer', fontSize: '16px', color: 'var(--gray)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >×</button>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    )
}
