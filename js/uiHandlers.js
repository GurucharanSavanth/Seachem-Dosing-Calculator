// js/uiHandlers.js v5.0 (UI Revamp)

let allElements = {};
let currentLang = 'en';

/** Initializes all DOM element references into a central object. */
function initDOMReferences() {
    // This list is verified to be compatible with the revamped index.html
    const ids = [
        'themeToggle', 'langToggle', 'timestamp', 'errors', 'changelogBtn', 'changelogModal', 'closeChangelog',
        'recommendations', 'paramAmmonia', 'statusAmmonia', 'paramNitrate', 'statusNitrate',
        'paramNitrite', 'statusNitrite', 'paramGh', 'statusGh', 'paramKh', 'statusKh',
        'volume', 'unit', 'khCurrent', 'khTarget', 'khPurity', 'khco3Result', 'khSplit', 'copyKhco3',
        'ghCurrent', 'ghTarget', 'equilibriumResult', 'eqSplit', 'copyEquil',
        'phCurrent', 'phTarget', 'nrKh', 'neutralResult', 'nrSplit', 'copyNR',
        'acidCurrentKh', 'acidTargetKh', 'acidResult', 'acidSplit', 'copyAcid',
        'phGoldCurrent', 'phGoldTarget', 'goldResult', 'goldSplit', 'copyGold',
        'btnCalc', 'btnReset', 'btnCsv'
    ];
    ids.forEach(id => { allElements[id] = qs(id); });
}

/** Populates the unit selection dropdown and sets the last used unit. */
function setupUnitSelection() {
    const units = { L: "Litres (L)", US: "US Gallons", UK: "UK Gallons" };
    Object.entries(units).forEach(([value, text]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        allElements.unit.appendChild(option);
    });
    allElements.unit.value = localStorage.getItem(LAST_UNIT_KEY) || 'UK';
    allElements.unit.addEventListener('change', () => localStorage.setItem(LAST_UNIT_KEY, allElements.unit.value));
}

/** Sets up the theme toggle functionality. */
function setupThemeToggle() {
    const storedTheme = localStorage.getItem(THEME_KEY) || (prefersDarkMode() ? 'dark' : 'light');
    applyTheme(storedTheme);
    allElements.themeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
    });
}

/** Sets up the language toggle functionality. */
function setupLanguageToggle() {
    currentLang = localStorage.getItem(LANG_KEY) || 'en';
    translatePage();
    allElements.langToggle.addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'kn' : 'en';
        translatePage();
        localStorage.setItem(LANG_KEY, currentLang);
    });
}

/** Translates the entire page using data-lang-key attributes. */
function translatePage() {
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.dataset.langKey;
        const translation = translations[currentLang][key];

        if (translation) {
            // SECURITY REFACTOR from original code is preserved.
            // It's safer because we explicitly control which keys can contain HTML.
            const isHtmlContent = key.startsWith('reco_') || key === 'changelog_list';
            if (isHtmlContent) {
                 el.innerHTML = translation; // Use innerHTML only for specific, trusted keys.
            } else {
                el.textContent = translation; // Default to the safer textContent.
            }
        }
    });
    // Manually trigger a recalculation to update dynamic result text.
    handleParameterStatusUpdate(); // This needs to run before doDosingCalculations
    doDosingCalculations();
}


/** Collects all input values from the DOM. */
function getAllInputValues() {
    const inputs = {};
    const numericKeys = [
        'paramAmmonia', 'paramNitrate', 'paramNitrite', 'paramGh', 'paramKh', 'volume',
        'khCurrent', 'khTarget', 'khPurity', 'ghCurrent', 'ghTarget',
        'phCurrent', 'phTarget', 'nrKh', 'acidCurrentKh', 'acidTargetKh',
        'phGoldCurrent', 'phGoldTarget'
    ];
    for (const key in allElements) {
        if (allElements[key] instanceof HTMLInputElement || allElements[key] instanceof HTMLSelectElement) {
            inputs[key] = numericKeys.includes(key) ? parseFloatSafe(allElements[key].value) : allElements[key].value;
        }
    }
    return inputs;
}

/** Displays validation errors or clears them. */
function displayErrors(errorMessages) {
    allElements.errors.innerHTML = errorMessages.length > 0 ? errorMessages.join(' &bull; ') : '';
    if (errorMessages.length > 0) allElements.errors.focus();
}

