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
}