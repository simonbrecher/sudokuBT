/**
 * Class managing graphics for one sudoku puzzle
 */
class Frame {
    /**
     * Number of rows in the grid
     */
    public readonly height: number;
    /**
     * Number of columns in the grid
     */
    public readonly width: number;

    /**
     * size of the <td> element in pixels
     */
    public readonly cellSize: number;

    /**
     * the <div> element wrapping the <table> and <canvas>es
     */
    public readonly puzzleWrapper: HTMLElement;
    /**
     * the <table> element of the grid
     */
    private readonly table: HTMLElement;

    /**
     * List of all Cell objects, one for each cell of the grid
     * this.cells[y][x]
     */
    private readonly cells: Cell[][];
    /**
     * List of all Edge objects, one for each edge between edge-adjacent cells of the grid
     * this.cells[direction][y][x]
     */
    private readonly edges: Edge[][][];
        /**
         * List of all coordinates for Edge elements [direction, y, x][]
         */
        public readonly edgeCoordinates: [number, number, number][];
    /**
     * the Canvas object accessing writing into the <calvas> elements
     */
    public readonly canvas: Canvas;

    /**
     * @param height Number of rows
     * @param width Number of columns
     * @param cellSize Size of td elements in pixels
     * @param containerId HTML id of element, in which the HTML table element should be created
     */
    constructor(height: number, width: number, cellSize: number, containerId: string) {
        this.height = height;
        this.width = width;
        this.cellSize = cellSize;

        let container = document.getElementById(containerId)!;

        this.puzzleWrapper = document.createElement("div");
        container.appendChild(this.puzzleWrapper);
        this.puzzleWrapper.classList.add("puzzle-wrapper");

        this.table = document.createElement("table");
        this.puzzleWrapper.appendChild(this.table);
        this.table.classList.add("puzzle");

        this.cells = [];
        for (let y = 0; y < this.height; y++) {
            let row = document.createElement("tr");
            this.table.appendChild(row);
            this.cells.push([]);
            for (let x = 0; x < this.width; x++) {
                let column = document.createElement("td");
                row.appendChild(column);
                let cell = new Cell(column, this.cellSize, y, x);
                this.cells[y].push(cell);
            }
        }

        this.canvas = new Canvas(this, this.puzzleWrapper);

        this.edges = [[], []];
        this.edgeCoordinates = [];
        for (let y = 0; y < this.height; y++) {
            let row: Edge[] = [];
            for (let x = 0; x < this.width - 1; x++) {
                let edge = new Edge(this.cells[y][x], this.cells[y][x + 1], 0, y, x);
                row.push(edge);
                this.edgeCoordinates.push([0, y, x]);
            }
            this.edges[0].push(row);
        }
        for (let y = 0; y < this.height - 1; y++) {
            let row: Edge[] = [];
            for (let x = 0; x < this.width; x++) {
                let edge = new Edge(this.cells[y][x], this.cells[y + 1][x], 1, y, x);
                row.push(edge);
                this.edgeCoordinates.push([1, y, x]);
            }
            this.edges[1].push(row);
        }
    }

    /**
     * Access a Cell object by coordinates
     * @param y the row, 0 is the top row
     * @param x the column, 0 is the left-most column
     */
    public getCell(y: number, x: number): Cell {
        return this.cells[y][x];
    }

    /**
     * Access an Edge object by coordinates
     * @param direction 0 = on right side, 1 = on left side
     * @param y the row of the cell next to which the edge label is, 0 is the top row
     * @param x the column of the cell next to which the edge label is, 0 is the left-most column
     */
    public getEdge(direction: number, y: number, x: number): Edge {
        return this.edges[direction][y][x];
    }

    /**
     * Update CSS variables that need to be set by javascript for all HTML elements
     * This method should be called after creating frame, or updating styles/border widths
     */
    public update(): void {
        // read bounding rectangle of all .cell elements
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x].getBoundingRect();
            }
        }

        // update size of elements inside .cell
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x].update();
            }
        }

        // read bounding rectangle of all .edgeWrapper elements
        for (let [direction, y, x] of this.edgeCoordinates) {
            this.edges[direction][y][x].getBoundingRect();
        }

        // update size and position of .edgeWrapper
        for (let [direction, y, x] of this.edgeCoordinates) {
            this.edges[direction][y][x].update();
        }

        // update canvas coordinate system and redraw all elements inside
        this.canvas.update();
    }

    /**
     * Delete all HTML elements
     */
    public delete(): void {
        this.puzzleWrapper.remove();
    }
}
