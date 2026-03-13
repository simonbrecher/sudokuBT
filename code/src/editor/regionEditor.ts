type RegionsSudokuData = {
    name: "jigsaw" | "extraregions",
    sudoku: Sudoku,
    regionsMatrix: number[],
    nextRegion: Set<number>,
}

class RegionEditor {
    private static readonly backgroundColors = {
        inRegion: "#FFF",
        inNextRegion: "#FA0",
        inNoRegion: "#CCC",
    }

    private static jigsaw: RegionsSudokuData;

    private static extraRegions: RegionsSudokuData;

    public static eventListeners: [string, EventListener][] = [
        ["mousedown", (event: Event) => this.mouseDownEventListener(<MouseEvent>event)],
        ["mouseup", (event: Event) => this.mouseUpEventListener(<MouseEvent>event)],
        ["mousemove", (event: Event) => this.mouseMoveEventListener(<MouseEvent>event)],
        ["mouseleave", (event: Event) => this.mouseUpEventListener(<MouseEvent>event)],
        ["contextmenu", (event: Event) => event.preventDefault()],
    ];

    public static hasEventListeners(left: string, right: string): boolean {
        return right === "regions-jigsaw" || right === "regions-extraregions";
    }

    /**
     * Render sudoku while editing jigsaw regions
     */
    private static renderJigsaw(): void {
        Renderer.renderer.render(this.jigsaw.sudoku.solution, MainEditor.frame);

        for (let y = 0; y < MainEditor.size; y++) {
            for (let x = 0; x < MainEditor.size; x++) {
                let value = this.jigsaw.regionsMatrix[y * MainEditor.size + x]
                let backgroundColor = value === -1 ? this.backgroundColors.inNoRegion : this.backgroundColors.inRegion;

                let cell = MainEditor.frame.getCell(y, x);
                cell.setBackgroundColor(backgroundColor);
            }
        }
    }

    /**
     * Render sudoku while editing extra regions
     */
    private static renderExtraRegions(): void {
        Renderer.renderer.render(this.extraRegions.sudoku.solution, MainEditor.frame);
    }

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

    private static createSudokuData(name: "jigsaw" | "extraregions", size: number): RegionsSudokuData {
        return {
            name: name,
            sudoku: new Sudoku(MainEditor.size),
            regionsMatrix: ArrayUtils.createArray1d(MainEditor.size * MainEditor.size, -1),
            nextRegion: new Set<number>(),
        }
    }

    public static onCreateFrame(): void {
        this.jigsaw = this.createSudokuData("jigsaw", MainEditor.size);
        this.extraRegions = this.createSudokuData("extraregions", MainEditor.size);
    }

    private static addCellToRegion(sudokuData: RegionsSudokuData, y: number, x: number): void {
        if (sudokuData.regionsMatrix[y * MainEditor.size + x] === -1) {
            let cell = MainEditor.frame.getCell(y, x);
            cell.setText("+");
            sudokuData.nextRegion.add(y * MainEditor.size + x);
        }
    }

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

    private static addRegion(sudokuData: RegionsSudokuData): void {
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
        } else {
            this.addRegion(sudokuData);
        }
    }

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