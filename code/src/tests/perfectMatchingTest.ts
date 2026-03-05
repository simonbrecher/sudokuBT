class PerfectMatchingTest {
    /**
     * Create edges for random bipartite graph
     * @param size Number of vertices in each partition
     * @param probability Probability of edge between two vertices from different partitions
     * @return For each vertex in partition A, all vertices in partition B that have edge with it
     */
    private static createEdges(size: number, probability: number): number[][] {
        let edges = ArrayUtils.createArray2d(size, 0, undefined);
        for (let vertexA = 0; vertexA < size; vertexA++) {
            for (let vertexB = 0; vertexB < size; vertexB++) {
                if (Math.random() < probability) {
                    edges[vertexA].push(vertexB);
                }
            }
            ArrayUtils.shuffle1d(edges[vertexA]);
        }
        return edges;
    }

    /**
     * Check if matching is valid for bipartite graph
     * @param size Number of vertices in each partition
     * @param edges For each vertex in partition A, all vertices in partition B that have edge with it
     * @param matching For every vertex in partition A, vertex in partition B that has edge with it
     * @return True if the perfect matching is valid for the bipartite graph
     */
    private static checkPerfectMatching(size: number, edges: number[][], matching: number[]): boolean {
        if (matching.length !== size) {
            return false;
        }

        let already = ArrayUtils.createArray1d(size, false);
        for (let vertex of matching) {
            if (vertex < 0 || vertex >= size || vertex % 1 !== 0) {
                return false;
            }
            if (already[vertex]) {
                return false;
            }
            already[vertex] = true;
        }

        for (let i = 0; i < size; i++) {
            if (! edges[i].includes(matching[i])) {
                return false;
            }
        }
        return true;
    }

    /**
     * Check if given bipartite graph has any perfect matching recursively. (This is called by this.checkMatchingExists)
     * This method applies strategies Naked single and Hidden single.
     * If that does not help, then it recursively calls itself on guessing all of one cell's numbers.
     * @param size Number of vertices in each partition
     * @param depth Depth of recursive call
     * @param inputBinaries (inputBinaries[a] & 1 << b == 1) if vertex a in partition A and vertex b in partition B can be paired
     * @return True if given bipartite graph has any perfect matching
     */
    private static checkMatchingExistsRecursive(size: number, depth: number, inputBinaries: number[]): boolean {
        if (depth == size) {
            return true;
        }

        let binaries = ArrayUtils.deepcopyArray1d(inputBinaries);
        // @ts-ignore
        Solver.solver.solveRegionMaxOne(binaries);
        // @ts-ignore
        Solver.solver.solveRegionMinOne(binaries, BinaryUtils.createFullBinary(size));
        if (binaries.includes(0)) {
            return false;
        }

        let shifts = BinaryUtils.binaryToShifts32(binaries[depth]);
        for (let shift of shifts) {
            binaries[depth] = 1 << shift;
            if (this.checkMatchingExistsRecursive(size, depth + 1, binaries)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if given bipartite graph has any perfect matching.
     * @param size Number of vertices in each partition
     * @param edges For each vertex in partition A, all vertices in partition B that have edge with it
     * @return True if given bipartite graph has any perfect matching
     */
    private static checkMatchingExists(size: number, edges: number[][]): boolean {
        let binaries = ArrayUtils.createArray1d(size, 0);
        for (let vertexA = 0; vertexA < size; vertexA++) {
            for (let vertexB of edges[vertexA]) {
                binaries[vertexA] |= 1 << vertexB;
            }
        }
        return this.checkMatchingExistsRecursive(size, 0, binaries);
    }

    /**
     * Compare answer given by PerfectMatching.getPerfectMatching and truth (obtained by recursive method)
     * @param size Number of vertices in each partition
     * @param edges For each vertex in partition A, all vertices in partition B that have edge with it
     * @param matching null if no perfect matching exists, otherwise: For each vertex in partition A, vertex in partition B that it is matched with
     * @return True if method PerfectMatching.getPerfectMatching returned any valid perfect matching, or correctly said that none exists
     */
    private static checkMain(size: number, edges: number[][], matching: number[] | null): boolean {
        if (matching !== null) {
            return this.checkPerfectMatching(size, edges, matching);
        } else {
            return ! this.checkMatchingExists(size, edges);
        }
    }

    /**
     * Create multiple bipartite graphs.
     * For each of them test PerfectMatching.getPerfectMatching method against recursive method with exponential time complexity
     */
    public static main(): void {
        let sizes = ArrayUtils.range1d(2, 31.01, 1);
        let probabilities = ArrayUtils.range1d(0, 1.01, 0.05);
        let count = 50;
        console.log(`Count: ${sizes.length * probabilities.length * count}`);

        let okCount = 0;
        for (let size of sizes) {
            for (let probability of probabilities) {
                for (let i = 0; i < count; i++) {
                    let edges = this.createEdges(size, probability);
                    let matching = PerfectMatching.getPerfectMatching(edges);
                    let isOk = this.checkMain(size, edges, matching);
                    if (isOk) {
                        okCount ++;
                        if (okCount % 100 == 0) {
                            console.log("OK");
                        }
                    } else {
                        console.log(size, edges, matching);
                        throw "NOT OK";
                    }
                }
            }
        }
    }

    /**
     * Create multiple bipartite graphs.
     * For each of them run PerfectMatching.getPerfectMatching method and render result in a sudoku 2 first lines
     */
    public static mainGraphic(): void {
        let sizes = ArrayUtils.range1d(2, 15.01, 1);
        let probabilities = ArrayUtils.range1d(0, 1.01, 0.2);
        let count = 1;
        console.log(`Count: ${sizes.length * probabilities.length * count}`);

        for (let size of sizes) {
            for (let probability of probabilities) {
                for (let i = 0; i < count; i++) {
                    let edges = this.createEdges(size, probability);
                    let matching = PerfectMatching.getPerfectMatching(edges);
                    let sudoku = new Sudoku(size);
                    for (let i = 0; i < size; i++) {
                        sudoku.solution.board[i] = BinaryUtils.shiftsToBinary(edges[i]);
                        if (matching !== null) {
                            sudoku.solution.board[size + i] = 1 << matching[i];
                        }
                    }
                    Renderer.renderer.renderNew(sudoku.solution);
                }
            }
        }
    }

    private static perfectlyMatchableOne(edges: number[][]): void {
        let matchable = PerfectMatching.getPerfectlyMatchableEdges(edges);
        let size = edges.length;
        let sudoku = new Sudoku(size);
        for (let i = 0; i < size; i++) {
            sudoku.solution.board[i] = BinaryUtils.shiftsToBinary(edges[i]);
            if (matchable !== null) {
                sudoku.solution.board[size + i] = BinaryUtils.shiftsToBinary(matchable[i]);
            } else {
                sudoku.solution.board[size + i] = 0;
            }
        }
        Renderer.renderer.renderNew(sudoku.solution);
    }

    public static perfectlyMatchable(): void {
        let manual = [
            [[0, 1, 4], [1, 3, 4], [0, 1, 2, 3, 4, 5], [0, 1, 3], [0, 1, 2, 3, 4, 5], [3, 4]],
            [[1, 2, 4, 0], [0, 5], [0, 3], [1, 2, 4, 0, 3], [0, 3, 5], [1, 2, 4, 3]],
            [[1, 2, 4], [0, 5, 2], [0, 3], [1, 2, 4], [0, 3, 5], [1, 2, 4]],
        ]
        for (let m of manual) {
            this.perfectlyMatchableOne(m);
        }


        let sizes = ArrayUtils.range1d(2, 15.01, 1);
        let probabilities = ArrayUtils.range1d(0, 1.01, 0.2);
        let count = 1;
        console.log(`Count: ${sizes.length * probabilities.length * count}`);

        for (let size of sizes) {
            for (let probability of probabilities) {
                for (let i = 0; i < count; i++) {
                    let edges = this.createEdges(size, probability);
                    let permutation = ArrayUtils.getRandomPermutation(size);
                    for (let i = 0; i < size; i++) {
                        if (! edges[i].includes(permutation[i])) {
                            edges[i].push(permutation[i]);
                        }
                    }
                    this.perfectlyMatchableOne(edges);
                }
            }
        }
    }
}