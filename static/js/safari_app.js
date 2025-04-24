// Safari App JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Update the time in the status bar
    function updateTime() {
        const now = new Date();
        let hours = now.getHours();
        let minutes = now.getMinutes();
        
        // Format the time as HH:MM
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        document.getElementById('status-time').textContent = hours + ':' + minutes;
    }
    
    // Update time immediately and then every minute
    updateTime();
    setInterval(updateTime, 60000);
    
    // Browser elements
    const urlInput = document.getElementById('url-input');
    const clearUrlButton = document.getElementById('clear-url');
    const browserIframe = document.getElementById('browser-iframe');
    const startPage = document.getElementById('start-page');
    const backButton = document.getElementById('back-button');
    const forwardButton = document.getElementById('forward-button');
    const shareButton = document.getElementById('share-button');
    const tabsButton = document.getElementById('tabs-button');
    const favoriteItems = document.querySelectorAll('.favorite-item');
    
    // Browser history
    let browserHistory = [];
    let currentHistoryIndex = -1;
    
    // Function to load a URL
    function loadUrl(url) {
        // Check if URL has http/https prefix
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        try {
            // Update browser iframe
            browserIframe.src = url;
            urlInput.value = url;
            
            // Hide start page
            startPage.style.display = 'none';
            
            // Update history
            if (currentHistoryIndex < browserHistory.length - 1) {
                // If we navigated back and then to a new URL, remove forward history
                browserHistory = browserHistory.slice(0, currentHistoryIndex + 1);
            }
            browserHistory.push(url);
            currentHistoryIndex = browserHistory.length - 1;
            
            // Update navigation buttons
            updateNavigationButtons();
        } catch (error) {
            console.error('Error loading URL:', error);
            alert('Unable to load the requested URL');
        }
    }
    
    // Function to update navigation buttons
    function updateNavigationButtons() {
        backButton.disabled = currentHistoryIndex <= 0;
        forwardButton.disabled = currentHistoryIndex >= browserHistory.length - 1;
    }
    
    // URL input handling
    urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const url = urlInput.value.trim();
            if (url) {
                loadUrl(url);
            }
        }
    });
    
    urlInput.addEventListener('input', () => {
        clearUrlButton.classList.toggle('hidden', !urlInput.value);
    });
    
    urlInput.addEventListener('focus', () => {
        urlInput.select();
    });
    
    // Clear URL button
    clearUrlButton.addEventListener('click', () => {
        urlInput.value = '';
        urlInput.focus();
        clearUrlButton.classList.add('hidden');
    });
    
    // Back button
    backButton.addEventListener('click', () => {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            browserIframe.src = browserHistory[currentHistoryIndex];
            urlInput.value = browserHistory[currentHistoryIndex];
            updateNavigationButtons();
        }
    });
    
    // Forward button
    forwardButton.addEventListener('click', () => {
        if (currentHistoryIndex < browserHistory.length - 1) {
            currentHistoryIndex++;
            browserIframe.src = browserHistory[currentHistoryIndex];
            urlInput.value = browserHistory[currentHistoryIndex];
            updateNavigationButtons();
        }
    });
    
    // Share button
    shareButton.addEventListener('click', () => {
        const currentUrl = browserIframe.src;
        if (currentUrl && currentUrl !== 'about:blank') {
            alert(`Share: ${currentUrl}\n(Sharing functionality is simulated)`);
        } else {
            alert('No page to share');
        }
    });
    
    // Tabs button
    tabsButton.addEventListener('click', () => {
        alert('Tabs: Currently you have 1 tab open\n(Tab management is simulated)');
    });
    
    // Favorite items
    favoriteItems.forEach(item => {
        item.addEventListener('click', () => {
            const url = item.dataset.url;
            if (url) {
                loadUrl(url);
            }
        });
    });
    
    // Initialize navigation buttons
    updateNavigationButtons();
});
