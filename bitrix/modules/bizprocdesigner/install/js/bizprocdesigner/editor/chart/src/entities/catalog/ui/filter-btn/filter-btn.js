import './filter-btn.css';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

type FilterBtnSetup = {
	iconSet: { [string]: srting },
};

// @vue/component
export const FilterBtn = {
	name: 'filter-btn',
	components: {
		BIcon,
	},
	setup(): FilterBtnSetup
	{
		return {
			iconSet: Outline,
		};
	},
	template: `
		<button class="editor-chart-catalog-filter-btn">
			<BIcon
				:name="iconSet.FILTER_2_LINES"
				:size="24"
			/>
		</button>
	`,
};
