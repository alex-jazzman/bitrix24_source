/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_iconSet_api_core, ui_entitySelector) {
	'use strict';

	const settingEntityId = 'setting';
	class SettingSelector {
		#container = null;
		#settingButtonTextNode = null;
		#settingButton = null;
		#hiddenInput = null;
		#inputName;
		#settingsMap = new Map();
		#selectedOptionKey;
		#dialogOptions;
		#disabled = false;

		// At least one item from the list must be selected.
		#forbidOptionDeselect = true;
		constructor(options) {
			const {
				settingsMap = {},
				selectedOptionKey,
				inputName,
				dialogOptions = {},
				disabled = false
			} = options;
			Object.entries(settingsMap).forEach(([key, value]) => {
				this.#settingsMap.set(key, value);
			});
			this.#dialogOptions = dialogOptions;
			this.#inputName = inputName;
			this.#selectedOptionKey = selectedOptionKey;
			this.#disabled = disabled;
			this.#container = this.#renderContainer();
			this.#createSelector();
		}
		getSelected() {
			return this.#selectedOptionKey;
		}
		#createSelector() {
			const items = [];
			this.#settingsMap.forEach((value, key) => {
				items.push({
					id: key,
					title: value,
					entityId: settingEntityId,
					selected: key === this.getSelected(),
					tabs: 'recents'
				});
			});
			this.settingDialog = new ui_entitySelector.Dialog({
				items,
				targetNode: this.#settingButton,
				width: 170,
				height: 37 * items.length + 15,
				multiple: false,
				enableSearch: false,
				dropdownMode: true,
				showAvatars: false,
				compactView: true,
				events: {
					'Item:onBeforeDeselect': event => {
						if (this.#forbidOptionDeselect) {
							event.preventDefault();
						}
					},
					'Item:onBeforeSelect': () => {
						this.#forbidOptionDeselect = false;
					},
					'Item:onSelect': event => {
						const {
							item: selectedItem
						} = event.getData();
						this.select(selectedItem.getId());
					},
					'Item:onDeselect': () => {
						this.#forbidOptionDeselect = true;
					}
				},
				...this.#dialogOptions
			});
			main_core.Event.bind(this.#settingButton, 'click', () => {
				if (!this.#disabled) {
					this.settingDialog.show();
				}
			});
		}
		select(key) {
			this.#selectedOptionKey = key;
			this.#settingButtonTextNode.textContent = this.#settingsMap.get(this.getSelected());
			if (this.#hiddenInput) {
				this.#hiddenInput.setAttribute('value', key);
			}
		}
		#renderContainer() {
			const icon = new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Actions.CHEVRON_DOWN,
				color: getComputedStyle(document.body).getPropertyValue('--ui-color-base-80'),
				size: 16
			});
			this.icon = icon.render();
			let selectedOptionText = this.#settingsMap.get(this.#selectedOptionKey);
			if (selectedOptionText === undefined) {
				selectedOptionText = '';
			}
			this.#settingButtonTextNode = main_core.Tag.render`<div class="setting-selector-button-text"></div>`;
			this.#settingButtonTextNode.setAttribute('title', selectedOptionText);
			this.#settingButtonTextNode.textContent = selectedOptionText;
			this.#settingButton = main_core.Tag.render`
			<div class="setting-selector-button ${this.#disabled ? 'setting-selector-button--disabled' : ''}">
				${this.#settingButtonTextNode}
				${this.icon}
			</div>
		`;
			if (this.#inputName === undefined) {
				this.#hiddenInput = main_core.Tag.render``;
			} else {
				this.#hiddenInput = main_core.Tag.render`<input type="hidden">`;
				this.#hiddenInput.setAttribute('name', this.#inputName);
				this.#hiddenInput.setAttribute('value', this.#selectedOptionKey);
			}
			return main_core.Tag.render`
			 <div class="setting-selector-container">
			${this.#settingButton}
			${this.#hiddenInput}
			 </div>
		`;
		}
		renderTo(targetContainer) {
			if (main_core.Type.isDomNode(targetContainer)) {
				main_core.Dom.append(this.#container, targetContainer);
			}
		}
	}

	exports.SettingSelector = SettingSelector;

})(this.BX.Mail = this.BX.Mail || {}, BX, BX.UI.IconSet, BX.UI.EntitySelector);
//# sourceMappingURL=setting-selector.bundle.js.map
