/// <reference path="d.ts/TFS11.d.ts" />
declare var $;
declare var __uiCulture: string;

TFS.module("Bigsan.TFSExtensions.EnhancedTaskBoard", ["TFS.Host"], function () {

	var wiManager = TFS.OM.TfsTeamProjectCollection.getDefault().getService(TFS.WorkItemTracking.WorkItemStore).workItemManager;
	var res = TFS.Resources.Common;

	function addCssRules() {
		var styleHtml = ['<style id="etb" type="text/css">',
						'.daysAgo { float: left; padding: 0 4px; color: white; background: darkgreen; }',
						'.daysAgo.recent { background: darkred; }',
						'.taskboard-parent-wrapper .daysAgo { padding: 2px 4px 3px; }',

						'.wiid { margin-right: 4px; }',
						'.daysAgo + .witTitle > .wiid { margin-left: 4px; }',

						'.taskboard-row-summary .tbPivotItem .ellipsis { float: left; }',
						'.taskboard-row-summary .tbPivotItem .pivot-state { margin-left: 4px; }',
						'.tbPivotItem .pivot-state { font-size: 120%; font-weight: bold; line-height: 25px; }',

						'.tile-dimmed { opacity: 0.2; }',
						'</style>'].join("");
		$("head").append(styleHtml);
	}

	function addIdToWorkItem(id: string) {
		var tile = $("#tile-" + id);

		var targets = tile;
		var state = TFS.Host.history.getCurrentState().action;
		if (state == "stories") {
			var pbi = $("#taskboard-table_p" + id);
			var pbi_summary = pbi.closest(".taskboard-row").next();
			targets = targets.add(pbi).add(pbi_summary);
		}

		targets.each((idx, el) => {
			if ($(el).find(".wiid").length == 0) $(el).find(".witTitle").prepend("<strong class='wiid' />");

			$(el).find(".witTitle .wiid").text(id);
		});
	}

	function addExtraInfoToWorkItem(id: string, data: { changedDate; state; }) {
		var state = TFS.Host.history.getCurrentState().action;

		var msecsAgo = (new Date()).getTime() - data.changedDate.getTime();
		var daysAgo = Math.round(msecsAgo / 86400000);

		var daysAgoDiv = $("<div class='daysAgo'>" + daysAgo + "d</div>")
			.attr("title", "Last Changed: " + data.changedDate.toLocaleString());
		if (daysAgo < 2) daysAgoDiv.addClass("recent");

		$("#tile-" + id)
			.find(".daysAgo").remove().end()
			.find(".witExtra").prepend(daysAgoDiv);

		if (state == "stories") {
			var row = $("#taskboard-table_p" + id);
			var summaryRow = row.closest(".taskboard-row").next();
			var pivotItemRows = row.add(summaryRow);
			pivotItemRows
				.find(".daysAgo").remove().end()
				.find(".witTitle").before(daysAgoDiv).end()
				.find(".pivot-state").remove().end()
				.find(".tbPivotItem").append("<span class='pivot-state'>" + data.state + "</span>");
		}
	}

	function addToolbarButtons() {
		$(".hub-pivot-content").css("top", "+=40px");
		$("<div class='toolbar hub-pivot-toolbar'></div>").insertAfter($(".hub-pivot"));
		TFS.UI.Controls.Menus.MenuBar.createIn($(".hub-pivot-toolbar"), {
			items: [{
				id: "expandAll",
				text: res.ExpandAll,
				title: res.ExpandAllToolTip,
				showText: false,
				icon: "icon-tree-expand-all"
			}, {
				id: "collapseAll",
				text: res.CollapseAll,
				title: res.CollapseAllToolTip,
				showText: false,
				icon: "icon-tree-collapse-all"
			}],
			executeAction: function (e) {
				var cmd = e.get_commandName();
				switch (cmd) {
					case "expandAll":
						$(".taskboard-row-summary::visible").each((idx, el) => {
							$(el).prev().find(".taskboard-expander").click();
						});
						break;
					case "collapseAll":
						$(".taskboard-row-summary:not(:visible)").each((idx, el) => {
							$(el).prev().find(".taskboard-expander").click();
						});
						break;
				}
			}
		});
	}

	function addSelectFilter(title) {
		var template = [
			'<div class="select pivot-filter enhance" title="{title}">',
			'<span class="title">{title}</span>',
			'<ul class="pivot-filter-items">',
			'<li class="pivot-filter-item" data-value="on" title="ON"><a href="#">ON</a></li>',
			'<li class="pivot-filter-item selected" data-value="off" title="OFF"><a href="#">OFF</a></li>',
			'</ul>',
			'</div>'].join("");

		return $(template)
			.attr("title", title)
			.find(".title").text(title).end()
			.prependTo($(".filters:first"));
	}

	function toggleMaximizeWorkspace(max) {
		if (max) {
			$(".header-section").animate({ "margin-top": "-=91px" });
			$(".content-section").animate({ "top": "-=91px" });
		} else {
			$(".header-section").animate({ "margin-top": "+=91px" });
			$(".content-section").animate({ "top": "+=91px" });
		}
	}

	function getAllIds(): string[] {
		return $(".tbTile, .taskboard-parent[id]").map((idx, item) => { return item.id.match(/\d+$/)[0]; }).get();
	}

	function queryWorkItems(ids: string[], callback: (wit_array: any[]) => {}): void {
		wiManager.beginGetWorkItems(ids, (items) => {
			callback(items);
		});
	}

	function initQuery() {
		console.log("initQuery");

		var ids = getAllIds();
		queryWorkItems(ids, (workitems) => {
			$.each(workitems, function (idx, wi) {
				var id = wi.getFieldValue("System.Id");
				var state = wi.getFieldValue("System.State");
				var changedDate = wi.getFieldValue("System.ChangedDate").value;

				addIdToWorkItem(id);
				addExtraInfoToWorkItem(id, { changedDate: changedDate, state: state });
			});
		});
	}

	addCssRules();
	addToolbarButtons();

	var maxWksFilter = addSelectFilter("maximize workspace");
	TFS.Host.UI.PivotFilter.ensureEnhancements(maxWksFilter);
	maxWksFilter.bind("changed", function (n, t) {
		var val = t.value == "on";
		toggleMaximizeWorkspace(val);
	});

	// attach work item changed event
	wiManager.attachWorkItemChanged((sender, ea) => {
		if (ea.change == "reset" || ea.change == "save-completed") {
			var wi = ea.workItem;
			var id = wi.getFieldValue("System.Id");
			var state = wi.getFieldValue("System.State");
			var changedDate = wi.getFieldValue("System.ChangedDate").value;

			window.setTimeout(function () {
				addIdToWorkItem(id);
				addExtraInfoToWorkItem(id, { changedDate: changedDate, state: state });
			}, 500);
		}
	});

	TFS.Host.history.attachNavigate("stories", function () {
		initQuery(); // load pbi id & extra info if it was not loaded yet.
		console.log("onNaviage: stories");
	}, true);

	TFS.Host.history.attachNavigate("team", function () {
		console.log("onNavigate: team");
	}, true);

	initQuery();
});