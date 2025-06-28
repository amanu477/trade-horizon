from flask import render_template, redirect, url_for, flash, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta
from decimal import Decimal
import random
import json

from app import app, db
from models import User, Wallet, Trade, StakingPosition, Transaction, MarketData
from forms import LoginForm, RegisterForm, TradeForm, StakingForm, WithdrawForm, DepositForm, AdminUserForm
from utils import generate_market_price, get_asset_price
from market_data import market_data
from payout_manager import payout_manager
try:
    from twelve_data_integration import twelve_data_api
except ImportError:
    twelve_data_api = None
import logging

# Configure logging for debugging
logging.basicConfig(level=logging.DEBUG)

@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and check_password_hash(user.password_hash, form.password.data):
            if not user.is_active:
                flash('Your account has been deactivated. Please contact support.', 'error')
                return render_template('login.html', form=form)
            
            login_user(user)
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('dashboard'))
        else:
            flash('Invalid email or password', 'error')
    
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
            password_hash=generate_password_hash(form.password.data)
        )
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create wallet for new user
        wallet = Wallet(user_id=user.id)
        db.session.add(wallet)
        
        # Create welcome transaction
        transaction = Transaction(
            user_id=user.id,
            transaction_type='deposit',
            amount=1000.00,
            description='Welcome bonus'
        )
        db.session.add(transaction)
        
        db.session.commit()
        
        flash('Registration successful! You can now log in.', 'success')
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
    total_trades = Trade.query.filter_by(user_id=current_user.id).count()
    won_trades = Trade.query.filter_by(user_id=current_user.id, status='won').count()
    win_rate = (won_trades / total_trades * 100) if total_trades > 0 else 0
    
    # Get active trades
    active_trades = Trade.query.filter_by(user_id=current_user.id, status='active').all()
    
    return render_template('dashboard.html', 
                         wallet=wallet, 
                         recent_trades=recent_trades,
                         active_trades=active_trades,
                         active_staking=active_staking,
                         total_staking_rewards=total_staking_rewards,
                         total_trades=total_trades,
                         win_rate=win_rate)

@app.route('/trading/demo')
@login_required
def demo_trading():
    form = TradeForm()
    return render_template('trading/demo.html', form=form, is_demo=True)

@app.route('/trading/live')
@login_required
def live_trading():
    wallet = current_user.wallet
    if not wallet or wallet.balance < 1:
        flash('Insufficient balance for live trading. Please deposit funds.', 'error')
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
            
        try:
            expiry_minutes = int(data.get('expiry_minutes', 1))
        except (ValueError, TypeError):
            expiry_minutes = 1
            
        # Default to demo mode for now
        is_demo = True
        
        logging.info(f"Parsed trade: asset={asset}, type={trade_type}, amount={amount}, expiry={expiry_minutes}, demo={is_demo}")
        
        # Validation
        if not asset or not trade_type or amount <= 0:
            error_msg = f'Invalid trade parameters: asset={asset}, type={trade_type}, amount={amount}'
            logging.error(error_msg)
            return jsonify({'success': False, 'message': 'Invalid trade parameters'}), 400
        
        # Check balance
        wallet = current_user.wallet
        if not wallet:
            logging.error(f"No wallet found for user {current_user.id}")
            return jsonify({'success': False, 'message': 'Wallet not found'}), 400
            
        available_balance = wallet.demo_balance if is_demo else wallet.balance
        logging.info(f"User balance check: available={available_balance}, required={amount}, demo={is_demo}")
        
        if available_balance < amount:
            message = 'Insufficient balance for this trade'
            logging.error(f"Insufficient balance: {available_balance} < {amount}")
            return jsonify({'success': False, 'message': message}), 400
        
        # Get current market price
        try:
            market_info = market_data.get_real_price(asset)
            if isinstance(market_info, dict) and 'price' in market_info:
                entry_price = market_info['price']
            else:
                entry_price = market_info
        except:
            entry_price = get_asset_price(asset)
        
        # Calculate expiry time
        expiry_time = datetime.utcnow() + timedelta(minutes=expiry_minutes)
        
        # Get payout percentage
        try:
            payout_percentage = payout_manager.get_current_payout(asset, expiry_minutes)
        except:
            payout_percentage = 85.0
        
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
        
        return jsonify({'success': False, 'message': error_message}), 500

