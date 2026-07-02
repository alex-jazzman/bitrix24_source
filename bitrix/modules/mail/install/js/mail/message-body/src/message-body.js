import { Dom, Event } from 'main.core';

export type MessageBodyOptionsType = {
	container: HTMLElement,
	messageId: number,
	prefix?: string,
}

export class MessageBody
{
	#container: HTMLElement;
	#messageId: number;
	#prefix: string;
	#iframeResizeHandler: ?Function = null;
	#iframe: ?HTMLIFrameElement = null;

	constructor(options: MessageBodyOptionsType)
	{
		this.#container = options?.container;
		this.#messageId = options?.messageId;

		if (!this.#container || !this.#messageId)
		{
			return;
		}

		this.#prefix = options.prefix || 'mail-msg';
	}

	getIframeId(): string
	{
		return `${this.#prefix}-iframe-${this.#messageId}`;
	}

	getMessageType(): string
	{
		return `${this.#prefix}-resize-iframe`;
	}

	getStylesMessageType(): string
	{
		return `${this.#prefix}-set-styles`;
	}

	getBodyClass(): string
	{
		return `${this.#prefix}-view-body`;
	}

	getQuoteUnfoldedClass(): string
	{
		return `${this.#prefix}-quote-unfolded`;
	}

	getPrintMessageType(): string
	{
		return `${this.#prefix}-print`;
	}

	getIframe(): ?HTMLIFrameElement
	{
		return this.#iframe;
	}

	renderTo(html: string): void
	{
		const iframeId = this.getIframeId();

		if (document.getElementById(iframeId))
		{
			return;
		}

		const iframeContent = this.#buildIframeContent(html);
		const blob = new Blob([iframeContent], { type: 'text/html' });
		const blobUrl = URL.createObjectURL(blob);

		const iframe = document.createElement('iframe');
		iframe.id = iframeId;
		iframe.src = blobUrl;
		iframe.width = '100%';
		iframe.sandbox = 'allow-popups allow-popups-to-escape-sandbox allow-scripts allow-modals';
		iframe.referrerPolicy = 'no-referrer';
		Dom.addClass(iframe, `${this.#prefix}-iframe`);

		Event.bind(iframe, 'load', () => {
			URL.revokeObjectURL(blobUrl);
		});

		Dom.clean(this.#container);
		Dom.append(iframe, this.#container);

		this.#iframe = iframe;
		this.#bindIframeEvents(iframe);
	}

	destroy(): void
	{
		if (this.#iframeResizeHandler)
		{
			Event.unbind(window, 'message', this.#iframeResizeHandler);
			this.#iframeResizeHandler = null;
		}

		if (this.#iframe)
		{
			Dom.remove(this.#iframe);
			this.#iframe = null;
		}
	}

	print(headerHtml: string, headerStyles: string): void
	{
		if (!this.#iframe || !this.#iframe.contentWindow)
		{
			return;
		}

		this.#iframe.contentWindow.postMessage({
			type: this.getPrintMessageType(),
			headerHtml,
			headerStyles,
		}, '*');
	}

	#bindIframeEvents(iframe: HTMLIFrameElement): void
	{
		const sendStylesToIframe = () => {
			if (!iframe || !iframe.contentWindow)
			{
				return;
			}

			const computedStyle = getComputedStyle(document.body);
			iframe.contentWindow.postMessage({
				type: this.getStylesMessageType(),
				styles: {
					'--ui-font-family-primary': computedStyle.getPropertyValue('--ui-font-family-primary'),
					'--ui-font-family-helvetica': computedStyle.getPropertyValue('--ui-font-family-helvetica'),
					'--ui-font-weight-bold': computedStyle.getPropertyValue('--ui-font-weight-bold'),
					'--ui-font-size-md': computedStyle.getPropertyValue('--ui-font-size-md'),
				},
			}, '*');
		};

		Event.bind(iframe, 'load', sendStylesToIframe);
		sendStylesToIframe();

		if (!this.#iframeResizeHandler)
		{
			this.#iframeResizeHandler = (event) => {
				if (event.data && event.data.type === this.getMessageType())
				{
					const targetIframe = document.getElementById(this.getIframeId());
					if (targetIframe && event.data.id === this.#messageId)
					{
						const newHeight = event.data.height;
						Dom.style(targetIframe, 'height', `${newHeight}px`);
					}
				}
			};

			Event.bind(window, 'message', this.#iframeResizeHandler);
		}
	}

	#buildIframeContent(html: string): string
	{
		const styles = this.#buildStyles();
		const script = this.#buildScript();
		const bodyClass = this.getBodyClass();

		return `
			<!DOCTYPE html>
			<html>
				<head>
					<meta charset="UTF-8">
					<meta name="referrer" content="no-referrer">
					<base target="_blank">
					<style>${styles}</style>
					<script>${script}</script>
				</head>
				<body>
					<div class="${bodyClass}">${html}</div>
				</body>
			</html>
		`;
	}

	#buildStyles(): string
	{
		const bodyClass = this.getBodyClass();
		const quoteUnfoldedClass = this.getQuoteUnfoldedClass();

		return `
			body {
				margin: 0;
				padding: 0;
				font-family: var(--ui-font-family-primary, var(--ui-font-family-helvetica)), sans-serif;
				font-size: var(--ui-font-size-md, 14px);
			}
			img { max-width: 100%; height: auto; }
			.${bodyClass} h1 {
				color: black;
				display: block;
				font-size: 2em;
				font-weight: var(--ui-font-weight-bold);
			}
			.${bodyClass} a:-webkit-any-link {
				color: -webkit-link;
				text-decoration: underline;
				cursor: pointer;
			}
			.${bodyClass} {
				position: relative;
				padding: 10px 20px 33px 20px;
				color: #535c69;
				overflow-x: auto;
				word-wrap: break-word;
			}
			.${bodyClass} blockquote {
				margin: 0 0 0 5px;
				padding: 5px 5px 5px 8px;
				border-left: 4px solid #e2e3e5;
			}
			.${bodyClass} blockquote:not(.${quoteUnfoldedClass}) {
				position: relative;
				overflow: hidden;
				box-sizing: border-box;
				width: 32px;
				height: 12px;
				margin: 0 0 0 10px;
				border: none;
				cursor: pointer;
			}
			.${bodyClass} blockquote:not(.${quoteUnfoldedClass}):after {
				content: "...";
				display: block;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				color: #535c69;
				text-align: center;
				line-height: 12px;
				font-size: 10px;
				background: #e2e3e5;
			}
		`;
	}

	#buildScript(): string
	{
		const messageType = this.getMessageType();
		const stylesMessageType = this.getStylesMessageType();
		const printMessageType = this.getPrintMessageType();
		const quoteUnfoldedClass = this.getQuoteUnfoldedClass();

		return `
			const MESSAGE_ID = ${this.#messageId};
			const MESSAGE_TYPE = "${messageType}";
			const STYLES_MESSAGE_TYPE = "${stylesMessageType}";
			const PRINT_MESSAGE_TYPE = "${printMessageType}";
			const QUOTE_UNFOLDED_CLASS = "${quoteUnfoldedClass}";

			let lastHeight = 0;

			function sendHeight()
			{
				const content = document.body?.firstElementChild;
				if (!content)
				{
					return;
				}

				const height = content.offsetHeight;
				if (height === lastHeight)
				{
					return;
				}

				lastHeight = height;
				parent.postMessage({ type: MESSAGE_TYPE, height: height, id: MESSAGE_ID }, '*');
			}

			function handlePrint(data)
			{
				const oldHeader = document.querySelector('.print-header');
				if (oldHeader)
				{
					oldHeader.remove();
				}

				const oldStyle = document.querySelector('.print-header-style');
				if (oldStyle)
				{
					oldStyle.remove();
				}

				const headerDiv = document.createElement('div');
				headerDiv.className = 'print-header';
				headerDiv.innerHTML = data.headerHtml;

				const styleEl = document.createElement('style');
				styleEl.className = 'print-header-style';
				styleEl.textContent = data.headerStyles;

				document.body.insertBefore(styleEl, document.body.firstChild);
				document.body.insertBefore(headerDiv, document.body.firstChild);

				window.addEventListener('afterprint', function() {
					headerDiv.remove();
					styleEl.remove();
				}, { once: true });

				window.print();
			}

			window.addEventListener("message", function(event) {
				if (!event.data || !event.data.type)
				{
					return;
				}

				if (event.data.type === STYLES_MESSAGE_TYPE)
				{
					const styles = event.data.styles;
					const root = document.documentElement;
					Object.keys(styles).forEach(function(key) {
						root.style.setProperty(key, styles[key]);
					});

					window.requestAnimationFrame(sendHeight);
				}

				if (event.data.type === PRINT_MESSAGE_TYPE)
				{
					handlePrint(event.data);
				}
			});

			window.addEventListener("load", function() {
				const quotes = document.querySelectorAll("blockquote");
				for (let i = 0; i < quotes.length; i++)
				{
					quotes[i].addEventListener("click", function() {
						this.classList.add(QUOTE_UNFOLDED_CLASS);
						sendHeight();
					});
				}

				sendHeight();
			});

			const resizeObserver = new ResizeObserver(() => {
				sendHeight();
			});

			function observeContent()
			{
				const content = document.body?.firstElementChild;
				if (content)
				{
					resizeObserver.observe(content);
				}
			}

			if (document.body?.firstElementChild)
			{
				observeContent();
			}
			else
			{
				window.addEventListener('DOMContentLoaded', observeContent);
			}
		`;
	}
}
