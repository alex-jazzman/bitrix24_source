export type SidebarSharedLinkItem = {
	id: number,
	code: string,
	dataCreate: Date,
	dataExpire: Date | null,
	entityId: string,
	entityType: string,
	requireApproval: boolean,
	type: string,
	url: string,
};
