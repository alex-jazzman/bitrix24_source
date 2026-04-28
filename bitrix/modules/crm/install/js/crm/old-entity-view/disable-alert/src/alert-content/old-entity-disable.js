import { Loc, Event, Tag, Type } from 'main.core';
import { MessageBox } from 'ui.dialogs.messagebox';
import { UI } from 'ui.notification';
import { Button } from 'ui.buttons';
import { Router } from 'crm.router';

export type OldEntityDisableAlertContentOptions = {
	daysUntilDisable: number,
	isAdmin: boolean,
	lastTimeShownField: string,
	lastTimeShownOptionName: string,
	previewHref: string,
};

export default class OldEntityDisableAlertContent
{
	#alertContainer: HTMLElement;
	#daysUntilDisable: number;
	#isAdmin: boolean;
	#lastTimeShownField: string;
	#lastTimeShownOptionName: string;
	#previewHref: string;

	constructor(alertContainer: HTMLElement, options: OldEntityDisableAlertContentOptions)
	{
		if (!Type.isInteger(options.daysUntilDisable))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'daysUntilDisable\' must be integer');
		}

		if (!Type.isBoolean(options.isAdmin))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'isAdmin\' must be boolean');
		}

		if (!Type.isString(options.lastTimeShownField))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'lastTimeShownField\' must be string');
		}

		if (!Type.isString(options.lastTimeShownOptionName))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'lastTimeShownOptionName\' must be string');
		}

		if (!Type.isString(options.previewHref))
		{
			throw new TypeError('OldCardLayout.DisableAlert: \'previewHref\' must be string');
		}

		this.#alertContainer = alertContainer;
		this.#daysUntilDisable = options.daysUntilDisable;
		this.#isAdmin = options.isAdmin;
		this.#lastTimeShownField = options.lastTimeShownField;
		this.#lastTimeShownOptionName = options.lastTimeShownOptionName;
		this.#previewHref = options.previewHref;
	}

	createNode(): HTMLElement
	{
		const previewButton = new Button({
			text: Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_SHOW_PREVIEW_TEXT'),
			useAirDesign: true,
			style: Button.AirStyle.OUTLINE,
			size: Button.Size.SMALL,
			onclick: () => {
				Router.openSlider(this.#previewHref, { allowChangeHistory: false });
			},
		});

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
					<div class="crm-old-layout-buttons" ref="buttonContainer">
						${previewButton.getContainer()}
					</div>
				</div>
				<button class="crm-old-layout-close-button" ref="closeButton">
				</button>
			</div>
		`;

		const aboutLink = root.querySelector('.crm-old-layout-helpdesk-link');
		Event.bind(aboutLink, 'click', () => {
			top.BX.Helper.show('redirect=detail&code=26179574');
		});

		if (this.#isAdmin)
		{
			const showConfirmationButton = new Button({
				text: Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_TEXT'),
				useAirDesign: true,
				style: Button.AirStyle.OUTLINE,
				size: Button.Size.SMALL,
				onclick: () => {
					this.#showConfirmationPopup();
				},
			});
			showConfirmationButton.renderTo(buttonContainer);
		}

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
		});

		return root;
	}

	#sendEnableNewLayoutRequest(): void
	{
		BX.ajax.runAction('crm.oldentityview.sunset.enableNewCardLayout')
			.then(() => {
				window.location.reload();
			})
			.catch(() => {
				UI.Notification.Center.notify({
					content: Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_ERROR_MESSAGE'),
				});
			});
	}

	#showConfirmationPopup(): void
	{
		const confirmationPopup = MessageBox.create({
			message: Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_ASSERT'),
			useAirDesign: true,
			buttons: [
				new Button({
					text: Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_ASSERT_CONFIRM'),
					useAirDesign: true,
					style: Button.AirStyle.FILLED,
					onclick: (button) => {
						this.#sendEnableNewLayoutRequest(button);
					},
				}),
				new Button({
					text: Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_ASSERT_CANCEL'),
					useAirDesign: true,
					style: Button.AirStyle.OUTLINE,
					onclick: (button) => {
						button.context.close();
					},
				}),
			],
		});
		confirmationPopup.show();
	}

	#getTitleText(): string
	{
		if (this.#daysUntilDisable === 0)
		{
			return Loc.getMessage('CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_TITLE_LESS_THAN_DAY');
		}

		return Loc.getMessagePlural(
			'CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_TITLE',
			this.#daysUntilDisable,
			{
				'#DAYS_UNTIL_DISABLE#': this.#daysUntilDisable,
			},
		);
	}

	#getText(): string
	{
		const helpdeskLink = '<a class="crm-old-layout-helpdesk-link">';
		const localPhraseCode = this.#isAdmin
			? 'CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_TEXT'
			: 'CRM_OLD_CARD_LAYOUT_DISABLE_ALERT_ENABLE_NEW_LAYOUT_CONTACT_ADMIN'
		;

		return Loc.getMessage(
			localPhraseCode,
			{
				'[helpdeskLink]': helpdeskLink,
				'[/helpdeskLink]': '</a>',
			},
		);
	}
}
