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
    if (pocketChart) {
        pocketChart.changeAsset(asset);
    } else if (window.tradingInterface) {
        window.tradingInterface.currentAsset = asset;
        window.tradingInterface.updateChart();
    }
}

// Professional chart instance
let pocketChart = null;

// Initialize trading interface when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Pocket Option style chart if on trading page
    const chartContainer = document.getElementById('pocket-chart-container');
    if (chartContainer && typeof PocketOptionChart !== 'undefined') {
        pocketChart = new PocketOptionChart('pocket-chart-container', {
            asset: 'EURUSD',
            type: 'candlestick',
            timeframe: '1m'
        });
    }
    
    // Initialize trading interface
    if (typeof TradingInterface !== 'undefined') {
        window.tradingInterface = new TradingInterface();
    }
    
    // Initialize main app
    if (typeof TradePro !== 'undefined') {
        window.tradeProApp = new TradePro();
    }
    
    // Setup chart controls
    setupChartControls();
    
    // Setup real-time payout updates
    setupPayoutUpdates();
    
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
    document.querySelectorAll('#asset-select, #trade-asset, #chart-asset-selector').forEach(select => {
        select.addEventListener('change', function() {
            const newAsset = this.value;
            
            // Sync all asset selectors
            document.querySelectorAll('#asset-select, #trade-asset, #chart-asset-selector').forEach(otherSelect => {
                if (otherSelect !== this) {
                    otherSelect.value = newAsset;
                }
            });
            
            // Update chart
            loadAssetChart(newAsset);
            
            // Update price display with real data
            updateRealTimePrice(newAsset);
            
            // Update payout
            if (window.setupPayoutUpdates) {
                setTimeout(() => {
                    const updateEvent = new Event('change');
                    this.dispatchEvent(updateEvent);
                }, 100);
            }
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

// Update price display with real market data
async function updateRealTimePrice(asset) {
    try {
        const response = await fetch(`/api/market-data/${asset}`);
        const data = await response.json();
        
        if (data.price) {
            const priceDisplay = document.getElementById('current-price');
            if (priceDisplay) {
                const changeSign = data.change >= 0 ? '+' : '';
                const changeClass = data.change >= 0 ? 'text-success' : 'text-danger';
                
                priceDisplay.innerHTML = `
                    <div class="fs-4 fw-bold text-light">${data.price.toFixed(5)}</div>
                    <div class="small ${changeClass}">
                        ${changeSign}${data.change.toFixed(5)} (${changeSign}${data.change_percent.toFixed(2)}%)
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error fetching real-time price:', error);
        // Fallback to simulated price
        updateFallbackPrice(asset);
    }
}

function updateFallbackPrice(asset) {
    const priceDisplay = document.getElementById('current-price');
    if (priceDisplay) {
        const basePrice = getAssetBasePrice(asset);
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
}

// Start price updates for current asset
function startPriceUpdates() {
    const assetSelect = document.getElementById('asset-select');
    const currentAsset = assetSelect ? assetSelect.value : 'EURUSD';
    
    // Update immediately
    updateRealTimePrice(currentAsset);
    
    // Then update every 5 seconds
    setInterval(() => {
        const currentAsset = assetSelect ? assetSelect.value : 'EURUSD';
        updateRealTimePrice(currentAsset);
    }, 5000);
}

// Start price updates when page loads
// Setup chart controls
function setupChartControls() {
    // Chart controls are now handled within PocketOptionChart class
    // This function is kept for compatibility
    console.log('Chart controls initialized via PocketOptionChart');
}

// Setup real-time payout updates
function setupPayoutUpdates() {
    const payoutEl = document.getElementById('payout-percentage');
    const factorsEl = document.getElementById('payout-factors');
    const loadingEl = document.getElementById('payout-loading');
    
    if (!payoutEl) return;
    
    function updatePayout() {
        const assetSelect = document.getElementById('asset-select');
        const expirySelect = document.querySelector('select[name="expiry_minutes"]');
        
        if (!assetSelect || !expirySelect) return;
        
        const asset = assetSelect.value;
        const expiryMinutes = expirySelect.value;
        
        if (loadingEl) loadingEl.style.display = 'inline';
        
        fetch(`/api/payout/${asset}/${expiryMinutes}`)
            .then(response => response.json())
            .then(data => {
                if (data.payout_percentage) {
                    payoutEl.textContent = data.payout_percentage.toFixed(1);
                    
                    if (factorsEl && data.factors) {
                        factorsEl.textContent = data.factors.explanation;
                    }
                    
                    // Update potential profit
                    updatePotentialProfit();
                }
            })
            .catch(error => {
                console.error('Error updating payout:', error);
            })
            .finally(() => {
                if (loadingEl) loadingEl.style.display = 'none';
            });
    }
    
    // Update payout when asset or expiry changes
    document.addEventListener('change', function(e) {
        if (e.target.matches('#asset-select, select[name="expiry_minutes"]')) {
            updatePayout();
        }
    });
    
    // Update payout every 30 seconds
    setInterval(updatePayout, 30000);
    
    // Initial update
    setTimeout(updatePayout, 1000);
}

// Enhanced potential profit calculation
function updatePotentialProfit() {
    const amountInput = document.getElementById('trade-amount');
    const investmentAmount = document.getElementById('investment-amount');
    const potentialProfit = document.getElementById('potential-profit');
    const payoutPercentage = document.getElementById('payout-percentage');
    
    if (amountInput && investmentAmount && potentialProfit && payoutPercentage) {
        const amount = parseFloat(amountInput.value) || 0;
        const payout = parseFloat(payoutPercentage.textContent) || 85;
        const profit = amount * (payout / 100);
        
        investmentAmount.textContent = `$${amount.toFixed(2)}`;
        potentialProfit.textContent = `$${profit.toFixed(2)}`;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPriceUpdates);
} else {
    startPriceUpdates();
}