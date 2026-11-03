export type DraftScheduler = {
	setTimeout: (callback: () => void, timeout: number) => number,
	clearTimeout: (timerId: number) => void,
};

export type DraftCoordinatorOptions = {
	connector: {
		save: (params: DraftSaveParams) => Promise<{ data: { draft: DraftView } }>,
		getCurrent: (draftId: number | null) => Promise<{ data: { draft: DraftView | null } }>,
	},
	draftId?: number | null,
	revision?: number | null,
	clientId?: string | null,
	acceptedSnapshot?: DraftSnapshot | null,
	onForeignConflict?: () => void,
	onSaved?: (draft: DraftView, snapshot: DraftSnapshot) => void,
	debounceMs?: number,
	scheduler?: DraftScheduler,
	fingerprint?: (snapshot: DraftSnapshot) => string,
	unsubscribe?: Array<() => void>,
};
