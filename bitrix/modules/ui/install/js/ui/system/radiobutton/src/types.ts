import { type RadioButtonSize } from './const';

export type RadioButtonOptions = {
	group: string,
	size?: RadioButtonSize,
	checked?: boolean,
	disabled?: boolean,
	attributes?: { [key: string]: string },
	onChange?: Function,
};
