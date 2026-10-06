/* eslint-disable @bitrix24/bitrix24-rules/no-typeof */

// Warning!
// This function uses in a resize workers.
// You cannot import anything from other files and extensions.
type DrawableImageSource = CanvasImageSource & { width: number, height: number };

export const createImagePreviewCanvas = (
	imageSource: DrawableImageSource,
	newWidth: number,
	newHeight: number,
): HTMLCanvasElement | OffscreenCanvas => {
	const width: number = Math.round(newWidth);
	const height: number = Math.round(newHeight);

	const isPageContext: boolean = (
		typeof (window) !== 'undefined'
		&& typeof (document) !== 'undefined'
		&& typeof (parent) !== 'undefined'
	);

	const createCanvas = (canvasWidth: number, canvasHeight: number): HTMLCanvasElement | OffscreenCanvas => {
		if (isPageContext)
		{
			const canvas: HTMLCanvasElement = document.createElement('canvas');
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;

			return canvas;
		}

		return new OffscreenCanvas(canvasWidth, canvasHeight);
	};

	if (imageSource.height <= height && imageSource.width <= width)
	{
		const canvas: HTMLCanvasElement | OffscreenCanvas = createCanvas(width, height);
		const context = canvas.getContext('2d') as CanvasRenderingContext2D;
		context.imageSmoothingQuality = 'high';
		context.drawImage(imageSource, 0, 0, width, height);

		return canvas;
	}

	let currentImageWidth: number = Math.floor(imageSource.width);
	let currentImageHeight: number = Math.floor(imageSource.height);
	let currentImageSource: DrawableImageSource | null = imageSource;
	let resizingCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;

	while (currentImageWidth * 0.5 > width)
	{
		const halfImageWidth: number = Math.floor(currentImageWidth * 0.5);
		const halfImageHeight: number = Math.floor(currentImageHeight * 0.5);

		resizingCanvas = createCanvas(halfImageWidth, halfImageHeight);
		const resizingCanvasContext = resizingCanvas.getContext('2d') as CanvasRenderingContext2D;
		resizingCanvasContext.imageSmoothingQuality = 'high';

		resizingCanvasContext.drawImage(
			currentImageSource,
			0,
			0,
			currentImageWidth,
			currentImageHeight,
			0,
			0,
			halfImageWidth,
			halfImageHeight,
		);

		currentImageWidth = halfImageWidth;
		currentImageHeight = halfImageHeight;
		currentImageSource = resizingCanvas;
	}

	const outputCanvas: HTMLCanvasElement | OffscreenCanvas = createCanvas(width, height);
	const outputCanvasContext = outputCanvas.getContext('2d') as CanvasRenderingContext2D;
	outputCanvasContext.imageSmoothingQuality = 'high';
	outputCanvasContext.drawImage(
		resizingCanvas === null ? imageSource : resizingCanvas,
		0,
		0,
		currentImageWidth,
		currentImageHeight,
		0,
		0,
		width,
		height,
	);

	if (resizingCanvas)
	{
		resizingCanvas.width = 0;
		resizingCanvas.height = 0;
		resizingCanvas = null;

		currentImageSource.width = 0;
		currentImageSource.height = 0;
		currentImageSource = null;
	}

	return outputCanvas;
};
