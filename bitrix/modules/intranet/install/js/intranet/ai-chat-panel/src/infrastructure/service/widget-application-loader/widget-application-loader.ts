import { Runtime, type JsonObject } from 'main.core';

export type WidgetApplication = {
	mount: (payload: {
		rootContainer: HTMLElement;
		dialogId?: string;
		onError?: (errors: Array<unknown>) => void;
	}) => Promise<unknown>;
	changeDialog: (payload: { dialogId?: string; chatId?: number }) => Promise<unknown>;
	bitrixVue?: { unmount: () => void };
};

export function loadWidgetApplication(chatWidgetConfig: JsonObject = {}): Promise<WidgetApplication>
{
	return Runtime
		.loadExtension('im.v2.application.integration.ai-assistant-widget')
		.then(() => BX.Messenger.v2.Application.Launch('aiAssistantWidget', { embedded: true, ...chatWidgetConfig }) as Promise<WidgetApplication>);
}
