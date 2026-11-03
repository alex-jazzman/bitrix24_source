import { Messenger } from 'im.public';
import { PromoManager } from 'im.v2.lib.promo';
import { MessengerSlider } from 'im.v2.lib.slider';
import { SoundNotificationManager } from 'im.v2.lib.sound-notification';

export interface ImUi
{
	openChat(dialogId: string): Promise<unknown>;
	openConference(params: { code?: string }): unknown;
	openSettings(): unknown;
	openTaskComments(dialogId: string): Promise<unknown>;
	isEmbeddedMode(): boolean;
	isMessengerSliderOpened(): boolean;
	sliderZIndex(): number;
	isSliderOpened(): boolean;
	isSliderFocused(): boolean;
	isPromoRequired(code: string): boolean;
	markPromoWatched(code: string): Promise<unknown>;
	playSoundLoop(type: string, timeout: number, force: boolean): void;
	stopSound(type: string): void;
}

const methods = {
	openChat(dialogId: string): Promise<unknown>
	{
		return Messenger.openChat(dialogId);
	},
	openConference(params: { code?: string }): unknown
	{
		return Messenger.openConference(params);
	},
	openSettings(): unknown
	{
		return Messenger.openSettings();
	},
	openTaskComments(dialogId: string): Promise<unknown>
	{
		return Messenger.openTaskComments(dialogId);
	},
	isEmbeddedMode(): boolean
	{
		return Messenger.isEmbeddedMode();
	},
	isMessengerSliderOpened(): boolean
	{
		return Messenger.isMessengerSliderOpened();
	},
	sliderZIndex(): number
	{
		return MessengerSlider.getInstance().getZIndex();
	},
	isSliderOpened(): boolean
	{
		return MessengerSlider.getInstance().isOpened();
	},
	isSliderFocused(): boolean
	{
		return MessengerSlider.getInstance().isFocused();
	},
	isPromoRequired(code: string): boolean
	{
		return PromoManager.getInstance().needToShow(code);
	},
	markPromoWatched(code: string): Promise<unknown>
	{
		return PromoManager.getInstance().markAsWatched(code);
	},
	playSoundLoop(type: string, timeout: number, force: boolean): void
	{
		// @ts-ignore [call-ts] sound manager is untyped
		SoundNotificationManager.getInstance().playLoop(type, timeout, force);
	},
	stopSound(type: string): void
	{
		// @ts-ignore [call-ts] sound manager is untyped
		SoundNotificationManager.getInstance().stop(type);
	},
};

export const ImUiAdapter = new Proxy(methods, {
	get(target, property)
	{
		if (Reflect.has(target, property))
		{
			return Reflect.get(target, property);
		}

		throw new Error(`ImUi: method "${String(property)}" is not registered in the adapter.`);
	},
}) as ImUi;
