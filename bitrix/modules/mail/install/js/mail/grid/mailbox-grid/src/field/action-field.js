import { BaseField } from './base-field';
import { Loc, Tag, Dom } from 'main.core';
import { Button, AirButtonStyle } from 'ui.buttons';
import { sendData as analyticsSendData } from 'ui.analytics';

type ActionFieldParams = {
	url: string;
	hasError: ?boolean,
	canEdit: ?boolean,
}

export class ActionField extends BaseField
{
	render(params: ActionFieldParams): void
	{
		const actionContainer = Tag.render`
			<div class="mailbox-grid_action-field-container"></div>
		`;

		let button = null;
		let buttonNode = null;
		const state = this.#getState(params.canEdit ?? false);
		if (params.hasError)
		{
			button = new Button({
				size: Button.Size.MEDIUM,
				text: Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_BUTTON_ERROR_ACTION'),
				useAirDesign: true,
				noCaps: true,
				wide: false,
				state,
				onclick: () => {
					if (params.canEdit)
					{
						const source = 'error_button';
						this.#sendAnalytics(source);

						this.#handleClick(params.url);
					}
				},
				className: 'mailbox-grid_action-button',
				dataset: { id: 'mailbox-grid_action-button-error-action' },
			});

			buttonNode = button.render();
			Dom.append(buttonNode, actionContainer);
		}
		else
		{
			button = new Button({
				size: Button.Size.MEDIUM,
				text: Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_BUTTON_TITLE'),
				useAirDesign: true,
				style: AirButtonStyle.OUTLINE_NO_ACCENT,
				noCaps: true,
				wide: false,
				state,
				onclick: () => {
					if (params.canEdit)
					{
						const source = 'edit_button';
						this.#sendAnalytics(source);

						this.#handleClick(params.url);
					}
				},
				className: 'mailbox-grid_action-button',
				dataset: { id: 'mailbox-grid_action-button-default-action' },
			});

			buttonNode = button.render();
			Dom.append(buttonNode, actionContainer);
		}

		this.appendToFieldNode(actionContainer);
		if (!params.canEdit)
		{
			Dom.attr(buttonNode, {
				'data-hint': Loc.getMessage('MAIL_MAILBOX_LIST_ACTION_BUTTON_ACCESS_LOCK'),
				'data-hint-no-icon': 'true',
			});
			BX.UI.Hint.init(this.getFieldNode());
		}
	}

	#sendAnalytics(source: string): void
	{
		analyticsSendData({
			tool: 'mail',
			event: 'mailbox_grid_edit',
			category: 'mail_mass_ops',
			c_element: source,
		});
	}

	#handleClick(url: string): void
	{
		BX.SidePanel.Instance.open(url);
	}

	#getState(canEdit: boolean): ?string
	{
		return canEdit ? null : Button.State.DISABLED;
	}
}
