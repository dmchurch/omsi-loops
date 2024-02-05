import { Rational } from "./Rational";

export function rational_new(num: f64, den: f64): native<Rational> {
    if (isNaN(num)) { // NaN is wasm for undefined, I decided
        num = 0;
    }
    if (isNaN(den)) {
        den = 1;
    }
    let r = Rational.create(i64(num), i64(den));

    return r.ptr;
}

export function rational_delete(rational: native<Rational>): void {
    Rational.deref(rational).delete();
}

export function rational_count(): u32 {
    return u32(Rational.instanceCount);
}

export function rational_newcount(): u32 {
    return u32(Rational.instantiationCount);
}

export function rational_num(rational: native<Rational>): f64 {
    return f64(Rational.deref(rational).num);
}

export function rational_setnum(rational: native<Rational>, num: f64): void {
    Rational.deref(rational).num = i64(num);
}

export function rational_den(rational: native<Rational>): f64 {
    return f64(Rational.deref(rational).den);
}

export function rational_setden(rational: native<Rational>, den: f64): void {
    Rational.deref(rational).den = i64(den);
}

export function rational_approximateValue(rational: native<Rational>): f64 {
    return Rational.deref(rational).approximateValue;
}

export function rational_setValue(rational: native<Rational>, num: f64, den: f64, reduce: bool): void {
    const r = Rational.deref(rational);
    Rational.deref(rational).setValue(isNaN(num) ? r.num : i64(num),
                                      isNaN(den) ? r.den : i64(den),
                                      reduce);
}

export function rational_reduce(rational: native<Rational>, source: usize): void {
    const r = Rational.deref(rational);
    r.reduce(source === 0 ? r : Rational.deref(source));
}

export function rational_negate(rational: native<Rational>, source: usize): void {
    const r = Rational.deref(rational);
    r.negate(source === 0 ? r : Rational.deref(source));
}

export function rational_invert(rational: native<Rational>, source: usize): void {
    const r = Rational.deref(rational);
    r.invert(source === 0 ? r : Rational.deref(source));
}

export function rational_addRR(rational: native<Rational>, lhs: usize, rhs: usize, reduce: bool): void {
    const r = Rational.deref(rational);
    r.addRationals(lhs === 0 ? r : Rational.deref(lhs), rhs === 0 ? r : Rational.deref(rhs), reduce);
}

export function rational_addRD(rational: native<Rational>, lhs: usize, rhsnum: f64, rhsden: f64, reduce: bool): void {
    const r = Rational.deref(rational);
    r.addRationalsSemiDirect(lhs === 0 ? r : Rational.deref(lhs), i64(rhsnum), i64(rhsden), reduce);
}

export function rational_addDD(rational: native<Rational>, lhsnum: f64, lhsden: f64, rhsnum: f64, rhsden: f64, reduce: bool): void {
    const r = Rational.deref(rational);
    r.addRationalsDirect(i64(lhsnum), i64(lhsden), i64(rhsnum), i64(rhsden), reduce);
}

export function rational_addRI(rational: native<Rational>, lhs: usize, rhs: f64, reduce: bool): void {
    const r = Rational.deref(rational);
    r.addRationalInteger(lhs === 0 ? r : Rational.deref(lhs), i64(rhs), reduce);
}

export function rational_subRR(rational: native<Rational>, lhs: usize, rhs: usize, reduce: bool): void {
    const r = Rational.deref(rational);
    r.subtractRationals(lhs === 0 ? r : Rational.deref(lhs), rhs === 0 ? r : Rational.deref(rhs), reduce);
}

export function rational_subRI(rational: native<Rational>, lhs: usize, rhs: f64, reduce: bool): void {
    const r = Rational.deref(rational);
    r.subtractRationalInteger(lhs === 0 ? r : Rational.deref(lhs), i64(rhs), reduce);
}

export function rational_subIR(rational: native<Rational>, lhs: f64, rhs: usize, reduce: bool): void {
    const r = Rational.deref(rational);
    r.subtractIntegerRational(i64(lhs), rhs === 0 ? r : Rational.deref(rhs), reduce);
}

export function rational_mulRR(rational: native<Rational>, lhs: usize, rhs: usize, reduce: bool): void {
    const r = Rational.deref(rational);
    r.multiplyRationals(lhs === 0 ? r : Rational.deref(lhs), rhs === 0 ? r : Rational.deref(rhs), reduce);
}

export function rational_mulRD(rational: native<Rational>, lhs: usize, rhsnum: f64, rhsden: f64, reduce: bool): void {
    const r = Rational.deref(rational);
    r.multiplyRationalsSemiDirect(lhs === 0 ? r : Rational.deref(lhs),
                                  i64(rhsden < 0 ? -rhsnum : rhsnum),
                                  i64(rhsden < 0 ? -rhsden : rhsden),
                                  reduce);
}

export function rational_mulDD(rational: native<Rational>, lhsnum: f64, lhsden: f64, rhsnum: f64, rhsden: f64, reduce: bool): void {
    const r = Rational.deref(rational);
    const lhs = i64x2(i64(lhsden < 0 ? -lhsnum : lhsnum), i64(lhsden < 0 ? -lhsden : lhsden));
    const rhs = i64x2(i64(rhsden < 0 ? -rhsnum : rhsnum), i64(rhsden < 0 ? -rhsden : rhsden));
    r.multiplyRationalsDirect(lhs, rhs, reduce);
}

export function rational_mulRI(rational: native<Rational>, lhs: usize, rhs: f64, reduce: bool): void {
    const r = Rational.deref(rational);
    r.multiplyRationalInteger(lhs === 0 ? r : Rational.deref(lhs), i64(rhs), reduce);
}

export function rational_divRR(rational: native<Rational>, lhs: usize, rhs: usize, reduce: bool): void {
    const r = Rational.deref(rational);
    r.divideRationals(lhs === 0 ? r : Rational.deref(lhs), rhs === 0 ? r : Rational.deref(rhs), reduce);
}

export function rational_divRI(rational: native<Rational>, lhs: usize, rhs: f64, reduce: bool): void {
    const r = Rational.deref(rational);
    r.divideRationalInteger(lhs === 0 ? r : Rational.deref(lhs), i64(rhs), reduce);
}

export function rational_divIR(rational: native<Rational>, lhs: f64, rhs: usize, reduce: bool): void {
    const r = Rational.deref(rational);
    r.divideIntegerRational(i64(lhs), rhs === 0 ? r : Rational.deref(rhs), reduce);
}

export function rational_cmpRR(rational: native<Rational>, other: native<Rational>): i32 {
    return Rational.deref(rational).compareToRational(Rational.deref(other));
}

export function rational_cmpRD(rational: native<Rational>, othernum: f64, otherden: f64): i32 {
    return Rational.deref(rational).compareToRationalDirect(i64(othernum), i64(otherden));
}

export function rational_cmpRI(rational: native<Rational>, other: f64): i32 {
    return (Rational.deref(rational)).compareToInteger(i64(other));
}

export function rational_cmpRF(rational: native<Rational>, other: f64): i32 {
    return (Rational.deref(rational)).compareToFloat(other);
}

export function gcd(u: f64, v: f64): f64 { 
    if (isNaN(u) || isNaN(v)) return NaN;
    return f64(Rational.gcd(i64(u), i64(v)));
}
