/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
(function (exports, main_core, ui_analytics, ui_uploader_core, tasks_v2_const) {
	'use strict';

	const settings = main_core.Extension.getSettings('tasks.v2.lib.analytics');
	class AnalyticsSender {
		sendClickCreate(params, options) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.ClickCreate,
				type: this.#getTypeFromCardType(options.cardType),
				...(params.context ? {
					c_section: params.context
				} : {}),
				...(params.additionalContext ? {
					c_sub_section: params.additionalContext
				} : {}),
				...(params.element ? {
					c_element: params.element
				} : {}),
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.IsDemo(settings.isDemo),
				p2: settings.userType,
				p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
				...(options.collabId ? {
					p4: tasks_v2_const.Analytics.Params.CollabId(options.collabId)
				} : {}),
				p5: tasks_v2_const.Analytics.Params.CoexecutorsCount(options.coexecutorsCount)
			});
		}
		sendTaskView(params, options) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.TaskView,
				type: tasks_v2_const.Analytics.Type.Task,
				...(params.context ? {
					c_section: params.context
				} : {}),
				...(params.additionalContext ? {
					c_sub_section: params.additionalContext
				} : {}),
				...(params.element ? {
					c_element: params.element
				} : {}),
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId),
				p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
				p5: tasks_v2_const.Analytics.Params.CoexecutorsCount(options.coexecutorsCount)
			});
		}
		sendTaskComplete(params, options) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.TaskComplete,
				type: tasks_v2_const.Analytics.Type.Task,
				...(params.context ? {
					c_section: params.context
				} : {}),
				...(params.additionalContext ? {
					c_sub_section: params.additionalContext
				} : {}),
				...(params.element ? {
					c_element: params.element
				} : {}),
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId)
			});
		}
		sendOpenFullCard(params) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.FillTaskFormView,
				type: tasks_v2_const.Analytics.Type.TaskMini,
				...(params.context ? {
					c_section: params.context
				} : {}),
				c_sub_section: tasks_v2_const.Analytics.SubSection.FullTaskForm,
				c_element: tasks_v2_const.Analytics.Element.FullFormButton,
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.IsDemo(settings.isDemo)
			});
		}
		sendAddTask(params, options) {
			this.#sendData({
				event: options.event ?? tasks_v2_const.Analytics.Event.TaskCreate,
				type: this.#getTypeFromCardType(options.cardType),
				...(params.context ? {
					c_section: params.context
				} : {}),
				...(params.additionalContext ? {
					c_sub_section: params.additionalContext
				} : {}),
				...(params.element ? {
					c_element: params.element
				} : {}),
				status: options.isSuccess ? tasks_v2_const.Analytics.Status.Success : tasks_v2_const.Analytics.Status.Error,
				p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId),
				p2: settings.userType,
				p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
				...(options.collabId ? {
					p4: tasks_v2_const.Analytics.Params.CollabId(options.collabId)
				} : {}),
				p5: tasks_v2_const.Analytics.Params.CoexecutorsCount(options.coexecutorsCount)
			});
		}
		sendAddTaskWithCheckList(params, options) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.TaskCreateWithChecklist,
				type: this.#getTypeFromCardType(options.cardType),
				...(params.context ? {
					c_section: params.context
				} : {}),
				...(params.additionalContext ? {
					c_sub_section: params.additionalContext
				} : {}),
				...(params.element ? {
					c_element: params.element
				} : {}),
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId),
				p2: settings.userType,
				p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
				...(options.collabId ? {
					p4: tasks_v2_const.Analytics.Params.CollabId(options.collabId)
				} : {}),
				p5: tasks_v2_const.Analytics.Params.ChecklistCount(options.checklistCount, options.checklistItemsCount)
			});
		}
		sendDeleteTask(params, options) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.TaskDelete,
				type: tasks_v2_const.Analytics.Type.Task,
				...(params.context ? {
					c_section: params.context
				} : {}),
				...(params.additionalContext ? {
					c_sub_section: params.additionalContext
				} : {}),
				...(params.element ? {
					c_element: params.element
				} : {}),
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId)
			});
		}
		sendDescription(params, options) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.DescriptionTask,
				type: this.#getTypeFromCardType(options.cardType),
				...(params.context ? {
					c_section: params.context
				} : {}),
				c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
				status: tasks_v2_const.Analytics.Status.Success,
				p2: tasks_v2_const.Analytics.Params.HasDescription(options.hasDescription),
				p3: tasks_v2_const.Analytics.Params.HasScroll(options.hasScroll)
			});
		}
		sendDescriptionEdit(params, options) {
			this.#sendData({
				category: tasks_v2_const.Analytics.Category.TaskOperations,
				event: tasks_v2_const.Analytics.Event.DescriptionEdit,
				type: tasks_v2_const.Analytics.Type.Task,
				...(params.context ? {
					c_section: params.context
				} : {}),
				...(params.element ? {
					c_element: params.element
				} : {}),
				c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId)
			});
		}
		sendDescriptionExpand(params, options) {
			this.#sendData({
				category: tasks_v2_const.Analytics.Category.TaskOperations,
				event: tasks_v2_const.Analytics.Event.DescriptionExpand,
				type: tasks_v2_const.Analytics.Type.Task,
				...(params.context ? {
					c_section: params.context
				} : {}),
				...(params.element ? {
					c_element: params.element
				} : {}),
				c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId)
			});
		}
		sendAddProject(params, options) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.AddProject,
				type: this.#getTypeFromCardType(options.cardType),
				...(params.context ? {
					c_section: params.context
				} : {}),
				c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
				c_element: tasks_v2_const.Analytics.Element.ProjectButton,
				status: tasks_v2_const.Analytics.Status.Success,
				...(options.taskId ? {
					p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId)
				} : {}),
				p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
				p5: tasks_v2_const.Analytics.Params.CoexecutorsCount(options.coexecutorsCount)
			});
		}
		sendDeadlineSet(params, options) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.DeadlineSet,
				type: this.#getTypeFromCardType(options.cardType),
				...(params.context ? {
					c_section: params.context
				} : {}),
				c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
				c_element: options.element,
				status: tasks_v2_const.Analytics.Status.Success,
				...(options.taskId ? {
					p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId)
				} : {}),
				p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
				p5: tasks_v2_const.Analytics.Params.CoexecutorsCount(options.coexecutorsCount)
			});
		}
		#sendRoleChange(params, options) {
			this.#sendData({
				event: options.event,
				type: this.#getTypeFromCardType(options.cardType),
				...(params.context ? {
					c_section: params.context
				} : {}),
				c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
				c_element: options.element,
				status: tasks_v2_const.Analytics.Status.Success,
				...(options.taskId ? {
					p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId)
				} : {}),
				p3: tasks_v2_const.Analytics.Params.ViewersCount(options.viewersCount),
				p5: tasks_v2_const.Analytics.Params.CoexecutorsCount(options.coexecutorsCount)
			});
		}
		sendAssigneeChange(params, options) {
			this.#sendRoleChange(params, {
				...options,
				event: tasks_v2_const.Analytics.Event.AssigneeChange,
				element: tasks_v2_const.Analytics.Element.ChangeButton
			});
		}
		sendAddCoexecutor(params, options) {
			this.#sendRoleChange(params, {
				...options,
				event: tasks_v2_const.Analytics.Event.AddCoexecutor,
				element: tasks_v2_const.Analytics.Element.CoexecutorButton
			});
		}
		sendAddViewer(params, options) {
			this.#sendRoleChange(params, {
				...options,
				event: tasks_v2_const.Analytics.Event.AddViewer,
				element: tasks_v2_const.Analytics.Element.ViewerButton
			});
		}
		sendAttachFile(params, options) {
			const subSection = {
				[ui_uploader_core.FileOrigin.CLIENT]: tasks_v2_const.Analytics.SubSection.MyFiles
			}[options.fileOrigin] ?? tasks_v2_const.Analytics.SubSection.Bitrix24Files;
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.AttachFile,
				type: this.#getTypeFromCardType(options.cardType),
				...(params.context ? {
					c_section: params.context
				} : {}),
				c_sub_section: subSection,
				c_element: tasks_v2_const.Analytics.Element.UploadButton,
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.FileSize(options.fileSize),
				p2: settings.userType,
				p3: tasks_v2_const.Analytics.Params.FilesCount(options.filesCount),
				...(options.collabId ? {
					p4: tasks_v2_const.Analytics.Params.CollabId(options.collabId)
				} : {}),
				p5: tasks_v2_const.Analytics.Params.FileExtension(options.fileExtension)
			});
		}
		sendStatusSummaryAdd(params, options) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.StatusSummaryAdd,
				type: this.#getTypeFromCardType(options.cardType),
				...(params.context ? {
					c_section: params.context
				} : {}),
				c_sub_section: options?.subSection ?? tasks_v2_const.Analytics.SubSection.TaskCard,
				c_element: options?.element ?? tasks_v2_const.Analytics.Element.AddResult,
				status: options.isSuccess ? tasks_v2_const.Analytics.Status.Success : tasks_v2_const.Analytics.Status.Error,
				...(options.taskId ? {
					p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId)
				} : {})
			});
		}
		sendRoleClick(params) {
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.RoleClick,
				type: tasks_v2_const.Analytics.Type.Task,
				...(params.context ? {
					c_section: params.context
				} : {}),
				...(params.additionalContext ? {
					c_sub_section: params.additionalContext
				} : {}),
				c_element: tasks_v2_const.Analytics.Element.RoleButton,
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.IsDemo(settings.isDemo)
			});
		}
		sendRoleClickType(params, options) {
			const element = {
				view_all: tasks_v2_const.Analytics.Element.RoleAllButton,
				view_role_responsible: tasks_v2_const.Analytics.Element.RoleDoingButton,
				view_role_accomplice: tasks_v2_const.Analytics.Element.RoleHelpButton,
				view_role_auditor: tasks_v2_const.Analytics.Element.RoleWatchingButton,
				view_role_originator: tasks_v2_const.Analytics.Element.RoleAssignedButton
			}[options.role];
			this.#sendData({
				event: tasks_v2_const.Analytics.Event.RoleClickType,
				type: tasks_v2_const.Analytics.Type.Task,
				...(params.context ? {
					c_section: params.context
				} : {}),
				...(params.additionalContext ? {
					c_sub_section: params.additionalContext
				} : {}),
				c_element: element,
				p1: tasks_v2_const.Analytics.Params.IsDemo(settings.isDemo),
				p2: tasks_v2_const.Analytics.Params.FilterEnabled(options.isFilterEnabled)
			});
		}
		sendManualTimeTracking(params, options) {
			this.#sendData({
				category: tasks_v2_const.Analytics.Category.TimeTracking,
				event: tasks_v2_const.Analytics.Event.TimeEntryCreate,
				type: tasks_v2_const.Analytics.Type.Manual,
				...(params.context ? {
					c_section: params.context
				} : {}),
				c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId)
			});
		}
		sendAutoTimeTracking(params, options) {
			this.#sendData({
				category: tasks_v2_const.Analytics.Category.TimeTracking,
				event: tasks_v2_const.Analytics.Event.TimeEntryCreate,
				type: tasks_v2_const.Analytics.Type.Auto,
				...(params.context ? {
					c_section: params.context
				} : {}),
				c_sub_section: tasks_v2_const.Analytics.SubSection.TaskCard,
				status: tasks_v2_const.Analytics.Status.Success,
				p1: tasks_v2_const.Analytics.Params.TaskId(options.taskId)
			});
		}
		#sendData(data) {
			ui_analytics.sendData({
				tool: tasks_v2_const.Analytics.Tool.Tasks,
				category: tasks_v2_const.Analytics.Category.TaskOperations,
				...data
			});
		}
		#getTypeFromCardType(cardType) {
			return {
				[tasks_v2_const.CardType.Compact]: tasks_v2_const.Analytics.Type.TaskMini,
				[tasks_v2_const.CardType.Full]: tasks_v2_const.Analytics.Type.Task
			}[cardType];
		}
	}
	const analytics = new AnalyticsSender();

	exports.AnalyticsSender = AnalyticsSender;
	exports.analytics = analytics;
	exports.settings = settings;

})(this.BX.Tasks.V2.Lib = this.BX.Tasks.V2.Lib || {}, BX, BX.UI.Analytics, BX.UI.Uploader, BX.Tasks.V2.Const);
//# sourceMappingURL=analytics.bundle.js.map
