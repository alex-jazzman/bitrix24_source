/* eslint-disable */
this.BX = this.BX || {};
this.BX.Landing = this.BX.Landing || {};
this.BX.Landing.UI = this.BX.Landing.UI || {};
(function (exports, main_core, main_popup, landing_pageobject, landing_ui_field_textfield) {
	'use strict';

	const instances = Symbol('instances');

	/**
	 * @memberOf BX.Landing.UI.Field
	 */
	class VariablesField extends landing_ui_field_textfield.TextField {
		static [instances] = [];
		constructor(options) {
			super({
				...options,
				textOnly: true
			});
			this.setEventNamespace('BX.Landing.UI.Field.VariablesField');
			this.onTopDocumentClick = this.onTopDocumentClick.bind(this);
			main_core.Event.bind(window.top.document, 'click', this.onTopDocumentClick);
			main_core.Dom.append(this.getLayout(), this.layout);
			VariablesField[instances].push(this);
		}
		onTopDocumentClick() {
			// const rootWindowDocument = PageObject.getRootWindow().document;
			// if (rootWindowDocument !== this.input.ownerDocument)
			// {
			// 	this.getMenu().close();
			// 	super.onDocumentClick();
			// }
		}
		onInputClick(event) {
			// event.preventDefault();

			this.lastRange = this.input.ownerDocument.createRange(this.input.innerText.length, this.input.innerText.length);
			this.lastRange = this.input.ownerDocument.getSelection().getRangeAt(0);
		}
		getLayout() {
			return this.cache.remember('layout', () => {
				return main_core.Tag.render`
				<div class="landing-ui-field landing-ui-field-variables">
					<div class="landing-ui-field-variables-left">${this.input}</div>
					<div class="landing-ui-field-variables-right">${this.getButton()}</div>
				</div>
			`;
			});
		}
		getButton() {
			return this.cache.remember('button', () => {
				return main_core.Tag.render`
				<div 
					class="landing-ui-field-variables-button" 
					onclick="${this.onButtonClick.bind(this)}"
				></div>
			`;
			});
		}
		getMenu() {
			return this.cache.remember('menu', () => {
				const rootWindow = landing_pageobject.PageObject.getRootWindow();
				const menu = new rootWindow.BX.Main.Menu({
					bindElement: this.getButton(),
					targetContainer: this.getLayout(),
					autoHide: true,
					maxHeight: 250,
					items: this.options.variables.map(variable => {
						if (variable.delimiter) {
							return {
								delimiter: true
							};
						}
						return {
							text: variable.name,
							onclick: () => {
								this.onVariableClick(variable);
								menu.close();
							}
						};
					}),
					events: {
						onPopupShow: () => {
							VariablesField[instances].forEach(item => {
								if (item !== this) {
									item.getMenu().close();
								}
							});
							setTimeout(() => {
								main_core.Dom.style(menu.getMenuContainer(), {
									left: 'auto',
									right: '0px',
									top: '30px'
								});
							});
						}
					}
				});
				return menu;
			});
		}
		onInputInput() {
			const currentDocument = this.getLayout().ownerDocument;
			this.lastRange = currentDocument.getSelection().getRangeAt(0);
			super.onInputInput();
		}
		onVariableClick(variable) {
			this.enableEdit();
			this.input.focus();
			const currentDocument = this.getLayout().ownerDocument;
			if (this.lastRange) {
				currentDocument.getSelection().removeAllRanges();
				currentDocument.getSelection().addRange(this.lastRange);
			}
			currentDocument.execCommand('insertText', null, ` ${variable.value} `);
		}
		onButtonClick(event) {
			event.preventDefault();
			event.stopPropagation();
			if (!this.lastRange && this.input.innerText.length > 0) {
				const currentDocument = this.input.ownerDocument;
				currentDocument.getSelection().collapse(this.input.childNodes[0], this.input.innerText.length);
				this.lastRange = currentDocument.getSelection().getRangeAt(0);
			}
			const menu = this.getMenu();
			if (menu.getPopupWindow().isShown()) {
				this.getMenu().close();
			} else {
				this.getMenu().show();
			}
		}
		getValue() {
			return this.input.innerText;
		}
	}

	exports.VariablesField = VariablesField;

})(this.BX.Landing.UI.Field = this.BX.Landing.UI.Field || {}, BX, BX.Main, BX.Landing, BX.Landing.UI.Field);
//# sourceMappingURL=variablesfield.bundle.js.map
