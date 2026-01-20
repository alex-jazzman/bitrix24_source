/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,main_core,main_popup,ui_buttons,ui_iconSet_api_core,ui_bannerDispatcher) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2,
	  _t3,
	  _t4,
	  _t5;
	var _popup = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("popup");
	class NewCardPopup {
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
	    ui_bannerDispatcher.BannerDispatcher.high.toQueue(onDone => {
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup] = this.getPopup();
	      const onClose = () => {
	        setTimeout(() => {
	          onDone();
	        }, 1000);
	      };
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].show();
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].subscribe('onClose', onClose);
	      babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].subscribe('onDestroy', onClose);
	      this.setViewed();
	    });
	  }
	  getPopup() {
	    return new main_popup.Popup({
	      content: this.getContent(),
	      disableScroll: true,
	      autoHide: true,
	      padding: 0,
	      width: 905,
	      height: 525,
	      autoHideHandler: () => true,
	      overlay: {
	        backgroundColor: '#0A2D5F',
	        opacity: 58
	      },
	      closeIcon: false,
	      closeByEsc: false,
	      className: 'tasks-onboarding-new-card-popup-wrapper'
	    });
	  }
	  getContent() {
	    return main_core.Tag.render(_t || (_t = _`
			<div class="tasks-onboarding-new-card-popup">
				<div class="tasks-onboarding-new-card-popup-content-gradient">
					<div class="tasks-onboarding-new-card-popup-content">
						<div class="tasks-onboarding-new-card-popup-left">
							<div class="tasks-onboarding-new-card-popup-title">
								${0}
							</div>
							<div class="tasks-onboarding-new-card-popup-feature-list">
								${0}
							</div>
							${0}
						</div>
						<div class="tasks-onboarding-new-card-popup-right">
							<img 
								class="tasks-onboarding-new-card-popup-cosmozeph" 
								src="${0}" 
								alt=""
							/>
							<div class="tasks-onboarding-new-card-popup-video-border">
								${0}
							</div>
							<div class="tasks-onboarding-new-card-popup-pill --fast">${0}</div>
							<div class="tasks-onboarding-new-card-popup-pill --simple">${0}</div>
							<div class="tasks-onboarding-new-card-popup-pill --ai">${0}</div>
						</div>
					</div>
				</div>
			</div>
		`), main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_TITLE'), this.getFeatures().map(feature => this.getFeatureElement(feature)), this.getButton(), this.getCosmozephPath(), this.getVideoElement(), main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FAST'), main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_SIMPLE'), main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_AI'));
	  }
	  getOverlay() {
	    const element = main_core.Tag.render(_t2 || (_t2 = _`<div class="tasks-onboarding-new-card-popup-overlay"></div>`));
	    main_core.Event.bind(element, 'click', () => {
	      this.close();
	    });
	    return element;
	  }
	  getFeatureElement(feature) {
	    return main_core.Tag.render(_t3 || (_t3 = _`
			<div class="tasks-onboarding-new-card-popup-feature">
				${0}
				<div class="tasks-onboarding-new-card-popup-feature-content">
					<div class="tasks-onboarding-new-card-popup-feature-title">${0}</div>
					<div class="tasks-onboarding-new-card-popup-feature-subtitle">${0}</div>
				</div>
			</div>
		`), this.getFeatureIcon(feature.icon), feature.title, feature.subtitle);
	  }
	  getFeatureIcon(featureIcon) {
	    const icon = new ui_iconSet_api_core.Icon({
	      icon: featureIcon,
	      size: 22,
	      color: '#fff'
	    });
	    return icon.render();
	  }
	  getButton() {
	    const button = new ui_buttons.Button({
	      useAirDesign: true,
	      text: main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_BUTTON_START'),
	      style: ui_buttons.AirButtonStyle.FILLED,
	      size: ui_buttons.ButtonSize.EXTRA_LARGE,
	      onclick: () => {
	        this.close();
	      }
	    });
	    return main_core.Tag.render(_t4 || (_t4 = _`
			<div class="tasks-onboarding-new-card-popup-button-container">
				${0}
			</div>
		`), button.render());
	  }
	  getVideoElement() {
	    const video = main_core.Tag.render(_t5 || (_t5 = _`
			<video
				class="tasks-onboarding-new-card-popup-video"
				autoplay
				loop
				muted
				playsinline
				preload="auto"
			>
				<source src="${0}" type="video/webm">
			</video>
		`), this.getVideoPath());
	    setTimeout(() => {
	      main_core.Event.bind(video, 'error', () => {});
	      main_core.Event.bind(video, 'loadeddata', () => {
	        video.play().catch(() => {});
	      });
	      video.load();
	      const playPromise = video.play();
	      if (playPromise !== undefined) {
	        playPromise.catch(() => {
	          video.muted = true;
	          video.play();
	        });
	      }
	    }, 0);
	    return video;
	  }
	  getVideoPath() {
	    return '/bitrix/js/tasks/v2/component/onboarding/new-card-popup/src/preview.webm';
	  }
	  getCosmozephPath() {
	    return '/bitrix/js/tasks/v2/component/onboarding/new-card-popup/src/cosmozeph.png';
	  }
	  getFeatures() {
	    return [{
	      icon: ui_iconSet_api_core.Outline.AI_STARS,
	      title: main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_TITLE_1'),
	      subtitle: main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_DESCRIPTION_1')
	    }, {
	      icon: ui_iconSet_api_core.Outline.CHATS,
	      title: main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_TITLE_2'),
	      subtitle: main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_DESCRIPTION_2')
	    }, {
	      icon: ui_iconSet_api_core.Outline.ACTION_REQUIRED,
	      title: main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_TITLE_3'),
	      subtitle: main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FEATURE_DESCRIPTION_3')
	    }];
	  }
	  close() {
	    babelHelpers.classPrivateFieldLooseBase(this, _popup)[_popup].close();
	  }
	  setViewed() {
	    void main_core.ajax.runAction('tasks.promotion.setViewed', {
	      data: {
	        promotion: 'tasks_new_card'
	      }
	    });
	  }
	}

	exports.NewCardPopup = NewCardPopup;

}((this.BX.Tasks.V2.Component.Onboarding = this.BX.Tasks.V2.Component.Onboarding || {}),BX,BX.Main,BX.UI,BX.UI.IconSet,BX.UI));
//# sourceMappingURL=new-card-popup.bundle.js.map
