/* AUTO-CHANGE-YEAR */
const baseYear = 2026;
const currentYear = new Date().getFullYear();

document.querySelectorAll('.year').forEach(element => {
    if (currentYear > baseYear) {
        element.textContent = `${baseYear}–${currentYear}`;
    } else {
        element.textContent = baseYear;
    }
});