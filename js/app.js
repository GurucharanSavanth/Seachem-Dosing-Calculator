// js/app.js

/**
 * Main calculation logic. Orchestrates input gathering, validation,
 * calculation, and result display.
 * @param {boolean} [showErrorScroll=true] - Whether to scroll to errors if they occur.
 */
function doCalculations(showErrorScroll = true) {
    const userInputs = getAllInputValues(); // From uiHandlers.js
    const errorMessages = [];

    // --- Validation ---
    if (!(userInputs.volume > 0)) {
        errorMessages.push('Volume must be > 0');
    }
    if (userInputs.khPurity < 0.5 || userInputs.khPurity > 1) {
        errorMessages.push('KHCO₃ Purity must be between 0.50 and 1.00');
    }
    if (userInputs.khTarget < userInputs.khCurrent) {
        // This is more of a warning or info, as one might dose for other reasons.
        // For now, let's keep it as an informational error if it prevents calculation.
        // errorMessages.push('Target KH should generally exceed current KH for KHCO₃ booster');
    }
    // Add more specific validations for each input range if needed.
    // Example:
    // if (userInputs.khCurrent < 0 || userInputs.khCurrent > 20) errorMessages.push('Current KH out of typical range (0-20)');


    if (errorMessages.length > 0) {
        displayErrors(errorMessages, showErrorScroll); // From uiHandlers.js
        // Clear previous results if there are errors
        updateKhco3Results(0);
        updateEquilibriumResults(0, false);
        updateNeutralRegulatorResults(0);
        updateAcidBufferResults(0);
        updateGoldBufferResults(0, false);
        qs('timestamp').textContent = 'Calculation failed.';
        return;
    } else {
        displayErrors([]); // Clear any previous errors
    }

    const litres = toLitres(userInputs.volume, userInputs.unit); // From utils.js

    // --- Perform Calculations ---
    // 1. Potassium Bicarbonate (KHCO₃)
    const khDose = calculateKhco3Grams(userInputs.khCurrent, userInputs.khTarget, litres, userInputs.khPurity);
    updateKhco3Results(khDose); // From uiHandlers.js

    // 2. Seachem Equilibrium
    const deltaGh = userInputs.ghTarget - userInputs.ghCurrent;
    const equilibriumDose = deltaGh > 0 ? calculateEquilibriumGrams(deltaGh, litres) : 0;
    updateEquilibriumResults(equilibriumDose, deltaGh > 0); // From uiHandlers.js

    // 3. Seachem Neutral Regulator
    const neutralRegulatorDose = calculateNeutralRegulatorGrams(litres, userInputs.phCurrent, userInputs.phTarget, userInputs.nrKh);
    updateNeutralRegulatorResults(neutralRegulatorDose); // From uiHandlers.js

    // 4. Seachem Acid Buffer
    const acidBufferDose = calculateAcidBufferGrams(litres, userInputs.acidCurrentKh, userInputs.acidTargetKh);
    updateAcidBufferResults(acidBufferDose); // From uiHandlers.js

    // 5. Seachem Gold Buffer
    const goldBufferResult = calculateGoldBufferGrams(litres, userInputs.phGoldCurrent, userInputs.phGoldTarget);
    updateGoldBufferResults(goldBufferResult.grams, goldBufferResult.fullDose); // From uiHandlers.js

    updateTimestamp(); // From uiHandlers.js
}

/**
 * Runs basic unit tests for calculation functions.
 */
