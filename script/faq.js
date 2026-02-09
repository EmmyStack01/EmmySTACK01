const questions = document.querySelectorAll('.faq-question');

questions.forEach(question => {
  question.addEventListener('click', () => {
    const currentItem = question.parentElement;
    const currentAnswer = currentItem.querySelector('.faq-answer');
    const activeItem = document.querySelector('.faq-item.active');

    // 1. Close other open items and reset their height
    if (activeItem && activeItem !== currentItem) {
      activeItem.classList.remove('active');
      activeItem.querySelector('.faq-answer').style.maxHeight = null;
    }

    // 2. Toggle the clicked item
    currentItem.classList.toggle('active');

    // 3. Dynamically adjust height
    if (currentItem.classList.contains('active')) {
      // scrollHeight calculates the full height of the content plus padding
      currentAnswer.style.maxHeight = currentAnswer.scrollHeight + "px";
    } else {
      currentAnswer.style.maxHeight = null;
    }
  });
});

window.addEventListener('resize', () => {
    // Find any FAQ item that is currently open
    const activeAnswer = document.querySelector('.faq-item.active .faq-answer');
    
    if (activeAnswer) {
        // Recalculate the height based on the new screen width
        activeAnswer.style.maxHeight = activeAnswer.scrollHeight + "px";
    }
});