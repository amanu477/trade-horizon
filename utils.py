import random
from decimal import Decimal
from datetime import datetime

def generate_market_price(symbol, base_price=None):
    """Generate realistic market prices for different assets"""
    
    # Base prices for different assets
    base_prices = {
        'EURUSD': 1.0850,
        'GBPUSD': 1.2650,
        'USDJPY': 149.50,
        'BTCUSD': 45000.00,
        'ETHUSD': 2800.00,
        'XAUUSD': 2050.00,
        'CRUDE': 75.50
    }
    
    if base_price is None:
        base_price = base_prices.get(symbol, 100.00)
    
    # Add realistic volatility
    volatility = {
        'EURUSD': 0.001,
        'GBPUSD': 0.0015,
        'USDJPY': 0.002,
        'BTCUSD': 0.02,
        'ETHUSD': 0.025,
        'XAUUSD': 0.01,
        'CRUDE': 0.015
    }
    
    vol = volatility.get(symbol, 0.01)
    change = random.uniform(-vol, vol)
    new_price = base_price * (1 + change)
    
    return round(new_price, 5)

def get_asset_price(symbol):
    """Get current asset price (simulated)"""
    return generate_market_price(symbol)

def format_currency(amount):
    """Format amount as currency"""
    return f"${amount:,.2f}"

def calculate_payout(amount, payout_percentage):
    """Calculate payout amount"""
    return float(amount) * float(payout_percentage) / 100

def get_trading_hours():
    """Get current trading hours status"""
    current_hour = datetime.utcnow().hour
    
    # Forex markets are closed on weekends
    weekday = datetime.utcnow().weekday()
    if weekday >= 5:  # Saturday = 5, Sunday = 6
        return False, "Markets closed - Weekend"
    
    # Simplified trading hours (24/5 for forex)
    if 0 <= current_hour <= 23:
        return True, "Markets open"
    else:
        return False, "Markets closed"

def generate_asset_list():
    """Generate list of available trading assets"""
    return [
        {
            'symbol': 'EURUSD',
            'name': 'Euro / US Dollar',
            'type': 'forex',
            'payout': 85,
            'min_trade': 1,
            'max_trade': 5000
        },
        {
            'symbol': 'GBPUSD',
            'name': 'British Pound / US Dollar',
            'type': 'forex',
            'payout': 85,
            'min_trade': 1,
            'max_trade': 5000
        },
        {
            'symbol': 'USDJPY',
            'name': 'US Dollar / Japanese Yen',
            'type': 'forex',
            'payout': 83,
            'min_trade': 1,
            'max_trade': 5000
        },
        {
            'symbol': 'BTCUSD',
            'name': 'Bitcoin / US Dollar',
            'type': 'crypto',
            'payout': 90,
            'min_trade': 5,
            'max_trade': 10000
        },
        {
            'symbol': 'ETHUSD',
            'name': 'Ethereum / US Dollar',
            'type': 'crypto',
            'payout': 88,
            'min_trade': 5,
            'max_trade': 10000
        },
        {
            'symbol': 'XAUUSD',
            'name': 'Gold / US Dollar',
            'type': 'commodity',
            'payout': 82,
            'min_trade': 10,
            'max_trade': 8000
        },
        {
            'symbol': 'CRUDE',
            'name': 'Crude Oil',
            'type': 'commodity',
            'payout': 80,
            'min_trade': 10,
            'max_trade': 8000
        }
    ]
