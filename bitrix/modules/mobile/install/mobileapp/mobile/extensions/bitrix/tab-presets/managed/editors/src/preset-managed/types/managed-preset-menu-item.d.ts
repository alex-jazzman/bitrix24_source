type ManagedPresetMenuItemType = 'active' | 'inactive' | 'static';

type ManagedPresetMenuItem = {
	key: string;
	type: ManagedPresetMenuItemType;
	title?: string;
	iconId?: string;
	imageUrl?: string;
	isAvatarEnabled?: boolean;
	disabled?: boolean;
	[key: string]: unknown;
};
