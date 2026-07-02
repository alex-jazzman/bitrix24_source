/* eslint-disable */
(function (main_core, ui_entitySelector) {
	'use strict';

	const namespace = main_core.Reflection.namespace('BX.Crm.Activity');
	class CrmAddProductRowActivity {
		#selector;
		constructor(options) {
			if (main_core.Type.isPlainObject(options)) {
				const form = document.forms[options.formName];
				if (!main_core.Type.isNil(form)) {
					this.productNode = form['product_id'];
				}
				if (options.productProperty && main_core.Type.isPlainObject(options.productProperty.Settings)) {
					this.productSettings = options.productProperty.Settings;
				}
			}
		}
		init() {
			if (this.productNode && this.productSettings) {
				main_core.Event.bind(this.productNode, 'click', this.#onProductClick.bind(this));
			}
		}
		#onProductClick() {
			this.#getProductSelector().show();
		}
		#getProductSelector() {
			if (!this.#selector) {
				this.#selector = new ui_entitySelector.Dialog({
					context: 'catalog-products',
					entities: [{
						id: 'product',
						options: {
							iblockId: this.productSettings.iblockId,
							basePriceId: this.productSettings.basePriceId
						}
					}],
					targetNode: this.productNode,
					height: 300,
					multiple: false,
					dropdownMode: true,
					enableSearch: true,
					events: {
						'Item:onBeforeSelect': event => {
							event.preventDefault();
							this.productNode.value = event.getData().item.getId();
						}
					}
				});
			}
			return this.#selector;
		}
	}
	namespace.CrmAddProductRowActivity = CrmAddProductRowActivity;

})(BX, BX.UI.EntitySelector);
//# sourceMappingURL=script.js.map
