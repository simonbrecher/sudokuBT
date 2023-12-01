class EditorMain {
    private static size: number = 9; // size of sudoku

    private static frame: Frame = null!;

    private static emptySudoku: Sudoku; // sudoku without regions with graphic and with both empty states

    private static selectedMenuButton: string | null = null;

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
        this.setSelectedMenuButton("menu-button-view", false);
    }

    /**
     * Control .selected CSS class for menu buttons
     * @param buttonId id of button that will be selected
     * @param isTemporary Is the change temporary?
     */
    private static setSelectedMenuButton(buttonId: string, isTemporary: boolean): void {
        if (this.selectedMenuButton !== buttonId) {
            if (this.selectedMenuButton !== null && ! isTemporary) {
                let button = document.getElementById(this.selectedMenuButton);
                button?.classList.remove("selected");
            }
            let button = document.getElementById(buttonId);
            button?.classList.add("selected");
            if (isTemporary) {
                setTimeout(() => {
                    button?.classList.remove("selected");
                }, 220);
            } else {
                this.selectedMenuButton = buttonId;
            }
        }
    }

    public static pressedResizeButton(): void {
        this.setSelectedMenuButton("menu-button-resize", true);
    }

    public static pressedClearButton(): void {
        this.setSelectedMenuButton("menu-button-clear", true);
    }

    public static pressedRegionsButton(): void {
        this.setSelectedMenuButton("menu-button-regions", false);
    }

    public static pressedViewButton(): void {
        this.setSelectedMenuButton("menu-button-view", false);
    }
}