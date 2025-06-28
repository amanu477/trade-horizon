/**
 * TradingView Integration for Professional Trading Platform
 * Replaces custom chart with full TradingView widget functionality
 */

class TradingViewChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.currentAsset = options.asset || 'EURUSD';
        this.mode = options.mode || 'demo';
        this.widget = null;
        this.trades = [];
        
        // Comprehensive asset symbol mapping for TradingView
        this.symbolMap = {
            // Major Forex Pairs
            'EURUSD': 'FX:EURUSD',
            'GBPUSD': 'FX:GBPUSD', 
            'USDJPY': 'FX:USDJPY',
            'USDCHF': 'FX:USDCHF',
            'AUDUSD': 'FX:AUDUSD',
            'NZDUSD': 'FX:NZDUSD',
            'USDCAD': 'FX:USDCAD',
            'EURGBP': 'FX:EURGBP',
            'EURJPY': 'FX:EURJPY',
            'GBPJPY': 'FX:GBPJPY',
            
            // Cryptocurrencies
            'BTCUSD': 'BINANCE:BTCUSDT',
            'ETHUSD': 'BINANCE:ETHUSDT',
            'LTCUSD': 'BINANCE:LTCUSDT',
            'ADAUSD': 'BINANCE:ADAUSDT',
            'DOTUSD': 'BINANCE:DOTUSDT',
            'LINKUSD': 'BINANCE:LINKUSDT',
            'BNBUSD': 'BINANCE:BNBUSDT',
            'SOLUSD': 'BINANCE:SOLUSDT',
            
            // Commodities
            'XAUUSD': 'TVC:GOLD',
            'XAGUSD': 'TVC:SILVER',
            'CRUDE': 'TVC:USOIL',
            'NATGAS': 'TVC:NATURALGAS',
            'COPPER': 'COMEX:HG1!',
            
            // Indices
            'SPX500': 'TVC:SPX',
            'NASDAQ': 'TVC:NDX',
            'DJI': 'TVC:DJI',
            'FTSE100': 'TVC:UKX',
            'DAX30': 'TVC:DAX',
            'NIKKEI': 'TVC:NI225',
            
            // Individual Stocks
            'AAPL': 'NASDAQ:AAPL',
            'GOOGL': 'NASDAQ:GOOGL',
            'MSFT': 'NASDAQ:MSFT',
            'AMZN': 'NASDAQ:AMZN',
            'TSLA': 'NASDAQ:TSLA',
            'META': 'NASDAQ:META',
            'NVDA': 'NASDAQ:NVDA'
        };
        
        this.init();
    }
    
    init() {
        this.createTradingInterface();
        this.loadTradingView();
    }
    
    createTradingInterface() {
        const container = document.getElementById(this.containerId);
        
        container.innerHTML = `
            <div style="height: 100vh; background: #131722; display: flex; flex-direction: column;">
                <!-- Top Trading Bar -->
                <div style="background: #1e222d; padding: 8px 16px; border-bottom: 1px solid #2a2e39; display: flex; justify-content: space-between; align-items: center; z-index: 1000;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <!-- Asset Selector -->
                        <select id="asset-selector" style="background: #8B4513; color: #fff; border: 1px solid #A0522D; padding: 8px 12px; border-radius: 4px; font-size: 14px; font-weight: 500;">
                            <optgroup label="Major Forex">
                                <option value="EURUSD">EUR/USD</option>
                                <option value="GBPUSD">GBP/USD</option>
                                <option value="USDJPY">USD/JPY</option>
                                <option value="USDCHF">USD/CHF</option>
                                <option value="AUDUSD">AUD/USD</option>
                                <option value="NZDUSD">NZD/USD</option>
                                <option value="USDCAD">USD/CAD</option>
                                <option value="EURGBP">EUR/GBP</option>
                                <option value="EURJPY">EUR/JPY</option>
                                <option value="GBPJPY">GBP/JPY</option>
                            </optgroup>
                            <optgroup label="Cryptocurrencies">
                                <option value="BTCUSD">Bitcoin</option>
                                <option value="ETHUSD">Ethereum</option>
                                <option value="LTCUSD">Litecoin</option>
                                <option value="ADAUSD">Cardano</option>
                                <option value="DOTUSD">Polkadot</option>
                                <option value="LINKUSD">Chainlink</option>
                                <option value="BNBUSD">Binance Coin</option>
                                <option value="SOLUSD">Solana</option>
                            </optgroup>
                            <optgroup label="Commodities">
                                <option value="XAUUSD">Gold</option>
                                <option value="XAGUSD">Silver</option>
                                <option value="CRUDE">Crude Oil</option>
                                <option value="NATGAS">Natural Gas</option>
                                <option value="COPPER">Copper</option>
                            </optgroup>
                            <optgroup label="Indices">
                                <option value="SPX500">S&P 500</option>
                                <option value="NASDAQ">NASDAQ</option>
                                <option value="DJI">Dow Jones</option>
                                <option value="FTSE100">FTSE 100</option>
                                <option value="DAX30">DAX 30</option>
                                <option value="NIKKEI">Nikkei 225</option>
                            </optgroup>
                            <optgroup label="Stocks">
                                <option value="AAPL">Apple</option>
                                <option value="GOOGL">Google</option>
                                <option value="MSFT">Microsoft</option>
                                <option value="AMZN">Amazon</option>
                                <option value="TSLA">Tesla</option>
                                <option value="META">Meta</option>
                                <option value="NVDA">NVIDIA</option>
                            </optgroup>
                        </select>
                        
                        <!-- Timeframe Selector -->
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="color: #fff; font-size: 14px; font-weight: 500;">Timeframe:</span>
                            <select id="timeframe-selector" style="background: #8B4513; color: #fff; border: 1px solid #A0522D; padding: 6px 10px; border-radius: 4px; font-size: 13px;">
                                <option value="1">1m</option>
                                <option value="5">5m</option>
                                <option value="15">15m</option>
                                <option value="30">30m</option>
                                <option value="60" selected>1h</option>
                                <option value="240">4h</option>
                                <option value="1D">1D</option>
                                <option value="1W">1W</option>
                            </select>
                        </div>
                        
                        <!-- Current Price Display -->
                        <div id="price-display" style="color: #2962ff; font-weight: bold; font-size: 16px;">
                            Loading...
                        </div>
                        
                        <!-- Payout Info -->
                        <div id="payout-info" style="color: #4caf50; font-size: 14px;">
                            Payout: 85%
                        </div>
                    </div>
                    
                    <!-- Account Info -->
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="color: #d1d4dc; font-size: 14px;">
                            Balance: <span id="balance-display" style="color: #4caf50; font-weight: bold;">$${this.mode === 'demo' ? '10,000.00' : '1,000.00'}</span>
                        </div>
                        <div style="background: ${this.mode === 'demo' ? '#ff9800' : '#4caf50'}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                            ${this.mode} Mode
                        </div>
                    </div>
                </div>
                
                <!-- Main Content Area -->
                <div style="flex: 1; display: flex; height: calc(100vh - 60px);">
                    <!-- TradingView Chart -->
                    <div id="tradingview-widget" style="flex: 1; height: 100%; background: #131722;"></div>
                    
                    <!-- Trading Panel -->
                    <div style="width: 320px; background: #1e222d; border-left: 1px solid #2a2e39; display: flex; flex-direction: column;">
                        <!-- Trade Controls -->
                        <div style="padding: 20px; border-bottom: 1px solid #2a2e39;">
                            <h3 style="color: #d1d4dc; margin: 0 0 16px 0; font-size: 16px;">Place Trade</h3>
                            
                            <!-- Trade Direction -->
                            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
                                <button id="call-btn" class="trade-direction-btn" style="flex: 1; background: #26a69a; color: white; border: none; padding: 12px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                                    CALL ↗
                                </button>
                                <button id="put-btn" class="trade-direction-btn" style="flex: 1; background: #ef5350; color: white; border: none; padding: 12px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                                    PUT ↘
                                </button>
                            </div>
                            
                            <!-- Investment Amount -->
                            <div style="margin-bottom: 16px;">
                                <label style="color: #868993; font-size: 12px; display: block; margin-bottom: 4px;">Investment Amount</label>
                                <input id="amount-input" type="number" value="10" min="1" max="10000" 
                                       style="width: 100%; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; padding: 8px 12px; border-radius: 4px; font-size: 14px;">
                                
                                <!-- Quick Amount Buttons -->
                                <div style="display: flex; gap: 4px; margin-top: 8px;">
                                    <button onclick="setAmount(10)" style="flex: 1; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; padding: 4px; border-radius: 3px; font-size: 12px; cursor: pointer;">$10</button>
                                    <button onclick="setAmount(25)" style="flex: 1; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; padding: 4px; border-radius: 3px; font-size: 12px; cursor: pointer;">$25</button>
                                    <button onclick="setAmount(50)" style="flex: 1; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; padding: 4px; border-radius: 3px; font-size: 12px; cursor: pointer;">$50</button>
                                    <button onclick="setAmount(100)" style="flex: 1; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; padding: 4px; border-radius: 3px; font-size: 12px; cursor: pointer;">$100</button>
                                </div>
                            </div>
                            
                            <!-- Expiry Time -->
                            <div style="margin-bottom: 16px;">
                                <label style="color: #868993; font-size: 12px; display: block; margin-bottom: 4px;">Expiry Time (minutes)</label>
                                <input id="expiry-input" type="number" value="5" min="1" max="1440"
                                       style="width: 100%; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; padding: 8px 12px; border-radius: 4px; font-size: 14px;">
                            </div>
                            
                            <!-- Potential Profit -->
                            <div style="background: #2a2e39; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between; color: #d1d4dc; font-size: 14px;">
                                    <span>Potential Profit:</span>
                                    <span id="potential-profit" style="color: #4caf50; font-weight: bold;">$8.50</span>
                                </div>
                            </div>
                            
                            <!-- Trade Button -->
                            <button id="place-trade-btn" style="width: 100%; background: #2962ff; color: white; border: none; padding: 14px; border-radius: 4px; font-weight: bold; font-size: 16px; cursor: pointer; transition: all 0.2s;">
                                PLACE TRADE
                            </button>
                        </div>
                        
                        <!-- Active Trades -->
                        <div style="flex: 1; padding: 20px; overflow-y: auto;">
                            <h3 style="color: #d1d4dc; margin: 0 0 16px 0; font-size: 16px;">Active Trades</h3>
                            <div id="trades-list" style="color: #868993; font-size: 14px;">
                                No active trades
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }
    
    loadTradingView() {
        // Load TradingView widget script
        if (!window.TradingView) {
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.onload = () => this.createWidget();
            document.head.appendChild(script);
        } else {
            this.createWidget();
        }
    }
    
    createWidget() {
        const symbol = this.symbolMap[this.currentAsset] || 'FX:EURUSD';
        
        this.widget = new TradingView.widget({
            container_id: 'tradingview-widget',
            width: '100%',
            height: '100%',
            symbol: symbol,
            interval: '1',
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#131722',
            enable_publishing: false,
            allow_symbol_change: true,
            hide_side_toolbar: false,
            hide_top_toolbar: false,
            disabled_features: [
                'use_localstorage_for_settings'
            ],
            enabled_features: [
                'left_toolbar',
                'header_widget',
                'timeframes_toolbar',
                'control_bar',
                'drawing_toolbar'
            ],
            drawings_access: {
                type: 'black',
                tools: [
                    { name: 'Regression Trend' },
                    { name: 'Trend Line' },
                    { name: 'Trend Angle' },
                    { name: 'Horizontal Line' },
                    { name: 'Vertical Line' },
                    { name: 'Cross Line' },
                    { name: 'Trend Channel' },
                    { name: 'Parallel Channel' },
                    { name: 'Disjoint Channel' },
                    { name: 'Fibonacci Retracement' },
                    { name: 'Fibonacci Extension' },
                    { name: 'Fibonacci Fan' },
                    { name: 'Gann Box' },
                    { name: 'Gann Square' },
                    { name: 'Gann Fan' },
                    { name: 'Rectangle' },
                    { name: 'Rotated Rectangle' },
                    { name: 'Ellipse' },
                    { name: 'Triangle' },
                    { name: 'Polyline' },
                    { name: 'Path' },
                    { name: 'Curved Line' },
                    { name: 'Arrow' },
                    { name: 'Price Label' },
                    { name: 'Price Note' },
                    { name: 'Arrow Marker' },
                    { name: 'Flag' },
                    { name: 'Pitchfork' },
                    { name: 'Schiff Pitchfork' },
                    { name: 'Modified Schiff Pitchfork' },
                    { name: 'Brush' },
                    { name: 'Highlighter' }
                ]
            },
            autosize: true
        });
        
        // Wait for widget to be ready before setting up interactions
        if (this.widget.onChartReady) {
            this.widget.onChartReady(() => {
                console.log('TradingView chart is ready');
                // Start price updates after chart is ready
                this.startPriceUpdates();
            });
        } else {
            // Fallback for older TradingView versions
            setTimeout(() => {
                console.log('TradingView chart initialized successfully');
                this.startPriceUpdates();
            }, 3000);
        }
    }
    
    setupEventListeners() {
        // Asset selector
        document.getElementById('asset-selector').addEventListener('change', (e) => {
            this.currentAsset = e.target.value;
            this.updateChart();
        });
        
        // Trade direction buttons
        document.getElementById('call-btn').addEventListener('click', () => {
            this.selectedDirection = 'call';
            this.updateDirectionButtons();
        });
        
        document.getElementById('put-btn').addEventListener('click', () => {
            this.selectedDirection = 'put';
            this.updateDirectionButtons();
        });
        
        // Amount input
        document.getElementById('amount-input').addEventListener('input', () => {
            this.updatePotentialProfit();
        });
        
        // Place trade button
        document.getElementById('place-trade-btn').addEventListener('click', () => {
            this.placeTrade();
        });
        
        // Set default selection
        this.selectedDirection = 'call';
        this.updateDirectionButtons();
        this.updatePotentialProfit();
    }
    
    updateChart() {
        if (this.widget && this.widget.chart) {
            const symbol = this.symbolMap[this.currentAsset] || 'FX:EURUSD';
            try {
                this.widget.chart().setSymbol(symbol);
                console.log(`Switched to symbol: ${symbol}`);
            } catch (error) {
                console.log('Chart not ready yet, will retry...');
                // Retry after a delay if chart is not ready
                setTimeout(() => {
                    if (this.widget && this.widget.chart) {
                        this.widget.chart().setSymbol(symbol);
                    }
                }, 2000);
            }
        }
    }
    
    setTimeframe(interval) {
        if (this.widget && this.widget.chart) {
            try {
                this.widget.chart().setResolution(interval);
                console.log(`Switched to timeframe: ${interval}`);
            } catch (error) {
                console.log('Chart not ready for timeframe change, will retry...');
                setTimeout(() => {
                    if (this.widget && this.widget.chart) {
                        this.widget.chart().setResolution(interval);
                    }
                }, 2000);
            }
        }
    }
    
    showTradeModal() {
        // Create modal overlay
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="background: #1e222d; padding: 30px; border-radius: 8px; width: 400px; max-width: 90vw;">
                <h3 style="color: #d1d4dc; margin: 0 0 20px 0; text-align: center;">Place Trade</h3>
                
                <!-- Direction Buttons -->
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button id="modal-call-btn" style="flex: 1; background: #26a69a; color: white; border: none; padding: 15px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer;">
                        ▲ CALL
                    </button>
                    <button id="modal-put-btn" style="flex: 1; background: #ef5350; color: white; border: none; padding: 15px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer;">
                        ▼ PUT
                    </button>
                </div>
                
                <!-- Amount Input -->
                <div style="margin-bottom: 20px;">
                    <label style="color: #d1d4dc; display: block; margin-bottom: 8px;">Investment Amount</label>
                    <input type="number" id="modal-amount" value="10" min="1" max="10000" style="width: 100%; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; padding: 12px; border-radius: 4px; font-size: 16px;">
                </div>
                
                <!-- Expiry Time -->
                <div style="margin-bottom: 20px;">
                    <label style="color: #d1d4dc; display: block; margin-bottom: 8px;">Expiry Time</label>
                    <select id="modal-expiry" style="width: 100%; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; padding: 12px; border-radius: 4px;">
                        <option value="1">1 Minute</option>
                        <option value="5" selected>5 Minutes</option>
                        <option value="15">15 Minutes</option>
                        <option value="30">30 Minutes</option>
                        <option value="60">1 Hour</option>
                    </select>
                </div>
                
                <!-- Buttons -->
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="cancel-trade" style="background: #434651; color: #d1d4dc; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button id="confirm-trade" style="background: #26a69a; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer;">Place Trade</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('#cancel-trade').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Direction selection
        let selectedDirection = 'call';
        const callBtn = modal.querySelector('#modal-call-btn');
        const putBtn = modal.querySelector('#modal-put-btn');
        
        callBtn.addEventListener('click', () => {
            selectedDirection = 'call';
            callBtn.style.opacity = '1';
            putBtn.style.opacity = '0.6';
        });
        
        putBtn.addEventListener('click', () => {
            selectedDirection = 'put';
            putBtn.style.opacity = '1';
            callBtn.style.opacity = '0.6';
        });
        
        // Handle trade submission
        modal.querySelector('#confirm-trade').addEventListener('click', async () => {
            const amount = modal.querySelector('#modal-amount').value;
            const expiry = modal.querySelector('#modal-expiry').value;
            
            try {
                const response = await fetch('/place_trade', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCSRFToken()
                    },
                    body: JSON.stringify({
                        asset: this.currentAsset,
                        trade_type: selectedDirection,
                        amount: parseFloat(amount),
                        expiry_minutes: parseInt(expiry)
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    if (result.success) {
                        document.body.removeChild(modal);
                        this.showNotification('Trade placed successfully!', 'success');
                        
                        // Update balance display if available
                        if (result.remaining_balance) {
                            const balanceDisplay = document.getElementById('balance-display');
                            if (balanceDisplay) {
                                balanceDisplay.textContent = `$${result.remaining_balance.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
                            }
                        }
                    } else {
                        this.showNotification(result.message || 'Failed to place trade', 'error');
                    }
                } else {
                    this.showNotification('Failed to place trade', 'error');
                }
            } catch (error) {
                console.error('Error placing trade:', error);
                this.showNotification('Network error occurred', 'error');
            }
        });
    }
    
    getCSRFToken() {
        const token = document.querySelector('meta[name="csrf-token"]');
        return token ? token.getAttribute('content') : '';
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
    
    startPriceUpdates() {
        // Update price every 2 seconds
        setInterval(async () => {
            try {
                const response = await fetch(`/api/market-data/${this.currentAsset}`);
                const data = await response.json();
                
                if (data.success) {
                    const priceDisplay = document.getElementById('price-display');
                    if (priceDisplay) {
                        priceDisplay.textContent = data.price.toFixed(5);
                        priceDisplay.style.color = data.change >= 0 ? '#4CAF50' : '#f44336';
                    }
                }
            } catch (error) {
                console.error('Error updating price:', error);
            }
        }, 2000);
    }
    
    updateDirectionButtons() {
        const callBtn = document.getElementById('call-btn');
        const putBtn = document.getElementById('put-btn');
        
        if (this.selectedDirection === 'call') {
            callBtn.style.background = '#26a69a';
            callBtn.style.opacity = '1';
            putBtn.style.background = '#2a2e39';
            putBtn.style.opacity = '0.6';
        } else {
            putBtn.style.background = '#ef5350';
            putBtn.style.opacity = '1';
            callBtn.style.background = '#2a2e39';
            callBtn.style.opacity = '0.6';
        }
    }
    
    updatePotentialProfit() {
        const amount = parseFloat(document.getElementById('amount-input').value) || 0;
        const payout = 0.85; // 85% payout
        const profit = (amount * payout).toFixed(2);
        document.getElementById('potential-profit').textContent = `$${profit}`;
    }
    
    startPriceUpdates() {
        // Update price display with real market data
        setInterval(async () => {
            try {
                const response = await fetch(`/api/market-data-new/${this.currentAsset}`);
                const data = await response.json();
                
                if (data.price) {
                    const priceDisplay = document.getElementById('price-display');
                    const changePercent = data.change_percent || 0;
                    const color = changePercent >= 0 ? '#26a69a' : '#ef5350';
                    
                    priceDisplay.textContent = `${data.price.toFixed(5)}`;
                    priceDisplay.style.color = color;
                }
            } catch (error) {
                console.error('Error updating price:', error);
            }
        }, 2000);
    }
    
    async placeTrade() {
        const amount = parseFloat(document.getElementById('amount-input').value);
        const expiry = parseInt(document.getElementById('expiry-input').value);
        
        if (!amount || amount < 1) {
            alert('Please enter a valid investment amount');
            return;
        }
        
        if (!this.selectedDirection) {
            alert('Please select trade direction (Call or Put)');
            return;
        }
        
        try {
            const response = await fetch('/place-trade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': this.getCSRFToken()
                },
                body: new URLSearchParams({
                    asset: this.currentAsset,
                    trade_type: this.selectedDirection,
                    amount: amount,
                    expiry_minutes: expiry,
                    csrf_token: this.getCSRFToken()
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                this.addTradeToList(result);
                this.updateBalance();
                alert('Trade placed successfully!');
            } else {
                const error = await response.json();
                alert(`Error: ${error.message || 'Failed to place trade'}`);
            }
        } catch (error) {
            console.error('Error placing trade:', error);
            alert('Failed to place trade. Please try again.');
        }
    }
    
    addTradeToList(trade) {
        const tradesList = document.getElementById('trades-list');
        
        if (tradesList.textContent === 'No active trades') {
            tradesList.innerHTML = '';
        }
        
        const tradeElement = document.createElement('div');
        tradeElement.style.cssText = 'background: #2a2e39; padding: 12px; border-radius: 4px; margin-bottom: 8px;';
        tradeElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span style="color: #d1d4dc; font-weight: bold;">${trade.asset}</span>
                <span style="color: ${trade.trade_type === 'call' ? '#26a69a' : '#ef5350'}; font-weight: bold;">
                    ${trade.trade_type.toUpperCase()}
                </span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #868993;">
                <span>$${trade.amount}</span>
                <span id="timer-${trade.id}">--:--</span>
            </div>
        `;
        
        tradesList.appendChild(tradeElement);
    }
    
    updateBalance() {
        // Update balance display after trade
        setTimeout(() => {
            fetch('/api/user-balance')
                .then(response => response.json())
                .then(data => {
                    const balanceDisplay = document.getElementById('balance-display');
                    balanceDisplay.textContent = `$${data.balance.toFixed(2)}`;
                })
                .catch(error => console.error('Error updating balance:', error));
        }, 500);
    }
    
    getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }
}

// Global functions for quick amount selection
function setAmount(amount) {
    document.getElementById('amount-input').value = amount;
    if (window.tradingChart) {
        window.tradingChart.updatePotentialProfit();
    }
}