declare type UnifiedLinkCommitConfig = {
	url: string,
	method?: string,
	dataType?: string,
	prepareData?: boolean,
	uploadBinary?: boolean,
	headers?: Record<string, string>,
	data?: string,
};
