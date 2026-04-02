document.addEventListener('DOMContentLoaded', () => {
    const navtoggle = document.querySelector('.nav-toggle');
    const navlink = document.querySelector('.nav-link');

    // Handle Main Mobile Burger Menu
    if (navtoggle) {
        navtoggle.addEventListener('click', () => {
            navtoggle.classList.toggle('open');
            navlink.classList.toggle('open');
        });
    }

    // Handle ALL Dropdown Buttons (Desktop & Mobile)
    const dropBtns = document.querySelectorAll('.dropbtn');
    
    dropBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Stops the click from closing the main mobile menu
            
            // Toggle the 'active' class on the specific dropdown clicked
            btn.parentElement.classList.toggle('active');
        });
    });

    // Close dropdowns if user clicks anywhere else on the page
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
});
