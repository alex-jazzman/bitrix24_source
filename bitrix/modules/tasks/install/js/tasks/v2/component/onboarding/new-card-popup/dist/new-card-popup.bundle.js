/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_popup, ui_buttons, ui_iconSet_api_core, ui_bannerDispatcher) {
	'use strict';

	class NewCardPopup {
		#popup;
		static show() {
			return new this().showPopup();
		}
		showPopup() {
			ui_bannerDispatcher.BannerDispatcher.high.toQueue(onDone => {
				this.#popup = this.getPopup();
				const onClose = () => {
					setTimeout(() => {
						onDone();
					}, 1000);
				};
				this.#popup.show();
				this.#popup.subscribe('onClose', onClose);
				this.#popup.subscribe('onDestroy', onClose);
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
			return main_core.Tag.render`
			<div class="tasks-onboarding-new-card-popup">
				<div class="tasks-onboarding-new-card-popup-content-gradient">
					<div class="tasks-onboarding-new-card-popup-content">
						<div class="tasks-onboarding-new-card-popup-left">
							<div class="tasks-onboarding-new-card-popup-title">
								${main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_TITLE')}
							</div>
							<div class="tasks-onboarding-new-card-popup-feature-list">
								${this.getFeatures().map(feature => this.getFeatureElement(feature))}
							</div>
							${this.getButton()}
						</div>
						<div class="tasks-onboarding-new-card-popup-right">
							<img 
								class="tasks-onboarding-new-card-popup-cosmozeph" 
								src="${this.getCosmozephPath()}" 
								alt=""
							/>
							<div class="tasks-onboarding-new-card-popup-video-border">
								${this.getVideoElement()}
							</div>
							<div class="tasks-onboarding-new-card-popup-pill --fast">${main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_FAST')}</div>
							<div class="tasks-onboarding-new-card-popup-pill --simple">${main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_SIMPLE')}</div>
							<div class="tasks-onboarding-new-card-popup-pill --ai">${main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CARD_POPUP_AI')}</div>
						</div>
					</div>
				</div>
			</div>
		`;
		}
		getOverlay() {
			const element = main_core.Tag.render`<div class="tasks-onboarding-new-card-popup-overlay"></div>`;
			main_core.Event.bind(element, 'click', () => {
				this.close();
			});
			return element;
		}
		getFeatureElement(feature) {
			return main_core.Tag.render`
			<div class="tasks-onboarding-new-card-popup-feature">
				${this.getFeatureIcon(feature.icon)}
				<div class="tasks-onboarding-new-card-popup-feature-content">
					<div class="tasks-onboarding-new-card-popup-feature-title">${feature.title}</div>
					<div class="tasks-onboarding-new-card-popup-feature-subtitle">${feature.subtitle}</div>
				</div>
			</div>
		`;
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
			return main_core.Tag.render`
			<div class="tasks-onboarding-new-card-popup-button-container">
				${button.render()}
			</div>
		`;
		}
		getVideoElement() {
			const video = main_core.Tag.render`
			<video
				class="tasks-onboarding-new-card-popup-video"
				autoplay
				loop
				muted
				playsinline
				preload="auto"
			>
				<source src="${this.getVideoPath()}" type="video/webm">
			</video>
		`;
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
			this.#popup.close();
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

})(this.BX.Tasks.V2.Component.Onboarding = this.BX.Tasks.V2.Component.Onboarding || {}, BX, BX.Main, BX.UI, BX.UI.IconSet, BX.UI);
//# sourceMappingURL=new-card-popup.bundle.js.map
