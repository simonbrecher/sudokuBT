/**
 * Type used to specify coordinates of one line of backet border.
 * mainY and mainX are coordinates of cells,
 * subY and subX are what side of the cell the basket border is in, 0 is top/left 1 is bottom/right
 */
type BasketBorder = {
    start: { mainY: number, mainX: number, subY: number, subX: number },
    end: { mainY: number, mainX: number, subY: number, subX: number }
}

/**
 * Type for saving access to HTML canvas element
 */
type CanvasContext = {
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
}

/**
 * Style used to render a line
 */
type LineStyle = {
    thickness: number,
    color: string,
    cap: CanvasLineCap,
}

/**
 * Style used to render a basket's border
 */
type BasketBorderStyle = {
    color: string,
    /**
     * null if full, [a, b] if dashed, a is length of the dash, b is length of the spaces
     */
    dash: [number, number] | null,
    cap: CanvasLineCap,
}

/**
 * Class managing canvas HTML element, used for drawing lines
 */
class Canvas {
    /**
     * space between basket borders and <td> border in pixels
     */
    private static readonly BASKET_BORDER_OFFSET = 3;
    /**
     * <canvas> bitmap is bigger than <canvas> by this factor
     */
    private static readonly CANVAS_SCALE = 5;

    /**
     * Reference to the Frame object representing the Sudoku grid
     */
    private readonly frame: Frame;
    /**
     * Reference to the Frame.puzzleWrapper, which contains the <table> and <canvas> HTML tags
     */
    private readonly puzzleWrapper: HTMLElement;

    /**
     * Access to <canvas> used for drawing lines
     */
    private lineCanvas: CanvasContext | null = null;
        /**
         * Coordinates of points of each line
         */
        private lines: { y: number, x: number }[][] = [];
        /**
         * Styles of each line
         */
        private linesStyle: LineStyle[] = [];
    /**
     * Access to <canvas> used for drawing basket borders
     */
    private basketCanvas: CanvasContext | null = null;
        /**
         * Coordinates of start and end of each line of basket borders
         */
        private basketBorders: BasketBorder[] = [];
        /**
         * Styles of each line of basket borders
         */
        private basketBorderStyles: BasketBorderStyle[] = [];

    /**
     * Number of rows of the grid
     */
    private readonly height: number;
    /**
     * Number of columns of the grid
     */
    private readonly width: number;

    public constructor(frame: Frame, puzzleWrapper: HTMLElement) {
        this.height = frame.height;
        this.width = frame.width;

        this.frame = frame;
        this.puzzleWrapper = puzzleWrapper;
    }

    /**
     * Create canvas HTML element
     */
    private createCanvas(): CanvasContext {
        let canvas = document.createElement("canvas");
        canvas.classList.add("canvas");
        this.puzzleWrapper.appendChild(canvas);
        let bound = canvas.getBoundingClientRect();
        canvas.height = bound.height * Canvas.CANVAS_SCALE;
        canvas.width = bound.width * Canvas.CANVAS_SCALE;
        let context = canvas.getContext("2d")!;
        return { canvas: canvas, context: context };
    }

    /**
     * Remove all lines
     * this does not redraw lines, use Frame.update()
     */
    public removeLines(): void {
        this.lines = [];
        this.linesStyle = [];
    }

    /**
     * Add line to list of lines
     * this does not redraw lines, use Frame.update()
     */
    public addLine(line: { y: number, x: number }[], style: LineStyle): void {
        this.lines.push(line);
        this.linesStyle.push(style);
    }

