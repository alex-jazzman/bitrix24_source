import { mapState } from 'ui.vue3.pinia';
import { diagramStore as useDiagramStore } from '../../../../entities/blocks';
import {
	PublishDropdownButton as PublishDropdownButtonFeature,
	PublishMainDropdownOption,
	PublishUserDropdownOption,
	PublishFullDropdownOption,
} from '../../../../features/blocks';

// @vue/component
export const PublishDropdownButton = {
	name: 'PublishDropdownButton',
	components:
	{
		PublishDropdownButtonFeature,
		PublishMainDropdownOption,
		PublishUserDropdownOption,
		PublishFullDropdownOption,
	},
	props:
	{
		// The lock the application decides on: a template that was not found is locked by nothing in the
		// store, so this property is the only source of it. Declared and handed down explicitly - it used
		// to reach the button as an unrecognized attribute landing on the root component, and the root
		// changing or attribute inheritance being switched off would have taken half of the lock away
		// without a word.
		readonly:
		{
			type: Boolean,
			default: false,
		},
	},
	computed:
	{
		// The item is offered where the publication behind it can run: a template that was never saved
		// has no row for a pilot version to be stored beside, and the item would answer a click with
		// nothing at all.
		...mapState(useDiagramStore, [
			'canPublishToPilotAudience',
			'canPublishStoppingRunningProcesses',
		]),
	},
	template: `
		<PublishDropdownButtonFeature :readonly="readonly">
			<PublishMainDropdownOption/>
			<PublishUserDropdownOption v-if="canPublishToPilotAudience"/>
			<PublishFullDropdownOption v-if="canPublishStoppingRunningProcesses"/>
		</PublishDropdownButtonFeature>
	`,
};
