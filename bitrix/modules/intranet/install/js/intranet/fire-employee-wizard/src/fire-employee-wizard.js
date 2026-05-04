import { Tag, Type, Loc, Event, Extension } from 'main.core';
import { Popup, PopupManager } from 'main.popup';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Tooltip } from 'ui.dialogs.tooltip';
import { FireWizardConfigProvider } from './fire-wizard-config-provider';
import { MoveWebhookRequest } from './move-webhook-request';
import './style.css';

export class FireEmployeeWizard
{
	#popup: ?Popup = null;
	#options: Object;
	#id: string;

	constructor(options: Object = {})
	{
		this.#id = 'intranet-fire-employee-wizard';
		this.#options = this.#normalizeOptions(options);
	}

	show(): void
	{
		this.#popup = this.#createPopup();
		this.#popup.show();
	}

	close(): void
	{
		this.#popup?.close();
	}

	#normalizeOptions(options: Object): Object
	{
		return {
			showWebhookActions: Type.isBoolean(options?.integration?.hasWebhook)
				? options?.integration?.hasWebhook
				: false,
			onConfirm: Type.isFunction(options.onConfirm) ? options.onConfirm : null,
			onCancel: Type.isFunction(options.onCancel) ? options.onCancel : null,
		};
	}

	#createPopup(): Popup
	{
		if (PopupManager.isPopupExists(this.#id))
		{
			PopupManager.getPopupById(this.#id).destroy();
		}

		const maxPopupWidth = this.#options.showWebhookActions ? 786 : 440;
		const popupWidth = Math.max(288, Math.min(document.documentElement.clientWidth - 32, maxPopupWidth));

		const popupOptions = {
			className: 'intranet-fire-employee-wizard__popup',
			content: this.#renderContent(),
			autoHide: false,
			overlay: true,
			closeByEsc: true,
			closeIcon: false,
			padding: 0,
			width: popupWidth,
			events: {
				onClose: () => {
					popup.destroy();
					if (this.#popup === popup)
					{
						this.#popup = null;
					}
				},
			},
		};

		const popup = new Popup(this.#id, null, popupOptions);

		return popup;
	}

	#renderContent(): HTMLElement
	{
		const content = Tag.render`
			<div class="intranet-fire-employee-wizard">
				<div class="intranet-fire-employee-wizard__header">
					<div class="intranet-fire-employee-wizard__question">${Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_QUESTION')}</div>
					<button
						type="button"
						class="intranet-fire-employee-wizard__close-button"
						data-role="close-button"
						aria-label="${Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_CANCEL')}"
					></button>
				</div>
				<div class="intranet-fire-employee-wizard__content">
					<div class="intranet-fire-employee-wizard__description">
						${Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_DESCRIPTION')}
					</div>
					${this.#renderWebhookNotice()}
				</div>
				${this.#renderActions()}
			</div>
		`;
		const closeNode = content.querySelector('[data-role="close-button"]');
		Event.bind(closeNode, 'click', () => {
			this.#handleCancel();
		});

		return content;
	}

	#renderWebhookNotice(): HTMLElement | null
	{
		if (!this.#options.showWebhookActions)
		{
			return null;
		}
		const integrationUri = Extension
			.getSettings('intranet.fire-employee-wizard')
			.get('integrationUri');
		const integrationLangParams = {
			'[integration_link]': `<a class="intranet-fire-employee-wizard__link" href="${integrationUri}">`,
			'[/integration_link]': '</a>',
		};
		const sysUserLangParams = {
			'[span]': '<span class="intranet-fire-employee-wizard__link-text">',
			'[/span]': '</span>',
		};

		const content = Tag.render`
			<div class="intranet-fire-employee-wizard__notice">
				<div class="intranet-fire-employee-wizard__notice-title">
					<span>${Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_INTEGRATION_TITLE', integrationLangParams)}</span>
				</div>
				<div class="intranet-fire-employee-wizard__notice-text">
					<p class="intranet-fire-employee-wizard__notice-paragraph">
						<span>${Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_INTEGRATION_TEXT_FIRST', sysUserLangParams)}</span>
					</p>
					<p class="intranet-fire-employee-wizard__notice-paragraph">
						<span>${Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_INTEGRATION_TEXT_THIRD')}</span>
						&nbsp;
						<a
							class="intranet-fire-employee-wizard__link"
							href="#"
							onclick="top.BX.Helper.show('redirect=detail&code=26213326#01');"
						>
							${Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_INTEGRATION_DETAILS')}
						</a>
					</p>
				</div>
			</div>
		`;
		const systemUserNode = content.querySelector('span.intranet-fire-employee-wizard__link-text');
		Event.bind(systemUserNode, 'click', () => {
			new Tooltip({
				bindElement: systemUserNode,
				content: Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_INTEGRATION_TEXT_SYSTEM_USER_DESCRIPTION'),
				popupOptions: {
					autoHide: true,
					angle: { offset: 100 },
				},
			}).show();
		});

		return content;
	}

	#renderActions(): HTMLElement
	{
		const actions = Tag.render`
			<div class="intranet-fire-employee-wizard__actions"></div>
		`;

		if (this.#options.showWebhookActions)
		{
			actions.append(
				this.#createButton({
					text: Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_SAVE_AND_FIRE'),
					style: AirButtonStyle.FILLED,
					className: 'intranet-fire-employee-wizard__button intranet-fire-employee-wizard__button--cancel fire-save-btn',
					onclick: () => this.#handleConfirm(true),
				}).render(),
			);

			actions.append(
				this.#createButton({
					text: Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_DISABLE_AND_FIRE'),
					style: AirButtonStyle.OUTLINE_NO_ACCENT,
					className: 'intranet-fire-employee-wizard__button intranet-fire-employee-wizard__button--outline fire-disable-btn',
					onclick: () => this.#handleConfirm(false),
				}).render(),
			);

			actions.append(
				this.#createButton({
					text: Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_CANCEL'),
					style: AirButtonStyle.PLAIN_NO_ACCENT,
					className: 'intranet-fire-employee-wizard__button intranet-fire-employee-wizard__button--plain fire-cancel-btn',
					onclick: () => this.#handleCancel(),
				}).render(),
			);
		}
		else
		{
			actions.append(
				this.#createButton({
					text: Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_CANCEL'),
					style: AirButtonStyle.FILLED,
					className: 'intranet-fire-employee-wizard__button intranet-fire-employee-wizard__button--cancel fire-cancel-btn',
					onclick: () => this.#handleCancel(),
				}).render(),
			);

			actions.append(
				this.#createButton({
					text: Loc.getMessage('INTRANET_FIRE_EMPLOYEE_WIZARD_CONFIRM'),
					style: AirButtonStyle.OUTLINE_NO_ACCENT,
					className: 'intranet-fire-employee-wizard__button intranet-fire-employee-wizard__button--outline fire-confirm-btn',
					onclick: () => this.#handleConfirm(false),
				}).render(),
			);
		}

		return actions;
	}

	#createButton(options: {
		text: string,
		style: string,
		className: string,
		onclick: Function,
	}): Button
	{
		return new Button({
			text: options.text,
			useAirDesign: true,
			style: options.style,
			size: ButtonSize.EXTRA_LARGE,
			className: options.className,
			noCaps: true,
			onclick: options.onclick,
		});
	}

	#handleCancel(): void
	{
		this.#options.onCancel?.();
		this.close();
	}

	#handleConfirm(moveWebhooksToSystemUser: boolean): void
	{
		this.#options.onConfirm?.(this.#getConfirmData(moveWebhooksToSystemUser));
		this.close();
	}

	#getConfirmData(moveWebhooksToSystemUser: boolean): { moveWebhooksToSystemUser: boolean }
	{
		return {
			moveWebhooksToSystemUser,
		};
	}
}

export {
	FireWizardConfigProvider,
	MoveWebhookRequest,
};
