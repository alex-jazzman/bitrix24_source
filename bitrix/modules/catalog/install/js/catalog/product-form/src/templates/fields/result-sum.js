import {Text} from 'main.core';
import {Vue} from "ui.vue";
import {config} from "../../config";
import type {BaseEvent} from "main.core.events";
import {MoneyInput} from "./money-input";

Vue.component(config.templateFieldResultSum,
{
	/**
	 * @emits 'onChangeSum' {sum: number}
	 */

	props: {
		sum: Number,
		editable: Boolean,
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
			lastValidValue: Text.toNumber(this.sum),
		};
	},
	beforeDestroy()
	{
		this.clearPublishTimer();
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
		onInputSum(event: BaseEvent): void
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

			const newSum = MoneyInput.getDecimalPublishValue(this.inputValue);
			if (newSum === null)
			{
				this.clearPublishTimer();

				return;
			}

			this.lastValidValue = newSum;
			this.clearPublishTimer();
			this.publishTimer = setTimeout(() => {
				this.publishSum(this.lastValidValue);
			}, MoneyInput.PUBLISH_DELAY);
		},
		publishSum(newSum: number): void
		{
			this.clearPublishTimer();
			this.hasInputChanges = false;
			this.$emit('onChangeSum', newSum);
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
				this.lastValidValue = Text.toNumber(this.sum);
				this.inputValue = this.isPointerFocus
					? event.target.value
					: MoneyInput.formatFocusedDecimal(this.sum)
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
				const newSum = this.inputValue === ''
					? 0
					: MoneyInput.getDecimalPublishValue(this.inputValue, true)
				;

				this.publishSum(newSum ?? this.lastValidValue);
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
		displaySum(): string
		{
			if (this.isFocused)
			{
				return this.inputValue;
			}

			return MoneyInput.formatDecimal(this.sum, this.options?.displayPrecision);
		},
	},
	// language=Vue
	template: `
		<div class="catalog-pf-product-input-wrapper">
			<input 	type="text"
					class="catalog-pf-product-input catalog-pf-product-input--align-right"
					:class="{ 'catalog-pf-product-input--disabled': !editable }"
					:value="displaySum"
					@input="onInputSum"
					@pointerdown="onPointerDown"
					@pointerup="onPointerCancel"
					@pointercancel="onPointerCancel"
					@focus="onFocus"
					@blur="onBlur"
					:disabled="!editable"
					data-name="sum"
					:data-value="sum"
			>
			<div class="catalog-pf-product-input-info"
				 :class="{ 'catalog-pf-product-input--disabled': !editable }"
				 v-html="currencySymbol"
			></div>
		</div>
	`
});
