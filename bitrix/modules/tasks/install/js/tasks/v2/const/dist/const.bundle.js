/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports) {
	'use strict';

	const Tool = Object.freeze({
	  Tasks: 'tasks'
	});
	const Category = Object.freeze({
	  TaskOperations: 'task_operations'
	});
	const Event = Object.freeze({
	  DeadlineSet: 'deadline_set',
	  AssigneeChange: 'assignee_change',
	  TaskComplete: 'task_complete',
	  TaskCreate: 'task_create',
	  AddChecklist: 'add_checklist',
	  TaskCreateWithChecklist: 'task_create_with_checklist',
	  AttachFile: 'attach_file',
	  AddProject: 'add_project',
	  DescriptionTask: 'description_task',
	  FillTaskFormView: 'full_task_form_view',
	  ClickCreate: 'click_create'
	});
	const Type = Object.freeze({
	  TaskMini: 'task_mini',
	  Task: 'task'
	});
	const Section = Object.freeze({
	  test: 'test'
	});
	const TaskState = Object.freeze({
	  New: 'new',
	  Existing: 'existing'
	});
	const SubSection = Object.freeze({
	  FullTaskForm: 'full_task_form',
	  TaskCard: 'task_card',
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
	  CheckListButton: 'checklist_button'
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
	  FileExtension: extension => `ext_${extension}`
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

	const EntitySelectorEntity = Object.freeze({
	  Epic: 'epic-selector',
	  Flow: 'flow',
	  Project: 'project',
	  User: 'user',
	  StructureNode: 'structure-node'
	});

	const EventName = Object.freeze({
	  CloseCard: 'tasks:card:close',
	  CloseFullCard: 'tasks:full-card:close',
	  OpenFullCard: 'tasks:card:openFullCard',
	  OpenSliderCard: 'tasks:card:openSliderCard',
	  ShowOverlay: 'tasks:card:showOverlay',
	  HideOverlay: 'tasks:card:hideOverlay',
	  AdjustPosition: 'tasks:card:adjustPosition',
	  CloseCheckList: 'tasks:card:check-list:close',
	  NotifyGrid: 'tasksTaskEvent'
	});

	const GroupType = Object.freeze({
	  Group: 'group',
	  Project: 'project',
	  Scrum: 'scrum',
	  Collab: 'collab'
	});

	const Model = Object.freeze({
	  Epics: 'epics',
	  Flows: 'flows',
	  Groups: 'groups',
	  Interface: 'interface',
	  Stages: 'stages',
	  Tasks: 'tasks',
	  Users: 'users',
	  CheckList: 'checklist',
	  Analytics: 'analytics'
	});

	const Module = Object.freeze({
	  Tasks: 'tasks'
	});

	const TaskStatus = Object.freeze({
	  Pending: 'pending',
	  InProgress: 'in_progress',
	  Completed: 'completed',
	  SupposedlyCompleted: 'supposedly_completed',
	  Deferred: 'deferred'
	});

	const CardType = Object.freeze({
	  Compact: 'task_mini',
	  Full: 'task'
	});

	exports.Analytics = Analytics;
	exports.EntitySelectorEntity = EntitySelectorEntity;
	exports.EventName = EventName;
	exports.GroupType = GroupType;
	exports.Model = Model;
	exports.Module = Module;
	exports.TaskStatus = TaskStatus;
	exports.CardType = CardType;

}((this.BX.Tasks.V2.Const = this.BX.Tasks.V2.Const || {})));
//# sourceMappingURL=const.bundle.js.map
