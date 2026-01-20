/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core,main_popup,ui_bannerDispatcher) {
	'use strict';

	let _ = t => t,
	  _t;
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	class NewChatButtonPopup {
	  constructor() {
	    Object.defineProperty(this, _popup, {
	      writable: true,
	      value: void 0
	    });
	  }
	  static show() {
	    return new this().showPopup();
	  }
	  showPopup() {
	    ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = this.getPopup();
	      if (!babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup]) {
	        onDone();
	        return;
	      }
	      const onClose = () => {
	        onDone();
	      };
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].show();
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].subscribe('onClose', onClose);
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].subscribe('onDestroy', onClose);
	      this.setViewed();
	    });
	  }
	  getPopup() {
	    const chatButton = document.getElementById('tasks-chat-button');
	    if (!chatButton) {
	      return null;
	    }
	    return new main_popup.Popup({
	      className: 'tasks-onboarding-new-chat-button-popup-wrapper',
	      content: this.getContent(),
	      bindElement: chatButton,
	      background: 'var(--ui-color-bg-content-inapp)',
	      angle: true,
	      autoHide: true,
	      autoHideHandler: () => true,
	      cacheable: false,
	      animation: 'fading',
	      padding: 0,
	      maxWidth: 460,
	      minWidth: 460,
	      offsetLeft: 60,
	      closeByEsc: false,
	      closeIcon: true
	    });
	  }
	  getContent() {
	    return main_core.Tag.render(_t || (_t = _`
			<div class="tasks-onboarding-new-chat-button-popup">
				<div class="tasks-onboarding-new-chat-button-popup-icon">
					<img src="${0}" alt="">
				</div>
				<div class="tasks-onboarding-new-chat-button-popup-content">
					<div class="tasks-onboarding-new-chat-button-popup-title">
						${0}
					</div>
					<div class="tasks-onboarding-new-chat-button-popup-text">
						${0}
					</div>
				</div>
			</div>
		`), this.getIconPath(), main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CHAT_BUTTON_POPUP_TITLE'), main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CHAT_BUTTON_POPUP_TEXT'));
	  }
	  getIconPath() {
	    return '/bitrix/js/tasks/v2/component/onboarding/new-chat-button-popup/src/new-chat-button-popup.png';
	  }
	  close() {
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].close();
	  }
	  setViewed() {
	    void main_core.ajax.runAction('tasks.promotion.setViewed', {
	      data: {
	        promotion: 'tasks_new_chat_button'
	      }
	    });
	  }
	}

	exports.NewChatButtonPopup = NewChatButtonPopup;

}((this.BX.Tasks.V2.Component.Onboarding = this.BX.Tasks.V2.Component.Onboarding || {}),BX,BX.Main,BX.UI));
//# sourceMappingURL=new-chat-button-popup.bundle.js.map
