import { mapState } from 'ui.vue3.pinia';
import {
	diagramStore as useDiagramStore,
	AutosaveStatus as AutosaveStatusEntity,
} from '../../../../entities/blocks';

// @vue/component
export const AutosaveStatus = {
	name: 'AutosaveStatus',
	components: {
		AutosaveStatusEntity,
	},
	computed:
	{
		...mapState(useDiagramStore, ['isOnline']),
	},
	template: `
		<AutosaveStatusEntity :isOnline="isOnline"/>
	`,
};
