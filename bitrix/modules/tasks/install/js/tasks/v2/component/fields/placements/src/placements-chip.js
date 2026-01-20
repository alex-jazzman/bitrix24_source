import { Chip, ChipDesign } from 'ui.system.chip.vue';
import { Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import { fieldHighlighter } from 'tasks.v2.lib.field-highlighter';

import { placementsMeta } from './placements-meta';

// @vue/component
export const PlacementsChip = {
	components: {
		Chip,
	},
	inject: {
		taskId: {},
	},
	setup(): void
	{
		return {
			Outline,
			placementsMeta,
		};
	},
	computed: {
		design(): string
		{
			return ChipDesign.ShadowAccent;
		},
	},
	methods: {
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(placementsMeta.id);
		},
	},
	template: `
		<Chip
			:design="design"
			:text="placementsMeta.title"
			:icon="Outline.PRODUCT"
			:data-task-id="taskId"
			:data-task-chip-id="placementsMeta.id"
			ref="chip"
			@click="highlightField"
		/>
	`,
};
