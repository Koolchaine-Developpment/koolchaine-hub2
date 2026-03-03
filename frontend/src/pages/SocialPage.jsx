import React from 'react'
import { ExternalLink } from 'lucide-react'

const SocialPage = () => {
    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in font-sans">
            <header className="mb-4 flex justify-between items-center bg-brand-surface p-6 rounded-[10px] border border-brand-border shadow-sm">
                <div>
                    <h2 className="text-[26px] font-heading text-brand-dark">Réseaux sociaux</h2>
                    <p className="text-brand-text-secondary font-sans mt-1">Gérez et planifiez vos publications Instagram (Propulsé par le Content Engine IA).</p>
                </div>
                <a
                    href="/insta/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-accent-pink/10 text-accent-pink px-5 py-2.5 rounded-[6px] font-sans font-medium hover:bg-accent-pink/20 transition-colors border border-accent-pink/20 active:scale-[0.98]"
                >
                    <ExternalLink size={18} />
                    Ouvrir en plein écran
                </a>
            </header>

            <div className="flex-1 bg-brand-surface rounded-[10px] border border-brand-border shadow-sm overflow-hidden relative">
                <iframe
                    src="/insta/"
                    title="Insta Post Interface"
                    className="w-full h-full border-none absolute inset-0"
                />
            </div>
        </div>
    )
}

export default SocialPage
