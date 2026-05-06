class NumberEditor {
    /**
     * Coordinates of the currently chosen cell, user can add numbers to the cell. null if none chosen
     */
    private static chosenCell: { x: number; y: number } | null = null;
    /**
     * true if the cell is chosen by left-click, false if by rick-click
     */
    private static isChosenCellBig: boolean = true;

    /**
     * Event listeners that are used to capture user input for adding numbers to the cells.
     */
    public static eventListeners: [string, EventListener][] = [
        ["mousedown", (event: Event) => this.mouseDownEventListener(<MouseEvent>event)],
        ["keydown", (event: Event) => this.keyDownEventListener(<KeyboardEvent>event)],
        ["contextmenu", (event: Event) => event.preventDefault()],
    ];

    /**
     * Depending on what tab is open in the left menu, are there supposed to be event listeners?
     */
    public static hasEventListeners(left: string): boolean {
        return left === "numbers" || left === "solve";
    }

    private static mouseDownEventListener(event: MouseEvent): void {
        let cell = EditorUtils.mouseCoordinatesToCellCoordinates(event.y, event.x);

        if ((event.buttons & 0b11) !== 0) {
            // if we are solving sudoku and there is a big number in the task in the cell, the cell cannot be chosen
            if (MainEditor.menuPosition.left === "solve") {
                let index = cell.y * MainEditor.size + cell.x;
                if (BinaryUtils.has1bit32(MainEditor.sudoku.task.board[index])) {
                    this.removeChosenCell();
                    return;
                }
            }

            let isMouseLeft = (event.buttons & 0b1) !== 0;
            let nextCss = `background-chosen-${isMouseLeft ? 'big' : 'small'}`;
            if (this.chosenCell === null) {
                MainEditor.frame.getCell(cell.y, cell.x).addCellClass(nextCss);
                this.chosenCell = cell;
                this.isChosenCellBig = isMouseLeft;
            } else if (cell.y == this.chosenCell.y && cell.x == this.chosenCell.x) {
                if (this.isChosenCellBig != isMouseLeft) {
                    let cellObject = MainEditor.frame.getCell(cell.y, cell.x);
                    cellObject.removeCellClass(`background-chosen-${this.isChosenCellBig ? 'big' : 'small'}`);
                    cellObject.addCellClass(nextCss);
                    this.isChosenCellBig = isMouseLeft;
                } else {
                    this.removeChosenCell();
                }
            } else {
                this.removeChosenCell();
                MainEditor.frame.getCell(cell.y, cell.x).addCellClass(nextCss);
                this.chosenCell = cell;
                this.isChosenCellBig = isMouseLeft;
            }
        }
    }

    private static keyDownEventListener(event: KeyboardEvent): void {
        let value = parseInt(event.key);
        if (value.toString() === event.key) {
            if (this.chosenCell !== null) { // check if a cell is chosen, otherwise number is not added anywhere
                value += MainEditor.numberPlus; // add +0 or +10 to the number value, to write numbers 1-9 or 10-16
                if (0 < value && value <= MainEditor.size) {
                    let index = this.chosenCell.y * MainEditor.size + this.chosenCell.x;
                    let newValue = 1 << (value - 1);

                    let isSolve = MainEditor.menuPosition.left === "solve";
                    let board = isSolve ? MainEditor.sudoku.solution.board : MainEditor.sudoku.task.board;
                    let fullBinary = isSolve ? MainEditor.sudoku.task.board[index] : MainEditor.sudoku.fullBinary;

                    if (this.isChosenCellBig) { // add/remove whole number to the cell
                        if (board[index] == newValue) {
                            board[index] = fullBinary;
                        } else {
                            board[index] = newValue;
                        }
                    } else { // add/remove candidate numbers to the cell
                        if (! isSolve && board[index] == MainEditor.sudoku.fullBinary) {
                            board[index] = newValue;
                        } else if (! isSolve && board[index] == newValue) {
                            board[index] = MainEditor.sudoku.fullBinary;
                        } else {
                            board[index] ^= newValue;
                        }
                    }

                    Renderer.renderer.doRemoveAllCellClasses = false;
                    MainEditor.render();
                    Renderer.renderer.doRemoveAllCellClasses = true;
                }
            }
        } else if (event.key === "Backspace" || event.key === "Delete") {
            if (this.chosenCell !== null) {
                let index = this.chosenCell.y * MainEditor.size + this.chosenCell.x;

                if (MainEditor.menuPosition.left === "solve") {
                    MainEditor.sudoku.solution.board[index] = MainEditor.sudoku.task.board[index];
                } else {
                    MainEditor.sudoku.task.board[index] = MainEditor.sudoku.fullBinary;
                }

                Renderer.renderer.doRemoveAllCellClasses = false;
                MainEditor.render();
                Renderer.renderer.doRemoveAllCellClasses = true;
            }
        }
    }

    /**
     * When exiting editing of numbers, make the chosen cell not chosen anymore by removing the css class.
     */
    public static removeChosenCell(): void {
        if (this.chosenCell !== null) {
            let css = `background-chosen-${this.isChosenCellBig ? 'big' : 'small'}`;
            MainEditor.frame.getCell(this.chosenCell.y, this.chosenCell.x).removeCellClass(css);
            this.chosenCell = null;
        }
    }
}