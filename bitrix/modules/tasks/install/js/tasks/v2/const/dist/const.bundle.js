/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports) {
	'use strict';

	const AhaMoment = Object.freeze({
	  AuditorsInCard: 'auditors_in_card'
	});

	const Tool = Object.freeze({
	  Tasks: 'tasks'
	});
	const Category = Object.freeze({
	  TaskOperations: 'task_operations',
	  TimeTracking: 'time_tracking'
	});
	const Event = Object.freeze({
	  DeadlineSet: 'deadline_set',
	  AssigneeChange: 'assignee_change',
	  TaskComplete: 'task_complete',
	  TaskView: 'task_view',
	  TaskCreate: 'task_create',
	  AddChecklist: 'add_checklist',
	  TaskCreateWithChecklist: 'task_create_with_checklist',
	  AttachFile: 'attach_file',
	  AddProject: 'add_project',
	  DescriptionTask: 'description_task',
	  FillTaskFormView: 'full_task_form_view',
	  ClickCreate: 'click_create',
	  RoleClick: 'role_click',
	  RoleClickType: 'role_click_type',
	  PatternTaskCreate: 'pattern_task_create',
	  SubTaskAdd: 'subtask_add',
	  AddCoexecutor: 'add_coexecutor',
	  AddViewer: 'add_viewer',
	  StatusSummaryAdd: 'status_summary_add',
	  TimeEntryCreate: 'time_entry_create'
	});
	const Type = Object.freeze({
	  TaskMini: 'task_mini',
	  Task: 'task',
	  Auto: 'auto',
	  Manual: 'manual'
	});
	const Section = Object.freeze({
	  Tasks: 'tasks',
	  Templates: 'templates'
	});
	const TaskState = Object.freeze({
	  New: 'new',
	  Existing: 'existing'
	});
	const SubSection = Object.freeze({
	  FullTaskForm: 'full_task_form',
	  TaskCard: 'task_card',
	  Chat: 'chat',
	  TemplatesCard: 'templates_card',
	  MyFiles: 'my_files',
	  Bitrix24Files: 'bitrix24_files'
	});
	const Element = Object.freeze({
	  FullFormButton: 'full_form_button',
	  ProjectButton: 'project_button',
	  Calendar: 'calendar',
	  DeadlinePreset: 'deadline_preset',
	  ChangeButton: 'change_button',
	  UploadButton: 'upload_button',
	  CheckListButton: 'checklist_button',
	  RoleButton: 'role_button',
	  RoleAllButton: 'role_all_button',
	  RoleHelpButton: 'role_help_button',
	  RoleDoingButton: 'role_doing_button',
	  RoleAssignedButton: 'role_assigned_button',
	  RoleWatchingButton: 'role_watching_button',
	  CreateButton: 'create_button',
	  ContextMenu: 'context_menu',
	  ContextMenuSubtask: 'context_menu_subtask',
	  ContextMenuTemplateTask: 'context_menu_template_task',
	  CompleteButton: 'complete_button',
	  DeadlineField: 'deadline_field',
	  CoexecutorButton: 'coexecutor_button',
	  ViewerButton: 'viewer_button',
	  AddResult: 'add_result',
	  ChatContextMenu: 'chat_context_menu'
	});
	const Status = Object.freeze({
	  Success: 'success',
	  Error: 'error',
	  Attempt: 'attempt',
	  Cancel: 'cancel'
	});
	const Params = Object.freeze({
	  CollabId: collabId => `collabId_${collabId}`,
	  ViewersCount: count => `viewersCount_${count}`,
	  CoexecutorsCount: count => `coexecutorsCount_${count}`,
	  ChecklistCount: (count, itemsCount) => `checklistCount_${count}-${itemsCount}`,
	  ChecklistPointsCount: count => `checklistpointsCount_${count}`,
	  HasDescription: has => `description_${has ? 'true' : 'false'}`,
	  HasScroll: has => `scroll_${has ? 'true' : 'false'}`,
	  FileSize: size => `size_${size}`,
	  FilesCount: count => `filesCount_${count}`,
	  FileExtension: extension => `ext_${extension}`,
	  IsDemo: isDemo => `isDemo_${isDemo ? 'Y' : 'N'}`,
	  FilterEnabled: enabled => `filter_${enabled ? 'on' : 'off'}`,
	  TaskId: taskId => `taskId_${taskId}`
	});
	const Analytics = Object.freeze({
	  Tool,
	  Category,
	  Event,
	  Type,
	  Section,
	  SubSection,
	  Element,
	  Status,
	  Params,
	  TaskState
	});

	const CardType = Object.freeze({
	  Compact: 'task_mini',
	  Full: 'task'
	});

	const ChatActionParam = Object.freeze({
	  ChatAction: 'chatAction',
	  EntityId: 'entityId',
	  ChildrenIds: 'childrenIds'
	});

	const ChatAction = Object.freeze({
	  ChangeDeadline: 'changeDeadline',
	  CompleteTask: 'completeTask',
	  OpenResult: 'openResult',
	  ShowCheckList: 'showCheckList',
	  ShowCheckListItems: 'showCheckListItems'
	});

	const DurationUnit = Object.freeze({
	  Minutes: 'minutes',
	  Hours: 'hours',
	  Days: 'days',
	  Weeks: 'weeks',
	  Months: 'months'
	});

	const EntitySelectorEntity = Object.freeze({
	  Epic: 'epic-selector',
	  Flow: 'flow',
	  Project: 'project',
	  Group: 'group',
	  Tag: 'task-tag',
	  TemplateTag: 'template-tag',
	  User: 'user',
	  Department: 'department',
	  StructureNode: 'structure-node',
	  Deal: 'deal',
	  Contact: 'contact',
	  Company: 'company',
	  Lead: 'lead',
	  SmartInvoice: 'smart_invoice',
	  DynamicMultiple: 'dynamic_multiple',
	  ReminderRecipient: 'reminder-recipient',
	  Task: 'task-with-id',
	  Template: 'task-template-with-id',
	  MetaUser: 'meta-user',
	  AllUser: 'all-users'
	});

	const EventName = Object.freeze({
	  CloseCard: 'tasks:card:close',
	  CloseFullCard: 'tasks:full-card:close',
	  FullCardHasChanges: 'tasks:full-card:hasChanges',
	  TryCloseFullCard: 'tasks:full-card:tryClose',
	  OpenFullCard: 'tasks:card:openFullCard',
	  OpenCompactCard: 'tasks:card:openCompactCard',
	  CardClosed: 'tasks:card:closed',
	  FullCardInit: 'tasks:full-card:init',
	  FullCardClosed: 'tasks:full-card:closed',
	  TaskAdded: 'tasks:card:taskAdded',
	  TaskBeforeUpdate: 'tasks:card:taskBeforeUpdate',
	  TaskAfterUpdate: 'tasks:card:taskAfterUpdate',
	  TaskPullUpdated: 'tasks:card:taskPullUpdated',
	  TaskDeleted: 'tasks:card:taskDeleted',
	  TemplateAdded: 'tasks:templateAdded',
	  TemplateBeforeUpdate: 'tasks:templateBeforeUpdate',
	  TemplateDeleted: 'tasks:templateDeleted',
	  TagDeleted: 'tasks:card:tagDeleted',
	  UserMenuExternalItems: 'tasks:card:userMenuExternalItems',
	  OpenSliderCard: 'tasks:card:openSliderCard',
	  OpenGrid: 'tasks:card:openGrid',
	  ShowOverlay: 'tasks:card:showOverlay',
	  HideOverlay: 'tasks:card:hideOverlay',
	  AdjustPosition: 'tasks:card:adjustPosition',
	  AddCheckListFromText: 'tasks:card:check-list:addFromText',
	  CloseCheckList: 'tasks:card:check-list:close',
	  OpenDeadlinePicker: 'tasks:deadline:openPicker',
	  OpenResultFromChat: 'task:card:open-result-from-chat',
	  AddResultFromChat: 'task:card:add-result-from-chat',
	  DeleteResultFromChat: 'task:card:delete-result-from-chat',
	  RequiredResultsMissing: 'task:card:required-results-missing',
	  ResultAdded: 'task:card:result-added',
	  ResultSuccessfulAdded: 'task:card:result-successful-added',
	  ResultUpdated: 'task:card:result-updated',
	  ResultFromMessageAdded: 'task:card:result-from-message-added',
	  OpenPrefilledResultForm: 'task:card:open-prefilled-result-form',
	  TimeTrackingChange: 'task:card:timeTackingChange',
	  LegacyTasksTaskEvent: 'tasksTaskEvent',
	  DescriptionConflictDetected: 'tasks:description:conflictDetected',
	  HighlightCheckListItem: 'tasks:card:check-list-item:highlight',
	  ShowCheckList: 'tasks:card:check-list:show',
	  ShowCheckListItems: 'tasks:card:check-list-items:show',
	  OpenHistory: 'tasks:full-card:openHistory',
	  OpenTemplateHistory: 'tasks:template:openHistory',
	  UpdateReplicateParams: 'tasks:template:update-replicate-params'
	});

	const GroupType = Object.freeze({
	  Group: 'group',
	  Project: 'project',
	  Scrum: 'scrum',
	  Collab: 'collab'
	});

	const Limit = Object.freeze({
	  RelationList: 10,
	  Results: 3
	});

	const Model = Object.freeze({
	  CheckList: 'check-list',
	  CrmItems: 'crm-items',
	  Epics: 'epics',
	  Flows: 'flows',
	  GanttLinks: 'gantt-links',
	  Groups: 'groups',
	  Interface: 'interface',
	  Placements: 'placements',
	  Results: 'results',
	  Stages: 'stages',
	  Tasks: 'tasks',
	  Users: 'users',
	  Reminders: 'reminders',
	  ElapsedTimes: 'elapsed-times'
	});

	const Module = Object.freeze({
	  Tasks: 'tasks'
	});

	const Option = Object.freeze({
	  // AhaMoments
	  AhaResponsibleMany: 'aha_responsible_many',
	  AhaTaskSettingsMessagePopup: 'aha_task_settings_message',
	  AhaAuditorsInCompactFormPopup: 'aha_auditors_compact_form',
	  AhaRequiredResultCreatorPopup: 'aha_required_result_creator',
	  AhaRequiredResultResponsiblePopup: 'aha_required_result_responsible',
	  AhaResultFromMessagePopup: 'aha_result_from_message',
	  AhaStartTimeTracking: 'aha_start_time_tracking',
	  AhaTaskChatPopup: 'aha_task_chat',
	  AhaTaskImportantMessagesPopup: 'aha_task_important_messages'
	});

	const PlacementType = Object.freeze({
	  taskViewTab: 'TASK_VIEW_TAB',
	  taskViewSidebar: 'TASK_VIEW_SIDEBAR',
	  taskViewTopPanel: 'TASK_VIEW_TOP_PANEL',
	  taskUserListToolbar: 'TASK_USER_LIST_TOOLBAR',
	  taskGroupListToolbar: 'TASK_GROUP_LIST_TOOLBAR',
	  taskListContextMenu: 'TASK_LIST_CONTEXT_MENU',
	  taskRobotDesignerToolbar: 'TASK_ROBOT_DESIGNER_TOOLBAR',
	  taskViewSlider: 'TASK_VIEW_SLIDER',
	  taskViewDrawer: 'TASK_VIEW_DRAWER'
	});

	const RemindTo = Object.freeze({
	  Myself: 'myself',
	  Creator: 'creator',
	  Responsible: 'responsible',
	  Accomplice: 'accomplice'
	});
	const RemindBy = Object.freeze({
	  Deadline: 'deadline',
	  Date: 'date'
	});
	const RemindVia = Object.freeze({
	  Notification: 'notification',
	  Email: 'email'
	});

	const ReplicationPeriod = Object.freeze({
	  Daily: 'daily',
	  Weekly: 'weekly',
	  Monthly: 'monthly',
	  Yearly: 'yearly'
	});
	const ReplicationDayType = Object.freeze({
	  DayOfMonth: 1,
	  DayOfWeek: 2
	});
	const ReplicationWeekDayNum = Object.freeze({
	  First: 0,
	  Second: 1,
	  Third: 2,
	  Fourth: 3,
	  Last: 4
	});
	const ReplicationRepeatTill = Object.freeze({
	  Endless: 'endless',
	  Times: 'times',
	  Date: 'date'
	});
	const ReplicationMonthlyType = Object.freeze({
	  Absolute: 1,
	  Relative: 2
	});
	const ReplicationYearlyType = Object.freeze({
	  Absolute: 1,
	  Relative: 2
	});
	const ReplicationWeekDayIndex = Object.freeze({
	  Monday: 0,
	  Tuesday: 1,
	  Wednesday: 2,
	  Thursday: 3,
	  Friday: 4,
	  Saturday: 5,
	  Sunday: 6
	});
	const ReplicationYearlyWeekDayIndex = Object.freeze({
	  Monday: 1,
	  Tuesday: 2,
	  Wednesday: 3,
	  Thursday: 4,
	  Friday: 5,
	  Saturday: 6,
	  Sunday: 7
	});

	const TaskStatus = Object.freeze({
	  Pending: 'pending',
	  InProgress: 'in_progress',
	  Completed: 'completed',
	  SupposedlyCompleted: 'supposedly_completed',
	  Deferred: 'deferred'
	});

	const TaskField = Object.freeze({
	  Accomplices: 'accomplicesIds',
	  Auditors: 'auditorsIds',
	  CheckList: 'checklist',
	  CreatedDate: 'createdTs',
	  Creator: 'creatorId',
	  Crm: 'crmItemIds',
	  DatePlan: 'datePlan',
	  TimeTracking: 'allowsTimeTracking',
	  Deadline: 'deadlineTs',
	  Email: 'email',
	  Files: 'fileIds',
	  Flow: 'flowId',
	  Gantt: 'gantt',
	  Group: 'groupId',
	  Parent: 'parentId',
	  Placements: 'placements',
	  RelatedTasks: 'relatedTasks',
	  Reminders: 'reminders',
	  Responsible: 'responsibleIds',
	  Replication: 'replication',
	  Results: 'results',
	  Status: 'status',
	  SubTasks: 'subTasks',
	  Tags: 'tags',
	  Title: 'title',
	  UserFields: 'userFields'
	});

	const TemplateType = Object.freeze({
	  NewUsers: 'new_users',
	  Usual: 'usual'
	});

	const ResultStatus = Object.freeze({
	  Open: 'open',
	  Closed: 'closed'
	});

	const PermissionType = Object.freeze({
	  Read: 41,
	  Full: 42
	});

	const Endpoint = Object.freeze({
	  TaskGet: 'Task.get',
	  TaskAdd: 'Task.add',
	  TaskCopy: 'Copy.Task.copy',
	  TaskUpdate: 'Task.update',
	  TaskDelete: 'Task.delete',
	  TaskAccessGet: 'Task.Access.get',
	  TaskDescriptionUpdate: 'Task.Description.update',
	  TaskDescriptionForceUpdate: 'Task.Description.forceUpdate',
	  TaskFavoriteAdd: 'Task.Favorite.add',
	  TaskFavoriteDelete: 'Task.Favorite.delete',
	  TaskAttentionMute: 'Task.Attention.mute',
	  TaskAttentionUnmute: 'Task.Attention.unmute',
	  TaskResultRequire: 'Task.Result.require',
	  TaskResultGet: 'Task.Result.get',
	  TaskResultTail: 'Task.Result.tail',
	  TaskResultGetAll: 'Task.Result.getAll',
	  TaskResultAdd: 'Task.Result.add',
	  TaskResultUpdate: 'Task.Result.update',
	  TaskResultDelete: 'Task.Result.delete',
	  TaskResultMessageAdd: 'Task.Result.Message.add',
	  TaskReminderList: 'Task.Reminder.list',
	  TaskReminderSet: 'Task.Reminder.set',
	  TaskReminderAdd: 'Task.Reminder.add',
	  TaskReminderUpdate: 'Task.Reminder.update',
	  TaskReminderDelete: 'Task.Reminder.delete',
	  TaskStateSet: 'Task.State.set',
	  TaskDeadlineUpdate: 'Task.Deadline.update',
	  TaskPlanUpdate: 'Task.Plan.update',
	  TaskStakeholderResponsibleDelegate: 'Task.Stakeholder.Responsible.delegate',
	  TaskCrmItemSet: 'Task.CRM.Item.set',
	  LegacyCommentGet: 'LegacyComment.get',
	  LegacyUserFieldGetTask: 'LegacyUserField.getTask',
	  LegacyUserFieldGetTemplate: 'LegacyUserField.getTemplate',
	  TaskStatusStart: 'Task.Status.start',
	  TaskStatusTake: 'Task.Status.take',
	  TaskStatusDisapprove: 'Task.Status.disapprove',
	  TaskStatusDefer: 'Task.Status.defer',
	  TaskStatusApprove: 'Task.Status.approve',
	  TaskStatusPause: 'Task.Status.pause',
	  TaskStatusComplete: 'Task.Status.complete',
	  TaskStatusRenew: 'Task.Status.renew',
	  TaskTrackingTimerStart: 'Task.Tracking.Timer.start',
	  TaskTrackingTimerStop: 'Task.Tracking.Timer.stop',
	  TaskDeadlineGetDeadlineChangeCount: 'Task.Deadline.getDeadlineChangeCount',
	  TaskDeadlineCleanChangeLog: 'Task.Deadline.cleanChangeLog',
	  TaskTimeTrackingAdd: 'Task.Tracking.ElapsedTime.add',
	  TaskTimeTrackingUpdate: 'Task.Tracking.ElapsedTime.update',
	  TaskTimeTrackingDelete: 'Task.Tracking.ElapsedTime.delete',
	  TaskTimeTrackingList: 'Task.Tracking.ElapsedTime.list',
	  TaskTimeTrackingListParticipants: 'Task.Tracking.ElapsedTime.listParticipants',
	  TaskMultiTaskAdd: 'Task.Relation.Multi.Task.add',
	  TaskCrmItemList: 'Task.CRM.Item.list',
	  TaskRelationChildListByIds: 'Task.Relation.Child.listByIds',
	  GroupUrlGet: 'Group.Url.get',
	  GroupStageList: 'Group.Stage.list',
	  GroupGet: 'Group.get',
	  GroupGetByTaskId: 'Group.getByTaskId',
	  ScrumUpdateTask: 'Scrum.updateTask',
	  ScrumGetTaskInfo: 'Scrum.getTaskInfo',
	  CheckListGet: 'CheckList.get',
	  CheckListSave: 'CheckList.save',
	  CheckListCollapse: 'CheckList.collapse',
	  CheckListExpand: 'CheckList.expand',
	  CheckListComplete: 'CheckList.complete',
	  CheckListRenew: 'CheckList.renew',
	  FlowGet: 'Flow.get',
	  FileList: 'File.list',
	  TaskCheckListFileList: 'Task.CheckList.File.list',
	  TaskResultFileList: 'Task.Result.File.list',
	  FileListObjects: 'File.listObjects',
	  FileAttach: 'File.attach',
	  FileDetach: 'File.detach',
	  UserList: 'User.list',
	  OptionSet: 'Option.set',
	  OptionSetBool: 'Option.setBool',
	  TemplateHistoryGetGrid: 'Template.History.getGrid',
	  TaskMarkSet: 'Task.Mark.set',
	  TemplateAdd: 'Template.add',
	  TemplateCopy: 'Copy.Template.copy',
	  TemplateGet: 'Template.get',
	  TemplateUpdate: 'Template.update',
	  TemplateDelete: 'Template.delete',
	  TaskFromTemplateGet: 'Template.Task.get',
	  TaskFromTemplateAdd: 'Template.Task.add',
	  TemplateHistoryGetCount: 'Template.History.getCount'
	});

	const UserFieldType = Object.freeze({
	  String: 'string',
	  Double: 'double',
	  Boolean: 'boolean',
	  Datetime: 'datetime'
	});

	const Mark = Object.freeze({
	  Positive: 'positive',
	  Negative: 'negative',
	  None: 'none'
	});

	exports.AhaMoment = AhaMoment;
	exports.Analytics = Analytics;
	exports.CardType = CardType;
	exports.ChatActionParam = ChatActionParam;
	exports.ChatAction = ChatAction;
	exports.DurationUnit = DurationUnit;
	exports.EntitySelectorEntity = EntitySelectorEntity;
	exports.EventName = EventName;
	exports.GroupType = GroupType;
	exports.Limit = Limit;
	exports.Model = Model;
	exports.Module = Module;
	exports.Option = Option;
	exports.PlacementType = PlacementType;
	exports.RemindTo = RemindTo;
	exports.RemindBy = RemindBy;
	exports.RemindVia = RemindVia;
	exports.ReplicationPeriod = ReplicationPeriod;
	exports.ReplicationDayType = ReplicationDayType;
	exports.ReplicationWeekDayNum = ReplicationWeekDayNum;
	exports.ReplicationRepeatTill = ReplicationRepeatTill;
	exports.ReplicationMonthlyType = ReplicationMonthlyType;
	exports.ReplicationYearlyType = ReplicationYearlyType;
	exports.ReplicationWeekDayIndex = ReplicationWeekDayIndex;
	exports.ReplicationYearlyWeekDayIndex = ReplicationYearlyWeekDayIndex;
	exports.TaskStatus = TaskStatus;
	exports.TaskField = TaskField;
	exports.TemplateType = TemplateType;
	exports.ResultStatus = ResultStatus;
	exports.PermissionType = PermissionType;
	exports.Endpoint = Endpoint;
	exports.UserFieldType = UserFieldType;
	exports.Mark = Mark;

}((this.BX.Tasks.V2.Const = this.BX.Tasks.V2.Const || {})));
//# sourceMappingURL=const.bundle.js.map
