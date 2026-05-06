class EdgeVariant {
    /**
     * List of all label ids that can appear in the Sudoku.
     */
    public labels: number[];
    /**
     * labelStyle[i] is the graphical element for label with id i
     * null means no graphical element
     */
    public labelStyle: (EdgeLabelStyle | null)[];
    /**
     * neighbours[l][a] is the mask for binary representation of candidates that can be in the second edge-adjacent cell,
     * if the first cell has number (a + 1) and l is the id of label on the edge.
     */
    public neighbours: number[][];
    /**
     * neighbours[l][b] is the mask for binary representation of candidates that can be in the first edge-adjacent cell,
     * if the second cell has number (a + 1) and l is the id of label on the edge.
     */
    public neighboursInverse: number[][];

    /**
     * board[direction][y][x] is the id of label on the right/bottom side of cell (y, x),
     * direction = 0 if it is on the right, direction = 1 if it is on the bottom
     */
    public board: number[][][];

    /**
     * Don't call this constructor directly, use EdgeVariantFactory constructor and .build method
     * to automatically convert the parameters to this format.
     * @param size the size of the Sudoku
     * @param labels List of all label ids that can appear in the Sudoku.
     * @param labelStyles For each label id, the label style. null means no graphical element for the label.
     * @param neighbours neighbours[l][b] is the mask for binary representation of candidates that can be in the first edge-adjacent cell,
     * if the second cell has number (a + 1) and l is the id of label on the edge.
     */
    constructor(size: number, labels: number[], labelStyles: (EdgeLabelStyle | null)[], neighbours: number[][]) {
        this.labels = labels;
        this.labelStyle = labelStyles;
        this.neighbours = neighbours;

        this.neighboursInverse = [];
        for (let n of this.neighbours) {
            let add = ArrayUtils.createArray1d(size, 0);
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    if ((n[i] & 1 << j) != 0) {
                        add[j] |= 1 << i;
                    }
                }
            }
            this.neighboursInverse.push(add);
        }


        this.board = [
            ArrayUtils.createArray2d(size, size - 1, -1),
            ArrayUtils.createArray2d(size - 1, size, -1),
        ];
    }

    /**
     * For label id and a number in one cell, return mask of all numbers that can be in the other cell
     * @param label label between two cells
     * @param shift (shift + 1) is the number in one of the cells
     * @param isNotInverse true if you know the number in top/left cell and want the candidates in bottom/right cell
     */
    public getNeighbour(label: number, shift: number, isNotInverse: boolean): number {
        return (isNotInverse ? this.neighbours : this.neighboursInverse)[label][shift];
    }
}