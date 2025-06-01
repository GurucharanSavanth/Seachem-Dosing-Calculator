// js/dosingCalculations.js

/**
 * Calculates grams of Potassium Bicarbonate (KHCO₃) needed.
 * @param {number} currentKh - Current KH in °dKH.
 * @param {number} targetKh - Target KH in °dKH.
 * @param {number} litres - Water volume in litres.
 * @param {number} purity - Purity of KHCO₃ (e.g., 0.99 for 99%).
 * @returns {number} Grams of KHCO₃ required.
 */
function calculateKhco3Grams(currentKh, targetKh, litres, purity) {
    if (purity === 0) return 0; // Avoid division by zero
    // 1 dKH = 17.848 ppm CaCO3 equivalent
    // KHCO3 molecular weight = 100.115 g/mol
    // CaCO3 molecular weight = 100.0869 g/mol
    // Factor for KHCO3 to raise KH by 1 dKH in 1L:
    // (17.848 mg CaCO3 / L) * (100.115 g KHCO3 / 100.0869 g CaCO3) / 1000 mg/g
    // = 0.01786 g KHCO3 / L / dKH
    // Original code used 17.848 * L / (1000 * p) for (target-current)
    // This means 0.017848 g/L/dKH. Let's use the established constant.
    const grams = (targetKh - currentKh) * 0.017848 * litres / purity;
    return Math.max(0, grams);
}

/**
 * Calculates grams of Seachem Equilibrium needed.
 * @param {number} deltaGh - The difference between target GH and current GH (°dGH).
 * @param {number} litres - Water volume in litres.
 * @returns {number} Grams of Equilibrium required.
 */
function calculateEquilibriumGrams(deltaGh, litres) {
    // Seachem: 16g per 80L raises 3 dGH. So, (16g / 80L / 3dGH) = 0.0666... g/L/dGH
    // COEFF_EQUILIBRIUM was 16 / (80 * 3)
    const grams = deltaGh * COEFF_EQUILIBRIUM * litres;
    return Math.max(0, grams);
}

/**
 * Calculates grams of Seachem Neutral Regulator needed.
 * @param {number} litres - Water volume in litres.
 * @param {number} currentPh - Current pH.
 * @param {number} targetPh - Target pH.
 * @param {number} currentKh - Current KH in °dKH (used to adjust dosage strength).
 * @returns {number} Grams of Neutral Regulator required.
 */
function calculateNeutralRegulatorGrams(litres, currentPh, targetPh, currentKh) {
    if (targetPh >= currentPh) return 0; // Only dose if lowering pH towards neutral

    // Dose rate depends on KH, maxing out at 4dKH for calculation purposes
    // GPL_MIN_NR = 0.0625 g/L (for low KH or small pH change)
    // GPL_MAX_NR = 0.125 g/L (for KH >= 4 or larger pH change)
    // The dose is scaled by how much KH contributes, up to 4dKH.
    const khEffectFactor = Math.min(currentKh, 4) / 4;
    const baseGramsPerLitre = GPL_MIN_NR + (GPL_MAX_NR - GPL_MIN_NR) * khEffectFactor;

    // pH factor: how many "0.5 pH steps" are we trying to achieve
    // e.g., from 7.5 to 7.0 is one step. From 8.0 to 7.0 is two steps.
    const phSteps = (currentPh - targetPh) / 0.5;
    if (phSteps <= 0) return 0;

    let grams = baseGramsPerLitre * litres * phSteps;

    // Cap the total dose to what would be used at GPL_MAX_NR for a single large step,
    // or effectively, ensure it doesn't massively overdose.
    // Seachem: "Use 1 level teaspoon for every 40–80 L once or twice a month"
    // 1 teaspoon ~ 5g. 5g/40L = 0.125 g/L. 5g/80L = 0.0625 g/L. This matches GPL_MIN/MAX.
    // The original formula capped at GPL_MAX_NR * L, which seems like a daily/single dose cap.
    grams = Math.min(grams, GPL_MAX_NR * litres * phSteps); // Cap based on total pH change
    grams = Math.min(grams, GPL_MAX_NR * litres * 2); // Absolute cap assuming max 1.0 pH drop in one go with max strength.

    return Math.max(0, grams);
}

/**
 * Calculates grams of Seachem Acid Buffer needed.
 * @param {number} litres - Water volume in litres.
 * @param {number} currentKh - Current KH in °dKH.
 * @param {number} targetKh - Target KH in °dKH.
 * @returns {number} Grams of Acid Buffer required.
 */
function calculateAcidBufferGrams(litres, currentKh, targetKh) {
    // Seachem: 1/4 teaspoon (approx 1.5g) per 40L lowers alkalinity by 0.8 dKH.
    // So, 1.5g / 40L / 0.8dKH = 0.046875 g/L/dKH to lower.
    // Original COEFF_ACID = 1/24. (1/24) g/L/dKH = 0.04166 g/L/dKH
    // Let's use original for consistency.
    const deltaKh = currentKh - targetKh;
    const grams = deltaKh * COEFF_ACID * litres;
    return Math.max(0, grams);
}

/**
 * Calculates grams of Seachem Gold Buffer needed.
 * @param {number} litres - Water volume in litres.
 * @param {number} currentPh - Current pH.
 * @param {number} targetPh - Target pH.
 * @returns {{grams: number, fullDose: boolean}} Grams of Gold Buffer and if it's a full dose.
 */
function calculateGoldBufferGrams(litres, currentPh, targetPh) {
    const deltaPh = targetPh - currentPh;
    if (deltaPh <= 0) return { grams: 0, fullDose: false };

    // Seachem: "Use 1 level teaspoon (6g) for every 40L. This dose will raise pH by about 0.1–0.2 pH units, depending on buffering capacity."
    // "To adjust pH gradually, or if water is soft or not well buffered, use 1/4 to 1/2 dose."
    // Original code: if delta >= 0.3, full dose. Otherwise half.
    // COEFF_GOLD_FULL = 6g / 40L = 0.15 g/L for a full dose.
    const fullDoseRecommended = deltaPh >= 0.3;
    const doseMultiplier = fullDoseRecommended ? 1 : 0.5;
    const grams = COEFF_GOLD_FULL * doseMultiplier * litres;

    return { grams: Math.max(0, grams), fullDose: fullDoseRecommended };
}
