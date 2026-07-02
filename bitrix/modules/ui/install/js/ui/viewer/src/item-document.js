import { Text, Tag, Uri, Loc, Dom, Reflection, Event, Runtime, ajax as Ajax, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { PrintService } from './document/print-service';

const Item = Reflection.namespace('BX.UI.Viewer.Item');
const Util = Reflection.namespace('BX.util');
const BXPromise = Reflection.namespace('BX.Promise');

export const DEFAULT_SCALE = 1.4;
const SCALE_MIN = 0.5;
const SCALE_MAX = 3;

const PAGES_TO_PRELOAD = 3;

// noinspection JSClosureCompilerSyntax
/**
 * @memberof BX.UI.Viewer
 * @extends BX.UI.Viewer.Item
 */
export class Document extends Item
{
	static #loadingLibraryPromise = null;
	#pageNumber: number = 1;
	#firstPageHeight: ?number = null;
	#loadingDocumentPromise: Promise = null;
	#updatingScalePromise: ?Promise = null;

	pdfDocument;
	pdfPages: Object<number, Object> = {};
	scale: number = DEFAULT_SCALE;
	pdfRenderedPages: Object<number, Object> = {};
	lastRenderedPdfPage: number = 0;
	contentNode: Element;
	previewHtml: Element;
	extraActions: HTMLElement = null;
	disableAnnotationLayer: boolean = true;

	constructor(options)
	{
		super(options);

		options = options || {};

		this.scale = options.scale || DEFAULT_SCALE;
	}

	setPropertiesByNode(node: HTMLElement): void
	{
		super.setPropertiesByNode(node);

		this.disableAnnotationLayer = node.dataset.hasOwnProperty('disableAnnotationLayer') ? true : this.disableAnnotationLayer;
	}

	applyReloadOptions(options)
	{
		this.controller.unsetCachedData(this.src);
	}

	listContainerModifiers(): Array<string>
	{
		const result = [
			'ui-viewer-document',
		];
		if (this.controller.stretch)
		{
			result.push('--stretch');
		}

		return result;
	}

	setSrc(src: string | Uri): this
	{
		this.src = src;
		this._pdfSrc = null;

		return this.#resetState();
	}

	setPdfSource(pdfSource: string | Uri | ArrayBuffer): this
	{
		this._pdfSrc = pdfSource;

		return this.#resetState();
	}

	#resetState(): this
	{
		this.pdfRenderedPages = {};
		this.lastRenderedPdfPage = null;
		this.pdfDocument = null;
		this.pdfPages = {};
		this.#firstPageHeight = null;
		this.setPageNumber(1);
		if (this.printer)
		{
			this.hidePrintProgress();
			this.printer.destroy();
		}
	}

	loadLibrary(): Promise
	{
		if (Document.#loadingLibraryPromise !== null)
		{
			return Document.#loadingLibraryPromise;
		}
		Document.#loadingLibraryPromise = new Promise((resolve, reject) => {
			Runtime.loadExtension('ui.pdfjs').then(() => {
				if (!BX.UI.Pdfjs.GlobalWorkerOptions.workerSrc)
				{
					BX.UI.Pdfjs.GlobalWorkerOptions.workerSrc = '/bitrix/js/ui/pdfjs/dist/pdfjs.worker.bundle.js';
				}

				Document.#loadingLibraryPromise = null;

				resolve();
			})
				.catch(reject);
		});

		return Document.#loadingLibraryPromise;
	}

	loadData(): BXPromise
	{
		const promise = new BXPromise();

		if (this._pdfSrc)
		{
			this.loadLibrary().then(() => {
				promise.fulfill(this);
			}).catch((e) => {
				console.error('Load pdf library error', e);
			});

			return promise;
		}

		console.log('loadData pdf');
		const ajaxPromise = Ajax.promise({
			url: Uri.addParam(this.src, { ts: 'bxviewer' }),
			method: 'GET',
			dataType: 'json',
			headers: [
				{
					name: 'BX-Viewer-src',
					value: this.src,
				},
				{
					name: 'BX-Viewer',
					value: 'document',
				},
			],
		});

		ajaxPromise.then((response) => {
			if (!response || !response.data)
			{
				this.isTransforming = false;
				promise.reject({
					item: this,
					message: Loc.getMessage('JS_UI_VIEWER_ITEM_TRANSFORMATION_ERROR_1').replace('#DOWNLOAD_LINK#', this.getSrc()),
					type: 'error',
				});

				return promise;
			}

			if (response.data.hasOwnProperty('pullTag'))
			{
				if (!this.isTransforming)
				{
					this.transformationPromise = promise;
					this.registerTransformationHandler(response.data.pullTag);
				}
				this.isTransforming = true;
			}

			if (response.data.data && response.data.data.src)
			{
				this.isTransforming = false;
				this._pdfSrc = response.data.data.src;
				this.loadLibrary().then(() => {
					promise.fulfill(this);
				});
			}
		});

		return promise;
	}

	render(): HTMLDivElement
	{
		this.controller.showLoading();

		this.contentNode = Tag.render`<div class="ui-viewer-item-document-content" style="--scale-factor: ${this.scale};" tabindex="2208"></div>`;

		Event.bind(this.contentNode, 'scroll', Runtime.throttle(this.handleScrollDocument.bind(this), 100));

		return this.contentNode;
	}

	getNakedActions(): Array
	{
		const nakedActions = super.getNakedActions();

		return this.insertPrintBeforeInfo(nakedActions);
	}

	insertPrintBeforeInfo(actions: Array): Array<{type: string, action: Function}>
	{
		actions = actions || [];

		let infoIndex = null;
		for (const [i, action] of actions.entries())
		{
			if (action.type === 'info')
			{
				infoIndex = i;
			}
		}

		const printAction = {
			type: 'print',
			action: this.print.bind(this),
		};

		if (infoIndex === null)
		{
			actions.push(printAction);
		}
		else
		{
			actions = Util.insertIntoArray(actions, infoIndex, printAction);
		}

		return actions;
	}

	renderExtraActions(): HTMLElement
	{
		if (this.extraActions === null)
		{
			this.extraActions = Tag.render`
				<div class="ui-viewer-extra-actions">
					<div 
						class="ui-viewer-action-btn" 
						onclick="${this.zoomOut.bind(this)}"
						title="${Text.encode(Loc.getMessage('JS_UI_VIEWER_SINGLE_DOCUMENT_SCALE_ZOOM_OUT'))}"
					>
						<div class="ui-icon-set --zoom-out ui-viewer-action-btn-icon"></div>
					</div>
					<div 
						class="ui-viewer-action-btn" 
						onclick="${this.zoomIn.bind(this)}" 
						title="${Text.encode(Loc.getMessage('JS_UI_VIEWER_SINGLE_DOCUMENT_SCALE_ZOOM_IN'))}"
					>
						<div class="ui-icon-set --zoom-in ui-viewer-action-btn-icon"></div>
					</div>
					<div 
						class="ui-viewer-action-btn" 
						onclick="${this.print.bind(this)}" 
						title="${Text.encode(Loc.getMessage('JS_UI_VIEWER_ITEM_ACTION_PRINT'))}"
					>
						<div class="ui-icon-set --print-1 ui-viewer-action-btn-icon"></div>
					</div>
				</div>
			`;
		}

		return this.extraActions;
	}

	zoomIn(): void
	{
		const newScale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, this.scale * 1.1));
		void this.updateScale(newScale).then(() => {
			this.controller.adjustControlsSize(this.getContentWidth());
		});
	}

	zoomOut(): void
	{
		const newScale = Math.min(SCALE_MAX, Math.max(SCALE_MIN, this.scale * 0.9));
		void this.updateScale(newScale).then(() => {
			this.controller.adjustControlsSize(this.getContentWidth());
		});
	}

	getFirstDocumentPageHeight(): Promise<number>
	{
		if (this.#firstPageHeight)
		{
			return Promise.resolve(this.#firstPageHeight);
		}

		return new Promise((resolve) => {
			this.getDocumentPage(this.pdfDocument, 1).then((page) => {
				const viewport = this.#getViewport(page);
				this.#firstPageHeight = viewport.height;

				resolve(this.#firstPageHeight);
			});
		});
	}

	handleScrollDocument(event): void
	{
		console.log('handleScrollDocument');
		this.getFirstDocumentPageHeight().then((height) => {
			console.log('handleScrollDocument height getFirstDocumentPageHeight', height);
			const scrollBottom = this.contentNode.scrollHeight - this.contentNode.scrollTop - this.contentNode.clientHeight;
			if (scrollBottom < height * PAGES_TO_PRELOAD && this.pdfDocument.numPages > this.lastRenderedPdfPage)
			{
				for (let i = this.lastRenderedPdfPage + 1; i <= Math.min(this.pdfDocument.numPages, this.lastRenderedPdfPage + PAGES_TO_PRELOAD); i++)
				{
					this.renderDocumentPage(this.pdfDocument, i);
				}
			}

			this.setPageNumber((this.contentNode.scrollTop / height) + 1);
		});
	}

	loadDocument(): Promise<Object>
	{
		if (this.pdfDocument)
		{
			return Promise.resolve(this.pdfDocument);
		}

		if (this.#loadingDocumentPromise)
		{
			return this.#loadingDocumentPromise;
		}

		this.#loadingDocumentPromise = new Promise((resolve) => {
			this.loadData().then(() => {
				BX.UI.Pdfjs.getDocument(this._pdfSrc).promise.then((pdf) => {
					this.pdfDocument = pdf;
					this.#loadingDocumentPromise = null;

					resolve(this.pdfDocument);
				});
			});
		});

		return this.#loadingDocumentPromise;
	}

	getDocumentPage(pdf, pageNumber): Promise<Object>
	{
		if (this.pdfPages[pageNumber])
		{
			return Promise.resolve(this.pdfPages[pageNumber]);
		}

		return new Promise((resolve) => {
			pdf.getPage(pageNumber).then((page) => {
				this.pdfPages[pageNumber] = page;

				resolve(this.pdfPages[pageNumber]);
			});
		});
	}

	renderDocumentPage(pdf, pageNumber): Promise<Object>
	{
		console.log('renderDocumentPage', pageNumber);
		const pagePromise = this.pdfRenderedPages[pageNumber];
		if (pagePromise instanceof Promise)
		{
			return pagePromise;
		}

		if (pagePromise)
		{
			return Promise.resolve(pagePromise);
		}

		this.pdfRenderedPages[pageNumber] = new Promise((resolve) => {
			this.getDocumentPage(pdf, pageNumber).then((page) => {
				const canvas = this.createCanvasPage();
				const viewport = this.#getViewport(page);
				canvas.height = viewport.height;
				canvas.width = viewport.width;
				const renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });

				if (!this.disableAnnotationLayer)
				{
					renderTask.promise.then(() => {
						const annotationLayerNode = Dom.create('div', {
							props: { className: 'ui-viewer-pdf-annotation-layer' },
						});

						Dom.insertAfter(annotationLayerNode, canvas);

						return this.#renderAnnotationLayer(page, canvas, annotationLayerNode, pdf);
					});
				}

				renderTask.promise.then(() => {
					const textLayerNode = Dom.create('div', {
						props: { className: 'ui-viewer-pdf-text-layer' },
					});

					Dom.insertAfter(textLayerNode, canvas);

					return this.#renderTextLayer(page, canvas, textLayerNode);
				});

				this.lastRenderedPdfPage = Math.max(pageNumber, this.lastRenderedPdfPage);

				if (pageNumber === 1)
				{
					this.firstWidthDocumentPage = canvas.width;
				}

				renderTask.promise.then(() => {
					this.controller.hideLoading();
					this.pdfRenderedPages[pageNumber] = page;

					resolve(page, canvas);
				});
			});
		});

		return this.pdfRenderedPages[pageNumber];
	}

	#getViewport(page)
	{
		return page.getViewport({ scale: this.scale });
	}

	#renderAnnotationLayer(page, canvas: HTMLCanvasElement, annotationLayerNode: HTMLElement, pdf): Promise
	{
		return page.getAnnotations().then((annotationData) => {
			Dom.style(annotationLayerNode, {
				margin: `-${canvas.offsetHeight}px auto 0 auto`,
				height: `${canvas.height}px`,
				width: `${canvas.width}px`,
			});

			const viewport = this.#getViewport(page);

			const annotationLayer = new BX.UI.Pdfjs.AnnotationLayer({
				div: annotationLayerNode,
				accessibilityManager: null,
				annotationCanvasMap: new Map(),
				l10n: {
					async translate(element: HTMLElement)
					{
						return Promise.resolve();
					},
					async get(key: string, args?: any)
					{
						return Promise.resolve(key);
					},
				},
				page,
				viewport,
			});

			const pdfLinkService = new BX.UI.Pdfjs.PDFLinkService();
			pdfLinkService.setDocument(pdf);

			return annotationLayer.render({
				viewport: viewport.clone({ dontFlip: true }),
				linkService: pdfLinkService,
				div: annotationLayerNode,
				annotations: annotationData,
				page,
			}).promise;
		});
	}

	#renderTextLayer(page, canvas: HTMLCanvasElement, textLayerNode: HTMLElement): Promise
	{
		Dom.style(textLayerNode, {
			margin: `-${canvas.offsetHeight}px auto 0 auto`,
			height: `${canvas.height}px`,
			width: `${canvas.width}px`,
		});

		const textLayer = new BX.UI.Pdfjs.TextLayer({
			textContentSource: page.streamTextContent(),
			viewport: this.#getViewport(page),
			container: textLayerNode,
		});

		return textLayer.render().promise;
	}

	createCanvasPage(): HTMLCanvasElement
	{
		const canvas = document.createElement('canvas');
		canvas.className = 'ui-viewer-document-page-canvas';
		this.contentNode.appendChild(canvas);

		return canvas;
	}

	getContentWidth(): Promise<Number>
	{
		return new Promise((resolve) => {
			this.loadDocument().then(() => {
				this.renderDocumentPage(this.pdfDocument, 1).then((page) => {
					const contentWidth = page.getViewport(this.scale).width;
					const scrollWidth = this.contentNode.offsetWidth - this.contentNode.clientWidth;

					resolve(contentWidth + scrollWidth);
				});
			});
		});
	}

	afterRender(): void
	{
		this.loadDocument().then((pdf) => {
			console.log('total pages', pdf.numPages);
			for (let i = 1; i <= Math.min(pdf.numPages, PAGES_TO_PRELOAD); i++)
			{
				if (i === 1)
				{
					this._handleControls = this.controller.handleVisibleControls.bind(this.controller);
					this.controller.enableReadingMode(true);

					Runtime.throttle(Event.bind(window, 'mousemove', this._handleControls), 20);
				}

				this.renderDocumentPage(pdf, i);
			}
		});
	}

	beforeHide(): void
	{
		this.pdfRenderedPages = {};
		Event.unbind(window, 'mousemove', this._handleControls);
		if (this.printer)
		{
			this.hidePrintProgress();
			this.printer.destroy();
		}
	}

	updatePrintProgressMessage(index: number, total: number): void
	{
		const progress = Math.round((index / total) * 100);
		this.controller.setTextOnLoading(Loc.getMessage('JS_UI_VIEWER_ITEM_PREPARING_TO_PRINT').replace('#PROGRESS#', progress));
	}

	showPrintProgress(index: number, total: number): void
	{
		this.contentNode.style.opacity = 0.7;
		this.contentNode.style.filter = 'blur(2px)';

		this.controller.showLoading({
			zIndex: 1,
		});

		this.updatePrintProgressMessage(index, total);
	}

	hidePrintProgress(): void
	{
		this.contentNode.style.opacity = null;
		this.contentNode.style.filter = null;

		this.controller.hideLoading();
	}

	print(): void
	{
		if (!this.pdfDocument)
		{
			console.warn('Where is pdf document to print?');

			return;
		}

		this.showPrintProgress(0, this.pdfDocument.numPages);

		this.printer = new PrintService({
			pdf: this.pdfDocument,
		});

		this.printer.init().then(() => {
			this.printer.prepare({
				onProgress: this.updatePrintProgressMessage.bind(this),
			}).then(() => {
				this.hidePrintProgress();
				this.printer.performPrint();
			});
		});
	}

	handleKeyPress(event): void
	{
		if (!this.isLoaded)
		{
			return false;
		}

		if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp'].includes(event.code))
		{
			BX.focus(this.contentNode);

			return false;
		}

		if (event.code === 'Equal')
		{
			event.preventDefault();
			event.stopPropagation();

			this.zoomIn();

			return true;
		}

		if (event.code === 'Minus')
		{
			event.preventDefault();
			event.stopPropagation();

			this.zoomOut();

			return true;
		}

		return false;
	}

	getScale(): number
	{
		return this.scale;
	}

	setScale(scale: number): this
	{
		this.scale = scale;

		return this;
	}

	updateScale(scale: number): Promise<void>
	{
		if (this.#updatingScalePromise)
		{
			return this.#updatingScalePromise.then(() => {
				return this.updateScale(scale);
			});
		}

		scale = Number(scale);
		if (this.scale === scale)
		{
			return Promise.resolve();
		}

		const ratio = scale / this.scale;

		const updatePageScale = ((
			page,
			canvases: Array<number, HTMLCanvasElement>,
			annotationLayers: Array<number, HTMLDivElement>,
			textLayers: Array<number, HTMLDivElement>,
		): Promise => {
			const canvas = canvases[page.pageNumber - 1];
			if (!canvas)
			{
				return Promise.resolve();
			}

			const viewport = this.#getViewport(page);
			canvas.width = viewport.width;
			canvas.height = viewport.height;

			return page.render({
				canvasContext: canvas.getContext('2d'),
				viewport,
			}).promise.then(() => {
				const annotationLayerNode = annotationLayers[page.pageNumber - 1];
				if (!annotationLayerNode)
				{
					return null;
				}

				Dom.clean(annotationLayerNode);

				return this.#renderAnnotationLayer(page, canvas, annotationLayerNode, this.pdfDocument);
			}).then(() => {
				const textLayerNode = textLayers[page.pageNumber - 1];
				if (!textLayerNode)
				{
					return null;
				}

				Dom.clean(textLayerNode);

				return this.#renderTextLayer(page, canvas, textLayerNode);
			});
		});

		const promises = [];
		this.scale = scale;
		const canvases = [...this.contentNode.querySelectorAll('canvas[class="ui-viewer-document-page-canvas"]')];
		const annotationLayers = [...this.contentNode.querySelectorAll('div[class="ui-viewer-pdf-annotation-layer"]')];
		const textLayers = [...this.contentNode.querySelectorAll('div[class="ui-viewer-pdf-text-layer"]')];
		Object.values(this.pdfRenderedPages).forEach((renderedPage) => {
			if (renderedPage instanceof Promise)
			{
				promises.push(new Promise((resolve) => {
					renderedPage.then((page) => {
						updatePageScale(page, canvases, annotationLayers, textLayers).then(resolve);
					});
				}));
			}
			else
			{
				promises.push(updatePageScale(renderedPage, canvases, annotationLayers, textLayers));
			}
		});

		Dom.style(this.contentNode, {
			'--scale-factor': scale,
		});

		const scrollTop = this.contentNode.scrollTop * ratio;
		this.contentNode.scrollTo(this.contentNode.scrollLeft, scrollTop);

		this.#updatingScalePromise = Promise.all(promises).finally(() => {
			this.#updatingScalePromise = null;
			this.#firstPageHeight = null;
		});

		return this.#updatingScalePromise;
	}

	getPagesNumber(): ?number
	{
		if (!this.pdfDocument)
		{
			return null;
		}

		return Text.toInteger(this.pdfDocument.numPages);
	}

	scrollToPage(pageNumber: number): Promise<void>
	{
		const isChanged = this.setPageNumber(pageNumber) !== null;
		if (!isChanged)
		{
			return Promise.resolve();
		}

		return new Promise((resolve) => {
			const renderPromises = [];
			for (let i = 1; i < pageNumber; i++)
			{
				renderPromises.push(this.renderDocumentPage(this.pdfDocument, i));
			}
			Promise.all(renderPromises).then((pages) => {
				let height = 0;

				pages.forEach((page) => {
					const viewport = page.getViewport({ scale: this.scale });
					height += viewport.height + 7;
				});

				this.contentNode.scrollTo(this.contentNode.scrollLeft, height);

				resolve();
			});
		});
	}

	getPageNumber(): number
	{
		return this.#pageNumber;
	}

	setPageNumber(pageNumber: number): this | null
	{
		pageNumber = Text.toInteger(pageNumber);
		if (pageNumber < 0)
		{
			pageNumber = 1;
		}

		let numPages = this.getPagesNumber();
		if (!numPages)
		{
			numPages = 1;
		}

		if (pageNumber > numPages)
		{
			pageNumber = numPages;
		}

		if (this.#pageNumber !== pageNumber)
		{
			this.#pageNumber = pageNumber;
			EventEmitter.emit(this, 'BX.UI.Viewer.Item.Document:updatePageNumber');

			return this;
		}

		return null;
	}
}
