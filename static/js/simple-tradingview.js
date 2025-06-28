class SimpleTradingView {
    constructor(containerId) {
        this.containerId = containerId;
        this.currentAsset = 'EURUSD';
        this.widget = null;
        
        // TradingView symbol mapping
        this.symbolMap = {
            'EURUSD': 'FX:EURUSD',
            'GBPUSD': 'FX:GBPUSD', 
            'USDJPY': 'FX:USDJPY',
            'BTCUSD': 'COINBASE:BTCUSD',
            'ETHUSD': 'COINBASE:ETHUSD',
            'XAUUSD': 'TVC:GOLD',
            'CRUDE': 'NYMEX:CL1!'
        };
    }
    
    init() {
        this.createInterface();
        this.loadTradingView();
    }
    
    createInterface() {
        const container = document.getElementById(this.containerId);
        
        container.innerHTML = `
            <div style="height: 100vh; background: #131722; display: flex; flex-direction: column;">
                <!-- Top Bar -->
                <div style="background: #8B4513; padding: 8px 16px; display: flex; align-items: center; gap: 16px; z-index: 1000;">
                    <!-- Current Price -->
                    <div id="price-display" style="color: #4CAF50; font-size: 16px; font-weight: bold;">
                        Loading...
                    </div>
                    
                    <!-- Payout -->
                    <div style="color: #4CAF50; font-size: 14px; font-weight: 500;">
                        Payout: 85%
                    </div>
                    
                    <!-- Spacer -->
                    <div style="flex: 1;"></div>
                    
                    <!-- Place Trade Button -->
                    <button id="place-trade-btn" style="background: #4CAF50; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: 500; cursor: pointer;">
                        Place Trade
                    </button>
                </div>
                
                <!-- TradingView Chart -->
                <div style="flex: 1; position: relative;">
                    <div id="tradingview_widget" style="width: 100%; height: 100%;"></div>
                </div>
            </div>
        `;
        
        // Setup event listeners
        document.getElementById('place-trade-btn').addEventListener('click', () => {
            this.showTradeModal();
        });
        
        // Start price updates
        this.startPriceUpdates();
    }
    
    loadTradingView() {
        // Load TradingView library
        if (!window.TradingView) {
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.onload = () => {
                setTimeout(() => this.createWidget(), 500);
            };
            document.head.appendChild(script);
        } else {
            this.createWidget();
        }
    }
    
    createWidget() {
        const symbol = this.symbolMap[this.currentAsset] || 'FX:EURUSD';
        
        try {
            this.widget = new TradingView.widget({
                container_id: 'tradingview_widget',
                width: '100%',
                height: '100%',
                symbol: symbol,
                interval: '1',
                timezone: 'Etc/UTC',
                theme: 'dark',
                style: '1',
                locale: 'en',
                toolbar_bg: '#1e222d',
                enable_publishing: false,
                allow_symbol_change: true,
                hide_top_toolbar: false,
                hide_legend: false,
                hide_side_toolbar: false,
                save_image: false,
                hide_volume: false,
                overrides: {
                    'paneProperties.background': '#131722',
                    'paneProperties.vertGridProperties.color': '#2a2e39',
                    'paneProperties.horzGridProperties.color': '#2a2e39',
                    'symbolWatermarkProperties.transparency': 90,
                    'scalesProperties.textColor': '#868993',
                    'scalesProperties.lineColor': '#2a2e39'
                },
                disabled_features: [],
                enabled_features: [
                    'study_templates',
                    'header_symbol_search',
                    'header_resolutions',
                    'header_chart_type',
                    'header_indicators',
                    'header_settings',
                    'left_toolbar',
                    'control_bar',
                    'timeframes_toolbar'
                ],
                fullscreen: false,
                autosize: true
            });
            
            console.log('TradingView widget created successfully');
        } catch (error) {
            console.error('Error creating TradingView widget:', error);
            this.createFallbackChart();
        }
    }
    
    createFallbackChart() {
        const container = document.getElementById('tradingview_widget');
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #131722; color: #d1d4dc;">
                <div style="text-align: center;">
                    <h3>Market Chart</h3>
                    <p>Loading real market data...</p>
                    <div style="margin-top: 20px; padding: 20px; background: #1e222d; border-radius: 8px;">
                        <div style="font-size: 24px; color: #4CAF50; margin-bottom: 10px;" id="fallback-price">1.17192</div>
                        <div style="font-size: 14px; color: #868993;">EUR/USD</div>
                    </div>
                </div>
            </div>
        `;
        
        // Update fallback price
        setInterval(() => {
            const priceEl = document.getElementById('fallback-price');
            if (priceEl) {
                const basePrice = 1.17192;
                const variation = (Math.random() - 0.5) * 0.001;
                const newPrice = basePrice + variation;
                priceEl.textContent = newPrice.toFixed(5);
            }
        }, 2000);
    }
    
    showTradeModal() {
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
                
                <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                    <button id="modal-call-btn" style="flex: 1; background: #26a69a; color: white; border: none; padding: 15px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer;">
                        ▲ BUY
                    </button>
                    <button id="modal-put-btn" style="flex: 1; background: #ef5350; color: white; border: none; padding: 15px; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; opacity: 0.6;">
                        ▼ SELL
                    </button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="color: #d1d4dc; display: block; margin-bottom: 8px;">Investment Amount</label>
                    <input type="number" id="modal-amount" value="10" min="1" max="10000" style="width: 100%; background: #2a2e39; color: #d1d4dc; border: 1px solid #434651; padding: 12px; border-radius: 4px; font-size: 16px;">
                </div>
                
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
                
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="cancel-trade" style="background: #434651; color: #d1d4dc; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer;">Cancel</button>
                    <button id="confirm-trade" style="background: #26a69a; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer;">Place Trade</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
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
        
        modal.querySelector('#cancel-trade').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        modal.querySelector('#confirm-trade').addEventListener('click', async () => {
            const amount = modal.querySelector('#modal-amount').value;
            const expiry = modal.querySelector('#modal-expiry').value;
            
            try {
                const response = await fetch('/place_trade', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        asset: this.currentAsset,
                        trade_type: selectedDirection,
                        amount: parseFloat(amount),
                        expiry_minutes: parseInt(expiry),
                        is_demo: true
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    document.body.removeChild(modal);
                    this.showNotification('Trade placed successfully!', 'success');
                } else {
                    this.showNotification(result.message || 'Failed to place trade', 'error');
                }
            } catch (error) {
                console.error('Error placing trade:', error);
                this.showNotification('Network error occurred', 'error');
            }
        });
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
        setInterval(async () => {
            try {
                const response = await fetch(`/api/market-data-new/${this.currentAsset}`);
                const data = await response.json();
                
                if (data.success && data.price) {
                    const priceDisplay = document.getElementById('price-display');
                    if (priceDisplay) {
                        priceDisplay.textContent = data.price.toFixed(5);
                        priceDisplay.style.color = data.change >= 0 ? '#4CAF50' : '#f44336';
                    }
                }
            } catch (error) {
                console.error('Error updating price:', error);
                // Fallback to simulated price
                const priceDisplay = document.getElementById('price-display');
                if (priceDisplay) {
                    const basePrice = 1.17192;
                    const variation = (Math.random() - 0.5) * 0.001;
                    const newPrice = basePrice + variation;
                    priceDisplay.textContent = newPrice.toFixed(5);
                }
            }
        }, 2000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Loading simple TradingView interface...');
    const tradingView = new SimpleTradingView('trading-interface');
    tradingView.init();
    console.log('Simple TradingView interface loaded successfully');
});