// anything the adapter matches by id: replace, remove and update accept these
type ContainsId = {
	id: string | number;
};

// an item after prepareItem: the grid view needs a stable key and a type next to the id
type GridViewItem = ContainsId & {
	type: string;
	key: string | number;
};

type GridViewAdapterProps = {
	items?: Array<ContainsId>;
	rowsCount?: number;
	renderItem: (item: GridViewItem) => unknown;
};

type GridViewAdapterState = {
	items: Array<GridViewItem>;
};

// a file item as the attachment list sees it: FileItem from layout/ui/file plus upload state
// and the legacy image path that older payloads deliver through dataAttributes
type FileAttachmentItem = FileItem & {
	readOnly?: boolean;
	isUploading?: boolean;
	hasError?: boolean;
	dataAttributes?: {
		IMAGE?: string;
	};
};

// the widget hosting the list: the block subscribes to its lifecycle and closes it once the last file is gone
type FileAttachmentWidget = {
	on: (event: string, handler: () => void) => void;
	close: () => void;
};

type FileAttachmentProps = {
	attachments: Array<FileAttachmentItem>;
	layoutWidget: FileAttachmentWidget;
	serverName?: string;
	showName?: boolean;
	showAddButton?: boolean;
	addButtonText?: string;
	attachmentCloseIcon?: string;
	previewSize?: number;
	onAddButtonClick?: () => void;
	onDeleteAttachmentItem?: (index: number) => void;
	onFilePreviewMenuClick?: (options: FileRenderOptions) => void;
	onViewRemoved?: () => void;
};

type FileAttachmentState = {
	attachments: Array<FileAttachmentItem>;
};
