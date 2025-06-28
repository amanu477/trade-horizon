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
- June 28, 2025: **Unified Admin Experience** - Removed duplicate dashboards and streamlined admin workflow so admin users see only the analytics dashboard, eliminating confusion between user and admin interfaces
- June 28, 2025: **Direct Admin Login Flow** - Admin users now redirect directly to analytics dashboard upon login instead of the regular user dashboard, creating a dedicated admin experience
- June 28, 2025: **Simplified Navigation** - Updated navigation menu to show different options for admin vs regular users, with admin-specific menu items highlighted in warning color
- June 28, 2025: **Advanced Admin Analytics Dashboard** - Completely redesigned admin interface with comprehensive user reporting including registration trends, engagement metrics, login activity analysis, and 30-day growth statistics with visual progress indicators
- June 28, 2025: **User Registration Analytics** - Admin dashboard now provides detailed registration tracking with daily/weekly/monthly breakdowns, user status distribution with progress bars, and engagement rate calculations
- June 28, 2025: **Admin Trade Control System** - Added comprehensive trade management allowing administrators to view all user trades (active and closed) and force trade outcomes with instant win/loss manipulation
- June 28, 2025: **Enhanced User Reporting** - Admin panel displays advanced metrics including total registered users, activation rates, daily activity tracking, weekly engagement percentages, and comprehensive user status breakdowns
- June 28, 2025: **System Status Monitoring** - Admin dashboard includes platform statistics showing total trades, active traders, demo users, live users, and real-time system health indicators
- June 28, 2025: **Active Trades System** - Implemented complete active trades management with real-time countdown timers, automatic trade processing on expiration, and trade history system
- June 28, 2025: **Automatic Trade Closure** - Trades automatically close when time expires, calculate win/loss based on market price, update user balance, and move to trade history
- June 28, 2025: **Restored User Dashboard** - Brought back full user dashboard experience with wallet balances, trading statistics, active trades, recent trade history, staking positions, and quick action buttons for all user features
- June 28, 2025: **Enhanced User Navigation** - Restored complete navigation menu for regular users with trading dropdown (demo/live), wallet, staking, and profile access while maintaining separate admin navigation
- June 28, 2025: **User Deletion System** - Added admin capability to permanently delete users and all associated data (trades, wallet, transactions, staking positions) with safety measures preventing admin and self-deletion
- June 28, 2025: **Admin Trade Control System** - Implemented comprehensive user trade outcome control allowing admins to set users to "Always Lose", "Always Profit", or "Normal Trading" with automatic trade processing that respects these settings regardless of market conditions
- June 28, 2025: **Trade Result Labels Update** - Changed all "WON" to "PROFIT" and "LOST" to "LOSE" throughout admin panels, user profiles, and trade displays for clearer terminology
- June 28, 2025: **Complete Order Type Update** - Changed all "CALL" to "BUY" and "PUT" to "SELL" throughout the entire application including admin panels, user interfaces, trading displays, and JavaScript components for consistent terminology
- June 28, 2025: **Trading Button Update** - Replaced "Call" with "Buy" and "Put" with "Sell" buttons for more intuitive trading
- June 28, 2025: **Direct Trade Execution** - Buy and Sell buttons now execute trades immediately without requiring separate "Place Trade" button
- June 28, 2025: Removed Place Trade button and simplified trading workflow for faster execution
- June 28, 2025: **Interface Simplification** - Removed symbol selector, price display, and payout percentage from brown header bar for cleaner design
- June 28, 2025: Cleaned up JavaScript code removing references to deleted UI elements and event listeners
- June 28, 2025: Updated TradingView integration to work without external dropdown synchronization
- June 28, 2025: **Major Update** - Replaced custom chart with full TradingView professional widget integration
- June 28, 2025: Implemented complete TradingView charting solution with advanced technical analysis tools
- June 28, 2025: Created professional trading interface layout matching industry standards
- June 28, 2025: Integrated TradingView's real-time data feeds and professional indicators
- June 20, 2025: Enhanced chart panning with improved mouse drag functionality and touch support for mobile
- June 20, 2025: Implemented custom expiry time input allowing users to set any duration (1 minute to 24 hours)
- June 20, 2025: Integrated real market data from Twelve Data API replacing simulated data
- June 20, 2025: Added advanced chart features - timeframes (1m, 5m, 15m, 1h, 4h, 1d), zoom in/out controls, and pan functionality
- June 20, 2025: Implemented trade position visualization on charts with entry price lines and position markers
- June 20, 2025: Fixed CSRF token issues for successful trade execution
- June 20, 2025: Created fast-loading trading interface with immediate chart rendering
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