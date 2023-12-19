type StrategyCoordinates2d = { y: number, x: number };
type StrategyCoordinates3d = { y: number, x: number, shift: number };
type StrategyColors = {
    removed?: StrategyCoordinates3d[], // numbers that will be removed
    reason?: StrategyCoordinates3d[],  // numbers that are the reason for other numbers being removed
    error?: StrategyCoordinates3d[],   // numbers that cause error
    region?: StrategyCoordinates2d[],  // cells of a region
};
type StrategyResult = {
    colors: StrategyColors,
    message: string,
    isUpdated: boolean,
    isValid: boolean,
};

class Strategy2d {
    private sudoku: Sudoku;
    private task: State;

    constructor(sudoku: Sudoku, task: State) {
        this.sudoku = sudoku;
        this.task = task;
    }

    /**
     * Load region from 1d board.
     */
    private loadRegion32(board: number[], region: number[]): number[] {
        let binaries = [];
        for (let index of region) {
            binaries.push(board[index]);
        }
        return binaries;
    }

    /**
     * Update values in a region of a board. Use &= between old and new values.
     * @param board 1d array of binary representations of a cell that will be updated
     * @param region array of indices of the region's cells
     * @param binaries New values of cells.
     */
    private saveRegion32(board: number[], region: number[], binaries: number[]): void {
        for (let i = 0; i < region.length; i++) {
            board[region[i]] &= binaries[i];
        }
    }

    /**
     * Convert 1d index (y * width + x) into 2d index ( { y: y, x: x } )
     */
    private indexToCoordinates2d(index: number): StrategyCoordinates2d {
        return { y: Math.floor(index / this.sudoku.size), x: index % this.sudoku.size };
    }

    /**
     * Convert 1d array of 1d indices (y * width + x) into 1d array of 2d indices ( { y: y, x: x } )
     */
    private indexToCoordinates2dArray1d(indexes: number[]): StrategyCoordinates2d[] {
        let output = [];
        for (let index of indexes) {
            output.push(this.indexToCoordinates2d(index));
        }
        return output;
    }

    /**
     * Conver 1d index (y * width + x) and shift into 3d index ( { y: y, x: x, shift: shift } )
     * @param index (y * width + x)
     * @param shift third coordinate
     */
    private indexToCoordinates3d(index: number, shift: number): StrategyCoordinates3d {
        return { y: Math.floor(index / this.sudoku.size), x: index % this.sudoku.size, shift: shift };
    }

    /**
     * Apply the strategy Naked single on one region.
     * @param binaries 1d array with binary representations of cells in region
     * @return  { output: [index1, index2], isValid: false } If two cells with one number have the same number.
     *          { output: (new binaries), isValid: true } Otherwise.
     */
    private _nakedSingle(binaries: number[]): { output: number[], isValid: boolean } {
        // find all values that have to be in some cell
        let once = 0;
        for (let i = 0; i < binaries.length; i++) {
            if (BinaryUtils.has1bit32(binaries[i])) {

                // if two cells must have the same value, find the first cell with the same value
                if ((binaries[i] & once) !== 0) {
                    for (let j = 0; j < binaries.length; j++) {
                        if (binaries[j] === binaries[i]) {
                            return { output: [j, i], isValid: false };
                        }
                    }
                }

                once |= binaries[i];
            }
        }

        // if no two cells must have the same number, find all values that can be removed by naked single strategy
        let output = [];
        for (let binary of binaries) {
            output.push(BinaryUtils.has1bit32(binary) ? binary : binary & ~ once);
        }
        return { output: output, isValid: true };
    }

    /**
     * Apply the strategy single naked on all regions. Return 3 possible outputs:
     *      - If error was found        - Return coordinates of cells causing error.
     *      - If no progress was made
     *      - If progress was made      - Return list of all removed values.
     */
    public nakedSingle(board: number[]): StrategyResult {
        let outputBoard = ArrayUtils.deepcopyArray1d(board);

        let regions = this.sudoku.regions.getAllRegions(true, true, true, true, true);
        for (let region of regions) {
            let output = this._nakedSingle(this.loadRegion32(board, region));
            if (output.isValid) {
                this.saveRegion32(outputBoard, region, output.output);
            } else {

                let errorShift1 = BinaryUtils.binaryToShifts32(board[region[output.output[0]]])[0];
                let errorShift2 = BinaryUtils.binaryToShifts32(board[region[output.output[1]]])[0];
                let error1 = this.indexToCoordinates3d(region[output.output[0]], errorShift1);
                let error2 = this.indexToCoordinates3d(region[output.output[1]], errorShift2);
                return {
                    colors: {
                        error: [error1, error2],
                        region: this.indexToCoordinates2dArray1d(region),
                    },
                    message: "INVALID: Two cells in a region have the same number.",
                    isUpdated: true,
                    isValid: false,
                };

            }
        }

        if (ArrayUtils.equals1d(outputBoard, board)) {
            return { colors: {  }, message: "", isUpdated: false, isValid: true };
        }

        let removed: StrategyCoordinates3d[] = [];
        for (let y = 0; y < this.sudoku.size; y++) {
            for (let x = 0; x < this.sudoku.size; x++) {
                let before = board[y * this.sudoku.size + x];
                let after = outputBoard[y * this.sudoku.size + x];
                if (before !== after) {
                    for (let shift = 0; shift < this.sudoku.size; shift++) {
                        if ((before & 1 << shift) !== (after & 1 << shift)) {
                            removed.push({ y: y, x: x, shift: shift });
                        }
                    }
                }
            }
        }

        return {
            colors: {
                removed: removed,
            },
            message: `Naked single: Removed ${removed.length} numbers.`,
            isUpdated: true,
            isValid: true,
        }
    }
}