// ----- GENERAL HELPER FUNCTIONS ----- //
function randomFloatRange(min, max) {
    return Math.random() * (max - min) + min;
}

const LOCATIONS = {};
// fetch the locations from the json files at ./quiz-data/geo/
async function fetchLocations() {
    return Promise.all([
        fetch('./quiz-data/geo/EhrenfestP2V3.json')
            .then(response => response.json())
            .then(data => {
                LOCATIONS['EhrenfestP2V3'] = data;
            })
            .catch(error => {
                console.error('Error fetching the locations:', error);
            }),
        fetch('./quiz-data/geo/YurgenschmidtP4V1.json')
            .then(response => response.json())
            .then(data => {
                LOCATIONS['YurgenschmidtP4V1'] = data;
            })
            .catch(error => {
                console.error('Error fetching the locations:', error);
            })
    ]);
}



// ----- GENERAL TABS FUNCTIONS ----- //

function openTab(evt, tabName) {
    let i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
        tabcontent[i].style.visibility = "hidden";
    }

    // Get all elements with class="tablinks" and remove the class "tabactive"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" tabactive", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    evt.currentTarget.className += " tabactive";
    tabcontent = document.getElementById(tabName);
    if (tabcontent) {
        tabcontent.style.display = "flex";
        tabcontent.style.visibility = "visible";
    }

    sessionStorage.setItem('currentTab', evt.currentTarget.id);

    // TODO: Maybe do URL rewriting to change the URL to include the tab name here
}

function pointerScroll(elem) {
    let isDrag = false;
    
    const dragStart = () => isDrag = true;
    const dragEnd = () => isDrag = false;
    const drag = (ev) => isDrag && (elem.scrollLeft -= ev.movementX);
    
    elem.addEventListener("pointerdown", dragStart);
    addEventListener("pointerup", dragEnd);
    addEventListener("pointermove", drag);
};





// ----- GENERAL SETTINGS FUNCTIONS ----- //
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.getElementById('fullscreen-switch').checked = true; // just making sure the switch is checked
    } else {
        document.exitFullscreen();
        document.getElementById('fullscreen-switch').checked = false; // just making sure the switch is unchecked
    }
}
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
        document.getElementById('fullscreen-switch').checked = false;
    } else {
        document.getElementById('fullscreen-switch').checked = true;
    }
});
const fullscreenQuery = matchMedia("all and (display-mode: fullscreen"); // F11 does not trigger fullscreenchange event so detect with media query instead
fullscreenQuery.onchange = e => {
    document.getElementById('fullscreen-switch').checked = e.matches;
};


function toggleInkyFilter(element) {
    const input = element.querySelector('input[type="checkbox"]');
    if (!input.checked) {
        document.body.classList.add('noFilter');
        removeSVGPathFilter();
    } else {
        document.body.classList.remove('noFilter');
        applySVGPathFilter();
    }
}






// ----- THE GAME ----- //
function setDefaultInfoStrip() {
    let q_element = document.querySelector('#question'),
        qPre_element = document.querySelector('#question_note_pre'),
        qSuf_element = document.querySelector('#question_note_suf');

    q_element.textContent = '‎'; // invisible character to reserve space and avoid layout shift
    qPre_element.textContent = 'Click on the Map';
    qSuf_element.textContent = 'to Start the Quiz';
}

class AppContainer {
    constructor({ mapTypeID, locationData }) {
        this.map = {
            locationData: locationData,
            mapType: mapTypeID,
        };
        this.score = {
            element: document.querySelector('#score'),
            value: 0,
            max_value: 0,
        };
        this.question = {
            q_element: document.querySelector('#question'),
            qPre_element: document.querySelector('#question_note_pre'),
            qSuf_element: document.querySelector('#question_note_suf'),
            q_value: '‎',
            qPre_value: '',
            qSuf_value: '‎',
            id_value: '',
            id_alias: [],
        };
        this.answersLog = {
            isCompleted: false,
            correct: [],
            incorrect: [
                // in the format: [correct_id, incorrect_id] per question
            ],
            streak: 0,
            max_streak: 0,
        }
        this.timer = {
            mm_element: document.querySelector('#time_mm'),
            ss_element: document.querySelector('#time_ss'),
            mm_value: 0,
            ss_value: 0,
            mm_limit: 99,
            time_start: null,
            time_elapsed: 0,
            interval: null,
        };
    }

    findLocationDataFromID(id_value) {
        // Get the location data from the map object (the JSON data)
        let keys = Object.keys(this.map.locationData);
        let locationData = this.map.locationData[keys.find(key => key === id_value)];
        if (!locationData) {
            // check for if "id_alias" exists in locationData entries, then check if the id_value is in the alias array --> return the locationData
            for (let key in this.map.locationData) {
                if (this.map.locationData[key].id_alias && this.map.locationData[key].id_alias.includes(id_value)) {
                    locationData = this.map.locationData[key];
                    break;
                }
            }
        }
        return locationData;
    }


