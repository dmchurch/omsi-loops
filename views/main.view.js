"use strict";

let screenSize;

class View {
    initalize() {
        this.createTravelMenu();
        this.createStats();
        this.updateStats();
        this.updateSkills();
        this.adjustDarkRitualText();
        this.updateBuffs();
        this.updateTime();
        this.updateCurrentActionsDivs();
        this.updateTotalTicks();
        this.updateAddAmount(1);
        this.createTownActions();
        this.updateProgressActions();
        this.updateLockedHidden();
        this.updateSoulstones();
        this.showTown(0);
        this.showActions(false);
        this.updateTrainingLimits();
        this.changeStatView();
        this.changeTheme(true);
        this.adjustGoldCosts();
        this.adjustExpGains();
        this.updateTeamCombat();
        this.updateLoadoutNames();
        this.updateResources();
        this.updateTrials();
        if (storyMax >= 12)
            setInterval(() => {
                view.updateStories();
                view.updateLockedHidden();
            }, 20000);
        else
            setInterval(() => {
                view.updateStories();
                view.updateLockedHidden();
            }, 2000);
        adjustAll();
        this.updateActionTooltips();
        this.initActionLog();
        document.body.removeEventListener("mouseover", this.mouseoverHandler);
        document.body.addEventListener("mouseover", this.mouseoverHandler, {passive: true});
        document.body.removeEventListener("focusin", this.mouseoverHandler);
        document.body.addEventListener("focusin", this.mouseoverHandler, {passive: true});
        /** @type {WeakMap<HTMLElement, Element | false>} */
        this.tooltipTriggerMap = new WeakMap();
        this.mouseoverCount = 0;
    };

    constructor() {
        this.mouseoverHandler = this.mouseoverHandler.bind(this);
    }

    /** @param {UIEvent} event */
    mouseoverHandler(event) {
        if (!(event.target instanceof HTMLElement)) return;
        const trigger = this.getClosestTrigger(event.target);
        this.mouseoverCount++;
        if (trigger) {
            let tooltipSelector = "";
            for (const cls of trigger.classList) {
                if (cls.startsWith("showthat")) {
                    tooltipSelector = `.showthis${cls.slice(8)}`;
                    break;
                }
            }
            if (tooltipSelector === "") {
                console.warn("Could not find tooltip class for trigger! Using generic selector", trigger);
                tooltipSelector = ".showthis,.showthisO,.showthis2,.showthisH,.showthisloadout,.showthisstory";
            }
            for (const tooltip of trigger.querySelectorAll(tooltipSelector)) {
                if (tooltip instanceof HTMLElement)
                    this.fixTooltipPosition(tooltip, trigger, event.target);
            }
        }
    };

    /** @param {HTMLElement} element */
    getClosestTrigger(element) {
        let trigger = this.tooltipTriggerMap.get(element);
        if (trigger == null) {
            trigger = element.closest(".showthat,.showthatO,.showthat2,.showthatH,.showthatloadout,.showthatstory") || false;
            this.tooltipTriggerMap.set(element, trigger);
        }
        return trigger;
    };

    createStats() {
        if (statGraph.initalized) return;
        statGraph.init(document.getElementById("statsContainer"));
        const totalContainer = htmlElement("totalStatContainer");
        for (const stat of statList) {
            const axisTip = statGraph.getAxisTip(stat);
            totalContainer.insertAdjacentHTML("beforebegin",
            `<div class='statContainer showthat stat-${stat}' style='left:${axisTip[0]}%;top:${axisTip[1]+3}%;' onmouseover='view.showStat("${stat}")' onmouseout='view.showStat(undefined)'>
                <div class='statLabelContainer'>
                    <div class='medium bold stat-name' style='margin-left:18px;margin-top:5px;'>${_txt(`stats>${stat}>long_form`)}</div>
                    <div class='medium statNum stat-soulstone' style='color:var(--stat-soulstone-color);' id='stat${stat}ss'></div>
                    <div class=' statNum stat-talent'></div>
                    <div class='medium statNum stat-talent statBarWrapper'>
                        <div class='thinProgressBarLower tiny talentBar'><div class='statBar statTalentBar' id='stat${stat}TalentBar'></div></div>
                        <div class='label' id='stat${stat}Talent'>0</div>
                    </div>
                    <div class='medium statNum stat-level statBarWrapper'>
                        <div class='thinProgressBarLower tiny expBar'><div class='statBar statLevelBar' id='stat${stat}LevelBar'></div></div>
                        <div class='label bold' id='stat${stat}Level'>0</div>
                    </div>
                </div>
                <div class='thinProgressBarUpper expBar'><div class='statBar statLevelLogBar logBar' id='stat${stat}LevelLogBar'></div></div>
                <div class='thinProgressBarLower talentBar'><div class='statBar statTalentLogBar logBar' id='stat${stat}TalentLogBar'></div></div>
                <div class='thinProgressBarLower soulstoneBar'><div class='statBar statSoulstoneLogBar logBar' id='stat${stat}SoulstoneLogBar'></div></div>
                <div class='showthis' id='stat${stat}Tooltip' style='width:225px;'>
                    <div class='medium bold'>${_txt(`stats>${stat}>long_form`)}</div><br>${_txt(`stats>${stat}>blurb`)}
                    <br>
                    <div class='medium bold'>${_txt("stats>tooltip>level")}:</div> <div id='stat${stat}Level2'></div>
                    <br>
                    <div class='medium bold'>${_txt("stats>tooltip>level_exp")}:</div>
                    <div id='stat${stat}LevelExp'></div>/<div id='stat${stat}LevelExpNeeded'></div>
                    <div class='statTooltipPerc'>(<div id='stat${stat}LevelProgress'></div>%)</div>
                    <br>
                    <div class='medium bold'>${_txt("stats>tooltip>talent")}:</div>
                    <div id='stat${stat}Talent2'></div>
                    <br>
                    <div class='medium bold'>${_txt("stats>tooltip>talent_exp")}:</div>
                    <div id='stat${stat}TalentExp'></div>/<div id='stat${stat}TalentExpNeeded'></div>
                    <div class='statTooltipPerc'>(<div id='stat${stat}TalentProgress'></div>%)</div>
                    <br>
                    <div class='medium bold'>${_txt("stats>tooltip>talent_multiplier")}:</div>
                    x<div id='stat${stat}TalentMult'></div>
                    <br>
                    <div id='ss${stat}Container' class='ssContainer'>
                        <div class='bold'>${_txt("stats>tooltip>soulstone")}:</div> <div id='ss${stat}'></div><br>
                        <div class='medium bold'>${_txt("stats>tooltip>soulstone_multiplier")}:</div> x<div id='stat${stat}SSBonus'></div>
                    </div><br>
                    <div class='medium bold'>${_txt("stats>tooltip>total_multiplier")}:</div> x<div id='stat${stat}TotalMult'></div>
                </div>
            </div>`);
        }
    };

    // requests are properties, where the key is the function name,
    // and the array items in the value are the target of the function
    /** @satisfies {Partial<Record<keyof View, any[]>>} */
    requests = {
        updateStats: [],
        updateStat: [],
        updateSkill: [],
        updateSkills: [],
        updateBuff: [],
        updateTrialInfo: [],
        updateTrials: [],
        updateRegular: [],
        updateProgressAction: [],
        updateMultiPartSegments: [],
        updateMultiPart: [],
        updateMultiPartActions: [],
        updateNextActions: [],
        updateCloudSave: [],
        updateTime: [],
        updateOffline: [],
        updateBonusText: [],
        updateTotals: [],
        updateStories: [],
        updateGlobalStory: [],
        updateActionLogEntry: [],
        updateCurrentActionBar: [],
        updateCurrentActionsDivs: [],
        updateTotalTicks: [],
        updateCurrentActionLoops: [],
        updateSoulstones: [],
        updateResource: [],
        updateResources: [],
        updateActionTooltips: [],
        updateLockedHidden: [],
        updateTravelMenu: [],
        updateTeamCombat: [],
        adjustManaCost: [],
        adjustGoldCost: [],
        adjustGoldCosts: [],
        adjustExpGain: [],
        removeAllHighlights: [],
        highlightIncompleteActions: [],
        highlightAction: [],
    };

    // requesting an update will call that update on the next view.update tick (based off player set UPS)
    requestUpdate(category, target) {
        if (!this.requests[category].includes(target)) this.requests[category].push(target);
    };

    handleUpdateRequests() {
        for (const category in this.requests) {
            for (const target of this.requests[category]) {
                this[category](target);
            }
            this.requests[category] = [];
        }
    };

    update() {

        this.handleUpdateRequests();

        if (dungeonShowing !== undefined) this.updateSoulstoneChance(dungeonShowing);
        if (this.updateStatGraphNeeded) statGraph.update();
        this.updateTime();
    };


    adjustTooltipPosition(tooltipDiv) {
        // this is a no-op now, all repositioning happens dynamically on mouseover.
        // if the delegation in mouseoverHandler ends up being too costly, though, this is where
        // we'll bind discrete mouseenter handlers, like so:

        // const trigger = /** @type {HTMLElement} */(tooltipDiv.closest(".showthat,.showthatO,.showthat2,.showthatH,.showthatloadout"));
        // trigger.onmouseenter = e => this.fixTooltipPosition(tooltipDiv, trigger, e);
    }

