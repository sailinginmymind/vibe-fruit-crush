// --- 1. RIFERIMENTI DOM ---
const gridDisplay = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const timerBar = document.getElementById('timer-bar');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const bestScoreDisplay = document.getElementById('best-score');
const mainMenu = document.getElementById('main-menu');
const optionsMenu = document.getElementById('options-menu');
const optionsBtn = document.getElementById('options-btn'); 
const backBtn = document.getElementById('back-to-menu');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const pauseScreen = document.getElementById('pause-screen');
const speedSlider = document.getElementById('speed-slider');
const speedValueLabel = document.getElementById('speed-value');
const themeSelect = document.getElementById('theme-select');
const optionsPauseBtn = document.getElementById('options-pause-btn');
const multiplierDisplay = document.getElementById('multiplier-display');
const quitToMenuBtn = document.getElementById('quit-to-menu-btn');
const quitAfterGameBtn = document.getElementById('quit-after-game-btn');
const modeButtons = document.querySelectorAll('.mode-btn');

// --- 2. VARIABILI DI STATO ---
const width = 8;
let fruitTypes = ['🍎', '🍋', '🍇', '🥝', '🍊', '🍑'];
let board = [];
let score = 0;
let timeLeft = 100;
let gameStarted = false;
let timerActive = false;
let countdown;
let isPaused = false;
let gameSpeed = 0.3;
let comingFromPause = false;
let multiplier = 1;
let comboCount = 0;
let lastMatchTime = 0;
let firstClick = null;
let startX, startY; 
let idDragged;
let currentMode = "60"; 
let isZen = false;
let recordCelebrated = false;

// --- 3. LOGICA NAVIGAZIONE E MENU ---
modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        currentMode = btn.getAttribute('data-mode');
        isZen = currentMode === "zen";
        const recordKey = `bestScore_${currentMode}`;
        const savedBest = localStorage.getItem(recordKey) || 0;
        bestScoreDisplay.innerText = isZen ? "∞" : savedBest;

        score = 0;
        scoreDisplay.innerText = score;
        timeLeft = 100;
        gameStarted = true; 
        timerActive = false;
        isPaused = false;
        recordCelebrated = false;

        if (isZen) {
            timerBar.parentElement.style.display = 'none';
        } else {
            timerBar.parentElement.style.display = 'block';
            timerBar.style.width = '100%';
            timerBar.style.backgroundColor = "#00ffcc";
            gameSpeed = 10 / parseInt(currentMode);
        }

        mainMenu.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        gridDisplay.innerHTML = '';
        board = [];
        createBoard();
    });
});

optionsBtn.addEventListener('click', () => {
    comingFromPause = false;
    mainMenu.classList.add('hidden');
    optionsMenu.classList.remove('hidden');
});

optionsPauseBtn.addEventListener('click', () => {
    comingFromPause = true;
    pauseScreen.classList.add('hidden');
    optionsMenu.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
    optionsMenu.classList.add('hidden');
    if (comingFromPause) pauseScreen.classList.remove('hidden');
    else mainMenu.classList.remove('hidden');
});

pauseBtn.addEventListener('click', () => {
    if (!gameStarted || isPaused) return;
    isPaused = true;
    clearInterval(countdown);
    pauseScreen.classList.remove('hidden');
});

resumeBtn.addEventListener('click', () => {
    isPaused = false;
    pauseScreen.classList.add('hidden');
    if (!isZen && timerActive) startTimer(); 
});

function backToMainMenu() {
    clearInterval(countdown);
    gameStarted = false;
    timerActive = false;
    isPaused = false;
    pauseScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    pauseBtn.classList.add('hidden');
    mainMenu.classList.remove('hidden');
    gridDisplay.innerHTML = '';
    board = [];
    createBoard();
}

quitToMenuBtn.addEventListener('click', backToMainMenu);
quitAfterGameBtn.addEventListener('click', backToMainMenu);

// --- 4. IMPOSTAZIONI ---
speedSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    const labels = { 1: "Normale", 2: "Veloce", 3: "Folle" };
    const speeds = { 1: 0.3, 2: 0.6, 3: 1.0 };
    gameSpeed = speeds[val];
    speedValueLabel.innerText = labels[val];
});