    // Question functions
    updateQuestion() {
        this.question.q_element.textContent = this.question.q_value;
        this.question.qPre_element.textContent = this.question.qPre_value;
        this.question.qSuf_element.textContent = this.question.qSuf_value;
    }
    setQuestion(id_value) {
        this.question.id_alias = [];
        // Find the location data with the id from the map.locationData object
        let locationData = this.findLocationDataFromID(id_value);
        if (!locationData) {
            // default the question to the id
            this.question.q_value = id_value;
            this.question.qPre_value = '';
            this.question.qSuf_value = '‎';

            this.updateQuestion();
        }

        if (locationData.id_alias && locationData != id_value) {
            this.question.id_alias = locationData.id_alias;
            this.question.id_value = locationData.id;
        }

        // Set the question
        this.question.q_value = locationData.name;
        this.question.qPre_value = locationData.prefix || '';
        this.question.qSuf_value = locationData.suffix || '‎';

        this.updateQuestion();
    }
    resetQuestion() {
        setDefaultInfoStrip();
    }


    // Score functions
    updateScore() {
        this.score.element.textContent = `${this.score.value}/${this.score.max_value}`;
    }
    resetScore() {
        this.score.value = 0;
        this.updateScore();
    }
    incrementScore() {
        this.score.value++;
        this.updateScore();
    }


    // Timer functions
    updateTimer() {
        let mm = this.timer.mm_value.toString().padStart(2, '0');
        let ss = this.timer.ss_value.toString().padStart(2, '0');
        this.timer.mm_element.textContent = mm;
        this.timer.ss_element.textContent = ss;
    }
    resetTimer() {
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
            this.timer.interval = null;
        }
        this.timer.mm_value = 0;
        this.timer.ss_value = 0;
        this.timer.time_start = null;
        this.timer.time_elapsed = 0;
        this.updateTimer();
    }
    startTimer() {
        this.resetTimer();
        this.time_elapsed = 1; // since the time is updated every second, set to 1ms at the start to hint that the game is already running
        this.timer.mm_value = 0;
        this.timer.ss_value = 0;
        this.updateTimer();
        this.timer.time_start = new Date();
        this.timer.interval = setInterval(() => {
            if (this.timer.mm_value >= this.timer.mm_limit) {
                clearInterval(this.timer.interval);
                this.timer.interval = null;
                this.pauseTimer();
                confirm('Dregarnuhr the Goddess of Time might have played a trick on us...');
                this.resetAll();
                return;
            }

            let time_now = new Date();
            this.timer.time_elapsed = time_now - this.timer.time_start;
            this.timer.ss_value = Math.floor(this.timer.time_elapsed / 1000);
            this.timer.mm_value = Math.floor(this.timer.ss_value / 60);
            this.timer.ss_value = this.timer.ss_value % 60;
            
            this.updateTimer();
        }, 1000);
    }
    pauseTimer() {
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
            this.timer.interval = null;
        }
    }
    resumeTimer() {
        if (!this.timer.interval) {
            let time_now = new Date();
            let time_elapsed = this.timer.time_elapsed;
            this.timer.time_start = new Date(time_now - time_elapsed);
            
            this.timer.interval = setInterval(() => {
                if (this.timer.mm_value >= this.timer.mm_limit) {
                    clearInterval(this.timer.interval);
                    this.timer.interval = null;
                    this.pauseTimer();
                    confirm('Dregarnuhr the Goddess of Time might have played a trick on us...');
                    this.resetAll();
                    return;
                }
                
                let time_now = new Date();
                this.timer.time_elapsed = time_now - this.timer.time_start;
                this.timer.ss_value = Math.floor(this.timer.time_elapsed / 1000);
                this.timer.mm_value = Math.floor(this.timer.ss_value / 60);
                this.timer.ss_value = this.timer.ss_value % 60;
                
                this.updateTimer();
            }, 1000);
        }
    }


    // Save values to local storage for stats
    saveEntryData() {
        // If the time elapsed is 0 or no answers logged, don't save the entry since it was probably not started
        if (this.timer.time_elapsed === 0 || (this.answersLog.correct.length === 0 && this.answersLog.incorrect.length === 0)) {
            return;
        }
        // remove streak from the log
        delete this.answersLog.streak;
        let entryData = {
            score: this.score.value,
            max_score: this.score.max_value,
            time_elapsed_sec: Math.round(this.timer.time_elapsed / 1000),
            mapType: this.map.mapType,
            answersLog: this.answersLog,
        };
        
        let entryKey = `aob-geo_${this.map.mapType}_${Date.now()}`;
        localStorage
            .setItem(entryKey, JSON.stringify(entryData));
    }



    // Reset all values
    resetAll() {
        if (this.timer.interval) {
            clearInterval(this.timer.interval);
            this.timer.interval = null;
        }
        this.resetScore();
        this.resetTimer();
        this.resetQuestion();
        
        // Am I missing something?
    }
}



