class BinaryUtils {
    /**
     * Create 32b integer with size smallest bits equal to 1
     */
    public static createFullBinary(size: number): number {
        return size === 32 ? -1 : ((1 << size) - 1);
    }

    /**
     * Count number of bits in 32b integer, that have value 1
     */
    public static countBits32(binary: number): number {
        binary = (binary >>> 1 & 0x55555555) + (binary & 0x55555555);
        binary = (binary >>> 2 & 0x33333333) + (binary & 0x33333333);
        binary = (binary >>> 4) + binary & 0x0F0F0F0F;
        binary = (binary >>> 8) + binary;
        return (binary >>> 16) + binary & 0x3F;
    }

    /**
     * Check if 32b integer has exactly one bit with value 1
     */
    public static has1bit32(binary: number): boolean {
        return binary !== 0 && (binary & (binary - 1)) === 0;
    }

    public static binaryToShifts32(binary: number): number[] {
        let shifts = [];
        let shift = 0;
        while (binary !== 0) {
            if ((binary & 1) !== 0) {
                shifts.push(shift);
            }
            binary >>>= 1;
            shift ++;
        }
        return shifts;
    }
}