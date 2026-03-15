type StrategyCoordinates2d = { y: number, x: number };
type StrategyCoordinates3d = { y: number, x: number, shift: number };
type StrategyRegionCoordinates2d = { index: number, shift: number };
type StrategyColors = {
    removed?: StrategyCoordinates3d[], // numbers that will be removed
    reason?: StrategyCoordinates3d[],  // numbers that are the reason for other numbers being removed
    error?: StrategyCoordinates3d[],   // numbers that cause error
    region1?: StrategyCoordinates2d[],  // cells of a region (1st color)
    region2?: StrategyCoordinates2d[],  // cells of a region (2nd color)
    region3?: StrategyCoordinates2d[],  // cells of a region (3rd color)
};
type StrategyResult = {
    colors: StrategyColors,
    name: string,
    message: string,
    isUpdated: boolean,
    isValid: boolean,
};
type StrategyRegionProof = {
    isSource: boolean,
    isValid: boolean,
    size: number,
    reason: StrategyRegionCoordinates2d[],
    removed: StrategyRegionCoordinates2d[],
    priority: number, // lower number = higher priority, -1 for error and 1000 for non-updated
}
type StrategyPointingProof = {
    region1: number[], // region that is missing a number
    region2: number[], // region that has a number that is supposed to be deleted
    intersection: number[], // intersection of both regions
    binaries2: number[],
    binariesIntersection: number[],
    proof: number,
}
type StrategyIntersectionProof = {
    isSource: boolean,
    isValid: boolean,
    size: number,
    reason: StrategyCoordinates3d[],
    removed: StrategyCoordinates3d[],
    region1: StrategyCoordinates2d[],
    region2: StrategyCoordinates2d[],
    region3: StrategyCoordinates2d[],
    priority: number, // lower number = higher priority, -1 for error and 1000 for non-updated
}

class Strategy2d {
    private static readonly REGION_SIZE_TEXT = ["Single", "Pair", "Triple", "Quadruple"];

    private static sudoku: Sudoku | null = null;

    /**
     * Load region from 1d board.
     */
    private static loadRegion32(board: number[], region: number[]): number[] {
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
    private static saveRegion32(board: number[], region: number[], binaries: number[]): void {
        for (let i = 0; i < region.length; i++) {
            board[region[i]] &= binaries[i];
        }
    }

    /**
     * Convert 1d index (y * width + x) into 2d index ( { y: y, x: x } )
     */
    private static indexToCoordinates2d(index: number): StrategyCoordinates2d {
        return { y: Math.floor(index / this.sudoku!.size), x: index % this.sudoku!.size };
    }

    /**
     * Convert 1d array of 1d indices (y * width + x) into 1d array of 2d indices ( { y: y, x: x } )
     */
    private static indexToCoordinates2dArray1d(indices: number[]): StrategyCoordinates2d[] {
        let output = [];
        for (let index of indices) {
            output.push(this.indexToCoordinates2d(index));
        }
        return output;
    }

    /**
     * Convert 1d index (y * width + x) and shift into 3d index ( { y: y, x: x, shift: shift } )
     * @param index (y * width + x)
     * @param shift third coordinate
     */
    private static indexToCoordinates3d(index: number, shift: number): StrategyCoordinates3d {
        return { y: Math.floor(index / this.sudoku!.size), x: index % this.sudoku!.size, shift: shift };
    }

    /**
     * Convert 1d array of 1d indices (y * width + x) and shift into 3d indices ( { y: y, x: x, shift: shift } )
     */
    private static indexToCoordinates3dArray1dIndices(indices: number[], shift: number): StrategyCoordinates3d[] {
        let output = [];
        for (let index of indices) {
            output.push(this.indexToCoordinates3d(index, shift));
        }
        return output;
    }

    /**
     * Convert 1d index (y * width + x) and 1d array of shifts into 3d indices ( { y: y, x: x, shift: shift } )
     */
    private static indexToCoordinates3dArray1dShifts(index: number, shifts: number[]): StrategyCoordinates3d[] {
        let output = [];
        for (let shift of shifts) {
            output.push(this.indexToCoordinates3d(index, shift));
        }
        return output;
    }

    /**
     * Convert StrategyRegionCoordinates2d[] to StrategyCoordinates3d[]
     */
    private static regionCoordinates2dTo3dArray1d(regionIndices: StrategyRegionCoordinates2d[], region: number[]): StrategyCoordinates3d[] {
        let output = [];
        for (let regionIndex of regionIndices) {
            output.push(this.indexToCoordinates3d(region[regionIndex.index], regionIndex.shift));
        }
        return output;
    }

    /**
     * Convert StrategyRegionCoordinates2d[] to index[]
     */
    private static regionCoordinates2dToShiftArray1d(regionIndices: StrategyRegionCoordinates2d[], region: number[]): number[] {
        let output = [];
        for (let regionIndex of regionIndices) {
            output.push(regionIndex.shift);
        }
        return output;
    }

    private static joinShiftsToText(shifts: number[]): string {
        let copyShifts = ArrayUtils.deepcopyArray1d(shifts);
        copyShifts.sort((a, b) => a - b);
        switch (copyShifts.length) {
            case 0:
                throw "ERROR: Strategy2d.joinShiftsToText : shifts=[]";
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

    /**
     * Apply the strategy Naked single on one region.
     * @param binaries 1d array with binary representations of cells in region
     * @return  { output: [index1, index2], isValid: false } If two cells with one number have the same number.
     *          { output: (new binaries), isValid: true } Otherwise.
     */
    private static _nakedSingle(binaries: number[]): { output: number[], isValid: boolean } {
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
    public static nakedSingle(state: State): StrategyResult {
        this.sudoku = state.sudoku;
        let board = state.board;

        let outputBoard = ArrayUtils.deepcopyArray1d(board);

        for (let i = 0; i < board.length; i++) {
            if (board[i] == 0) {
                return {
                    colors: {
                        error: [this.indexToCoordinates3d(i, -1)],
                    },
                    name: "INVALID",
                    message: "There is no number in a cell.",
                    isUpdated: true,
                    isValid: false,
                }
            }
        }

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
                        region1: this.indexToCoordinates2dArray1d(region),
                    },
                    name: "INVALID",
                    message: "Two cells in a region have the same number.",
                    isUpdated: true,
                    isValid: false,
                };

            }
        }

        if (ArrayUtils.equals1d(outputBoard, board)) {
            return { colors: {  }, name: "", message: "", isUpdated: false, isValid: true };
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
            name: "Naked Single",
            message: `Removed ${removed.length} numbers.`,
            isUpdated: true,
            isValid: true,
        }
    }

