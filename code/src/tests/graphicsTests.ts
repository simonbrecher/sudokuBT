class GraphicsTests {
    /**
     * Test that these features of classes: Cell and Frame work
     * - create table
     * - change border width to "normal" and "strong"
     * - set text as one text or multiple texts
     * @param height Number of rows in table
     * @param width Number of columns in table
     * @param rectangleHeight Number of rows in one rectangle (bounded by strong border)
     * @param rectangleWidth Number of columns in one rectangle (bounded by strong border)
     * @return Frame object that was created by the test
     */
    public static testBasicGraphicOfCell(
        height: number, width: number, rectangleHeight: number, rectangleWidth: number
    ): Frame {
        let frame = new Frame(height, width, 35, "container");
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let cell = frame.getCell(y, x);
                cell.setBorder("normal", Cell.DIRECTIONS.all);
                if (y % rectangleHeight === 0) {
                    cell.setBorder("strong", Cell.DIRECTIONS.top);
                }
                if (y % rectangleHeight === rectangleHeight - 1) {
                    cell.setBorder("strong", Cell.DIRECTIONS.bottom);
                }
                if (x % rectangleWidth === 0) {
                    cell.setBorder("strong", Cell.DIRECTIONS.left);
                }
                if (x % rectangleWidth === rectangleWidth - 1) {
                    cell.setBorder("strong", Cell.DIRECTIONS.right);
                }
                if (y == x) {
                    cell.setText(`${y + 1}`);
                } else {
                    let texts = [];
                    for (let i = 0; i < x; i++) {
                        texts.push(`${i + 1}`);
                    }
                    cell.setText(texts);
                }
            }
        }
        frame.update();
        return frame;
    }

    /**
     * Test that frame-wrapper div is removed correctly when removing text from cell
     * This test is successful, if it does not create memory leaks
     */
    public static testTextWrapperRemoval(frame: Frame, repetitions: number): void {
        let cell = frame.getCell(0, 0);
        for (let i = 0; i < repetitions; i++) {
            cell.setText([]);
            cell.setText("1");
        }
    }
}