    /**
     * @param {HTMLElement} tooltip 
     * @param {Element} trigger 
     * @param {Node} eventTarget 
     */
    fixTooltipPosition(tooltip, trigger, eventTarget, delayedCall=false) {
        if (tooltip.contains(eventTarget)) {
            // console.log("Not fixing tooltip while cursor is inside",{tooltip,trigger,event});
            return;
        }
        if (!trigger.parentElement) {
            // trigger has been removed from document, abort
            return;
        }
        const triggerRect = trigger.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportRect = {
            // document.documentElement.getBoundingClientRect();
            top: 0,
            left: 0,
            right: window.innerWidth,
            bottom: window.innerHeight,
        };
        const viewportMargins = {
            top: triggerRect.top - viewportRect.top,
            right: viewportRect.right - triggerRect.right,
            bottom: viewportRect.bottom - triggerRect.bottom,
            left: triggerRect.left - viewportRect.left,
        };
        const triggerParentStyle = getComputedStyle(trigger.parentElement);
        const wantsSidePosition = triggerParentStyle.display === "flex" && triggerParentStyle.flexDirection === "column";

        // We prefer to display tooltips above or below the trigger, except in the action list and the changelog
        let displayOverUnder = true;
        if (tooltipRect.height > Math.max(viewportMargins.top, viewportMargins.bottom)) displayOverUnder = false;
        if (wantsSidePosition && tooltipRect.width <= Math.max(viewportMargins.left, viewportMargins.right)) displayOverUnder = false;

        const targetPos = {
            x: 0,
            y: 0,
        };

        if (displayOverUnder) {
            targetPos.y = viewportMargins.top > viewportMargins.bottom
                          ? triggerRect.top - tooltipRect.height
                          : triggerRect.bottom;
            targetPos.x = viewportMargins.left > viewportMargins.right && tooltipRect.width > triggerRect.width
                          ? triggerRect.right - tooltipRect.width
                          : triggerRect.left;
        } else {
            targetPos.x = viewportMargins.left > viewportMargins.right
                          ? triggerRect.left - tooltipRect.width
                          : triggerRect.right;
            targetPos.y = viewportMargins.top > viewportMargins.bottom
                          ? triggerRect.bottom - tooltipRect.height
                          : triggerRect.top;
        }

        // check all bounds and nudge the tooltip back onto the screen if necessary, favoring the
        // top and left edges. don't trust the trbl on tooltipRect, since adjusting those isn't in spec.
        targetPos.x = Math.min(targetPos.x, viewportRect.right - tooltipRect.width);
        targetPos.y = Math.min(targetPos.y, viewportRect.bottom - tooltipRect.height);
        targetPos.x = Math.max(targetPos.x, viewportRect.left);
        targetPos.y = Math.max(targetPos.y, viewportRect.top);

        // console.log("Fixing tooltip:",{tooltip,tooltipRect,trigger,triggerRect,event});

        // Now, check and see if we can do a nudge (valid rect, currently fixed) or if we have to do initial position
        const curLeft = parseFloat(tooltip.style.left);
        const curTop = parseFloat(tooltip.style.top);
        if (tooltip.style.position === "fixed" && isFinite(curLeft) && isFinite(curTop) && tooltipRect.width > 0 && tooltipRect.height > 0) {
            // simple nudge
            tooltip.style.left = `${curLeft + targetPos.x - tooltipRect.x}px`;
            tooltip.style.top = `${curTop + targetPos.y - tooltipRect.y}px`;
        } else {
            // initial positioning
            tooltip.style.position = "fixed";
            tooltip.style.left = `${targetPos.x - viewportRect.left}px`;
            tooltip.style.top = `${targetPos.y - viewportRect.top}px`;
            tooltip.style.right = "auto";
            tooltip.style.bottom = "auto";
            tooltip.style.margin = "0";
            if (!delayedCall) {
                // queue up a nudge ASAP, but avoid infinite recursion
                requestAnimationFrame(() => this.fixTooltipPosition(tooltip, trigger, eventTarget, true));
            }
        }
    }

    showStat(stat) {
        statShowing = stat;
        if (stat !== undefined) this.updateStat(stat);
    };

    updateStatGraphNeeded = false;

    /** @param {StatName} stat */
    updateStat(stat) {
        const level = getLevel(stat);
        const talent = getTalent(stat);
        const totalLevel = Object.values(stats).map(s=>s.statLevelExp.level).reduce((a,b) => a + b);
        const totalTalent = Object.values(stats).map(s=>s.talentLevelExp.level).reduce((a,b) => a + b);
        const levelPrc = `${getPrcToNextLevel(stat)}%`;
        const talentPrc = `${getPrcToNextTalent(stat)}%`;

        this.updateLevelLogBar("statsContainer", `stat${stat}LevelLogBar`, level, `stat${stat}LevelBar`, levelPrc);
        this.updateLevelLogBar("statsContainer", `stat${stat}TalentLogBar`, talent, `stat${stat}TalentBar`, talentPrc);

        document.getElementById(`stat${stat}Level`).textContent = intToString(level, 1);
        document.getElementById(`stat${stat}Talent`).textContent = intToString(talent, 1);
        document.getElementById(`stattotalLevel`).textContent = intToString(totalLevel, 1);
        document.getElementById(`stattotalTalent`).textContent = intToString(totalTalent, 1);

        if (statShowing === stat || document.getElementById(`stat${stat}LevelExp`).innerHTML === "") {
            document.getElementById(`stat${stat}Level2`).textContent = intToString(level, 1);
            document.getElementById(`stat${stat}LevelExp`).textContent = intToString(stats[stat].statLevelExp.exp, 1);
            document.getElementById(`stat${stat}LevelExpNeeded`).textContent = intToString(stats[stat].statLevelExp.expRequiredForNextLevel, 1);
            document.getElementById(`stat${stat}LevelProgress`).textContent = intToString(levelPrc, 2);

            document.getElementById(`stat${stat}Talent2`).textContent = intToString(talent, 1);
            document.getElementById(`stat${stat}TalentExp`).textContent = intToString(stats[stat].talentLevelExp.exp, 1);
            document.getElementById(`stat${stat}TalentExpNeeded`).textContent = intToString(stats[stat].talentLevelExp.expRequiredForNextLevel, 1);
            document.getElementById(`stat${stat}TalentMult`).textContent = intToString(stats[stat].talentMult, 3);
            document.getElementById(`stat${stat}TalentProgress`).textContent = intToString(talentPrc, 2);
            document.getElementById(`stat${stat}TotalMult`).textContent = intToString(getTotalBonusXP(stat), 3);
        }
    };

    /**
     * @param {string} maxContainerId 
     * @param {string} logBarId
     * @param {number} level
     * @param {string} [levelBarId]
     * @param {string} [levelPrc]
     */
    updateLevelLogBar(maxContainerId, logBarId, level, levelBarId, levelPrc) {
        const maxContainer = htmlElement(maxContainerId);
        const logLevel = level; //Math.log10(level);
        let maxValue = parseFloat(getComputedStyle(maxContainer).getPropertyValue("--max-bar-value")) || 0;

        const logBar = htmlElement(logBarId);
        if (level > maxValue) {
            maxValue = Math.pow(2, Math.ceil(Math.log2(level + 1)));
            maxContainer.style.setProperty("--max-bar-value", String(maxValue));
        }
        logBar.style.setProperty("--bar-value", String(logLevel));
        if (levelBarId) document.getElementById(levelBarId).style.width = levelPrc;
    }

    updateStats(skipAnimation) {
        let maxValue = 100; // I really need to stop writing this default explicitly everywhere
        for (const stat of statList) {
            for (const value of [getLevel(stat), getTalent(stat), stats[stat].soulstone]) {
                maxValue = Math.max(value, maxValue);
            }
        }
        maxValue = Math.pow(2, Math.ceil(Math.log2(maxValue)));
        const statsContainer = htmlElement("statsContainer");
        if (skipAnimation) {
            statsContainer.classList.remove("animate-logBars");
            statGraph.update(true);
        }
        statsContainer.style.setProperty("--max-bar-value", String(maxValue));
        if (!statsContainer.classList.contains("animate-logBars")) {
            requestAnimationFrame(() => statsContainer.classList.add("animate-logBars"));
        }

        for (const stat of statList) {
            this.updateStat(stat);
        }
    };

    showSkill(skill) {
        skillShowing = skill;
        if (skill !== undefined) this.updateSkill(skill);
    };

    /** @param {SkillName} skill */
    updateSkill(skill) {
        if (skills[skill].levelExp.level === 0) {
            document.getElementById(`skill${skill}Container`).style.display = "none";
            return;
        }
        let container = document.getElementById(`skill${skill}Container`);
        container.style.display = "inline-block";
        if (skill === "Combat" || skill === "Pyromancy" || skill === "Restoration") {
            this.updateTeamCombat();
        }

        const levelPrc = getPrcToNextSkillLevel(skill);
        document.getElementById(`skill${skill}Level`).textContent = (getSkillLevel(skill) > 9999) ? toSuffix(getSkillLevel(skill)) : formatNumber(getSkillLevel(skill));
        document.getElementById(`skill${skill}LevelBar`).style.width = `${levelPrc}%`;

        if (skillShowing === skill) {
            document.getElementById(`skill${skill}LevelExp`).textContent = intToString(skills[skill].levelExp.exp, 1);
            document.getElementById(`skill${skill}LevelExpNeeded`).textContent = intToString(skills[skill].levelExp.expRequiredForNextLevel, 1);
            document.getElementById(`skill${skill}LevelProgress`).textContent = intToString(levelPrc, 2);

            if (skill === "Dark") {
                document.getElementById("skillBonusDark").textContent = intToString(getSkillBonus("Dark"), 4);
            } else if (skill === "Chronomancy") {
                document.getElementById("skillBonusChronomancy").textContent = intToString(getSkillBonus("Chronomancy"), 4);
            } else if (skill === "Practical") {
                document.getElementById("skillBonusPractical").textContent = getSkillBonus("Practical").toFixed(3).replace(/(\.\d*?[1-9])0+$/gu, "$1");
            } else if (skill === "Mercantilism") {
                document.getElementById("skillBonusMercantilism").textContent = intToString(getSkillBonus("Mercantilism"), 4);
            } else if (skill === "Spatiomancy") {
                document.getElementById("skillBonusSpatiomancy").textContent = getSkillBonus("Spatiomancy").toFixed(3).replace(/(\.\d*?[1-9])0+$/gu, "$1");
            } else if (skill === "Divine") {
                document.getElementById("skillBonusDivine").textContent = intToString(getSkillBonus("Divine"), 4);
            } else if (skill === "Commune") {
                document.getElementById("skillBonusCommune").textContent = getSkillBonus("Commune").toFixed(3).replace(/(\.\d*?[1-9])0+$/gu, "$1");
            } else if (skill === "Wunderkind") {
                document.getElementById("skillBonusWunderkind").textContent = intToString(getSkillBonus("Wunderkind"), 4);
            }else if (skill === "Gluttony") {
                document.getElementById("skillBonusGluttony").textContent = getSkillBonus("Gluttony").toFixed(3).replace(/(\.\d*?[1-9])0+$/gu, "$1");
            } else if (skill === "Thievery") {
                document.getElementById("skillBonusThievery").textContent = intToString(getSkillBonus("Thievery"), 4);
            } else if (skill === "Leadership") {
                document.getElementById("skillBonusLeadership").textContent = intToString(getSkillBonus("Leadership"), 4);
            } else if (skill === "Assassin") {
                document.getElementById("skillBonusAssassin").textContent = intToString(getSkillBonus("Assassin"), 4);
            }
        }
        this.adjustTooltipPosition(container.querySelector("div.showthis"));
    };

    updateSkills() {
        for (const skill of skillList) {
            this.updateSkill(skill);
        }
    };

    showBuff(buff) {
        buffShowing = buff;
        if (buff !== undefined) this.updateBuff(buff);
    };

    updateBuff(buff) {
        if (buffs[buff].amt === 0) {
            document.getElementById(`buff${buff}Container`).style.display = "none";
            return;
        }
        let container = document.getElementById(`buff${buff}Container`);
        container.style.display = "flex";
        document.getElementById(`buff${buff}Level`).textContent = `${getBuffLevel(buff)}/`;
        if (buff === "Imbuement") {
            this.updateTrainingLimits();
        }
        this.adjustTooltipPosition(container.querySelector("div.showthis"));
    };

