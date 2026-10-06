export type ResizeImageMode = 'contain' | 'cover' | 'crop' | 'force';
export type ResizeImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';
export type ResizeImageMimeTypeMode = 'auto' | 'force';

export type ResizeImageOptions = {
	mode?: ResizeImageMode;
	upscale?: boolean;
	width?: number | null;
	height?: number | null;
	quality?: number;
	mimeType?: ResizeImageMimeType;
	mimeTypeMode?: ResizeImageMimeTypeMode;
};
