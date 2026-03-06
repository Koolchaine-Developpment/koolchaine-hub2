#!/bin/bash

# =============================================================================
# Script de déploiement automatique pour Koolchaine Hub (via Rsync)
# =============================================================================

SERVER_IP="195.201.114.182"
SERVER_USER="root"
PROJECT_DIR="/opt/koolchaine-hub2"

echo "🚀 Début du déploiement de Koolchaine Hub vers $SERVER_IP..."

echo "📦 Synchronisation des fichiers locaux vers le serveur (Rsync)..."
# On crée le dossier s'il n'existe pas
ssh $SERVER_USER@$SERVER_IP "mkdir -p $PROJECT_DIR"

# Rsync de tout le code en excluant les dossiers inutiles/lourds
rsync -avz --delete \
    --exclude '.git' \
    --exclude '.env' \
    --exclude 'node_modules' \
    --exclude 'frontend/node_modules' \
    --exclude '.venv' \
    --exclude 'venv' \
    --exclude 'insta-post/venv' \
    --exclude 'insta-post/Insta post' \
    --exclude 'insta-post/media' \
    --exclude '__pycache__' \
    --exclude 'frontend/dist' \
    ./ $SERVER_USER@$SERVER_IP:$PROJECT_DIR/

echo "🌐 Connexion SSH au serveur pour redémarrer Docker..."

ssh $SERVER_USER@$SERVER_IP << EOF
    echo "📂 Navigation vers le dossier du projet..."
    cd $PROJECT_DIR || { echo "❌ Dossier non trouvé !"; exit 1; }

    echo "🏗️ Reconstruction et redémarrage des conteneurs via Docker Compose..."
    docker-compose down
    docker-compose up --build -d

    echo "🔄 Lancement de la migration de la base de données..."
    docker exec koolchaine_backend python migrate_media.py

    echo "🧹 Nettoyage des anciennes images non utilisées..."
    docker image prune -a -f

    echo "✅ Mise à jour terminée sur le serveur !"
EOF

echo "🎉 Déploiement terminé avec succès. L'application devrait être en ligne sur https://koolchaine.duckdns.org."
