class State {
    public board: number[];
    public sudoku: Sudoku;

    constructor(board: number[], sudoku: Sudoku) {
        this.board = board;
        this.sudoku = sudoku;
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

    /**
     * Set board values by list of shifts.
     * For example [0, 1, 2], [[0, 1, 2], [0, 1, 2], [0, 1, 2]] sets first 3 cells to number [1, 2, 3].
     * @param cells Indices of cells to set value of.
     * @param shifts Shifts to put in each cell.
     */
    public setCells(cells: number[], shifts: number[][]): void {
        for (let i = 0; i < cells.length; i++) {
            this.board[cells[i]] = BinaryUtils.shiftsToBinary(shifts[i]);
        }
    }
}