function applyTheme(themeName) {
    const themes = {
        'pastello': ['🍬', '🍭', '🍩', '🧁', '🍰', '🍪'],
        'classic1': ['🍎', '🍋', '🍇', '🥝', '🫐', '🥥'],
        'classic2': ['🍎', '🍋', '🍇', '🥝', '🍊', '🍑'], 
        'animali1': ['🐶', '🦋', '🐢', '🐙', '🐘', '🐥'],
        'animali2': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'],
        'oggetti': ['💎', '🔥', '🌟', '🍀', '🍄', '👻']
    };
    fruitTypes = themes[themeName] || themes['classic2'];
    gridDisplay.innerHTML = '';
    board = [];
    createBoard();
}

themeSelect.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    applyTheme(selectedTheme);
    localStorage.setItem('selectedTheme', selectedTheme);
});

// --- 5. CORE ENGINE ---
function createBoard() {
    for (let i = 0; i < width * width; i++) {
        let randomFruit;
        let isMatch = true;
        while (isMatch) {
            randomFruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
            isMatch = false;
            if (i % width > 1 && board[i - 1]?.innerText === randomFruit && board[i - 2]?.innerText === randomFruit) isMatch = true;
            if (i >= width * 2 && board[i - width]?.innerText === randomFruit && board[i - (width * 2)]?.innerText === randomFruit) isMatch = true;
        }
        const tile = document.createElement('div');
        tile.setAttribute('id', i);
        tile.classList.add('fruit');
        tile.innerText = randomFruit;
        tile.addEventListener('click', handleSelection);
        tile.addEventListener('touchstart', handleTouchStart, {passive: false});
        tile.addEventListener('touchend', handleTouchEnd, {passive: false});
        tile.setAttribute('draggable', true);
        tile.addEventListener('dragstart', (e) => { idDragged = parseInt(e.target.id); });
        tile.addEventListener('dragover', (e) => e.preventDefault());
        tile.addEventListener('drop', dragDrop);
        gridDisplay.appendChild(tile);
        board.push(tile);
    }
}

function startTimer() {
    if (isZen) return;
    timerActive = true;
    clearInterval(countdown); 
    countdown = setInterval(() => {
        if (!isPaused && gameStarted) {
            timeLeft -= gameSpeed; 
            if (timerBar) {
                timerBar.style.width = timeLeft + '%';
                timerBar.style.backgroundColor = (timeLeft < 30) ? "#ff4d4d" : "#00ffcc";
            }
            if (timeLeft <= 0) {
                clearInterval(countdown);
                showGameOver();
            }
        }
    }, 100);
}

function executeSwap(id1, id2) {
    if (isPaused || !gameStarted) return;
    const tile1 = board[id1];
    const tile2 = board[id2];
    const rect1 = tile1.getBoundingClientRect();
    const rect2 = tile2.getBoundingClientRect();
    const diffX = rect2.left - rect1.left;
    const diffY = rect2.top - rect1.top;

    tile1.style.transition = 'transform 0.2s ease-in-out';
    tile2.style.transition = 'transform 0.2s ease-in-out';
    tile1.style.transform = `translate(${diffX}px, ${diffY}px)`;
    tile2.style.transform = `translate(${-diffX}px, ${-diffY}px)`;

    setTimeout(() => {
        let f1 = tile1.innerText;
        let f2 = tile2.innerText;
        let p1 = tile1.classList.contains('power-up');
        let p2 = tile2.classList.contains('power-up');

        tile1.innerText = f2;
        tile2.innerText = f1;
        tile1.classList.toggle('power-up', p2);
        tile2.classList.toggle('power-up', p1);

        tile1.style.transition = 'none';
        tile2.style.transition = 'none';
        tile1.style.transform = '';
        tile2.style.transform = '';
        void tile1.offsetWidth; 

        if (!checkMatchesExist()) {
            tile1.innerText = f1;
            tile2.innerText = f2;
            tile1.classList.toggle('power-up', p1);
            tile2.classList.toggle('power-up', p2);
        }
    }, 200);
}

