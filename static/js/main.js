// TradePro Main JavaScript

class TradePro {
    constructor() {
        this.isInitialized = false;
        this.notifications = [];
        this.init();
    }
    
    init() {
        this.setupGlobalEventListeners();
        this.initializeComponents();
        this.setupNotifications();
        this.setupTheme();
        this.isInitialized = true;
    }
    
    setupGlobalEventListeners() {
        // Handle form submissions with loading states
        document.addEventListener('submit', (e) => {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                this.setButtonLoading(submitBtn, true);
                
                // Reset button after timeout if form doesn't redirect
                setTimeout(() => {
                    this.setButtonLoading(submitBtn, false);
                }, 5000);
            }
        });
        
        // Handle AJAX requests
        document.addEventListener('click', (e) => {
            if (e.target.dataset.ajax) {
                e.preventDefault();
                this.handleAjaxClick(e.target);
            }
        });
        
        // Auto-hide alerts
        this.setupAutoHideAlerts();
        
        // Setup tooltips
        this.setupTooltips();
        
        // Setup modals
        this.setupModals();
    }
    
    setupAutoHideAlerts() {
        const alerts = document.querySelectorAll('.alert:not(.alert-permanent)');
        alerts.forEach(alert => {
            if (alert.classList.contains('alert-success') || alert.classList.contains('alert-info')) {
                setTimeout(() => {
                    this.fadeOut(alert);
                }, 5000);
            }
        });
    }
    
    setupTooltips() {
        // Initialize Bootstrap tooltips if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }
    }
    
    setupModals() {
        // Initialize Bootstrap modals if available
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modalElements = document.querySelectorAll('.modal');
            modalElements.forEach(modalEl => {
                const modal = new bootstrap.Modal(modalEl);
                
                // Handle modal events
                modalEl.addEventListener('shown.bs.modal', () => {
                    const firstInput = modalEl.querySelector('input:not([type="hidden"]):not([readonly])');
                    if (firstInput) {
                        firstInput.focus();
                    }
                });
            });
        }
    }
    
    initializeComponents() {
        // Initialize trading interface if on trading page
        if (document.getElementById('trading-chart')) {
            this.initializeTradingPage();
        }
        
        // Initialize wallet page
        if (document.querySelector('.balance-card')) {
            this.initializeWalletPage();
        }
        
        // Initialize dashboard
        if (document.querySelector('.stat-card')) {
            this.initializeDashboard();
        }
        
        // Initialize admin pages
        if (document.querySelector('.admin-stats')) {
            this.initializeAdminPages();
        }
    }
    
    initializeTradingPage() {
        // Trading page specific initialization
        console.log('Initializing trading page...');
        
        // Setup price alerts
        this.setupPriceAlerts();
        
        // Setup keyboard shortcuts
        this.setupTradingShortcuts();
    }
    
    initializeWalletPage() {
        // Wallet page specific initialization
        console.log('Initializing wallet page...');
        
        // Setup form validation
        this.setupWalletFormValidation();
        
        // Setup transaction filtering
        this.setupTransactionFiltering();
    }
    
    initializeDashboard() {
        // Dashboard specific initialization
        console.log('Initializing dashboard...');
        
        // Setup auto-refresh
        this.setupDashboardAutoRefresh();
        
        // Setup charts
        this.setupDashboardCharts();
    }
    
    initializeAdminPages() {
        // Admin pages specific initialization
        console.log('Initializing admin pages...');
        
        // Setup admin confirmations
        this.setupAdminConfirmations();
        
        // Setup data tables
        this.setupDataTables();
    }
    
    setupPriceAlerts() {
        // Price alert functionality
        const alertInputs = document.querySelectorAll('.price-alert-input');
        alertInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.setPriceAlert(e.target.dataset.asset, e.target.value);
            });
        });
    }
    
    setupTradingShortcuts() {
        // Keyboard shortcuts for trading
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) return;
            
            switch(e.key) {
                case '1':
                    this.setQuickAmount(10);
                    break;
                case '2':
                    this.setQuickAmount(25);
                    break;
                case '3':
                    this.setQuickAmount(50);
                    break;
                case '4':
                    this.setQuickAmount(100);
                    break;
                case 'c':
                case 'C':
                    this.selectTradeType('call');
                    break;
                case 'p':
                case 'P':
                    this.selectTradeType('put');
                    break;
            }
        });
    }
    
    setupWalletFormValidation() {
        const forms = document.querySelectorAll('form[action*="deposit"], form[action*="withdraw"]');
        forms.forEach(form => {
            const amountInput = form.querySelector('input[name="amount"]');
            if (amountInput) {
                amountInput.addEventListener('input', () => {
                    this.validateWalletAmount(form, amountInput);
                });
            }
        });
    }
    
    setupTransactionFiltering() {
        const filterButtons = document.querySelectorAll('.transaction-filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.filterTransactions(e.target.dataset.filter);
            });
        });
    }
    
    setupDashboardAutoRefresh() {
        // Auto-refresh dashboard data every 30 seconds
        setInterval(() => {
            if (!document.hidden) {
                this.refreshDashboardData();
            }
        }, 30000);
    }
    
    setupDashboardCharts() {
        // Initialize dashboard charts
        const chartElements = document.querySelectorAll('.dashboard-chart');
        chartElements.forEach(element => {
            this.createDashboardChart(element);
        });
    }
    
    setupAdminConfirmations() {
        // Setup confirmation dialogs for admin actions
        const dangerActions = document.querySelectorAll('.btn-danger[data-confirm]');
        dangerActions.forEach(button => {
            button.addEventListener('click', (e) => {
                const message = e.target.dataset.confirm || 'Are you sure?';
                if (!confirm(message)) {
                    e.preventDefault();
                }
            });
        });
    }
    
    setupDataTables() {
        // Enhanced table functionality
        const tables = document.querySelectorAll('.table-sortable');
        tables.forEach(table => {
            this.makeSortable(table);
        });
    }
    
    setupNotifications() {
        // Web notifications setup
        if ('Notification' in window) {
            this.requestNotificationPermission();
        }
        
        // Setup toast notifications
        this.setupToastNotifications();
    }
    
    setupTheme() {
        // Theme management
        const savedTheme = localStorage.getItem('tradepro-theme');
        if (savedTheme) {
            this.setTheme(savedTheme);
        }
        
        // Theme toggle buttons
        const themeToggleButtons = document.querySelectorAll('.theme-toggle');
        themeToggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.toggleTheme();
            });
        });
    }
    
    setupToastNotifications() {
        // Create toast container if it doesn't exist
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'position-fixed top-0 end-0 p-3';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
    }
    
    // Utility methods
    setButtonLoading(button, loading) {
        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="loading-spinner me-2"></span>Loading...';
            button.disabled = true;
        } else {
            button.innerHTML = button.dataset.originalText;
            button.disabled = false;
        }
    }
    
    fadeOut(element, callback) {
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';
        setTimeout(() => {
            element.remove();
            if (callback) callback();
        }, 300);
    }
    
    setQuickAmount(amount) {
        const amountInput = document.getElementById('trade-amount');
        if (amountInput) {
            amountInput.value = amount;
            amountInput.dispatchEvent(new Event('input'));
        }
    }
    
    selectTradeType(type) {
        const typeInput = document.getElementById(`${type}-btn`);
        if (typeInput) {
            typeInput.checked = true;
            typeInput.dispatchEvent(new Event('change'));
        }
    }
    
    validateWalletAmount(form, input) {
        const amount = parseFloat(input.value) || 0;
        const submitBtn = form.querySelector('button[type="submit"]');
        const maxAmount = parseFloat(input.max) || Infinity;
        const minAmount = parseFloat(input.min) || 0;
        
        if (amount > maxAmount) {
            input.setCustomValidity('Amount exceeds available balance');
            submitBtn.disabled = true;
        } else if (amount < minAmount) {
            input.setCustomValidity(`Minimum amount is $${minAmount}`);
            submitBtn.disabled = true;
        } else {
            input.setCustomValidity('');
            submitBtn.disabled = false;
        }
    }
    
    filterTransactions(filter) {
        const transactions = document.querySelectorAll('.transaction-row');
        transactions.forEach(row => {
            if (filter === 'all' || row.dataset.type === filter) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    refreshDashboardData() {
        // Refresh dashboard data via fetch
        fetch('/api/dashboard_data')
            .then(response => response.json())
            .then(data => {
                this.updateDashboardData(data);
            })
            .catch(error => {
                console.error('Error refreshing dashboard data:', error);
            });
    }
    
    updateDashboardData(data) {
        // Update dashboard elements with new data
        if (data.balance) {
            const balanceElement = document.getElementById('live-balance');
            if (balanceElement) {
                balanceElement.textContent = `$${data.balance.toFixed(2)}`;
            }
        }
        
        if (data.trades) {
            const tradesElement = document.getElementById('total-trades');
            if (tradesElement) {
                tradesElement.textContent = data.trades;
            }
        }
    }
    
    createDashboardChart(element) {
        // Create chart for dashboard element
        const type = element.dataset.chartType || 'line';
        const data = JSON.parse(element.dataset.chartData || '[]');
        
        if (typeof Chart !== 'undefined') {
            new Chart(element, {
                type: type,
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }
    
    makeSortable(table) {
        // Add sorting functionality to table
        const headers = table.querySelectorAll('th[data-sort]');
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                this.sortTable(table, header.dataset.sort);
            });
        });
    }
    
    sortTable(table, column) {
        // Implement table sorting
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            const aValue = a.cells[column].textContent.trim();
            const bValue = b.cells[column].textContent.trim();
            
            if (isNaN(aValue) || isNaN(bValue)) {
                return aValue.localeCompare(bValue);
            } else {
                return parseFloat(aValue) - parseFloat(bValue);
            }
        });
        
        rows.forEach(row => tbody.appendChild(row));
    }
    
    setPriceAlert(asset, price) {
        // Set price alert
        console.log(`Price alert set for ${asset} at ${price}`);
        this.showToast('Price Alert Set', `Alert set for ${asset} at $${price}`, 'success');
    }
    
    requestNotificationPermission() {
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    
    showNotification(title, message, type = 'info') {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/static/images/logo.png'
            });
        }
    }
    
    showToast(title, message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast show align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${title}</strong><br>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-bs-theme', theme);
        localStorage.setItem('tradepro-theme', theme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    handleAjaxClick(element) {
        // Handle AJAX requests
        const url = element.href || element.dataset.url;
        const method = element.dataset.method || 'GET';
        
        this.setButtonLoading(element, true);
        
        fetch(url, {
            method: method,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            this.handleAjaxResponse(data);
        })
        .catch(error => {
            console.error('AJAX Error:', error);
            this.showToast('Error', 'An error occurred', 'danger');
        })
        .finally(() => {
            this.setButtonLoading(element, false);
        });
    }
    
    handleAjaxResponse(data) {
        if (data.message) {
            this.showToast('Success', data.message, 'success');
        }
        
        if (data.redirect) {
            window.location.href = data.redirect;
        }
        
        if (data.reload) {
            window.location.reload();
        }
    }
}

// Initialize TradePro when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.tradepro = new TradePro();
});

// Global utility functions
function showToast(title, message, type = 'info') {
    if (window.tradepro) {
        window.tradepro.showToast(title, message, type);
    }
}

function showNotification(title, message, type = 'info') {
    if (window.tradepro) {
        window.tradepro.showNotification(title, message, type);
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format percentage
function formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: 1,
        maximumFractionDigits: 2
    }).format(value / 100);
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied', 'Text copied to clipboard', 'success');
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TradePro };
}
