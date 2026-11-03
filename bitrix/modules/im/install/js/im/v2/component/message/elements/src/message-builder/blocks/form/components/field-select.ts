import { BInput, InputDesign } from 'ui.system.input.vue';
import { BMenu, MenuItemDesign, type MenuOptions } from 'ui.system.menu.vue';
import { defineComponent, type PropType } from 'ui.vue3';

import { type FormFieldBlockType, type FormFieldOption } from 'im.v2.const';

// @vue/component
export const FormFieldSelect = defineComponent({
	name: 'FormFieldSelect',
	components: { BInput, BMenu },
	props: {
		field: {
			type: Object as PropType<FormFieldBlockType>,
			required: true,
		},
		value: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:value'],
	data(): { isShown: boolean }
	{
		return {
			isShown: false,
		};
	},
	computed: {
		options(): FormFieldOption[]
		{
			return this.field.options ?? [];
		},
		selectedLabel(): string
		{
			const selected = this.options.find((option) => option.id === this.value);

			return selected ? selected.label : '';
		},
		design(): string
		{
			return this.disabled ? InputDesign.Disabled : InputDesign.Grey;
		},
		menuOptions(): MenuOptions
		{
			return {
				bindElement: (this.$refs.input as { $el: HTMLElement }).$el,
				closeOnItemClick: false,
				targetContainer: document.body,
				items: this.options.map((option) => {
					return {
						title: option.label,
						isSelected: option.id === this.value,
						design: MenuItemDesign.Default,
						onClick: () => {
							this.$emit('update:value', option.id);
							this.isShown = false;
						},
					};
				}),
			} as unknown as MenuOptions;
		},
	},
	methods: {
		handleInputClick(): void
		{
			if (this.disabled)
			{
				return;
			}

			this.isShown = true;
		},
	},
	template: `
		<div class="bx-im-message-block-form__field" :data-testid="'im-message-form-field-' + field.id">
			<BInput
				:modelValue="selectedLabel"
				:label="field.label"
				dropdown
				clickable
				readonly
				stretched
				:active="isShown"
				:design="design"
				ref="input"
				:data-testid="'im-message-form-select-' + field.id"
				@click="handleInputClick"
			/>
			<BMenu
				v-if="isShown"
				:options="menuOptions"
				@close="isShown = false"
			/>
		</div>
	`,
});
