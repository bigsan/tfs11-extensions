TFS.module("Bigsan.TFSExtensions.EnhancedTaskBoard", [
    "TFS.Host"
], function () {
    var _wiManager = TFS.OM.TfsTeamProjectCollection.getDefault().getService(TFS.WorkItemTracking.WorkItemStore).workItemManager;
    var _res = TFS.Resources.Common;
    var nav = TFS.Host.TfsContext.getDefault().navigation;
    var _currentRoute = nav.currentController + "." + nav.currentAction;
    log("_currentRoute: " + _currentRoute);
    function log(msg) {
        console.log(msg);
    }
    function addCssRules() {
        var styleHtml = [
            '<style id="etb" type="text/css">', 
            '.daysAgo { float: left; padding: 0 4px; color: white; background: darkgreen; line-height: 18px; }', 
            '.daysAgo.recent { background: darkred; }', 
            '.tbPivotItem .daysAgo { margin-right: 4px; }', 
            '.tbPivotItem .witRemainingWork { float: left; margin-right: 4px; }', 
            '.tbPivotItem .pivot-state { line-height: 18px; font-weight: bold; border: dotted 1px gray; background: #ddd; padding: 0 2px; }', 
            '.tbPivotItem .ellipsis { float: left; }', 
            '.tbPivotItem .ellipsis + .daysAgo { margin: 1px 4px 0 4px; }', 
            '.pivot-state.approved, .pivot-state.new { background: red; color: white; }', 
            '.pivot-state.done { background: dardgreen; color: white; }', 
            '.wiid { margin-right: 4px; font-size: 80%; text-decoration: underline; }', 
            '.daysAgo + .witTitle > .wiid { margin-left: 4px; }', 
            '.tile-dimmed { opacity: 0.2; }', 
            '</style>'
        ].join("");
        $("head").append(styleHtml);
    }
    function injectAmplifyJS() {
        var jssrc = TFS.getModuleBase("Bigsan.TFSExtensions.EnhancedTaskBoard") + "amplify-1.1.0.min.js";
        $("head").append($("<script>").attr({
            "type": "text/javascript",
            "src": jssrc
        }));
    }
    function addIdToWorkItemOfSprint(id) {
        var tile = $("#tile-" + id);
        var targets = tile;
        var action = TFS.Host.history.getCurrentState().action || "stories";
        if(action == "stories") {
            var pbi = $("#taskboard-table_p" + id);
            var pbi_summary = pbi.closest(".taskboard-row").next();
            targets = targets.add(pbi).add(pbi_summary);
        }
        targets.each(function (idx, el) {
            if($(el).find(".wiid").length == 0) {
                $(el).find(".witTitle").prepend("<strong class='wiid' />");
            }
            $(el).find(".witTitle .wiid").text(id);
        });
    }
    function addExtraInfoToWorkItem(id, data) {
        var action = TFS.Host.history.getCurrentState().action || "stories";
        var msecsAgo = (new Date()).getTime() - data.changedDate.getTime();
        var daysAgo = (msecsAgo / 86400000).toFixed(1);
        var daysAgoElement = $("<div class='daysAgo'>" + daysAgo + "d</div>").attr("title", "Last Changed: " + data.changedDate.toLocaleString());
        if(daysAgo < "2") {
            daysAgoElement.addClass("recent");
        }
        var tile = $("#tile-" + id);
        tile.find(".daysAgo").remove();
        tile.find(".witExtra").prepend(daysAgoElement.clone());
        var pbiCell = $("#taskboard-table_p" + id);
        if(pbiCell.length > 0 && action == "stories") {
            var summaryRow = pbiCell.closest(".taskboard-row").next();
            pbiCell.find(".daysAgo, .pivot-state").remove();
            summaryRow.find(".daysAgo, .pivot-state").remove();
            var stateElement = $("<span class='pivot-state'>" + data.state + "</span>").addClass(data.state.toLowerCase());
            pbiCell.find(".tbPivotItem .witRemainingWork").before(daysAgoElement.clone()).after(stateElement.clone());
            summaryRow.find(".tbPivotItem").append(daysAgoElement.clone()).append(stateElement.clone());
        }
    }
    function addToolbarButtons() {
        $(".hub-pivot-content").css("top", "+=40px");
        $("<div class='toolbar hub-pivot-toolbar'></div>").insertAfter($(".hub-pivot"));
        TFS.UI.Controls.Menus.MenuBar.createIn($(".hub-pivot-toolbar"), {
            items: [
                {
                    id: "expandAll",
                    text: _res.ExpandAll,
                    title: _res.ExpandAllToolTip,
                    showText: false,
                    icon: "icon-tree-expand-all"
                }, 
                {
                    id: "collapseAll",
                    text: _res.CollapseAll,
                    title: _res.CollapseAllToolTip,
                    showText: false,
                    icon: "icon-tree-collapse-all"
                }, 
                {
                    id: "refresh",
                    text: "Refresh",
                    title: "Refresh",
                    showText: false,
                    icon: "icon-refresh"
                }
            ],
            executeAction: function (e) {
                var cmd = e.get_commandName();
                switch(cmd) {
                    case "expandAll":
                        $(".taskboard-row-summary::visible").each(function (idx, el) {
                            $(el).prev().find(".taskboard-expander").click();
                        });
                        break;
                    case "collapseAll":
                        $(".taskboard-row-summary:not(:visible)").each(function (idx, el) {
                            $(el).prev().find(".taskboard-expander").click();
                        });
                        break;
                    case "refresh":
                        TFS.Host.ActionManager.performAction(TFS.Host.CommonActions.ACTION_WINDOW_RELOAD);
                        break;
                }
            }
        });
    }
    function getAllIdsOfSprint() {
        return $(".tbTile, .taskboard-parent[id]").map(function (idx, item) {
            return item.id.match(/\d+$/)[0];
        }).get();
    }
    function queryWorkItems(ids, callback) {
        _wiManager.beginGetWorkItems(ids, function (items) {
            callback(items);
        });
    }
    function initQuery() {
        log("queryWorkItems start.");
        var ids = getAllIdsOfSprint();
        $.each(ids, function (idx, item) {
            return addIdToWorkItemOfSprint(item);
        });
        var actionId = TFS.globalProgressIndicator.actionStarted("queryWorkItem");
        queryWorkItems(ids, function (workitems) {
            $.each(workitems, function (idx, wi) {
                var id = wi.getFieldValue("System.Id");
                var state = wi.getFieldValue("System.State");
                var changedDate = wi.getFieldValue("System.ChangedDate").value;
                addExtraInfoToWorkItem(id, {
                    changedDate: changedDate,
                    state: state
                });
            });
            TFS.globalProgressIndicator.actionCompleted(actionId);
            log("queryWorkItems end.");
        });
    }
    function addToggleFilter(title, defaultValue) {
        var template = [
            '<div class="select pivot-filter enhance" title="{title}">', 
            '<span class="title">{title}</span>', 
            '<ul class="pivot-filter-items">', 
            '<li class="pivot-filter-item" data-value="on" title="ON"><a href="#">ON</a></li>', 
            '<li class="pivot-filter-item" data-value="off" title="OFF"><a href="#">OFF</a></li>', 
            '</ul>', 
            '</div>'
        ].join("");
        if(defaultValue != "on") {
            defaultValue = "off";
        }
        return $(template).attr("title", title).find(".title").text(title).end().find("li[data-value=" + defaultValue + "]").addClass("selected").end().prependTo($(".filters:first"));
    }
    function toggleMaximizeWorkspace(max) {
        var header = $(".header-section");
        var content = $(".content-section");
        if(max) {
            header.animate({
                "margin-top": "-91px"
            });
            content.animate({
                "top": 0
            });
        } else {
            header.animate({
                "margin-top": 0
            });
            content.animate({
                "top": "91px"
            });
        }
        if(_currentRoute == "backlogs.index") {
            $.queue($(".content-section")[0], "fx", function () {
                $(".productbacklog-grid-results").resize();
                $.dequeue(this);
            });
        }
    }
    injectAmplifyJS();
    var maxWorkspace = amplify.store("maxWorkspace");
    var maxWksFilter = addToggleFilter("maximize workspace", maxWorkspace ? "on" : "off");
    TFS.Host.UI.PivotFilter.ensureEnhancements(maxWksFilter);
    maxWksFilter.bind("changed", function (n, t) {
        var val = t.value == "on";
        toggleMaximizeWorkspace(val);
        amplify.store("maxWorkspace", val);
    });
    toggleMaximizeWorkspace(maxWorkspace);
    if(_currentRoute == "boards.index") {
        addCssRules();
        addToolbarButtons();
        _wiManager.attachWorkItemChanged(function (sender, ea) {
            if(ea.change == "reset" || ea.change == "save-completed") {
                var wi = ea.workItem;
                var id = wi.getFieldValue("System.Id");
                var state = wi.getFieldValue("System.State");
                var changedDate = wi.getFieldValue("System.ChangedDate").value;
                window.setTimeout(function () {
                    addIdToWorkItemOfSprint(id);
                    addExtraInfoToWorkItem(id, {
                        changedDate: changedDate,
                        state: state
                    });
                }, 100);
            }
        });
        TFS.Host.history.attachNavigate("stories", function () {
            initQuery();
            log("onNaviage: stories");
        }, true);
        TFS.Host.history.attachNavigate("team", function () {
            log("onNavigate: team");
        }, true);
        initQuery();
    } else if(_currentRoute == "backlogs.board") {
        addCssRules();
        $(".board-tile").each(function (idx, el) {
            if($(el).find(".wiid").length == 0) {
                $(el).find(".title").prepend("<strong class='wiid' />");
            }
            $(el).find(".title .wiid").text($(el).data("itemId"));
        });
        _wiManager.attachWorkItemChanged(function (sender, ea) {
            if(ea.change == "reset" || ea.change == "save-completed") {
                var wi = ea.workItem;
                var id = wi.getFieldValue("System.Id");
                var state = wi.getFieldValue("System.State");
                var changedDate = wi.getFieldValue("System.ChangedDate").value;
                window.setTimeout(function () {
                    var el = $(".board-tile[data-item-id=" + id + "]");
                    if($(el).find(".wiid").length == 0) {
                        $(el).find(".title").prepend("<strong class='wiid' />");
                    }
                    $(el).find(".title .wiid").text($(el).data("itemId"));
                    addExtraInfoToWorkItem(id, {
                        changedDate: changedDate,
                        state: state
                    });
                }, 100);
            }
        });
    }
});
