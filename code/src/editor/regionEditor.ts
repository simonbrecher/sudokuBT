/**
 * Data for unfinished Jigsaw or Extra regions.
 */
type RegionsSudokuData = {
    name: "jigsaw" | "extraregions", // are these Jigsaw or Extra regions
    sudoku: Sudoku, // a Sudoku object that is being used to render the Regions in editor
    regionsMatrix: number[], // regionsMatrix[y * sudoku.size + x] is index of region in cell (y, x)
    nextRegion: Set<number>, // set of cells (y * sudoku.size + x) that are being added to the next (unfinished) region
}

class RegionEditor {
    /**
     * Data for unfinished Jigsaw regions.
     */
    private static jigsaw: RegionsSudokuData;
    /**
     * Data for unfinished Extra regions.
     */
    private static extraRegions: RegionsSudokuData;

    /**
     * Event listeners that are used to capture user input for adding jigsaw and extra regions.
     */
    public static eventListeners: [string, EventListener][] = [
        ["mousedown", (event: Event) => this.mouseDownEventListener(<MouseEvent>event)],
        ["mouseup", (event: Event) => this.mouseUpEventListener(<MouseEvent>event)],
        ["mousemove", (event: Event) => this.mouseMoveEventListener(<MouseEvent>event)],
        ["mouseleave", (event: Event) => this.mouseUpEventListener(<MouseEvent>event)],
        ["contextmenu", (event: Event) => event.preventDefault()],
    ];

    /**
     * Depending on what tab is open in the left menu, are there supposed to be event listeners?
     */
    public static hasEventListeners(left: string, right: string): boolean {
        return right === "regions-jigsaw" || right === "regions-extraregions";
    }

    /**
     * Render sudoku while editing jigsaw regions
     */
    private static renderJigsaw(): void {
        let sudoku = this.jigsaw.sudoku;
        let mainSudoku = MainEditor.sudoku;

        // copy other settings from MainEditor.sudoku
        sudoku.regions.setExtraRegions(mainSudoku.regions.extraRegions);
        sudoku.regions.hasDiagonals = mainSudoku.regions.hasDiagonals;
        sudoku.task.board = ArrayUtils.deepcopyArray1d(mainSudoku.task.board);
        sudoku.setFinishedEdgeVariant(mainSudoku.getEdgeVariant());

        // render sudoku
        Renderer.renderer.render(sudoku.task, MainEditor.frame);

        // render gray cells
        for (let y = 0; y < MainEditor.size; y++) {
            for (let x = 0; x < MainEditor.size; x++) {
                let value = this.jigsaw.regionsMatrix[y * MainEditor.size + x]
                if (value === -1) {
                    let cell = MainEditor.frame.getCell(y, x);
                    cell.setBackgroundColor("#CCC");
                }
            }
        }
    }

    /**
     * Render sudoku while editing extra regions
     */
    private static renderExtraRegions(): void {
        let sudoku = this.extraRegions.sudoku;
        let mainSudoku = MainEditor.sudoku;

        // copy other settings from MainEditor.sudoku
        sudoku.regions.setJigsaw(mainSudoku.regions.regions);
        sudoku.regions.hasDiagonals = mainSudoku.regions.hasDiagonals;
        sudoku.task.board = ArrayUtils.deepcopyArray1d(mainSudoku.task.board);
        sudoku.setFinishedEdgeVariant(mainSudoku.getEdgeVariant());

        // render sudoku
        Renderer.renderer.render(sudoku.task, MainEditor.frame);
    }

    /**
     * Render sudoku while editing Jigsaw or Extra regions
     */
    public static renderSudoku(): void {
        switch (MainEditor.menuPosition.right) {
            case "regions-jigsaw":
                this.renderJigsaw();
                break;
            case "regions-extraregions":
                this.renderExtraRegions();
                break;
            default:
                throw `Cannot render regions sudoku if MainEditor.menuPosition.right=${MainEditor.menuPosition.right}`;
        }
    }

    /**
     * Create RegionsSudokuData for new Sudoku with no regions
     * @param name Jigsaw or Extra regions
     * @param size size of the Sudoku
     */
    private static createSudokuData(name: "jigsaw" | "extraregions", size: number): RegionsSudokuData {
        return {
            name: name,
            sudoku: new Sudoku(size),
            regionsMatrix: ArrayUtils.createArray1d(size * size, -1),
            nextRegion: new Set<number>(),
        }
    }

    /**
     * Once the EditorMain.sudoku.size gets changed (created new Sudoku with different size),
     * regenerate RegionsSudokuData
     */
    public static onCreateFrame(): void {
        this.jigsaw = this.createSudokuData("jigsaw", MainEditor.size);
        this.extraRegions = this.createSudokuData("extraregions", MainEditor.size);
    }

    /**
     * Add new cell to the currently unfinished region.
     * @param sudokuData object RegionsSudokuData with the regions' data.
     * @param y y coordinate of the cell to add
     * @param x x coordinate of the cell to add
     */
    private static addCellToRegion(sudokuData: RegionsSudokuData, y: number, x: number): void {
        if (sudokuData.regionsMatrix[y * MainEditor.size + x] === -1) {
            let cell = MainEditor.frame.getCell(y, x);
            cell.setText("+");
            sudokuData.nextRegion.add(y * MainEditor.size + x);
        }
    }

