class EdgeEditor {
    public static eventListeners: [string, EventListener][] = [
        ["mousedown", (event: Event) => this.mouseDownEventListener(<MouseEvent>event)],
        ["contextmenu", (event: Event) => event.preventDefault()],
    ];

    private static factories: EdgeVariantFactory[] = [];

    private static areEventListenersOn: boolean = false;

    private static removeVariantButtons(): void {
        let section = document.getElementById("right-menu-subsection-edge-add")!;
        for (let child of Array.from(section.children)) {
            if (child.id.startsWith("menu-button-edge-add-")) {
                child.remove();
            }
        }
        this.factories = [];
    }

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

    public static updateMenu(): void {
        if (MainEditor.sudoku.hasEdgeVariant()) {
            GraphicsUtils.addClass("right-menu-subsection-edge-add", "display-none");
            GraphicsUtils.removeClass("right-menu-subsection-edge-remove", "display-none");
        } else {
            GraphicsUtils.addClass("right-menu-subsection-edge-remove", "display-none");
            GraphicsUtils.removeClass("right-menu-subsection-edge-add", "display-none");
            this.removeVariantButtons();
            this.addVariantButtons();
        }
    }

    public static removeVariant(): void {
        MainEditor.sudoku.setEdgeVariant(null);

        for (let [direction, y, x] of MainEditor.frame.edgeCoordinates) {
            MainEditor.frame.getEdge(direction, y, x).removeWrapper();
        }
    }

    public static addVariant(variantId: number): void {
        MainEditor.sudoku.setEdgeVariant(this.factories[variantId]);
        let variant = MainEditor.sudoku.getEdgeVariant()!;
        let setToZero = variant.labelStyle[0] === null;

        for (let [direction, y, x] of MainEditor.frame.edgeCoordinates) {
            if (setToZero) {
                variant.board[direction][y][x] = 0;
            }

            let edge = MainEditor.frame.getEdge(direction, y, x);
            edge.addWrapper();
            edge.wrapperElement!.id = `edge-${direction}-${y}-${x}`;
        }
    }

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

    public static addEventListeners(): void {
        if (! this.areEventListenersOn) {
            EditorUtils.addEventListeners(this.eventListeners);
            this.areEventListenersOn = true;
        }
    }

    public static removeEventListeners(): void {
        if (this.areEventListenersOn) {
            EditorUtils.removeEventListeners(this.eventListeners);
            this.areEventListenersOn = false;
        }
    }
}