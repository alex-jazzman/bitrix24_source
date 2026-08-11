import { Loc, Event, Tag, Type } from 'main.core';
import { Button } from 'ui.buttons';
import { bindHelpdeskLink, showDisableOldInvoicesConfirmation } from './sunset-actions';

export type OldInvoiceWarningAlertContentOptions = {
	daysUntilDisable: number,
	isAdmin: boolean,
	lastTimeShownField?: string,
	lastTimeShownOptionName?: string,
};

export default class OldInvoiceWarningAlertContent
{
	#alertContainer: HTMLElement;
	#daysUntilDisable: number;
	#isAdmin: boolean;
	#lastTimeShownField: ?string;
	#lastTimeShownOptionName: ?string;

	constructor(alertContainer: HTMLElement, options: OldInvoiceWarningAlertContentOptions)
	{
		if (!Type.isInteger(options.daysUntilDisable))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'daysUntilDisable\' must be integer');
		}

		if (!Type.isBoolean(options.isAdmin))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'isAdmin\' must be boolean');
		}

		this.#alertContainer = alertContainer;
		this.#daysUntilDisable = options.daysUntilDisable;
		this.#isAdmin = options.isAdmin;
		this.#lastTimeShownField = Type.isString(options.lastTimeShownField) ? options.lastTimeShownField : null;
		this.#lastTimeShownOptionName = Type.isString(options.lastTimeShownOptionName) ? options.lastTimeShownOptionName : null;
	}

	createNode(): HTMLElement
	{
		const closeButtonHtml = this.#isAdmin
			? ''
			: '<button class="crm-old-layout-close-button" ref="closeButton"></button>';

		const { root, buttonContainer, closeButton } = Tag.render`
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
				${closeButtonHtml}
			</div>
		`;

		bindHelpdeskLink(root);

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
		else if (closeButton && this.#lastTimeShownField && this.#lastTimeShownOptionName)
		{
			Event.bind(closeButton, 'click', () => {
				const currentTimeInSeconds = Math.round(Date.now() / 1000);
				BX.userOptions.save(
					'crm',
					this.#lastTimeShownField,
					this.#lastTimeShownOptionName,
					currentTimeInSeconds,
				);
				this.#alertContainer.remove();
			});
		}

		return root;
	}

	#getTitleText(): string
	{
		return Loc.getMessage('CRM_OLD_INVOICE_SUNSET_WARNING_TITLE');
	}

	#getText(): string
	{
		const replacements = {
			'[helpdeskLink]': '<a class="crm-old-layout-helpdesk-link">',
			'[/helpdeskLink]': '</a>',
		};

		if (this.#daysUntilDisable === 0)
		{
			return Loc.getMessage('CRM_OLD_INVOICE_SUNSET_WARNING_TEXT_LESS_THAN_DAY', replacements);
		}

		return Loc.getMessagePlural(
			'CRM_OLD_INVOICE_SUNSET_WARNING_TEXT',
			this.#daysUntilDisable,
			{
				...replacements,
				'#DAYS_UNTIL_DISABLE#': this.#daysUntilDisable,
			},
		);
	}
}
