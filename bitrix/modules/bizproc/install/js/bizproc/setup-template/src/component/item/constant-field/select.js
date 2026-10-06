// @vue/component
export const ConstantSelect = {
	name: 'ConstantSelect',
	props: {
		/** @type ConstantItem */
		item: {
			type: Object,
			required: true,
		},
		modelValue: {
			type: [String, Array],
			default: '',
		},
		labelledbyId: {
			type: String,
			default: '',
		},
		describedbyId: {
			type: String,
			default: '',
		},
		invalid: {
			type: Boolean,
			default: false,
		},
		required: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	computed:
	{
		selectedValue:
		{
			get(): string | Array<string>
			{
				if (Array.isArray(this.modelValue))
				{
					return this.modelValue.map((value) => this.normalizeOptionValue(value));
				}

				return this.normalizeOptionValue(this.modelValue);
			},
			set(newValue: string): void
			{
				this.$emit('update:modelValue', newValue);
			},
		},
		options(): Array<{ id: string, name: string }>
		{
			const rawOptions = this.item.options;
			if (!rawOptions)
			{
				return [];
			}

			return Object.entries(rawOptions).map(([id, name]) => ({ id, name }));
		},
		showScroll(): boolean
		{
			return this.options.length > 7;
		},
	},
	methods: {
		getFieldId(option: { id: string, name: string }): string
		{
			return `select-opt-${this.item.id}-${option.id}`;
		},
		getFieldTestId(option: { id: string, name: string }): string
		{
			return `bizproc-setup-template__form-select-${this.item.id}-${option.id}`;
		},
		// legacy wizard configs store the localized option label as the value; map it to the option id
		normalizeOptionValue(value: string): string
		{
			const rawOptions = this.item.options ?? {};
			if (!value || Object.hasOwn(rawOptions, value))
			{
				return value;
			}

			const legacyOption = Object.entries(rawOptions).find(([, name]) => name === value);

			return legacyOption ? legacyOption[0] : value;
		},
	},
	template: `
		<div
			:role="item.multiple ? 'group' : 'radiogroup'"
			:aria-labelledby="labelledbyId || null"
			:aria-describedby="describedbyId || null"
			:aria-invalid="!item.multiple && invalid ? 'true' : null"
			:aria-required="!item.multiple && required ? 'true' : null"
			:class="{ 'bizproc-setup-template__field-select': showScroll }"
		>
			<template v-if="item.multiple">
				<div v-for="option in options" :key="option.id" class="ui-ctl ui-ctl-checkbox">
					<input
						type="checkbox"
						class="ui-ctl-element"
						:value="option.id"
						v-model="selectedValue"
						:id="getFieldId(option)"
						:data-test-id="getFieldTestId(option)"
					>
					<label class="ui-ctl-label-text" :for="getFieldId(option)">{{ option.name }}</label>
				</div>
			</template>
			<template v-else>
				<div v-for="option in options" :key="option.id" class="ui-ctl ui-ctl-radio">
					<input
						type="radio"
						class="ui-ctl-element"
						:value="option.id"
						v-model="selectedValue"
						:id="getFieldId(option)"
						:data-test-id="getFieldTestId(option)"
					>
					<label class="ui-ctl-label-text" :for="getFieldId(option)">{{ option.name }}</label>
				</div>
			</template>
		</div>
	`,
};
