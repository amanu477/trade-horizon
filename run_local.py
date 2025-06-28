#!/usr/bin/env python3
"""
Local development runner for TradePro trading platform
This script sets up the database and starts the Flask application
"""

import os
import sys
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Load environment variables from .env file
load_dotenv()

# Import Flask app and database
from app import app, db
from models import User, Wallet, AdminSettings
# Import routes to register them
import routes  # noqa: F401

def create_default_users():
    """Create default admin and test users"""
    print("Creating default users...")
    
    # Create admin user
    admin = User.query.filter_by(email='admin@tradepro.com').first()
    if not admin:
        admin = User(
            username='admin',
            email='admin@tradepro.com',
            password_hash=generate_password_hash('admin123'),
            first_name='Admin',
            last_name='User',
            is_admin=True,
            is_active=True
        )
        db.session.add(admin)
        
        # Commit admin user first to get the ID
        db.session.commit()
        
        # Create admin wallet
        admin_wallet = Wallet(
            user_id=admin.id,
            balance=100000.00,  # Give admin some balance for testing
            demo_balance=100000.00
        )
        db.session.add(admin_wallet)
        print("✓ Admin user created (admin@tradepro.com / admin123)")
    
    # Create test user
    test_user = User.query.filter_by(email='user@tradepro.com').first()
    if not test_user:
        test_user = User(
            username='testuser',
            email='user@tradepro.com',
            password_hash=generate_password_hash('user123'),
            first_name='Test',
            last_name='User',
            is_admin=False,
            is_active=True
        )
        db.session.add(test_user)
        
        # Commit test user first to get the ID
        db.session.commit()
        
        # Create test user wallet
        test_wallet = Wallet(
            user_id=test_user.id,
            balance=1000.00,  # Give test user some balance
            demo_balance=10000.00
        )
        db.session.add(test_wallet)
        print("✓ Test user created (user@tradepro.com / user123)")
    
    db.session.commit()

def create_default_settings():
    """Create default admin settings"""
    print("Setting up default admin settings...")
    
    default_settings = [
        ('usdt_address', 'TXYZabcd1234567890USDT_ADDRESS_HERE', 'USDT TRC-20 deposit address'),
        ('btc_address', '1BTC_ADDRESS_HERE_1234567890abcdef', 'Bitcoin deposit address'),
        ('eth_address', '0xETH_ADDRESS_HERE_1234567890abcdef', 'Ethereum deposit address'),
    ]
    
    for key, value, description in default_settings:
        setting = AdminSettings.query.filter_by(setting_key=key).first()
        if not setting:
            setting = AdminSettings(
                setting_key=key,
                setting_value=value,
                description=description
            )
            db.session.add(setting)
    
    db.session.commit()
    print("✓ Default admin settings created")

def check_environment():
    """Check if all required environment variables are set"""
    required_vars = ['DATABASE_URL', 'SESSION_SECRET']
    missing_vars = []
    
    for var in required_vars:
        if not os.environ.get(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease create a .env file with these variables.")
        print("See LOCAL_SETUP.md for details.")
        return False
    
    return True

def main():
    """Main function to set up and run the application"""
    print("🚀 TradePro Local Setup")
    print("=" * 50)
    
    # Check environment variables
    if not check_environment():
        sys.exit(1)
    
    # Create database tables
    print("Setting up database...")
    with app.app_context():
        try:
            db.create_all()
            print("✓ Database tables created")
            
            # Create default users and settings
            create_default_users()
            create_default_settings()
            
            print("\n✅ Setup completed successfully!")
            print("\nDefault login credentials:")
            print("Admin: admin@tradepro.com / admin123")
            print("User:  user@tradepro.com / user123")
            print("\n" + "=" * 50)
            
        except Exception as e:
            print(f"❌ Database setup failed: {e}")
            sys.exit(1)
    
    # Start the Flask application
    print("Starting TradePro server...")
    print("Access the application at: http://localhost:5000")
    print("Press Ctrl+C to stop the server\n")
    
    try:
        app.run(
            host='127.0.0.1',
            port=5000,
            debug=True,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == '__main__':
    main()