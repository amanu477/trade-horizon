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
- July 1, 2025: **Customer Support Chat Bot System** - Created comprehensive support ticket system with user chat interface, admin management panel, real-time message notifications, priority levels, and seamless integration in navigation menus for 24/7 customer service communication
- July 1, 2025: **Real Trade Distribution Analytics** - Enhanced dashboard with authentic trade statistics using real database data showing actual wins/losses, implemented colorful statistics cards displaying total trades, winning trades, win rate, and total profit/loss with dynamic color coding based on performance
- July 1, 2025: **Attractive Dashboard with Charts** - Completely redesigned user dashboard with gradient hero section, custom SVG icons, interactive Chart.js performance graphs, trade distribution charts, enhanced quick action buttons, and modern visual elements for superior user experience
- July 1, 2025: **Colorful KYC Interface Restored** - Brought back bright colorful design in KYC verification interface with vibrant warning/success/danger/info colors for statistics cards, status badges, and action buttons for enhanced visual appeal
- July 1, 2025: **Admin QR Code Upload System** - Replaced automatic QR code generation with admin file upload system where admins can upload custom QR code images for USDT/BTC/ETH deposits, providing complete control over payment QR codes displayed to users
- July 1, 2025: **KYC Dashboard Status Enhancement** - Updated dashboard to show "Pending" status for all unverified users with KYC submissions (pending or rejected) until actually approved, providing clearer user experience
- July 1, 2025: **Complete KYC Verification System** - Implemented comprehensive document verification with ID and selfie upload, admin approval workflow, QR code crypto deposits, and $50 welcome bonus for new registrations
- July 1, 2025: **Enhanced User Experience** - Added dynamic KYC status alerts on dashboard (pending/required), account navigation with verification badges, and live trading access restriction until KYC approval
- June 28, 2025: **Local Installation Support** - Fixed database setup issues in run_local.py and added complete dependency list to local_requirements.txt for clean local PC installation without Replit references
- June 28, 2025: **User Withdrawal Tracking Page** - Added comprehensive withdrawal requests page where users can view all their withdrawal requests, status updates, admin notes, and processing history with navigation menu integration
- June 28, 2025: **Automatic Withdrawal Redirect** - Users now automatically redirect to withdrawal requests page after submitting withdrawal requests to immediately see their request status
- June 28, 2025: **Cryptocurrency Withdrawal System** - Redesigned withdrawal system to match crypto deposit workflow with USDT/BTC/ETH support, wallet address entry, admin approval process, and automatic user notifications for approved/rejected requests
- June 28, 2025: **Enhanced Loss Message Display** - Updated trade loss notifications to clearly show "Trade LOSS! You lost $X.XX" instead of just showing negative amounts, providing clearer feedback to users about their losses
- June 28, 2025: **Improved Balance Validation Messages** - Changed insufficient balance notifications from red error messages to orange warning messages for better user experience and removed profile/logout buttons from admin quick actions
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
- June 28, 2025: **Live/Demo Balance Separation Fix** - Fixed critical bug where all trades were incorrectly treated as demo trades, now live trading properly affects live balance and demo trading affects demo balance based on trading mode detection
- June 28, 2025: **AJAX Trade Placement** - Replaced form submission with AJAX requests for trade placement, enabling new trades to appear in active trades list immediately without page refresh, includes real-time balance updates and success/error message notifications
- June 28, 2025: **Automatic Trade Closure System** - Implemented complete automatic trade closure when countdown reaches zero, trades now close exactly when duration expires with proper balance updates and notifications
- June 28, 2025: **95% Profit Rate Implementation** - Fixed potential profit display to always show 95% payout rate for all trades instead of 85%, providing more attractive returns for users
- June 28, 2025: **TradingView Symbol Synchronization** - Implemented automatic synchronization between TradingView chart and trade execution, so trades now use the symbol currently displayed on the chart (e.g., if USDJPY chart is open, trades execute on USDJPY)
- June 28, 2025: **Admin Trade Control Override System** - Implemented complete admin control over user trade outcomes where "Always Lose" forces all trades to lose regardless of market results, and "Always Profit" forces all trades to win with full payout, overriding actual market performance
- June 28, 2025: **Network Error and Trade Placement Fix** - Resolved network errors during trade placement with improved AJAX error handling, better JSON response parsing, and button state management to prevent double submissions
- June 28, 2025: **Enhanced Countdown Timer Display** - Fixed countdown timer to show proper remaining time with immediate updates, improved trade expiration detection, and automatic trade removal when duration ends
- June 28, 2025: **JavaScript Error Handling Fix** - Fixed critical "Cannot read properties of null" error that was preventing trades from automatically closing, added proper null checks for DOM elements
- June 28, 2025: **Restored Original Trading Interface** - Returned to previous TradingView professional interface while maintaining all automatic trade closure fixes and improved error handling for robust operation
- June 28, 2025: **Automatic Trade Closure System** - Implemented complete automatic trade closure when countdown reaches zero, trades now close exactly when duration expires with proper balance updates and notifications
- June 28, 2025: **Trade Processing Data Type Fix** - Fixed critical Decimal/float data type error that prevented trades from closing properly, ensuring countdown timers work correctly and trades close when duration ends
- June 28, 2025: **Trading Page Balance Updates** - Fixed balance display to automatically update when trades profit or lose, includes visual effects (green for profit, red for loss) and detailed notifications showing exact profit/loss amounts
- June 28, 2025: **Countdown Timer Fix** - Fixed critical issue where active trades showed "expired" immediately instead of counting down, now trades properly display remaining time with live countdown based on duration
- June 28, 2025: **Trade Duration Input System** - Replaced time-based expiry input with simple seconds-based duration field, removed AM/PM formatting, added quick duration buttons (5s, 30s, 1m, 5m), and updated JavaScript to handle duration instead of time format for more intuitive trade setup
- June 28, 2025: **Duration-Based Trade Expiry System** - Completely redesigned trading system to use precise duration timing where trades stay active for exact time specified (e.g., 5 seconds), automatically close with profit/loss determination, and move to trade history with proper balance updates
- June 28, 2025: **Enhanced Trading Interface** - Updated live trading to use real wallet balance synchronization, implemented HH:MM:SS time format for trade expiry input, improved trade expiration logic to only process trades when actually expired, and fixed balance updates after trade completion
- June 28, 2025: **Streamlined Cryptocurrency Deposit System** - Implemented professional crypto-only deposit workflow with USDT TRC-20, Bitcoin, and Ethereum support including admin-set wallet addresses, QR code generation, proof upload, and manual approval process with simplified user experience (removed transaction hash requirement and reduced processing time to 1-30 minutes)
- June 28, 2025: **Admin Deposit Management** - Added comprehensive admin interface for processing deposit requests with blockchain verification, proof document review, and balance crediting functionality
- June 28, 2025: **Crypto Settings Panel** - Created admin configuration system for setting cryptocurrency wallet addresses with security guidelines and address validation
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