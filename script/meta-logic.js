 // 1. Tell Search Engines to ignore this domain
  if (window.location.hostname === 'emmystack01.github.io') {
    var meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.getElementsByTagName('head')[0].appendChild(meta);

    // 2. Redirect Users to the official .com domain
    // This script maintains the path (e.g., /partnership stays /partnership)
    var newLocation = window.location.href.replace('emmystack01.github.io', 'emmystack01.com');
    window.location.replace(newLocation);
  }
