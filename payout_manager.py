"""
Real-world payout management system for TradePro
Automatically updates payout percentages based on market volatility and real-world conditions
"""

import requests
import json
from datetime import datetime, timedelta
from market_data import market_data

class PayoutManager:
    def __init__(self):
        self.base_payouts = {
            # Forex pairs - typically lower volatility, higher payouts
            'EURUSD': 85.0,
            'GBPUSD': 83.0,
            'USDJPY': 84.0,
            'USDCAD': 82.0,
            'AUDUSD': 81.0,
            
            # Cryptocurrencies - higher volatility, variable payouts
            'BTCUSD': 78.0,
            'ETHUSD': 76.0,
            'ADAUSD': 75.0,
            'DOTUSD': 74.0,
            
            # Commodities - medium volatility
            'XAUUSD': 80.0,  # Gold
            'XAGUSD': 79.0,  # Silver
            'CRUDE': 77.0,   # Oil
            'NGAS': 76.0,    # Natural Gas
            
            # Stock Indices - medium volatility
            'SPX500': 82.0,
            'NASDAQ': 81.0,
            'DOW': 83.0
        }
        
        self.volatility_adjustments = {
            'low': 2.0,      # Low volatility = higher payout
            'medium': 0.0,   # Medium volatility = base payout
            'high': -3.0,    # High volatility = lower payout
            'extreme': -5.0  # Extreme volatility = much lower payout
        }
        
        self.time_decay_adjustments = {
            1: -2.0,    # 1 minute - very short term, lower payout
            5: 0.0,     # 5 minutes - base
            15: 1.0,    # 15 minutes - slightly higher
            30: 2.0,    # 30 minutes - higher
            60: 3.0,    # 1 hour - highest
            240: 2.5,   # 4 hours
            1440: 1.0   # 1 day
        }
    
    def get_current_payout(self, asset, expiry_minutes=5):
        """
        Calculate real-time payout percentage based on:
        - Base asset payout
        - Current market volatility
        - Time until expiry
        - Market conditions
        """
        base_payout = self.base_payouts.get(asset, 75.0)
        
        # Get volatility adjustment
        volatility_level = self.calculate_volatility_level(asset)
        volatility_adj = self.volatility_adjustments.get(volatility_level, 0.0)
        
        # Get time decay adjustment
        time_adj = self.time_decay_adjustments.get(expiry_minutes, 0.0)
        
        # Market hours adjustment (forex markets have different sessions)
        market_hours_adj = self.get_market_hours_adjustment(asset)
        
        # Calculate final payout
        final_payout = base_payout + volatility_adj + time_adj + market_hours_adj
        
        # Ensure payout is within reasonable bounds (65% - 95%)
        final_payout = max(65.0, min(95.0, final_payout))
        
        return round(final_payout, 1)
    
    def calculate_volatility_level(self, asset):
        """Calculate current volatility level for the asset"""
        try:
            # Get recent price data
            market_info = market_data.get_market_info(asset)
            change_percent = abs(market_info.get('change_percent', 0))
            
            # Classify volatility based on price change
            if change_percent < 0.5:
                return 'low'
            elif change_percent < 1.5:
                return 'medium'
            elif change_percent < 3.0:
                return 'high'
            else:
                return 'extreme'
                
        except Exception as e:
            print(f"Error calculating volatility for {asset}: {e}")
            return 'medium'  # Default to medium volatility
    
    def get_market_hours_adjustment(self, asset):
        """Adjust payout based on market trading hours"""
        now = datetime.utcnow()
        hour = now.hour
        
        # Forex markets (24/5)
        if asset in ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCAD', 'AUDUSD']:
            # Higher liquidity during major sessions
            if 7 <= hour <= 17:  # London + NY overlap
                return 1.0
            elif 22 <= hour <= 6:  # Asian session
                return 0.0
            else:
                return -0.5  # Lower liquidity periods
        
        # Crypto markets (24/7)
        elif asset in ['BTCUSD', 'ETHUSD', 'ADAUSD', 'DOTUSD']:
            return 0.0  # No adjustment for 24/7 markets
        
        # Commodities and stocks (specific hours)
        else:
            if 9 <= hour <= 16:  # Major trading hours
                return 1.0
            else:
                return -1.0  # After hours trading
    
    def get_all_current_payouts(self):
        """Get current payouts for all available assets"""
        payouts = {}
        
        for asset in self.base_payouts.keys():
            try:
                payouts[asset] = {
                    '1min': self.get_current_payout(asset, 1),
                    '5min': self.get_current_payout(asset, 5),
                    '15min': self.get_current_payout(asset, 15),
                    '30min': self.get_current_payout(asset, 30),
                    '1hour': self.get_current_payout(asset, 60),
                    '4hour': self.get_current_payout(asset, 240),
                    '1day': self.get_current_payout(asset, 1440)
                }
            except Exception as e:
                print(f"Error calculating payouts for {asset}: {e}")
                # Fallback to base payout
                base = self.base_payouts[asset]
                payouts[asset] = {
                    '1min': base - 2,
                    '5min': base,
                    '15min': base + 1,
                    '30min': base + 2,
                    '1hour': base + 3,
                    '4hour': base + 2,
                    '1day': base + 1
                }
        
        return payouts
    
    def get_payout_factors_explanation(self, asset, expiry_minutes=5):
        """Get explanation of payout calculation factors"""
        base_payout = self.base_payouts.get(asset, 75.0)
        volatility_level = self.calculate_volatility_level(asset)
        
        return {
            'asset': asset,
            'base_payout': base_payout,
            'volatility_level': volatility_level,
            'volatility_adjustment': self.volatility_adjustments.get(volatility_level, 0.0),
            'time_adjustment': self.time_decay_adjustments.get(expiry_minutes, 0.0),
            'market_hours_adjustment': self.get_market_hours_adjustment(asset),
            'final_payout': self.get_current_payout(asset, expiry_minutes),
            'explanation': f"Base: {base_payout}% | Volatility: {volatility_level} | Time: {expiry_minutes}min"
        }

# Singleton instance
payout_manager = PayoutManager()