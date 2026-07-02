/* eslint-disable */
declare namespace BX.Catalog {
	/**
	 * Formats the displayed value of a legacy admin price input by the DECIMALS of the selected
	 * currency, while keeping the full DECIMAL(26,8) precision in the `data-money-raw` attribute.
	 *
	 * Markup is produced by `CCatalogAdminTools::renderMoneyEditField()`:
	 *   <input class="catalog-money-edit" value="{formatted}"
	 *          data-money-raw="{fullPrecision}" data-money-currency-source="{currencyControlId}">
	 *
	 * Binding model: a single delegated pair of listeners on `document` in the capture phase.
	 * This is deliberate, not lazy — the store-document editor re-renders its whole product grid via
	 * `products.innerHTML = ajaxResult` (cat_store_document_edit.php → addRowResult) on every product
	 * add, replacing every money input with fresh markup after page load. Per-element binding would
	 * silently miss those re-created inputs, so the full-precision value would no longer be restored on
	 * submit. Delegation on `document` keeps working regardless of when the markup appears.
	 *
	 * Capture phase is required: the raw value must be normalized before the legacy inline `onchange`
	 * recalculations read it, and the full-precision value must be restored before the form `onsubmit`
	 * handlers and the actual submit run.
	 *
	 * Behaviour:
	 *   - on user change of the input: `data-money-raw` is updated with the typed full-precision value;
	 *   - on change of the bound currency control: the displayed value is reformatted by the new DECIMALS;
	 *   - on form submit: for fields whose displayed value still represents `data-money-raw` at the
	 *     current precision (untouched), the full-precision raw value is restored, so the server
	 *     receives the original DECIMAL(26,8) value (no precision loss from formatting).
	 *
	 * The visible input keeps its `name`, so the legacy inline `parseFloat()`-based price
	 * calculations keep reading the displayed (currency-precision) value without any changes.
	 */
	class AdminMoneyField {
		init(): void;
	}

	const adminMoneyField: AdminMoneyField;
}
