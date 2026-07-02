import type { Dialog, Item as DialogItem } from 'ui.entity-selector';

export type SelectorDialogItem = DialogItem;

export type MessageBoxInstance = {
	close(): void;
};

export type MessageBoxOptions = {
	title: string;
	message: string;
	buttons: unknown;
	okCaption: string;
	cancelCaption: string;
	useAirDesign: boolean;
	popupOptions: {
		closeByEsc: boolean;
		focusTrap: boolean;
	};
	onOk: (messageBoxInstance: MessageBoxInstance) => void;
	onCancel: (messageBoxInstance: MessageBoxInstance) => void;
};

export type AjaxErrorItem = {
	message: string;
};

export type AjaxResponseWithErrors = {
	errors?: AjaxErrorItem[];
};

export type SendToChatData = {
	dialogId: string;
	activityId?: number;
	messageId?: number;
};

export type SelectorDialogEvents = {
	'Item:onSelect': (event: { getData(): { item?: SelectorDialogItem | null } }) => void;
	onHide: () => void;
};

export type SelectorDialogOptions = {
	targetNode: HTMLElement | null;
	events?: SelectorDialogEvents;
	popupOptions?: {
		overlay?: boolean;
		targetContainer?: HTMLElement;
		className?: string;
	};
	[key: string]: unknown;
};

export type SelectorDialogClass = {
	new(dialogOptions: SelectorDialogOptions): Dialog;
	getById(id: string): Dialog | null;
};

export type SliderInstance = {
	getFrameWindow(): Window;
};

export type RootBX = {
	Runtime: {
		loadExtension(extensions: readonly string[]): Promise<unknown[]>;
	};
	ajax: {
		runAction(action: string, options: { data: SendToChatData }): Promise<AjaxResponseWithErrors>;
	};
	addCustomEvent(eventName: string, handler: () => void): void;
	UI: {
		EntitySelector: {
			Dialog: SelectorDialogClass;
		};
		Dialogs: {
			MessageBox: {
				show(options: MessageBoxOptions): void;
			};
			MessageBoxButtons: {
				OK_CANCEL: unknown;
			};
		};
		Notification: {
			Center: {
				notify(options: { content: string }): void;
			};
		};
	};
	Messenger: {
		Public: {
			openChat(dialogId: string): void;
		};
	};
	SidePanel: {
		Instance: {
			getSliderByWindow(targetWindow: Window): SliderInstance | null;
		};
	};
};

export type DialogWindow = Window & {
	BX: RootBX;
};
