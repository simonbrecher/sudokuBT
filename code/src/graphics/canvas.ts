/**
 * Class managing canvas HTML element, used for drawing lines
 */
class Canvas {
    private readonly frame: Frame;
    private readonly table: HTMLElement;

    private canvas: HTMLCanvasElement | null = null;
        private canvasHeight!: number;
        private canvasWidth!: number;
    private context: CanvasRenderingContext2D | null = null;
        private lines: { y: number, x: number }[][] = [];
        private linesStyle: LineStyle[] = [];

    private readonly height: number;
    private readonly width: number;

    public constructor(frame: Frame, table: HTMLElement) {
        this.height = frame.height;
        this.width = frame.width;

        this.frame = frame;
        this.table = table;
    }

    /**
     * Create canvas HTML element
     */
    private createCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
        let canvas = document.createElement("canvas");
        canvas.classList.add("canvas");
        this.table.prepend(canvas);
        let bound = canvas.getBoundingClientRect();
        this.canvasHeight = bound.height;
        this.canvasWidth = bound.width;
        canvas.height = this.canvasHeight;
        canvas.width = this.canvasWidth;
        let context = canvas.getContext("2d");
        return [canvas, context!];
    }

    /**
     * Add line to list of lines (does not redraw lines)
     */
    public addLine(line: { y: number, x: number }[], style: LineStyle): void {
        this.lines.push(line);
        this.linesStyle.push(style);
    }

    /**
     * Add line by 1d index (y * width + x)
     */
    public addLine1d(line1d: number[], style: LineStyle, offsetY: number, offsetX: number, width: number): void {
        let line = [];
        for (let index of line1d) {
            let y = Math.floor(index / width);
            let x = index % width;
            line.push({ y: y + offsetY, x: x + offsetX });
        }
        this.addLine(line, style);
    }

    /**
     * Redraw all lines in canvas
     */
    private draw(): void {
        if (this.context === null || this.canvas === null) {
            [this.canvas, this.context] = this.createCanvas();
        }
        this.canvas.classList.remove("display-none");

        this.context.clearRect(0, 0, this.canvas.height, this.canvas.width);

        for (let i = 0; i < this.lines.length; i++) {
            let line = this.lines[i];
            let style = this.linesStyle[i];

            this.context.lineWidth = style.thickness * this.frame.cellSize;
            this.context.strokeStyle = style.color;
            this.context.lineCap = style.cap;

            this.context.beginPath();
            this.context.strokeStyle = style.color;

            for (let i = 0; i < line.length - 1; i++) {
                let y1 = (line[i].y + 0.5) * this.canvasHeight / this.height;
                let x1 = (line[i].x + 0.5) * this.canvasWidth / this.width;
                let y2 = (line[i + 1].y + 0.5) * this.canvasHeight / this.height;
                let x2 = (line[i + 1].x + 0.5) * this.canvasWidth / this.width;

                this.context.moveTo(x1, y1);
                this.context.lineTo(x2, y2);
            }

            this.context.stroke();
        }
    }

    /**
     * Redraw all lines. If no lines exist anymore, hide canvas HTML element
     */
    public update(): void {
        if (this.lines.length !== 0) {
            this.draw();
        } else {
            this.canvas?.classList.add("display-none");
        }
    }
}