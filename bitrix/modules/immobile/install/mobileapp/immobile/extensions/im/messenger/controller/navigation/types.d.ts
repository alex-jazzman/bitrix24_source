import {SelectionTabResult} from './src/result';

declare type NavigationApi = {
	setActiveTab: (tabId: string, options?: TabOptions) => Promise<SelectionTabResult>,
	closeAllWidgets: () => Promise<void>,
	isTopNestedNavigationForChat: (chatId: number) => boolean,
	openNestedNavigation: (chatId: number) => Promise<object>,
}
