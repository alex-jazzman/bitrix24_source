import { Extension } from 'main.core';
import { sendData, type AnalyticsOptions } from 'ui.analytics';
import { FileOrigin } from 'ui.uploader.core';

import { Analytics, CardType } from 'tasks.v2.const';
import type { AnalyticsParams } from 'tasks.v2.application.task-card';

export const settings: AnalyticsSettings = Extension.getSettings('tasks.v2.lib.analytics');

export type AnalyticsSettings = {
	userType: string,
	isDemo: boolean,
};

export class AnalyticsSender
{
	sendClickCreate(params: AnalyticsParams, options: {
		collabId: number,
		cardType: string,
		viewersCount: number,
		coexecutorsCount: number,
	}): void
	{
		this.#sendData({
			event: Analytics.Event.ClickCreate,
			type: this.#getTypeFromCardType(options.cardType),
			...(params.context ? { c_section: params.context } : {}),
			...(params.additionalContext ? { c_sub_section: params.additionalContext } : {}),
			...(params.element ? { c_element: params.element } : {}),
			status: Analytics.Status.Success,
			p1: Analytics.Params.IsDemo(settings.isDemo),
			p2: settings.userType,
			p3: Analytics.Params.ViewersCount(options.viewersCount),
			...(options.collabId ? { p4: Analytics.Params.CollabId(options.collabId) } : {}),
			p5: Analytics.Params.CoexecutorsCount(options.coexecutorsCount),
		});
	}

	sendTaskView(params: AnalyticsParams, options: {
		taskId: number,
		viewersCount: number,
		coexecutorsCount: number,
	}): void
	{
		this.#sendData({
			event: Analytics.Event.TaskView,
			type: Analytics.Type.Task,
			...(params.context ? { c_section: params.context } : {}),
			...(params.additionalContext ? { c_sub_section: params.additionalContext } : {}),
			...(params.element ? { c_element: params.element } : {}),
			status: Analytics.Status.Success,
			p1: Analytics.Params.TaskId(options.taskId),
			p3: Analytics.Params.ViewersCount(options.viewersCount),
			p5: Analytics.Params.CoexecutorsCount(options.coexecutorsCount),
		});
	}

	sendTaskComplete(params: AnalyticsParams, options: {
		taskId: number,
	}): void
	{
		this.#sendData({
			event: Analytics.Event.TaskComplete,
			type: Analytics.Type.Task,
			...(params.context ? { c_section: params.context } : {}),
			...(params.additionalContext ? { c_sub_section: params.additionalContext } : {}),
			...(params.element ? { c_element: params.element } : {}),
			status: Analytics.Status.Success,
			p1: Analytics.Params.TaskId(options.taskId),
		});
	}

	sendOpenFullCard(params: AnalyticsParams): void
	{
		this.#sendData({
			event: Analytics.Event.FillTaskFormView,
			type: Analytics.Type.TaskMini,
			...(params.context ? { c_section: params.context } : {}),
			c_sub_section: Analytics.SubSection.FullTaskForm,
			c_element: Analytics.Element.FullFormButton,
			status: Analytics.Status.Success,
			p1: Analytics.Params.IsDemo(settings.isDemo),
		});
	}

	sendAddTask(params: AnalyticsParams, options: {
		event: string,
		isSuccess: boolean,
		collabId: number,
		viewersCount: number,
		coexecutorsCount: number,
		cardType: string,
		taskId: number,
	}): void
	{
		this.#sendData({
			event: options.event ?? Analytics.Event.TaskCreate,
			type: this.#getTypeFromCardType(options.cardType),
			...(params.context ? { c_section: params.context } : {}),
			...(params.additionalContext ? { c_sub_section: params.additionalContext } : {}),
			...(params.element ? { c_element: params.element } : {}),
			status: options.isSuccess ? Analytics.Status.Success : Analytics.Status.Error,
			p1: Analytics.Params.TaskId(options.taskId),
			p2: settings.userType,
			p3: Analytics.Params.ViewersCount(options.viewersCount),
			...(options.collabId ? { p4: Analytics.Params.CollabId(options.collabId) } : {}),
			p5: Analytics.Params.CoexecutorsCount(options.coexecutorsCount),
		});
	}

	sendAddTaskWithCheckList(params: AnalyticsParams, options: {
		isSuccess: boolean,
		collabId: number,
		viewersCount: number,
		checklistCount: number,
		checklistItemsCount: number,
		taskId: number,
		cardType: string,
	}): void
	{
		this.#sendData({
			event: Analytics.Event.TaskCreateWithChecklist,
			type: this.#getTypeFromCardType(options.cardType),
			...(params.context ? { c_section: params.context } : {}),
			...(params.additionalContext ? { c_sub_section: params.additionalContext } : {}),
			...(params.element ? { c_element: params.element } : {}),
			status: Analytics.Status.Success,
			p1: Analytics.Params.TaskId(options.taskId),
			p2: settings.userType,
			p3: Analytics.Params.ViewersCount(options.viewersCount),
			...(options.collabId ? { p4: Analytics.Params.CollabId(options.collabId) } : {}),
			p5: Analytics.Params.ChecklistCount(options.checklistCount, options.checklistItemsCount),
		});
	}

	sendDescription(params: AnalyticsParams, options: {
		hasDescription: boolean,
		hasScroll: boolean,
		cardType: string,
	}): void
	{
		this.#sendData({
			event: Analytics.Event.DescriptionTask,
			type: this.#getTypeFromCardType(options.cardType),
			...(params.context ? { c_section: params.context } : {}),
			c_sub_section: Analytics.SubSection.TaskCard,
			status: Analytics.Status.Success,
			p2: Analytics.Params.HasDescription(options.hasDescription),
			p3: Analytics.Params.HasScroll(options.hasScroll),
		});
	}

	sendAddProject(params: AnalyticsParams, options: {
		taskId: number,
		cardType: string,
		viewersCount: number,
		coexecutorsCount: number,
	}): void
	{
		this.#sendData({
			event: Analytics.Event.AddProject,
			type: this.#getTypeFromCardType(options.cardType),
			...(params.context ? { c_section: params.context } : {}),
			c_sub_section: Analytics.SubSection.TaskCard,
			c_element: Analytics.Element.ProjectButton,
			status: Analytics.Status.Success,
			...(options.taskId ? { p1: Analytics.Params.TaskId(options.taskId) } : {}),
			p3: Analytics.Params.ViewersCount(options.viewersCount),
			p5: Analytics.Params.CoexecutorsCount(options.coexecutorsCount),
		});
	}

	sendDeadlineSet(params: AnalyticsParams, options: {
		cardType: string,
		element: string,
		taskId: number,
		viewersCount: number,
		coexecutorsCount: number,
	}): void
	{
		this.#sendData({
			event: Analytics.Event.DeadlineSet,
			type: this.#getTypeFromCardType(options.cardType),
			...(params.context ? { c_section: params.context } : {}),
			c_sub_section: Analytics.SubSection.TaskCard,
			c_element: options.element,
			status: Analytics.Status.Success,
			...(options.taskId ? { p1: Analytics.Params.TaskId(options.taskId) } : {}),
			p3: Analytics.Params.ViewersCount(options.viewersCount),
			p5: Analytics.Params.CoexecutorsCount(options.coexecutorsCount),
		});
	}

	#sendRoleChange(params: AnalyticsParams, options: {
		cardType: string,
		taskId: number,
		viewersCount: number,
		coexecutorsCount: number,
		event: string,
		element: string,
	})
	{
		this.#sendData({
			event: options.event,
			type: this.#getTypeFromCardType(options.cardType),
			...(params.context ? { c_section: params.context } : {}),
			c_sub_section: Analytics.SubSection.TaskCard,
			c_element: options.element,
			status: Analytics.Status.Success,
			...(options.taskId ? { p1: Analytics.Params.TaskId(options.taskId) } : {}),
			p3: Analytics.Params.ViewersCount(options.viewersCount),
			p5: Analytics.Params.CoexecutorsCount(options.coexecutorsCount),
		});
	}

	sendAssigneeChange(params: AnalyticsParams, options: {
		cardType: string,
		taskId: number,
		viewersCount: number,
		coexecutorsCount: number,
	}): void
	{
		this.#sendRoleChange(params, {
			...options,
			event: Analytics.Event.AssigneeChange,
			element: Analytics.Element.ChangeButton,
		});
	}

	sendAddCoexecutor(params: AnalyticsParams, options: {
		cardType: string,
		taskId: number,
		viewersCount: number,
		coexecutorsCount: number,
	}): void
	{
		this.#sendRoleChange(params, {
			...options,
			event: Analytics.Event.AddCoexecutor,
			element: Analytics.Element.CoexecutorButton,
		});
	}

	sendAddViewer(params: AnalyticsParams, options: {
		cardType: string,
		taskId: number,
		viewersCount: number,
		coexecutorsCount: number,
	}): void
	{
		this.#sendRoleChange(params, {
			...options,
			event: Analytics.Event.AddViewer,
			element: Analytics.Element.ViewerButton,
		});
	}

	sendAttachFile(params: AnalyticsParams, options: {
		cardType: string,
		collabId: number,
		fileOrigin: string,
		fileSize: number,
		fileExtension: string,
		filesCount: number,
	}): void
	{
		const subSection = {
			[FileOrigin.CLIENT]: Analytics.SubSection.MyFiles,
		}[options.fileOrigin] ?? Analytics.SubSection.Bitrix24Files;

		this.#sendData({
			event: Analytics.Event.AttachFile,
			type: this.#getTypeFromCardType(options.cardType),
			...(params.context ? { c_section: params.context } : {}),
			c_sub_section: subSection,
			c_element: Analytics.Element.UploadButton,
			status: Analytics.Status.Success,
			p1: Analytics.Params.FileSize(options.fileSize),
			p2: settings.userType,
			p3: Analytics.Params.FilesCount(options.filesCount),
			...(options.collabId ? { p4: Analytics.Params.CollabId(options.collabId) } : {}),
			p5: Analytics.Params.FileExtension(options.fileExtension),
		});
	}

	sendStatusSummaryAdd(params: AnalyticsParams, options: {
		cardType: string,
		taskId: number,
		element: string,
		subSection: string,
		isSuccess?: boolean,
	})
	{
		this.#sendData({
			event: Analytics.Event.StatusSummaryAdd,
			type: this.#getTypeFromCardType(options.cardType),
			...(params.context ? { c_section: params.context } : {}),
			c_sub_section: options?.subSection ?? Analytics.SubSection.TaskCard,
			c_element: options?.element ?? Analytics.Element.AddResult,
			status: options.isSuccess ? Analytics.Status.Success : Analytics.Status.Error,
			...(options.taskId ? { p1: Analytics.Params.TaskId(options.taskId) } : {}),
		});
	}

	sendRoleClick(params: AnalyticsParams): void
	{
		this.#sendData({
			event: Analytics.Event.RoleClick,
			type: Analytics.Type.Task,
			...(params.context ? { c_section: params.context } : {}),
			...(params.additionalContext ? { c_sub_section: params.additionalContext } : {}),
			c_element: Analytics.Element.RoleButton,
			status: Analytics.Status.Success,
			p1: Analytics.Params.IsDemo(settings.isDemo),
		});
	}

	sendRoleClickType(params: AnalyticsParams, options: {
		role: string,
		isFilterEnabled: boolean,
	}): void
	{
		const element = {
			view_all: Analytics.Element.RoleAllButton,
			view_role_responsible: Analytics.Element.RoleDoingButton,
			view_role_accomplice: Analytics.Element.RoleHelpButton,
			view_role_auditor: Analytics.Element.RoleWatchingButton,
			view_role_originator: Analytics.Element.RoleAssignedButton,
		}[options.role];

		this.#sendData({
			event: Analytics.Event.RoleClickType,
			type: Analytics.Type.Task,
			...(params.context ? { c_section: params.context } : {}),
			...(params.additionalContext ? { c_sub_section: params.additionalContext } : {}),
			c_element: element,
			p1: Analytics.Params.IsDemo(settings.isDemo),
			p2: Analytics.Params.FilterEnabled(options.isFilterEnabled),
		});
	}

	sendManualTimeTracking(params: AnalyticsParams, options: { taskId: number }): void
	{
		this.#sendData({
			category: Analytics.Category.TimeTracking,
			event: Analytics.Event.TimeEntryCreate,
			type: Analytics.Type.Manual,
			...(params.context ? { c_section: params.context } : {}),
			c_sub_section: Analytics.SubSection.TaskCard,
			status: Analytics.Status.Success,
			p1: Analytics.Params.TaskId(options.taskId),
		});
	}

	sendAutoTimeTracking(params: AnalyticsParams, options: { taskId: number }): void
	{
		this.#sendData({
			category: Analytics.Category.TimeTracking,
			event: Analytics.Event.TimeEntryCreate,
			type: Analytics.Type.Auto,
			...(params.context ? { c_section: params.context } : {}),
			c_sub_section: Analytics.SubSection.TaskCard,
			status: Analytics.Status.Success,
			p1: Analytics.Params.TaskId(options.taskId),
		});
	}

	#sendData(data: AnalyticsOptions): void
	{
		sendData({
			tool: Analytics.Tool.Tasks,
			category: Analytics.Category.TaskOperations,
			...data,
		});
	}

	#getTypeFromCardType(cardType: string): string
	{
		return {
			[CardType.Compact]: Analytics.Type.TaskMini,
			[CardType.Full]: Analytics.Type.Task,
		}[cardType];
	}
}

export const analytics = new AnalyticsSender();
