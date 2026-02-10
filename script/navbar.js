document.addEventListener('DOMContentLoaded', () => {
    // Get the button and the navigationn elements
    const navtoggle = document.querySelector('.nav-toggle');
    const navlink = document.querySelector('.nav-link');

    // Function to handle the menu toggle
    function toggleMenu() {
        navtoggle.classList.toggle('open');
        navlink.classList.toggle('open');
    }

    // Add click listener to the toggle button
    navtoggle.addEventListener('click', toggleMenu)

    // Close the menu when a link is clicked 
    const navLinks = navlink.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navlink.classList.contains('open')) {
                toggleMenu();
            }
        });
    });
});