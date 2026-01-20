import { Type } from 'main.core';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import './fields.css';

// @vue/component
export const UserFieldString = {
	components: {
		TextMd,
		TextXs,
	},
	props: {
		title: {
			type: String,
			required: true,
		},
		value: {
			type: [String, Array],
			default: '',
		},
		mandatory: {
			type: Boolean,
			default: false,
		},
		isLast: {
			type: Boolean,
			default: false,
		},
	},
	computed: {
		values(): string[]
		{
			if (Type.isArrayFilled(this.value))
			{
				return this.value.map((v) => String(v));
			}

			return [String(this.value)];
		},
	},
	template: `
		<div
			class="tasks-user-field --string"
			:class="{ '--last': isLast }"
		>
			<TextXs
				class="tasks-user-field-title"
				:class="{ '--mandatory': mandatory }"
			>
				{{ title }}
			</TextXs>
			<div v-for="(item, index) in values" :key="index" class="tasks-user-field-value">
				<TextMd>{{ item }}</TextMd>
			</div>
		</div>
	`,
};
