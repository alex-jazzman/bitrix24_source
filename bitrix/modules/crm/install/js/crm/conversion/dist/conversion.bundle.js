/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, crm_integration_analytics, main_core_events, main_popup, ui_analytics, ui_buttons, ui_dialogs_messagebox, ui_forms, crm_categoryModel, ui_entitySelector) {
	'use strict';

	/**
	 * @memberOf BX.Crm.Conversion
	 */
	class ConfigItem {
		#active;
		#enableSync;
		#initData = {};
		#entityTypeId;
		#title;
		constructor(params) {
			this.#entityTypeId = Number(params.entityTypeId);
			this.#active = this.#internalizeBooleanValue(params.active);
			this.#enableSync = this.#internalizeBooleanValue(params.enableSync);
			if (main_core.Type.isPlainObject(params.initData)) {
				this.#initData = params.initData;
			}
			this.#title = String(params.title);
		}
		#internalizeBooleanValue(value) {
			if (main_core.Type.isBoolean(value)) {
				return value;
			}
			if (main_core.Type.isString(value)) {
				return value === 'Y';
			}
			return Boolean(value);
		}
		externalize() {
			return {
				entityTypeId: this.getEntityTypeId(),
				title: this.getTitle(),
				initData: this.getInitData(),
				active: this.isActive() ? 'Y' : 'N',
				enableSync: this.isEnableSync() ? 'Y' : 'N'
			};
		}
		isActive() {
			return this.#active;
		}
		setActive(active) {
			this.#active = active;
			return this;
		}
		isEnableSync() {
			return this.#enableSync;
		}
		setEnableSync(enableSync) {
			this.#enableSync = enableSync;
			return this;
		}
		getInitData() {
			return this.#initData || {};
		}
		setInitData(data) {
			this.#initData = data;
			return this;
		}
		getEntityTypeId() {
			return this.#entityTypeId;
		}
		getTitle() {
			return this.#title;
		}
		setTitle(title) {
			this.#title = title;
			return this;
		}
	}

	/**
	 * @memberOf BX.Crm.Conversion
	 */
	class SchemeItem {
		#id;
		#name;
		#entityTypeIds;
		#phrase;
		#availabilityLock;
		constructor(params) {
			this.#id = String(params.id);
			this.#name = String(params.name);
			this.#phrase = String(params.phrase);
			this.#availabilityLock = String(params.availabilityLock);
			this.#entityTypeIds = [];
			if (main_core.Type.isArray(params.entityTypeIds)) {
				params.entityTypeIds.forEach(entityTypeId => {
					this.#entityTypeIds.push(Number(entityTypeId));
				});
			}
		}
		getId() {
			return this.#id;
		}
		getName() {
			return this.#name;
		}
		getEntityTypeIds() {
			return this.#entityTypeIds;
		}
		getPhrase() {
			return this.#phrase;
		}
		getAvailabilityLock() {
			return this.#availabilityLock;
		}
	}

	/**
	 * @memberOf BX.Crm.Conversion
	 */
	class Scheme {
		#currentItemId;
		#items = [];
		constructor(currentItemId, items) {
			this.#currentItemId = main_core.Type.isNull(currentItemId) ? currentItemId : String(currentItemId);
			if (main_core.Type.isArray(items)) {
				items.forEach(item => {
					if (item instanceof SchemeItem) {
						this.#items.push(item);
					} else {
						console.error(
						// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
						`SchemeItem is invalid in Scheme constructor. Expected instance of SchemeItem, got ${typeof item}`);
					}
				});
			}
		}
		static create(params) {
			const schemeItems = [];
			params.items.forEach(item => {
				schemeItems.push(new SchemeItem(item));
			});
			return new Scheme(params.currentItemId, schemeItems);
		}
		getCurrentItem() {
			if (!this.#items || this.#items.length === 0) {
				return null;
			}
			const item = this.getItemById(this.#currentItemId);
			return item || this.#items[0];
		}
		setCurrentItemId(currentItemId) {
			this.#currentItemId = currentItemId;
		}
		getItems() {
			return this.#items;
		}
		getItemById(itemId) {
			for (const item of this.#items) {
				if (item.getId() === itemId) {
					return item;
				}
			}
			return null;
		}
		getItemForSingleEntityTypeId(entityTypeId) {
			for (const item of this.#items) {
				const entityTypeIds = item.getEntityTypeIds();
				if (entityTypeIds.length === 1 && [...entityTypeIds][0] === entityTypeId) {
					return item;
				}
			}
			return null;
		}
		getItemForEntityTypeIds(entityTypeIds) {
			const makeIntSet = input => {
				// Set - to remove possible duplicates in the array
				return new Set(input.map(id => main_core.Text.toInteger(id)));
			};
			const targetEntityTypeIds = [...makeIntSet(entityTypeIds)];
			for (const item of this.#items) {
				const itemSet = makeIntSet(item.getEntityTypeIds());
				if (targetEntityTypeIds.length !== itemSet.size) {
					continue;
				}
				const notFoundTargetIds = targetEntityTypeIds.filter(entityTypeId => !itemSet.has(entityTypeId));
				if (notFoundTargetIds.length <= 0) {
					return item;
				}
			}
			return null;
		}
		getAllEntityTypeIds() {
			const entityTypeIds = new Set();
			for (const item of this.#items) {
				for (const entityTypeId of item.getEntityTypeIds()) {
					entityTypeIds.add(entityTypeId);
				}
			}
			return [...entityTypeIds];
		}
	}

	/**
	 * @memberOf BX.Crm.Conversion
	 */
	class Config {
		#entityTypeId;
		#items = [];
		#scheme;
		constructor(entityTypeId, items, scheme) {
			this.#entityTypeId = Number(entityTypeId);
			if (main_core.Type.isArray(items)) {
				items.forEach(item => {
					if (item instanceof ConfigItem) {
						this.#items.push(item);
					} else {
						console.error(
						// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
						`ConfigItem is invalid in Config constructor. Expected instance of ConfigItem, got ${typeof item}`);
					}
				});
			}
			if (scheme instanceof Scheme) {
				this.#scheme = scheme;
			} else {
				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-typeof
				console.error(`Scheme is invalid in Config constructor. Expected instance of Scheme, got ${typeof scheme}`);
			}
		}
		static create(entityTypeId, items, scheme) {
			const configItems = [];
			items.forEach(item => {
				configItems.push(new ConfigItem(item));
			});
			return new Config(entityTypeId, configItems, scheme);
		}
		getEntityTypeId() {
			return this.#entityTypeId;
		}
		getItems() {
			return this.#items;
		}
		getActiveItems() {
			return this.#items.filter(item => item.isActive());
		}
		getScheme() {
			return this.#scheme;
		}
		updateFromSchemeItem(schemeItem = null) {
			let selectedSchemeItem = null;
			if (schemeItem) {
				selectedSchemeItem = schemeItem;
				this.getScheme().setCurrentItemId(schemeItem.getId());
			} else {
				selectedSchemeItem = this.getScheme().getCurrentItem();
			}
			const activeEntityTypeIds = selectedSchemeItem.getEntityTypeIds();
			this.#items.forEach(item => {
				const isActive = activeEntityTypeIds.includes(item.getEntityTypeId());
				item.setEnableSync(isActive);
				item.setActive(isActive);
			});
			return this;
		}
		getItemByEntityTypeId(entityTypeId) {
			for (const item of this.#items) {
				if (item.getEntityTypeId() === entityTypeId) {
					return item;
				}
			}
			return null;
		}
		externalize() {
			const data = {};
			this.getItems().forEach(item => {
				data[BX.CrmEntityType.resolveName(item.getEntityTypeId()).toLowerCase()] = item.externalize();
			});
			return data;
		}
		updateItems(items) {
			this.#items = [];
			items.forEach(item => {
				this.#items.push(new ConfigItem(item));
			});
			return this;
		}
	}

	let instance$1 = null;
	class CategoryRepository {
		#extensionSettings = main_core.Extension.getSettings('crm.conversion');
		#storage = new Map();
		static get Instance() {
			if (instance$1 === null) {
				instance$1 = new CategoryRepository();
			}
			return instance$1;
		}
		isCategoriesEnabled(entityTypeId) {
			return Boolean(this.#extensionSettings.get(`isCategoriesEnabled.${entityTypeId}`, false));
		}
		getCategories(entityTypeId) {
			if (this.#storage.has(entityTypeId)) {
				return Promise.resolve(this.#storage.get(entityTypeId));
			}
			return main_core.ajax.runAction('crm.conversion.getDstCategoryList', {
				data: {
					entityTypeId
				}
			}).then(({
				data
			}) => {
				const models = [];
				data?.categories?.forEach(categoryData => {
					models.push(new crm_categoryModel.CategoryModel(categoryData));
				});
				this.#storage.set(entityTypeId, models);
				return models;
			});
		}
	}

	// eslint-disable-next-line unicorn/numeric-separators-style
	const REQUIRED_FIELDS_INFOHELPER_CODE = 8233923;

	/**
	 * @memberOf BX.Crm.Conversion
	 */
	class Converter {
		#entityTypeId;
		#entityId;
		#config;
		#params;
		#isProgress;
		#isSynchronisationAllowed;
		#fieldsSynchronizer;
		#data;
		constructor(entityTypeId, config, params) {
			this.#entityTypeId = Number(entityTypeId);
			if (config instanceof Config) {
				this.#config = config;
			} else {
				console.error('Config is invalid in Converter constructor. Expected instance of Config', config, this);
			}
			this.#params = params ?? {};
			this.#params.id = main_core.Type.isStringFilled(this.#params.id) ? this.#params.id : main_core.Text.getRandom();
			this.#params.analytics = this.#filterExternalAnalytics(this.#params.analytics);
			this.#isProgress = false;
			this.#isSynchronisationAllowed = false;
			this.#entityId = 0;
		}
		getEntityTypeId() {
			return this.#entityTypeId;
		}
		getConfig() {
			return this.#config;
		}
		getId() {
			return this.#params.id;
		}
		getServiceUrl() {
			const serviceUrl = this.#params.serviceUrl;
			if (!serviceUrl) {
				return null;
			}
			const additionalParams = {
				action: 'convert'
			};
			this.getConfig().getItems().forEach(item => {
				additionalParams[BX.CrmEntityType.resolveName(item.getEntityTypeId()).toLowerCase()] = item.isActive() ? 'Y' : 'N';
			});
			return BX.util.add_url_param(serviceUrl, additionalParams);
		}
		getOriginUrl() {
			if (this.#params && 'originUrl' in this.#params) {
				return String(this.#params.originUrl);
			}
			return null;
		}
		isRedirectToDetailPageEnabled() {
			if (this.#params && 'isRedirectToDetailPageEnabled' in this.#params) {
				return this.#params.isRedirectToDetailPageEnabled;
			}
			return true;
		}

		/**
		 * Overwrite current analytics[c_element] param.
		 * Note that you are not allowed to change analytics[c_sub_section] - its by design.
		 *
		 * @param c_element
		 * @returns {BX.Crm.Conversion.Converter}
		 */
		// eslint-disable-next-line camelcase
		setAnalyticsElement(c_element) {
			// eslint-disable-next-line camelcase
			const filtered = this.#filterExternalAnalytics({
				c_element
			});
			if ('c_element' in filtered) {
				this.#params.analytics.c_element = filtered.c_element;
			}
			return this;
		}
		convertBySchemeItemId(schemeItemId, entityId, data) {
			const targetSchemeItem = this.#config.getScheme().getItemById(schemeItemId);
			if (!targetSchemeItem) {
				console.error('Scheme is not found', schemeItemId, this);
				return;
			}
			this.#config.updateFromSchemeItem(targetSchemeItem);
			this.convert(entityId, data);
		}
		convert(entityId, data) {
			this.#entityId = entityId;
			this.#data = data;
			const schemeItem = this.#config.getScheme().getCurrentItem();
			if (!schemeItem) {
				console.error('Scheme is not found', this);
				return Promise.reject();
			}
			if (main_core.Type.isStringFilled(schemeItem.getAvailabilityLock())) {
				// eslint-disable-next-line no-eval
				eval(schemeItem.getAvailabilityLock());
				return Promise.reject();
			}
			return this.#collectAdditionalData(schemeItem).then(result => {
				if (result.isCanceled) {
					// pass it to next 'then' handler
					return result;
				}
				return this.#request();
			}).then(result => {
				if (!result.isFinished) {
					// dont need to register anything in statistics

					return;
				}
				const status = result.isCanceled ? crm_integration_analytics.Dictionary.STATUS_CANCEL : crm_integration_analytics.Dictionary.STATUS_SUCCESS;
				this.#config.getActiveItems().forEach(item => {
					this.#sendAnalyticsData(item.getEntityTypeId(), status);
				});
			}).catch(error => {
				if (error) {
					// eslint-disable-next-line no-console
					console.log('Convert error', error, this);
				}
				this.#config.getActiveItems().forEach(item => {
					this.#sendAnalyticsData(item.getEntityTypeId(), crm_integration_analytics.Dictionary.STATUS_ERROR);
				});
			});
		}
		#request() {
			const promise = new Promise((resolve, reject) => {
				const serviceUrl = this.getServiceUrl();
				if (!serviceUrl) {
					console.error('Convert endpoint is not specifier');
					reject();
					return;
				}
				if (this.#isProgress) {
					console.error('Another request is in progress');
					reject();
					return;
				}
				this.#isProgress = true;
				main_core.ajax({
					url: serviceUrl,
					method: 'POST',
					dataType: 'json',
					data: {
						MODE: 'CONVERT',
						ENTITY_ID: this.#entityId,
						ENABLE_SYNCHRONIZATION: this.#isSynchronisationAllowed ? 'Y' : 'N',
						ENABLE_REDIRECT_TO_SHOW: this.isRedirectToDetailPageEnabled() ? 'Y' : 'N',
						CONFIG: this.getConfig().externalize(),
						CONTEXT: this.#data,
						ORIGIN_URL: this.getOriginUrl()
					},
					onsuccess: resolve,
					onfailure: reject
				});
			});
			return promise.then(response => {
				this.#isProgress = false;
				return this.#onRequestSuccess(response);
			}).catch(error => {
				this.#isProgress = false;
				if (main_core.Type.isStringFilled(error)) {
					// response may contain info about action required from user
					ui_dialogs_messagebox.MessageBox.alert(main_core.Text.encode(error));
				}

				// pass error to next 'catch'
				throw error;
			});
		}
		#sendAnalyticsData(dstEntityTypeId, status) {
			const builder = crm_integration_analytics.Builder.Entity.ConvertEvent.createDefault(this.#entityTypeId, dstEntityTypeId).setSection(this.#params.analytics.c_section).setSubSection(this.#params.analytics.c_sub_section).setElement(this.#params.analytics.c_element).setStatus(status);
			ui_analytics.sendData(builder.buildData());
		}
		#filterExternalAnalytics(analytics) {
			if (!main_core.Type.isPlainObject(analytics)) {
				return {};
			}
			const allowedKeys = new Set(['c_section', 'c_sub_section', 'c_element']);
			const result = {};
			for (const [key, value] of Object.entries(analytics)) {
				if (allowedKeys.has(key) && main_core.Type.isStringFilled(value)) {
					result[key] = value;
				}
			}
			return result;
		}
		#onRequestSuccess(response) {
			return new Promise((resolve, reject) => {
				if (response.ERROR) {
					reject(response.ERROR?.MESSAGE || response.ERROR || 'Error during conversion');
					return;
				}
				if (main_core.Type.isPlainObject(response.REQUIRED_ACTION)) {
					resolve(this.#processRequiredAction(response.REQUIRED_ACTION));
					return;
				}
				const data = main_core.Type.isPlainObject(response.DATA) ? response.DATA : {};
				if (!data) {
					reject();
					return;
				}
				const resolveResult = {
					isCanceled: false,
					isFinished: true
				};
				const redirectUrl = main_core.Type.isString(data.URL) ? data.URL : '';
				if (data.IS_FINISHED === 'Y') {
					// result entity was created on backend, conversion is finished
					this.#data = {};
					const wasRedirectedInExternalEventHandler = this.#emitConvertedEvent(redirectUrl);
					if (wasRedirectedInExternalEventHandler) {
						resolve(resolveResult);
						return;
					}
				} else {
					// backend could not create result entity automatically, user interaction is required
					resolveResult.isFinished = false;
				}
				if (redirectUrl) {
					const redirectUrlObject = new main_core.Uri(redirectUrl);
					const currentRedirectUrlAnalytics = redirectUrlObject.getQueryParam('st') || {};
					redirectUrlObject.setQueryParam('st', {
						...this.#params.analytics,
						...currentRedirectUrlAnalytics
					});
					BX.Crm.Page.open(redirectUrlObject.toString());
				}
				resolve(resolveResult);
			});
		}
		#collectAdditionalData(schemeItem) {
			const config = this.getConfig();
			const promises = [];
			schemeItem.getEntityTypeIds().forEach(entityTypeId => {
				promises.push(() => {
					return this.#getCategoryForEntityTypeId(entityTypeId);
				});
			});
			const result = {
				isCanceled: false,
				isFinished: true
			};
			const promiseIterator = (receivedPromises, index = 0) => {
				return new Promise((resolve, reject) => {
					if (result.isCanceled || !receivedPromises[index]) {
						resolve(result);
						return;
					}
					receivedPromises[index]().then(categoryResult => {
						if (categoryResult.isCanceled) {
							result.isCanceled = true;
						} else if (categoryResult.category) {
							const entityTypeId = categoryResult.category.getEntityTypeId();
							const configItem = config.getItemByEntityTypeId(entityTypeId);
							if (!configItem) {
								console.error(`Scheme is not correct: configItem is not found for ${entityTypeId}`, this);
								reject();
								return;
							}
							const initData = configItem.getInitData();
							initData.categoryId = categoryResult.category.getId();
							configItem.setInitData(initData);
						}
						resolve(promiseIterator(receivedPromises, index + 1));
					}).catch(reject);
				});
			};
			return promiseIterator(promises);
		}
		#getCategoryForEntityTypeId(entityTypeId) {
			return new Promise((resolve, reject) => {
				const configItem = this.getConfig().getItemByEntityTypeId(entityTypeId);
				if (!configItem) {
					console.error(`Scheme is not correct: configItem is not found for ${entityTypeId}`, this);
					reject();
					return;
				}
				if (this.#isNeedToLoadCategories(entityTypeId)) {
					CategoryRepository.Instance.getCategories(entityTypeId).then(categories => {
						if (categories.length > 1) {
							resolve(this.#showCategorySelector(categories, configItem.getTitle()));
						} else {
							resolve({
								isCanceled: false,
								category: categories[0]
							});
						}
					}).catch(reject);
				} else {
					resolve({
						isCanceled: false,
						category: null
					});
				}
			});
		}
		#isNeedToLoadCategories(entityTypeId) {
			return CategoryRepository.Instance.isCategoriesEnabled(entityTypeId);
		}
		#showCategorySelector(categories, title) {
			return new Promise(resolve => {
				const categorySelectorContent = main_core.Tag.render`
				<div class="crm-converter-category-selector ui-form ui-form-line">
					<div class="ui-form-row">
						<div class="crm-converter-category-selector-label ui-form-label">
							<div class="ui-ctl-label-text">${main_core.Loc.getMessage('CRM_COMMON_CATEGORY')}</div>
						</div>
						<div class="ui-form-content">
							<div class="crm-converter-category-selector-select ui-ctl ui-ctl-after-icon ui-ctl-dropdown">
								<div class="ui-ctl-after ui-ctl-icon-angle"></div>
								<select class="ui-ctl-element"></select>
							</div>
						</div>
					</div>
				</div>
			`;
				const select = categorySelectorContent.querySelector('select');
				categories.forEach(category => {
					main_core.Dom.append(main_core.Tag.render`<option value="${category.getId()}">${main_core.Text.encode(category.getName())}</option>`, select);
				});
				const popup = new main_popup.Popup({
					titleBar: main_core.Loc.getMessage('CRM_CONVERSION_CATEGORY_SELECTOR_TITLE', {
						'#ENTITY#': main_core.Text.encode(title)
					}),
					content: categorySelectorContent,
					closeByEsc: true,
					closeIcon: true,
					buttons: [new ui_buttons.Button({
						text: main_core.Loc.getMessage('CRM_COMMON_ACTION_SAVE'),
						color: ui_buttons.ButtonColor.SUCCESS,
						onclick: () => {
							const value = [...select.selectedOptions][0].value;
							popup.destroy();
							for (const category of categories) {
								if (category.getId() === Number(value)) {
									resolve({
										category
									});
									return true;
								}
							}
							console.error('Selected category not found', value, categories);
							resolve({
								isCanceled: true
							});
							return true;
						}
					}), new ui_buttons.Button({
						text: main_core.Loc.getMessage('CRM_COMMON_ACTION_CANCEL'),
						color: ui_buttons.ButtonColor.LIGHT,
						onclick: () => {
							popup.destroy();
							resolve({
								isCanceled: true
							});
							return true;
						}
					})],
					events: {
						onClose: () => {
							resolve({
								isCanceled: true
							});
						}
					}
				});
				popup.show();
			});
		}
		#processRequiredAction(action) {
			const name = String(action.NAME);
			const data = main_core.Type.isPlainObject(action.DATA) ? action.DATA : {};
			if (name === 'SYNCHRONIZE') {
				let newConfig = null;
				if (main_core.Type.isArray(data.CONFIG)) {
					newConfig = data.CONFIG;
				} else if (main_core.Type.isPlainObject(data.CONFIG)) {
					newConfig = Object.values(data.CONFIG);
				}
				if (newConfig) {
					this.#config.updateItems(newConfig);
				}
				return this.#synchronizeFields(main_core.Type.isArray(data.FIELD_NAMES) ? data.FIELD_NAMES : []);
			}
			if (name === 'CORRECT' && main_core.Type.isPlainObject(data.CHECK_ERRORS)) {
				return this.#askToFillRequiredFields(data);
			}
			return Promise.resolve({
				isCanceled: false,
				isFinished: true
			});
		}
		#synchronizeFields(fieldNames) {
			const synchronizer = this.#getFieldsSynchronizer(fieldNames);
			return new Promise(resolve => {
				const listener = (sender, args) => {
					const isConversionCancelled = main_core.Type.isBoolean(args.isCanceled) && args.isCanceled === true;
					if (isConversionCancelled) {
						synchronizer.removeClosingListener(listener);
						resolve({
							isCanceled: true,
							isFinished: true
						});
						return;
					}
					this.#isSynchronisationAllowed = true;
					this.#config.updateItems(Object.values(this.#fieldsSynchronizer.getConfig()));
					synchronizer.removeClosingListener(listener);
					resolve(this.#request());
				};
				synchronizer.addClosingListener(listener);
				synchronizer.show();
			});
		}
		#getFieldsSynchronizer(fieldNames) {
			if (!this.#fieldsSynchronizer) {
				this.#fieldsSynchronizer = BX.CrmEntityFieldSynchronizationEditor.create(`crm_converter_fields_synchronizer_${this.getEntityTypeId()}`, {
					config: this.#config.externalize(),
					title: this.#getMessage('dialogTitle'),
					fieldNames,
					legend: this.#getMessage('syncEditorLegend'),
					fieldListTitle: this.#getMessage('syncEditorFieldListTitle'),
					entityListTitle: this.#getMessage('syncEditorEntityListTitle'),
					continueButton: this.#getMessage('continueButton'),
					cancelButton: this.#getMessage('cancelButton')
				});
			}
			this.#fieldsSynchronizer.setConfig(this.#config.externalize());
			this.#fieldsSynchronizer.setFieldNames(fieldNames);
			return this.#fieldsSynchronizer;
		}
		#askToFillRequiredFields(data) {
			// just in case that there is previous not yet closed editor
			BX.Crm.PartialEditorDialog.close('entity-converter-editor');
			const entityEditor = BX.Crm.PartialEditorDialog.create('entity-converter-editor', {
				title: main_core.Loc.getMessage('CRM_CONVERSION_REQUIRED_FIELDS_POPUP_TITLE'),
				entityTypeId: this.#entityTypeId,
				entityId: this.#entityId,
				fieldNames: Object.keys(data.CHECK_ERRORS),
				helpData: {
					text: main_core.Loc.getMessage('CRM_CONVERSION_MORE_ABOUT_REQUIRED_FIELDS'),
					code: REQUIRED_FIELDS_INFOHELPER_CODE
				},
				context: data.CONTEXT
			});
			return new Promise(resolve => {
				const handler = (sender, eventParams) => {
					if (this.#entityTypeId !== eventParams?.entityTypeId || this.#entityId !== eventParams?.entityId) {
						return;
					}

					// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
					BX.removeCustomEvent(window, 'Crm.PartialEditorDialog.Close', handler);

					// yes, 'canceled' with double 'l' in this case
					const isCanceled = main_core.Type.isBoolean(eventParams.isCancelled) ? eventParams.isCancelled : true;
					if (isCanceled) {
						resolve({
							isCanceled: true,
							isFinished: true
						});
					} else {
						resolve(this.#request());
					}
				};

				// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
				BX.addCustomEvent(window, 'Crm.PartialEditorDialog.Close', handler);
				entityEditor.open();
			});
		}
		#getMessage(phraseId) {
			if (!this.#params.messages) {
				this.#params.messages = {};
			}
			return this.#params.messages[phraseId] || phraseId;
		}

		/**
		 * @deprecated Will be removed soon
		 * @todo delete, replace with messages from config.php
		 */
		getMessagePublic(phraseId) {
			return this.#getMessage(phraseId);
		}
		#emitConvertedEvent(redirectUrl) {
			const entityTypeId = this.getEntityTypeId();
			const eventArgs = {
				entityTypeId,
				entityTypeName: BX.CrmEntityType.resolveName(entityTypeId),
				entityId: this.#entityId,
				redirectUrl,
				isRedirected: false
			};
			const current = BX.Crm.Page.getTopSlider();
			if (current) {
				eventArgs.sliderUrl = current.getUrl();
			}

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			BX.onCustomEvent(window, 'Crm.EntityConverter.Converted', [this, eventArgs]);
			BX.localStorage.set('onCrmEntityConvert', eventArgs, 10);
			this.getConfig().getActiveItems().forEach(item => {
				main_core_events.EventEmitter.emit('Crm.EntityConverter.SingleConverted', {
					entityTypeName: BX.CrmEntityType.resolveName(item.getEntityTypeId())
				});
			});
			return eventArgs.isRedirected;
		}
	}

	/**
	 * @memberOf BX.Crm.Conversion
	 */
	class EntitySelector {
		#converter;
		#entityId;
		#dstEntityTypeIds;
		#target;
		#dialogProp = null;
		constructor(converter, entityId, dstEntityTypeIds, target = null) {
			// this dont work in slider for some reason
			// if (converter instanceof Converter)
			// {
			// 	this.#converter = converter;
			// }
			this.#converter = converter;

			// eslint-disable-next-line no-param-reassign
			entityId = main_core.Text.toInteger(entityId);
			if (entityId > 0) {
				this.#entityId = entityId;
			}
			this.#dstEntityTypeIds = dstEntityTypeIds.map(x => main_core.Text.toInteger(x)).filter(entityTypeId => BX.CrmEntityType.isDefined(entityTypeId));
			this.#dstEntityTypeIds.sort();
			if (main_core.Type.isDomNode(target) || main_core.Type.isNil(target)) {
				this.#target = target;
			}
			if (!this.#converter || !this.#entityId || !main_core.Type.isArrayFilled(this.#dstEntityTypeIds)) {
				console.error('Invalid constructor params:', {
					converter,
					entityId,
					dstEntityTypeIds
				});
				throw new Error('Invalid constructor params');
			}
		}
		get #dialog() {
			if (this.#dialogProp) {
				return this.#dialogProp;
			}
			const applyButton = new ui_buttons.ApplyButton({
				color: ui_buttons.ButtonColor.SUCCESS,
				onclick: () => {
					void this.hide();
					this.#convert();
				}
			});
			const cancelButton = new ui_buttons.CancelButton({
				onclick: () => {
					void this.hide();
				}
			});
			this.#dialogProp = new ui_entitySelector.Dialog({
				targetNode: this.#target,
				enableSearch: true,
				context: `crm.converter.entity-selector.${this.#dstEntityTypeIds.join('-')}`,
				entities: this.#dstEntityTypeIds.map(entityTypeId => {
					return {
						id: BX.CrmEntityType.resolveName(entityTypeId),
						dynamicLoad: true,
						dynamicSearch: true,
						options: {
							showTab: true,
							excludeMyCompany: true
						},
						searchFields: [{
							name: 'id'
						}],
						searchCacheLimits: ['^\\d+$']
					};
				}),
				footer: [applyButton.render(), cancelButton.render()],
				footerOptions: {
					containerStyles: {
						display: 'flex',
						'justify-content': 'center'
					}
				},
				tagSelectorOptions: {
					textBoxWidth: 565 // same as default dialog width
				}
			});
			this.#dialogProp.subscribe('Item:onSelect', this.#handleItemSelect.bind(this));
			return this.#dialogProp;
		}
		#convert() {
			const activeEntityTypeIds = new Set();
			const data = {};
			this.#dialog.getSelectedItems().forEach(item => {
				activeEntityTypeIds.add(BX.CrmEntityType.resolveId(item.getEntityId().toUpperCase()));
				data[item.getEntityId()] = item.getId();
			});
			const schemeItem = this.#converter.getConfig().getScheme().getItemForEntityTypeIds([...activeEntityTypeIds]);
			if (!schemeItem) {
				throw new Error(`Could not find a scheme item for destinations ${[...activeEntityTypeIds].join(', ')}`);
			}
			this.#converter.getConfig().updateFromSchemeItem(schemeItem);
			this.#converter.convert(this.#entityId, data);
		}
		#handleItemSelect(event) {
			const {
				item
			} = event.getData();
			EntitySelector.#ensureOnlyOneItemOfEachTypeIsSelected(this.#dialog, item);
		}
		static #ensureOnlyOneItemOfEachTypeIsSelected(dialog, justSelectedItem) {
			dialog.getSelectedItems().forEach(item => {
				if (item.getEntityId() === justSelectedItem.getEntityId() && main_core.Text.toInteger(item.getId()) !== main_core.Text.toInteger(justSelectedItem.getId())) {
					item.deselect();
				}
			});
		}
		show() {
			return new Promise(resolve => {
				this.#dialog.subscribeOnce('onShow', resolve);
				this.#dialog.show();
			});
		}
		hide() {
			return new Promise(resolve => {
				this.#dialog.subscribeOnce('onHide', resolve);
				this.#dialog.hide();
			});
		}
		destroy() {
			return new Promise(resolve => {
				this.#dialog.unsubscribe('Item:onSelect', this.#handleItemSelect.bind(this));
				this.#dialog.destroy();
				resolve();
			});
		}
		getConverter() {
			return this.#converter;
		}
	}

	let instance = null;

	/**
	 * @memberOf BX.Crm.Conversion
	 */
	class Manager {
		#converters = {};
		static get Instance() {
			if (instance === null) {
				instance = new Manager();
			}
			return instance;
		}
		initializeConverter(entityTypeId, params) {
			const config = Config.create(entityTypeId, params.configItems, Scheme.create(params.scheme));
			const converter = new Converter(entityTypeId, config, params.params);
			this.#converters[converter.getId()] = converter;
			return converter;
		}
		getConverter(converterId) {
			return this.#converters[converterId];
		}
		createEntitySelector(converterId, dstEntityTypeIds, entityId) {
			const converter = this.getConverter(converterId);
			if (!converter) {
				console.error('Converter with given id not found', converterId, this);
				return null;
			}

			// check whether converter supports this type of scheme
			const schemeItem = converter.getConfig().getScheme().getItemForEntityTypeIds(dstEntityTypeIds);
			if (!schemeItem) {
				console.error('Could not find scheme item', dstEntityTypeIds, converter);
				return null;
			}
			return new EntitySelector(converter, entityId, dstEntityTypeIds);
		}
	}

	/**
	 * @memberOf BX.Crm.Conversion
	 * @mixes EventEmitter
	 */
	class SchemeSelector {
		#entityId;
		#container;
		#menuButton;
		#label;
		#converter;
		#menuId;
		#isAutoConversionEnabled;
		#analytics = {};
		#waiting = false;
		constructor(converter, params) {
			this.#converter = converter;
			this.#entityId = Number(params.entityId);
			this.#container = document.getElementById(params.containerId);
			this.#menuButton = document.getElementById(params.buttonId);
			this.#label = document.getElementById(params.labelId);
			this.#menuId = `crm_conversion_scheme_selector_${this.#entityId}_${main_core.Text.getRandom()}`;
			this.#isAutoConversionEnabled = false;
			if (main_core.Type.isStringFilled(params.analytics.c_element)) {
				this.#analytics.c_element = params.analytics.c_element;
			}
			if (!this.#entityId || !this.#container || !this.#menuButton || !this.#label || !this.#converter) {
				console.error('Error SchemeSelector initializing', this);
			} else {
				this.#initUI();
				this.#bindEvents();
			}
			main_core_events.EventEmitter.makeObservable(this, 'BX.Crm.Conversion.SchemeSelector');
		}
		destroy() {
			this.#closeMenu();
			this.#unbindEvents();
			this.unsubscribeAll();
		}

		/**
		 * Alias for 'destroy'
		 */
		release() {
			this.destroy();
		}
		enableAutoConversion() {
			this.#isAutoConversionEnabled = true;
		}
		disableAutoConversion() {
			this.#isAutoConversionEnabled = false;
		}
		#initUI() {
			const currentSchemeItem = this.#converter.getConfig().getScheme().getCurrentItem();
			if (currentSchemeItem) {
				this.#label.innerText = currentSchemeItem.getPhrase();
			}
		}
		#bindEvents() {
			main_core.Event.bind(this.#container, 'click', this.#handleContainerClick.bind(this));
			main_core.Event.bind(this.#menuButton, 'click', this.#handleMenuButtonClick.bind(this));
		}
		#unbindEvents() {
			main_core.Event.unbind(this.#container, 'click', this.#handleContainerClick.bind(this));
			main_core.Event.unbind(this.#menuButton, 'click', this.#handleMenuButtonClick.bind(this));
		}
		#handleContainerClick() {
			if (this.#waiting) {
				return;
			}
			const event = new main_core_events.BaseEvent({
				data: {
					isCanceled: false
				}
			});
			this.emit('onContainerClick', event);
			this.#converter.getConfig().updateFromSchemeItem();
			if (this.#isAutoConversionEnabled && !event.getData().isCanceled) {
				this.#converter.setAnalyticsElement(this.#analytics.c_element);
				this.setWaiting();
				void this.#converter.convert(this.#entityId).finally(() => this.setWaiting(false));
			}
		}
		setWaiting(waiting = true) {
			this.#waiting = waiting;
			const button = this.#getButtonContainer();
			if (!button) {
				return;
			}
			if (waiting) {
				main_core.Dom.addClass(button, ui_buttons.ButtonState.WAITING);
			} else {
				main_core.Dom.removeClass(button, ui_buttons.ButtonState.WAITING);
			}
		}
		#getButtonContainer() {
			if (main_core.Dom.hasClass(this.#container, ui_buttons.Button.BASE_CLASS) || main_core.Dom.hasClass(this.#container, ui_buttons.SplitButton.BASE_CLASS)) {
				return this.#container;
			}
			if (main_core.Dom.hasClass(this.#container.parentNode, ui_buttons.Button.BASE_CLASS) || main_core.Dom.hasClass(this.#container.parentNode, ui_buttons.SplitButton.BASE_CLASS)) {
				return this.#container.parentNode;
			}
			return null;
		}
		#handleMenuButtonClick() {
			if (!this.#waiting) {
				this.#showMenu();
			}
		}
		#showMenu() {
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-bx
			const anchorPos = BX.pos(this.#container);
			main_popup.MenuManager.show({
				id: this.#menuId,
				bindElement: this.#menuButton,
				items: this.#getMenuItems(),
				closeByEsc: true,
				cacheable: false,
				offsetLeft: -anchorPos.width
			});
		}
		#closeMenu() {
			main_popup.MenuManager.destroy(this.#menuId);
		}
		#getMenuItems() {
			const scheme = this.#converter.getConfig().getScheme();
			const items = [];
			for (const item of scheme.getItems()) {
				items.push({
					text: main_core.Text.encode(item.getPhrase()),
					onclick: () => {
						this.#handleItemClick(item);
					}
				});
			}
			const entitySelector = this.#prepareEntitySelector(scheme);
			if (entitySelector) {
				items.push({
					text: this.#converter.getMessagePublic('openEntitySelector'),
					onclick: () => {
						this.#closeMenu();
						void entitySelector.show();
					}
				});
			}
			return items;
		}
		#prepareEntitySelector(scheme) {
			if (this.#converter.getEntityTypeId() !== BX.CrmEntityType.enumeration.lead) {
				return null;
			}
			const allEntityTypeIdsInScheme = scheme.getAllEntityTypeIds();
			const dstEntityTypeIds = [];
			if (allEntityTypeIdsInScheme.includes(BX.CrmEntityType.enumeration.contact)) {
				dstEntityTypeIds.push(BX.CrmEntityType.enumeration.contact);
			}
			if (allEntityTypeIdsInScheme.includes(BX.CrmEntityType.enumeration.company)) {
				dstEntityTypeIds.push(BX.CrmEntityType.enumeration.company);
			}
			if (!main_core.Type.isArrayFilled(dstEntityTypeIds)) {
				return null;
			}
			return new EntitySelector(this.#converter, this.#entityId, dstEntityTypeIds);
		}
		#handleItemClick(item) {
			this.#closeMenu();
			this.#label.innerText = item.getPhrase();
			this.#converter.getConfig().updateFromSchemeItem(item);
			const event = new main_core_events.BaseEvent({
				data: {
					isCanceled: false
				}
			});
			this.emit('onSchemeSelected', event);
			if (this.#isAutoConversionEnabled && !event.getData().isCanceled) {
				this.#converter.setAnalyticsElement(this.#analytics.c_element);
				this.#converter.convert(this.#entityId);
			}
		}
	}

	/**
	 * @memberOf BX.Crm
	 */
	const Conversion = {
		Scheme,
		Config,
		Converter,
		Manager,
		SchemeSelector,
		EntitySelector
	};

	exports.Conversion = Conversion;

})(this.BX.Crm = this.BX.Crm || {}, BX, BX.Crm.Integration.Analytics, BX.Event, BX.Main, BX.UI.Analytics, BX.UI, BX.UI.Dialogs, BX, BX.Crm.Models, BX.UI.EntitySelector);
//# sourceMappingURL=conversion.bundle.js.map