    /**
     * Apply the strategy Naked single on one region.
     * @param binaries 1d array with binary representations of cells in region
     * @return reason:      all values that caused any other value to be removed
     * @return removed:     all values that will be removed
     * @return multiple:    cell and all shifts that can not be in any other cell
     * @return missing:     all shifts that can not be in any cell
     * @return isUpdated:   true if any progress was made, or isValid==false
     * @return isValid:     false if region is known to have no solution
     */
    private static _hiddenSingle(binaries: number[]): {
        reason?: StrategyRegionCoordinates2d[], removed?: StrategyRegionCoordinates2d[],
        multiple?: { cell: number, shifts: number[] }, missing?: number[],
        isUpdated: boolean, isValid: boolean,
    }
    {
        // find all values that are in one/multiple/zero cells
        let once = 0;
        let twice = 0;
        for (let binary of binaries) {
            twice |= once & binary;
            once |= binary;
        }
        once &= ~ twice;
        let zero = BinaryUtils.createFullBinary(binaries.length) & ~ (once | twice);

        // number(s) cannot be in any cell
        if (zero !== 0) {
            return { missing: BinaryUtils.binaryToShifts32(zero), isUpdated: true, isValid: false };
        }

        // check what values can be removed
        let reason = [];
        let removed = [];
        for (let i = 0; i < binaries.length; i++) {
            if ((binaries[i] & once) !== 0) {

                // multiple numbers have to be in one cell
                if (! BinaryUtils.has1bit32(binaries[i] & once)) {
                    let multiple = { cell: i, shifts: BinaryUtils.binaryToShifts32(binaries[i] & once) };
                    return { multiple: multiple, isUpdated: true, isValid: false };
                }

                let isReason = false;
                for (let shift of BinaryUtils.binaryToShifts32(binaries[i] & ~ once)) {
                    isReason = true;
                    removed.push({ index: i, shift: shift });
                }
                if (isReason) {
                    reason.push({ index: i, shift: BinaryUtils.binaryToShifts32(binaries[i] & once)[0], });
                }
            }
            binaries[i] &= ~ once;
        }

        return { reason: reason, removed: removed, isUpdated: removed.length > 0, isValid: true, };
    }

