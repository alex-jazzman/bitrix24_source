type NewProjectsPromoState = Readonly<{
	viewed: boolean;
	synced: boolean;
}>;

declare function isViewed(): boolean;
declare function isSynced(): boolean;
declare function markViewed(): void;
declare function markSynced(): void;

export {
	NewProjectsPromoState,
	isViewed,
	isSynced,
	markViewed,
	markSynced,
};
