declare interface Action<const N, const E> {
    // provided as extras in constructor:
    type: E["type"];
    expMult: E["expMult"];
    townNum: E["townNum"];
    story?: (completed: number) => void,
    storyReqs?: (storyNum: number) => boolean;
    stats: E["stats"];
    canStart(loopCounter?: number): boolean;
    cost?: () => void,
    manaCost(): number;
    goldCost?: () => number;
    allowed?: () => number;
    visible(): boolean;
    unlocked(): boolean;
    finish(): void;
    skills?: E["skills"];
    grantsBuff?: E["grantsBuff"];
    affectedBy?: readonly string[];
}

declare interface MultipartAction<const N, const E> {
    segments: number;

    loopStats: E["loopStats"];
    loopCost(segment: number, loopCounter?: number): number;
    tickProgress(offset: number, loopCounter?: number, totalCompletions?: number): number;
    segmentFinished?: (loopCounter?: number) => void;
    loopsFinished(loopCounter?: number): void;
    getPartName(): string;
    completedTooltip?: () => string;
}

declare interface DungeonAction<const N, const E> {

}

declare interface TrialAction<const N, const E> {
    floorReward(): ReturnType<E["floorReward"]>;
    baseProgress(): number;
    baseScaling: E["baseScaling"];
    exponentScaling?: E["exponentScaling"];
}

declare interface AssassinAction<const N, const E> {

}

declare const LZString = await import("lz-string");

/**
 * RationalPtr is a fake type which does not exist. It is actually a number.
 */
declare interface RationalPtr {
    #brand;
}
declare interface WasmUtilities {
    rational_new(num = 0, den = 1, reduce = false): RationalPtr;
    rational_delete(rational: RationalPtr): void;
    rational_count(): number;
    rational_newcount(): number;
    rational_num(rational: RationalPtr): number;
    rational_setnum(rational: RationalPtr, num: number): void;
    rational_den(rational: RationalPtr): number;
    rational_setden(rational: RationalPtr, den: number): void;
    rational_approximateValue(rational: RationalPtr): number;
    rational_setValue(rational: RationalPtr, num?: number, den?: number, reduce = false): void;
    rational_reduce(rational: RationalPtr, source?: RationalPtr): void;
    rational_negate(rational: RationalPtr, source?: RationalPtr): void;
    rational_invert(rational: RationalPtr, source?: RationalPtr): void;
    rational_addRR(rational: RationalPtr, lhs?: RationalPtr, rhs?: RationalPtr, reduce = false): void;
    rational_addRD(rational: RationalPtr, lhs?: RationalPtr, rhsnum: number, rhsden: number, reduce = false): void;
    rational_addDD(rational: RationalPtr, lhsnum: number, lhsden: number, rhsnum: number, rhsden: number, reduce = false): void;
    rational_addRI(rational: RationalPtr, lhs: RationalPtr, rhs: number, reduce = false): void;
    rational_subRR(rational: RationalPtr, lhs?: RationalPtr, rhs?: RationalPtr, reduce = false): void;
    rational_subRI(rational: RationalPtr, lhs: RationalPtr, rhs: number, reduce = false): void;
    rational_subIR(rational: RationalPtr, lhs: number, rhs?: RationalPtr, reduce = false): void;
    rational_mulRR(rational: RationalPtr, lhs?: RationalPtr, rhs?: RationalPtr, reduce = false): void;
    rational_mulRD(rational: RationalPtr, lhs?: RationalPtr, rhsnum: number, rhsden: number, reduce = false): void;
    rational_mulDD(rational: RationalPtr, lhsnum: number, lhsden: number, rhsnum: number, rhsden: number, reduce = false): void;
    rational_mulRI(rational: RationalPtr, lhs: RationalPtr, rhs: number, reduce = false): void;
    rational_divRR(rational: RationalPtr, lhs?: RationalPtr, rhs?: RationalPtr, reduce = false): void;
    rational_divRI(rational: RationalPtr, lhs: RationalPtr, rhs: number, reduce = false): void;
    rational_divIR(rational: RationalPtr, lhs: number, rhs?: RationalPtr, reduce = false): void;
    rational_cmpRR(rational: RationalPtr, other: RationalPtr): number;
    rational_cmpRD(rational: RationalPtr, othernum: number, otherden: number): number;
    rational_cmpRI(rational: RationalPtr, other: number): number;
    rational_cmpRF(rational: RationalPtr, other: number): number;
    gcd(u: number, v: number): number,
  }
  
  declare let _wasm: WasmUtilities;