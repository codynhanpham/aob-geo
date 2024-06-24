function getRangeSliderValue(rangeSliderComponentID) {
    // Get the range slider component class
    const rangeSliderComponents = document.querySelectorAll('.range-slider-component');
    // Find the range slider component with the given ID
    const rangeSliderComponent = Array.from(rangeSliderComponents).find(rangeSliderComponent => rangeSliderComponent.id === rangeSliderComponentID);
    // Get the range slider values
    const rangeSliderValues = rangeSliderComponent.querySelectorAll('input');
    // Return the range slider values
    return Array.from(rangeSliderValues).map(rangeSliderValue => parseFloat(rangeSliderValue.value));
}
// getRangeSliderValue('rangeSlider1'); // [42, 69]


const onRangeSliderInput = (parent, e) => {
    const slides = parent.querySelectorAll('input[type="range"]');
    const min = parseFloat(slides[0].min);
    const max = parseFloat(slides[0].max);

    let slide1 = parseFloat(slides[0].value);
    let slide2 = parseFloat(slides[1].value);

    const percentageMin = (slide1 / (max - min)) * 100;
    const percentageMax = (slide2 / (max - min)) * 100;

    parent.style.setProperty('--range-slider-value-low', percentageMin);
    parent.style.setProperty('--range-slider-value-high', percentageMax);

    if (slide1 > slide2) {
        const tmp = slide2;
        slide2 = slide1;
        slide1 = tmp;

        if (e?.currentTarget === slides[0]) {
            slides[0].insertAdjacentElement('beforebegin', slides[1]);
        } else {
            slides[1].insertAdjacentElement('afterend', slides[0]);
        }
    }

    parent.querySelector('.range-slider-value-display').setAttribute('data-low', slide1);
    parent.querySelector('.range-slider-value-display').setAttribute('data-high', slide2);
}

window.addEventListener('load', (event) => {
    document.querySelectorAll('.range-slider-component')
    .forEach(range => range.querySelectorAll('input[type="range"]')
        .forEach((input) => {
            input.oninput = (e) => onRangeSliderInput(range, e);
            onRangeSliderInput(range);
        })
    )
});