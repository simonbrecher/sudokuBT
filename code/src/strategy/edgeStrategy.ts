type EdgeRegionProof = {
    shift: number,
    region: number[],
    cells: number[],
    common: number[],
    reason: { index: number, shift: number }[],
    removed: { index: number, shift: number }[],
    priority: number,
}

class EdgeStrategy {
    // [direction, y, x, index1, index2]
    private static getLabelCells(sudoku: Sudoku): number[][] {
        let output: number[][] = [];
        for (let y = 0; y < sudoku.size; y++) {
            for (let x = 0; x < sudoku.size; x++) {
                let index = y * sudoku.size + x;
                if (x != sudoku.size - 1) {
                    let index2 = y * sudoku.size + (x + 1);
                    output.push([0, y, x, index, index2]);
                }
                if (y != sudoku.size - 1) {
                    let index2 = (y + 1) * sudoku.size + x;
                    output.push([1, y, x, index, index2]);
                }
            }
        }
        return output;
    }

    // direction, y, x, index1, index2 (index1, index2 in correct order)
    private static getLabel(index1: number, index2: number, size: number): [number, number, number, number, number] {
        if (index1 > index2) {
            [index1, index2] = [index2, index1];
        }

        let direction = index2 == index1 + 1 ? 0 : 1;
        let y = Math.floor(index1 / size);
        let x = index1 % size;

        return [direction, y, x, index1, index2];
    }

    private static getCellNeighbours(sudoku: Sudoku, variant: EdgeVariant, labelCells: number[][]): Set<number>[] {
        let output: Set<number>[] = [];
        for (let index = 0; index < sudoku.size * sudoku.size; index++) {
            output.push(new Set([index]));
        }

        for (let [direction, y, x, index1, index2] of labelCells) {
            if (variant.board[direction][y][x] != -1) {
                output[index1].add(index2);
                output[index2].add(index1);
            }
        }

        return output;
    }

    private static _label(binary1: number, binary2: number, neighbours: number[])
        : {priority: number, binary1: number, binary2: number}
    {
        let output1 = 0;
        let output2 = 0;
        for (let shift = 0; 1 << shift <= binary1; shift++) {
            let b1 = 1 << shift & binary1;
            let b2 = neighbours[shift] & binary2
            if (b1 != 0 && b2 != 0) {
                output1 |= b1;
                output2 |= b2;
            }
        }

        if (output1 == 0 || output2 == 0) {
            return {priority: -1, binary1: output1, binary2: output2};
        }

        let newBitCount1 = BinaryUtils.countBits32(output1);
        let removedBitCount1 = BinaryUtils.countBits32(binary1 & ~ output1);
        let newBitCount2 = BinaryUtils.countBits32(output2);
        let removedBitCount2 = BinaryUtils.countBits32(binary2 & ~ output2);
        let priority = removedBitCount1 / newBitCount1 + removedBitCount2 / newBitCount2;

        return {priority: priority, binary1: output1, binary2: output2};
    }

    public static label(state: State): StrategyResult {
        if (! state.sudoku.hasEdgeVariant()) {
            throw "Can not call EdgeStrategy.label() if ! Sudoku.hadEdgeVariant()";
        }

        let board = state.board;
        let variant = state.sudoku.getEdgeVariant()!;

        let labelCells = this.getLabelCells(state.sudoku);

        let bestBinaries: [number, number] = [0, 0];
        let bestRegion: [number, number] = [0, 0];
        let bestPriority = 0;

        for (let [direction, y, x, index1, index2] of labelCells) {
            let binary1 = board[index1];
            let binary2 = board[index2];
            let label = variant.board[direction][y][x];

            if (label != -1) {
                let result = this._label(binary1, binary2, variant.neighbours[label]);

                if (result.priority == -1) {
                    return {
                        colors: {
                            error: StrategyUtils.mergeIndicesAndShift([index1, index2], -1),
                        },
                        isUpdated: true,
                        isValid: false,
                        name: "Edge Label - Error",
                        message: "No combination of numbers in the two cells around an edge label results in the label."
                    }

                } else if (result.priority > bestPriority) {
                    bestBinaries = [result.binary1, result.binary2];
                    bestRegion = [index1, index2];
                    bestPriority = result.priority;
                }
            }
        }

        if (bestPriority == 0) {
            return {colors: {}, isUpdated: false, isValid: true, name: "", message: "",};
        }

        let [index1, index2] = bestRegion;
        let binary1 = board[index1];
        let binary2 = board[index2];
        let [newBinary1, newBinary2] = bestBinaries;

        let removed = [];
        for (let shift of BinaryUtils.binaryToShifts32(binary1 & ~ newBinary1)) {
            removed.push({ index: index1, shift: shift });
        }
        for (let shift of BinaryUtils.binaryToShifts32(binary2 & ~ newBinary2)) {
            removed.push({ index: index2, shift: shift });
        }

        return {
            colors: {
                removed: removed,
                regions: [{ region: [index1, index2], css: "background-region-1" }],
            },
            isUpdated: true,
            isValid: true,
            name: "Edge Label",
            message: "In the two cells around an edge label there are some numbers that can not result in that label with any other number in the other cell."
        }
    }

