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
        let size = state.sudoku.size;
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
                            error: StrategyUtils.indexToCoordinates3dArray1dIndices([index1, index2], -1, size),
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
            removed.push(StrategyUtils.indexToCoordinates3d(index1, shift, size));
        }
        for (let shift of BinaryUtils.binaryToShifts32(binary2 & ~ newBinary2)) {
            removed.push(StrategyUtils.indexToCoordinates3d(index2, shift, size));
        }

        return {
            colors: {
                removed: removed,
                region1: StrategyUtils.indexToCoordinates3dArray1dIndices([index1, index2], -1, size),
            },
            isUpdated: true,
            isValid: true,
            name: "Edge Label",
            message: "In the two cells around an edge label there are some numbers that can not result in that label with any other number in the other cell."
        }
    }
}