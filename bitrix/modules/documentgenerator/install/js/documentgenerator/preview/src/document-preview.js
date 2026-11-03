import { ajax as Ajax, Dom, Event, Type } from 'main.core';
import { Loader } from 'main.loader';

const PULL_EVENT_NAME = 'onPullEvent-documentgenerator';
const PULL_COMMAND_SHOW_IMAGE = 'showImage';
const EARLY_EVENT_TTL = 60000;
const EARLY_EVENT_LIMIT = 100;

const previewInstancesByTag = new Map();
const previewTagsByInstance = new Map();
const earlyPullEvents = new Map();
let isPullEventSubscribed = false;

const removePreviewInstance = (pullTag, instance): void => {
	if (!Type.isStringFilled(pullTag) || !previewInstancesByTag.has(pullTag))
	{
		return;
	}

	const instances = previewInstancesByTag.get(pullTag);
	instances.delete(instance);
	if (instances.size === 0)
	{
		previewInstancesByTag.delete(pullTag);
	}
};

const pruneEarlyPullEvents = (): void => {
	const expiresBefore = Date.now() - EARLY_EVENT_TTL;
	earlyPullEvents.forEach(({ createdAt }, pullTag) => {
		if (createdAt < expiresBefore)
		{
			earlyPullEvents.delete(pullTag);
		}
	});
};

const handlePullEvent = (command, params): void => {
	if (
		command !== PULL_COMMAND_SHOW_IMAGE
		|| !Type.isPlainObject(params)
		|| !Type.isStringFilled(params.pullTag)
	)
	{
		return;
	}

	pruneEarlyPullEvents();
	const instances = previewInstancesByTag.get(params.pullTag);
	if (instances?.size > 0)
	{
		[...instances].forEach((instance) => instance.showImage(command, params));

		return;
	}

	earlyPullEvents.delete(params.pullTag);
	while (earlyPullEvents.size >= EARLY_EVENT_LIMIT)
	{
		earlyPullEvents.delete(earlyPullEvents.keys().next().value);
	}
	earlyPullEvents.set(params.pullTag, { command, params, createdAt: Date.now() });
};

const pullDispatcher = {
	register(instance): void
	{
		if (!previewTagsByInstance.has(instance))
		{
			previewTagsByInstance.set(instance, null);
		}
	},

	bind(instance, pullTag): void
	{
		pruneEarlyPullEvents();
		this.register(instance);
		const previousTag = previewTagsByInstance.get(instance);
		if (previousTag !== pullTag)
		{
			removePreviewInstance(previousTag, instance);
			if (Type.isStringFilled(previousTag))
			{
				earlyPullEvents.delete(previousTag);
			}
		}

		if (!Type.isStringFilled(pullTag))
		{
			previewTagsByInstance.set(instance, null);

			return;
		}

		if (!previewInstancesByTag.has(pullTag))
		{
			previewInstancesByTag.set(pullTag, new Set());
		}
		previewInstancesByTag.get(pullTag).add(instance);
		previewTagsByInstance.set(instance, pullTag);

		const earlyEvent = earlyPullEvents.get(pullTag);
		if (earlyEvent)
		{
			earlyPullEvents.delete(pullTag);
			instance.showImage(earlyEvent.command, earlyEvent.params);
		}
	},

	unregister(instance): void
	{
		const pullTag = previewTagsByInstance.get(instance);
		removePreviewInstance(pullTag, instance);
		previewTagsByInstance.delete(instance);
		if (Type.isStringFilled(pullTag))
		{
			earlyPullEvents.delete(pullTag);
		}

		if (previewTagsByInstance.size === 0)
		{
			earlyPullEvents.clear();
			this.unsubscribe();
		}
	},

	subscribe(): void
	{
		if (!isPullEventSubscribed)
		{
			top.BX.addCustomEvent(PULL_EVENT_NAME, handlePullEvent);
			isPullEventSubscribed = true;
		}
	},

	unsubscribe(): void
	{
		if (isPullEventSubscribed)
		{
			top.BX.removeCustomEvent(PULL_EVENT_NAME, handlePullEvent);
			isPullEventSubscribed = false;
		}
	},
};

/**
 * @memberOf BX.Crm.DocumentGenerator
 */
