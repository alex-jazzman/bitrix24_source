import { Reflection, Runtime, Loc } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { Notifier } from 'ui.notification-manager';
import { renderSkeleton } from 'ui.system.skeleton';
import { BLine } from 'ui.system.skeleton.vue';
import { BitrixVue, computed } from 'ui.vue3';
import { mapActions, mapGetters } from 'ui.vue3.vuex';

import { analytics } from 'tasks.v2.lib.analytics';
import { Core } from 'tasks.v2.core';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { ahaMoments } from 'tasks.v2.lib.aha-moments';
import { CardType, EventName, Model, TaskField, Option, GroupType, Analytics } from 'tasks.v2.const';
import { FieldList } from 'tasks.v2.component.elements.field-list';
import { ContentResizer } from 'tasks.v2.component.elements.content-resizer';
import { DropZone } from 'tasks.v2.component.drop-zone';
import { entityTextEditor, EntityTextTypes } from 'tasks.v2.component.entity-text';
import { userFieldsSlider } from 'tasks.v2.component.user-fields-slider';

import { DescriptionField } from 'tasks.v2.component.fields.description';
import { Creator, creatorMeta } from 'tasks.v2.component.fields.creator';
import { Responsible, responsibleMeta } from 'tasks.v2.component.fields.responsible';
import { Deadline, deadlineMeta } from 'tasks.v2.component.fields.deadline';
import { Status, statusMeta } from 'tasks.v2.component.fields.status';
import { Files, FilesChip } from 'tasks.v2.component.fields.files';
import { CheckList, CheckListChip } from 'tasks.v2.component.fields.check-list';
import { Group, Stage, Epic, StoryPoints, GroupChip, groupMeta } from 'tasks.v2.component.fields.group';
import { Flow, FlowChip, flowMeta } from 'tasks.v2.component.fields.flow';
import { Accomplices, AccomplicesChip, accomplicesMeta } from 'tasks.v2.component.fields.accomplices';
import { Auditors, AuditorsChip, auditorsMeta } from 'tasks.v2.component.fields.auditors';
import { Tags, TagsChip, tagsMeta } from 'tasks.v2.component.fields.tags';
import { Crm, CrmChip, crmMeta } from 'tasks.v2.component.fields.crm';
import { DatePlan, DatePlanChip } from 'tasks.v2.component.fields.date-plan';
import { TimeTracking, TimeTrackingChip, timeTrackingMeta } from 'tasks.v2.component.fields.time-tracking';
import { SubTasks, SubTasksChip } from 'tasks.v2.component.fields.sub-tasks';
import { ParentTask, ParentTaskChip } from 'tasks.v2.component.fields.parent-task';
import { RelatedTasks, RelatedTasksChip } from 'tasks.v2.component.fields.related-tasks';
import { Gantt, GanttChip, ganttMeta } from 'tasks.v2.component.fields.gantt';
import { Results, ResultsChip } from 'tasks.v2.component.fields.results';
import { Reminders, RemindersChip } from 'tasks.v2.component.fields.reminders';
import { Replication, ReplicationChip } from 'tasks.v2.component.fields.replication';
import { Email, EmailFrom, EmailDate, EmailChip, emailMeta } from 'tasks.v2.component.fields.email';
import { UserFields, UserFieldsChip, userFieldsManager } from 'tasks.v2.component.fields.user-fields';
import { Placements, PlacementsChip } from 'tasks.v2.component.fields.placements';
import { CreatedDate, createdDateMeta } from 'tasks.v2.component.fields.created-date';

import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { templateService } from 'tasks.v2.provider.service.template-service';
import { deadlineService } from 'tasks.v2.provider.service.deadline-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { GroupModel } from 'tasks.v2.model.groups';
import type { CheckListModel } from 'tasks.v2.model.check-list';
import type { SheetBindProps } from 'tasks.v2.component.elements.bottom-sheet';
import type { AppField, AppChip } from 'tasks.v2.application.task-card';
import type { UserFieldScheme } from 'tasks.v2.model.interface';

import { TaskHeader } from './task-header/task-header';
import { TaskSettingsHint } from './aha/task-settings-hint';
import { Chat } from './chat/chat';
import { Chips } from './chips/chips';
import { FooterCreate } from './footer-create/footer-create';
import { FooterEdit } from './footer-edit/footer-edit';
import { Placeholder } from './placeholder/placeholder';
import './app.css';

const UserOptions = Reflection.namespace('BX.userOptions');

