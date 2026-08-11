/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ai_engine, main_popup, ui_buttons) {
	'use strict';

	class AgreementPopup {
		#popup;
		#title;
		#content;
		#onApply;
		constructor(props) {
			this.#content = props.content || '';
			this.#title = props.title || '';
			this.#onApply = props.onApply;
		}
		show() {
			if (!this.#popup) {
				this.#popup = this.#createPopup();
				this.#popup.show();
			}
			this.#popup.show();
		}
		hide() {
			if (this.#popup) {
				this.#popup.close();
			}
		}
		#createPopup() {
			const maxHeight = window.innerHeight - 60;
			return new main_popup.Popup({
				closeIcon: true,
				maxWidth: 800,
				maxHeight,
				disableScroll: true,
				titleBar: this.#title,
				content: this.#renderPopupContent(),
				overlay: true,
				cacheable: false,
				className: 'ai__copilot-agreement_popup',
				contentColor: getComputedStyle(document.body).getPropertyValue('--ui-color-base-02'),
				buttons: [new ui_buttons.Button({
					text: main_core.Loc.getMessage('AI_AGREEMENT_ACCEPT'),
					color: ui_buttons.Button.Color.SUCCESS,
					onclick: button => {
						if (main_core.Type.isFunction(this.#onApply)) {
							button.setState(ui_buttons.Button.State.CLOCKING);
							if (main_core.Type.isFunction(this.#onApply)) {
								this.#onApply().then(() => {
									this.hide();
									button.setState(null);
								}).catch(err => {
									console.error(err);
									button.setState(null);
								});
							}
						}
					}
				})]
			});
		}
		#renderPopupContent() {
			return main_core.Tag.render`
			<div class="ai__picker_agreement">
				${this.#content}
			</div>
		`;
		}
	}

	class Agreement {
		#engine;
		#agreement;
		#type;
		#engineCode;
		constructor(options) {
			this.#agreement = options.agreement;
			this.#engine = options.engine;
			this.#type = options.type;
			this.#engineCode = options.engineCode;
		}
		showAgreementPopup(onApply) {
			const agreement = this.#agreement;
			const popup = new AgreementPopup({
				title: agreement.title,
				content: agreement.text,
				onApply: () => {
					return new Promise((resolve, reject) => {
						this.#acceptAgreement().then(() => {
							agreement.accepted = true;
							onApply();
							resolve();
						}).catch(() => {
							BX.UI.Notification.Center.notify({
								content: main_core.Loc.getMessage('AI_COPILOT_AGREE_WITH_TERMS_SERVER_ERROR')
							});
							reject();
						});
					});
				}
			});
			popup.show();
		}
		#acceptAgreement() {
			if (this.#type === 'text') {
				return this.#engine.acceptTextAgreement(this.#engineCode);
			}
			if (this.#type === 'image') {
				return this.#engine.acceptImageAgreement(this.#engineCode);
			}
			throw new Error('AI: Agreement: acceptAgreement: Type can be "text" or "image"');
		}
	}

	exports.Agreement = Agreement;

})(this.BX.AI = this.BX.AI || {}, BX, BX.AI, BX.Main, BX.UI);
//# sourceMappingURL=agreement.bundle.js.map
