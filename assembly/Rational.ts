@unmanaged
export class Rational {
    static instanceCount: i64 = 0;
    static instantiationCount: i64 = 0;

    numden: v128 = i64x2(0, 1);

    @inline
    get num(): i64 {
        return i64.load(this.ptrVal, offsetof<Rational>("numden"));
    }
    set num(n: i64) {
        i64.store(this.ptrVal, n, offsetof<Rational>("numden"));
    }

    @inline
    get den(): i64 {
        return i64.load(this.ptrVal, offsetof<Rational>("numden") + sizeof<i64>());
    }
    set den(d: i64) {
        i64.store(this.ptrVal, d, offsetof<Rational>("numden") + sizeof<i64>());
    }

    _approximateValue: f64 = NaN;
    get approximateValue(): f64 {
        if (isNaN(this._approximateValue)) {
            this._approximateValue = f64(this.num) / f64(this.den);
        }
        return this._approximateValue;
    }

    isValid: u32 = 0xC0FFEE;

    @inline
    get ptr(): native<Rational> {
        return changetype<native<Rational>>(this);
    }

    @inline
    get ptrVal(): usize {
        return changetype<usize>(this);
    }

    static create(num: i64, den: i64, reduce: bool = false): Rational {
        const r = new Rational(num, den, reduce);
        // Rational.instances.add(r);
        return r;
    }

    @inline
    static deref<T>(rational: T): Rational {
        return changetype<Rational>(rational);
    }

    constructor(num: i64, den: i64, reduce: bool = false) {
        Rational.instanceCount++;
        Rational.instantiationCount++;
        this.setValue(num, den, reduce);
    }

    copy(): Rational {
        return Rational.create(this.num, this.den);
    }

    delete(): void {
        if (this.isValid === 0xC0FFEE) {
            this.isValid = 0xDECAF;
            heap.free(this.ptrVal);
            Rational.instanceCount--;
        }
        // Rational.instances.delete(this);
    }

    @inline
    setValue(num: i64 = this.num, den: i64 = this.den, reduce: bool = false): void {
        let numden: v128 = i64x2(num, den);
        if (den < 0) {
            numden = v128.neg<i64>(numden);
        }
        if (reduce)  {
            numden = Rational.reduce(numden);
        }
        this.setValueDirect(numden);
    }

    @inline
    setValueDirect(numden: v128): void {
        if (this.numden !== numden) {
            this._approximateValue = NaN;
        }
        this.numden = numden;
    }

    reduce(source: Rational = this): void {
        this.setValueDirect(Rational.reduce(source.numden));
    }

    invert(source: Rational = this): void {
        this.setValue(source.den, source.num);
    }

    negate(source: Rational = this): void {
        this.setValue(-source.num, source.den);
    }

    addRationals(lhs: Rational, rhs: Rational, reduce: bool = false): void {
        this.addRationalsDirect(lhs.num, lhs.den, rhs.num, rhs.den, reduce);
    }

    @inline
    addRationalsSemiDirect(lhs: Rational, rhsnum: i64, rhsden: i64, reduce: bool = false): void {
        return this.addRationalsDirect(lhs.num, lhs.den, rhsnum ,rhsden, reduce);
    }

    addRationalsDirect(lhsnum: i64, lhsden: i64, rhsnum: i64, rhsden: i64, reduce: bool = false): void {
        if (lhsden === rhsden) {
            this.setValue(lhsnum + rhsnum,
                            lhsden,
                            reduce);
        } else if (lhsden > rhsden && lhsden % rhsden === 0) {
            this.setValue(lhsnum + rhsnum * (lhsden / rhsden),
                            lhsden,
                            reduce);
        } else if (rhsden > lhsden && rhsden % lhsden === 0) {
            this.setValue(lhsnum * (rhsden / lhsden) + rhsnum,
                            rhsden,
                            reduce);
        } else {
            this.setValue(lhsnum * rhsden + rhsnum * lhsden,
                            lhsden * rhsden,
                            reduce);
        }
    }

    addRationalInteger(lhs: Rational, rhs: i64, reduce: bool = false): void {
        this.setValue(lhs.num + rhs * lhs.den, lhs.den, reduce);
    }

    subtractRationals(lhs: Rational, rhs: Rational, reduce: bool = false): void {
        if (lhs.den === rhs.den) {
            this.setValue(lhs.num - rhs.num,
                            lhs.den,
                            reduce);
        } else if (lhs.den > rhs.den && lhs.den % rhs.den === 0) {
            this.setValue(lhs.num - rhs.num * (lhs.den / rhs.den),
                            lhs.den,
                            reduce);
        } else if (rhs.den > lhs.den && rhs.den % lhs.den === 0) {
            this.setValue(lhs.num * (rhs.den / lhs.den) - rhs.num,
                            rhs.den,
                            reduce);
        } else {
            this.setValue(lhs.num * rhs.den - rhs.num * lhs.den,
                            lhs.den * rhs.den,
                            reduce);
        }
    }

