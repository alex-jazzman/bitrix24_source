import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';

import { emailMeta } from './email-meta';

// @vue/component
export const EmailChip = {
	components: {
		Chip,
	},
	inject: {
		taskId: {},
	},
	setup(): Object
	{
		return {
			Outline,
			ChipDesign,
			emailMeta,
		};
	},
	methods: {
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(emailMeta.id);
		},
	},
	template: `
		<Chip
			:design="ChipDesign.ShadowAccent"
			:icon="Outline.MAIL"
			:text="emailMeta.title"
			:data-task-id="taskId"
			:data-task-chip-id="emailMeta.id"
			@click="highlightField"
		/>
	`,
};
