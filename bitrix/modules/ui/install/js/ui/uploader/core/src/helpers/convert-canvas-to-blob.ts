import { Type } from 'main.core';
import { createBlobFromDataUri } from './create-blob-from-data-uri';

const canvasPrototype = window.HTMLCanvasElement && window.HTMLCanvasElement.prototype;
const hasToBlobSupport: boolean = Boolean(window.HTMLCanvasElement) && Type.isFunction(canvasPrototype.toBlob);
const canUseOffscreenCanvas: boolean = !Type.isUndefined(window.OffscreenCanvas);

export const convertCanvasToBlob = (
	canvas: HTMLCanvasElement | OffscreenCanvas,
	type: string,
	quality: number,
): Promise<Blob> => {
	return new Promise((resolve, reject) => {
		if (canUseOffscreenCanvas && canvas instanceof OffscreenCanvas)
		{
			canvas
				.convertToBlob({ type, quality })
				.then((blob: Blob) => {
					resolve(blob);
				})
				.catch((error) => {
					reject(error);
				});
		}
		else if (hasToBlobSupport)
		{
			(canvas as HTMLCanvasElement).toBlob(
				(blob: Blob | null) => {
					resolve(blob as Blob);
				},
				type,
				quality,
			);
		}
		else
		{
			const blob = createBlobFromDataUri((canvas as HTMLCanvasElement).toDataURL(type, quality));

			resolve(blob);
		}
	});
};
