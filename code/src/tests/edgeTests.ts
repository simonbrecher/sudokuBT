class EdgeTests {
    public static testEdgeConnection(): void {
        let rectangleHeight = 3;
        let rectangleWidth = 3;
        let size = rectangleHeight * rectangleWidth;
        let sudoku = new Sudoku(size);
        sudoku.regions.setRectangular(rectangleHeight, rectangleWidth);
        sudoku.setEdgeVariant(EdgeVariantFactory.variants.sum)
        let variant = sudoku.getEdgeVariant()!;

        // @ts-ignore
        let labelCells = EdgeStrategy.getLabelCells(sudoku);

        for (let [direction, y, x, , ] of labelCells) {
            variant.board[direction][y][x] = 0;
        }

        // @ts-ignore
        let cellNeighbours = EdgeStrategy.getCellNeighbours(sudoku, variant, labelCells);

        console.log(labelCells, cellNeighbours);
    }
}