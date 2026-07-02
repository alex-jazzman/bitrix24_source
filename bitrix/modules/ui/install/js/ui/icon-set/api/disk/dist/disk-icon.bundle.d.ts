/* eslint-disable */
interface FileIconOptions {
	size?: number;
	type?: string;
	previewUrl?: string | null;
	alt?: string;
	title?: string;
	responsive?: boolean;
}

declare namespace BX.UI.IconSet.Api.Disk {
	const DiskIconType: Readonly<{
		png: "png";
		jpg: "jpg";
		jpeg: "jpeg";
		gif: "gif";
		bmp: "bmp";
		webp: "webp";
		svg: "svg";
		xml: "xml";
		pdf: "pdf";
		xls: "xls";
		xlsx: "xlsx";
		doc: "doc";
		docx: "docx";
		txt: "txt";
		ppt: "ppt";
		pptx: "pptx";
		rar: "rar";
		zip: "zip";
		gzip: "gzip";
		gz: "gz";
		archive: "archive";
		folder: "folder";
		folderGroup: "folderGroup";
		folderShared: "folderShared";
		folderCollab: "folderCollab";
		folder24: "folder24";
		folderPerson: "folderPerson";
		mp4: "mp4";
		avi: "avi";
		mov: "mov";
		wmv: "wmv";
		webm: "webm";
		mkv: "mkv";
		video: "video";
		file: "file";
		board: "board";
	}>;

	class DiskIcon {
		constructor(options?: FileIconOptions);
		static render(options: FileIconOptions): HTMLElement;
		render(): HTMLElement;
		setType(type: string): void;
		setPreviewUrl(previewUrl: string | null): void;
		setAlt(alt: string): void;
		setTitle(title: string): void;
		setSize(size: number): void;
		setResponsive(responsive: boolean): void;
		renderOnNode(target: HTMLElement): void;
		destroy(): void;
	}
}
