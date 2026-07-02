import { ajax as Ajax, Dom, Loc, Reflection, Runtime, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonSize, CancelButton } from 'ui.buttons';
import { UI } from 'ui.notification';

import ConfigurableItem from '../configurable-item';
import { type ActionParams, Base } from './base';

const CONFIRM_DLG_WIDTH = 515;
const COPILOT_HELPDESK_CODE = 26_164_810;

export class EntityExclusion extends Base
{
	onItemAction(item: ConfigurableItem, actionParams: ActionParams): void
	{
		const { action, actionType, actionData } = actionParams;

		if (actionType !== 'jsEvent')
		{
			return;
		}

		if (action === 'Activity:EntityExclusion:Exclude' && Type.isObject(actionData))
		{
			this.#exclude(actionData);
		}
	}

	#exclude(actionData: { activityId: number, ownerTypeId: number, ownerId: number }): void
	{
		if (
			Type.isNumber(actionData.activityId)
			&& Type.isNumber(actionData.ownerTypeId)
			&& Type.isNumber(actionData.ownerId)
		)
		{
			Runtime.loadExtension('ui.system.dialog').then((exports) => {
				const { Dialog } = exports;

				const helpdesklink = Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_ENTITY_EXCLUSION_CONFIRM_DLG_HELP', {
					'[helpdesklink]': `<a href="##" onclick="top.BX.Helper.show('redirect=detail&code=${COPILOT_HELPDESK_CODE}');">`,
					'[/helpdesklink]': '</a>',
				});
				const content = Dom.create('div', {
					attrs: { className: 'crm-timeline__entity-exclusion-confirm-dlg-content' },
					html: helpdesklink,
				});
				const popupTitle = actionData.ownerTypeId === BX.CrmEntityType.enumeration.deal
					? Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_ENTITY_EXCLUSION_CONFIRM_DLG_TITLE_DEAL')
					: Loc.getMessage('CRM_TIMELINE_ITEM_ACTIVITY_ENTITY_EXCLUSION_CONFIRM_DLG_TITLE_LEAD')
				;

				this.confirmPopup = new Dialog({
					title: popupTitle,
					hasOverlay: true,
					disableScrolling: false,
					content,
					width: CONFIRM_DLG_WIDTH,
					centerButtons: [
						this.#createContinueButton(actionData),
						new CancelButton({
							text: Loc.getMessage('CRM_COMMON_ACTION_CANCEL'),
							size: ButtonSize.LARGE,
							style: AirButtonStyle.OUTLINE,
							useAirDesign: true,
							onclick: () => this.confirmPopup.hide(),
						}),
					],
				});

				this.confirmPopup.show();
			}).catch((exception) => {
				console.error('Error loading "ui.system.dialog":', exception);
			});
		}
		else
		{
			console.error('Invalid "actionData" parameters');
		}
	}

	#createContinueButton(actionData: { activityId: number, ownerTypeId: number, ownerId: number }): Button
	{
		return new Button({
			text: Loc.getMessage('CRM_COMMON_CONTINUE'),
			size: ButtonSize.LARGE,
			style: AirButtonStyle.FILLED,
			useAirDesign: true,
			onclick: (button) => {
				button.setWaiting();

				Ajax.runAction('crm.timeline.activity.excludeEntity', {
					data: {
						activityId: actionData.activityId,
						ownerTypeId: actionData.ownerTypeId,
						ownerId: actionData.ownerId,
					},
				}).then(() => {
					setTimeout(() => {
						const currentSlider = top.BX.SidePanel.Instance.getSliderByWindow(window);
						if (currentSlider && Reflection.getClass('BX.Crm.EntityEvent'))
						{
							BX.Crm.EntityEvent.fireUpdate(actionData.ownerTypeId, actionData.ownerId, '', {
								sliderUrl: currentSlider.getUrl(),
							});

							currentSlider.close();
						}
					}, 10);
				}, (response) => {
					if (response.errors && response.errors.length > 0)
					{
						UI.Notification.Center.notify({
							content: response?.errors[0]?.message ?? Loc.getMessage('CRM_COMMON_ERROR'),
							autoHideDelay: 5000,
						});
					}
					button.setWaiting(false);

					this.confirmPopup.hide();
				}).catch((exception) => {
					console.error('Unexpected error in "crm.timeline.activity.excludeEntity" flow:', exception);
				});
			},
		});
	}

	static isItemSupported(item: ConfigurableItem): boolean
	{
		return (item.getType() === 'Activity:EntityExclusion');
	}
}
