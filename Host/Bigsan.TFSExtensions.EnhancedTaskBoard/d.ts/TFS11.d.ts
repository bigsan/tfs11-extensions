interface TFSInterface {
	getModuleBase(moduleName: string);
	module(moduleName, deps, callback);
	OM: { TfsTeamProjectCollection; };
	WorkItemTracking: { WorkItemStore; };
	UI;
	Resources;
}

interface WorkItemChangedEventArgsInterface {
	change: string; // reset | save-completed | ...
	workItem: WorkItemInterface;
}

interface WorkItemManagerInterface {
	attachWorkItemChanged(callback: (sender, ea: WorkItemChangedEventArgsInterface) => {});
	beginGetWorkItems(ids: string[], callback: (workItems: any[]) => {});
}

interface WorkItemInterface {
	id: string;
	fieldMap;
	workItemType: { name; };
	getFieldValue(fieldName: string): any;
}

var TFS: TFSInterface;

/* Work Item Field Mapping

   1: System.Title
   2: System.State
   3: System.AuthorizedDate
   7: System.Watermark
   8: System.Rev
   9: System.ChangedBy
   22: System.Reason
   24: System.AssignedTo
   25: System.WorkItemType
   32: System.CreatedDate
   33: System.CreatedBy
   52: System.Description
   54: System.History
   75: System.RelatedLinkCount
   80: System.Tags
10000: Microsoft.VSTS.Scheduling.RemainingWork
10001: Microsoft.VSTS.Common.BacklogPriority
10002: Microsoft.VSTS.Common.Activity
10003: Microsoft.VSTS.Build.IntegrationBuild
10004: Microsoft.VSTS.CMMI.Blocked
10005: Microsoft.VSTS.Common.ClosedDate
10043: Ltc.Scheduling.EstimateWork
   -1: System.AuthorizedAs
   -2: System.AreaId
   -3: System.Id
   -4: System.ChangedDate
   -5: System.RevisedDate
   -7: System.AreaPath
  -12: System.NodeName
  -31: System.AttachedFileCount
  -32: System.HyperLinkCount
  -42: System.TeamProject
  -57: System.ExternalLinkCount
 -104: System.IterationId
 -105: System.IterationPath

SYSTEM.ITERATIONPATH: System.IterationPath
ITERATION PATH: System.IterationPath
SYSTEM.ITERATIONID: System.IterationId
ITERATION ID: System.IterationId
SYSTEM.EXTERNALLINKCOUNT: System.ExternalLinkCount
EXTERNAL LINK COUNT: System.ExternalLinkCount
SYSTEM.TEAMPROJECT: System.TeamProject
TEAM PROJECT: System.TeamProject
SYSTEM.HYPERLINKCOUNT: System.HyperLinkCount
HYPERLINK COUNT: System.HyperLinkCount
SYSTEM.ATTACHEDFILECOUNT: System.AttachedFileCount
ATTACHED FILE COUNT: System.AttachedFileCount
SYSTEM.NODENAME: System.NodeName
NODE NAME: System.NodeName
SYSTEM.AREAPATH: System.AreaPath
AREA PATH: System.AreaPath
SYSTEM.REVISEDDATE: System.RevisedDate
REVISED DATE: System.RevisedDate
SYSTEM.CHANGEDDATE: System.ChangedDate
CHANGED DATE: System.ChangedDate
SYSTEM.ID: System.Id
ID: System.Id
SYSTEM.AREAID: System.AreaId
AREA ID: System.AreaId
SYSTEM.AUTHORIZEDAS: System.AuthorizedAs
AUTHORIZED AS: System.AuthorizedAs
SYSTEM.TITLE: System.Title
TITLE: System.Title
SYSTEM.STATE: System.State
STATE: System.State
SYSTEM.AUTHORIZEDDATE: System.AuthorizedDate
AUTHORIZED DATE: System.AuthorizedDate
SYSTEM.WATERMARK: System.Watermark
WATERMARK: System.Watermark
SYSTEM.REV: System.Rev
REV: System.Rev
SYSTEM.CHANGEDBY: System.ChangedBy
CHANGED BY: System.ChangedBy
SYSTEM.REASON: System.Reason
REASON: System.Reason
SYSTEM.ASSIGNEDTO: System.AssignedTo
ASSIGNED TO: System.AssignedTo
SYSTEM.WORKITEMTYPE: System.WorkItemType
WORK ITEM TYPE: System.WorkItemType
SYSTEM.CREATEDDATE: System.CreatedDate
CREATED DATE: System.CreatedDate
SYSTEM.CREATEDBY: System.CreatedBy
CREATED BY: System.CreatedBy
SYSTEM.DESCRIPTION: System.Description
DESCRIPTION: System.Description
SYSTEM.HISTORY: System.History
HISTORY: System.History
SYSTEM.RELATEDLINKCOUNT: System.RelatedLinkCount
RELATED LINK COUNT: System.RelatedLinkCount
SYSTEM.TAGS: System.Tags
TAGS: System.Tags
MICROSOFT.VSTS.SCHEDULING.REMAININGWORK: Microsoft.VSTS.Scheduling.RemainingWork
REMAINING WORK: Microsoft.VSTS.Scheduling.RemainingWork
MICROSOFT.VSTS.COMMON.BACKLOGPRIORITY: Microsoft.VSTS.Common.BacklogPriority
BACKLOG PRIORITY: Microsoft.VSTS.Common.BacklogPriority
MICROSOFT.VSTS.COMMON.ACTIVITY: Microsoft.VSTS.Common.Activity
ACTIVITY: Microsoft.VSTS.Common.Activity
MICROSOFT.VSTS.BUILD.INTEGRATIONBUILD: Microsoft.VSTS.Build.IntegrationBuild
INTEGRATION BUILD: Microsoft.VSTS.Build.IntegrationBuild
MICROSOFT.VSTS.CMMI.BLOCKED: Microsoft.VSTS.CMMI.Blocked
BLOCKED: Microsoft.VSTS.CMMI.Blocked
MICROSOFT.VSTS.COMMON.CLOSEDDATE: Microsoft.VSTS.Common.ClosedDate
CLOSED DATE: Microsoft.VSTS.Common.ClosedDate
LTC.SCHEDULING.ESTIMATEWORK: Ltc.Scheduling.EstimateWork
ESTIMATE WORK: Ltc.Scheduling.EstimateWork
*/