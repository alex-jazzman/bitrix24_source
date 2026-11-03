import { Dom, Type } from 'main.core';

import { type Screen } from '../../../application/screen';

export type MessageBodyLoadData = {
	messageHtml?: unknown,
	quote?: unknown,
};

export type MessageBodyLoadResponse = {
	data?: MessageBodyLoadData,
};

export type ComponentActionOptions = {
	mode: 'class',
	data: {
		id: number,
	},
};

export type ComponentActionRunner = (
	componentName: string,
	actionName: string,
	options: ComponentActionOptions,
) => Promise<MessageBodyLoadResponse>;

export type MessageBodyPrintOptions = {
	slider?: unknown,
	getHeaderHtml: () => string,
	getHeaderStyles: () => string,
};

export type MessageBodyInstance = {
	renderTo(html: string): void,
	destroy(): void,
	getIframe(): HTMLIFrameElement | null | undefined,
	bindPrintControl?(options: MessageBodyPrintOptions): boolean,
};

export type MessageBodyConstructor = new (options: {
	container: HTMLElement,
	messageId: number,
	prefix?: string,
}) => MessageBodyInstance;

export type MessageBodyAdapterOptions = {
	screen: Screen,
	host: HTMLElement,
	messageId: number,
	prefix?: string,
	bodyConstructor?: MessageBodyConstructor,
	runComponentAction?: ComponentActionRunner,
	printOptions?: MessageBodyPrintOptions,
	title?: string,
	titleTemplate?: string,
	onLoading?: () => void,
	onReady?: () => void,
	onError?: () => void,
	onQuote?: (quote: string) => void,
};

type BitrixGlobal = {
	Mail?: {
		MessageBody?: MessageBodyConstructor,
	},
	ajax?: {
		runComponentAction?: ComponentActionRunner,
	},
};

const ComponentName = 'bitrix:mail.client.message.view';
const LoadBodyAction = 'getHtmlBody';

function getBitrix(): BitrixGlobal | undefined
{
	return (globalThis as { BX?: BitrixGlobal }).BX;
}

function runDefaultComponentAction(
	componentName: string,
	actionName: string,
	options: ComponentActionOptions,
): Promise<MessageBodyLoadResponse>
{
	const runner = getBitrix()?.ajax?.runComponentAction;
	if (!runner)
	{
		return Promise.reject(new Error('BX.ajax.runComponentAction is not available'));
	}

	return runner(componentName, actionName, options);
}

function getDefaultMessageBodyConstructor(): MessageBodyConstructor
{
	const constructor = getBitrix()?.Mail?.MessageBody;
	if (!constructor)
	{
		throw new Error('BX.Mail.MessageBody is not available');
	}

	return constructor;
}

export class MessageBodyAdapter
{
	#options: MessageBodyAdapterOptions;
	#messageBody: MessageBodyInstance | null = null;
	#destroyed = false;

	constructor(options: MessageBodyAdapterOptions)
	{
		this.#options = options;
		this.#options.screen.registerCleanup(() => this.destroy());
	}

	mountTrustedHtml(html: string, capturedGeneration: number): boolean
	{
		if (this.#destroyed)
		{
			return false;
		}

		return this.#options.screen.guardCompletion(capturedGeneration, () => {
			this.#getMessageBody().renderTo(html);
			this.#applyIframeTitle();
			this.#bindPrintControl();
			this.#options.onReady?.();
		});
	}

	start(): Promise<boolean>
	{
		if (this.#destroyed || !this.#options.screen.isAlive())
		{
			return Promise.resolve(false);
		}

		const capturedGeneration = this.#options.screen.captureGeneration();
		this.#options.onLoading?.();

		return this.#runComponentAction(ComponentName, LoadBodyAction, {
			mode: 'class',
			data: {
				id: this.#options.messageId,
			},
		}).then(
			(response) => this.#handleSuccess(response, capturedGeneration),
			() => this.#handleFailure(capturedGeneration),
		);
	}

	destroy(): void
	{
		if (this.#destroyed)
		{
			return;
		}

		this.#destroyed = true;
		this.#messageBody?.destroy();
		this.#messageBody = null;
		Dom.clean(this.#options.host);
	}

	#handleSuccess(response: MessageBodyLoadResponse, capturedGeneration: number): boolean
	{
		const data = response.data;
		const quote = Type.isString(data?.quote) ? data.quote : null;
		const messageHtml = data?.messageHtml;

		if (!Type.isString(messageHtml))
		{
			return this.#options.screen.guardCompletion(capturedGeneration, () => {
				this.#options.onReady?.();
			});
		}

		const mounted = this.mountTrustedHtml(messageHtml, capturedGeneration);
		if (mounted && quote !== null)
		{
			this.#options.screen.guardCompletion(capturedGeneration, () => {
				this.#options.onQuote?.(quote);
			});
		}

		return mounted;
	}

	#handleFailure(capturedGeneration: number): boolean
	{
		return this.#options.screen.guardCompletion(capturedGeneration, () => {
			this.#options.onError?.();
		});
	}

	#getMessageBody(): MessageBodyInstance
	{
		if (!this.#messageBody)
		{
			const MessageBody = this.#options.bodyConstructor ?? getDefaultMessageBodyConstructor();
			this.#messageBody = new MessageBody({
				container: this.#options.host,
				messageId: this.#options.messageId,
				prefix: this.#options.prefix ?? 'mail-msg',
			});
		}

		return this.#messageBody;
	}

	#runComponentAction(
		componentName: string,
		actionName: string,
		options: ComponentActionOptions,
	): Promise<MessageBodyLoadResponse>
	{
		const runner = this.#options.runComponentAction ?? runDefaultComponentAction;

		return runner(componentName, actionName, options);
	}

	#applyIframeTitle(): void
	{
		const iframe = this.#messageBody?.getIframe();
		if (!iframe)
		{
			return;
		}

		if (this.#options.title)
		{
			iframe.title = this.#options.title;

			return;
		}

		const sender = this.#options.host
			.closest('.mail-msg-view-details')
			?.querySelector('.mail-msg-view-sender-name')
			?.textContent
			?.trim()
		;
		if (sender && this.#options.titleTemplate)
		{
			iframe.title = this.#options.titleTemplate.replace('#SENDER#', sender);
		}
	}

	#bindPrintControl(): void
	{
		if (this.#options.printOptions)
		{
			this.#messageBody?.bindPrintControl?.(this.#options.printOptions);
		}
	}
}
