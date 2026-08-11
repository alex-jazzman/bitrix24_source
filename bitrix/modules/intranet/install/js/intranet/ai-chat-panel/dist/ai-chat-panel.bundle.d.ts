/* eslint-disable */
type AiChatPanelOptions = {
	dialogId?: string;
	chatWidgetConfig?: BX.JsonObject;
	events?: AiChatPanelEvents;
};

type AiChatPanelEvents = {
	onHideButtonClick?: () => void;
	onError?: (errors: Array<unknown>) => void;
};

type WidgetApplication = {
	mount: (payload: {
		rootContainer: HTMLElement;
		dialogId?: string;
		onError?: (errors: Array<unknown>) => void;
	}) => Promise<unknown>;
	changeDialog: (payload: {
		dialogId?: string;
		chatId?: number;
	}) => Promise<unknown>;
	bitrixVue?: {
		unmount: () => void;
	};
};

declare namespace BX.Intranet {
	class AiChatPanel {
		constructor(options: AiChatPanelOptions);
		preload(): Promise<WidgetApplication>;
		mount(targetContainer: HTMLElement): Promise<void>;
		changeDialog(dialogId: string): Promise<void>;
		unmount(): void;
	}
}
