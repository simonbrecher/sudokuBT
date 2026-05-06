class Renderer {
    /**
     * Singleton that can be used if you do not want to create and store it
     */
    public static renderer: Renderer = new Renderer();

    /**
     * false - do not render any numbers into the Cell objects.
     */
    public doRenderNumbers: boolean = true;
        /**
         * true - color big numbers (there is one candidate) by blue instead of black,
         * if it is not in the Sudoku.task (it was added by solving)
         */
        public doDifferentiateTaskBigNumber: boolean = false;
        /**
         * true - do not render any numbers if all candidates are present (good for task)
         * false - render all candidates even if all are present (good for state while solving)
         */
        public doSmallNumbersOnFullBinary: boolean = false;
        /**
         * true - render all numbers as candidates
         * false - render cells with one candidate as big numbers
         */
        public doSmallNumbersOnOneNumber: boolean = false;
    /**
     * true - render this.backgroundColor into all cells
     */
    public doRenderBackgroundColor: boolean = true;
        /**
         * background color for cells
         */
        public backgroundColor: string = "#FFF";
    /**
     * true - render stronger border between cells that are in different regions
     * false - only render stronger borders on the edges of the Sudoku puzzle
     */
    public doRenderRegions: boolean = true;
        /**
         * CSS class for strong borders
         */
        public regionBordersStyle: string = "strong";
    /**
     * true - render thin border between all cells (before rendering strong border for regions)
     * false - do not render think border (does not influence rendering strong border for regions)
     */
    public doRenderCellBorders: boolean = true;
        /**
         * CSS class for thin borders
         */
        public cellBordersStyle: string = "normal";
    /**
     * false - do not render diagonal regions in Canvas
     */
    public doRenderDiagonals: boolean = true;
        /**
         * style of diagonal regions
         */
        public diagonalsLineStyle: LineStyle = { thickness: 0.2, color: "#0002", cap: "round" };
    /**
     * true - render the baskets around extra regions
     * false - do not render the baskets around extra regions (does not affect the background color of extra regions)
     */
    public doRenderExtraRegionsBorder: boolean = true;
        /**
         * style of basket's border
         */
        public extraRegionsBorderStyle: BasketBorderStyle = { color: "#0006", dash: null, cap: "round" };
    /**
     * true - render background color for extra regions
     * false - do not render background color for extra regions (does not affect the basket's border)
     */
    public doRenderExtraRegionsBackgroundColor: boolean = true;
        /**
         * background color of extra regions
         */
        public extraRegionsBackgroundColor: string = "#DDD";
    /**
     * false - do not render edge labels for the Edge variant
     */
    public doRenderEdgeVariant: boolean = true;
        /**
         * false - if the style of edge label is null, remove Edge.labelElement
         * true - if the style of edge label is null, set the style of Edge.labelElement to this.edgeNoneStyle
         */
        public doRenderEdgeNone: boolean = true;
        /**
         * style used for edge label with style null
         */
        public edgeNoneStyle: EdgeLabelStyle = { css: ["none"] };
    /**
     * true - at the beginning remove background color of all characters that were added before
     */
    public doRemoveBackgroundTextsBackgroundColor: boolean = true;
    /**
     * true - at the beginning remove all cell classes added by Cell.addCellClass() before
     */
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

    /**
     * Render graphical elements that belong to a Sudoku with just jigsaw regions.
     * @param state The State to render
     * @param sudoku Sudoku object of the state
     * @param frame Frame object to render the Sudoku into
     */
    private renderBasic(state: State, sudoku: Sudoku, frame: Frame): void {
        for (let y = 0; y < sudoku.size; y++) {
            for (let x = 0; x < sudoku.size; x++) {
                let cell = frame.getCell(y, x);

                // remove all classes added by Cell.addCellClass()
                if (this.doRemoveAllCellClasses) {
                    cell.removeAllCellClasses();
                }

                // remove all background color behind single characters (candidate numbers)
                if (this.doRemoveBackgroundTextsBackgroundColor) {
                    cell.removeTextsBackgroundColor();
                }

                // render numbers
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

                // render borders around all cells, (not the strong borders used to differentiate jigsaw regions yet)
                if (this.doRenderCellBorders) {
                    cell.setBorder(this.cellBordersStyle, Cell.DIRECTIONS.all);
                }

                // render background color behind the whole cell
                if (this.doRenderBackgroundColor) {
                    cell.setBackgroundColor(this.backgroundColor);
                }
            }
        }

        // render strong borders around jigsaw regions
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

    /**
     * Render diagonal regions.
     * @param sudoku Sudoku object of the state
     * @param frame Frame object to render the Sudoku into
     */
    private renderDiagonals(sudoku: Sudoku, frame: Frame): void {
        if (this.doRenderDiagonals) {
            for (let diagonal of sudoku.regions.diagonals) {
                frame.canvas.addLine1d(diagonal, this.diagonalsLineStyle, 0, 0, sudoku.size);
            }
        }
    }

    /**
     * Render extra regions.
     * @param sudoku Sudoku object of the state
     * @param frame Frame object to render the Sudoku into
     */
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

    /**
     * Render labels of the EdgeVariant regions.
     * @param sudoku Sudoku object of the state
     * @param frame Frame object to render the Sudoku into
     */
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
                frame.getEdge(direction, y, x).setLabel(labelStyle);
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