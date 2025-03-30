// @ts-check
"use strict";

/**
 * ActionLoopType is an enum that describes what the "loops" property means. Actions without
 * a loopsType property default to the classic behavior of "actions" for non-multipart actions
 * or "maxEffort" for multipart actions.
 * 
 * The comments here assume X as the number specified in "loops" and M as the manaCost() of the
 * action in question.
 * @typedef {"actions"      // perform X actions and then stop
 *         | "maxMana"      // Multipart actions: Spend no more than X * M adjusted mana, stop before starting an action that would overflow
 *         | "maxEffort"    // Multipart actions: Spend no more than X * M original mana, stop before starting an action that would overflow
 *         | "knownGood"    // Limited actions: perform at most X actions, only targeting known-good items
 *         | "unchecked"    // Limited actions: perform at most X actions, only targeting unknown items
 * } ActionLoopType
 */

/** 
 * {@link CurrentActionEntry} is the extra data added to an {@link Action} when it is part of the current loop.
 * {@link AnyActionEntry} is the resulting typedef.
 * 
 * @typedef CurrentActionEntry
 * @prop {ActionLoopType} loopsType
 * @prop {number} loops
 * @prop {number} loopsLeft
 * @prop {number} extraLoops
 * @prop {number} ticks
 * @prop {number} [adjustedTicks]
 * @prop {number} [rawTicks]
 * @prop {number} manaUsed
 * @prop {number} lastMana
 * @prop {number} manaRemaining
 * @prop {number} goldRemaining
 * @prop {number} timeSpent
 * @prop {number} effectiveTimeElapsed
 * @prop {string} [errorMessage]
 * }} 
 * @typedef {CurrentActionEntry & AnyActionType} AnyActionEntry
 */

/**
 * NextActionEntry is the shorthand object stored in {@link Actions.next} array. It does not have an Action prototype.
 * 
 * @typedef NextActionEntry
 * @prop {ActionName} name
 * @prop {number}     loops
 * @prop {boolean}    disabled
 * @prop {boolean}    [collapsed]
 * @prop {ActionLoopType} [loopsType]
 * @prop {number}     [actionId]
 */

/** @param {AnyActionEntry} action @returns {action is MultipartAction} */
function isMultipartAction(action) {
    return 'loopStats' in action;
}

class Actions {
    /** @type {AnyActionEntry[]} */
    current = [];
    /** @readonly @type {readonly Readonly<NextActionEntry>[]} */
    next = [];
    /** @type {readonly Readonly<NextActionEntry>[]} */
    #nextLast;
    addAmount = 1;

