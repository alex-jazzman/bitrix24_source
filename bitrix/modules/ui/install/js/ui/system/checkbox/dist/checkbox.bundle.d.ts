/* eslint-disable */
type CheckboxSize = typeof BX.UI.System.Checkbox.CheckboxSize[keyof typeof BX.UI.System.Checkbox.CheckboxSize];

type CheckboxOptions = {
	size?: BX.UI.System.Checkbox.CheckboxSize;
	checked?: boolean;
	indeterminate?: boolean;
	disabled?: boolean;
	attributes?: {
		[key: string]: string;
	};
	onChange?: Function;
};

declare namespace BX.UI.System.Checkbox {
	const CheckboxSize: Readonly<{
		Lg: "lg";
		Md: "md";
		Sm: "sm";
	}>;

	class Checkbox {
		constructor(options?: CheckboxOptions);
		render(): HTMLLabelElement;
		setSize(size: CheckboxSize): this;
		getSize(): CheckboxSize;
		setChecked(checked?: boolean): this;
		isChecked(): boolean;
		setIndeterminate(flag?: boolean): this;
		isIndeterminate(): boolean;
		setDisabled(disabled?: boolean): this;
		isDisabled(): boolean;
		setOnChange(callback: Function | null): this;
		destroy(): void;
	}
}
