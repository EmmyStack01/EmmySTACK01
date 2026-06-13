// ── MOBILE DRAWER ──────────────────────────────────────
    (function () {
        var drawer   = document.getElementById('drawer');
        var overlay  = document.getElementById('overlay');
        var openBtn  = document.getElementById('openMenu');
        var closeBtn = document.getElementById('closeMenu');
        var toolsBtn   = document.getElementById('toolsBtn');
        var toolsMenu  = document.getElementById('toolsMenu');
        var toolsArrow = document.getElementById('toolsArrow');

        function openDrawer() {
            drawer.classList.add('open');
            overlay.classList.add('show');
            openBtn.classList.add('open');        // burger → X
        }
        function closeDrawer() {
            drawer.classList.remove('open');
            overlay.classList.remove('show');
            openBtn.classList.remove('open');     // X → burger
        }

        openBtn.addEventListener('click', openDrawer);
        closeBtn.addEventListener('click', closeDrawer);
        overlay.addEventListener('click', closeDrawer);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeDrawer();
        });

        // Close mobile drawer if viewport grows into desktop nav range
        window.addEventListener('resize', function () {
            if (window.innerWidth >= 1070.01) {
                closeDrawer();
            }
        });

        // Mobile Tools submenu
        if (toolsMenu) toolsMenu.style.height = '0px';
        var toolsOpen = false;

        toolsBtn.addEventListener('click', function () {
            toolsOpen = !toolsOpen;
            if (toolsOpen) {
                toolsMenu.style.height = toolsMenu.scrollHeight + 'px';
                toolsArrow.classList.add('rotate');
                toolsBtn.setAttribute('aria-expanded', 'true');
            } else {
                toolsMenu.style.height = '0px';
                toolsArrow.classList.remove('rotate');
                toolsBtn.setAttribute('aria-expanded', 'false');
            }
        });
    })();

document.addEventListener('DOMContentLoaded', () => {

    // ── DESKTOP DROPDOWN ──────────────────────────────────
    const desktopDropBtns = document.querySelectorAll('nav.nav .dropbtn');

    desktopDropBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const parent = btn.parentElement;
            const isOpen = parent.classList.contains('active');

            // Close all first
            document.querySelectorAll('nav.nav .dropdown').forEach(d => {
                d.classList.remove('active');
            });

            // If it wasn't open, open it — if it was open, leave it closed (toggle)
            if (!isOpen) {
                parent.classList.add('active');
            }
        });
    });

    // Close on outside click — only fires when click is truly outside the dropdown
    document.addEventListener('click', (e) => {
        if (!e.target.closest('nav.nav .dropdown')) {
            document.querySelectorAll('nav.nav .dropdown').forEach(d => {
                d.classList.remove('active');
            });
        }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('nav.nav .dropdown').forEach(d => {
                d.classList.remove('active');
            });
        }
    });

    // ── ACTIVE NAV LINK (desktop) ─────────────────────────
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    document.querySelectorAll('nav.nav .nav-links a').forEach(link => {
        const href = (link.getAttribute('href') || '').replace(/\/$/, '') || '/';
        if (href === currentPath) {
            link.classList.add('nav-link-active');
        } else {
            link.classList.remove('nav-link-active');
        }
    });

    // ── SCROLL DIM (desktop) ──────────────────────────────
    const navEls = document.querySelectorAll('nav.nav .nav-links a, nav.nav .nav-links .dropbtn');

    const onScroll = () => {
        const scrolled = window.scrollY > 40;
        navEls.forEach(el => el.classList.toggle('nav-link-scrolled', scrolled));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

});
