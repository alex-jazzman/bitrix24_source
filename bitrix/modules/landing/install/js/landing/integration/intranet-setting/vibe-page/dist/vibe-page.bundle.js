/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.Integration = this.BX.Landing.Integration || {};
(function (exports, main_core_events, main_core, sidepanel, ui_formElements_field, ui_icon_set, landing_metrika, main_popup, ui_buttons, ui_dialogs_messagebox, ui_hint, ui_section) {
	'use strict';

	class VibeSection extends main_core_events.EventEmitter {
		static #iconDefaultSet = 'ui.icon-set.main';
		static #iconDefaultIcon = '--home';
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
		#importPopup = null;
		#exportPopup = null;
		#popupShare = null;
		#popupWithdraw = null;
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
		}
		getType() {
			return 'welcome';
		}
		appendSections(contentNode) {
			const set = this.#icon && this.#icon.set ? `ui.icon-set.${this.#icon.set}` : VibeSection.#iconDefaultSet;
			main_core.Runtime.loadExtension(set);
			const iconClass = (this.#icon && this.#icon.code) ?? VibeSection.#iconDefaultIcon;
			const section = new ui_section.Section({
				title: this.#title,
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
				<div class="intranet-settings__vibe-template">
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
					/>
				` : '';
				this.#secondaryTemplate = main_core.Tag.render`
				<div class="intranet-settings__vibe-template --secondary-template">
					<div class="intranet-settings__vibe-preview-box">
						${previewImg}
					</div>
					<div class="intranet-settings__vibe-content">
						<div class="intranet-settings__vibe-title">
							${this.#pageTitle ?? ''}
						</div>
						<div class="intranet-settings__vibe-info-template">
							${this.#isPublished ? this.getInfoSuccessTemplate() : this.getInfoTemplate()}
						</div>					
						<div class="intranet-settings__vibe-button-box">
							${this.#getButtonEdit()}
							<div class="intranet-settings__vibe-button-box-right">
								${this.#isPublished ? this.#getButtonWithdraw() : this.#getButtonPublish()}
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
			<div class="intranet-settings__vibe-info">
				<div class="intranet-settings__vibe-info-title">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_TITLE')}
				</div>
				<div class="intranet-settings__vibe-info-subtitle">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUBTITLE')}
					<div class="ui-icon-set --help intranet-settings__vibe-info-help"></div>
				</div>
			</div>
		`;
			main_core.Event.bind(this.infoTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseenter', event => {
				const width = this.infoTemplate.querySelector('.intranet-settings__vibe-info-help').offsetWidth;
				this.warningHintPopup = new main_popup.Popup({
					angle: true,
					autoHide: true,
					className: 'ui-hint-popup',
					content: main_core.Tag.render`
					<div class="ui-hint-content">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_WARNING')}
					</div>
				`,
					cacheable: false,
					animation: 'fading-slide',
					bindElement: event.target,
					offsetTop: 0,
					offsetLeft: parseInt(width / 2, 10),
					bindOptions: {
						position: 'top'
					},
					darkMode: true
				});
				this.warningHintPopup.show();
			});
			main_core.Event.bind(this.infoTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseleave', () => {
				if (this.warningHintPopup) {
					setTimeout(() => {
						this.warningHintPopup.destroy();
						this.warningHintPopup = null;
					}, 300);
				}
			});
			return this.infoTemplate;
		}
		getInfoSuccessTemplate() {
			this.infoSuccessTemplate = main_core.Tag.render`
			<div class="intranet-settings__vibe-info --success">
				<div class="intranet-settings__vibe-info-title">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUCCESS_TITLE')}				
				</div>
				<div class="intranet-settings__vibe-info-subtitle">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_INFO_SUCCESS_SUBTITLE')}
					<div class="ui-icon-set --help intranet-settings__vibe-info-help"></div>
				</div>
			</div>
		`;
			main_core.Event.bind(this.infoSuccessTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseenter', event => {
				const width = this.infoSuccessTemplate.querySelector('.intranet-settings__vibe-info-help').offsetWidth;
				this.successHintPopup = new main_popup.Popup({
					angle: true,
					autoHide: true,
					className: 'ui-hint-popup',
					content: main_core.Tag.render`
						<div class="ui-hint-content">
							${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_HINT_SUCCESS')}
						</div>
					`,
					cacheable: false,
					animation: 'fading-slide',
					bindElement: event.target,
					offsetTop: 0,
					offsetLeft: parseInt(width / 2, 10),
					bindOptions: {
						position: 'top'
					},
					darkMode: true
				});
				this.successHintPopup.show();
			});
			main_core.Event.bind(this.infoSuccessTemplate.querySelector('.intranet-settings__vibe-info-help'), 'mouseleave', () => {
				if (this.successHintPopup) {
					setTimeout(() => {
						this.successHintPopup.destroy();
						this.successHintPopup = null;
					}, 300);
				}
			});
			return this.infoSuccessTemplate;
		}
		#getButtonMainSettings() {
			if (!this.#buttonMainSettings) {
				this.#buttonMainSettings = main_core.Tag.render`
				<button type="button" class="intranet-settings-btn-settings">
					<div class="ui-icon-set --more"></div>
				</button>
			`;
			}
			return this.#buttonMainSettings;
		}
		#getButtonSecondarySettings() {
			if (!this.#buttonSecondarySettings) {
				this.#buttonSecondarySettings = main_core.Tag.render`
				<button type="button" class="intranet-settings-btn-settings">
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
					className: this.#canEdit ? '' : '--disabled',
					items: [{
						id: 'importPopup',
						html: htmlContent,
						onclick: this.#showImportSlider.bind(this)
					}],
					offsetLeft: 20,
					events: {
						onPopupClose: () => {},
						onPopupShow: () => {}
					}
				});
			}
			this.#importPopup?.show();
		}
		#showExportPopup() {
			if (!this.#exportPopup) {
				const htmlContent = this.#canEdit ? main_core.Tag.render`<span>${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_EXPORT_POPUP')}</span>` : main_core.Tag.render`
					<span class="intranet-settings-vibe-popup-item --disabled">
						${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_EXPORT_POPUP')} ${this.renderLockElement()}
					</span>
				`;
				this.#exportPopup = new main_popup.Menu({
					angle: true,
					animation: 'fading-slide',
					bindElement: this.#buttonSecondarySettings,
					className: this.#canEdit ? '' : '--disabled',
					items: [{
						id: 'exportPopup',
						html: htmlContent,
						onclick: this.#showExportSlider.bind(this)
					}],
					offsetLeft: 20,
					events: {
						onPopupClose: () => {},
						onPopupShow: () => {}
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
		#showSharePopup() {
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
						onclick: () => {
							const newTemplate = this.getInfoSuccessTemplate();
							const wrapper = this.#secondaryTemplate.querySelector('.intranet-settings__vibe-info-template');
							const innerWrapper = wrapper.querySelector('.intranet-settings__vibe-info:not(.--success)');
							main_core.Dom.replace(innerWrapper, newTemplate);
							main_core.ajax.runAction('landing.vibe.publish', {
								data: {
									moduleId: this.#moduleId,
									embedId: this.#embedId
								}
							}).then(() => {
								this.emit('publish');
								if (this.#urlPublic) {
									this.#isPublished = true;
								}
							});
							this.#popupShare.close();
							this.#sendAnalytic({
								event: 'publish_page'
							});
						}
					}), new ui_buttons.Button({
						text: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_POPUP_BTN_CANCEL'),
						color: ui_buttons.Button.Color.LIGHT_BORDER,
						useAirDesign: true,
						style: ui_buttons.Button.AirStyle.OUTLINE,
						onclick: () => {
							this.#popupShare.close();
						}
					})]
				});
				this.#popupShare?.show();
			}
		}
		#showWithdrawPopup() {
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
						onclick: () => {
							const newTemplate = this.getInfoTemplate();
							const wrapper = this.#secondaryTemplate.querySelector('.intranet-settings__vibe-info-template');
							const innerWrapper = wrapper.querySelector('.intranet-settings__vibe-info');
							main_core.Dom.replace(innerWrapper, newTemplate);
							main_core.ajax.runAction('landing.vibe.withdraw', {
								data: {
									moduleId: this.#moduleId,
									embedId: this.#embedId
								}
							}).then(() => {
								this.emit('withdraw');
								this.#isPublished = false;
							});
							this.#popupWithdraw.close();
							this.#sendAnalytic({
								event: 'unpublish_page'
							});
						}
					}), new ui_buttons.Button({
						text: main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_POPUP_BTN_CANCEL'),
						color: ui_buttons.Button.Color.LIGHT_BORDER,
						useAirDesign: true,
						style: ui_buttons.Button.AirStyle.OUTLINE,
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
			
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-blue">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_EDIT')}
				</button>
			`;
				const buttonEditLock = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-blue --disabled">
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
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_PUBLIC')}
				</button>
			`;
				const renderNodeLock = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --disabled
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}">
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
						${this.#isPageExists ? 'ui-btn-primary' : '--light-blue'}">
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
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps --light-gray">
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
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps ${buttonColor}">
					${main_core.Loc.getMessage('INTRANET_SETTINGS_VIBE_BUTTON_MARKET')}
				</button>
			`;
				const renderNodeLock = main_core.Tag.render`
				<button type="button" class="ui-btn ui-btn-md ui-btn-round ui-btn-no-caps ${buttonColor} --disabled">
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
									if (this.#urlPublic) {
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
				main_core.Dom.replace(this.#getButtonPublish(), this.#getButtonWithdraw());
			});
			this.subscribe('withdraw', () => {
				main_core.Dom.replace(this.#getButtonWithdraw(), this.#getButtonPublish());
			});
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
			main_core.Event.bind(this.#getButtonWithdraw(), 'click', this.#showWithdrawPopup.bind(this));
		}
		#bindSliderCloseEvent() {
			const isPublishedBefore = this.#isPublished;
			main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onClose', () => {
				if (this.#isPublished !== isPublishedBefore) {
					const location = this.#isPublished ? this.#urlPublic : '/';
					window.top.location = location;
				}
			});
		}
		renderLockElement() {
			return main_core.Tag.render`<span class="intranet-settings-mp-icon ui-icon-set --lock"></span>`;
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

})(this.BX.Landing.Integration.IntranetSetting = this.BX.Landing.Integration.IntranetSetting || {}, BX.Event, BX, BX, BX.UI.FormElements, BX, BX.Landing, BX.Main, BX.UI, BX.UI.Dialogs, BX.UI, BX.UI);
//# sourceMappingURL=vibe-page.bundle.js.map
