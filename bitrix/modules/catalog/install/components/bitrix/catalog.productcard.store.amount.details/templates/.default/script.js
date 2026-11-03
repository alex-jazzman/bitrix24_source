/* eslint-disable */
(function (main_core, main_core_events, catalog_accessDeniedInput) {
	'use strict';

	class StoreAmountDetails {
		constructor(settings) {
			this.gridId = settings.gridId;
			this.productId = settings.productId;
			this.storeId = settings.storeId;
			this.allowPurchasingPrice = settings.allowPurchasingPrice;
			this.onFilterApplyHandler = this.onFilterApply.bind(this);
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.onFilterApplyHandler);
			if (!this.allowPurchasingPrice) {
				this.#initPurchasingPrice();
				main_core_events.EventEmitter.subscribe('Grid::updated', this.#initPurchasingPrice.bind(this));
			}
		}
		getGridId() {
			return this.gridId;
		}
		getProductId() {
			return this.productId;
		}
		getStoreId() {
			return this.storeId;
		}
		onFilterApply(event) {
			const [gridId] = event.getCompatData();
			if (gridId !== this.getGridId()) {
				return;
			}
			BX.ajax.runComponentAction('bitrix:catalog.productcard.store.amount.details', 'updateTotalData', {
				mode: 'class',
				data: {
					productId: this.getProductId(),
					storeId: this.getStoreId()
				}
			}).then(response => {
				const totalData = response?.data?.TOTAL_DATA;
				if (!totalData) {
					return;
				}
				const quantityAvailableNode = document.getElementById(this.getGridId() + '_total_quantity_available');
				if (quantityAvailableNode) {
					quantityAvailableNode.innerHTML = totalData.QUANTITY_AVAILABLE;
				}
				const quantityReservedNode = document.getElementById(this.getGridId() + '_total_quantity_reserved');
				if (quantityReservedNode) {
					quantityReservedNode.innerHTML = totalData.QUANTITY_RESERVED;
				}
				const quantityCommonNode = document.getElementById(this.getGridId() + '_total_quantity_common');
				if (quantityCommonNode) {
					quantityCommonNode.innerHTML = totalData.QUANTITY_COMMON;
				}
				const totalPriceNode = document.getElementById(this.getGridId() + '_total_price');
				if (totalPriceNode) {
					totalPriceNode.innerHTML = totalData.PRICE;
				}
			});
		}
		#getGrid() {
			if (!main_core.Reflection.getClass('BX.Main.gridManager.getInstanceById')) {
				throw Error(`Cannot find grid`);
			}
			return BX.Main.gridManager.getInstanceById(this.getGridId());
		}
		#initPurchasingPrice() {
			this.#getGrid().getContainer().querySelectorAll('purchasing-price').forEach(element => {
				const input = new catalog_accessDeniedInput.AccessDeniedInput({
					hint: main_core.Loc.getMessage('CATALOG_PRODUCTCARD_STORE_AMOUNT_DETAILS_PURCHASING_PRICE_HINT'),
					isReadOnly: true
				});
				input.renderTo(element);
			});
		}
	}
	main_core.Reflection.namespace('BX.Catalog').StoreAmountDetails = StoreAmountDetails;

})(BX, BX.Event, BX.Catalog);
//# sourceMappingURL=script.js.map
