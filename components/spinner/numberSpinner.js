// Get the spinner value at any time with the <input> id
function getNumberSpinnerValue(id) {
    let element = document.getElementById(id);
    if (element) {
        return parseFloat(element.value);
    }
    return null;
}
// getNumberSpinnerValue('real-log2');




// ----- Controlling and Validating the Number Spinner ----- //
function updateNumberSpinner(element) {
    // This is a up or down button, indicated by this.value

    let parentDiv = element.parentElement;

    // Get the min, max, step, and default values,... from the parent div
    let min = parseFloat(parentDiv.getAttribute('data-min'));
    let max = parseFloat(parentDiv.getAttribute('data-max'));
    let step = parseFloat(parentDiv.getAttribute('data-step')) || 1;
    let defaultValue = parseFloat(parentDiv.getAttribute('data-default'));
    if (defaultValue === undefined || isNaN(defaultValue) || defaultValue === null) {
        defaultValue = min || 0;
    }
    let isInt = parentDiv.getAttribute('data-integer') === 'true' ? true : false;
    let scaler = parentDiv.getAttribute('data-scale') || "linear"; // linear or log2 or logarithmic

    let currentValue = parseFloat(parentDiv.querySelector('input').value);
    if (currentValue === undefined || isNaN(currentValue) || currentValue === null) {
        currentValue = defaultValue;
    }

    // Get the current value from the input element
    let changeDirection = element.value === 'up' ? 1 : -1;
    // newValue depends on the currentValue, step, and scaler: if linear, then it's the step, if log2, then either double or half, if logarithmic, then either 10x or 0.1x
    let newValue = currentValue;
    if (scaler === "linear") {
        newValue += step * changeDirection;
    } else if (scaler === "log2") {
        newValue *= Math.pow(2, changeDirection);
    } else if (scaler === "logarithmic") {
        newValue *= Math.pow(10, changeDirection);
    }

    // if isInt is true, then round it to the nearest integer
    if (isInt) {
        newValue = Math.round(newValue);
    }

    // Check if the new value is within the min and max range
    if (newValue < min) {
        newValue = min;
    } else if (newValue > max) {
        newValue = max;
    }

    // Always limit to 9 decimal places if value is a float
    if (!Number.isInteger(newValue)) {
        newValue = parseFloat(newValue.toFixed(9));
    }

    // Update the input element with the new value
    parentDiv.querySelector('input').value = newValue;
    // Update step for the parentDiv as well for the next time
    parentDiv.setAttribute('data-step', step);
    // Trigger the input event to format the value and update the tooltip title
    parentDiv.querySelector('input').dispatchEvent(new Event('input'));
}

function validateNumberSpinner(element) {
    // Fires when the input element value changes
    // This is the input element: validate the value and update the input element with the new value

    let parentDiv = element.parentElement;

    // Get the min, max, step, and default values,... from the parent div
    let min = parseFloat(parentDiv.getAttribute('data-min'));
    let max = parseFloat(parentDiv.getAttribute('data-max'));
    let step = parseFloat(parentDiv.getAttribute('data-step')) || 1;
    let defaultValue = parseFloat(parentDiv.getAttribute('data-default'));

    let isInt = parentDiv.getAttribute('data-integer') === 'true' ? true : false;
    
    // Set the attributes of the input element only if they are numbers and not Inf
    if (!isNaN(min) && isFinite(min)) {
        element.setAttribute('min', min);
    }
    if (!isNaN(max) && isFinite(max)) {
        element.setAttribute('max', max);
    }
    if (!isNaN(step) && isFinite(step)) {
        element.setAttribute('step', step);
    }

    // Get the current value from the input element
    let currentValue = parseFloat(element.value);
    if (currentValue === undefined || isNaN(currentValue) || currentValue === null) {
        currentValue = defaultValue;
    }

    // if the currentValue is not int and isInt is true, then round it to the nearest integer
    if (!Number.isInteger(currentValue) && isInt) {
        currentValue = Math.round(currentValue);
    }

    // Check if the new value is within the min and max range
    if (currentValue < min) {
        currentValue = min;
    } else if (currentValue > max) {
        currentValue = max;
    }

    // Always limit to 9 decimal places if currentValue is a float
    if (!Number.isInteger(currentValue)) {
        currentValue = parseFloat(currentValue.toFixed(9));
    }

    // Update the input element with the new value, overwrite the value if it's different
    if (element.value !== currentValue) {
        element.value = currentValue;
    }

    // Lastly, update tooltip title with min, max, and type of number
    if (min === null || isNaN(min) || min === undefined) {
        min = "-∞"
    } else {
        min = min.toLocaleString();
    }
    if (max === null || isNaN(max) || max === undefined) {
        max = "+∞"
    } else {
        max = max.toLocaleString();
    }
    let tooltipTitle = `Enter ${isInt ? 'an integer' : 'a number'} between ${min} and ${max} (inclusive)`;

    if (element.title !== tooltipTitle) {
        element.title = tooltipTitle;
    }
}
function updateAllSpinnersInputAttributes() {
    document.querySelectorAll('.number-spinner-component').forEach(function(element) {
        let inputElement = element.querySelector('input');
        validateNumberSpinner(inputElement);
    });
}

window.addEventListener("load", updateAllSpinnersInputAttributes);


// Save all required variables in a object to avoid polluting the global scope
const _NumberSpinnerComponent = {};

// Handle holding down the up or down button for both mouse and touch events
_NumberSpinnerComponent.numberSpinners = document.querySelectorAll('.number-spinner-component');
_NumberSpinnerComponent.holdTimeoutHandle = null;
_NumberSpinnerComponent.holdIntervalHandle = null;
_NumberSpinnerComponent.holdInterval = 100; // update every 80ms
_NumberSpinnerComponent.holdDelay = 500; // start after 500ms

_NumberSpinnerComponent.handleHold = function(element) {
    this.holdTimeoutHandle = setTimeout(() => {
        this.holdIntervalHandle = setInterval(() => {
            updateNumberSpinner(element);
        }, this.holdInterval);
    }, this.holdDelay);
}

_NumberSpinnerComponent.clearHold = function() {
    clearTimeout(this.holdTimeoutHandle);
    clearInterval(this.holdIntervalHandle);
}

_NumberSpinnerComponent.addEventListeners = function(button, eventType) {
    // prevent context menu from appearing on right click
    button.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    });

    button.addEventListener(eventType, (event) => {
        if ((eventType === 'keydown' && (event.key === ' ' || event.key === 'Enter'))) {
            updateNumberSpinner(button);
        }
        else if (eventType === 'mousedown' || eventType === 'touchstart') {
            event.preventDefault(); // important to for touch devices, how the normal touch trigger both mousedown and touchstart, but holding down touch will not trigger mouse events
            updateNumberSpinner(button);
            this.handleHold(button);
        }
        else {
            this.clearHold();
        }
    });
}

_NumberSpinnerComponent.numberSpinners.forEach(function(element) {
    const upButton = element.querySelector('button[value="up"]');
    const downButton = element.querySelector('button[value="down"]');
    const events = ['mousedown', 'mouseup', 'keydown', 'keyup', 'mouseleave', 'touchstart', 'touchend'];

    events.forEach(eventType => {
        _NumberSpinnerComponent.addEventListeners(upButton, eventType);
        _NumberSpinnerComponent.addEventListeners(downButton, eventType);
    });
});

// ----- ----- //