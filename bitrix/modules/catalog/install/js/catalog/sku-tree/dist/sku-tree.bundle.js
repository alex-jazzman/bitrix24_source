/* eslint-disable */
this.BX = this.BX || {};
this.BX.Catalog = this.BX.Catalog || {};
(function (exports, main_core, ui_designTokens, main_core_events, ui_a11y) {
	'use strict';

	class SkuProperty {
		focusZone = null;
		skuSelectHandler = this.handleSkuSelect.bind(this);
		skuKeydownHandler = this.handleSkuKeydown.bind(this);
		constructor(options) {
			this.parent = options.parent || null;
			if (!this.parent) {
				throw new Error('Parent is not defined.');
			}
			this.property = options.property || {};
			this.offers = options.offers || [];
			this.existingValues = options.existingValues || [];
			this.nodeDescriptions = [];
			this.hideUnselected = options.hideUnselected;
		}
		getId() {
			return this.property.ID;
		}
		getSelectedSkuId() {
			return this.parent.getSelectedSkuId();
		}
		hasSkuValues() {
			return this.property.VALUES.length;
		}
		renderPictureSku(propertyValue, uniqueId) {
			const propertyName = main_core.Type.isStringFilled(propertyValue.NAME) ? main_core.Text.encode(propertyValue.NAME) : '';
			let nameNode = '';
			if (main_core.Type.isStringFilled(propertyName)) {
				nameNode = main_core.Tag.render`<span class="ui-ctl-label-text">${propertyName}</span>`;
			}
			let iconNode = '';
			if (propertyValue.PICT && propertyValue.PICT.SRC) {
				const style = "background-image: url('" + propertyValue.PICT.SRC + "');";
				iconNode = main_core.Tag.render`<span class="ui-ctl-label-img" style="${style}"></span>`;
			} else if (nameNode) {
				nameNode.style.paddingLeft = '0';
			} else {
				nameNode = main_core.Tag.render`<span class="ui-ctl-label-text">-</span>`;
			}
			const titleItem = this.parent.isShortView && main_core.Type.isStringFilled(this.property.NAME) ? main_core.Text.encode(this.property.NAME) : propertyName;
			const node = main_core.Tag.render`
			<label 	class="ui-ctl ui-ctl-radio-selector"
					onclick="${this.skuSelectHandler}"
					title="${titleItem}"
					data-property-id="${this.getId()}"
					data-property-value="${propertyValue.ID}">
				<input type="radio"
					disabled="${!this.parent.isSelectable()}"
					name="property-${this.getSelectedSkuId()}-${this.getId()}-${uniqueId}"
					class="ui-ctl-element">
				<span class="ui-ctl-inner">
					${iconNode}
					${nameNode}
				</span>
			</label>
		`;
			this.#applyRadioSemantics(node, propertyValue);
			return node;
		}
		renderTextSku(propertyValue, uniqueId) {
			const propertyName = main_core.Type.isStringFilled(propertyValue.NAME) ? main_core.Text.encode(propertyValue.NAME) : '-';
			const titleItem = this.parent.isShortView && main_core.Type.isStringFilled(this.property.NAME) ? main_core.Text.encode(this.property.NAME) : propertyName;
			const node = main_core.Tag.render`
			<label 	class="ui-ctl ui-ctl-radio-selector"
					onclick="${this.skuSelectHandler}"
					title="${titleItem}"
					data-property-id="${this.getId()}"
					data-property-value="${propertyValue.ID}">
				<input type="radio"
					disabled="${!this.parent.isSelectable()}"
					name="property-${this.getSelectedSkuId()}-${this.getId()}-${uniqueId}"
					class="ui-ctl-element">
				<span class="ui-ctl-inner">
					<span class="ui-ctl-label-text">${propertyName}</span>
				</span>
			</label>
		`;
			this.#applyRadioSemantics(node, propertyValue);
			return node;
		}

		// ui.forms renders the native <input type=radio> as display:none, so it is not
		// in the accessibility tree. Carry the radio semantics on the visible <label>
		// instead (APG radiogroup); the hidden input stays only for CSS :checked styling.
		#applyRadioSemantics(node, propertyValue) {
			main_core.Dom.attr(node, 'role', 'radio');
			if (this.parent.isSelectable()) {
				// Managed by FocusZone (roving tabindex); presence makes the label focusable.
				main_core.Dom.attr(node, 'tabindex', '-1');
			} else {
				// The hidden native input carries `disabled`, but it is not in the a11y tree.
				// Mirror the disabled state onto the visible label that holds the radio role.
				main_core.Dom.attr(node, 'aria-disabled', 'true');
			}
			if (main_core.Type.isStringFilled(propertyValue.NAME)) {
				main_core.Dom.attr(node, 'aria-label', propertyValue.NAME);
			}
		}
		layout() {
			if (!this.hasSkuValues()) {
				return;
			}
			this.skuList = this.renderProperties();
			this.toggleSkuPropertyValues();
			main_core.Dom.attr(this.skuList, 'role', 'radiogroup');
			const hasName = main_core.Type.isStringFilled(this.property.NAME);
			let title = '';
			if (!this.parent.isShortView) {
				const titleId = `sku-radiogroup-title-${this.getId()}-${main_core.Text.getRandom()}`;
				title = main_core.Tag.render`<div class="product-item-detail-info-container-title" id="${titleId}">${main_core.Text.encode(this.property.NAME)}</div>`;
				if (hasName) {
					main_core.Dom.attr(this.skuList, 'aria-labelledby', titleId);
				}
			} else if (hasName) {
				main_core.Dom.attr(this.skuList, 'aria-label', this.property.NAME);
			}
			this.#activateFocusZone();
			return main_core.Tag.render`
			<div class="product-item-detail-info-container">
				${title}
				<div class="product-item-scu-container">
					${this.skuList}
				</div>
			</div>
		`;
		}
		#activateFocusZone() {
			// Radio semantics live on the labels (native inputs are display:none), so
			// FocusZone provides the arrow-key roving-tabindex navigation over them.
			if (!this.parent.isSelectable() || this.focusZone) {
				return;
			}

			// Selection is decoupled from focus: arrows only move the roving focus.
			// A radio is selected by Enter/Space (keydown below) or click (label onclick).
			main_core.Event.bind(this.skuList, 'keydown', this.skuKeydownHandler);
			this.focusZone = new ui_a11y.FocusZone(this.skuList, {
				bindKeys: ui_a11y.FocusKeys.ArrowHorizontal | ui_a11y.FocusKeys.ArrowVertical | ui_a11y.FocusKeys.HomeAndEnd,
				focusOutBehavior: 'wrap',
				// Roving tab-stop follows the checked value (APG radiogroup entry point).
				focusInStrategy: () => this.getTabStopElement()
			});
			requestAnimationFrame(() => {
				if (this.focusZone && !this.focusZone.isActive()) {
					this.focusZone.activate();
				}
			});
		}
		getTabStopElement() {
			if (!this.skuList) {
				return null;
			}
			return this.skuList.querySelector('[role="radio"][aria-checked="true"]') || this.skuList.querySelector('[role="radio"]');
		}
		focusTabStop() {
			const element = this.getTabStopElement();
			if (!element) {
				return;
			}

			// The group was just recreated: make sure its FocusZone is live before
			// moving DOM focus, so the roving tab-stop lands on the checked value.
			if (this.focusZone && !this.focusZone.isActive()) {
				this.focusZone.activate();
			}
			this.focusZone?.refreshElements();
			element.focus();
		}
		renderProperties() {
			const skuList = main_core.Tag.render`<div class="product-item-scu-list ui-ctl-spacing-right"></div>`;
			this.property.VALUES.forEach(propertyValue => {
				let propertyValueId = propertyValue.ID;
				let node;
				let uniqueId = main_core.Text.getRandom();
				if (!propertyValueId || this.existingValues.includes(propertyValueId)) {
					if (this.property.SHOW_MODE === 'PICT') {
						main_core.Dom.addClass(skuList, 'product-item-scu-list--pick-color');
						node = this.renderPictureSku(propertyValue, uniqueId);
					} else {
						main_core.Dom.addClass(skuList, 'product-item-scu-list--pick-size');
						node = this.renderTextSku(propertyValue, uniqueId);
					}
					this.nodeDescriptions.push({
						propertyValueId,
						node
					});
					skuList.appendChild(node);
				}
			});
			return skuList;
		}
		toggleSkuPropertyValues() {
			const selectedSkuProperty = this.parent.getSelectedSkuProperty(this.getId());
			const activeSkuProperties = this.parent.getActiveSkuProperties(this.getId());
			const visibleNodes = [];
			this.nodeDescriptions.forEach(item => {
				let id = main_core.Text.toNumber(item.propertyValueId);
				let input = item.node.querySelector('input[type="radio"]');
				if (selectedSkuProperty === id) {
					input.checked = true;
					main_core.Dom.addClass(item.node, 'selected');
					main_core.Dom.attr(item.node, 'aria-checked', 'true');
				} else {
					input.checked = false;
					main_core.Dom.removeClass(item.node, 'selected');
					main_core.Dom.attr(item.node, 'aria-checked', 'false');
				}
				if (this.hideUnselected && selectedSkuProperty !== id || !activeSkuProperties.includes(item.propertyValueId)) {
					main_core.Dom.style(item.node, {
						display: 'none'
					});
				} else {
					main_core.Dom.style(item.node, {
						display: null
					});
					visibleNodes.push(item.node);
				}
			});

			// The browser cannot compute set position (radio semantics live on labels,
			// not a native group), so expose it explicitly for screen readers.
			visibleNodes.forEach((node, index) => {
				main_core.Dom.attr(node, 'aria-setsize', visibleNodes.length);
				main_core.Dom.attr(node, 'aria-posinset', index + 1);
			});

			// Defer to the next frame: SkuTree toggles every group in sequence, so
			// refreshing here would interleave DOM writes with layout-reading visibility
			// checks and force a reflow per group.
			requestAnimationFrame(() => {
				this.focusZone?.refreshElements();
			});
		}
		handleSkuKeydown(event) {
			if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') {
				return;
			}
			const radio = event.target.closest('[role="radio"][data-property-id]');
			if (!radio || !this.skuList.contains(radio)) {
				return;
			}

			// Non-native radio (semantics on the label): the browser does not synthesize
			// activation from Enter/Space, so do it here. preventDefault stops Space scroll.
			event.preventDefault();
			this.handleSkuSelect(event);
		}
		handleSkuSelect(event) {
			event.stopPropagation();
			const selectedSkuProperty = event.target.closest('[data-property-id]');
			if (!this.parent.isSelectable() || main_core.Dom.hasClass(selectedSkuProperty, 'selected')) {
				return;
			}
			const fromKeyboard = event.type === 'keydown';
			const propertyId = main_core.Text.toNumber(selectedSkuProperty.getAttribute('data-property-id'));
			const propertyValue = main_core.Text.toNumber(selectedSkuProperty.getAttribute('data-property-value'));
			this.parent.setSelectedProperty(propertyId, propertyValue);
			this.parent.getSelectedSku().then(selectedSkuData => {
				const meta = {
					fromKeyboard,
					propertyId
				};
				main_core_events.EventEmitter.emit('SkuProperty::onChange', [selectedSkuData, this.property, meta]);
				if (this.parent) {
					this.parent.emit('SkuProperty::onChange', [selectedSkuData, this.property, meta]);
				}
			});
			this.parent.toggleSkuProperties();
		}
	}

	const iblockSkuProperties = new Map();
	const iblockSkuList = new Map();
	const propertyPromises = new Map();
	class SkuTree extends main_core_events.EventEmitter {
		selectedValues = {};
		static DEFAULT_IBLOCK_ID = 0;
		constructor(options) {
			super();
			this.setEventNamespace('BX.Catalog.SkuTree');
			this.id = main_core.Text.getRandom();
			this.skuTree = options.skuTree || {};
			this.productId = this.skuTree?.PRODUCT_ID;
			this.skuTreeOffers = this.skuTree.OFFERS || [];
			if (!main_core.Type.isNil(options.skuTree.OFFERS_JSON) && !main_core.Type.isArrayFilled(this.skuTreeOffers)) {
				this.skuTreeOffers = JSON.parse(this.skuTree.OFFERS_JSON);
			}
			this.iblockId = this.skuTree.IBLOCK_ID || SkuTree.DEFAULT_IBLOCK_ID;
			if (!iblockSkuProperties.has(this.iblockId)) {
				if (main_core.Type.isObject(this.skuTree.OFFERS_PROP)) {
					iblockSkuProperties.set(this.iblockId, this.skuTree.OFFERS_PROP);
				} else {
					iblockSkuProperties.set(this.iblockId, {});
					const promise = new Promise(resolve => {
						main_core.ajax.runAction('catalog.skuTree.getIblockProperties', {
							json: {
								iblockId: this.iblockId
							}
						}).then(result => {
							iblockSkuProperties.set(this.iblockId, result.data);
							resolve();
							propertyPromises.delete(SkuTree.#getIblockPropertiesRequestName(this.iblockId));
						});
					});
					propertyPromises.set(SkuTree.#getIblockPropertiesRequestName(this.iblockId), promise);
				}
			}
			this.selectable = options.selectable !== false;
			this.isShortView = options.isShortView === true;
			this.hideUnselected = options.hideUnselected === true;
			if (this.hasSku()) {
				this.selectedValues = this.skuTree.SELECTED_VALUES || {
					...this.skuTreeOffers[0].TREE
				};
			}
			this.existingValues = this.skuTree.EXISTING_VALUES || {};
			if (!main_core.Type.isNil(options.skuTree.EXISTING_VALUES_JSON) && main_core.Type.isNil(options.skuTree.EXISTING_VALUES)) {
				this.existingValues = JSON.parse(options.skuTree.EXISTING_VALUES_JSON);
			}
			for (const key in this.existingValues) {
				if (this.existingValues[key].length === 1 && this.existingValues[key][0] === 0) {
					delete this.existingValues[key];
				}
			}
		}
		static #getIblockPropertiesRequestName(iblockId) {
			return 'IblockPropertiesRequest_' + iblockId;
		}
		getProperties() {
			return iblockSkuProperties.get(this.iblockId);
		}
		isSelectable() {
			return this.selectable;
		}
		getSelectedValues() {
			return this.selectedValues;
		}
		setSelectedProperty(propertyId, propertyValue) {
			this.selectedValues[propertyId] = main_core.Text.toNumber(propertyValue);
			const remainingProperties = this.getRemainingProperties(propertyId);
			if (remainingProperties.length) {
				for (const remainingPropertyId of remainingProperties) {
					const filterProperties = this.getFilterProperties(remainingPropertyId);
					const skuItems = this.filterSku(filterProperties);
					if (skuItems.length) {
						let found = false;
						for (const sku of skuItems) {
							if (sku.TREE[remainingPropertyId] === this.selectedValues[remainingPropertyId]) {
								found = true;
							}
						}
						if (!found) {
							this.selectedValues[remainingPropertyId] = skuItems[0].TREE[remainingPropertyId];
						}
					}
				}
			}
		}
		getRemainingProperties(propertyId) {
			const filter = [];
			let found = false;
			for (const prop of Object.values(this.getProperties())) {
				if (prop.ID === propertyId) {
					found = true;
				} else if (found) {
					filter.push(prop.ID);
				}
			}
			return filter;
		}
		hasSku() {
			return main_core.Type.isArrayFilled(this.skuTreeOffers);
		}
		hasSkuProps() {
			return Object.values(this.getProperties()).length > 0;
		}
		getSelectedSkuId() {
			if (!this.hasSku()) {
				return;
			}
			const item = this.skuTreeOffers.filter(item => {
				return JSON.stringify(item.TREE) === JSON.stringify(this.selectedValues);
			})[0];
			return item?.ID;
		}
		getSelectedSku() {
			return new Promise((resolve, reject) => {
				const skuId = this.getSelectedSkuId();
				if (skuId <= 0) {
					reject();
					return;
				}
				if (iblockSkuList.has(skuId)) {
					const skuData = iblockSkuList.get(skuId);
					resolve(skuData);
				} else {
					if (propertyPromises.has(SkuTree.#getSkuRequestName(skuId))) {
						propertyPromises.get(SkuTree.#getSkuRequestName(skuId)).then(skuFields => {
							resolve(skuFields);
						});
					} else {
						const skuRequest = main_core.ajax.runAction('catalog.skuTree.getSku', {
							json: {
								skuId
							}
						}).then(result => {
							const skuData = result.data;
							iblockSkuList.set(skuId, skuData);
							resolve(skuData);
							propertyPromises.delete(SkuTree.#getSkuRequestName(skuId), skuRequest);
						});
						propertyPromises.set(SkuTree.#getSkuRequestName(skuId), skuRequest);
					}
				}
			});
		}
		static #getSkuRequestName(skuId) {
			return 'SkuFieldsRequest_' + skuId;
		}
		getActiveSkuProperties(propertyId) {
			const activeSkuProperties = [];
			const filterProperties = this.getFilterProperties(propertyId);
			this.filterSku(filterProperties).forEach(item => {
				if (!activeSkuProperties.includes(item.TREE[propertyId])) {
					activeSkuProperties.push(item.TREE[propertyId]);
				}
			});
			return activeSkuProperties;
		}
		getFilterProperties(propertyId) {
			const filter = [];
			for (const prop of Object.values(this.getProperties())) {
				if (prop.ID === propertyId) {
					break;
				}
				filter.push(prop.ID);
			}
			return filter;
		}
		filterSku(filter) {
			if (filter.length === 0) {
				return this.skuTreeOffers;
			}
			const selectedValues = this.getSelectedValues();
			return this.skuTreeOffers.filter(sku => {
				for (const propertyId of filter) {
					if (sku.TREE[propertyId] !== selectedValues[propertyId]) {
						return false;
					}
				}
				return true;
			});
		}
		getSelectedSkuProperty(propertyId) {
			return main_core.Text.toNumber(this.selectedValues[propertyId]);
		}
		layout() {
			const container = main_core.Tag.render`<div class="product-item-scu-wrapper" id="${this.id}"></div>`;
			if (this.isShortView) {
				main_core.Dom.addClass(container, '--short-format');
			}
			this.skuProperties = [];
			if (this.hasSku()) {
				new Promise(resolve => {
					if (propertyPromises.has(SkuTree.#getIblockPropertiesRequestName(this.iblockId))) {
						propertyPromises.get(SkuTree.#getIblockPropertiesRequestName(this.iblockId)).then(resolve);
					} else {
						resolve();
					}
				}).then(() => {
					if (!this.hasSkuProps()) {
						return;
					}
					const skuProperties = this.getProperties();
					for (const i in skuProperties) {
						if (skuProperties.hasOwnProperty(i) && !main_core.Type.isNil(this.existingValues[i])) {
							const skuProperty = new SkuProperty({
								parent: this,
								property: skuProperties[i],
								existingValues: main_core.Type.isArray(this.existingValues[i]) ? this.existingValues[i] : Object.values(this.existingValues[i]),
								offers: this.skuTreeOffers,
								hideUnselected: this.hideUnselected
							});
							main_core.Dom.append(skuProperty.layout(), container);
							this.skuProperties.push(skuProperty);
						}
					}
					main_core_events.EventEmitter.emit('BX.Catalog.SkuTree::onSkuLoaded', {
						id: this.id
					});
				});
			}
			return container;
		}
		toggleSkuProperties() {
			this.skuProperties.forEach(property => property.toggleSkuPropertyValues());
		}
		focusPropertyTabStop(propertyId) {
			if (!main_core.Type.isArrayFilled(this.skuProperties)) {
				return;
			}
			const property = this.skuProperties.find(item => main_core.Text.toNumber(item.getId()) === main_core.Text.toNumber(propertyId));
			property?.focusTabStop();
		}
	}

	exports.SkuTree = SkuTree;

})(this.BX.Catalog.SkuTree = this.BX.Catalog.SkuTree || {}, BX, window, BX.Event, BX.UI.Accessibility);
//# sourceMappingURL=sku-tree.bundle.js.map
