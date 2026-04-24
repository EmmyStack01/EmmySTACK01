  // 1. Check if the current URL contains the GitHub path
  if (window.location.hostname.includes('github.io')) {
    
    // 2. Tell Search Engines to ignore this domain
    var meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.getElementsByTagName('head')[0].appendChild(meta);

    // 3. Redirect Users to the official .com domain
    // We target the specific GitHub path and replace it with your clean domain
    var currentUrl = window.location.href;
    if (currentUrl.includes('emmystack01.github.io/EmmySTACK01')) {
        var newLocation = currentUrl.replace('emmystack01.github.io/EmmySTACK01', 'emmystack01.com');
        
        // Remove trailing .html if it exists to keep URLs pretty on the .com
        newLocation = newLocation.replace('.html', '');
        
        window.location.replace(newLocation);
    }
  }
