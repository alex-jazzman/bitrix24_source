/* eslint-disable */
this.BX = this.BX || {};
(function (exports,pull_client,ui_vue3,main_core_events,bizproc_ragSelector,ui_entitySelector,main_core,ui_uploader_tileWidget,ui_uploader_core) {
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
	  PROJECT: 'project'
	});
	const DELIMITER_TYPES = Object.freeze({
	  LINE: 'line'
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
	    removeField(index) {
	      const newValues = [...this.multipleValues];
	      newValues.splice(index, 1);
	      this.updateConstant(newValues);
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
							@input="updateValueAtIndex(index, $event)"
							data-test-id="bizproc-setup-template__form-text-multiple"
						>
					</div>
					<span
						v-if="showRemoveIcon"
						@click="removeField(index)"
						data-test-id="bizproc-setup-template__form-text-delete-btn"
						class="bizproc-setup-template__field-remove ui-icon-set --cross-m"
					></span>
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
	    }
	  },
	  emits: ['update:modelValue'],
	  computed: {
	    selectedValue: {
	      get() {
	        return this.modelValue;
	      },
	      set(newValue) {
	        this.$emit('update:modelValue', newValue);
	      }
	    },
	    options() {
	      return this.item.options || [];
	    },
	    showScroll() {
	      return this.options.length > 7;
	    }
	  },
	  methods: {
	    getFieldId(option) {
	      return `select-opt-${this.item.id}-${option.id}`;
	    }
	  },
	  template: `
		<div :class="{ 'bizproc-setup-template__field-select': showScroll }">
			<template v-if="item.multiple">
				<div v-for="option in options" :key="option.id" class="ui-ctl ui-ctl-checkbox">
					<input
						type="checkbox"
						class="ui-ctl-element"
						:value="option.name"
						v-model="selectedValue"
						:id="getFieldId(option)"
					>
					<label class="ui-ctl-label-text" :for="getFieldId(option)">{{ option.name }}</label>
				</div>
			</template>
			<template v-else>
				<div v-for="option in options" :key="option.id" class="ui-ctl ui-ctl-radio">
					<input
						type="radio"
						class="ui-ctl-element"
						:value="option.name"
						v-model="selectedValue"
						:id="getFieldId(option)"
					>
					<label class="ui-ctl-label-text" :for="getFieldId(option)">{{ option.name }}</label>
				</div>
			</template>
		</div>
	`
	};

	const ENTITY_TYPES = Object.freeze({
	  USER: 'user',
	  DEPARTMENT: 'structure-node'
	});
	const VALUE_PARSERS = [{
	  template: /^group_hrr(\d+)$/,
	  format: match => [ENTITY_TYPES.DEPARTMENT, match[1]]
	}, {
	  template: /^group_hr(\d+)$/,
	  format: match => [ENTITY_TYPES.DEPARTMENT, `${match[1]}:F`]
	}, {
	  template: /^user_(\d+)$/,
	  format: match => [ENTITY_TYPES.USER, match[1]]
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
	        if (entityId === ENTITY_TYPES.USER) {
	          return `${title}[${rawId}]`;
	        }
	        if (entityId === ENTITY_TYPES.DEPARTMENT) {
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
	      return [ENTITY_TYPES.USER, value];
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
	            id: ENTITY_TYPES.USER,
	            options: {
	              inviteEmployeeLink: false
	            }
	          }, {
	            id: ENTITY_TYPES.DEPARTMENT,
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
	    removeField(index) {
	      if (!this.showRemoveIcon) {
	        return;
	      }
	      const newValues = [...this.multipleValues];
	      newValues.splice(index, 1);
	      this.$emit('update:modelValue', newValues);
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
						@click="removeField(index)"
						data-test-id="bizproc-setup-template__form-textarea-delete-btn"
						class="bizproc-setup-template__field-remove ui-icon-set --cross-m"
					></span>
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
	          height: 250,
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
	      var _this$$refs, _this$$refs$tileWidge;
	      const uploader = (_this$$refs = this.$refs) == null ? void 0 : (_this$$refs$tileWidge = _this$$refs.tileWidget) == null ? void 0 : _this$$refs$tileWidge.uploader;
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

	const ConstantFieldMap = {
	  [CONSTANT_TYPES.TEXT]: 'ConstantTextarea',
	  [CONSTANT_TYPES.STRING]: 'ConstantTextual',
	  [CONSTANT_TYPES.INT]: 'ConstantTextual',
	  [CONSTANT_TYPES.SELECT]: 'ConstantSelect',
	  [CONSTANT_TYPES.USER]: 'ConstantUser',
	  [CONSTANT_TYPES.KNOWLEDGE]: 'ConstantKnowledge',
	  [CONSTANT_TYPES.PROJECT]: 'ConstantProject',
	  [CONSTANT_TYPES.FILE]: 'ConstantFile'
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
	    ConstantFile
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
	  emits: ['constantUpdate'],
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
	      return currentValue != null ? currentValue : '';
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
			<div class="ui-form-row" :class="{ '--error': error }">
				<div
					:class="{ '--required': isRequired }"
					class="ui-form-label bizproc-setup-template__label"
				>
					<div class="ui-ctl-label-text bizproc-setup-template__label-text">{{ item.name }}</div>
				</div>
				<div class="ui-form-content">
					<component
						v-if="fieldComponent"
						:is="fieldComponent"
						:item="item"
						v-model="constantValue"
					/>
					<div v-if="error" class="bizproc-setup-template__error-text">
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
		<div class="bizproc-setup-template__heading">
			{{ item.text }}
		</div>
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
		<div class="bizproc-setup-template__heading --icon">
			<i class="ui-icon-set" :class="'--' + currentIconCssClass"></i>
			<div class="bizproc-setup-template__heading-text">
				{{ item.text }}
			</div>
		</div>

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
	  emits: ['constantUpdate'],
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
		/>
	`
	};

	const TOTAL_STEPS_COUNT = 2;
	const BEFORE_SUBMIT_EVENT = 'Bizproc:SetupTemplate:beforeSubmit';

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
	      required: true
	    },
	    templateDescription: {
	      type: String,
	      default: ''
	    },
	    instanceId: {
	      type: String,
	      required: true
	    },
	    /** @type Array<Block> */
	    blocks: {
	      type: Array,
	      required: true
	    }
	  },
	  data() {
	    return {
	      currentStep: 1,
	      isLoading: false,
	      submitError: '',
	      validationErrors: {},
	      formData: this.getFormDataWithDefaultValues()
	    };
	  },
	  computed: {
	    allConstants() {
	      return this.blocks.flatMap(block => block.items).filter(item => item.itemType === ITEM_TYPES.CONSTANT);
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
	      const messageCode = this.isFirstStep ? 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_CONTINUE_BUTTON' : 'BIZPROC_JS_AI_AGENTS_ACTIVATOR_RUN_BUTTON';
	      return this.$Bitrix.Loc.getMessage(messageCode);
	    },
	    buttonClickHandler() {
	      return this.isFirstStep ? this.proceedToNextStep : this.handleSubmit;
	    }
	  },
	  methods: {
	    getFormDataWithDefaultValues() {
	      const initialData = {};
	      this.blocks.forEach(block => {
	        block.items.forEach(item => {
	          if (item.itemType === ITEM_TYPES.CONSTANT) {
	            var _item$default;
	            initialData[item.id] = (_item$default = item.default) != null ? _item$default : '';
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
	        await this.activateTemplateRequest();
	        const event = new main_core_events.BaseEvent({
	          data: {
	            templateId: this.templateId
	          }
	        });
	        main_core_events.EventEmitter.emit(TEMPLATE_SETUP_EVENT_NAME.SUCCESS, event);
	        BX.SidePanel.Instance.close();
	      } catch (error) {
	        this.submitError = this.getErrorFromResponse(error);
	      }
	      this.isLoading = false;
	    },
	    handleCancel() {
	      BX.SidePanel.Instance.close();
	    },
	    onConstantUpdate(constantId, value) {
	      this.formData[constantId] = value;
	      if (this.validationErrors[constantId] && !this.isValueEmpty(value)) {
	        delete this.validationErrors[constantId];
	      }
	    },
	    isValueEmpty(value) {
	      if (main_core.Type.isArray(value) && value.length === 0) {
	        return true;
	      }
	      const stringValue = (value != null ? value : '').toString();
	      return stringValue.trim().length === 0;
	    },
	    validateForm() {
	      this.validationErrors = {};
	      const simpleConstants = this.allConstants.filter(item => item.constantType !== CONSTANT_TYPES.KNOWLEDGE);
	      simpleConstants.forEach(item => {
	        const value = this.formData[item.id];
	        if (item.required && this.isValueEmpty(value)) {
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
	    },
	    isCurrentStep(step) {
	      return this.currentStep === step;
	    }
	  },
	  template: `
		<div class="bizproc-setup-template__form" data-test-id="bizproc-setup-template__form-container">
			<div class="ui-sidepanel-layout-header">
				<div class="ui-sidepanel-layout-title">
					{{ $Bitrix.Loc.getMessage('BIZPROC_JS_AI_AGENTS_ACTIVATOR_TITLE') }}
				</div>
			</div>
			<div class="ui-sidepanel-layout-content ui-sidepanel-layout-content-margin">
				<div class="ui-sidepanel-layout-content-inner">
					<div class="bizproc-setup-template__progress-bar">
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
						<div v-if="submitError" class="ui-alert ui-alert-danger">
							<span class="ui-alert-message">{{ submitError }}</span>
						</div>
						<template v-for="block in blocks" :key="block.id">
							<div class="ui-slider-section">
								<div class="ui-slider-content-box">
									<FormElement
										v-for="item in block.items"
										:key="item.id"
										:item="item"
										:formData="formData"
										:errors="validationErrors"
										@constantUpdate="onConstantUpdate"
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

	let _ = t => t,
	  _t;
	var _pushData = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("pushData");
	var _container = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("container");
	var _application = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("application");
	class SetupTemplate {
	  constructor(options) {
	    Object.defineProperty(this, _pushData, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _container, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _application, {
	      writable: true,
	      value: void 0
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _container)[_container] = options.container;
	    babelHelpers.classPrivateFieldLooseBase(this, _pushData)[_pushData] = options.pushData;
	  }
	  mount() {
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application] = ui_vue3.BitrixVue.createApp(ActivatorAppComponent, {
	      templateId: babelHelpers.classPrivateFieldLooseBase(this, _pushData)[_pushData].templateId,
	      templateName: babelHelpers.classPrivateFieldLooseBase(this, _pushData)[_pushData].templateName,
	      templateDescription: babelHelpers.classPrivateFieldLooseBase(this, _pushData)[_pushData].templateDescription,
	      instanceId: babelHelpers.classPrivateFieldLooseBase(this, _pushData)[_pushData].instanceId,
	      blocks: babelHelpers.classPrivateFieldLooseBase(this, _pushData)[_pushData].blocks
	    });
	    babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].mount(babelHelpers.classPrivateFieldLooseBase(this, _container)[_container]);
	  }
	  unmount() {
	    if (babelHelpers.classPrivateFieldLooseBase(this, _application)[_application]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _application)[_application].unmount();
	    }
	  }
	  static createLayout(params) {
	    const container = main_core.Tag.render(_t || (_t = _`<div class="ui-sidepanel-layout"></div>`));
	    const app = new SetupTemplate({
	      container,
	      pushData: params
	    });
	    app.mount();
	    return container;
	  }
	  static showSidePanel(params) {
	    BX.SidePanel.Instance.open('bizproc:setup-template-fill', {
	      width: 700,
	      cacheable: false,
	      contentCallback: () => SetupTemplate.createLayout(params)
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

	exports.SetupTemplate = SetupTemplate;
	exports.ActivatorAppComponent = ActivatorAppComponent;
	exports.FormElement = FormElement;

}((this.BX.Bizproc = this.BX.Bizproc || {}),BX,BX.Vue3,BX.Event,BX.Bizproc.RagSelector,BX.UI.EntitySelector,BX,BX.UI.Uploader,BX.UI.Uploader));
//# sourceMappingURL=setup-template.bundle.js.map
