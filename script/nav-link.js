const navLinks = document.querySelectorAll('.nav-links a');
const whiteSections = document.querySelectorAll('.white-section');

const observerOptions = {
    threshold: 0,
    // -80px is the height of your navbar. 
    // This tells the observer: "Only trigger if the white section is in the top 80px of the screen."
    rootMargin: "-80px 0px -99% 0px" 
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // Log to console to debug: console.log(entry.target, entry.isIntersecting);
        if (entry.isIntersecting) {
            navLinks.forEach(link => link.classList.add('nav-link-scrolled'));
        } else {
            navLinks.forEach(link => link.classList.remove('nav-link-scrolled'));
        }
    });
}, observerOptions);

whiteSections.forEach(section => observer.observe(section));