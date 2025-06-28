// Simple trading interface without complex DOM dependencies
class SimpleTradingInterface {
    constructor(mode = 'live') {
        this.mode = mode;
        this.currentAsset = 'EURUSD';
        this.selectedDirection = null;
        this.tradeTimers = [];
        this.init();
    }
    
    init() {
        this.createTradingInterface();
        this.initializeTradingViewChart();
        this.loadActiveTrades();
        
        // Refresh active trades every 5 seconds
        setInterval(() => {
            this.loadActiveTrades();
        }, 5000);
    }
    
    createTradingInterface() {
        const container = document.getElementById('tradingview-trading-interface');
        if (!container) return;
        
        container.innerHTML = `
            <div style="display: flex; height: 100vh; background: #1a1a1a; color: white;">
                <!-- Chart Area -->
                <div style="flex: 1; background: #222; border-right: 1px solid #333;">
                    <div style="padding: 20px; text-align: center;">
                        <h2 style="color: #26a69a; margin-bottom: 20px;">TradingView Chart</h2>
                        <div id="tradingview_chart" style="height: 500px; background: #333; border-radius: 8px; position: relative;">
                            <!-- TradingView Widget -->
                            <div id="tradingview_widget" style="height: 100%; width: 100%;"></div>
                            
                            <!-- Price Display Overlay -->
                            <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 5px;">
                                <div style="color: #95a5a6; font-size: 12px;">EUR/USD</div>
                                <div id="price-display" style="font-size: 18px; font-weight: bold; color: #26a69a;">1.0850</div>
                                <div style="color: #95a5a6; font-size: 10px;">Live</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Trading Panel -->
                <div style="width: 350px; background: #2a2a2a; padding: 20px; overflow-y: auto;">
                    <h3 style="margin-bottom: 20px; color: #26a69a;">Trading Panel</h3>
                    
                    <!-- Balance Display -->
                    <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="color: #95a5a6; font-size: 14px;">Balance:</div>
                        <div id="balance-display" style="font-size: 24px; font-weight: bold; color: #26a69a;">$0.00</div>
                    </div>
                    
                    <!-- Trading Form -->
                    <div style="background: #333; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #95a5a6;">Investment Amount:</label>
                            <input type="number" id="amount-input" value="10" min="1" max="10000" 
                                   style="width: 100%; padding: 10px; background: #444; border: 1px solid #555; color: white; border-radius: 4px;">
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; color: #95a5a6;">Duration (seconds):</label>
                            <input type="number" id="duration-input" value="30" min="5" max="3600" 
                                   style="width: 100%; padding: 10px; background: #444; border: 1px solid #555; color: white; border-radius: 4px;">
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                            <button id="buy-btn" onclick="window.tradingInterface.placeTrade('call')" 
                                    style="flex: 1; padding: 12px; background: #26a69a; border: none; color: white; border-radius: 4px; font-weight: bold; cursor: pointer;">
                                BUY
                            </button>
                            <button id="sell-btn" onclick="window.tradingInterface.placeTrade('put')" 
                                    style="flex: 1; padding: 12px; background: #ef5350; border: none; color: white; border-radius: 4px; font-weight: bold; cursor: pointer;">
                                SELL
                            </button>
                        </div>
                        
                        <div id="trade-message" style="margin-top: 10px; padding: 10px; border-radius: 4px; display: none;"></div>
                    </div>
                    
                    <!-- Active Trades -->
                    <div style="background: #333; padding: 20px; border-radius: 8px;">
                        <h4 style="margin-bottom: 15px; color: #26a69a;">Active Trades</h4>
                        <div id="trades-list" style="max-height: 300px; overflow-y: auto;">
                            <div style="color: #868993; text-align: center; padding: 20px;">No active trades</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.loadWalletBalance();
    }
    
    initializeTradingViewChart() {
        // Initialize TradingView widget
        setTimeout(() => {
            try {
                new TradingView.widget({
                    "width": "100%",
                    "height": "100%",
                    "symbol": "FX:EURUSD",
                    "interval": "1",
                    "timezone": "Etc/UTC",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#f1f3f6",
                    "enable_publishing": false,
                    "hide_top_toolbar": false,
                    "hide_legend": true,
                    "save_image": false,
                    "container_id": "tradingview_widget",
                    "studies": [],
                    "show_popup_button": false,
                    "popup_width": "1000",
                    "popup_height": "650"
                });
            } catch (error) {
                // If TradingView fails, show a simple chart placeholder
                const widget = document.getElementById('tradingview_widget');
                if (widget) {
                    widget.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; flex-direction: column;">
                            <div style="text-align: center;">
                                <h3 style="color: #26a69a; margin-bottom: 20px;">EUR/USD Chart</h3>
                                <div style="width: 80%; height: 300px; background: linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; border: 2px solid #26a69a; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                                    <div style="text-align: center;">
                                        <div style="font-size: 24px; color: #26a69a; margin-bottom: 10px;">📈</div>
                                        <div style="color: #95a5a6;">Chart Loading...</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            }
        }, 1000);
    }
    
    async placeTrade(direction) {
        const amount = parseFloat(document.getElementById('amount-input').value);
        const durationSeconds = parseInt(document.getElementById('duration-input').value);
        
        if (!amount || amount < 1) {
            this.showMessage('Please enter a valid investment amount', 'error');
            return;
        }
        
        if (!durationSeconds || durationSeconds < 5) {
            this.showMessage('Duration must be at least 5 seconds', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('asset', this.currentAsset);
        formData.append('trade_type', direction);
        formData.append('amount', amount);
        formData.append('expiry_seconds', durationSeconds);
        formData.append('is_demo', this.mode === 'demo' ? 'true' : 'false');
        
        // Get CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        if (csrfToken) {
            formData.append('csrf_token', csrfToken.getAttribute('content'));
        }
        
        try {
            const response = await fetch('/place_trade', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('Trade placed successfully!', 'success');
                this.loadWalletBalance();
                setTimeout(() => this.loadActiveTrades(), 500);
            } else {
                this.showMessage(data.error || 'Failed to place trade', 'error');
            }
        } catch (error) {
            this.showMessage('Network error. Please try again.', 'error');
        }
    }
    
    async loadActiveTrades() {
        try {
            const response = await fetch('/api/active_trades');
            const data = await response.json();
            
            if (data.success) {
                this.displayActiveTrades(data.trades);
                this.startTradeTimers(data.trades);
            }
        } catch (error) {
            // Silent error handling
        }
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
            tradeElement.style.cssText = 'background: #444; margin-bottom: 10px; padding: 15px; border-radius: 8px; border-left: 3px solid ' + (trade.trade_type === 'call' ? '#26a69a' : '#ef5350');
            
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
        this.tradeTimers.forEach(timer => clearInterval(timer));
        this.tradeTimers = [];
        
        trades.forEach(trade => {
            if (trade.remaining_seconds > 0) {
                let remainingSeconds = trade.remaining_seconds;
                
                const timer = setInterval(async () => {
                    remainingSeconds--;
                    this.updateTradeTimer(trade.id, remainingSeconds);
                    
                    if (remainingSeconds <= 0) {
                        clearInterval(timer);
                        await this.processExpiredTrade(trade.id);
                    }
                }, 1000);
                
                this.tradeTimers.push(timer);
            }
        });
    }
    
    updateTradeTimer(tradeId, remainingSeconds) {
        const timerElement = document.getElementById(`timer-${tradeId}`);
        if (!timerElement) return;
        
        if (remainingSeconds <= 0) {
            timerElement.textContent = 'CLOSING...';
            timerElement.style.color = '#e74c3c';
        } else {
            timerElement.textContent = this.formatTime(remainingSeconds);
            
            if (remainingSeconds <= 10) {
                timerElement.style.color = '#e74c3c';
            } else if (remainingSeconds <= 30) {
                timerElement.style.color = '#f39c12';
            }
        }
    }
    
    async processExpiredTrade(tradeId) {
        try {
            const response = await fetch(`/api/process_expired_trade/${tradeId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCSRFToken()
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                
                if (result.success) {
                    // Show result notification
                    const status = result.trade.status;
                    const message = status === 'won' ? 
                        `Trade won! Profit: $${result.trade.profit_loss}` : 
                        `Trade lost: -$${Math.abs(result.trade.profit_loss)}`;
                    
                    this.showMessage(message, status === 'won' ? 'success' : 'error');
                    
                    // Update balance and refresh trades
                    this.loadWalletBalance();
                    setTimeout(() => this.loadActiveTrades(), 1000);
                }
            }
        } catch (error) {
            // Silent error handling
        }
    }
    
    async loadWalletBalance() {
        try {
            const response = await fetch('/api/wallet_balance');
            const data = await response.json();
            
            if (data.success) {
                const balance = this.mode === 'demo' ? data.demo_balance : data.balance;
                const balanceElement = document.getElementById('balance-display');
                if (balanceElement) {
                    balanceElement.textContent = `$${balance.toFixed(2)}`;
                }
            }
        } catch (error) {
            // Silent error handling
        }
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }
    
    showMessage(message, type) {
        const messageElement = document.getElementById('trade-message');
        if (!messageElement) return;
        
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        messageElement.style.backgroundColor = type === 'success' ? '#26a69a' : '#ef5350';
        messageElement.style.color = 'white';
        
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 3000);
    }
    
    getCSRFToken() {
        const csrfToken = document.querySelector('meta[name="csrf-token"]');
        return csrfToken ? csrfToken.getAttribute('content') : '';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Determine mode from URL
    const mode = window.location.pathname.includes('demo') ? 'demo' : 'live';
    window.tradingInterface = new SimpleTradingInterface(mode);
});