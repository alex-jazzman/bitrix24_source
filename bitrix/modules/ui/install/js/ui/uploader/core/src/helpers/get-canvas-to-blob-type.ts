import { isSupportedMimeType } from './is-supported-mime-type';

import { type ResizeImageOptions, type ResizeImageMimeTypeMode, type ResizeImageMimeType } from '../types/resize-image-options';

export const getCanvasToBlobType = (blob: Blob, options: ResizeImageOptions): string => {
	const mimeType: ResizeImageMimeType = (
		options.mimeType !== undefined && isSupportedMimeType(options.mimeType)
			? options.mimeType
			: 'image/jpeg'
	);

	const mimeTypeMode: ResizeImageMimeTypeMode | undefined = options.mimeTypeMode;
	if (mimeTypeMode === 'force')
	{
		return mimeType;
	}

	return isSupportedMimeType(blob.type) ? blob.type : mimeType;
};
