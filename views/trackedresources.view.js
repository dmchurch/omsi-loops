const trackedResourcesView = Views.registerView("trackedResources", {
    selector: "#trackedResources",
    html() {
        let html = "";
        const resources = _txtsObj("tracked_resources>resource");
        $(resources).each((_index, resource) => {
            const hasCount = !$(resource).attr("no_count");
            const resetOnRestart = !$(resource).attr("no_reset_on_restart");
            const isHidden = $(resource).attr("initially_hidden");
            html +=
        /*html*/`<div role='listitem' aria-atomic="true" aria-labelledby='${$(resource).attr("id")}_label' aria-haspopup='tooltip' aria-describedby='${$(resource).attr("id")}_tip' class='showthat resource'${isHidden ? ` style='display:none' id='${$(resource).attr("id")}Div'` : ""}>
                    <div role='label' id='${$(resource).attr("id")}_label' class='bold'>${$(resource).find("title").text()}</div>
                    ${hasCount ? `<div id='${$(resource).attr("id")}'>0</div>` : ""}
                    <div role='tooltip' class='showthis' id='${$(resource).attr("id")}_tip'>
                        ${$(resource).find("desc").text()}
                        ${resetOnRestart ? `<br>${_txt("tracked_resources>reset_on_restart_txt")}` : ""}
                    </div>
                </div>`;
        });
        return html;
    },
});