    /**
     * Apply the strategy hidden naked on all regions.
     * If any region is invalid, return error for first invalid region.
     * If all region are valid and any region can be progressed, return progress for first progressed region.
     * Otherwise, nothing is changed.
     */
    public static hiddenSingle(state: State): StrategyResult {
        this.sudoku = state.sudoku;
        let board = state.board;

        let regions = this.sudoku!.regions.getAllRegions(true, true, true, true, true);
        let result = null;
        let resultRegion = null
        for (let region of regions) {
            let newResult = this._hiddenSingle(this.loadRegion32(board, region));
            if (result === null || ! newResult.isValid || ! result.isUpdated && newResult.isUpdated) {
                result = newResult;
                resultRegion = region;
                if (! result.isValid) {
                    if (result.missing !== undefined) {
                        return {
                            colors: {
                                error: this.indexToCoordinates3dArray1dIndices(region, -1),
                                region1: this.indexToCoordinates2dArray1d(region),
                            },
                            name: "INVALID",
                            message: `Number${result.missing.length > 1 ? 's' : ''} ${this.joinShiftsToText(result.missing)} can not be in any cell in the region.`,
                            isUpdated: true,
                            isValid: false,
                        }
                    } else if (result.multiple !== undefined) {
                        return {
                            colors: {
                                error: this.indexToCoordinates3dArray1dShifts(region[result.multiple.cell], result.multiple.shifts),
                                region1: this.indexToCoordinates2dArray1d(region),
                            },
                            name: "INVALID",
                            message: `Numbers ${this.joinShiftsToText(result.multiple.shifts)} can be only in the same cell in the region.`,
                            isUpdated: true,
                            isValid: false,
                        }
                    } else {
                        throw "Strategy2d.hiddenSingle : result.missing === undefined && result.missing === undefined";
                    }
                }
            }
        }

        if (result === null || ! result.isUpdated) {
            return { colors: {  }, name: "", message: "", isUpdated: false, isValid: true };
        }

        let reason = [];
        for (let reasonOne of result.reason!) {
            reason.push(reasonOne.index);
        }
        let reasonNumberText = result.reason!.length > 1 ? 'Numbers' : 'Number';
        let reasonListText = this.joinShiftsToText(this.regionCoordinates2dToShiftArray1d(result.reason!, resultRegion!));
        let cellText = result.reason!.length > 1 ? 'these cells' : 'this cell';
        let removedNumberText = result.removed!.length > 1 ? 'numbers' : 'number';
        return {
            colors: {
                reason: this.regionCoordinates2dTo3dArray1d(result.reason!, resultRegion!),
                removed: this.regionCoordinates2dTo3dArray1d(result.removed!, resultRegion!),
                region1: this.indexToCoordinates2dArray1d(resultRegion!),
            },
            name: "Hidden Single",
            message: `
                ${reasonNumberText} ${reasonListText} can be only in one cell from the region.
                The other ${result.removed!.length} ${removedNumberText} in ${cellText} can be removed.
            `,
            isUpdated: true,
            isValid: true,
        }
    }

    private static getMessageNakedHidden(isSource: boolean, size: number): {name: string, message: string} {
        let sizeText = size <= this.REGION_SIZE_TEXT.length ? this.REGION_SIZE_TEXT[size - 1] : `${size}-tuple`;
        let number = size == 1 ? "number" : "numbers";
        let cell = size == 1 ? "cell" : "cells";
        let this1 = size == 1 ? "this" : "these";
        if (isSource) {
            return {
                name: `Naked ${sizeText}`,
                message:
                    `
                    In ${size} ${cell} of the region there can only be ${size} ${number},
                    therefore ${this1} ${number} cannot be in any other cell in the region.
                    `,
            };
        } else {
            return {
                name: `Hidden ${sizeText}`,
                message:
                    `
                    ${size} ${number} can only be in ${size} ${cell} in the region, 
                    therefore there cannot be any other number in ${this1} ${cell}.
                    `,
            };
        }
    }

    /**
     * Try to find any smallest proof using hall's theorem, that some edges are perfectly unmatchable.
     * Source -> naked candidate - on positions <set> there can only be numbers <matched>.
     * Sink -> hidden candidate - numbers <matched> can only be on positions <set>.
     */
    private static _region(binaries: number[]): StrategyRegionProof[] {
        let edges = BinaryUtils.binaryToShifts(binaries);

        let hallProof = PerfectMatching.getHallProof(edges);

        if (hallProof == "no-matching") {
            throw "NO MATCHING (TODO)"; // TODO
        }
        if (hallProof === "no-unmatchable-edge") {
            return [];
        }

        let isSource = hallProof.source.set.length <= hallProof.sink.set.length;
        let proof = isSource ? hallProof.source : hallProof.sink;

        let reason: StrategyRegionCoordinates2d[] = [];
        for (let a of proof.set) {
            for (let b of edges[a]) {
                if (proof.matched.includes(b)) {
                    reason.push({index: a, shift: b});
                }
            }
        }

        let removed: StrategyRegionCoordinates2d[] = [];
        for (let edge of proof.edges) {
            let [a, b] = edge;
            removed.push({index: a, shift: b});
        }

        return [{
            isSource: isSource,
            isValid: true,
            size: proof.set.length,
            reason: reason,
            removed: removed,
            priority: proof.set.length + (isSource ? 0 : 0.5),
        }];
    }

