/**
 * Style of Edge label
 */
type EdgeLabelStyle = {
    /**
     * the css clas with the style, you can even use .svg if you want
     */
    css?: string[],
    /**
     * Text that will be added in the Edge label
     */
    text?: string,
}

class Edge {
    /**
     * if the label is on right side of td
     */
    public static readonly HORIZONTAL_DIRECTION = 0;
    /**
     * if the label is on bottom side of td
     */
    public static readonly VERTICAL_DIRECTION = 1;

    /**
     * Size of the wrapper, relative to the length of border on which it is
     */
    public static readonly WRAPPER_RELATIVE_SIZE = 0.45;

    /**
     * 0 = on the right side, 1 = on the left side
     * Use Edge.HORIZONTAL_DIRECTION and Edge.VERTICAL_DIRECTION
     */
    public direction: number;
    /**
     * True if this.direction == Edge.HORIZONTAL_DIRECTION
     */
    public isHorizontal: boolean;
    /**
     * row of the cell the label is next to, 0 is the top row
     */
    public y: number;
    /**
     * column of the cell the label is next to, 0 is the left-most column
     */
    public x: number;

    /**
     * Cell object of the left/top cell (the one containing the edge label)
     */
    public cell1: Cell;
    /**
     * Cell object of the right/bottom cell
     */
    public cell2: Cell;

    /**
     * <div> used to position the label
     */
    public wrapperElement: HTMLElement | null = null;
    /**
     * <div> with graphics of the label, it is inside this.wrapperElement
     */
    public labelElement: HTMLElement | null = null;
        /**
         * style used for this.labelElement, null means no this.labelElement
         */
        public labelStyle: EdgeLabelStyle | null = null;

    /**
     * DOMRect of this.wrapperElement, used to move it to the correct position
     */
    public boundingRect: DOMRect | null = null;

    /**
     * Checks of two EdgeLabelStyles are equal
     */
    public static edgeStyleEquals(style1: EdgeLabelStyle | null, style2: EdgeLabelStyle | null): boolean {
        if (style1 === null || style2 === null) {
            return style1 === null && style2 === null;
        }
        if (style1.text !== style2.text) {
            return false;
        }
        if (style1.css === undefined || style2.css === undefined) {
            return style1.css === undefined && style2.css === undefined;
        }
        return ArrayUtils.equals1d(style1.css, style2.css);
    }

    /**
     * @param cell1 Cell object of the left/top cell (the one containing the edge label)
     * @param cell2 Cell object of the right/bottom cell
     * @param direction 0 = on the right side, 1 = on the left side
     * Use Edge.HORIZONTAL_DIRECTION and Edge.VERTICAL_DIRECTION
     * @param y row of the cell (cell1) the label is next to, 0 is the top row
     * @param x column of the cell (cell1) the label is next to, 1 is the left-most column
     */
    constructor(cell1: Cell, cell2: Cell, direction: number, y: number, x: number) {
        this.direction = direction;
        this.isHorizontal = direction == Edge.HORIZONTAL_DIRECTION;
        this.y = y;
        this.x = x;

        this.cell1 = cell1;
        this.cell2 = cell2;
    }

    /**
     * Create this.wrapperElement
     */
    public addWrapper(): void {
        if (this.wrapperElement === null) {
            this.wrapperElement = document.createElement("div");
            this.cell1.tdElement.appendChild(this.wrapperElement);

            this.wrapperElement.classList.add("edge-wrapper");
            this.wrapperElement.classList.add(`edge-wrapper-${this.isHorizontal ? 'horizontal' : 'vertical'}`);
        }
    }

    /**
     * Remove this.wrapperElement
     */
    public removeWrapper(): void {
        if (this.wrapperElement !== null) {
            this.removeLabel();
            this.wrapperElement.remove();
            this.wrapperElement = null;
        }
    }

    /**
     * Add this.labelElement, but make it have no graphics
     */
    private addEmptyLabel(): void {
        this.addWrapper();

        this.labelElement = document.createElement("div");
        this.wrapperElement?.appendChild(this.labelElement);
        this.labelElement.classList.add("edge-label");
    }

