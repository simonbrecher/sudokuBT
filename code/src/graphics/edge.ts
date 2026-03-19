type EdgeStyle = {
    shape: string | undefined,
    background: string | undefined,
    border: string | undefined,
    text: string | undefined,
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
    public elementElement: HTMLElement | null = null;
        public elementStyle: EdgeStyle | null = null;

    public boundingRect: DOMRect | null = null;

    constructor(cell1: Cell, cell2: Cell, direction: number, y: number, x: number) {
        this.direction = direction;
        this.isHorizontal = direction == Edge.HORIZONTAL_DIRECTION;
        this.y = y;
        this.x = x;

        this.cell1 = cell1;
        this.cell2 = cell2;
        this.tdElement = cell1.tdElement;
    }

    public addElementWrapper(): void {
        if (this.wrapperElement === null) {
            this.wrapperElement = document.createElement("div");
            this.tdElement.appendChild(this.wrapperElement);

            this.wrapperElement.classList.add("edge-wrapper");
            this.wrapperElement.classList.add(`edge-wrapper-${this.isHorizontal ? 'horizontal' : 'vertical'}`);
        }
    }

    public removeElementWrapper(): void {
        if (this.wrapperElement !== null) {
            this.wrapperElement.remove();
            this.wrapperElement = null;
        }
    }

    public addElement(style: EdgeStyle): void {

    }

    public removeElement(): void {

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
            size = (bound1.height + bound2.height) / 2 * Edge.WRAPPER_RELATIVE_SIZE;
            x = (bound1.right + bound2.left) / 2;
            y = (bound1.top + bound2.top + bound1.bottom + bound2.bottom) / 4;
        } else {
            size = (bound1.width + bound2.width) / 2 * Edge.WRAPPER_RELATIVE_SIZE;
            x = (bound1.left + bound2.left + bound1.right + bound2.right) / 4;
            y = (bound1.bottom + bound2.top) / 2;
        }

        if (this.boundingRect === null) {
            throw "Edge.boundingRect === null, call Edge.getBoundingRect()";
        }

        let left = x - size / 2;
        let top = y - size / 2;

        let oldLeft = this.boundingRect.left;
        let oldTop = this.boundingRect.top;
        let oldLeftStyle = this.wrapperElement.style.getPropertyValue("--x");
        let oldTopStyle = this.wrapperElement.style.getPropertyValue("--y");

        let newLeft = GraphicsUtils.pxToNumber(oldLeftStyle) + left - oldLeft;
        let newTop = GraphicsUtils.pxToNumber(oldTopStyle) + top - oldTop;

        let sizePX = `${Math.round(size)}px`;
        let xPX = `${Math.round(newLeft)}px`;
        let yPX = `${Math.round(newTop)}px`;

        GraphicsUtils.setProperty(this.wrapperElement, "--size", sizePX);
        GraphicsUtils.setProperty(this.wrapperElement, "--x", xPX);
        GraphicsUtils.setProperty(this.wrapperElement, "--y", yPX);
    }
}