    public static region(state: State): StrategyResult {
        this.sudoku = state.sudoku;
        let board = state.board;

        let regions = this.sudoku!.regions.getAllRegions(true, true, true, true, true);
        let result = null;
        let resultRegion = null;
        for (let region of regions) {
            let newResults = this._region(this.loadRegion32(board, region));
            for (let newResult of newResults) {
                if (result === null || newResult.priority < result.priority) {
                    result = newResult;
                    resultRegion = region;
                }
            }
            if (result !== null && ! result.isValid) {
                break;
            }
        }

        if (result === null) {
            return { colors: {}, name: "", message: "", isUpdated: false, isValid: true, }

        } else if (result.isValid) {
            let {name: name, message: message} = this.getMessageNakedHidden(result.isSource, result.size);

            return {
                colors: {
                    reason: this.regionCoordinates2dTo3dArray1d(result.reason!, resultRegion!),
                    removed: this.regionCoordinates2dTo3dArray1d(result.removed!, resultRegion!),
                    region1: this.indexToCoordinates2dArray1d(resultRegion!),
                },
                name: name,
                message: message,
                isUpdated: true,
                isValid: true,
            }

        } else {
            throw "TODO invalid"; // TODO
        }
    }

    private static splitRegionsToIntersections(region1: number[], region2: number[]): number[][] {
        let set1 = new Set(region1);
        let set2 = new Set(region2);
        let r1 = region1.filter(x => !set2.has(x));
        let r2 = region2.filter(x => !set1.has(x));
        let intersection = region1.filter(x => set2.has(x));
        return [r1, r2, intersection];
    }

    private static _pointing(
        r1: number[], r2: number[], intersection: number[], board: number[]
    ): StrategyPointingProof | null {
        let binaries1 = this.loadRegion32(board, r1);
        let binaries2 = this.loadRegion32(board, r2);
        let binariesIntersection = this.loadRegion32(board, intersection);

        let binary1 = BinaryUtils.or(binaries1);
        let binary2 = BinaryUtils.or(binaries2);

        let proof = binary2 & ~ binary1;
        if (proof != 0) {
            return {
                binaries2: binaries2, binariesIntersection: binariesIntersection, region1: r1, region2: r2,
                intersection: intersection, proof: proof,
            };
        }

        proof = binary1 & ~ binary2;
        if (proof != 0) {
            return {
                binaries2: binaries1, binariesIntersection: binariesIntersection, region1: r2, region2: r1,
                intersection: intersection, proof: proof,
            };
        }

        return null;
    }

    public static pointing(state: State): StrategyResult {
        this.sudoku = state.sudoku;
        let board = state.board;

        let result: StrategyPointingProof | null = null;

        let regions = state.sudoku.regions.getAllRegions(true, true, true, true, true);
        for (let i = 0; i < regions.length; i++) {
            for (let j = 0; j < i; j++) {
                let region1 = regions[i];
                let region2 = regions[j];
                let [r1, r2, intersection] = this.splitRegionsToIntersections(region1, region2);
                let isIntersectionOk = r1.length > 0 && r2.length > 0 && intersection.length >= 2;

                if (isIntersectionOk) {
                    result = this._pointing(r1, r2, intersection, board);
                }

                if (result !== null) {
                    break;
                }
            }
            if (result !== null) {
                break;
            }
        }

        if (result !== null) {
            let reason = [];
            for (let i = 0; i < result.intersection.length; i++) {
                let index = result.intersection[i];
                let binary = result.binaries2[i] & result.proof;
                for (let shift of BinaryUtils.binaryToShifts32(binary)) {
                    reason.push(this.indexToCoordinates3d(index, shift));
                }
            }

            let removed = [];
            for (let i = 0; i < result.region2.length; i++) {
                let index = result.region2[i];
                let binary = result.binaries2[i] & result.proof;
                for (let shift of BinaryUtils.binaryToShifts32(binary)) {
                    removed.push(this.indexToCoordinates3d(index, shift));
                }
            }

            return {
                isValid: true,
                isUpdated: true,
                colors: {
                    removed: removed,
                    reason: reason,
                    region1: this.indexToCoordinates2dArray1d(result.region1),
                    region2: this.indexToCoordinates2dArray1d(result.region2),
                    region3: this.indexToCoordinates2dArray1d(result.intersection),
                },
                name: "Pointing",
                message: `
                If all occurrences of a number in a region are inside another region,
                this number can not be in that region anywhere else.
                `,
            };
        }

        return { colors: {}, name: "", message: "", isUpdated: false, isValid: true, };
    }

