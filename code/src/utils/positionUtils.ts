class PositionUtils {
    public static readonly DIRECTIONS_4 = [{ y: -1, x: 0 }, { y: 1, x: 0 }, { y: 0, x: -1 }, { y: 0, x: 1 }];

    /**
     * Check if index [y, x] is inside array (height * width)
     */
    public static isInside(y: number, x: number, height: number, width: number): boolean {
        return y >= 0 && y < height && x >= 0 && x < width;
    }

    /**
     * Count for every cell, what region has that cell.
     * @param length Number of cells in sudoku
     * @param regions List of sudoku regions, values are equal to (y * sudoku.size + x)
     * @return 1d array where on index (y * sudoku.size + x) there is the index of region that has cell (y, x).
     *      If there is no such region, then there will be -1.
     *      If there is multiple such regions, then there will be the highest index from them.
     */
    public static regionsToMatrix(length: number, regions: number[][]): number[] {
        let matrix = ArrayUtils.createArray1d(length, -1);
        for (let i = 0; i < regions.length; i++) {
            for (let j = 0; j < regions[i].length; j++) {
                matrix[regions[i][j]] = i;
            }
        }
        return matrix;
    }

    /**
     * return if value in matrix on positions (y1 * width + x1) and (y2 * width + x2) is same
     * (y1 * width + x1) MUST BE INSIDE THE MATRIX.
     * return false if (y2 * width + x2) is outside the matrix
     * value for cell [y, x] is saved on index (y * width + x)
     */
    public static areMatrixValuesSame(height: number, width: number, y1: number, x1: number, y2: number, x2: number, matrix: number[]): boolean {
        return this.isInside(y2, x2, height, width) && matrix[y1 * width + x1] === matrix[y2 * width + x2];
    }
}