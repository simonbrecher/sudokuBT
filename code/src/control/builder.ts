/**
 * Class responsible for creating sudoku solution and task
 */
class Builder {
    public static builder = new Builder();

    public MAX_TRIES_SOLUTION = 1;
    public MAX_TRIES_TASK = 500;

    constructor() {

    }

    /**
     * Try to create solution once. If solution is created successfully, it will be saved as sudoku.solution
     * @return true if solution was created successfully
     */
    public createSolutionTry(sudoku: Sudoku): boolean {
        let solution = sudoku.solution;
        solution.board = ArrayUtils.createArray1d(sudoku.size * sudoku.size, sudoku.fullBinary);

        while (true) {
            Solver.solver.solve(solution);
            switch (solution.countSolutions()) {
                case 0:
                    return false;
                case 1:
                    return true;
                default:
                    let split = BinaryUtils.getIndexWithLeastBitsButAtLeast2(solution.board);
                    solution.board[split] = BinaryUtils.chooseRandomBit(solution.board[split]);
            }
        }
    }

    /**
     * Repeatedly try to create solution.
     * If solution is created successfully, it will be saved in sudoku.solution, return true and sudoku.hasSolution === true
     */
    public createSolution(sudoku: Sudoku): boolean {
        let success = false;
        for (let i = 0; i < this.MAX_TRIES_SOLUTION && ! success; i++) {
            success = this.createSolutionTry(sudoku);
        }
        sudoku.hasSolution = success;
        return success;
    }
}