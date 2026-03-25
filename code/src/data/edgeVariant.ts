class EdgeVariant {
    public sudoku: Sudoku;

    public labels: number[];
    public labelStyle: (EdgeLabelStyle | null)[];
    public neighbours: number[][];

    public board: number[][][];

    constructor(sudoku: Sudoku, labels: number[], labelStyles: (EdgeLabelStyle | null)[], neighbours: number[][]) {
        this.sudoku = sudoku;
        this.labels = labels;
        this.labelStyle = labelStyles;
        this.neighbours = neighbours;

        this.board = [
            ArrayUtils.createArray2d(this.sudoku.size, this.sudoku.size - 1, -1),
            ArrayUtils.createArray2d(this.sudoku.size - 1, this.sudoku.size, -1),
        ];
    }
}