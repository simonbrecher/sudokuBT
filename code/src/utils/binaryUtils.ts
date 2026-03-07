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

    public static shiftsToBinary(shifts: number[]) {
        let binary = 0;
        for (let shift of shifts) {
            binary |= 1 << shift;
        }
        return binary;
    }

    public static binaryToShifts(binaries: number[]): number[][] {
        let output = [];
        for (let binary of binaries) {
            output.push(this.binaryToShifts32(binary));
        }
        return output;
    }

    /**
     * Choose position with least bits with value 1, from positions that have at least two bits with value 1.
     */
    public static getIndexWithLeastBitsButAtLeast2(binaries: number[]): number {
        let output = null;
        let leastBitsCount = 33;
        for (let i = 0; i < binaries.length; i++) {
            let bitCount = BinaryUtils.countBits32(binaries[i]);
            if (bitCount > 1 && bitCount < leastBitsCount) {
                leastBitsCount = bitCount;
                output = i;
            }
        }
        if (output === null) {
            throw "ERROR: No index with more than one 1-bit.";
        }
        return output;
    }

    /**
     * Create 32b integer that has 1 on random position, where there was 1 in binary
     * If binary === 0, return 0
     */
    public static chooseRandomBit(binary: number): number {
        if (binary === 0) {
            return 0;
        }
        let bits = [];
        while (binary !== 0) {
            let lastBit = binary & ~ (binary - 1);
            bits.push(lastBit);
            binary &= ~ lastBit;
        }
        return bits[Math.floor(Math.random() * bits.length)];
    }

    public static or(binaries: number[]): number {
        let output = 0;
        for (let b of binaries) {
            output |= b;
        }
        return output;
    }
}