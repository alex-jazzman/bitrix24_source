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
	dialogId: string,
	messageEvent: MessageEvent,
}

type IframeInsertTextOptions = {
	text?: string,
	withNewLine?: boolean,
	replace?: boolean,
}

type AppLayoutParams = {
	frameName: string,
	appProto: string,
	appHost: string,
	appPort: string,
	placementOptions?: { dialogId?: string },
}

type AppLayout = {
	params: AppLayoutParams,
}

type SourcePlacement = {
	layout: AppLayout,
	frame: HTMLIFrameElement,
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
		const { data: rawIframeContext, source } = messageEvent;
		if (!this.#isContextValid(rawIframeContext))
		{
			return;
		}

		const sourcePlacement = this.#findSourcePlacement(source);
		if (!this.#isSenderValid(messageEvent, sourcePlacement))
		{
			return;
		}

		const { method, requestId, callback, params }: RawIframeContext = rawIframeContext;
		const context = {
			requestId,
			callback,
			dialogId: this.#getSenderDialogId(sourcePlacement),
			messageEvent,
		};
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
			const chatId = this.#getChatId(context.dialogId);
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
			const chatId = this.#getChatId(context.dialogId);
			Messenger.textarea.insertText(chatId, text, { withNewLine, replace });
			this.#sendResponseToIframe(context, { result: { success: true } });
		}
		catch (error)
		{
			this.#sendResponseToIframe(context, { error: { message: error.message } });
		}
	}

	// a placement iframe stays alive while its popup is hidden, so the bridge cannot trust the origin
	// alone: a frame recognized among the loaded placements passes the whole set of checks - frame
	// identity, visibility, the origin of the application it was loaded for (a page the frame navigated
	// away to keeps no access) and the presence of the chat the placement was opened for. a window that
	// belongs to no placement is trusted by its origin alone, and only when it is the page origin
	// itself - a script running there already owns the whole document
	#isSenderValid(messageEvent: MessageEvent, sourcePlacement: ?SourcePlacement): boolean
	{
		if (!sourcePlacement)
		{
			return messageEvent.origin === window.location.origin;
		}

		const { layout, frame } = sourcePlacement;

		return this.#isFrameVisible(frame)
			&& this.#isAppOrigin(layout, messageEvent.origin)
			&& Type.isStringFilled(this.#getPlacementDialogId(layout));
	}

	// the frame of an application on its own hosting is loaded by a form submit and has no src,
	// so the origin is compared with the application parameters of the layout, the way rest does it
	#isAppOrigin(layout: AppLayout, origin: string): boolean
	{
		const { appProto, appHost, appPort } = layout.params;
		if (!Type.isStringFilled(appProto) || !Type.isStringFilled(appHost))
		{
			return false;
		}

		const appOrigin = `${appProto}://${appHost}`;

		// appHost keeps the port written in the application url, while the origin omits a default one
		return origin === appOrigin || `${origin}:${appPort}` === appOrigin;
	}

	#findSourcePlacement(source: ?Window): ?SourcePlacement
	{
		if (!source)
		{
			return null;
		}

		// a destroyed layout leaves a null record in the list instead of removing it
		const placements = Object.values(BX.rest?.layoutList ?? {})
			.filter((layout: ?AppLayout) => Type.isObject(layout?.params))
			.map((layout: AppLayout) => {
				return { layout, frame: document.getElementById(layout.params.frameName) };
			});

		return placements.find(({ frame }) => frame?.contentWindow === source) ?? null;
	}

	#isFrameVisible(frame: HTMLIFrameElement): boolean
	{
		return frame.getClientRects().length > 0;
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
		const isMethodValid = Object.hasOwn(this.#methodHandlers, method);

		return isRequestIdValid && isParamsValid && isMethodValid;
	}

	// a placement works with the chat it was opened for, and not with the one open in the messenger:
	// a chat shown over another chat keeps its own placements
	#getSenderDialogId(sourcePlacement: ?SourcePlacement): string
	{
		if (!sourcePlacement)
		{
			return this.#getCurrentDialogId();
		}

		return this.#getPlacementDialogId(sourcePlacement.layout);
	}

	#getPlacementDialogId(layout: AppLayout): string
	{
		return layout.params.placementOptions?.dialogId ?? '';
	}

	#getCurrentDialogId(): string
	{
		return this.#store.getters['application/getLayout'].entityId;
	}

	#getChatId(dialogId: string): number
	{
		const dialog = this.#store.getters['chats/get'](dialogId, true);
		// the getter answers with a blank chat when the dialog is not in the collection
		const chatId = dialog?.chatId ?? 0;
		if (chatId <= 0)
		{
			throw new Error('Chat of the placement dialog is not available');
		}

		return chatId;
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
