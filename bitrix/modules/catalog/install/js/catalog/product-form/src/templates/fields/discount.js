import {Menu} from 'main.popup';
import {Loc, Text, Type} from 'main.core';
import {Vue} from "ui.vue";
import {config} from "../../config";
import {DiscountType} from "catalog.product-calculator";
import {MoneyInput} from "./money-input";

Vue.component(config.templateFieldDiscount,
{
	/**
	 * @emits 'changeDiscountType' {type: Y|N}
	 * @emits 'changeDiscount' {discountValue: number}
	 */

	props: {
		editable: Boolean,
		options: Object,
		discount: Number,
		discountType: Number,
		discountRate: Number,
	},
	data()
	{
		return {
			isFocused: false,
			isPointerFocus: false,
			hasInputChanges: false,
			inputValue: '',
			publishTimer: null,
		};
	},
	created()
	{
		this.currencySymbol = this.options.currencySymbol;
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
		onChangeType(event, params)
		{
			if (!this.editable)
			{
				return;
			}

			this.flushDiscount(true);
			const type = (Text.toNumber(params?.options?.type) === DiscountType.MONETARY) ?  DiscountType.MONETARY : DiscountType.PERCENTAGE;
			this.$emit('changeDiscountType', type);
			this.inputValue = this.getFocusedDiscountValue(type);
			this.$nextTick(() => {
				this.inputValue = this.getFocusedDiscountValue(type);
			});

			if (this.popupMenu)
			{
				this.popupMenu.close();
			}
		},
		onInputDiscount(event)
		{
			if (!this.editable)
			{
				return;
			}

			this.hasInputChanges = true;
			this.inputValue = event.target.value;
			this.clearPublishTimer();
			if (this.inputValue === '' || MoneyInput.hasTrailingDecimalSeparator(this.inputValue))
			{
				return;
			}

			this.publishTimer = setTimeout(() => {
				this.flushDiscount();
			}, MoneyInput.PUBLISH_DELAY);
		},
		flushDiscount(forceEmpty: boolean = false): void
		{
			this.clearPublishTimer();
			if (!this.hasInputChanges)
			{
				return;
			}

			if (this.inputValue === '' && !forceEmpty)
			{
				return;
			}

			const discountValue = Text.toNumber(this.inputValue) || 0;
			this.hasInputChanges = false;
			if (discountValue === this.getCurrentDiscountValue() || !this.editable)
			{
				return;
			}

			this.$emit('changeDiscount', discountValue);
		},
		onFocus(event)
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
				this.inputValue = this.isPointerFocus
					? event.target.value
					: this.getFocusedDiscountValue()
				;
			}

			const shouldMoveCaretToEnd = !this.isPointerFocus && !wasFocused;
			this.isPointerFocus = false;
			if (shouldMoveCaretToEnd)
			{
				this.$nextTick(() => MoneyInput.moveCaretToEnd(event.target));
			}
		},
		onBlur()
		{
			this.flushDiscount(true);
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
		getFocusedDiscountValue(type = this.discountType)
		{
			const isPercent = Text.toNumber(type) === DiscountType.PERCENTAGE;
			const value = isPercent
				? Text.toNumber(this.discountRate)
				: Text.toNumber(this.discount)
			;

			return value === 0 ? '' : String(value);
		},
		getCurrentDiscountValue(type = this.discountType)
		{
			const isPercent = Text.toNumber(type) === DiscountType.PERCENTAGE;

			return isPercent
				? Text.toNumber(this.discountRate)
				: Text.toNumber(this.discount)
			;
		},
		showPopupMenu(target)
		{
			if (!this.editable || !Type.isArray(this.options.allowedDiscountTypes))
			{
				return;
			}

			const menuItems = [];
			if (this.options.allowedDiscountTypes.includes(DiscountType.PERCENTAGE))
			{
				menuItems.push({
					text: '%',
					onclick: this.onChangeType,
					type: DiscountType.PERCENTAGE,
				})
			}

			if (this.options.allowedDiscountTypes.includes(DiscountType.MONETARY))
			{
				menuItems.push({
					text: this.currencySymbol,
					onclick: this.onChangeType,
					type: DiscountType.MONETARY,
				})
			}

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
	computed: {
		getDiscountInputValue()
		{
			if (this.isFocused)
			{
				return this.inputValue;
			}

			const isPercent = Text.toNumber(this.discountType) === DiscountType.PERCENTAGE;
			const value = isPercent
				? Text.toNumber(this.discountRate)
				: Text.toNumber(this.discount)
			;

			// No discount → render an empty field so the "0" placeholder is shown.
			// Focusing it then starts from scratch: there is no leading 0 to clear
			// before typing a value.
			if (value === 0)
			{
				return '';
			}

			if (isPercent)
			{
				return value.toFixed(4).replace(/\.?0+$/, '') || '0';
			}

			const precision = Text.toInteger(this.options?.displayPrecision) || 2;

			return value.toFixed(precision);
		},
		getDiscountSymbol()
		{
			return Text.toNumber(this.discountType) === DiscountType.PERCENTAGE ? '%' : this.currencySymbol;
		},
		wrapperClasses()
		{
			return {
				'catalog-pf-product-input-wrapper--disabled': !this.editable,
			};
		},
		hintText()
		{
			if (!this.editable && !this.options?.isCatalogDiscountSetEnabled)
			{
				return Loc.getMessage('CATALOG_FORM_DISCOUNT_ACCESS_DENIED_HINT');
			}

			return null;
		},
	},
	// language=Vue
	template: `
		<div
			class="catalog-pf-product-input-wrapper catalog-pf-product-input-wrapper--left"
			:class="wrapperClasses"
			:data-hint="hintText"
			data-hint-no-icon
		>
			<input class="catalog-pf-product-input catalog-pf-product-input--align-right catalog-pf-product-input--right"
				ref="discountInput"
				v-bind:class="{ 'catalog-pf-product-input--disabled': !editable }"
				:value="getDiscountInputValue"
				@input="onInputDiscount"
				@pointerdown="onPointerDown"
				@pointerup="onPointerCancel"
				@pointercancel="onPointerCancel"
				@focus="onFocus"
				@blur="onBlur"
				placeholder="0"
				:disabled="!editable"
				data-name="discount"
				:data-value="getDiscountInputValue"
			/>
			<div class="catalog-pf-product-input-info catalog-pf-product-input-info--action"
				@click="showPopupMenu">
				<span v-html="getDiscountSymbol"></span>
			</div>
		</div>
	`
});
