class ArrayUtils {
    public static createArray1d(size: number, value: any): any[] {
        let array = [];
        for (let i = 0; i < size; i++) {
            array.push(value);
        }
        return array;
    }

    public static createArray2d(height: number, width: number, value: any): any[][] {
        let array: any[][] = [];
        for (let y = 0; y < height; y++) {
            array.push([]);
            for (let x = 0; x < width; x++) {
                array[y].push(value);
            }
        }
        return array;
    }

    public static deepcopyArray1d(array: any[]): any[] {
        let copy = [];
        for (let value of array) {
            copy.push(value);
        }
        return copy;
    }

    public static deepcopyArray2d(array: any[][]): any[][] {
        let copy: any[][] = [];
        for (let row of array) {
            copy.push(this.deepcopyArray1d(row));
        }
        return copy;
    }

    public static equals1d(array1: any[], array2: any[]): boolean {
        if (array1.length !== array2.length) {
            return false;
        }
        for (let i = 0; i < array1.length; i++) {
            if (array1[i] !== array2[i]) {
                return false;
            }
        }
        return true;
    }

    public static add1d(output: any[], add: any[]): void {
        for (let value of add) {
            output.push(value);
        }
    }

    public static range1d(start: number, end: number, step: number = 1): number[] {
        let output = [];
        if (step > 0) {
            for (let i = start; i < end; i+=step) {
                output.push(i);
            }
        } else if (step < 0) {
            for (let i = start; i > end; i+=step) {
                output.push(i);
            }
        } else {
            throw "ArrayUtils.range1d(), step cannot be 0.";
        }
        return output
    }

    public static shuffle1d(array: any[]): void {
        for (let i = 1; i < array.length; i++) {
            let randomNumber = Math.floor(Math.random() * (i + 1));
            let temp = array[i];
            array[i] = array[randomNumber];
            array[randomNumber] = temp;
        }
    }

    public static scale2dArray(array: number[], height: number, width: number, factorY: number, factorX: number): number[] {
        let output = ArrayUtils.createArray1d(factorY * height * factorX * width, undefined);
        for (let mainY = 0; mainY < height; mainY++) {
            for (let mainX = 0; mainX < width; mainX++) {
                for (let subY = 0; subY < factorY; subY++) {
                    for (let subX = 0; subX < factorX; subX++) {
                        let y = mainY * factorY + subY;
                        let x = mainX * factorX + subX;
                        output[y * (width * factorX) + x] = array[mainY * width + mainX];
                    }
                }
            }
        }
        return output;
    }

    public static invertArray1d(array: number[]): number[] {
        let output = ArrayUtils.createArray1d(array.length, null);
        for (let i = 0; i < array.length; i++) {
            output[array[i]] = i;
        }
        return output;
    }

    public static removeValue(array: number[], value: number): number[] {
        let output = [];
        for (let add of array) {
            if (add != value) {
                output.push(add);
            }
        }
        return output;
    }

    /**
     * Generate random permutation using Fisher–Yates shuffle.
     */
    public static getRandomPermutation(size: number): number[] {
        let output: number[] = [];
        for (let i = 0; i < size; i++) {
            output.push(i);
        }
        this.shuffle(output);
        return output;
    }

    /**
     * Shuffle array using Fisher-Yates shuffle.
     */
    public static shuffle(array: any[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            let random = Math.floor(Math.random() * (i + 1));
            let x = array[random];
            array[random] = array[i];
            array[i] = x;
        }
    }

    /**
     * Choose random element from array.
     */
    public static choice(array: any[]): any {
        let random = Math.floor(Math.random() * array.length);
        return array[random];
    }

    /**
     * Choose multiple items from array and return new array with same order.
     */
    public static choices(array: any[], amount: number): any[] {
        let output = [];
        let total = array.length;
        let choices = amount;
        for (let value of array) {
            let probability = choices / total;
            let chosen = Math.random() < probability;
            if (chosen) {
                output.push(value);
                choices --;
            }
            total --;
        }
        return output;
    }

    public static union(array1: any[], array2: any[]): any[] {
        let output = [];
        for (let value of array1) {
            output.push(value);
        }
        for (let value of array2) {
            output.push(value);
        }
        return output;
    }

    public static setIntersection(sets: Set<any>[]): Set<any> {
        if (sets.length == 0) {
            return new Set();
        }
        return sets.reduce((acc, set) =>
            new Set(Array.from(acc).filter(x => set.has(x)))
        );
    }
}