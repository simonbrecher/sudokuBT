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
                case "perfect_match":       PerfectMatchingTest.mainGraphic();          break;
                case "perfectly_matchable": PerfectMatchingTest.perfectlyMatchable();   break;

                case "debug":               Debug.debug();                              break;
                case "ng_perfect_match":    PerfectMatchingTest.main();                 break;

                default: console.log(`unknown test type ${urlParams.get("test")}`);
            }
        } else {
            document.getElementById("test-menu-button")?.classList.add("display-none");
        }

        let now = (new Date()).getMilliseconds();
        console.log(`TIME: ${(now - then) / 1000}s`);
    }

    public static debug(): void {
        // let edges = [[2, 4], [1, 2, 4], [1, 4], [0, 1, 2, 3, 4], [0, 1, 2, 3, 4]];
        // let matched = [2, 4, 1, 0, 3];
        // // @ts-ignore
        // let graph = PerfectMatching.getMatchableEdgesGraph(edges, matched);
        // console.log(graph);
        // // @ts-ignore
        // let components = PerfectMatching.getStronglyConnectedComponents(graph);
        // console.log(components);

        let graph2 = [[4], [2, 3, 5], [0, 1], [0], [3], [], []];
        // @ts-ignore
        let components2 = PerfectMatching.getStronglyConnectedComponents(graph2);
        console.log(graph2, components2);
    }
}
