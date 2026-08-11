import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { ActionByRole, ActionByUserType, ChatType } from 'im.v2.const';
import { PermissionManager } from 'im.v2.lib.permission';
import { FeatureManager, Feature } from 'im.v2.lib.feature';
import { type ImModelChat } from 'im.v2.model';

export class GuestManager
{
	static #instance: GuestManager | undefined;
	#shouldShowGuestNamePopup: boolean = false;
	#termsOfServiceUrl: string = '';

	static getInstance(): GuestManager
	{
		if (!this.#instance)
		{
			this.#instance = new this();
		}

		return this.#instance;
	}

	setGuestNamePopupState(value: boolean)
	{
		if (!Type.isBoolean(value))
		{
			return;
		}

		this.#shouldShowGuestNamePopup = value;
	}

	getGuestNamePopupState(): boolean
	{
		return this.#shouldShowGuestNamePopup;
	}

	isGuestLinkAvailable(dialogId: string): boolean
	{
		if (!FeatureManager.isFeatureAvailable(Feature.isChatWithGuestsAvailable))
		{
			return false;
		}

		const { parentChatId, type }: ImModelChat = Core.getStore().getters['chats/get'](dialogId, true);
		if (parentChatId > 0)
		{
			return false;
		}

		if (![ChatType.chat, ChatType.open, ChatType.calendar].includes(type))
		{
			return false;
		}

		const permissionManager = PermissionManager.getInstance();
		const canPerformActionByRole = permissionManager.canPerformActionByRole(ActionByRole.manageGuestLink, dialogId);
		const canPerformActionByUserType = permissionManager.canPerformActionByUserType(ActionByUserType.manageGuestLink);

		return canPerformActionByRole && canPerformActionByUserType;
	}

	setTermsOfServiceUrl(value: string)
	{
		if (!Type.isStringFilled(value))
		{
			return;
		}

		this.#termsOfServiceUrl = value;
	}

	getTermsOfServiceUrl(): string
	{
		return this.#termsOfServiceUrl;
	}
}
