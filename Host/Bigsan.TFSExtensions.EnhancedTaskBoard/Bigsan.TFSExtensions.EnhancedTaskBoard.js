TFS.module("Bigsan.TFSExtensions.EnhancedTaskBoard", [
    "TFS.Host"
], function () {
    var wiManager = TFS.OM.TfsTeamProjectCollection.getDefault().getService(TFS.WorkItemTracking.WorkItemStore).workItemManager;
    var res = TFS.Resources.Common;
    function addCssRules() {
        var styleHtml = [
            '<style id="etb" type="text/css">', 
            '.daysAgo { float: left; padding: 0 4px; color: white; background: darkgreen; }', 
            '.daysAgo.recent { background: darkred; }', 
            '.wiid { margin-right: 4px; }', 
            '.taskboard-row-summary .tbPivotItem .ellipsis { float: left; }', 
            '.taskboard-row-summary .tbPivotItem .pivot-state { margin-left: 4px; }', 
            '.tbPivotItem .pivot-state { font-size: 120%; font-weight: bold; }', 
            '</style>'
        ].join("");
        $("head").append(styleHtml);
    }
    function addIdToWorkItem(id) {
        var tile = $("#tile-" + id);
        var pbi = $("#taskboard-table_p" + id);
        var pbi_summary = pbi.closest(".taskboard-row").next();
        tile.add(pbi).add(pbi_summary).each(function (idx, el) {
            if($(el).find(".wiid").length == 0) {
                $(el).find(".witTitle").prepend("<strong class='wiid' />");
            }
            $(el).find(".witTitle .wiid").text(id);
        });
    }
    function addExtraInfoToWorkItem(id, data) {
        var msecsAgo = (new Date()).getTime() - data.changedDate.getTime();
        var daysAgo = Math.ceil(msecsAgo / 86400000);
        var daysAgoDiv = $("<div class='daysAgo'>" + daysAgo + "d</div>").attr("title", data.changedDate.toString());
        if(daysAgo < 2) {
            daysAgoDiv.addClass("recent");
        }
        $("#tile-" + id).find(".daysAgo").remove().end().find(".witExtra").prepend(daysAgoDiv);
        var row = $("#taskboard-table_p" + id);
        var summaryRow = row.closest(".taskboard-row").next();
        var pivotItemRows = row.add(summaryRow);
        pivotItemRows.find(".daysAgo").remove().end().find(".witTitle").before(daysAgoDiv).end().find(".pivot-state").remove().end().find(".tbPivotItem").append("<span class='pivot-state'>" + data.state + "</span>");
    }
    function addToolbarButtons() {
        $(".hub-pivot-content").css("top", "+=40px");
        $("<div class='toolbar hub-pivot-toolbar'></div>").insertAfter($(".hub-pivot"));
        TFS.UI.Controls.Menus.MenuBar.createIn($(".hub-pivot-toolbar"), {
            items: [
                {
                    id: "expandAll",
                    text: res.ExpandAll,
                    title: res.ExpandAllToolTip,
                    showText: false,
                    icon: "icon-tree-expand-all"
                }, 
                {
                    id: "collapseAll",
                    text: res.CollapseAll,
                    title: res.CollapseAllToolTip,
                    showText: false,
                    icon: "icon-tree-collapse-all"
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
                }
            }
        });
    }
    function getAllIds() {
        return $(".tbTile, .taskboard-parent[id]").map(function (idx, item) {
            return item.id.match(/\d+$/)[0];
        }).get();
    }
    function getWitQueryUrl(ids) {
        var collectionUrl = location.pathname.match(/\/tfs\/[^\/]+/i)[0];
        var idsQuery = $.map(ids, function (item, idx) {
            return "ids=" + item;
        }).join("&");
        return collectionUrl + "/_api/_wit/workitems?__v=1&" + idsQuery;
    }
    function queryWorkItems(ids, callback) {
        wiManager.beginGetWorkItems(ids, function (items) {
            callback(items);
        });
    }
    function initQuery() {
        var ids = getAllIds();
        queryWorkItems(ids, function (workitems) {
            $.each(workitems, function (idx, wi) {
                var id = wi.getFieldValue("System.Id");
                var state = wi.getFieldValue("System.State");
                var changedDate = wi.getFieldValue("System.ChangedDate").value;
                addIdToWorkItem(id);
                addExtraInfoToWorkItem(id, {
                    changedDate: changedDate,
                    state: state
                });
            });
        });
    }
    initQuery();
    addCssRules();
    addToolbarButtons();
    wiManager.attachWorkItemChanged(function (sender, ea) {
        if(ea.change == "reset" || ea.change == "save-completed") {
            var wi = ea.workItem;
            var id = wi.getFieldValue("System.Id");
            var state = wi.getFieldValue("System.State");
            var changedDate = wi.getFieldValue("System.ChangedDate").value;
            window.setTimeout(function () {
                addIdToWorkItem(id);
                addExtraInfoToWorkItem(id, {
                    changedDate: changedDate,
                    state: state
                });
            }, 500);
        }
    });
    TFS.Host.history.attachNavigate("stories", function () {
        initQuery();
    }, true);
});
