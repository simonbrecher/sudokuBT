/**
 * Class representing one sudoku puzzles as it was configured by user.
 */
class Sudoku {
    /**
     * Size of the Sudoku - number of rows/columns/numbers.
     */
    public size: number;

    /**
     * Binary representation of all candidates in a cell, which is just this.size 1-bits
     * It is equal to (1 << this.size) - 1, for this.size == 9 it is 0b111111111
     */
    public readonly fullBinary;

    /**
     * Reference to the Regions object.
     */
    public readonly regions: Regions;
    /**
     * EdgeVariant object, null if no Edge variant was added
     */
    private edgeVariant: EdgeVariant | null = null;

    /**
     * Current state of Sudoku while solving, or Sudoku solution, depending on how you want to use it
     */
    public solution: State;
    /**
     * Initial state of Sudoku
     */
    public task: State;

    /**
     * Create empty Sudoku object by size
     * @param size Number of rows/columns/numbers.
     */
    constructor(size: number) {
        if (size < 2 || size > 31) {
            throw `INVALID SIZE ERROR: Sudoku.size must be between 2 and 31, it cannot be: ${size}`;
        }
        this.size = size;
        this.fullBinary = BinaryUtils.createFullBinary(this.size);
        this.regions = new Regions(this.size);

        this.solution = new State(ArrayUtils.createArray1d(this.size * this.size, this.fullBinary), this);
        this.task = new State(ArrayUtils.createArray1d(this.size * this.size, this.fullBinary), this);
    }

    /**
     * Set EdgeVariant by EdgeVariantFactory, null if you want to remove it.
     * @param factory EdgeVariantFactory used to create the EdgeVariant by EdgeVariantFactory.build
     */
    public setEdgeVariant(factory: EdgeVariantFactory | null): void {
        if (factory === null) {
            this.edgeVariant = null;
        } else {
            this.edgeVariant = factory.build(this);
        }
    }

    /**
     * Set EdgeVariant by already finished EdgeVariant object, null if you want to remove it.
     * @param variant Edge variant to add.
     */
    public setFinishedEdgeVariant(variant: EdgeVariant | null): void {
        this.edgeVariant = variant;
    }

    /**
     * Returns the EdgeVariant object, null if no Edge variant was added.
     */
    public getEdgeVariant(): EdgeVariant | null {
        return this.edgeVariant;
    }

    /**
     * Does Sudoku have Edge variant?
     */
    public hasEdgeVariant(): boolean {
        return this.edgeVariant !== null;
    }
}