    /**
     * Add line by 1d index (y * width + x)
     * this does not redraw lines, use Frame.update()
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

    private roundCanvasCoordinate(coordinate: number): number {
        return Math.floor( coordinate / Canvas.CANVAS_SCALE) * Canvas.CANVAS_SCALE + 0.5;
    }

    /**
     * Redraw all lines in canvas
     * Call Frame.update(), not this method
     */
    private drawLines(): void {
        if (this.lineCanvas === null) {
            this.lineCanvas = this.createCanvas();
        }
        let canvas = this.lineCanvas.canvas;
        let context = this.lineCanvas.context;

        canvas.classList.remove("display-none");
        context.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < this.lines.length; i++) {
            let line = this.lines[i];
            let style = this.linesStyle[i];

            context.lineWidth = style.thickness * this.frame.cellSize * Canvas.CANVAS_SCALE;
            context.strokeStyle = style.color;
            context.lineCap = style.cap;

            context.beginPath();
            context.strokeStyle = style.color;

            for (let i = 0; i < line.length - 1; i++) {
                let y1 = (line[i].y + 0.5) * canvas.height / this.height;
                let x1 = (line[i].x + 0.5) * canvas.width / this.width;
                let y2 = (line[i + 1].y + 0.5) * canvas.height / this.height;
                let x2 = (line[i + 1].x + 0.5) * canvas.width / this.width;

                context.moveTo(this.roundCanvasCoordinate(x1), this.roundCanvasCoordinate(y1));
                context.lineTo(this.roundCanvasCoordinate(x2), this.roundCanvasCoordinate(y2));
            }

            context.stroke();
        }
    }

    /**
     * Remove all basket lines
     * this does not redraw lines, use Frame.update()
     */
    public removeBasketBorders(): void {
        this.basketBorders = [];
        this.basketBorderStyles = [];
    }

    /**
     * Add basket lines
     * this does not redraw lines, use Frame.update()
     */
    public addBasketBorder(line: BasketBorder, style: BasketBorderStyle): void {
        this.basketBorders.push(line);
        this.basketBorderStyles.push(style);
    }

    /**
     * For every corner return width of the widest <td> border next to either line going through that border
     * The values of these widths will then be used to calculate offset of the corner (start or end of basket border line)
     * Every corner has values on index (mainY * 2 + subY) * (width * 2) + (mainX * 2 + subX)
     */
    private getBasketBordersCoordinates(): { top: number, left: number, right: number, bottom: number }[] {
        let borderSizes = ArrayUtils.createArray1d(this.frame.height * 2 * this.frame.width * 2, undefined);
        for (let i = 0; i < borderSizes.length; i++) {
            borderSizes[i] = { top: 0, left: 0, right: 0, bottom: 0 }
        }

        for (let line of this.basketBorders) {
            let start = line.start;
            let startIndex = (start.mainY * 2 + start.subY) * (this.width * 2) + (start.mainX * 2 + start.subX);
            let end = line.end;
            let endIndex = (end.mainY * 2 + end.subY) * (this.width * 2) + (end.mainX * 2 + end.subX);
            if (start.mainY === end.mainY && start.subY === end.subY) {
                let borderMax = 0;
                let direction = start.subY === 0 ? Cell.DIRECTIONS.top : Cell.DIRECTIONS.bottom;
                for (let x = start.mainX + start.subX; x < end.mainX + end.subX; x++) {
                    borderMax = Math.max(borderMax, this.frame.getCell(start.mainY, x).getBorderWidth(direction));
                }
                let directionName = start.subY === 0 ? "top" : "bottom";
                borderSizes[startIndex][directionName] = Math.max(borderSizes[startIndex][directionName], borderMax);
                borderSizes[endIndex][directionName] = Math.max(borderSizes[endIndex][directionName], borderMax);
            } else if (line.start.mainX === line.end.mainX && line.start.subX === line.end.subX) {
                let borderMax = 0;
                let direction = start.subX === 0 ? Cell.DIRECTIONS.left : Cell.DIRECTIONS.right;
                for (let y = start.mainY + start.subY; y < end.mainY + end.subY; y++) {
                    borderMax = Math.max(borderMax, this.frame.getCell(y, start.mainX).getBorderWidth(direction));
                }
                let directionName = start.subX === 0 ? "left" : "right";
                borderSizes[startIndex][directionName] = Math.max(borderSizes[startIndex][directionName], borderMax);
                borderSizes[endIndex][directionName] = Math.max(borderSizes[endIndex][directionName], borderMax);
            } else {
                console.log("WARNING - basket line is not vertical or horizontal");
            }
        }

        return borderSizes;
    }

    /**
     * Redraw all basket border lines in canvas
     * Call Frame.update(), not this method
     */
    private drawBasketBorders(): void {
        if (this.basketCanvas === null) {
            this.basketCanvas = this.createCanvas();
        }
        let canvas = this.basketCanvas.canvas;
        let context = this.basketCanvas.context;

        canvas.classList.remove("display-none");
        context.clearRect(0, 0, canvas.width, canvas.height);

        let borderSizes = this.getBasketBordersCoordinates();

        for (let i = 0; i < this.basketBorders.length; i++) {
            let start = this.basketBorders[i].start;
            let end = this.basketBorders[i].end
            let style = this.basketBorderStyles[i];

            context.lineWidth = Canvas.CANVAS_SCALE;
            context.strokeStyle = style.color;
            context.lineCap = style.cap;

            context.beginPath();

            let startIndex = (start.mainY * 2 + start.subY) * (this.width * 2) + (start.mainX * 2 + start.subX);
            let endIndex = (end.mainY * 2 + end.subY) * (this.width * 2) + (end.mainX * 2 + end.subX);
            let y1offset = Math.max(1, borderSizes[startIndex][start.subY === 0 ? "top" : "bottom"]) / 2 + Canvas.BASKET_BORDER_OFFSET;
            let x1offset = Math.max(1, borderSizes[startIndex][start.subX === 0 ? "left" : "right"]) / 2 + Canvas.BASKET_BORDER_OFFSET;
            let y2offset = Math.max(1, borderSizes[endIndex][end.subY === 0 ? "top" : "bottom"]) / 2 + Canvas.BASKET_BORDER_OFFSET;
            let x2offset = Math.max(1, borderSizes[endIndex][end.subX === 0 ? "left" : "right"]) / 2 + Canvas.BASKET_BORDER_OFFSET;

            let y1 = (start.mainY + start.subY) * canvas.height / this.height - (2 * start.subY - 1) * (y1offset * Canvas.CANVAS_SCALE);
            let x1 = (start.mainX + start.subX) * canvas.width / this.width - (2 * start.subX - 1) * (x1offset * Canvas.CANVAS_SCALE);
            let y2 = (end.mainY + end.subY) * canvas.height / this.height - (2 * end.subY - 1) * (y2offset * Canvas.CANVAS_SCALE);
            let x2 = (end.mainX + end.subX) * canvas.width / this.width - (2 * end.subX - 1) * (x2offset * Canvas.CANVAS_SCALE);

            y1 = this.roundCanvasCoordinate(y1);
            x1 = this.roundCanvasCoordinate(x1);
            y2 = this.roundCanvasCoordinate(y2);
            x2 = this.roundCanvasCoordinate(x2);
            if (style.dash !== null) {
                let length = Math.sqrt((y1 - y2) * (y1 - y2) + (x1 - x2) * (x1 - x2)) / Canvas.CANVAS_SCALE;
                let dashScale = 1;
                let realLength = 1;
                for (let i = 0; realLength <= length; i++) {
                    dashScale = length / realLength * Canvas.CANVAS_SCALE;
                    realLength = style.dash[0] * (i + 1) + style.dash[1] * i;
                }
                let dash = [style.dash[0] * dashScale, style.dash[1] * dashScale];
                context.setLineDash(dash);
            }

            context.moveTo(x1, y1);
            context.lineTo(x2, y2);

            context.stroke();
        }
    }

    /**
     * Redraw all lines. If no lines exist anymore, hide canvas HTML element
     * Call Frame.update instead of this method.
     * You can call this method, if you have not made any change to size of any cells in Frame after the last call of Frame.update()
     */
    public update(): void {
        if (this.lines.length !== 0) {
            this.drawLines();
        } else {
            this.lineCanvas?.canvas.classList.add("display-none");
        }
        if (this.basketBorders.length !== 0) {
            this.drawBasketBorders();
        } else {
            this.basketCanvas?.canvas.classList.add("display-none");
        }
    }
}