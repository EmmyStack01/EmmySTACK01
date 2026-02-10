// Keep these global so your HTML onclick attributes can find them
let cardIndex = -1; 

function bringToFront(element) {
    const cards = document.querySelectorAll('.card');
    const index = Array.from(cards).indexOf(element);

    if (element.classList.contains('active')) {
        element.classList.remove('active');
        cardIndex = -1;
    } else {
        cards.forEach(card => card.classList.remove('active'));
        element.classList.add('active');
        cardIndex = index;
    }
}

function moveManual(direction) {
    const cards = document.querySelectorAll('.card');
    if (cards.length === 0) return;

    cards.forEach(card => card.classList.remove('active'));

    if (direction === 'next') {
        cardIndex = (cardIndex + 1) % cards.length;
    } else {
        cardIndex = (cardIndex <= 0) ? cards.length - 1 : cardIndex - 1;
    }

    cards[cardIndex].classList.add('active');

}
