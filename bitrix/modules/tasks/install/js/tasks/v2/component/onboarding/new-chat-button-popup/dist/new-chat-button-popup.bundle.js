/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports, main_core, main_popup, ui_bannerDispatcher) {
	'use strict';

	class NewChatButtonPopup {
		#popup;
		static show() {
			return new this().showPopup();
		}
		showPopup() {
			ui_bannerDispatcher.BannerDispatcher.normal.toQueue(onDone => {
				this.#popup = this.getPopup();
				if (!this.#popup) {
					onDone();
					return;
				}
				const onClose = () => {
					onDone();
				};
				this.#popup.show();
				this.#popup.subscribe('onClose', onClose);
				this.#popup.subscribe('onDestroy', onClose);
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
			return main_core.Tag.render`
			<div class="tasks-onboarding-new-chat-button-popup">
				<div class="tasks-onboarding-new-chat-button-popup-icon">
					<img src="${this.getIconPath()}" alt="">
				</div>
				<div class="tasks-onboarding-new-chat-button-popup-content">
					<div class="tasks-onboarding-new-chat-button-popup-title">
						${main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CHAT_BUTTON_POPUP_TITLE')}
					</div>
					<div class="tasks-onboarding-new-chat-button-popup-text">
						${main_core.Loc.getMessage('TASKS_COMPONENT_ONBOARDING_NEW_CHAT_BUTTON_POPUP_TEXT')}
					</div>
				</div>
			</div>
		`;
		}
		getIconPath() {
			return '/bitrix/js/tasks/v2/component/onboarding/new-chat-button-popup/src/new-chat-button-popup.png';
		}
		close() {
			this.#popup.close();
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

})(this.BX.Tasks.V2.Component.Onboarding = this.BX.Tasks.V2.Component.Onboarding || {}, BX, BX.Main, BX.UI);
//# sourceMappingURL=new-chat-button-popup.bundle.js.map
