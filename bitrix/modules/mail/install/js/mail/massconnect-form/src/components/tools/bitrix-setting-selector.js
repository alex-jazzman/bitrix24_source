import { SettingSelector } from 'mail.setting-selector';

// @vue/component
export const BitrixSettingSelector = {
	props: {
		modelValue: {
			type: [String, Number],
			required: true,
		},
		options: {
			type: Array,
			required: true,
		},
		dialogOptions: {
			type: Object,
			required: false,
			default: null,
		},
	},

	emits: ['update:modelValue'],

	selectorInstance: null,
	itemOnSelectHandler: null,

	watch: {
		modelValue(newValue: string): void
		{
			if (this.selectorInstance && newValue !== this.selectorInstance.getSelected())
			{
				this.selectorInstance.select(newValue);
			}
		},
	},

	mounted(): void
	{
		const settingsMap = new Map();
		this.options.forEach((option) => {
			settingsMap.set(option.value, option.label);
		});

		const settingSelectorOptions = {
			settingsMap: Object.fromEntries(settingsMap),
			selectedOptionKey: this.modelValue,
		};

		if (this.dialogOptions)
		{
			settingSelectorOptions.dialogOptions = this.dialogOptions;
		}

		this.selectorInstance = new SettingSelector(settingSelectorOptions);

		this.itemOnSelectHandler = (event) => {
			const { item: selectedItem } = event.getData();
			this.$emit('update:modelValue', selectedItem.getId());
		};

		if (this.selectorInstance.settingDialog)
		{
			this.selectorInstance.settingDialog.subscribe('Item:onSelect', this.itemOnSelectHandler);
		}

		this.selectorInstance.renderTo(this.$el);
	},
	beforeUnmount(): void
	{
		if (this.selectorInstance.settingDialog)
		{
			this.selectorInstance.settingDialog.unsubscribe('Item:onSelect', this.itemOnSelectHandler);
		}

		if (this.selectorInstance && this.selectorInstance.settingDialog)
		{
			this.selectorInstance.settingDialog.destroy();
		}
	},
	template: '<div></div>',
};
