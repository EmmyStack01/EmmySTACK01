// Separate the toggle from the navigation links
const navLinks = document.querySelectorAll('.nav-links a, .dropbtn');
const navToggle = document.querySelector('.nav-toggle'); 
const whiteSections = document.querySelectorAll('.white-section');

const observerOptions = {
    threshold: 0,
    rootMargin: "-80px 0px -99% 0px" 
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Apply standard class to links and dropdown buttons
            navLinks.forEach(link => link.classList.add('nav-link-scrolled'));
            
            // Apply specific class to the toggle line if it exists
            if (navToggle) navToggle.classList.add('line-scrolled');
        } else {
            navLinks.forEach(link => link.classList.remove('nav-link-scrolled'));
            if (navToggle) navToggle.classList.remove('line-scrolled');
        }
    });
}, observerOptions);

whiteSections.forEach(section => observer.observe(section));