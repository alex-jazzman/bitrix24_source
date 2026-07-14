import { defineComponent, markRaw, type PropType } from 'ui.vue3';
import { SettingSelector } from 'mail.setting-selector';

import type { SettingOption } from '../../utils/crm-integration-settings-type';

type SettingValue = string | number;

type SettingSelectorItem = {
	getId(): SettingValue;
};

type SettingSelectorEvent = {
	getData(): {
		item: SettingSelectorItem;
	};
};

type SettingSelectorDialog = {
	subscribe(eventName: string, handler: (event: SettingSelectorEvent) => void): void;
	unsubscribe(eventName: string, handler: (event: SettingSelectorEvent) => void): void;
	destroy(): void;
};

type SettingSelectorInstance = {
	select(value: SettingValue): void;
	getSelected(): SettingValue | null;
	renderTo(targetContainer: Element | null | undefined): void;
	settingDialog?: SettingSelectorDialog | null;
};

type SettingSelectorDialogOptions = Record<string, unknown>;

type SettingSelectorOptions = {
	settingsMap: Record<string, string>;
	selectedOptionKey: SettingValue;
	dialogOptions?: SettingSelectorDialogOptions;
};

// @vue/component
export const BitrixSettingSelector = defineComponent({
	name: 'crm-bitrix-setting-selector',

	props: {
		modelValue: {
			type: [String, Number] as PropType<SettingValue>,
			required: true,
		},
		options: {
			type: Array as PropType<SettingOption[]>,
			required: true,
		},
		dialogOptions: {
			type: Object as PropType<SettingSelectorDialogOptions | null>,
			required: false,
			default: null,
		},
		dataTestId: {
			type: String,
			default: '',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},

	emits: ['update:modelValue'],

	data()
	{
		return {
			selectorInstance: null as SettingSelectorInstance | null,
			itemOnSelectHandler: null as ((event: SettingSelectorEvent) => void) | null,
		};
	},

	watch: {
		modelValue(newValue: SettingValue): void
		{
			if (this.selectorInstance && newValue !== this.selectorInstance.getSelected())
			{
				this.selectorInstance.select(newValue);
			}
		},
	},

	mounted(): void
	{
		const settingsMap = new Map<string, string>();
		this.options.forEach((option) => {
			settingsMap.set(String(option.value), option.label);
		});

		const settingSelectorOptions: SettingSelectorOptions = {
			settingsMap: Object.fromEntries(settingsMap),
			selectedOptionKey: this.modelValue,
		};

		if (this.dialogOptions)
		{
			settingSelectorOptions.dialogOptions = this.dialogOptions;
		}

		this.selectorInstance = markRaw(
			new SettingSelector(settingSelectorOptions) as SettingSelectorInstance,
		);

		this.itemOnSelectHandler = (event: SettingSelectorEvent): void => {
			if (this.disabled)
			{
				return;
			}

			const { item: selectedItem } = event.getData();
			this.$emit('update:modelValue', selectedItem.getId());
		};

		if (this.selectorInstance.settingDialog && this.itemOnSelectHandler)
		{
			this.selectorInstance.settingDialog.subscribe('Item:onSelect', this.itemOnSelectHandler);
		}

		this.selectorInstance.renderTo(this.$el as Element);
	},

	beforeUnmount(): void
	{
		if (this.selectorInstance?.settingDialog && this.itemOnSelectHandler)
		{
			this.selectorInstance.settingDialog.unsubscribe('Item:onSelect', this.itemOnSelectHandler);
		}

		if (this.selectorInstance?.settingDialog)
		{
			this.selectorInstance.settingDialog.destroy();
		}
	},

	template: `
		<div
			:data-test-id="dataTestId"
			:style="disabled ? { pointerEvents: 'none', opacity: 0.65 } : null"
		></div>
	`,
});
