class EditorUtils {
    /**
     * Claculate (y, x) coordinates of Sudoku cells from mouse coordinates.
     * @param mouseY y coordinate of the mouse
     * @param mouseX x coordinate of the mouse
     * @return { y: y, x: x } coordinates of the cell that was clicked by user
     */
    public static mouseCoordinatesToCellCoordinates(mouseY: number, mouseX: number): { y: number, x: number } {
        let bound = MainEditor.frame.puzzleWrapper.getBoundingClientRect();
        let y = Math.floor((mouseY - bound.top) / bound.height * MainEditor.size);
        let x = Math.floor((mouseX - bound.left) / bound.width * MainEditor.size);
        y = Math.min(MainEditor.size - 1, Math.max(0, y));
        x = Math.min(MainEditor.size - 1, Math.max(0, x));
        return { y: y, x: x };
    }

    /**
     * Get event target of event listeners (either document or MainEditor.frame.puzzleWrapper)
     * @param name type of event listener
     */
    private static getEventListenerTarget(name: string): EventTarget {
        if (name === "keydown") {
            return document;
        } else {
            return MainEditor.frame.puzzleWrapper;
        }
    }

    /**
     * Add all event listeners to the correct target
     * @param eventListeners Event listeners to add
     */
    public static addEventListeners(eventListeners: [string, EventListener][]): void {
        for (let [name, method] of eventListeners) {
            let target = this.getEventListenerTarget(name);
            target.addEventListener(name, method);
        }
    }

    /**
     * Remove all event listeners from the correct target
     * @param eventListeners Event listeners to remove
     */
    public static removeEventListeners(eventListeners: [string, EventListener][]): void {
        for (let [name, method] of eventListeners) {
            let target = this.getEventListenerTarget(name);
            target.removeEventListener(name, method);
        }
    }
}