(function() {
    // Configuration
    const config = {
        trackFetch: true,
        trackXHR: true,
        trackWebSockets: true,
        trackBeacon: true,
        trackEventsource: true,
        trackPerformance: true,
        ignoreSameOrigin: false,
        filterPattern: null,
        groupByDomain: false,
        displayLimit: 100,
        saveHeaders: false,
        saveResponseSizes: false
    };

    // Data storage with full details
    const apiCallLog = [];
    const apiCallSet = new Set(); // For deduplication

    // Helper functions
    function shouldTrack(url) {
        if (!url) return false;
        if (config.ignoreSameOrigin && new URL(url, window.location.href).origin === window.location.origin) {
            return false;
        }
        if (config.filterPattern && !config.filterPattern.test(url)) {
            return false;
        }
        return true;
    }

    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    function addApiCall(type, url, method, details = {}) {
        if (!url || !shouldTrack(url)) return;
        
        try {
            const normalizedUrl = new URL(url, window.location.href);
            const callId = `${type}-${normalizedUrl.href}-${method || 'GET'}`;
            
            if (apiCallSet.has(callId)) return;
            apiCallSet.add(callId);
            
            const timestamp = new Date();
            const callData = {
                id: generateUniqueId(),
                type: type,
                url: normalizedUrl.href,
                cleanUrl: `${normalizedUrl.origin}${normalizedUrl.pathname}`,
                domain: normalizedUrl.hostname,
                method: method || 'GET',
                timestamp: timestamp.toISOString(),
                localTime: timestamp.toString(),
                ...details
            };
            
            apiCallLog.push(callData);
            return callData;
        } catch (e) {
            console.error('Error tracking API call:', e);
            return null;
        }
    }

    // 1. Monitor Fetch API
    if (config.trackFetch) {
        const originalFetch = window.fetch;
        window.fetch = async function() {
            const [input, init] = arguments;
            const url = input instanceof Request ? input.url : input;
            const method = (init?.method) || (input instanceof Request ? input.method : 'GET');
            
            const callData = addApiCall('fetch', url, method, {
                headers: config.saveHeaders ? (init?.headers || (input instanceof Request ? Object.fromEntries(input.headers.entries()) : {})) : undefined
            });
            
            try {
                const response = await originalFetch.apply(this, arguments);
                
                if (callData && config.saveResponseSizes) {
                    callData.responseSize = response.headers.get('content-length');
                    callData.status = response.status;
                }
                
                return response;
            } catch (error) {
                if (callData) {
                    callData.error = error.message;
                }
                throw error;
            }
        };
    }

    // 2. Monitor XMLHttpRequest
    if (config.trackXHR) {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function() {
            const method = arguments[0];
            const url = arguments[1];
            
            this._apiCallData = addApiCall('xhr', url, method, {
                headers: config.saveHeaders ? {} : undefined
            });
            
            return originalOpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function(body) {
            if (this._apiCallData && config.saveHeaders) {
                this._apiCallData.headers = this._apiCallData.headers || {};
                const headers = this.getAllResponseHeaders();
                if (headers) {
                    headers.split('\r\n').forEach(line => {
                        const [key, value] = line.split(': ');
                        if (key) this._apiCallData.headers[key] = value;
                    });
                }
            }
            
            const originalOnReadyStateChange = this.onreadystatechange;
            this.onreadystatechange = function() {
                if (this.readyState === 4 && this._apiCallData) {
                    if (config.saveResponseSizes) {
                        this._apiCallData.responseSize = this.getResponseHeader('content-length');
                        this._apiCallData.status = this.status;
                    }
                }
                if (originalOnReadyStateChange) {
                    originalOnReadyStateChange.apply(this, arguments);
                }
            };
            
            return originalSend.apply(this, arguments);
        };
    }

    // 3. Monitor WebSockets
    if (config.trackWebSockets) {
        const originalWebSocket = window.WebSocket;
        window.WebSocket = function(url) {
            addApiCall('websocket', url, 'WS', {
                protocol: arguments[1] || null
            });
            return new originalWebSocket(url, arguments[1]);
        };
    }

    // 4. Monitor Beacon API
    if (config.trackBeacon) {
        const originalSendBeacon = navigator.sendBeacon;
        navigator.sendBeacon = function(url, data) {
            addApiCall('beacon', url, 'BEACON', {
                dataSize: data?.toString().length
            });
            return originalSendBeacon.apply(this, arguments);
        };
    }

    // 5. Monitor EventSource
    if (config.trackEventsource) {
        const originalEventSource = window.EventSource;
        window.EventSource = function(url, eventSourceInitDict) {
            addApiCall('eventsource', url, 'SSE', {
                withCredentials: eventSourceInitDict?.withCredentials || false
            });
            return new originalEventSource(url, eventSourceInitDict);
        };
    }

    // 6. Get historical performance entries
    if (config.trackPerformance) {
        try {
            const resources = performance.getEntriesByType('resource');
            resources.forEach(resource => {
                const type = resource.initiatorType || 'performance';
                if (['fetch', 'xhr', 'beacon', 'eventsource'].includes(type)) {
                    addApiCall(type, resource.name, 'GET', {
                        duration: resource.duration,
                        startTime: resource.startTime,
                        responseSize: resource.transferSize
                    });
                }
            });
        } catch (e) {
            console.error('Performance timing not available:', e);
        }
    }

    // Create download button
    function createDownloadButton() {
        const button = document.createElement('button');
        button.textContent = 'Download API Logs as JSON';
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.zIndex = '9999';
        button.style.padding = '10px 15px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.fontFamily = 'Arial, sans-serif';
        button.style.fontSize = '14px';
        
        button.onclick = function() {
            downloadApiLogs();
        };
        
        document.body.appendChild(button);
        return button;
    }

    // Download API logs as JSON file
    function downloadApiLogs() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `api-calls-${timestamp}.json`;
        const dataStr = JSON.stringify(apiCallLog, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = filename;
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        console.log(`%cDownloaded API logs (${apiCallLog.length} calls) as ${filename}`, 'color: #2ecc71;');
    }

    // Display results in console
    function displayResults() {
        console.clear();
        console.log('%c=== API Call Logger ===', 'color: #3498db; font-size: 16px; font-weight: bold;');
        console.log(`%cTracking ${apiCallLog.length} API calls. Click the button to download as JSON.`, 'color: #7f8c8d;');
        
        // Show summary by type
        const typeCounts = {};
        apiCallLog.forEach(call => {
            typeCounts[call.type] = (typeCounts[call.type] || 0) + 1;
        });
        
        console.log('%cAPI Call Types:', 'color: #e67e22; font-weight: bold;');
        Object.entries(typeCounts).forEach(([type, count]) => {
            console.log(`%c${type.toUpperCase()}: ${count} calls`, 'color: #95a5a6;');
        });
        
        // Show recent calls
        console.groupCollapsed('%cRecent API Calls', 'color: #9b59b6; font-weight: bold;');
        apiCallLog.slice(-config.displayLimit).reverse().forEach(call => {
            console.log(`%c${call.timestamp} - ${call.type.toUpperCase()} ${call.method} ${call.url}`, 'color: #95a5a6;');
        });
        console.groupEnd();
        
        console.log('%c=== End of Report ===', 'color: #3498db; font-size: 16px; font-weight: bold;');
    }

    // Initialize
    setTimeout(() => {
        createDownloadButton();
        displayResults();
        
        // Update display every 5 seconds
        setInterval(displayResults, 5000);
    }, 1000);
    
    // Export functions to global scope
    window.downloadApiLogs = downloadApiLogs;
    window.getApiLogs = () => apiCallLog;
    
    console.log('API Call Logger initialized. Interact with the page to track API calls.');
})();
