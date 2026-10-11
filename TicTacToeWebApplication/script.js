const cells = Array.from(document.querySelectorAll(".cell"));
const gameStatus = document.getElementById("gameStatus");
const turnSymbol = document.getElementById("turnSymbol");
const turnTag = document.getElementById("turnTag");
const twoPlayerModeButton = document.getElementById("twoPlayerMode");
const computerModeButton = document.getElementById("computerMode");
const newGameButton = document.getElementById("newGameButton");
const resetButton = document.getElementById("resetButton");
const scoreXDisplay = document.getElementById("scoreX");
const scoreODisplay = document.getElementById("scoreO");
const scoreDrawsDisplay = document.getElementById("scoreDraws");
const playerOName = document.getElementById("playerOName");
const modeNote = document.getElementById("modeNote");
const roundCount = document.getElementById("roundCount");

const winningLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

let board = Array(9).fill("");
let currentPlayer = "X";
let gameOver = false;
let isComputerMode = false;
let computerTurnTimeout = null;
let nextRoundTimeout = null;
let roundNumber = 1;
const scores = { X: 0, O: 0, draws: 0 };

function getWinningLine(player, currentBoard = board) {
    return winningLines.find(line => line.every(index => currentBoard[index] === player)) || null;
}

function updateBoard() {
    cells.forEach((cell, index) => {
        const mark = board[index];
        cell.textContent = mark;
        cell.classList.toggle("mark-o", mark === "O");
        cell.classList.toggle("is-winning", cell.dataset.winning === "true");
        cell.setAttribute("aria-label", `Row ${Math.floor(index / 3) + 1}, column ${index % 3 + 1}, ${mark || "empty"}`);
        cell.disabled = Boolean(mark) || gameOver || (isComputerMode && currentPlayer === "O");
    });
}

function updateTurnDisplay(message = null) {
    turnSymbol.textContent = currentPlayer;
    turnSymbol.classList.toggle("mark-o", currentPlayer === "O");

    if (message) {
        gameStatus.textContent = message;
    } else if (isComputerMode && currentPlayer === "O") {
        gameStatus.textContent = "Computer is thinking";
    } else {
        gameStatus.textContent = `${currentPlayer}'s turn`;
    }

    turnTag.textContent = currentPlayer === "X" ? "PLAYER 1" : isComputerMode ? "COMPUTER" : "PLAYER 2";
}

function updateScores() {
    scoreXDisplay.textContent = scores.X;
    scoreODisplay.textContent = scores.O;
    scoreDrawsDisplay.textContent = scores.draws;
    roundCount.textContent = `ROUND ${String(roundNumber).padStart(2, "0")}`;
}

function endGame() {
    const winningLine = getWinningLine(currentPlayer);

    if (winningLine) {
        gameOver = true;
        scores[currentPlayer] += 1;
        winningLine.forEach(index => {
            cells[index].dataset.winning = "true";
        });
        updateTurnDisplay(isComputerMode && currentPlayer === "O" ? "Computer wins!" : `${currentPlayer} wins!`);
    } else if (board.every(Boolean)) {
        gameOver = true;
        scores.draws += 1;
        updateTurnDisplay("It's a draw!");
    }

    if (gameOver) {
        updateScores();
        updateBoard();
        nextRoundTimeout = window.setTimeout(startNewGame, 1800);
        return true;
    }

    return false;
}

function playMove(index) {
    if (gameOver || board[index] || (isComputerMode && currentPlayer === "O")) {
        return;
    }

    board[index] = currentPlayer;
    cells[index].classList.add("is-last-move");
    if (endGame()) {
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateTurnDisplay();
    updateBoard();

    if (isComputerMode && currentPlayer === "O") {
        computerTurnTimeout = window.setTimeout(playComputerMove, 420);
    }
}

function findCompletingMove(player) {
    for (const line of winningLines) {
        const emptyCells = line.filter(index => !board[index]);
        const playerCells = line.filter(index => board[index] === player);

        if (emptyCells.length === 1 && playerCells.length === 2) {
            return emptyCells[0];
        }
    }

    return -1;
}

function chooseComputerMove() {
    const winningMove = findCompletingMove("O");
    if (winningMove !== -1) {
        return winningMove;
    }

    const blockingMove = findCompletingMove("X");
    if (blockingMove !== -1) {
        return blockingMove;
    }

    if (!board[4]) {
        return 4;
    }

    const openCorners = [0, 2, 6, 8].filter(index => !board[index]);
    if (openCorners.length > 0) {
        return openCorners[Math.floor(Math.random() * openCorners.length)];
    }

    const openCells = board.map((mark, index) => mark ? -1 : index).filter(index => index !== -1);
    return openCells[Math.floor(Math.random() * openCells.length)];
}

function playComputerMove() {
    computerTurnTimeout = null;
    if (gameOver || currentPlayer !== "O") {
        return;
    }

    board[chooseComputerMove()] = "O";
    if (endGame()) {
        return;
    }

    currentPlayer = "X";
    updateTurnDisplay();
    updateBoard();
}

function startNewGame() {
    window.clearTimeout(computerTurnTimeout);
    window.clearTimeout(nextRoundTimeout);
    computerTurnTimeout = null;
    nextRoundTimeout = null;
    board = Array(9).fill("");
    currentPlayer = "X";
    gameOver = false;
    cells.forEach(cell => {
        delete cell.dataset.winning;
        cell.classList.remove("is-last-move");
    });
    roundNumber += 1;
    updateTurnDisplay();
    updateBoard();
    updateScores();
}

function setGameMode(useComputer) {
    if (isComputerMode === useComputer) {
        return;
    }

    isComputerMode = useComputer;
    twoPlayerModeButton.classList.toggle("is-selected", !useComputer);
    computerModeButton.classList.toggle("is-selected", useComputer);
    twoPlayerModeButton.setAttribute("aria-pressed", String(!useComputer));
    computerModeButton.setAttribute("aria-pressed", String(useComputer));
    playerOName.textContent = useComputer ? "Computer" : "Player 2";
    modeNote.textContent = useComputer
        ? "You play X. The computer plays O and looks for winning moves."
        : "Pass the board back and forth. X takes the first move.";
    startNewGame();
}

cells.forEach((cell, index) => {
    cell.addEventListener("click", () => playMove(index));
});

twoPlayerModeButton.addEventListener("click", () => setGameMode(false));
computerModeButton.addEventListener("click", () => setGameMode(true));
newGameButton.addEventListener("click", startNewGame);
resetButton.addEventListener("click", () => {
    scores.X = 0;
    scores.O = 0;
    scores.draws = 0;
    roundNumber = 0;
    startNewGame();
});

updateTurnDisplay();
updateBoard();
updateScores();