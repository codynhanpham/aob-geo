function getSingleSelectDropdownValue(dropdownComponentID) {
    const dropdownComponent = document.getElementById(dropdownComponentID);
    const selectBtn = dropdownComponent.querySelector(".select-button");
    if (!selectBtn) {
        console.error("Select button not found in the dropdown component");
        return null;
    }
    const selectedValue = selectBtn.querySelector(".selected-value");
    if (!selectedValue) {
        console.error("Selected value element not found in the dropdown component");
        return null;
    }

    // Check if the inner <span data-isPlaceholder> element is present
    // If it is present, then the dropdown is empty and no value is selected
    if (selectedValue.querySelector("[data-isDropdownSelectionPlaceholder]")) {
        return null;
    }

    return selectedValue.getAttribute("data-dropdownSelectedValue") || selectedValue.textContent || null;
}
// getSingleSelectDropdownValue("dropDown1");

function getSingleSelectDropdownOptions(dropdownComponentID) {
    const dropdownComponent = document.getElementById(dropdownComponentID);
    const optionsList = dropdownComponent.querySelectorAll(".select-dropdown li");
    if (!optionsList) {
        console.error("Options list not found in the dropdown component");
        return null;
    }

    const options = [];
    optionsList.forEach((option) => {
        const optionValue = option.querySelector("input") ? option.querySelector("input").value : option.textContent;
        options.push(optionValue || option.textContent);
    });

    return options;
}
// getSingleSelectDropdownOptions("dropDown1");

function setDropdownValue(dropdownComponentID, value) {
    // Set the value of the dropdown with value from the options list programmatically

    const dropdownComponent = document.getElementById(dropdownComponentID);
    const selectBtn = dropdownComponent.querySelector(".select-button");
    const selectedValue = selectBtn.querySelector(".selected-value");
    const optionsList = dropdownComponent.querySelectorAll(".select-dropdown li");

    // Check if the value is present in the options list
    let isValuePresent = false;
    optionsList.forEach((option) => {
        const optionValue = option.querySelector("input") ? option.querySelector("input").value : option.textContent;
        if (optionValue === value) {
            isValuePresent = true;
        }
    });

    if (!isValuePresent) {
        return; // If the value is not present in the options list, do nothing
    }

    // Set the value in the selected value element
    const selectedOption = dropdownComponent.querySelector(`.select-dropdown li input[value="${value}"]`);
    const selectedOptionText = selectedOption ? selectedOption.parentElement.textContent : value;
    selectedValue.textContent = selectedOptionText;
    selectedValue.setAttribute("data-dropdownSelectedValue", value);

    optionsList.forEach((option) => {
        option.querySelector("input").checked = false;
    });
    if (selectedOption) {
        selectedOption.checked = true;
    }
}





// Get all the dropdown components
const DropdownComponents = document.querySelectorAll(".single-select-dropdown-component");

DropdownComponents.forEach((dropdownComponent) => {
    const selectBtn = dropdownComponent.querySelector(".select-button");
    const selectedValue = selectBtn.querySelector(".selected-value");
    const optionsList = dropdownComponent.querySelectorAll(".select-dropdown li");
    let isFocused = false;

    // add click event to select button
    selectBtn.addEventListener("click", (event) => {
        isFocused = true;
        event.stopPropagation();
        // check if the remaining body height is enough to show the dropdown, if not, then show the dropdown upwards
        const dropdown = dropdownComponent.querySelector(".select-dropdown");
        const dropdownHeight = dropdown.offsetHeight;
        const buttonHeight = selectBtn.offsetHeight;
        const remainingHeight = window.innerHeight - dropdownComponent.getBoundingClientRect().bottom;
        if (remainingHeight < dropdownHeight) {
            dropdown.classList.add("open-upwards");
            // change the --top variable of this open-upwards class to -dropdownHeight-buttonHeight
            dropdown.style.setProperty("--top", `-${dropdownHeight + buttonHeight}px`);
        } else {
            dropdown.classList.remove("open-upwards");
            dropdown.style.removeProperty("--top");
        }
        // add/remove active class on the container element
        dropdownComponent.classList.toggle("active");
        // update the aria-expanded attribute based on the current state
        selectBtn.setAttribute(
            "aria-expanded",
            selectBtn.getAttribute("aria-expanded") === "true" ? "false" : "true"
        );
        // focus on the current selected value
        if (dropdownComponent.classList.contains("active")) {
            // focus on the option list input which has the value same as the selected value
            let selectedValue = dropdownComponent.querySelector(".selected-value");
            selectedValue = selectedValue.getAttribute("data-dropdownSelectedValue") || selectedValue.textContent;
            const selectedOption = dropdownComponent.querySelector(`.select-dropdown li input[value="${selectedValue}"]`);
            if (selectedOption) {
                selectedOption.focus({ focusVisible: true });
            } else {
                dropdownComponent.querySelector(".select-dropdown li input").focus({ focusVisible: true });
            }
        }
    });

    optionsList.forEach((option) => {
        function handler(e) {
            // Click Events
            if (e.type === "click" && e.clientX !== 0 && e.clientY !== 0) {
                // Display value
                selectedValue.textContent = this.children[1].textContent;

                // Data value, set in the selectedValue element as "data-dropdownSelectedValue"
                // Get the value from this [input] value
                const thisInput = this.querySelector("input");
                selectedValue.setAttribute("data-dropdownSelectedValue", thisInput.value || this.children[1].textContent); // If input value is not present, then use the text content as fallback

                dropdownComponent.classList.remove("active");
                isFocused = false;

                optionsList.forEach((option) => {
                    if (option !== this) {
                        option.querySelector("input").checked = false;
                    }
                });
            }
            // Key Events
            if (e.key === "Enter") {
                // Display value
                selectedValue.textContent = this.children[1].textContent;

                // Data value, set in the selectedValue element as "data-dropdownSelectedValue"
                // Get the value from this [input] value
                const thisInput = this.querySelector("input");
                selectedValue.setAttribute("data-dropdownSelectedValue", thisInput.value || this.children[1].textContent); // If input value is not present, then use the text content as fallback

                dropdownComponent.classList.remove("active");
                isFocused = false;

                optionsList.forEach((option) => {
                    if (option !== this) {
                        option.querySelector("input").checked = false;
                    }
                });
            }
        }

        option.addEventListener('focus', e =>
            e.stopImmediatePropagation()
        );
        option.addEventListener("keydown", handler);
        option.addEventListener("click", handler);
    });

    // Close the dropdown when clicking outside
    document.addEventListener("click", (event) => {
        if (isFocused) {
            if (!dropdownComponent.contains(event.target)) {
                dropdownComponent.classList.remove("active");
                isFocused = false;
            }
        }
    });
});

