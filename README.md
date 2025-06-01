# https://gurucharansavanth.github.io/Seachem-Dosing-Calculator/
# Aquarium Dosing Calculator

This web application helps aquarium hobbyists calculate the correct amount of various chemical supplements to dose their tanks for adjusting water parameters like KH, GH, and pH.

## Project Structure




## Features

* Calculates dosages for:
    * Potassium Bicarbonate (KH booster)
    * Seachem Equilibrium (GH booster)
    * Seachem Neutral Regulator (pH adjustment)
    * Seachem Acid Buffer (KH & pH reducer)
    * Seachem Gold Buffer (Goldfish pH adjustment)
* Supports Litres, US Gallons, and UK Gallons for tank volume.
* Dark/Light theme toggle.
* Results can be copied to the clipboard.
* Results can be downloaded as a CSV file.
* Input validation and error display.
* Debounced auto-calculation on input changes.
* Responsive design for mobile and desktop.
* Tooltips for input fields.
* Unit tests for calculation logic (output to browser console).

## How to Use

1.  Open `index.html` in a web browser.
2.  Enter your tank volume and select the unit.
3.  For each supplement you intend to use:
    * Enter your current water parameter (e.g., Current KH).
    * Enter your target water parameter (e.g., Target KH).
    * Enter any other required information (e.g., Purity for KHCO₃).
4.  The calculator will automatically update the required dosage as you type (after a short delay).
5.  You can also click "Calculate All Doses" to manually trigger calculations.
6.  Use the "Reset" button to clear inputs to their default values.
7.  Use the "Download as CSV" button to save the current results.
8.  Click the copy icon (📋) next to a result to copy the dosage amount to your clipboard.

## Development Notes

* **`js/utils.js`**: Contains shared constants (like conversion factors) and helper functions (e.g., `parseFloatSafe`, `qs` for DOM selection, formatting functions).
* **`js/dosingCalculations.js`**: Houses the pure calculation functions for each chemical. These functions take numerical inputs and return the calculated dose. They do not interact with the DOM.
* **`js/uiHandlers.js`**: Manages all interactions with the HTML. This includes:
    * Reading values from input fields.
    * Displaying results and error messages.
    * Setting up event listeners for buttons, theme toggle, etc.
    * Handling CSV export and clipboard copy.
* **`js/app.js`**: The entry point of the application.
    * Initializes the UI and event listeners by calling functions in `uiHandlers.js`.
    * Contains the main `doCalculations` function which orchestrates the process:
        1.  Gets input values (via `uiHandlers.js`).
        2.  Performs validation.
        3.  Calls the appropriate functions from `dosingCalculations.js`.
        4.  Displays the results (via `uiHandlers.js`).
    * Runs unit tests on load.

This modular structure makes the code easier to understand, debug, and extend.
