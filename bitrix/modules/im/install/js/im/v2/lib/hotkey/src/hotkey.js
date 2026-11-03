import { Core } from 'im.v2.application.core';
import { HotkeyCombination, Settings } from 'im.v2.const';
import { Utils } from 'im.v2.lib.utils';

export const isSendMessageCombination = (event: KeyboardEvent): boolean => {
	return Utils.key.isExactCombination(event, getSendMessageCombination());
};

export const isNewLineCombination = (event: KeyboardEvent): boolean => {
	if (!isSendByEnter())
	{
		return false;
	}

	return Utils.key.isExactCombination(event, HotkeyCombination.newLine.byCtrlEnter);
};

export const isTextDecorationCombination = (event: KeyboardEvent): boolean => {
	return Utils.key.isExactCombination(event, Object.values(HotkeyCombination.textDecoration));
};

const getSendMessageCombination = (): string[] => {
	if (isSendByEnter())
	{
		return HotkeyCombination.sendMessage.byEnter;
	}

	return HotkeyCombination.sendMessage.byCtrlEnter;
};

const isSendByEnter = (): boolean => {
	return Core.getStore().getters['application/settings/get'](Settings.hotkey.sendByEnter);
};
