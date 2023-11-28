/**
 * Class representing one sudoku puzzles as it was configured by user.
 */
class Sudoku {
    public size: number;

    public readonly regions: Regions;

    constructor(size: number) {
        this.size = size;
        this.regions = new Regions(this);
    }
}