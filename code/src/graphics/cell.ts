/**
 * Class managing graphics for one cell in sudoku puzzle
 */
class Cell {
    /**
     * constants used by this.setBorder() to specify direction of borders
     */
    public static readonly DIRECTIONS = { top: 1, bottom: 2, left: 4, right: 8, topBottom: 3, leftRight: 12, all: 15 };
    private static readonly DIRECTIONS_CLASS = ["top", "bottom", "left", "right"];

    /**
     * row coordinate, 0 is the top row
     */
    public readonly y: number;
    /**
     * column coordinate, 0 is the left-most column
     */
    public readonly x: number;

    /**
     * td HTMLElement of the cell
     */
    public readonly tdElement: HTMLElement;
        /**
         * CSS classes of the 4 sides of border, see Cell.DIRECTIONS_CLASS
         */
        private tdBordersClass = ["", "", "", ""];
    /**
     * a <div> element inside the <td> element, it is to measure the space between the borders (they might have various thickness)
     * everything is inside this element, everything is scaled based on the size of this element
     */
    private readonly cellElement: HTMLElement;
        /**
         * background color of this.cellElement
         */
        private backgroundColor: string = "";
    /**
     * element inside this.cellElement, which is used to wrap one or multiple elements with one character each
     */
    private textWrapperElement: HTMLElement | null = null;
        /**
         * "single-text" or "multiple-text" used as CSS class for this.textWrapperElement to add different stying
         * on text depending on if there is one or multiple characters
         */
        private textWrapperCount: string = "";
        /**
         * list of <div> elements, each for one character
         */
        private textElements: HTMLElement[] = [];
        /**
         * list of colors for background of the characters, each character gets one css class
         */
        private textColorsCss: string[] = [];
        /**
         * list of the characters in the cell
         */
        private texts: string[] = [];
    /**
     * list of classes that have been added to the cell by this.addCellClass()
     * and can be removed by this.removeCellClass() or this.removeAllCellClasses()
     */
    private cellClasses: Set<string> = new Set<string>();

    /**
     * Last recorded DOMRect of this.cellElement by this.getBoundingRect()
     * This is needed by Frame.update() to correctly set positioning of all elements.
     */
    public boundingRect: DOMRect | null = null;

    /**
     * @param tdElement reference to the <td> element in the <table>
     * @param tdSize width and height of the <td> in pixels
     * @param y row in which the cell is, 0 is top row
     * @param x column in which the cell is, 0 is left-most column
     */
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
        let value = `${tdSize}px`;
        GraphicsUtils.setProperty(this.tdElement, "--height", value);
        GraphicsUtils.setProperty(this.tdElement, "--width", value);
    }

    /**
     * Save DOMRect of this.cellElement for Cell.update() and Edge.update().
     * ---
     * Use Frame.update() to update cell sizes of all cells.
     * If you want to call this directly, call .getBoundingRect() on all elements before .update().
     */
    public getBoundingRect(): void {
        this.boundingRect = this.cellElement.getBoundingClientRect();
    }

    /**
     * Set --height and --width CSS properties of this.cellElement, so that they are equal to the actual width and height
     * ---
     * Access this method trough Frame.update()
     * Call Cell.getBoundingRect() before.
     */
    public update(): void {
        if (this.boundingRect === null) {
            throw "Cell.boundingRect === null: call Cell.getBoundingRect() before Cell.updateCellSizeWrite().";
        }

        let height = `${this.boundingRect.height}px`;
        let width = `${this.boundingRect.width}px`;
        GraphicsUtils.setProperty(this.cellElement, "--height", height);
        GraphicsUtils.setProperty(this.cellElement, "--width", width);
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
                this.textColorsCss.pop();
                this.textElements[this.textElements.length - 1].remove();
                this.textElements.pop();
            }

            while (texts.length > this.texts.length) {
                this.texts.push("");
                this.textColorsCss.push("");
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

    /**
     * Change background color of text, by text position.
     * @param position Index of text in this.textElements[]
     * @param css CSS class of the background color
     */
    public setTextBackgroundColorByPosition(position: number, css: string): void {
        if (this.textColorsCss[position] !== css) {
            this.textColorsCss[position] = GraphicsUtils.updateCssClass(this.textElements[position], this.textColorsCss[position], css);
        }
    }

    /**
     * Change background color of text.
     * @param text Text, whose background color should change
     * @param css CSS class of the background color
     * @param changeAll true if for all equal texts, false if only for the first
     * @return false only if: changeAll == false and no equal text was found
     */
    public setTextBackgroundColor(text: string | null, css: string, changeAll: boolean): boolean {
        let wasChanged = false;
        for (let i = 0; i < this.texts.length; i++) {
            if (text === null || this.texts[i] === text) {
                this.setTextBackgroundColorByPosition(i, css);
                if (! changeAll) {
                    wasChanged = true;
                    break;
                }
            }
        }
        return wasChanged;
    }

    /**
     * Remove all text background colors.
     */
    public removeTextsBackgroundColor(): void {
        for (let i = 0; i < this.texts.length; i++) {
            if (this.textColorsCss[i] !== "") {
                this.textElements[i].classList.remove(this.textColorsCss[i]);
                this.textColorsCss[i] = "";
            }
        }
    }

    /**
     * Return width of border in pixels
     */
    public getBorderWidth(direction: number): number {
        switch (direction) {
            case Cell.DIRECTIONS.top:
                return parseInt(getComputedStyle(this.tdElement).borderTopWidth.slice(0, -2));
            case Cell.DIRECTIONS.bottom:
                return parseInt(getComputedStyle(this.tdElement).borderBottomWidth.slice(0, -2));
            case Cell.DIRECTIONS.left:
                return parseInt(getComputedStyle(this.tdElement).borderLeftWidth.slice(0, -2));
            case Cell.DIRECTIONS.right:
                return parseInt(getComputedStyle(this.tdElement).borderRightWidth.slice(0, -2));
            default:
                throw `ERROR: Cell.getBorderWidth got invalid direction=${direction}`;
        }
    }

    /**
     * Add css class to this.cellElement. It can be removed by this.removeCellClass() or this.removeAllCellClasses()
     * @param css css class to add
     */
    public addCellClass(css: string): void {
        this.cellElement.classList.add(css);
        this.cellClasses.add(css);
    }

    /**
     * Remove css class which was added by this.addCellClass() from this.cellElement.
     * @param css css class to remove
     */
    public removeCellClass(css: string): void {
        this.cellElement.classList.remove(css);
        this.cellClasses.delete(css);
    }

    /**
     * Remove all css classes which were added by this.addCellClass() from this.cellElement
     */
    public removeAllCellClasses(): void {
        for (const css of Array.from(this.cellClasses)) {
            this.removeCellClass(css);
        }
    }
}