// ----- TEXT FILTER EFFECT ----- //
function updateTextFilter() {
    const textFilterId = document.querySelector('svg filter#textFilter').id;
    const textFilterFeGauss = document.querySelector(`#${textFilterId}>feGaussianBlur`);
    const textFilterFeDisp = document.querySelector(`#${textFilterId}>feDisplacementMap`);

    let fontSize = getComputedStyle(document.body).getPropertyValue('font-size');
    fontSize = parseFloat(fontSize.replace('px', ''));
    let scale = 1 / 61.8 * fontSize;
    scale = Math.min(Math.max(0.001, scale), 6);
    textFilterFeGauss.setAttribute('stdDeviation', scale * randomFloatRange(1.15, 1.48));
    textFilterFeDisp.setAttribute('scale', scale * randomFloatRange(3.15, 3.65));
}
function updateHeadingTextFilter() {
    const textFilterId = document.querySelector('svg filter#headingTextFilter').id;
    const textFilterFeGauss = document.querySelector(`#${textFilterId}>feGaussianBlur`);
    const textFilterFeDisp = document.querySelector(`#${textFilterId}>feDisplacementMap`);

    let fontSize = getComputedStyle(document.body).getPropertyValue('font-size');
    fontSize = parseFloat(fontSize.replace('px', ''));
    let scale = 1 / 61.8 * fontSize;
    scale = Math.min(Math.max(0.001, scale), 10);
    textFilterFeGauss.setAttribute('stdDeviation', scale * randomFloatRange(2.8, 3.2));
    textFilterFeDisp.setAttribute('scale', scale * randomFloatRange(4.85, 5.5));
}
function updateInputFieldFilter() {
    const textFilterId = document.querySelector('svg filter#inputFieldFilter').id;
    const textFilterFeGauss = document.querySelector(`#${textFilterId}>feGaussianBlur`);
    const textFilterFeDisp = document.querySelector(`#${textFilterId}>feDisplacementMap`);

    let fontSize = getComputedStyle(document.body).getPropertyValue('font-size');
    fontSize = parseFloat(fontSize.replace('px', ''));
    let scale = 1 / 61.8 * fontSize;
    scale = Math.min(Math.max(0.001, scale), 6);
    textFilterFeGauss.setAttribute('stdDeviation', scale * randomFloatRange(0.135, 0.17));
    textFilterFeDisp.setAttribute('scale', scale * randomFloatRange(1.55, 1.9));
}
function updateBorderFilter() {
    const textFilterId = document.querySelector('svg filter#borderFilter').id;
    const textFilterFeGauss = document.querySelector(`#${textFilterId}>feGaussianBlur`);
    const textFilterFeDisp = document.querySelector(`#${textFilterId}>feDisplacementMap`);

    let fontSize = getComputedStyle(document.body).getPropertyValue('font-size');
    fontSize = parseFloat(fontSize.replace('px', ''));
    let scale = 1 / 61.8 * fontSize;
    scale = Math.min(Math.max(0.001, scale), 7);
    textFilterFeGauss.setAttribute('stdDeviation', scale * randomFloatRange(1.5, 1.8));
    textFilterFeDisp.setAttribute('scale', scale * randomFloatRange(5.5, 6.3));
}

window.addEventListener('resize', () => {
    if (!getSwitchValue('inky-switch')) {
        return;
    }
    updateHeadingTextFilter();
    updateTextFilter();
    updateInputFieldFilter();
    updateBorderFilter();
    applySVGPathFilter();
});




// ----- TEXT YOGURTLAND FONT ----- //
// Listen for "/" key press N times within Threshold ms to toggle the Yogurtland font
const fontChangeTriggerCountThreshold = 9;
const fontChangeTriggerTimeout = 4000;
let fontChangeTriggerCount = 0;
let fontChangeTriggerTimer = null;

addEventListener("keyup", (event) => {
    if (event.key === "/") {
        // toggle '.Yurgenschmidt-font'
        fontChangeTriggerCount++;
        if (fontChangeTriggerCount === 1) {
            fontChangeTriggerTimer = setTimeout(() => {
                fontChangeTriggerCount = 0;
            }, fontChangeTriggerTimeout);
        }
        if (fontChangeTriggerCount >= fontChangeTriggerCountThreshold) {
            document.body.classList.toggle('Yurgenschmidt-font');
            fontChangeTriggerCount = 0;
            clearTimeout(fontChangeTriggerTimer);
        }
    }
});
// Prevent the "/" key kidnapping the cursor by Firefox quick find
addEventListener("keydown", (event) => {
    if (event.key === "/") {
        event.preventDefault();
    }
});




// ----- SVG PATHS ----- //

