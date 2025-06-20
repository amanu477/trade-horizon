// Global button handlers for TradePro

// Quick amount setter function (called from template onclick)
function setAmount(amount) {
    const amountInput = document.getElementById('trade-amount');
    if (amountInput) {
        amountInput.value = amount;
        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Update potential profit if function exists
        if (window.tradingInterface && window.tradingInterface.updatePotentialProfit) {
            window.tradingInterface.updatePotentialProfit();
        }
    }
}

// Update potential profit (called from template)
function updatePotentialProfit() {
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

// Load asset chart (called from template)
function loadAssetChart(asset) {
    if (window.tradingInterface) {
        window.tradingInterface.currentAsset = asset;
        window.tradingInterface.updateChart();
    }
}

// Initialize trading interface when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize trading interface
    if (typeof TradingInterface !== 'undefined') {
        window.tradingInterface = new TradingInterface();
    }
    
    // Initialize main app
    if (typeof TradePro !== 'undefined') {
        window.tradeProApp = new TradePro();
    }
    
    // Setup quick amount buttons
    document.querySelectorAll('.quick-amounts button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const amount = this.textContent.replace('$', '');
            setAmount(parseFloat(amount));
        });
    });
    
    // Setup trade type buttons
    document.querySelectorAll('input[name="trade_type"]').forEach(input => {
        input.addEventListener('change', function() {
            const callBtn = document.querySelector('label[for="call-btn"]');
            const putBtn = document.querySelector('label[for="put-btn"]');
            
            if (this.value === 'call') {
                callBtn.className = 'btn btn-success';
                putBtn.className = 'btn btn-outline-danger';
            } else {
                putBtn.className = 'btn btn-danger';
                callBtn.className = 'btn btn-outline-success';
            }
        });
    });
    
    // Setup amount input validation
    const amountInput = document.getElementById('trade-amount');
    if (amountInput) {
        amountInput.addEventListener('input', function() {
            updatePotentialProfit();
            
            const amount = parseFloat(this.value) || 0;
            const tradeBtn = document.getElementById('trade-btn');
            
            if (tradeBtn) {
                if (amount < 1) {
                    tradeBtn.disabled = true;
                    tradeBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Minimum $1';
                    tradeBtn.className = 'btn btn-warning btn-lg';
                } else if (amount > 10000) {
                    tradeBtn.disabled = true;
                    tradeBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Maximum $10,000';
                    tradeBtn.className = 'btn btn-warning btn-lg';
                } else {
                    tradeBtn.disabled = false;
                    const isDemo = window.location.pathname.includes('demo');
                    tradeBtn.innerHTML = `<i class="fas fa-play me-2"></i>Place ${isDemo ? 'Demo ' : ''}Trade`;
                    tradeBtn.className = isDemo ? 'btn btn-info btn-lg' : 'btn btn-success btn-lg';
                }
            }
        });
    }
    
    // Setup asset selector synchronization
    document.querySelectorAll('#asset-select, #trade-asset').forEach(select => {
        select.addEventListener('change', function() {
            const newAsset = this.value;
            
            // Sync all asset selectors
            document.querySelectorAll('#asset-select, #trade-asset').forEach(otherSelect => {
                if (otherSelect !== this) {
                    otherSelect.value = newAsset;
                }
            });
            
            // Update price display
            const priceDisplay = document.getElementById('current-price');
            if (priceDisplay) {
                const basePrice = getAssetBasePrice(newAsset);
                const variation = (Math.random() - 0.5) * basePrice * 0.001;
                const currentPrice = basePrice + variation;
                const change = variation > 0 ? '+' : '';
                
                priceDisplay.innerHTML = `
                    <div class="fs-4 fw-bold text-light">${currentPrice.toFixed(5)}</div>
                    <div class="small ${variation > 0 ? 'text-success' : 'text-danger'}">
                        ${change}${(variation / basePrice * 100).toFixed(2)}%
                    </div>
                `;
            }
            
            // Update chart
            loadAssetChart(newAsset);
        });
    });
});

// Get base price for assets
function getAssetBasePrice(asset) {
    const basePrices = {
        'EURUSD': 1.08450,
        'GBPUSD': 1.26320,
        'USDJPY': 148.750,
        'BTCUSD': 43250.00,
        'ETHUSD': 2650.00,
        'XAUUSD': 2025.50,
        'CRUDE': 78.45
    };
    return basePrices[asset] || 1.00000;
}

// Start price updates for current asset
function startPriceUpdates() {
    setInterval(() => {
        const assetSelect = document.getElementById('asset-select');
        const currentAsset = assetSelect ? assetSelect.value : 'EURUSD';
        
        const priceDisplay = document.getElementById('current-price');
        if (priceDisplay) {
            const basePrice = getAssetBasePrice(currentAsset);
            const variation = (Math.random() - 0.5) * basePrice * 0.001;
            const currentPrice = basePrice + variation;
            const change = variation > 0 ? '+' : '';
            
            priceDisplay.innerHTML = `
                <div class="fs-4 fw-bold text-light">${currentPrice.toFixed(5)}</div>
                <div class="small ${variation > 0 ? 'text-success' : 'text-danger'}">
                    ${change}${(variation / basePrice * 100).toFixed(2)}%
                </div>
            `;
        }
    }, 2000);
}

// Start price updates when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPriceUpdates);
} else {
    startPriceUpdates();
}