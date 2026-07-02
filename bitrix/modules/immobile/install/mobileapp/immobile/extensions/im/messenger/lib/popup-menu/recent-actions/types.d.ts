export const RecentActionsMenuSection: {
	folderActions: 'folderActions';
	folderGeneral: 'folderGeneral';
	filter: 'filter';
	general: 'general';
};

export type RecentActionsMenuOptions = {
	sections?: string[];
	targetId?: string;
	showFolderActions?: boolean;
	additionalItems?: AdditionalItem[];
	additionalSections?: AdditionalSection[];
	cacheId?: string;
}

export type AdditionalItem = {
	id: string;
	title: string | (() => string);
	iconName?: string;
	sectionCode: string;
	checked?: boolean | (() => boolean);
	shouldShow?: () => Promise<boolean>;
	callback: () => Promise<void>;
}

export type AdditionalSection = PopupMenuSectionItem;
