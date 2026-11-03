export type LargeAttachmentCoordinatorOptions = {
	connector: {
		convert: (params: { fileIds: number[], replacementToken: string | null }) => Promise<unknown>,
		deleteUploaded: (params: { token: string }) => Promise<boolean>,
		finalizeReplacement: (params: { previousToken: string, currentToken: string }) => Promise<boolean>,
	},
	maxSize: number,
	tariffAvailable?: boolean,
	getFiles?: () => unknown[],
	insertAddress?: (publicUrl: string) => Promise<void> | void,
	removeAddress?: (publicUrl: string) => void,
	onSetsChanged?: (sets: unknown[]) => void,
	onError?: (error: { code: string, message: string, state: string }) => void,
	onTariffUnavailable?: (error: { code: string, message: string, state: string } | null) => void,
	unsubscribe?: Array<() => void>,
};
