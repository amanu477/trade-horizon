// Force TradingView controls to be visible
document.addEventListener('DOMContentLoaded', function() {
    // Wait for TradingView to load
    setTimeout(function() {
        forceShowTradingViewControls();
        // Keep checking and forcing visibility
        setInterval(forceShowTradingViewControls, 2000);
    }, 3000);
});

function forceShowTradingViewControls() {
    try {
        // Get TradingView iframe
        const iframe = document.querySelector('#tradingview-widget iframe');
        if (!iframe) return;
        
        // Try to access iframe content (may be blocked by CORS)
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            
            // Force header visibility
            const headers = doc.querySelectorAll('.tv-header, [class*="header"]');
            headers.forEach(el => {
                el.style.display = 'block !important';
                el.style.visibility = 'visible !important';
                el.style.opacity = '1 !important';
            });
            
            // Force toolbar elements
            const toolbars = doc.querySelectorAll('[class*="toolbar"], [class*="button"], [class*="control"]');
            toolbars.forEach(el => {
                el.style.display = 'inline-block !important';
                el.style.visibility = 'visible !important';
                el.style.opacity = '1 !important';
            });
            
            // Force specific TradingView elements
            const tvElements = doc.querySelectorAll(
                '[class*="tv-"], [class*="symbol"], [class*="interval"], [class*="indicator"]'
            );
            tvElements.forEach(el => {
                el.style.display = 'block !important';
                el.style.visibility = 'visible !important';
                el.style.opacity = '1 !important';
            });
            
            console.log('Forced TradingView controls visibility');
        } catch (e) {
            // CORS prevents access to iframe content
            console.log('Cannot access TradingView iframe due to CORS');
        }
    } catch (error) {
        console.log('Error forcing TradingView visibility:', error);
    }
}