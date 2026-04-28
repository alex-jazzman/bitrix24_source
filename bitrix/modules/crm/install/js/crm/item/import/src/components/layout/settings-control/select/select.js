import { BitrixVueComponentProps } from 'ui.vue3';
import { RequiredMark } from '../../required-mark/required-mark';
import { Alert } from '../../alert/alert';
import { BIcon as Icon } from 'ui.icon-set.api.vue';

export type SelectOption = {
	title: string,
	value: string | number,
	hint: ?string,
};

// eslint-disable-next-line no-unused-vars
type IconProp = {
	name: string,
	color: string,
	size: number,
};

import './select.css';

export const Select: BitrixVueComponentProps = {
	name: 'Select',

	emits: [
		'onSelectMouseDown',
	],

	components: {
		RequiredMark,
		Alert,
		Icon,
	},

	props: {
		fieldName: {
			type: [
				String,
				Number,
			],
			required: true,
		},
		model: {
			type: Object,
			required: true,
		},
		fieldCaption: {
			type: String,
			required: true,
		},
		options: {
			/** @type SelectOption[] */
			type: Array,
			required: true,
		},
		required: {
			type: Boolean,
			default: () => false,
		},
		icon: {
			/** @type IconProp */
			type: Object,
			default: () => {},
		},
	},

	data(): Object
	{
		return {
			hint: null,
		};
	},

	computed: {
		selected: {
			get(): string | number
			{
				this.adjustHint();

				return this.model.get(this.fieldName);
			},
			set(value: string | number): void
			{
				this.model.set(this.fieldName, value);
				this.adjustHint();
			},
		},
	},

	methods: {
		adjustHint(): void
		{
			this.hint = this.options
				.find((option: SelectOption) => option.value === this.model.get(this.fieldName))
				?.hint;
		},
	},

	template: `
		<div class="crm-item-import__field --select ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">
					<div class="title">
						<template v-if="icon">
							<Icon :name="icon.name" :size="icon.size" :color="icon.color"/>
						</template>
						{{ fieldCaption }}
						<RequiredMark v-if="required" />
					</div>
				</div>
			</div>
			<div class="ui-ctl ui-ctl-w100">
				<div class="ui-ctl ui-ctl-dropdown ui-ctl-w100">
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<select
						class="ui-ctl-element"
						:name="fieldName"
						v-model="selected"
						@mousedown="this.$emit('onSelectMouseDown', $event)"
					>
						<option
							v-for="option in options"
							:value="option.value"
						>
							{{ option.title }}
						</option>
					</select>
				</div>
			</div>
			<Alert class="crm-item-import__field-select-hint" v-if="hint">
				{{ hint }}
			</Alert>
		</div>
	`,
};
