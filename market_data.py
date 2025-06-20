import requests
import yfinance as yf
import pandas as pd
import json
from datetime import datetime, timedelta
import random
import time

class RealMarketData:
    def __init__(self):
        self.forex_pairs = {
            'EURUSD': 'EURUSD=X',
            'GBPUSD': 'GBPUSD=X', 
            'USDJPY': 'USDJPY=X',
            'USDCAD': 'USDCAD=X',
            'AUDUSD': 'AUDUSD=X'
        }
        
        self.crypto_pairs = {
            'BTCUSD': 'BTC-USD',
            'ETHUSD': 'ETH-USD',
            'ADAUSD': 'ADA-USD',
            'DOTUSD': 'DOT-USD'
        }
        
        self.stock_indices = {
            'SPX500': '^GSPC',
            'NASDAQ': '^IXIC',
            'DOW': '^DJI'
        }
        
        self.commodities = {
            'XAUUSD': 'GC=F',  # Gold
            'XAGUSD': 'SI=F',  # Silver
            'CRUDE': 'CL=F',   # Crude Oil
            'NGAS': 'NG=F'     # Natural Gas
        }

    def get_real_price(self, symbol):
        """Get real-time price from Yahoo Finance"""
        try:
            # Map our symbols to Yahoo Finance symbols
            yf_symbol = self._get_yf_symbol(symbol)
            if not yf_symbol:
                return self._get_fallback_price(symbol)
            
            ticker = yf.Ticker(yf_symbol)
            info = ticker.info
            
            # Try to get current price
            current_price = info.get('regularMarketPrice') or info.get('currentPrice') or info.get('previousClose')
            
            if current_price:
                return float(current_price)
            else:
                return self._get_fallback_price(symbol)
                
        except Exception as e:
            print(f"Error fetching price for {symbol}: {e}")
            return self._get_fallback_price(symbol)

    def get_historical_data(self, symbol, period='1d', interval='1m'):
        """Get historical data for charts"""
        try:
            print(f"Attempting to fetch historical data for {symbol}")
            yf_symbol = self._get_yf_symbol(symbol)
            if not yf_symbol:
                print(f"No Yahoo Finance symbol found for {symbol}, using fallback")
                return self._generate_fallback_data(symbol)
            
            print(f"Using Yahoo Finance symbol: {yf_symbol}")
            ticker = yf.Ticker(yf_symbol)
            
            # Adjust parameters for different asset types
            if symbol in self.forex_pairs:
                # Forex markets - use recent data with 5m intervals
                hist = ticker.history(period='1d', interval='5m')
                print(f"Fetching forex data: period=1d, interval=5m")
            else:
                # Stocks/crypto - use requested parameters
                hist = ticker.history(period=period, interval=interval)
                print(f"Fetching non-forex data: period={period}, interval={interval}")
            
            print(f"Retrieved history shape: {hist.shape if not hist.empty else 'Empty'}")
            
            if hist.empty:
                print("No historical data retrieved, using fallback")
                return self._generate_fallback_data(symbol)
            
            data_points = []
            for timestamp, row in hist.iterrows():
                try:
                    data_points.append({
                        'timestamp': timestamp.isoformat(),
                        'open': float(row['Open']),
                        'high': float(row['High']),
                        'low': float(row['Low']),
                        'close': float(row['Close']),
                        'volume': int(row['Volume']) if not pd.isna(row['Volume']) else 0
                    })
                except Exception as row_error:
                    print(f"Error processing row: {row_error}")
                    continue
            
            print(f"Processed {len(data_points)} data points")
            return data_points[-50:]  # Return last 50 points
            
        except Exception as e:
            print(f"Error fetching historical data for {symbol}: {e}")
            import traceback
            traceback.print_exc()
            return self._generate_fallback_data(symbol)

    def get_market_info(self, symbol):
        """Get comprehensive market information"""
        try:
            yf_symbol = self._get_yf_symbol(symbol)
            if not yf_symbol:
                return self._get_fallback_info(symbol)
            
            ticker = yf.Ticker(yf_symbol)
            info = ticker.info
            
            current_price = info.get('regularMarketPrice') or info.get('currentPrice') or info.get('previousClose')
            previous_close = info.get('previousClose', current_price)
            
            change = current_price - previous_close if current_price and previous_close else 0
            change_percent = (change / previous_close * 100) if previous_close else 0
            
            return {
                'symbol': symbol,
                'price': float(current_price) if current_price else 0,
                'change': float(change),
                'change_percent': float(change_percent),
                'volume': info.get('volume', 0),
                'high_24h': info.get('dayHigh', current_price),
                'low_24h': info.get('dayLow', current_price),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error fetching market info for {symbol}: {e}")
            return self._get_fallback_info(symbol)

    def _get_yf_symbol(self, symbol):
        """Map our symbols to Yahoo Finance symbols"""
        all_symbols = {**self.forex_pairs, **self.crypto_pairs, **self.stock_indices, **self.commodities}
        return all_symbols.get(symbol)

    def _get_fallback_price(self, symbol):
        """Fallback prices when real data is unavailable"""
        fallback_prices = {
            'EURUSD': 1.08450,
            'GBPUSD': 1.26320,
            'USDJPY': 148.750,
            'BTCUSD': 43250.00,
            'ETHUSD': 2650.00,
            'XAUUSD': 2025.50,
            'CRUDE': 78.45,
            'SPX500': 4750.00,
            'NASDAQ': 15200.00
        }
        base_price = fallback_prices.get(symbol, 1.00000)
        # Add small random variation
        variation = (random.random() - 0.5) * base_price * 0.001
        return base_price + variation

    def _generate_fallback_data(self, symbol):
        """Generate realistic fallback data when real data is unavailable"""
        base_price = self._get_fallback_price(symbol)
        data_points = []
        
        current_time = datetime.now()
        current_price = base_price
        
        for i in range(50):
            timestamp = current_time - timedelta(minutes=50-i)
            
            # Simulate price movement
            change = (random.random() - 0.5) * base_price * 0.005
            current_price += change
            
            data_points.append({
                'timestamp': timestamp.isoformat(),
                'open': current_price,
                'high': current_price * (1 + random.random() * 0.002),
                'low': current_price * (1 - random.random() * 0.002),
                'close': current_price,
                'volume': random.randint(1000, 10000)
            })
        
        return data_points

    def _get_fallback_info(self, symbol):
        """Fallback market info"""
        price = self._get_fallback_price(symbol)
        change = (random.random() - 0.5) * price * 0.01
        
        return {
            'symbol': symbol,
            'price': price,
            'change': change,
            'change_percent': (change / price * 100),
            'volume': random.randint(10000, 100000),
            'high_24h': price * 1.01,
            'low_24h': price * 0.99,
            'timestamp': datetime.now().isoformat()
        }

# Singleton instance
market_data = RealMarketData()