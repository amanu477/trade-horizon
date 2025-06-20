"""
Twelve Data API Integration for Professional Trading Platform
Provides real-time market data for forex, crypto, stocks, and commodities
"""

import requests
import json
import os
from datetime import datetime, timedelta
import time

class TwelveDataAPI:
    def __init__(self):
        self.api_key = os.environ.get('TWELVE_DATA_API_KEY')
        self.base_url = 'https://api.twelvedata.com'
        
        # Symbol mappings for different asset types
        self.symbol_mappings = {
            'EURUSD': 'EUR/USD',
            'GBPUSD': 'GBP/USD', 
            'USDJPY': 'USD/JPY',
            'USDCAD': 'USD/CAD',
            'AUDUSD': 'AUD/USD',
            'NZDUSD': 'NZD/USD',
            'USDCHF': 'USD/CHF',
            'EURGBP': 'EUR/GBP',
            'EURJPY': 'EUR/JPY',
            'GBPJPY': 'GBP/JPY',
            
            'BTCUSD': 'BTC/USD',
            'ETHUSD': 'ETH/USD',
            'LTCUSD': 'LTC/USD',
            'XRPUSD': 'XRP/USD',
            'ADAUSD': 'ADA/USD',
            'DOTUSD': 'DOT/USD',
            'LINKUSD': 'LINK/USD',
            'BCHUSD': 'BCH/USD',
            
            'XAUUSD': 'XAU/USD',  # Gold
            'XAGUSD': 'XAG/USD',  # Silver
            'CRUDE': 'BRENT',     # Brent Crude Oil
            'WTI': 'WTI',         # WTI Crude Oil
            'NGAS': 'NG',         # Natural Gas
            
            'SPX500': 'SPX',
            'NASDAQ': 'IXIC',
            'DOW': 'DJI',
            'FTSE': 'UKX',
            'DAX': 'DAX',
            'NIKKEI': 'N225'
        }
    
    def get_real_time_price(self, symbol):
        """Get real-time price for a symbol"""
        if not self.api_key:
            raise Exception("Twelve Data API key not configured")
        
        mapped_symbol = self.symbol_mappings.get(symbol, symbol)
        
        url = f"{self.base_url}/price"
        params = {
            'symbol': mapped_symbol,
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'price' in data:
                return float(data['price'])
            else:
                raise Exception(f"No price data for {symbol}: {data}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed for {symbol}: {e}")
    
    def get_real_time_quote(self, symbol):
        """Get detailed real-time quote with OHLC data"""
        if not self.api_key:
            raise Exception("Twelve Data API key not configured")
        
        mapped_symbol = self.symbol_mappings.get(symbol, symbol)
        
        url = f"{self.base_url}/quote"
        params = {
            'symbol': mapped_symbol,
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'symbol' in data:
                return {
                    'symbol': symbol,
                    'price': float(data.get('close', 0)),
                    'open': float(data.get('open', 0)),
                    'high': float(data.get('high', 0)),
                    'low': float(data.get('low', 0)),
                    'close': float(data.get('close', 0)),
                    'volume': int(data.get('volume', 0)) if data.get('volume') else 0,
                    'change': float(data.get('change', 0)),
                    'change_percent': float(data.get('percent_change', 0)),
                    'previous_close': float(data.get('previous_close', 0)),
                    'timestamp': data.get('datetime', datetime.now().isoformat())
                }
            else:
                raise Exception(f"No quote data for {symbol}: {data}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed for {symbol}: {e}")
    
    def get_time_series(self, symbol, interval='1min', outputsize=100):
        """Get historical time series data for charts"""
        if not self.api_key:
            raise Exception("Twelve Data API key not configured")
        
        mapped_symbol = self.symbol_mappings.get(symbol, symbol)
        
        url = f"{self.base_url}/time_series"
        params = {
            'symbol': mapped_symbol,
            'interval': interval,
            'outputsize': outputsize,
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            if 'values' in data and isinstance(data['values'], list):
                chart_data = []
                
                for point in data['values']:
                    try:
                        chart_data.append({
                            'timestamp': point['datetime'],
                            'open': float(point['open']),
                            'high': float(point['high']),
                            'low': float(point['low']),
                            'close': float(point['close']),
                            'volume': int(point['volume']) if point.get('volume') else 0
                        })
                    except (KeyError, ValueError) as e:
                        continue
                
                # Sort by timestamp (oldest first)
                chart_data.sort(key=lambda x: x['timestamp'])
                return chart_data
            else:
                raise Exception(f"No time series data for {symbol}: {data}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed for {symbol}: {e}")
    
    def get_multiple_quotes(self, symbols):
        """Get quotes for multiple symbols in one request"""
        if not self.api_key:
            raise Exception("Twelve Data API key not configured")
        
        # Map symbols
        mapped_symbols = [self.symbol_mappings.get(s, s) for s in symbols]
        symbols_string = ','.join(mapped_symbols)
        
        url = f"{self.base_url}/quote"
        params = {
            'symbol': symbols_string,
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            result = {}
            
            # Handle single symbol response
            if isinstance(data, dict) and 'symbol' in data:
                original_symbol = symbols[0]
                result[original_symbol] = {
                    'symbol': original_symbol,
                    'price': float(data.get('close', 0)),
                    'change': float(data.get('change', 0)),
                    'change_percent': float(data.get('percent_change', 0)),
                    'timestamp': data.get('datetime', datetime.now().isoformat())
                }
            
            # Handle multiple symbols response
            elif isinstance(data, dict):
                for i, (original_symbol, mapped_symbol) in enumerate(zip(symbols, mapped_symbols)):
                    if mapped_symbol in data:
                        symbol_data = data[mapped_symbol]
                        result[original_symbol] = {
                            'symbol': original_symbol,
                            'price': float(symbol_data.get('close', 0)),
                            'change': float(symbol_data.get('change', 0)),
                            'change_percent': float(symbol_data.get('percent_change', 0)),
                            'timestamp': symbol_data.get('datetime', datetime.now().isoformat())
                        }
            
            return result
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"API request failed for multiple symbols: {e}")
    
    def get_market_movers(self, market='forex'):
        """Get market movers for a specific market"""
        if not self.api_key:
            raise Exception("Twelve Data API key not configured")
        
        url = f"{self.base_url}/market_movers/{market}"
        params = {
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return data
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Market movers request failed: {e}")
    
    def check_api_usage(self):
        """Check API usage statistics"""
        if not self.api_key:
            return {'error': 'API key not configured'}
        
        url = f"{self.base_url}/api_usage"
        params = {
            'apikey': self.api_key
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            return {'error': f"Usage check failed: {e}"}
    
    def is_api_working(self):
        """Test if API is working with a simple request"""
        try:
            # Test with EUR/USD which should always be available
            price = self.get_real_time_price('EURUSD')
            return price is not None and price > 0
        except:
            return False

# Global instance
twelve_data_api = TwelveDataAPI()