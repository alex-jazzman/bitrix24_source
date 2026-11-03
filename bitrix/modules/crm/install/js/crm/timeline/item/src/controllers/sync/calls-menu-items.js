import { Loc, Type } from 'main.core';
import { MenuItemDesign, type MenuItemOptions } from 'ui.system.menu';

import { DatetimeConverter } from 'crm.timeline.tools';

export type SyncCall = {
	callId: number,
	startDate: number | null,
	hasFollowUp: boolean,
	detailUrl: string | null,
};

export type SyncCallsResponse = {
	items: SyncCall[],
	hasOlderCalls: boolean,
	canOpenChat: boolean,
};

export type SyncCallsMenuHandlers = {
	openCall: (detailUrl: string) => void,
	openChat: () => void,
};

export function buildCallsMenuItems(data: SyncCallsResponse, handlers: SyncCallsMenuHandlers): MenuItemOptions[]
{
	const items: MenuItemOptions[] = Type.isArrayFilled(data.items)
		? data.items.map((call: SyncCall) => buildCallItem(call, handlers))
		: [buildDisabledItem(Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SYNC_CALLS_MENU_EMPTY'))];

	if (data.hasOlderCalls && data.canOpenChat)
	{
		items.push({
			title: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SYNC_CALLS_MENU_OLDER_IN_CHAT'),
			onClick: (): void => handlers.openChat(),
		});
	}

	return items;
}

function buildCallItem(call: SyncCall, handlers: SyncCallsMenuHandlers): MenuItemOptions
{
	const title = formatCallTitle(call.startDate);

	if (call.hasFollowUp && Type.isStringFilled(call.detailUrl))
	{
		return {
			title,
			onClick: (): void => handlers.openCall(call.detailUrl),
		};
	}

	return {
		...buildDisabledItem(title),
		subtitle: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SYNC_CALLS_MENU_NO_FOLLOWUP'),
	};
}

function buildDisabledItem(title: string): MenuItemOptions
{
	return {
		title,
		design: MenuItemDesign.Disabled,
		disabled: true,
	};
}

function formatCallTitle(startDate: number | null): string
{
	if (Type.isNil(startDate))
	{
		return Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SYNC_CALLS_MENU_CALL_NO_DATE');
	}

	const date = DatetimeConverter.createFromServerTimestamp(startDate)
		.toUserTime()
		.toDatetimeString({ delimiter: ', ' })
	;

	return Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_SYNC_CALLS_MENU_CALL', { '#DATE#': date });
}
