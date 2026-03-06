import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, X, Calendar, Edit3, Heart, MessageCircle, ExternalLink } from 'lucide-react'

// Simple helper to format dates from ISO or YYYY-MM-DD
const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null
    try {
        const d = new Date(`${dateStr}T${timeStr || '00:00:00'}`)
        const formatter = new Intl.DateTimeFormat('fr-FR', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
        const formatted = formatter.format(d)
        return formatted.charAt(0).toUpperCase() + formatted.slice(1)
    } catch {
        return `${dateStr} ${timeStr}`
    }
}

const getRelativeTimeText = (dateStr, timeStr) => {
    if (!dateStr) return ""
    try {
        const d = new Date(`${dateStr}T${timeStr || '00:00:00'}`)
        const now = new Date()
        const diffInMs = d - now
        const diffInHours = diffInMs / (1000 * 60 * 60)

        if (diffInHours < 0) return "En cours..."
        if (diffInHours < 1) return "Imminent"
        if (diffInHours < 24) return `Dans ${Math.floor(diffInHours)} heures`
        return `Dans ${Math.floor(diffInHours / 24)} jours`
    } catch {
        return ""
    }
}

const ValidationCard = ({
    item, column,
    onValidate, onReject, onEdit, onReschedule, onCancel
}) => {
    const [showReschedule, setShowReschedule] = React.useState(false)
    const [rDate, setRDate] = React.useState(item.scheduled_date || "")
    const [rTime, setRTime] = React.useState(item.scheduled_time || "")

    // Column 3 (published) is NOT draggable. Only 1 and 2.
    const isDraggable = column === 'pending' || column === 'scheduled'

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: item.id,
        data: { item, column },
        disabled: !isDraggable
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        // Lift the card slightly when dragging
        zIndex: isDragging ? 50 : 1,
        position: 'relative'
    }

    const colColors = {
        'pending': 'bg-[#F5D647] text-yellow-900 border-[#F5D647]',
        'scheduled': 'bg-[#5B6FE8] text-white border-[#5B6FE8]',
        'published': 'bg-[#00C896] text-white border-[#00C896]'
    }

    const statusBadgeColors = {
        'pending': 'bg-[#FFF9DE] text-[#B08A00] border-[#F5D647]',
        'scheduled': 'bg-[#EEF1FF] text-[#5B6FE8] border-[#5B6FE8]/30',
        'published': 'bg-[#E6FAF4] text-[#00C896] border-[#00C896]/30'
    }

    const badgeLabel = {
        'pending': 'En attente',
        'scheduled': 'Programmé',
        'published': 'Publié'
    }[column]

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white rounded-lg border border-brand-border shadow-sm overflow-hidden mb-4 group hover:shadow-md transition-shadow cursor-default ${isDragging ? 'shadow-lg border-accent-pink' : ''}`}
        >
            {/* Draggable Handle Area (top part of the card) */}
            <div
                {...(isDraggable ? attributes : {})}
                {...(isDraggable ? listeners : {})}
                className={`p-3 border-b border-brand-border/50 flex items-start gap-3 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-[6px] bg-brand-bg flex-shrink-0 overflow-hidden border border-brand-border/50 pointer-events-none">
                    <img
                        src={`/api/v1/image/${item.filename || item.id}`}
                        alt="Thumbnail"
                        loading="lazy"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between h-16 pointer-events-none">
                    <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[4px] border ${statusBadgeColors[column]}`}>
                            {badgeLabel}
                        </span>
                    </div>

                    {column !== 'published' && item.scheduled_date && (
                        <div className="text-[11px] font-medium flex items-center gap-1.5 text-brand-text-secondary">
                            <Calendar size={12} />
                            {formatDateTime(item.scheduled_date, item.scheduled_time)}
                        </div>
                    )}

                    {column === 'published' && item.published_at && (
                        <div className="text-[11px] font-medium text-brand-text-secondary truncate">
                            Publié le {new Date(item.published_at).toLocaleDateString('fr-FR')}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Body (Non-draggable area to allow text selection / clicks) */}
            <div className="p-4">
                <p className="text-sm text-brand-text-primary leading-snug line-clamp-3 mb-4">
                    {item.caption || "Aucune légende générée."}
                </p>

                {/* Column Specific Actions */}
                {column === 'pending' && (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onValidate(item); }}
                                className="flex-1 bg-white border border-accent-green text-accent-green hover:bg-accent-green hover:text-white font-medium py-1.5 rounded-[6px] flex items-center justify-center gap-1.5 text-xs transition-colors shadow-sm"
                            >
                                <Check size={14} /> Valider
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onReject(item); }}
                                className="flex-1 bg-white border border-accent-pink text-accent-pink hover:bg-accent-pink hover:text-white font-medium py-1.5 rounded-[6px] flex items-center justify-center gap-1.5 text-xs transition-colors shadow-sm"
                            >
                                <X size={14} /> Rejeter
                            </button>
                        </div>
                        <div className="flex gap-2 border-t border-brand-border/50 pt-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(item); setShowReschedule(false); }}
                                className="flex-1 text-xs text-brand-text-secondary hover:text-brand-text-primary flex items-center justify-center gap-1.5 py-1 transition-colors"
                            >
                                <Edit3 size={12} /> Éditer
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowReschedule(!showReschedule); }}
                                className={`flex-1 text-xs flex items-center justify-center gap-1.5 py-1 ${showReschedule ? 'text-accent-blue' : 'text-brand-text-secondary hover:text-brand-text-primary'} transition-colors`}
                            >
                                <Calendar size={12} /> Reprogrammer
                            </button>
                        </div>
                        {showReschedule && (
                            <div className="p-2 mt-2 bg-brand-bg border border-brand-border rounded-[6px] animate-fade-in" onClick={e => e.stopPropagation()}>
                                <div className="flex gap-2 mb-2">
                                    <input type="date" value={rDate} onChange={e => setRDate(e.target.value)} className="flex-1 text-xs p-1 border border-brand-border rounded focus:outline-none focus:border-accent-blue" />
                                    <input type="time" value={rTime} onChange={e => setRTime(e.target.value)} className="w-[70px] text-xs p-1 border border-brand-border rounded focus:outline-none focus:border-accent-blue" />
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onReschedule(item, rDate, rTime); setShowReschedule(false); }}
                                    className="w-full text-xs font-medium text-white bg-brand-text-primary hover:bg-[#1a171c] py-1.5 rounded transition-colors"
                                >
                                    Sauvegarder la date
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {column === 'scheduled' && (
                    <div className="space-y-3">
                        <div className="bg-brand-bg rounded-[6px] p-2 text-center border border-brand-border/50">
                            <span className="text-xs font-medium text-accent-blue block">
                                {getRelativeTimeText(item.scheduled_date, item.scheduled_time)}
                            </span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onCancel(item); }}
                            className="w-full bg-white border border-brand-border text-brand-text-secondary hover:text-accent-pink hover:border-accent-pink/50 font-medium py-1.5 rounded-[6px] flex items-center justify-center gap-1.5 text-xs transition-colors shadow-sm"
                        >
                            <X size={14} /> Annuler la prog.
                        </button>
                    </div>
                )}

                {column === 'published' && (
                    <div className="flex items-center justify-between border-t border-brand-border/50 pt-3">
                        <div className="flex gap-3 text-xs font-medium text-brand-text-secondary">
                            <span className="flex items-center gap-1"><Heart size={14} className="text-accent-pink" /> {item.like_count || 0}</span>
                            <span className="flex items-center gap-1"><MessageCircle size={14} className="text-accent-blue" /> {item.comments_count || 0}</span>
                        </div>
                        {item.permalink && (
                            <a href={item.permalink} target="_blank" rel="noreferrer" className="text-accent-blue hover:underline p-1">
                                <ExternalLink size={14} />
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ValidationCard
