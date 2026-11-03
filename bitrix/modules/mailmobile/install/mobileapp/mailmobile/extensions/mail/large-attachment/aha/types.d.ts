export type LargeAttachmentAhaController = {
	hide: () => void,
};

export type LargeAttachmentAhaMomentProps = {
	testId: string,
	targetRef: unknown,
	description: string,
	disableHideByOutsideClick: boolean,
	delay: number,
	autoCloseDelay: number,
	onShow: () => void,
	onShowSkipped: () => void,
};

export type LargeAttachmentAhaOptions = {
	connector?: {
		saveUserOption: (params: { category: string, name: string, value?: string }) => Promise<boolean>,
	},
	available?: boolean,
	showHeavyFileHint?: boolean,
	heavyFileOptionName?: string,
	showStorageNotice?: boolean,
	storageNoticeOptionName?: string,
	showMoment?: (props: LargeAttachmentAhaMomentProps) => LargeAttachmentAhaController | null,
};

export type LargeAttachmentAhaParams = {
	targetRef?: unknown,
	hasHeavyFile?: boolean,
};
