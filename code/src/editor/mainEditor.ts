class MainEditor {
    /**
     * Minimum allowed Sudoku.size
     */
    private static readonly MIN_SIZE = 3;
    /**
     * Maximum allowed Sudoku.size
     */
    private static readonly MAX_SIZE = 16;
    /**
     * Maximum size of the Sudoku puzzle in pixels
     */
    private static readonly MAX_BOARD_SIZE = 600;
    /**
     * Maximum size of one cell in pixels
     */
    private static readonly MAX_CELL_SIZE = 70;

    /**
     * Current Sudoku size - MainEditor.sudoku.size
     */
    public static size: number = 9;

    /**
     * Reference to the Frame object, that the Sudoku is supposed to be rendered into
     */
    public static frame: Frame = null!;

    /**
     * Reference to the Sudoku object
     */
    public static sudoku: Sudoku;

    /**
     * Current position in the menu
     * Menu is divided in two parts, the left menu and the right menu
     */
    public static menuPosition: {left: string | null, right: string | null} = {left: null, right: null};

    /**
     * 0 or 10, depending on if the user is adding an increment to be able to add numbers 10-16 with keys 0-6 on keyboard
     */
    public static numberPlus: number = 0;

    /**
     * Is a confirmation window open in the editor, if so then no buttons can be pressed until the window is closed.
     */
    public static isConfirmOpen: boolean = true;

    /**
     * List of confirmation windows that have been opened in the past, this is used to not open some windows multiple times
     */
    private static windowsSeen: string[] = [];
    /**
     * List of confirmation windows that are currently open
     */
    private static windowsOpen: string[] = [];

    /**
     * List of buttons (HTML id) that are only visible in the editor, if the user is configuring task.
     */
    private static readonly VIEW_TASK_ONLY = [
        "menu-button-regions", "menu-button-numbers", "menu-button-solve-start", "menu-button-edge"
    ];
    /**
     * List of buttons (HTML id) that are only visible in the editor, if the user is solving.
     */
    private static readonly VIEW_SOLVE_ONLY = [
        "menu-button-task-edit", "menu-button-solve-restart", "menu-button-solve-next", "strategy-text-wrapper"
    ];
    /**
     * Depending on what tab in the left menu is currently open, show some buttons in the right menu.
     */
    private static readonly SHOW_SECTION: Record<string, string[]> = {
        regions: ["regions"],
        numbers: ["numbers"],
        solve: ["numbers", "strategy"], // while solving, both list of strategies and the +0 +10 buttons are available
        edge: ["edge"],
    };

    /**
     * This method is called by <script><script/> in editor.html
     */
    public static main(): void {
        this.createFrame();
        this.changeMenuPosition("numbers", null);
        this.hideConfirmWindow();
        this.render();
    }

    /**
     * Set the Sudoku's solution to its task, which resets the progress of solving to the beginning.
     */
    private static resetSolution(): void {
        this.sudoku.solution = this.sudoku.task.deepcopy();
    }

    /**
     * Render sudoku normally
     */
    private static renderSudoku(): void {
        if (this.menuPosition.left === "solve") {
            Renderer.renderer.doSmallNumbersOnFullBinary = true;
            Renderer.renderer.doDifferentiateTaskBigNumber = true;
            Renderer.renderer.render(this.sudoku.solution, this.frame);
            Renderer.renderer.doSmallNumbersOnFullBinary = false;
            Renderer.renderer.doDifferentiateTaskBigNumber = false;
        } else {
            Renderer.renderer.render(this.sudoku.task, this.frame);
        }

        let doDebugEdgeWrappers = this.menuPosition.left === "edge" && this.sudoku.hasEdgeVariant();
        if (doDebugEdgeWrappers) {
            this.frame.puzzleWrapper.classList.add("edge-debug");
            EdgeEditor.addEventListeners();
        } else {
            this.frame.puzzleWrapper.classList.remove("edge-debug");
            EdgeEditor.removeEventListeners();
        }
    }

    /**
     * The main render function, that can be called from anywhere
     */
    public static render(): void {
        StrategyEditor.removeLastResult();
        if (this.menuPosition.right === "regions-jigsaw" || this.menuPosition.right === "regions-extraregions") {
            RegionEditor.renderSudoku();
        } else {
            this.renderSudoku();
        }
    }

    /**
     * Create Frame object which will be used to render sudoku
     */
    private static createFrame(): void {
        this.changeMenuPosition(null, null);

        if (this.frame !== null) {
            this.frame.delete();
            this.frame = null!;
        }

        let cellSize = Math.min(this.MAX_CELL_SIZE, this.MAX_BOARD_SIZE / this.size);
        this.frame = new Frame(this.size, this.size, cellSize, "container");

        this.sudoku = new Sudoku(this.size);

        // set sudoku regions as rectangles
        let [rectangleHeight, rectangleWidth]: (number | null)[] = [null, null];
        for (let h = 2; h * h <= this.size; h++) {
            if (this.size % h === 0) {
                rectangleHeight = h;
                rectangleWidth = this.size / h;
            }
        }
        if (rectangleHeight !== null && rectangleWidth !== null) {
            this.sudoku.regions.setRectangular(rectangleHeight, rectangleWidth);
        }

        RegionEditor.onCreateFrame();

        this.updateForResize();

        if (this.menuPosition.right === "regions-jigsaw" || this.menuPosition.right === "regions-extraregions") {
            EditorUtils.addEventListeners(RegionEditor.eventListeners);
        }
    }

    /**
     * Update editor based on sudoku size, when sudoku size changes
     */
    private static updateForResize(): void {
        // Hide/show buttons based on size
        let isPrime = true;
        for (let i = 2; i * i <= this.size; i++) {
            if (Math.floor(this.size / i) * i === this.size) {
                isPrime = false;
                break;
            }
        }
        GraphicsUtils.addOrRemoveClass("menu-button-regions-rectangular", "display-none", isPrime);

        GraphicsUtils.addOrRemoveClass("menu-button-regions-windoku", "display-none", ! Regions.isValidWindokuSize(this.size));

        GraphicsUtils.addOrRemoveClass("text-plus10", "display-none", this.size < 10 || this.size >= 20);
        GraphicsUtils.addOrRemoveClass("text-plus20", "display-none", this.size < 20);
        GraphicsUtils.addOrRemoveClass("right-menu-section-numbers", "display-none", this.size < 10);
        GraphicsUtils.addOrRemoveClass("menu-button-numbers-plus20", "display-none", this.size < 20);

        // Change text based on size
        document.getElementById("text-jigsaw-1")!.textContent = `All regions must have ${this.size} cells.`;
        document.getElementById("text-extraregions-1")!.textContent = `All extra regions must have ${this.size} cells.`;

        // Set regions rectangular confirm window select options
        let select = <HTMLSelectElement>document.getElementById("regions-rectangular-value");
        while (select.options.length > 0) {
            select.options.remove(0);
        }
        for (let rectangleHeight = 2; rectangleHeight < this.size; rectangleHeight++) {
            let rectangleWidth = Math.floor(this.size / rectangleHeight);
            if (rectangleHeight * rectangleWidth === this.size) {
                let option = document.createElement("option");
                option.value = `${rectangleHeight}`;
                option.text = `${rectangleHeight}x${rectangleWidth}`;
                select.appendChild(option);
                if (rectangleHeight <= rectangleWidth) {
                    select.value = `${rectangleHeight}`;
                }
            }
        }
    }

    /**
     * Add temporary .selected class to menu button
     */
    private static addTemporaryButtonFocus(buttonName: string): void {
        let button = document.getElementById(`menu-button-${buttonName}`);
        button?.classList.add("selected");
        setTimeout(() => {
            button?.classList.remove("selected");
        }, 220);
    }

    /**
     * Show confirm window.
     * @param name Id of confirm window (without "confirm-window-")
     * @param isRepeat True iff this window should be shown every time, false iff it should only be shown once.
     */
    private static showConfirmWindow(name: string, isRepeat: boolean): void {
        if (! isRepeat) {
            if (this.windowsSeen.includes(name)) {
                return;
            } else {
                this.windowsSeen.push(name);
            }
        }
        GraphicsUtils.addClass(`confirm-window-${name}`, "selected");
        if (! this.isConfirmOpen) {
            GraphicsUtils.addClass("page-wrapper", "confirm-window-open");
            GraphicsUtils.removeClass("page-wrapper", "confirm-window-closed");
        }
        this.isConfirmOpen = true;
        this.windowsOpen.push(name);
    }

    /**
     * Hide currently opened confirm window
     */
    private static hideConfirmWindow(): void {
        for (let name of this.windowsOpen) {
            GraphicsUtils.removeClass(`confirm-window-${name}`, "selected");
        }
        if (this.isConfirmOpen) {
            GraphicsUtils.removeClass("page-wrapper", "confirm-window-open");
            GraphicsUtils.addClass("page-wrapper", "confirm-window-closed");
        }
        this.isConfirmOpen = false;
        this.windowsOpen = [];
    }

    /**
     * Update graphics for moving in menu to different button.
     * @param leftPosition new position in left menu
     * @param rightPosition new position in right menu
     */
    private static changeMenuPosition(leftPosition: string | null, rightPosition: string | null): boolean {
        let {left: previousLeftPosition, right: previousRightPosition} = this.menuPosition;

        // Change what button is selected
        if (leftPosition !== previousLeftPosition) {
            if (previousLeftPosition !== null) {
                GraphicsUtils.removeClass(`menu-button-${previousLeftPosition}`, "selected");
                for (let position of this.SHOW_SECTION[previousLeftPosition]) {
                    GraphicsUtils.removeClass(`right-menu-section-${position}`, "selected");
                }
            }
            GraphicsUtils.addClass(`menu-button-${leftPosition}`, "selected");
            if (leftPosition !== null) {
                for (let position of this.SHOW_SECTION[leftPosition]) {
                    GraphicsUtils.addClass(`right-menu-section-${position}`, "selected");
                }
            }
        }
        if (rightPosition !== previousRightPosition) {
            if (previousRightPosition !== null) {
                GraphicsUtils.removeClass(`menu-button-${previousRightPosition}`, "selected");
            }
            if (rightPosition !== null) {
                GraphicsUtils.addClass(`menu-button-${rightPosition}`, "selected");
            }
        }

        // add/remove event listeners
        if (leftPosition !== previousLeftPosition || rightPosition !== previousRightPosition) {
            let hadRegionsListeners = RegionEditor.hasEventListeners(previousLeftPosition!, previousRightPosition!);
            let willHaveRegionsListeners = RegionEditor.hasEventListeners(leftPosition!, rightPosition!);
            if (willHaveRegionsListeners && !hadRegionsListeners) {
                EditorUtils.addEventListeners(RegionEditor.eventListeners);
            } else if (hadRegionsListeners && !willHaveRegionsListeners) {
                EditorUtils.removeEventListeners(RegionEditor.eventListeners);
            }

            let hadNumbersListeners = NumberEditor.hasEventListeners(previousLeftPosition!);
            let willHaveNumbersListeners = NumberEditor.hasEventListeners(leftPosition!);
            if (willHaveNumbersListeners && !hadNumbersListeners) {
                EditorUtils.addEventListeners(NumberEditor.eventListeners);
            } else if (hadNumbersListeners && !willHaveNumbersListeners) {
                EditorUtils.removeEventListeners(NumberEditor.eventListeners);
            }

            if (leftPosition !== previousLeftPosition && hadNumbersListeners) {
                NumberEditor.removeChosenCell();
            }
        }

        // Show/hide buttons based on menu position
        let previousIsSolve = previousLeftPosition === "solve";
        let isSolve = leftPosition === "solve";
        if (previousLeftPosition === null || isSolve != previousIsSolve) {
            if (isSolve) {
                for (let c of this.VIEW_SOLVE_ONLY) {
                    GraphicsUtils.removeClass(c, "display-none");
                }
                for (let c of this.VIEW_TASK_ONLY) {
                    GraphicsUtils.addClass(c, "display-none");
                }
            } else {
                for (let c of this.VIEW_SOLVE_ONLY) {
                    GraphicsUtils.addClass(c, "display-none");
                }
                for (let c of this.VIEW_TASK_ONLY) {
                    GraphicsUtils.removeClass(c, "display-none");
                }
            }
        }

        // Show/hide strategy buttons based on menu position
        if (previousLeftPosition === null || isSolve != previousIsSolve) {
            if (isSolve) {
                StrategyEditor.addStrategyButtons(this.sudoku);
                this.updateChecksStrategy();
            } else {
                StrategyEditor.removeStrategyButtons();
            }
        }

        // Prepare edge variant buttons
        if (leftPosition === "edge") {
            EdgeEditor.updateMenu();
        }

        if (leftPosition !== previousLeftPosition) {
            if (leftPosition === "solve") {
                document.getElementById("strategy-text-1")!.textContent = "Press \"Apply Step\" to Solve";
                document.getElementById("strategy-text-2")!.textContent = "Then press it a second time to remove candidate numbers.";
            }
        }

        this.menuPosition = {left: leftPosition, right: rightPosition};

        return leftPosition !== previousLeftPosition || rightPosition !== previousRightPosition;
    }

    /**
     * Based on what are the types of regions currently added to the Sudoku, check corresponding checkboxes.
     */
    public static updateChecksRegions(): void {
        let isNone = ! this.sudoku.regions.hasRegions();
        let isRectangular = this.sudoku.regions.isRectangular();
        let isJigsaw = ! (isNone || isRectangular);
        let isDiagonal = this.sudoku.regions.hasDiagonals;
        let isNoneExtra = ! this.sudoku.regions.hasExtraRegions();
        let isWindoku = this.sudoku.regions.isWindoku();
        let isExtraRegions = ! (isNoneExtra || isWindoku);
        GraphicsUtils.addOrRemoveClass("check-regions-none", "selected", isNone);
        GraphicsUtils.addOrRemoveClass("check-regions-rectangular", "selected", isRectangular);
        GraphicsUtils.addOrRemoveClass("check-regions-jigsaw", "selected", isJigsaw);
        GraphicsUtils.addOrRemoveClass("check-regions-diagonal", "selected", isDiagonal);
        GraphicsUtils.addOrRemoveClass("check-regions-noextraregions", "selected", isNoneExtra);
        GraphicsUtils.addOrRemoveClass("check-regions-windoku", "selected", isWindoku);
        GraphicsUtils.addOrRemoveClass("check-regions-extraregions", "selected", isExtraRegions);
    }

    /**
     * Based on if the user is adding +0 or +10 to numbers (to add numbers 10-16) check the correct checkbox.
     */
    private static updateChecksPlus(): void {
        for (let plus = 0; plus <= 20; plus += 10) {
            GraphicsUtils.addOrRemoveClass(`check-numbers-plus${plus}`, "selected", plus == this.numberPlus);
        }
    }

    /**
     * Based on what strategies are currently on check the correct checkbox.
     */
    private static updateChecksStrategy(): void {
        for (let strategyId = 0; strategyId < StrategyEditor.isStrategyOn.length; strategyId++) {
            let check = document.getElementById(`check-strategy-${strategyId}`);
            if (StrategyEditor.isStrategyOn[strategyId]) {
                check?.classList.add("selected");
            } else {
                check?.classList.remove("selected");
            }
        }
    }

    // -------- Methods below are handlers for editor buttons in editor.html
    // pressedXButton is when a button is pressed, confirmX is a confirmation button on confirm windows.

    public static pressedResizeButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("resize");
            this.showConfirmWindow("resize", true);
        }
    }

    public static confirmResize(): void {
        let resizeInput = <HTMLInputElement>document.getElementById("resize-value");
        if (resizeInput !== null) {
            let newSize = parseInt(resizeInput.value);
            this.size = Math.max(this.MIN_SIZE, Math.min(this.MAX_SIZE, newSize));
            if (newSize === this.size) {
                this.hideConfirmWindow();
                this.createFrame();
                this.changeMenuPosition("numbers", null);
                this.render();
            } else {
                resizeInput.value = `${this.size}`;
            }
        }
    }

    public static cancel(): void {
        this.hideConfirmWindow();
    }

    public static pressedTaskEditButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("task-edit");
            this.showConfirmWindow("task-edit", true);
        }
    }

    public static confirmTaskEdit(): void {
        this.changeMenuPosition("numbers", null);
        this.hideConfirmWindow();
        this.render();
    }

    public static pressedRegionsButton(): void {
        if (! this.isConfirmOpen) {
            this.showConfirmWindow("regions", false);
            this.changeMenuPosition("regions", "regions-view");
            this.updateChecksRegions();
            this.render();
        }
    }

    public static pressedRegionsRectangularButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("regions-rectangular");
            this.changeMenuPosition("regions", "regions-view");
            this.showConfirmWindow("regions-rectangular", true);
        }
    }

    private static setRegionsRectangularToSudoku(): void {
        let select = <HTMLSelectElement>document.getElementById("regions-rectangular-value");
        let rectangleHeight = parseInt(select.value);
        let rectangleWidth = this.size / rectangleHeight;
        this.sudoku.regions.setRectangular(rectangleHeight, rectangleWidth);
    }

    public static confirmRegionsRectangular(): void {
        this.hideConfirmWindow();
        this.changeMenuPosition("regions", "regions-view");
        this.setRegionsRectangularToSudoku();
        this.updateChecksRegions();
        this.render();
    }

    private static setRegionsNoneToSudoku(): void {
        this.sudoku.regions.setNoRegions();
    }

    public static pressedRegionsNoneButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("regions-none");
            this.changeMenuPosition("regions", "regions-view");
            this.setRegionsNoneToSudoku();
            this.updateChecksRegions();
            this.render();
        }
    }

    public static pressedRegionsJigsawButton(): void {
        if (! this.isConfirmOpen) {
            this.showConfirmWindow("regions-jigsaw", false);
            this.changeMenuPosition("regions", "regions-jigsaw");
            RegionEditor.checkIfRegionsAreAll();
            this.render();
        }
    }

    public static pressedRegionsDiagonalButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("regions-diagonal");
            this.changeMenuPosition("regions", "regions-view");
            this.sudoku.regions.hasDiagonals = ! this.sudoku.regions.hasDiagonals;
            this.updateChecksRegions();
            this.render();
        }
    }

    private static setRegionsNoextraregionsToSudoku(): void {
        this.sudoku.regions.setExtraRegions(null);
    }

    public static pressedRegionsNoextraregionsButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("regions-noextraregions");
            this.changeMenuPosition("regions", "regions-view");
            this.setRegionsNoextraregionsToSudoku();
            this.updateChecksRegions();
            this.render();
        }
    }

    private static setRegionsWindokuToSudoku(): void {
        this.sudoku.regions.setWindoku();
    }

    public static pressedRegionsWindokuButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("regions-windoku");
            this.changeMenuPosition("regions", "regions-view");
            this.setRegionsWindokuToSudoku();
            this.updateChecksRegions();
            this.render();
        }
    }

    public static pressedRegionsExtraregionsButton(): void {
        if (! this.isConfirmOpen) {
            this.showConfirmWindow("regions-extraregions", false);
            this.changeMenuPosition("regions", "regions-extraregions");
            RegionEditor.checkIfRegionsAreAll();
            this.render();
        }
    }

    public static pressedRegionsViewButton(): void {
        if (! this.isConfirmOpen) {
            this.changeMenuPosition("regions", "regions-view");
            this.render();
        }
    }

    public static pressedNumbersButton(): void {
        if (! this.isConfirmOpen) {
            this.changeMenuPosition("numbers", null);
            this.numberPlus = 0;
            this.updateChecksPlus();
            this.render();
        }
    }

    public static pressedEdgeButton(): void {
        if (! this.isConfirmOpen) {
            this.showConfirmWindow("variant", false);
            this.changeMenuPosition("edge", null);
            this.render();
        }
    }

    public static pressedEdgeRemoveButton(): void {
        if (! this.isConfirmOpen) {
            EdgeEditor.removeVariant();
            this.render();
            EdgeEditor.updateMenu();
        }
    }

    public static pressedEdgeAddButton(variantId: number): void {
        if (! this.isConfirmOpen) {
            EdgeEditor.addVariant(variantId);
            this.render();
            EdgeEditor.updateMenu();
        }
    }

    public static pressedNumbersPlus(plus: number): void {
        if (! this.isConfirmOpen) {
            this.numberPlus = plus;
            this.updateChecksPlus();
        }
    }

    public static pressedSolveStartButton(): void {
        if (! this.isConfirmOpen) {
            this.resetSolution();
            this.changeMenuPosition("solve", null);
            this.render();
        }
    }

    public static pressedSolveRestartButton(): void {
        if (! this.isConfirmOpen) {
            this.showConfirmWindow("solve-restart", true);
            this.addTemporaryButtonFocus("solve-restart");
        }
    }

    public static confirmSolveRestart(): void {
        this.resetSolution();
        this.hideConfirmWindow();
        this.render();
    }

    public static pressedStrategyButton(strategyId: number): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus(`strategy-${strategyId}`);

            StrategyEditor.isStrategyOn[strategyId] = ! StrategyEditor.isStrategyOn[strategyId];
            this.updateChecksStrategy();

            this.render();
        }
    }

    public static pressedSolveNextButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("solve-next");
            StrategyEditor.solveNext();
        }
    }
}