export class DocumentPreview
{
	loader = null;
	documentId = null;
	pullTag = null;
	startImageUrl = null;
	imageUrl = null;
	imageContainer = null;
	imageNode = null;
	printUrl = null;
	pdfUrl = null;
	hash = '';
	isPublicMode = false;
	isTransformationError = false;
	transformationErrorNode = null;
	transformationErrorMessage = '';
	transformationErrorCode = 0;
	previewNode = null;
	onReady = () => {};
	fallbackTimeoutId = null;
	fallbackRequestGeneration = null;
	fallbackGeneration = 0;
	isDestroyed = false;
	handlePageHide = (event: PageTransitionEvent): void => {
		if (!event.persisted)
		{
			this.destroy();
		}
	};

	constructor(options)
	{
		this.hash = options.hash || '';
		this.isPublicMode = options.isPublicMode || false;
		this.isTransformationError = false;
		this.transformationErrorNode = null;
		this.transformationErrorMessage = '';
		this.transformationErrorCode = 0;
		this.previewNode = null;
		this.onReady = () => {};
		pullDispatcher.register(this);
		this.applyOptions(options);
		this.initPushEvent();
		this.start();
		Event.bind(window, 'pagehide', this.handlePageHide);
	}

	isPullConnected(): boolean
	{
		if (top.BX.PULL)
		{
			if (Type.isFunction(top.BX.PULL.isConnected))
			{
				return top.BX.PULL.isConnected();
			}
			const debugInfo = top.BX.PULL.getDebugInfoArray();

			return debugInfo.connected;
		}

		return false;
	}

