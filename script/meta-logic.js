(function() {
    var currentUrl = window.location.href;

    // Check if we are on the GitHub domain
    if (currentUrl.includes('emmystack01.github.io/EmmySTACK01')) {
        
        // 1. Immediate No-Index for Search Engines
        var meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, nofollow';
        document.getElementsByTagName('head')[0].appendChild(meta);

        // 2. Build the new .com URL
        // Replace the GitHub base with your domain
        var newLocation = currentUrl.replace('emmystack01.github.io/EmmySTACK01', 'emmystack01.com');

        // 3. Clean up the URL (Remove .html and index.html)
        newLocation = newLocation.replace('/index.html', '/');
        newLocation = newLocation.replace('.html', '');

        // 4. Execute Redirect
        window.location.replace(newLocation);
    }
})();
