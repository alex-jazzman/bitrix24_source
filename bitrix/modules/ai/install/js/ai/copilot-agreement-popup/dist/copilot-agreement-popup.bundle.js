/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_buttons, ui_notification) {
	'use strict';

	class CopilotAgreementPopup {
		#onApply;
		#onCancel;
		#wasApplied = false;
		#popup;
		constructor(options) {
			if (options?.onApply) {
				this.setOnApply(options.onApply);
			}
			this.#onCancel = main_core.Type.isFunction(options.onCancel) ? options.onCancel : null;
		}
		show() {
			if (!this.#popup) {
				this.#initPopup();
			}
			this.#popup.show();
		}
		hide() {
			this.#popup?.close();
			this.#popup = null;
		}
		setOnApply(onApply) {
			this.#onApply = onApply;
		}
		setOnCancel(onCancel) {
			this.#onCancel = onCancel;
		}
		#initPopup() {
			this.#popup = new main_popup.Popup({
				content: this.#renderPopupContent(),
				cacheable: false,
				overlay: true,
				disableScroll: true,
				width: 492,
				minHeight: 448,
				closeByEsc: true,
				closeIcon: true,
				closeIconSize: main_popup.CloseIconSize.LARGE,
				padding: 20,
				borderRadius: '10px',
				events: {
					onDestroy: () => {
						if (this.#wasApplied === false && this.#onCancel) {
							this.#onCancel();
						}
						this.#popup = null;
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
			'#LINK#': `<a target="_blank" href="${this.#getFullAgreementLink()}">`,
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
				onclick: async button => {
					try {
						button.setState(ui_buttons.Button.State.WAITING);
						await this.#onApply();
						this.hide();
					} catch (err) {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('COPILOT_AGREEMENT_POPUP_APPLY_ERROR')
						});
						console.error(err);
					} finally {
						button.setState(null);
					}
				}
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
		#getFullAgreementLink() {
			const zone = main_core.Extension.getSettings('ai.copilot-agreement-popup').zone;
			const linksByZone = {
				ru: 'https://www.bitrix24.ru/about/terms-of-use-ai.php',
				kz: 'https://www.bitrix24.kz/about/terms-of-use-ai.php',
				by: 'https://www.bitrix24.by/about/terms-of-use-ai.php',
				en: 'https://www.bitrix24.com/terms/bitrix24copilot-rules.php'
			};
			return linksByZone[zone] || linksByZone.en;
		}
		#getCopilotName() {
			return main_core.Extension.getSettings('ai.copilot-agreement-popup').copilotName;
		}
	}

	exports.CopilotAgreementPopup = CopilotAgreementPopup;

})(this.BX.AI = this.BX.AI || {}, BX, BX.Main, BX.UI, BX.UI.Notification);
//# sourceMappingURL=copilot-agreement-popup.bundle.js.map
