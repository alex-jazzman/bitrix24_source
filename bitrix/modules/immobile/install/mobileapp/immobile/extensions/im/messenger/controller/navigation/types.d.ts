import {SelectionTabResult} from './src/result';

declare type NavigationApi = {
	setActiveTab: (tabId: string, options?: TabOptions) => Promise<SelectionTabResult>,
	closeAllWidgets: () => Promise<void>,
	isTopNestedNavigationForChat: (chatId: number) => boolean,
	openNestedNavigation: (chatId: number) => Promise<object>,
}

declare type NestedNavigationOpenFilterContext = {
	// parent chatId of the nested navigation being opened (a project parent)
	chatId: number,
}
