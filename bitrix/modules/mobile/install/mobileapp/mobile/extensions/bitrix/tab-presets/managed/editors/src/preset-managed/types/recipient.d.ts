type ManagedPresetRecipient = TabPresetRecipient & {
	type: 'department' | 'user';
	scope?: 'flat' | 'recursive' | null;
	selectorId?: string | number;
};

type ManagedPresetRecipientTarget = {
	type: 'department' | 'user';
	id: number;
	scope?: 'flat' | 'recursive' | null;
};

type ManagedPresetPreparedRecipient = {
	type: 'department' | 'user' | null;
	id: number;
	scope?: 'flat' | 'recursive';
};

type ManagedPresetDisplayRecipient = ManagedPresetRecipient & {
	key?: string;
	title: string;
	subtitle?: string;
	imageUrl?: string;
};

type ManagedPresetSelectorItem = {
	id?: string | number;
	entityId?: string;
	type?: string;
	scope?: string | null;
	selectorId?: string | number;
	shortTitle?: string;
	title?: string;
	subtitle?: string;
	imageUrl?: string;
	customData?: {
		accessCode?: string;
		sourceEntity?: {
			customData?: {
				accessCode?: string;
			};
		};
	};
};
