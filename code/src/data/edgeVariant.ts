class EdgeVariant {
    public labels: number[];
    public labelStyle: (EdgeLabelStyle | null)[];
    public neighbours: number[][];

    public board: number[][][];

    constructor(size: number, labels: number[], labelStyles: (EdgeLabelStyle | null)[], neighbours: number[][]) {
        this.labels = labels;
        this.labelStyle = labelStyles;
        this.neighbours = neighbours;

        this.board = [
            ArrayUtils.createArray2d(size, size - 1, -1),
            ArrayUtils.createArray2d(size - 1, size, -1),
        ];
    }
}