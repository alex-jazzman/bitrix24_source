/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, crm_integration_analytics, ui_designTokens, main_popup, ui_analytics, ui_confetti, ui_lottie, ui_notification, crm_timeline_tools, ui_feedback_form, ui_sidepanel, ui_system_highlighter, crm_ai_nameService) {
	'use strict';

	class Base {
		#data = null;
		#popup = null;
		#bindElement = null;
		#isConfettiShowed = true;
		#isPreparing = false;
		params = {};
		constructor(params = {}) {
			this.params = params;
			if (main_core.Type.isBoolean(this.params.showConfetti)) {
				this.#isConfettiShowed = !this.params.showConfetti;
			}
		}
		getType() {
			throw new Error('Must be implement in child class');
		}
		async show(forceShowConfetti = false, onCloseCallback = null) {
			const data = await this.getData();
			if (data === null) {
				return;
			}
			if (this.#popup === null) {
				this.#popup = new main_popup.Popup(this.getPopupParams(data, {
					forceShowConfetti,
					onCloseCallback
				}));
			}
			this.#popup.show();
			this.#popup.adjustPosition();
		}
		getPopupParams(data, params = {}) {
			return {
				id: `crm_repeat_sale_widget_${this.getType()}`,
				bindElement: this.#getBindElementData(),
				content: this.getPopupContent(data),
				cacheable: false,
				isScrollBlock: false,
				className: `crm-repeat-sale-widget-popup --${this.getType()}`,
				closeByEsc: true,
				closeIcon: !this.isAutoHidePopup(),
				padding: 16,
				width: this.getPopupWidth(),
				maxHeight: 500,
				overlay: null,
				autoHide: this.isAutoHidePopup(),
				events: {
					onclose: () => {
						this.onClose();
						if (main_core.Type.isFunction(params?.onCloseCallback)) {
							params.onCloseCallback();
						}
					},
					onFirstShow: () => {
						this.onFirstShow();
						if (this.#isConfettiShowed && params?.forceShowConfetti !== true) {
							return;
						}
						setTimeout(() => {
							this.#showConfetti();
							this.#isConfettiShowed = true;
						}, 100);
					}
				}
			};
		}
		#getBindElementData() {
			const bindElement = this.#getParentBindElement();
			const bindElementRect = bindElement.getBoundingClientRect();
			return {
				top: bindElementRect.top + bindElementRect.height + 5 + window.pageYOffset,
				left: bindElementRect.right - bindElement.clientWidth / 2 - this.getPopupWidth() / 2 + window.pageXOffset
			};
		}
		#getParentBindElement() {
			const hasParentButton = Boolean(this.#bindElement.closest('button'));
			const hasParentLink = Boolean(this.#bindElement.closest('a'));
			if (hasParentButton) {
				return this.#bindElement.closest('button');
			}
			if (hasParentLink) {
				return this.#bindElement.closest('a');
			}
			return this.#bindElement;
		}
		getPopupWidth() {
			return 469;
		}
		isAutoHidePopup() {
			return false;
		}
		onFirstShow() {
			// may be implement in child class
		}
		getPopupContent(data = null) {
			throw new Error('Must be implement in child class');
		}
		setPopupContent(content) {
			this.#popup.setContent(content);
		}
		onClose() {
			this.#sendAnalyticsCloseEvent();
			if (this.params.showConfetti) {
				void main_core.ajax.runAction('crm.repeatsale.widget.incrementShowedConfettiCount');
			}
			this.#popup = null;
		}
		#sendAnalyticsCloseEvent() {
			const type = this.getAnalyticsType();
			const subSection = this.getAnalyticsSubSection();
			ui_analytics.sendData(crm_integration_analytics.Builder.RepeatSale.Banner.CloseEvent.createDefault(type, subSection).buildData());
		}
		getAnalyticsType() {
			return '';
		}
		#showConfetti() {
			const container = this.#popup?.getPopupContainer();
			if (!container) {
				return;
			}
			let canvas = null;
			if (container.getElementsByTagName('canvas').length === 0) {
				canvas = main_core.Tag.render`<canvas></canvas>`;
				main_core.Dom.style(canvas, {
					position: 'fixed',
					top: 0,
					left: 0,
					pointerEvents: 'none',
					zIndex: '9',
					width: '100%',
					height: '100%'
				});
				main_core.Dom.append(canvas, this.#popup.getPopupContainer());
			} else {
				canvas = container.getElementsByTagName('canvas')[0];
			}
			const confetti = ui_confetti.Confetti.create(canvas, {
				resize: true,
				useWorker: true
			});
			confetti({
				particleCount: 400,
				origin: {
					y: 1.2,
					x: 0
				},
				spread: 100
			});
		}
		async getData() {
			this.#data = await this.fetchData();
			return this.#data;
		}
		async fetchData() {
			if (this.#isPreparing) {
				return Promise.resolve(null);
			}
			this.#isPreparing = true;
			return new Promise(resolve => {
				main_core.ajax.runAction(this.getFetchUrl(), {
					data: this.getFetchParams()
				}).then(response => {
					this.#isPreparing = false;
					if (response.status === 'success') {
						resolve(response.data);
						return;
					}
					this.showError();
				}, () => {
					this.#isPreparing = false;
					this.showError();
				}).catch(response => {
					this.#isPreparing = false;
					this.showError();
					throw response;
				});
			});
		}
		getFetchUrl() {
			throw new Error('Must be implement in child class');
		}
		getFetchParams() {
			return {};
		}
		showError() {
			const messageCode = 'CRM_REPEAT_SALE_WIDGET_ERROR';
			ui_notification.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage(messageCode),
				autoHideDelay: 6000
			});
		}
		setBindElement(element) {
			this.#bindElement = element;
			return this;
		}
		getAnalyticsSubSection() {
			return this.#getParentBindElement().dataset.subsection ?? null;
		}
		isShown() {
			return this.#popup?.isShown();
		}
		close() {
			this.#popup?.close();
		}
		renderLottieAnimation() {
			const container = main_core.Tag.render`
			<div class="crm-rs__w-lottie-container">
				<div ref="lottie" class="crm-rs__w-lottie"></div>
			</div>
		`;
			const mainAnimation = ui_lottie.Lottie.loadAnimation({
				path: '/bitrix/js/crm/repeat-sale/widget/lottie/animation.json',
				container: container.lottie,
				renderer: 'svg',
				loop: true,
				autoplay: true
			});
			mainAnimation.setSpeed(0.75);
			return container.root;
		}
	}

	class Footer {
		#showSettingsButton = false;
		#isGlowingSettingsButton = false;
		#analytics = {};
		constructor(options = {}) {
			this.#showSettingsButton = options.showSettingsButton ?? false;
			this.#isGlowingSettingsButton = options.isGlowingSettingsButton ?? false;
			this.#analytics = options.analytics ?? {};
		}
		getFooterContent() {
			return main_core.Tag.render`
			<div>
				<div class="crm-rs__w-footer-row">
					${this.#getFeedbackButton()}
					${this.#getSettingsButton()}
				</div>
			</div>
		`;
		}
		#getFeedbackButton() {
			if (!main_core.Type.isArrayFilled(this.#getFeedbackFormParams())) {
				return main_core.Tag.render`<div></div>`;
			}
			return main_core.Tag.render`
			<div
				onclick="${this.#onFeedbackClick.bind(this)}"
				onkeydown="${event => this.#onButtonKeyDown(event, this.#onFeedbackClick.bind(this))}"
				class="crm-rs__w-footer-button --feedback"
				data-testid="repeat-sale-widget-footer-feedback"
				role="button"
				tabindex="0"
			>
				${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_FOOTER_FEEDBACK')}
			</div>
		`;
		}
		#getSettingsButton() {
			if (!this.#showSettingsButton) {
				return null;
			}
			return main_core.Tag.render`
			<div
				onclick="${this.#onSettingsClick.bind(this)}"
				onkeydown="${event => this.#onButtonKeyDown(event, this.#onSettingsClick.bind(this))}"
				class="crm-rs__w-footer-button --settings ${this.#isGlowingSettingsButton ? '--glowing' : ''}"
				data-testid="repeat-sale-widget-footer-settings"
				role="button"
				tabindex="0"
			>
				${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_FOOTER_SETTINGS')}
				${this.#isGlowingSettingsButton ? '<span class="ui-highlighter --with-glow --glow-md --border-md"></span>' : ''}
			</div>
		`;
		}

		// Both footer buttons are divs, so the browser turns neither Enter nor Space into a click on its
		// own, and Space would scroll the popup instead.
		#onButtonKeyDown(event, activate) {
			if (event.key !== 'Enter' && event.key !== ' ') {
				return;
			}
			event.preventDefault();
			activate();
		}
		#onSettingsClick() {
			const eventBuilder = this.#getClickEventBuilder();
			eventBuilder.setElement('config');
			ui_analytics.sendData(eventBuilder.buildData());
			ui_sidepanel.SidePanel.Instance.open('/crm/repeat-sale-segment/');
		}
		#onFeedbackClick() {
			const eventBuilder = this.#getClickEventBuilder();
			eventBuilder.setElement('feedback');
			ui_analytics.sendData(eventBuilder.buildData());
			this.#showFeedbackCrmForm();
		}
		#showFeedbackCrmForm() {
			BX.UI.Feedback.Form.open({
				id: Math.random().toString(),
				forms: this.#getFeedbackFormParams()
			});
		}
		#getFeedbackFormParams() {
			return main_core.Extension.getSettings('crm.repeat-sale.widget').get('feedbackFormParams');
		}
		#getClickEventBuilder() {
			const type = this.#analytics.type;
			const subSection = this.#analytics.subSection;
			return crm_integration_analytics.Builder.RepeatSale.Banner.ClickEvent.createDefault(type, subSection);
		}
	}

	const PeriodType = Object.freeze({
		day30: 0,
		quarter: 1,
		halfYear: 2,
		year: 3
	});
	const WidgetType = Object.freeze({
		start: 'start',
		forceStart: 'forceStart',
		statistics: 'statistics'
	});

	// @todo need refactor and merge with start.js
	class ForceStart extends Base {
		#isFlowStarted = null;
		#showSettingsButton = true;
		#hasClients = false;
		#canEnableFeature = false;
		#flowExpectedEnableTimestamp = null;
		constructor(params) {
			super(params);
			this.#showSettingsButton = params.showSettingsButton ?? true;
		}
		getType() {
			return WidgetType.forceStart;
		}
		onClose() {
			super.onClose();
			void main_core.ajax.runAction('crm.repeatsale.widget.incrementShowedFlowStartCount');
			if (this.#hasClients && !this.#isFlowStarted && this.#flowExpectedEnableTimestamp === null && this.#canEnableFeature) {
				void main_core.ajax.runAction('crm.repeatsale.flow.saveExpectedEnableDate');
			}
		}
		getPopupContent(data = null) {
			if (main_core.Type.isObject(data)) {
				if (this.#isFlowStarted === null) {
					const {
						isFlowStarted,
						canEnableFeature,
						flowExpectedEnableTimestamp
					} = data;
					this.#isFlowStarted = isFlowStarted;
					this.#canEnableFeature = canEnableFeature ?? false;
					this.#flowExpectedEnableTimestamp = flowExpectedEnableTimestamp || null;
				}
				this.#hasClients = this.#isHasClients(data);
			}
			return main_core.Tag.render`
			<div>
				<header class="crm-rs__w-header">
					${this.#getTitle()}
				</header>
				${this.#getBodyContentWithClients()}
				${this.#getFooterContent()}
			</div>
		`;
		}
		#getBodyContentWithClients() {
			return main_core.Tag.render`
			<div class="crm-rs__w-body">
				<div class="crm-rs__w-body-content">
					<div class="crm-rs__w-body-title">
						${this.#getBodyTitle()}
					</div>
					${this.#canEnableFeature ? this.#getButton() : null}
				</div>
				${this.#getBubble()}
			</div>
		`;
		}
		#getBubble() {
			const hasClients = this.#hasClients;
			return main_core.Tag.render`
			<div class="crm-rs__w-body-bubble ${this.#isFlowStarted ? '--flow-started' : ''} ${hasClients ? '--has-clients' : ''}">
				${this.renderLottieAnimation()}
				<div class="crm-rs__w-body-icon"></div>
			</div>
		`;
		}
		#getFooterContent() {
			return main_core.Tag.render`
			<footer class="crm-rs__w-footer">
				${this.#getDescription()}
			</footer>
		`;
		}
		#getTitle() {
			if (this.#isFlowStarted) {
				return main_core.Tag.render`
				<span>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_FLOW_STARTED_POPUP_TITLE')}</span>
			`;
			}
			return main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_TITLE');
		}
		#getBodyTitle() {
			if (this.#isFlowStarted) {
				return main_core.Tag.render`
				<span>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_FLOW_STARTED_TITLE')}</span>
			`;
			}
			return main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_TITLE');
		}
		#getButton() {
			if (this.#isFlowStarted) {
				return null;
			}
			return main_core.Tag.render`
			<div class="crm-rs__w-body-title-btn">
				<span
					onclick="${this.#onButtonClick.bind(this)}"
				>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_BTN_FORCE')}</span>
			</div>
		`;
		}
		#getDescription() {
			if (this.#isFlowStarted) {
				const footer = new Footer({
					showSettingsButton: this.#showSettingsButton,
					analytics: {
						type: this.getAnalyticsType(),
						subSection: this.getAnalyticsSubSection()
					}
				});
				return main_core.Tag.render`
				<div class="crm-rs__w-buttons-wrapper">
					${footer.getFooterContent()}
				</div>
			`;
			}
			const hasClients = this.#hasClients;
			const content = this.#getDescriptionContent();
			return main_core.Tag.render`
			<div class="crm-rs__w-body-description ${hasClients ? '--has-clients' : ''}">
				${hasClients ? null : '<div class="crm-rs__w-body-description-border"></div>'}
				<div class="crm-rs__w-body-description-text ${hasClients ? '--has-clients' : ''}">
					<span>${content}</span>
				</div>
				<div class="crm-rs__w-body-description-btn">
					<span
						onclick="${this.#onReadMoreButtonClick.bind(this)}"
					>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_BTN_READ_MORE')}</span>
				</div>
			</div>
		`;
		}
		#getDescriptionContent() {
			let code = null;
			const replacements = {};
			let isNeedReplaceLink = false;
			let isNeedReplaceDate = false;
			if (this.#flowExpectedEnableTimestamp === null && this.#canEnableFeature) {
				if (this.params.isRepeatSaleGrid) {
					code = 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITHOUT_TIME_IN_RS_GRID';
				} else {
					code = 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITHOUT_TIME';
					isNeedReplaceLink = true;
				}
				isNeedReplaceLink = true;
			} else if (this.#flowExpectedEnableTimestamp === null) {
				code = 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITHOUT_TIME_AND_PERMISSIONS';
			} else if (this.#canEnableFeature) {
				if (this.params.isRepeatSaleGrid) {
					code = 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITH_TIME_AND_PERMISSIONS_IN_RS_GRID';
				} else {
					code = 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITH_TIME_AND_PERMISSIONS';
					isNeedReplaceLink = true;
				}
				isNeedReplaceDate = true;
			} else {
				code = 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITH_TIME';
				isNeedReplaceDate = true;
			}
			if (isNeedReplaceLink) {
				replacements['[link]'] = '<a class="ui-link" href="/crm/repeat-sale-segment/">';
				replacements['[/link]'] = '</a>';
			}
			if (isNeedReplaceDate) {
				const userTime = crm_timeline_tools.DatetimeConverter.createFromServerTimestamp(this.#flowExpectedEnableTimestamp).toUserTime();
				replacements['#DATE#'] = userTime.toDateString();
				replacements['#TIME#'] = userTime.toTimeString();
			}
			return main_core.Loc.getMessage(code, replacements);
		}
		#onButtonClick() {
			main_core.ajax.runAction('crm.repeatsale.flow.enable').then(response => {
				if (response.status === 'success' && response.data === true) {
					this.#isFlowStarted = true;
					this.setPopupContent(this.getPopupContent());
					const instance = this.#getClickEventBuilder();
					instance.setElement('start_flow');
					instance.setEnableMode('manual');
					ui_analytics.sendData(instance.buildData());
					return;
				}
				this.showError();
				this.close();
			}, response => {
				this.showError();
				this.close();
			}).catch(response => {
				this.showError();
				this.close();
			});
		}
		#onReadMoreButtonClick() {
			const instance = this.#getClickEventBuilder();
			instance.setElement('info_button');
			ui_analytics.sendData(instance.buildData());
			this.#showReadMore();
		}
		#showReadMore() {
			top.BX?.Helper?.show('redirect=detail&code=25376986');
		}
		#isHasClients(data) {
			return data.count > 0;
		}
		getFetchUrl() {
			return 'crm.repeatsale.start.getData';
		}
		getFetchParams() {
			return {};
		}
		#getClickEventBuilder() {
			const type = this.getAnalyticsType();
			const subSection = this.getAnalyticsSubSection();
			return crm_integration_analytics.Builder.RepeatSale.Banner.ClickEvent.createDefault(type, subSection);
		}
		onFirstShow() {
			const type = this.getAnalyticsType();
			const subSection = this.getAnalyticsSubSection();
			this.#sendShowAnalytics(type, subSection);
		}
		#sendShowAnalytics(type, subSection) {
			const instance = crm_integration_analytics.Builder.RepeatSale.Banner.ViewEvent.createDefault(type, subSection);
			ui_analytics.sendData(instance.buildData());
		}
		getAnalyticsType() {
			return crm_integration_analytics.Dictionary.TYPE_REPEAT_SALE_BANNER_START_FORCE;
		}
	}

	class Start extends Base {
		#isFlowStarted = null;
		#showSettingsButton = true;
		#hasClients = false;
		constructor(params) {
			super(params);
			this.#showSettingsButton = params.showSettingsButton ?? true;
		}
		getType() {
			return WidgetType.start;
		}
		onClose() {
			super.onClose();
			void main_core.ajax.runAction('crm.repeatsale.widget.incrementShowedFlowStartCount');
		}
		getPopupContent(data = null) {
			if (main_core.Type.isObject(data)) {
				if (this.#isFlowStarted === null) {
					const {
						isFlowStarted
					} = data;
					this.#isFlowStarted = isFlowStarted;
				}
				this.#hasClients = this.#isHasClients(data);
			}
			return main_core.Tag.render`
			<div>
				<header class="crm-rs__w-header">
					${this.#getTitle()}
				</header>
				${this.#hasClients ? this.#getBodyContentWithClients() : this.#getBodyContent()}
				${this.#hasClients ? this.#getFooterContent() : null}
			</div>
		`;
		}
		#getBodyContent() {
			return main_core.Tag.render`
			<div class="crm-rs__w-body">
				<div class="crm-rs__w-body-content">
					<div class="crm-rs__w-body-title">
						${this.#getBodyTitle()}
					</div>
					${this.#getDescription()}
				</div>
				${this.#getBubble()}
			</div>
		`;
		}
		#getBodyContentWithClients() {
			return main_core.Tag.render`
			<div class="crm-rs__w-body">
				<div class="crm-rs__w-body-content --has-clients">
					<div class="crm-rs__w-body-title">
						${this.#getBodyTitle()}
					</div>
					${this.#getButton()}
				</div>
				${this.#getBubble()}
			</div>
		`;
		}
		#getBubble() {
			const hasClients = this.#hasClients;
			return main_core.Tag.render`
			<div class="crm-rs__w-body-bubble ${this.#isFlowStarted ? '--flow-started' : ''} ${hasClients ? '--has-clients' : ''}">
				${this.renderLottieAnimation()}
				<div class="crm-rs__w-body-icon"></div>
			</div>
		`;
		}
		#getFooterContent() {
			return main_core.Tag.render`
			<footer class="crm-rs__w-footer">
				${this.#getDescription()}
			</footer>
		`;
		}
		#getTitle() {
			if (this.#isFlowStarted) {
				return main_core.Tag.render`
				<span>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_FLOW_STARTED_POPUP_TITLE')}</span>
			`;
			}
			return main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_TITLE');
		}
		#getBodyTitle() {
			if (this.#isFlowStarted) {
				return main_core.Tag.render`
				<span>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_FLOW_STARTED_TITLE')}</span>
			`;
			}
			const code = this.#hasClients ? 'CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_TITLE_WITH_CLIENTS' : 'CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_TITLE_WITHOUT_CLIENTS';
			return main_core.Loc.getMessage(code);
		}
		#getButton() {
			if (this.#isFlowStarted) {
				return null;
			}
			return main_core.Tag.render`
			<div class="crm-rs__w-body-title-btn --has-clients">
				<span
					onclick="${this.#onButtonClick.bind(this)}"
				>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_BTN')}</span>
			</div>
		`;
		}
		#getDescription() {
			if (this.#isFlowStarted) {
				const footer = new Footer({
					showSettingsButton: this.#showSettingsButton,
					analytics: {
						type: this.getAnalyticsType(),
						subSection: this.getAnalyticsSubSection()
					}
				});
				return main_core.Tag.render`
				<div class="crm-rs__w-buttons-wrapper">
					${footer.getFooterContent()}
				</div>
			`;
			}
			const hasClients = this.#hasClients;
			const code = hasClients ? 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITH_CLIENTS' : 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITHOUT_CLIENTS';
			const content = main_core.Loc.getMessage(code, crm_ai_nameService.NameService.copilotNameReplacement());
			return main_core.Tag.render`
			<div class="crm-rs__w-body-description ${hasClients ? '--has-clients' : ''}">
				${hasClients ? null : '<div class="crm-rs__w-body-description-border"></div>'}
				<div class="crm-rs__w-body-description-text ${hasClients ? '--has-clients' : ''}">
					${content}
				</div>
				<div class="crm-rs__w-body-description-btn">
					<span
						onclick="${this.#onReadMoreButtonClick.bind(this)}"
					>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_BTN_READ_MORE')}</span>
				</div>
			</div>
		`;
		}
		#onButtonClick() {
			if (this.#hasClients) {
				main_core.ajax.runAction('crm.repeatsale.flow.enable').then(response => {
					if (response.status === 'success' && response.data === true) {
						this.#isFlowStarted = true;
						this.setPopupContent(this.getPopupContent());
						const instance = this.#getClickEventBuilder();
						instance.setElement('start_flow');
						instance.setEnableMode('manual');
						ui_analytics.sendData(instance.buildData());
						return;
					}
					this.showError();
					this.close();
				}, response => {
					this.showError();
					this.close();
				}).catch(response => {
					this.showError();
					this.close();
				});
			} else {
				this.#showReadMore();
			}
		}
		#onReadMoreButtonClick() {
			const instance = this.#getClickEventBuilder();
			instance.setElement('info_button');
			ui_analytics.sendData(instance.buildData());
			this.#showReadMore();
		}
		#showReadMore() {
			top.BX?.Helper?.show('redirect=detail&code=25376986');
		}
		#isHasClients(data) {
			return data.count > 0;
		}
		getFetchUrl() {
			return 'crm.repeatsale.start.getData';
		}
		getFetchParams() {
			return {};
		}
		#getClickEventBuilder() {
			const type = this.getAnalyticsType();
			const subSection = this.getAnalyticsSubSection();
			return crm_integration_analytics.Builder.RepeatSale.Banner.ClickEvent.createDefault(type, subSection);
		}
		onFirstShow() {
			const type = this.getAnalyticsType();
			const subSection = this.getAnalyticsSubSection();
			this.#sendShowAnalytics(type, subSection);
		}
		#sendShowAnalytics(type, subSection) {
			const instance = crm_integration_analytics.Builder.RepeatSale.Banner.ViewEvent.createDefault(type, subSection);
			ui_analytics.sendData(instance.buildData());
		}
		getAnalyticsType() {
			return this.#hasClients ? crm_integration_analytics.Dictionary.TYPE_REPEAT_SALE_BANNER_START : crm_integration_analytics.Dictionary.TYPE_REPEAT_SALE_BANNER_START_EMPTY;
		}
	}

	// The statistics content and its styles are heavier than the rest of the widget put together, while the
	// button that shows the widget is on every CRM page. Its extension is asked for on the first opening of
	// the statistics; main.core keeps the loaded extension, so reopening costs nothing.
	const StatisticsExtension = 'crm.repeat-sale.widget.statistics';
	class ContentFactory {
		static async getContentInstance(widgetType, params = {}) {
			switch (widgetType) {
				case WidgetType.start:
					return new Start(params);
				case WidgetType.forceStart:
					return new ForceStart(params);
				case WidgetType.statistics:
					{
						const {
							Statistics
						} = await main_core.Runtime.loadExtension(StatisticsExtension);
						return new Statistics(params);
					}
				default:
					return null;
			}
		}
	}

	class Widget {
		static instance = [];
		#widgetType;
		#params = {};
		#bindElement = null;
		#contentPopupPromise = null;
		#contentPopupInstance = null;
		static execute(widgetType, bindElement = null, params = {}, event = null, onCloseCallback = null) {
			if (!this.instance[widgetType]) {
				this.instance[widgetType] = new Widget(widgetType, bindElement, params);
			}
			const widget = this.instance[widgetType];
			if (widget.isShown()) {
				widget.close();
				return;
			}
			const forceShowConfetti = (event?.altKey && event?.ctrlKey) ?? false;
			void widget.show(forceShowConfetti, onCloseCallback);
		}
		constructor(widgetType, bindElement = null, params = {}) {
			this.#widgetType = widgetType;
			this.#params = params;
			this.#bindElement = bindElement;
		}

		// The content of a widget type may live in an extension of its own (statistics), so it is built on
		// the first opening rather than in the constructor. The promise is kept, so reopening the widget
		// reuses the content instance instead of asking for the extension again.
		#getContentPopup() {
			if (this.#contentPopupPromise === null) {
				this.#contentPopupPromise = ContentFactory.getContentInstance(this.#widgetType, this.#params).then(contentPopup => {
					if (contentPopup !== null && this.#bindElement) {
						contentPopup.setBindElement(this.#bindElement);
					}
					this.#contentPopupInstance = contentPopup;
					return contentPopup;
				});
			}
			return this.#contentPopupPromise;
		}
		async show(forceShowConfetti = false, onCloseCallback = null) {
			const contentPopup = await this.#getContentPopup();
			void contentPopup?.show(forceShowConfetti, onCloseCallback);
		}
		isShown() {
			return this.#contentPopupInstance?.isShown() ?? false;
		}
		close() {
			this.#contentPopupInstance?.close();
		}
	}

	exports.PeriodType = PeriodType;
	exports.Widget = Widget;
	exports.WidgetContentBase = Base;
	exports.WidgetFooter = Footer;
	exports.WidgetType = WidgetType;

})(this.BX.Crm.RepeatSale = this.BX.Crm.RepeatSale || {}, BX, BX.Crm.Integration.Analytics, window, BX.Main, BX.UI.Analytics, BX.UI, BX.UI, BX.UI.Notification, BX.Crm.Timeline, BX.UI.Feedback, BX, BX.UI.System, BX.Crm.AI);
//# sourceMappingURL=widget.bundle.js.map
