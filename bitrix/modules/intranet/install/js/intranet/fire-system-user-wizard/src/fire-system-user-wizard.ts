import { Tag, Type, Text, Loc, Event, Dom } from 'main.core';
import { Popup, PopupManager } from 'main.popup';
import { AirButtonStyle, Button, ButtonSize, type ButtonOptions } from 'ui.buttons';
import { Alert, AlertDesign } from 'ui.system.alert';

import {
	type FireWizardConfigDto,
	type FireWizardListConfigDto,
	type SystemUserIntegration,
} from './system-user-config-provider';

import './style.css';

const HELP_ARTICLE_CODE = 'redirect=detail&code=26213326#01';
const POPUP_ID = 'intranet-fire-system-user-wizard';
const TITLE_ID = `${POPUP_ID}-title`;
const DESCRIPTION_ID = `${POPUP_ID}-description`;
const NOTICE_ID = `${POPUP_ID}-notice`;

export type FireSystemUserWizardOptions = {
	integrations?: Array<SystemUserIntegration>,
	onConfirm?: () => void,
	onCancel?: () => void,
};

export type FireSystemUserWizardHandlers = {
	onConfirm: () => void,
	onFallback?: () => void,
};

type BitrixHelper = {
	show: (code: string) => void,
};

type HelperWindow = Window & {
	BX?: {
		Helper?: BitrixHelper,
	},
};

type WizardButtonOptions = Omit<ButtonOptions, 'collapsedIcon'>;

const getMessage = (code: string): string => Loc.getMessage(code) ?? '';

const getOwnHelper = (): BitrixHelper | null => {
	return (window as HelperWindow).BX?.Helper ?? null;
};

const showHelpArticle = (): void => {
	let helper = null;

	try
	{
		helper = (top as HelperWindow | null)?.BX?.Helper ?? getOwnHelper();
	}
	catch
	{
		helper = getOwnHelper();
	}

	helper?.show(HELP_ARTICLE_CODE);
};

export class FireSystemUserWizard
{
	#popup: Popup | null = null;
	#container: HTMLElement | null = null;
	#integrationList: HTMLElement | null = null;
	#integrations: Array<SystemUserIntegration>;
	#onConfirm: (() => void) | null;
	#onCancel: (() => void) | null;

	constructor(options: FireSystemUserWizardOptions = {})
	{
		this.#integrations = FireSystemUserWizard.#normalizeIntegrations(options.integrations);
		this.#onConfirm = Type.isFunction(options.onConfirm) ? options.onConfirm : null;
		this.#onCancel = Type.isFunction(options.onCancel) ? options.onCancel : null;
	}

	static hasSystemUser(config: FireWizardConfigDto | null | void): boolean
	{
		return config?.systemUser?.isSystemUser === true;
	}

	static hasSystemUsers(config: FireWizardListConfigDto | null | void): boolean
	{
		const userIds = config?.systemUser?.userIds;

		return Array.isArray(userIds) && userIds.length > 0;
	}

