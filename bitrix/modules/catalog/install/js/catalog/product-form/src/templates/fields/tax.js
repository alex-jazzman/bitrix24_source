import {Menu} from 'main.popup';
import {Loc, Text, Type} from 'main.core';
import {Vue} from "ui.vue";
import {CurrencyCore} from "currency.currency-core";
import {config} from "../../config";

function decodeCurrencyText(value): string
{
	if (!Type.isString(value))
	{
		return '';
	}

	const textarea = document.createElement('textarea');
	textarea.innerHTML = value;

	return textarea.value;
}

Vue.component(config.templateFieldTax,
{
	/**
	 * @emits 'changeTax' {taxId: number, taxValue: number | null}
	 */

	props: {
		taxId: Number,
		editable: Boolean,
		options: Object,
		taxRate: {
			type: Number,
			default: 0,
		},
		taxSum: {
			type: Number,
			default: 0,
		},
		currencySymbol: {
			type: String,
			default: '',
		},
	},
	computed:
	{
		taxValue(): number
		{
			return Text.toNumber(this.taxRateItem ? this.taxRateItem.value : this.taxRate);
		},
		taxLabel(): string
		{
			return this.formatTaxRate(this.taxRateItem ? this.taxRateItem.value : this.taxRate);
		},
		taxRateItem()
		{
			return this.getTaxRateItem(this.taxId);
		},
		hasTaxSum(): boolean
		{
			return Number.isFinite(this.taxSum) && this.taxSum > 0;
		},
		formattedTaxSum(): string
		{
			const value = Text.toNumber(this.taxSum);
			const currency = this.options?.currency;
			if (Type.isStringFilled(currency))
			{
				const formatted = CurrencyCore.currencyFormat(value, currency, false);
				if (Type.isStringFilled(formatted))
				{
					return decodeCurrencyText(formatted);
				}
			}

			const precision = Text.toInteger(this.options?.displayPrecision) || 2;

			return value.toFixed(precision);
		},
		normalizedCurrencySymbol(): string
		{
			return decodeCurrencyText(this.currencySymbol);
		},
	},
	methods:
	{
		onChangeValue(event, params)
		{
			const taxId = Text.toNumber(params?.options?.id);
			if (taxId === Text.toNumber(this.taxId) || !this.editable)
			{
				return;
			}

			this.$emit('changeTax', {
				taxValue: params?.options?.item,
				taxId,
			});

			if (this.popupMenu)
			{
				this.popupMenu.close();
			}
		},
		getTaxRateList()
		{
			return Type.isArray(this.options.taxRateList) ? this.options.taxRateList : [];
		},
		getTaxRateItem(taxId)
		{
			const taxRateList = this.getTaxRateList();
			const normalizedTaxId = Text.toInteger(taxId);
			const item = taxRateList.find((rate) => rate.taxId === normalizedTaxId);
			if (item || normalizedTaxId !== 0 || Text.toNumber(this.taxRate) > 0)
			{
				return item;
			}

			return taxRateList.find((rate) => rate.value === null);
		},
		formatTaxRate(value): string
		{
			// `null` is the "no VAT" rate (EXCLUDE_VAT='Y'); show its label instead of `null%`.
			if (value === null)
			{
				return Loc.getMessage('CATALOG_FORM_TAX_WITHOUT_VAT');
			}

			return Text.toNumber(value) + '%';
		},
		showPopupMenu(target)
		{
			if (!this.editable || !Type.isArray(this.options.taxRateList))
			{
				return;
			}
			const menuItems = [];
			this.options.taxRateList.forEach(({ taxId, value }) => {
				menuItems.push({
					id: taxId,
					text: this.formatTaxRate(value),
					item: value,
					dataset: {
						testid: `catalog-product-form-tax-rate-option-${taxId}`,
					},
					onclick: this.onChangeValue,
				})
			});


			if (menuItems.length > 0)
			{
				this.popupMenu = new Menu({
					bindElement: target,
					items: menuItems
				});

				this.popupMenu.show();
			}
		},
	},
	// language=Vue
	template: `
		<div class="catalog-pf-product-tax-wrapper">
			<div
				class="catalog-pf-product-input-wrapper catalog-pf-product-input-wrapper--right"
				:class="{ 'catalog-pf-product-input-wrapper--disabled': !editable }"
				data-testid="catalog-product-form-tax-rate-trigger"
				@click="showPopupMenu"
			>
				<div
					class="catalog-pf-product-input"
					:class="{ 'catalog-pf-product-input--disabled': !editable }"
				>{{taxLabel}}</div>
				<div class="catalog-pf-product-input-info catalog-pf-product-input-info--dropdown"></div>
			</div>
			<div
				v-if="hasTaxSum"
				class="catalog-pf-product-tax-sum"
				data-testid="catalog-product-form-tax-sum"
			>
				<span
					class="catalog-pf-product-tax-sum__value"
					data-testid="catalog-product-form-tax-sum-value"
				>{{formattedTaxSum}}</span>
				<span
					class="catalog-pf-product-tax-sum__currency"
					data-testid="catalog-product-form-tax-sum-currency"
				>{{normalizedCurrencySymbol}}</span>
			</div>
		</div>
	`
});
