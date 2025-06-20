# TradePro - Local Setup Guide

## Overview
This guide will help you set up the TradePro binary options trading platform on your local PC. The platform is built with Flask (Python), PostgreSQL database, and includes features like user authentication, trading interfaces, wallet management, and admin controls.

## Prerequisites

### 1. Install Python 3.11+
- **Windows**: Download from [python.org](https://www.python.org/downloads/)
- **macOS**: Use Homebrew: `brew install python@3.11`
- **Linux**: Use your package manager: `sudo apt install python3.11 python3.11-pip`

Verify installation:
```bash
python --version
# Should show Python 3.11.x or higher
```

### 2. Install PostgreSQL
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: Use Homebrew: `brew install postgresql`
- **Linux**: `sudo apt install postgresql postgresql-contrib`

After installation, start PostgreSQL service:
- **Windows**: Use Services app or `net start postgresql-x64-14`
- **macOS/Linux**: `sudo systemctl start postgresql` or `brew services start postgresql`

### 3. Install Git (if not already installed)
Download from [git-scm.com](https://git-scm.com/downloads)

## Setup Instructions

### Step 1: Download the Project
Create a new folder for the project and download all files:

```bash
# Create project directory
mkdir TradePro
cd TradePro

# If you have the source code, copy all files to this directory
# Make sure you have these files:
# - app.py, main.py, models.py, routes.py, forms.py, utils.py
# - pyproject.toml, uv.lock
# - templates/ folder with all HTML files
# - static/ folder with CSS and JS files
```

### Step 2: Set Up PostgreSQL Database

1. **Access PostgreSQL**:
```bash
# Connect to PostgreSQL (may need to use 'postgres' user)
psql -U postgres
```

2. **Create Database and User**:
```sql
-- Create database
CREATE DATABASE tradepro_db;

-- Create user (optional, you can use postgres user)
CREATE USER tradepro_user WITH PASSWORD 'your_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE tradepro_db TO tradepro_user;

-- Exit PostgreSQL
\q
```

### Step 3: Set Up Python Environment

1. **Create Virtual Environment**:
```bash
# Create virtual environment
python -m venv tradepro_env

# Activate virtual environment
# Windows:
tradepro_env\Scripts\activate
# macOS/Linux:
source tradepro_env/bin/activate
```

2. **Install Dependencies**:
```bash
# Install required packages
pip install flask flask-sqlalchemy flask-login flask-wtf
pip install email-validator gunicorn psycopg2-binary
pip install werkzeug wtforms sqlalchemy
```

### Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Create .env file
touch .env  # Linux/macOS
# or create manually on Windows
```

Add the following content to `.env`:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:your_postgres_password@localhost:5432/tradepro_db
# Or if you created a custom user:
# DATABASE_URL=postgresql://tradepro_user:your_password_here@localhost:5432/tradepro_db

# Flask Configuration
SESSION_SECRET=your-secret-key-here-make-it-long-and-random
FLASK_ENV=development
FLASK_DEBUG=True
```

**Important**: Replace `your_postgres_password` and `your-secret-key-here` with your actual values.

### Step 5: Update Application for Local Environment

Create a file called `run_local.py`:

```python
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app import app

if __name__ == "__main__":
    # Run with debug mode for development
    app.run(host="127.0.0.1", port=5000, debug=True)
```

Install python-dotenv for environment variable loading:
```bash
pip install python-dotenv
```

### Step 6: Initialize Database

Run the application once to create database tables:

```bash
# Make sure virtual environment is activated
python run_local.py
```

The application will automatically create all necessary database tables on first run.

### Step 7: Access the Application

1. Open your web browser
2. Navigate to: `http://localhost:5000`
3. You should see the TradePro homepage

## Default Admin Account

The application creates a default admin account:
- **Email**: `admin@trading.com`
- **Password**: `admin123`

You can use this to access the admin dashboard at `/admin/dashboard`

## Available Features

### User Features:
- **Registration/Login**: Create account or login
- **Dashboard**: Overview of account and trading activity
- **Demo Trading**: Practice trading with virtual money ($10,000 demo balance)
- **Live Trading**: Real money trading (starts with $1,000 balance)
- **Wallet**: Manage deposits, withdrawals, and view transaction history
- **Staking**: Stake funds for passive income (8-25% APY)
- **Profile**: Manage account settings

### Admin Features:
- **User Management**: View and manage all users
- **Trade Manipulation**: Control trade outcomes
- **Balance Adjustments**: Modify user balances
- **System Statistics**: View platform analytics

## Trading Assets Available:
- **Forex**: EUR/USD, GBP/USD, USD/JPY
- **Crypto**: BTC/USD, ETH/USD
- **Commodities**: Gold/USD, Crude Oil

## Troubleshooting

### Common Issues:

1. **Database Connection Error**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists

2. **Module Import Errors**:
   - Ensure virtual environment is activated
   - Reinstall packages: `pip install -r requirements.txt`

3. **Port Already in Use**:
   - Change port in `run_local.py`: `app.run(port=5001)`
   - Or kill process using port 5000

4. **Static Files Not Loading**:
   - Ensure static/ folder contains css/ and js/ subfolders
   - Check file paths in templates

### Generate Requirements File:
```bash
pip freeze > requirements.txt
```

## Development Tips

1. **Debug Mode**: Already enabled in `run_local.py`
2. **Database Reset**: Delete database and recreate if needed
3. **Code Changes**: Server auto-reloads with debug mode
4. **Logs**: Check terminal for error messages

## Security Notes

- Change SESSION_SECRET before production
- Use strong database passwords
- Never commit .env file to version control
- Consider using environment-specific configurations

## Next Steps

1. Customize the platform design and branding
2. Add real trading API integration (TradingView, etc.)
3. Implement payment processing for deposits/withdrawals
4. Add email notifications and SMS alerts
5. Enhance security with 2FA
6. Add more trading instruments and features

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed correctly
3. Ensure environment variables are set properly
4. Check database connectivity

The platform is now ready for local development and testing!