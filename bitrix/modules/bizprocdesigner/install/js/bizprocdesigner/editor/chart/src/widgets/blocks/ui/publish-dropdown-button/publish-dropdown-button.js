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
	computed:
	{
		// The item is offered where the publication behind it can run: a template that was never saved
		// has no row for a pilot version to be stored beside, and the item would answer a click with
		// nothing at all.
		...mapState(useDiagramStore, ['canPublishToPilotAudience']),
	},
	template: `
		<PublishDropdownButtonFeature>
			<PublishMainDropdownOption/>
			<PublishUserDropdownOption v-if="canPublishToPilotAudience"/>
			<PublishFullDropdownOption/>
		</PublishDropdownButtonFeature>
	`,
};
