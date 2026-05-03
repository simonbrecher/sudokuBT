/**
 * Class representing list of all regions in sudoku. (Regions that use default sudoku rules)
 */
class Regions {
    private static throwAccessErrorIf(condition: boolean, accessName: string, conditionString: string): void {
        if (condition) {
            throw `ACCESS ERROR: cannot access ${accessName} if ${conditionString}`;
        }
    }

    private readonly size: number;

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

    constructor(size: number) {
        this.size = size;
        this._rows = [];
        this._columns = [];
        this._lines = [];
        for (let y = 0; y < this.size; y++) {
            let row = [];
            for (let x = 0; x < this.size; x++) {
                row.push(y * this.size + x);
            }
            this._rows.push(row);
            this._lines.push(row);
        }
        for (let x = 0; x < this.size; x++) {
            let column = [];
            for (let y = 0; y < this.size; y++) {
                column.push(y * this.size + x);
            }
            this._columns.push(column);
            this._lines.push(column);
        }

        this._diagonals = [[], []];
        for (let i = 0; i < this.size; i++) {
            this._diagonals[0].push(i * (this.size + 1));
            this._diagonals[1].push((i + 1) * (this.size - 1));
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
     * rectangleHeight and rectangleWidth cannot be 1 and must multiply to this.size
     */
    public setRectangular(rectangleHeight: number, rectangleWidth: number): void {
        if (rectangleHeight === 1 || rectangleWidth === 1 || rectangleHeight * rectangleWidth !== this.size) {
            throw `INVALID SIZE ERROR: setting Rectangles.rectangleHeight=${rectangleHeight} and Rectangles.rectangleWidth=${rectangleWidth}`;
        }
        this._rectangles = { height: rectangleHeight, width: rectangleWidth };
        this._regions = [];
        for (let startY = 0; startY < this.size; startY+=rectangleHeight) {
            for (let startX = 0; startX < this.size; startX+=rectangleWidth) {
                let rectangle = [];
                for (let y = startY; y < startY + rectangleHeight; y++) {
                    for (let x = startX; x < startX + rectangleWidth; x++) {
                        rectangle.push(y * this.size + x);
                    }
                }
                this._regions.push(rectangle);
            }
        }
    }

    /**
     * Set regions to jigsaw regions.
     * @param regions array of regions. every regions has cells in format (y * this.size + x)
     *      Regions must have size equal to this.size, they must be on every cell exactly once, and they need to be edge-connected.
     */
    public setJigsaw(regions: number[][]): void { // TODO: check validity of regions
        this._rectangles = null
        this._regions = regions;
    }

    public static isValidWindokuSize(size: number): boolean {
        return size >= 4 && Number.isInteger(Math.sqrt(size));
    }

    private getWindokuRegions(): number[][] {
        let regions: number[][] = [];
        let size = Math.sqrt(this.size);
        for (let ry = 0; ry < size - 1; ry++) {
            for (let rx = 0; rx < size - 1; rx++) {
                let region: number[] = [];
                for (let dy = 0; dy < size; dy++) {
                    for (let dx = 0; dx < size; dx++) {
                        let y = ry * (size + 1) + dy + 1;
                        let x = rx * (size + 1) + dx + 1;
                        region.push(y * this.size + x);
                    }
                }
                regions.push(region);
            }
        }
        return regions;
    }

    public isWindoku(): boolean {
        if (! Regions.isValidWindokuSize(this.size) || ! this.hasExtraRegions()) {
            return false;
        }

        let regionsMatrix = PositionUtils.regionsToMatrix(this.size * this.size, this.extraRegions);
        regionsMatrix = PositionUtils.countConnectedAreas(regionsMatrix, this.size, this.size, PositionUtils.DIRECTIONS_4);

        let windokuRegionsMatrix = PositionUtils.regionsToMatrix(this.size * this.size, this.getWindokuRegions());
        windokuRegionsMatrix = PositionUtils.countConnectedAreas(windokuRegionsMatrix, this.size, this.size, PositionUtils.DIRECTIONS_4);

        return ArrayUtils.equals1d(regionsMatrix, windokuRegionsMatrix);
    }

    public setWindoku(): void {
        if (! Regions.isValidWindokuSize(this.size)) {
            throw `ERROR: Windoku sudoku cannot exist on size=${this.size}`;
        }

        this.setExtraRegions(this.getWindokuRegions());
    }

    /**
     * For every cell, get index of region that is in that cell. If there is no region (sudoku has no regions), there will be -1.
     * On index (y * this.size + x), there is index of region that has cell [y, x].
     */
    public getRegionsMatrix(): number[] {
        return PositionUtils.regionsToMatrix(this.size * this.size, this._regions ?? []);
    }

    /**
     * Get array of all regions. It is possible to choose only some types.
     */
    public getSomeRegions(rows: boolean, columns: boolean, regions: boolean, diagonals: boolean, extraRegions: boolean): number[][] {
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

    public getAllRegions(): number[][] {
        return this.getSomeRegions(true, true, true, true, true);
    }

    /**
     * Add jigsaw regions by text, for example: ["0011", "0012", "3312", "3322"]
     */
    public setRegionsByText(text: string[]): void { // TODO: validate correctness
        let regions = ArrayUtils.createArray2d(this.size, 0, undefined);
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                regions[parseInt(text[y][x])].push(y * this.size + x);
            }
        }
        this.setJigsaw(regions);
    }
}