	static showForConfig(config: FireWizardConfigDto | null | void, handlers: FireSystemUserWizardHandlers): boolean
	{
		return FireSystemUserWizard.#show(
			FireSystemUserWizard.hasSystemUser(config),
			config?.systemUser?.integrations,
			handlers,
		);
	}

	static showForListConfig(
		config: FireWizardListConfigDto | null | void,
		handlers: FireSystemUserWizardHandlers,
	): boolean
	{
		return FireSystemUserWizard.#show(
			FireSystemUserWizard.hasSystemUsers(config),
			config?.systemUser?.integrations,
			handlers,
		);
	}

	static #show(
		hasSystemUsers: boolean,
		integrations: Array<SystemUserIntegration> | null | void,
		handlers: FireSystemUserWizardHandlers,
	): boolean
	{
		if (!hasSystemUsers)
		{
			handlers.onFallback?.();

			return false;
		}

		new FireSystemUserWizard({
			integrations: integrations ?? [],
			onConfirm: handlers.onConfirm,
		}).show();

		return true;
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

	static #normalizeIntegrations(integrations: Array<SystemUserIntegration> | null | void): Array<SystemUserIntegration>
	{
		if (!Array.isArray(integrations))
		{
			return [];
		}

		return integrations.filter(
			(integration) => Type.isPlainObject(integration),
		) as Array<SystemUserIntegration>;
	}

	#createPopup(): Popup
	{
		if (PopupManager.isPopupExists(POPUP_ID))
		{
			PopupManager.getPopupById(POPUP_ID)?.destroy();
		}

		const popupWidth = Math.max(288, Math.min(document.documentElement.clientWidth - 32, 786));

		const popup = new Popup({
			id: POPUP_ID,
			className: 'intranet-fire-system-user-wizard__popup',
			content: this.#renderContent(),
			autoHide: false,
			overlay: true,
			closeByEsc: true,
			closeIcon: false,
			padding: 0,
			width: popupWidth,
			ariaLabelledBy: TITLE_ID,
			focusTrap: {
				initialFocus: ['[data-autofocus]', 'container'],
			},
			events: {
				onAfterShow: () => {
					this.#syncScrollableRegions();
				},
				onClose: () => {
					popup.destroy();
					this.#container = null;
					this.#integrationList = null;
					if (this.#popup === popup)
					{
						this.#popup = null;
					}
				},
			},
		});

		Dom.attr(popup.getPopupContainer(), {
			'aria-modal': 'true',
			'aria-describedby': `${DESCRIPTION_ID} ${NOTICE_ID}`,
		});

		return popup;
	}

	#syncScrollableRegions(): void
	{
		FireSystemUserWizard.#syncScrollableRegion(this.#container);
		FireSystemUserWizard.#syncScrollableRegion(this.#integrationList);
	}

	static #syncScrollableRegion(element: HTMLElement | null): void
	{
		if (element === null)
		{
			return;
		}

		const isScrollable = element.scrollHeight - element.clientHeight > 1;

		Dom.attr(element, 'tabindex', isScrollable ? '0' : null);
	}

	#renderContent(): HTMLElement
	{
		const content = Tag.render`
			<div
				class="intranet-fire-system-user-wizard"
				data-testid="intranet-fire-system-user-wizard"
			>
				<div class="intranet-fire-system-user-wizard__header">
					<div class="intranet-fire-system-user-wizard__title" id="${TITLE_ID}">
						${Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_TITLE'))}
					</div>
					<button
						type="button"
						class="intranet-fire-system-user-wizard__close-button"
						data-role="close-button"
						aria-label="${Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_CLOSE'))}"
					></button>
				</div>
				<div class="intranet-fire-system-user-wizard__content">
					<div class="intranet-fire-system-user-wizard__description" id="${DESCRIPTION_ID}">
						${Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_SUBTITLE'))}
					</div>
					${this.#renderAlert()}
					${this.#renderIntegrationList()}
				</div>
				${this.#renderActions()}
			</div>
		`;

		const closeButton = content.querySelector('[data-role="close-button"]');
		if (closeButton)
		{
			Event.bind(closeButton, 'click', () => {
				this.#handleCancel();
			});
		}

		this.#container = content;

		return content;
	}

	#renderAlert(): HTMLElement
	{
		const alertContent = Tag.render`
			<div class="intranet-fire-system-user-wizard__notice" id="${NOTICE_ID}" role="alert">
				<span>${Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_NOTICE'))}</span>
				&nbsp;
				<button
					type="button"
					class="intranet-fire-system-user-wizard__link"
					data-role="help-link"
					aria-label="${Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_DETAILS_ARIA'))}"
				>
					${Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_DETAILS'))}
				</button>
			</div>
		`;

		const helpLink = alertContent.querySelector('[data-role="help-link"]');
		if (helpLink)
		{
			Event.bind(helpLink, 'click', () => {
				showHelpArticle();
			});
		}

		return new Alert({
			design: AlertDesign.tintedAlert,
			content: alertContent,
		}).render();
	}

	#renderIntegrationList(): HTMLElement | null
	{
		if (this.#integrations.length === 0)
		{
			return null;
		}

		const list = Tag.render`
			<ul
				class="intranet-fire-system-user-wizard__integrations"
				data-testid="intranet-fire-system-user-wizard-integrations"
				aria-label="${Text.encode(getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_INTEGRATIONS_LIST'))}"
			></ul>
		`;

		this.#integrations.forEach((integration) => {
			list.append(Tag.render`
				<li
					class="intranet-fire-system-user-wizard__integration --${Text.encode(integration.type)}"
					data-testid="intranet-fire-system-user-wizard-integration"
				>
					${Text.encode(FireSystemUserWizard.#getIntegrationTitle(integration))}
				</li>
			`);
		});

		this.#integrationList = list;

		return list;
	}

	static #getIntegrationTitle(integration: SystemUserIntegration): string
	{
		if (Type.isStringFilled(integration.title))
		{
			return integration.title;
		}

		return integration.type === 'webhook'
			? getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_UNTITLED_WEBHOOK')
			: getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_UNTITLED_APP');
	}

	#renderActions(): HTMLElement
	{
		const actions = Tag.render`
			<div class="intranet-fire-system-user-wizard__actions"></div>
		`;

		actions.append(
			this.#createButton(
				getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_CONFIRM'),
				AirButtonStyle.FILLED,
				'intranet-fire-system-user-wizard__button--confirm',
				'intranet-fire-system-user-wizard-confirm-btn',
				() => this.#handleConfirm(),
			),
		);

		const cancelButton = this.#createButton(
			getMessage('INTRANET_FIRE_SYSTEM_USER_WIZARD_CANCEL'),
			AirButtonStyle.OUTLINE_NO_ACCENT,
			'intranet-fire-system-user-wizard__button--cancel',
			'intranet-fire-system-user-wizard-cancel-btn',
			() => this.#handleCancel(),
		);

		Dom.attr(cancelButton, 'data-autofocus', '');
		actions.append(cancelButton);

		return actions;
	}

	#createButton(
		text: string,
		style: ButtonOptions['style'],
		className: string,
		testId: string,
		handler: () => void,
	): HTMLElement
	{
		const options: WizardButtonOptions = {
			text,
			useAirDesign: true,
			style,
			size: ButtonSize.EXTRA_LARGE,
			className: `intranet-fire-system-user-wizard__button ${className}`,
			noCaps: true,
			dataset: {
				testid: testId,
			},
			onclick: () => {
				handler();

				return {};
			},
		};

		return new Button(options as ButtonOptions).render();
	}

	#handleCancel(): void
	{
		this.#onCancel?.();
		this.close();
	}

	#handleConfirm(): void
	{
		this.#onConfirm?.();
		this.close();
	}
}
