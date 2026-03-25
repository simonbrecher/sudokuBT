class StrategyUtils {

    /**
     * Load region from 1d board.
     */
    public static loadRegion32(board: number[], region: number[]): number[] {
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
    public static saveRegion32(board: number[], region: number[], binaries: number[]): void {
        for (let i = 0; i < region.length; i++) {
            board[region[i]] &= binaries[i];
        }
    }

    /**
     * Convert 1d index (y * width + x) into 2d index ( { y: y, x: x } )
     */
    public static indexToCoordinates2d(index: number, size: number): StrategyCoordinates2d {
        return { y: Math.floor(index / size), x: index % size };
    }

    /**
     * Convert 1d array of 1d indices (y * width + x) into 1d array of 2d indices ( { y: y, x: x } )
     */
    public static indexToCoordinates2dArray1d(indices: number[], size: number): StrategyCoordinates2d[] {
        let output = [];
        for (let index of indices) {
            output.push(this.indexToCoordinates2d(index, size));
        }
        return output;
    }

    /**
     * Convert 1d index (y * width + x) and shift into 3d index ( { y: y, x: x, shift: shift } )
     * @param index (y * width + x)
     * @param shift third coordinate
     * @param size size of sudoku
     */
    public static indexToCoordinates3d(index: number, shift: number, size: number): StrategyCoordinates3d {
        return { y: Math.floor(index / size), x: index % size, shift: shift };
    }

    /**
     * Convert 1d array of 1d indices (y * width + x) and shift into 3d indices ( { y: y, x: x, shift: shift } )
     */
    public static indexToCoordinates3dArray1dIndices(indices: number[], shift: number, size: number): StrategyCoordinates3d[] {
        let output = [];
        for (let index of indices) {
            output.push(this.indexToCoordinates3d(index, shift, size));
        }
        return output;
    }

    /**
     * Convert 1d index (y * width + x) and 1d array of shifts into 3d indices ( { y: y, x: x, shift: shift } )
     */
    public static indexToCoordinates3dArray1dShifts(index: number, shifts: number[], size: number): StrategyCoordinates3d[] {
        let output = [];
        for (let shift of shifts) {
            output.push(this.indexToCoordinates3d(index, shift, size));
        }
        return output;
    }

    /**
     * Convert StrategyRegionCoordinates2d[] to StrategyCoordinates3d[]
     */
    public static regionCoordinates2dTo3dArray1d(regionIndices: StrategyRegionCoordinates2d[], region: number[], size: number): StrategyCoordinates3d[] {
        let output = [];
        for (let regionIndex of regionIndices) {
            output.push(this.indexToCoordinates3d(region[regionIndex.index], regionIndex.shift, size));
        }
        return output;
    }

    /**
     * Convert StrategyRegionCoordinates2d[] to index[]
     */
    public static regionCoordinates2dToShiftArray1d(regionIndices: StrategyRegionCoordinates2d[]): number[] {
        let output = [];
        for (let regionIndex of regionIndices) {
            output.push(regionIndex.shift);
        }
        return output;
    }

    public static joinShiftsToText(shifts: number[]): string {
        let copyShifts = ArrayUtils.deepcopyArray1d(shifts);
        copyShifts.sort((a, b) => a - b);
        switch (copyShifts.length) {
            case 0:
                throw "ERROR: SudokuStrategy.joinShiftsToText : shifts=[]";
            case 1:
                return `${copyShifts[0] + 1}`;
            default:
                let texts = [];
                for (let shift of copyShifts) {
                    texts.push(`${shift + 1}`);
                }
                let last = texts.pop();
                let text = texts.join(", ");
                return `${text} and ${last}`;
        }
    }
}