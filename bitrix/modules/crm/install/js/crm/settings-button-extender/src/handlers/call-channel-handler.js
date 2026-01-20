import { Loc } from 'main.core';
import { MenuItemOptions } from 'main.popup';

import { CALL_DIRECTION_INCOMING, CALL_DIRECTION_OUTGOING, CHECKED_CLASS, NOT_CHECKED_CLASS } from '../constants';

import { BaseChannelHandler } from './base-channel-handler.js';

type CallAction = 'firstCall' | 'allCalls' | 'outgoingCalls' | 'allIncomingOutgoingCalls' | 'manual';

export class CallChannelHandler extends BaseChannelHandler
{
	getMenuItems(showInfoHelper: ?Function = null): MenuItemOptions[]
	{
		return [
			{
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_FIRST_INCOMING_MSGVER_1'),
				className: this.isActionActive('firstCall') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('firstCall'),
			},
			{
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_INCOMING'),
				className: this.isActionActive('allCalls') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('allCalls'),
			},
			{
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_OUTGOING'),
				className: this.isActionActive('outgoingCalls') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('outgoingCalls'),
			},
			{
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_AUTO_CALLS_PROCESSING_ALL_MSGVER_1'),
				className: this.isActionActive('allIncomingOutgoingCalls') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('allIncomingOutgoingCalls'),
			},
			{
				text: Loc.getMessage('CRM_SETTINGS_BUTTON_EXTENDER_COPILOT_MANUAL_CALLS_PROCESSING_MSGVER_1'),
				className: this.isActionActive('manual') ? CHECKED_CLASS : NOT_CHECKED_CLASS,
				onclick: showInfoHelper ?? this.createActionHandler('manual'),
			},
		];
	}

	handleAction(action: CallAction): void
	{
		const operationTypes = this.getAllOperationTypes();

		switch (action)
		{
			case 'manual':
				this.settings.autostartOperationTypes = this.getAllOperationTypes().filter(
					(typeId) => typeId !== this.getTranscribeOperationType(),
				);
				break;
			case 'firstCall':
				this.settings.autostartOperationTypes = operationTypes;
				this.settings.autostartTranscriptionOnlyOnFirstCallWithRecording = true;
				this.settings.autostartCallDirections = [CALL_DIRECTION_INCOMING];
				break;
			case 'allCalls':
				this.settings.autostartOperationTypes = operationTypes;
				this.settings.autostartTranscriptionOnlyOnFirstCallWithRecording = false;
				this.settings.autostartCallDirections = [CALL_DIRECTION_INCOMING];
				break;
			case 'outgoingCalls':
				this.settings.autostartOperationTypes = operationTypes;
				this.settings.autostartTranscriptionOnlyOnFirstCallWithRecording = false;
				this.settings.autostartCallDirections = [CALL_DIRECTION_OUTGOING];
				break;
			case 'allIncomingOutgoingCalls':
				this.settings.autostartOperationTypes = operationTypes;
				this.settings.autostartTranscriptionOnlyOnFirstCallWithRecording = false;
				this.settings.autostartCallDirections = [
					CALL_DIRECTION_INCOMING,
					CALL_DIRECTION_OUTGOING,
				];
				break;
			default:
		}
	}

	isActionActive(action: CallAction): boolean
	{
		const isTranscriptionEnabled = this.settings
			.autostartOperationTypes
			.includes(this.getTranscribeOperationType())
		;
		const hasPackages = this.hasAIPackages();
		const isOnlyFirst = this.settings.autostartTranscriptionOnlyOnFirstCallWithRecording;
		const directions = this.settings.autostartCallDirections || [];

		const isOnlyIncoming = directions.length === 1 && directions.includes(CALL_DIRECTION_INCOMING);
		const isOnlyOutgoing = directions.length === 1 && directions.includes(CALL_DIRECTION_OUTGOING);
		const isBothDirections = directions.includes(CALL_DIRECTION_INCOMING)
			&& directions.includes(CALL_DIRECTION_OUTGOING)
		;

		switch (action)
		{
			case 'manual':
				return !isTranscriptionEnabled || !hasPackages;
			case 'firstCall':
				return isTranscriptionEnabled && hasPackages && isOnlyFirst && isOnlyIncoming;
			case 'allCalls':
				return isTranscriptionEnabled && hasPackages && isOnlyIncoming && !isOnlyFirst;
			case 'outgoingCalls':
				return isTranscriptionEnabled && hasPackages && isOnlyOutgoing && !isOnlyFirst;
			case 'allIncomingOutgoingCalls':
				return isTranscriptionEnabled && hasPackages && isBothDirections && !isOnlyFirst;
			default:
				return false;
		}
	}
}
