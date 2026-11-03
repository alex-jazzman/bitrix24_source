import { ElementStyle } from '../../../../../../../../../dev/janative/types/style/element';

type OtpInputLength = 4 | 6;

type OtpInputRef = {
	focus: () => void;
	blur: () => void;
};

interface OtpInputProps
{
	testId?: string;
	// the story panel feeds a length out of a dictionary, so the closed set is taken in both forms
	length?: OtpInputLength | `${OtpInputLength}`;
	value?: string;
	error?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	focus?: boolean;
	style?: Partial<ElementStyle>;
	ref?: (instance: OtpInputRef) => void;
	onChange?: (value: string) => void;
	onComplete?: (value: string) => void;
}

interface OtpInputState
{
	value: string;
	textRevision: number;
	focused: boolean;
}

type OtpFieldRef = {
	focus: () => void;
	blur: (params?: { hideKeyboard?: boolean }) => void;
};

interface OtpCellProps
{
	testId: string;
	index: number;
	text: string;
	textRevision: number;
	maxLength: number;
	focused: boolean;
	editable: boolean;
	error: boolean;
	disabled: boolean;
	forwardRef?: (ref: OtpFieldRef) => void;
	onFocus?: () => void;
	onBlur?: () => void;
	onChangeText?: (text: string) => void;
}

export { OtpInputLength, OtpInputProps, OtpInputRef, OtpInputState, OtpCellProps, OtpFieldRef };
