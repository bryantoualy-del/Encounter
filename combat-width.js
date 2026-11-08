/* Encounter combat panel width control; purely visual and local. */
(() => {
  'use strict';
  const view = document.getElementById('combatView');
  const input = document.getElementById('combatWeightSlider');
  const initiative = document.getElementById('combatInitiativeWeight');
  const target = document.getElementById('combatTargetWeight');
  const reset = document.getElementById('combatWeightReset');
  if (!view || !input || !initiative || !target) return;
  const key = 'encounter:combat-column-weight:v1';
  const normalize = value => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(35, Math.min(60, Math.round(number / 5) * 5)) : 55;
  };
  function setWeight(value, persist = true) {
    const n = normalize(value);
    view.style.setProperty('--initiative-column-fr', n + 'fr');
    view.style.setProperty('--target-column-fr', (100 - n) + 'fr');
    initiative.textContent = n + ' %';
    target.textContent = (100 - n) + ' %';
    input.value = String(n);
    input.setAttribute('aria-valuetext', 'Initiative ' + n + ' %, cible ' + (100 - n) + ' %');
    if (persist) { try { localStorage.setItem(key, String(n)); } catch (_) {} }
    // Reposition the RPG Connect popup when the target column moves.
    window.dispatchEvent(new Event('resize'));
  }
  let initial = 55;
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null) initial = normalize(saved);
  } catch (_) {}
  setWeight(initial, false);
  input.addEventListener('input', () => setWeight(input.value));
  if (reset) reset.addEventListener('click', () => setWeight(55));
})();
