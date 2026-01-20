const AI = {
    getMove(board) {
        const allMoves = Rules.getAllValidMoves(board, false);
        
        if (allMoves.length === 0) {
            return null;
        }

        const scoredMoves = allMoves.map(move => ({
            move,
            score: this.evaluateMove(board, move)
        }));

        scoredMoves.sort((a, b) => b.score - a.score);

        const topScore = scoredMoves[0].score;
        const topMoves = scoredMoves.filter(m => m.score >= topScore - 0.5);

        const randomIndex = Math.floor(Math.random() * Math.min(topMoves.length, 5));
        return topMoves[randomIndex].move;
    },

    evaluateMove(board, move) {
        let score = 0;
        const { from, to, piece } = move;
        const target = board[to.row][to.col];

        if (target) {
            score += Utils.getPieceValue(target.type) * 10;
            
            if (target.type === 'K') {
                score += 10000;
            }
        }

        const tempBoard = Utils.cloneBoard(board);
        tempBoard[to.row][to.col] = tempBoard[from.row][from.col];
        tempBoard[from.row][from.col] = null;
        if (tempBoard[to.row][to.col]) {
            tempBoard[to.row][to.col].row = to.row;
            tempBoard[to.row][to.col].col = to.col;
        }

        if (Rules.isCheckmate(tempBoard, true)) {
            score += 20000;
        } else if (Rules.isKingInCheck(tempBoard, true)) {
            score += 50;
        }

        if (this.isUnderAttack(board, from.row, from.col, false)) {
            score += Utils.getPieceValue(piece.type) * 3;
        }

        if (this.isUnderAttack(tempBoard, to.row, to.col, false)) {
            score -= Utils.getPieceValue(piece.type) * 2;
        }

        score += Utils.getPositionValue(piece.type, to.row, to.col, false);

        const redThreats = this.countThreats(tempBoard, true);
        score += redThreats * 2;

        const protectedPieces = this.countProtectedPieces(tempBoard, false);
        score += protectedPieces * 0.5;

        if (piece.type === 'N' || piece.type === 'C') {
            const centerCol = 4;
            const distanceToCenter = Math.abs(to.col - centerCol);
            score += (4 - distanceToCenter) * 0.5;
        }

        score += Math.random() * 2;

        return score;
    },

    isUnderAttack(board, row, col, isRed) {
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.isRed !== isRed) {
                    const tempPiece = { ...piece, row: r, col: c };
                    const moves = Rules.getRawMoves(board, tempPiece);
                    if (moves.some(m => m.row === row && m.col === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    countThreats(board, isRed) {
        let threats = 0;
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.isRed === isRed) {
                    if (this.isUnderAttack(board, r, c, isRed)) {
                        threats++;
                    }
                }
            }
        }
        return threats;
    },

    countProtectedPieces(board, isRed) {
        let protected = 0;
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.isRed === isRed) {
                    if (this.isProtected(board, r, c, isRed)) {
                        protected++;
                    }
                }
            }
        }
        return protected;
    },

    isProtected(board, row, col, isRed) {
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.isRed === isRed && (r !== row || c !== col)) {
                    const tempPiece = { ...piece, row: r, col: c };
                    const moves = Rules.getRawMoves(board, tempPiece);
                    if (moves.some(m => m.row === row && m.col === col)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
};
