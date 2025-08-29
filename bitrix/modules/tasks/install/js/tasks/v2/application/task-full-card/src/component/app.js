import { Dom, Event, Text, Type } from 'main.core';

import { mapActions, mapGetters } from 'ui.vue3.vuex';
import { Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { FullSkeleton } from 'tasks.v2.application.task-card';
import { Core } from 'tasks.v2.core';
import { CardType, EventName, Model } from 'tasks.v2.const';
import { Chip } from 'tasks.v2.component.elements.chip';
import { FieldList } from 'tasks.v2.component.elements.field-list';
import { Title as FieldTitle } from 'tasks.v2.component.fields.title';
import { Importance } from 'tasks.v2.component.fields.importance';
import { DescriptionField, DescriptionSheet } from 'tasks.v2.component.fields.description';
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
		FieldList,
		Chip,
		Chat,
		FooterCreate,
		FooterEdit,
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
			resizeObserver: null,
		};
	},
	data(): Object
	{
		return {
			taskId: this.id,
			isBottomSheetShown: false,
			isFilesSheetShown: false,
			isCheckListSheetShown: false,
			chipsEventHandlers: {
				showCheckList: this.openCheckList,
			},
			checkListId: 0,
			files: fileService.get(this.id).getFiles(),
		};
	},
	computed: {
		...mapGetters({
			currentUserId: `${Model.Interface}/currentUserId`,
		}),
		wasAccomplicesFilled(): boolean
		{
			return this.$store.getters[`${Model.Tasks}/wasFieldFilled`](this.taskId, accomplicesMeta.id);
		},
		wasAuditorsFilled(): boolean
		{
			return this.$store.getters[`${Model.Tasks}/wasFieldFilled`](this.taskId, auditorsMeta.id);
		},
		wasFlowFilled(): boolean
		{
			return this.$store.getters[`${Model.Tasks}/wasFieldFilled`](this.taskId, flowMeta.id);
		},
		wasGroupFilled(): boolean
		{
			return this.$store.getters[`${Model.Tasks}/wasFieldFilled`](this.taskId, groupMeta.id);
		},
		wasFilesFilled(): boolean
		{
			return this.$store.getters[`${Model.Tasks}/wasFieldFilled`](this.taskId, filesMeta.id);
		},
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
						taskId: this.taskId,
						context: this.$options.name,
						selectorWithActionMenu: this.isEdit,
					},
				},
				{
					title: responsibleMeta.title,
					component: Responsible,
					props: {
						taskId: this.taskId,
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
					title: filesMeta.title,
					component: Files,
					chip: FilesChip,
				},
				{
					title: checkListMeta.title,
					component: CheckList,
					chip: CheckListChip,
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
					withSeparator: this.wasAccomplicesFilled,
				},
				{
					title: flowMeta.title,
					component: Flow,
					chip: FlowChip,
					withSeparator: true,
					isEnabled: Core.getParams().features.isFlowEnabled,
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
			if (this.wasGroupFilled)
			{
				projectFields.add(Group);
			}

			if (this.wasFlowFilled)
			{
				projectFields.add(Flow);
			}

			return this.fields.filter(({ component }) => projectFields.has(component));
		},
		participantsFields(): Object[]
		{
			const participantsFields = new Set();

			if (this.wasAccomplicesFilled)
			{
				participantsFields.add(Accomplices);
			}

			if (this.wasAuditorsFilled)
			{
				participantsFields.add(Auditors);
			}

			return this.fields.filter(({ component }) => participantsFields.has(component));
		},
		chips(): any[]
		{
			return this.fields.filter(({ chip, isEnabled }) => chip && isEnabled !== false ).map(({ chip }) => chip);
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
	},
	mounted(): void
	{
		this.tryStartObserver();
		this.$refs.skeleton?.append(FullSkeleton());
	},
	beforeUnmount(): void
	{
		if (this.resizeObserver)
		{
			this.resizeObserver.disconnect();
		}
	},
	unmounted(): void
	{
		if (!this.isEdit)
		{
			void this.$store.dispatch(`${Model.Tasks}/delete`, this.taskId);
			fileService.delete(this.taskId);
		}
	},
	methods: {
		...mapActions(Model.Interface, [
			'updateTitleFieldOffsetHeight',
		]),
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
						this.updateTitleFieldOffsetHeight(entry.contentRect.height);
					}
				}
			});
		},
		async addTask(): Promise<void>
		{
			const checkLists = this.checkLists;

			const [id] = await taskService.add(this.task);

			this.taskId = id;

			if (checkLists.length > 0)
			{
				await checkListService.save(this.taskId, checkLists);
			}

			fileService.replace(this.id, this.taskId);
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
			this.handleCloseBottomSheet();
		},
		openCheckList(checkListId?: number): void
		{
			this.checkListId = checkListId;
			this.isCheckListSheetShown = true;
			this.handleShowBottomSheet();
		},
		closeCheckList(): void
		{
			this.isCheckListSheetShown = false;
			this.handleCloseBottomSheet();
		},
		handleShowBottomSheet(): void
		{
			this.isBottomSheetShown = true;
			Dom.addClass(this.$refs.scrollContent, '--disable-scroll');
			this.$refs.scrollContent.scrollTo({
				top: 0,
				behavior: 'smooth',
			});
		},
		handleCloseBottomSheet(): void
		{
			this.isBottomSheetShown = false;
			Dom.removeClass(this.$refs.scrollContent, '--disable-scroll');
		},
		close(): void
		{
			Event.EventEmitter.emit(EventName.CloseFullCard);
		},
		getEventListeners(chip, handlers): Object
		{
			const listeners = {};

			if (chip.emits)
			{
				Object.keys(handlers).forEach((event: string) => {
					if (chip.emits.includes(event))
					{
						listeners[event] = handlers[event];
					}
				});
			}

			return listeners;
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
						<DescriptionField
							:taskId="taskId"
							v-slot="slot"
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
									v-if="files.length > 0 || wasFilesFilled"
									class="tasks-full-card-field-container"
									data-field-container
								>
									<Files :taskId="taskId" @open="openFiles"/>
								</div>
								<div
									v-if="task.checklist.length > 0"
									class="tasks-full-card-field-container --custom"
									data-field-container
								>
									<CheckList
										:taskId="taskId"
										:isPreview="true"
										:isComponentShown="!isCheckListSheetShown"
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
								<div class="tasks-full-card-chips">
									<template v-for="(chip, index) of chips" :key="index">
										<component
											:is="chip"
											v-bind="{ taskId }"
											v-on="getEventListeners(chip, chipsEventHandlers)"
										/>
									</template>
									<Chip :icon="Outline.APPS" :text="'Ещё'" :soon="true"/>
								</div>
							</div>
						</div>
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
