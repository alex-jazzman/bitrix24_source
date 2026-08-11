/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_buttons, ui_notification, ai_engine) {
	'use strict';

	class CopilotAgreement {
		#events;
		#wasAccepted = false;
		#engine;
		#popup;
		constructor(options) {
			this.#validateOptions(options);
			this.#events = options.events || {};
			this.#engine = new ai_engine.Engine();
			this.#engine.setContextId(options.contextId);
			this.#engine.setModuleId(options.moduleId);
		}
		static #checkAgreementResult = null;
		static getFullAgreementLink() {
			const zone = main_core.Extension.getSettings('ai.copilot-agreement').zone;
			const linksByZone = {
				ru: 'https://www.bitrix24.ru/about/terms-of-use-ai.php',
				kz: 'https://www.bitrix24.kz/about/terms-of-use-ai.php',
				by: 'https://www.bitrix24.by/about/terms-of-use-ai.php',
				en: 'https://www.bitrix24.com/terms/bitrix24copilot-rules.php'
			};
			return linksByZone[zone] || linksByZone.en;
		}
		#getCopilotName() {
			return main_core.Extension.getSettings('ai.copilot-agreement').copilotName;
		}
		async checkAgreement() {
			if (CopilotAgreement.#checkAgreementResult !== null && CopilotAgreement.#checkAgreementResult !== undefined) {
				if (CopilotAgreement.#checkAgreementResult === false) {
					this.#showAgreementPopup();
				}
				return Promise.resolve(CopilotAgreement.#checkAgreementResult);
			}
			try {
				const result = await this.#engine.checkAgreement();
				if (result.data.isAccepted === false) {
					this.#showAgreementPopup();
				}
				CopilotAgreement.#checkAgreementResult = result.data.isAccepted;
				return result.data.isAccepted;
			} catch (e) {
				console.error(e);
				return true;
			}
		}
		#showAgreementPopup() {
			if (!this.#popup) {
				this.#initAgreementPopup();
			}
			this.#popup.show();
		}
		#hideAgreementPopup() {
			this.#popup?.close();
			this.#popup = null;
		}
		#initAgreementPopup() {
			this.#popup = new main_popup.Popup({
				content: this.#renderPopupContent(),
				cacheable: false,
				overlay: true,
				disableScroll: true,
				width: 492,
				minHeight: 448,
				closeByEsc: true,
				autoHide: true,
				closeIcon: true,
				closeIconSize: main_popup.CloseIconSize.LARGE,
				padding: 20,
				borderRadius: '10px',
				events: {
					onDestroy: () => {
						if (this.#events?.onAgreementPopupHide) {
							this.#events?.onAgreementPopupHide();
						}
						if (this.#wasAccepted === false && this.#events?.onCancel) {
							this.#events?.onCancel();
						}
						this.#popup = null;
					},
					onPopupShow: () => {
						if (this.#events?.onAgreementPopupShow) {
							this.#events?.onAgreementPopupShow();
						}
					}
				}
			});
		}
		#renderPopupContent() {
			return main_core.Tag.render`
			<div
				class="ai__copilot-agreement-popup-content"
			>
				<header class="ai__copilot-agreement-popup-content_header">
					<h3 class="ai__copilot-agreement-popup-content_title">
						${main_core.Loc.getMessage('COPILOT_AGREEMENT_POPUP_TITLE_MSGVER_1', {
			'#COPILOT_NAME#': this.#getCopilotName()
		})}
					</h3>
				</header>
				<main class="ai__copilot-agreement-popup-content_main">
					<div class="ai__copilot-agreement-popup-content_img"></div>
					<p class="ai__copilot-agreement-popup-content_text">
						${main_core.Loc.getMessage('COPILOT_AGREEMENT_POPUP_PARAGRAPH_1_MSGVER_1', {
			'#COPILOT_NAME#': this.#getCopilotName()
		})}
					</p>
					<p class="ai__copilot-agreement-popup-content_text">
						${main_core.Loc.getMessage('COPILOT_AGREEMENT_POPUP_PARAGRAPH_2_MSGVER_1', {
			'#COPILOT_NAME#': this.#getCopilotName(),
			'#LINK#': `<a target="_blank" href="${CopilotAgreement.getFullAgreementLink()}">`,
			'#/LINK#': '</a>'
		})}
					</p>
				</main>
				<footer class="ai__copilot-agreement-popup-content_footer">
					<div class="ai__copilot-agreement-popup_footer-content-buttons">
						${this.#renderApplyButton()}
						${this.#renderCancelButton()}
					</div>
				</footer>
			</div>
		`;
		}
		#renderApplyButton() {
			const applyBtn = new ui_buttons.Button({
				text: main_core.Loc.getMessage('COPILOT_AGREEMENT_POPUP_APPLY_BTN'),
				color: ui_buttons.Button.Color.SUCCESS,
				round: true,
				onclick: this.#handleClickOnAcceptBtn.bind(this)
			});
			return applyBtn.render();
		}
		#renderCancelButton() {
			const cancelBtn = new ui_buttons.Button({
				text: main_core.Loc.getMessage('COPILOT_AGREEMENT_POPUP_CANCEL_BTN'),
				round: true,
				color: ui_buttons.Button.Color.LIGHT,
				onclick: () => {
					this.#popup.destroy();
				}
			});
			return cancelBtn.render();
		}
		async #handleClickOnAcceptBtn(button) {
			try {
				button.setState(ui_buttons.Button.State.WAITING);
				CopilotAgreement.#checkAgreementResult = await this.#acceptAgreement();
				this.#wasAccepted = CopilotAgreement.#checkAgreementResult;
				if (this.#events?.onAccept) {
					this.#events.onAccept();
				}
				this.#hideAgreementPopup();
			} catch (err) {
				if (this.#events?.onAcceptError) {
					this.#events?.onAcceptError();
				}
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('COPILOT_AGREEMENT_POPUP_APPLY_ERROR')
				});
				console.error(err);
			} finally {
				button.setState(null);
			}
		}
		async #acceptAgreement() {
			const result = await this.#engine.acceptAgreement();
			return result.data.isAccepted;
		}
		#validateOptions(options) {
			if (!options.moduleId || main_core.Type.isStringFilled(options.moduleId) === false) {
				throw new Error('AI: CopilotAgreement: moduleId option is required and must be the string');
			}
			if (!options.contextId || main_core.Type.isStringFilled(options.contextId) === false) {
				throw new Error('AI: CopilotAgreement: moduleId option is required and must be the string');
			}
			if (options.events && main_core.Type.isObject(options.events) === false) {
				throw new Error('AI: CopilotAgreement: events option must be the object');
			}
		}
	}

	exports.CopilotAgreement = CopilotAgreement;

})(this.BX.AI = this.BX.AI || {}, BX, BX.Main, BX.UI, BX.UI.Notification, BX.AI);
//# sourceMappingURL=copilot-agreement.bundle.js.map