/** Updates UI based on parameter status checks. */
function handleParameterStatusUpdate() {
    const inputs = getAllInputValues();
    const litres = toLitres(inputs.volume, inputs.unit);
    let recommendations = [];
    const t = (key, replacements = {}) => {
        let text = translations[currentLang][key] || key;
        for(const r in replacements) {
            text = text.replace(`{${r}}`, replacements[r]);
        }
        return text;
    };
    
    const updateStatus = (element, className, textKey) => {
        element.className = 'status-badge ' + className;
        element.textContent = t(textKey);
    };

    // Ammonia
    if (inputs.paramAmmonia > 0) {
        updateStatus(allElements.statusAmmonia, 'warn', 'status_danger');
        recommendations.push(t('reco_ammonia_detected'));
        if (litres > 0) {
            const primeDose = calculatePrimeDose(litres);
            recommendations.push(t('reco_prime_dose', {primeDose: fmt(primeDose)}));
        } else {
            recommendations.push(t('reco_volume_needed'));
        }
    } else {
        updateStatus(allElements.statusAmmonia, 'good', 'status_good');
    }

    // Nitrite
    if (inputs.paramNitrite > 0) {
        updateStatus(allElements.statusNitrite, 'warn', 'status_danger');
        recommendations.push(t('reco_nitrite_detected'));
        if (litres > 0) {
            const stabilityDose = calculateStabilityDose(litres);
            recommendations.push(t('reco_stability_dose', {stabilityDose: fmt(stabilityDose)}));
        }
    } else {
        updateStatus(allElements.statusNitrite, 'good', 'status_good');
    }

    // Nitrate
    if (inputs.paramNitrate > 50) {
        updateStatus(allElements.statusNitrate, 'warn', 'status_high');
        recommendations.push(t('reco_nitrate_high'));
    } else {
        updateStatus(allElements.statusNitrate, 'good', 'status_good');
    }
    
    // GH
    const dGH = ppmToDh(inputs.paramGh);
    allElements.statusGh.className = 'status-badge'; // It's just info
    allElements.statusGh.textContent = `${fmt(dGH, 1)} °dGH`;
    allElements.ghCurrent.value = fmt(dGH, 2);
    if (dGH < 3 && dGH > 0) { // Using dGH for recommendation
        recommendations.push(t('reco_gh_low'));
    }

    // KH
    const dKH = ppmToDh(inputs.paramKh);
    allElements.statusKh.className = 'status-badge'; // It's just info
    allElements.statusKh.textContent = `${fmt(dKH, 1)} °dKH`;
    [allElements.khCurrent, allElements.nrKh, allElements.acidCurrentKh].forEach(el => el.value = fmt(dKH, 2));
    if (dKH < 3 && dKH > 0) { // Using dKH for recommendation
        recommendations.push(t('reco_kh_low'));
    }

    // Build recommendation list using DOM methods
    allElements.recommendations.innerHTML = ''; // Clear previous
    if (recommendations.length > 0) {
        recommendations.forEach(rec => {
            const p = document.createElement('p');
            p.innerHTML = rec; // Using innerHTML as translations contain <strong>
            allElements.recommendations.appendChild(p);
        });
    } else {
        const p = document.createElement('p');
        p.innerHTML = t('reco_ok');
        allElements.recommendations.appendChild(p);
    }
}

