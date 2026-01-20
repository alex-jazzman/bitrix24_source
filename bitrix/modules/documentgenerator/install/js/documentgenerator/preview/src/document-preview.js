import { ajax as Ajax, Dom, Type } from 'main.core';
import { Loader } from 'main.loader';

let isPushEventInited = false;

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
		this.applyOptions(options);
		this.initPushEvent();
		this.start();
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
		if (!isPushEventInited)
		{
			if (this.isPullConnected())
			{
				isPushEventInited = true;
				top.BX.addCustomEvent('onPullEvent-documentgenerator', this.showImage.bind(this));
			}
			else if (this.documentId > 0 && !this.imageUrl)
			{
				let action = 'documentgenerator.api.document.get';
				const data = { id: this.documentId };
				if (this.isPublicMode && Type.isString(this.hash) && this.hash.length > 10)
				{
					action = 'documentgenerator.api.publicdocument.get';
					data.hash = this.hash;
				}
				isPushEventInited = true;
				setTimeout(() => {
					void Ajax.runAction(action, { data })
						.then((response) => {
							isPushEventInited = false;
							if (response.data.document.imageUrl)
							{
								this.showImage('showImage', response.data.document);
							}
							else
							{
								this.initPushEvent();
							}
						}, () => {
							isPushEventInited = false;
						});
				}, 5000);
			}
		}
	}

	applyOptions(options): void
	{
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

		this.initPushEvent();
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
		return command === 'showImage' && params.pullTag === this.pullTag;
	}

	showImage(command, params): void
	{
		if (this.isValidPullTag(command, params))
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
