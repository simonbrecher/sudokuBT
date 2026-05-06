type StrategyTypeData = {
    /**
     * The display name of the strategy, shown on the strategy button
     */
    name: string,
    /**
     * Method implementing the strategy
     */
    strategy: (state: State) => StrategyResult,
    /**
     * Whether the strategy is applicable to the given puzzle
     */
    isUsable: (sudoku: Sudoku) => boolean,
    /**
     * true iff it should be used to validate correctness of solution
     */
    isValidator: boolean,
}

class StrategyEditor {
    public static strategyTypeData: StrategyTypeData[] = [
        {
            name: "Naked Single",
            strategy: SudokuStrategy.nakedSingle.bind(SudokuStrategy),
            isUsable: (sudoku: Sudoku) => true,
            isValidator: true,
        },
        {
            name: "Hidden Single",
            strategy: SudokuStrategy.hiddenSingle.bind(SudokuStrategy),
            isUsable: (sudoku: Sudoku) => true,
            isValidator: true,
        },
        {
            name: "Edge Label",
            strategy: EdgeStrategy.label.bind(EdgeStrategy),
            isUsable: (sudoku: Sudoku) => sudoku.hasEdgeVariant(),
            isValidator: true,
        },
        {
            name: "Pointing",
            strategy: SudokuStrategy.pointing.bind(SudokuStrategy),
            isUsable: (sudoku: Sudoku) => {
                return sudoku.regions.hasRegions() || sudoku.regions.hasExtraRegions();
            },
            isValidator: false,
        },
        {
            name: "Region",
            strategy: SudokuStrategy.region.bind(SudokuStrategy),
            isUsable: (sudoku: Sudoku) => true,
            isValidator: false,
        },
        {
            name: "Edge Region",
            strategy: EdgeStrategy.region.bind(EdgeStrategy),
            isUsable: (sudoku: Sudoku) => sudoku.hasEdgeVariant(),
            isValidator: false,
        },
        {
            name: "X-Wing",
            strategy: SudokuStrategy.intersection.bind(SudokuStrategy),
            isUsable: (sudoku: Sudoku) => true,
            isValidator: false,
        },
    ];

    /**
     * is strategy not turned off by the user by pressing the checkbox
     */
    public static isStrategyOn: boolean[] = [];

    /**
     * StrategyResult of the last result of the user pressing the "Apply Step" button which is rendered in the editor
     * null if no result is currently rendered
     */
    private static lastResult: StrategyResult | null = null;

    /**
     * Remove buttons for turning on/off all strategies in the editor
     */
    public static removeStrategyButtons(): void {
        let section = document.getElementById("right-menu-section-strategy")!;
        for (let child of Array.from(section.children)) {
            if (child.id.startsWith("menu-button-strategy-")) {
                child.remove();
            }
        }
    }

    /**
     * Add buttons for turning on/off all applicable strategies in the editor
     * @param sudoku MainEditor.sudoku object that is used to figure out what strategies are applicable
     */
    public static addStrategyButtons(sudoku: Sudoku): void {
        let wrapper: HTMLElement = document.getElementById("right-menu-section-strategy")!;
        let strategyId = 0;
        this.isStrategyOn = [];
        for (let strategyData of this.strategyTypeData) {
            if (strategyData.isUsable(sudoku)) {
                this.isStrategyOn.push(true);

                let button = document.createElement('div');
                wrapper.appendChild(button);
                button.id = `menu-button-strategy-${strategyId}`;
                button.classList.add("menu-button");
                button.textContent = strategyData.name;

                const _strategyId = strategyId;
                button.onclick = () => MainEditor.pressedStrategyButton(_strategyId);

                let check = document.createElement("div");
                button.appendChild(check);
                check.id = `check-strategy-${strategyId}`;
                check.classList.add("check");
            } else {
                this.isStrategyOn.push(false);
            }
            strategyId++;
        }
    }

    /**
     * Add css for list of cells in a region from StrategyColors.regions[i]
     * @param frame Frame object representing the Sudoku puzzle
     * @param region List of cell ids (y * frame.width + x)
     * @param css css class that should be added to all cells
     */
    private static renderRegion(frame: Frame, region: number[], css: string): void {
        for (let index of region) {
            let y = Math.floor(index / frame.width);
            let x = index % frame.width;
            frame.getCell(y, x).addCellClass(css);
        }
    }

    /**
     * Add background color for candidate number from StrategyColors.removed or StrategyColors.reason
     * @param frame Frame object representing the Sudoku puzzle
     * @param positions Coordinates of candidate numbers to add background color to
     * { index: (y * frame.width + x), shift: (number - 1) }
     * @param css css class to add the background color
     */
    private static renderColor(frame: Frame, positions: { index: number, shift: number }[], css: string): void {
        for (let position of positions) {
            let y = Math.floor(position.index / frame.width);
            let x = position.index % frame.width;
            let cell = frame.getCell(y, x);
            let found = cell.setTextBackgroundColor(`${position.shift + 1}`, css, false);
            if (! found) {
                console.log("text", `${position.shift + 1}`, "position", position, "css", css, "y", y, "x", x);
                throw "ERROR: StrategyTests.renderColor(): Did not find text in cell.";
            }
        }
    }

