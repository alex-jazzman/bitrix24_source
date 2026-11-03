import { type ImageFormat } from './image-format';

export type ImageSize = {
	width: number;
	height: number;
	animated?: boolean;
	orientation?: number;
	contentFormat?: ImageFormat;
};
