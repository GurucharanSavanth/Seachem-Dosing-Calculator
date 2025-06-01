// js/utils.js

// --- CONSTANTS ---
const US_GAL_TO_L = 3.785411784;
const UK_GAL_TO_L = 4.54609;
const GPL_MIN_NR = 0.0625; // g/L for Neutral Regulator (min KH effect)
const GPL_MAX_NR = 0.125;  // g/L for Neutral Regulator (max KH effect, up to 4dKH)
const COEFF_EQUILIBRIUM = 16 / (80 * 3); // (16g / 80L raises 3 dGH) -> g/L/dGH
const COEFF_ACID = 1 / 24; // 1g per 24L reduces KH by 1 meq/L (2.8 dKH). So, (1g / 24L) / 2.8 dKH. Simplified: 1g lowers 1dKH in ~67L. Seachem says 1/4 teaspoon (1.5g) per 40L lowers KH by ~0.8dKH. This is complex. The original code used 1/24. Let's stick to that for consistency.
const COEFF_GOLD_FULL = 6 / 40; // 6g per 40L for full pH adjustment
const THEME_KEY = 'theme';
const LAST_UNIT_KEY = 'last_unit';

// --- HELPER FUNCTIONS ---

/**
 * Safely parses a string to a float. Returns 0 if NaN.
 * @param {string|number} x - The value to parse.
 * @returns {number} The parsed float or 0.
 */
function parseFloatSafe(x) {
    const v = parseFloat(x);
    return isNaN(v) ? 0 : v;
}

/**
 * Converts volume to litres based on the selected unit.
 * @param {number} volume - The volume value.
 * @param {string} unit - The unit ('L', 'US', 'UK').
 * @returns {number} Volume in litres.
 */
function toLitres(volume, unit) {
    if (unit === 'US') return volume * US_GAL_TO_L;
    if (unit === 'UK') return volume * UK_GAL_TO_L;
    return volume; // Assuming 'L' or direct litres
}

/**
 * Formats a number to two decimal places. Returns '0.00' for invalid inputs.
 * @param {number} grams - The number to format.
 * @returns {string} Formatted number string.
 */
function fmt(grams) {
    if (grams < 0 || !isFinite(grams)) return '0.00';
    return grams.toFixed(2);
}

/**
 * Returns half of a given number, formatted to two decimal places.
 * @param {number} grams - The number to halve.
 * @returns {string} Formatted half number string.
 */
function half(grams) {
    return fmt(grams / 2);
}

/**
 * Generates text for splitting a dose.
 * @param {number} grams - The total grams to dose.
 * @returns {string} Text suggesting how to split the dose, or if to dose at once.
 */
function splitText(grams) {
    if (grams <= 0 || !isFinite(grams)) return '';
    if (grams < 0.3) return 'Dose in one go'; // Small doses don't need splitting
    return `${half(grams)} g now + ${half(grams)} g in 12–24 h`;
}

/**
 * Shortcut for document.getElementById.
 * @param {string} id - The ID of the element.
 * @returns {HTMLElement|null} The DOM element or null if not found.
 */
function qs(id) {
    return document.getElementById(id);
}

/**
 * Gets the current preferred theme (dark/light).
 * @returns {boolean} True if dark mode is preferred.
 */
function prefersDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Applies the theme to the body.
 * @param {string} theme - 'dark' or 'light'.
 */
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
        qs('themeToggle').textContent = '☀️'; // Sun icon for light mode switch
    } else {
        document.body.classList.remove('dark');
        qs('themeToggle').textContent = '🌓'; // Moon icon for dark mode switch
    }
}
