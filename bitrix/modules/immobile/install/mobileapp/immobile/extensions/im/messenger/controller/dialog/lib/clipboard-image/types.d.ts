declare type ClipboardImage = {
	height: number,
	width: number,
	previewHeight: number,
	previewWidth: number,
	name: string,
	previewUrl: string,
	type: string,
	url: string,
};

declare type ClipboardImages = Array<ClipboardImage>;