    updateBuffs() {
        for (const buff of buffList) {
            this.updateBuff(buff);
        }
    };

    /** @param {string|gapi.client.drive.File} fileOrText */
    updateCloudSave(fileOrText) {
        const list = document.getElementById("cloud_save_result");
        if (typeof fileOrText === "string") {
            list.innerHTML = fileOrText;
        } else if (fileOrText) {
            const fileId = fileOrText.id;
            const fileName = fileOrText.name;
            let li = document.getElementById(`cloud_save_${fileId}`);
            if (li && !fileName) {
                li.remove();
                return;
            }
            if (!li) {
                li = document.createElement("li");
                list.appendChild(li);
            }
            li.className = "cloud_save";
            li.id = `cloud_save_${fileId}`;
            li.dataset.fileId = fileId;
            li.dataset.fileName = fileName;
            li.innerHTML = `
                <button onclick='startRenameCloudSave("${fileId}")' class='cloud_rename actionIcon fas fa-pencil-alt'></button>
                <div class="cloud_save_name"'>
                    ${fileName}
                </div>
                <button class='button cloud_import' style='margin-top: 1px;' onclick='googleCloud.importFile("${fileId}")'>${_txt("menu>save>import_button")}</button>
                <button class='button cloud_delete' style='margin-top: 1px;' onclick='askDeleteCloudSave("${fileId}")'>${_txt("menu>save>delete_button")}</button>
            `;
            const name = /** @type {HTMLElement} */(li.querySelector(".cloud_save_name"));
            name.textContent = fileName;
            name.title = fileName;
        }
    }

