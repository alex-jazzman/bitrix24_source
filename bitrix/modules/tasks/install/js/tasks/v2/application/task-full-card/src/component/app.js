import { Dom, Event, Text, Type } from 'main.core';

import { mapGetters } from 'ui.vue3.vuex';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { FullSkeleton } from 'tasks.v2.application.task-card';
import { Core } from 'tasks.v2.core';
import { CardType, EventName, Model } from 'tasks.v2.const';
import { Chip } from 'tasks.v2.component.elements.chip';
import { FieldList } from 'tasks.v2.component.elements.field-list';
import { DropZone } from 'tasks.v2.component.drop-zone';
import { Title as FieldTitle } from 'tasks.v2.component.fields.title';
import { Importance } from 'tasks.v2.component.fields.importance';
import { DescriptionField, DescriptionSheet, descriptionTextEditor } from 'tasks.v2.component.fields.description';
import { Creator, creatorMeta } from 'tasks.v2.component.fields.creator';
import { Responsible, responsibleMeta } from 'tasks.v2.component.fields.responsible';
import { Deadline, deadlineMeta } from 'tasks.v2.component.fields.deadline';
import { Status, statusMeta } from 'tasks.v2.component.fields.status';
import { Files, FilesSheet, FilesChip, filesMeta } from 'tasks.v2.component.fields.files';
import { CheckList, CheckListChip, checkListMeta } from 'tasks.v2.component.fields.check-list';
import { Group, GroupChip, groupMeta } from 'tasks.v2.component.fields.group';
import { Flow, FlowChip, flowMeta } from 'tasks.v2.component.fields.flow';
import { Accomplices, AccomplicesChip, accomplicesMeta } from 'tasks.v2.component.fields.accomplices';
import { Auditors, AuditorsChip, auditorsMeta } from 'tasks.v2.component.fields.auditors';
import { Tags, TagsChip, tagsMeta } from 'tasks.v2.component.fields.tags';
import { DatePlan, DatePlanChip, DatePlanSheet, datePlanMeta } from 'tasks.v2.component.fields.date-plan';
import { fileService } from 'tasks.v2.provider.service.file-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { checkListService } from 'tasks.v2.provider.service.check-list-service';
import type { TaskModel } from 'tasks.v2.model.tasks';
import type { CheckListModel } from 'tasks.v2.model.check-list';

import { Chat } from './chat/chat';
import { FooterCreate } from './footer-create/footer-create';
import { FooterEdit } from './footer-edit/footer-edit';
import './app.css';

