/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_entitySelector) {
	'use strict';

	const InlinePlaceholderSelectorMode = {
		INPUT: 'input',
		TEXTAREA: 'textarea'
	};
	class InlinePlaceholderSelector {
		#mode;
		#value;
		#target;
		#multiple;
		#menuButton;
		#dialog;
		#inputElement;
		#entityTypeIds;
		#onBeforeMenuOpen;
		#isReadOnly;
		constructor(params) {
			if (!main_core.Type.isDomNode(params.target)) {
				throw new Error('Target DOM node not found');
			}
			let entityTypeIds = main_core.Type.isArrayFilled(params.entityTypeIds) ? params.entityTypeIds : [];
			entityTypeIds = entityTypeIds.filter(entityTypeId => BX.CrmEntityType.isDefined(entityTypeId));
			this.#target = params.target;
			this.#entityTypeIds = entityTypeIds;
			this.#mode = params.mode ?? InlinePlaceholderSelectorMode.INPUT;
			this.#value = params.value ?? '';
			this.#multiple = params.multiple ?? false;
			this.#onBeforeMenuOpen = main_core.Type.isFunction(params.onBeforeMenuOpen) ? params.onBeforeMenuOpen : null;
			this.#isReadOnly = params.isReadOnly ?? false;
		}
		setEntityTypeIds(entityTypeIds) {
			this.#entityTypeIds = entityTypeIds;
		}
		show() {
			main_core.Dom.append(this.#render(), this.#target);
		}
		getValue() {
			return this.#inputElement.value ?? '';
		}
		getInputElement() {
			return this.#inputElement;
		}
		#getDialog() {
			if (main_core.Type.isNull(this.#onBeforeMenuOpen) && this.#dialog) {
				return this.#dialog;
			}
			const entity = this.#multiple ? {
				id: 'multiple_placeholder',
				dynamicLoad: true,
				dynamicSearch: false,
				searchable: true,
				options: {
					entityTypeIds: this.#entityTypeIds
				}
			} : {
				id: 'placeholder',
				dynamicLoad: true,
				dynamicSearch: false,
				searchable: true,
				options: {
					entityTypeId: this.#entityTypeIds[0]
				}
			};
			this.#dialog = new ui_entitySelector.Dialog({
				targetNode: this.#menuButton,
				multiple: false,
				showAvatars: false,
				dropdownMode: true,
				compactView: true,
				enableSearch: true,
				entities: [entity],
				events: {
					'Item:onSelect': event => {
						const {
							item: selectedItem
						} = event.getData();
						this.#onSelect(selectedItem);
					}
				}
			});
			return this.#dialog;
		}
		#render() {
			this.#menuButton = this.#isReadOnly ? null : main_core.Tag.render`
				<span 
					onclick="${this.#openMenu.bind(this)}"
					class="crm-inline-placeholder-selector-dotted"
				></span>
			`;
			return main_core.Tag.render`
			<div class="crm-inline-placeholder-selector">
				${this.#renderFormElement()}
				${this.#menuButton}
			</div>
		`;
		}
		#renderFormElement() {
			if (this.#mode === InlinePlaceholderSelectorMode.TEXTAREA) {
				this.#inputElement = main_core.Tag.render`<textarea class="ui-ctl-element" name="subject"></textarea>`;
				this.#inputElement.value = this.#value;
				return main_core.Tag.render`
				<div class="ui-ctl ui-ctl-textarea ui-ctl-no-resize ui-ctl-w100">
					${this.#inputElement}
				</div>
			`;
			}
			this.#inputElement = main_core.Tag.render`<input type="text" class="ui-ctl-element" name="subject">`;
			this.#inputElement.value = this.#value;
			this.#inputElement.disabled = this.#isReadOnly;
			return main_core.Tag.render`
			<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
				${this.#inputElement}
			</div>
		`;
		}
		async #openMenu() {
			if (this.#onBeforeMenuOpen) {
				await this.#onBeforeMenuOpen();
			}
			this.#getDialog().show();
		}
		#onSelect(selectedItem) {
			const placeholder = `{${selectedItem.customData.get('text')}}`;
			const cursorPosition = this.#inputElement.selectionStart;
			const currentValue = this.#inputElement.value;
			const mustAddSpace = this.#isSpaceRequired(currentValue, cursorPosition);
			this.#inputElement.value = currentValue.slice(0, cursorPosition) + (mustAddSpace ? ' ' : '') + placeholder + currentValue.slice(cursorPosition);
			this.#inputElement.dispatchEvent(new Event('input'));
			const newCursorPosition = cursorPosition + placeholder.length + (mustAddSpace ? 1 : 0);
			this.#inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
			this.#inputElement.focus();
			this.#getDialog().deselectAll();
		}
		#isSpaceRequired(value, position) {
			if (position === 0) {
				return false;
			}
			return value[position - 1] !== ' ' && value[position - 1] !== '\n';
		}
	}

	exports.InlinePlaceholderSelector = InlinePlaceholderSelector;
	exports.InlinePlaceholderSelectorMode = InlinePlaceholderSelectorMode;

})(this.BX.Crm.Field = this.BX.Crm.Field || {}, BX, BX.UI.EntitySelector);
//# sourceMappingURL=inline-placeholder-selector.bundle.js.map
