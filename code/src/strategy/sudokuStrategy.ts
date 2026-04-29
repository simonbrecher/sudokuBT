type StrategyRegionProof = {
    isSource: boolean,
    isValid: boolean,
    size: number,
    reason: { index: number; shift: number }[],
    removed: { index: number; shift: number }[],
    priority: number, // lower number = higher priority, -1 for error and 1000 for non-updated
}
type StrategyPointingProof = {
    region1: number[], // region that is missing a number
    region2: number[], // region that has a number that is supposed to be deleted
    intersection: number[], // intersection of both regions
    proof: number,
}
type StrategyIntersectionProof = {
    isSource: boolean,
    isValid: boolean,
    size: number,
    reason: { index: number, shift: number }[],
    removed: { index: number, shift: number }[],
    regionDifference: number[],
    regionIntersection: number[],
    priority: number, // lower number = higher priority, -1 for error and 1000 for non-updated
}

class SudokuStrategy {
    private static readonly REGION_SIZE_TEXT = ["Single", "Pair", "Triple", "Quadruple"];

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
        let size = state.sudoku.size;
        let board = state.board;

        let outputBoard = ArrayUtils.deepcopyArray1d(board);

        for (let i = 0; i < board.length; i++) {
            if (board[i] == 0) {
                return {
                    colors: {
                        error: [{ index: i, shift: -1 }],
                    },
                    name: "Naked Single - Error",
                    message: "There is no number in a cell.",
                    isUpdated: true,
                    isValid: false,
                }
            }
        }

        let reasonSet: Set<number> = new Set();

        let regions = state.sudoku.regions.getAllRegions();
        for (let region of regions) {
            let input = StrategyUtils.loadRegion32(board, region);

            let result = this._nakedSingle(ArrayUtils.deepcopyArray1d(input));

            if (result.isValid) {
                if (! ArrayUtils.equals1d(result.output, input)) {
                    StrategyUtils.saveRegion32(outputBoard, region, result.output);

                    let missing = 0;
                    for (let i = 0; i < input.length; i++) {
                        missing |= input[i] & ~ result.output[i];
                    }
                    for (let i = 0; i < input.length; i++) {
                        if (BinaryUtils.has1bit32(input[i]) && (input[i] & missing) != 0) {
                            reasonSet.add(region[i]);
                        }
                    }
                }

            } else {
                let error = [];
                for (let regionIndex of result.output) {
                    let index = region[regionIndex];
                    // BinaryUtils.binaryToShifts32() returns array with 1 element, because there is 1 bit, so use [0] to unpack it
                    let shift = BinaryUtils.binaryToShifts32(board[index])[0];
                    error.push({ index: index, shift: shift });
                }
                return {
                    colors: {
                        error: error,
                        regions: [{ region: region, css: "background-region-1" }],
                    },
                    name: "Naked Single - Error",
                    message: "Two cells in a region have the same number.",
                    isUpdated: true,
                    isValid: false,
                };

            }
        }

        if (ArrayUtils.equals1d(outputBoard, board)) {
            return { colors: {  }, name: "", message: "", isUpdated: false, isValid: true };
        }

        let reason: { index: number, shift: number }[] = [];
        for (let index of Array.from(reasonSet)) {
            let shift = BinaryUtils.binaryToShifts32(board[index])[0];
            reason.push({ index: index, shift: shift });
        }

        let removed: { index: number, shift: number }[] = [];
        for (let index = 0; index < size * size; index++) {
            let before = board[index];
            let after = outputBoard[index];
            if (before !== after) {
                for (let shift = 0; shift < size; shift++) {
                    if ((before & 1 << shift) !== (after & 1 << shift)) {
                        removed.push({ index: index, shift: shift });
                    }
                }
            }
        }

