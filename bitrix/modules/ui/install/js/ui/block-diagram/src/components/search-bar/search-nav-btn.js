import { BIcon } from 'ui.icon-set.api.vue';
import './search-nav-btn.css';

// @vue/component
export const SearchNavBtn = {
	name: 'search-nav-btn',
	components: {
		BIcon,
	},
	props: {
		iconName: {
			type: String,
			required: true,
		},
	},
	template: `
		<button class="ui-block-diagram-search-nav-btn">
			<BIcon
				:name="iconName"
				:size="18"
				class="ui-block-diagram-search-nav-btn__icon"
			/>
		</button>
	`,
};
