export interface CardOptions {
	id: string;
	title: string;
	iconClass: string;
	collapsed?: boolean;
}

export interface CardConstructorOptions {
	collapsed?: boolean;
}

export interface HintOptions {
	text: string;
	link?: {
		text: string;
		helpCode: string;
	};
}

export interface PeriodFilterData {
	items: Array<{ name: string; value: string; isHtml?: boolean }>;
	currentPeriod: string;
	dateStart: string;
	dateEnd: string;
	dateStartFieldName?: string;
	dateEndFieldName?: string;
}

export interface LanguageTimezoneData {
	currentLanguage: string;
	currentTimeZone: string;
	settingsUrl: string;
}

export interface ClearCacheData {
	canClearCache: boolean;
	clearCacheTimeout: number | null;
}

export interface DatasetTypingData {
	enabled: boolean;
	locked: boolean;
}

export interface EncryptionKeyData {
	key: string;
}
