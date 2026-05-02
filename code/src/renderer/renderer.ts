class Renderer {
    public static renderer: Renderer = new Renderer();

    public doRenderNumbers: boolean = true;
        public doDifferentiateTaskBigNumber: boolean = false;
        public doSmallNumbersOnFullBinary: boolean = false;
        public doSmallNumbersOnOneNumber: boolean = false;
    public doRenderBackgroundColor: boolean = true;
        public backgroundColor: string = "#FFF";
    public doRenderRegions: boolean = true;
        public regionBordersStyle: string = "strong";
    public doRenderCellBorders: boolean = true;
        public cellBordersStyle: string = "normal";
    public doRenderDiagonals: boolean = true;
        public diagonalsLineStyle: LineStyle = { thickness: 0.2, color: "#0002", cap: "round" };
    public doRenderExtraRegionsBorder: boolean = true;
        public extraRegionsBorderStyle: BasketBorderStyle = { color: "#0006", dash: null, cap: "round" };
    public doRenderExtraRegionsBackgroundColor: boolean = true;
        public extraRegionsBackgroundColor: string = "#EEE";
    public doRenderEdgeVariant: boolean = true;
        public doRenderEdgeNone: boolean = true;
        public edgeNoneStyle: EdgeLabelStyle = { css: ["none"] };
    public doRemoveBackgroundTextsBackgroundColor: boolean = true;
    public doRemoveAllCellClasses: boolean = true;

    constructor() {

    }

    /**
     * Convert binary representation of a cell to array of characters, that should be rendered in the cell.
     */
    private binaryToCharacters(binary: number, fullBinary: number): string | string[] {
        if (binary === 0) {
            return "!";
        } else if (binary === fullBinary && ! this.doSmallNumbersOnFullBinary) {
            return [];
        }

        let shifts = BinaryUtils.binaryToShifts32(binary);
        let characters = [];
        for (let shift of shifts) {
            characters.push(`${shift + 1}`);
        }
        return (characters.length !== 1 || this.doSmallNumbersOnOneNumber) ? characters : characters[0];
    }

    private renderBasic(state: State, sudoku: Sudoku, frame: Frame): void {
        for (let y = 0; y < sudoku.size; y++) {
            for (let x = 0; x < sudoku.size; x++) {
                let cell = frame.getCell(y, x);

                if (this.doRemoveAllCellClasses) {
                    cell.removeAllCellClasses();
                }

                if (this.doRemoveBackgroundTextsBackgroundColor) {
                    cell.removeTextsBackgroundColor();
                }

                cell.removeCellClass("not-in-task");
                if (this.doRenderNumbers) {
                    let index = y * sudoku.size + x;
                    cell.setText(this.binaryToCharacters(state.board[index], sudoku.fullBinary));

                    if (this.doDifferentiateTaskBigNumber) {
                        let binary = state.board[index];
                        let taskBinary = state.sudoku.task.board[index];
                        if (BinaryUtils.has1bit32(binary) && ! BinaryUtils.has1bit32(taskBinary)) {
                            cell.addCellClass("not-in-task");
                        }
                    }
                }

                if (this.doRenderCellBorders) {
                    cell.setBorder(this.cellBordersStyle, Cell.DIRECTIONS.all);
                }

                if (this.doRenderBackgroundColor) {
                    cell.setBackgroundColor(this.backgroundColor);
                }
            }
        }

        let regionsMatrix = this.doRenderRegions ? sudoku.regions.getRegionsMatrix() : ArrayUtils.createArray1d(sudoku.size * sudoku.size, 0);
        for (let y = 0; y < sudoku.size; y++) {
            for (let x = 0; x < sudoku.size; x++) {
                let borderDirections = 0;
                for (let dir = 0; dir < PositionUtils.DIRECTIONS_4.length; dir++) {
                    let direction = PositionUtils.DIRECTIONS_4[dir];
                    if (! PositionUtils.areMatrixValuesSame(sudoku.size, sudoku.size, y, x, y + direction.y, x + direction.x, regionsMatrix)) {
                        borderDirections |= 1 << dir;
                    }
                }
                let cell = frame.getCell(y, x);
                cell.setBorder(this.regionBordersStyle, borderDirections);
            }
        }
    }

    private renderDiagonals(sudoku: Sudoku, frame: Frame): void {
        if (this.doRenderDiagonals) {
            for (let diagonal of sudoku.regions.diagonals) {
                frame.canvas.addLine1d(diagonal, this.diagonalsLineStyle, 0, 0, sudoku.size);
            }
        }
    }

    private renderExtraRegions(sudoku: Sudoku, frame: Frame): void {
        let regionsMatrix = PositionUtils.regionsToMatrix(sudoku.size * sudoku.size, sudoku.regions.extraRegions);
        if (this.doRenderExtraRegionsBackgroundColor) {
            for (let y = 0; y < sudoku.size; y++) {
                for (let x = 0; x < sudoku.size; x++) {
                    if (regionsMatrix[y * sudoku.size + x] !== -1) {
                        frame.getCell(y, x).setBackgroundColor(this.extraRegionsBackgroundColor);
                    }
                }
            }
        }
        if (this.doRenderExtraRegionsBorder) {
            let lines = PositionUtils.getRegionBorderLines(regionsMatrix, sudoku.size, sudoku.size);
            for (let line of lines) {
                frame.canvas.addBasketBorder(line, this.extraRegionsBorderStyle);
            }
        }
    }

    private renderEdgeVariant(sudoku: Sudoku, frame: Frame): void {
        if (this.doRenderEdgeVariant) {
            let variant = sudoku.getEdgeVariant()!;
            for (let [direction, y, x] of frame.edgeCoordinates) {
                let label = variant.board[direction][y][x];
                let labelStyle;
                if (label == -1) {
                    labelStyle = this.doRenderEdgeNone ? this.edgeNoneStyle : null;
                } else {
                    labelStyle = variant.labelStyle[label];
                }
                frame.getEdge(direction, y, x).addLabel(labelStyle);
            }
        }
    }

    /**
     * Render state inside already existing Frame.
     */
    public render(state: State, frame: Frame): void {
        frame.canvas.removeLines();
        frame.canvas.removeBasketBorders();

        this.renderBasic(state, state.sudoku, frame);
        if (state.sudoku.regions.hasDiagonals) {
            this.renderDiagonals(state.sudoku, frame);
        }
        if (state.sudoku.regions.hasExtraRegions()) {
            this.renderExtraRegions(state.sudoku, frame);
        }
        if (state.sudoku.hasEdgeVariant()) {
            this.renderEdgeVariant(state.sudoku, frame);
        }
        frame.update();
    }

    /**
     * Create new Frame and render state in it.
     */
    public renderNew(state: State, containerId: string = "container"): Frame {
        let frame = new Frame(state.sudoku.size, state.sudoku.size, 55, containerId);
        this.render(state, frame);
        return frame;
    }
}