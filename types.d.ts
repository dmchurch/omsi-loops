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
    allowed?: (checkActiveList?: boolean) => number;
    visible(): boolean;
    unlocked(): boolean;
    finish(): void;
    skills?: E["skills"];
    grantsBuff?: E["grantsBuff"];
    affectedBy?: readonly string[];
    progressScaling?: ProgressScalingType;
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

type DTJHTMLTag = "span" | "div" | "ol" | "ul" | "li" | "table" | "tr" | "td";
type DTJHTML<O=unknown,C=unknown> = [DTJHTMLTag, {style?: string}, ...DTJML<O,C>[]] | [DTJHTMLTag, ...DTJML<O,C>[]];
type DTJML<O=unknown,C=unknown> = DTJHTML<O,C> | ["object", {object: O, config: C} | {object: any}] | string;
interface DTFormatter<O=any, C=any> {
    header(object: unknown, config?: C): DTJHTML<O,C> | null;
    hasBody?: (object: O, config?: C) => boolean;
    body?: (object: O, config?: C) => DTJHTML<O,C> | null;
}

declare interface Window {
    devtoolsFormatters: DTFormatter[];
}

declare const LZString = await import("lz-string");
declare const Mousetrap = await import("mousetrap");

interface NotificationOptions {
    renotify?: boolean;
}
