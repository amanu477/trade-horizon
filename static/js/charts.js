// TradePro Chart Management JavaScript

class TradingChart {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas?.getContext('2d');
        this.chart = null;
        this.currentAsset = options.asset || 'EURUSD';
        this.timeframe = options.timeframe || '1m';
        this.data = [];
        this.isInitialized = false;
        
        this.defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#00d4aa',
                    borderWidth: 1,
                    callbacks: {
                        title: function(context) {
                            return new Date(context[0].label).toLocaleString();
                        },
                        label: function(context) {
                            return `Price: ${context.parsed.y.toFixed(5)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fff'
                    }
                },
                y: {
                    position: 'right',
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fff',
                        callback: function(value) {
                            return value.toFixed(5);
                        }
                    }
                }
            }
        };
        
        this.init();
    }
    
    init() {
        if (!this.canvas || !this.ctx) {
            console.error('Canvas element not found');
            this.createFallbackChart();
            return;
        }
        
        // Import Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            this.loadChartJS().then(() => {
                this.createChart();
            }).catch(() => {
                this.createFallbackChart();
            });
        } else {
            this.createChart();
        }
    }
    
    createFallbackChart() {
        if (!this.canvas || !this.ctx) return;
        
        // Simple fallback chart without Chart.js
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#00d4aa';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Draw simple price line
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
        this.ctx.fillStyle = '#00d4aa';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`${this.currentAsset}: ${basePrice.toFixed(5)}`, 10, 30);
        
        console.log('Fallback chart created');
        this.isInitialized = true;
    }
    
    async loadChartJS() {
        return new Promise((resolve, reject) => {
            if (typeof Chart !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    createChart() {
        try {
            if (typeof Chart === 'undefined') {
                this.createFallbackChart();
                return;
            }
            
            // Generate initial data
            this.generateInitialData();
            
            this.chart = new Chart(this.ctx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: this.currentAsset,
                        data: this.data,
                        borderColor: '#00d4aa',
                        backgroundColor: 'rgba(0, 212, 170, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: '#00d4aa',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 2
                    }]
                },
                options: this.defaultOptions
            });
            
            this.isInitialized = true;
            this.startRealTimeUpdates();
            
        } catch (error) {
            console.error('Error creating chart:', error);
        }
    }
    
    generateInitialData() {
        const now = new Date();
        const basePrice = this.getBasePrice(this.currentAsset);
        this.data = [];
        
        // Generate 100 data points for initial display
        for (let i = 99; i >= 0; i--) {
            const timestamp = new Date(now.getTime() - i * 60000); // 1 minute intervals
            const volatility = this.getAssetVolatility(this.currentAsset);
            const change = (Math.random() - 0.5) * volatility * 2;
            const price = basePrice * (1 + change * (i / 100));
            
            this.data.push({
                x: timestamp,
                y: price
            });
        }
    }
    
    getBasePrice(asset) {
        const basePrices = {
            'EURUSD': 1.08450,
            'GBPUSD': 1.26500,
            'USDJPY': 149.500,
            'BTCUSD': 45000.00,
            'ETHUSD': 2800.00,
            'XAUUSD': 2050.00,
            'CRUDE': 75.50
        };
        return basePrices[asset] || 100.00;
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
    
    startRealTimeUpdates() {
        if (!this.isInitialized) return;
        
        setInterval(() => {
            this.addNewDataPoint();
        }, 2000); // Update every 2 seconds
    }
    
    addNewDataPoint() {
        if (!this.chart || !this.data.length) return;
        
        const lastPoint = this.data[this.data.length - 1];
        const volatility = this.getAssetVolatility(this.currentAsset);
        const change = (Math.random() - 0.5) * volatility * 2;
        const newPrice = lastPoint.y * (1 + change);
        
        const newPoint = {
            x: new Date(),
            y: newPrice
        };
        
        // Add new point
        this.data.push(newPoint);
        
        // Remove old points to maintain performance (keep last 100 points)
        if (this.data.length > 100) {
            this.data.shift();
        }
        
        // Update chart
        this.chart.update('none');
        
        // Update current price display
        this.updatePriceDisplay(newPrice, change);
    }
    
    updatePriceDisplay(price, change) {
        const priceElement = document.getElementById('current-price');
        const changeElement = document.getElementById('price-change');
        
        if (priceElement) {
            priceElement.textContent = price.toFixed(5);
        }
        
        if (changeElement) {
            const changePercent = (change * 100).toFixed(2);
            const changeValue = (price * change).toFixed(5);
            const isPositive = change > 0;
            
            changeElement.textContent = `${isPositive ? '+' : ''}${changeValue} (${isPositive ? '+' : ''}${changePercent}%)`;
            changeElement.className = `price-change ms-2 ${isPositive ? 'text-success' : 'text-danger'}`;
        }
    }
    
    updateAsset(asset) {
        this.currentAsset = asset;
        
        if (this.chart) {
            // Update chart title
            this.chart.data.datasets[0].label = asset;
            
            // Generate new data for the asset
            this.generateInitialData();
            this.chart.data.datasets[0].data = this.data;
            
            // Update chart
            this.chart.update();
        }
    }
    
    setTimeframe(timeframe) {
        this.timeframe = timeframe;
        
        if (this.chart) {
            // Update time scale based on timeframe
            const timeUnits = {
                '1m': 'minute',
                '5m': 'minute',
                '15m': 'minute',
                '1h': 'hour',
                '4h': 'hour',
                '1d': 'day'
            };
            
            this.chart.options.scales.x.time.unit = timeUnits[timeframe] || 'minute';
            this.chart.update();
        }
    }
    
    addTradeEntry(price, type, time = new Date()) {
        if (!this.chart) return;
        
        const color = type === 'call' ? '#28a745' : '#dc3545';
        const label = type === 'call' ? 'CALL Entry' : 'PUT Entry';
        
        // Add annotation (if Chart.js annotation plugin is loaded)
        if (this.chart.options.plugins.annotation) {
            this.chart.options.plugins.annotation.annotations[`trade-${time.getTime()}`] = {
                type: 'point',
                xValue: time,
                yValue: price,
                backgroundColor: color,
                borderColor: color,
                borderWidth: 2,
                radius: 6,
                label: {
                    content: label,
                    enabled: true,
                    position: 'top'
                }
            };
            
            this.chart.update();
        }
    }
    
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
        this.isInitialized = false;
    }
}

// Chart management functions
let tradingChart;

function initializeTradingChart(canvasId = 'trading-chart', asset = 'EURUSD') {
    if (tradingChart) {
        tradingChart.destroy();
    }
    
    tradingChart = new TradingChart(canvasId, { asset });
}

function updateChartAsset(asset) {
    if (tradingChart) {
        tradingChart.updateAsset(asset);
    }
}

function setChartTimeframe(timeframe) {
    if (tradingChart) {
        tradingChart.setTimeframe(timeframe);
    }
}

function addTradeToChart(price, type, time) {
    if (tradingChart) {
        tradingChart.addTradeEntry(price, type, time);
    }
}

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    const chartCanvas = document.getElementById('trading-chart');
    if (chartCanvas) {
        initializeTradingChart();
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        TradingChart, 
        initializeTradingChart, 
        updateChartAsset, 
        setChartTimeframe, 
        addTradeToChart 
    };
}
