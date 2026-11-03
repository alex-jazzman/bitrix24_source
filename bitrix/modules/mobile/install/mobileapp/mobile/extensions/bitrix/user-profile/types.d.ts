type PresentationLike = {
	isModal(): boolean;
};

type UserProfileOpenParams = {
	ownerId?: number;
	selectedTabId?: string;
	openInComponent?: boolean;
	presentation?: PresentationLike | null;
	parentWidget?: PageManager;
	analyticsSection?: string;
};

export { PresentationLike, UserProfileOpenParams };
