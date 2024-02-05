// @ts-check
"use strict";

/**
 * ActionLoopType is an enum that describes what the "loops" property means. Actions without
 * a loopsType property default to the classic behavior of "actions" for non-multipart actions
 * or "maxEffort" for multipart actions.
 * 
 * The comments here assume X as the number specified in "loops" and M as the manaCost() of the
 * action in question.
 * @typedef {"actions"      // Non-multipart actions: perform X actions and then stop
 *         | "segments"     // Multipart actions: Finish X segments and then stop
 *         | "maxMana"      // Multipart actions: Spend no more than X * M mana, stop before starting an action that would overflow
 *         | "maxEffort"    // Multipart actions: Spend no more than X * M effort, stop before starting an action that would overflow
 *         | "knownGood"    // Limited actions: perform at most X actions, only targeting known-good items
 *         | "unchecked"    // Limited actions: perform at most X actions, only targeting unknown items
 * } ActionLoopType
 */

/** 
 * {@link CurrentActionEntry} is the extra data added to an {@link Action} when it is part of the current loop.
 * {@link AnyActionEntry} is the resulting typedef.
 * 
 * @typedef CurrentActionEntry
 * @prop {ActionLoopType} loopsType             What does the loops property measure?
 * @prop {number} loops                         How long should we perform this action?
 * @prop {number} loopsLeft                     How many loops still need to be performed, incluing the current?
 * @prop {number} extraLoops                    How many extra loops were added to this action (e.g. from "Repeat last action")?
 * @prop {number} ticks                         How much mana has been spent towards this loop of the action?
 * @prop {ImmutableRational} [adjustedTicks]    How much mana is required to complete this action (respecting fracmana)?
 * @prop {ImmutableRational} [rawTicks]         How much mana is required to complete this action, without rounding?
 * @prop {number} manaUsed                      How much mana has been spent towards this action in total?
 * @prop {number} effortSpent                   How much effort has been generated towards this action in total?
 * @prop {number} actionCompletions             How many times has a simple action or multipart segment been completed?
 * @prop {number} lastMana                      How much actual mana was spent towards the last successful loop of the action?
 * @prop {number} manaRemaining                 How much mana remained at the end of the last successful loop of the action?
 * @prop {number} goldRemaining                 How much gold remained?
 * @prop {number} timeSpent                     How much in-game time was spent over the course of this action?
 * @prop {number} effectiveTimeElapsed          How much in-game time was spent in the loop, up through the end of the action?
 * @prop {string} [errorMessage]                If this action failed: why?
 * }} 
 * @typedef {CurrentActionEntry & AnyActionType} AnyActionEntry
 */

/**
 * NextActionEntry is the shorthand object stored in {@link Actions.next} array. It does not have an Action prototype.
 * 
 * @typedef NextActionEntry
 * @prop {ActionName} name                  The action's .name property, used as a lookup
 * @prop {number}     loops                 How long should wee perform this action?
 * @prop {boolean}    disabled              Is this action user-disabled?
 * @prop {boolean}    [collapsed]           Is this travel action user-collapsed?
 * @prop {ActionLoopType} [loopsType]       What does the loops property measure?
 */

/** @param {AnyActionEntry} action @returns {action is MultipartAction} */
function isMultipartAction(action) {
    return 'loopStats' in action;
}

class Actions {
    /** @type {AnyActionEntry[]} */
    current = [];
    /** @type {NextActionEntry[]} */
    next = [];
    /** @type {NextActionEntry[]} */
    nextLast;
    addAmount = 1;

    totalNeeded = 0;
    completedTicks = 0;
    currentPos = 0;
    timeSinceLastUpdate = 0;
    /** @type {AnyActionEntry} */
    currentAction;

    static {
        Data.omitProperties(this.prototype, ["next", "nextLast"]);
    }

    /** @param {number} [availableMana] */
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
        manaToSpend = Math.min(manaToSpend, Mana.ceil(curAction.adjustedTicks.approximateValue - curAction.ticks));
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
            const tickMultiplier = (curAction.manaCost() / curAction.adjustedTicks.approximateValue);
            let partUpdateRequired = false;

