const Board = {
    canvas: null,
    ctx: null,
    cellSize: 0,
    padding: 0,
    selectedPiece: null,
    validMoves: [],
    lastMove: null,

    pieceChars: {
        'K': { red: '帅', black: '将' },
        'A': { red: '仕', black: '士' },
        'B': { red: '相', black: '象' },
        'N': { red: '马', black: '马' },
        'R': { red: '车', black: '车' },
        'C': { red: '炮', black: '砲' },
        'P': { red: '兵', black: '卒' }
    },

    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
    },

    resize() {
        const container = this.canvas.parentElement;
        const width = Math.min(container.clientWidth - 20, 600);
        const height = width * 1.1;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // Adjust padding based on screen size for better mobile experience
        if (window.innerWidth <= 400) {
            this.padding = 15;
        } else if (window.innerWidth <= 600) {
            this.padding = 18;
        } else {
            this.padding = 20;
        }
        
        this.cellSize = (width - this.padding * 2) / 8;
        
        if (Game.board) {
            this.draw(Game.board);
        }
    },

    draw(board) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBoard();
        this.drawPieces(board);
        this.drawHighlights();
    },

    drawBoard() {
        const ctx = this.ctx;
        const { cellSize, padding } = this;
        
        ctx.fillStyle = '#f4e4c1';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(padding, padding + i * cellSize);
            ctx.lineTo(padding + 8 * cellSize, padding + i * cellSize);
            ctx.stroke();
        }
        
        for (let i = 0; i < 9; i++) {
            ctx.beginPath();
            ctx.moveTo(padding + i * cellSize, padding);
            ctx.lineTo(padding + i * cellSize, padding + 4 * cellSize);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(padding + i * cellSize, padding + 5 * cellSize);
            ctx.lineTo(padding + i * cellSize, padding + 9 * cellSize);
            ctx.stroke();
        }
        
        ctx.beginPath();
        ctx.moveTo(padding + 3 * cellSize, padding);
        ctx.lineTo(padding + 5 * cellSize, padding + 2 * cellSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding + 5 * cellSize, padding);
        ctx.lineTo(padding + 3 * cellSize, padding + 2 * cellSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding + 3 * cellSize, padding + 7 * cellSize);
        ctx.lineTo(padding + 5 * cellSize, padding + 9 * cellSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(padding + 5 * cellSize, padding + 7 * cellSize);
        ctx.lineTo(padding + 3 * cellSize, padding + 9 * cellSize);
        ctx.stroke();
        
        ctx.fillStyle = '#000';
        ctx.font = `${cellSize * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const riverY = padding + 4.5 * cellSize;
        ctx.fillText('楚河', padding + 2 * cellSize, riverY);
        ctx.fillText('汉界', padding + 6 * cellSize, riverY);
    },

    drawPieces(board) {
        const ctx = this.ctx;
        const { cellSize, padding } = this;
        const radius = cellSize * 0.35; // Reduced from 0.4 to 0.35 for smaller pieces
        
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece) {
                    const x = padding + col * cellSize;
                    const y = padding + row * cellSize;
                    
                    ctx.fillStyle = piece.isRed ? '#ff4444' : '#333';
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.fillStyle = piece.isRed ? '#ff4444' : '#333';
                    ctx.font = `bold ${cellSize * 0.4}px SimHei, "Microsoft YaHei", sans-serif`; // Reduced from 0.5 to 0.4
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    const char = this.pieceChars[piece.type][piece.isRed ? 'red' : 'black'];
                    ctx.fillText(char, x, y);
                }
            }
        }
    },

    drawHighlights() {
        const ctx = this.ctx;
        const { cellSize, padding } = this;
        
        if (this.lastMove) {
            const { from, to } = this.lastMove;
            
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
            ctx.lineWidth = 3;
            ctx.strokeRect(
                padding + from.col * cellSize - cellSize * 0.45,
                padding + from.row * cellSize - cellSize * 0.45,
                cellSize * 0.9,
                cellSize * 0.9
            );
            
            ctx.strokeStyle = 'rgba(100, 200, 255, 0.8)';
            ctx.strokeRect(
                padding + to.col * cellSize - cellSize * 0.45,
                padding + to.row * cellSize - cellSize * 0.45,
                cellSize * 0.9,
                cellSize * 0.9
            );
        }
        
        if (this.selectedPiece) {
            const { row, col } = this.selectedPiece;
            
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(
                padding + col * cellSize - cellSize * 0.45,
                padding + row * cellSize - cellSize * 0.45,
                cellSize * 0.9,
                cellSize * 0.9
            );
        }
        
        this.validMoves.forEach(move => {
            const x = padding + move.col * cellSize;
            const y = padding + move.row * cellSize;
            
            ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(x, y, cellSize * 0.12, 0, Math.PI * 2); // Reduced from 0.15 to 0.12
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(0, 200, 0, 0.8)';
            ctx.lineWidth = 1.5; // Reduced from 2 to 1.5
            ctx.stroke();
        });
    },

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.handleInput(x, y);
    },

    handleTouch(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        this.handleInput(x, y);
    },

    handleInput(x, y) {
        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);
        
        if (!Utils.inBoard(row, col)) {
            return;
        }
        
        Game.handleCellClick(row, col);
    },

    setSelectedPiece(piece, moves) {
        this.selectedPiece = piece;
        this.validMoves = moves || [];
        this.draw(Game.board);
    },

    clearSelection() {
        this.selectedPiece = null;
        this.validMoves = [];
        this.draw(Game.board);
    },

    setLastMove(from, to) {
        this.lastMove = { from, to };
    }
};
