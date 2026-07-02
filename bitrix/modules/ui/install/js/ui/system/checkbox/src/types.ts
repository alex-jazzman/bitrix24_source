import { type CheckboxSize } from './const';

export type CheckboxOptions = {
	size?: CheckboxSize,
	checked?: boolean,
	indeterminate?: boolean,
	disabled?: boolean,
	attributes?: { [key: string]: string },
	onChange?: Function,
};
