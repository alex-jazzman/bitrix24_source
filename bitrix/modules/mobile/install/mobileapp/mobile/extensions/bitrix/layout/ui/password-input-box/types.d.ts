type PasswordInputBoxConfirmHandler = (
	password: string,
	/**
	 * Null when PasswordInputBox is opened through PageManager.openComponent without parentWidget.
	 */
	layoutWidget: object | null,
) => void | Promise<unknown>;

type PasswordInputBoxChangeHandler = (password: string) => void;

type PasswordInputBoxProps = {
	testId?: string;
	title?: string;
	placeholder?: string;
	confirmButtonText?: string;
	password?: string;
	pending?: boolean;
	layoutWidget?: object;
	widgetParams?: object;
	onConfirm?: PasswordInputBoxConfirmHandler;
	onChange?: PasswordInputBoxChangeHandler;
	onClose?: () => void;
};

type PasswordInputBoxEventsType = {
	CONFIRM: string;
	CLOSE: string;
	CHANGE: string;
	CONFIRM_RESULT: string;
};

declare class PasswordInputBox
{
	constructor(props?: PasswordInputBoxProps);

	static open(data?: PasswordInputBoxProps, parentWidget?: object): Promise<unknown>;
}

export {
	PasswordInputBox,
	PasswordInputBoxChangeHandler,
	PasswordInputBoxEventsType,
	PasswordInputBoxConfirmHandler,
	PasswordInputBoxProps,
};

export const PasswordInputBoxEvents: PasswordInputBoxEventsType;