function getMapSVGElements() {
    let svgDoc = document.querySelector('object');
    svgDoc = svgDoc.contentDocument;

    let paths = svgDoc.querySelectorAll('path[id]');
    // filter for id that does not start with "text_" or "mapoutline" or "void" --> these are the canon regions
    paths = Array.from(paths).filter(path => !path.id.startsWith('text_') && !path.id.startsWith('mapoutline') && !path.id.startsWith('void'));

    // return as object with id as key and path element as value
    let pathsMap = {};
    for (let i=0; i<paths.length; i++) {
        pathsMap[paths[i].id] = paths[i];
    }
    return pathsMap;
}


function applySVGPathFilter() {
    let svgDoc = document.querySelector('object');
    svgDoc = svgDoc.contentDocument;
    let svgRoot = svgDoc.documentElement;

    // Remove old filters if they exist before applying new ones
    let hasSVGPathFilter = svgDoc.querySelector('svg#SVGpathFilter');
    if (hasSVGPathFilter) {
        // Remove the filter
        hasSVGPathFilter.remove();
    }
    let hasSVGTextFilter = svgDoc.querySelector('svg#SVGtextFilter');
    if (hasSVGTextFilter) {
        // Remove the filter
        hasSVGTextFilter.remove();
    }


    // Path filter
    // inject the filter svg element into the svg document
    let fontSize = getComputedStyle(document.body).getPropertyValue('font-size');
    fontSize = parseFloat(fontSize.replace('px', ''));
    let scale = 1 / 61.8 * fontSize;
    scale = Math.min(Math.max(0.001, scale), 7);
    let filter = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // id for this filter
    filter.setAttribute('id', 'SVGpathFilter');
    filter.setAttribute('style', 'visibility: hidden; position: absolute;');
    filter.setAttribute('width', '0');
    filter.setAttribute('height', '0');
    filter.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    filter.setAttribute('version', '1.1');
    filter.innerHTML = `
        <defs>
            <filter id="pathFilter">
                <feGaussianBlur in="SourceGraphic" stdDeviation="${scale * randomFloatRange(3, 4)}"result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 9 -3" result="pathFilter2" />
                <feComposite in="SourceGraphic" in2="pathFilter2" operator="atop"/>
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.1"
                    numOctaves="2"
                    result="turbulence" />
                <feDisplacementMap
                    in2="turbulence"
                    in="pathFilter2"
                    scale="${scale * randomFloatRange(3, 5)}"
                    xChannelSelector="R"
                    yChannelSelector="B" />
            </filter>
        </defs>
    `;
    svgRoot.appendChild(filter);

    // Apply the filter to the paths
    let paths = svgDoc.querySelectorAll('path[id]');
    paths = Array.from(paths).filter(path => !path.id.startsWith('text_'));

    for (let i=0; i<paths.length; i++) {
        paths[i].style.filter = 'url(#pathFilter)';
    }


    // Text filter
    // inject the filter svg element into the svg document
    scale = 1 / 61.8 * fontSize;
    scale = Math.min(Math.max(0.001, scale), 6);
    let textFilter = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // id for this filter
    textFilter.setAttribute('id', 'SVGtextFilter');
    textFilter.setAttribute('style', 'visibility: hidden; position: absolute;');
    textFilter.setAttribute('width', '0');
    textFilter.setAttribute('height', '0');
    textFilter.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    textFilter.setAttribute('version', '1.1');
    textFilter.innerHTML = `
        <defs>
            <filter id="textFilter">
                <feGaussianBlur in="SourceGraphic" stdDeviation="${scale * randomFloatRange(1.6, 1.7)}"result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 9 -3" result="textFilter2" />
                <feComposite in="SourceGraphic" in2="textFilter2" operator="atop"/>
                <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.1"
                    numOctaves="2"
                    result="turbulence" />
                <feDisplacementMap
                    in2="turbulence"
                    in="textFilter2"
                    scale="${scale * randomFloatRange(3, 3.1)}"
                    xChannelSelector="R"
                    yChannelSelector="B" />
            </filter>
        </defs>
    `;
    svgRoot.appendChild(textFilter);

    // Apply the filter to the text elements
    let texts = svgDoc.querySelectorAll('path[id]');
    // filter for id that starts with "text_"
    texts = Array.from(texts).filter(text => text.id.startsWith('text_'));

    for (let i=0; i<texts.length; i++) {
        texts[i].style.filter = 'url(#textFilter)';
    }
}

