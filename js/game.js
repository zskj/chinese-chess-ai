const Game = {
    board: null,
    currentPlayer: 'red',
    gameOver: false,
    selectedPiece: null,

    init() {
        this.setupBoard();
        Board.init('gameCanvas');
        Board.draw(this.board);
        this.updateStatus('红方走棋');
        
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        
        this.moveHistory = [];
    },

    setupBoard() {
        this.board = Array(10).fill(null).map(() => Array(9).fill(null));
        
        const initialSetup = [
            { type: 'R', positions: [[0, 0], [0, 8]], isRed: false },
            { type: 'N', positions: [[0, 1], [0, 7]], isRed: false },
            { type: 'B', positions: [[0, 2], [0, 6]], isRed: false },
            { type: 'A', positions: [[0, 3], [0, 5]], isRed: false },
            { type: 'K', positions: [[0, 4]], isRed: false },
            { type: 'C', positions: [[2, 1], [2, 7]], isRed: false },
            { type: 'P', positions: [[3, 0], [3, 2], [3, 4], [3, 6], [3, 8]], isRed: false },
            
            { type: 'R', positions: [[9, 0], [9, 8]], isRed: true },
            { type: 'N', positions: [[9, 1], [9, 7]], isRed: true },
            { type: 'B', positions: [[9, 2], [9, 6]], isRed: true },
            { type: 'A', positions: [[9, 3], [9, 5]], isRed: true },
            { type: 'K', positions: [[9, 4]], isRed: true },
            { type: 'C', positions: [[7, 1], [7, 7]], isRed: true },
            { type: 'P', positions: [[6, 0], [6, 2], [6, 4], [6, 6], [6, 8]], isRed: true }
        ];

        initialSetup.forEach(({ type, positions, isRed }) => {
            positions.forEach(([row, col]) => {
                this.board[row][col] = {
                    type,
                    isRed,
                    row,
                    col
                };
            });
        });

        this.currentPlayer = 'red';
        this.gameOver = false;
        this.selectedPiece = null;
        this.moveHistory = [];
    },

    handleCellClick(row, col) {
        if (this.gameOver) {
            return;
        }

        if (this.currentPlayer !== 'red') {
            return;
        }

        const clickedPiece = this.board[row][col];

        if (this.selectedPiece) {
            const isValidMove = Board.validMoves.some(
                move => move.row === row && move.col === col
            );

            if (isValidMove) {
                this.makeMove(this.selectedPiece, row, col);
                Board.clearSelection();
                this.selectedPiece = null;
                
                if (!this.gameOver) {
                    setTimeout(() => this.aiMove(), 500);
                }
            } else if (clickedPiece && clickedPiece.isRed) {
                this.selectPiece(row, col);
            } else {
                Board.clearSelection();
                this.selectedPiece = null;
            }
        } else if (clickedPiece && clickedPiece.isRed) {
            this.selectPiece(row, col);
        }
    },

    selectPiece(row, col) {
        const piece = this.board[row][col];
        if (!piece || piece.isRed !== (this.currentPlayer === 'red')) {
            return;
        }

        const tempPiece = { ...piece, row, col };
        const validMoves = Rules.getValidMoves(this.board, tempPiece);

        this.selectedPiece = { row, col };
        Board.setSelectedPiece({ row, col }, validMoves);
    },

    makeMove(from, toRow, toCol) {
        const fromRow = from.row;
        const fromCol = from.col;
        const piece = this.board[fromRow][fromCol];
        const capturedPiece = this.board[toRow][toCol];

        this.moveHistory.push({
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: { ...piece },
            captured: capturedPiece ? { ...capturedPiece } : null
        });

        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        piece.row = toRow;
        piece.col = toCol;

        Board.setLastMove({ row: fromRow, col: fromCol }, { row: toRow, col: toCol });
        Board.draw(this.board);

        this.currentPlayer = this.currentPlayer === 'red' ? 'black' : 'red';

        this.checkGameOver();
    },

    aiMove() {
        if (this.gameOver || this.currentPlayer !== 'black') {
            return;
        }

        this.updateStatus('AI思考中...');

        setTimeout(() => {
            const move = AI.getMove(this.board);

            if (!move) {
                this.endGame('red');
                return;
            }

            this.makeMove(move.from, move.to.row, move.to.col);
            
            if (!this.gameOver) {
                this.updateStatus('红方走棋');
            }
        }, 300);
    },

    checkGameOver() {
        const isRed = this.currentPlayer === 'red';
        
        if (Rules.isCheckmate(this.board, isRed)) {
            this.endGame(isRed ? 'black' : 'red');
        } else if (Rules.getAllValidMoves(this.board, isRed).length === 0) {
            this.endGame('draw');
        }
    },

    endGame(winner) {
        this.gameOver = true;
        
        let message = '';
        if (winner === 'red') {
            message = '🎉 恭喜！红方获胜！';
        } else if (winner === 'black') {
            message = '😔 黑方获胜！再接再厉！';
        } else {
            message = '和棋';
        }
        
        this.updateStatus(message);
        
        setTimeout(() => {
            if (confirm(message + '\n\n是否重新开始？')) {
                this.restart();
            }
        }, 500);
    },

    restart() {
        this.setupBoard();
        Board.lastMove = null;
        Board.clearSelection();
        Board.draw(this.board);
        this.updateStatus('红方走棋');
    },

    undo() {
        if (this.moveHistory.length < 2) {
            alert('无法悔棋');
            return;
        }

        if (this.currentPlayer === 'black') {
            alert('请等待AI走棋完成');
            return;
        }

        for (let i = 0; i < 2; i++) {
            const lastMove = this.moveHistory.pop();
            if (!lastMove) break;

            this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
            lastMove.piece.row = lastMove.from.row;
            lastMove.piece.col = lastMove.from.col;

            if (lastMove.captured) {
                this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
            } else {
                this.board[lastMove.to.row][lastMove.to.col] = null;
            }
        }

        this.currentPlayer = 'red';
        this.gameOver = false;
        
        if (this.moveHistory.length > 0) {
            const lastHistoryMove = this.moveHistory[this.moveHistory.length - 1];
            Board.setLastMove(lastHistoryMove.from, lastHistoryMove.to);
        } else {
            Board.lastMove = null;
        }
        
        Board.clearSelection();
        Board.draw(this.board);
        this.updateStatus('红方走棋');
    },

    updateStatus(message) {
        document.getElementById('status').textContent = message;
    }
};

window.addEventListener('load', () => {
    Game.init();
});
