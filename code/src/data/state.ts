class State {
    public board: number[];
    public sudoku: Sudoku;

    constructor(board: number[], sudoku: Sudoku) {
        this.board = board;
        this.sudoku = sudoku;
    }

    /**
     * Count number of extra bits in this.board
     * If this.board includes 0, return -1
     * Else return sum of 1-bits in all cells minus 1 for every cell
     */
    public getExtraBitCount(): number | null {
        let extraBitsCount = 0;
        for (let binary of this.board) {
            if (binary === 0) {
                return null;
            }
            extraBitsCount += BinaryUtils.countBits32(binary) - 1;
        }
        return extraBitsCount;
    }

    /**
     * Count solutions statically:
     * Return 0:    State has 0 solutions.
     * Return 1:    State has 0 or 1 solutions.
     * Return 2:    State has 0, 1 or more solutions.
     */
    public countSolutions(): 0 | 1 | 2 {
        switch (this.getExtraBitCount()) {
            case null:  return 0;
            case 0:     return 1;
            default:    return 2;
        }
    }

    public deepcopy(): State {
        return new State(ArrayUtils.deepcopyArray1d(this.board), this.sudoku);
    }

    private static isCharDigit(char: string): boolean {
        return char >= "0" && char <= "9";
    }

    /**
     * Set board values by text, for example: ["----", "123-", "---2", "4---"]
     */
    public setBoardByText(text: string[]): void {
        if (text.length !== this.sudoku.size) {
            throw `INVALID INPUT SIZE: State.setBoard text.length must equal sudoku.size, but sudoku.size=${this.sudoku.size} and text.length=${text.length}`;
        }
        for (let y = 0; y < text.length; y++) {
            if (text[y].length !== this.sudoku.size) {
                throw `INVALID INPUT SIZE: State.setBoard text[i].length must equal sudoku.size, but sudoku.size=${this.sudoku.size} and text[${y}].length=${text[y].length}`;
            }
            for (let x = 0; x < text[y].length; x++) {
                if (text[y][x] === "-") {
                    this.board[y * this.sudoku.size + x] = this.sudoku.fullBinary;
                } else if (State.isCharDigit(text[y][x])) {
                    this.board[y * this.sudoku.size + x] = 1 << parseInt(text[y][x]) - 1;
                } else {
                    throw `INVALID INPUT SIZE: State.setBoard text[i][j] must be "-" or a number, but text[${y}][${x}].length=${text[y][x]}`;
                }
            }
        }
    }
}