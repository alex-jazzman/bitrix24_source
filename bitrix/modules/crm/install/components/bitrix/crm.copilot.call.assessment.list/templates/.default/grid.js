import { ajax as Ajax, Loc, Reflection, Text } from 'main.core';
import { type BaseEvent, EventEmitter } from 'main.core.events';
import { MessageBox, MessageBoxButtons } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';

const namespace = Reflection.namespace('BX.Crm.Copilot.CallAssessmentList');

export class Grid {
	#grid = null;
	#reloadGridTimeoutId: number = null;
	static #SETTINGS_MENU_ID = 'crm-copilot-call-assessment-list-settings-menu';

	constructor(gridId: string)
	{
		this.#grid = BX.Main.gridManager.getInstanceById(gridId);
	}

	init(): void
	{
		this.#bindEvents();
	}

	#bindEvents(): void
	{
		EventEmitter.subscribe('BX.Crm.Copilot.CallAssessment:onClickDelete', this.#handleItemDelete.bind(this));
		EventEmitter.subscribe('BX.Main.Popup:onShow', this.#handleSettingsMenuShow.bind(this));

		BX.addCustomEvent('SidePanel.Slider:onCloseComplete', this.#handleSliderClose.bind(this));
	}

	#handleSettingsMenuShow(event: BaseEvent): void
	{
		const popup = event.getTarget();
		if (popup?.getId?.() !== Grid.#SETTINGS_MENU_ID)
		{
			return;
		}

		Promise.resolve().then(() => {
			const popupContainer = popup.popupContainer;
			const button = popup.bindElement;
			const angle = popupContainer?.querySelector?.('.popup-window-angly');
			if (!popupContainer || !button || !angle)
			{
				return;
			}

			const btnRect = button.getBoundingClientRect();
			const popupRect = popupContainer.getBoundingClientRect();
			const angleWidth = angle.getBoundingClientRect().width || 16;
			const btnCenterX = btnRect.left + btnRect.width / 2;
			const desiredLeft = Math.max(8, btnCenterX - popupRect.left - angleWidth / 2);

			angle.style.left = `${desiredLeft}px`;
		});
	}

	#handleSliderClose(sliderEvent): void
	{
		const url = sliderEvent?.slider?.getUrl?.();
		if (typeof url !== 'string' || !url.includes('/crm/copilot-call-assessment/details/'))
		{
			return;
		}

		this.#reloadGridAfterTimeout();
	}

	#handleItemDelete(event: BaseEvent): void
	{
		const id = Text.toInteger(event.data.id);

		if (!id)
		{
			this.#showError(Loc.getMessage('CRM_COPILOT_CALL_ASSESSMENT_LIST_NOT_FOUND_MSGVER_1'));

			return;
		}

		MessageBox.show({
			title: Loc.getMessage('CRM_TYPE_ITEM_DELETE_CONFIRMATION_TITLE'),
			message: Loc.getMessage('CRM_TYPE_ITEM_DELETE_CONFIRMATION_MESSAGE'),
			modal: true,
			buttons: MessageBoxButtons.YES_CANCEL,
			onYes: (messageBox) => {
				Ajax.runAction(
					'crm.controller.copilot.callassessment.delete', {
						data: { id },
					}).then((response) => {
						UI.Notification.Center.notify({
							content: Loc.getMessage('CRM_TYPE_ITEM_DELETE_NOTIFICATION')
						});

						this.#reloadGridAfterTimeout();
					}).catch(({ errors }) => {
						this.#showError(errors[0]?.message ?? Loc.getMessage('CRM_COPILOT_CALL_ASSESSMENT_LIST_ITEM_DELETE_ERROR'));
					})
				;

				messageBox.close();
			}
		});
	}

	#showError(message: string): void
	{
		UI.Notification.Center.notify({
			content: Text.encode(message),
			autoHideDelay: 6000,
		});
	}

	#reloadGridAfterTimeout(): void
	{
		if (!this.#grid)
		{
			return;
		}

		if (this.#reloadGridTimeoutId > 0)
		{
			clearTimeout(this.#reloadGridTimeoutId);
			this.#reloadGridTimeoutId = 0;
		}

		this.#reloadGridTimeoutId = setTimeout(() => {
			this.#grid.reload();
		}, 1000);
	}
}

namespace.Grid = Grid;