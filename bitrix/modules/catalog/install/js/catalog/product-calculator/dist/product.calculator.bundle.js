/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, catalog_productCalculator) {
	'use strict';

	class DiscountType {
		static UNDEFINED = 0;
		static MONETARY = 1;
		static PERCENTAGE = 2;
	}

	const initialFields = {
		QUANTITY: 1,
		PRICE: 0,
		PRICE_EXCLUSIVE: 0,
		PRICE_NETTO: 0,
		PRICE_BRUTTO: 0,
		CUSTOMIZED: 'N',
		DISCOUNT_TYPE_ID: DiscountType.UNDEFINED,
		DISCOUNT_RATE: 0,
		DISCOUNT_SUM: 0,
		DISCOUNT_ROW: 0,
		TAX_INCLUDED: 'N',
		TAX_RATE: 0,
		TAX_SUM: 0,
		SUM: 0
	};
	class FieldStorage {
		constructor(fields, calculator) {
			this.fields = {
				...initialFields
			};
			if (main_core.Type.isPlainObject(fields)) {
				this.fields = {
					...this.fields,
					...fields
				};
			}
			this.calculator = calculator;
		}
		#getPricePrecision() {
			return this.calculator.getPricePrecision();
		}
		#getCommonPrecision() {
			return this.calculator.getCommonPrecision();
		}
		#getQuantityPrecision() {
			return this.calculator.getQuantityPrecision();
		}
		getFields() {
			return main_core.Runtime.clone(this.fields);
		}
		getField(name, defaultValue) {
			return this.fields.hasOwnProperty(name) ? this.fields[name] : defaultValue;
		}
		setField(name, value) {
			value = this.#validateValue(name, value);
			this.fields[name] = value;
		}
		#validateValue(name, value) {
			const priceFields = ['PRICE', 'PRICE_EXCLUSIVE', 'PRICE_NETTO', 'PRICE_BRUTTO', 'DISCOUNT_SUM', 'DISCOUNT_ROW', 'TAX_SUM', 'SUM'];
			if (name === 'DISCOUNT_TYPE_ID') {
				value = value === DiscountType.PERCENTAGE || value === DiscountType.MONETARY ? value : DiscountType.UNDEFINED;
			} else if (name === 'QUANTITY') {
				value = FieldStorage.#round(value, this.#getQuantityPrecision());
			} else if (name === 'CUSTOMIZED' || name === 'TAX_INCLUDED') {
				value = value === 'Y' ? 'Y' : 'N';
			} else if (name === 'TAX_RATE') {
				if (main_core.Type.isNil(value)) {
					return null;
				}
				value = FieldStorage.#round(value, this.#getCommonPrecision());
			} else if (name === 'DISCOUNT_RATE') {
				value = FieldStorage.#round(value, this.#getCommonPrecision());
			} else if (priceFields.includes(name)) {
				value = FieldStorage.#round(value, this.#getPricePrecision());
			}
			return value;
		}
		static #round(value, precision = catalog_productCalculator.ProductCalculator.DEFAULT_PRECISION) {
			const factor = Math.pow(10, precision);
			return Math.round(value * factor) / factor;
		}
		getBasePrice() {
			return this.getField('BASE_PRICE', 0);
		}
		getPrice() {
			return this.getField('PRICE', 0);
		}
		getPriceExclusive() {
			return this.getField('PRICE_EXCLUSIVE', 0);
		}
		getPriceNetto() {
			return this.getField('PRICE_NETTO', 0);
		}
		getPriceBrutto() {
			return this.getField('PRICE_BRUTTO', 0);
		}
		getQuantity() {
			return this.getField('QUANTITY', 1);
		}
		getDiscountType() {
			return this.getField('DISCOUNT_TYPE_ID', DiscountType.UNDEFINED);
		}
		isDiscountUndefined() {
			return this.getDiscountType() === DiscountType.UNDEFINED;
		}
		isDiscountPercentage() {
			return this.getDiscountType() === DiscountType.PERCENTAGE;
		}
		isDiscountMonetary() {
			return this.getDiscountType() === DiscountType.MONETARY;
		}
		isDiscountHandmade() {
			return this.isDiscountPercentage() || this.isDiscountMonetary();
		}
		getDiscountRate() {
			return this.getField('DISCOUNT_RATE', 0);
		}
		getDiscountSum() {
			return this.getField('DISCOUNT_SUM', 0);
		}
		getDiscountRow() {
			return this.getField('DISCOUNT_ROW', 0);
		}
		isEmptyDiscount() {
			if (this.isDiscountPercentage()) {
				return this.getDiscountRate() === 0;
			}
			if (this.isDiscountMonetary()) {
				return this.getDiscountSum() === 0;
			}
			return this.isDiscountUndefined();
		}
		getTaxIncluded() {
			return this.getField('TAX_INCLUDED', 'N');
		}
		isTaxIncluded() {
			return this.getTaxIncluded() === 'Y';
		}
		getTaxRate() {
			return this.getField('TAX_RATE', 0);
		}
		getTaxSum() {
			return this.getField('TAX_SUM', 0);
		}
		getSum() {
			return this.getField('SUM', 0);
		}
	}

	class TaxForPriceStrategy {
		calculator = null;
		constructor(productCalculator) {
			this.calculator = productCalculator;
		}
		getFieldStorage() {
			return new FieldStorage(this.calculator.getFields(), this.calculator);
		}
		getPricePrecision() {
			return this.calculator.getPricePrecision();
		}
		getCommonPrecision() {
			return this.calculator.getCommonPrecision();
		}
		getQuantityPrecision() {
			return this.calculator.getQuantityPrecision();
		}
		calculateBasePrice(value) {
			if (value < 0) {
				throw new Error('Price must be equal or greater than zero.');
			}
			const fieldStorage = this.getFieldStorage();
			fieldStorage.setField('BASE_PRICE', value);
			if (fieldStorage.isTaxIncluded()) {
				fieldStorage.setField('PRICE_BRUTTO', value);
			} else {
				fieldStorage.setField('PRICE_NETTO', value);
			}
			this.updatePrice(fieldStorage);
			this.activateCustomized(fieldStorage);
			return fieldStorage.getFields();
		}
		calculatePrice(value) {
			return this.calculateBasePrice(value);
		}
		calculateQuantity(value) {
			if (value < 0) {
				throw new Error('Quantity must be equal or greater than zero.');
			}
			const fieldStorage = this.getFieldStorage();
			fieldStorage.setField('QUANTITY', value);
			this.updateRowDiscount(fieldStorage);
			this.updateTax(fieldStorage);
			this.updateSum(fieldStorage);
			return fieldStorage.getFields();
		}
		calculateDiscount(value, fieldStorage = null) {
			if (!fieldStorage) {
				fieldStorage = this.getFieldStorage();
			}
			if (value === 0.0) {
				this.clearResultPrices(fieldStorage);
			} else if (fieldStorage.isDiscountPercentage()) {
				fieldStorage.setField('DISCOUNT_RATE', value);
				this.updateResultPrices(fieldStorage);
				fieldStorage.setField('DISCOUNT_SUM', fieldStorage.getPriceNetto() - fieldStorage.getPriceExclusive());
			} else if (fieldStorage.isDiscountMonetary()) {
				fieldStorage.setField('DISCOUNT_SUM', value);
				this.updateResultPrices(fieldStorage);
				fieldStorage.setField('DISCOUNT_RATE', this.calculateDiscountRate(fieldStorage.getPriceNetto(), fieldStorage.getPriceExclusive()));
			}
			this.updateRowDiscount(fieldStorage);
			this.updateTax(fieldStorage);
			this.updateSum(fieldStorage);
			this.activateCustomized(fieldStorage);
			return fieldStorage.getFields();
		}
		calculateDiscountType(value) {
			const fieldStorage = this.getFieldStorage();
			fieldStorage.setField('DISCOUNT_TYPE_ID', value);
			this.updateResultPrices(fieldStorage);
			this.updateDiscount(fieldStorage);
			this.updateRowDiscount(fieldStorage);
			this.updateTax(fieldStorage);
			this.updateSum(fieldStorage);
			this.activateCustomized(fieldStorage);
			return fieldStorage.getFields();
		}
		calculateRowDiscount(value) {
			const fieldStorage = this.getFieldStorage();
			fieldStorage.setField('DISCOUNT_ROW', value);
			if (value !== 0 && fieldStorage.getQuantity() === 0) {
				fieldStorage.setField('QUANTITY', 1);
			}
			fieldStorage.setField('DISCOUNT_TYPE_ID', DiscountType.MONETARY);
			if (value === 0 || fieldStorage.getQuantity() === 0) {
				fieldStorage.setField('DISCOUNT_SUM', 0);
			} else {
				fieldStorage.setField('DISCOUNT_SUM', fieldStorage.getDiscountRow() / fieldStorage.getQuantity());
			}
			this.updateResultPrices(fieldStorage);
			this.updateDiscount(fieldStorage);
			this.updateRowDiscount(fieldStorage);
			this.updateTax(fieldStorage);
			this.updateSum(fieldStorage);
			this.activateCustomized(fieldStorage);
			return fieldStorage.getFields();
		}
		calculateTax(value) {
			const fieldStorage = this.getFieldStorage();
			fieldStorage.setField('TAX_RATE', value);
			this.updateBasePrices(fieldStorage);
			this.updateResultPrices(fieldStorage);
			if (fieldStorage.isTaxIncluded()) {
				this.updateDiscount(fieldStorage);
				this.updateRowDiscount(fieldStorage);
			}
			this.updateTax(fieldStorage);
			this.updateSum(fieldStorage);
			this.activateCustomized(fieldStorage);
			return fieldStorage.getFields();
		}
		calculateTaxIncluded(value) {
			const fieldStorage = this.getFieldStorage();
			if (fieldStorage.getTaxIncluded() !== value) {
				fieldStorage.setField('TAX_INCLUDED', value);
				if (fieldStorage.isTaxIncluded()) {
					fieldStorage.setField('PRICE_BRUTTO', fieldStorage.getPriceNetto());
				} else {
					fieldStorage.setField('PRICE_NETTO', fieldStorage.getPriceBrutto());
				}
			}
			this.updatePrice(fieldStorage);
			this.activateCustomized(fieldStorage);
			return fieldStorage.getFields();
		}
		calculateRowSum(value) {
			const fieldStorage = this.getFieldStorage();
			fieldStorage.setField('SUM', value);
			if (fieldStorage.getQuantity() === 0) {
				fieldStorage.setField('QUANTITY', 1);
			}
			const discountSum = fieldStorage.getPriceNetto() - fieldStorage.getSum() / (fieldStorage.getQuantity() * (1 + fieldStorage.getTaxRate() / 100));
			fieldStorage.setField('DISCOUNT_SUM', discountSum);
			fieldStorage.setField('DISCOUNT_TYPE_ID', DiscountType.MONETARY);
			if (fieldStorage.isEmptyDiscount()) {
				this.clearResultPrices(fieldStorage);
			} else if (fieldStorage.isDiscountHandmade()) {
				this.updateResultPrices(fieldStorage);
			}
			this.updateDiscount(fieldStorage);
			this.updateRowDiscount(fieldStorage);
			this.updateTax(fieldStorage);
			this.activateCustomized(fieldStorage);
			return fieldStorage.getFields();
		}
		updatePrice(fieldStorage) {
			this.updateBasePrices(fieldStorage);
			if (fieldStorage.isEmptyDiscount()) {
				this.clearResultPrices(fieldStorage);
			} else if (fieldStorage.isDiscountHandmade()) {
				this.updateResultPrices(fieldStorage);
			}
			this.updateDiscount(fieldStorage);
			this.updateRowDiscount(fieldStorage);
			this.updateTax(fieldStorage);
			this.updateSum(fieldStorage);
		}
		clearResultPrices(fieldStorage) {
			fieldStorage.setField('PRICE_EXCLUSIVE', fieldStorage.getPriceNetto());
			fieldStorage.setField('PRICE', fieldStorage.getPriceBrutto());
			fieldStorage.setField('DISCOUNT_RATE', 0.0);
			fieldStorage.setField('DISCOUNT_SUM', 0.0);
		}
		calculatePriceWithoutDiscount(price, discount, discountType) {
			let result = 0.0;
			switch (discountType) {
				case DiscountType.PERCENTAGE:
					result = price - price * discount / 100;
					break;
				case DiscountType.MONETARY:
					result = price - discount;
					break;
			}
			return result;
		}
		updateBasePrices(fieldStorage) {
			if (fieldStorage.isTaxIncluded()) {
				fieldStorage.setField('PRICE_NETTO', this.calculatePriceWithoutTax(fieldStorage.getPriceBrutto(), fieldStorage.getTaxRate()));
			} else {
				fieldStorage.setField('PRICE_BRUTTO', this.calculatePriceWithTax(fieldStorage.getPriceNetto(), fieldStorage.getTaxRate()));
			}
		}
		updateResultPrices(fieldStorage) {
			// price without tax
			let exclusivePrice;
			if (fieldStorage.isDiscountPercentage()) {
				exclusivePrice = this.calculatePriceWithoutDiscount(fieldStorage.getPriceNetto(), fieldStorage.getDiscountRate(), DiscountType.PERCENTAGE);
			} else if (fieldStorage.isDiscountMonetary()) {
				exclusivePrice = this.calculatePriceWithoutDiscount(fieldStorage.getPriceNetto(), fieldStorage.getDiscountSum(), DiscountType.MONETARY);
			} else {
				exclusivePrice = fieldStorage.getPriceExclusive();
			}
			fieldStorage.setField('PRICE_EXCLUSIVE', exclusivePrice);
			fieldStorage.setField('PRICE', this.calculatePriceWithTax(exclusivePrice, fieldStorage.getTaxRate()));
		}
		activateCustomized(fieldStorage) {
			fieldStorage.setField('CUSTOMIZED', 'Y');
		}
		updateDiscount(fieldStorage) {
			if (fieldStorage.isEmptyDiscount()) {
				this.clearResultPrices(fieldStorage);
			} else if (fieldStorage.isDiscountPercentage()) {
				fieldStorage.setField('DISCOUNT_SUM', fieldStorage.getPriceNetto() - fieldStorage.getPriceExclusive());
			} else if (fieldStorage.isDiscountMonetary()) {
				fieldStorage.setField('DISCOUNT_RATE', this.calculateDiscountRate(fieldStorage.getPriceNetto(), fieldStorage.getPriceNetto() - fieldStorage.getDiscountSum()));
			}
		}
		updateRowDiscount(fieldStorage) {
			fieldStorage.setField('DISCOUNT_ROW', fieldStorage.getDiscountSum() * fieldStorage.getQuantity());
		}
		updateTax(fieldStorage) {
			let sum;
			if (fieldStorage.isTaxIncluded()) {
				sum = fieldStorage.getPrice() * fieldStorage.getQuantity() * (1 - 1 / (1 + fieldStorage.getTaxRate() / 100));
			} else {
				sum = fieldStorage.getPriceExclusive() * fieldStorage.getQuantity() * (fieldStorage.getTaxRate() / 100);
			}
			fieldStorage.setField('TAX_SUM', sum);
		}
		updateSum(fieldStorage) {
			let sum;
			if (fieldStorage.isTaxIncluded()) {
				sum = fieldStorage.getPrice() * fieldStorage.getQuantity();
			} else {
				sum = this.calculatePriceWithTax(fieldStorage.getPriceExclusive() * fieldStorage.getQuantity(), fieldStorage.getTaxRate());
			}
			fieldStorage.setField('SUM', sum);
		}
		calculateDiscountRate(originalPrice, price) {
			if (originalPrice === 0.0) {
				return 0.0;
			}
			if (price === 0.0) {
				return originalPrice > 0 ? 100.0 : -100;
			}
			return (originalPrice - price) / originalPrice * 100;
		}
		calculatePriceWithoutTax(price, taxRate) {
			// Tax is not included in price
			return price / (1 + taxRate / 100);
		}
		calculatePriceWithTax(price, taxRate) {
			// Tax is included in price
			return price + price * taxRate / 100;
		}
		convertBasePriceForTaxIncluded(value, taxRate, fromTaxIncluded, toTaxIncluded) {
			if (!fromTaxIncluded || !toTaxIncluded || fromTaxIncluded === toTaxIncluded || !(taxRate > 0)) {
				return {
					converted: false,
					price: value
				};
			}
			if (fromTaxIncluded === 'Y' && toTaxIncluded === 'N') {
				return {
					converted: true,
					price: this.calculatePriceWithoutTax(value, taxRate)
				};
			}
			if (fromTaxIncluded === 'N' && toTaxIncluded === 'Y') {
				return {
					converted: true,
					price: this.calculatePriceWithTax(value, taxRate)
				};
			}
			return {
				converted: false,
				price: value
			};
		}
	}

	class ProductCalculator {
		#fields = {};
		#strategy = {};
		#settings = {};
		static DEFAULT_PRECISION = 8;
		constructor(fields = {}, settings = {}) {
			this.setFields(fields);
			this.setSettings(settings);
			this.setCalculationStrategy(new TaxForPriceStrategy(this));
		}
		setField(name, value) {
			this.#fields[name] = value;
			return this;
		}
		setCalculationStrategy(strategy = {}) {
			this.#strategy = strategy;
			return this;
		}
		setFields(fields) {
			for (const name in fields) {
				if (fields.hasOwnProperty(name)) {
					this.setField(name, fields[name]);
				}
			}
			return this;
		}
		getFields() {
			return {
				...this.#fields
			};
		}
		setSettings(settings = {}) {
			this.#settings = {
				...settings
			};
			return this;
		}
		getSettings() {
			return {
				...this.#settings
			};
		}
		#getSetting(name, defaultValue) {
			return this.#settings.hasOwnProperty(name) ? this.#settings[name] : defaultValue;
		}
		getPricePrecision() {
			return this.#getSetting('pricePrecision', ProductCalculator.DEFAULT_PRECISION);
		}
		getCommonPrecision() {
			return this.#getSetting('commonPrecision', ProductCalculator.DEFAULT_PRECISION);
		}
		getQuantityPrecision() {
			return this.#getSetting('quantityPrecision', ProductCalculator.DEFAULT_PRECISION);
		}
		calculateBasePrice(value) {
			return this.#strategy.calculateBasePrice(value);
		}
		calculatePrice(value) {
			return this.#strategy.calculatePrice(value);
		}
		calculateQuantity(value) {
			return this.#strategy.calculateQuantity(value);
		}
		calculateDiscount(value) {
			return this.#strategy.calculateDiscount(value);
		}
		calculateDiscountType(value) {
			return this.#strategy.calculateDiscountType(value);
		}
		calculateRowDiscount(value) {
			return this.#strategy.calculateRowDiscount(value);
		}
		calculateTax(value) {
			return this.#strategy.calculateTax(value);
		}
		calculateTaxIncluded(value) {
			return this.#strategy.calculateTaxIncluded(value);
		}
		calculateRowSum(value) {
			return this.#strategy.calculateRowSum(value);
		}
		convertBasePriceForTaxIncluded(value, taxRate, fromTaxIncluded, toTaxIncluded) {
			return this.#strategy.convertBasePriceForTaxIncluded(value, taxRate, fromTaxIncluded, toTaxIncluded);
		}
	}

	class TaxForSumStrategy extends TaxForPriceStrategy {
		calculatePriceWithoutTax(price, taxRate) {
			return price;
		}
		updateResultPrices(fieldStorage) {
			let exclusivePrice;
			if (fieldStorage.isDiscountPercentage()) {
				exclusivePrice = this.calculatePriceWithoutDiscount(fieldStorage.getPriceNetto(), fieldStorage.getDiscountRate(), DiscountType.PERCENTAGE);
			} else if (fieldStorage.isDiscountMonetary()) {
				exclusivePrice = this.calculatePriceWithoutDiscount(fieldStorage.getPriceNetto(), fieldStorage.getDiscountSum(), DiscountType.MONETARY);
			} else {
				exclusivePrice = fieldStorage.getPriceExclusive();
			}
			fieldStorage.setField('PRICE_EXCLUSIVE', exclusivePrice);
			if (fieldStorage.isTaxIncluded()) {
				fieldStorage.setField('PRICE', exclusivePrice);
			} else {
				fieldStorage.setField('PRICE', this.calculatePriceWithTax(exclusivePrice, fieldStorage.getTaxRate()));
			}
		}
	}

	exports.DiscountType = DiscountType;
	exports.ProductCalculator = ProductCalculator;
	exports.TaxForPriceStrategy = TaxForPriceStrategy;
	exports.TaxForSumStrategy = TaxForSumStrategy;

})(this.BX.Catalog = this.BX.Catalog || {}, BX, BX.Catalog);
//# sourceMappingURL=product.calculator.bundle.js.map