// @vue/component
export const App = {
	name: 'TaskFullCard',
	components: {
		FieldTitle,
		Importance,
		DescriptionField,
		DescriptionSheet,
		Files,
		FilesSheet,
		CheckList,
		DatePlan,
		DatePlanSheet,
		FieldList,
		Chip,
		Chat,
		FooterCreate,
		FooterEdit,
		DropZone,
	},
	provide(): Object
	{
		return {
			analytics: this.analytics,
			cardType: CardType.Full,
		};
	},
	props: {
		id: {
			type: [Number, String],
			default: () => Text.getRandom(),
		},
		analytics: {
			type: Object,
			default: () => ({}),
		},
	},
	setup(): Object
	{
		return {
			Outline,
			filesMeta,
			datePlanMeta,
			checkListMeta,
			resizeObserver: null,
		};
	},
	data(): Object
	{
		return {
			taskId: this.id,
			isFilesSheetShown: false,
			isCheckListSheetShown: false,
			isDatePlanSheetShown: false,
			checkListId: 0,
			files: fileService.get(this.id).getFiles(),
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		task(): TaskModel
		{
			return this.$store.getters[`${Model.Tasks}/getById`](this.taskId);
		},
		checkLists(): CheckListModel[]
		{
			return this.task?.checklist
				? this.$store.getters[`${Model.CheckList}/getByIds`](this.task.checklist)
				: [];
		},
		isEdit(): boolean
		{
			return Type.isNumber(this.taskId) && this.taskId > 0;
		},
		fields(): Object[]
		{
			const fields = [
				{
					title: creatorMeta.title,
					component: Creator,
					props: {
						context: this.$options.name,
						selectorWithActionMenu: this.isEdit,
					},
				},
				{
					title: responsibleMeta.title,
					component: Responsible,
					props: {
						context: this.$options.name,
						selectorWithActionMenu: this.isEdit,
					},
				},
				{
					title: deadlineMeta.title,
					component: Deadline,
				},
				{
					title: statusMeta.title,
					component: Status,
					withSeparator: true,
				},
				{
					chip: FilesChip,
				},
				{
					chip: {
						component: CheckListChip,
						events: {
							showCheckList: this.openCheckList,
						},
					},
				},
				{
					title: groupMeta.getTitle(this.task.groupId),
					component: Group,
					chip: GroupChip,
					isEnabled: Core.getParams().features.isProjectsEnabled,
				},
				{
					title: accomplicesMeta.title,
					component: Accomplices,
					chip: AccomplicesChip,
				},
				{
					title: auditorsMeta.title,
					component: Auditors,
					chip: AuditorsChip,
					withSeparator: this.wasFilled(accomplicesMeta.id),
				},
				{
					title: flowMeta.title,
					component: Flow,
					chip: FlowChip,
					withSeparator: true,
					isEnabled: Core.getParams().features.isFlowEnabled,
				},
				{
					title: tagsMeta.title,
					component: Tags,
					chip: TagsChip,
				},
				{
					chip: {
						component: DatePlanChip,
						events: {
							open: this.openDatePlan,
						},
					},
				},
			];

			/* eslint-disable no-param-reassign */
			fields.forEach((field) => {
				field.props ??= {};
				field.props.taskId = this.taskId;
			});

			return fields;
		},
		primaryFields(): Object[]
		{
			const primaryFields = new Set([Creator, Responsible, Deadline, Status]);

			return this.fields.filter(({ component }) => primaryFields.has(component));
		},
		projectFields(): Object[]
		{
			const projectFields = new Set();
			if (this.wasFilled(groupMeta.id))
			{
				projectFields.add(Group);
			}

			if (this.wasFilled(flowMeta.id))
			{
				projectFields.add(Flow);
			}

			return this.fields.filter(({ component }) => projectFields.has(component));
		},
		participantsFields(): Object[]
		{
			const participantsFields = new Set();

			if (this.wasFilled(accomplicesMeta.id))
			{
				participantsFields.add(Accomplices);
			}

			if (this.wasFilled(auditorsMeta.id))
			{
				participantsFields.add(Auditors);
			}

			return this.fields.filter(({ component }) => participantsFields.has(component));
		},
		tagsFields(): Object[]
		{
			if (!this.wasFilled(tagsMeta.id))
			{
				return [];
			}

			return this.fields.filter(({ component }) => component === Tags);
		},
		chips(): any[]
		{
			return this.fields.filter(({ chip, isEnabled }) => chip && isEnabled !== false).map(({ chip }) => chip);
		},
		isBottomSheetShown(): boolean
		{
			return this.isFilesSheetShown || this.isCheckListSheetShown || this.isDatePlanSheetShown;
		},
	},
	watch: {
		async task(): Promise<void>
		{
			if (this.task)
			{
				await this.$nextTick();
				this.tryStartObserver();
			}
		},
	},
	async created(): Promise<void>
	{
		if (!this.isEdit && !this.task)
		{
			void this.$store.dispatch(`${Model.Tasks}/insert`, {
				id: this.taskId,
				creatorId: this.currentUserId,
			});
		}

		await this.$store.dispatch(`${Model.Tasks}/clearFieldsFilled`, this.taskId);

		if (this.isEdit && !this.task)
		{
			await taskService.getById(this.taskId);
		}

		await fileService.get(this.taskId).list(this.task.fileIds);

		descriptionTextEditor.get(this.taskId, {
			content: this.task?.description,
		});
	},
	mounted(): void
	{
		this.tryStartObserver();
		this.$refs.skeleton?.append(FullSkeleton());
	},
	beforeUnmount(): void
	{
		this.resizeObserver?.disconnect();
	},
	unmounted(): void
	{
		if (!this.isEdit)
		{
			void this.$store.dispatch(`${Model.Tasks}/delete`, this.taskId);
			fileService.delete(this.taskId);
			descriptionTextEditor.delete(this.taskId);
		}
	},
	methods: {
		wasFilled(fieldId: string): boolean
		{
			return this.$store.getters[`${Model.Tasks}/wasFieldFilled`](this.taskId, fieldId);
		},
		tryStartObserver(): void
		{
			if (this.$refs.title && !this.resizeObserver)
			{
				this.resizeObserver = this.getObserver();
				this.resizeObserver.observe(this.$refs.title);
			}
		},
		getObserver(): ResizeObserver
		{
			return new ResizeObserver((entries) => {
				for (const entry of entries)
				{
					if (entry.target === this.$refs.title)
					{
						void this.$store.dispatch(`${Model.Interface}/updateTitleFieldOffsetHeight`, entry.contentRect.height);
					}
				}
			});
		},
		async addTask(): Promise<void>
		{
			await this.$refs?.description?.save();

			const checkLists = this.checkLists;

			const [id] = await taskService.add(this.task);

			this.taskId = id;

			if (checkLists.length > 0)
			{
				await checkListService.save(this.taskId, checkLists);
			}

			fileService.replace(this.id, this.taskId);
			descriptionTextEditor.replace(this.id, this.taskId);
		},
		openEditor(): void
		{
			this.handleShowBottomSheet();
		},
		closeEditor(slot: { close: () => void }): void
		{
			slot.close();
			this.handleCloseBottomSheet();
		},
		openFiles(): void
		{
			this.isFilesSheetShown = true;
			this.handleShowBottomSheet();
		},
		closeFiles(): void
		{
			this.isFilesSheetShown = false;
			this.handleCloseBottomSheet();
		},
		openCheckList(checkListId?: number): void
		{
			this.checkListId = checkListId;
			this.isCheckListSheetShown = true;
			this.handleShowBottomSheet();
		},
		closeCheckList(checkListId?: number): void
		{
			this.checkListId = checkListId;
			this.isCheckListSheetShown = false;
			this.handleCloseBottomSheet();
		},
		openDatePlan(): void
		{
			this.isDatePlanSheetShown = true;
			this.handleShowBottomSheet();
		},
		closeDatePlan(): void
		{
			this.isDatePlanSheetShown = false;
			this.handleCloseBottomSheet();
		},
		handleShowBottomSheet(): void
		{
			Dom.addClass(this.$refs.scrollContent, '--disable-scroll');
		},
		handleCloseBottomSheet(): void
		{
			Dom.removeClass(this.$refs.scrollContent, '--disable-scroll');
		},
		close(): void
		{
			Event.EventEmitter.emit(EventName.CloseFullCard);
		},
	},
	template: `
		<div class="tasks-full-card" :data-task-id="taskId" data-task-full>
			<template v-if="task">
				<div class="tasks-full-card-main" :class="{ '--overlay': isBottomSheetShown }">
					<div class="tasks-full-card-content" ref="scrollContent">
						<div
							class="tasks-full-card-title"
							:class="{'--no-padding-bottom': task.description.length > 0}"
							ref="title"
						>
							<FieldTitle :taskId="taskId"/>
							<Importance :taskId="taskId"/>
						</div>
						<FilesSheet
							:taskId="taskId"
							:isShown="isFilesSheetShown"
							@close="closeFiles"
						/>
						<CheckList
							:taskId="taskId"
							:checkListId="checkListId"
							:isShown="isCheckListSheetShown"
							@close="closeCheckList"
						/>
						<DatePlanSheet
							:taskId="taskId"
							:isShown="isDatePlanSheetShown"
							@close="closeDatePlan"
						/>
						<DescriptionField
							:taskId="taskId"
							v-slot="slot"
							ref="description"
						>
							<DescriptionSheet
								:taskId="taskId"
								:isShown="slot.isShown"
								:doOpenInEditMode="slot.doOpenInEditMode"
								@show="openEditor"
								@close="closeEditor(slot)"
							/>
						</DescriptionField>
						<div class="tasks-full-card-fields">
							<div class="tasks-full-card-field-container" data-field-container>
								<FieldList :fields="primaryFields"/>
							</div>
							<div class="tasks-full-card-chips-fields">
								<div
									v-if="files.length > 0 || wasFilled(filesMeta.id)"
									class="tasks-full-card-field-container --small-vertical-padding"
									data-field-container
								>
									<Files :taskId="taskId" @open="openFiles"/>
								</div>
								<div
									v-if="wasFilled(checkListMeta.id)"
									class="tasks-full-card-field-container --custom"
									data-field-container
								>
									<CheckList
										:taskId="taskId"
										:isPreview="true"
										:isComponentShown="!isCheckListSheetShown"
										:checkListId="checkListId"
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
									v-if="tagsFields.length > 0"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<FieldList :fields="tagsFields"/>
								</div>
								<div
									v-if="wasFilled(datePlanMeta.id)"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<DatePlan :taskId="taskId" @open="openDatePlan"/>
								</div>
								<div class="tasks-full-card-chips">
									<template v-for="(chip, index) of chips" :key="index">
										<component
											:is="chip.component ?? chip"
											v-bind="{ taskId }"
											v-on="chip.events ?? {}"
										/>
									</template>
									<Chip :icon="Outline.APPS" :text="'Ещё'" :soon="true"/>
								</div>
							</div>
						</div>
						<DropZone
							v-if="!isBottomSheetShown"
							:taskId="taskId"
						/>
					</div>
					<div class="tasks-full-card-footer">
						<FooterEdit v-if="isEdit" :taskId="taskId"/>
						<FooterCreate v-else :taskId="taskId" @addTask="addTask"/>
					</div>
				</div>
				<Chat :taskId="taskId"/>
			</template>
			<template v-else>
				<div ref="skeleton" style="width: 100%;"></div>
			</template>
		</div>
	`,
};
