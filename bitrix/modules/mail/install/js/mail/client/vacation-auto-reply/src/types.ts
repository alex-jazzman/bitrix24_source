/** The backend owns this structure; the screen only mirrors it and never fills in fields of its own. */
export type VacationAutoReplySetting = {
	mailboxId: number,
	active: boolean,
	/** ISO 8601 in the timezone the bounds were set in, null while the period is not set. */
	startsAt: string | null,
	endsAt: string | null,
	timezoneId: string,
	body: string,
	/** Reading the setting is allowed wider than changing it: shared access sees but does not edit. */
	canEdit: boolean,
};

/** One entry of the mailbox switcher returned with the setting. */
export type MailboxOption = {
	id: number,
	email: string,
};

export type GetSettingResponse = {
	setting: VacationAutoReplySetting,
	mailboxes: MailboxOption[],
};

export type SaveSettingResponse = {
	setting: VacationAutoReplySetting,
};

export type SaveActiveFlag = 0 | 1;

export type SaveSettingRequest = {
	mailboxId: number,
	active: SaveActiveFlag,
	/** Wall clock time of `timezoneId`; empty means "keep the stored period". */
	startsAt: string,
	endsAt: string,
	timezoneId: string,
	body: string,
};

export type AjaxError = {
	code?: string,
	message: string,
	customData?: unknown,
};

/** A failed request rejects with an envelope of the same shape, so errors are read in one place. */
export type AjaxResponse<T> = {
	data: T,
	errors: AjaxError[],
	status: 'success' | 'error',
};

/** Parameters the screen application is started with. */
export type ScreenParams = {
	containerId: string,
	mailboxId: number | null,
	timezoneId: string,
	editorId: string,
	mailboxListPath: string,
};
