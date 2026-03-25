class EdgeTests {
    public static testEdgeConnection(): void {
        let rectangleHeight = 5;
        let rectangleWidth = 5;
        let size = rectangleHeight * rectangleWidth;
        let sudoku = new Sudoku(size);
        sudoku.regions.setRectangular(rectangleHeight, rectangleWidth);

        // @ts-ignore
        let labelRegions = EdgeStrategy.getLabelCells(sudoku);

        console.log(labelRegions);
    }
}