    updateTime() {
        document.getElementById("timeBar").style.width = `${100 - timer / timeNeeded * 100}%`;
        document.getElementById("timer").textContent = `${intToString((timeNeeded - timer), options.fractionalMana ? 2 : 1)} | ${formatTime((timeNeeded - timer) / 50 / getActualGameSpeed())}`;
        this.adjustGoldCost({varName:"Wells", cost: Action.ManaWell.goldCost()});
    };
    updateOffline() {
        document.getElementById("bonusSeconds").textContent = formatTime(totalOfflineMs / 1000);
        const returnTimeButton = document.getElementById("returnTimeButton");
        if (returnTimeButton instanceof HTMLButtonElement) {
            returnTimeButton.disabled = totalOfflineMs < 86400_000;
        }
    }
    updateBonusText() {
        const element = document.getElementById("bonusText");
        if (!element) return;
        element.innerHTML = this.getBonusText() ?? "";
    }
    getBonusText() {
        let text = _txt("time_controls>bonus_seconds>main_text");
        let lastText = null;
        while (lastText !== text) {
            lastText = text;
            text = text?.replace(/{([^+{}-]*)([+-]?)(.*?)}/g, (_str, lhs, op, rhs) => this.getBonusReplacement(lhs, op, rhs));
        }
        return text;
    }
    /** @type {(lhs: string, op?: string, rhs?: string) => string} */
    getBonusReplacement(lhs, op, rhs) {
        // this is the second time I've manually implemented this text-replacement pattern (first was for Action Log entries). Next time I need to make it a
        // generic operation on Localization; I think I'm beginning to figure out what will be needed for it
        const fgSpeed = Math.max(5, options.speedIncrease10x ? 10 : 0, options.speedIncrease20x ? 20 : 0, options.speedIncreaseCustom);
        const bgSpeed = !isFinite(options.speedIncreaseBackground) ? -1 : options.speedIncreaseBackground ?? -1;
        const variables = {
            __proto__: null, // toString is not a valid replacement name
            get background_info() {
                if (bgSpeed < 0 || bgSpeed === fgSpeed) {
                    return _txt("time_controls>bonus_seconds>background_disabled");
                } else if (bgSpeed === 0) {
                    return _txt("time_controls>bonus_seconds>background_0x");
                } else if (bgSpeed < 1) {
                    return _txt("time_controls>bonus_seconds>background_regen");
                } else if (bgSpeed === 1) {
                    return _txt("time_controls>bonus_seconds>background_1x");
                } else if (bgSpeed < fgSpeed) {
                    return _txt("time_controls>bonus_seconds>background_slower");
                } else {
                    return _txt("time_controls>bonus_seconds>background_faster");
                }
            },
            get state() {return `<span class='bold' id='isBonusOn'>${_txt(`time_controls>bonus_seconds>state>${isBonusActive() ? "on" : "off"}`)}</span>`},
            get counter_text() {return `<span class='bold'>${_txt("time_controls>bonus_seconds>counter_text")}</span>`},
            get bonusSeconds() {return `<span id='bonusSeconds'>${formatTime(totalOfflineMs / 1000)}</span>`},
            get lag_warning() {return lagSpeed > 0 ? _txt("time_controls>bonus_seconds>lag_warning") : ""},
            speed: fgSpeed,
            background_speed: bgSpeed,
            lagSpeed,
        }
        const lval = variables[lhs] ?? (parseFloat(lhs) || 0);
        const rval = variables[rhs] ?? (parseFloat(rhs) || 0);
        return String(
            op === "+" ? lval + rval
            : op === "-" ? lval - rval
            : lval);
    }
    updateTotalTicks() {
        document.getElementById("totalTicks").textContent = `${formatNumber(actions.completedTicks)} | ${formatTime(timeCounter)}`;
        document.getElementById("effectiveTime").textContent = `${formatTime(effectiveTime)}`;
    };
    updateResource(resource) {
        const element = htmlElement(`${resource}Div`, false, false);
        if (element) element.style.display = resources[resource] ? "inline-block" : "none";

        if (resource === "supplies") document.getElementById("suppliesCost").textContent = String(towns[0].suppliesCost);
        if (resource === "teamMembers") document.getElementById("teamCost").textContent = `${(resources.teamMembers + 1) * 100}`;

        if (Number.isFinite(resources[resource])) htmlElement(resource).textContent = resources[resource];
    };
    updateResources() {
        for (const resource in resources) this.updateResource(resource);
    };
    updateActionTooltips() {
        document.getElementById("goldInvested").textContent = intToStringRound(goldInvested);
        document.getElementById("bankInterest").textContent = intToStringRound(goldInvested * .001);
        document.getElementById("actionAllowedPockets").textContent = intToStringRound(towns[7].totalPockets);
        document.getElementById("actionAllowedWarehouses").textContent = intToStringRound(towns[7].totalWarehouses);
        document.getElementById("actionAllowedInsurance").textContent = intToStringRound(towns[7].totalInsurance);
        document.getElementById("totalSurveyProgress").textContent = `${getExploreProgress()}`;
        Array.from(document.getElementsByClassName("surveySkill")).forEach(div => {
            div.textContent = `${getExploreSkill()}`;
        });
    }
    updateTeamCombat() {
        if (towns[2].unlocked) {
            document.getElementById("skillSCombatContainer").style.display = "inline-block";
            document.getElementById("skillTCombatContainer").style.display = "inline-block";
            document.getElementById("skillSCombatLevel").textContent = intToString(getSelfCombat(), 1);
            document.getElementById("skillTCombatLevel").textContent = intToString(getTeamCombat(), 1);
        } else {
            document.getElementById("skillSCombatContainer").style.display = "none";
            document.getElementById("skillTCombatContainer").style.display = "none";
        }
    };
    zoneTints = [
        "var(--zone-tint-1)", //Beginnersville
        "var(--zone-tint-2)", //Forest Path
        "var(--zone-tint-3)", //Merchanton
        "var(--zone-tint-4)", //Mt Olympus
        "var(--zone-tint-5)", //Valhalla
        "var(--zone-tint-6)", //Startington
        "var(--zone-tint-7)", //Jungle Path
        "var(--zone-tint-8)", //Commerceville
        "var(--zone-tint-9)", //Valley of Olympus
    ];
    highlightAction(index) {
        const element = document.getElementById(`nextActionContainer${index}`);
        if (!(element instanceof HTMLElement)) return;
        element.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
        })
    };
    updateNextActions() {
        if (options.predictor) {
            Koviko.preUpdateHandler(nextActionsDiv);
        }

        let totalDivText = "";

        for (const [i, action] of actions.next.entries()) {
            const translatedAction = getActionPrototype(action.name);
            let capButton = "";
            const townNum = translatedAction.townNum;
            const travelNum = getTravelNum(action.name);
            const collapses = [];
            // eslint-disable-next-line no-loop-func
            actions.next.forEach((a, index) => {
                if (a.collapsed) {
                    const collapse = {};
                    collapse.zone = getActionPrototype(a.name).townNum;
                    collapse.index = index;
                    collapses.push(collapse);
                }
            });
            if (hasLimit(action.name)) {
                capButton = `<button id='capButton${i}' onclick='capAmount(${i}, ${townNum})' class='actionIcon far fa-circle'></button>`;
            } else if (isTraining(action.name)) {
                capButton = `<button id='capButton${i}' onclick='capTraining(${i})' class='actionIcon far fa-circle'></button>`;
            }
            let isSingular;
            if (translatedAction.allowed === undefined) {
                isSingular = false;
            } else {
                isSingular = translatedAction.allowed() === 1;
            }
            const actionLoops = action.loops > 99999 ? toSuffix(action.loops) : formatNumber(action.loops);
            const opacity = action.disabled || action.loops === 0 ? "opacity: 0.5" : "";
            let display = "display: flex";
            for (const collapse of collapses) {
                if (townNum === collapse.zone && i < collapse.index) display = "display: none";
            }
            let color;
            if (action.name === "Face Judgement") {
                color = "linear-gradient(to bottom, var(--zone-tint-4-opaque) 49%, transparent 51%), linear-gradient(to right, var(--zone-tint-5) 50%, var(--zone-tint-6) 51%)";
            } else if (action.name === "Fall From Grace") {
                color = "linear-gradient(to bottom, var(--zone-tint-5) 49%, var(--zone-tint-6) 51%)";
            } else if (action.name === "Open Rift") {
                color = "linear-gradient(to bottom, var(--zone-tint-1) 49%, var(--zone-tint-6) 51%)";
            } else {
                color = (travelNum > 0 || travelNum == -5) ? `linear-gradient(${this.zoneTints[townNum]} 49%, ${this.zoneTints[townNum + travelNum]} 51%)` : this.zoneTints[townNum];
            }
            const imageName = action.name.startsWith("Assassin") ? "assassin" : camelize(action.name);
            totalDivText +=
                `<div
                    id='nextActionContainer${i}'
                    class='nextActionContainer small showthat'
                    ondragover='handleDragOver(event)'
                    ondrop='handleDragDrop(event)'
                    ondragstart='handleDragStart(event)'
                    ondragend='draggedUndecorate(${i})'
                    ondragenter='dragOverDecorate(${i})'
                    ondragleave='dragExitUndecorate(${i})'
                    draggable='true' data-index='${i}'
                    style='background: ${color}; ${opacity}; ${display};'
                >
                    <div class='nextActionLoops'><img src='img/${imageName}.svg' class='smallIcon imageDragFix'> x
                    <div class='bold'>${actionLoops}</div></div>
                    <div class='nextActionButtons'>
                        ${capButton}
                        ${isSingular ? "" : `<button id='plusButton${i}' onclick='addLoop(${i})' class='actionIcon fas fa-plus'></button>`}
                        ${isSingular ? "" : `<button id='minusButton${i}' onclick='removeLoop(${i})' class='actionIcon fas fa-minus'></button>`}
                        ${isSingular ? "" : `<button id='splitButton${i}' onclick='split(${i})' class='actionIcon fas fa-arrows-alt-h'></button>`}
                        ${travelNum ? `<button id='collapseButton${i}' onclick='collapse(${i})' class='actionIcon fas fa-${action.collapsed ? "expand" : "compress"}-alt'></button>` : ""}
                        <button id='upButton${i}' onclick='moveUp(${i})' class='actionIcon fas fa-sort-up'></button>
                        <button id='downButton${i}' onclick='moveDown(${i})' class='actionIcon fas fa-sort-down'></button>
                        <button id='skipButton${i}' onclick='disableAction(${i})' class='actionIcon far fa-${action.disabled ? "check" : "times"}-circle'></button>
                        <button id='removeButton${i}' onclick='removeAction(${i})' class='actionIcon fas fa-times'></button>
                    </div>
                    <ul class='koviko'></ul>
                </div>`;
        }
        nextActionsDiv.innerHTML = totalDivText;
        if (options.predictor) {
            Koviko.postUpdateHandler(actions.next, nextActionsDiv);
        }
    };

    updateCurrentActionsDivs() {
        let totalDivText = "";

        // definite leak - need to remove listeners and image
        for (let i = 0; i < actions.current.length; i++) {
            const action = actions.current[i];
            const actionLoops = action.loops > 99999 ? toSuffix(action.loops) : formatNumber(action.loops);
            const actionLoopsDone = (action.loops - action.loopsLeft) > 99999 ? toSuffix(action.loops - action.loopsLeft) : formatNumber(action.loops - action.loopsLeft);
            const imageName = action.name.startsWith("Assassin") ? "assassin" : camelize(action.name);
            totalDivText +=
                `<div class='curActionContainer small' onmouseover='view.mouseoverAction(${i}, true)' onmouseleave='view.mouseoverAction(${i}, false)'>
                    <div class='curActionBar' id='action${i}Bar'></div>
                    <div class='actionSelectedIndicator' id='action${i}Selected'></div>
                    <img src='img/${imageName}.svg' class='smallIcon'>
                    <div id='action${i}LoopsDone' style='margin-left:3px; border-left: 1px solid var(--action-separator-border);padding-left: 3px;'>${actionLoopsDone}</div>
                    /<div id='action${i}Loops'>${actionLoops}</div>
                </div>`;
        }

        curActionsDiv.innerHTML = totalDivText;

        totalDivText = "";

        for (let i = 0; i < actions.current.length; i++) {
            const action = actions.current[i];
            totalDivText +=
                `<div id='actionTooltip${i}' style='display:none;padding-left:10px;width:90%'>` +
                    `<div style='text-align:center;width:100%'>${action.label}</div><br><br>` +
                    `<b>${_txt("actions>current_action>mana_original")}</b> <div id='action${i}ManaOrig'></div><br>` +
                    `<b>${_txt("actions>current_action>mana_used")}</b> <div id='action${i}ManaUsed'></div><br>` +
                    `<b>${_txt("actions>current_action>last_mana")}</b> <div id='action${i}LastMana'></div><br>` +
                    `<b>${_txt("actions>current_action>mana_remaining")}</b> <div id='action${i}Remaining'></div><br>` +
                    `<b>${_txt("actions>current_action>gold_remaining")}</b> <div id='action${i}GoldRemaining'></div><br>` +
                    `<b>${_txt("actions>current_action>time_spent")}</b> <div id='action${i}TimeSpent'></div><br>` +
                    `<b>${_txt("actions>current_action>total_time_elapsed")}</b> <div id='action${i}TotalTimeElapsed'></div><br>` +
                    `<br>` +
                    `<div id='action${i}ExpGain'></div>` +
                    `<div id='action${i}HasFailed' style='display:none'>` +
                        `<b>${_txt("actions>current_action>failed_attempts")}</b> <div id='action${i}Failed'></div><br>` +
                        `<b>${_txt("actions>current_action>error")}</b> <div id='action${i}Error'></div>` +
                    `</div>` +
                `</div>`;
        }

        document.getElementById("actionTooltipContainer").innerHTML = totalDivText;
        this.mouseoverAction(0, false);
    };

    updateCurrentActionBar(index) {
        const div = document.getElementById(`action${index}Bar`);
        if (!div) {
            return;
        }
        const action = actions.current[index];
        if (!action) {
            return;
        }
        if (action.errorMessage) {
            document.getElementById(`action${index}Failed`).textContent = `${action.loopsLeft}`;
            document.getElementById(`action${index}Error`).textContent = action.errorMessage;
            document.getElementById(`action${index}HasFailed`).style.display = "";
            div.style.width = "100%";
            div.style.backgroundColor = "var(--cur-action-error-indicator)";
            div.style.height = "30%";
            div.style.marginTop = "5px";
            if (action.name === "Heal The Sick") unlockStory("failedHeal");
            if (action.name === "Brew Potions" && resources.reputation >= 0 && resources.herbs >= 10) unlockStory("failedBrewPotions");
            if (action.name === "Brew Potions" && resources.reputation < 0 && resources.herbs >= 10) unlockStory("failedBrewPotionsNegativeRep");
            if (action.name === "Gamble" && resources.reputation < -5) unlockStory("failedGamble");
            if (action.name === "Gamble" && resources.gold < 20 && resources.reputation > -6) unlockStory("failedGambleLowMoney");
            if (action.name === "Gather Team") unlockStory("failedGatherTeam");
            if (action.name === "Craft Armor") unlockStory("failedCraftArmor");
            if (action.name === "Imbue Body") unlockStory("failedImbueBody");
            if (action.name === "Accept Donations") unlockStory("failedReceivedDonations");
            if (action.name === "Raise Zombie") unlockStory("failedRaiseZombie")
        } else if (action.loopsLeft === 0) {
            div.style.width = "100%";
            div.style.backgroundColor = "var(--cur-action-completed-background)";
        } else {
            div.style.width = `${100 * action.ticks / action.adjustedTicks.approximateValue}%`;
        }

        // only update tooltip if it's open
        if (curActionShowing === index) {
            document.getElementById(`action${index}ManaOrig`).textContent = intToString(action.manaCost() * action.loops, options.fractionalMana ? 3 : 1);
            document.getElementById(`action${index}ManaUsed`).textContent = intToString(action.manaUsed, options.fractionalMana ? 3 : 1);
            document.getElementById(`action${index}LastMana`).textContent = intToString(action.lastMana, 3);
            document.getElementById(`action${index}Remaining`).textContent = intToString(action.manaRemaining, options.fractionalMana ? 3 : 1);
            document.getElementById(`action${index}GoldRemaining`).textContent = formatNumber(action.goldRemaining);
            document.getElementById(`action${index}TimeSpent`).textContent = formatTime(action.timeSpent);
            document.getElementById(`action${index}TotalTimeElapsed`).textContent = formatTime(action.effectiveTimeElapsed);

            let statExpGain = "";
            const expGainDiv = document.getElementById(`action${index}ExpGain`);
            while (expGainDiv.firstChild) {
                expGainDiv.removeChild(expGainDiv.firstChild);
            }
            for (const stat of statList) {
                if (action[`statExp${stat}`]) {
                    statExpGain += `<div class='bold'>${_txt(`stats>${stat}>short_form`)}:</div> ${intToString(action[`statExp${stat}`], 2)}<br>`;
                }
            }
            expGainDiv.innerHTML = statExpGain;
        }
    };

    /** @typedef {{lastScroll:Pick<HTMLElement,'scrollTop'|'scrollHeight'|'clientHeight'>}} LastScrollRecord */
    /** @type {string} */
    actionLogClearHTML;
    /** @type {ResizeObserver} */
    actionLogObserver;
    initActionLog() {
        const log = /** @type {HTMLElement & LastScrollRecord} */(document.getElementById("actionLog"));
        this.actionLogClearHTML ??= log.innerHTML;
        this.actionLogObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.target !== log) continue;
                // console.log(entry,entry.target,log,log.scrollTop,log.scrollHeight,log.clientHeight,log.lastScroll);
                // check the most recent position of the scroll bottom
                const {scrollTop, scrollHeight, clientHeight, lastScroll} = log;
                const lastScrollBottom = lastScroll ? lastScroll.scrollHeight - (lastScroll.scrollTop + lastScroll.clientHeight) : 0;
                // check the current position
                const scrollBottom = scrollHeight - (scrollTop + clientHeight);
                // shift by that delta
                log.scrollTop += scrollBottom - lastScrollBottom;
            }
        });
        this.actionLogObserver.observe(log);
        log.addEventListener("scroll", this.recordScrollPosition, {passive: true});
        log.addEventListener("scrollend", this.recordScrollPosition, {passive: true});
    }
    /** @this {HTMLElement & LastScrollRecord} */
    recordScrollPosition = function() {
        const {scrollTop, scrollHeight, clientHeight} = this;
        this.lastScroll = {scrollTop, scrollHeight, clientHeight};
    }
    updateActionLogEntry(index) {
        const log = document.getElementById("actionLog");
        this.actionLogClearHTML ??= log.innerHTML;
        if (index === "clear") {
            log.innerHTML = this.actionLogClearHTML; // nuke it, dot it
        }
        const entry = actionLog.getEntry(index);
        if (actionLog.hasPrevious()) {
            log.classList.add("hasPrevious");
        } else {
            log.classList.remove("hasPrevious");
        }
        if (!entry) return;
        let element = document.getElementById(`actionLogEntry${index}`);
        if (element) {
            entry.element = element;
            entry.updateElement();
        } else {
            element = entry.createElement();
            element.id = `actionLogEntry${index}`;
            element.style.order = index;

            const nextEntry = htmlElement(`actionLogEntry${index+1}`, false, false);
            log.insertBefore(element, nextEntry ?? htmlElement("actionLogLatest"));
        }
        if ((actionLog.firstNewOrUpdatedEntry ?? Infinity) <= index) {
            element.classList.add("highlight");
            // this is just causing problems right now. disable, it's not all that important if scroll anchors work properly
            // element.scrollIntoView({block: "nearest", inline: "nearest", behavior: "auto"});
            setTimeout(() => element.classList.remove("highlight"), 1);
        }
    }

    mouseoverAction(index, isShowing) {
        if (isShowing) curActionShowing = index;
        else curActionShowing = undefined;
        const div = document.getElementById(`action${index}Selected`);
        if (div) {
            div.style.opacity = isShowing ? "1" : "0";
            document.getElementById(`actionTooltip${index}`).style.display = isShowing ? "" : "none";
        }
        nextActionsDiv.style.display = isShowing ? "none" : "";
        document.getElementById("actionTooltipContainer").style.display = isShowing ? "" : "none";
        view.updateCurrentActionBar(index);
    };

    updateCurrentActionLoops(index) {
        const action = actions.current[index];
        if (action !== undefined) {
            document.getElementById(`action${index}LoopsDone`).textContent = (action.loops - action.loopsLeft) > 99999
                ? toSuffix(action.loops - action.loopsLeft) : formatNumber(action.loops - action.loopsLeft);
            document.getElementById(`action${index}Loops`).textContent = action.loops > 99999 ? toSuffix(action.loops) : formatNumber(action.loops);
        }
    };

    updateProgressAction(updateInfo) {
        const varName = updateInfo.name;
        const town = updateInfo.town;
        const level = town.getLevel(varName);
        const levelPrc = `${town.getPrcToNext(varName)}%`;
        document.getElementById(`prc${varName}`).textContent = level;
        document.getElementById(`expBar${varName}`).style.width = levelPrc;
        document.getElementById(`progress${varName}`).textContent = intToString(levelPrc, 2);
        document.getElementById(`bar${varName}`).style.width = `${level}%`;
    };

    updateProgressActions() {
        for (const town of towns) {
            for (let i = 0; i < town.progressVars.length; i++) {
                const varName = town.progressVars[i];
                this.updateProgressAction({name: varName, town: town});
            }
        }
    };

    updateLockedHidden() {
        for (const action of totalActionList) {
            const actionDiv = document.getElementById(`container${action.varName}`);
            const infoDiv = document.getElementById(`infoContainer${action.varName}`);
            const storyDiv = document.getElementById(`storyContainer${action.varName}`);
            if (action.allowed && getNumOnList(action.name) >= action.allowed()) {
                addClassToDiv(actionDiv, "capped");
            } else if (action.unlocked()) {
                if (infoDiv) {
                    removeClassFromDiv(infoDiv, "hidden");
                }
                removeClassFromDiv(actionDiv, "locked");
                removeClassFromDiv(actionDiv, "capped");
            } else {
                addClassToDiv(actionDiv, "locked");
                if (infoDiv) {
                    addClassToDiv(infoDiv, "hidden");
                }
            }
            if (action.unlocked() && infoDiv) {
                removeClassFromDiv(infoDiv, "hidden");
            }
            if (action.visible()) {
                removeClassFromDiv(actionDiv, "hidden");
                if (storyDiv !== null) removeClassFromDiv(storyDiv, "hidden");
            } else {
                addClassToDiv(actionDiv, "hidden");
                if (storyDiv !== null) addClassToDiv(storyDiv, "hidden");
            }
            if (storyDiv !== null) {
                if (action.unlocked()) {
                    removeClassFromDiv(storyDiv, "hidden");
                } else {
                    addClassToDiv(storyDiv, "hidden");
                }
            }
        }
        if (totalActionList.filter(action => action.finish.toString().includes("handleSkillExp")).filter(action => action.unlocked()).length > 0) {
            document.getElementById("skillList").style.display = "";
        } else {
            document.getElementById("skillList").style.display = "none";
        }
        if (totalActionList.filter(action => action.finish.toString().includes("updateBuff")).filter(action => action.unlocked()).length > 0 ||
            prestigeValues["completedAnyPrestige"]) {
            document.getElementById("buffList").style.display = "";
        } else {
            document.getElementById("buffList").style.display = "none";
        }
    };

    updateGlobalStory(num) {
        actionLog.addGlobalStory(num);
    }

    updateStories(init) {
        // ~1.56ms cost per run. run once every 2000ms on an interval
        for (const action of totalActionList) {
            if (action.storyReqs !== undefined) {
                // greatly reduces/nullifies the cost of checking actions with all stories unlocked, which is nice,
                // since you're likely to have more stories unlocked at end game, which is when performance is worse
                const divName = `storyContainer${action.varName}`;
                if (init || document.getElementById(divName).innerHTML.includes("???")) {
                    let storyTooltipText = "";
                    let lastInBranch = false;
                    const name = action.name.toLowerCase().replace(/ /gu, "_");
                    const storyAmt = _txt(`actions>${name}`, "fallback").split("⮀").length - 1;
                    let storiesUnlocked = 0;
                    for (let i = 1; i <= storyAmt; i++) {
                        storyTooltipText += "<p>"
                        const storyText = _txt(`actions>${name}>story_${i}`, "fallback").split("⮀");
                        if (action.storyReqs(i)) {
                            storyTooltipText += storyText[0] + storyText[1];
                            lastInBranch = false;
                            storiesUnlocked++;
                            if (action.visible() && action.unlocked() && completedActions.includes(action.varName)) {
                                actionLog.addActionStory(action, i, init);
                            }
                        } else if (lastInBranch) {
                            storyTooltipText += "<b>???:</b> ???";
                        } else {
                            storyTooltipText += `${storyText[0]} ???`;
                            lastInBranch = true;
                        }
                        storyTooltipText += "</p>\n";
                    }
                    if (document.getElementById(divName).children[2].innerHTML !== storyTooltipText) {
                        document.getElementById(divName).children[2].innerHTML = storyTooltipText;
                        if (!init) {
                            showNotification(divName);
                            if (!unreadActionStories.includes(divName)) unreadActionStories.push(divName);
                        }
                        if (storiesUnlocked === storyAmt) {
                            document.getElementById(divName).classList.add("storyContainerCompleted");
                        } else {
                            document.getElementById(divName).classList.remove("storyContainerCompleted");
                        }
                    }
                }
            }
        }
    };

    showTown(townNum) {
        if (!towns[townNum].unlocked()) return;

        if (townNum === 0) {
            document.getElementById("townViewLeft").style.visibility = "hidden";
        } else {
            document.getElementById("townViewLeft").style.visibility = "";
        }

        if (townNum === Math.max(...townsUnlocked)) {
            document.getElementById("townViewRight").style.visibility = "hidden";
        } else {
            document.getElementById("townViewRight").style.visibility = "";
        }

        for (let i = 0; i < actionOptionsTown.length; i++) {
            actionOptionsTown[i].style.display = "none";
            actionStoriesTown[i].style.display = "none";
            townInfos[i].style.display = "none";
        }
        if (actionStoriesShowing) actionStoriesTown[townNum].style.display = "";
        else actionOptionsTown[townNum].style.display = "";
        townInfos[townNum].style.display = "";
        $("#TownSelect").val(townNum);
        document.getElementById("townDesc").textContent = _txt(`towns>town${townNum}>desc`);
        townShowing = townNum;
    };

    showActions(stories) {
        for (let i = 0; i < actionOptionsTown.length; i++) {
            actionOptionsTown[i].style.display = "none";
            actionStoriesTown[i].style.display = "none";
        }

        if (stories) {
            document.getElementById("actionsViewLeft").style.visibility = "";
            document.getElementById("actionsViewRight").style.visibility = "hidden";
            actionStoriesTown[townShowing].style.display = "";
        } else {
            document.getElementById("actionsViewLeft").style.visibility = "hidden";
            document.getElementById("actionsViewRight").style.visibility = "";
            actionOptionsTown[townShowing].style.display = "";
        }

        document.getElementById("actionsTitle").textContent = _txt(`actions>title${(stories) ? "_stories" : ""}`);
        actionStoriesShowing = stories;
    };

    updateRegular(updateInfo) {
        const varName = updateInfo.name;
        const index = updateInfo.index;
        const town = towns[index];
        htmlElement(`total${varName}`).textContent = String(town[`total${varName}`]);
        htmlElement(`checked${varName}`).textContent = String(town[`checked${varName}`]);
        htmlElement(`unchecked${varName}`).textContent = String(town[`total${varName}`] - town[`checked${varName}`]);
        htmlElement(`goodTemp${varName}`).textContent = String(town[`goodTemp${varName}`]);
        htmlElement(`good${varName}`).textContent = String(town[`good${varName}`]);
    };

    updateAddAmount(num) {
        for (let i = 0; i < 6; i++) {
            const elem = document.getElementById(`amount${num}`);
            if (elem) {
                addClassToDiv(elem, "unused");
            }
        }
        if (num > 0) removeClassFromDiv(document.getElementById(`amount${num}`), "unused");
    };

    updateLoadout(num) {
        for (let i = 0; i < 16; i++) {
            const elem = document.getElementById(`load${i}`);
            if (elem) {
                addClassToDiv(elem, "unused");
            }
        }
        const elem = document.getElementById(`load${num}`);
        if (elem) {
            removeClassFromDiv(document.getElementById(`load${num}`), "unused");
        }
    };

    updateLoadoutNames() {
        for (let i = 0; i < loadoutnames.length; i++) {
            document.getElementById(`load${i + 1}`).textContent = loadoutnames[i];
        }
        inputElement("renameLoadout").value = loadoutnames[curLoadout - 1];
    };

    createTownActions() {
        if (actionOptionsTown[0].firstChild) return;
        for (const prop in Action) {
            const action = Action[prop];
            this.createTownAction(action);
            if (action.type === "limited") this.createTownInfo(action);
            if (action.type === "progress") this.createActionProgress(action);
            if (action.type === "multipart") this.createMultiPartPBar(action);
            if (options.highlightNew) this.highlightIncompleteActions();
        }
    };

    createActionProgress(action) {
        const totalDivText =
        `<div class='townStatContainer showthat'>
            <div class='bold townLabel'>${action.labelDone}</div>
            <div class='progressValue' id='prc${action.varName}'>5</div><div class='percentSign'>%</div>
            <div class='thinProgressBarUpper'><div id='expBar${action.varName}' class='statBar townExpBar'></div></div>
            <div class='thinProgressBarLower'><div id='bar${action.varName}' class='statBar townBar'></div></div>

            <div class='showthis'>
                ${_txt("actions>tooltip>higher_done_percent_benefic")}<br>
                <div class='bold'>${_txt("actions>tooltip>progress_label")}</div> <div id='progress${action.varName}'></div>%
            </div>
        </div>`;
        const progressDiv = document.createElement("div");
        progressDiv.className = "townContainer progressType";
        progressDiv.id = `infoContainer${action.varName}`;
        progressDiv.style.display = "";
        progressDiv.innerHTML = totalDivText;
        townInfos[action.townNum].appendChild(progressDiv);
    };

    /** @param {Action} action  */
    createTownAction(action) {
        let actionStats = "";
        let actionSkills = "";
        let skillDetails = "";
        let lockedStats = "";
        let lockedSkills = "";
        const pieSlices = [];
        const gradientStops=[];
        const {statFractions} = action;
        // sort high to low, then by statname index
        const totalFraction = new Rational();
        const gradientOffset = new Rational();
        let lastArcPoint = [0, -1]; // start at 12 o'clock
        for (const fraction of statFractions) {
            const stat = fraction.statName;
            const ratio = fraction.approximateValue;
            const statLabel = _txt(`stats>${stat}>short_form`);
            actionStats += `<dt class='stat-${stat}'>${statLabel}</dt> <dd class='stat-${stat}'>${fraction.times(100)}%</dd>`;
            const startRatio = totalFraction.clone();
            totalFraction.add(fraction);
            const midRatio = startRatio.plus(totalFraction).divideBy(2);
            const angle = Math.PI * 2 * totalFraction.approximateValue;
            const arcPoint = [Math.sin(angle), -Math.cos(angle)];
            pieSlices.push(`<path class='pie-slice stat-${stat}' d='M0,0 L${lastArcPoint.join()} A1,1 0,${ratio >= 0.5 ? 1 : 0},1 ${arcPoint.join()} Z' />`);
            if (gradientStops.length === 0) {
                gradientOffset.copyFrom(midRatio);
                gradientStops.push(`from ${gradientOffset.approximateValue}turn`, `var(--stat-${stat}-color) calc(${gradientOffset.approximateValue}turn * var(--pie-ratio))`);
            } else {
                gradientStops.push(`var(--stat-${stat}-color) calc(${midRatio.minus(gradientOffset).approximateValue}turn - (${ratio/2}turn * var(--pie-ratio))) calc(${midRatio.minus(gradientOffset).approximateValue}turn + (${ratio/2}turn * var(--pie-ratio)))`);
            }
            lastArcPoint = arcPoint;
        }
        // this is *almost* always true (but not always)
        if (statFractions.length > 0) {
            gradientStops.push(`var(--stat-${statFractions[0].statName}-color) calc(1turn - (${gradientOffset.approximateValue}turn * var(--pie-ratio)))`)
            const highestFraction = statFractions[0];
            lockedStats = `(${statFractions.map((fraction) => /** @type {const} */([fraction.equals(highestFraction), fraction.statName, _txt(`stats>${fraction.statName}>short_form`)]))
                                      .map(([isHighestStat, stat, label]) => `<span class='${isHighestStat?"bold":""} stat-${stat} stat-color'>${label}</span>`)
                                      .join(", ")})<br>`;
        }
        const statPie = statFractions.length === 0 ? "" : `
                <svg viewBox='-1 -1 2 2' class='stat-pie' id='stat-pie-${action.varName}'>
                    <g id='stat-pie-${action.varName}-g'>
                        ${pieSlices.join("")}
                    </g>
                </svg>
                <div class='stat-pie mask' style='background:conic-gradient(${gradientStops.join()})'></div>`;
        if (action.skills !== undefined) {
            const skillKeyNames = Object.keys(action.skills);
            const l = skillList.length;
            for (let i = 0; i < l; i++) {
                for (const skill of skillKeyNames) {
                    if (skillList[i] === skill) {
                        const xmlName = getXMLName(skill);
                        const skillLabel = `${_txt(`skills>${xmlName}>label`)} ${_txt("stats>tooltip>exp")}`;
                        actionSkills += `<div class='bold'>${skillLabel}:</div><span id='expGain${action.varName}${skill}'></span><br>`;
                        if (action.teachesSkill(skill)) {
                            const learnSkill = `<div class='bold'>${_txt("actions>tooltip>learn_skill")}:</div>`;
                            lockedSkills += `${learnSkill} <span>${_txt(`skills>${xmlName}>label`)}</span><br>`;
                            skillDetails +=
                                `<hr>
                                ${learnSkill} <div class='bold underline'>${_txt(`skills>${xmlName}>label`)}</div><br>
                                <i>${_txt(`skills>${xmlName}>desc`)}</i><br>`;
                            if (_txtsObj(`skills>${xmlName}>desc2`)?.length > 0) {
                                skillDetails += `${_txt(`skills>${xmlName}>desc2`).replace(/<br>\s*Currently.*(?:<br>|$)/sgi, "") }<br>`; // ugh
                            }
                        }
                    }
                }
            }
        }
        if (isBuffName(action.grantsBuff)) {
            const xmlName = getXMLName(Buff.fullNames[action.grantsBuff]);
            const grantsBuff = `<div class='bold'>${_txt("actions>tooltip>grants_buff")}:</div>`;
            lockedSkills += `${grantsBuff} <span>${_txt(`buffs>${xmlName}>label`)}</span><br>`;
            skillDetails +=
                `<hr>
                ${grantsBuff} <div class='bold underline'>${_txt(`buffs>${xmlName}>label`)}</div><br>
                <i>${_txt(`buffs>${xmlName}>desc`)}</i><br>`;
        }
        let extraImage = "";
        const extraImagePositions = ["margin-top:17px;margin-left:5px;", "margin-top:17px;margin-left:-55px;", "margin-top:0px;margin-left:-55px;", "margin-top:0px;margin-left:5px;"];
        if (action.affectedBy) {
            for (let i = 0; i < action.affectedBy.length; i++) {
                extraImage += `<img src='img/${camelize(action.affectedBy[i])}.svg' class='smallIcon' draggable='false' style='position:absolute;${extraImagePositions[i]}'>`;
            }
        }
        const isTravel = getTravelNum(action.name) > 0;
        const divClass = isTravel ? "travelContainer" : "actionContainer";
        const imageName = action.name.startsWith("Assassin") ? "assassin" : camelize(action.name);
        const unlockConditions = /<br>\s*Unlocked (.*?)(?:<br>|$)/is.exec(`${action.tooltip}${action.goldCost === undefined ? "" : action.tooltip2}`)?.[1]; // I hate this but wygd
        const lockedText = unlockConditions ? `${_txt("actions>tooltip>locked_tooltip")}<br>Will unlock ${unlockConditions}` : `${action.tooltip}${action.goldCost === undefined ? "" : action.tooltip2}`;
        const totalDivText =
            `<button
                id='container${action.varName}'
                class='${divClass} actionOrTravelContainer showthat'
                draggable='true'
                ondragover='handleDragOver(event)'
                ondragstart='handleDirectActionDragStart(event, "${action.name}", ${action.townNum}, "${action.varName}", false)'
                ondragend='handleDirectActionDragEnd("${action.varName}")'
                onclick='addActionToList("${action.name}", ${action.townNum})'
                onmouseover='view.updateAction("${action.varName}")'
                onmouseout='view.updateAction(undefined)'
            >
                ${action.label}<br>
                <div style='position:relative'>
                    <img src='img/${imageName}.svg' class='superLargeIcon' draggable='false'>${extraImage}
                </div>
                ${statPie}
                <div class='showthis when-unlocked' draggable='false'>
                    ${action.tooltip}<span id='goldCost${action.varName}'></span>
                    ${(action.goldCost === undefined) ? "" : action.tooltip2}
                    <br>
                    ${actionSkills}
                    <div class='bold'>${_txt("actions>tooltip>mana_cost")}:</div> <div id='manaCost${action.varName}'>${formatNumber(action.manaCost())}</div><br>
                    <dl class='action-stats'>${actionStats}</dl>
                    <div class='bold'>${_txt("actions>tooltip>exp_multiplier")}:</div><div id='expMult${action.varName}'>${action.expMult * 100}</div>%<br>
                    ${skillDetails}
                </div>
                <div class='showthis when-locked' draggable='false'>
                    ${lockedText}
                    <br>
                    ${lockedSkills}
                    ${lockedStats}
                </div>
            </button>`;

        const actionsDiv = document.createElement("div");
        actionsDiv.innerHTML = totalDivText;
        if (isTravel) actionsDiv.style.width = "100%";
        actionOptionsTown[action.townNum].appendChild(actionsDiv);

        if (action.storyReqs !== undefined) {
            let storyTooltipText = "";
            let lastInBranch = false;
            const storyAmt = _txt(`actions>${action.name.toLowerCase().replace(/ /gu, "_")}`, "fallback").split("⮀").length - 1;
            for (let i = 1; i <= storyAmt; i++) {
                if (_txt(`actions>${action.name.toLowerCase().replace(/ /gu, "_")}>story_${i}`) === undefined) console.log(`actions>${action.name.toLowerCase().replace(/ /gu, "_")}>story_${i}`);
                const storyText = _txt(`actions>${action.name.toLowerCase().replace(/ /gu, "_")}>story_${i}`, "fallback").split("⮀");
                storyTooltipText += "<p>";
                if (action.storyReqs(i)) {
                    storyTooltipText += storyText[0] + storyText[1];
                    lastInBranch = false;
                } else if (lastInBranch) {
                    storyTooltipText += "<b>???:</b> ???";
                } else {
                    storyTooltipText += `${storyText[0]} ???`;
                    lastInBranch = true;
                }
                storyTooltipText += "</p>";
            }
    
            const storyDivText =
                `<div id='storyContainer${action.varName}' tabindex='0' class='storyContainer showthatstory' draggable='false' onmouseover='hideNotification("storyContainer${action.varName}")'>${action.label}
                    <br>
                    <div style='position:relative'>
                        <img src='img/${camelize(action.name)}.svg' class='superLargeIcon' draggable='false'>
                        <div id='storyContainer${action.varName}Notification' class='notification storyNotification'></div>
                    </div>
                    <div class='showthisstory' draggable='false'>
                        ${storyTooltipText}
                    </div>
                </div>`;
    
            const storyDiv = document.createElement("div");
            storyDiv.innerHTML = storyDivText;
            actionStoriesTown[action.townNum].appendChild(storyDiv);
        }
    };

    updateAction(action) {
        if (action === undefined) return
        let container = document.getElementById(`container${action}`);
        this.adjustTooltipPosition(container.querySelector("div.showthis"));
    }

    adjustManaCost(actionName) {
        const action = translateClassNames(actionName);
        document.getElementById(`manaCost${action.varName}`).textContent = formatNumber(action.manaCost());
    };

    adjustExpMult(actionName) {
        const action = translateClassNames(actionName);
        document.getElementById(`expMult${action.varName}`).textContent = formatNumber(action.expMult * 100);
    };

    goldCosts = {};

    adjustGoldCost(updateInfo) {
        const varName = updateInfo.varName;
        const amount = updateInfo.cost;
        const element = document.getElementById(`goldCost${varName}`);
        if (this.goldCosts[varName] !== amount && element) {
            element.textContent = formatNumber(amount);
            this.goldCosts[varName] = amount;
        }
    };
    adjustGoldCosts() {
        for (const action of actionsWithGoldCost) {
            this.adjustGoldCost({varName: action.varName, cost: action.goldCost()});
        }
    };
    adjustExpGain(action) {
        for (const skill in action.skills) {
            if (Number.isInteger(action.skills[skill])) document.getElementById(`expGain${action.varName}${skill}`).textContent = ` ${action.skills[skill].toFixed(0)}`;
            else document.getElementById(`expGain${action.varName}${skill}`).textContent = ` ${action.skills[skill]().toFixed(0)}`;
        }
    };
    adjustExpGains() {
        for (const action of totalActionList) {
            if (action.skills) this.adjustExpGain(action);
        }
    };

    createTownInfo(action) {
        const totalInfoText =
            // important that there be 8 element children of townInfoContainer (excluding the showthis popup)
            `<div class='townInfoContainer showthat'>
                <div class='bold townLabel'>${action.labelDone}</div>
                <div class='numeric goodTemp' id='goodTemp${action.varName}'>0</div> <i class='fa fa-arrow-left'></i>
                <div class='numeric good' id='good${action.varName}'>0</div> <i class='fa fa-arrow-left'></i>
                <div class='numeric unchecked' id='unchecked${action.varName}'>0</div>
                <input type='checkbox' id='searchToggler${action.varName}' style='margin-left:10px;'>
                <label for='searchToggler${action.varName}'> Lootable first</label>
                <div class='showthis'>${action.infoText()}</div>
            </div><br>`;

        const infoDiv = document.createElement("div");
        infoDiv.className = "townContainer infoType";
        infoDiv.id = `infoContainer${action.varName}`;
        infoDiv.style.display = "";
        infoDiv.innerHTML = totalInfoText;
        townInfos[action.townNum].appendChild(infoDiv);
    };

    createMultiPartPBar(action) {
        let pbars = "";
        const width = `style='width:calc(${91 / action.segments}% - 4px)'`;
        const varName = action.varName;
        for (let i = 0; i < action.segments; i++) {
            pbars += `<div class='thickProgressBar showthat' ${width}>
                        <div id='expBar${i}${varName}' class='segmentBar'></div>
                        <div class='showthis' id='tooltip${i}${varName}'>
                            <div id='segmentName${i}${varName}'></div><br>
                            <div class='bold'>Main Stat</div> <div id='mainStat${i}${varName}'></div><br>
                            <div class='bold'>Progress</div> <div id='progress${i}${varName}'></div> / <div id='progressNeeded${i}${varName}'></div>
                        </div>
                    </div>`;
        }
        const completedTooltip = action.completedTooltip ? action.completedTooltip() : "";
        let mouseOver = "";
        if (varName === "SDungeon") mouseOver = "onmouseover='view.showDungeon(0)' onmouseout='view.showDungeon(undefined)'";
        else if (varName === "LDungeon") mouseOver = "onmouseover='view.showDungeon(1)' onmouseout='view.showDungeon(undefined)'";
        else if (varName === "TheSpire") mouseOver = "onmouseover='view.showDungeon(2)' onmouseout='view.showDungeon(undefined)'";
        const totalDivText =
            `<div class='townStatContainer' id='infoContainer${varName}'>
                <div class='multipartLabel'>
                    <div class='flexMargin'></div>
                    <div class='bold townLabel' id='multiPartName${varName}'></div>
                    <div class='completedInfo showthat' ${mouseOver}>
                        <div class='bold'>${action.labelDone}</div>
                        <div id='completed${varName}'></div>
                        ${completedTooltip === "" ? "" : `<div class='showthis' id='completedContainer${varName}'>
                            ${completedTooltip}
                        </div>`}
                    </div>
                    <div class='flexMargin'></div>
                </div>
                <div class='multipartBars'>
                    ${pbars}
                </div>
            </div>`;

        const progressDiv = document.createElement("div");
        progressDiv.className = "townContainer multipartType";
        progressDiv.style.display = "";
        progressDiv.innerHTML = totalDivText;
        townInfos[action.townNum].appendChild(progressDiv);
    };

    updateMultiPartActions() {
        for (const action of totalActionList) {
            if (action.type === "multipart") {
                this.updateMultiPart(action);
                this.updateMultiPartSegments(action);
            }
        }
    };
    
    updateMultiPartSegments(action) {
        let segment = 0;
        let curProgress = towns[action.townNum][action.varName];
        // update previous segments
        let loopCost = action.loopCost(segment);
        while (curProgress >= loopCost && segment < action.segments) {
            document.getElementById(`expBar${segment}${action.varName}`).style.width = "0px";
            const roundedLoopCost = intToStringRound(loopCost);
            if (document.getElementById(`progress${segment}${action.varName}`).textContent !== roundedLoopCost) {
                document.getElementById(`progress${segment}${action.varName}`).textContent = roundedLoopCost;
                document.getElementById(`progressNeeded${segment}${action.varName}`).textContent = roundedLoopCost;
            }

            curProgress -= loopCost;
            segment++;
            loopCost = action.loopCost(segment);
        }

        // update current segments
        if (document.getElementById(`progress${segment}${action.varName}`)) {
            document.getElementById(`expBar${segment}${action.varName}`).style.width = `${100 - 100 * curProgress / loopCost}%`;
            document.getElementById(`progress${segment}${action.varName}`).textContent = intToStringRound(curProgress);
            document.getElementById(`progressNeeded${segment}${action.varName}`).textContent = intToStringRound(loopCost);
        }

        // update later segments
        for (let i = segment + 1; i < action.segments; i++) {
            document.getElementById(`expBar${i}${action.varName}`).style.width = "100%";
            if (document.getElementById(`progress${i}${action.varName}`).textContent !== "0") {
                document.getElementById(`progress${i}${action.varName}`).textContent = "0";
            }
            document.getElementById(`progressNeeded${i}${action.varName}`).textContent = intToStringRound(action.loopCost(i));
        }
    };

    showDungeon(index) {
        dungeonShowing = index;
        if (index !== undefined) this.updateSoulstoneChance(index);
    };

    updateSoulstoneChance(index) {
        const dungeon = dungeons[index];
        for (let i = 0; i < dungeon.length; i++) {
            const level = dungeon[i];
            document.getElementById(`soulstoneChance${index}_${i}`).textContent = intToString(level.ssChance * 100, 4);
            document.getElementById(`soulstonePrevious${index}_${i}`).textContent = level.lastStat;
            document.getElementById(`soulstoneCompleted${index}_${i}`).textContent = formatNumber(level.completed);
        }
    };

    updateTrials() {
        for(let i = 0; i < trials.length; i++)
        {
            this.updateTrialInfo({trialNum: i, curFloor: 0});
        }
    };

    updateTrialInfo(updateInfo) {
        const curFloor = updateInfo.curFloor;
        const trialNum = updateInfo.trialNum;
        const trial = trials[trialNum];
            document.getElementById(`trial${trialNum}HighestFloor`).textContent = String(trial.highestFloor + 1);
            if (curFloor >= trial.length) {
                document.getElementById(`trial${trialNum}CurFloor`).textContent = "";
                document.getElementById(`trial${trialNum}CurFloorCompleted`).textContent = "";
            }
            else {
                document.getElementById(`trial${trialNum}CurFloor`).textContent = "" + (curFloor + 1);
                document.getElementById(`trial${trialNum}CurFloorCompleted`).textContent = trial[curFloor].completed;
            }
            if (curFloor > 0) {
                document.getElementById(`trial${trialNum}LastFloor`).textContent = curFloor;
                document.getElementById(`trial${trialNum}LastFloorCompleted`).textContent = trial[curFloor - 1].completed;
            }
    };

    updateSoulstones() {
        let total = 0;
        for (const stat of statList) {
            if (stats[stat].soulstone) {
                total += stats[stat].soulstone;
                htmlElement(`stat${stat}SoulstoneLogBar`).parentElement.style.display = "";
                this.updateLevelLogBar("statsContainer", `stat${stat}SoulstoneLogBar`, stats[stat].soulstone);
                document.getElementById(`ss${stat}Container`).style.display = "inline-block";
                document.getElementById(`ss${stat}`).textContent = intToString(stats[stat].soulstone, 1);
                document.getElementById(`stat${stat}SSBonus`).textContent = intToString(stats[stat].soulstone ? stats[stat].soulstoneMult : 0);
                document.getElementById(`stat${stat}ss`).textContent = intToString(stats[stat].soulstone, 1);
            } else {
                htmlElement(`stat${stat}SoulstoneLogBar`).parentElement.style.display = "none";
                document.getElementById(`ss${stat}Container`).style.display = "none";
                document.getElementById(`stat${stat}ss`).textContent = "";
            }
        }
        if (total > 0) {
            document.getElementById(`stattotalss`).style.display = "";
            document.getElementById(`stattotalss`).textContent = intToString(total, 1);
        } else {
            document.getElementById(`stattotalss`).style.display = "none";
            document.getElementById(`stattotalss`).textContent = "";
        }
    };

    updateMultiPart(action) {
        const town = towns[action.townNum];
        document.getElementById(`multiPartName${action.varName}`).textContent = action.getPartName();
        document.getElementById(`completed${action.varName}`).textContent = ` ${formatNumber(town[`total${action.varName}`])}`;
        for (let i = 0; i < action.segments; i++) {
            const expBar = document.getElementById(`expBar${i}${action.varName}`);
            if (!expBar) {
                continue;
            }
            const mainStat = action.loopStats[(town[`${action.varName}LoopCounter`] + i) % action.loopStats.length];
            document.getElementById(`mainStat${i}${action.varName}`).textContent = _txt(`stats>${mainStat}>short_form`);
            addStatColors(expBar, mainStat, true);
            document.getElementById(`segmentName${i}${action.varName}`).textContent = action.getSegmentName(town[`${action.varName}LoopCounter`] + i);
        }
    };

    updateTrainingLimits() {
        for (let i = 0; i < statList.length; i++) {
            const trainingDiv = document.getElementById(`trainingLimit${statList[i]}`);
            if (trainingDiv) {
                trainingDiv.textContent = String(trainingLimits);
            }
        }
        if (getBuffLevel("Imbuement") > 0 || getBuffLevel("Imbuement3") > 0) document.getElementById("maxTraining").style.display = "";
    };

    // when you mouseover Story
    updateStory(num) {
        document.getElementById("newStory").style.display = "none";
        if (num <= 0) {
            num = 0;
            document.getElementById("storyLeft").style.visibility = "hidden";
        } else {
            document.getElementById("storyLeft").style.visibility = "";
        }

        if (num >= storyMax) {
            num = storyMax;
            document.getElementById("storyRight").style.visibility = "hidden";
        } else {
            document.getElementById("storyRight").style.visibility = "";
        }
        //Hard coded story count - need to fix this
        for (let i = 0; i <= 12; i++) {
            const storyDiv = document.getElementById(`story${i}`);
            if (storyDiv) {
                storyDiv.style.display = "none";
            }
        }
        storyShowing = num;
        document.getElementById("storyPage").textContent = String(storyShowing + 1);
        document.getElementById(`story${num}`).style.display = "inline-block";
    };

    changeStatView() {
        const statsWindow = document.getElementById("statsWindow");
        if (inputElement("regularStats").checked) {
            statsWindow.dataset.view = "regular";
            htmlElement("statsColumn").style.width = "316px";
        } else {
            statsWindow.dataset.view = "radar";
            htmlElement("statsColumn").style.width = "410px";
            statGraph.update();
        }
    };

    changeTheme(init) {
        const themeInput = selectElement("themeInput");
        const themeVariantInput = selectElement("themeVariantInput");
        if (init) themeInput.value = options.theme;
        if (init) themeVariantInput.value = options.themeVariant;
        options.theme = themeInput.value;
        options.themeVariant = themeVariantInput.value;
        const variants = $(themeVariantInput).find(`.variant-${options.theme.replaceAll(" ","_")}`);
        if (variants.length) {
            document.getElementById("themeVariantSection").style.display = "";
            $(themeVariantInput).find("option").css("display", "none");
            variants.css("display", "");
        } else {
            document.getElementById("themeVariantSection").style.display = "none";
        }
        document.getElementById("theBody").className = `t-${options.theme} ${options.themeVariant}`;
        localStorage["latestTheme"] = `${options.theme} ${options.themeVariant}`;
    };

    createTravelMenu() {
        let travelMenu = $("#TownSelect");
        travelMenu.empty()
        townNames.forEach((town, index) => {
            travelMenu.append("<option value="+index+" hidden=''>"+town+"</option>");
        });
        travelMenu.change(function() {
            view.showTown(Number($(this).val()));
        });
        this.updateTravelMenu()
    }

    updateTravelMenu() {
        let travelOptions = $("#TownSelect").children();
        for (let i=0;i<travelOptions.length;i++) {
            travelOptions[i].hidden=(!townsUnlocked.includes(i));
        }
    }

    adjustDarkRitualText() {
        let DRdesc = document.getElementById("DRText");
        DRdesc.innerHTML = `Actions are:<br>`;
        townsUnlocked.forEach(townNum => {
            DRdesc.innerHTML += DarkRitualDescription[townNum];
        });
        if(getBuffLevel("Ritual") > 200) DRdesc.innerHTML += DarkRitualDescription[9];
    }

    highlightIncompleteActions() {
        let actionDivs = Array.from(document.getElementsByClassName("actionContainer"));
        actionDivs.forEach(div => {
            let actionName = div.id.replace("container","");
            if (!completedActions.includes(actionName))
                div.classList.add("actionHighlight");
        });
    }

    removeAllHighlights() {
        let actionDivs = Array.from(document.getElementsByClassName("actionHighlight"));
        actionDivs.forEach(div => {
            div.classList.remove("actionHighlight");
        });
    }

    updateTotals() {
        document.getElementById('totalPlaytime').textContent = `${formatTime(totals.time)}`;
        document.getElementById('totalEffectiveTime').textContent = `${formatTime(totals.effectiveTime)}`;
        document.getElementById('borrowedTimeBalance').textContent = formatTime(totals.borrowedTime);
        document.getElementById('borrowedTimeDays').textContent = `${formatNumber(Math.floor(totals.borrowedTime / 86400))}${_txt("time_controls>days")}`;
        document.getElementById('totalLoops').textContent = `${formatNumber(totals.loops)}`;
        document.getElementById('totalActions').textContent = `${formatNumber(totals.actions)}`;
        if (totals.borrowedTime > 0) document.documentElement.classList.add("time-borrowed");
        else document.documentElement.classList.remove("time-borrowed");
    }

    updatePrestigeValues() {
        document.getElementById('currentPrestigePoints').textContent = `${formatNumber(prestigeValues["prestigeCurrentPoints"])}`;
        document.getElementById('currentPrestigesCompleted').textContent = `${formatNumber(prestigeValues["prestigeTotalCompletions"])}`;
        // document.getElementById('maxTotalImbueSoulLevels').textContent = `${formatNumber(prestigeValues["prestigeTotalCompletions"])}`;
        document.getElementById('maxTotalImbueSoulLevels').textContent = `${formatNumber(Math.min(prestigeValues["prestigeTotalCompletions"], 7))}`;

        document.getElementById('totalPrestigePoints').textContent = `${formatNumber(prestigeValues["prestigeTotalPoints"])}`;

        document.getElementById('prestigePhysicalCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigePhysical"))}`;
        document.getElementById('prestigeMentalCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeMental"))}`;
        document.getElementById('prestigeCombatCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeCombat"))}`;
        document.getElementById('prestigeSpatiomancyCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeSpatiomancy"))}`;
        document.getElementById('prestigeChronomancyCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeChronomancy"))}`;
        document.getElementById('prestigeBarteringCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeBartering"))}`;
        document.getElementById('prestigeExpOverflowCurrentBonus').textContent = `${formatNumber(getPrestigeCurrentBonus("PrestigeExpOverflow") * 10)}`;

        document.getElementById('prestigePhysicalNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigePhysical"))}`;
        document.getElementById('prestigeMentalNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeMental"))}`;
        document.getElementById('prestigeCombatNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeCombat"))}`;
        document.getElementById('prestigeSpatiomancyNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeSpatiomancy"))}`;
        document.getElementById('prestigeChronomancyNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeChronomancy"))}`;
        document.getElementById('prestigeBarteringNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeBartering"))}`;
        document.getElementById('prestigeExpOverflowNextCost').textContent = `${formatNumber(getPrestigeCost("PrestigeExpOverflow"))}`;        
    }
}

function startRenameCloudSave(fileId) {
    const li = document.getElementById(`cloud_save_${fileId}`);
    const nameInput = li?.querySelector(".cloud_save_name");
    if (!nameInput) return;
    if (nameInput instanceof HTMLInputElement) {
        if (!nameInput.value || nameInput.value === li.dataset.fileName) {
            const div = document.createElement("div");
            div.className = nameInput.className;
            div.textContent = li.dataset.fileName;
            div.title = li.dataset.fileName;
            li.replaceChild(div, nameInput);
        } else {
            googleCloud.renameFile(fileId, nameInput.value);
        }
    } else {
        const input = document.createElement("input");
        input.className = nameInput.className;
        input.style.width = `${nameInput.clientWidth}px`;
        input.value = li.dataset.fileName;
        input.onkeydown = (e) => e.key === "Enter" ? (startRenameCloudSave(fileId), false) : true;
        li.replaceChild(input, nameInput);
        input.focus();
    }
}

async function askDeleteCloudSave(fileId) {
    const li = document.getElementById(`cloud_save_${fileId}`);
    const button = li?.querySelector(".button.cloud_delete");
    if (!button) return;
    if (button.classList.contains("warning")) {
        googleCloud.deleteFile(fileId);
    } else {
        button.textContent = _txt("menu>save>confirm_button");
        button.classList.add("warning");
        await delay(3000);
        button.classList.remove("warning");
        button.textContent = _txt("menu>save>delete_button");
    }
}

function unlockGlobalStory(num) {
    if (num > storyMax) {
        document.getElementById("newStory").style.display = "inline-block";
        storyMax = num;
        view.requestUpdate("updateGlobalStory", num);
    }
}

function unlockStory(name) {
    if (!storyReqs[name]) {
        storyReqs[name] = true;
        if (options.actionLog) view.requestUpdate("updateStories", false);
    }
}

function scrollToPanel(event, target) {
    event.preventDefault();
    const element = document.getElementById(target);
    const main = document.getElementById("main");

    if (element instanceof HTMLElement && main) {
        main.scroll({
            behavior: "smooth",
            left: element.offsetLeft,
        });
    }

    return false;
}

const curActionsDiv = document.getElementById("curActionsList");
const nextActionsDiv = document.getElementById("nextActionsList");
const actionOptionsTown = [];
const actionStoriesTown = [];
const townInfos = [];
for (let i = 0; i <= 8; i++) {
    actionOptionsTown[i] = document.getElementById(`actionOptionsTown${i}`);
    actionStoriesTown[i] = document.getElementById(`actionStoriesTown${i}`);
    townInfos[i] = document.getElementById(`townInfo${i}`);
}

/** @param {Element} theDiv @param {StatName} stat  */
function addStatColors(theDiv, stat, forceColors=false) {
    for (const className of Array.from(theDiv.classList)) {
        if (className.startsWith("stat-") && className.slice(5) in stats) {
            theDiv.classList.remove(className);
        }
    }
    theDiv.classList.add(`stat-${stat}`, "stat-background");
    if (forceColors) {
        theDiv.classList.add("use-stat-colors");
    }
}

function dragOverDecorate(i) {
    if (document.getElementById(`nextActionContainer${i}`)) document.getElementById(`nextActionContainer${i}`).classList.add("draggedOverAction");
}

function dragExitUndecorate(i) {
    if (document.getElementById(`nextActionContainer${i}`)) document.getElementById(`nextActionContainer${i}`).classList.remove("draggedOverAction");
}

function draggedDecorate(i) {
    if (document.getElementById(`nextActionContainer${i}`)) document.getElementById(`nextActionContainer${i}`).classList.add("draggedAction");
}

function draggedUndecorate(i) {
    if (document.getElementById(`nextActionContainer${i}`)) document.getElementById(`nextActionContainer${i}`).classList.remove("draggedAction");
    showActionIcons();
}

function adjustActionListSize(amt) {
    let height = document.documentElement.style.getPropertyValue("--action-list-height");
    if (height === "" && amt > 0) {
        height = `${500 + amt}px`;
    } else if (height === "" && amt === -100) {
        height = "500px";
    } else {
        height = `${Math.min(Math.max(parseInt(height) + amt, 500), 2000)}px`;
    }
    document.documentElement.style.setProperty("--action-list-height", height);
    setScreenSize();
    saveUISettings();
}

function updateBuffCaps() {
    for (const buff of buffList) {
        inputElement(`buff${buff}Cap`).value = String(Math.min(parseInt(inputElement(`buff${buff}Cap`).value), buffHardCaps[buff]));
        buffCaps[buff] = parseInt(inputElement(`buff${buff}Cap`).value);
    }
}

function setScreenSize() {
    screenSize = document.body.scrollHeight;
}

function cumulativeOffset(element) {
    var top = 0, bottom = 0;
    do {
        top += element.offsetTop  || 0;
        bottom += element.offsetBottom || 0;
        element = element.offsetParent;
    } while(element);

    return {
        top: top,
        bottom: bottom
    };
}

const DarkRitualDescription = [
    `10% faster in Beginnersville per ritual from 1-20<br>`,
    `5% faster in the Forest Path per ritual from 21-40<br>`,
    `2.5% faster in Merchanton per ritual from 41-60<br>`,
    `1.5% faster in Mt. Olympus per ritual from 61-80<br>`,
    `1.0% faster in Valhalla per ritual from 81-100<br>`,
    `0.5% faster in Startington per ritual from 101-150<br>`,
    `0.5% faster in Jungle Path per ritual from 151-200<br>`,
    `0.5% faster in Commerceville per ritual from 201-250<br>`,
    `0.5% faster in Valley of Olympus per ritual from 251-300<br>`,
    `0.1% faster globally per ritual from 301-666`];