function checkMatchesExist() {
    for (let i = 0; i < 64; i++) {
        let fruit = board[i].innerText;
        if (fruit === '') continue;
        if (i % 8 < 6 && board[i+1].innerText === fruit && board[i+2].innerText === fruit) return true;
        if (i < 48 && board[i+width].innerText === fruit && board[i+width*2].innerText === fruit) return true;
    }
    return false;
}

function checkAndDestroy() {
    let tilesToDestroy = new Set();
    for (let i = 0; i < 64; i++) {
        let fruit = board[i].innerText;
        if (fruit === '') continue;
        if (i % 8 < 6 && board[i+1].innerText === fruit && board[i+2].innerText === fruit) {
            [i, i+1, i+2].forEach(idx => tilesToDestroy.add(idx));
            if (i % 8 < 5 && board[i+3].innerText === fruit) tilesToDestroy.add(i+3);
        }
        if (i < 48 && board[i+width].innerText === fruit && board[i+width*2].innerText === fruit) {
            [i, i+width, i+width*2].forEach(idx => tilesToDestroy.add(idx));
            if (i < 40 && board[i+width*3].innerText === fruit) tilesToDestroy.add(i+width*3);
        }
    }

    tilesToDestroy.forEach(idx => {
        if (board[idx].classList.contains('power-up')) {
            const fruitTypeToClear = board[idx].innerText;
            board.forEach((tile, tileIdx) => {
                if (tile.innerText === fruitTypeToClear) tilesToDestroy.add(tileIdx);
            });
        }
    });

    if (tilesToDestroy.size > 0) {
        if (tilesToDestroy.size > 10) triggerScreenShake();
        tilesToDestroy.forEach(idx => board[idx].classList.add('exploding'));

        const currentTime = Date.now();
        if (currentTime - lastMatchTime < 1500) {
            comboCount++;
            if (comboCount % 2 === 0) {
                multiplier++;
                updateMultiplierUI();
                showEpicMessage(multiplier, board[Array.from(tilesToDestroy)[0]]);
            }
        } else {
            multiplier = 1;
            comboCount = 0;
            updateMultiplierUI();
        }
        lastMatchTime = currentTime;

        if (!isZen && !timerActive && gameStarted) startTimer();

        setTimeout(() => {
            let totalGained = 0;
            const pointsPerFruit = 20 * multiplier;
            board.forEach(tile => {
                if (tile.classList.contains('exploding')) {
                    createParticles(tile);
                    showScorePopup(tile, pointsPerFruit);
                    tile.innerText = '';
                    tile.classList.remove('exploding', 'power-up');
                    totalGained += pointsPerFruit;
                    if (!isZen) timeLeft = Math.min(100, timeLeft + 2);
                }
            });
            score += totalGained;
            scoreDisplay.innerText = score;

            const recordKey = `bestScore_${currentMode}`;
            const currentBest = parseInt(localStorage.getItem(recordKey)) || 0;
            if (score > currentBest && currentBest > 0 && !recordCelebrated) {
                recordCelebrated = true;
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            }
        }, 250);
        return true;
    }
    return false;
}

// --- 6. FUNZIONI DI SUPPORTO (Grafica, Particelle, Input) ---
function createParticles(tile) {
    const rect = tile.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const fruit = tile.innerText;
    for (let i = 0; i < 6; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.innerText = fruit;
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 50;
        p.style.setProperty('--dx', Math.cos(angle) * velocity + "px");
        p.style.setProperty('--dy', Math.sin(angle) * velocity + "px");
        p.style.left = centerX + 'px';
        p.style.top = centerY + 'px';
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 600);
    }
}

