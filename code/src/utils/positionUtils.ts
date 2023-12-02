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
     * Does opposite to what method PositionUtils.regionsToMatrix() does
     */
    public static matrixToRegions(matrix: number[]): number[][] {
        let regions = ArrayUtils.createArray2d(Math.max(...matrix) + 1, 0, null);
        for (let i = 0; i < matrix.length; i++) {
            if (matrix[i] !== -1) {
                regions[matrix[i]].push([i]);
            }
        }
        return regions;
    }

    /**
     * Convert regions matrix into regions matrix where every region is one area of connectivity.
     * Indexes have ids 0, 1 ... ; -1 is value for no region
     */
    public static countConnectedAreas(matrix: number[], height: number, width: number, directions: { y: number, x: number }[]): number[] {
        let output = ArrayUtils.createArray1d(height * width, -1);
        let regionIndex = 0;
        for (let startY = 0; startY < height; startY++) {
            for (let startX = 0; startX < width; startX++) {
                if (matrix[startY * width + startX] !== -1 && output[startY * width + startX] === -1) {
                    let stack = [{ y: startY, x: startX }];
                    while (stack.length > 0) {
                        let start = stack.pop();
                        let startIndex = start!.y * width + start!.x;
                        if (output[startIndex] === -1) {
                            output[startIndex] = regionIndex;
                            for (let direction of directions) {
                                let next = { y: start!.y + direction.y, x: start!.x + direction.x };
                                let nextIndex = next.y * width + next.x;
                                if (PositionUtils.isInside(next.y, next.x, height, width) && matrix[startIndex] === matrix[nextIndex]) {
                                    stack.push(next);
                                }
                            }
                        }
                    }
                    regionIndex ++;
                }
            }
        }
        return output;
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