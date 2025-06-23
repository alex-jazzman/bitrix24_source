/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports,ui_confetti,ui_notification,main_core,main_popup,ui_lottie) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2;
	var _data = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("data");
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _bindElement = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindElement");
	var _isConfettiShowed = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isConfettiShowed");
	var _showConfetti = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showConfetti");
	class Base {
	  constructor(params = {}) {
	    Object.defineProperty(this, _showConfetti, {
	      value: _showConfetti2
	    });
	    Object.defineProperty(this, _data, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _bindElement, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _isConfettiShowed, {
	      writable: true,
	      value: true
	    });
	    this.params = {};
	    this.params = params;
	    if (main_core.Type.isBoolean(this.params.showConfetti)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _isConfettiShowed)[_isConfettiShowed] = !this.params.showConfetti;
	    }
	  }
	  getType() {
	    throw new Error('Must be implement in child class');
	  }
	  async show(forceShowConfetti = false) {
	    const data = await this.getData();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] === null) {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = new main_popup.Popup(this.getPopupParams(data, {
	        forceShowConfetti
	      }));
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].show();
	  }
	  getPopupParams(data, params = {}) {
	    const hasParentButton = Boolean(babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement].closest('button'));
	    const hasParentLink = Boolean(babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement].closest('a'));
	    let bindElement = babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement];
	    if (hasParentButton) {
	      bindElement = babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement].closest('button');
	    } else if (hasParentLink) {
	      bindElement = babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement].closest('a');
	    }
	    const bindElementRect = bindElement.getBoundingClientRect();
	    return {
	      id: `crm_repeat_sale_widget_${this.getType()}`,
	      bindElement: {
	        top: bindElementRect.top + bindElementRect.height + 10,
	        left: bindElementRect.right - 410
	      },
	      content: this.getPopupContent(data),
	      cacheable: false,
	      isScrollBlock: true,
	      className: `crm-repeat-sale-widget-popup --${this.getType()}`,
	      closeByEsc: true,
	      closeIcon: true,
	      padding: 16,
	      width: 410,
	      maxHeight: 500,
	      overlay: null,
	      autoHide: true,
	      events: {
	        onclose: () => {
	          this.onClose();
	        },
	        onFirstShow: () => {
	          if (babelHelpers.classPrivateFieldLooseBase(this, _isConfettiShowed)[_isConfettiShowed] && (params == null ? void 0 : params.forceShowConfetti) !== true) {
	            return;
	          }
	          setTimeout(() => {
	            babelHelpers.classPrivateFieldLooseBase(this, _showConfetti)[_showConfetti]();
	            babelHelpers.classPrivateFieldLooseBase(this, _isConfettiShowed)[_isConfettiShowed] = true;
	          }, 100);
	        }
	      }
	    };
	  }
	  getPopupContent(data) {
	    throw new Error('Must be implement in child class');
	  }
	  setPopupContent(content) {
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].setContent(content);
	  }
	  onClose() {
	    if (this.params.showConfetti) {
	      void main_core.ajax.runAction('crm.repeatsale.widget.incrementShowedConfettiCount');
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = null;
	  }
	  async getData() {
	    babelHelpers.classPrivateFieldLooseBase(this, _data)[_data] = await this.fetchData();
	    return babelHelpers.classPrivateFieldLooseBase(this, _data)[_data];
	  }
	  async fetchData() {
	    return new Promise(resolve => {
	      main_core.ajax.runAction(this.getFetchUrl(), {
	        data: this.getFetchParams()
	      }).then(response => {
	        if (response.status === 'success') {
	          resolve(response.data);
	          return;
	        }
	        this.showError();
	      }, () => {
	        this.showError();
	      }).catch(response => {
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
	    babelHelpers.classPrivateFieldLooseBase(this, _bindElement)[_bindElement] = element;
	    return this;
	  }
	  isShown() {
	    var _babelHelpers$classPr;
	    return (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr.isShown();
	  }
	  close() {
	    var _babelHelpers$classPr2;
	    (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr2.close();
	  }
	  renderLottieAnimation() {
	    const container = main_core.Tag.render(_t || (_t = _`
			<div class="crm-rs__w-lottie-container">
				<div ref="lottie" class="crm-rs__w-lottie"></div>
			</div>
		`));
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
	function _showConfetti2() {
	  var _babelHelpers$classPr3;
	  const container = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) == null ? void 0 : _babelHelpers$classPr3.getPopupContainer();
	  if (!container) {
	    return;
	  }
	  let canvas = null;
	  if (container.getElementsByTagName('canvas').length === 0) {
	    canvas = main_core.Tag.render(_t2 || (_t2 = _`<canvas></canvas>`));
	    main_core.Dom.style(canvas, {
	      position: 'fixed',
	      top: 0,
	      left: 0,
	      pointerEvents: 'none',
	      zIndex: '9',
	      width: '100%',
	      height: '100%'
	    });
	    main_core.Dom.append(canvas, babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].getPopupContainer());
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

	let _$1 = t => t,
	  _t$1,
	  _t2$1,
	  _t3;
	var _showSettingsButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showSettingsButton");
	var _onSettingsClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSettingsClick");
	var _onFeedbackClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onFeedbackClick");
	var _showFeedbackCrmForm = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showFeedbackCrmForm");
	var _getFeedbackFormParams = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFeedbackFormParams");
	class Footer {
	  constructor(showSettingsButton = false) {
	    Object.defineProperty(this, _getFeedbackFormParams, {
	      value: _getFeedbackFormParams2
	    });
	    Object.defineProperty(this, _showFeedbackCrmForm, {
	      value: _showFeedbackCrmForm2
	    });
	    Object.defineProperty(this, _onFeedbackClick, {
	      value: _onFeedbackClick2
	    });
	    Object.defineProperty(this, _onSettingsClick, {
	      value: _onSettingsClick2
	    });
	    Object.defineProperty(this, _showSettingsButton, {
	      writable: true,
	      value: false
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _showSettingsButton)[_showSettingsButton] = showSettingsButton;
	  }
	  getFooterContent() {
	    const settingsButton = babelHelpers.classPrivateFieldLooseBase(this, _showSettingsButton)[_showSettingsButton] ? main_core.Tag.render(_t$1 || (_t$1 = _$1`
			<div
				onclick="${0}"
			 	class="crm-rs__w-footer-button --settings"
			 >
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _onSettingsClick)[_onSettingsClick].bind(this), main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_FOOTER_SETTINGS')) : '';
	    const feedbackButton = main_core.Tag.render(_t2$1 || (_t2$1 = _$1`
			<div
				onclick="${0}"
				class="crm-rs__w-footer-button --feedback"
			>
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _onFeedbackClick)[_onFeedbackClick].bind(this), main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_POPUP_FOOTER_FEEDBACK'));
	    return main_core.Tag.render(_t3 || (_t3 = _$1`
			<div class="crm-rs__w-footer-row">
				${0}
				${0}
			</div>
		`), main_core.Type.isArrayFilled(babelHelpers.classPrivateFieldLooseBase(this, _getFeedbackFormParams)[_getFeedbackFormParams]()) ? feedbackButton : '<div></div>', settingsButton);
	  }
	}
	function _onSettingsClick2() {
	  window.location.href = '/crm/repeat-sale-segment/';
	}
	function _onFeedbackClick2() {
	  const [numberCode, stringCode] = babelHelpers.classPrivateFieldLooseBase(this, _getFeedbackFormParams)[_getFeedbackFormParams]();
	  babelHelpers.classPrivateFieldLooseBase(this, _showFeedbackCrmForm)[_showFeedbackCrmForm](numberCode, stringCode);
	}
	function _showFeedbackCrmForm2(numberCode, stringCode) {
	  BX.SidePanel.Instance.open('bx-repeat-sale-slider', {
	    contentCallback: () => {
	      return `<script data-b24-form="inline/${numberCode}/${stringCode}" data-skip-moving="true"></script>`;
	    },
	    width: 664,
	    loader: 'default-loader',
	    cacheable: false,
	    closeByEsc: false,
	    data: {
	      rightBoundary: 0
	    },
	    events: {
	      onOpen: () => {
	        (function (w, d, u) {
	          var s = d.createElement('script');
	          s.async = true;
	          s.src = u + '?' + (Date.now() / 180000 | 0);
	          var h = d.getElementsByTagName('script')[0];
	          h.parentNode.insertBefore(s, h);
	        })(window, document, `https://cdn.bitrix24.com/b5309667/crm/form/loader_${numberCode}.js`);
	      }
	    }
	  });
	}
	function _getFeedbackFormParams2() {
	  return main_core.Extension.getSettings('crm.repeat-sale.widget').get('feedbackFormParams');
	}

	let _$2 = t => t,
	  _t$2,
	  _t2$2,
	  _t3$1,
	  _t4;
	var _isFlowStarted = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isFlowStarted");
	var _showSettingsButton$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showSettingsButton");
	var _getTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTitle");
	var _getBodyTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBodyTitle");
	var _getButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getButton");
	var _getFooterContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFooterContent");
	var _onButtonClick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onButtonClick");
	var _hasClients = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("hasClients");
	class Start extends Base {
	  constructor(params) {
	    var _params$showSettingsB;
	    super(params);
	    Object.defineProperty(this, _hasClients, {
	      value: _hasClients2
	    });
	    Object.defineProperty(this, _onButtonClick, {
	      value: _onButtonClick2
	    });
	    Object.defineProperty(this, _getFooterContent, {
	      value: _getFooterContent2
	    });
	    Object.defineProperty(this, _getButton, {
	      value: _getButton2
	    });
	    Object.defineProperty(this, _getBodyTitle, {
	      value: _getBodyTitle2
	    });
	    Object.defineProperty(this, _getTitle, {
	      value: _getTitle2
	    });
	    Object.defineProperty(this, _isFlowStarted, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _showSettingsButton$1, {
	      writable: true,
	      value: true
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _showSettingsButton$1)[_showSettingsButton$1] = (_params$showSettingsB = params.showSettingsButton) != null ? _params$showSettingsB : true;
	  }
	  getType() {
	    return WidgetType.start;
	  }
	  onClose() {
	    super.onClose();
	    void main_core.ajax.runAction('crm.repeatsale.widget.incrementShowedFlowStartCount');
	  }
	  getPopupContent(data) {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isFlowStarted)[_isFlowStarted] === null) {
	      const {
	        isFlowStarted
	      } = data;
	      babelHelpers.classPrivateFieldLooseBase(this, _isFlowStarted)[_isFlowStarted] = isFlowStarted;
	    }
	    return main_core.Tag.render(_t$2 || (_t$2 = _$2`
			<div>
				<header class="crm-rs__w-header">
					${0}
				</header>
				<div class="crm-rs__w-body">
					<div class="crm-rs__w-body-content">
						<div class="crm-rs__w-body-title">
							${0}
						</div>
						${0}
					</div>
					<div class="crm-rs__w-body-bubble ${0}">
						${0}
						<div class="crm-rs__w-body-icon"></div>
					</div>
				</div>
				<footer class="crm-rs__w-footer">
					${0}
				</footer>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getTitle)[_getTitle](data), babelHelpers.classPrivateFieldLooseBase(this, _getBodyTitle)[_getBodyTitle](data), babelHelpers.classPrivateFieldLooseBase(this, _getButton)[_getButton](data), babelHelpers.classPrivateFieldLooseBase(this, _isFlowStarted)[_isFlowStarted] ? '--flow-started' : '', this.renderLottieAnimation(), babelHelpers.classPrivateFieldLooseBase(this, _getFooterContent)[_getFooterContent](data));
	  }
	  getFetchUrl() {
	    return 'crm.repeatsale.statistics.getInitData';
	  }
	  getFetchParams() {
	    return {};
	  }
	}
	function _getTitle2(data) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isFlowStarted)[_isFlowStarted]) {
	    return main_core.Tag.render(_t2$2 || (_t2$2 = _$2`
				<span>${0}</span>
			`), main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_FLOW_STARTED_POPUP_TITLE'));
	  }
	  const code = babelHelpers.classPrivateFieldLooseBase(this, _hasClients)[_hasClients](data) ? 'CRM_REPEAT_SALE_WIDGET_START_POPUP_TITLE_WITH_CLIENTS' : 'CRM_REPEAT_SALE_WIDGET_START_POPUP_TITLE_WITHOUT_CLIENTS';
	  return main_core.Loc.getMessage(code);
	}
	function _getBodyTitle2(data) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isFlowStarted)[_isFlowStarted]) {
	    return main_core.Tag.render(_t3$1 || (_t3$1 = _$2`
				<span>${0}</span>
			`), main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_FLOW_STARTED_TITLE'));
	  }
	  const hasClients = babelHelpers.classPrivateFieldLooseBase(this, _hasClients)[_hasClients](data);
	  const code = hasClients ? 'CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_TITLE_WITH_CLIENTS' : 'CRM_REPEAT_SALE_WIDGET_START_POPUP_BODY_TITLE_WITHOUT_CLIENTS';
	  if (hasClients) {
	    return main_core.Loc.getMessagePlural(code, data.count, {
	      '#COUNT#': data.count
	    });
	  }
	  return main_core.Loc.getMessage(code);
	}
	function _getButton2(data) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isFlowStarted)[_isFlowStarted]) {
	    return null;
	  }
	  const hasClients = babelHelpers.classPrivateFieldLooseBase(this, _hasClients)[_hasClients](data);
	  const code = hasClients ? 'CRM_REPEAT_SALE_WIDGET_START_POPUP_BTN_WITH_CLIENTS' : 'CRM_REPEAT_SALE_WIDGET_START_POPUP_BTN_WITHOUT_CLIENTS';
	  return main_core.Tag.render(_t4 || (_t4 = _$2`
			<div class="crm-rs__w-body-title-btn ${0}">
				<span
					onclick="${0}"
				>${0}</span>
			</div>
		`), hasClients ? '--has-clients' : '', babelHelpers.classPrivateFieldLooseBase(this, _onButtonClick)[_onButtonClick].bind(this, data), main_core.Loc.getMessage(code));
	}
	function _getFooterContent2(data) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isFlowStarted)[_isFlowStarted]) {
	    const footer = new Footer(babelHelpers.classPrivateFieldLooseBase(this, _showSettingsButton$1)[_showSettingsButton$1]);
	    return footer.getFooterContent();
	  }
	  const code = babelHelpers.classPrivateFieldLooseBase(this, _hasClients)[_hasClients](data) ? 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITH_CLIENTS' : 'CRM_REPEAT_SALE_WIDGET_START_POPUP_DESC_WITHOUT_CLIENTS';
	  return main_core.Loc.getMessage(code);
	}
	function _onButtonClick2(data) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _hasClients)[_hasClients](data)) {
	    main_core.ajax.runAction('crm.repeatsale.flow.enable').then(response => {
	      if (response.status === 'success') {
	        babelHelpers.classPrivateFieldLooseBase(this, _isFlowStarted)[_isFlowStarted] = true;
	        this.setPopupContent(this.getPopupContent(data));
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
	    // @todo
	    alert('empty clients, need show manual');
	    void main_core.ajax.runAction('crm.repeatsale.widget.finalizeShowedFlowStart');
	  }
	}
	function _hasClients2(data) {
	  return data.count > 0;
	}

	let _$3 = t => t,
	  _t$3,
	  _t2$3,
	  _t3$2;
	var _periodType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("periodType");
	var _showSettingsButton$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showSettingsButton");
	var _getLoadingPopupContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLoadingPopupContent");
	var _renderLoadingLottieAnimation = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderLoadingLottieAnimation");
	var _getSelectorTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSelectorTitle");
	var _getBubbleSubTitle = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBubbleSubTitle");
	var _getFooterContent$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFooterContent");
	var _onPeriodChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onPeriodChange");
	class Statistics extends Base {
	  constructor(params) {
	    var _params$showSettingsB;
	    super(params);
	    Object.defineProperty(this, _onPeriodChange, {
	      value: _onPeriodChange2
	    });
	    Object.defineProperty(this, _getFooterContent$1, {
	      value: _getFooterContent2$1
	    });
	    Object.defineProperty(this, _getBubbleSubTitle, {
	      value: _getBubbleSubTitle2
	    });
	    Object.defineProperty(this, _getSelectorTitle, {
	      value: _getSelectorTitle2
	    });
	    Object.defineProperty(this, _renderLoadingLottieAnimation, {
	      value: _renderLoadingLottieAnimation2
	    });
	    Object.defineProperty(this, _getLoadingPopupContent, {
	      value: _getLoadingPopupContent2
	    });
	    Object.defineProperty(this, _periodType, {
	      writable: true,
	      value: PeriodType.day30
	    });
	    Object.defineProperty(this, _showSettingsButton$2, {
	      writable: true,
	      value: true
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _showSettingsButton$2)[_showSettingsButton$2] = (_params$showSettingsB = params.showSettingsButton) != null ? _params$showSettingsB : true;
	  }
	  getType() {
	    return WidgetType.statistics;
	  }
	  getPopupContent(data) {
	    var _data$repeatSaleWinCo, _data$repeatSaleWinCo2, _data$repeatSaleWinSu, _data$repeatSaleProce, _data$otherWinSum, _data$totalSum, _data$percent;
	    return main_core.Tag.render(_t$3 || (_t$3 = _$3`
			<div>
				<header class="crm-rs__w-header --statistics">
					${0}
				</header>
				<div class="crm-rs__w-body">
					<div class="crm-rs__w-body-content --statistics">
						<div class="crm-rs__w-period-selector">
							${0}
							<span
								onclick="${0}"
								class="crm-rs__w-period-selector-icon"
							></span>
						</div>
						<div class="crm-rs__w-body-statistics">
							<div class="crm-rs__w-body-rs-statistics">
								<div class="crm-rs__w-body-rs-statistics-title">
									${0}
								</div>
								<div class="crm-rs__w-body-statistics-row">
									<div class="crm-rs__w-body-statistics-item">
										${0}
									</div>
									<div class="crm-rs__w-body-statistics-item --sum">
										${0}
									</div>
								</div>
								<div class="crm-rs__w-body-statistics-row">
									<div class="crm-rs__w-body-statistics-item">
										${0}
									</div>
									<div class="crm-rs__w-body-statistics-item --sum">
										${0}
									</div>
								</div>
							</div>
							<div class="crm-rs__w-body-statistics-row">
								<div class="crm-rs__w-body-statistics-item">
									${0}
								</div>
								<div class="crm-rs__w-body-statistics-item --sum">
									${0}
								</div>
							</div>
							<div class="crm-rs__w-body-statistics-row">
								<div class="crm-rs__w-body-statistics-item">
									${0}
								</div>
								<div class="crm-rs__w-body-statistics-item --sum">
									${0}
								</div>
							</div>
						</div>
					</div>
					<div class="crm-rs__w-body-bubble --statistics">
						${0}
						<div class="crm-rs__w-body-icon"></div>
						<div class="crm-rs__w-body-bubble-percent">
							<span>${0}</span>
							<div>
								<div class="crm-rs__w-body-bubble-percent-arrow ${0}"></div>
								<div class="crm-rs__w-body-bubble-percent-icon"></div>
							</div>
						</div>
						<div class="crm-rs__w-body-bubble-subtitle">
							${0}
						</div>
					</div>
				</div>
				<footer class="crm-rs__w-footer --statistics">
					${0}
				</footer>
			</div>
		`), main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE'), babelHelpers.classPrivateFieldLooseBase(this, _getSelectorTitle)[_getSelectorTitle](), babelHelpers.classPrivateFieldLooseBase(this, _onPeriodChange)[_onPeriodChange].bind(this, babelHelpers.classPrivateFieldLooseBase(this, _periodType)[_periodType]), main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BODY_TITLE'), main_core.Loc.getMessagePlural('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BODY_RS_WIN', (_data$repeatSaleWinCo = data.repeatSaleWinCount) != null ? _data$repeatSaleWinCo : 0, {
	      '#COUNT#': (_data$repeatSaleWinCo2 = data.repeatSaleWinCount) != null ? _data$repeatSaleWinCo2 : 0
	    }), (_data$repeatSaleWinSu = data.repeatSaleWinSum) != null ? _data$repeatSaleWinSu : '', main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BODY_RS_PROCESS'), (_data$repeatSaleProce = data.repeatSaleProcessSum) != null ? _data$repeatSaleProce : 0, main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BODY_OTHER'), (_data$otherWinSum = data.otherWinSum) != null ? _data$otherWinSum : 0, main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BODY_TOTAL'), (_data$totalSum = data.totalSum) != null ? _data$totalSum : 0, this.renderLottieAnimation(), (_data$percent = data.percent) != null ? _data$percent : 0, data.percent > 0 ? '' : '--hidden', babelHelpers.classPrivateFieldLooseBase(this, _getBubbleSubTitle)[_getBubbleSubTitle](), babelHelpers.classPrivateFieldLooseBase(this, _getFooterContent$1)[_getFooterContent$1]());
	  }
	  getFetchUrl() {
	    return 'crm.repeatsale.statistics.getData';
	  }
	  getFetchParams() {
	    return {
	      periodType: babelHelpers.classPrivateFieldLooseBase(this, _periodType)[_periodType]
	    };
	  }
	}
	function _getLoadingPopupContent2() {
	  return main_core.Tag.render(_t2$3 || (_t2$3 = _$3`
			<div>
				<header class="crm-rs__w-header --statistics">
					${0}
				</header>
				<div class="crm-rs__w-body">
					<div class="crm-rs__w-body-loading-bubble">
						<div class="crm-rs__w-body-loading-bubble-wrapper">
							${0}
							${0}
						</div>
						<div class="crm-rs__w-body-bubble-subtitle">
							${0}
						</div>
					</div>
				</div>
				<footer class="crm-rs__w-footer --statistics">
					${0}
				</footer>
			</div>
		`), main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_TITLE'), this.renderLottieAnimation(), babelHelpers.classPrivateFieldLooseBase(this, _renderLoadingLottieAnimation)[_renderLoadingLottieAnimation](), main_core.Loc.getMessage('CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_LOADING'), babelHelpers.classPrivateFieldLooseBase(this, _getFooterContent$1)[_getFooterContent$1]());
	}
	function _renderLoadingLottieAnimation2() {
	  const container = main_core.Tag.render(_t3$2 || (_t3$2 = _$3`
			<div class="crm-rs__w-loading-lottie-container">
				<div ref="lottie" class="crm-rs__w-lottie"></div>
			</div>
		`));
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
	function _getSelectorTitle2() {
	  let code = null;
	  switch (babelHelpers.classPrivateFieldLooseBase(this, _periodType)[_periodType]) {
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
	      throw new RangeError('unknown period type');
	  }
	  return main_core.Loc.getMessage(code);
	}
	function _getBubbleSubTitle2() {
	  let code = null;
	  switch (babelHelpers.classPrivateFieldLooseBase(this, _periodType)[_periodType]) {
	    case PeriodType.day30:
	      code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BUBBLE_PERIOD_DAY_30';
	      break;
	    case PeriodType.quarter:
	      code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BUBBLE_PERIOD_QUARTER';
	      break;
	    case PeriodType.halfYear:
	      code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BUBBLE_PERIOD_HALF_YEAR';
	      break;
	    case PeriodType.year:
	      code = 'CRM_REPEAT_SALE_WIDGET_STATISTICS_POPUP_BUBBLE_PERIOD_YEAR';
	      break;
	    default:
	      throw new RangeError('unknown period type');
	  }
	  return main_core.Loc.getMessage(code);
	}
	function _getFooterContent2$1() {
	  const footer = new Footer(babelHelpers.classPrivateFieldLooseBase(this, _showSettingsButton$2)[_showSettingsButton$2]);
	  return footer.getFooterContent();
	}
	function _onPeriodChange2(periodTypeId) {
	  let nextPeriodTypeId = PeriodType.day30;
	  const periodTypeIds = Object.values(PeriodType);
	  if (periodTypeIds.includes(periodTypeId)) {
	    const index = periodTypeIds.indexOf(periodTypeId);
	    if (index + 1 < periodTypeIds.length) {
	      nextPeriodTypeId = index + 1;
	    }
	  }
	  const data = {
	    periodTypeId: nextPeriodTypeId
	  };

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
	      babelHelpers.classPrivateFieldLooseBase(this, _periodType)[_periodType] = nextPeriodTypeId;
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

	class ContentFactory {
	  static getContentInstance(widgetType, params = {}) {
	    switch (widgetType) {
	      case WidgetType.start:
	        return new Start(params);
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
	  statistics: 'statistics'
	});
	var _contentPopupInstance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("contentPopupInstance");
	class Widget {
	  static execute(widgetType, bindElement = null, params = {}, event = null) {
	    if (!this.instance[widgetType]) {
	      this.instance[widgetType] = new Widget(widgetType, bindElement, params);
	    }
	    if (this.instance[widgetType].isShown()) {
	      this.instance[widgetType].close();
	    } else {
	      var _ref;
	      const forceShowConfetti = (_ref = (event == null ? void 0 : event.altKey) && (event == null ? void 0 : event.ctrlKey)) != null ? _ref : false;
	      this.instance[widgetType].show(forceShowConfetti);
	    }
	  }
	  constructor(widgetType, bindElement = null, params = {}) {
	    Object.defineProperty(this, _contentPopupInstance, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _contentPopupInstance)[_contentPopupInstance] = ContentFactory.getContentInstance(widgetType, params);
	    if (bindElement) {
	      babelHelpers.classPrivateFieldLooseBase(this, _contentPopupInstance)[_contentPopupInstance].setBindElement(bindElement);
	    }
	  }
	  show(forceShowConfetti = false) {
	    babelHelpers.classPrivateFieldLooseBase(this, _contentPopupInstance)[_contentPopupInstance].show(forceShowConfetti);
	  }
	  isShown() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _contentPopupInstance)[_contentPopupInstance].isShown();
	  }
	  close() {
	    babelHelpers.classPrivateFieldLooseBase(this, _contentPopupInstance)[_contentPopupInstance].close();
	  }
	}
	Widget.instance = [];

	exports.PeriodType = PeriodType;
	exports.WidgetType = WidgetType;
	exports.Widget = Widget;

}((this.BX.Crm.RepeatSale = this.BX.Crm.RepeatSale || {}),BX.UI,BX,BX,BX.Main,BX.UI));
//# sourceMappingURL=widget.bundle.js.map
