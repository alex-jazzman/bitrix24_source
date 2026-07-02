import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { TextSm } from 'ui.system.typography.vue';
import 'ui.icon-set.outline';

import { EntitySelectorEntity } from 'tasks.v2.const';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';
import { taskService } from 'tasks.v2.provider.service.task-service';
import { EntitySelectorDialog } from 'tasks.v2.lib.entity-selector-dialog';
import type { TaskModel } from 'tasks.v2.model.tasks';

import './templates-button.css';

export const TemplatesButton = {
	components: {
		BIcon,
		TextSm,
		HoverPill,
	},
	inject: {
		task: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			Outline,
		};
	},
	beforeUnmount(): void
	{
		this.dialog?.destroy();
	},
	methods: {
		showDialog(): void
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
	},
	template: `
		<div ref="button">
			<HoverPill @click="showDialog">
				<div class="tasks-full-card-templates-button-container">
					<div class="tasks-full-card-templates-button-container-text">{{ loc('TASKS_V2_TEMPLATES') }}</div>
					<BIcon :name="Outline.CHEVRON_DOWN_L" color="var(--ui-color-design-plain-na-content)"/>
				</div>
			</HoverPill>
		</div>
	`,
};