	initPushEvent(): void
	{
		pullDispatcher.subscribe();
		if (this.isDestroyed)
		{
			return;
		}

		if (this.isPullConnected())
		{
			this.#cancelFallback();

			return;
		}

		if (
			this.fallbackTimeoutId !== null
			|| this.fallbackRequestGeneration !== null
			|| this.documentId <= 0
			|| this.imageUrl
		)
		{
			return;
		}

		let action = 'documentgenerator.api.document.get';
		const data = { id: this.documentId };
		if (this.isPublicMode && Type.isString(this.hash) && this.hash.length > 10)
		{
			action = 'documentgenerator.api.publicdocument.get';
			data.hash = this.hash;
		}

		const generation = ++this.fallbackGeneration;
		this.fallbackTimeoutId = setTimeout(() => {
			this.fallbackTimeoutId = null;
			this.fallbackRequestGeneration = generation;
			void Ajax.runAction(action, { data })
				.then((response) => {
					if (!this.#completeFallbackRequest(generation))
					{
						return;
					}

					if (response.data.document.imageUrl)
					{
						this.showImage(PULL_COMMAND_SHOW_IMAGE, response.data.document);
					}
					else
					{
						this.initPushEvent();
					}
				}, () => this.#completeFallbackRequest(generation));
		}, 5000);
	}

	applyOptions(options): void
	{
		if (this.isDestroyed)
		{
			return;
		}

		const previousDocumentId = this.documentId;
		const previousPullTag = this.pullTag;
		if (options.id)
		{
			this.documentId = options.id;
		}

		if (options.pullTag)
		{
			this.pullTag = options.pullTag;
		}

		if (options.imageUrl)
		{
			this.imageUrl = options.imageUrl;
		}

		if (options.startImageUrl)
		{
			this.startImageUrl = options.startImageUrl;
		}

		if (options.printUrl)
		{
			this.printUrl = options.printUrl;
		}

		if (options.pdfUrl)
		{
			this.pdfUrl = options.pdfUrl;
		}

		if (options.emailDiskFile)
		{
			this.emailDiskFile = options.emailDiskFile;
		}

		if (Type.isDomNode(options.imageContainer))
		{
			this.imageContainer = options.imageContainer;
		}

		if (Type.isDomNode(options.previewNode))
		{
			this.previewNode = options.previewNode;
		}

		if (Type.isDomNode(options.transformationErrorNode))
		{
			this.transformationErrorNode = options.transformationErrorNode;
		}

		if (Type.isBoolean(options.isTransformationError))
		{
			this.isTransformationError = options.isTransformationError;
		}

		if (Type.isString(options.transformationErrorMessage))
		{
			this.transformationErrorMessage = options.transformationErrorMessage;
		}
		else
		{
			this.transformationErrorMessage = '';
		}

		if (Type.isNumber(options.transformationErrorCode))
		{
			this.transformationErrorCode = options.transformationErrorCode;
		}
		else
		{
			this.transformationErrorCode = 0;
		}

		if (Type.isFunction(options.onReady))
		{
			this.onReady = options.onReady;
		}

		if (previousDocumentId !== this.documentId || previousPullTag !== this.pullTag)
		{
			this.#cancelFallback();
		}

		pullDispatcher.bind(this, this.pullTag);
		this.initPushEvent();
	}

	destroy(): void
	{
		this.isDestroyed = true;
		Event.unbind(window, 'pagehide', this.handlePageHide);
		this.#cancelFallback();
		pullDispatcher.unregister(this);
	}

	#cancelFallback(): void
	{
		this.fallbackGeneration++;
		this.fallbackRequestGeneration = null;
		this.#clearFallbackTimeout();
	}

	#completeFallbackRequest(generation): boolean
	{
		if (this.fallbackRequestGeneration === generation)
		{
			this.fallbackRequestGeneration = null;
		}

		return !this.isDestroyed && generation === this.fallbackGeneration;
	}

	#clearFallbackTimeout(): void
	{
		if (this.fallbackTimeoutId !== null)
		{
			clearTimeout(this.fallbackTimeoutId);
			this.fallbackTimeoutId = null;
		}
	}

	getLoader(): Loader
	{
		if (!this.loader)
		{
			this.loader = new Loader({ size: 100, offset: { left: '-8%', top: '6%' } });
		}

		return this.loader;
	}

	showLoader(): void
	{
		if (this.imageContainer && !this.getLoader().isShown())
		{
			this.getLoader().show(this.imageContainer);
		}

		if (Type.isDomNode(this.imageNode))
		{
			Dom.style(this.imageNode, { opacity: 0.5 });
		}
	}

	hideLoader(): void
	{
		if (this.getLoader().isShown())
		{
			this.getLoader().hide();
		}

		if (Type.isDomNode(this.imageNode))
		{
			Dom.style(this.imageNode, { opacity: 1 });
		}
	}

	isValidPullTag(command, params): boolean
	{
		return command === PULL_COMMAND_SHOW_IMAGE && params.pullTag === this.pullTag;
	}

	showImage(command, params): void
	{
		if (!this.isDestroyed && this.isValidPullTag(command, params))
		{
			this.applyOptions(params);
			if (Type.isDomNode(this.previewNode))
			{
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
				BX.hide(this.previewNode);
			}

			if (Type.isDomNode(this.transformationErrorNode))
			{
				if (this.isTransformationError)
				{
					// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
					BX.show(this.transformationErrorNode);
				}
				else
				{
					// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
					BX.hide(this.transformationErrorNode);
				}
			}
			this.showImageNode();
			this.onReady(params);
			if (this.loader && this.loader.isShown())
			{
				this.loader.hide();
			}
		}
	}

	start(): void
	{
		if (this.imageUrl)
		{
			this.showImageNode();
		}
		else if (this.startImageUrl)
		{
			this.imageUrl = this.startImageUrl;
			this.startImageUrl = null;
			this.showImageNode();
			if (Type.isDomNode(this.imageNode))
			{
				Dom.style(this.imageNode, { opacity: 0.2 });
			}

			if (this.pullTag)
			{
				this.showLoader();
			}
		}
		else if (!this.isTransformationError && !this.previewNode)
		{
			this.showLoader();
		}
	}

	showImageNode(): void
	{
		if (!Type.isDomNode(this.imageContainer))
		{
			return;
		}

		if (!Type.isDomNode(this.imageNode))
		{
			this.imageNode = Dom.create('img', {
				style: {
					opacity: 0.1,
					display: 'none',
				},
			});
			Dom.append(this.imageNode, this.imageContainer);
		}

		if (this.imageUrl)
		{
			this.imageNode.src = this.imageUrl;
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.show(this.imageNode);
			Dom.style(this.imageNode, { opacity: 1 });
		}
	}
}
