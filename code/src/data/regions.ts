/**
 * Class representing list of all regions in sudoku. (Regions that use default sudoku rules)
 */
class Regions {
    private static readonly WINDOKU_REGIONS = [
        [10, 11, 12, 19, 20, 21, 28, 29, 30],
        [14, 15, 16, 23, 24, 25, 32, 33, 34],
        [46, 47, 48, 55, 56, 57, 64, 65, 66],
        [50, 51, 52, 59, 60, 61, 68, 69, 70],
    ];
    private static readonly WINDOKU_REGIONS_MATRIX = PositionUtils.regionsToMatrix(81, this.WINDOKU_REGIONS);

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
        return this.hasLines ? this._rows : [];
    }
    public get columns(): number[][] {
        return this.hasLines ? this._columns : [];
    }
    public get lines(): number[][] {
        return this.hasLines ? this._lines : [];
    }
    public hasDiagonals: boolean = false;
    private readonly _diagonals: number[][];
    public get diagonals(): number[][] {
        return this.hasDiagonals ? this._diagonals : [];
    }
    private _rectangles: { height: number, width: number } | null = null;
    public isRectangular(): boolean {
        return this._regions !== null && this._rectangles !== null;
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
        return this._regions !== null ? this._regions! : [];
    }
    private _extraRegions: number[][] | null = null;
    public hasExtraRegions(): boolean {
        return this._extraRegions !== null;
    }
    public get extraRegions(): number[][] {
        return this._extraRegions !== null ? this._extraRegions! : [];
    }
    public removeExtraRegions(): void {
        this._extraRegions = null;
    }
    public addExtraRegions(regions: number[][]): void {
        if (this._extraRegions === null) {
            this._extraRegions = [];
        }
        for (let region of regions) { // TODO: validate this
            this._extraRegions.push(region);
        }
    }
    public setExtraRegions(regions: number[][] | null): void {
        this._extraRegions = null;
        if (regions !== null) {
            this.addExtraRegions(regions);
        }
    }
    public isWindoku(): boolean {
        if (this.sudoku.size !== 9 || ! this.sudoku.regions.hasExtraRegions()) {
            return false;
        }
        let regionsMatrix = PositionUtils.regionsToMatrix(81, this.sudoku.regions.extraRegions);
        regionsMatrix = PositionUtils.countConnectedAreas(regionsMatrix, this.sudoku.size, this.sudoku.size, PositionUtils.DIRECTIONS_4);
        return ArrayUtils.equals1d(regionsMatrix, Regions.WINDOKU_REGIONS_MATRIX);
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
            this._diagonals[1].push((i + 1) * (this.sudoku.size - 1));
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
     * Set extra regions to be windoku. Works only if size=9
     */
    public setWindoku(): void {
        if (this.sudoku.size !== 9) {
            throw `ERROR: Windoku sudoku cannot exist on size=${this.sudoku.size}`;
        }

        this.sudoku.regions.setExtraRegions(Regions.WINDOKU_REGIONS);
    }

    /**
     * For every cell, get index of region that is in that cell. If there is no region (sudoku has no regions), there will be -1.
     * On index (y * this.sudoku.size + x), there is index of region that has cell [y, x].
     */
    public getRegionsMatrix(): number[] {
        return PositionUtils.regionsToMatrix(this.sudoku.size * this.sudoku.size, this._regions ?? []);
    }

    /**
     * Get array of all regions. It is possible to choose only some types.
     */
    public getAllRegions(rows: boolean, columns: boolean, regions: boolean, diagonals: boolean, extraRegions: boolean): number[][] {
        let output: number[][] = [];
        if (this.hasLines) {
            if (rows) {
                ArrayUtils.add1d(output, this._rows);
            }
            if (columns) {
                ArrayUtils.add1d(output, this._columns);
            }
        }
        if (this.hasRegions() && regions) {
            ArrayUtils.add1d(output, this._regions!);
        }
        if (this.hasDiagonals && diagonals) {
            ArrayUtils.add1d(output, this._diagonals);
        }
        if (this.hasExtraRegions() && extraRegions) {
            ArrayUtils.add1d(output, this._extraRegions!);
        }
        return output;
    }

    /**
     * Add jigsaw regions by text, for example: ["0011", "0012", "3312", "3322"]
     */
    public setRegionsByText(text: string[]): void { // TODO: validate correctness
        let regions = ArrayUtils.createArray2d(this.sudoku.size, 0, undefined);
        for (let y = 0; y < this.sudoku.size; y++) {
            for (let x = 0; x < this.sudoku.size; x++) {
                regions[parseInt(text[y][x])].push(y * this.sudoku.size + x);
            }
        }
        this.setJigsaw(regions);
    }
}