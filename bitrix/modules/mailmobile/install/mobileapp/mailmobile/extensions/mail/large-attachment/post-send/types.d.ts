export type LargeAttachmentPostSendProps = {
	testId: string,
	onChoice?: (choice: string, dontAskAgain: boolean) => void,
};

export type LargeAttachmentPostSendState = {
	dontAskAgain: boolean,
};

export type LargeAttachmentPostSendParams = {
	sets: Array<{ token: string, publicUrl: string }>,
	connector: {
		deleteUploaded: (params: { token: string }) => Promise<boolean>,
		saveUserOption: (params: { category: string, name: string, value?: string }) => Promise<boolean>,
	},
	suppressed?: boolean,
	optionName?: string,
	parentWidget?: { openWidget: (...args: unknown[]) => Promise<unknown> },
	onComplete?: () => void,
};

export type LargeAttachmentPostSendChoiceParams = {
	choice: string,
	dontAskAgain: boolean,
	sets: Array<{ token: string }>,
	connector: {
		deleteUploaded: (params: { token: string }) => Promise<boolean>,
		saveUserOption: (params: { category: string, name: string, value?: string }) => Promise<boolean>,
	},
	optionName?: string,
};