    /**
     * Set graphics of this.labelElement
     * @param oldStyle Styles to remove
     * @param newStyle Styles to add
     */
    private editLabel(oldStyle: EdgeLabelStyle, newStyle: EdgeLabelStyle): void {
        GraphicsUtils.updateCssClasses(this.labelElement!, oldStyle?.css ?? [], newStyle?.css ?? []);
        this.labelElement!.textContent = newStyle?.text ?? "";
    }

    /**
     * Add/remove this.labelElement or change its style, if the new style is different from the current style
     * @param style new style, null means no this.labelElement
     */
    public setLabel(style: EdgeLabelStyle | null): void {
        if (style === null) {
            this.removeLabel();
            return;
        }

        if (! Edge.edgeStyleEquals(this.labelStyle, style)) {
            if (this.labelStyle === null) {
                this.addEmptyLabel();
                this.labelStyle = {};
            }
            this.editLabel(this.labelStyle, style)
            this.labelStyle = style;
        }
    }

    /**
     * Remove this.labelElement if it exists
     */
    public removeLabel(): void {
        if (this.labelElement !== null) {
            this.labelElement.remove();
            this.labelElement = null;
        }
        this.labelStyle = null;
    }

    /**
     * Save DOMRect of this.wrapperElement for Edge.update().
     * ---
     * Use Frame.update() to update cell sizes of all edges.
     * If you want to call this directly, call .getBoundingRect() on all elements before .update().
     */
    public getBoundingRect(): void {
        if (this.wrapperElement !== null) {
            this.boundingRect = this.wrapperElement.getBoundingClientRect();
        }
    }

    /**
     * Update size of this.wrapperElement.
     * ---
     * Call Frame.update() to update all wrapper elements.
     * If you want to call this directly, call all Cell.getBoundingRect() on both adjacent cells and Edge.getBoundingRect() before.
     */
    public update(): void {
        if (this.wrapperElement === null) {
            return;
        }

        let bound1 = this.cell1.boundingRect;
        let bound2 = this.cell2.boundingRect;

        if (bound1 === null || bound2 === null) {
            throw "Cell.boundingRect === null, call Cell.getBoundingRect().";
        }

        let size, x, y;
        if (this.isHorizontal) {
            size = (bound1.height + bound2.height) / 2;
            x = (bound1.right + bound2.left) / 2;
            y = (bound1.top + bound2.top + bound1.bottom + bound2.bottom) / 4;
        } else {
            size = (bound1.width + bound2.width) / 2;
            x = (bound1.left + bound2.left + bound1.right + bound2.right) / 4;
            y = (bound1.bottom + bound2.top) / 2;
        }
        let wrapperSize = size * Edge.WRAPPER_RELATIVE_SIZE;

        if (this.boundingRect === null) {
            throw "Edge.boundingRect === null, call Edge.getBoundingRect()";
        }

        let left = x - wrapperSize / 2;
        let top = y - wrapperSize / 2;

        let oldLeft = this.boundingRect.left;
        let oldTop = this.boundingRect.top;
        let oldLeftStyle = this.wrapperElement.style.getPropertyValue("--x");
        let oldTopStyle = this.wrapperElement.style.getPropertyValue("--y");

        let wrapperSizePX = `${wrapperSize}px`;
        let sizePX = `${size}px`;
        GraphicsUtils.setProperty(this.wrapperElement, "--wrapper-size", wrapperSizePX);
        GraphicsUtils.setProperty(this.wrapperElement, "--size", sizePX);

        let leftOffset = left - oldLeft;
        if (Math.abs(leftOffset) >= 1) {
            let newLeft = GraphicsUtils.pxToNumber(oldLeftStyle) + leftOffset;
            let xPX = `${newLeft}px`;
            GraphicsUtils.setProperty(this.wrapperElement, "--x", xPX);
        }

        let topOffset = top - oldTop;
        if (Math.abs(topOffset) >= 1) {
            let newTop = GraphicsUtils.pxToNumber(oldTopStyle) + topOffset;
            let yPX = `${newTop}px`;
            GraphicsUtils.setProperty(this.wrapperElement, "--y", yPX);
        }
    }
}