function removeSVGPathFilter() {
    let svgDoc = document.querySelector('object');
    svgDoc = svgDoc.contentDocument;

    // Check if the filter already exists by checking for svg with id "SVGpathFilter"
    let hasSVGPathFilter = svgDoc.querySelector('svg#SVGpathFilter');
    if (hasSVGPathFilter) {
        // Remove the filter
        hasSVGPathFilter.remove();
    }
    let hasSVGTextFilter = svgDoc.querySelector('svg#SVGtextFilter');
    if (hasSVGTextFilter) {
        // Remove the filter
        hasSVGTextFilter.remove();
    }

    // Remove the filter from the paths
    let paths = svgDoc.querySelectorAll('path[id]');
    paths = Array.from(paths).filter(path => !path.id.startsWith('text_'));
    for (let i=0; i<paths.length; i++) {
        paths[i].style.filter = 'none';
    }

    // Remove the filter from the text elements
    let texts = svgDoc.querySelectorAll('path[id]');
    // filter for id that starts with "text_"
    texts = Array.from(texts).filter(text => text.id.startsWith('text_'));
    for (let i=0; i<texts.length; i++) {
        texts[i].style.filter = 'none';
    }
}



function resetSVGPaths() {
    // Register event listeners for clickable paths
    // Also add the selectable attribute to the paths for tracking
    // And some CSS styling for the paths
    // Lastly, hide the text elements (no spoilers!)
    let svgDoc = document.querySelector('object');
    svgDoc = svgDoc.contentDocument;

    let paths = svgDoc.querySelectorAll('path[id]');
    paths = Array.from(paths).filter(path => !path.id.startsWith('text_') && !path.id.startsWith('mapoutline') && !path.id.startsWith('void'));

    const backgroundColor = getComputedStyle(document.body).getPropertyValue('--background-color');

    for (let i=0; i<paths.length; i++) {
        paths[i].style.fill = backgroundColor || '#fff';
        paths[i].style.cursor = 'pointer';
        paths[i].style.webkitTapHighlightColor = 'transparent';
        paths[i].style.webkitTouchCallout = 'none';
        paths[i].style.webkitUserSelect = 'none';
        paths[i].style.khtmlUserSelect = 'none';
        paths[i].style.mozUserSelect = 'none';
        paths[i].style.msUserSelect = 'none';
        paths[i].style.userSelect = 'none';
        // store whether the path is selectable/available
        paths[i].setAttribute('data-selectable', 'true');

        paths[i].addEventListener('click', handleSelectedAnswer);
        paths[i].addEventListener('touchstart', highlightPathEvent);
        paths[i].addEventListener('touchend', unhighlightPathEvent);
        paths[i].addEventListener('mouseover', highlightPathEvent);
        paths[i].addEventListener('mouseout', unhighlightPathEvent);
    }

    // Hide the text elements
    let texts = svgDoc.querySelectorAll('path[id]');
    texts = Array.from(texts).filter(text => text.id.startsWith('text_'));
    for (let i=0; i<texts.length; i++) {
        texts[i].style.display = 'none';
    }
}
function resetSVGPathsEvents() {
    let svgDoc = document.querySelector('object');
    svgDoc = svgDoc.contentDocument;

    let paths = svgDoc.querySelectorAll('path[id]');
    paths = Array.from(paths).filter(path => !path.id.startsWith('text_') && !path.id.startsWith('mapoutline') && !path.id.startsWith('void'));

    for (let i=0; i<paths.length; i++) {
        paths[i].style.cursor = 'pointer';
        paths[i].addEventListener('click', handleSelectedAnswer);
        paths[i].addEventListener('touchstart', highlightPathEvent);
        paths[i].addEventListener('touchend', unhighlightPathEvent);
        paths[i].addEventListener('mouseover', highlightPathEvent);
        paths[i].addEventListener('mouseout', unhighlightPathEvent);
    }
}

function unhighlightPathEvent(event) {
    if (event.target.getAttribute('data-selectable') === 'false') {
        return;
    }
    const backgroundColor = getComputedStyle(document.body).getPropertyValue('--background-color');
    event.target.style.fill = backgroundColor || '#fff';
}
function highlightPathEvent(event) {
    if (event.target.getAttribute('data-selectable') === 'false') {
        return;
    }
    const highlightColor = getComputedStyle(document.body).getPropertyValue('--path-highlight-color');
    event.target.style.fill = highlightColor || '#fd0';
}
function truthyHighlightPathEvent(event) {
    const truthyColor = getComputedStyle(document.body).getPropertyValue('--path-truthy-color');
    event.target.style.fill = truthyColor || '#0f0';
}
function falsyHighlightPathEvent(event) {
    const falsyColor = getComputedStyle(document.body).getPropertyValue('--path-falsy-color');
    event.target.style.fill = falsyColor || '#f00';
}
function truthyHighlightPathElement(element) {
    const truthyColor = getComputedStyle(document.body).getPropertyValue('--path-truthy-color');
    element.style.fill = truthyColor || '#0f0';
}
function falsyHighlightPathElement(element) {
    const falsyColor = getComputedStyle(document.body).getPropertyValue('--path-falsy-color');
    element.style.fill = falsyColor || '#f00';
}
function disableSVGPathElement(element) {
    // prevent subsequent clicks/events
    element.style.cursor = 'default';
    element.removeEventListener('click', handleSelectedAnswer);
    element.removeEventListener('touchstart', highlightPathEvent);
    element.removeEventListener('touchend', unhighlightPathEvent);
    element.removeEventListener('mouseover', highlightPathEvent);
    element.removeEventListener('mouseout', unhighlightPathEvent);
    element.setAttribute('data-selectable', 'false');
}
function showTextElement(element) {
    element.style.display = 'block';
}

