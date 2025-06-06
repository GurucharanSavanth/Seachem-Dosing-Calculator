// js/uiHandlers.js

// --- DOM Element References (initialized in app.js or initUI) ---
let volumeEl, unitEl, errorsEl, timestampEl, themeToggleEl,
    khCurrentEl, khTargetEl, khPurityEl, khco3ResultEl, khSplitEl, khWarnEl,
    ghCurrentEl, ghTargetEl, equilibriumResultEl, eqSplitEl,
    phCurrentEl, phTargetEl, nrKhEl, neutralResultEl, nrSplitEl,
    acidCurrentKhEl, acidTargetKhEl, acidResultEl, acidSplitEl,
    phGoldCurrentEl, phGoldTargetEl, goldResultEl, goldSplitEl,
    btnCalcEl, btnResetEl, btnCsvEl;

// --- Input Data Object ---
const inputs = {};

/**
 * Initializes DOM element references.
 */
function initDOMReferences() {
    volumeEl = qs('volume');
    unitEl = qs('unit');
    errorsEl = qs('errors');
    timestampEl = qs('timestamp');
    themeToggleEl = qs('themeToggle');

    khCurrentEl = qs('khCurrent');
    khTargetEl = qs('khTarget');
    khPurityEl = qs('khPurity');
    khco3ResultEl = qs('khco3Result');
    khSplitEl = qs('khSplit');
    khWarnEl = qs('khWarn');

    ghCurrentEl = qs('ghCurrent');
    ghTargetEl = qs('ghTarget');
    equilibriumResultEl = qs('equilibriumResult');
    eqSplitEl = qs('eqSplit');

    phCurrentEl = qs('phCurrent');
    phTargetEl = qs('phTarget');
    nrKhEl = qs('nrKh');
    neutralResultEl = qs('neutralResult');
    nrSplitEl = qs('nrSplit');

    acidCurrentKhEl = qs('acidCurrentKh');
    acidTargetKhEl = qs('acidTargetKh');
    acidResultEl = qs('acidResult');
    acidSplitEl = qs('acidSplit');

    phGoldCurrentEl = qs('phGoldCurrent');
    phGoldTargetEl = qs('phGoldTarget');
    goldResultEl = qs('goldResult');
    goldSplitEl = qs('goldSplit');

    btnCalcEl = qs('btnCalc');
    btnResetEl = qs('btnReset');
    btnCsvEl = qs('btnCsv');
}

/**
 * Populates the unit selection dropdown and sets the last used unit.
 */
function setupUnitSelection() {
    const units = [['L', 'Litres (L)'], ['US', 'US Gallons'], ['UK', 'UK Gallons']];
    units.forEach(([value, text]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        unitEl.appendChild(option);
    });
    const lastUnit = localStorage.getItem(LAST_UNIT_KEY);
    if (lastUnit) {
        unitEl.value = lastUnit;
    }
    unitEl.addEventListener('change', () => {
        localStorage.setItem(LAST_UNIT_KEY, unitEl.value);
    });
}

/**
 * Sets up the theme toggle functionality.
 */
function setupThemeToggle() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const currentTheme = storedTheme ? storedTheme : (prefersDarkMode() ? 'dark' : 'light');
    applyTheme(currentTheme);

    themeToggleEl.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    });
}

/**
 * Collects all input values from the DOM.
 * @returns {object} An object containing all parsed input values.
 */
function getAllInputValues() {
    inputs.volume = parseFloatSafe(volumeEl.value);
    inputs.unit = unitEl.value;

    inputs.khCurrent = parseFloatSafe(khCurrentEl.value);
    inputs.khTarget = parseFloatSafe(khTargetEl.value);
    inputs.khPurity = parseFloatSafe(khPurityEl.value);

    inputs.ghCurrent = parseFloatSafe(ghCurrentEl.value);
    inputs.ghTarget = parseFloatSafe(ghTargetEl.value);

    inputs.phCurrent = parseFloatSafe(phCurrentEl.value);
    inputs.phTarget = parseFloatSafe(phTargetEl.value);
    inputs.nrKh = parseFloatSafe(nrKhEl.value);

    inputs.acidCurrentKh = parseFloatSafe(acidCurrentKhEl.value);
    inputs.acidTargetKh = parseFloatSafe(acidTargetKhEl.value);

    inputs.phGoldCurrent = parseFloatSafe(phGoldCurrentEl.value);
    inputs.phGoldTarget = parseFloatSafe(phGoldTargetEl.value);

    return inputs;
}

/**
 * Displays validation errors or clears them.
 * @param {string[]} errorMessages - Array of error messages.
 * @param {boolean} [scrollTo=true] - Whether to scroll to the error message.
 */
