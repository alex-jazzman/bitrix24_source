import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { hint, type HintParams } from 'ui.vue3.directives.hint';

import { tooltip } from 'tasks.v2.component.elements.hint';

// @vue/component
export const ResultsActionButton = {
	components: {
		BIcon,
	},
	directives: { hint },
	props: {
		title: {
			type: String,
			default: '',
		},
		iconName: {
			type: String,
			required: true,
		},
		iconColor: {
			type: String,
			default: '',
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		showTooltip(): boolean
		{
			return this.title.length > 0;
		},
		tooltip(): Function
		{
			return (): HintParams => tooltip({
				text: this.title,
				popupOptions: {
					offsetLeft: this.$el.offsetWidth / 2,
				},
			});
		},
	},
	template: `
		<button class="tasks-field-results-action-button" type="button" v-hint="showTooltip ? tooltip : null">
			<BIcon
				:name="iconName"
				:color="iconColor"
				hoverable
				class="tasks-field-results-title-icon --big"
			/>
		</button>
	`,
};
