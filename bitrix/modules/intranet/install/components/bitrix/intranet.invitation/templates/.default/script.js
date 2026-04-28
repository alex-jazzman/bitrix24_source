/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports,ui_analytics,ui_system_typography,ui_avatar,main_popup,ui_switcher,ui_system_chip,intranet_invitationInput,ui_system_input,DepartmentControl,ui_buttons,main_core_events,main_core) {
	'use strict';

	var DepartmentControl__default = 'default' in DepartmentControl ? DepartmentControl['default'] : DepartmentControl;

	class ActiveDirectory {
	  showForm() {
	    BX.UI.Feedback.Form.open({
	      id: 'intranet-active-directory',
	      forms: [{
	        zones: ['ru'],
	        id: 309,
	        lang: 'ru',
	        sec: 'fbc0n3'
	      }]
	    });
	  }
	}

	const InviteType = Object.freeze({
	  EMAIL: 'email',
	  PHONE: 'phone',
	  ALL: 'all'
	});

	var _cSection = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("cSection");
	var _isAdmin = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isAdmin");
	var _getIsAdmin = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getIsAdmin");
	var _getCSection = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCSection");
	var _getDepartmentControlAnalytics = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDepartmentControlAnalytics");
	class Analytics {
	  constructor(cSection, isAdmin) {
	    Object.defineProperty(this, _getDepartmentControlAnalytics, {
	      value: _getDepartmentControlAnalytics2
	    });
	    Object.defineProperty(this, _getCSection, {
	      value: _getCSection2
	    });
	    Object.defineProperty(this, _getIsAdmin, {
	      value: _getIsAdmin2
	    });
	    Object.defineProperty(this, _cSection, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isAdmin, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _cSection)[_cSection] = cSection;
	    babelHelpers.classPrivateFieldLooseBase(this, _isAdmin)[_isAdmin] = isAdmin;
	  }
	  getDataForAction(type = null) {
	    return {
	      section: babelHelpers.classPrivateFieldLooseBase(this, _getCSection)[_getCSection](),
	      type
	    };
	  }
	  sendCopyLink(departmentControl, needConfirmRegistration) {
	    ui_analytics.sendData({
	      tool: Analytics.TOOLS,
	      category: Analytics.CATEGORY_INVITATION,
	      event: Analytics.EVENT_COPY,
	      c_section: babelHelpers.classPrivateFieldLooseBase(this, _getCSection)[_getCSection](),
	      c_sub_section: Analytics.TAB_LINK,
	      p1: babelHelpers.classPrivateFieldLooseBase(this, _getIsAdmin)[_getIsAdmin](),
	      p2: needConfirmRegistration ? Analytics.ADMIN_ALLOW_MODE_Y : Analytics.ADMIN_ALLOW_MODE_N,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getDepartmentControlAnalytics)[_getDepartmentControlAnalytics](departmentControl)
	    });
	  }
	  sendTabData(section, subSection) {
	    if (!section) {
	      return;
	    }
	    ui_analytics.sendData({
	      tool: Analytics.TOOLS,
	      category: Analytics.CATEGORY_INVITATION,
	      event: Analytics.EVENT_TAB_VIEW,
	      c_section: section,
	      c_sub_section: subSection
	    });
	  }
	  sendOpenSliderData(section) {
	    ui_analytics.sendData({
	      tool: Analytics.TOOLS,
	      category: Analytics.CATEGORY_INVITATION,
	      event: Analytics.EVENT_OPEN_SLIDER_INVITATION,
	      c_section: section
	    });
	  }
	  sendOpenMassInvitePopup(inviteType) {
	    ui_analytics.sendData({
	      tool: Analytics.TOOLS,
	      category: Analytics.CATEGORY_INVITATION,
	      event: Analytics.EVENT_TAB_VIEW,
	      c_section: babelHelpers.classPrivateFieldLooseBase(this, _getCSection)[_getCSection](),
	      c_sub_section: inviteType === InviteType.EMAIL ? Analytics.TAB_MASS_EMAIL : inviteType === InviteType.PHONE ? Analytics.TAB_MASS_PHONE : Analytics.TAB_MASS_EMAIL_PHONE
	    });
	  }
	  sendLocalEmailProgram(departmentControl, needConfirmRegistration) {
	    ui_analytics.sendData({
	      tool: Analytics.TOOLS,
	      category: Analytics.CATEGORY_INVITATION,
	      event: Analytics.EVENT_LOCAL_MAIL,
	      c_section: babelHelpers.classPrivateFieldLooseBase(this, _getCSection)[_getCSection](),
	      c_sub_section: Analytics.TAB_LOCAL_EMAIL,
	      p1: babelHelpers.classPrivateFieldLooseBase(this, _getIsAdmin)[_getIsAdmin](),
	      p2: needConfirmRegistration ? Analytics.ADMIN_ALLOW_MODE_Y : Analytics.ADMIN_ALLOW_MODE_N,
	      ...babelHelpers.classPrivateFieldLooseBase(this, _getDepartmentControlAnalytics)[_getDepartmentControlAnalytics](departmentControl)
	    });
	  }
	  sendRegenerateLink() {
	    ui_analytics.sendData({
	      tool: Analytics.TOOLS,
	      category: Analytics.CATEGORY_SETTINGS,
	      event: Analytics.EVENT_REFRESH_LINK,
	      c_section: babelHelpers.classPrivateFieldLooseBase(this, _getCSection)[_getCSection]()
	    });
	  }
	}
	function _getIsAdmin2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _isAdmin)[_isAdmin] ? Analytics.IS_ADMIN_Y : Analytics.IS_ADMIN_N;
	}
	function _getCSection2() {
	  return babelHelpers.classPrivateFieldLooseBase(this, _cSection)[_cSection].source;
	}
	function _getDepartmentControlAnalytics2(departmentControl) {
	  return {
	    p3: departmentControl.getValues().length > 0 ? 'department_Y' : 'department_N',
	    p4: departmentControl.getGroupValues().length > 0 ? 'group_Y' : 'group_N'
	  };
	}
	Analytics.TOOLS = 'Invitation';
	Analytics.TOOLS_HEADER = 'headerPopup';
	Analytics.EVENT_OPEN_SLIDER_INVITATION = 'drawer_open';
	Analytics.CATEGORY_INVITATION = 'invitation';
	Analytics.CATEGORY_SETTINGS = 'settings';
	Analytics.EVENT_COPY = 'copy_invitation_link';
	Analytics.ADMIN_ALLOW_MODE_Y = 'askAdminToAllow_Y';
	Analytics.ADMIN_ALLOW_MODE_N = 'askAdminToAllow_N';
	Analytics.IS_ADMIN_Y = 'isAdmin_Y';
	Analytics.IS_ADMIN_N = 'isAdmin_N';
	Analytics.EVENT_TAB_VIEW = 'tab_view';
	Analytics.EVENT_LOCAL_MAIL = 'invitation_local_mail';
	Analytics.EVENT_REFRESH_LINK = 'refresh_link';
	Analytics.TAB_EMAIL = 'tab_by_email';
	Analytics.TAB_MASS = 'tab_mass';
	Analytics.TAB_MASS_EMAIL = 'tab_mass_by_email';
	Analytics.TAB_MASS_EMAIL_PHONE = 'tab_mass_by_email_phone';
	Analytics.TAB_MASS_PHONE = 'tab_mass_by_phone';
	Analytics.TAB_DEPARTMENT = 'tab_department';
	Analytics.TAB_INTEGRATOR = 'tab_integrator';
	Analytics.TAB_LINK = 'by_link';
	Analytics.TAB_REGISTRATION = 'registration';
	Analytics.TAB_EXTRANET = 'extranet';
	Analytics.TAB_AD = 'AD';
	Analytics.TAB_LOCAL_EMAIL = 'tab_by_local_email';
	Analytics.TAB_PHONE = 'tab_by_phone';

	let _ = t => t,
	  _t;
	var _errorContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("errorContainer");
	var _successContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("successContainer");
	var _wrapMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("wrapMessage");
	class MessageBar {
	  constructor(options) {
	    Object.defineProperty(this, _wrapMessage, {
	      value: _wrapMessage2
	    });
	    Object.defineProperty(this, _errorContainer, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _successContainer, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _errorContainer)[_errorContainer] = main_core.Type.isDomNode(options.errorContainer) ? options.errorContainer : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _successContainer)[_successContainer] = main_core.Type.isDomNode(options.successContainer) ? options.successContainer : null;
	    this.hideAll();
	  }
	  showError(message) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _errorContainer)[_errorContainer] || !main_core.Type.isStringFilled(message)) {
	      return;
	    }
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _errorContainer)[_errorContainer]);
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _errorContainer)[_errorContainer], 'display', 'block');
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _wrapMessage)[_wrapMessage](message), babelHelpers.classPrivateFieldLooseBase(this, _errorContainer)[_errorContainer]);
	  }
	  showSuccess(message) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _successContainer)[_successContainer] || !main_core.Type.isStringFilled(message)) {
	      return;
	    }
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _successContainer)[_successContainer]);
	    main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _successContainer)[_successContainer], 'display', 'block');
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _wrapMessage)[_wrapMessage](message), babelHelpers.classPrivateFieldLooseBase(this, _successContainer)[_successContainer]);
	  }
	  hideAll() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _errorContainer)[_errorContainer]) {
	      main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _errorContainer)[_errorContainer], 'display', 'none');
	      main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _errorContainer)[_errorContainer]);
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _successContainer)[_successContainer]) {
	      main_core.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _successContainer)[_successContainer], 'display', 'none');
	      main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _successContainer)[_successContainer]);
	    }
	  }
	}
	function _wrapMessage2(text) {
	  return main_core.Tag.render(_t || (_t = _`<span class="ui-alert-message">${0}</span>`), BX.util.htmlspecialchars(text));
	}

	class Page {
	  constructor() {
	    main_core_events.EventEmitter.subscribe(this, 'BX.Intranet.Invitation:submit', this.onSubmit.bind(this));
	    main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:onInviteRequestSuccess', this.onInviteSuccess.bind(this));
	  }
	  render() {
	    return new HTMLElement();
	  }
	  onSubmit(event) {}
	  onInviteSuccess(event) {}
	  hasShownButtonPanel() {
	    return true;
	  }
	}

	var _pages = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pages");
	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _first = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("first");
	var _current = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("current");
	var _history = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("history");
	var _subscribeEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribeEvents");
	var _onPageUpdate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onPageUpdate");
	class Navigation extends main_core_events.EventEmitter {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _onPageUpdate, {
	      value: _onPageUpdate2
	    });
	    Object.defineProperty(this, _subscribeEvents, {
	      value: _subscribeEvents2
	    });
	    Object.defineProperty(this, _pages, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _container, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _first, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _current, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _history, {
	      writable: true,
	      value: []
	    });
	    this.setEventNamespace('BX.Intranet.Navigation');
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = main_core.Type.isDomNode(options.container) ? options.container : null;
	    if (main_core.Type.isMap(options.pages)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _pages)[_pages] = new Map([...options.pages].filter(([k, page]) => page instanceof Page));
	    } else {
	      babelHelpers.classPrivateFieldLooseBase(this, _pages)[_pages] = new Map();
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _first)[_first] = main_core.Type.isStringFilled(options.first) && this.has(options.first) ? options.first : babelHelpers.classPrivateFieldLooseBase(this, _pages)[_pages].keys().next().value;
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribeEvents)[_subscribeEvents]();
	  }
	  show(code) {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] || !this.has(code)) {
	      return;
	    }
	    const page = this.get(code);
	    this.emit('onBeforeChangePage', {
	      current: this.current(),
	      new: page,
	      newPageCode: code
	    });
	    main_core.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	    main_core.Dom.append(page.render(), babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _current)[_current]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _history)[_history].push(babelHelpers.classPrivateFieldLooseBase(this, _current)[_current]);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _current)[_current] = code;
	    this.emit('onAfterChangePage', {
	      current: this.current(),
	      previous: this.prev()
	    });
	  }
	  showFirst() {
	    this.show(babelHelpers.classPrivateFieldLooseBase(this, _first)[_first]);
	  }
	  get(code) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _pages)[_pages].get(code);
	  }
	  has(code) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _pages)[_pages].has(code);
	  }
	  current() {
	    return this.get(babelHelpers.classPrivateFieldLooseBase(this, _current)[_current]);
	  }
	  getCurrentCode() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _current)[_current];
	  }
	  prev() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _history)[_history].length > 0) {
	      const code = babelHelpers.classPrivateFieldLooseBase(this, _history)[_history][babelHelpers.classPrivateFieldLooseBase(this, _history)[_history].length - 1];
	      return this.get(code);
	    }
	    return null;
	  }
	  add(code, page) {
	    if (page instanceof Page) {
	      babelHelpers.classPrivateFieldLooseBase(this, _pages)[_pages].set(code, page);
	    }
	  }
	  delete(code) {
	    babelHelpers.classPrivateFieldLooseBase(this, _pages)[_pages].delete(code);
	  }
	}
	function _subscribeEvents2() {
	  main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:pageUpdate', babelHelpers.classPrivateFieldLooseBase(this, _onPageUpdate)[_onPageUpdate].bind(this));
	}
	function _onPageUpdate2(event) {
	  var _event$data, _event$data2;
	  if ((_event$data = event.data) != null && _event$data.pages && main_core.Type.isMap((_event$data2 = event.data) == null ? void 0 : _event$data2.pages)) {
	    var _event$data3;
	    babelHelpers.classPrivateFieldLooseBase(this, _pages)[_pages] = (_event$data3 = event.data) == null ? void 0 : _event$data3.pages;
	    this.show(babelHelpers.classPrivateFieldLooseBase(this, _current)[_current]);
	  }
	}

	var _componentName = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("componentName");
	var _signedParameters = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("signedParameters");
	var _onSuccess = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSuccess");
	var _analytics = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("analytics");
	class Transport {
	  constructor(options) {
	    Object.defineProperty(this, _componentName, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _signedParameters, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onSuccess, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _analytics, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _componentName)[_componentName] = options.componentName;
	    babelHelpers.classPrivateFieldLooseBase(this, _signedParameters)[_signedParameters] = options.signedParameters;
	    babelHelpers.classPrivateFieldLooseBase(this, _analytics)[_analytics] = options.analytics;
	    babelHelpers.classPrivateFieldLooseBase(this, _onSuccess)[_onSuccess] = options.onSuccess;
	    this.onError = options.onError;
	  }
	  send(request, onError = null, analyticsData = null) {
	    request.data.analyticsData = analyticsData != null ? analyticsData : babelHelpers.classPrivateFieldLooseBase(this, _analytics)[_analytics].getDataForAction();
	    return main_core.ajax.runComponentAction(babelHelpers.classPrivateFieldLooseBase(this, _componentName)[_componentName], request.action, {
	      signedParameters: babelHelpers.classPrivateFieldLooseBase(this, _signedParameters)[_signedParameters],
	      mode: main_core.Type.isStringFilled(request.mode) ? request.mode : 'ajax',
	      method: main_core.Type.isStringFilled(request.method) ? request.method : 'post',
	      data: request.data,
	      analyticsLabel: request.analyticsLabel
	    }).then(response => {
	      babelHelpers.classPrivateFieldLooseBase(this, _onSuccess)[_onSuccess](response);
	      return response;
	    }).catch(reject => {
	      if (onError) {
	        onError(reject);
	      } else {
	        this.onError(reject);
	      }
	    });
	  }
	  sendAction(request, onError = null, analyticsData = null) {
	    request.data.analyticsData = analyticsData != null ? analyticsData : babelHelpers.classPrivateFieldLooseBase(this, _analytics)[_analytics].getDataForAction();
	    return main_core.ajax.runAction(request.action, {
	      signedParameters: babelHelpers.classPrivateFieldLooseBase(this, _signedParameters)[_signedParameters],
	      mode: main_core.Type.isStringFilled(request.mode) ? request.mode : 'ajax',
	      method: main_core.Type.isStringFilled(request.method) ? request.method : 'post',
	      data: request.data,
	      analytics: request.analytics
	    }).then(response => {
	      babelHelpers.classPrivateFieldLooseBase(this, _onSuccess)[_onSuccess](response);
	      return response;
	    }).catch(reject => {
	      if (onError) {
	        onError(reject);
	      } else {
	        this.onError(reject);
	      }
	    });
	  }
	}

	let _$1 = t => t,
	  _t$1,
	  _t2,
	  _t3,
	  _t4,
	  _t5,
	  _t6,
	  _t7,
	  _t8,
	  _t9,
	  _t10,
	  _t11,
	  _t12,
	  _t13,
	  _t14,
	  _t15;
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _sendButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendButton");
	var _userList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("userList");
	var _selectedUserIds = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectedUserIds");
	var _transport = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("transport");
	var _popupContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popupContainer");
	var _isMultipleMode = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isMultipleMode");
	var _isRestoreUsersAccessAvailable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isRestoreUsersAccessAvailable");
	var _getPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopup");
	var _getPopupContentWithoutRestoreAccess = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopupContentWithoutRestoreAccess");
	var _getPopupContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopupContent");
	var _getUserRole = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getUserRole");
	var _getUserBlockContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getUserBlockContent");
	var _bindCheckboxChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindCheckboxChange");
	var _renderUserAvatar = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderUserAvatar");
	var _getActionContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getActionContent");
	var _checkSendButtonState = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkSendButtonState");
	var _getSendButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSendButton");
	var _getPassLoginButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPassLoginButton");
	var _showSuccessNotification = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showSuccessNotification");
	var _getNotificationContent = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getNotificationContent");
	class RestoreFiredUsersPopup {
	  constructor(options) {
	    Object.defineProperty(this, _getNotificationContent, {
	      value: _getNotificationContent2
	    });
	    Object.defineProperty(this, _showSuccessNotification, {
	      value: _showSuccessNotification2
	    });
	    Object.defineProperty(this, _getPassLoginButton, {
	      value: _getPassLoginButton2
	    });
	    Object.defineProperty(this, _getSendButton, {
	      value: _getSendButton2
	    });
	    Object.defineProperty(this, _checkSendButtonState, {
	      value: _checkSendButtonState2
	    });
	    Object.defineProperty(this, _getActionContent, {
	      value: _getActionContent2
	    });
	    Object.defineProperty(this, _renderUserAvatar, {
	      value: _renderUserAvatar2
	    });
	    Object.defineProperty(this, _bindCheckboxChange, {
	      value: _bindCheckboxChange2
	    });
	    Object.defineProperty(this, _getUserBlockContent, {
	      value: _getUserBlockContent2
	    });
	    Object.defineProperty(this, _getUserRole, {
	      value: _getUserRole2
	    });
	    Object.defineProperty(this, _getPopupContent, {
	      value: _getPopupContent2
	    });
	    Object.defineProperty(this, _getPopupContentWithoutRestoreAccess, {
	      value: _getPopupContentWithoutRestoreAccess2
	    });
	    Object.defineProperty(this, _getPopup, {
	      value: _getPopup2
	    });
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _sendButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _userList, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _selectedUserIds, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _transport, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _popupContainer, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isMultipleMode, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isRestoreUsersAccessAvailable, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList] = options.userList;
	    babelHelpers.classPrivateFieldLooseBase(this, _isRestoreUsersAccessAvailable)[_isRestoreUsersAccessAvailable] = options.isRestoreUsersAccessAvailable;
	    babelHelpers.classPrivateFieldLooseBase(this, _transport)[_transport] = options.transport;
	    babelHelpers.classPrivateFieldLooseBase(this, _isMultipleMode)[_isMultipleMode] = babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList].length > 1;
	    babelHelpers.classPrivateFieldLooseBase(this, _selectedUserIds)[_selectedUserIds] = babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList].map(user => user.id);
	  }
	  show() {
	    if (main_core.Type.isArray(babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList]) && babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList].length > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().show();
	    }
	  }
	}
	function _getPopup2() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2;
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _popup))[_popup]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_popup] = new main_popup.Popup({
	    id: 'intranet-restore-fired-users',
	    content: babelHelpers.classPrivateFieldLooseBase(this, _isRestoreUsersAccessAvailable)[_isRestoreUsersAccessAvailable] ? babelHelpers.classPrivateFieldLooseBase(this, _getPopupContent)[_getPopupContent]() : babelHelpers.classPrivateFieldLooseBase(this, _getPopupContentWithoutRestoreAccess)[_getPopupContentWithoutRestoreAccess](),
	    closeByEsc: true,
	    closeIcon: true,
	    closeIconSize: main_popup.CloseIconSize.LARGE,
	    autoHide: true,
	    padding: 25,
	    width: babelHelpers.classPrivateFieldLooseBase(this, _isRestoreUsersAccessAvailable)[_isRestoreUsersAccessAvailable] ? 515 : 400,
	    events: {
	      onPopupClose: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].destroy();
	      }
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup];
	}
	function _getPopupContentWithoutRestoreAccess2() {
	  var _babelHelpers$classPr3;
	  const button = new ui_buttons.Button({
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_OK'),
	    style: ui_buttons.AirButtonStyle.FILLED,
	    useAirDesign: true,
	    onclick: () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().close();
	    }
	  }).render();
	  return main_core.Tag.render(_t$1 || (_t$1 = _$1`
			<div>
				<span class="ui-text --lg">
					${0}
				</span>
				<div class="intranet-invitation-popup__footer">
					${0}
				</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _isMultipleMode)[_isMultipleMode] ? main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_NO_ACCESS_MULTIPLE', {
	    '#LOGIN#': `<strong>${babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList].map(user => user.login).join(', ')}</strong>`
	  }) : main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_NO_ACCESS_SINGLE', {
	    '#LOGIN#': `<strong>${(_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList][0]) == null ? void 0 : _babelHelpers$classPr3.login}</strong>`
	  }), button);
	}
	function _getPopupContent2() {
	  var _babelHelpers$classPr4;
	  babelHelpers.classPrivateFieldLooseBase(this, _popupContainer)[_popupContainer] = main_core.Tag.render(_t2 || (_t2 = _$1`
			<div class="" data-role="intranet-invitation-fired-popup-container"></div>
		`));
	  const headTitle = main_core.Tag.render(_t3 || (_t3 = _$1`
			<span class="ui-text --md">
				${0}
			</span>
		`), babelHelpers.classPrivateFieldLooseBase(this, _isMultipleMode)[_isMultipleMode] ? main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_TITLE_MULTIPLE') : main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_TITLE_SINGLE', {
	    '#LOGIN#': `<strong>${(_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList][0]) == null ? void 0 : _babelHelpers$classPr4.login}</strong>`
	  }));
	  main_core.Dom.append(headTitle, babelHelpers.classPrivateFieldLooseBase(this, _popupContainer)[_popupContainer]);
	  const wrapper = main_core.Tag.render(_t4 || (_t4 = _$1`
			<div class="intranet-invitation-fired-popup-wrapper"></div>
		`));
	  babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList].forEach(user => {
	    main_core.Dom.append(babelHelpers.classPrivateFieldLooseBase(this, _getUserBlockContent)[_getUserBlockContent](user), wrapper);
	  });
	  main_core.Dom.append(wrapper, babelHelpers.classPrivateFieldLooseBase(this, _popupContainer)[_popupContainer]);
	  const buttons = main_core.Tag.render(_t5 || (_t5 = _$1`
			<div class="intranet-invitation-popup__footer">
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getActionContent)[_getActionContent]());
	  main_core.Dom.append(buttons, babelHelpers.classPrivateFieldLooseBase(this, _popupContainer)[_popupContainer]);
	  return babelHelpers.classPrivateFieldLooseBase(this, _popupContainer)[_popupContainer];
	}
	function _getUserRole2(user) {
	  let roleNode = main_core.Tag.render(_t6 || (_t6 = _$1``));
	  if (user.role === 'collaber') {
	    roleNode = main_core.Tag.render(_t7 || (_t7 = _$1`
				<span class="ui-text --3xs intranet-invitation-fired-popup-user__name-role --collaber">
					${0}
				</span>
			`), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_USER_ROLE_COLLABER'));
	  }
	  if (user.role === 'extranet') {
	    roleNode = main_core.Tag.render(_t8 || (_t8 = _$1`
				<span class="ui-text --3xs intranet-invitation-fired-popup-user__name-role --extranet">
					${0}
				</span>
			`), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_USER_ROLE_EXTRANET'));
	  }
	  return roleNode;
	}
	function _getUserBlockContent2(user) {
	  let checkboxNode = main_core.Tag.render(_t9 || (_t9 = _$1``));
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isMultipleMode)[_isMultipleMode]) {
	    checkboxNode = main_core.Tag.render(_t10 || (_t10 = _$1`
				<div style="margin-left: 10px;">
					<input 
						type="checkbox" 
						checked 
						class="intranet-invitation-checkbox" 
						value="${0}"
					/>
				</div>
			`), user == null ? void 0 : user.id);
	  }
	  const userBlock = main_core.Tag.render(_t11 || (_t11 = _$1`
			<div class="intranet-invitation-fired-popup-user__wrapper ${0}">
				${0}
				<div>
					${0}
				</div>
				<div class="intranet-invitation-fired-popup-user__name-block ${0}">
					<a href="${0}" class="ui-link ui-link-dashed" style="font-size:16px;">${0}</a>
					<div>${0}</div>
					${0}
				</div>
				<div>
					${0}
					<div>${0}</div>
				</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _isMultipleMode)[_isMultipleMode] ? '--filled' : '', checkboxNode, babelHelpers.classPrivateFieldLooseBase(this, _renderUserAvatar)[_renderUserAvatar](user), babelHelpers.classPrivateFieldLooseBase(this, _isMultipleMode)[_isMultipleMode] ? '' : '--wide', user.profileUrl, user.name, ui_system_typography.Text.render(user == null ? void 0 : user.position, {
	    size: '2xs',
	    className: 'intranet-invitation-fired-popup-user__text'
	  }), babelHelpers.classPrivateFieldLooseBase(this, _getUserRole)[_getUserRole](user), user != null && user.email ? main_core.Tag.render(_t12 || (_t12 = _$1`<a href="mailto:${0}" class="ui-link ui-link-dashed">${0}</a>`), user.email, user.email) : '', ui_system_typography.Text.render(user == null ? void 0 : user.phoneNumber, {
	    size: '2xs',
	    className: 'intranet-invitation-fired-popup-user__text'
	  }));
	  babelHelpers.classPrivateFieldLooseBase(this, _bindCheckboxChange)[_bindCheckboxChange](userBlock);
	  return userBlock;
	}
	function _bindCheckboxChange2(userBlock) {
	  const checkbox = userBlock.querySelector('input[type="checkbox"]');
	  main_core.Event.bind(checkbox, 'change', () => {
	    const userId = Number(checkbox.value);
	    if (checkbox.checked) {
	      main_core.Dom.addClass(userBlock, '--filled');
	      if (!babelHelpers.classPrivateFieldLooseBase(this, _selectedUserIds)[_selectedUserIds].includes(userId)) {
	        babelHelpers.classPrivateFieldLooseBase(this, _selectedUserIds)[_selectedUserIds].push(userId);
	      }
	    } else {
	      main_core.Dom.removeClass(userBlock, '--filled');
	      babelHelpers.classPrivateFieldLooseBase(this, _selectedUserIds)[_selectedUserIds] = babelHelpers.classPrivateFieldLooseBase(this, _selectedUserIds)[_selectedUserIds].filter(id => id !== userId);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _checkSendButtonState)[_checkSendButtonState]();
	  });
	}
	function _renderUserAvatar2(user) {
	  var _user$photo;
	  const avatarWrapper = main_core.Tag.render(_t13 || (_t13 = _$1`<div class='intranet-invitation-fired-popup-user__avatar-wrapper'></div>`));
	  const avatarOptions = {
	    size: 40,
	    userpicPath: (_user$photo = user == null ? void 0 : user.photo) != null ? _user$photo : null
	  };
	  let avatar = null;
	  if (user.role === 'collaber') {
	    avatar = new ui_avatar.AvatarRoundGuest(avatarOptions);
	  } else if (user.role === 'extranet') {
	    avatar = new ui_avatar.AvatarRoundExtranet(avatarOptions);
	  } else {
	    avatar = new ui_avatar.AvatarRound(avatarOptions);
	  }
	  avatar.renderTo(avatarWrapper);
	  return avatarWrapper;
	}
	function _getActionContent2() {
	  return main_core.Tag.render(_t14 || (_t14 = _$1`
			<div class="intranet-invitation-popup__footer-button-container">
				${0}
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getSendButton)[_getSendButton]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getPassLoginButton)[_getPassLoginButton]().render());
	}
	function _checkSendButtonState2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _selectedUserIds)[_selectedUserIds].length > 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendButton)[_sendButton].setState(ui_buttons.ButtonState.ACTIVE);
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _sendButton)[_sendButton].setState(ui_buttons.ButtonState.DISABLED);
	  }
	}
	function _getSendButton2() {
	  var _babelHelpers$classPr5, _babelHelpers$classPr6;
	  (_babelHelpers$classPr6 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _sendButton))[_sendButton]) != null ? _babelHelpers$classPr6 : _babelHelpers$classPr5[_sendButton] = new ui_buttons.Button({
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_RESTORE'),
	    style: ui_buttons.AirButtonStyle.FILLED,
	    useAirDesign: true,
	    onclick: () => {
	      const currentButtonState = babelHelpers.classPrivateFieldLooseBase(this, _sendButton)[_sendButton].getState();
	      if (currentButtonState === ui_buttons.ButtonState.WAITING || currentButtonState === ui_buttons.ButtonState.DISABLED) {
	        return;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _sendButton)[_sendButton].setState(ui_buttons.ButtonState.WAITING);
	      babelHelpers.classPrivateFieldLooseBase(this, _transport)[_transport].send({
	        action: 'restoreFiredUsers',
	        data: {
	          userIds: babelHelpers.classPrivateFieldLooseBase(this, _isMultipleMode)[_isMultipleMode] ? babelHelpers.classPrivateFieldLooseBase(this, _selectedUserIds)[_selectedUserIds] : [babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList][0].id]
	        }
	      }, {
	        showSuccessPopup: false
	      }).then(response => {
	        babelHelpers.classPrivateFieldLooseBase(this, _getPopup)[_getPopup]().close();
	        babelHelpers.classPrivateFieldLooseBase(this, _showSuccessNotification)[_showSuccessNotification](response.data.restoredUserIds);
	      }).catch(reject => {
	        console.error(reject);
	      });
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _sendButton)[_sendButton];
	}
	function _getPassLoginButton2() {
	  return new ui_buttons.Button({
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_PASS_LOGIN'),
	    useAirDesign: true,
	    style: ui_buttons.AirButtonStyle.PLAIN,
	    onclick: () => {
	      if (top.BX.Helper) {
	        top.BX.Helper.show('redirect=detail&code=17964466');
	      }
	    }
	  });
	}
	function _showSuccessNotification2(restoredUserIds) {
	  const restoredUserIdsNumeric = new Set(restoredUserIds.map(id => Number(id)));
	  const restoredUsers = babelHelpers.classPrivateFieldLooseBase(this, _userList)[_userList].filter(user => restoredUserIdsNumeric.has(user.id));
	  const notificationOptions = {
	    id: 'restore-notification-success',
	    autoHideDelay: 4000,
	    closeButton: false,
	    autoHide: true,
	    content: babelHelpers.classPrivateFieldLooseBase(this, _getNotificationContent)[_getNotificationContent](restoredUsers),
	    useAirDesign: true
	  };
	  const notify = BX.UI.Notification.Center.notify(notificationOptions);
	  notify.show();
	  notify.activateAutoHide();
	}
	function _getNotificationContent2(restoredUsers) {
	  var _restoredUsers$, _restoredUsers$2;
	  return main_core.Tag.render(_t15 || (_t15 = _$1`
			<div class="invite-email-notification">
				<div class="invite-email-notification__content">
					<div class="invite-email-notification__description ui-text --2xs">
						${0}
					</div>
				</div>
			</div>
		`), restoredUsers.length > 1 ? main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_SUCCESS_NOTIFICATION_MULTIPLE', {
	    '#NAME#': `<strong>${(_restoredUsers$ = restoredUsers[0]) == null ? void 0 : _restoredUsers$.name}</strong>`,
	    '#NUM#': restoredUsers.length - 1
	  }) : main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FIRED_POPUP_SUCCESS_NOTIFICATION_SINGLE', {
	    '#NAME#': `<strong>${(_restoredUsers$2 = restoredUsers[0]) == null ? void 0 : _restoredUsers$2.name}</strong>`
	  }));
	}

	let _$2 = t => t,
	  _t$2,
	  _t2$1;
	var _popup$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _input = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("input");
	var _sendButton$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendButton");
	var _departmentControl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("departmentControl");
	var _inviteType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inviteType");
	var _analytics$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("analytics");
	var _transport$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("transport");
	var _getInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInput");
	var _getPlaceholder = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPlaceholder");
	var _getPopup$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopup");
	var _getPopupContent$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopupContent");
	var _getActionContent$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getActionContent");
	var _getSendButton$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSendButton");
	var _getCancelButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCancelButton");
	class InviteEmailPopup {
	  constructor(options) {
	    Object.defineProperty(this, _getCancelButton, {
	      value: _getCancelButton2
	    });
	    Object.defineProperty(this, _getSendButton$1, {
	      value: _getSendButton2$1
	    });
	    Object.defineProperty(this, _getActionContent$1, {
	      value: _getActionContent2$1
	    });
	    Object.defineProperty(this, _getPopupContent$1, {
	      value: _getPopupContent2$1
	    });
	    Object.defineProperty(this, _getPopup$1, {
	      value: _getPopup2$1
	    });
	    Object.defineProperty(this, _getPlaceholder, {
	      value: _getPlaceholder2
	    });
	    Object.defineProperty(this, _getInput, {
	      value: _getInput2
	    });
	    Object.defineProperty(this, _popup$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _input, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _sendButton$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _departmentControl, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _inviteType, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _analytics$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _transport$1, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _departmentControl)[_departmentControl] = options.departmentControl;
	    babelHelpers.classPrivateFieldLooseBase(this, _inviteType)[_inviteType] = options.inviteType;
	    babelHelpers.classPrivateFieldLooseBase(this, _analytics$1)[_analytics$1] = options.analytics;
	    babelHelpers.classPrivateFieldLooseBase(this, _transport$1)[_transport$1] = options.transport;
	  }
	  show() {
	    babelHelpers.classPrivateFieldLooseBase(this, _getPopup$1)[_getPopup$1]().show();
	  }
	  onReadySaveInputHandler() {
	    babelHelpers.classPrivateFieldLooseBase(this, _getSendButton$1)[_getSendButton$1]().setState(null);
	  }
	  onUnreadySaveInputHandler() {
	    babelHelpers.classPrivateFieldLooseBase(this, _getSendButton$1)[_getSendButton$1]().setState(ui_buttons.ButtonState.DISABLED);
	  }
	}
	function _getInput2() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2;
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _input))[_input]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_input] = new intranet_invitationInput.InvitationInput({
	    id: 'invite-page-popup-invitation-input',
	    inputType: babelHelpers.classPrivateFieldLooseBase(this, _inviteType)[_inviteType],
	    onReadySave: this.onReadySaveInputHandler.bind(this),
	    onUnreadySave: this.onUnreadySaveInputHandler.bind(this),
	    placeholder: babelHelpers.classPrivateFieldLooseBase(this, _getPlaceholder)[_getPlaceholder]()
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _input)[_input];
	}
	function _getPlaceholder2() {
	  switch (babelHelpers.classPrivateFieldLooseBase(this, _inviteType)[_inviteType]) {
	    case InviteType.EMAIL:
	      return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_PLACEHOLDER');
	    case InviteType.PHONE:
	      return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_PHONE_PLACEHOLDER');
	    case InviteType.ALL:
	    default:
	      return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_OR_PHONE_PLACEHOLDER');
	  }
	}
	function _getPopup2$1() {
	  var _babelHelpers$classPr3, _babelHelpers$classPr4;
	  (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _popup$1))[_popup$1]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[_popup$1] = new main_popup.Popup({
	    content: babelHelpers.classPrivateFieldLooseBase(this, _getPopupContent$1)[_getPopupContent$1](),
	    id: 'email-invitation-email',
	    className: 'email-invitation-container',
	    closeIcon: true,
	    autoHide: false,
	    closeByEsc: true,
	    width: 515,
	    closeIconSize: main_popup.CloseIconSize.LARGE,
	    padding: 0,
	    overlay: {
	      backgroundColor: 'rgba(0, 32, 78, 0.46)'
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _popup$1)[_popup$1];
	}
	function _getPopupContent2$1() {
	  return main_core.Tag.render(_t$2 || (_t$2 = _$2`
			<div class="intranet-invitation-popup">
				<div class="intranet-invitation-popup__title">
					<span class="ui-headline --sm">${0}</span>
				</div>
				<div class="intranet-invitation-popup__body">
					<p class="intranet-invitation-description ui-text --sm">
						${0}
					</p>
					<div class="email-popup-container__input">
						${0}
					</div>
				</div>
				<div class="intranet-invitation-popup__footer">
					${0}
				</div>
			</div>
		`), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_TITLE'), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_DESCRIPTION_MSGVER_1'), babelHelpers.classPrivateFieldLooseBase(this, _getInput)[_getInput]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getActionContent$1)[_getActionContent$1]());
	}
	function _getActionContent2$1() {
	  return main_core.Tag.render(_t2$1 || (_t2$1 = _$2`
			<div class="intranet-invitation-popup__footer-button-container">
				${0}
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getSendButton$1)[_getSendButton$1]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getCancelButton)[_getCancelButton]().render());
	}
	function _getSendButton2$1() {
	  var _babelHelpers$classPr5, _babelHelpers$classPr6;
	  (_babelHelpers$classPr6 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _sendButton$1))[_sendButton$1]) != null ? _babelHelpers$classPr6 : _babelHelpers$classPr5[_sendButton$1] = new ui_buttons.Button({
	    id: 'invite-popup-send-button',
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_ACTION_SEND'),
	    state: ui_buttons.ButtonState.DISABLED,
	    style: ui_buttons.AirButtonStyle.FILLED,
	    useAirDesign: true,
	    onclick: () => {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _sendButton$1)[_sendButton$1].getState() === ui_buttons.ButtonState.WAITING) {
	        return;
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _sendButton$1)[_sendButton$1].setState(ui_buttons.ButtonState.WAITING);
	      babelHelpers.classPrivateFieldLooseBase(this, _getInput)[_getInput]().inviteToDepartmentGroup(babelHelpers.classPrivateFieldLooseBase(this, _departmentControl)[_departmentControl].getValues(), babelHelpers.classPrivateFieldLooseBase(this, _departmentControl)[_departmentControl].getGroupValues(), babelHelpers.classPrivateFieldLooseBase(this, _analytics$1)[_analytics$1].getDataForAction('mass')).then(response => {
	        var _response$data, _response$data2;
	        if (response.data.invitedUserIds.length > 0) {
	          main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
	        }
	        babelHelpers.classPrivateFieldLooseBase(this, _getPopup$1)[_getPopup$1]().close();
	        babelHelpers.classPrivateFieldLooseBase(this, _sendButton$1)[_sendButton$1].setState(null);
	        if ((_response$data = response.data) != null && _response$data.firedUserList && ((_response$data2 = response.data) == null ? void 0 : _response$data2.firedUserList.length) > 0) {
	          new RestoreFiredUsersPopup({
	            userList: response.data.firedUserList,
	            isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
	            transport: babelHelpers.classPrivateFieldLooseBase(this, _transport$1)[_transport$1]
	          }).show();
	        }
	      }).catch(() => {
	        babelHelpers.classPrivateFieldLooseBase(this, _sendButton$1)[_sendButton$1].setState(null);
	      });
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _sendButton$1)[_sendButton$1];
	}
	function _getCancelButton2() {
	  return new ui_buttons.Button({
	    id: 'invite-popup-cancel-button',
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_ACTION_CANCEL'),
	    useAirDesign: true,
	    style: ui_buttons.AirButtonStyle.OUTLINE,
	    onclick: () => babelHelpers.classPrivateFieldLooseBase(this, _getPopup$1)[_getPopup$1]().close()
	  });
	}

	let _$3 = t => t,
	  _t$3,
	  _t2$2;
	var _container$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _departmentControl$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("departmentControl");
	var _inviteEmailPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inviteEmailPopup");
	var _analytics$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("analytics");
	var _transport$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("transport");
	var _needConfirmRegistration = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("needConfirmRegistration");
	var _renderDescription = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderDescription");
	var _getInviteButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInviteButton");
	var _openEmailInputPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openEmailInputPopup");
	var _onSubmitWithLocalEmailProgram = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSubmitWithLocalEmailProgram");
	var _openLocalMailProgram = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openLocalMailProgram");
	class LocalEmailPage extends Page {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _openLocalMailProgram, {
	      value: _openLocalMailProgram2
	    });
	    Object.defineProperty(this, _onSubmitWithLocalEmailProgram, {
	      value: _onSubmitWithLocalEmailProgram2
	    });
	    Object.defineProperty(this, _openEmailInputPopup, {
	      value: _openEmailInputPopup2
	    });
	    Object.defineProperty(this, _getInviteButton, {
	      value: _getInviteButton2
	    });
	    Object.defineProperty(this, _renderDescription, {
	      value: _renderDescription2
	    });
	    Object.defineProperty(this, _container$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _departmentControl$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _inviteEmailPopup, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _analytics$2, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _transport$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _needConfirmRegistration, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$1)[_departmentControl$1] = options.departmentControl instanceof DepartmentControl__default ? options.departmentControl : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _analytics$2)[_analytics$2] = options.analytics;
	    babelHelpers.classPrivateFieldLooseBase(this, _transport$2)[_transport$2] = options.transport;
	    babelHelpers.classPrivateFieldLooseBase(this, _needConfirmRegistration)[_needConfirmRegistration] = options.needConfirmRegistration === true;
	  }
	  render() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$1)[_container$1]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _container$1)[_container$1];
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container$1)[_container$1] = main_core.Tag.render(_t$3 || (_t$3 = _$3`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__department-control">
					<div class="intranet-invitation-block__department-control-inner">${0}</div>
				</div>
				<div class="intranet-invitation-block__content">
					<span class="intranet-invitation-status__title ui-headline --sm">${0}</span>
					<ol class="intranet-invitation-list ui-text --md">
						<li class="intranet-invitation-list-item">${0}</li>
						<li class="intranet-invitation-list-item">${0}</li>
						<li class="intranet-invitation-list-item">${0}</li>
						<li class="intranet-invitation-list-item">${0}</li>
					</ol>
					${0}
					<div class="intranet-invitation-block__footer">
						${0}
					</div>
				</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$1)[_departmentControl$1].render(), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_INVITATION_TITLE'), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_MAIL_CONTENT_STEP_1'), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_MAIL_CONTENT_STEP_2'), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_MAIL_CONTENT_STEP_3'), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_MAIL_CONTENT_STEP_4'), babelHelpers.classPrivateFieldLooseBase(this, _renderDescription)[_renderDescription](), babelHelpers.classPrivateFieldLooseBase(this, _getInviteButton)[_getInviteButton]().render());
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$1)[_container$1];
	  }
	  getAnalyticTab() {
	    return Analytics.TAB_LOCAL_EMAIL;
	  }
	}
	function _renderDescription2() {
	  const description = main_core.Tag.render(_t2$2 || (_t2$2 = _$3`
			<span class="intranet-invitation-description ui-text --md">
				${0}
			</span>
		`), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_MAIL_SERVICE_MSGVER_1', {
	    '[LINK]': '<span class="ui-link ui-link-secondary ui-link-dashed ui-text --md">',
	    '[/LINK]': '</span>'
	  }));
	  const link = description.querySelector('.ui-link');
	  if (main_core.Type.isDomNode(link)) {
	    main_core.Event.bind(link, 'click', babelHelpers.classPrivateFieldLooseBase(this, _openEmailInputPopup)[_openEmailInputPopup].bind(this));
	  }
	  return description;
	}
	function _getInviteButton2() {
	  return new ui_buttons.Button({
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_TITLE_EMAIL_MSGVER_1'),
	    style: ui_buttons.AirButtonStyle.FILLED,
	    onclick: babelHelpers.classPrivateFieldLooseBase(this, _onSubmitWithLocalEmailProgram)[_onSubmitWithLocalEmailProgram].bind(this),
	    props: {
	      'data-test-id': 'invite-local-email-program-button'
	    }
	  });
	}
	function _openEmailInputPopup2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _inviteEmailPopup)[_inviteEmailPopup]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _inviteEmailPopup)[_inviteEmailPopup] = new InviteEmailPopup({
	      id: 'open-invite-popup',
	      departmentControl: babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$1)[_departmentControl$1],
	      inviteType: InviteType.EMAIL,
	      transport: babelHelpers.classPrivateFieldLooseBase(this, _transport$2)[_transport$2],
	      analytics: babelHelpers.classPrivateFieldLooseBase(this, _analytics$2)[_analytics$2]
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _analytics$2)[_analytics$2].sendOpenMassInvitePopup(InviteType.EMAIL);
	  babelHelpers.classPrivateFieldLooseBase(this, _inviteEmailPopup)[_inviteEmailPopup].show();
	}
	function _onSubmitWithLocalEmailProgram2() {
	  const departmentsId = babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$1)[_departmentControl$1].getValues();
	  babelHelpers.classPrivateFieldLooseBase(this, _transport$2)[_transport$2].send({
	    action: 'getInviteLink',
	    data: {
	      departmentsId,
	      analyticsType: 'by_local_email_program'
	    }
	  }).then(response => {
	    var _response$data;
	    const invitationUrl = (_response$data = response.data) == null ? void 0 : _response$data.invitationLink;
	    if (main_core.Type.isStringFilled(invitationUrl)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _openLocalMailProgram)[_openLocalMailProgram](invitationUrl);
	    }
	  }).catch(reject => {});
	}
	function _openLocalMailProgram2(invitationUrl) {
	  babelHelpers.classPrivateFieldLooseBase(this, _analytics$2)[_analytics$2].sendLocalEmailProgram(babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$1)[_departmentControl$1], babelHelpers.classPrivateFieldLooseBase(this, _needConfirmRegistration)[_needConfirmRegistration]);
	  const subject = `subject=${encodeURIComponent(main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_SUBJECT'))}`;
	  const body = `body=${encodeURIComponent(main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_EMAIL_BODY'))} ${invitationUrl}`;
	  window.location = `mailto:?${subject}&${body}`;
	}

	var _input$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("input");
	var _onInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onInput");
	var _onClear = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onClear");
	var _validateContactsInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("validateContactsInput");
	class ContactsInput {
	  constructor() {
	    Object.defineProperty(this, _validateContactsInput, {
	      value: _validateContactsInput2
	    });
	    Object.defineProperty(this, _onClear, {
	      value: _onClear2
	    });
	    Object.defineProperty(this, _onInput, {
	      value: _onInput2
	    });
	    Object.defineProperty(this, _input$1, {
	      writable: true,
	      value: void 0
	    });
	  }
	  getInput() {
	    var _babelHelpers$classPr, _babelHelpers$classPr2;
	    (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _input$1))[_input$1]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_input$1] = new ui_system_input.Input({
	      placeholder: this.getPlaceholder(),
	      design: ui_system_input.InputDesign.Grey,
	      withClear: true,
	      onBlur: babelHelpers.classPrivateFieldLooseBase(this, _validateContactsInput)[_validateContactsInput].bind(this),
	      onInput: babelHelpers.classPrivateFieldLooseBase(this, _onInput)[_onInput].bind(this),
	      onClear: babelHelpers.classPrivateFieldLooseBase(this, _onClear)[_onClear].bind(this),
	      dataTestId: 'invite-page-contact-input'
	    });
	    return babelHelpers.classPrivateFieldLooseBase(this, _input$1)[_input$1];
	  }
	  getValue() {
	    throw new Error('Not Implemented');
	  }
	  getPlaceholder() {
	    throw new Error('Not Implemented');
	  }
	  isValidValue(value) {
	    throw new Error('Not Implemented');
	  }
	  getValidationErrorMessage() {
	    throw new Error('Not Implemented');
	  }
	}
	function _onInput2() {
	  this.getInput().setError('');
	}
	function _onClear2() {
	  this.getInput().setError('');
	}
	function _validateContactsInput2() {
	  const value = this.getInput().getValue();
	  if (value && !this.isValidValue(value)) {
	    this.getInput().setError(this.getValidationErrorMessage());
	  } else {
	    this.getInput().setError('');
	  }
	}

	let _$4 = t => t,
	  _t$4;
	var _container$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _nameInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nameInput");
	var _lastNameInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastNameInput");
	var _contactsInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("contactsInput");
	var _id = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("id");
	class InputRow {
	  constructor(options) {
	    Object.defineProperty(this, _container$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _nameInput, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _lastNameInput, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _contactsInput, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _id, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _id)[_id] = options.id;
	    babelHelpers.classPrivateFieldLooseBase(this, _contactsInput)[_contactsInput] = options.contactsInput;
	    babelHelpers.classPrivateFieldLooseBase(this, _nameInput)[_nameInput] = options.nameInput;
	    babelHelpers.classPrivateFieldLooseBase(this, _lastNameInput)[_lastNameInput] = options.lastNameInput;
	  }
	  render() {
	    var _babelHelpers$classPr, _babelHelpers$classPr2;
	    (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _container$2))[_container$2]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_container$2] = main_core.Tag.render(_t$4 || (_t$4 = _$4`
			<div data-test-id="invite-input-row${0}" class="intranet-invite-form-row">
				${0}
				${0}
				${0}
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _id)[_id], babelHelpers.classPrivateFieldLooseBase(this, _contactsInput)[_contactsInput].getInput().render(), babelHelpers.classPrivateFieldLooseBase(this, _nameInput)[_nameInput].render(), babelHelpers.classPrivateFieldLooseBase(this, _lastNameInput)[_lastNameInput].render());
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$2)[_container$2];
	  }
	  renderTo(target) {
	    main_core.Dom.append(this.render(), target);
	  }
	  isEmpty() {
	    return !(babelHelpers.classPrivateFieldLooseBase(this, _contactsInput)[_contactsInput].getInput().getValue() || babelHelpers.classPrivateFieldLooseBase(this, _nameInput)[_nameInput].getValue() || babelHelpers.classPrivateFieldLooseBase(this, _lastNameInput)[_lastNameInput].getValue());
	  }
	  isInvitationRowEmpty() {
	    return !main_core.Type.isStringFilled(this.getContactsValue());
	  }
	  getValue() {
	    return {
	      NAME: babelHelpers.classPrivateFieldLooseBase(this, _nameInput)[_nameInput].getValue(),
	      LAST_NAME: babelHelpers.classPrivateFieldLooseBase(this, _lastNameInput)[_lastNameInput].getValue(),
	      ...babelHelpers.classPrivateFieldLooseBase(this, _contactsInput)[_contactsInput].getValue()
	    };
	  }
	  getContactsValue() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _contactsInput)[_contactsInput].getInput().getValue();
	  }
	  setContactsError(error) {
	    babelHelpers.classPrivateFieldLooseBase(this, _contactsInput)[_contactsInput].getInput().setError(error);
	  }
	  hasContactsError() {
	    return main_core.Type.isStringFilled(babelHelpers.classPrivateFieldLooseBase(this, _contactsInput)[_contactsInput].getInput().getError());
	  }
	  clear() {
	    babelHelpers.classPrivateFieldLooseBase(this, _contactsInput)[_contactsInput].getInput().setValue('');
	    babelHelpers.classPrivateFieldLooseBase(this, _nameInput)[_nameInput].setValue('');
	    babelHelpers.classPrivateFieldLooseBase(this, _lastNameInput)[_lastNameInput].setValue('');
	  }
	}

	class EmailInput extends ContactsInput {
	  getValue() {
	    return {
	      EMAIL: this.getInput().getValue()
	    };
	  }
	  isValidValue(value) {
	    return main_core.Validation.isEmail(value) && /^[^@]+@[^@]+\.[^@]+$/.test(value);
	  }
	  getPlaceholder() {
	    return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_INPUT');
	  }
	  getValidationErrorMessage() {
	    return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL');
	  }
	}

	const PHONE_REGEX = /^[\d+][\d ()-]{4,22}\d$/;
	class PhoneValidator {
	  static isValid(phone) {
	    return PHONE_REGEX.test(phone);
	  }
	}

	class PhoneInput extends ContactsInput {
	  getValue() {
	    return {
	      PHONE: this.getInput().getValue()
	    };
	  }
	  isValidValue(value) {
	    return PhoneValidator.isValid(value);
	  }
	  getPlaceholder() {
	    return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_TITLE_PHONE');
	  }
	  getValidationErrorMessage() {
	    return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_PHONE');
	  }
	}

	class EmailOrPhoneInput extends ContactsInput {
	  getValue() {
	    const rawValue = this.getInput().getValue();
	    return PhoneValidator.isValid(rawValue) ? {
	      PHONE: rawValue
	    } : {
	      EMAIL: rawValue
	    };
	  }
	  isValidValue(value) {
	    return PhoneValidator.isValid(value) || main_core.Validation.isEmail(value) && /^[^@]+@[^@]+\.[^@]+$/.test(value);
	  }
	  getPlaceholder() {
	    return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_OR_PHONE_INPUT');
	  }
	  getValidationErrorMessage() {
	    return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL_AND_PHONE');
	  }
	}

	var _inviteType$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inviteType");
	var _createContactsInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createContactsInput");
	var _createNameInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createNameInput");
	var _createLastNameInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("createLastNameInput");
	class InputRowFactory {
	  constructor(params) {
	    var _params$inviteType;
	    Object.defineProperty(this, _createLastNameInput, {
	      value: _createLastNameInput2
	    });
	    Object.defineProperty(this, _createNameInput, {
	      value: _createNameInput2
	    });
	    Object.defineProperty(this, _createContactsInput, {
	      value: _createContactsInput2
	    });
	    Object.defineProperty(this, _inviteType$1, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _inviteType$1)[_inviteType$1] = (_params$inviteType = params.inviteType) != null ? _params$inviteType : InviteType.ALL;
	  }
	  createInputsRow(id) {
	    return new InputRow({
	      id,
	      contactsInput: babelHelpers.classPrivateFieldLooseBase(this, _createContactsInput)[_createContactsInput](),
	      nameInput: babelHelpers.classPrivateFieldLooseBase(this, _createNameInput)[_createNameInput](),
	      lastNameInput: babelHelpers.classPrivateFieldLooseBase(this, _createLastNameInput)[_createLastNameInput]()
	    });
	  }
	}
	function _createContactsInput2() {
	  switch (babelHelpers.classPrivateFieldLooseBase(this, _inviteType$1)[_inviteType$1]) {
	    case InviteType.EMAIL:
	      return new EmailInput();
	    case InviteType.PHONE:
	      return new PhoneInput();
	    case InviteType.All:
	    default:
	      return new EmailOrPhoneInput();
	  }
	}
	function _createNameInput2() {
	  return new ui_system_input.Input({
	    placeholder: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_PLACEHOLDER'),
	    design: ui_system_input.InputDesign.Grey,
	    withClear: true,
	    dataTestId: 'invite-page-name-input'
	  });
	}
	function _createLastNameInput2() {
	  return new ui_system_input.Input({
	    placeholder: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_PLACEHOLDER'),
	    design: ui_system_input.InputDesign.Grey,
	    withClear: true,
	    dataTestId: 'invite-page-last-name-input'
	  });
	}

	let _$5 = t => t,
	  _t$5,
	  _t2$3;
	var _container$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _inputsFactory = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inputsFactory");
	var _inputsRows = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inputsRows");
	var _transport$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("transport");
	var _departmentControl$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("departmentControl");
	var _getInviteButton$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInviteButton");
	var _getAddButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAddButton");
	var _getEnteredInvitations = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEnteredInvitations");
	class ExtranetPage extends Page {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _getEnteredInvitations, {
	      value: _getEnteredInvitations2
	    });
	    Object.defineProperty(this, _getAddButton, {
	      value: _getAddButton2
	    });
	    Object.defineProperty(this, _getInviteButton$1, {
	      value: _getInviteButton2$1
	    });
	    Object.defineProperty(this, _container$3, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _inputsFactory, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _inputsRows, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _transport$3, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _departmentControl$2, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _inputsRows)[_inputsRows] = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _transport$3)[_transport$3] = options.transport;
	    babelHelpers.classPrivateFieldLooseBase(this, _inputsFactory)[_inputsFactory] = options.inputsFactory instanceof InputRowFactory ? options.inputsFactory : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$2)[_departmentControl$2] = options.departmentControl instanceof DepartmentControl__default ? options.departmentControl : null;
	  }
	  render() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$3)[_container$3]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _container$3)[_container$3];
	    }
	    const rowsContainer = main_core.Tag.render(_t$5 || (_t$5 = _$5`
			<div class="intranet-invite-form-rows-container"></div>
		`));
	    for (let i = 0; i < 2; i++) {
	      const inputsRow = babelHelpers.classPrivateFieldLooseBase(this, _inputsFactory)[_inputsFactory].createInputsRow(i);
	      babelHelpers.classPrivateFieldLooseBase(this, _inputsRows)[_inputsRows].push(inputsRow);
	      inputsRow.renderTo(rowsContainer);
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container$3)[_container$3] = main_core.Tag.render(_t2$3 || (_t2$3 = _$5`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__department-control">
					<div class="intranet-invitation-block__department-control-inner">${0}</div>
				</div>
				<div class="intranet-invitation-block__content">
					<span class="intranet-invitation-status__title ui-headline --sm">${0}</span>
					${0}
					${0}
					<div class="intranet-invitation-block__footer">
						${0}
					</div>
				</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$2)[_departmentControl$2].render(), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_SMS_INVITATION_TITLE'), rowsContainer, babelHelpers.classPrivateFieldLooseBase(this, _getAddButton)[_getAddButton](rowsContainer).render(), babelHelpers.classPrivateFieldLooseBase(this, _getInviteButton$1)[_getInviteButton$1]().render());
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$3)[_container$3];
	  }
	  getAnalyticTab() {
	    return Analytics.TAB_EXTRANET;
	  }
	}
	function _getInviteButton2$1() {
	  const inviteButton = new ui_buttons.Button({
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('BX24_INVITE_DIALOG_BUTTON_INVITE'),
	    style: ui_buttons.AirButtonStyle.FILLED,
	    props: {
	      'data-test-id': 'invite-extranet-page-submit-button'
	    },
	    onclick: () => {
	      if (inviteButton.isWaiting()) {
	        return;
	      }
	      inviteButton.setState(ui_buttons.ButtonState.WAITING);
	      babelHelpers.classPrivateFieldLooseBase(this, _transport$3)[_transport$3].send({
	        action: 'extranet',
	        data: {
	          invitations: babelHelpers.classPrivateFieldLooseBase(this, _getEnteredInvitations)[_getEnteredInvitations](),
	          tab: 'email',
	          workgroupIds: babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$2)[_departmentControl$2].getAllValues()[DepartmentControl.EntityType.EXTRANET]
	        },
	        analyticsLabel: {
	          INVITATION_TYPE: 'extranet',
	          INVITATION_COUNT: babelHelpers.classPrivateFieldLooseBase(this, _getEnteredInvitations)[_getEnteredInvitations]().length
	        }
	      }).then(response => {
	        if (response.data.invitedUserIds.length > 0) {
	          main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
	        }
	        babelHelpers.classPrivateFieldLooseBase(this, _inputsRows)[_inputsRows].forEach(inputRow => {
	          inputRow.clear();
	        });
	        inviteButton.setState(null);
	        if (response.data.firedUserList && response.data.firedUserList.length > 0) {
	          new RestoreFiredUsersPopup({
	            userList: response.data.firedUserList,
	            isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
	            transport: babelHelpers.classPrivateFieldLooseBase(this, _transport$3)[_transport$3]
	          }).show();
	        }
	      }).catch(reject => {
	        inviteButton.setState(null);
	      });
	    }
	  });
	  return inviteButton;
	}
	function _getAddButton2(rowsContainer) {
	  return new ui_buttons.Button({
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_ADD_MORE'),
	    style: ui_buttons.AirButtonStyle.PLAIN_ACCENT,
	    icon: BX.UI.IconSet.Outline.CIRCLE_PLUS,
	    props: {
	      'data-test-id': 'invite-extranet-page-add-more-button'
	    },
	    onclick: () => {
	      const inputsRow = babelHelpers.classPrivateFieldLooseBase(this, _inputsFactory)[_inputsFactory].createInputsRow();
	      babelHelpers.classPrivateFieldLooseBase(this, _inputsRows)[_inputsRows].push(inputsRow);
	      inputsRow.renderTo(rowsContainer);
	    }
	  });
	}
	function _getEnteredInvitations2() {
	  const result = [];
	  babelHelpers.classPrivateFieldLooseBase(this, _inputsRows)[_inputsRows].forEach(inputRow => {
	    if (!inputRow.isEmpty()) {
	      result.push(inputRow.getValue());
	    }
	  });
	  return result;
	}

	let _$6 = t => t,
	  _t$6;
	var _popup$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	var _onConfirm = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onConfirm");
	var _onCancel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onCancel");
	var _getPopup$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopup");
	var _getPopupContent$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopupContent");
	var _getConfirmButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getConfirmButton");
	var _getCancelButton$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCancelButton");
	var _getDescription = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDescription");
	class IntegratorInviteConfirmPopup {
	  constructor(options) {
	    Object.defineProperty(this, _getDescription, {
	      value: _getDescription2
	    });
	    Object.defineProperty(this, _getCancelButton$1, {
	      value: _getCancelButton2$1
	    });
	    Object.defineProperty(this, _getConfirmButton, {
	      value: _getConfirmButton2
	    });
	    Object.defineProperty(this, _getPopupContent$2, {
	      value: _getPopupContent2$2
	    });
	    Object.defineProperty(this, _getPopup$2, {
	      value: _getPopup2$2
	    });
	    Object.defineProperty(this, _popup$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onConfirm, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onCancel, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _onConfirm)[_onConfirm] = options.onConfirm;
	    babelHelpers.classPrivateFieldLooseBase(this, _onCancel)[_onCancel] = options.onCancel;
	  }
	  show() {
	    babelHelpers.classPrivateFieldLooseBase(this, _getPopup$2)[_getPopup$2]().show();
	  }
	}
	function _getPopup2$2() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2;
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _popup$2))[_popup$2]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_popup$2] = new main_popup.Popup({
	    id: 'integrator-confirm-invitation-popup',
	    content: babelHelpers.classPrivateFieldLooseBase(this, _getPopupContent$2)[_getPopupContent$2](),
	    closeByEsc: true,
	    closeIcon: true,
	    closeIconSize: main_popup.CloseIconSize.LARGE,
	    autoHide: true,
	    padding: 0,
	    overlay: {
	      backgroundColor: 'rgba(0, 32, 78, 0.46)'
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _popup$2)[_popup$2];
	}
	function _getPopupContent2$2() {
	  return main_core.Tag.render(_t$6 || (_t$6 = _$6`
			<div class="intranet-invitation-popup">
				<div class="intranet-invitation-popup__title">
					<span class="ui-headline --sm">${0}</span>
				</div>
				<div class="intranet-invitation-popup__body">
					<p class="intranet-invitation-description ui-text --sm">
						${0}
					</p>
				</div>
				<div class="intranet-invitation-popup__footer">
					<div class="intranet-invitation-popup__footer-button-container">
						${0}
						${0}
					</div>
				</div>
			</div>
		`), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_POPUP_TITLE'), babelHelpers.classPrivateFieldLooseBase(this, _getDescription)[_getDescription](), babelHelpers.classPrivateFieldLooseBase(this, _getConfirmButton)[_getConfirmButton]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getCancelButton$1)[_getCancelButton$1]().render());
	}
	function _getConfirmButton2() {
	  return new ui_buttons.Button({
	    id: 'integrator-confirm-invitation-popup-submit-button',
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_BUTTON_YES'),
	    useAirDesign: true,
	    style: ui_buttons.AirButtonStyle.FILLED,
	    onclick: () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _onConfirm)[_onConfirm]();
	      babelHelpers.classPrivateFieldLooseBase(this, _getPopup$2)[_getPopup$2]().close();
	    }
	  });
	}
	function _getCancelButton2$1() {
	  return new ui_buttons.Button({
	    id: 'integrator-confirm-invitation-popup-cancel-button',
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_BUTTON_NO'),
	    useAirDesign: true,
	    style: ui_buttons.AirButtonStyle.OUTLINE,
	    onclick: () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _onCancel)[_onCancel]();
	      babelHelpers.classPrivateFieldLooseBase(this, _getPopup$2)[_getPopup$2]().close();
	    }
	  });
	}
	function _getDescription2() {
	  return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_DESCRIPTION_MSGVER_1', {
	    '[LINK]': '<a href="javascript:top.BX.Helper.show(\'redirect=detail&code=20682986\')" class="ui-link ui-link-secondary ui-link-dashed ui-text --sm">',
	    '[/LINK]': '</a>'
	  });
	}

	let _$7 = t => t,
	  _t$7,
	  _t2$4;
	var _container$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _emailInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emailInput");
	var _transport$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("transport");
	var _inviteButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inviteButton");
	var _confirmPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("confirmPopup");
	var _renderDescription$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderDescription");
	var _getEmailInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEmailInput");
	var _getInviteButton$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInviteButton");
	var _getConfirmPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getConfirmPopup");
	class IntegratorPage extends Page {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _getConfirmPopup, {
	      value: _getConfirmPopup2
	    });
	    Object.defineProperty(this, _getInviteButton$2, {
	      value: _getInviteButton2$2
	    });
	    Object.defineProperty(this, _getEmailInput, {
	      value: _getEmailInput2
	    });
	    Object.defineProperty(this, _renderDescription$1, {
	      value: _renderDescription2$1
	    });
	    Object.defineProperty(this, _container$4, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _emailInput, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _transport$4, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _inviteButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _confirmPopup, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _transport$4)[_transport$4] = options.transport;
	  }
	  render() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$4)[_container$4]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _container$4)[_container$4];
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container$4)[_container$4] = main_core.Tag.render(_t$7 || (_t$7 = _$7`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__content">
					<div class="intranet-invitation-block__header">
						${0}
					</div>
					<div class="intranet-invitation-block__body">
						${0}
					</div>
					<div class="intranet-invitation-block__footer">
						${0}
					</div>
				</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _renderDescription$1)[_renderDescription$1](), babelHelpers.classPrivateFieldLooseBase(this, _getEmailInput)[_getEmailInput]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getInviteButton$2)[_getInviteButton$2]().render());
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$4)[_container$4];
	  }
	  getAnalyticTab() {
	    return Analytics.TAB_INTEGRATOR;
	  }
	}
	function _renderDescription2$1() {
	  const message = main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_CONFIRM_INTEGRATOR_POPUP_DESCRIPTION', {
	    '[LINK]': '<a href="javascript:top.BX.Helper.show(\'redirect=detail&code=7725333\')" class="ui-link ui-link-secondary ui-link-dashed ui-text --md">',
	    '[/LINK]': '</a>'
	  });
	  return main_core.Tag.render(_t2$4 || (_t2$4 = _$7`
			<p class="intranet-invitation-description ui-text --md">${0}</p>
		`), message);
	}
	function _getEmailInput2() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2;
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _emailInput))[_emailInput]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_emailInput] = new ui_system_input.Input({
	    label: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_INTEGRATOR_EMAIL_PLACEHOLDER'),
	    design: ui_system_input.InputDesign.Grey
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _emailInput)[_emailInput];
	}
	function _getInviteButton2$2() {
	  var _babelHelpers$classPr3, _babelHelpers$classPr4;
	  (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _inviteButton))[_inviteButton]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[_inviteButton] = new ui_buttons.Button({
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('BX24_INVITE_DIALOG_BUTTON_INVITE'),
	    style: ui_buttons.AirButtonStyle.FILLED,
	    props: {
	      'data-test-id': 'invite-integrator-page-submit-button'
	    },
	    onclick: () => {
	      var _babelHelpers$classPr5, _babelHelpers$classPr6;
	      if ((_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _inviteButton)[_inviteButton]) != null && _babelHelpers$classPr5.isWaiting()) {
	        return;
	      }
	      (_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _inviteButton)[_inviteButton]) == null ? void 0 : _babelHelpers$classPr6.setState(ui_buttons.ButtonState.WAITING);
	      babelHelpers.classPrivateFieldLooseBase(this, _getConfirmPopup)[_getConfirmPopup]().show();
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _inviteButton)[_inviteButton];
	}
	function _getConfirmPopup2() {
	  var _babelHelpers$classPr7, _babelHelpers$classPr8;
	  (_babelHelpers$classPr8 = (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _confirmPopup))[_confirmPopup]) != null ? _babelHelpers$classPr8 : _babelHelpers$classPr7[_confirmPopup] = new IntegratorInviteConfirmPopup({
	    onConfirm: () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _transport$4)[_transport$4].sendAction({
	        action: 'intranet.v2.Integrator.Invitation.send',
	        data: {
	          integratorEmail: babelHelpers.classPrivateFieldLooseBase(this, _getEmailInput)[_getEmailInput]().getValue()
	        },
	        analytics: {
	          INVITATION_TYPE: 'integrator'
	        }
	      }, reject => {
	        var _babelHelpers$classPr9;
	        (_babelHelpers$classPr9 = babelHelpers.classPrivateFieldLooseBase(this, _inviteButton)[_inviteButton]) == null ? void 0 : _babelHelpers$classPr9.setState(null);
	        babelHelpers.classPrivateFieldLooseBase(this, _transport$4)[_transport$4].onError(reject);
	      }).then(() => {
	        var _babelHelpers$classPr10;
	        main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
	        (_babelHelpers$classPr10 = babelHelpers.classPrivateFieldLooseBase(this, _inviteButton)[_inviteButton]) == null ? void 0 : _babelHelpers$classPr10.setState(null);
	      }).catch(reject => {
	        top.console.error(reject);
	      });
	    },
	    onCancel: () => {
	      var _babelHelpers$classPr11;
	      (_babelHelpers$classPr11 = babelHelpers.classPrivateFieldLooseBase(this, _inviteButton)[_inviteButton]) == null ? void 0 : _babelHelpers$classPr11.setState(null);
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _confirmPopup)[_confirmPopup];
	}

	let _$8 = t => t,
	  _t$8,
	  _t2$5,
	  _t3$1,
	  _t4$1,
	  _t5$1,
	  _t6$1;
	var _optionsPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("optionsPopup");
	var _linkRegisterEnabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("linkRegisterEnabled");
	var _needConfirmRegistration$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("needConfirmRegistration");
	var _isCloud = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCloud");
	var _allowRegisterWhiteList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("allowRegisterWhiteList");
	var _transport$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("transport");
	var _whitelist = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("whitelist");
	var _confirmRegistrationSwitcher = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("confirmRegistrationSwitcher");
	var _allowInviteWithLinkSwitcher = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("allowInviteWithLinkSwitcher");
	var _onDisable = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onDisable");
	var _saveButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("saveButton");
	var _analytics$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("analytics");
	var _getPopup$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopup");
	var _getPopupContent$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPopupContent");
	var _renderRegenerateSecretButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderRegenerateSecretButton");
	var _getSaveButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getSaveButton");
	var _getCancelButton$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCancelButton");
	var _getAllowInviteWithLinkSwitcher = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAllowInviteWithLinkSwitcher");
	var _getAllowRegisterWhiteList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAllowRegisterWhiteList");
	var _getConfirmRegistrationSwitcher = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getConfirmRegistrationSwitcher");
	var _resetOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("resetOptions");
	var _regenerateSecret = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("regenerateSecret");
	var _onAllowRegisterWhiteListInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onAllowRegisterWhiteListInput");
	var _addDefaultChips = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addDefaultChips");
	var _addChip = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("addChip");
	var _isValidDomain = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isValidDomain");
	class LinkOptionsPopup {
	  constructor(options) {
	    Object.defineProperty(this, _isValidDomain, {
	      value: _isValidDomain2
	    });
	    Object.defineProperty(this, _addChip, {
	      value: _addChip2
	    });
	    Object.defineProperty(this, _addDefaultChips, {
	      value: _addDefaultChips2
	    });
	    Object.defineProperty(this, _onAllowRegisterWhiteListInput, {
	      value: _onAllowRegisterWhiteListInput2
	    });
	    Object.defineProperty(this, _regenerateSecret, {
	      value: _regenerateSecret2
	    });
	    Object.defineProperty(this, _resetOptions, {
	      value: _resetOptions2
	    });
	    Object.defineProperty(this, _getConfirmRegistrationSwitcher, {
	      value: _getConfirmRegistrationSwitcher2
	    });
	    Object.defineProperty(this, _getAllowRegisterWhiteList, {
	      value: _getAllowRegisterWhiteList2
	    });
	    Object.defineProperty(this, _getAllowInviteWithLinkSwitcher, {
	      value: _getAllowInviteWithLinkSwitcher2
	    });
	    Object.defineProperty(this, _getCancelButton$2, {
	      value: _getCancelButton2$2
	    });
	    Object.defineProperty(this, _getSaveButton, {
	      value: _getSaveButton2
	    });
	    Object.defineProperty(this, _renderRegenerateSecretButton, {
	      value: _renderRegenerateSecretButton2
	    });
	    Object.defineProperty(this, _getPopupContent$3, {
	      value: _getPopupContent2$3
	    });
	    Object.defineProperty(this, _getPopup$3, {
	      value: _getPopup2$3
	    });
	    Object.defineProperty(this, _optionsPopup, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _linkRegisterEnabled, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _needConfirmRegistration$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isCloud, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _allowRegisterWhiteList, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _transport$5, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _whitelist, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _confirmRegistrationSwitcher, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _allowInviteWithLinkSwitcher, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _onDisable, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _saveButton, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _analytics$3, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _linkRegisterEnabled)[_linkRegisterEnabled] = options.linkRegisterEnabled;
	    babelHelpers.classPrivateFieldLooseBase(this, _needConfirmRegistration$1)[_needConfirmRegistration$1] = options.needConfirmRegistration;
	    babelHelpers.classPrivateFieldLooseBase(this, _isCloud)[_isCloud] = options.isCloud;
	    babelHelpers.classPrivateFieldLooseBase(this, _transport$5)[_transport$5] = options.transport;
	    babelHelpers.classPrivateFieldLooseBase(this, _whitelist)[_whitelist] = options.whiteList;
	    babelHelpers.classPrivateFieldLooseBase(this, _onDisable)[_onDisable] = options.onDisable;
	    babelHelpers.classPrivateFieldLooseBase(this, _analytics$3)[_analytics$3] = options.analytics;
	  }
	  show() {
	    babelHelpers.classPrivateFieldLooseBase(this, _getPopup$3)[_getPopup$3]().show();
	  }
	}
	function _getPopup2$3() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2;
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _optionsPopup))[_optionsPopup]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_optionsPopup] = new main_popup.Popup({
	    id: 'intranet-invitation-link-options-popup',
	    content: babelHelpers.classPrivateFieldLooseBase(this, _getPopupContent$3)[_getPopupContent$3](),
	    closeByEsc: true,
	    closeIcon: true,
	    closeIconSize: main_popup.CloseIconSize.LARGE,
	    autoHide: true,
	    padding: 0,
	    overlay: {
	      backgroundColor: 'rgba(0, 32, 78, 0.46)'
	    },
	    events: {
	      onClose: babelHelpers.classPrivateFieldLooseBase(this, _resetOptions)[_resetOptions].bind(this)
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _optionsPopup)[_optionsPopup];
	}
	function _getPopupContent2$3() {
	  const allowInviteWithLinkSwitcherContainer = main_core.Tag.render(_t$8 || (_t$8 = _$8`
			<div class="intranet-invitation-popup__switcher">
				<div class="intranet-invitation-popup__switcher-header">
					${0}
					<span class="intranet-invitation-popup__switcher-title">${0}</span>
				</div>
				<div class="intranet-invitation-popup__switcher-description">${0}</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getAllowInviteWithLinkSwitcher)[_getAllowInviteWithLinkSwitcher]().getNode(), main_core.Loc.getMessage('INTRANET_INVITE_ALLOW_INVITATION_LINK'), main_core.Loc.getMessage('INTRANET_INVITE_ALLOW_INVITATION_LINK_HINT'));
	  const confirmRegistrationSwitcherContainer = main_core.Tag.render(_t2$5 || (_t2$5 = _$8`
			<div class="intranet-invitation-popup__switcher">
				<div class="intranet-invitation-popup__switcher-header">
					${0}
					<span class="intranet-invitation-popup__switcher-title">${0}</span>
				</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getConfirmRegistrationSwitcher)[_getConfirmRegistrationSwitcher]().getNode(), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_FAST_REG_TYPE'));
	  const optionsContainer = main_core.Tag.render(_t3$1 || (_t3$1 = _$8`
			<div class="intranet-invitation-popup__body --divided">
				<div class="intranet-invitation-popup__item">
					${0}
				</div>
			</div>
		`), allowInviteWithLinkSwitcherContainer);
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isCloud)[_isCloud]) {
	    main_core.Dom.append(main_core.Tag.render(_t4$1 || (_t4$1 = _$8`
				<div class="intranet-invitation-popup__item">
					${0}
					${0}
				</div>
			`), confirmRegistrationSwitcherContainer, babelHelpers.classPrivateFieldLooseBase(this, _getAllowRegisterWhiteList)[_getAllowRegisterWhiteList]().render()), optionsContainer);
	  }
	  return main_core.Tag.render(_t5$1 || (_t5$1 = _$8`
			<div class="intranet-invitation-popup">
				<div class="intranet-invitation-popup__title">
					<span class="ui-headline --sm">${0}</span>
				</div>
				${0}
				<div class="intranet-invitation-popup__footer">
					<div class="intranet-invitation-popup__footer-button-container">
						${0}
						${0}
					</div>
					${0}
				</div>
			</div>
		`), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_OPTIONS'), optionsContainer, babelHelpers.classPrivateFieldLooseBase(this, _getSaveButton)[_getSaveButton]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getCancelButton$2)[_getCancelButton$2]().render(), babelHelpers.classPrivateFieldLooseBase(this, _renderRegenerateSecretButton)[_renderRegenerateSecretButton]());
	}
	function _renderRegenerateSecretButton2() {
	  const regenerateSecretButton = main_core.Tag.render(_t6$1 || (_t6$1 = _$8`
			<div class="intranet-invitation-popup__footer-link" id="invite-link-options-popup-regenerate-button">
				<i class="ui-icon-set --o-refresh"></i>
				<span class="ui-link ui-link-secondary ui-link-dashed">${0}</span>
			</div>
		`), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_OPTIONS_BUTTON_UPDATE'));
	  main_core.Event.bind(regenerateSecretButton, 'click', babelHelpers.classPrivateFieldLooseBase(this, _regenerateSecret)[_regenerateSecret].bind(this));
	  return regenerateSecretButton;
	}
	function _getSaveButton2() {
	  var _babelHelpers$classPr3, _babelHelpers$classPr4;
	  (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _saveButton))[_saveButton]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[_saveButton] = new ui_buttons.SaveButton({
	    id: 'invite-link-options-popup-save-button',
	    useAirDesign: true,
	    style: ui_buttons.AirButtonStyle.FILLED,
	    onclick: () => {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _saveButton)[_saveButton].isWaiting()) {
	        return;
	      }
	      const whiteListChipsToSave = babelHelpers.classPrivateFieldLooseBase(this, _getAllowRegisterWhiteList)[_getAllowRegisterWhiteList]().getChips().filter(chip => chip.getDesign() !== ui_system_chip.ChipDesign.TintedAlert);
	      const whiteList = whiteListChipsToSave.map(chip => chip.getText()).join(';');
	      babelHelpers.classPrivateFieldLooseBase(this, _saveButton)[_saveButton].setState(ui_buttons.ButtonState.WAITING);
	      babelHelpers.classPrivateFieldLooseBase(this, _transport$5)[_transport$5].send({
	        action: 'self',
	        data: {
	          allow_register: babelHelpers.classPrivateFieldLooseBase(this, _getAllowInviteWithLinkSwitcher)[_getAllowInviteWithLinkSwitcher]().isChecked() ? 'Y' : 'N',
	          allow_register_secret: main_core.Text.getRandom(8),
	          allow_register_confirm: babelHelpers.classPrivateFieldLooseBase(this, _getConfirmRegistrationSwitcher)[_getConfirmRegistrationSwitcher]().isChecked() ? 'Y' : 'N',
	          allow_register_whitelist: whiteList
	        }
	      }, () => {}).then(() => {
	        babelHelpers.classPrivateFieldLooseBase(this, _linkRegisterEnabled)[_linkRegisterEnabled] = babelHelpers.classPrivateFieldLooseBase(this, _getAllowInviteWithLinkSwitcher)[_getAllowInviteWithLinkSwitcher]().isChecked();
	        babelHelpers.classPrivateFieldLooseBase(this, _needConfirmRegistration$1)[_needConfirmRegistration$1] = babelHelpers.classPrivateFieldLooseBase(this, _getConfirmRegistrationSwitcher)[_getConfirmRegistrationSwitcher]().isChecked();
	        babelHelpers.classPrivateFieldLooseBase(this, _whitelist)[_whitelist] = whiteList;
	        babelHelpers.classPrivateFieldLooseBase(this, _addDefaultChips)[_addDefaultChips]();
	        babelHelpers.classPrivateFieldLooseBase(this, _saveButton)[_saveButton].setState(null);
	        babelHelpers.classPrivateFieldLooseBase(this, _getPopup$3)[_getPopup$3]().close();
	        if (!babelHelpers.classPrivateFieldLooseBase(this, _linkRegisterEnabled)[_linkRegisterEnabled]) {
	          babelHelpers.classPrivateFieldLooseBase(this, _getPopup$3)[_getPopup$3]().destroy();
	          babelHelpers.classPrivateFieldLooseBase(this, _onDisable)[_onDisable]();
	        }
	      }).catch(reject => {
	        console.error(reject);
	        babelHelpers.classPrivateFieldLooseBase(this, _saveButton)[_saveButton].setState(null);
	      });
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _saveButton)[_saveButton];
	}
	function _getCancelButton2$2() {
	  return new ui_buttons.CancelButton({
	    id: 'invite-link-options-popup-cancel-button',
	    useAirDesign: true,
	    style: ui_buttons.AirButtonStyle.OUTLINE,
	    onclick: () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _getPopup$3)[_getPopup$3]().close();
	    }
	  });
	}
	function _getAllowInviteWithLinkSwitcher2() {
	  var _babelHelpers$classPr5, _babelHelpers$classPr6;
	  (_babelHelpers$classPr6 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _allowInviteWithLinkSwitcher))[_allowInviteWithLinkSwitcher]) != null ? _babelHelpers$classPr6 : _babelHelpers$classPr5[_allowInviteWithLinkSwitcher] = new ui_switcher.Switcher({
	    id: 'allow-invite-with-link-switcher',
	    checked: babelHelpers.classPrivateFieldLooseBase(this, _linkRegisterEnabled)[_linkRegisterEnabled],
	    size: ui_switcher.SwitcherSize.medium,
	    useAirDesign: true,
	    handlers: {
	      // There is in error in Switcher UI, so we have inversion in event names
	      unchecked: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _getAllowRegisterWhiteList)[_getAllowRegisterWhiteList]().setDesign(babelHelpers.classPrivateFieldLooseBase(this, _getConfirmRegistrationSwitcher)[_getConfirmRegistrationSwitcher]().isChecked() ? ui_system_input.InputDesign.Grey : ui_system_input.InputDesign.Disabled);
	        babelHelpers.classPrivateFieldLooseBase(this, _getConfirmRegistrationSwitcher)[_getConfirmRegistrationSwitcher]().disable(false);
	      },
	      checked: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _getAllowRegisterWhiteList)[_getAllowRegisterWhiteList]().setDesign(ui_system_input.InputDesign.Disabled);
	        babelHelpers.classPrivateFieldLooseBase(this, _getConfirmRegistrationSwitcher)[_getConfirmRegistrationSwitcher]().disable(true);
	      }
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _allowInviteWithLinkSwitcher)[_allowInviteWithLinkSwitcher];
	}
	function _getAllowRegisterWhiteList2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _allowRegisterWhiteList)[_allowRegisterWhiteList]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _allowRegisterWhiteList)[_allowRegisterWhiteList] = new ui_system_input.Input({
	      label: main_core.Loc.getMessage('BX24_INVITE_DIALOG_REGISTER_TYPE_DOMAINS'),
	      placeholder: 'example.com',
	      design: babelHelpers.classPrivateFieldLooseBase(this, _needConfirmRegistration$1)[_needConfirmRegistration$1] && babelHelpers.classPrivateFieldLooseBase(this, _linkRegisterEnabled)[_linkRegisterEnabled] ? ui_system_input.InputDesign.Grey : ui_system_input.InputDesign.Disabled,
	      onInput: babelHelpers.classPrivateFieldLooseBase(this, _onAllowRegisterWhiteListInput)[_onAllowRegisterWhiteListInput].bind(this),
	      onChipClear: (chip, event) => {
	        babelHelpers.classPrivateFieldLooseBase(this, _allowRegisterWhiteList)[_allowRegisterWhiteList].removeChip(chip);
	      }
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _addDefaultChips)[_addDefaultChips]();
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _allowRegisterWhiteList)[_allowRegisterWhiteList];
	}
	function _getConfirmRegistrationSwitcher2() {
	  var _babelHelpers$classPr7, _babelHelpers$classPr8;
	  (_babelHelpers$classPr8 = (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _confirmRegistrationSwitcher))[_confirmRegistrationSwitcher]) != null ? _babelHelpers$classPr8 : _babelHelpers$classPr7[_confirmRegistrationSwitcher] = new ui_switcher.Switcher({
	    id: 'confirm-registration-switcher',
	    checked: babelHelpers.classPrivateFieldLooseBase(this, _needConfirmRegistration$1)[_needConfirmRegistration$1],
	    size: ui_switcher.SwitcherSize.medium,
	    useAirDesign: true,
	    disabled: !babelHelpers.classPrivateFieldLooseBase(this, _linkRegisterEnabled)[_linkRegisterEnabled],
	    handlers: {
	      // There is in error in Switcher UI, so we have inversion in event names
	      unchecked: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _getAllowRegisterWhiteList)[_getAllowRegisterWhiteList]().setDesign(ui_system_input.InputDesign.Grey);
	      },
	      checked: () => {
	        babelHelpers.classPrivateFieldLooseBase(this, _getAllowRegisterWhiteList)[_getAllowRegisterWhiteList]().setDesign(ui_system_input.InputDesign.Disabled);
	      }
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _confirmRegistrationSwitcher)[_confirmRegistrationSwitcher];
	}
	function _resetOptions2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _getConfirmRegistrationSwitcher)[_getConfirmRegistrationSwitcher]().check(babelHelpers.classPrivateFieldLooseBase(this, _needConfirmRegistration$1)[_needConfirmRegistration$1]);
	  babelHelpers.classPrivateFieldLooseBase(this, _getAllowInviteWithLinkSwitcher)[_getAllowInviteWithLinkSwitcher]().check(babelHelpers.classPrivateFieldLooseBase(this, _linkRegisterEnabled)[_linkRegisterEnabled]);
	  babelHelpers.classPrivateFieldLooseBase(this, _addDefaultChips)[_addDefaultChips]();
	}
	function _regenerateSecret2() {
	  babelHelpers.classPrivateFieldLooseBase(this, _transport$5)[_transport$5].send({
	    action: 'self',
	    data: {
	      allow_register_secret: main_core.Text.getRandom(8)
	    }
	  }).then(response => {
	    top.BX.UI.Notification.Center.notify({
	      content: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_UPDATE_SUCCESS'),
	      autoHideDelay: 2500
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _analytics$3)[_analytics$3].sendRegenerateLink();
	  }).catch(reject => {
	    top.BX.UI.Notification.Center.notify({
	      content: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_UPDATE_ERROR'),
	      autoHideDelay: 2500
	    });
	  });
	}
	function _onAllowRegisterWhiteListInput2(event) {
	  const specialSymbols = [' ', ',', ';'];
	  if (specialSymbols.includes(event.data)) {
	    const value = babelHelpers.classPrivateFieldLooseBase(this, _getAllowRegisterWhiteList)[_getAllowRegisterWhiteList]().getValue().slice(0, -1).trim();
	    if (value.length > 0) {
	      babelHelpers.classPrivateFieldLooseBase(this, _addChip)[_addChip](value);
	      babelHelpers.classPrivateFieldLooseBase(this, _getAllowRegisterWhiteList)[_getAllowRegisterWhiteList]().setValue('');
	    }
	  }
	}
	function _addDefaultChips2() {
	  var _babelHelpers$classPr9;
	  (_babelHelpers$classPr9 = babelHelpers.classPrivateFieldLooseBase(this, _allowRegisterWhiteList)[_allowRegisterWhiteList]) == null ? void 0 : _babelHelpers$classPr9.removeChips();
	  if (babelHelpers.classPrivateFieldLooseBase(this, _whitelist)[_whitelist].trim().length > 0) {
	    babelHelpers.classPrivateFieldLooseBase(this, _whitelist)[_whitelist].split(';').forEach(domain => {
	      if (domain.trim().length > 0) {
	        babelHelpers.classPrivateFieldLooseBase(this, _addChip)[_addChip](domain.trim());
	      }
	    });
	  }
	}
	function _addChip2(value) {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isValidDomain)[_isValidDomain](value)) {
	    var _babelHelpers$classPr10;
	    (_babelHelpers$classPr10 = babelHelpers.classPrivateFieldLooseBase(this, _allowRegisterWhiteList)[_allowRegisterWhiteList]) == null ? void 0 : _babelHelpers$classPr10.addChip({
	      text: value,
	      design: ui_system_chip.ChipDesign.TintedSuccess,
	      withClear: true
	    });
	  } else {
	    var _babelHelpers$classPr11;
	    (_babelHelpers$classPr11 = babelHelpers.classPrivateFieldLooseBase(this, _allowRegisterWhiteList)[_allowRegisterWhiteList]) == null ? void 0 : _babelHelpers$classPr11.addChip({
	      text: value,
	      design: ui_system_chip.ChipDesign.TintedAlert,
	      withClear: true
	    });
	  }
	}
	function _isValidDomain2(domain) {
	  if (!domain) {
	    return true;
	  }
	  const domainPattern = /^(?:[\da-z](?:[\da-z-]{0,61}[\da-z])?\.)+[a-z]{2,}$/i;
	  return domainPattern.test(domain);
	}

	let _$9 = t => t,
	  _t$9,
	  _t2$6,
	  _t3$2,
	  _t4$2;
	var _container$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _isAdmin$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isAdmin");
	var _isCloud$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isCloud");
	var _needConfirmRegistration$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("needConfirmRegistration");
	var _whiteList = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("whiteList");
	var _departmentControl$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("departmentControl");
	var _linkRegisterEnabled$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("linkRegisterEnabled");
	var _analytics$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("analytics");
	var _transport$6 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("transport");
	var _optionsPopup$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("optionsPopup");
	var _copyRegisterUrl = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copyRegisterUrl");
	var _copyToClipboard = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("copyToClipboard");
	var _renderLinkOptionButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderLinkOptionButton");
	var _getOptionsPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getOptionsPopup");
	class LinkPage extends Page {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _getOptionsPopup, {
	      value: _getOptionsPopup2
	    });
	    Object.defineProperty(this, _renderLinkOptionButton, {
	      value: _renderLinkOptionButton2
	    });
	    Object.defineProperty(this, _copyToClipboard, {
	      value: _copyToClipboard2
	    });
	    Object.defineProperty(this, _copyRegisterUrl, {
	      value: _copyRegisterUrl2
	    });
	    Object.defineProperty(this, _container$5, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isAdmin$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isCloud$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _needConfirmRegistration$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _whiteList, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _departmentControl$3, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _linkRegisterEnabled$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _analytics$4, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _transport$6, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _optionsPopup$1, {
	      writable: true,
	      value: null
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _isAdmin$1)[_isAdmin$1] = options.isAdmin === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _isCloud$1)[_isCloud$1] = options.isCloud === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _needConfirmRegistration$2)[_needConfirmRegistration$2] = options.needConfirmRegistration === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _whiteList)[_whiteList] = main_core.Type.isStringFilled(options.whiteList) ? options.whiteList : '';
	    babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$3)[_departmentControl$3] = options.departmentControl instanceof DepartmentControl__default ? options.departmentControl : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _linkRegisterEnabled$1)[_linkRegisterEnabled$1] = options.linkRegisterEnabled;
	    babelHelpers.classPrivateFieldLooseBase(this, _analytics$4)[_analytics$4] = options.analytics;
	    babelHelpers.classPrivateFieldLooseBase(this, _transport$6)[_transport$6] = options.transport;
	  }
	  render() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$5)[_container$5]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _container$5)[_container$5];
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container$5)[_container$5] = main_core.Tag.render(_t$9 || (_t$9 = _$9`
			<div class="intranet-invitation-block" data-role="self-block"></div>
		`));
	    main_core.Dom.append(main_core.Tag.render(_t2$6 || (_t2$6 = _$9`
			<div class="intranet-invitation-block__department-control">
				<div class="intranet-invitation-block__department-control-inner">${0}</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$3)[_departmentControl$3].render()), babelHelpers.classPrivateFieldLooseBase(this, _container$5)[_container$5]);
	    const copyLinkButton = new ui_buttons.Button({
	      useAirDesign: true,
	      text: main_core.Loc.getMessage('BX24_INVITE_DIALOG_COPY_LINK'),
	      icon: BX.UI.IconSet.Outline.LINK,
	      style: ui_buttons.AirButtonStyle.FILLED,
	      onclick: babelHelpers.classPrivateFieldLooseBase(this, _copyRegisterUrl)[_copyRegisterUrl].bind(this),
	      props: {
	        'data-test-id': 'invite-link-page-copy-link-button'
	      }
	    });
	    main_core.Dom.append(main_core.Tag.render(_t3$2 || (_t3$2 = _$9`
			<div class="intranet-invitation-block__content">
				<div class="intranet-invitation-block__footer">
					${0}
					${0}
				</div>
			</div>
		`), copyLinkButton.render(), babelHelpers.classPrivateFieldLooseBase(this, _renderLinkOptionButton)[_renderLinkOptionButton]()), babelHelpers.classPrivateFieldLooseBase(this, _container$5)[_container$5]);
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$5)[_container$5];
	  }
	  getAnalyticTab() {
	    return Analytics.TAB_LINK;
	  }
	}
	function _copyRegisterUrl2(copyLinkButton) {
	  if (copyLinkButton.getState() === ui_buttons.ButtonState.WAITING) {
	    return;
	  }
	  copyLinkButton.setState(ui_buttons.ButtonState.WAITING);
	  babelHelpers.classPrivateFieldLooseBase(this, _transport$6)[_transport$6].send({
	    action: 'getInviteLink',
	    data: {
	      departmentsId: babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$3)[_departmentControl$3].getValues(),
	      analyticsType: 'by_link'
	    }
	  }, reject => {
	    copyLinkButton.setState(null);
	    babelHelpers.classPrivateFieldLooseBase(this, _transport$6)[_transport$6].onError(reject);
	  }).then(response => {
	    var _response$data;
	    copyLinkButton.setState(null);
	    const invitationUrl = (_response$data = response.data) == null ? void 0 : _response$data.invitationLink;
	    if (main_core.Type.isStringFilled(invitationUrl)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _copyToClipboard)[_copyToClipboard](invitationUrl).then(() => {
	        top.BX.UI.Notification.Center.notify({
	          content: main_core.Loc.getMessage('BX24_INVITE_DIALOG_COPY_URL_MSGVER_2'),
	          autoHideDelay: 4000,
	          useAirDesign: true
	        });
	      }).catch(e => {
	        console.log(e);
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _analytics$4)[_analytics$4].sendCopyLink(babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$3)[_departmentControl$3], babelHelpers.classPrivateFieldLooseBase(this, _needConfirmRegistration$2)[_needConfirmRegistration$2]);
	    }
	  }).catch(reject => {
	    console.error(reject);
	  });
	}
	async function _copyToClipboard2(textToCopy) {
	  var _BX$clipboard;
	  if (!main_core.Type.isString(textToCopy)) {
	    return Promise.reject();
	  }

	  // navigator.clipboard defined only if window.isSecureContext === true
	  // so or https should be activated, or localhost address
	  if (window.isSecureContext && navigator.clipboard) {
	    // safari not allowed clipboard manipulation as result of ajax request
	    // so timeout is hack for this, to prevent "not have permission"
	    return new Promise((resolve, reject) => {
	      setTimeout(() => navigator.clipboard.writeText(textToCopy).then(() => resolve()).catch(e => reject(e)), 0);
	    });
	  }
	  return (_BX$clipboard = BX.clipboard) != null && _BX$clipboard.copy(textToCopy) ? Promise.resolve() : Promise.reject();
	}
	function _renderLinkOptionButton2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isAdmin$1)[_isAdmin$1]) {
	    return '';
	  }
	  const onclick = () => {
	    babelHelpers.classPrivateFieldLooseBase(this, _getOptionsPopup)[_getOptionsPopup]().show();
	  };
	  return main_core.Tag.render(_t4$2 || (_t4$2 = _$9`
			<span data-test-id="invite-link-page-option-button" onclick="${0}" class="ui-link ui-link-secondary ui-link-dashed">${0}</span>
		`), onclick, main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LINK_OPTIONS'));
	}
	function _getOptionsPopup2() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2;
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _optionsPopup$1))[_optionsPopup$1]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_optionsPopup$1] = new LinkOptionsPopup({
	    linkRegisterEnabled: babelHelpers.classPrivateFieldLooseBase(this, _linkRegisterEnabled$1)[_linkRegisterEnabled$1],
	    needConfirmRegistration: babelHelpers.classPrivateFieldLooseBase(this, _needConfirmRegistration$2)[_needConfirmRegistration$2],
	    isCloud: babelHelpers.classPrivateFieldLooseBase(this, _isCloud$1)[_isCloud$1],
	    transport: babelHelpers.classPrivateFieldLooseBase(this, _transport$6)[_transport$6],
	    whiteList: babelHelpers.classPrivateFieldLooseBase(this, _whiteList)[_whiteList],
	    analytics: babelHelpers.classPrivateFieldLooseBase(this, _analytics$4)[_analytics$4],
	    onDisable: () => {
	      main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:selfChange', {
	        selfEnabled: false
	      });
	      babelHelpers.classPrivateFieldLooseBase(this, _optionsPopup$1)[_optionsPopup$1] = null;
	    }
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _optionsPopup$1)[_optionsPopup$1];
	}

	let _$a = t => t,
	  _t$a;
	var _inputRows = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inputRows");
	var _container$6 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	class InputRowsContainer {
	  constructor(inputRows) {
	    Object.defineProperty(this, _inputRows, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _container$6, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _inputRows)[_inputRows] = inputRows;
	  }
	  render() {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _container$6)[_container$6]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _container$6)[_container$6] = main_core.Tag.render(_t$a || (_t$a = _$a`
				<div data-test-id="invite-input-rows" class="intranet-invite-form-rows-container"></div>
			`));
	      babelHelpers.classPrivateFieldLooseBase(this, _inputRows)[_inputRows].forEach(inputRow => {
	        inputRow.renderTo(babelHelpers.classPrivateFieldLooseBase(this, _container$6)[_container$6]);
	      });
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$6)[_container$6];
	  }
	  addRow(inputRow) {
	    babelHelpers.classPrivateFieldLooseBase(this, _inputRows)[_inputRows].push(inputRow);
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$6)[_container$6]) {
	      inputRow.renderTo(babelHelpers.classPrivateFieldLooseBase(this, _container$6)[_container$6]);
	    }
	  }
	  clearAll() {
	    babelHelpers.classPrivateFieldLooseBase(this, _inputRows)[_inputRows].forEach(inputRow => {
	      inputRow.clear();
	    });
	  }
	  isInvitationInputRowsEmpty() {
	    for (const inputRow of babelHelpers.classPrivateFieldLooseBase(this, _inputRows)[_inputRows]) {
	      if (!inputRow.isInvitationRowEmpty()) {
	        return false;
	      }
	    }
	    return true;
	  }
	  getEnteredInvitations() {
	    const result = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _inputRows)[_inputRows].forEach(inputRow => {
	      if (!inputRow.isEmpty()) {
	        result.push(inputRow.getValue());
	      }
	    });
	    return result;
	  }
	  hasError() {
	    for (const inputRow of babelHelpers.classPrivateFieldLooseBase(this, _inputRows)[_inputRows]) {
	      if (inputRow.hasContactsError()) {
	        return true;
	      }
	    }
	    return false;
	  }
	  highlightErrorInputs(values, error) {
	    babelHelpers.classPrivateFieldLooseBase(this, _inputRows)[_inputRows].forEach(inputRow => {
	      const value = inputRow.getContactsValue();
	      if (value && values.includes(value)) {
	        inputRow.setContactsError(error);
	      }
	    });
	  }
	}

	let _$b = t => t,
	  _t$b,
	  _t2$7,
	  _t3$3;
	var _container$7 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _inputsFactory$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inputsFactory");
	var _departmentControl$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("departmentControl");
	var _transport$7 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("transport");
	var _inviteType$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inviteType");
	var _inviteEmailPopup$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inviteEmailPopup");
	var _analytics$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("analytics");
	var _inputsRowsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("inputsRowsContainer");
	var _showMassInviteButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showMassInviteButton");
	var _getInputRowsContainer = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInputRowsContainer");
	var _renderMassInviteButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderMassInviteButton");
	var _openMassInvitePopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openMassInvitePopup");
	var _getInviteButton$3 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInviteButton");
	var _handleErrors = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("handleErrors");
	var _getAddButton$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getAddButton");
	var _getEmptyError = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEmptyError");
	class InvitePage extends Page {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _getEmptyError, {
	      value: _getEmptyError2
	    });
	    Object.defineProperty(this, _getAddButton$1, {
	      value: _getAddButton2$1
	    });
	    Object.defineProperty(this, _handleErrors, {
	      value: _handleErrors2
	    });
	    Object.defineProperty(this, _getInviteButton$3, {
	      value: _getInviteButton2$3
	    });
	    Object.defineProperty(this, _openMassInvitePopup, {
	      value: _openMassInvitePopup2
	    });
	    Object.defineProperty(this, _renderMassInviteButton, {
	      value: _renderMassInviteButton2
	    });
	    Object.defineProperty(this, _getInputRowsContainer, {
	      value: _getInputRowsContainer2
	    });
	    Object.defineProperty(this, _container$7, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _inputsFactory$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _departmentControl$4, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _transport$7, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _inviteType$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _inviteEmailPopup$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _analytics$5, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _inputsRowsContainer, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _showMassInviteButton, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _inputsFactory$1)[_inputsFactory$1] = options.inputsFactory;
	    babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$4)[_departmentControl$4] = options.departmentControl;
	    babelHelpers.classPrivateFieldLooseBase(this, _transport$7)[_transport$7] = options.transport;
	    babelHelpers.classPrivateFieldLooseBase(this, _inviteType$2)[_inviteType$2] = options.inviteType;
	    babelHelpers.classPrivateFieldLooseBase(this, _showMassInviteButton)[_showMassInviteButton] = options.showMassInviteButton;
	    babelHelpers.classPrivateFieldLooseBase(this, _analytics$5)[_analytics$5] = options.analytics;
	  }
	  render() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$7)[_container$7]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _container$7)[_container$7];
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container$7)[_container$7] = main_core.Tag.render(_t$b || (_t$b = _$b`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__department-control">
					<div class="intranet-invitation-block__department-control-inner">${0}</div>
				</div>
				<div class="intranet-invitation-block__content">
					<span class="intranet-invitation-status__title ui-headline --sm">${0}</span>
					${0}
					<span class="intranet-invitation-actions">
						${0}
						${0}
					</span>
					<div class="intranet-invitation-block__footer">
						${0}
					</div>
				</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$4)[_departmentControl$4].render(), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_SMS_INVITATION_TITLE'), babelHelpers.classPrivateFieldLooseBase(this, _getInputRowsContainer)[_getInputRowsContainer]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getAddButton$1)[_getAddButton$1]().render(), babelHelpers.classPrivateFieldLooseBase(this, _showMassInviteButton)[_showMassInviteButton] ? main_core.Tag.render(_t2$7 || (_t2$7 = _$b`
							<span class="intranet-invitation-description ui-text --sm">
								${0}
							</span>
							${0}
						`), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_OR'), babelHelpers.classPrivateFieldLooseBase(this, _renderMassInviteButton)[_renderMassInviteButton]()) : '', babelHelpers.classPrivateFieldLooseBase(this, _getInviteButton$3)[_getInviteButton$3]().render());
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$7)[_container$7];
	  }
	  getAnalyticTab() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _inviteType$2)[_inviteType$2] === InviteType.PHONE ? Analytics.TAB_PHONE : Analytics.TAB_EMAIL;
	  }
	}
	function _getInputRowsContainer2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer]) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer];
	  }
	  const inputsRows = [];
	  for (let i = 0; i < 2; i++) {
	    const inputsRow = babelHelpers.classPrivateFieldLooseBase(this, _inputsFactory$1)[_inputsFactory$1].createInputsRow(i);
	    inputsRows.push(inputsRow);
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer] = new InputRowsContainer(inputsRows);
	  return babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer];
	}
	function _renderMassInviteButton2() {
	  const button = main_core.Tag.render(_t3$3 || (_t3$3 = _$b`
			<span data-test-id="invite-invite-page-open-invite-popup-button" class="ui-link ui-link-secondary ui-link-dashed ui-text --sm">
				${0}
			</span>
		`), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_ADD_MASSIVE'));
	  main_core.Event.bind(button, 'click', babelHelpers.classPrivateFieldLooseBase(this, _openMassInvitePopup)[_openMassInvitePopup].bind(this));
	  return button;
	}
	function _openMassInvitePopup2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _inviteEmailPopup$1)[_inviteEmailPopup$1]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _inviteEmailPopup$1)[_inviteEmailPopup$1] = new InviteEmailPopup({
	      departmentControl: babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$4)[_departmentControl$4],
	      inviteType: babelHelpers.classPrivateFieldLooseBase(this, _inviteType$2)[_inviteType$2],
	      analytics: babelHelpers.classPrivateFieldLooseBase(this, _analytics$5)[_analytics$5],
	      transport: babelHelpers.classPrivateFieldLooseBase(this, _transport$7)[_transport$7]
	    });
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _analytics$5)[_analytics$5].sendOpenMassInvitePopup(babelHelpers.classPrivateFieldLooseBase(this, _inviteType$2)[_inviteType$2]);
	  babelHelpers.classPrivateFieldLooseBase(this, _inviteEmailPopup$1)[_inviteEmailPopup$1].show();
	}
	function _getInviteButton2$3() {
	  const inviteButton = new ui_buttons.Button({
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('BX24_INVITE_DIALOG_BUTTON_INVITE'),
	    style: ui_buttons.AirButtonStyle.FILLED,
	    props: {
	      'data-test-id': 'invite-invite-page-submit-button'
	    },
	    onclick: () => {
	      if (inviteButton.isWaiting() || babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer].hasError()) {
	        return;
	      }
	      if (babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer].isInvitationInputRowsEmpty()) {
	        main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:onError', {
	          error: babelHelpers.classPrivateFieldLooseBase(this, _getEmptyError)[_getEmptyError]()
	        });
	        return;
	      }
	      main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:clearError');
	      inviteButton.setState(ui_buttons.ButtonState.WAITING);
	      babelHelpers.classPrivateFieldLooseBase(this, _transport$7)[_transport$7].send({
	        action: 'inviteWithGroupDp',
	        data: {
	          invitations: babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer].getEnteredInvitations(),
	          departmentIds: babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$4)[_departmentControl$4].getValues(),
	          workgroupIds: babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$4)[_departmentControl$4].getGroupValues(),
	          tab: 'email'
	        }
	      }, reject => {
	        inviteButton.setState(null);
	        let handled = false;
	        if (reject.errors) {
	          handled = babelHelpers.classPrivateFieldLooseBase(this, _handleErrors)[_handleErrors](reject.errors);
	        }
	        if (!handled) {
	          babelHelpers.classPrivateFieldLooseBase(this, _transport$7)[_transport$7].onError(reject);
	        }
	      }, babelHelpers.classPrivateFieldLooseBase(this, _analytics$5)[_analytics$5].getDataForAction('default')).then(response => {
	        var _response$data, _response$data2;
	        if (response.data.invitedUserIds.length > 0) {
	          main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
	        }
	        babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer].clearAll();
	        inviteButton.setState(null);
	        if ((_response$data = response.data) != null && _response$data.firedUserList && ((_response$data2 = response.data) == null ? void 0 : _response$data2.firedUserList.length) > 0) {
	          new RestoreFiredUsersPopup({
	            userList: response.data.firedUserList,
	            isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
	            transport: babelHelpers.classPrivateFieldLooseBase(this, _transport$7)[_transport$7]
	          }).show();
	        }
	      }).catch(reject => {
	        console.error(reject);
	      });
	    }
	  });
	  return inviteButton;
	}
	function _handleErrors2(errors) {
	  let handled = false;
	  errors.forEach(error => {
	    if (error.code === 'EMAIL_EXIST_ERROR') {
	      babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer].highlightErrorInputs(error.customData.emailList, main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_INPUT_EMAIL_EXIST_ERROR'));
	      handled = true;
	    }
	    if (error.code === 'PHONE_EXIST_ERROR') {
	      babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer].highlightErrorInputs(error.customData.phoneList, main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_INPUT_PHONE_EXIST_ERROR'));
	      handled = true;
	    }
	    if (error.code === 'EMAIL_INVALID_ERROR') {
	      babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer].highlightErrorInputs(error.customData.emailList, main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_EMAIL'));
	      handled = true;
	    }
	    if (error.code === 'PHONE_INVALID_ERROR') {
	      babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer].highlightErrorInputs(error.customData.phoneList, main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_VALIDATE_ERROR_PHONE'));
	      handled = true;
	    }
	  });
	  return handled;
	}
	function _getAddButton2$1() {
	  return new ui_buttons.Button({
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_ADD_MORE'),
	    style: ui_buttons.AirButtonStyle.PLAIN_ACCENT,
	    icon: BX.UI.IconSet.Outline.CIRCLE_PLUS,
	    props: {
	      'data-test-id': 'invite-invite-page-add-more-button'
	    },
	    onclick: () => {
	      const inputsRow = babelHelpers.classPrivateFieldLooseBase(this, _inputsFactory$1)[_inputsFactory$1].createInputsRow();
	      babelHelpers.classPrivateFieldLooseBase(this, _inputsRowsContainer)[_inputsRowsContainer].addRow(inputsRow);
	    }
	  });
	}
	function _getEmptyError2() {
	  switch (babelHelpers.classPrivateFieldLooseBase(this, _inviteType$2)[_inviteType$2]) {
	    case InviteType.EMAIL:
	      return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMPTY_ERROR_EMAIL');
	    case InviteType.PHONE:
	      return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMPTY_ERROR_PHONE');
	    case InviteType.ALL:
	    default:
	      return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMPTY_ERROR_EMAIL_AND_PHONE');
	  }
	}

	var _input$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("input");
	var _invitationType = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("invitationType");
	var _isPhoneEnabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isPhoneEnabled");
	var _isEmailEnabled = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isEmailEnabled");
	var _getDialogInputMessage = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDialogInputMessage");
	class MassInvitationField {
	  constructor(options) {
	    Object.defineProperty(this, _getDialogInputMessage, {
	      value: _getDialogInputMessage2
	    });
	    Object.defineProperty(this, _input$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _invitationType, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isPhoneEnabled, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isEmailEnabled, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _invitationType)[_invitationType] = options.useOnlyPhone ? intranet_invitationInput.InvitationInputType.PHONE : options.smsAvailable ? intranet_invitationInput.InvitationInputType.ALL : intranet_invitationInput.InvitationInputType.EMAIL;
	    babelHelpers.classPrivateFieldLooseBase(this, _isPhoneEnabled)[_isPhoneEnabled] = [intranet_invitationInput.InvitationInputType.ALL, intranet_invitationInput.InvitationInputType.PHONE].includes(babelHelpers.classPrivateFieldLooseBase(this, _invitationType)[_invitationType]);
	    babelHelpers.classPrivateFieldLooseBase(this, _isEmailEnabled)[_isEmailEnabled] = [intranet_invitationInput.InvitationInputType.ALL, intranet_invitationInput.InvitationInputType.EMAIL].includes(babelHelpers.classPrivateFieldLooseBase(this, _invitationType)[_invitationType]);
	    babelHelpers.classPrivateFieldLooseBase(this, _input$2)[_input$2] = new intranet_invitationInput.InvitationInput({
	      inputType: babelHelpers.classPrivateFieldLooseBase(this, _invitationType)[_invitationType]
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _input$2)[_input$2].getTagSelector().setPlaceholder(main_core.Type.isStringFilled(options.placeholder) ? options.placeholder : babelHelpers.classPrivateFieldLooseBase(this, _getDialogInputMessage)[_getDialogInputMessage]());
	    BX.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _input$2)[_input$2].getTagSelector().getContainer(), 'height', '103px');
	    BX.Dom.style(babelHelpers.classPrivateFieldLooseBase(this, _input$2)[_input$2].getTagSelector().getContainer(), 'cursor', 'text');
	    main_core.Event.bind(babelHelpers.classPrivateFieldLooseBase(this, _input$2)[_input$2].getTagSelector().getContainer(), 'click', () => {
	      babelHelpers.classPrivateFieldLooseBase(this, _input$2)[_input$2].getTagSelector().focusTextBox();
	    });
	  }
	  reset() {
	    babelHelpers.classPrivateFieldLooseBase(this, _input$2)[_input$2].getTagSelector().removeTags();
	  }
	  renderTo(node) {
	    babelHelpers.classPrivateFieldLooseBase(this, _input$2)[_input$2].renderTo(node);
	  }
	  render() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input$2)[_input$2].render();
	  }
	  invite(departmentIds) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _input$2)[_input$2].inviteToDepartment(departmentIds);
	  }
	}
	function _getDialogInputMessage2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isPhoneEnabled)[_isPhoneEnabled] && babelHelpers.classPrivateFieldLooseBase(this, _isEmailEnabled)[_isEmailEnabled]) {
	    return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_OR_PHONE_INPUT');
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _isPhoneEnabled)[_isPhoneEnabled]) {
	    return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_PHONE_INPUT');
	  }
	  return main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_INPUT');
	}

	let _$c = t => t,
	  _t$c;
	var _container$8 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _massInvitationField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("massInvitationField");
	var _departmentControl$5 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("departmentControl");
	var _getInviteButton$4 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getInviteButton");
	class MassPage extends Page {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _getInviteButton$4, {
	      value: _getInviteButton2$4
	    });
	    Object.defineProperty(this, _container$8, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _massInvitationField, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _departmentControl$5, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _massInvitationField)[_massInvitationField] = new MassInvitationField({
	      placeholder: '',
	      smsAvailable: false
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$5)[_departmentControl$5] = options.departmentControl instanceof DepartmentControl__default ? options.departmentControl : null;
	  }
	  render() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$8)[_container$8]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _container$8)[_container$8];
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container$8)[_container$8] = main_core.Tag.render(_t$c || (_t$c = _$c`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__department-control">
					<div class="intranet-invitation-block__department-control-inner">${0}</div>
				</div>
				<div class="intranet-invitation-block__content">
					<span class="intranet-invitation-status__title ui-headline --sm">${0}</span>
					${0}
					<div class="intranet-invitation-block__footer">
						${0}
					</div>
				</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$5)[_departmentControl$5].render(), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_EMAIL_INVITATION_TITLE'), babelHelpers.classPrivateFieldLooseBase(this, _massInvitationField)[_massInvitationField].render(), babelHelpers.classPrivateFieldLooseBase(this, _getInviteButton$4)[_getInviteButton$4]().render());
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$8)[_container$8];
	  }
	  getAnalyticTab() {
	    return Analytics.TAB_MASS;
	  }
	}
	function _getInviteButton2$4() {
	  const inviteButton = new ui_buttons.Button({
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_TITLE_EMAIL_MSGVER_1'),
	    style: ui_buttons.AirButtonStyle.FILLED,
	    onclick: () => {
	      if (inviteButton.getState() === ui_buttons.ButtonState.WAITING) {
	        return;
	      }
	      inviteButton.setState(ui_buttons.ButtonState.WAITING);
	      babelHelpers.classPrivateFieldLooseBase(this, _massInvitationField)[_massInvitationField].invite(babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$5)[_departmentControl$5].getValues()).then(() => {
	        inviteButton.setState(null);
	      }).catch(() => {
	        inviteButton.setState(null);
	      });
	    }
	  });
	  return inviteButton;
	}

	let _$d = t => t,
	  _t$d,
	  _t2$8,
	  _t3$4;
	var _container$9 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _departmentControl$6 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("departmentControl");
	var _emailInput$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("emailInput");
	var _nameInput$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("nameInput");
	var _lastNameInput$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("lastNameInput");
	var _positionInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("positionInput");
	var _checkboxInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("checkboxInput");
	var _transport$8 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("transport");
	var _getEmailInput$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEmailInput");
	var _getNameInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getNameInput");
	var _getLastNameInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getLastNameInput");
	var _getPositionInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPositionInput");
	var _renderCheckbox = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("renderCheckbox");
	var _getCheckboxInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getCheckboxInput");
	var _getRegisterButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getRegisterButton");
	class RegisterPage extends Page {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _getRegisterButton, {
	      value: _getRegisterButton2
	    });
	    Object.defineProperty(this, _getCheckboxInput, {
	      value: _getCheckboxInput2
	    });
	    Object.defineProperty(this, _renderCheckbox, {
	      value: _renderCheckbox2
	    });
	    Object.defineProperty(this, _getPositionInput, {
	      value: _getPositionInput2
	    });
	    Object.defineProperty(this, _getLastNameInput, {
	      value: _getLastNameInput2
	    });
	    Object.defineProperty(this, _getNameInput, {
	      value: _getNameInput2
	    });
	    Object.defineProperty(this, _getEmailInput$1, {
	      value: _getEmailInput2$1
	    });
	    Object.defineProperty(this, _container$9, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _departmentControl$6, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _emailInput$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _nameInput$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _lastNameInput$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _positionInput, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _checkboxInput, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _transport$8, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$6)[_departmentControl$6] = options.departmentControl instanceof DepartmentControl__default ? options.departmentControl : null;
	    babelHelpers.classPrivateFieldLooseBase(this, _transport$8)[_transport$8] = options.transport;
	  }
	  render() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$9)[_container$9]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _container$9)[_container$9];
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container$9)[_container$9] = main_core.Tag.render(_t$d || (_t$d = _$d`
			<div class="intranet-invitation-block">
				<div class="intranet-invitation-block__department-control">
					<div class="intranet-invitation-block__department-control-inner">${0}</div>
				</div>
				<div class="intranet-invitation-block__content">
					<div class="intranet-invitation-block__header">
						<span class="intranet-invitation-status__title ui-headline --sm">${0}</span>
						<p class="intranet-invitation-description ui-text --md">${0}</p>
					</div>
					<div class="intranet-invitation-block__body">
						${0}
						${0}
						${0}
						${0}
					</div>
					${0}
					<div class="intranet-invitation-block__footer">
						${0}
					</div>
				</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$6)[_departmentControl$6].render(), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_TITLE'), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_DESCRIPTION'), babelHelpers.classPrivateFieldLooseBase(this, _getEmailInput$1)[_getEmailInput$1]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getNameInput)[_getNameInput]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getLastNameInput)[_getLastNameInput]().render(), babelHelpers.classPrivateFieldLooseBase(this, _getPositionInput)[_getPositionInput]().render(), babelHelpers.classPrivateFieldLooseBase(this, _renderCheckbox)[_renderCheckbox](), babelHelpers.classPrivateFieldLooseBase(this, _getRegisterButton)[_getRegisterButton]().render());
	    BX.UI.Hint.init(babelHelpers.classPrivateFieldLooseBase(this, _container$9)[_container$9]);
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$9)[_container$9];
	  }
	  getAnalyticTab() {
	    return Analytics.TAB_REGISTRATION;
	  }
	}
	function _getEmailInput2$1() {
	  var _babelHelpers$classPr, _babelHelpers$classPr2;
	  (_babelHelpers$classPr2 = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _emailInput$1))[_emailInput$1]) != null ? _babelHelpers$classPr2 : _babelHelpers$classPr[_emailInput$1] = new ui_system_input.Input({
	    label: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_LABEL'),
	    placeholder: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_INPUT_EMAIL_PLACEHOLDER'),
	    design: ui_system_input.InputDesign.Grey
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _emailInput$1)[_emailInput$1];
	}
	function _getNameInput2() {
	  var _babelHelpers$classPr3, _babelHelpers$classPr4;
	  (_babelHelpers$classPr4 = (_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _nameInput$1))[_nameInput$1]) != null ? _babelHelpers$classPr4 : _babelHelpers$classPr3[_nameInput$1] = new ui_system_input.Input({
	    label: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_TITLE'),
	    placeholder: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_NAME_PLACEHOLDER'),
	    design: ui_system_input.InputDesign.Grey
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _nameInput$1)[_nameInput$1];
	}
	function _getLastNameInput2() {
	  var _babelHelpers$classPr5, _babelHelpers$classPr6;
	  (_babelHelpers$classPr6 = (_babelHelpers$classPr5 = babelHelpers.classPrivateFieldLooseBase(this, _lastNameInput$1))[_lastNameInput$1]) != null ? _babelHelpers$classPr6 : _babelHelpers$classPr5[_lastNameInput$1] = new ui_system_input.Input({
	    label: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_TITLE'),
	    placeholder: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_LAST_NAME_PLACEHOLDER'),
	    design: ui_system_input.InputDesign.Grey
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _lastNameInput$1)[_lastNameInput$1];
	}
	function _getPositionInput2() {
	  var _babelHelpers$classPr7, _babelHelpers$classPr8;
	  (_babelHelpers$classPr8 = (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _positionInput))[_positionInput]) != null ? _babelHelpers$classPr8 : _babelHelpers$classPr7[_positionInput] = new ui_system_input.Input({
	    label: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_POSITION_TITLE'),
	    placeholder: main_core.Loc.getMessage('BX24_INVITE_DIALOG_ADD_POSITION_PLACEHOLDER'),
	    design: ui_system_input.InputDesign.Grey
	  });
	  return babelHelpers.classPrivateFieldLooseBase(this, _positionInput)[_positionInput];
	}
	function _renderCheckbox2() {
	  return main_core.Tag.render(_t2$8 || (_t2$8 = _$d`
			<div class="intranet-invitation-checkbox__container">
				${0}
				<label class="intranet-invitation-checkbox__label ui-text --sm" for="ADD_SEND_PASSWORD">
					${0}
				</label>
				<div class="invite-invitation-helper"
					 data-hint="${0}"
					 data-hint-no-icon
				>
				</div>
			</div>
		`), babelHelpers.classPrivateFieldLooseBase(this, _getCheckboxInput)[_getCheckboxInput](), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_CHECKBOX_LABEL'), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_REGISTER_CHECKBOX_HINT'));
	}
	function _getCheckboxInput2() {
	  var _babelHelpers$classPr9, _babelHelpers$classPr10;
	  (_babelHelpers$classPr10 = (_babelHelpers$classPr9 = babelHelpers.classPrivateFieldLooseBase(this, _checkboxInput))[_checkboxInput]) != null ? _babelHelpers$classPr10 : _babelHelpers$classPr9[_checkboxInput] = main_core.Tag.render(_t3$4 || (_t3$4 = _$d`
			<input
				type="checkbox"
				name="ADD_SEND_PASSWORD"
				data-test-id="invite-register-checkbox"
				class="intranet-invitation-checkbox"
			>
		`));
	  return babelHelpers.classPrivateFieldLooseBase(this, _checkboxInput)[_checkboxInput];
	}
	function _getRegisterButton2() {
	  const registerButton = new ui_buttons.Button({
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('BX24_INVITE_DIALOG_TAB_ADD_TITLE_NEW'),
	    style: ui_buttons.AirButtonStyle.FILLED,
	    props: {
	      'data-test-id': 'invite-register-submit-button'
	    },
	    onclick: () => {
	      if (registerButton.isWaiting()) {
	        return;
	      }
	      registerButton.setState(ui_buttons.ButtonState.WAITING);
	      babelHelpers.classPrivateFieldLooseBase(this, _transport$8)[_transport$8].send({
	        action: 'add',
	        data: {
	          ADD_EMAIL: babelHelpers.classPrivateFieldLooseBase(this, _getEmailInput$1)[_getEmailInput$1]().getValue(),
	          ADD_NAME: babelHelpers.classPrivateFieldLooseBase(this, _getNameInput)[_getNameInput]().getValue(),
	          ADD_LAST_NAME: babelHelpers.classPrivateFieldLooseBase(this, _getLastNameInput)[_getLastNameInput]().getValue(),
	          ADD_POSITION: babelHelpers.classPrivateFieldLooseBase(this, _getPositionInput)[_getPositionInput]().getValue(),
	          ADD_SEND_PASSWORD: babelHelpers.classPrivateFieldLooseBase(this, _getCheckboxInput)[_getCheckboxInput]().checked ? 'Y' : 'N',
	          SONET_GROUPS_CODE: babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$6)[_departmentControl$6].getGroupValues(),
	          departmentIds: babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$6)[_departmentControl$6].getValues()
	        }
	      }, reject => {
	        registerButton.setState(null);
	        babelHelpers.classPrivateFieldLooseBase(this, _transport$8)[_transport$8].onError(reject);
	      }).then(response => {
	        registerButton.setState(null);
	        babelHelpers.classPrivateFieldLooseBase(this, _departmentControl$6)[_departmentControl$6].reset();
	        babelHelpers.classPrivateFieldLooseBase(this, _getEmailInput$1)[_getEmailInput$1]().setValue('');
	        babelHelpers.classPrivateFieldLooseBase(this, _getNameInput)[_getNameInput]().setValue('');
	        babelHelpers.classPrivateFieldLooseBase(this, _getLastNameInput)[_getLastNameInput]().setValue('');
	        babelHelpers.classPrivateFieldLooseBase(this, _getPositionInput)[_getPositionInput]().setValue('');
	        if (response.data.firedUserList) {
	          new RestoreFiredUsersPopup({
	            userList: response.data.firedUserList,
	            isRestoreUsersAccessAvailable: response.data.isRestoreUsersAccessAvailable,
	            transport: babelHelpers.classPrivateFieldLooseBase(this, _transport$8)[_transport$8]
	          }).show();
	        } else {
	          main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:showSuccessPopup');
	        }
	      }).catch(reject => {
	        console.error(reject);
	      });
	    }
	  });
	  return registerButton;
	}

	let _$e = t => t,
	  _t$e,
	  _t2$9,
	  _t3$5,
	  _t4$3;
	var _container$a = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _isAdmin$2 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isAdmin");
	var _transport$9 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("transport");
	var _getEnableButton = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getEnableButton");
	class LinkDisabledPage extends Page {
	  constructor(options) {
	    super();
	    Object.defineProperty(this, _getEnableButton, {
	      value: _getEnableButton2
	    });
	    Object.defineProperty(this, _container$a, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _isAdmin$2, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _transport$9, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _isAdmin$2)[_isAdmin$2] = options.isAdmin === true;
	    babelHelpers.classPrivateFieldLooseBase(this, _transport$9)[_transport$9] = options.transport;
	  }
	  render() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _container$a)[_container$a]) {
	      return babelHelpers.classPrivateFieldLooseBase(this, _container$a)[_container$a];
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _container$a)[_container$a] = main_core.Tag.render(_t$e || (_t$e = _$e`
			<div class="intranet-invitation-block" data-role="self-block"></div>
		`));
	    const statusBlock = main_core.Tag.render(_t2$9 || (_t2$9 = _$e`
			<div class="intranet-invitation-status --invite-link-disabled">
				<div class="intranet-invitation-status__content">
					<span class="intranet-invitation-status__title ui-headline --md">${0}</span>
					<p class="intranet-invitation-status__description ui-text --lg">
						${0}
					</p>
				</div>
			</div>
		`), main_core.Loc.getMessage('INTRANET_INVITE_ALERT_INVITATION_LINK_DISABLED'), main_core.Loc.getMessage(babelHelpers.classPrivateFieldLooseBase(this, _isAdmin$2)[_isAdmin$2] ? 'INTRANET_INVITE_DIALOG_STATUS_INVITATION_LINK_DISABLE_DESCRIPTION' : 'INTRANET_INVITE_DIALOG_STATUS_INVITATION_LINK_DISABLE_DESCRIPTION_NOT_ADMIN'));
	    if (babelHelpers.classPrivateFieldLooseBase(this, _isAdmin$2)[_isAdmin$2]) {
	      main_core.Dom.append(main_core.Tag.render(_t3$5 || (_t3$5 = _$e`
				<div class="intranet-invitation-status__footer">${0}</div>
			`), babelHelpers.classPrivateFieldLooseBase(this, _getEnableButton)[_getEnableButton]().render()), statusBlock);
	    }
	    main_core.Dom.append(main_core.Tag.render(_t4$3 || (_t4$3 = _$e`
			<div class="intranet-invitation-block__content">
				${0}
			</div>
		`), statusBlock), babelHelpers.classPrivateFieldLooseBase(this, _container$a)[_container$a]);
	    return babelHelpers.classPrivateFieldLooseBase(this, _container$a)[_container$a];
	  }
	  getAnalyticTab() {
	    return Analytics.TAB_LINK;
	  }
	}
	function _getEnableButton2() {
	  const enableButton = new ui_buttons.Button({
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_ENABLE_BUTTON'),
	    style: ui_buttons.AirButtonStyle.FILLED,
	    props: {
	      'data-test-id': 'invite-link-page-enable-button'
	    },
	    onclick: () => {
	      if (enableButton.isWaiting()) {
	        return;
	      }
	      enableButton.setState(ui_buttons.ButtonState.WAITING);
	      babelHelpers.classPrivateFieldLooseBase(this, _transport$9)[_transport$9].send({
	        action: 'self',
	        data: {
	          allow_register: 'Y'
	        }
	      }).then(() => {
	        enableButton.setState(null);
	        main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:selfChange', {
	          selfEnabled: true
	        });
	      }).catch(() => {
	        enableButton.setState(null);
	      });
	    }
	  });
	  return enableButton;
	}

	var _options = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _userOptions = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("userOptions");
	var _getProjectId = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getProjectId");
	class PageFactory {
	  constructor(options, userOptions) {
	    Object.defineProperty(this, _getProjectId, {
	      value: _getProjectId2
	    });
	    Object.defineProperty(this, _options, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _userOptions, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _options)[_options] = options;
	    babelHelpers.classPrivateFieldLooseBase(this, _userOptions)[_userOptions] = userOptions;
	  }
	  createLocalEmailPage() {
	    return new LocalEmailPage({
	      ...babelHelpers.classPrivateFieldLooseBase(this, _options)[_options],
	      departmentControl: this.createDepartmentControl(main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION'), [DepartmentControl.EntityType.DEPARTMENT])
	    });
	  }
	  createInvitePage(inviteType, showMassInviteButton = true) {
	    return new InvitePage({
	      ...babelHelpers.classPrivateFieldLooseBase(this, _options)[_options],
	      inviteType,
	      departmentControl: this.createDepartmentControl(main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION_WITH_GROUP'), [DepartmentControl.EntityType.DEPARTMENT, DepartmentControl.EntityType.GROUP, DepartmentControl.EntityType.EXTRANET]),
	      inputsFactory: this.createInputRowFactory(inviteType),
	      showMassInviteButton
	    });
	  }
	  createExtranetPage() {
	    return new ExtranetPage({
	      ...babelHelpers.classPrivateFieldLooseBase(this, _options)[_options],
	      inputsFactory: this.createInputRowFactory(InviteType.ALL),
	      departmentControl: this.createDepartmentControl(main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION_EXTRANET'), [DepartmentControl.EntityType.EXTRANET])
	    });
	  }
	  createRegisterPage() {
	    return new RegisterPage({
	      ...babelHelpers.classPrivateFieldLooseBase(this, _options)[_options],
	      departmentControl: this.createDepartmentControl(main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION_WITH_GROUP'), [DepartmentControl.EntityType.DEPARTMENT, DepartmentControl.EntityType.GROUP, DepartmentControl.EntityType.EXTRANET]),
	      inputsFactory: this.createInputRowFactory()
	    });
	  }
	  createIntegratorPage() {
	    return new IntegratorPage({
	      transport: babelHelpers.classPrivateFieldLooseBase(this, _options)[_options].transport
	    });
	  }
	  createLinkPage() {
	    return new LinkPage({
	      ...babelHelpers.classPrivateFieldLooseBase(this, _options)[_options],
	      departmentControl: this.createDepartmentControl(main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION'), [DepartmentControl.EntityType.DEPARTMENT])
	    });
	  }
	  createLinkDisabledPage() {
	    return new LinkDisabledPage({
	      ...babelHelpers.classPrivateFieldLooseBase(this, _options)[_options]
	    });
	  }
	  createMassPage() {
	    return new MassPage({
	      departmentControl: this.createDepartmentControl(main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_DESCRIPTION'), [DepartmentControl.EntityType.DEPARTMENT])
	    });
	  }
	  createDepartmentControl(description, entitiesType) {
	    var _babelHelpers$classPr, _babelHelpers$classPr2, _babelHelpers$classPr3, _babelHelpers$classPr4, _babelHelpers$classPr5, _babelHelpers$classPr6;
	    const departmentsId = main_core.Type.isArray((_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _userOptions)[_userOptions]) == null ? void 0 : _babelHelpers$classPr.departmentList) ? babelHelpers.classPrivateFieldLooseBase(this, _userOptions)[_userOptions].departmentList : [];
	    let groupOptions = {};
	    const preselectedItems = [];
	    const rootDepartment = ((_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _userOptions)[_userOptions]) == null ? void 0 : (_babelHelpers$classPr3 = _babelHelpers$classPr2.rootDepartment) == null ? void 0 : _babelHelpers$classPr3.id) === ((_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _userOptions)[_userOptions]) == null ? void 0 : (_babelHelpers$classPr5 = _babelHelpers$classPr4.companyRootDepartment) == null ? void 0 : _babelHelpers$classPr5.id) ? null : (_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _userOptions)[_userOptions]) == null ? void 0 : _babelHelpers$classPr6.rootDepartment;
	    const withGroups = entitiesType.includes(DepartmentControl.EntityType.GROUP) || entitiesType.includes(DepartmentControl.EntityType.EXTRANET);
	    if (withGroups) {
	      groupOptions = {
	        createProjectLink: !(!entitiesType.includes(DepartmentControl.EntityType.GROUP) && entitiesType.includes(DepartmentControl.EntityType.EXTRANET))
	      };
	      if (this.projectLimitExceeded && this.projectLimitFeatureId) {
	        groupOptions.lockProjectLink = this.projectLimitExceeded;
	        groupOptions.lockProjectLinkFeatureId = this.projectLimitFeatureId;
	      }
	      const projectId = babelHelpers.classPrivateFieldLooseBase(this, _getProjectId)[_getProjectId]();
	      if (projectId) {
	        preselectedItems.push(['project', projectId]);
	      }
	    }
	    return new DepartmentControl__default({
	      id: 'invite-page-department-control',
	      title: '',
	      description,
	      entitiesType,
	      groupOptions,
	      preselectedItems,
	      departmentList: departmentsId,
	      dialogOptions: {
	        alwaysShowLabels: true
	      },
	      rootDepartment: main_core.Type.isObject(rootDepartment) ? rootDepartment : null,
	      addButtonCaption: withGroups ? main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_CAPTION_WITH_GROUP') : main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_DEPARTMENT_CONTROL_CAPTION')
	    });
	  }
	  createInputRowFactory(inviteType) {
	    return new InputRowFactory({
	      inviteType
	    });
	  }
	}
	function _getProjectId2() {
	  var _babelHelpers$classPr7;
	  return (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _userOptions)[_userOptions]) != null && _babelHelpers$classPr7.groupId ? parseInt(babelHelpers.classPrivateFieldLooseBase(this, _userOptions)[_userOptions].groupId, 10) : 0;
	}

	var _options$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("options");
	var _pageFactory = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pageFactory");
	var _pages$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pages");
	var _subscribeEvents$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("subscribeEvents");
	var _onSelfRegisterChange = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSelfRegisterChange");
	class PageProvider {
	  constructor(options, userOptions) {
	    Object.defineProperty(this, _onSelfRegisterChange, {
	      value: _onSelfRegisterChange2
	    });
	    Object.defineProperty(this, _subscribeEvents$1, {
	      value: _subscribeEvents2$1
	    });
	    Object.defineProperty(this, _options$1, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _pageFactory, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _pages$1, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1] = options;
	    babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory] = new PageFactory(options, userOptions);
	    babelHelpers.classPrivateFieldLooseBase(this, _subscribeEvents$1)[_subscribeEvents$1]();
	  }
	  provide() {
	    babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1] = new Map();
	    if (babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].canCurrentUserInvite) {
	      if (babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].useLocalEmailProgram) {
	        babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('invite-email', babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].isSelfRegisterEnabled ? babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createLocalEmailPage() : babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createInvitePage(InviteType.EMAIL));
	        babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('invite', babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createInvitePage(InviteType.PHONE));
	        babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('invite-with-group-dp', babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createInvitePage(InviteType.EMAIL, false));
	      } else {
	        babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('invite', babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createInvitePage(babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].smsAvailable ? InviteType.ALL : InviteType.EMAIL));
	      }
	      babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('add', babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createRegisterPage());
	      babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('self', babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].isSelfRegisterEnabled ? babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createLinkPage() : babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createLinkDisabledPage());
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].isExtranetInstalled) {
	      babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('extranet', babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createExtranetPage());
	    }
	    if (babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].isCloud && babelHelpers.classPrivateFieldLooseBase(this, _options$1)[_options$1].canCurrentUserInvite) {
	      babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('integrator', babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createIntegratorPage());
	    }
	    return babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1];
	  }
	}
	function _subscribeEvents2$1() {
	  main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:selfChange', babelHelpers.classPrivateFieldLooseBase(this, _onSelfRegisterChange)[_onSelfRegisterChange].bind(this));
	}
	function _onSelfRegisterChange2(event) {
	  var _event$data;
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1]) {
	    return;
	  }
	  if ((_event$data = event.data) != null && _event$data.selfEnabled) {
	    babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('invite-email', babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createLocalEmailPage());
	    babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('self', babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createLinkPage());
	  } else {
	    babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('invite-email', babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createInvitePage(InviteType.EMAIL));
	    babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1].set('self', babelHelpers.classPrivateFieldLooseBase(this, _pageFactory)[_pageFactory].createLinkDisabledPage());
	  }
	  main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:pageUpdate', {
	    pages: babelHelpers.classPrivateFieldLooseBase(this, _pages$1)[_pages$1]
	  });
	}

	let _$f = t => t,
	  _t$f;
	var _getNotificationContent$1 = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getNotificationContent");
	class SuccessInvitePopup {
	  constructor() {
	    Object.defineProperty(this, _getNotificationContent$1, {
	      value: _getNotificationContent2$1
	    });
	  }
	  show() {
	    const notificationOptions = {
	      id: 'invite-notification-result',
	      autoHideDelay: 4000,
	      closeButton: false,
	      autoHide: true,
	      content: babelHelpers.classPrivateFieldLooseBase(this, _getNotificationContent$1)[_getNotificationContent$1](),
	      useAirDesign: true
	    };
	    const notify = BX.UI.Notification.Center.notify(notificationOptions);
	    notify.show();
	    notify.activateAutoHide();
	  }
	}
	function _getNotificationContent2$1() {
	  return main_core.Tag.render(_t$f || (_t$f = _$f`
			<div class="invite-email-notification">
				<div class="invite-email-notification__content">
					<div class="invite-email-notification__title ui-text --sm --accent">
						${0}
					</div>
					<div class="invite-email-notification__description ui-text --2xs">
						${0}
					</div>
				</div>
				<a href="/company/?apply_filter=Y&INVITED=Y" target="_blank" class="ui-link ui-link-secondary ui-link-dashed">
					${0}
				</a>
			</div>
		`), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_TITLE'), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_DESCRIPTION_MSGVER_1'), main_core.Loc.getMessage('INTRANET_INVITE_DIALOG_LOCAL_POPUP_SUCCESS_BUTTON'));
	}

	var _initMenu = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("initMenu");
	var _showSuccessPopup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("showSuccessPopup");
	var _onSuccessRequest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onSuccessRequest");
	var _onErrorRequest = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("onErrorRequest");
	class Form extends main_core_events.EventEmitter {
	  constructor(formParams) {
	    super();
	    Object.defineProperty(this, _onErrorRequest, {
	      value: _onErrorRequest2
	    });
	    Object.defineProperty(this, _onSuccessRequest, {
	      value: _onSuccessRequest2
	    });
	    Object.defineProperty(this, _showSuccessPopup, {
	      value: _showSuccessPopup2
	    });
	    Object.defineProperty(this, _initMenu, {
	      value: _initMenu2
	    });
	    this.setEventNamespace('BX.Intranet.Invitation');
	    const params = main_core.Type.isPlainObject(formParams) ? formParams : {};
	    this.initParams(params);
	    this.initUI();
	    this.initAnalytics();
	    this.initTransport(params);
	    this.initNavigation();
	    this.subscribeEvents();
	  }
	  initParams(params) {
	    this.menuContainer = params.menuContainerNode;
	    this.subMenuContainer = params.subMenuContainerNode;
	    this.leftMenuItems = params.leftMenuItems;
	    this.titleContainer = params.titleContainer;
	    this.contentContainer = params.contentContainerNode;
	    this.pageContainer = this.contentContainer.querySelector('.popup-window-tabs-content-invite');
	    this.userOptions = params.userOptions;
	    this.isExtranetInstalled = params.isExtranetInstalled === 'Y';
	    this.isCloud = params.isCloud === 'Y';
	    this.isAdmin = params.isAdmin === 'Y';
	    this.canCurrentUserInvite = params.canCurrentUserInvite === true;
	    this.isInvitationBySmsAvailable = params.isInvitationBySmsAvailable === 'Y';
	    this.isCreatorEmailConfirmed = params.isCreatorEmailConfirmed === 'Y';
	    this.firstInvitationBlock = params.firstInvitationBlock;
	    this.isSelfRegisterEnabled = params.isSelfRegisterEnabled;
	    this.analyticsLabel = params.analyticsLabel;
	    this.projectLimitExceeded = main_core.Type.isBoolean(params.projectLimitExceeded) ? params.projectLimitExceeded : true;
	    this.projectLimitFeatureId = main_core.Type.isString(params.projectLimitFeatureId) ? params.projectLimitFeatureId : '';
	    this.whitelistValue = main_core.Type.isStringFilled(params.whitelistValue) ? params.whitelistValue : '';
	    this.isCollabEnabled = params.isCollabEnabled === 'Y';
	    this.registerNeedConfirm = params.registerConfirm === true;
	    this.useLocalEmailProgram = params.useLocalEmailProgram === true;
	  }
	  initTransport(params) {
	    this.transport = new Transport({
	      componentName: params.componentName,
	      signedParameters: params.signedParameters,
	      onSuccess: babelHelpers.classPrivateFieldLooseBase(this, _onSuccessRequest)[_onSuccessRequest].bind(this),
	      onError: babelHelpers.classPrivateFieldLooseBase(this, _onErrorRequest)[_onErrorRequest].bind(this),
	      analytics: this.analytics
	    });
	  }
	  initUI() {
	    if (main_core.Type.isDomNode(this.contentContainer)) {
	      this.messageBar = new MessageBar({
	        errorContainer: this.contentContainer.querySelector('[data-role=\'error-message\']'),
	        successContainer: this.contentContainer.querySelector('[data-role=\'success-message\']')
	      });
	      BX.UI.Hint.init(this.contentContainer);
	    }
	    if (main_core.Type.isDomNode(this.menuContainer)) {
	      babelHelpers.classPrivateFieldLooseBase(this, _initMenu)[_initMenu]();
	    }
	  }
	  initAnalytics() {
	    this.analytics = new Analytics(this.analyticsLabel, this.isAdmin);
	    this.analytics.sendOpenSliderData(this.analyticsLabel.source);
	  }
	  initNavigation() {
	    var _this$navigation, _this$navigation2;
	    this.navigation = this.createNavigation();
	    (_this$navigation = this.navigation) == null ? void 0 : _this$navigation.subscribe('onBeforeChangePage', this.onBeforeChangePage.bind(this));
	    (_this$navigation2 = this.navigation) == null ? void 0 : _this$navigation2.subscribe('onAfterChangePage', this.onAfterChangePage.bind(this));
	    this.navigation.showFirst();
	  }
	  subscribeEvents() {
	    main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:onError', event => {
	      var _event$data;
	      this.messageBar.showError(event == null ? void 0 : (_event$data = event.data) == null ? void 0 : _event$data.error);
	    });
	    main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:clearError', () => {
	      this.messageBar.hideAll();
	    });
	    main_core_events.EventEmitter.subscribe('BX.Intranet.Invitation:showSuccessPopup', babelHelpers.classPrivateFieldLooseBase(this, _showSuccessPopup)[_showSuccessPopup].bind(this));
	  }
	  onBeforeChangePage(event) {
	    var _BX, _BX$UI, _BX$UI$ToolbarManager, _ref, _this$leftMenuItems$n, _this$leftMenuItems$n2, _this$leftMenuItems$n3;
	    this.messageBar.hideAll();
	    const {
	      newPageCode
	    } = event.data;
	    (_BX = BX) == null ? void 0 : (_BX$UI = _BX.UI) == null ? void 0 : (_BX$UI$ToolbarManager = _BX$UI.ToolbarManager) == null ? void 0 : _BX$UI$ToolbarManager.getDefaultToolbar().setTitle((_ref = (_this$leftMenuItems$n = (_this$leftMenuItems$n2 = this.leftMenuItems[newPageCode]) == null ? void 0 : _this$leftMenuItems$n2.TOOLBAR_TITLE) != null ? _this$leftMenuItems$n : (_this$leftMenuItems$n3 = this.leftMenuItems[newPageCode]) == null ? void 0 : _this$leftMenuItems$n3.NAME) != null ? _ref : '');
	  }
	  onAfterChangePage(event) {
	    const section = this.getSubSection();
	    const page = event.getData().current;
	    let subSection = null;
	    if (page) {
	      subSection = page.getAnalyticTab();
	    }
	    if (this.analytics && section && subSection) {
	      this.analytics.sendTabData(section, subSection);
	    }
	  }
	  getSubSection() {
	    const regex = /analyticsLabel\[source]=(\w*)&/gm;
	    const match = regex.exec(decodeURI(window.location));
	    if ((match == null ? void 0 : match.length) > 1) {
	      return match[1];
	    }
	    return null;
	  }
	  activeMenuItem(itemType) {
	    (this.menuItems || []).forEach(item => {
	      main_core.Dom.removeClass(item.parentElement, 'ui-sidepanel-menu-active');
	      if (item.getAttribute('data-action') === itemType) {
	        main_core.Dom.addClass(item.parentElement, 'ui-sidepanel-menu-active');
	      }
	    });
	  }
	  changeContent(action) {
	    if (!main_core.Type.isStringFilled(action)) {
	      return;
	    }
	    if (action === 'active-directory') {
	      if (!this.activeDirectory) {
	        this.activeDirectory = new ActiveDirectory(this);
	      }
	      this.activeDirectory.showForm();
	      this.analytics.sendTabData(this.getSubSection(), Analytics.TAB_AD);
	      return;
	    }
	    this.navigation.show(action);
	  }
	  createNavigation() {
	    return new Navigation({
	      container: this.pageContainer,
	      first: this.firstInvitationBlock,
	      pages: new PageProvider({
	        transport: this.transport,
	        isSelfRegisterEnabled: this.isSelfRegisterEnabled,
	        analytics: this.analytics,
	        smsAvailable: this.isInvitationBySmsAvailable,
	        useLocalEmailProgram: this.useLocalEmailProgram,
	        isAdmin: this.isAdmin,
	        needConfirmRegistration: this.registerNeedConfirm,
	        whiteList: this.whitelistValue,
	        isCloud: this.isCloud,
	        linkRegisterEnabled: this.isSelfRegisterEnabled,
	        isExtranetInstalled: this.isExtranetInstalled,
	        canCurrentUserInvite: this.canCurrentUserInvite
	      }, this.userOptions).provide()
	    });
	  }
	}
	function _initMenu2() {
	  this.menuItems = Array.prototype.slice.call(this.menuContainer.querySelectorAll('a'));
	  if (main_core.Type.isDomNode(this.subMenuContainer)) {
	    const subMenuItem = Array.prototype.slice.call(this.subMenuContainer.querySelectorAll('a'));
	    this.menuItems = [...this.menuItems, ...subMenuItem];
	  }
	  (this.menuItems || []).forEach(item => {
	    main_core.Event.bind(item, 'click', () => {
	      this.changeContent(item.getAttribute('data-action'));
	      this.activeMenuItem(this.navigation.getCurrentCode());
	    });
	    if (item.getAttribute('data-action') === this.firstInvitationBlock) {
	      main_core.Dom.addClass(item.parentElement, 'ui-sidepanel-menu-active');
	    } else {
	      main_core.Dom.removeClass(item.parentElement, 'ui-sidepanel-menu-active');
	    }
	  });
	}
	function _showSuccessPopup2() {
	  new SuccessInvitePopup().show();
	}
	function _onSuccessRequest2(response) {
	  this.messageBar.hideAll();
	  if (response.data) {
	    main_core_events.EventEmitter.emit(main_core_events.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Invitation:onInviteRequestSuccess', {
	      response
	    });
	  }
	  main_core_events.EventEmitter.subscribe(main_core_events.EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onClose', () => {
	    BX.SidePanel.Instance.postMessageTop(window, 'BX.Bitrix24.EmailConfirmation:showPopup');
	  });
	}
	function _onErrorRequest2(reject) {
	  this.messageBar.showError(reject.errors[0].message);
	}

	exports.Form = Form;
	exports.MassInvitationField = MassInvitationField;

}((this.BX.Intranet.Invitation = this.BX.Intranet.Invitation || {}),BX.UI.Analytics,BX.UI.System.Typography,BX.UI,BX.Main,BX.UI,BX.UI.System.Chip,BX.Intranet,BX.UI.System.Input,BX.Intranet,BX.UI,BX.Event,BX));
//# sourceMappingURL=script.js.map
