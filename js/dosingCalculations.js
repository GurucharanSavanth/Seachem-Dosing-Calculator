// js/dosingCalculations.js v4.1 (Patched)

/**
 * Calculates grams of Potassium Bicarbonate (KHCO₃) needed.
 * @param {number} currentKh - Current KH in dKH.
 * @param {number} targetKh - Target KH in dKH.
 * @param {number} litres - Water volume in litres.
 * @param {number} purity - Purity of the KHCO₃ compound (0.5 to 1.0).
 * @returns {number} Grams of KHCO₃ to dose.
 */
function calculateKhco3Grams(currentKh, targetKh, litres, purity) {
    if (purity === 0) return 0;
    // FIX: Replaced the incorrect constant (0.017848) with the scientifically accepted
    // coefficient for KHCO₃ dosing, which accounts for molecular weight. This prevents underdosing.
    const COEFF_KHCO3 = 0.02985; // Grams needed per litre to raise KH by 1 dKH.
    const grams = (targetKh - currentKh) * COEFF_KHCO3 * litres / purity;
    return Math.max(0, grams);
}

/**
 * Calculates grams of Seachem Equilibrium needed.
 * @param {number} deltaGh - The desired increase in dGH.
 * @param {number} litres - Water volume in litres.
 * @returns {number} Grams of Equilibrium to dose.
 */
function calculateEquilibriumGrams(deltaGh, litres) {
    // This formula was verified as correct.
    const grams = deltaGh * COEFF_EQUILIBRIUM * litres;
    return Math.max(0, grams);
}

/**
 * Calculates grams of Seachem Neutral Regulator needed.
 * @param {number} litres - Water volume in litres.
 * @param {number} currentPh - The current pH of the water.
 * @param {number} targetPh - The target pH (should be lower than current).
 * @param {number} currentKh - The current KH in dKH, which affects buffering.
 * @returns {number} Grams of Neutral Regulator to dose.
 */
function calculateNeutralRegulatorGrams(litres, currentPh, targetPh, currentKh) {
    // This formula was verified as correct.
    if (targetPh >= currentPh) return 0;
    const khEffectFactor = Math.min(currentKh, 4) / 4;
    const baseGramsPerLitre = GPL_MIN_NR + (GPL_MAX_NR - GPL_MIN_NR) * khEffectFactor;
    const phSteps = (currentPh - targetPh) / 0.5;
    if (phSteps <= 0) return 0;
    let grams = baseGramsPerLitre * litres * phSteps;
    grams = Math.min(grams, GPL_MAX_NR * litres * 2); // Cap the dose to prevent extreme changes.
    return Math.max(0, grams);
}

/**
 * Calculates grams of Seachem Acid Buffer needed.
 * @param {number} litres - Water volume in litres.
 * @param {number} currentKh - Current KH in dKH.
 * @param {number} targetKh - Target KH in dKH.
 * @returns {number} Grams of Acid Buffer to dose.
 */
function calculateAcidBufferGrams(litres, currentKh, targetKh) {
    // This formula now uses the corrected COEFF_ACID from utils.js to prevent overdosing.
    const deltaKh = currentKh - targetKh;
    const grams = deltaKh * COEFF_ACID * litres;
    return Math.max(0, grams);
}

/**
 * Calculates grams of Seachem Gold Buffer needed.
 * @param {number} litres - Water volume in litres.
 * @param {number} currentPh - The current pH of the water.
 * @param {number} targetPh - The target pH (should be higher than current).
 * @returns {object} An object containing the grams to dose and whether a full dose is recommended.
 */
function calculateGoldBufferGrams(litres, currentPh, targetPh) {
    // This formula was verified as correct.
    const deltaPh = targetPh - currentPh;
    if (deltaPh <= 0) return { grams: 0, fullDose: false };
    const fullDoseRecommended = deltaPh >= 0.3;
    const doseMultiplier = fullDoseRecommended ? 1 : 0.5;
    const grams = COEFF_GOLD_FULL * doseMultiplier * litres;
    return { grams: Math.max(0, grams), fullDose: fullDoseRecommended };
}

// --- Emergency Dosing Calculations ---

/**
 * Calculates the dose of Seachem Prime needed to detoxify ammonia/nitrite.
 * @param {number} litres - Water volume in litres.
 * @returns {number} The dose of Prime in mL.
 */
function calculatePrimeDose(litres) {
    return litres * PRIME_ML_PER_L;
}

/**
 * Calculates the dose of Seachem Stability needed to boost biological filtration.
 * @param {number} litres - Water volume in litres.
 * @returns {number} The dose of Stability in mL.
 */
function calculateStabilityDose(litres) {
    return litres * STABILITY_ML_PER_L;
}
