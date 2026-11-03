import { getFormatProperties, type ImageFormat } from './image-size/image-format';
import { isValidFileType } from './is-valid-file-type';

export const isAcceptedImageFormat = (format: ImageFormat, acceptedFileTypes: string[]): boolean => {
	const { mimeType, extensions } = getFormatProperties(format);

	// an extension is matched against the end of a name, so every extension of the format is tried
	return extensions.some((extension: string): boolean => {
		return isValidFileType({ name: `image.${extension}`, type: mimeType }, acceptedFileTypes);
	});
};