/** Updates all result fields in the UI. */
function updateAllResults(results) {
    const t = (key) => translations[currentLang][key] || key;
    allElements.khco3Result.textContent = `${fmt(results.khDose)} g KHCO₃`;
    allElements.khco3Result.dataset.dose = fmt(results.khDose, 4); // more precision for copy
    allElements.khSplit.textContent = splitText(results.khDose, currentLang);
    
    allElements.equilibriumResult.textContent = results.equilibriumDose > 0 ? `${fmt(results.equilibriumDose)} g Equilibrium` : t('no_dose_needed');
    allElements.equilibriumResult.dataset.dose = fmt(results.equilibriumDose, 4);
    allElements.eqSplit.textContent = splitText(results.equilibriumDose, currentLang);
    
    allElements.neutralResult.textContent = results.neutralRegulatorDose > 0 ? `${fmt(results.neutralRegulatorDose)} g Neutral Reg.` : t('no_dose_needed');
    allElements.neutralResult.dataset.dose = fmt(results.neutralRegulatorDose, 4);
    allElements.nrSplit.textContent = splitText(results.neutralRegulatorDose, currentLang);
    
    allElements.acidResult.textContent = results.acidBufferDose > 0 ? `${fmt(results.acidBufferDose)} g Acid Buffer` : t('no_dose_needed');
    allElements.acidResult.dataset.dose = fmt(results.acidBufferDose, 4);
    allElements.acidSplit.textContent = splitText(results.acidBufferDose, currentLang);
    
    const goldText = results.goldBufferResult.grams > 0 ? `${fmt(results.goldBufferResult.grams)} g Gold Buffer (${results.goldBufferResult.fullDose ? 'full' : 'half'} dose)` : t('no_dose_needed');
    allElements.goldResult.textContent = goldText;
    allElements.goldResult.dataset.dose = fmt(results.goldBufferResult.grams, 4);
    allElements.goldSplit.textContent = splitText(results.goldBufferResult.grams, currentLang);
    updateTimestamp();
}

/** Updates the timestamp display. */
function updateTimestamp() {
    const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    allElements.timestamp.textContent = `Last calc: ${ts}`;
}

/** Resets all inputs to default and recalculates. */
function handleReset(callbacks) {
    document.querySelectorAll('input[type=number]').forEach(input => { input.value = input.defaultValue || 0; });
    document.querySelectorAll('input.param-input').forEach(input => { input.value = input.defaultValue || 0; });
    allElements.volume.value = 10;
    allElements.khPurity.value = 0.99;
    allElements.unit.value = 'L';
    localStorage.setItem(LAST_UNIT_KEY, 'UK');
    callbacks.forEach(cb => cb());
}

/** Generates and downloads a CSV of the results. */
function handleCsvDownload() {
    const rows = [
        ['Parameter', 'Dose (g)'],
        ['KHCO3', allElements.khco3Result.dataset.dose || '0'],
        ['Equilibrium', allElements.equilibriumResult.dataset.dose || '0'],
        ['Neutral Regulator', allElements.neutralResult.dataset.dose || '0'],
        ['Acid Buffer', allElements.acidResult.dataset.dose || '0'],
        ['Gold Buffer', allElements.goldResult.dataset.dose || '0'],
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(r => r.join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `aquarium-dosing-results-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/** Sets up clipboard copy functionality. */
function setupCopyButtons() {
    const copyMap = { copyKhco3: 'khco3Result', copyEquil: 'equilibriumResult', copyNR: 'neutralResult', copyAcid: 'acidResult', copyGold: 'goldResult' };
    for (const btnId in copyMap) {
        const button = allElements[btnId];
        const resultEl = allElements[copyMap[btnId]];
        if (button && resultEl) {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const textToCopy = resultEl.dataset.dose || '0';
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const icon = button.querySelector('span');
                    if (icon) {
                        icon.textContent = '✔️';
                        setTimeout(() => { icon.textContent = '📋'; }, 1200);
                    }
                });
            });
        }
    }
}

/** Sets up modal functionality. */
function setupModal() {
    allElements.changelogBtn.addEventListener('click', () => allElements.changelogModal.style.display = 'flex');
    allElements.closeChangelog.addEventListener('click', () => allElements.changelogModal.style.display = 'none');
    allElements.changelogModal.addEventListener('click', (e) => {
        if (e.target === allElements.changelogModal) allElements.changelogModal.style.display = 'none';
    });
}

/** Initializes all UI event listeners. */
function initEventListeners(callbacks) {
    let debounceTimeout;
    document.body.addEventListener('input', (event) => {
        if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => { callbacks.forEach(cb => cb()); }, 350);
        }
    });
    allElements.btnCalc.addEventListener('click', () => callbacks.forEach(cb => cb()));
    allElements.btnReset.addEventListener('click', () => handleReset(callbacks));
    allElements.btnCsv.addEventListener('click', handleCsvDownload);
    setupCopyButtons();
    setupModal();
}

/** Main UI initialization function. */
function initUI(callbacks) {
    initDOMReferences();
    setupUnitSelection();
    setupThemeToggle();
    setupLanguageToggle();
    initEventListeners(callbacks);
}
