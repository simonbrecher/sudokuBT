class Renderer {
    public static renderer: Renderer = new Renderer();

    constructor() {

    }

    /**
     * Convert binary representation of a cell to array of characters, that should be rendered in the cell.
     */
    private binaryToCharacters(binary: number, fullBinary: number): string | string[] {
        if (binary === 0) {
            return "!";
        } else if (binary === fullBinary) {
            return [];
        }

        let shifts = BinaryUtils.binaryToShifts32(binary);
        let characters = [];
        for (let shift of shifts) {
            characters.push(`${shift + 1}`);
        }
        return characters.length !== 1 ? characters : characters[0];
    }

    private renderBasic(state: State, sudoku: Sudoku, frame: Frame): void {
        for (let y = 0; y < sudoku.size; y++) {
            for (let x = 0; x < sudoku.size; x++) {
                let cell = frame.getCell(y, x);
                cell.setText(this.binaryToCharacters(state.board[y * sudoku.size + x], sudoku.fullBinary));
                cell.setBorder("normal", Cell.DIRECTIONS.all);
                cell.setBackgroundColor("#FFF");
            }
        }

        let regionsMatrix = sudoku.regions.getRegionsMatrix();
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
                cell.setBorder("strong", borderDirections);
            }
        }
    }

    private renderDiagonals(sudoku: Sudoku, frame: Frame): void {
        for (let diagonal of sudoku.regions.diagonals) {
            frame.canvas.addLine1d(diagonal, LineStyle.styles.diagonals, 0, 0, sudoku.size);
        }
    }

    /**
     * Render state inside already existing Frame.
     */
    public render(state: State, frame: Frame): void {
        this.renderBasic(state, state.sudoku, frame);
        if (state.sudoku.regions.hasDiagonals) {
            this.renderDiagonals(state.sudoku, frame);
        }
        frame.update();
    }

    /**
     * Create new Frame and render state in it.
     */
    public renderNew(state: State, containerId: string = "container"): Frame {
        let frame = new Frame(state.sudoku.size, state.sudoku.size, 35, containerId);
        this.render(state, frame);
        return frame;
    }
}