// Recent-call store item's own call handle. `id`/`uuid` are read by the guest-join flow;
// other fields (e.g. associatedEntity, state) are consumed only by recent-calls-sync, which
// stays untyped (`any`) — this shape does not need to be exhaustive for that consumer.
export type RecentCallHandle = Object & {
	id: string,
	uuid: string,
};

export type RecentCall = {
	dialogId: string,
	name: string,
	state: string,
	call: RecentCallHandle,
};

export type AddActiveCallParams = {
	dialogId: string,
	name: string,
	call: Object,
	state: string,
};

export type ChatInfo = {
	dialogId: string,
	chatId: number,
	type: string,
	name: string,
	avatar: string,
	color: string,
	entityType: string,
	entityId: string,
	entityData1: string,
	entityData2: string,
	entityData3: string,
	userCounter: number,
	public?: { code?: string },
};

export type ChatFields = {
	dialogId: string,
	type: string,
	name: string,
	avatar: string,
	color: string,
};

export type AppLayout = {
	name: string,
	entityId: string,
};
