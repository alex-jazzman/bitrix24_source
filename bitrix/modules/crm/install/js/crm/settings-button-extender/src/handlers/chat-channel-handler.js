import { Loc } from 'main.core';
import { MenuItemOptions } from 'main.popup';

import { CHECKED_CLASS, NOT_CHECKED_CLASS } from '../constants';

import { BaseChannelHandler } from './base-channel-handler.js';

type ChatAction = 'firstChat' | 'allChats' | 'manual';

export class ChatChannelHandler extends BaseChannelHandler
{
	getMenuItems(showInfoHelper: ?Function = null): MenuItemOptions[]
	{
		return [
			{
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_OPEN_LINES_PROCESSING_FIRST_CHAT'),
				className: this.isActionActive('firstChat') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('firstChat'),
			},
			{
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_OPEN_LINES_PROCESSING_ALL'),
				className: this.isActionActive('allChats') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('allChats'),
			},
			{
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_MANUAL_CALLS_PROCESSING_MSGVER_1'),
				className: this.isActionActive('manual') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('manual'),
			},
		];
	}

	handleAction(action: ChatAction): void
	{
		const operationTypes = this.getAllOperationTypes();

		switch (action)
		{
			case 'firstChat':
				this.settings.autostartOperationTypes = operationTypes;
				this.settings.autostartOnlyFirstChat = true;
				break;
			case 'allChats':
				this.settings.autostartOperationTypes = operationTypes;
				this.settings.autostartOnlyFirstChat = false;
				break;
			case 'manual':
				this.settings.autostartOperationTypes = [];
				this.settings.autostartOnlyFirstChat = false;
				break;
			default:
		}
	}

	isActionActive(action: ChatAction): boolean
	{
		const hasPackages = this.hasAIPackages();
		const isOnlyFirst = this.settings.autostartOnlyFirstChat;
		const hasOperations = (this.settings.autostartOperationTypes || []).length > 0;

		switch (action)
		{
			case 'firstChat':
				return hasPackages && hasOperations && isOnlyFirst;
			case 'allChats':
				return hasPackages && hasOperations && !isOnlyFirst;
			case 'manual':
				return !hasOperations || !hasPackages;
			default:
				return false;
		}
	}
}
