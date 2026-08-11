/* eslint-disable */
interface CardOptions {
	id: string;
	title: string;
	iconClass: string;
	collapsed?: boolean;
}

interface HintOptions {
	text: string;
	link?: {
		text: string;
		helpCode: string;
	};
}

interface PeriodFilterData {
	items: Array<{
		name: string;
		value: string;
		isHtml?: boolean;
	}>;
	currentPeriod: string;
	dateStart: string;
	dateEnd: string;
	dateStartFieldName?: string;
	dateEndFieldName?: string;
}

interface CardConstructorOptions {
	collapsed?: boolean;
}

interface LanguageTimezoneData {
	currentLanguage: string;
	currentTimeZone: string;
	settingsUrl: string;
}

interface ClearCacheData {
	canClearCache: boolean;
	clearCacheTimeout: number | null;
}

interface DatasetTypingData {
	enabled: boolean;
	locked: boolean;
}

interface EncryptionKeyData {
	key: string;
}

interface SettingsPanelOptions {
	container: HTMLElement;
	cards: CardLike[];
}

interface CardLike {
	getLayout(): HTMLElement;
}

declare namespace BX.BIConnector {
	class CollapsibleCard {
		constructor(options: CardOptions);
		getLayout(): HTMLElement;
		getContentContainer(): HTMLElement;
		isCollapsed(): boolean;
	}

	class CardHint {
		constructor(options: HintOptions);
		getLayout(): HTMLElement;
	}

	class PeriodFilterCard {
		constructor(data: PeriodFilterData, componentName: string, signedParameters: string, options?: CardConstructorOptions);
		getLayout(): HTMLElement;
	}

	class LanguageTimezoneCard {
		constructor(data: LanguageTimezoneData, componentName: string, signedParameters: string, options?: CardConstructorOptions);
		getLayout(): HTMLElement;
	}

	class ClearCacheCard {
		constructor(data: ClearCacheData, options?: CardConstructorOptions);
		getLayout(): HTMLElement;
	}

	class DatasetTypingCard {
		constructor(data: DatasetTypingData, componentName: string, signedParameters: string, options?: CardConstructorOptions);
		getLayout(): HTMLElement;
	}

	class EncryptionKeyCard {
		constructor(data: EncryptionKeyData, componentName: string, signedParameters: string, options?: CardConstructorOptions);
		getLayout(): HTMLElement;
	}

	class SettingsApi {
		static clearCache(): Promise<any>;
		static changeBiToken(componentName: string, signedParameters: string): Promise<any>;
		static getDashboardLanguage(componentName: string, signedParameters: string): Promise<any>;
		static getTimeZone(componentName: string, signedParameters: string): Promise<any>;
		static savePeriodFilter(componentName: string, signedParameters: string, data: Record<string, string>): Promise<any>;
		static saveDatasetTyping(componentName: string, signedParameters: string, enabled: boolean): Promise<any>;
	}

	class SettingsPanel {
		constructor(options: SettingsPanelOptions);
		render(): void;
	}
}
