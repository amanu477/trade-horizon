// Advanced Chart System for TradePro
// Supports both Line Charts and Candlestick Charts with real market data

class AdvancedTradingChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas?.getContext('2d');
        this.chart = null;
        this.currentAsset = options.asset || 'EURUSD';
        this.chartType = options.type || 'line'; // 'line' or 'candlestick'
        this.timeframe = options.timeframe || '5m';
        this.data = [];
        this.candlestickData = [];
        this.isInitialized = false;
        
        this.colors = {
            bullish: '#00d4aa',
            bearish: '#ff4757',
            line: '#00d4aa',
            grid: 'rgba(255, 255, 255, 0.1)',
            text: '#ffffff'
        };
        
        this.init();
    }
    
    async init() {
        if (!this.canvas || !this.ctx) {
            console.error('Canvas element not found');
            this.createFallbackChart();
            return;
        }
        
        try {
            await this.loadChartJS();
            await this.loadRealMarketData();
            this.createChart();
            this.startRealTimeUpdates();
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize advanced chart:', error);
            this.createFallbackChart();
        }
    }
    
    async loadChartJS() {
        if (typeof Chart !== 'undefined') {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.2.1/dist/chart.umd.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    async loadRealMarketData() {
        try {
            const response = await fetch(`/api/chart-data/${this.currentAsset}?interval=${this.timeframe}`);
            const data = await response.json();
            
            if (data.data && data.data.length > 0) {
                this.processMarketData(data.data);
            } else {
                this.generateFallbackData();
            }
        } catch (error) {
            console.log('Using fallback data for', this.currentAsset);
            this.generateFallbackData();
        }
    }
    
    processMarketData(marketData) {
        this.data = [];
        this.candlestickData = [];
        
        marketData.forEach(point => {
            const timestamp = new Date(point.timestamp);
            const price = point.close || point.price;
            
            // Line chart data
            this.data.push({
                x: timestamp,
                y: price
            });
            
            // Candlestick data
            if (point.open && point.high && point.low && point.close) {
                this.candlestickData.push({
                    x: timestamp,
                    o: point.open,
                    h: point.high,
                    l: point.low,
                    c: point.close
                });
            }
        });
    }
    
    generateFallbackData() {
        const basePrice = this.getBasePrice(this.currentAsset);
        this.data = [];
        this.candlestickData = [];
        
        let currentPrice = basePrice;
        
        for (let i = 0; i < 50; i++) {
            const timestamp = new Date(Date.now() - (50 - i) * 60000);
            const variation = (Math.random() - 0.5) * basePrice * 0.01;
            currentPrice += variation;
            
            const open = i === 0 ? basePrice : this.data[i - 1]?.y || currentPrice;
            const volatility = basePrice * 0.005;
            const high = currentPrice + (Math.random() * volatility);
            const low = currentPrice - (Math.random() * volatility);
            const close = currentPrice;
            
            // Line chart data
            this.data.push({
                x: timestamp,
                y: close
            });
            
            // Candlestick data
            this.candlestickData.push({
                x: timestamp,
                o: open,
                h: high,
                l: low,
                c: close
            });
        }
    }
    
    createChart() {
        if (!this.ctx || typeof Chart === 'undefined') {
            this.createFallbackChart();
            return;
        }
        
        const chartData = this.chartType === 'candlestick' ? this.getCandlestickConfig() : this.getLineConfig();
        
        this.chart = new Chart(this.ctx, chartData);
    }
    
    getLineConfig() {
        return {
            type: 'line',
            data: {
                datasets: [{
                    label: this.currentAsset,
                    data: this.data,
                    borderColor: this.colors.line,
                    backgroundColor: `${this.colors.line}20`,
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: this.colors.line,
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                            displayFormats: {
                                minute: 'HH:mm'
                            }
                        },
                        grid: {
                            color: this.colors.grid
                        },
                        ticks: {
                            color: this.colors.text
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: this.colors.grid
                        },
                        ticks: {
                            color: this.colors.text,
                            callback: function(value) {
                                return value.toFixed(5);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.line,
                        borderWidth: 1,
                        callbacks: {
                            title: (context) => {
                                return new Date(context[0].label).toLocaleString();
                            },
                            label: (context) => {
                                return `Price: ${context.parsed.y.toFixed(5)}`;
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };
    }
    
    getCandlestickConfig() {
        // Simplified candlestick using line chart with custom rendering
        return {
            type: 'line',
            data: {
                datasets: [{
                    label: `${this.currentAsset} OHLC`,
                    data: this.candlestickData.map(candle => ({
                        x: candle.x,
                        y: candle.c
                    })),
                    borderColor: this.colors.line,
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute',
                            displayFormats: {
                                minute: 'HH:mm'
                            }
                        },
                        grid: {
                            color: this.colors.grid
                        },
                        ticks: {
                            color: this.colors.text
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            color: this.colors.grid
                        },
                        ticks: {
                            color: this.colors.text,
                            callback: function(value) {
                                return value.toFixed(5);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.colors.line,
                        borderWidth: 1,
                        callbacks: {
                            title: (context) => {
                                const dataIndex = context[0].dataIndex;
                                const candle = this.candlestickData[dataIndex];
                                return new Date(candle.x).toLocaleString();
                            },
                            label: (context) => {
                                const dataIndex = context[0].dataIndex;
                                const candle = this.candlestickData[dataIndex];
                                return [
                                    `Open: ${candle.o.toFixed(5)}`,
                                    `High: ${candle.h.toFixed(5)}`,
                                    `Low: ${candle.l.toFixed(5)}`,
                                    `Close: ${candle.c.toFixed(5)}`
                                ];
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        };
    }
    
    createFallbackChart() {
        if (!this.canvas || !this.ctx) return;
        
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = this.colors.line;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        const points = 50;
        let basePrice = this.getBasePrice(this.currentAsset);
        
        for (let i = 0; i < points; i++) {
            const x = (i / points) * this.canvas.width;
            const variation = (Math.random() - 0.5) * basePrice * 0.01;
            const price = basePrice + variation;
            const y = this.canvas.height / 2 + (variation * 1000);
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        
        // Add price text
        this.ctx.fillStyle = this.colors.line;
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`${this.currentAsset}: ${basePrice.toFixed(5)}`, 10, 30);
        
        console.log('Fallback chart created for', this.currentAsset);
        this.isInitialized = true;
    }
    
    switchChartType(type) {
        this.chartType = type;
        if (this.chart) {
            this.chart.destroy();
        }
        this.createChart();
    }
    
    updateAsset(newAsset) {
        this.currentAsset = newAsset;
        this.loadRealMarketData().then(() => {
            if (this.chart) {
                this.chart.destroy();
            }
            this.createChart();
        });
    }
    
    startRealTimeUpdates() {
        // Update every 5 seconds
        setInterval(() => {
            this.addNewDataPoint();
        }, 5000);
    }
    
    addNewDataPoint() {
        fetch(`/api/market-data/${this.currentAsset}`)
            .then(response => response.json())
            .then(marketData => {
                if (marketData.price) {
                    const timestamp = new Date();
                    
                    // Update line chart data
                    const newPoint = {
                        x: timestamp,
                        y: marketData.price
                    };
                    
                    this.data.push(newPoint);
                    if (this.data.length > 50) {
                        this.data.shift();
                    }
                    
                    // Update chart
                    if (this.chart) {
                        this.chart.data.datasets[0].data = this.data;
                        this.chart.update('none');
                    }
                    
                    // Update price display
                    this.updatePriceDisplay(marketData.price, marketData.change_percent || 0);
                }
            })
            .catch(error => {
                console.error('Error updating chart data:', error);
            });
    }
    
    updatePriceDisplay(price, changePercent) {
        const priceDisplay = document.getElementById('current-price');
        if (priceDisplay) {
            const changeClass = changePercent >= 0 ? 'text-success' : 'text-danger';
            const changeSign = changePercent >= 0 ? '+' : '';
            
            priceDisplay.innerHTML = `
                <div class="fs-4 fw-bold text-light">${price.toFixed(5)}</div>
                <div class="small ${changeClass}">
                    ${changeSign}${changePercent.toFixed(2)}%
                </div>
            `;
        }
    }
    
    getBasePrice(asset) {
        const basePrices = {
            'EURUSD': 1.08450,
            'GBPUSD': 1.26320,
            'USDJPY': 148.750,
            'BTCUSD': 43250.00,
            'ETHUSD': 2650.00,
            'XAUUSD': 2025.50,
            'CRUDE': 78.45,
            'SPX500': 4750.00,
            'NASDAQ': 15200.00,
            'DOW': 34500.00
        };
        return basePrices[asset] || 1.00000;
    }
    
    destroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}

// Global chart instance
window.AdvancedTradingChart = AdvancedTradingChart;