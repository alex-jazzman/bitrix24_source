import { getFilenameWithoutExtension } from './get-filename-without-extension';

const extensionMap: { [key: string]: string } = {
	jpeg: 'jpg',
};

export const renameFileToMatchMimeType = (filename: string, mimeType: string): string => {
	const name = getFilenameWithoutExtension(filename);
	const type = mimeType.split('/')[1];
	const extension = extensionMap[type] || type;

	return `${name}.${extension}`;
};
