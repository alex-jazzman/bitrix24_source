export type SourceItem = {
	url: string,
	title?: string,
	description?: string,
};

export type SourceViewerProps = {
	sources: Array<SourceItem>,
};

export type SourceViewerState = {};
