class EdgeEditor {
    /**
     * Event listeners that are used to capture user input while adding Edge labels.
     */
    public static eventListeners: [string, EventListener][] = [
        ["mousedown", (event: Event) => this.mouseDownEventListener(<MouseEvent>event)],
        ["contextmenu", (event: Event) => event.preventDefault()],
    ];

    /**
     * List of EdgeVariantFactory for all variants that can be added to the Sudoku
     */
    private static factories: EdgeVariantFactory[] = [];

    /**
     * Are event listeners in from this.eventListeners currently added?
     */
    private static areEventListenersOn: boolean = false;

    /**
     * Name of the variant, that is currently added to MainEditor.sudoku, null if none is added
     */
    private static variantName: string | null = null;

    /**
     * Remove all buttons for adding variants in the editor
     */
    private static removeVariantButtons(): void {
        let section = document.getElementById("right-menu-subsection-edge-add")!;
        for (let child of Array.from(section.children)) {
            if (child.id.startsWith("menu-button-edge-add-")) {
                child.remove();
            }
        }
        this.factories = [];
    }

    /**
     * Add all buttons for adding variants in the editor
     * Only buttons for variants that can be added to the Sudoku will be created
     */
    private static addVariantButtons(): void {
        let wrapper: HTMLElement = document.getElementById("right-menu-subsection-edge-add")!;
        let variantId = 0;
        for (let factory of Object.values(EdgeVariantFactory.variants)) {
            if (factory.canBeAdded(MainEditor.sudoku.size)) {
                let button = document.createElement('div');
                wrapper.appendChild(button);
                button.id = `menu-button-edge-add-${variantId}`;
                button.classList.add("menu-button");
                button.textContent = factory.name;

                const _variantId = variantId;
                button.onclick = () => MainEditor.pressedEdgeAddButton(_variantId);

                this.factories.push(factory);
                variantId++;
            }
        }
    }

    /**
     * Update right menu in editor, based on what variant is currently added to MainEditor.sudoku, if any
     */
    public static updateMenu(): void {
        if (MainEditor.sudoku.hasEdgeVariant()) {
            document.getElementById("variant-title")!.textContent = this.variantName;
            GraphicsUtils.addClass("right-menu-subsection-edge-add", "display-none");
            GraphicsUtils.removeClass("right-menu-subsection-edge-remove", "display-none");
        } else {
            document.getElementById("variant-title")!.textContent = "Add";
            GraphicsUtils.addClass("right-menu-subsection-edge-remove", "display-none");
            GraphicsUtils.removeClass("right-menu-subsection-edge-add", "display-none");
            this.removeVariantButtons();
            this.addVariantButtons();
        }
    }

    /**
     * Remove variant from MainEditor.sudoku
     */
    public static removeVariant(): void {
        MainEditor.sudoku.setEdgeVariant(null);

        for (let [direction, y, x] of MainEditor.frame.edgeCoordinates) {
            MainEditor.frame.getEdge(direction, y, x).removeWrapper();
        }
    }

    /**
     * Add variant to MainEditor.sudoku
     * @param variantId this.factories[variantId] is the EdgeVariantFactory to be used to add the variant
     */
    public static addVariant(variantId: number): void {
        let factory = this.factories[variantId];
        this.variantName = factory.name;
        MainEditor.sudoku.setEdgeVariant(factory);
        let variant = MainEditor.sudoku.getEdgeVariant()!;
        let setToZero = variant.labelStyle[0] === null;

        for (let [direction, y, x] of MainEditor.frame.edgeCoordinates) {
            // set default value for the label
            if (setToZero) {
                variant.board[direction][y][x] = 0;
            }

            // add HTML id to the Edge.wrapperElement, it is needed by the event listeners, to find out which one was clicked
            let edge = MainEditor.frame.getEdge(direction, y, x);
            edge.addWrapper();
            edge.wrapperElement!.id = `edge-${direction}-${y}-${x}`;
        }
    }

    /**
     * Find out what Edge.wrapperElement was pressed by user, return null if none
     */
    public static getEdgeCoordinate(event: MouseEvent): { direction: number, y: number, x: number } | null {
        let element: HTMLElement | null = <HTMLElement | null>event.target;
        while (element) {
            if (element.id.startsWith("edge-")) {
                let split = element.id.split("-");
                return { direction: parseInt(split[1]), y: parseInt(split[2]), x: parseInt(split[3]) };
            }
            element = element.parentElement;
        }
        return null;
    }

    /**
     * Toggle trough all labels
     * @param label Current label id
     * @param labels array containing ids of all labels
     * @param step 1 for next label, -1 for previous
     * @private
     */
    private static getNextLabel(label: number, labels: number[], step: number): number {
        let labels2 = [-1];
        for (let l of labels) {
            labels2.push(l);
        }
        return labels2[(labels2.indexOf(label) + step + labels2.length) % labels2.length];
    }

    private static mouseDownEventListener(event: MouseEvent): void {
        let coordinate = this.getEdgeCoordinate(event);
        if (coordinate === null) {
            return;
        }
        let { direction: direction, y: y, x: x } = coordinate;

        if ((event.buttons & 0b11) !== 0) {
            let variant = MainEditor.sudoku.getEdgeVariant()!;
            let oldLabel = variant.board[direction][y][x];
            if ((event.buttons & 0b1) !== 0) {
                variant.board[direction][y][x] = this.getNextLabel(oldLabel, variant.labels, 1);
            } else {
                variant.board[direction][y][x] = this.getNextLabel(oldLabel, variant.labels, -1);
            }
            MainEditor.render();
        }
    }

    /**
     * Add all event listeners needed for editing Edge labels
     */
    public static addEventListeners(): void {
        if (! this.areEventListenersOn) {
            EditorUtils.addEventListeners(this.eventListeners);
            this.areEventListenersOn = true;
        }
    }

    /**
     * Remove all event listeners needed for editing Edge labels
     */
    public static removeEventListeners(): void {
        if (this.areEventListenersOn) {
            EditorUtils.removeEventListeners(this.eventListeners);
            this.areEventListenersOn = false;
        }
    }
}