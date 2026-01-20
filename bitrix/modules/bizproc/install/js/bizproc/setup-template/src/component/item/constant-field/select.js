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
	},
	emits: ['update:modelValue'],
	computed:
	{
		selectedValue:
		{
			get(): string
			{
				return this.modelValue;
			},
			set(newValue: string): void
			{
				this.$emit('update:modelValue', newValue);
			},
		},
		options(): Array<{ id: string, name: string }>
		{
			return this.item.options || [];
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
	},
	template: `
		<div :class="{ 'bizproc-setup-template__field-select': showScroll }">
			<template v-if="item.multiple">
				<div v-for="option in options" :key="option.id" class="ui-ctl ui-ctl-checkbox">
					<input
						type="checkbox"
						class="ui-ctl-element"
						:value="option.name"
						v-model="selectedValue"
						:id="getFieldId(option)"
					>
					<label class="ui-ctl-label-text" :for="getFieldId(option)">{{ option.name }}</label>
				</div>
			</template>
			<template v-else>
				<div v-for="option in options" :key="option.id" class="ui-ctl ui-ctl-radio">
					<input
						type="radio"
						class="ui-ctl-element"
						:value="option.name"
						v-model="selectedValue"
						:id="getFieldId(option)"
					>
					<label class="ui-ctl-label-text" :for="getFieldId(option)">{{ option.name }}</label>
				</div>
			</template>
		</div>
	`,
};
