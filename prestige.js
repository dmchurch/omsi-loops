// Constants used as the base for Prestige exponential bonuses.
const PRESTIGE_COMBAT_BASE       = 1.20;
const PRESTIGE_PHYSICAL_BASE     = 1.20;
const PRESTIGE_MENTAL_BASE       = 1.20;
const PRESTIGE_BARTERING_BASE    = 1.10;
const PRESTIGE_SPATIOMANCY_BASE  = 1.10;
const PRESTIGE_CHRONOMANCY_BASE  = 1.05;
const PRESTIGE_EXP_OVERFLOW_BASE = 1.00222;

// All prestige button functions
function completedCurrentGame() {
    console.log("completed current prestige")

    if (!prestigeValues["completedCurrentPrestige"]) {
        prestigeValues["prestigeCurrentPoints"]    += 90;
        prestigeValues["prestigeTotalPoints"]      += 90;
        prestigeValues["prestigeTotalCompletions"] += 1;
        prestigeValues["completedCurrentPrestige"] = true;
        prestigeValues["completedAnyPrestige"]     = true;

        view.updatePrestigeValues();
    }
}

/** @param {PrestigeBuffName} prestigeSelected */
function prestigeUpgrade(prestigeSelected) {
    // Update prestige value
    const costOfPrestige = getPrestigeCost(prestigeSelected);
    if (costOfPrestige > prestigeValues["prestigeCurrentPoints"]) {
        console.log("Not enough points available.")
        return;
    } 
    // Confirmation of prestige
    if (!prestigeConfirmation()) {
        return;
    }

    addBuffAmt(prestigeSelected, 1);
    prestigeValues["prestigeCurrentPoints"] -= costOfPrestige;
    
    // Retain certain values between prestiges
    const nextPrestigeBuffs = {
        PrestigePhysical:    getBuffLevel("PrestigePhysical"),
        PrestigeMental:      getBuffLevel("PrestigeMental"),
        PrestigeCombat:      getBuffLevel("PrestigeCombat"),
        PrestigeSpatiomancy: getBuffLevel("PrestigeSpatiomancy"),
        PrestigeChronomancy: getBuffLevel("PrestigeChronomancy"),
        PrestigeBartering:   getBuffLevel("PrestigeBartering"),
        PrestigeExpOverflow: getBuffLevel("PrestigeExpOverflow"),

        // Imbue Soul carry overs between prestiges, but only up to the number of prestiges you have.
        Imbuement3: Math.min(prestigeValues["prestigeTotalCompletions"], getBuffLevel("Imbuement3")), 
    }

    const nextPrestigeValues = {
        prestigeCurrentPoints:     prestigeValues["prestigeCurrentPoints"],
        prestigeTotalPoints:       prestigeValues["prestigeTotalPoints"],
        prestigeTotalCompletions:  prestigeValues["prestigeTotalCompletions"],
        completedCurrentPrestige:  false,
        completedAnyPrestige:      prestigeValues["completedAnyPrestige"],
    }

    prestigeWithNewValues(nextPrestigeValues, nextPrestigeBuffs)
}

function resetAllPrestiges() {
    // Retain certain values between prestiges
    const nextPrestigeBuffs = {
        PrestigePhysical:    0,
        PrestigeMental:      0,
        PrestigeCombat:      0,
        PrestigeSpatiomancy: 0,
        PrestigeChronomancy: 0,
        PrestigeBartering:   0,
        PrestigeExpOverflow: 0,

        // Imbue Soul carry overs between prestiges, but only up to the number of prestiges you have.
        Imbuement3: Math.min(prestigeValues["prestigeTotalCompletions"], getBuffLevel("Imbuement3")), 
    }

    const nextPrestigeValues = {
        prestigeCurrentPoints:     prestigeValues["prestigeTotalPoints"],
        prestigeTotalPoints:       prestigeValues["prestigeTotalPoints"],
        prestigeTotalCompletions:  prestigeValues["prestigeTotalCompletions"],
        completedCurrentPrestige:  false,
        completedAnyPrestige:      prestigeValues["completedAnyPrestige"],
    }

    prestigeWithNewValues(nextPrestigeValues, nextPrestigeBuffs)
}

/**
 * @param {typeof prestigeValues} nextPrestigeValues
 * @param {{[K in PrestigeBuffName|'Imbuement3']: number}} nextPrestigeBuffs
 */
