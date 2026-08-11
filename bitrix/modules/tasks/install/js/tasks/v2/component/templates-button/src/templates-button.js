import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BMenu, type MenuItemOptions, type MenuOptions } from 'ui.system.menu.vue';
import { Event } from 'main.core';
import { EventEmitter } from 'main.core.events';
import 'ui.icon-set.outline';

import { TaskModel } from 'tasks.task-model';
import { EntitySelectorEntity, EventName, TaskField } from 'tasks.v2.const';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { Hint } from 'tasks.v2.component.elements.hint';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { templateService } from 'tasks.v2.provider.service.template-service';
import { EntitySelectorDialog } from 'tasks.v2.lib.entity-selector-dialog';
import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';

import './templates-button.css';

export const TemplatesButton = {
	components: {
		BIcon,
		BMenu,
		HoverPill,
		Hint,
	},
	inject: {
		task: {},
	},
	setup(): { task: TaskModel }
	{
		return { Outline };
	},
	data(): Object
	{
		return {
			isMenuShown: false,
			isHintShown: false,
			hintContainer: null,
		};
	},
	created(): void
	{
		this.keydownHandler = null;
	},
	beforeUnmount(): void
	{
		this.dialog?.destroy();
		this.unbindKeydownHandler();
	},
	computed: {
		menuOptions(): MenuOptions
		{
			return {
				id: 'tasks-templates-button-menu',
				bindElement: this.$refs.button,
				items: this.menuItems,
			};
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				{
					title: this.loc('TASKS_V2_TEMPLATES_SELECT_TEMPLATE'),
					icon: Outline.CHEVRON_RIGHT_L,
					onClick: (): void => this.openTemplateSelector(),
				},
				{
					title: this.loc('TASKS_V2_TEMPLATES_SAVE_AS_TEMPLATE'),
					icon: Outline.TEMPLATE_TASK,
					onClick: (): void => this.saveAsTemplate(),
				},
			];
		},
		hintText(): string
		{
			return this.loc('TASKS_V2_TEMPLATE_TITLE_IS_EMPTY');
		},
	},
	methods: {
		unbindKeydownHandler(): void
		{
			if (!this.keydownHandler)
			{
				return;
			}

			Event.unbind(window, 'keydown', this.keydownHandler);

			this.keydownHandler = null;
		},
		hideHint(): void
		{
			this.isHintShown = false;

			this.unbindKeydownHandler();
		},
		openTemplateSelector(): void
		{
			const popupWidth = 385;
			const popupHeight = 385;

			this.dialog ??= new EntitySelectorDialog({
				context: 'tasks-card',
				width: popupWidth,
				height: popupHeight,
				multiple: false,
				enableSearch: true,
				dropdownMode: true,
				entities: [
					{
						id: EntitySelectorEntity.TemplateCommon,
						options: {
							isFullListOpenable: true,
						},
					},
				],
				preselectedItems: this.task.templateId ? [[EntitySelectorEntity.TemplateCommon, this.task.templateId]] : [],
				popupOptions: {
					className: 'popup-window_entity-picker-no-check',
					events: {
						onClose: (): void => {
							const templateId = this.dialog.getSelectedItems()[0]?.getId();
							if (templateId > 0)
							{
								void taskService.updateStoreTask(this.task.id, { templateId });
							}
						},
					},
				},
			});

			this.dialog.showTo(this.$refs.button);
		},
		async saveAsTemplate(): Promise<void>
		{
			if (this.task.title.trim() === '')
			{
				await this.handleEmptyTitle();

				return;
			}

			const [id, error] = await templateService.addFromTaskEntity(this.task);

			EventEmitter.emit(EventName.NotifyTemplateCreated, { id, error });
		},
		async handleEmptyTitle(): Promise<void>
		{
			await this.$nextTick();

			this.hintContainer = fieldHighlighter
				.setContainer(this.$root.$el)
				.addHighlight(TaskField.Title)
				.getFieldContainer(TaskField.Title);

			this.hintContainer?.querySelector('textarea')?.focus();

			this.unbindKeydownHandler();

			this.keydownHandler = () => {
				this.hideHint();
			};

			Event.bind(window, 'keydown', this.keydownHandler);

			this.isHintShown = true;
		},
	},
	template: `
		<div ref="button">
			<HoverPill @click="isMenuShown = true">
				<div class="tasks-full-card-templates-button-container">
					<div class="tasks-full-card-templates-button-container-text">{{ loc('TASKS_V2_TEMPLATES') }}</div>
					<BIcon :name="Outline.CHEVRON_DOWN_L" color="var(--ui-color-design-plain-na-content)"/>
				</div>
			</HoverPill>
		</div>
		<BMenu v-if="isMenuShown" :options="menuOptions" @close="isMenuShown = false"/>
		<Hint v-if="isHintShown" :bindElement="hintContainer" @close="hideHint">
			{{ hintText }}
		</Hint>
	`,
};