function displayErrors(errorMessages, scrollTo = true) {
    if (errorMessages.length > 0) {
        errorsEl.textContent = errorMessages.join(' • ');
        if (scrollTo) {
            setTimeout(() => {
                errorsEl.focus();
                errorsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 120);
        }
    } else {
        errorsEl.textContent = '';
    }
}

/**
 * Updates the UI with KHCO₃ calculation results.
 * @param {number} dose - Calculated dose in grams.
 */
function updateKhco3Results(dose) {
    const doseStr = fmt(dose);
    khco3ResultEl.textContent = `${doseStr} g KHCO₃`;
    khco3ResultEl.dataset.dose = doseStr;
    khSplitEl.textContent = splitText(dose);
    khWarnEl.textContent = ''; // Clear previous warnings if any
}

/**
 * Updates the UI with Equilibrium calculation results.
 * @param {number} dose - Calculated dose in grams.
 * @param {boolean} isNeeded - Whether Equilibrium is needed.
 */
function updateEquilibriumResults(dose, isNeeded) {
    const doseStr = fmt(dose);
    equilibriumResultEl.textContent = isNeeded ? `${doseStr} g Equilibrium` : 'No Equilibrium required';
    equilibriumResultEl.dataset.dose = isNeeded ? doseStr : '0';
    eqSplitEl.textContent = isNeeded ? splitText(dose) : '';
}

/**
 * Updates the UI with Neutral Regulator calculation results.
 * @param {number} dose - Calculated dose in grams.
 */
function updateNeutralRegulatorResults(dose) {
    const doseStr = fmt(dose);
    neutralResultEl.textContent = dose > 0 ? `${doseStr} g Neutral Regulator` : 'No Neutral Regulator required';
    neutralResultEl.dataset.dose = dose > 0 ? doseStr : '0';
    nrSplitEl.textContent = dose > 0 ? splitText(dose) : '';
}

/**
 * Updates the UI with Acid Buffer calculation results.
 * @param {number} dose - Calculated dose in grams.
 */
function updateAcidBufferResults(dose) {
    const doseStr = fmt(dose);
    acidResultEl.textContent = dose > 0 ? `${doseStr} g Acid Buffer` : 'No Acid Buffer required';
    acidResultEl.dataset.dose = dose > 0 ? doseStr : '0';
    acidSplitEl.textContent = dose > 0 ? splitText(dose) : '';
}

/**
 * Updates the UI with Gold Buffer calculation results.
 * @param {number} dose - Calculated dose in grams.
 * @param {boolean} fullDose - Whether it's a full dose.
 */
function updateGoldBufferResults(dose, fullDose) {
    const doseStr = fmt(dose);
    goldResultEl.textContent = dose > 0 ? `${doseStr} g Gold Buffer (${fullDose ? 'full' : 'half'} dose)` : 'No Gold Buffer required';
    goldResultEl.dataset.dose = dose > 0 ? doseStr : '0';
    goldSplitEl.textContent = dose > 0 ? splitText(dose) : '';
}

/**
 * Updates the timestamp display.
 */
function updateTimestamp() {
    const now = new Date();
    const ts = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    timestampEl.textContent = `Last calculated at ${ts}`;
}

/**
 * Resets all input fields to their default values and recalculates.
 * @param {function} calculateCallback - The main calculation function to call after reset.
 */
function handleReset(calculateCallback) {
    document.querySelectorAll('input[type=number]').forEach(input => {
        input.value = input.defaultValue;
    });
    unitEl.value = 'L'; // Default unit
    localStorage.setItem(LAST_UNIT_KEY, 'L');
    if (typeof calculateCallback === 'function') {
        calculateCallback(true); // Recalculate and show errors if any
    }
}

/**
 * Generates and triggers download of a CSV file with the results.
 */
function handleCsvDownload() {
    const rows = [
        ['Parameter', 'Dose (g)', 'Split Dose Info'],
        ['KHCO₃', khco3ResultEl.dataset.dose || '0', khSplitEl.textContent],
        ['Equilibrium', equilibriumResultEl.dataset.dose || '0', eqSplitEl.textContent],
        ['Neutral Regulator', neutralResultEl.dataset.dose || '0', nrSplitEl.textContent],
        ['Acid Buffer', acidResultEl.dataset.dose || '0', acidSplitEl.textContent],
        ['Gold Buffer', goldResultEl.dataset.dose || '0', goldSplitEl.textContent],
    ];
    const csvContent = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dosing-results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Sets up clipboard copy functionality for result elements.
 */
function setupCopyButtons() {
    const copyPairs = [
        ['copyKhco3', 'khco3Result'],
        ['copyEquil', 'equilibriumResult'],
        ['copyNR', 'neutralResult'],
        ['copyAcid', 'acidResult'],
        ['copyGold', 'goldResult'],
    ];
    copyPairs.forEach(([btnId, resultId]) => {
        const button = qs(btnId);
        const resultEl = qs(resultId);
        if (button && resultEl) {
            button.addEventListener('click', () => {
                const valueToCopy = resultEl.dataset.dose || '0';

                if (navigator.clipboard) {
                    navigator.clipboard.writeText(valueToCopy)
                        .then(() => {
                            button.textContent = '✔️';
                            setTimeout(() => { button.textContent = '📋'; }, 900);
                        })
                        .catch(err => console.error('Failed to copy: ', err));
                } else {
                    // Fallback for older browsers
                    const textArea = document.createElement("textarea");
                    textArea.value = valueToCopy;
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        button.textContent = '✔️';
                        setTimeout(() => { button.textContent = '📋'; }, 900);
                    } catch (err) {
                        console.error('Fallback copy failed: ', err);
                    }
                    document.body.removeChild(textArea);
                }
            });
        }
    });
}


/**
 * Initializes all UI event listeners.
 * @param {function} calculateCallback - The main calculation function.
 */
function initEventListeners(calculateCallback) {
    let debounceTimeout;
    document.body.addEventListener('input', (event) => {
        if (['number', 'select-one'].includes(event.target.type)) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => calculateCallback(false), 500); // No error scroll on auto-calc
        }
    });

    btnCalcEl.addEventListener('click', () => calculateCallback(true));
    btnResetEl.addEventListener('click', () => handleReset(calculateCallback));
    btnCsvEl.addEventListener('click', handleCsvDownload);

    setupCopyButtons();
}

/**
 * Initializes all UI components.
 * @param {function} calculateCallback - The main calculation function for event listeners.
 */
function initUI(calculateCallback) {
    initDOMReferences();
    setupUnitSelection();
    setupThemeToggle();
    initEventListeners(calculateCallback); // Pass the main calc function
}
