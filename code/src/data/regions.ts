/**
 * Class representing list of all regions in sudoku. (Regions that use default sudoku rules)
 */
class Regions {
    private static throwAccessErrorIf(condition: boolean, accessName: string, conditionString: string): void {
        if (condition) {
            throw `ACCESS ERROR: cannot access ${accessName} if ${conditionString}`;
        }
    }

    private readonly sudoku: Sudoku;

    public hasLines: boolean = true;
    private readonly _rows: number[][];
    private readonly _columns: number[][];
    private readonly _lines: number[][];
    public get rows(): number[][] {
        Regions.throwAccessErrorIf(! this.hasLines, "Regions.rows", "! Regions.hasLines");
        return this._rows;
    }
    public get columns(): number[][] {
        Regions.throwAccessErrorIf(! this.hasLines, "Regions.columns", "! Regions.hasLines");
        return this._columns;
    }
    public get lines(): number[][] {
        Regions.throwAccessErrorIf(! this.hasLines, "Regions.lines", "! Regions.hasLines");
        return this._lines;
    }
    public hasDiagonals: boolean = false;
    private readonly _diagonals: number[][];
    public get diagonals(): number[][] {
        Regions.throwAccessErrorIf(! this.hasDiagonals, "Regions.diagonals", "! Regions.hasDiagonals");
        return this._diagonals;
    }
    private _rectangles: { height: number, width: number } | null = null;
    public isRectangular(): boolean {
        return this._rectangles !== null;
    }
    public get rectangleHeight(): number {
        Regions.throwAccessErrorIf(this._rectangles === null, "Regions.rectangleHeight", "Regions._rectangles === null");
        return this._rectangles!.height;
    }
    public get rectangleWidth(): number {
        Regions.throwAccessErrorIf(this._rectangles === null, "Regions.rectangleWidth", "Regions._rectangles === null");
        return this._rectangles!.width;
    }
    private _regions: number[][] | null = null;
    public hasRegions(): boolean {
        return this._regions !== null;
    }
    public get regions(): number[][] {
        Regions.throwAccessErrorIf(this._regions === null, "Regions.regions", "Regions._regions === null");
        return this._regions!;
    }
    private _extraRegions: number[][] | null = null;
    public hasExtraRegions(): boolean {
        return this._regions !== null;
    }
    public get extraRegions(): number[][] {
        Regions.throwAccessErrorIf(this._extraRegions === null, "Regions.extraRegions", "Regions._extraRegions === null");
        return this._extraRegions!;
    }

    constructor(sudoku: Sudoku) {
        this.sudoku = sudoku;

        this._rows = [];
        this._columns = [];
        this._lines = [];
        for (let y = 0; y < this.sudoku.size; y++) {
            let row = [];
            for (let x = 0; x < this.sudoku.size; x++) {
                row.push(y * this.sudoku.size + x);
            }
            this._rows.push(row);
            this._lines.push(row);
        }
        for (let x = 0; x < this.sudoku.size; x++) {
            let column = [];
            for (let y = 0; y < this.sudoku.size; y++) {
                column.push(y * this.sudoku.size + x);
            }
            this._columns.push(column);
            this._lines.push(column);
        }

        this._diagonals = [[], []];
        for (let i = 0; i < this.sudoku.size; i++) {
            this._diagonals[0].push(i * (this.sudoku.size + 1));
            this._diagonals[1].push(i * (this.sudoku.size + 1));
        }
    }

    /**
     * Set sudoku to have no regions
     */
    public setNoRegions(): void {
        this._regions = null;
        this._rectangles = null;
    }

    /**
     * Set regions to regions of rectangular sudoku
     * rectangleHeight and rectangleWidth cannot be 1 and must multiply to this.sudoku.size
     */
    public setRectangular(rectangleHeight: number, rectangleWidth: number): void {
        if (rectangleHeight === 1 || rectangleWidth === 1 || rectangleHeight * rectangleWidth !== this.sudoku.size) {
            throw `INVALID SIZE ERROR: setting Rectangles.rectangleHeight=${rectangleHeight} and Rectangles.rectangleWidth=${rectangleWidth}`;
        }
        this._rectangles = { height: rectangleHeight, width: rectangleWidth };
        this._regions = [];
        for (let startY = 0; startY < this.sudoku.size; startY+=rectangleHeight) {
            for (let startX = 0; startX < this.sudoku.size; startX+=rectangleWidth) {
                let rectangle = [];
                for (let y = startY; y < startY + rectangleHeight; y++) {
                    for (let x = startX; x < startX + rectangleWidth; x++) {
                        rectangle.push(y * this.sudoku.size + x);
                    }
                }
                this._regions.push(rectangle);
            }
        }
    }

    /**
     * Set regions to jigsaw regions.
     * @param regions array of regions. every regions has cells in format (y * this.sudoku.size + x)
     *      Regions must have size equal to this.sudoku.size, they must be on every cell exactly once, and they need to be edge-connected.
     */
    public setJigsaw(regions: number[][]): void { // TODO: check validity of regions
        this._rectangles = null
        this._regions = regions;
    }

    /**
     * For every cell, get index of region that is in that cell. If there is no region (sudoku has no regions), there will be -1.
     * On index (y * this.sudoku.size + x), there is index of region that has cell [y, x].
     */
    public getRegionsMatrix(): number[] {
        return PositionUtils.regionsToMatrix(this.sudoku.size * this.sudoku.size, this._regions ?? []);
    }
}