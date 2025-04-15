/* eslint-disable */
this.BX = this.BX || {};
(function (exports,main_core,ui_bannerDispatcher,ui_notificationPanel,ui_iconSet_api_core,ui_buttons,ui_analytics) {
	'use strict';

	var _getPanel = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getPanel");
	var _sendAnalytics = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("sendAnalytics");
	class MarketExpiredCurtain {
	  constructor(id) {
	    Object.defineProperty(this, _sendAnalytics, {
	      value: _sendAnalytics2
	    });
	    Object.defineProperty(this, _getPanel, {
	      value: _getPanel2
	    });
	    this.id = id;
	  }
	  show() {
	    ui_bannerDispatcher.BannerDispatcher.critical.toQueue(onDone => {
	      const panel = babelHelpers.classPrivateFieldLooseBase(this, _getPanel)[_getPanel](onDone);
	      panel.show();
	      babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytics)[_sendAnalytics]('show_notification_panel');
	    });
	  }
	}
	function _getPanel2(onDone) {
	  const panel = new ui_notificationPanel.NotificationPanel({
	    content: main_core.Loc.getMessage('REST_SIDEPANEL_WRAPPER_MARKET_EXPIRED_NOTIFICATION_TEXT'),
	    backgroundColor: '#E89B06',
	    textColor: '#FFFFFF',
	    crossColor: '#FFFFFF',
	    leftIcon: new ui_iconSet_api_core.Icon({
	      icon: ui_iconSet_api_core.Main.MARKET_1,
	      color: '#FFFFFF'
	    }),
	    rightButtons: [new ui_buttons.Button({
	      text: main_core.Loc.getMessage('REST_SIDEPANEL_WRAPPER_MARKET_EXPIRED_NOTIFICATION_BUTTON_TEXT'),
	      size: ui_buttons.Button.Size.EXTRA_SMALL,
	      color: ui_buttons.Button.Color.CURTAIN_WARNING,
	      tag: ui_buttons.Button.Tag.LINK,
	      noCaps: true,
	      round: true,
	      props: {
	        href: 'FEATURE_PROMOTER=limit_v2_nosubscription_marketplace_withapplications_off'
	      },
	      onclick: () => {
	        panel.hide();
	        babelHelpers.classPrivateFieldLooseBase(this, _sendAnalytics)[_sendAnalytics]('click_button');
	      }
	    })],
	    events: {
	      onHide: () => {
	        onDone();
	        BX.userOptions.save('rest', `marketTransitionCurtain${this.id}Ts`, null, Math.floor(Date.now() / 1000));
	      }
	    },
	    zIndex: 1001
	  });
	  return panel;
	}
	function _sendAnalytics2(event) {
	  const params = {
	    tool: 'infohelper',
	    category: 'market',
	    event,
	    type: 'notification_panel'
	  };
	  ui_analytics.sendData(params);
	}

	exports.MarketExpiredCurtain = MarketExpiredCurtain;

}((this.BX.Rest = this.BX.Rest || {}),BX,BX.UI,BX.UI,BX.UI.IconSet,BX.UI,BX.UI.Analytics));
//# sourceMappingURL=market-expired-curtain.bundle.js.map
