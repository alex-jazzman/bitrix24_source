import { EventEmitter } from 'main.core.events';
import { ajax, Dom, Event, Loc, Tag, Type } from 'main.core';
import { MenuManager, Popup } from 'main.popup';
import { FocusMonitor, FocusNavigator, LiveAnnouncer } from 'ui.a11y';

export class RequisiteSection extends EventEmitter
{
	#companyId;
	#requisiteId;
	#isConnected: boolean;
	#isPublic: boolean;
	#publicUrl: string;
	#editUrl: string;

	#requisiteElement:? HTMLElement;
	#requisitesPopup;
	#requisiteButton:? BX.UI.Button;
	#closeSettingsWidget;
	#getSettingsPopup;
	#handleSettingsPopupClick = (): void => {
		this.#requisitesPopup?.close();
	};

	constructor(options, closeSettingsWidget, getSettingsPopup) {
		super();
		this.#closeSettingsWidget = closeSettingsWidget;
		this.#getSettingsPopup = getSettingsPopup;

		if (options)
		{
			this.#updateOptions(options);
			top.BX.addCustomEvent('onLocalStorageSet', (params) => {
				const eventName = params?.key ?? null;

				if (
					eventName === 'onCrmEntityUpdate'
					|| eventName === 'onCrmEntityCreate'
					|| eventName === 'BX.Crm.RequisiteSliderDetails:onSave'
				)
				{
					this.#getRequisites().then(() => {
						this.#updateElement();
					});
				}
			});
		}
	}

	#updateOptions(options): void
	{
		this.#companyId = options.companyId ?? 0;
		this.#requisiteId = options.requisiteId ?? 0;
		this.#isConnected = Type.isBoolean(options.isConnected) ? options.isConnected : false;
		this.#isPublic = Type.isBoolean(options.isPublic) ? options.isPublic : false;
		this.#publicUrl = Type.isString(options.publicUrl) ? options.publicUrl : '';
		this.#editUrl = Type.isString(options.editUrl) ? options.editUrl : '';
	}

	#updateElement(forceFocusRestore: boolean = false): void
	{
		const currentElement = this.getElement();
		const activeElement = FocusNavigator.getActiveElement(currentElement);
		const shouldMoveFocus = forceFocusRestore
			|| (activeElement !== null && currentElement.contains(activeElement))
		;
		if (this.#requisitesPopup)
		{
			this.#requisitesPopup.destroy();
			this.#requisitesPopup = null;
		}

		this.#requisiteElement = null;
		this.#requisiteButton = null;
		const newElement = this.getElement();
		Dom.replace(currentElement, newElement);

		const settingsPopup = this.#getSettingsPopup();
		if (shouldMoveFocus && settingsPopup?.isShown())
		{
			FocusNavigator.focusTarget(this.#getRequisiteButton().getContainer(), { focusVisible: true });
		}
	}

	getElement(): HTMLElement
	{
		if (!this.#requisiteElement)
		{
			const onclickHelp = () => {
				this.#closeSettingsWidget();
				BX.Helper.show('redirect=detail&code=18213326');
			};

			this.#requisiteElement = Tag.render`
				<div
					class="intranet-settings-widget__business-card intranet-settings-widget_box"
					data-testid="settings-widget-block-requisite"
				>
					<div class="intranet-settings-widget__business-card_head intranet-settings-widget_inner">
						<div class="intranet-settings-widget_icon-box --gray">
							<div class="ui-icon-set --customer-card-1" aria-hidden="true"></div>
						</div>
						<div class="intranet-settings-widget__title" data-role="requisite-widget-title">
							${
								this.#isConnected
									? Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_REQUISITE_SITE_TITLE')
									: Loc.getMessage('INTRANET_SETTINGS_WIDGET_SECTION_REQUISITE_TITLE')
							}
						</div>
						<button
							type="button"
							class="intranet-settings-widget__requisite-help"
							aria-label="${Loc.getMessage('INTRANET_SETTINGS_WIDGET_REQUISITE_HELP_ARIA')}"
							data-testid="settings-widget-requisite-help"
							onclick="${onclickHelp}"
						>
							<span class="ui-icon-set --help" aria-hidden="true"></span>
						</button>
					</div>

					<div class="intranet-settings-widget__business-card_footer">
						${this.#getRequisiteButton().getContainer()}
						${this.#companyId ? this.#getRequisiteSettingsButton() : ''}
					</div>
				</div>
			`;
		}

		return this.#requisiteElement;
	}

	#getRequisiteSettingsButton(): HTMLElement
	{
		const onclickRequisitesSettings = (event) => {
			this.#getRequisitesPopup(event.currentTarget).show();
		};

		return Tag.render`
			<button
				type="button"
				class="intranet-settings-widget__requisite-btn"
				aria-label="${Loc.getMessage('INTRANET_SETTINGS_WIDGET_REQUISITE_MORE_ARIA')}"
				aria-haspopup="menu"
				aria-expanded="false"
				data-testid="settings-widget-requisite-more"
				onclick="${onclickRequisitesSettings}"
			>
				<span class="ui-icon-set --more-information" aria-hidden="true"></span>
			</button>
		`;
	}

	#getRequisitesPopupEvents(bindElement: HTMLElement): Object
	{
		return {
			onShow: () => {
				Dom.attr(bindElement, 'aria-expanded', 'true');
				setTimeout(() => {
					if (!this.#requisitesPopup?.isShown())
					{
						return;
					}

					const settingsPopupContainer = this.#getSettingsPopup()?.getPopupContainer();
					if (settingsPopupContainer)
					{
						Event.unbind(settingsPopupContainer, 'click', this.#handleSettingsPopupClick);
						Event.bind(settingsPopupContainer, 'click', this.#handleSettingsPopupClick);
					}
				}, 0);
			},
			onClose: () => {
				this.#unbindSettingsPopupClick();
				Dom.attr(bindElement, 'aria-expanded', 'false');
				if (FocusMonitor.Instance.getLastInputModality() === 'keyboard')
				{
					FocusNavigator.focusTarget(bindElement, { focusVisible: true });
				}
			},
			onDestroy: () => {
				this.#unbindSettingsPopupClick();
				Dom.attr(bindElement, 'aria-expanded', 'false');
				this.#requisitesPopup = null;
			},
		};
	}

	#unbindSettingsPopupClick(): void
	{
		const settingsPopupContainer = this.#getSettingsPopup()?.getPopupContainer();
		if (settingsPopupContainer)
		{
			Event.unbind(settingsPopupContainer, 'click', this.#handleSettingsPopupClick);
		}
	}

	#getRequisitesPopup(bindElement: HTMLElement)
	{
		if (!this.#requisitesPopup)
		{
			const onclickCopyLink = () => {
				if (BX.clipboard.copy(this.#publicUrl))
				{
					const message = Loc.getMessage('INTRANET_SETTINGS_WIDGET_COPIED_POPUP');
					BX.UI.Notification.Center.notify({
						content: message,
						position: 'top-left',
						autoHideDelay: 3000,
					});
					LiveAnnouncer.announce(message, 'polite');
				}
			};

			const onclickConfigureSite = () => {
				window.open(this.#editUrl, '_blank');
				this.#requisitesPopup.close();
				this.#closeSettingsWidget();
			};

			let copyLinkButton = null;
			if (this.#publicUrl)
			{
				copyLinkButton = {
					attrs: {
						'data-testid': 'settings-widget-requisite-copy-link',
					},
					html: `
							<div class="intranet-settings-widget__popup-item">
								<div class="ui-icon-set --link-3"></div> 
								<div class="intranet-settings-widget__popup-name">
									${Loc.getMessage('INTRANET_SETTINGS_WIDGET_COPY_LINK_BUTTON')}
								</div>
							</div>
						`,
					onclick: onclickCopyLink,
				};
			}

			let configureSiteButton = null;
			if (this.#editUrl)
			{
				configureSiteButton = {
					attrs: {
						'data-testid': 'settings-widget-requisite-configure-site',
					},
					html: `
							<div class="intranet-settings-widget__popup-item">
								<div class="ui-icon-set --paint-1"></div> 
								<div class="intranet-settings-widget__popup-name">
									${Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_CUTAWAY_SITE_BUTTON')}
								</div>
							</div>
						`,
					onclick: onclickConfigureSite,
				};
			}

			const onclickConfigureRequisites = () => {
				if (this.#requisitesPopup)
				{
					this.#requisitesPopup.close();
				}

				this.#closeSettingsWidget();
				BX.SidePanel.Instance.open(`/crm/company/details/${this.#companyId}/?init_mode=edit&rqedit=y`);
			};

			const configureRequisiteButton = {
				attrs: {
					'data-testid': 'settings-widget-requisite-configure',
				},
				html: `
						<div class="intranet-settings-widget__popup-item">
							<div class="ui-icon-set --pencil-40"></div>
							<div class="intranet-settings-widget__popup-name">
								${Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_REQUISITE_BUTTON')}
							</div>
						</div>
					`,
				onclick: onclickConfigureRequisites,
			};

			const popupWidth = 240;

			this.#requisitesPopup = MenuManager.create(
				'requisites-settings',
				bindElement,
				[copyLinkButton, configureRequisiteButton, configureSiteButton],
				{
					ariaLabel: Loc.getMessage('INTRANET_SETTINGS_WIDGET_REQUISITE_MORE_ARIA'),
					closeByEsc: true,
					autoHide: true,
					focusTrap: {
						initialFocus: 'container',
					},
					width: popupWidth,
					offsetLeft: -72,
					angle: {
						offset: popupWidth / 2 - 15,
					},
					events: this.#getRequisitesPopupEvents(bindElement),
				},
			);
			Dom.attr(
				this.#requisitesPopup.getMenuContainer(),
				'data-testid',
				'settings-widget-requisite-menu',
			);
		}

		return this.#requisitesPopup;
	}

	#getButtonText(): string
	{
		if (this.#isConnected)
		{
			return Loc.getMessage('INTRANET_SETTINGS_WIDGET_REDIRECT_TO_REQUISITE_BUTTON')
		}

		if (this.#companyId > 0 && this.#requisiteId > 0)
		{
			return Loc.getMessage('INTRANET_SETTINGS_WIDGET_CREATE_LANDING')
		}

		return Loc.getMessage('INTRANET_SETTINGS_CONFIGURE_REQUISITE_BUTTON');
	}

	#getRequisiteButton(): BX.UI.Button
	{
		if (!this.#requisiteButton)
		{
			this.#requisiteButton = new BX.UI.Button({
				id: 'requisite-btn',
				text: this.#getButtonText(),
				noCaps: true,
				onclick: this.#handleButtonOnclick.bind(this),
				className: 'ui-btn ui-btn-light-border ui-btn-round ui-btn-xs ui-btn-no-caps intranet-setting__btn-light',
			});
			Dom.attr(this.#requisiteButton.getContainer(), 'data-testid', 'settings-widget-requisite-primary');
		}

		return this.#requisiteButton;
	}

	#handleButtonOnclick(): void
	{
		if (this.#isConnected)
		{
			this.#handleOpenRequisite();
		}
		else if (this.#companyId > 0)
		{
			if (this.#requisiteId > 0)
			{
				this.#handleCreateLanding();
			}
			else
			{
				this.#handleEditRequisite();
			}
		}
		else
		{
			this.#handleCreateCompany();
		}
	}

	#handleOpenRequisite(): void
	{
		this.#closeSettingsWidget();
		window.open(this.#publicUrl, '_blank');
	}

	#handleCreateLanding(): void
	{
		const requisiteButton = this.#getRequisiteButton();
		const shouldRestoreFocus = FocusNavigator.getActiveElement(this.getElement()) === requisiteButton.getContainer();
		requisiteButton.setWaiting(true);
		this.#createLanding().then(() => {
			this.#requisiteButton = null;
			this.#updateElement(shouldRestoreFocus);

			if (!this.#isPublic)
			{
				const message = Loc.getMessage('INTRANET_SETTINGS_WIDGET_CREATE_LANDING_ERROR');
				const errorPopup = new Popup('public-landing-error',
					this.getElement().querySelector('[data-role="requisite-widget-title"]'),
					{
						autoHide: true,
						closeByEsc: true,
						focusTrap: false,
						angle: true,
						darkMode: true,
						ariaLabel: message,
						content: message,
						events: {
							onShow: () => {
								setTimeout(() => {
									Event.bindOnce(this.#getSettingsPopup().getPopupContainer(), 'click', () => {
										errorPopup.close();
									});
								}, 0);
							},
							onClose: () => {
								errorPopup.destroy();
							},
						}
					}
				);
				Dom.attr(errorPopup.getPopupContainer(), 'data-testid', 'settings-widget-requisite-error');
				errorPopup.show();
				LiveAnnouncer.announce(message, 'assertive');
			}
		});
	}

	#createLanding()
	{
		return new Promise((resolve) => {
			ajax.runComponentAction('bitrix:intranet.settings.widget', 'createRequisiteLanding', { mode: 'class' })
				.then(({ data: { isConnected, isPublic, publicUrl, editUrl } }) => {
					this.#isConnected = isConnected;
					this.#isPublic = isPublic;
					this.#publicUrl = publicUrl;
					this.#editUrl = editUrl;
					resolve();
				})
			;
		});
	}

	#handleEditRequisite(): void
	{
		this.#closeSettingsWidget();
		BX.SidePanel.Instance.open(`/crm/company/details/${this.#companyId}/?init_mode=edit&rqedit=y`);
	}

	#handleCreateCompany(): void
	{
		this.#closeSettingsWidget();
		BX.SidePanel.Instance.open('/crm/company/details/0/?mycompany=y&rqedit=y');
	}

	#getRequisites()
	{
		return new Promise((resolve) => {
			ajax.runComponentAction('bitrix:intranet.settings.widget', 'getRequisites', { mode: 'class' })
				.then(({ data: { requisite } }) => {
					this.#updateOptions(requisite);
					resolve();
				})
		});
	}
}
