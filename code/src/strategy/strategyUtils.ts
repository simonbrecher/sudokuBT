type StrategyColors = {
    removed?: { index: number, shift: number }[], // Numbers that will be removed (yellow)
    reason?: { index: number, shift: number }[],  // Numbers that are the reason for other numbers being removed (green)
    error?: { index: number, shift: number }[],   // Numbers that cause error (red)
    regions?: {
        region: number[], // cells in the region
        css: string // CSS style used for each cell
    }[],
};

type StrategyResult = {
    colors: StrategyColors, // Numbers and cells to color
    name: string, // Name of strategy result (for example Region - Naked Pair)
    message: string, // Message of explanation of the strategy result
    isUpdated: boolean, // true iff the strategy can make any progress
    isValid: boolean, // false iff no solution can exist
};

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
     * Convert 1d array [index1, index2, ...] and shift to [{index: index1, shift: shift}, {index: index2, shift: shift}, ...]
     */
    public static mergeIndicesAndShift(indices: number[], shift: number): { index: number, shift: number }[] {
        let output = [];
        for (let index of indices) {
            output.push({ index: index, shift: shift });
        }
        return output;
    }

    /**
     * Convert StrategyRegionCoordinates2d[] to StrategyCoordinates3d[]
     */
    public static regionIndexToIndex(regionIndices: number[], region: number[]): number[] {
        let output = [];
        for (let regionIndex of regionIndices) {
            output.push(region[regionIndex]);
        }
        return output;
    }

    public static regionIndexShiftToIndexShift(
        positions: { index: number, shift: number }[], region: number[]
    ): { index: number, shift: number }[] {
        let output = [];
        for (let position of positions) {
            output.push({ index: region[position.index], shift: position.shift});
        }
        return output;
    }

    /**
     * Extract shifts from objects and return them as array
     */
    public static extractShifts(regionIndices: { index: number, shift: number }[]): number[] {
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