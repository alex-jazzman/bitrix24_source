// an extra entry in the picker menu, next to the built-in gallery and camera items
type DiskUploaderPickerItem = {
	id: string;
	name?: string;
};

// the bottom sheet hands its own widget to the view. Only these three members are used here, and two
// of them accept more than the platform LayoutWidget declaration admits: `on` takes a handler and
// `close` takes a callback
type DiskUploaderWidget = {
	preventBottomSheetDismiss: (prevent: boolean) => void;
	on: (event: string, handler: () => void) => void;
	close: (callback?: () => void) => void;
};

// anything that can host a widget — PageManager or another layout widget. The uploader never calls
// it itself: the widget only travels through to the bottom sheet, which opens itself inside it
type DiskUploaderParentWidget = {
	openWidget: (widgetName: string, settings: Record<string, unknown>) => Promise<DiskUploaderWidget>;
};

type DiskUploaderOptions = {
	folderId: number;
	layoutWidget?: DiskUploaderParentWidget;
	extraItems?: Array<DiskUploaderPickerItem>;
	itemSelectedCallback?: (itemId: string) => void;
	// tapping a finished row opens the file in the native viewer instead of doing nothing
	shouldOpenNativeViewer?: boolean;
	onCommit?: (files: Array<DiskUploadedFile>) => void;
};
