class Debug {
    /**
     * This method is called by <script><script/> in debug.html
     */
    public static main(): void {
        let then = (new Date()).getMilliseconds();

        // let frame = GraphicsTests.testBasicGraphicOfCell(10, 9, 2, 3);
        // GraphicsTests.testTextWrapperRemoval(frame, 10*/*00*/1000);

        // GraphicsTests.testRegionsClass();

        // GraphicsTests.testSolver();
        // GraphicsTests.testBuildSolution();
        // GraphicsTests.testBuildTask();

        GraphicsTests.testCanvas();
        GraphicsTests.testBasketBorders();

        let now = (new Date()).getMilliseconds();
        console.log(`TIME: ${(now - then) / 1000}s`);
    }
}
