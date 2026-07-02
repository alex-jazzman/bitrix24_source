import { ResourceSelector } from './resource-selector/resource-selector';
import { ResourceIntersection } from './resource-intersection/resource-intersection';

import './actions-menu.css';

// @vue/component
export const ActionsMenu = {
	name: 'BookingActionsMenu',
	components: {
		ResourceSelector,
		ResourceIntersection,
	},
	template: `
		<div class="booking-booking__actions-menu">
			<ResourceSelector/>
			<ResourceIntersection/>
		</div>
	`,
};