// @vue/component
export const App = {
	name: 'TaskFullCard',
	components: {
		TaskHeader,
		DescriptionField,
		Files,
		CheckList,
		DatePlan,
		SubTasks,
		ParentTask,
		RelatedTasks,
		Gantt,
		Results,
		Placements,
		Reminders,
		Replication,
		FieldList,
		Chat,
		FooterCreate,
		FooterEdit,
		Placeholder,
		DropZone,
		Chips,
		ContentResizer,
		TaskSettingsHint,
		Email,
		EmailFrom,
		EmailDate,
		UserFields,
		CreatedDate,
	},
	provide(): Object
	{
		return {
			settings: Core.getParams(),
			analytics: this.analytics,
			cardType: CardType.Full,
			/** @type { TaskModel } */
			task: computed((): TaskModel => taskService.getStoreTask(this.taskId)),
			/** @type { number | string } */
			taskId: computed((): number | string => this.taskId),
			/** @type { boolean } */
			isEdit: computed((): boolean => idUtils.isReal(this.taskId)),
			/** @type { boolean } */
			isTemplate: computed((): boolean => idUtils.isTemplate(this.taskId)),
		};
	},
	props: {
		id: {
			type: [Number, String],
			required: true,
		},
		initialTask: {
			/** @type TaskModel */
			type: Object,
			required: true,
		},
		analytics: {
			type: Object,
			default: () => ({}),
		},
	},
	setup(): Object
	{
		return {
			EntityTextTypes,
			EntityTypes,
			TaskField,
		};
	},
	data(): Object
	{
		return {
			taskId: this.id,
			isFilesSheetShown: false,
			isDescriptionSheetShown: false,
			isCheckListSheetShown: false,
			isDatePlanSheetShown: false,
			isTimeTrackingSheetShown: false,
			isTimeTrackingChipSheetShown: false,
			isResultListSheetShown: false,
			isResultEditorSheetShown: false,
			isResultChipSheetShown: false,
			isReminderSheetShown: false,
			isRemindersSheetShown: false,
			isReplicationSheetShown: false,
			isReplicationHistorySheetShown: false,
			isPrimaryFieldsHovered: false,
			isSettingsPopupShown: false,
			isTaskSettingsHintShown: false,
			checkListId: 0,
			files: fileService.get(this.id).getFiles(),
			isLoading: true,
			creationError: false,
			taskInitial: null,
			placeholderImgUrl: null,
		};
	},
	computed: {
		...mapGetters({
			defaultDeadlineTs: `${Model.Interface}/defaultDeadlineTs`,
			fullCardWidth: `${Model.Interface}/fullCardWidth`,
			stateFlags: `${Model.Interface}/stateFlags`,
			taskUserFieldScheme: `${Model.Interface}/taskUserFieldScheme`,
			templateUserFieldScheme: `${Model.Interface}/templateUserFieldScheme`,
		}),
		task(): TaskModel
		{
			return taskService.getStoreTask(this.taskId);
		},
		group(): GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		checklist(): CheckListModel[]
		{
			if (!this.task.checklist)
			{
				return [];
			}

			return this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
		},
		isEdit(): boolean
		{
			return idUtils.isReal(this.taskId);
		},
		isTemplate(): boolean
		{
			return idUtils.isTemplate(this.taskId);
		},
		isCreator(): boolean
		{
			return this.currentUserId === this.task.creatorId;
		},
		isAdmin(): boolean
		{
			return Core.getParams().rights.user.admin;
		},
		isFlowFilledOnAdd(): boolean
		{
			return this.task.flowId > 0 && !this.isEdit;
		},
		hasManyResponsibleUsers(): boolean
		{
			return !this.task.isForNewUser && this.task.responsibleIds.length > 1;
		},
		canChangeDeadline(): boolean
		{
			if (!this.isEdit)
			{
				return true;
			}

			return (
				this.task.rights.deadline
				&& !this.isFlowFilledOnAdd
			);
		},
		canChangeDeadlineWithoutLimitation(): boolean
		{
			return (
				!this.isEdit
				|| this.isCreator
				|| this.task.rights.edit
				|| this.isAdmin
			);
		},
		isPartiallyLoaded(): boolean
		{
			return this.$store.getters[`${Model.Tasks}/isPartiallyLoaded`](this.taskId);
		},
		userFieldScheme(): UserFieldScheme[]
		{
			return this.isTemplate
				? this.templateUserFieldScheme
				: this.taskUserFieldScheme
			;
		},
		defaultRequireResult(): boolean
		{
			return this.isTemplate ? false : (this.stateFlags.defaultRequireResult ?? false);
		},
		// eslint-disable-next-line max-lines-per-function,sonarjs/cognitive-complexity
		fields(): AppField[]
		{
			return [
				{
					title: creatorMeta.title,
					component: Creator,
				},
				{
					title: responsibleMeta.getTitle(this.hasManyResponsibleUsers),
					hint: this.hasManyResponsibleUsers ? responsibleMeta.hint : null,
					component: Responsible,
					props: {
						taskId: this.taskId,
					},
				},
				{
					title: deadlineMeta.title,
					component: Deadline,
					props: {
						taskId: this.taskId,
						isTemplate: this.isTemplate,
						isHovered: this.isTaskSettingsHintShown,
					},
					events: {
						isSettingsPopupShown: (value) => {
							this.isSettingsPopupShown = value;
						},
					},
				},
				{
					title: timeTrackingMeta.title,
					component: TimeTracking,
					props: {
						isSheetShown: this.isTimeTrackingSheetShown,
						sheetBindProps: this.sheetBindProps,
					},
					events: {
						'update:isSheetShown': (isShown: boolean): void => {
							this.isTimeTrackingSheetShown = isShown;
						},
					},
				},
				!this.isTemplate && {
					title: statusMeta.title,
					component: Status,
					withSeparator: true,
				},
				!this.isTemplate && {
					title: createdDateMeta.title,
					component: CreatedDate,
				},
				{
					title: emailMeta.title,
					component: Email,
					printIgnore: !this.task.email,
					chip: {
						component: EmailChip,
						isEnabled: this.wasFilled(TaskField.Email),
					},
				},
				{
					title: emailMeta.fromTitle,
					component: EmailFrom,
					withSeparator: true,
					printIgnore: !this.task.email,
				},
				{
					title: emailMeta.dateTitle,
					component: EmailDate,
					printIgnore: !this.task.email,
				},
				!this.isTemplate && {
					chip: {
						component: ResultsChip,
						props: {
							isSheetShown: this.isResultChipSheetShown,
							sheetBindProps: this.sheetBindProps,
						},
						events: {
							'update:isSheetShown': (isShown: boolean): void => {
								this.isResultChipSheetShown = isShown;
							},
						},
					},
				},
				Core.getParams().features.disk && {
					chip: {
						component: FilesChip,
						props: {
							taskId: this.taskId,
						},
						isEnabled:
							this.wasFilled(TaskField.Files)
							|| this.files.length > 0
							|| this.task.rights.attachFile
							|| this.task.rights.edit,
					},
				},
				{
					chip: {
						component: BitrixVue.defineAsyncComponent(
							'tasks.v2.component.fields.comment-files',
							'CommentFilesChip',
							{
								delay: 0,
								loadingComponent: {
									components: { BLine },
									template: '<BLine :width="212" :height="32"/>',
								},
							},
						),
						isEnabled: this.task.containsCommentFiles === true,
					},
				},
				{
					chip: {
						component: CheckListChip,
						events: {
							showCheckList: this.openCheckList,
						},
						isEnabled: this.task.rights.checklistSave,
					},
				},
				Core.getParams().features.isProjectsEnabled && {
					title: groupMeta.getTitle(this.task.groupId),
					component: Group,
					chip: {
						component: GroupChip,
						isEnabled: this.wasFilled(TaskField.Group) || this.task.rights.edit,
					},
					printIgnore: !this.task.groupId,
				},
				{
					title: accomplicesMeta.title,
					component: Accomplices,
					chip: {
						component: AccomplicesChip,
						isEnabled: this.wasFilled(TaskField.Accomplices) || this.task.rights.changeAccomplices,
					},
					printIgnore: !this.task.accomplicesIds || this.task.accomplicesIds.length === 0,
				},
				{
					title: auditorsMeta.title,
					component: Auditors,
					chip: {
						component: AuditorsChip,
						isEnabled: this.wasFilled(TaskField.Auditors) || this.task.rights.addAuditors,
					},
					withSeparator: this.wasFilled(TaskField.Accomplices),
					printIgnore: !this.task.auditorsIds || this.task.auditorsIds.length === 0,
				},
				!this.isTemplate && {
					chip: {
						component: PlacementsChip,
						isEnabled: this.isEdit && this.wasFilled(TaskField.Placements),
					},
				},
				!this.isTemplate && Core.getParams().features.isFlowEnabled && {
					title: flowMeta.title,
					component: Flow,
					chip: {
						component: FlowChip,
						isEnabled: this.wasFilled(TaskField.Flow) || this.task.rights.edit,
					},
					withSeparator: true,
					printIgnore: !this.task.flowId,
				},
				Core.getParams().features.isProjectsEnabled && {
					title: groupMeta.stageTitle,
					component: Stage,
				},
				Core.getParams().features.isProjectsEnabled && {
					title: groupMeta.epicTitle,
					component: Epic,
				},
				Core.getParams().features.isProjectsEnabled && {
					title: groupMeta.storyPointsTitle,
					component: StoryPoints,
				},
				{
					title: tagsMeta.title,
					component: Tags,
					chip: {
						component: TagsChip,
						isEnabled: this.wasFilled(TaskField.Tags) || this.task.rights.edit,
					},
					printIgnore: !this.task.tags || this.task.tags.length === 0,
				},
				!this.isTemplate && {
					chip: {
						component: RemindersChip,
						props: {
							isSheetShown: this.isReminderSheetShown,
							sheetBindProps: this.sheetBindProps,
						},
						events: {
							'update:isSheetShown': (isShown: boolean): void => {
								this.isReminderSheetShown = isShown;
							},
						},
						isEnabled: this.wasFilled(TaskField.Reminders) || this.task.rights.reminder,
					},
				},
				Core.getParams().features.crm && {
					title: crmMeta.title,
					component: Crm,
					chip: {
						component: CrmChip,
						collapsed: true,
						isEnabled: this.wasFilled(TaskField.Crm) || this.task.rights.edit,
					},
					withSeparator: this.wasFilled(TaskField.Group) || this.wasFilled(TaskField.Flow),
					printIgnore: !this.task.crmItemIds || this.task.crmItemIds.length === 0,
				},
				{
					chip: {
						component: ParentTaskChip,
						collapsed: true,
						isEnabled: this.wasFilled(TaskField.Parent) || this.task.rights.edit,
					},
					printIgnore: !this.task.parentId,
				},
				{
					chip: {
						component: SubTasksChip,
						collapsed: true,
						isEnabled: this.wasFilled(TaskField.SubTasks) || this.task.rights.createSubtask || !this.isEdit,
					},
					printIgnore: !this.task.subTaskIds || this.task.subTaskIds.length === 0,
				},
				{
					chip: {
						component: RelatedTasksChip,
						collapsed: true,
						isEnabled: this.wasFilled(TaskField.RelatedTasks) || this.task.rights.edit,
					},
					printIgnore: !this.task.relatedTaskIds || this.task.relatedTaskIds.length === 0,
				},
				!this.isTemplate && {
					chip: {
						component: GanttChip,
						collapsed: true,
						isEnabled: this.wasFilled(TaskField.Gantt) || this.task.rights[ganttMeta.right],
					},
					printIgnore: !this.task.ganttTaskIds || this.task.ganttTaskIds.length === 0,
				},
				{
					chip: {
						component: DatePlanChip,
						collapsed: true,
						isEnabled: this.wasFilled(TaskField.DatePlan) || this.task.rights.edit,
						props: {
							isSheetShown: this.isDatePlanSheetShown,
							sheetBindProps: this.sheetBindProps,
						},
						events: {
							'update:isSheetShown': (isShown: boolean): void => {
								this.isDatePlanSheetShown = isShown;
							},
						},
					},
				},
				this.isTemplate && {
					chip: {
						component: ReplicationChip,
						props: {
							isSheetShown: this.isReplicationSheetShown,
							sheetBindProps: this.sheetBindProps,
						},
						isEnabled: this.wasFilled(TaskField.Replication) || this.task.rights.edit,
						events: {
							'update:isSheetShown': (isShown: boolean): void => {
								this.isReplicationSheetShown = isShown;
							},
						},
					},
				},
				{
					chip: {
						component: TimeTrackingChip,
						collapsed: true,
						isEnabled: this.task.rights.edit || this.task.rights.elapsedTime,
						props: {
							isSheetShown: this.isTimeTrackingChipSheetShown,
							sheetBindProps: this.sheetBindProps,
						},
						events: {
							'update:isSheetShown': (isShown: boolean): void => {
								this.isTimeTrackingChipSheetShown = isShown;
							},
						},
					},
				},
				{
					chip: {
						component: UserFieldsChip,
						collapsed: true,
						isEnabled: this.shouldShowUserFieldsChip,
						events: {
							open: this.openUserFieldsHandler,
						},
					},
				},
			].filter((field) => field);
		},
		sheetBindProps(): SheetBindProps
		{
			return {
				getBindElement: () => this.$refs.title,
				getTargetContainer: () => this.$refs.main,
			};
		},
		primaryFields(): AppField[]
		{
			return this.getFields(new WeakMap([
				[Creator, true],
				[Responsible, true],
				[Deadline, true],
				[TimeTracking, (
					this.task.allowsTimeTracking
					|| (
						this.task.rights.elapsedTime
						&& this.task.numberOfElapsedTimes
					)
				)],
				[Status, this.isEdit],
				[CreatedDate, this.isEdit],
			]));
		},
		projectFields(): AppField[]
		{
			const isScrum = this.group?.type === GroupType.Scrum;

			return this.getFields(new WeakMap([
				[Group, this.wasFilled(TaskField.Group)],
				[Flow, this.wasFilled(TaskField.Flow)],
				[Stage, !this.isTemplate && this.isEdit && this.group?.id > 0 && (this.task.stageId !== 0 || !isScrum)],
				[Epic, !this.isTemplate && isScrum],
				[StoryPoints, !this.isTemplate && isScrum],
				[Crm, this.wasFilled(TaskField.Crm)],
			]));
		},
		participantsFields(): AppField[]
		{
			return this.getFields(new WeakMap([
				[Accomplices, this.wasFilled(TaskField.Accomplices)],
				[Auditors, this.wasFilled(TaskField.Auditors)],
			]));
		},
		tagsFields(): AppField[]
		{
			return this.getFields(new WeakMap([
				[Tags, this.wasFilled(TaskField.Tags)],
			]));
		},
		emailFields(): Object[]
		{
			return this.getFields(new WeakMap([
				[Email, this.wasFilled(TaskField.Email)],
				[EmailFrom, this.wasFilled(TaskField.Email) && this.task.email.from],
				[EmailDate, this.wasFilled(TaskField.Email) && this.task.email.dateTs],
			]));
		},
		chips(): AppChip[]
		{
			return this.fields.filter(({ chip }) => chip && chip.isEnabled !== false).map(({ chip }) => chip);
		},
		isBottomSheetShown(): boolean
		{
			return this.isDescriptionSheetShown
				|| this.isFilesSheetShown
				|| this.isCheckListSheetShown
				|| this.isDatePlanSheetShown
				|| this.isTimeTrackingSheetShown
				|| this.isTimeTrackingChipSheetShown
				|| this.isResultListSheetShown
				|| this.isResultEditorSheetShown
				|| this.isResultChipSheetShown
				|| this.isReminderSheetShown
				|| this.isRemindersSheetShown
				|| this.isReplicationSheetShown
				|| this.isReplicationHistorySheetShown;
		},
		isDiskModuleInstalled(): boolean
		{
			return Core.getParams().features.disk;
		},
		taskSettingsBindElement(): ?HTMLElement
		{
			if (this.isPrimaryFieldsHovered)
			{
				return this.$refs.main.querySelector('[data-settings-label]');
			}

			return null;
		},
		isCopyMode(): boolean
		{
			return this.initialTask?.copiedFromId && !idUtils.isReal(this.task?.id);
		},
		placeholderOptions(): any
		{
			return {
				imgSrc: this.iconUrl,
				head: Loc.getMessage('TASKS_V2_TASK_FULL_CARD_PLACEHOLDER_TITLE_NO_RIGHTS'),
			};
		},
		isReplicateTemplate(): boolean
		{
			return this.isTemplate && (this.task?.replicate === true);
		},
		hasFilledUserFields(): boolean
		{
			return userFieldsManager.hasFilledUserFields(this.task?.userFields || [], this.userFieldScheme);
		},
		hasRequiredUserFields(): boolean
		{
			return userFieldsManager.hasMandatoryUserFields(this.userFieldScheme);
		},
		shouldShowUserFields(): boolean
		{
			return this.isEdit
				? this.hasFilledUserFields
				: this.hasRequiredUserFields || this.hasFilledUserFields
			;
		},
		shouldShowUserFieldsChip(): boolean
		{
			if (this.isAdmin)
			{
				return true;
			}

			return (this.task.rights.edit && this.userFieldScheme.length > 0) || this.hasFilledUserFields;
		},
		shouldIgnoreResultPrint(): boolean
		{
			return this.task.results.length === 0;
		},
		shouldIgnoreCheckListPrint(): boolean
		{
			return this.checklist.length === 0;
		},
		shouldIgnoreSubTasksPrint(): boolean
		{
			return this.task.subTaskIds.length === 0;
		},
		shouldIgnoreParentTaskPrint(): boolean
		{
			return !this.task.parentId;
		},
		shouldIgnoreRelatedTasksPrint(): boolean
		{
			return this.task.relatedTaskIds.length === 0;
		},
		shouldIgnoreGanttPrint(): boolean
		{
			return this.task.ganttTaskIds.length === 0;
		},
		shouldIgnoreProjectFieldsPrint(): boolean
		{
			return this.projectFields.filter((field) => !field.printIgnore).length === 0;
		},
		shouldIgnoreEmailPrint(): boolean
		{
			return !this.task.email;
		},
		shouldIgnoreTagsPrint(): boolean
		{
			return this.task.tags.length === 0;
		},
		shouldIgnoreParticipantsPrint(): boolean
		{
			return this.participantsFields.filter((field) => !field.printIgnore).length === 0;
		},
		shouldIgnoreDatePlanPrint(): boolean
		{
			return !this.task.startPlanTs && !this.task.endPlanTs;
		},
	},
	watch: {
		async isLoading(): Promise<void>
		{
			await this.$nextTick();

			this.renderSkeleton();
		},
		async isPrimaryFieldsHovered(isHovered: boolean): Promise<void>
		{
			if (isHovered && ahaMoments.shouldShow(Option.AhaTaskSettingsMessagePopup))
			{
				setTimeout(this.showTaskSettingsHint, 500);
			}
		},
		'task.templateId': function(templateId: number, previousTemplateId: number): void
		{
			if (this.taskInitial && !this.isEdit && templateId && templateId !== previousTemplateId)
			{
				void this.handleTemplate(templateId);
			}
		},
	},
	async created(): Promise<void>
	{
		if (!this.isEdit && !this.task)
		{
			await taskService.insertStoreTask({
				...this.initialTask,
				id: this.taskId,
				creatorId: Core.getParams().currentUser.id,
				responsibleIds: [Core.getParams().currentUser.id],
				deadlineTs: this.initialTask.deadlineTs ?? this.defaultDeadlineTs,
				needsControl: this.stateFlags.needsControl ?? null,
				matchesWorkTime: this.stateFlags.matchesWorkTime ?? null,
				allowsTimeTracking: this.stateFlags.allowsTimeTracking ?? null,
				requireResult: Core.getParams().restrictions.requiredResult.available && this.defaultRequireResult,
			});

			if (this.initialTask.copiedFromId)
			{
				await taskService.getCopy(this.initialTask.copiedFromId, this.taskId);
			}

			if (this.initialTask.templateId)
			{
				await templateService.getTask(this.initialTask.templateId, this.taskId);
			}

			analytics.sendClickCreate(this.analytics, {
				collabId: this.group?.type === GroupType.Collab ? this.group.id : null,
				cardType: CardType.Full,
				viewersCount: this.initialTask?.auditorsIds?.length ?? 0,
				coexecutorsCount: this.initialTask?.accomplicesIds?.length ?? 0,
			});
		}

		await this.$store.dispatch(`${Model.Tasks}/clearFieldsFilled`, this.taskId);

		if (this.isEdit && (!this.task || this.isPartiallyLoaded))
		{
			await taskService.get(this.taskId);
		}

		if (!this.task)
		{
			this.isLoading = false;

			return;
		}

		await fileService.get(this.taskId).list(this.task.fileIds);

		this.isLoading = false;

		if (!this.isTemplate && !this.canChangeDeadlineWithoutLimitation && this.task.maxDeadlineChanges)
		{
			void deadlineService.updateDeadlineChangeCount(this.task.id);
		}

		entityTextEditor.get(
			this.taskId,
			EntityTextTypes.Task,
			{ content: this.task?.description },
		);

		this.taskInitial = this.task;

		if (this.isEdit)
		{
			analytics.sendTaskView(this.analytics, {
				taskId: this.task?.id,
				viewersCount: this.task?.auditorsIds?.length ?? 0,
				coexecutorsCount: this.task?.accomplicesIds?.length ?? 0,
			});
		}

		await Runtime.loadExtension(Core.getParams().externalExtensions);

		EventEmitter.emit(EventName.FullCardInit, { task: this.task });
	},
	async mounted(): void
	{
		EventEmitter.subscribe(EventName.FullCardHasChanges, this.handleHasChanges);

		this.renderSkeleton();
		this.iconUrl = (await import('../images/marshmallow_sad_pink_with_orange_lock.png')).default;
	},
	unmounted(): void
	{
		EventEmitter.unsubscribe(EventName.FullCardHasChanges, this.handleHasChanges);

		if (!this.isEdit)
		{
			void this.$store.dispatch(`${Model.Tasks}/delete`, this.taskId);
			fileService.delete(this.taskId);
			entityTextEditor.delete(this.taskId);
		}
	},
	methods: {
		...mapActions(Model.Interface, [
			'updateFullCardWidth',
		]),
		getFields(map: WeakMap): AppField[]
		{
			return this.fields.filter(({ component }) => map.get(component));
		},
		wasFilled(fieldId: string): boolean
		{
			return Boolean(this.task.filledFields[fieldId]);
		},
		async addTask(): Promise<void>
		{
			const checklists = this.checklist;

			const [id, error] = await taskService.add(this.task);

			if (!id)
			{
				this.handleCreationError(error);

				return;
			}

			this.taskId = id;

			fileService.replace(this.id, id);

			entityTextEditor.replace(this.id, id);

			const isSuccess = Boolean(id);

			this.sendAddTaskAnalytics(isSuccess, checklists);

			this.fireLegacyGlobalEvent();
		},
		async copyTask(event: Object): Promise<void>
		{
			const { withSubTasks } = event;

			const [id, error] = await taskService.copy(this.task, withSubTasks);

			if (!id)
			{
				this.handleCreationError(error);

				return;
			}

			this.taskId = id;

			fileService.delete(this.id);
			await fileService.get(this.taskId).list(this.task.fileIds);

			entityTextEditor.replace(this.id, id);

			this.fireLegacyGlobalEvent();
		},
		async createFromTemplate(event: Object): Promise<void>
		{
			const { withSubTasks } = event;

			const [id, error] = await templateService.addTask(
				this.task.templateId,
				this.task,
				withSubTasks,
			);

			if (!id)
			{
				this.handleCreationError(error);

				this.sendAddTaskFromTemplateAnalytics(false);

				return;
			}

			this.taskId = id;

			this.sendAddTaskFromTemplateAnalytics(true);

			fileService.delete(this.id);
			await fileService.get(this.taskId).list(this.task.fileIds);

			entityTextEditor.replace(this.id, id);

			this.fireLegacyGlobalEvent();
		},
		handleCreationError(error: Error): void
		{
			this.creationError = true;

			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-add-error',
				text: error?.message,
			});
		},
		fireLegacyGlobalEvent(): void
		{
			EventEmitter.emit(EventName.LegacyTasksTaskEvent, new BaseEvent({
				data: this.taskId,
				compatData: [
					'ADD',
					{
						task: { ID: this.taskId },
						taskUgly: { id: this.taskId },
						options: {},
					},
				],
			}));
		},
		openCheckList(checkListId?: number): void
		{
			this.checkListId = checkListId;
			this.isCheckListSheetShown = true;
		},
		closeCheckList(checkListId?: number): void
		{
			this.checkListId = checkListId;
			this.isCheckListSheetShown = false;
		},
		openUserFieldsHandler(): void
		{
			void userFieldsSlider.open({
				taskId: this.taskId,
				isTemplate: this.isTemplate,
				templateId: this.isEdit ? null : this.task?.templateId,
				copiedFromId: this.isEdit ? null : this.task?.copiedFromId,
			});
		},
		handleCloseTaskSettingsHint(): void
		{
			this.isTaskSettingsHintShown = false;
			ahaMoments.setInactive(Option.AhaTaskSettingsMessagePopup);

			if (ahaMoments.shouldShow(Option.AhaTaskSettingsMessagePopup))
			{
				ahaMoments.setShown(Option.AhaTaskSettingsMessagePopup);
			}
		},
		handleEndResize(newWidth: number): void
		{
			const cardWidth = this.validateCardWidth(newWidth);

			void this.updateFullCardWidth(cardWidth);

			UserOptions.delay = 100;
			UserOptions.save('tasks', 'fullCard', 'cardWidth', cardWidth);
		},
		validateCardWidth(width: ?number): ?number
		{
			return Number.isNaN(parseInt(width, 10)) ? null : parseInt(width, 10);
		},
		handleHasChanges(event: BaseEvent): { taskId: number | string, hasChanges: boolean }
		{
			const handleResult = { taskId: this.taskId };

			if (this.isEdit || event.getData().taskId !== this.taskId)
			{
				handleResult.hasChanges = false;

				return handleResult;
			}

			handleResult.hasChanges = JSON.stringify(this.task) !== JSON.stringify(this.taskInitial);

			return handleResult;
		},
		tryClose(): void
		{
			EventEmitter.emit(EventName.TryCloseFullCard, { taskId: this.taskId });
		},
		showTaskSettingsHint(): void
		{
			if (
				this.isSettingsPopupShown === false
				&& this.taskSettingsBindElement
			)
			{
				ahaMoments.setActive(Option.AhaTaskSettingsMessagePopup);
				this.isTaskSettingsHintShown = true;
			}
		},
		async handleTemplate(templateId: number): Promise<void>
		{
			this.isLoading = true;

			await templateService.getTask(templateId, this.taskId);

			await fileService.get(this.taskId).list(this.task?.fileIds);

			await this.$store.dispatch(`${Model.Tasks}/clearFieldsFilled`, this.taskId);

			this.isLoading = false;
		},
		renderSkeleton(): void
		{
			if (this.$refs.skeleton)
			{
				const skeletonPath = '/bitrix/js/tasks/v2/application/task-card/src/skeleton-full.html?v=1';
				const templateSkeletonPath = '/bitrix/js/tasks/v2/application/task-card/src/skeleton-template.html?v=1';

				void renderSkeleton(this.isTemplate ? templateSkeletonPath : skeletonPath, this.$refs.skeleton);
			}
		},
		sendAddTaskAnalytics(isSuccess: boolean, checklists: CheckListModel[]): void
		{
			const collabId = this.group?.type === GroupType.Collab ? this.group.id : null;
			const viewersCount = this.task.auditorsIds.length;
			const coexecutorsCount = this.task.accomplicesIds.length;

			if (this.task.templateId)
			{
				this.sendAddTaskFromTemplateAnalytics(isSuccess);
			}
			else if (this.task.parentId)
			{
				analytics.sendAddTask(this.analytics, {
					isSuccess,
					collabId,
					viewersCount,
					coexecutorsCount,
					event: Analytics.Event.SubTaskAdd,
					cardType: CardType.Full,
					taskId: this.taskId,
				});
			}
			else if (checklists.length > 0)
			{
				const checklistCount = checklists.filter(({ parentId }) => parentId === 0).length;
				const checklistItemsCount = checklists.filter(({ parentId }) => parentId !== 0).length;

				analytics.sendAddTaskWithCheckList(this.analytics, {
					isSuccess,
					collabId,
					viewersCount,
					checklistCount,
					checklistItemsCount,
					cardType: CardType.Full,
					taskId: this.taskId,
				});
			}
			else
			{
				analytics.sendAddTask(this.analytics, {
					isSuccess,
					collabId,
					viewersCount,
					coexecutorsCount,
					event: Analytics.Event.TaskCreate,
					cardType: CardType.Full,
					taskId: this.taskId,
				});
			}
		},
		sendAddTaskFromTemplateAnalytics(isSuccess: boolean): void
		{
			const collabId = this.group?.type === GroupType.Collab ? this.group.id : null;
			const viewersCount = this.task.auditorsIds.length;
			const coexecutorsCount = this.task.accomplicesIds.length;

			analytics.sendAddTask(this.analytics, {
				isSuccess,
				collabId,
				viewersCount,
				coexecutorsCount,
				event: Analytics.Event.PatternTaskCreate,
				cardType: CardType.Full,
				taskId: this.taskId,
			});
		},
	},
	template: `
		<div
			class="tasks-full-card print-fit-height"
			:class="{ '--blur': isDescriptionSheetShown }"
			:data-task-id="taskId"
			data-task-full
		>
			<template v-if="task && !isPartiallyLoaded && !isLoading">
				<div
					ref="main"
					class="tasks-full-card-main print-background-white"
					:class="{ '--overlay': isBottomSheetShown }"
					:style="{ width: (isTemplate ? '100%' : fullCardWidth + 'px') }"
				>
					<div class="tasks-full-card-content" :data-task-card-scroll="taskId" ref="scrollContent">
						<div ref="title">
							<TaskHeader/>
						</div>
						<CheckList
							:checkListId
							:isShown="isCheckListSheetShown"
							:sheetBindProps
							@close="closeCheckList"
						/>
						<DescriptionField
							v-model:isSheetShown="isDescriptionSheetShown"
							:taskId
							:sheetBindProps
							ref="description"
						/>
						<div class="tasks-full-card-fields">
							<div
								class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
								data-field-container
								@mouseover="isPrimaryFieldsHovered = true"
								@mouseleave="isPrimaryFieldsHovered = false"
							>
								<FieldList :fields="primaryFields"/>
							</div>
							<div class="tasks-full-card-chips-fields">
								<div
									v-if="emailFields.length > 0"
									class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
									:class="{ 'print-ignore': shouldIgnoreEmailPrint }"
									data-field-container
								>
									<FieldList :fields="emailFields"/>
								</div>
								<div
									v-if="!isTemplate && (task.requireResult || wasFilled(TaskField.Results))"
									class="tasks-full-card-field-container  --custom"
									:class="{ 
										'print-ignore': shouldIgnoreResultPrint,
										'print-before-divider-accent': !shouldIgnoreResultPrint,
									}"
								>
									<Results
										v-model:isSheetShown="isResultEditorSheetShown"
										v-model:isListSheetShown="isResultListSheetShown"
										:sheetBindProps
									/>
								</div>
								<div
									v-if="isDiskModuleInstalled && (files.length > 0 || wasFilled(TaskField.Files))"
									class="tasks-full-card-field-container --small-vertical-padding print-ignore"
									data-field-container
								>
									<Files v-model:isSheetShown="isFilesSheetShown" :taskId :sheetBindProps/>
								</div>
								<div
									v-if="wasFilled(TaskField.CheckList)"
									class="tasks-full-card-field-container print-before-divider-accent print-padding-bottom-inset-md --custom"
									:class="{ 'print-ignore': shouldIgnoreCheckListPrint }"
								>
									<CheckList
										isPreview
										:isComponentShown="!isCheckListSheetShown"
										:checkListId
										@open="openCheckList"
									/>
								</div>
								<div
									v-if="projectFields.length > 0"
									class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
									:class="{ 'print-ignore': shouldIgnoreProjectFieldsPrint }"
									data-field-container
								>
									<FieldList :fields="projectFields"/>
								</div>
								<div
									v-if="participantsFields.length > 0"
									class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
									:class="{ 'print-ignore': shouldIgnoreParticipantsPrint }"
									data-field-container
								>
									<FieldList
										:fields="participantsFields"
										:useSeparator="participantsFields.length > 1"
									/>
								</div>
								<div
									v-if="!isTemplate && isEdit && wasFilled(TaskField.Placements)"
									class="tasks-full-card-field-container --custom print-ignore"
								>
									<Placements/>
								</div>
								<div
									v-if="!isTemplate && wasFilled(TaskField.Reminders)"
									class="tasks-full-card-field-container --custom print-ignore"
									data-field-container
								>
									<Reminders
										v-model:isSheetShown="isReminderSheetShown"
										v-model:isListSheetShown="isRemindersSheetShown"
										:sheetBindProps
									/>
								</div>
								<div
									v-if="tagsFields.length > 0"
									class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
									:class="{ 'print-ignore': shouldIgnoreTagsPrint }"
									data-field-container
								>
									<FieldList :fields="tagsFields"/>
								</div>
								<div
									v-if="wasFilled(TaskField.Parent)"
									class="tasks-full-card-field-container print-before-divider-accent --custom"
									:class="{ 'print-ignore': shouldIgnoreParentTaskPrint }"
									data-field-container
								>
									<ParentTask/>
								</div>
								<div
									v-if="wasFilled(TaskField.SubTasks) && !isCopyMode"
									class="tasks-full-card-field-container print-before-divider-accent --custom --task-list print-background-white"
									:class="{ 'print-ignore': shouldIgnoreSubTasksPrint }"
									data-field-container
								>
									<SubTasks/>
								</div>
								<div
									v-if="wasFilled(TaskField.RelatedTasks)"
									class="tasks-full-card-field-container print-before-divider-accent --custom --task-list print-background-white"
									:class="{ 'print-ignore': shouldIgnoreRelatedTasksPrint }"
									data-field-container
								>
									<RelatedTasks/>
								</div>
								<div
									v-if="!isTemplate && wasFilled(TaskField.Gantt)"
									class="tasks-full-card-field-container print-before-divider-accent --custom --task-list print-background-white"
									:class="{ 'print-ignore': shouldIgnoreGanttPrint }"
									data-field-container
								>
									<Gantt/>
								</div>
								<div
									v-if="wasFilled(TaskField.DatePlan)"
									class="tasks-full-card-field-container print-before-divider-accent print-no-box-shadow"
									:class="{ 'print-ignore': shouldIgnoreDatePlanPrint }"
									data-field-container
								>
									<DatePlan v-model:isSheetShown="isDatePlanSheetShown" :sheetBindProps/>
								</div>
								<div
									v-if="isTemplate && wasFilled(TaskField.Replication)"
									class="tasks-full-card-field-container print-before-divider-accent --custom tasks-full-card-field-container-replication"
									data-field-container
								>
									<Replication
										v-model:isSheetShown="isReplicationSheetShown"
										v-model:isHistorySheetShown="isReplicationHistorySheetShown"
										:sheetBindProps
									/>
								</div>
								<div
									v-if="shouldShowUserFields"
									class="tasks-full-card-field-container print-before-divider-accent --custom"
									data-field-container
								>
									<UserFields @open="openUserFieldsHandler"/>
								</div>
								<Chips :chips/>
							</div>
							<TaskSettingsHint
								v-if="isTaskSettingsHintShown"
								:isShown="isTaskSettingsHintShown"
								:bindElement="taskSettingsBindElement"
								@close="handleCloseTaskSettingsHint"
							/>
						</div>
					</div>
					<FooterEdit v-if="isEdit"/>
					<FooterCreate
						v-else
						v-model:creationError="creationError"
						@addTask="addTask"
						@copyTask="copyTask"
						@fromTemplate="createFromTemplate"
						@close="tryClose"
					/>
					<ContentResizer v-if="!isTemplate" @endResize="handleEndResize"/>
					<DropZone
						v-if="isDiskModuleInstalled && !isBottomSheetShown && task.rights.edit"
						:container="$refs.main || {}"
						:entityId="taskId"
						:entityType="EntityTypes.Task"
					/>
				</div>
				<Chat v-if="!isTemplate"/>
			</template>
			<template v-else-if="isLoading">
				<div ref="skeleton" style="width: 100%;"/>
			</template>
			<Placeholder
				v-else
				:imgSrc="placeholderOptions.imgSrc"
				:head="placeholderOptions.head"
				:descr="placeholderOptions.descr"
				:action="placeholderOptions.action"
			/>
		</div>
	`,
};
