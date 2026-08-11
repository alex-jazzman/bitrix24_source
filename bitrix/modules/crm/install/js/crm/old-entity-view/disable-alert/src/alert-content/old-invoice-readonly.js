import { Loc, Tag, Type } from 'main.core';
import { Button } from 'ui.buttons';
import { sendData } from 'ui.analytics';
import { Builder } from 'crm.integration.analytics';
import { bindHelpdeskLink, showDisableOldInvoicesConfirmation } from './sunset-actions';

export type OldInvoiceReadonlyAlertContentOptions = {
	isAdmin: boolean,
};

export default class OldInvoiceReadonlyAlertContent
{
	#alertContainer: HTMLElement;
	#isAdmin: boolean;

	constructor(alertContainer: HTMLElement, options: OldInvoiceReadonlyAlertContentOptions)
	{
		if (!Type.isBoolean(options.isAdmin))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'isAdmin\' must be boolean');
		}

		this.#alertContainer = alertContainer;
		this.#isAdmin = options.isAdmin;
	}

	createNode(): HTMLElement
	{
		const { root, buttonContainer } = Tag.render`
			<div class="crm-old-layout-disable-alert">
				<div class="crm-old-layout-left-part">
					<span class="crm-old-layout-icon"></span>
				</div>
				<div class="crm-old-layout-right-part">
					<h4 class="crm-old-layout-title ui-typography-heading-h4">
						${this.#getTitleText()}
					</h4>
					<p class="crm-old-layout-text ui-typography-text-md">
						${this.#getText()}
					</p>
					<div class="crm-old-layout-buttons" ref="buttonContainer"></div>
				</div>
			</div>
		`;

		bindHelpdeskLink(root, () => {
			sendData(Builder.OldEntityView.OldInvoiceReadonly.ClickEvent.buildData());
		});

		if (this.#isAdmin)
		{
			const enableNewButton = new Button({
				text: Loc.getMessage('CRM_OLD_INVOICE_SUNSET_BUTTON_TEXT'),
				useAirDesign: true,
				style: Button.AirStyle.OUTLINE,
				size: Button.Size.SMALL,
				onclick: () => {
					showDisableOldInvoicesConfirmation({
						message: Loc.getMessage('CRM_OLD_INVOICE_SUNSET_READONLY_CONFIRM_MESSAGE'),
						confirmText: Loc.getMessage('CRM_OLD_INVOICE_SUNSET_CONFIRM_OK'),
						cancelText: Loc.getMessage('CRM_OLD_INVOICE_SUNSET_CONFIRM_CANCEL'),
						errorText: Loc.getMessage('CRM_OLD_INVOICE_SUNSET_ERROR'),
					});
				},
			});
			enableNewButton.renderTo(buttonContainer);
		}

		sendData(Builder.OldEntityView.OldInvoiceReadonly.ViewEvent.buildData());

		return root;
	}

	#getTitleText(): string
	{
		return Loc.getMessage('CRM_OLD_INVOICE_SUNSET_READONLY_TITLE');
	}

	#getText(): string
	{
		return Loc.getMessage(
			'CRM_OLD_INVOICE_SUNSET_READONLY_TEXT',
			{
				'[helpdeskLink]': '<a class="crm-old-layout-helpdesk-link">',
				'[/helpdeskLink]': '</a>',
			},
		);
	}
}