@app.route('/place_trade_old', methods=['POST'])
@login_required
def place_trade_old():
    form = TradeForm()
    if form.validate_on_submit():
        is_demo = request.form.get('is_demo') == 'true'
        wallet = current_user.wallet
        
        # Check balance
        balance_to_check = wallet.demo_balance if is_demo else wallet.balance
        if balance_to_check < form.amount.data:
            flash('Insufficient balance', 'error')
            return redirect(request.referrer)
        
        # Get real current market price
        current_price = market_data.get_real_price(form.asset.data)
        
        # Create trade
        expiry_minutes = int(form.expiry_minutes.data)
        expiry_time = datetime.utcnow() + timedelta(minutes=expiry_minutes)
        
        # Get real-time payout percentage
        payout_percentage = payout_manager.get_current_payout(form.asset.data, expiry_minutes)
        
        trade = Trade(
            user_id=current_user.id,
            asset=form.asset.data,
            trade_type=form.trade_type.data,
            amount=form.amount.data,
            entry_price=current_price,
            expiry_time=expiry_time,
            payout_percentage=payout_percentage,
            is_demo=is_demo
        )
        
        # Deduct amount from balance
        if is_demo:
            wallet.demo_balance -= form.amount.data
        else:
            wallet.balance -= form.amount.data
        
        # Create transaction
        transaction = Transaction(
            user_id=current_user.id,
            transaction_type='trade',
            amount=-form.amount.data,
            description=f'{form.trade_type.data.title()} {form.asset.data} - {expiry_minutes}min'
        )
        
        db.session.add(trade)
        db.session.add(transaction)
        db.session.commit()
        
        flash(f'Trade placed successfully! {form.trade_type.data.title()} {form.asset.data} for ${form.amount.data} (Payout: {payout_percentage}%)', 'success')
        return redirect(url_for('demo_trading' if is_demo else 'live_trading'))
    
    flash('Invalid trade parameters', 'error')
    return redirect(request.referrer)

@app.route('/wallet')
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

