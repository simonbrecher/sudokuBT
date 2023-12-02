type JigsawMouseEventType = "mousedown" | "mouseup" | "mousemove" | "mouseleave" | "contextmenu";

class EditorMain {
    private static readonly MIN_SIZE = 3;
    private static readonly MAX_SIZE = 25;
    private static readonly MAX_BOARD_SIZE = 600;
    private static readonly MAX_CELL_SIZE = 70;

    private static readonly jigsawColor = {
        inRegion: "#FFF",
        inNextRegion: "#FA0",
        inNoRegion: "#CCC",
    }

    private static size: number = 9; // size of sudoku

    private static frame: Frame = null!;

    private static sudoku: Sudoku;

    private static jigsawRegionsSudoku: Sudoku;
    private static regionsMatrix: number[];
    private static nextRegion: Set<number> = new Set<number>();

    private static jigsawEventListeners: [JigsawMouseEventType, (event: MouseEvent) => void][] = [
        ["mousedown", (event: MouseEvent) => this.jigsawMouseDownEventListener(event)],
        ["mouseup", (event: MouseEvent) => this.jigsawMouseUpEventListener(event)],
        ["mousemove", (event: MouseEvent) => this.jigsawMouseMoveEventListener(event)],
        ["mouseleave", (event: MouseEvent) => this.jigsawMouseUpEventListener(event)],
        ["contextmenu", (event: MouseEvent) => event.preventDefault()],
    ];

    private static selectedMenuButton: [string | null, string | null] = [null, null];

    private static renderSudoku(): void {
        Renderer.renderer.render(this.sudoku.solution, this.frame);
    }

    private static render(): void {
        if (this.selectedMenuButton[1] === "menu-button-regions-jigsaw") {
            this.renderJigsaw();
        } else {
            this.renderSudoku();
        }
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

        this.jigsawRegionsSudoku = new Sudoku(this.size);
        this.regionsMatrix = this.jigsawRegionsSudoku.regions.getRegionsMatrix();

        this.render();
        this.refreshRegionsChecks();
        if (this.selectedMenuButton[1] === "menu-button-regions-jigsaw") {
            this.addRegionsJigsawEventListeners();
        }
    }

    /**
     * This method is called by <script><script/> in editor.html
     */
    public static main(): void {
        this.createFrame();
        this.setSelectedMenuButton("view", true, false);
        this.maybeRemoveRectangularRegionsButton();
    }

    /**
     * Control .selected CSS class for menu buttons
     * @param buttonName HTML id = `menu-button-${buttonName}`
     * @param isLeft is it in the left menu
     * @param isTemporary Is the change temporary?
     */
    private static setSelectedMenuButton(buttonName: string, isLeft: boolean, isTemporary: boolean): boolean {
        if (buttonName === "regions-jigsaw") { // TODO: figure out better organization of code
            this.addRegionsJigsawEventListeners();
        } else {
            this.removeRegionsJigsawEventListeners();
        }

        let buttonId = `menu-button-${buttonName}`;
        let menuId = isLeft ? 0 : 1;
        let isUpdated = this.selectedMenuButton[menuId] !== buttonId;

        if (isUpdated) {
            if (this.selectedMenuButton[menuId] !== null && ! isTemporary) {
                let button = document.getElementById(this.selectedMenuButton[menuId]!);
                button?.classList.remove("selected");
            }
            let button = document.getElementById(buttonId);
            button?.classList.add("selected");

            if (! isTemporary) {
                if (this.selectedMenuButton[menuId] !== null) {
                    let oldSectionId = this.selectedMenuButton[menuId]!.replace("menu-button", "menu-section");
                    let section = document.getElementById(oldSectionId);
                    section?.classList.remove("selected");
                }
                let sectionId = `menu-section-${buttonName}`;
                let section = document.getElementById(sectionId);
                section?.classList.add("selected");
            }

            if (isTemporary) {
                setTimeout(() => {
                    button?.classList.remove("selected");
                }, 220);
            } else {
                this.selectedMenuButton[menuId] = buttonId;
            }
        }

        return isUpdated;
    }

    private static setCheckValue(checkName: string, value: boolean): void {
        let check = document.getElementById(`check-${checkName}`);
        if (value) {
            check?.classList.add("selected");
        } else {
            check?.classList.remove("selected");
        }
    }

