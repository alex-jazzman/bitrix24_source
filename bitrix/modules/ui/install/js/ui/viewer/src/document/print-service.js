import { Dom, Reflection, Type } from 'main.core';

const BXPromise = Reflection.namespace('BX.Promise');

const PRINT_SCALE = 1;

export class PrintService
{
	constructor(options)
	{
		options = options || {};
		this.pdf = options.pdf;
		this.iframe = null;
		this.documentOverview = {};
	}

	init()
	{
		if (this.documentOverview)
		{
			return Promise.resolve(this.documentOverview);
		}

		return new Promise((resolve) => {
			this.pdf.getPage(1).then((page) => {
				const viewport = page.getViewport({ scale: PRINT_SCALE });

				this.documentOverview = {
					width: viewport.width, height: viewport.height, rotation: viewport.rotation,
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
	prepare(options)
	{
		options = options || {};
		const pageCount = this.pdf.numPages;
		let currentPage = -1;
		const promise = new BXPromise();
		let onProgress = null;
		if (Type.isFunction(options.onProgress))
		{
			onProgress = options.onProgress;
		}

		this.frame = this.createIframe();

		const process = () => {
			if (++currentPage >= pageCount)
			{
				console.log('finish', this.frame.contentWindow.document);

				setTimeout(() => {
					promise.fulfill();
				}, 1000);

				return;
			}

			this.renderPage(currentPage + 1).then(() => {
				if (onProgress)
				{
					onProgress(currentPage + 1, pageCount);
				}
				process();
			});
		};

		process();

		return promise;
	}

	renderPage(pageNumber)
	{
		return this.pdf.getPage(pageNumber).then((page) => {
			const scratchCanvas = document.createElement('canvas');
			const viewport = page.getViewport({ scale: PRINT_SCALE });
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
				viewport: page.getViewport({ scale: PRINT_SCALE, rotation: viewport.rotation }),
				intent: 'print',
			};

			return page.render(renderContext).promise.then(() => {
				return {
					scratchCanvas, width, height,
				};
			});
		}).then((printItem) => {
			const img = document.createElement('img');
			img.style.width = printItem.width;
			img.style.height = printItem.height;

			const scratchCanvas = printItem.scratchCanvas;
			if (('toBlob' in scratchCanvas) && !this.disableCreateObjectURL)
			{
				scratchCanvas.toBlob((blob) => {
					img.src = URL.createObjectURL(blob);
				});
			}
			else
			{
				img.src = scratchCanvas.toDataURL();
			}

			const wrapper = document.createElement('div');
			wrapper.appendChild(img);

			this.frame.contentWindow.document.body.appendChild(wrapper);
		});
	}

	destroy()
	{
		if (this.frame)
		{
			Dom.remove(this.frame);
		}
	}

	createIframe()
	{
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

	performPrint()
	{
		this.frame.contentWindow.focus();
		this.frame.contentWindow.print();
	}

	getDocumentOverview()
	{
		return this.documentOverview;
	}
}
