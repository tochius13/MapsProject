/* ==========================================
   app.js — CSUN Campus Map Quiz
   Main game logic: map setup, quiz flow,
   scoring, timer, high score, animations.
   ========================================== */

/* =====================================================
   GAME STATE VARIABLES
   ===================================================== */
let map;                    // Google Maps instance
let currentQuestion = 0;    // Index of the active question (0–4)
let correctCount    = 0;    // Number of correct answers this round
let timerInterval   = null; // Handle for the running timer
let elapsedTime     = 0;    // Seconds elapsed this round
let gameActive      = false;// Blocks clicks between rounds
let drawnRects      = [];   // Rectangles drawn on map (cleared on restart)

/* Load persisted high score from localStorage (null if first ever game) */
let highScore = localStorage.getItem('csun_quiz_hs')
                ? parseInt(localStorage.getItem('csun_quiz_hs'))
                : null;


/* =====================================================
   GOOGLE MAPS CALLBACK
   Called automatically by the Maps API after loading.
   ===================================================== */
function initMap() {

    /* Create the map centered on CSUN campus */
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 34.2414, lng: -118.5289 },
        zoom:   17,

        /* Disable ALL panning and zooming per project requirements */
        disableDefaultUI:       true,
        gestureHandling:        'none',
        zoomControl:            false,
        scrollwheel:            false,
        disableDoubleClickZoom: true,
        draggable:              false,
        keyboardShortcuts:      false
    });

    /* Listen for double-clicks — this is the player's input method */
    map.addListener('dblclick', function(event) {
        if (!gameActive) return; // Ignore clicks when game is not running
        handleGuess(event.latLng);
    });

    /* Kick off the first game */
    startGame();
}


/* =====================================================
   START / RESTART GAME
   Resets all state and begins round 1.
   ===================================================== */
function startGame() {
    currentQuestion = 0;
    correctCount    = 0;
    elapsedTime     = 0;
    gameActive      = true;

    /* Clear rectangles left over from the previous game */
    drawnRects.forEach(function(rect) { rect.setMap(null); });
    drawnRects = [];

    /* Reset sidebar UI */
    $('#question-list').empty();
    $('#score-display').removeClass('visible').hide();
    $('#restart-btn').hide();
    $('#new-hs-badge').hide();
    $('#timer').text('0');
    $('#progress-bar').css('width', '0%');

    /* Display stored high score (or "--" if none yet) */
    $('#high-score-val').text(highScore !== null ? highScore : '--');

    /* Show the first question */
    showQuestion(0);

    /* Start the countdown timer */
    clearInterval(timerInterval);
    timerInterval = setInterval(function() {
        elapsedTime++;
        $('#timer').text(elapsedTime);
    }, 1000);
}


/* =====================================================
   SHOW QUESTION
   Appends the current question label to the sidebar.
   ===================================================== */
function showQuestion(index) {
    var loc = locations[index];

    $('<div>')
        .addClass('q-item')
        .attr('id', 'q-' + index)
        .text('Where is ' + loc.name + '?')
        .appendTo('#question-list');
}


/* =====================================================
   HANDLE GUESS
   Called on every valid double-click while gameActive.
   Checks correctness, draws the rectangle, updates UI.
   ===================================================== */
function handleGuess(latLng) {
    var loc    = locations[currentQuestion];
    var bounds = loc.bounds;
    var lat    = latLng.lat();
    var lng    = latLng.lng();

    /* --- Correctness check ---
       The click is correct if it lands inside the building's bounding box. */
    var isCorrect = lat >= bounds.south && lat <= bounds.north &&
                    lng >= bounds.west  && lng <= bounds.east;

    /* --- Draw rectangle on map ---
       Green = correct, Red = wrong */
    var strokeColor = isCorrect ? '#1a8a3a' : '#aa1111';
    var fillColor   = isCorrect ? '#00dd55' : '#ff3333';

    var rect = new google.maps.Rectangle({
        bounds: new google.maps.LatLngBounds(
            { lat: bounds.south, lng: bounds.west },
            { lat: bounds.north, lng: bounds.east }
        ),
        strokeColor:   strokeColor,
        strokeOpacity: 0.9,
        strokeWeight:  2,
        fillColor:     fillColor,
        fillOpacity:   0,           // Start transparent; fade in below
        map:           map
    });
    drawnRects.push(rect);

    /* Fade the rectangle in using a JS interval */
    var opacity = 0;
    var fadeIn = setInterval(function() {
        opacity = Math.min(opacity + 0.05, 0.38);
        rect.setOptions({ fillOpacity: opacity });
        if (opacity >= 0.38) clearInterval(fadeIn);
    }, 30);

    /* --- Sidebar feedback --- */
    var feedbackEl = $('<div>');

    if (isCorrect) {
        correctCount++;
        feedbackEl.addClass('answer-correct').text('Your answer is correct!!');

        /* Sidebar: pulse + flash green */
        $('#sidebar').addClass('anim-flash-green anim-pulse');
        setTimeout(function() {
            $('#sidebar').removeClass('anim-flash-green anim-pulse');
        }, 650);

    } else {
        feedbackEl.addClass('answer-wrong').text('Sorry, wrong location.');

        /* Sidebar: shake + flash red */
        $('#sidebar').addClass('anim-flash-red anim-shake');
        setTimeout(function() {
            $('#sidebar').removeClass('anim-flash-red anim-shake');
        }, 500);
    }

    $('#question-list').append(feedbackEl);

    /* --- Advance to next question --- */
    currentQuestion++;

    /* Update progress bar */
    var pct = (currentQuestion / locations.length) * 100;
    $('#progress-bar').css('width', pct + '%');

    if (currentQuestion >= locations.length) {
        /* All questions answered — end the game after a brief pause */
        setTimeout(endGame, 600);
    } else {
        showQuestion(currentQuestion);
    }
}


/* =====================================================
   END GAME
   Stops timer, checks high score, shows final results.
   ===================================================== */
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);

    var incorrect = locations.length - correctCount;

    /* --- High score check (lowest time wins) --- */
    if (highScore === null || elapsedTime < highScore) {
        highScore = elapsedTime;
        localStorage.setItem('csun_quiz_hs', highScore);
        $('#high-score-val').text(highScore);
        $('#new-hs-badge').fadeIn(400);
    }

    /* --- Show final score with fade-in --- */
    var $score = $('#score-display');
    $score.text(correctCount + ' Correct, ' + incorrect + ' Incorrect');
    $score.show();

    /* Trigger CSS transition by adding .visible on the next paint */
    requestAnimationFrame(function() {
        $score.addClass('visible');
    });

    /* Show restart button */
    $('#restart-btn').delay(400).fadeIn(400);
}


/* =====================================================
   RESTART BUTTON
   ===================================================== */
$(document).ready(function() {
    $('#restart-btn').on('click', function() {
        startGame();
    });
});