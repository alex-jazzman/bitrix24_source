import {Loc, Text} from 'main.core';
import {Vue} from "ui.vue";
import {config} from "../../config";
import type {BaseEvent} from "main.core.events";
import {MoneyInput} from "./money-input";

Vue.component(config.templateFieldPrice,
{
	/**
	 * @emits 'onChangePrice' {price: number}
	 * @emits 'saveCatalogField' {}
	 */

	props: {
		selectorId: String,
		price: Number,
		editable: Boolean,
		hasError: Boolean,
		options: Object,
	},
	data()
	{
		return {
			isFocused: false,
			isPointerFocus: false,
			hasInputChanges: false,
			inputValue: '',
			publishTimer: null,
			lastValidValue: Text.toNumber(this.price),
		};
	},
	beforeDestroy()
	{
		this.clearPublishTimer();
	},
	mounted()
	{
		BX.UI.Hint.init();
	},
	methods:
	{
		clearPublishTimer(): void
		{
			if (this.publishTimer)
			{
				clearTimeout(this.publishTimer);
				this.publishTimer = null;
			}
		},
		onInputPrice(event: BaseEvent): void
		{
			if (!this.editable)
			{
				return;
			}

			const input = event.target;
			this.hasInputChanges = true;
			const sanitized = MoneyInput.sanitizeDecimalInput(
				input.value,
				input.selectionStart,
				input.selectionEnd,
			);
			this.inputValue = sanitized.value;
			if (input.value !== sanitized.value)
			{
				input.value = sanitized.value;
				MoneyInput.applySelection(input, sanitized.selectionStart, sanitized.selectionEnd);
			}

			const newPrice = MoneyInput.getDecimalPublishValue(this.inputValue);
			if (newPrice === null)
			{
				this.clearPublishTimer();

				return;
			}

			this.lastValidValue = newPrice;
			this.clearPublishTimer();
			this.publishTimer = setTimeout(() => {
				this.publishPrice(this.lastValidValue);
			}, MoneyInput.PUBLISH_DELAY);
		},
		publishPrice(newPrice: number): void
		{
			this.clearPublishTimer();
			this.hasInputChanges = false;
			this.$emit('onChangePrice', newPrice);
		},
		onFocus(event: BaseEvent): void
		{
			if (!this.editable)
			{
				return;
			}

			const wasFocused = this.isFocused;
			this.isFocused = true;
			if (!wasFocused)
			{
				this.hasInputChanges = false;
				this.lastValidValue = Text.toNumber(this.price);
				this.inputValue = this.isPointerFocus
					? event.target.value
					: MoneyInput.formatFocusedDecimal(this.price)
				;
			}

			const shouldSelectAll = !this.isPointerFocus && !wasFocused;
			this.isPointerFocus = false;
			if (shouldSelectAll)
			{
				this.$nextTick(() => MoneyInput.selectAll(event.target));
			}
		},
		onBlur(): void
		{
			if (this.hasInputChanges)
			{
				const newPrice = this.inputValue === ''
					? 0
					: MoneyInput.getDecimalPublishValue(this.inputValue, true)
				;

				this.publishPrice(newPrice ?? this.lastValidValue);
			}
			else
			{
				this.clearPublishTimer();
			}

			this.isFocused = false;
			this.isPointerFocus = false;
		},
		onPointerDown(event): void
		{
			if (event.button !== undefined && event.button !== 0)
			{
				return;
			}

			this.isPointerFocus = true;
		},
		onPointerCancel(): void
		{
			this.isPointerFocus = false;
		},
	},
	computed:
	{
		localize()
		{
			return Vue.getFilteredPhrases('CATALOG_');
		},
		currencySymbol()
		{
			return this.options.currencySymbol || '';
		},
		hintText()
		{
			if (!this.editable && !this.options?.isCatalogPriceEditEnabled)
			{
				return Loc.getMessage('CATALOG_FORM_PRICE_ACCESS_DENIED_HINT');
			}

			return null;
		},
		displayPrice(): string
		{
			if (this.isFocused)
			{
				return this.inputValue;
			}

			return MoneyInput.formatDecimal(this.price, this.options?.displayPrecision);
		},
	},
	// language=Vue
	template: `
		<div
			class="catalog-pf-product-input-wrapper"
			:class="{ 'ui-ctl-danger': hasError, '.catalog-pf-product-input-wrapper--disabled': !editable }"
			:data-hint="hintText"
			data-hint-no-icon
		>
			<input 	type="text" class="catalog-pf-product-input catalog-pf-product-input--align-right"
					v-bind:class="{ 'catalog-pf-product-input--disabled': !editable }"
					:value="displayPrice"
					@input="onInputPrice"
					@pointerdown="onPointerDown"
					@pointerup="onPointerCancel"
					@pointercancel="onPointerCancel"
					@focus="onFocus"
					@blur="onBlur"
					:disabled="!editable"
					data-name="price"
					:data-value="price"
			>
			<div class="catalog-pf-product-input-info" v-html="currencySymbol"></div>
		</div>
	`
});
