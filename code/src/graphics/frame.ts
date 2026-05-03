/**
 * Class managing graphics for one sudoku puzzle
 */
class Frame {
    public readonly height: number; // number of rows
    public readonly width: number; // number of columns

    public readonly cellSize: number; // size of td element

    public readonly puzzleWrapper: HTMLElement;
    private readonly table: HTMLElement;

    private readonly cells: Cell[][];
    private readonly edges: Edge[][][];
        public readonly edgeCoordinates: [number, number, number][];
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

    public getCell(y: number, x: number): Cell {
        return this.cells[y][x];
    }

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

    public delete(): void {
        this.table.remove();
    }
}
