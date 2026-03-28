class EdgeVariant {
    public labels: number[];
    public labelStyle: (EdgeLabelStyle | null)[];
    public neighbours: number[][];
    public neighboursInverse: number[][];

    public board: number[][][];

    constructor(size: number, labels: number[], labelStyles: (EdgeLabelStyle | null)[], neighbours: number[][]) {
        this.labels = labels;
        this.labelStyle = labelStyles;
        this.neighbours = neighbours;

        this.neighboursInverse = [];
        for (let n of this.neighbours) {
            let add = ArrayUtils.createArray1d(size, 0);
            for (let i = 0; i < size; i++) {
                for (let j = 0; j < size; j++) {
                    if ((n[i] & 1 << j) != 0) {
                        add[j] |= 1 << i;
                    }
                }
            }
            this.neighboursInverse.push(add);
        }


        this.board = [
            ArrayUtils.createArray2d(size, size - 1, -1),
            ArrayUtils.createArray2d(size - 1, size, -1),
        ];
    }

    public getNeighbour(label: number, shift: number, isNotInverse: boolean): number {
        return (isNotInverse ? this.neighbours : this.neighboursInverse)[label][shift];
    }
}