// Fast Professional Trading Interface - Immediate Loading
// Simplified version that loads instantly without dependencies

class FastTradingInterface {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.currentAsset = options.asset || 'EURUSD';
        this.mode = options.mode || 'demo';
        this.timeframe = '1m';
        this.data = [];
        this.zoomLevel = 1;
        this.panOffset = 0;
        this.activeTrades = [];
        this.balance = this.mode === 'demo' ? 10000 : 1000;
        this.lastPriceIndex = 0;
        
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
                            
                            <div style="color: #f1f1f1; font-size: 14px;">
                                <span id="current-price">Loading...</span>
                                <span style="margin-left: 8px;" id="price-change">Real-time data</span>
                            </div>
                            
                            <!-- Timeframe Selector -->
                            <div style="display: flex; gap: 4px;">
                                <button class="timeframe-btn" data-timeframe="1m" style="background: #f1f1f1; color: #1e2328; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">1m</button>
                                <button class="timeframe-btn" data-timeframe="5m" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">5m</button>
                                <button class="timeframe-btn" data-timeframe="15m" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">15m</button>
                                <button class="timeframe-btn" data-timeframe="1h" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">1h</button>
                                <button class="timeframe-btn" data-timeframe="4h" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">4h</button>
                                <button class="timeframe-btn" data-timeframe="1d" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">1d</button>
                            </div>
                            
                            <!-- Zoom Controls -->
                            <div style="display: flex; gap: 4px; margin-left: 8px;">
                                <button id="zoom-out" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;" title="Zoom Out">−</button>
                                <button id="zoom-in" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;" title="Zoom In">+</button>
                                <button id="zoom-reset" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;" title="Reset Zoom">⌂</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Chart Canvas -->
                    <div style="flex: 1; position: relative; background: #131722;">
                        <canvas id="trading-canvas" style="width: 100%; height: 100%;"></canvas>
                        
                        <!-- Price Scale -->
                        <div id="price-scale-container" style="position: absolute; right: 0; top: 0; bottom: 30px; width: 60px; background: #1e2328; border-left: 1px solid #2b3139; display: flex; flex-direction: column; justify-content: space-between; padding: 10px 4px;">
                            <!-- Dynamic price labels will be added here -->
                        </div>
                        
                        <!-- Time Scale -->
                        <div id="time-scale" style="position: absolute; bottom: 0; left: 0; right: 60px; height: 30px; background: #1e2328; border-top: 1px solid #2b3139; display: flex; align-items: center; justify-content: space-around; font-size: 10px; color: #848e9c;">
                            <!-- Time labels will be dynamically updated -->
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
                    
                    <!-- Active Trades List -->
                    <div id="trades-list" style="flex: 1; padding: 16px; overflow-y: auto;">
                        <div id="no-trades" style="text-align: center; color: #848e9c; margin-top: 40px; font-size: 14px;">
                            No opened trades
                        </div>
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
                        
                        <!-- Expiry Time -->
                        <div style="margin-bottom: 16px;">
                            <div style="color: #f1f1f1; font-size: 12px; margin-bottom: 8px;">Expiry Time</div>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <input type="number" id="expiry-minutes" min="1" max="1440" value="5" 
                                       style="background: #2b3139; color: #f1f1f1; border: none; padding: 8px 12px; border-radius: 6px; width: 80px; font-size: 14px; text-align: center;">
                                <select id="expiry-unit" style="background: #2b3139; color: #f1f1f1; border: none; padding: 8px 12px; border-radius: 6px; font-size: 14px;">
                                    <option value="minutes">Minutes</option>
                                    <option value="hours">Hours</option>
                                </select>
                            </div>
                            <div style="display: flex; gap: 4px; margin-top: 8px;">
                                <button type="button" class="quick-expiry" data-minutes="1" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">1m</button>
                                <button type="button" class="quick-expiry" data-minutes="5" style="background: #f1f1f1; color: #1e2328; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">5m</button>
                                <button type="button" class="quick-expiry" data-minutes="15" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">15m</button>
                                <button type="button" class="quick-expiry" data-minutes="30" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">30m</button>
                                <button type="button" class="quick-expiry" data-minutes="60" style="background: #2b3139; color: #848e9c; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">1h</button>
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
        