function handleSelectedAnswer(event) {
    unhighlightPathEvent(event);

    // If the quiz is not started, start the quiz
    if (!_AppContainer.timer.interval && _AppContainer.timer.time_elapsed === 0) {
        // New session
        resetSVGPaths();
        if (getSwitchValue('inky-switch')) {
            applySVGPathFilter();
        }

        const currentMapID = getSingleSelectDropdownValue("mapType");
        _AppContainer = new AppContainer({ mapTypeID: currentMapID, locationData: LOCATIONS[currentMapID] });

        // _AppContainer.score.max_value = getMapSVGPathsID().length;
        let id = getMapSVGPathsID();
        // filter for id after split("_")[1] does not contain "alias"
        id = id.filter(id => (!id.split("_")[1] || (id.split("_")[1] && !id.split("_")[1].includes('alias'))));
        _AppContainer.score.max_value = id.length;
        _AppContainer.updateScore();

        // Pick a random id from the map
        let paths = getCurrentlyAvailableSVGPathsID();
        let randomIndex = Math.floor(Math.random() * paths.length);
        let randomID = paths[randomIndex];

        // Set the question
        _AppContainer.question.id_value = randomID;
        _AppContainer.setQuestion(randomID);

        _AppContainer.startTimer();
        return;
    }


    // Check if the clicked path is the correct answer
    let correctAnswer = _AppContainer.question.id_value;
    let aliasAnswers = _AppContainer.question.id_alias;
    console.log(correctAnswer, aliasAnswers);
    if (event.target.id == correctAnswer) {
        _AppContainer.incrementScore();
        _AppContainer.answersLog.correct.push(correctAnswer);
        _AppContainer.answersLog.streak++;
        if (_AppContainer.answersLog.streak > _AppContainer.answersLog.max_streak) {
            _AppContainer.answersLog.max_streak = _AppContainer.answersLog.streak;
        }
        truthyHighlightPathElement(event.target);
        disableSVGPathElement(event.target);
        let textElement = event.target.parentElement.querySelector(`#text_${correctAnswer}`);
        showTextElement(textElement);

        // If there are alias answers, highlight and disable them as well. Alias does not have text elements for now
        if (aliasAnswers.length > 0) {
            for (let i=0; i<aliasAnswers.length; i++) {
                let aliasPath = getMapSVGElements()[aliasAnswers[i]];
                if (!aliasPath) {
                    continue;
                }
                truthyHighlightPathElement(aliasPath);
                disableSVGPathElement(aliasPath);
            }
        }
    }

    else if (aliasAnswers.includes(event.target.id)) {
        _AppContainer.incrementScore();
        _AppContainer.answersLog.correct.push(correctAnswer);
        _AppContainer.answersLog.streak++;
        if (_AppContainer.answersLog.streak > _AppContainer.answersLog.max_streak) {
            _AppContainer.answersLog.max_streak = _AppContainer.answersLog.streak;
        }
        truthyHighlightPathElement(event.target);
        disableSVGPathElement(event.target);
        
        // Highlight the correct path, disable, and show text element for the main answer
        let correctPath = getMapSVGElements()[correctAnswer];
        truthyHighlightPathElement(correctPath);
        disableSVGPathElement(correctPath);
        let textElement = correctPath.parentElement.querySelector(`#text_${correctAnswer}`);
        showTextElement(textElement);

        // // If there are alias answers, highlight and disable them as well. Alias does not have text elements for now
        // if (aliasAnswers.length > 0) {
        //     for (let i=0; i<aliasAnswers.length; i++) {
        //         let aliasPath = getMapSVGElements()[aliasAnswers[i]];
        //         if (!aliasPath) {
        //             continue;
        //         }
        //         truthyHighlightPathElement(aliasPath);
        //         disableSVGPathElement(aliasPath);
        //     }
        // }
    }
    
    
    else {
        let pathMaps = getMapSVGElements();
        let correctPath = pathMaps[correctAnswer];
        falsyHighlightPathElement(correctPath);
        disableSVGPathElement(correctPath);
        _AppContainer.answersLog.incorrect.push([correctAnswer, event.target.id]);
        _AppContainer.answersLog.streak = 0;
        let textElement = correctPath.parentElement.querySelector(`#text_${correctAnswer}`);
        showTextElement(textElement);

        // If there are alias answers, highlight and disable them as well. Alias does not have text elements for now
        if (aliasAnswers.length > 0) {
            for (let i=0; i<aliasAnswers.length; i++) {
                let aliasPath = pathMaps[aliasAnswers[i]];
                if (!aliasPath) {
                    continue;
                }
                falsyHighlightPathElement(aliasPath);
                disableSVGPathElement(aliasPath);
            }
        }
    }


    // Check if all paths have been clicked
    let paths = getCurrentlyAvailableSVGPathsID();
    if (paths.length === 0) {
        _AppContainer.pauseTimer();
        _AppContainer.answersLog.isCompleted = true;
        _AppContainer.saveEntryData();
        _AppContainer.pauseTimer();
        setTimeout(() => {
            _AppContainer.resetQuestion();
            resetSVGPathsEvents();
            

            // New session
            const currentMapID = getSingleSelectDropdownValue("mapType");
            _AppContainer = new AppContainer({ mapTypeID: currentMapID, locationData: LOCATIONS[currentMapID] });
        }, 1500);
    }
    else {
        // Pick a random id from the map
        let randomIndex = Math.floor(Math.random() * paths.length);
        let randomID = paths[randomIndex];

        // Set the question
        _AppContainer.question.id_value = randomID;
        _AppContainer.setQuestion(randomID);
    }
}

