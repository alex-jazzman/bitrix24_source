/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_popup, ui_iconSet_api_core) {
	'use strict';

	const CopilotBannerEvents = Object.freeze({
		actionStart: 'action-start',
		actionFinishSuccess: 'action-finish-success',
		actionFinishFailed: 'action-finish-failed'
	});
	class CopilotBanner extends main_core_events.EventEmitter {
		#popup = null;
		#isWestZone;
		#buttonClickHandler;
		constructor(options) {
			super(options);
			const settings = main_core.Extension.getSettings('ai.copilot-banner');
			this.#isWestZone = settings.get('isWestZone');
			this.#buttonClickHandler = options.buttonClickHandler ?? (() => {});
			this.setEventNamespace('AI:CopilotBanner');
		}
		show() {
			this.#getPopup().show();
		}
		hide() {
			this.#getPopup().close();
		}
		#getPopup() {
			if (!this.#popup) {
				return this.#createPopup();
			}
			return this.#popup;
		}
		#createPopup() {
			this.#popup = new main_popup.Popup({
				maxWidth: 854,
				minWidth: 700,
				minHeight: 520,
				content: this.#renderPopupContent(),
				padding: 0,
				borderRadius: '18px',
				overlay: {
					backgroundColor: '#000',
					opacity: 70
				},
				animation: 'fading',
				disableScroll: false,
				className: 'ai__copilot-banner_popup'
			});
			return this.#popup;
		}
		#renderPopupContent() {
			return main_core.Tag.render`
			<div class="ai__copilot-banner_content">
				${this.#renderCopilotBannerIcon()}
				<div class="ai__copilot-banner_content-inner">
					<div class="ai__copilot-banner_starlight"></div>
					${this.#renderPlatesByZone()}
					<div class="ai__copilot-banner_main">
						<p class="ai__copilot-banner_text">${this.#getTextWithAccents('AI_COPILOT_BANNER_TEXT_1_MSGVER_1')}</p>
						<p class="ai__copilot-banner_text">${this.#getTextWithAccents('AI_COPILOT_BANNER_TEXT_2')}</p>
						<p class="ai__copilot-banner_text">${this.#getTextWithAccents('AI_COPILOT_BANNER_TEXT_3_MSGVER_1')}</p>
					</div>
					<footer class="ai__copilot-banner_footer">
					<div class="ai__copilot-banner_footer-text">
						${this.#renderTitle()}
					</div>
					${this.#renderButton()}
				</footer>
				</div>
			</div>
		`;
		}
		#renderPlatesByZone() {
			if (this.#isWestZone) {
				return main_core.Tag.render`
				<div class="ai__copilot-banner_plates">
					<div class="ai__copilot-banner_plate --google"></div>
					<div class="ai__copilot-banner_plate --open-ai"></div>
					<div class="ai__copilot-banner_plate --market"></div>
					<div class="ai__copilot-banner_plate --meta"></div>
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="ai__copilot-banner_plates">
				<div class="ai__copilot-banner_plate --ygpt"></div>
				<div class="ai__copilot-banner_plate --its"></div>
				<div class="ai__copilot-banner_plate --market"></div>
				<div class="ai__copilot-banner_plate --giga-chat"></div>
			</div>
		`;
		}
		#renderCopilotBannerIcon() {
			const icon = new ui_iconSet_api_core.Icon({
				size: 88,
				color: '#fff',
				icon: ui_iconSet_api_core.Main.COPILOT_AI
			});
			return main_core.Tag.render`
			<div class="ai__copilot-banner_icon-wrapper">
				<div class="ai__copilot-banner_icon-bg"></div>
				${icon.render()}
			</div>
		`;
		}
		#getTextWithAccents(phraseCode) {
			return main_core.Loc.getMessage(phraseCode, {
				'#COPILOT_NAME#': this.#getCopilotName(),
				'#accent#': '<span class="--accent">',
				'#/accent#': '</span>'
			});
		}
		#renderTitle() {
			const titleText = main_core.Loc.getMessage('AI_COPILOT_BANNER_TITLE_MSGVER_1', {
				'#COPILOT_NAME#': this.#getCopilotName(),
				'#hint-start#': '<span class="ai__copilot-banner_title-hint">',
				'#hint-end#': '</span>'
			});
			const title = main_core.Tag.render`
			<h4 class="ai__copilot-banner_title">
				${titleText}
			</h4>
		`;
			const titlePartWithHint = title.querySelector('.ai__copilot-banner_title-hint');
			const hintContent = `<div>${main_core.Loc.getMessage('AI_COPILOT_BANNER_TITLE_HINT_MSGVER_1', {
			'#COPILOT_NAME#': this.#getCopilotName()
		})}</div>`;
			const hint = BX.UI.Hint.createInstance({
				popupParameters: {
					className: 'ai__copilot-banner-hint-popup',
					borderRadius: '3px'
				}
			});
			main_core.bind(titlePartWithHint, 'mouseenter', () => {
				hint.show(titlePartWithHint, hintContent, true);
			});
			main_core.bind(titlePartWithHint, 'mouseleave', () => {
				hint.hide(titlePartWithHint);
			});
			return title;
		}
		#renderButton() {
			const btn = main_core.Tag.render`
			<button class="ai__copilot-banner_btn">
				${main_core.Loc.getMessage('AI_COPILOT_START_USING_BUTTON')}
			</button>
		`;
			main_core.bind(btn, 'click', this.#handleButtonClick.bind(this));
			return btn;
		}
		#getCopilotName() {
			return main_core.Extension.getSettings('ai.copilot-banner').get('copilotName');
		}
		async #handleButtonClick() {
			this.emit(CopilotBannerEvents.actionStart);
			try {
				await this.#buttonClickHandler();
				this.emit(CopilotBannerEvents.actionFinishSuccess);
			} catch (e) {
				console.error(e);
				this.emit(CopilotBannerEvents.actionFinishFailed);
			} finally {
				this.hide();
			}
		}
	}

	const AppsInstallerBannerEvents = Object.freeze({
		...CopilotBannerEvents
	});
	class AppsInstallerBanner extends main_core_events.EventEmitter {
		#copilotBanner;
		#copilotBannerOptions;
		constructor(options) {
			super();
			this.setEventNamespace('AI:AppsInstallerBanner');
			this.#copilotBannerOptions = options.copilotBannerOptions ?? {};
			this.#copilotBanner = new CopilotBanner({
				...this.#copilotBannerOptions,
				buttonClickHandler: this.#installApp.bind(this)
			});
			this.#copilotBanner.subscribe(CopilotBannerEvents.actionStart, () => {
				this.emit(AppsInstallerBannerEvents.actionStart);
			});
			this.#copilotBanner.subscribe(CopilotBannerEvents.actionFinishSuccess, () => {
				this.emit(AppsInstallerBannerEvents.actionFinishSuccess);
			});
			this.#copilotBanner.subscribe(CopilotBannerEvents.actionFinishFailed, () => {
				this.emit(AppsInstallerBannerEvents.actionFinishFailed);
			});
		}
		show() {
			this.#copilotBanner.show();
		}
		hide() {
			this.#copilotBanner.hide();
		}
		async #installApp() {
			// eslint-disable-next-line no-useless-return
			return;
		}
	}

	exports.AppsInstallerBanner = AppsInstallerBanner;
	exports.AppsInstallerBannerEvents = AppsInstallerBannerEvents;
	exports.CopilotBanner = CopilotBanner;
	exports.CopilotBannerEvents = CopilotBannerEvents;

})(this.BX.AI = this.BX.AI || {}, BX, BX.Event, BX.Main, BX.UI.IconSet);
//# sourceMappingURL=copilot-banner.bundle.js.map
