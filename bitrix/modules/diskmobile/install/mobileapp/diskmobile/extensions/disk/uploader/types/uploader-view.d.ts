// Color is declared in dev/janative/types of the mobile module; an inline import keeps this file
// ambient, so the name stays visible to JSDoc in .js — a top-level import would turn it into a module
type DiskUploaderColor = import('../../../../../../../../mobile/dev/janative/types/enum/color').Color;

type DiskUploaderViewProps = {
	tasks: Array<DiskUploadTask>;
	layoutWidget: DiskUploaderWidget;
	shouldOpenNativeViewer?: boolean;
	onCommit?: (files: Array<DiskUploadedFile>) => void;
};

// originalTasks keeps the untouched copies: a retry starts from one of them, not from the failed
// attempt, which by then carries the status and the progress of the failure
type DiskUploaderViewState = {
	tasks: Array<DiskUploadTask>;
	originalTasks: Array<DiskUploadTask>;
	finalization: boolean;
};

// the row is built from the task itself, so its props carry every task field along with the handlers
type DiskUploaderFileRowProps = DiskUploadTask & {
	shouldOpenNativeViewer?: boolean;
	onRemoveTaskClick?: (taskId: string) => void;
	onCancelTaskClick?: (taskId: string) => void;
	onRetryTaskClick?: (taskId: string) => void;
};

type DiskUploaderFileRowState = DiskUploadProgressState;

type DiskUploaderProgressBarProps = DiskUploadProgressState & {
	testId?: string;
};

type DiskUploaderProgressBarState = DiskUploadProgressState;

// dims the preview and puts one round button over it
type DiskFileRowPreviewOverlayProps = {
	testId: string;
	backgroundColor: string;
	onClick?: () => void;
};
