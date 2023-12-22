type SudokuPermutation = {
    rows: number[],
    columns: number[],
    numbers: number[],
    diagonal: boolean,
}

type SingleTests = [
    string,
    number,
    [number, number] | null,
    boolean,
    string[] | null,
    string[],
    boolean,
    [number, number][]
][]

class StrategyTests {
    private static containerNumber = 0;

    private static onUpdate: (() => void)[] = [];

    private static getContainerId(): string {
        let containerId = `strategy-test-container-${this.containerNumber}`;
        this.containerNumber ++;
        return containerId;
    }

    private static createContainer(cssClass: string, childId: string, parentId: string, forceParentWidth: boolean): void {
        let container = document.createElement("div");
        let parent = document.getElementById(parentId)!;
        parent.appendChild(container);
        container.classList.add(cssClass);
        container.id = childId;
        if (forceParentWidth) {
            this.onUpdate.push(() => {
                parent.style.setProperty("--width", getComputedStyle(container).width);
            });
        }
    }

    private static addText(text: string, containerId: string, tagName: string, id: string | null): void {
        let container = document.getElementById(containerId);

        let textElement = document.createElement(tagName);
        container?.appendChild(textElement);

        if (id !== null) {
            textElement.id = id;
        }
        textElement.classList.add("test-text");
        textElement.textContent = text;
    }

    private static prepareDivs(name: string): { container: string, message: string } {
        let containerId = this.getContainerId();
        this.createContainer("strategy-test-wrapper-outer", containerId, "container", false);
        this.addText(name, containerId, "h2", null);
        this.createContainer("strategy-test-wrapper-inner", `${containerId}-inner`, containerId, true);
        let messageId = `${containerId}-message`;
        this.addText("", containerId, "p", messageId);
        return { container: `${containerId}-inner`, message: messageId };
    }

    private static renderRegion(frame: Frame, region: StrategyCoordinates2d[]): void {
        for (let regionCell of region) {
            frame.getCell(regionCell.y, regionCell.x).setBackgroundColor("#5FF");
        }
    }

    private static renderColor(frame: Frame, colors: StrategyCoordinates3d[], css: string): void {
        for (let color of colors) {
            let cell = frame.getCell(color.y, color.x);
            let found = cell.setTextBackgroundColor(`${color.shift + 1}`, css, false);
            if (! found) {
                throw "ERROR: StrategyTests.renderColor(): Did not find text in cell.";
            }
        }
    }

    private static renderError(frame: Frame, error: StrategyCoordinates3d[]): void {
        for (let errorCell of error) {
            let cell = frame.getCell(errorCell.y, errorCell.x);
            if (errorCell.shift === -1) {
                cell.setBackgroundColor("#F00");
                cell.setTextBackgroundColor(null, "background-error", true);
            } else {
                let found = cell.setTextBackgroundColor(`${errorCell.shift + 1}`, "background-error", false);
                if (! found) {
                    throw "ERROR: StrategyTests.renderError(): Did not find text in cell.";
                }
            }
        }
    }

    private static createSudokuPermutation(
        sudoku: Sudoku, permuteRows: boolean, permuteColumns: boolean, permuteNumbers: boolean, permuteDiagonal: boolean
    ): SudokuPermutation {
        let rows = ArrayUtils.range1d(0, sudoku.size);
        if (permuteRows) {
            ArrayUtils.shuffle1d(rows);
        }
        let columns = ArrayUtils.range1d(0, sudoku.size);
        if (permuteColumns) {
            ArrayUtils.shuffle1d(columns);
        }
        let numbers = ArrayUtils.range1d(0, sudoku.size);
        if (permuteNumbers) {
            ArrayUtils.shuffle1d(numbers);
        }
        let diagonal = permuteDiagonal && Math.random() < 0.5;
        return { rows: rows, columns: columns, numbers: numbers, diagonal: diagonal };
    }

    private static permuteSudoku(sudoku: Sudoku, board: number[], permutation: SudokuPermutation): void {
        let indexPermutation = ArrayUtils.createArray1d(board.length, null);
        for (let y = 0; y < sudoku.size; y++) {
            for (let x = 0; x < sudoku.size; x++) {
                let permutedY = permutation.rows[y];
                let permutedX = permutation.columns[x];
                if (permutation.diagonal) {
                    [permutedY, permutedX] = [permutedX, permutedY];
                }
                indexPermutation[y * sudoku.size + x] = permutedY * sudoku.size + permutedX;
            }
        }

        let copy = ArrayUtils.deepcopyArray1d(board);
        for (let i = 0; i < board.length; i++) {
            board[indexPermutation[i]] = 0;
            for (let shift = 0; shift < sudoku.size; shift++) {
                if ((copy[i] & 1 << shift) !== 0) {
                    board[indexPermutation[i]] |= 1 << permutation.numbers[shift];
                }
            }
        }
    }

