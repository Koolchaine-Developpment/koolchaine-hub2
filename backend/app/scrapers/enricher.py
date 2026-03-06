"""
Waterfall enrichment pour trouver l'email d'un contact.
4 tentatives dans l'ordre :
1. Scraping site web — cherche mailto: et pages /contact /equipe
2. Pattern matching — génère prenom.nom@domaine.fr, pnom@, p.nom@
3. Vérification SMTP légère — check MX + RCPT TO
4. Google search — query "prénom nom @domaine.fr"
"""

import re
import socket
import smtplib
import httpx
import dns.resolver
from typing import Optional, Dict


def try_scrape_site(domaine: str) -> Optional[str]:
    """Tente de trouver un email sur le site web de l'entreprise."""
    if not domaine:
        return None
    
    urls_to_try = [
        f"https://{domaine}",
        f"https://{domaine}/contact",
        f"https://{domaine}/equipe",
        f"https://{domaine}/about",
        f"https://www.{domaine}",
        f"https://www.{domaine}/contact",
    ]
    
    email_pattern = re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}')
    
    for url in urls_to_try:
        try:
            with httpx.Client(timeout=5.0, follow_redirects=True) as client:
                resp = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                if resp.status_code == 200:
                    emails = email_pattern.findall(resp.text)
                    # Filtrer les emails génériques et garder les professionnels
                    for email in emails:
                        lower = email.lower()
                        if domaine.lower() in lower and not any(g in lower for g in ['noreply', 'no-reply', 'info@', 'contact@', 'support@', 'admin@']):
                            return email
        except Exception:
            continue
    
    return None


def try_pattern_matching(prenom: str, nom: str, domaine: str) -> Optional[str]:
    """Génère des emails candidats par pattern matching."""
    if not all([prenom, nom, domaine]):
        return None
    
    p = prenom.lower().strip()
    n = nom.lower().strip()
    
    # Normaliser les caractères accentués
    import unicodedata
    def normalize(s):
        return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    
    p = normalize(p)
    n = normalize(n)
    
    patterns = [
        f"{p}.{n}@{domaine}",
        f"{p}{n}@{domaine}",
        f"{p[0]}.{n}@{domaine}",
        f"{p[0]}{n}@{domaine}",
        f"{n}.{p}@{domaine}",
        f"{p}@{domaine}",
    ]
    
    # Vérifier via MX si le domaine accepte des emails
    try:
        dns.resolver.resolve(domaine, 'MX')
        # Le domaine a des MX records, retourner le pattern le plus commun
        return patterns[0]  # prenom.nom@domaine
    except Exception:
        return None


def try_smtp_verify(prenom: str, nom: str, domaine: str) -> Optional[str]:
    """Vérification SMTP légère — connexion sans envoi."""
    if not domaine:
        return None
    
    import unicodedata
    def normalize(s):
        return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    
    p = normalize(prenom.lower().strip())
    n = normalize(nom.lower().strip())
    email_candidate = f"{p}.{n}@{domaine}"
    
    try:
        # Résoudre le MX
        mx_records = dns.resolver.resolve(domaine, 'MX')
        mx_host = str(sorted(mx_records, key=lambda r: r.preference)[0].exchange).rstrip('.')
        
        # Connexion SMTP
        with smtplib.SMTP(mx_host, 25, timeout=5) as smtp:
            smtp.helo("koolchaine.fr")
            smtp.mail("test@koolchaine.fr")
            code, _ = smtp.rcpt(email_candidate)
            if code == 250:
                return email_candidate
    except Exception:
        pass
    
    return None


def try_google_search(prenom: str, nom: str, domaine: str) -> Optional[str]:
    """Recherche Google pour trouver l'email (scraping léger)."""
    if not all([prenom, nom]):
        return None
    
    query = f'"{prenom} {nom}" "@{domaine}" email'
    
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(
                "https://www.google.com/search",
                params={"q": query, "num": 5},
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            )
            if resp.status_code == 200:
                email_pattern = re.compile(r'[a-zA-Z0-9._%+-]+@' + re.escape(domaine))
                emails = email_pattern.findall(resp.text)
                if emails:
                    return emails[0]
    except Exception:
        pass
    
    return None


def waterfall_email(prenom: str, nom: str, domaine: str) -> Dict:
    """
    Exécute le waterfall complet.
    Retourne : { email, source, confidence }
    """
    if not domaine:
        return {"email": None, "source": None, "confidence": 0}
    
    # Tentative 1 — scraping site
    result = try_scrape_site(domaine)
    if result:
        return {"email": result, "source": "web", "confidence": 0.9}
    
    # Tentative 2 — pattern matching
    result = try_pattern_matching(prenom, nom, domaine)
    if result:
        return {"email": result, "source": "pattern", "confidence": 0.7}
    
    # Tentative 3 — vérification SMTP
    result = try_smtp_verify(prenom, nom, domaine)
    if result:
        return {"email": result, "source": "smtp", "confidence": 0.85}
    
    # Tentative 4 — Google search
    result = try_google_search(prenom, nom, domaine)
    if result:
        return {"email": result, "source": "google", "confidence": 0.6}
    
    return {"email": None, "source": None, "confidence": 0}
