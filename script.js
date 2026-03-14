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
let gameStarted = false;   // Indica se siamo in partita
let timerActive = false;    // Indica se il tempo sta scorrendo
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

// --- 3. LOGICA NAVIGAZIONE E MENU ---

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        currentMode = btn.getAttribute('data-mode');
        isZen = currentMode === "zen";
        
        // Reset stato partita
        score = 0;
        scoreDisplay.innerText = score;
        timeLeft = 100;
        gameStarted = true; 
        timerActive = false; // Il timer aspetta la prima mossa
        isPaused = false;

        // Reset Grafica Timer
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

        // Ricrea la griglia per la nuova partita
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
    if (comingFromPause) {
        pauseScreen.classList.remove('hidden');
    } else {
        mainMenu.classList.remove('hidden');
    }
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
    // Riprende il timer solo se era già stato attivato prima della pausa
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
    
    // Se il gioco è avviato o siamo nel menu, resettiamo la griglia per mostrare i nuovi frutti
    gridDisplay.innerHTML = '';
    board = [];
    createBoard();
}

themeSelect.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;
    applyTheme(selectedTheme);
    // SALVATAGGIO: Scriviamo la scelta nella memoria del browser
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
    timerActive = true; // Segna il timer come attivato
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

    // 1. Salviamo lo stato del testo
    let f1 = board[id1].innerText;
    let f2 = board[id2].innerText;

    // 2. Salviamo lo stato del Power-Up (vero o falso)
    let p1 = board[id1].classList.contains('power-up');
    let p2 = board[id2].classList.contains('power-up');

    // 3. Eseguiamo lo scambio del testo
    board[id1].innerText = f2;
    board[id2].innerText = f1;

    // 4. Eseguiamo lo scambio delle classi
    if (p2) board[id1].classList.add('power-up'); 
    else board[id1].classList.remove('power-up');

    if (p1) board[id2].classList.add('power-up'); 
    else board[id2].classList.remove('power-up');

    // 5. Controllo se lo scambio ha creato un match
    if (!checkMatchesExist()) {
        setTimeout(() => {
            // Se non c'è match, annulliamo tutto e riportiamo indietro testo e classi
            board[id1].innerText = f1;
            board[id2].innerText = f2;
            
            if (p1) board[id1].classList.add('power-up');
            else board[id1].classList.remove('power-up');
            
            if (p2) board[id2].classList.add('power-up');
            else board[id2].classList.remove('power-up');
        }, 250);
    }
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
function createParticles(tile) {
    const rect = tile.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const fruit = tile.innerText; // Usa l'emoji del frutto stesso per le particelle!

    // Crea 6 piccoli frammenti
    for (let i = 0; i < 6; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.innerText = fruit;
        
        // Calcola una direzione casuale per il volo
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 50;
        const dx = Math.cos(angle) * velocity + "px";
        const dy = Math.sin(angle) * velocity + "px";

        p.style.setProperty('--dx', dx);
        p.style.setProperty('--dy', dy);
        p.style.left = centerX + 'px';
        p.style.top = centerY + 'px';

        document.body.appendChild(p);

        // Rimuove la particella dal DOM dopo l'animazione
        setTimeout(() => p.remove(), 600);
    }
}
function checkAndDestroy() {
    let matchFound = false;
    
    // 1. Fase di scansione: identifichiamo i tris e aggiungiamo la classe 'exploding'
    for (let i = 0; i < 64; i++) {
        let fruit = board[i].innerText;
        if (fruit === '') continue;
        let rowMatch = (i % 8 < 6 && board[i+1].innerText === fruit && board[i+2].innerText === fruit);
        let colMatch = (i < 48 && board[i+width].innerText === fruit && board[i+width*2].innerText === fruit);
        
        if (rowMatch || colMatch) {
            matchFound = true;
            if (!isZen && !timerActive && gameStarted) startTimer();

            if (rowMatch) [i, i+1, i+2].forEach(idx => board[idx].classList.add('exploding'));
            if (colMatch) [i, i+width, i+width*2].forEach(idx => board[idx].classList.add('exploding'));
        }
    }

    if (matchFound) {
        // 2. LOGICA POWER-UP (Solo se il frutto speciale è coinvolto nell'esplosione)
        let specialExplosion = false;
        board.forEach(tile => {
            if (tile.classList.contains('exploding') && tile.classList.contains('power-up')) {
                const typeToDestroy = tile.innerText;
                specialExplosion = true;
                
                // Cerchiamo tutti i frutti dello stesso tipo sulla board
                board.forEach(t => {
                    if (t.innerText === typeToDestroy) {
                        t.classList.add('exploding');
                    }
                });
            }
        });

        // Se scoppiano molti frutti (grazie al potere o a grandi incastri), trema lo schermo
        const totalExploding = board.filter(t => t.classList.contains('exploding')).length;
        if (totalExploding > 10) triggerScreenShake();

        // 3. Gestione Combo e Moltiplicatore
        const currentTime = Date.now();
        if (currentTime - lastMatchTime < 1500) {
            comboCount++;
            if (comboCount % 2 === 0) {
                multiplier++;
                updateMultiplierUI();
                showEpicMessage(multiplier); // Usa la funzione che non dice "Bravo" per i tris scarsi
            }
        } else {
            multiplier = 1;
            comboCount = 0;
            updateMultiplierUI();
        }
        lastMatchTime = currentTime;

        // 4. Esecuzione visiva dell'esplosione
        setTimeout(() => {
            board.forEach(tile => {
                if (tile.classList.contains('exploding')) {
                    createParticles(tile); 
                    
                    const pointsGained = 10 * multiplier;
                    showScorePopup(tile, pointsGained);
                    
                    tile.innerText = '';
                    tile.classList.remove('exploding');
                    tile.classList.remove('power-up'); // Fondamentale: consuma il potere
                    
                    score += pointsGained;
                    if (!isZen) timeLeft = Math.min(100, timeLeft + 2);
                }
            });
            scoreDisplay.innerText = score;
        }, 250);
    }
}

