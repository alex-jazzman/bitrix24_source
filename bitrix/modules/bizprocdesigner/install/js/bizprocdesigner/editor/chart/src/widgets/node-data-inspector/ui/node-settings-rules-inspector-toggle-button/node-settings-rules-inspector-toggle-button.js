import { mapState, mapActions } from 'ui.vue3.pinia';
import { useNodeDataInspectorStore } from '../../../../shared/stores/node-data-inspector-store';
import { useAppStore } from '../../../../entities/app';
import {
	NodeSettingsRulesInspectorToggleButton as NodeSettingsRulesInspectorToggleButtonLayout,
} from '../../../../entities/node-data-inspector';

// @vue/component
export const NodeSettingsRulesInspectorToggleButton = {
	name: 'NodeSettingsRulesInspectorToggleButton',
	components: {
		NodeSettingsRulesInspectorToggleButtonLayout,
	},
	computed:
	{
		...mapState(useAppStore, ['isDataInspectorPanelShown']),
	},
	methods:
	{
		...mapActions(useAppStore, ['toggleDataInspectorPanel']),
		...mapActions(useNodeDataInspectorStore, ['resetGridView']),
		onToggle(): void
		{
			this.toggleDataInspectorPanel();
			this.resetGridView();
		},
	},
	template: `
		<NodeSettingsRulesInspectorToggleButtonLayout
			:isVisible="isDataInspectorPanelShown"
			@click="onToggle"
		/>
	`,
};
