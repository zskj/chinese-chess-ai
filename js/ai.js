const AI = {
    difficulty: 'medium', // 'medium' or 'hard'
    searchDepth: {
        'medium': 2,
        'hard': 4
    },

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    },

    getMove(board) {
        const allMoves = Rules.getAllValidMoves(board, false);
        
        if (allMoves.length === 0) {
            return null;
        }

        // 根据难度选择算法
        if (this.difficulty === 'medium') {
            return this.getMoveMedium(board, allMoves);
        } else {
            return this.getMoveHard(board);
        }
    },

    getMoveMedium(board, allMoves) {
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

    getMoveHard(board) {
        const startTime = Date.now();
        const depth = this.searchDepth.hard;
        
        // 使用Minimax + Alpha-Beta剪枝
        const result = this.minimax(board, depth, -Infinity, Infinity, false);
        
        console.log(`AI搜索用时: ${Date.now() - startTime}ms, 评估分: ${result.score}`);
        
        return result.move;
    },

    // Minimax算法 with Alpha-Beta剪枝
    minimax(board, depth, alpha, beta, isMaximizing) {
        // 检查终止条件
        if (depth === 0 || this.isGameOver(board)) {
            return {
                score: this.evaluateBoard(board),
                move: null
            };
        }

        const currentPlayerMoves = Rules.getAllValidMoves(board, !isMaximizing);
        
        if (currentPlayerMoves.length === 0) {
            // 没有合法走法，检查是否是将死
            const isCheckmate = Rules.isCheckmate(board, !isMaximizing);
            return {
                score: isCheckmate ? (isMaximizing ? -100000 : 100000) : 0,
                move: null
            };
        }

        // 移动排序：优先搜索评分高的棋步
        const sortedMoves = this.sortMoves(board, currentPlayerMoves);

        let bestMove = null;

        if (isMaximizing) {
            let maxScore = -Infinity;
            
            for (const move of sortedMoves) {
                const newBoard = this.makeMoveOnBoard(board, move);
                const result = this.minimax(newBoard, depth - 1, alpha, beta, false);
                
                if (result.score > maxScore) {
                    maxScore = result.score;
                    bestMove = move;
                }
                
                alpha = Math.max(alpha, result.score);
                if (beta <= alpha) {
                    break; // Alpha-Beta剪枝
                }
            }
            
            return { score: maxScore, move: bestMove };
        } else {
            let minScore = Infinity;
            
            for (const move of sortedMoves) {
                const newBoard = this.makeMoveOnBoard(board, move);
                const result = this.minimax(newBoard, depth - 1, alpha, beta, true);
                
                if (result.score < minScore) {
                    minScore = result.score;
                    bestMove = move;
                }
                
                beta = Math.min(beta, result.score);
                if (beta <= alpha) {
                    break; // Alpha-Beta剪枝
                }
            }
            
            return { score: minScore, move: bestMove };
        }
    },

    // 移动排序优化搜索效率
    sortMoves(board, moves) {
        return moves.map(move => ({
            move,
            priority: this.getMovePriority(board, move)
        })).sort((a, b) => b.priority - a.priority).map(item => item.move);
    },

    // 计算移动优先级
    getMovePriority(board, move) {
        let priority = 0;
        const { to, piece, captured } = move;

        // 1. 吃子移动优先级最高
        if (captured) {
            priority += Utils.getPieceValue(captured.type) * 100;
        }

        // 2. 将军移动
        const tempBoard = this.makeMoveOnBoard(board, move);
        if (Rules.isKingInCheck(tempBoard, true)) {
            priority += 1000;
        }

        // 3. 攻击对方重要棋子
        if (captured && captured.type !== 'P') {
            priority += Utils.getPieceValue(captured.type) * 10;
        }

        // 4. 保护己方重要棋子
        if (piece.type === 'K' || piece.type === 'R') {
            priority += 5;
        }

        // 5. 位置价值
        priority += Utils.getPositionValue(piece.type, to.row, to.col, false);

        // 6. 添加少量随机性避免完全确定性
        priority += Math.random() * 2;

        return priority;
    },

    // 在棋盘上执行移动
    makeMoveOnBoard(board, move) {
        const newBoard = Utils.cloneBoard(board);
        const { from, to, piece } = move;
        
        newBoard[to.row][to.col] = { ...piece, row: to.row, col: to.col };
        newBoard[from.row][from.col] = null;
        
        return newBoard;
    },

    // 检查游戏是否结束
    isGameOver(board) {
        return Rules.isCheckmate(board, true) || 
               Rules.isCheckmate(board, false) ||
               Rules.getAllValidMoves(board, true).length === 0 ||
               Rules.getAllValidMoves(board, false).length === 0;
    },

    // 评估整个棋盘局面
    evaluateBoard(board) {
        let score = 0;
        
        // 遍历棋盘上的所有棋子
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece) {
                    const pieceValue = this.getEnhancedPieceValue(piece, r, c, board);
                    
                    if (piece.isRed) {
                        score += pieceValue;
                    } else {
                        score -= pieceValue;
                    }
                }
            }
        }

        // 添加战术评估
        score += this.evaluateTactics(board);

        return score;
    },

    // 增强的棋子价值评估
    getEnhancedPieceValue(piece, row, col, board) {
        let baseValue = 0;
        
        switch (piece.type) {
            case 'R': baseValue = 9; break;     // 车
            case 'N': baseValue = 5; break;     // 马  
            case 'C': baseValue = 4.5; break;   // 炮
            case 'B': baseValue = 3; break;      // 象
            case 'A': baseValue = 2; break;      // 士
            case 'P': baseValue = 1; break;      // 兵
            case 'K': baseValue = 1000; break;   // 将
        }

        // 位置价值
        const positionValue = Utils.getPositionValue(piece.type, row, col, piece.isRed);
        
        // 灵活性评估（可移动位置数量）
        const mobilityValue = this.evaluateMobility(board, piece) * 0.1;
        
        // 安全性评估
        const safetyValue = this.evaluatePieceSafety(board, piece) * 0.5;

        return baseValue + positionValue + mobilityValue + safetyValue;
    },

    // 评估棋子灵活性
    evaluateMobility(board, piece) {
        if (!board || board.length === 0) return 0;
        const tempPiece = { ...piece, row: piece.row, col: piece.col };
        const moves = Rules.getValidMoves(board, tempPiece);
        return moves.length;
    },

    // 评估棋子安全性
    evaluatePieceSafety(board, piece) {
        if (!board || board.length === 0) return 0;
        let safety = 0;
        
        // 检查是否被攻击
        const isAttacked = this.isUnderAttack(board, piece.row, piece.col, piece.isRed);
        if (isAttacked) {
            safety -= Utils.getPieceValue(piece.type) * 2;
        }

        // 检查是否有保护
        const isProtected = this.isProtected(board, piece.row, piece.col, piece.isRed);
        if (isProtected) {
            safety += Utils.getPieceValue(piece.type) * 0.5;
        }

        return safety;
    },

    // 战术评估
    evaluateTactics(board) {
        let tacticalScore = 0;

        // 检查将军威胁
        if (Rules.isKingInCheck(board, true)) {
            tacticalScore -= 100; // AI被将军，扣分
        }
        
        if (Rules.isKingInCheck(board, false)) {
            tacticalScore += 100; // AI将军对方，加分
        }

        // 检查潜在威胁
        tacticalScore += this.evaluateThreats(board, false) * 10;
        tacticalScore -= this.evaluateThreats(board, true) * 10;

        return tacticalScore;
    },

    // 评估威胁
    evaluateThreats(board, isRed) {
        let threats = 0;
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 9; c++) {
                const piece = board[r][c];
                if (piece && piece.isRed === isRed) {
                    // 计算这个棋子能攻击的敌方棋子价值
                    const threatValue = this.calculateThreatValue(board, piece);
                    threats += threatValue;
                }
            }
        }
        return threats;
    },

    // 计算单个棋子的威胁价值
    calculateThreatValue(board, piece) {
        const tempPiece = { ...piece, row: piece.row, col: piece.col };
        const moves = Rules.getValidMoves(board, tempPiece);
        let threatValue = 0;

        for (const move of moves) {
            const target = board[move.row][move.col];
            if (target && target.isRed !== piece.isRed) {
                threatValue += Utils.getPieceValue(target.type);
            }
        }

        return threatValue;
    },

    // 原有评估函数（保留以兼容中等难度）
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
