/* eslint-disable */
this.BX = this.BX || {};
this.BX.CRM = this.BX.CRM || {};
(function (exports, main_core) {
	'use strict';

	/**
	 * @memberOf BX.Crm.Kanban.Sort
	 */
	const Type = {
		BY_ID: 'BY_ID',
		BY_LAST_ACTIVITY_TIME: 'BY_LAST_ACTIVITY_TIME',
		isDefined(type) {
			return type === this.BY_ID || type === this.BY_LAST_ACTIVITY_TIME;
		},
		getAll() {
			return [this.BY_ID, this.BY_LAST_ACTIVITY_TIME];
		}
	};
	Object.freeze(Type);

	/**
	 * @memberOf BX.CRM.Kanban.Sort.Settings
	 */
	class Settings {
		#supportedTypes;
		#currentType;
		constructor(supportedTypes, currentType) {
			supportedTypes = main_core.Type.isArray(supportedTypes) ? supportedTypes : [];
			this.#supportedTypes = supportedTypes.filter(type => Type.isDefined(type));
			if (this.#supportedTypes.length <= 0) {
				throw new Error('No valid supported types provided');
			}
			if (!main_core.Type.isString(currentType) || !Type.isDefined(currentType)) {
				throw new Error('currentType is not a valid sort type');
			}
			if (!this.#supportedTypes.includes(currentType)) {
				throw new Error('currentType is not supported');
			}
			this.#currentType = currentType;
		}
		getSupportedTypes() {
			return this.#supportedTypes;
		}
		isTypeSupported(sortType) {
			return this.#supportedTypes.includes(sortType);
		}
		getCurrentType() {
			return this.#currentType;
		}
		static createFromJson(json) {
			const {
				supportedTypes,
				currentType
			} = JSON.parse(json);
			return new Settings(supportedTypes, currentType);
		}
	}

	let instance = null;

	/**
	 * @memberOf BX.CRM.Kanban.Sort
	 */
	class SettingsController {
		#grid;
		#settings;
		#sortChangePromise = null;
		static get Instance() {
			if (window.top !== window && main_core.Reflection.getClass('top.BX.CRM.Kanban.Sort.SettingsController')) {
				return window.top.BX.CRM.Kanban.Sort.SettingsController;
			}
			if (!instance) {
				throw new Error('SettingsController must be inited before use');
			}
			return instance;
		}
		static init(grid, settings) {
			if (instance) {
				console.warn('Attempt to re-init SettingsController');
				return;
			}
			instance = new SettingsController(grid, settings);
		}
		constructor(grid, settings) {
			if (instance) {
				throw new Error('SettingsController is a singleton, another instance exists already. Use Instance to access it');
			}
			if (!(grid instanceof BX.CRM.Kanban.Grid)) {
				console.error(grid);
				throw new Error('grid should be an instance of BX.CRM.Kanban.Grid');
			}
			this.#grid = grid;
			if (!(settings instanceof Settings)) {
				console.error(settings);
				throw new Error('settings should be an instance of Settings');
			}
			this.#settings = settings;
		}
		setCurrentSortType(sortType) {
			if (!this.#sortChangePromise) {
				this.#sortChangePromise = this.#grid.setCurrentSortType(sortType).then(() => {
					//save new current sort type
					this.#settings = new Settings(this.#settings.getSupportedTypes(), sortType);
					this.#grid.reload();
				}).catch(error => {
					console.error(error);
					throw error;
				}).finally(() => {
					this.#sortChangePromise = null;
				});
			}
			return this.#sortChangePromise;
		}
		getCurrentSettings() {
			return this.#settings;
		}
	}

	/**
	 * @memberOf BX.CRM.Kanban.Sort
	 */
	class Sorter {
		#sortType;
		#items;
		static createWithCurrentSortType(items) {
			return new Sorter(SettingsController.Instance.getCurrentSettings().getCurrentType(), items);
		}
		constructor(sortType, items) {
			if (!Type.isDefined(sortType)) {
				throw new Error('Undefined sort type');
			}
			this.#sortType = sortType;
			this.#items = main_core.Type.isArray(items) ? items : [];
		}
		getSortType() {
			return this.#sortType;
		}

		/**
		 * Returns items sorted in descending order. Beginning of array - is column top, end - column bottom.
		 *
		 * @returns {BX.CRM.Kanban.Item[]}
		 */
		getSortedItems() {
			let extractValue;
			if (this.#sortType === Type.BY_ID) {
				extractValue = this.#extractId;
			} else if (this.#sortType === Type.BY_LAST_ACTIVITY_TIME) {
				extractValue = this.#extractTimestamp;
			} else {
				throw new Error('Unknown sort type');
			}
			const sortedItems = Array.from(this.#items);
			sortedItems.sort((left, right) => {
				return extractValue(right) - extractValue(left);
			});
			return sortedItems;
		}
		#extractId(item) {
			return main_core.Text.toInteger(item.getData()?.sort?.id);
		}
		#extractTimestamp(item) {
			return main_core.Text.toInteger(item.getData()?.sort?.lastActivityTimestamp);
		}
		calcBeforeItem(item) {
			const sortParams = item.getData().sort;
			return main_core.Type.isPlainObject(sortParams) ? this.calcBeforeItemByParams(sortParams) : null;
		}
		calcBeforeItemByParams(sort) {
			const id = main_core.Text.toInteger(sort?.id);
			if (id <= 0) {
				return null;
			}
			if (this.#sortType === Type.BY_ID) {
				return this.#calcById(id);
			} else if (this.#sortType === Type.BY_LAST_ACTIVITY_TIME) {
				const lastActivityTimestamp = main_core.Text.toInteger(sort?.lastActivityTimestamp);
				if (lastActivityTimestamp <= 0) {
					return null;
				}
				return this.#calcByLastActivityTime(id, lastActivityTimestamp);
			} else {
				throw new Error('Unknown sort type');
			}
		}
		#calcById(id) {
			const notSortedItems = this.#items;
			for (let index = 0; index < notSortedItems.length; index++) {
				const item = notSortedItems[index];
				if (this.#extractId(item) === id) {
					return this.#findFirstDifferentItem(id, notSortedItems, index);
				}
			}
			return null;
		}
		#calcByLastActivityTime(id, lastActivityTimestamp) {
			const sortedItems = this.getSortedItems();
			for (let index = 0; index < sortedItems.length; index++) {
				const item = sortedItems[index];
				if (this.#extractTimestamp(item) <= lastActivityTimestamp) {
					return this.#findFirstDifferentItem(id, sortedItems, index);
				}
			}
			if (sortedItems.length > 0) {
				// item should be placed at bottom
				return sortedItems[sortedItems.length - 1];
			}

			// no items, place item on top
			return null;
		}
		#findFirstDifferentItem(itemId, items, startIndex) {
			for (let index = startIndex; index < items.length; index++) {
				const item = items[index];
				if (itemId !== this.#extractId(item)) {
					return item;
				}
			}
			return null;
		}
	}

	const namespace = main_core.Reflection.namespace('BX.CRM.Kanban.Sort');
	namespace.Sorter = Sorter;
	namespace.Settings = Settings;
	namespace.SettingsController = SettingsController;
	namespace.Type = Type;

	exports.Settings = Settings;
	exports.SettingsController = SettingsController;
	exports.Sorter = Sorter;
	exports.Type = Type;

})(this.BX.CRM.Kanban = this.BX.CRM.Kanban || {}, BX);
//# sourceMappingURL=sort.bundle.js.map