function moveDown() {
    // 1. Fa cadere i frutti esistenti nei buchi
    for (let i = 0; i < 56; i++) {
        if (board[i + width].innerText === '' && board[i].innerText !== '') {
            board[i + width].innerText = board[i].innerText;
            
            // Gestione Power-up durante la caduta
            if (board[i].classList.contains('power-up')) {
                board[i + width].classList.add('power-up');
                board[i].classList.remove('power-up');
            }
            
            board[i].innerText = '';
            
            // AGGIUNGI QUESTE RIGHE: Servono a ridare lo stile "attivo" alla casella
            board[i + width].classList.add('falling');
            setTimeout(() => board[i + width].classList.remove('falling'), 400);
        }
    }

    // 2. Genera nuovi frutti nella riga superiore
    for (let i = 0; i < 8; i++) {
        if (board[i].innerText === '') {
            board[i].innerText = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
            
            if (Math.random() < 0.01) {
                board[i].classList.add('power-up');
            }
            
            // AGGIUNGI QUESTE RIGHE: Senza queste, il nuovo frutto appare su una casella "morta"
            board[i].classList.add('falling');
            setTimeout(() => board[i].classList.remove('falling'), 400);
        }
    }
}

function handleSelection() {
    if (isPaused || !gameStarted) return;
    const currentId = parseInt(this.id);
    if (firstClick === null) {
        firstClick = this;
        this.classList.add('selected');
    } else {
        const firstId = parseInt(firstClick.id);
        if ([firstId - 1, firstId + 1, firstId - width, firstId + width].includes(currentId)) executeSwap(firstId, currentId);
        firstClick.classList.remove('selected');
        firstClick = null;
    }
}

function handleTouchStart(e) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }
function handleTouchEnd(e) {
    if (isPaused || !gameStarted) return;
    let diffX = e.changedTouches[0].clientX - startX;
    let diffY = e.changedTouches[0].clientY - startY;
    if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) return;
    let id = parseInt(this.id);
    let targetId = Math.abs(diffX) > Math.abs(diffY) ? (diffX > 0 ? id + 1 : id - 1) : (diffY > 0 ? id + width : id - width);
    if (targetId >= 0 && targetId < 64) executeSwap(id, targetId);
}

function dragDrop() {
    if (isPaused || !gameStarted) return;
    let idReplaced = parseInt(this.id);
    if ([idDragged-1, idDragged+1, idDragged-width, idDragged+width].includes(idReplaced)) executeSwap(idDragged, idReplaced);
}

function updateMultiplierUI() {
    multiplierDisplay.innerText = `x${multiplier}`;
}

function showEpicMessage(comboLevel, referenceTile) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'combo-popup'; 
    msgDiv.innerText = comboLevel > 5 ? "DIVINO!" : "EPICO!";
    if (referenceTile) {
        const rect = referenceTile.getBoundingClientRect();
        msgDiv.style.left = (rect.left + rect.width / 2) + 'px';
        msgDiv.style.top = rect.top + 'px';
    }
    document.body.appendChild(msgDiv);
    setTimeout(() => msgDiv.remove(), 800);
}

function showScorePopup(tile, value) {
    const rect = tile.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.classList.add('score-popup');
    popup.innerText = `+${value}`;
    popup.style.left = (rect.left + rect.width / 2) + 'px';
    popup.style.top = rect.top + 'px';
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

function triggerScreenShake() {
    gridDisplay.classList.add('shake');
    setTimeout(() => gridDisplay.classList.remove('shake'), 500);
}

function showGameOver() {
    gameStarted = false;
    timerActive = false;
    clearInterval(countdown);
    const recordKey = `bestScore_${currentMode}`;
    let savedBest = localStorage.getItem(recordKey) || 0;
    if (score > savedBest && !isZen) localStorage.setItem(recordKey, score);
    finalScoreDisplay.innerHTML = `${score}<br><small>Record: ${localStorage.getItem(recordKey) || score}</small>`;
    gameOverScreen.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
}

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    const activeBtn = Array.from(modeButtons).find(b => b.dataset.mode === currentMode);
    if (activeBtn) activeBtn.click();
});

// --- 7. INITIALIZATION ---
const savedTheme = localStorage.getItem('selectedTheme');
applyTheme(savedTheme || 'classic2');

setInterval(() => { 
    if (!isPaused && gameStarted) { 
        checkAndDestroy(); 
        moveDown(); 
    } 
}, 100);