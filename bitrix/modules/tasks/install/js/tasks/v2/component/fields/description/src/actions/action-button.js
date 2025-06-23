import { BIcon, Outline } from 'ui.icon-set.api.vue';

// @vue/component
export const ActionButton = {
	components: {
		BIcon,
	},
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
	template: `
		<button class="tasks-card-description-action-button" type="button" :title="title">
			<BIcon :name="iconName" :color="iconColor"/>
		</button>
	`,
};