    /**
     * Add background color for candidate number or cell from StrategyColors.error
     * @param frame Frame object representing the Sudoku puzzle
     * @param error Coordinates of candidate numbers to add background color to
     * { index: (y * frame.width + x), shift: (number - 1) }
     * if shift is -1, then add it to the whole cell instead
     */
    private static renderError(frame: Frame, error: { index: number, shift: number }[]): void {
        for (let position of error) {
            let y = Math.floor(position.index / frame.width);
            let x = position.index % frame.width;
            let cell = frame.getCell(y, x);
            if (position.shift === -1) {
                cell.addCellClass("background-error-big");
            } else {
                let found = cell.setTextBackgroundColor(`${position.shift + 1}`, "background-error-small", false);
                if (! found) {
                    console.log("text", position.shift + 1, "css", "background-error-small", "y", y, "x", x);
                    throw "ERROR: StrategyTests.renderError(): Did not find text in cell.";
                }
            }
        }
    }

    /**
     * Render graphics of the result of a strategy.
     * @param result StrategyResult object with data of the result of the strategy.
     */
    private static renderStrategyResult(result: StrategyResult): void {
        let state = MainEditor.sudoku.solution;
        let frame = MainEditor.frame;

        // rerender the State MainEditor.sudoku.solution
        Renderer.renderer.doSmallNumbersOnFullBinary = true;
        Renderer.renderer.doDifferentiateTaskBigNumber = true;
        Renderer.renderer.render(state, frame);
        Renderer.renderer.doSmallNumbersOnFullBinary = false;
        Renderer.renderer.doDifferentiateTaskBigNumber = false;

        // render all color backgrounds
        if (result.colors.regions !== undefined) {
            for (let { region: region, css: css } of result.colors.regions) {
                this.renderRegion(frame, region, css);
            }
        }
        if (result.colors.removed !== undefined) {
            this.renderColor(frame, result.colors.removed, "background-removed");
        }
        if (result.colors.reason !== undefined) {
            this.renderColor(frame, result.colors.reason, "background-reason");
        }
        if (result.colors.error !== undefined) {
            this.renderError(frame, result.colors.error);
        }

        // add the text generated by the strategy
        document.getElementById("strategy-text-1")!.textContent = result.name;
        document.getElementById("strategy-text-2")!.textContent = result.message;
    }

    /**
     * Check if there is no solution by running the strategies with StrategyTypeData.isValidator = true
     * and see if any one of them returns that there is no solution.
     */
    private static checkNoSolution(): boolean {
        for (let strategyId = 0; strategyId < this.isStrategyOn.length; strategyId++) {
            let strategyType = this.strategyTypeData[strategyId];
            if (strategyType.isValidator && strategyType.isUsable(MainEditor.sudoku)) {
                let state = MainEditor.sudoku.solution;
                let result = strategyType.strategy(state);
                if (! result.isValid) {
                    this.renderStrategyResult(result);
                    this.setLastResult(result.isValid ? result : null, strategyId);
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Check if every cell has exactly one candidate.
     */
    private static checkIsSolution(): boolean {
        // check if the Sudoku state is a solution
        for (let binary of MainEditor.sudoku.solution.board) {
            if (! BinaryUtils.has1bit32(binary)) {
                return false;
            }
        }
        // render text that the Sudoku state is a solution
        let name = "Sudoku solved";
        let message = "You have solved the Sudoku and it is correct.";
        this.renderStrategyResult({colors: {}, isUpdated: false, isValid: true, name: name, message: message});
        this.removeLastResult();
        return true;
    }

    /**
     * Apply all strategies from the simplest to the most complicated.
     * Render the result of the first strategy that finds any progress in solving.
     */
    private static tryAllStrategies(): void {
        for (let strategyId = 0; strategyId < this.isStrategyOn.length; strategyId++) {
            if (this.isStrategyOn[strategyId]) {
                let state = MainEditor.sudoku.solution;
                let strategy = this.strategyTypeData[strategyId].strategy;
                let result = strategy(state);
                if (! result.isValid || result.isUpdated) {
                    this.renderStrategyResult(result);
                    this.setLastResult(result.isValid ? result : null, strategyId);
                    return;
                }
            }
        }
        let name = "No Progress";
        let message = "No available strategy is able to remove any candidate numbers.";
        this.renderStrategyResult({colors: {}, isUpdated: false, isValid: true, name: name, message: message});
        this.removeLastResult();
    }

    /**
     * Remove candidate numbers from MainEditor.sudoku defined by this.lastResult.colors.removed.
     */
    private static applyLastResult(): void {
        if (this.lastResult !== null) {
            if (this.lastResult.colors.removed !== undefined) {
                let board = MainEditor.sudoku.solution.board;
                for (let remove of this.lastResult.colors.removed) {
                    let mask = ~ (1 << remove.shift);
                    board[remove.index] &= mask;
                }
                MainEditor.render();
            }
        }
    }

    /**
     * Handle user pressing the "Apply Step" button
     */
    public static solveNext(): void {
        if (this.lastResult === null) {
            let done = this.checkNoSolution();
            if (done) {
                return;
            }
            done = this.checkIsSolution();
            if (done) {
                return;
            }
            this.tryAllStrategies();
        } else {
            this.applyLastResult();
        }
    }

    /**
     * Save data about the result of the last strategy.
     * @param lastResult Result of the last strategy that was able to make progress, null if no progress was made.
     * @param newStrategyId Id of the last strategy that made progress.
     * @private
     */
    private static setLastResult(lastResult: StrategyResult | null, newStrategyId: number | null): void {
        this.lastResult = lastResult;

        let selectedButtonId = `menu-button-strategy-${newStrategyId}`;
        for (let i = 0; i < this.isStrategyOn.length; i++) {
            let buttonId = `menu-button-strategy-${i}`;
            GraphicsUtils.addOrRemoveClass(buttonId, "strategy-last", buttonId == selectedButtonId);
        }
    }

    /**
     * Delete data about the result of last strategy,
     * because it was already applied, or the user started to edit the task.
     */
    public static removeLastResult(): void {
        this.setLastResult(null, null);
    }
}