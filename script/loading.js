document.addEventListener("DOMContentLoaded", () => {
    const dnaContainer = document.querySelector('.dna');
    const totalDots = 20;

    // Create the DNA dots
    for (let i = 0; i < totalDots; i++) {
        const dot1 = document.createElement('div');
        const dot2 = document.createElement('div');
        dot1.classList.add('dot');
        dot2.classList.add('dot');
        dnaContainer.appendChild(dot1);
        dnaContainer.appendChild(dot2);

        // Animate each pair of dots to create the helix effect
        gsap.to(dot1, {
            y: i * 10,
            x: Math.sin(i * 0.5) * 40,
            duration: 0,
        });
        gsap.to(dot2, {
            y: i * 10,
            x: Math.sin(i * 0.5 + Math.PI) * 40,
            duration: 0,
        });

        // Loop the rotation
        gsap.to([dot1, dot2], {
            x: (index, target) => {
                const isFirst = target === dot1;
                return isFirst ? `+=0` : `+=0;` // Dynamic calculation helper
            },
            repeat: -1,
            duration: 2,
            ease: "sine.inOut",
            modifiers: {
                x: (x, target) => {
                    const time = Date.now() * 0.002;
                    const offset = i * 0.5 + (target === dot1 ? 0 : Math.PI);
                    return Math.sin(time + offset) * 40 + "px";
                }
            }
        });
    }
});

// FADE OUT LOADER WHEN EVERYTHING IS READY
window.addEventListener("load", () => {
    const tl = gsap.timeline();
    
    tl.to("#loader", {
        opacity: 0,
        duration: 1,
        ease: "power2.inOut"
    })
    .set("#loader", { display: "none" }); // Remove from DOM so user can click content
});