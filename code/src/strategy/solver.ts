class Solver {
    public static solver: Solver = new Solver();

    constructor() {

    }

    /**
     * If there is only one number in a cell, this number cannot be in any other cell.
     * If there are two cells that can have only one same number, the second of the cells cannot have any number. (no solution)
     */
    private solveRegionMaxOne(binaries: number[]): void {
        let once = 0;
        for (let i = 0; i < binaries.length; i++) {
            binaries[i] &= ~ once;
            if (BinaryUtils.has1bit32(binaries[i])) {
                once |= binaries[i];
            }
        }
        for (let i = 0; i < binaries.length; i++) {
            if (! BinaryUtils.has1bit32(binaries[i])) {
                binaries[i] &= ~ once;
            }
        }
    }

    /**
     * If one number can be only in one cell, no other number can be in that cell.
     * If two numbers can only be in one cell, there cannot be any number in that cell. (no solution)
     */
    private solveRegionMinOne(binaries: number[], fullBinary: number): void {
        let once = 0;
        let twice = 0;
        for (let i = 0; i < binaries.length; i++) {
            twice |= once & binaries[i];
            once |= binaries[i];
        }
        once &= ~ twice;

        if ((once | twice) !== fullBinary) {
            binaries[0] = 0;
        }

        for (let i = 0; i < binaries.length; i++) {
            if ((binaries[i] & once) !== 0) {
                binaries[i] &= once;
                if (! BinaryUtils.has1bit32(binaries[i])) {
                    binaries[i] = 0;
                }
            }
        }
    }

    public solveRegion(binaries: number[], sudoku: Sudoku): void {
        this.solveRegionMaxOne(binaries);
        this.solveRegionMinOne(binaries, sudoku.fullBinary);
    }

    public solveRegions(state: State): void {
        let regions = state.sudoku.regions.getAllRegions();
        for (let region of regions) {
            let binaries = []
            for (let index of region) {
                binaries.push(state.board[index]);
            }
            this.solveRegion(binaries, state.sudoku);
            for (let i = 0; i < region.length; i++) {
                state.board[region[i]] = binaries[i];
            }
        }
    }

    private solveOne(state: State): void {
        this.solveRegions(state);
    }

    /**
     * Statically solve sudoku puzzle, as much as possible.
     */
    public solve(state: State): void {
        let previousProgress = null;
        let progress = state.getExtraBitCount();
        while (progress !== previousProgress) {
            this.solveOne(state);

            previousProgress = progress;
            progress = state.getExtraBitCount();
        }
    }

    /**
     * Count number of solutions in unsolved state
     * @return
     * - 0: 0 solutions exist
     * - 1: 1 solution exists               (unlike State.countSolutions() we know it cannot be 0)
     * - 2: 0, 1 or more solutions exist
     */
    public countSolutionsUnsolved(state: State): number {
        let copy = state.deepcopy();
        this.solve(copy);
        return copy.countSolutions();
    }
}