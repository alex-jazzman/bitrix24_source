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
		isLocked: {
			type: Boolean,
			default: false,
		},
	},
	template: `
		<HoverPill>
			<div class="b24-field-add">
				<BIcon :name="icon"/>
				<div>{{ loc('TASKS_V2_FIELD_ADD') }}</div>
				<BIcon v-if="isLocked" :name="Outline.LOCK_L" class="b24-field-add__lock"/>
			</div>
		</HoverPill>
	`,
};