        return {
            colors: {
                reason: reason,
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
        reason?: { index: number, shift: number }[], removed?: { index: number, shift: number }[], // TODO regionIndex
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
        let size = state.sudoku.size;
        let board = state.board;

        let regions = state.sudoku.regions.getAllRegions();
        let result = null;
        let resultRegion = null
        for (let region of regions) {
            let newResult = this._hiddenSingle(StrategyUtils.loadRegion32(board, region));
            if (result === null || ! newResult.isValid || ! result.isUpdated && newResult.isUpdated) {
                result = newResult;
                resultRegion = region;
                if (! result.isValid) {
                    if (result.missing !== undefined) {
                        return {
                            colors: {
                                error: StrategyUtils.mergeIndicesAndShift(region, -1),
                            },
                            name: "Hidden Single - Error",
                            message: `Number${result.missing.length > 1 ? 's' : ''} ${StrategyUtils.joinShiftsToText(result.missing)} can not be in any cell in the region.`,
                            isUpdated: true,
                            isValid: false,
                        }
                    } else if (result.multiple !== undefined) {
                        let index = region[result.multiple.cell];
                        let error =  [];
                        for (let shift of result.multiple.shifts) {
                            error.push({ index: index, shift: shift });
                        }

                        return {
                            colors: {
                                error: error,
                                regions: [{ region: region, css: "background-region-1" }],
                            },
                            name: "Hidden Single - Error",
                            message: `Numbers ${StrategyUtils.joinShiftsToText(result.multiple.shifts)} can be only in the same cell in the region.`,
                            isUpdated: true,
                            isValid: false,
                        }
                    } else {
                        throw "SudokuStrategy.hiddenSingle : result.missing === undefined && result.missing === undefined";
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
        let reasonListText = StrategyUtils.joinShiftsToText(StrategyUtils.extractShifts(result.reason!));
        let cellText = result.reason!.length > 1 ? 'these cells' : 'this cell';
        let removedNumberText = result.removed!.length > 1 ? 'numbers' : 'number';
        return {
            colors: {
                reason: StrategyUtils.regionIndexShiftToIndexShift(result.reason!, resultRegion!),
                removed: StrategyUtils.regionIndexShiftToIndexShift(result.removed!, resultRegion!),
                regions: [{ region: resultRegion!, css: "background-region-1" }],
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
                name: `Region - Naked ${sizeText}`,
                message:
                    `
                    In ${size} ${cell} of the region there can only be ${size} ${number},
                    therefore ${this1} ${number} cannot be in any other cell in the region.
                    `,
            };
        } else {
            return {
                name: `Region - Hidden ${sizeText}`,
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
            return []; // TODO
        }
        if (hallProof === "no-unmatchable-edge") {
            return [];
        }

        let isSource = hallProof.source.set.length <= hallProof.sink.set.length;
        let proof = isSource ? hallProof.source : hallProof.sink;

        let reason: { index: number, shift: number }[] = [];
        for (let a of proof.set) {
            for (let b of edges[a]) {
                if (proof.matched.includes(b)) {
                    reason.push({index: a, shift: b});
                }
            }
        }

        let removed: { index: number, shift: number }[] = [];
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
        let board = state.board;

        let regions = state.sudoku.regions.getAllRegions();
        let result = null;
        let resultRegion = null;
        for (let region of regions) {
            let newResults = this._region(StrategyUtils.loadRegion32(board, region));
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
                    reason: StrategyUtils.regionIndexShiftToIndexShift(result.reason!, resultRegion!),
                    removed: StrategyUtils.regionIndexShiftToIndexShift(result.removed!, resultRegion!),
                    regions: [{ region: resultRegion!, css: "background-region-1" }],
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
        let binary1 = BinaryUtils.or(StrategyUtils.loadRegion32(board, r1));
        let binary2 = BinaryUtils.or(StrategyUtils.loadRegion32(board, r2));

        let proof = binary2 & ~ binary1;
        if (proof != 0) {
            return { region1: r1, region2: r2, intersection: intersection, proof: proof, };
        }

        proof = binary1 & ~ binary2;
        if (proof != 0) {
            return { region1: r2, region2: r1, intersection: intersection, proof: proof, };
        }

        return null;
    }

    public static pointing(state: State): StrategyResult {
        let board = state.board;
        let regions = state.sudoku.regions.getAllRegions();

        let result: StrategyPointingProof | null = null;

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
            for (let index of result.intersection) {
                let binary = board[index] & result.proof;
                for (let shift of BinaryUtils.binaryToShifts32(binary)) {
                    reason.push({ index: index, shift: shift });
                }
            }

            let removed = [];
            for (let index of result.region2) {
                let binary = board[index] & result.proof;
                for (let shift of BinaryUtils.binaryToShifts32(binary)) {
                    removed.push({ index: index, shift: shift });
                }
            }

            return {
                isValid: true,
                isUpdated: true,
                colors: {
                    removed: removed,
                    reason: reason,
                    regions: [
                        { region: result.region1, css: "background-region-1" },
                        { region: result.region2, css: "background-region-1" },
                        { region: result.intersection, css: "background-region-2" },
                    ],
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
        board: number[], shift: number, regions1: number[][], regions2: number[][], size: number
    ): StrategyIntersectionProof | null {
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
            return null; // TODO
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

        let reason: { index: number, shift: number }[] = [];
        for (let index of proofIntersection) {
            if ((board[index] & shiftBinary) != 0) {
                reason.push({ index: index, shift: shift });
            }
        }

        let removedRegion = isSource ? proofR2 : proofR1;
        let removed: { index: number, shift: number }[] = [];
        for (let index of removedRegion) {
            if ((board[index] & shiftBinary) != 0) {
                removed.push({ index: index, shift: shift });
            }
        }

        return {
            isSource: isSource,
            isValid: true,
            size: proof.set.length,
            reason: reason,
            removed: removed,
            regionDifference: ArrayUtils.union(proofR1, proofR2),
            regionIntersection: proofIntersection,
            priority: proof.set.length,
        };
    }

    public static intersection(state: State): StrategyResult {
        let size = state.sudoku.size;
        let board = state.board;

        let regions: [number[][], number[][]][] = [];
        let rows = state.sudoku.regions.rows;
        let columns = state.sudoku.regions.columns;
        regions.push([rows, columns]);
        if (state.sudoku.regions.hasRegions()) {
            let regions1 = state.sudoku.regions.regions;
            regions.push([regions1, rows]);
            regions.push([regions1, columns]);
        }


        let result: StrategyIntersectionProof | null = null;
        for (let [region1, region2] of regions) {
            for (let shift = 0; shift < size; shift++) {
                let newResult = this._intersection(board, shift, region1, region2, size);
                if (result === null || newResult !== null && newResult.priority < result.priority) {
                    result = newResult;
                }
            }
        }

        if (result === null) {
            return {colors: {}, isUpdated: false, isValid: true, name: "", message: "",};

        } else if (result.isValid) {
            return {
                colors: {
                    reason: result.reason,
                    removed: result.removed,
                    regions: [
                        { region: result.regionDifference, css: "background-region-1" },
                        { region: result.regionIntersection, css: "background-region-2" },
                    ]
                },
                isUpdated: true,
                isValid: true,
                name: "X-Wing",
                message: `
                If all occurrences of a number in ${result.size} regions are inside another ${result.size} regions,
                this number can not be in those regions anywhere else.
                `,
            };

        } else {
            throw "TODO invalid"; // TODO
        }
    }
}