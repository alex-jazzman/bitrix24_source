import { ajax as Ajax, Runtime, Text, Type } from 'main.core';
import { UI } from 'ui.notification';
import { Menu } from 'ui.system.menu';

import { Router } from 'crm.router';

import type ConfigurableItem from '../../configurable-item';
import { Base } from '../base';
import { buildCallsMenuItems, type SyncCallsResponse } from './calls-menu-items';

type SyncActionParams = {
	action: string,
	actionType: string,
	actionData?: Object | null,
};

export class Sync extends Base
{
	#menu: Menu | null = null;
	#isLoading: boolean = false;
	#layoutGeneration: number = 0;

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return item.getType() === 'Activity:Sync';
	}

	onItemAction(item: ConfigurableItem, actionParams: SyncActionParams): void
	{
		const { action, actionType, actionData } = actionParams;
		if (actionType !== 'jsEvent' || !Type.isPlainObject(actionData))
		{
			return;
		}

		if (action === 'Activity:Sync:OpenChat')
		{
			this.#openChat(actionData.dialogId);
		}
		else if (action === 'Activity:Sync:ShowCalls')
		{
			this.#showCalls(item, Text.toInteger(actionData.activityId), actionData.dialogId);
		}
	}

	onBeforeItemClearLayout(item: ConfigurableItem): void
	{
		super.onBeforeItemClearLayout(item);

		this.#menu?.destroy();
		this.#menu = null;
		this.#isLoading = false;
		this.#layoutGeneration++;
	}

	#openChat(dialogId: string): void
	{
		if (!Type.isStringFilled(dialogId))
		{
			return;
		}

		Runtime.loadExtension('im.public.iframe').then((exports: Object) => {
			exports.Messenger.openChat(dialogId);
		}).catch((exception) => {
			console.error('Error loading "im.public.iframe":', exception);
		});
	}

	#showCalls(item: ConfigurableItem, activityId: number, dialogId: string): void
	{
		if (activityId <= 0 || this.#isLoading)
		{
			return;
		}

		this.#isLoading = true;
		const layoutGeneration = this.#layoutGeneration;

		// eslint-disable-next-line promise/catch-or-return
		Ajax.runAction('crm.activity.sync.listCalls', { data: { activityId } }).then(
			(response: { data: SyncCallsResponse }) => {
				if (layoutGeneration !== this.#layoutGeneration)
				{
					return;
				}

				this.#isLoading = false;
				this.#openCallsMenu(item, activityId, dialogId, response.data);
			},
			(response: { errors: Array<{ message: string }> }) => {
				if (layoutGeneration !== this.#layoutGeneration)
				{
					return;
				}

				this.#isLoading = false;
				UI.Notification.Center.notify({
					content: Text.encode(response?.errors?.[0]?.message ?? ''),
					autoHideDelay: 5000,
				});
			},
		);
	}

	#openCallsMenu(item: ConfigurableItem, activityId: number, dialogId: string, data: SyncCallsResponse): void
	{
		const container = item.getLayoutContentBlockById('syncGroupOfBlocks')
			?.getBlockById('callsActionBar')?.getContainer()
		;
		const bindElement = container?.querySelector('.crm-timeline__action-bar-item .ui-chip');
		if (!bindElement)
		{
			return;
		}

		this.#menu?.destroy();
		this.#menu = new Menu({
			id: `crm-timeline-activity-sync-calls-${activityId}-${Text.getRandom()}`,
			bindElement,
			autoHide: true,
			items: buildCallsMenuItems(data, {
				openCall: (detailUrl: string): void => {
					void Router.openSlider(detailUrl);
					this.#menu?.close();
				},
				openChat: (): void => this.#openChat(dialogId),
			}),
		});
		this.#menu.show();
	}
}
