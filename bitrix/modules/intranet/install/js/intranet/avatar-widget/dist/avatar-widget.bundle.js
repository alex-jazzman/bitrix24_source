/* eslint-disable */
this.BX = this.BX || {};
(function (exports,ui_popupcomponentsmaker,ui_avatar,timeman_workStatusControlPanel,ui_analytics,ui_infoHelper,crm_router,pull_client,humanresources_hcmlink_salaryVacationMenu,im_v2_lib_desktopApi,ui_cnt,intranet_desktopAccountList,main_popup,intranet_desktopDownload,ui_shortQrAuth,ui_buttons,main_sidepanel,main_core,main_core_events) {
	'use strict';

	class Content extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    this.cache = new main_core.Cache.MemoryCache();
	    this.setOptions(options);
	    this.setEventNamespace('BX.Intranet.AvatarWidget.Content');
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
	      minHeight: '50px',
	      margin: '0 13px'
	    };
	  }
	}

	class Analytics {
	  static send(event) {
	    ui_analytics.sendData({
	      tool: Analytics.TOOLS,
	      category: Analytics.CATEGORY,
	      event
	    });
	  }
	  static sendOpenProfile() {
	    ui_analytics.sendData({
	      tool: Analytics.TOOLS,
	      category: Analytics.CATEGORY_PROFILE,
	      event: Analytics.EVENT_PROFILE_VIEW,
	      c_section: Analytics.CATEGORY
	    });
	  }
	  static sendOpenCommonSecurity() {
	    ui_analytics.sendData({
	      tool: 'settings',
	      category: 'common_security',
	      event: 'start_page',
	      c_section: Analytics.CATEGORY
	    });
	  }
	}
	Analytics.TOOLS = 'intranet';
	Analytics.CATEGORY = 'ava_menu';
	Analytics.CATEGORY_PROFILE = 'user_profile';
	Analytics.EVENT_OPEN_WIDGET = 'menu_open';
	Analytics.EVENT_PROFILE_VIEW = 'profile_view';
	Analytics.EVENT_CLICK_SALARY = 'click_salary';
	Analytics.EVENT_CLICK_INSTALL_DESKTOP_APP = 'click_install_desktop_app';
	Analytics.EVENT_CLICK_INSTALL_MOBILE_APP = 'click_install_mobile_app';
	Analytics.EVENT_CLICK_FAST_MOBILE_AUTH = 'click_fast_mobile_auth';
	Analytics.EVENT_CLICK_2FA_SETUP = 'click_2fa_setup';
	Analytics.EVENT_CLICK_EXTENSION = 'click_extension';
	Analytics.EVENT_CLICK_LOGOUT = 'click_logout';
	Analytics.EVENT_CLICK_CHANGE_PORTAL_THEME = 'click_change_portal_theme';
	Analytics.EVENT_CLICK_NETWORK = 'click_network';
	Analytics.EVENT_CLICK_ACTIVITY_PORTAL_LIST = 'click_activity_portal_list';
	Analytics.EVENT_CLICK_PULSE = 'click_open_pulse';
	Analytics.EVENT_CLICK_MY_DOCUMENTS = 'click_open_my_documents';

	class BaseTool {
	  constructor(options = {}) {
	    this.cache = new main_core.Cache.MemoryCache();
	    this.options = options;
	  }
	  getLayout() {
	    throw new Error('Must be implemented in a child class');
	  }
	  getIconClass() {
	    throw new Error('Must be implemented in a child class');
	  }
	  onClick() {
	    throw new Error('Must be implemented in a child class');
	  }
	  getIconElement() {
	    throw new Error('Must be implemented in a child class');
	  }
	  getTitle() {
	    return this.options.title || this.options.text || '';
	  }
	}

	let _ = t => t,
	  _t,
	  _t2,
	  _t3;
	var _getCounterWrapper = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCounterWrapper");
	class BaseMainTool extends BaseTool {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getCounterWrapper, {
	      value: _getCounterWrapper2
	    });
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      return main_core.Tag.render(_t || (_t = _`
				<div data-testid="bx-avatar-widget-main-tool-${0}" onclick="${0}" class="intranet-avatar-widget-main-tool__wrapper">
					<div class="intranet-avatar-widget-main-tool-icon__wrapper">
						${0}
						${0}
					</div>
					<div class="intranet-avatar-widget-main-tool__title">
						${0}
					</div>
				</div>
			`), this.getId(), this.onClick.bind(this), this.getIconElement(), babelHelpers.classPrivateFieldLooseBase(this, _getCounterWrapper)[_getCounterWrapper](), this.getTitle());
	    });
	  }
	  getIconElement() {
	    return this.cache.remember('icon', () => {
	      return main_core.Tag.render(_t2 || (_t2 = _`<i class="ui-icon-set ${0} intranet-avatar-widget-main-tool__icon"/>`), this.getIconClass());
	    });
	  }
	  getCounter() {
	    return null;
	  }
	  getId() {
	    return '';
	  }
	}
	function _getCounterWrapper2() {
	  return this.cache.remember('counterWrapper', () => {
	    const counter = this.getCounter();
	    return main_core.Tag.render(_t3 || (_t3 = _`
				<div class="intranet-avatar-widget-main-tool__counter-wrapper">
					${0}
				</div>
			`), counter == null ? void 0 : counter.render());
	  });
	}

	var _getMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMenu");
	class ExtensionTool extends BaseMainTool {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getMenu, {
	      value: _getMenu2
	    });
	  }
	  getIconClass() {
	    return '--o-box';
	  }
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_EXTENSION);
	    babelHelpers.classPrivateFieldLooseBase(this, _getMenu)[_getMenu]().toggle();
	  }
	  getId() {
	    return 'extension';
	  }
	}
	function _getMenu2() {
	  return this.cache.remember('menu', () => {
	    const menu = new main_popup.Menu({
	      bindElement: this.getIconElement(),
	      items: this.options.items,
	      angle: true,
	      cachable: false,
	      offsetLeft: 10,
	      fixed: true
	    });
	    main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpenStart', () => {
	      menu.close();
	    });
	    return menu;
	  });
	}

	class SecurityTool extends BaseMainTool {
	  getIconClass() {
	    return '--o-shield-checked';
	  }
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_2FA_SETUP);
	    main_sidepanel.SidePanel.Instance.open(this.options.url, {
	      width: 1100
	    });
	  }
	  getCounter() {
	    return this.cache.remember('counter', () => {
	      if (!this.options.hasCounter) {
	        return null;
	      }
	      pull_client.PULL.subscribe({
	        moduleId: 'intranet',
	        command: this.options.counterEventName,
	        callback: () => {
	          this.getCounter().destroy();
	          const icon = this.getLayout().querySelector('.intranet-avatar-widget-item__icon');
	          main_core.Dom.removeClass(icon, '--active');
	          this.cache.delete('counter');
	        }
	      });
	      return new ui_cnt.Counter({
	        color: ui_cnt.Counter.Color.DANGER,
	        size: ui_cnt.Counter.Size.MEDIUM,
	        value: 1,
	        style: ui_cnt.CounterStyle.FILLED_ALERT,
	        useAirDesign: true
	      });
	    });
	  }
	  getId() {
	    return 'security';
	  }
	}

	class MyDocumentsTool extends BaseMainTool {
	  getIconClass() {
	    return '--o-file';
	  }
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_MY_DOCUMENTS);
	    if (this.options.isLocked) {
	      ui_infoHelper.FeaturePromotersRegistry.getPromoter({
	        code: 'limit_office_e_signature'
	      }).show();
	      return;
	    }
	    const userId = Number(main_core.Loc.getMessage('USER_ID'));
	    if (userId > 0) {
	      crm_router.Router.openSlider(`${main_core.Loc.getMessage('SITE_DIR')}company/personal/user/${userId}/sign?noRedirect=Y`, {
	        width: 1000,
	        cacheable: false
	      });
	    }
	  }
	  getCounter() {
	    return this.cache.remember('counter', () => {
	      if (Number(this.options.counter) < 1) {
	        return null;
	      }
	      pull_client.PULL.subscribe({
	        moduleId: 'sign',
	        command: this.options.counterEventName,
	        callback: params => {
	          if (!main_core.Type.isNumber(params == null ? void 0 : params.needActionCount)) {
	            return;
	          }
	          this.options.counter = params.needActionCount;
	          if ((params == null ? void 0 : params.needActionCount) > 0) {
	            this.getCounter().update(params.needActionCount);
	          } else {
	            this.getCounter().destroy();
	            const icon = this.getLayout().querySelector('.intranet-avatar-widget-item__icon');
	            main_core.Dom.removeClass(icon, '--active');
	            this.cache.delete('counter');
	          }
	        }
	      });
	      return new ui_cnt.Counter({
	        color: ui_cnt.Counter.Color.DANGER,
	        size: ui_cnt.Counter.Size.MEDIUM,
	        value: this.options.counter,
	        style: ui_cnt.CounterStyle.FILLED_ALERT,
	        useAirDesign: true
	      });
	    });
	  }
	  getId() {
	    return 'my-documents';
	  }
	}

	var _getMenu$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMenu");
	var _getHintInstance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getHintInstance");
	class SalaryVacationTool extends BaseMainTool {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getHintInstance, {
	      value: _getHintInstance2
	    });
	    Object.defineProperty(this, _getMenu$1, {
	      value: _getMenu2$1
	    });
	  }
	  getIconClass() {
	    return '--o-favorite';
	  }
	  getLayout() {
	    const container = super.getLayout();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _getMenu$1)[_getMenu$1]().isHidden()) {
	      return null;
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _getMenu$1)[_getMenu$1]().isDisabled()) {
	      main_core.Dom.attr(container, 'data-hint', '');
	      main_core.Dom.attr(container, 'data-hint-interactivity', '');
	      main_core.Event.bind(container, 'mouseenter', () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _getHintInstance)[_getHintInstance]().show(container, this.options.disabledHint);
	      });
	      main_core.Event.bind(container, 'mouseleave', () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _getHintInstance)[_getHintInstance]().hide(container);
	      });
	    }
	    return super.getLayout();
	  }
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_SALARY);
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _getMenu$1)[_getMenu$1]().isHidden() && !babelHelpers.classPrivateFieldLooseBase(this, _getMenu$1)[_getMenu$1]().isDisabled()) {
	      babelHelpers.classPrivateFieldLooseBase(this, _getMenu$1)[_getMenu$1]().show(this.getLayout());
	    }
	  }
	  getId() {
	    return 'salary-vacation';
	  }
	}
	function _getMenu2$1() {
	  return this.cache.remember('salaryMenu', () => {
	    return new humanresources_hcmlink_salaryVacationMenu.SalaryVacationMenu();
	  });
	}
	function _getHintInstance2() {
	  return this.cache.remember('hint', () => {
	    return BX.UI.Hint.createInstance({
	      popupParameters: {
	        fixed: true
	      }
	    });
	  });
	}

	let _$1 = t => t,
	  _t$1,
	  _t2$1,
	  _t3$1,
	  _t4,
	  _t5,
	  _t6,
	  _t7,
	  _t8;
	var _activeOnclick = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("activeOnclick");
	var _handleClickTaskStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleClickTaskStatus");
	var _getFullName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFullName");
	var _getWorkPosition = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getWorkPosition");
	var _getAvatar = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAvatar");
	var _getStatus = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getStatus");
	var _getWorkStatusBlock = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getWorkStatusBlock");
	var _getWorkStatusControlPanel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getWorkStatusControlPanel");
	var _getToolsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getToolsContainer");
	var _getTools = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTools");
	var _setEventHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setEventHandlers");
	class MainContent extends Content {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _setEventHandlers, {
	      value: _setEventHandlers2
	    });
	    Object.defineProperty(this, _getTools, {
	      value: _getTools2
	    });
	    Object.defineProperty(this, _getToolsContainer, {
	      value: _getToolsContainer2
	    });
	    Object.defineProperty(this, _getWorkStatusControlPanel, {
	      value: _getWorkStatusControlPanel2
	    });
	    Object.defineProperty(this, _getWorkStatusBlock, {
	      value: _getWorkStatusBlock2
	    });
	    Object.defineProperty(this, _getStatus, {
	      value: _getStatus2
	    });
	    Object.defineProperty(this, _getAvatar, {
	      value: _getAvatar2
	    });
	    Object.defineProperty(this, _getWorkPosition, {
	      value: _getWorkPosition2
	    });
	    Object.defineProperty(this, _getFullName, {
	      value: _getFullName2
	    });
	    Object.defineProperty(this, _handleClickTaskStatus, {
	      value: _handleClickTaskStatus2
	    });
	    Object.defineProperty(this, _activeOnclick, {
	      writable: true,
	      value: true
	    });
	  }
	  getConfig() {
	    return {
	      html: this.getLayout()
	    };
	  }
	  getOptions() {
	    return super.getOptions();
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _setEventHandlers)[_setEventHandlers]();
	      const onclick = () => {
	        if (babelHelpers.classPrivateFieldLooseBase(this, _activeOnclick)[_activeOnclick]) {
	          BX.SidePanel.Instance.open(this.getOptions().url);
	          Analytics.sendOpenProfile();
	        }
	      };
	      return main_core.Tag.render(_t$1 || (_t$1 = _$1`
				<div class="intranet-avatar-widget-item__wrapper" data-testid="bx-avatar-widget-content-main">
					<div onclick="${0}" class="intranet-avatar-widget-item-main__wrapper-head">
						<div class="intranet-avatar-widget-item__avatar">
							${0}
						</div>
						<div class="intranet-avatar-widget-item__info-wrapper">
							${0}
							${0}
						</div>
					</div>
					${0}
					${0}
					${0}
				</div>
			`), onclick, babelHelpers.classPrivateFieldLooseBase(this, _getAvatar)[_getAvatar]().getContainer(), babelHelpers.classPrivateFieldLooseBase(this, _getFullName)[_getFullName](), babelHelpers.classPrivateFieldLooseBase(this, _getWorkPosition)[_getWorkPosition](), babelHelpers.classPrivateFieldLooseBase(this, _getStatus)[_getStatus](), babelHelpers.classPrivateFieldLooseBase(this, _getWorkStatusBlock)[_getWorkStatusBlock](), babelHelpers.classPrivateFieldLooseBase(this, _getToolsContainer)[_getToolsContainer]());
	    });
	  }
	}
	function _handleClickTaskStatus2(event) {
	  event.stopPropagation();
	  event.preventDefault();
	}
	function _getFullName2() {
	  return this.cache.remember('title', () => {
	    return main_core.Tag.render(_t2$1 || (_t2$1 = _$1`
				<span class="intranet-avatar-widget-item__title">
					<span>${0}</span>
					<i class="ui-icon-set --chevron-right-s intranet-avatar-widget-item__chevron"/>
				</span>
			`), this.getOptions().fullName);
	  });
	}
	function _getWorkPosition2() {
	  return this.cache.remember('workPosition', () => {
	    if (!this.getOptions().workPosition) {
	      return null;
	    }
	    return main_core.Tag.render(_t3$1 || (_t3$1 = _$1`
				<span class="intranet-avatar-widget-item__description">${0}</span>
			`), this.getOptions().workPosition);
	  });
	}
	function _getAvatar2() {
	  return this.cache.remember('avatar', () => {
	    const options = {
	      size: 48,
	      userpicPath: encodeURI(this.getOptions().userPhotoSrc)
	    };
	    let avatar = null;
	    if (this.getOptions().role === 'extranet') {
	      avatar = new ui_avatar.AvatarRoundExtranet(options);
	    } else if (this.getOptions().role === 'collaber') {
	      avatar = new ui_avatar.AvatarRoundGuest(options);
	    } else {
	      avatar = new ui_avatar.AvatarRound(options);
	    }
	    return avatar;
	  });
	}
	function _getStatus2() {
	  return this.cache.remember('status', () => {
	    if (!this.getOptions().status && !this.getOptions().vacation) {
	      return null;
	    }
	    const wrapper = main_core.Tag.render(_t4 || (_t4 = _$1`
				<div class="intranet-avatar-widget-main__status-wrapper"></div>
			`));
	    if (this.getOptions().vacation) {
	      main_core.Dom.append(main_core.Tag.render(_t5 || (_t5 = _$1`
					<span class="intranet-avatar-widget-main__status --vacation">
						${0}
					</span>
				`), this.getOptions().vacation), wrapper);
	    }
	    if (this.getOptions().status) {
	      const status = main_core.Tag.render(_t6 || (_t6 = _$1`
					<span class="intranet-avatar-widget-main__status">
						${0}
					</span>
				`), this.getOptions().status);
	      if (this.getOptions().role === 'collaber') {
	        main_core.Dom.addClass(status, '--collaber');
	      } else if (this.getOptions().role === 'extranet') {
	        main_core.Dom.addClass(status, '--extranet');
	      }
	      main_core.Dom.append(status, wrapper);
	    }
	    return wrapper;
	  });
	}
	function _getWorkStatusBlock2() {
	  return this.cache.remember('worktime', () => {
	    if (!this.getOptions().isTimemanAvailable) {
	      return null;
	    }
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _getWorkStatusControlPanel)[_getWorkStatusControlPanel]()) {
	      return null;
	    }
	    return main_core.Tag.render(_t7 || (_t7 = _$1`
				<div
					class="intranet-avatar-widget-item__task-status task-status"
					onclick="${0}"
				>
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _handleClickTaskStatus)[_handleClickTaskStatus], babelHelpers.classPrivateFieldLooseBase(this, _getWorkStatusControlPanel)[_getWorkStatusControlPanel]());
	  });
	}
	function _getWorkStatusControlPanel2() {
	  return this.cache.remember('taskStatusActions', () => {
	    try {
	      return new timeman_workStatusControlPanel.WorkStatusControlPanel().renderWorkStatusControlPanel();
	    } catch (error) {
	      console.error(error);
	      return null;
	    }
	  });
	}
	function _getToolsContainer2() {
	  return this.cache.remember('tools-container', () => {
	    if (!this.getOptions().tools || Object.keys(this.getOptions().tools).length === 0) {
	      return null;
	    }
	    const container = main_core.Tag.render(_t8 || (_t8 = _$1`
				<div class="intranet-avatar-widget-main-tools__wrapper"></div>
			`));
	    const tools = babelHelpers.classPrivateFieldLooseBase(this, _getTools)[_getTools]();
	    main_core.Dom.style(container, 'grid-template-columns', `repeat(${tools.length}, 1fr)`);
	    tools.forEach(tool => {
	      main_core.Dom.append(tool.getLayout(), container);
	    });
	    return container;
	  });
	}
	function _getTools2() {
	  return this.cache.remember('tools', () => {
	    const tools = this.getOptions().tools;
	    return [tools.myDocuments ? new MyDocumentsTool(tools.myDocuments) : null, tools.salaryVacation ? new SalaryVacationTool(tools.salaryVacation) : null, tools.security ? new SecurityTool(tools.security) : null, tools.extension ? new ExtensionTool(tools.extension) : null].filter(Boolean);
	  });
	}
	function _setEventHandlers2() {
	  main_core_events.EventEmitter.subscribe('BX.Intranet.UserProfile:Avatar:changed', ({
	    data: [{
	      url,
	      userId
	    }]
	  }) => {
	    if (this.getOptions().id > 0 && userId && this.getOptions().id.toString() === userId.toString()) {
	      const preparedUrl = encodeURI(url);
	      this.getOptions().userPhotoSrc = preparedUrl;
	      babelHelpers.classPrivateFieldLooseBase(this, _getAvatar)[_getAvatar]().setUserPic(preparedUrl);
	    }
	  });
	  main_core_events.EventEmitter.subscribe('BX.Intranet.UserProfile:Name:changed', ({
	    data: [{
	      fullName
	    }]
	  }) => {
	    this.getOptions().fullName = fullName;
	    babelHelpers.classPrivateFieldLooseBase(this, _getFullName)[_getFullName]().querySelector('span').innerHTML = fullName;
	  });
	  main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:enabledAutoHide', () => {
	    babelHelpers.classPrivateFieldLooseBase(this, _activeOnclick)[_activeOnclick] = true;
	  });
	  main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:disabledAutoHide', () => {
	    babelHelpers.classPrivateFieldLooseBase(this, _activeOnclick)[_activeOnclick] = false;
	  });
	}

	let _$2 = t => t,
	  _t$2;
	class BaseFooterTool {
	  constructor(options = {}) {
	    this.cache = new main_core.Cache.MemoryCache();
	    this.options = options;
	  }
	  getLayout() {
	    return main_core.Tag.render(_t$2 || (_t$2 = _$2`
			<div data-testid="bx-avatar-widget-footer-tool-${0}" onclick="${0}" class="intranet-avatar-widget-footer__item">
				${0}
			</div>
		`), this.getId(), this.onClick.bind(this), this.getTitle());
	  }
	  onClick() {
	    throw new Error('Must be implemented in a child class');
	  }
	  getTitle() {
	    return this.options.title || this.options.text || '';
	  }
	  getId() {
	    return '';
	  }
	}

	class ThemeTool extends BaseFooterTool {
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_CHANGE_PORTAL_THEME);
	    main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
	    BX.Intranet.Bitrix24.ThemePicker.Singleton.showDialog(false);
	  }
	  getId() {
	    return 'theme';
	  }
	}

	class PulseTool extends BaseFooterTool {
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_PULSE);
	    main_core.ajax.runAction('intranet.user.widget.getUserStatComponent', {
	      mode: 'class'
	    }).then(response => {
	      main_core.Runtime.html(null, response.data.html).then(() => {
	        if (window.openIntranetUStat) {
	          main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
	          openIntranetUStat();
	        }
	      }).catch(() => {});
	    }).catch(() => {});
	  }
	  getId() {
	    return 'pulse';
	  }
	}

	class LogoutTool extends BaseFooterTool {
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_LOGOUT);
	    if (!main_core.Type.isNil(im_v2_lib_desktopApi.DesktopApi) && im_v2_lib_desktopApi.DesktopApi.isDesktop()) {
	      im_v2_lib_desktopApi.DesktopApi.logout();
	    } else {
	      const backUrl = new main_core.Uri(window.location.pathname);
	      backUrl.removeQueryParam(this.options.removeQueryParam);
	      const newUrl = new main_core.Uri(this.options.path);
	      newUrl.setQueryParam('sessid', BX.bitrix_sessid());
	      newUrl.setQueryParam('backurl', encodeURIComponent(backUrl.toString()));
	      document.location.href = newUrl;
	    }
	  }
	  getId() {
	    return 'logout';
	  }
	}

	let _$3 = t => t,
	  _t$3;
	var _getTools$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTools");
	class FooterContent extends Content {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getTools$1, {
	      value: _getTools2$1
	    });
	  }
	  getConfig() {
	    return {
	      html: this.getLayout(),
	      withoutBackground: true,
	      margin: '0 0 16px 0'
	    };
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      const container = main_core.Tag.render(_t$3 || (_t$3 = _$3`
				<div data-testid="bx-avatar-widget-content-footer" class="intranet-avatar-widget-footer__wrapper"/>
			`));
	      const tools = babelHelpers.classPrivateFieldLooseBase(this, _getTools$1)[_getTools$1]();
	      tools.forEach(tool => {
	        main_core.Dom.append(tool.getLayout(), container);
	      });
	      return container;
	    });
	  }
	}
	function _getTools2$1() {
	  return this.cache.remember('tools', () => {
	    const tools = this.getOptions().tools;
	    return [tools.theme ? new ThemeTool(tools.theme) : null, tools.pulse ? new PulseTool(tools.pulse) : null, tools.logout ? new LogoutTool(tools.logout) : null].filter(Boolean);
	  });
	}

	let _$4 = t => t,
	  _t$4,
	  _t2$2,
	  _t3$2,
	  _t4$1;
	var _getCounterWrapper$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCounterWrapper");
	class BaseSecondaryTool extends BaseTool {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getCounterWrapper$1, {
	      value: _getCounterWrapper2$1
	    });
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      return main_core.Tag.render(_t$4 || (_t$4 = _$4`
				<div data-testid="bx-avatar-widget-tool-${0}" onclick="${0}" class="intranet-avatar-widget-secondary-tool__wrapper">
					${0}
					<div class="intranet-avatar-widget-item__info-wrapper">
						<span class="intranet-avatar-widget-item__title">
							${0}
						</span>
					</div>
					${0}
					${0}
				</div>
			`), this.getId(), this.onClick.bind(this), this.getIconElement(), this.getTitle(), babelHelpers.classPrivateFieldLooseBase(this, _getCounterWrapper$1)[_getCounterWrapper$1](), this.getActionElement());
	    });
	  }
	  getIconElement() {
	    return this.cache.remember('icon', () => {
	      return main_core.Tag.render(_t2$2 || (_t2$2 = _$4`<i class="ui-icon-set ${0} intranet-avatar-widget-secondary-tool__icon"/>`), this.getIconClass());
	    });
	  }
	  getActionElement() {
	    return this.cache.remember('actionElement', () => {
	      return main_core.Tag.render(_t3$2 || (_t3$2 = _$4`<i class="ui-icon-set --chevron-right-m intranet-avatar-widget-item__chevron"/>`));
	    });
	  }
	  getCounter() {
	    return null;
	  }
	  getId() {
	    return '';
	  }
	}
	function _getCounterWrapper2$1() {
	  return this.cache.remember('counterWrapper', () => {
	    const counter = this.getCounter();
	    return main_core.Tag.render(_t4$1 || (_t4$1 = _$4`
				<div class="intranet-avatar-widget-item__counter">
					${0}
				</div>
			`), counter == null ? void 0 : counter.render());
	  });
	}

	class AccountChangerTool extends BaseSecondaryTool {
	  getIconClass() {
	    return '--o-structure-vertical';
	  }
	  onClick() {
	    if (this.options.type === 'desktop') {
	      Analytics.send(Analytics.EVENT_CLICK_ACTIVITY_PORTAL_LIST);
	      main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
	      new intranet_desktopAccountList.DesktopAccountList({
	        bindElement: document.querySelector('[data-id="bx-avatar-widget"]')
	      }).show();
	    } else if (this.options.type === 'network') {
	      Analytics.send(Analytics.EVENT_CLICK_NETWORK);
	      window.open(this.options.path, '_blank');
	    }
	  }
	  getId() {
	    return 'account-changer';
	  }
	}

	class AdministrationTool extends BaseSecondaryTool {
	  getIconClass() {
	    return '--o-filter-2-lines';
	  }
	  onClick() {
	    window.open(this.options.path, '_blank');
	  }
	  getId() {
	    return 'administration';
	  }
	}

	class PerformanUserProfileTool extends BaseSecondaryTool {
	  getIconClass() {
	    return '--o-achievement';
	  }
	  onClick() {
	    const userId = this.options.userId;
	    BX.Runtime.loadExtension('performan.application.user-profile').then(() => {
	      new BX.Performan.Application.UserProfile({
	        userId
	      }).show();
	    });
	  }
	  getId() {
	    return 'performan-user-profile';
	  }
	}

	class ThemeSecondaryTool extends BaseSecondaryTool {
	  getIconClass() {
	    return '--o-palette';
	  }
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_CHANGE_PORTAL_THEME);
	    main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
	    BX.Intranet.Bitrix24.ThemePicker.Singleton.showDialog(false);
	  }
	  getId() {
	    return 'theme';
	  }
	}

	let _$5 = t => t,
	  _t$5;
	class SecondaryContent extends Content {
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      const container = main_core.Tag.render(_t$5 || (_t$5 = _$5`
				<div data-testid="bx-avatar-widget-content-${0}" class="intranet-avatar-widget-item__wrapper"></div>
			`), this.getId());
	      this.getTools().forEach(tool => {
	        main_core.Dom.append(tool.getLayout(), container);
	      });
	      return container;
	    });
	  }
	  getTools() {
	    return this.cache.remember('tools', () => {
	      const tools = this.getOptions().tools;
	      return [tools.theme ? new ThemeSecondaryTool(tools.theme) : null, tools.accountChanger ? new AccountChangerTool(tools.accountChanger) : null, tools.admin ? new AdministrationTool(tools.admin) : null, tools.performanUserProfile ? new PerformanUserProfileTool(tools.performanUserProfile) : null].filter(Boolean);
	    });
	  }
	  getId() {
	    return 'secondary';
	  }
	}

	class InstallMobileTool extends BaseSecondaryTool {
	  getIconClass() {
	    return '--o-mobile';
	  }
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_INSTALL_MOBILE_APP);
	    main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.FastMobileAuthTool:onClick');
	  }
	}

	class FastMobileAuthTool extends BaseSecondaryTool {
	  getIconClass() {
	    return '--o-qr-code';
	  }
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_FAST_MOBILE_AUTH);
	    main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.FastMobileAuthTool:onClick');
	  }
	  getId() {
	    return 'fast-mobile-auth';
	  }
	}

	let _$6 = t => t,
	  _t$6,
	  _t2$3,
	  _t3$3,
	  _t4$2,
	  _t5$1;
	var _getMobileIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMobileIcon");
	var _getDesktopIcon = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDesktopIcon");
	var _getInstallMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInstallMenu");
	var _getInstallMenuItems = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInstallMenuItems");
	class ApplicationsInstallerTool extends BaseSecondaryTool {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getInstallMenuItems, {
	      value: _getInstallMenuItems2
	    });
	    Object.defineProperty(this, _getInstallMenu, {
	      value: _getInstallMenu2
	    });
	    Object.defineProperty(this, _getDesktopIcon, {
	      value: _getDesktopIcon2
	    });
	    Object.defineProperty(this, _getMobileIcon, {
	      value: _getMobileIcon2
	    });
	  }
	  getIconElement() {
	    return this.cache.remember('icon', () => {
	      if (this.options.mobile.installed) {
	        return main_core.Tag.render(_t$6 || (_t$6 = _$6`
					<span class="intranet-avatar-widget-secondary-tool-icons__wrapper">
						${0}
						<div class="intranet-avatar-widget-secondary-tool-icons__seporator"></div>
						${0}
					</span>
				`), babelHelpers.classPrivateFieldLooseBase(this, _getMobileIcon)[_getMobileIcon](), babelHelpers.classPrivateFieldLooseBase(this, _getDesktopIcon)[_getDesktopIcon]());
	      }
	      return babelHelpers.classPrivateFieldLooseBase(this, _getDesktopIcon)[_getDesktopIcon]();
	    });
	  }
	  getActionElement() {
	    return this.cache.remember('actionElement', () => {
	      if (this.options.desktop.installed && this.options.menu) {
	        const onclick = element => {
	          babelHelpers.classPrivateFieldLooseBase(this, _getInstallMenu)[_getInstallMenu](element.target).toggle();
	        };
	        return main_core.Tag.render(_t2$3 || (_t2$3 = _$6`
					<i onclick="${0}" class="ui-icon-set --more-m intranet-avatar-widget-item__more"/>
				`), onclick);
	      }
	      const desktopDownload = new intranet_desktopDownload.DesktopDownload();
	      const button = new ui_buttons.Button({
	        size: ui_buttons.Button.Size.EXTRA_SMALL,
	        text: this.options.desktop.buttonName,
	        useAirDesign: true,
	        style: ui_buttons.AirButtonStyle.FILLED,
	        noCaps: true,
	        onclick: () => {
	          desktopDownload.handleDownloadClick(button);
	        },
	        wide: true
	      }).render();
	      return main_core.Tag.render(_t3$3 || (_t3$3 = _$6`
				<span class="intranet-avatar-widget-secondary-tool-application__button-wrapper">
					${0}
				</span>
			`), button);
	    });
	  }
	  onClick() {}
	  getId() {
	    return 'applications-installer';
	  }
	}
	function _getMobileIcon2() {
	  return this.cache.remember('mobileIcon', () => {
	    let className = 'ui-icon-set --mobile-selected intranet-avatar-widget-secondary-tool-application__icon';
	    if (this.options.mobile.installed) {
	      className += ' --installed';
	    }
	    return main_core.Tag.render(_t4$2 || (_t4$2 = _$6`
				<i class="${0}"/>
			`), className);
	  });
	}
	function _getDesktopIcon2() {
	  return this.cache.remember('desktopIcon', () => {
	    let className = 'ui-icon-set intranet-avatar-widget-secondary-tool-application__icon';
	    if (this.options.desktop.installed) {
	      className += ' --screen-selected --installed';
	    } else {
	      className += ' --o-screen';
	    }
	    return main_core.Tag.render(_t5$1 || (_t5$1 = _$6`
				<i class="${0}"/>
			`), className);
	  });
	}
	function _getInstallMenu2(bindElement) {
	  return this.cache.remember('installMenu', () => {
	    const items = babelHelpers.classPrivateFieldLooseBase(this, _getInstallMenuItems)[_getInstallMenuItems]();
	    if (items.length === 0) {
	      return null;
	    }
	    return new main_popup.Menu({
	      bindElement,
	      items,
	      offsetLeft: 5,
	      angle: true,
	      fixed: true
	    });
	  });
	}
	function _getInstallMenuItems2() {
	  const items = [];
	  this.options.menu.forEach(item => {
	    if (item.type === 'desktop') {
	      items.push({
	        text: item.title,
	        href: item.installLink,
	        onclick: () => {
	          Analytics.send(Analytics.EVENT_CLICK_INSTALL_DESKTOP_APP);
	          babelHelpers.classPrivateFieldLooseBase(this, _getInstallMenu)[_getInstallMenu]().close();
	        }
	      });
	    } else if (item.type === 'mobile') {
	      items.push({
	        text: item.title,
	        onclick: () => {
	          Analytics.send(Analytics.EVENT_CLICK_INSTALL_MOBILE_APP);
	          babelHelpers.classPrivateFieldLooseBase(this, _getInstallMenu)[_getInstallMenu]().close();
	          main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.ApplicationInstallerTool:onClick');
	        }
	      });
	    }
	  });
	  return items;
	}

	let _$7 = t => t,
	  _t$7;
	var _getTools$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getTools");
	class ApplicationContent extends Content {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getTools$2, {
	      value: _getTools2$2
	    });
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      const container = main_core.Tag.render(_t$7 || (_t$7 = _$7`
				<div data-testid="bx-avatar-widget-content-application" class="intranet-avatar-widget-item__wrapper"></div>
			`));
	      babelHelpers.classPrivateFieldLooseBase(this, _getTools$2)[_getTools$2]().forEach(tool => {
	        main_core.Dom.append(tool.getLayout(), container);
	      });
	      return container;
	    });
	  }
	}
	function _getTools2$2() {
	  return this.cache.remember('tools', () => {
	    const tools = this.getOptions().tools;
	    return [tools.installMobile ? new InstallMobileTool(tools.installMobile) : null, tools.fastMobileAuth ? new FastMobileAuthTool(tools.fastMobileAuth) : null, tools.applicationsInstaller ? new ApplicationsInstallerTool(tools.applicationsInstaller) : null].filter(Boolean);
	  });
	}

	let _$8 = t => t,
	  _t$8;
	var _getBackButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getBackButton");
	class HeaderSubsectionContent extends Content {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getBackButton, {
	      value: _getBackButton2
	    });
	  }
	  getConfig() {
	    return {
	      html: this.getLayout()
	    };
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      return main_core.Tag.render(_t$8 || (_t$8 = _$8`
				<div data-testid="bx-avatar-widget-content-${0}" class="intranet-avatar-widget-item__wrapper">
					<div class="intranet-avatar-widget-item-subsection__header">
						${0}
						<span class="intranet-avatar-widget-item-subsection__title">
							${0}
						</span>
					</div>
					${0}
				</div>
			`), this.getId(), babelHelpers.classPrivateFieldLooseBase(this, _getBackButton)[_getBackButton]().render(), this.getOptions().title, this.getContentWrapper());
	    });
	  }
	  getId() {
	    return '';
	  }
	}
	function _getBackButton2() {
	  return this.cache.remember('backButton', () => {
	    const button = new ui_buttons.Button({
	      icon: 'chevron-left-l',
	      size: ui_buttons.Button.Size.EXTRA_EXTRA_SMALL,
	      style: ui_buttons.AirButtonStyle.OUTLINE,
	      useAirDesign: true,
	      onclick: () => {
	        main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Subsection:back');
	      }
	    });
	    button.setCollapsed(true);
	    return button;
	  });
	}

	let _$9 = t => t,
	  _t$9,
	  _t2$4;
	var _getQR = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getQR");
	var _getWarning = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getWarning");
	class MobileAuthContent extends HeaderSubsectionContent {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _getWarning, {
	      value: _getWarning2
	    });
	    Object.defineProperty(this, _getQR, {
	      value: _getQR2
	    });
	  }
	  getContentWrapper() {
	    return this.cache.remember('content', () => {
	      return main_core.Tag.render(_t$9 || (_t$9 = _$9`
				<div class="intranet-avatar-widget-fast-mobile-auth__wrapper">
					${0}
					${0}
				</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getQR)[_getQR]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getWarning)[_getWarning]());
	    });
	  }
	  getId() {
	    return 'mobile-auth';
	  }
	}
	function _getQR2() {
	  return this.cache.remember('qr', () => {
	    return new ui_shortQrAuth.ShortQrAuth({
	      intent: 'profile',
	      small: false,
	      stub: false
	    });
	  });
	}
	function _getWarning2() {
	  return this.cache.remember('warning', () => {
	    return main_core.Tag.render(_t2$4 || (_t2$4 = _$9`
				<div class="intranet-avatar-widget-fast-mobile-auth-tool__warning">
					${0}
				</div>
			`), this.getOptions().warning);
	  });
	}

	class SecuritySecondaryTool extends BaseSecondaryTool {
	  getIconClass() {
	    return '--o-shield-checked';
	  }
	  onClick() {
	    Analytics.send(Analytics.EVENT_CLICK_2FA_SETUP);
	    main_sidepanel.SidePanel.Instance.open(this.options.url, {
	      width: 1100
	    });
	  }
	  getId() {
	    return 'security';
	  }
	}

	class ExtranetSecondaryContent extends SecondaryContent {
	  getTools() {
	    return this.cache.remember('tools', () => {
	      const tools = this.getOptions().tools;
	      return [tools.security ? new SecuritySecondaryTool(tools.security) : null, tools.theme ? new ThemeSecondaryTool(tools.theme) : null].filter(Boolean);
	    });
	  }
	  getId() {
	    return 'extranet-secondary';
	  }
	}

	let _$a = t => t,
	  _t$a;
	var _annualSummaryPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("annualSummaryPopup");
	class AnnualSummaryContent extends Content {
	  constructor(...args) {
	    super(...args);
	    Object.defineProperty(this, _annualSummaryPopup, {
	      writable: true,
	      value: null
	    });
	  }
	  getLayout() {
	    return this.cache.remember('layout', () => {
	      return main_core.Tag.render(_t$a || (_t$a = _$a`
				<div
						data-testid="bx-avatar-widget-tool-${0}"
						onclick="${0}"
						class="intranet-avatar-widget-item__wrapper intranet-avatar-widget-annual-summary-tool__wrapper"
						>
						<div class="intranet-avatar-widget-annual-summary-tool__background"></div>
						<span class="intranet-avatar-widget-annual-summary-tool__title">
							${0}
						</span>
				</div>
			`), this.getId(), this.onClick.bind(this), this.getTitle());
	    });
	  }
	  getTitle() {
	    return this.getOptions().title;
	  }
	  onClick() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _annualSummaryPopup)[_annualSummaryPopup]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _annualSummaryPopup)[_annualSummaryPopup].show();
	      main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
	      return;
	    }
	    main_core.Dom.addClass(this.getLayout(), 'intranet-avatar-widget-annual-summary-tool__wrapper--loading');
	    Promise.all([main_core.ajax.runAction('intranet.v2.AnnualSummary.load', {}), main_core.Runtime.loadExtension('intranet.notify-banner.annual-summary')]).then(([response, {
	      AnnualSummary
	    }]) => {
	      const {
	        topFeatures,
	        options
	      } = response.data;
	      main_core.Dom.removeClass(this.getLayout(), 'intranet-avatar-widget-annual-summary-tool__wrapper--loading');
	      main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:openChild');
	      babelHelpers.classPrivateFieldLooseBase(this, _annualSummaryPopup)[_annualSummaryPopup] = new AnnualSummary(topFeatures, {
	        ...options,
	        section: 'profile'
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _annualSummaryPopup)[_annualSummaryPopup].subscribe('onShow', () => BX.userOptions.save('intranet', 'annual_summary_25_last_show', null, Math.floor(Date.now() / 1000)));
	      babelHelpers.classPrivateFieldLooseBase(this, _annualSummaryPopup)[_annualSummaryPopup].show();
	    }).catch(error => {
	      console.error(error);
	    });
	  }
	  getId() {
	    return 'annual-summary';
	  }
	}

	var _cache = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cache");
	var _popupsShowAfterBasePopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popupsShowAfterBasePopup");
	var _getContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getContent");
	var _getAnnualSummaryContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAnnualSummaryContent");
	var _getMainContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMainContent");
	var _getSecondaryContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSecondaryContent");
	var _getApplicationContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getApplicationContent");
	var _getFooterContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFooterContent");
	var _getMobileAuthContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getMobileAuthContent");
	var _getFastMobileAuthSubsection = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFastMobileAuthSubsection");
	var _getExtranetSecondaryContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getExtranetSecondaryContent");
	var _setAutoHideEventHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setAutoHideEventHandlers");
	var _setSubsectionEventHandlers = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setSubsectionEventHandlers");
	class Popup extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _setSubsectionEventHandlers, {
	      value: _setSubsectionEventHandlers2
	    });
	    Object.defineProperty(this, _setAutoHideEventHandlers, {
	      value: _setAutoHideEventHandlers2
	    });
	    Object.defineProperty(this, _getExtranetSecondaryContent, {
	      value: _getExtranetSecondaryContent2
	    });
	    Object.defineProperty(this, _getFastMobileAuthSubsection, {
	      value: _getFastMobileAuthSubsection2
	    });
	    Object.defineProperty(this, _getMobileAuthContent, {
	      value: _getMobileAuthContent2
	    });
	    Object.defineProperty(this, _getFooterContent, {
	      value: _getFooterContent2
	    });
	    Object.defineProperty(this, _getApplicationContent, {
	      value: _getApplicationContent2
	    });
	    Object.defineProperty(this, _getSecondaryContent, {
	      value: _getSecondaryContent2
	    });
	    Object.defineProperty(this, _getMainContent, {
	      value: _getMainContent2
	    });
	    Object.defineProperty(this, _getAnnualSummaryContent, {
	      value: _getAnnualSummaryContent2
	    });
	    Object.defineProperty(this, _getContent, {
	      value: _getContent2
	    });
	    Object.defineProperty(this, _cache, {
	      writable: true,
	      value: new main_core.Cache.MemoryCache()
	    });
	    Object.defineProperty(this, _popupsShowAfterBasePopup, {
	      writable: true,
	      value: []
	    });
	    this.setOptions(options);
	    this.setEventNamespace('BX.Intranet.AvatarWidget.Popup');
	    this.setEventHandlers();
	  }
	  setOptions(options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].set('options', options);
	  }
	  getOptions() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].get('options', {});
	  }
	  show() {
	    this.getBasePopup().show();
	    this.emit('show');
	    Analytics.send(Analytics.EVENT_OPEN_WIDGET);
	  }
	  close() {
	    this.getBasePopup().close();
	  }
	  getBasePopup() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('popup', () => {
	      this.emit('beforeInit');
	      const popup = new ui_popupcomponentsmaker.PopupComponentsMaker({
	        target: this.getOptions().target,
	        width: 390,
	        content: babelHelpers.classPrivateFieldLooseBase(this, _getContent)[_getContent](),
	        popupLoader: this.getOptions().loader,
	        padding: 0,
	        offsetTop: -50,
	        offsetLeft: 0
	      });
	      popup.getPopup().setFixed(true);
	      const setOverlay = () => {
	        if (BX.SidePanel.Instance.isOpen()) {
	          popup.getPopup().setOverlay({
	            backgroundColor: 'transparent'
	          });
	          popup.getPopup().showOverlay();
	        }
	      };
	      setOverlay();
	      popup.getPopup().subscribe('onClose', () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _popupsShowAfterBasePopup)[_popupsShowAfterBasePopup] = [];
	        popup.getPopup().removeOverlay();
	      });
	      popup.getPopup().subscribe('onBeforeShow', setOverlay);
	      babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].set('popup', popup);
	      babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].set('contentWrapper', popup.getContentWrapper());
	      this.emit('afterInit');
	      return popup;
	    });
	  }
	  setEventHandlers() {
	    this.subscribe('beforeInit', () => {
	      main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:makeWithHint', () => {
	        this.subscribe('afterInit', () => {
	          BX.UI.Hint.init(this.getBasePopup().getPopup().getPopupContainer());
	        });
	      });
	      this.subscribe('afterInit', () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _setAutoHideEventHandlers)[_setAutoHideEventHandlers]();
	        babelHelpers.classPrivateFieldLooseBase(this, _setSubsectionEventHandlers)[_setSubsectionEventHandlers]();
	        const close = () => {
	          this.close();
	        };
	        main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpenStart', close);
	        main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Popup:openChild', close);
	      });
	    });
	  }
	}
	function _getContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('content', () => {
	    const content = [babelHelpers.classPrivateFieldLooseBase(this, _getMainContent)[_getMainContent]().getConfig()];
	    if (this.getOptions().content.promo) {
	      content.push(babelHelpers.classPrivateFieldLooseBase(this, _getAnnualSummaryContent)[_getAnnualSummaryContent]().getConfig());
	    }
	    content.push(babelHelpers.classPrivateFieldLooseBase(this, _getApplicationContent)[_getApplicationContent]().getConfig());
	    if (this.getOptions().content.extranetSecondary) {
	      content.push(babelHelpers.classPrivateFieldLooseBase(this, _getExtranetSecondaryContent)[_getExtranetSecondaryContent]().getConfig());
	    }
	    if (this.getOptions().content.secondary) {
	      content.push(babelHelpers.classPrivateFieldLooseBase(this, _getSecondaryContent)[_getSecondaryContent]().getConfig());
	    }
	    content.push(babelHelpers.classPrivateFieldLooseBase(this, _getFooterContent)[_getFooterContent]().getConfig());
	    return content;
	  });
	}
	function _getAnnualSummaryContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('annualSummaryContent', () => {
	    return new AnnualSummaryContent({
	      ...this.getOptions().content.promo.tools.annualSummary
	    });
	  });
	}
	function _getMainContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('mainContent', () => {
	    return new MainContent({
	      ...this.getOptions().content.main
	    });
	  });
	}
	function _getSecondaryContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('secondaryContent', () => {
	    return new SecondaryContent({
	      ...this.getOptions().content.secondary
	    });
	  });
	}
	function _getApplicationContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('applicationContent', () => {
	    return new ApplicationContent({
	      ...this.getOptions().content.application
	    });
	  });
	}
	function _getFooterContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('footerContent', () => {
	    return new FooterContent({
	      ...this.getOptions().content.footer
	    });
	  });
	}
	function _getMobileAuthContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('mobileAuthContent', () => {
	    return new MobileAuthContent({
	      ...this.getOptions().content.mobileAuth.tools.fastMobileAuth
	    });
	  });
	}
	function _getFastMobileAuthSubsection2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('fastMobileAuthSubsection', () => {
	    return new ui_popupcomponentsmaker.PopupComponentsMaker({
	      content: [babelHelpers.classPrivateFieldLooseBase(this, _getMobileAuthContent)[_getMobileAuthContent]().getConfig()]
	    }).getContentWrapper();
	  });
	}
	function _getExtranetSecondaryContent2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache)[_cache].remember('extranetSecondaryContent', () => {
	    return new ExtranetSecondaryContent({
	      ...this.getOptions().content.extranetSecondary
	    });
	  });
	}
	function _setAutoHideEventHandlers2() {
	  main_core_events.EventEmitter.subscribe('BX.Main.Popup:onShow', event => {
	    if (!this.getBasePopup().getPopup().isShown()) {
	      return;
	    }
	    main_core.Dom.style(this.getBasePopup().getPopup().getPopupContainer(), 'overflow-y', 'hidden');
	    const popup = event.getTarget();
	    if (popup && popup.getId() === this.getBasePopup().getPopup().getId()) {
	      this.getBasePopup().getPopup().setAutoHide(true);
	      main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:enabledAutoHide');
	    } else {
	      this.getBasePopup().getPopup().setAutoHide(false);
	      main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:disabledAutoHide');
	      if (!babelHelpers.classPrivateFieldLooseBase(this, _popupsShowAfterBasePopup)[_popupsShowAfterBasePopup].includes(popup)) {
	        babelHelpers.classPrivateFieldLooseBase(this, _popupsShowAfterBasePopup)[_popupsShowAfterBasePopup].push(popup);
	      }
	      const handler = () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _popupsShowAfterBasePopup)[_popupsShowAfterBasePopup] = babelHelpers.classPrivateFieldLooseBase(this, _popupsShowAfterBasePopup)[_popupsShowAfterBasePopup].filter(item => item !== popup);
	        if (babelHelpers.classPrivateFieldLooseBase(this, _popupsShowAfterBasePopup)[_popupsShowAfterBasePopup].length === 0) {
	          this.getBasePopup().getPopup().setAutoHide(true);
	          main_core.Dom.style(this.getBasePopup().getPopup().getPopupContainer(), 'overflow-y', 'auto');
	          main_core_events.EventEmitter.emit('BX.Intranet.AvatarWidget.Popup:enabledAutoHide');
	        }
	      };
	      popup.subscribeOnce('onClose', handler);
	      popup.subscribeOnce('onDestroy', handler);
	    }
	  });
	}
	function _setSubsectionEventHandlers2() {
	  const openFastMobileAuthSubsection = () => {
	    const subsection = babelHelpers.classPrivateFieldLooseBase(this, _getFastMobileAuthSubsection)[_getFastMobileAuthSubsection]();
	    this.getBasePopup().getPopup().setContent(subsection);
	  };
	  main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.FastMobileAuthTool:onClick', openFastMobileAuthSubsection);
	  main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.ApplicationInstallerTool:onClick', openFastMobileAuthSubsection);
	  main_core_events.EventEmitter.subscribe('BX.Intranet.AvatarWidget.Subsection:back', () => {
	    this.getBasePopup().getPopup().setContent(this.getBasePopup().getContentWrapper());
	  });
	}

	var _cache$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cache");
	var _instance = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("instance");
	var _getPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopup");
	class AvatarWidget {
	  constructor() {
	    Object.defineProperty(this, _getPopup, {
	      value: _getPopup2
	    });
	    Object.defineProperty(this, _cache$1, {
	      writable: true,
	      value: new main_core.Cache.MemoryCache()
	    });
	  }
	  static getInstance() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance] = new this();
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _instance)[_instance];
	  }
	  show() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().getBasePopup().isShown()) {
	      return;
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().show();
	  }
	  setOptions(options) {
	    babelHelpers.classPrivateFieldLooseBase(this, _cache$1)[_cache$1].set('options', options);
	    return this;
	  }
	  getOptions() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _cache$1)[_cache$1].get('options', {});
	  }
	}
	function _getPopup2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cache$1)[_cache$1].remember('popup', () => {
	    return new Popup({
	      target: this.getOptions().buttonWrapper,
	      loader: this.getOptions().loader,
	      content: {
	        ...this.getOptions().data
	      }
	    });
	  });
	}
	Object.defineProperty(AvatarWidget, _instance, {
	  writable: true,
	  value: void 0
	});

	exports.AvatarWidget = AvatarWidget;

}((this.BX.Intranet = this.BX.Intranet || {}),BX.UI,BX.UI,BX.Timeman,BX.UI.Analytics,BX.UI,BX.Crm,BX,BX.HumanResources.HcmLink,BX.Messenger.v2.Lib,BX.UI,BX.Intranet,BX.Main,BX.Intranet,BX.UI,BX.UI,BX.SidePanel,BX,BX.Event));
//# sourceMappingURL=avatar-widget.bundle.js.map
