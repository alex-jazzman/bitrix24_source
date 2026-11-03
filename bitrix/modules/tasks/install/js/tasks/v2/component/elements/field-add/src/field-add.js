import { BIcon, Outline } from 'ui.icon-set.api.vue';
import { HoverPill } from 'tasks.v2.component.elements.hover-pill';

import './field-add.css';

export const FieldAdd = {
	components: {
		BIcon,
		HoverPill,
	},
	setup(): Object
	{
		return {
			Outline,
		};
	},
	props: {
		icon: {
			type: String,
			required: true,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		withTabStop: {
			type: Boolean,
			default: true,
		},
		isLocked: {
			type: Boolean,
			default: false,
		},
		ariaLabel: {
			type: String,
			default: '',
		},
		ariaHaspopup: {
			type: String,
			default: '',
		},
		ariaExpanded: {
			type: Boolean,
			default: null,
		},
	},
	template: `
		<HoverPill :ariaLabel :ariaHaspopup :ariaExpanded :withTabStop>
			<div :class="['b24-field-add', { '--disabled': disabled }]">
				<BIcon :name="icon" aria-hidden="true"/>
				<div>{{ loc('TASKS_V2_FIELD_ADD') }}</div>
				<BIcon v-if="isLocked" :name="Outline.LOCK_L" class="b24-field-add__lock" aria-hidden="true"/>
			</div>
		</HoverPill>
	`,
};
