type StrategyTypeData = {
    name: string,
    strategy: (state: State) => StrategyResult,
    isUsable: (sudoku: Sudoku) => boolean,
}

class StrategyEditor {
    public static strategyTypeData: StrategyTypeData[] = [
        {
            name: "Naked Single",
            strategy: SudokuStrategy.nakedSingle.bind(SudokuStrategy),
            isUsable: (sudoku: Sudoku) => true,
        },
        {
            name: "Hidden Single",
            strategy: SudokuStrategy.hiddenSingle.bind(SudokuStrategy),
            isUsable: (sudoku: Sudoku) => true,
        },
        {
            name: "Edge Label",
            strategy: EdgeStrategy.label.bind(EdgeStrategy),
            isUsable: (sudoku: Sudoku) => sudoku.hasEdgeVariant(),
        },
        {
            name: "Pointing",
            strategy: SudokuStrategy.pointing.bind(SudokuStrategy),
            isUsable: (sudoku: Sudoku) => {
                return sudoku.regions.hasRegions() || sudoku.regions.hasExtraRegions();
            },
        },
        {
            name: "Region",
            strategy: SudokuStrategy.region.bind(SudokuStrategy),
            isUsable: (sudoku: Sudoku) => true,
        },
        {
            name: "Edge Region",
            strategy: EdgeStrategy.region.bind(EdgeStrategy),
            isUsable: (sudoku: Sudoku) => sudoku.hasEdgeVariant(),
        },
        {
            name: "X-Wing",
            strategy: SudokuStrategy.intersection.bind(SudokuStrategy),
            isUsable: (sudoku: Sudoku) => true,
        },
    ];

    public static isStrategyOn: boolean[] = [];

    // use StrategyEditor.setLastResult() or StrategyEditor.removeLastResult()
    private static lastResult: StrategyResult | null = null;

    public static removeStrategyButtons(): void {
        let section = document.getElementById("right-menu-section-strategy")!;
        for (let child of Array.from(section.children)) {
            if (child.id.startsWith("menu-button-strategy-")) {
                child.remove();
            }
        }
    }

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

    private static renderRegion(frame: Frame, region: number[], css: string): void {
        for (let index of region) {
            let y = Math.floor(index / frame.width);
            let x = index % frame.width;
            frame.getCell(y, x).addCellClass(css);
        }
    }

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

    private static renderError(frame: Frame, error: { index: number, shift: number }[]): void {
        for (let position of error) {
            let y = Math.floor(position.index / frame.width);
            let x = position.index % frame.width;
            let cell = frame.getCell(y, x);
            if (position.shift === -1) {
                cell.addCellClass("background-error-big");
                // cell.setTextBackgroundColor(null, "background-error", true);
            } else {
                let found = cell.setTextBackgroundColor(`${position.shift + 1}`, "background-error-small", false);
                if (! found) {
                    console.log("text", position.shift + 1, "css", "background-error-small", "y", y, "x", x);
                    throw "ERROR: StrategyTests.renderError(): Did not find text in cell.";
                }
            }
        }
    }

    private static renderText(id: string, text: string): void {
        let div = document.getElementById(id);
        if (div !== null) {
            div.textContent = text;
        }
    }

    private static renderStrategyResult(result: StrategyResult): void {
        let state = MainEditor.sudoku.solution;
        let frame = MainEditor.frame;

        Renderer.renderer.doSmallNumbersOnFullBinary = true;
        Renderer.renderer.doDifferentiateTaskBigNumber = true;
        Renderer.renderer.render(state, frame);
        Renderer.renderer.doSmallNumbersOnFullBinary = false;
        Renderer.renderer.doDifferentiateTaskBigNumber = false;

        if (result.colors.regions !== undefined) {
            for (let { region: region, css: css } of result.colors.regions) {
                StrategyEditor.renderRegion(frame, region, css);
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

        this.renderText("strategy-text-1", result.name);
        this.renderText("strategy-text-2", result.message);
    }

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
        let message = "NOT UPDATED";
        this.renderStrategyResult({colors: {}, isUpdated: false, isValid: true, name: "-", message: message});
        this.removeLastResult();
    }

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

    public static solveNext(): void {
        if (this.lastResult === null) {
            StrategyEditor.tryAllStrategies();
        } else {
            StrategyEditor.applyLastResult();
        }
    }

    private static setLastResult(lastResult: StrategyResult | null, newStrategyId: number | null): void {
        this.lastResult = lastResult;

        let selectedButtonId = `menu-button-strategy-${newStrategyId}`;
        for (let i = 0; i < this.isStrategyOn.length; i++) {
            let buttonId = `menu-button-strategy-${i}`;
            GraphicsUtils.addOrRemoveClass(buttonId, "strategy-last", buttonId == selectedButtonId);
        }
    }

    public static removeLastResult(): void {
        this.setLastResult(null, null);
    }
}