    /**
     * Remove the region with cell (y, x), if the cell is in any region
     * @param sudokuData object RegionsSudokuData with the regions' data.
     * @param y y coordinate of the cell
     * @param x x coordinate of the cell
     */
    private static removeRegion(sudokuData: RegionsSudokuData, y: number, x: number): void {
        let regionIndex = sudokuData.regionsMatrix[y * MainEditor.size + x];
        if (regionIndex !== -1) {
            for (let i = 0; i < MainEditor.size * MainEditor.size; i++) {
                if (sudokuData.regionsMatrix[i] === regionIndex) {
                    sudokuData.regionsMatrix[i] = -1;
                }
            }
        }
        sudokuData.regionsMatrix = PositionUtils.countConnectedAreas(sudokuData.regionsMatrix, MainEditor.size, MainEditor.size, PositionUtils.DIRECTIONS_4);
        this.renderSudoku();
    }

    /**
     * Get RegionsSudokuData for Jigsaw or Extra regions, depending on which type of regions is currently being edited
     */
    private static getActiveSudokuData(): RegionsSudokuData {
        switch (MainEditor.menuPosition.right) {
            case "regions-jigsaw":
                return this.jigsaw;
            case "regions-extraregions":
                return this.extraRegions;
            default:
                throw `Cannot call getActiveSudokuData if MainEditor.menuPosition.right==${MainEditor.menuPosition.right}`;
        }
    }

    private static mouseDownEventListener(event: MouseEvent): void {
        let cell = EditorUtils.mouseCoordinatesToCellCoordinates(event.y, event.x);
        if ((event.buttons & 1) !== 0) {
            this.addCellToRegion(this.getActiveSudokuData(), cell.y, cell.x);
        } else if ((event.buttons & 2) !== 0) {
            this.removeRegion(this.getActiveSudokuData(), cell.y, cell.x);
        }
    }

    /**
     * One the user stops holding left mouse button, check if the new regions should be added or not.
     * @param sudokuData RegionsSudokuData for Jigsaw or Extra regions
     */
    private static addRegion(sudokuData: RegionsSudokuData): void {
        // check if the new region is connected by edges, if so add it
        let newRegionsMatrix = ArrayUtils.deepcopyArray1d(sudokuData.regionsMatrix);
        if (sudokuData.nextRegion.size === MainEditor.size) {
            let regionIndex = Math.max(...newRegionsMatrix) + 1;
            let nextRegion = Array.from(sudokuData.nextRegion);
            for (let index of nextRegion) {
                newRegionsMatrix[index] = regionIndex;
            }
        }
        newRegionsMatrix = PositionUtils.countConnectedAreas(newRegionsMatrix, MainEditor.size, MainEditor.size, PositionUtils.DIRECTIONS_4);
        if (Math.max(...newRegionsMatrix) === Math.max(...sudokuData.regionsMatrix) + 1) {
            sudokuData.regionsMatrix = newRegionsMatrix;
            this.checkIfRegionsAreAll();
        }

        // add the region to the Sudoku
        sudokuData.nextRegion = new Set<number>();
        if (sudokuData.name === "jigsaw") {
            sudokuData.sudoku.regions.setJigsaw(PositionUtils.matrixToRegions(sudokuData.regionsMatrix));
        } else {
            sudokuData.sudoku.regions.setExtraRegions(PositionUtils.matrixToRegions(sudokuData.regionsMatrix));
        }
        this.renderSudoku();
    }

    private static mouseUpEventListener(event: MouseEvent): void {
        let sudokuData = this.getActiveSudokuData();
        this.addRegion(sudokuData);
        sudokuData.nextRegion = new Set<number>();
    }

    private static mouseMoveEventListener(event: MouseEvent): void {
        let sudokuData = this.getActiveSudokuData();
        if ((event.buttons & 1) !== 0) {
            if (sudokuData.nextRegion.size < MainEditor.size) {
                let cell = EditorUtils.mouseCoordinatesToCellCoordinates(event.y, event.x);
                this.addCellToRegion(sudokuData, cell.y, cell.x);
            }
        }
    }

    /**
     * For Jigsaw regions, check if all regions have been added, for extra regions check if there is at least one.
     * If so, add the regions to MainEditor.sudoku.
     */
    public static checkIfRegionsAreAll(): void {
        let sudokuData = this.getActiveSudokuData();
        if (sudokuData.name == "jigsaw") {
            if (Math.max(...sudokuData.regionsMatrix) === MainEditor.size - 1) {
                MainEditor.sudoku.regions.setJigsaw(PositionUtils.matrixToRegions(sudokuData.regionsMatrix));
                MainEditor.updateChecksRegions();
            }
        } else {
            if (Math.max(...sudokuData.regionsMatrix) > -1) {
                MainEditor.sudoku.regions.setExtraRegions(PositionUtils.matrixToRegions(sudokuData.regionsMatrix));
                MainEditor.updateChecksRegions();
            }
        }
    }
}