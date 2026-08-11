declare type VibeCodeCatalogOwner = {
	id: number | null,
	title: string,
};

declare type VibeCodeCatalogItemData = {
	id: number,
	kind: string,
	title: string,
	description?: string | null,
	iconUrl?: string | null,
	viewUrl?: string | null,
	chatId?: number | null,
	externalId?: string | null,
	/** @deprecated Use owner.id instead. Kept for backward compatibility. */
	ownerId: number,
	owner: VibeCodeCatalogOwner,
	counter?: number | null,
	isPinned: boolean,
	isMine: boolean,
	isHidden: boolean,
	isLast?: boolean,
};

declare type VibeCodeCatalogItemProps = {
	item: VibeCodeCatalogItemData,
	testId?: string,
	params?: {
		contentBottomPadding?: number,
		actionButtonClickHandler?: Function,
		itemLongClickHandler?: Function,
	},
	itemDetailOpenHandler?: Function,
	onClick?: Function,
};
