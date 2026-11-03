export type RequestStatus = 'pending' | 'fulfilled' | 'rejected';

/** How one deduplicated request is recorded in the storage shared by all its duplicates. */
export type RequestRecord = {
	status: RequestStatus,
	/** A response for a settled request, an error for a rejected one, null while it runs. */
	result: unknown,
	/** Refreshed by the heartbeat: a record whose timestamp stops moving counts as dead. */
	timestamp: number,
};

/** The part of the native shared storage the manager relies on. */
export type RequestStore = {
	get: (key: string) => RequestRecord | null,
	set: (key: string, record: RequestRecord | null) => void,
};
