import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';

import { EntitySelectorEntity } from 'tasks.v2.const';
import { EntitySelectorDialog } from 'tasks.v2.lib.entity-selector-dialog';
import type { TaskModel } from 'tasks.v2.model.tasks';

export const TemplatesButton = {
	components: {
		UiButton,
	},
	inject: {
		task: {},
	},
	setup(): { task: TaskModel }
	{
		return {
			ButtonSize,
			AirButtonStyle,
		};
	},
	emits: ['template'],
	beforeUnmount(): void
	{
		this.dialog?.destroy();
	},
	methods: {
		showDialog(): void
		{
			this.dialog ??= new EntitySelectorDialog({
				context: 'tasks-card',
				multiple: false,
				enableSearch: true,
				entities: [
					{
						id: EntitySelectorEntity.Template,
						options: {
							withFooter: false,
						},
					},
				],
				preselectedItems: this.task.templateId ? [[EntitySelectorEntity.Template, this.task.templateId]] : [],
				popupOptions: {
					events: {
						onClose: (): void => {
							const templateId = this.dialog.getSelectedItems()[0]?.getId();
							if (templateId > 0)
							{
								this.$emit('template', templateId);
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
			<UiButton
				:text="loc('TASKS_V2_TEMPLATES')"
				:size="ButtonSize.SMALL"
				:style="AirButtonStyle.PLAIN_NO_ACCENT"
				dropdown
				@click="showDialog"
			/>
		</div>
	`,
};
