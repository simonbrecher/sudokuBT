class EditorUtils {
    public static mouseCoordinatesToCellCoordinates(mouseY: number, mouseX: number): { y: number, x: number } {
        let bound = MainEditor.frame.puzzleWrapper.getBoundingClientRect();
        let y = Math.floor((mouseY - bound.top) / bound.height * MainEditor.size);
        let x = Math.floor((mouseX - bound.left) / bound.width * MainEditor.size);
        y = Math.min(MainEditor.size - 1, Math.max(0, y));
        x = Math.min(MainEditor.size - 1, Math.max(0, x));
        return { y: y, x: x };
    }

    private static getEventListenerTarget(name: string): EventTarget {
        if (name === "keydown") {
            return document;
        } else {
            return MainEditor.frame.puzzleWrapper;
        }
    }

    public static addEventListeners(eventListeners: [string, EventListener][]): void {
        for (let [name, method] of eventListeners) {
            let target = this.getEventListenerTarget(name);
            target.addEventListener(name, method);
        }
    }

    public static removeEventListeners(eventListeners: [string, EventListener][]): void {
        for (let [name, method] of eventListeners) {
            let target = this.getEventListenerTarget(name);
            target.removeEventListener(name, method);
        }
    }
}