function runUnitTests() {
    console.log("Running unit tests...");
    const testLitres = 37.854; // Approx 10 US Gallons
    const precision = 0.02; // Allowed difference for float comparisons

    const near = (a, b) => Math.abs(a - b) <= precision;
    let testsPassed = true;
    let testResults = [];

    // Test KHCO3
    // calculateKhco3Grams(currentKh, targetKh, litres, purity)
    let khco3Test = calculateKhco3Grams(2.2, 4, testLitres, 0.99); // Expected: ~1.21g (Original code: 1.23)
                                                                    // My constant: (4-2.2) * 0.017848 * 37.854 / 0.99 = 1.216
    testResults.push({ name: "KHCO₃", expected: "~1.22", actual: khco3Test.toFixed(2), pass: near(khco3Test, 1.216) });


    // Test Equilibrium
    // calculateEquilibriumGrams(deltaGh, litres)
    let eqTest = calculateEquilibriumGrams(3.8, testLitres); // (6-2.2)=3.8. Expected: ~9.59g
                                                            // 3.8 * (16/(80*3)) * 37.854 = 9.588
    testResults.push({ name: "Equilibrium", expected: "9.59", actual: eqTest.toFixed(2), pass: near(eqTest, 9.588) });

    // Test Neutral Regulator
    // calculateNeutralRegulatorGrams(litres, currentPh, targetPh, currentKh)
    // Original expected: 4.73g. Inputs: L=37.854, curPH=7.5, tarPH=7.0, kh=4
    // khEffectFactor = min(4,4)/4 = 1. baseGPL = 0.0625 + (0.125-0.0625)*1 = 0.125
    // phSteps = (7.5-7.0)/0.5 = 1.
    // grams = 0.125 * 37.854 * 1 = 4.73175
    // cap1 = 0.125 * 37.854 * 1 = 4.73175
    // cap2 = 0.125 * 37.854 * 2 = 9.4635
    let nrTest = calculateNeutralRegulatorGrams(testLitres, 7.5, 7.0, 4);
    testResults.push({ name: "Neutral Regulator", expected: "4.73", actual: nrTest.toFixed(2), pass: near(nrTest, 4.73175) });

    // Test Acid Buffer
    // calculateAcidBufferGrams(litres, currentKh, targetKh)
    // Original expected: 3.67g. Inputs: L=37.854, curKH=4, tarKH=1.67
    // deltaKH = 4 - 1.67 = 2.33
    // grams = 2.33 * (1/24) * 37.854 = 3.673
    let acidTest = calculateAcidBufferGrams(testLitres, 4, 1.67);
    testResults.push({ name: "Acid Buffer", expected: "3.67", actual: acidTest.toFixed(2), pass: near(acidTest, 3.673) });

    // Test Gold Buffer
    // calculateGoldBufferGrams(litres, currentPh, targetPh)
    // Example: L=40, currentPh=7.0, targetPh=7.5 (delta=0.5, full dose)
    // grams = (6/40) * 1 * 40 = 6g
    let goldTest = calculateGoldBufferGrams(40, 7.0, 7.5);
    testResults.push({ name: "Gold Buffer (Full)", expected: "6.00", actual: goldTest.grams.toFixed(2), pass: near(goldTest.grams, 6.00) && goldTest.fullDose });

    // Example: L=40, currentPh=7.0, targetPh=7.1 (delta=0.1, half dose)
    // grams = (6/40) * 0.5 * 40 = 3g
    let goldTestHalf = calculateGoldBufferGrams(40, 7.0, 7.1);
    testResults.push({ name: "Gold Buffer (Half)", expected: "3.00", actual: goldTestHalf.grams.toFixed(2), pass: near(goldTestHalf.grams, 3.00) && !goldTestHalf.fullDose });

    console.log("Unit Test Results:");
    testResults.forEach(result => {
        console.log(`${result.name}: Expected ${result.expected}, Got ${result.actual} - ${result.pass ? 'PASS' : 'FAIL'}`);
        if (!result.pass) testsPassed = false;
    });

    console.log(`All unit tests ${testsPassed ? 'PASSED' : 'FAILED (see details above)'}.`);
    if (!testsPassed) {
        // Optionally display a persistent error/warning on the page for failed tests
        // displayErrors(["Unit tests failed. Check console for details."], false);
    }
}


// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initUI(doCalculations); // Initialize UI elements and event listeners, passing doCalculations as callback
    doCalculations(false); // Initial calculation on page load, don't scroll for errors
    runUnitTests();        // Run unit tests after everything is set up
});
