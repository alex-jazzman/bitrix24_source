import { ActivityProvider } from 'crm.ai.call';
import { DatetimeConverter } from 'crm.timeline.tools';
import { ajax as Ajax, Event, Loc, Text } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu, MenuManager } from 'main.popup';
import { Button as ButtonUI, ButtonState } from 'ui.buttons';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';

import ChatMessage from '../components/content-blocks/chat-message';
import { Button } from '../components/layout/button';
import ConfigurableItem from '../configurable-item';

import type { CopilotConfig } from './ai/copilot-base';
import { CopilotBase } from './ai/copilot-base';
import { ActionParams } from './base';

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
			validEntityTypes: [BX.CrmEntityType.enumeration.lead, BX.CrmEntityType.enumeration.deal],
			agreementContext: 'audio', // @todo!
		};
	}

	getAdditionalRequestData(actionData: Object): Object
	{
		return {
			scenario: 'fill_fields',
		};
	}
	// endregion

	// region jsEvent action handlers
	#openChat(dialogId): void
	{
		window.top.BXIM?.openMessengerSlider(dialogId, { RECENT: 'N', MENU: 'N' });
	}

	#onComplete(item: ConfigurableItem, actionData: Object, animationCallbacks: ?Object): void
	{
		MessageBox.show({
			title: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_COMPLETE_CONF_TITLE'),
			message: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_COMPLETE_CONF'),
			modal: true,
			okCaption: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_COMPLETE_CONF_OK_TEXT'),
			buttons: MessageBoxButtons.OK_CANCEL,
			onOk: () => {
				return this.#runCompleteAction(actionData.activityId, actionData.ownerTypeId, actionData.ownerId, animationCallbacks);
			},
			onCancel: (messageBox) => {
				const changeStreamButton = item.getLayoutHeaderChangeStreamButton();
				if (changeStreamButton)
				{
					changeStreamButton.markCheckboxUnchecked();
				}

				messageBox.close();
			},
		});
	}

	#showCopilotSummary(item: ConfigurableItem, actionData: Object, animationCallbacks: ?Object): void
	{
		const activityId = actionData.activityId;
		const items = actionData.summarizeTranscriptionList;
		if (activityId <= 0 || !items)
		{
			return;
		}

		if (Object.keys(items).length === 1)
		{
			const jobId = Object.keys(items)[0];

			void this.#openCopilotSummaryPopup(jobId, actionData);

			return;
		}

		if (this.#copilotSummaryMenu === null)
		{
			const dataId = `[data-id="copilotSummaryBlockLink_${item.getId()}"]`;
			const menuTarget = item.getContainer().querySelector(dataId);
			const menuItems = Object.entries(items).reverse().map(([jobId, timestamp]) => {
				const converter = DatetimeConverter.createFromServerTimestamp(timestamp).toUserTime();

				return {
					text: Loc.getMessage(
						'CRM_TIMELINE_ITEM_ACTIVITY_OPENLINE_SUMMARIZE_TRANSCRIPTION_MENU',
						{ '#DATE#': converter.toDatetimeString({ delimiter: ', ' }) },
					),
					onclick: () => void this.#openCopilotSummaryPopup(jobId, actionData),
				};
			});

			this.#copilotSummaryMenu = MenuManager.create({
				id: `crm-timeline-activity-openline-copilot-summary-${activityId}-${Text.getRandom()}`,
				bindElement: menuTarget,
				animation: 'fading-slide',
				autoHide: true,
				offsetTop: 10,
				closeByEsc: false,
				items: menuItems,
			});
		}

		this.#copilotSummaryMenu.show();
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
			const aiCopilotBtn: Button = item.getLayoutFooterButtonById('aiButton');
			const aiCopilotUIBtn: ButtonUI = aiCopilotBtn?.getUiButton();
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

	async #openCopilotSummaryPopup(jobId: number, actionData: Object): void
	{
		await top.BX.Runtime.loadExtension('crm.ai.call');

		if (this.#copilotSummaryMenu)
		{
			this.#copilotSummaryMenu.close();
		}

		const summary = new top.BX.Crm.AI.Call.Summary({
			activityId: actionData.activityId,
			ownerTypeId: actionData.ownerTypeId,
			ownerId: actionData.ownerId,
			languageTitle: actionData.languageTitle,
			activityProvider: ActivityProvider.openLine,
			jobId,
		});

		summary.open();
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return item.getType() === 'Activity:OpenLine';
	}
}