    private static _intersection(
        board: number[], shift: number, regions1: number[][], regions2: number[][]
    ): StrategyIntersectionProof | null {
        let size = this.sudoku!.size;
        let shiftBinary = 1 << shift;

        // for each 1d index of cell, get in what region of regions1 and regions2 it is
        let r1 = ArrayUtils.createArray1d(size * size, null);
        let r2 = ArrayUtils.createArray1d(size * size, null);
        for (let r = 0; r < size; r++) {
            for (let i = 0; i < size; i++) {
                r1[regions1[r][i]] = r;
                r2[regions2[r][i]] = r;
            }
        }

        // find what intersections of regions (coordinates) can have at least 1 of shift in board
        let hasEdge = ArrayUtils.createArray2d(size, size, false);
        for (let index = 0; index < size * size; index++) {
            if ((board[index] & shiftBinary) != 0) {
                hasEdge[r1[index]][r2[index]] = true;
            }
        }

        // get bipartite graph
        let edges = ArrayUtils.createArray2d(size, 0, null);
        for (let r1 = 0; r1 < size; r1++) {
            for (let r2 = 0; r2 < size; r2++) {
                if (hasEdge[r1][r2]) {
                    edges[r1].push(r2);
                }
            }
        }

        let hallProof = PerfectMatching.getHallProof(edges);

        if (hallProof == "no-matching") {
            throw "NO MATCHING (TODO)"; // TODO
        }
        if (hallProof === "no-unmatchable-edge") {
            return null;
        }

        let isSource = hallProof.source.set.length <= hallProof.sink.set.length;
        let proof = isSource ? hallProof.source : hallProof.sink;

        // get all cells that are in regions of the intersection
        let proofRegions1 = [];
        for (let a of proof.set) {
            for (let index of regions1[a]) {
                proofRegions1.push(index);
            }
        }
        let proofRegions2 = [];
        for (let b of proof.matched) {
            for (let index of regions2[b]) {
                proofRegions2.push(index);
            }
        }

        let [proofR1, proofR2, proofIntersection] = this.splitRegionsToIntersections(proofRegions1, proofRegions2);

        let reason: StrategyCoordinates3d[] = [];
        for (let index of proofIntersection) {
            if ((board[index] & shiftBinary) != 0) {
                reason.push(this.indexToCoordinates3d(index, shift));
            }
        }

        let removedRegion = isSource ? proofR2 : proofR1;
        let removed: StrategyCoordinates3d[] = [];
        for (let index of removedRegion) {
            if ((board[index] & shiftBinary) != 0) {
                removed.push(this.indexToCoordinates3d(index, shift));
            }
        }

        return {
            isSource: isSource,
            isValid: true,
            size: proof.set.length,
            reason: reason,
            removed: removed,
            region1: this.indexToCoordinates2dArray1d(proofR1),
            region2: this.indexToCoordinates2dArray1d(proofR2),
            region3: this.indexToCoordinates2dArray1d(proofIntersection),
            priority: proof.set.length,
        };
    }

    public static intersection(state: State): StrategyResult {
        this.sudoku = state.sudoku;
        let board = state.board;

        let regions: [number[][], number[][]][] = [];
        let rows = this.sudoku.regions.rows;
        let columns = this.sudoku.regions.columns;
        regions.push([rows, columns]);
        if (this.sudoku.regions.hasRegions()) {
            let regions1 = this.sudoku.regions.regions;
            regions.push([regions1, rows]);
            regions.push([regions1, columns]);
        }


        let result: StrategyIntersectionProof | null = null;
        for (let [region1, region2] of regions) {
            for (let shift = 0; shift < this.sudoku.size; shift++) {
                let newResult = this._intersection(board, shift, region1, region2);
                if (result === null || newResult !== null && newResult.priority < result.priority) {
                    result = newResult;
                }
            }
        }

        if (result === null) {
            return {colors: {}, isUpdated: false, isValid: true, name: "", message: "",};
        }

        return {
            colors: {
                reason: result.reason,
                removed: result.removed,
                region1: result.region1,
                region2: result.region2,
                region3: result.region3,
            },
            isUpdated: true,
            isValid: true,
            name: "X Wing",
            message: `
                If all occurrences of a number in ${result.size} regions are inside another ${result.size} regions,
                this number can not be in those regions anywhere else.
                `,
        };
    }
}