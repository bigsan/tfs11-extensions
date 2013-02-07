TFS.module("Bigsan.TFSExtensions.EnhancedTaskBoard", ["TFS.Host"], function () {
    var tiles = $(".tbTile");
    var allIds = tiles.map(function () { return "ids=" + this.id.match(/\d+$/)[0]; }).get();
    var collectionUrl = location.pathname.match(/\/tfs\/[^\/]+/i)[0]; // ex: "/tfs/DefaultCollection"
    var queryUrl = collectionUrl + "/_api/_wit/workitems?__v=1&" + allIds.join("&");

    // add css rule
    var styleHtml = [
        '<style id="etb" type="text/css">',
        '.daysAgo { float: left; padding: 0 4px; color: white; background: darkgreen; }',
        '.daysAgo.recent { background: darkred; }',
        '.wiid { }',
        '</style>'
    ].join("");
    $("head").append(styleHtml);

    // add work item id
    tiles.add('.taskboard-cell.taskboard-parent[id]').each(function (idx, el) {
        $(".witTitle", el).prepend("<strong>" + el.id.match(/\d+$/)[0] + "</strong> - ");
    });

    // add last modified date
    $.getJSON(queryUrl, function (d) {
        var items = d.__wrappedArray;
        var now = new Date();
        $.each(items, function (idx, item) {
            var tick = parseInt(item.fields["3"].match(/\d+/)[0], 10);
            var id = item.fields["-3"];
            var date = new Date(tick);
            var msecs = now.getTime() - date.getTime();
            var daysAgo = Math.ceil(msecs / 86400000);
            var daysAgoDiv = $("<div class='daysAgo'>" + daysAgo + "d</div>")
                .attr("title", date.toString());
            if (daysAgo < 2) daysAgoDiv.addClass("recent");

            $("#tile-" + id).find(".witExtra").prepend(daysAgoDiv);
        });
    });
});