/* eslint-disable */
type ActionConfiguration = {
	position: BX.Mail.Client.Dialog.ActionPosition;
	actions: BaseDialogAction[];
};

type BaseDialogAction = {
	text: string;
	style: BX.UI.AirButtonStyle;
	onclick: () => void;
	id?: string;
};

type BaseDialogOptions = {
	id?: string;
	title?: string;
	width?: number;
	cacheable?: boolean;
};

type BeforeShowContentOptions<T> = {
	showLoader?: boolean;
	action: () => Promise<T> | T;
};

declare namespace BX.Mail.Client.Dialog {
	enum ActionPosition {
		center = "center",
		left = "left"
	}

	enum ContentPosition {
		center = "center",
		left = "left"
	}

	class BaseDialog {
		constructor(options?: BaseDialogOptions);
		show(): void;
		close(): void;
		getPopup(): BX.Main.Popup | null;
		setContent(node: HTMLElement): void;
		setContentAlign(align: ContentPosition): void;
		setActions(configuration: ActionConfiguration): void;
		setActionsAlign(align: ActionPosition): void;
		hideActions(): void;
		setTitle(title: string): void;
		setBodyPadding(padding: string): void;
		setWidth(width: number): void;
		showCloseIcon(): void;
		hideCloseIcon(): void;
		getButton(id: string): BX.UI.Button | null;
		showLoader(): void;
		hideLoader(): void;
		doBeforeShowContent<T>(options: BeforeShowContentOptions<T>): Promise<T>;
		onClose(): void;
	}
}
