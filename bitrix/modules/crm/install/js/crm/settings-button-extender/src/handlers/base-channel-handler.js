import { Text } from 'main.core';
import { MenuItem, MenuItemOptions } from 'main.popup';

export type ChannelParams = {
	autostartOperationTypes: number[],
	autostartTranscriptionOnlyOnFirstCallWithRecording?: boolean,
	autostartCallDirections?: string[],
	autostartOnlyFirstChat?: boolean,
};

/**
 * @abstract
 */
export class BaseChannelHandler
{
	settings: ChannelParams = null;
	extensionSettings: Object = null;
	onActionClick: ?Function = null;

	constructor(settings: ChannelParams, extensionSettings: Object)
	{
		this.settings = settings;
		this.extensionSettings = extensionSettings;
	}

	getMenuItems(showInfoHelper: ?Function = null): MenuItemOptions[]
	{
		throw new Error('Method getMenuItems must be implemented');
	}

	handleAction(action: string): void
	{
		throw new Error('Method handleAction must be implemented');
	}

	isActionActive(action: string): boolean
	{
		throw new Error('Method isActionActive must be implemented');
	}

	getAllOperationTypes(): number[]
	{
		return this.extensionSettings.get('allAIOperationTypes').map((id) => Text.toInteger(id));
	}

	getTranscribeOperationType(): number
	{
		return Text.toInteger(this.extensionSettings.get('transcribeAIOperationType'));
	}

	hasAIPackages(): boolean
	{
		return this.extensionSettings.get('isAIHasPackages');
	}

	createActionHandler(action: string): Function
	{
		return (event: PointerEvent, menuItem: MenuItem) => {
			if (this.onActionClick)
			{
				this.onActionClick(event, menuItem, action);
			}

			this.handleAction(action);
		};
	}

	setActionClickHandler(callback: Function): void
	{
		this.onActionClick = callback;
	}
}
