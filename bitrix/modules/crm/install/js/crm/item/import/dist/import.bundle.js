/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, ui_vue3, main_core, main_core_events, main_core_cache, ui_system_typography_vue, ui_iconSet_api_vue, ui_entitySelector, ui_uploader_tileWidget, ui_vue3_components_button, ui_uploader_core, crm_integration_analytics, ui_analytics, ui_buttons, ui_dialogs_messagebox, ui_notification, ui_system_alert, ui_infoHelper, ui_iconSet_outline, ui_progressbar, ui_vue3_components_popup) {
	'use strict';

	class Binding {
		#fieldId;
		#columnIndex;
		constructor(options) {
			this.#fieldId = options.fieldId;
			this.#columnIndex = options.columnIndex;
		}
		getFieldId() {
			return this.#fieldId;
		}
		getColumnIndex() {
			return this.#columnIndex;
		}
		setColumnIndex(columnIndex) {
			this.#columnIndex = columnIndex;
			return this;
		}
		json() {
			return {
				fieldId: this.#fieldId,
				columnIndex: this.#columnIndex
			};
		}
	}

	class FieldBindings {
		#bindings = new Map();
		constructor(options) {
			options.bindings.forEach(binding => {
				this.#bindings.set(binding.fieldId, new Binding(binding));
			});
		}
		set(fieldId, columnIndex) {
			const binding = this.getBinding(fieldId);
			if (!binding) {
				this.#bindings.set(fieldId, new Binding({
					fieldId,
					columnIndex
				}));
				return;
			}
			binding.setColumnIndex(columnIndex);
		}
		get(fieldId) {
			return this.getBinding(fieldId)?.getColumnIndex();
		}
		getBinding(fieldId) {
			return this.#bindings.get(fieldId);
		}
		json() {
			return {
				bindings: [...this.#bindings].map(([, value]) => value?.json())
			};
		}
	}

	class ImportSettings {
		#values = {};
		#fieldBindings = null;
		#entityFields = [];
		#fileHeaders = [];
		#previewTable = null;
		#filesize = null;
		#requiredFieldIds = [];
		#requisiteDuplicateControlTargets = [];
		#eventEmitter;
		constructor(options) {
			this.#eventEmitter = new main_core_events.EventEmitter(this, 'BX.Item.Crm.Import');
			this.#values = options;
			if (main_core.Type.isPlainObject(options.fieldBindings)) {
				this.#fieldBindings = new FieldBindings(options.fieldBindings);
			}
		}
		set(fieldName, value) {
			const oldValue = this.#values[fieldName];
			this.#values[fieldName] = value;
			this.#eventEmitter.emit(`crm:import-settings:on-value-changed:${fieldName}`, new main_core_events.BaseEvent({
				data: {
					oldValue,
					newValue: value
				}
			}));
			return this;
		}
		get(fieldName) {
			return this.#values[fieldName] ?? null;
		}
		subscribeValueChanged(fieldName, handler) {
			this.#eventEmitter.subscribe(`crm:import-settings:on-value-changed:${fieldName}`, handler);
		}
		unsubscribeValueChanged(fieldName, handler) {
			this.#eventEmitter.unsubscribe(`crm:import-settings:on-value-changed:${fieldName}`, handler);
		}
		setFieldBindings(fieldBindings) {
			this.#fieldBindings = fieldBindings;
			return this;
		}
		getFieldBindings() {
			return this.#fieldBindings;
		}
		setPreviewTable(previewTable) {
			this.#previewTable = previewTable;
			return this;
		}
		getPreviewTable() {
			return this.#previewTable;
		}
		setEntityFields(entityFields) {
			this.#entityFields = entityFields;
			return this;
		}
		getEntityFields() {
			return this.#entityFields;
		}
		setFileHeaders(fileHeaders) {
			this.#fileHeaders = fileHeaders;
			return this;
		}
		getFileHeaders() {
			return this.#fileHeaders;
		}
		setFilesize(filesize) {
			this.#filesize = filesize;
			return this;
		}
		getFilesize() {
			return this.#filesize;
		}
		setRequiredFieldIds(fieldIds) {
			this.#requiredFieldIds = fieldIds;
			return this;
		}
		getRequiredFieldIds() {
			return this.#requiredFieldIds;
		}
		setRequisiteDuplicateControlTargets(requisiteDuplicateControlTargets) {
			this.#requisiteDuplicateControlTargets = requisiteDuplicateControlTargets;
			return this;
		}
		getRequisiteDuplicateControlTargets() {
			return this.#requisiteDuplicateControlTargets;
		}
		json() {
			const json = this.#values;
			if (this.#fieldBindings) {
				json.fieldBindings = this.#fieldBindings.json();
			}
			return json;
		}
	}

	const Alert$1 = {
		name: 'Alert',
		template: `
		<div class="crm-item-import__alert">
			<slot />
		</div>
	`
	};

	const DownloadAlert = {
		name: 'DownloadAlert',
		props: {
			phrase: {
				type: String,
				required: true
			},
			downloadUrl: {
				type: [String, Function],
				default: () => null
			}
		},
		components: {
			Alert: Alert$1
		},
		methods: {
			content() {
				return this.$Bitrix.Loc.getMessage(this.phrase).replace('[link]', '<a class="download-link">').replace('[/link]', '</a>');
			},
			handleDownloadClick(event) {
				event.preventDefault();
				const link = document.createElement('a');
				if (main_core.Type.isString(this.downloadUrl)) {
					link.href = this.downloadUrl;
				} else if (main_core.Type.isFunction(this.downloadUrl)) {
					link.href = this.downloadUrl();
				} else {
					return;
				}
				link.download = '';
				link.target = '_blank';
				link.click();
			}
		},
		mounted() {
			const linkElement = this.$el?.querySelector?.('.download-link');
			if (linkElement) {
				main_core.Event.bind(linkElement, 'click', this.handleDownloadClick);
			}
		},
		beforeUnmount() {
			const linkElement = this.$el?.querySelector?.('.download-link');
			if (linkElement) {
				main_core.Event.unbind(linkElement, 'click', this.handleDownloadClick);
			}
		},
		template: `
		<Alert v-if="downloadUrl !== null" v-html="content()" />
	`
	};

	class ConfigureImportSettingsResponse {
		constructor(data) {
			if (!main_core.Type.isObject(data)) {
				throw new TypeError('Invalid data: object required');
			}
			this.fileHeaders = main_core.Type.isArray(data.fileHeaders) ? data.fileHeaders.map(fileHeader => {
				return this.#validateFileHeader(fileHeader);
			}) : [];
			this.entityFields = main_core.Type.isArray(data.entityFields) ? data.entityFields.map(entityField => {
				return this.#validateEntityField(entityField);
			}) : [];
			this.fieldBindings = data.fieldBindings ?? null;
			this.previewTable = data.previewTable ?? null;
			this.filesize = data.filesize ?? null;
			this.requiredFieldIds = data.requiredFieldIds ?? [];
			this.requisiteDuplicateControlTargets = data.requisiteDuplicateControlTargets ?? [];
		}
		#validateFileHeader(header) {
			if (!main_core.Type.isObject(header) || !main_core.Type.isNumber(header.columnIndex) || !main_core.Type.isString(header.title)) {
				void console.error(header);
				throw new RangeError('Invalid header');
			}
			return header;
		}
		#validateEntityField(field) {
			if (!main_core.Type.isObject(field) || !main_core.Type.isString(field.name) || !main_core.Type.isString(field.id)) {
				void console.error(field);
				throw new RangeError('Invalid entityField');
			}
			return field;
		}
	}

	class ImportResponse {
		constructor(data) {
			if (!main_core.Type.isObject(data)) {
				throw new TypeError('Invalid data: object required');
			}
			this.successImportCount = main_core.Type.isNumber(data.successImportCount) ? data.successImportCount : 0;
			this.failImportCount = main_core.Type.isNumber(data.failImportCount) ? data.failImportCount : 0;
			this.duplicateImportCount = main_core.Type.isNumber(data.duplicateImportCount) ? data.duplicateImportCount : 0;
			this.currentLine = main_core.Type.isNumber(data.currentLine) ? data.currentLine : 0;
			this.progressedBytes = main_core.Type.isNumber(data.progressedBytes) ? data.progressedBytes : 0;
			this.isFinished = main_core.Type.isBoolean(data.isFinished) ? data.isFinished : true;
			this.errorsPreviewTable = data.errorsPreviewTable;
			this.downloadFailImportFileUrl = data.downloadFailImportFileUrl;
			this.downloadDuplicateImportFileUrl = data.downloadDuplicateImportFileUrl;
		}
	}

	class Controller {
		async configureImportSettings(importSettings) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.item.import.configureImportSettings', {
					json: {
						importSettings: importSettings.json()
					}
				}).then(response => {
					resolve(new ConfigureImportSettingsResponse(response.data));
				}).catch(response => {
					reject(response);
				});
			});
		}
		async import(importOptions) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('crm.item.import.import', {
					json: {
						importSettings: importOptions.importSettings.json(),
						currentLine: importOptions.currentLine
					}
				}).then(response => {
					resolve(new ImportResponse(response.data));
				}).catch(response => {
					reject(response);
				});
			});
		}
		getDownloadExampleUrl(importSettings) {
			const getParameters = {
				action: 'crm.item.import.downloadExample',
				entityTypeId: Number(importSettings.get('entityTypeId')),
				importSettingsJson: JSON.stringify(importSettings.json())
			};
			return `/bitrix/services/main/ajax.php?${BX.ajax.prepareData(getParameters, null, false)}`;
		}
	}

	class ServiceLocator {
		static #instance = null;
		#cache;
		constructor() {
			this.#cache = new main_core_cache.MemoryCache();
		}
		static instance() {
			this.#instance ??= new ServiceLocator();
			return this.#instance;
		}
		getController() {
			return this.#cache.remember('controller', () => new Controller());
		}
	}

	const DownloadExampleAlert = {
		name: 'DownloadExampleAlert',
		props: {
			importSettings: {
				type: Object,
				required: true
			}
		},
		components: {
			DownloadAlert
		},
		methods: {
			getDownloadUrl() {
				return ServiceLocator.instance().getController().getDownloadExampleUrl(this.importSettings);
			}
		},
		template: `
		<DownloadAlert
			phrase="CRM_ITEM_IMPORT_DOWNLOAD_IMPORT_FILE_EXAMPLE"
			:download-url="getDownloadUrl"
		/>
	`
	};

	const ErrorAlert = {
		name: 'ErrorAlert',
		components: {
			Alert: Alert$1
		},
		template: `
		<Alert class="--error"><slot/></Alert>
	`
	};

	const WarningAlert = {
		name: 'WarningAlert',
		components: {
			Alert: Alert$1
		},
		template: `
		<Alert class="--warning"><slot/></Alert>
	`
	};

	const ErrorMessage = {
		name: 'ErrorMessage',
		props: {
			error: {
				type: String,
				default: () => null
			}
		},
		template: `
		<span class="crm-item-import__error-message" v-if="error">{{ error }}</span>
	`
	};

	const Delimiter$1 = {
		name: 'Delimiter',
		template: `
		<div class="crm-item-import__delimiter"></div>
	`
	};

	const Page = {
		name: 'Page',
		template: `
		<div class="crm-item-import__page">
			<slot />
		</div>
	`
	};

	const RequiredMark = {
		name: 'RequiredMark',
		template: `
		<span class="crm-item-import__required-mark" :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_REQUIRED_MARK_HINT')">*</span>
	`
	};

	const SettingsSection = {
		name: 'SettingsSection',
		components: {
			Delimiter: Delimiter$1
		},
		props: {
			title: {
				type: String,
				required: true
			},
			isDelimiterEnabled: {
				type: Boolean,
				default: () => true
			}
		},
		template: `
		<div class="crm-item-import__settings-section">
			<div class="crm-item-import__settings-section-container">
				<div class="crm-item-import__settings-section-title">
					{{ title }}
				</div>
			</div>
			<Delimiter v-if="isDelimiterEnabled" />
			<div class="crm-item-import__settings-section-content">
				<slot />
			</div>
		</div>
	`
	};

	const Value = {
		name: 'Value',
		props: {
			value: {
				type: [String, Array, Object],
				required: true
			}
		},
		template: `
		<div v-if="Array.isArray(value)" v-for="valueItem in value" class="value-set">
			<Value :value="valueItem" />
		</div>
		<div v-else class="value" :title="value">
			{{ value }}
		</div>
	`
	};

	const Table = {
		name: 'Table',
		props: {
			headers: {
				/** @type Header[] */
				type: Array,
				required: true
			},
			rows: {
				/** @type Row[] */
				type: Array,
				required: true
			}
		},
		components: {
			Value
		},
		data() {
			return {
				stickyScrollWidth: 0,
				isSyncingScroll: false
			};
		},
		mounted() {
			this.updateStickyScrollWidth();
			this.resizeObserver = new ResizeObserver(() => this.updateStickyScrollWidth());
			this.resizeObserver.observe(this.$refs.tableContainer);
		},
		beforeUnmount() {
			this.resizeObserver?.disconnect();
		},
		computed: {
			rowsByHeaders() {
				return this.rows.map(row => {
					return {
						values: this.columnMap.map(column => {
							const rowValueByColumn = row.values.find(rowValue => rowValue.columnIndex === column);
							if (!rowValueByColumn) {
								return {
									value: '',
									columnIndex: column
								};
							}
							return rowValueByColumn;
						}),
						errors: row.errors
					};
				});
			},
			columnMap() {
				return this.headers.map(header => {
					return header.columnIndex;
				});
			}
		},
		methods: {
			formatErrors(errors) {
				return errors.flatMap(error => {
					return this.splitErrorMessageByBr(error).filter(errorMessage => main_core.Type.isStringFilled(errorMessage));
				});
			},
			splitErrorMessageByBr(errorMessage) {
				const error = errorMessage.replaceAll(/<br\/>|<br \/>|<br>/gi, '<br>');
				return error.split('<br>');
			},
			updateStickyScrollWidth() {
				const container = this.$refs.tableContainer;
				if (container) {
					this.stickyScrollWidth = container.scrollWidth;
				}
			},
			onStickyScroll(event) {
				if (this.isSyncingScroll) {
					return;
				}
				this.isSyncingScroll = true;
				this.$refs.tableContainer.scrollLeft = event.target.scrollLeft;
				this.isSyncingScroll = false;
			},
			onTableScroll(event) {
				if (this.isSyncingScroll) {
					return;
				}
				this.isSyncingScroll = true;
				this.$refs.stickyScroll.scrollLeft = event.target.scrollLeft;
				this.isSyncingScroll = false;
			}
		},
		template: `
		<div class="crm-item-import__table-wrapper">
		<div class="crm-item-import__table-container" ref="tableContainer" @scroll="onTableScroll">
			<table class="crm-item-import__table">
				<thead>
					<tr>
						<th
							v-for="header in headers">
							{{ header.title }}
						</th>
					</tr>
				</thead>
				<tbody>
					<template v-for="row in rowsByHeaders">
						<tr
							v-if="row.errors"
							v-for="error in formatErrors(row.errors)"
						>
							<td :colspan="headers.length">
								<span class="crm-item-import__error">{{ error }}</span>
							</td>
						</tr>
						<tr>
							<td v-for="rowValue in row.values">
								<Value :value="rowValue.value" />
							</td>
						</tr>
					</template>
				</tbody>
			</table>
		</div>
		<div class="crm-item-import__table-sticky-scroll" ref="stickyScroll" @scroll="onStickyScroll">
			<div :style="{ width: stickyScrollWidth + 'px', height: '1px' }"></div>
		</div>
		</div>
	`
	};

	const AlertDesign = Object.freeze({
		tinted: 'tinted',
		tintedSuccess: 'tinted-success',
		tintedWarning: 'tinted-warning',
		tintedAlert: 'tinted-alert'
	});
	const Alert = {
		name: 'Alert',
		components: {
			Text2Xs: ui_system_typography_vue.Text2Xs,
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			design: {
				type: String,
				required: false,
				default: AlertDesign.tinted,
				validator: value => {
					return Object.values(AlertDesign).includes(value);
				}
			},
			leftImage: {
				type: String,
				required: false,
				default: null
			}
		},
		computed: {
			closeIcon() {
				return ui_iconSet_api_vue.Outline.CROSS_S;
			},
			rootClasses() {
				return ['ui-system-alert', 'ui-system-alert__scope', `--${this.design}`, {
					'--has-left-image': Boolean(this.leftImage)
				}];
			},
			leftImageStyle() {
				if (!this.leftImage) {
					return {};
				}
				return {
					'--ui-alert-left-image': `url(${this.leftImage})`
				};
			}
		},
		template: `
		<div :class="rootClasses" :style="leftImageStyle">
			<div class="ui-system-alert-inner">
				<div class="ui-system-alert__left-image"></div>
				<div class="ui-system-alert__content">
					<Text2Xs>
						<slot></slot>
					</Text2Xs>
				</div>
			</div>
		</div>
	`
	};

	const Checkbox = {
		name: 'Checkbox',
		components: {
			RequiredMark
		},
		props: {
			fieldName: {
				type: String,
				required: true
			},
			model: {
				type: Object,
				required: true
			},
			fieldCaption: {
				type: String,
				required: true
			},
			required: {
				type: Boolean,
				default: () => false
			}
		},
		computed: {
			checked: {
				get() {
					return Boolean(this.model.get(this.fieldName));
				},
				set(value) {
					this.model.set(this.fieldName, value);
				}
			}
		},
		template: `
		<div class="crm-item-import__field --checkbox ui-form-row">
			<label class="ui-ctl ui-ctl-checkbox ui-ctl-w100">
				<input type="checkbox" class="ui-ctl-element" :name="fieldName" v-model="checked">
				<div class="ui-ctl-label-text">
					{{ fieldCaption }}
					<RequiredMark v-if="required" />
				</div>
			</label>
		</div>
	`
	};

	const Select = {
		name: 'Select',
		emits: ['onSelectMouseDown'],
		components: {
			RequiredMark,
			Alert: Alert$1,
			Icon: ui_iconSet_api_vue.BIcon
		},
		props: {
			fieldName: {
				type: [String, Number],
				required: true
			},
			model: {
				type: Object,
				required: true
			},
			fieldCaption: {
				type: String,
				required: true
			},
			options: {
				/** @type SelectOption[] */
				type: Array,
				required: true
			},
			required: {
				type: Boolean,
				default: () => false
			},
			icon: {
				/** @type IconProp */
				type: Object,
				default: () => {}
			}
		},
		data() {
			return {
				hint: null
			};
		},
		computed: {
			selected: {
				get() {
					this.adjustHint();
					return this.model.get(this.fieldName);
				},
				set(value) {
					this.model.set(this.fieldName, value);
					this.adjustHint();
				}
			}
		},
		methods: {
			adjustHint() {
				this.hint = this.options.find(option => option.value === this.model.get(this.fieldName))?.hint;
			}
		},
		template: `
		<div class="crm-item-import__field --select ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">
					<div class="title">
						<template v-if="icon">
							<Icon :name="icon.name" :size="icon.size" :color="icon.color"/>
						</template>
						{{ fieldCaption }}
						<RequiredMark v-if="required" />
					</div>
				</div>
			</div>
			<div class="ui-ctl ui-ctl-w100">
				<div class="ui-ctl ui-ctl-dropdown ui-ctl-w100">
					<div class="ui-ctl-after ui-ctl-icon-angle"></div>
					<select
						class="ui-ctl-element"
						:name="fieldName"
						v-model="selected"
						@mousedown="this.$emit('onSelectMouseDown', $event)"
					>
						<option
							v-for="option in options"
							:value="option.value"
						>
							{{ option.title }}
						</option>
					</select>
				</div>
			</div>
			<Alert class="crm-item-import__field-select-hint" v-if="hint">
				{{ hint }}
			</Alert>
		</div>
	`
	};

	const TagSelector = {
		name: 'TagSelector',
		components: {
			RequiredMark,
			Alert: Alert$1
		},
		props: {
			fieldName: {
				type: [String, Number],
				required: true
			},
			model: {
				type: Object,
				required: true
			},
			fieldCaption: {
				type: String,
				required: true
			},
			options: {
				/** @type TagSelectorOption[] */
				type: Array,
				required: true
			},
			required: {
				type: Boolean,
				default: () => false
			},
			multiple: {
				type: Boolean,
				default: () => false
			},
			nullable: {
				type: Boolean,
				default: () => false
			},
			placeholder: {
				type: String,
				default: () => null
			},
			display: {
				default: null,
				validator: value => {
					return value === null || value === 'row';
				}
			},
			readonly: {
				type: Boolean,
				default: () => false
			}
		},
		data() {
			return {
				hint: null,
				isIgnoreValueChange: false
			};
		},
		mounted() {
			this.getTagSelector().renderTo(this.$refs.tagSelectorContainer);
			this.adjustHint();
			if (main_core.Type.isFunction(this.model.subscribeValueChanged)) {
				this.model.subscribeValueChanged(this.fieldName, this.onValueChanged);
			}
		},
		unmounted() {
			if (main_core.Type.isFunction(this.model.unsubscribeValueChanged)) {
				this.model.unsubscribeValueChanged(this.fieldName, this.onValueChanged);
			}
			this.getTagSelector().getDialog().destroy();
		},
		methods: {
			onValueChanged(event) {
				if (this.isIgnoreValueChange) {
					return;
				}
				const newValue = event.getData().newValue;
				this.selectTag(newValue);
			},
			convertOptionToTagItem(option) {
				let deselectable = this.multiple || this.nullable;
				if (this.readonly) {
					deselectable = false;
				}
				return {
					id: option.value,
					title: option.title,
					tabs: 'recents',
					entityId: 'select-item',
					deselectable
				};
			},
			getTagSelector() {
				if (this.tagSelector) {
					return this.tagSelector;
				}
				const options = this.options;
				const addButtonCaption = this.multiple ? main_core.Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_ADD_BUTTON_CAPTION_MULTIPLE') : main_core.Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_ADD_BUTTON_CAPTION_SINGLE');
				const addButtonCaptionMore = this.multiple ? main_core.Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_ADD_BUTTON_CAPTION_MORE_MULTIPLE') : main_core.Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_ADD_BUTTON_CAPTION_MORE_SINGLE');
				const locked = this.readonly ? true : null;
				const showAddButton = !this.readonly;
				const items = options.map(option => this.convertOptionToTagItem(option));
				this.tagSelector = new ui_entitySelector.TagSelector({
					locked,
					multiple: this.multiple,
					placeholder: this.placeholder,
					addButtonCaption,
					addButtonCaptionMore,
					showAddButton,
					dialogOptions: {
						height: 300,
						enableSearch: false,
						showAvatars: false,
						items,
						searchTabOptions: {
							stub: true,
							stubOptions: {
								title: main_core.Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_EMPTY_STATE_TITLE'),
								subtitle: main_core.Loc.getMessage('CRM_ITEM_IMPORT_TAG_SELECTOR_EMPTY_STATE_SUBTITLE')
							}
						},
						events: {
							'Item:onBeforeSelect': event => {
								this.isIgnoreValueChange = true;
								this.onBeforeOptionSelect(event);
								this.isIgnoreValueChange = false;
							},
							'Item:onBeforeDeselect': event => {
								this.isIgnoreValueChange = true;
								this.onBeforeOptionDeselect(event);
								this.isIgnoreValueChange = false;
							}
						}
					}
				});
				this.selectTagByModel();
				return this.tagSelector;
			},
			onBeforeOptionSelect(event) {
				const itemId = event.getData().item.getId();
				if (this.multiple) {
					const currentValue = this.model.get(this.fieldName);
					let newValue = [];
					if (main_core.Type.isArray(currentValue)) {
						newValue = [...currentValue];
					} else if (main_core.Type.isString(currentValue) && currentValue !== '') {
						newValue = [currentValue];
					}
					if (!newValue.includes(itemId)) {
						newValue.push(itemId);
						this.model.set(this.fieldName, newValue);
					}
					return;
				}
				this.model.set(this.fieldName, itemId);
				this.adjustHint();
			},
			onBeforeOptionDeselect(event) {
				const item = event.getData().item;
				const itemId = item.getId();
				if (this.multiple) {
					const newValues = this.model.get(this.fieldName).filter(value => value !== itemId);
					if (newValues.length <= 0 && !this.nullable) {
						event.preventDefault();
						return;
					}
					this.model.set(this.fieldName, newValues);
					return;
				}
				const isSelectNewValue = itemId !== this.model.get(this.fieldName);
				if (isSelectNewValue) {
					return;
				}
				if (this.nullable) {
					this.model.set(this.fieldName, null);
					this.adjustHint();
				} else {
					event.preventDefault();
				}
			},
			selectTag(currentValue) {
				if (this.multiple && main_core.Type.isArray(currentValue)) {
					currentValue.forEach(value => {
						const item = this.tagSelector.getDialog().getItem(['select-item', value]);
						if (item) {
							item.select();
						}
					});
				} else if (main_core.Type.isStringFilled(currentValue) || main_core.Type.isNumber(currentValue)) {
					const selectedItem = this.tagSelector.getDialog().getItem(['select-item', currentValue]);
					if (selectedItem) {
						selectedItem.select();
					}
				}
			},
			selectTagByModel() {
				const currentValue = this.model.get(this.fieldName);
				this.selectTag(currentValue);
			},
			adjustHint() {
				if (this.multiple) {
					return;
				}
				const id = this.model.get(this.fieldName);
				let hint = null;
				this.options.forEach(option => {
					if (option.value === id) {
						hint = option.hint;
					}
				});
				this.hint = hint;
			}
		},
		computed: {
			containerClass() {
				return {
					'crm-item-import__field': true,
					'--tag-selector': true,
					'ui-form-row': true,
					'--row': this.display === 'row'
				};
			}
		},
		template: `
		<div :class="containerClass">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text" :title="fieldCaption">
					{{ fieldCaption }}
					<RequiredMark v-if="required" />
				</div>
			</div>
			<div class="ui-ctl ui-ctl-w100">
				<div class="ui-ctl-element" ref="tagSelectorContainer" />
				<slot name="afterInput" />
			</div>
			<Alert class="crm-item-import__field-select-hint" v-if="hint">
				{{ hint }}
			</Alert>
		</div>
	`
	};

	const Textarea = {
		name: 'Textarea',
		components: {
			RequiredMark
		},
		props: {
			fieldName: {
				type: String,
				required: true
			},
			model: {
				type: Object,
				required: true
			},
			fieldCaption: {
				type: String,
				required: true
			},
			required: {
				type: Boolean,
				default: () => false
			}
		},
		computed: {
			value: {
				get() {
					return this.model.get(this.fieldName) ?? '';
				},
				set(value) {
					this.model.set(this.fieldName, value);
				}
			}
		},
		template: `
		<div class="crm-item-import__field --textarea ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">
					{{ fieldCaption }}
					<RequiredMark v-if="required" />
				</div>
			</div>
			<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
				<textarea class="ui-ctl-element ui-ctl-resize-y" :name="fieldName" v-model="value" />
			</div>
		</div>
	`
	};

	const UserSelector = {
		name: 'UserSelector',
		components: {
			RequiredMark
		},
		props: {
			fieldName: {
				type: String,
				required: true
			},
			model: {
				type: Object,
				required: true
			},
			fieldCaption: {
				type: String,
				required: true
			},
			required: {
				type: Boolean,
				default: () => false
			}
		},
		mounted() {
			this.getTagSelector().renderTo(this.$refs.userSelectorContainer);
		},
		methods: {
			getTagSelector() {
				if (this.tagSelector) {
					return this.tagSelector;
				}
				this.tagSelector = new ui_entitySelector.TagSelector({
					multiple: false,
					dialogOptions: {
						entities: [{
							id: 'user',
							options: {
								inviteEmployeeLink: false
							}
						}, {
							id: 'department'
						}],
						enableSearch: true,
						multiple: false,
						dropdownMode: true,
						height: 300,
						preselectedItems: [['user', this.model.get(this.fieldName)]],
						events: {
							'Item:onBeforeSelect': event => {
								this.model.set(this.fieldName, event.getData().item.getId());
							},
							'Item:onBeforeDeselect': event => {
								if (event.getData().item.getId() === this.model.get(this.fieldName)) {
									event.preventDefault();
								}
							}
						}
					},
					events: {
						onTagAdd: event => {
							event.getData().tag.setDeselectable(false);
						}
					}
				});
				return this.tagSelector;
			}
		},
		template: `
		<div class="crm-item-import__field --user-selector ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">
					{{ fieldCaption }}
					<RequiredMark v-if="required" />
				</div>
			</div>
			<div class="ui-ctl ui-ctl-w100">
				<div class="ui-ctl-element" ref="userSelectorContainer" />
			</div>
		</div>
	`
	};

	const UploadButton = {
		name: 'UploadButton',
		inject: ['uploader', 'adapter'],
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		data() {
			return {
				items: [],
				isUploading: false,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle
			};
		},
		created() {
			this.items = this.adapter.getReactiveItems();
			this.uploader.subscribe(ui_uploader_core.UploaderEvent.UPLOAD_START, () => {
				this.isUploading = true;
			});
			this.uploader.subscribe(ui_uploader_core.UploaderEvent.UPLOAD_COMPLETE, () => {
				this.isUploading = false;
			});
			this.uploader.subscribe(ui_uploader_core.UploaderEvent.FILE_REMOVE, () => {
				this.isUploading = false;
			});
		},
		methods: {
			browse() {
				if (!this.browseElement) {
					this.browseElement = document.createElement('div');
					this.uploader.assignBrowse(this.browseElement);
				}
				this.browseElement.click();
			}
		},
		computed: {
			containerClass() {
				return {
					'crm-item-import__upload-button-container': true,
					'--with-file': this.items.length > 0
				};
			}
		},
		template: `
		<div :class="containerClass">
			<template v-if="items.length === 0">
				<UiButton
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IMPORT_FILE_UPLOAD')"
					@click="browse"
					:style="AirButtonStyle.FILLED"
					:disabled="isUploading"
				/>
			</template>
			<template v-else>
				<UiButton
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IMPORT_FILE_UPDATE')"
					@click="browse"
					:style="AirButtonStyle.OUTLINE"
					:disabled="isUploading"
				/>
			</template>
		</div>
	`
	};

	const File = {
		name: 'File',
		components: {
			TileWidgetComponent: ui_uploader_tileWidget.TileWidgetComponent,
			RequiredMark,
			ErrorMessage
		},
		props: {
			fieldName: {
				type: String,
				required: true
			},
			model: {
				type: Object,
				required: true
			},
			fieldCaption: {
				type: String,
				required: true
			},
			widgetOptions: {
				type: Object,
				default: () => {}
			},
			uploaderOptions: {
				/** @type UploaderOptions */
				type: Object,
				default: () => {}
			},
			required: {
				type: Boolean,
				default: () => false
			}
		},
		data() {
			return {
				error: null
			};
		},
		mounted() {
			this.startDestroy = false;
			this.$Bitrix.eventEmitter.subscribe(`crm:item:import:field-${this.fieldName}:validate`, this.onFileValidate);
			if (this.model.get(this.fieldName)) {
				this.getUploader().addFile(this.model.get(this.fieldName), {
					preload: true
				});
			}
		},
		beforeUnmount() {
			this.getAdapter().setRemoveFilesFromServerWhenDestroy(false);
			this.$Bitrix.eventEmitter.unsubscribe(`crm:item:import:field-${this.fieldName}:validate`, this.onFileValidate);
		},
		methods: {
			getUploaderOptions() {
				return {
					...this.uploaderOptions,
					events: {
						onUploadComplete: () => {
							const file = this.getUploader().getFiles()[0];
							if (file && file.isComplete()) {
								this.error = null;
								this.model.set(this.fieldName, file.getServerFileId());
								const encoding = file.getCustomData('detectedEncoding');
								if (encoding) {
									this.model.set(`${this.fieldName}DetectedEncoding`, encoding);
								}
								const binary = file.getBinary();
								if (binary) {
									this.model.set(`${this.fieldName}Binary`, binary);
								}
							}
						},
						onDestroy: () => {
							this.startDestroy = true;
						},
						'File:onRemove': () => {
							if (!this.startDestroy) {
								this.model.set(this.fieldName, null);
								this.model.set(`${this.fieldName}Binary`, null);
							}
						},
						onError: () => {
							this.model.set(this.fieldName, null);
							this.model.set(`${this.fieldName}Binary`, null);
						},
						'File:onError': () => {
							this.model.set(this.fieldName, null);
							this.model.set(`${this.fieldName}Binary`, null);
						}
					}
				};
			},
			getWidgetOptions() {
				return {
					...this.widgetOptions,
					hideDropArea: true,
					slots: {
						[ui_uploader_tileWidget.TileWidgetSlot.BEFORE_TILE_LIST]: UploadButton
					}
				};
			},
			onFileValidate(event) {
				if (!this.validate()) {
					this.error = this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IMPORT_FILE_REQUIRED_ERROR');
					event.preventDefault();
				}
			},
			validate() {
				return !this.required || main_core.Type.isStringFilled(this.model.get(this.fieldName));
			},
			getUploader() {
				return this.$refs.uploader.uploader;
			},
			getAdapter() {
				return this.$refs.uploader.adapter;
			}
		},
		template: `
		<div class="crm-item-import__field --file ui-form-row">
			<div class="ui-form-label">
				<div class="ui-ctl-label-text">
					{{ fieldCaption }}
					<RequiredMark v-if="required" />
				</div>
			</div>
			<div class="ui-ctl ui-ctl-w100">
				<TileWidgetComponent
					ref="uploader"
					:widget-options="getWidgetOptions()"
					:uploader-options="getUploaderOptions()"
				/>
			</div>
			<ErrorMessage :error="this.error" />
		</div>
	`
	};

	class Dictionary {
		#encodings = [];
		#nameFormats = [];
		#delimiters = [];
		#requisitePresets = [];
		#contactTypes = [];
		#sources = [];
		#duplicateControlBehaviors;
		#duplicateControlTargets;
		#isDuplicateControlPermitted;
		constructor(options = {}) {
			this.#setEncodings(options);
			this.#setNameFormats(options);
			this.#setDelimiters(options);
			this.#setRequisitePresets(options);
			this.#setContactTypes(options);
			this.#setSources(options);
			this.#setDuplicateControlBehaviors(options);
			this.#setDuplicateControlTargets(options);
			this.#setDuplicateControlPermitted(options);
		}
		getEncodings() {
			return this.#encodings;
		}
		getNameFormats() {
			return this.#nameFormats;
		}
		getDelimiters() {
			return this.#delimiters;
		}
		getRequisitePresets() {
			return this.#requisitePresets;
		}
		getContactTypes() {
			return this.#contactTypes;
		}
		getSources() {
			return this.#sources;
		}
		getDuplicateControlBehaviors() {
			return this.#duplicateControlBehaviors;
		}
		getDuplicateControlTargets() {
			return this.#duplicateControlTargets;
		}
		isDuplicateControlPermitted() {
			return this.#isDuplicateControlPermitted;
		}
		#isCorrectSelectOption(option) {
			return main_core.Type.isPlainObject(option) && main_core.Type.isStringFilled(option.title) && (main_core.Type.isStringFilled(option.value) || main_core.Type.isNumber(option.value));
		}
		#setEncodings(options) {
			this.#encodings = options.encodings.filter(encoding => this.#isCorrectSelectOption(encoding));
		}
		#setNameFormats(options) {
			this.#nameFormats = options.nameFormats.filter(nameFormat => this.#isCorrectSelectOption(nameFormat));
		}
		#setDelimiters(options) {
			this.#delimiters = options.delimiters.filter(delimiter => this.#isCorrectSelectOption(delimiter));
		}
		#setRequisitePresets(options) {
			this.#requisitePresets = options.requisitePresets.filter(requisitePreset => this.#isCorrectSelectOption(requisitePreset));
		}
		#setContactTypes(options) {
			this.#contactTypes = options.contactTypes.filter(contactType => this.#isCorrectSelectOption(contactType));
		}
		#setSources(options) {
			this.#sources = options.sources.filter(source => this.#isCorrectSelectOption(source));
		}
		#setDuplicateControlBehaviors(options) {
			this.#duplicateControlBehaviors = options.duplicateControlBehaviors.filter(behavior => this.#isCorrectSelectOption(behavior));
		}
		#setDuplicateControlTargets(options) {
			this.#duplicateControlTargets = options.duplicateControlTargets.filter(target => this.#isCorrectSelectOption(target));
		}
		#setDuplicateControlPermitted(options) {
			this.#isDuplicateControlPermitted = Boolean(options.isDuplicateControlPermitted);
		}
	}

	class WizardController {
		constructor(options = {}) {
			this.currentStepIndex = options.currentStepIndex;
			this.isProcessNext = options.isProcessNext;
			this.isProcessBack = options.isProcessBack;
			this.isBottomNavigationHidden = options.isBottomNavigationHidden;
			this.isFinish = options.isFinish;
			this.enableCancelConfirmation = options.enableCancelConfirmation;
			this.enableCompleteConfirmation = options.enableCompleteConfirmation;
			this.enableAgainConfirmation = options.enableAgainConfirmation;
		}
	}

	const HeaderTabList = {
		name: 'HeaderTabList',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			tabsCount: {
				type: Number,
				required: true
			}
		},
		template: `
		<div class="crm-item-import__wizard-header-tab-list">
			<template v-for="(_, index) in tabsCount">
				<div class="crm-item-import__wizard-header-tab-item">
					<slot :name="index" />
					<span
						v-if="index < tabsCount - 1"
						class="crm-item-import__wizard-header-tab-delimiter"
					>
						<BIcon
							name="chevron-right"
							:size="12"
							color="var(--ui-color-palette-gray-50)"
						/>
					</span>
				</div>
			</template>
		</div>
	`
	};

	const HeaderTab = {
		name: 'HeaderTab',
		props: {
			isActive: {
				type: Boolean,
				default: () => false
			}
		},
		computed: {
			tabClass() {
				return {
					'crm-item-import__wizard-header-tab': true,
					'--active': this.isActive
				};
			}
		},
		template: `
		<div :class="tabClass">
			<slot />
		</div>
	`
	};

	const StepPagination = {
		name: 'StepPagination',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		emits: ['next', 'back', 'cancel', 'complete', 'again'],
		props: {
			currentItemId: {
				type: Number,
				required: true
			},
			itemsCount: {
				type: Number,
				required: true
			},
			disabled: {
				type: Boolean,
				default: () => false
			},
			hidden: {
				type: Boolean,
				default: () => false
			}
		},
		data() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle
			};
		},
		computed: {
			isProcess() {
				return this.currentItemId < this.itemsCount - 1;
			},
			isFirstStep() {
				return this.currentItemId === 0;
			}
		},
		template: `
		<div class="crm-item-import__wizard-step-pagination" v-if="!hidden">
			<template v-if="isProcess">
				<UiButton
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_WIZARD_NAVIGATION_STEP_PAGINATION_NEXT')"
					:disabled="disabled"
					:style="AirButtonStyle.FILLED"
					@click="$emit('next')"
				/>
				<template v-if="isFirstStep">
					<UiButton
						:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_WIZARD_NAVIGATION_STEP_PAGINATION_CANCEL')"
						:disabled="disabled"
						:style="AirButtonStyle.PLAIN"
						@click="$emit('cancel')"
					/>
				</template>
				<template v-else>
					<UiButton
						:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_WIZARD_NAVIGATION_STEP_PAGINATION_BACK')"
						:disabled="disabled"
						:style="AirButtonStyle.PLAIN"
						@click="$emit('back')"
					/>
				</template>
			</template>
			<template v-else>
				<UiButton
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_WIZARD_NAVIGATION_STEP_PAGINATION_COMPLETE')"
					:disabled="disabled"
					:style="AirButtonStyle.FILLED_SUCCESS"
					@click="$emit('complete')"
				/>
				<UiButton
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_WIZARD_NAVIGATION_STEP_PAGINATION_AGAIN')"
					:disabled="disabled"
					:style="AirButtonStyle.FILLED"
					@click="$emit('again')"
				/>
			</template>
		</div>
	`
	};

	const Wizard = {
		name: 'Wizard',
		cancelConfirmationPopup: null,
		againConfirmationPopup: null,
		completeConfirmationPopup: null,
		isUserConfirmedClose: false,
		components: {
			HeaderTabList,
			HeaderTab,
			StepPagination
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			}
		},
		data: () => {
			return {
				wizardController: new WizardController({
					currentStepIndex: 0,
					isProcessNext: false,
					isProcessBack: false,
					isBottomNavigationHidden: false,
					isFinish: false,
					enableCancelConfirmation: true,
					enableCompleteConfirmation: true,
					enableAgainConfirmation: true
				})
			};
		},
		computed: {
			steps() {
				return this.$slots.default();
			},
			currentStepComponent() {
				return this.$slots.default()[this.wizardController.currentStepIndex];
			}
		},
		mounted() {
			this.confirmBeforeCloseSlider();
			this.bindWindowOnBeforeUnload();
		},
		beforeUnmount() {
			this.unbindWindowOnBeforeUnload();
		},
		methods: {
			async next() {
				this.wizardController.isProcessNext = true;
				const beforeNext = await this.$refs.currentStepRef?.beforeNext?.();
				this.wizardController.isProcessNext = false;
				if (beforeNext === false) {
					return;
				}
				this.wizardController.currentStepIndex++;
				this.scrollOnTop();
			},
			async back() {
				this.wizardController.isProcessBack = true;
				const beforeBack = await this.$refs.currentStepRef?.beforeBack?.();
				this.wizardController.isProcessBack = false;
				if (beforeBack === false) {
					return;
				}
				this.wizardController.currentStepIndex--;
				this.scrollOnTop();
			},
			async cancel() {
				const cancel = () => {
					this.unbindWindowOnBeforeUnload();
					this.slider().close();
					this.sendCancelAnalytics();
				};
				if (!this.wizardController.enableCancelConfirmation) {
					cancel();
					return;
				}
				if (this.cancelConfirmationPopup || !this.wizardController.enableCancelConfirmation) {
					return;
				}
				this.cancelConfirmationPopup = this.getConfirmationPopup({
					title: main_core.Loc.getMessage('CRM_ITEM_IMPORT_CANCEL_CONFIRMATION_TITLE'),
					message: main_core.Loc.getMessage('CRM_ITEM_IMPORT_CANCEL_CONFIRMATION'),
					yesMessage: main_core.Loc.getMessage('CRM_ITEM_IMPORT_CANCEL_CONFIRMATION_YES'),
					noMessage: main_core.Loc.getMessage('CRM_ITEM_IMPORT_CANCEL_CONFIRMATION_NO'),
					onYes: () => {
						this.isUserConfirmedClose = true;
						cancel();
					},
					onClose: () => {
						this.cancelConfirmationPopup = null;
					}
				});
				this.cancelConfirmationPopup.show();
			},
			async complete() {
				const complete = () => {
					this.unbindWindowOnBeforeUnload();
					this.slider().close();
					this.sendFinishAnalytics('crm_import_done');
				};
				if (!this.wizardController.enableCompleteConfirmation) {
					complete();
					return;
				}
				if (this.completeConfirmationPopup) {
					return;
				}
				this.completeConfirmationPopup = this.getConfirmationPopup({
					title: main_core.Loc.getMessage('CRM_ITEM_IMPORT_COMPLETE_CONFIRMATION_TITLE'),
					message: main_core.Loc.getMessage('CRM_ITEM_IMPORT_COMPLETE_CONFIRMATION'),
					yesMessage: main_core.Loc.getMessage('CRM_ITEM_IMPORT_COMPLETE_CONFIRMATION_YES'),
					noMessage: main_core.Loc.getMessage('CRM_ITEM_IMPORT_COMPLETE_CONFIRMATION_NO'),
					onYes: () => {
						this.isUserConfirmedClose = true;
						complete();
					},
					onClose: () => {
						this.completeConfirmationPopup = null;
					}
				});
				this.completeConfirmationPopup.show();
			},
			async again() {
				const again = () => {
					this.unbindWindowOnBeforeUnload();
					this.slider().reload();
					this.sendFinishAnalytics('crm_import_again');
				};
				if (!this.wizardController.enableAgainConfirmation) {
					again();
					return;
				}
				if (this.againConfirmationPopup) {
					return;
				}
				this.againConfirmationPopup = this.getConfirmationPopup({
					title: main_core.Loc.getMessage('CRM_ITEM_IMPORT_AGAIN_CONFIRMATION_TITLE'),
					message: main_core.Loc.getMessage('CRM_ITEM_IMPORT_AGAIN_CONFIRMATION'),
					yesMessage: main_core.Loc.getMessage('CRM_ITEM_IMPORT_AGAIN_CONFIRMATION_YES'),
					noMessage: main_core.Loc.getMessage('CRM_ITEM_IMPORT_AGAIN_CONFIRMATION_NO'),
					onYes: () => {
						again();
					},
					onClose: () => {
						this.againConfirmationPopup = null;
					}
				});
				this.againConfirmationPopup.show();
			},
			slider() {
				return BX.SidePanel?.Instance?.getSliderByWindow(window);
			},
			getConfirmationPopup(options) {
				const box = ui_dialogs_messagebox.MessageBox.create({
					mediumButtonSize: false,
					title: options.title,
					message: options.message,
					modal: true,
					useAirDesign: true,
					buttons: [new ui_buttons.Button({
						color: ui_buttons.ButtonColor.PRIMARY,
						size: ui_buttons.ButtonSize.SMALL,
						text: options.yesMessage,
						onclick: () => {
							box.close();
							if (main_core.Type.isFunction(options.onYes)) {
								options.onYes();
							}
						}
					}), new ui_buttons.Button({
						color: ui_buttons.ButtonColor.LINK,
						size: ui_buttons.ButtonSize.SMALL,
						text: options.noMessage,
						onclick: () => {
							box.close();
							if (main_core.Type.isFunction(options.onNo)) {
								options.onNo();
							}
						}
					})],
					popupOptions: {
						events: {
							onClose: () => {
								if (main_core.Type.isFunction(options?.onClose)) {
									options.onClose();
								}
							}
						}
					}
				});
				return box;
			},
			confirmBeforeCloseSlider() {
				main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', event => {
					const [sliderEvent] = event.getData();
					const isSliderBelongsToThisApp = this.slider() === sliderEvent?.getSlider();
					if (!isSliderBelongsToThisApp) {
						return;
					}
					if (this.isUserConfirmedClose) {
						return;
					}
					if (this.wizardController.isFinish && this.wizardController.enableCompleteConfirmation) {
						sliderEvent?.denyAction();
						this.complete();
						return;
					}
					if (this.wizardController.enableCancelConfirmation) {
						sliderEvent?.denyAction();
						this.cancel();
					}
				});
			},
			bindWindowOnBeforeUnload() {
				if (!this.beforeUnloadHandler) {
					this.beforeUnloadHandler = e => {
						e.preventDefault();
					};
					main_core.Event.bind(window, 'beforeunload', this.beforeUnloadHandler);
				}
			},
			unbindWindowOnBeforeUnload() {
				if (this.beforeUnloadHandler) {
					main_core.Event.unbind(window, 'beforeunload', this.beforeUnloadHandler);
					this.beforeUnloadHandler = null;
				}
			},
			sendFinishAnalytics(finishControl) {
				ui_analytics.sendData(crm_integration_analytics.Builder.Import.CreateEvent.createDefault(this.importSettings.get('entityTypeId')).setOrigin(this.importSettings.get('origin')).setImportCompleteButton(finishControl).buildData());
			},
			sendCancelAnalytics() {
				ui_analytics.sendData(crm_integration_analytics.Builder.Import.CancelEvent.createDefault(this.importSettings.get('entityTypeId')).setOrigin(this.importSettings.get('origin')).setStep(this.currentStepComponent.type.eventId).buildData());
			},
			scrollOnTop() {
				void this.$nextTick(() => {
					const element = this.$refs.currentStepRef?.$el || this.$refs.currentStepRef;
					if (element) {
						element.scrollIntoView({
							behavior: 'smooth',
							block: 'start'
						});
					}
				});
			}
		},
		template: `
		<div class="crm-item-import__wizard">
			<div class="crm-item-import__wizard-main">
				<div class="crm-item-import__wizard-header">
					<div class="crm-item-import__wizard-header-tabs-container">
						<HeaderTabList :tabs-count="steps.length">
							<template v-for="(step, index) in steps" #[index]>
								<HeaderTab :is-active="wizardController.currentStepIndex === index">
									{{ step.type.title }}
								</HeaderTab>
							</template>
						</HeaderTabList>
					</div>
				</div>
				<div class="crm-item-import__wizard-body">
					<div class="crm-item-import__wizard-step-container">
						<component
							:is="currentStepComponent"
							ref="currentStepRef"
							:wizard-controller="wizardController"
						/>
					</div>
				</div>
			</div>
			<div class="crm-item-import__wizard-footer">
				<div class="crm-item-import__wizard-footer-step-pagination-container">
					<StepPagination
						:current-item-id="wizardController.currentStepIndex"
						:items-count="steps.length"
						:disabled="wizardController.isProcessNext || wizardController.isProcessBack"
						:hidden="wizardController.isBottomNavigationHidden"
						@next="next"
						@back="back"
						@cancel="cancel"
						@complete="complete"
						@again="again"
					/>
				</div>
			</div>
		</div>
	`
	};

	const StepEventId = Object.freeze({
		ConfigureImportSettingsStep: 'configureImportSettings',
		ConfigureFieldRatioStep: 'configureFieldRatio',
		ConfigureDuplicateControlStep: 'configureDuplicateControl',
		ImportStep: 'import'
	});

	const ConfigureImportSettingsStep = {
		name: 'ConfigureImportSettingsStep',
		eventId: StepEventId.ConfigureImportSettingsStep,
		title: main_core.Loc.getMessage('CRM_ITEM_IMPORT_STEP_TITLE_CONFIGURE_IMPORT_SETTINGS_STEP'),
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			}
		},
		methods: {
			async beforeNext() {
				const validateImportFileIdEvent = new main_core_events.BaseEvent();
				this.$Bitrix.eventEmitter.emit('crm:item:import:field-importFileId:validate', validateImportFileIdEvent);
				if (validateImportFileIdEvent.isDefaultPrevented()) {
					return false;
				}
				return ServiceLocator.instance().getController().configureImportSettings(this.importSettings).then(response => {
					this.importSettings.setFieldBindings(new FieldBindings(response.fieldBindings)).setEntityFields(response.entityFields).setFileHeaders(response.fileHeaders).setPreviewTable(response.previewTable).setFilesize(response.filesize).setRequiredFieldIds(response.requiredFieldIds).setRequisiteDuplicateControlTargets(response.requisiteDuplicateControlTargets);
					return true;
				}).catch(response => {
					console.error(response);
					BX.UI.Notification.Center.notify({
						content: response.errors[0].message,
						autoHideDelay: 3000
					});
					return false;
				});
			}
		},
		template: `
		<div class="crm-item-import__wizard-step__configure-import-settings-step">
			<slot />
		</div>
	`
	};

	// todo: Remove after adding dependency on ui 26.200.0
	const AlertComponent = BX?.UI?.System?.Alert?.Vue?.Alert || Alert;
	const AlertDesignEnum = BX?.UI?.System?.Alert?.AlertDesign || AlertDesign;
	const RequisiteHintSet = {
		name: 'RequisiteHintSet',
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			}
		},
		components: {
			Alert: AlertComponent
		},
		data() {
			return {
				AlertDesignEnum
			};
		},
		methods: {
			isImportRequisite() {
				return Boolean(this.importSettings.get('isImportRequisite'));
			},
			isPresence(group) {
				const requisiteFields = this.importSettings.getEntityFields().filter(field => field.group === group);
				return requisiteFields.length > 0;
			},
			isRequisitePresetAssociate() {
				return Boolean(this.importSettings.get('isRequisitePresetAssociate'));
			},
			isRequisitePresetAssociateById() {
				return Boolean(this.importSettings.get('isRequisitePresetAssociateById'));
			},
			isRequisitePresetUseDefault() {
				return Boolean(this.importSettings.get('isRequisitePresetUseDefault'));
			},
			getFieldCaption(id) {
				return this.importSettings.getEntityFields().find(field => field.id === id)?.name;
			},
			getNameFieldRequiredHint() {
				return this.getHint('NAME_FIELD_REQUIRED', {
					'#RQ_NAME#': this.getFieldCaption('RQ_NAME')
				});
			},
			getIdFieldRequiredHint() {
				return this.getHint('ID_FIELD_REQUIRED', {
					'#RQ_ID#': this.getFieldCaption('RQ_ID')
				});
			},
			getPresetIdFieldRequiredHint() {
				return this.getHint('PRESET_ID_FIELD_REQUIRED', {
					'#RQ_PRESET_ID#': this.getFieldCaption('RQ_PRESET_ID')
				});
			},
			getAssociatePresetEnabledHint() {
				return this.getHint('ASSOCIATE_PRESET_ENABLED');
			},
			getPresetNameFieldRequiredHint() {
				return this.getHint('PRESET_NAME_FIELD_REQUIRED', {
					'#RQ_PRESET_NAME#': this.getFieldCaption('RQ_PRESET_NAME')
				});
			},
			getDefaultPresetFallbackHint() {
				return this.getHint('DEFAULT_PRESET_FALLBACK');
			},
			getDefaultPresetUsedHint() {
				return this.getHint('DEFAULT_PRESET_USED');
			},
			getAddressFieldRequiredHint() {
				const addressFieldPattern = /^RQ_RQ_ADDR_TYPE\|\d+$/;
				const addressFieldCaptions = this.importSettings.getEntityFields().filter(field => addressFieldPattern.test(field.id)).map(field => field.name);
				return this.getHint('ADDRESS_FIELD_REQUIRED', {
					'#RQ_RQ_ADDR_TYPE#': addressFieldCaptions.join(', ')
				});
			},
			getBankDetailsFieldRequiredHint() {
				return this.getHint('BANK_DETAILS_FIELD_REQUIRED', {
					'#BD_NAME#': this.getFieldCaption('BD_NAME')
				});
			},
			getBankDetailsUniqueIdHint() {
				return this.getHint('BANK_DETAILS_UNIQUE_ID', {
					'#BD_ID#': this.getFieldCaption('BD_ID')
				});
			},
			getHint(code, replace = {}) {
				const replaceValues = replace;
				replaceValues['\\[bold\\]'] = '<b>';
				replaceValues['\\[/bold\\]'] = '</b>';
				return this.$Bitrix.Loc.getMessage(`CRM_ITEM_IMPORT_RQ_HELP_${code}`, replaceValues);
			}
		},
		template: `
		<div class="crm-item-import__requisite-help" v-if="isImportRequisite() && isPresence('requisite')">
			<Alert
				:design="AlertDesignEnum.tinted"
				:hasCloseButton="false"
				leftImage="/bitrix/js/crm/item/import/dist/images/settings.png"
			>
				<div class="crm-item-import__requisite-help-hint-group-list">
					<div class="crm-item-import__requisite-help-hint-group-item">
						<p v-html="getNameFieldRequiredHint()" />
						<p v-html="getIdFieldRequiredHint()" />
					</div>

					<template v-if="isRequisitePresetAssociate()">
						<template v-if="isRequisitePresetAssociateById()">
							<div class="crm-item-import__requisite-help-hint-group-item">
								<p v-html="getPresetIdFieldRequiredHint()" />
								<p v-if="isRequisitePresetUseDefault()" v-html="getDefaultPresetFallbackHint()" />
							</div>
						</template>
						<template v-else>
							<div class="crm-item-import__requisite-help-hint-group-item">
								<p v-html="getAssociatePresetEnabledHint()" />
								<p v-html="getPresetNameFieldRequiredHint()" />
								<p v-if="isRequisitePresetUseDefault()" v-html="getDefaultPresetFallbackHint()" />
							</div>
						</template>
					</template>
					<template v-else>
						<div class="crm-item-import__requisite-help-hint-group-item">
							<p v-html="getDefaultPresetUsedHint()" />
						</div>
					</template>

					<template v-if="isPresence('address')">
						<div class="crm-item-import__requisite-help-hint-group-item">
							<p v-html="getAddressFieldRequiredHint()" />
						</div>
					</template>

					<template v-if="isPresence('bankDetail')">
						<div class="crm-item-import__requisite-help-hint-group-item">
							<p v-html="getBankDetailsFieldRequiredHint()" />
							<p v-html="getBankDetailsUniqueIdHint()" />
						</div>
					</template>
				</div>
			</Alert>
		</div>
	`
	};

	const ConfigureFieldRatioStep = {
		name: 'ConfigureFieldRatioStep',
		components: {
			SettingsSection,
			WarningAlert,
			ErrorAlert,
			TagSelector,
			Table,
			RequisiteHintSet
		},
		eventId: StepEventId.ConfigureFieldRatioStep,
		title: main_core.Loc.getMessage('CRM_ITEM_IMPORT_STEP_TITLE_CONFIGURE_FIELD_RATIO_STEP'),
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			}
		},
		methods: {
			async beforeNext() {
				return true;
			}
		},
		computed: {
			fields() {
				const columns = this.importSettings.getFileHeaders().map(fileHeader => {
					return {
						title: fileHeader.title,
						value: fileHeader.columnIndex
					};
				});
				const fieldBindings = this.importSettings.getFieldBindings();
				const requiredFields = this.importSettings.getRequiredFieldIds();
				return this.importSettings.getEntityFields().map(entityField => {
					return {
						fieldName: entityField.id,
						fieldCaption: entityField.name,
						options: columns,
						model: fieldBindings,
						required: requiredFields.includes(entityField.id),
						nullable: true,
						placeholder: main_core.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_RATIO_STEP_BINDINGS_FIELD_PLACEHOLDER'),
						display: 'row',
						readonly: Boolean(entityField.readonly)
					};
				});
			},
			isFewColumnsFound() {
				return this.importSettings.getFileHeaders().length <= 1;
			}
		},
		template: `
		<div class="crm-item-import__wizard-step__configure-field-ratio-step">
			<slot name="before" />
			<SettingsSection :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_RATIO_STEP_SECTION_TITLE_BINDINGS')">
				<RequisiteHintSet :import-settings="importSettings" />
				<ErrorAlert v-if="isFewColumnsFound">
					{{ this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_RATIO_STEP_FEW_COLUMNS_FOUND_ALERT') }}
				</ErrorAlert>
				<TagSelector
					v-for="field in fields"
					v-bind="field"
				/>
			</SettingsSection>
			<SettingsSection :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_RATIO_STEP_SECTION_TITLE_IMPORT_PREVIEW')">
				<Table v-bind="importSettings.getPreviewTable()" />
			</SettingsSection>
		</div>
	`
	};

	const DuplicateControlBehavior = {
		name: 'DuplicateControlBehavior',
		components: {
			Select
		},
		props: {
			model: {
				type: Object,
				required: true
			},
			behaviors: {
				type: Array,
				required: true
			},
			isDuplicateControlPermitted: {
				type: Boolean,
				required: true
			}
		},
		methods: {
			getIcon() {
				if (this.isDuplicateControlPermitted) {
					return null;
				}
				return {
					name: BX.UI.IconSet.Outline.LOCK_M
				};
			},
			isReadonly() {
				return !this.isDuplicateControlPermitted;
			},
			tryShowRestrictionSlider(event) {
				if (this.isDuplicateControlPermitted) {
					return;
				}
				event.preventDefault();
				ui_infoHelper.InfoHelper.show('limit_crm_duplicates_search');
			}
		},
		template: `
		<Select
			field-name="duplicateControlBehavior"
			:model="model"
			:options="behaviors"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DUPLICATE_CONTROL_BEHAVIOR')"
			:readonly="isReadonly()"
			:icon="getIcon()"
			@onSelectMouseDown="tryShowRestrictionSlider($event)"
		/>
	`
	};

	const DuplicateControlTargets = {
		name: 'DuplicateControlTargets',
		components: {
			TagSelector
		},
		props: {
			model: {
				type: Object,
				required: true
			},
			targets: {
				type: Array,
				required: true
			}
		},
		template: `
		<TagSelector
			field-name="duplicateControlTargets"
			:model="model"
			:options="targets"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DUPLICATE_CONTROL_TARGETS')"
			:multiple="true"
			:nullable="true"
		/>
	`
	};

	const DuplicateControlTargetsRequisite = {
		name: 'DuplicateControlTargetsRequisite',
		components: {
			TagSelector
		},
		props: {
			countryId: {
				type: Number,
				required: true
			},
			countryCaption: {
				type: String,
				required: true
			},
			targets: {
				type: Array,
				required: true
			},
			model: {
				type: Object,
				required: true
			}
		},
		mounted() {
			if (!this.model.get(this.fieldName)) {
				this.model.set(this.fieldName, this.targets.map(target => target.value));
			}
		},
		computed: {
			fieldCaption() {
				return this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DUPLICATE_CONTROL_TARGETS_REQUISITE', {
					'#COUNTRY_TITLE#': this.countryCaption
				});
			},
			fieldName() {
				return `duplicateControlTargetsRequisite__${this.countryId}`;
			}
		},
		template: `
		<TagSelector
			:field-name="fieldName"
			:model="model"
			:options="targets"
			:field-caption="fieldCaption"
			:multiple="true"
			:nullable="true"
		/>
	`
	};

	const ConfigureDuplicateControlStep = {
		name: 'ConfigureDuplicateControlStep',
		eventId: StepEventId.ConfigureDuplicateControlStep,
		title: main_core.Loc.getMessage('CRM_ITEM_IMPORT_STEP_TITLE_CONFIGURE_DUPLICATE_CONTROL_STEP'),
		components: {
			SettingsSection,
			DuplicateControlTargets,
			DuplicateControlBehavior,
			DuplicateControlTargetsRequisite
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		methods: {
			async beforeNext() {
				return true;
			}
		},
		computed: {
			requisiteDuplicateControlTargets() {
				if (!this.importSettings.get('isImportRequisite')) {
					return [];
				}
				return this.importSettings.getRequisiteDuplicateControlTargets().map(requisiteDuplicateControlTarget => {
					return {
						model: this.importSettings,
						targets: requisiteDuplicateControlTarget.fields.map(field => {
							return {
								title: field.fieldCaption,
								value: field.fieldId
							};
						}),
						countryId: requisiteDuplicateControlTarget.countryId,
						countryCaption: requisiteDuplicateControlTarget.countryCaption
					};
				});
			}
		},
		template: `
		<div class="crm-item-import__wizard-step__configure-duplicate-control-step">
			<SettingsSection :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_DUPLICATE_CONTROL_SECTION_TITLE')">
				<DuplicateControlBehavior
					:behaviors="dictionary.getDuplicateControlBehaviors()"
					:is-duplicate-control-permitted="dictionary.isDuplicateControlPermitted()"
					:model="importSettings"
				/>
				<DuplicateControlTargets
					:targets="dictionary.getDuplicateControlTargets()"
					:model="importSettings"
				/>
				<template v-for="requisiteDuplicateControlTarget in requisiteDuplicateControlTargets">
					<DuplicateControlTargetsRequisite v-bind="requisiteDuplicateControlTarget"/>
				</template>
			</SettingsSection>
		</div>
	`
	};

	const ImportStep = {
		name: 'ImportStep',
		eventId: StepEventId.ImportStep,
		title: main_core.Loc.getMessage('CRM_ITEM_IMPORT_STEP_TITLE_IMPORT_STEP'),
		startProgressBar: null,
		isStartProgressBarShown: false,
		progressBar: null,
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			wizardController: {
				type: WizardController,
				required: false
			}
		},
		components: {
			SettingsSection,
			Table,
			DownloadAlert
		},
		data() {
			return {
				currentLine: 0,
				processedBytes: 0,
				successImportCount: 0,
				failImportCount: 0,
				duplicateImportCount: 0,
				isFinished: false,
				errorsPreviewTable: {
					headers: [],
					rows: []
				},
				downloadFailImportFileUrl: null,
				downloadDuplicateImportFileUrl: null
			};
		},
		mounted() {
			this.getStartProgressBar().renderTo(this.$refs.progressBar);
			this.isStartProgressBarShown = true;
			this.wizardController.isBottomNavigationHidden = true;
			void this.startImport();
		},
		computed: {
			isShowErrorsPreviewTable() {
				return this.errorsPreviewTable && this.errorsPreviewTable.rows.length > 0 && this.errorsPreviewTable.headers.length > 0;
			},
			successInfo() {
				return this.loc('CRM_ITEM_IMPORT_IMPORT_STEP_SUCCESS_IMPORT_COUNT', {
					'#COUNT#': this.successImportCount
				});
			},
			failInfo() {
				if (this.failImportCount <= 0) {
					return null;
				}
				return this.loc('CRM_ITEM_IMPORT_IMPORT_STEP_FAIL_IMPORT_COUNT', {
					'#COUNT#': this.failImportCount
				});
			},
			duplicateInfo() {
				if (this.duplicateImportCount <= 0) {
					return null;
				}
				return this.loc('CRM_ITEM_IMPORT_IMPORT_STEP_DUPLICATE_COUNT', {
					'#COUNT#': this.duplicateImportCount
				});
			}
		},
		methods: {
			async beforeNext() {
				// eslint-disable-next-line no-console
				console.warn('BX.Crm.Item.Import: ImportStep must be last step');
				return false;
			},
			async startImport() {
				while (!this.isFinished) {
					try {
						// eslint-disable-next-line no-await-in-loop
						const importResponse = await this.executeImportStep();
						this.adjustProgressbar(importResponse);
						this.updateImportStats(importResponse);
						this.updateImportResults(importResponse);
						if (importResponse.isFinished) {
							this.finishImport();
							return;
						}
					} catch (error) {
						this.handleImportError(error);
					}
				}
			},
			async executeImportStep() {
				return ServiceLocator.instance().getController().import({
					importSettings: this.importSettings,
					currentLine: this.currentLine
				});
			},
			adjustProgressbar(importResponse) {
				if (this.isStartProgressBarShown) {
					this.getStartProgressBar().destroy();
					this.getProgressBar().renderTo(this.$refs.progressBar);
					this.isStartProgressBarShown = false;
				}
				this.processedBytes += importResponse.progressedBytes;
				this.getProgressBar().update(this.processedBytes);
			},
			updateImportStats(importResponse) {
				this.currentLine = importResponse.currentLine;
				this.successImportCount += importResponse.successImportCount;
				this.failImportCount += importResponse.failImportCount;
				this.duplicateImportCount += importResponse.duplicateImportCount;
			},
			updateImportResults(importResponse) {
				if (importResponse.errorsPreviewTable) {
					this.errorsPreviewTable.headers = importResponse.errorsPreviewTable.headers;
					this.errorsPreviewTable.rows.push(...importResponse.errorsPreviewTable.rows);
				}
				if (importResponse.downloadFailImportFileUrl) {
					this.downloadFailImportFileUrl = importResponse.downloadFailImportFileUrl;
				}
				if (importResponse.downloadDuplicateImportFileUrl) {
					this.downloadDuplicateImportFileUrl = importResponse.downloadDuplicateImportFileUrl;
				}
			},
			finishImport() {
				this.isFinished = true;
				const hasDownloadFiles = main_core.Type.isStringFilled(this.downloadFailImportFileUrl) || main_core.Type.isStringFilled(this.downloadDuplicateImportFileUrl);
				this.wizardController.enableCompleteConfirmation = hasDownloadFiles;
				this.wizardController.enableCancelConfirmation = hasDownloadFiles;
				this.wizardController.enableAgainConfirmation = hasDownloadFiles;
				this.wizardController.isBottomNavigationHidden = false;
				this.wizardController.isFinish = true;
				this.finishProgressBar();
				this.sendFinishAnalytics('success');
			},
			handleImportError(error) {
				this.finishProgressBar();
				this.isFinished = true;
				this.wizardController.enableCompleteConfirmation = false;
				this.wizardController.enableCancelConfirmation = false;
				this.wizardController.enableAgainConfirmation = false;
				this.wizardController.isBottomNavigationHidden = false;
				this.wizardController.isFinish = true;
				this.sendFinishAnalytics('error');
				void console.error(error);
				BX.UI.Notification.Center.notify({
					content: error.errors[0]?.message
				});
			},
			getProgressBar() {
				if (this.progressBar) {
					return this.progressBar;
				}
				this.progressBar = new ui_progressbar.ProgressBar({
					statusType: 'PERCENT',
					maxValue: this.importSettings.getFilesize()
				});
				return this.progressBar;
			},
			getStartProgressBar() {
				if (this.startProgressBar) {
					return this.startProgressBar;
				}
				this.startProgressBar = new ui_progressbar.ProgressBar({
					maxValue: 100,
					value: 30,
					infiniteLoading: true
				});
				return this.startProgressBar;
			},
			finishProgressBar() {
				if (this.isStartProgressBarShown) {
					this.getStartProgressBar().destroy();
					this.getProgressBar().renderTo(this.$refs.progressBar);
				}
				this.getProgressBar().finish();
			},
			sendFinishAnalytics(status) {
				ui_analytics.sendData(crm_integration_analytics.Builder.Import.CreateEvent.createDefault(this.importSettings.get('entityTypeId')).setOrigin(this.importSettings.get('origin')).setImportCompleteButton(null).setStatus(status).setSuccessCount(this.successImportCount).setErrorCount(this.failImportCount).setDuplicateCount(this.duplicateImportCount).buildData());
			},
			loc(phrase, replace = {}) {
				return this.$Bitrix.Loc.getMessage(phrase, replace);
			}
		},
		template: `
		<div class="crm-item-import__wizard-step__import-step">
			<SettingsSection :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_IMPORT_STEP_SECTION_TITLE')">
				<div class="crm-item-import__import-step__progressbar">
					<div ref="progressBar"></div>
				</div>
				<div class="crm-item-import__import-step-statistics">
					<span class="crm-item-import__import-step-statistic-item" v-html="successInfo" />
					<span class="crm-item-import__import-step-statistic-item" v-if="failInfo" v-html="failInfo" />
					<span class="crm-item-import__import-step-statistic-item" v-if="duplicateInfo" v-html="duplicateInfo" />
				</div>
				<div class="crm-item-import__import-step-alerts">
					<DownloadAlert
						v-if="isFinished && downloadFailImportFileUrl"
						phrase="CRM_ITEM_IMPORT_DOWNLOAD_FAIL_IMPORT"
						:download-url="downloadFailImportFileUrl"
					/>
					<DownloadAlert
						v-if="isFinished && downloadDuplicateImportFileUrl"
						phrase="CRM_ITEM_IMPORT_DOWNLOAD_DUPLICATE_IMPORT"
						:download-url="downloadDuplicateImportFileUrl"
					/>
				</div>
				<div class="crm-item-import__import-step-fail-preview" v-if="isShowErrorsPreviewTable">
					<Table v-bind="errorsPreviewTable" />
				</div>
			</SettingsSection>
		</div>
	`
	};

	const Delimiter = {
		name: 'Delimiter',
		components: {
			Select
		},
		props: {
			model: {
				type: Object,
				required: true
			},
			delimiters: {
				type: Array,
				required: true
			}
		},
		template: `
		<Select
			field-name="delimiter"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DELIMITER')"
			:options="delimiters"
		/>
	`
	};

	const IsFirstRowHasHeaders = {
		name: 'IsFirstRowHasHeaders',
		components: {
			Checkbox
		},
		props: {
			model: {
				type: Object,
				required: true
			}
		},
		template: `
		<Checkbox
			field-name="isFirstRowHasHeaders"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_FIRST_ROW_HAS_HEADERS')"
		/>
	`
	};

	const IsSkipEmptyColumns = {
		name: 'IsSkipEmptyColumns',
		components: {
			Checkbox
		},
		props: {
			model: {
				type: Object,
				required: true
			}
		},
		template: `
		<Checkbox
			field-name="isSkipEmptyColumns"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_SKIP_EMPTY_COLUMNS')"
		/>
	`
	};

	const DefaultContactType = {
		name: 'DefaultContactType',
		components: {
			TagSelector
		},
		props: {
			model: {
				type: Object,
				required: true
			},
			contactTypes: {
				type: Array,
				required: true
			}
		},
		template: `
		<TagSelector
			field-name="defaultContactType"
			:model="model"
			:options="contactTypes"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_CONTACT_TYPE')"
		/>
	`
	};

	const DefaultDescription = {
		name: 'DefaultDescription',
		components: {
			Textarea
		},
		props: {
			model: {
				type: Object,
				required: true
			}
		},
		template: `
		<Textarea
			field-name="defaultDescription"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_DESCRIPTION')"
		/>
	`
	};

	const DefaultExportNew = {
		name: 'DefaultExportNew',
		components: {
			Checkbox
		},
		props: {
			model: {
				type: Object,
				required: true
			}
		},
		template: `
		<Checkbox
			field-name="defaultExportNew"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_EXPORT_NEW')"
		/>
	`
	};

	const DefaultOpened = {
		name: 'DefaultOpened',
		components: {
			Checkbox
		},
		props: {
			model: {
				type: Object,
				required: true
			}
		},
		template: `
		<Checkbox
			field-name="defaultOpened"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_OPENED')"
		/>
	`
	};

	const DefaultResponsibleId = {
		name: 'DefaultResponsibleId',
		components: {
			UserSelector
		},
		props: {
			model: {
				type: Object,
				required: true
			}
		},
		template: `
		<UserSelector
			field-name="defaultResponsibleId"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_RESPONSIBLE_ID')"
		/>
	`
	};

	const DefaultSource = {
		name: 'DefaultSource',
		components: {
			TagSelector
		},
		props: {
			model: {
				type: Object,
				required: true
			},
			sources: {
				type: Array,
				required: true
			}
		},
		template: `
		<TagSelector
			field-name="defaultSource"
			:model="model"
			:options="sources"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_SOURCE')"
		/>
	`
	};

	const Encoding = {
		name: 'Encoding',
		content: null,
		components: {
			TagSelector,
			UiButton: ui_vue3_components_button.Button,
			Popup: ui_vue3_components_popup.Popup
		},
		props: {
			model: {
				type: ImportSettings,
				required: true
			},
			encodings: {
				type: Array,
				required: true
			}
		},
		data() {
			return {
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				isDetectEncodingPopupShow: false,
				encodingItems: [],
				isEncodingsLoading: false,
				isDetectEncodingEnabled: this.model.get('importFileIdBinary') !== null
			};
		},
		mounted() {
			this.model.subscribeValueChanged('importFileIdDetectedEncoding', this.onEncodingDetected);
			this.model.subscribeValueChanged('importFileIdBinary', this.onFileBinaryUploaded);
		},
		unmounted() {
			this.model.unsubscribeValueChanged('importFileIdDetectedEncoding', this.onEncodingDetected);
			this.model.unsubscribeValueChanged('importFileIdBinary', this.onFileBinaryUploaded);
		},
		methods: {
			onEncodingDetected(event) {
				const detectedEncoding = event.getData().newValue;
				this.model.set('encoding', detectedEncoding);
			},
			onFileBinaryUploaded(event) {
				this.isDetectEncodingEnabled = event.getData().newValue !== null;
			},
			selectEncoding(encodingItem) {
				this.model.set('encoding', encodingItem.value);
				this.isDetectEncodingPopupShow = false;
			},
			showDetectEncodePopup() {
				this.encodingItems = [];
				this.isEncodingsLoading = true;
				const content = this.model.get('importFileIdBinary');
				if (content === null) {
					return;
				}
				const chunk = content.slice(0, Math.min(8192, content.size));
				const promises = [];
				this.encodings.forEach(encoding => {
					const decoder = new TextDecoder(encoding.value);
					const promise = new Promise(resolve => {
						void chunk.arrayBuffer().then(arrayBuffer => {
							this.encodingItems.push({
								example: decoder.decode(arrayBuffer),
								title: encoding.title,
								value: encoding.value
							});
							resolve();
						});
					});
					promises.push(promise);
				});
				void Promise.all(promises).then(() => {
					this.isDetectEncodingPopupShow = true;
					this.isEncodingsLoading = false;
				});
			}
		},
		template: `
		<TagSelector
			field-name="encoding"
			class="--encoding"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_ENCODING')"
			:options="encodings"
		>
			<template #afterInput>
				<UiButton
					class="crm-item-import__open-detect-encoding-popup-button"
					:text="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_ENCODING_DETECT_ENCODING_BUTTON_TITLE')"
					@click="showDetectEncodePopup"
					:disabled="!isDetectEncodingEnabled"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.FILLED"
					:loading="isEncodingsLoading"
				/>
			</template>
		</TagSelector>
		<Popup
			v-if="isDetectEncodingPopupShow"
			@close="isDetectEncodingPopupShow = false"
			:options="{
				titleBar: this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_ENCODING_DETECT_ENCODING_POPUP_TITLE'),
				closeIcon: true,
				width: 700,
				disableScroll: true,
				overlay: {
					blur: '70',
				},
			}"
		>
			<div class="crm-item-import__detect-encoding-popup">
				<div class="crm-item-import__detect-encoding-popup-encoding-list">
					<div class="crm-item-import__detect-encoding-popup-encoding-item" v-for="encodingItem in encodingItems" @click="selectEncoding(encodingItem)">
						<div class="crm-item-import__detect-encoding-popup-encoding-value">{{ encodingItem.title }}</div>
						<div class="crm-item-import__detect-encoding-popup-encoding-preview">{{ encodingItem.example }}</div>
					</div>
				</div>
			</div>
		</Popup>
	`
	};

	const ImportFileId = {
		name: 'ImportFileId',
		components: {
			File
		},
		props: {
			model: {
				type: Object,
				required: true
			},
			title: {
				type: String,
				default: () => null
			},
			uploaderOptions: {
				type: Object,
				default: () => {}
			}
		},
		template: `
		<File
			field-name="importFileId"
			:model="model"
			:field-caption="title ?? this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IMPORT_FILE')"
			:uploader-options="{
				id: 'importFileIdUploader',
				multiple: false,
				acceptedFileTypes: [
					'.csv',
				],
				controller: 'crm.Import.File.Uploader.ImportFileUploaderController',
				controllerOptions: {
					entityTypeId: this.model.get('entityTypeId'),
				},
				...this.uploaderOptions,
			}"
			:required="true"
		/>
	`
	};

	const NameFormat = {
		name: 'NameFormat',
		components: {
			Select
		},
		props: {
			model: {
				type: Object,
				required: true
			},
			nameFormats: {
				type: Array,
				required: true
			}
		},
		template: `
		<Select
			field-name="nameFormat"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_NAME_FORMAT')"
			:options="nameFormats"
		/>
	`
	};

	const DefaultRequisitePresetId = {
		name: 'DefaultRequisitePresetId',
		components: {
			TagSelector
		},
		props: {
			model: {
				type: ImportSettings,
				required: true
			},
			requisitePresets: {
				type: Array,
				required: true
			}
		},
		template: `
		<TagSelector
			field-name="defaultRequisitePresetId"
			:model="model"
			:options="requisitePresets"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_DEFAULT_REQUISITE_PRESET')"
		/>
	`
	};

	const IsImportRequisite = {
		name: 'IsImportRequisite',
		components: {
			Checkbox
		},
		props: {
			model: {
				type: Object,
				required: true
			}
		},
		template: `
		<Checkbox
			field-name="isImportRequisite"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_IMPORT_REQUISITE')"
		/>
	`
	};

	const IsRequisitePresetAssociate = {
		name: 'IsRequisitePresetAssociate',
		components: {
			Checkbox
		},
		props: {
			model: {
				type: Object,
				required: true
			}
		},
		template: `
		<Checkbox
			field-name="isRequisitePresetAssociate"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_REQUISITE_ASSOC_PRESET')"
		/>
	`
	};

	const IsRequisitePresetAssociateById = {
		name: 'isRequisitePresetAssociateById',
		components: {
			Checkbox
		},
		props: {
			model: {
				type: Object,
				required: true
			}
		},
		template: `
		<Checkbox
			field-name="isRequisitePresetAssociateById"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_REQUISITE_ASSOC_PRESET_BY_ID')"
		/>
	`
	};

	const IsRequisitePresetUseDefault = {
		name: 'IsRequisitePresetUseDefault',
		components: {
			Checkbox
		},
		props: {
			model: {
				type: Object,
				required: true
			}
		},
		template: `
		<Checkbox
			field-name="isRequisitePresetUseDefault"
			:model="model"
			:field-caption="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IS_REQUISITE_PRESET_USE_DEFAULT')"
		/>
	`
	};

	const GeneralSettingsSection = {
		name: 'GeneralSettingsSection',
		components: {
			SettingsSection
		},
		template: `
		<SettingsSection
			:title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_SETTING_SECTION_GENERAL_SETTINGS')"
			:is-delimiter-enabled="false"
		>
			<slot />
		</SettingsSection>
	`
	};

	const RequisiteSettingsSection = {
		name: 'RequisiteSettingsSection',
		props: {
			importSettings: {
				type: ImportSettings,
				require: true
			},
			requisitePresets: {
				type: Array,
				required: true
			}
		},
		components: {
			SettingsSection,
			IsImportRequisite,
			DefaultRequisitePresetId,
			IsRequisitePresetAssociate,
			IsRequisitePresetAssociateById,
			IsRequisitePresetUseDefault
		},
		data() {
			return {
				isImportRequisite: this.importSettings.get('isImportRequisite')
			};
		},
		mounted() {
			this.importSettings.subscribeValueChanged('isImportRequisite', this.handleIsImportRequisiteChange);
		},
		beforeUnmount() {
			this.importSettings.unsubscribeValueChanged('isImportRequisite', this.handleIsImportRequisiteChange);
		},
		methods: {
			handleIsImportRequisiteChange(event) {
				const data = event.getData();
				this.isImportRequisite = data.newValue;
				if (this.isImportRequisite) {
					void this.$nextTick(() => {
						const element = this.$refs.section?.$el || this.$refs.section;
						if (element) {
							element.scrollIntoView({
								behavior: 'smooth',
								block: 'end'
							});
						}
					});
				}
			}
		},
		template: `
		<SettingsSection
			:title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_SETTING_SECTION_REQUISITE')"
			ref="section"
		>
			<IsImportRequisite
				:model="importSettings"
			/>
			<DefaultRequisitePresetId
				v-if="isImportRequisite"
				:requisite-presets="requisitePresets"
				:model="importSettings"
			/>
			<IsRequisitePresetAssociate
				v-if="isImportRequisite"
				:model="importSettings"
			/>
			<IsRequisitePresetAssociateById
				v-if="isImportRequisite"
				:model="importSettings"
			/>
			<IsRequisitePresetUseDefault
				v-if="isImportRequisite"
				:model="importSettings"
			/>
		</SettingsSection>
	`
	};

	const DefaultValuesSection = {
		name: 'DefaultValuesSection',
		components: {
			SettingsSection
		},
		template: `
		<SettingsSection :title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_SETTING_SECTION_DEFAULT_VALUES')">
			<slot />
		</SettingsSection>
	`
	};

	const Lead = {
		name: 'Lead',
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ConfigureDuplicateControlStep,
			ImportStep,
			Page,
			DownloadExampleAlert,
			Hr: Delimiter$1,
			GeneralSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			DefaultResponsibleId,
			NameFormat,
			Delimiter,
			IsFirstRowHasHeaders,
			IsSkipEmptyColumns
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		template: `
		<Page class="--lead">
			<Wizard :import-settings="importSettings">
				<ConfigureImportSettingsStep :import-settings="importSettings">
					<GeneralSettingsSection>
						<ImportFileId
							:model="importSettings"
						/>
						<DownloadExampleAlert
							:import-settings="importSettings"
						/>
						<Encoding
							:encodings="dictionary.getEncodings()"
							:model="importSettings"
						/>
						<Delimiter
							:delimiters="dictionary.getDelimiters()"
							:model="importSettings"
						/>
						<IsFirstRowHasHeaders
							:model="importSettings"
						/>
						<IsSkipEmptyColumns
							:model="importSettings"
						/>
						<NameFormat
							:name-formats="dictionary.getNameFormats()"
							:model="importSettings"
						/>
					</GeneralSettingsSection>
				</ConfigureImportSettingsStep>
				<ConfigureFieldRatioStep :import-settings="importSettings">
					<template #before>
						<DefaultValuesSection>
							<DefaultResponsibleId
								:model="importSettings"
							/>
						</DefaultValuesSection>
					</template>
				</ConfigureFieldRatioStep>
				<ConfigureDuplicateControlStep
					:import-settings="importSettings"
					:dictionary="dictionary"
				/>
				<ImportStep :import-settings="importSettings" />
			</Wizard>
		</Page>
	`
	};

	const Deal = {
		name: 'Deal',
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ImportStep,
			Page,
			DownloadExampleAlert,
			Hr: Delimiter$1,
			GeneralSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			DefaultResponsibleId,
			NameFormat,
			Delimiter,
			IsFirstRowHasHeaders,
			IsSkipEmptyColumns
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		template: `
		<Page class="--deal">
			<Wizard :import-settings="importSettings">
				<ConfigureImportSettingsStep :import-settings="importSettings">
					<GeneralSettingsSection>
						<ImportFileId
							:model="importSettings"
						/>
						<DownloadExampleAlert
							:import-settings="importSettings"
						/>
						<Encoding
							:encodings="dictionary.getEncodings()"
							:model="importSettings"
						/>
						<Delimiter
							:delimiters="dictionary.getDelimiters()"
							:model="importSettings"
						/>
						<IsFirstRowHasHeaders
							:model="importSettings"
						/>
						<IsSkipEmptyColumns
							:model="importSettings"
						/>
						<NameFormat
							:name-formats="dictionary.getNameFormats()"
							:model="importSettings"
						/>
					</GeneralSettingsSection>
				</ConfigureImportSettingsStep>
				<ConfigureFieldRatioStep :import-settings="importSettings">
					<template #before>
						<DefaultValuesSection>
							<DefaultResponsibleId
								:model="importSettings"
							/>
						</DefaultValuesSection>
					</template>
				</ConfigureFieldRatioStep>
				<ImportStep :import-settings="importSettings" />
			</Wizard>
		</Page>
	`
	};

	const CustomOrigin = {
		name: 'CustomOrigin',
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ConfigureDuplicateControlStep,
			ImportStep,
			GeneralSettingsSection,
			RequisiteSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			NameFormat,
			Delimiter,
			IsFirstRowHasHeaders,
			IsSkipEmptyColumns,
			DefaultContactType,
			DefaultSource,
			DefaultDescription,
			DefaultOpened,
			DefaultExportNew,
			DefaultResponsibleId,
			Page,
			DownloadExampleAlert,
			Hr: Delimiter$1
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		template: `
		<Wizard :import-settings="importSettings">
			<ConfigureImportSettingsStep :import-settings="importSettings">
				<GeneralSettingsSection>
					<ImportFileId :model="importSettings" />
					<DownloadExampleAlert
						:import-settings="importSettings"
					/>
					<Encoding 
						:encodings="dictionary.getEncodings()" 
						:model="importSettings" 
					/>
					<Delimiter 
						:delimiters="dictionary.getDelimiters()" 
						:model="importSettings" 
					/>
					<IsSkipEmptyColumns
						:model="importSettings"
					/>
					<IsFirstRowHasHeaders
						:model="importSettings"
					/>
					<NameFormat
						:name-formats="dictionary.getNameFormats()"
						:model="importSettings"
					/>
				</GeneralSettingsSection>
				<RequisiteSettingsSection
					:import-settings="importSettings"
					:requisite-presets="dictionary.getRequisitePresets()"
				/>
			</ConfigureImportSettingsStep>
			<ConfigureFieldRatioStep :import-settings="importSettings">
				<template #before>
					<DefaultValuesSection>
						<DefaultContactType
							:contact-types="dictionary.getContactTypes()"
							:model="importSettings"
						/>
						<DefaultSource
							:sources="dictionary.getSources()"
							:model="importSettings"
						/>
						<DefaultDescription
							:model="importSettings"
						/>
						<DefaultOpened
							:model="importSettings"
						/>
						<DefaultExportNew
							:model="importSettings"
						/>
						<DefaultResponsibleId
							:model="importSettings"
						/>
					</DefaultValuesSection>
				</template>
			</ConfigureFieldRatioStep>
			<ConfigureDuplicateControlStep
				:import-settings="importSettings"
				:dictionary="dictionary"
			/>
			<ImportStep :import-settings="importSettings" />
		</Wizard>
	`
	};

	const VcardOrigin = {
		name: 'VcardOrigin',
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ConfigureDuplicateControlStep,
			ImportStep,
			GeneralSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			DefaultContactType,
			DefaultSource,
			DefaultDescription,
			DefaultOpened,
			DefaultExportNew,
			DefaultResponsibleId,
			Hr: Delimiter$1
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		template: `
		<Wizard :import-settings="importSettings">
			<ConfigureImportSettingsStep :import-settings="importSettings">
				<GeneralSettingsSection>
					<ImportFileId
						:model="importSettings"
						:title="this.$Bitrix.Loc.getMessage('CRM_ITEM_IMPORT_FIELD_IMPORT_FILE_VCARD')"
						:uploader-options="{
							acceptedFileTypes: [
								'.vcf',
							],
						}"
					/>
					<Encoding
						:encodings="dictionary.getEncodings()"
						:model="importSettings"
					/>
				</GeneralSettingsSection>
			</ConfigureImportSettingsStep>
			<ConfigureFieldRatioStep :import-settings="importSettings">
				<template #before>
					<DefaultValuesSection>
						<DefaultContactType
							:contact-types="dictionary.getContactTypes()"
							:model="importSettings"
						/>
						<DefaultSource
							:sources="dictionary.getSources()"
							:model="importSettings"
						/>
						<DefaultDescription
							:model="importSettings"
						/>
						<DefaultOpened
							:model="importSettings"
						/>
						<DefaultExportNew
							:model="importSettings"
						/>
						<DefaultResponsibleId :model="importSettings" />
					</DefaultValuesSection>
				</template>
			</ConfigureFieldRatioStep>
			<ConfigureDuplicateControlStep
				:import-settings="importSettings"
				:dictionary="dictionary"
			/>
			<ImportStep :import-settings="importSettings" />
		</Wizard>
	`
	};

	const GmailOrigin = {
		name: 'GmailOrigin',
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ConfigureDuplicateControlStep,
			ImportStep,
			GeneralSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			Delimiter,
			DefaultContactType,
			DefaultSource,
			DefaultDescription,
			DefaultOpened,
			DefaultExportNew,
			DefaultResponsibleId
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		template: `
		<Wizard :import-settings="importSettings">
			<ConfigureImportSettingsStep :import-settings="importSettings">
				<GeneralSettingsSection>
					<ImportFileId :model="importSettings" />
					<Encoding :model="importSettings" :encodings="dictionary.getEncodings()"/>
					<Delimiter :model="importSettings" :delimiters="dictionary.getDelimiters()" />
				</GeneralSettingsSection>
			</ConfigureImportSettingsStep>
			<ConfigureFieldRatioStep :import-settings="importSettings">
				<template #before>
					<DefaultValuesSection>
						<DefaultContactType
							:contact-types="dictionary.getContactTypes()"
							:model="importSettings"
						/>
						<DefaultSource
							:sources="dictionary.getSources()"
							:model="importSettings"
						/>
						<DefaultDescription
							:model="importSettings"
						/>
						<DefaultOpened
							:model="importSettings"
						/>
						<DefaultExportNew
							:model="importSettings"
						/>
						<DefaultResponsibleId
							:model="importSettings"
						/>
					</DefaultValuesSection>
				</template>
			</ConfigureFieldRatioStep>
			<ConfigureDuplicateControlStep
				:import-settings="importSettings"
				:dictionary="dictionary"
			/>
			<ImportStep :import-settings="importSettings" />
		</Wizard>
	`
	};

	const OutlookOrigin = {
		name: 'OutlookOrigin',
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ConfigureDuplicateControlStep,
			ImportStep,
			GeneralSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			Delimiter,
			DefaultContactType,
			DefaultSource,
			DefaultDescription,
			DefaultOpened,
			DefaultExportNew,
			DefaultResponsibleId
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		template: `
		<Wizard :import-settings="importSettings">
			<ConfigureImportSettingsStep :import-settings="importSettings">
				<GeneralSettingsSection>
					<ImportFileId :model="importSettings" />
					<Encoding :model="importSettings" :encodings="dictionary.getEncodings()" />
					<Delimiter :model="importSettings" :delimiters="dictionary.getDelimiters()" />
				</GeneralSettingsSection>
			</ConfigureImportSettingsStep>
			<ConfigureFieldRatioStep :import-settings="importSettings">
				<template #before>
					<DefaultValuesSection>
						<DefaultContactType
							:contact-types="dictionary.getContactTypes()"
							:model="importSettings"
						/>
						<DefaultSource
							:sources="dictionary.getSources()"
							:model="importSettings"
						/>
						<DefaultDescription
							:model="importSettings"
						/>
						<DefaultOpened
							:model="importSettings"
						/>
						<DefaultExportNew
							:model="importSettings"
						/>
						<DefaultResponsibleId
							:model="importSettings"
						/>
					</DefaultValuesSection>
				</template>
			</ConfigureFieldRatioStep>
			<ConfigureDuplicateControlStep
				:import-settings="importSettings"
				:dictionary="dictionary"
			/>
			<ImportStep :import-settings="importSettings" />
		</Wizard>
	`
	};

	const YahooOrigin = {
		name: 'YahooOrigin',
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ConfigureDuplicateControlStep,
			ImportStep,
			GeneralSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			Delimiter,
			DefaultContactType,
			DefaultSource,
			DefaultDescription,
			DefaultOpened,
			DefaultExportNew,
			DefaultResponsibleId
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		template: `
		<Wizard :import-settings="importSettings">
			<ConfigureImportSettingsStep :import-settings="importSettings">
				<GeneralSettingsSection>
					<ImportFileId :model="importSettings" />
					<Encoding :model="importSettings" :encodings="dictionary.getEncodings()" />
					<Delimiter :model="importSettings" :delimiters="dictionary.getDelimiters()" />
				</GeneralSettingsSection>
			</ConfigureImportSettingsStep>
			<ConfigureFieldRatioStep :import-settings="importSettings">
				<template #before>
					<DefaultValuesSection>
						<DefaultContactType
							:contact-types="dictionary.getContactTypes()"
							:model="importSettings"
						/>
						<DefaultSource
							:sources="dictionary.getSources()"
							:model="importSettings"
						/>
						<DefaultDescription
							:model="importSettings"
						/>
						<DefaultOpened
							:model="importSettings"
						/>
						<DefaultExportNew
							:model="importSettings"
						/>
						<DefaultResponsibleId
							:model="importSettings"
						/>
					</DefaultValuesSection>
				</template>
			</ConfigureFieldRatioStep>
			<ConfigureDuplicateControlStep
				:import-settings="importSettings"
				:dictionary="dictionary"
			/>
			<ImportStep :import-settings="importSettings" />
		</Wizard>
	`
	};

	const Contact = {
		name: 'Contact',
		components: {
			Page
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		computed: {
			wizardByOrigin() {
				const origin = this.importSettings.get('origin');
				if (origin === 'vcard') {
					return VcardOrigin;
				}
				if (origin === 'gmail') {
					return GmailOrigin;
				}
				if (origin === 'outlook') {
					return OutlookOrigin;
				}
				if (origin === 'yahoo') {
					return YahooOrigin;
				}
				return CustomOrigin;
			}
		},
		template: `
		<Page class="--contact">
			<component :is="wizardByOrigin" :import-settings="importSettings" :dictionary="dictionary" />
		</Page>
	`
	};

	const Company = {
		name: 'Company',
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ConfigureDuplicateControlStep,
			ImportStep,
			GeneralSettingsSection,
			RequisiteSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			DefaultResponsibleId,
			NameFormat,
			Delimiter,
			IsFirstRowHasHeaders,
			IsSkipEmptyColumns,
			Page,
			DownloadExampleAlert,
			Hr: Delimiter$1
		},
		template: `
		<Page class="--company">
			<Wizard :import-settings="importSettings">
				<ConfigureImportSettingsStep :import-settings="importSettings">
					<GeneralSettingsSection>
						<ImportFileId
							:model="importSettings"
						/>
						<DownloadExampleAlert
							:import-settings="importSettings"
						/>
						<Encoding
							:encodings="dictionary.getEncodings()"
							:model="importSettings"
						/>
						<Delimiter
							:delimiters="dictionary.getDelimiters()"
							:model="importSettings"
						/>
						<IsSkipEmptyColumns
							:model="importSettings"
						/>
						<IsFirstRowHasHeaders
							:model="importSettings"
						/>
						<NameFormat
							:name-formats="dictionary.getNameFormats()"
							:model="importSettings"
						/>
					</GeneralSettingsSection>
					<RequisiteSettingsSection
						:import-settings="importSettings"
						:requisite-presets="dictionary.getRequisitePresets()"
					/>
				</ConfigureImportSettingsStep>
				<ConfigureFieldRatioStep :import-settings="importSettings">
					<template #before>
						<DefaultValuesSection>
							<DefaultResponsibleId
								:model="importSettings"
							/>
						</DefaultValuesSection>
					</template>
				</ConfigureFieldRatioStep>
				<ConfigureDuplicateControlStep
					:import-settings="importSettings"
					:dictionary="dictionary"
				/>
				<ImportStep :import-settings="importSettings" />
			</Wizard>
		</Page>
	`
	};

	const Quote = {
		name: 'Quote',
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ImportStep,
			Page,
			DownloadExampleAlert,
			Hr: Delimiter$1,
			GeneralSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			DefaultResponsibleId,
			NameFormat,
			Delimiter,
			IsFirstRowHasHeaders,
			IsSkipEmptyColumns
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		template: `
		<Page class="--quote">
			<Wizard :import-settings="importSettings">
				<ConfigureImportSettingsStep :import-settings="importSettings">
					<GeneralSettingsSection>
						<ImportFileId
							:model="importSettings"
						/>
						<DownloadExampleAlert
							:import-settings="importSettings"
						/>
						<Encoding
							:encodings="dictionary.getEncodings()"
							:model="importSettings"
						/>
						<Delimiter
							:delimiters="dictionary.getDelimiters()"
							:model="importSettings"
						/>
						<IsFirstRowHasHeaders
							:model="importSettings"
						/>
						<IsSkipEmptyColumns
							:model="importSettings"
						/>
						<NameFormat
							:name-formats="dictionary.getNameFormats()"
							:model="importSettings"
						/>
					</GeneralSettingsSection>
				</ConfigureImportSettingsStep>
				<ConfigureFieldRatioStep :import-settings="importSettings">
					<template #before>
						<DefaultValuesSection>
							<DefaultResponsibleId
								:model="importSettings"
							/>
						</DefaultValuesSection>
					</template>
				</ConfigureFieldRatioStep>
				<ImportStep :import-settings="importSettings" />
			</Wizard>
		</Page>
	`
	};

	const SmartInvoice = {
		name: 'SmartInvoice',
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ImportStep,
			Page,
			DownloadExampleAlert,
			Hr: Delimiter$1,
			GeneralSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			DefaultResponsibleId,
			NameFormat,
			Delimiter,
			IsFirstRowHasHeaders,
			IsSkipEmptyColumns
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		template: `
		<Page class="--deal">
			<Wizard :import-settings="importSettings">
				<ConfigureImportSettingsStep :import-settings="importSettings">
					<GeneralSettingsSection>
						<ImportFileId
							:model="importSettings"
						/>
						<DownloadExampleAlert
							:import-settings="importSettings"
						/>
						<Encoding
							:encodings="dictionary.getEncodings()"
							:model="importSettings"
						/>
						<Delimiter
							:delimiters="dictionary.getDelimiters()"
							:model="importSettings"
						/>
						<IsFirstRowHasHeaders
							:model="importSettings"
						/>
						<IsSkipEmptyColumns
							:model="importSettings"
						/>
						<NameFormat
							:name-formats="dictionary.getNameFormats()"
							:model="importSettings"
						/>
					</GeneralSettingsSection>
				</ConfigureImportSettingsStep>
				<ConfigureFieldRatioStep :import-settings="importSettings">
					<template #before>
						<DefaultValuesSection>
							<DefaultResponsibleId
								:model="importSettings"
							/>
						</DefaultValuesSection>
					</template>
				</ConfigureFieldRatioStep>
				<ImportStep :import-settings="importSettings" />
			</Wizard>
		</Page>
	`
	};

	const Dynamic = {
		name: 'Dynamic',
		components: {
			Wizard,
			ConfigureImportSettingsStep,
			ConfigureFieldRatioStep,
			ImportStep,
			Page,
			DownloadExampleAlert,
			Hr: Delimiter$1,
			GeneralSettingsSection,
			DefaultValuesSection,
			ImportFileId,
			Encoding,
			DefaultResponsibleId,
			NameFormat,
			Delimiter,
			IsFirstRowHasHeaders,
			IsSkipEmptyColumns
		},
		props: {
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		template: `
		<Page class="--dynamic">
			<Wizard :import-settings="importSettings">
				<ConfigureImportSettingsStep :import-settings="importSettings">
					<GeneralSettingsSection>
						<ImportFileId
							:model="importSettings"
						/>
						<DownloadExampleAlert
							:import-settings="importSettings"
						/>
						<Encoding
							:encodings="dictionary.getEncodings()"
							:model="importSettings"
						/>
						<Delimiter
							:delimiters="dictionary.getDelimiters()"
							:model="importSettings"
						/>
						<IsFirstRowHasHeaders
							:model="importSettings"
						/>
						<IsSkipEmptyColumns
							:model="importSettings"
						/>
						<NameFormat
							:name-formats="dictionary.getNameFormats()"
							:model="importSettings"
						/>
					</GeneralSettingsSection>
				</ConfigureImportSettingsStep>
				<ConfigureFieldRatioStep :import-settings="importSettings">
					<template #before>
						<DefaultValuesSection>
							<DefaultResponsibleId
								:model="importSettings"
							/>
						</DefaultValuesSection>
					</template>
				</ConfigureFieldRatioStep>
				<ImportStep :import-settings="importSettings" />
			</Wizard>
		</Page>
	`
	};

	const Entity = BX.CrmEntityType.enumeration;
	const PAGE_MAP = Object.freeze({
		[Entity.lead]: Lead,
		[Entity.deal]: Deal,
		[Entity.contact]: Contact,
		[Entity.company]: Company,
		[Entity.quote]: Quote,
		[Entity.smartinvoice]: SmartInvoice
	});
	const App = {
		name: 'App',
		props: {
			entityTypeId: {
				type: Number,
				required: true
			},
			importSettings: {
				type: ImportSettings,
				required: true
			},
			dictionary: {
				type: Dictionary,
				required: true
			}
		},
		computed: {
			page() {
				const page = PAGE_MAP[this.entityTypeId] ?? null;
				if (page !== null) {
					return page;
				}
				if (BX.CrmEntityType.isDynamicTypeByTypeId(this.entityTypeId)) {
					return Dynamic;
				}
				throw new RangeError('BX.Crm.Item.Import.App: Unknown entityTypeId');
			}
		},
		template: `
		<div class="crm-item-import">
			<component :is="page" :import-settings="importSettings" :dictionary="dictionary" />
		</div>
	`
	};

	class Import {
		#app;
		constructor(options = {}) {
			if (!this.#isAvailableEntityTypeId(options.entityTypeId)) {
				throw new RangeError(`BX.Crm.Item.Import: Unsupported entityTypeId: ${options.entityTypeId}`);
			}
			this.#app = ui_vue3.BitrixVue.createApp(App, {
				entityTypeId: options.entityTypeId,
				importSettings: new ImportSettings(options.importSettings),
				dictionary: new Dictionary(options.dictionary)
			});
		}
		mount(container) {
			return this.#app.mount(container);
		}
		#isAvailableEntityTypeId(entityTypeId) {
			const availableTypeIds = [BX.CrmEntityType.enumeration.lead, BX.CrmEntityType.enumeration.deal, BX.CrmEntityType.enumeration.contact, BX.CrmEntityType.enumeration.company, BX.CrmEntityType.enumeration.quote, BX.CrmEntityType.enumeration.smartinvoice];
			return availableTypeIds.includes(entityTypeId) || BX.CrmEntityType.isDynamicTypeByTypeId(entityTypeId);
		}
	}

	exports.Import = Import;

})(this.BX.Crm.Item = this.BX.Crm.Item || {}, BX.Vue3, BX, BX.Event, BX.Cache, BX.UI.System.Typography.Vue, BX.UI.IconSet, BX.UI.EntitySelector, BX.UI.Uploader, BX.Vue3.Components, BX.UI.Uploader, BX.Crm.Integration.Analytics, BX.UI.Analytics, BX.UI, BX.UI.Dialogs, BX, BX.UI.System.Alert, BX.UI, BX, BX.UI, BX.UI.Vue3.Components);
//# sourceMappingURL=import.bundle.js.map
