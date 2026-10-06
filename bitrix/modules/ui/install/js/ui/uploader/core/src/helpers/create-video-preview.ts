import { Event } from 'main.core';
import { getResizedImageSize } from './get-resized-image-size';
import { type ResizeImageOptions } from '../types/resize-image-options';
import { convertCanvasToBlob } from './convert-canvas-to-blob';
import { createImagePreviewCanvas } from './create-image-preview-canvas';

type VideoPreviewResult = {
	preview: Blob;
	width: number;
	height: number;
};

const DEFAULT_VIDEO_PREVIEW_OPTIONS: ResizeImageOptions = { width: 300, height: 3000 };

export const createVideoPreview = (
	blob: Blob,
	options: ResizeImageOptions = DEFAULT_VIDEO_PREVIEW_OPTIONS,
	seekTime: number = 10,
): Promise<VideoPreviewResult> => {
	return new Promise<VideoPreviewResult>((resolve, reject) => {
		const video: HTMLVideoElement = document.createElement('video');
		video.setAttribute('src', URL.createObjectURL(blob));
		video.load();

		Event.bind(video, 'error', (error) => {
			reject(error || 'Error while loading video file');
		});

		Event.bind(video, 'loadedmetadata', () => {
			video.currentTime = video.duration < seekTime ? 0 : seekTime;

			Event.bind(video, 'seeked', () => {
				const imageData = { width: video.videoWidth, height: video.videoHeight };
				const { targetWidth, targetHeight } = getResizedImageSize(imageData, options);
				if (!targetWidth || !targetHeight)
				{
					reject();

					return;
				}

				const canvas: HTMLCanvasElement | OffscreenCanvas = createImagePreviewCanvas(
					video,
					targetWidth,
					targetHeight,
				);

				const { quality = 0.92, mimeType = 'image/jpeg' } = options;
				convertCanvasToBlob(canvas, mimeType, quality)
					.then((previewBlob: Blob) => {
						resolve({
							preview: previewBlob,
							width: targetWidth,
							height: targetHeight,
						});
					})
					.catch(() => {
						reject();
					});
			});
		});
	});
};
