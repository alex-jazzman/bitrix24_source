import { Dom, Extension, Type, type JsonObject } from 'main.core';
import { EventEmitter } from 'main.core.events';

import { renderWidgetWrapper } from '../component/wrapper/wrapper';
import { HIDE_BUTTON_CLICK_EVENT } from '../const/events';
import {
	loadWidgetApplication,
	type WidgetApplication,
} from '../infrastructure/service/widget-application-loader/widget-application-loader';

export type AiChatPanelEvents = {
	onHideButtonClick?: () => void;
	onError?: (errors: Array<unknown>) => void;
};

export type AiChatPanelOptions = {
	dialogId?: string;
	chatWidgetConfig?: JsonObject;
	events?: AiChatPanelEvents;
};

export class AiChatPanel
{
	#dialogId: string | undefined;
	#chatWidgetConfig: JsonObject;
	#events: AiChatPanelEvents;

	#wrapperContainer: HTMLElement | null = null;
	#contentContainer: HTMLElement | null = null;
	#widgetApplication: WidgetApplication | null = null;
	#widgetApplicationPromise: Promise<WidgetApplication> | null = null;
	#hideButtonClickHandler: (() => void) | null = null;
	#isMounted: boolean = false;

	constructor(options: AiChatPanelOptions)
	{
		if (options.dialogId !== undefined && !Type.isStringFilled(options.dialogId))
		{
			throw new Error('AiChatPanel: dialogId must be non-empty string');
		}

		this.#dialogId = options.dialogId;
		this.#chatWidgetConfig = options.chatWidgetConfig ?? {};
		this.#events = options.events ?? {};
	}

	preload(): Promise<WidgetApplication>
	{
		return this.#loadWidgetApplication();
	}

	async mount(targetContainer: HTMLElement): Promise<void>
	{
		if (this.#isMounted)
		{
			return;
		}

		if (!(targetContainer instanceof HTMLElement))
		{
			throw new Error('AiChatPanel: targetContainer must be HTMLElement');
		}

		this.#isMounted = true;

		const contextClass: string = Extension.getSettings('intranet.ai-chat-panel').contextClass || '';
		const { wrapperContainer, contentContainer } = renderWidgetWrapper(contextClass);
		this.#wrapperContainer = wrapperContainer;
		this.#contentContainer = contentContainer;

		Dom.append(this.#wrapperContainer, targetContainer);
		this.#subscribeEvents();

		const application = await this.#loadWidgetApplication();
		await application.mount({
			rootContainer: this.#contentContainer,
			dialogId: this.#dialogId,
			onError: this.#events.onError,
		});
		this.#widgetApplication = application;
	}

	async changeDialog(dialogId: string): Promise<void>
	{
		if (!Type.isStringFilled(dialogId))
		{
			console.warn('AiChatPanel: dialogId must be non-empty string, dialog not changed');

			return;
		}

		this.#dialogId = dialogId;

		if (!this.#widgetApplication)
		{
			return;
		}

		await this.#widgetApplication.changeDialog({ dialogId });
	}

	unmount(): void
	{
		if (!this.#isMounted)
		{
			return;
		}

		this.#unsubscribeEvents();
		this.#widgetApplication?.bitrixVue?.unmount();
		Dom.remove(this.#wrapperContainer);

		this.#widgetApplication = null;
		this.#wrapperContainer = null;
		this.#contentContainer = null;
		this.#isMounted = false;
	}

	#subscribeEvents(): void
	{
		if (!this.#events.onHideButtonClick)
		{
			return;
		}

		this.#hideButtonClickHandler = () => this.#events.onHideButtonClick?.();
		EventEmitter.subscribe(HIDE_BUTTON_CLICK_EVENT, this.#hideButtonClickHandler);
	}

	#unsubscribeEvents(): void
	{
		if (this.#hideButtonClickHandler)
		{
			EventEmitter.unsubscribe(HIDE_BUTTON_CLICK_EVENT, this.#hideButtonClickHandler);
			this.#hideButtonClickHandler = null;
		}
	}

	#loadWidgetApplication(): Promise<WidgetApplication>
	{
		if (!this.#widgetApplicationPromise)
		{
			this.#widgetApplicationPromise = loadWidgetApplication(this.#chatWidgetConfig).catch((error) => {
				this.#widgetApplicationPromise = null;
				throw error;
			});
		}

		return this.#widgetApplicationPromise;
	}
}
