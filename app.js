/* app.js — CSUN Campus Map Quiz */

let map, timerInterval;
let currentQ = 0, correct = 0, elapsed = 0, streak = 0;
let gameActive = false;
let drawnRects = [];
let difficulty = 'medium';
let activeLocations = [];
let hintsLeft = 0;
let highScore = localStorage.getItem('csun_hs') ? parseInt(localStorage.getItem('csun_hs')) : null;

const HINTS    = { easy: 2, medium: 1, hard: 0 };
const PENALTIES= { easy: 5, medium: 10, hard: 0 };

/* ---- Difficulty selection ---- */
function selectDifficulty(diff) {
    difficulty = diff;
    activeLocations = diff === 'hard'
        ? [...locations].sort(() => Math.random() - 0.5)
        : [...locations];
    $('#difficulty-screen').fadeOut(300, startGame);
}

/* ---- Google Maps init ---- */
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 34.2414, lng: -118.5289 }, zoom: 17,
        disableDefaultUI: true, gestureHandling: 'none',
        draggable: false, disableDoubleClickZoom: true
    });
    map.addListener('dblclick', e => { if (gameActive) handleGuess(e.latLng); });
}

/* ---- Start game ---- */
function startGame() {
    currentQ = correct = elapsed = streak = 0;
    gameActive = true;
    hintsLeft = HINTS[difficulty];

    drawnRects.forEach(r => r.setMap(null));
    drawnRects = [];

    $('#question-list').empty();
    $('#score-display').removeClass('visible').hide();
    $('#restart-btn, #new-hs-badge, #streak-display').hide();
    $('#timer').text('0');
    $('#progress-bar').css('width', '0%');
    $('#high-score-val').text(highScore ?? '--');

    const labels = { easy: '🟢 Easy', medium: '🟡 Medium', hard: '🔴 Hard' };
    $('#diff-badge').text(labels[difficulty]).show();

    updateHintBtn();
    $('#hint-btn').toggle(difficulty !== 'hard');

    showQuestion();
    clearInterval(timerInterval);
    timerInterval = setInterval(() => $('#timer').text(++elapsed), 1000);
}

/* ---- Show current question ---- */
function showQuestion() {
    $('<div>').addClass('q-item')
        .text('Where is ' + activeLocations[currentQ].name + '?')
        .appendTo('#question-list');
}

/* ---- Hint: show a text clue ---- */
function useHint() {
    if (!hintsLeft || !gameActive) return;
    hintsLeft--;
    elapsed += PENALTIES[difficulty];
    updateHintBtn();

    const clue = activeLocations[currentQ].hint;
    $('<div>').addClass('hint-text').text('💡 ' + clue).appendTo('#question-list');
}

function updateHintBtn() {
    $('#hint-btn')
        .prop('disabled', !hintsLeft)
        .toggleClass('hint-empty', !hintsLeft)
        .text(hintsLeft ? `💡 Hint (${hintsLeft} left · +${PENALTIES[difficulty]}s)` : 'No Hints Left');
}

/* ---- Handle a guess ---- */
function handleGuess(latLng) {
    const loc = activeLocations[currentQ];
    const { north, south, east, west } = loc.bounds;
    const lat = latLng.lat(), lng = latLng.lng();
    const isCorrect = lat >= south && lat <= north && lng >= west && lng <= east;

    /* Draw result rectangle */
    const rect = new google.maps.Rectangle({
        bounds: new google.maps.LatLngBounds({ lat: south, lng: west }, { lat: north, lng: east }),
        strokeColor: isCorrect ? '#1a8a3a' : '#aa1111',
        strokeOpacity: 0.9, strokeWeight: 2,
        fillColor: isCorrect ? '#00dd55' : '#ff3333',
        fillOpacity: 0, map
    });
    drawnRects.push(rect);
    let op = 0;
    const fade = setInterval(() => { rect.setOptions({ fillOpacity: op = Math.min(op + 0.05, 0.38) }); if (op >= 0.38) clearInterval(fade); }, 30);

    /* Feedback */
    if (isCorrect) {
        correct++;
        streak++;
        $('<div>').addClass('answer-correct').text('Correct!').appendTo('#question-list');
        $('#sidebar').addClass('anim-flash-green anim-pulse');
        setTimeout(() => $('#sidebar').removeClass('anim-flash-green anim-pulse'), 650);
    } else {
        streak = 0;
        $('<div>').addClass('answer-wrong').text('Wrong location.').appendTo('#question-list');
        $('#sidebar').addClass('anim-flash-red anim-shake');
        setTimeout(() => $('#sidebar').removeClass('anim-flash-red anim-shake'), 500);
    }

    /* Streak display */
    if (streak >= 2) {
        $('#streak-display').text(`🔥 ${streak} in a row!`)
            .removeClass('streak-pop').show();
        void $('#streak-display')[0].offsetWidth;
        $('#streak-display').addClass('streak-pop');
    } else {
        $('#streak-display').hide();
    }

    /* Advance */
    currentQ++;
    $('#progress-bar').css('width', (currentQ / activeLocations.length * 100) + '%');
    currentQ >= activeLocations.length ? setTimeout(endGame, 600) : showQuestion();
}

/* ---- End game ---- */
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    $('#hint-btn').hide();

    if (highScore === null || elapsed < highScore) {
        highScore = elapsed;
        localStorage.setItem('csun_hs', highScore);
        $('#high-score-val').text(highScore);
        $('#new-hs-badge').fadeIn(400);
    }

    $('#score-display').text(`${correct} Correct, ${activeLocations.length - correct} Incorrect`).show();
    requestAnimationFrame(() => $('#score-display').addClass('visible'));
    $('#restart-btn').delay(400).fadeIn(400);
}

/* ---- Restart ---- */
$(document).ready(() => {
    $('#restart-btn').on('click', () => {
        $('#restart-btn').hide();
        $('#difficulty-screen').fadeIn(300);
    });
    $('#hint-btn').on('click', useHint);
});