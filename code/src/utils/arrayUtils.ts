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

    public static add1d(output: any[], add: any[]): void {
        for (let value of add) {
            output.push(value);
        }
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
}