        // Prevent default drag behavior
        this.canvas.ondragstart = () => false;
        this.canvas.onselectstart = () => false;
        
        this.resizeCanvas();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.offsetWidth - 60;
        this.canvas.height = container.offsetHeight - 30;
    }
    
    async generateData() {
        console.log(`Loading real market data for ${this.currentAsset}...`);
        
        try {
            // Try to load real market data first
            await this.loadRealMarketData();
        } catch (error) {
            console.error('Failed to load real data, using fallback:', error);
            this.generateFallbackData();
        }
    }
    
    async loadRealMarketData() {
        try {
            // Get real historical data from Twelve Data API
            const response = await fetch(`/api/chart-data-new/${this.currentAsset}?interval=${this.timeframe}&outputsize=${this.getDataPointsForTimeframe()}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (data.data && data.data.length > 0) {
                console.log(`Loaded ${data.data.length} real market data points for ${this.currentAsset}`);
                
                // Process real market data
                this.data = data.data.map(point => ({
                    time: new Date(point.timestamp),
                    open: parseFloat(point.open),
                    high: parseFloat(point.high),
                    low: parseFloat(point.low),
                    close: parseFloat(point.close),
                    volume: parseInt(point.volume) || 0
                })).sort((a, b) => a.time - b.time);
                
                this.lastPriceIndex = Date.now();
                const currentPrice = this.data[this.data.length - 1].close;
                this.updatePriceDisplay(currentPrice);
                
                // Start real-time updates
                this.startRealTimeDataFeed();
                
                return;
            }
        } catch (error) {
            console.error('Error loading real market data:', error);
        }
        
        // If real data fails, use fallback
        throw new Error('Real data unavailable');
    }
    
    generateFallbackData() {
        console.log(`Generating fallback data for ${this.currentAsset} (real data unavailable)`);
        
        const basePrice = this.getBasePrice(this.currentAsset);
        this.data = [];
        
        let currentPrice = basePrice;
        const now = new Date();
        
        // Generate extensive historical data based on timeframe
        const dataPoints = this.getDataPointsForTimeframe();
        const intervalMs = this.getIntervalMs();
        
        for (let i = dataPoints; i >= 0; i--) {
            const time = new Date(now.getTime() - i * intervalMs);
            
            // Create more realistic price movements with trends
            const trendFactor = Math.sin(i / 20) * 0.001; // Long-term trend
            const noise = (Math.random() - 0.5) * basePrice * 0.002; // Short-term noise
            const variation = trendFactor + noise;
            
            const open = currentPrice;
            const close = open + (variation * currentPrice);
            
            // More realistic high/low spreads
            const spread = basePrice * (0.0005 + Math.random() * 0.0015);
            const high = Math.max(open, close) + spread;
            const low = Math.min(open, close) - spread;
            
            this.data.push({
                time: time,
                open: open,
                high: high,
                low: low,
                close: close
            });
            
            currentPrice = close;
        }
        
        // Initialize last price index for new candle generation
        this.lastPriceIndex = Date.now();
        
        this.updatePriceDisplay(currentPrice);
    }
    
    startRealTimeDataFeed() {
        // Store the current live price separately from candle data
        this.livePrice = null;
        
        // Update with real market data every 2 seconds for more responsive updates
        setInterval(async () => {
            try {
                const response = await fetch(`/api/market-data-new/${this.currentAsset}`);
                const marketInfo = await response.json();
                
                if (marketInfo.price) {
                    // Store live price for immediate display
                    this.livePrice = marketInfo.price;
                    
                    const currentTime = new Date();
                    const lastCandle = this.data[this.data.length - 1];
                    
                    // Check if we need a new candle based on timeframe
                    const timeDiff = currentTime.getTime() - lastCandle.time.getTime();
                    const intervalMs = this.getIntervalMs();
                    
                    if (timeDiff >= intervalMs) {
                        // Create new candle
                        this.data.push({
                            time: currentTime,
                            open: lastCandle.close,
                            high: Math.max(lastCandle.close, marketInfo.price),
                            low: Math.min(lastCandle.close, marketInfo.price),
                            close: marketInfo.price
                        });
                        
                        // Keep data within limits
                        const maxDataPoints = this.getDataPointsForTimeframe() * 2;
                        if (this.data.length > maxDataPoints) {
                            this.data.shift();
                        }
                    } else {
                        // Update current candle with live price
                        lastCandle.close = marketInfo.price;
                        lastCandle.high = Math.max(lastCandle.high, marketInfo.price);
                        lastCandle.low = Math.min(lastCandle.low, marketInfo.price);
                    }
                    
                    this.updatePriceDisplay(marketInfo.price);
                }
            } catch (error) {
                console.error('Error updating real-time data:', error);
            }
        }, 2000);
        
        // Add faster visual updates for smoother live price movement
        setInterval(() => {
            if (this.livePrice && this.data.length > 0) {
                // Simulate small price movements between real updates
                const lastPrice = this.livePrice;
                const volatility = this.getBasePrice(this.currentAsset) * 0.0005; // Small volatility
                const variation = (Math.random() - 0.5) * volatility;
                this.livePrice = lastPrice + variation;
                
                // Update the current candle with simulated live movement
                const lastCandle = this.data[this.data.length - 1];
                lastCandle.close = this.livePrice;
                lastCandle.high = Math.max(lastCandle.high, this.livePrice);
                lastCandle.low = Math.min(lastCandle.low, this.livePrice);
                
                this.updatePriceDisplay(this.livePrice);
            }
        }, 500); // Update every 500ms for smooth movement
    }
    
    getDataPointsForTimeframe() {
        const points = {
            '1m': 300,  // 5 hours of 1-minute data
            '5m': 288,  // 24 hours of 5-minute data
            '15m': 192, // 48 hours of 15-minute data
            '1h': 168,  // 1 week of hourly data
            '4h': 180,  // 1 month of 4-hour data
            '1d': 365   // 1 year of daily data
        };
        return points[this.timeframe] || 300;
    }
    
    getIntervalMs() {
        const intervals = {
            '1m': 60000,
            '5m': 300000,
            '15m': 900000,
            '1h': 3600000,
            '4h': 14400000,
            '1d': 86400000
        };
        return intervals[this.timeframe] || 60000;
    }
    
    renderChart() {
        if (!this.ctx || !this.data.length) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Clear canvas
        this.ctx.fillStyle = '#131722';
        this.ctx.fillRect(0, 0, width, height);
        
        // Apply zoom and pan
        const visibleData = this.getVisibleData();
        if (!visibleData.length) return;
        
        // Calculate price range for visible data
        const prices = visibleData.flatMap(d => [d.high, d.low]);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;
        const padding = priceRange * 0.1;
        
        const chartMinPrice = minPrice - padding;
        const chartMaxPrice = maxPrice + padding;
        const chartPriceRange = chartMaxPrice - chartMinPrice;
        
        // Draw grid with better styling
        this.drawGrid(width, height, chartMinPrice, chartMaxPrice);
        
        // Draw candlesticks with improved spacing and visibility
        const candleSpacing = width / visibleData.length;
        const candleWidth = Math.max(2, Math.min(candleSpacing * 0.7, candleSpacing - 1));
        
        visibleData.forEach((candle, index) => {
            const x = index * candleSpacing + candleSpacing / 2;
            const openY = height - ((candle.open - chartMinPrice) / chartPriceRange) * height;
            const closeY = height - ((candle.close - chartMinPrice) / chartPriceRange) * height;
            const highY = height - ((candle.high - chartMinPrice) / chartPriceRange) * height;
            const lowY = height - ((candle.low - chartMinPrice) / chartPriceRange) * height;
            
            const isGreen = candle.close > candle.open;
            const color = isGreen ? '#02c076' : '#f6465d';
            
            // Draw wick with better visibility
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = Math.max(1, Math.min(2, candleWidth * 0.1));
            this.ctx.beginPath();
            this.ctx.moveTo(x, highY);
            this.ctx.lineTo(x, lowY);
            this.ctx.stroke();
            
            // Draw body with improved visibility
            this.ctx.fillStyle = color;
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(2, Math.abs(closeY - openY)); // Minimum height for visibility
            this.ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
            
            // Add border for hollow candles when close > open
            if (candle.close > candle.open) {
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
            }
        });
        
        // Draw current price line
        this.drawCurrentPriceLine(chartMinPrice, chartMaxPrice, chartPriceRange, height);
        
        // Draw trade positions
        this.drawTradePositions(chartMinPrice, chartMaxPrice, chartPriceRange, height);
        
        // Update time scale and price scale
        this.updateTimeScale(visibleData);
        this.updatePriceScale(chartMinPrice, chartMaxPrice);
    }
    
    getVisibleData() {
        const totalData = this.data.length;
        let visibleCount = Math.floor(totalData / this.zoomLevel);
        
        // Ensure minimum and maximum visible candles
        visibleCount = Math.max(10, Math.min(visibleCount, totalData));
        
        // Default to showing latest data with some padding on the right
        if (this.panOffset === 0) {
            // Show recent data with 20% padding on the right for current candle visibility
            const paddingCandles = Math.floor(visibleCount * 0.2);
            let endIndex = totalData;
            let startIndex = Math.max(0, endIndex - visibleCount + paddingCandles);
            return this.data.slice(startIndex, endIndex);
        }
        
        // When panning, center around the offset position
        let centerIndex = totalData - 1 - this.panOffset;
        let startIndex = Math.max(0, centerIndex - Math.floor(visibleCount / 2));
        let endIndex = Math.min(totalData, startIndex + visibleCount);
        
        // Adjust if we hit boundaries
        if (endIndex - startIndex < visibleCount) {
            if (startIndex > 0) {
                startIndex = Math.max(0, endIndex - visibleCount);
            } else {
                endIndex = Math.min(totalData, startIndex + visibleCount);
            }
        }
        
        return this.data.slice(startIndex, endIndex);
    }
    
    drawGrid(width, height, minPrice, maxPrice) {
        // Horizontal grid lines
        this.ctx.strokeStyle = '#2a2e39';
        this.ctx.lineWidth = 0.5;
        
        for (let i = 0; i <= 8; i++) {
            const y = (i / 8) * height;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(width, y);
            this.ctx.stroke();
        }
        
        // Vertical grid lines
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * width;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, height);
            this.ctx.stroke();
        }
    }
    
    drawTradePositions(minPrice, maxPrice, priceRange, height) {
        const positionsContainer = document.getElementById('trade-positions');
        if (!positionsContainer) return;
        
        positionsContainer.innerHTML = '';
        
        this.activeTrades.forEach(trade => {
            const priceY = height - ((trade.entryPrice - minPrice) / priceRange) * height;
            
            const tradeMarker = document.createElement('div');
            tradeMarker.style.cssText = `
                position: absolute;
                left: 90%;
                top: ${priceY - 10}px;
                background: ${trade.type === 'buy' ? '#02c076' : '#f6465d'};
                color: white;
                padding: 2px 8px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 600;
                pointer-events: auto;
                z-index: 100;
            `;
            tradeMarker.textContent = `${trade.type.toUpperCase()} $${trade.amount}`;
            tradeMarker.title = `Entry: ${trade.entryPrice.toFixed(5)}\nExpiry: ${trade.expiryTime}`;
            
            positionsContainer.appendChild(tradeMarker);
            
            // Draw entry line
            const canvas = this.canvas;
            const ctx = this.ctx;
            ctx.strokeStyle = trade.type === 'buy' ? '#02c076' : '#f6465d';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(0, priceY);
            ctx.lineTo(canvas.width * 0.88, priceY);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }
    
    drawCurrentPriceLine(minPrice, maxPrice, priceRange, height) {
        if (!this.data.length) return;
        
        // Use live price if available, otherwise use last candle close
        const currentPrice = this.livePrice || this.data[this.data.length - 1].close;
        const priceY = height - ((currentPrice - minPrice) / priceRange) * height;
        
        // Draw current price line
        this.ctx.strokeStyle = '#fcd535'; // Yellow/gold color
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]); // Dashed line
        this.ctx.beginPath();
        this.ctx.moveTo(0, priceY);
        this.ctx.lineTo(this.canvas.width, priceY);
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset dash
        
        // Draw price label on the right
        const priceText = currentPrice.toFixed(5);
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#1e2328';
        
        const textWidth = this.ctx.measureText(priceText).width;
        const labelX = this.canvas.width - textWidth - 8;
        const labelY = priceY;
        
        // Background for price label
        this.ctx.fillStyle = '#fcd535';
        this.ctx.fillRect(labelX - 4, labelY - 8, textWidth + 8, 16);
        
        // Price text
        this.ctx.fillStyle = '#1e2328';
        this.ctx.fillText(priceText, labelX, labelY + 4);
        
        // Small triangle pointer
        this.ctx.fillStyle = '#fcd535';
        this.ctx.beginPath();
        this.ctx.moveTo(labelX - 4, labelY - 3);
        this.ctx.lineTo(labelX - 8, labelY);
        this.ctx.lineTo(labelX - 4, labelY + 3);
        this.ctx.fill();
    }
    
    setupEvents() {
        // Asset selector
        document.getElementById('asset-select').addEventListener('change', async (e) => {
            this.currentAsset = e.target.value;
            console.log(`Switching to ${this.currentAsset} - loading real market data...`);
            await this.generateData();
            this.renderChart();
        });
        
        // Timeframe buttons
        document.querySelectorAll('.timeframe-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // Update active state
                document.querySelectorAll('.timeframe-btn').forEach(b => {
                    b.style.background = '#2b3139';
                    b.style.color = '#848e9c';
                });
                e.target.style.background = '#f1f1f1';
                e.target.style.color = '#1e2328';
                
                this.timeframe = e.target.dataset.timeframe;
                console.log(`Switching to ${this.timeframe} timeframe - loading real market data...`);
                await this.generateData();
                this.renderChart();
            });
        });
        
        // Zoom controls with better limits
        document.getElementById('zoom-in').addEventListener('click', () => {
            this.zoomLevel = Math.min(8, this.zoomLevel * 1.5);
            this.renderChart();
        });
        
        document.getElementById('zoom-out').addEventListener('click', () => {
            this.zoomLevel = Math.max(0.3, this.zoomLevel / 1.5);
            this.renderChart();
        });
        
        document.getElementById('zoom-reset').addEventListener('click', () => {
            this.zoomLevel = 1;
            this.panOffset = 0; // Reset to show latest data
            this.renderChart();
        });
        
        // Mouse wheel zoom with better control
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.2 : 0.8;
            const newZoom = this.zoomLevel * zoomFactor;
            
            // Limit zoom to prevent candlestick overlap
            this.zoomLevel = Math.max(0.3, Math.min(8, newZoom));
            this.renderChart();
        });
        
        // Mouse drag for chart panning - Fixed implementation
        let isDragging = false;
        let startX = 0;
        
        const handleMouseDown = (e) => {
            isDragging = true;
            startX = e.clientX;
            this.canvas.style.cursor = 'grabbing';
            console.log('Mouse down - dragging started');
        };
        
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const sensitivity = 3; // Adjust for responsiveness
            
            if (Math.abs(deltaX) > sensitivity) {
                const panAmount = Math.floor(deltaX / sensitivity);
                
                // Update pan offset (negative for natural left/right movement)
                this.panOffset -= panAmount;
                
                // Allow flexible panning with better range
                const visibleCount = Math.floor(this.data.length / this.zoomLevel);
                const maxOffset = this.data.length; // Can pan to see all historical data
                this.panOffset = Math.max(-visibleCount, Math.min(maxOffset, this.panOffset));
                
                console.log(`Panning: offset=${this.panOffset}, delta=${panAmount}`);
                
                startX = e.clientX; // Reset start position
                this.renderChart();
            }
        };
        
        const handleMouseUp = () => {
            if (isDragging) {
                isDragging = false;
                this.canvas.style.cursor = 'crosshair';
                console.log('Mouse up - dragging stopped');
            }
        };
        
        // Add event listeners
        this.canvas.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove); // Use document for global mouse move
        document.addEventListener('mouseup', handleMouseUp); // Use document for global mouse up
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isDragging = true;
                startX = e.touches[0].clientX;
                e.preventDefault();
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches.length === 1) {
                const deltaX = e.touches[0].clientX - startX;
                const sensitivity = 3;
                
                if (Math.abs(deltaX) > sensitivity) {
                    const panAmount = Math.floor(deltaX / sensitivity);
                    this.panOffset -= panAmount;
                    
                    const visibleCount = Math.floor(this.data.length / this.zoomLevel);
                    const maxOffset = this.data.length;
                    this.panOffset = Math.max(-visibleCount, Math.min(maxOffset, this.panOffset));
                    
                    startX = e.touches[0].clientX;
                    this.renderChart();
                }
                e.preventDefault();
            }
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
        });
        
        // Amount input
        document.getElementById('amount-input').addEventListener('input', (e) => {
            const amount = parseFloat(e.target.value) || 0;
            const payout = (amount * 0.92).toFixed(2);
            document.getElementById('payout-amount').textContent = payout;
        });
        
        // Quick expiry buttons
        document.querySelectorAll('.quick-expiry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                document.querySelectorAll('.quick-expiry').forEach(b => {
                    b.style.background = '#2b3139';
                    b.style.color = '#848e9c';
                });
                e.target.style.background = '#f1f1f1';
                e.target.style.color = '#1e2328';
                
                const minutes = parseInt(e.target.dataset.minutes);
                if (minutes >= 60) {
                    document.getElementById('expiry-minutes').value = minutes / 60;
                    document.getElementById('expiry-unit').value = 'hours';
                } else {
                    document.getElementById('expiry-minutes').value = minutes;
                    document.getElementById('expiry-unit').value = 'minutes';
                }
            });
        });
        
        // Expiry time validation
        document.getElementById('expiry-minutes').addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            const unit = document.getElementById('expiry-unit').value;
            const maxMinutes = unit === 'hours' ? 24 : 1440; // 24 hours or 1440 minutes (24 hours)
            
            if (value < 1) {
                e.target.value = 1;
            } else if (value > maxMinutes) {
                e.target.value = maxMinutes;
            }
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
        const expiryValue = parseInt(document.getElementById('expiry-minutes').value);
        const expiryUnit = document.getElementById('expiry-unit').value;
        const expiryMinutes = expiryUnit === 'hours' ? expiryValue * 60 : expiryValue;
        
        if (!amount || amount < 1) {
            this.showNotification('Please enter a valid amount', 'error');
            return;
        }
        
        if (amount > this.balance) {
            this.showNotification('Insufficient balance', 'error');
            return;
        }
        
        const currentPrice = this.data[this.data.length - 1].close;
        const expiryTime = new Date(Date.now() + expiryMinutes * 60000);
        
        // Create trade object
        const trade = {
            id: Date.now(),
            type: type,
            amount: amount,
            entryPrice: currentPrice,
            expiryTime: expiryTime,
            expiryMinutes: expiryMinutes,
            asset: this.currentAsset,
            startTime: new Date(),
            status: 'active'
        };
        
        // Deduct amount from balance immediately
        this.balance -= amount;
        this.updateBalanceDisplay();
        
        this.activeTrades.push(trade);
        this.updateTradesList();
        
        // Set timer to close trade
        setTimeout(() => {
            this.closeTrade(trade.id);
        }, expiryMinutes * 60000);
        
        // Submit trade to backend
        this.submitTrade({
            asset: this.currentAsset,
            trade_type: type === 'buy' ? 'call' : 'put',
            amount: amount,
            expiry_minutes: expiryMinutes,
            is_demo: this.mode === 'demo'
        });
        
        this.showNotification(`${type.toUpperCase()} trade placed: $${amount} at ${currentPrice.toFixed(5)}`, 'success');
        this.renderChart();
    }
    
    closeTrade(tradeId) {
        const tradeIndex = this.activeTrades.findIndex(t => t.id === tradeId);
        if (tradeIndex === -1) return;
        
        const trade = this.activeTrades[tradeIndex];
        const currentPrice = this.data[this.data.length - 1].close;
        
        // Determine if trade won or lost
        let won = false;
        if (trade.type === 'buy') {
            won = currentPrice > trade.entryPrice;
        } else {
            won = currentPrice < trade.entryPrice;
        }
        
        // Calculate profit/loss
        let profit = 0;
        if (won) {
            profit = trade.amount * 0.85; // 85% payout
            this.balance += trade.amount + profit;
            this.showNotification(`Trade WON! +$${profit.toFixed(2)}`, 'success');
        } else {
            this.showNotification(`Trade LOST! -$${trade.amount.toFixed(2)}`, 'error');
        }
        
        // Update trade status
        trade.status = won ? 'won' : 'lost';
        trade.exitPrice = currentPrice;
        trade.profit = won ? profit : -trade.amount;
        
        // Move to closed trades and remove from active
        this.activeTrades.splice(tradeIndex, 1);
        
        this.updateBalanceDisplay();
        this.updateTradesList();
        this.renderChart();
    }
    
    updateBalanceDisplay() {
        const balanceElement = document.querySelector('#professional-trading-interface').querySelector('[style*="Demo Balance"], [style*="Live Balance"]');
        if (balanceElement) {
            const nextElement = balanceElement.nextElementSibling;
            if (nextElement) {
                nextElement.textContent = `$${this.balance.toFixed(2)}`;
            }
        }
    }
    
    updateTradesList() {
        const tradesList = document.getElementById('trades-list');
        const noTrades = document.getElementById('no-trades');
        
        if (this.activeTrades.length === 0) {
            noTrades.style.display = 'block';
            // Clear any existing trade items
            const existingTrades = tradesList.querySelectorAll('.trade-item');
            existingTrades.forEach(item => item.remove());
            return;
        }
        
        noTrades.style.display = 'none';
        
        // Clear existing trade items
        const existingTrades = tradesList.querySelectorAll('.trade-item');
        existingTrades.forEach(item => item.remove());
        
        // Add active trades
        this.activeTrades.forEach(trade => {
            const tradeElement = document.createElement('div');
            tradeElement.className = 'trade-item';
            tradeElement.style.cssText = `
                background: #2b3139;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 8px;
                border-left: 3px solid ${trade.type === 'buy' ? '#02c076' : '#f6465d'};
            `;
            
            const timeRemaining = Math.max(0, trade.expiryTime.getTime() - Date.now());
            const minutesLeft = Math.floor(timeRemaining / 60000);
            const secondsLeft = Math.floor((timeRemaining % 60000) / 1000);
            
            tradeElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="color: ${trade.type === 'buy' ? '#02c076' : '#f6465d'}; font-weight: 600; font-size: 12px;">
                        ${trade.type.toUpperCase()} ${trade.asset}
                    </span>
                    <span style="color: #f1f1f1; font-size: 12px; font-weight: 600;">
                        $${trade.amount}
                    </span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #848e9c; font-size: 10px;">Entry:</span>
                    <span style="color: #f1f1f1; font-size: 10px;">${trade.entryPrice.toFixed(5)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #848e9c; font-size: 10px;">Time:</span>
                    <span style="color: #fcd535; font-size: 10px; font-weight: 600;">
                        ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}
                    </span>
                </div>
            `;
            
            tradesList.appendChild(tradeElement);
        });
    }
    
    async submitTrade(tradeData) {
        try {
            // Get CSRF token from meta tag or form
            const csrfToken = document.querySelector('meta[name=csrf-token]')?.getAttribute('content') ||
                             document.querySelector('input[name=csrf_token]')?.value ||
                             this.getCSRFToken();
            
            const formData = new FormData();
            Object.keys(tradeData).forEach(key => {
                formData.append(key, tradeData[key]);
            });
            
            if (csrfToken) {
                formData.append('csrf_token', csrfToken);
            }
            
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
                this.showNotification('Trade executed successfully!', 'success');
            } else {
                console.error('Trade failed:', result.message);
                this.showNotification(result.message || 'Trade failed', 'error');
            }
        } catch (error) {
            console.error('Error placing trade:', error);
            this.showNotification('Network error placing trade', 'error');
        }
    }
    
    getCSRFToken() {
        // Try to get CSRF token from any existing form
        const forms = document.querySelectorAll('form');
        for (let form of forms) {
            const token = form.querySelector('input[name=csrf_token]');
            if (token) return token.value;
        }
        return null;
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
        const priceElement = document.getElementById('current-price');
        const priceScaleElement = document.getElementById('price-scale');
        
        if (priceElement) {
            const oldPrice = parseFloat(priceElement.textContent) || price;
            priceElement.textContent = price.toFixed(5);
            
            // Update price change indicator
            const changeElement = document.getElementById('price-change');
            if (changeElement) {
                const change = price - oldPrice;
                const changePercent = ((change / oldPrice) * 100);
                
                if (Math.abs(change) > 0.00001) {
                    const color = change > 0 ? '#02c076' : '#f6465d';
                    const sign = change > 0 ? '+' : '';
                    changeElement.style.color = color;
                    changeElement.textContent = `${sign}${change.toFixed(5)} (${sign}${changePercent.toFixed(2)}%)`;
                }
            }
        }
        
        if (priceScaleElement) {
            priceScaleElement.textContent = price.toFixed(5);
        }
    }
    
    startUpdates() {
        // Update timer
        setInterval(() => {
            const seconds = new Date().getSeconds();
            const nextMinute = 60 - seconds;
            document.getElementById('timer').textContent = `00:00:${nextMinute.toString().padStart(2, '0')}`;
        }, 1000);
        
        // Update trade timers and chart rendering
        setInterval(() => {
            if (this.data.length > 0) {
                this.updateTradesList(); // Update countdown timers
                this.renderChart(); // Render chart to show live price line updates
            }
        }, 250); // More frequent updates for smoother live price display
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
    
    updateTimeScale(visibleData) {
        const timeScale = document.getElementById('time-scale');
        if (!timeScale || !visibleData.length) return;
        
        timeScale.innerHTML = '';
        
        // Show 4-5 time labels across the visible data
        const labelCount = 5;
        const step = Math.floor(visibleData.length / (labelCount - 1));
        
        for (let i = 0; i < labelCount; i++) {
            const index = Math.min(i * step, visibleData.length - 1);
            const dataPoint = visibleData[index];
            
            if (dataPoint && dataPoint.time) {
                const timeLabel = document.createElement('span');
                timeLabel.style.color = '#848e9c';
                timeLabel.style.fontSize = '10px';
                
                // Format time based on timeframe
                let timeStr;
                if (this.timeframe === '1d') {
                    timeStr = dataPoint.time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                } else if (this.timeframe === '4h' || this.timeframe === '1h') {
                    timeStr = dataPoint.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                } else {
                    timeStr = dataPoint.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                }
                
                timeLabel.textContent = timeStr;
                timeScale.appendChild(timeLabel);
            }
        }
    }
    
    updatePriceScale(minPrice, maxPrice) {
        const priceScaleContainer = document.getElementById('price-scale-container');
        if (!priceScaleContainer) return;
        
        priceScaleContainer.innerHTML = '';
        
        const priceRange = maxPrice - minPrice;
        const labelCount = 8;
        
        for (let i = 0; i < labelCount; i++) {
            const ratio = i / (labelCount - 1);
            const price = maxPrice - (ratio * priceRange);
            
            const priceLabel = document.createElement('div');
            priceLabel.style.cssText = `
                color: #f1f1f1;
                font-size: 10px;
                text-align: right;
                line-height: 1;
                margin: 2px 0;
            `;
            
            // Highlight current price
            if (this.data.length > 0) {
                const currentPrice = this.livePrice || this.data[this.data.length - 1].close;
                if (Math.abs(price - currentPrice) < priceRange * 0.1) {
                    priceLabel.style.cssText += `
                        background: #fcd535;
                        color: #1e2328;
                        padding: 2px 4px;
                        border-radius: 2px;
                        font-weight: 600;
                    `;
                }
            }
            
            priceLabel.textContent = price.toFixed(5);
            priceScaleContainer.appendChild(priceLabel);
        }
    }
}

// Make available globally
window.FastTradingInterface = FastTradingInterface;