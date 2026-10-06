import { ActivityProvider } from 'crm.ai.call';
import { Router } from 'crm.router';
import { confirm } from 'crm.timeline.dialog';
import { DatetimeConverter } from 'crm.timeline.tools';
import { ajax as Ajax, Event, Loc, Runtime, Tag, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { ButtonState } from 'ui.buttons';
import { Outline } from 'ui.icon-set.api.vue';
import { UI } from 'ui.notification';
import { Menu } from 'ui.system.menu';
import 'crm_common';

import ChatMessage from '../components/content-blocks/chat-message';
import ConfigurableItem from '../configurable-item';

import type { CopilotConfig } from './ai/copilot-base';
import { CopilotBase } from './ai/copilot-base';
import { type ActionParams } from './base';

export class OpenLines extends CopilotBase
{
	#copilotSummaryMenu: Menu = null;

	// region Base overridden methods
	onInitialize(item: ConfigurableItem): void
	{
		if (item)
		{
			this.#showCopilotWelcomeTour(item);
		}
	}

	getContentBlockComponents(Item: ConfigurableItem): Object
	{
		return {
			ChatMessage,
		};
	}

	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData, animationCallbacks } = actionParams;
		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'Openline:OpenChat' && actionData && actionData.dialogId)
		{
			this.#openChat(actionData.dialogId);
		}

		if (action === 'Openline:Complete' && actionData && actionData.activityId)
		{
			this.#onComplete(item, actionData, animationCallbacks);
		}

		if (action === 'Openline:ShowCopilotSummary' && actionData)
		{
			void this.#showCopilotSummary(item, actionData);
		}

		if (action === 'Openline:ShowCopilotSummaryDrawer' && actionData)
		{
			void this.#showCopilotSummaryDrawer(actionData);
		}

		if (action === 'Openline:LaunchCopilot' && actionData)
		{
			void this.handleCopilotLaunch(item, actionData);
		}
	}
	// endregion

	// region CopilotBase overridden methods
	getCopilotConfig(): CopilotConfig
	{
		return {
			actionEndpoint: 'crm.timeline.ai.launchCopilot',
			agreementContext: 'audio', // @todo!
		};
	}
	// endregion

	// region jsEvent action handlers
	#openChat(dialogId): void
	{
		Runtime.loadExtension('im.public.iframe').then((exports: Object) => {
			exports.Messenger.openLines(dialogId);
		}).catch((exception) => {
			console.error('Error loading "im.public.iframe":', exception);
		});
	}

	#onComplete(item: ConfigurableItem, actionData: Object, animationCallbacks: ?Object): void
	{
		const uncheckChangeStreamCheckbox = () => {
			const changeStreamButton = item.getLayoutHeaderChangeStreamButton();
			if (changeStreamButton)
			{
				changeStreamButton.markCheckboxUnchecked();
			}
		};

		// eslint-disable-next-line promise/catch-or-return, @bitrix24/bitrix24-rules/no-native-dialogs
		confirm({
			title: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_COMPLETE_CONF_TITLE'),
			content: Tag.render`<div>${Text.encode(Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_COMPLETE_CONF'))}</div>`,
			preset: 'OK_CANCEL',
			confirmText: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_COMPLETE_CONF_OK_TEXT'),
			onConfirm: () => {
				return this.#runCompleteAction(
					actionData.activityId,
					actionData.ownerTypeId,
					actionData.ownerId,
					animationCallbacks,
				);
			},
			onDismiss: uncheckChangeStreamCheckbox,
		}).then((result) => {
			if (result === 'cancel')
			{
				uncheckChangeStreamCheckbox();
			}
		});
	}

	#showCopilotSummary(item: ConfigurableItem, actionData: Object): void
	{
		const activityId = actionData.activityId;
		const items = actionData.summarizeTranscriptionList;
		if (activityId <= 0 || !items)
		{
			return;
		}

		if (Object.keys(items).length === 1)
		{
			void this.openCopilotSummaryPopup(actionData, ActivityProvider.openLine, Object.keys(items)[0]);

			return;
		}

		if (this.#copilotSummaryMenu === null)
		{
			const barTarget = item.getLayoutContentBlockById('aiActionBar').getContainer();
			const elementTarget = barTarget?.querySelector('.ui-icon-set.--o-copilot');
			const menuTarget = elementTarget || barTarget;
			const menuItems = Object.entries(items).reverse().map(([jobId, timestamp]) => {
				const converter = DatetimeConverter.createFromServerTimestamp(timestamp).toUserTime();

				return {
					title: Loc.getMessage(
						'CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_SUMMARIZE_TRANSCRIPTION_MENU',
						{ '#DATE#': converter.toDatetimeString({ delimiter: ', ' }) },
					),
					design: 'copilot',
					icon: Outline.TEXT,
					onClick: (): void => {
						this.#copilotSummaryMenu.close();

						this.openCopilotSummaryPopup(actionData, ActivityProvider.openLine, jobId);
					},
				};
			});

			this.#copilotSummaryMenu = new Menu({
				id: `crm-timeline-activity-openline-copilot-summary-${activityId}-${Text.getRandom()}`,
				animation: 'fading-slide',
				bindElement: menuTarget,
				autoHide: true,
				closeByEsc: false,
				offsetTop: 5,
				items: menuItems,
			});
		}

		this.#copilotSummaryMenu.show();
	}

	#showCopilotSummaryDrawer(actionData: Object): void
	{
		void Router.Instance.openAiReportDrawer('summary-history', {
			activityId: actionData.activityId,
			ownerTypeId: actionData.ownerTypeId,
			ownerId: actionData.ownerId,
			jobId: null,
			assessmentSettingsId: null,
		});
	}

	#runCompleteAction(activityId: Number, ownerTypeId: Number, ownerId: Number, animationCallbacks: ?Object): Promise
	{
		if (animationCallbacks.onStart)
		{
			animationCallbacks.onStart();
		}

		return Ajax.runAction(
			'crm.timeline.activity.complete',
			{
				data: {
					activityId,
					ownerTypeId,
					ownerId,
				},
			},
		).then(() => {
			if (animationCallbacks.onStop)
			{
				animationCallbacks.onStop();
			}

			return true;
		},
		(response) => {
			UI.Notification.Center.notify({
				content: response.errors[0].message,
				autoHideDelay: 5000,
			});

			if (animationCallbacks.onStop)
			{
				animationCallbacks.onStop();
			}

			return true;
		});
	}

	#showCopilotWelcomeTour(item: ConfigurableItem): void
	{
		setTimeout(() => {
			const aiCopilotBtn = this.getFooterCopilotButton(item);
			const aiCopilotUIBtn = aiCopilotBtn?.getUiButton();
			if (!aiCopilotUIBtn || aiCopilotUIBtn.getState() === ButtonState.DISABLED)
			{
				return;
			}

			if (aiCopilotBtn?.isInViewport())
			{
				EventEmitter.emit(
					this,
					'BX.Crm.Timeline.Openline:onShowCopilotTour',
					{
						target: aiCopilotUIBtn.getContainer(),
						stepId: 'copilot-in-open-line',
						delay: 1500,
					},
				);

				return;
			}

			const showCopilotTourOnScroll = () => {
				if (aiCopilotBtn?.isInViewport())
				{
					EventEmitter.emit(
						this,
						'BX.Crm.Timeline.Openline:onShowCopilotTour',
						{
							target: aiCopilotUIBtn.getContainer(),
							stepId: 'copilot-in-open-line',
							delay: 1000,
						},
					);

					Event.unbind(window, 'scroll', showCopilotTourOnScroll);
				}
			};

			Event.bind(window, 'scroll', showCopilotTourOnScroll);
		}, 50);
	}
	// endregion

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return item.getType() === 'Activity:OpenLine';
	}
}
