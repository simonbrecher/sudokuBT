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
        for (let i = 0; i < array.length; i++) {
            copy.push(array[i]);
        }
        return copy;
    }

    public static deepcopyArray2d(array: any[][]): any[][] {
        let copy: any[][] = [];
        for (let y = 0; y < array.length; y++) {
            copy.push([]);
            for (let x = 0; x < array[y].length; x++) {
                copy[y].push(array[y][x]);
            }
        }
        return copy;
    }
}