function prestigeWithNewValues(nextPrestigeValues, nextPrestigeBuffs) {
    let nextTotals = totals;
    let nextOfflineMs = totalOfflineMs;


    // Remove all progress and save totals
    load(false);
    clearList();
    restart();
    pauseGame();


    // Regain prestige values and Totals
    for (const [key, value] of typedEntries(nextPrestigeBuffs)) {
        addBuffAmt(key, 0);     // Set them to 0
        addBuffAmt(key, value); // Then set them to actual value
        view.requestUpdate("updateBuff", key);
    }

    prestigeValues["prestigeCurrentPoints"]    = nextPrestigeValues.prestigeCurrentPoints.valueOf();
    prestigeValues["prestigeTotalPoints"]      = nextPrestigeValues.prestigeTotalPoints.valueOf();
    prestigeValues["prestigeTotalCompletions"] = nextPrestigeValues.prestigeTotalCompletions.valueOf();
    prestigeValues["completedCurrentPrestige"] = nextPrestigeValues.completedCurrentPrestige.valueOf();
    prestigeValues["completedAnyPrestige"]     = nextPrestigeValues.completedAnyPrestige.valueOf();
    totals = nextTotals;
    totalOfflineMs = nextOfflineMs;
    view.updatePrestigeValues();
    save();
}

function prestigeConfirmation() {
    save();

    if (totals.actions === 0)
    {
        //This helps prevent repeated confirmations, and blowing away your backup when picking a second ability.
        //If you have no actions, then there's nothing worth protecting.
        return true;
    }

    if (window.localStorage[defaultSaveName] && window.localStorage[defaultSaveName] !== "") {
        if (confirm(`Prestiging will reset all of your progress, but retain prestige points. Are you sure?`)) {
            for (const town of towns) {
                // this should be done in a more logical way but for now, just make sure to clear these out
                town?.hiddenVars?.clear();
            }
            window.localStorage["prestigeBackup"] = window.localStorage[defaultSaveName];
            window.localStorage[defaultSaveName] = "";
        } else
            return false;
    }
    return true;
}

/** @param {PrestigeBuffName} prestigeSelected */
function getPrestigeCost(prestigeSelected) {
    var currentCost = 30;

    for (var i = 0; i < getBuffLevel(prestigeSelected); i++) {
        currentCost += 10 + (5 * i)
    }

    return currentCost;
}

/** @param {PrestigeBuffName} prestigeSelected */
function getPrestigeCurrentBonus(prestigeSelected, base) {
    return prestigeBonus(prestigeSelected) > 1 ? 
        prestigeBonus(prestigeSelected) * 100 - 100 :      // *100 - 100 is to get percent values, otherwise 1.02 will just round to 1, rather than 2%.
        0;
}

// Prestige Functions

/** @type {{[B in PrestigeBuffName]?: {calc: number, bonus: number}}} */
const prestigeCache = {};

/** @satisfies {{[B in PrestigeBuffName]: number}} */
const prestigeBases = {
    PrestigeBartering: PRESTIGE_BARTERING_BASE,
    PrestigeChronomancy: PRESTIGE_CHRONOMANCY_BASE,
    PrestigeCombat: PRESTIGE_COMBAT_BASE,
    PrestigeExpOverflow: PRESTIGE_EXP_OVERFLOW_BASE,
    PrestigeMental: PRESTIGE_MENTAL_BASE,
    PrestigePhysical: PRESTIGE_PHYSICAL_BASE,
    PrestigeSpatiomancy: PRESTIGE_SPATIOMANCY_BASE,
};

/** @param {PrestigeBuffName} buff  */
function prestigeBonus(buff) {
    const cache = prestigeCache[buff] ??= {
        calc: -1,
        bonus: -1,
    };
    const level = getBuffLevel(buff);
    if (level !== cache.calc) {
        const base = prestigeBases[buff];
        if (!base) {
            console.error(`No prestige base recorded for buff ${buff}`);
            return 1;
        }
        cache.bonus = Math.pow(base, level);
        cache.calc = level;
    }
    return cache.bonus;
}

function adjustContentFromPrestige() {
    return prestigeBonus("PrestigeSpatiomancy")
}

function adjustGoldCostFromPrestige() {
    return prestigeBonus("PrestigeBartering")
}