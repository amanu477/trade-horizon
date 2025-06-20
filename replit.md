# TradePro - Binary Options Trading Platform

## Overview
TradePro is a Flask-based binary options trading platform that provides both demo and live trading environments. The platform features user authentication, wallet management, staking functionality, and an admin dashboard for managing users and trades. It simulates real-time market data and provides a comprehensive trading experience with modern web technologies.

## System Architecture

### Backend Architecture
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: PostgreSQL (configured via environment variables)
- **Authentication**: Flask-Login with session management
- **Security**: Flask-WTF with CSRF protection
- **Deployment**: Gunicorn WSGI server with autoscaling support

### Frontend Architecture
- **UI Framework**: Bootstrap 5 with dark theme
- **Charts**: Chart.js for real-time price visualization
- **Icons**: Font Awesome for consistent iconography
- **Responsive Design**: Mobile-first responsive layout
- **JavaScript**: Vanilla ES6+ with modular class-based architecture

### Key Technologies
- Python 3.11+ runtime environment
- Flask ecosystem (Flask, Flask-SQLAlchemy, Flask-Login, Flask-WTF)
- PostgreSQL database with connection pooling
- Bootstrap 5 for responsive UI
- Chart.js for financial charting
- Gunicorn for production deployment

## Key Components

### User Management System
- User registration and authentication with email validation
- Profile management with admin privileges support
- Password hashing using Werkzeug security
- Session-based authentication with login persistence

### Trading Engine
- **Demo Trading**: Virtual money environment for practice
- **Live Trading**: Real money trading with balance management
- **Asset Support**: Multiple trading pairs (forex, crypto, commodities)
- **Trade Types**: Call/Put binary options with configurable expiry times
- **Real-time Pricing**: Simulated market data with realistic volatility

### Wallet System
- Separate demo and live balance tracking
- Transaction history and audit trails
- Deposit and withdrawal functionality
- Balance validation for trade execution

### Staking Platform
- Multiple staking plans with different APY rates and durations
- Automatic reward calculation and distribution
- Staking position management and history

### Admin Dashboard
- User management with account status controls
- Trade manipulation and outcome management
- System statistics and monitoring
- Balance adjustment capabilities

## Data Flow

### User Authentication Flow
1. User submits login credentials via WTForms
2. Flask-Login validates against hashed passwords in database
3. Session creation and user object loading
4. Route protection via login_required decorators

### Trading Flow
1. User selects asset and trade parameters via trading interface
2. JavaScript validates input and updates UI with potential profits
3. Form submission to Flask backend with CSRF protection
4. Trade validation against user balance
5. Trade record creation in database
6. Real-time price updates via simulated market data
7. Trade outcome determination and balance adjustment

### Data Persistence
- SQLAlchemy models for all entities (User, Wallet, Trade, etc.)
- Database migrations and schema management
- Connection pooling for performance optimization
- Transaction integrity for financial operations

## External Dependencies

### Frontend Dependencies
- Bootstrap 5.3.0 (CDN)
- Font Awesome 6.4.0 (CDN)
- Chart.js (CDN)

### Backend Dependencies (pyproject.toml)
- Flask 3.1.1+ with ecosystem packages
- SQLAlchemy 2.0.41+ for ORM
- psycopg2-binary for PostgreSQL connectivity
- Gunicorn 23.0.0+ for production serving
- WTForms for form handling and validation

### System Dependencies
- PostgreSQL database server
- OpenSSL for secure connections
- Python 3.11+ runtime

## Deployment Strategy

### Replit Configuration
- **Target**: Autoscale deployment
- **Runtime**: Python 3.11 with Nix package management
- **Server**: Gunicorn with port 5000 binding
- **Process**: Reload-enabled development mode
- **Networking**: ProxyFix middleware for reverse proxy support

### Environment Variables Required
- `SESSION_SECRET`: Flask session encryption key
- `DATABASE_URL`: PostgreSQL connection string

### Database Setup
- PostgreSQL instance with connection pooling
- Automatic reconnection handling (pool_pre_ping)
- Connection recycling every 300 seconds

### Production Considerations
- Gunicorn with multiple workers for scalability
- Static file serving optimization
- Database connection pool tuning
- CSRF protection enabled
- Secure session management

## Changelog
- June 20, 2025: Integrated Twelve Data API for professional-grade real-time market data
- June 20, 2025: Created exact Pocket Option replica interface with professional candlestick charts
- June 20, 2025: Implemented real-time trading interface with live trade execution
- June 20, 2025: Added professional price scales, grids, and market timing features
- June 20, 2025: Integrated real market data from Yahoo Finance for forex, crypto, commodities and stocks
- June 20, 2025: Added real-time trade tracking system with live price updates
- June 20, 2025: Fixed chart data to use actual market data instead of simulated data
- June 19, 2025: Initial setup

## User Preferences
Preferred communication style: Simple, everyday language.