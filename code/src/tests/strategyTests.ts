type SudokuPermutation = {
    rows: number[],
    columns: number[],
    numbers: number[],
    diagonal: boolean,
}

type SingleTest = [
    string,
    number,
    [number, number] | null,
    boolean,
    string[] | null,
    string[],
    boolean,
    [number, number][]
]

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

    private static prepareHiddenNaked(test: SingleTest)
        : {ids: {container: string, message: string}, state: State}
    {
        let [name, size, rectangles, isDiagonal, jigsaw, board, isPermuted, specialBinaries] = test
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

            let state = sudoku.solution.deepcopy();
            state.setBoardByText(board);
            for (let [index, binary] of specialBinaries) {
                state.board[index] = binary;
            }

            if (isPermuted) {
                let permutation = this.createSudokuPermutation(sudoku, true, true, true, true);
                this.permuteSudoku(sudoku, state.board, permutation);
            }

            return {ids: ids, state: state};
    }

    private static renderStrategy(ids: {container: string, message: string}, state: State, result: StrategyResult): void {
        let renderer = new Renderer();
        renderer.doSmallNumbersOnFullBinary = true;
        renderer.renderNew(state, ids.container);
        let frame = renderer.renderNew(state, ids.container);
        if (result.colors.regions !== undefined) {
            for (let { region: region, css: css } of result.colors.regions) {
                // @ts-ignore
                StrategyEditor.renderRegion(frame, region, css);
            }
        }
        if (result.colors.removed !== undefined) {
            // @ts-ignore
            StrategyEditor.renderColor(frame, result.colors.removed, "background-removed");
        }
        if (result.colors.reason !== undefined) {
            // @ts-ignore
            StrategyEditor.renderColor(frame, result.colors.reason, "background-reason");
        }
        if (result.colors.error !== undefined) {
            // @ts-ignore
            StrategyEditor.renderError(frame, result.colors.error);
        }
        let message = result.isUpdated ? (`${result.name}: ${result.message}`) : "( NOT UPDATED )";
        document.getElementById(ids.message)!.textContent = message;
    }

    private static readonly NAKED_SINGLE_TESTS: SingleTest[] = [
        ["Naked single 1", 4, null, false, null, ["----", "----", "----", "----"], true, []],
        ["Naked single 2", 4, null, false, null, ["----", "----", "----", "----"], true, [[0, 0b0000]]],
        ["Naked single 3", 4, null, false, null, ["1---", "-1--", "-2--", "-3--"], true, []],
        ["Naked single 4", 4, null, false, null, ["1---", "----", "----", "----"], true, [[1, 0b0011]]],
        ["Naked single 5", 4, null, false, null, ["12--", "----", "----", "----"], true, [[2, 0b0011]]],
        ["Naked single 6", 4, null, false, null, ["1-1-", "----", "----", "----"], true, []],
        ["Naked single 7", 4, null, false, ["0001", "0111", "2223", "2333"], ["123-", "-42-", "---4", "---2"], true, []],
        ["Naked single 8", 6, [2, 3], false, null, ["12----", "-34---", "5-----", "--56--", "------", "----21"], true, []],
        ["Naked single 9", 6, null, true, null, ["126---", "-34---", "5----6", "--56--", "------", "----21"], true, []],
    ];

    public static testNakedSingle(): void {
        for (let test of this.NAKED_SINGLE_TESTS) {
            let {ids: ids, state: state} = this.prepareHiddenNaked(test);
            let result = SudokuStrategy.nakedSingle(state);
            this.renderStrategy(ids, state, result);
        }
        this.update();
    }

    private static readonly HIDDEN_SINGLE_TESTS: SingleTest[] = [
        ["Hidden single 1", 4, null, false, null, ["----", "----", "----", "----"], true, []],
        ["Hidden single 2", 4, null, false, null, ["123-", "----", "----", "----"], true, []],
        ["Hidden single 3", 4, null, false, null, ["----", "----", "----", "----"], true, [[0, 0b0111], [1, 0b0111], [2, 0b0111]]],
        ["Hidden single 4", 4, null, false, null, ["----", "----", "----", "----"], true, [[0, 0b0111], [1, 0b0111], [2, 0b0111], [3, 0b0111]]],
        ["Hidden single 5", 4, null, false, null, ["----", "----", "----", "----"], true, [[0, 0b0001], [1, 0b0001], [2, 0b0001], [3, 0b0001]]],
        ["Hidden single 6", 4, null, false, null, ["----", "----", "----", "----"], true, [[0, 0b0011], [1, 0b0011], [2, 0b0011]]],
        ["Hidden single 7", 5, null, false, null, ["-----", "-----", "-----", "-----", "-----"], true, [[0, 0b10011], [1, 0b01011], [2, 0b00111], [3, 0b00011], [4, 0b00011]]],
        ["Hidden single 8", 4, null, false, null, ["12--", "----", "----", "----"], true, [[2, 0b1100], [3, 0b1100]]],
        ["Hidden single 9", 4, null, false, null, ["1---", "----", "----", "----"], true, [[1, 0b1110], [2, 0b1100], [3, 0b1100]]],
    ];

    public static testHiddenSingle(): void {
        for (let test of this.HIDDEN_SINGLE_TESTS) {
            let {ids: ids, state: state} = this.prepareHiddenNaked(test);
            let result = SudokuStrategy.hiddenSingle(state);
            this.renderStrategy(ids, state, result);
        }
        this.update();
    }

    private static regionGetSudoku(): State[] {
        let states: State[] = [];

        let sudoku, state;

        {
            let values: [[number, number], number[][]][] = [
                [[3, 2], [[0]]],
                [[3, 2], [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4]]],
                [[3, 2], [[0, 1, 4], [1, 3, 4], [0, 1, 3], [3, 4]]],
                [[3, 2], [[2, 5], [2, 5], [1, 2, 3, 4, 5], [0, 1, 2, 5], [2, 4, 5]]],
                [[3, 3], [[0, 2, 5], [0, 2, 5], [0, 2, 5]]],
                [[3, 3], [[1, 3, 4], [3, 4], [1, 4]]],
                [[3, 3], [[2, 6], [6, 7], [2, 7]]],
                [[3, 3], [[0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3], [0, 1, 2, 3]]],
                [[3, 3], [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4]]],
                [[3, 3], [[0, 1], [0, 1], [2, 3], [2, 3]]],
            ]

            for (let x of values) {
                let [[rectangleWidth, rectangleHeight], valuesOne] = x;
                sudoku = new Sudoku(rectangleHeight * rectangleWidth);
                sudoku.regions.setRectangular(rectangleHeight, rectangleWidth);

                let regions = sudoku.regions.getAllRegions();
                let region = ArrayUtils.choice(regions);
                let chosen = ArrayUtils.choices(region, valuesOne.length);

                state = sudoku.solution;
                state.setCells(chosen, valuesOne);

                let permutation = this.createSudokuPermutation(sudoku, false, false, true, false);
                this.permuteSudoku(sudoku, state.board, permutation);

                states.push(state);
            }
        }

        return states;
    }

    public static testRegion(): void {
        let states = this.regionGetSudoku();
        for (let i = 0; i < states.length; i++) {
            let ids = this.prepareDivs(`Region ${i}`);
            let state = states[i];
            let result = SudokuStrategy.region(state);

            this.renderStrategy(ids, state, result);
        }
        this.update();
    }

    private static pointingGetSudoku(): State[] {
        let states: State[] = [];

        let sudoku, state;

        {
            let values: [number, [number, number], number[][]][] = [
                [0, [3, 2], [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4]]],
                [0, [3, 2], [[0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4, 5], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4]]],
                [0, [3, 3], Array.from({ length: 6 }, () => [0, 1, 2, 3, 4, 5, 6])],
                [18, [3, 3], Array.from({ length: 6 }, () => [0, 1, 2, 3, 4, 5, 6, 7])],
            ];

            for (let x of values) {
                let [regionId, [rectangleWidth, rectangleHeight], valuesOne] = x;
                sudoku = new Sudoku(rectangleHeight * rectangleWidth);
                sudoku.regions.setRectangular(rectangleHeight, rectangleWidth);

                let regions = sudoku.regions.getAllRegions();
                // let region = ArrayUtils.choice(regions);
                // let chosen = ArrayUtils.choices(region, valuesOne.length);
                let chosen = regions[regionId].slice(0, valuesOne.length);

                state = sudoku.solution;
                state.setCells(chosen, valuesOne);

                let permutation = this.createSudokuPermutation(sudoku, false, false, true, false);
                this.permuteSudoku(sudoku, state.board, permutation);

                states.push(state);
            }
        }

        return states;
    }

    public static testPointing(): void {
        let states = this.pointingGetSudoku();
        for (let i = 0; i < states.length; i++) {
            let ids = this.prepareDivs(`Pointing ${i}`);
            let state = states[i];
            let result = SudokuStrategy.pointing(state);

            this.renderStrategy(ids, state, result);
        }
        this.update();
    }

    private static intersectionGetSudoku(): State[] {
        let states: State[] = [];

        let sudoku, state;

        {
            let values: [[number, number], [number[], number[]]][] = [
                [[3, 3], [[0, 5], [9, 14]]],
                [[3, 3], [[0, 2, 5], [9, 13, 15]]],
                [[3, 3], [[0, 2, 5, 6], [9, 13, 15, 16]]],
                [[3, 3], [[0, 2, 5, 6, 7], [9, 13, 15, 16, 17]]],
                [[4, 2], [[8, 10], [16, 18]]],
                [[3, 2], [[6], [0]]],
            ];

            for (let x of values) {
                let [[rectangleWidth, rectangleHeight], [regions1, regions2]] = x;
                let size = rectangleHeight * rectangleWidth;
                sudoku = new Sudoku(size);
                if (rectangleHeight != 1) {
                    sudoku.regions.setRectangular(rectangleHeight, rectangleWidth);
                }

                let regions = sudoku.regions.getAllRegions();

                let regionA = [];
                for (let r of regions1) {
                    for (let index of regions[r]) {
                        regionA.push(index);
                    }
                }
                let regionB = [];
                for (let r of regions2) {
                    for (let index of regions[r]) {
                        regionB.push(index);
                    }
                }
                // @ts-ignore
                let [r1, r2, intersection] = SudokuStrategy.splitRegionsToIntersections(regionA, regionB);

                state = sudoku.solution;
                let value = BinaryUtils.createFullBinary(size) & ~ 1;
                for (let index of r1) {
                    state.board[index] = value;
                }

                let permutation = this.createSudokuPermutation(sudoku, false, false, true, false);
                this.permuteSudoku(sudoku, state.board, permutation);

                states.push(state);
            }
        }

        return states;
    }

    public static testIntersection(): void {
        let states = this.intersectionGetSudoku();
        for (let i = 0; i < states.length; i++) {
            let ids = this.prepareDivs(`Intersection ${i}`);
            let state = states[i];
            let result = SudokuStrategy.intersection(state);

            this.renderStrategy(ids, state, result);
        }
        this.update();
    }
}