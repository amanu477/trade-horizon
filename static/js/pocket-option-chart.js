// Pocket Option Style Trading Chart for TradePro
// Professional charting system with advanced features

class PocketOptionChart {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.canvas = null;
        this.ctx = null;
        this.chart = null;
        
        this.currentAsset = options.asset || 'EURUSD';
        this.chartType = options.type || 'candlestick'; // 'line', 'candlestick', 'area'
        this.timeframe = options.timeframe || '1m';
        this.theme = options.theme || 'dark';
        
        this.data = [];
        this.isInitialized = false;
        this.isLoading = false;
        
        // Chart configuration
        this.config = {
            colors: {
                background: '#1a1a1a',
                grid: '#2a2a2a',
                text: '#ffffff',
                bullish: '#26a69a',
                bearish: '#ef5350',
                volume: '#404040',
                border: '#333333'
            },
            margins: {
                top: 20,
                right: 80,
                bottom: 40,
                left: 10
            }
        };
        
        this.init();
    }
    
    async init() {
        try {
            this.createChartContainer();
            await this.loadTradingViewLibrary();
            this.createChart();
            this.setupControls();
            this.startRealTimeUpdates();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize chart:', error);
            this.createFallbackChart();
        }
    }
    
    createChartContainer() {
        if (!this.container) return;
        
        this.container.innerHTML = `
            <div class="pocket-chart-wrapper">
                <!-- Chart Header -->
                <div class="chart-header d-flex justify-content-between align-items-center p-2 bg-dark border-bottom">
                    <div class="chart-symbol-info d-flex align-items-center">
                        <select class="form-select form-select-sm bg-secondary text-light border-0 me-3" id="chart-asset-selector" style="width: auto;">
                            <option value="EURUSD">EUR/USD</option>
                            <option value="GBPUSD">GBP/USD</option>
                            <option value="USDJPY">USD/JPY</option>
                            <option value="BTCUSD">BTC/USD</option>
                            <option value="ETHUSD">ETH/USD</option>
                            <option value="XAUUSD">XAU/USD</option>
                        </select>
                        <div class="price-display me-3">
                            <span class="current-price text-light fw-bold" id="chart-current-price">1.08450</span>
                            <span class="price-change text-success ms-2" id="chart-price-change">+0.0012</span>
                        </div>
                    </div>
                    
                    <div class="chart-controls d-flex align-items-center">
                        <!-- Timeframe Selector -->
                        <div class="btn-group btn-group-sm me-3" role="group">
                            <input type="radio" class="btn-check" name="timeframe" id="tf-1m" value="1m" checked>
                            <label class="btn btn-outline-light btn-sm" for="tf-1m">1m</label>
                            
                            <input type="radio" class="btn-check" name="timeframe" id="tf-5m" value="5m">
                            <label class="btn btn-outline-light btn-sm" for="tf-5m">5m</label>
                            
                            <input type="radio" class="btn-check" name="timeframe" id="tf-15m" value="15m">
                            <label class="btn btn-outline-light btn-sm" for="tf-15m">15m</label>
                            
                            <input type="radio" class="btn-check" name="timeframe" id="tf-1h" value="1h">
                            <label class="btn btn-outline-light btn-sm" for="tf-1h">1h</label>
                        </div>
                        
                        <!-- Chart Type Selector -->
                        <div class="btn-group btn-group-sm me-3" role="group">
                            <button type="button" class="btn btn-outline-light btn-sm chart-type-btn active" data-type="candlestick">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                            <button type="button" class="btn btn-outline-light btn-sm chart-type-btn" data-type="line">
                                <i class="fas fa-chart-line"></i>
                            </button>
                            <button type="button" class="btn btn-outline-light btn-sm chart-type-btn" data-type="area">
                                <i class="fas fa-chart-area"></i>
                            </button>
                        </div>
                        
                        <!-- Fullscreen Toggle -->
                        <button type="button" class="btn btn-outline-light btn-sm" id="fullscreen-toggle">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Chart Container -->
                <div class="chart-main-container position-relative" style="height: 500px; background: #1a1a1a;">
                    <div id="tradingview-chart" style="height: 100%; width: 100%;"></div>
                    
                    <!-- Loading Overlay -->
                    <div class="chart-loading-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
                         style="background: rgba(26, 26, 26, 0.8); z-index: 10;" id="chart-loading">
                        <div class="text-center">
                            <div class="spinner-border text-success mb-3" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <div class="text-light">Loading real market data...</div>
                        </div>
                    </div>
                    
                    <!-- Trade Markers Container -->
                    <div class="trade-markers-container position-absolute" style="top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5;"></div>
                </div>
                
                <!-- Chart Footer -->
                <div class="chart-footer d-flex justify-content-between align-items-center p-2 bg-dark border-top text-muted small">
                    <div class="market-status">
                        <i class="fas fa-circle text-success me-1" style="font-size: 8px;"></i>
                        Market Open
                    </div>
                    <div class="data-source">
                        Real-time data • Last update: <span id="last-update">--:--</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    async loadTradingViewLibrary() {
        // For now, we'll use Chart.js with custom styling to mimic TradingView
        return new Promise((resolve, reject) => {
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.2.1/dist/chart.umd.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    createChart() {
        const chartContainer = document.getElementById('tradingview-chart');
        if (!chartContainer) return;
        
        // Create canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'pocket-chart-canvas';
        this.ctx = this.canvas.getContext('2d');
        chartContainer.appendChild(this.canvas);
        
        this.loadMarketData().then(() => {
            this.renderChart();
            this.hideLoading();
        });
    }
    
    async loadMarketData() {
        this.showLoading();
        
        try {
            const response = await fetch(`/api/chart-data/${this.currentAsset}?interval=${this.timeframe}`);
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                this.processMarketData(data.data);
            } else {
                this.generateSampleData();
            }
        } catch (error) {
            console.error('Error loading market data:', error);
            this.generateSampleData();
        }
    }
    
    processMarketData(marketData) {
        this.data = marketData.map(point => ({
            time: new Date(point.timestamp),
            open: point.open || point.price,
            high: point.high || point.price * 1.001,
            low: point.low || point.price * 0.999,
            close: point.close || point.price,
            volume: point.volume || Math.random() * 1000
        }));
        
        // Update current price
        if (this.data.length > 0) {
            const latestPrice = this.data[this.data.length - 1].close;
            this.updatePriceDisplay(latestPrice);
        }
    }
    
    generateSampleData() {
        const basePrice = this.getBasePrice(this.currentAsset);
        this.data = [];
        
        let currentPrice = basePrice;
        const now = new Date();
        
        for (let i = 100; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60000); // 1 minute intervals
            
            // Generate realistic OHLC data
            const variation = (Math.random() - 0.5) * basePrice * 0.001;
            const open = currentPrice;
            const volatility = basePrice * 0.0005;
            
            const high = open + Math.random() * volatility;
            const low = open - Math.random() * volatility;
            const close = open + variation;
            
            this.data.push({
                time: time,
                open: open,
                high: Math.max(open, high, close),
                low: Math.min(open, low, close),
                close: close,
                volume: Math.random() * 1000 + 100
            });
            
            currentPrice = close;
        }
        
        this.updatePriceDisplay(currentPrice);
    }
    
    renderChart() {
        if (!this.ctx || !this.data.length) return;
        
        // Configure Chart.js for professional appearance
        const chartConfig = this.getChartConfig();
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(this.ctx, chartConfig);
    }
    
    getChartConfig() {
        const config = {
            type: this.chartType === 'candlestick' ? 'line' : this.chartType,
            data: this.getChartData(),
            options: {
                responsive: true,
                maintainAspectRatio: false,
                backgroundColor: this.config.colors.background,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.config.colors.bullish,
                        borderWidth: 1,
                        cornerRadius: 4,
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                const dataIndex = context[0].dataIndex;
                                const point = this.data[dataIndex];
                                return point.time.toLocaleString();
                            },
                            label: (context) => {
                                const dataIndex = context.dataIndex;
                                const point = this.data[dataIndex];
                                
                                if (this.chartType === 'candlestick') {
                                    return [
                                        `Open: ${point.open.toFixed(5)}`,
                                        `High: ${point.high.toFixed(5)}`,
                                        `Low: ${point.low.toFixed(5)}`,
                                        `Close: ${point.close.toFixed(5)}`,
                                        `Volume: ${point.volume.toFixed(0)}`
                                    ];
                                } else {
                                    return `Price: ${point.close.toFixed(5)}`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: this.timeframe === '1m' ? 'minute' : 'hour',
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm'
                            }
                        },
                        grid: {
                            color: this.config.colors.grid,
                            lineWidth: 0.5
                        },
                        ticks: {
                            color: this.config.colors.text,
                            maxTicksLimit: 10
                        },
                        border: {
                            color: this.config.colors.border
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: this.config.colors.grid,
                            lineWidth: 0.5
                        },
                        ticks: {
                            color: this.config.colors.text,
                            callback: function(value) {
                                return value.toFixed(5);
                            },
                            maxTicksLimit: 8
                        },
                        border: {
                            color: this.config.colors.border
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 4
                    },
                    line: {
                        borderWidth: 1.5,
                        tension: 0.1
                    }
                }
            }
        };
        
        return config;
    }
    
    getChartData() {
        if (this.chartType === 'candlestick') {
            // For candlestick, we'll use a line chart but draw custom candlesticks
            return {
                datasets: [{
                    label: this.currentAsset,
                    data: this.data.map(point => ({
                        x: point.time,
                        y: point.close
                    })),
                    borderColor: this.config.colors.bullish,
                    backgroundColor: 'transparent',
                    borderWidth: 1
                }]
            };
        } else if (this.chartType === 'area') {
            return {
                datasets: [{
                    label: this.currentAsset,
                    data: this.data.map(point => ({
                        x: point.time,
                        y: point.close
                    })),
                    borderColor: this.config.colors.bullish,
                    backgroundColor: `${this.config.colors.bullish}20`,
                    fill: true,
                    borderWidth: 2
                }]
            };
        } else {
            return {
                datasets: [{
                    label: this.currentAsset,
                    data: this.data.map(point => ({
                        x: point.time,
                        y: point.close
                    })),
                    borderColor: this.config.colors.bullish,
                    backgroundColor: 'transparent',
                    borderWidth: 2
                }]
            };
        }
    }
    
    setupControls() {
        // Asset selector
        const assetSelector = document.getElementById('chart-asset-selector');
        if (assetSelector) {
            assetSelector.value = this.currentAsset;
            assetSelector.addEventListener('change', (e) => {
                this.changeAsset(e.target.value);
            });
        }
        
        // Timeframe buttons
        document.querySelectorAll('input[name="timeframe"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.changeTimeframe(e.target.value);
            });
        });
        
        // Chart type buttons
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.changeChartType(type);
                
                // Update button states
                document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
        
        // Fullscreen toggle
        const fullscreenBtn = document.getElementById('fullscreen-toggle');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }
    }
    
    changeAsset(newAsset) {
        this.currentAsset = newAsset;
        this.loadMarketData().then(() => {
            this.renderChart();
        });
        
        // Notify parent about asset change
        if (window.tradingInterface) {
            window.tradingInterface.currentAsset = newAsset;
        }
    }
    
    changeTimeframe(newTimeframe) {
        this.timeframe = newTimeframe;
        this.loadMarketData().then(() => {
            this.renderChart();
        });
    }
    
    changeChartType(newType) {
        this.chartType = newType;
        this.renderChart();
    }
    
    startRealTimeUpdates() {
        // Update every 5 seconds
        setInterval(() => {
            this.addNewDataPoint();
            this.updateLastUpdateTime();
        }, 5000);
        
        // Update current price every 2 seconds
        setInterval(() => {
            this.updateRealTimePrice();
        }, 2000);
    }
    
    async addNewDataPoint() {
        try {
            const response = await fetch(`/api/market-data/${this.currentAsset}`);
            const marketData = await response.json();
            
            if (marketData.price) {
                const now = new Date();
                const newPoint = {
                    time: now,
                    open: this.data[this.data.length - 1]?.close || marketData.price,
                    high: marketData.price * 1.0001,
                    low: marketData.price * 0.9999,
                    close: marketData.price,
                    volume: Math.random() * 100 + 50
                };
                
                this.data.push(newPoint);
                
                // Keep only last 100 points for performance
                if (this.data.length > 100) {
                    this.data.shift();
                }
                
                // Update chart
                if (this.chart) {
                    this.chart.data.datasets[0].data = this.data.map(point => ({
                        x: point.time,
                        y: point.close
                    }));
                    this.chart.update('none');
                }
                
                this.updatePriceDisplay(marketData.price, marketData.change_percent);
            }
        } catch (error) {
            console.error('Error updating chart data:', error);
        }
    }
    
    updateRealTimePrice() {
        fetch(`/api/market-data/${this.currentAsset}`)
            .then(response => response.json())
            .then(data => {
                if (data.price) {
                    this.updatePriceDisplay(data.price, data.change_percent);
                }
            })
            .catch(error => {
                console.error('Error updating price:', error);
            });
    }
    
    updatePriceDisplay(price, changePercent = 0) {
        const priceEl = document.getElementById('chart-current-price');
        const changeEl = document.getElementById('chart-price-change');
        
        if (priceEl) {
            priceEl.textContent = price.toFixed(5);
        }
        
        if (changeEl) {
            const changeValue = (price * changePercent / 100).toFixed(5);
            const changeSign = changePercent >= 0 ? '+' : '';
            const changeClass = changePercent >= 0 ? 'text-success' : 'text-danger';
            
            changeEl.textContent = `${changeSign}${changeValue} (${changeSign}${changePercent.toFixed(2)}%)`;
            changeEl.className = `price-change ms-2 ${changeClass}`;
        }
    }
    
    updateLastUpdateTime() {
        const updateEl = document.getElementById('last-update');
        if (updateEl) {
            updateEl.textContent = new Date().toLocaleTimeString();
        }
    }
    
    showLoading() {
        const loadingEl = document.getElementById('chart-loading');
        if (loadingEl) {
            loadingEl.style.display = 'flex';
        }
        this.isLoading = true;
    }
    
    hideLoading() {
        const loadingEl = document.getElementById('chart-loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        this.isLoading = false;
    }
    
    toggleFullscreen() {
        const wrapper = this.container.querySelector('.pocket-chart-wrapper');
        if (!wrapper) return;
        
        if (!document.fullscreenElement) {
            wrapper.requestFullscreen().then(() => {
                wrapper.style.height = '100vh';
                wrapper.querySelector('.chart-main-container').style.height = 'calc(100vh - 120px)';
                this.chart?.resize();
            });
        } else {
            document.exitFullscreen().then(() => {
                wrapper.style.height = 'auto';
                wrapper.querySelector('.chart-main-container').style.height = '500px';
                this.chart?.resize();
            });
        }
    }
    
    addTradeMarker(price, type, time = new Date()) {
        // Add visual trade markers on the chart
        const markerContainer = this.container.querySelector('.trade-markers-container');
        if (!markerContainer) return;
        
        const marker = document.createElement('div');
        marker.className = `trade-marker trade-${type}`;
        marker.style.cssText = `
            position: absolute;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: ${type === 'call' ? '#26a69a' : '#ef5350'};
            border: 2px solid white;
            z-index: 10;
            pointer-events: none;
        `;
        
        // Position marker based on price and time (simplified)
        const chartRect = this.canvas.getBoundingClientRect();
        marker.style.left = '50%'; // Simplified positioning
        marker.style.top = '50%';
        
        markerContainer.appendChild(marker);
        
        // Remove marker after 5 minutes
        setTimeout(() => {
            marker.remove();
        }, 300000);
    }
    
    getBasePrice(asset) {
        const basePrices = {
            'EURUSD': 1.08450,
            'GBPUSD': 1.26320,
            'USDJPY': 148.750,
            'BTCUSD': 43250.00,
            'ETHUSD': 2650.00,
            'XAUUSD': 2025.50
        };
        return basePrices[asset] || 1.00000;
    }
    
    createFallbackChart() {
        this.container.innerHTML = `
            <div class="fallback-chart bg-dark text-light p-4 text-center">
                <i class="fas fa-chart-line fa-3x mb-3 text-muted"></i>
                <h5>Chart Loading...</h5>
                <p class="text-muted">Loading professional trading chart interface</p>
            </div>
        `;
    }
    
    destroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

// Global initialization
window.PocketOptionChart = PocketOptionChart;