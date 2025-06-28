# TradePro Local Setup Guide

## Prerequisites
Before starting, make sure you have these installed on your PC:

### 1. Install Python 3.11+
- Download from: https://www.python.org/downloads/
- During installation, check "Add Python to PATH"
- Verify installation: Open Command Prompt and type `python --version`

### 2. Install PostgreSQL Database
- Download from: https://www.postgresql.org/download/
- During installation, remember your password for the postgres user
- Default port: 5432

### 3. Install Git (Optional but recommended)
- Download from: https://git-scm.com/downloads

## Step-by-Step Setup

### Step 1: Download the Project
1. Download all project files to a folder on your PC (e.g., `C:\TradePro`)
2. Or use Git: `git clone [your-repo-url] TradePro`

### Step 2: Create Virtual Environment
Open Command Prompt in your project folder and run:
```bash
python -m venv venv
```

### Step 3: Activate Virtual Environment
```bash
# On Windows:
venv\Scripts\activate

# You should see (venv) at the start of your command line
```

### Step 4: Install Dependencies
```bash
pip install -r local_requirements.txt
```

### Step 5: Set Up Database
1. Open PostgreSQL command line (psql) or pgAdmin
2. Create a database:
```sql
CREATE DATABASE tradepro_db;
```
3. Create a user (optional):
```sql
CREATE USER tradepro_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE tradepro_db TO tradepro_user;
```

### Step 6: Create Environment File
Create a file named `.env` in your project folder:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/tradepro_db
SESSION_SECRET=your-super-secret-key-here-change-this
FLASK_ENV=development
```

**Important:** Replace `your_password` with your actual PostgreSQL password.

### Step 7: Initialize Database
```bash
python run_local.py
```

This will create all the necessary tables and add an admin user.

### Step 8: Run the Application
```bash
python run_local.py
```

The application will start on: http://localhost:5000

## Default Login Credentials

### Admin Account
- Email: admin@tradepro.com
- Password: admin123

### Test User Account
- Email: user@tradepro.com  
- Password: user123

## Project Structure
```
TradePro/
├── app.py              # Flask application setup
├── main.py             # Main entry point
├── run_local.py        # Local development runner
├── models.py           # Database models
├── routes.py           # All application routes
├── forms.py            # Form definitions
├── market_data.py      # Market data handling
├── templates/          # HTML templates
├── static/             # CSS, JS, images
├── .env                # Environment variables (create this)
└── requirements.txt    # Python dependencies
```

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your DATABASE_URL in .env file
- Verify database name and credentials

### Port Already in Use
- Change port in run_local.py: `app.run(port=5001)`
- Or kill the process using port 5000

### Permission Errors
- Make sure you're running Command Prompt as Administrator
- Check file permissions in your project folder

### Module Not Found Errors
- Ensure virtual environment is activated
- Re-run: `pip install -r local_requirements.txt`

## Features Available Locally

### User Features
- Account registration and login
- Demo trading with virtual money
- Live trading (starts with $0, use deposit system)
- Cryptocurrency deposits (USDT, BTC, ETH)
- Withdrawal requests
- Staking system
- Real-time market data

### Admin Features
- User management and control
- Trade outcome manipulation
- Deposit/withdrawal approval
- System analytics and reporting
- Cryptocurrency wallet address management

## Development Tips

### Making Changes
1. Edit any .py file
2. The server will automatically restart (if debug mode is on)
3. Refresh your browser to see changes

### Adding New Features
1. Models: Add to `models.py`
2. Forms: Add to `forms.py`
3. Routes: Add to `routes.py`
4. Templates: Add to `templates/` folder

### Database Changes
After modifying models.py, restart the application to create new tables.

## Security Notes
- Change SESSION_SECRET in production
- Use strong passwords for database
- Don't commit .env file to version control
- Set up HTTPS for production use

## Support
If you encounter issues:
1. Check the console output for error messages
2. Verify all prerequisites are installed
3. Ensure database is running
4. Check file permissions