/**
 * Class managing graphics for one sudoku puzzle
 */
class Frame {
    public readonly height: number; // number of rows
    public readonly width: number; // number of columns

    public readonly cellSize: number; // size of td element

    private readonly table: HTMLElement;

    private readonly cells: Cell[][];
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
        this.table = document.createElement("table");
        container.appendChild(this.table);
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

        this.canvas = new Canvas(this, this.table);
    }

    public getCell(y: number, x: number): Cell {
        return this.cells[y][x];
    }

    /**
     * Update CSS variables that need to be set by javascript for all HTML elements
     * This method should be called after creating frame, or updating styles/border widths
     */
    public update(): void {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x].updateCellSize();
            }
        }
        this.canvas.update();
    }
}
