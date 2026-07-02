/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
this.BX.Crm.AI = this.BX.Crm.AI || {};
(function (exports, crm_ai_nameService, main_core, main_popup, ui_buttons, ui_iconSet_api_core, ui_iconSet_main, ui_iconSet_actions, ui_lottie) {
	'use strict';

	class RecognitionPromo {
		#popup = null;
		#events;
		constructor(options) {
			this.#events = options?.events ?? {};
			this.#preloadMainLottieAnimation();
		}
		show() {
			if (this.#popup === null) {
				this.#popup = this.#initPopup();
			}
			this.#popup.show();
		}
		hide() {
			this.#popup?.close();
		}
		subscribe(eventName, callback) {
			if (this.#popup === null) {
				this.#popup = this.#initPopup();
			}
			this.#popup.subscribe(eventName, callback);
		}
		shouldShowAgain() {
			const checkbox = document.getElementById('crm__ai-recognition-promo_checkbox_dont_show_again');
			return checkbox ? !checkbox.checked : true;
		}
		#initPopup() {
			return new main_popup.Popup({
				content: this.#renderPopupContent(),
				padding: 0,
				width: 528,
				noAllPaddings: true,
				overlay: {
					backgroundColor: '#000',
					opacity: 40
				},
				cacheable: false,
				borderRadius: 16,
				background: 'transparent',
				contentBackground: 'transparent',
				animation: 'fading-slide',
				events: {
					onPopupShow: () => {
						if (this.#events.onShow) {
							this.#events.onShow();
						}
					},
					onPopupClose: () => {
						if (this.#events.onHide) {
							this.#events.onHide();
						}
						this.#popup = null;
					}
				}
			});
		}
		#renderPopupContent() {
			const headerTitle = main_core.Loc.getMessage('RECOGNITION_PROMO_TITLE', crm_ai_nameService.NameService.copilotNameReplacement());
			return main_core.Tag.render`
			<div class="crm__ai-recognition-promo">
				<header class="crm__ai-recognition-promo_header">
					<div class="crm__ai-recognition-promo_header-left">
						<div class="crm__ai-recognition-promo_header-icon">
							${this.#renderHeaderCopilotIcon()}
						</div>
						<h4 class="crm__ai-recognition-promo_c">${headerTitle}</h4>
					</div>
					<div class="crm__ai-recognition-promo_header-close-button">
						${this.#renderHidePopupButton()}
					</div>
				</header>
				<main class="crm__ai-recognition-promo_content">
					${this.#renderLottieAnimation()}
					${this.#renderContentText()}
				</main>
				<footer class="crm__ai-recognition-promo_footer">
					${this.#renderConnectTelephonyButton()}
					${this.#renderRemindLaterButton()}
				</footer>
				<div class="crm__ai-recognition-promo_checkbox_dont_show_again">
					<input type="checkbox" id="crm__ai-recognition-promo_checkbox_dont_show_again">
					<label>${main_core.Loc.getMessage('RECOGNITION_PROMO_DONT_SHOW_AGAIN')}</label>
				</div>
			</div>
		`;
		}
		#renderHeaderCopilotIcon() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.COPILOT_AI,
				size: 40,
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-copilot-primary') ?? '#8E52EC'
			});
			return icon.render();
		}
		#renderHidePopupButton() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Actions.CROSS_40,
				size: 24
			});
			const button = main_core.Tag.render`
			<button class="crm__ai-recognition-promo_close-popup-button">
				${icon.render()}
			</button>
		`;
			main_core.bind(button, 'click', () => {
				if (this.#events?.onClickOnClosePopup) {
					this.#events.onClickOnClosePopup();
				}
				{
					this.hide();
				}
			});
			return button;
		}
		#renderLottieAnimation() {
			const container = main_core.Tag.render`
			<div class="crm__ai-recognition-promo_video-container">
				<canvas ref="canvas"></canvas>
				<div ref="lottie" class="crm__ai-recognition-promo_content-lottie"></div>
				<div ref="confetti" class="crm__ai-recognition-promo_content-confetti"></div>
			</div>
		`;
			const mainAnimation = ui_lottie.Lottie.loadAnimation({
				path: this.#getMainAnimationPath(),
				container: container.lottie,
				renderer: 'svg',
				loop: true,
				autoplay: true
			});
			mainAnimation.setSpeed(0.75);
			const confettiAnimation = ui_lottie.Lottie.loadAnimation({
				path: '/bitrix/js/crm/ai/whatsnew/recognition-promo/lottie/confetti-animation.json',
				container: container.confetti,
				renderer: 'svg',
				loop: true,
				autoplay: false
			});
			confettiAnimation.setSpeed(1.3);
			main_core.Dom.style(container.confetti, 'opacity', 0);
			main_core.bind(confettiAnimation, 'loopComplete', () => {
				confettiAnimation.pause();
				main_core.Dom.style(container.confetti, 'opacity', 0);
			});
			let confettiWereShown = false;
			main_core.bind(mainAnimation, 'loopComplete', () => {
				confettiWereShown = false;
				main_core.Dom.style(container.confetti, 'opacity', 0);
			});
			main_core.bind(mainAnimation, 'enterFrame', e => {
				if (confettiWereShown === false && e.currentTime > 350) {
					confettiAnimation.play();
					main_core.Dom.style(container.confetti, 'opacity', 1);
					confettiWereShown = true;
				}
			});
			main_core.bind(mainAnimation, 'enterFrame', e => {
				if (e.currentTime > 350 && confettiWereShown === false) {
					confettiAnimation.play();
					main_core.Dom.style(container.confetti, 'opacity', 1);
					confettiWereShown = true;
				}
			});
			return container.root;
		}
		#renderContentText() {
			const content = main_core.Loc.getMessage('RECOGNITION_PROMO_CONTENT', {
				'[P]': '<p>',
				'[/P]': '</p>',
				'[LINK1]': '<a ref="link1">',
				'[/LINK1]': '</a>',
				'[LINK2]': '<a ref="link2">',
				'[/LINK2]': '</a>',
				'#COPILOT_NAME#': crm_ai_nameService.NameService.copilotName()
			});
			const container = main_core.Tag.render`
			<div class="crm__ai-recognition-promo_content-description">
				${content}
			</div>
		`;
			const Helper = main_core.Reflection.getClass('top.BX.Helper');
			main_core.bind(container.link1, 'click', () => {
				const articleCode = '19092894'; // todo replace with the real article code

				Helper?.show(`redirect=detail&code=${articleCode}`);
			});
			main_core.bind(container.link2, 'click', () => {
				const articleCode = '6450911'; // todo replace with the real article code

				Helper?.show(`redirect=detail&code=${articleCode}`);
			});
			return container.root;
		}
		#renderConnectTelephonyButton() {
			const button = new ui_buttons.Button({
				color: ui_buttons.ButtonColor.SUCCESS,
				text: main_core.Loc.getMessage('RECOGNITION_PROMO_CONNECT_TELEPHONY'),
				round: true,
				onclick: btn => {
					if (this.#events?.onClickOnConnectButton) {
						this.#events.onClickOnConnectButton(btn);
					}
				}
			});
			return button.render();
		}
		#renderRemindLaterButton() {
			const button = new ui_buttons.Button({
				color: ui_buttons.ButtonColor.LINK,
				text: main_core.Loc.getMessage('RECOGNITION_PROMO_REMIND_LATER'),
				round: true,
				onclick: btn => {
					if (this.#events?.onClickOnRemindLaterButton) {
						this.#events.onClickOnRemindLaterButton(btn);
					}
				}
			});
			return button.render();
		}
		#preloadMainLottieAnimation() {
			ui_lottie.Lottie.loadAnimation({
				path: this.#getMainAnimationPath(),
				renderer: 'svg'
			});
		}
		#getMainAnimationPath() {
			return main_core.Loc.getMessage('LANGUAGE_ID') === 'ru' ? '/bitrix/js/crm/ai/whatsnew/recognition-promo/lottie/animation-ru.json' : '/bitrix/js/crm/ai/whatsnew/recognition-promo/lottie/animation-en.json';
		}
	}

	exports.RecognitionPromo = RecognitionPromo;

})(this.BX.Crm.AI.Whatsnew = this.BX.Crm.AI.Whatsnew || {}, BX.Crm.AI, BX, BX.Main, BX.UI, BX.UI.IconSet, BX, BX, BX.UI);
//# sourceMappingURL=recognition-promo.bundle.js.map
