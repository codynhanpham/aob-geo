function getSimpleSliderValue(simpleSliderComponentID) {
    // Get the range slider component class
    const simpleSliderComponents = document.querySelectorAll('.simple-slider-component');
    // Find the range slider component with the given ID
    const rangeSliderComponent = Array.from(simpleSliderComponents).find(rangeSliderComponent => rangeSliderComponent.id === simpleSliderComponentID);
    // Get the range slider values
    const rangeSliderValues = rangeSliderComponent.querySelectorAll('input');
    // Return the range slider values
    return Array.from(rangeSliderValues).map(rangeSliderValue => parseFloat(rangeSliderValue.value))[0];
}
// getSimpleSliderValue('rangeSlider1'); // 42


const onSingleSliderInput = (parent, e) => {
    const slides = parent.querySelectorAll('input[type="range"]');
    const min = parseFloat(slides[0].min);
    const max = parseFloat(slides[0].max);

    let slide = parseFloat(slides[0].value);

    const percentageMax = (slide / (max - min)) * 100;

    parent.style.setProperty('--single-slider-value', percentageMax);

    parent.querySelector('.simple-slider-value-display').setAttribute('data-high', slide);
}

window.addEventListener('load', (event) => {
    document.querySelectorAll('.simple-slider-component')
    .forEach(range => range.querySelectorAll('input[type="range"]')
        .forEach((input) => {
            input.oninput = (e) => onSingleSliderInput(range, e);
            onSingleSliderInput(range);
        })
    )
});