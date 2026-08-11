/* eslint-disable */
this.BX = this.BX || {};
this.BX.Intranet = this.BX.Intranet || {};
(function (exports, main_core, main_popup, ui_buttons) {
	'use strict';

	class Form {
		#id;
		#value;
		#userId;
		#content;
		#formNode;
		constructor(options) {
			this.#id = `form-${options.id}`;
			this.#value = options.inputValue;
			this.#userId = options.userId;
		}
		getTitleRender() {
			return new HTMLElement();
		}
		getFieldRender() {
			return new HTMLElement();
		}
		getFormNode() {
			return this.render().querySelector('form#' + this.#id);
		}
		render() {
			if (this.#content) {
				return this.#content;
			}
			this.#content = main_core.Tag.render`
		<div class="intranet-reinvite-popup-wrapper">
			<form method="POST" id="${this.#id}">
				<input type="hidden" name="userId" value="${this.#userId}">
				${this.getTitleRender()}
				${this.getFieldRender()}
			</form>
		</div>`;
			return this.#content;
		}
		getValue() {
			return this.#value;
		}
		getData() {
			return new FormData(this.getFormNode());
		}
	}

	class PhoneForm extends Form {
		getTitleRender() {
			return main_core.Tag.render`<div class="intranet-reinvite-popup-title">
			${main_core.Loc.getMessage('INTRANET_JS_PHONE_POPUP_TITLE', {
			'#CODE#': 'redirect=detail&code=17729332'
		})}
		</div>`;
		}
		getFieldRender() {
			const form = main_core.Tag.render`
			<div class="ui-ctl ui-ctl-textbox ui-ctl-before-icon ui-ctl-after-icon intranet-reinvite-popup-field-row">
				<div class="intranet-reinvite-popup-field-label">
					<label>${main_core.Loc.getMessage('INTRANET_JS_PHONE_FIELD_LABEL')}</label>
				</div>
				<div class="ui-ctl ui-ctl-textbox">
					<div id="intranet_reinvite_phone_flag" class="ui-ctl-before --flag"></div>
					<input id="intranet_reinvite_phone_input" type="text" name="newPhone" value="${this.getValue()}" class="ui-ctl-element">
				</div>
			</div>`;
			new BX.PhoneNumber.Input({
				node: form.querySelector('#intranet_reinvite_phone_input'),
				defaultCountry: 'ru',
				flagNode: form.querySelector('#intranet_reinvite_phone_flag'),
				flagSize: 24,
				onChange: function (e) {}
			});
			return form;
		}
	}

	class EmailForm extends Form {
		#onButtonStateChange;
		constructor(options) {
			super(options);
			this.#onButtonStateChange = main_core.Type.isFunction(options.onButtonStateChange) ? options.onButtonStateChange : null;
		}
		getTitleRender() {
			return main_core.Tag.render`<div class="intranet-reinvite-popup-title">
			${main_core.Loc.getMessage('INTRANET_JS_EMAIL_POPUP_TITLE', {
			'#CODE#': 'redirect=detail&code=17729332'
		})}
			</div>`;
		}
		getFieldRender() {
			const field = main_core.Tag.render`
			<div class="intranet-reinvite-popup-field-row">
				<div class="intranet-reinvite-popup-field-label">
					<label>${main_core.Loc.getMessage('INTRANET_JS_EMAIL_FIELD_LABEL')}</label>
				</div>
				<div class="ui-ctl ui-ctl-textbox">
					<input type="text" name="newEmail" value="${this.getValue()}" class="ui-ctl-element"> 
				</div>
			</div>`;
			const input = field.querySelector('input[name="newEmail"]');
			if (input && this.#onButtonStateChange) {
				main_core.Event.bind(input, 'input', event => {
					const value = event.target.value.trim();
					this.#onButtonStateChange(main_core.Type.isStringFilled(value));
				});
			}
			return field;
		}
	}

	const FormType = {
		EMAIL: 'email',
		PHONE: 'phone'
	};

	class FormFactory {
		constructor() {}
		static create(type, options) {
			switch (type) {
				case FormType.EMAIL:
					return new EmailForm(options);
				case FormType.PHONE:
					return new PhoneForm(options);
				default:
					throw new Error('Unknown ContextType value: ' + type);
			}
		}
	}

	class ReinvitePopup {
		#popup;
		#transport;
		#userId;
		#id;
		#inputValue;
		#bindElement;
		#form;
		#width;
		#sendButton;
		constructor(options) {
			if (options.userId <= 0) {
				throw new Error('Invalide "userId" parameter');
			}
			this.#userId = options.userId;
			this.#id = 'reinvite-popup-' + options.userId;
			this.#bindElement = main_core.Type.isElementNode(options.bindElement) ? options.bindElement : null;
			this.#transport = main_core.Type.isFunction(options.transport) ? options.transport : null;
			this.#width = 348;
			this.#form = FormFactory.create(options.formType, {
				id: this.#id,
				userId: this.#userId,
				inputValue: options.inputValue,
				onButtonStateChange: this.#handleButtonStateChange.bind(this)
			});
		}
		#handleButtonStateChange(isEnabled) {
			if (this.#sendButton) {
				this.#sendButton.setDisabled(!isEnabled);
			}
		}
		show() {
			this.getPopup().show();
		}
		getPopup() {
			if (this.#popup) {
				return this.#popup;
			}
			this.#popup = this.#createPopup();
			return this.#popup;
		}
		#createPopup(options) {
			if (main_popup.PopupManager.isPopupExists(this.#id)) {
				return main_popup.PopupManager.getPopupById(this.#id);
			}
			const popup = new main_popup.Popup(this.#id, this.#bindElement, {
				content: this.#form.render(),
				autoHide: true,
				angle: {
					offset: this.#width / 2 - 16.5
				},
				width: this.#width,
				padding: 18,
				offsetLeft: (this.#bindElement.offsetWidth / 2 - this.#width / 2) / 2 - 10,
				closeIcon: false,
				closeByEsc: true,
				overlay: false,
				className: 'reinvite-popup-container',
				bindOptions: {
					position: 'top'
				},
				animation: "fading-slide",
				buttons: [this.#sendButton = new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_JS_BTN_SEND'),
					color: ui_buttons.Button.Color.PRIMARY,
					round: true,
					noCaps: true,
					onclick: button => {
						this.send();
						this.getPopup().close();
					}
				}), new ui_buttons.Button({
					text: main_core.Loc.getMessage('INTRANET_JS_BTN_CANCEL'),
					color: ui_buttons.Button.Color.LIGHT_BORDER,
					round: true,
					noCaps: true,
					onclick: button => {
						this.getPopup().close();
					}
				})]
			});
			const inputValue = this.#form.getValue()?.trim() || '';
			this.#handleButtonStateChange(inputValue !== '');
			return popup;
		}
		send() {
			this.#transport(this.#form.getData());
		}
	}

	exports.FormType = FormType;
	exports.ReinvitePopup = ReinvitePopup;

})(this.BX.Intranet.Reinvite = this.BX.Intranet.Reinvite || {}, BX, BX.Main, BX.UI);
//# sourceMappingURL=reinvite-popup.bundle.js.map
