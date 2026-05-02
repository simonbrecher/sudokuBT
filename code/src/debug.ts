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
                case "debug":               Debug.debug();                              break;

                default: console.log(`unknown test type ${urlParams.get("test")}`);
            }
        } else {
            document.getElementById("test-menu-button")?.classList.add("display-none");
        }

        let now = (new Date()).getMilliseconds();
        console.log(`TIME: ${(now - then) / 1000}s`);
    }

    public static debug(): void {
        for (let i = 1; i < 6; i++) {
            // @ts-ignore
            console.log(SudokuStrategy.getMessageNakedHidden(true, i));
            // @ts-ignore
            console.log(SudokuStrategy.getMessageNakedHidden(false, i));
        }
    }
}
