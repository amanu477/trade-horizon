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
                        <!-- Empty space for clean header -->
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
                                <button id="buy-btn" class="trade-direction-btn" style="flex: 1; background: #26a69a; color: white; border: none; padding: 12px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                                    BUY ↗
                                </button>
                                <button id="sell-btn" class="trade-direction-btn" style="flex: 1; background: #ef5350; color: white; border: none; padding: 12px; border-radius: 4px; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                                    SELL ↘
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
                            
                            <!-- Trade execution happens via Buy/Sell buttons directly -->
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
            autosize: true
        });
        
        // Set up symbol synchronization using iframe monitoring
        if (this.widget.onChartReady) {
            this.widget.onChartReady(() => {
                console.log('TradingView chart ready, setting up symbol synchronization...');
                this.setupSymbolSynchronization();
            });
        } else {
            // Fallback for widgets without onChartReady
            setTimeout(() => {
                console.log('TradingView chart initialized, setting up monitoring...');
                this.setupSymbolSynchronization();
            }, 3000);
        }
        
        // Wait for widget to be ready before setting up interactions
        if (this.widget.onChartReady) {
            this.widget.onChartReady(() => {
                console.log('TradingView chart is ready');
                // Initialize current symbol tracking
                try {
                    this.widget.chart().symbol().then((currentSymbol) => {
                        this.lastPolledSymbol = currentSymbol;
                        console.log('Initial TradingView symbol:', currentSymbol);
                    }).catch(error => {
                        console.log('Could not get initial symbol:', error);
                    });
                } catch (error) {
                    console.log('Symbol initialization error:', error);
                }
                
                // Start price updates after chart is ready
                this.startPriceUpdates();
            });
        } else {
            // Fallback initialization
            setTimeout(() => {
                console.log('TradingView chart initialized (fallback)');
                this.startPriceUpdates();
            }, 3000);
        }
    }
    
    setupEventListeners() {
        // Buy button - execute trade immediately
        document.getElementById('buy-btn').addEventListener('click', () => {
            this.selectedDirection = 'call';
            this.placeTrade();
        });
        
        // Sell button - execute trade immediately
        document.getElementById('sell-btn').addEventListener('click', () => {
            this.selectedDirection = 'put';
            this.placeTrade();
        });
        
        // Amount input
        document.getElementById('amount-input').addEventListener('input', () => {
            this.updatePotentialProfit();
        });

        
        // No default selection needed - buttons execute trades directly
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
    
    // Function removed - Buy/Sell buttons execute trades directly
    
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
            alert('Please select trade direction (Buy or Sell)');
            return;
        }
        
        // Ensure we have a valid asset
        const asset = this.currentAsset || 'EURUSD';
        
        // Create and submit a hidden form for reliable session handling
        console.log('Placing trade:', {
            asset: asset,
            trade_type: this.selectedDirection,
            amount: amount,
            expiry_minutes: expiry
        });
        
        // Create hidden form
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/place_trade';
        form.style.display = 'none';
        
        // Add CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrf_token';
            csrfInput.value = csrfToken.getAttribute('content');
            form.appendChild(csrfInput);
        }
        
        // Add form fields
        const fields = {
            'asset': asset,
            'trade_type': this.selectedDirection,
            'amount': amount,
            'expiry_minutes': expiry
        };
        
        for (const [name, value] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = name;
            input.value = value;
            form.appendChild(input);
        }
        
        // Add to page and submit
        document.body.appendChild(form);
        form.submit();
    }
    
    loadActiveTrades() {
        fetch('/api/active_trades')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.displayActiveTrades(data.trades);
                    this.startTradeTimers(data.trades);
                }
            })
            .catch(error => console.error('Error loading active trades:', error));
    }
    
    displayActiveTrades(trades) {
        const tradesList = document.getElementById('trades-list');
        if (!tradesList) return;
        
        if (trades.length === 0) {
            tradesList.innerHTML = '<div style="color: #868993; text-align: center; padding: 20px;">No active trades</div>';
            return;
        }
        
        tradesList.innerHTML = '';
        
        trades.forEach(trade => {
            const tradeElement = document.createElement('div');
            tradeElement.id = `trade-${trade.id}`;
            tradeElement.style.cssText = 'background: #2a2e39; padding: 12px; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid ' + (trade.trade_type === 'call' ? '#26a69a' : '#ef5350') + ';';
            
            const remainingTime = this.formatTime(trade.remaining_seconds);
            const potentialProfit = (trade.amount * trade.payout_percentage / 100).toFixed(2);
            
            tradeElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #d1d4dc; font-weight: bold;">${trade.asset}</span>
                    <span style="color: ${trade.trade_type === 'call' ? '#26a69a' : '#ef5350'}; font-weight: bold; text-transform: uppercase;">
                        ${trade.trade_type === 'call' ? 'BUY' : 'SELL'}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                    <span style="color: #868993;">Investment:</span>
                    <span style="color: #d1d4dc;">$${trade.amount}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                    <span style="color: #868993;">Potential Profit:</span>
                    <span style="color: #26a69a;">$${potentialProfit}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px;">
                    <span style="color: #868993;">Entry Price:</span>
                    <span style="color: #d1d4dc;">$${trade.entry_price}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 14px;">
                    <span style="color: #868993;">Time Left:</span>
                    <span id="timer-${trade.id}" style="color: #f39c12; font-weight: bold;">${remainingTime}</span>
                </div>
            `;
            
            tradesList.appendChild(tradeElement);
        });
    }
    
    startTradeTimers(trades) {
        // Clear existing timers
        if (this.tradeTimers) {
            this.tradeTimers.forEach(timer => clearInterval(timer));
        }
        this.tradeTimers = [];
        
        trades.forEach(trade => {
            if (trade.remaining_seconds > 0) {
                const timer = setInterval(() => {
                    this.updateTradeTimer(trade.id, trade.expiry_time);
                }, 1000);
                this.tradeTimers.push(timer);
            }
        });
    }
    
    updateTradeTimer(tradeId, expiryTime) {
        const timerElement = document.getElementById(`timer-${tradeId}`);
        if (!timerElement) return;
        
        const now = new Date();
        const expiry = new Date(expiryTime);
        const remainingSeconds = Math.max(0, Math.floor((expiry - now) / 1000));
        
        if (remainingSeconds <= 0) {
            timerElement.textContent = 'EXPIRED';
            timerElement.style.color = '#e74c3c';
            
            // Process expired trade and remove from active trades
            setTimeout(() => {
                const tradeElement = document.getElementById(`trade-${tradeId}`);
                if (tradeElement) {
                    // Show trade is processing
                    tradeElement.style.border = '2px solid #f39c12';
                    tradeElement.style.background = '#34495e';
                    
                    // Add processing indicator
                    const processingDiv = document.createElement('div');
                    processingDiv.style.cssText = 'text-align: center; color: #f39c12; font-weight: bold; margin-top: 8px;';
                    processingDiv.textContent = 'Processing trade result...';
                    tradeElement.appendChild(processingDiv);
                    
                    setTimeout(() => {
                        tradeElement.style.transition = 'opacity 0.5s';
                        tradeElement.style.opacity = '0';
                        setTimeout(() => {
                            tradeElement.remove();
                            this.loadActiveTrades(); // Refresh the list
                            this.updateBalance(); // Update balance after trade closure
                            this.showNotification('Trade completed and moved to history', 'info');
                        }, 500);
                    }, 1500);
                }
            }, 1000);
        } else {
            timerElement.textContent = this.formatTime(remainingSeconds);
            
            // Change color when time is running out
            if (remainingSeconds <= 30) {
                timerElement.style.color = '#e74c3c';
            } else if (remainingSeconds <= 60) {
                timerElement.style.color = '#f39c12';
            }
        }
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    addTradeToList(trade) {
        // Refresh active trades list instead of adding individual trades
        setTimeout(() => {
            this.loadActiveTrades();
        }, 500);
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
    
    syncDropdownFromChart(tradingViewSymbol) {
        // Create reverse mapping from TradingView symbols to our asset codes
        const reverseSymbolMap = {};
        Object.keys(this.symbolMap).forEach(asset => {
            reverseSymbolMap[this.symbolMap[asset]] = asset;
        });
        
        // Also try partial matching for common symbols
        let matchedAsset = reverseSymbolMap[tradingViewSymbol];
        
        if (!matchedAsset) {
            // Try to find partial matches
            for (const [asset, tvSymbol] of Object.entries(this.symbolMap)) {
                if (tvSymbol.includes(tradingViewSymbol) || tradingViewSymbol.includes(asset)) {
                    matchedAsset = asset;
                    break;
                }
            }
        }
        
        if (matchedAsset && matchedAsset !== this.currentAsset) {
            console.log(`Syncing dropdown: TradingView changed to ${tradingViewSymbol}, setting dropdown to ${matchedAsset}`);
            
            // Update internal state
            this.currentAsset = matchedAsset;
            
            // Update internal asset tracking only (no dropdown to update)
            
            // Asset updated internally
            
            // Show success notification
            this.showNotification(`Symbol synced: ${matchedAsset}`, 'success');
        }
    }
    
    // Price display removed from header - function no longer needed
    
    setupSymbolSynchronization() {
        // Add a manual sync button for user convenience
        this.addManualSyncButton();
        
        // Set up automated monitoring with multiple detection methods
        const iframe = document.querySelector('#tradingview-widget iframe');
        if (iframe) {
            console.log('Found TradingView iframe, setting up symbol monitoring...');
            
            // Method 1: URL monitoring
            this.symbolPollingInterval = setInterval(() => {
                try {
                    const iframeSrc = iframe.src;
                    if (iframeSrc && iframeSrc !== this.lastIframeSrc) {
                        this.lastIframeSrc = iframeSrc;
                        this.extractSymbolFromUrl(iframeSrc);
                    }
                    
                    // Method 2: DOM observation
                    this.monitorTradingViewHeader();
                    
                    // Method 3: Title monitoring 
                    this.monitorDocumentTitle();
                } catch (error) {
                    console.log('Symbol monitoring error:', error);
                }
            }, 1500);
        } else {
            console.log('TradingView iframe not found, retrying...');
            setTimeout(() => this.setupSymbolSynchronization(), 2000);
        }
    }
    
    addManualSyncButton() {
        // Add a sync button to the trading panel for manual synchronization
        const tradingPanel = document.querySelector('#place-trade-btn').parentElement;
        if (tradingPanel && !document.getElementById('sync-symbol-btn')) {
            const syncButton = document.createElement('button');
            syncButton.id = 'sync-symbol-btn';
            syncButton.innerHTML = '🔄 Sync Symbol';
            syncButton.style.cssText = `
                background: #2196f3; color: white; border: none; 
                padding: 8px 12px; border-radius: 4px; font-size: 12px; 
                cursor: pointer; margin-top: 8px; width: 100%;
            `;
            syncButton.onclick = () => this.manualSymbolSync();
            tradingPanel.appendChild(syncButton);
        }
    }
    
    manualSymbolSync() {
        // Manual synchronization triggered by user
        try {
            // Try to detect current TradingView symbol from various sources
            const iframe = document.querySelector('#tradingview-widget iframe');
            if (iframe && iframe.contentWindow) {
                // Try to communicate with iframe
                this.requestSymbolFromTradingView();
            }
            
            // Show user feedback
            this.showNotification('Attempting to sync symbol...', 'info');
            
            // Force check all detection methods
            this.extractSymbolFromUrl(iframe ? iframe.src : '');
            this.monitorTradingViewHeader();
            this.monitorDocumentTitle();
            
        } catch (error) {
            console.log('Manual sync error:', error);
            this.showNotification('Symbol sync failed - try changing symbol in TradingView', 'error');
        }
    }
    
    requestSymbolFromTradingView() {
        // Attempt to communicate with TradingView iframe
        const iframe = document.querySelector('#tradingview-widget iframe');
        if (iframe && iframe.contentWindow) {
            try {
                iframe.contentWindow.postMessage({action: 'getSymbol'}, '*');
            } catch (error) {
                console.log('PostMessage communication failed:', error);
            }
        }
    }
    
    monitorDocumentTitle() {
        // Monitor document title changes for symbol information
        const title = document.title;
        if (title && title !== this.lastDocumentTitle) {
            this.lastDocumentTitle = title;
            // Extract symbol from title if it contains trading information
            const symbolMatch = title.match(/([A-Z]{3,6})\s*[\-\/]\s*([A-Z]{3,6})/);
            if (symbolMatch) {
                const detectedSymbol = symbolMatch[0];
                this.syncDropdownFromChart(detectedSymbol);
            }
        }
    }
    
    extractSymbolFromUrl(url) {
        // Extract symbol information from TradingView URL
        const symbolMatch = url.match(/symbol=([^&]+)/);
        if (symbolMatch) {
            const urlSymbol = decodeURIComponent(symbolMatch[1]);
            if (urlSymbol !== this.lastDetectedSymbol) {
                console.log('URL symbol change detected:', urlSymbol);
                this.lastDetectedSymbol = urlSymbol;
                this.syncDropdownFromChart(urlSymbol);
            }
        }
    }
    
    monitorTradingViewHeader() {
        // Look for symbol display in TradingView widget DOM
        const widgetContainer = document.querySelector('#tradingview-widget');
        if (widgetContainer) {
            // Find elements that might contain symbol information
            const symbolElements = widgetContainer.querySelectorAll('[data-symbol], .symbol, .tv-symbol');
            symbolElements.forEach(element => {
                const symbolText = element.textContent || element.getAttribute('data-symbol');
                if (symbolText && symbolText !== this.lastDetectedSymbol) {
                    console.log('DOM symbol change detected:', symbolText);
                    this.lastDetectedSymbol = symbolText;
                    this.syncDropdownFromChart(symbolText);
                }
            });
        }
    }
}

// Global functions for quick amount selection
function setAmount(amount) {
    document.getElementById('amount-input').value = amount;
    if (window.tradingChart) {
        window.tradingChart.updatePotentialProfit();
    }
}