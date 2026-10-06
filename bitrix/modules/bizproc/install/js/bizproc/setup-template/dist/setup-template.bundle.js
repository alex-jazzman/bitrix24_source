/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, pull_client, ui_vue3, main_core_events, ui_a11y, ui_entitySelector, bizproc_ragSelector, ui_uploader_tileWidget, ui_uploader_core, ui_datePicker, main_date, ui_switcher, ui_vue3_components_switcher) {
	'use strict';

	const ITEM_TYPES = Object.freeze({
		DELIMITER: 'delimiter',
		TITLE: 'title',
		TITLE_WITH_ICON: 'titleWithIcon',
		DESCRIPTION: 'description',
		CONSTANT: 'constant'
	});
	const CONSTANT_TYPES = Object.freeze({
		STRING: 'string',
		INT: 'int',
		USER: 'user',
		FILE: 'file',
		TEXT: 'text',
		SELECT: 'select',
		KNOWLEDGE: 'rag_knowledge_base',
		PROJECT: 'project',
		ENTITY_SELECTOR: 'entityselector',
		TIME: 'time',
		DATE: 'date',
		DATETIME: 'datetime',
		BOOL: 'bool',
		BI_DASHBOARD: 'bi_dashboard'
	});
	const TEMPLATE_SETUP_EVENT_NAME = {
		SUCCESS: 'Bizproc.AiAgentsGrid.TemplateSetup:success'
	};
	const PRESET_TITLE_ICONS = {
		IMAGE: 'o-image',
		ATTACH: 'o-attach',
		SETTINGS: 'o-settings',
		STARS: 'o-ai-stars'
	};

	// @vue/component
	const ConstantTextual = {
		name: 'ConstantTextual',
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array],
				default: ''
			},
			labelledbyId: {
				type: String,
				default: ''
			},
			describedbyId: {
				type: String,
				default: ''
			},
			invalid: {
				type: Boolean,
				default: false
			},
			required: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		computed: {
			multipleValues() {
				const model = this.modelValue;
				return main_core.Type.isArray(model) && model.length > 0 ? model : [''];
			},
			showRemoveIcon() {
				return this.item.multiple && this.multipleValues.length > 1;
			}
		},
		methods: {
			updateConstant(newValue) {
				this.$emit('update:modelValue', newValue);
			},
			updateSingleValue(event) {
				this.updateConstant(event.target.value);
			},
			updateValueAtIndex(index, event) {
				const newValues = [...this.multipleValues];
				newValues[index] = event.target.value;
				this.updateConstant(newValues);
			},
			async addField() {
				const newValues = [...this.multipleValues, ''];
				this.updateConstant(newValues);
				await this.$nextTick();
				const inputs = this.$refs.inputFields;
				if (inputs && inputs.length > 0) {
					const lastInput = inputs[inputs.length - 1];
					lastInput.focus();
				}
			},
			async removeField(index) {
				const newValues = [...this.multipleValues];
				newValues.splice(index, 1);
				this.updateConstant(newValues);
				await this.$nextTick();
				const inputs = this.$refs.inputFields;
				if (inputs && inputs.length > 0) {
					const focusIndex = Math.max(0, index - 1);
					inputs[focusIndex]?.focus();
				}
			}
		},
		template: `
		<div>
			<template v-if="item.multiple">
				<div v-for="(val, index) in multipleValues" :key="index" class="bizproc-setup-template__field-item">
					<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
						<input
							ref="inputFields"
							:value="val"
							type="text"
							class="ui-ctl-element"
							:aria-labelledby="labelledbyId || null"
							:aria-describedby="describedbyId || null"
							:aria-invalid="invalid ? 'true' : null"
							:aria-required="required ? 'true' : null"
							@input="updateValueAtIndex(index, $event)"
							data-test-id="bizproc-setup-template__form-text-multiple"
						>
					</div>
					<span
						v-if="showRemoveIcon"
						role="button"
						tabindex="0"
						@click="removeField(index)"
						@keydown.enter.prevent="!$event.repeat && removeField(index)"
						@keydown.space.prevent="!$event.repeat && removeField(index)"
						:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_REMOVE_FIELD')"
						data-test-id="bizproc-setup-template__form-text-delete-btn"
						class="bizproc-setup-template__field-remove"
					><i class="ui-icon-set --cross-m"></i></span>
				</div>
				<button
					@click="addField"
					class="bizproc-setup-template__add-btn"
					type="button"
					data-test-id="bizproc-setup-template__form-text-add-btn"
				>
					{{ $Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_ADD_FIELD') }}
				</button>
			</template>
			<template v-else>
				<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
					<input
						:value="modelValue"
						type="text"
						class="ui-ctl-element"
						:aria-labelledby="labelledbyId || null"
						:aria-describedby="describedbyId || null"
						:aria-invalid="invalid ? 'true' : null"
						:aria-required="required ? 'true' : null"
						@input="updateSingleValue"
						data-test-id="bizproc-setup-template__form-text-single"
					>
				</div>
			</template>
		</div>
	`
	};

	// @vue/component
	const ConstantSelect = {
		name: 'ConstantSelect',
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array],
				default: ''
			},
			labelledbyId: {
				type: String,
				default: ''
			},
			describedbyId: {
				type: String,
				default: ''
			},
			invalid: {
				type: Boolean,
				default: false
			},
			required: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		computed: {
			selectedValue: {
				get() {
					if (Array.isArray(this.modelValue)) {
						return this.modelValue.map(value => this.normalizeOptionValue(value));
					}
					return this.normalizeOptionValue(this.modelValue);
				},
				set(newValue) {
					this.$emit('update:modelValue', newValue);
				}
			},
			options() {
				const rawOptions = this.item.options;
				if (!rawOptions) {
					return [];
				}
				return Object.entries(rawOptions).map(([id, name]) => ({
					id,
					name
				}));
			},
			showScroll() {
				return this.options.length > 7;
			}
		},
		methods: {
			getFieldId(option) {
				return `select-opt-${this.item.id}-${option.id}`;
			},
			getFieldTestId(option) {
				return `bizproc-setup-template__form-select-${this.item.id}-${option.id}`;
			},
			// legacy wizard configs store the localized option label as the value; map it to the option id
			normalizeOptionValue(value) {
				const rawOptions = this.item.options ?? {};
				if (!value || Object.hasOwn(rawOptions, value)) {
					return value;
				}
				const legacyOption = Object.entries(rawOptions).find(([, name]) => name === value);
				return legacyOption ? legacyOption[0] : value;
			}
		},
		template: `
		<div
			:role="item.multiple ? 'group' : 'radiogroup'"
			:aria-labelledby="labelledbyId || null"
			:aria-describedby="describedbyId || null"
			:aria-invalid="!item.multiple && invalid ? 'true' : null"
			:aria-required="!item.multiple && required ? 'true' : null"
			:class="{ 'bizproc-setup-template__field-select': showScroll }"
		>
			<template v-if="item.multiple">
				<div v-for="option in options" :key="option.id" class="ui-ctl ui-ctl-checkbox">
					<input
						type="checkbox"
						class="ui-ctl-element"
						:value="option.id"
						v-model="selectedValue"
						:id="getFieldId(option)"
						:data-test-id="getFieldTestId(option)"
					>
					<label class="ui-ctl-label-text" :for="getFieldId(option)">{{ option.name }}</label>
				</div>
			</template>
			<template v-else>
				<div v-for="option in options" :key="option.id" class="ui-ctl ui-ctl-radio">
					<input
						type="radio"
						class="ui-ctl-element"
						:value="option.id"
						v-model="selectedValue"
						:id="getFieldId(option)"
						:data-test-id="getFieldTestId(option)"
					>
					<label class="ui-ctl-label-text" :for="getFieldId(option)">{{ option.name }}</label>
				</div>
			</template>
		</div>
	`
	};

	const ENTITY_TYPES$2 = Object.freeze({
		USER: 'user',
		DEPARTMENT: 'structure-node'
	});
	const VALUE_PARSERS = [{
		template: /^group_hrr(\d+)$/,
		format: match => [ENTITY_TYPES$2.DEPARTMENT, match[1]]
	}, {
		template: /^group_hr(\d+)$/,
		format: match => [ENTITY_TYPES$2.DEPARTMENT, `${match[1]}:F`]
	}, {
		template: /^user_(\d+)$/,
		format: match => [ENTITY_TYPES$2.USER, match[1]]
	}];

	// @vue/component
	const ConstantUser = {
		name: 'ConstantUser',
		props: {
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array],
				default: ''
			}
		},
		emits: ['update:modelValue'],
		mounted() {
			this.initializeSelector();
		},
		beforeUnmount() {
			if (this.tagSelector) {
				this.tagSelector.getDialog().destroy();
				this.tagSelector = null;
			}
		},
		methods: {
			syncValue() {
				if (!this.tagSelector) {
					return;
				}
				const tags = this.tagSelector.getTags();
				const newValues = tags.map(tag => {
					const rawId = tag.getId();
					const title = tag.getTitle();
					const entityId = tag.getEntityId();
					if (entityId === ENTITY_TYPES$2.USER) {
						return `${title}[${rawId}]`;
					}
					if (entityId === ENTITY_TYPES$2.DEPARTMENT) {
						if (main_core.Type.isString(rawId) && rawId.endsWith(':F')) {
							const id = rawId.replace(':F', '');
							return `${title}[HR${id}]`;
						}
						return `${title}[HRR${rawId}]`;
					}
					return null;
				}).filter(Boolean);
				if (this.item.multiple) {
					this.$emit('update:modelValue', newValues.join(';'));
				} else {
					this.$emit('update:modelValue', newValues.length > 0 ? newValues[0] : '');
				}
			},
			getPreselectedItems() {
				const valuesToParse = this.normalizeModelValue();
				if (valuesToParse.length === 0) {
					return [];
				}
				const parsedValues = valuesToParse.map(element => this.parseValue(element));
				return parsedValues.filter(Boolean);
			},
			normalizeModelValue() {
				const {
					modelValue,
					item
				} = this;
				if (item.multiple && main_core.Type.isStringFilled(modelValue)) {
					return modelValue.split(';');
				}
				if (main_core.Type.isArray(modelValue)) {
					return modelValue;
				}
				return modelValue ? [String(modelValue)] : [];
			},
			parseValue(rawValue) {
				const value = String(rawValue).trim();
				if (!value) {
					return null;
				}
				for (const parser of VALUE_PARSERS) {
					const match = value.match(parser.template);
					if (match) {
						return parser.format(match);
					}
				}
				return [ENTITY_TYPES$2.USER, value];
			},
			initializeSelector() {
				this.tagSelector = new ui_entitySelector.TagSelector({
					multiple: this.item.multiple,
					showCreateButton: false,
					dialogOptions: {
						context: `BIZPROC_USER_SELECTOR_${this.item.id}`,
						preselectedItems: this.getPreselectedItems(),
						popupOptions: {
							className: 'bizproc-setup-template__no-tabs-selector-popup'
						},
						width: 500,
						entities: [{
							id: ENTITY_TYPES$2.USER,
							options: {
								inviteEmployeeLink: false
							}
						}, {
							id: ENTITY_TYPES$2.DEPARTMENT,
							options: {
								selectMode: 'usersAndDepartments',
								allowSelectRootDepartment: true,
								allowFlatDepartments: true
							}
						}],
						multiple: this.item.multiple,
						showAvatars: true,
						dropdownMode: true,
						compactView: true,
						height: 250
					},
					addButtonCaption: main_core.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_ADD_USER'),
					events: {
						onAfterTagAdd: this.syncValue,
						onAfterTagRemove: this.syncValue
					}
				});
				this.tagSelector.renderTo(this.$refs.container);
			}
		},
		template: `
		<div ref="container" data-test-id="bizproc-setup-template__form-user"></div>
	`
	};

	const MAX_TEXT_LENGTH = 2000;

	// @vue/component
	const ConstantTextarea = {
		name: 'ConstantTextarea',
		props: {
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array],
				default: ''
			},
			labelledbyId: {
				type: String,
				default: ''
			},
			describedbyId: {
				type: String,
				default: ''
			},
			invalid: {
				type: Boolean,
				default: false
			},
			required: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		computed: {
			multipleValues() {
				const model = this.modelValue;
				if (main_core.Type.isArray(model) && model.length > 0) {
					return model;
				}
				return [''];
			},
			maxTextLength() {
				return MAX_TEXT_LENGTH;
			},
			showRemoveIcon() {
				return this.item.multiple && this.multipleValues.length > 1;
			}
		},
		methods: {
			getCounterText(value) {
				const length = (value || '').length;
				return `${length}/${this.maxTextLength}`;
			},
			onSingleInput(event) {
				let currentValue = event.target.value;
				if (currentValue.length > this.maxTextLength) {
					currentValue = currentValue.slice(0, this.maxTextLength);
					event.target.value = currentValue;
				}
				this.$emit('update:modelValue', currentValue);
			},
			onMultipleInput(event, index) {
				let currentValue = event.target.value;
				if (currentValue.length > this.maxTextLength) {
					currentValue = currentValue.slice(0, this.maxTextLength);
					event.target.value = currentValue;
				}
				const newValues = [...this.multipleValues];
				newValues[index] = currentValue;
				this.$emit('update:modelValue', newValues);
			},
			async addField() {
				if (!this.item.multiple) {
					return;
				}
				const newValues = [...this.multipleValues, ''];
				this.$emit('update:modelValue', newValues);
				await this.$nextTick();
				const fields = this.$refs.textareaFields;
				if (fields && fields.length > 0) {
					const lastField = fields[fields.length - 1];
					lastField.focus();
				}
			},
			async removeField(index) {
				if (!this.showRemoveIcon) {
					return;
				}
				const newValues = [...this.multipleValues];
				newValues.splice(index, 1);
				this.$emit('update:modelValue', newValues);
				await this.$nextTick();
				const fields = this.$refs.textareaFields;
				if (fields && fields.length > 0) {
					const focusIndex = Math.max(0, index - 1);
					fields[focusIndex]?.focus();
				}
			}
		},
		template: `
		<div class="bizproc-setup-template__multiple-wrapper">
			<template v-if="!item.multiple">
				<div class="bizproc-setup-template__textarea-wrapper">
					<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
						<textarea
							class="ui-ctl-element"
							:value="modelValue"
							:maxlength="maxTextLength"
							:aria-labelledby="labelledbyId || null"
							:aria-describedby="describedbyId || null"
							:aria-invalid="invalid ? 'true' : null"
							:aria-required="required ? 'true' : null"
							@input="onSingleInput"
							data-test-id="bizproc-setup-template__form-textarea-single"
						></textarea>
					</div>
					<div class="bizproc-setup-template__char-counter">
						{{ getCounterText(modelValue) }}
					</div>
				</div>
			</template>
			<template v-else>
				<div
					v-for="(value, index) in multipleValues"
					:key="index"
					class="bizproc-setup-template__field-item"
				>
					<div class="bizproc-setup-template__textarea-wrapper">
						<div class="ui-ctl ui-ctl-textarea ui-ctl-w100">
							<textarea
								ref="textareaFields"
								class="ui-ctl-element"
								:value="value"
								:maxlength="maxTextLength"
								:aria-labelledby="labelledbyId || null"
								:aria-describedby="describedbyId || null"
								:aria-invalid="invalid ? 'true' : null"
								:aria-required="required ? 'true' : null"
								@input="onMultipleInput($event, index)"
								data-test-id="bizproc-setup-template__form-textarea-multiple"
							></textarea>
						</div>
						<div class="bizproc-setup-template__char-counter">
							{{ getCounterText(value) }}
						</div>
					</div>
					<span
						v-if="showRemoveIcon"
						role="button"
						tabindex="0"
						@click="removeField(index)"
						@keydown.enter.prevent="!$event.repeat && removeField(index)"
						@keydown.space.prevent="!$event.repeat && removeField(index)"
						:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_REMOVE_FIELD')"
						data-test-id="bizproc-setup-template__form-textarea-delete-btn"
						class="bizproc-setup-template__field-remove"
					><i class="ui-icon-set --cross-m"></i></span>
				</div>
				<button
					@click="addField"
					class="bizproc-setup-template__add-btn"
					type="button"
					data-test-id="bizproc-setup-template__form-textarea-add-btn"
				>
					{{ $Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_ADD_FIELD') }}
				</button>
			</template>
		</div>
	`
	};

	// @vue/component
	const ConstantKnowledge = {
		name: 'ConstantKnowledge',
		components: {
			RagAppComponent: bizproc_ragSelector.RagAppComponent
		},
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [Array, String],
				default: () => []
			},
			isRequired: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		computed: {
			value: {
				get() {
					return this.modelValue;
				},
				set(newValue) {
					this.$emit('update:modelValue', newValue);
				}
			},
			showDescription() {
				return this.item.description && this.item.description.length > 0;
			}
		},
		template: `
		<div class="ui-form-row" data-test-id="bizproc-setup-template__form-knowledge">
			<div class="bizproc-setup-template__knowledge-title">
				{{ item.name }}
			</div>
			<div v-if="showDescription" class="bizproc-setup-template__text">
				{{ item.description }}
			</div>
			<RagAppComponent
				v-model="value"
				:isMultiple="item.multiple"
				:isRequired="isRequired"
			/>
		</div>
	`
	};

	const ENTITY_TYPES$1 = Object.freeze({
		PROJECT: 'project'
	});

	// @vue/component
	const ConstantProject = {
		name: 'ConstantProject',
		props: {
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array, Number],
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		mounted() {
			this.initializeSelector();
		},
		beforeUnmount() {
			if (this.tagSelector) {
				this.tagSelector.getDialog().destroy();
				this.tagSelector = null;
			}
		},
		methods: {
			syncValue() {
				if (!this.tagSelector) {
					return;
				}
				const tags = this.tagSelector.getTags();
				const newValues = tags.map(tag => {
					return tag.getId();
				}).filter(Boolean);
				if (this.item.multiple) {
					this.$emit('update:modelValue', newValues);
				} else {
					this.$emit('update:modelValue', newValues.length > 0 ? newValues[0] : '');
				}
			},
			getPreselectedItems() {
				return this.normalizeModelValues().map(value => [ENTITY_TYPES$1.PROJECT, value]);
			},
			normalizeModelValues() {
				if (main_core.Type.isArray(this.modelValue)) {
					return this.modelValue.map(v => Number(v)).filter(v => main_core.Type.isNumber(v));
				}
				return this.modelValue ? [Number(this.modelValue)].filter(v => main_core.Type.isNumber(v)) : [];
			},
			initializeSelector() {
				this.tagSelector = new ui_entitySelector.TagSelector({
					multiple: this.item.multiple,
					dialogOptions: {
						context: `BIZPROC_PROJECT_SELECTOR_${this.item.id}`,
						popupOptions: {
							className: 'bizproc-setup-template__no-tabs-selector-popup'
						},
						width: 500,
						entities: [{
							id: ENTITY_TYPES$1.PROJECT
						}],
						multiple: this.item.multiple,
						dropdownMode: true,
						compactView: true,
						height: 280,
						preselectedItems: this.getPreselectedItems()
					},
					events: {
						onAfterTagAdd: this.syncValue,
						onAfterTagRemove: this.syncValue
					}
				});
				this.tagSelector.renderTo(this.$refs.container);
			}
		},
		template: `
		<div ref="container" data-test-id="bizproc-setup-template__form-project"></div>
	`
	};

	// @vue/component
	const ConstantFile = {
		name: 'ConstantFile',
		components: {
			TileWidgetComponent: ui_uploader_tileWidget.TileWidgetComponent
		},
		inject: ['templateId'],
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array, Number],
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		computed: {
			uploaderOptions() {
				return {
					controller: 'bizproc.fileUploader.setupTemplateUploaderController',
					controllerOptions: {
						templateId: this.templateId
					},
					files: this.normalizeModelValues(),
					multiple: this.item.multiple,
					autoUpload: true,
					hiddenFieldsContainer: this.$refs.uploaderHiddenFields,
					events: {
						[ui_uploader_core.UploaderEvent.FILE_COMPLETE]: () => {
							this.syncValue();
						},
						[ui_uploader_core.UploaderEvent.FILE_REMOVE]: () => {
							this.syncValue();
						}
					}
				};
			},
			widgetOptions() {
				return {
					readonly: this.disabled,
					hideDropArea: this.disabled
				};
			}
		},
		methods: {
			syncValue() {
				const uploader = this.$refs?.tileWidget?.uploader;
				if (!uploader) {
					return;
				}
				const fileIds = uploader.getFiles().map(value => value.getServerFileId()).filter(id => main_core.Type.isStringFilled(id) || main_core.Type.isNumber(id));
				if (this.item.multiple) {
					this.$emit('update:modelValue', fileIds);
				} else {
					this.$emit('update:modelValue', fileIds.length > 0 ? fileIds[0] : '');
				}
			},
			normalizeModelValues() {
				if (main_core.Type.isArray(this.modelValue)) {
					return this.modelValue;
				}
				return this.modelValue ? [this.modelValue] : [];
			}
		},
		template: `
		<div ref="uploaderHiddenFields"></div>
		<TileWidgetComponent :uploaderOptions="uploaderOptions" :widgetOptions="widgetOptions" ref="tileWidget"/>
	`
	};

	const ConstantEntitySelector = {
		name: 'ConstantEntitySelector',
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		mounted() {
			this.initializeSelector();
		},
		beforeUnmount() {
			if (this.tagSelector) {
				this.tagSelector.getDialog().destroy();
				this.tagSelector = null;
			}
		},
		methods: {
			getPreselectedItems() {
				let defaultValue = this.item.default;
				if (!main_core.Type.isArray(defaultValue)) {
					defaultValue = [defaultValue];
				}
				const preselectedItems = [];
				defaultValue.forEach(value => {
					if (main_core.Type.isStringFilled(value.id) && main_core.Type.isStringFilled(value.entityId)) {
						preselectedItems.push([value.entityId, value.id]);
					}
				});
				return preselectedItems;
			},
			syncValue() {
				if (!this.tagSelector) {
					return;
				}
				const tags = this.tagSelector.getTags();
				const newValues = tags.map(tag => {
					return {
						id: tag.getId(),
						entityId: tag.getEntityId()
					};
				});
				if (this.item.multiple) {
					this.$emit('update:modelValue', newValues);
				} else {
					this.$emit('update:modelValue', newValues.length > 0 ? newValues[0] : []);
				}
			},
			initializeSelector() {
				this.tagSelector = new ui_entitySelector.TagSelector({
					multiple: this.item.multiple,
					showCreateButton: false,
					dialogOptions: {
						context: `BIZPROC_ENTITYSELECTOR_${this.item.id}`,
						preselectedItems: this.getPreselectedItems(),
						width: 500,
						multiple: this.item.multiple,
						showAvatars: true,
						dropdownMode: true,
						compactView: true,
						height: 250,
						...this.item.settings.selector.dialogOptions
					},
					events: {
						onAfterTagAdd: this.syncValue,
						onAfterTagRemove: this.syncValue
					}
				});
				this.tagSelector.renderTo(this.$refs.container);
			}
		},
		template: `
		<div ref="container" data-test-id="bizproc-setup-template__form-entityselector"></div>
	`
	};

	const boundTimePickers = new WeakSet();
	const REGEX_PATTERNS = {
		TIME_FORMAT: /(\d{1,2}:\d{2})(?::\d{2})?/,
		TIMEZONE_OFFSET: /\s\[[\d-]+]$/
	};

	// @vue/component
	const ConstantTime = {
		name: 'ConstantTime',
		props: {
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			},
			labelledbyId: {
				type: String,
				default: ''
			},
			describedbyId: {
				type: String,
				default: ''
			},
			invalid: {
				type: Boolean,
				default: false
			},
			required: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				timeValue: '',
				timezone: '',
				timezones: []
			};
		},
		mounted() {
			this.timezones = main_core.Extension.getSettings('bizproc.setup-template')?.timezones;
			this.syncFromModel();
		},
		beforeUnmount() {
			if (this.timePicker?.destroy) {
				this.timePicker.destroy();
				this.timePicker = null;
			}
		},
		created() {
			this.timePicker = null;
		},
		methods: {
			syncFromModel() {
				this.applyValueFromModule();
				this.applyTimezoneFromModel();
			},
			getDefaultTimezone() {
				return 'current';
			},
			applyValueFromModule() {
				const model = this.modelValue;
				this.timeValue = this.extractTimeValue(main_core.Type.isString(model) ? model : '');
			},
			applyTimezoneFromModel() {
				const value = this.modelValue;
				const timezoneOffsetRegex = /\s\[[\d-]+]$/;
				const defaultValue = main_core.Type.isString(value) ? value : '';
				const match = defaultValue.match(timezoneOffsetRegex);
				const offset = (match?.[0] ?? '').replaceAll(/[\s[\]]/g, '');
				const timezones = this.timezones ?? [];
				this.timezone = timezones.find(zone => String(zone.offset) === offset)?.value ?? this.getDefaultTimezone();
			},
			extractTimeValue(value) {
				if (!main_core.Type.isString(value)) {
					return '';
				}
				const clean = value.replace(REGEX_PATTERNS.TIMEZONE_OFFSET, '');
				const match = clean.match(REGEX_PATTERNS.TIME_FORMAT);
				return match ? match[1] : '';
			},
			emitUpdate(value) {
				this.$emit('update:modelValue', value);
			},
			onTimeChange(event) {
				const raw = event?.target?.value ?? '';
				const match = raw.match(REGEX_PATTERNS.TIME_FORMAT);
				const time = match ? match[1] : raw;
				this.timeValue = time;
				this.emitUpdate(this.prepareEventData(time, this.timezone));
			},
			onTimezoneChange(event) {
				const timezone = event?.target?.value ?? 0;
				this.timezone = timezone;
				this.applyValueFromModule();
				this.emitUpdate(this.prepareEventData(this.timeValue, timezone));
			},
			onSelect() {
				const input = this.$refs.timeInput;
				const selectedDate = this.timePicker.getSelectedDate() || this.timePicker.getFocusDate();
				if (!selectedDate) {
					return;
				}
				const timeString = this.timePicker.formatTime(selectedDate);
				if (timeString === this.timeValue) {
					return;
				}
				const timezoneOffsetRegex = /\s\[[\d-]+]$/;
				const rawValue = timeString;
				const normalizedValue = main_core.Type.isString(rawValue) ? rawValue.replace(timezoneOffsetRegex, '') : rawValue;
				this.timeValue = timeString;
				this.emitUpdate(this.prepareEventData(normalizedValue, this.timezone));
				input.value = timeString;
			},
			onTimeInputKeydown(event) {
				if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
					event.preventDefault();
					this.openTimePicker();
				}
			},
			openTimePicker() {
				if (this.disabled) {
					return;
				}
				const input = this.$refs.timeInput;
				if (!input) {
					return;
				}
				if (!this.timePicker) {
					this.timePicker = new ui_datePicker.DatePicker({
						targetNode: input,
						inputField: input,
						type: 'time',
						timePickerStyle: 'wheel',
						amPmMode: false,
						minuteStep: 5,
						popupOptions: {
							targetContainer: input.ownerDocument?.body || document.body
						}
					});
				}
				const timeView = this.timePicker.getPicker('time');
				if (timeView?.subscribe && !boundTimePickers.has(this.timePicker)) {
					// default DatePicker events do not work in the slider
					timeView.subscribe('onSelect', () => {
						setTimeout(this.onSelect, 0);
					});
					boundTimePickers.add(this.timePicker);
				}
				this.timePicker.show();
			},
			prepareEventData(time, timezone) {
				let offset = timezone;
				if (!main_core.Type.isNumber(timezone)) {
					offset = this.timezones.find(zone => zone.value === timezone)?.offset ?? '0';
				}
				return `${time} [${offset}]`;
			}
		},
		template: `
		<div class="bizproc-setup-template__time-row">
			<div class="ui-ctl ui-ctl-textbox ui-ctl-w100">
				<input
						ref="timeInput"
						:value="timeValue"
						type="text"
						class="ui-ctl-element"
						:disabled="disabled"
						:aria-labelledby="labelledbyId || null"
						:aria-describedby="describedbyId || null"
						:aria-invalid="invalid ? 'true' : null"
						:aria-required="required ? 'true' : null"
						placeholder="HH:MM"
						readonly
						@change="onTimeChange"
						@click="openTimePicker"
						@keydown="onTimeInputKeydown"
						style="cursor: pointer;"
						data-test-id="bizproc-setup-template__form-time-value"
				>
			</div>
			<div v-if="timezones.length > 0" class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100">
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<select
						class="ui-ctl-element"
						:value="timezone"
						:disabled="disabled"
						:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIMEZONE')"
						@change="onTimezoneChange"
						data-test-id="bizproc-setup-template__form-time-timezone"
				>
					<option
							v-for="zone in timezones"
							:key="zone.value"
							:value="zone.value"
					>
						{{ zone.text }}
					</option>
				</select>
			</div>
		</div>
	`
	};

	const EXTENSION_NAME = 'bizproc.setup-template';

	// Culture format codes of main.date: the only allowed source of date formats.
	const VALUE_FORMATS = Object.freeze({
		DATE: 'FORMAT_DATE',
		DATETIME: 'FORMAT_DATETIME',
		TIME: 'SHORT_TIME_FORMAT'
	});

	// The value carries a numeric offset only: Bitrix\Bizproc\BaseType\Value\Date reads nothing else.
	const TIMEZONE_OFFSET_REGEX = /\s\[[\d-]+]$/;
	const OPEN_PICKER_KEYS = new Set(['Enter', ' ', 'Spacebar']);

	// Rows of the form that carry a real picker. Declared next to the rows themselves, so a consumer
	// outside the extension (the preview of the setup wizard) does not repeat the class names.
	const PICKER_ROW_SELECTOR = '.bizproc-setup-template__date-row, .bizproc-setup-template__time-row';

	// The zone of the current user: the only zone whose offset is not fixed in the list but read from
	// the page, so the only one a stored offset may stop matching.
	const USER_TIMEZONE_VALUE = 'current';

	// A constant is filled in for the server or for the user, so the module-wide zone list is narrowed
	// to these two and titled with the phrases of the form. The `time` field keeps the full list.
	const TIMEZONE_TITLES = new Map([['', 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIMEZONE_SERVER'], [USER_TIMEZONE_VALUE, 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIMEZONE_USER']]);
	let offeredTimezones = null;

	/**
	 * Narrowing the module-wide zone list gives the same two zones for the whole page, so it is done
	 * once: a multiple constant renders a control per row.
	 */
	function getTimezones() {
		offeredTimezones ??= Object.freeze(main_core.Extension.getSettings(EXTENSION_NAME).get('timezones', []).filter(zone => TIMEZONE_TITLES.has(zone.value)).map(zone => ({
			...zone,
			text: main_core.Loc.getMessage(TIMEZONE_TITLES.get(zone.value))
		})));
		return offeredTimezones;
	}
	function isPickerOpenKey(event) {
		return OPEN_PICKER_KEYS.has(event.key);
	}

	/**
	 * Picker attached to an input: its own events do not work inside the slider,
	 * so the inner picker view is subscribed directly.
	 */
	function createBoundPicker(options) {
		const {
			input,
			pickerId,
			onSelect,
			pickerOptions = {}
		} = options;
		const picker = new ui_datePicker.DatePicker({
			...pickerOptions,
			targetNode: input,
			popupOptions: {
				targetContainer: input.ownerDocument?.body || document.body
			}
		});
		picker.getPicker(pickerId)?.subscribe('onSelect', () => {
			setTimeout(onSelect, 0);
		});
		return picker;
	}

	/**
	 * DatePicker keeps dates in UTC parts, so they have to be formatted as UTC as well,
	 * otherwise the value is shifted by the browser offset.
	 */
	function formatDate(date, formatCode = VALUE_FORMATS.DATE) {
		if (!main_core.Type.isDate(date)) {
			return '';
		}
		return main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat(formatCode), date, null, true);
	}

	/**
	 * ALG-01: the offset of a zone in seconds, the only form the value may carry. The current user zone
	 * comes with the `current` keyword instead of a number, so its offset is taken from the page — the
	 * same CTimeZone offset the server puts into a value filled in for the current user.
	 */
	function resolveNumericOffset(timezone) {
		const offset = Number.parseInt(timezone?.offset, 10);
		return Number.isNaN(offset) ? main_date.Timezone.Offset.USER_TO_SERVER : offset;
	}

	/**
	 * ALG-01: the only place where a picked date becomes a constant value.
	 * The date itself is kept as entered, the timezone is encoded by the ` [offset]` suffix only.
	 */
	function serializeValue(pickedDate, options = {}) {
		const {
			timezone = null,
			isDateTime = false
		} = options;
		const text = formatDate(pickedDate, isDateTime ? VALUE_FORMATS.DATETIME : VALUE_FORMATS.DATE);
		if (text === '') {
			return '';
		}
		return main_core.Type.isStringFilled(timezone?.value) ? `${text} [${resolveNumericOffset(timezone)}]` : text;
	}

	/**
	 * ALG-01: the zone a stored offset was saved with.
	 *
	 * A zone with a value is the only one this front serializes a suffix for, so it owns a matching
	 * offset: on a portal where the user offset equals the server one the server zone would otherwise
	 * shadow the zone the value was actually filled in for. Zone offsets are not unique among the rest,
	 * so the first zone with the same offset wins.
	 *
	 * The offset of the server zone stays with the server zone anyway, because the front is not the only
	 * writer: a value saved through a form goes into the constant by way of Bitrix\Bizproc\BaseType\Date,
	 * whose extractValue() serializes it with a suffix even when no zone was picked.
	 *
	 * Any other unknown offset belongs to the user: their zone changed after the value was saved (a
	 * profile change, a seasonal switch). Reading it as the server zone would drop the suffix on the
	 * next edit of the row.
	 */
	function findOffsetTimezone(offset, timezones) {
		const zoneOfOffset = timezones.find(zone => main_core.Type.isStringFilled(zone.value) && resolveNumericOffset(zone) === offset);
		if (zoneOfOffset) {
			return zoneOfOffset;
		}
		const isServerOffset = timezones.some(zone => !main_core.Type.isStringFilled(zone.value) && resolveNumericOffset(zone) === offset);
		return isServerOffset ? null : timezones.find(zone => zone.value === USER_TIMEZONE_VALUE) ?? null;
	}

	/**
	 * ALG-01: splits a stored constant value into the site-formatted text and the timezone it was saved with.
	 */
	function parseValue(modelValue, timezones = []) {
		const value = main_core.Type.isString(modelValue) ? modelValue : '';
		const offsetText = value.match(TIMEZONE_OFFSET_REGEX)?.[0].replaceAll(/[\s[\]]/g, '') ?? null;
		const offset = offsetText === null ? null : Number.parseInt(offsetText, 10);
		return {
			text: value.replace(TIMEZONE_OFFSET_REGEX, ''),
			timezone: offset === null ? null : findOffsetTimezone(offset, timezones)
		};
	}

	/**
	 * Site-formatted text back into a picker-compatible date (UTC parts), null when it is not a date.
	 */
	function createDateFromText(text) {
		const parsedDate = main_core.Type.isStringFilled(text) ? main_date.DateTimeFormat.parse(text) : null;
		return parsedDate === null ? null : ui_datePicker.createDate(parsedDate);
	}

	// A single date row: one value of the constant, whether the constant is multiple or not.
	// @vue/component
	const ConstantDateControl = {
		name: 'ConstantDateControl',
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			},
			labelledbyId: {
				type: String,
				default: ''
			},
			describedbyId: {
				type: String,
				default: ''
			},
			invalid: {
				type: Boolean,
				default: false
			},
			required: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				pickedDate: null
			};
		},
		computed: {
			dateText() {
				return formatDate(this.pickedDate);
			}
		},
		watch: {
			modelValue() {
				// The value may be replaced from outside: an edited default of the constant redraws the
				// row. The echo of the value the row has just published is skipped, so the entered date
				// is never rebuilt under the user.
				if (this.modelValue !== this.currentValue()) {
					this.applyModelValue();
				}
			}
		},
		created() {
			this.datePicker = null;
			this.applyModelValue();
		},
		beforeUnmount() {
			this.datePicker?.destroy();
			this.datePicker = null;
		},
		methods: {
			applyModelValue() {
				// A date has no timezone control, but a value saved with one still has to show its date.
				this.pickedDate = createDateFromText(parseValue(this.modelValue).text);
				// The picker holds the date it was created with, so it is rebuilt on the next opening.
				this.datePicker?.destroy();
				this.datePicker = null;
			},
			handleInputKeydown(event) {
				if (isPickerOpenKey(event)) {
					event.preventDefault();
					this.openDatePicker();
				}
			},
			openDatePicker() {
				if (this.disabled || !this.$refs.dateInput) {
					return;
				}
				if (this.datePicker === null) {
					this.datePicker = createBoundPicker({
						input: this.$refs.dateInput,
						pickerId: 'day',
						onSelect: this.handleDateSelect,
						pickerOptions: {
							type: 'date',
							selectedDates: this.pickedDate === null ? [] : [this.pickedDate]
						}
					});
				}
				this.datePicker.show();
			},
			handleDateSelect() {
				// The callback is deferred, so by the time it runs the picker may be gone: the row was
				// unmounted or the value was replaced from outside.
				if (!this.datePicker) {
					return;
				}
				const selectedDate = this.datePicker.getSelectedDate();
				if (!main_core.Type.isDate(selectedDate)) {
					return;
				}
				this.pickedDate = selectedDate;
				this.emitValue();
			},
			currentValue() {
				return serializeValue(this.pickedDate);
			},
			emitValue() {
				this.$emit('update:modelValue', this.currentValue());
			}
		},
		template: `
		<div
			class="bizproc-setup-template__date-row"
			data-test-id="bizproc-setup-template__form-date-control"
		>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100">
				<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
				<input
					ref="dateInput"
					:value="dateText"
					type="text"
					class="ui-ctl-element"
					:disabled="disabled"
					:aria-labelledby="labelledbyId || null"
					:aria-describedby="describedbyId || null"
					:aria-invalid="invalid ? 'true' : null"
					:aria-required="required ? 'true' : null"
					:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_DATE_PLACEHOLDER')"
					readonly
					data-test-id="bizproc-setup-template__form-date-value"
					@click="openDatePicker"
					@keydown="handleInputKeydown"
				>
			</div>
		</div>
	`
	};

	// The first control of a row is the one that takes focus after a row is added or removed.
	const FOCUSABLE_SELECTOR$1 = 'input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

	/**
	 * Rows of a multiple constant: a list always has a row to fill in, and a single value stored
	 * before the constant became multiple is its first row.
	 */
	function toMultipleValues(model) {
		if (main_core.Type.isArray(model)) {
			return model.length > 0 ? model : [''];
		}
		return [main_core.Type.isString(model) ? model : ''];
	}

	/**
	 * List of values of a multiple constant: rows, the remove icon and the add button.
	 * The row control itself comes from the `control` slot, so a field of any type
	 * keeps its own markup and its own value format.
	 */
	// @vue/component
	const MultipleConstantField = {
		name: 'MultipleConstantField',
		props: {
			modelValue: {
				type: [String, Array],
				default: ''
			},
			testIdPrefix: {
				type: String,
				required: true
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				fieldKeys: []
			};
		},
		computed: {
			values() {
				return toMultipleValues(this.modelValue);
			},
			showRemoveIcon() {
				return this.values.length > 1;
			}
		},
		watch: {
			values() {
				this.syncFieldKeys();
			}
		},
		created() {
			this.lastFieldKey = 0;
			this.syncFieldKeys();
		},
		methods: {
			/**
			 * Row controls keep their own state, so a row is identified by a key of its own:
			 * with the index as a key the state of the removed row would stay on the next one.
			 */
			createFieldKey() {
				this.lastFieldKey += 1;
				return this.lastFieldKey;
			},
			syncFieldKeys() {
				while (this.fieldKeys.length < this.values.length) {
					this.fieldKeys.push(this.createFieldKey());
				}
				this.fieldKeys.splice(this.values.length);
			},
			updateValueAtIndex(index, newValue) {
				const newValues = [...this.values];
				newValues[index] = newValue;
				this.$emit('update:modelValue', newValues);
			},
			async addField() {
				const addedIndex = this.values.length;
				this.fieldKeys.push(this.createFieldKey());
				this.$emit('update:modelValue', [...this.values, '']);
				await this.$nextTick();
				this.focusFieldAt(addedIndex);
			},
			async removeField(index) {
				if (!this.showRemoveIcon) {
					return;
				}
				const newValues = [...this.values];
				newValues.splice(index, 1);
				this.fieldKeys.splice(index, 1);
				this.$emit('update:modelValue', newValues);
				await this.$nextTick();
				this.focusFieldAt(Math.max(0, index - 1));
			},
			focusFieldAt(index) {
				const rows = this.$refs.fieldRows ?? [];
				rows[index]?.querySelector(FOCUSABLE_SELECTOR$1)?.focus();
			}
		},
		template: `
		<div
			class="bizproc-setup-template__multiple-wrapper"
			:data-test-id="testIdPrefix + '-list'"
		>
			<div
				v-for="(value, index) in values"
				:key="fieldKeys[index]"
				ref="fieldRows"
				class="bizproc-setup-template__field-item"
				:data-test-id="testIdPrefix + '-item-' + index"
			>
				<slot
					name="control"
					:value="value"
					:rowKey="fieldKeys[index]"
					:update="(newValue) => updateValueAtIndex(index, newValue)"
				/>
				<span
					v-if="showRemoveIcon"
					role="button"
					tabindex="0"
					@click="removeField(index)"
					@keydown.enter.prevent="!$event.repeat && removeField(index)"
					@keydown.space.prevent="!$event.repeat && removeField(index)"
					:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_REMOVE_FIELD')"
					:data-test-id="testIdPrefix + '-delete-btn'"
					class="bizproc-setup-template__field-remove"
				><i class="ui-icon-set --cross-m"></i></span>
			</div>
			<button
				@click="addField"
				class="bizproc-setup-template__add-btn"
				type="button"
				:data-test-id="testIdPrefix + '-add-btn'"
			>
				{{ $Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_ADD_FIELD') }}
			</button>
		</div>
	`
	};

	// Date field of the form: a single date row, or the list of rows of a multiple constant.
	// @vue/component
	const ConstantDate = {
		name: 'ConstantDate',
		components: {
			ConstantDateControl,
			MultipleConstantField
		},
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array],
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			},
			labelledbyId: {
				type: String,
				default: ''
			},
			describedbyId: {
				type: String,
				default: ''
			},
			invalid: {
				type: Boolean,
				default: false
			},
			required: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		template: `
		<MultipleConstantField
			v-if="item.multiple"
			:modelValue="modelValue"
			testIdPrefix="bizproc-setup-template__form-date"
			@update:modelValue="$emit('update:modelValue', $event)"
		>
			<template #control="{ value, update }">
				<ConstantDateControl v-bind="$props" :modelValue="value" @update:modelValue="update"/>
			</template>
		</MultipleConstantField>
		<ConstantDateControl
			v-else
			v-bind="$props"
			@update:modelValue="$emit('update:modelValue', $event)"
		/>
	`
	};

	const TIME_PICKER_OPTIONS = Object.freeze({
		type: 'time',
		timePickerStyle: 'wheel',
		amPmMode: false,
		minuteStep: 5
	});

	// A single date and time row: one value of the constant, whether the constant is multiple or not.
	// @vue/component
	const ConstantDatetimeControl = {
		name: 'ConstantDatetimeControl',
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			},
			labelledbyId: {
				type: String,
				default: ''
			},
			describedbyId: {
				type: String,
				default: ''
			},
			invalid: {
				type: Boolean,
				default: false
			},
			required: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue', 'dateMissingChange'],
		data() {
			return {
				pickedDate: null,
				pickedTime: null,
				timezoneValue: '',
				timezones: []
			};
		},
		computed: {
			dateText() {
				return formatDate(this.pickedDate);
			},
			timeText() {
				return formatDate(this.pickedTime, VALUE_FORMATS.TIME);
			},
			timezone() {
				return this.timezones.find(zone => zone.value === this.timezoneValue) ?? null;
			},
			/**
			 * Date and time are picked separately, so they are merged here.
			 * A date without a time means midnight; a time without a date is not a value yet.
			 */
			pickedDateTime() {
				if (!main_core.Type.isDate(this.pickedDate)) {
					return null;
				}
				const dateTime = new Date(this.pickedDate.getTime());
				dateTime.setUTCHours(this.pickedTime?.getUTCHours() ?? 0, this.pickedTime?.getUTCMinutes() ?? 0, 0, 0);
				return dateTime;
			},
			/**
			 * A time picked with no date shows in the field but is not a value yet, so the row tells the
			 * form about it: on submit the form asks for the date instead of reporting an empty field.
			 */
			isDateMissing() {
				return !main_core.Type.isDate(this.pickedDate) && main_core.Type.isDate(this.pickedTime);
			}
		},
		watch: {
			isDateMissing: {
				handler(isDateMissing) {
					this.$emit('dateMissingChange', isDateMissing);
				},
				immediate: true
			},
			modelValue() {
				// The value may be replaced from outside: an edited default of the constant redraws the
				// row. The echo of the value the row has just published is skipped, so the entered date
				// and time are never rebuilt under the user.
				if (this.modelValue !== this.currentValue()) {
					this.applyModelValue();
				}
			}
		},
		created() {
			this.datePicker = null;
			this.timePicker = null;
			this.timezones = getTimezones();
			this.applyModelValue();
		},
		beforeUnmount() {
			// A removed row takes its report with it: the field aggregates the rows it still has.
			this.$emit('dateMissingChange', false);
			this.datePicker?.destroy();
			this.timePicker?.destroy();
			this.datePicker = null;
			this.timePicker = null;
		},
		methods: {
			applyModelValue() {
				const {
					text,
					timezone
				} = parseValue(this.modelValue, this.timezones);
				const storedDateTime = createDateFromText(text);
				this.pickedDate = storedDateTime;
				this.pickedTime = storedDateTime;
				this.timezoneValue = timezone?.value ?? '';
				// The pickers hold the date they were created with, so they are rebuilt on the next opening.
				this.datePicker?.destroy();
				this.timePicker?.destroy();
				this.datePicker = null;
				this.timePicker = null;
			},
			handleDateInputKeydown(event) {
				if (isPickerOpenKey(event)) {
					event.preventDefault();
					this.openDatePicker();
				}
			},
			handleTimeInputKeydown(event) {
				if (isPickerOpenKey(event)) {
					event.preventDefault();
					this.openTimePicker();
				}
			},
			openDatePicker() {
				if (this.disabled || !this.$refs.dateInput) {
					return;
				}
				if (this.datePicker === null) {
					this.datePicker = createBoundPicker({
						input: this.$refs.dateInput,
						pickerId: 'day',
						onSelect: this.handleDateSelect,
						pickerOptions: {
							type: 'date',
							selectedDates: this.pickedDate === null ? [] : [this.pickedDate]
						}
					});
				}
				this.datePicker.show();
			},
			openTimePicker() {
				if (this.disabled || !this.$refs.timeInput) {
					return;
				}
				if (this.timePicker === null) {
					this.timePicker = createBoundPicker({
						input: this.$refs.timeInput,
						pickerId: 'time',
						onSelect: this.handleTimeSelect,
						pickerOptions: {
							...TIME_PICKER_OPTIONS,
							selectedDates: this.pickedTime === null ? [] : [this.pickedTime]
						}
					});
				}
				this.timePicker.show();
			},
			handleDateSelect() {
				// The callback is deferred, so by the time it runs the picker may be gone: the row was
				// unmounted or the value was replaced from outside.
				if (!this.datePicker) {
					return;
				}
				const selectedDate = this.datePicker.getSelectedDate();
				if (!main_core.Type.isDate(selectedDate)) {
					return;
				}
				this.pickedDate = selectedDate;
				// A date picked with no time is midnight, and the time control shows it instead of staying empty.
				this.pickedTime ??= this.pickedDateTime;
				this.emitValue();
			},
			handleTimeSelect() {
				if (!this.timePicker) {
					return;
				}
				const selectedTime = this.timePicker.getSelectedDate() ?? this.timePicker.getFocusDate();
				if (!main_core.Type.isDate(selectedTime)) {
					return;
				}
				this.pickedTime = selectedTime;
				this.emitValue();
			},
			handleTimezoneChange(event) {
				this.timezoneValue = event.target.value;
				this.emitValue();
			},
			currentValue() {
				return serializeValue(this.pickedDateTime, {
					timezone: this.timezone,
					isDateTime: true
				});
			},
			emitValue() {
				this.$emit('update:modelValue', this.currentValue());
			}
		},
		template: `
		<div
			class="bizproc-setup-template__date-row"
			data-test-id="bizproc-setup-template__form-datetime-control"
		>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100">
				<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
				<input
					ref="dateInput"
					:value="dateText"
					type="text"
					class="ui-ctl-element"
					:disabled="disabled"
					:aria-labelledby="labelledbyId || null"
					:aria-describedby="describedbyId || null"
					:aria-invalid="invalid ? 'true' : null"
					:aria-required="required ? 'true' : null"
					:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_DATE_PLACEHOLDER')"
					readonly
					data-test-id="bizproc-setup-template__form-datetime-date"
					@click="openDatePicker"
					@keydown="handleDateInputKeydown"
				>
			</div>
			<div class="ui-ctl ui-ctl-textbox ui-ctl-after-icon ui-ctl-w100">
				<div class="ui-ctl-after ui-ctl-icon-clock"></div>
				<input
					ref="timeInput"
					:value="timeText"
					type="text"
					class="ui-ctl-element"
					:disabled="disabled"
					:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIME')"
					:aria-describedby="describedbyId || null"
					:aria-invalid="invalid ? 'true' : null"
					:placeholder="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIME_PLACEHOLDER')"
					readonly
					data-test-id="bizproc-setup-template__form-datetime-time"
					@click="openTimePicker"
					@keydown="handleTimeInputKeydown"
				>
			</div>
			<div
				v-if="timezones.length > 0"
				class="ui-ctl ui-ctl-after-icon ui-ctl-dropdown ui-ctl-w100 --timezone"
			>
				<div class="ui-ctl-after ui-ctl-icon-angle"></div>
				<select
					:value="timezoneValue"
					class="ui-ctl-element"
					:disabled="disabled"
					:aria-label="$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_TIMEZONE')"
					data-test-id="bizproc-setup-template__form-datetime-timezone"
					@change="handleTimezoneChange"
				>
					<option
						v-for="zone in timezones"
						:key="zone.value"
						:value="zone.value"
					>
						{{ zone.text }}
					</option>
				</select>
			</div>
		</div>
	`
	};

	// Date and time field of the form: a single row, or the list of rows of a multiple constant.
	// @vue/component
	const ConstantDatetime = {
		name: 'ConstantDatetime',
		components: {
			ConstantDatetimeControl,
			MultipleConstantField
		},
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array],
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			},
			labelledbyId: {
				type: String,
				default: ''
			},
			describedbyId: {
				type: String,
				default: ''
			},
			invalid: {
				type: Boolean,
				default: false
			},
			required: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue', 'dateMissingChange'],
		data() {
			return {
				// Rows are addressed by their own key, the way the list itself addresses them: a removed row
				// shifts the indexes of the rows that stay, and those rows keep their state and republish
				// nothing. A row drops its key by reporting itself valid before it is unmounted.
				dateMissingKeys: []
			};
		},
		methods: {
			setRowDateMissing(rowKey, isDateMissing) {
				const keys = this.dateMissingKeys.filter(key => key !== rowKey);
				if (isDateMissing) {
					keys.push(rowKey);
				}
				this.dateMissingKeys = keys;
				this.$emit('dateMissingChange', keys.length > 0);
			}
		},
		template: `
		<MultipleConstantField
			v-if="item.multiple"
			:modelValue="modelValue"
			testIdPrefix="bizproc-setup-template__form-datetime"
			@update:modelValue="$emit('update:modelValue', $event)"
		>
			<template #control="{ value, rowKey, update }">
				<ConstantDatetimeControl
					v-bind="$props"
					:modelValue="value"
					@update:modelValue="update"
					@dateMissingChange="setRowDateMissing(rowKey, $event)"
				/>
			</template>
		</MultipleConstantField>
		<ConstantDatetimeControl
			v-else
			v-bind="$props"
			@update:modelValue="$emit('update:modelValue', $event)"
			@dateMissingChange="$emit('dateMissingChange', $event)"
		/>
	`
	};

	const BOOL_VALUES = Object.freeze({
		YES: 'Y',
		NO: 'N'
	});

	// Values a bool constant may already hold: the server normalizes these synonyms to Y/N, so every
	// control that shows such a value has to recognize them. Kept in one place for the launch form and
	// the setup wizard alike.
	const TRUE_VALUES = new Set(['y', 'yes', 'true', '1']);

	/**
	 * A bool value in the wire format. An empty value belongs to a constant that was never filled in:
	 * the controls have no third state, and both the form and the wizard show such a value as "no".
	 */
	function normalizeBoolValue(value) {
		const normalized = main_core.Type.isString(value) ? value.trim().toLowerCase() : '';
		return TRUE_VALUES.has(normalized) ? BOOL_VALUES.YES : BOOL_VALUES.NO;
	}
	function isBoolValueChecked(value) {
		return normalizeBoolValue(value) === BOOL_VALUES.YES;
	}

	const SWITCHER_OPTIONS = Object.freeze({
		size: ui_switcher.SwitcherSize.small,
		showStateTitle: false
	});

	// A single row: the switcher of one value and the name of the constant next to it, whether
	// the constant is multiple or not.
	// @vue/component
	const ConstantBoolControl = {
		name: 'ConstantBoolControl',
		components: {
			Switcher: ui_vue3_components_switcher.Switcher
		},
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: String,
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			},
			labelledbyId: {
				type: String,
				default: ''
			},
			describedbyId: {
				type: String,
				default: ''
			},
			invalid: {
				type: Boolean,
				default: false
			},
			required: {
				type: Boolean,
				default: false
			},
			// Key of the row this control belongs to, given by MultipleConstantField.
			rowKey: {
				type: [String, Number],
				default: null
			}
		},
		emits: ['update:modelValue'],
		setup() {
			return {
				SWITCHER_OPTIONS
			};
		},
		computed: {
			isChecked() {
				return isBoolValueChecked(this.modelValue);
			},
			/**
			 * The name of the constant is the label of the switcher itself, so the id the form names
			 * the field by is assigned to the label rendered here. A multiple constant has a row per
			 * value, and each of them needs an id of its own.
			 */
			labelId() {
				const fieldLabelId = this.labelledbyId || `bizproc-setup-template-bool-${this.item.id}`;
				return this.rowKey === null ? fieldLabelId : `${fieldLabelId}-${this.rowKey}`;
			}
		},
		methods: {
			emitValue(checked) {
				this.$emit('update:modelValue', checked ? BOOL_VALUES.YES : BOOL_VALUES.NO);
			},
			handleToggle(checked) {
				this.emitValue(checked);
			},
			handleKeyboardToggle() {
				if (this.disabled) {
					return;
				}
				this.emitValue(!this.isChecked);
			}
		},
		template: `
		<div
			class="bizproc-setup-template__switcher-row"
			data-test-id="bizproc-setup-template__form-bool-control"
		>
			<div
				class="bizproc-setup-template__switcher"
				role="switch"
				:tabindex="disabled ? -1 : 0"
				:aria-checked="isChecked ? 'true' : 'false'"
				:aria-labelledby="labelId"
				:aria-describedby="describedbyId || null"
				:aria-invalid="invalid ? 'true' : null"
				:aria-required="required ? 'true' : null"
				:aria-disabled="disabled ? 'true' : null"
				data-test-id="bizproc-setup-template__form-bool-value"
				@keydown.enter.prevent="!$event.repeat && handleKeyboardToggle()"
				@keydown.space.prevent="!$event.repeat && handleKeyboardToggle()"
			>
				<Switcher
					:isChecked="isChecked"
					:isDisabled="disabled"
					:options="SWITCHER_OPTIONS"
					@check="handleToggle(true)"
					@uncheck="handleToggle(false)"
				/>
			</div>
			<div class="bizproc-setup-template__switcher-label" :class="{ '--required': required }">
				<span :id="labelId" class="bizproc-setup-template__label-text">{{ item.name }}</span>
			</div>
		</div>
	`
	};

	// An empty value belongs to a constant that was never filled in: the switcher has no third state
	// and shows such a value as "no", so N is what gets stored for it as well.
	function toStoredBoolValue(value) {
		return main_core.Type.isStringFilled(value) ? value : BOOL_VALUES.NO;
	}
	function isSameValue(left, right) {
		if (main_core.Type.isArray(left) && main_core.Type.isArray(right)) {
			return left.length === right.length && left.every((value, index) => value === right[index]);
		}
		return left === right;
	}

	// Bool field of the form: a single switcher, or the list of switchers of a multiple constant.
	// @vue/component
	const ConstantBool = {
		name: 'ConstantBool',
		components: {
			ConstantBoolControl,
			MultipleConstantField
		},
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array],
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			},
			labelledbyId: {
				type: String,
				default: ''
			},
			describedbyId: {
				type: String,
				default: ''
			},
			invalid: {
				type: Boolean,
				default: false
			},
			required: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		computed: {
			/**
			 * A bool constant always has a value, so an empty one is stored as N. The whole value is
			 * normalized here, in the single place that sees it: the rows of a multiple constant are
			 * created within one render, so a row publishing its own N would build the new list from
			 * a prop that does not hold the values of its siblings yet, and only the last row would
			 * survive.
			 */
			normalizedValue() {
				return this.item.multiple ? toMultipleValues(this.modelValue).map(value => toStoredBoolValue(value)) : toStoredBoolValue(this.modelValue);
			}
		},
		watch: {
			normalizedValue: {
				immediate: true,
				handler(value) {
					if (!isSameValue(value, this.modelValue)) {
						this.$emit('update:modelValue', value);
					}
				}
			}
		},
		template: `
		<MultipleConstantField
			v-if="item.multiple"
			:modelValue="normalizedValue"
			testIdPrefix="bizproc-setup-template__form-bool"
			@update:modelValue="$emit('update:modelValue', $event)"
		>
			<template #control="{ value, rowKey, update }">
				<ConstantBoolControl
					v-bind="$props"
					:modelValue="value"
					:rowKey="rowKey"
					@update:modelValue="update"
				/>
			</template>
		</MultipleConstantField>
		<ConstantBoolControl
			v-else
			v-bind="$props"
			:modelValue="normalizedValue"
			@update:modelValue="$emit('update:modelValue', $event)"
		/>
	`
	};

	const ENTITY_TYPES = Object.freeze({
		BI_DASHBOARD: 'biconnector-superset-dashboard'
	});

	// @vue/component
	const ConstantBIDashboard = {
		name: 'ConstantBIDashboard',
		props: {
			item: {
				type: Object,
				required: true
			},
			modelValue: {
				type: [String, Array, Number],
				default: ''
			},
			disabled: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:modelValue'],
		mounted() {
			this.initializeSelector();
		},
		beforeUnmount() {
			if (this.tagSelector) {
				this.tagSelector.getDialog().destroy();
				this.tagSelector = null;
			}
		},
		methods: {
			syncValue() {
				if (!this.tagSelector) {
					return;
				}
				const tags = this.tagSelector.getTags();
				const newValues = tags.map(tag => {
					return tag.getId();
				}).filter(Boolean);
				this.$emit('update:modelValue', newValues.length > 0 ? newValues[0] : '');
			},
			getPreselectedItems() {
				return this.normalizeModelValues().map(value => [ENTITY_TYPES.BI_DASHBOARD, value]);
			},
			normalizeModelValues() {
				if (main_core.Type.isArray(this.modelValue)) {
					return this.modelValue.map(v => Number(v)).filter(v => main_core.Type.isNumber(v));
				}
				return this.modelValue ? [Number(this.modelValue)].filter(v => main_core.Type.isNumber(v)) : [];
			},
			initializeSelector() {
				this.tagSelector = new ui_entitySelector.TagSelector({
					multiple: false,
					dialogOptions: {
						context: `BIZPROC_BI_DASHBOARD_SELECTOR_${this.item.id}`,
						popupOptions: {
							className: 'bizproc-setup-template__no-tabs-selector-popup'
						},
						width: 500,
						entities: [{
							id: ENTITY_TYPES.BI_DASHBOARD
						}],
						multiple: false,
						dropdownMode: true,
						compactView: true,
						height: 280,
						preselectedItems: this.getPreselectedItems()
					},
					events: {
						onAfterTagAdd: this.syncValue,
						onAfterTagRemove: this.syncValue
					}
				});
				this.tagSelector.renderTo(this.$refs.container);
			}
		},
		template: `
		<div ref="container" data-test-id="bizproc-setup-template__form-bi-dashboard"></div>
	`
	};

	const ConstantFieldMap = {
		[CONSTANT_TYPES.TEXT]: 'ConstantTextarea',
		[CONSTANT_TYPES.STRING]: 'ConstantTextual',
		[CONSTANT_TYPES.INT]: 'ConstantTextual',
		[CONSTANT_TYPES.SELECT]: 'ConstantSelect',
		[CONSTANT_TYPES.USER]: 'ConstantUser',
		[CONSTANT_TYPES.KNOWLEDGE]: 'ConstantKnowledge',
		[CONSTANT_TYPES.PROJECT]: 'ConstantProject',
		[CONSTANT_TYPES.FILE]: 'ConstantFile',
		[CONSTANT_TYPES.ENTITY_SELECTOR]: 'ConstantEntitySelector',
		[CONSTANT_TYPES.TIME]: 'ConstantTime',
		[CONSTANT_TYPES.DATE]: 'ConstantDate',
		[CONSTANT_TYPES.DATETIME]: 'ConstantDatetime',
		[CONSTANT_TYPES.BOOL]: 'ConstantBool',
		[CONSTANT_TYPES.BI_DASHBOARD]: 'ConstantBIDashboard'
	};

	// @vue/component
	const ConstantComponent = {
		name: 'ConstantComponent',
		components: {
			ConstantTextual,
			ConstantSelect,
			ConstantUser,
			ConstantTextarea,
			ConstantKnowledge,
			ConstantProject,
			ConstantFile,
			ConstantEntitySelector,
			ConstantTime,
			ConstantDate,
			ConstantDatetime,
			ConstantBool,
			ConstantBIDashboard
		},
		props: {
			/** @type ConstantItem */
			item: {
				type: Object,
				required: true
			},
			formData: {
				type: Object,
				required: true
			},
			error: {
				type: String,
				default: ''
			}
		},
		emits: ['constantUpdate', 'constantDateMissing'],
		computed: {
			constantValue: {
				get() {
					return this.getCurrentConstantValue();
				},
				set(newValue) {
					this.$emit('constantUpdate', this.item.id, newValue);
				}
			},
			fieldComponent() {
				return ConstantFieldMap[this.item.constantType] || null;
			},
			isRequired() {
				return this.item.required;
			},
			isKnowledgeField() {
				return this.item.constantType === CONSTANT_TYPES.KNOWLEDGE;
			},
			labelId() {
				return `bizproc-setup-template-label-${this.item.id}`;
			},
			errorId() {
				return `bizproc-setup-template-error-${this.item.id}`;
			},
			hasNativeControl() {
				return [CONSTANT_TYPES.STRING, CONSTANT_TYPES.INT, CONSTANT_TYPES.TEXT, CONSTANT_TYPES.TIME, CONSTANT_TYPES.DATE, CONSTANT_TYPES.DATETIME].includes(this.item.constantType);
			},
			hasGroupControl() {
				return this.item.constantType === CONSTANT_TYPES.SELECT;
			},
			// The bool field carries the name of the constant next to its switcher, and a multiple one
			// next to every switcher of the list, so the row has no label above the control.
			hasSwitchControl() {
				return this.item.constantType === CONSTANT_TYPES.BOOL;
			},
			/**
			 * Only a date and time field reports a time picked with no date, and a listener a field does
			 * not declare would fall through to its markup, so it is bound to that type alone.
			 */
			fieldListeners() {
				if (this.item.constantType !== CONSTANT_TYPES.DATETIME) {
					return {};
				}
				return {
					dateMissingChange: isDateMissing => {
						this.$emit('constantDateMissing', this.item.id, isDateMissing);
					}
				};
			},
			// Associate the visible label, required state and error text with the
			// native controls (text/textarea/int/time/date/datetime), with the select
			// group container (role="group") and with the bool switch (role="switch").
			// Other library-backed fields keep their own markup.
			fieldAccessibilityProps() {
				if (!this.hasGroupControl && !this.hasNativeControl && !this.hasSwitchControl) {
					return {};
				}
				const props = {
					labelledbyId: this.labelId
				};
				if (this.isRequired) {
					props.required = true;
				}
				if (this.error) {
					props.describedbyId = this.errorId;
					props.invalid = true;
				}
				return props;
			}
		},
		methods: {
			getCurrentConstantValue() {
				const currentValue = this.formData[this.item.id];
				if (this.item.multiple) {
					if (main_core.Type.isArray(currentValue)) {
						return currentValue;
					}
					if (currentValue) {
						return [currentValue];
					}
					return [];
				}
				return currentValue ?? '';
			}
		},
		template: `
		<template v-if="isKnowledgeField">
			<component
				:is="fieldComponent"
				:item="item"
				v-model="constantValue"
				:isRequired="isRequired"
			/>
		</template>
		<template v-else>
			<div
				class="ui-form-row"
				:class="{ '--error': error }"
				:aria-labelledby="hasSwitchControl ? null : labelId"
				:aria-describedby="error ? errorId : null"
				:data-test-id="'bizproc-setup-template__form-field-' + item.id"
			>
				<div
					v-if="!hasSwitchControl"
					:class="{ '--required': isRequired }"
					class="ui-form-label bizproc-setup-template__label"
				>
					<div :id="labelId" class="ui-ctl-label-text bizproc-setup-template__label-text">{{ item.name }}</div>
				</div>
				<div class="ui-form-content">
					<component
						v-if="fieldComponent"
						:is="fieldComponent"
						:item="item"
						v-model="constantValue"
						v-bind="fieldAccessibilityProps"
						v-on="fieldListeners"
					/>
					<div v-if="error" :id="errorId" class="bizproc-setup-template__error-text">
						<div class="ui-icon-set --warning"></div>
						{{ error }}
					</div>
				</div>
			</div>
		</template>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const DelimiterComponent = {
		name: 'DelimiterComponent',
		props: {
			/** @type DelimiterItem */
			item: {
				type: Object,
				required: true
			}
		},
		template: `
		<div class="bizproc-setup-template__delimiter"></div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const DescriptionComponent = {
		name: 'DescriptionComponent',
		props: {
			/** @type DescriptionItem */
			item: {
				type: Object,
				required: true
			}
		},
		template: `
		<div class="bizproc-setup-template__text --with-linebreak">
			{{ item.text }}
		</div>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const TitleComponent = {
		name: 'TitleComponent',
		props: {
			/** @type TitleItem */
			item: {
				type: Object,
				required: true
			}
		},
		template: `
		<h2 class="bizproc-setup-template__heading">
			{{ item.text }}
		</h2>
	`
	};

	// eslint-disable-next-line no-unused-vars

	// @vue/component
	const TitleIconComponent = {
		name: 'TitleIconComponent',
		props: {
			/** @type TitleIconItem */
			item: {
				type: Object,
				required: true
			}
		},
		computed: {
			currentIconCssClass() {
				return PRESET_TITLE_ICONS[this.item.icon] || PRESET_TITLE_ICONS.IMAGE;
			}
		},
		template: `
		<h2 class="bizproc-setup-template__heading --icon">
			<i class="ui-icon-set" :class="'--' + currentIconCssClass"></i>
			<div class="bizproc-setup-template__heading-text">
				{{ item.text }}
			</div>
		</h2>

	`
	};

	const componentMap = {
		[ITEM_TYPES.TITLE]: 'TitleComponent',
		[ITEM_TYPES.TITLE_WITH_ICON]: 'TitleIconComponent',
		[ITEM_TYPES.DESCRIPTION]: 'DescriptionComponent',
		[ITEM_TYPES.DELIMITER]: 'DelimiterComponent',
		[ITEM_TYPES.CONSTANT]: 'ConstantComponent'
	};

	// @vue/component
	const FormElement = {
		name: 'FormElement',
		components: {
			TitleComponent,
			TitleIconComponent,
			DelimiterComponent,
			DescriptionComponent,
			ConstantComponent
		},
		props: {
			/** @type Item */
			item: {
				type: Object,
				required: true
			},
			formData: {
				type: Object,
				required: true
			},
			errors: {
				type: Object,
				required: true
			}
		},
		emits: ['constantUpdate', 'constantDateMissing'],
		computed: {
			componentName() {
				return componentMap[this.item.itemType] || null;
			},
			constantFormData() {
				if (this.item.itemType === ITEM_TYPES.CONSTANT) {
					return this.formData;
				}
				return undefined;
			}
		},
		methods: {
			constantUpdate(constantId, value) {
				this.$emit('constantUpdate', constantId, value);
			},
			constantDateMissing(constantId, isDateMissing) {
				this.$emit('constantDateMissing', constantId, isDateMissing);
			}
		},
		template: `
		<component
			v-if="componentName"
			:is="componentName"
			:item="item"
			:formData="constantFormData"
			:error="errors[item.id]"
			@constantUpdate="constantUpdate"
			@constantDateMissing="constantDateMissing"
		/>
	`
	};

	const TOTAL_STEPS_COUNT = 2;
	const BEFORE_SUBMIT_EVENT = 'Bizproc:SetupTemplate:beforeSubmit';
	const FOCUSABLE_SELECTOR = 'input:not([type="hidden"]), textarea, select, button, [role="button"], [tabindex]:not([tabindex="-1"])';

	// @vue/component
	const ActivatorAppComponent = {
		name: 'ActivatorAppComponent',
		components: {
			FormElement
		},
		provide() {
			return {
				templateId: this.templateId
			};
		},
		props: {
			templateId: {
				type: Number,
				required: true
			},
			templateName: {
				type: String,
				default: ''
			},
			templateDescription: {
				type: String,
				default: ''
			},
			instanceId: {
				type: String,
				default: ''
			},
			/** @type Array<Block> */
			blocks: {
				type: Array,
				required: true
			},
			/**
			 * Render-only mode: collect constant values and hand them to this
			 * callback instead of running a workflow fill session. Used by the
			 * agent upgrade fill scenario (Design A). Receives the prepared
			 * `{ <constantCode>: <value> }` map and returns a Promise resolving to a
			 * review payload (repeated needs_review — keep the panel open, re-render
			 * and explain why), `false` (keep open unchanged) or null/undefined
			 * (flow complete — close the panel).
			 * @type ?(constantValues: { [key: string]: any }) => Promise<?FieldsSubmitReview | boolean>
			 */
			onSubmit: {
				type: Function,
				default: null
			},
			/** Skip the intro step and render the fields immediately. */
			singleStep: {
				type: Boolean,
				default: false
			},
			/** Overrides the submit button caption on the fields step. */
			submitCaption: {
				type: String,
				default: ''
			},
			/** Overrides the panel header title (defaults to the common setup title). */
			title: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				currentStep: this.singleStep ? TOTAL_STEPS_COUNT : 1,
				isLoading: false,
				submitError: '',
				validationErrors: {},
				// A date and time field with a time but no date: the value is empty while the field looks
				// filled in, so the check runs on submit and asks for the date by name.
				dateMissingConstants: {},
				// Local copy so the callback flow (Design A) can swap in the blocks
				// still required on a repeated needs_review without a remount.
				renderBlocks: this.blocks,
				formData: this.getFormDataWithDefaultValues()
			};
		},
		computed: {
			allConstants() {
				return this.renderBlocks.flatMap(block => block.items).filter(item => item.itemType === ITEM_TYPES.CONSTANT);
			},
			isBtnDisabled() {
				return this.isLoading;
			},
			isFirstStep() {
				return this.currentStep === 1;
			},
			totalSteps() {
				return TOTAL_STEPS_COUNT;
			},
			buttonText() {
				if (!this.isFirstStep && this.submitCaption) {
					return this.submitCaption;
				}
				const messageCode = this.isFirstStep ? 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_CONTINUE_BUTTON' : 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_RUN_BUTTON';
				return this.$Bitrix.Loc.getMessage(messageCode);
			},
			showProgressBar() {
				return !this.singleStep;
			},
			panelTitle() {
				return this.title || this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_TITLE');
			},
			buttonClickHandler() {
				return this.isFirstStep ? this.proceedToNextStep : this.handleSubmit;
			}
		},
		methods: {
			getFormDataWithDefaultValues(blocks = this.blocks) {
				const initialData = {};
				blocks.forEach(block => {
					block.items.forEach(item => {
						if (item.itemType === ITEM_TYPES.CONSTANT) {
							initialData[item.id] = item.default ?? '';
						}
					});
				});
				return initialData;
			},
			getPreparedDataForRequest() {
				const preparedData = {};
				this.allConstants.forEach(item => {
					const key = item.id;
					const value = this.formData[key];
					if (this.isValueEmpty(value)) {
						return;
					}
					if (main_core.Type.isArray(value)) {
						let preparedValues = value.filter(val => !this.isValueEmpty(val));
						if (preparedValues.length === 0) {
							return;
						}
						if (item.constantType === CONSTANT_TYPES.INT) {
							preparedValues = preparedValues.map(Number);
						}
						preparedData[key] = preparedValues;
					} else if (item.constantType === CONSTANT_TYPES.INT) {
						preparedData[key] = Number(value);
					} else {
						preparedData[key] = value;
					}
				});
				return preparedData;
			},
			activateTemplateRequest() {
				const FILL_TEMPLATE_ACTION = 'bizproc.v2.SetupTemplate.fill';
				const constantValues = this.getPreparedDataForRequest();
				return main_core.ajax.runAction(FILL_TEMPLATE_ACTION, {
					data: {
						templateId: this.templateId,
						instanceId: this.instanceId,
						constantValues
					}
				});
			},
			getErrorFromResponse(response) {
				if (!response.errors) {
					return '';
				}
				if (!main_core.Type.isArrayFilled(response.errors)) {
					return this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_UNEXPECTED_ERROR');
				}
				const [firstError] = response.errors;
				return firstError.message;
			},
			async handleSubmit() {
				if (!this.validateForm()) {
					// client-side validation only highlights fields; the screen reader
					// gets nothing unless we announce the summary and move focus to the
					// first invalid field (which then reads its aria-invalid + error text)
					ui_a11y.LiveAnnouncer.announce(this.getValidationSummaryMessage(), 'assertive');
					const target = await this.syncErrorAnchors();
					target?.focus();
					return;
				}
				this.isLoading = true;
				this.submitError = '';
				try {
					const eventRes = await main_core_events.EventEmitter.emitAsync(BEFORE_SUBMIT_EVENT);
					if (eventRes.includes(false)) {
						this.isLoading = false;
						return;
					}
					if (main_core.Type.isFunction(this.onSubmit)) {
						await this.submitViaCallback();
					} else {
						await this.submitViaFillRequest();
					}
				} catch (error) {
					this.submitError = this.getErrorFromResponse(error);
				}
				this.isLoading = false;
			},
			async submitViaFillRequest() {
				await this.activateTemplateRequest();
				const event = new main_core_events.BaseEvent({
					data: {
						templateId: this.templateId
					}
				});
				main_core_events.EventEmitter.emit(TEMPLATE_SETUP_EVENT_NAME.SUCCESS, event);
				BX.SidePanel.Instance.close();
			},
			/**
			 * Render-only mode: hand collected values to the owner callback. The
			 * server re-validates. The callback resolves:
			 *  - a review payload — repeated needs_review, re-render the prefilled
			 *    blocks, highlight the reported fields and explain why the panel
			 *    stayed open;
			 *  - `false` — keep the panel open unchanged (e.g. a handled error);
			 *  - null/undefined — the flow is complete, close the panel.
			 */
			async submitViaCallback() {
				const result = await this.onSubmit(this.getPreparedDataForRequest());
				if (result === false) {
					return;
				}
				if (main_core.Type.isPlainObject(result)) {
					this.applyReview(result);
					return;
				}
				BX.SidePanel.Instance.close();
			},
			/**
			 * Repeated needs_review: re-render the blocks (already prefilled with the
			 * values the server echoed, so input is not lost), highlight the fields
			 * the server reported and show a non-blocking message explaining why the
			 * panel did not close.
			 */
			applyReview(review) {
				this.renderBlocks = review.blocks;
				this.formData = this.getFormDataWithDefaultValues(review.blocks);
				this.validationErrors = this.getReviewFieldErrors(review);
				this.submitError = this.getReviewMessage(review);
				void this.syncErrorAnchors();
			},
			getReviewFieldErrors(review) {
				const errors = {};
				const requiredMessage = this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALIDATION_ERROR');
				const invalidMessage = this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALIDATION_ERROR_GENERIC');
				(review.requiredConstants ?? []).forEach(code => {
					errors[code] = requiredMessage;
				});
				(review.invalidConstants ?? []).forEach(code => {
					errors[code] = invalidMessage;
				});
				return errors;
			},
			getReviewMessage(review) {
				if (main_core.Type.isArrayFilled(review.requiredConstants)) {
					return this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_REQUIRED');
				}
				if (main_core.Type.isArrayFilled(review.invalidConstants)) {
					return this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_INVALID');
				}
				return this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_GENERAL');
			},
			handleCancel() {
				BX.SidePanel.Instance.close();
			},
			onConstantUpdate(constantId, value) {
				this.formData[constantId] = value;
				if (this.validationErrors[constantId] && !this.isValueEmpty(value)) {
					delete this.validationErrors[constantId];
					void this.syncErrorAnchors();
				}
			},
			/**
			 * A date and time field reports a time picked with no date. The form keeps the flag and uses it
			 * on submit only: the field is not highlighted while the user is still filling it in.
			 */
			onConstantDateMissing(constantId, isDateMissing) {
				this.dateMissingConstants[constantId] = isDateMissing;
			},
			isValueEmpty(value) {
				// A list of values is empty when every row of it is: getPreparedDataForRequest drops empty
				// rows, so a list of blank rows reaches the server as no value at all.
				if (main_core.Type.isArray(value)) {
					return value.every(item => this.isValueEmpty(item));
				}
				const stringValue = (value ?? '').toString();
				return stringValue.trim().length === 0;
			},
			validateForm() {
				this.validationErrors = {};
				const simpleConstants = this.allConstants.filter(item => item.constantType !== CONSTANT_TYPES.KNOWLEDGE);
				simpleConstants.forEach(item => {
					const value = this.formData[item.id];
					// A time picked with no date is not a value, so the process would start without the time
					// the field still shows: the date is asked for whether or not the constant is required.
					// This branch goes first, because "required field is empty" would read as wrong next to
					// a field showing the picked time.
					if (this.dateMissingConstants[item.id]) {
						this.validationErrors[item.id] = this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALIDATION_ERROR_DATE');
					} else if (item.required && this.isValueEmpty(value)) {
						this.validationErrors[item.id] = this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALIDATION_ERROR');
					} else if (item.constantType === CONSTANT_TYPES.INT && this.isNotNumber(value)) {
						this.validationErrors[item.id] = this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_FORM_VALIDATION_ERROR_INT', {
							'#FIELD_NAME#': item.name
						});
					}
				});
				return Object.keys(this.validationErrors).length === 0;
			},
			isNotNumber(value) {
				const check = val => {
					if (this.isValueEmpty(val)) {
						return false;
					}
					return Number.isNaN(Number(val));
				};
				if (main_core.Type.isArray(value)) {
					return value.some(item => check(item));
				}
				return check(value);
			},
			proceedToNextStep() {
				this.currentStep++;
				this.focusFirstField();
			},
			async focusFirstField() {
				await this.$nextTick();
				const content = this.$refs.contentInner;
				if (!content) {
					return;
				}
				const focusable = content.querySelector(FOCUSABLE_SELECTOR);
				focusable?.focus();
			},
			/**
			 * Invalid rows carry the --error modifier (constant.js). A row whose control
			 * cannot take focus (the uploader drop zone) is turned into a real tab stop
			 * (tabindex="0") so the user reaches it during normal navigation and the
			 * screen reader reads its label + error (the row is aria-labelledby/
			 * aria-describedby). Anchors are removed once the field becomes valid or
			 * gains a focusable control. Returns the first field to focus.
			 */
			async syncErrorAnchors() {
				await this.$nextTick();
				const content = this.$refs.contentInner;
				if (!content) {
					return null;
				}
				let firstTarget = null;
				content.querySelectorAll('.ui-form-row').forEach(row => {
					const isInvalid = row.classList.contains('--error');
					const focusable = row.querySelector(FOCUSABLE_SELECTOR);
					if (isInvalid && !focusable) {
						row.setAttribute('tabindex', '0');
						row.dataset.a11yErrorAnchor = 'true';
					} else if (row.dataset.a11yErrorAnchor === 'true') {
						row.removeAttribute('tabindex');
						delete row.dataset.a11yErrorAnchor;
					}
					if (isInvalid && !firstTarget) {
						firstTarget = focusable ?? row;
					}
				});
				return firstTarget;
			},
			getInvalidFieldNames() {
				return this.allConstants.filter(item => this.validationErrors[item.id]).map(item => item.name).filter(name => main_core.Type.isStringFilled(name));
			},
			getValidationSummaryMessage() {
				const hasRequiredError = this.allConstants.some(item => item.required && this.isValueEmpty(this.formData[item.id]));
				const fieldNames = this.getInvalidFieldNames();
				if (fieldNames.length === 0) {
					return hasRequiredError ? this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_REQUIRED') : this.$Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_INVALID');
				}
				const messageCode = hasRequiredError ? 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_REQUIRED_FIELDS' : 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_NEEDS_REVIEW_INVALID_FIELDS';
				return this.$Bitrix.Loc.getMessage(messageCode, {
					'#FIELDS#': fieldNames.join(', ')
				});
			},
			isCurrentStep(step) {
				return this.currentStep === step;
			}
		},
		template: `
		<div class="bizproc-setup-template__form" data-test-id="bizproc-setup-template__form-container">
			<div class="ui-sidepanel-layout-header">
				<div class="ui-sidepanel-layout-title">
					{{ panelTitle }}
				</div>
			</div>
			<div class="ui-sidepanel-layout-content ui-sidepanel-layout-content-margin">
				<div class="ui-sidepanel-layout-content-inner" ref="contentInner">
					<div v-if="showProgressBar" class="bizproc-setup-template__progress-bar">
						<div
							v-for="step in totalSteps"
							:key="step"
							class="bizproc-setup-template__progress-item"
							:class="{ '--active': isCurrentStep(step) }"
						></div>
					</div>
					<template v-if="isFirstStep">
						<div class="ui-slider-section">
							<div class="bizproc-setup-template__heading">
								{{ templateName }}
							</div>
							<div class="bizproc-setup-template__subject">
								{{ templateDescription }}
							</div>
						</div>
					</template>
					<template v-else>
						<div v-if="submitError" class="ui-alert ui-alert-danger" role="alert">
							<span class="ui-alert-message">{{ submitError }}</span>
						</div>
						<template v-for="block in renderBlocks" :key="block.id">
							<div class="ui-slider-section">
								<div class="ui-slider-content-box">
									<FormElement
										v-for="item in block.items"
										:key="item.id"
										:item="item"
										:formData="formData"
										:errors="validationErrors"
										@constantUpdate="onConstantUpdate"
										@constantDateMissing="onConstantDateMissing"
									/>
								</div>
							</div>
						</template>
					</template>
				</div>
			</div>
			<div class="ui-sidepanel-layout-footer-anchor"></div>
			<div class="ui-sidepanel-layout-footer">
				<div class="ui-sidepanel-layout-buttons ui-sidepanel-layout-buttons-align-left">
					<button
						class="ui-btn --air ui-btn-lg --style-filled ui-btn-no-caps"
						:class="{'ui-btn-wait': isLoading}"
						:disabled="isBtnDisabled"
						type="button"
						@click="buttonClickHandler"
						data-test-id="bizproc-setup-template__form-submit-button"
					>
						<span class="ui-btn-text">
							<span class="ui-btn-text-inner">
								{{ buttonText }}
							</span>
						</span>
					</button>
					<button
						class="ui-btn --air ui-btn-lg --style-plain ui-btn-no-caps"
						type="button"
						@click="handleCancel"
						data-test-id="bizproc-setup-template__form-cancel-button"
					>
						<span class="ui-btn-text">
							<span class="ui-btn-text-inner">
								{{ $Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_CANCEL_BUTTON') }}
							</span>
						</span>
					</button>
				</div>
			</div>
		</div>
	`
	};

	class SetupTemplate {
		#pushData;
		#container;
		#application;
		constructor(options) {
			this.#container = options.container;
			this.#pushData = options.pushData;
		}
		mount() {
			this.#application = ui_vue3.BitrixVue.createApp(ActivatorAppComponent, {
				templateId: this.#pushData.templateId,
				templateName: this.#pushData.templateName,
				templateDescription: this.#pushData.templateDescription,
				instanceId: this.#pushData.instanceId,
				blocks: this.#pushData.blocks,
				onSubmit: this.#pushData.onSubmit ?? null,
				singleStep: this.#pushData.singleStep === true,
				submitCaption: this.#pushData.submitCaption ?? '',
				title: this.#pushData.title ?? ''
			});
			this.#application.mount(this.#container);
		}
		unmount() {
			if (this.#application) {
				this.#application.unmount();
				this.#application = null;
			}
		}
		getContainer() {
			return this.#container;
		}
		static createLayout(params) {
			const container = main_core.Tag.render`<div class="ui-sidepanel-layout"></div>`;
			const app = new SetupTemplate({
				container,
				pushData: params
			});
			app.mount();
			return app;
		}
		static showSidePanel(params) {
			let layout = null;
			BX.SidePanel.Instance.open('bizproc:setup-template-fill', {
				width: 700,
				cacheable: false,
				// Give the dialog (role=dialog) a programmatic accessible name
				// (the agent name); the title option only affects ariaLabel, not a
				// visual header, so there is no duplicate with the Vue title.
				title: params.templateName ?? '',
				contentCallback: () => {
					layout = SetupTemplate.createLayout(params);
					return layout.getContainer();
				},
				events: {
					// Tear down the Vue app when the panel finishes closing so the
					// fields' beforeUnmount hooks (dialogs/pickers) run and detached
					// DOM/listeners are not leaked.
					onCloseComplete: () => {
						layout?.unmount();
						layout = null;
					}
				}
			});
		}

		/**
		 * Design A: render the passed setup blocks as a single-step form and hand
		 * the collected constant values to `onSubmit`. An optional `title` overrides
		 * the panel header (defaults to the common setup title) and names the dialog
		 * (accessible name) via the SidePanel `title` option.
		 */
		static showFieldsSidePanel(params) {
			let layout = null;
			BX.SidePanel.Instance.open('bizproc:setup-template-fill', {
				width: 700,
				cacheable: false,
				// Give the dialog (role=dialog) a programmatic accessible name.
				title: params.title ?? '',
				contentCallback: () => {
					layout = SetupTemplate.createLayout({
						templateId: params.templateId,
						blocks: params.blocks,
						onSubmit: params.onSubmit,
						submitCaption: params.submitCaption ?? '',
						title: params.title ?? '',
						singleStep: true
					});
					return layout.getContainer();
				},
				events: {
					// Tear down the Vue app when the panel finishes closing so the
					// fields' beforeUnmount hooks (dialogs/pickers) run and detached
					// DOM/listeners are not leaked. `onClose` lets the owner release
					// any per-panel guard regardless of how the panel was closed
					// (completion or cancellation).
					onCloseComplete: () => {
						layout?.unmount();
						layout = null;
						params.onClose?.();
					}
				}
			});
		}
		static subscribeOnPull() {
			pull_client.PULL.subscribe({
				moduleId: 'bizproc',
				command: 'setupTemplateActivityBlocks',
				callback: pushData => {
					SetupTemplate.showSidePanel(pushData);
				}
			});
		}
	}

	exports.ActivatorAppComponent = ActivatorAppComponent;
	exports.BOOL_VALUES = BOOL_VALUES;
	exports.FormElement = FormElement;
	exports.PICKER_ROW_SELECTOR = PICKER_ROW_SELECTOR;
	exports.SetupTemplate = SetupTemplate;
	exports.VALUE_FORMATS = VALUE_FORMATS;
	exports.createBoundPicker = createBoundPicker;
	exports.createDateFromText = createDateFromText;
	exports.formatDate = formatDate;
	exports.isBoolValueChecked = isBoolValueChecked;
	exports.isPickerOpenKey = isPickerOpenKey;
	exports.normalizeBoolValue = normalizeBoolValue;
	exports.parseValue = parseValue;
	exports.serializeValue = serializeValue;

})(this.BX.Bizproc = this.BX.Bizproc || {}, BX, BX, BX.Vue3, BX.Event, BX.UI.Accessibility, BX.UI.EntitySelector, BX.Bizproc.RagSelector, BX.UI.Uploader, BX.UI.Uploader, BX.UI.DatePicker, BX.Main, BX.UI, BX.UI.Vue3.Components);
//# sourceMappingURL=setup-template.bundle.js.map
