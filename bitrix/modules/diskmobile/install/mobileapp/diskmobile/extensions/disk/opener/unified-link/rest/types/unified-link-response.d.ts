declare type UnifiedLinkError = {
	code?: string,
	message?: string,
	customData?: {
		hasPassword?: boolean,
	},
};

declare type UnifiedLinkResponse<TData> = {
	status: 'success' | 'error',
	data: TData,
	errors: UnifiedLinkError[],
};

declare type UnifiedLinkObjectResponse = UnifiedLinkResponse<{
	object?: UnifiedLinkDiskObject,
	diskObject?: UnifiedLinkDiskObject,
}>;

declare type UnifiedLinkFileResponse = UnifiedLinkResponse<{
	file?: UnifiedLinkDiskObject,
}>;

declare type UnifiedLinkEmptyResponse = UnifiedLinkResponse<null>;