            manaLoop:
            while (manaLeftForCurrentSegment > 0 && curAction.canMakeProgress(segment)) {
                //const toAdd = curAction.tickProgress(segment) * (curAction.manaCost() / curAction.adjustedTicks);
                const loopStat = stats[loopStats[(loopCounter + segment) % loopStats.length]];
                const progressMultiplier = curAction.tickProgress(segment) * tickMultiplier * loopStat.effortMultiplier.approximateValue;
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
                    if (segment === curAction.segments - 1) {
                        // part finished
                        if (curAction.name === "Dark Ritual" && towns[curAction.townNum][curAction.varName] >= 4000000) unlockStory("darkRitualThirdSegmentReached");
                        if (curAction.name === "Imbue Mind" && towns[curAction.townNum][curAction.varName] >= 700000000) unlockStory("imbueMindThirdSegmentReached");
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
                    if (curAction.segmentFinished) {
                        curAction.segmentFinished();
                        partUpdateRequired = true;
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

        if (curAction.ticks >= curAction.adjustedTicks.approximateValue) {
            curAction.ticks = 0;
            curAction.loopsLeft--;

            curAction.lastMana = curAction.rawTicks.approximateValue;
            this.completedTicks += curAction.adjustedTicks.approximateValue;
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
        if (curAction.allowed && getNumOnCurList(curAction.name) > curAction.allowed()) {
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
            for (const action of this.next) {
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
            remainingTicks += action.loopsLeft * action.adjustedTicks.approximateValue;
        }
        this.totalNeeded = this.completedTicks + remainingTicks;
        view.requestUpdate("updateTotalTicks", null);
    }


    /**
     * @param {ActionName}     action
     * @param {number}         [loops]
     * @param {number}         [initialOrder]
     * @param {boolean}        [disabled]
     * @param {ActionLoopType} [loopsType]
     * @returns {number}
     */
    addAction(action, loops, initialOrder, disabled, loopsType) {
        /** @type {NextActionEntry} */
        const toAdd = {};
        toAdd.name = action;
        if (disabled) toAdd.disabled = true;
        else toAdd.disabled = false;

        toAdd.loops = loops === undefined ? this.addAmount : loops;
        toAdd.loopsType = loopsType ?? "actions";

        if (initialOrder === undefined) {
            if (options.addActionsToTop) {
                this.next.splice(0, 0, toAdd);
                initialOrder = 0;
            } else {
                initialOrder = this.next.length;
                this.next.push(toAdd);
            }
        } else {
            // insert at index
            this.next.splice(initialOrder, 0, toAdd);
        }
        return initialOrder;
    }
}

/** @param {AnyActionEntry} action */
function getRawAdjustedTicks(action, effortCost = action.manaCost(), result = new Rational()) {
    result.setValue(0);
    for (const statFraction of action.statFractions) {
        const actionStatName = statFraction.statName;
        result.add(stats[actionStatName].manaMultiplier.multiplyBy(statFraction));
    }
    return result.multiplyBy(effortCost);
}

/** @param {RationalLike} rawTicks */
function roundAdjustedTicks(rawTicks, result = new Rational()) {
    result.setValue(rawTicks);
    if (!options.fractionalMana) {
        result.ceilThis()
    }
    return result.clamp(options.fractionalMana ? 0 : 1, null);
}

/** @param {AnyActionEntry} action */
function getAdjustedTicks(action, effortCost = action.manaCost(), result = new Rational()) {
    return roundAdjustedTicks(getRawAdjustedTicks(action, effortCost, result), result);
}

/** @param {AnyActionEntry} action */
function setAdjustedTicks(action) {
    action.rawTicks = getRawAdjustedTicks(action, undefined, action.rawTicks?.thaw()).freeze();
    action.adjustedTicks = roundAdjustedTicks(action.rawTicks, action.adjustedTicks?.thaw()).freeze();
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
        if (action.story !== undefined) action.story(completed);
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
