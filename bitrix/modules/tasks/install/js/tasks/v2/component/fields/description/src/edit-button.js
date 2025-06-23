import { BIcon, Outline } from 'ui.icon-set.api.vue';
import './description.css';

// @vue/component
export const EditButton = {
	name: 'TaskDescriptionEditButton',
	components: {
		BIcon,
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		iconSize(): number
		{
			return 18;
		},
	},
	template: `
		<div class="tasks-card-change-description">
			<BIcon :name="Outline.EDIT_L" :size=iconSize></BIcon>
			<div class="tasks-card-change-description-text">{{ loc('TASKS_V2_CHANGE_DESCRIPTION') }}</div>
		</div>
	`,
};