@app.route('/deposit', methods=['POST'])
@login_required
def deposit():
    form = DepositForm()
    if form.validate_on_submit():
        wallet = current_user.wallet
        wallet.balance += form.amount.data
        wallet.total_invested += form.amount.data
        
        transaction = Transaction(
            user_id=current_user.id,
            transaction_type='deposit',
            amount=form.amount.data,
            description=f'Deposit via {form.method.data}'
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        flash(f'Successfully deposited ${form.amount.data}', 'success')
    else:
        flash('Invalid deposit amount', 'error')
    
    return redirect(url_for('wallet'))

@app.route('/withdraw', methods=['POST'])
@login_required
def withdraw():
    form = WithdrawForm()
    if form.validate_on_submit():
        wallet = current_user.wallet
        
        if wallet.balance < form.amount.data:
            flash('Insufficient balance', 'error')
        else:
            wallet.balance -= form.amount.data
            wallet.total_withdrawn += form.amount.data
            
            transaction = Transaction(
                user_id=current_user.id,
                transaction_type='withdrawal',
                amount=-form.amount.data,
                description=f'Withdrawal via {form.method.data}',
                status='pending'
            )
            
            db.session.add(transaction)
            db.session.commit()
            
            flash(f'Withdrawal request for ${form.amount.data} submitted successfully', 'success')
    else:
        flash('Invalid withdrawal amount', 'error')
    
    return redirect(url_for('wallet'))

@app.route('/staking')
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

@app.route('/profile')
@login_required
def profile():
    return render_template('profile.html')

# Admin Routes
@app.route('/admin')
@login_required
def admin_dashboard():
    if not current_user.is_admin:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    total_trades = Trade.query.count()
    active_trades = Trade.query.filter_by(status='active').count()
    
    return render_template('admin/dashboard.html',
                         total_users=total_users,
                         active_users=active_users,
                         total_trades=total_trades,
                         active_trades=active_trades)

@app.route('/admin/users')
@login_required
def admin_users():
    if not current_user.is_admin:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template('admin/users.html', users=users)

@app.route('/admin/users/<int:user_id>/edit', methods=['POST'])
@login_required
def admin_edit_user(user_id):
    if not current_user.is_admin:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    user = User.query.get_or_404(user_id)
    form = AdminUserForm()
    
    if form.validate_on_submit():
        user.is_active = form.is_active.data
        user.is_admin = form.is_admin.data
        
        if form.balance_adjustment.data != 0:
            wallet = user.wallet
            if wallet:
                wallet.balance += form.balance_adjustment.data
                
                transaction = Transaction(
                    user_id=user.id,
                    transaction_type='adjustment',
                    amount=form.balance_adjustment.data,
                    description=f'Admin balance adjustment by {current_user.username}'
                )
                db.session.add(transaction)
        
        db.session.commit()
        flash(f'User {user.username} updated successfully', 'success')
    
    return redirect(url_for('admin_users'))

@app.route('/admin/orders')
@login_required
def admin_orders():
    if not current_user.is_admin:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    trades = Trade.query.order_by(Trade.created_at.desc()).limit(100).all()
    return render_template('admin/orders.html', trades=trades)

@app.route('/admin/orders/<int:trade_id>/manipulate', methods=['POST'])
@login_required
def admin_manipulate_trade(trade_id):
    if not current_user.is_admin:
        flash('Access denied', 'error')
        return redirect(url_for('dashboard'))
    
    trade = Trade.query.get_or_404(trade_id)
    action = request.form.get('action')
    
    if action == 'force_win':
        trade.status = 'won'
        trade.profit_loss = float(trade.amount) * (float(trade.payout_percentage) / 100)
        trade.closed_at = datetime.utcnow()
        
        # Credit user wallet
        wallet = trade.user.wallet
        if trade.is_demo:
            wallet.demo_balance += trade.amount + trade.profit_loss
        else:
            wallet.balance += trade.amount + trade.profit_loss
            
    elif action == 'force_lose':
        trade.status = 'lost'
        trade.profit_loss = -float(trade.amount)
        trade.closed_at = datetime.utcnow()
    
    elif action == 'cancel':
        trade.status = 'cancelled'
        trade.closed_at = datetime.utcnow()
        
        # Refund user
        wallet = trade.user.wallet
        if trade.is_demo:
            wallet.demo_balance += trade.amount
        else:
            wallet.balance += trade.amount
    
    db.session.commit()
    flash(f'Trade {trade_id} {action} successfully', 'success')
    return redirect(url_for('admin_orders'))

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
    """Get real market data for symbol"""
    try:
        market_info = market_data.get_market_info(symbol)
        return jsonify(market_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chart-data-new/<symbol>')
def api_chart_data_new(symbol):
    """Get real chart data for trading interface"""
    try:
        period = request.args.get('period', '1d')
        interval = request.args.get('interval', '5m')
        
        chart_data = market_data.get_historical_data(symbol, period, interval)
        
        return jsonify({
            'symbol': symbol,
            'data': chart_data,
            'period': period,
            'interval': interval
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.context_processor
def inject_global_vars():
    """Inject global variables into all templates"""
    return {
        'current_year': datetime.utcnow().year,
        'app_name': 'TradePro'
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

@app.route('/api/active_trades')
@login_required
def api_active_trades():
    """Get user's active trades"""
    try:
        # First, process any expired trades
        process_expired_trades_for_user(current_user.id)
        
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
        
        for trade in expired_trades:
            try:
                # Get current price for the asset
                current_price_data = market_data.get_real_price(trade.asset)
                if current_price_data and 'price' in current_price_data:
                    current_price = float(current_price_data['price'])
                else:
                    # Use fallback price if real data unavailable
                    current_price = float(trade.entry_price) * (1 + random.uniform(-0.005, 0.005))
                
                # Calculate trade result
                trade.exit_price = current_price
                trade.closed_at = datetime.utcnow()
                
                # Determine win/loss
                if trade.trade_type == 'call':
                    is_winner = current_price > float(trade.entry_price)
                else:  # put
                    is_winner = current_price < float(trade.entry_price)
                
                # Update trade status and profit/loss
                if is_winner:
                    trade.status = 'won'
                    trade.profit_loss = float(trade.amount) * (float(trade.payout_percentage) / 100)
                else:
                    trade.status = 'lost'
                    trade.profit_loss = -float(trade.amount)
                
                # Update user wallet balance
                wallet = Wallet.query.filter_by(user_id=trade.user_id).first()
                if wallet:
                    if trade.is_demo:
                        wallet.demo_balance = float(wallet.demo_balance) + float(trade.amount) + float(trade.profit_loss)
                    else:
                        wallet.balance = float(wallet.balance) + float(trade.amount) + float(trade.profit_loss)
                    
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
