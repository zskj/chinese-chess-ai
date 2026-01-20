const Rules = {
    getValidMoves(board, piece) {
        const moves = [];
        const { row, col, type, isRed } = piece;

        switch (type) {
            case 'K':
                this.getKingMoves(board, piece, moves);
                break;
            case 'A':
                this.getAdvisorMoves(board, piece, moves);
                break;
            case 'B':
                this.getBishopMoves(board, piece, moves);
                break;
            case 'N':
                this.getKnightMoves(board, piece, moves);
                break;
            case 'R':
                this.getRookMoves(board, piece, moves);
                break;
            case 'C':
                this.getCannonMoves(board, piece, moves);
                break;
            case 'P':
                this.getPawnMoves(board, piece, moves);
                break;
        }

        return moves.filter(move => 
            this.isValidMove(board, piece, move.row, move.col)
        );
    },

    getKingMoves(board, piece, moves) {
        const { row, col, isRed } = piece;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (Utils.inPalace(newRow, newCol, isRed)) {
                const target = board[newRow][newCol];
                if (!target || !Utils.sameColor(piece, target)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    },

    getAdvisorMoves(board, piece, moves) {
        const { row, col, isRed } = piece;
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;

            if (Utils.inPalace(newRow, newCol, isRed)) {
                const target = board[newRow][newCol];
                if (!target || !Utils.sameColor(piece, target)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    },

    getBishopMoves(board, piece, moves) {
        const { row, col, isRed } = piece;
        const directions = [[-2, -2], [-2, 2], [2, -2], [2, 2]];

        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            const blockRow = row + dr / 2;
            const blockCol = col + dc / 2;

            if (Utils.inBoard(newRow, newCol) && 
                Utils.inOwnSide(newRow, isRed) &&
                !board[blockRow][blockCol]) {
                const target = board[newRow][newCol];
                if (!target || !Utils.sameColor(piece, target)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    },

    getKnightMoves(board, piece, moves) {
        const { row, col } = piece;
        const knightMoves = [
            [-2, -1, -1, 0], [-2, 1, -1, 0],
            [2, -1, 1, 0], [2, 1, 1, 0],
            [-1, -2, 0, -1], [1, -2, 0, -1],
            [-1, 2, 0, 1], [1, 2, 0, 1]
        ];

        for (const [dr, dc, blockR, blockC] of knightMoves) {
            const newRow = row + dr;
            const newCol = col + dc;
            const blockRow = row + blockR;
            const blockCol = col + blockC;

            if (Utils.inBoard(newRow, newCol) && !board[blockRow][blockCol]) {
                const target = board[newRow][newCol];
                if (!target || !Utils.sameColor(piece, target)) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    },

    getRookMoves(board, piece, moves) {
        const { row, col } = piece;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;

            while (Utils.inBoard(newRow, newCol)) {
                const target = board[newRow][newCol];
                if (!target) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (!Utils.sameColor(piece, target)) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
                newRow += dr;
                newCol += dc;
            }
        }
    },

    getCannonMoves(board, piece, moves) {
        const { row, col } = piece;
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dr, dc] of directions) {
            let newRow = row + dr;
            let newCol = col + dc;
            let jumped = false;

            while (Utils.inBoard(newRow, newCol)) {
                const target = board[newRow][newCol];
                
                if (!jumped) {
                    if (!target) {
                        moves.push({ row: newRow, col: newCol });
                    } else {
                        jumped = true;
                    }
                } else {
                    if (target) {
                        if (!Utils.sameColor(piece, target)) {
                            moves.push({ row: newRow, col: newCol });
                        }
                        break;
                    }
                }
                
                newRow += dr;
                newCol += dc;
            }
        }
    },

    getPawnMoves(board, piece, moves) {
        const { row, col, isRed } = piece;
        const forward = isRed ? -1 : 1;

        const newRow = row + forward;
        if (Utils.inBoard(newRow, col)) {
            const target = board[newRow][col];
            if (!target || !Utils.sameColor(piece, target)) {
                moves.push({ row: newRow, col: col });
            }
        }

        if (Utils.crossedRiver(row, isRed)) {
            for (const dc of [-1, 1]) {
                const newCol = col + dc;
                if (Utils.inBoard(row, newCol)) {
                    const target = board[row][newCol];
                    if (!target || !Utils.sameColor(piece, target)) {
                        moves.push({ row: row, col: newCol });
                    }
                }
            }
        }
    },

    isValidMove(board, piece, toRow, toCol) {
        const tempBoard = Utils.cloneBoard(board);
        const fromRow = piece.row;
        const fromCol = piece.col;

        tempBoard[toRow][toCol] = tempBoard[fromRow][fromCol];
        tempBoard[fromRow][fromCol] = null;

        if (tempBoard[toRow][toCol]) {
            tempBoard[toRow][toCol].row = toRow;
            tempBoard[toRow][toCol].col = toCol;
        }

        return !this.isKingInCheck(tempBoard, piece.isRed);
    },

    isKingInCheck(board, isRed) {
        let kingPos = null;
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.type === 'K' && piece.isRed === isRed) {
                    kingPos = { row: r, col: c };
                    break;
                }
            }
            if (kingPos) break;
        }

        if (!kingPos) return true;

        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.isRed !== isRed) {
                    const tempPiece = { ...piece, row: r, col: c };
                    const moves = this.getRawMoves(board, tempPiece);
                    if (moves.some(m => m.row === kingPos.row && m.col === kingPos.col)) {
                        return true;
                    }
                }
            }
        }

        const kingFaceKing = this.checkFacingKings(board);
        return kingFaceKing;
    },

    checkFacingKings(board) {
        let redKing = null;
        let blackKing = null;

        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.type === 'K') {
                    if (piece.isRed) {
                        redKing = { row: r, col: c };
                    } else {
                        blackKing = { row: r, col: c };
                    }
                }
            }
        }

        if (!redKing || !blackKing) return false;
        if (redKing.col !== blackKing.col) return false;

        for (let r = blackKing.row + 1; r < redKing.row; r++) {
            if (board[r][redKing.col]) {
                return false;
            }
        }

        return true;
    },

    getRawMoves(board, piece) {
        const moves = [];
        const { type } = piece;

        switch (type) {
            case 'K':
                this.getKingMoves(board, piece, moves);
                break;
            case 'A':
                this.getAdvisorMoves(board, piece, moves);
                break;
            case 'B':
                this.getBishopMoves(board, piece, moves);
                break;
            case 'N':
                this.getKnightMoves(board, piece, moves);
                break;
            case 'R':
                this.getRookMoves(board, piece, moves);
                break;
            case 'C':
                this.getCannonMoves(board, piece, moves);
                break;
            case 'P':
                this.getPawnMoves(board, piece, moves);
                break;
        }

        return moves;
    },

    isCheckmate(board, isRed) {
        if (!this.isKingInCheck(board, isRed)) {
            return false;
        }

        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.isRed === isRed) {
                    const tempPiece = { ...piece, row: r, col: c };
                    const validMoves = this.getValidMoves(board, tempPiece);
                    if (validMoves.length > 0) {
                        return false;
                    }
                }
            }
        }

        return true;
    },

    getAllValidMoves(board, isRed) {
        const allMoves = [];

        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.isRed === isRed) {
                    const tempPiece = { ...piece, row: r, col: c };
                    const validMoves = this.getValidMoves(board, tempPiece);
                    validMoves.forEach(move => {
                        allMoves.push({
                            from: { row: r, col: c },
                            to: { row: move.row, col: move.col },
                            piece: tempPiece
                        });
                    });
                }
            }
        }

        return allMoves;
    }
};
