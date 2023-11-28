class Renderer {
    public static renderer: Renderer = new Renderer();

    constructor() {

    }

    private renderBasic(sudoku: Sudoku, frame: Frame): void {
        for (let y = 0; y < sudoku.size; y++) {
            for (let x = 0; x < sudoku.size; x++) {
                let cell = frame.getCell(y, x);
                cell.setBorder("normal", Cell.DIRECTIONS.all);
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

    public render(sudoku: Sudoku, frame: Frame): void {
        this.renderBasic(sudoku, frame);
    }
}