import { BIcon as Icon, Set as IconSet } from 'ui.icon-set.api.vue';
import 'ui.icon-set.main';

import './remove-button.css';

type RemoveButtonData = {
	iconSet: { [string]: string },
}

export const RemoveButton = {
	name: 'RemoveButton',
	emits: ['remove'],
	props: {
		dataId: {
			type: [String, Number],
			required: true,
		},
		dataElementPrefix: {
			type: String,
			default: '',
		},
	},
	setup(): RemoveButtonData
	{
		const iconSet = IconSet;

		return {
			iconSet,
		};
	},
	components: {
		Icon,
	},
	template: `
		<div
			class="booking-actions-popup__item-remove-button"
			:data-element="dataElementPrefix + '-menu-remove-button'"
			:data-booking-id="dataId"
			@click="$emit('remove')"
		>
			<div class="booking-actions-popup__item-overbooking-label">
				{{ loc('BB_ACTIONS_POPUP_OVERBOOKING_REMOVE') }}
			</div>
			<Icon :name="iconSet.TRASH_BIN"/>
		</div>
	`,
};
