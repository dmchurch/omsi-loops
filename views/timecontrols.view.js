const timeControlsView = Views.registerView("timeControls", {
    selector: "#timeControls",
    stories() {
        let html = "";
        // eslint-disable-next-line no-unused-vars
        _txtsObj("time_controls>stories>story").each((index, story) => {
            html +=
            `<div id='story${$(story).attr("num")}'>
                ${$(story).text()}
            </div>`;
        });
        return html;
    },
    html() {
    // todo: add talent tree
            // <button id='rewindButton' class='button control'>${_txt("time_controls>rewind_button")}</button>
        const html =
/*html*/`<div role='toolbar' id='timeControlsMain'>
            <button id='pausePlay' onclick='pauseGame()'' class='button control'>${_txt("time_controls>pause_button")}</button>
            <button onclick='manualRestart()' class='button showthatO control'>${_txt("time_controls>restart_button")}
                <div class='showthis' style='color:var(--default-color);width:230px;'>${_txt("time_controls>restart_text")}</div>
            </button>
            <input id='bonusIsActiveInput' type='checkbox' onchange='setOption("bonusIsActive", this.checked)'/>
            <button class='button showthatO control' onclick='toggleOffline()'>${_txt("time_controls>bonus_seconds>title")}
                <div class='showthis' id='bonusText' style='max-width:500px;color:var(--default-color);'>
                    ${view.getBonusText()}
                </div>
            </button>
            <button id='talentTreeBtn' style='display: none;' onclick='view.showTalents()'' class='button control'>${_txt("time_controls>talents_button")}</button>
            <div class='control'>
                <div aria-labelledby='story_title' aria-describedby='story_tooltip' tabindex='0' id='story_control' class='showthatH' onmouseover='view.updateStory(storyShowing)' onfocus='view.updateStory(storyShowing)' style='height:30px;'>
                    <div role='label' id='story_title' class='large bold'>${_txt("time_controls>story_title")}</div>
                    <div role='alert' id='newStory' style='color:var(--alert-color);display:none;'>(!)</div>
                    <div role='tooltip' id='story_tooltip' class='showthisH' style='width:400px;'>
                        <button style='margin-left:175px;' class='actionIcon fa fa-arrow-left control' id='storyLeft' onclick='view.updateStory(storyShowing-1)'></button>
                        <div style='' id='storyPage' class='bold control'></div>
                        <button style='' class='actionIcon fa fa-arrow-right control' id='storyRight' onclick='view.updateStory(storyShowing+1)'></button>
                        ${timeControlsView.stories()}
                    </div>
                </div>
            </div>
        </div>
        <div role='toolbar' id='timeControlsOptions'>
            <div role='none' class='control'>
                <input type='checkbox' id='pauseBeforeRestartInput' onchange='setOption("pauseBeforeRestart", this.checked)'>
                <label for='pauseBeforeRestartInput'>${_txt("time_controls>pause_before_restart")}</label>
            </div>
            <div role='none' class='control'>
                <input type='checkbox' id='pauseOnFailedLoopInput' onchange='setOption("pauseOnFailedLoop", this.checked)'>
                <label for='pauseOnFailedLoopInput'>${_txt("time_controls>pause_on_failed_loop")}</label>
            </div>
            <div role='none' class='control'>
                <input type='checkbox' id='pauseOnCompleteInput' onchange='setOption("pauseOnComplete", this.checked)'>
                <label for='pauseOnCompleteInput'>${_txt("time_controls>pause_on_complete")}</label>
            </div>
        </div>`;
        return html;
    },
});

