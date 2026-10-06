import { Dom, Event, Type } from 'main.core';

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
	#activeJob: ?Object = null;
	#printLabel: ?Object = null;
	#printOptions: ?Object = null;

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

	getHeightLimitMessageType(): string
	{
		return `${this.#prefix}-set-height-limit`;
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

	getPrintSourceMessageType(): string
	{
		return `${this.#prefix}-print-source`;
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
		this.#activeJob?.cleanup();

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

	print(headerHtml: string, headerStyles: string): Promise<void>
	{
		if (!this.#iframe || !this.#iframe.contentWindow)
		{
			return Promise.resolve();
		}

		if (this.#activeJob)
		{
			return this.#activeJob.prepared;
		}

		const printFrame = document.createElement('iframe');
		printFrame.setAttribute('sandbox', 'allow-modals allow-same-origin');
		printFrame.referrerPolicy = 'no-referrer';

		const job = this.#createPrintJob(printFrame);
		this.#activeJob = job;
		this.#print(job, headerHtml, headerStyles).catch((error) => {
			if (!job.preparedSettled)
			{
				job.rejectPrepared(error);
			}
			job.cleanup();
		});

		return job.prepared;
	}

	bindPrintControl(options: Object): boolean
	{
		const hasExplicitSlider = Object.prototype.hasOwnProperty.call(options, 'slider');
		const slider = hasExplicitSlider ? options.slider : BX.SidePanel.Instance.getTopSlider();
		const printLabel = slider?.getPrintLabel();
		if (!printLabel)
		{
			return false;
		}

		this.#printOptions = options;
		if (this.#printLabel === printLabel)
		{
			return true;
		}

		this.#printLabel = printLabel;
		const defaultOnclick = printLabel.getOnclick();
		printLabel.setOnclick((label, currentSlider) => {
			const printButton = printLabel.getContainer();
			if (printButton.disabled)
			{
				return Promise.resolve();
			}

			if (!this.#iframe)
			{
				defaultOnclick?.(label, currentSlider);

				return Promise.resolve();
			}

			const printContent = [printLabel.getIconBox(), printLabel.getTextContainer()];
			const printLoader = new BX.Loader({
				target: printButton,
				size: 18,
				color: '#fff',
			});
			printLoader.show();
			printContent.forEach((element) => Dom.style(element, 'visibility', 'hidden'));
			printButton.disabled = true;
			printButton.setAttribute('aria-busy', 'true');

			let reset = false;
			const resetPrintButton = () => {
				if (reset)
				{
					return;
				}

				reset = true;
				printLoader.destroy();
				printContent.forEach((element) => Dom.style(element, 'visibility', ''));
				printButton.disabled = false;
				printButton.removeAttribute('aria-busy');
			};

			return Promise.resolve().then(() => {
				return this.print(
					this.#printOptions.getHeaderHtml(),
					this.#printOptions.getHeaderStyles(),
				);
			}).then(resetPrintButton, resetPrintButton);
		});

		return true;
	}

	async #print(job: Object, headerHtml: string, headerStyles: string): Promise<void>
	{
		const printFrame = job.frame;
		const printSource = await this.#requestPrintSource(2000);
		if (this.#activeJob !== job)
		{
			return;
		}
		Dom.style(printFrame, 'cssText', `all: initial !important; display: block !important; position: fixed !important; left: -100000px !important; top: 0 !important; width: ${printSource.width}px !important; height: 768px !important; border: 0 !important; pointer-events: none !important;`);
		const frameReady = this.#waitForFrameLoad(printFrame, 2000);
		printFrame.srcdoc = '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="referrer" content="no-referrer"></head><body></body></html>';
		document.body.append(printFrame);

		await frameReady;
		if (
			this.#activeJob !== job
			|| !printFrame.contentWindow
			|| !printFrame.contentDocument
		)
		{
			return;
		}

		const roots = this.#renderPrintDocument(printFrame.contentDocument, {
			headerHtml,
			headerStyles,
			messageHtml: printSource.html,
			messageStyles: this.#buildStyles(),
		});
		await this.#waitForPrintResources(printFrame.contentDocument, roots, 2000);
		if (this.#activeJob !== job)
		{
			return;
		}

		const printWindow = printFrame.contentWindow;
		let afterPrintReceived = false;
		const handleAfterPrint = () => {
			afterPrintReceived = true;
			job.cleanup();
		};

		const handleReturn = () => {
			job.scheduleCleanup(afterPrintReceived ? 0 : 300);
		};

		const handleVisibility = () => {
			if (document.visibilityState === 'visible')
			{
				handleReturn();
			}
		};
		Event.bind(printWindow, 'afterprint', handleAfterPrint, { once: true });
		job.cleanupCallbacks.add(() => Event.unbind(printWindow, 'afterprint', handleAfterPrint));
		printWindow.focus();
		Event.bind(window, 'focus', handleReturn, { once: true });
		Event.bind(printWindow, 'focus', handleReturn, { once: true });
		Event.bind(document, 'visibilitychange', handleVisibility);
		job.cleanupCallbacks.add(() => Event.unbind(window, 'focus', handleReturn));
		job.cleanupCallbacks.add(() => Event.unbind(printWindow, 'focus', handleReturn));
		job.cleanupCallbacks.add(() => Event.unbind(document, 'visibilitychange', handleVisibility));
		printWindow.print();
		job.resolvePrepared();
		await job.finished;
	}

	#createPrintJob(frame: HTMLIFrameElement): Object
	{
		let resolvePrepared = () => {};

		let rejectPrepared = () => {};

		const prepared = new Promise((resolve, reject) => {
			resolvePrepared = resolve;
			rejectPrepared = reject;
		});
		let resolveFinished = () => {};
		const finished = new Promise((resolve) => {
			resolveFinished = resolve;
		});
		const job = {
			frame,
			prepared,
			finished,
			preparedSettled: false,
			cleaned: false,
			cleanupTimers: new Set(),
			cleanupCallbacks: new Set(),
			cleanup: () => {},
			scheduleCleanup: () => {},
			resolvePrepared: () => {},
			rejectPrepared: () => {},
		};
		job.resolvePrepared = () => {
			if (!job.preparedSettled)
			{
				job.preparedSettled = true;
				resolvePrepared();
			}
		};

		job.rejectPrepared = (error) => {
			if (!job.preparedSettled)
			{
				job.preparedSettled = true;
				rejectPrepared(error);
			}
		};

		job.cleanup = () => {
			if (job.cleaned)
			{
				return;
			}
			job.cleaned = true;
			job.cleanupTimers.forEach((timer) => clearTimeout(timer));
			job.cleanupTimers.clear();
			job.cleanupCallbacks.forEach((callback) => callback());
			job.cleanupCallbacks.clear();
			job.frame.remove();
			resolveFinished();
			if (this.#activeJob === job)
			{
				this.#activeJob = null;
			}
		};

		job.scheduleCleanup = (delay) => {
			if (job.cleaned)
			{
				return;
			}
			const timer = setTimeout(() => {
				job.cleanupTimers.delete(timer);
				job.cleanup();
			}, delay);
			job.cleanupTimers.add(timer);
		};
		job.scheduleCleanup(120_000);

		return job;
	}

	#requestPrintSource(timeout: number): Promise<Object>
	{
		const iframe = this.#iframe;
		const requestId = `${this.#messageId}-${Date.now()}-${Math.random()}`;

		return new Promise((resolve, reject) => {
			let timer = null;
			const cleanup = () => {
				clearTimeout(timer);
				Event.unbind(window, 'message', onMessage);
			};

			const onMessage = (event) => {
				const data = event.data;
				if (
					event.source !== iframe.contentWindow
					|| !data
					|| data.type !== this.getPrintSourceMessageType()
					|| data.id !== this.#messageId
					|| data.requestId !== requestId
				)
				{
					return;
				}

				cleanup();
				if (!Type.isString(data.html) || data.html.length > 20_000_000)
				{
					reject(new Error('Invalid print source'));

					return;
				}

				const width = Math.max(320, Math.min(4000, Number(data.width) || 1024));
				resolve({ html: data.html, width });
			};

			Event.bind(window, 'message', onMessage);
			timer = setTimeout(() => {
				cleanup();
				reject(new Error('Print source timeout'));
			}, timeout);
			iframe.contentWindow.postMessage({
				type: this.getPrintMessageType(),
				id: this.#messageId,
				requestId,
			}, '*');
		});
	}

	#renderPrintDocument(printDocument: Document, data: Object): Array<ShadowRoot>
	{
		Dom.style(printDocument.documentElement, 'cssText', 'margin: 0; padding: 0;');
		Dom.style(printDocument.body, 'cssText', 'margin: 0; padding: 0;');

		const header = printDocument.createElement('header');
		header.className = 'print-header';
		Dom.style(header, 'cssText', 'position: relative; z-index: 1; background: #fff;');
		const headerRoot = header.attachShadow({ mode: 'closed' });
		headerRoot.innerHTML = `<style>${data.headerStyles}</style><div class="print-header">${data.headerHtml}</div>`;

		const message = printDocument.createElement('main');
		message.className = 'print-message';
		Dom.style(message, 'cssText', 'display: block; position: relative; z-index: 0; contain: style; isolation: isolate;');
		const outerRoot = message.attachShadow({ mode: 'closed' });
		const innerHost = printDocument.createElement('div');
		Dom.style(innerHost, 'cssText', 'display: block; position: relative; contain: style; isolation: isolate;');
		outerRoot.append(innerHost);
		const innerRoot = innerHost.attachShadow({ mode: 'closed' });
		innerRoot.innerHTML = `<style>${data.messageStyles}.mail-print-document-root,.mail-print-body-root{display:block;box-sizing:border-box;}</style><div class="mail-print-document-root"><div class="mail-print-body-root">${data.messageHtml}</div></div>`;

		printDocument.body.append(header, message);

		return [headerRoot, outerRoot, innerRoot];
	}

	async #waitForPrintResources(
		printDocument: Document,
		roots: Array<ShadowRoot>,
		timeout: number,
	): Promise<void>
	{
		const resources = [printDocument.fonts?.ready];
		const images = roots.flatMap((root) => [...root.querySelectorAll('img')]);
		images.forEach((image) => {
			if (image.complete)
			{
				resources.push(image.decode?.().catch(() => {}));
			}
			else
			{
				resources.push(new Promise((resolve) => {
					Event.bind(image, 'load', resolve, { once: true });
					Event.bind(image, 'error', resolve, { once: true });
				}));
			}
		});
		await Promise.race([
			Promise.allSettled(resources.filter(Boolean)),
			new Promise((resolve) => {
				setTimeout(resolve, timeout);
			}),
		]);
		await new Promise((resolve) => {
			requestAnimationFrame(() => requestAnimationFrame(resolve));
		});
	}

	#waitForFrameLoad(frame: HTMLIFrameElement, timeout: number): Promise<void>
	{
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => reject(new Error('Print frame load timeout')), timeout);
			Event.bind(frame, 'load', () => {
				clearTimeout(timer);
				resolve();
			}, { once: true });
			Event.bind(frame, 'error', () => {
				clearTimeout(timer);
				reject(new Error('Print frame load error'));
			}, { once: true });
		});
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
				if (
					event.source === iframe.contentWindow
					&& event.data
					&& event.data.type === this.getMessageType()
				)
				{
					const targetIframe = document.getElementById(this.getIframeId());
					if (targetIframe && event.data.id === this.#messageId)
					{
						const maxHeight = 20000;
						const requestedHeight = Number(event.data.height);
						const safeHeight = Number.isFinite(requestedHeight) && requestedHeight > 0
							? Math.ceil(requestedHeight)
							: 1;
						const isHeightLimited = safeHeight > maxHeight;
						Dom.style(targetIframe, 'height', `${Math.min(safeHeight, maxHeight)}px`);
						Dom.attr(targetIframe, 'scrolling', isHeightLimited ? 'yes' : 'no');
						iframe.contentWindow.postMessage({
							type: this.getHeightLimitMessageType(),
							id: this.#messageId,
							limited: isHeightLimited,
						}, '*');
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
			body, .mail-print-body-root {
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
		const heightLimitMessageType = this.getHeightLimitMessageType();
		const printMessageType = this.getPrintMessageType();
		const printSourceMessageType = this.getPrintSourceMessageType();
		const quoteUnfoldedClass = this.getQuoteUnfoldedClass();
		const printSourceScript = this.#buildPrintSourceScript();

		return `
			const MESSAGE_ID = ${this.#messageId};
			const MESSAGE_TYPE = "${messageType}";
			const STYLES_MESSAGE_TYPE = "${stylesMessageType}";
			const HEIGHT_LIMIT_MESSAGE_TYPE = "${heightLimitMessageType}";
			const PRINT_MESSAGE_TYPE = "${printMessageType}";
			const PRINT_SOURCE_MESSAGE_TYPE = "${printSourceMessageType}";
			const QUOTE_UNFOLDED_CLASS = "${quoteUnfoldedClass}";
			${printSourceScript}
			let lastHeight = 0;
			function sendHeight()
			{
				const content = document.body?.firstElementChild;
				if (!content)
				{
					return;
				}

				const height = Math.max(
					content.offsetHeight,
					content.scrollHeight,
				);
				if (height === lastHeight)
				{
					return;
				}

				lastHeight = height;
				parent.postMessage({ type: MESSAGE_TYPE, height: height, id: MESSAGE_ID }, '*');
			}
			window.addEventListener("message", function(event) {
				if (event.source !== parent || !event.data || !event.data.type)
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

				if (event.data.type === HEIGHT_LIMIT_MESSAGE_TYPE && event.data.id === MESSAGE_ID)
				{
					document.documentElement.style.overflowY = event.data.limited ? 'auto' : '';
					document.body.style.overflowY = event.data.limited ? 'visible' : '';
				}

				if (
					event.data.type === PRINT_MESSAGE_TYPE
					&& event.data.id === MESSAGE_ID
					&& typeof event.data.requestId === 'string'
				)
				{
					sendPrintSource(event.data.requestId);
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

			const resizeObserver = new ResizeObserver(sendHeight);
			const mutationObserver = new MutationObserver(sendHeight);

			function observeContent()
			{
				const content = document.body?.firstElementChild;
				if (content)
				{
					resizeObserver.observe(content);
					mutationObserver.observe(content, { subtree: true, childList: true, attributes: true });
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

	#buildPrintSourceScript(): string
	{
		const serializerScript = this.#buildPrintCssSerializerScript();

		return `
			${serializerScript}

			function buildPrintSource()
			{
				const content = document.body?.firstElementChild;
				if (!content)
				{
					return null;
				}
				const clone = content.cloneNode(true);
				const sourceStyles = content.querySelectorAll('style');
				const cloneStyles = clone.querySelectorAll('style');
				for (let index = cloneStyles.length - 1; index >= 0; index--)
				{
					try
					{
						cloneStyles[index].textContent = serializeSafePrintRules(sourceStyles[index]?.sheet);
					}
					catch
					{
						cloneStyles[index].remove();
					}
				}
				return {
					html: clone.outerHTML,
					width: document.documentElement.clientWidth,
				};
			}
			function sendPrintSource(requestId)
			{
				const source = buildPrintSource();
				if (source)
				{
					parent.postMessage({
						type: PRINT_SOURCE_MESSAGE_TYPE,
						id: MESSAGE_ID,
						requestId,
						...source,
					}, '*');
				}
			}
		`;
	}

	#buildPrintCssSerializerScript(): string
	{
		const selectorScript = this.#buildPrintSelectorRewriteScript();

		return `
			${selectorScript}

			function serializeSafePrintRules(ruleContainer)
			{
				const cssRule = globalThis.CSSRule || {};
				const unsafeRuleTypes = new Set([
					cssRule.IMPORT_RULE ?? 3, cssRule.FONT_FACE_RULE ?? 5, cssRule.PAGE_RULE ?? 6,
				]);
				const rules = ruleContainer?.cssRules;
				if (!rules)
				{
					return '';
				}
				let result = '';
				for (const rule of rules)
				{
					if (unsafeRuleTypes.has(rule.type))
					{
						continue;
					}
					if (rule.type === (cssRule.STYLE_RULE ?? 1))
					{
						result += rewriteDocumentSelectors(rule.selectorText) + '{' + rule.style.cssText;
						if (rule.cssRules?.length > 0)
						{
							result += serializeSafePrintRules(rule);
						}
						result += '}';
					}
					else if (rule.type === (cssRule.KEYFRAME_RULE ?? 8))
					{
						result += rule.keyText + '{' + rule.style.cssText + '}';
					}
					else if (rule.cssRules)
					{
						const openingBrace = rule.cssText.indexOf('{');
						if (openingBrace >= 0)
						{
							result += rule.cssText.slice(0, openingBrace + 1)
								+ serializeSafePrintRules(rule)
								+ '}';
						}
					}
					else
					{
						result += rule.cssText;
					}
				}
				return result;
			}
		`;
	}

	#buildPrintSelectorRewriteScript(): string
	{
		return `
			function rewriteDocumentSelectors(selector)
			{
				let result = '';
				let quote = '';
				let attributeDepth = 0;
				for (let index = 0; index < selector.length; index++)
				{
					const character = selector[index];
					if (quote)
					{
						result += character;
						if (character === '\\\\')
						{
							result += selector[++index] || '';
						}
						else if (character === quote)
						{
							quote = '';
						}
						continue;
					}
					if (character === '"' || character === "'")
					{
						quote = character;
						result += character;
						continue;
					}
					attributeDepth = Math.max(0, attributeDepth + (character === '[' ? 1 : (character === ']' ? -1 : 0)));
					if (
						attributeDepth === 0
						&& selector.startsWith(':root', index)
						&& !/[\\w-]/.test(selector[index + 5] || '')
					)
					{
						result += '.mail-print-document-root';
						index += 4;
						continue;
					}
					const rootMatch = attributeDepth === 0 ? selector.slice(index, index + 5).match(/^(html|body)(?![\\w-])/i) : null;
					const previous = selector[index - 1] || '';
					if (rootMatch && !/[\\w.#:-]/.test(previous))
					{
						result += rootMatch[1].toLowerCase() === 'html'
							? '.mail-print-document-root'
							: '.mail-print-body-root';
						index += rootMatch[1].length - 1;
						continue;
					}
					result += character;
				}

				return result;
			}
		`;
	}
}
