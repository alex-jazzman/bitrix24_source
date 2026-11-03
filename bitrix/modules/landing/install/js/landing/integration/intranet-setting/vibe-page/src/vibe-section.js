import { ajax as Ajax, Dom, Event, Loc, Runtime, Tag, Text, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu, Popup } from 'main.popup';
import { Button } from 'ui.buttons';
import { MessageBox } from 'ui.dialogs.messagebox';
import 'ui.icon.set';
import 'ui.hint';
import { Section, Row } from 'ui.section';
import { SettingsSection } from 'ui.form-elements.field';
import 'sidepanel';
import { A11y } from 'landing.ui.a11y';

export type VibeOptions = {
	title: string,
	pageTitle: string,
	moduleId: string,
	embedId: string,
	isMainVibe: boolean,
	icon: ?{
		set: string,
		code: string,
	},
	urlCreate: ?string,
	urlEdit: ?string,
	urlPublic: ?string,
	urlPartners: ?string,
	urlImport: ?string,
	urlExport: ?string,
	previewImg: ?string,
	isPageExists: ?boolean,
	isPublished: ?boolean,
	canEdit: ?boolean;
	canShowPublishButton: ?boolean;
	canShowWithdrawButton: ?boolean;
	canRedirectToVibeAfterEdit: ?boolean;
	limitCode: ?string;
	feedbackParams: ?{};
};

export class VibeSection extends EventEmitter
{
	static #iconDefaultSet = 'ui.icon-set.main';
	static #iconDefaultIcon = '--home';
	static #helpHintHideDelay = 300;

	#title: string;
	#pageTitle: ?string;
	#moduleId: string;
	#embedId: string;

