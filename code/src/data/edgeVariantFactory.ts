class EdgeVariantFactory {
    public static variants = {
        consecutive: new EdgeVariantFactory(
            (size: number, value1: number, value2: number): number[] => {
                return Math.abs(value1 - value2) == 1 ? [1] : [0];
            },
            (size: number): (EdgeLabelStyle | null)[] => {
                return [
                    null,
                    { css: ["small-circle"] },
                ];
            },
            (sudoku: Sudoku): boolean => sudoku.size <= 31,
        ),
        kropki: new EdgeVariantFactory(
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
            (size: number): (EdgeLabelStyle | null)[] => {
                return [
                    null,
                    { css: ["small-circle"] },
                    { css: ["small-circle", "black-background"] },
                ];
            },
            (sudoku: Sudoku): boolean => sudoku.size <= 31,
        ),
        vx: new EdgeVariantFactory(
            (size: number, value1: number, value2: number): number[] => {
                switch (value1 + value2) {
                    case 5:     return [1];
                    case 10:    return [2];
                    default:    return [0];
                }
            },
            (size: number): (EdgeLabelStyle | null)[] => {
                return [
                    null,
                    { css: ["small-circle", "no-border", "text-1-big"], text: "V" },
                    { css: ["small-circle", "no-border", "text-1-big"], text: "X" },
                ];
            },
            (sudoku: Sudoku): boolean => sudoku.size <= 31,
        ),
        sum: new EdgeVariantFactory(
            (size: number, value1: number, value2: number): number[] => [value1 + value2 - 1],
            (size: number): (EdgeLabelStyle | null)[] => {
                let output: (EdgeLabelStyle | null)[] = [null];
                for (let sum = 3; sum <= 2 * size - 1; sum++) {
                    let textStyle = sum < 10 ? "text-1" : "text-2";
                    let style: EdgeLabelStyle = { css: ["big-circle", textStyle], text: `${sum}` };
                    output.push(style);
                }
                return output;
            },
            (sudoku: Sudoku): boolean => sudoku.size <= 16,
        ),
    };

    public valueToLabels: (size: number, value1: number, value2: number) => number[];
    public labelStyle: (size: number) => (EdgeLabelStyle | null)[];
    public canBeAdded: (sudoku: Sudoku) => boolean;

    constructor(
        valueToLabels: (size: number, value1: number, value2: number) => number[],
        labelStyle: (size: number) => (EdgeLabelStyle | null)[],
        canBeAdded: (sudoku: Sudoku) => boolean,
    ) {
        this.valueToLabels = valueToLabels;
        this.labelStyle = labelStyle;
        this.canBeAdded = canBeAdded;
    }

    public build(sudoku: Sudoku): EdgeVariant {
        if (! this.canBeAdded(sudoku)) {
            throw "EdgeVariantFactory.build: Can not be added to sudoku";
        }

        let neighbours: number[][] = [];
        let labelsSet: Set<number> = new Set();
        for (let shift1 = 0; shift1 < sudoku.size; shift1++) {
            for (let shift2 = 0; shift2 < sudoku.size; shift2++) {
                let labels = this.valueToLabels(sudoku.size, shift1 + 1, shift2 + 1);
                for (let label of labels) {
                    labelsSet.add(label);

                    while (neighbours.length <= label) {
                        neighbours.push(ArrayUtils.createArray1d(sudoku.size, 0));
                    }

                    neighbours[label][shift1] |= 1 << shift2;
                    neighbours[label][shift2] |= 1 << shift1;
                }
            }
        }

        let labels = Array.from(labelsSet).sort((a, b) => a - b);

        let labelStyle = this.labelStyle(sudoku.size);

        return new EdgeVariant(sudoku, labels, labelStyle, neighbours);
    }
}