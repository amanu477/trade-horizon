// Fast Professional Trading Interface - Immediate Loading
// Simplified version that loads instantly without dependencies

class FastTradingInterface {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.currentAsset = options.asset || 'EURUSD';
        this.mode = options.mode || 'demo';
        this.data = [];
        
        if (this.container) {
            this.init();
        }
    }
    
    init() {
        console.log(`Loading ${this.mode} trading interface for ${this.currentAsset}`);
        this.createInterface();
        this.generateData();
        this.renderChart();
        this.setupEvents();
        this.startUpdates();
    }
    
    createInterface() {
        this.container.innerHTML = `
            <div style="background: #1e2328; height: 100vh; display: flex; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <!-- Chart Area -->
                <div style="flex: 1; display: flex; flex-direction: column;">
                    <!-- Header -->
                    <div style="background: #1e2328; padding: 12px 16px; border-bottom: 1px solid #2b3139; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <select id="asset-select" style="background: #2b3139; color: #f1f1f1; border: none; padding: 8px 12px; border-radius: 4px; font-weight: 600;">
                                <option value="EURUSD">EUR/USD OTC</option>
                                <option value="GBPUSD">GBP/USD OTC</option>
                                <option value="USDJPY">USD/JPY OTC</option>
                                <option value="BTCUSD">BTC/USD</option>
                                <option value="ETHUSD">ETH/USD</option>
                                <option value="XAUUSD">XAU/USD</option>
                            </select>
                        </div>
                        <div style="color: #f1f1f1; font-size: 14px;">
                            <span id="current-price">1.16537</span>
                            <span style="color: #02c076; margin-left: 8px;" id="price-change">+0.0012 (+0.10%)</span>
                        </div>
                    </div>
                    
                    <!-- Chart Canvas -->
                    <div style="flex: 1; position: relative; background: #131722;">
                        <canvas id="trading-canvas" style="width: 100%; height: 100%;"></canvas>
                        
                        <!-- Price Scale -->
                        <div style="position: absolute; right: 0; top: 0; bottom: 30px; width: 60px; background: #1e2328; border-left: 1px solid #2b3139; display: flex; flex-direction: column; justify-content: space-between; padding: 20px 8px;">
                            <div style="color: #f1f1f1; font-size: 10px;">1.16400</div>
                            <div style="color: #f1f1f1; font-size: 10px;">1.16300</div>
                            <div style="color: #fcd535; font-size: 10px; background: #2b3139; padding: 2px 4px; border-radius: 2px;" id="price-scale">1.16229</div>
                            <div style="color: #f1f1f1; font-size: 10px;">1.16100</div>
                            <div style="color: #f1f1f1; font-size: 10px;">1.15990</div>
                        </div>
                        
                        <!-- Time Scale -->
                        <div style="position: absolute; bottom: 0; left: 0; right: 60px; height: 30px; background: #1e2328; border-top: 1px solid #2b3139; display: flex; align-items: center; justify-content: space-around; font-size: 10px; color: #848e9c;">
                            <span>16:30</span>
                            <span>16:40</span>
                            <span>16:50</span>
                            <span>17:00</span>
                        </div>
                    </div>
                </div>
                
                <!-- Trading Panel -->
                <div style="width: 300px; background: #1e2328; border-left: 1px solid #2b3139; display: flex; flex-direction: column;">
                    <!-- Header -->
                    <div style="padding: 16px; border-bottom: 1px solid #2b3139;">
                        <h3 style="color: #f1f1f1; margin: 0; font-size: 16px; font-weight: 600;">Trades</h3>
                        <div style="display: flex; margin-top: 16px; background: #2b3139; border-radius: 6px; padding: 2px;">
                            <button style="flex: 1; background: #f1f1f1; color: #1e2328; border: none; padding: 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Opened</button>
                            <button style="flex: 1; background: transparent; color: #848e9c; border: none; padding: 8px; border-radius: 4px; font-size: 12px;">Closed</button>
                        </div>
                    </div>
                    
                    <!-- No Trades -->
                    <div style="flex: 1; padding: 16px; text-align: center; color: #848e9c; margin-top: 40px;">
                        <div style="font-size: 14px;">No opened trades</div>
                    </div>
                    
                    <!-- Trading Form -->
                    <div style="padding: 16px; border-top: 1px solid #2b3139;">
                        <!-- Balance -->
                        <div style="background: #2b3139; border-radius: 6px; padding: 12px; margin-bottom: 16px;">
                            <div style="color: #848e9c; font-size: 12px; margin-bottom: 4px;">${this.mode === 'demo' ? 'Demo' : 'Live'} Balance</div>
                            <div style="color: #f1f1f1; font-size: 18px; font-weight: 600;">$${this.mode === 'demo' ? '10,000.00' : '1,000.00'}</div>
                        </div>
                        
                        <!-- Timer -->
                        <div style="text-align: center; margin-bottom: 16px;">
                            <div style="color: #f1f1f1; font-size: 24px; font-weight: 600; margin-bottom: 4px;">
                                <span id="timer">00:00:05</span>
                            </div>
                            <div style="color: #848e9c; font-size: 12px;">Time</div>
                        </div>
                        
                        <!-- Amount -->
                        <div style="margin-bottom: 16px;">
                            <div style="color: #f1f1f1; font-size: 12px; margin-bottom: 8px;">Amount</div>
                            <div style="background: #2b3139; border-radius: 6px; padding: 12px; display: flex; align-items: center; justify-content: center;">
                                <input type="number" id="amount-input" value="10" min="1" max="10000" 
                                       style="background: transparent; border: none; color: #f1f1f1; font-size: 24px; font-weight: 600; text-align: center; width: 100%; outline: none;">
                            </div>
                        </div>
                        
                        <!-- Payout -->
                        <div style="margin-bottom: 20px;">
                            <div style="color: #f1f1f1; font-size: 12px; margin-bottom: 8px;">Payout</div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="color: #02c076; font-size: 18px; font-weight: 600;">+92%</div>
                                <div style="color: #02c076; font-size: 14px;">+$<span id="payout-amount">9.20</span></div>
                            </div>
                        </div>
                        
                        <!-- Trade Buttons -->
                        <div style="display: flex; gap: 8px;">
                            <button id="buy-btn" style="flex: 1; background: #02c076; color: #ffffff; border: none; padding: 16px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                <span style="margin-right: 8px;">↑</span>BUY
                            </button>
                            <button id="sell-btn" style="flex: 1; background: #f6465d; color: #ffffff; border: none; padding: 16px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                <span style="margin-right: 8px;">↓</span>SELL
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('trading-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth - 60;
        this.canvas.height = container.offsetHeight - 30;
    }
    
    generateData() {
        const basePrice = this.getBasePrice(this.currentAsset);
        this.data = [];
        
        let currentPrice = basePrice;
        const now = new Date();
        
        for (let i = 50; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60000);
            const variation = (Math.random() - 0.5) * basePrice * 0.003;
            const open = currentPrice;
            const close = open + variation;
            const high = Math.max(open, close) + Math.random() * basePrice * 0.001;
            const low = Math.min(open, close) - Math.random() * basePrice * 0.001;
            
            this.data.push({
                time: time,
                open: open,
                high: high,
                low: low,
                close: close
            });
            
            currentPrice = close;
        }
        
        this.updatePriceDisplay(currentPrice);
    }
    
    renderChart() {
        if (!this.ctx || !this.data.length) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        this.ctx.fillStyle = '#131722';
        this.ctx.fillRect(0, 0, width, height);
        
        // Calculate price range
        const prices = this.data.flatMap(d => [d.high, d.low]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;
        
        const chartMinPrice = minPrice - padding;
        const chartMaxPrice = maxPrice + padding;
        const chartPriceRange = chartMaxPrice - chartMinPrice;
        
        // Draw grid
        this.ctx.strokeStyle = '#2a2e39';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= 5; i++) {
            const y = (i / 5) * height;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Draw candlesticks
        const candleWidth = Math.max(2, (width / this.data.length) * 0.8);
        const candleSpacing = width / this.data.length;
        
        this.data.forEach((candle, index) => {
            const x = index * candleSpacing + candleSpacing / 2;
            const openY = height - ((candle.open - chartMinPrice) / chartPriceRange) * height;
            const closeY = height - ((candle.close - chartMinPrice) / chartPriceRange) * height;
            const highY = height - ((candle.high - chartMinPrice) / chartPriceRange) * height;
            const lowY = height - ((candle.low - chartMinPrice) / chartPriceRange) * height;
            
            const isGreen = candle.close > candle.open;
            const color = isGreen ? '#02c076' : '#f6465d';
            
            // Draw wick
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x, highY);
            this.ctx.lineTo(x, lowY);
            this.ctx.stroke();
            
            // Draw body
            this.ctx.fillStyle = color;
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY);
            this.ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, Math.max(1, bodyHeight));
        });
    }
    
    setupEvents() {
        // Asset selector
        document.getElementById('asset-select').addEventListener('change', (e) => {
            this.currentAsset = e.target.value;
            this.generateData();
            this.renderChart();
        });
        
        // Amount input
        document.getElementById('amount-input').addEventListener('input', (e) => {
            const amount = parseFloat(e.target.value) || 0;
            const payout = (amount * 0.92).toFixed(2);
            document.getElementById('payout-amount').textContent = payout;
        });
        
        // Trade buttons
        document.getElementById('buy-btn').addEventListener('click', () => {
            this.placeTrade('buy');
        });
        
        document.getElementById('sell-btn').addEventListener('click', () => {
            this.placeTrade('sell');
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.renderChart();
        });
    }
    
    placeTrade(type) {
        const amount = parseFloat(document.getElementById('amount-input').value);
        if (!amount || amount < 1) {
            this.showNotification('Please enter a valid amount', 'error');
            return;
        }
        
        const currentPrice = this.data[this.data.length - 1].close;
        
        // Submit trade to backend
        this.submitTrade({
            asset: this.currentAsset,
            trade_type: type === 'buy' ? 'call' : 'put',
            amount: amount,
            expiry_minutes: 1,
            is_demo: this.mode === 'demo'
        });
        
        this.showNotification(`${type.toUpperCase()} trade placed: $${amount}`, 'success');
    }
    
    async submitTrade(tradeData) {
        try {
            const formData = new FormData();
            Object.keys(tradeData).forEach(key => {
                formData.append(key, tradeData[key]);
            });
            
            const response = await fetch('/place_trade', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('Trade placed successfully:', result);
            }
        } catch (error) {
            console.error('Error placing trade:', error);
        }
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#02c076' : '#f6465d'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
    
    updatePriceDisplay(price) {
        document.getElementById('current-price').textContent = price.toFixed(5);
        document.getElementById('price-scale').textContent = price.toFixed(5);
    }
    
    startUpdates() {
        // Update timer
        setInterval(() => {
            const seconds = new Date().getSeconds();
            const nextMinute = 60 - seconds;
            document.getElementById('timer').textContent = `00:00:${nextMinute.toString().padStart(2, '0')}`;
        }, 1000);
        
        // Update prices
        setInterval(() => {
            if (this.data.length > 0) {
                const lastCandle = this.data[this.data.length - 1];
                const variation = (Math.random() - 0.5) * lastCandle.close * 0.001;
                const newPrice = lastCandle.close + variation;
                
                lastCandle.close = newPrice;
                lastCandle.high = Math.max(lastCandle.high, newPrice);
                lastCandle.low = Math.min(lastCandle.low, newPrice);
                
                this.updatePriceDisplay(newPrice);
                this.renderChart();
            }
        }, 2000);
    }
    
    getBasePrice(asset) {
        const prices = {
            'EURUSD': 1.16537,
            'GBPUSD': 1.26320,
            'USDJPY': 148.750,
            'BTCUSD': 105534.83,
            'ETHUSD': 2534.62,
            'XAUUSD': 3382.20
        };
        return prices[asset] || 1.16537;
    }
}

// Make available globally
window.FastTradingInterface = FastTradingInterface;