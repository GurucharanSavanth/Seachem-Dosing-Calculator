// js/utils.js v4.1 (Patched)

// --- CONSTANTS ---
const US_GAL_TO_L = 3.78541;
const UK_GAL_TO_L = 4.54609;

// Dosing coefficients
const COEFF_EQUILIBRIUM = 16 / (80 * 3); // Verified as correct.
const GPL_MIN_NR = 0.0625; // Verified as correct.
const GPL_MAX_NR = 0.125; // Verified as correct.

// FIX: Corrected the Acid Buffer coefficient based on Seachem's official data (1.5g per 40L for 2.8 dKH drop).
// The original value (1/24) was causing a ~300% overdose.
const COEFF_ACID = 1.5 / (40 * 2.8); // Approximately 0.01339

const COEFF_GOLD_FULL = 6 / 40; // Verified as correct.

// New constants for emergency dosing
const PPM_TO_DH = 17.86;
const PRIME_ML_PER_L = 5 / 200; // 5mL per 200L -> 0.025 mL/L
const STABILITY_ML_PER_L = 5 / 40; // 5mL per 40L -> 0.125 mL/L

// Local Storage Keys
const THEME_KEY = 'theme_v4';
const LAST_UNIT_KEY = 'last_unit_v4';
const LANG_KEY = 'lang_v4';

// --- HELPER FUNCTIONS ---

/**
 * Shortcut for document.getElementById.
 * @param {string} id The ID of the element.
 * @returns {HTMLElement} The found element.
 */
function qs(id) {
    return document.getElementById(id);
}

/**
 * Safely parses a string to a float, returning 0 if invalid.
 * @param {string} x The string to parse.
 * @returns {number} The parsed float or 0.
 */
function parseFloatSafe(x) {
    const v = parseFloat(x);
    return isNaN(v) ? 0 : v;
}

/**
 * Converts volume to litres based on the selected unit.
 * @param {number} volume The volume value.
 * @param {string} unit The unit ('L', 'US', or 'UK').
 * @returns {number} The volume in litres.
 */
function toLitres(volume, unit) {
    if (unit === 'US') return volume * US_GAL_TO_L;
    if (unit === 'UK') return volume * UK_GAL_TO_L;
    return volume;
}

/**
 * Converts ppm to degrees of hardness (dGH or dKH).
 * @param {number} ppm The value in parts per million.
 * @returns {number} The value in degrees of hardness.
 */
function ppmToDh(ppm) {
    if (ppm <= 0 || !isFinite(ppm)) return 0;
    return ppm / PPM_TO_DH;
}

/**
 * Formats a number to a specific number of decimal places.
 * @param {number} num The number to format.
 * @param {number} [places=2] The number of decimal places.
 * @returns {string} The formatted number as a string.
 */
function fmt(num, places = 2) {
    if (num < 0 || !isFinite(num)) return (0).toFixed(places);
    return num.toFixed(places);
}

/**
 * Generates text for splitting a dose into two parts for safety.
 * @param {number} grams The total dose in grams.
 * @param {string} [lang='en'] The current language for translation.
 * @returns {string} The instructional text for splitting the dose.
 */
function splitText(grams, lang = 'en') {
    if (grams <= 0.01 || !isFinite(grams)) return '';
    const halfDose = fmt(grams / 2);
    if (lang === 'kn') {
        if (grams < 0.3) return 'ಒಂದೇ ಬಾರಿಗೆ ಡೋಸ್ ಮಾಡಿ';
        return `${halfDose} ಗ್ರಾಂ ಈಗ + ${halfDose} ಗ್ರಾಂ ೧೨-೨೪ ಗಂಟೆಗಳಲ್ಲಿ`;
    }
    if (grams < 0.3) return 'Dose in one go';
    return `${halfDose} g now + ${halfDose} g in 12–24 h`;
}

/**
 * Checks if the user's system prefers dark mode.
 * @returns {boolean} True if dark mode is preferred.
 */
function prefersDarkMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Applies the selected theme ('light' or 'dark') to the body.
 * @param {string} theme The theme to apply.
 */
function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    qs('themeToggle').textContent = theme === 'dark' ? '☀️' : '🌓';
}
