import { Dom, Type } from 'main.core';

import { Chip, ChipDesign, type ChipImage } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { Model } from 'tasks.v2.const';
import { Hint } from 'tasks.v2.component.elements.hint';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';
import { showLimit } from 'tasks.v2.lib.show-limit';
import { analytics } from 'tasks.v2.lib.analytics';
import { groupService } from 'tasks.v2.provider.service.group-service';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { type GroupModel } from 'tasks.v2.model.groups';
import { type TaskModel } from 'tasks.v2.model.tasks';

import { groupMeta } from './group-meta';
import { groupDialog } from './group-dialog';
import { GroupPopup } from './group-popup/group-popup';

// @vue/component
export const GroupChip = {
	components: {
		Chip,
		Hint,
		GroupPopup,
	},
	inject: {
		settings: {},
		analytics: {},
		cardType: {},
		task: {},
		taskId: {},
		embedded: {},
	},
	props: {
		isAutonomous: {
			type: Boolean,
			default: false,
		},
	},
	setup(): { task: TaskModel }
	{
		return {
			groupMeta,
		};
	},
	data(): Object
	{
		return {
			doShowHint: false,
			isDialogShown: false,
		};
	},
	computed: {
		group(): ?GroupModel
		{
			return this.$store.getters[`${Model.Groups}/getById`](this.task.groupId);
		},
		design(): string
		{
			return {
				[!this.isAutonomous && !this.isSelected]: ChipDesign.ShadowNoAccent,
				[!this.isAutonomous && this.isSelected]: ChipDesign.ShadowAccent,
				[this.isAutonomous && !this.isSelected]: ChipDesign.OutlineNoAccent,
				[this.isAutonomous && this.isSelected]: ChipDesign.OutlineAccent,
			}.true;
		},
		isSelected(): boolean
		{
			if (this.isAutonomous)
			{
				return this.task.groupId > 0;
			}

			return this.task.filledFields[groupMeta.id];
		},
		isFilled(): boolean
		{
			return Boolean(this.isAutonomous && this.group);
		},
		isFlowFilled(): boolean
		{
			return this.task.flowId > 0;
		},
		text(): string
		{
			if (this.isFilled)
			{
				return this.group?.name ?? this.loc('TASKS_V2_GROUP_HIDDEN');
			}

			return this.loc('TASKS_V2_GROUP_TITLE_CHIP');
		},
		icon(): ?string
		{
			if (this.isFilled)
			{
				return null;
			}

			return Outline.FOLDER;
		},
		image(): ?ChipImage
		{
			if (!this.isFilled)
			{
				return null;
			}

			if (!this.group?.image)
			{
				return null;
			}

			return {
				src: encodeURI(this.group.image),
				alt: this.group?.name,
			};
		},
		canChange(): boolean
		{
			return (this.task.flowId ?? 0) <= 0;
		},
		isLocked(): boolean
		{
			return !this.settings.restrictions.project.available;
		},
		opensDialog(): boolean
		{
			return (this.isAutonomous || !this.isSelected) && !this.isLocked && !this.isFlowFilled;
		},
		ariaLabel(): string
		{
			if (!this.isFilled)
			{
				return this.text;
			}

			return this.loc('TASKS_V2_GROUP_VALUE_ARIA_LABEL', {
				'#TITLE#': groupMeta.getTitle(this.task.groupId),
				'#VALUE#': this.text,
			});
		},
	},
	watch: {
		isDialogShown(): void
		{
			this.syncAria();
		},
		opensDialog(): void
		{
			this.syncAria();
		},
		text(): void
		{
			this.syncAria();
		},
	},
	async created(): Promise<void>
	{
		if (this.task.groupId && !this.group && !this.task.flowId)
		{
			const group = await groupService.getGroup(this.task.groupId);
			if (!group)
			{
				taskService.updateStoreTask(this.taskId, { groupId: 0, stageId: 0 });
			}
		}
	},
	mounted(): void
	{
		this.syncAria();
	},
	methods: {
		handleClick(): void
		{
			if (!this.isAutonomous && this.isSelected)
			{
				this.highlightField();

				return;
			}

			if (this.isLocked)
			{
				void showLimit({
					featureId: this.settings.restrictions.project.featureId,
				});

				return;
			}

			if (this.isFlowFilled)
			{
				this.doShowHint = true;

				return;
			}

			this.isDialogShown = true;
			const targetNode = this.getChipElement();
			if (!targetNode)
			{
				return;
			}

			groupDialog.show({
				targetNode,
				taskId: this.taskId,
				onClose: this.handleDialogClose,
			});
		},
		handleDialogClose(groupId?: number): void
		{
			this.isDialogShown = false;

			this.$refs.chip?.$el?.focus();

			if (groupId === undefined)
			{
				return;
			}

			if (!this.isAutonomous && this.isSelected)
			{
				this.highlightField();
			}

			if (groupId)
			{
				analytics.sendAddProject(this.analytics, {
					cardType: this.cardType,
					taskId: Type.isNumber(this.taskId) ? this.taskId : 0,
					viewersCount: this.task.auditorsIds.length,
					coexecutorsCount: this.task.accomplicesIds.length,
				});
			}
		},
		async openGroup(): void
		{
			if (this.embedded)
			{
				void groupDialog.openProject(this.group);
			}
			else
			{
				void groupDialog.openGroup(this.isAutonomous, this.group, this.taskId);
			}
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(groupMeta.id);
		},
		handleClear(): void
		{
			void taskService.update(this.taskId, {
				groupId: 0,
				stageId: 0,
			});
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key !== ' ')
			{
				return;
			}

			event.preventDefault();
			this.handleClick();
		},
		syncAria(): void
		{
			const el = this.getChipElement();
			if (!el)
			{
				return;
			}

			Dom.attr(el, 'role', 'button');
			Dom.attr(el, 'aria-haspopup', this.opensDialog ? 'dialog' : null);
			Dom.attr(el, 'aria-expanded', this.opensDialog ? String(this.isDialogShown) : null);
			Dom.attr(el, 'aria-label', this.ariaLabel);
		},
		getChipElement(): ?HTMLElement
		{
			return this.$refs.chip?.$el ?? null;
		},
	},
	template: `
		<Chip
			:design
			:icon
			:image
			:text
			:withClear="isFilled && !isFlowFilled"
			:lock="isLocked"
			:trimmable="isFilled"
			:data-task-id="taskId"
			:data-task-chip-id="groupMeta.id"
			:data-task-chip-value="task.groupId"
			ref="chip"
			@click="handleClick"
			@clear="handleClear"
			@keydown="handleKeydown"
		/>
		<Hint
			v-if="doShowHint && getChipElement()"
			:bindElement="getChipElement()"
			@close="doShowHint = false"
		>
			{{ loc('TASKS_V2_GROUP_CANT_CHANGE_FLOW') }}
		</Hint>
		<GroupPopup
			v-if="isAutonomous"
			:getBindElement="getChipElement"
			@openGroup="openGroup"
		/>
	`,
};
