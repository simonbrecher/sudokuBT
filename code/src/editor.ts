class EditorMain {
    private static size: number = 9; // size of sudoku

    private static frame: Frame = null!;

    private static emptySudoku: Sudoku; // sudoku without regions with graphic and with both empty states

    private static selectedMenuButton: [string | null, string | null] = [null, null];

    /**
     * Create Frame object which will be used to render sudoku
     */
    private static createFrame(): void {
        let cellSize = Math.min(70, 600 / Math.floor(this.size));
        this.frame = new Frame(this.size, this.size, cellSize, "container");

        this.emptySudoku = new Sudoku(this.size);

        Renderer.renderer.render(this.emptySudoku.solution, this.frame);
    }

    /**
     * This method is called by <script><script/> in editor.html
     */
    public static main(): void {
        this.createFrame();
        this.setSelectedMenuButton("view", true, false);
    }

    /**
     * Control .selected CSS class for menu buttons
     * @param buttonName HTML id = `menu-button-${buttonName}`
     * @param isLeft is it in the left menu
     * @param isTemporary Is the change temporary?
     */
    private static setSelectedMenuButton(buttonName: string, isLeft: boolean, isTemporary: boolean): boolean {
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

    public static pressedResizeButton(): void {
        let isClicked = this.setSelectedMenuButton("resize", true, true);
        if (isClicked) {
            console.log("resize");
        }
    }

    public static pressedClearButton(): void {
        let isClicked = this.setSelectedMenuButton("clear", true, true);
        if (isClicked) {
            console.log("clear");
        }
    }

    public static pressedRegionsButton(): void {
        let isClicked = this.setSelectedMenuButton("regions", true, false);
        this.setSelectedMenuButton("regions-view", false, false);
        if (isClicked) {
            console.log("regions");
        }
    }

    public static pressedRegionsRectangularButton(): void {
        let isClicked = this.setSelectedMenuButton("regions-rectangular", false, true);
        this.setSelectedMenuButton("regions-view", false, false);
        if (isClicked) {
            console.log("regions-rectangular");
        }
    }

    public static pressedRegionsNoneButton(): void {
        let isClicked = this.setSelectedMenuButton("regions-none", false, true);
        this.setSelectedMenuButton("regions-view", false, false);
        if (isClicked) {
            console.log("regions-none");
        }
    }

    public static pressedRegionsJigsawButton(): void {
        let isClicked = this.setSelectedMenuButton("regions-jigsaw", false, false);
        if (isClicked) {
            console.log("regions-jigsaw");
        }
    }

    public static pressedRegionsViewButton(): void {
        let isClicked = this.setSelectedMenuButton("regions-view", false, false);
        if (isClicked) {
            console.log("regions-view");
        }
    }

    public static pressedViewButton(): void {
        let isClicked = this.setSelectedMenuButton("view", true, false);
        if (isClicked) {
            console.log("view");
        }
    }
}