/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, ui_entitySelector) {
	'use strict';

	class Footer extends ui_entitySelector.DefaultFooter {
		constructor(dialog, options) {
			super(dialog, options);
			this.label = options.label ? options.label.toString() : '';
			this.url = options.url ? options.url.toString() : '';
			this.itemLink = options.itemLink ? options.itemLink.toString() : '';
		}
		getContent() {
			const link = main_core.Tag.render`
			<span class="ui-selector-footer-link ui-selector-footer-link-add">
				${main_core.Text.encode(this.label)}
			</span>
		`;
			this.#bindEvent(link);
			return link;
		}
		#bindEvent(link) {
			main_core.Event.bind(link, 'click', event => {
				event.preventDefault();
				BX.SidePanel.Instance.open(this.url, {
					width: 1000,
					requestMethod: 'post',
					events: {
						onCloseComplete: event => {
							const slider = event.getSlider();
							const dictionary = slider ? slider.getData() : null;
							let data = null;
							if (dictionary && dictionary.has('data')) {
								const rawData = dictionary.get('data');
								data = {
									id: rawData.storageId || rawData.id || null,
									title: rawData.storageTitle || rawData.title || ''
								};
								if (data) {
									this.#onItemCreated(data);
								}
							}
						}
					}
				});
			});
		}
		#onItemCreated(data) {
			const item = this.getDialog().addItem({
				id: data.id,
				entityId: this.getDialog().getEntities()[0].id,
				title: data.title,
				link: `${this.itemLink}${data.id}`
			});
			item.select();
		}
	}

	class EntitySelector {
		static selectors = null;
		#containerId;
		#config;
		#inputName;
		#property;
		#initialValue;
		#container = null;
		#selector = null;
		#hiddenInputsContainer = null;
		constructor(options) {
			this.#containerId = options.containerId;
			this.#config = options.config || {};
			this.#inputName = options.inputName;
			this.#property = options.property;
			this.#initialValue = options.initialValue || '';
		}
		init() {
			this.#container = document.getElementById(this.#containerId);
			if (!this.#container) {
				return;
			}
			this.#createSelector();
			this.#createHiddenInputsContainer();
			this.#renderHiddenInputs(this.#parseInitialValue(this.#initialValue));
			this.#bindEvents();
		}
		#isMultiple() {
			const multiple = this.#property.Multiple;
			return multiple === true;
		}
		#useObjectResponse() {
			return this.#config.useObjectResponse === true;
		}
		#createSelector() {
			if (this.#config.dialogOptions.footerOptions) {
				this.#config.dialogOptions.footer = Footer;
			}
			this.#config.dialogOptions.id = `entityselector_${this.#inputName}`;
			if (this.#useObjectResponse()) {
				this.#config.dialogOptions.preselectedItems = this.#getPreselectedItems();
			}
			this.#selector = new ui_entitySelector.TagSelector(this.#config);
			this.#selector.renderTo(this.#container);
		}
		#getPreselectedItems() {
			const preselectedItems = [];
			const initialValue = main_core.Type.isArray(this.#initialValue) ? this.#initialValue : [this.#initialValue];
			initialValue.forEach(initialValueItem => {
				if (main_core.Type.isStringFilled(initialValueItem.id) && main_core.Type.isStringFilled(initialValueItem.entityId)) {
					preselectedItems.push([initialValueItem.entityId, initialValueItem.id]);
				}
			});
			return preselectedItems;
		}
		#createHiddenInputsContainer() {
			this.#hiddenInputsContainer = main_core.Tag.render`<div></div>`;
			main_core.Dom.hide(this.#hiddenInputsContainer);
			main_core.Dom.append(this.#hiddenInputsContainer, this.#container);
		}
		#bindEvents() {
			if (!this.#selector?.dialog) {
				return;
			}
			this.#selector.dialog.subscribe('Item:onSelect', event => {
				this.#updateInputValues();
			});
			this.#selector.dialog.subscribe('Item:onDeselect', event => {
				this.#updateInputValues();
			});
		}
		#updateInputValues() {
			if (!this.#selector) {
				return;
			}
			const dialog = this.#selector.getDialog();
			if (!dialog) {
				return;
			}
			const items = dialog.getSelectedItems().map(item => {
				return {
					id: item.getId(),
					entityId: item.getEntityId()
				};
			});
			this.#renderHiddenInputs(items);
		}
		#renderHiddenInputs(items) {
			if (!this.#hiddenInputsContainer) {
				return;
			}
			main_core.Dom.clean(this.#hiddenInputsContainer);
			let index = 0;
			if (items.length === 0) {
				this.#appendInput(null, index);
				return;
			}
			items.forEach(item => this.#appendInput(item, index++));
		}
		#appendInput(item, index) {
			if (!this.#hiddenInputsContainer) {
				return;
			}
			if (this.#useObjectResponse()) {
				if (item === null) {
					const nullInput = main_core.Tag.render`<input type="hidden" name="${this.#inputName}[]" value="">`;
					main_core.Dom.append(nullInput, this.#hiddenInputsContainer);
					return;
				}
				const idInput = main_core.Tag.render`<input type="hidden">`;
				idInput.name = this.#isMultiple() ? `${this.#inputName}[${index}][id]` : `${this.#inputName}[id]`;
				idInput.value = item.id;
				main_core.Dom.append(idInput, this.#hiddenInputsContainer);
				const entityIdInput = main_core.Tag.render`<input type="hidden">`;
				entityIdInput.name = this.#isMultiple() ? `${this.#inputName}[${index}][entityId]` : `${this.#inputName}[entityId]`;
				entityIdInput.value = item.entityId;
				main_core.Dom.append(entityIdInput, this.#hiddenInputsContainer);
				return;
			}
			const input = main_core.Tag.render`<input type="hidden" />`;
			input.name = this.#isMultiple() ? `${this.#inputName}[]` : this.#inputName;
			input.value = item?.id ?? '';
			main_core.Dom.append(input, this.#hiddenInputsContainer);
		}
		#parseInitialValue(value) {
			if (!value) {
				return [];
			}
			if (this.#useObjectResponse()) {
				const values = main_core.Type.isArray(value) ? value : [value];
				return values.map(valueItem => {
					if (main_core.Type.isStringFilled(valueItem.id) && main_core.Type.isStringFilled(valueItem.entityId)) {
						return {
							id: valueItem.id,
							entityId: valueItem.entityId
						};
					}
					return null;
				}).filter(valueItem => valueItem !== null);
			}
			const values = this.#isMultiple() && main_core.Type.isArray(value) ? value : [value];
			return values.map(valueItem => {
				if (main_core.Type.isStringFilled(valueItem.id)) {
					return {
						id: valueItem.id
					};
				}
				return {
					id: valueItem
				};
			});
		}
		static create(options) {
			const instance = new EntitySelector(options);
			instance.init();
			return instance;
		}
		static decorateNode(container, options) {
			if (!container) {
				return null;
			}
			if (!EntitySelector.selectors) {
				EntitySelector.selectors = new WeakMap();
			}
			let selector = EntitySelector.selectors.get(container);
			if (!selector) {
				const config = JSON.parse(container.dataset.config || '{}');
				config.containerId = container.id;
				const configs = main_core.Type.isPlainObject(options) ? options : {};
				config.config = {
					...config.config,
					...configs
				};
				selector = BX.Bizproc.EntitySelector.create(config);
				EntitySelector.selectors.set(container, selector);
			}
			return selector;
		}
		destroy() {
			this.#container = null;
			this.#selector = null;
			this.#hiddenInputsContainer = null;
		}
	}
	BX.Bizproc.EntitySelector = EntitySelector;

	exports.EntitySelector = EntitySelector;

})(this.BX.Bizproc.EntitySelector = this.BX.Bizproc.EntitySelector || {}, BX, BX.UI.EntitySelector);
//# sourceMappingURL=bp-entity-selector.bundle.js.map
