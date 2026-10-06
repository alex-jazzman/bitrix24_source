import { getResizedImageSize } from './get-resized-image-size';
import { createImagePreviewCanvas } from './create-image-preview-canvas';
import { convertCanvasToBlob } from './convert-canvas-to-blob';
import { isSupportedMimeType } from './is-supported-mime-type';
import { sharpen, shouldSharpen } from './sharpen';

import { type ResizeImageMimeType, type ResizeImageOptions } from '../types/resize-image-options';

type CreateImagePreviewResult = {
	width: number;
	height: number;
	blob: Blob;
};

export const createImagePreview = (
	imageData: ImageBitmap | HTMLImageElement,
	options: ResizeImageOptions,
): Promise<CreateImagePreviewResult> => {
	const { targetWidth, targetHeight } = getResizedImageSize(imageData, options);

	const canvas: HTMLCanvasElement | OffscreenCanvas = createImagePreviewCanvas(imageData, targetWidth, targetHeight);
	if (shouldSharpen(imageData, targetWidth, targetHeight))
	{
		sharpen(canvas, targetWidth, targetHeight, 0.2);
	}

	const { quality = 0.92 } = options;
	const mimeType: ResizeImageMimeType = options.mimeType !== undefined && isSupportedMimeType(options.mimeType) ? options.mimeType : 'image/jpeg';

	return convertCanvasToBlob(canvas, mimeType, quality).then((blob) => {
		return {
			width: targetWidth,
			height: targetHeight,
			blob,
		};
	});
};
