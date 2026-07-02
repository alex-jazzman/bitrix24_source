/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, ui_designTokens, main_core_events, main_popup) {
	'use strict';

	const ColorSelectorEvents = {
		EVENT_COLORSELECTOR_VALUE_CHANGE: 'crm.field.colorselector:change'
	};
	class ColorSelector {
		#target = null;
		#colorList = [];
		#selectedColorId = 'default';
		#readOnlyMode = false;
		#popup = null;
		#icon = null;
		#container = null;
		constructor(params) {
			this.#target = main_core.Type.isDomNode(params.target) ? params.target : null;
			this.#colorList = main_core.Type.isArrayFilled(params.colorList) ? params.colorList : [];
			this.#selectedColorId = main_core.Type.isStringFilled(params.selectedColorId) ? params.selectedColorId : [];
			this.#readOnlyMode = params.readOnlyMode === true;
			this.togglePopup = this.togglePopup.bind(this);
			this.#create();
		}

		// region DOM management
		#create() {
			if (!this.#target) {
				return;
			}
			this.#icon = main_core.Tag.render`
			<div 
				class="crm-field-color-selector ${this.#readOnlyMode ? '--readonly' : ''}"
			></div>
		`;
			main_core.Dom.append(this.#icon, this.#target);
			const background = this.#getColorById(this.#selectedColorId).color;
			main_core.Dom.style(this.#icon, {
				'--crm-field-color-selector-color': background
			});
			main_core.Event.bind(this.#icon, 'click', event => {
				event.preventDefault();
				this.togglePopup();
			});
		}
		#getColorById(id) {
			return this.#colorList.find(item => item.id === id);
		}
		togglePopup() {
			if (this.#readOnlyMode) {
				return;
			}
			const popup = this.#getPopup();
			if (popup.isShown()) {
				popup.close();
			} else {
				popup.show();
			}
		}
		#getPopup() {
			if (!this.#popup) {
				this.#popup = new main_popup.Popup({
					id: `crm-todo-color-selector-popup-${main_core.Text.getRandom()}`,
					autoHide: true,
					bindElement: this.#target,
					content: this.#getContent(),
					closeByEsc: true,
					closeIcon: false,
					draggable: false,
					width: 188,
					padding: 0,
					angle: true,
					offsetLeft: 6,
					offsetTop: 14
				});
			}
			return this.#popup;
		}
		#getContent() {
			this.#container = main_core.Tag.render`<div class="crm-field-color-selector-menu-container"></div>`;
			this.#colorList.forEach(item => {
				const id = main_core.Text.encode(`crm-field-color-selector-menu-item-${item.id}`);
				const element = main_core.Tag.render`
				<span 
					id="${id}"
					class="crm-field-color-selector-menu-item ${item.id === this.#selectedColorId ? '--selected' : ''}"
					onclick="${this.onSelectColor.bind(this, item.id)}"
				>
				</span>
			`;
				main_core.Dom.append(element, this.#container);
				main_core.Dom.style(element, {
					'--crm-field-color-selector-color': item.color
				});
			});
			return main_core.Tag.render`
			<div class="crm-field-color-selector-popup">
				${this.#container}
			</div>
		`;
		}
		onSelectColor(id) {
			this.#getPopup().close();
			this.setValue(id);
			main_core_events.EventEmitter.emit(this, ColorSelectorEvents.EVENT_COLORSELECTOR_VALUE_CHANGE, {
				value: id
			});
		}
		setValue(id) {
			this.#selectedColorId = id;
			const backgroundColor = this.#getColorById(this.#selectedColorId).color;
			main_core.Dom.style(this.#icon, {
				backgroundColor
			});
			if (!this.#container) {
				return;
			}
			main_core.Dom.removeClass(this.#container.querySelector('.--selected'), '--selected');
			const target = this.#container.querySelector(`#crm-field-color-selector-menu-item-${id}`);
			if (target) {
				main_core.Dom.addClass(target, '--selected');
			}
		}
		onKeyUpHandler(event) {
			if (event.keyCode === 13) {
				this.#popup?.close();
			}
		}
	}

	exports.ColorSelector = ColorSelector;
	exports.ColorSelectorEvents = ColorSelectorEvents;

})(this.BX.Crm.Field = this.BX.Crm.Field || {}, BX, BX, BX.Event, BX.Main);
//# sourceMappingURL=color-selector.bundle.js.map
