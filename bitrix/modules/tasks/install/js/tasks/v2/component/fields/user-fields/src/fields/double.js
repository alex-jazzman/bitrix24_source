import { Type } from 'main.core';
import { TextMd, TextXs } from 'ui.system.typography.vue';
import './fields.css';

// @vue/component
export const UserFieldDouble = {
	components: { TextMd, TextXs },
	props: {
		title: {
			type: String,
			required: true,
		},
		value: {
			type: [Number, String, Array],
			default: 0,
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
				return this.value.map((v) => this.prepareValue(v));
			}

			return [this.prepareValue(this.value)];
		},
	},
	methods: {
		prepareValue(value: string | number): string
		{
			const numberValue = parseInt(String(value), 10);

			if (Number.isNaN(numberValue))
			{
				return '0';
			}

			return String(numberValue);
		},
	},
	template: `
		<div
			class="tasks-user-field --double"
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
