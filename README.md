# 🔎 API Calls Logger

**Real-Time Fetch, XHR, WebSocket, Beacon & SSE Tracker with JSON Export**

This project provides a **lightweight JavaScript utility** for tracking API calls in real-time inside any browser environment. It intercepts **Fetch, XHR, WebSocket, Beacon, EventSource (SSE), and Performance entries** — then logs them to the console and lets you **download results as JSON** for further analysis.

---

## ✨ Features

* 📡 **Multi-protocol support**: Fetch, XHR, WebSockets, Beacon, EventSource, Performance
* 📝 **Detailed logging**: method, URL, domain, status, headers, response size, errors
* 📊 **Console summaries**: live request counts, grouped by type
* 💾 **Export to JSON**: one-click download of all captured API calls
* ⚙️ **Fully configurable**: filter by domain, enable/disable features, save headers, etc.
* 🛠 **Easy to inject**: works as a bookmarklet, inline script, or snippet in DevTools

---

## 🚀 Getting Started

### 1. Copy the Script

Simply copy the full JavaScript file into the **browser console** or inject it into a page.

```html
<script src="api-call-logger.js"></script>
```

Or paste directly into **DevTools Console** on any webpage:

```js
(function(){ /* ... full script ... */ })();
```

### 2. Interact with the Page

Once initialized, the script automatically logs all supported API calls as you interact with the page.

### 3. Download Logs

Click the green **“Download API Logs as JSON”** button that appears at the bottom-right corner to save logs locally.

---

## ⚙️ Configuration

The script comes with a built-in `config` object at the top of the file:

```js
const config = {
    trackFetch: true,           // Monitor Fetch API
    trackXHR: true,             // Monitor XMLHttpRequest
    trackWebSockets: true,      // Monitor WebSocket connections
    trackBeacon: true,          // Monitor Beacon API
    trackEventsource: true,     // Monitor EventSource (SSE)
    trackPerformance: true,     // Log historical performance entries
    ignoreSameOrigin: false,    // Skip same-origin requests
    filterPattern: null,        // Regex to filter tracked URLs
    groupByDomain: false,       // Group logs by domain
    displayLimit: 100,          // Console output limit
    saveHeaders: false,         // Save request/response headers
    saveResponseSizes: false    // Save response content-length
};
```

Modify these values to adjust tracking behavior.

---

## 📊 Console Output

The logger refreshes every 5 seconds with:

* **Summary by request type** (fetch/xhr/ws/etc.)
* **Recent calls** (method, URL, timestamp)
* **Errors** (if any occurred during requests)

Example output:

```
=== API Call Logger ===
Tracking 12 API calls. Click the button to download as JSON.
API Call Types:
FETCH: 8 calls
XHR: 2 calls
WEBSOCKET: 1 call
BEACON: 1 call
```

---

## 💻 API

After loading, two helper functions are globally available:

```js
window.getApiLogs();      // Returns current log array
window.downloadApiLogs(); // Triggers JSON download manually
```

---

## 🎯 Use Cases

* Debugging hidden **API calls** made by a web app
* Auditing **third-party integrations** for security/privacy
* Collecting reproducible **network traces**
* Performance analysis (duration, transfer size)
* Researching how a site communicates with its backend

---

## 📥 Example JSON Output

A captured log file might look like this:

```json
[
  {
    "id": "mbd3i4d20",
    "type": "fetch",
    "url": "https://api.example.com/data",
    "cleanUrl": "https://api.example.com/data",
    "domain": "api.example.com",
    "method": "GET",
    "timestamp": "2025-08-15T17:04:23.123Z",
    "localTime": "Fri Aug 15 2025 13:04:23 GMT-0400",
    "status": 200,
    "responseSize": 1024
  }
]
```
