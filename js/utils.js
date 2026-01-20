const Utils = {
    inBoard(row, col) {
        return row >= 0 && row < 10 && col >= 0 && col < 9;
    },

    inPalace(row, col, isRed) {
        if (isRed) {
            return row >= 7 && row <= 9 && col >= 3 && col <= 5;
        } else {
            return row >= 0 && row <= 2 && col >= 3 && col <= 5;
        }
    },

    crossedRiver(row, isRed) {
        if (isRed) {
            return row < 5;
        } else {
            return row > 4;
        }
    },

    inOwnSide(row, isRed) {
        if (isRed) {
            return row >= 5;
        } else {
            return row <= 4;
        }
    },

    sameColor(piece1, piece2) {
        if (!piece1 || !piece2) return false;
        return piece1.isRed === piece2.isRed;
    },

    cloneBoard(board) {
        return board.map(row => [...row]);
    },

    getPieceValue(type) {
        const values = {
            'R': 9,  // 车
            'N': 4,  // 马
            'C': 4.5,  // 炮
            'B': 2,  // 象
            'A': 2,  // 士
            'P': 1,  // 兵
            'K': 1000  // 将
        };
        return values[type] || 0;
    },

    getPositionValue(type, row, col, isRed) {
        const normalizedRow = isRed ? (9 - row) : row;
        const normalizedCol = col - 4;
        
        let value = 0;
        
        if (type === 'P') {
            if (this.crossedRiver(row, isRed)) {
                value += 0.5;
                value += (4 - Math.abs(normalizedCol)) * 0.1;
            }
        } else if (type === 'N' || type === 'C') {
            value += (4 - Math.abs(normalizedCol)) * 0.1;
            value += (normalizedRow >= 3 && normalizedRow <= 6) ? 0.2 : 0;
        }
        
        return value;
    }
};
