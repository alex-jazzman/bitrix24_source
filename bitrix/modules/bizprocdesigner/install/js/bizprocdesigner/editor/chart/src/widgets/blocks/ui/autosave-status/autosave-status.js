import { mapState, mapActions } from 'ui.vue3.pinia';
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
		...mapState(useDiagramStore, [
			'saveStatus',
			'lastSavedAt',
			'isEditorReadonly',
			'isTemplateNotFound',
			'editorLockReason',
		]),
	},
	methods:
	{
		// The manual retry runs the same draft save as the debounced autosave, so no fake
		// schema change is needed to get out of the error state.
		...mapActions(useDiagramStore, ['autosave']),
	},
	template: `
		<AutosaveStatusEntity
			:saveStatus="saveStatus"
			:lastSavedAt="lastSavedAt"
			:readonly="isEditorReadonly || isTemplateNotFound"
			:lockReason="editorLockReason"
			@retry="autosave"
		/>
	`,
};
