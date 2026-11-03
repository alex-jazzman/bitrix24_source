/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, ui_popupcomponentsmaker, ui_infoHelper, main_popup, ui_buttons, ui_feedback_partnerform, ui_iconSet_outlined, intranet_partnerDiscontinue) {
	'use strict';

	class Content extends main_core_events.EventEmitter {
		cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super();
			this.setOptions(options);
			this.setEventNamespace('BX.Intranet.LicenseWidget.Content');
		}
		setOptions(options) {
			this.cache.set('options', options);
			return this;
		}
		getOptions() {
			return this.cache.get('options', {});
		}
		getLayout() {
			throw new Error('Must be implemented in a child class');
		}
		getConfig() {
			return {
				html: this.getLayout(),
				minHeight: '58px'
			};
		}
	}

	class MarketContent extends Content {
		getConfig() {
			return {
				html: this.getLayout(),
				minHeight: this.getOptions().isSmall ? '86px' : '55px'
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div data-id="${this.getLayoutId()}" class="license-widget-item license-widget-item--secondary ${this.getMainClass()}">
					<div class="license-widget-inner ${this.getOptions().isSmall ? '--column' : ''}">
						<div class="license-widget-content">
							${this.getIcon()}
							<div class="license-widget-item-content">
								${this.getTitle()}
								${this.getDescription()}
							</div>
						</div>
						${this.getButton()}
					</div>
				</div>
			`;
			});
		}
		getLayoutId() {
			return 'license-widget-block-market';
		}
		getTitle() {
			return this.cache.remember('title', () => {
				return main_core.Tag.render`
				<div class="license-widget-item-name">
					<span>
						${this.getOptions().title}
					</span>
					${this.#getHelpIcon()}
				</div>
			`;
			});
		}
		#getHelpIcon() {
			if (this.getOptions().isPaid || this.getOptions().isDemo) {
				return main_core.Tag.render`
				<button
					type="button"
					class="license-widget-item-help"
					aria-label="${main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_MARKET_HELP_BUTTON')}"
					onclick="${() => this.#showHelper()}"
				></button>
			`;
			}
			return '';
		}
		#showHelper() {
			ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				code: this.getOptions().description.landingCode
			}).show();
		}
		getIcon() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`
				<div class="license-widget-item-icon license-widget-item-icon--mp" aria-hidden="true"/>
			`;
			});
		}
		getDescription() {
			return this.cache.remember('description', () => {
				if (this.getOptions().isPaid || this.getOptions().isDemo) {
					return this.getReminderMessage();
				}
				return this.getDescriptionLink();
			});
		}
		getMainClass() {
			if (this.getOptions().isExpired || this.getOptions().isAlmostExpired) {
				return '--market-expired';
			}
			if (this.getOptions().isPaid || this.getOptions().isDemo) {
				return '--market-active';
			}
			return '--market-default';
		}
		getReminderMessage() {
			return this.cache.remember('reminder-message', () => {
				return main_core.Tag.render`
				<div class="license-widget-item-info">
					<span class="license-widget-item-info-text">
						${this.getOptions().messages.remainder}
					</span>
				</div>
			`;
			});
		}
		getDescriptionLink() {
			return this.cache.remember('description-link', () => {
				return main_core.Tag.render`
				<div class="license-widget-item-link">
					<button type="button" class="license-widget-item-link-text" onclick="${() => this.#showHelper()}">
						${this.getOptions().description.text}
					</button>
				</div>
			`;
			});
		}
		getButton() {
			return this.cache.remember('button', () => {
				const onclick = () => {
					main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.LicenseWidget.Popup:openChild');
				};
				return main_core.Tag.render`
				<a
					onclick="${onclick}"
					href="${this.getOptions().button.link}"
					class="license-widget-item-btn"
					target="_blank"
					rel="noopener noreferrer"
				>
					${this.getOptions().button.text}
				</a>
			`;
			});
		}
	}

	const baasWidgetMarker = Symbol('baas widget');
	class BaasContent extends MarketContent {
		getConfig() {
			return {
				html: this.getLayout(),
				minHeight: this.getOptions().isSmall ? '86px' : '55px'
			};
		}
		getTitle() {
			return this.cache.remember('title', () => {
				return main_core.Tag.render`
				<div class="license-widget-item-name">
					<span>
						${this.getOptions().title}
					</span>
					${this.#getHelpIcon()}
				</div>
			`;
			});
		}
		#getHelpIcon() {
			if (this.getOptions().isActive) {
				return main_core.Tag.render`
				<button
					type="button"
					class="license-widget-item-help"
					aria-label="${main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_BAAS_HELP_BUTTON')}"
					onclick="${() => this.#showHelper()}"
				></button>
			`;
			}
			return '';
		}
		#showHelper() {
			ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				code: this.getOptions().description.landingCode
			}).show();
		}
		getDescription() {
			if (this.getOptions().isActive) {
				return this.getReminderMessage();
			}
			return this.getDescriptionLink();
		}
		getDescriptionLink() {
			return this.cache.remember('description-link', () => {
				return main_core.Tag.render`
				<div class="license-widget-item-link">
					<button type="button" class="license-widget-item-link-text" onclick="${() => this.#showHelper()}">
						${this.getOptions().description.text}
					</button>
				</div>
			`;
			});
		}
		getReminderMessage() {
			return this.cache.remember('reminder-message', () => {
				const node = main_core.Tag.render`
				<button type="button" class="license-widget-item-link" onclick="${this.#showBaasWidget.bind(this)}">
					<span class="license-widget-item-link-text --active">
						${this.getOptions().messages.remainder}
					</span>
				</button>
			`;
				if (BX.PULL && main_core.Extension.getSettings('baas.store').pull) {
					BX.PULL.extendWatch(main_core.Extension.getSettings('baas.store').pull.channelName);
					main_core_events.EventEmitter.subscribe('onPullEvent-baas', event => {
						const [command, params] = event.getData();
						if (command === 'updateService' && params.purchaseCount) {
							node.querySelector('[data-bx-role="purchaseCount"]').innerText = params.purchaseCount;
						}
					});
				}
				return node;
			});
		}
		getLayoutId() {
			return 'license-widget-block-baas';
		}
		getButton() {
			return main_core.Tag.render`
			<button type="button" class="license-widget-item-btn" onclick="${this.#showBaasWidget.bind(this)}">
				${this.getOptions().button.text}
			</button>
		`;
		}
		#showBaasWidget() {
			main_core.Runtime.loadExtension(['baas.store']).then(exports => {
				const widget = exports.Widget.getInstance();
				if (!widget[baasWidgetMarker]) {
					widget.subscribe('onClickBack', () => {
						this.getOptions().licensePopup.show();
					});
				}
				widget.bind(this.getOptions().licensePopupTarget, exports.Analytics.CONTEXT_LICENSE_WIDGET).show();
				main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.LicenseWidget.Popup:openChild');
			});
		}
		getIcon() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`
				<div class="license-widget-item-icon license-widget-item-icon--baas" aria-hidden="true"/>
			`;
			});
		}
		getMainClass() {
			if (this.getOptions().isActive) {
				return '--baas-active';
			}
			return '--baas-default';
		}
	}

	class IntegratorContent extends Content {
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div data-id="license-widget-block-partner" class="license-widget-item license-widget-item--secondary">
					<div class="license-widget-inner">
						<div class="license-widget-content">
							${this.getIcon()}
							<div class="license-widget-item-content">
								${this.getTitle()}
								${this.getDescription()}
							</div>
						</div>
						${this.getButtons()}
					</div>
				</div>
			`;
			});
		}
		getConfig() {
			return {
				html: this.getLayout(),
				className: 'license-widget-section-with-box'
			};
		}
		getIcon() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`
				<div class="license-widget-item-icon license-widget-item-icon--b24-partner">
					${this.isConnected() && this.getPartnerLogo() !== '' ? main_core.Tag.safe`<img class="license-widget-item-icon-img" src="${this.getPartnerLogo()}" alt="">` : ''}
				</div>
			`;
			});
		}
		getTitle() {
			return this.cache.remember('title', () => {
				const isPartnerConnect = this.isConnected();
				return isPartnerConnect ? this.#getTitleWithIntegrator() : this.#getTitleWithoutPartner();
			});
		}
		#getTitleWithIntegrator() {
			const partnerName = this.getPartnerName() || this.getOptions().title || '';
			const partnerCardUrl = this.getPartnerCardUrl();
			if (partnerCardUrl === '') {
				return main_core.Tag.render`
				<div class="license-widget-item-name">
					<span class="license-widget-item-name__inner" title="${main_core.Text.encode(partnerName)}">
						${main_core.Text.encode(partnerName)}
					</span>
					${this.#getHelpIcon()}
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="license-widget-item-name-controls">
				<a
					class="license-widget-item-name --link"
					href="${partnerCardUrl}"
					target="_blank"
					rel="noopener noreferrer"
				>
					<span class="license-widget-item-name__inner" title="${main_core.Text.encode(partnerName)}">
						${main_core.Text.encode(partnerName)}
					</span>
					<span class="license-widget-item-chevron-right" aria-hidden="true">
						<span class="ui-icon-set --chevron-right"></span>
					</span>
				</a>
				${this.#getHelpIcon()}
			</div>
		`;
		}
		#getTitleWithoutPartner() {
			return main_core.Tag.render`
			<div class="license-widget-item-name">
				<span>${this.getOptions().title}</span>
				${this.#getHelpIcon()}
			</div>
		`;
		}
		#getHelpIcon() {
			const showHelper = event => {
				event.stopPropagation();
				BX.Helper.show('redirect=detail&code=25822439');
			};
			return main_core.Tag.render`
			<button
				type="button"
				class="license-widget-item-help"
				data-testid="license-widget-integrator-help-btn"
				aria-label="${main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_HELP_BUTTON')}"
				onclick="${showHelper}"
			></button>
		`;
		}
		getDescription() {
			return this.cache.remember('description', () => {
				return main_core.Tag.render`
				<div class="license-widget-option-text --flex">
					${this.getOptions().description}
				</div>
			`;
			});
		}
		getButtons() {
			return this.cache.remember('button', () => {
				return this.isConnected() ? this.#renderButtonsWithConnectedPartner() : this.#renderButtonsWithoutPartner();
			});
		}
		#renderButtonsWithConnectedPartner() {
			const buttonConnect = main_core.Tag.render`
			<button type="button" class="license-widget-item-btn">
				${this.getButtonTitle('connect')}
			</button>
		`;
			main_core.Event.bind(buttonConnect, 'click', async () => {
				this.#closeBasePopup();
				const params = this.getOptions().connectPartnerFormParams ?? {};
				if (BX?.Intranet?.Bitrix24?.PartnerForm?.showConnectForm) {
					await BX.Intranet.Bitrix24.PartnerForm.showConnectForm(params);
				} else {
					this.showInfoHelper('info_implementation_request');
				}
			});
			const buttonContainer = main_core.Tag.render`
			<div class="license-widget-item-btn-container">
				${buttonConnect}
			</div>
		`;
			if (this.isCurrentUserAdmin()) {
				const buttonMore = main_core.Tag.render`
				<button
					type="button"
					class="license-widget-item-btn --partner-more"
					aria-label="${main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_MORE_BUTTON')}"
					aria-haspopup="menu"
					aria-expanded="false"
				>
					<span class="ui-icon-set --more-m" aria-hidden="true"></span>
				</button>
			`;
				const menu = this.getMoreMenu(buttonMore);
				menu.subscribe('onShow', () => {
					buttonMore.setAttribute('aria-expanded', 'true');
				});
				menu.subscribe('onClose', () => {
					buttonMore.setAttribute('aria-expanded', 'false');
				});
				main_core.Event.bind(buttonMore, 'click', () => {
					menu.show();
				});
				main_core.Dom.append(buttonMore, buttonContainer);
			}
			return buttonContainer;
		}
		#renderButtonsWithoutPartner() {
			const button = main_core.Tag.render`
			<button type="button" class="license-widget-item-btn">
				${this.getButtonTitle('choose')}
			</button>
		`;
			main_core.Event.bind(button, 'click', () => {
				this.showInfoHelper('info_implementation_request');
			});
			return main_core.Tag.render`
			<div class="license-widget-item-btn-container">
				${button}
			</div>
		`;
		}
		getMoreMenu(bindElement) {
			return this.cache.remember('partner_menu', () => {
				const menu = new main_popup.Menu({
					bindElement,
					cacheable: true,
					focusTrap: {
						initialFocus: 'container',
						restoreFocus: () => bindElement
					},
					items: [{
						text: this.getButtonTitle('feedback'),
						onclick: () => {
							menu.close();
							this.showFeedbackForm();
						}
					}, {
						text: this.getButtonTitle('discontinue'),
						onclick: () => {
							menu.close();
							new intranet_partnerDiscontinue.PartnerDiscontinue().getPopup({
								onConfirm: () => {
									this.#showDiscontinueFeedbackForm();
								}
							}).show();
						}
					}]
				});
				return menu;
			});
		}
		showFeedbackForm() {
			const presets = this.getOptions().feedbackFormPresets ?? {};
			if (!main_core.Type.isObject(presets) || main_core.Type.isArray(presets)) {
				return;
			}
			BX.UI.Feedback.PartnerForm.showFeedback({
				id: 'partner-feedback',
				presets,
				title: main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_FEEDBACK_TITLE')
			});
		}
		showInfoHelper(articleCode) {
			if (BX?.UI?.InfoHelper) {
				BX.UI.InfoHelper.show(articleCode);
				return;
			}
			if (BX?.Helper) {
				BX.Helper.show(`redirect=detail&code=${articleCode}`);
			}
		}
		getButtonTitle(type) {
			const buttons = this.getOptions().buttons ?? {};
			switch (type) {
				case 'connect':
					return buttons?.connect?.title;
				case 'choose':
					return buttons?.choose?.title;
				case 'feedback':
					return buttons?.menu?.feedback?.title;
				case 'discontinue':
					return buttons?.menu?.discontinue?.title;
				default:
					return '';
			}
		}
		isConnected() {
			return Boolean(this.getOptions().isConnected ?? this.getOptions().isPartnerConnect);
		}
		getPartnerName() {
			return this.getOptions().integratorName ?? this.getOptions().partnerName ?? '';
		}
		getPartnerCardUrl() {
			return this.getOptions().integratorCardUrl ?? this.getOptions().partnerCardUrl ?? '';
		}
		getPartnerLogo() {
			return this.getOptions().integratorLogo ?? this.getOptions().partnerLogo ?? '';
		}
		isCurrentUserAdmin() {
			return this.getOptions().isCurrentUserAdmin === true;
		}
		#closeBasePopup() {
			main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.LicenseWidget.Popup:openChild');
		}
		#showDiscontinueFeedbackForm() {
			const presets = this.getOptions().feedbackFormPresets ?? {};
			if (!main_core.Type.isObject(presets) || main_core.Type.isArray(presets)) {
				return;
			}
			BX.UI.Feedback.PartnerForm.showRefusal({
				id: 'partner-refusal',
				presets,
				title: main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_FEEDBACK_TITLE')
			});
			top.addEventListener('b24:form:send:success', event => {
				const rawFormId = event?.detail?.object?.identification?.id;
				if (main_core.Type.isNil(rawFormId)) {
					return;
				}
				const formId = String(rawFormId);
				const refusalIds = this.#getRefusalFormIds();
				if (refusalIds.length === 0 || refusalIds.includes(formId)) {
					main_core.ajax.runAction('intranet.v2.Partner.Relation.delete', {}).then(() => {
						this.#showSuccessDiscontinuePopup();
					}).catch(error => {
						BX.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_ERROR')
						});
						top.console.error(error);
					});
				}
			}, {
				once: true
			});
		}
		#getRefusalFormIds() {
			const forms = main_core.Extension.getSettings('ui.feedback.partnerform')?.get('partnerRefusalForms');
			if (!Array.isArray(forms)) {
				return [];
			}
			return forms.map(item => item?.id).filter(id => main_core.Type.isNumber(id) || main_core.Type.isStringFilled(id)).map(String);
		}
		#showSuccessDiscontinuePopup() {
			const isSliderOpen = top.BX.SidePanel?.Instance?.getOpenSliders && typeof top.BX.SidePanel.Instance.getOpenSliders === 'function' ? top.BX.SidePanel.Instance.getOpenSliders().length > 0 : false;
			if (isSliderOpen) {
				top.BX.Event.EventEmitter.subscribeOnce('SidePanel.Slider:onCloseComplete', () => {
					this.#getSuccessDiscontinuePopup().show();
				});
			} else {
				this.#getSuccessDiscontinuePopup().show();
			}
		}
		#getSuccessDiscontinuePopup() {
			return this.cache.remember('success-discontinue-popup', () => {
				const popup = new main_popup.Popup({
					useAirDesign: true,
					content: this.#getSuccessDiscontinuePopupContent(),
					closeIcon: true,
					cacheable: true,
					className: 'license-widget-partner-success-discontinue-popup',
					width: 590,
					overlay: {
						opacity: 100,
						backgroundColor: 'rgba(0, 32, 78, 0.46)'
					},
					buttons: [new ui_buttons.Button({
						text: main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_CHOOSE_NEW_BTN'),
						useAirDesign: true,
						style: ui_buttons.AirButtonStyle.FILLED,
						className: 'license-widget-partner-success-discontinue-popup-choose-new-btn',
						onclick: () => {
							popup.close();
							this.showInfoHelper('info_implementation_request');
							top.BX.Event.EventEmitter.subscribeOnce('SidePanel.Slider:onCloseComplete', () => {
								location.reload();
							});
						}
					}), new ui_buttons.Button({
						text: main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_CLOSE_BTN'),
						useAirDesign: true,
						style: ui_buttons.AirButtonStyle.OUTLINE,
						onclick: () => {
							popup.close();
							location.reload();
						}
					})]
				});
				return popup;
			});
		}
		#getSuccessDiscontinuePopupContent() {
			return main_core.Tag.render`
			<div class="license-widget-partner-success-discontinue-popup-content">
				<div class="license-widget-partner-success-discontinue-popup-content-text-wrapper">
					<div class="license-widget-partner-success-discontinue-popup-content-title">
						${main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_TITLE')}
					</div>
					<div class="license-widget-partner-success-discontinue-popup-content-description">
						${main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_DESC')}
					</div>
				</div>
				<div class="license-widget-partner-success-discontinue-popup-content-image">
				</div>
			</div>
		`;
		}
	}

	class AdminRestrictedPopup {
		static #popup = null;
		static show(bindElement) {
			if (this.#popup) {
				this.#popup.setBindElement(bindElement);
				this.#popup.show();
			} else {
				this.#popup = new main_popup.Popup({
					content: main_core.Loc.getMessage('INTRANET_LICENSE_WIDGET_ADMIN_RIGHTS_RESTRICTED'),
					bindElement,
					angle: true,
					offsetTop: 0,
					offsetLeft: 40,
					closeIcon: false,
					autoHide: true,
					darkMode: true,
					overlay: false,
					closeByEsc: true,
					width: 300
				});
				this.#popup.show();
			}
		}
	}

	class LicenseContent extends Content {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Bitrix24.LicenseWidget.Content.License');
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div data-id="license-widget-block-tariff"
					class="license-widget-item license-widget-item--main ${this.getOptions().isExpired || this.getOptions().isAlmostExpired ? 'license-widget-item--expired' : ''}"
				>
					<div class="license-widget-inner ${this.getOptions().isDemo ? '--demo' : ''}">
						<div class="license-widget-content">
							${this.getMainIcon()}
							<div class="license-widget-item-content">
								<div class="license-widget-item-name">
									<span>${this.getOptions().name}</span>
								</div>
								${this.getOptions().isExpired ? this.getExpiredMessage() : this.getRemainderMessage()}
								${this.getOptions().isExpired && this.getOptions().isAlmostBlocked ? this.getBlockMessage() : ''}
								${this.getOptions().isAlmostBlocked ? '' : this.getLink()}
							</div>
						</div>
						${this.getOptions().button.isAvailable ? this.getButton() : ''}
					</div>
				</div>
			`;
			});
		}
		getMainIcon() {
			const icon = main_core.Tag.render`
			<div class="license-widget-item-icon" aria-hidden="true"/>
		`;
			if (this.getOptions().isAlmostExpired) {
				main_core.Dom.addClass(icon, 'license-widget-item-icon--low');
			} else if (this.getOptions().isExpired) {
				main_core.Dom.addClass(icon, 'license-widget-item-icon--expired');
			} else if (this.getOptions().isDemo) {
				main_core.Dom.addClass(icon, 'license-widget-item-icon--demo');
			} else {
				main_core.Dom.addClass(icon, 'license-widget-item-icon--pro');
			}
			return icon;
		}
		getButton() {
			const className = `license-widget-item-btn ${this.getOptions().isDemo && !this.getOptions().isAlmostExpired && !this.getOptions().isExpired ? 'license-widget-item-btn--green' : ''}`;
			if (this.getOptions().button.isAdminRestricted) {
				const onclick = event => {
					AdminRestrictedPopup.show(event.currentTarget);
				};
				return main_core.Tag.render`
				<button type="button" onclick="${onclick}" class="${className}">
					${this.getOptions().button.text}
				</button>
			`;
			}
			if (this.getOptions().button.type === 'POST') {
				return main_core.Tag.render`
				<form
					id="renew-license-form"
					class="license-widget-item-form"
					action="${this.getOptions().button.link}"
					method="post"
					target="_blank"
				>
					<input type="hidden" name="license_key" value="${this.getOptions().button.hashKey}">
					<button type="submit" class="${className}">
						${this.getOptions().button.text}
					</button>
				</form>
			`;
			}
			return main_core.Tag.render`
			<a
				href="${this.getOptions().button.link}"
				target="_blank"
				rel="noopener noreferrer"
				class="${className}"
			>
				${this.getOptions().button.text}
			</a>
		`;
		}
		getExpiredMessage() {
			return this.cache.remember('expired-message', () => {
				return main_core.Tag.render`
				<div class="license-widget-item-expired-message">
					<span class="license-widget-item-info-text">
						${this.getOptions().messages.expired}
					</span>
				</div>
			`;
			});
		}
		getBlockMessage() {
			return this.cache.remember('block-message', () => {
				return main_core.Tag.render`
				<div class="license-widget-item-expired-message --scanner-info">
					<span class="license-widget-item-info-text">
						${this.getOptions().messages.block}
					</span>
				</div>
			`;
			});
		}
		getRemainderMessage() {
			return this.cache.remember('block-message', () => {
				if (this.getOptions().isExpired || this.getOptions().isAlmostExpired) {
					return main_core.Tag.render`
					<div class="license-widget-item-expired-message --scanner-info">
						<span class="license-widget-item-info-text">
							${this.getOptions().messages.remainder}
						</span>
					</div>
				`;
				}
				return main_core.Tag.render`
				<div class="license-widget-item-info">
					<span class="license-widget-item-info-text">
						${this.getOptions().messages.remainder}
					</span>
				</div>
			`;
			});
		}
		getLink() {
			if (this.getOptions().more.isAdminRestricted) {
				const onclick = event => {
					AdminRestrictedPopup.show(event.currentTarget);
				};
				return main_core.Tag.render`
				<button type="button" onclick="${onclick}" class="license-widget-item-link-text">
					${this.getOptions().more.text}
				</button>
			`;
			}
			return main_core.Tag.render`
			<a
				href="${this.getOptions().more.link}"
				class="license-widget-item-link-text"
				target="_blank"
				rel="noopener noreferrer"
			>
				${this.getOptions().more.text}
			</a>
		`;
		}
	}

	class PartnerContent extends Content {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Bitrix24.LicenseWidget.Content.Orders');
		}
		getConfig() {
			return {
				html: this.getLayout(),
				minHeight: '50px'
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				if (this.getOptions().landingCode) {
					const onclick = () => {
						ui_infoHelper.FeaturePromotersRegistry.getPromoter({
							code: this.getOptions().landingCode
						}).show();
					};
					return main_core.Tag.render`
					<button
						type="button"
						data-id="license-widget-block-orders"
						onclick="${onclick}"
						class="license-widget-item license-widget-item--secondary --pointer"
					>
						${this.#getLayoutContent()}
					</button>
				`;
				}
				return main_core.Tag.render`
				<a
					href="${this.getOptions().link}"
					target="_blank"
					rel="noopener noreferrer"
					data-id="license-widget-block-orders"
					class="license-widget-item license-widget-item--secondary --pointer"
				>
					${this.#getLayoutContent()}
				</a>
			`;
			});
		}
		#getLayoutContent() {
			return main_core.Tag.render`
			<span class="license-widget-inner">
				<span class="license-widget-content">
					<span class="license-widget-item-icon license-widget-item-icon--partner" aria-hidden="true"></span>
					<span class="license-widget-item-content">
						${this.getTitle()}
					</span>
				</span>
				<span class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right" aria-hidden="true"></span>
			</span>
		`;
		}
		getTitle() {
			return this.cache.remember('title', () => {
				return main_core.Tag.render`
				<span class="license-widget-item-name">
					<span>
						${this.getOptions().title}
					</span>
				</span>
			`;
			});
		}
	}

	class PurchaseHistoryContent extends Content {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Bitrix24.LicenseWidget.Content.Orders');
		}
		getConfig() {
			return {
				html: this.getLayout(),
				minHeight: '50px'
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<form
					id="form-purchase-history"
					class="license-widget-item-form --purchase-history"
					action="${this.getOptions().link}"
					method="post"
					target="_blank"
				>
					<input type="hidden" name="license_key" value="${this.getOptions().hashKey}">
					<button
						type="submit"
						data-id="license-widget-block-orders"
						class="license-widget-item license-widget-item--secondary --pointer"
					>
						<span class="license-widget-inner">
							<span class="license-widget-content">
								<span class="license-widget-item-icon license-widget-item-icon--order" aria-hidden="true"></span>
								<span class="license-widget-item-content">
									${this.getTitle()}
								</span>
							</span>
							<span class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right" aria-hidden="true"></span>
						</span>
					</button>
				</form>
			`;
			});
		}
		getTitle() {
			return this.cache.remember('title', () => {
				return main_core.Tag.render`
				<span class="license-widget-item-name">
					<span>
						${this.getOptions().text}
					</span>
				</span>
			`;
			});
		}
	}

	class TelephonyContent extends Content {
		constructor(options) {
			super(options);
			this.setEventNamespace('BX.Bitrix24.LicenseWidget.Content.Telephony');
		}
		getConfig() {
			return {
				html: this.getLayout(),
				minHeight: '43px',
				sizeLoader: 30
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<a
					href="${this.getOptions().link}"
					data-id="license-widget-block-telephony"
					class="license-widget-item license-widget-item--secondary --pointer"
				>
					<span class="license-widget-inner">
						<span class="license-widget-content">
							<span
								class="license-widget-item-icon ${this.getOptions().isActive ? 'license-widget-item-icon--tel-active' : 'license-widget-item-icon--tel'}"
								aria-hidden="true"
							></span>
							<span class="license-widget-item-content">
								<span class="license-widget-item-name">
									${this.getOptions().title}
								</span>
							</span>
						</span>
						<span class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right" aria-hidden="true"></span>
					</span>
				</a>
			`;
			});
		}
	}

	class UpdatesContent extends Content {
		getConfig() {
			return {
				html: this.getLayout(),
				minHeight: '43px',
				sizeLoader: 30
			};
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				if (this.getOptions().isAdminRestricted) {
					const onclick = event => {
						AdminRestrictedPopup.show(event.currentTarget);
					};
					return main_core.Tag.render`
					<button
						type="button"
						onclick="${onclick}"
						data-id="license-widget-block-whatsnew"
						class="license-widget-item license-widget-item--secondary --pointer"
					>
						${this.#getLayoutContent()}
					</button>
				`;
				}
				return main_core.Tag.render`
				<a
					href="${this.getOptions().link}"
					target="_blank"
					rel="noopener noreferrer"
					data-id="license-widget-block-whatsnew"
					class="license-widget-item license-widget-item--secondary --pointer"
				>
					${this.#getLayoutContent()}
				</a>
			`;
			});
		}
		#getLayoutContent() {
			return main_core.Tag.render`
			<span class="license-widget-inner">
				<span class="license-widget-content">
					${this.getMainIcon()}
					<span class="license-widget-item-content">
						${this.getTitle()}
					</span>
				</span>
				<span class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right" aria-hidden="true"></span>
			</span>
		`;
		}
		getMainIcon() {
			return this.cache.remember('main-icon', () => {
				return main_core.Tag.render`
				<span class="license-widget-item-icon license-widget-item-icon--updates" aria-hidden="true"></span>
			`;
			});
		}
		getTitle() {
			return this.cache.remember('title', () => {
				return main_core.Tag.render`
				<span class="license-widget-item-name">
					<span>
						${this.getOptions().title}
					</span>
				</span>
			`;
			});
		}
	}

	class Popup extends main_core_events.EventEmitter {
		#cache = new main_core.Cache.MemoryCache();
		constructor(options) {
			super();
			this.setOptions(options);
			this.setEventNamespace('BX.Intranet.LicenseWidget.Popup');
			this.setEventHandlers();
		}
		setOptions(options) {
			this.#cache.set('options', options);
		}
		getOptions() {
			return this.#cache.get('options', {});
		}
		show() {
			this.getBasePopup().show();
			this.emit('show');
		}
		close() {
			this.getBasePopup().close();
		}
		getBasePopup() {
			return this.#cache.remember('popup', () => {
				this.emit('init');
				return new ui_popupcomponentsmaker.PopupComponentsMaker({
					target: this.getOptions().target,
					width: 374,
					content: this.#getContent(),
					popupLoader: this.getOptions().loader
				});
			});
		}
		#getContent() {
			return this.#cache.remember('content', () => {
				const content = [];
				if (this.getOptions().content.license.isAvailable) {
					content.push(this.#getLicenseContent().getConfig());
				}
				if (this.getOptions().content.market.isAvailable) {
					content.push(this.#getMarketContent(false).getConfig());
				}
				if (this.getOptions().content.baas.isAvailable) {
					content.push(this.#getBaasContent(false).getConfig());
				}
				if (this.getOptions().content.integrator?.isAvailable) {
					content.push(this.#getIntegratorContent(false).getConfig());
				}
				content.push(this.#getPurchaseHistoryContent().getConfig());
				if (this.getOptions().content.telephony.isAvailable) {
					content.push({
						html: [this.#getTelephonyContent().getConfig(), this.#getUpdatesContent().getConfig()]
					});
				} else {
					content.push(this.#getUpdatesContent().getConfig());
				}
				if (this.getOptions().content.partner.isAvailable && !this.getOptions().content.integrator?.isAvailable) {
					content.push(this.#getPartnerContent().getConfig());
				}
				return content;
			});
		}
		#getLicenseContent() {
			return this.#cache.remember('license-content', () => {
				return new LicenseContent({
					...this.getOptions().content.license
				});
			});
		}
		#getMarketContent(small) {
			return this.#cache.remember('market-content', () => {
				return new MarketContent({
					...this.getOptions().content.market,
					isSmall: small
				});
			});
		}
		#getBaasContent(small) {
			return this.#cache.remember('baas-content', () => {
				return new BaasContent({
					...this.getOptions().content.baas,
					licensePopupTarget: this.getOptions().target,
					licensePopup: this,
					isAdmin: this.getOptions().isAdmin,
					isSmall: small
				});
			});
		}
		#getIntegratorContent(small) {
			return this.#cache.remember('integrator-content', () => {
				return new IntegratorContent({
					...this.getOptions().content.integrator
				});
			});
		}
		#getPurchaseHistoryContent() {
			return this.#cache.remember('purchase-history-content', () => {
				return new PurchaseHistoryContent({
					...this.getOptions().content['purchase-history']
				});
			});
		}
		#getTelephonyContent() {
			return this.#cache.remember('telephony-content', () => {
				return new TelephonyContent({
					...this.getOptions().content.telephony
				});
			});
		}
		#getUpdatesContent() {
			return this.#cache.remember('updates-content', () => {
				return new UpdatesContent({
					...this.getOptions().content.updates
				});
			});
		}
		#getPartnerContent() {
			return this.#cache.remember('partner-content', () => {
				return new PartnerContent({
					...this.getOptions().content.partner
				});
			});
		}
		setEventHandlers() {
			const close = () => {
				this.close();
			};
			this.subscribe('init', () => {
				main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onOpenStart', close);
				main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.LicenseWidget.Popup:openChild', close);
			});
		}
	}

	class LicenseWidget {
		#cache = new main_core.Cache.MemoryCache();
		static #instance;
		static getInstance() {
			if (!this.#instance) {
				this.#instance = new this();
			}
			return this.#instance;
		}
		show() {
			if (this.#getPopup().getBasePopup().isShown()) {
				return;
			}
			this.#getPopup().show();
		}
		setOptions(options) {
			this.#cache.set('options', options);
			return this;
		}
		getOptions() {
			return this.#cache.get('options', {});
		}
		#getPopup() {
			return this.#cache.remember('popup', () => {
				return new Popup({
					target: this.getOptions().buttonWrapper,
					loader: this.getOptions().loader,
					content: {
						...this.getOptions().data
					}
				});
			});
		}
	}

	exports.LicenseWidget = LicenseWidget;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Event, BX.UI, BX.UI, BX.Main, BX.UI, BX.UI.Feedback, BX, BX.Intranet);
//# sourceMappingURL=license-widget.bundle.js.map
