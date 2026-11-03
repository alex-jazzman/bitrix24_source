import { Dom } from 'main.core';
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
	mounted(): void
	{
		this.syncAria();
	},
	methods: {
		syncAria(): void
		{
			const el = this.$refs.chip?.$el;
			if (!el)
			{
				return;
			}

			Dom.attr(el, 'role', 'button');
		},
		highlightField(): void
		{
			void fieldHighlighter.setContainer(this.$root.$el).highlight(placementsMeta.id);
		},
		handleKeydown(event: KeyboardEvent): void
		{
			if (event.key !== ' ')
			{
				return;
			}

			event.preventDefault();
			this.highlightField();
		},
	},
	template: `
		<Chip
			:design="design"
			:text="placementsMeta.title"
			:icon="Outline.PRODUCT"
			:data-task-id="taskId"
			:data-task-chip-id="placementsMeta.id"
			data-testid="tasks-placements-chip"
			ref="chip"
			@click="highlightField"
			@keydown="handleKeydown"
		/>
	`,
};
