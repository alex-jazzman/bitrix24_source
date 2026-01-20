import { MenuItemDesign } from 'ui.system.menu';
import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { BMenu, type MenuOptions, type MenuItemOptions, type MenuSectionOptions } from 'ui.system.menu.vue';

import { Core } from 'tasks.v2.core';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { Mark } from 'tasks.v2.const';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { showLimit } from 'tasks.v2.lib.show-limit';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './mark-task-button.css';

const sectionMark = 'sectionMark';

// @vue/component
export const MarkTaskButton = {
	name: 'MarkTaskButton',
	components: {
		BMenu,
		BIcon,
		HoverPill,
	},
	inject: {
		task: {},
	},
	setup(): { task: TaskModel } {},
	data(): Object
	{
		return {
			isMenuShown: false,
			activeMenuItemId: this.task.mark,
		};
	},
	computed: {
		isAllowed(): boolean
		{
			return this.task.rights.mark;
		},
		menuOptions(): Function
		{
			return (): MenuOptions => ({
				id: 'tasks-full-card-mark-task-menu',
				bindElement: this.$refs.container,
				sections: this.menuSections,
				items: this.menuItems,
			});
		},
		menuSections(): MenuSectionOptions[]
		{
			return [{
				code: sectionMark,
				title: this.loc('TASKS_V2_MARK_TASK_MARK_SECTION_TITLE'),
			}];
		},
		menuItems(): MenuItemOptions[]
		{
			return [
				this.getNoMarkItem(),
				this.getPositiveMarkItem(),
				this.getNegativeMarkItem(),
			];
		},
		formattedText(): string
		{
			if (this.activeMenuItemId === Mark.None || this.isLocked)
			{
				return this.loc('TASKS_V2_MARK_TASK_BUTTON_NONE');
			}

			return this.loc('TASKS_V2_MARK_TASK_BUTTON_SET');
		},
		formattedIcon(): ?string
		{
			if (this.isLocked)
			{
				return Outline.LOCK_M;
			}

			if (this.activeMenuItemId === Mark.Positive)
			{
				return Outline.LIKE;
			}

			if (this.activeMenuItemId === Mark.Negative)
			{
				return Outline.DISLIKE;
			}

			return null;
		},
		isLocked(): boolean
		{
			return !Core.getParams().restrictions.mark.available;
		},
	},
	watch: {
		'task.mark': {
			handler: 'updateMark',
		},
	},
	methods: {
		getNoMarkItem(): MenuItemOptions
		{
			return {
				id: Mark.None,
				title: this.loc('TASKS_V2_MARK_TASK_MARK_NONE'),
				icon: Outline.TEXT_FORMAT_CANCEL,
				...this.getMenuItemOptions(Mark.None),
			};
		},
		getPositiveMarkItem(): MenuItemOptions
		{
			return {
				id: Mark.Positive,
				title: this.loc('TASKS_V2_MARK_TASK_MARK_POSITIVE'),
				icon: Outline.LIKE,
				...this.getMenuItemOptions(Mark.Positive),
			};
		},
		getNegativeMarkItem(): MenuItemOptions
		{
			return {
				id: Mark.Negative,
				title: this.loc('TASKS_V2_MARK_TASK_MARK_NEGATIVE'),
				icon: Outline.DISLIKE,
				...this.getMenuItemOptions(Mark.Negative),
			};
		},
		isSelected(menuItemId: string): boolean
		{
			return menuItemId === this.activeMenuItemId;
		},
		getMenuItemOptions(menuItemId: string): MenuItemOptions
		{
			const commonOptions = {
				onClick: async (): Promise<void> => {
					if (this.activeMenuItemId === menuItemId)
					{
						return;
					}
					this.activeMenuItemId = menuItemId;
					void taskService.setMark(this.task.id, menuItemId);
				},
				sectionCode: sectionMark,
			};

			if (menuItemId === this.activeMenuItemId)
			{
				return {
					...commonOptions,
					isSelected: true,
					design: MenuItemDesign.Accent1,
				};
			}

			return {
				...commonOptions,
				isSelected: false,
				design: MenuItemDesign.Default,
			};
		},
		handleClick(): void
		{
			if (this.isLocked)
			{
				void showLimit({
					featureId: Core.getParams().restrictions.mark.featureId,
				});

				return;
			}

			if (!this.isAllowed)
			{
				return;
			}

			this.isMenuShown = true;
		},
		updateMark(): void
		{
			this.activeMenuItemId = this.task.mark;
		},
	},
	template: `
		<div
			class="tasks-full-card-mark-task-button-container"
			ref="container"
		>
			<HoverPill
				:readonly="!isAllowed"
				@click="handleClick"
			>
				<div class="tasks-full-card-mark-task-mark-container">
					<div class="tasks-full-card-mark-task-mark-text">{{ formattedText }}</div>
					<BIcon
						v-if="formattedIcon"
						class="tasks-full-card-mark-task-mark-icon"
						:name="formattedIcon"
					/>
				</div>
			</HoverPill>
		</div>
		<BMenu
			v-if="isMenuShown"
			@close="isMenuShown = false"
			:options="menuOptions()"
		/>
	`,
};
