// ElementStyle and Icon are declared in dev/janative/types; an inline import keeps this file ambient,
// so the names below stay visible to JSDoc in .js — a top-level import would turn the file into a module
type FileStyle = Partial<import('../../../../../../../../dev/janative/types/style/element').ElementStyle>;
type FileIcon = import('../../../../../../../../dev/janative/types/enum/icon').Icon;

// one entry of the collection passed as `files`: the native viewer receives it to build the image gallery
type FileItem = {
	id?: number | string;
	url?: string;
	name?: string;
	type?: string;
	previewUrl?: string;
	default?: boolean;
};

type FileProps = {
	id?: number | string;
	url: string;
	imageUri?: string;
	type?: string;
	name?: string;
	showName?: boolean;
	isLoading?: boolean;
	isShimmed?: boolean;
	hasError?: boolean;
	readOnly?: boolean;
	textLines?: number;
	// side of the square preview; everything else scales from it
	previewSize?: number;
	// dresses the root container: spacing between tiles and room for the action badge to overhang go here
	style?: FileStyle;
	files?: Array<FileItem>;
	attachmentCloseIcon?: string;
	onDeleteAttachmentItem?: () => void;
	onFilePreviewMenuClick?: (options: FileRenderOptions) => void;
};

// what a tile hands back to the entry point: its body and the two payloads its taps carry
type FileTile = {
	content: View;
	viewerPayload: FileViewerPayload;
	menuPayload: FileRenderOptions;
};

type FileViewerPayload = {
	fileType: string;
	url: string;
	name?: string | false;
	images?: Array<FileItem>;
	file?: FileItem;
};

// what the menu callback receives: the props plus everything the tile resolved on its way to the screen.
// An image tile adds the absolute urls and the gallery, an icon tile — the extension and the icon it drew
type FileRenderOptions = Omit<FileProps, 'name'> & {
	// false when the caller hides the name: the same value the viewer gets as its title
	name?: string | false;
	fileType: string;
	url: string;
	imageUri?: string;
	images?: Array<FileItem>;
	extension?: string;
	icon?: FileIcon;
};

type FileContentProps = {
	previewSize: number;
	textLines?: number;
	isLoading?: boolean;
	hasError?: boolean;
};

// name is false when the caller hides it, so the label is simply not rendered
type FileImageContentProps = FileContentProps & {
	imageUri: string;
	name?: string | false;
};

type FileIconContentProps = FileContentProps & {
	icon: FileIcon;
	name?: string;
};

type FileShimmerContentProps = {
	previewSize: number;
	textLines?: number;
};

type FileLabelProps = {
	name?: string | false;
	hasError?: boolean;
	textLines?: number;
	ellipsize: 'end' | 'middle';
};

type FileActionButtonProps = {
	attachmentCloseIcon?: string;
	onClick: () => void;
};
