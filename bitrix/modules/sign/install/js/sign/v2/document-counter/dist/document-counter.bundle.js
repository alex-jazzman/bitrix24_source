/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
(function (exports, main_core_events, ui_counterpanel, main_core) {
	'use strict';

	class Filter {
		#filter;
		constructor(options) {
			this.#filter = BX.Main.filterManager.getById(options.filterId);
		}
		toggleField(name, value, resetAllFields) {
			const field = this.#filter.getFieldByName(name);
			if (!main_core.Type.isPlainObject(field) || field === null) {
				return false;
			}
			const items = value.split('_');

			// eslint-disable-next-line no-shadow

			const filteredValues = field.ITEMS.filter(item => items.includes(item.VALUE)).map(item => item.VALUE);
			// const fieldValue = field.ITEMS.find((item) => item.VALUE === value);
			if (filteredValues.length === 0) {
				return false;
			}
			if (this.isFieldValueAlreadyApplied(name, filteredValues, resetAllFields)) {
				return false;
			}
			if (resetAllFields) {
				this.#filter.getApi().setFields({});
			}
			this.#filter.getApi().extendFilter({
				[name]: {
					...filteredValues
				}
			});
			return true;
		}
		getFilterRows() {
			return this.#filter.getFilterFieldsValues();
		}
		deactivate() {
			this.#filter.getApi().setFields({});
			this.#filter.getApi().apply();
		}
		isFieldValueAlreadyApplied(name, setValues, withoutOtherFilters) {
			const filterRows = this.getFilterRows();
			const currentValuesObject = filterRows[name];
			if (!main_core.Type.isObject(currentValuesObject)) {
				return false;
			}
			if (withoutOtherFilters && this.isSomeOtherFilterPresent(name)) {
				return false;
			}
			const currentValuesArray = Object.values(currentValuesObject);
			for (const setValue of setValues) {
				if (!currentValuesArray.includes(setValue)) {
					return false;
				}
			}
			if (withoutOtherFilters) {
				for (const currentValue of currentValuesArray) {
					if (!setValues.includes(currentValue)) {
						return false;
					}
				}
			}
			return true;
		}
		isSomeOtherFilterPresent(name) {
			for (const [key, value] of Object.entries(this.getFilterRows())) {
				const isPresent = main_core.Type.isStringFilled(value) || main_core.Type.isArrayFilled(value);
				if (key !== name && isPresent) {
					return true;
				}
			}
			return false;
		}
	}

	// BX.util.number_format defaults to two decimals and a dot as the thousands separator,
	// so every argument has to be passed explicitly.
	const DECIMALS = 0;
	const DECIMAL_SEPARATOR = '.';
	function formatCounterValue(value, thousandsSeparator) {
		// An empty string is a legal separator of a culture, so the type is checked instead of truthiness.
		const separator = main_core.Type.isString(thousandsSeparator) ? thousandsSeparator : '';
		return BX.util.number_format(normalizeValue(value), DECIMALS, DECIMAL_SEPARATOR, separator);
	}
	function normalizeValue(value) {
		if (main_core.Type.isNumber(value) && Number.isFinite(value)) {
			return value;
		}

		// "No data" must not silently turn into "zero signers"
		console.error('sign.v2.document-counter: counter value is not a finite number', value);
		const parsedValue = main_core.Text.toNumber(value);
		return Number.isFinite(parsedValue) ? parsedValue : 0;
	}

	const SYMBOL_SELECTOR = '.ui-counter__symbol';
	const TRUNCATION_SYMBOL = '+';

	// ui.cnt renders the sign node once, before the limit is raised, so the "+" of an already
	// truncated value survives the value rewrite. A percent counter shares the node — keep its sign.
	function clearTruncationSymbol(counterContainer) {
		const symbolNode = counterContainer?.querySelector(SYMBOL_SELECTOR);
		if (symbolNode?.textContent === TRUNCATION_SYMBOL) {
			main_core.Dom.adjust(symbolNode, {
				text: ''
			});
		}
	}

	// ui.cnt truncates a value above its limit to "<limit>+"; the exact number is rendered instead
	const EXACT_VALUE_LIMIT = Number.MAX_SAFE_INTEGER;
	const AIR_VALUE_SELECTOR = '.ui-counter__value';
	class DocumentCounter extends ui_counterpanel.CounterPanel {
		#filter;
		#resetAllFields;
		#thousandsSeparator;
		constructor(options) {
			super({
				target: options.target,
				items: DocumentCounter.getCounterItems(options.items),
				multiselect: false,
				title: options.title
			});
			this.#filter = new Filter({
				filterId: options.filterId
			});
			main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', this.#onActivateItem.bind(this));
			main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:deactivate', this.#onDeactivateItem.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.#onFilterApply.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Sign.DocumentCounter.Item:updateCounter', this.#onCounterUpdate.bind(this));
			this.#resetAllFields = Boolean(options?.resetAllFields);
			// An empty string is a legal separator of a culture, so the type is checked instead of truthiness
			this.#thousandsSeparator = main_core.Type.isString(options.thousandsSeparator) ? options.thousandsSeparator : '';
		}
		init() {
			super.init();

			// Same synchronous tick as the parent render, so the truncated value never flashes
			this.getItems().forEach(item => this.#applyExactValue(item));
		}
		static getCounterItems(items) {
			return items.map(item => {
				return {
					id: item.id,
					title: item.title,
					value: Number.parseInt(item.value, 10),
					isRestricted: item.isRestricted,
					color: item.color === 'THEME' ? 'GRAY' : item.color,
					hideValue: item.hideValue || false,
					isActive: item?.isActive === true
				};
			});
		}
		#onActivateItem(event) {
			const {
				name,
				value
			} = this.#getFieldData(event.getData());
			if (!this.#processItemSelection(name, value)) {
				event.preventDefault();
			}
		}
		#onDeactivateItem(event) {
			if (this.#isAllDeactivated()) {
				this.#filter.deactivate();
			}
		}
		#processItemSelection(name, value) {
			this.#filter.toggleField(name, value, this.#resetAllFields);
			return true;
		}
		#getFieldData(item) {
			const fieldData = item.id.split('__');
			return {
				name: fieldData[0].toUpperCase(),
				value: fieldData[1].toUpperCase()
			};
		}
		#isAllDeactivated() {
			return this.getItems().every(record => {
				return !record.isActive;
			});
		}
		#onFilterApply() {
			let compoundId = '';
			const filterRows = this.#filter.getFilterRows();
			const counterItemIds = new Set(this.items.map(item => item.id.toLowerCase()));
			const activeField = Object.entries(filterRows).find(row => {
				if (!main_core.Type.isPlainObject(row[1])) {
					return false;
				}
				const values = Object.values(row[1]);
				const result = [row[0], values.join('_')];
				compoundId = result.join('__').toLowerCase();
				return counterItemIds.has(compoundId);
			});
			this.getItems().forEach(item => {
				item.deactivate(false);
				if (activeField && item.id.toLowerCase() === compoundId) {
					// eslint-disable-next-line no-param-reassign
					item.activate(false);
				}
			});
		}
		#onCounterUpdate(event) {
			const {
				id,
				count
			} = event.getData();
			for (const item of this.getItems()) {
				if (item.id === id) {
					item.updateValue(count);
					this.#applyExactValue(item);
					const color = count > 0 ? 'DANGER' : 'GRAY';
					item.updateColor(color);
					break;
				}
			}
		}
		#applyExactValue(item) {
			const counter = item.counter;
			if (!counter || item.isRestricted || item.hideValue || !main_core.Type.isNumber(item.value)) {
				return;
			}

			// The air design redraws the value and the "+" sign from its own fields on every update,
			// so the limit has to be raised even though the text is overwritten right after
			counter.setMaxValue(EXACT_VALUE_LIMIT);
			const counterContainer = counter.getCounterContainer();
			const valueNode = this.#getValueNode(counterContainer);
			if (valueNode) {
				main_core.Dom.adjust(valueNode, {
					text: formatCounterValue(item.value, this.#thousandsSeparator)
				});
			}
			clearTruncationSymbol(counterContainer);
		}
		#getValueNode(counterContainer) {
			// Air keeps the value in a dedicated node next to the "+" sign, the classic design writes
			// the text into the counter container itself
			return counterContainer?.querySelector(AIR_VALUE_SELECTOR) ?? counterContainer;
		}
	}

	exports.DocumentCounter = DocumentCounter;

})(this.BX.Sign.V2 = this.BX.Sign.V2 || {}, BX.Event, BX.UI, BX);
//# sourceMappingURL=document-counter.bundle.js.map
