/* eslint-disable */
this.BX = this.BX || {};
this.BX.Sign = this.BX.Sign || {};
(function (exports,main_core,main_core_events,main_date,sign_v2_api) {
	'use strict';

	let _ = t => t,
	  _t,
	  _t2;
	var _api = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("api");
	var _documentUids = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("documentUids");
	var _documentDateField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("documentDateField");
	var _selectedDate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("selectedDate");
	var _getDateField = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("getDateField");
	var _saveSelectedDate = /*#__PURE__*/babelHelpers.classPrivateFieldLooseKey("saveSelectedDate");
	class DatetimeLimitSelector extends main_core_events.EventEmitter {
	  constructor(_date = new Date()) {
	    super();
	    Object.defineProperty(this, _saveSelectedDate, {
	      value: _saveSelectedDate2
	    });
	    Object.defineProperty(this, _getDateField, {
	      value: _getDateField2
	    });
	    Object.defineProperty(this, _api, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _documentUids, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _documentDateField, {
	      writable: true,
	      value: void 0
	    });
	    Object.defineProperty(this, _selectedDate, {
	      writable: true,
	      value: null
	    });
	    this.setEventNamespace('BX.Sign.V2.DatetimeLimitSelector');
	    babelHelpers.classPrivateFieldLooseBase(this, _documentUids)[_documentUids] = [];
	    babelHelpers.classPrivateFieldLooseBase(this, _api)[_api] = new sign_v2_api.Api();
	    babelHelpers.classPrivateFieldLooseBase(this, _documentDateField)[_documentDateField] = babelHelpers.classPrivateFieldLooseBase(this, _getDateField)[_getDateField]();
	    this.setDate(_date);
	  }
	  getLayout() {
	    return main_core.Tag.render(_t || (_t = _`
			<div class="sign-datetime-limit-selector">
				<span class="sign-datetime-limit-selector__label">
					${0}
				</span>
				${0}
			</div>
		`), main_core.Loc.getMessage('SIGN_BLANK_DATETIME_SELECTOR_LABEL'), babelHelpers.classPrivateFieldLooseBase(this, _documentDateField)[_documentDateField]);
	  }
	  setDocumentUids(uids) {
	    babelHelpers.classPrivateFieldLooseBase(this, _documentUids)[_documentUids] = uids;
	  }
	  getSelectedDate() {
	    return babelHelpers.classPrivateFieldLooseBase(this, _selectedDate)[_selectedDate];
	  }
	  setDate(date) {
	    babelHelpers.classPrivateFieldLooseBase(this, _selectedDate)[_selectedDate] = date;
	    const dateFormatted = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('MEDIUM_DATE_FORMAT'), date);
	    const timeFormatted = main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'), date);
	    const formattedDate = main_core.Loc.getMessage('SIGN_BLANK_DATETIME_SELECTOR_DATE', {
	      '#MEDIUM_DATE#': dateFormatted,
	      '#SHORT_TIME#': timeFormatted
	    });
	    const dateTextNode = babelHelpers.classPrivateFieldLooseBase(this, _documentDateField)[_documentDateField].firstElementChild;
	    dateTextNode.textContent = formattedDate;
	  }
	  isValid() {
	    return !main_core.Dom.hasClass(babelHelpers.classPrivateFieldLooseBase(this, _documentDateField)[_documentDateField], '--invalid');
	  }
	}
	function _getDateField2() {
	  return main_core.Tag.render(_t2 || (_t2 = _`
			<div
				class="sign-datetime-limit-selector_field"
				onclick="${0}"
			>
				<span class="sign-datetime-limit-selector_field-text"></span>
			</div>
		`), () => {
	    BX.calendar({
	      node: babelHelpers.classPrivateFieldLooseBase(this, _documentDateField)[_documentDateField],
	      field: babelHelpers.classPrivateFieldLooseBase(this, _documentDateField)[_documentDateField],
	      currentTime: babelHelpers.classPrivateFieldLooseBase(this, _selectedDate)[_selectedDate].getTime() / 1000,
	      value: main_date.DateTimeFormat.format(main_date.DateTimeFormat.getFormat('FORMAT_DATETIME'), babelHelpers.classPrivateFieldLooseBase(this, _selectedDate)[_selectedDate].getTime() / 1000),
	      bTime: true,
	      bHideTime: false,
	      callback: date => {
	        this.emit('beforeDateModify');
	        babelHelpers.classPrivateFieldLooseBase(this, _saveSelectedDate)[_saveSelectedDate](date).then(() => {
	          main_core.Dom.removeClass(babelHelpers.classPrivateFieldLooseBase(this, _documentDateField)[_documentDateField], '--invalid');
	          this.emit('afterDateModify', new main_core.Event.BaseEvent({
	            data: {
	              isValid: true
	            }
	          }));
	        }, () => {
	          main_core.Dom.addClass(babelHelpers.classPrivateFieldLooseBase(this, _documentDateField)[_documentDateField], '--invalid');
	          this.emit('afterDateModify', new main_core.Event.BaseEvent({
	            data: {
	              isValid: false
	            }
	          }));
	        });
	        return true;
	      },
	      callback_after: date => {
	        this.setDate(date);
	      }
	    });
	  });
	}
	function _saveSelectedDate2(datetime) {
	  const timestamp = main_date.Timezone.UserTime.toUTCTimestamp(datetime);
	  return Promise.all(babelHelpers.classPrivateFieldLooseBase(this, _documentUids)[_documentUids].map(uid => babelHelpers.classPrivateFieldLooseBase(this, _api)[_api].modifyDateSignUntil(uid, timestamp)));
	}

	exports.DatetimeLimitSelector = DatetimeLimitSelector;

}((this.BX.Sign.V2 = this.BX.Sign.V2 || {}),BX,BX.Event,BX.Main,BX.Sign.V2));
//# sourceMappingURL=datetime-limit-selector.bundle.js.map