// Get all paths that are clickable by default (after reset)
function getMapSVGPathsID() {
    let svgDoc = document.querySelector('object');
    svgDoc = svgDoc.contentDocument;

    let paths = svgDoc.querySelectorAll('path[id]');
    paths = Array.from(paths).filter(path => !path.id.startsWith('text_') && !path.id.startsWith('mapoutline') && !path.id.startsWith('void'));
    let pathsID = [];
    for (let i=0; i<paths.length; i++) {
        pathsID.push(paths[i].id);
    }
    return pathsID;
}
function getCurrentlyAvailableSVGPathsID() {
    let svgDoc = document.querySelector('object');
    svgDoc = svgDoc.contentDocument;

    let paths = svgDoc.querySelectorAll('path[id]');
    paths = Array.from(paths).filter(path => !path.id.startsWith('text_') && !path.id.startsWith('mapoutline') && path.getAttribute('data-selectable') === 'true');
    let pathsID = [];
    for (let i=0; i<paths.length; i++) {
        pathsID.push(paths[i].id);
    }
    return pathsID;
}




// ----- Change Map Type ----- //
function changeMapType() {
    // Check for the current map type
    const newMapID = getSingleSelectDropdownValue("mapType");
    if (newMapID === null) {
        return;
    }

    // Change the map object data attribute of object id "map"
    let mapObject = document.querySelector('object#map');
    mapObject.data = `./assets/${newMapID}.svg`;

    mapObject.onload = () => {
        // Reset the svg paths
        resetSVGPaths();
        if (getSwitchValue('inky-switch')) {
            applySVGPathFilter();
        }
        _AppContainer.saveEntryData();
        _AppContainer.resetAll();


        // Setting up the quiz
        _AppContainer = new AppContainer({ mapTypeID: newMapID, locationData: LOCATIONS[newMapID] });

        // Setting up the quiz
        // _AppContainer.score.max_value = getMapSVGPathsID().length;
        let id = getMapSVGPathsID();
        // filter for id after split("_")[1] does not contain "alias"
        id = id.filter(id => (!id.split("_")[1] || (id.split("_")[1] && !id.split("_")[1].includes('alias'))));
        _AppContainer.score.max_value = id.length;
        _AppContainer.updateScore();
        _AppContainer.resetQuestion();

    };
}




