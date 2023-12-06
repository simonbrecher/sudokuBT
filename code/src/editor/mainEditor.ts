class MainEditor {
    private static readonly MIN_SIZE = 3;
    private static readonly MAX_SIZE = 25;
    private static readonly MAX_BOARD_SIZE = 600;
    private static readonly MAX_CELL_SIZE = 70;

    public static size: number = 9; // size of sudoku

    public static frame: Frame = null!;

    public static sudoku: Sudoku;

    public static menuPosition: [string | null, string | null] = [null, null];

    /**
     * This method is called by <script><script/> in editor.html
     */
    public static main(): void {
        this.createFrame();
        this.render();
        this.changeMenuPosition("view", null);
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

        this.checkHideButtons();
        this.setRegionsRectangularSelectOptions();

        if (this.menuPosition[1] === "regions-jigsaw" || this.menuPosition[1] === "regions-extraregions") {
            RegionEditor.addEventListeners();
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
     * Update graphics for moving in menu to different button.
     * @param leftPosition new position in left menu
     * @param rightPosition new position in right menu
     */
    private static changeMenuPosition(leftPosition: string, rightPosition: string | null): boolean {
        let [previousLeftPosition, previousRightPosition] = this.menuPosition;

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

        if (leftPosition !== previousLeftPosition) {

        }

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
        this.addTemporaryButtonFocus("resize");
        GraphicsUtils.addClass("confirm-window-resize", "selected");
        console.log("resize");
    }

    public static confirmResize(): void {
        let resizeInput = <HTMLInputElement>document.getElementById("resize-value");
        if (resizeInput !== null) {
            let newSize = parseInt(resizeInput.value);
            this.size = Math.max(this.MIN_SIZE, Math.min(this.MAX_SIZE, newSize));
            if (newSize === this.size) {
                console.log("resize-confirm");
                GraphicsUtils.removeClass("confirm-window-resize", "selected");
                this.createFrame();
                this.render();
            } else {
                resizeInput.value = `${this.size}`;
            }
        }
    }

    public static cancelResize(): void {
        GraphicsUtils.removeClass("confirm-window-resize", "selected");
        console.log("resize-cancel");
    }

    public static pressedClearButton(): void {
        this.addTemporaryButtonFocus("clear");
        console.log("clear");
    }

    /**
     * Hide/show all buttons, that should be hidden
     */
    private static checkHideButtons(): void {
        let isPrime = true;
        for (let i = 2; i * i <= this.size; i++) {
            if (Math.floor(this.size / i) * i === this.size) {
                isPrime = false;
                break;
            }
        }
        GraphicsUtils.addOrRemoveClass("menu-button-regions-rectangular", "display-none", isPrime);

        GraphicsUtils.addOrRemoveClass("menu-button-regions-windoku", "display-none", this.size !== 9);
    }

    public static pressedRegionsButton(): void {
        let isClicked = this.changeMenuPosition("regions", "regions-view");
        this.setRegionsNoneToSudoku();
        if (isClicked) {
            console.log("regions");
        }
        this.render();
    }

    private static setRegionsRectangularSelectOptions(): void {
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

    public static pressedRegionsRectangularButton(): void {
        this.addTemporaryButtonFocus("regions-rectangular");
        this.changeMenuPosition("regions", "regions-view");
        GraphicsUtils.addClass("confirm-window-regions-rectangular", "selected");
        console.log("regions-rectangular");
    }

    private static setRegionsRectangularToSudoku(): void {
        let select = <HTMLSelectElement>document.getElementById("regions-rectangular-value");
        let rectangleHeight = parseInt(select.value);
        let rectangleWidth = this.size / rectangleHeight;
        this.sudoku.regions.setRectangular(rectangleHeight, rectangleWidth);
    }

    public static confirmRegionsRectangular(): void {
        GraphicsUtils.removeClass("confirm-window-regions-rectangular", "selected");
        this.changeMenuPosition("regions", "regions-view");
        this.setRegionsRectangularToSudoku();
        console.log("regions-rectangular-confirm");
        this.render();
    }

    public static cancelRegionsRectangular(): void {
        GraphicsUtils.removeClass("confirm-window-regions-rectangular", "selected");
        console.log("regions-rectangular-cancel");
    }

    private static setRegionsNoneToSudoku(): void {
        this.sudoku.regions.setNoRegions();
    }

    public static pressedRegionsNoneButton(): void {
        this.addTemporaryButtonFocus("regions-none");
        this.changeMenuPosition("regions", "regions-view");
        this.setRegionsNoneToSudoku();
        console.log("regions-none");
        this.render();
    }

    public static pressedRegionsJigsawButton(): void {
        let isClicked = this.changeMenuPosition("regions", "regions-jigsaw");
        if (isClicked) {
            console.log("regions-jigsaw");
        }
        RegionEditor.checkIfRegionsAreAll();
        this.render();
    }

    public static pressedRegionsDiagonalButton(): void {
        this.addTemporaryButtonFocus("regions-diagonal");
        this.changeMenuPosition("regions", "regions-view");
        console.log("regions-diagonal");
        this.sudoku.regions.hasDiagonals = ! this.sudoku.regions.hasDiagonals;
        this.render();
    }

    private static setRegionsNoextraregionsToSudoku(): void {
        this.sudoku.regions.setExtraRegions(null);
    }

    public static pressedRegionsNoextraregionsButton(): void {
        this.addTemporaryButtonFocus("regions-noextraregions");
        this.changeMenuPosition("regions", "regions-view");
        this.setRegionsNoextraregionsToSudoku();
        console.log("regions-noextraregions");
        this.render();
    }

    private static setRegionsWindokuToSudoku(): void {
        this.sudoku.regions.setWindoku();
    }

    public static pressedRegionsWindokuButton(): void {
        this.addTemporaryButtonFocus("regions-windoku");
        this.changeMenuPosition("regions", "regions-view");
        this.setRegionsWindokuToSudoku();
        console.log("regions-windoku");
        this.render();
    }

    public static pressedRegionsExtraregionsButton(): void {
        let isClicked = this.changeMenuPosition("regions", "regions-extraregions");
        if (isClicked) {
            console.log("regions-extraregions");
        }
        RegionEditor.checkIfRegionsAreAll();
        this.render();
    }

    public static pressedRegionsViewButton(): void {
        let isClicked = this.changeMenuPosition("regions", "regions-view");
        if (isClicked) {
            console.log("regions-view");
        }
        this.render();
    }

    public static pressedViewButton(): void {
        let isClicked = this.changeMenuPosition("view", null);
        if (isClicked) {
            console.log("view");
        }
        this.render();
    }
}