    private static update(): void {
        for (let method of this.onUpdate) {
            method();
        }
    }

    private static testSingle(tests: SingleTests, testMethod: (strategy: Strategy2d, board: number[]) => StrategyResult): void {
        for (let [name, size, rectangles, isDiagonal, jigsaw, board, isPermuted, specialBinaries] of tests) {
            let ids = this.prepareDivs(name);

            let sudoku = new Sudoku(size);
            if (rectangles !== null) {
                sudoku.regions.setRectangular(rectangles[0], rectangles[1]);
            }
            if (isDiagonal) {
                sudoku.regions.hasDiagonals = true;
            }
            if (jigsaw !== null) {
                sudoku.regions.setRegionsByText(jigsaw);
            }
            sudoku.task.setBoardByText(board);
            for (let [index, binary] of specialBinaries) {
                sudoku.task.board[index] = binary;
            }

            if (isPermuted) {
                let permutation = this.createSudokuPermutation(sudoku, true, true, true, true);
                this.permuteSudoku(sudoku, sudoku.task.board, permutation);
            }

            let strategy = new Strategy2d(sudoku, sudoku.task);

            let result = testMethod(strategy, sudoku.task.board);

            let renderer = new Renderer();
            renderer.doSmallNumbersOnFullBinary = true;
            renderer.renderNew(sudoku.task, ids.container);
            let frame = renderer.renderNew(sudoku.task, ids.container);
            if (result.colors.region !== undefined) {
                this.renderRegion(frame, result.colors.region);
            }
            if (result.isValid && result.isUpdated) {
                this.renderColor(frame, result.colors.removed!, "background-removed");
                this.renderColor(frame, result.colors.reason!, "background-reason");
            } else if (! result.isValid) {
                this.renderError(frame, result.colors.error!);
            }
            document.getElementById(ids.message)!.textContent = result.isUpdated ? result.message : "( NOT UPDATED )";
        }
    }

    private static readonly NAKED_SINGLE_TESTS: SingleTests = [
        ["Naked single 1", 4, null, false, null, ["----", "----", "----", "----"], true, []],
        ["Naked single 2", 4, null, false, null, ["1---", "-1--", "-2--", "-3--"], true, []],
        ["Naked single 3", 4, null, false, null, ["1---", "----", "----", "----"], true, [[1, 0b0011]]],
        ["Naked single 4", 4, null, false, null, ["12--", "----", "----", "----"], true, [[2, 0b0011]]],
        ["Naked single 5", 4, null, false, null, ["1-1-", "----", "----", "----"], true, []],
        ["Naked single 6", 4, null, false, ["0001", "0111", "2223", "2333"], ["123-", "-42-", "---4", "---2"], true, []],
        ["Naked single 7", 6, [2, 3], false, null, ["12----", "-34---", "5-----", "--56--", "------", "----21"], true, []],
        ["Naked single 8", 6, null, true, null, ["126---", "-34---", "5----6", "--56--", "------", "----21"], true, []],
    ];

    public static testNakedSingle(): void {
        this.testSingle(this.NAKED_SINGLE_TESTS, (strategy: Strategy2d, board: number[]) => strategy.nakedSingle(board));
        this.update();
    }

    private static readonly HIDDEN_SINGLE_TESTS: SingleTests = [
        ["Hidden single 1", 4, null, false, null, ["----", "----", "----", "----"], true, []],
        ["Hidden single 2", 4, null, false, null, ["123-", "----", "----", "----"], true, []],
        ["Hidden single 3", 4, null, false, null, ["----", "----", "----", "----"], true, [[0, 0b0111], [1, 0b0111], [2, 0b0111]]],
        ["Hidden single 4", 4, null, false, null, ["----", "----", "----", "----"], true, [[0, 0b0111], [1, 0b0111], [2, 0b0111], [3, 0b0111]]],
        ["Hidden single 5", 4, null, false, null, ["----", "----", "----", "----"], true, [[0, 0b0001], [1, 0b0001], [2, 0b0001], [3, 0b0001]]],
        ["Hidden single 6", 4, null, false, null, ["----", "----", "----", "----"], true, [[0, 0b0011], [1, 0b0011], [2, 0b0011]]],
        ["Hidden single 7", 5, null, false, null, ["-----", "-----", "-----", "-----", "-----"], true, [[0, 0b10011], [1, 0b01011], [2, 0b00111], [3, 0b00011], [4, 0b00011]]],
    ];

    public static testHiddenSingle(): void {
        this.testSingle(this.HIDDEN_SINGLE_TESTS, (strategy: Strategy2d, board: number[]) => strategy.hiddenSingle(board));
        this.update();
    }
}