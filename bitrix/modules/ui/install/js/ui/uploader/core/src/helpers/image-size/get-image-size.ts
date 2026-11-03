import { Gif } from './types/gif';
import { Png } from './types/png';
import { Bmp } from './types/bmp';
import { Jpeg } from './types/jpeg';
import { Webp } from './types/webp';

import { getFileExtension } from '../get-file-extension';
import { detectImageFormat } from './detect-image-format';
import { findFormatByExtension, findFormatByMimeType, ImageFormats, type ImageFormat } from './image-format';
import { type ImageSize } from './image-size-type';

type ImageSizeHandler = { getSize: (file: File) => Promise<ImageSize> };

const typeHandlers: Record<ImageFormat, ImageSizeHandler> = {
	[ImageFormats.Gif]: new Gif(),
	[ImageFormats.Png]: new Png(),
	[ImageFormats.Bmp]: new Bmp(),
	[ImageFormats.Jpeg]: new Jpeg(),
	[ImageFormats.Webp]: new Webp(),
};

export const getImageSize = async (file: File): Promise<ImageSize> => {
	if (file.size === 0)
	{
		throw new Error('Unknown image type.');
	}

	const extension = getFileExtension(file.name).toLowerCase();
	const nameFormat = findFormatByExtension(extension) ?? findFormatByMimeType(file.type);

	let primaryError: unknown = null;
	if (nameFormat !== null)
	{
		try
		{
			return await typeHandlers[nameFormat].getSize(file);
		}
		catch (error)
		{
			primaryError = error;
		}
	}

	const contentFormat = await detectImageFormat(file);
	if (contentFormat === null || contentFormat === nameFormat)
	{
		throw primaryError ?? new Error('Unknown image type.');
	}

	const size = await typeHandlers[contentFormat].getSize(file);

	return { ...size, contentFormat };
};
