export type ImageFormat = 'gif' | 'png' | 'bmp' | 'jpeg' | 'webp';

export const ImageFormats: { readonly [Key in ImageFormat as Capitalize<Key>]: Key } = {
	Gif: 'gif',
	Png: 'png',
	Bmp: 'bmp',
	Jpeg: 'jpeg',
	Webp: 'webp',
};

export type ImageFormatProperties = {
	mimeType: string;
	extensions: string[];
};

const formatProperties: Record<ImageFormat, ImageFormatProperties> = {
	[ImageFormats.Gif]: { mimeType: 'image/gif', extensions: ['gif'] },
	[ImageFormats.Png]: { mimeType: 'image/png', extensions: ['png'] },
	[ImageFormats.Bmp]: { mimeType: 'image/bmp', extensions: ['bmp'] },
	[ImageFormats.Jpeg]: { mimeType: 'image/jpeg', extensions: ['jpg', 'jpeg', 'jpe'] },
	[ImageFormats.Webp]: { mimeType: 'image/webp', extensions: ['webp'] },
};

export const getFormatProperties = (format: ImageFormat): ImageFormatProperties => {
	return formatProperties[format];
};

export const findFormatByExtension = (extension: string): ImageFormat | null => {
	const format = Object.values(ImageFormats).find((candidate: ImageFormat): boolean => {
		return formatProperties[candidate].extensions.includes(extension);
	});

	return format ?? null;
};

export const findFormatByMimeType = (mimeType: string): ImageFormat | null => {
	// a type label is matched by its subtype, so legacy labels like image/jpg keep working
	return findFormatByExtension(mimeType.replace(/^image\//, ''));
};
