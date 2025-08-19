from app import app, db, Company, Layer, User, Project, SharedMap
from datetime import datetime, timedelta
import os
import glob

def run_cleanup():
    """
    Este script deve ser executado periodicamente (ex: uma vez por dia via Cron Job)
    para remover dados de empresas com assinaturas expiradas há mais de 60 dias.
    """
    with app.app_context():
        print(f"[{datetime.utcnow()}] Iniciando script de limpeza...")

        sixty_days_ago = datetime.utcnow() - timedelta(days=60)

        companies_to_delete = Company.query.filter(Company.expiry_date != None, Company.expiry_date < sixty_days_ago).all()

        if not companies_to_delete:
            print("Nenhuma empresa para limpar.")
            return

        for company in companies_to_delete:
            print(f"-> Processando empresa expirada: {company.name} (ID: {company.id})")

            layers = Layer.query.filter_by(company_id=company.id).all()
            for layer in layers:
                base_path = os.path.join(app.config['DATA_DIR'], os.path.splitext(layer.filename)[0])
                for filepath in glob.glob(f"{base_path}.*"):
                    try:
                        os.remove(filepath)
                    except OSError as e:
                        print(f"    - Erro ao remover {filepath}: {e}")

            print(f"-> Deletando registro da empresa e dados associados do banco de dados...")
            user_ids_to_delete = [user.id for user in User.query.filter_by(company_id=company.id).all()]
            SharedMap.query.filter(SharedMap.owner_id.in_(user_ids_to_delete)).delete(synchronize_session=False)
            Layer.query.filter_by(company_id=company.id).delete(synchronize_session=False)
            Project.query.filter_by(company_id=company.id).delete(synchronize_session=False)
            User.query.filter_by(company_id=company.id).delete(synchronize_session=False)

            db.session.delete(company)

        db.session.commit()
        print(f"Limpeza completa. {len(companies_to_delete)} empresa(s) removida(s).")

if __name__ == '__main__':
    run_cleanup()