    public static _region(
        board: number[], size: number, region: number[], shift: number, cellNeighbours: Set<number>[], variant: EdgeVariant
    ): EdgeRegionProof | null {
        // get all cells that can have value shift
        let cells = [];
        for (let index of region) {
            if ((board[index] & 1 << shift) != 0) {
                cells.push(index);
            }
        }

        if (cells.length == 0) {
            return null;
        }

        // get intersection of neighbours of all cells with value shift
        let neighbours: Set<number>[] = [];
        for (let index of cells) {
            neighbours.push(cellNeighbours[index]);
        }
        let common: number[] = Array.from(ArrayUtils.setIntersection(neighbours));

        if (common.length == 0) {
            return null;
        }

        // find out what values can be in the common neighbour cells
        let commonBinaries = ArrayUtils.createArray1d(common.length, 0);
        for (let i = 0; i < cells.length; ++i) {
            let cellIndex = cells[i];
            for (let j = 0; j < common.length; ++j) {
                let commonIndex = common[j];
                if (cellIndex == commonIndex) {
                    commonBinaries[j] |= 1 << shift;
                } else {
                    let [direction, y, x, index1, ] = this.getLabel(cellIndex, commonIndex, size);
                    let label = variant.board[direction][y][x];
                    commonBinaries[j] |= variant.getNeighbour(label, shift, cellIndex == index1);
                }
            }
        }

        // find out values that can be removed
        let removed: { index: number, shift: number }[] = [];
        for (let i = 0; i < common.length; ++i) {
            let index = common[i];
            let oldBinary = board[index];
            let newBinary = commonBinaries[i];
            for (let shift of BinaryUtils.binaryToShifts32(oldBinary & ~ newBinary)) {
                removed.push({ index: index, shift: shift });
            }
        }

        // remove cells from output, so that they don't intersect

        let cellsSet = new Set(cells);
        let commonSet = new Set(common);

        let regionFinal = [];
        for (let index of region) {
            if (! cellsSet.has(index) && ! commonSet.has(index)) {
                regionFinal.push(index);
            }
        }

        let cellsFinal, commonFinal;
        if (cells.length < common.length) {
            cellsFinal = cells;
            commonFinal = [];
            for (let index of common) {
                if (! cellsSet.has(index)) {
                    commonFinal.push(index);
                }
            }
        } else {
            commonFinal = common;
            cellsFinal = [];
            for (let index of cells) {
                if (! commonSet.has(index)) {
                    cellsFinal.push(index);
                }
            }
        }

        if (removed.length == 0) {
            return null;
        }

        return {
            shift: shift,
            region: regionFinal,
            cells: cellsFinal,
            common: commonFinal,
            reason: StrategyUtils.mergeIndicesAndShift(cells, shift),
            removed: removed,
            priority: removed.length,
        };
    }

    public static region(state: State): StrategyResult {
        if (! state.sudoku.hasEdgeVariant()) {
            throw "Can not call EdgeStrategy.label() if ! Sudoku.hadEdgeVariant()";
        }

        let board = state.board;
        let size = state.sudoku.size;
        let variant = state.sudoku.getEdgeVariant()!;

        let labelCells = this.getLabelCells(state.sudoku);
        let cellNeighbours = this.getCellNeighbours(state.sudoku, variant, labelCells);

        let regions = state.sudoku.regions.getAllRegions();

        let result: EdgeRegionProof | null = null;

        for (let region of regions) {
            for (let shift = 0; shift < state.sudoku.size; shift++) {
                let newResult = this._region(board, size, region, shift, cellNeighbours, variant);

                if (result === null || newResult !== null && newResult.priority > result.priority) {
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
                regions: [
                    { region: result.region, css: "background-region-1" },
                    { region: result.common, css: "background-region-2" },
                    { region: result.cells, css: "background-region-3" },
                ],
            },
            isUpdated: true,
            isValid: true,
            name: "Edge Region",
            message: `
                All occurrences of ${result.shift + 1} in a region are adjacent to a cell.
                Number in that cell will be adjacent to ${result.shift + 1}.
                Because of that, any number that can not be adjacent to any occurrence ${result.shift + 1} can be removed.
            `,
        };
    }
}