#!/bin/bash

# =============================================================================
# Script de déploiement automatique pour Koolchaine Hub
# =============================================================================

SERVER_IP="195.201.114.182"
SERVER_USER="root"
PROJECT_DIR="/opt/koolchaine-hub" # Ajuste si ton dossier s'appelle koolchaine-hub2
BRANCH="main"

echo "🚀 Début du déploiement de Koolchaine Hub vers $SERVER_IP..."

# 1. Optionnel : S'assurer que le code local est pushé
read -p "Veux-tu push les modifications locales vers GitHub avant de déployer ? (y/n) " push_code
if [[ "$push_code" == "y" || "$push_code" == "Y" ]]; then
    echo "📦 Envoi du code vers GitHub..."
    git push origin $BRANCH
fi

echo "🌐 Connexion SSH au serveur..."

# 2. Exécution des commandes sur le serveur VPS
ssh $SERVER_USER@$SERVER_IP << EOF
    echo "📂 Navigation vers le dossier du projet..."
    cd $PROJECT_DIR || { echo "❌ Dossier non trouvé !"; exit 1; }

    echo "📥 Récupération des dernières modifications..."
    git pull origin $BRANCH

    echo "🏗️  Reconstruction et redémarrage des conteneurs via Docker Compose..."
    docker-compose down
    docker-compose up --build -d

    echo "🧹 Nettoyage des anciennes images non utilisées..."
    docker image prune -a -f

    echo "✅ Mise à jour terminée sur le serveur !"
EOF

echo "🎉 Déploiement terminé avec succès. L'application devrait être en ligne sur https://koolchaine.duckdns.org."