function moveDown() {
    // 1. Fa cadere i frutti esistenti nei buchi
    for (let i = 0; i < 56; i++) {
        if (board[i + width].innerText === '' && board[i].innerText !== '') {
            board[i + width].innerText = board[i].innerText;
            // Se il frutto che cadeva era un power-up, sposta anche la classe
            if (board[i].classList.contains('power-up')) {
                board[i + width].classList.add('power-up');
                board[i].classList.remove('power-up');
            }
            board[i].innerText = '';
            board[i + width].classList.add('falling');
            setTimeout(() => board[i + width].classList.remove('falling'), 400);
        }
    }

    // 2. Genera nuovi frutti nella riga superiore
    for (let i = 0; i < 8; i++) {
        if (board[i].innerText === '') {
            board[i].innerText = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
            
            // Probabilità Power-Up (5%)
            if (Math.random() < 0.01) {
                board[i].classList.add('power-up');
            }

            board[i].classList.add('falling');
            setTimeout(() => board[i].classList.remove('falling'), 400);
        }
    }
}
function updateMultiplierUI() {
    multiplierDisplay.innerText = `x${multiplier}`;
    multiplierDisplay.classList.add('multiplier-pop');
    setTimeout(() => multiplierDisplay.classList.remove('multiplier-pop'), 200);
    if (multiplier > 5) multiplierDisplay.style.color = "#ff0000";
    else if (multiplier > 2) multiplierDisplay.style.color = "#ff00ff";
    else multiplierDisplay.style.color = "#00ffcc";
}

// Funzione per mostrare messaggi sempre più epici
function showEpicMessage(comboLevel) {
    const messages = [
        // Abbiamo rimosso x2 (Bravo), ora si parte da x3
        { text: "INCREDIBILE!", color: "#00ffcc" }, // x3
        { text: "ECLATANTE!", color: "#ffff00" },   // x4
        { text: "EPICO!", color: "#ff00ff" },       // x5
        { text: "DIVINO!", color: "#ff0000" }       // x6+
    ];

    // Sottraiamo 3 invece di 2. 
    // Se comboLevel è 2 (un tris veloce), level sarà -1 e la funzione si fermerà.
    const level = Math.min(comboLevel - 3, messages.length - 1);
    
    if (level < 0) return; // Zitto per tris semplici e piccole combo

    const msgData = messages[level];
    const msgDiv = document.createElement('div');
    msgDiv.className = 'epic-feedback';
    msgDiv.innerText = msgData.text;
    msgDiv.style.color = msgData.color;
    msgDiv.style.textShadow = `0 0 20px ${msgData.color}`;
    
    document.body.appendChild(msgDiv);
    setTimeout(() => msgDiv.remove(), 800);
}

