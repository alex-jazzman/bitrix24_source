import { Loc, Event, Tag, Type } from 'main.core';
import { sendData } from 'ui.analytics';
import { Builder } from 'crm.integration.analytics';

export type OldInvoiceReadonlyAlertContentOptions = {
	lastTimeShownField: string,
	lastTimeShownOptionName: string,
};

export default class OldInvoiceReadonlyAlertContent
{
	#alertContainer: HTMLElement;
	#lastTimeShownField: string;
	#lastTimeShownOptionName: string;

	constructor(alertContainer: HTMLElement, options: OldInvoiceReadonlyAlertContentOptions)
	{
		if (!Type.isString(options.lastTimeShownField))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'lastTimeShownField\' must be string');
		}

		if (!Type.isString(options.lastTimeShownOptionName))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'lastTimeShownOptionName\' must be string');
		}

		this.#alertContainer = alertContainer;
		this.#lastTimeShownField = options.lastTimeShownField;
		this.#lastTimeShownOptionName = options.lastTimeShownOptionName;
	}

	createNode(): HTMLElement
	{
		const { root, closeButton } = Tag.render`
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
				</div>
				<button class="crm-old-layout-close-button" ref="closeButton">
				</button>
			</div>
		`;

		const aboutLink = root.querySelector('.crm-old-layout-helpdesk-link');
		Event.bind(aboutLink, 'click', () => {
			top.BX.Helper.show('redirect=detail&code=14795982');
			sendData(Builder.OldEntityView.OldInvoiceReadonly.ClickEvent.buildData());
		});

		Event.bind(closeButton, 'click', () => {
			const currentTimeInMs = Date.now();
			const currentTimeInS = Math.round(currentTimeInMs / 1000);

			BX.userOptions.save(
				'crm',
				this.#lastTimeShownField,
				this.#lastTimeShownOptionName,
				currentTimeInS,
			);
			this.#alertContainer.remove();

			sendData(Builder.OldEntityView.OldInvoiceReadonly.CloseEvent.buildData());
		});

		sendData(Builder.OldEntityView.OldInvoiceReadonly.ViewEvent.buildData());

		return root;
	}

	#getTitleText(): string
	{
		return Loc.getMessage('CRM_OLD_CARD_LAYOUT_INVOICE_READONLY_ALERT_TITLE');
	}

	#getText(): string
	{
		const helpdeskLink = '<a class="crm-old-layout-helpdesk-link">';

		return Loc.getMessage(
			'CRM_OLD_CARD_LAYOUT_INVOICE_READONLY_ALERT_TEXT',
			{
				'[helpdeskLink]': helpdeskLink,
				'[/helpdeskLink]': '</a>',
			},
		);
	}
}
