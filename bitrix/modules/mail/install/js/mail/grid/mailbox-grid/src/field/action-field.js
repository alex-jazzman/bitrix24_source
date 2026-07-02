import { BaseField } from './base-field';
import { Loc, Tag, Dom } from 'main.core';
import { Button, AirButtonStyle } from 'ui.buttons';
import { sendData as analyticsSendData } from 'ui.analytics';
import { GridManager } from '../grid-manager';

type ActionFieldParams = {
	url: string;
	hasError: ?boolean,
	canEdit: ?boolean,
	isConnectionRequest: ?boolean,
	requestId: ?number,
	requesterId: ?number,
}

export class ActionField extends BaseField
{
	render(params: ActionFieldParams): void
	{
		if (params.isConnectionRequest)
		{
			this.#renderConnectionRequest(params);

			return;
		}

		this.#renderMailboxAction(params);
	}

	#renderConnectionRequest(params: ActionFieldParams): void
	{
		const actionContainer = Tag.render`
			<div class="mailbox-grid_action-field-container"></div>
		`;

		const connectButton = new Button({
			size: Button.Size.MEDIUM,
			text: Loc.getMessage('MAIL_MAILBOX_LIST_CONNECTION_REQUEST_CONNECT'),
			useAirDesign: true,
			noCaps: true,
			wide: false,
			onclick: () => {
				BX.SidePanel.Instance.open('/mail/config/', {
					cacheable: false,
					requestParams: {
						connectionRequest: {
							requestId: params.requestId,
							requesterId: params.requesterId,
						},
					},
				});
			},
			className: 'mailbox-grid_mailbox-connection-request_action-button',
			dataset: { id: 'mailbox-grid_action-button-connection-request-connect' },
		});

		connectButton.setRightCounter({
			value: 1,
		});

		Dom.append(connectButton.render(), actionContainer);

		const rejectButton = new Button({
			size: Button.Size.MEDIUM,
			text: Loc.getMessage('MAIL_MAILBOX_LIST_CONNECTION_REQUEST_REJECT'),
			useAirDesign: true,
			style: AirButtonStyle.PLAIN_NO_ACCENT,
			noCaps: true,
			wide: false,
			onclick: () => {
				this.#rejectConnectionRequest(params.requestId);
			},
			className: 'mailbox-grid_mailbox-connection-request_action-button',
			dataset: { id: 'mailbox-grid_action-button-connection-request-reject' },
		});

		Dom.append(rejectButton.render(), actionContainer);

		this.appendToFieldNode(actionContainer);
	}

	#rejectConnectionRequest(requestId: number): void
	{
		const gridId = this.getGridId();
		if (!gridId)
		{
			return;
		}

		GridManager.getInstance(gridId).runAction({
			actionId: 'rejectMailboxConnectionRequestAction',
			options: {},
			params: { requestId },
		});
	}

	#renderMailboxAction(params: ActionFieldParams): void
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
