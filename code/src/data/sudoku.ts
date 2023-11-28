/**
 * Class representing one sudoku puzzles as it was configured by user.
 */
class Sudoku {
    public size: number;

    public readonly fullBinary;

    public readonly regions: Regions;

    public solution: State;
    public task: State;

    constructor(size: number) {
        if (size < 2 || size > 31) {
            throw `INVALID SIZE ERROR: Sudoku.size must be between 2 and 31, it cannot be: ${size}`;
        }
        this.size = size;
        this.fullBinary = BinaryUtils.createFullBinary(size);
        this.regions = new Regions(this);

        this.solution = new State(ArrayUtils.createArray1d(size * size, this.fullBinary), this);
        this.task = new State(ArrayUtils.createArray1d(size * size, this.fullBinary), this);
    }
}