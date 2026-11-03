/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Integration = this.BX.Landing.Integration || {};
(function (exports, main_core_events, main_core, sidepanel, ui_formElements_field, ui_icon_set, landing_metrika, main_popup, ui_buttons, ui_dialogs_messagebox, ui_hint, ui_section, landing_ui_a11y) {
	'use strict';

	class VibeSection extends main_core_events.EventEmitter {
		static #iconDefaultSet = 'ui.icon-set.main';
		static #iconDefaultIcon = '--home';
		static #helpHintHideDelay = 300;
		#title;
		#pageTitle;
		#moduleId;
		#embedId;
		#previewImg;
		#isMainVibe;
		#icon = null;
		#isPageExists;
		#isPublished;
		#canEdit;
		#canShowPublishButton;
		#canShowWithdrawButton;
		#canRedirectToVibeAfterEdit;
		#limitCode;
		#urlCreate;
		#urlEdit;
		#urlPublic;
		#urlPartners;
		#urlImport;
		#urlExport;
		#feedbackParams = null;
		#buttonEdit = null;
		#buttonPartners = null;
		#buttonMarket = null;
		#buttonWithdraw = null;
		#buttonPublish = null;
		#mainTemplate = null;
		#secondaryTemplate = null;
		#buttonMainSettings = null;
		#buttonSecondarySettings = null;
		#helpHintId;
		#lockReasonId;
		#helpHintPopup = null;
		#helpHintHideTimeout = null;
		#helpHintEscapeHandler = null;
		#importPopup = null;
		#exportPopup = null;
		#popupShare = null;
		#popupWithdraw = null;

		// One status request at a time: two answers would tell the reader of two different statuses.
		#isStatusRequestPending = false;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Landing.Vibe.IntranetSettings');
			this.#title = options.title || '';
			this.#pageTitle = options.pageTitle || this.#title;
			this.#moduleId = options.moduleId || null;
			this.#embedId = options.embedId || null;
			this.#isMainVibe = options.isMainVibe ?? false;
			this.#previewImg = options.previewImg || null;
			this.#icon = main_core.Type.isObject(options.icon) ? options.icon : null;
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
			this.#helpHintId = `landing-vibe-help-hint-${main_core.Text.getRandom()}`;
			this.#lockReasonId = `landing-vibe-lock-reason-${main_core.Text.getRandom()}`;
		}
		getType() {
			return 'welcome';
		}
		appendSections(contentNode) {
			const set = this.#icon && this.#icon.set ? `ui.icon-set.${this.#icon.set}` : VibeSection.#iconDefaultSet;
			main_core.Runtime.loadExtension(set);
			const iconClass = (this.#icon && this.#icon.code) ?? VibeSection.#iconDefaultIcon;
			const section = new ui_section.Section({
				// the header of the section shows the value as markup
				title: main_core.Text.encode(this.#title),
				titleIconClasses: `ui-icon-set ${iconClass}`,
				canCollapse: !this.#isMainVibe

				// todo: bannerCode, isEnable
			});
			if (this.#isPageExists) {
				const pageSection = new ui_formElements_field.SettingsSection({
					section
				});
				pageSection.getSectionView().append(new ui_section.Row({
					content: this.#getSecondaryTemplate()
				}).render());
			}
			const mainSection = new ui_formElements_field.SettingsSection({
				section
			});
			mainSection.getSectionView().append(new ui_section.Row({
				content: this.#getMainTemplate()
			}).render());
			section.renderTo(contentNode);
			this.#bindButtonEvents();
			this.#bindSliderCloseEvent();
		}
		#getMainTemplate() {
			if (!this.#mainTemplate) {
				this.#mainTemplate = main_core.Tag.render`
				<div class="intranet-settings__vibe-template" data-testid="vibe-settings-main-card">
					<div class="intranet-settings__vibe-icon-box">
						<div class="intranet-settings__vibe-icon"></div>
					</div>
					<div class="intranet-settings__vibe-content">
						<ul class="intranet-settings__vibe-list">
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_1')}
								</div>																																
							</li>
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_2')}
								</div>								
							</li>
							<li class="intranet-settings__vibe-list-item">
								<div class="ui-icon-set --check intranet-settings__vibe-list-icon"></div>
								<div class="intranet-settings__vibe-list-name">
									${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_LIST_ITEM_3')}
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
		#getSecondaryTemplate() {
			if (!this.#secondaryTemplate) {
				const previewImg = this.#previewImg ? main_core.Tag.render`
					<img 
						src="${this.#previewImg}"
						class="intranet-settings__vibe-preview" 
						alt=""
						data-testid="vibe-settings-preview-img"
					/>
				` : '';
				this.#secondaryTemplate = main_core.Tag.render`
				<div class="intranet-settings__vibe-template --secondary-template" data-testid="vibe-settings-secondary-card">
					<div class="intranet-settings__vibe-preview-box">
						${previewImg}
					</div>
					<div class="intranet-settings__vibe-content">
						<div class="intranet-settings__vibe-title">
							${main_core.Text.encode(this.#pageTitle ?? '')}
						</div>
						<div class="intranet-settings__vibe-info-template">
							${this.#isPublished ? this.getInfoSuccessTemplate() : this.getInfoTemplate()}
						</div>					
						<div class="intranet-settings__vibe-button-box">
							${this.#getButtonEdit()}
							<div class="intranet-settings__vibe-button-box-right">
								${this.#isPublished ? this.#canShowWithdrawButton ? this.#getButtonWithdraw() : null : this.#canShowPublishButton ? this.#getButtonPublish() : null}
								${this.#getButtonSecondarySettings()}
							</div>
						</div>
					</div>
				</div>			
			`;
			}
			return this.#secondaryTemplate;
		}
		getInfoTemplate() {
			this.infoTemplate = main_core.Tag.render`
			<div class="intranet-settings__vibe-info" data-testid="vibe-settings-status-block">
				<div class="intranet-settings__vibe-info-title">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_TITLE')}
				</div>
				<div class="intranet-settings__vibe-info-subtitle">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUBTITLE')}
					${this.#renderHelpHint(main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_WARNING'))}
				</div>
			</div>
		`;
			return this.infoTemplate;
		}
		getInfoSuccessTemplate() {
			this.infoSuccessTemplate = main_core.Tag.render`
			<div class="intranet-settings__vibe-info --success" data-testid="vibe-settings-status-block">
				<div class="intranet-settings__vibe-info-title">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUCCESS_TITLE')}
				</div>
				<div class="intranet-settings__vibe-info-subtitle">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUCCESS_SUBTITLE')}
					${this.#renderHelpHint(main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_SUCCESS'))}
				</div>
			</div>
		`;
			return this.infoSuccessTemplate;
		}
		#renderHelpHint(text) {
			const button = main_core.Tag.render`
			<button
				type="button"
				class="ui-icon-set --help intranet-settings__vibe-info-help"
				aria-label="${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_HELP_ARIA')}"
				aria-describedby="${this.#helpHintId}"
				data-testid="vibe-settings-help-btn"
			></button>
		`;
			main_core.Event.bind(button, 'mouseenter', () => {
				this.#showHelpHint(button, text);
			});
			main_core.Event.bind(button, 'focus', () => {
				this.#showHelpHint(button, text);
			});
			main_core.Event.bind(button, 'mouseleave', this.#hideHelpHintDelayed.bind(this));
			main_core.Event.bind(button, 'blur', this.#hideHelpHintDelayed.bind(this));
			return [button, main_core.Tag.render`
				<span class="intranet-settings__vibe-visually-hidden" id="${this.#helpHintId}">${text}</span>
			`];
		}
		#showHelpHint(button, text) {
			clearTimeout(this.#helpHintHideTimeout);
			if (this.#helpHintPopup) {
				return;
			}
			this.#helpHintPopup = new main_popup.Popup({
				angle: true,
				autoHide: true,
				className: 'ui-hint-popup',
				content: main_core.Tag.render`
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
					position: 'top'
				},
				darkMode: true,
				events: {
					// the popup closes itself on a click outside as well
					onPopupDestroy: this.#hideHelpHint.bind(this)
				}
			});

			// the hint has to survive the cursor brought onto it
			const hintNode = this.#helpHintPopup.getPopupContainer();
			main_core.Event.bind(hintNode, 'mouseenter', () => {
				clearTimeout(this.#helpHintHideTimeout);
			});
			main_core.Event.bind(hintNode, 'mouseleave', this.#hideHelpHintDelayed.bind(this));

			// A hint opened by the cursor holds no focus, so the key is taken from the page while it is open.
			this.#helpHintEscapeHandler = this.#handleHelpHintEscape.bind(this);
			main_core.Event.bind(document, 'keydown', this.#helpHintEscapeHandler, true);
			this.#helpHintPopup.show();
		}
		#handleHelpHintEscape(event) {
			if (event.key !== 'Escape') {
				return;
			}

			// the card lives inside a slider: the key is taken only while the hint is open
			event.stopPropagation();
			this.#hideHelpHint();
		}
		#hideHelpHint() {
			clearTimeout(this.#helpHintHideTimeout);
			if (this.#helpHintEscapeHandler) {
				main_core.Event.unbind(document, 'keydown', this.#helpHintEscapeHandler, true);
				this.#helpHintEscapeHandler = null;
			}

			// the popup calls this back while it is destroyed: the field is let go before that
			const popup = this.#helpHintPopup;
			this.#helpHintPopup = null;
			popup?.destroy();
		}
		#hideHelpHintDelayed() {
			clearTimeout(this.#helpHintHideTimeout);
			this.#helpHintHideTimeout = setTimeout(this.#hideHelpHint.bind(this), VibeSection.#helpHintHideDelay);
		}

		// A focus left inside the closed menu belongs to the button it was opened from, a focus taken out of
		// it belongs to the user.
		#returnFocusFromMenu(menu, button) {
			const active = document.activeElement;
			const menuNode = menu.getMenuContainer();
			if (!main_core.Type.isDomNode(active) || !main_core.Type.isDomNode(menuNode) || !menuNode.contains(active)) {
				return;
			}
			button.focus();
		}
		#getButtonMainSettings() {
			if (!this.#buttonMainSettings) {
				this.#buttonMainSettings = main_core.Tag.render`
				<button
					type="button"
					class="intranet-settings-btn-settings"
					aria-label="${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_IMPORT_ARIA')}"
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
		#getButtonSecondarySettings() {
			if (!this.#buttonSecondarySettings) {
				this.#buttonSecondarySettings = main_core.Tag.render`
				<button
					type="button"
					class="intranet-settings-btn-settings"
					aria-label="${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EXPORT_ARIA')}"
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
		#showImportPopup() {
			if (!this.#importPopup) {
				const htmlContent = this.#canEdit ? main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP')}</span>` : main_core.Tag.render`
					<span class="intranet-settings-vibe-popup-item">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP')} ${this.renderLockElement()}
					</span>
				`;
				this.#importPopup = new main_popup.Menu({
					angle: true,
					animation: 'fading-slide',
					bindElement: this.#buttonMainSettings,
					items: [{
						id: 'importPopup',
						html: htmlContent,
						attrs: this.#getMenuItemAttrs('vibe-settings-import-item'),
						onclick: this.#showImportSlider.bind(this)
					}],
					offsetLeft: 20,
					events: {
						onPopupClose: () => {
							main_core.Dom.attr(this.#buttonMainSettings, 'aria-expanded', 'false');
							this.#returnFocusFromMenu(this.#importPopup, this.#buttonMainSettings);
						},
						onPopupShow: () => {
							main_core.Dom.attr(this.#buttonMainSettings, 'aria-expanded', 'true');
						}
					}
				});
			}
			this.#importPopup?.show();
		}
		#showExportPopup() {
			if (!this.#exportPopup) {
				const htmlContent = this.#canEdit ? main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_EXPORT_POPUP')}</span>` : main_core.Tag.render`
					<span class="intranet-settings-vibe-popup-item">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_EXPORT_POPUP')} ${this.renderLockElement()}
					</span>
				`;
				this.#exportPopup = new main_popup.Menu({
					angle: true,
					animation: 'fading-slide',
					bindElement: this.#buttonSecondarySettings,
					items: [{
						id: 'exportPopup',
						html: htmlContent,
						attrs: this.#getMenuItemAttrs('vibe-settings-export-item'),
						onclick: this.#showExportSlider.bind(this)
					}],
					offsetLeft: 20,
					events: {
						onPopupClose: () => {
							main_core.Dom.attr(this.#buttonSecondarySettings, 'aria-expanded', 'false');
							this.#returnFocusFromMenu(this.#exportPopup, this.#buttonSecondarySettings);
						},
						onPopupShow: () => {
							main_core.Dom.attr(this.#buttonSecondarySettings, 'aria-expanded', 'true');
						}
					}
				});
			}
			this.#exportPopup?.show();
		}
		#showImportSlider() {
			if (!this.#canEdit) {
				BX.UI.InfoHelper.show(this.#limitCode);
				return;
			}
			if (main_core.Type.isUndefined(BX.SidePanel) || !this.#urlImport) {
				return;
			}
			const onOK = () => {
				BX.SidePanel.Instance.open(this.#urlImport, {
					width: 491,
					allowChangeHistory: false,
					cacheable: false,
					data: {
						rightBoundary: 0
					}
				});
			};
			if (!this.#isPageExists) {
				onOK();
				return;
			}
			BX.Runtime.loadExtension('ui.dialogs.messagebox').then(() => {
				const messageBox = new BX.UI.Dialogs.MessageBox({
					message: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_MESSAGE'),
					title: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_TITLE'),
					buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
					okCaption: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_OK_BUTTON'),
					cancelCaption: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_IMPORT_POPUP_MESSAGEBOX_CANCEL_BUTTON'),
					useAirDesign: true,
					onOk: () => {
						onOK();
						return true;
					},
					onCancel: () => {
						return true;
					}
				});
				messageBox.show();
				if (messageBox.popupWindow && messageBox.popupWindow.popupContainer) {
					messageBox.popupWindow.popupContainer.classList.add('intranet-settings__vibe-popup');
				}
			});
		}
		#showExportSlider() {
			if (!this.#canEdit) {
				BX.UI.InfoHelper.show(this.#limitCode);
				return;
			}
			if (main_core.Type.isUndefined(BX.SidePanel) || !this.#urlExport) {
				return;
			}
			BX.SidePanel.Instance.open(this.#urlExport, {
				width: 491,
				allowChangeHistory: false,
				cacheable: false,
				data: {
					rightBoundary: 0
				}
			});
		}

		/**
		 * Tells whether the button that opened the confirmation dialog is the one to hand the focus to.
		 *
		 * The dialog holds the focus while the request runs and gives it back to the button it was opened
		 * from, so a focus inside the dialog belongs to that button as well.
		 */
		#holdsFocus(trigger, dialog) {
			const active = document.activeElement;
			if (!main_core.Type.isDomNode(active)) {
				return false;
			}
			if (active === trigger) {
				return true;
			}
			const dialogNode = dialog.getPopupWindow().getPopupContainer();
			return main_core.Type.isDomNode(dialogNode) && dialogNode.contains(active);
		}

		/**
		 * Tells of a refusal of the server through two channels at once.
		 *
		 * The dialog is what a sighted user gets: the block has already returned to the status the server
		 * has kept, and nothing else on the screen tells why. The announcement reaches a reader of the
		 * screen on its own and holds even when the dialog fails to open.
		 */
		#showStatusError() {
			// the wording differs from the one of the dialog: the two are heard one after the other
			landing_ui_a11y.A11y.announce(main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_STATUS_ERROR_ANNOUNCE'), 'assertive');
			const errorBox = new ui_dialogs_messagebox.MessageBox({
				message: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_STATUS_ERROR'),
				minWidth: 350,
				maxWidth: 420,
				useAirDesign: true,
				popupOptions: {
					closeIcon: true,
					closeByEsc: true,
					animation: 'fading-slide'
				},
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_STATUS_ERROR_BTN_CLOSE'),
					color: ui_buttons.Button.Color.PRIMARY,
					useAirDesign: true,
					dataset: {
						testid: 'vibe-settings-status-error-close-btn'
					},
					onclick: () => {
						errorBox.close();
					}
				})]
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
		#requestStatusChange(action, carriedOut, refused) {
			this.#isStatusRequestPending = true;
			try {
				main_core.ajax.runAction(action, {
					data: {
						moduleId: this.#moduleId,
						embedId: this.#embedId
					}
				}).then(carriedOut, refused);
			} catch {
				refused();
			}
		}
		#showSharePopup() {
			if (this.#isStatusRequestPending) {
				return;
			}
			if (this.#popupShare) {
				this.#popupShare?.show();
			} else {
				this.#popupShare = new ui_dialogs_messagebox.MessageBox({
					title: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_TITLE_MSGVER_1'),
					message: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_CONTENT'),
					minWidth: 350,
					maxWidth: 420,
					useAirDesign: true,
					popupOptions: {
						closeIcon: true,
						closeByEsc: true,
						animation: 'fading-slide'
					},
					buttons: [new ui_buttons.Button({
						text: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_SHARE_POPUP_BTN_CONFIRM'),
						color: ui_buttons.Button.Color.PRIMARY,
						useAirDesign: true,
						dataset: {
							testid: 'vibe-settings-publish-confirm-btn'
						},
						onclick: () => {
							// the dialog is reachable while it fades away, the request is already on its way
							if (this.#isStatusRequestPending) {
								return;
							}
							const newTemplate = this.getInfoSuccessTemplate();
							const wrapper = this.#secondaryTemplate.querySelector('.intranet-settings__vibe-info-template');
							const innerWrapper = wrapper.querySelector('.intranet-settings__vibe-info:not(.--success)');

							// the hint belongs to the button that leaves the document with the block
							this.#hideHelpHint();
							main_core.Dom.replace(innerWrapper, newTemplate);

							// asked before the request: the button is gone by the time the answer comes
							const wasFocusedOnTrigger = this.#holdsFocus(this.#getButtonPublish(), this.#popupShare);
							const publishCarriedOut = () => {
								this.#isStatusRequestPending = false;
								this.#sendAnalytic({
									event: 'publish_page'
								});
								this.emit('publish');
								if (this.#urlPublic) {
									this.#isPublished = true;
								}

								// the answer of the server tells the status, not the block redrawn before it
								landing_ui_a11y.A11y.announce(main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_PUBLISHED'), 'polite');
								if (wasFocusedOnTrigger) {
									// the settings may leave the trigger alone, then nothing takes its place
									const nextButton = this.#canShowWithdrawButton ? this.#getButtonWithdraw() : this.#getButtonSecondarySettings();
									nextButton.focus();
								}
							};
							const publishRefused = () => {
								this.#isStatusRequestPending = false;
								this.#sendAnalytic({
									event: 'publish_page',
									status: 'error'
								});
								this.#hideHelpHint();
								main_core.Dom.replace(newTemplate, this.getInfoTemplate());
								if (wasFocusedOnTrigger) {
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
						}
					}), new ui_buttons.Button({
						text: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_POPUP_BTN_CANCEL'),
						color: ui_buttons.Button.Color.LIGHT_BORDER,
						useAirDesign: true,
						style: ui_buttons.Button.AirStyle.OUTLINE,
						dataset: {
							testid: 'vibe-settings-publish-cancel-btn'
						},
						onclick: () => {
							this.#popupShare.close();
						}
					})]
				});
				this.#popupShare?.show();
			}
		}
		#showWithdrawPopup() {
			if (this.#isStatusRequestPending) {
				return;
			}
			if (this.#popupWithdraw) {
				this.#popupWithdraw?.show();
			} else {
				const title = this.#canEdit ? main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_TITLE') : main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_TITLE_FREE');
				const content = this.#canEdit ? main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_CONTENT') : main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_CONTENT_FREE');
				const okText = this.#canEdit ? main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_BTN_CONFIRM') : main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_WITHDRAW_POPUP_BTN_CONFIRM_FREE');
				this.#popupWithdraw = new ui_dialogs_messagebox.MessageBox({
					title,
					message: content,
					minWidth: 350,
					maxWidth: 420,
					useAirDesign: true,
					popupOptions: {
						closeIcon: true,
						closeByEsc: true,
						animation: 'fading-slide'
					},
					buttons: [new ui_buttons.Button({
						text: okText,
						useAirDesign: true,
						style: ui_buttons.Button.AirStyle.FILLED_ALERT,
						dataset: {
							testid: 'vibe-settings-withdraw-confirm-btn'
						},
						onclick: () => {
							// the dialog is reachable while it fades away, the request is already on its way
							if (this.#isStatusRequestPending) {
								return;
							}
							const newTemplate = this.getInfoTemplate();
							const wrapper = this.#secondaryTemplate.querySelector('.intranet-settings__vibe-info-template');
							const innerWrapper = wrapper.querySelector('.intranet-settings__vibe-info');

							// the hint belongs to the button that leaves the document with the block
							this.#hideHelpHint();
							main_core.Dom.replace(innerWrapper, newTemplate);

							// asked before the request: the button is gone by the time the answer comes
							const wasFocusedOnTrigger = this.#holdsFocus(this.#getButtonWithdraw(), this.#popupWithdraw);
							const withdrawCarriedOut = () => {
								this.#isStatusRequestPending = false;
								this.#sendAnalytic({
									event: 'unpublish_page'
								});
								this.emit('withdraw');
								this.#isPublished = false;

								// the answer of the server tells the status, not the block redrawn before it
								landing_ui_a11y.A11y.announce(main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_WITHDRAWN'), 'polite');
								if (wasFocusedOnTrigger) {
									// the settings may leave the trigger alone, then nothing takes its place
									const nextButton = this.#canShowPublishButton ? this.#getButtonPublish() : this.#getButtonSecondarySettings();
									nextButton.focus();
								}
							};
							const withdrawRefused = () => {
								this.#isStatusRequestPending = false;
								this.#sendAnalytic({
									event: 'unpublish_page',
									status: 'error'
								});
								this.#hideHelpHint();
								main_core.Dom.replace(newTemplate, this.getInfoSuccessTemplate());
								if (wasFocusedOnTrigger) {
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
						}
					}), new ui_buttons.Button({
						text: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_POPUP_BTN_CANCEL'),
						color: ui_buttons.Button.Color.LIGHT_BORDER,
						useAirDesign: true,
						style: ui_buttons.Button.AirStyle.OUTLINE,
						dataset: {
							testid: 'vibe-settings-withdraw-cancel-btn'
						},
						onclick: () => {
							this.#popupWithdraw.close();
						}
					})]
				});
				this.#popupWithdraw?.show();
			}
		}
		#getButtonEdit() {
			if (!this.#urlEdit) {
				return null;
			}
			if (!this.#buttonEdit) {
				const buttonEdit = main_core.Tag.render`
			
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-blue"
						data-testid="vibe-settings-edit-btn">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EDIT')}
				</button>
			`;
				const buttonEditLock = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-blue --disabled"
						aria-describedby="${this.#lockReasonId}" data-testid="vibe-settings-edit-btn">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EDIT')}
					${this.renderLockElement()}
				</button>
			`;
				this.#buttonEdit = this.#canEdit ? buttonEdit : buttonEditLock;
			}
			return this.#buttonEdit;
		}
		#getButtonPublish() {
			if (!this.#buttonPublish) {
				const renderNode = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}" data-testid="vibe-settings-publish-btn">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PUBLIC')}
				</button>
			`;
				const renderNodeLock = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --disabled
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}"
						aria-describedby="${this.#lockReasonId}" data-testid="vibe-settings-publish-btn">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PUBLIC')}
					${this.renderLockElement()}
				</button>
			`;
				this.#buttonPublish = this.#canEdit ? renderNode : renderNodeLock;
			}
			return this.#buttonPublish;
		}
		#getButtonWithdraw() {
			if (!this.#buttonWithdraw) {
				this.#buttonWithdraw = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}" data-testid="vibe-settings-withdraw-btn">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_UNPUBLIC')}
				</button>
			`;
			}
			return this.#buttonWithdraw;
		}
		#getButtonPartners() {
			if (!this.#feedbackParams) {
				return null;
			}
			if (!this.#buttonPartners) {
				this.#buttonPartners = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-gray"
						data-testid="vibe-settings-partners-btn">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PARTNERS')}
				</button>
			`;
			}
			return this.#buttonPartners;
		}
		#getButtonCreate() {
			if (!this.#urlCreate) {
				return null;
			}
			if (!this.#buttonMarket) {
				const buttonColor = this.#isPageExists ? '--light-blue' : 'ui-btn-primary';
				const renderNode = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps ${buttonColor}"
						data-testid="vibe-settings-template-btn">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_MARKET')}
				</button>
			`;
				const renderNodeLock = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps ${buttonColor} --disabled"
						aria-describedby="${this.#lockReasonId}" data-testid="vibe-settings-template-btn">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_MARKET')}
					${this.renderLockElement()}
				</button>
			`;
				this.#buttonMarket = this.#canEdit ? renderNode : renderNodeLock;
			}
			return this.#buttonMarket;
		}
		#bindButtonEvents() {
			if (main_core.Type.isUndefined(BX.SidePanel)) {
				return;
			}
			main_core.Event.bind(this.#getButtonMainSettings(), 'click', this.#showImportPopup.bind(this));
			main_core.Event.bind(this.#getButtonSecondarySettings(), 'click', this.#showExportPopup.bind(this));
			if (this.#getButtonCreate()) {
				main_core.Event.bind(this.#getButtonCreate(), 'click', () => {
					if (this.#canEdit) {
						BX.SidePanel.Instance.open(this.#urlCreate);
					} else {
						BX.UI.InfoHelper.show(this.#limitCode);
					}
					this.#sendAnalytic({
						event: 'open_market',
						status: this.#canEdit ? 'success' : 'error_limit',
						p2: this.#getAnalyticContextParam()
					});
				});
			}
			if (this.#getButtonEdit()) {
				main_core.Event.bind(this.#getButtonEdit(), 'click', () => {
					if (this.#canEdit) {
						BX.SidePanel.Instance.open(this.#urlEdit, {
							customLeftBoundary: 66,
							events: {
								onCloseComplete: () => {
									if (this.#canRedirectToVibeAfterEdit && this.#urlPublic) {
										window.top.location = this.#urlPublic;
									}
								}
							}
						});
					} else {
						BX.UI.InfoHelper.show(this.#limitCode);
					}
					this.#sendAnalytic({
						event: 'open_editor',
						status: this.#canEdit ? 'success' : 'error_limit'
					});
				});
			}
			if (this.#getButtonPartners()) {
				main_core.Event.bind(this.#getButtonPartners(), 'click', () => {
					// todo: need analitycs?

					main_core.Runtime.loadExtension('ui.feedback.form').then(() => {
						this.#feedbackParams.title = main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PARTNERS');
						BX.UI.Feedback.Form.open(this.#feedbackParams);
					});
				});
			}
			this.subscribe('publish', () => {
				if (this.#canShowWithdrawButton) {
					main_core.Dom.replace(this.#getButtonPublish(), this.#getButtonWithdraw());
				} else {
					main_core.Dom.remove(this.#getButtonPublish());
				}
			});
			this.subscribe('withdraw', () => {
				if (this.#canShowPublishButton) {
					main_core.Dom.replace(this.#getButtonWithdraw(), this.#getButtonPublish());
				} else {
					main_core.Dom.remove(this.#getButtonWithdraw());
				}
			});
			if (this.#canShowPublishButton) {
				main_core.Event.bind(this.#getButtonPublish(), 'click', () => {
					if (!this.#canEdit) {
						BX.UI.InfoHelper.show(this.#limitCode);
						this.#sendAnalytic({
							event: 'publish_page',
							status: 'error_limit'
						});
						return;
					}
					this.#showSharePopup();
				});
			}
			if (this.#canShowWithdrawButton) {
				main_core.Event.bind(this.#getButtonWithdraw(), 'click', this.#showWithdrawPopup.bind(this));
			}
		}
		#bindSliderCloseEvent() {
			if (!this.#canRedirectToVibeAfterEdit) {
				return;
			}
			const isPublishedBefore = this.#isPublished;
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onClose', () => {
				if (this.#isPublished !== isPublishedBefore) {
					const location = this.#isPublished ? this.#urlPublic : '/';
					window.top.location = location;
				}
			});
		}
		renderLockElement() {
			return main_core.Tag.render`<span class="intranet-settings-mp-icon ui-icon-set --lock" aria-hidden="true"></span>`;
		}

		// The menu gives the role of an item to a node of its own and puts these attributes on it.
		#getMenuItemAttrs(testId) {
			if (this.#canEdit) {
				return {
					'data-testid': testId
				};
			}
			return {
				'data-testid': testId,
				'aria-describedby': this.#lockReasonId
			};
		}

		// One reason for every locked control of the card: it lives in the main template, the only one
		// always present in the markup.
		#renderLockReason() {
			if (this.#canEdit) {
				return '';
			}
			return main_core.Tag.render`
			<span
				class="intranet-settings__vibe-visually-hidden"
				id="${this.#lockReasonId}"
			>${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_LOCK_REASON')}</span>
		`;
		}
		#getAnalyticContextParam() {
			return ['chapter', `${this.#moduleId}-${this.#embedId}`];
		}
		#sendAnalytic(data) {
			this.emit('sendAnalytic', data);
		}
	}

	class VibePage extends ui_formElements_field.BaseSettingsPage {
		titlePage = '';
		descriptionPage = '';
		#metrika;
		constructor() {
			super();
			this.titlePage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_PAGE_WELCOME');
			this.descriptionPage = main_core.Loc.getMessage('INTRANET_SETTINGS_TITLE_DESCRIPTION_PAGE_VIBE');
			this.#metrika = new landing_metrika.Metrika(true, 'vibe');
		}
		getType() {
			return 'welcome';
		}
		appendSections(contentNode) {
			let subSection = 'from_settings';
			const analyticContext = this.#getAnalyticContext();
			if (analyticContext !== null && main_core.Type.isString(analyticContext.analyticContext)) {
				if (analyticContext.analyticContext === 'widget_settings_settings_mainpage') {
					subSection = 'from_widget_vibe_point';
				} else if (analyticContext.analyticContext === 'from_custom_point') {
					subSection = 'from_custom_point';
				}
			}
			this.#sendAnalytic({
				event: 'open_settings_main',
				c_sub_section: subSection
			});
			const vibes = this.getValue('vibes') || [];
			vibes.forEach(options => {
				const vibeSection = new VibeSection(options);
				vibeSection.subscribe('sendAnalytic', event => {
					this.#sendAnalytic(event.getData());
				});
				vibeSection.appendSections(contentNode);
			});
		}
		#getAnalyticContext() {
			const analytic = this.getAnalytic?.();
			if (!analytic) {
				return null;
			}
			if (main_core.Type.isFunction(analytic.getContext)) {
				return analytic.getContext();
			}
			if (main_core.Type.isPlainObject(analytic) && !main_core.Type.isNil(analytic.context)) {
				return analytic.context;
			}
			return null;
		}
		#sendAnalytic(data) {
			if (!main_core.Type.isString(data.event)) {
				return;
			}
			data.category = 'vibe';
			this.#metrika.sendData(data);
		}
	}

	main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onExternalPageLoaded:welcome', () => {
		return new VibePage();
	});

	exports.VibePage = VibePage;

})(this.BX.Landing.Integration.IntranetSetting = this.BX.Landing.Integration.IntranetSetting || {}, BX.Event, BX, BX, BX.UI.FormElements, BX, BX.Landing, BX.Main, BX.UI, BX.UI.Dialogs, BX.UI, BX.UI, BX.Landing.UI);
//# sourceMappingURL=vibe-page.bundle.js.map