// ----- STATS FUNCTIONS ----- //
function updateCharts() {
    // remove the existing chart and create a new one
    let oldcanvas = document.getElementById('statsCanvas');
    let chartContainer = document.getElementById('chartContainer');
    oldcanvas.remove();
    let ctx = document.createElement('canvas');
    ctx.id = 'statsCanvas';
    chartContainer.appendChild(ctx);


    ctx = document.getElementById('statsCanvas');
    // Calculate the width and height of the chartContainer and use it for the canvas
    let chartContainerStyle = getComputedStyle(chartContainer);
    let chartContainerWidth = parseFloat(chartContainerStyle.width.replace('px', ''));
    let chartContainerHeight = parseFloat(chartContainerStyle.height.replace('px', ''));
    ctx.height = chartContainerHeight;
    ctx.width = chartContainerWidth;

    const mapType = getSingleSelectDropdownValue("mapTypeStatistics");
    if (mapType === null) {
        return;
    }
    // Get the data from local storage, where the key is "aob-geo_{mapType}_*"
    let keys = Object.keys(localStorage);
    let data = [];
    for (let i=0; i<keys.length; i++) {
        if (keys[i].startsWith(`aob-geo_${mapType}_`)) {
            data.push(JSON.parse(localStorage.getItem(keys[i])));
        }
    }
    data = data.filter(entry => entry.answersLog.isCompleted);
    const max_score = Math.max(...data.map(entry => entry.max_score));

    let fontSize = getComputedStyle(document.body).getPropertyValue('font-size');
    fontSize = parseFloat(fontSize.replace('px', '')) || 16;
    
    const chartType = 'scatter';
    // X-axis: time_elapsed_sec
    // Y-axis: score
    let time = data.map(entry => entry.time_elapsed_sec);
    let score = data.map(entry => entry.score);

    let scatterChart = new Chart(ctx, {
        type: chartType,
        data: {
            datasets: [{
                label: 'Score by Time',
                data: time.map((time, index) => ({ x: time, y: score[index] })),
                backgroundColor: '#6e5435DA',
                borderColor: '#5a442a',
                pointRadius: fontSize * 0.25,
                hoverRadius: fontSize * 0.3,
            }]
        },
        options: {
            animation: {
                duration: 160
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Time Taken (s)',
                        font: {
                            size: fontSize,
                            family: "'EB Garamond', 'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif", // or "Juergen-Manuscript" 
                        },
                        color: '#010101'
                    },
                    ticks: {
                        font: {
                            size: fontSize * 0.7,
                            family: "'EB Garamond', 'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif", // or "Juergen-Manuscript"
                        },
                        color: '#010101'
                    },
                    grid: {
                        color: '#56565690',
                    },
                    border: {
                        width: fontSize * 0.1,
                        color: '#333',
                    },
                },
                y: {
                    type: 'linear',
                    position: 'left',
                    suggestedMin: 0,
                    suggestedMax: max_score,
                    title: {
                        display: true,
                        text: 'Score',
                        font: {
                            size: fontSize,
                            family: "'EB Garamond', 'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif", // or "Juergen-Manuscript"
                        },
                        color: '#010101'
                    },
                    ticks: {
                        font: {
                            size: fontSize * 0.7,
                            family: "'EB Garamond', 'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif", // or "Juergen-Manuscript"
                        },
                        color: '#010101'
                    },
                    grid: {
                        color: '#56565690',
                    },
                    border: {
                        width: fontSize * 0.1,
                        color: '#333',
                    },
                }
            },
            plugins: {
                legend: {
                    display: false,
                },
                annotation: {
                    annotations: {
                        lineAtMaxScore: {
                            type: 'line',
                            yMin: max_score,
                            yMax: max_score,
                            borderColor: '#6e5435',
                            borderWidth: fontSize * 0.1,
                            borderDash: [10, 5], // Creates a dotted line pattern
                        }
                    }
                }
            }
        }
    });

    return scatterChart;
}
window.addEventListener('resize', () => {
    // Only update the chart if the statsCanvas is visible
    if (document.getElementById('statsCanvas') && getComputedStyle(document.getElementById('statsCanvas')).visibility === 'visible') {
        updateCharts();
    }
});









// ---------- ON PAGE LOAD - MAIN ---------- //



let _AppContainer = {};

window.onload = async function() {
    // When the page loads, open the default tab
    let lastTab = sessionStorage.getItem('currentTab') || 'HomeTab';
    document.getElementById(lastTab).click();
    document.querySelectorAll(".tab-bar").forEach(pointerScroll);


    setDropdownValue("mapType", "EhrenfestP2V3");


    getCurrentlyAvailableSVGPathsID();
    // Reset the svg paths
    resetSVGPaths();


    // 0.1% chance of toggling the Yogurtland font
    if (Math.random() < 0.001) {
        document.body.classList.toggle('Yurgenschmidt-font');
    }


    // Update the svg filters for text and other elements
    if (getSwitchValue('inky-switch')) {
        applySVGPathFilter();
        updateTextFilter();
        updateHeadingTextFilter();
        updateInputFieldFilter();
        updateBorderFilter();
    }



    // Setting up the quiz
    await fetchLocations();
    
    // Create the AppContainer
    const currentMapID = getSingleSelectDropdownValue("mapType");
    _AppContainer = new AppContainer({ mapTypeID: currentMapID, locationData: LOCATIONS[currentMapID] });


    // Remove all iframe elements in the page
    // Some extensions inject iframes into the page that shift the layout (I'm looking at you, Zotero)
    setTimeout(() => {
        let iframes = document.querySelectorAll('iframe');
        for (let i=0; i<iframes.length; i++) {
            iframes[i].remove();
        }
    }, 1500);




    // Add event listeners for onclick on .spoilerText
    const spoilerTexts = document.querySelectorAll('.spoilerText');
    // on click, toggle the class "showSpoiler"
    spoilerTexts.forEach(spoilerText => {
        spoilerText.addEventListener('click', () => {
            spoilerText.classList.toggle('showSpoiler');
        });
        // Also add tooltip (title): "Hover to reveal, Click to pin the revealed state, and Click again to hide"
        spoilerText.title = "Hover to reveal spoiler, Click to pin the revealed state, and Click again to hide";
    });
}