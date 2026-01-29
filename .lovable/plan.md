
## Plan: Install Bing UET Tracking Tag

Adding the Bing Universal Event Tracking (UET) tag following your existing deferred loading pattern for optimal page performance.

---

## Changes to `index.html`

### 1. Add Resource Hints (in `<head>`)
Add preconnect and dns-prefetch for the Bing tracking domain to speed up the connection:

```html
<link rel="preconnect" href="https://bat.bing.com" crossorigin />
<link rel="dns-prefetch" href="https://bat.bing.com" />
```

### 2. Add Bing UET Tag (in deferred tracking section)
Add the Bing UET tag inside the existing `window.addEventListener('load', ...)` block so it loads after the page renders:

```javascript
// Bing UET - deferred
(function(w,d,t,r,u){
  var f,n,i;
  w[u]=w[u]||[];
  f=function(){
    var o={ti:"187233062", enableAutoSpaTracking: true};
    o.q=w[u];
    w[u]=new UET(o);
    w[u].push("pageLoad");
  };
  n=d.createElement(t);
  n.src=r;
  n.async=1;
  n.onload=n.onreadystatechange=function(){
    var s=this.readyState;
    s&&s!=="loaded"&&s!=="complete"||(f(),n.onload=n.onreadystatechange=null);
  };
  i=d.getElementsByTagName(t)[0];
  i.parentNode.insertBefore(n,i);
})(window,document,"script","//bat.bing.com/bat.js","uetq");
```

---

## Tag Details

| Setting | Value |
|---------|-------|
| Tag ID | `187233062` |
| Auto SPA Tracking | Enabled |
| Loading | Deferred (after page load) |

The `enableAutoSpaTracking: true` option will automatically track page views as users navigate through your React SPA routes without needing manual event calls.

---

## No Additional Changes Needed

Since Bing UET has auto SPA tracking enabled, it will automatically track:
- Initial page views
- Route changes within the app
- Standard conversion events

If you want to track custom conversions (like quote completions or appointments booked), let me know and I can add those event calls to the relevant components.
