import React from 'react';

export function EmptyState({ icon, title, description, action }) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '48px 24px', gap: '12px',
            color: 'var(--gray)',
        }}>
            {icon && <div style={{ fontSize: '32px', opacity: 0.4 }}>{icon}</div>}
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)' }}>{title}</div>
            {description && <div style={{ fontSize: '13px', textAlign: 'center', maxWidth: '280px' }}>{description}</div>}
            {action}
        </div>
    )
}
