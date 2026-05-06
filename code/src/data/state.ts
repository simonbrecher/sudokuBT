class State {
    /**
     * For each cell, binary representation of candidates
     * board[y * this.size + x] is bitset of all candidate numbers that can be in the cell (y, x)
     * board[y * this.size + x] | (1 << (m - 1)) is not 0 if m can be in the cell (y, x)
     */
    public board: number[];
    /**
     * reference to the Sudoku object
     */
    public sudoku: Sudoku;

    constructor(board: number[], sudoku: Sudoku) {
        this.board = board;
        this.sudoku = sudoku;
    }

    /**
     * Deepcopy of the State, referring to the same Sudoku
     */
    public deepcopy(): State {
        return new State(ArrayUtils.deepcopyArray1d(this.board), this.sudoku);
    }

    /**
     * Check if string is "0"/"1"/"2"/"3"/"4"/"5"/"6'/"7"/"8'/"9'
     * @param char String with length of 1
     */
    private static isCharDigit(char: string): boolean {
        return char >= "0" && char <= "9";
    }

    /**
     * Set board values by text, for example: ["----", "123-", "---2", "4---"]
     * @param text array of rows, each row is a string of Sudoku.size numbers, - means all numbers can be there.
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

    /**
     * Set board values by list of shifts.
     * For example [0, 1, 2], [[0, 1, 2], [0, 1, 2], [0, 1, 2]] sets first 3 cells to number [1, 2, 3].
     * @param cells Indices of cells to set value of.
     * @param shifts List of candidate numbers to put to each cell,
     * for example [0, 2] means numbers [1, 3] and binary representation of candidates will be 0b101
     */
    public setCells(cells: number[], shifts: number[][]): void {
        for (let i = 0; i < cells.length; i++) {
            this.board[cells[i]] = BinaryUtils.shiftsToBinary(shifts[i]);
        }
    }
}