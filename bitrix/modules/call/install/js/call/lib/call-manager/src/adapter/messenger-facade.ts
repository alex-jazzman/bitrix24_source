import { ChatType, RecentCallStatus } from 'im.v2.const';

import type { ImUi } from './im-ui';
import type { RecentCall } from '../type/im';

type MessengerFacadeDeps = {
	ui: ImUi,
	getCurrentDialogId: () => string,
	getCurrentUser: () => Object,
	getMessageCount: () => number,
	getDialog: (dialogId: string) => { type: string } | null,
	getRecentCalls: () => RecentCall[],
	showUserSelector: Function,
};

export type MessengerFacade = Record<string, unknown>;

export const createMessengerFacade = (deps: MessengerFacadeDeps): MessengerFacade =>
{
	const { ui } = deps;

	const openMessenger = (dialogId: string, force: boolean = false) =>
	{
		if (!force)
		{
			const dialog = deps.getDialog(dialogId);
			if (dialog && dialog.type === ChatType.taskComments)
			{
				if (ui.isEmbeddedMode() || ui.isMessengerSliderOpened())
				{
					return ui.openTaskComments(dialogId);
				}

				return Promise.resolve();
			}
		}

		// @ts-expect-error [call-ts] BX.SidePanel is untyped
		const sidePanel = BX?.SidePanel?.Instance;
		const hasChatUnderSlider = sidePanel?.getOpenSlidersCount?.() > 0
			&& sidePanel?.getPageUrl?.()?.includes('/online/');

		if (hasChatUnderSlider)
		{
			const topSlider = sidePanel?.getTopSlider?.();
			if (topSlider?.close)
			{
				return new Promise((resolve) => {
					topSlider.close(false, resolve);
				}).then(() => ui.openChat(dialogId));
			}
		}

		return ui.openChat(dialogId);
	};

	return {
		getDefaultZIndex: () => ui.sliderZIndex(),
		isMessengerOpen: () => ui.isSliderOpened(),
		isSliderFocused: () => ui.isSliderFocused(),
		isThemeDark: () => false,
		openMessenger,
		openHistory: (dialogId: string) => ui.openChat(dialogId),
		openSettings: () => ui.openSettings(),
		openHelpArticle: () => {},
		getMessageCount: () => deps.getMessageCount(),
		getCurrentDialogId: () => deps.getCurrentDialogId(),
		isPromoRequired: (code: string) => ui.isPromoRequired(code),
		repeatSound: (type: string, timeout: number, force: boolean) => ui.playSoundLoop(type, timeout, force),
		stopRepeatSound: (type: string) => ui.stopSound(type),
		showUserSelector: deps.showUserSelector,
		getCurrentUser: () => deps.getCurrentUser(),
		isCallJoinedOnDevice: (callUuid: string): boolean => (deps.getRecentCalls() ?? [])
			.some((item) => item.call?.uuid === callUuid && item.state === RecentCallStatus.joined),
	};
};
