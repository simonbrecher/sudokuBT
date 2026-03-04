class PerfectMatching {
    /**
     * Uses bfs to construct the tree used by dfs in one iteration of Hopcroft–Karp algorithm.
     * The tree starts with unmatched vertices from partition A and ends with unmatched vertices from partition B.
     * Odd layers of edges are unmatched and even layers of edges are matched.
     * @param edges For each vertex from partition A, all adjacent vertices from partition B.
     * @param matched For each vertex from partition B: null if it is unmatched, otherwise index of the matched neighbour from partition A.
     * @return  start: Array of unmatched vertices from partition A ;
     *          edges: For each vertex from partition A array of vertices from partition B where dfs can go.
     */
    private static bfs(edges: number[][], matched: (number | null)[]): { start: number[], edges: number[][] } {
        let size = edges.length;

        // find all unmatched vertices from partition A (start vertices)
        let isUnmatched = ArrayUtils.createArray1d(size, true);
        for (let i = 0; i < size; i++) {
            let match = matched[i];
            if (match !== null) {
                isUnmatched[match] = false;
            }
        }
        let start = [];
        for (let i = 0; i < size; i++) {
            if (isUnmatched[i]) {
                start.push(i);
            }
        }

        // find all unmatched edges from partition A to partition B, that can be searched by dfs
        let outputEdges = ArrayUtils.createArray2d(size, 0, undefined);
        let currentVertices = ArrayUtils.deepcopyArray1d(start); // Array of all vertices from partition A, that are in the current layer.
        let isSearched = ArrayUtils.createArray1d(size, false); // For each vertex from partition B, if it was found already.
        let end = false;
        while (! end) {
            let verticesFound = []; // Array of all vertices from partition B, that were found in this layer.
            let nextVertices = []; // Array of all vertices from partition A, that are in the next layer.
            for (let vertexA of currentVertices) {
                for (let vertexB of edges[vertexA]) {
                    if (! isSearched[vertexB]) {
                        verticesFound.push(vertexB);
                        outputEdges[vertexA].push(vertexB);
                        let nextVertexA = matched[vertexB];
                        if (nextVertexA === null) {
                            end = true;
                        } else {
                            nextVertices.push(nextVertexA);
                        }
                    }
                }
            }
            currentVertices = nextVertices;
            for (let vertexFound of verticesFound) {
                isSearched[vertexFound] = true;
            }
            if (currentVertices.length === 0) {
                end = true;
            }
        }

        return { start: start, edges: outputEdges };
    }

    /**
     * Recursive method for this.dfs() ;
     * @param path Current path taken by dfs. Format [a1, b1, a2, b2 ...]
     * @param edges For each vertex from partition A, array of vertices from partition B that it has an edge to.
     * @param matched For each vertex from partition B, index of vertex from partition A that is matched to it, or null if it is unmatched.
     * @param isSearched For each vertex from partition B: true if it was found by dfs before.
     * @return Augmenting path in format [a1, b1, a2, b2 ...] or null if none was found.
     */
    private static dfsRecursive(path: number[], edges: number[][], matched: (number | null)[], isSearched: boolean[]): number[] | null {
        let vertexA = path[path.length - 1];
        for (let vertexB of edges[vertexA]) {
            if (! isSearched[vertexB]) {
                isSearched[vertexB] = true;
                path.push(vertexB);
                let nextVertexA = matched[vertexB];
                if (nextVertexA === null) {
                    return path;
                } else {
                    path.push(nextVertexA);
                    let result = this.dfsRecursive(path, edges, matched, isSearched);
                    if (result !== null) {
                        return result;
                    }
                    path.pop();
                }
                path.pop();
            }
        }
        return null;
    }

    /**
     * Uses dfs to search through the tree created by bfs in one iteration of Hopcroft-Karp algoritm.
     * @param start Array of unmatched vertices from partition A.
     * @param edges For each vertex from partition A, array of vertices from partition B that it has an edge to. Both matched and unmatched.
     * @param matched For each vertex from partition B, index of vertex from partition A that is matched to it, or null if it is unmatched.
     * @return  Maximal set of smallest augmenting paths ;
     *          Format [a1, b1, a2, b2 ...] for augmenting path with edges [(a1, b1), (b1, a2), (a2, b2), ...],
     */
    private static dfs(start: number[], edges: number[][], matched: (number | null)[]): number[][] {
        let size = edges.length;

        let paths: number[][] = [];
        let isSearched = ArrayUtils.createArray1d(size, false); // For each vertex from partition B, if it was already searched.
        for (let vertex of start) {
            let path = this.dfsRecursive([vertex], edges, matched, isSearched);
            if (path !== null) {
                paths.push(path);
            }
        }
        return paths;
    }

    /**
     * Uses Hopcroft-Karp algorithm to find a maximum matching in bipartite graph if any exists.
     * @param edges For each vertex from partition A, indices of all vertices from partition B that it has an edge to ;
     *              Vertices in each partition have indices from 0 to (n - 1) where n is number of vertices in each partition.
     * @return For each vertex in partition A, vertex in partition B that it is matched with (null for unmatched vertices)
     */
    public static getMaximumMatching(edges: number[][]): (number | null)[] {
        let size = edges.length;

        let matched = ArrayUtils.createArray1d(edges.length, null);
        while (true) {
            // find augmenting paths
            let tree = this.bfs(edges, matched);
            let paths = this.dfs(tree.start, tree.edges, matched);
            if (paths.length === 0) {
                // return imperfect maximum matching
                return matched;
            }

            // apply augmenting paths
            for (let path of paths) {
                for (let startIndex = 0; startIndex < path.length; startIndex += 2) {
                    matched[path[startIndex + 1]] = path[startIndex];
                }
            }

            // return perfect matching
            if (! matched.includes(null)) {
                let matching = ArrayUtils.createArray1d(size, undefined);
                for (let i = 0; i < size; i++) {
                    matching[matched[i]] = i;
                }
                return matching;
            }
        }
    }

    /**
     * Uses Hopcroft-Karp algorithm to find a perfect matching in bipartite graph if any exists.
     * First gets maximum matching, then checks if it is perfect.
     * @param edges For each vertex from partition A, indices of all vertices from partition B that it has an edge to ;
     *              Vertices in each partition have indices from 0 to (n - 1) where n is number of vertices in each partition.
     * @return null if no perfect matching exists, otherwise: For each vertex in partition A, vertex in partition B that it is matched with
     */
    public static getPerfectMatching(edges: number[][]): number[] | null {
        let matched = this.getMaximumMatching(edges);
        if (matched.includes(null)) {
            return null;
        } else {
            return <number[]>matched;
        }
    }

    /**
     * Change indices for vertices in partite B so P(a) has same index as a.
     * @param edges  For each vertex from partition A, indices of all vertices from partition B that it has an edge to ;
     *               Vertices in each partition have indices from 0 to (n - 1) where n is number of vertices in each partition.
     * @param matched For each vertex from partition A, perfectly matched vertex from partition B.
     * @return edges with changed indices.
     */
    private static orderEdgesByPerfectMatching(edges: number[][], matched: number[]): number[][] {
        let invertedMatching = ArrayUtils.invertArray1d(matched);
        let ordered: number[][] = [];
        for (let i = 0; i < edges.length; i++) {
            ordered.push([]);
            for (let j = 0; j < edges[i].length; j++) {
                ordered[i].push(invertedMatching[edges[i][j]]);
            }
        }
        return ordered;
    }

    /**
     * For bipartite graph and perfect matching, create oriented graph that is used to find all perfectly matched edges.
     * First change indices of vertices in partition B so matched[i] = i, then remove i from edges[i].
     * @param edges For each vertex from partition A, list of all connected vertices from partition B.
     * @param matched For each vertex from partition A, perfectly matched vertex from partition B.
     * @return For each vertex list of connected vertices.
     */
    private static getMatchableEdgesGraph(edges: number[][], matched: number[]): number[][] {
        let orderedEdges = PerfectMatching.orderEdgesByPerfectMatching(edges, matched);
        let output = [];
        for (let i = 0; i < orderedEdges.length; i++) {
            output.push(ArrayUtils.removeValue(orderedEdges[i], i));
        }
        return output;
    }

    /**
     * Recursive function for tarjan's algorithm for strongly connected components of oriented graph.
     */
    private static getStronglyConnectedComponentsRecursive(
        edges: number[][],
        stack: number[], isOnStack: boolean[], nodeIndex: (number | null)[], nodeLow: (number | null)[],
        v: number, index: number,
        components: number[][]
    ): number {
        nodeIndex[v] = index;
        nodeLow[v] = index;

        index += 1;
        stack.push(v);
        isOnStack[v] = true;

        for (let v2 of edges[v]) {
            if (nodeIndex[v2] === null) {
                this.getStronglyConnectedComponentsRecursive(edges, stack, isOnStack, nodeIndex, nodeLow, v2, index, components);
                //@ts-ignore
                if (nodeLow[v2] < nodeLow[v]) {
                    nodeLow[v] = nodeLow[v2];
                }
            } else if (isOnStack[v2]) {
                //@ts-ignore
                if (nodeIndex[v2] < nodeLow[v]) {
                    nodeLow[v] = nodeIndex[v2];
                }
            }
        }

        if (nodeLow[v] == nodeIndex[v]) {
            let component: number[] = [];
            let v2 = null;
            while (v2 !== v) {
                if (stack.length == 0) {
                    throw "STACK IS EMPTY";
                }
                v2 = <number>stack.pop();
                isOnStack[v2] = false;
                component.push(v2);
            }
            components.push(component);
        }

        return index;
    }

    /**
     * Tarjan's algorithm for strongly connected components.
     */
    private static getStronglyConnectedComponents(edges: number[][]): number[] {
        let stack: number[] = [];
        let isOnStack: boolean[] = ArrayUtils.createArray1d(edges.length, false);
        let nodeIndex = ArrayUtils.createArray1d(edges.length, null);
        let nodeLow = ArrayUtils.createArray1d(edges.length, null);
        let index = 0;
        let components: number[][] = [];

        for (let v = 0; v < edges.length; v++) {
            if (nodeIndex[v] === null) {
                index = this.getStronglyConnectedComponentsRecursive(edges, stack, isOnStack, nodeIndex, nodeLow, v, index, components);
            }
        }

        let output = ArrayUtils.createArray1d(edges.length, null);
        for (let i = 0; i < components.length; i++) {
            for (let v of components[i]) {
                output[v] = i;
            }
        }
        return output;
    }

    /**
     * Return all perfectly matchable edges in a graph.
     * If there is no perfect matching, return null.
     */
    public static getPerfectlyMatchableEdges(edges: number[][]): number[][] | null {
        // get a perfect matching
        let matched = this.getPerfectMatching(edges);
        if (matched === null) {
            return null;
        }

        // get graph used to calculate all perfectly matchable edges and its components of strong connectivity
        let graph = this.getMatchableEdgesGraph(edges, matched);
        let components = this.getStronglyConnectedComponents(graph);

        // inverse of perfect matching
        let invertedMatched = ArrayUtils.invertArray1d(matched);

        // get all perfectly matchable edges
        let matchable: number[][] = [];
        for (let i = 0; i < edges.length; i++) {
            let add: number[] = [];
            for (let j = 0; j < edges[i].length; j++) {
                let a = i;
                let b = invertedMatched[edges[i][j]];
                if (components[a] == components[b]) {
                    add.push(edges[i][j]);
                }
            }
            matchable.push(add);
        }

        return matchable;
    }
}