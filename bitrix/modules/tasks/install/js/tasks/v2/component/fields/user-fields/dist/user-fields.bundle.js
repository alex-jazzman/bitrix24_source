/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
this.BX.Tasks.V2 = this.BX.Tasks.V2 || {};
this.BX.Tasks.V2.Component = this.BX.Tasks.V2.Component || {};
(function (exports,tasks_v2_component_elements_checkbox,ui_system_typography_vue,tasks_v2_lib_calendar,main_core,main_date,ui_vue3_vuex,ui_system_chip_vue,ui_iconSet_api_vue,ui_iconSet_outline,tasks_v2_const,tasks_v2_lib_fieldHighlighter) {
	'use strict';

	// @vue/component
	const UserFieldString = {
	  components: {
	    TextMd: ui_system_typography_vue.TextMd,
	    TextXs: ui_system_typography_vue.TextXs
	  },
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    value: {
	      type: [String, Array],
	      default: ''
	    },
	    mandatory: {
	      type: Boolean,
	      default: false
	    },
	    isLast: {
	      type: Boolean,
	      default: false
	    }
	  },
	  computed: {
	    values() {
	      if (main_core.Type.isArrayFilled(this.value)) {
	        return this.value.map(v => String(v));
	      }
	      return [String(this.value)];
	    }
	  },
	  template: `
		<div
			class="tasks-user-field --string"
			:class="{ '--last': isLast }"
		>
			<TextXs
				class="tasks-user-field-title"
				:class="{ '--mandatory': mandatory }"
			>
				{{ title }}
			</TextXs>
			<div v-for="(item, index) in values" :key="index" class="tasks-user-field-value">
				<TextMd>{{ item }}</TextMd>
			</div>
		</div>
	`
	};

	// @vue/component
	const UserFieldDouble = {
	  components: {
	    TextMd: ui_system_typography_vue.TextMd,
	    TextXs: ui_system_typography_vue.TextXs
	  },
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    value: {
	      type: [Number, String, Array],
	      default: 0
	    },
	    mandatory: {
	      type: Boolean,
	      default: false
	    },
	    isLast: {
	      type: Boolean,
	      default: false
	    }
	  },
	  computed: {
	    values() {
	      if (main_core.Type.isArrayFilled(this.value)) {
	        return this.value.map(v => this.prepareValue(v));
	      }
	      return [this.prepareValue(this.value)];
	    }
	  },
	  methods: {
	    prepareValue(value) {
	      const numberValue = parseInt(String(value), 10);
	      if (Number.isNaN(numberValue)) {
	        return '0';
	      }
	      return String(numberValue);
	    }
	  },
	  template: `
		<div
			class="tasks-user-field --double"
			:class="{ '--last': isLast }"
		>
			<TextXs
				class="tasks-user-field-title"
				:class="{ '--mandatory': mandatory }"
			>
				{{ title }}
			</TextXs>
			<div v-for="(item, index) in values" :key="index" class="tasks-user-field-value">
				<TextMd>{{ item }}</TextMd>
			</div>
		</div>
	`
	};

	// @vue/component
	const UserFieldBoolean = {
	  components: {
	    TextMd: ui_system_typography_vue.TextMd,
	    TextXs: ui_system_typography_vue.TextXs,
	    Checkbox: tasks_v2_component_elements_checkbox.Checkbox
	  },
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    value: {
	      type: [Boolean, String],
	      default: false
	    },
	    mandatory: {
	      type: Boolean,
	      default: false
	    },
	    isLast: {
	      type: Boolean,
	      default: false
	    }
	  },
	  computed: {
	    preparedValue() {
	      if (main_core.Type.isString(this.value)) {
	        return this.value === '1';
	      }
	      return this.value === true;
	    },
	    mandatoryClass() {
	      return this.mandatory ? 'tasks-user-field-value-mandatory' : '';
	    }
	  },
	  template: `
		<div
			class="tasks-user-field --boolean"
			:class="{ '--last': isLast }"
		>
			<div class="tasks-user-field-boolean-row">
				<Checkbox :checked="preparedValue" disabled/>
				<TextMd :className="mandatoryClass">
					{{ title }}
				</TextMd>
			</div>
		</div>
	`
	};

	// @vue/component
	const UserFieldDate = {
	  components: {
	    TextMd: ui_system_typography_vue.TextMd,
	    TextXs: ui_system_typography_vue.TextXs,
	    BIcon: ui_iconSet_api_vue.BIcon
	  },
	  props: {
	    title: {
	      type: String,
	      required: true
	    },
	    value: {
	      type: [String, Array],
	      default: ''
	    },
	    mandatory: {
	      type: Boolean,
	      default: false
	    },
	    isLast: {
	      type: Boolean,
	      default: false
	    }
	  },
	  session: undefined,
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline
	    };
	  },
	  computed: {
	    values() {
	      if (main_core.Type.isArrayFilled(this.value)) {
	        return this.value.map(v => this.formatDate(v));
	      }
	      return [this.formatDate(this.value)];
	    }
	  },
	  methods: {
	    formatDate(dateString) {
	      const date = this.tryParseDate(dateString);
	      if (!date) {
	        return dateString;
	      }
	      return tasks_v2_lib_calendar.calendar.formatDateTime(date.getTime());
	    },
	    tryParseDate(dateString) {
	      if (dateString.includes('T')) {
	        const date = new Date(dateString);
	        if (!this.isDate(date)) {
	          return null;
	        }
	        date.setTime(date.getTime() + date.getTimezoneOffset() * 60000);
	        return date;
	      }
	      const parsedDate = main_date.DateTimeFormat.parse(dateString);
	      if (this.isDate(parsedDate)) {
	        return parsedDate;
	      }
	      return null;
	    },
	    isDate(value) {
	      return main_core.Type.isDate(value) && !Number.isNaN(value.getTime());
	    }
	  },
	  template: `
		<div
			class="tasks-user-field --date"
			:class="{ '--last': isLast }"
		>
			<TextXs
				class="tasks-user-field-title"
				:class="{ '--mandatory': mandatory }"
			>
				{{ title }}
			</TextXs>
			<template v-for="(item, index) in values" :key="index">
				<div class="tasks-user-field-date-row">
					<BIcon :name="Outline.CALENDAR_WITH_SLOTS"/>
					<TextMd>{{ item }}</TextMd>
				</div>
			</template>
		</div>
	`
	};

	const userFieldsMeta = Object.freeze({
	  id: tasks_v2_const.TaskField.UserFields,
	  title: main_core.Loc.getMessage('TASKS_V2_USER_FIELDS_TITLE')
	});

	var _convertDatetimeValue = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("convertDatetimeValue");
	var _formatDatetime = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("formatDatetime");
	var _isValidDate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("isValidDate");
	class UserFieldsManager {
	  constructor() {
	    Object.defineProperty(this, _isValidDate, {
	      value: _isValidDate2
	    });
	    Object.defineProperty(this, _formatDatetime, {
	      value: _formatDatetime2
	    });
	    Object.defineProperty(this, _convertDatetimeValue, {
	      value: _convertDatetimeValue2
	    });
	  }
	  getPreparedUserFields(userFields, userFieldScheme) {
	    const result = [];
	    for (const userField of userFields) {
	      if (userField.value === null) {
	        continue;
	      }
	      const scheme = userFieldScheme.find(item => {
	        return item.fieldName === userField.key;
	      });
	      if (scheme) {
	        if (!this.validateField(userField.value, scheme.userTypeId)) {
	          continue;
	        }
	        result.push({
	          value: userField.value,
	          title: scheme.editFormLabel,
	          type: scheme.userTypeId,
	          mandatory: scheme.mandatory
	        });
	      }
	    }
	    return result;
	  }
	  validateField(value, type) {
	    if (value === null || value === '') {
	      return false;
	    }
	    if (main_core.Type.isArray(value) && value.length === 0) {
	      return false;
	    }
	    if (main_core.Type.isArray(value) && value.every(item => item === '')) {
	      return false;
	    }
	    return !(type !== tasks_v2_const.UserFieldType.Boolean && value === false);
	  }
	  hasFilledUserFields(userFields, userFieldScheme) {
	    return this.getPreparedUserFields(userFields, userFieldScheme).length > 0;
	  }
	  hasUnfilledFields(userFields, userFieldScheme) {
	    for (const scheme of userFieldScheme) {
	      const field = userFields.find(item => item.key === scheme.fieldName);
	      if (!field || field.value === null) {
	        return true;
	      }
	    }
	    return false;
	  }
	  hasUnfilledMandatoryFields(userFields, userFieldScheme) {
	    for (const scheme of userFieldScheme) {
	      if (!scheme.mandatory) {
	        continue;
	      }
	      const field = userFields.find(item => item.key === scheme.fieldName);
	      if (!field || field.value === null) {
	        return true;
	      }
	    }
	    return false;
	  }
	  hasMandatoryUserFields(userFieldScheme) {
	    for (const scheme of userFieldScheme) {
	      if (scheme.mandatory) {
	        return true;
	      }
	    }
	    return false;
	  }
	  prepareUserFieldsForTaskFromTemplate(userFields, userFieldScheme) {
	    const result = [];
	    for (const userField of userFields) {
	      const scheme = userFieldScheme.find(item => {
	        return item.fieldName === userField.key;
	      });
	      if (!scheme) {
	        result.push(userField);
	        continue;
	      }
	      if (scheme.userTypeId === tasks_v2_const.UserFieldType.Datetime) {
	        const preparedField = {
	          key: userField.key,
	          value: babelHelpers.classPrivateFieldLooseBase(this, _convertDatetimeValue)[_convertDatetimeValue](userField.value)
	        };
	        result.push(preparedField);
	      } else {
	        result.push(userField);
	      }
	    }
	    return result;
	  }
	}
	function _convertDatetimeValue2(value) {
	  if (value === null || value === '') {
	    return value;
	  }
	  if (main_core.Type.isArray(value)) {
	    return value.map(item => babelHelpers.classPrivateFieldLooseBase(this, _formatDatetime)[_formatDatetime](item));
	  }
	  return babelHelpers.classPrivateFieldLooseBase(this, _formatDatetime)[_formatDatetime](value);
	}
	function _formatDatetime2(dateString) {
	  if (!main_core.Type.isStringFilled(dateString)) {
	    return dateString;
	  }
	  if (!dateString.includes('T')) {
	    return dateString;
	  }
	  const date = new Date(dateString);
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _isValidDate)[_isValidDate](date)) {
	    return dateString;
	  }
	  date.setTime(date.getTime() + date.getTimezoneOffset() * 60000);
	  const format = main_date.DateTimeFormat.getFormat('FORMAT_DATETIME');
	  const timestamp = date.getTime() / 1000;
	  return main_date.DateTimeFormat.format(format, timestamp);
	}
	function _isValidDate2(date) {
	  return main_core.Type.isDate(date) && !Number.isNaN(date.getTime());
	}
	const userFieldsManager = new UserFieldsManager();

	// @vue/component
	const UserFields = {
	  components: {
	    BIcon: ui_iconSet_api_vue.BIcon,
	    TextMd: ui_system_typography_vue.TextMd,
	    TextXs: ui_system_typography_vue.TextXs
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isTemplate: {}
	  },
	  emits: ['open'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      userFieldsMeta
	    };
	  },
	  data() {
	    return {
	      isMouseDown: false,
	      selectionMade: false
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      taskUserFieldScheme: `${tasks_v2_const.Model.Interface}/taskUserFieldScheme`,
	      templateUserFieldScheme: `${tasks_v2_const.Model.Interface}/templateUserFieldScheme`
	    }),
	    userFields() {
	      return this.task.userFields || [];
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    },
	    userFieldScheme() {
	      return this.isTemplate ? this.templateUserFieldScheme : this.taskUserFieldScheme;
	    },
	    preparedUserFields() {
	      return userFieldsManager.getPreparedUserFields(this.userFields, this.userFieldScheme);
	    },
	    preparedUserFieldsLength() {
	      return this.preparedUserFields.length;
	    },
	    hasUnfilledFields() {
	      return userFieldsManager.hasUnfilledFields(this.userFields, this.userFieldScheme);
	    },
	    hasUnfilledMandatoryFields() {
	      return userFieldsManager.hasUnfilledMandatoryFields(this.userFields, this.userFieldScheme);
	    },
	    footerText() {
	      return this.hasUnfilledMandatoryFields ? this.loc('TASKS_V2_USER_FIELDS_NOT_FILLED_MANDATORY_FIELDS') : this.loc('TASKS_V2_USER_FIELDS_NOT_FILLED_FIELDS');
	    }
	  },
	  methods: {
	    handleOpenSlider() {
	      if (this.readonly) {
	        return;
	      }
	      this.$emit('open');
	    },
	    getComponentName(type) {
	      return {
	        [tasks_v2_const.UserFieldType.String]: UserFieldString,
	        [tasks_v2_const.UserFieldType.Double]: UserFieldDouble,
	        [tasks_v2_const.UserFieldType.Boolean]: UserFieldBoolean,
	        [tasks_v2_const.UserFieldType.Datetime]: UserFieldDate
	      }[type];
	    },
	    onMouseDown(event) {
	      if (event.button === 0) {
	        this.isMouseDown = true;
	        this.selectionMade = false;
	      }
	    },
	    onMouseMove() {
	      if (this.selectionMade || this.opened) {
	        return;
	      }
	      if (this.isMouseDown) {
	        const selection = window.getSelection();
	        if (selection.toString().length > 0) {
	          this.selectionMade = true;
	        }
	      }
	    },
	    onMouseUp(event) {
	      this.isMouseDown = false;
	      if (!this.selectionMade) {
	        const target = event.target;
	        const isLinkClick = target.tagName === 'A' || target.closest('a');
	        if (!isLinkClick) {
	          this.handleOpenSlider();
	        }
	      }
	    }
	  },
	  template: `
		<div
			class="tasks-field-user-fields"
			:data-task-id="taskId"
			:data-task-field-id="userFieldsMeta.id"
			@mousedown="onMouseDown"
			@mousemove="onMouseMove"
			@mouseup="onMouseUp"
		>
			<div
				class="tasks-field-user-fields-title"
				:class="{
					'--readonly': readonly,
					'--border-radius': preparedUserFieldsLength === 0,
				}"
			>
				<BIcon
					class="tasks-field-user-fields-title-icon"
					:name="Outline.TOPIC"
				/>
				<TextMd accent>{{ userFieldsMeta.title }}</TextMd>
			</div>
			<template
				v-for="(field, index) in preparedUserFields"
				:key="index"
			>
				<component
					:is="getComponentName(field.type)"
					:title="field.title"
					:value="field.value"
					:mandatory="field.mandatory"
					:isLast="index === preparedUserFieldsLength - 1"
				/>
			</template>
			<div
				v-if="!readonly && hasUnfilledFields"
				class="tasks-field-user-fields-footer"
			>
				<TextXs className="tasks-field-user-fields-footer-text">
					{{ footerText }}
				</TextXs>
				<div class="tasks-field-user-fields-footer-fill">
					<TextXs className="tasks-field-user-fields-footer-fill-text">
						{{ loc('TASKS_V2_USER_FIELDS_FILL') }}
					</TextXs>
					<BIcon
						class="tasks-field-user-fields-footer-fill-icon"
						:name="Outline.CHEVRON_RIGHT_L"
					/>
				</div>
			</div>
		</div>
	`
	};

	const UserFieldsChip = {
	  components: {
	    Chip: ui_system_chip_vue.Chip
	  },
	  inject: {
	    task: {},
	    taskId: {},
	    isEdit: {},
	    isTemplate: {}
	  },
	  emits: ['open'],
	  setup() {
	    return {
	      Outline: ui_iconSet_api_vue.Outline,
	      userFieldsMeta
	    };
	  },
	  computed: {
	    ...ui_vue3_vuex.mapGetters({
	      currentUserId: `${tasks_v2_const.Model.Interface}/currentUserId`,
	      taskUserFieldScheme: `${tasks_v2_const.Model.Interface}/taskUserFieldScheme`,
	      templateUserFieldScheme: `${tasks_v2_const.Model.Interface}/templateUserFieldScheme`
	    }),
	    design() {
	      return this.isSelected ? ui_system_chip_vue.ChipDesign.ShadowAccent : ui_system_chip_vue.ChipDesign.ShadowNoAccent;
	    },
	    userFieldScheme() {
	      return this.isTemplate ? this.templateUserFieldScheme : this.taskUserFieldScheme;
	    },
	    userFields() {
	      return this.task.userFields || [];
	    },
	    hasFilledUserFields() {
	      var _this$task;
	      return userFieldsManager.hasFilledUserFields(((_this$task = this.task) == null ? void 0 : _this$task.userFields) || [], this.userFieldScheme);
	    },
	    hasRequiredUserFields() {
	      return userFieldsManager.hasMandatoryUserFields(this.userFieldScheme);
	    },
	    isSelected() {
	      return this.isEdit ? this.hasFilledUserFields : this.hasRequiredUserFields || this.hasFilledUserFields;
	    },
	    readonly() {
	      return !this.task.rights.edit;
	    }
	  },
	  methods: {
	    handleClick() {
	      if (this.isSelected) {
	        this.highlightField();
	      } else {
	        this.$emit('open');
	      }
	    },
	    highlightField() {
	      void tasks_v2_lib_fieldHighlighter.fieldHighlighter.setContainer(this.$root.$el).highlight(userFieldsMeta.id);
	    }
	  },
	  template: `
		<Chip
			:design
			:text="userFieldsMeta.title"
			:icon="Outline.TOPIC"
			:data-task-id="taskId"
			:data-task-chip-id="userFieldsMeta.id"
			@click="handleClick"
		/>
	`
	};

	exports.UserFields = UserFields;
	exports.UserFieldsChip = UserFieldsChip;
	exports.userFieldsMeta = userFieldsMeta;
	exports.userFieldsManager = userFieldsManager;

}((this.BX.Tasks.V2.Component.Fields = this.BX.Tasks.V2.Component.Fields || {}),BX.Tasks.V2.Component.Elements,BX.UI.System.Typography.Vue,BX.Tasks.V2.Lib,BX,BX.Main,BX.Vue3.Vuex,BX.UI.System.Chip.Vue,BX.UI.IconSet,BX,BX.Tasks.V2.Const,BX.Tasks.V2.Lib));
//# sourceMappingURL=user-fields.bundle.js.map