    private static refreshRegionsChecks(): void {
        let isNone = ! this.sudoku.regions.hasRegions();
        let isRectangular = this.sudoku.regions.isRectangular();
        let isJigsaw = ! (isNone || isRectangular);

        this.setCheckValue("regions-none", isNone);
        this.setCheckValue("regions-rectangular", isRectangular);
        this.setCheckValue("regions-jigsaw", isJigsaw);
    }

    public static showConfirmWindow(windowName: string): void {
        let confirmWindow = document.getElementById(`confirm-window-${windowName}`);
        confirmWindow?.classList.add("selected");
    }

    public static hideConfirmWindow(windowName: string): void {
        let confirmWindow = document.getElementById(`confirm-window-${windowName}`);
        confirmWindow?.classList.remove("selected");
    }

    public static pressedResizeButton(): void {
        let isClicked = this.setSelectedMenuButton("resize", true, true);
        if (isClicked) {
            this.showConfirmWindow("resize");
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
                this.hideConfirmWindow("resize");
                this.createFrame();
                this.maybeRemoveRectangularRegionsButton();
            } else {
                resizeInput.value = `${this.size}`;
            }
        }
    }

    public static cancelResize(): void {
        this.hideConfirmWindow("resize");
        console.log("resize-cancel");
    }

    public static pressedClearButton(): void {
        let isClicked = this.setSelectedMenuButton("clear", true, true);
        if (isClicked) {
            console.log("clear");
        }
    }

    private static maybeRemoveRectangularRegionsButton(): void {
        let isPrime = true;
        for (let i = 2; i * i <= this.size; i++) {
            if (Math.floor(this.size / i) * i === this.size) {
                isPrime = false;
                break;
            }
        }
        let button = document.getElementById("menu-button-regions-rectangular");
        if (isPrime) {
            button?.classList.add("display-none");
        } else {
            button?.classList.remove("display-none");
        }
    }

    public static pressedRegionsButton(): void {
        let isClicked = this.setSelectedMenuButton("regions", true, false);
        this.setSelectedMenuButton("regions-view", false, false);
        this.setRegionsNoneToSudoku();
        if (isClicked) {
            console.log("regions");
        }
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
        let isClicked = this.setSelectedMenuButton("regions-rectangular", false, true);
        this.setSelectedMenuButton("regions-view", false, false);
        if (isClicked) {
            this.setRegionsRectangularSelectOptions();
            this.showConfirmWindow("regions-rectangular");
            console.log("regions-rectangular");
        }
    }

    private static setRegionsRectangularToSudoku(): void {
        let select = <HTMLSelectElement>document.getElementById("regions-rectangular-value");
        let rectangleHeight = parseInt(select.value);
        let rectangleWidth = this.size / rectangleHeight;
        this.sudoku.regions.setRectangular(rectangleHeight, rectangleWidth);
        this.refreshRegionsChecks();
    }

    public static confirmRegionsRectangular(): void {
        this.hideConfirmWindow("regions-rectangular");
        this.setRegionsRectangularToSudoku();
        this.render();
        console.log("regions-rectangular-confirm");
    }

    public static cancelRegionsRectangular(): void {
        this.hideConfirmWindow("regions-rectangular");
        console.log("regions-rectangular-cancel");
    }

    private static setRegionsNoneToSudoku(): void {
        this.sudoku.regions.setNoRegions();
        this.refreshRegionsChecks();
    }

    public static pressedRegionsNoneButton(): void {
        let isClicked = this.setSelectedMenuButton("regions-none", false, true);
        this.setSelectedMenuButton("regions-view", false, false);
        if (isClicked) {
            console.log("regions-none");
        }
        this.setRegionsNoneToSudoku();
        this.render();
    }

    private static renderJigsaw(): void {
        Renderer.renderer.render(this.jigsawRegionsSudoku.solution, this.frame);

        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                let value = this.regionsMatrix[y * this.size + x]
                let backgroundColor = value === -1 ? this.jigsawColor.inNoRegion : this.jigsawColor.inRegion;

                let cell = this.frame.getCell(y, x);
                cell.setBackgroundColor(backgroundColor);
            }
        }
    }

    private static mouseCoordinatesToCellCoordinates(mouseY: number, mouseX: number): { y: number, x: number } {
        let bound = this.frame.table.getBoundingClientRect();
        let y = Math.floor((mouseY - bound.top) / bound.height * this.size);
        let x = Math.floor((mouseX - bound.left) / bound.width * this.size);
        y = Math.min(this.size - 1, Math.max(0, y));
        x = Math.min(this.size - 1, Math.max(0, x));
        return { y: y, x: x };
    }

    private static jigsawAddCellToRegion(y: number, x: number): void {
        if (this.regionsMatrix[y * this.size + x] === -1) {
            let cell = this.frame.getCell(y, x);
            cell.setText("+");

            this.nextRegion.add(y * this.size + x);
        }
    }

    private static jigsawRemoveRegion(y: number, x: number): void {
        let regionIndex = this.regionsMatrix[y * this.size + x];
        if (regionIndex !== -1) {
            for (let i = 0; i < this.size * this.size; i++) {
                if (this.regionsMatrix[i] === regionIndex) {
                    this.regionsMatrix[i] = -1;
                }
            }
        }
        this.regionsMatrix = PositionUtils.countConnectedAreas(this.regionsMatrix, this.size, this.size, PositionUtils.DIRECTIONS_4);
        this.render();
    }

    private static jigsawMouseDownEventListener(event: MouseEvent): void {
        let cell = this.mouseCoordinatesToCellCoordinates(event.y, event.x);
        if ((event.buttons & 1) !== 0) {
            this.jigsawAddCellToRegion(cell.y, cell.x);
        } else if ((event.buttons & 2) !== 0) {
            this.jigsawRemoveRegion(cell.y, cell.x);
        }
    }

    private static jigsawCheckRegionsAreAll(): void {
        if (Math.max(...this.regionsMatrix) === this.size - 1) {
            this.sudoku.regions.setJigsaw(PositionUtils.matrixToRegions(this.regionsMatrix));
            this.refreshRegionsChecks();
        }
    }

    private static jigsawAddRegion(): void {
        let newRegionsMatrix = ArrayUtils.deepcopyArray1d(this.regionsMatrix);
        if (this.nextRegion.size === this.size) {
            let regionIndex = Math.max(...newRegionsMatrix) + 1;
            let nextRegion = Array.from(this.nextRegion);
            for (let index of nextRegion) {
                newRegionsMatrix[index] = regionIndex;
            }
        }
        newRegionsMatrix = PositionUtils.countConnectedAreas(newRegionsMatrix, this.size, this.size, PositionUtils.DIRECTIONS_4);
        if (Math.max(...newRegionsMatrix) === Math.max(...this.regionsMatrix) + 1) {
            this.regionsMatrix = newRegionsMatrix;
            this.jigsawCheckRegionsAreAll();
        }
        this.nextRegion = new Set<number>();
        this.jigsawRegionsSudoku.regions.setJigsaw(PositionUtils.matrixToRegions(this.regionsMatrix));
        this.render();
    }

    private static jigsawMouseUpEventListener(event: MouseEvent): void {
        this.jigsawAddRegion();
        this.nextRegion = new Set<number>();
    }

    private static jigsawMouseMoveEventListener(event: MouseEvent): void {
        if ((event.buttons & 1) !== 0) {
            if (this.nextRegion.size < this.size) {
                let cell = this.mouseCoordinatesToCellCoordinates(event.y, event.x);
                this.jigsawAddCellToRegion(cell.y, cell.x);
            }
        } else {
            this.jigsawAddRegion();
        }
    }

    private static addRegionsJigsawEventListeners(): void {
        for (let [name, method] of this.jigsawEventListeners) {
            this.frame.table.addEventListener(name, method);
        }
    }

    private static removeRegionsJigsawEventListeners(): void {
        for (let [name, method] of this.jigsawEventListeners) {
            this.frame.table.removeEventListener(name, method);
        }
    }

    public static pressedRegionsJigsawButton(): void {
        let isClicked = this.setSelectedMenuButton("regions-jigsaw", false, false);
        if (isClicked) {
            console.log("regions-jigsaw");
        }
        this.jigsawCheckRegionsAreAll();
        this.render();
    }

    public static pressedRegionsViewButton(): void {
        let isClicked = this.setSelectedMenuButton("regions-view", false, false);
        if (isClicked) {
            console.log("regions-view");
        }
        this.render();
    }

    public static pressedViewButton(): void {
        let isClicked = this.setSelectedMenuButton("view", true, false);
        if (isClicked) {
            console.log("view");
        }
        this.render();
    }
}