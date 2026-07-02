import { mapState, mapActions } from 'ui.vue3.pinia';
import { useAppStore } from '../../../../entities/app';
import { DebugBarPanel, useDebugBarStore } from '../../../../entities/debug-bar';
import { diagramStore } from '../../../../entities/blocks';

// @vue/component
export const DebugBar = {
	name: 'DebugBarWidget',
	components: {
		DebugBarPanel,
	},
	computed: {
		...mapState(useDebugBarStore, ['isVisible']),
		...mapState(diagramStore, ['templateId']),
		...mapState(useAppStore, ['isShownDebugBar']),
	},
	methods: {
		...mapActions(useAppStore, ['hideDebugBar']),
		...mapActions(useDebugBarStore, ['hide']),
		onClose()
		{
			this.hide();
			this.hideDebugBar();
		},
	},
	template: '<DebugBarPanel v-if="isShownDebugBar" @close="onClose"/>',
};
