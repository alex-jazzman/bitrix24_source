/* eslint-disable */
(function (exports,main_core) {
	'use strict';

	const SCHEDULE_CONFIG = {
	  weekly: {
	    rows: ['Interval', 'WeekDays'],
	    fields: ['Interval', 'WeekDays']
	  },
	  monthly: {
	    rows: ['Interval', 'MonthDay'],
	    fields: ['Interval', 'MonthDay']
	  },
	  yearly: {
	    rows: ['Interval', 'YearMonth', 'MonthDay'],
	    fields: ['Interval', 'YearMonth', 'MonthDay']
	  },
	  daily: {
	    rows: ['Interval'],
	    fields: ['Interval']
	  },
	  hourly: {
	    rows: ['Interval'],
	    fields: ['Interval']
	  },
	  once: {
	    rows: [],
	    fields: []
	  }
	};
	const ALL_ROWS = ['Interval', 'WeekDays', 'MonthDay', 'YearMonth'];
	const ALL_FIELDS = ['Interval', 'WeekDays', 'MonthDay', 'YearMonth'];
	const TIMEZONE_OFFSET = /\s\[[\d-]+]$/;
	const TIME_FORMAT = /(\d{1,2}:\d{2})(?::\d{2})?/;
	var _form = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("form");
	var _timePicker = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("timePicker");
	var _runAtInput = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("runAtInput");
	var _runAtHidden = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("runAtHidden");
	var _updateVisibilityBound = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateVisibilityBound");
	var _openTimePickerBound = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openTimePickerBound");
	var _activityFields = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("activityFields");
	var _bindEvents = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("bindEvents");
	var _openTimePicker = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("openTimePicker");
	var _setupRunAtField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setupRunAtField");
	var _syncHidden = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("syncHidden");
	var _clearRunAt = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clearRunAt");
	var _setTimeInDateTime = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("setTimeInDateTime");
	var _buildBaseDateTime = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("buildBaseDateTime");
	var _updateVisibility = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("updateVisibility");
	var _getField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getField");
	var _getFieldSettings = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getFieldSettings");
	var _getRow = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getRow");
	var _clearWeekDays = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("clearWeekDays");
	class ScheduledTriggerRenderer {
	  constructor() {
	    Object.defineProperty(this, _clearWeekDays, {
	      value: _clearWeekDays2
	    });
	    Object.defineProperty(this, _getRow, {
	      value: _getRow2
	    });
	    Object.defineProperty(this, _getFieldSettings, {
	      value: _getFieldSettings2
	    });
	    Object.defineProperty(this, _getField, {
	      value: _getField2
	    });
	    Object.defineProperty(this, _updateVisibility, {
	      value: _updateVisibility2
	    });
	    Object.defineProperty(this, _buildBaseDateTime, {
	      value: _buildBaseDateTime2
	    });
	    Object.defineProperty(this, _setTimeInDateTime, {
	      value: _setTimeInDateTime2
	    });
	    Object.defineProperty(this, _clearRunAt, {
	      value: _clearRunAt2
	    });
	    Object.defineProperty(this, _syncHidden, {
	      value: _syncHidden2
	    });
	    Object.defineProperty(this, _setupRunAtField, {
	      value: _setupRunAtField2
	    });
	    Object.defineProperty(this, _openTimePicker, {
	      value: _openTimePicker2
	    });
	    Object.defineProperty(this, _bindEvents, {
	      value: _bindEvents2
	    });
	    Object.defineProperty(this, _form, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _timePicker, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _runAtInput, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _runAtHidden, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _updateVisibilityBound, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _openTimePickerBound, {
	      writable: true,
	      value: null
	    });
	    Object.defineProperty(this, _activityFields, {
	      writable: true,
	      value: {}
	    });
	  }
	  afterFormRender(form, activityFields = {}) {
	    babelHelpers.classPrivateFieldLooseBase(this, _form)[_form] = form;
	    babelHelpers.classPrivateFieldLooseBase(this, _activityFields)[_activityFields] = activityFields;
	    babelHelpers.classPrivateFieldLooseBase(this, _updateVisibilityBound)[_updateVisibilityBound] = babelHelpers.classPrivateFieldLooseBase(this, _updateVisibility)[_updateVisibility].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _openTimePickerBound)[_openTimePickerBound] = babelHelpers.classPrivateFieldLooseBase(this, _openTimePicker)[_openTimePicker].bind(this);
	    babelHelpers.classPrivateFieldLooseBase(this, _setupRunAtField)[_setupRunAtField]();
	    babelHelpers.classPrivateFieldLooseBase(this, _bindEvents)[_bindEvents]();
	    babelHelpers.classPrivateFieldLooseBase(this, _updateVisibility)[_updateVisibility]();
	  }
	}
	function _bindEvents2() {
	  const typeField = babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField]('ScheduleType');
	  if (typeField) {
	    main_core.Event.bind(typeField, 'change', babelHelpers.classPrivateFieldLooseBase(this, _updateVisibilityBound)[_updateVisibilityBound]);
	  }
	  const runAtField = babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField]('RunAt');
	  if (runAtField) {
	    main_core.Event.bind(runAtField, 'click', babelHelpers.classPrivateFieldLooseBase(this, _openTimePickerBound)[_openTimePickerBound]);
	  }
	  const runAtTextField = babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField]('RunAt_text');
	  if (runAtTextField) {
	    main_core.Event.bind(runAtTextField, 'input', () => babelHelpers.classPrivateFieldLooseBase(this, _clearRunAt)[_clearRunAt]());
	    main_core.Event.bind(runAtTextField, 'change', () => babelHelpers.classPrivateFieldLooseBase(this, _clearRunAt)[_clearRunAt]());
	  }
	}
	function _openTimePicker2() {
	  var _BX, _BX$Runtime;
	  const input = babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField]('RunAt');
	  if (!input) {
	    return;
	  }
	  const openPicker = () => {
	    if (!babelHelpers.classPrivateFieldLooseBase(this, _timePicker)[_timePicker]) {
	      babelHelpers.classPrivateFieldLooseBase(this, _timePicker)[_timePicker] = new BX.UI.DatePicker.DatePicker({
	        targetNode: input,
	        inputField: input,
	        type: 'time',
	        amPmMode: false,
	        timePickerStyle: 'wheel',
	        minuteStep: 5,
	        events: {
	          onSelectChange: () => {
	            babelHelpers.classPrivateFieldLooseBase(this, _syncHidden)[_syncHidden]();
	          }
	        }
	      });
	    }
	    babelHelpers.classPrivateFieldLooseBase(this, _timePicker)[_timePicker].show();
	  };
	  if ((_BX = BX) != null && (_BX$Runtime = _BX.Runtime) != null && _BX$Runtime.loadExtension) {
	    BX.Runtime.loadExtension('ui.date-picker').then(openPicker).catch(() => {});
	  } else {
	    openPicker();
	  }
	}
	function _setupRunAtField2() {
	  var _babelHelpers$classPr;
	  const field = (_babelHelpers$classPr = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form]) == null ? void 0 : _babelHelpers$classPr.querySelector('[name="RunAt"]');
	  if (!field) {
	    return;
	  }
	  const MAX_TIME_VALUE_LENGTH = 100;
	  const extractTimeValue = value => {
	    if (!main_core.Type.isString(value)) {
	      return '';
	    }
	    if (value.length > MAX_TIME_VALUE_LENGTH) {
	      return '';
	    }
	    const clean = value.replace(TIMEZONE_OFFSET, '');
	    const match = clean.match(TIME_FORMAT);
	    return match ? match[1] : '';
	  };
	  const createTimeInput = initialValue => {
	    return main_core.Dom.create('input', {
	      props: {
	        type: 'text',
	        autocomplete: 'off',
	        value: extractTimeValue(initialValue),
	        style: 'cursor: pointer; margin-right: 5px;'
	      }
	    });
	  };
	  if (field.tagName === 'INPUT') {
	    const input = createTimeInput(field.value);
	    const calendarInput = field.parentNode.querySelector('.calendar-icon');
	    main_core.Dom.style(field, 'display', 'none');
	    main_core.Dom.style(calendarInput, 'display', 'none');
	    main_core.Dom.insertBefore(input, field);
	    main_core.Event.bind(input, 'input', () => babelHelpers.classPrivateFieldLooseBase(this, _syncHidden)[_syncHidden]());
	    main_core.Event.bind(input, 'change', () => babelHelpers.classPrivateFieldLooseBase(this, _syncHidden)[_syncHidden]());
	    babelHelpers.classPrivateFieldLooseBase(this, _runAtInput)[_runAtInput] = input;
	    babelHelpers.classPrivateFieldLooseBase(this, _runAtHidden)[_runAtHidden] = field;
	  }
	}
	function _syncHidden2() {
	  if (!babelHelpers.classPrivateFieldLooseBase(this, _runAtInput)[_runAtInput] || !babelHelpers.classPrivateFieldLooseBase(this, _runAtHidden)[_runAtHidden]) {
	    return;
	  }
	  const timeValue = babelHelpers.classPrivateFieldLooseBase(this, _runAtInput)[_runAtInput].value;
	  if (!timeValue) {
	    babelHelpers.classPrivateFieldLooseBase(this, _clearRunAt)[_clearRunAt]();
	    return;
	  }
	  babelHelpers.classPrivateFieldLooseBase(this, _runAtHidden)[_runAtHidden].value = babelHelpers.classPrivateFieldLooseBase(this, _setTimeInDateTime)[_setTimeInDateTime](babelHelpers.classPrivateFieldLooseBase(this, _runAtHidden)[_runAtHidden].value, timeValue);
	}
	function _clearRunAt2() {
	  if (babelHelpers.classPrivateFieldLooseBase(this, _runAtInput)[_runAtInput]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _runAtInput)[_runAtInput].value = '';
	  }
	  if (babelHelpers.classPrivateFieldLooseBase(this, _runAtHidden)[_runAtHidden]) {
	    babelHelpers.classPrivateFieldLooseBase(this, _runAtHidden)[_runAtHidden].value = '';
	  }
	}
	function _setTimeInDateTime2(value, time) {
	  const TIME_WITH_SECONDS = /^\d{1,2}:\d{2}:\d{2}$/;
	  const TIME_IN_DATETIME = /\d{1,2}:\d{2}(:\d{2})?/;
	  if (!time) {
	    return value;
	  }
	  const offsetMatch = main_core.Type.isString(value) ? value.match(TIMEZONE_OFFSET) : null;
	  const offset = offsetMatch ? offsetMatch[0] : '';
	  const clean = main_core.Type.isString(value) ? value.replace(TIMEZONE_OFFSET, '') : '';
	  const timeWithSeconds = TIME_WITH_SECONDS.test(time) ? time : `${time}:00`;
	  let base = clean;
	  if (!base) {
	    base = babelHelpers.classPrivateFieldLooseBase(this, _buildBaseDateTime)[_buildBaseDateTime](time);
	  } else if (TIME_IN_DATETIME.test(base)) {
	    base = base.replace(TIME_IN_DATETIME, timeWithSeconds);
	  } else {
	    base = `${base} ${timeWithSeconds}`;
	  }
	  return `${base}${offset}`;
	}
	function _buildBaseDateTime2(time) {
	  const runAtSettings = babelHelpers.classPrivateFieldLooseBase(this, _getFieldSettings)[_getFieldSettings]('RunAt');
	  const baseDate = main_core.Type.isString(runAtSettings == null ? void 0 : runAtSettings.defaultDate) ? runAtSettings.defaultDate : '';
	  if (!baseDate) {
	    return '';
	  }
	  const [hoursStr = '00', minutesStr = '00'] = time.split(':');
	  const hours = Math.max(0, Math.min(23, parseInt(hoursStr, 10) || 0));
	  const minutes = Math.max(0, Math.min(59, parseInt(minutesStr, 10) || 0));
	  const hoursPadded = hours.toString().padStart(2, '0');
	  const minutesPadded = minutes.toString().padStart(2, '0');
	  const timeWithSeconds = `${hoursPadded}:${minutesPadded}:00`;
	  return TIME_FORMAT.test(baseDate) ? baseDate.replace(TIME_FORMAT, timeWithSeconds) : `${baseDate} ${timeWithSeconds}`;
	}
	function _updateVisibility2() {
	  var _babelHelpers$classPr2;
	  const type = (_babelHelpers$classPr2 = babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField]('ScheduleType')) == null ? void 0 : _babelHelpers$classPr2.value;
	  const currentConfig = SCHEDULE_CONFIG[type] || SCHEDULE_CONFIG.once;
	  ALL_ROWS.forEach(rowName => {
	    const row = babelHelpers.classPrivateFieldLooseBase(this, _getRow)[_getRow](rowName);
	    if (row) {
	      if (currentConfig.rows.includes(rowName)) {
	        main_core.Dom.show(row);
	      } else {
	        main_core.Dom.hide(row);
	      }
	    }
	  });
	  ALL_FIELDS.forEach(fieldName => {
	    const field = babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField](fieldName);
	    if (field) {
	      const shouldEnable = currentConfig.fields.includes(fieldName);
	      field.disabled = !shouldEnable;
	      if (!shouldEnable) {
	        if (fieldName === 'WeekDays') {
	          babelHelpers.classPrivateFieldLooseBase(this, _clearWeekDays)[_clearWeekDays]();
	        } else {
	          field.value = '';
	        }
	      }
	    }
	  });
	}
	function _getField2(name) {
	  var _babelHelpers$classPr3, _babelHelpers$classPr4, _babelHelpers$classPr5, _babelHelpers$classPr6;
	  if (name === 'RunAt' && babelHelpers.classPrivateFieldLooseBase(this, _runAtInput)[_runAtInput]) {
	    return babelHelpers.classPrivateFieldLooseBase(this, _runAtInput)[_runAtInput];
	  }
	  const safeName = main_core.Text.encode(name);
	  return ((_babelHelpers$classPr3 = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form]) == null ? void 0 : _babelHelpers$classPr3[`id_${name}`]) || ((_babelHelpers$classPr4 = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form]) == null ? void 0 : (_babelHelpers$classPr5 = _babelHelpers$classPr4.elements) == null ? void 0 : _babelHelpers$classPr5[name]) || ((_babelHelpers$classPr6 = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form]) == null ? void 0 : _babelHelpers$classPr6.querySelector(`[name="${safeName}"]`));
	}
	function _getFieldSettings2(name) {
	  var _babelHelpers$classPr7, _field$property;
	  const field = (_babelHelpers$classPr7 = babelHelpers.classPrivateFieldLooseBase(this, _activityFields)[_activityFields]) == null ? void 0 : _babelHelpers$classPr7[name];
	  return main_core.Type.isPlainObject(field == null ? void 0 : (_field$property = field.property) == null ? void 0 : _field$property.Settings) ? field.property.Settings : {};
	}
	function _getRow2(name) {
	  var _babelHelpers$classPr8;
	  const safeName = main_core.Text.encode(name);
	  return (_babelHelpers$classPr8 = babelHelpers.classPrivateFieldLooseBase(this, _form)[_form]) == null ? void 0 : _babelHelpers$classPr8.querySelector(`#row_${safeName}`);
	}
	function _clearWeekDays2() {
	  const weekField = babelHelpers.classPrivateFieldLooseBase(this, _getField)[_getField]('WeekDays');
	  if (!weekField) {
	    return;
	  }
	  weekField.disabled = true;
	  if (!weekField.options) {
	    weekField.value = '';
	    return;
	  }
	  for (const option of weekField.options) {
	    option.selected = false;
	  }
	}

	exports.ScheduledTriggerRenderer = ScheduledTriggerRenderer;

}((this.window = this.window || {}),BX));
//# sourceMappingURL=renderer.js.map
