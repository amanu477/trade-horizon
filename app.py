import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

# Initialize extensions
db = SQLAlchemy(model_class=Base)
login_manager = LoginManager()
csrf = CSRFProtect()

def create_app():
    # Create Flask app
    app = Flask(__name__)
    
    # Configuration
    app.secret_key = os.environ.get("SESSION_SECRET")
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
    
    # Database configuration
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_recycle": 300,
        "pool_pre_ping": True,
    }
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    csrf.init_app(app)
    
    # Login manager configuration
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'info'
    
    @login_manager.user_loader
    def load_user(user_id):
        from models import User
        return User.query.get(int(user_id))
    
    # Create tables
    with app.app_context():
        import models  # noqa: F401
        db.create_all()
        
        # Create default admin user if not exists
        from models import User
        from werkzeug.security import generate_password_hash
        
        admin = User.query.filter_by(email='admin@trading.com').first()
        if not admin:
            admin_user = User(
                username='admin',
                email='admin@trading.com',
                password_hash=generate_password_hash('admin123'),
                is_admin=True,
                is_active=True
            )
            db.session.add(admin_user)
            db.session.commit()
            logging.info("Default admin user created")
    
    return app

# Create app instance
app = create_app()
