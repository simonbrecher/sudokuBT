type EdgeLabelStyle = {
    css?: string[],
    text?: string,
}

class Edge {
    public static readonly HORIZONTAL_DIRECTION = 0; // on right side of td
    public static readonly VERTICAL_DIRECTION = 1; // on bottom side of td

    public static readonly WRAPPER_RELATIVE_SIZE = 0.45;

    public direction: number;
    public isHorizontal: boolean;
    public y: number;
    public x: number;

    public cell1: Cell;
    public cell2: Cell;
    public tdElement: HTMLElement;

    public wrapperElement: HTMLElement | null = null;
    public labelElement: HTMLElement | null = null;
        public labelStyle: EdgeLabelStyle | null = null;

    public boundingRect: DOMRect | null = null;

    public static edgeStyleEquals(style1: EdgeLabelStyle | null, style2: EdgeLabelStyle | null): boolean {
        if (style1 === null && style2 === null) {
            return true;
        }
        if (style1 === null || style2 === null) {
            return false;
        }
        if (style1.text !== style2.text) {
            return false;
        }
        if (style1.css === undefined && style2.css === undefined) {
            return true;
        }
        if (style1.css === undefined || style2.css === undefined) {
            return false;
        }
        if (style1.css.length !== style2.css.length) {
            return false;
        }
        for (let i = 0; i < style1.css.length; i++) {
            if (style1.css[i] !== style2.css[i]) {
                return false;
            }
        }
        return true;
    }

    constructor(cell1: Cell, cell2: Cell, direction: number, y: number, x: number) {
        this.direction = direction;
        this.isHorizontal = direction == Edge.HORIZONTAL_DIRECTION;
        this.y = y;
        this.x = x;

        this.cell1 = cell1;
        this.cell2 = cell2;
        this.tdElement = cell1.tdElement;
    }

    public addWrapper(): void {
        if (this.wrapperElement === null) {
            this.wrapperElement = document.createElement("div");
            this.tdElement.appendChild(this.wrapperElement);

            this.wrapperElement.classList.add("edge-wrapper");
            this.wrapperElement.classList.add(`edge-wrapper-${this.isHorizontal ? 'horizontal' : 'vertical'}`);
        }
    }

    public removeWrapper(): void {
        if (this.wrapperElement !== null) {
            this.removeLabel();
            this.wrapperElement.remove();
            this.wrapperElement = null;
        }
    }

    private addEmptyLabel(): void {
        this.addWrapper();

        this.labelElement = document.createElement("div");
        this.wrapperElement?.appendChild(this.labelElement);
        this.labelElement.classList.add("edge-label");
    }

    private editLabel(oldStyle: EdgeLabelStyle, newStyle: EdgeLabelStyle): void {
        GraphicsUtils.updateCssClasses(this.labelElement!, oldStyle?.css ?? [], newStyle?.css ?? []);
        this.labelElement!.textContent = newStyle?.text ?? "";
    }

    public addLabel(style: EdgeLabelStyle | null): void {
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

        let newLeft = GraphicsUtils.pxToNumber(oldLeftStyle) + left - oldLeft;
        let newTop = GraphicsUtils.pxToNumber(oldTopStyle) + top - oldTop;

        let wrapperSizePX = `${wrapperSize}px`;
        let sizePX = `${size}px`;
        let xPX = `${newLeft}px`;
        let yPX = `${newTop}px`;

        GraphicsUtils.setProperty(this.wrapperElement, "--wrapper-size", wrapperSizePX);
        GraphicsUtils.setProperty(this.wrapperElement, "--size", sizePX);
        GraphicsUtils.setProperty(this.wrapperElement, "--x", xPX);
        GraphicsUtils.setProperty(this.wrapperElement, "--y", yPX);
    }
}