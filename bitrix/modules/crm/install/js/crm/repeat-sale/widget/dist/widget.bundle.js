/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, crm_integration_analytics, main_core, ui_designTokens, main_popup, ui_analytics, ui_confetti, ui_lottie, ui_notification, crm_timeline_tools, ui_feedback_form, ui_system_highlighter, ui_designTokens_air, crm_ai_nameService) {
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
		constructor(showSettingsButton = false, analytics = {}, isGlowingSettingsButton = false) {
			this.#showSettingsButton = showSettingsButton;
			this.#isGlowingSettingsButton = isGlowingSettingsButton;
			this.#analytics = analytics;
		}
		getFooterContent() {
			return main_core.Tag.render`
			<div class="crm-rs__w-footer-row">
				${this.#getFeedbackButton()}
				${this.#getSettingsButton()}
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
				class="crm-rs__w-footer-button --feedback"
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
				class="crm-rs__w-footer-button --settings ${this.#isGlowingSettingsButton ? '--glowing' : ''}"
			>
				${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_FOOTER_SETTINGS')}
				${this.#isGlowingSettingsButton ? '<span class="ui-highlighter --with-glow --glow-md --border-md"></span>' : ''}
			</div>
		`;
		}
		#onSettingsClick() {
			const eventBuilder = this.#getClickEventBuilder();
			eventBuilder.setElement('config');
			ui_analytics.sendData(eventBuilder.buildData());
			window.location.href = '/crm/repeat-sale-segment/';
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
			if (!this.#isFlowStarted && this.#flowExpectedEnableTimestamp === null && this.#canEnableFeature) {
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
					this.#flowExpectedEnableTimestamp = flowExpectedEnableTimestamp ?? null;
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
				const footer = new Footer(this.#showSettingsButton, {
					type: this.getAnalyticsType(),
					subSection: this.getAnalyticsSubSection()
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
				isNeedReplaceDate = true;
			} else if (this.#canEnableFeature) {
				if (this.params.isRepeatSaleGrid) {
					code = 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITHOUT_TIME_IN_RS_GRID';
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
				if (response.status === 'success') {
					this.#isFlowStarted = true;
					this.setPopupContent(this.getPopupContent());
					const instance = this.#getClickEventBuilder();
					instance.setElement('start_flow');
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
				const footer = new Footer(this.#showSettingsButton, {
					type: this.getAnalyticsType(),
					subSection: this.getAnalyticsSubSection()
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
					if (response.status === 'success') {
						this.#isFlowStarted = true;
						this.setPopupContent(this.getPopupContent());
						const instance = this.#getClickEventBuilder();
						instance.setElement('start_flow');
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
			return this.#hasClients ? crm_integration_analytics.Dictionary.TYPE_REPEAT_SALE_BANNER_START_EMPTY : crm_integration_analytics.Dictionary.TYPE_REPEAT_SALE_BANNER_START;
		}
	}

	const UserOptions = main_core.Reflection.namespace('BX.userOptions');
	class Statistics extends Base {
		#periodType = PeriodType.day30;
		#showSettingsButton = true;
		#isGlowingSettingsButton = false;
		#hint = null;
		constructor(params) {
			super(params);
			this.#showSettingsButton = params.showSettingsButton ?? true;
			this.#isGlowingSettingsButton = params.isGlowingSettingsButton ?? false;
			this.#periodType = params.periodTypeId ?? PeriodType.day30;
		}
		getType() {
			return WidgetType.statistics;
		}
		getPopupWidth() {
			return 489;
		}
		isAutoHidePopup() {
			return true;
		}
		#getLoadingPopupContent() {
			return main_core.Tag.render`
			<div>
				<header class="crm-rs__w-header --statistics">
					${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE')}
				</header>
				<div class="crm-rs__w-body">
					<div class="crm-rs__w-body-loading-bubble">
						<div class="crm-rs__w-body-loading-bubble-wrapper">
							${this.renderLottieAnimation()}
							${this.#renderLoadingLottieAnimation()}
						</div>
						<div class="crm-rs__w-body-bubble-subtitle">
							${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_LOADING')}
						</div>
					</div>
				</div>
				<footer class="crm-rs__w-footer --statistics">
					${this.#getFooterContent()}
				</footer>
			</div>
		`;
		}
		#renderLoadingLottieAnimation() {
			const container = main_core.Tag.render`
			<div class="crm-rs__w-loading-lottie-container">
				<div ref="lottie" class="crm-rs__w-lottie"></div>
			</div>
		`;
			const mainAnimation = ui_lottie.Lottie.loadAnimation({
				path: '/bitrix/js/crm/repeat-sale/widget/lottie/loading.json',
				container: container.lottie,
				renderer: 'svg',
				loop: true,
				autoplay: true
			});
			mainAnimation.setSpeed(0.75);
			return container.root;
		}
		getPopupContent(data = null) {
			return main_core.Tag.render`
			<div>
				<header class="crm-rs__w-header --statistics">
					${this.#getPopupTitle(data)}
				</header>
				<div class="crm-rs__w-body">
					<div class="crm-rs__w-body-content --statistics">
						<div class="crm-rs__w-body-statistics-table-container">
							<table class="crm-rs__w-body-statistics-table">
								<thead>
									<tr>
										<th></th>
										<th>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_COUNT')}</th>
										<th>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_SUM')}</th>
									</tr>
								</thead>
								<tbody class="crm-rs__w-body-statistics-table-body">
									<tr>
										<td><span>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_DEALS_IN_WORK')}</span></td>
										<td><span>${data.repeatSaleProcessCount ?? 0}</span></td>
										<td><span>${data.repeatSaleProcessSum ?? 0}</span></td>
									</tr>
									<tr>
										<td>${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_WIN_DEALS')}</td>
										<td>${data.repeatSaleWinCount ?? 0}</td>
										<td>${data.repeatSaleWinSum ?? 0}</td>
									</tr>
								</tbody>
								<tfoot class="crm-rs__w-body-statistics-table-footer">
									<tr>
										<td>
											<div>
												${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_CONVERSION')}
												<span 
													class="crm-rs__w-body-statistics-hint"
													onmouseenter="${this.#showHint.bind(this)}"
													onmouseleave="${this.#hideHint.bind(this)}"
												></span>
											</div>
										</td>
										<td><span>${data.conversionByCount}${data.conversionByCount > 0 ? '%' : ''}</span></td>
										<td>${data.conversionBySum}${data.conversionBySum > 0 ? '%' : ''}</td>
									</tr>
								</tfoot>
							</table>
						</div>
					</div>
				</div>
				<footer class="crm-rs__w-footer --statistics">
					${this.#getFooterContent()}
				</footer>
			</div>
		`;
		}
		#getPopupTitle(data) {
			const repeatSaleForPeriodText = main_core.Tag.render`
			<span>
				${main_core.Loc.getMessagePlural('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE_TOTAL_DEALS', data.repeatSaleTotalCount ?? 0, {
			'#COUNT#': data.repeatSaleTotalCount ?? 0
		})}
			</span>
		`;
			const repeatSaleTodayCount = data.repeatSaleTodayCount ?? 0;
			let repeatSaleTodayText = null;
			if (repeatSaleTodayCount > 0) {
				repeatSaleTodayText = main_core.Tag.render`
				<span>
					${main_core.Loc.getMessagePlural('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE_TODAY_DEALS', data.repeatSaleTodayCount ?? 0, {
				'#COUNT#': data.repeatSaleTodayCount ?? 0
			})}
				</span>
			`;
			} else {
				const todayNoDealsMessage = main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE_TODAY_NO_DEALS');
				if (todayNoDealsMessage) {
					repeatSaleTodayText = main_core.Tag.render`<span>${todayNoDealsMessage}</span>`;
				}
			}
			return main_core.Tag.render`
			<div>
				${main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE')}
				<div class="crm-rs__w-header-span-wrapper">
					${repeatSaleForPeriodText}
					${repeatSaleTodayText}
				</div>
			</div>
			<div 
				class="crm-rs__w-period-selector"
				onclick="${this.#onPeriodChange.bind(this, this.#periodType)}"
			>
				${this.#getSelectorTitle()}
				<span class="crm-rs__w-period-selector-icon"></span>
			</div>
		`;
		}
		#getSelectorTitle() {
			let code = null;
			const periodType = Number(this.#periodType);
			switch (periodType) {
				case PeriodType.day30:
					code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_DAY_30';
					break;
				case PeriodType.quarter:
					code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_QUARTER';
					break;
				case PeriodType.halfYear:
					code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_HALF_YEAR';
					break;
				case PeriodType.year:
					code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_PERIOD_YEAR';
					break;
				default:
					throw new RangeError(`Unknown period type: ${periodType}`);
			}
			return main_core.Loc.getMessage(code);
		}
		#getFooterContent() {
			const footer = new Footer(this.#showSettingsButton, {
				type: this.getAnalyticsType(),
				subSection: this.getAnalyticsSubSection()
			}, this.#isGlowingSettingsButton);
			return footer.getFooterContent();
		}
		getAnalyticsType() {
			return crm_integration_analytics.Dictionary.TYPE_REPEAT_SALE_BANNER_STATISTICS;
		}
		getFetchUrl() {
			return 'crm.repeatsale.statistics.getData';
		}
		getFetchParams() {
			return {
				periodType: this.#periodType
			};
		}
		#onPeriodChange(periodTypeId) {
			let nextPeriodTypeId = PeriodType.day30;
			const periodTypeIds = Object.values(PeriodType);
			if (periodTypeIds.includes(periodTypeId)) {
				const index = periodTypeIds.indexOf(periodTypeId);
				if (index + 1 < periodTypeIds.length) {
					nextPeriodTypeId = index + 1;
				}
			}
			this.#savePeriodTypeId(nextPeriodTypeId);
			const data = {
				periodTypeId: nextPeriodTypeId
			};
			const eventBuilder = this.#getClickEventBuilder();
			eventBuilder.setElement('change_period');
			eventBuilder.setPeriod(nextPeriodTypeId);
			ui_analytics.sendData(eventBuilder.buildData());

			// @todo maybe pointless loader
			// const popup = PopupManager.getPopupById(`crm_repeat_sale_widget_${this.getType()}`);
			// if (popup)
			// {
			// 	popup.setContent(this.#getLoadingPopupContent());
			// }

			main_core.ajax.runAction(this.getFetchUrl(), {
				data
			}).then(response => {
				if (response.status === 'success') {
					const popup = main_popup.PopupManager.getPopupById(`crm_repeat_sale_widget_${this.getType()}`);
					if (popup === null) {
						return;
					}
					this.data = response.data;
					this.#periodType = nextPeriodTypeId;
					popup.setContent(this.getPopupContent(this.data));
					return;
				}
				this.showError();
			}, response => {
				//popup.setContent(this.getPopupContent(this.data));
				this.showError();
			}).catch(response => {
				//popup.setContent(this.getPopupContent(this.data));
				this.showError();
			});
		}
		#savePeriodTypeId(periodTypeId) {
			UserOptions.save('crm', 'repeat-sale', 'statistics-period-type-id', periodTypeId);
		}
		#showHint(event) {
			this.#getHintInstance().show(event.target, main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_CONVERSION_HINT'), true);
		}
		#hideHint() {
			this.#getHintInstance().hide();
		}
		#getHintInstance() {
			if (this.#hint === null) {
				this.#hint = BX.UI.Hint.createInstance({
					popupParameters: {
						autoHide: true,
						events: {
							onFirstShow: event => {
								event.getCompatData()[0].setOffset({
									offsetLeft: 9
								});
							}
						}
					}
				});
			}
			return this.#hint;
		}
		#getClickEventBuilder() {
			const type = this.getAnalyticsType();
			const subSection = this.getAnalyticsSubSection();
			return crm_integration_analytics.Builder.RepeatSale.Banner.ClickEvent.createDefault(type, subSection);
		}
	}

	class ContentFactory {
		static getContentInstance(widgetType, params = {}) {
			switch (widgetType) {
				case WidgetType.start:
					return new Start(params);
				case WidgetType.forceStart:
					return new ForceStart(params);
				case WidgetType.statistics:
					return new Statistics(params);
				default:
					return null;
			}
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
	class Widget {
		static instance = [];
		#contentPopupInstance = null;
		static execute(widgetType, bindElement = null, params = {}, event = null, onCloseCallback = null) {
			if (!this.instance[widgetType]) {
				this.instance[widgetType] = new Widget(widgetType, bindElement, params);
			}
			if (this.instance[widgetType].isShown()) {
				this.instance[widgetType].close();
			} else {
				const forceShowConfetti = (event?.altKey && event?.ctrlKey) ?? false;
				this.instance[widgetType].show(forceShowConfetti, onCloseCallback);
			}
		}
		constructor(widgetType, bindElement = null, params = {}) {
			this.#contentPopupInstance = ContentFactory.getContentInstance(widgetType, params);
			if (bindElement) {
				this.#contentPopupInstance.setBindElement(bindElement);
			}
		}
		show(forceShowConfetti = false, onCloseCallback = null) {
			this.#contentPopupInstance.show(forceShowConfetti, onCloseCallback);
		}
		isShown() {
			return this.#contentPopupInstance.isShown();
		}
		close() {
			this.#contentPopupInstance.close();
		}
	}

	exports.PeriodType = PeriodType;
	exports.Widget = Widget;
	exports.WidgetType = WidgetType;

})(this.BX.Crm.RepeatSale = this.BX.Crm.RepeatSale || {}, BX.Crm.Integration.Analytics, BX, BX, BX.Main, BX.UI.Analytics, BX.UI, BX.UI, BX.UI.Notification, BX.Crm.Timeline, BX.UI.Feedback, BX.UI.System, BX, BX.Crm.AI);
//# sourceMappingURL=widget.bundle.js.map
