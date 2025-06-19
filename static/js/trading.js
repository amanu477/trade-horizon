// TradePro Trading Interface JavaScript

class TradingInterface {
    constructor() {
        this.currentAsset = 'EURUSD';
        this.currentPrice = 1.08450;
        this.isDemo = true;
        this.chart = null;
        this.priceUpdateInterval = null;
        this.activeTrades = [];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startPriceUpdates();
        this.loadActiveTrades();
    }
    
    setupEventListeners() {
        // Asset selection
        const assetSelects = document.querySelectorAll('#asset-select, #trade-asset');
        assetSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                this.currentAsset = e.target.value;
                this.syncAssetSelectors();
                this.updateChart();
            });
        });
        
        // Trade type selection
        const tradeTypeInputs = document.querySelectorAll('input[name="trade_type"]');
        tradeTypeInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateTradeButton(e.target.value);
            });
        });
        
        // Amount input
        const amountInput = document.getElementById('trade-amount');
        if (amountInput) {
            amountInput.addEventListener('input', () => {
                this.updatePotentialProfit();
                this.validateTradeAmount();
            });
        }
        
        // Quick amount buttons
        const quickAmountBtns = document.querySelectorAll('.quick-amounts button');
        quickAmountBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amount = parseFloat(e.target.textContent.replace('$', ''));
                this.setTradeAmount(amount);
            });
        });
        
        // Form submission
        const tradeForm = document.getElementById('trade-form');
        if (tradeForm) {
            tradeForm.addEventListener('submit', (e) => {
                this.handleTradeSubmission(e);
            });
        }
    }
    
    syncAssetSelectors() {
        const assetSelects = document.querySelectorAll('#asset-select, #trade-asset');
        assetSelects.forEach(select => {
            if (select.value !== this.currentAsset) {
                select.value = this.currentAsset;
            }
        });
    }
    
    updateTradeButton(type) {
        const callBtn = document.querySelector('label[for="call-btn"]');
        const putBtn = document.querySelector('label[for="put-btn"]');
        
        if (type === 'call') {
            callBtn.classList.add('btn-success');
            callBtn.classList.remove('btn-outline-success');
            putBtn.classList.add('btn-outline-danger');
            putBtn.classList.remove('btn-danger');
        } else {
            putBtn.classList.add('btn-danger');
            putBtn.classList.remove('btn-outline-danger');
            callBtn.classList.add('btn-outline-success');
            callBtn.classList.remove('btn-success');
        }
    }
    
    setTradeAmount(amount) {
        const amountInput = document.getElementById('trade-amount');
        if (amountInput) {
            amountInput.value = amount;
            this.updatePotentialProfit();
            this.validateTradeAmount();
        }
    }
    
    updatePotentialProfit() {
        const amountInput = document.getElementById('trade-amount');
        const investmentAmount = document.getElementById('investment-amount');
        const potentialProfit = document.getElementById('potential-profit');
        
        if (amountInput && investmentAmount && potentialProfit) {
            const amount = parseFloat(amountInput.value) || 0;
            const payout = 0.85; // 85% payout
            const profit = amount * payout;
            
            investmentAmount.textContent = `$${amount.toFixed(2)}`;
            potentialProfit.textContent = `$${profit.toFixed(2)}`;
        }
    }
    
    validateTradeAmount() {
        const amountInput = document.getElementById('trade-amount');
        const tradeBtn = document.getElementById('trade-btn');
        
        if (!amountInput || !tradeBtn) return;
        
        const amount = parseFloat(amountInput.value) || 0;
        const balance = this.isDemo ? 10000 : 1000; // Default values
        
        if (amount > balance) {
            tradeBtn.disabled = true;
            tradeBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Insufficient Balance';
            tradeBtn.className = 'btn btn-danger btn-lg';
        } else if (amount < 1) {
            tradeBtn.disabled = true;
            tradeBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Minimum $1';
            tradeBtn.className = 'btn btn-warning btn-lg';
        } else {
            tradeBtn.disabled = false;
            const icon = this.isDemo ? 'play' : 'dollar-sign';
            const text = this.isDemo ? 'Place Demo Trade' : 'Place Live Trade';
            tradeBtn.innerHTML = `<i class="fas fa-${icon} me-2"></i>${text}`;
            tradeBtn.className = `btn btn-${this.isDemo ? 'info' : 'success'} btn-lg`;
        }
    }
    
    handleTradeSubmission(e) {
        const tradeBtn = document.getElementById('trade-btn');
        if (tradeBtn) {
            tradeBtn.disabled = true;
            tradeBtn.innerHTML = '<span class="loading-spinner me-2"></span>Processing...';
        }
        
        // Form will submit normally, this just provides visual feedback
        setTimeout(() => {
            if (tradeBtn) {
                tradeBtn.disabled = false;
                this.validateTradeAmount();
            }
        }, 2000);
    }
    
    startPriceUpdates() {
        this.updateCurrentPrice();
        this.priceUpdateInterval = setInterval(() => {
            this.updateCurrentPrice();
        }, 2000); // Update every 2 seconds
    }
    
    updateCurrentPrice() {
        // Simulate price movement
        const volatility = this.getAssetVolatility(this.currentAsset);
        const change = (Math.random() - 0.5) * volatility * 2;
        this.currentPrice *= (1 + change);
        
        // Update price display
        const priceElement = document.getElementById('current-price');
        const changeElement = document.getElementById('price-change');
        
        if (priceElement) {
            priceElement.textContent = this.currentPrice.toFixed(5);
        }
        
        if (changeElement) {
            const changePercent = (change * 100).toFixed(2);
            const changeValue = (this.currentPrice * change).toFixed(5);
            const isPositive = change > 0;
            
            changeElement.textContent = `${isPositive ? '+' : ''}${changeValue} (${isPositive ? '+' : ''}${changePercent}%)`;
            changeElement.className = `price-change ms-2 ${isPositive ? 'text-success' : 'text-danger'}`;
        }
    }
    
    getAssetVolatility(asset) {
        const volatilities = {
            'EURUSD': 0.001,
            'GBPUSD': 0.0015,
            'USDJPY': 0.002,
            'BTCUSD': 0.02,
            'ETHUSD': 0.025,
            'XAUUSD': 0.01,
            'CRUDE': 0.015
        };
        return volatilities[asset] || 0.01;
    }
    
    updateChart() {
        if (this.chart) {
            this.chart.updateAsset(this.currentAsset);
        }
    }
    
    loadActiveTrades() {
        // This would typically fetch from the server
        // For now, we'll check if there are any active trades in the DOM
        const activeTradesContainer = document.getElementById('active-trades-list');
        if (activeTradesContainer) {
            // Update active trades display
            this.displayActiveTrades();
        }
    }
    
    displayActiveTrades() {
        const container = document.getElementById('active-trades-list');
        if (!container) return;
        
        if (this.activeTrades.length === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-3">
                    <i class="fas fa-info-circle me-2"></i>No active trades. Place a trade to see it here.
                </div>
            `;
        } else {
            // Display active trades
            let html = '<div class="row g-3">';
            this.activeTrades.forEach(trade => {
                html += this.createTradeCard(trade);
            });
            html += '</div>';
            container.innerHTML = html;
        }
    }
    
    createTradeCard(trade) {
        const typeClass = trade.type === 'call' ? 'success' : 'danger';
        const typeIcon = trade.type === 'call' ? 'arrow-up' : 'arrow-down';
        
        return `
            <div class="col-md-6 col-lg-4">
                <div class="bg-secondary bg-opacity-25 rounded p-3">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="text-light mb-0">${trade.asset}</h6>
                        <span class="badge bg-${typeClass}">
                            <i class="fas fa-${typeIcon} me-1"></i>${trade.type.toUpperCase()}
                        </span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">Amount:</span>
                        <span class="text-light">$${trade.amount.toFixed(2)}</span>
                    </div>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="text-muted">Entry:</span>
                        <span class="text-light">${trade.entryPrice.toFixed(5)}</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <span class="text-muted">Expires:</span>
                        <span class="text-warning">${this.formatTimeRemaining(trade.expiryTime)}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    formatTimeRemaining(expiryTime) {
        const now = new Date();
        const expiry = new Date(expiryTime);
        const diff = expiry - now;
        
        if (diff <= 0) return 'Expired';
        
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    setMode(mode) {
        this.isDemo = mode === 'demo';
        this.validateTradeAmount();
    }
    
    destroy() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
    }
}

// Global trading interface instance
let tradingInterface;

// Initialize trading interface
function initializeTradingInterface(mode = 'demo') {
    if (tradingInterface) {
        tradingInterface.destroy();
    }
    
    tradingInterface = new TradingInterface();
    tradingInterface.setMode(mode);
}

// Utility functions
function setAmount(amount) {
    if (tradingInterface) {
        tradingInterface.setTradeAmount(amount);
    }
}

function updatePotentialProfit() {
    if (tradingInterface) {
        tradingInterface.updatePotentialProfit();
    }
}

function loadAssetChart(asset) {
    if (tradingInterface) {
        tradingInterface.currentAsset = asset;
        tradingInterface.updateChart();
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TradingInterface, initializeTradingInterface };
}
