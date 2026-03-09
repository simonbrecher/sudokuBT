class MainEditor {
    private static readonly MIN_SIZE = 3;
    private static readonly MAX_SIZE = 25;
    private static readonly MAX_BOARD_SIZE = 600;
    private static readonly MAX_CELL_SIZE = 70;

    public static size: number = 9; // size of sudoku

    public static frame: Frame = null!;

    public static sudoku: Sudoku;

    public static menuPosition: [string | null, string | null] = [null, null];

    public static isConfirmOpen: boolean = true;

    private static windowsSeen: string[] = [];
    private static windowsOpen: string[] = [];

    private static readonly VIEW_TASK_ONLY = ["menu-button-regions", "menu-button-view", "menu-button-solve-start"];
    private static readonly VIEW_SOLVE_ONLY = ["menu-button-task-edit", "menu-button-solve-restart"];

    /**
     * This method is called by <script><script/> in editor.html
     */
    public static main(): void {
        this.createFrame();
        this.render();
        this.changeMenuPosition("view", null);
        this.hideConfirmWindow();
    }

    /**
     * Render sudoku normally
     */
    private static renderSudoku(): void {
        Renderer.renderer.render(this.sudoku.solution, this.frame);
    }

    /**
     * Render sudoku
     */
    private static render(): void {
        if (this.menuPosition[1] === "regions-jigsaw" || this.menuPosition[1] === "regions-extraregions") {
            RegionEditor.renderSudoku();
        } else {
            this.renderSudoku();
        }
        this.updateChecks();
    }

    /**
     * Create Frame object which will be used to render sudoku
     */
    private static createFrame(): void {
        if (this.frame !== null) {
            this.frame.delete();
            this.frame = null!;
        }

        let cellSize = Math.min(this.MAX_CELL_SIZE, this.MAX_BOARD_SIZE / this.size);
        this.frame = new Frame(this.size, this.size, cellSize, "container");

        this.sudoku = new Sudoku(this.size);

        RegionEditor.onCreateFrame();

        this.updateForResize();

        if (this.menuPosition[1] === "regions-jigsaw" || this.menuPosition[1] === "regions-extraregions") {
            RegionEditor.addEventListeners();
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

        GraphicsUtils.addOrRemoveClass("menu-button-regions-windoku", "display-none", this.size !== 9);

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
                console.log("SHOW CONFIRM WINDOW DENIED", name);
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
     * Hide confirm window
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
    private static changeMenuPosition(leftPosition: string, rightPosition: string | null): boolean {
        let [previousLeftPosition, previousRightPosition] = this.menuPosition;

        console.log(`${previousLeftPosition} ${previousRightPosition} -> ${leftPosition} ${rightPosition}`);

        // Change what button is selected
        if (leftPosition !== previousLeftPosition) {
            if (previousLeftPosition !== null) {
                GraphicsUtils.removeClass(`menu-button-${previousLeftPosition}`, "selected");
                GraphicsUtils.removeClass(`menu-section-${previousLeftPosition}`, "selected");
            }
            GraphicsUtils.addClass(`menu-button-${leftPosition}`, "selected");
            GraphicsUtils.addClass(`menu-section-${leftPosition}`, "selected");
        }
        if (rightPosition !== previousRightPosition) {
            if (previousRightPosition !== null) {
                GraphicsUtils.removeClass(`menu-button-${previousRightPosition}`, "selected");
            }
            if (rightPosition !== null) {
                GraphicsUtils.addClass(`menu-button-${rightPosition}`, "selected");
            }
        }

        // Show/hide buttons based on menu position
        let previousIsSolve = previousLeftPosition === "solve";
        let isSolve = leftPosition === "solve";
        if (previousLeftPosition === null || isSolve != previousIsSolve) {
            if (isSolve) {
                console.log("-> isSolve");
                for (let c of this.VIEW_SOLVE_ONLY) {
                    GraphicsUtils.removeClass(c, "display-none");
                }
                for (let c of this.VIEW_TASK_ONLY) {
                    GraphicsUtils.addClass(c, "display-none");
                }
            } else {
                console.log("-> ! isSolve");
                for (let c of this.VIEW_SOLVE_ONLY) {
                    GraphicsUtils.addClass(c, "display-none");
                }
                for (let c of this.VIEW_TASK_ONLY) {
                    GraphicsUtils.removeClass(c, "display-none");
                }
            }
        }

        // add/remove event listeners
        if (rightPosition !== previousRightPosition) {
            let hadRegionsListeners = previousRightPosition === "regions-jigsaw" || previousRightPosition === "regions-extraregions";
            let willHaveRegionsListeners = rightPosition === "regions-jigsaw" || rightPosition === "regions-extraregions";
            if (willHaveRegionsListeners && ! hadRegionsListeners) {
                RegionEditor.addEventListeners();
            } else if (hadRegionsListeners && ! willHaveRegionsListeners) {
                RegionEditor.removeEventListeners();
            }
        }

        this.menuPosition = [leftPosition, rightPosition];

        return leftPosition !== previousLeftPosition || rightPosition !== previousRightPosition;
    }

    /**
     * Add or remove .selected class for all checks
     */
    public static updateChecks(): void {
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

    public static pressedResizeButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("resize");
            this.showConfirmWindow("resize", true);
            console.log("resize");
        }
    }

    public static confirmResize(): void {
        let resizeInput = <HTMLInputElement>document.getElementById("resize-value");
        if (resizeInput !== null) {
            let newSize = parseInt(resizeInput.value);
            this.size = Math.max(this.MIN_SIZE, Math.min(this.MAX_SIZE, newSize));
            if (newSize === this.size) {
                console.log("resize-confirm");
                this.hideConfirmWindow();
                this.createFrame();
                this.render();
                this.changeMenuPosition("view", null);
            } else {
                resizeInput.value = `${this.size}`;
            }
        }
    }

    public static cancel(): void {
        this.hideConfirmWindow();
        console.log("cancel");
    }

    public static pressedTaskEditButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("task-edit");
            this.showConfirmWindow("task-edit", true);
            console.log("task-edit");
        }
    }

    public static confirmTaskEdit(): void {
        this.changeMenuPosition("view", null);
        this.hideConfirmWindow();
        console.log("task-edit-confirm");
    }

    public static pressedRegionsButton(): void {
        if (! this.isConfirmOpen) {
            this.showConfirmWindow("regions", false);
            let isClicked = this.changeMenuPosition("regions", "regions-view");
            this.setRegionsNoneToSudoku();
            if (isClicked) {
                console.log("regions");
            }
            this.render();
        }
        this.render();
    }

    public static pressedRegionsRectangularButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("regions-rectangular");
            this.changeMenuPosition("regions", "regions-view");
            this.showConfirmWindow("regions-rectangular", true);
            console.log("regions-rectangular");
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
        console.log("regions-rectangular-confirm");
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
            console.log("regions-none");
            this.render();
        }
    }

    public static pressedRegionsJigsawButton(): void {
        if (! this.isConfirmOpen) {
            this.showConfirmWindow("regions-jigsaw", false);
            let isClicked = this.changeMenuPosition("regions", "regions-jigsaw");
            if (isClicked) {
                console.log("regions-jigsaw");
            }
            RegionEditor.checkIfRegionsAreAll();
            this.render();
        }
    }

    public static pressedRegionsDiagonalButton(): void {
        if (! this.isConfirmOpen) {
            this.addTemporaryButtonFocus("regions-diagonal");
            this.changeMenuPosition("regions", "regions-view");
            console.log("regions-diagonal");
            this.sudoku.regions.hasDiagonals = ! this.sudoku.regions.hasDiagonals;
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
            console.log("regions-noextraregions");
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
            console.log("regions-windoku");
            this.render();
        }
    }

    public static pressedRegionsExtraregionsButton(): void {
        if (! this.isConfirmOpen) {
            this.showConfirmWindow("regions-extraregions", false);
            let isClicked = this.changeMenuPosition("regions", "regions-extraregions");
            if (isClicked) {
                console.log("regions-extraregions");
            }
            RegionEditor.checkIfRegionsAreAll();
            this.render();
        }
    }

    public static pressedRegionsViewButton(): void {
        if (! this.isConfirmOpen) {
            let isClicked = this.changeMenuPosition("regions", "regions-view");
            if (isClicked) {
                console.log("regions-view");
            }
            this.render();
        }
    }

    public static pressedViewButton(): void {
        if (! this.isConfirmOpen) {
            let isClicked = this.changeMenuPosition("view", null);
            if (isClicked) {
                console.log("view");
            }
            this.render();
        }
    }

    public static pressedSolveStartButton(): void {
        if (! this.isConfirmOpen) {
            // TODO: implement

            let isClicked = this.changeMenuPosition("solve", null);
            if (isClicked) {
                console.log("solve-start");
            }
            this.render();
        }
    }

    public static pressedSolveRestartButton(): void {
        if (! this.isConfirmOpen) {
            this.showConfirmWindow("solve-restart", true);
            this.addTemporaryButtonFocus("solve-restart");
            console.log("solve-restart");
            this.render();
        }
    }

    public static confirmSolveRestart(): void {
        // TODO: implement
        this.hideConfirmWindow();
        console.log("solve-restart-confirm");
    }
}