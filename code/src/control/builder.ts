/**
 * Class responsible for creating sudoku solution and task
 */
class Builder {
    public static builder = new Builder();

    public MAX_TRIES_SOLUTION = 500; // maximum amount of tries while creating solution
    public MAX_TRIES_TASK = 100; // maximum amount of tries while creating task

    public MAX_TRIES_BUILD = 5000; // maximum amount of tries while creating solution and task with method Builder.build()
    public MAX_TRIES_PER_SOLUTION = 50; // maximum amount of tries while creating task per solution, with method Builder.build()

    public DO_LOG = true;

    constructor() {

    }

    public log(text: string): void {
        if (this.DO_LOG) {
            console.log(text);
        }
    }

    /**
     * Try to create solution once. If solution is created successfully, it will be saved as sudoku.solution
     * @return true if solution was created successfully
     */
    private createSolutionTry(sudoku: Sudoku): boolean {
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
        sudoku.hasSolution = false;
        for (let i = 0; i < this.MAX_TRIES_SOLUTION && ! sudoku.hasSolution; i++) {
            sudoku.hasSolution = this.createSolutionTry(sudoku);
        }
        return sudoku.hasSolution;
    }

    /**
     * Create order in which the cells will be removed while creating task
     * @param size sudoku.size
     */
    private createRemoveOrder(size: number): number[] {
        let removeOrder = [];
        for (let i = 0; i < size * size; i++) {
            removeOrder.push(i);
        }
        ArrayUtils.shuffle1d(removeOrder);
        return removeOrder;
    }

    /**
     * Try to create task once from solution. If task is created successfully, it will be saved as sudoku.task
     * @return true if task was created successfully
     */
    private createTaskTry(sudoku: Sudoku): boolean {
        let task = sudoku.solution.deepcopy();
        sudoku.task = task;

        let removeOrder = this.createRemoveOrder(sudoku.size);
        for (let remove of removeOrder) {
            let removedValue = task.board[remove];
            task.board[remove] = sudoku.fullBinary;

            let solutionCount = Solver.solver.countSolutionsUnsolved(task);
            switch (solutionCount) {
                case 0:
                    throw "ERROR: Solver.createTaskTry found 0 solutions, which should not be possible";
                case 2:
                    task.board[remove] = removedValue;
                    break;
                default:
                    break;
            }
        }

        return true;
    }

    /**
     * Repeatedly try to create task from solution.
     * If task is created successfully, it will be saved in sudoku.task, return true and sudoku.hasTask === true
     */
    public createTask(sudoku: Sudoku): boolean {
        if (! sudoku.hasSolution) {
            throw "ERROR: Builder.createTask() requires sudoku.hasSolution, but it is false";
        }
        sudoku.hasTask = false;
        for (let i = 0; i < this.MAX_TRIES_TASK && ! sudoku.hasTask; i++) {
            sudoku.hasTask = this.createTaskTry(sudoku);
        }
        return sudoku.hasTask;
    }

    /**
     * Repeatedly try to create solution and task
     * If solution and task are created successfully, they will be saved in sudoku.solution and sudoku.task,
     * return true and sudoku.hasSolution === true and sudoku.hasTask === true
     */
    public build(sudoku: Sudoku): boolean {
        sudoku.hasTask = false;
        let i = 0;
        let totalJ = 0;
        for (; i < this.MAX_TRIES_BUILD && ! sudoku.hasTask;) {
            sudoku.hasSolution = false;
            for (; i < this.MAX_TRIES_BUILD && ! sudoku.hasSolution; i++) {
                sudoku.hasSolution = this.createSolutionTry(sudoku);
            }
            if (sudoku.hasSolution) {
                for (let j = 0; j < this.MAX_TRIES_PER_SOLUTION && i < this.MAX_TRIES_BUILD && ! sudoku.hasTask; j++) {
                    sudoku.hasTask = this.createTaskTry(sudoku);
                    i ++;
                    totalJ ++;
                }
            }
        }
        this.log(`BUILD: S=${i - totalJ - 1} T=${totalJ - 1} R=${sudoku.hasTask}`);
        return sudoku.hasTask;
    }
}