	#previewImg: ?string;
	#isMainVibe: boolean;
	#icon: ?{
		set: string,
		code: string,
	} = null;

	#isPageExists: boolean;
	#isPublished: boolean;
	#canEdit: boolean;
	#canShowPublishButton: boolean;
	#canShowWithdrawButton: boolean;
	#canRedirectToVibeAfterEdit: boolean;
	#limitCode: string;

	#urlCreate: ?string;
	#urlEdit: ?string;
	#urlPublic: ?string;
	#urlPartners: ?string;
	#urlImport: ?string;
	#urlExport: ?string;

	#feedbackParams: ?{} = null;

	#buttonEdit: ?HTMLElement = null;
	#buttonPartners: ?HTMLElement = null;
	#buttonMarket: ?HTMLElement = null;
	#buttonWithdraw: ?HTMLElement = null;
	#buttonPublish: ?HTMLElement = null;
	#mainTemplate: ?HTMLElement = null;
	#secondaryTemplate: ?HTMLElement = null;

	#buttonMainSettings: ?HTMLElement = null;
	#buttonSecondarySettings: ?HTMLElement = null;

	#helpHintId: string;
	#lockReasonId: string;

	#helpHintPopup: ?Popup = null;
	#helpHintHideTimeout: ?number = null;
	#helpHintEscapeHandler: ?Function = null;

	#importPopup: ?Menu = null;
	#exportPopup: ?Menu = null;
	#popupShare: ?MessageBox = null;
	#popupWithdraw: ?MessageBox = null;

	// One status request at a time: two answers would tell the reader of two different statuses.
	#isStatusRequestPending: boolean = false;

	constructor(options: VibeOptions)
	{
		super();
		this.setEventNamespace('BX.Landing.Vibe.IntranetSettings');

		this.#title = options.title || '';
		this.#pageTitle = options.pageTitle || this.#title;
		this.#moduleId = options.moduleId || null;
		this.#embedId = options.embedId || null;
		this.#isMainVibe = options.isMainVibe ?? false;
		this.#previewImg = options.previewImg || null;
		this.#icon = Type.isObject(options.icon) ? options.icon : null;

		this.#canEdit = options.canEdit ?? false;
		this.#canShowPublishButton = options.canShowPublishButton ?? true;
		this.#canShowWithdrawButton = options.canShowWithdrawButton ?? true;
		this.#canRedirectToVibeAfterEdit = options.canRedirectToVibeAfterEdit ?? true;
		this.#limitCode = options.limitCode || 'limit_office_vibe';
		this.#isPageExists = options.isPageExists ?? false;
		this.#isPublished = options.isPublished ?? false;

		this.#urlCreate = options.urlCreate || null;
		this.#urlEdit = options.urlEdit || null;
		this.#urlPublic = options.urlPublic || null;
		this.#urlPartners = options.urlPartners || null;
		this.#urlImport = options.urlImport || null;
		this.#urlExport = options.urlExport || null;

		this.#feedbackParams = options.feedbackParams || null;

		// Stable DOM ids: the info block is rebuilt on every status change, its descriptions are not.
		this.#helpHintId = `landing-vibe-help-hint-${Text.getRandom()}`;
		this.#lockReasonId = `landing-vibe-lock-reason-${Text.getRandom()}`;
	}

	getType(): string
	{
		return 'welcome';
	}

	appendSections(contentNode: HTMLElement): void
	{
		const set = (this.#icon && this.#icon.set)
			? `ui.icon-set.${this.#icon.set}`
			: VibeSection.#iconDefaultSet
		;
		Runtime.loadExtension(set);
		const iconClass = (this.#icon && this.#icon.code) ?? VibeSection.#iconDefaultIcon;

		const section = new Section({
			// the header of the section shows the value as markup
			title: Text.encode(this.#title),
			titleIconClasses: `ui-icon-set ${iconClass}`,
			canCollapse: !this.#isMainVibe,

			// todo: bannerCode, isEnable
		});

		if (this.#isPageExists)
		{
			const pageSection = new SettingsSection({
				section,
			});

			pageSection.getSectionView().append(
				(new Row({
					content: this.#getSecondaryTemplate(),
				})).render(),
			);
		}

		const mainSection = new SettingsSection({
			section,
		});

		mainSection.getSectionView().append(
			(new Row({
				content: this.#getMainTemplate(),
			})).render(),
		);

		section.renderTo(contentNode);

		this.#bindButtonEvents();
		this.#bindSliderCloseEvent();
	}

	#getMainTemplate(): HTMLElement
	{
		if (!this.#mainTemplate)
		{
			this.#mainTemplate = Tag.render`
				<div class="intranet-settings__vibe-template" data-testid="vibe-settings-main-card">
					<div class="intranet-settings__vibe-icon-box">
						<div class="intranet-settings__vibe-icon"></div>
					</div>
					<div class="intranet-settings__vibe-content">
						<ul class="intranet-settings__vibe-list">
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_1')}
								</div>																																
							</li>
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_2')}
								</div>								
							</li>
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_3')}
								</div>
							</li>
						</ul>
						<div class="intranet-settings__vibe-button-box">
							${this.#getButtonCreate()}
							<div class="intranet-settings__vibe-button-box-right">
								${this.#getButtonPartners()}
								${this.#getButtonMainSettings()}
							</div>
							${this.#renderLockReason()}
						</div>
					</div>
				</div>
			`;
		}

		return this.#mainTemplate;
	}

	#getSecondaryTemplate(): HTMLElement
	{
		if (!this.#secondaryTemplate)
		{
			const previewImg = this.#previewImg
				? Tag.render`
					<img 
						src="${this.#previewImg}"
						class="intranet-settings__vibe-preview" 
						alt=""
						data-testid="vibe-settings-preview-img"
					/>
				`
				: ''
			;
			this.#secondaryTemplate = Tag.render`
				<div class="intranet-settings__vibe-template --secondary-template" data-testid="vibe-settings-secondary-card">
					<div class="intranet-settings__vibe-preview-box">
						${previewImg}
					</div>
					<div class="intranet-settings__vibe-content">
						<div class="intranet-settings__vibe-title">
							${Text.encode(this.#pageTitle ?? '')}
						</div>
						<div class="intranet-settings__vibe-info-template">
							${this.#isPublished ? this.getInfoSuccessTemplate() : this.getInfoTemplate()}
						</div>					
						<div class="intranet-settings__vibe-button-box">
							${this.#getButtonEdit()}
							<div class="intranet-settings__vibe-button-box-right">
								${this.#isPublished
									? (this.#canShowWithdrawButton ? this.#getButtonWithdraw() : null)
									: (this.#canShowPublishButton ? this.#getButtonPublish() : null)}
								${this.#getButtonSecondarySettings()}
							</div>
						</div>
					</div>
				</div>			
			`;
		}

		return this.#secondaryTemplate;
	}

	getInfoTemplate(): HTMLElement
	{
		this.infoTemplate = Tag.render`
			<div class="intranet-settings__vibe-info" data-testid="vibe-settings-status-block">
				<div class="intranet-settings__vibe-info-title">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_TITLE')}
				</div>
				<div class="intranet-settings__vibe-info-subtitle">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUBTITLE')}
					${this.#renderHelpHint(Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_WARNING'))}
				</div>
			</div>
		`;

		return this.infoTemplate;
	}

	getInfoSuccessTemplate(): HTMLElement
	{
		this.infoSuccessTemplate = Tag.render`
			<div class="intranet-settings__vibe-info --success" data-testid="vibe-settings-status-block">
				<div class="intranet-settings__vibe-info-title">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUCCESS_TITLE')}
				</div>
				<div class="intranet-settings__vibe-info-subtitle">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUCCESS_SUBTITLE')}
					${this.#renderHelpHint(Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_SUCCESS'))}
				</div>
			</div>
		`;

		return this.infoSuccessTemplate;
	}

	#renderHelpHint(text: string): HTMLElement[]
	{
		const button = Tag.render`
			<button
				type="button"
				class="ui-icon-set --help intranet-settings__vibe-info-help"
				aria-label="${Loc.getMessage('INTRANET_SETTINGS_VIBE_HELP_ARIA')}"
				aria-describedby="${this.#helpHintId}"
				data-testid="vibe-settings-help-btn"
			></button>
		`;

		Event.bind(button, 'mouseenter', () => {
			this.#showHelpHint(button, text);
		});
		Event.bind(button, 'focus', () => {
			this.#showHelpHint(button, text);
		});
		Event.bind(button, 'mouseleave', this.#hideHelpHintDelayed.bind(this));
		Event.bind(button, 'blur', this.#hideHelpHintDelayed.bind(this));

		return [
			button,
			Tag.render`
				<span class="intranet-settings__vibe-visually-hidden" id="${this.#helpHintId}">${text}</span>
			`,
		];
	}

	#showHelpHint(button: HTMLElement, text: string): void
	{
		clearTimeout(this.#helpHintHideTimeout);

		if (this.#helpHintPopup)
		{
			return;
		}

		this.#helpHintPopup = new Popup({
			angle: true,
			autoHide: true,
			className: 'ui-hint-popup',
			content: Tag.render`
				<div class="ui-hint-content" data-testid="vibe-settings-help-hint">
					${text}
				</div>
			`,
			cacheable: false,
			animation: 'fading-slide',
			bindElement: button,
			// the popup is a dialog unless it is told otherwise, and a hint holding no name is
			// met by the reader of the screen as a window with nothing in it
			role: 'tooltip',
			// A hint is read out of the description of the button and holds nothing to walk: a trap
			// would take the focus off the button, and the button reopens the hint when it gets it back.
			focusTrap: false,
			offsetTop: 0,
			offsetLeft: parseInt(button.offsetWidth / 2, 10),
			bindOptions: {
				position: 'top',
			},
			darkMode: true,
			events: {
				// the popup closes itself on a click outside as well
				onPopupDestroy: this.#hideHelpHint.bind(this),
			},
		});

		// the hint has to survive the cursor brought onto it
		const hintNode = this.#helpHintPopup.getPopupContainer();
		Event.bind(hintNode, 'mouseenter', () => {
			clearTimeout(this.#helpHintHideTimeout);
		});
		Event.bind(hintNode, 'mouseleave', this.#hideHelpHintDelayed.bind(this));

		// A hint opened by the cursor holds no focus, so the key is taken from the page while it is open.
		this.#helpHintEscapeHandler = this.#handleHelpHintEscape.bind(this);
		Event.bind(document, 'keydown', this.#helpHintEscapeHandler, true);

		this.#helpHintPopup.show();
	}

	#handleHelpHintEscape(event: KeyboardEvent): void
	{
		if (event.key !== 'Escape')
		{
			return;
		}

		// the card lives inside a slider: the key is taken only while the hint is open
		event.stopPropagation();
		this.#hideHelpHint();
	}

	#hideHelpHint(): void
	{
		clearTimeout(this.#helpHintHideTimeout);

		if (this.#helpHintEscapeHandler)
		{
			Event.unbind(document, 'keydown', this.#helpHintEscapeHandler, true);
			this.#helpHintEscapeHandler = null;
		}

		// the popup calls this back while it is destroyed: the field is let go before that
		const popup = this.#helpHintPopup;
		this.#helpHintPopup = null;
		popup?.destroy();
	}

	#hideHelpHintDelayed(): void
	{
		clearTimeout(this.#helpHintHideTimeout);
		this.#helpHintHideTimeout = setTimeout(this.#hideHelpHint.bind(this), VibeSection.#helpHintHideDelay);
	}

	// A focus left inside the closed menu belongs to the button it was opened from, a focus taken out of
	// it belongs to the user.
	#returnFocusFromMenu(menu: Menu, button: HTMLElement): void
	{
		const active = document.activeElement;
		const menuNode = menu.getMenuContainer();

		if (!Type.isDomNode(active) || !Type.isDomNode(menuNode) || !menuNode.contains(active))
		{
			return;
		}

		button.focus();
	}

	#getButtonMainSettings(): HTMLElement
	{
		if (!this.#buttonMainSettings)
		{
			this.#buttonMainSettings = Tag.render`
				<button
					type="button"
					class="intranet-settings-btn-settings"
					aria-label="${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_IMPORT_ARIA')}"
					aria-haspopup="menu"
					aria-expanded="false"
					data-testid="vibe-settings-main-more-btn"
				>
					<div class="ui-icon-set --more"></div>
				</button>
			`;
		}

		return this.#buttonMainSettings;
	}

	#getButtonSecondarySettings(): HTMLElement
	{
		if (!this.#buttonSecondarySettings)
		{
			this.#buttonSecondarySettings = Tag.render`
				<button
					type="button"
					class="intranet-settings-btn-settings"
					aria-label="${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EXPORT_ARIA')}"
					aria-haspopup="menu"
					aria-expanded="false"
					data-testid="vibe-settings-secondary-more-btn"
				>
					<div class="ui-icon-set --more"></div>
				</button>
			`;
		}

		return this.#buttonSecondarySettings;
	}

	#showImportPopup(): void
	{
		if (!this.#importPopup)
		{
			const htmlContent = this.#canEdit
				? Tag.render`<span>${Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP')}</span>`
				: Tag.render`
					<span class="intranet-settings-vibe-popup-item">
						${Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP')} ${this.renderLockElement()}
					</span>
				`
			;
			this.#importPopup = new Menu({
				angle: true,
				animation: 'fading-slide',
				bindElement: this.#buttonMainSettings,
				items: [
					{
						id: 'importPopup',
						html: htmlContent,
						attrs: this.#getMenuItemAttrs('vibe-settings-import-item'),
						onclick: this.#showImportSlider.bind(this),
					},
				],
				offsetLeft: 20,
				events: {
					onPopupClose: () => {
						Dom.attr(this.#buttonMainSettings, 'aria-expanded', 'false');
						this.#returnFocusFromMenu(this.#importPopup, this.#buttonMainSettings);
					},
					onPopupShow: () => {
						Dom.attr(this.#buttonMainSettings, 'aria-expanded', 'true');
					},
				},
			});
		}

		this.#importPopup?.show();
	}

	#showExportPopup(): void
	{
		if (!this.#exportPopup)
		{
			const htmlContent = this.#canEdit
				? Tag.render`<span>${Loc.getMessage('INTRANET_SETTINGS_VIBE_EXPORT_POPUP')}</span>`
				: Tag.render`
					<span class="intranet-settings-vibe-popup-item">
						${Loc.getMessage('INTRANET_SETTINGS_VIBE_EXPORT_POPUP')} ${this.renderLockElement()}
					</span>
				`
			;
			this.#exportPopup = new Menu({
				angle: true,
				animation: 'fading-slide',
				bindElement: this.#buttonSecondarySettings,
				items: [
					{
						id: 'exportPopup',
						html: htmlContent,
						attrs: this.#getMenuItemAttrs('vibe-settings-export-item'),
						onclick: this.#showExportSlider.bind(this),
					},
				],
				offsetLeft: 20,
				events: {
					onPopupClose: () => {
						Dom.attr(this.#buttonSecondarySettings, 'aria-expanded', 'false');
						this.#returnFocusFromMenu(this.#exportPopup, this.#buttonSecondarySettings);
					},
					onPopupShow: () => {
						Dom.attr(this.#buttonSecondarySettings, 'aria-expanded', 'true');
					},
				},
			});
		}

		this.#exportPopup?.show();
	}

	#showImportSlider()
	{
		if (!this.#canEdit)
		{
			BX.UI.InfoHelper.show(this.#limitCode);

			return;
		}

		if (
			Type.isUndefined(BX.SidePanel)
			|| !this.#urlImport
		)
		{
			return;
		}

		const onOK = () => {
			BX.SidePanel.Instance.open(
				this.#urlImport,
				{
					width: 491,
					allowChangeHistory: false,
					cacheable: false,
					data: {
						rightBoundary: 0,
					},
				},
			);
		};

		if (!this.#isPageExists)
		{
			onOK();

			return;
		}

		BX.Runtime.loadExtension('ui.dialogs.messagebox').then(() => {
			const messageBox = new BX.UI.Dialogs.MessageBox({
				message: Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_MESSAGE'),
				title: Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_TITLE'),
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
				okCaption: Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_OK_BUTTON'),
				cancelCaption: Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_CANCEL_BUTTON'),
				useAirDesign: true,
				onOk: () => {
					onOK();

					return true;
				},
				onCancel: () => {
					return true;
				},
			});
			messageBox.show();
			if (messageBox.popupWindow && messageBox.popupWindow.popupContainer)
			{
				messageBox.popupWindow.popupContainer.classList.add('intranet-settings__vibe-popup');
			}
		});
	}

	#showExportSlider()
	{
		if (!this.#canEdit)
		{
			BX.UI.InfoHelper.show(this.#limitCode);

			return;
		}

		if (
			Type.isUndefined(BX.SidePanel)
			|| !this.#urlExport
		)
		{
			return;
		}

		BX.SidePanel.Instance.open(
			this.#urlExport,
			{
				width: 491,
				allowChangeHistory: false,
				cacheable: false,
				data: {
					rightBoundary: 0,
				},
			},
		);
	}

	/**
	 * Tells whether the button that opened the confirmation dialog is the one to hand the focus to.
	 *
	 * The dialog holds the focus while the request runs and gives it back to the button it was opened
	 * from, so a focus inside the dialog belongs to that button as well.
	 */
	#holdsFocus(trigger: HTMLElement, dialog: MessageBox): boolean
	{
		const active = document.activeElement;
		if (!Type.isDomNode(active))
		{
			return false;
		}

		if (active === trigger)
		{
			return true;
		}

		const dialogNode = dialog.getPopupWindow().getPopupContainer();

		return Type.isDomNode(dialogNode) && dialogNode.contains(active);
	}

	/**
	 * Tells of a refusal of the server through two channels at once.
	 *
	 * The dialog is what a sighted user gets: the block has already returned to the status the server
	 * has kept, and nothing else on the screen tells why. The announcement reaches a reader of the
	 * screen on its own and holds even when the dialog fails to open.
	 */
	#showStatusError(): void
	{
		// the wording differs from the one of the dialog: the two are heard one after the other
		A11y.announce(Loc.getMessage('INTRANET_SETTINGS_VIBE_STATUS_ERROR_ANNOUNCE'), 'assertive');

		const errorBox = new MessageBox({
			message: Loc.getMessage('INTRANET_SETTINGS_VIBE_STATUS_ERROR'),
			minWidth: 350,
			maxWidth: 420,
			useAirDesign: true,
			popupOptions: {
				closeIcon: true,
				closeByEsc: true,
				animation: 'fading-slide',
			},
			buttons: [
				new Button({
					text: Loc.getMessage('INTRANET_SETTINGS_VIBE_STATUS_ERROR_BTN_CLOSE'),
					color: Button.Color.PRIMARY,
					useAirDesign: true,
					dataset: { testid: 'vibe-settings-status-error-close-btn' },
					onclick: () => {
						errorBox.close();
					},
				}),
			],
		});

		errorBox.show();
	}

	/**
	 * Asks the server of a status change and tells the card of the outcome.
	 *
	 * The card holds the change of one request at a time, and the mark of that is taken off by
	 * whichever outcome comes first. A request that breaks on its way out is an outcome as well:
	 * no answer is coming after it, and a mark left on would lock the card until the page is reloaded.
	 */
	#requestStatusChange(action: string, carriedOut: () => void, refused: () => void): void
	{
		this.#isStatusRequestPending = true;

		try
		{
			Ajax.runAction(action, {
				data: {
					moduleId: this.#moduleId,
					embedId: this.#embedId,
				},
			}).then(carriedOut, refused);
		}
		catch
		{
			refused();
		}
	}

	#showSharePopup(): void
	{
		if (this.#isStatusRequestPending)
		{
			return;
		}

		if (this.#popupShare)
		{
			this.#popupShare?.show();
		}
		else
		{
			this.#popupShare = new MessageBox({
				title: Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_TITLE_MSGVER_1'),
				message: Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_CONTENT'),
				minWidth: 350,
				maxWidth: 420,
				useAirDesign: true,
				popupOptions: {
					closeIcon: true,
					closeByEsc: true,
					animation: 'fading-slide',
				},
				buttons: [
					new Button({
						text: Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_BTN_CONFIRM'),
						color: Button.Color.PRIMARY,
						useAirDesign: true,
						dataset: { testid: 'vibe-settings-publish-confirm-btn' },
						onclick: () => {
							// the dialog is reachable while it fades away, the request is already on its way
							if (this.#isStatusRequestPending)
							{
								return;
							}

							const newTemplate = this.getInfoSuccessTemplate();
							const wrapper = this.#secondaryTemplate.querySelector(
								'.intranet-settings__vibe-info-template',
							);
							const innerWrapper = wrapper.querySelector('.intranet-settings__vibe-info:not(.--success)');

							// the hint belongs to the button that leaves the document with the block
							this.#hideHelpHint();
							Dom.replace(innerWrapper, newTemplate);

							// asked before the request: the button is gone by the time the answer comes
							const wasFocusedOnTrigger = this.#holdsFocus(this.#getButtonPublish(), this.#popupShare);

							const publishCarriedOut = () => {
								this.#isStatusRequestPending = false;
								this.#sendAnalytic({ event: 'publish_page' });
								this.emit('publish');
								if (this.#urlPublic)
								{
									this.#isPublished = true;
								}

								// the answer of the server tells the status, not the block redrawn before it
								A11y.announce(Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_PUBLISHED'), 'polite');

								if (wasFocusedOnTrigger)
								{
									// the settings may leave the trigger alone, then nothing takes its place
									const nextButton = this.#canShowWithdrawButton
										? this.#getButtonWithdraw()
										: this.#getButtonSecondarySettings()
									;
									nextButton.focus();
								}
							};

							const publishRefused = () => {
								this.#isStatusRequestPending = false;
								this.#sendAnalytic({ event: 'publish_page', status: 'error' });
								this.#hideHelpHint();
								Dom.replace(newTemplate, this.getInfoTemplate());

								if (wasFocusedOnTrigger)
								{
									this.#getButtonPublish().focus();
								}

								// the button takes the focus back before the dialog of the
								// refusal borrows it and gives it back on its own close
								this.#showStatusError();
							};

							// the confirmation leaves the screen before the request, so that a refusal
							// given at once is not covered by a dialog still closing over it
							this.#popupShare.close();

							this.#requestStatusChange('landing.vibe.publish', publishCarriedOut, publishRefused);
						},
					}),
					new Button({
						text: Loc.getMessage('INTRANET_SETTINGS_VIBE_POPUP_BTN_CANCEL'),
						color: Button.Color.LIGHT_BORDER,
						useAirDesign: true,
						style: Button.AirStyle.OUTLINE,
						dataset: { testid: 'vibe-settings-publish-cancel-btn' },
						onclick: () => {
							this.#popupShare.close();
						},
					}),
				],
			});

			this.#popupShare?.show();
		}
	}

	#showWithdrawPopup(): void
	{
		if (this.#isStatusRequestPending)
		{
			return;
		}

		if (this.#popupWithdraw)
		{
			this.#popupWithdraw?.show();
		}
		else
		{
			const title = this.#canEdit
				? Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_TITLE')
				: Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_TITLE_FREE')
			;
			const content = this.#canEdit
				? Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_CONTENT')
				: Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_CONTENT_FREE')
			;
			const okText = this.#canEdit
				? Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_BTN_CONFIRM')
				: Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_BTN_CONFIRM_FREE')
			;

			this.#popupWithdraw = new MessageBox({
				title,
				message: content,
				minWidth: 350,
				maxWidth: 420,
				useAirDesign: true,
				popupOptions: {
					closeIcon: true,
					closeByEsc: true,
					animation: 'fading-slide',
				},
				buttons: [
					new Button({
						text: okText,
						useAirDesign: true,
						style: Button.AirStyle.FILLED_ALERT,
						dataset: { testid: 'vibe-settings-withdraw-confirm-btn' },
						onclick: () => {
							// the dialog is reachable while it fades away, the request is already on its way
							if (this.#isStatusRequestPending)
							{
								return;
							}

							const newTemplate = this.getInfoTemplate();
							const wrapper = this.#secondaryTemplate.querySelector(
								'.intranet-settings__vibe-info-template',
							);
							const innerWrapper = wrapper.querySelector('.intranet-settings__vibe-info');

							// the hint belongs to the button that leaves the document with the block
							this.#hideHelpHint();
							Dom.replace(innerWrapper, newTemplate);

							// asked before the request: the button is gone by the time the answer comes
							const wasFocusedOnTrigger = this.#holdsFocus(this.#getButtonWithdraw(), this.#popupWithdraw);

							const withdrawCarriedOut = () => {
								this.#isStatusRequestPending = false;
								this.#sendAnalytic({ event: 'unpublish_page' });
								this.emit('withdraw');
								this.#isPublished = false;

								// the answer of the server tells the status, not the block redrawn before it
								A11y.announce(Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_WITHDRAWN'), 'polite');

								if (wasFocusedOnTrigger)
								{
									// the settings may leave the trigger alone, then nothing takes its place
									const nextButton = this.#canShowPublishButton
										? this.#getButtonPublish()
										: this.#getButtonSecondarySettings()
									;
									nextButton.focus();
								}
							};

							const withdrawRefused = () => {
								this.#isStatusRequestPending = false;
								this.#sendAnalytic({ event: 'unpublish_page', status: 'error' });
								this.#hideHelpHint();
								Dom.replace(newTemplate, this.getInfoSuccessTemplate());

								if (wasFocusedOnTrigger)
								{
									this.#getButtonWithdraw().focus();
								}

								// the button takes the focus back before the dialog of the
								// refusal borrows it and gives it back on its own close
								this.#showStatusError();
							};

							// the confirmation leaves the screen before the request, so that a refusal
							// given at once is not covered by a dialog still closing over it
							this.#popupWithdraw.close();

							this.#requestStatusChange('landing.vibe.withdraw', withdrawCarriedOut, withdrawRefused);
						},
					}),
					new Button({
						text: Loc.getMessage('INTRANET_SETTINGS_VIBE_POPUP_BTN_CANCEL'),
						color: Button.Color.LIGHT_BORDER,
						useAirDesign: true,
						style: Button.AirStyle.OUTLINE,
						dataset: { testid: 'vibe-settings-withdraw-cancel-btn' },
						onclick: () => {
							this.#popupWithdraw.close();
						},
					}),
				],
			});

			this.#popupWithdraw?.show();
		}
	}

	#getButtonEdit(): ?HTMLElement
	{
		if (!this.#urlEdit)
		{
			return null;
		}

		if (!this.#buttonEdit)
		{
			const buttonEdit = Tag.render`
			
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-blue"
						data-testid="vibe-settings-edit-btn">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EDIT')}
				</button>
			`;
			const buttonEditLock = Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-blue --disabled"
						aria-describedby="${this.#lockReasonId}" data-testid="vibe-settings-edit-btn">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EDIT')}
					${this.renderLockElement()}
				</button>
			`;
			this.#buttonEdit = this.#canEdit ? buttonEdit : buttonEditLock;
		}

		return this.#buttonEdit;
	}

	#getButtonPublish(): HTMLElement
	{
		if (!this.#buttonPublish)
		{
			const renderNode = Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}" data-testid="vibe-settings-publish-btn">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PUBLIC')}
				</button>
			`;
			const renderNodeLock = Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --disabled
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}"
						aria-describedby="${this.#lockReasonId}" data-testid="vibe-settings-publish-btn">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PUBLIC')}
					${this.renderLockElement()}
				</button>
			`;
			this.#buttonPublish = this.#canEdit ? renderNode : renderNodeLock;
		}

		return this.#buttonPublish;
	}

	#getButtonWithdraw(): HTMLElement
	{
		if (!this.#buttonWithdraw)
		{
			this.#buttonWithdraw = Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}" data-testid="vibe-settings-withdraw-btn">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_UNPUBLIC')}
				</button>
			`;
		}

		return this.#buttonWithdraw;
	}

	#getButtonPartners(): ?HTMLElement
	{
		if (!this.#feedbackParams)
		{
			return null;
		}

		if (!this.#buttonPartners)
		{
			this.#buttonPartners = Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-gray"
						data-testid="vibe-settings-partners-btn">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PARTNERS')}
				</button>
			`;
		}

		return this.#buttonPartners;
	}

	#getButtonCreate(): ?HTMLElement
	{
		if (!this.#urlCreate)
		{
			return null;
		}

		if (!this.#buttonMarket)
		{
			const buttonColor = this.#isPageExists ? '--light-blue' : 'ui-btn-primary';
			const renderNode = Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps ${buttonColor}"
						data-testid="vibe-settings-template-btn">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_MARKET')}
				</button>
			`;
			const renderNodeLock = Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps ${buttonColor} --disabled"
						aria-describedby="${this.#lockReasonId}" data-testid="vibe-settings-template-btn">
					${Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_MARKET')}
					${this.renderLockElement()}
				</button>
			`;

			this.#buttonMarket = this.#canEdit ? renderNode : renderNodeLock;
		}

		return this.#buttonMarket;
	}

	#bindButtonEvents()
	{
		if (Type.isUndefined(BX.SidePanel))
		{
			return;
		}

		Event.bind(this.#getButtonMainSettings(), 'click', this.#showImportPopup.bind(this));
		Event.bind(this.#getButtonSecondarySettings(), 'click', this.#showExportPopup.bind(this));

		if (this.#getButtonCreate())
		{
			Event.bind(this.#getButtonCreate(), 'click', () => {
				if (this.#canEdit)
				{
					BX.SidePanel.Instance.open(this.#urlCreate);
				}
				else
				{
					BX.UI.InfoHelper.show(this.#limitCode);
				}

				this.#sendAnalytic({
					event: 'open_market',
					status: this.#canEdit ? 'success' : 'error_limit',
					p2: this.#getAnalyticContextParam(),
				});
			});
		}

		if (this.#getButtonEdit())
		{
			Event.bind(this.#getButtonEdit(), 'click', () => {
				if (this.#canEdit)
				{
					BX.SidePanel.Instance.open(
						this.#urlEdit,
						{
							customLeftBoundary: 66,
							events: {
								onCloseComplete: () => {
									if (this.#canRedirectToVibeAfterEdit && this.#urlPublic)
									{
										window.top.location = this.#urlPublic;
									}
								},
							},
						},
					);
				}
				else
				{
					BX.UI.InfoHelper.show(this.#limitCode);
				}
				this.#sendAnalytic({
					event: 'open_editor',
					status: this.#canEdit ? 'success' : 'error_limit',
				});
			});
		}

		if (this.#getButtonPartners())
		{
			Event.bind(this.#getButtonPartners(), 'click', () => {
				// todo: need analitycs?

				Runtime.loadExtension('ui.feedback.form').then(() => {
					this.#feedbackParams.title = Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PARTNERS');
					BX.UI.Feedback.Form.open(this.#feedbackParams);
				});
			});
		}

		this.subscribe('publish', () => {
			if (this.#canShowWithdrawButton)
			{
				Dom.replace(this.#getButtonPublish(), this.#getButtonWithdraw());
			}
			else
			{
				Dom.remove(this.#getButtonPublish());
			}
		});
		this.subscribe('withdraw', () => {
			if (this.#canShowPublishButton)
			{
				Dom.replace(this.#getButtonWithdraw(), this.#getButtonPublish());
			}
			else
			{
				Dom.remove(this.#getButtonWithdraw());
			}
		});
		if (this.#canShowPublishButton)
		{
			Event.bind(this.#getButtonPublish(), 'click', () => {
				if (!this.#canEdit)
				{
					BX.UI.InfoHelper.show(this.#limitCode);
					this.#sendAnalytic({
						event: 'publish_page',
						status: 'error_limit',
					});

					return;
				}

				this.#showSharePopup();
			});
		}

		if (this.#canShowWithdrawButton)
		{
			Event.bind(this.#getButtonWithdraw(), 'click', this.#showWithdrawPopup.bind(this));
		}
	}

	#bindSliderCloseEvent()
	{
		if (!this.#canRedirectToVibeAfterEdit)
		{
			return;
		}

		const isPublishedBefore = this.#isPublished;

		EventEmitter.subscribe(
			EventEmitter.GLOBAL_TARGET,
			'SidePanel.Slider:onClose',
			() => {
				if (this.#isPublished !== isPublishedBefore)
				{
					const location = this.#isPublished
						? this.#urlPublic
						: '/'
					;
					window.top.location = location;
				}
			},
		);
	}

	renderLockElement(): HTMLElement
	{
		return Tag.render`<span class="intranet-settings-mp-icon ui-icon-set --lock" aria-hidden="true"></span>`;
	}

	// The menu gives the role of an item to a node of its own and puts these attributes on it.
	#getMenuItemAttrs(testId: string): { [key: string]: string }
	{
		if (this.#canEdit)
		{
			return { 'data-testid': testId };
		}

		return {
			'data-testid': testId,
			'aria-describedby': this.#lockReasonId,
		};
	}

	// One reason for every locked control of the card: it lives in the main template, the only one
	// always present in the markup.
	#renderLockReason(): HTMLElement | string
	{
		if (this.#canEdit)
		{
			return '';
		}

		return Tag.render`
			<span
				class="intranet-settings__vibe-visually-hidden"
				id="${this.#lockReasonId}"
			>${Loc.getMessage('INTRANET_SETTINGS_VIBE_LOCK_REASON')}</span>
		`;
	}

	#getAnalyticContextParam(): []
	{
		return ['chapter', `${this.#moduleId}-${this.#embedId}`];
	}

	#sendAnalytic(data: Object): void
	{
		this.emit('sendAnalytic', data);
	}
}
