// Example fix in your JS
element.scrollIntoView({ behavior: 'smooth' });

// Wait for the smooth scroll to finish before locking the body (adjust timing as needed)
setTimeout(() => {
    document.body.classList.add('stop-scrolling');
}, 800);