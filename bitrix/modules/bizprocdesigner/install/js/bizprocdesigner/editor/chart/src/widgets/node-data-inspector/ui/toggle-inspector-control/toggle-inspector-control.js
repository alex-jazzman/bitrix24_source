import { Loc } from 'main.core';
import { Chip, ChipDesign, ChipSize } from 'ui.system.chip.vue';

import { mapActions } from 'ui.vue3.pinia';

import { useNodeDataInspectorStore } from '../../../../shared/stores/node-data-inspector-store';
import { useAppStore } from '../../../../entities/app';

// @vue/component
export const ToggleInspectorControl = {
	name: 'ToggleInspectorControl',
	components: {
		Chip,
	},
	computed: {
		text(): string
		{
			return Loc.getMessage('BIZPROCDESIGNER_EDITOR_NODE_DATA_INSPECTOR_TOGGLE_BUTTON_SHOW');
		},
		design(): string
		{
			return ChipDesign.OutlineAccent2;
		},
		ChipSize: (): typeof ChipSize => ChipSize,
	},
	methods: {
		...mapActions(useAppStore, ['toggleDataInspectorPanel']),
		...mapActions(useNodeDataInspectorStore, ['resetGridView']),
		toggleInspector(): void
		{
			this.toggleDataInspectorPanel();
			this.resetGridView();
		},
	},
	template: `
		<Chip
			class="editor-chart-data-inspector-toggle"
			:text="text"
			:size="ChipSize.Md"
			:design="design"
			@click="toggleInspector"
		/>
	`,
};
