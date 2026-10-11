/**
 * Emmy STACK01 — demo card deck (Digital Business Card page).
 * No globals and no inline onclick handlers: it finds the deck by id and wires its own buttons.
 *   • click a card  → bring it to the front (click again to put it back)
 *   • ‹ / › buttons → step through the cards (also ←/→ while focus is inside the deck)
 */
(() => {
  const deck = document.getElementById("dmDeck");
  if (!deck) return;

  const cards = [...deck.querySelectorAll(".dm-card")];
  let index = -1; // -1 = nothing popped out

  function show(n) {
    index = n;
    cards.forEach((card, k) => {
      const on = k === n;
      card.classList.toggle("active", on);
      card.querySelector(".dm-pick").setAttribute("aria-pressed", String(on));
    });
  }

  cards.forEach((card, k) =>
    card.querySelector(".dm-pick").addEventListener("click", () => show(index === k ? -1 : k))
  );

  const step = (dir) => show(dir === "next" ? (index + 1) % cards.length : index <= 0 ? cards.length - 1 : index - 1);
  document.querySelectorAll("[data-dm]").forEach((btn) => btn.addEventListener("click", () => step(btn.dataset.dm)));

  deck.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step("next"); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step("prev"); }
    else if (e.key === "Escape") show(-1);
  });
})();
