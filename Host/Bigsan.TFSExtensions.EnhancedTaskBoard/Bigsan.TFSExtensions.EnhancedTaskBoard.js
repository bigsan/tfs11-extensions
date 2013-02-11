TFS.module("Bigsan.TFSExtensions.EnhancedTaskBoard", [
    "TFS.Host"
], function () {
    var wiManager = TFS.OM.TfsTeamProjectCollection.getDefault().getService(TFS.WorkItemTracking.WorkItemStore).workItemManager;
    function addCssRules() {
        var styleHtml = [
            '<style id="etb" type="text/css">', 
            '.daysAgo { float: left; padding: 0 4px; color: white; background: darkgreen; }', 
            '.daysAgo.recent { background: darkred; }', 
            '.wiid { margin-right: 4px; }', 
            '.task-board-summary .tbPivotItem .ellipsis { float: left; }', 
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
    function addIdToWorkItems(ids) {
        $.each(ids, function (idx, item) {
            addIdToWorkItem(item);
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
    var ids = getAllIds();
    queryWorkItems(ids, function (workitems) {
        var now = new Date();
        $.each(workitems, function (idx, wi) {
            var id = wi.getFieldValue("System.Id");
            var state = wi.getFieldValue("System.State");
            var changedDate = wi.getFieldValue("System.ChangedDate").value;
            addExtraInfoToWorkItem(id, {
                changedDate: changedDate,
                state: state
            });
        });
    });
    addCssRules();
    addIdToWorkItems(ids);
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
});
