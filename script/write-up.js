{
    const words = document.querySelectorAll('.word');
    let textIndex = 0; // Renamed to be unique

    function rotateWords() {
        const currentWord = words[textIndex];
        currentWord.classList.remove('visible');
        currentWord.classList.add('hidden');

        textIndex = (textIndex + 1) % words.length;

        const nextWord = words[textIndex];
        nextWord.classList.remove('hidden');
        nextWord.classList.add('visible');
    }

    if (words.length > 0) {
        words[0].classList.add('visible');
        setInterval(rotateWords, 3000);
    }
}