import { PlacementsListItem } from '../placements-list-item/placements-list-item';

import './placements-list.css';

// @vue/component
export const PlacementsList = {
	name: 'PlacementsList',
	components: {
		PlacementsListItem,
	},
	props: {
		/** @type PlacementModel[] */
		placements: {
			type: Array,
			required: true,
		},
	},
	template: `
		<div class="tasks-field-placements-list-container">
			<div class="tasks-field-placements-list">
				<PlacementsListItem
					v-for="placement in placements"
					:key="placement.id"
					:placement
				/>
			</div>
		</div>
	`,
};
