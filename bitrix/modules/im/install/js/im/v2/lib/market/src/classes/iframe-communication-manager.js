import { Event, Type, type JsonObject } from 'main.core';
import { type Store } from 'ui.vue3.vuex';

import { Messenger } from 'im.public';
import { Core } from 'im.v2.application.core';

type RawIframeContext = {
	method: string,
	requestId: string,
	callback: string,
	params: JsonObject | string,
}

type IframeContext = {
	requestId: string,
	callback: string,
	messageEvent: MessageEvent,
}

type IframeInsertTextOptions = {
	text?: string,
	withNewLine?: boolean,
	replace?: boolean,
}

type AppLayoutParams = {
	appProto: string,
	appHost: string,
	appPort: string,
}

type AppLayout = {
	params: AppLayoutParams,
}

type ResponseData = { result: JsonObject } | { error: { message: string } };

export class IframeCommunicationManager
{
	#methodHandlers: { [string]: Function };
	#store: Store;

	static init(): IframeCommunicationManager
	{
		return new IframeCommunicationManager();
	}

	constructor()
	{
		this.#store = Core.getStore();
		this.#methodHandlers = {
			'im:getImTextareaContent': this.#handleGetImTextareaContent.bind(this),
			'im:setImTextareaContent': this.#handleSetImTextareaContent.bind(this),
		};

		Event.bind(window, 'message', this.#onMessageEvent.bind(this));
	}

	#onMessageEvent(messageEvent: MessageEvent): void
	{
		const { origin, data: rawIframeContext } = messageEvent;
		if (!this.#isOriginValid(origin) || !this.#isContextValid(rawIframeContext))
		{
			return;
		}

		const { method, requestId, callback, params }: RawIframeContext = rawIframeContext;
		const context = { requestId, callback, messageEvent };
		const handler = this.#methodHandlers[method];
		if (handler)
		{
			handler(context, params);
		}
	}

	async #handleGetImTextareaContent(context: IframeContext): Promise<void>
	{
		try
		{
			const chatId = this.#getChatId();
			const text = await Messenger.textarea.getText(chatId);
			this.#sendResponseToIframe(context, { result: { text } });
		}
		catch (error)
		{
			this.#sendResponseToIframe(context, { error: { message: error.message } });
		}
	}

	#handleSetImTextareaContent(context: IframeContext, params: IframeInsertTextOptions): void
	{
		try
		{
			const { text = '', withNewLine = false, replace = false } = params;
			const chatId = this.#getChatId();
			Messenger.textarea.insertText(chatId, text, { withNewLine, replace });
			this.#sendResponseToIframe(context, { result: { success: true } });
		}
		catch (error)
		{
			this.#sendResponseToIframe(context, { error: { message: error.message } });
		}
	}

	#isOriginValid(origin: string): boolean
	{
		if (origin === window.location.origin)
		{
			return true;
		}

		return this.#isRegisteredAppOrigin(origin);
	}

	#isRegisteredAppOrigin(origin: string): boolean
	{
		return Object.values(BX.rest.layoutList).some((layout: AppLayout) => {
			const { appProto, appHost, appPort } = layout.params;
			const appOrigin = `${appProto}://${appHost}`;
			const originWithPort = `${origin}:${appPort}`;

			return origin === appOrigin || originWithPort === appOrigin;
		});
	}

	#isContextValid(rawContext: RawIframeContext): boolean
	{
		if (!Type.isObject(rawContext))
		{
			return false;
		}

		const { requestId, params, method } = rawContext;
		const isRequestIdValid = Type.isStringFilled(requestId);
		const isParamsValid = Type.isObject(params) || Type.isString(params);
		const isMethodValid = method in this.#methodHandlers;

		return isRequestIdValid && isParamsValid && isMethodValid;
	}

	#getChatId(): number
	{
		const dialogId = this.#store.getters['application/getLayout'].entityId;
		const dialog = this.#store.getters['chats/get'](dialogId, true);

		return dialog.chatId;
	}

	#sendResponseToIframe(context: IframeContext, data: ResponseData): void
	{
		const { messageEvent, requestId, callback } = context;
		if (!messageEvent.source || !callback)
		{
			return;
		}

		const message = this.#buildResponseMessage(callback, requestId, data);
		messageEvent.source.postMessage(message, messageEvent.origin);
	}

	#buildResponseMessage(callback: string, requestId: string, data: ResponseData): string
	{
		const payload = data.result ?? data.error ?? {};

		return `${callback}:${JSON.stringify({ requestId, ...payload })}`;
	}
}
