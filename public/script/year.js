/*AUTO-CHANGE-YEAR*/
const baseYear = 2026;
const currentYear = new Date().getFullYear();

if (currentYear > baseYear) {
    document.getElementById('year').textContent = `${baseYear}–${currentYear}`;
} else {
    document.getElementById('year').textContent = baseYear;
}