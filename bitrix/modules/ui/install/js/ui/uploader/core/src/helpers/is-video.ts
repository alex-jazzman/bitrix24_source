import { type UploaderFile } from '../uploader-file';

export const isVideo = (file: UploaderFile) => {
	return /^video\/[\d.a-z-]+$/i.test(file.getType()) || file.getExtension() === 'mkv';
};
