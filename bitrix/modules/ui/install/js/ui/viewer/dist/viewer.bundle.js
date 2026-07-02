/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	const BXPromise$1 = main_core.Reflection.namespace('BX.Promise');
	const PRINT_SCALE = 1;
	class PrintService {
		constructor(options) {
			options = options || {};
			this.pdf = options.pdf;
			this.iframe = null;
			this.documentOverview = {};
		}
		init() {
			if (this.documentOverview) {
				return Promise.resolve(this.documentOverview);
			}
			return new Promise(resolve => {
				this.pdf.getPage(1).then(page => {
					const viewport = page.getViewport({
						scale: PRINT_SCALE
					});
					this.documentOverview = {
						width: viewport.width,
						height: viewport.height,
						rotation: viewport.rotation
					};
					resolve(this.documentOverview);
				});
			});
		}

		/**
		 * @param {?Object} options
		 * @param {Function} [options.onProgress]
		 * @return {BXPromise}
		 */
		prepare(options) {
			options = options || {};
			const pageCount = this.pdf.numPages;
			let currentPage = -1;
			const promise = new BXPromise$1();
			let onProgress = null;
			if (main_core.Type.isFunction(options.onProgress)) {
				onProgress = options.onProgress;
			}
			this.frame = this.createIframe();
			const process = () => {
				if (++currentPage >= pageCount) {
					console.log('finish', this.frame.contentWindow.document);
					setTimeout(() => {
						promise.fulfill();
					}, 1000);
					return;
				}
				this.renderPage(currentPage + 1).then(() => {
					if (onProgress) {
						onProgress(currentPage + 1, pageCount);
					}
					process();
				});
			};
			process();
			return promise;
		}
		renderPage(pageNumber) {
			return this.pdf.getPage(pageNumber).then(page => {
				const scratchCanvas = document.createElement('canvas');
				const viewport = page.getViewport({
					scale: PRINT_SCALE
				});
				// The size of the canvas in pixels for printing.
				const PRINT_RESOLUTION = 150;
				const PRINT_UNITS = PRINT_RESOLUTION / 72;
				scratchCanvas.width = Math.floor(viewport.width * PRINT_UNITS);
				scratchCanvas.height = Math.floor(viewport.height * PRINT_UNITS);

				// The physical size of the img as specified by the PDF document.
				const CSS_UNITS = 96 / 72;
				const width = `${Math.floor(viewport.width * CSS_UNITS)}px`;
				const height = `${Math.floor(viewport.height * CSS_UNITS)}px`;
				const ctx = scratchCanvas.getContext('2d');
				ctx.save();
				ctx.fillStyle = 'rgb(255, 255, 255)';
				ctx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);
				ctx.restore();
				const renderContext = {
					canvasContext: ctx,
					transform: [PRINT_UNITS, 0, 0, PRINT_UNITS, 0, 0],
					viewport: page.getViewport({
						scale: PRINT_SCALE,
						rotation: viewport.rotation
					}),
					intent: 'print'
				};
				return page.render(renderContext).promise.then(() => {
					return {
						scratchCanvas,
						width,
						height
					};
				});
			}).then(printItem => {
				const img = document.createElement('img');
				img.style.width = printItem.width;
				img.style.height = printItem.height;
				const scratchCanvas = printItem.scratchCanvas;
				if ('toBlob' in scratchCanvas && !this.disableCreateObjectURL) {
					scratchCanvas.toBlob(blob => {
						img.src = URL.createObjectURL(blob);
					});
				} else {
					img.src = scratchCanvas.toDataURL();
				}
				const wrapper = document.createElement('div');
				wrapper.appendChild(img);
				this.frame.contentWindow.document.body.appendChild(wrapper);
			});
		}
		destroy() {
			if (this.frame) {
				main_core.Dom.remove(this.frame);
			}
		}
		createIframe() {
			const frame = document.createElement('iframe');
			frame.src = 'about:blank';
			frame.name = 'document-print-frame';
			frame.style.display = 'none';
			document.body.appendChild(frame);
			const frameWindow = frame.contentWindow;
			const frameDoc = frameWindow.document;
			frameDoc.open();
			frameDoc.write('<html><head>');
			const pageSize = this.getDocumentOverview();
			let headTags = '<style>';
			headTags += 'html, body { background: #fff !important; height: 100%; }';
			headTags += '@supports ((size:A4) and (size:1pt 1pt)) {' + `@page { size: ${pageSize.width}pt ${pageSize.height}pt;}` + '}';
			headTags += '#ad{ display:none;}';
			headTags += '#leftbar{ display:none;}';
			headTags += '</style>';
			frameDoc.write(headTags);
			frameDoc.write('</head><body>');
			frameDoc.write('</body></html>');
			frameDoc.close();
			return frame;
		}
		performPrint() {
			this.frame.contentWindow.focus();
			this.frame.contentWindow.print();
		}
		getDocumentOverview() {
			return this.documentOverview;
		}
	}

	const Item = main_core.Reflection.namespace('BX.UI.Viewer.Item');
	const Util = main_core.Reflection.namespace('BX.util');
	const BXPromise = main_core.Reflection.namespace('BX.Promise');
	const DEFAULT_SCALE = 1.4;
	const SCALE_MIN$1 = 0.5;
	const SCALE_MAX$1 = 3;
	const PAGES_TO_PRELOAD = 3;

	// noinspection JSClosureCompilerSyntax
	/**
	 * @memberof BX.UI.Viewer
	 * @extends BX.UI.Viewer.Item
	 */
	class Document extends Item {
		static #loadingLibraryPromise = null;
		#pageNumber = 1;
		#firstPageHeight = null;
		#loadingDocumentPromise = null;
		#updatingScalePromise = null;
		pdfPages = {};
		scale = DEFAULT_SCALE;
		pdfRenderedPages = {};
		lastRenderedPdfPage = 0;
		extraActions = null;
		disableAnnotationLayer = true;
		constructor(options) {
			super(options);
			options = options || {};
			this.scale = options.scale || DEFAULT_SCALE;
		}
		setPropertiesByNode(node) {
			super.setPropertiesByNode(node);
			this.disableAnnotationLayer = node.dataset.hasOwnProperty('disableAnnotationLayer') ? true : this.disableAnnotationLayer;
		}
		applyReloadOptions(options) {
			this.controller.unsetCachedData(this.src);
		}
		listContainerModifiers() {
			const result = ['ui-viewer-document'];
			if (this.controller.stretch) {
				result.push('--stretch');
			}
			return result;
		}
		setSrc(src) {
			this.src = src;
			this._pdfSrc = null;
			return this.#resetState();
		}
		setPdfSource(pdfSource) {
			this._pdfSrc = pdfSource;
			return this.#resetState();
		}
		#resetState() {
			this.pdfRenderedPages = {};
			this.lastRenderedPdfPage = null;
			this.pdfDocument = null;
			this.pdfPages = {};
			this.#firstPageHeight = null;
			this.setPageNumber(1);
			if (this.printer) {
				this.hidePrintProgress();
				this.printer.destroy();
			}
		}
		loadLibrary() {
			if (Document.#loadingLibraryPromise !== null) {
				return Document.#loadingLibraryPromise;
			}
			Document.#loadingLibraryPromise = new Promise((resolve, reject) => {
				main_core.Runtime.loadExtension('ui.pdfjs').then(() => {
					if (!BX.UI.Pdfjs.GlobalWorkerOptions.workerSrc) {
						BX.UI.Pdfjs.GlobalWorkerOptions.workerSrc = '/bitrix/js/ui/pdfjs/dist/pdfjs.worker.bundle.js';
					}
					Document.#loadingLibraryPromise = null;
					resolve();
				}).catch(reject);
			});
			return Document.#loadingLibraryPromise;
		}
		loadData() {
			const promise = new BXPromise();
			if (this._pdfSrc) {
				this.loadLibrary().then(() => {
					promise.fulfill(this);
				}).catch(e => {
					console.error('Load pdf library error', e);
				});
				return promise;
			}
			console.log('loadData pdf');
			const ajaxPromise = main_core.ajax.promise({
				url: main_core.Uri.addParam(this.src, {
					ts: 'bxviewer'
				}),
				method: 'GET',
				dataType: 'json',
				headers: [{
					name: 'BX-Viewer-src',
					value: this.src
				}, {
					name: 'BX-Viewer',
					value: 'document'
				}]
			});
			ajaxPromise.then(response => {
				if (!response || !response.data) {
					this.isTransforming = false;
					promise.reject({
						item: this,
						message: main_core.Loc.getMessage('JS_UI_VIEWER_ITEM_TRANSFORMATION_ERROR_1').replace('#DOWNLOAD_LINK#', this.getSrc()),
						type: 'error'
					});
					return promise;
				}
				if (response.data.hasOwnProperty('pullTag')) {
					if (!this.isTransforming) {
						this.transformationPromise = promise;
						this.registerTransformationHandler(response.data.pullTag);
					}
					this.isTransforming = true;
				}
				if (response.data.data && response.data.data.src) {
					this.isTransforming = false;
					this._pdfSrc = response.data.data.src;
					this.loadLibrary().then(() => {
						promise.fulfill(this);
					});
				}
			});
			return promise;
		}
		render() {
			this.controller.showLoading();
			this.contentNode = main_core.Tag.render`<div class="ui-viewer-item-document-content" style="--scale-factor: ${this.scale};" tabindex="2208"></div>`;
			main_core.Event.bind(this.contentNode, 'scroll', main_core.Runtime.throttle(this.handleScrollDocument.bind(this), 100));
			return this.contentNode;
		}
		getNakedActions() {
			const nakedActions = super.getNakedActions();
			return this.insertPrintBeforeInfo(nakedActions);
		}
		insertPrintBeforeInfo(actions) {
			actions = actions || [];
			let infoIndex = null;
			for (const [i, action] of actions.entries()) {
				if (action.type === 'info') {
					infoIndex = i;
				}
			}
			const printAction = {
				type: 'print',
				action: this.print.bind(this)
			};
			if (infoIndex === null) {
				actions.push(printAction);
			} else {
				actions = Util.insertIntoArray(actions, infoIndex, printAction);
			}
			return actions;
		}
		renderExtraActions() {
			if (this.extraActions === null) {
				this.extraActions = main_core.Tag.render`
				<div class="ui-viewer-extra-actions">
					<div 
						class="ui-viewer-action-btn" 
						onclick="${this.zoomOut.bind(this)}"
						title="${main_core.Text.encode(main_core.Loc.getMessage('JS_UI_VIEWER_SINGLE_DOCUMENT_SCALE_ZOOM_OUT'))}"
					>
						<div class="ui-icon-set --zoom-out ui-viewer-action-btn-icon"></div>
					</div>
					<div 
						class="ui-viewer-action-btn" 
						onclick="${this.zoomIn.bind(this)}" 
						title="${main_core.Text.encode(main_core.Loc.getMessage('JS_UI_VIEWER_SINGLE_DOCUMENT_SCALE_ZOOM_IN'))}"
					>
						<div class="ui-icon-set --zoom-in ui-viewer-action-btn-icon"></div>
					</div>
					<div 
						class="ui-viewer-action-btn" 
						onclick="${this.print.bind(this)}" 
						title="${main_core.Text.encode(main_core.Loc.getMessage('JS_UI_VIEWER_ITEM_ACTION_PRINT'))}"
					>
						<div class="ui-icon-set --print-1 ui-viewer-action-btn-icon"></div>
					</div>
				</div>
			`;
			}
			return this.extraActions;
		}
		zoomIn() {
			const newScale = Math.min(SCALE_MAX$1, Math.max(SCALE_MIN$1, this.scale * 1.1));
			void this.updateScale(newScale).then(() => {
				this.controller.adjustControlsSize(this.getContentWidth());
			});
		}
		zoomOut() {
			const newScale = Math.min(SCALE_MAX$1, Math.max(SCALE_MIN$1, this.scale * 0.9));
			void this.updateScale(newScale).then(() => {
				this.controller.adjustControlsSize(this.getContentWidth());
			});
		}
		getFirstDocumentPageHeight() {
			if (this.#firstPageHeight) {
				return Promise.resolve(this.#firstPageHeight);
			}
			return new Promise(resolve => {
				this.getDocumentPage(this.pdfDocument, 1).then(page => {
					const viewport = this.#getViewport(page);
					this.#firstPageHeight = viewport.height;
					resolve(this.#firstPageHeight);
				});
			});
		}
		handleScrollDocument(event) {
			console.log('handleScrollDocument');
			this.getFirstDocumentPageHeight().then(height => {
				console.log('handleScrollDocument height getFirstDocumentPageHeight', height);
				const scrollBottom = this.contentNode.scrollHeight - this.contentNode.scrollTop - this.contentNode.clientHeight;
				if (scrollBottom < height * PAGES_TO_PRELOAD && this.pdfDocument.numPages > this.lastRenderedPdfPage) {
					for (let i = this.lastRenderedPdfPage + 1; i <= Math.min(this.pdfDocument.numPages, this.lastRenderedPdfPage + PAGES_TO_PRELOAD); i++) {
						this.renderDocumentPage(this.pdfDocument, i);
					}
				}
				this.setPageNumber(this.contentNode.scrollTop / height + 1);
			});
		}
		loadDocument() {
			if (this.pdfDocument) {
				return Promise.resolve(this.pdfDocument);
			}
			if (this.#loadingDocumentPromise) {
				return this.#loadingDocumentPromise;
			}
			this.#loadingDocumentPromise = new Promise(resolve => {
				this.loadData().then(() => {
					BX.UI.Pdfjs.getDocument(this._pdfSrc).promise.then(pdf => {
						this.pdfDocument = pdf;
						this.#loadingDocumentPromise = null;
						resolve(this.pdfDocument);
					});
				});
			});
			return this.#loadingDocumentPromise;
		}
		getDocumentPage(pdf, pageNumber) {
			if (this.pdfPages[pageNumber]) {
				return Promise.resolve(this.pdfPages[pageNumber]);
			}
			return new Promise(resolve => {
				pdf.getPage(pageNumber).then(page => {
					this.pdfPages[pageNumber] = page;
					resolve(this.pdfPages[pageNumber]);
				});
			});
		}
		renderDocumentPage(pdf, pageNumber) {
			console.log('renderDocumentPage', pageNumber);
			const pagePromise = this.pdfRenderedPages[pageNumber];
			if (pagePromise instanceof Promise) {
				return pagePromise;
			}
			if (pagePromise) {
				return Promise.resolve(pagePromise);
			}
			this.pdfRenderedPages[pageNumber] = new Promise(resolve => {
				this.getDocumentPage(pdf, pageNumber).then(page => {
					const canvas = this.createCanvasPage();
					const viewport = this.#getViewport(page);
					canvas.height = viewport.height;
					canvas.width = viewport.width;
					const renderTask = page.render({
						canvasContext: canvas.getContext('2d'),
						viewport
					});
					if (!this.disableAnnotationLayer) {
						renderTask.promise.then(() => {
							const annotationLayerNode = main_core.Dom.create('div', {
								props: {
									className: 'ui-viewer-pdf-annotation-layer'
								}
							});
							main_core.Dom.insertAfter(annotationLayerNode, canvas);
							return this.#renderAnnotationLayer(page, canvas, annotationLayerNode, pdf);
						});
					}
					renderTask.promise.then(() => {
						const textLayerNode = main_core.Dom.create('div', {
							props: {
								className: 'ui-viewer-pdf-text-layer'
							}
						});
						main_core.Dom.insertAfter(textLayerNode, canvas);
						return this.#renderTextLayer(page, canvas, textLayerNode);
					});
					this.lastRenderedPdfPage = Math.max(pageNumber, this.lastRenderedPdfPage);
					if (pageNumber === 1) {
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
		#getViewport(page) {
			return page.getViewport({
				scale: this.scale
			});
		}
		#renderAnnotationLayer(page, canvas, annotationLayerNode, pdf) {
			return page.getAnnotations().then(annotationData => {
				main_core.Dom.style(annotationLayerNode, {
					margin: `-${canvas.offsetHeight}px auto 0 auto`,
					height: `${canvas.height}px`,
					width: `${canvas.width}px`
				});
				const viewport = this.#getViewport(page);
				const annotationLayer = new BX.UI.Pdfjs.AnnotationLayer({
					div: annotationLayerNode,
					accessibilityManager: null,
					annotationCanvasMap: new Map(),
					l10n: {
						async translate(element) {
							return Promise.resolve();
						},
						async get(key, args) {
							return Promise.resolve(key);
						}
					},
					page,
					viewport
				});
				const pdfLinkService = new BX.UI.Pdfjs.PDFLinkService();
				pdfLinkService.setDocument(pdf);
				return annotationLayer.render({
					viewport: viewport.clone({
						dontFlip: true
					}),
					linkService: pdfLinkService,
					div: annotationLayerNode,
					annotations: annotationData,
					page
				}).promise;
			});
		}
		#renderTextLayer(page, canvas, textLayerNode) {
			main_core.Dom.style(textLayerNode, {
				margin: `-${canvas.offsetHeight}px auto 0 auto`,
				height: `${canvas.height}px`,
				width: `${canvas.width}px`
			});
			const textLayer = new BX.UI.Pdfjs.TextLayer({
				textContentSource: page.streamTextContent(),
				viewport: this.#getViewport(page),
				container: textLayerNode
			});
			return textLayer.render().promise;
		}
		createCanvasPage() {
			const canvas = document.createElement('canvas');
			canvas.className = 'ui-viewer-document-page-canvas';
			this.contentNode.appendChild(canvas);
			return canvas;
		}
		getContentWidth() {
			return new Promise(resolve => {
				this.loadDocument().then(() => {
					this.renderDocumentPage(this.pdfDocument, 1).then(page => {
						const contentWidth = page.getViewport(this.scale).width;
						const scrollWidth = this.contentNode.offsetWidth - this.contentNode.clientWidth;
						resolve(contentWidth + scrollWidth);
					});
				});
			});
		}
		afterRender() {
			this.loadDocument().then(pdf => {
				console.log('total pages', pdf.numPages);
				for (let i = 1; i <= Math.min(pdf.numPages, PAGES_TO_PRELOAD); i++) {
					if (i === 1) {
						this._handleControls = this.controller.handleVisibleControls.bind(this.controller);
						this.controller.enableReadingMode(true);
						main_core.Runtime.throttle(main_core.Event.bind(window, 'mousemove', this._handleControls), 20);
					}
					this.renderDocumentPage(pdf, i);
				}
			});
		}
		beforeHide() {
			this.pdfRenderedPages = {};
			main_core.Event.unbind(window, 'mousemove', this._handleControls);
			if (this.printer) {
				this.hidePrintProgress();
				this.printer.destroy();
			}
		}
		updatePrintProgressMessage(index, total) {
			const progress = Math.round(index / total * 100);
			this.controller.setTextOnLoading(main_core.Loc.getMessage('JS_UI_VIEWER_ITEM_PREPARING_TO_PRINT').replace('#PROGRESS#', progress));
		}
		showPrintProgress(index, total) {
			this.contentNode.style.opacity = 0.7;
			this.contentNode.style.filter = 'blur(2px)';
			this.controller.showLoading({
				zIndex: 1
			});
			this.updatePrintProgressMessage(index, total);
		}
		hidePrintProgress() {
			this.contentNode.style.opacity = null;
			this.contentNode.style.filter = null;
			this.controller.hideLoading();
		}
		print() {
			if (!this.pdfDocument) {
				console.warn('Where is pdf document to print?');
				return;
			}
			this.showPrintProgress(0, this.pdfDocument.numPages);
			this.printer = new PrintService({
				pdf: this.pdfDocument
			});
			this.printer.init().then(() => {
				this.printer.prepare({
					onProgress: this.updatePrintProgressMessage.bind(this)
				}).then(() => {
					this.hidePrintProgress();
					this.printer.performPrint();
				});
			});
		}
		handleKeyPress(event) {
			if (!this.isLoaded) {
				return false;
			}
			if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp'].includes(event.code)) {
				BX.focus(this.contentNode);
				return false;
			}
			if (event.code === 'Equal') {
				event.preventDefault();
				event.stopPropagation();
				this.zoomIn();
				return true;
			}
			if (event.code === 'Minus') {
				event.preventDefault();
				event.stopPropagation();
				this.zoomOut();
				return true;
			}
			return false;
		}
		getScale() {
			return this.scale;
		}
		setScale(scale) {
			this.scale = scale;
			return this;
		}
		updateScale(scale) {
			if (this.#updatingScalePromise) {
				return this.#updatingScalePromise.then(() => {
					return this.updateScale(scale);
				});
			}
			scale = Number(scale);
			if (this.scale === scale) {
				return Promise.resolve();
			}
			const ratio = scale / this.scale;
			const updatePageScale = (page, canvases, annotationLayers, textLayers) => {
				const canvas = canvases[page.pageNumber - 1];
				if (!canvas) {
					return Promise.resolve();
				}
				const viewport = this.#getViewport(page);
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				return page.render({
					canvasContext: canvas.getContext('2d'),
					viewport
				}).promise.then(() => {
					const annotationLayerNode = annotationLayers[page.pageNumber - 1];
					if (!annotationLayerNode) {
						return null;
					}
					main_core.Dom.clean(annotationLayerNode);
					return this.#renderAnnotationLayer(page, canvas, annotationLayerNode, this.pdfDocument);
				}).then(() => {
					const textLayerNode = textLayers[page.pageNumber - 1];
					if (!textLayerNode) {
						return null;
					}
					main_core.Dom.clean(textLayerNode);
					return this.#renderTextLayer(page, canvas, textLayerNode);
				});
			};
			const promises = [];
			this.scale = scale;
			const canvases = [...this.contentNode.querySelectorAll('canvas[class="ui-viewer-document-page-canvas"]')];
			const annotationLayers = [...this.contentNode.querySelectorAll('div[class="ui-viewer-pdf-annotation-layer"]')];
			const textLayers = [...this.contentNode.querySelectorAll('div[class="ui-viewer-pdf-text-layer"]')];
			Object.values(this.pdfRenderedPages).forEach(renderedPage => {
				if (renderedPage instanceof Promise) {
					promises.push(new Promise(resolve => {
						renderedPage.then(page => {
							updatePageScale(page, canvases, annotationLayers, textLayers).then(resolve);
						});
					}));
				} else {
					promises.push(updatePageScale(renderedPage, canvases, annotationLayers, textLayers));
				}
			});
			main_core.Dom.style(this.contentNode, {
				'--scale-factor': scale
			});
			const scrollTop = this.contentNode.scrollTop * ratio;
			this.contentNode.scrollTo(this.contentNode.scrollLeft, scrollTop);
			this.#updatingScalePromise = Promise.all(promises).finally(() => {
				this.#updatingScalePromise = null;
				this.#firstPageHeight = null;
			});
			return this.#updatingScalePromise;
		}
		getPagesNumber() {
			if (!this.pdfDocument) {
				return null;
			}
			return main_core.Text.toInteger(this.pdfDocument.numPages);
		}
		scrollToPage(pageNumber) {
			const isChanged = this.setPageNumber(pageNumber) !== null;
			if (!isChanged) {
				return Promise.resolve();
			}
			return new Promise(resolve => {
				const renderPromises = [];
				for (let i = 1; i < pageNumber; i++) {
					renderPromises.push(this.renderDocumentPage(this.pdfDocument, i));
				}
				Promise.all(renderPromises).then(pages => {
					let height = 0;
					pages.forEach(page => {
						const viewport = page.getViewport({
							scale: this.scale
						});
						height += viewport.height + 7;
					});
					this.contentNode.scrollTo(this.contentNode.scrollLeft, height);
					resolve();
				});
			});
		}
		getPageNumber() {
			return this.#pageNumber;
		}
		setPageNumber(pageNumber) {
			pageNumber = main_core.Text.toInteger(pageNumber);
			if (pageNumber < 0) {
				pageNumber = 1;
			}
			let numPages = this.getPagesNumber();
			if (!numPages) {
				numPages = 1;
			}
			if (pageNumber > numPages) {
				pageNumber = numPages;
			}
			if (this.#pageNumber !== pageNumber) {
				this.#pageNumber = pageNumber;
				main_core_events.EventEmitter.emit(this, 'BX.UI.Viewer.Item.Document:updatePageNumber');
				return this;
			}
			return null;
		}
	}

	const InlineController = main_core.Reflection.namespace('BX.UI.Viewer.InlineController');

	/**
	 * @memberof BX.UI.Viewer
	 * @extends BX.UI.Viewer.InlineController
	 */
	class SingleDocumentController extends InlineController {
		bindEvents() {
			if (!this.eventsAlreadyBinded && this.getDocumentItem()) {
				main_core_events.EventEmitter.subscribe(this.getDocumentItem(), 'BX.UI.Viewer.Item.Document:updatePageNumber', () => {
					this.getListingControl().update(this.getDocumentItem().getPageNumber());
				});
			}
			super.bindEvents();
		}
		getDocumentItem() {
			return this.items[0];
		}
		updateControls() {
			super.updateControls();
			this.updateListingControl();
		}
		getViewerContainer() {
			if (!this.layout.container) {
				this.layout.inner = main_core.Tag.render`<div class="ui-viewer__single-document--container ">${this.getItemContainer()}</div>`;
				if (this.stretch) {
					main_core.Dom.addClass(this.layout.inner, '--stretch');
				}
				this.layout.container = main_core.Tag.render`<div class="">${this.layout.inner}${this.getControlsContainer()}</div>`;
			}
			return this.layout.container;
		}
		getControlsContainer() {
			if (!this.layout.controlsContainer) {
				return main_core.Tag.render`<div class="ui-viewer__single-document--controls">
				${this.getListingControl().render()}
				${this.getScaleControl().render()}
			</div>`;
			}
			return this.layout.controlsContainer;
		}
		getListingControl() {
			if (!this.listingControl) {
				this.listingControl = new ListingControl();
				this.listingControl.subscribe('pageUpdated', () => {
					this.getDocumentItem()?.scrollToPage(this.listingControl.getCurrent());
				});
				this.updateListingControl();
			}
			return this.listingControl;
		}
		getScaleControl() {
			if (!this.scaleControl) {
				this.scaleControl = new ScaleControl();
				this.scaleControl.subscribe('scaleUpdated', () => {
					this.getDocumentItem()?.updateScale(this.scaleControl.getScale());
				});
			}
			return this.scaleControl;
		}
		updateListingControl() {
			const item = this.getDocumentItem();
			if (item) {
				item.loadDocument().then(() => {
					this.listingControl.update(1, item.getPagesNumber());
				});
			}
		}
		setScale(scale) {
			this.getDocumentItem()?.setScale(scale);
			this.getScaleControl().update(scale);
			return this;
		}
		setPdfSource(pdfSource) {
			this.getDocumentItem()?.setPdfSource(pdfSource);
			return this;
		}
		print() {
			this.getDocumentItem()?.print();
		}
	}
	class ListingControl extends main_core_events.EventEmitter {
		container = null;
		pagesContainer = null;
		constructor(current = 1, pages = 1) {
			super();
			this.setEventNamespace('BX.UI.Viewer.SingleDocumentController.ListingControl');
			this.pages = main_core.Text.toInteger(pages);
			this.current = main_core.Text.toInteger(current);
			this.arrowClickHandler = this.handleArrowClick.bind(this);
		}
		update(current, pages = null) {
			current = main_core.Text.toInteger(current);
			pages = main_core.Text.toInteger(pages);
			if (pages >= 1) {
				this.pages = pages;
			}
			if (current < 1) {
				current = 1;
			}
			if (current > this.pages) {
				current = this.pages;
			}
			if (current !== this.current) {
				this.current = current;
				this.emit('pageUpdated', {
					page: this.current
				});
			}
			this.adjust();
		}
		adjust() {
			this.pagesContainer.innerHTML = this.renderPages();
		}
		getCurrent() {
			return this.current;
		}
		render() {
			if (!this.container) {
				this.pagesContainer = main_core.Tag.render`<div class="ui-viewer__single-document--listing-info">
				${this.renderPages()}
			</div>`;
				this.container = main_core.Tag.render`<div class="ui-viewer__single-document--listing">
				<div class="ui-viewer__single-document--listing--btn --prev" onclick="${this.arrowClickHandler}"></div>
				${this.pagesContainer}
				<div class="ui-viewer__single-document--listing--btn --next" onclick="${this.arrowClickHandler}"></div>
			</div>`;
			}
			return this.container;
		}
		renderPages() {
			return main_core.Loc.getMessage('JS_UI_VIEWER_SINGLE_DOCUMENT_LISTING_PAGES').replace('#CURRENT#', this.current).replace('#ALL#', this.pages);
		}
		handleArrowClick(event) {
			if (event.target.classList.contains('--prev')) {
				this.update(this.current - 1);
			}
			if (event.target.classList.contains('--next')) {
				this.update(this.current + 1);
			}
		}
	}

	// const SCALE_MIN = 0.92;
	const SCALE_MIN = 0.5;
	const SCALE_MAX = 3;
	class ScaleControl extends main_core_events.EventEmitter {
		scale = DEFAULT_SCALE;
		container = null;
		zoomInContainer = null;
		zoomOutContainer = null;
		zoomValueNode = null;
		constructor() {
			super();
			this.scale = DEFAULT_SCALE;
			this.setEventNamespace('BX.UI.Viewer.SingleDocumentController.ScaleControl');
			this.scaleClickHandler = this.handleScaleClick.bind(this);
		}
		getScale() {
			return this.scale;
		}
		setDefaultScale() {
			this.update(DEFAULT_SCALE);
		}
		adjust() {
			if (this.scale <= SCALE_MIN) {
				main_core.Dom.hide(this.getZoomOutContainer());
			} else {
				main_core.Dom.show(this.getZoomOutContainer());
			}
			if (this.scale >= SCALE_MAX) {
				main_core.Dom.hide(this.getZoomInContainer());
			} else {
				main_core.Dom.show(this.getZoomInContainer());
			}
			this.getZoomValueNode().innerText = Math.round(this.scale * 100);
		}
		update(scale) {
			scale = main_core.Text.toNumber(scale);
			if (scale < SCALE_MIN) {
				scale = SCALE_MIN;
			}
			if (scale > SCALE_MAX) {
				scale = SCALE_MAX;
			}
			if (scale !== this.scale) {
				this.scale = scale;
				this.emit('scaleUpdated');
				this.adjust();
			}
		}
		render() {
			if (!this.container) {
				this.container = main_core.Tag.render`<div class="ui-viewer__single-document--zoom">
				${this.getZoomOutContainer()}
				${this.getZoomValueNode()}
				${this.getZoomInContainer()}
			</div>`;
				this.adjust();
			}
			return this.container;
		}
		getZoomInContainer() {
			if (!this.zoomInContainer) {
				this.zoomInContainer = main_core.Tag.render`<div
				class="ui-viewer__single-document--zoom-control --zoom-in"
				onclick="${this.scaleClickHandler}"
			>
<!--				${main_core.Loc.getMessage('JS_UI_VIEWER_SINGLE_DOCUMENT_SCALE_ZOOM_IN')}-->
			</div>`;
			}
			return this.zoomInContainer;
		}
		getZoomOutContainer() {
			if (!this.zoomOutContainer) {
				this.zoomOutContainer = main_core.Tag.render`<div 
				class="ui-viewer__single-document--zoom-control --zoom-out"
				onclick="${this.scaleClickHandler}"
			>
<!--				${main_core.Loc.getMessage('JS_UI_VIEWER_SINGLE_DOCUMENT_SCALE_ZOOM_OUT')}-->
			</div>`;
			}
			return this.zoomOutContainer;
		}
		getZoomValueNode() {
			if (!this.zoomValueNode) {
				this.zoomValueNode = main_core.Tag.render`<span class="ui-viewer__single-document--zoom-value">100</span>`;
			}
			return this.zoomValueNode;
		}
		handleScaleClick(event) {
			let scale = this.scale;
			if (event.target.classList.contains('--zoom-in')) {
				scale = this.scale * 1.1;
			}
			if (event.target.classList.contains('--zoom-out')) {
				scale = this.scale * 0.9;
			}
			this.update(scale);
		}
	}

	exports.Document = Document;
	exports.PrintService = PrintService;
	exports.SingleDocumentController = SingleDocumentController;

})(this.BX.UI.Viewer = this.BX.UI.Viewer || {}, BX, BX.Event);
//# sourceMappingURL=viewer.bundle.js.map
