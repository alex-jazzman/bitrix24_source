/* eslint-disable */
this.BX = this.BX || {};
this.BX.Crm = this.BX.Crm || {};
(function (exports, main_core, main_date) {
	'use strict';

	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
	function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _timeFormat = /*#__PURE__*/new WeakMap();
	var _dateFormat = /*#__PURE__*/new WeakMap();
	var _shortDateFormat = /*#__PURE__*/new WeakMap();
	var _longDateFormat = /*#__PURE__*/new WeakMap();
	var _mediumDateFormat = /*#__PURE__*/new WeakMap();
	var _datetime = /*#__PURE__*/new WeakMap();
	var _DatetimeConverter_brand = /*#__PURE__*/new WeakSet();
	let DatetimeConverter = /*#__PURE__*/function () {
		function DatetimeConverter(_datetime2) {
			babelHelpers.classCallCheck(this, DatetimeConverter);
			_classPrivateMethodInitSpec(this, _DatetimeConverter_brand);
			_classPrivateFieldInitSpec(this, _timeFormat, void 0);
			_classPrivateFieldInitSpec(this, _dateFormat, void 0);
			_classPrivateFieldInitSpec(this, _shortDateFormat, void 0);
			_classPrivateFieldInitSpec(this, _longDateFormat, void 0);
			_classPrivateFieldInitSpec(this, _mediumDateFormat, void 0);
			_classPrivateFieldInitSpec(this, _datetime, null);
			_classPrivateFieldSet(_timeFormat, this, main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT'));
			_classPrivateFieldSet(_dateFormat, this, main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT'));
			_classPrivateFieldSet(_shortDateFormat, this, main_date.DateTimeFormat.getFormat('DAY_SHORT_MONTH_FORMAT'));
			_classPrivateFieldSet(_longDateFormat, this, main_date.DateTimeFormat.getFormat('LONG_DATE_FORMAT'));
			_classPrivateFieldSet(_mediumDateFormat, this, main_date.DateTimeFormat.getFormat('MEDIUM_DATE_FORMAT'));
			_classPrivateFieldSet(_datetime, this, _datetime2);
		}
		return babelHelpers.createClass(DatetimeConverter, [{
			key: "getValue",
			value: function getValue() {
				return _classPrivateFieldGet(_datetime, this);
			}
		}, {
			key: "toUserTime",
			value: function toUserTime() {
				const cache = new main_core.Cache.MemoryCache();
				const timezone = cache.remember(`crm.timeline.tools.userTimezone`, () => {
					return main_core.Extension.getSettings('crm.timeline.tools').get('userTimezone');
				});
				if (timezone) {
					const delta = _assertClassBrand(_DatetimeConverter_brand, this, _getTimezoneOffset).call(this, _classPrivateFieldGet(_datetime, this), timezone) - _assertClassBrand(_DatetimeConverter_brand, this, _getTimezoneOffset).call(this, new Date(), timezone);
					if (delta) {
						_classPrivateFieldGet(_datetime, this).setSeconds(_classPrivateFieldGet(_datetime, this).getSeconds() + delta);
					}
				}
				_classPrivateFieldSet(_datetime, this, main_date.Timezone.ServerTime.toUserDate(_classPrivateFieldGet(_datetime, this)));
				return this;
			}
		}, {
			key: "toDatetimeString",
			value: function toDatetimeString(options = {}) {
				// eslint-disable-next-line no-param-reassign
				options = options || {};
				const now = new Date();
				const withDayOfWeek = Boolean(options.withDayOfWeek);
				const withFullMonth = Boolean(options.withFullMonth ?? true);
				const delimiter = options.delimiter || ' ';
				const showYear = _assertClassBrand(_DatetimeConverter_brand, this, _isShowYear).call(this);
				return main_date.DateTimeFormat.format([['today', `today${delimiter}${_classPrivateFieldGet(_timeFormat, this)}`], ['tommorow', `tommorow${delimiter}${_classPrivateFieldGet(_timeFormat, this)}`], ['yesterday', `yesterday${delimiter}${_classPrivateFieldGet(_timeFormat, this)}`], ['', (withDayOfWeek ? `D${delimiter}` : '') + _assertClassBrand(_DatetimeConverter_brand, this, _getDateFormat).call(this, withFullMonth, showYear) + delimiter + _classPrivateFieldGet(_timeFormat, this)]], _classPrivateFieldGet(_datetime, this), now).replaceAll('\\', '');
			}
		}, {
			key: "toTimeString",
			value: function toTimeString(now, utc) {
				return main_date.DateTimeFormat.format(_classPrivateFieldGet(_timeFormat, this), _classPrivateFieldGet(_datetime, this), now, utc).replaceAll('\\', '');
			}
		}, {
			key: "toDateString",
			value: function toDateString(options = {}) {
				const withFullMonth = Boolean(options.withFullMonth ?? true);
				const showYear = _assertClassBrand(_DatetimeConverter_brand, this, _isShowYear).call(this);
				return main_date.DateTimeFormat.format([['today', 'today'], ['tommorow', 'tommorow'], ['yesterday', 'yesterday'], ['', _assertClassBrand(_DatetimeConverter_brand, this, _getDateFormat).call(this, withFullMonth, showYear)]], _classPrivateFieldGet(_datetime, this)).replaceAll('\\', '');
			}
		}, {
			key: "toFormatString",
			value: function toFormatString(format, now, utc) {
				return main_date.DateTimeFormat.format(format, _classPrivateFieldGet(_datetime, this), now, utc).replaceAll('\\', '');
			}
		}], [{
			key: "createFromServerTimestamp",
			value:
			// date object which absolute time will be the same as if it was in server timezone

			/**
			 * @param timestamp Normal UTC timestamp, as it should be
			 */
			function createFromServerTimestamp(timestamp) {
				return new DatetimeConverter(main_date.Timezone.ServerTime.getDate(timestamp));
			}
		}, {
			key: "getSiteDateFormat",
			value: function getSiteDateFormat() {
				return main_date.DateTimeFormat.getFormat('FORMAT_DATE');
			}
		}, {
			key: "getSiteShortTimeFormat",
			value: function getSiteShortTimeFormat() {
				return main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			}
		}, {
			key: "getSiteDateTimeFormat",
			value: function getSiteDateTimeFormat(useShortTime = false) {
				return useShortTime ? `${DatetimeConverter.getSiteDateFormat()} ${DatetimeConverter.getSiteShortTimeFormat()}` : main_date.DateTimeFormat.getFormat('FORMAT_DATETIME');
			}
		}]);
	}();
	function _getDateFormat(withFullMonth = false, withYear = false) {
		if (withYear) {
			return withFullMonth ? _classPrivateFieldGet(_longDateFormat, this) : _classPrivateFieldGet(_mediumDateFormat, this);
		}
		return withFullMonth ? _classPrivateFieldGet(_dateFormat, this) : _classPrivateFieldGet(_shortDateFormat, this);
	}
	function _isShowYear() {
		return _classPrivateFieldGet(_datetime, this).getFullYear() !== main_date.Timezone.UserTime.getDate().getFullYear();
	}
	function _getTimezoneOffset(datetime, timezone) {
		const dateInTimezone = new Date(datetime.toLocaleString('en-US', {
			timeZone: timezone
		}));
		const offsetMs = dateInTimezone.getTime() - new Date(datetime.toLocaleString('en-US', {
			timeZone: 'UTC'
		})).getTime();
		return offsetMs / 1000;
	}

	exports.DatetimeConverter = DatetimeConverter;

})(this.BX.Crm.Timeline = this.BX.Crm.Timeline || {}, BX, BX.Main);
//# sourceMappingURL=tools.bundle.js.map