    get #writableNext() {
        return /** @type {NextActionEntry[]} */(this.next);
    }

    totalNeeded = 0;
    completedTicks = 0;
    currentPos = 0;
    timeSinceLastUpdate = 0;
    /** @type {AnyActionEntry} */
    currentAction;

    static {
        Data.omitProperties(this.prototype, ["next"]);
    }

    tick(availableMana) {
        availableMana ??= 1;
        availableMana = Mana.floor(availableMana);

        const curAction = this.getNextValidAction();
        // out of actions
        if (!curAction) {
            shouldRestart = true;
            return 0;
        }
        this.currentAction = curAction;

        // this is how much mana is actually getting spent during this call to tick().
        let manaToSpend = availableMana;

        // restrict to the number of ticks it takes to get to a next talent level.
        manaToSpend = Math.min(manaToSpend, getMaxTicksForAction(curAction, true));
        // restrict to the number of ticks it takes to finish the current action
        manaToSpend = Math.min(manaToSpend, Mana.ceil(curAction.adjustedTicks - curAction.ticks));
        // just in case
        if (manaToSpend < 0) manaToSpend = 0;

        // we think we'll be spending manaToSpend, but we might not actually finish out the whole
        // amount if this is a multi-part progress action.

        // exp needs to get added AFTER checking multipart progress, since this tick() call may
        // represent any number of ticks, all of which process at the existing levels

        // only for multi-part progress bars
        if (isMultipartAction(curAction)) {
            let loopCosts = {};
            let loopCounter = towns[curAction.townNum][`${curAction.varName}LoopCounter`];
            const loopStats = curAction.loopStats;

            function loopCost(segment) {
                // @ts-ignore
                return loopCosts[segment] ??= curAction.loopCost(segment, loopCounter);
            }

            let segment = 0;
            let curProgress = towns[curAction.townNum][curAction.varName];
            while (curProgress >= loopCost(segment)) {
                curProgress -= loopCost(segment);
                segment++;
            }
            // segment is 0,1,2

            // thanks to Gustav on the discord for the multipart loop code
            let manaLeft = manaToSpend;
            // don't go any further than will get to the next level of whatever stat is being used for this segment
            let manaLeftForCurrentSegment = Math.min(manaLeft, getMaxTicksForStat(curAction, curAction.loopStats[segment], false));
            manaToSpend = 0;
            const tickMultiplier = (curAction.manaCost() / curAction.adjustedTicks);
            let partUpdateRequired = false;

            manaLoop:
            while (manaLeftForCurrentSegment > 0 && curAction.canMakeProgress(segment)) {
                //const toAdd = curAction.tickProgress(segment) * (curAction.manaCost() / curAction.adjustedTicks);
                const loopStat = stats[loopStats[(loopCounter + segment) % loopStats.length]];
                const progressMultiplier = curAction.tickProgress(segment) * tickMultiplier * loopStat.effortMultiplier;
                const toAdd = Math.min(
                    manaLeftForCurrentSegment * progressMultiplier, // how much progress would we make if we spend all available mana?
                    loopCost(segment) - curProgress // how much progress would it take to complete this segment?
                );
                const manaUsed = toAdd / progressMultiplier;
                manaLeftForCurrentSegment -= manaUsed;
                manaLeft -= manaUsed;
                manaToSpend += manaUsed;
                // console.log("using: "+curAction.loopStats[(towns[curAction.townNum][curAction.varName + "LoopCounter"]+segment) % curAction.loopStats.length]+" to add: " + toAdd + " to segment: " + segment + " and part " +towns[curAction.townNum][curAction.varName + "LoopCounter"]+" of progress " + curProgress + " which costs: " + curAction.loopCost(segment));
                towns[curAction.townNum][curAction.varName] += toAdd;
                curProgress += toAdd;
                while (curProgress >= loopCost(segment)) {
                    curProgress -= loopCost(segment);
                    // segment finished
                    if (curAction.segmentFinished) {
                        curAction.segmentFinished();
                        partUpdateRequired = true;
                    }
                    if (segment === curAction.segments - 1) {
                        // part finished
                        if (curAction.name === "Dark Ritual" && towns[curAction.townNum][curAction.varName] >= 4000000) setStoryFlag("darkRitualThirdSegmentReached");
                        if (curAction.name === "Imbue Mind" && towns[curAction.townNum][curAction.varName] >= 700000000) setStoryFlag("imbueMindThirdSegmentReached");
                        towns[curAction.townNum][curAction.varName] = 0;
                        loopCounter = towns[curAction.townNum][`${curAction.varName}LoopCounter`] += curAction.segments;
                        towns[curAction.townNum][`total${curAction.varName}`]++;
                        segment -= curAction.segments;
                        loopCosts = {};
                        curAction.loopsFinished();
                        partUpdateRequired = true;
                        if (curAction.canStart && !curAction.canStart()) {
                            this.completedTicks += curAction.ticks;
                            view.requestUpdate("updateTotalTicks", null);
                            curAction.loopsLeft = 0;
                            curAction.ticks = 0;
                            curAction.manaRemaining = timeNeeded - timer;
                            curAction.goldRemaining = resources.gold;
                            curAction.finish();
                            totals.actions++;
                            break manaLoop;
                        }
                        towns[curAction.townNum][curAction.varName] = curProgress;
                    }
                    segment++;
                    manaLeftForCurrentSegment = Math.min(manaLeft, getMaxTicksForStat(curAction, curAction.loopStats[segment], false));
                }
            }

            view.requestUpdate("updateMultiPartSegments", curAction);
            if (partUpdateRequired) {
                view.requestUpdate("updateMultiPart", curAction);
            }
        }

        curAction.ticks += manaToSpend;
        curAction.manaUsed += manaToSpend;
        curAction.timeSpent += manaToSpend / baseManaPerSecond / getSpeedMult();
        curAction.effectiveTimeElapsed += manaToSpend / baseManaPerSecond / getSpeedMult();

        // exp gets added here, where it can factor in to adjustTicksNeeded
        addExpFromAction(curAction, manaToSpend);

        if (this.currentPos === this.current.length - 1 && options.fractionalMana && curAction.ticks < curAction.adjustedTicks && curAction.ticks >= curAction.adjustedTicks - 0.005) {
            // this is close enough to finished that it shows as e.g. 250.00/250.00 mana used for action
            curAction.ticks = curAction.adjustedTicks;
        }

        if (curAction.ticks >= curAction.adjustedTicks) {
            curAction.ticks = 0;
            curAction.loopsLeft--;

            curAction.lastMana = curAction.rawTicks;
            this.completedTicks += curAction.adjustedTicks;
            curAction.finish();
            totals.actions++;
            curAction.manaRemaining = timeNeeded - timer;
            
            if (curAction.cost) {
                curAction.cost();
            }
            curAction.goldRemaining = resources.gold;

            this.adjustTicksNeeded();
            view.requestUpdate("updateCurrentActionLoops", this.currentPos);
        }
        view.requestUpdate("updateCurrentActionBar", this.currentPos);
        if (curAction.loopsLeft === 0) {
            if (!this.current[this.currentPos + 1] && options.repeatLastAction &&
                (!curAction.canStart || curAction.canStart()) && curAction.townNum === curTown) {
                curAction.loopsLeft++;
                curAction.loops++;
                curAction.extraLoops++;
            } else {
                this.currentPos++;
            }
        }

        return manaToSpend;
    }

    /** @returns {CurrentActionEntry & Action | CurrentActionEntry & MultipartAction} */
    getNextValidAction() {
        let curAction = this.current[this.currentPos];
        if (!curAction) {
            return curAction;
        }
        if (curAction.allowed && getNumOnCurList(curAction.name) > curAction.allowed(true)) {
            curAction.ticks = 0;
            curAction.timeSpent = 0;
            curAction.effectiveTimeElapsed = 0;
            view.requestUpdate("updateCurrentActionBar", this.currentPos);
            return undefined;
        }
        while (curAction.townNum !== curTown
            || (curAction.canStart && !curAction.canStart())
            || (isMultipartAction(curAction) && !curAction.canMakeProgress(0))) {
            curAction.errorMessage = this.getErrorMessage(curAction);
            view.requestUpdate("updateCurrentActionBar", this.currentPos);
            this.currentPos++;
            this.currentAction = null;
            if (this.currentPos >= this.current.length) {
                curAction = undefined;
                break;
            }
            curAction = this.current[this.currentPos];
        }
        if (curAction && this.currentAction !== curAction) {
            this.currentAction = curAction;
            curAction.effectiveTimeElapsed = effectiveTime;
        }
        return curAction;
    }

    /** @param {AnyActionEntry} action  */
    getErrorMessage(action) {
        if (action.townNum !== curTown) {
            return `You were in zone ${curTown + 1} when you tried this action, and needed to be in zone ${action.townNum + 1}`;
        }
        if (action.canStart && !action.canStart()) {
            return "You could not make the cost for this action.";
        }
        if (isMultipartAction(action) && !action.canMakeProgress(0)) {
            // return "You have already completed this action.";
            return null; // already-complete does not currently count as an error
        }
        return "??";
    }

    restart() {
        this.currentPos = 0;
        this.completedTicks = 0;
        this.currentAction = null;
        curTown = 0;
        towns[0].suppliesCost = 300;
        view.requestUpdate("updateResource","supplies");
        curAdvGuildSegment = 0;
        curCraftGuildSegment = 0;
		curWizCollegeSegment = 0;
        curFightFrostGiantsSegment = 0;
        curFightJungleMonstersSegment = 0;
        curThievesGuildSegment = 0;
        curGodsSegment = 0;
        for (const town of towns) {
            for (const action of town.totalActionList) {
                if (action.type === "multipart") {
                    town[action.varName] = 0;
                    town[`${action.varName}LoopCounter`] = 0;
                }
            }
        }
        guild = "";
        hearts = [];
        escapeStarted = false;
        portalUsed = false;
        stoneLoc = 0;
        totalMerchantMana = 7500;
        if (options.keepCurrentList && this.current?.length > 0) {
            this.currentPos = 0;
            this.completedTicks = 0;

            for (const action of this.current) {
                action.loops -= action.extraLoops;
                action.loopsLeft = action.loops;
                action.extraLoops = 0;
                action.ticks = 0;
                action.manaUsed = 0;
                action.lastMana = 0;
                action.manaRemaining = 0;
                action.goldRemaining = 0;
                action.timeSpent = 0;
                action.effectiveTimeElapsed = 0;
            }

        } else {
            this.current = [];
            for (const action of this.#writableNext) {
                // don't add empty/disabled ones
                if (action.loops === 0 || action.disabled) {
                    continue;
                }
                const toAdd = /** @type {AnyActionEntry} */(translateClassNames(action.name));

                toAdd.loopsType = action.loopsType ?? (isMultipartAction(toAdd) ? "maxEffort" : "actions");
                if (isMultipartAction(toAdd) && action.loopsType === "actions") action.loopsType = "maxEffort";
                toAdd.loops = action.loops;
                toAdd.loopsLeft = action.loops;
                toAdd.extraLoops = 0;
                toAdd.ticks = 0;
                toAdd.manaUsed = 0;
                toAdd.lastMana = 0;
                toAdd.manaRemaining = 0;
                toAdd.goldRemaining = 0;
                toAdd.timeSpent = 0;
                toAdd.effectiveTimeElapsed = 0;

                this.current.push(toAdd);
            }
        }
        if (this.current.length === 0) {
            pauseGame();
        }
        this.adjustTicksNeeded();
        view.requestUpdate("updateMultiPartActions");
        view.requestUpdate("updateNextActions");
        view.requestUpdate("updateTime");
        view.requestUpdate("updateActionTooltips");
    }

    adjustTicksNeeded() {
        let remainingTicks = 0;
        for (let i = this.currentPos; i < this.current.length; i++) {
            const action = this.current[i];
            setAdjustedTicks(action);
            remainingTicks += action.loopsLeft * action.adjustedTicks;
        }
        this.totalNeeded = this.completedTicks + remainingTicks;
        view.requestUpdate("updateTotalTicks", null);
    }

    /** @type {ZoneSpan[]} */
    #zoneSpans;
    get zoneSpans() {
        if (!this.#zoneSpans) {
            let currentZones = [0];
            let currentStartIndex = 0;
            this.#zoneSpans = [];
            for (const [index, action] of this.next.entries()) {
                const actionProto = getActionPrototype(action.name);
                if (action.disabled || !action.loops || !actionProto) {
                    continue;
                }
                const travelDeltas = getPossibleTravel(action.name);
                if (!travelDeltas.length) continue;
                if (currentZones.length > 1 && currentZones.includes(actionProto.townNum)) {
                    currentZones = [actionProto.townNum];
                }
                this.#zoneSpans.push(new ZoneSpan(currentStartIndex, index, currentZones, this.#zoneSpans.length, this.next));
                currentStartIndex = index + 1;
                currentZones = travelDeltas.map(x => x + actionProto.townNum);
            }
            this.#zoneSpans.push(new ZoneSpan(currentStartIndex, this.next.length, currentZones, this.#zoneSpans.length, this.next));
        }
        return this.#zoneSpans;
    }
    zoneSpanAtIndex(index) {
        return this.zoneSpans.find(zs => index >= zs.start && index <= zs.end);
    }

    /** @type {number} */
    #lastModifiedIndex;

    /** @param {number} actionId  */
    findActionWithId(actionId) {
        const index = this.findIndexOfActionWithId(actionId);
        if (index < 0) return undefined;
        const action = this.next[index];
        return {...action, index};
    }

    /** @param {number} actionId  */
    findIndexOfActionWithId(actionId) {
        return this.next.findIndex(a => a.actionId === Number(actionId));
    }

    getMaxActionId() {
        return Math.max(0, ...this.next.map(a => a.actionId).filter(a => a));
    }

    /** @param {NextActionEntry} action @param {(action: Readonly<NextActionEntry>, actionProto: Readonly<AnyAction>) => boolean} [additionalTest]  */
    isValidAndEnabled(action, additionalTest) {
        return action && (!action.actionId || this.next.some(a => a.actionId === action.actionId)) && Actions.isValidAndEnabled(action, additionalTest);
    }

    /** @param {NextActionEntry} action @param {(action: Readonly<NextActionEntry>, actionProto: Readonly<AnyAction>) => boolean} [additionalTest]  */
    static isValidAndEnabled(action, additionalTest) {
        const actionProto = getActionPrototype(action?.name);
        return actionProto && !action.disabled && action.loops > 0 && (!additionalTest || additionalTest(action, actionProto));
    }

    /**
     * @param {ActionName}     action
     * @param {number}         [loops]
     * @param {number}         [initialOrder]
     * @param {boolean}        [disabled]
     * @param {ActionLoopType} [loopsType]
     * @returns {number}
     */
    addAction(action, loops = this.addAmount, initialOrder = options.addActionsToTop ? 0 : -1, disabled = false, loopsType = "actions", addAtClosestValidIndex = true) {
        return this.addActionRecord({
            name: action,
            disabled,
            loops,
            loopsType,
        }, initialOrder, addAtClosestValidIndex);
    }

    /** @param {NextActionEntry} toAdd  */
    addActionRecord(toAdd, initialOrder = options.addActionsToTop ? 0 : -1, addAtClosestValidIndex = true) {
        if (initialOrder < 0) initialOrder += this.next.length + 1;
        initialOrder = clamp(initialOrder, 0, this.next.length);
        if (addAtClosestValidIndex) {
            const actionProto = getActionPrototype(toAdd.name);
            initialOrder = this.closestValidIndexForAction(actionProto?.townNum, initialOrder);
        }
        // Number.isFinite(), unlike isFinite(), doesn't coerce its argument so it also functions as a typecheck
        if (!Number.isFinite(toAdd.actionId) || this.findActionWithId(toAdd.actionId)) {
            // define it as immutable and non-enumerable so it doesn't get picked up by save
            Object.defineProperty(toAdd, "actionId", {value: this.getMaxActionId() + 1, configurable: true, writable: false, enumerable: false});
        }
        this.recordLast();
        this.#writableNext.splice(initialOrder, 0, toAdd);
        return initialOrder;
    }

    /** @param {NextActionEntry[]} records */
    appendActionRecords(records) {
        for (const record of records) {
            this.addActionRecord({...record}, -1, false);
        }
    }

    /** @param {number|NextActionEntry} initialIndexOrAction @param {number} resultingIndex */
    moveAction(initialIndexOrAction, resultingIndex, moveToClosestValidIndex = false) {
        let initialIndex = typeof initialIndexOrAction === "number" ? initialIndexOrAction : this.next.indexOf(initialIndexOrAction);
        if (initialIndex < 0) initialIndex += this.next.length;
        if (resultingIndex < 0) resultingIndex += this.next.length;

        if (initialIndex < 0 || initialIndex >= this.next.length) return -1;

        resultingIndex = clamp(resultingIndex, 0, this.next.length - 1);
        if (moveToClosestValidIndex) {
            const townNum = (getActionPrototype(this.next[initialIndex].name))?.townNum;
            if (townNum != null) {
                resultingIndex = this.closestValidIndexForAction(townNum, resultingIndex, initialIndex);
            }
        }
        if (initialIndex === resultingIndex) return resultingIndex;
        this.recordLast();
        const actionToMove = this.next[initialIndex];
        if (initialIndex < resultingIndex) {
            this.#writableNext.copyWithin(initialIndex, initialIndex + 1, resultingIndex + 1);
        } else {
            this.#writableNext.copyWithin(resultingIndex + 1, resultingIndex, initialIndex);
        }
        this.#writableNext[resultingIndex] = actionToMove;
        return resultingIndex;
    }

    /** @param {number|NextActionEntry} indexOrAction */
    removeAction(indexOrAction) {
        let index = typeof indexOrAction === "number" ? indexOrAction : this.next.indexOf(indexOrAction);
        if (index < 0) index += this.next.length;
        if (index < 0 || index >= this.next.length) return;

        this.recordLast(index);
        return this.#writableNext.splice(index, 1)[0];
    }

    /** @param {number|NextActionEntry} indexOrAction @param {Partial<NextActionEntry>} [update] */
    updateAction(indexOrAction, update) {
        let index = typeof indexOrAction === "number" ? indexOrAction : this.next.indexOf(indexOrAction);
        if (index < 0) index += this.next.length;
        if (index < 0 || index >= this.next.length) return;

        this.recordLast(index, true);
        return Object.assign(this.#writableNext[index], update);
    }

    /** @param {number|NextActionEntry} indexOrAction @param {number} [amountToSplit] @param {number} [targetIndex] */
    splitAction(indexOrAction, amountToSplit, targetIndex, splitToClosestValidIndex = false) {
        let index = typeof indexOrAction === "number" ? indexOrAction : this.next.indexOf(indexOrAction);
        if (index < 0) index += this.next.length;
        if (index < 0 || index >= this.next.length) return;
        
        const action = this.next[index];
        amountToSplit ??= Math.ceil(action.loops / 2);
        targetIndex ??= index;

        if (splitToClosestValidIndex) {
            const townNum = getActionPrototype(action.name)?.townNum;
            if (townNum != null) {
                targetIndex = this.closestValidIndexForAction(townNum, targetIndex);
            }
        }
        const splitIndex = this.addActionRecord({...action, loops: amountToSplit}, targetIndex, splitToClosestValidIndex);
        this.#lastModifiedIndex = index + (splitIndex <= index ? 1 : 0); // tell updateAction not to save this undo
        this.updateAction(this.#lastModifiedIndex, {loops: action.loops - amountToSplit});
    }

    /** @param {(action: Readonly<NextActionEntry>) => boolean} [predicate] */
    clearActions(predicate) {
        if (this.next.length === 0) return;
        this.recordLast();
        if (predicate) {
            this.#writableNext.splice(0, Infinity, ...this.next.filter(a => !predicate(a)));
        } else {
            this.#writableNext.length = 0;
        }
    }

    /** @param {number} [unlessIndex] */
    recordLast(unlessIndex, saveLastModified = false) {
        if (typeof unlessIndex === "undefined" || this.#lastModifiedIndex !== unlessIndex) {
            this.#nextLast = structuredClone(this.next);
            for (const [i, action] of this.#nextLast.entries()) {
                // duplicate the non-enumerable property descriptor
                Object.defineProperty(action,"actionId", Object.getOwnPropertyDescriptor(this.next[i], "actionId"));
            }
        }
        this.#zoneSpans = null;
        this.#lastModifiedIndex = saveLastModified ? unlessIndex : undefined;
    }

    undoLast() {
        // @ts-ignore - we're overriding readonly
        [this.#writableNext, this.#nextLast] = [this.#nextLast, this.next];
        this.#lastModifiedIndex = undefined;
        this.#zoneSpans = null;
    }

    /** @param {number} townNum @param {number} index  */
    isValidIndexForAction(townNum, index) {
        return this.zoneSpanAtIndex(index)?.zones.includes(townNum) ?? false;
    }

    /** @param {number} townNum @param {number} desiredIndex @param {number} [ignoreIndex]  */
    closestValidIndexForAction(townNum, desiredIndex, ignoreIndex) {
        if (desiredIndex < 0) desiredIndex += this.next.length + 1;
        desiredIndex = clamp(desiredIndex, 0, this.next.length);
        if (townNum == null) return desiredIndex;
        const {zoneSpans} = this;
        const spanIndex = zoneSpans.findIndex(zs => desiredIndex >= zs.ignoringStart(ignoreIndex) && desiredIndex <= zs.ignoringEnd(ignoreIndex));
        if (zoneSpans[spanIndex].zones.includes(townNum)) return desiredIndex;
        let nextValidIndex = Infinity, prevValidIndex = -Infinity;
        for (let index = spanIndex + 1; index < zoneSpans.length; index++) {
            if (zoneSpans[index]?.zones.includes(townNum)) {
                nextValidIndex = zoneSpans[index].ignoringStart(ignoreIndex);
                break;
            }
        }
        for (let index = spanIndex - 1; index >= 0; index--) {
            if (zoneSpans[index]?.zones.includes(townNum)) {
                prevValidIndex = clamp(zoneSpans[index].ignoringEnd(ignoreIndex), 0, this.next.length);
                break;
            }
        }
        if (nextValidIndex === Infinity && prevValidIndex === -Infinity) return desiredIndex; // nowhere is good so anywhere is fine
        return nextValidIndex - desiredIndex <= desiredIndex - prevValidIndex ? nextValidIndex : prevValidIndex; // send it to whichever is closer
    }
}

class ZoneSpan {
    start;
    end;
    zones;
    spanIndex;
    actionList;

    get startAction() {
        return this.actionList[this.start];
    }

    get endAction() {
        return this.actionList[this.end];
    }

    get isCollapsed() {
        // For the zone to count as collapsed, it must:
        // 1. end with an action
        // 2. which is valid and enabled, and is in the right zone
        // 3. and which is marked as collapsed by the user.
        // We only expose the "collapse" arrows on travel actions and only travel actions can end zones, but if not for that
        // it would be permissible to use a non-travel action (like, say, RT from z9) as a collapse source.
        const {endAction, zones} = this;
        
        return endAction
            && Actions.isValidAndEnabled(endAction, 
                                         (_, eproto) => zones.includes(eproto.townNum))
            && !!endAction.collapsed;
    }

    /** @param {number} start @param {number} end @param {number[]} zones @param {number} spanIndex @param {readonly NextActionEntry[]} actionList */
    constructor(start, end, zones, spanIndex, actionList) {
        this.start = start;
        this.end = end;
        this.zones = zones;
        this.spanIndex = spanIndex;
        this.actionList = actionList;
    }

    /** @param {number} [ignoringIndex] */
    ignoringStart(ignoringIndex) {
        if (ignoringIndex == null) return this.start;
        return this.start - (this.start > ignoringIndex ? 1 : 0);
    }

    /** @param {number} [ignoringIndex] */
    ignoringEnd(ignoringIndex) {
        if (ignoringIndex == null) return this.end;
        if (this.end === ignoringIndex) return Infinity; // the final travel action can move as far as it wants
        return this.end - (this.end > ignoringIndex ? 1 : 0);
    }
}

function setAdjustedTicks(action) {
    let newCost = 0;
    for (const actionStatName in action.stats){
        newCost += action.stats[actionStatName] * stats[actionStatName].manaMultiplier;
    }
    action.rawTicks = action.manaCost() * newCost - (options.fractionalMana ? 0 : 0.000001);
    action.adjustedTicks = Math.max(options.fractionalMana ? 0 : 1, Mana.ceil(action.rawTicks));
}

function calcSoulstoneMult(soulstones) {
    return 1 + Math.pow(soulstones, 0.8) / 30;
}

function calcTalentMult(talent) {
    return 1 + Math.pow(talent, 0.4) / 3;
}

// how many ticks would it take to get to the first level up
function getMaxTicksForAction(action, talentOnly=false) {
    let maxTicks = Number.MAX_SAFE_INTEGER;
    const expMultiplier = action.expMult * (action.manaCost() / action.adjustedTicks);
    const overFlow=prestigeBonus("PrestigeExpOverflow") - 1;
    for (const stat of statList) {
        const expToNext = getExpToLevel(stat, talentOnly);
        const statMultiplier = expMultiplier * ((action.stats[stat]??0)+overFlow) * getTotalBonusXP(stat);
        maxTicks = Math.min(maxTicks, Mana.ceil(expToNext / statMultiplier));
    }
    return maxTicks;
}

/** @param {StatName} stat  */
function getMaxTicksForStat(action, stat, talentOnly=false) {
    const expMultiplier = action.expMult * (action.manaCost() / action.adjustedTicks);
    const overFlow=prestigeBonus("PrestigeExpOverflow") - 1;
    const expToNext = getExpToLevel(stat, talentOnly);
    const statMultiplier = expMultiplier * ((action.stats[stat]??0)+overFlow) * getTotalBonusXP(stat);
    return Mana.ceil(expToNext / statMultiplier);
}

function addExpFromAction(action, manaCount) {
    const adjustedExp = manaCount * action.expMult * (action.manaCost() / action.adjustedTicks);
    const overFlow=prestigeBonus("PrestigeExpOverflow") - 1;
    for (const stat of statList) {
        const expToAdd = ((action.stats[stat]??0)+overFlow) * adjustedExp * getTotalBonusXP(stat);

        // Used for updating the menus when hovering over a completed item in the actionList
        const statExp = `statExp${stat}`;
        if (!action[statExp]) {
            action[statExp] = 0;
        }
        action[statExp] += expToAdd;
        addExp(stat, expToAdd);
    }
}

function markActionsComplete(loopCompletedActions) {
    loopCompletedActions.forEach(action => {
        let varName = Action[withoutSpaces(action.name)].varName;
        if (!completedActions.includes(varName)) completedActions.push(varName);
    });
}

function actionStory(loopCompletedActions) {
    loopCompletedActions.forEach(action => {
        let completed = action.loops - action.loopsLeft;
        //Test for completed, because all of the actions in .story(completed) assume it was successfully
        //completed.  Without this we advance the story by putting an action in the list rather than
        // completing it.  We should really have a hook for failure as well.
        if (completed > 0 && action.story !== undefined)
        {
            action.story(completed);
        }
    });
}

function getNumOnList(actionName) {
    let count = 0;
    for (const action of actions.next) {
        if (!action.disabled && action.name === actionName) {
            count += action.loops;
        }
    }
    return count;
}

function getOtherSurveysOnList(surveyName) {
    let count = 0;
    for (const action of actions.next) {
        if (!action.disabled && action.name.startsWith("Survey") && action.name != surveyName) {
            count += action.loops;
        }
    }
    return count;
}

function getNumOnCurList(actionName) {
    let count = 0;
    for (const action of actions.current) {
        if (action.name === actionName) {
            count += action.loops;
        }
    }
    return count;
}