    subtractRationalInteger(lhs: Rational, rhs: i64, reduce: bool = false): void {
        this.setValue(lhs.num - rhs * lhs.den, lhs.den, reduce);
    }

    subtractIntegerRational(lhs: i64, rhs: Rational, reduce: bool = false): void {
        this.setValue(rhs.num + lhs * rhs.den, rhs.den, reduce);
    }

    multiplyRationals(lhs: Rational, rhs: Rational, reduce: bool = false): void {
        this.multiplyRationalsDirect(lhs.numden, rhs.numden)
    }

    multiplyRationalsSemiDirect(lhs: Rational, rhsnum: i64, rhsden: i64, reduce: bool = false): void {
        this.multiplyRationalsDirect(lhs.numden, i64x2(rhsnum, rhsden), reduce);
    }

    multiplyRationalsDirect(lhs: v128, rhs: v128, reduce: bool = false): void {
        let numden: v128 = v128.mul<i64>(lhs, rhs);
        if (reduce) numden = Rational.reduce(numden);
        this.setValueDirect(numden);
    }

    multiplyRationalInteger(lhs: Rational, rhs: i64, reduce: bool = false): void {
        let numden: v128 = v128.mul<i64>(lhs.numden, i64x2(rhs, 1));
        if (reduce) numden = Rational.reduce(numden);
        this.setValueDirect(numden);
    }

    divideRationals(lhs: Rational, rhs: Rational, reduce: bool = false): void {
        let numden = rhs.num < 0 ? v128.neg<i64>(rhs.numden) : rhs.numden;
        numden = v128.swizzle(rhs.numden, v128(8,9,10,11,12,13,14,15,0,1,2,3,4,5,6,7));
        numden = v128.mul<i64>(lhs.numden, numden);
        if (reduce) numden = Rational.reduce(numden);
        this.setValueDirect(numden);
    }

    divideRationalInteger(lhs: Rational, rhs: i64, reduce: bool = false): void {
        let numden: v128 = v128.mul<i64>(lhs.numden, rhs < 0 ? i64x2(-1, -rhs) : i64x2(1, rhs));
        if (reduce) numden = Rational.reduce(numden);
        this.setValueDirect(numden);
    }

    divideIntegerRational(lhs: i64, rhs: Rational, reduce: bool = false): void {
        let numden = rhs.num < 0 ? v128.neg<i64>(rhs.numden) : rhs.numden;
        numden = v128.swizzle(rhs.numden, v128(8,9,10,11,12,13,14,15,0,1,2,3,4,5,6,7));
        numden = v128.mul<i64>(i64x2(lhs, 1), numden);
        if (reduce) numden = Rational.reduce(numden);
        this.setValueDirect(numden);
    }

    compareToRational(other: Rational): i32 {
        return this.compareToRationalDirect(other.num, other.den);
    }

    compareToRationalDirect(othernum: i64, otherden: i64): i32 {
        let a:i64 = this.num;
        let b:i64 = othernum;
        if (this.den !== otherden) {
            a *= otherden;
            b *= this.den;
        }
        return a === b ? 0
             : a > b ? 1
             : -1;
    }

    compareToInteger(other: i64): i32 {
        let a:i64 = this.num;
        let b:i64 = other * this.den;
        return a === b ? 0
             : a > b ? 1
             : -1;
    }

    compareToFloat(other: f64): i32 {
        let a:f64 = isNaN(this._approximateValue) ? f64(this.num) : this._approximateValue;
        let b:f64 = isNaN(this._approximateValue) ? other * f64(this.den) : other;
        return a === b ? 0
             : a > b ? 1
             : -1;
    }

    static gcd(u: i64, v: i64): i64 {    
        if (u === 0 || u === v) {
            return v;
        } else if (u === 1 || v === 1) {
            return 1;
        } else if (v === 0) {
            return u;
        } else {
            u = abs(u);
            v = abs(v);
    
            // shift all trailing zeroes to the right. least number of trailing zeroes is how many powers of 2 u and v share
            let c: i64, d: i64;
            u >>>= c = ctz(u);
            v >>>= d = ctz(v);
            d = min(c, d);
    
            // iterate binary euclidean algorithm to find non-2 gcd factors
            while (u !== v) {
                if (u > v) {
                    u -= v;
                    u >>>= ctz(u);
                } else {
                    v -= u;
                    v >>>= ctz(v);
                }
            }
            return u << d;
        }
    }

    static reduce(numden: v128): v128 {
        let num = v128.extract_lane<i64>(numden, 0);
        let den = v128.extract_lane<i64>(numden, 1);
        const gcd: i64 = Rational.gcd(num, den);
        if (gcd !== 1) {
            num /= gcd;
            den /= gcd;
        }
        return i64x2(num, den);
    }

    static lcm(u: i64, v: i64): i64 {
        if (u === v) return u;
        const gcd = this.gcd(u, v);
        return gcd === u ? v
             : gcd === v ? u
             : abs(u / gcd * v);
    }
}
