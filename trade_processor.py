"""
Trade processing and management system for TradePro
Handles automatic trade closure and profit/loss calculations
"""

from datetime import datetime
from app import app, db
from models import Trade, User, Wallet, Transaction
from market_data import market_data

def process_expired_trades():
    """Process all expired trades and update user balances"""
    with app.app_context():
        # Get all active trades that have expired
        now = datetime.utcnow()
        expired_trades = Trade.query.filter(
            Trade.status == 'active'
        ).filter(
            Trade.expiry_time <= now
        ).all()
        
        for trade in expired_trades:
            try:
                # Get user and check trade control settings
                user = User.query.get(trade.user_id)
                trade_control = user.trade_control if user else 'normal'
                
                print(f"Processing trade {trade.id} for user {user.username if user else 'Unknown'}")
                print(f"User trade control setting: {trade_control}")
                
                # Get current market price
                current_price = market_data.get_real_price(trade.asset)
                
                # Apply admin trade control overrides
                if trade_control == 'always_lose':
                    # Force trade to lose regardless of market price
                    print(f"FORCING TRADE {trade.id} TO LOSE (admin control)")
                    trade.status = 'lose'
                    trade.exit_price = current_price
                    trade.profit_loss = -trade.amount
                elif trade_control == 'always_profit':
                    # Force trade to win regardless of market price
                    print(f"FORCING TRADE {trade.id} TO WIN (admin control)")
                    trade.status = 'profit'
                    trade.exit_price = current_price
                    trade.profit_loss = trade.amount * (trade.payout_percentage / 100)
                else:
                    # Normal trading - calculate result based on market price
                    print(f"Processing trade {trade.id} normally")
                    trade.calculate_result(current_price)
                
                print(f"Trade {trade.id} final status: {trade.status}, P/L: {trade.profit_loss}")
                
                # Update user wallet based on trade result
                user = User.query.get(trade.user_id)
                if user and user.wallet:
                    wallet = user.wallet
                    
                    if trade.status == 'profit':
                        # Calculate total return (original amount + profit)
                        profit_amount = trade.amount * (trade.payout_percentage / 100)
                        total_return = trade.amount + profit_amount
                        
                        if trade.is_demo:
                            wallet.demo_balance += total_return
                        else:
                            wallet.balance += total_return
                        
                        # Create profit transaction
                        transaction = Transaction()
                        transaction.user_id = user.id
                        transaction.transaction_type = 'trade_profit'
                        transaction.amount = total_return
                        transaction.description = f'Profit: {trade.trade_type.upper()} {trade.asset} trade - Won ${profit_amount:.2f}'
                        db.session.add(transaction)
                        trade.profit_loss = profit_amount
                        
                    elif trade.status == 'lose':
                        # For losing trades, the amount was already deducted when trade was placed
                        # Just record the loss transaction
                        transaction = Transaction()
                        transaction.user_id = user.id
                        transaction.transaction_type = 'trade_loss'
                        transaction.amount = -trade.amount
                        transaction.description = f'Loss: {trade.trade_type.upper()} {trade.asset} trade - Lost ${trade.amount:.2f}'
                        db.session.add(transaction)
                        trade.profit_loss = -trade.amount
                
                trade.closed_at = now
                
                print(f"Processed trade {trade.id}: {trade.status} - P/L: ${trade.profit_loss:.2f}")
                
            except Exception as e:
                print(f"Error processing trade {trade.id}: {e}")
                continue
        
        if expired_trades:
            db.session.commit()
            print(f"Processed {len(expired_trades)} expired trades")

def get_active_trades_with_current_prices():
    """Get all active trades with current market prices"""
    active_trades = Trade.query.filter_by(status='active').all()
    
    trades_data = []
    for trade in active_trades:
        current_price = market_data.get_real_price(trade.asset)
        
        # Calculate potential outcome
        if trade.trade_type == 'call':
            is_winning = current_price > trade.entry_price
        else:  # put
            is_winning = current_price < trade.entry_price
        
        time_remaining = trade.expiry_time - datetime.utcnow()
        
        trades_data.append({
            'id': trade.id,
            'user_id': trade.user_id,
            'asset': trade.asset,
            'trade_type': trade.trade_type,
            'amount': float(trade.amount),
            'entry_price': float(trade.entry_price),
            'current_price': current_price,
            'expiry_time': trade.expiry_time.isoformat(),
            'is_winning': is_winning,
            'time_remaining_seconds': max(0, int(time_remaining.total_seconds())),
            'potential_profit': float(trade.amount * trade.payout_percentage / 100) if is_winning else 0,
            'is_demo': trade.is_demo
        })
    
    return trades_data

if __name__ == '__main__':
    # Can be run as a standalone script for testing
    process_expired_trades()