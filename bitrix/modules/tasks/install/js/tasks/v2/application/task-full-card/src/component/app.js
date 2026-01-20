import { Reflection, Runtime, Loc } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { Notifier } from 'ui.notification-manager';
import { renderSkeleton } from 'ui.system.skeleton';
import { computed } from 'ui.vue3';
import { mapActions, mapGetters } from 'ui.vue3.vuex';

import { analytics } from 'tasks.v2.lib.analytics';
import { Core } from 'tasks.v2.core';
import { idUtils } from 'tasks.v2.lib.id-utils';
import { ahaMoments } from 'tasks.v2.lib.aha-moments';
import { CardType, EventName, Model, TaskField, Option, GroupType } from 'tasks.v2.const';
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

import { fileService, EntityTypes } from 'tasks.v2.provider.service.file-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { templateService } from 'tasks.v2.provider.service.template-service';
import { deadlineService } from 'tasks.v2.provider.service.deadline-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { GroupModel } from 'tasks.v2.model.groups';
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
	},
	provide(): Object
	{
		return {
			analytics: this.analytics,
			cardType: CardType.Full,
			settings: Core.getParams(),
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
					title: responsibleMeta.getTitle(!this.task.isForNewUser && this.task.responsibleIds.length > 1),
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
						isHovered: this.isPrimaryFieldsHovered || this.isTaskSettingsHintShown,
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
				{
					title: emailMeta.title,
					component: Email,
					chip: {
						component: EmailChip,
						isEnabled: this.wasFilled(TaskField.Email),
					},
				},
				{
					title: emailMeta.fromTitle,
					component: EmailFrom,
					withSeparator: true,
				},
				{
					title: emailMeta.dateTitle,
					component: EmailDate,
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
				},
				{
					title: accomplicesMeta.title,
					component: Accomplices,
					chip: {
						component: AccomplicesChip,
						isEnabled: this.wasFilled(TaskField.Accomplices) || this.task.rights.changeAccomplices,
					},
				},
				{
					title: auditorsMeta.title,
					component: Auditors,
					chip: {
						component: AuditorsChip,
						isEnabled: this.wasFilled(TaskField.Auditors) || this.task.rights.addAuditors,
					},
					withSeparator: this.wasFilled(TaskField.Accomplices),
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
				},
				{
					chip: {
						component: ParentTaskChip,
						collapsed: true,
						isEnabled: this.wasFilled(TaskField.Parent) || this.task.rights.edit,
					},
				},
				{
					chip: {
						component: SubTasksChip,
						collapsed: true,
						isEnabled: this.wasFilled(TaskField.SubTasks) || this.task.rights.createSubtask || !this.isEdit,
					},
				},
				{
					chip: {
						component: RelatedTasksChip,
						collapsed: true,
						isEnabled: this.wasFilled(TaskField.RelatedTasks) || this.task.rights.edit,
					},
				},
				!this.isTemplate && {
					chip: {
						component: GanttChip,
						collapsed: true,
						isEnabled: this.wasFilled(TaskField.Gantt) || this.task.rights[ganttMeta.right],
					},
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
						isEnabled: this.task.rights.edit || this.task.allowsTimeTracking,
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
				[TimeTracking, this.task.allowsTimeTracking],
				[Status, this.isEdit],
			]));
		},
		projectFields(): AppField[]
		{
			const isScrum = this.group?.type === GroupType.Scrum;

			return this.getFields(new WeakMap([
				[Group, this.wasFilled(TaskField.Group)],
				[Flow, this.wasFilled(TaskField.Flow)],
				[Stage, !this.isTemplate && this.isEdit && this.group && (this.task.stageId !== 0 || !isScrum)],
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
		}

		await this.$store.dispatch(`${Model.Tasks}/clearFieldsFilled`, this.taskId);

		if (this.isEdit && (!this.task || this.isPartiallyLoaded))
		{
			await taskService.get(this.taskId);
		}

		if (this.task?.fileIds?.length > 0)
		{
			await fileService.get(this.taskId).list(this.task.fileIds);
		}

		this.isLoading = false;

		if (!this.task)
		{
			return;
		}

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
			const [id, error] = await taskService.add(this.task);

			if (!id)
			{
				this.handleCreationError(error);

				return;
			}

			this.taskId = id;

			fileService.replace(this.id, id);

			entityTextEditor.replace(this.id, id);

			if (id)
			{
				this.sendAddTaskAnalytics(true);
			}
			else
			{
				this.sendAddTaskAnalytics(false);
			}

			this.notifyGrid();
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
			await fileService.get(this.taskId).sync(this.task.fileIds);

			entityTextEditor.replace(this.id, id);

			this.notifyGrid();
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

				return;
			}

			this.taskId = id;

			fileService.delete(this.id);
			await fileService.get(this.taskId).sync(this.task.fileIds);

			entityTextEditor.replace(this.id, id);

			this.notifyGrid();
		},
		handleCreationError(error: Error): void
		{
			this.creationError = true;

			Notifier.notifyViaBrowserProvider({
				id: 'task-notify-add-error',
				text: error?.message,
			});
		},
		notifyGrid(): void
		{
			EventEmitter.emit(EventName.NotifyGrid, new BaseEvent({
				data: this.taskId,
				compatData: [
					'ADD',
					{
						task: this.task,
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
			const templateId = this.isEdit ? null : this.task?.templateId;

			void userFieldsSlider.open(this.taskId, this.isTemplate, templateId);
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

			if (this.task?.fileIds?.length > 0)
			{
				await fileService.get(this.taskId).list(this.task?.fileIds);
			}

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
		sendAddTaskAnalytics(isSuccess: boolean): void
		{
			const collabId = this.group?.type === GroupType.Collab ? this.group.id : null;
			const checkLists = this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist);
			if (checkLists.length > 0)
			{
				const checklistCount = checkLists.filter(({ parentId }) => parentId === 0).length;
				const checklistItemsCount = checkLists.filter(({ parentId }) => parentId !== 0).length;
				analytics.sendAddTaskWithCheckList(this.analytics, {
					isSuccess,
					collabId,
					viewersCount: this.task.auditorsIds.length,
					checklistCount,
					checklistItemsCount,
				});
			}
			else
			{
				analytics.sendAddTask(this.analytics, {
					isSuccess,
					collabId,
					viewersCount: this.task.auditorsIds.length,
					coexecutorsCount: this.task.accomplicesIds.length,
				});
			}
		},
	},
	template: `
		<div class="tasks-full-card" :class="{ '--blur': isDescriptionSheetShown }" :data-task-id="taskId" data-task-full>
			<template v-if="task && !isPartiallyLoaded && !isLoading">
				<div
					ref="main"
					class="tasks-full-card-main"
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
								class="tasks-full-card-field-container"
								data-field-container
								@mouseover="isPrimaryFieldsHovered = true"
								@mouseleave="isPrimaryFieldsHovered = false"
							>
								<FieldList :fields="primaryFields"/>
							</div>
							<div class="tasks-full-card-chips-fields">
								<div
									v-if="emailFields.length > 0"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<FieldList :fields="emailFields"/>
								</div>
								<div
									v-if="!isTemplate && (task.requireResult || wasFilled(TaskField.Results))"
									class="tasks-full-card-field-container --custom"
								>
									<Results
										v-model:isSheetShown="isResultEditorSheetShown"
										v-model:isListSheetShown="isResultListSheetShown"
										:sheetBindProps
									/>
								</div>
								<div
									v-if="isDiskModuleInstalled && (files.length > 0 || wasFilled(TaskField.Files))"
									class="tasks-full-card-field-container --small-vertical-padding"
									data-field-container
								>
									<Files v-model:isSheetShown="isFilesSheetShown" :taskId :sheetBindProps/>
								</div>
								<div
									v-if="wasFilled(TaskField.CheckList)"
									class="tasks-full-card-field-container --custom"
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
									class="tasks-full-card-field-container"
									data-field-container
								>
									<FieldList :fields="projectFields"/>
								</div>
								<div
									v-if="participantsFields.length > 0"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<FieldList
										:fields="participantsFields"
										:useSeparator="participantsFields.length > 1"
									/>
								</div>
								<div
									v-if="!isTemplate && isEdit && wasFilled(TaskField.Placements)"
									class="tasks-full-card-field-container --custom"
								>
									<Placements/>
								</div>
								<div
									v-if="!isTemplate && wasFilled(TaskField.Reminders)"
									class="tasks-full-card-field-container --custom"
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
									class="tasks-full-card-field-container"
									data-field-container
								>
									<FieldList :fields="tagsFields"/>
								</div>
								<div
									v-if="wasFilled(TaskField.Parent)"
									class="tasks-full-card-field-container --custom"
									data-field-container
								>
									<ParentTask/>
								</div>
								<div
									v-if="wasFilled(TaskField.SubTasks) && !isCopyMode"
									class="tasks-full-card-field-container --custom --task-list"
									data-field-container
								>
									<SubTasks/>
								</div>
								<div
									v-if="wasFilled(TaskField.RelatedTasks)"
									class="tasks-full-card-field-container --custom --task-list"
									data-field-container
								>
									<RelatedTasks/>
								</div>
								<div
									v-if="!isTemplate && wasFilled(TaskField.Gantt)"
									class="tasks-full-card-field-container --custom --task-list"
									data-field-container
								>
									<Gantt/>
								</div>
								<div
									v-if="wasFilled(TaskField.DatePlan)"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<DatePlan v-model:isSheetShown="isDatePlanSheetShown" :sheetBindProps/>
								</div>
								<div
									v-if="isTemplate && wasFilled(TaskField.Replication)"
									class="tasks-full-card-field-container --custom tasks-full-card-field-container-replication"
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
								class="tasks-full-card-field-container --custom"
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
						@template="handleTemplate"
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
