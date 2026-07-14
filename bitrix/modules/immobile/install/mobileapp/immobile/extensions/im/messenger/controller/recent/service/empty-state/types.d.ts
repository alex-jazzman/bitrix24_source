import { IBaseRecentService } from '../base/type';

export interface IEmptyStateService extends IBaseRecentService
{
    subscribeEvents: () => void;
    redraw: () => void;
    show: () => Promise<void>;
    hide: () => Promise<void>;
}

declare interface IWelcomeScreen
{
    toChatRecentWidgetItem(): object;
    isLayoutComponentSupported(): boolean;
    toLayoutComponent(): LayoutComponent<any, any> | null;
}

declare type CommonEmptyStateServiceProps = {
    welcomeScreenExtension: string,
	welcomeScreenProps?: object,
};
