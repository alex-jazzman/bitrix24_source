/* eslint-disable */
(function (main_core, main_core_events, ui_counterpanel) {
	'use strict';

	class EntityCounterType {
		// type ID
		static UNDEFINED = 0;
		static IDLE = 1;
		static PENDING = 2;
		static OVERDUE = 4;
		static INCOMING_CHANNEL = 8;
		static READY_TODO = 16;
		static CURRENT = 20; // READY_TODO|OVERDUE
		static ALL_DEADLINE_BASED = 7; //IDLE|PENDING|OVERDUE

		static ALL = 31; //IDLE|PENDING|OVERDUE|INCOMINGCHANNEL|READY_TODO

		// type name
		static IDLE_NAME = 'IDLE';
		static PENDING_NAME = 'PENDING';
		static OVERDUE_NAME = 'OVERDUE';
		static READY_TODO_NAME = 'READYTODO';
		static CURRENT_NAME = 'CURRENT';
		static INCOMING_CHANNEL_NAME = 'INCOMINGCHANNEL';
		static ALL_DEADLINE_BASED_NAME = 'ALLDEADLINEBASED';
		static ALL_NAME = 'ALL';
	}

	class EntityCounterFilterManager {
		static COUNTER_TYPE_FIELD = 'ACTIVITY_COUNTER';
		static EXCLUDED_FIELDS = ['FIND'];
		static FILTER_OTHER_USERS = 'other-users';
		#filterManager;
		#fields;
		#isActive = false;
		bindToFilter() {
			const filters = main_core.Type.isObject(BX.Main.filterManager) && BX.Main.filterManager.hasOwnProperty('getList') ? BX.Main.filterManager.getList() : Object.values(BX.Main.filterManager.data);
			if (filters.length === 0) {
				this.#isActive = false;
				console.warn('BX.Crm.EntityCounterFilter: Unable to define filter.');
			} else {
				this.#isActive = true;
				this.#filterManager = filters[0]; // use first filter to work
				this.#bindEvents();
				this.updateFields();
			}
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.#onFilterApply.bind(this));
		}
		#onFilterApply() {
			this.updateFields();
		}
		#isFilteredByField(field) {
			if (main_core.Type.isArray(this.#fields[field])) {
				return this.#fields[field].length > 0;
			}
			if (main_core.Type.isObject(this.#fields[field])) {
				return Object.values(this.#fields[field]).length > 0;
			}
			return this.#fields[field] !== '';
		}
		getManager() {
			return this.#filterManager;
		}
		isActive() {
			return this.#isActive;
		}
		getFields(isFilterEmpty = false) {
			if (isFilterEmpty) {
				const filtered = Object.entries(this.#fields).filter(([field, value]) => this.#isFilteredByField(field));
				return Object.fromEntries(filtered);
			}
			return this.#fields;
		}
		getApi() {
			return this.#filterManager.getApi();
		}
		updateFields() {
			this.#fields = this.#filterManager.getFilterFieldsValues();
		}
		isFilteredByFieldEx(field) {
			if (!Object.keys(this.#fields).includes(field) || field.endsWith('_datesel') || field.endsWith('_numsel') || field.endsWith('_label')) {
				return false;
			}
			return this.#isFilteredByField(field);
		}
		isFiltered(userId, typeId, entityTypeId, isOtherUsersFilter, counterUserFieldName) {
			if (userId === 0 || typeId === EntityCounterType.UNDEFINED) {
				return false;
			}
			let isFilteredByUser = this.isFilteredByFieldEx(counterUserFieldName);
			if (main_core.Type.isArray(this.#fields[counterUserFieldName]) && this.#fields[counterUserFieldName].length === 1) {
				let nodeValue = this.#fields[counterUserFieldName][0];
				try {
					const [type, value] = JSON.parse(this.#fields[counterUserFieldName][0]);
					nodeValue = value;
				} catch (error) {
					nodeValue = this.#fields[counterUserFieldName][0];
				}
				isFilteredByUser &&= isOtherUsersFilter ? nodeValue === EntityCounterFilterManager.FILTER_OTHER_USERS : parseInt(nodeValue, 10) === userId;
			} else {
				isFilteredByUser = false;
			}
			const hasFilteredByTypeValue = this.isFilteredByFieldEx(EntityCounterFilterManager.COUNTER_TYPE_FIELD) && main_core.Type.isObject(this.#fields[EntityCounterFilterManager.COUNTER_TYPE_FIELD]);
			const filteredTypeValues = hasFilteredByTypeValue ? Object.values(this.#fields[EntityCounterFilterManager.COUNTER_TYPE_FIELD]).map(item => parseInt(item, 10)).sort() : [];
			const isFilteredByType = filteredTypeValues.length === 1 && filteredTypeValues[0] === typeId || filteredTypeValues.length === 2 && typeId === EntityCounterType.CURRENT && filteredTypeValues[0] === EntityCounterType.READY_TODO && filteredTypeValues[1] === EntityCounterType.OVERDUE;
			const counterFields = [counterUserFieldName, EntityCounterFilterManager.COUNTER_TYPE_FIELD, ...EntityCounterFilterManager.EXCLUDED_FIELDS];
			const keysFields = Object.keys(this.#fields);
			const otherFields = [...counterFields.filter(item => !keysFields.includes(item)), ...keysFields.filter(x => !counterFields.includes(x))];
			const isOtherFilterUsed = otherFields.some(item => this.isFilteredByFieldEx(item));
			return isFilteredByUser && isFilteredByType && !isOtherFilterUsed;
		}
	}

	class EntityCounterManager {
		static lastInstance = null;
		#id;
		#entityTypeId;
		#codes;
		#extras;
		#withExcludeUsers = false;
		#counterData;
		#isRequestRunning;
		#lastPullEventData;
		#isTabActive;
		#openedSlidersCount;
		constructor(options) {
			if (!main_core.Type.isPlainObject(options)) {
				throw new TypeError('BX.Crm.EntityCounterManager: The "options" argument must be object.');
			}
			this.#id = main_core.Type.isString(options.id) ? options.id : '';
			if (this.#id === '') {
				throw new RangeError('BX.Crm.EntityCounterManager: The "id" argument must be specified.');
			}
			this.#entityTypeId = options.entityTypeId ? main_core.Text.toInteger(options.entityTypeId) : 0;
			this.#codes = main_core.Type.isArray(options.codes) ? options.codes : [];
			this.#extras = main_core.Type.isObject(options.extras) ? options.extras : {};
			this.#withExcludeUsers = main_core.Type.isBoolean(options.withExcludeUsers) ? options.withExcludeUsers : false;
			this.#counterData = {};
			this.#isTabActive = true;
			this.#openedSlidersCount = 0;
			this.constructor.lastInstance = this;
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('onPullEvent-main', main_core.Runtime.debounce(this.#onPullEvent, 3000, this));
			main_core.Event.ready(() => {
				main_core.Event.bind(document, 'visibilitychange', () => {
					this.#isTabActive = document.visibilityState === 'visible';
					if (this.#isTabActive && this.#isRecalculationRequired()) {
						this.#tryRecalculate(this.#lastPullEventData);
					}
				});
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onOpen', () => {
				this.#openedSlidersCount++;
				this.#isTabActive = false;
			});
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', () => {
				this.#openedSlidersCount--;
				if (this.#openedSlidersCount <= 0) {
					this.#openedSlidersCount = 0;
					this.#isTabActive = true;
					if (this.#isRecalculationRequired()) {
						this.#tryRecalculate(this.#lastPullEventData);
					}
				}
			});
		}
		#onPullEvent(event) {
			const [command, params] = event.getData();
			if (command !== 'user_counter') {
				return;
			}
			this.#lastPullEventData = params;
			if (!this.#isTabActive) {
				return;
			}
			this.#tryRecalculate(params);
		}
		#tryRecalculate(params) {
			let enableRecalculation = false;
			let enableRecalculationWithRequest = false;
			const counterData = this.#fetchCounterData(params);

			// eslint-disable-next-line no-restricted-syntax
			for (const counterId in counterData) {
				if (!Object.hasOwn(counterData, counterId) || !this.#codes.includes(counterId)) {
					continue;
				}
				const counterValue = BX.prop.getInteger(counterData, counterId, 0);
				if (counterValue < 0) {
					enableRecalculationWithRequest = true;
					break;
				}
				const currentCounterValue = BX.prop.getInteger(this.#counterData, counterId, 0);
				if (currentCounterValue !== counterValue) {
					enableRecalculation = true;

					// update counter data
					this.#counterData[counterId] = counterValue;
				}
			}
			if (enableRecalculationWithRequest) {
				this.#startRecalculationRequest();
			}
			if (enableRecalculation) {
				main_core_events.EventEmitter.emit(this, 'BX.Crm.EntityCounterManager:onRecalculate');
			}
		}
		#startRecalculationRequest() {
			if (this.#isRequestRunning) {
				return;
			}
			if (!this.#isTabActive) {
				return;
			}
			this.#isRequestRunning = true;
			const data = {
				entityTypeId: this.#entityTypeId,
				extras: this.#extras,
				withExcludeUsers: this.#withExcludeUsers ? 1 : 0
			};
			void main_core.ajax.runAction('crm.counter.list', {
				data
			}).then(this.#onRecalculationSuccess.bind(this));
		}
		#onRecalculationSuccess(result) {
			this.#isRequestRunning = false;
			const data = main_core.Type.isPlainObject(result.data) ? result.data : null;
			if (data === null) {
				return;
			}
			this.setCounterData(data);
			main_core_events.EventEmitter.emit('BX.Crm.EntityCounterManager:onRecalculate', this);
		}
		#fetchCounterData(params) {
			const currentSiteId = main_core.Loc.getMessage('SITE_ID');
			return main_core.Type.isPlainObject(params[currentSiteId]) ? params[currentSiteId] : {};
		}
		#isRecalculationRequired() {
			if (!this.#lastPullEventData) {
				return false;
			}
			const counterData = this.#fetchCounterData(this.#lastPullEventData);
			return Object.values(counterData).includes(-1);
		}
		getId() {
			return this.#id;
		}
		getCounterData() {
			return this.#counterData;
		}
		setCounterData(data) {
			this.#counterData = data;
		}
		static getLastInstance() {
			return this.lastInstance;
		}
	}

	const namespace = main_core.Reflection.namespace('BX.Crm');
	class EntityCounterPanel extends ui_counterpanel.CounterPanel {
		static EXCLUDE_USERS_CODE_SUFFIX = 'excl';
		static EXCLUDE_ALL_USERS_CODE_SUFFIX = 'all_excl';
		#id;
		#entityTypeId;
		#entityTypeName;
		#userId;
		#userName;
		#codes;
		#data;
		#counterManager;
		#filterManager;
		#filterLastPresetId;
		#filterLastPreset;
		#filterResponsibleFiledName;
		#lockedCallback;
		constructor(options) {
			if (!main_core.Type.isPlainObject(options)) {
				throw 'BX.Crm.EntityCounterPanel: The "options" argument must be object.';
			}
			const data = main_core.Type.isPlainObject(options.data) ? options.data : {};
			const withExcludeUsers = main_core.Type.isBoolean(options.withExcludeUsers) ? options.withExcludeUsers : false;
			super({
				target: BX(options.id),
				items: EntityCounterPanel.getCounterItems(data, options),
				multiselect: false,
				// disable multiselect for CRM counters
				title: main_core.Loc.getMessage('NEW_CRM_COUNTER_TITLE_MY')
			});
			this.#id = options.id;
			this.#entityTypeId = options.entityTypeId ? main_core.Text.toInteger(options.entityTypeId) : 0;
			this.#entityTypeName = options.entityTypeName;
			this.#userId = options.userId ? main_core.Text.toInteger(options.userId) : 0;
			this.#userName = main_core.Type.isStringFilled(options.userName) ? options.userName : this.#userId;
			this.#codes = main_core.Type.isArray(options.codes) ? options.codes : [];
			this.#data = data;
			this.#filterResponsibleFiledName = options.filterResponsibleFiledName;
			if (BX.CrmEntityType.isDefined(this.#entityTypeId)) {
				this.#counterManager = new EntityCounterManager({
					id: this.#id,
					entityTypeId: this.#entityTypeId,
					codes: this.#codes,
					extras: main_core.Type.isObject(options.extras) ? options.extras : {},
					withExcludeUsers
				});
			}
			this.#filterManager = new EntityCounterFilterManager();
			this.#filterLastPresetId = options.filterLastPresetId;
			this.#filterLastPreset = main_core.Type.isArray(options.filterLastPresetData) ? JSON.parse(options.filterLastPresetData[0]) : {
				presetId: null
			};
			this.#lockedCallback = main_core.Type.isStringFilled(options.lockedCallback) ? options.lockedCallback : null;
		}
		bindToFilter() {
			this.#filterManager.bindToFilter();
			this.#markCounters();
		}
		bindEvents() {
			this.#counterManager?.bindEvents();
			if (main_core.Type.isStringFilled(this.#lockedCallback)) {
				const elem = document.getElementById(this.#id);
				main_core.Event.bind(elem, 'click', () => {
					// eslint-disable-next-line no-eval
					eval(this.#lockedCallback);
				});
				return;
			}
			main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:activate', this.#onActivateItem.bind(this));
			main_core_events.EventEmitter.subscribe('BX.UI.CounterPanel.Item:deactivate', this.#onDeactivateItem.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', this.#onFilterApply.bind(this));
			main_core_events.EventEmitter.subscribe('BX.Crm.EntityCounterManager:onRecalculate', this.#onRecalculate.bind(this));
		}
		#onActivateItem(event) {
			const item = event.getData();
			if (!this.#processItemSelection(item)) {
				event.preventDefault();
			}
		}
		#onDeactivateItem(event) {
			this.#deactivateLinkedMenuItem(event.getData());
			if (this.#isAllDeactivated() && this.#filterManager.isActive()) {
				const api = this.#filterManager.getApi();
				if (this.#filterLastPreset.presetId === 'tmp_filter') {
					api.setFields(this.#filterLastPreset.fields);
					api.apply();
				} else {
					api.setFilter({
						preset_id: this.#filterLastPreset.presetId
					});
				}
			}
		}
		#onFilterApply() {
			if (this.#filterManager.isActive()) {
				this.#filterManager.updateFields();
			}
			this.#markCounters();
		}
		#onRecalculate() {
			const data = this.#counterManager.getCounterData();
			const parentItem = this.getItemById(EntityCounterPanel.getMenuParentItemId(this.#codes));
			for (let code in data) {
				if (!data.hasOwnProperty(code) || !(code.indexOf('crm') === 0 && data[code] >= 0) // HACK: Skip of CRM counter reset
				|| !this.#data.hasOwnProperty(code) || main_core.Text.toNumber(this.#data[code].VALUE) === main_core.Text.toNumber(data[code])) {
					continue;
				}
				this.#data[code].VALUE = data[code];
				const item = this.getItemById(code);
				item.updateValue(main_core.Text.toNumber(data[code]));
				item.updateColor(EntityCounterPanel.detectCounterItemColor(this.#data[code].TYPE_NAME, main_core.Text.toNumber(data[code])));
			}
			if (parentItem) {
				parentItem.updateValue(this.#getParentItemTotalValue());
			}
		}
		#processItemSelection(item) {
			const isOtherUsersFilter = item.id.endsWith(EntityCounterPanel.EXCLUDE_USERS_CODE_SUFFIX);
			const typeId = parseInt(this.#data[item.id].TYPE_ID, 10);
			if (typeId > 0) {
				if (this.#filterManager.isActive()) {
					const filteredFields = this.#filterManager.getFields(true);
					if (typeof filteredFields[EntityCounterFilterManager.COUNTER_TYPE_FIELD] === 'undefined') {
						this.#filterLastPreset.presetId = this.#filterManager.getApi().parent.getPreset().getCurrentPresetId();
						if (this.#filterLastPreset.presetId === 'tmp_filter') {
							this.#filterLastPreset.fields = filteredFields;
						}
						BX.userOptions.save('crm', this.#filterLastPresetId, '', JSON.stringify(this.#filterLastPreset));
					}
					const userId = isOtherUsersFilter ? EntityCounterFilterManager.FILTER_OTHER_USERS : this.#userId.toString();
					const userName = isOtherUsersFilter ? main_core.Loc.getMessage('NEW_CRM_COUNTER_TYPE_OTHER') : this.#userName;
					const counterTypeId = this.#prepareFilterTypeId(typeId);
					const filterItem = JSON.stringify([isOtherUsersFilter ? 'meta-user' : 'user', userId]);
					const api = this.#filterManager.getApi();
					let fields = {
						"ACTIVITY_COUNTER": BX.Type.isPlainObject(counterTypeId) ? counterTypeId : {
							0: counterTypeId
						}
					};
					const responsibleField = this.#filterResponsibleFiledName;
					fields = {
						...fields,
						[responsibleField]: {
							0: filterItem
						},
						[`${responsibleField}_label`]: [userName]
					};
					api.setFields(fields);
					api.apply({
						'COUNTER': this.#makeFilterAnalyticsLabel(counterTypeId)
					});
				} else {
					return false;
				}
			}
			return true;
		}

		// entityTypeName
		#makeFilterAnalyticsLabel(counterTypeId) {
			if (this.#entityTypeName && counterTypeId) {
				return 'CRM_' + this.#entityTypeName + '_COUNTER_TYPE_' + counterTypeId;
			}
			return '';
		}
		#prepareFilterTypeId(typeId) {
			if (typeId === EntityCounterType.CURRENT) {
				return {
					0: EntityCounterType.OVERDUE.toString(),
					1: EntityCounterType.READY_TODO.toString()
				};
			}
			return typeId.toString();
		}
		#markCounters() {
			if (!this.#filterManager.isActive()) {
				return;
			}
			const parentItem = this.getItemById(EntityCounterPanel.getMenuParentItemId(this.#codes));
			let isOtherUsersFilterUse = false;
			Object.entries(this.#data).forEach(([code, record]) => {
				let item = this.getItemById(code);
				const isOtherUsersFilter = item.id.endsWith(EntityCounterPanel.EXCLUDE_USERS_CODE_SUFFIX);
				const isFiltered = this.#filterManager.isFiltered(this.#userId, parseInt(record.TYPE_ID, 10), this.#entityTypeId, isOtherUsersFilter, this.#filterResponsibleFiledName);
				if (isFiltered) {
					item.activate(false);
					if (isOtherUsersFilter) {
						isOtherUsersFilterUse = true;
					}
				} else {
					item.deactivate(false);
				}

				// TODO: need fix it in parent CounterItem class
				if (item.value !== item.counter.getValue()) {
					item.updateValue(item.value);
				}
			});
			if (parentItem) {
				isOtherUsersFilterUse ? parentItem.activate(false) : parentItem.deactivate(false);
			}
		}
		#isAllDeactivated() {
			return this.getItems().every(record => {
				return !record.isActive;
			});
		}
		#deactivateLinkedMenuItem(item) {
			if (item.hasParentId()) {
				const parentItem = this.getItemById(EntityCounterPanel.getMenuParentItemId(this.#codes));
				parentItem.deactivate(false);
				return;
			}
			if (item.parent) {
				item.getItems().forEach(childItemId => {
					let childItem = this.getItemById(childItemId);
					if (childItem.isActive) {
						childItem.deactivate(false);
					}
				});
			}
		}
		#getParentItemTotalValue() {
			let result = 0;
			this.getItems().forEach(record => {
				if (record.hasParentId()) {
					result += record.value;
				}
			});
			return result;
		}
		init() {
			super.init();
			this.#markCounters();
		}
		getId() {
			return this.#id;
		}
		static getCounterItems(input, options) {
			const withExcludeUsers = main_core.Type.isBoolean(options.withExcludeUsers) ? options.withExcludeUsers : false;
			const isRestricted = main_core.Type.isStringFilled(options.lockedCallback);
			const parentItemId = EntityCounterPanel.getMenuParentItemId(main_core.Type.isArray(options.codes) ? options.codes : []);
			let otherUsersItems = [];
			if (withExcludeUsers && !main_core.Type.isUndefined(parentItemId)) {
				let parentTotal = 0;
				otherUsersItems = Object.entries(input).map(([code, item]) => {
					if (code.endsWith(EntityCounterPanel.EXCLUDE_USERS_CODE_SUFFIX)) {
						const value = parseInt(item.VALUE, 10);
						parentTotal += value;
						const color = EntityCounterPanel.detectCounterItemColor(item.TYPE_NAME, value);
						return {
							id: code,
							title: main_core.Loc.getMessage('NEW_CRM_COUNTER_TYPE_OTHER_' + item.TYPE_NAME),
							value: {
								value: value,
								order: -1
							},
							color: color === 'THEME' ? 'GRAY' : color,
							// override color to correct display on different themes
							parentId: parentItemId
						};
					}
				}, this);

				// add parent item
				otherUsersItems = [{
					id: parentItemId,
					title: main_core.Loc.getMessage('NEW_CRM_COUNTER_TYPE_OTHER_TITLE'),
					value: {
						value: parentTotal,
						order: -1
					},
					isRestricted: isRestricted,
					color: 'THEME'
				}].concat(otherUsersItems);
			}
			let currentUserItems = Object.entries(input).map(([code, item]) => {
				if (!code.endsWith(EntityCounterPanel.EXCLUDE_USERS_CODE_SUFFIX)) {
					const value = parseInt(item.VALUE, 10);
					return {
						id: code,
						title: main_core.Loc.getMessage('NEW_CRM_COUNTER_TYPE_' + item.TYPE_NAME),
						value: value,
						isRestricted: isRestricted,
						color: EntityCounterPanel.detectCounterItemColor(item.TYPE_NAME, value)
					};
				}
			}, this);
			return currentUserItems.concat(otherUsersItems).filter(item => main_core.Type.isObject(item));
		}
		static getMenuParentItemId(codes) {
			return codes.find(element => element.endsWith(EntityCounterPanel.EXCLUDE_ALL_USERS_CODE_SUFFIX));
		}
		static detectCounterItemColor(type, value) {
			const isRedCounter = [EntityCounterType.IDLE_NAME, EntityCounterType.OVERDUE_NAME, EntityCounterType.CURRENT_NAME].includes(type);
			const isGreenCounter = [EntityCounterType.INCOMING_CHANNEL_NAME].includes(type);
			return value > 0 ? isRedCounter ? 'DANGER' : isGreenCounter ? 'SUCCESS' : 'THEME' : 'THEME';
		}
	}
	namespace.EntityCounterPanel = EntityCounterPanel;

})(BX, BX.Event, BX.UI);
//# sourceMappingURL=script.js.map
