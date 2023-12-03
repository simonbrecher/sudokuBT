type JigsawMouseEventType = "mousedown" | "mouseup" | "mousemove" | "mouseleave" | "contextmenu";

class JigsawEditor {
    private static readonly backgroundColors = {
        inRegion: "#FFF",
        inNextRegion: "#FA0",
        inNoRegion: "#CCC",
    }

    private static sudoku: Sudoku;
    private static regionsMatrix: number[];
    private static nextRegion: Set<number> = new Set<number>();

    private static eventListeners: [JigsawMouseEventType, (event: MouseEvent) => void][] = [
        ["mousedown", (event: MouseEvent) => this.mouseDownEventListener(event)],
        ["mouseup", (event: MouseEvent) => this.mouseUpEventListener(event)],
        ["mousemove", (event: MouseEvent) => this.mouseMoveEventListener(event)],
        ["mouseleave", (event: MouseEvent) => this.mouseUpEventListener(event)],
        ["contextmenu", (event: MouseEvent) => event.preventDefault()],
    ];

    /**
     * Render sudoku while editing jigsaw regions
     */
    public static renderSudoku(): void {
        Renderer.renderer.render(this.sudoku.solution, MainEditor.frame);

        for (let y = 0; y < MainEditor.size; y++) {
            for (let x = 0; x < MainEditor.size; x++) {
                let value = this.regionsMatrix[y * MainEditor.size + x]
                let backgroundColor = value === -1 ? this.backgroundColors.inNoRegion : this.backgroundColors.inRegion;

                let cell = MainEditor.frame.getCell(y, x);
                cell.setBackgroundColor(backgroundColor);
            }
        }
    }

    public static onCreateFrame(): void {
        this.sudoku = new Sudoku(MainEditor.size);
        this.regionsMatrix = this.sudoku.regions.getRegionsMatrix();
    }

    private static addCellToRegion(y: number, x: number): void {
        if (this.regionsMatrix[y * MainEditor.size + x] === -1) {
            let cell = MainEditor.frame.getCell(y, x);
            cell.setText("+");
            this.nextRegion.add(y * MainEditor.size + x);
        }
    }

    private static removeRegion(y: number, x: number): void {
        let regionIndex = this.regionsMatrix[y * MainEditor.size + x];
        if (regionIndex !== -1) {
            for (let i = 0; i < MainEditor.size * MainEditor.size; i++) {
                if (this.regionsMatrix[i] === regionIndex) {
                    this.regionsMatrix[i] = -1;
                }
            }
        }
        this.regionsMatrix = PositionUtils.countConnectedAreas(this.regionsMatrix, MainEditor.size, MainEditor.size, PositionUtils.DIRECTIONS_4);
        this.renderSudoku();
    }

    private static mouseDownEventListener(event: MouseEvent): void {
        let cell = MainEditor.mouseCoordinatesToCellCoordinates(event.y, event.x);
        if ((event.buttons & 1) !== 0) {
            this.addCellToRegion(cell.y, cell.x);
        } else if ((event.buttons & 2) !== 0) {
            this.removeRegion(cell.y, cell.x);
        }
    }

    private static addRegion(): void {
        let newRegionsMatrix = ArrayUtils.deepcopyArray1d(this.regionsMatrix);
        if (this.nextRegion.size === MainEditor.size) {
            let regionIndex = Math.max(...newRegionsMatrix) + 1;
            let nextRegion = Array.from(this.nextRegion);
            for (let index of nextRegion) {
                newRegionsMatrix[index] = regionIndex;
            }
        }
        newRegionsMatrix = PositionUtils.countConnectedAreas(newRegionsMatrix, MainEditor.size, MainEditor.size, PositionUtils.DIRECTIONS_4);
        if (Math.max(...newRegionsMatrix) === Math.max(...this.regionsMatrix) + 1) {
            this.regionsMatrix = newRegionsMatrix;
            this.checkIfRegionsAreAll();
        }
        this.nextRegion = new Set<number>();
        this.sudoku.regions.setJigsaw(PositionUtils.matrixToRegions(this.regionsMatrix));
        this.renderSudoku();
    }

    private static mouseUpEventListener(event: MouseEvent): void {
        this.addRegion();
        this.nextRegion = new Set<number>();
    }

    private static mouseMoveEventListener(event: MouseEvent): void {
        if ((event.buttons & 1) !== 0) {
            if (this.nextRegion.size < MainEditor.size) {
                let cell = MainEditor.mouseCoordinatesToCellCoordinates(event.y, event.x);
                this.addCellToRegion(cell.y, cell.x);
            }
        } else {
            this.addRegion();
        }
    }

    public static checkIfRegionsAreAll(): void {
        if (Math.max(...this.regionsMatrix) === MainEditor.size - 1) {
            MainEditor.sudoku.regions.setJigsaw(PositionUtils.matrixToRegions(this.regionsMatrix));
            MainEditor.updateChecks();
        }
    }

    public static addEventListeners(): void {
        for (let [name, method] of this.eventListeners) {
            MainEditor.frame.table.addEventListener(name, method);
        }
    }

    public static removeEventListeners(): void {
        for (let [name, method] of this.eventListeners) {
            MainEditor.frame.table.removeEventListener(name, method);
        }
    }
}