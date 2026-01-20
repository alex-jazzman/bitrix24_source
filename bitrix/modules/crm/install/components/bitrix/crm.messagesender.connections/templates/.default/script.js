/* eslint-disable */
(function (exports,crm_integration_analytics,main_core,main_sidepanel,ui_analytics,ui_buttons,ui_iconSet_api_core) {
	'use strict';

	var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12, _templateObject13;
	function _classPrivateMethodInitSpec(obj, privateSet) { _checkPrivateRedeclaration(obj, privateSet); privateSet.add(obj); }
	function _classPrivateFieldInitSpec(obj, privateMap, value) { _checkPrivateRedeclaration(obj, privateMap); privateMap.set(obj, value); }
	function _checkPrivateRedeclaration(obj, privateCollection) { if (privateCollection.has(obj)) { throw new TypeError("Cannot initialize the same private elements twice on an object"); } }
	function _classPrivateMethodGet(receiver, privateSet, fn) { if (!privateSet.has(receiver)) { throw new TypeError("attempted to get private field on non-instance"); } return fn; }
	var namespace = main_core.Reflection.namespace('BX.Crm');
	var _pages = /*#__PURE__*/new WeakMap();
	var _currentPage = /*#__PURE__*/new WeakMap();
	var _targetNodeId = /*#__PURE__*/new WeakMap();
	var _container = /*#__PURE__*/new WeakMap();
	var _contactCenterUrl = /*#__PURE__*/new WeakMap();
	var _analytics = /*#__PURE__*/new WeakMap();
	var _draw = /*#__PURE__*/new WeakSet();
	var _redraw = /*#__PURE__*/new WeakSet();
	var _getContent = /*#__PURE__*/new WeakSet();
	var _getCurrentPage = /*#__PURE__*/new WeakSet();
	var _getNavBar = /*#__PURE__*/new WeakSet();
	var _addNavBarButtons = /*#__PURE__*/new WeakSet();
	var _getPage = /*#__PURE__*/new WeakSet();
	var _getSection = /*#__PURE__*/new WeakSet();
	var _getChannelStatusConnected = /*#__PURE__*/new WeakSet();
	var _getRecommendationSection = /*#__PURE__*/new WeakSet();
	var _getSectionHeader = /*#__PURE__*/new WeakSet();
	var _getChanel = /*#__PURE__*/new WeakSet();
	var _getChannelStatus = /*#__PURE__*/new WeakSet();
	var _getChanelIcon = /*#__PURE__*/new WeakSet();
	var _getConnectionButton = /*#__PURE__*/new WeakSet();
	var _openConnectionSlider = /*#__PURE__*/new WeakSet();
	var _sendConnectEvent = /*#__PURE__*/new WeakSet();
	var _getFooter = /*#__PURE__*/new WeakSet();
	var MessageSenderConnectionsComponent = /*#__PURE__*/function () {
	  function MessageSenderConnectionsComponent(params) {
	    var _params$analytics;
	    babelHelpers.classCallCheck(this, MessageSenderConnectionsComponent);
	    _classPrivateMethodInitSpec(this, _getFooter);
	    _classPrivateMethodInitSpec(this, _sendConnectEvent);
	    _classPrivateMethodInitSpec(this, _openConnectionSlider);
	    _classPrivateMethodInitSpec(this, _getConnectionButton);
	    _classPrivateMethodInitSpec(this, _getChanelIcon);
	    _classPrivateMethodInitSpec(this, _getChannelStatus);
	    _classPrivateMethodInitSpec(this, _getChanel);
	    _classPrivateMethodInitSpec(this, _getSectionHeader);
	    _classPrivateMethodInitSpec(this, _getRecommendationSection);
	    _classPrivateMethodInitSpec(this, _getChannelStatusConnected);
	    _classPrivateMethodInitSpec(this, _getSection);
	    _classPrivateMethodInitSpec(this, _getPage);
	    _classPrivateMethodInitSpec(this, _addNavBarButtons);
	    _classPrivateMethodInitSpec(this, _getNavBar);
	    _classPrivateMethodInitSpec(this, _getCurrentPage);
	    _classPrivateMethodInitSpec(this, _getContent);
	    _classPrivateMethodInitSpec(this, _redraw);
	    _classPrivateMethodInitSpec(this, _draw);
	    _classPrivateFieldInitSpec(this, _pages, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _currentPage, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _targetNodeId, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _container, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _contactCenterUrl, {
	      writable: true,
	      value: void 0
	    });
	    _classPrivateFieldInitSpec(this, _analytics, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldSet(this, _pages, new Map(params.slider.pages.map(function (item) {
	      return [item.id, item];
	    })));
	    babelHelpers.classPrivateFieldSet(this, _currentPage, params.currentPage);
	    babelHelpers.classPrivateFieldSet(this, _targetNodeId, params.targetNodeId);
	    babelHelpers.classPrivateFieldSet(this, _contactCenterUrl, params.contactCenterUrl);
	    babelHelpers.classPrivateFieldSet(this, _analytics, (_params$analytics = params.analytics) !== null && _params$analytics !== void 0 ? _params$analytics : {});
	  }
	  babelHelpers.createClass(MessageSenderConnectionsComponent, [{
	    key: "init",
	    value: function init() {
	      babelHelpers.classPrivateFieldSet(this, _container, document.getElementById(babelHelpers.classPrivateFieldGet(this, _targetNodeId)));
	      if (babelHelpers.classPrivateFieldGet(this, _container)) {
	        _classPrivateMethodGet(this, _draw, _draw2).call(this);
	      }
	    }
	  }]);
	  return MessageSenderConnectionsComponent;
	}();
	function _draw2() {
	  main_core.Dom.append(_classPrivateMethodGet(this, _getContent, _getContent2).call(this), babelHelpers.classPrivateFieldGet(this, _container));
	}
	function _redraw2() {
	  main_core.Dom.clean(babelHelpers.classPrivateFieldGet(this, _container));
	  _classPrivateMethodGet(this, _draw, _draw2).call(this);
	}
	function _getContent2() {
	  return main_core.Tag.render(_templateObject || (_templateObject = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div>\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), _classPrivateMethodGet(this, _getNavBar, _getNavBar2).call(this), _classPrivateMethodGet(this, _getPage, _getPage2).call(this, _classPrivateMethodGet(this, _getCurrentPage, _getCurrentPage2).call(this)), _classPrivateMethodGet(this, _getFooter, _getFooter2).call(this));
	}
	function _getCurrentPage2() {
	  return babelHelpers.classPrivateFieldGet(this, _pages).get(babelHelpers.classPrivateFieldGet(this, _currentPage));
	}
	function _getNavBar2() {
	  var navBar = main_core.Tag.render(_templateObject2 || (_templateObject2 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-message-sender-connections-tab-navigation\"></div>\n\t\t"])));
	  _classPrivateMethodGet(this, _addNavBarButtons, _addNavBarButtons2).call(this, navBar);
	  return navBar;
	}
	function _addNavBarButtons2(node) {
	  var _this = this;
	  babelHelpers.classPrivateFieldGet(this, _pages).forEach(function (page, id) {
	    new ui_buttons.Button({
	      size: ui_buttons.ButtonSize.SMALL,
	      style: id === babelHelpers.classPrivateFieldGet(_this, _currentPage) ? ui_buttons.AirButtonStyle.SELECTION : ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
	      useAirDesign: true,
	      text: page.title,
	      onclick: function onclick() {
	        if (id === babelHelpers.classPrivateFieldGet(_this, _currentPage)) {
	          return;
	        }
	        babelHelpers.classPrivateFieldSet(_this, _currentPage, page.id);
	        _classPrivateMethodGet(_this, _redraw, _redraw2).call(_this);
	      }
	    }).renderTo(node);
	  });
	  new ui_buttons.Button({
	    size: ui_buttons.ButtonSize.SMALL,
	    style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_TAB_NAV_ALL_CONNECTION'),
	    onclick: function onclick() {
	      main_sidepanel.SidePanel.Instance.open(babelHelpers.classPrivateFieldGet(_this, _contactCenterUrl));
	      _classPrivateMethodGet(_this, _sendConnectEvent, _sendConnectEvent2).call(_this, 'contactCenter');
	    }
	  }).renderTo(node);
	  new ui_buttons.Button({
	    size: ui_buttons.ButtonSize.SMALL,
	    style: ui_buttons.AirButtonStyle.PLAIN_NO_ACCENT,
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_TAB_NAV_MARKET'),
	    onclick: function onclick() {
	      main_sidepanel.SidePanel.Instance.open('/market/category/crm_robot_sms/');
	    }
	  }).renderTo(node);
	}
	function _getPage2(page) {
	  var _this2 = this;
	  if (page.id === 'recommendations') {
	    return main_core.Tag.render(_templateObject3 || (_templateObject3 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<div class=\"crm-message-sender-connections-page-recommendation\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t"])), page.sections.map(function (section) {
	      return _classPrivateMethodGet(_this2, _getRecommendationSection, _getRecommendationSection2).call(_this2, section);
	    }));
	  }
	  var pageHtml = main_core.Tag.render(_templateObject4 || (_templateObject4 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-message-sender-connections-page\"></div>\n\t\t"])));
	  for (var i = 0; i < page.sections.length; i++) {
	    var section = page.sections[i];
	    for (var j = 0; j < section.channels.length; j++) {
	      var channel = section.channels[j];
	      main_core.Dom.append(_classPrivateMethodGet(this, _getSection, _getSection2).call(this, section, channel), pageHtml);
	    }
	  }
	  return pageHtml;
	}
	function _getSection2(section, channel) {
	  var _this3 = this;
	  var sectionHtml = main_core.Tag.render(_templateObject5 || (_templateObject5 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-message-sender-connections-section-default\" style=\"background: ", "\">\n\t\t\t\t", "\n\t\t\t\t<div class=\"crm-message-sender-connections-section-default-image\">\n\t\t\t\t\t<div><img alt=\"", "\" src=\"", "\"></div>\n\t\t\t\t</div>\n\t\t\t\t<div class=\"crm-message-sender-connections-section-channel-default-title\" style=\"", "\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), main_core.Text.encode(section.color), channel.isConnected ? _classPrivateMethodGet(this, _getChannelStatusConnected, _getChannelStatusConnected2).call(this) : '', main_core.Text.encode(section.title), main_core.Text.encode(section.iconPath), channel.isConnected ? 'color: var(--ui-color-base-8)' : '', main_core.Text.encode(section.title));
	  main_core.Event.bind(sectionHtml, 'click', function () {
	    return _classPrivateMethodGet(_this3, _openConnectionSlider, _openConnectionSlider2).call(_this3, channel);
	  });
	  return sectionHtml;
	}
	function _getChannelStatusConnected2() {
	  var icon = new ui_iconSet_api_core.Icon({
	    icon: ui_iconSet_api_core.Main.CHECK,
	    size: 16,
	    color: '#fff'
	  }).render();
	  return main_core.Tag.render(_templateObject6 || (_templateObject6 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-message-sender-connections-section-channel-status-connected\">", "</div>\n\t\t"])), icon);
	}
	function _getRecommendationSection2(section) {
	  var _this4 = this;
	  return main_core.Tag.render(_templateObject7 || (_templateObject7 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-message-sender-connections-section\" style=\"background: ", "\">\n\t\t\t\t", "\n\t\t\t\t<div class=\"crm-message-sender-connections-section-channel-container\">\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), section.color, _classPrivateMethodGet(this, _getSectionHeader, _getSectionHeader2).call(this, section), section.channels.map(function (channel) {
	    return _classPrivateMethodGet(_this4, _getChanel, _getChanel2).call(_this4, channel);
	  }));
	}
	function _getSectionHeader2(section) {
	  var title = section.iconPath ? main_core.Tag.render(_templateObject8 || (_templateObject8 = babelHelpers.taggedTemplateLiteral(["<img src=\"", "\">"])), section.iconPath) : section.title;
	  if (!section.description) {
	    return main_core.Tag.render(_templateObject9 || (_templateObject9 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t\t<header class=\"crm-message-sender-connections-section-header\">\n\t\t\t\t\t<div class=\"crm-message-sender-connections-section-icon\">", "</div>\n\t\t\t\t</header>\n\t\t\t"])), main_core.Text.encode(title));
	  }
	  return main_core.Tag.render(_templateObject10 || (_templateObject10 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<header class=\"crm-message-sender-connections-section-header\">\n\t\t\t\t<div class=\"crm-message-sender-connections-section-title\">", "</div>\n\t\t\t\t<div class=\"crm-message-sender-connections-section-description\">", "</div>\n\t\t\t</header>\n\t\t"])), main_core.Text.encode(title), main_core.Text.encode(section.description));
	}
	function _getChanel2(channel) {
	  return main_core.Tag.render(_templateObject11 || (_templateObject11 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-message-sender-connections-channel\">\n\t\t\t\t<div class=\"crm-message-sender-connections-channel-header\">\n\t\t\t\t\t<div class=\"crm-message-sender-connections-channel-header-icon\" style=\"background: ", "\">\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t\t", "\n\t\t\t\t</div>\n\t\t\t\t<div class=\"crm-message-sender-connections-channel-content\">\n\t\t\t\t\t<div class=\"crm-message-sender-connections-channel-content-title\">\n\t\t\t\t\t\t<div class=\"crm-message-sender-connections-channel-content-title-text\" title=\"", "\">\n\t\t\t\t\t\t\t", "\n\t\t\t\t\t\t</div>\n\t\t\t\t\t\t", "\n\t\t\t\t\t</div>\n\t\t\t\t\t<div class=\"crm-message-sender-connections-channel-content-description\">", "</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t"])), main_core.Text.encode(channel.appearance.icon.background), _classPrivateMethodGet(this, _getChanelIcon, _getChanelIcon2).call(this, channel.appearance.icon), _classPrivateMethodGet(this, _getConnectionButton, _getConnectionButton2).call(this, channel), main_core.Text.encode(channel.appearance.title), main_core.Text.encode(channel.appearance.title), _classPrivateMethodGet(this, _getChannelStatus, _getChannelStatus2).call(this, channel), main_core.Text.encode(channel.appearance.description));
	}
	function _getChannelStatus2(channel) {
	  if (!channel.isConnected) {
	    return null;
	  }
	  return main_core.Tag.render(_templateObject12 || (_templateObject12 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-message-sender-connections-channel-status\">\n\t\t\t\t", "\n\t\t\t</div>\n\t\t"])), main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_CHANNEL_STATUS'));
	}
	function _getChanelIcon2(icon) {
	  return new ui_iconSet_api_core.Icon({
	    icon: icon.title,
	    size: 62,
	    color: icon.color
	  }).render();
	}
	function _getConnectionButton2(channel) {
	  var _this5 = this;
	  return new ui_buttons.Button({
	    size: ui_buttons.ButtonSize.LARGE,
	    style: channel.isConnected ? ui_buttons.AirButtonStyle.OUTLINE : ui_buttons.AirButtonStyle.FILLED,
	    useAirDesign: true,
	    text: channel.isConnected ? main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_CHANNEL_SETTING_BUTTON') : main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_CHANNEL_CONNECTION_BUTTON'),
	    onclick: function onclick() {
	      _classPrivateMethodGet(_this5, _openConnectionSlider, _openConnectionSlider2).call(_this5, channel);
	    }
	  }).getContainer();
	}
	function _openConnectionSlider2(channel) {
	  var _this6 = this;
	  var promise = null;
	  if (channel.isLocked) {
	    promise = main_core.Runtime.loadExtension('ui.info-helper').then(function (_ref) {
	      var FeaturePromotersRegistry = _ref.FeaturePromotersRegistry;
	      FeaturePromotersRegistry.getPromoter({
	        code: channel.sliderCode
	      }).show();
	      return {
	        status: 'locked'
	      };
	    });
	  } else {
	    promise = main_core.Runtime.loadExtension('crm.router').then(function (_ref2) {
	      var Router = _ref2.Router;
	      return Router.openSlider(channel.connectionUrl).then()["catch"]()["finally"](function () {
	        return window.location.reload();
	      });
	    }).then(function (slider) {
	      return {
	        status: slider.getData().get('status')
	      };
	    });
	  }
	  if (!channel.isConnected) {
	    void promise.then(function (_ref3) {
	      var status = _ref3.status;
	      _classPrivateMethodGet(_this6, _sendConnectEvent, _sendConnectEvent2).call(_this6, channel.id, status);
	    });
	  }
	}
	function _sendConnectEvent2(channelId, connectStatus) {
	  var analyticsData = new crm_integration_analytics.Builder.Communication.Channel.ConnectEvent().setChannelId(channelId).setConnectStatus(connectStatus).setSubSection(crm_integration_analytics.Dictionary.SUB_SECTION_CONNECTION_SLIDER).setSection(babelHelpers.classPrivateFieldGet(this, _analytics).c_section).buildData();
	  ui_analytics.sendData(analyticsData);
	}
	function _getFooter2() {
	  var _this7 = this;
	  var button = new ui_buttons.Button({
	    size: ui_buttons.ButtonSize.EXTRA_LARGE,
	    style: ui_buttons.AirButtonStyle.OUTLINE,
	    useAirDesign: true,
	    text: main_core.Loc.getMessage('CRM_MESSAGESENDER_CONNECTIONS_FOOTER_BUTTON_ALL_CONNECTION'),
	    onclick: function onclick() {
	      main_sidepanel.SidePanel.Instance.open(babelHelpers.classPrivateFieldGet(_this7, _contactCenterUrl));
	      _classPrivateMethodGet(_this7, _sendConnectEvent, _sendConnectEvent2).call(_this7, 'contactCenter');
	    }
	  }).getContainer();
	  return main_core.Tag.render(_templateObject13 || (_templateObject13 = babelHelpers.taggedTemplateLiteral(["\n\t\t\t<div class=\"crm-message-sender-connections-footer\">", "</div>\n\t\t"])), button);
	}
	namespace.MessageSenderConnectionsComponent = MessageSenderConnectionsComponent;

}((this.window = this.window || {}),BX.Crm.Integration.Analytics,BX,BX.SidePanel,BX.UI.Analytics,BX.UI,BX.UI.IconSet));
//# sourceMappingURL=script.js.map
