
const menuView = Views.registerView("menu", {
    selector: "#menu",
    html() {
        let html = "";
        html += Views.menu.htmlMenusMenu();
        html += Views.menu.htmlChangelog();
        html += Views.menu.htmlSaveMenu();
        html += Views.menu.htmlFAQMenu();
        html += Views.menu.htmlOptionsMenu();
        html += Views.menu.htmlExtrasMenu();
        html += Views.menu.htmlChallengeMenu();
        html += Views.menu.htmlTotalsMenu();
        html += Views.menu.htmlPrestigeMenu();
        return html;
    },
    htmlMenusMenu() {
        const menus = [
            "changelog",
            "save",
            "faq",
            "options",
            "extras",
            "challenges",
            "totals",
            "prestige_bonus",
        ];
        const disabledMenus = this.getDisabledMenus();
        const html =
/*html*/`<li role='button' aria-haspopup='dialog' aria-controls='menus' aria-label='Menu configuration menu' id='menusMenu' tabindex='0' style='display:inline-block;height:30px;margin-right:10px;' class='showthatH${menus.map(menu => disabledMenus.includes(menu) ? ` disabled-${menu}` : "").join("")}'>
            <i role='none' class='fas fa-bars'></i>
            <div role='dialog' aria-labelledby='menusMenu' class='showthisH' id='menus'>
                <menu role='presentation'>
                    ${menus.map(menu => `
                    <li aria-labelledby='enableMenu_${menu}_label'>
                        <input type='checkbox' id='enableMenu_${menu}' data-menu='${menu}' onchange='Views.menu.onEnableMenu(this)' ${disabledMenus.includes(menu) ? "" : "checked"}>
                        <label id='enableMenu_${menu}_label' for='enableMenu_${menu}'>${_txt(`menu>${menu}>meta>title`)}</label>
                    </li>`).join("\n")}
                </menu>
            </div>
        </li>`;
        return html;

    },
    getDisabledMenus() {
        let disabledMenus = [];
        try {
            disabledMenus = JSON.parse(localStorage.getItem("disabledMenus")) ?? disabledMenus;
        } catch { }
        return disabledMenus;
    },
    /** @param {HTMLInputElement} input  */
    onEnableMenu(input) {
        const menu = input.dataset.menu;
        htmlElement("menusMenu").classList.toggle(`disabled-${menu}`, !input.checked);
        const disabledMenus = this.getDisabledMenus();
        const index = disabledMenus.indexOf(menu);
        if (index === -1 && !input.checked) {
            disabledMenus.push(menu);
        } else if (index >= 0 && input.checked) {
            disabledMenus.splice(index, 1);
        }
        localStorage.setItem("disabledMenus", JSON.stringify(disabledMenus));
    },
    versions() {
        let html = "";
        const versions = _txtsObj("menu>changelog>version");
        $(versions).each((_index, version) => {
            const caption = $(version).attr("caption");
            const verNum = $(version).attr("verNum");
            const verId = verNum?.replace(/[ :]/g,'-') ?? caption?.replace(/[ :]/g,'-') ?? "unknown"
            html += /*html*/`
                    <li role='button' aria-haspopup='dialog' aria-labelledby='version_${verId}_label' aria-controls='version_${verId}_text' class='showthat2' tabindex='0' ${verNum ? `data-verNum="${verNum}"` : ""}>
                        <label id='version_${verId}_label'>${caption ? caption : `${_txt("menu>changelog>meta>version_prefix")} ${verId}`}</label>
                        <p role='dialog' aria-labelledby='version_${verId}_label' id='version_${verId}_text' class='showthis2'>
                            ${$(version).text()}
                        </p>
                    </li>`;
        });
        return html;
    },
    htmlChangelog() {
        const html =
/*html*/`<li role='button' aria-haspopup='dialog' aria-labelledby='changelogMenu_label' aria-controls='changelog' id='changelogMenu' tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            <label id='changelogMenu_label'>${_txt("menu>changelog>meta>title")}</label>
            <ul role='dialog' aria-labelledby='changelogMenu_label' class='showthisH' id='changelog'>
                ${this.versions()}
            </ul>
        </li>`;
        return html;
    },
    htmlSaveMenu() {
        const html =
/*html*/`<li role='button' aria-haspopup='dialog' aria-labelledby='saveMenu_label' aria-controls='saveMenu_popup' id='saveMenu' tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            <label id='saveMenu_label'>${_txt("menu>save>meta>title")}</label>
            <div role='dialog' aria-labelledby='saveMenu_label' id='saveMenu_popup' class='showthisH'>
                <button class='button' onclick='save()'>${_txt("menu>save>manual_save")}</button>
                <br>
                <textarea id='exportImportList'></textarea><label for='exportImportList'> ${_txt("menu>save>list_label")}</label>
                <br>
                <button class='button' style='margin-right: 2px;' onclick='exportCurrentList()'>${_txt("menu>save>export_button")}</button>
                <button class='button' onclick='importCurrentList()'>${_txt("menu>save>import_button")}</button>
                <br>
                ${_txt("menu>save>list_comment")}
                <br><br>
                <input id='exportImport'><label for='exportImport'> ${_txt("menu>save>input_label")}</label><br>
                <button class='button' style='margin-top: 5px; margin-right: 2px;' onclick='exportSave()'>${_txt("menu>save>export_button")}</button>
                <button class='button' style='margin-top: 1px;' onclick='importSave()'>${_txt("menu>save>import_button")}</button><br>
                ${_txt("menu>save>export_comment")}<br>
                ${_txt("menu>save>import_comment")}<br>
                <button class='button' style='margin-top: 5px; margin-right: 2px;' onclick='exportSaveFile()'>${_txt("menu>save>exportfile_button")}</button>
                <button class='button' style='margin-top: 1px;' onclick='openSaveFile()'>${_txt("menu>save>importfile_button")}</button>
                <input id="SaveFileInput" type='file' style="visibility:hidden;" onchange="importSaveFile(event)" />
                <br>
                <div id="cloud_save" class="block" style="display:none">
                    ${_txt("menu>save>cloud_label")}<br>
                    <button class='button' style='margin-top: 5px; margin-right: 2px;' onclick='googleCloud.exportSave()'>${_txt("menu>save>exportcloud_button")}</button>
                    <button class='button' style='margin-top: 1px;' onclick='googleCloud.loadSaves(true)'>${_txt("menu>save>importcloud_button")}</button>
                    <ul id='cloud_save_result'></ul>
                </div>
            </div>
        </li>`;
        return html;
    },
    FAQs() {
        let html = "";
        const QAs = _txtsObj("menu>faq>q_a");
        $(QAs).each((index, QA) => {
            html += /*html*/`
                <li role='button' aria-haspopup='dialog' aria-labelledby='faq_${index}_q' aria-controls='faq_${index}_a' class='showthat2' tabindex='0'>
                    <label id='faq_${index}_q'>${$(QA).find("q").html()}</label>
                    <div id='faq_${index}_a' role='dialog' aria-labelledby='faq_${index}_q' class='showthis2'>
                        ${$(QA).find("a").html()}
                    </div>
                </li>`;
        });
        return html;
    },
    htmlFAQMenu() {
        const html = 
/*html*/`<li role='button' aria-haspopup='dialog' aria-labelledby='faqMenu_label' aria-controls='faq' id='faqMenu' tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            <label id='faqMenu_label'>${_txt("menu>faq>meta>title")}</label>
            <menu role='dialog' aria-labelledby='faqMenu_label' class='showthisH' id="faq">
                ${this.FAQs()}
            </menu>
        </li>`;
        return html;
    },
    htmlOptionsMenu() {
        const html =
    /*html*/`<li role='button' aria-haspopup='dialog' aria-labelledby='optionsMenu_label' aria-controls='optionsMenu_popup' id='optionsMenu' tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            <label id='optionsMenu_label'>${_txt("menu>options>meta>title")}</label>
            <div role='dialog' aria-labelledby='optionsMenu_label' id='optionsMenu_popup' class='showthisH'>
                <a target='_blank' href='${_txt("menu>options>discord>link")}'>${_txt("menu>options>discord>title")}</a><br>
                ${Views.menu.htmlThemeMenu()}
                ${Object.keys(Localization.supportedLang).length > 1 ? Views.menu.htmlLocalizationMenu() : ""}
                ${_txt("menu>options>adblock_warning")}<br>
                <input id='responsiveUIInput' type='checkbox' onchange='setOption("responsiveUI", this.checked)'/>
                    <label for='responsiveUIInput'>${_txt("menu>options>responsive_ui")}</label>
                <br>
                <input id='actionLogInput' type='checkbox' onchange='setOption("actionLog", this.checked)'/>
                    <label for='actionLogInput'>${_txt("menu>options>action_log")}</label>
                <br>
                <input id='googleCloudInput' type='checkbox' onchange='setOption("googleCloud", this.checked)'/>
                    <label for='googleCloudInput'>${_txt("menu>options>google_cloud")}</label>
                <br>
                <input id='highlightNewInput' type='checkbox' onchange='setOption("highlightNew", this.checked)'/>
                    <label for='highlightNewInput'>${_txt("menu>options>highlight_new")}</label>
                <br>
                <input id='statColorsInput' type='checkbox' onchange='setOption("statColors", this.checked)'/>
                    <label for='statColorsInput'>${_txt("menu>options>stat_colors")}</label>
                <br>
                <input id='statHintsInput' type='checkbox' onchange='setOption("statHints", this.checked)'/>
                    <label for='statHintsInput'>${_txt("menu>options>stat_hints")}</label>
                <br>
                <input id='pingOnPauseInput' type='checkbox' onchange='setOption("pingOnPause", this.checked)'/>
                    <label for='pingOnPauseInput'>${_txt("menu>options>pause_audio_cue")}</label>
                <br>
                <input id='notifyOnPauseInput' type='checkbox' onchange='setOption("notifyOnPause", this.checked)'/>
                    <label for='notifyOnPauseInput'>${_txt("menu>options>pause_notify_cue")}</label>
                <br>
                <input id='autoMaxTrainingInput' type='checkbox' onchange='setOption("autoMaxTraining", this.checked)'/>
                    <label for='autoMaxTrainingInput'>${_txt("menu>options>auto_max_training")}</label>
                <br>
                <input id='hotkeysInput' type='checkbox' onchange='setOption("hotkeys", this.checked)'/>
                    <label class='showthat' for='hotkeysInput'>${_txt("menu>options>hotkeys")}
                    <div class='showthis'>${_txt("menu>options>hotkeys_tooltip")}</div>
                </label>
                <br>
                ${_txt("menu>options>update_rate")}
                <input id='updateRateInput' type='number' value='50' min='1' style='width: 50px;transform: translateY(-2px);' oninput='setOption("updateRate", parseInt(this.value))' />
                <br>
                ${_txt("menu>options>autosave_rate")}
                <input id='autosaveRateInput' type='number' value='30' min='1' style='width: 50px;transform: translateY(-2px);' oninput='setOption("autosaveRate", parseInt(this.value))' />
                <br>
            </div>
        </li>`;
        return html;
    },
    htmlLocalizationMenu() {
        const lg = Localization.supportedLang;
        let html = `${_txt("menu>options>localization_title")}: <select id='localization_menu' onchange='Localization.change();'>`;
        $.each(lg, (val, str) => {
            html += `<option value='${val}'${Localization.currentLang === val ? "selected" : ""}>${str}</option>`;
        });
        html += "</select><br>";
        return html;
    },
    htmlThemeMenu() {
        const themeList = ["normal", "dark", "cubic", "cubic t-dark", "zen", "zen t-dark"];
        const themes = _txtsObj("menu>options>theme");
        let html = `${_txt("menu>options>theme_title")}: <select id='themeInput' onchange='view.changeTheme();'>`;
        $(themes).each((index, theme) => {
            html += `<option value='${themeList[index]}'>${$(theme).find(themeList[index].replaceAll(" ","_")).text()}</option>`;
        });
        html += "</select><br>";
        html += `<div class='block' id='themeVariantSection'>${_txt("menu>options>theme_variant_title")}: <select id='themeVariantInput' onchange='view.changeTheme();'>`;
        $(themes).each((index, theme) => {
            $(theme).find("variants>*").each((vindex, variant) => {
                html += `<option class='variant-${themeList[index].replaceAll(" ","_")}' value='${variant.tagName}'>${$(variant).text()}</option>`;
            });
        });
        html += "</select></div>"
        return html;
    },
    htmlExtrasMenu() {
        const html =
    /*html*/`<li role='button' aria-haspopup='dialog' aria-labelledby='extrasMenu_label' aria-controls='extrasMenu_popup' id='extrasMenu' tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            <label id='extrasMenu_label'>${_txt("menu>extras>meta>title")}</label>
            <div role='dialog' aria-labelledby='extrasMenu_label' id='extrasMenu_popup' class='showthisH' style='padding-top:1ex'>
                ${_txt("menu>options>extras_warning")}<br>
                <br>
                <input id='fractionalManaInput' type='checkbox' onchange='setOption("fractionalMana", this.checked)'/>
                    <label for='fractionalManaInput'>${_txt("menu>options>fractional_mana")}</label>
                <br>
                <input id='predictorInput' type='checkbox' onchange='setOption("predictor", this.checked)'/>
                    <label for='predictorInput'>${_txt("menu>options>predictor")}</label>
                <br>
                <div class='control'>
                    <input type='checkbox' id='speedIncrease10xInput' onchange='setOption("speedIncrease10x", this.checked)'>
                    <label for='speedIncrease10xInput'>${_txt("menu>options>speedIncrease10x_text")}</label>
                </div>
                <br>
                <div class='control'>
                    <input type='checkbox' id='speedIncrease20xInput' onchange='setOption("speedIncrease20x", this.checked)'>
                    <label for='speedIncrease20xInput'>${_txt("menu>options>speedIncrease20x_text")}</label>
                </div>
                <br>
                ${_txt("menu>options>speedIncreaseCustom_text")}
                <input id='speedIncreaseCustomInput' type='number' value='5' min='1' style='width: 50px;transform: translateY(-2px);' oninput='setOption("speedIncreaseCustom", parseInt(this.value))' />
                <br>
                ${_txt("menu>options>speedIncreaseBackground_text")}
                <input id='speedIncreaseBackgroundInput' type='number' value='' placeholder='same' min='0' style='width: 50px;transform: translateY(-2px);' oninput='setOption("speedIncreaseBackground", parseFloat(this.value))' />
                <div id='speedIncreaseBackgroundWarning' class='small block' style='display:none'>${_txt("menu>options>speedIncreaseBackground_warning")}</div>
                <br>
                <button id='borrowTimeButton' class='button showthat control' onclick='borrowTime()'>${_txt("menu>options>borrow_time")}
                    <div class='showthis'>${_txt("menu>options>borrow_time_tooltip")}</div>
                </button>
                <div class='show-when-time-borrowed'>
                    <button id='returnTimeButton' class='button control' onclick='returnTime()'>${_txt("menu>options>return_time")}</button>
                    ${_txt("menu>options>time_borrowed")} <span id='borrowedTimeDays'></span>
                </div><br>
                <div id='predictorSettings'>
                    <br>
                    <b>${_txt("predictor>settings")}</b>
                    <br>
                    <input id='predictorBackgroundThreadInput' type='checkbox' onchange='setOption("predictorBackgroundThread", this.checked)'>
                    <label for='predictorBackgroundThreadInput'>${_txt("predictor>background_thread")}</label>
                    <br>
                    <label for='predictorTimePrecisionInput'>${_txt("predictor>time_precision")}</label>
                    <input id='predictorTimePrecisionInput' type='number' value='1' min='1' max='10' style='width: 50px;' oninput='setOption("predictorTimePrecision", parseInt(this.value))'>
                    <br>
                    <label for='predictorNextPrecisionInput'>${_txt("predictor>next_precision")}</label>
                    <input id='predictorNextPrecisionInput' type='number' value='2' min='1' max='10' style='width: 50px;' oninput='setOption("predictorNextPrecision", parseInt(this.value))'>
                    <br>
                    <label for='predictorActionWidthInput'>${_txt("predictor>action_list_width")}</label>
                    <input id='predictorActionWidthInput' type='number' value='500' min='100' max='4000' style='width: 50px; margin-left:40px' oninput='setOption("predictorActionWidth", parseInt(this.value))'>
                    <br>
                    <input id='predictorRepeatPredictionInput' type='checkbox' onchange='setOption("predictorRepeatPrediction", this.checked)'>
                    <label for='predictorRepeatPredictionInput'>${_txt("predictor>repeat_last_action")}</label>
                    <br>
                    <input id='predictorSlowModeInput' type='checkbox' onchange='setOption("predictorSlowMode", this.checked)'>
                    <label for='predictorSlowModeInput'>${
                        _txt("predictor>slow_mode")
                        .replace("{slowMode}",
                            `<input id='predictorSlowTimerInput' type='number' value='1' min='1' style='width: 20px;' oninput='setOption("predictorSlowTimer", parseInt(this.value))'>`
                        )
                    }</label>
                </div>
            </div>
        </li>`;
        return html;
    },
    htmlChallengeMenu() {
        const html = 
        `<li role='button' aria-haspopup='dialog' aria-labelledby='challengesMenu_label' aria-controls='challengesMenu_popup' id='challengesMenu' tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            <label id='challengesMenu_label'>${_txt("menu>challenges>meta>title")}</label>
            <div role='dialog' aria-labelledby='challengesMenu_label' id='challengesMenu_popup' class='showthisH'>
                ${this.challenges()}
            </div>
        </li>`;
        return html;
    },
    htmlTotalsMenu() {
        const html = 
        `<li role='button' aria-haspopup='dialog' aria-labelledby='totalsMenu_label' aria-controls='totalsMenu_popup' id='totalsMenu' tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            <label id='totalsMenu_label'>${_txt("menu>totals>meta>title")}</label>
            <div role='dialog' aria-labelledby='totalsMenu_popup' id='_popup' class='showthisH'>
                ${this.totals()}
            </div>
        </li>`;
        return html;
    },
    htmlPrestigeMenu() {
        const html = 
        `<li role='button' aria-haspopup='dialog' aria-labelledby='prestige_bonusesMenu_label' aria-controls='prestige_bonusesMenu_popup' id='prestige_bonusesMenu' tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            <label id='prestige_bonusesMenu_label'>${_txt("menu>prestige_bonus>meta>title")}</label>
            <div role='dialog' aria-labelledby='prestige_bonusesMenu_popup' id='_popup' class='showthisH'>
                ${this.prestige_bonuses()}
            </div>
        </li>`;
        return html;
    },
    challenges() {
        let html = 
        `<div>Challenges are special modes that impose special conditions and heavy restrictions.<br> 
            They give no rewards ard are just here for fun.<br>
            It is only recommended to try them after beating the main game.<br>
            Please export and save your data locally before starting.<br>
            <b>Beginning a challenge will permanently delete your current save.</b><br>
            `;
        if (challengeSave.challengeMode !== 0 || 1===1)
            html += `<button class='button showthat control' style='margin-top: 2px;' onclick='exitChallenge()'>Exit Challenge 
                </button>
                <button class='button showthat control' style='margin-top: 2px;' onclick='resumeChallenge()'>Resume Challenge 
                </button><br>`;
        html += 
        `<button class='button showthat control' style='margin-top: 2px;' onclick='beginChallenge(1)'>Mana Drought 
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:100px;'>${_txt("menu>challenges>mana_drought")}</div>
        </button><br>
        <button class='button showthat control' style='margin-top: 2px;' onclick='beginChallenge(2)'>Noodle Arms
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:100px;'>${_txt("menu>challenges>noodle_arms")}</div>
        </button><br>
        <button class='button showthat control' style='margin-top: 2px;' onclick='beginChallenge(3)'>Mana Burn
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:100px;'>${_txt("menu>challenges>mana_burn")}</div>
        </button><br>`
        html += `</div>`
        return html;
    },
    totals() {
        let html =
        `<div>
        Effective Time: <div id='totalEffectiveTime'></div><br>
        Running Time: <div id='totalPlaytime'></div><br>
        <span class='show-when-time-borrowed'>${_txt("menu>options>time_borrowed")} <div id='borrowedTimeBalance'></div><br></span>
        Loops: <div id='totalLoops'></div><br>
        Actions: <div id='totalActions'></div><br>
        </div>`;
        return html;
    },
    prestige_bonuses() {
        let html =
        `<div><br> 
        Prestige bonuses are always active.<br>
        Each time you complete the game, you receive 90 points to spend on these bonuses.<br>
        Please export and save your data locally before attempting to trigger a prestige.<br>
        <br>
        <b>The ability to spec into prestige bonuses may be done at any time, but keep in mind this will reset ALL progress.</b>
        <br><br>
        Imbue Soul levels will carry over between prestiges, up to the maximum number of prestiges you've completed. <br>
        Max carryover possible: <div id='maxTotalImbueSoulLevels'></div>
        <br>
        <br><br><br>
        <b>Total Prestiges Completed: <div id='currentPrestigesCompleted'></div></b><br>
        Available points: <div id='currentPrestigePoints'></div> / <div id='totalPrestigePoints'></div>
        <br>
        Upgrade cost follows the format of: 
        <br>
        30 -> 40 -> 55 -> 75 -> 100 -> 130 -> ...
        <br>

        `;
        html +=
        
        `
        <br>
        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigePhysical")'>Prestige Physical
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigePhysical")}
                <br><br>
                Current Bonus: <div id='prestigePhysicalCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigePhysicalNextCost'></div> points<br> 
            </div>
        </button><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeMental")'>Prestige Mental
        <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeMental")}
            <br><br>
            Current Bonus: <div id='prestigeMentalCurrentBonus'></div>%<br>
            Next level cost: <div id='prestigeMentalNextCost'></div> points<br> 
        </div>
        </button><br>


        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeCombat")'>Prestige Combat
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeCombat")}
                <br><br>
                Current Bonus: <div id='prestigeCombatCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigeCombatNextCost'></div> points<br> 
            </div>
        </button><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeSpatiomancy")'>Prestige Spatiomancy
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeSpatiomancy")}
                <br><br>
                Current Bonus: <div id='prestigeSpatiomancyCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigeSpatiomancyNextCost'></div> points<br> 
            </div>
        </button><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeChronomancy")'>Prestige Chronomancy
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeChronomancy")}
                <br><br>
                Current Bonus: <div id='prestigeChronomancyCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigeChronomancyNextCost'></div> points<br> 
            </div>
        </button><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeBartering")'>Prestige Bartering
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeBartering")}
                <br><br>
                Current Bonus: <div id='prestigeBarteringCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigeBarteringNextCost'></div> points<br> 
            </div>
        </button><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeExpOverflow")'>Prestige Experience Overflow
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeExpOverflow")}
                <br><br>
                Current Bonus: <div id='prestigeExpOverflowCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigeExpOverflowNextCost'></div> points<br> 
            </div>
        </button><br>

        <br><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='resetAllPrestiges()'>Reset All Prestiges
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeResetAll")}
            </div>
        </button><br>

        `

        ;
        return html;
    }
});
