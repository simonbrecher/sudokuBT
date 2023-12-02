/**
 * Class managing graphics for one cell in sudoku puzzle
 */
class Cell {
    // constants used by this.setBorder() to specify direction of borders
    public static readonly DIRECTIONS = { top: 1, bottom: 2, left: 4, right: 8, topBottom: 3, leftRight: 12, all: 15 };
    private static readonly DIRECTIONS_CLASS = ["top", "bottom", "left", "right"];

    public readonly y: number; // y coordinate inside Frame
    public readonly x: number; // x coordinate inside Frame

    public readonly tdElement: HTMLElement;
        private tdBordersClass = ["", "", "", ""];
        private tdSize: number = 0;
    private readonly cellElement: HTMLElement;
        private cellHeight: string = "";
        private cellWidth: string = "";
        private backgroundColor: string = "";
    private textWrapperElement: HTMLElement | null = null;
        private textWrapperCount: string = "";
        private textElements: HTMLElement[] = [];
        private textColors: string[] = [];
        private texts: string[] = [];

    constructor(tdElement: HTMLElement, tdSize: number, y: number, x: number) {
        this.y = y;
        this.x = x;

        this.tdElement = tdElement;

        this.cellElement = document.createElement("div");
        this.tdElement.appendChild(this.cellElement);
        this.cellElement.classList.add("cell");

        this.setSize(tdSize)
    }

    /**
     * Update --height and --width CSS variables of this.tdElement
     * @param tdSize new height and width of this.tdElement in pixels
     */
    private setSize(tdSize: number): void {
        if (this.tdSize != tdSize) {
            this.tdElement.style.setProperty("--height", `${tdSize}px`);
            this.tdElement.style.setProperty("--width", `${tdSize}px`);
            this.tdSize = tdSize;
        }
    }

    /**
     * Set --height and --width CSS properties of this.cellElement, so that they are equal to the actual width and height
     * Access this method trough Frame.update()
     */
    public updateCellSize(): void {
        let bound = this.cellElement.getBoundingClientRect();
        let height = `${bound.height}px`;
        let width = `${bound.width}px`;
        if (height !== this.cellHeight) {
            this.cellElement.style.setProperty("--height", height);
        }
        if (width !== this.cellWidth) {
            this.cellElement.style.setProperty("--width", width);
        }
    }

    /**
     * Set some borders of td element.
     * @param border "none", "normal", "strong" ... creates css class -> "border-left-normal"
     * @param directions What directions are affected? Union of values in Cell.DIRECTIONS
     */
    public setBorder(border: string, directions: number): void {
        for (let i = 0; i < 4; i++) {
            if ((directions & 1 << i) !== 0) {
                let newClass = `border-${Cell.DIRECTIONS_CLASS[i]}-${border}`;
                this.tdBordersClass[i] = GraphicsUtils.updateCssClass(this.tdElement, this.tdBordersClass[i], newClass);
            }
        }
    }

    private createTextWrapperElement(): HTMLElement {
        this.textWrapperElement = document.createElement("div");
        this.cellElement.appendChild(this.textWrapperElement);
        this.textWrapperElement.classList.add("text-wrapper");
        return this.textWrapperElement;
    }

    /**
     * Set texts inside this cell to one or multiple texts
     * @param texts
     *      string: set texts to single big text
     *      string[]: set texts to multiple small texts
     */
    public setText(texts: string | string[]): void {
        let isBig = typeof texts === "string";
        if (typeof texts === "string") {
            texts = [texts];
        }
        if (texts.length !== 0 || this.textWrapperElement !== null) {
            if (this.textWrapperElement === null) {
                this.textWrapperElement = this.createTextWrapperElement();
            }
            let innerCount1d = isBig ? 1 : Math.max(2, Math.ceil(Math.sqrt(texts.length)));
            this.textWrapperElement.style.setProperty("--inner-count-1d", `${innerCount1d}`);

            while (texts.length < this.texts.length) {
                this.texts.pop();
                this.textColors.pop();
                this.textElements[this.textElements.length - 1].remove();
                this.textElements.pop();
            }

            while (texts.length > this.texts.length) {
                this.texts.push("");
                this.textColors.push("");
                let textElement = document.createElement("div");
                this.textWrapperElement.appendChild(textElement);
                this.textElements.push(textElement);
            }

            for (let i = 0; i < texts.length; i++) {
                if (texts[i] != this.texts[i]) {
                    this.textElements[i].textContent = texts[i];
                    this.texts[i] = texts[i];
                }
            }

            if (texts.length === 0) {
                this.textWrapperElement.remove();
                this.textWrapperCount = "";
                this.textWrapperElement = null;
            } else {
                let textWrapperCount = isBig ? "single-text" : "multiple-text";
                this.textWrapperCount = GraphicsUtils.updateCssClass(this.textWrapperElement, this.textWrapperCount, textWrapperCount);
            }
        }
    }

    /**
     * Set background color to cell element
     */
    public setBackgroundColor(backgroundColor: string): void {
        if (backgroundColor !== this.backgroundColor) {
            this.cellElement.style.setProperty("--background-color", backgroundColor);
            this.backgroundColor = backgroundColor;
        }
    }
}