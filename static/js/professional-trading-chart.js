// Professional Pocket Option Style Trading Interface
// Exact replica of the interface shown in the screenshot

class ProfessionalTradingChart {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.currentAsset = options.asset || 'EURUSD';
        this.chartType = 'candlestick';
        this.timeframe = '1m';
        this.data = [];
        this.trades = [];
        this.chart = null;
        
        this.init();
    }
    
    init() {
        this.createInterface();
        this.loadRealMarketData();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }
    
    createInterface() {
        this.container.innerHTML = `
            <div class="professional-trading-interface" style="background: #1e2328; height: 100vh; display: flex;">
                <!-- Left Side - Chart Area -->
                <div class="chart-section" style="flex: 1; display: flex; flex-direction: column;">
                    <!-- Top Navigation -->
                    <div class="chart-header" style="background: #1e2328; padding: 12px 16px; border-bottom: 1px solid #2b3139; display: flex; align-items: center; justify-content: space-between;">
                        <div class="asset-info" style="display: flex; align-items: center; gap: 16px;">
                            <div class="asset-selector" style="display: flex; align-items: center; gap: 8px;">
                                <select id="asset-dropdown" style="background: #2b3139; color: #f1f1f1; border: none; padding: 8px 12px; border-radius: 4px; font-weight: 600;">
                                    <option value="EURUSD">EUR/USD OTC</option>
                                    <option value="GBPUSD">GBP/USD OTC</option>
                                    <option value="USDJPY">USD/JPY OTC</option>
                                    <option value="BTCUSD">BTC/USD</option>
                                    <option value="ETHUSD">ETH/USD</option>
                                    <option value="XAUUSD">XAU/USD</option>
                                </select>
                                <i class="fas fa-chevron-down" style="color: #848e9c;"></i>
                            </div>
                            
                            <div class="chart-tools" style="display: flex; align-items: center; gap: 8px;">
                                <button class="tool-btn active" data-type="candlestick" style="background: #fcd535; color: #000; border: none; padding: 6px 8px; border-radius: 4px; font-size: 12px;">
                                    <i class="fas fa-chart-bar"></i>
                                </button>
                                <button class="tool-btn" data-type="line" style="background: transparent; color: #848e9c; border: 1px solid #2b3139; padding: 6px 8px; border-radius: 4px;">
                                    <i class="fas fa-chart-line"></i>
                                </button>
                                <button class="tool-btn" style="background: transparent; color: #848e9c; border: 1px solid #2b3139; padding: 6px 8px; border-radius: 4px;">
                                    <i class="fas fa-pencil-alt"></i>
                                </button>
                                <button class="tool-btn" style="background: transparent; color: #848e9c; border: 1px solid #2b3139; padding: 6px 8px; border-radius: 4px;">
                                    <i class="fas fa-minus"></i>
                                </button>
                                <button class="tool-btn" style="background: transparent; color: #848e9c; border: 1px solid #2b3139; padding: 6px 8px; border-radius: 4px;">
                                    <i class="fas fa-th"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="price-info" style="display: flex; align-items: center; gap: 16px;">
                            <div class="current-price" style="color: #f1f1f1; font-size: 14px;">
                                <span id="current-price-value">1.16537</span>
                            </div>
                            <div class="price-details" style="font-size: 11px; color: #848e9c;">
                                <div>16:57:31 UTC+3</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Price Scale Info -->
                    <div class="price-scale-info" style="background: #1e2328; padding: 8px 16px; border-bottom: 1px solid #2b3139; display: flex; justify-content: space-between; font-size: 11px; color: #848e9c;">
                        <div class="ohlc-data">
                            <span>Open: <span id="open-price">1.16537</span></span>
                            <span style="margin-left: 16px;">Close: <span id="close-price">1.16229</span></span>
                            <span style="margin-left: 16px;">High: <span id="high-price">1.16181</span></span>
                            <span style="margin-left: 16px;">Low: <span id="low-price">1.16135</span></span>
                        </div>
                        <div class="scale-info">
                            <span>A</span>
                        </div>
                    </div>
                    
                    <!-- Chart Container -->
                    <div class="chart-container" style="flex: 1; position: relative; background: #131722;">
                        <canvas id="professional-chart" style="width: 100%; height: 100%;"></canvas>
                        
                        <!-- Price Scale -->
                        <div class="price-scale" style="position: absolute; right: 0; top: 0; bottom: 0; width: 60px; background: #1e2328; border-left: 1px solid #2b3139; display: flex; flex-direction: column; justify-content: space-between; padding: 20px 8px;">
                            <div class="price-level" style="color: #f1f1f1; font-size: 10px;" id="price-high">1.16400</div>
                            <div class="price-level" style="color: #f1f1f1; font-size: 10px;">1.16300</div>
                            <div class="price-level current-price-scale" style="color: #fcd535; font-size: 10px; background: #2b3139; padding: 2px 4px; border-radius: 2px;" id="price-current">1.16229</div>
                            <div class="price-level" style="color: #f1f1f1; font-size: 10px;">1.16100</div>
                            <div class="price-level" style="color: #f1f1f1; font-size: 10px;" id="price-low">1.15990</div>
                        </div>
                        
                        <!-- Time Scale -->
                        <div class="time-scale" style="position: absolute; bottom: 0; left: 0; right: 60px; height: 30px; background: #1e2328; border-top: 1px solid #2b3139; display: flex; align-items: center; justify-content: space-around; font-size: 10px; color: #848e9c;">
                            <span>16:30</span>
                            <span>16:40</span>
                            <span>16:50</span>
                            <span>17:00</span>
                        </div>
                    </div>
                </div>
                
                <!-- Right Side - Trading Panel -->
                <div class="trading-panel" style="width: 300px; background: #1e2328; border-left: 1px solid #2b3139; display: flex; flex-direction: column;">
                    <!-- Trades Header -->
                    <div class="trades-header" style="padding: 16px; border-bottom: 1px solid #2b3139;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="color: #f1f1f1; margin: 0; font-size: 16px; font-weight: 600;">Trades</h3>
                            <div style="background: #2b3139; color: #848e9c; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;">
                                <i class="fas fa-question"></i>
                            </div>
                        </div>
                        
                        <div class="trade-tabs" style="display: flex; margin-top: 16px; background: #2b3139; border-radius: 6px; padding: 2px;">
                            <button class="tab-btn active" data-tab="opened" style="flex: 1; background: #f1f1f1; color: #1e2328; border: none; padding: 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">Opened</button>
                            <button class="tab-btn" data-tab="closed" style="flex: 1; background: transparent; color: #848e9c; border: none; padding: 8px; border-radius: 4px; font-size: 12px;">Closed</button>
                        </div>
                    </div>
                    
                    <!-- Active Trades -->
                    <div class="active-trades" style="flex: 1; padding: 16px;">
                        <div class="no-trades" style="text-align: center; color: #848e9c; margin-top: 40px;">
                            <div style="font-size: 14px; margin-bottom: 8px;">No opened trades</div>
                        </div>
                    </div>
                    
                    <!-- Trading Form -->
                    <div class="trading-form" style="padding: 16px; border-top: 1px solid #2b3139;">
                        <!-- Timer -->
                        <div class="timer-section" style="text-align: center; margin-bottom: 16px;">
                            <div style="color: #f1f1f1; font-size: 24px; font-weight: 600; margin-bottom: 4px;">
                                <span id="timer-display">00:00:05</span>
                            </div>
                            <div style="color: #848e9c; font-size: 12px;">Time</div>
                        </div>
                        
                        <!-- Amount Input -->
                        <div class="amount-section" style="margin-bottom: 16px;">
                            <div style="color: #f1f1f1; font-size: 12px; margin-bottom: 8px;">
                                Amount <i class="fas fa-info-circle" style="color: #848e9c; margin-left: 4px;"></i>
                            </div>
                            <div style="background: #2b3139; border-radius: 6px; padding: 12px; display: flex; align-items: center; justify-content: center;">
                                <input type="number" id="trade-amount" value="10" min="1" max="10000" 
                                       style="background: transparent; border: none; color: #f1f1f1; font-size: 24px; font-weight: 600; text-align: center; width: 100%; outline: none;">
                            </div>
                        </div>
                        
                        <!-- Payout Info -->
                        <div class="payout-section" style="margin-bottom: 20px;">
                            <div style="color: #f1f1f1; font-size: 12px; margin-bottom: 8px;">
                                Payout <i class="fas fa-info-circle" style="color: #848e9c; margin-left: 4px;"></i>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div style="color: #02c076; font-size: 18px; font-weight: 600;">
                                    +<span id="payout-percentage">92</span>%
                                </div>
                                <div style="color: #02c076; font-size: 14px;">
                                    +$<span id="payout-amount">9.20</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Trade Buttons -->
                        <div class="trade-buttons" style="display: flex; gap: 8px;">
                            <button id="buy-btn" class="trade-btn" style="flex: 1; background: #02c076; color: #ffffff; border: none; padding: 16px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                <i class="fas fa-arrow-up" style="margin-right: 8px;"></i>BUY
                            </button>
                            <button id="sell-btn" class="trade-btn" style="flex: 1; background: #f6465d; color: #ffffff; border: none; padding: 16px; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;">
                                <i class="fas fa-arrow-down" style="margin-right: 8px;"></i>SELL
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('professional-chart');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth - 60; // Minus price scale
        this.canvas.height = container.offsetHeight - 30; // Minus time scale
        this.canvas.style.width = (container.offsetWidth - 60) + 'px';
        this.canvas.style.height = (container.offsetHeight - 30) + 'px';
    }
    
    async loadRealMarketData() {
        try {
            const response = await fetch(`/api/chart-data/${this.currentAsset}?interval=1m`);
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                this.processMarketData(data.data);
            } else {
                this.generateRealisticData();
            }
        } catch (error) {
            console.error('Error loading market data:', error);
            this.generateRealisticData();
        }
        
        this.renderChart();
    }
    
    processMarketData(marketData) {
        this.data = marketData.map(point => ({
            time: new Date(point.timestamp),
            open: parseFloat(point.open) || parseFloat(point.close),
            high: parseFloat(point.high) || parseFloat(point.close),
            low: parseFloat(point.low) || parseFloat(point.close),
            close: parseFloat(point.close),
            volume: parseInt(point.volume) || 0
        })).slice(-100); // Keep last 100 points
        
        this.updatePriceInfo();
    }
    
    generateRealisticData() {
        const basePrice = this.getBasePrice(this.currentAsset);
        this.data = [];
        let currentPrice = basePrice;
        
        const now = new Date();
        for (let i = 100; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60000);
            const variation = (Math.random() - 0.5) * basePrice * 0.002;
            
            const open = currentPrice;
            const close = currentPrice + variation;
            const high = Math.max(open, close) + Math.random() * basePrice * 0.001;
            const low = Math.min(open, close) - Math.random() * basePrice * 0.001;
            
            this.data.push({
                time: time,
                open: open,
                high: high,
                low: low,
                close: close,
                volume: Math.floor(Math.random() * 1000)
            });
            
            currentPrice = close;
        }
        
        this.updatePriceInfo();
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
        
        // Calculate dimensions
        const candleWidth = Math.max(2, (width / this.data.length) * 0.8);
        const candleSpacing = width / this.data.length;
        
        // Draw grid lines
        this.drawGrid(width, height, chartMinPrice, chartMaxPrice);
        
        // Draw candlesticks
        this.data.forEach((candle, index) => {
            const x = index * candleSpacing + candleSpacing / 2;
            const openY = height - ((candle.open - chartMinPrice) / chartPriceRange) * height;
            const closeY = height - ((candle.close - chartMinPrice) / chartPriceRange) * height;
            const highY = height - ((candle.high - chartMinPrice) / chartPriceRange) * height;
            const lowY = height - ((candle.low - chartMinPrice) / chartPriceRange) * height;
            
            const isGreen = candle.close > candle.open;
            const bodyColor = isGreen ? '#02c076' : '#f6465d';
            const wickColor = isGreen ? '#02c076' : '#f6465d';
            
            // Draw wick
            this.ctx.strokeStyle = wickColor;
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(x, highY);
            this.ctx.lineTo(x, lowY);
            this.ctx.stroke();
            
            // Draw body
            this.ctx.fillStyle = bodyColor;
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.abs(closeY - openY);
            this.ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, Math.max(1, bodyHeight));
        });
        
        this.updatePriceScale(chartMinPrice, chartMaxPrice);
    }
    
    drawGrid(width, height, minPrice, maxPrice) {
        const gridLines = 5;
        this.ctx.strokeStyle = '#2a2e39';
        this.ctx.lineWidth = 0.5;
        
        // Horizontal grid lines
        for (let i = 0; i <= gridLines; i++) {
            const y = (i / gridLines) * height;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Vertical grid lines
        const timeLines = 6;
        for (let i = 0; i <= timeLines; i++) {
            const x = (i / timeLines) * width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
    }
    
    updatePriceInfo() {
        if (!this.data.length) return;
        
        const latest = this.data[this.data.length - 1];
        const previous = this.data[this.data.length - 2];
        
        // Update current price display
        document.getElementById('current-price-value').textContent = latest.close.toFixed(5);
        document.getElementById('price-current').textContent = latest.close.toFixed(5);
        
        // Update OHLC data
        document.getElementById('open-price').textContent = latest.open.toFixed(5);
        document.getElementById('close-price').textContent = latest.close.toFixed(5);
        document.getElementById('high-price').textContent = latest.high.toFixed(5);
        document.getElementById('low-price').textContent = latest.low.toFixed(5);
        
        // Update payout calculation
        this.updatePayoutDisplay();
    }
    
    updatePriceScale(minPrice, maxPrice) {
        const priceRange = maxPrice - minPrice;
        const priceStep = priceRange / 4;
        
        document.getElementById('price-high').textContent = maxPrice.toFixed(5);
        document.getElementById('price-low').textContent = minPrice.toFixed(5);
    }
    
    updatePayoutDisplay() {
        const amount = parseFloat(document.getElementById('trade-amount').value) || 10;
        const payoutPercentage = this.getCurrentPayout();
        const payoutAmount = (amount * payoutPercentage / 100).toFixed(2);
        
        document.getElementById('payout-percentage').textContent = payoutPercentage;
        document.getElementById('payout-amount').textContent = payoutAmount;
    }
    
    getCurrentPayout() {
        // Get dynamic payout based on market conditions
        const volatility = this.calculateVolatility();
        let basePayout = 92;
        
        if (volatility > 0.002) basePayout -= 5; // High volatility
        else if (volatility < 0.001) basePayout += 3; // Low volatility
        
        return Math.max(80, Math.min(95, basePayout));
    }
    
    calculateVolatility() {
        if (this.data.length < 10) return 0.001;
        
        const recentData = this.data.slice(-10);
        const prices = recentData.map(d => d.close);
        const changes = [];
        
        for (let i = 1; i < prices.length; i++) {
            changes.push(Math.abs(prices[i] - prices[i-1]) / prices[i-1]);
        }
        
        return changes.reduce((sum, change) => sum + change, 0) / changes.length;
    }
    
    setupEventListeners() {
        // Asset selector
        const assetDropdown = document.getElementById('asset-dropdown');
        assetDropdown.addEventListener('change', (e) => {
            this.currentAsset = e.target.value;
            this.loadRealMarketData();
        });
        
        // Chart type buttons
        document.querySelectorAll('.tool-btn[data-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn[data-type]').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = '#848e9c';
                });
                
                e.target.classList.add('active');
                e.target.style.background = '#fcd535';
                e.target.style.color = '#000';
                
                this.chartType = e.target.dataset.type;
                this.renderChart();
            });
        });
        
        // Trade amount input
        const amountInput = document.getElementById('trade-amount');
        amountInput.addEventListener('input', () => {
            this.updatePayoutDisplay();
        });
        
        // Trade buttons
        document.getElementById('buy-btn').addEventListener('click', () => {
            this.placeTrade('buy');
        });
        
        document.getElementById('sell-btn').addEventListener('click', () => {
            this.placeTrade('sell');
        });
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.background = 'transparent';
                    b.style.color = '#848e9c';
                });
                
                e.target.classList.add('active');
                e.target.style.background = '#f1f1f1';
                e.target.style.color = '#1e2328';
                
                this.showTradesTab(e.target.dataset.tab);
            });
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.renderChart();
        });
    }
    
    placeTrade(type) {
        const amount = parseFloat(document.getElementById('trade-amount').value);
        if (!amount || amount < 1) {
            alert('Please enter a valid amount');
            return;
        }
        
        const currentPrice = this.data[this.data.length - 1].close;
        const expiryTime = new Date(Date.now() + 60000); // 1 minute expiry
        
        const trade = {
            id: Date.now(),
            type: type,
            amount: amount,
            entryPrice: currentPrice,
            expiryTime: expiryTime,
            asset: this.currentAsset,
            status: 'active',
            payout: this.getCurrentPayout()
        };
        
        this.trades.push(trade);
        this.displayActiveTrades();
        
        // Submit to backend
        this.submitTradeToBackend(trade);
        
        // Start countdown
        this.startTradeCountdown(trade);
    }
    
    async submitTradeToBackend(trade) {
        try {
            const formData = new FormData();
            formData.append('asset', trade.asset);
            formData.append('trade_type', trade.type === 'buy' ? 'call' : 'put');
            formData.append('amount', trade.amount);
            formData.append('expiry_minutes', '1');
            formData.append('is_demo', 'true');
            
            const response = await fetch('/place_trade', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                console.log('Trade submitted successfully');
            }
        } catch (error) {
            console.error('Error submitting trade:', error);
        }
    }
    
    displayActiveTrades() {
        const activeTradesContainer = document.querySelector('.active-trades');
        const activeTrades = this.trades.filter(t => t.status === 'active');
        
        if (activeTrades.length === 0) {
            activeTradesContainer.innerHTML = `
                <div class="no-trades" style="text-align: center; color: #848e9c; margin-top: 40px;">
                    <div style="font-size: 14px; margin-bottom: 8px;">No opened trades</div>
                </div>
            `;
            return;
        }
        
        activeTradesContainer.innerHTML = activeTrades.map(trade => `
            <div class="trade-item" style="background: #2b3139; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="color: #f1f1f1; font-weight: 600;">${trade.asset}</div>
                    <div style="color: ${trade.type === 'buy' ? '#02c076' : '#f6465d'}; font-size: 12px;">
                        ${trade.type.toUpperCase()}
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; color: #848e9c;">
                    <div>$${trade.amount}</div>
                    <div id="countdown-${trade.id}">00:60</div>
                </div>
            </div>
        `).join('');
    }
    
    startTradeCountdown(trade) {
        const countdownEl = document.getElementById(`countdown-${trade.id}`);
        if (!countdownEl) return;
        
        const interval = setInterval(() => {
            const timeLeft = trade.expiryTime - new Date();
            
            if (timeLeft <= 0) {
                clearInterval(interval);
                this.settleTrade(trade);
                return;
            }
            
            const seconds = Math.floor(timeLeft / 1000);
            const minutes = Math.floor(seconds / 60);
            const secs = seconds % 60;
            
            countdownEl.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    settleTrade(trade) {
        const currentPrice = this.data[this.data.length - 1].close;
        const isWin = (trade.type === 'buy' && currentPrice > trade.entryPrice) ||
                     (trade.type === 'sell' && currentPrice < trade.entryPrice);
        
        trade.status = isWin ? 'won' : 'lost';
        trade.exitPrice = currentPrice;
        trade.profit = isWin ? (trade.amount * trade.payout / 100) : -trade.amount;
        
        this.displayActiveTrades();
    }
    
    showTradesTab(tab) {
        // Implementation for showing different trade tabs
        if (tab === 'opened') {
            this.displayActiveTrades();
        } else {
            // Show closed trades
            const closedTrades = this.trades.filter(t => t.status !== 'active');
            // Implement closed trades display
        }
    }
    
    startRealTimeUpdates() {
        // Update chart every 5 seconds
        setInterval(() => {
            this.addNewDataPoint();
        }, 5000);
        
        // Update timer every second
        setInterval(() => {
            this.updateTimer();
        }, 1000);
    }
    
    async addNewDataPoint() {
        try {
            const response = await fetch(`/api/market-data/${this.currentAsset}`);
            const data = await response.json();
            
            if (data.price) {
                const now = new Date();
                const lastCandle = this.data[this.data.length - 1];
                
                // Update last candle or create new one
                const timeDiff = now - lastCandle.time;
                
                if (timeDiff >= 60000) { // New minute
                    this.data.push({
                        time: now,
                        open: lastCandle.close,
                        high: data.price,
                        low: data.price,
                        close: data.price,
                        volume: 0
                    });
                } else {
                    // Update current candle
                    lastCandle.close = data.price;
                    lastCandle.high = Math.max(lastCandle.high, data.price);
                    lastCandle.low = Math.min(lastCandle.low, data.price);
                }
                
                // Keep last 100 candles
                if (this.data.length > 100) {
                    this.data.shift();
                }
                
                this.renderChart();
                this.updatePriceInfo();
            }
        } catch (error) {
            console.error('Error updating price:', error);
        }
    }
    
    updateTimer() {
        // Update the main timer display
        const now = new Date();
        const seconds = now.getSeconds();
        const nextMinute = 60 - seconds;
        
        document.getElementById('timer-display').textContent = 
            `00:00:${nextMinute.toString().padStart(2, '0')}`;
    }
    
    getBasePrice(asset) {
        const basePrices = {
            'EURUSD': 1.16537,
            'GBPUSD': 1.26320,
            'USDJPY': 148.750,
            'BTCUSD': 105534.83,
            'ETHUSD': 2534.62,
            'XAUUSD': 3382.20
        };
        return basePrices[asset] || 1.16537;
    }
}

// Initialize the professional trading chart
window.ProfessionalTradingChart = ProfessionalTradingChart;