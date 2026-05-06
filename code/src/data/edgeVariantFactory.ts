class EdgeVariantFactory {
    /**
     * You can add new Edge variant by adding the EdgeVariantFactory constructor and implementing the four parameters.
     */
    public static variants = {
        consecutive: new EdgeVariantFactory(
            "Consecutive",
            (size: number, value1: number, value2: number): number[] => Math.abs(value1 - value2) == 1 ? [1] : [0],
            (size: number): (EdgeLabelStyle | null)[] => [
                null,
                { css: ["small-circle"] },
            ],
            (size: number): boolean => true,
        ),
        kropki: new EdgeVariantFactory(
            "Kropki",
            (size: number, value1: number, value2: number): number[] => {
                let isDifference = Math.abs(value1 - value2) == 1;
                let isMultiple = value1 == value2 * 2 || value2 == value1 * 2;

                if (isDifference && isMultiple) {
                    return [1, 2];
                } else if (isDifference) {
                    return [1];
                } else if (isMultiple) {
                    return [2];
                } else {
                    return [0];
                }
            },
            (size: number): (EdgeLabelStyle | null)[] => [
                null,
                { css: ["small-circle"] },
                { css: ["small-circle", "black-background"] },
            ],
            (size: number): boolean => true,
        ),
        vx: new EdgeVariantFactory(
            "VX",
            (size: number, value1: number, value2: number): number[] => {
                switch (value1 + value2) {
                    case 5:     return [1];
                    case 10:    return [2];
                    default:    return [0];
                }
            },
            (size: number): (EdgeLabelStyle | null)[] => [
                null,
                { css: ["vx-v"] },
                { css: ["vx-x"] },
            ],
            (size: number): boolean => true,
        ),
        comparative: new EdgeVariantFactory(
            "Comparative",
            (size: number, value1: number, value2: number): number[] => value1 < value2 ? [0] : [1],
            (size: number): (EdgeLabelStyle | null)[] => [
                { css: ["greater"] },
                { css: ["lesser"] },
            ],
            (size: number): boolean => true,
        ),
        sum: new EdgeVariantFactory(
            "Sum",
            (size: number, value1: number, value2: number): number[] => [value1 + value2 - 3],
            (size: number): (EdgeLabelStyle | null)[] => {
                let output: (EdgeLabelStyle | null)[] = [];
                for (let sum = 3; sum <= 2 * size - 1; sum++) {
                    let textStyle = sum < 10 ? "text-1" : "text-2";
                    let style: EdgeLabelStyle = { css: ["big-circle", textStyle], text: `${sum}` };
                    output.push(style);
                }
                return output;
            },
            (size: number): boolean => true,
        ),
    };

    /**
     * string name of the variant, used in the button in editor
     */
    public name: string;
    /**
     * For (size, value1, value2) return array of all label id that can be on the edge of two cells
     * with numbers value1 and value2.
     * If it is possible for multiple labels to be between the pair of numbers, return multiple ids.
     * All label ids must be non-negative integers.
     * @param size the sudoku size
     * @param value1 number in the top/left cell of the edge-adjacent pair
     * @param value2 number in the bottom/right cell of the edge-adjacent pair
     * @return array of all label ids that can be on the edge of two cells with numbers value1 and value2
     */
    public valueToLabels: (size: number, value1: number, value2: number) => number[];
    /**
     * Return list of all label styles ordered by the label ids.
     * @param size the sudoku size
     * @return array of label styles. null means that the label has no graphical element.
     * @return output[i] is the graphics of label with id i
     */
    public labelStyle: (size: number) => (EdgeLabelStyle | null)[];
    /**
     * Can the variant be added for Sudoku.
     * @param size the sudoku size
     */
    public canBeAdded: (size: number) => boolean;

    /**
     * Saves data needed to generate EdgeVariant.
     * @param name string name of the variant, used in the button in editor
     * @param valueToLabels For (size, value1, value2) return array of all label id that can be on the edge of two cells
     * with numbers value1 and value2.
     * If it is possible for multiple labels to be between the pair of numbers, return multiple ids.
     * All label ids must be non-negative integers.
     * @param labelStyle Return list of all label styles, null means there is no graphical element for the label.
     * @param canBeAdded Can the variant be added for Sudoku.
     */
    constructor(
        name: string,
        valueToLabels: (size: number, value1: number, value2: number) => number[],
        labelStyle: (size: number) => (EdgeLabelStyle | null)[],
        canBeAdded: (size: number) => boolean,
    ) {
        this.name = name;
        this.valueToLabels = valueToLabels;
        this.labelStyle = labelStyle;
        this.canBeAdded = canBeAdded;
    }

    /**
     * Convert the data to parameters of EdgeVariant and return an instance of it.
     * @param sudoku Sudoku object that the variant will be added in the future (we need to know the size of it).
     */
    public build(sudoku: Sudoku): EdgeVariant {
        if (! this.canBeAdded(sudoku.size)) {
            throw "EdgeVariantFactory.build: Cannot be added to sudoku";
        }

        let neighbours: number[][] = [];
        let labelsSet: Set<number> = new Set();
        for (let shift1 = 0; shift1 < sudoku.size; shift1++) {
            for (let shift2 = 0; shift2 < sudoku.size; shift2++) {
                if (shift1 != shift2) {
                    let labels = this.valueToLabels(sudoku.size, shift1 + 1, shift2 + 1);
                    for (let label of labels) {
                        labelsSet.add(label);

                        while (neighbours.length <= label) {
                            neighbours.push(ArrayUtils.createArray1d(sudoku.size, 0));
                        }

                        neighbours[label][shift1] |= 1 << shift2;
                    }
                }
            }
        }

        let labels = Array.from(labelsSet).sort((a, b) => a - b);

        let labelStyle = this.labelStyle(sudoku.size);

        return new EdgeVariant(sudoku.size, labels, labelStyle, neighbours);
    }
}