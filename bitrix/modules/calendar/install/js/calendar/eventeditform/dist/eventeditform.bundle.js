/* eslint-disable */
this.BX = this.BX || {};
(function (exports, calendar_controls, calendar_entry, calendar_planner, calendar_roomsmanager, calendar_sectionmanager, calendar_util, main_core, main_date, main_core_events, ui_entitySelector) {
	'use strict';

	class SliderDateTimeControl extends calendar_controls.DateTimeControl {
		create() {
			this.DOM.dateTimeWrap = this.DOM.outerContent.querySelector(`#${this.UID}_datetime_container`);
			this.DOM.editor = this.DOM.outerContent.querySelector(`#${this.UID}_datetime_editor`);
			this.DOM.fromDate = this.DOM.outerContent.querySelector(`#${this.UID}_date_from`);
			this.DOM.toDate = this.DOM.outerContent.querySelector(`#${this.UID}_date_to`);
			this.DOM.fromTime = this.DOM.outerContent.querySelector(`#${this.UID}_time_from`);
			this.DOM.toTime = this.DOM.outerContent.querySelector(`#${this.UID}_time_to`);
			this.fromTimeControl = new calendar_controls.TimeSelector({
				input: this.DOM.fromTime,
				onChangeCallback: this.handleTimeFromChange.bind(this)
			});
			this.toTimeControl = new calendar_controls.TimeSelector({
				input: this.DOM.toTime,
				onChangeCallback: this.handleTimeToChange.bind(this)
			});
			this.DOM.fullDay = this.DOM.outerContent.querySelector(`#${this.UID}_date_full_day`);
			this.DOM.defTimezoneWrap = this.DOM.outerContent.querySelector(`#${this.UID}_timezone_default_wrap`);
			this.DOM.defTimezone = this.DOM.outerContent.querySelector(`#${this.UID}_timezone_default`);
			this.DOM.fromTz = this.DOM.outerContent.querySelector(`#${this.UID}_timezone_from`);
			this.DOM.toTz = this.DOM.outerContent.querySelector(`#${this.UID}_timezone_to`);
			this.DOM.tzButton = this.DOM.outerContent.querySelector(`#${this.UID}_timezone_btn`);
			this.DOM.tzOuterCont = this.DOM.outerContent.querySelector(`#${this.UID}_timezone_wrap`);
			this.DOM.tzCont = this.DOM.outerContent.querySelector(`#${this.UID}_timezone_inner_wrap`);
			this.DOM.outerContent.querySelector(`#${this.UID}_timezone_hint`).title = main_core.Loc.getMessage('EC_EVENT_TZ_HINT');
			this.DOM.outerContent.querySelector(`#${this.UID}_timezone_default_hint`).title = main_core.Loc.getMessage('EC_EVENT_TZ_DEF_HINT');
			this.prepareModel();
			this.bindEventHandlers();
			if (BX.isAmPmMode()) {
				this.DOM.fromTime.style.minWidth = '8em';
				this.DOM.toTime.style.minWidth = '8em';
			} else {
				this.DOM.fromTime.style.minWidth = '6em';
				this.DOM.toTime.style.minWidth = '6em';
			}
		}
		prepareModel() {
			main_core.Dom.adjust(this.DOM.fromDate, {
				props: {
					autocomplete: 'off'
				}
			});
			main_core.Dom.adjust(this.DOM.toDate, {
				props: {
					autocomplete: 'off'
				}
			});
			main_core.Dom.adjust(this.DOM.fromTime, {
				props: {
					autocomplete: 'off'
				}
			});
			main_core.Dom.adjust(this.DOM.toTime, {
				props: {
					autocomplete: 'off'
				}
			});
		}
		getReadonlyDateForFormatting(date, utc) {
			return utc && main_core.Type.isDate(date) ? this.createDateFromUtc(date) : date;
		}
		setReadonly(timezoneHint) {
			const value = this.getValue();
			let result = '';
			const dateFrom = calendar_util.Util.formatDateUsable(this.getReadonlyDateForFormatting(value.from, value.utc), true, true);
			const dateTo = calendar_util.Util.formatDateUsable(this.getReadonlyDateForFormatting(value.to, value.utc), true, true);
			const timeFrom = this.DOM.fromTime.value;
			const timeTo = this.DOM.toTime.value;
			result += `${dateFrom}, `;
			if (value.fullDay) {
				if (dateFrom === dateTo) {
					result += main_core.Loc.getMessage('EC_ALL_DAY');
				} else {
					result += ' - ';
				}
			} else {
				result += `${timeFrom} - ${timeTo}`;
			}
			if (!value.fullDay && dateFrom !== dateTo) {
				result += `, ${dateTo}`;
			}
			let timezoneIcon = '';
			if (main_core.Type.isStringFilled(timezoneHint)) {
				timezoneIcon = main_core.Tag.render`
				<div class="calendar-date-selector-readonly-timezone" title="${timezoneHint}">
					<div class="calendar-date-selector-readonly-timezone-icon"></div>
				</div>
			`;
			}
			main_core.Dom.style(this.DOM.editor, 'display', 'none');
			const readonlyElement = main_core.Tag.render`
			<div class="calendar-options-item-column-right">
				<div class="calendar-field calendar-date-selector-readonly">
					${result}
					${timezoneIcon}
				</div>
			</div>
		`;
			main_core.Dom.append(readonlyElement, this.DOM.dateTimeWrap);
		}
	}

	const TimezoneProjectionSource = Object.freeze({
		compactCanonical: 'compact-canonical',
		entryDateFieldsProjected: 'entry-date-fields-projected',
		entryStringCanonical: 'entry-string-canonical'
	});
	const sourceModes = Object.values(TimezoneProjectionSource);
	const copyDate = date => {
		return main_core.Type.isDate(date) ? new Date(date.getTime()) : null;
	};
	const getUtcWallClockTimestamp = date => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
	const getUtcWallClockOffset = (timeZone, utcContainer) => {
		const wallClockUtcTs = getUtcWallClockTimestamp(utcContainer);
		const offset = calendar_util.Util.getTimeZoneOffsetForInstant(timeZone, new Date(wallClockUtcTs));
		const adjusted = calendar_util.Util.getTimeZoneOffsetForInstant(timeZone, new Date(wallClockUtcTs + offset * 60000));
		if (adjusted === offset) {
			return offset;
		}
		const confirmed = calendar_util.Util.getTimeZoneOffsetForInstant(timeZone, new Date(wallClockUtcTs + adjusted * 60000));
		if (confirmed === adjusted) {
			return adjusted;
		}
		return offset;
	};

	// A "UTC container" stores the wall-clock in the Date's UTC fields, so a wall-clock inside the
	// runner system zone's spring-forward gap survives (a local Date would normalize it forward).
	const toUtcWallClock = date => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));

	// Inverse of toUtcWallClock: materialize a UTC container's wall-clock as a local Date for consumers
	// that read local getters (planner, location preview).
	const utcContainerToLocal = utcContainer => new Date(utcContainer.getUTCFullYear(), utcContainer.getUTCMonth(), utcContainer.getUTCDate(), utcContainer.getUTCHours(), utcContainer.getUTCMinutes(), utcContainer.getUTCSeconds());

	// Express an absolute instant (ms since epoch) as the wall-clock in timeZone, stored gap-safe in a
	// UTC container. Read the result via getUTC*() or formatX(..., true).
	const instantToUtcContainer = (instant, timeZone) => {
		if (!main_core.Type.isStringFilled(timeZone)) {
			return new Date(instant);
		}
		const offsetMinutes = calendar_util.Util.getTimeZoneOffsetForInstant(timeZone, new Date(instant));
		return new Date(instant - offsetMinutes * 60000);
	};
	const getWallClockInstant = (date, timeZone, utc = false) => {
		if (!utc) {
			return calendar_util.Util.getWallClockInstant(date, timeZone);
		}
		const wallClockUtcTs = getUtcWallClockTimestamp(date);
		if (!main_core.Type.isStringFilled(timeZone)) {
			return wallClockUtcTs;
		}
		return wallClockUtcTs + getUtcWallClockOffset(timeZone, date) * 60000;
	};

	// Re-express a boundary wall-clock (read in sourceTimezone) as the wall-clock in targetTimezone that
	// denotes the same absolute instant, returned as a gap-safe UTC container. DST-safe (offsets resolved
	// at the true instant); a passthrough (as a UTC container) when a zone is missing or the zones match.
	const expressWallClockInTimezone = (boundary, sourceTimezone, targetTimezone, sourceUtc = false) => {
		if (!main_core.Type.isDate(boundary)) {
			return null;
		}
		if (!main_core.Type.isStringFilled(sourceTimezone) || !main_core.Type.isStringFilled(targetTimezone) || sourceTimezone === targetTimezone) {
			return sourceUtc ? new Date(boundary.getTime()) : toUtcWallClock(boundary);
		}
		return instantToUtcContainer(getWallClockInstant(boundary, sourceTimezone, sourceUtc), targetTimezone);
	};

	// Project a canonical event-zone wall-clock into the user zone through the absolute instant. The
	// stored per-boundary instant is preferred (fold-correct in the ambiguous autumn hour); the fallback
	// resolves the wall-clock in the event zone for rows that carry no instant (recurrence, all-day, legacy).
	const projectCanonicalBoundary = (wallClock, eventTimezone, userTimezone, storedInstant) => {
		const instant = Number.isFinite(storedInstant) ? storedInstant : calendar_util.Util.getWallClockInstant(wallClock, eventTimezone);
		return instantToUtcContainer(instant, userTimezone);
	};
	const createTimezoneProjection = ({
		from,
		to,
		fullDay = false,
		sourceMode,
		eventTimezoneFrom,
		eventTimezoneTo,
		userTimezone,
		fromInstant = null,
		toInstant = null
	}) => {
		const fromCopy = copyDate(from);
		const toCopy = copyDate(to);
		const projection = {
			from: fromCopy,
			to: toCopy,
			fromUtc: null,
			toUtc: null,
			fullDay: fullDay === true,
			displayTimezone: main_core.Type.isStringFilled(userTimezone) ? userTimezone : '',
			active: false,
			reason: null
		};
		if (!fromCopy || !toCopy) {
			projection.reason = 'incomplete-date-range';
			return projection;
		}
		if (!sourceModes.includes(sourceMode)) {
			projection.reason = 'unknown-source-mode';
			return projection;
		}
		if (!projection.displayTimezone) {
			projection.reason = 'missing-user-timezone';
			return projection;
		}
		if (projection.fullDay) {
			projection.fromUtc = toUtcWallClock(fromCopy);
			projection.toUtc = toUtcWallClock(toCopy);
			projection.active = true;
			projection.reason = 'full-day';
			return projection;
		}
		const canProjectFrom = main_core.Type.isStringFilled(eventTimezoneFrom);
		const canProjectTo = main_core.Type.isStringFilled(eventTimezoneTo);
		if (!canProjectFrom || !canProjectTo) {
			projection.reason = 'missing-event-timezone';
			return projection;
		}
		if (sourceMode === TimezoneProjectionSource.entryDateFieldsProjected) {
			// Entry date fields already carry the user-zone wall-clock; only add its UTC-container view.
			projection.fromUtc = toUtcWallClock(fromCopy);
			projection.toUtc = toUtcWallClock(toCopy);
			projection.active = true;
			projection.reason = 'already-projected';
			return projection;
		}
		if (userTimezone === eventTimezoneFrom && userTimezone === eventTimezoneTo) {
			// The event is already shown in the user's own zone: no projection is needed.
			projection.reason = 'display-zone-matches-event';
			return projection;
		}
		projection.fromUtc = projectCanonicalBoundary(fromCopy, eventTimezoneFrom, userTimezone, fromInstant);
		projection.toUtc = projectCanonicalBoundary(toCopy, eventTimezoneTo, userTimezone, toInstant);
		projection.from = utcContainerToLocal(projection.fromUtc);
		projection.to = utcContainerToLocal(projection.toUtc);
		projection.active = true;
		projection.reason = 'projected';
		return projection;
	};

	class EventEditForm {
		DOM = {};
		uid = null;
		sliderId = 'calendar:edit-entry-slider';
		zIndex = 3100;
		denyClose = false;
		formType = 'slider_main';
		STATE = {
			READY: 1,
			REQUEST: 2,
			ERROR: 3
		};
		sections = [];
		sectionIndex = {};
		trackingUsersList = [];
		userSettings = {};
		prevUserList = [];
		loadedAccessibilityData = {};
		plannerLimitState = null;
		plannerLimitHint = null;
		plannerDataRequestId = 0;
		plannerDataContext = null;
		destroyed = false;
		eventOptions = {};
		constructor(options = {}) {
			this.name = options.name || 'eventeditform';
			this.type = options.type || 'user';
			this.isLocationCalendar = options.isLocationCalendar || false;
			this.locationAccess = options.locationAccess || false;
			this.isProjectFeatureEnabled = calendar_util.Util.isProjectFeatureEnabled() || false;
			this.locationCapacity = options.locationCapacity || 0;
			this.roomsManager = options.roomsManager || null;
			this.userId = options.userId || parseInt(main_core.Loc.getMessage('USER_ID'));
			this.ownerId = options.ownerId;
			this.entryId = parseInt(options.entryId) || null;
			this.entry = options.entry || null;
			this.eventOptions = this.entry?.data?.OPTIONS || {};
			this.formDataValue = options.formDataValue || {};
			this.timezoneOffset = options.timezoneOffset ?? null;
			this.explicitTimezoneIntent = false;
			this.fromTimezoneChanged = false;
			this.toTimezoneChanged = false;
			this.emitter = new main_core_events.EventEmitter();
			this.emitter.setEventNamespace('BX.Calendar.EventEditForm');
			this.BX = calendar_util.Util.getBX();
			this.isCollabUser = options.calendarContext?.isCollabUser || false;
			this.isNewProjectsOn = options.calendarContext?.isNewProjectsOn || false;
			this.analyticsChatId = options.createChatId || null;
			this.analyticsSubSection = options.analyticsSubSection || this.getFormAnalyticsContext();
			this.eventType = options.formDataValue?.eventType || options.entry?.data?.EVENT_TYPE || null;
			if (this.isCollabUser) {
				calendar_util.Util.setCalendarContext(options.calendarContext);
			} else {
				this.context = calendar_util.Util.getCalendarContext() ?? options.calendarContext;
				if (!calendar_util.Util.getCalendarContext()) {
					calendar_util.Util.setCalendarContext(this.context);
				}
			}
			this.isOpenEvent = (this.entry?.data.CAL_TYPE || this.type) === 'open_event';
			// TODO: remove this check, planner enabled always
			this.plannerEnabled = true;
			this.sectionSelectorEnabled = !this.isOpenEvent;
			this.attendeesControlEnabled = !this.isOpenEvent;
			this.formSettings = {
				pinnedFields: {}
			};
			if (!this.ownerId && this.type === 'user') {
				this.ownerId = this.userId;
			}
			if (main_core.Type.isDate(options.entryDateFrom) && !this.formDataValue.from) {
				this.formDataValue.from = options.entryDateFrom;
				this.formDataValue.to = new Date(options.entryDateFrom.getTime() + 3600);
			}
			this.handoffIntent = main_core.Type.isDate(this.formDataValue.from) && main_core.Type.isDate(this.formDataValue.to);
			this.participantsEntityList = main_core.Type.isArray(options.participantsEntityList) ? options.participantsEntityList : [];
			this.participantsSelectorEntityList = main_core.Type.isArray(options.participantsSelectorEntityList) ? options.participantsSelectorEntityList : [];
			if (options.entryName && !this.entryId) {
				this.formDataValue.name = options.entryName;
			}
			if (options.entryDescription && !this.entryId) {
				this.formDataValue.description = options.entryDescription;
			}
			if (options.jumpToControl) {
				this.jumpToControl = options.jumpToControl;
			}
			if (this.plannerEnabled) {
				const refreshPlanner = main_core.Runtime.debounce(this.refreshPlannerState, 100, this);
				this.refreshPlanner = () => {
					this.invalidatePlannerData();
					refreshPlanner();
				};
			}
			this.state = this.STATE.READY;
			this.doShowConfirmPopup = true;
			this.sliderOnClose = this.hideWithConfirm.bind(this);
			this.handlePullBind = this.handlePull.bind(this);
			this.keyHandlerBind = this.keyHandler.bind(this);
			this.handlePlannerLimitStateChangeBind = this.handlePlannerLimitStateChange.bind(this);
			this.emitter.subscribe('onPlannerLimitStateChange', this.handlePlannerLimitStateChangeBind);
			this.lastUsedSaveOptions = {};
			this.timezoneHint = '';
			this.isAvailable = true;
		}
		getFormAnalyticsContext() {
			if (this.analyticsChatId) {
				return 'chat_textarea';
			}
			if (this.type === 'group') {
				return 'calendar_collab';
			}
			return 'calendar_personal';
		}
		initInSlider(slider, promiseResolve) {
			this.sliderId = slider.getUrl();
			this.BX.addCustomEvent(slider, 'SidePanel.Slider:onLoad', this.onLoadSlider.bind(this));
			this.BX.addCustomEvent(slider, 'SidePanel.Slider:onClose', this.sliderOnClose);
			this.BX.addCustomEvent(slider, 'SidePanel.Slider:onBeforeCloseComplete', this.destroy.bind(this));
			this.setCurrentEntry(this.entry || null);
			this.createContent(slider).then(html => {
				if (main_core.Type.isFunction(promiseResolve)) {
					promiseResolve(html);
				}
			});
			this.opened = true;
			this.bindEventHandlers();
		}
		canEdit() {
			if (main_core.Type.isBoolean(this.entry.permissions?.edit)) {
				return this.entry.permissions.edit;
			}
			if (this.entry.isMeeting() && this.entry.sectionId !== this.getCurrentSectionId()) {
				return false;
			}
			if (this.entry.isResourcebooking()) {
				return false;
			}
			return new calendar_sectionmanager.CalendarSection(this.getCurrentSection()).canDo('edit');
		}
		show(params = {}) {
			this.setCurrentEntry(params.entry);
			if (params.formType) {
				this.formType = params.formType;
			}
			this.BX.SidePanel.Instance.open(this.sliderId, {
				contentCallback: this.createContent.bind(this),
				label: {
					text: main_core.Loc.getMessage('CALENDAR_EVENT'),
					bgColor: '#55D0E0'
				},
				events: {
					onClose: this.sliderOnClose,
					onCloseComplete: this.destroy.bind(this),
					onLoad: this.onLoadSlider.bind(this)
				}
			});
			this.opened = true;
			this.bindEventHandlers();
		}
		isOpened() {
			return this.opened;
		}
		bindEventHandlers() {
			main_core.Event.bind(document, 'keydown', this.keyHandlerBind);
			main_core_events.EventEmitter.subscribe('onPullEvent-calendar', this.handlePullBind);

			// region 'protection from closing slider by accident'
			this.mouseUpNodeCheck = null;
			main_core.Event.bind(document, 'mousedown', e => {
				this.mousedownTarget = e.target || e.srcElement;
			});
			main_core.Event.bind(document, 'mouseup', e => {
				const target = e.target || e.srcElement;
				if (this.mousedownTarget !== target) {
					this.mouseUpNodeCheck = false;
				}
				setTimeout(() => {
					this.mouseUpNodeCheck = null;
				}, 0);
			});
			// endregion

			main_core_events.EventEmitter.subscribe('Calendar.LocationControl.onValueChange', () => {
				if (this.locationBusyAlert) {
					main_core.Dom.remove(this.locationBusyAlert);
					this.locationBusyAlert = null;
				}
			});
			this.BX.addCustomEvent(window, 'onCalendarControlChildPopupShown', this.BX.proxy(this.denySliderClose, this));
			this.BX.addCustomEvent(window, 'onCalendarControlChildPopupClosed', this.BX.proxy(this.allowSliderClose, this));
		}
		onLoadSlider(event) {
			this.slider = event.getSlider();
			this.DOM.content = this.slider.layout.content;
			this.sliderId = this.slider.getUrl();
			if (!this.isAvailable) {
				return;
			}
			if (this.notLoaded) {
				BX.SidePanel.Instance.close();
				location.reload();
				return;
			}

			// Used to execute javasctipt and attach CSS from ajax responce
			this.BX.html(this.slider.layout.content, this.slider.getData().get('sliderContent'));
			this.initControls(this.uid);
			this.setFormValues();
			this.captureCanonicalFormDataSnapshot();
			if (main_core.Type.isStringFilled(this.jumpToControl)) {
				if (this.jumpToControl === 'userSelector') {
					const attendeesSelectorWrap = this.DOM.content.querySelector(`#${this.uid}_attendees_selector`);
					main_core.Dom.style(attendeesSelectorWrap, 'transition', '300ms background ease');
					setTimeout(() => this.highlightField(attendeesSelectorWrap), 900);
				}
				if (this.jumpToControl === 'location') {
					const fieldWrap = document.querySelector(`[data-bx-block-placeholer=${this.jumpToControl}]`);
					main_core.Dom.style(fieldWrap, 'transition', '300ms background ease');
					setTimeout(() => this.highlightField(fieldWrap), 900);
				}
			}
			main_core.Event.bind(this.DOM.content, 'wheel', () => this.highlightFieldScrollAnimation?.stop());
		}
		captureCanonicalFormDataSnapshot() {
			const fieldNames = ['date_from', 'date_to', 'time_from', 'time_to', 'tz_from', 'tz_to', 'skip_time'];
			const snapshot = new FormData(this.DOM.form);
			const canonicalDateTime = this.createCanonicalDateTimeFormData();
			this.setFormDataValues(snapshot, canonicalDateTime, fieldNames);
			this.canonicalSnapshot = snapshot;
		}
		createCanonicalDateTimeFormData() {
			const data = new FormData();
			const entryData = this.rawEntryData || this.entry?.data || {};
			const sourceMode = this.getTimezoneProjectionSourceMode(entryData);
			const useStoredWallClock = this.canUseStoredWallClockForProjection(sourceMode);
			const getDate = (value, fallback) => {
				if (main_core.Type.isDate(value)) {
					return value;
				}
				if (main_core.Type.isString(value)) {
					return calendar_util.Util.parseDate(value, useStoredWallClock);
				}
				return main_core.Type.isDate(fallback) ? fallback : null;
			};
			const from = this.getCanonicalBoundaryForDateTimeFormData(entryData, sourceMode, 'DATE_FROM', 'dateFrom', this.entry?.from, this.formDataValue.from, getDate);
			const to = this.getCanonicalBoundaryForDateTimeFormData(entryData, sourceMode, 'DATE_TO', 'dateTo', this.entry?.to, this.formDataValue.to, getDate);
			const useUtc = useStoredWallClock;
			if (main_core.Type.isDate(from)) {
				data.set('date_from', calendar_util.Util.formatDate(from, useUtc));
				data.set('time_from', calendar_util.Util.formatTime(from, null, useUtc));
			}
			if (main_core.Type.isDate(to)) {
				data.set('date_to', calendar_util.Util.formatDate(to, useUtc));
				data.set('time_to', calendar_util.Util.formatTime(to, null, useUtc));
			}
			const fullDay = entryData.DT_SKIP_TIME === 'Y' || entryData.SKIP_TIME === 'Y' || entryData.SKIP_TIME === true || this.entry?.fullDay === true;
			let timezoneFrom = main_core.Type.isString(entryData.TZ_FROM) ? entryData.TZ_FROM : this.entry?.getTimezoneFrom?.();
			let timezoneTo = main_core.Type.isString(entryData.TZ_TO) ? entryData.TZ_TO : this.entry?.getTimezoneTo?.() || timezoneFrom;
			if (main_core.Type.isString(timezoneFrom)) {
				data.set('tz_from', timezoneFrom);
			}
			if (main_core.Type.isString(timezoneTo)) {
				data.set('tz_to', timezoneTo);
			}
			if (fullDay) {
				data.set('skip_time', 'Y');
			}
			return data;
		}
		getCanonicalBoundaryForDateTimeFormData(entryData, sourceMode, stringField, dateField, entryBoundary, handoffBoundary, getDate) {
			if (this.canUseStoredWallClockForProjection(sourceMode)) {
				return getDate(entryData[stringField], entryBoundary);
			}
			if (sourceMode === TimezoneProjectionSource.compactCanonical) {
				return handoffBoundary;
			}
			return main_core.Type.isDate(entryBoundary) ? entryBoundary : getDate(entryData[stringField] ?? entryData[dateField], null);
		}
		close() {
			if (!this.checkDenyClose()) {
				this.state = this.STATE.READY;
				this.BX.SidePanel.Instance.close();
			}
		}
		createCanonicalFormDataSnapshot() {
			const snapshot = new FormData();
			for (const [name, value] of this.canonicalSnapshot.entries()) {
				snapshot.append(name, value);
			}
			return snapshot;
		}
		setFormDataValues(data, source, fieldNames) {
			fieldNames.forEach(fieldName => {
				const values = source.getAll(fieldName);
				if (values.length === 0) {
					return;
				}
				data.set(fieldName, values.shift());
				values.forEach(value => data.append(fieldName, value));
			});
		}
		serializeDateTimeFormData(data, formDataChanges) {
			const fieldNames = ['date_from', 'date_to', 'time_from', 'time_to', 'tz_from', 'tz_to', 'skip_time'];
			const dateTimeIntent = formDataChanges.includes('date&time');
			if (!dateTimeIntent && !this.explicitTimezoneIntent) {
				this.setFormDataValues(data, this.createCanonicalFormDataSnapshot(), fieldNames);
				return;
			}
			const dateTime = this.dateTimeControl.getValue();
			if (this.explicitTimezoneIntent) {
				data.set('tz_from', this.getEffectiveTimezoneFrom(dateTime));
				data.set('tz_to', this.getEffectiveTimezoneTo(dateTime));
			} else {
				data.set('tz_from', this.initialTimezoneFrom || '');
				data.set('tz_to', this.initialTimezoneTo || '');
			}
			if (!this.timezoneProjection?.active || dateTime.fullDay) {
				return;
			}
			this.reverseProjectShownBoundaries(data, dateTime);
			data.set('skip_time', 'N');
		}

		// Reverses the shown boundaries back into their event zones for the save payload. Each boundary is
		// expressed from the display (user) zone into its own event zone through the absolute instant, the
		// same primitive the planner/location path uses forward. A boundary whose zone changed already
		// shows event-zone time, so its DOM value is kept; an unchanged, unmoved boundary keeps its
		// canonical event-zone wall-clock verbatim, so the ambiguous autumn fall-back hour is never
		// re-resolved to the wrong side (deriving the instant from the wall-clock alone cannot tell the two
		// occurrences apart). Formatting via a UTC container keeps a spring-forward wall-clock intact.
		reverseProjectShownBoundaries(data, dateTime) {
			const displayTimezone = this.initialDisplaySnapshot?.displayTimezone || this.getUserTimezone();
			const dateTimeUtc = dateTime.utc === true;
			const initialDateTimeUtc = this.initialDisplaySnapshot?.utc === true;
			let canonical = null;
			const getCanonical = () => {
				canonical ??= this.createCanonicalDateTimeFormData();
				return canonical;
			};
			const boundaries = [{
				zoneChanged: this.fromTimezoneChanged === true,
				shown: dateTime.from,
				initialShown: this.initialDisplaySnapshot?.from,
				eventTimezone: this.initialTimezoneFrom,
				dateField: 'date_from',
				timeField: 'time_from'
			}, {
				zoneChanged: this.toTimezoneChanged === true,
				shown: dateTime.to,
				initialShown: this.initialDisplaySnapshot?.to,
				eventTimezone: this.initialTimezoneTo,
				dateField: 'date_to',
				timeField: 'time_to'
			}];
			for (const boundary of boundaries) {
				if (boundary.zoneChanged) {
					// The shown wall-clock is already expressed in the new event zone: keep the DOM value.
					continue;
				}
				if (this.isSameWallClock(boundary.shown, boundary.initialShown, dateTimeUtc, initialDateTimeUtc)) {
					// Untouched boundary: emit the canonical event-zone wall-clock verbatim (fold-safe).
					const canonicalData = getCanonical();
					const date = canonicalData.get(boundary.dateField);
					const time = canonicalData.get(boundary.timeField);
					if (main_core.Type.isStringFilled(date)) {
						data.set(boundary.dateField, date);
					}
					if (main_core.Type.isStringFilled(time)) {
						data.set(boundary.timeField, time);
					}
					continue;
				}

				// Moved boundary: reverse its shown user-zone wall-clock into the event zone.
				const eventWallClock = expressWallClockInTimezone(boundary.shown, displayTimezone, boundary.eventTimezone, dateTimeUtc);
				if (main_core.Type.isDate(eventWallClock)) {
					data.set(boundary.dateField, calendar_util.Util.formatDate(eventWallClock, true));
					data.set(boundary.timeField, calendar_util.Util.formatTime(eventWallClock, null, true));
				}
			}
		}
		save(options = {}) {
			if (this.state === this.STATE.REQUEST || this.DOM.locationRepeatBusyErrorPopup) {
				return false;
			}
			options = main_core.Type.isPlainObject(options) ? options : {};
			const formDataChanges = this.getFormDataChanges();
			if (this.isEditForm() && formDataChanges.length === 0) {
				this.BX.SidePanel.Instance.close();
				return true;
			}
			if (!this.userSettings.sendFromEmail && this.hasExternalEmailUsers() && this.canEdit() && !options.emailConfirmDialogShown) {
				calendar_entry.EntryManager.showConfirmedEmailDialog({
					callback: params => {
						if (params.sendFromEmail) {
							this.userSettings.sendFromEmail = params.sendFromEmail;
						}
						options.emailConfirmDialogShown = true;
						this.save(options);
					}
				});
				return false;
			}
			if (this.entry.id && this.entry.isRecursive() && !options.confirmed && this.getFormDataChanges(['section']).length > 0) {
				calendar_entry.EntryManager.showConfirmEditDialog({
					callback: params => {
						options.recursionMode = this.entry.isFirstInstance() && params.recursionMode === 'next' ? 'all' : params.recursionMode;
						options.confirmed = true;
						this.lastUsedSaveOptions = options;
						this.save(options);
					},
					canEditOnlyThis: this.canEditOnlyThis()
				});
				return false;
			}
			if (this.entry.id && this.entry.isMeeting() && options.sendInvitesAgain === undefined && formDataChanges.includes('date&time') && this.entry.getAttendees().find(item => {
				return item.STATUS === 'N';
			})) {
				calendar_entry.EntryManager.showReInviteUsersDialog({
					callback: params => {
						options.sendInvitesAgain = params.sendInvitesAgain;
						this.lastUsedSaveOptions = options;
						this.save(options);
					}
				});
				return false;
			}
			if (this.entry.id && this.entry.isRecursive() && !options.confirmed && formDataChanges.includes('section')) {
				options.recursionMode = this.entry.isFirstInstance() ? 'all' : 'next';
			}
			main_core.Dom.addClass(this.DOM.saveBtn, this.BX.UI.Button.State.CLOCKING);
			main_core.Dom.addClass(this.DOM.closeBtn, this.BX.UI.Button.State.DISABLED);
			this.state = this.STATE.REQUEST;
			this.DOM.form.id.value = this.entry.id || 0;

			// Location
			this.DOM.form.location.value = this.locationSelector.getTextValue();
			if (this.editor) {
				this.editor.SaveContent();
			}
			const section = this.getCurrentSection();
			if (section && section.COLOR.toLowerCase() !== this.colorSelector.getValue().toLowerCase()) {
				// Color
				this.DOM.form.color.value = this.colorSelector.getValue();
			}
			if (options.recursionMode) {
				this.DOM.form.current_date_from.value = calendar_util.Util.formatDate(this.entry.from);
				this.DOM.form.rec_edit_mode.value = options.recursionMode;
			} else {
				this.DOM.form.current_date_from.value = null;
				this.DOM.form.rec_edit_mode.value = null;
			}
			if (options.sendInvitesAgain !== undefined) {
				this.DOM.form.appendChild(main_core.Tag.render`<input name="sendInvitesAgain" type="hidden" value="${options.sendInvitesAgain ? 'Y' : 'N'}">`);
			}
			if (!this.DOM.form.requestUid) {
				this.DOM.requestUid = this.DOM.form.appendChild(main_core.Tag.render`<input name="requestUid" type="hidden">`);
			}
			if (!this.DOM.form.meeting_host) {
				this.DOM.meeting_host = this.DOM.form.appendChild(main_core.Tag.render`<input type="hidden" name="meeting_host" value="${this.entry.data.MEETING_HOST || '0'}">`);
			}
			if (!this.DOM.form.chat_id) {
				this.DOM.chat_id = this.DOM.form.appendChild(main_core.Tag.render`<input type="hidden" name="chat_id" value="${this.entry.data.MEETING ? this.entry.data.MEETING.CHAT_ID : 0}">`);
			}
			this.DOM.requestUid.value = calendar_util.Util.registerRequestId();
			let attendeesEntityList;
			if (this.attendeesControlEnabled) {
				// Save attendees from userSelector
				attendeesEntityList = this.getUserSelectorEntityList();
				main_core.Dom.clean(this.DOM.userSelectorValueWarp);
				attendeesEntityList.forEach((entity, index) => {
					this.DOM.userSelectorValueWarp.appendChild(main_core.Tag.render`
				<input type="hidden" name="attendeesEntityList[${index}][entityId]" value="${entity.entityId}">
			`);
					this.DOM.userSelectorValueWarp.appendChild(main_core.Tag.render`
				<input type="hidden" name="attendeesEntityList[${index}][id]" value="${entity.id}">
			`);
				});
			}
			let checkCurrentUsersAccessibility = !this.entry.id || this.checkCurrentUsersAccessibility();
			if (!checkCurrentUsersAccessibility && formDataChanges.includes('codes')) {
				const previousAttendeesList = this.entry.getAttendeesEntityList();
				attendeesEntityList.forEach(entity => {
					if (!previousAttendeesList.find(item => {
						return entity.entityId === item.entityId && Number(entity.id) === Number(item.id);
					})) {
						if (entity.entityId === 'user') {
							this.DOM.userSelectorValueWarp.appendChild(main_core.Tag.render`
							<input type="hidden" name="newAttendeesList[]" value="${parseInt(entity.id)}">
						`);
						} else {
							checkCurrentUsersAccessibility = true;
						}
					}
				});
			}
			if (this.attendeesControlEnabled) {
				this.DOM.userSelectorValueWarp.appendChild(main_core.Tag.render`
				<input type="hidden" name="checkCurrentUsersAccessibility" value="${checkCurrentUsersAccessibility ? 'Y' : 'N'}">
			`);
			}
			if (this.isOpenEvent) {
				const selectedCategories = this.categoryTagSelector.getDialog().getSelectedItems();
				const selectedCategory = selectedCategories[0].id;
				this.DOM.form.appendChild(main_core.Tag.render`<input type="hidden" name="category" value="${selectedCategory}">`);
			}
			if (this.analyticsSubSection) {
				this.DOM.form.appendChild(main_core.Tag.render`<input type="hidden" name="analyticsSubSection" value="${this.analyticsSubSection}">`);
			}
			if (this.analyticsChatId) {
				this.DOM.form.appendChild(main_core.Tag.render`<input type="hidden" name="analyticsChatId" value="${this.analyticsChatId}">`);
			}
			if (this.eventType) {
				this.DOM.form.appendChild(main_core.Tag.render`<input type="hidden" name="event_type" value="${this.eventType}">`);
			}
			this.DOM.form.doCheckOccupancy.value = options.doCheckOccupancy || 'Y';
			const data = new FormData(this.DOM.form);
			const rruleType = this.DOM.content.querySelector(`#${this.uid}_rrule_type`);
			if (rruleType) {
				data.append('EVENT_RRULE[FREQ]', rruleType.dataset.value);
			}
			const accessibility = this.DOM.content.querySelector(`#${this.uid}_accessibility`);
			if (accessibility) {
				data.append('accessibility', accessibility.dataset.value);
			}
			if (this.DOM.form.tz_from) {
				data.set('tz_from', this.DOM.form.tz_from.dataset.value);
			}
			if (this.DOM.form.tz_to) {
				data.set('tz_to', this.DOM.form.tz_to.dataset.value);
			}
			this.serializeDateTimeFormData(data, formDataChanges);
			this.BX.ajax.runAction('calendar.api.calendarentryajax.editEntry', {
				data
			}).then(async response => {
				if (this.canEditOnlyThis() && formDataChanges.includes('color')) {
					const newChildEvent = response.data?.eventList?.find(event => event.DATE_FROM.includes(data.get('date_from')) && parseInt(event.OWNER_ID, 10) === parseInt(this.ownerId, 10));
					const colorEntryId = newChildEvent?.ID ?? this.entryId;
					await this.BX.ajax.runAction('calendar.api.calendarajax.updateColor', {
						data: {
							entryId: colorEntryId,
							color: this.colorSelector.getValue().toLowerCase()
						}
					});
				}
				if (this.isLocationCalendar) {
					this.roomsManager.unsetHiddenRoom(calendar_controls.Location.parseStringValue(this.DOM.form.location.value).room_id);
				}

				// unset section from hidden
				const section = this.getCurrentSection();
				if (section && this.context && this.context.sectionManager) {
					this.unsetHiddenSection(section, this.context.sectionManager);
				}
				this.state = this.STATE.READY;
				this.allowSliderClose();
				this.doShowConfirmPopup = false;
				this.close();
				main_core.Dom.removeClass(this.DOM.closeBtn, this.BX.UI.Button.State.DISABLED);
				main_core.Dom.removeClass(this.DOM.saveBtn, this.BX.UI.Button.State.CLOCKING);
				if (response.data.entryId) {
					if (this.entry.id) {
						calendar_entry.EntryManager.showEditEntryNotification(response.data.entryId);
					} else {
						calendar_entry.EntryManager.showNewEntryNotification(response.data.entryId);
					}
				}
				if (main_core.Type.isArray(response.data.eventList) && response.data.eventList.length > 0 && response.data.eventList[0].REMIND && response.data.eventList[0].REMIND.length > 0) {
					calendar_entry.EntryManager.setNewEntryReminders(response.data.eventList[0].DT_SKIP_TIME === 'Y' ? 'fullDay' : 'withTime', response.data.eventList[0].REMIND);
				}
				this.emitter.emit('onSave', new main_core_events.BaseEvent({
					data: {
						responseData: response.data,
						options
					}
				}));
				main_core_events.EventEmitter.emit('BX.Calendar:onEntrySave', new main_core_events.BaseEvent({
					data: {
						sliderId: this.sliderId,
						responseData: response.data,
						options
					}
				}));
			}, response => {
				main_core.Dom.removeClass(this.DOM.saveBtn, this.BX.UI.Button.State.CLOCKING);
				main_core.Dom.removeClass(this.DOM.closeBtn, this.BX.UI.Button.State.DISABLED);
				if (response.data && main_core.Type.isPlainObject(response.data.busyUsersList)) {
					this.handleBusyUsersError(response.data.busyUsersList);
					const errors = [];
					response.errors.forEach(error => {
						if (error.code !== 'edit_entry_user_busy') {
							errors.push(error);
						}
					});
					response.errors = errors;
				}
				if (response.errors && response.errors.length > 0) {
					this.showError(response.errors);
				}
				this.state = this.STATE.ERROR;
			});
			return true;
		}
		canEditOnlyThis() {
			const permissions = this.entry.permissions;
			if (!permissions) {
				return false;
			}
			return permissions.edit_attendees && permissions.edit_location && !permissions.edit;
		}
		handleBusyUsersError(busyUsers) {
			const users = [];
			const userIds = [];
			for (const id in busyUsers) {
				if (busyUsers.hasOwnProperty(id)) {
					users.push(busyUsers[id]);
					userIds.push(id);
				}
			}
			this.busyUsersDialog = new calendar_controls.BusyUsersDialog();
			this.busyUsersDialog.subscribe('onSaveWithout', () => {
				this.DOM.form.exclude_users.value = userIds.join(',');
				this.save();
			});
			this.busyUsersDialog.show({
				users
			});
		}
		hideWithConfirm(event) {
			if (!(event && event.getSlider && event.getSlider().getUrl() === this.sliderId)) {
				return;
			}
			if (!this.isAvailable) {
				this.BX.removeCustomEvent('SidePanel.Slider:onClose', this.sliderOnClose);
				return;
			}
			calendar_util.Util.closeAllPopups();
			if (this.checkDenyClose()) {
				event.denyAction();
				return;
			}
			if (this.needToShowConfirmPopup()) {
				event.denyAction();
				const message = this.isCreateForm() ? main_core.Loc.getMessage('EC_CLOSE_CREATE_FORM_CONFIRM_QUESTION') : main_core.Loc.getMessage('EC_CLOSE_EDIT_FORM_CONFIRM_QUESTION');
				calendar_util.Util.showConfirmPopup(this.hide.bind(this), message, {
					okCaption: main_core.Loc.getMessage('EC_CLOSE_EDIT_FORM_CONFIRM_OK'),
					minWidth: 350,
					maxWidth: 350
				});
			} else {
				this.BX.removeCustomEvent('SidePanel.Slider:onClose', this.sliderOnClose);
			}
		}
		hide() {
			this.doShowConfirmPopup = false;
			this.slider.close();
		}
		destroy(event) {
			if (event && event.getSlider() && event.getSlider().getUrl() === this.sliderId) {
				this.destroyed = true;
				this.plannerDataRequestId += 1;
				this.BX.onCustomEvent('OnCalendarPlannerDoUninstall', [{
					plannerId: this.plannerId
				}]);
				main_core.Event.unbind(document, 'keydown', this.keyHandlerBind);
				main_core_events.EventEmitter.unsubscribe('onPullEvent-calendar', this.handlePullBind);
				if (this.handlePlannerLimitStateChangeBind) {
					this.emitter.unsubscribe('onPlannerLimitStateChange', this.handlePlannerLimitStateChangeBind);
				}
				this.BX.SidePanel.Instance.destroy(this.sliderId);
				if (calendar_controls.Location) {
					calendar_controls.Location.setCurrentCapacity(0);
				}
				calendar_util.Util.closeAllPopups();
				this.plannerLimitHint?.destroy();
				this.plannerLimitHint = null;
				this.planner = null;
				this.opened = false;
				calendar_util.Util.clearPlannerWatches();
			}
		}
		createContent(slider) {
			const promise = new this.BX.Promise();
			let entry = this.getCurrentEntry();
			const instanceDateFrom = main_core.Type.isDate(entry?.from) ? new Date(entry.from.getTime()) : null;
			this.instanceSelectionSnapshot = {
				dateFrom: instanceDateFrom ? calendar_util.Util.formatDate(instanceDateFrom) : '',
				currentDateFrom: instanceDateFrom
			};
			this.BX.ajax.runAction('calendar.api.calendarajax.getEditEventSlider', {
				data: {
					event_id: this.entryId || entry.id,
					date_from: this.instanceSelectionSnapshot.dateFrom,
					form_type: this.formType,
					type: entry.data.CAL_TYPE ?? this.type,
					ownerId: entry.data.OWNER_ID ?? this.ownerId,
					entityList: this.participantsEntityList,
					timezoneOffset: this.timezoneOffset
				}
			}).then(response => {
				if (main_core.Type.isFunction(slider.isOpen) && slider.isOpen() || slider.isOpen === true) {
					const html = this.BX.util.trim(response.data.html);
					slider.getData().set('sliderContent', html);
					const params = response.data.additionalParams;
					this.setUserSettings(params.userSettings);
					this.rawEntryData = this.createRawEntryDataSnapshot(params.entry);
					this.updateEntryData(params.entry, {
						userSettings: this.userSettings,
						meetSection: params.meetSection
					});
					entry = this.getCurrentEntry();
					this.uid = params.uniqueId;
					this.editorId = params.editorId;
					this.formSettings = this.getSettings(params.formSettings || []);
					this.isCollabUser = params.isCollabUser;
					let attendeesEntityList = this.formDataValue.attendeesEntityList || params.attendeesEntityList || [];
					if (!entry.id && this.participantsEntityList.length > 0) {
						attendeesEntityList = this.participantsEntityList;
					}
					if (main_core.Type.isArray(attendeesEntityList)) {
						attendeesEntityList.forEach(item => {
							if (item.entityId === 'user' && params.userIndex[item.id]) {
								if (params.userIndex[item.id].EMAIL_USER) {
									item.entityType = 'email';
									item.title = params.userIndex[item.id].DISPLAY_NAME;
								} else if (params.userIndex[item.id].SHARING_USER) {
									item.entityType = 'sharing';
									item.title = params.userIndex[item.id].DISPLAY_NAME;
								} else {
									item.entityType = 'employee';
								}
							}
						});
					}
					this.setUserSelectorEntityList(attendeesEntityList);
					this.attendeesPreselectedItems = this.getUserSelectorEntityList().map(item => {
						return [item.entityId, item.id];
					});
					calendar_util.Util.setEventWithEmailGuestEnabled(params.eventWithEmailGuestEnabled);
					calendar_util.Util.setTeamsAsAttendeeEnabled(params.teamsAsAttendeeEnabled);
					calendar_util.Util.setTimezoneList(params.timezoneList);
					calendar_util.Util.setAbsenceAvailable(params.absenceAvailable);
					this.handleSections(params.sections, params.trackingUsersList);
					this.handleLocationData(params.locationFeatureEnabled, params.locationList, params.iblockMeetingRoomList);
					this.locationAccess = params.locationAccess;
					this.plannerFeatureEnabled = Boolean(params.plannerFeatureEnabled);
					this.isProjectFeatureEnabled = params.projectFeatureEnabled;
					if (this.planner && !this.plannerFeatureEnabled) {
						this.planner.lock();
					}
					if (!entry.id && !entry.sectionId) {
						this.setCurrentEntry();
					}
					if (this.userSettings.meetSection && this.type === 'user') {
						calendar_sectionmanager.SectionManager.setNewEntrySectionId(this.userSettings.meetSection);
					}
					if (this.isOpenEvent) {
						const categoryId = this.formDataValue?.category || this.eventOptions?.CATEGORY_ID;
						const preSelectedCategoryId = categoryId || params.defaultCategoryId;
						this.preSelectedCategory = preSelectedCategoryId ? ['event-category', preSelectedCategoryId] : null;
					}
					this.timezoneHint = params.timezoneHint;
					promise.fulfill(html);
				}
			}, response => {
				this.notLoaded = true;
				if (response.data && !main_core.Type.isNil(response.data.isAvailable) && !response.data.isAvailable) {
					this.isAvailable = false;
					const showHelperCallback = () => {
						top.BX.UI.InfoHelper.show('limit_office_calendar_off', {
							isLimit: true,
							limitAnalyticsLabels: {
								module: 'calendar',
								source: 'eventEditForm'
							}
						});
					};
					const sliderInstance = BX.SidePanel.Instance.getSlider(this.sliderId);
					if (sliderInstance) {
						this.BX.removeCustomEvent('SidePanel.Slider:onClose', this.sliderOnClose);
						sliderInstance.close(true, showHelperCallback);
					} else {
						showHelperCallback();
					}
				}
				const html = this.BX.util.trim('<div></div>');
				slider.getData().set('sliderContent', html);
				promise.fulfill(html);
			});
			return promise;
		}
		initControls(uid) {
			this.DOM.title = this.DOM.content.querySelector(`#${uid}_title`);
			this.DOM.formWrap = this.DOM.content.querySelector(`#${uid}_form_wrap`);
			this.DOM.form = this.DOM.content.querySelector(`#${uid}_form`);
			this.timezoneProjection = this.createTimezoneProjection();
			this.DOM.buttonsWrap = this.DOM.content.querySelector('.calendar-form-buttons-fixed');
			this.DOM.saveBtn = this.DOM.buttonsWrap.querySelector(`#${uid}_save`);
			this.DOM.closeBtn = this.DOM.buttonsWrap.querySelector(`#${uid}_close`);
			main_core.Event.bind(this.DOM.saveBtn, 'click', this.save.bind(this));
			main_core.Event.bind(this.DOM.closeBtn, 'click', this.close.bind(this));
			this.initFormFieldManager(uid);
			this.initDateTimeControl(uid);
			this.initNameControl(uid);
			this.initEditorControl(uid);
			this.initAttendeesControl();
			if (this.plannerEnabled) {
				this.initPlanner(uid);
			}
			this.initReminderControl(uid);
			if (this.sectionSelectorEnabled) {
				this.initSectionSelector(uid);
			}
			this.initLocationControl(uid);
			this.initRepeatRuleControl(uid);
			this.initColorControl(uid);
			this.initCrmUfControl(uid);
			this.initAccessibilityControl(uid);
			this.initAdditionalControls(uid);
			this.checkLastItemBorder();
			if (this.isOpenEvent) {
				this.initCategoryControl();
			}
			if (this.DOM.buttonsWrap) {
				BX.ZIndexManager.register(this.DOM.buttonsWrap);
			}
		}
		createRawEntryDataSnapshot(entryData) {
			if (!main_core.Type.isPlainObject(entryData)) {
				return null;
			}
			return {
				...entryData,
				dateFrom: main_core.Type.isDate(entryData.dateFrom) ? new Date(entryData.dateFrom.getTime()) : entryData.dateFrom,
				dateTo: main_core.Type.isDate(entryData.dateTo) ? new Date(entryData.dateTo.getTime()) : entryData.dateTo
			};
		}
		createTimezoneProjection() {
			return this.completeTimezoneProjection(this.createRawTimezoneProjection());
		}
		createRawTimezoneProjection() {
			const {
				entry,
				rawEntryData,
				userTimezone,
				sourceMode,
				sourceFrom,
				sourceTo,
				fullDay,
				eventTimezoneFrom,
				eventTimezoneTo
			} = this.getTimezoneProjectionContext();
			const editableEventTimezoneReason = this.getEditableEventTimezoneProjectionReason(rawEntryData, sourceMode, eventTimezoneFrom, eventTimezoneTo, fullDay);
			if (editableEventTimezoneReason) {
				const fromUtc = this.getEventWallClockUtcContainer(rawEntryData, 'DATE_FROM', sourceFrom, sourceMode);
				const toUtc = this.getEventWallClockUtcContainer(rawEntryData, 'DATE_TO', sourceTo, sourceMode);
				return {
					from: main_core.Type.isDate(sourceFrom) ? new Date(sourceFrom.getTime()) : main_core.Type.isDate(fromUtc) ? utcContainerToLocal(fromUtc) : null,
					to: main_core.Type.isDate(sourceTo) ? new Date(sourceTo.getTime()) : main_core.Type.isDate(toUtc) ? utcContainerToLocal(toUtc) : null,
					fromUtc,
					toUtc,
					fullDay,
					displayTimezone: eventTimezoneFrom || '',
					active: true,
					reason: editableEventTimezoneReason
				};
			}

			// The stored per-boundary instant is fold-correct in the ambiguous autumn hour, but it only
			// matches a loaded event's own wall-clock. A compact -> full handoff carries a fresh interval
			// (compactCanonical), so its projection resolves the wall-clock in the event zone instead.
			const storedInstant = sourceMode === TimezoneProjectionSource.entryStringCanonical ? this.getReliableStoredInstant(rawEntryData, sourceFrom, sourceTo, eventTimezoneFrom, eventTimezoneTo) : null;
			const projection = createTimezoneProjection({
				from: sourceFrom,
				to: sourceTo,
				fullDay,
				sourceMode,
				eventTimezoneFrom,
				eventTimezoneTo,
				userTimezone,
				fromInstant: storedInstant?.from ?? null,
				toInstant: storedInstant?.to ?? null
			});
			if (projection.active) {
				return projection;
			}
			if (sourceMode === TimezoneProjectionSource.compactCanonical) {
				return {
					...projection,
					displayTimezone: projection.displayTimezone || eventTimezoneFrom || ''
				};
			}
			return {
				...projection,
				from: main_core.Type.isDate(entry.from) ? new Date(entry.from.getTime()) : null,
				to: main_core.Type.isDate(entry.to) ? new Date(entry.to.getTime()) : null,
				fullDay: entry.fullDay,
				displayTimezone: entry.getTimezoneFrom()
			};
		}
		completeTimezoneProjection(projection) {
			const useUtcControl = projection.active === true && main_core.Type.isDate(projection.fromUtc) && main_core.Type.isDate(projection.toUtc);
			const useProjectionTimezone = useUtcControl && main_core.Type.isStringFilled(projection.displayTimezone);
			const preview = this.createDateTimePreview({
				from: useUtcControl ? projection.fromUtc : projection.from,
				to: useUtcControl ? projection.toUtc : projection.to,
				fullDay: projection.fullDay,
				utc: useUtcControl,
				timezoneFrom: useProjectionTimezone ? projection.displayTimezone : this.entry.getTimezoneFrom(),
				timezoneTo: useProjectionTimezone ? projection.displayTimezone : this.entry.getTimezoneTo()
			}, projection.displayTimezone);
			return {
				...projection,
				previewFrom: preview.from,
				previewTo: preview.to,
				previewTimezone: preview.timezone
			};
		}
		getTimezoneProjectionContext() {
			const entry = this.entry;
			const rawEntryData = this.rawEntryData || entry.data;
			const sourceMode = this.getTimezoneProjectionSourceMode(rawEntryData);
			const sourceFrom = sourceMode === TimezoneProjectionSource.compactCanonical ? this.formDataValue.from : sourceMode === TimezoneProjectionSource.entryDateFieldsProjected ? rawEntryData.dateFrom : entry.from;
			const sourceTo = sourceMode === TimezoneProjectionSource.compactCanonical ? this.formDataValue.to : sourceMode === TimezoneProjectionSource.entryDateFieldsProjected ? rawEntryData.dateTo : entry.to;
			const fullDay = main_core.Type.isBoolean(this.formDataValue.fullDay) ? this.formDataValue.fullDay : entry.fullDay;
			const eventTimezoneFrom = this.getStoredTimezoneFrom(rawEntryData);
			const eventTimezoneTo = this.getStoredTimezoneTo(rawEntryData, eventTimezoneFrom);
			return {
				entry,
				rawEntryData,
				userTimezone: this.getUserTimezone(),
				sourceMode,
				sourceFrom,
				sourceTo,
				fullDay,
				eventTimezoneFrom,
				eventTimezoneTo
			};
		}
		getDisplayTimezone() {
			return this.timezoneProjection?.previewTimezone || this.timezoneProjection?.displayTimezone || this.entry.getTimezoneFrom();
		}
		getStoredTimezoneFrom(entryData) {
			return main_core.Type.isString(entryData?.TZ_FROM) ? entryData.TZ_FROM : this.entry.getTimezoneFrom?.() || '';
		}
		getStoredTimezoneTo(entryData, timezoneFrom = '') {
			return main_core.Type.isStringFilled(entryData?.TZ_TO) ? entryData.TZ_TO : this.entry.getTimezoneTo?.() || timezoneFrom;
		}
		getEventWallClockUtcContainer(entryData, fieldName, fallback, sourceMode) {
			if (this.canUseStoredWallClockForProjection(sourceMode) && main_core.Type.isString(entryData?.[fieldName])) {
				const parsed = calendar_util.Util.parseDate(entryData[fieldName], true);
				if (main_core.Type.isDate(parsed)) {
					return parsed;
				}
			}
			return main_core.Type.isDate(fallback) ? toUtcWallClock(fallback) : null;
		}
		canUseStoredWallClockForProjection(sourceMode) {
			return sourceMode === TimezoneProjectionSource.entryStringCanonical || sourceMode === TimezoneProjectionSource.compactCanonical && !this.hasHandoffDateTimeChange();
		}
		getUserTimezone() {
			return this.userSettings?.timezoneName || this.userSettings?.timezoneDefaultName || '';
		}

		// Store the shown wall-clock only. The save path re-derives the event-zone value on demand through
		// the instant round-trip, so no per-boundary offset is cached here (a cached offset re-derived from
		// the wall-clock alone cannot tell the two occurrences of the ambiguous fall-back hour apart).
		updateTimezoneProjection(value, displayTimezone = this.timezoneProjection?.displayTimezone || this.getUserTimezone()) {
			const valueUtc = value.utc === true;
			const from = valueUtc ? utcContainerToLocal(value.from) : new Date(value.from.getTime());
			const to = valueUtc ? utcContainerToLocal(value.to) : new Date(value.to.getTime());
			const preview = this.createDateTimePreview(value, displayTimezone);
			this.timezoneProjection = {
				...this.timezoneProjection,
				from,
				to,
				fromUtc: valueUtc ? new Date(value.from.getTime()) : toUtcWallClock(from),
				toUtc: valueUtc ? new Date(value.to.getTime()) : toUtcWallClock(to),
				previewFrom: preview.from,
				previewTo: preview.to,
				previewTimezone: preview.timezone,
				fullDay: value.fullDay,
				displayTimezone
			};
			return preview;
		}
		getWallClockPart(date, part, utc = false) {
			if (part === 'year') {
				return utc ? date.getUTCFullYear() : date.getFullYear();
			}
			if (part === 'month') {
				return utc ? date.getUTCMonth() : date.getMonth();
			}
			if (part === 'date') {
				return utc ? date.getUTCDate() : date.getDate();
			}
			if (part === 'hours') {
				return utc ? date.getUTCHours() : date.getHours();
			}
			return utc ? date.getUTCMinutes() : date.getMinutes();
		}
		isSameWallClock(first, second, firstUtc = false, secondUtc = false) {
			if (!main_core.Type.isDate(first) || !main_core.Type.isDate(second)) {
				return false;
			}
			return this.getWallClockPart(first, 'year', firstUtc) === this.getWallClockPart(second, 'year', secondUtc) && this.getWallClockPart(first, 'month', firstUtc) === this.getWallClockPart(second, 'month', secondUtc) && this.getWallClockPart(first, 'date', firstUtc) === this.getWallClockPart(second, 'date', secondUtc) && this.getWallClockPart(first, 'hours', firstUtc) === this.getWallClockPart(second, 'hours', secondUtc) && this.getWallClockPart(first, 'minutes', firstUtc) === this.getWallClockPart(second, 'minutes', secondUtc);
		}
		hasDateTimeWallClockChange(dateTime, initialDateTime) {
			const dateTimeUtc = dateTime.utc === true;
			const initialDateTimeUtc = initialDateTime.utc === true;
			return initialDateTime.fullDay !== dateTime.fullDay || !this.isSameWallClock(dateTime.from, initialDateTime.from, dateTimeUtc, initialDateTimeUtc) || !this.isSameWallClock(dateTime.to, initialDateTime.to, dateTimeUtc, initialDateTimeUtc);
		}
		getTimezoneProjectionSourceMode(entryData) {
			if (this.handoffIntent) {
				return TimezoneProjectionSource.compactCanonical;
			}
			if (!main_core.Type.isString(entryData?.DATE_FROM) && !main_core.Type.isString(entryData?.DATE_TO) && main_core.Type.isDate(entryData?.dateFrom) && main_core.Type.isDate(entryData?.dateTo)) {
				return TimezoneProjectionSource.entryDateFieldsProjected;
			}
			if (main_core.Type.isString(entryData?.DATE_FROM) && main_core.Type.isString(entryData?.DATE_TO)) {
				return TimezoneProjectionSource.entryStringCanonical;
			}
			return null;
		}
		shouldKeepEventTimezoneForEditableAttendeeCopy(entryData, sourceMode, timezoneFrom, timezoneTo, fullDay = false) {
			return (sourceMode === TimezoneProjectionSource.entryStringCanonical || sourceMode === TimezoneProjectionSource.compactCanonical) && fullDay !== true && main_core.Type.isStringFilled(timezoneFrom) && timezoneFrom === timezoneTo && this.isAttendeeCopy(entryData) && this.canEdit();
		}
		getEditableEventTimezoneProjectionReason(entryData, sourceMode, timezoneFrom, timezoneTo, fullDay = false) {
			if (this.shouldKeepEventTimezoneForEditableAttendeeCopy(entryData, sourceMode, timezoneFrom, timezoneTo, fullDay)) {
				return 'delegated-attendee-event-timezone';
			}
			if (this.canUseStoredWallClockForProjection(sourceMode) && fullDay !== true && main_core.Type.isStringFilled(timezoneFrom) && timezoneFrom === timezoneTo && this.hasEventOwnerMetadata(entryData) && this.canEdit()) {
				return 'editable-event-timezone';
			}
			return null;
		}
		hasEventOwnerMetadata(entryData) {
			const ownerId = parseInt(entryData?.OWNER_ID, 10);
			const createdBy = parseInt(entryData?.CREATED_BY, 10);
			return ownerId > 0 || createdBy > 0;
		}
		getReliableStoredInstant(entryData, from, to, timezoneFrom, timezoneTo) {
			const storedInstant = calendar_controls.Location.getUnambiguousEventInstant(entryData);
			if (!storedInstant || !this.isAttendeeCopy(entryData)) {
				return storedInstant;
			}
			return {
				from: this.doesInstantMatchWallClock(storedInstant.from, this.getStoredInstantWallClock(entryData, 'DATE_FROM', from), timezoneFrom) ? storedInstant.from : null,
				to: this.doesInstantMatchWallClock(storedInstant.to, this.getStoredInstantWallClock(entryData, 'DATE_TO', to), timezoneTo) ? storedInstant.to : null
			};
		}
		getStoredInstantWallClock(entryData, fieldName, fallback) {
			if (main_core.Type.isString(entryData?.[fieldName])) {
				const date = calendar_util.Util.parseDate(entryData[fieldName], true);
				if (main_core.Type.isDate(date)) {
					return {
						date,
						utc: true
					};
				}
			}
			return {
				date: fallback,
				utc: false
			};
		}
		isAttendeeCopy(entryData) {
			const id = Number(entryData?.ID);
			const parentId = Number(entryData?.PARENT_ID);
			return this.isMeetingFlagEnabled(entryData?.IS_MEETING) && Number.isFinite(id) && Number.isFinite(parentId) && id > 0 && parentId > 0 && id !== parentId;
		}
		isMeetingFlagEnabled(value) {
			return value === true || value === 1 || value === '1' || value === 'Y';
		}
		doesInstantMatchWallClock(instant, wallClock, timezone) {
			const date = main_core.Type.isPlainObject(wallClock) ? wallClock.date : wallClock;
			const utc = main_core.Type.isPlainObject(wallClock) && wallClock.utc === true;
			if (!Number.isFinite(instant) || !main_core.Type.isDate(date) || !main_core.Type.isStringFilled(timezone)) {
				return false;
			}
			const wallClockTime = utc ? date.getTime() : toUtcWallClock(date).getTime();
			return instantToUtcContainer(instant, timezone).getTime() === wallClockTime;
		}
		updateEntryData(entryData, options = {}) {
			if (this.entry instanceof calendar_entry.Entry) {
				this.invalidatePlannerData();
				const userSettings = options.userSettings || {};
				if (main_core.Type.isPlainObject(entryData)) {
					this.entry.prepareData(entryData);
				}
				if (!this.entry.id && !this.entry.fullDay) {
					const userTimezone = userSettings.timezoneName || userSettings.timezoneDefaultName;
					if (main_core.Type.isStringFilled(userTimezone)) {
						const timezoneFrom = this.entry.getTimezoneFrom() || userTimezone;
						const timezoneTo = this.entry.getTimezoneTo() || this.entry.getTimezoneFrom() || userTimezone;
						this.entry.setTimezone(timezoneFrom, timezoneTo);
						if (this.rawEntryData) {
							this.rawEntryData.TZ_FROM = timezoneFrom;
							this.rawEntryData.TZ_TO = timezoneTo;
						}
					}
				}
				if (!this.entry.id && options.meetSection && this.type === calendar_entry.Entry.CAL_TYPES.user) {
					this.entry.setSectionId(options.meetSection);
				}
			}
		}
		handleSections(sections, trackingUsersList) {
			this.sections = calendar_util.Util.filterSectionsByContext(sections, {
				isCollabUser: this.isCollabUser,
				calendarType: this.type,
				calendarOwnerId: this.ownerId
			});
			this.sectionIndex = {};
			this.trackingUsersList = trackingUsersList || [];
			if (main_core.Type.isArray(this.sections)) {
				this.sections.forEach((value, ind) => {
					this.sectionIndex[parseInt(value.ID, 10)] = ind;
				});
			}
			const section = this.getCurrentSection();
			if (this.entry.id) {
				this.getSectionsForEditEvent(this.sections, section);
			}
		}
		handleLocationData(locationFeatureEnabled, locationList, iblockMeetingRoomList) {
			this.locationFeatureEnabled = Boolean(locationFeatureEnabled);
			this.locationList = main_core.Type.isArray(locationList) ? locationList.filter(locationItem => {
				return locationItem.PERM.view_full;
			}) : [];
			this.iblockMeetingRoomList = iblockMeetingRoomList || [];
			calendar_controls.Location.setLocationList(locationList);
			calendar_controls.Location.setMeetingRoomList(iblockMeetingRoomList);
		}
		setUserSettings(userSettings) {
			this.userSettings = userSettings;
			calendar_util.Util.setUserSettings(userSettings);
		}

		// The saved instant applies whenever the shown interval still matches the loaded event. A compact ->
		// full handoff only invalidates it when it actually changed the interval: then no saved instant fits,
		// so return null and let the location precheck resolve wall-clock over the new projected interval
		// (adding DAY_LENGTH for full-day). A no-op handoff keeps the canonical instant, so the ambiguous
		// fall-back hour is not silently re-resolved to the standard-time side.
		getLocationPrecheckInstant() {
			if (this.handoffIntent && this.hasHandoffDateTimeChange()) {
				return null;
			}
			const {
				rawEntryData,
				sourceFrom,
				sourceTo,
				eventTimezoneFrom,
				eventTimezoneTo
			} = this.getTimezoneProjectionContext();
			const storedInstant = this.getReliableStoredInstant(rawEntryData, sourceFrom, sourceTo, eventTimezoneFrom, eventTimezoneTo);
			return Number.isFinite(storedInstant?.from) || Number.isFinite(storedInstant?.to) ? storedInstant : null;
		}
		setFormValues() {
			const entry = this.entry;
			const projection = this.timezoneProjection;
			const {
				rawEntryData,
				eventTimezoneFrom,
				eventTimezoneTo
			} = this.getTimezoneProjectionContext();
			const canEditDateTime = this.canEdit();

			// Date time. When the projection is active it exposes gap-safe UTC containers (fromUtc/toUtc)
			// consumed via the control's utc mode; otherwise fall back to the local canonical dates.
			const useUtcProjection = projection.active === true && main_core.Type.isDate(projection.fromUtc) && main_core.Type.isDate(projection.toUtc);
			const readonlyFrom = !canEditDateTime && main_core.Type.isDate(entry.from) ? calendar_util.Util.adjustDateForTimezoneOffset(entry.from, entry.userTimezoneOffsetFrom, entry.fullDay) : null;
			const readonlyTo = !canEditDateTime && main_core.Type.isDate(entry.to) ? calendar_util.Util.adjustDateForTimezoneOffset(entry.to, entry.userTimezoneOffsetTo, entry.fullDay) : null;
			const useUtcControl = !readonlyFrom && useUtcProjection;
			const displayFrom = readonlyFrom || (useUtcControl ? projection.fromUtc : projection.from);
			const displayTo = readonlyTo || (useUtcControl ? projection.toUtc : projection.to);
			const useDisplayTimezoneControl = useUtcControl && main_core.Type.isStringFilled(projection.displayTimezone);
			const controlTimezoneFrom = useDisplayTimezoneControl ? projection.displayTimezone : eventTimezoneFrom;
			const controlTimezoneTo = useDisplayTimezoneControl ? projection.displayTimezone : eventTimezoneTo;
			const preview = this.createDateTimePreview({
				from: displayFrom,
				to: displayTo,
				fullDay: projection.fullDay,
				timezoneFrom: controlTimezoneFrom,
				timezoneTo: controlTimezoneTo,
				utc: useUtcControl
			}, projection.displayTimezone);
			const previewFrom = preview.from;
			const previewTo = preview.to;
			projection.previewFrom = previewFrom;
			projection.previewTo = previewTo;
			projection.previewTimezone = preview.timezone;
			this.planner?.updateTimezone(preview.timezone);
			this.dateTimeControl.setValue({
				from: displayFrom,
				to: displayTo,
				fullDay: projection.fullDay,
				timezoneFrom: controlTimezoneFrom,
				timezoneTo: controlTimezoneTo,
				timezoneName: this.getUserTimezone(),
				utc: useUtcControl
			});
			this.initialControlTimezoneFrom = controlTimezoneFrom;
			this.initialControlTimezoneTo = controlTimezoneTo;
			this.initialTimezoneFrom = this.getStoredTimezoneFrom(rawEntryData);
			this.initialTimezoneTo = this.getStoredTimezoneTo(rawEntryData, this.initialTimezoneFrom);
			if (entry.isSharingEvent() || !canEditDateTime) {
				this.dateTimeControl.setReadonly(this.timezoneHint);
			}
			if (!canEditDateTime) {
				main_core.Dom.attr(this.DOM.entryName, 'readonly', 'readonly');
				main_core.Dom.style(this.DOM.entryName, 'pointer-events', 'none');
			}
			const entryName = this.formDataValue.name || entry.getName();
			this.DOM.entryName.value = entryName;
			this.DOM.entryName.title = entryName;
			main_core.Event.bind(this.DOM.entryName, 'keyup', this.updateEventNameInputTitle.bind(this));
			main_core.Event.bind(this.DOM.entryName, 'change', this.updateEventNameInputTitle.bind(this));

			// Section
			const section = this.getCurrentSection();
			this.initialSectionId = this.getCurrentSectionId();
			if (this.sectionSelectorEnabled) {
				if (this.formDataValue.section) {
					entry.sectionId = Number(this.formDataValue.section);
				}
				this.DOM.sectionInput.value = this.getCurrentSectionId();
				this.initialSectionId = this.getCurrentSectionId();
				this.sectionSelector.updateValue();
				if (!this.fieldIsPinned('section') && (section.CAL_TYPE !== this.type || section.CAL_TYPE === this.type) && parseInt(section.OWNER_ID, 10) !== this.ownerId) {
					this.pinField('section');
				}
				if ((this.isSyncSection(section) || entry.isSharingEvent()) && entry.id || !this.canEdit()) {
					this.sectionSelector.setViewMode(true);
				}
			}

			// Color
			if (this.formDataValue.color) {
				entry.data.COLOR = this.formDataValue.color;
			}
			this.colorSelector.setValue(entry.getColor() || section.COLOR);

			// Reminders
			this.remindersControl.setValue(this.formDataValue.reminder || entry.getReminders(), true, false);

			// Recursion
			this.repeatSelector?.setValue(this.formDataValue.rrule || entry.getRrule());
			this.initialRrule = this.getFormRrule();
			if (entry.id && entry.isSharingEvent() || !this.canEdit()) {
				this.repeatSelector?.setViewMode(entry.getRRuleDescription());
			}
			if (entry.hasRecurrenceId()) {
				this.repeatSelector?.setViewMode(entry.getRRuleDescription());
			}

			// accessibility
			if (this.DOM.accessibilityInput) {
				this?.accessibilitySelector?.setValue(entry.accessibility);
			}

			// Location
			if (this.locationSelector) {
				this.locationSelector.setValue(this.formDataValue.location || this.locationSelector.default || entry.getLocation(), false);
				const unambiguousInstant = this.getLocationPrecheckInstant();
				const projectedInstant = !projection.fullDay && useUtcControl ? {
					from: getWallClockInstant(displayFrom, controlTimezoneFrom, true),
					to: getWallClockInstant(displayTo, controlTimezoneTo, true)
				} : null;
				this.locationSelector.checkLocationAccessibility({
					from: previewFrom,
					to: previewTo,
					timezone: preview.timezone,
					fullDay: projection.fullDay,
					currentEventId: this.entry.id,
					fromTsUtc: Number.isFinite(unambiguousInstant?.from) ? unambiguousInstant.from : projectedInstant?.from,
					toTsUtc: Number.isFinite(unambiguousInstant?.to) ? unambiguousInstant.to : projectedInstant?.to
				});
			}

			//max attendees
			if (this.DOM.form.max_attendees) {
				const optionsJson = entry?.data?.OPTIONS?.OPTIONS ?? null;
				this.DOM.form.max_attendees.value = JSON.parse(optionsJson)?.max_attendees || '';
			}

			// Private
			if (this.DOM.privateEventCheckbox) {
				this.DOM.privateEventCheckbox.checked = entry.private;
			}

			// Importance
			if (this.DOM.importantEventCheckbox) {
				this.DOM.importantEventCheckbox.checked = entry.important;
			}
			if (this.DOM.form.meeting_notify) {
				if (this.formDataValue.meetingNotify !== undefined) {
					this.DOM.form.meeting_notify.checked = this.formDataValue.meetingNotify;
				}
				if (this.entry.data && this.entry.data.MEETING) {
					this.DOM.form.meeting_notify.checked = this.entry.data.MEETING.NOTIFY;
				} else {
					this.DOM.form.meeting_notify.checked = true; // default value
				}
			}
			if (this.DOM.form.hide_guests) {
				if (this.formDataValue.hideGuests !== undefined) {
					this.DOM.form.hide_guests.checked = this.formDataValue.hideGuests === 'Y';
				} else if (this.entry.data && this.entry.data.MEETING) {
					this.DOM.form.hide_guests.checked = this.entry.data.MEETING.HIDE_GUESTS;
				} else {
					this.DOM.form.hide_guests.checked = true; // default value
				}
			}
			if (this.DOM.form.allow_invite) {
				if (this.entry.data) {
					this.DOM.form.allow_invite.checked = this.entry.data.MEETING && this.entry.data.MEETING.ALLOW_INVITE;
				} else {
					this.DOM.form.allow_invite.checked = this.entry.allowInvite;
				}
			}
			this.initialMeetingNotify = this.DOM.form.meeting_notify?.checked;
			this.initialHideGuests = this.DOM.form.hide_guests?.checked;
			this.initialAllowInvite = this.DOM.form.allow_invite?.checked;
			if (this.plannerEnabled) {
				this.planner.updateSelector(previewFrom, previewTo, projection.fullDay, {
					focus: true
				});
			}
			if (entry.isSharingEvent() || !this.canEdit()) {
				this.planner.setReadonly();
				this.planner.setSolid();
				this.planner.setShowWorkTimeNotice();
			}
			if (!this.canEdit()) {
				const [placeHolders, placeHoldersAdditional] = this.getPlaceholders();
				for (const fieldEditableOnlyByPermission of this.getFieldsEditableOnlyByPermission()) {
					main_core.Dom.style(placeHolders[fieldEditableOnlyByPermission], 'display', 'none');
					main_core.Dom.style(placeHoldersAdditional[fieldEditableOnlyByPermission], 'display', 'none');
				}
				main_core.Dom.style(this.DOM.importantEventCheckbox, 'display', 'none');
				main_core.Dom.style(this.DOM.importantEventCheckboxContainer, 'display', 'none');
				main_core.Dom.style(this.DOM.moreSettings, 'display', 'none');
				main_core.Dom.style(this.DOM.accessibilityInput, 'display', 'none');
				const accessibilityText = main_core.Tag.render`
				<span class="calendar-field calendar-repeat-selector-readonly">
					${this.DOM.accessibilityInput.value}
				</span>
			`;
				this.DOM.accessibilityInput.after(accessibilityText);
			}
			if (this.plannerEnabled) {
				this.loadPlannerData({
					entityList: this.getUserSelectorEntityList(),
					from: calendar_util.Util.formatDate(previewFrom.getTime() - calendar_util.Util.getDayLength() * 3),
					to: calendar_util.Util.formatDate(previewTo.getTime() + calendar_util.Util.getDayLength() * 10),
					timezone: preview.timezone,
					location: this.locationSelector.getTextValue()
				});
			}
			this.initialDisplaySnapshot = {
				from: new Date(displayFrom.getTime()),
				to: new Date(displayTo.getTime()),
				fullDay: projection.fullDay,
				displayTimezone: projection.displayTimezone,
				utc: useUtcControl
			};
		}
		initCategoryControl() {
			this.DOM.categorySelectorWrap = this.DOM.content.querySelector('.calendar-category-selector-wrap');
			this.DOM.categorySelectorValueWarp = this.DOM.categorySelectorWrap.appendChild(main_core.Tag.render`<div></div>`);
			this.categoryTagSelector = new ui_entitySelector.TagSelector({
				multiple: false,
				dialogOptions: {
					context: 'calendar',
					preselectedItems: this.preSelectedCategory ? [this.preSelectedCategory] : [],
					preload: true,
					zIndex: this.slider.zIndex,
					multiple: false,
					entities: [{
						id: 'event-category',
						dynamicLoad: true,
						dynamicSearch: true
					}],
					events: {
						'onLoad': () => {
							this.categoryTagSelector.getDialog().getItems().forEach(item => item.setDeselectable(false));
							this.categoryTagSelector.getTags().forEach(tag => tag.render());
						}
					}
				}
			});
			this.categoryTagSelector.renderTo(this.DOM.categorySelectorWrap);
		}
		updateEventNameInputTitle() {
			if (this.isTitleOverflowing()) {
				this.DOM.entryName.title = this.DOM.entryName.value;
			} else {
				this.DOM.entryName.title = '';
			}
		}
		isTitleOverflowing() {
			const el = this.DOM.entryName;
			return el.clientWidth < el.scrollWidth || el.clientHeight < el.scrollHeight;
		}
		switchFullDay(value) {
			value = Boolean(this.DOM.fullDay.checked);
			const userTimezone = this.getUserTimezone();
			if (value && main_core.Type.isStringFilled(userTimezone) && (!this.DOM.fromTz.value || !this.DOM.toTz.value)) {
				this.DOM.fromTz.value = userTimezone;
				this.DOM.toTz.value = userTimezone;
				this.DOM.defTimezone.value = userTimezone;
			}
			if (value) {
				main_core.Dom.addClass(this.DOM.dateTimeWrap, 'calendar-options-item-datetime-hide-time');
			} else {
				main_core.Dom.removeClass(this.DOM.dateTimeWrap, 'calendar-options-item-datetime-hide-time');
			}
			if (this.remindersControl) {
				this.remindersControl.setFullDayMode(value);
			}
			this.refreshPlanner();
		}
		switchTimezone() {
			if (main_core.Dom.hasClass(this.DOM.tzCont, 'calendar-options-timezone-collapse')) {
				main_core.Dom.addClass(this.DOM.tzCont, 'calendar-options-timezone-expand');
				main_core.Dom.removeClass(this.DOM.tzCont, 'calendar-options-timezone-collapse');
			} else {
				main_core.Dom.addClass(this.DOM.tzCont, 'calendar-options-timezone-collapse');
				main_core.Dom.removeClass(this.DOM.tzCont, 'calendar-options-timezone-expand');
			}
		}
		initFormFieldManager(uid) {
			this.DOM.mainBlock = this.DOM.content.querySelector(`#${uid}_main_block_wrap`);
			this.DOM.additionalBlockWrap = this.DOM.content.querySelector(`#${uid}_additional_block_wrap`);
			this.DOM.additionalBlock = this.DOM.content.querySelector(`#${uid}_additional_block`);
			this.DOM.pinnedNamesWrap = this.DOM.content.querySelector(`#${uid}_additional_pinned_names`);
			this.DOM.additionalSwitch = this.DOM.content.querySelector(`#${uid}_additional_switch`);
			if (this.isLocationCalendar && !this.fieldIsPinned('location')) {
				this.pinField('location');
			}
			main_core.Event.bind(this.DOM.additionalSwitch, 'click', () => {
				main_core.Dom.toggleClass(this.DOM.additionalSwitch, 'opened');
				main_core.Dom.toggleClass(this.DOM.additionalBlock, 'invisible');
			});
			main_core.Event.bind(this.DOM.formWrap, 'click', e => {
				const target = e.target || e.srcElement;
				if (target && target.getAttribute && target.getAttribute('data-bx-fixfield')) {
					const fieldName = target.getAttribute('data-bx-fixfield');
					if (this.fieldIsPinned(fieldName)) {
						this.unPinField(fieldName);
					} else {
						this.pinField(fieldName);
					}
				}
			});
			const fieldButtons = document.querySelectorAll('[data-bx-field-id]');
			this.bindAdditionalFieldButtons(fieldButtons);
		}
		initDateTimeControl(uid) {
			this.dateTimeControl = new SliderDateTimeControl(uid, {
				showTimezone: true,
				outerContent: this.DOM.content
			});
			this.dateTimeControl.subscribe('onChange', event => {
				if (event instanceof main_core_events.BaseEvent) {
					this.onDateTimeControlChange(event.getData().value);
				}
			});
		}
		onDateTimeControlChange(value) {
			// Track timezone intent per boundary: a single OR-flag would skip the reverse projection of
			// an unchanged boundary while the other boundary's zone changed, shifting its saved time.
			const initialControlTimezoneFrom = this.initialControlTimezoneFrom || this.initialTimezoneFrom;
			const initialControlTimezoneTo = this.initialControlTimezoneTo || this.initialTimezoneTo;
			this.fromTimezoneChanged = value.timezoneFrom !== initialControlTimezoneFrom;
			this.toTimezoneChanged = value.timezoneTo !== initialControlTimezoneTo;
			this.explicitTimezoneIntent = this.fromTimezoneChanged || this.toTimezoneChanged;
			const displayTimezone = this.explicitTimezoneIntent ? value.timezoneFrom : this.initialDisplaySnapshot?.displayTimezone;
			const timezoneFrom = this.getEffectiveTimezoneFrom(value);
			const timezoneTo = this.getEffectiveTimezoneTo(value);
			const controlTimezoneFrom = this.getControlTimezone(value.timezoneFrom);
			const controlTimezoneTo = this.getControlTimezone(value.timezoneTo);
			if (this.explicitTimezoneIntent) {
				this.entry.setTimezone(timezoneFrom, timezoneTo);
			} else {
				this.entry.setTimezone(this.initialTimezoneFrom, this.initialTimezoneTo);
			}
			const preview = this.updateTimezoneProjection(value, displayTimezone);
			if (this.remindersControl) {
				this.remindersControl.setFullDayMode(value.fullDay);
				if (!this.entry.id && !this.remindersControl.wasChangedByUser()) {
					const defaultReminders = calendar_entry.EntryManager.getNewEntryReminders(value.fullDay ? 'fullDay' : 'withTime');
					this.remindersControl.setValue(defaultReminders, true, false);
				}
			}
			const locationInstant = !value.fullDay ? {
				from: getWallClockInstant(value.from, controlTimezoneFrom, value.utc === true),
				to: getWallClockInstant(value.to, controlTimezoneTo, value.utc === true)
			} : null;
			if (this.planner) {
				this.planner.updateSelector(preview.from, preview.to, value.fullDay);
				this.planner.updateTimezone(preview.timezone);
				this.refreshPlanner?.();
			}
			if (this.locationSelector) {
				this.locationSelector.checkLocationAccessibility({
					from: preview.from,
					to: preview.to,
					timezone: preview.timezone,
					fullDay: value.fullDay,
					currentEventId: this.entry.id,
					fromTsUtc: locationInstant?.from,
					toTsUtc: locationInstant?.to
				});
			}
		}
		getLocalControlBoundary(boundary, utc = false) {
			return utc && main_core.Type.isDate(boundary) ? utcContainerToLocal(boundary) : boundary;
		}
		createDateTimePreview(value, preferredTimezone = '') {
			const utc = value.utc === true;
			if (!main_core.Type.isDate(value.from) || !main_core.Type.isDate(value.to) || value.fullDay) {
				return {
					from: this.getLocalControlBoundary(value.from, utc),
					to: this.getLocalControlBoundary(value.to, utc),
					timezone: preferredTimezone
				};
			}
			const timezoneFrom = this.getControlTimezone(value.timezoneFrom);
			const timezoneTo = this.getControlTimezone(value.timezoneTo);
			const timezoneCandidates = [];
			for (const timezone of [preferredTimezone, this.getUserTimezone(), this.getBrowserTimezone()]) {
				if (main_core.Type.isStringFilled(timezone) && !timezoneCandidates.includes(timezone)) {
					timezoneCandidates.push(timezone);
				}
			}
			for (const timezone of timezoneCandidates) {
				const fromUtc = expressWallClockInTimezone(value.from, timezoneFrom, timezone, utc);
				const toUtc = expressWallClockInTimezone(value.to, timezoneTo, timezone, utc);
				if (this.canMaterializeUtcWallClockLocally(fromUtc) && this.canMaterializeUtcWallClockLocally(toUtc)) {
					return {
						from: utcContainerToLocal(fromUtc),
						to: utcContainerToLocal(toUtc),
						timezone
					};
				}
			}
			return {
				from: this.getLocalControlBoundary(value.from, utc),
				to: this.getLocalControlBoundary(value.to, utc),
				timezone: preferredTimezone
			};
		}
		canMaterializeUtcWallClockLocally(boundary) {
			return main_core.Type.isDate(boundary) && this.isSameWallClock(utcContainerToLocal(boundary), boundary, false, true);
		}
		getBrowserTimezone() {
			return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
		}
		getEffectiveTimezoneFrom(value) {
			return this.fromTimezoneChanged ? value.timezoneFrom || '' : this.initialTimezoneFrom || '';
		}
		getEffectiveTimezoneTo(value) {
			return this.toTimezoneChanged ? value.timezoneTo || '' : this.initialTimezoneTo || '';
		}
		getControlTimezone(timezone) {
			return main_core.Type.isStringFilled(timezone) ? timezone : this.timezoneProjection?.displayTimezone || this.getUserTimezone();
		}

		// Returns the wall-clock (as a local Date) in targetTimezone denoting the same absolute instant as
		// the given boundary wall-clock read in sourceTimezone. DST-safe (offsets resolved at the true
		// instant); a no-op when the zones match or either is missing.
		expressBoundaryInTimezone(boundary, sourceTimezone, targetTimezone, sourceUtc = false) {
			if (!main_core.Type.isDate(boundary) || !main_core.Type.isStringFilled(sourceTimezone) || !main_core.Type.isStringFilled(targetTimezone) || sourceTimezone === targetTimezone) {
				return this.getLocalControlBoundary(boundary, sourceUtc);
			}
			return utcContainerToLocal(expressWallClockInTimezone(boundary, sourceTimezone, targetTimezone, sourceUtc));
		}
		getRepeatSelectorDate() {
			const dateTime = this.dateTimeControl.getValue();
			if (!dateTime.fullDay && this.timezoneProjection?.active === true && !this.fromTimezoneChanged && main_core.Type.isStringFilled(this.timezoneProjection.displayTimezone)) {
				return this.expressBoundaryInTimezone(dateTime.from, this.timezoneProjection.displayTimezone, this.initialTimezoneFrom, dateTime.utc === true);
			}
			return this.getLocalControlBoundary(dateTime.from, dateTime.utc === true);
		}
		initNameControl(uid) {
			this.DOM.entryName = this.DOM.content.querySelector(`#${uid}_entry_name`);
			if (this.canEdit()) {
				setTimeout(() => {
					this.DOM.entryName.focus();
					this.DOM.entryName.select();
				}, 500);
			}
			let isInputFocus = false;
			main_core.Event.bind(this.DOM.entryName, 'focusout', () => {
				if (this.DOM.entryName.scrollWidth > this.DOM.entryName.offsetWidth) {
					this.getTitleFade(uid).classList.add('--show');
				} else {
					this.getTitleFade(uid).classList.remove('--show');
				}
				isInputFocus = false;
			});
			main_core.Event.bind(this.DOM.entryName, 'focus', () => {
				this.getTitleFade(uid).classList.remove('--show');
				isInputFocus = true;
			});
			main_core.Event.bind(this.DOM.entryName, 'scroll', () => {
				if (this.DOM.entryName.scrollWidth > this.DOM.entryName.offsetWidth && Math.ceil(this.DOM.entryName.offsetWidth + this.DOM.entryName.scrollLeft) < this.DOM.entryName.scrollWidth && !isInputFocus) {
					this.getTitleFade(uid).classList.add('--show');
				} else {
					this.getTitleFade(uid).classList.remove('--show');
				}
			});
		}
		getTitleFade(uid) {
			if (!this.DOM.entryNameFade) {
				this.DOM.entryNameFade = this.DOM.content.querySelector(`#${uid}_input_fade`);
			}
			return this.DOM.entryNameFade;
		}
		initReminderControl(uid) {
			const reminderWrap = this.DOM.content.querySelector(`#${uid}_reminder`);
			if (!reminderWrap) {
				return;
			}
			this.reminderValues = [];
			this.DOM.reminderWrap = reminderWrap;
			this.DOM.reminderInputsWrap = this.DOM.reminderWrap.appendChild(main_core.Tag.render`<span></span>`);
			this.remindersControl = new calendar_controls.Reminder({
				wrap: this.DOM.reminderWrap,
				zIndex: this.zIndex
			});
			this.remindersControl.subscribe('onChange', event => {
				if (event instanceof main_core_events.BaseEvent) {
					this.reminderValues = event.getData().values;
					main_core.Dom.clean(this.DOM.reminderInputsWrap);
					this.reminderValues.forEach(value => {
						this.DOM.reminderInputsWrap.appendChild(main_core.Tag.render`
						<input value="${value}" name="reminder[]" type="hidden">
					`);
					});
				}
			});
		}
		initSectionSelector(uid) {
			this.DOM.sectionInput = this.DOM.content.querySelector(`#${uid}_section`);
			this.sectionSelector = new calendar_controls.SectionSelector({
				outerWrap: this.DOM.content.querySelector(`#${uid}_section_wrap`),
				defaultCalendarType: this.type,
				defaultOwnerId: this.ownerId,
				sectionList: this.sections,
				sectionGroupList: calendar_sectionmanager.SectionManager.getSectionGroupList({
					type: this.type || 'user',
					ownerId: this.ownerId || this.userId,
					userId: this.userId,
					trackingUsersList: this.trackingUsersList,
					isCollabUser: this.isCollabUser,
					isCollabContext: this.isCollabContext(),
					isNewProjectsOn: this.isNewProjectsOn
				}),
				mode: 'full',
				zIndex: this.zIndex,
				getCurrentSection: () => {
					const section = this.getCurrentSection();
					if (section) {
						return {
							id: section.ID,
							name: section.NAME,
							color: section.COLOR
						};
					}
					return false;
				},
				selectCallback: sectionValue => {
					if (sectionValue) {
						this.DOM.sectionInput.value = sectionValue.id;
						if (this.colorSelector) {
							this.colorSelector.setValue(sectionValue.color);
						}
						this.entry.setSectionId(sectionValue.id);
						calendar_sectionmanager.SectionManager.saveDefaultSectionId(sectionValue.id, {
							calendarType: this.type,
							ownerId: this.ownerId,
							userId: this.userId,
							sections: this.sections
						});
					}
				}
			});
		}
		initEditorControl(uid) {
			if (!window.BXHtmlEditor) {
				return setTimeout(BX.delegate(this.initEditorControl, this), 50);
			}
			this.editor = null;
			if (window.BXHtmlEditor) {
				this.editor = window.BXHtmlEditor.Get(this.editorId);
			}
			if (!this.editor && top.BXHtmlEditor && top.BXHtmlEditor !== window.BXHtmlEditor) {
				this.editor = top.BXHtmlEditor.Get(this.editorId);
			}
			if (this.editor && this.editor.IsShown()) {
				this.customizeHtmlEditor();
				if (this.formDataValue.description) {
					this.editor.SetContent(this.formDataValue.description);
				}
			} else {
				this.BX.addCustomEvent(window.BXHtmlEditor, 'OnEditorCreated', editor => {
					if (editor.id === this.editorId) {
						this.editor = editor;
						this.customizeHtmlEditor();
						if (this.formDataValue.description) {
							this.editor.SetContent(this.formDataValue.description);
						}
					}
				});
			}
		}
		customizeHtmlEditor() {
			const editor = this.editor;
			if (editor.toolbar && editor.toolbar.controls && editor.toolbar.controls.spoiler) {
				main_core.Dom.remove(editor.toolbar.controls.spoiler.pCont);
			}
		}
		initLocationControl(uid) {
			this.DOM.locationWrap = this.DOM.content.querySelector(`#${uid}_location_wrap`);
			this.DOM.locationErrorWrap = this.DOM.content.querySelector(`#${uid}_location_error_wrap`);
			this.DOM.locationInput = this.DOM.content.querySelector(`#${uid}_location`);
			this.locationSelector = new calendar_controls.Location({
				inputName: 'lo_cation',
				// don't use 'location' word here mantis:107863
				wrap: this.DOM.locationWrap,
				richLocationEnabled: this.locationFeatureEnabled,
				hideLocationLock: this.isCollabUser,
				locationList: this.locationList || [],
				roomsManager: this.roomsManager || null,
				locationAccess: this.locationAccess || false,
				iblockMeetingRoomList: this.iblockMeetingRoomList,
				onChangeCallback: this.refreshPlanner
			});
		}
		initRepeatRuleControl(uid) {
			const rruleWrap = this.DOM.content.querySelector(`#${uid}_rrule_wrap`);
			if (!rruleWrap) {
				return;
			}
			this.DOM.rruleWrap = rruleWrap;
			this.repeatSelector = new calendar_controls.RepeatSelector({
				uid: this.uid,
				wrap: this.DOM.rruleWrap,
				rruleType: this.DOM.content.querySelector(`#${uid}_rrule_type`),
				rruleCount: this.DOM.content.querySelector(`#${uid}_rrule_count`),
				getDate: this.getRepeatSelectorDate.bind(this)
			});
			this.dateTimeControl.subscribe('onChange', () => {
				if (this.repeatSelector.getType() === 'weekly') {
					this.repeatSelector.changeType(this.repeatSelector.getType());
				}
			});
			if (this.plannerEnabled) {
				this.planner.subscribe('onDateChange', () => {
					if (this.repeatSelector.getType() === 'weekly') {
						this.repeatSelector.changeType(this.repeatSelector.getType());
					}
				});
			}
		}
		initAttendeesControl() {
			if (this.attendeesControlEnabled) {
				this.DOM.userSelectorWrap = this.DOM.content.querySelector('.calendar-attendees-selector-wrap');
				this.DOM.userSelectorValueWarp = this.DOM.userSelectorWrap.appendChild(main_core.Tag.render`<div></div>`);
				this.userTagSelector = new ui_entitySelector.TagSelector({
					dialogOptions: {
						context: 'CALENDAR',
						preselectedItems: this.attendeesPreselectedItems || [],
						zIndex: this.slider.zIndex,
						events: {
							'Item:onSelect': this.handleUserSelectorChanges.bind(this),
							'Item:onDeselect': this.handleUserSelectorChanges.bind(this)
						},
						entities: this.getParticipantsSelectorEntityList(),
						selectedItems: this.getSelectedItemsForTagSelector(),
						searchTabOptions: {
							stubOptions: {
								title: main_core.Loc.getMessage('EC_USER_DIALOG_404_TITLE'),
								subtitle: main_core.Loc.getMessage('EC_USER_DIALOG_404_SUBTITLE'),
								icon: '/bitrix/images/calendar/search-email.svg',
								iconOpacity: 100,
								arrow: true
							}
						}
					}
				});
				this.userTagSelector.renderTo(this.DOM.userSelectorWrap);
			}
			if (this.plannerEnabled) {
				this.DOM.hideGuestsWrap = this.DOM.content.querySelector('.calendar-hide-members-wrap');
			}
		}
		handleUserSelectorChanges() {
			if (this.planner) {
				this.planner.show();
				this.planner.showLoader();
				const selectedItems = this.userTagSelector.getDialog().getSelectedItems();
				this.setUserSelectorEntityList(selectedItems.map(item => {
					return {
						entityId: item.entityId,
						id: item.id,
						entityType: item.entityType
					};
				}));
				this.refreshPlanner();
			}
		}
		getSelectedItemsForTagSelector() {
			const result = [];
			const canEdit = this.canEdit();
			this.getUserSelectorEntityList().forEach(item => {
				if (item.entityType === 'sharing') {
					result.push({
						id: item.id,
						entityId: item.entityId,
						entityType: 'extranet',
						title: item.title,
						deselectable: false
					});
				}
				if (item.entityType === 'email') {
					result.push({
						id: item.id,
						entityId: item.entityId,
						entityType: 'email',
						title: item.title,
						deselectable: canEdit
					});
				}
			});
			return result;
		}
		hasExternalEmailUsers() {
			return Boolean(this.getUserSelectorEntityList().find(item => {
				return item.entityType === 'email';
			}));
		}
		showHideGuestsOption() {
			this.DOM.hideGuestsWrap.style.display = '';
			calendar_util.Util.initHintNode(this.DOM.hideGuestsWrap.querySelector('.calendar-hide-members-helper'));
		}
		hideHideGuestsOption() {
			this.DOM.hideGuestsWrap.style.display = 'none';
		}
		setHideGuestsValue(hideGuests = true) {
			this.hideGuests = hideGuests;
		}
		initPlanner(uid) {
			this.DOM.plannerOuterWrap = this.DOM.content.querySelector(`#${uid}_planner_outer_wrap`);
			this.planner = new calendar_planner.Planner({
				wrap: this.DOM.plannerOuterWrap,
				minWidth: parseInt(this.DOM.plannerOuterWrap.offsetWidth),
				locked: !this.plannerFeatureEnabled,
				entryTimezone: this.getDisplayTimezone()
			});
			this.planner.subscribe('onDateChange', this.handlePlannerSelectorChanges.bind(this));
			this.planner.subscribe('onExpandTimeline', this.handleExpandPlannerTimeline.bind(this));
			this.planner.subscribe('onDisplayAttendees', this.checkLocationForm.bind(this));
			if (main_core.Type.isDate(this.entry.from)) {
				this.planner.currentFromDate = new Date(this.entry.from.getTime());
				this.planner.currentToDate = new Date(this.entry.from.getTime());
			}
			this.planner.show();
			this.planner.showLoader();
		}
		loadPlannerData(params = {}) {
			if (this.destroyed) {
				return Promise.resolve();
			}
			const data = {
				entryId: this.entry.id || 0,
				entryLocation: this.entry.data.LOCATION || '',
				ownerId: this.ownerId,
				hostId: this.entry.data.MEETING_HOST || null,
				type: this.type,
				entityList: this.isOpenEvent ? [] : params.entityList ?? this.getUserSelectorEntityList() ?? [],
				attendeesProvided: 'Y',
				dateFrom: calendar_util.Util.formatDate(this.planner.scaleDateFrom),
				dateTo: calendar_util.Util.formatDate(this.planner.scaleDateTo),
				timezone: params.timezone || '',
				location: params.location || ''
			};
			const context = JSON.stringify(data);
			if (context !== this.plannerDataContext) {
				this.invalidatePlannerData();
				this.plannerDataContext = context;
			}
			this.planner.showLoader();
			const requestId = ++this.plannerDataRequestId;

			// BX.ajax.runAction returns BX.Promise without finally().
			return Promise.resolve(this.BX.ajax.runAction('calendar.api.calendarajax.updatePlanner', {
				data: {
					...data,
					prevUserList: this.prevUserList
				}
			})).then(response => {
				if (requestId !== this.plannerDataRequestId) {
					// a newer planner request has been sent, drop the stale response
					return response;
				}
				if (this.planner) {
					this.applyPlannerLimitState(response.data);
					for (const id in response.data.accessibility) {
						if (response.data.accessibility.hasOwnProperty(id)) {
							this.loadedAccessibilityData[id] = response.data.accessibility[id];
						}
					}
					if (main_core.Type.isArray(response.data.entries)) {
						response.data.entries.forEach(entry => {
							const hasAccessibility = this.loadedAccessibilityData[entry.id];
							if (entry.type === 'user' && !this.prevUserList.includes(parseInt(entry.id)) && hasAccessibility) {
								this.prevUserList.push(parseInt(entry.id));
							}
						});
					}
					this.planner.update(response.data.entries, this.loadedAccessibilityData);
				}
				if (this.hasExternalEmailUsers()) {
					this.showHideGuestsOption();
				} else {
					this.hideHideGuestsOption();
				}
				return response;
			}, response => response).finally(() => {
				if (requestId === this.plannerDataRequestId) {
					this.planner?.hideLoader();
				}
			});
		}
		applyPlannerLimitState(data) {
			const exceeded = data.plannerLimitExceeded === true;
			const wasExceeded = this.plannerLimitState?.exceeded ?? false;
			this.plannerLimitState = {
				exceeded,
				maxPlannerUsers: parseInt(data.maxPlannerUsers) || 0,
				peopleCount: parseInt(data.plannerPeopleCount) || 0
			};
			if (exceeded) {
				// render strictly the truncated response and forget missing users,
				// so their busy data reloads after going back under the limit
				this.loadedAccessibilityData = {};
				const responseUserIds = (main_core.Type.isArray(data.entries) ? data.entries : []).filter(entry => entry.type === 'user').map(entry => parseInt(entry.id));
				this.prevUserList = this.prevUserList.filter(userId => responseUserIds.includes(userId));
			}
			if (exceeded !== wasExceeded) {
				this.emitter.emit('onPlannerLimitStateChange', new main_core_events.BaseEvent({
					data: {
						...this.plannerLimitState
					}
				}));
			}
		}
		handlePlannerLimitStateChange(event) {
			if (!this.plannerFeatureEnabled) {
				// the tariff lock promo already explains why the planner is unavailable
				return;
			}
			const {
				exceeded,
				maxPlannerUsers
			} = event.getData();

			// the event fires on threshold transitions only, so a hint closed
			// by user stays hidden until the limit is exceeded again
			if (exceeded) {
				this.getPlannerLimitHint(maxPlannerUsers)?.show();
			} else {
				this.plannerLimitHint?.close();
			}
		}
		getPlannerLimitHint(maxPlannerUsers) {
			if (!this.plannerLimitHint && this.DOM.userSelectorWrap) {
				this.plannerLimitHint = new calendar_controls.PlannerLimitHint({
					bindElement: this.DOM.userSelectorWrap,
					targetContainer: this.DOM.content,
					zIndex: this.zIndex,
					maxPlannerUsers
				});
			}
			this.plannerLimitHint?.setMaxPlannerUsers(maxPlannerUsers);
			return this.plannerLimitHint;
		}
		initAdditionalControls(uid) {
			this.DOM.privateEventCheckbox = this.DOM.content.querySelector(`#${uid}_private`);
			this.DOM.importantEventCheckbox = this.DOM.content.querySelector(`#${uid}_important`);
			this.DOM.importantEventCheckboxContainer = this.DOM.importantEventCheckbox.closest('.calendar-info-panel-important');
			this.DOM.moreSettings = this.DOM.content.querySelector(`#${uid}_more_outer_wrap`);
		}
		initColorControl(uid) {
			this.DOM.colorWrap = this.DOM.content.querySelector(`#${uid}_color_selector_wrap`);
			this.colorSelector = new calendar_controls.ColorSelector({
				wrap: this.DOM.colorWrap
			});
		}
		initCrmUfControl(uid) {
			const crmUfWrap = BX(`${uid}-uf-crm-wrap`);
			if (!crmUfWrap) {
				return;
			}
			this.DOM.crmUfWrap = crmUfWrap;
			if (this.DOM.crmUfWrap) {
				const entry = this.getCurrentEntry();
				const loader = this.DOM.crmUfWrap.appendChild(main_core.Dom.adjust(calendar_util.Util.getLoader(50), {
					style: {
						height: '40px',
						width: '40px'
					}
				}));
				this.DOM.saveBtn.disabled = true;
				setTimeout(() => {
					this.BX.ajax.runAction('calendar.api.calendarajax.getCrmUserfield', {
						data: {
							event_id: entry && entry.id ? entry.id : 0
						}
					}).then(
					// Success
					response => {
						if (main_core.Type.isDomNode(this.DOM.crmUfWrap)) {
							this.BX.html(this.DOM.crmUfWrap, response.data.html);
							this.DOM.saveBtn.disabled = false;
						}
					},
					// Failure
					response => {
						main_core.Dom.remove(loader);
						this.DOM.saveBtn.disabled = false;
					});
				}, 800);
			}
		}
		initAccessibilityControl(uid) {
			this.DOM.accessibilityInput = this.DOM.content.querySelector(`#${uid}_accessibility`);
			this.accessibilitySelector = new calendar_controls.AccessibilitySelector({
				uid,
				readonly: !this.canEdit(),
				input: this.DOM.accessibilityInput
			});
		}
		denySliderClose() {
			this.denyClose = true;
		}
		allowSliderClose() {
			this.denyClose = false;
		}
		checkDenyClose() {
			// pending request
			if (this.state === this.STATE.REQUEST) {
				return true;
			}

			// Check if closing of slider was caused during selection.
			if (!main_core.Type.isNull(this.mouseUpNodeCheck)) {
				return !this.mouseUpNodeCheck;
			}

			// if (top.BX(this.id + '_time_from_div') && top.BX(this.id + '_time_from_div').style.display !== 'none')
			// 	return true;
			//
			// if (top.BX(this.id + '_time_to_div') && top.BX(this.id + '_time_to_div').style.display !== 'none')
			// 	return true;

			return this.denyClose;
		}
		needToShowConfirmPopup() {
			return this.doShowConfirmPopup && this.formDataChanged();
		}
		setCurrentEntry(entry = null, userIndex = null) {
			this.invalidatePlannerData();
			const currentSectionId = this.getCurrentSectionId();
			this.entry = calendar_entry.EntryManager.getEntryInstance(entry, userIndex, {
				type: this.type,
				ownerId: this.ownerId
			});
			if (!calendar_util.Util.getCalendarContext() && this.type === 'group') {
				this.entry.setSectionId(currentSectionId);
			}
			calendar_entry.EntryManager.registerEntrySlider(this.entry, this);
		}
		getCurrentEntry() {
			return this.entry;
		}
		getCurrentSection() {
			let section = false;
			const sectionId = this.getCurrentSectionId();
			if (sectionId && this.sectionIndex[sectionId] !== undefined && this.sections[this.sectionIndex[sectionId]] !== undefined) {
				section = this.sections[this.sectionIndex[sectionId]];
			}
			return section;
		}
		getCurrentSectionId() {
			let section = 0;
			const entry = this.getCurrentEntry();
			if (entry instanceof calendar_entry.Entry && this.sections[this.sectionIndex[entry.sectionId]]) {
				section = parseInt(entry.sectionId);
			}
			if (!section) {
				if (this.type === 'location') {
					section = calendar_roomsmanager.RoomsManager.getNewEntrySectionId();
				} else {
					if (!calendar_util.Util.getCalendarContext() && this.type === 'group' && this.sections.length) {
						section = this.getSectionIdByCurrentContext();
					} else {
						section = calendar_sectionmanager.SectionManager.getNewEntrySectionId(this.type, this.ownerId);
					}
				}
				if (!this.sectionIndex[section]) {
					section = null;
				}
			}
			if (!section && this.sections[0]) {
				section = parseInt(this.sections[0].ID);
			}
			return section;
		}
		pinField(fieldName) {
			const [placeHolders, placeHoldersAdditional] = this.getPlaceholders();
			const field = placeHoldersAdditional[fieldName];
			const newField = placeHolders[fieldName];
			const fieldHeight = field.offsetHeight;
			field.style.height = `${fieldHeight}px`;
			setTimeout(() => {
				main_core.Dom.addClass(field, 'calendar-hide-field');
			}, 0);
			newField.style.height = '0';
			if (fieldName === 'description') {
				setTimeout(() => {
					if (!this.DOM.descriptionAdditionalWrap) {
						this.DOM.descriptionAdditionalWrap = this.DOM.additionalBlock.querySelector('.calendar-info-panel-description');
					}
					if (this.DOM.descriptionAdditionalWrap) {
						while (this.DOM.descriptionAdditionalWrap.firstChild) {
							newField.appendChild(this.DOM.descriptionAdditionalWrap.firstChild);
						}
					}
					newField.style.height = `${fieldHeight}px`;
				}, 200);
				setTimeout(() => {
					main_core.Dom.removeClass(field, 'calendar-hide-field');
					field.style.display = 'none';
					newField.style.height = '';
					this.pinnedFieldsIndex[fieldName] = true;
					const editor = window.BXHtmlEditor.Get(this.editorId);
					if (editor) {
						editor.CheckAndReInit();
					}
					this.saveSettings();
					this.updateAdditionalBlockState();
				}, 500);
			} else {
				setTimeout(() => {
					while (field.firstChild) {
						newField.appendChild(field.firstChild);
					}
					newField.style.height = `${fieldHeight}px`;
				}, 200);
				setTimeout(() => {
					main_core.Dom.removeClass(field, 'calendar-hide-field');
					field.style.height = '';
					newField.style.height = '';
					this.pinnedFieldsIndex[fieldName] = true;
					this.saveSettings();
					this.updateAdditionalBlockState();
				}, 300);
			}
		}
		unPinField(fieldName) {
			const [placeHolders, placeHoldersAdditional] = this.getPlaceholders();
			const field = placeHolders[fieldName];
			const newField = placeHoldersAdditional[fieldName];
			const fieldHeight = field.offsetHeight;
			field.style.height = `${fieldHeight}px`;
			setTimeout(() => {
				main_core.Dom.addClass(field, 'calendar-hide-field');
			}, 0);
			newField.style.height = '0';
			if (fieldName === 'description') {
				setTimeout(() => {
					if (!this.DOM.descriptionAdditionalWrap) {
						this.DOM.descriptionAdditionalWrap = this.DOM.additionalBlock.querySelector('.calendar-info-panel-description');
					}
					if (this.DOM.descriptionAdditionalWrap) {
						while (field.firstChild) {
							this.DOM.descriptionAdditionalWrap.appendChild(field.firstChild);
						}
					}
					newField.style.display = '';
					newField.style.height = `${fieldHeight}px`;
				}, 200);
				setTimeout(() => {
					main_core.Dom.removeClass(field, 'calendar-hide-field');
					field.style.height = '';
					newField.style.height = '';
					this.pinnedFieldsIndex[fieldName] = false;
					const editor = window.BXHtmlEditor.Get(this.editorId);
					if (editor) {
						editor.CheckAndReInit();
					}
					this.saveSettings();
					this.updateAdditionalBlockState();
				}, 300);
			} else {
				setTimeout(() => {
					while (field.firstChild) {
						newField.appendChild(field.firstChild);
					}
					newField.style.height = `${fieldHeight}px`;
				}, 200);
				setTimeout(() => {
					main_core.Dom.removeClass(field, 'calendar-hide-field');
					field.style.height = '';
					newField.style.height = '';
					this.pinnedFieldsIndex[fieldName] = false;
					this.saveSettings();
					this.updateAdditionalBlockState();
				}, 300);
			}
		}
		fieldIsPinned(fieldName) {
			return this.pinnedFieldsIndex[fieldName];
		}
		getPlaceholders() {
			if (!this.placeHolders) {
				this.placeHolders = {};
				this.placeHoldersAdditional = {};
				let i;
				let fieldId;
				let nodes = this.DOM.formWrap.querySelectorAll('.calendar-field-additional-placeholder');
				for (i = 0; i < nodes.length; i++) {
					fieldId = nodes[i].getAttribute('data-bx-block-placeholer');
					if (fieldId) {
						this.placeHoldersAdditional[fieldId] = nodes[i];
					}
				}
				nodes = this.DOM.formWrap.querySelectorAll('.calendar-field-placeholder');
				for (i = 0; i < nodes.length; i++) {
					fieldId = nodes[i].getAttribute('data-bx-block-placeholer');
					if (fieldId) {
						this.placeHolders[fieldId] = nodes[i];
					}
				}
			}
			return [this.placeHolders, this.placeHoldersAdditional];
		}
		getSettings(settings) {
			this.pinnedFieldsIndex = {};
			let i;
			const pinnedFields = [];
			for (i in settings.pinnedFields) {
				if (settings.pinnedFields.hasOwnProperty(i)) {
					pinnedFields.push(settings.pinnedFields[i]);
					this.pinnedFieldsIndex[settings.pinnedFields[i]] = true;
				}
			}
			settings.pinnedFields = pinnedFields;
			return settings;
		}
		saveSettings() {
			let fieldName;
			const pinnedFields = [];
			for (fieldName in this.pinnedFieldsIndex) {
				if (this.pinnedFieldsIndex.hasOwnProperty(fieldName) && this.pinnedFieldsIndex[fieldName]) {
					pinnedFields.push(fieldName);
				}
			}
			this.formSettings.pinnedFields = pinnedFields;
			this.BX.userOptions.save('calendar', this.formType, 'pinnedFields', pinnedFields);
		}
		updateAdditionalBlockState(timeout) {
			if (timeout === false) {
				main_core.Dom.clean(this.DOM.pinnedNamesWrap);
				const additionalFields = [...this.DOM.additionalBlock.querySelectorAll('.calendar-field-additional-placeholder[data-bx-block-placeholer]')].filter(field => field.innerText !== '' && field.style.display !== 'none');
				const fieldButtons = additionalFields.map(field => main_core.Dom.create('SPAN', {
					attrs: {
						'data-bx-field-id': field.getAttribute('data-bx-block-placeholer')
					},
					props: {
						className: 'calendar-additional-alt-promo-text'
					},
					html: field.querySelector('.js-calendar-field-name').innerText
				}));
				this.DOM.pinnedNamesWrap.append(...fieldButtons);
				this.bindAdditionalFieldButtons(fieldButtons);
				if (fieldButtons.length === 0) {
					main_core.Dom.addClass(this.DOM.additionalBlockWrap, 'calendar-additional-block-hidden');
				} else if (main_core.Dom.hasClass(this.DOM.additionalBlockWrap, 'calendar-additional-block-hidden')) {
					main_core.Dom.removeClass(this.DOM.additionalBlockWrap, 'calendar-additional-block-hidden');
				}
				this.checkLastItemBorder();
			} else {
				if (this.updateAdditionalBlockTimeout) {
					clearTimeout(this.updateAdditionalBlockTimeout);
					this.updateAdditionalBlockTimeout = null;
				}
				this.updateAdditionalBlockTimeout = setTimeout(() => {
					this.updateAdditionalBlockState(false);
				}, 300);
			}
		}
		bindAdditionalFieldButtons(fieldButtons) {
			for (const fieldButton of fieldButtons) {
				const fieldId = fieldButton.getAttribute('data-bx-field-id');
				if (!this.canEdit() && this.getFieldsEditableOnlyByPermission().includes(fieldId)) {
					fieldButton.remove();
					continue;
				}
				main_core.Event.bind(fieldButton, 'click', event => {
					const fieldWrap = document.querySelector(`.calendar-openable-block [data-bx-block-placeholer=${fieldId}]`);
					this.highlightField(fieldWrap);
					if (this.isAdditionalBlockOpened()) {
						event.stopPropagation();
					}
				});
			}
		}
		getFieldsEditableOnlyByPermission() {
			return ['description', 'private', 'crm'];
		}
		highlightField(fieldWrap) {
			main_core.Dom.addClass(fieldWrap, 'calendar-field-highlighted');
			const fieldAbsoluteTop = this.DOM.content.scrollTop + fieldWrap.getBoundingClientRect().top;
			this.highlightFieldScrollAnimation = new BX.easing({
				duration: 400,
				start: {
					scroll: this.DOM.content.scrollTop
				},
				finish: {
					scroll: fieldAbsoluteTop
				},
				transition: BX.easing.makeEaseOut(BX.easing.transitions.quart),
				step: state => {
					this.DOM.content.scrollTop = state.scroll;
				},
				complete: () => {}
			});
			this.highlightFieldScrollAnimation.animate();
			clearTimeout(fieldWrap.highlightTimeout);
			fieldWrap.highlightTimeout = setTimeout(() => BX.Dom.removeClass(fieldWrap, 'calendar-field-highlighted'), 2500);
		}
		isAdditionalBlockOpened() {
			return main_core.Dom.hasClass(this.DOM.additionalSwitch, 'opened');
		}
		checkLastItemBorder() {
			const noBorderClass = 'no-border';
			let i;
			let nodes;
			nodes = this.DOM.mainBlock.querySelectorAll('.calendar-options-item-border');
			for (i = 0; i < nodes.length; i++) {
				if (i === nodes.length - 1) {
					main_core.Dom.addClass(nodes[i], noBorderClass);
				} else {
					main_core.Dom.removeClass(nodes[i], noBorderClass);
				}
			}
			nodes = this.DOM.additionalBlock.querySelectorAll('.calendar-options-item-border');
			for (i = 0; i < nodes.length; i++) {
				if (i === nodes.length - 1) {
					main_core.Dom.addClass(nodes[i], noBorderClass);
				} else {
					main_core.Dom.removeClass(nodes[i], noBorderClass);
				}
			}
		}
		handlePlannerSelectorChanges(event) {
			if (event instanceof main_core_events.BaseEvent) {
				const data = event.getData();
				const currentDateTime = this.dateTimeControl.getValue();

				// The planner reports a single-zone (displayTimezone) interval. Invert the forward projection
				// from onDateTimeControlChange: express each boundary back in its own effective zone so the
				// control keeps per-boundary wall-clock, otherwise a boundary with a changed zone would carry
				// the display wall-clock under its new zone and shift its absolute time on save.
				const displayTimezone = this.getDisplayTimezone();
				const controlTimezoneFrom = this.getControlTimezone(currentDateTime.timezoneFrom);
				const controlTimezoneTo = this.getControlTimezone(currentDateTime.timezoneTo);
				const useUtcControl = currentDateTime.utc === true;
				const controlFrom = data.fullDay ? useUtcControl ? toUtcWallClock(data.dateFrom) : data.dateFrom : useUtcControl ? expressWallClockInTimezone(data.dateFrom, displayTimezone, controlTimezoneFrom) : this.expressBoundaryInTimezone(data.dateFrom, displayTimezone, controlTimezoneFrom);
				const controlTo = data.fullDay ? useUtcControl ? toUtcWallClock(data.dateTo) : data.dateTo : useUtcControl ? expressWallClockInTimezone(data.dateTo, displayTimezone, controlTimezoneTo) : this.expressBoundaryInTimezone(data.dateTo, displayTimezone, controlTimezoneTo);

				// Date time
				this.dateTimeControl.setValue({
					from: controlFrom,
					to: controlTo,
					fullDay: data.fullDay,
					timezoneFrom: currentDateTime.timezoneFrom,
					timezoneTo: currentDateTime.timezoneTo,
					utc: useUtcControl
				});
				const dateTime = this.dateTimeControl.getValue();
				const preview = this.updateTimezoneProjection(dateTime);
				const locationInstant = !dateTime.fullDay ? {
					from: getWallClockInstant(dateTime.from, this.getControlTimezone(dateTime.timezoneFrom), dateTime.utc === true),
					to: getWallClockInstant(dateTime.to, this.getControlTimezone(dateTime.timezoneTo), dateTime.utc === true)
				} : null;
				if (this.locationSelector) {
					this.locationSelector.checkLocationAccessibility({
						from: preview.from,
						to: preview.to,
						timezone: preview.timezone,
						fullDay: data.fullDay,
						currentEventId: this.entry.id,
						fromTsUtc: locationInstant?.from,
						toTsUtc: locationInstant?.to
					});
				}
				if (this.planner) {
					const fromHours = parseInt(data.dateFrom.getHours()) + Math.floor(data.dateFrom.getMinutes() / 60);
					const toHours = parseInt(data.dateTo.getHours()) + Math.floor(data.dateTo.getMinutes() / 60);
					if (fromHours !== 0 && fromHours <= this.planner.shownScaleTimeFrom || toHours !== 0 && toHours !== 23 && toHours + 1 >= this.planner.shownScaleTimeTo) {
						this.planner.updateSelector(data.dateFrom, data.dateTo, data.fullDay);
					}
				}
			}
		}
		handleExpandPlannerTimeline(event) {
			if (event instanceof main_core_events.BaseEvent) {
				const data = event.getData();
				if (data.reload) {
					this.prevUserList = [];
					this.dateTimeControl.getValue();
					this.loadPlannerData({
						entityList: this.getUserSelectorEntityList(),
						from: calendar_util.Util.formatDate(data.dateFrom),
						to: calendar_util.Util.formatDate(data.dateTo),
						timezone: this.getDisplayTimezone(),
						location: this.locationSelector.getTextValue(),
						focusSelector: false
					});
				}
			}
		}
		getUserSelectorEntityList() {
			return this.selectorEntityList;
		}
		setUserSelectorEntityList(selectorEntityList) {
			this.invalidatePlannerData();
			this.selectorEntityList = selectorEntityList;
		}
		invalidatePlannerData() {
			this.plannerDataRequestId += 1;
			this.plannerDataContext = null;
			this.loadedAccessibilityData = {};
			this.prevUserList = [];
		}
		refreshPlannerState() {
			const dateTime = this.dateTimeControl.getValue();
			this.loadPlannerData({
				entityList: this.isOpenEvent ? [] : this.getUserSelectorEntityList(),
				from: calendar_util.Util.formatDate(dateTime.from.getTime() - calendar_util.Util.getDayLength() * 3),
				to: calendar_util.Util.formatDate(dateTime.to.getTime() + calendar_util.Util.getDayLength() * 10),
				timezone: this.getDisplayTimezone(),
				location: this.locationSelector.getTextValue()
			});
		}
		checkLocationForm(event) {
			if (!this.isCollabUser && event && event instanceof main_core_events.BaseEvent) {
				const data = event.getData();
				// the truncated planner renders the organizer only, so capacity
				// must be checked against the full people count from the response
				const usersCount = this.plannerLimitState?.exceeded ? Math.max(data.usersCount, this.plannerLimitState.peopleCount) : data.usersCount;
				if (this.locationCapacity !== 0) {
					calendar_controls.Location.setCurrentCapacity(this.locationCapacity);
					this.locationCapacity = 0;
				}
				let locationCapacity = calendar_controls.Location.getCurrentCapacity() || 0;
				if (this.locationSelector.value.type === undefined && locationCapacity) {
					locationCapacity = 0;
					calendar_controls.Location.setCurrentCapacity(0);
				}
				if (locationCapacity < usersCount && locationCapacity !== 0) {
					this.locationSelector.addCapacityAlert();
				} else {
					this.locationSelector.removeCapacityAlert();
				}
			}
		}
		plannerIsShown() {
			return this.DOM.plannerWrap && main_core.Dom.hasClass(this.DOM.plannerWrap, 'calendar-edit-planner-wrap-shown');
		}
		keyHandler(e) {
			if ((e.ctrlKey || e.metaKey) && !e.altKey && e.keyCode === calendar_util.Util.getKeyCode('enter') && this.checkTopSlider() && !this.isAdditionalPopupShown()) {
				if (this.busyUsersDialog && this.busyUsersDialog.isShown()) {
					return;
				}
				this.save();
			}
		}
		isAdditionalPopupShown() {
			return this.DOM.locationRepeatBusyErrorPopup?.getPopupWindow()?.isShown();
		}
		checkTopSlider() {
			const slider = calendar_util.Util.getBX().SidePanel.Instance.getTopSlider();
			return slider && slider.getData().get('type') === 'calendar:slider';
		}
		showError(errorList) {
			let errorText = '';
			if (main_core.Type.isArray(errorList)) {
				errorList.forEach(error => {
					if (error.code === 'edit_entry_location_busy' || error.code === 'edit_entry_location_busy_recurrence') {
						this.locationBusyAlert = calendar_util.Util.showFieldError(error.message, this.DOM.locationErrorWrap, {
							clearTimeout: 10000
						});
						if (main_core.Type.isDomNode(this.locationBusyAlert)) {
							main_core.Dom.attr(this.locationBusyAlert, 'role', 'alert');
						}
						return;
					}
					if (error.code === 'edit_entry_location_repeat_busy') {
						this.showLocationRepeatBusyErrorPopup(error.message);
						return;
					}
					errorText += `${error.message}\n`;
				});
			}
			if (errorText !== '') {
				alert(errorText);
			}
		}
		showLocationRepeatBusyErrorPopup(message) {
			if (!this.DOM.locationRepeatBusyErrorPopup) {
				this.DOM.locationRepeatBusyErrorPopup = calendar_entry.EntryManager.getLocationRepeatBusyErrorPopup({
					message,
					onYesCallback: () => {
						if (main_core.Type.isDomNode(this.locationBusyAlert)) {
							main_core.Dom.remove(this.locationBusyAlert);
							this.locationBusyAlert = null;
						}
						this.lastUsedSaveOptions.doCheckOccupancy = 'N';
						this.DOM.locationRepeatBusyErrorPopup.close();
						this.save(this.lastUsedSaveOptions);
						this.lastUsedSaveOptions = {};
					},
					onCancelCallback: () => {
						this.lastUsedSaveOptions = {};
						this.DOM.locationRepeatBusyErrorPopup.close();
					},
					onPopupCloseCallback: () => {
						delete this.DOM.locationRepeatBusyErrorPopup;
					}
				});
				this.DOM.locationRepeatBusyErrorPopup.show();
			}
		}
		getFormDataChanges(excludes = []) {
			if (!this.DOM.form) {
				return [];
			}
			const entry = this.entry;
			const fields = [];

			// Name
			if (!excludes.includes('name') && entry.name !== this.DOM.form.name.value) {
				fields.push('name');
			}

			// Description
			if (!excludes.includes('description') && entry.getDescription() !== this.DOM.form.desc.value) {
				fields.push('description');
			}

			// Location
			if (!excludes.includes('location') && !calendar_controls.Location.isSameLocation(this.entry.getLocation(), this.locationSelector.getTextValue())) {
				fields.push('location');
			}

			// Date + time
			const dateTime = this.dateTimeControl.getValue();
			const initialDateTime = this.initialDisplaySnapshot || entry;
			if (!excludes.includes('date&time') && (this.hasHandoffDateTimeChange() || this.explicitTimezoneIntent || this.hasDateTimeWallClockChange(dateTime, initialDateTime))) {
				fields.push('date&time');
			}

			// Section
			if (this.sectionSelectorEnabled && !excludes.includes('section') && Number(this.initialSectionId) !== Number(this.DOM.sectionInput.value)) {
				fields.push('section');
			}

			// Access codes
			if (this.attendeesControlEnabled && !excludes.includes('codes') && this.getUserSelectorEntityList().map(item => {
				return item.entityId + ':' + item.id;
			}).join('|') !== entry.getAttendeesEntityList().map(item => {
				return item.entityId + ':' + item.id;
			}).join('|')) {
				fields.push('codes');
			}
			if (!excludes.includes('color')) {
				const entryColor = (entry.data.COLOR || this.getCurrentSection().COLOR).toLowerCase();
				if (entryColor !== this.colorSelector.getValue().toLowerCase()) {
					fields.push('color');
				}
			}
			if (!excludes.includes('reminder')) {
				const reminder = entry.getReminders();
				if (main_core.Type.isArrayFilled(reminder) && reminder.length !== this.reminderValues.length) {
					fields.push('reminder');
				}
			}
			if (this.wasRruleChanged()) {
				fields.push('rrule');
			}
			if (this.DOM.privateEventCheckbox && this.DOM.privateEventCheckbox.checked !== entry.isPrivate()) {
				fields.push('private');
			}
			if (this.DOM.importantEventCheckbox && this.DOM.importantEventCheckbox.checked !== entry.important) {
				fields.push('important');
			}
			const initialControlTimezoneFrom = this.initialControlTimezoneFrom || this.initialTimezoneFrom;
			const initialControlTimezoneTo = this.initialControlTimezoneTo || this.initialTimezoneTo;
			if (this.DOM.form.tz_from.dataset.value !== initialControlTimezoneFrom) {
				fields.push('tz_from');
			}
			if (this.DOM.form.tz_to.dataset.value !== initialControlTimezoneTo) {
				fields.push('tz_to');
			}
			const currentUFCrm = entry.data.UF_CRM_CAL_EVENT || [];
			const newUFCrm = new FormData(this.DOM.form).getAll('UF_CRM_CAL_EVENT[]');
			if (JSON.stringify(currentUFCrm.sort()) !== JSON.stringify(newUFCrm.sort())) {
				fields.push('uf_crm');
			}
			if (!excludes.includes('meeting_notify') && main_core.Type.isBoolean(this.initialMeetingNotify) && this.DOM.form.meeting_notify.checked !== this.initialMeetingNotify) {
				fields.push('meeting_notify');
			}
			if (!excludes.includes('hide_guests') && main_core.Type.isBoolean(this.initialHideGuests) && this.DOM.form.hide_guests.checked !== this.initialHideGuests) {
				fields.push('hide_guests');
			}
			if (!excludes.includes('allow_invite') && main_core.Type.isBoolean(this.initialAllowInvite) && this.DOM.form.allow_invite.checked !== this.initialAllowInvite) {
				fields.push('allow_invite');
			}
			if (this.DOM.accessibilityInput && this.DOM.accessibilityInput.dataset.value !== entry.accessibility) {
				fields.push('accessibility');
			}
			const formMaxAttendees = parseInt(this.DOM.form?.max_attendees?.value, 10) || 0;
			const optionsJson = entry?.data?.OPTIONS?.OPTIONS ?? null;
			const eventMaxAttendees = JSON.parse(optionsJson)?.max_attendees ?? 0;
			if (formMaxAttendees !== eventMaxAttendees) {
				fields.push('max_attendees');
			}
			const currentUfWebDavCalEnv = this.entry.data.UF_WEBDAV_CAL_EVENT || [];
			const newUfWebDavCalEnv = new FormData(this.DOM.form).getAll('UF_WEBDAV_CAL_EVENT[]').filter(Boolean);
			if (JSON.stringify(currentUfWebDavCalEnv.sort()) !== JSON.stringify(newUfWebDavCalEnv.sort())) {
				fields.push('UF_WEBDAV_CAL_EVENT[]');
			}
			return fields;
		}

		// A compact -> full handoff always carries formDataValue.from/to, so handoffIntent alone must not
		// mark date&time changed. Report a change only when the handed-off interval actually differs from the
		// loaded event; compare canonical serialized fields (minute granularity) to stay robust against
		// sub-minute representation drift between the compact and full load paths.
		hasHandoffDateTimeChange() {
			if (this.handoffIntent !== true) {
				return false;
			}
			const entry = this.entry;
			const handoffFrom = this.formDataValue.from;
			const handoffTo = this.formDataValue.to;
			if (!main_core.Type.isDate(handoffFrom) || !main_core.Type.isDate(handoffTo) || !main_core.Type.isDate(entry?.from) || !main_core.Type.isDate(entry?.to)) {
				return true;
			}
			const handoffFullDay = main_core.Type.isBoolean(this.formDataValue.fullDay) ? this.formDataValue.fullDay : entry.fullDay;
			if (handoffFullDay !== entry.fullDay) {
				return true;
			}
			if (calendar_util.Util.formatDate(handoffFrom) !== calendar_util.Util.formatDate(entry.from) || calendar_util.Util.formatDate(handoffTo) !== calendar_util.Util.formatDate(entry.to)) {
				return true;
			}
			return !handoffFullDay && (calendar_util.Util.formatTime(handoffFrom) !== calendar_util.Util.formatTime(entry.from) || calendar_util.Util.formatTime(handoffTo) !== calendar_util.Util.formatTime(entry.to));
		}
		wasRruleChanged() {
			return JSON.stringify(this.getFormRrule()) !== JSON.stringify(this.initialRrule) && !this.entry.hasRecurrenceId();
		}
		getFormRrule() {
			const formData = new FormData(this.DOM.form);
			const endsOn = formData.get('rrule_endson');
			const rruleType = this.DOM.content.querySelector(`#${this.uid}_rrule_type`);
			const FREQ = rruleType?.dataset?.value ?? 'NONE';
			let INTERVAL = parseInt(formData.get('EVENT_RRULE[INTERVAL]'), 10) || null;
			let COUNT = null;
			let UNTIL = null;
			let BYDAY = null;
			if (endsOn === 'count') {
				const defaultCount = 10;
				COUNT = parseInt(formData.get('EVENT_RRULE[COUNT]'), 10) || defaultCount;
			}
			if (endsOn === 'until') {
				UNTIL = formData.get('EVENT_RRULE[UNTIL]');
			}
			if (FREQ === 'NONE') {
				INTERVAL = null;
				COUNT = null;
				UNTIL = null;
			}
			if (FREQ === 'WEEKLY') {
				BYDAY = formData.getAll('EVENT_RRULE[BYDAY][]');
			}
			return {
				FREQ,
				INTERVAL,
				COUNT,
				UNTIL,
				BYDAY
			};
		}
		checkCurrentUsersAccessibility() {
			return this.getFormDataChanges().includes('date&time');
		}
		formDataChanged() {
			return this.getFormDataChanges().length > 0;
		}
		getUserCodes() {
			const codes = [];
			const valuesInput = this.DOM.attendeesWrap.querySelectorAll('input[name="EVENT_DESTINATION[]"]');
			for (const element of valuesInput) {
				if (!codes.includes(element.value)) {
					codes.push(element.value);
				}
			}
			return codes;
		}
		handlePull(event) {
			if (!event instanceof main_core_events.BaseEvent) {
				return;
			}
			const data = event.getData();
			const command = data[0];
			const params = main_core.Type.isObjectLike(data[1]) ? data[1] : {};
			switch (command) {
				case 'edit_event':
				case 'delete_event':
				case 'set_meeting_status':
					const userIdList = main_core.Type.isArray(params?.fields?.ATTENDEES) ? params.fields.ATTENDEES : [];
					const eventOwner = params?.fields?.CAL_TYPE === 'user' ? parseInt(params?.fields?.OWNER_ID) : parseInt(params?.fields?.CREATED_BY);
					if (!userIdList.includes(eventOwner)) {
						userIdList.push(eventOwner);
					}
					this.clearAccessibilityData(userIdList);
					this.refreshPlannerState();
					break;
			}
		}
		clearAccessibilityData(userIdList) {
			if (main_core.Type.isArray(userIdList) && userIdList.length > 0 && this.prevUserList.length > 0) {
				this.prevUserList = this.prevUserList.filter(userId => !userIdList.includes(userId));
			}
		}
		getParticipantsSelectorEntityList() {
			if (this.participantsSelectorEntityList && this.participantsSelectorEntityList.length > 0) {
				return this.participantsSelectorEntityList;
			}
			let entityList = [{
				id: 'user',
				options: {
					inviteEmployeeLink: this.canEdit(),
					inviteGuestLink: this.canEdit(),
					emailUsers: calendar_util.Util.isEventWithEmailGuestAllowed() && this.canEdit(),
					analyticsSource: 'calendar',
					lockGuestLink: !calendar_util.Util.isEventWithEmailGuestAllowed(),
					lockGuestLinkFeatureId: 'calendar_events_with_email_guests'
				},
				filters: [{
					id: 'calendar.attendeeFilter',
					options: {
						isSharingEvent: this.entry.isSharingEvent(),
						eventId: this.entry.id
					}
				}]
			}, {
				id: 'department',
				options: {
					selectMode: 'usersAndDepartments'
				}
			}, {
				id: 'meta-user',
				options: {
					'all-users': true
				}
			}];
			if (this.isProjectFeatureEnabled) {
				entityList.push({
					id: 'project'
				});
			}
			if (calendar_util.Util.isTeamsAsAttendeeEnabled()) {
				// HR `structure-node` provider; backend maps structure-node <-> SNT<id>.
				// useMultipleTabs enables the team-fetch branch (flat, no depthLevel), otherwise
				// teams are queried at depthLevel 1 and the list comes back empty.
				entityList.push({
					id: 'structure-node',
					options: {
						includedNodeEntityTypes: ['team'],
						useMultipleTabs: true,
						// departmentsOnly gives a single selectable "Select team" item with the simple
						// (flat) access code SNT<id> and a numeric id — matches calendar's backend
						// mapping (strict ^SNT[0-9]+$). usersAndDepartments would also add the
						// recursive "team + subteams" option (SNTR<id>, ignored by calendar backend),
						// and allowFlatDepartments appends a ':F' postfix that the mapping can't parse.
						selectMode: 'departmentsOnly',
						visual: {
							avatarMode: 'node',
							tagStyle: 'none'
						}
					}
				});
			}
			if (this.attendeesPreselectedItems) {
				let projectRole = null;
				this.attendeesPreselectedItems.forEach(item => {
					const type = item[0];
					const role = item[1];
					if (type === 'project-roles') {
						projectRole = role;
					}
				});
				if (projectRole) {
					entityList = [{
						id: 'user'
					}, {
						id: 'project-roles',
						options: {
							projectId: projectRole.split('_')[0]
						},
						dynamicLoad: true
					}];
				}
			}
			return entityList;
		}
		isSyncSection(section) {
			return section.EXTERNAL_TYPE === 'icloud' || section.EXTERNAL_TYPE === 'google' || section.EXTERNAL_TYPE === 'office365' || section.connectionLinks && section.connectionLinks.length > 0;
		}
		getSectionsForEditEvent(sections, currentSection) {
			const result = [];
			const currentType = currentSection.CAL_TYPE;
			result.push(currentSection);
			sections.forEach(section => {
				if (!this.isSyncSection(section) && section.CAL_TYPE === currentType) {
					result.push(section);
				}
			});
			this.sections = result;
			this.sectionIndex = [];
			if (main_core.Type.isArray(this.sections)) {
				this.sections.forEach((value, ind) => {
					this.sectionIndex[parseInt(value.ID)] = ind;
				});
			}
		}
		unsetHiddenSection(section, sectionManager) {
			const sectId = parseInt(section.ID);
			if (!sectionManager.sectionIsShown(sectId)) {
				let hiddenSections = sectionManager.getHiddenSections();
				hiddenSections = hiddenSections.filter(sectionId => {
					return sectionId !== sectId;
				});
				sectionManager.setHiddenSections(hiddenSections);
				sectionManager.saveHiddenSections();
			}
		}
		isCreateForm() {
			return !this.isEditForm();
		}
		isEditForm() {
			return parseInt(this.entry.id) > 0;
		}
		isCollabContext() {
			const currentSection = this.getCurrentSection();
			return currentSection && main_core.Type.isFunction(currentSection.isCollab) ? currentSection.isCollab() : currentSection.IS_COLLAB;
		}
		getSectionIdByCurrentContext() {
			const sectionObj = this.sections.find(section => parseInt(section.OWNER_ID, 10) === this.ownerId && section.CAL_TYPE === this.type);
			return sectionObj && parseInt(sectionObj.ID, 10);
		}
	}

	exports.EventEditForm = EventEditForm;

})(this.BX.Calendar = this.BX.Calendar || {}, BX.Calendar.Controls, BX.Calendar, BX.Calendar, BX.Calendar, BX.Calendar, BX.Calendar, BX, BX.Main, BX.Event, BX.UI.EntitySelector);
//# sourceMappingURL=eventeditform.bundle.js.map
