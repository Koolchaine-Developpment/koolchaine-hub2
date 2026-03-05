import sys
import os
from app.db.session import engine, Base
from app.models.media_asset import MediaAsset
from app.models.sandbox_history import SandboxHistory
from app.models.contact import Contact, ContactStatus

def migrate():
    print("🚀 Démarrage de la migration manuelle...")
    try:
        # On s'assure que les modèles sont importés pour que Base.metadata les voit
        Base.metadata.create_all(bind=engine)
        print("✅ Table media_assets créée (si absente) avec succès.")
    except Exception as e:
        print(f"❌ Erreur lors de la migration : {str(e)}")

if __name__ == "__main__":
    # Ajouter le chemin racine au python path pour l'import app
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    migrate()
