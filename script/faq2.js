document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const item = button.parentElement;
        item.classList.toggle('active');
        
        // Change icon from + to -
        const icon = button.querySelector('i');
        icon.classList.toggle('ri-add-line');
        icon.classList.toggle('ri-subtract-line');
    });
});