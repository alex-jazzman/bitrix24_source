/* eslint-disable */
type RadioButtonSize = typeof BX.UI.System.RadioButton.RadioButtonSize[keyof typeof BX.UI.System.RadioButton.RadioButtonSize];

type RadioButtonOptions = {
	group: string;
	size?: BX.UI.System.RadioButton.RadioButtonSize;
	checked?: boolean;
	disabled?: boolean;
	attributes?: {
		[key: string]: string;
	};
	onChange?: Function;
};

declare namespace BX.UI.System.RadioButton {
	const RadioButtonSize: Readonly<{
		Lg: "lg";
		Md: "md";
		Sm: "sm";
	}>;

	class RadioButton {
		constructor(options: RadioButtonOptions);
		render(): HTMLLabelElement;
		setSize(size: RadioButtonSize): this;
		getSize(): RadioButtonSize;
		setChecked(checked?: boolean): this;
		isChecked(): boolean;
		setDisabled(disabled?: boolean): this;
		isDisabled(): boolean;
		setOnChange(callback: Function | null): this;
		destroy(): void;
	}
}