// Funzione aggiornata per il calcolo punti dinamico
function checkAndDestroy() {
    let matchFound = false;
    let tilesToDestroy = new Set();

    // 1. Identifica i match normali
    for (let i = 0; i < 64; i++) {
        let fruit = board[i].innerText;
        if (fruit === '') continue;
        
        if (i % 8 < 6 && board[i+1].innerText === fruit && board[i+2].innerText === fruit) {
            [i, i+1, i+2].forEach(idx => tilesToDestroy.add(idx));
            if (i % 8 < 5 && board[i+3].innerText === fruit) tilesToDestroy.add(i+3);
            if (i % 8 < 4 && board[i+3].innerText === fruit && board[i+4].innerText === fruit) tilesToDestroy.add(i+4);
        }
        if (i < 48 && board[i+width].innerText === fruit && board[i+width*2].innerText === fruit) {
            [i, i+width, i+width*2].forEach(idx => tilesToDestroy.add(idx));
            if (i < 40 && board[i+width*3].innerText === fruit) tilesToDestroy.add(i+width*3);
            if (i < 32 && board[i+width*3].innerText === fruit && board[i+width*4].innerText === fruit) tilesToDestroy.add(i+width*4);
        }
    }

    // 2. LOGICA POWER-UP: Se un frutto nel match è speciale, distruggi tutti i simili
    tilesToDestroy.forEach(idx => {
        if (board[idx].classList.contains('power-up')) {
            const fruitTypeToClear = board[idx].innerText;
            board.forEach((tile, tileIdx) => {
                if (tile.innerText === fruitTypeToClear) {
                    tilesToDestroy.add(tileIdx);
                }
            });
        }
    });

    if (tilesToDestroy.size > 0) {
        matchFound = true;
        
        // Se distruggiamo più di 10 frutti in un colpo, scuotiamo lo schermo!
        if (tilesToDestroy.size > 10) triggerScreenShake();

        tilesToDestroy.forEach(idx => board[idx].classList.add('exploding'));

        const currentTime = Date.now();
        if (currentTime - lastMatchTime < 1500) {
            comboCount++;
            if (comboCount % 2 === 0) {
                multiplier++;
                updateMultiplierUI();
                showEpicMessage(multiplier);
            }
        } else {
            multiplier = 1;
            comboCount = 0;
            updateMultiplierUI();
        }
        lastMatchTime = currentTime;

        if (!isZen && !timerActive && gameStarted) startTimer();

        setTimeout(() => {
            let basePointsPerFruit = 20;
            let bonusExtra = tilesToDestroy.size > 3 ? 10 : 0;
            
            let totalGained = 0;
            board.forEach(tile => {
                if (tile.classList.contains('exploding')) {
                    createParticles(tile);
                    
                    let points = (basePointsPerFruit + bonusExtra) * multiplier;
                    totalGained += points;
                    showScorePopup(tile, points);
                    
                    tile.innerText = '';
                    tile.classList.remove('exploding');
                    tile.classList.remove('power-up'); // Rimuoviamo la classe speciale
                    if (!isZen) timeLeft = Math.min(100, timeLeft + 2);
                }
            });
            score += totalGained;
            scoreDisplay.innerText = score;
        }, 250);
    }
}
// --- 6. INPUT HANDLERS ---

function handleSelection() {
    if (isPaused || !gameStarted) return;
    const currentId = parseInt(this.id);
    if (firstClick === null) {
        firstClick = this;
        this.classList.add('selected');
    } else {
        const firstId = parseInt(firstClick.id);
        const validMoves = [firstId - 1, firstId + 1, firstId - width, firstId + width];
        if (validMoves.includes(currentId)) executeSwap(firstId, currentId);
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
    if (targetId >= 0 && targetId < 64 && [id-1, id+1, id-width, id+width].includes(targetId)) executeSwap(id, targetId);
}

function dragDrop() {
    if (isPaused || !gameStarted) return;
    let idReplaced = parseInt(this.id);
    if ([idDragged-1, idDragged+1, idDragged-width, idDragged+width].includes(idReplaced)) executeSwap(idDragged, idReplaced);
}
// Funzione per far apparire il testo del punteggio (punto 4)
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

// Funzione modificata per far apparire le combo (punto 4)
function showComboText(text) {
    const comboDiv = document.createElement('div');
    comboDiv.classList.add('score-popup');
    comboDiv.style.color = "#ff00ff"; // Fucsia per le combo!
    comboDiv.innerText = text;
    comboDiv.style.left = '50%';
    comboDiv.style.top = '40%';
    comboDiv.style.fontSize = '2.5rem';
    document.body.appendChild(comboDiv);
    setTimeout(() => comboDiv.remove(), 800);
}
// --- 7. FINE PARTITA ---

function showGameOver() {
    gameStarted = false;
    timerActive = false;
    clearInterval(countdown);
    let recordText = "";
    if (!isZen) {
        const recordKey = `bestScore_${currentMode}`;
        let savedBest = localStorage.getItem(recordKey) || 0;
        if (score > savedBest) {
            localStorage.setItem(recordKey, score);
            savedBest = score;
        }
        recordText = `Record (${currentMode}s): ${savedBest}`;
    } else {
        recordText = "Modalità Zen";
    }
    finalScoreDisplay.innerHTML = `${score}<br><small style="font-size: 1rem; color: #aaa;">${recordText}</small>`;
    gameOverScreen.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
}

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.add('hidden');
    // Il reset completo viene gestito dal click simulato sul bottone modalità
    const activeBtn = Array.from(modeButtons).find(b => b.dataset.mode === currentMode);
    if (activeBtn) activeBtn.click();
});
function triggerScreenShake() {
    gridDisplay.classList.add('shake');
    // Rimuove la classe dopo mezzo secondo così può essere riutilizzata
    setTimeout(() => gridDisplay.classList.remove('shake'), 500);
}
// --- 8. INITIALIZATION ---

// CARICAMENTO TEMA: Controlla se c'è un tema salvato
const savedTheme = localStorage.getItem('selectedTheme');
if (savedTheme) {
    themeSelect.value = savedTheme; // Imposta il menu a tendina visivamente
    applyTheme(savedTheme);         // Applica i frutti salvati
} else {
    applyTheme('classic2');         // Default se è la prima volta
}

// Nota: createBoard() viene già chiamata dentro applyTheme(), 
// quindi non serve chiamarla di nuovo qui fuori.

// Loop principale
setInterval(() => { 
    if (!isPaused && gameStarted) { 
        checkAndDestroy(); 
        moveDown(); 
    } 
}, 100);