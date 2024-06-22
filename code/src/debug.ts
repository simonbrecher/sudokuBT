class Debug {
    /**
     * This method is called by <script><script/> in debug.html
     */
    public static main(): void {
        let then = (new Date()).getMilliseconds();

        const urlParams = new URLSearchParams(window.location.search);

        if (urlParams.has("test")) {
            document.getElementById("test-types")?.classList.add("display-none");
            switch(urlParams.get("test")) {
                case "region_class":        GraphicsTests.testRegionsClass();           break;
                case "builder_solution":    GraphicsTests.testSolver();                 break;
                case "builder_task":        GraphicsTests.testBuildSolution();          break;
                case "canvas":              GraphicsTests.testCanvas();                 break;
                case "basket_borders":      GraphicsTests.testBasketBorders();          break;
                case "background_color":    GraphicsTests.testTextBackgroundColor();    break;

                case "naked_single":        StrategyTests.testNakedSingle();            break;
                case "hidden_single":       StrategyTests.testHiddenSingle();           break;
                case "perfect_matching":    ;        break;

                case "ng_perfect_match":    PerfectMatchingTest.main();                 break;
            }
        } else {
            document.getElementById("test-menu-button")?.classList.add("display-none");
        }

        let now = (new Date()).getMilliseconds();
        console.log(`TIME: ${(now - then) / 1000}s`);
    }
}
