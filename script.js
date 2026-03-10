const gridDisplay = document.getElementById('grid');
const scoreDisplay = document.getElementById('score');
const timerBar = document.getElementById('timer-bar');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreDisplay = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const bestScoreDisplay = document.getElementById('best-score');
const width = 8;
const fruitTypes = ['🍎', '🍋', '🍇', '🥝', '🍊', '🍑'];
let board = [];
let score = 0;
let timeLeft = 100;
let gameStarted = false;
let countdown;

// Variabili per la selezione e lo swipe
let firstClick = null;
let startX, startY; 

// 1. CREAZIONE DELLA BOARD (Senza match iniziali)
function createBoard() {
    for (let i = 0; i < width * width; i++) {
        let randomFruit;
        let isMatch = true;

        while (isMatch) {
            randomFruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
            isMatch = false;
            if (i % width > 1) {
                if (board[i - 1].innerText === randomFruit && board[i - 2].innerText === randomFruit) isMatch = true;
            }
            if (i >= width * 2) {
                if (board[i - width].innerText === randomFruit && board[i - (width * 2)].innerText === randomFruit) isMatch = true;
            }
        }

        const tile = document.createElement('div');
        tile.setAttribute('id', i);
        tile.classList.add('fruit');
        tile.innerText = randomFruit;
        
        tile.addEventListener('click', handleSelection);
        tile.addEventListener('touchstart', handleTouchStart, {passive: false});
        tile.addEventListener('touchend', handleTouchEnd, {passive: false});

        tile.setAttribute('draggable', true);
        tile.addEventListener('dragstart', (e) => {
            idDragged = parseInt(e.target.id);
            fruitDragged = e.target.innerText;
        });
        tile.addEventListener('dragover', (e) => e.preventDefault());
        tile.addEventListener('drop', dragDrop);
        
        gridDisplay.appendChild(tile);
        board.push(tile);
    }
}

// 2. LOGICA DEL TIMER
function startTimer() {
    if (gameStarted) return;
    gameStarted = true;
    
    countdown = setInterval(() => {
        timeLeft -= 0.3; 
        if (timerBar) timerBar.style.width = timeLeft + '%';

        if (timeLeft <= 0) {
            clearInterval(countdown);
            showGameOver();
        }
    }, 100);
}

// 3. ESECUZIONE SCAMBIO
function executeSwap(id1, id2) {
    if (!gameStarted) startTimer();

    let f1 = board[id1].innerText;
    let f2 = board[id2].innerText;

    board[id1].innerText = f2;
    board[id2].innerText = f1;

    if (!checkMatchesExist()) {
        setTimeout(() => {
            board[id1].innerText = f1;
            board[id2].innerText = f2;
        }, 250);
    }
}

// 4. SELEZIONE E SWIPE
function handleSelection() {
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

function handleTouchStart(e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;
    let diffX = endX - startX;
    let diffY = endY - startY;
    if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) return;
    let id = parseInt(this.id);
    let targetId;
    if (Math.abs(diffX) > Math.abs(diffY)) {
        targetId = diffX > 0 ? id + 1 : id - 1;
    } else {
        targetId = diffY > 0 ? id + width : id - width;
    }
    if (targetId >= 0 && targetId < width * width) {
        const validMoves = [id - 1, id + 1, id - width, id + width];
        if (validMoves.includes(targetId)) executeSwap(id, targetId);
    }
}

let idDragged, fruitDragged;
function dragDrop() {
    let idReplaced = parseInt(this.id);
    const validMoves = [idDragged - 1, idDragged + 1, idDragged - width, idDragged + width];
    if (validMoves.includes(idReplaced)) executeSwap(idDragged, idReplaced);
}

// 5. MATCH E GRAVITÀ
function checkMatchesExist() {
    for (let i = 0; i < 64; i++) {
        if (i % 8 < 6) {
            let row = [i, i+1, i+2];
            let fruit = board[i].innerText;
            if (fruit !== '' && row.every(idx => board[idx].innerText === fruit)) return true;
        }
        if (i < 48) {
            let col = [i, i+width, i+width*2];
            let fruit = board[i].innerText;
            if (fruit !== '' && col.every(idx => board[idx].innerText === fruit)) return true;
        }
    }
    return false;
}

function checkAndDestroy() {
    for (let i = 0; i < 64; i++) {
        if (i % 8 < 6) {
            let row = [i, i+1, i+2];
            let fruit = board[i].innerText;
            if (fruit !== '' && row.every(idx => board[idx].innerText === fruit)) {
                score += 10;
                timeLeft = Math.min(100, timeLeft + 2);
                row.forEach(idx => board[idx].innerText = '');
            }
        }
        if (i < 48) {
            let col = [i, i+width, i+width*2];
            let fruit = board[i].innerText;
            if (fruit !== '' && col.every(idx => board[idx].innerText === fruit)) {
                score += 10;
                timeLeft = Math.min(100, timeLeft + 2);
                col.forEach(idx => board[idx].innerText = '');
            }
        }
    }
    scoreDisplay.innerText = score;
}

function moveDown() {
    for (let i = 0; i < 56; i++) {
        if (board[i + width].innerText === '') {
            board[i + width].innerText = board[i].innerText;
            board[i].innerText = '';
        }
    }
    for (let i = 0; i < 8; i++) {
        if (board[i].innerText === '') {
            board[i].innerText = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
        }
    }
}

// 6. GAME OVER E RESTART
function showGameOver() {
    let savedBest = localStorage.getItem('fruitVibeBest') || 0;
    if (score > savedBest) {
        localStorage.setItem('fruitVibeBest', score);
        savedBest = score;
    }
    finalScoreDisplay.innerHTML = score + "<br><small style='font-size: 1rem; color: #aaa;'>Record: " + savedBest + "</small>";
    gameOverScreen.classList.remove('hidden');
}

restartBtn.addEventListener('click', () => {
    location.reload();
});

// AVVIO
createBoard();
// MOSTRA IL RECORD SUBITO
bestScoreDisplay.innerText = localStorage.getItem('fruitVibeBest') || 0;

setInterval(() => {
    checkAndDestroy();
    moveDown();
}, 100);