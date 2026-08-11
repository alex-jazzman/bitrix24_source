/* eslint-disable */
this.BX = this.BX || {};
this.BX.Calendar = this.BX.Calendar || {};
(function (exports, main_core, main_core_events, main_popup, calendar_sharing_analytics, calendar_util, main_date, ui_entitySelector, ui_iconSet_actions, ui_avatar, ui_iconSet_api_core, ui_dialogs_messagebox, ui_buttons, main_qrcode, ui_designTokens, main_loader, ui_switcher, spotlight, ui_tour, ui_cnt, ui_infoHelper) {
	'use strict';

	class RangeModel extends main_core_events.EventEmitter {
		#calendarSettings;
		constructor(params) {
			super();
			this.setEventNamespace('Calendar.Sharing.Range');
			const {
				id,
				range,
				rule,
				calendarSettings,
				isNew
			} = params;
			this.id = id;
			this.rule = rule;
			this.from = range.from;
			this.to = range.to;
			this.new = isNew;
			this.deletable = false;
			this.#calendarSettings = calendarSettings;
			this.setWeekDays(range.weekdays);
		}
		toArray() {
			return {
				from: this.getFrom(),
				to: this.to,
				weekdays: this.getWeekDays()
			};
		}
		getRule() {
			return this.rule;
		}
		getId() {
			return this.id;
		}
		getFromFormatted() {
			return this.formatMinutes(this.getFrom());
		}
		getFrom() {
			return this.from;
		}
		setFrom(value) {
			this.from = parseInt(value, 10);
			if (this.from + this.#getSlotSize() > this.to) {
				this.to = this.from + this.#getSlotSize();
			}
			this.updated();
		}
		getToFormatted() {
			return this.formatMinutes(this.getTo());
		}
		getTo() {
			return this.to;
		}
		setTo(value) {
			this.to = value;
			this.updated();
		}
		updateSlotSize() {
			const maxFrom = 24 * 60 - this.#getSlotSize();
			if (this.from > maxFrom) {
				this.from = maxFrom;
				this.to = this.from + this.#getSlotSize();
			} else if (this.from + this.#getSlotSize() > this.to) {
				this.to = this.from + this.#getSlotSize();
			}
			this.updated();
		}
		addWeekday(weekday) {
			if (this.weekdays.includes(weekday)) {
				return;
			}
			this.setWeekDays([...this.weekdays, weekday]);
		}
		removeWeekday(weekday) {
			this.setWeekDays(this.weekdays.filter(w => w !== weekday));
		}
		getWeekDays() {
			return this.weekdays;
		}
		setWeekDays(weekdays) {
			this.weekdays = this.sortWeekdays(weekdays);
			this.updated();
		}
		getWeekdaysTitle(forceLong = false) {
			if ([...this.weekdays].sort().join(',') === [1, 2, 3, 4, 5].sort().join(',')) {
				return main_core.Loc.getMessage('CALENDAR_SHARING_SETTINGS_WORKDAYS_MSGVER_1');
			}
			return this.formatWeekdays(forceLong);
		}
		formatWeekdays(forceLong) {
			const weekdaysLoc = calendar_util.Util.getWeekdaysLoc(forceLong || this.weekdays.length === 1);
			const weekdays = this.getWeekDays();
			if (weekdays.length === 0) {
				return '';
			}
			return weekdays.map(w => weekdaysLoc[w]).reduce((a, b) => `${a}, ${b}`);
		}
		sortWeekdays(weekdays) {
			return weekdays.map(w => w < this.#calendarSettings.weekStart ? w + 10 : w).sort((a, b) => a - b).map(w => w % 10);
		}
		getAvailableTimeFrom() {
			const timeStamps = [];
			const maxFrom = 24 * 60 - this.#getSlotSize();
			for (let hour = 0; hour <= 24; hour++) {
				if (hour * 60 <= maxFrom) {
					timeStamps.push({
						value: hour * 60,
						name: calendar_util.Util.formatTime(hour, 0)
					});
				}
				if (hour !== 24 && hour * 60 + 30 <= maxFrom) {
					timeStamps.push({
						value: hour * 60 + 30,
						name: calendar_util.Util.formatTime(hour, 30)
					});
				}
			}
			return timeStamps;
		}
		getAvailableTimeTo() {
			const timeStamps = [];
			for (let hour = 0; hour <= 24; hour++) {
				if (hour * 60 >= this.from + this.#getSlotSize()) {
					timeStamps.push({
						value: hour * 60,
						name: calendar_util.Util.formatTime(hour, 0)
					});
				}
				if (hour !== 24 && hour * 60 + 30 >= this.from + this.#getSlotSize()) {
					timeStamps.push({
						value: hour * 60 + 30,
						name: calendar_util.Util.formatTime(hour, 30)
					});
				}
			}
			return timeStamps;
		}
		isDeletable() {
			return this.deletable;
		}
		setDeletable(deletable) {
			this.deletable = deletable;
		}
		isNew() {
			return this.new;
		}
		setNew(isNew) {
			this.new = isNew;
		}
		#getSlotSize() {
			return this.rule.getSlotSize();
		}
		getWeekStart() {
			return this.#calendarSettings.weekStart;
		}
		formatMinutes(minutes) {
			const date = new Date(calendar_util.Util.parseDate('01.01.2000').getTime() + minutes * 60 * 1000);
			return calendar_util.Util.formatTime(date);
		}
		updated() {
			this.emit('updated');
			this.getRule().updated();
		}
	}

	class RuleModel extends main_core_events.EventEmitter {
		AVAILABLE_INTERVALS = [30, 45, 60, 90, 120, 180];
		MAX_RANGES = 5;
		DEFAULT_SLOT_SIZE = 60;
		#calendarSettings;
		constructor(params) {
			super();
			this.setEventNamespace('Calendar.Sharing.Rule');
			const {
				rule,
				calendarSettings
			} = params;
			this.#calendarSettings = calendarSettings;
			this.ranges = [];
			for (const range of rule.ranges) {
				this.addRange(range, false);
			}
			this.setSlotSize(rule.slotSize);
			this.sortRanges();
		}
		toArray() {
			return {
				slotSize: this.getSlotSize(),
				ranges: this.getSortedRanges().map(range => range.toArray())
			};
		}
		getDefaultRule() {
			return new RuleModel({
				rule: {
					slotSize: this.DEFAULT_SLOT_SIZE,
					ranges: [{
						from: this.#calendarSettings.workTimeStart,
						to: this.#calendarSettings.workTimeEnd,
						weekdays: this.#calendarSettings.workDays
					}]
				},
				calendarSettings: this.#calendarSettings
			});
		}
		getAvailableIntervals() {
			return this.AVAILABLE_INTERVALS;
		}
		getFormattedSlotSize() {
			return calendar_util.Util.formatDuration(this.getSlotSize());
		}
		getSlotSize() {
			return this.slotSize;
		}
		setSlotSize(value) {
			const slotSize = parseInt(value, 10);
			this.slotSize = this.getAvailableIntervals().includes(slotSize) ? slotSize : this.DEFAULT_SLOT_SIZE;
			for (const range of this.getRanges()) {
				range.updateSlotSize();
			}
		}
		getRanges() {
			return this.ranges;
		}
		sortRanges() {
			this.ranges = this.getSortedRanges();
		}
		getSortedRanges() {
			return [...this.ranges].sort((a, b) => this.compareRanges(a, b));
		}
		compareRanges(firstRange, secondRange) {
			const firstWeekdaysWeight = this.getWeekdaysWeight(firstRange.getWeekDays());
			const secondWeekdaysWeight = this.getWeekdaysWeight(secondRange.getWeekDays());
			if (firstWeekdaysWeight !== secondWeekdaysWeight) {
				return firstWeekdaysWeight - secondWeekdaysWeight;
			}
			if (firstRange.getFrom() !== secondRange.getFrom()) {
				return firstRange.getFrom() - secondRange.getFrom();
			}
			return firstRange.getTo() - secondRange.getTo();
		}
		getWeekdaysWeight(weekdays) {
			return weekdays.reduce((accumulator, w, index) => {
				return accumulator + w * 10 ** (10 - index);
			}, 0);
		}
		addRange(range, isNew = true) {
			if (!this.canAddRange()) {
				return;
			}
			this.internalRangeId ??= 1;
			this.ranges.push(new RangeModel({
				id: this.internalRangeId++,
				range: range ?? this.getDefaultRule().getRanges()[0],
				calendarSettings: this.#calendarSettings,
				isNew,
				rule: this
			}));
			this.#updateRanges();
			this.updated();
		}
		removeRange(rangeToRemove) {
			if (!this.canRemoveRange()) {
				return false;
			}
			this.ranges = this.ranges.filter(range => {
				return range.getId() !== rangeToRemove.getId();
			});
			this.#updateRanges();
			this.rangeDeleted();
			return true;
		}
		#updateRanges() {
			for (const range of this.ranges.slice(0, -1)) {
				range.setDeletable(true);
			}
			this.ranges.slice(-1)[0].setDeletable(this.ranges.length === 5);
		}
		canAddRange() {
			return this.ranges.length < this.MAX_RANGES;
		}
		canRemoveRange() {
			return this.ranges.length > 1;
		}
		updated() {
			this.emit('updated');
		}
		rangeDeleted() {
			this.emit('rangeDeleted');
		}
	}

	class SettingsModel {
		#params;
		#rule;
		#memberIds;
		constructor(params) {
			this.#params = params;
			const {
				rule,
				calendarSettings
			} = params;
			this.#rule = this.#createRuleModel(rule, calendarSettings);
		}
		#createRuleModel(rule, calendarSettings) {
			const {
				weekStart,
				weekHolidays,
				workTimeStart,
				workTimeEnd
			} = calendarSettings;
			return new RuleModel({
				rule,
				calendarSettings: {
					weekStart: calendar_util.Util.getIndByWeekDay(weekStart),
					workTimeStart: this.getMinutesFromTime(workTimeStart),
					workTimeEnd: this.getMinutesFromTime(workTimeEnd),
					workDays: this.getWorkingDays(weekHolidays)
				}
			});
		}
		getMinutesFromTime(time) {
			const dateString = new Date().toDateString();
			const date = new Date(`${dateString} ${`${time}`.replace('.', ':')}:00`);
			const shortTimeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			const parsedTime = calendar_util.Util.parseTime(main_date.DateTimeFormat.format(shortTimeFormat, date / 1000));
			return parsedTime.h * 60 + parsedTime.m;
		}
		getWorkingDays(weekHolidays) {
			const weekHolidaysInt = new Set(weekHolidays.map(day => calendar_util.Util.getIndByWeekDay(day)));
			return [0, 1, 2, 3, 4, 5, 6].filter(day => !weekHolidaysInt.has(day));
		}
		isDefaultRule() {
			return !this.isDifferentFrom(this.getRule().getDefaultRule());
		}
		isDifferentFrom(anotherRule) {
			return this.getChanges(anotherRule, this.getRule()).length > 0;
		}
		getChanges(rule) {
			const currentRule = this.getRule().toArray();
			const anotherRule = (rule ?? this.getRule().getDefaultRule()).toArray();
			const sizeChanged = currentRule.slotSize !== anotherRule.slotSize;
			const daysChanged = JSON.stringify(currentRule.ranges) !== JSON.stringify(anotherRule.ranges);
			const changes = [];
			if (daysChanged) {
				changes.push(calendar_sharing_analytics.Analytics.ruleChanges.custom_days);
			}
			if (sizeChanged) {
				changes.push(calendar_sharing_analytics.Analytics.ruleChanges.custom_length);
			}
			return changes;
		}
		sortRanges() {
			this.getRule().sortRanges();
		}
		getRule() {
			return this.#rule;
		}
		getUserInfo() {
			return this.#params.userInfo;
		}
		getContext() {
			return this.#params.context;
		}
		getLinkHash() {
			return this.#params.linkHash;
		}
		getSharingUrl() {
			return this.#params.sharingUrl;
		}
		isCollapsed() {
			return this.#params.collapsed;
		}
		sortJointLinksByFrequentUse() {
			return this.#params.sortJointLinksByFrequentUse;
		}
		getCalendarContext() {
			return this.#params.calendarContext;
		}
		changeSortJointLinksByFrequentUse() {
			this.#params.sortJointLinksByFrequentUse = !this.#params.sortJointLinksByFrequentUse;
			this.#updateSortByFrequentUse();
		}
		setMemberIds(memberIds) {
			this.#memberIds = memberIds;
		}
		getMemberIds() {
			return this.#memberIds;
		}
		async saveJointLink() {
			const action = this.#params.calendarContext?.sharingObjectType === 'group' ? 'calendar.api.sharinggroupajax.generateJointSharingLink' : 'calendar.api.sharingajax.generateUserJointSharingLink';
			const response = await BX.ajax.runAction(action, {
				data: {
					memberIds: this.getMemberIds(),
					groupId: this.#params.calendarContext?.sharingObjectId
				}
			});
			return response.data;
		}
		save() {
			if (!this.isDifferentFrom(this.#createRuleModel(this.#params.rule, this.#params.calendarSettings))) {
				return null;
			}
			const changes = this.getChanges();
			calendar_sharing_analytics.Analytics.sendRuleUpdated(this.getContext(), changes);
			const newRule = this.getRule().toArray();
			return new Promise((resolve, reject) => {
				BX.ajax.runAction('calendar.api.sharingajax.saveLinkRule', {
					data: {
						linkHash: this.getLinkHash(),
						ruleArray: newRule
					}
				}).then(() => {
					main_core_events.EventEmitter.emit('CalendarSharing:RuleUpdated');
					this.#params.rule = newRule;
					resolve();
				}, error => {
					// eslint-disable-next-line no-console
					console.error(error);
					reject();
				});
			});
		}
		increaseFrequentUse() {
			void BX.ajax.runAction('calendar.api.sharingajax.increaseFrequentUse', {
				data: {
					hash: this.getLinkHash()
				}
			});
		}
		updateCollapsed(isCollapsed) {
			void BX.ajax.runAction('calendar.api.sharingajax.updateSharingSettingsCollapsed', {
				data: {
					collapsed: isCollapsed ? 'Y' : 'N'
				}
			});
		}
		#updateSortByFrequentUse() {
			BX.ajax.runAction('calendar.api.sharingajax.setSortJointLinksByFrequentUse', {
				data: {
					sortByFrequentUse: this.#params.sortJointLinksByFrequentUse ? 'Y' : 'N'
				}
			});
		}
	}

	class Weekday {
		constructor(options) {
			this.wrap = null;
			this.name = options.name;
			this.index = options.index;
			this.active = options.active;
			this.onSelected = main_core.Type.isFunction(options.onSelected) ? options.onSelected : () => {};
			this.onDiscarded = main_core.Type.isFunction(options.onDiscarded) ? options.onDiscarded : () => {};
			this.onMouseDown = main_core.Type.isFunction(options.onMouseDown) ? options.onMouseDown : () => {};
			this.canBeDiscarded = main_core.Type.isFunction(options.canBeDiscarded) ? options.canBeDiscarded : () => {};
		}
		render() {
			const className = this.active ? '--selected' : '';
			this.wrap = main_core.Tag.render`
			<div class="calendar-sharing__settings-popup-weekday ${className}" onmousedown="${e => this.handleMouseDown(e)}">
				<div class="calendar-sharing__settings-popup-weekday-text">${this.name}</div>
				<div class="calendar-sharing__settings-popup-weekday-icon"></div>
			</div>
		`;
			return this.wrap;
		}
		handleMouseDown(event) {
			if (this.active) {
				this.discard();
			} else {
				this.select();
			}
			this.onMouseDown(event, this);
		}
		select() {
			this.active = true;
			main_core.Dom.addClass(this.wrap, '--selected');
			this.onSelected();
		}
		discard() {
			if (!this.canBeDiscarded()) {
				return;
			}
			this.active = false;
			main_core.Dom.removeClass(this.wrap, '--selected');
			this.onDiscarded();
		}
	}

	class Range {
		#params;
		#layout;
		constructor(params) {
			this.#params = params;
			this.#layout = {};
			this.showReadOnlyPopup = main_core.Type.isFunction(params.showReadOnlyPopup) ? params.showReadOnlyPopup : () => {};
			this.onRangeUpdated = this.#onRangeUpdated.bind(this);
			this.#bindEvents();
		}
		get #model() {
			return this.#params.model;
		}
		hasShownPopups() {
			const weekdaysPopupShown = this.weekdaysMenu.isShown();
			const startPopupShown = main_core.Dom.hasClass(this.#layout.fromTimeSelect, '--active');
			const endPopupShown = main_core.Dom.hasClass(this.#layout.toTimeSelect, '--active');
			return weekdaysPopupShown || startPopupShown || endPopupShown;
		}
		#bindEvents() {
			this.#model.subscribe('updated', this.onRangeUpdated);
		}
		destroy() {
			this.#layout.wrap.remove();
			this.#unbindEvents();
		}
		#unbindEvents() {
			this.#model.unsubscribe('updated', this.onRangeUpdated);
		}
		#onRangeUpdated() {
			this.updateWeekdaysTitle();
		}
		render() {
			this.#layout.wrap = main_core.Tag.render`
			<div class="calendar-sharing__settings-range">
				${this.#renderWeekdaysSelect()}
				<div class="calendar-sharing__settings-time-interval">
					${this.#renderTimeFromSelect()}
					<div class="calendar-sharing__settings-dash"></div>
					${this.#renderTimeToSelect()}
				</div>
				${this.renderButton()}
			</div>
		`;
			if (this.#model.isNew()) {
				this.#animate();
			}
			return this.#layout.wrap;
		}
		#animate() {
			main_core.Dom.addClass(this.#layout.wrap, '--animate-show');
			setTimeout(() => {
				main_core.Dom.removeClass(this.#layout.wrap, '--animate-show');
				this.#model.setNew(false);
			}, 300);
		}
		renderButton() {
			const button = this.#getButton();
			this.#layout.button?.replaceWith(button);
			this.#layout.button = button;
			return this.#layout.button;
		}
		#getButton() {
			if (this.#model.isDeletable()) {
				return main_core.Tag.render`
				<div
					class="calendar-sharing__settings-delete"
					onclick="${this.#onDeleteButtonClickHandler.bind(this)}"
				></div>
			`;
			}
			return main_core.Tag.render`
			<div
				class="calendar-sharing__settings-add"
				onclick="${this.#onAddButtonClickHandler.bind(this)}"
			></div>
		`;
		}
		#onDeleteButtonClickHandler() {
			if (this.#params.readOnly) {
				this.showReadOnlyPopup(this.#layout.button);
			} else {
				this.#remove();
			}
		}
		#onAddButtonClickHandler() {
			if (this.#params.readOnly) {
				this.showReadOnlyPopup(this.#layout.button);
			} else {
				this.#add();
			}
		}
		#add() {
			this.#model.getRule().addRange();
		}
		#remove() {
			if (!this.#model.getRule().removeRange(this.#model)) {
				return;
			}
			main_core.Dom.addClass(this.#layout.wrap, '--animate-remove');
			setTimeout(() => this.destroy(), 300);
		}
		#renderWeekdaysSelect() {
			const weekdaysLoc = calendar_util.Util.getWeekdaysLoc().map((loc, index) => {
				return {
					loc,
					index,
					active: this.#model.getWeekDays().includes(index)
				};
			});
			weekdaysLoc.push(...weekdaysLoc.splice(0, this.#model.getWeekStart()));
			this.#layout.weekdaysSelect = main_core.Tag.render`
			<div
				class="calendar-sharing__settings-weekdays calendar-sharing__settings-select calendar-sharing__settings-select-arrow"
				title="${this.#model.formatWeekdays()}"
			>
				${this.#model.getWeekdaysTitle()}
			</div>
		`;

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-io-without-polyfill
			const observer = new IntersectionObserver(() => {
				if (this.#layout.weekdaysSelect.offsetWidth > 0) {
					this.updateWeekdaysTitle();
				}
			});
			observer.observe(this.#layout.weekdaysSelect);
			main_core.Event.bind(this.#layout.weekdaysSelect, 'click', this.#onWeekdaysSelectClickHandler.bind(this));
			this.weekdays = weekdaysLoc.map(weekdayLoc => this.#createWeekday(weekdayLoc));
			const weekdaysPopupId = `calendar-sharing-settings-weekdays-${this.#params.model.id}`;
			this.weekdaysMenu = main_popup.PopupManager.getPopupById(weekdaysPopupId);
			if (!this.weekdaysMenu) {
				this.weekdaysMenu = this.#createWeekdaysPopup(weekdaysPopupId);
				this.weekdaysMenu.canBeClosed = true;
			}
			this.weekdaysMenu.setBindElement(this.#layout.weekdaysSelect);
			return this.#layout.weekdaysSelect;
		}
		updateWeekdaysTitle() {
			this.#layout.weekdaysSelect.title = this.#model.formatWeekdays(false);
			this.#layout.weekdaysSelect.innerText = this.#model.getWeekdaysTitle(true);
			const weekdaysSelectWidth = this.#layout.weekdaysSelect.offsetWidth - 32;
			const weekdaysTextWidth = this.#getTextNodeWidth(this.#layout.weekdaysSelect.firstChild);
			const weekdaysWidthIsOverflowing = weekdaysSelectWidth < weekdaysTextWidth;
			if (weekdaysWidthIsOverflowing) {
				this.#layout.weekdaysSelect.innerText = this.#model.getWeekdaysTitle(false);
			}
		}
		#getTextNodeWidth(textNode) {
			if (!textNode) {
				return 0;
			}
			const spanNode = BX.Tag.render`<span style="position: absolute;">${textNode.cloneNode()}</span>`;
			textNode.replaceWith(spanNode);
			const textWidth = spanNode.offsetWidth;
			spanNode.replaceWith(textNode);
			return textWidth;
		}
		#createWeekdaysPopup(id) {
			return new main_popup.Popup({
				id,
				content: main_core.Tag.render`
				<div class="calendar-sharing__settings-popup-weekdays">
					${this.weekdays.map(weekday => weekday.render())}
				</div>
			`,
				autoHide: true,
				closeByEsc: true,
				angle: {
					position: 'top',
					offset: 105
				},
				autoHideHandler: () => this.weekdaysMenu.canBeClosed,
				events: {
					onPopupShow: () => main_core.Dom.addClass(this.#layout.weekdaysSelect, '--active'),
					onPopupClose: () => main_core.Dom.removeClass(this.#layout.weekdaysSelect, '--active')
				}
			});
		}
		#createWeekday(weekdayLoc) {
			return new Weekday({
				name: weekdayLoc.loc,
				index: weekdayLoc.index,
				active: weekdayLoc.active,
				onSelected: () => this.#model.addWeekday(weekdayLoc.index),
				onDiscarded: () => this.#model.removeWeekday(weekdayLoc.index),
				canBeDiscarded: () => this.#model.getWeekDays().length > 1,
				onMouseDown: this.#onWeekdayMouseDown.bind(this)
			});
		}
		#onWeekdayMouseDown(event, currentWeekday) {
			this.weekdaysMenu.canBeClosed = false;
			const startX = event.clientX;
			const select = currentWeekday.active;
			this.controllableWeekdays = [];
			this.collectIntersectedWeekdays = e => {
				for (const weekday of this.weekdays) {
					const right = weekday.wrap.getBoundingClientRect().right;
					const left = weekday.wrap.getBoundingClientRect().left;
					if (startX > right && e.clientX < right || startX < left && e.clientX > left || left < startX && startX < right) {
						if (!this.controllableWeekdays.includes(weekday)) {
							this.controllableWeekdays.push(weekday);
						}
						weekday.intersected = true;
					}
				}
			};
			this.onMouseMove = e => {
				this.controllableWeekdays.forEach(controllableWeekday => {
					// eslint-disable-next-line no-param-reassign
					controllableWeekday.intersected = false;
				});
				this.collectIntersectedWeekdays(e);
				for (const weekday of this.controllableWeekdays) {
					if (weekday.intersected && select || !weekday.intersected && !select) {
						weekday.select();
					} else {
						weekday.discard();
					}
				}
			};
			main_core.Event.bind(document, 'mousemove', this.onMouseMove);
			main_core.Event.bind(document, 'mouseup', () => {
				main_core.Event.unbind(document, 'mousemove', this.onMouseMove);
				setTimeout(() => {
					this.weekdaysMenu.canBeClosed = true;
				}, 0);
			});
		}
		#renderTimeFromSelect() {
			this.#layout.fromTimeSelect = this.#renderTimeSelect(this.#model.getFromFormatted(), {
				getTimeStamps: () => this.#model.getAvailableTimeFrom(),
				isSelected: minutes => this.#model.getFrom() === minutes,
				onItemSelected: minutes => this.#model.setFrom(minutes)
			}, 'calendar-sharing-settings-range-from');
			return this.#layout.fromTimeSelect;
		}
		#renderTimeToSelect() {
			this.#layout.toTimeSelect = this.#renderTimeSelect(this.#model.getToFormatted(), {
				getTimeStamps: () => this.#model.getAvailableTimeTo(),
				isSelected: minutes => this.#model.getTo() === minutes,
				onItemSelected: minutes => this.#model.setTo(minutes)
			}, 'calendar-sharing-settings-range-to');
			return this.#layout.toTimeSelect;
		}
		#renderTimeSelect(time, callbacks, dataId) {
			const timeSelect = main_core.Tag.render`
			<div
				class="calendar-sharing__settings-select calendar-sharing__settings-time calendar-sharing__settings-select-arrow"
				data-id="${dataId}"
			>
				${this.formatAmPmSpan(time)}
			</div>
		`;
			main_core.Event.bind(timeSelect, 'click', () => this.#onTimeSelectClickHandler(timeSelect, callbacks));
			return timeSelect;
		}
		#onTimeSelectClickHandler(timeSelect, callbacks) {
			if (this.#params.readOnly) {
				this.showReadOnlyPopup(timeSelect);
			} else if (!main_core.Dom.hasClass(timeSelect, '--active')) {
				this.#showTimeMenu(timeSelect, callbacks);
			}
		}
		#showTimeMenu(timeSelect, callbacks) {
			// eslint-disable-next-line init-declarations
			let timeMenu;
			const items = callbacks.getTimeStamps().map(timeStamp => {
				return {
					html: main_core.Tag.render`
					<div class="calendar-sharing__am-pm-container">${timeStamp.name}</div>
				`,
					className: callbacks.isSelected(timeStamp.value) ? 'menu-popup-no-icon --selected' : 'menu-popup-no-icon',
					onclick: () => {
						// eslint-disable-next-line no-param-reassign
						timeSelect.innerHTML = timeStamp.name;
						callbacks.onItemSelected(timeStamp.value);
						timeMenu.close();
					}
				};
			});
			timeMenu = main_popup.MenuManager.create({
				id: `calendar-sharing-settings-time-menu${Date.now()}`,
				className: 'calendar-sharing-settings-time-menu',
				bindElement: timeSelect,
				items,
				autoHide: true,
				closeByEsc: true,
				events: {
					onShow: () => main_core.Dom.addClass(timeSelect, '--active'),
					onClose: () => main_core.Dom.removeClass(timeSelect, '--active')
				},
				maxHeight: 300,
				minWidth: timeSelect.offsetWidth
			});
			timeMenu.show();
			const timezonesPopup = timeMenu.getPopupWindow();
			const popupContent = timezonesPopup.getContentContainer();
			const selectedTimezoneItem = popupContent.querySelector('.menu-popup-item.--selected');
			popupContent.scrollTop = selectedTimezoneItem.offsetTop - selectedTimezoneItem.offsetHeight * 2;
		}
		#onWeekdaysSelectClickHandler() {
			if (this.#params.readOnly) {
				this.showReadOnlyPopup(this.#layout.weekdaysSelect);
			} else {
				this.weekdaysMenu.show();
			}
		}
		formatAmPmSpan(time) {
			return time.toLowerCase().replaceAll(/(am|pm)/g, '<span class="calendar-sharing__settings-time-am-pm">$1</span>');
		}
	}

	class Settings {
		#params;
		#layout;
		constructor(params) {
			this.#params = params;
			this.#layout = {};
			this.readOnly = params.readOnly;
			this.#bindEvents();
		}
		get #model() {
			return this.#params.model;
		}
		get #rule() {
			return this.#model.getRule();
		}
		#bindEvents() {
			this.#rule.subscribe('updated', this.#onRuleUpdated.bind(this));
			this.#rule.subscribe('rangeDeleted', this.#onRangeDeleted.bind(this));
		}
		#onRuleUpdated() {
			this.#updateSubtitle();
			this.#removeRuleHeight();
			this.#renderRanges();
		}
		#onRangeDeleted() {
			this.#updateSubtitle();
			this.#removeRuleHeight();
			this.#layout.ranges.forEach(range => range.renderButton());
		}
		hasShownPopups() {
			const rangesWithPopup = this.#layout.ranges.filter(range => range.hasShownPopups()) ?? [];
			const rangePopupShown = rangesWithPopup.length > 0;
			const slotSizePopupShown = main_core.Dom.hasClass(this.#layout.slotSizeSelect, '--active');
			const readOnlyPopupShown = this.readOnlyPopup?.isShown();
			return rangePopupShown || slotSizePopupShown || readOnlyPopupShown;
		}
		render() {
			const readOnlyClass = this.readOnly ? '--read-only' : '';
			const expandedClass = this.#model.isCollapsed() ? '--hide' : '';
			const contextClass = `--${this.#model.getContext()}`;
			this.#layout.wrap = main_core.Tag.render`
			<div class="calendar-sharing__settings ${readOnlyClass} ${expandedClass} ${contextClass}">
				${this.#renderHeader()}
				${this.#renderRule()}
			</div>
		`;
			return this.#layout.wrap;
		}
		#renderHeader() {
			return main_core.Tag.render`
			<div class="calendar-sharing__settings-header-container">
				<div class="calendar-sharing__settings-header">
					<div class="calendar-sharing__settings-title">
						${main_core.Loc.getMessage('CALENDAR_SHARING_SETTINGS_TITLE_V2')}
					</div>
					${this.#renderSubtitle()}
				</div>
				<div class="calendar-sharing__settings-header-button">
					${this.#renderExpandRuleButton()}
				</div>
			</div>
		`;
		}
		#renderSubtitle() {
			this.#layout.subtitle = main_core.Tag.render`
			<div class="calendar-sharing__settings-subtitle">
				${this.#getSubtitleText()}
			</div>
		`;
			return this.#layout.subtitle;
		}
		#updateSubtitle() {
			if (!this.#layout.subtitle) {
				return;
			}
			this.#layout.subtitle.innerText = this.#getSubtitleText();
		}
		#getSubtitleText() {
			if (this.#model.isDefaultRule()) {
				return main_core.Loc.getMessage('CALENDAR_SHARING_SETTINGS_SUBTITLE_DEFAULT');
			}
			return main_core.Loc.getMessage('CALENDAR_SHARING_SETTINGS_SUBTITLE_PERSONAL');
		}
		#renderExpandRuleButton() {
			if (this.readOnly) {
				return '';
			}
			this.#layout.expandRuleArrow = main_core.Tag.render`
			<div class="calendar-sharing__settings-select-arrow ${this.#model.isCollapsed() ? '' : '--active'}"></div>
		`;
			this.#layout.expandRuleButton = main_core.Tag.render`
			<div class="calendar-sharing__settings-expand">
				${this.#layout.expandRuleArrow}
			</div>
		`;
			main_core.Event.bind(this.#layout.expandRuleButton, 'click', this.#toggleExpand.bind(this));
			return this.#layout.expandRuleButton;
		}
		#renderRule() {
			this.#layout.rule = main_core.Tag.render`
			<div class="calendar-sharing__settings-rule">
				${this.#renderRanges()}
				<div class="calendar-sharing__settings-slotSize">
					<span class="calendar-sharing__settings-slotSize-title">${main_core.Loc.getMessage('CALENDAR_SHARING_SETTINGS_SLOT_SIZE_V2')}</span>
					${this.#renderSettingsSlotSizeSelect()}
				</div>
			</div>
		`;
			return this.#layout.rule;
		}
		#toggleExpand() {
			this.#updateRuleHeight();
			setTimeout(() => {
				main_core.Dom.toggleClass(this.#layout.wrap, '--hide');
				main_core.Dom.toggleClass(this.#layout.expandRuleArrow, '--active');
				this.#model.updateCollapsed(main_core.Dom.hasClass(this.#layout.wrap, '--hide'));
			}, 0);
		}
		#updateRuleHeight() {
			main_core.Dom.style(this.#layout.rule, 'height', `${this.#calculateRuleHeight()}px`);
		}
		#renderRanges() {
			this.#layout.ranges?.forEach(range => range.destroy());
			this.#layout.ranges = this.#rule.getRanges().map(range => this.#createRange(range));
			const rangesContainer = main_core.Tag.render`
			<div class="calendar-sharing__settings-range-list">
				${this.#layout.ranges.map(range => range.render())}
			</div>
		`;
			this.#layout.rangesContainer?.replaceWith(rangesContainer);
			this.#layout.rangesContainer = rangesContainer;
			this.#layout.ranges.forEach(range => range.updateWeekdaysTitle());
			return rangesContainer;
		}
		#createRange(range) {
			return new Range({
				model: range,
				readOnly: this.readOnly,
				showReadOnlyPopup: this.#showReadOnlyPopup.bind(this)
			});
		}
		#renderSettingsSlotSizeSelect() {
			this.#layout.slotSizeText = main_core.Tag.render`
			<span class="calendar-sharing__settings-select-link">
				${this.#rule.getFormattedSlotSize()}
			</span>
		`;
			this.#layout.slotSizeSelect = main_core.Tag.render`
			<span class="calendar-sharing__settings-select-arrow --small-arrow">
				${this.#layout.slotSizeText}
			</span>
		`;
			main_core.Event.bind(this.#layout.slotSizeSelect, 'click', this.#slotSizeSelectClickHandler.bind(this));
			this.slotSizeMenu = main_popup.MenuManager.create({
				id: `calendar-sharing-settings-slotSize${Date.now()}`,
				bindElement: this.#layout.slotSizeSelect,
				items: this.#model.getRule().getAvailableIntervals().map(minutes => {
					return {
						text: calendar_util.Util.formatDuration(minutes),
						onclick: () => {
							this.#rule.setSlotSize(minutes);
							this.#layout.slotSizeText.innerHTML = this.#rule.getFormattedSlotSize();
							this.slotSizeMenu.close();
						}
					};
				}),
				closeByEsc: true,
				events: {
					onShow: () => main_core.Dom.addClass(this.#layout.slotSizeSelect, '--active'),
					onClose: () => main_core.Dom.removeClass(this.#layout.slotSizeSelect, '--active')
				}
			});
			return this.#layout.slotSizeSelect;
		}
		#calculateRuleHeight() {
			const topMarginHeight = 10;
			const bottomMarginHeight = 2;
			const marginsHeight = topMarginHeight + bottomMarginHeight;
			const slotSizeHeight = 15;
			const rangeHeight = 45;
			return rangeHeight * this.#model.getRule().getRanges().length + (marginsHeight + slotSizeHeight);
		}
		#removeRuleHeight() {
			main_core.Dom.style(this.#layout.rule, 'height', null);
		}
		#slotSizeSelectClickHandler() {
			if (this.readOnly) {
				this.#showReadOnlyPopup(this.#layout.slotSizeSelect);
			} else {
				this.slotSizeMenu.show();
			}
		}
		#showReadOnlyPopup(pivotNode) {
			this.#closeReadOnlyPopup();
			this.#getReadOnlyPopup(pivotNode).show();
		}
		#getReadOnlyPopup(pivotNode) {
			const readonlyHint = this.#model.getCalendarContext()?.sharingObjectType === 'group' ? 'CALENDAR_SHARING_SETTINGS_READ_ONLY_HINT_GROUP' : 'CALENDAR_SHARING_SETTINGS_READ_ONLY_HINT';
			this.readOnlyPopup = new main_popup.Popup({
				bindElement: pivotNode,
				className: 'calendar-sharing__settings-read-only-hint',
				content: main_core.Loc.getMessage(readonlyHint),
				angle: {
					offset: 0
				},
				width: 300,
				offsetLeft: pivotNode.offsetWidth / 2,
				darkMode: true,
				autoHide: true
			});
			main_core.Event.bind(this.readOnlyPopup.popupContainer, 'click', () => this.#closeReadOnlyPopup());
			clearTimeout(this.closePopupTimeout);
			this.closePopupTimeout = setTimeout(() => this.#closeReadOnlyPopup(), 3000);
			return this.readOnlyPopup;
		}
		#closeReadOnlyPopup() {
			this.readOnlyPopup?.destroy();
		}
	}

	class HintInfo {
		#bindElement;
		#layout;
		#popup;
		constructor(props) {
			this.#bindElement = props.bindElement;
			this.#layout = {};
			this.#popup = new main_popup.Popup({
				bindElement: this.#bindElement,
				bindOptions: {
					position: 'top'
				},
				angle: {
					offset: this.#bindElement.offsetWidth / 2 + 24
				},
				borderRadius: '24px',
				width: 425,
				content: this.getContent(),
				animation: 'fading-slide'
			});
		}
		getContent() {
			if (!this.#layout.wrapper) {
				this.#layout.wrapper = main_core.Tag.render`
				<div class="calendar-sharing__user-selector-hint-wrapper">
					<div class="calendar-sharing__user-selector-hint-text-wrapper">
						<div class="calendar-sharing__user-selector-hint-text-title">
							${main_core.Loc.getMessage('CALENDAR_SHARING_USER_SELECTOR_HINT_TITLE')}
						</div>
						<div class="calendar-sharing__user-selector-hint-text-desc">
							${main_core.Loc.getMessage('CALENDAR_SHARING_USER_SELECTOR_HINT_DESC')}
						</div>
					</div>
					<div class="calendar-sharing__user-selector-hint-icon"></div>
				</div>
			`;
			}
			return this.#layout.wrapper;
		}
		show() {
			this.#popup?.show();
		}
		close() {
			this.#popup?.close();
		}
	}

	class UserSelector {
		#layout;
		#userSelectorDialog;
		#selectedEntityList;
		#selectedEntityNodeList;
		#defaultUserEntity;
		#onMembersAdded;
		#model;
		constructor(props = {}) {
			this.#layout = {};
			this.#userSelectorDialog = null;
			this.#selectedEntityList = {};
			this.#selectedEntityNodeList = {};
			this.#model = props.model;
			this.#defaultUserEntity = this.#model.getUserInfo();
			this.#onMembersAdded = props.onMembersAdded;
			this.openEntitySelector = this.openEntitySelector.bind(this);
		}
		render() {
			if (!this.#layout.wrapper) {
				const contextClass = `--${this.#model.getContext()}`;
				this.#layout.wrapper = main_core.Tag.render`
				<div class="calendar-sharing__user-selector-main ${contextClass}">
					${this.#renderTitle()}
					${this.renderUserSelectorWrapper()}
				</div>
			`;
			}
			return this.#layout.wrapper;
		}
		#renderTitle() {
			if (!this.#layout.title) {
				this.#layout.title = main_core.Tag.render`
				<div class="calendar-sharing__user-selector-title">
					<div class="calendar-sharing__user-selector-title-icon"></div>
					<div class="calendar-sharing__user-selector-title-text">
						${this.#getTitleText()}
					</div>
				</div>
			`;
				const infoNotify = this.#layout.title.querySelector('[ data-role="calendar-sharing_popup-joint-slots"]');
				if (infoNotify) {
					let hintInfo;
					let timer;
					main_core.Event.bind(infoNotify, 'mouseenter', () => {
						timer = setTimeout(() => {
							if (!hintInfo) {
								hintInfo = new HintInfo({
									bindElement: infoNotify
								});
							}
							hintInfo.show();
						}, 1000);
					});
					main_core.Event.bind(infoNotify, 'mouseleave', () => {
						clearTimeout(timer);
						if (hintInfo) {
							hintInfo.close();
						}
					});
				}
			}
			return this.#layout.title;
		}
		#getTitleText() {
			switch (this.#model.getContext()) {
				case 'calendar':
					return main_core.Loc.getMessage('CALENDAR_SHARING_USER_SELECTOR_TITLE_V2');
				case 'crm':
					return main_core.Loc.getMessage('CALENDAR_SHARING_USER_SELECTOR_TITLE_CRM');
				default:
					return '';
			}
		}
		renderUserSelectorWrapper() {
			if (!this.#layout.userSelectorWrapper) {
				this.#layout.userSelectorWrapper = main_core.Tag.render`
				<div class="calendar-sharing__user-selector-wrapper">
					${this.renderUserSelector()}
					<div class="calendar-sharing__user-selector-add">
						<div class="ui-icon-set --plus-20"></div>
					</div>
				</div>
			`;
				main_core.Event.bind(this.#layout.userSelectorWrapper, 'click', this.openEntitySelector);
			}
			return this.#layout.userSelectorWrapper;
		}
		renderUserSelector() {
			if (!this.#layout.userSelector) {
				const entityNode = this.getDefaultEntityNode();
				this.#layout.userSelector = main_core.Tag.render`
				<div class="calendar-sharing__user-selector-container" data-id="calendar-sharing-members">
					${entityNode}
				</div>
			`;
			}
			return this.#layout.userSelector;
		}
		getDefaultEntityNode() {
			const entityNode = this.renderUserEntity(this.#defaultUserEntity);
			const key = this.getEntityKey(this.#defaultUserEntity.id);
			this.#selectedEntityList[key] = this.#defaultUserEntity;
			this.#selectedEntityNodeList[key] = entityNode;
			this.#model.setMemberIds(this.getSelectedUserIdList());
			return entityNode;
		}
		renderUserEntity(entity) {
			if (entity.isCollabUser) {
				return main_core.Tag.render`
				<div class="calendar-sharing__user-selector-entity-container">
					${this.#renderCollabAvatar(entity)}
				</div>
			`;
			}
			if (this.hasAvatar(entity.avatar)) {
				return main_core.Tag.render`
				<div class="calendar-sharing__user-selector-entity-container">
					<img class="calendar-sharing__user-selector-entity" title="${main_core.Text.encode(entity.name)}" src="${entity.avatar}" alt="">
				</div>
			`;
			}
			return main_core.Tag.render`
			<div class="ui-icon ui-icon-common-user calendar-sharing__user-selector-entity" title="${main_core.Text.encode(entity?.name)}"><i></i></div>
		`;
		}
		hasAvatar(avatar) {
			return avatar && avatar !== '/bitrix/images/1.gif';
		}
		openEntitySelector() {
			if (!this.#layout.userSelector) {
				return;
			}
			const preselectedItem = ['user', this.#defaultUserEntity.id];
			if (!this.#userSelectorDialog) {
				this.#userSelectorDialog = new ui_entitySelector.Dialog({
					width: 340,
					targetNode: this.#layout.userSelector,
					context: 'CALENDAR_SHARING',
					preselectedItems: [preselectedItem],
					enableSearch: true,
					zIndex: 4200,
					events: {
						'Item:onSelect': event => {
							this.onUserSelectorSelect(event);
						},
						'Item:onDeselect': event => {
							this.onUserSelectorDeselect(event);
						},
						'onHide': () => {
							if (this.hasChanges()) {
								this.#onMembersAdded();
							}
						}
					},
					entities: [{
						id: 'user',
						options: {
							intranetUsersOnly: !(this.#model.getCalendarContext()?.sharingObjectType === 'group'),
							emailUsers: false,
							inviteEmployeeLink: false,
							inviteGuestLink: false,
							analyticsSource: 'calendar'
						},
						filters: [{
							id: 'calendar.jointSharingFilter'
						}]
					}]
				});
			}
			this.#userSelectorDialog.show();
		}
		isUserSelectorDialogOpened() {
			if (this.#userSelectorDialog) {
				return this.#userSelectorDialog.isOpen();
			}
			return false;
		}
		onUserSelectorSelect(event) {
			const item = event.data.item;
			const name = item.customData.get('name') ? `${item.customData.get('name')} ${item.customData.get('lastName') ?? ''}`.trim() : String(item.customData.get('login'));
			const entity = {
				id: item.id,
				avatar: item.avatar,
				name,
				isCollabUser: item.entityType === 'collaber'
			};
			const entityNode = this.renderUserEntity(entity);
			if (this.#layout.userSelector) {
				main_core.Dom.append(entityNode, this.#layout.userSelector);
			}
			const key = this.getEntityKey(entity.id);
			this.#selectedEntityList[key] = entity;
			this.#selectedEntityNodeList[key] = entityNode;
			this.#model.setMemberIds(this.getSelectedUserIdList());
		}
		onUserSelectorDeselect(event) {
			const item = event.data.item;
			const key = this.getEntityKey(item.id);
			const entityNode = this.#selectedEntityNodeList[key];
			if (entityNode) {
				main_core.Dom.remove(entityNode);
				delete this.#selectedEntityList[key];
				delete this.#selectedEntityNodeList[key];
			}
			this.#model.setMemberIds(this.getSelectedUserIdList());
		}
		clearSelectedUsers() {
			if (this.#layout.userSelector) {
				main_core.Dom.clean(this.#layout.userSelector);
				this.#selectedEntityList = {};
				this.#selectedEntityNodeList = {};
				const entityNode = this.getDefaultEntityNode();
				main_core.Dom.append(entityNode, this.#layout.userSelector);
			}
			if (this.#userSelectorDialog) {
				this.#userSelectorDialog.destroy();
				this.#userSelectorDialog = null;
			}
		}
		hasChanges() {
			return this.getPeopleCount() > 1;
		}
		getPeopleCount() {
			return Object.keys(this.#selectedEntityList).length;
		}
		getSelectedUserIdList() {
			const result = [];
			Object.values(this.#selectedEntityList).forEach(entity => {
				result.push(entity.id);
			});
			return result;
		}
		getEntityKey(id) {
			return `user-${id}`;
		}
		#renderCollabAvatar(member) {
			return new ui_avatar.AvatarRoundGuest({
				size: 36,
				userName: member.name,
				userpicPath: this.hasAvatar(member.avatar) && member.avatar,
				baseColor: '#19cc45'
			}).getContainer();
		}
	}

	const MAX_AVATAR_COUNT = 4;
	class ListItem {
		#props;
		#layout;
		#avatarPopup;
		#deletePopup;
		constructor(props) {
			this.#props = props;
			this.#layout = {};
			this.#avatarPopup = null;
			this.#deletePopup = null;
			this.openAvatarList = this.openAvatarList.bind(this);
			this.onCopyButtonClick = this.onCopyButtonClick.bind(this);
			this.onDeleteButtonClick = this.onDeleteButtonClick.bind(this);
		}
		render() {
			if (!this.#layout.wrapper) {
				this.#layout.wrapper = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-item">
					${this.renderAvatarContainer()}
					${this.renderDate()}
					${this.renderCopyButton()}
					${this.renderDeleteButton()}
				</div>
			`;
			}
			return this.#layout.wrapper;
		}
		renderAvatarContainer() {
			if (!this.#layout.avatarContainer) {
				const showMoreIcon = this.#props.members.length > MAX_AVATAR_COUNT;
				const moreCounter = this.#props.members.length - MAX_AVATAR_COUNT;
				this.#layout.avatarContainer = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-item-avatar-container">
					${this.renderAvatar(this.#props.userInfo)}
					${this.#props.members.slice(0, MAX_AVATAR_COUNT).map(member => this.renderAvatar(member))}
					${showMoreIcon ? this.renderMore(moreCounter) : null}
				</div>
			`;
				main_core.Event.bind(this.#layout.avatarContainer, 'click', this.openAvatarList);
			}
			return this.#layout.avatarContainer;
		}
		renderAvatar(user) {
			const name = `${user.name} ${user.lastName ?? ''}`.trim();
			if (this.hasAvatar(user.avatar)) {
				return main_core.Tag.render`
				<img class="calendar-sharing__dialog-link-list-item-avatar" title="${main_core.Text.encode(name)}" alt="" src="${user.avatar}">
			`;
			}
			return main_core.Tag.render`
			<div class="ui-icon ui-icon-common-user calendar-sharing__dialog-link-list-item-avatar" title="${main_core.Text.encode(name)}"><i></i></div>
		`;
		}
		hasAvatar(avatar) {
			return avatar && avatar !== '/bitrix/images/1.gif';
		}
		renderMore(counter) {
			return main_core.Tag.render`
			<div class="calendar-sharing__dialog-link-list-item-more">
				<div class="calendar-sharing__dialog-link-list-item-more-text">${`+${counter}`}</div>
			</div>
		`;
		}
		openAvatarList() {
			if (!this.#avatarPopup) {
				const uid = BX.util.getRandomString(6);
				this.#avatarPopup = main_popup.MenuManager.create({
					id: `calendar-sharing-dialog_${uid}`,
					bindElement: this.#layout.avatarContainer,
					bindOptions: {
						position: 'top'
					},
					autoHide: true,
					closeByEsc: true,
					className: 'calendar-sharing__dialog-link-list-user-popup-container',
					items: this.getAvatarPopupItems(),
					maxHeight: 250,
					maxWidth: 300
				});
				this.#avatarPopup.getPopupWindow().subscribe('onClose', () => {
					this.setPopupState(false);
				});
				const menuContainer = this.#avatarPopup.getMenuContainer();

				// eslint-disable-next-line init-declarations
				let timeout;
				main_core.Event.bind(menuContainer, 'mouseleave', () => {
					clearTimeout(timeout);
					timeout = setTimeout(() => {
						this.closeAvatarList();
					}, 500);
				});
				main_core.Event.bind(menuContainer, 'mouseenter', () => {
					clearTimeout(timeout);
				});
			}
			this.#avatarPopup.show();
			this.setPopupState(true);
		}
		closeAvatarList() {
			if (this.#avatarPopup) {
				this.#avatarPopup.close();
			}
		}
		getAvatarPopupItems() {
			const result = [];
			result.push(this.getAvatarPopupItem(this.#props.userInfo));
			this.#props.members.forEach(member => {
				result.push(this.getAvatarPopupItem(member));
			});
			return result;
		}
		getAvatarPopupItem(user) {
			const avatar = user.avatar;
			const name = `${user.name} ${user.lastName ?? ''}`.trim();
			const userPath = this.#props.pathToUser.replace('#USER_ID#', user.id);
			return {
				html: main_core.Tag.render`
				<a href="${userPath}" target="_blank" class="calendar-sharing__dialog-link-list-user-popup-item">
					<span class="ui-icon ui-icon-common-user calendar-sharing__dialog-link-list-user-popup-item-avatar">
						<i style="${this.hasAvatar(avatar) ? `background-image: url('${avatar}')` : ''}"></i>
					</span>
					<div class="calendar-sharing__dialog-link-list-user-popup-item-text">
						${main_core.Text.encode(name)}
					</div>
				</a>
			`
			};
		}
		renderDate() {
			if (!this.#layout.date) {
				const date = this.#props.dateCreate ? new Date(this.#props.dateCreate) : new Date();
				const formattedDate = calendar_util.Util.formatDate(date);
				this.#layout.date = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-item-date" title="${main_core.Loc.getMessage('CALENDAR_SHARING_LINK_LIST_DATE_CREATE')}">${formattedDate}</div>
			`;
			}
			return this.#layout.date;
		}
		renderCopyButton() {
			if (!this.#layout.copyButton) {
				const icon = new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_core.Main.LINK_3,
					size: 14
				});
				this.#layout.copyButton = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-item-copy-container">
					${icon.render()}
					<div class="calendar-sharing__dialog-link-list-item-copy-text">${main_core.Loc.getMessage('CALENDAR_SHARING_LINK_LIST_COPY')}</div>
				</div>
			`;
				main_core.Event.bind(this.#layout.copyButton, 'click', this.onCopyButtonClick);
			}
			return this.#layout.copyButton;
		}
		onCopyButtonClick() {
			main_core_events.EventEmitter.emit('CalendarSharing:onJointLinkCopy', {
				id: this.#props.id,
				shortUrl: this.#props.shortUrl,
				hash: this.#props.hash,
				members: this.#props.members
			});
		}
		renderDeleteButton() {
			if (this.#props.members.length === 0) {
				return main_core.Tag.render`<div class="calendar-sharing__dialog-link-list-item-delete"></div>`;
			}
			if (!this.#layout.deleteButton) {
				const icon = new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_core.Actions.CROSS_30,
					size: 18
				});
				this.#layout.deleteButton = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-item-delete">
					${icon.render()}
				</div>
			`;
				main_core.Event.bind(this.#layout.deleteButton, 'click', this.onDeleteButtonClick);
			}
			return this.#layout.deleteButton;
		}
		onDeleteButtonClick() {
			if (!this.#deletePopup) {
				this.#deletePopup = new ui_dialogs_messagebox.MessageBox({
					useAirDesign: true,
					title: main_core.Loc.getMessage('CALENDAR_SHARING_LINK_LIST_DELETE_MESSAGE_TITLE_MSGVER_1'),
					message: main_core.Loc.getMessage('CALENDAR_SHARING_LINK_LIST_DELETE_MESSAGE_DESC_MSGVER_1'),
					buttons: this.getDeletePopupButtons(),
					popupOptions: {
						autoHide: true,
						closeByEsc: true,
						draggable: false,
						closeIcon: true,
						minWidth: 365,
						maxWidth: 385,
						minHeight: 180
					}
				});
			}
			this.#deletePopup.show();
			this.setPopupState(true);
		}
		getDeletePopupButtons() {
			return [new ui_buttons.Button({
				size: ui_buttons.ButtonSize.MEDIUM,
				color: ui_buttons.ButtonColor.DANGER,
				text: main_core.Loc.getMessage('SHARING_WARNING_POPUP_SUBMIT_BUTTON_NEW_MSGVER_1'),
				events: {
					click: () => {
						this.deleteLink();
						this.#deletePopup.close();
						this.setPopupState(false);
					}
				}
			}), new ui_buttons.Button({
				size: ui_buttons.ButtonSize.MEDIUM,
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				text: main_core.Loc.getMessage('SHARING_WARNING_POPUP_CANCEL_BUTTON'),
				events: {
					click: () => {
						this.#deletePopup.close();
						this.setPopupState(false);
					}
				}
			})];
		}
		deleteLink() {
			if (this.#layout.wrapper) {
				BX.ajax.runAction('calendar.api.sharingajax.disableUserLink', {
					data: {
						hash: this.#props.hash
					}
				});
				main_core.Dom.addClass(this.#layout.wrapper, '--animate-delete');
				setTimeout(() => {
					main_core.Dom.remove(this.#layout.wrapper);
				}, 300);
				main_core_events.EventEmitter.emit('CalendarSharing:onJointLinkDelete', {
					id: this.#props.id
				});
			}
		}
		setPopupState(state) {
			this.#props?.setListItemPopupState(state);
		}
	}

	const DEFAULT_LIST_HEIGHT = 300;
	const LIST_PADDING_SUM = 45;
	class List {
		#props;
		#layout;
		#linkList;
		#popupOpenState = false;
		#pathToUser;
		constructor(props) {
			this.#props = props;
			this.#layout = {};
			this.#linkList = null;
			this.#pathToUser = null;
			this.getLinkListInfo();
			this.setListItemPopupState = this.setListItemPopupState.bind(this);
			this.eventSubscribe();
		}
		get #model() {
			return this.#props.model;
		}
		eventSubscribe() {
			main_core_events.EventEmitter.subscribe('CalendarSharing:onJointLinkCopy', event => {
				this.onJointLinkCopy(event);
			});
			main_core_events.EventEmitter.subscribe('CalendarSharing:onJointLinkDelete', event => {
				this.onJointLinkDelete(event);
			});
		}
		getLinkListInfo() {
			BX.ajax.runAction('calendar.api.sharingajax.getAllUserLink').then(response => {
				if (response && response.data) {
					this.#linkList = response.data.userLinks;
					this.#pathToUser = response.data.pathToUser;
					this.updateLinkList();
					if (this.isListEmpty()) {
						this.hideSortingButton();
						return;
					}
					if (this.#linkList) {
						this.showSortingButton();
					}
				}
			});
		}
		render() {
			if (!this.#layout.wrapper) {
				this.#layout.wrapper = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-wrapper">
					${this.getTitleNode()}
					${this.getListNode()}
				</div>
			`;
			}
			return this.#layout.wrapper;
		}
		getTitleNode() {
			if (!this.#layout.title) {
				this.#layout.title = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-title-wrapper">
					<div class="calendar-sharing__dialog-link-list-title">
						${this.getChevronBackIcon()}
						<div class="calendar-sharing__dialog-link-list-title-text">
							${main_core.Loc.getMessage('CALENDAR_SHARING_LINK_LIST_TITLE')}
						</div>
					</div>
					${this.getSortingButton()}
				</div>
			`;
			}
			return this.#layout.title;
		}
		getChevronBackIcon() {
			if (!this.#layout.backButton) {
				const icon = new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_core.Actions.CHEVRON_LEFT,
					size: 24
				});
				this.#layout.backButton = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-back-button">
					${icon.render()}
				</div>
			`;
				main_core.Event.bind(this.#layout.backButton, 'click', this.close.bind(this));
			}
			return this.#layout.backButton;
		}
		getSortingButton() {
			if (!this.#layout.sortingButton) {
				const icon = new ui_iconSet_api_core.Icon({
					icon: ui_iconSet_api_core.Actions.SORT,
					size: 14,
					color: '#2066b0'
				});
				this.#layout.sortingButton = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-sorting-button">
					${icon.render()}
					${this.getSortingButtonText()}
				</div>
			`;
				main_core.Event.bind(this.#layout.sortingButton, 'click', this.changeListSort.bind(this));
			}
			return this.#layout.sortingButton;
		}
		getSortingButtonText() {
			if (!this.#layout.sortingButtonText) {
				this.#layout.sortingButtonText = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-sorting-button-text">
					${this.#getSortingName()}
				</div>
			`;
			}
			return this.#layout.sortingButtonText;
		}
		getListNode() {
			if (!this.#layout.list) {
				this.#layout.list = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-container">
					${this.getListItemsNode()}
				</div>
			`;
			}
			return this.#layout.list;
		}
		getListItemsNode() {
			if (this.isListEmpty()) {
				return this.getEmptyStateNode();
			}
			const linkListItems = this.getListItems();
			return main_core.Tag.render`
			<div class="calendar-sharing__dialog-link-list">
				${linkListItems.map(listItem => listItem.render())}
			</div>
		`;
		}
		getEmptyStateNode() {
			if (!this.#layout.emptyState) {
				this.#layout.emptyState = main_core.Tag.render`
				<div class="calendar-sharing__dialog-link-list-empty-state-wrapper">
					<div class="calendar-sharing__dialog-link-list-empty-state-icon"></div>
					<div class="calendar-sharing__dialog-link-list-empty-state-text">${main_core.Loc.getMessage('CALENDAR_SHARING_LIST_EMPTY_TITLE')}</div>
				</div>
			`;
			}
			return this.#layout.emptyState;
		}
		getListItems() {
			if (this.#model.sortJointLinksByFrequentUse()) {
				return this.getSortedByFrequentUseListItems();
			}
			return this.getSortedByDateListItems();
		}
		getSortedByFrequentUseListItems() {
			return Object.values(this.#linkList).sort((a, b) => {
				if (a.frequentUse > b.frequentUse) {
					return -1;
				}
				if (a.frequentUse < b.frequentUse) {
					return 1;
				}
				if (a.id > b.id) {
					return -1;
				}
				if (a.id < b.id) {
					return 1;
				}
				return 0;
			}).map(item => new ListItem({
				...item,
				userInfo: this.#model.getUserInfo(),
				pathToUser: this.#pathToUser,
				setListItemPopupState: this.setListItemPopupState
			}));
		}
		getSortedByDateListItems() {
			return Object.keys(this.#linkList).sort((a, b) => b - a).map(index => {
				return new ListItem({
					...this.#linkList[index],
					userInfo: this.#model.getUserInfo(),
					pathToUser: this.#pathToUser,
					setListItemPopupState: this.setListItemPopupState
				});
			});
		}
		show(maxListHeight) {
			if (this.#layout.list && maxListHeight) {
				main_core.Dom.style(this.#layout.list, 'max-height', `${maxListHeight - LIST_PADDING_SUM}px`);
			}
			if (this.#layout.wrapper) {
				main_core.Dom.addClass(this.#layout.wrapper, '--show');
			}
		}
		close() {
			if (this.#layout.list) {
				main_core.Dom.style(this.#layout.list, 'max-height', `${DEFAULT_LIST_HEIGHT}px`);
			}
			if (this.#layout.wrapper) {
				main_core.Dom.removeClass(this.#layout.wrapper, '--show');
			}
			if (this.#props.onLinkListClose) {
				this.#props.onLinkListClose();
			}
		}
		updateLinkList() {
			if (this.#layout.list) {
				main_core.Dom.clean(this.getListNode());
				const listItems = this.getListItemsNode();
				main_core.Dom.append(listItems, this.#layout.list);
			}
		}
		changeListSort() {
			this.#model.changeSortJointLinksByFrequentUse();
			if (this.#layout.sortingButtonText) {
				main_core.Dom.adjust(this.#layout.sortingButtonText, {
					text: this.#getSortingName()
				});
			}
			this.updateLinkList();
		}
		#getSortingName() {
			return this.#model.sortJointLinksByFrequentUse() ? main_core.Loc.getMessage('CALENDAR_SHARING_LINK_LIST_SORT_RECENT') : main_core.Loc.getMessage('CALENDAR_SHARING_LINK_LIST_SORT_DATE');
		}
		setListItemPopupState(state) {
			this.#popupOpenState = state;
		}
		isOpenListItemPopup() {
			return this.#popupOpenState;
		}
		onJointLinkCopy(event) {
			const id = event.data.id;
			const hash = event.data.hash;
			setTimeout(() => {
				if (this.#linkList[id]) {
					this.#linkList[id].frequentUse = this.#linkList[id].frequentUse + 1;
					this.updateLinkList();
				}
			}, 1000);
			BX.ajax.runAction('calendar.api.sharingajax.increaseFrequentUse', {
				data: {
					hash
				}
			});
		}
		onJointLinkDelete(event) {
			const id = event.data.id;
			if (this.#linkList[id]) {
				delete this.#linkList[id];
			}
			if (this.isListEmpty()) {
				this.updateLinkList();
				this.hideSortingButton();
			}
		}
		isListEmpty() {
			return main_core.Type.isNil(this.#linkList) || main_core.Type.isArray(this.#linkList) && !main_core.Type.isArrayFilled(this.#linkList) || main_core.Type.isObject(this.#linkList) && !Object.keys(this.#linkList).length;
		}
		hideSortingButton() {
			if (this.#layout.sortingButton) {
				main_core.Dom.addClass(this.#layout.sortingButton, '--hide');
			}
		}
		showSortingButton() {
			if (this.#layout.sortingButton) {
				main_core.Dom.removeClass(this.#layout.sortingButton, '--hide');
			}
		}
	}

	class Layout {
		HELP_DESK_CODE_CALENDAR = 17198666;
		HELP_DESK_CODE_CRM = 17502612;
		CONTEXT = {
			CRM: 'crm',
			CALENDAR: 'calendar'
		};
		#params;
		#layout;
		#settingsControl;
		#userSelectorControl;
		#linkList;
		constructor(params) {
			this.#params = params;
			this.#layout = {};
			this.#bindEvents();
			this.isGroupContext = params.settingsModel.getCalendarContext()?.sharingObjectType === 'group';
		}
		get #settingsModel() {
			return this.#params.settingsModel;
		}
		#bindEvents() {
			main_core.Event.bind(window, 'beforeunload', () => this.#settingsModel.save());
			main_core_events.EventEmitter.subscribe('CalendarSharing:onJointLinkCopy', async event => {
				const shortUrl = event.data.shortUrl;
				const linkHash = event.data.hash;
				await this.copyLink(shortUrl, linkHash);
				calendar_sharing_analytics.Analytics.sendLinkCopiedList(this.#settingsModel.getContext(), {
					peopleCount: event.data.members.length + 1,
					ruleChanges: this.#settingsModel.getChanges()
				});
			});
		}
		reset() {
			void this.#settingsModel.save();
			this.#userSelectorControl?.clearSelectedUsers();
			setTimeout(() => this.#linkList?.close(), 200);
		}
		hasShownPopups() {
			const isSettingsPopupShown = this.#settingsControl.hasShownPopups();
			const isUserSelectorDialogOpened = this.#userSelectorControl?.isUserSelectorDialogOpened();
			const isListItemPopupOpened = this.#linkList?.isOpenListItemPopup();
			return isSettingsPopupShown || isUserSelectorDialogOpened || isListItemPopupOpened;
		}
		render() {
			this.#layout.wrap = main_core.Tag.render`
			<div class="calendar-sharing__dialog-wrapper">
				${this.#renderMain()}
				${this.isGroupContext ? null : this.#renderLinkList()}
			</div>
		`;
			return this.#layout.wrap;
		}
		#renderMain() {
			this.#layout.main ??= main_core.Tag.render`
			<div class="calendar-sharing__dialog-content-wrapper --show">
				${this.#renderTop()}
				<div class="calendar-sharing__dialog-body">
					${this.#renderDialogMessage()}
					${this.#renderSettings()}
					${this.#renderMembers()}
				</div>
				${this.#renderMainBottom()}
			</div>
		`;
			return this.#layout.main;
		}
		#renderDialogMessage() {
			if (this.#settingsModel.getContext() === this.CONTEXT.CRM || this.isGroupContext) {
				return '';
			}
			return main_core.Tag.render`
			<div class="calendar-sharing__dialog-message">
				<div class="calendar-sharing__dialog-info-icon-container">
					<div class="calendar-sharing__dialog-info-icon"></div>
				</div>
				<div class="calendar-sharing__dialog-notify" onclick="${this.#onOpenLink.bind(this)}">
					${main_core.Loc.getMessage('SHARING_INFO_POPUP_CONTENT_4_V3', {
			'#LINK#': this.#settingsModel.getSharingUrl()
		})}
				</div>
			</div>
		`;
		}
		async #onOpenLink() {
			await this.#settingsModel.save();
			window.open(this.#settingsModel.getSharingUrl(), '_blank').focus();
		}
		#renderTop() {
			if (!this.#layout.mainTop) {
				this.#layout.mainTop = main_core.Tag.render`
				<div class="calendar-sharing__dialog-top">
					<div class="calendar-sharing__dialog-title">
						<span>${main_core.Loc.getMessage('SHARING_BUTTON_TITLE')}</span>
						${this.#renderHowDoesItWorkIcon()}
						${this.#params.externalIcon ?? ''}
					</div>
					<div class="calendar-sharing__dialog-info">
						${this.#getSharingInfoMessage()}
					</div>
				</div>
			`;
				const howDoesItWork = this.#layout.mainTop.querySelector('[data-role="calendar-sharing-how-does-it-work"]');
				main_core.Event.bind(howDoesItWork, 'click', this.#openHelpDesk.bind(this));
				const infoNotify = this.#layout.mainTop.querySelector('[data-role="calendar-sharing_popup-open-link"]');
				if (infoNotify) {
					let infoNotifyHint;
					let timer;
					main_core.Event.bind(infoNotify, 'mouseenter', () => {
						timer = setTimeout(() => {
							if (!infoNotifyHint) {
								infoNotifyHint = new main_popup.Popup({
									bindElement: infoNotify,
									angle: {
										offset: infoNotify.offsetWidth / 2 + 16
									},
									width: 410,
									darkMode: true,
									content: main_core.Loc.getMessage('SHARING_INFO_POPUP_SLOT_DESC'),
									animation: 'fading-slide'
								});
							}
							infoNotifyHint.show();
						}, 1000);
					});
					main_core.Event.bind(infoNotify, 'mouseleave', () => {
						clearTimeout(timer);
						if (infoNotifyHint) {
							infoNotifyHint.close();
						}
					});
				}
			}
			return this.#layout.mainTop;
		}
		#renderHowDoesItWorkIcon() {
			if (this.#settingsModel.getContext() === this.CONTEXT.CRM) {
				return '';
			}
			const howDoesItWork = main_core.Tag.render`
			<span
				class="calendar-sharing__dialog-title-help"
				title="${main_core.Loc.getMessage('SHARING_INFO_POPUP_HOW_IT_WORK')}"
			></span>
		`;
			main_core.Event.bind(howDoesItWork, 'click', this.#openHelpDesk.bind(this));
			return howDoesItWork;
		}
		#openHelpDesk() {
			top.BX.Helper.show(`redirect=detail&code=${this.#getContextHelpDeskCode()}`);
		}
		#getSharingInfoMessage() {
			switch (this.#settingsModel.getContext()) {
				case this.CONTEXT.CALENDAR:
					return main_core.Loc.getMessage('SHARING_INFO_POPUP_CONTENT_3_CALENDAR');
				case this.CONTEXT.CRM:
					return main_core.Loc.getMessage('SHARING_INFO_POPUP_CONTENT_3_CRM_MSGVER_2');
				default:
					return '';
			}
		}
		#getContextHelpDeskCode() {
			switch (this.#settingsModel.getContext()) {
				case this.CONTEXT.CALENDAR:
					return this.HELP_DESK_CODE_CALENDAR;
				case this.CONTEXT.CRM:
					return this.HELP_DESK_CODE_CRM;
				default:
					return 0;
			}
		}
		#renderSettings() {
			this.#settingsControl = new Settings({
				readOnly: this.#params.readOnly,
				model: this.#settingsModel
			});
			return this.#settingsControl.render();
		}
		#renderMembers() {
			this.#userSelectorControl = new UserSelector({
				model: this.#settingsModel,
				onMembersAdded: () => calendar_sharing_analytics.Analytics.sendMembersAdded(this.#settingsModel.getContext(), this.#userSelectorControl.getPeopleCount())
			});
			return this.#userSelectorControl.render();
		}
		#renderMainBottom() {
			if (this.#settingsModel.getContext() === this.CONTEXT.CRM) {
				return '';
			}
			this.#layout.mainBottom ??= main_core.Tag.render`
			<div class="calendar-sharing__dialog-bottom">
				${this.#renderCopyLinkButton()}
				${this.isGroupContext ? null : this.#renderLinkHistoryButton()}
			</div>
		`;
			return this.#layout.mainBottom;
		}
		#renderCopyLinkButton() {
			if (!this.#layout.buttonCopy) {
				this.#layout.buttonCopy = main_core.Tag.render`
				<span class="ui-btn ui-btn-success ui-btn-round ui-btn-no-caps calendar-sharing__dialog-copy">
					${main_core.Loc.getMessage('SHARING_DIALOG_SHARING_BLOCK_COPY_LINK_BUTTON')}
				</span>
			`;
				main_core.Event.bind(this.#layout.buttonCopy, 'click', this.#onButtonCopyClick.bind(this));
			}
			return this.#layout.buttonCopy;
		}
		async #onButtonCopyClick() {
			const params = {
				peopleCount: this.#userSelectorControl?.getPeopleCount() ?? 1,
				ruleChanges: this.#settingsModel.getChanges()
			};
			if (this.#userSelectorControl && this.#userSelectorControl.hasChanges()) {
				calendar_sharing_analytics.Analytics.sendLinkCopied(this.#settingsModel.getContext(), calendar_sharing_analytics.Analytics.linkTypes.multiple, params);
				void this.saveJointLink();
			} else if (await this.copyLink(this.#settingsModel.getSharingUrl())) {
				calendar_sharing_analytics.Analytics.sendLinkCopied(this.#settingsModel.getContext(), calendar_sharing_analytics.Analytics.linkTypes.solo, params);
				if (!this.isGroupContext) {
					this.#settingsModel.increaseFrequentUse();
				}
			}
		}
		async saveJointLink() {
			if (this.#layout.buttonCopy && main_core.Dom.hasClass(this.#layout.buttonCopy, 'ui-btn-clock')) {
				return;
			}
			main_core.Dom.addClass(this.#layout.buttonCopy, 'ui-btn-clock');
			const link = await this.#settingsModel.saveJointLink();
			main_core.Dom.removeClass(this.#layout.buttonCopy, 'ui-btn-clock');
			await this.copyLink(link.url, link.hash);
			this.#linkList?.getLinkListInfo();
		}
		#renderLinkHistoryButton() {
			if (!this.#layout.buttonHistory) {
				this.#layout.buttonHistory = main_core.Tag.render`
				<span
					class="ui-btn ui-btn-round ui-btn-light ui-btn-no-caps calendar-sharing__dialog-people"
					data-id="calendar-sharing-history-btn"
				>
					${main_core.Loc.getMessage('SHARING_DIALOG_SHARING_BLOCK_JOINT_SLOTS_BUTTON')}
				</span>
			`;
				main_core.Event.bind(this.#layout.buttonHistory, 'click', this.#openLinkList.bind(this));
			}
			return this.#layout.buttonHistory;
		}
		#renderLinkList() {
			if (this.#settingsModel.getContext() === this.CONTEXT.CRM) {
				return null;
			}
			return this.#getLinkList().render();
		}
		#getLinkList() {
			this.#linkList ??= new List({
				model: this.#settingsModel,
				onLinkListClose: this.#closeLinkList.bind(this)
			});
			return this.#linkList;
		}
		#openLinkList() {
			main_core.Dom.removeClass(this.#layout.main, '--show');
			this.#linkList.show(this.#layout.main.offsetHeight);
		}
		#closeLinkList() {
			main_core.Dom.addClass(this.#layout.main, '--show');
		}
		async copyLink(url, hash) {
			if (!url) {
				return false;
			}
			try {
				await this.#copyToClipboard(url);
			} catch {
				return false;
			}
			calendar_util.Util.showNotification(main_core.Loc.getMessage('SHARING_COPY_LINK_NOTIFICATION'));
			main_core_events.EventEmitter.emit('CalendarSharing:LinkCopied', {
				url,
				hash
			});
			return true;
		}
		async #copyToClipboard(textToCopy) {
			if (!main_core.Type.isString(textToCopy)) {
				return Promise.reject();
			}

			// navigator.clipboard defined only if window.isSecureContext === true
			// so or https should be activated, or localhost address
			if (navigator.clipboard) {
				// safari not allowed clipboard manipulation as result of ajax request
				// so timeout is hack for this, to prevent "not have permission"
				return new Promise((resolve, reject) => {
					setTimeout(() => navigator.clipboard.writeText(textToCopy).then(() => resolve()).catch(e => reject(e)), 0);
				});
			}
			return BX.clipboard?.copy(textToCopy) ? Promise.resolve() : Promise.reject();
		}
	}

	class DialogNew {
		#popup;
		#layout;
		#dialogLayout;
		#settingsModel;
		constructor(options) {
			this.#layout = {};
			this.#layout.bindElement = options.bindElement;
			this.#settingsModel = new SettingsModel({
				context: options.context,
				linkHash: options.linkHash,
				sharingUrl: options.sharingUrl,
				userInfo: options.userInfo,
				rule: options.sharingRule,
				calendarSettings: options.calendarSettings,
				collapsed: options.settingsCollapsed,
				sortJointLinksByFrequentUse: options.sortJointLinksByFrequentUse,
				calendarContext: options.calendarContext
			});
			this.bindEvents();
		}
		bindEvents() {
			main_core_events.EventEmitter.subscribe('CalendarSharing:LinkCopied', this.onSuccessfulCopyingLink.bind(this));
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', event => this.checkAndClosePopupOnSlider(event));
		}
		getPopup() {
			this.#popup ??= new main_popup.Popup({
				...(this.#layout.bindElement ? {
					bindElement: this.#layout.bindElement
				} : {}),
				targetContainer: document.body,
				className: 'calendar-sharing__dialog',
				closeByEsc: true,
				closeIcon: this.#isExternalSharing() || !this.#layout.bindElement,
				autoHide: true,
				padding: 0,
				width: 470,
				angle: this.#getAngleConfig(),
				autoHideHandler: event => this.canBeClosed(event),
				content: this.getPopupWrapper(),
				animation: 'fading-slide',
				events: {
					onPopupShow: this.onPopupShow.bind(this),
					onPopupClose: this.onPopupClose.bind(this)
				}
			});
			return this.#popup;
		}
		onPopupShow() {
			if (this.#layout.bindElement) {
				main_core.Dom.addClass(this.#layout.bindElement, 'ui-btn-hover');
			}
			calendar_sharing_analytics.Analytics.sendPopupOpened(this.#settingsModel.getContext());
		}
		onPopupClose() {
			if (this.#layout.bindElement) {
				main_core.Dom.removeClass(this.#layout.bindElement, 'ui-btn-hover');
			}
			this.#dialogLayout.reset();
		}
		canBeClosed(event) {
			const isClickInside = this.#layout.wrapper.contains(event.target);
			const layoutHasShownPopups = this.#dialogLayout.hasShownPopups();
			const topSlider = this.getTopSlider();
			const calendarOpenInTopSlider = topSlider && this.getCalendarSliderParams(topSlider);
			return !isClickInside && !layoutHasShownPopups && (!topSlider || calendarOpenInTopSlider || this.#isExternalSharing());
		}
		getPopupWrapper() {
			if (!this.#layout.wrapper) {
				this.#dialogLayout = new Layout({
					readOnly: this.#settingsModel.getCalendarContext()?.sharingObjectType === 'group',
					settingsModel: this.#settingsModel
				});
				this.#layout.wrapper = this.#dialogLayout.render();
			}
			this.#layout.wrapper = this.#dialogLayout.render();
			return this.#layout.wrapper;
		}
		onSuccessfulCopyingLink() {
			this.closePopup();
		}
		closePopup() {
			this.getPopup().close();
		}
		isShown() {
			return this.getPopup().isShown();
		}
		show() {
			this.#settingsModel.sortRanges();
			if (this.#layout.bindElement) {
				this.getPopup().adjustPosition({
					forceBindPosition: true
				});
			}
			this.getPopup().show();
		}
		destroy() {
			this.getPopup().destroy();
		}
		getTopSlider() {
			return this.#settingsModel.getContext() === 'calendar' ? BX.SidePanel.Instance.getTopSlider() : false;
		}
		getCalendarSliderParams(slider) {
			return slider.iframeSrc?.match(/\/workgroups\/group\/(\d+)\/calendar\//i);
		}
		checkAndClosePopupOnSlider(event) {
			if (!this.isShown()) {
				return;
			}
			const slider = event.getData() && event.getData()[0]?.slider;
			const sliderParams = slider && this.getCalendarSliderParams(slider);
			if (!sliderParams) {
				return;
			}
			const groupId = parseInt(sliderParams[1], 10);
			if (!groupId) {
				return;
			}
			const currentGroupId = this.#settingsModel.getCalendarContext()?.sharingObjectId;
			if (currentGroupId && groupId !== currentGroupId) {
				return;
			}
			this.closePopup();
		}
		#isExternalSharing() {
			return Boolean(this.#settingsModel.getCalendarContext()?.externalSharing);
		}
		#getAngleConfig() {
			if (this.#isExternalSharing() || !this.#layout.bindElement) {
				return null;
			}
			return {
				offset: this.#layout.bindElement.offsetWidth / 2 + 16
			};
		}
	}

	class DialogQr {
		QRCODE_SIZE = 114;
		QRCODE_COLOR_LIGHT = '#fff';
		QRCODE_COLOR_DARK = '#000';
		#popup;
		#loader;
		#layout;
		#qrCode;
		#context;
		constructor(options) {
			this.#popup = null;
			this.#loader = null;
			this.#layout = {
				qr: null
			};
			this.#qrCode = null;
			this.#context = options.context;
			this.sharingUrl = options.sharingUrl;
		}

		/**
		 *
		 * @returns {Popup}
		 */
		getPopup() {
			if (!this.#popup) {
				this.#popup = new main_popup.Popup({
					className: 'calendar-sharing__qr',
					width: 315,
					padding: 0,
					content: this.getContent(),
					closeIcon: true,
					closeByEsc: true,
					autoHide: true,
					overlay: true,
					animation: 'fading-slide'
				});
			}
			return this.#popup;
		}

		/**
		 *
		 * @returns {Loader}
		 */
		getLoader() {
			if (!this.#loader) {
				this.#loader = new main_loader.Loader({
					size: 95
				});
			}
			return this.#loader;
		}

		/**
		 *
		 * @returns {HTMLElement}
		 */
		getNodeQr() {
			if (!this.#layout.qr) {
				this.#layout.qr = main_core.Tag.render`
				<div class="calendar-sharing__qr-block"></div>
			`;

				// qr emulation
				this.getLoader().show(this.#layout.qr);
				this.showQr();
			}
			return this.#layout.qr;
		}
		async showQr() {
			await this.initQrCode();
			this.QRCode = new QRCode(this.#layout.qr, {
				text: this.sharingUrl,
				width: this.QRCODE_SIZE,
				height: this.QRCODE_SIZE,
				colorDark: this.QRCODE_COLOR_DARK,
				colorLight: this.QRCODE_COLOR_LIGHT,
				correctLevel: QRCode.CorrectLevel.H
			});
			await this.getLoader().hide();
		}
		async initQrCode() {
			await main_core.Runtime.loadExtension(['main.qrcode']);
		}

		/**
		 *
		 * @returns {HTMLElement}
		 */
		getContent() {
			return main_core.Tag.render`
			<div class="calendar-sharing__qr-content">
				<div class="calendar-sharing__qr-title">${this.getPhraseDependsOnContext('SHARING_INFO_POPUP_QR_TITLE')}</div>
				${this.getNodeQr()}
				<div class="calendar-sharing__qr-info">${main_core.Loc.getMessage('SHARING_INFO_POPUP_QR_INFO')}</div>
				<a class="calendar-sharing__dialog-link" href="${this.sharingUrl}" target="_blank">${main_core.Loc.getMessage('SHARING_INFO_POPUP_QR_OPEN_LINK')}</a>
			</div>
		`;
		}
		isShown() {
			return this.getPopup().isShown();
		}
		close() {
			this.getPopup().close();
		}
		show() {
			this.getPopup().show();
		}
		destroy() {
			this.getPopup().destroy();
		}
		getPhraseDependsOnContext(code) {
			return main_core.Loc.getMessage(`${code}_${this.#context.toUpperCase()}`);
		}
	}

	class SharingButton {
		PAY_ATTENTION_TO_NEW_FEATURE_DELAY = 1000;
		PAY_ATTENTION_TO_NEW_FEATURE_FIRST = 'first-feature';
		PAY_ATTENTION_TO_NEW_FEATURE_NEW = 'new-feature';
		PAY_ATTENTION_TO_NEW_FEATURE_REMIND = 'remind-feature';
		PAY_ATTENTION_TO_NEW_FEATURE_JOINT = 'joint-sharing';
		PAY_ATTENTION_TO_NEW_FEATURE_WITHOUT_TEXT_MODS = [this.PAY_ATTENTION_TO_NEW_FEATURE_FIRST];
		PAY_ATTENTION_TO_NEW_FEATURE_WITH_TEXT_MODS = [this.PAY_ATTENTION_TO_NEW_FEATURE_NEW, this.PAY_ATTENTION_TO_NEW_FEATURE_REMIND];
		constructor(options = {}) {
			this.wrap = options.wrap;
			this.userInfo = options.userInfo || null;
			this.sharingConfig = calendar_util.Util.getSharingConfig();
			this.sharingUrl = this.sharingConfig?.url || null;
			this.linkHash = this.sharingConfig?.hash || null;
			this.sharingRule = this.sharingConfig?.rule || null;
			this.payAttentionToNewFeatureMode = options.payAttentionToNewFeature;
			this.sharingFeatureLimit = options.sharingFeatureLimit;
			this.sharingSettingsCollapsed = options.sharingSettingsCollapsed;
			this.sortJointLinksByFrequentUse = options.sortJointLinksByFrequentUse;
		}
		show() {
			main_core.Dom.addClass(this.wrap, 'calendar-sharing__btn-wrap');
			this.button = new ui_buttons.SplitButton({
				text: main_core.Loc.getMessage('SHARING_BUTTON_TITLE'),
				round: true,
				size: ui_buttons.ButtonSize.EXTRA_SMALL,
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				icon: this.sharingFeatureLimit ? ui_buttons.ButtonIcon.LOCK : null,
				collapsedIcon: ui_buttons.ButtonIcon.CALENDAR_WITH_SLOTS,
				className: 'ui-btn-themes calendar-sharing__btn',
				onclick: (button, event) => {
					if (!button.getSwitcher().getNode().contains(event.target)) {
						this.handleSharingButtonClick();
					}
				},
				dataset: {
					id: 'calendar_sharing_btn'
				},
				switcher: {
					checked: this.isSharingEnabled() && !this.sharingFeatureLimit,
					color: ui_switcher.SwitcherColor.green,
					useAirDesign: true,
					handlers: {
						toggled: () => this.handleSwitcherToggled()
					}
				}
			});
			this.button.renderTo(this.wrap);
			main_core.Event.bind(this.button.getSwitcher().getNode(), 'click', this.handleSwitcherWrapClick.bind(this), {
				capture: true
			});
			if (this.payAttentionToNewFeatureMode === this.PAY_ATTENTION_TO_NEW_FEATURE_JOINT) {
				setTimeout(() => {
					if (BX.SidePanel.Instance.getTopSlider() === null) {
						this.payAttentionToNewFeatureWithText();
						BX.ajax.runAction('calendar.api.sharingajax.disableOptionPayAttentionToNewSharingFeature');
					}
				}, this.PAY_ATTENTION_TO_NEW_FEATURE_DELAY);
			}
		}
		handleSharingButtonClick() {
			if (this.sharingFeatureLimit) {
				ui_infoHelper.FeaturePromotersRegistry.getPromoter({
					featureId: 'calendar_sharing'
				}).show();
				return;
			}
			if (this.isSharingEnabled()) {
				this.openDialog();
			} else {
				this.button.getSwitcher().toggle();
			}
		}
		handleSwitcherWrapClick(event) {
			if (this.button.getSwitcher().isChecked()) {
				this.showWarningPopup();
				event.stopPropagation();
			}
		}
		handleSwitcherToggled() {
			if (this.sharingFeatureLimit && this.button.getSwitcher().isChecked()) {
				ui_infoHelper.FeaturePromotersRegistry.getPromoter({
					featureId: 'calendar_sharing'
				}).show();
				this.button.getSwitcher().toggle();
				return;
			}
			if (this.isToggledAfterErrorOccurred()) {
				return;
			}
			if (this.button.getSwitcher().isChecked()) {
				this.enableSharing();
			} else {
				this.disableSharing();
			}
		}
		isToggledAfterErrorOccurred() {
			return this.button.getSwitcher().isChecked() === this.isSharingEnabled();
		}
		isSharingEnabled() {
			return main_core.Type.isString(this.sharingUrl);
		}
		enableSharing() {
			const action = 'calendar.api.sharingajax.enableUserSharing';
			const event = 'Calendar.Sharing.copyLinkButton:onSharingEnabled';
			BX.ajax.runAction(action).then(response => {
				this.sharingUrl = response.data.url;
				this.linkHash = response.data.hash;
				this.sharingRule = response.data.rule;
				this.openDialog();
				main_core_events.EventEmitter.emit(event, {
					isChecked: this.button.getSwitcher().isChecked(),
					url: response.data.url
				});
			}).catch(() => {
				this.button.getSwitcher().toggle();
			});
		}
		openDialog() {
			this.pulsar?.close();
			main_core.Dom.remove(this.counterNode);
			this.newDialog ??= new DialogNew({
				bindElement: this.button.getContainer(),
				sharingUrl: this.sharingUrl,
				linkHash: this.linkHash,
				sharingRule: this.sharingRule,
				context: 'calendar',
				calendarSettings: {
					weekHolidays: calendar_util.Util.config.week_holidays,
					weekStart: calendar_util.Util.config.week_start,
					workTimeStart: calendar_util.Util.config.work_time_start,
					workTimeEnd: calendar_util.Util.config.work_time_end
				},
				userInfo: this.userInfo,
				settingsCollapsed: this.sharingSettingsCollapsed,
				sortJointLinksByFrequentUse: this.sortJointLinksByFrequentUse
			});
			if (!this.newDialog.isShown()) {
				this.newDialog.show();
			}
		}
		disableSharing() {
			const action = 'calendar.api.sharingajax.disableUserSharing';
			const event = 'Calendar.Sharing.copyLinkButton:onSharingDisabled';
			this.warningPopup.close();
			BX.ajax.runAction(action).then(() => {
				this.sharingUrl = null;
				if (this.newDialog) {
					this.newDialog.destroy();
					this.newDialog = null;
				}
				main_core_events.EventEmitter.emit(event, {
					isChecked: this.button.getSwitcher().isChecked()
				});
			}).catch(() => {
				this.button.getSwitcher().toggle();
			});
		}
		showWarningPopup() {
			if (!this.warningPopup) {
				this.warningPopup = new ui_dialogs_messagebox.MessageBox({
					useAirDesign: true,
					title: main_core.Loc.getMessage('SHARING_WARNING_POPUP_TITLE_1'),
					message: main_core.Loc.getMessage('SHARING_WARNING_POPUP_CONTENT_2'),
					buttons: this.getWarningPopupButtons(),
					popupOptions: {
						autoHide: true,
						closeByEsc: true,
						draggable: false,
						closeIcon: true,
						minWidth: 365,
						maxWidth: 385,
						minHeight: 180
					}
				});
			}
			this.warningPopup.show();
		}
		getWarningPopupButtons() {
			return [this.getSubmitButton(), this.getCancelButton()];
		}
		getSubmitButton() {
			return new ui_buttons.Button({
				size: ui_buttons.ButtonSize.MEDIUM,
				color: ui_buttons.ButtonColor.DANGER,
				text: main_core.Loc.getMessage('SHARING_WARNING_POPUP_SUBMIT_BUTTON_NEW_MSGVER_1'),
				events: {
					click: () => this.handleSubmitButtonClick()
				}
			});
		}
		getCancelButton() {
			return new ui_buttons.Button({
				size: ui_buttons.ButtonSize.MEDIUM,
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				text: main_core.Loc.getMessage('SHARING_WARNING_POPUP_CANCEL_BUTTON'),
				events: {
					click: () => this.handleCancelButtonClick()
				}
			});
		}
		handleSubmitButtonClick() {
			this.button.getSwitcher().toggle();
			this.warningPopup.close();
		}
		handleCancelButtonClick() {
			this.warningPopup.close();
		}
		payAttentionToNewFeature(mode) {
			if (this.PAY_ATTENTION_TO_NEW_FEATURE_WITHOUT_TEXT_MODS.includes(mode)) {
				this.payAttentionToNewFeatureWithoutText();
			}
			if (this.PAY_ATTENTION_TO_NEW_FEATURE_WITH_TEXT_MODS.includes(mode)) {
				this.payAttentionToNewFeatureWithText();
			}
		}
		payAttentionToNewFeatureWithoutText() {
			this.pulsar = this.getPulsar(this.wrap, false);
			this.pulsar.show();
			main_core.Event.bind(this.pulsar.container, 'click', () => {
				this.handleSharingButtonClick();
			});
			this.counterNode = new ui_cnt.Counter({
				value: 1,
				color: ui_cnt.Counter.Color.DANGER,
				size: ui_cnt.Counter.Size.MEDIUM,
				animation: false
			}).getContainer();
			main_core.Dom.addClass(this.counterNode, 'calendar-sharing__new-feature-counter');
			main_core.Dom.append(this.counterNode, this.wrap);
		}
		payAttentionToNewFeatureWithText() {
			const title = main_core.Loc.getMessage('CALENDAR_PAY_ATTENTION_TO_NEW_FEATURE_JOINT_TITLE');
			const text = main_core.Loc.getMessage('CALENDAR_PAY_ATTENTION_TO_NEW_FEATURE_JOINT_TEXT');
			const guide = this.getGuide(title, text);
			const pulsar = this.getPulsar(this.wrap);
			guide.showNextStep();
			guide.getPopup().setAngle({
				offset: 210
			});
			pulsar.show();
		}
		getGuide(title, text) {
			const guide = new ui_tour.Guide({
				simpleMode: true,
				onEvents: true,
				steps: [{
					target: this.wrap,
					title,
					text,
					position: 'bottom',
					condition: {
						top: true,
						bottom: false,
						color: 'primary'
					}
				}]
			});
			const guidePopup = guide.getPopup();
			main_core.Dom.addClass(guidePopup.popupContainer, 'calendar-popup-ui-tour-animate');
			guidePopup.setWidth(400);
			main_core.Dom.style(guidePopup.getContentContainer(), 'paddingRight', getComputedStyle(guidePopup.closeIcon).width);
			return guide;
		}
		getPulsar(target, hideOnHover = true) {
			const pulsar = new BX.SpotLight({
				targetElement: target,
				targetVertex: 'middle-center',
				lightMode: true
			});
			if (hideOnHover) {
				pulsar.bindEvents({
					onTargetEnter: () => pulsar.close()
				});
			}
			return pulsar;
		}
	}

	class GroupSharingButton extends SharingButton {
		constructor(options = {}) {
			super(options);
			this.calendarContext = options.calendarContext;
		}

		/**
		 * @override
		 */
		openDialog() {
			this.pulsar?.close();
			main_core.Dom.remove(this.counterNode);
			if (!this.newDialog) {
				this.newDialog = new DialogNew({
					bindElement: this.button.getContainer(),
					sharingUrl: this.sharingUrl,
					linkHash: this.linkHash,
					sharingRule: this.sharingRule,
					context: 'calendar',
					calendarSettings: {
						weekHolidays: calendar_util.Util.config.week_holidays,
						weekStart: calendar_util.Util.config.week_start,
						workTimeStart: calendar_util.Util.config.work_time_start,
						workTimeEnd: calendar_util.Util.config.work_time_end
					},
					userInfo: this.userInfo,
					settingsCollapsed: this.sharingSettingsCollapsed,
					sortJointLinksByFrequentUse: this.sortJointLinksByFrequentUse,
					calendarContext: this.calendarContext
				});
			}
			if (!this.newDialog.isShown()) {
				this.newDialog.show();
			}
		}

		/**
		 * @override
		 */
		enableSharing() {
			const event = 'Calendar.Sharing.copyLinkButton:onSharingEnabled';
			BX.ajax.runAction('calendar.api.sharinggroupajax.enableSharing', {
				data: {
					groupId: this.calendarContext.sharingObjectId
				}
			}).then(response => {
				this.sharingUrl = response.data.url;
				this.linkHash = response.data.hash;
				this.sharingRule = response.data.rule;
				this.openDialog();
				main_core_events.EventEmitter.emit(event, {
					isChecked: this.switcher.isChecked(),
					url: response.data.url
				});
			}).catch(() => {
				this.switcher.toggle();
			});
		}

		/**
		 * @override
		 */
		disableSharing() {
			const event = 'Calendar.Sharing.copyLinkButton:onSharingDisabled';
			this.warningPopup.close();
			BX.ajax.runAction('calendar.api.sharinggroupajax.disableSharing', {
				data: {
					groupId: this.calendarContext.sharingObjectId
				}
			}).then(() => {
				this.sharingUrl = null;
				if (this.newDialog) {
					this.newDialog.destroy();
					this.newDialog = null;
				}
				main_core_events.EventEmitter.emit(event, {
					isChecked: this.switcher.isChecked()
				});
			}).catch(() => {
				this.switcher.toggle();
			});
		}
	}

	class GroupSharing extends GroupSharingButton {
		constructor(options = {}) {
			super(options);
			this.bindElement = options.bindElement;
			this.calendarSettings = options.calendarSettings;
			this.context = options.context;
			if (options.sharingConfig) {
				this.sharingConfig = options.sharingConfig;
				this.sharingUrl = this.sharingConfig?.url || null;
				this.linkHash = this.sharingConfig?.hash || null;
				this.sharingRule = this.sharingConfig?.rule || null;
			}
		}

		/**
		 * @override
		 */
		openDialog() {
			this.newDialog ??= new DialogNew({
				bindElement: this.bindElement,
				sharingUrl: this.sharingUrl,
				linkHash: this.linkHash,
				sharingRule: this.sharingRule,
				context: this.context,
				calendarSettings: {
					weekHolidays: this.calendarSettings.week_holidays,
					weekStart: this.calendarSettings.week_start,
					workTimeStart: this.calendarSettings.work_time_start,
					workTimeEnd: this.calendarSettings.work_time_end
				},
				userInfo: this.userInfo,
				settingsCollapsed: this.sharingSettingsCollapsed,
				sortJointLinksByFrequentUse: this.sortJointLinksByFrequentUse,
				calendarContext: this.calendarContext
			});
			if (!this.newDialog.isShown()) {
				this.newDialog.show();
			}
		}

		/**
		 * @override
		 */
		async enableSharing() {
			const response = await main_core.ajax.runAction('calendar.api.sharinggroupajax.enableSharing', {
				data: {
					groupId: this.calendarContext.sharingObjectId
				}
			});
			main_core_events.EventEmitter.emit('Calendar.Sharing.copyLinkButton:onSharingEnabled', {
				isChecked: true,
				url: response.data.url
			});
		}
	}

	class GroupSharingController {
		static #groupSharing = null;
		static #groupId = null;
		static #bindElement = null;
		static #config = null;
		static async getGroupSharing(groupId, bindElement) {
			if (GroupSharingController.#groupSharing && GroupSharingController.#groupId === groupId && (GroupSharingController.#bindElement === bindElement || !bindElement)) {
				return GroupSharingController.#groupSharing;
			}
			const config = await this.#getSharingConfig(groupId);
			GroupSharingController.#groupSharing = new GroupSharing({
				bindElement,
				context: 'calendar',
				calendarContext: {
					sharingObjectType: 'group',
					sharingObjectId: groupId,
					externalSharing: true
				},
				userInfo: {
					id: config.user.id,
					name: config.user.name,
					avatar: config.user.avatar,
					isCollabUser: config.user.isCollabUser
				},
				sharingConfig: config.link,
				calendarSettings: config.userCalendarSettings
			});
			GroupSharingController.#config = config;
			GroupSharingController.#groupId = groupId;
			GroupSharingController.#bindElement = bindElement;
			return this.#groupSharing;
		}
		static async #getSharingConfig(groupId) {
			if (this.#groupId === groupId && this.#config) {
				return Promise.resolve(this.#config);
			}
			return this.#requestSharingConfig(groupId);
		}
		static async #requestSharingConfig(groupId) {
			const response = await main_core.ajax.runAction('calendar.api.sharinggroupajax.enableAndGetSharingConfig', {
				data: {
					groupId
				}
			});
			return response.data;
		}
	}

	class UserSharing extends SharingButton {
		constructor(options = {}) {
			super(options);
			this.bindElement = options.bindElement;
			this.calendarSettings = options.calendarSettings;
			this.context = options.context;
			if (options.sharingConfig) {
				this.sharingConfig = options.sharingConfig;
				this.sharingUrl = this.sharingConfig?.url || null;
				this.linkHash = this.sharingConfig?.hash || null;
				this.sharingRule = this.sharingConfig?.rule || null;
			}
		}

		/**
		 * @override
		 */
		openDialog() {
			this.newDialog ??= new DialogNew({
				bindElement: this.bindElement,
				sharingUrl: this.sharingUrl,
				linkHash: this.linkHash,
				sharingRule: this.sharingRule,
				context: this.context,
				calendarSettings: {
					weekHolidays: this.calendarSettings.week_holidays,
					weekStart: this.calendarSettings.week_start,
					workTimeStart: this.calendarSettings.work_time_start,
					workTimeEnd: this.calendarSettings.work_time_end
				},
				userInfo: this.userInfo,
				settingsCollapsed: this.sharingSettingsCollapsed,
				sortJointLinksByFrequentUse: this.sortJointLinksByFrequentUse
			});
			if (!this.newDialog.isShown()) {
				this.newDialog.show();
			}
		}

		/**
		 * @override
		 */
		async enableSharing() {
			const response = await main_core.ajax.runAction('calendar.api.sharingajax.enableAndGetSharingConfig');
			main_core_events.EventEmitter.emit('Calendar.Sharing.copyLinkButton:onSharingEnabled', {
				isChecked: true,
				url: response.data.link.url
			});
		}
	}

	class UserSharingController {
		static #userSharing = null;
		static #userId = null;
		static #bindElement = null;
		static #config = null;
		static async getUserSharing(userId, bindElement) {
			if (UserSharingController.#userSharing && UserSharingController.#userId === userId && (UserSharingController.#bindElement === bindElement || !bindElement)) {
				return UserSharingController.#userSharing;
			}
			const config = await this.#getSharingConfig(userId);
			UserSharingController.#userSharing = new UserSharing({
				bindElement,
				context: 'calendar',
				userInfo: {
					id: config.user.id,
					name: config.user.name,
					avatar: config.user.avatar
				},
				sharingConfig: config.link,
				calendarSettings: config.userCalendarSettings
			});
			UserSharingController.#config = config;
			UserSharingController.#userId = userId;
			UserSharingController.#bindElement = bindElement;
			return this.#userSharing;
		}
		static async #getSharingConfig(userId) {
			if (this.#userId === userId && this.#config) {
				return Promise.resolve(this.#config);
			}
			return this.#requestSharingConfig(userId);
		}
		static async #requestSharingConfig(userId) {
			const response = await main_core.ajax.runAction('calendar.api.sharingajax.enableAndGetSharingConfig', {
				data: {
					userId
				}
			});
			return response.data;
		}
	}

	class Interface {
		constructor(options) {
			this.buttonWrap = options.buttonWrap;
			this.userInfo = options.userInfo || null;
			this.payAttentionToNewFeature = options.payAttentionToNewFeature ?? false;
			this.sharingFeatureLimit = options.sharingFeatureLimit ?? false;
			this.sharingSettingsCollapsed = options.sharingSettingsCollapsed ?? false;
			this.sortJointLinksByFrequentUse = options.sortJointLinksByFrequentUse ?? false;
			this.calendarContext = options.calendarContext ?? null;
		}
		showSharingButton() {
			this.sharingButton = new SharingButton({
				wrap: this.buttonWrap,
				userInfo: this.userInfo,
				payAttentionToNewFeature: this.payAttentionToNewFeature,
				sharingFeatureLimit: this.sharingFeatureLimit,
				sharingSettingsCollapsed: this.sharingSettingsCollapsed,
				sortJointLinksByFrequentUse: this.sortJointLinksByFrequentUse
			});
			this.sharingButton.show();
		}
		showGroupSharingButton() {
			this.sharingButton = new GroupSharingButton({
				wrap: this.buttonWrap,
				userInfo: this.userInfo,
				payAttentionToNewFeature: this.payAttentionToNewFeature,
				sharingFeatureLimit: this.sharingFeatureLimit,
				sharingSettingsCollapsed: this.sharingSettingsCollapsed,
				sortJointLinksByFrequentUse: this.sortJointLinksByFrequentUse,
				calendarContext: this.calendarContext
			});
			this.sharingButton.show();
		}
	}

	exports.DialogNew = DialogNew;
	exports.DialogQr = DialogQr;
	exports.GroupSharing = GroupSharing;
	exports.GroupSharingController = GroupSharingController;
	exports.Interface = Interface;
	exports.Layout = Layout;
	exports.RangeModel = RangeModel;
	exports.RuleModel = RuleModel;
	exports.SettingsModel = SettingsModel;
	exports.SharingButton = SharingButton;
	exports.UserSharing = UserSharing;
	exports.UserSharingController = UserSharingController;

})(this.BX.Calendar.Sharing = this.BX.Calendar.Sharing || {}, BX, BX.Event, BX.Main, BX.Calendar.Sharing, BX.Calendar, BX.Main, BX.UI.EntitySelector, window, BX.UI, BX.UI.IconSet, BX.UI.Dialogs, BX.UI, BX, BX, BX, BX.UI, BX, BX.UI.Tour, BX.UI, BX.UI);
//# sourceMappingURL=interface.bundle.js.map
