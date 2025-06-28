/**
 * TradingView Integration for Professional Trading Platform
 * Replaces custom chart with full TradingView widget functionality
 */

class TradingViewChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.mode = options.mode || 'demo';
        this.currentAsset = 'EURUSD';
        this.widget = null;
        this.tradeTimers = [];
        
        // Symbol mapping for TradingView
        this.symbolMap = {
            'EURUSD': 'FX:EURUSD',
            'GBPUSD': 'FX:GBPUSD', 
            'USDJPY': 'FX:USDJPY',
            'BTCUSD': 'CRYPTO:BTCUSD',
            'ETHUSD': 'CRYPTO:ETHUSD',
            'XAUUSD': 'TVC:GOLD',
            'CRUDE': 'NYMEX:CL1!'
        };
        
        this.init();
    }
    
    init() {
        console.log('Initializing TradingView chart...');
        this.loadTradingView();
        this.setupEventListeners();
        this.startPriceUpdates();
        this.loadActiveTrades();
    }
    
    loadTradingView() {
        // Load TradingView script and create widget
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
        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.widget = new TradingView.widget({
            autosize: true,
            symbol: this.symbolMap[this.currentAsset] || 'FX:EURUSD',
            interval: '1',
            timezone: 'Etc/UTC',
            theme: 'dark',
            style: '1',
            locale: 'en',
            toolbar_bg: '#1a1e2e',
            enable_publishing: false,
            hide_top_toolbar: false,
            hide_legend: false,
            save_image: false,
            container_id: this.containerId,
            backgroundColor: '#1a1e2e',
            gridColor: '#2a2e39',
            allow_symbol_change: true,
            studies: [
                'MASimple@tv-basicstudies',
                'RSI@tv-basicstudies'
            ]
        });
    }
    
    setupEventListeners() {
        // Buy button
        const buyBtn = document.getElementById('buy-btn');
        if (buyBtn) {
            buyBtn.addEventListener('click', () => {
                this.placeTrade('call');
            });
        }
        
        // Sell button  
        const sellBtn = document.getElementById('sell-btn');
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                this.placeTrade('put');
            });
        }
        
        // Amount and duration inputs
        const amountInput = document.getElementById('amount-input');
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                this.updatePotentialProfit();
            });
        }
        
        const durationInput = document.getElementById('duration-input');
        if (durationInput) {
            durationInput.addEventListener('input', () => {
                this.updatePotentialProfit();
            });
        }
    }
    
    async placeTrade(tradeType) {
        const amountInput = document.getElementById('amount-input');
        const durationInput = document.getElementById('duration-input');
        
        if (!amountInput || !durationInput) {
            this.showNotification('Trading inputs not found', 'error');
            return;
        }
        
        const amount = parseFloat(amountInput.value);
        const duration = parseInt(durationInput.value);
        
        if (!amount || amount <= 0) {
            this.showNotification('Please enter a valid amount', 'warning');
            return;
        }
        
        if (!duration || duration <= 0) {
            this.showNotification('Please enter a valid duration', 'warning');
            return;
        }
        
        // Disable buttons during trade placement
        const buyBtn = document.getElementById('buy-btn');
        const sellBtn = document.getElementById('sell-btn');
        if (buyBtn) buyBtn.disabled = true;
        if (sellBtn) sellBtn.disabled = true;
        
        try {
            const formData = new FormData();
            formData.append('asset', this.currentAsset);
            formData.append('trade_type', tradeType);
            formData.append('amount', amount);
            formData.append('duration', duration);
            formData.append('csrf_token', this.getCSRFToken());
            
            const response = await fetch('/api/place_trade', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Trade placed successfully!`, 'success');
                this.updateBalanceDisplay(result.new_balance);
                this.loadActiveTrades();
            } else {
                const messageType = result.error && result.error.toLowerCase().includes('insufficient') ? 'warning' : 'error';
                this.showNotification(result.error || 'Failed to place trade', messageType);
            }
        } catch (error) {
            console.error('Trade placement error:', error);
            this.showNotification('Network error. Please try again.', 'error');
        } finally {
            // Re-enable buttons
            if (buyBtn) buyBtn.disabled = false;
            if (sellBtn) sellBtn.disabled = false;
        }
    }
    
    updatePotentialProfit() {
        const amountInput = document.getElementById('amount-input');
        const potentialProfitSpan = document.querySelector('.potential-profit');
        
        if (amountInput && potentialProfitSpan) {
            const amount = parseFloat(amountInput.value) || 0;
            const profit = amount * 0.95; // 95% payout
            potentialProfitSpan.textContent = `$${profit.toFixed(2)}`;
        }
    }
    
    updateBalanceDisplay(newBalance) {
        const balanceElements = document.querySelectorAll('.balance-display, #wallet-balance, #balance-display');
        balanceElements.forEach(element => {
            if (element && element.textContent) {
                const oldBalance = parseFloat(element.textContent.replace('$', '').replace(',', '')) || 0;
                const newBalanceValue = parseFloat(newBalance);
                
                element.textContent = `$${newBalanceValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                
                if (oldBalance !== newBalanceValue) {
                    element.style.transition = 'color 0.3s ease, transform 0.3s ease';
                    element.style.color = newBalanceValue > oldBalance ? '#26a69a' : '#ef5350';
                    element.style.transform = 'scale(1.1)';
                    
                    setTimeout(() => {
                        element.style.color = '';
                        element.style.transform = 'scale(1)';
                    }, 600);
                }
            }
        });
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
        const tradesList = document.getElementById('active-trades-list');
        if (!tradesList) return;
        
        tradesList.innerHTML = '';
        
        if (trades.length === 0) {
            tradesList.innerHTML = '<div style="text-align: center; color: #95a5a6; padding: 20px;">No active trades</div>';
            return;
        }
        
        trades.forEach(trade => {
            const remainingTime = Math.max(0, Math.floor(trade.remaining_seconds));
            const potentialProfit = (parseFloat(trade.amount) * 0.95).toFixed(2);
            
            const tradeElement = document.createElement('div');
            tradeElement.id = `trade-${trade.id}`;
            tradeElement.className = 'trade-item';
            tradeElement.style.cssText = `
                background: #2a2e39; border: 2px solid #3d4450; border-radius: 8px; 
                padding: 12px; margin-bottom: 12px; position: relative;
            `;
            
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
                    <span id="timer-${trade.id}" style="color: #f39c12; font-weight: bold;">${this.formatTime(remainingTime)}</span>
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
                let remainingSeconds = Math.max(0, Math.floor(trade.remaining_seconds));
                
                this.updateTradeTimer(trade.id, remainingSeconds);
                
                const timer = setInterval(() => {
                    remainingSeconds = Math.max(0, remainingSeconds - 1);
                    this.updateTradeTimer(trade.id, remainingSeconds);
                    
                    if (remainingSeconds <= 0) {
                        clearInterval(timer);
                        setTimeout(() => {
                            this.processExpiredTrade(trade.id);
                        }, 100);
                    }
                }, 1000);
                
                this.tradeTimers.push(timer);
            } else {
                setTimeout(() => {
                    this.processExpiredTrade(trade.id);
                }, 100);
            }
        });
    }
    
    updateTradeTimer(tradeId, remainingSeconds) {
        const timerElement = document.getElementById(`timer-${tradeId}`);
        if (!timerElement) return;
        
        if (remainingSeconds <= 0) {
            timerElement.textContent = 'EXPIRED';
            timerElement.style.color = '#e74c3c';
            timerElement.style.fontWeight = 'bold';
        } else {
            timerElement.textContent = this.formatTime(remainingSeconds);
            
            if (remainingSeconds <= 10) {
                timerElement.style.color = '#e74c3c';
                timerElement.style.fontWeight = 'bold';
            } else if (remainingSeconds <= 30) {
                timerElement.style.color = '#f39c12';
                timerElement.style.fontWeight = 'bold';
            } else {
                timerElement.style.color = '#95a5a6';
            }
        }
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
    }
    
    async processExpiredTrade(tradeId) {
        try {
            const tradeElement = document.getElementById(`trade-${tradeId}`);
            if (tradeElement) {
                tradeElement.style.background = '#34495e';
                tradeElement.style.border = '2px solid #f39c12';
                
                const processingDiv = document.createElement('div');
                processingDiv.style.cssText = 'text-align: center; color: #f39c12; font-weight: bold; margin-top: 8px;';
                processingDiv.textContent = 'Processing...';
                tradeElement.appendChild(processingDiv);
            }
            
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
                    if (tradeElement && tradeElement.parentElement) {
                        tradeElement.style.transition = 'opacity 0.3s';
                        tradeElement.style.opacity = '0';
                        setTimeout(() => {
                            if (tradeElement.parentElement) {
                                tradeElement.remove();
                            }
                        }, 300);
                    }
                    
                    this.updateBalanceDisplay(result.new_balance);
                    
                    const profitLoss = result.profit_loss || 0;
                    const sign = profitLoss >= 0 ? '+' : '';
                    const resultText = result.trade_result === 'profit' || result.trade_result === 'won' ? 'PROFIT' : 'LOSS';
                    const notificationMessage = `Trade ${resultText}! ${sign}$${profitLoss.toFixed(2)}`;
                    this.showNotification(notificationMessage, 
                        result.trade_result === 'profit' || result.trade_result === 'won' ? 'success' : 'error');
                        
                    setTimeout(() => {
                        this.loadActiveTrades();
                    }, 1000);
                } else {
                    console.error('Failed to process expired trade:', result.error);
                }
            }
        } catch (error) {
            console.error('Error processing expired trade:', error);
        }
    }
    
    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            padding: 12px 20px; border-radius: 8px; color: white; font-weight: bold;
            max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: all 0.3s ease; opacity: 0; transform: translateX(100%);
        `;
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#26a69a';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef5350';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ff9800';
                break;
            default:
                notification.style.backgroundColor = '#2196f3';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
    }
    
    startPriceUpdates() {
        // Update potential profit display periodically
        setInterval(() => {
            this.updatePotentialProfit();
        }, 1000);
    }
    
    getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }
}

// Global functions for quick amount selection
function setAmount(amount) {
    const amountInput = document.getElementById('amount-input');
    if (amountInput) {
        amountInput.value = amount;
        if (window.tradingChart) {
            window.tradingChart.updatePotentialProfit();
        }
    }
}

// Global function for quick duration selection
function setDuration(seconds) {
    const durationInput = document.getElementById('duration-input');
    if (durationInput) {
        durationInput.value = seconds;
        if (window.tradingChart) {
            window.tradingChart.updatePotentialProfit();
        }
    }
}