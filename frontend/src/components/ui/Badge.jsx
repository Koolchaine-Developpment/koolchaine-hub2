import React from 'react';

const BADGE_STYLES = {
    actif: { bg: 'rgba(0,200,150,0.12)', color: '#00A878', dot: '#00C896' },
    pause: { bg: 'rgba(245,214,71,0.15)', color: '#9A8800', dot: '#F5D647' },
    sync: { bg: 'rgba(91,111,232,0.12)', color: '#3D55D4', dot: '#5B6FE8' },
    bientot: { bg: 'rgba(155,148,153,0.15)', color: 'var(--gray)', dot: 'var(--gray)' },
    nouveau: { bg: 'rgba(245,57,90,0.08)', color: 'var(--pink)', dot: 'var(--pink)' },
    valide: { bg: 'rgba(0,200,150,0.12)', color: '#00A878', dot: '#00C896' },
    envoye: { bg: 'rgba(91,111,232,0.12)', color: '#3D55D4', dot: '#5B6FE8' },
    repondu: { bg: 'rgba(159,90,232,0.12)', color: '#7B3FBF', dot: '#9F5AE8' },
    rejete: { bg: 'rgba(155,148,153,0.1)', color: 'var(--gray)', dot: 'var(--gray)' },
}

export function Badge({ type, label, dot = true }) {
    const style = BADGE_STYLES[type.toLowerCase()] ?? BADGE_STYLES.nouveau
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: 'var(--radius-xl, 20px)',
            background: style.bg, color: style.color,
            fontSize: '11px', fontWeight: 600,
        }}>
            {dot && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: style.dot, flexShrink: 0 }} />}
            {label}
        </span>
    )
}
