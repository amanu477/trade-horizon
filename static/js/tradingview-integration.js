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
        this.createTradingInterface();
        this.loadTradingView();
        this.setupEventListeners();
        this.updateChart();
        this.startPriceUpdates();
        this.loadActiveTrades();
    }
    
    createTradingInterface() {
        // Trading interface is already in HTML template
        // Just ensure we have access to the elements
        this.loadWalletBalance();
    }
    
    loadTradingView() {
        // Load TradingView script and create widget
        if (!window.TradingView) {
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.onload = () => {
                setTimeout(() => {
                    this.createWidget();
                }, 1000);
            };
            document.head.appendChild(script);
        } else {
            setTimeout(() => {
                this.createWidget();
            }, 1000);
        }
    }
    
    createWidget() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.log('TradingView container not found, retrying...');
            setTimeout(() => this.createWidget(), 1000);
            return;
        }

        try {
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

            // Set up symbol synchronization after widget loads
            if (this.widget && this.widget.onChartReady) {
                this.widget.onChartReady(() => {
                    console.log('TradingView widget loaded successfully');
                    this.setupSymbolSynchronization();
                });
            }

            setTimeout(() => {
                this.setupSymbolSynchronization();
            }, 3000);
        } catch (error) {
            console.error('Error creating TradingView widget:', error);
        }
    }
    
    setupEventListeners() {
        // Set up event listeners for trading buttons
        const buyButton = document.getElementById('buy-btn');
        const sellButton = document.getElementById('sell-btn');
        
        if (buyButton) {
            buyButton.addEventListener('click', () => {
                this.executeTrade('call');
            });
        }
        
        if (sellButton) {
            sellButton.addEventListener('click', () => {
                this.executeTrade('put');
            });
        }

        // Amount input change listener
        const amountInput = document.getElementById('amount-input');
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                this.updatePotentialProfit();
            });
        }

        // Duration input change listener
        const durationInput = document.getElementById('duration-input');
        if (durationInput) {
            durationInput.addEventListener('input', () => {
                this.updatePotentialProfit();
            });
        }
    }
    
    updateChart() {
        // Chart updates are handled by TradingView widget
        // This method maintained for compatibility
    }
    
    setTimeframe(interval) {
        if (this.widget && this.widget.chart) {
            try {
                this.widget.chart().setResolution(interval);
            } catch (error) {
                console.log('Error setting timeframe:', error);
            }
        }
    }
    
    showTradeModal() {
        // Trade modal functionality is handled by direct execution
        // This method maintained for compatibility
    }
    
    getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
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
        }, 3000);
    }
    
    startPriceUpdates() {
        // Update current price and potential profit periodically
        setInterval(async () => {
            try {
                // Update potential profit
                this.updatePotentialProfit();
                
                // Load active trades to check for updates
                this.loadActiveTrades();
            } catch (error) {
                console.log('Price update error:', error);
            }
        }, 2000);
    }
    
    monitorTradingViewSymbol() {
        // Symbol monitoring is handled by setupSymbolSynchronization
        // This method maintained for compatibility
    }
    
    convertTradingViewSymbol(tvSymbol) {
        // Create reverse mapping from TradingView symbols to our asset codes
        const reverseSymbolMap = {};
        Object.keys(this.symbolMap).forEach(asset => {
            reverseSymbolMap[this.symbolMap[asset]] = asset;
        });
        
        // Also try partial matching for common symbols
        let matchedAsset = reverseSymbolMap[tvSymbol];
        
        if (!matchedAsset) {
            // Try to find partial matches
            for (const [asset, symbol] of Object.entries(this.symbolMap)) {
                if (symbol.includes(tvSymbol) || tvSymbol.includes(asset)) {
                    matchedAsset = asset;
                    break;
                }
            }
        }
        
        return matchedAsset || 'EURUSD';
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
    
    startPriceUpdates() {
        // Regular price updates
        setInterval(() => {
            this.updatePotentialProfit();
        }, 1000);
    }
    
    async loadWalletBalance() {
        try {
            const response = await fetch('/api/wallet_balance');
            const data = await response.json();
            if (data.success) {
                // Check if we're on demo or live page
                const isDemo = this.mode === 'demo';
                const balance = isDemo ? data.demo_balance : data.balance;
                this.updateBalanceDisplay(balance);
            }
        } catch (error) {
            console.error('Error loading wallet balance:', error);
        }
    }
    
    convertTimeToSeconds(timeString) {
        if (!timeString) return 30; // Default 30 seconds
        
        // If it's already a number, return it
        if (!isNaN(timeString)) {
            return parseInt(timeString);
        }
        
        // Convert HH:MM:SS or MM:SS to seconds
        const parts = timeString.split(':');
        if (parts.length === 3) {
            return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
        } else if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        } else {
            return parseInt(timeString) || 30;
        }
    }
    
    async executeTrade(tradeType) {
        console.log(`Executing ${tradeType} trade...`);
        
        const amountInput = document.getElementById('amount-input');
        const durationInput = document.getElementById('duration-input');
        
        if (!amountInput || !durationInput) {
            this.showNotification('Trading inputs not found', 'error');
            return;
        }
        
        const amount = parseFloat(amountInput.value);
        const durationValue = durationInput.value;
        const duration = this.convertTimeToSeconds(durationValue);
        
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
            formData.append('amount', amount.toString());
            formData.append('duration', duration.toString());
            formData.append('csrf_token', this.getCSRFToken());
            
            const response = await fetch('/api/place_trade', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Trade placed successfully!', 'success');
                this.updateBalanceDisplay(result.new_balance);
                this.loadActiveTrades();
                
                // Clear inputs
                amountInput.value = '';
                durationInput.value = '';
                this.updatePotentialProfit();
            } else {
                const messageType = result.error && result.error.toLowerCase().includes('insufficient') ? 'warning' : 'error';
                this.showNotification(result.error || 'Failed to place trade', messageType);
            }
        } catch (error) {
            console.error('Trade placement error:', error);
            this.showNotification('Failed to place trade. Please try again.', 'error');
        } finally {
            // Re-enable buttons
            if (buyBtn) buyBtn.disabled = false;
            if (sellBtn) sellBtn.disabled = false;
        }
    }
    
    updateBalanceDisplay(newBalance) {
        // Update balance in the wallet display if it exists
        const balanceElements = document.querySelectorAll('.balance-display, #wallet-balance, #balance-display');
        balanceElements.forEach(element => {
            if (element && element.textContent) {
                const oldBalance = parseFloat(element.textContent.replace('$', '').replace(',', '')) || 0;
                const newBalanceValue = parseFloat(newBalance);
                
                element.textContent = `$${newBalanceValue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                
                // Add visual effect when balance changes
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
    
    loadWalletBalance() {
        // Fetch current balance and update display
        fetch('/api/wallet_balance')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Check if we're on demo or live page
                    const isDemo = this.mode === 'demo';
                    const balance = isDemo ? data.demo_balance : data.balance;
                    this.updateBalanceDisplay(balance);
                }
            })
            .catch(error => console.error('Error loading wallet balance:', error));
    }
    
    showTradeMessage(message, type) {
        this.showNotification(message, type);
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
                // Store the initial remaining seconds for countdown
                let remainingSeconds = Math.max(0, Math.floor(trade.remaining_seconds));
                
                // Update immediately
                this.updateTradeTimerWithSeconds(trade.id, remainingSeconds);
                
                const timer = setInterval(() => {
                    remainingSeconds = Math.max(0, remainingSeconds - 1);
                    this.updateTradeTimerWithSeconds(trade.id, remainingSeconds);
                    
                    if (remainingSeconds <= 0) {
                        clearInterval(timer);
                        // Add delay before processing to ensure UI update
                        setTimeout(() => {
                            this.processExpiredTrade(trade.id);
                        }, 100);
                    }
                }, 1000);
                this.tradeTimers.push(timer);
            } else {
                // Trade is already expired, process immediately
                setTimeout(() => {
                    this.processExpiredTrade(trade.id);
                }, 100);
            }
        });
    }
    
    updateTradeTimerWithSeconds(tradeId, remainingSeconds) {
        const timerElement = document.getElementById(`timer-${tradeId}`);
        if (!timerElement) return;
        
        if (remainingSeconds <= 0) {
            timerElement.textContent = 'EXPIRED';
            timerElement.style.color = '#e74c3c';
            timerElement.style.fontWeight = 'bold';
        } else {
            timerElement.textContent = this.formatTime(remainingSeconds);
            
            // Color coding for urgency
            if (remainingSeconds <= 10) {
                timerElement.style.color = '#e74c3c';
                timerElement.style.fontWeight = 'bold';
            } else if (remainingSeconds <= 30) {
                timerElement.style.color = '#f39c12';
                timerElement.style.fontWeight = 'bold';
            } else if (remainingSeconds <= 60) {
                timerElement.style.color = '#f39c12';
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
                    // Check if we're on demo or live page
                    const isDemo = window.location.pathname.includes('demo');
                    const balance = isDemo ? data.demo_balance : data.balance;
                    if (balanceDisplay) {
                        balanceDisplay.textContent = `$${balance.toFixed(2)}`;
                    }
                })
                .catch(error => console.error('Error updating balance:', error));
        }, 500);
    }
    
    loadWalletBalance() {
        // Refresh wallet balance after trade completion
        fetch('/api/wallet_balance')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateBalanceDisplay(data.balance);
                }
            })
            .catch(error => console.error('Error loading wallet balance:', error));
    }
    
    async processExpiredTrade(tradeId) {
        try {
            // Immediately remove from active trades display
            const tradeElement = document.getElementById(`trade-${tradeId}`);
            if (tradeElement) {
                tradeElement.style.background = '#34495e';
                tradeElement.style.border = '2px solid #f39c12';
                
                const processingDiv = document.createElement('div');
                processingDiv.style.cssText = 'text-align: center; color: #f39c12; font-weight: bold; margin-top: 8px;';
                processingDiv.textContent = 'Processing...';
                tradeElement.appendChild(processingDiv);
            }
            
            // Call backend to process the expired trade
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
                    // Remove trade element immediately
                    if (tradeElement && tradeElement.parentElement) {
                        tradeElement.style.transition = 'opacity 0.3s';
                        tradeElement.style.opacity = '0';
                        setTimeout(() => {
                            if (tradeElement.parentElement) {
                                tradeElement.remove();
                            }
                        }, 300);
                    }
                    
                    // Update balance immediately
                    this.updateBalanceDisplay(result.new_balance);
                    
                    // Show result notification
                    const profitLoss = result.profit_loss || 0;
                    const sign = profitLoss >= 0 ? '+' : '';
                    const resultText = result.trade_result === 'profit' || result.trade_result === 'won' ? 'PROFIT' : 'LOSS';
                    const notificationMessage = `Trade ${resultText}! ${sign}$${profitLoss.toFixed(2)}`;
                    this.showTradeMessage(notificationMessage, 
                        result.trade_result === 'profit' || result.trade_result === 'won' ? 'success' : 'error');
                        
                    // Refresh trades list after short delay
                    setTimeout(() => {
                        this.loadActiveTrades();
                    }, 1000);
                } else {
                    console.error('Failed to process expired trade:', result.error);
                    // Re-enable trade element if processing failed
                    if (tradeElement) {
                        tradeElement.style.background = '#2a2e39';
                        tradeElement.style.border = '3px solid #ef5350';
                    }
                }
            }
        } catch (error) {
            console.error('Error processing expired trade:', error);
            // Re-enable trade element if processing failed
            const tradeElement = document.getElementById(`trade-${tradeId}`);
            if (tradeElement) {
                tradeElement.style.background = '#2a2e39';
                tradeElement.style.border = '3px solid #ef5350';
            }
        }
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
        const tradingPanel = document.querySelector('#buy-btn').parentElement;
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
        // Try to detect symbol changes from TradingView interface elements
        try {
            const iframe = document.querySelector('#tradingview-widget iframe');
            if (iframe && iframe.contentDocument) {
                const headerElements = iframe.contentDocument.querySelectorAll('[data-name="legend-source-item"]');
                headerElements.forEach(element => {
                    const symbolText = element.textContent;
                    if (symbolText && symbolText !== this.lastHeaderSymbol) {
                        this.lastHeaderSymbol = symbolText;
                        this.syncDropdownFromChart(symbolText);
                    }
                });
            }
        } catch (error) {
            // Cross-origin restrictions prevent direct access
            console.log('Header monitoring restricted:', error);
        }
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