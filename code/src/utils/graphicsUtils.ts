class GraphicsUtils {
    /**
     * Update classes on HTMLElement.
     * @param element Element whose classes will change.
     * @param oldClasses Classes to be removed.
     * @param newClasses Classes to be added.
     * @return newClasses
     */
    public static updateCssClasses(element: HTMLElement, oldClasses: string[], newClasses: string[]): string[] {
        oldClasses.forEach((className: string) => {
            if (! newClasses.includes(className) && className !== "") {
                element.classList.remove(className);
            }
        });
        newClasses.forEach((className: string) => {
            if (! oldClasses.includes(className) && className !== "") {
                element.classList.add(className);
            }
        });

        return newClasses;
    }

    /**
     * Update class(es) on HTMLElement. "" is used for no class. (Or more classes may be divided by " ").
     * @param element Element whose classes will change.
     * @param oldClass Classes to be removed.
     * @param newClass Classes to be added.
     * @return newClass
     */
    public static updateCssClass(element: HTMLElement, oldClass: string, newClass: string): string {
        return GraphicsUtils.updateCssClasses(element, oldClass.split(" "), newClass.split(" ")).join(" ");
    }

    /**
     * Add css class to HTML element by id
     * @param id id of HTML element
     * @param cssClass class to be added
     */
    public static addClass(id: string, cssClass: string): void {
        let element = document.getElementById(id);
        element?.classList.add(cssClass);
    }

    /**
     * Remove css class to HTML element by id
     * @param id id of HTML element
     * @param cssClass class to be removed
     */
    public static removeClass(id: string, cssClass: string): void {
        let element = document.getElementById(id);
        element?.classList.remove(cssClass);
    }

    /**
     * Add or remove css class to HTML element by id
     * @param id id of HTML element
     * @param cssClass class to be added or removed
     * @param isAdd true: class is added ; false: class is removed
     */
    public static addOrRemoveClass(id: string, cssClass: string, isAdd: boolean): void {
        if (isAdd) {
            this.addClass(id, cssClass);
        } else {
            this.removeClass(id, cssClass);
        }
    }
}