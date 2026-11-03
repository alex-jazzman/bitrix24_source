export type LargeAttachmentSet = {
	publicUrl: string,
	token: string,
	fileIds: number[],
	folderName: string,
};

export type LargeAttachmentConvertParams = {
	fileIds: number[],
	mailboxId?: number | null,
	replacementToken?: string | null,
};

export type LargeAttachmentError = {
	code: string,
	message: string,
	state: string,
};

export type LargeAttachmentConnectorOptions = {
	context?: 'mail' | 'crm',
	mailboxId?: number | null,
	runAction?: (action: string, config: { data: Record<string, unknown> }) => Promise<unknown>,
};
