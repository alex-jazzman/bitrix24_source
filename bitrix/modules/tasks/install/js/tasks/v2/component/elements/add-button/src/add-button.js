import { BIcon, Outline } from 'ui.icon-set.api.vue';
import 'ui.icon-set.outline';

import './add-button.css';

// @vue/component
export const AddButton = {
	name: 'AddButton',
	components: {
		BIcon,
	},
	props: {
		isVisible: {
			type: Boolean,
			default: true,
		},
		isLocked: {
			type: Boolean,
			default: false,
		},
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	computed: {
		icon(): string
		{
			return this.isLocked ? Outline.LOCK_L : Outline.PLUS_L;
		},
	},
	template: `
		<div 
			class="b24-add-button" 
			:class="{
				'--visible' : isVisible,
				'--locked' : isLocked,
			}"
		>
			<BIcon :name="icon" hoverable/>
		</div>
	`,
};
