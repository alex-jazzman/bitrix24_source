/* eslint-disable */
this.BX = this.BX || {};
this.BX.Calendar = this.BX.Calendar || {};
(function (exports, main_core, main_core_events, ui_icons_b24, ui_iconSet_actions, main_popup, ui_avatar, calendar_util, main_date, ui_bottomsheet) {
	'use strict';

	function bindShowOnHover(popup) {
		if (popup instanceof main_popup.Menu) {
			popup = popup.getPopupWindow();
		}
		const bindElement = popup.bindElement;
		const container = popup.getPopupContainer();
		let hoverElement = null;
		const closeMenuHandler = () => {
			setTimeout(() => {
				if (!container.contains(hoverElement) && !bindElement.contains(hoverElement)) {
					popup.close();
				}
			}, 100);
		};
		const showMenuHandler = () => {
			setTimeout(() => {
				if (bindElement.contains(hoverElement)) {
					popup.show();
				}
			}, 300);
		};
		const clickHandler = () => {
			if (!popup.isShown()) {
				popup.show();
			}
		};
		main_core.Event.bind(document, 'mouseover', event => {
			hoverElement = event.target;
		});
		main_core.Event.bind(bindElement, 'mouseenter', showMenuHandler);
		main_core.Event.bind(bindElement, 'mouseleave', closeMenuHandler);
		main_core.Event.bind(container, 'mouseleave', closeMenuHandler);
		main_core.Event.bind(bindElement, 'click', clickHandler);
		let popupWidth = popup.getPopupContainer().offsetWidth;
		let elementWidth = popup.bindElement.offsetWidth;
		const angleLeft = main_popup.Popup.getOption('angleMinBottom');
		const handleScroll = () => {
			popup.adjustPosition();
			if (popup.angle) {
				popup.setAngle({
					offset: popupWidth / 2 + angleLeft
				});
			}
		};
		popup.subscribeFromOptions({
			onShow: () => {
				popupWidth = popup.getPopupContainer().offsetWidth;
				elementWidth = popup.bindElement.offsetWidth;
				popup.setOffset({
					offsetLeft: elementWidth / 2 - popupWidth / 2
				});
				popup.adjustPosition();
				if (popup.angle) {
					popup.setAngle({
						offset: popupWidth / 2 + angleLeft
					});
				}
				document.addEventListener('scroll', handleScroll, true);
			},
			onAfterPopupShow: () => {
				const left = popup.bindElement.getBoundingClientRect().left + elementWidth / 2 - popupWidth / 2;
				if (left < 0 || left + popupWidth > window.innerWidth) {
					return;
				}
				popup.getPopupContainer().style.left = left + 'px';
				if (popup.angle) {
					popup.angle.element.style.marginLeft = popupWidth / 2 - 16 + 'px';
				}
			},
			onClose: () => {
				document.removeEventListener('scroll', handleScroll, true);
			}
		});
	}

	class MembersList {
		#layout;
		#params;
		#members;
		constructor(params) {
			this.#layout = {};
			this.#params = params;
			this.#members = params.members;
		}
		render() {
			if (!main_core.Type.isArrayFilled(this.#members)) {
				return '';
			}
			this.#layout.wrap = main_core.Tag.render`
			<div class="${this.#params.className}">
				<div class="${this.#params.textClassName}">
					${this.#getMembersTitle()}
				</div>
				<div class="calendar-pub-line-avatar-container" style="--ui-icon-size: ${this.#params.avatarSize}px">
					${this.#renderAvatarItems()}
				</div>
			</div>
		`;
			const menu = main_popup.MenuManager.create({
				id: `calendar-pub-welcome-more-avatar-popup${Date.now()}`,
				bindElement: this.#layout.avatarItems,
				className: 'calendar-pub-users-popup',
				items: this.#members.map(member => ({
					html: main_core.Tag.render`
					<div class="calendar-pub-users-popup-avatar-container">
						${this.#renderAvatar(member, 'calendar-pub-users-popup-avatar')}
						<div class="calendar-pub-users-popup-avatar-text">
							<span class="calendar-pub-users-popup-avatar-text-name">
								${main_core.Text.encode(`${member.name} ${member.lastName}`.trim())}
							</span>
							<span class="calendar-pub-users-popup-avatar-text-you">
								${member.isOwner ? main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_YOU_LABEL') : ''}
							</span>
						</div>
					</div>
				`
				})),
				maxHeight: 300,
				maxWidth: 300
			});
			bindShowOnHover(menu);
			return this.#layout.wrap;
		}
		#getMembersTitle() {
			switch (true) {
				case this.#params.allAttendees:
					return main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_ATTENDEES');
				case this.#params.linkContext === 'group':
					return main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_GROUP_ATTENDEES');
				default:
					return main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_HAS_MORE_USERS');
			}
		}
		#renderAvatarItems() {
			const maxAvatarsCount = this.#params.maxAvatarsCount ?? 4;
			const showMoreIcon = this.#members.length > maxAvatarsCount;
			const avatarsCount = showMoreIcon ? maxAvatarsCount - 1 : maxAvatarsCount;
			const avatarClassName = 'calendar-pub-line-avatar';
			this.#layout.avatarItems = main_core.Tag.render`
			<div class="calendar-pub-line-avatars">
				${this.#members.slice(0, avatarsCount).map(member => this.#renderAvatar(member, avatarClassName))}
				${showMoreIcon ? this.#renderMoreAvatar() : ''}
			</div>
		`;
			return this.#layout.avatarItems;
		}
		#renderMoreAvatar() {
			return main_core.Tag.render`
			<span class="ui-icon ui-icon-common-user calendar-pub-line-avatar calendar-pub-line-avatar-more-container">
				<div class="ui-icon-set --more calendar-pub-line-avatar-more"></div>
			</span>
		`;
		}
		#renderAvatar(member, className = '') {
			if (member.isCollabUser) {
				return this.#renderCollabAvatar(member);
			}
			return main_core.Tag.render`
			<span class="ui-icon ui-icon-common-user ${className}">
				<i style="${this.#hasAvatar(member) ? `background-image: url('${member.avatar}')` : ''}"></i>
			</span>
		`;
		}
		#renderCollabAvatar(member) {
			return new ui_avatar.AvatarRoundGuest({
				size: 36,
				userName: `${member.name} ${member.lastName}`.trim(),
				userpicPath: member.avatar,
				baseColor: '#19cc45'
			}).getContainer();
		}
		#hasAvatar(member) {
			return main_core.Type.isStringFilled(member.avatar) && member.avatar !== '/bitrix/images/1.gif';
		}
	}

	class Welcome {
		#owner;
		#link;
		#currentLang;
		#name;
		#lastName;
		#photo;
		#layout;
		#members;
		#isGroupContext;
		constructor(options) {
			this.#owner = options.owner || null;
			this.#link = options.link || null;
			this.#currentLang = options.currentLang || null;
			this.#name = this.#owner.name || null;
			this.#lastName = this.#owner.lastName || null;
			this.#photo = this.#owner.photo || null;
			this.#layout = {
				wrapper: null,
				button: null,
				label: null
			};
			this.#members = options.members;
			this.#isGroupContext = this.#link?.type === 'group';
			if (this.#link && this.#link.type === 'crm_deal' && this.#link.active === true && this.#link.lastStatus !== 'viewed' && this.#link.lastStatus !== 'notViewed') {
				this.#handleTimelineNotify('notViewed');
				this.#link.lastStatus = 'notViewed';
			}
		}
		disableButton() {
			main_core.Dom.addClass(this.#layout.button, '--disabled');
		}
		enableButton() {
			main_core.Dom.removeClass(this.#layout.button, '--disabled');
		}
		hideButton() {
			main_core.Dom.addClass(this.#layout.button, '--hidden');
		}
		handleWelcomePageButtonClick() {
			if (main_core.Dom.hasClass(this.#layout.button, '--disabled')) {
				return;
			}
			if (this.#link && this.#link.type === 'crm_deal' && this.#link.active === true && this.#link.lastStatus === 'notViewed') {
				this.#handleTimelineNotify('viewed');
				this.#link.lastStatus = 'viewed';
			}
			this.disableButton();
			main_core_events.EventEmitter.emit('showSlotSelector', this);
		}
		#handleTimelineNotify(mode) {
			void BX.ajax.runAction('calendar.api.sharingajax.handleTimelineNotify', {
				data: {
					linkHash: this.#link.hash,
					entityId: this.#link.entityId,
					entityType: this.#link.type,
					notifyType: mode
				}
			});
		}
		#getNodeButton() {
			if (!this.#layout.button) {
				this.#layout.button = main_core.Tag.render`
				<div class="calendar-pub-ui__btn">
					<div class="calendar-pub-ui__btn-text">${main_core.Loc.getMessage('CALENDAR_SHARING_SELECT_SLOT')}</div>
				</div>
			`;
				main_core.Event.bind(this.#layout.button, 'click', () => {
					this.handleWelcomePageButtonClick();
				});
				main_core_events.EventEmitter.subscribe('hideSlotSelector', this.enableButton.bind(this));
			}
			return this.#layout.button;
		}
		#getNodeLabel() {
			if (!this.#layout.label) {
				this.#layout.label = main_core.Tag.render`
				<div class="calendar-pub__block-label"></div>
			`;
				if (this.#currentLang === 'ru') {
					main_core.Dom.addClass(this.#layout.label, '--ru');
				}
			}
			return this.#layout.label;
		}
		setAccessDenied() {
			this.#layout.info = this.#getNodeInfo(true);
		}
		#getNodeInfo(accessDenied = false) {
			if (!this.#layout.info) {
				this.#layout.infoTitle = main_core.Tag.render`
				<div class="calendar-pub-ui__typography-title calendar-pub__welcome-info_title"></div>
			`;
				this.#layout.infoSubTitle = main_core.Tag.render`
				<div class="calendar-pub-ui__typography-s calendar-pub__welcome-info_subtitle"></div>
			`;
				this.#layout.info = main_core.Tag.render`
				<div class="calendar-pub__welcome-info">
					${this.#layout.infoTitle}
					${this.#layout.infoSubTitle}
					${this.#renderAvatarsSection(this.#members)}
				</div>
			`;
			}
			const titleMessage = this.#isGroupContext ? 'CALENDAR_SHARING_GROUP_FREE_SLOTS' : 'CALENDAR_SHARING_MY_FREE_SLOTS';
			let title = main_core.Loc.getMessage(titleMessage);
			const subtitleMessage = this.#isGroupContext ? 'CALENDAR_SHARING_GROUP_YOU_CAN_CHOOSE_FREE_MEETING_TIME' : 'CALENDAR_SHARING_YOU_CAN_CHOOSE_FREE_MEETING_TIME';
			let subTitle = main_core.Loc.getMessage(subtitleMessage);
			if (accessDenied) {
				title = main_core.Loc.getMessage('CALENDAR_SHARING_SLOTS_ACCESS_DENIED');
				subTitle = main_core.Loc.getMessage('CALENDAR_SHARING_SLOTS_ACCESS_DENIED_INFO');
			}
			this.#layout.infoTitle.innerText = title;
			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-dom-methods
			this.#layout.infoSubTitle.appendChild(main_core.Tag.render`<span>${subTitle}</span>`);
			return this.#layout.info;
		}
		#renderAvatarsSection(members) {
			return new MembersList({
				className: 'calendar-pub-welcome-avatar-section-container',
				textClassName: 'calendar-pub-ui__typography-xs-uppercase',
				avatarSize: 36,
				members,
				linkContext: this.#link?.type
			}).render();
		}
		render() {
			const node = main_core.Tag.render`
			<div class="calendar-pub__block --welcome">
				${this.#getNodeLabel()}
				<div class="calendar-pub__welcome">
					<div class="calendar-pub__welcome-user">
						<div class="calendar-pub__welcome-userpic ui-icon ui-icon-common-user">
							${this.#renderMainAvatar()}
						</div>
						<div class="calendar-pub-ui__typography-m" title="${this.#name || ''} ${this.#lastName || ''}">
							${this.#name || ''} ${this.#lastName || ''} 
						</div>
					</div>
					<div class="calendar-pub__block-separator"></div>
					${this.#getNodeInfo()}
					<div class="calendar-pub__welcome-bottom">
						${this.#getNodeButton()}
					</div>
				</div>
			</div>
		`;
			if (this.#isGroupContext) {
				const avatar = new ui_avatar.AvatarHexagonGuest({
					size: 64,
					userName: this.#name.toUpperCase(),
					baseColor: '#19CC45',
					userpicPath: this.#photo
				});
				avatar.renderTo(node.querySelector('.calendar-pub__group-avatar'));
			}
			return node;
		}
		#renderMainAvatar() {
			if (this.#isGroupContext) {
				return '<div class="calendar-pub__group-avatar"></div>';
			}
			const avatarStyle = this.#photo ? `style="background-image: url(${encodeURI(this.#photo)})"` : '';
			return `<i ${avatarStyle}></i>`;
		}
	}

	class Day {
		#layout;
		#value;
		#notCurrentMonth;
		#today;
		#selected;
		#weekend;
		#slots;
		#enableBooking;
		constructor(options) {
			this.#value = options.value || null;
			this.#notCurrentMonth = options.notCurrentMonth || null;
			this.#today = options.today || null;
			this.#slots = options.slots || null;
			this.#layout = {
				wrapper: null
			};
			this.#selected = options.selected || null;
			this.#weekend = options.weekend || null;
			this.#enableBooking = options.enableBooking || null;
			if (this.#selected) {
				this.select();
			}
			this.#bindEvents();
		}
		#bindEvents() {
			main_core.Event.bind(this.#getNodeWrapper(), 'click', this.select.bind(this));
		}
		isSelected() {
			return this.#selected;
		}
		getDay() {
			return this.#value;
		}
		isEnableBooking() {
			return this.#enableBooking;
		}
		select() {
			this.highlight();
			main_core_events.EventEmitter.emit('switchSlots', {
				slots: this.#slots
			});
		}
		highlight() {
			this.#selected = true;
			main_core.Dom.addClass(this.#getNodeWrapper(), '--selected');
			main_core_events.EventEmitter.emit('selectDate', this);
		}
		unSelect() {
			this.#selected = null;
			main_core.Dom.removeClass(this.#getNodeWrapper(), '--selected');
		}
		#getNodeWrapper() {
			if (!this.#layout.wrapper) {
				this.#layout.wrapper = main_core.Tag.render`
				<div class="calendar-sharing__month-col --day">${this.#value}</div>
			`;
				if (this.#notCurrentMonth) {
					main_core.Dom.addClass(this.#layout.wrapper, '--not-current-month');
				}
				if (this.#weekend) {
					main_core.Dom.addClass(this.#layout.wrapper, '--weekend');
				}
				if (this.#enableBooking) {
					main_core.Dom.addClass(this.#layout.wrapper, '--enable-booking');
				}
			}
			return this.#layout.wrapper;
		}
		render() {
			return this.#getNodeWrapper();
		}
	}

	class Calendar {
		#userIds;
		#accessibility;
		#layout;
		#currentMonth;
		#currentYear;
		#nowTime;
		#months;
		#selectedDay;
		#monthsSlotsMap;
		#timezoneOffsetUtc;
		#selectedTimezoneOffsetUtc;
		#currentMonthIndex;
		#currentDayNumber;
		#timezoneList;
		#calendarSettings;
		#rule;
		#selectedTimezoneId;
		#selectedTimezoneNode;
		#config;
		#loc;
		#timeZonePopup;
		constructor(options) {
			this.#layout = {
				wrapper: null,
				monthWrapper: null,
				timezoneWrapper: null,
				month: null,
				currentMonth: null,
				prevNav: null,
				nextNav: null,
				daysOfWeek: null,
				navigation: null,
				back: null
			};
			this.#userIds = options.userIds;
			this.#accessibility = options.accessibility;
			this.#timezoneList = options.timezoneList;
			this.#calendarSettings = options.calendarSettings;
			this.#rule = options.rule;
			this.#nowTime = new Date();
			this.#currentMonthIndex = 0;
			this.#currentDayNumber = 1;
			this.#selectedTimezoneId = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
			this.#currentMonth = this.#nowTime.getMonth();
			this.#currentYear = this.#nowTime.getFullYear();
			this.#timezoneOffsetUtc = this.#nowTime.getTimezoneOffset();
			this.#selectedTimezoneOffsetUtc = this.#nowTime.getTimezoneOffset();
			this.#months = [];
			this.#monthsSlotsMap = [];
			this.#config = {
				slotSize: this.#rule.slotSize,
				freeTime: {},
				stepSize: 30,
				weekHolidays: [6, 0],
				weekStart: 1
			};
			this.#loc = {
				weekdays: calendar_util.Util.getWeekdaysLoc()
			};
			this.#timeZonePopup = null;
			this.#initConfig();
			this.#initCurrentMonthSlots();
			this.#bindEvents();

			// preload the next month's accessibilities
			const nextYear = this.#getNextYear();
			const nextMonth = this.#getNextMonth();
			this.#loadMonthAccessibility(nextYear, nextMonth, false);
			setInterval(this.#incrementTime.bind(this), 15000);
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('selectDate', event => {
				const newSelectedDay = event.data;
				if (this.#selectedDay !== newSelectedDay) {
					this.#selectedDay?.unSelect();
				}
				this.#selectedDay = newSelectedDay;
				this.#currentDayNumber = this.#selectedDay.getDay();
			});
			main_core_events.EventEmitter.subscribe('onSaveEvent', async event => {
				if (event.data.state === 'created' || event.data.state === 'not-created') {
					await this.updateEventSlotsList();
					this.highlightMonthDay();
				}
			});
			main_core_events.EventEmitter.subscribe('onDeleteEvent', async () => {
				await this.updateEventSlotsList();
			});
			main_core_events.EventEmitter.subscribe('onCreateAnotherEventButtonClick', () => {
				this.selectFirstAvailableDay();
			});
		}
		#incrementTime() {
			this.#nowTime = new Date();
			const timezoneNode = this.#getNodeTimeZone();
			main_core.Dom.clean(this.#getNodeTimezoneWrapper());
			main_core.Dom.append(timezoneNode, this.#getNodeTimezoneWrapper());
		}
		#initConfig() {
			if (this.#calendarSettings.weekHolidays) {
				this.#config.weekHolidays = this.#calendarSettings.weekHolidays.map(weekDay => calendar_util.Util.getIndByWeekDay(weekDay));
			}
			if (this.#calendarSettings.yearHolidays) {
				this.#config.yearHolidays = this.#calendarSettings.yearHolidays;
			}
			if (this.#calendarSettings.weekStart) {
				this.#config.weekStart = calendar_util.Util.getIndByWeekDay(this.#calendarSettings.weekStart);
				this.#loc.weekdays.push(...this.#loc.weekdays.splice(0, this.#config.weekStart));
			}
			for (const range of this.#rule.ranges) {
				for (const weekday of range.weekdays) {
					this.#config.freeTime[weekday] ??= [];
					this.#config.freeTime[weekday].push({
						from: parseInt(range.from, 10),
						to: parseInt(range.to, 10)
					});
					const [intersected, notIntersected] = this.#separate(interval => this.#doIntervalsIntersect(interval.from, interval.to, parseInt(range.from, 10), parseInt(range.to, 10)), this.#config.freeTime[weekday]);
					if (intersected.length > 0) {
						const from = Math.min(...intersected.map(interval => interval.from));
						const to = Math.max(...intersected.map(interval => interval.to));
						this.#config.freeTime[weekday] = [...notIntersected, {
							from,
							to
						}];
					}
				}
			}
			const timezoneOffset = calendar_util.Util.getTimeZoneOffset(this.#selectedTimezoneId);
			const serverOffset = parseInt(this.#calendarSettings.serverOffset, 10);
			const offset = serverOffset + timezoneOffset;
			for (const weekday in this.#config.freeTime) {
				this.#config.freeTime[weekday] = this.#config.freeTime[weekday].map(range => {
					return {
						from: range.from - offset,
						to: range.to - offset
					};
				});
			}
			if (!this.#timezoneList[this.#selectedTimezoneId]) {
				this.#selectedTimezoneId = 'UTC';
			}
		}
		#separate(take, array) {
			return array.reduce(([t, f], e) => take(e) ? [[...t, e], f] : [t, [...f, e]], [[], []]);
		}
		#initCurrentMonthSlots() {
			this.#calculateDateTimeSlots(this.#nowTime.getFullYear(), this.#nowTime.getMonth());
			const month = this.#createMonth(this.#nowTime.getFullYear(), this.#nowTime.getMonth());
			this.#months.push(month);
		}
		#calculateDateTimeSlots(year, month) {
			const map = [];
			const daysCount = new Date(year, month + 1, 0).getDate();
			const accessibilityArrayKey = `${month + 1}.${year}`;
			const nowTimestamp = this.#nowTime.getTime();
			const timezoneOffset = (this.#selectedTimezoneOffsetUtc - this.#timezoneOffsetUtc) * -60 * 1000;
			for (let dayIndex = 1; dayIndex <= daysCount; dayIndex++) {
				const currentDate = new Date(year, month, dayIndex);
				if (this.#isYearHoliday(currentDate)) {
					continue;
				}
				const freeTime = this.#config.freeTime[currentDate.getDay()];
				if (main_core.Type.isUndefined(freeTime)) {
					continue;
				}
				for (const range of freeTime) {
					const from = new Date(year, month, dayIndex, Math.floor(range.from / 60), range.from % 60);
					const to = new Date(year, month, dayIndex, Math.floor(range.to / 60), range.to % 60);
					const dayAccessibility = this.#accessibility[accessibilityArrayKey].filter(event => {
						const parseUTC = !event.isFullDay;
						return this.#doIntervalsIntersect(BX.parseDate(event.from, parseUTC).getTime(), BX.parseDate(event.to, parseUTC).getTime(), from.getTime(), to.getTime());
					});
					while (from.getTime() < to.getTime()) {
						const slotStart = from.getTime();
						const slotEnd = slotStart + this.#config.slotSize * 60 * 1000;
						if (slotEnd > to.getTime()) {
							break;
						}
						const slotAccessibility = dayAccessibility.filter(event => {
							const parseUTC = !event.isFullDay;
							return this.#doIntervalsIntersect(BX.parseDate(event.from, parseUTC).getTime(), BX.parseDate(event.to, parseUTC).getTime(), slotStart, slotEnd);
						});
						const available = slotAccessibility.length === 0 && slotStart > nowTimestamp;
						if (available) {
							const timeFrom = new Date(slotStart + timezoneOffset);
							const timeTo = new Date(timeFrom.getTime() + (slotEnd - slotStart));
							const dateIndex = timeFrom.getDate();
							map[dateIndex] ??= [];
							if (timeFrom.getMonth() === month) {
								map[dateIndex].push({
									timeFrom,
									timeTo
								});
							}
						}
						from.setTime(from.getTime() + this.#config.stepSize * 60 * 1000);
					}
				}
			}
			this.#monthsSlotsMap[accessibilityArrayKey] = map;
		}
		#doIntervalsIntersect(from1, to1, from2, to2) {
			const startsInside = from2 <= from1 && from1 < to2;
			const endsInside = from2 < to1 && to1 <= to2;
			const startsBeforeEndsAfter = from1 <= from2 && to1 >= to2;
			return startsInside || endsInside || startsBeforeEndsAfter;
		}
		#createMonth(year, month) {
			return {
				year,
				month,
				currentTimezoneOffset: this.#selectedTimezoneOffsetUtc,
				name: this.#getMonthName(month),
				days: this.#getMonthDays(year, month)
			};
		}
		async updateEventSlotsList() {
			const month = this.#months[this.#currentMonthIndex];
			const currentYear = month.year;
			const currentMonth = month.month + 1;
			await this.#loadMonthAccessibility(currentYear, currentMonth);
			this.#reCreateCurrentMonth();
		}
		#reCreateCurrentMonth() {
			this.#updateMonth(this.#currentMonthIndex);
			this.#updateCalendar();
		}
		async #createNextMonth() {
			this.nextMonthCreating = true;
			const currentMonth = this.#months[this.#currentMonthIndex];
			const currentYear = currentMonth.year;
			const currentMonthIndex = currentMonth.month;
			const nextMonthIndex = (currentMonthIndex + 1) % 12;
			const nextYear = currentYear + Math.floor((currentMonthIndex + 1) / 12);
			const nextMonth = nextMonthIndex + 1;
			await this.#loadMonthAccessibility(nextYear, nextMonth);
			this.#calculateDateTimeSlots(nextYear, nextMonthIndex);
			const month = this.#createMonth(nextYear, nextMonthIndex);
			this.#months.push(month);
			this.nextMonthCreating = false;
		}
		#getNextMonth() {
			const currentMonth = this.#months[this.#currentMonthIndex];
			const currentMonthIndex = currentMonth.month;
			const nextMonthIndex = (currentMonthIndex + 1) % 12;
			return nextMonthIndex + 1;
		}
		#getNextYear() {
			const currentMonth = this.#months[this.#currentMonthIndex];
			const currentYear = currentMonth.year;
			const currentMonthIndex = currentMonth.month;
			return currentYear + Math.floor((currentMonthIndex + 1) / 12);
		}
		async #loadMonthAccessibility(year, month, preloadNextMonth = true) {
			const arrayKey = `${month}.${year}`;
			const firstMonthDay = new Date(year, month - 1, 1);
			const lastMonthDay = new Date(year, month, 0, 23, 59);
			if (!this.#accessibility[arrayKey]) {
				const response = await BX.ajax.runAction('calendar.api.sharingajax.getUsersAccessibility', {
					data: {
						userIds: this.#userIds,
						timestampFrom: firstMonthDay.getTime(),
						timestampTo: lastMonthDay.getTime()
					}
				});
				this.#accessibility[arrayKey] = response.data;
			}
			if (preloadNextMonth === false) {
				return;
			}
			const nextMonthIndex = month % 12;
			const nextYear = year + Math.floor(month / 12);
			const nextMonth = nextMonthIndex + 1;
			this.#loadMonthAccessibility(nextYear, nextMonth, false);
		}
		#getMonthName(month) {
			const currentMonthDate = new Date(this.#nowTime.getFullYear(), month, 1);
			return main_date.DateTimeFormat.format('f', currentMonthDate.getTime() / 1000);
		}
		#getMonthDays(year, month) {
			const days = [];
			const daysCount = new Date(year, month + 1, 0).getDate();
			const accessibilityArrayKey = `${month + 1}.${year}`;
			for (let dayIndex = 1; dayIndex <= daysCount; dayIndex++) {
				const newDay = new Date(year, month, dayIndex);
				const slots = this.#monthsSlotsMap[accessibilityArrayKey][newDay.getDate()] ?? [];
				const params = {
					value: dayIndex,
					slots,
					weekend: this.#isHoliday(newDay),
					enableBooking: slots.length > 0
				};
				const day = new Day(params);
				days.push(day);
			}
			return days;
		}
		selectFirstAvailableDay() {
			let visibleDays = this.#months[this.#currentMonthIndex].days;
			if (this.#currentMonthIndex === 0) {
				const todayDay = this.#nowTime.getDate();
				visibleDays = visibleDays.filter(day => day.getDay() >= todayDay).slice(0, 14);
			}
			let dayToSelect = visibleDays.find(day => day.isEnableBooking());
			if (dayToSelect === undefined) {
				dayToSelect = visibleDays[0];
			}
			dayToSelect.select();
		}
		selectMonthDay() {
			const dayToSelect = this.#getDayToSelect();
			this.#currentDayNumber = dayToSelect.day;
			dayToSelect.select();
		}
		highlightMonthDay() {
			const dayToSelect = this.#getDayToSelect();
			this.#currentDayNumber = dayToSelect.day;
			dayToSelect.highlight();
		}
		#getDayToSelect() {
			const monthDays = this.#months[this.#currentMonthIndex].days;
			let dayToSelect = monthDays.find(day => day.getDay() === this.#currentDayNumber);
			if (dayToSelect === undefined) {
				dayToSelect = monthDays[monthDays.length - 1];
			}
			return dayToSelect;
		}
		#isHoliday(day) {
			const monthKey = `0${day.getMonth() + 1}`.slice(-2);
			const dayMonthKey = `${day.getDate()}.${monthKey}`;
			return this.#config.weekHolidays.includes(day.getDay()) || this.#config.yearHolidays[dayMonthKey] !== undefined;
		}
		#isYearHoliday(day) {
			const dayMonthKey = day.getDate() + '.' + ('0' + (day.getMonth() + 1)).slice(-2);
			return this.#config.yearHolidays[dayMonthKey] !== undefined;
		}
		getSelectedTimezoneId() {
			return this.#selectedTimezoneId;
		}
		#getNodeTimeZone() {
			this.#selectedTimezoneNode = main_core.Tag.render`
			<div class="calendar-sharing__timezone-value">
				${this.#getFormattedTimezone(this.#selectedTimezoneId)}
			</div>
		`;
			const timezoneSelect = main_core.Tag.render`
			<div class="calendar-sharing__timezone">
				${main_core.Browser.isMobile() ? this.#getNodeTimezoneSelect() : ''}
				<div class="calendar-sharing__timezone-area">
					<div class="calendar-sharing__timezone-title">${main_core.Loc.getMessage('CALENDAR_SHARING_YOR_TIME')}:</div>
					${this.#selectedTimezoneNode}
				</div>
			</div>
		`;
			this.#getPopupTimezoneSelect();
			if (!main_core.Browser.isMobile()) {
				main_core.Event.bind(timezoneSelect, 'click', () => {
					const timezonesPopup = this.#getPopupTimezoneSelect().getPopupWindow();
					timezonesPopup.show();
					const popupContent = timezonesPopup.getContentContainer();
					const selectedTimezoneItem = popupContent.querySelector('.menu-popup-item.--selected');
					const selectOffset = timezoneSelect.getBoundingClientRect().top + timezoneSelect.offsetHeight / 4 - popupContent.getBoundingClientRect().top;
					popupContent.scrollTop = selectedTimezoneItem.offsetTop - selectOffset;
				});
			}
			return timezoneSelect;
		}
		#getPopupTimezoneSelect() {
			if (this.#timeZonePopup?.getPopupWindow().isShown()) {
				return this.#timeZonePopup;
			}
			this.#timeZonePopup?.destroy();
			const items = Object.keys(this.#timezoneList).map(timezoneId => ({
				text: this.#getFormattedTimezone(timezoneId),
				className: timezoneId === this.#selectedTimezoneId ? 'menu-popup-no-icon --selected' : 'menu-popup-no-icon',
				onclick: () => {
					this.#updateTimezone(timezoneId);
					this.#timeZonePopup.close();
				}
			}));
			this.#timeZonePopup = main_popup.MenuManager.create({
				id: 'momomiomsiomx92984j',
				className: 'calendar-sharing-timezone-select-popup',
				items,
				autoHide: true,
				maxHeight: window.innerHeight - 150
			});
			return this.#timeZonePopup;
		}
		#getNodeTimezoneSelect() {
			const selectNode = main_core.Tag.render`
			<select class="calendar-sharing__timezone-select">
				${Object.keys(this.#timezoneList).map(timezoneId => main_core.Tag.render`
					<option value="${timezoneId}" ${timezoneId === this.#selectedTimezoneId ? 'selected' : ''}>
						${this.#getFormattedTimezone(timezoneId)}
					</option>
				`)}
			</select>
		`;
			main_core.Event.bind(selectNode, 'change', () => this.#updateTimezone(selectNode.value));
			return selectNode;
		}
		#updateTimezone(timezoneId) {
			this.#selectedTimezoneId = timezoneId;
			this.#selectedTimezoneOffsetUtc = -(this.#timezoneList[this.#selectedTimezoneId].offset / 60);
			main_core_events.EventEmitter.emit('updateTimezone', {
				timezone: timezoneId
			});
			this.#selectedTimezoneNode.innerHTML = this.#getFormattedTimezone(this.#selectedTimezoneId);
			this.#reCreateCurrentMonth();
			this.selectMonthDay();
		}
		#getFormattedTimezone(timezoneId) {
			return `${this.getTimezonePrefix(this.#timezoneList[timezoneId].offset)} - ${timezoneId}`;
		}
		getTimezonePrefix(timezoneOffset) {
			const offset = timezoneOffset * 1000 - this.#timezoneOffsetUtc * -6e4;
			const date = new Date(this.#nowTime.getTime() + offset);
			return main_date.DateTimeFormat.format(calendar_util.Util.getTimeFormatShort(), date.getTime() / 1000);
		}
		#getNodeDaysOfWeek() {
			if (!this.#layout.daysOfWeek) {
				const nodesWeekDays = this.#loc.weekdays.map(weekDay => {
					return main_core.Tag.render`
					<div class="calendar-sharing__month-col --day-of-week">${weekDay}</div>
				`;
				});
				this.#layout.daysOfWeek = main_core.Tag.render`
				<div class="calendar-sharing__month-row">${nodesWeekDays}</div>
			`;
			}
			return this.#layout.daysOfWeek;
		}
		#getNodeDay(param = {}) {
			param.selected = this.#selectedDay?.getDay() === param.value && param.currentMonth === true;
			const day = new Day(param);
			return day.render();
		}
		#getNodeMonth() {
			const monthInfo = this.#months[this.#currentMonthIndex];
			const year = monthInfo.year;
			const month = monthInfo.month;
			const firstDayOfMonth = (new Date(year, month, 7).getDay() - (this.#config.weekStart - 1) + 7) % 7;
			const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
			const lastDayOfLastMonth = month === 0 ? new Date(year - 1, 11, 0).getDate() : new Date(year, month, 0).getDate();
			const nodeMonth = main_core.Tag.render`<div class="calendar-sharing__month-row"></div>`;
			let k = lastDayOfLastMonth - firstDayOfMonth + 1;
			for (let j = 0; j < firstDayOfMonth; j++) {
				main_core.Dom.append(this.#getNodeDay({
					value: k,
					notCurrentMonth: true
				}), nodeMonth);
				k++;
			}
			for (let i = 0; i <= lastDateOfMonth - 1; i++) {
				const day = monthInfo.days[i];
				main_core.Dom.append(day.render(), nodeMonth);
			}
			let dayOfWeek = (new Date(year, month, lastDateOfMonth).getDay() - this.#config.weekStart + 7) % 7;
			for (k = 1; dayOfWeek < 6; dayOfWeek++) {
				main_core.Dom.append(this.#getNodeDay({
					value: k,
					notCurrentMonth: true
				}), nodeMonth);
				k++;
			}
			const result = main_core.Tag.render`
			<div class="calendar-sharing__month">
				${this.#getNodeDaysOfWeek()}
				${nodeMonth}
			</div>
		`;
			const touchPosition = {
				x: null
			};
			const touchMove = ev => {
				touchPosition.x = ev.changedTouches[0].clientX;
			};
			main_core.Event.bind(result, 'touchstart', ev => {
				touchMove(ev);
			});
			main_core.Event.bind(result, 'touchend', ev => {
				if (touchPosition.x < ev.changedTouches[0].clientX - 100) {
					this.#handlePreviousMonthArrowClick();
				}
				if (touchPosition.x > ev.changedTouches[0].clientX + 100) {
					this.#handleNextMonthArrowClick();
				}
				result.style.removeProperty('transform');
			});
			main_core.Event.bind(result, 'touchmove', ev => {
				ev.preventDefault();
			});
			return result;
		}
		#getNodeMonthWrapper() {
			if (!this.#layout.monthWrapper) {
				this.#layout.monthWrapper = main_core.Tag.render`
				<div class="calendar-sharing__calendar-block --month">
					${this.#getNodeMonth()}
				</div>
			`;
			}
			return this.#layout.monthWrapper;
		}
		#getNodeTimezoneWrapper() {
			if (!this.#layout.timezoneWrapper) {
				this.#layout.timezoneWrapper = main_core.Tag.render`
				<div class="calendar-sharing__calendar-block">
					${this.#getNodeTimeZone()}
				</div>
			`;
			}
			return this.#layout.timezoneWrapper;
		}
		#getNodeCurrentMonth() {
			if (!this.#layout.currentMonth) {
				const currentMonthName = this.#months[this.#currentMonthIndex].name;
				const currentYear = this.#months[this.#currentMonthIndex].year;
				this.#layout.currentMonth = main_core.Tag.render`
				<div class="calendar-sharing__calendar-title-day calendar-pub-ui__typography-title">${currentMonthName}, ${currentYear}</div>
			`;
				main_core_events.EventEmitter.subscribe(this, 'updateCalendar', () => {
					const currentMonthName = this.#months[this.#currentMonthIndex].name;
					const currentYear = this.#months[this.#currentMonthIndex].year;
					this.#layout.currentMonth.innerHTML = `${currentMonthName}, ${currentYear}`;
				});
			}
			return this.#layout.currentMonth;
		}
		#updateCalendar(direction) {
			main_core.Dom.clean(this.#getNodeMonthWrapper());
			const nodeMonth = this.#getNodeMonth();
			if (main_core.Type.isString(direction)) {
				main_core.Dom.addClass(nodeMonth, `--animate-${direction}`);
				main_core.Event.bind(nodeMonth, 'animationend', () => {
					main_core.Dom.removeClass(nodeMonth, `--animate-${direction}`);
				}, {
					once: true
				});
			}
			main_core.Dom.append(nodeMonth, this.#getNodeMonthWrapper());
			main_core_events.EventEmitter.emit(this, 'updateCalendar');
			if (this.#currentMonthIndex === 0) {
				main_core.Dom.addClass(this.#layout.prevNav, '--disabled');
			} else {
				main_core.Dom.removeClass(this.#layout.prevNav, '--disabled');
			}
		}
		#getNodePrevNav() {
			if (!this.#layout.prevNav) {
				this.#layout.prevNav = main_core.Tag.render`
				<div class="calendar-sharing__calendar-nav_prev --disabled" title="${main_core.Loc.getMessage('CALENDAR_SHARING_NAV_PREV')}"></div>
			`;
				main_core.Event.bind(this.#layout.prevNav, 'click', this.#handlePreviousMonthArrowClick.bind(this));
			}
			return this.#layout.prevNav;
		}
		#getNodeNextNav() {
			if (!this.#layout.nextNav) {
				this.#layout.nextNav = main_core.Tag.render`
				<div class="calendar-sharing__calendar-nav_next" title="${main_core.Loc.getMessage('CALENDAR_SHARING_NAV_NEXT')}"></div>
			`;
				main_core.Event.bind(this.#layout.nextNav, 'click', this.#handleNextMonthArrowClick.bind(this));
			}
			return this.#layout.nextNav;
		}
		#getNodeNavigation() {
			if (!this.#layout.navigation) {
				this.#layout.navigation = main_core.Tag.render`
				<div class="calendar-sharing__calendar-nav">
					${this.#getNodePrevNav()}
					${this.#getNodeNextNav()}
				</div>
			`;
			}
			return this.#layout.navigation;
		}
		async #handleNextMonthArrowClick() {
			if (this.#currentMonthIndex === this.#months.length - 1) {
				if (this.nextMonthCreating) {
					return;
				}
				await this.#createNextMonth();
			}
			this.#currentMonthIndex += 1;
			this.#updateMonth(this.#currentMonthIndex);
			main_core_events.EventEmitter.emit(this, 'clickNextMonth');
			this.#updateCalendar('next');
			this.selectMonthDay();
		}
		#handlePreviousMonthArrowClick() {
			if (this.#currentMonthIndex === 0) {
				return;
			}
			this.#currentMonthIndex -= 1;
			this.#updateMonth(this.#currentMonthIndex);
			main_core_events.EventEmitter.emit(this, 'clickPrevMonth');
			this.#updateCalendar('prev');
			this.selectMonthDay();
		}
		#updateMonth(monthIndex) {
			const year = this.#months[monthIndex].year;
			const month = this.#months[monthIndex].month;
			this.#calculateDateTimeSlots(year, month);
			this.#months[this.#currentMonthIndex] = this.#createMonth(year, month);
		}
		#getNodeBack() {
			if (!this.#layout.back) {
				this.#layout.back = main_core.Tag.render`
				<div class="calendar-sharing__calendar-back"></div>
			`;
				main_core.Event.bind(this.#layout.back, 'click', () => {
					main_core_events.EventEmitter.emit('hideSlotSelector', this);
				});
			}
			return this.#layout.back;
		}
		#getNodeWrapper() {
			if (!this.#layout.wrapper) {
				this.#layout.wrapper = main_core.Tag.render`
				<div class="calendar-sharing__calendar">
					<div class="calendar-sharing__calendar-bar">
						${this.#getNodeBack()}
						${this.#getNodeCurrentMonth()}
						${this.#getNodeNavigation()}
					</div>
					${this.#getNodeMonthWrapper()}
					${this.#getNodeTimezoneWrapper()}
				</div>
			`;
			}
			return this.#layout.wrapper;
		}
		render() {
			return this.#getNodeWrapper();
		}
	}

	class Base {
		#wrapNode;
		#isHiddenOnStart;
		constructor(options) {
			this.#wrapNode = null;
			this.#isHiddenOnStart = options.isHiddenOnStart;
			this.#bindEvents();
		}
		getContent() {
			return main_core.Tag.render`
			<div></div>
		`;
		}
		getType() {
			return 'base';
		}
		render() {
			main_core.Dom.append(this.getContent(), this.#getWrapNode());
			return this.#wrapNode;
		}
		#getWrapNode() {
			if (!this.#wrapNode) {
				this.#wrapNode = main_core.Tag.render`<div class="calendar-pub__slots-wrap"></div>`;
				if (this.#isHiddenOnStart) {
					main_core.Dom.addClass(this.#wrapNode, '--hidden');
				}
			}
			return this.#wrapNode;
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('selectorTypeChange', ev => {
				if (ev.data === this.getType()) {
					this.#show();
				} else {
					this.#hide();
				}
			});
		}
		#hide() {
			main_core.Dom.addClass(this.#wrapNode, '--hidden');
		}
		#show() {
			main_core.Dom.removeClass(this.#wrapNode, '--hidden');
		}
	}

	class WidgetDate {
		#props;
		#layout;
		#value;
		#members;
		static timezoneNoticeUnderstood = false;
		constructor(props = {}) {
			this.#props = props;
			this.#layout = {
				calendarPage: {
					month: null,
					day: null,
					timeFrom: null
				},
				dayInfo: null,
				timeInterval: null,
				timezone: null,
				avatarsSection: null,
				timezoneNotice: null
			};
			this.#value = {
				from: null,
				to: null,
				timezone: null,
				isFullDay: false,
				rruleDescription: ''
			};
		}
		updateValue(data, linkContext) {
			if (data.from) {
				this.#value.from = data.from;
			}
			if (data.to) {
				this.#value.to = data.to;
			}
			if (data.timezone) {
				this.#value.timezone = data.timezone;
			}
			if (main_core.Type.isBoolean(data.isFullDay)) {
				this.#value.isFullDay = data.isFullDay;
			}
			if (data.members) {
				this.#members = data.members;
			}
			if (data.rruleDescription) {
				this.#value.rruleDescription = data.rruleDescription;
			}
			this.#props.linkContext = linkContext;
			this.updateLayout();
		}
		updateLayout() {
			const timezone = this.#props.browserTimezone ?? this.#value.timezone;
			let offset = this.#getBrowserTimezoneOffset() * 60;
			const from = this.#value.from.getTime() / 1000 + offset;
			const to = this.#value.to.getTime() / 1000 + offset;
			const isFullDay = this.#value.isFullDay;
			const calendarMonthName = this.#formatMonthName(from);
			const calendarDay = this.#formatCalendarDay(from);
			const isSameDate = main_date.DateTimeFormat.format('j F Y', from) === main_date.DateTimeFormat.format('j F Y', to);
			let calendarTime, eventDate, eventTime, eventTimezone;
			if (isFullDay) {
				calendarTime = this.#formatWeekDay(from);
				eventDate = `${this.#formatDate(from)} - ${this.#formatDate(to)}`;
				eventTime = main_core.Loc.getMessage('CALENDAR_SHARING_WIDGET_DATE_FULL_DAY');
				eventTimezone = '';
				if (isSameDate) {
					eventDate = this.#formatWeekDate(from, '');
				}
			} else {
				calendarTime = this.#formatTime(from);
				eventDate = this.#formatWeekDate(from);
				eventTime = this.#formatTimeInterval(from, to);
				eventTimezone = calendar_util.Util.getFormattedTimezone(timezone);
				if (!isSameDate) {
					eventDate = main_core.Loc.getMessage('CALENDAR_SHARING_WIDGET_DATE_EVENT_START', {
						'#DATE#': this.#formatDateTime(from)
					});
					eventTime = main_core.Loc.getMessage('CALENDAR_SHARING_WIDGET_DATE_EVENT_END', {
						'#DATE#': this.#formatDateTime(to)
					});
				}
			}
			this.#getNodeCalendarPageMonth().innerText = calendarMonthName;
			this.#getNodeCalendarPageDay().innerText = calendarDay;
			this.#getNodeCalendarPageTimeFrom().innerText = calendarTime;
			this.#getNodeDayInfo().innerText = eventDate;
			this.#getNodeTimeInterval().innerText = eventTime;
			this.#getNodeTimezone().innerText = eventTimezone;
			this.#getNodeTimezone().title = eventTimezone;
			this.#renderAvatarsSection();
		}
		#formatDate(timestamp) {
			const dayMonthFormat = main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT');
			return main_date.DateTimeFormat.format(dayMonthFormat, timestamp);
		}
		#formatWeekDay(timestamp) {
			return main_date.DateTimeFormat.format('D', timestamp);
		}
		#formatWeekDate(timestamp) {
			const weekDateFormat = main_date.DateTimeFormat.getFormat('DAY_OF_WEEK_MONTH_FORMAT');
			return main_date.DateTimeFormat.format(weekDateFormat, timestamp);
		}
		#formatDateTime(timestamp) {
			const dayMonthFormat = main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT');
			const shortTimeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			const format = `${dayMonthFormat} ${shortTimeFormat}`;
			return main_date.DateTimeFormat.format(format, timestamp);
		}
		#formatTimeInterval(from, to) {
			return `${this.#formatTime(from)} - ${this.#formatTime(to)}`;
		}
		#formatTime(timestamp) {
			const shortTimeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			return main_date.DateTimeFormat.format(shortTimeFormat, timestamp);
		}
		#formatMonthName(timestamp) {
			return main_date.DateTimeFormat.format('f', timestamp);
		}
		#formatCalendarDay(timestamp) {
			return main_date.DateTimeFormat.format('d', timestamp);
		}
		render() {
			return main_core.Tag.render`
			<div class="calendar-pub__form-date ${this.#props.filled ? '--filled' : ''}">
				<div class="calendar-pub__form-date-main">
					<div class="calendar-pub__form-date-day">
						${this.#getNodeCalendarPageMonth()}
						<div class="calendar-pub__form-date-content">
							${this.#getNodeCalendarPageDay()}
							${this.#getNodeCalendarPageTimeFrom()}
						</div>
					</div>
					<div class="calendar-pub__form-date-info">
						${this.#getNodeDayInfo()}
						${this.#renderTime()}
						${this.#getNodeTimezone()}
						${this.#renderAvatarsSection()}
					</div>
				</div>
				${this.#renderTimezoneNotice()}
			</div>
		`;
		}
		#getNodeCalendarPageMonth() {
			if (!this.#layout.calendarPage.month) {
				this.#layout.calendarPage.month = main_core.Tag.render`
				<div class="calendar-pub__form-date-day_month"></div>
			`;
			}
			return this.#layout.calendarPage.month;
		}
		#getNodeCalendarPageDay() {
			if (!this.#layout.calendarPage.day) {
				this.#layout.calendarPage.day = main_core.Tag.render`
				<div class="calendar-pub__form-date-day_num"></div>
			`;
			}
			return this.#layout.calendarPage.day;
		}
		#getNodeCalendarPageTimeFrom() {
			if (!this.#layout.calendarPage.timeFrom) {
				this.#layout.calendarPage.timeFrom = main_core.Tag.render`
				<div class="calendar-pub__form-date-day_time">13:00</div>
			`;
			}
			return this.#layout.calendarPage.timeFrom;
		}
		#getNodeDayInfo() {
			if (!this.#layout.dayInfo) {
				this.#layout.dayInfo = main_core.Tag.render`
				<div class="calendar-pub__form-date-info_day"></div>
			`;
			}
			return this.#layout.dayInfo;
		}
		#renderTime() {
			return main_core.Tag.render`
			<div class="calendar-pub__form-date-info_time-container">
				${this.#getNodeTimeInterval()}
				${this.#renderRrule()}
			</div>
		`;
		}
		#getNodeTimeInterval() {
			if (!this.#layout.timeInterval) {
				this.#layout.timeInterval = main_core.Tag.render`
				<div class="calendar-pub__form-date-info_time"></div>
			`;
			}
			return this.#layout.timeInterval;
		}
		#renderRrule() {
			if (!main_core.Type.isStringFilled(this.#value.rruleDescription)) {
				return '';
			}
			if (!this.#layout.rrule) {
				this.#layout.rrule = main_core.Tag.render`
				<div class="calendar-pub__form-date-rrule ui-icon-set --refresh-7"></div>
			`;
				const popup = new main_popup.Popup({
					bindElement: this.#layout.rrule,
					content: this.#value.rruleDescription,
					darkMode: true,
					bindOptions: {
						position: 'top'
					},
					offsetTop: -10,
					angle: true,
					autoHide: true
				});
				bindShowOnHover(popup);
			}
			return this.#layout.rrule;
		}
		#getNodeTimezone() {
			if (!this.#layout.timezone) {
				this.#layout.timezone = main_core.Tag.render`
				<div class="calendar-pub__form-date-info_time-zone"></div>
			`;
			}
			return this.#layout.timezone;
		}
		#renderAvatarsSection() {
			if (this.#props.allAttendees) {
				return '';
			}
			const avatarsSection = new MembersList({
				className: 'calendar-pub__form-date-members',
				textClassName: 'calendar-pub-ui__typography-xs',
				avatarSize: 30,
				members: this.#members,
				allAttendees: this.#props.allAttendees,
				linkContext: this.#props.linkContext
			}).render();
			if (!this.#layout.avatarsSection) {
				this.#layout.avatarsSection = main_core.Tag.render`
				<div>${avatarsSection}</div>
			`;
			} else {
				this.#layout.avatarsSection.innerHTML = '';
				this.#layout.avatarsSection.append(avatarsSection);
			}
			return this.#layout.avatarsSection;
		}
		#renderTimezoneNotice() {
			const offset = this.#getBrowserTimezoneOffset();
			if (WidgetDate.timezoneNoticeUnderstood || offset === 0) {
				return '';
			}
			const timezoneNoticeUnderstandButton = main_core.Tag.render`
			<div class="calendar-pub__link-button">
				${main_core.Loc.getMessage('CALENDAR_SHARING_UNDERSTAND')}
			</div>
		`;
			main_core.Event.bind(timezoneNoticeUnderstandButton, 'click', () => {
				this.#layout.timezoneNotice.remove();
				WidgetDate.timezoneNoticeUnderstood = true;
			});
			const noticeOffsetNode = main_core.Tag.render`
			<div class="calendar-pub-timezone-notice-offset">
				${this.#getTimezoneNoticeText(offset)}
			</div>
		`;
			const timezonePopup = new main_popup.Popup({
				bindElement: noticeOffsetNode,
				content: calendar_util.Util.getFormattedTimezone(this.#value.timezone),
				darkMode: true,
				bindOptions: {
					position: 'top'
				},
				offsetTop: -10,
				angle: true,
				autoHide: true
			});
			bindShowOnHover(timezonePopup);
			this.#layout.timezoneNotice = main_core.Tag.render`
			<div class="calendar-pub__event-timezone-notice calendar-pub-ui__typography-sm">
				<div>
					${main_core.Loc.getMessage('CALENDAR_SHARING_EVENT_TIMEZONE_NOTICE')}
				</div>
				<div class="calendar-pub__event-timezone-notice-bottom">
					${noticeOffsetNode}
					${timezoneNoticeUnderstandButton}
				</div>
			</div>
		`;
			return this.#layout.timezoneNotice;
		}
		#getTimezoneNoticeText(offset) {
			const sign = offset < 0 ? '+' : '-';
			return main_core.Loc.getMessage('CALENDAR_SHARING_EVENT_TIMEZONE_NOTICE_OFFSET', {
				'#OFFSET#': `${sign}${calendar_util.Util.formatDuration(Math.abs(offset))}`
			});
		}
		#getBrowserTimezoneOffset() {
			if (!main_core.Type.isStringFilled(this.#props.browserTimezone) || !main_core.Type.isStringFilled(this.#value.timezone)) {
				return 0;
			}
			const eventOffset = calendar_util.Util.getTimeZoneOffset(this.#props.browserTimezone);
			const browserOffset = calendar_util.Util.getTimeZoneOffset(this.#value.timezone);
			return browserOffset - eventOffset;
		}
	}

	class Form extends Base {
		#layout;
		#value;
		#widgetDate;
		#owner;
		#link;
		#sharingUser;
		#phoneDb;
		#isFromCrm;
		#hasContactData;
		#isPhoneFeatureEnabled;
		#isMailFeatureEnabled;
		#inputData;
		#inputErrors;
		constructor(options) {
			super({
				isHiddenOnStart: options.isHiddenOnStart
			});
			this.#owner = options.owner;
			this.#link = options.link;
			this.#widgetDate = new WidgetDate();
			this.#sharingUser = options.sharingUser;
			this.#isFromCrm = options.isFromCrm;
			this.#hasContactData = options.hasContactData;
			this.#isPhoneFeatureEnabled = options.isPhoneFeatureEnabled;
			this.#isMailFeatureEnabled = options.isMailFeatureEnabled;
			this.#layout = {
				wrapper: null,
				buttonSend: null,
				widgetDate: null,
				formArea: null,
				back: null,
				calendarPage: {
					month: null,
					day: null,
					timeFrom: null
				},
				dayInfo: null,
				timeInterval: null,
				timezone: null,
				inputs: {
					name: null,
					contact: null,
					description: null
				}
			};
			this.#value = {
				from: null,
				to: null,
				timezone: null,
				isFullDay: false,
				members: this.#link.members
			};
			this.#inputData = {
				authorName: '',
				contactData: '',
				description: ''
			};
			this.#inputErrors = {
				authorNameEmpty: false,
				contactDataEmpty: false,
				contactDataIncorrect: false
			};
			this.#phoneDb = null;
		}
		cleanDescription() {
			this.#getNodeInputDescription().value = null;
			this.#inputData.description = '';
		}
		getType() {
			return 'form';
		}
		getContent() {
			return this.#getNodeWrapper();
		}
		updateFormValue(data) {
			if (data.from) {
				this.#value.from = data.from;
			}
			if (data.to) {
				this.#value.to = data.to;
			}
			if (data.timezone) {
				this.#value.timezone = data.timezone;
			}
			if (main_core.Type.isBoolean(data.isFullDay)) {
				this.#value.isFullDay = data.isFullDay;
			}
			this.updateFormLayout();
		}
		updateFormLayout() {
			this.#widgetDate.updateValue(this.#value, this.#link?.type);
		}
		#getNodeWrapper() {
			if (!this.#layout.wrapper) {
				this.#layout.wrapper = main_core.Tag.render`
				<div class="calendar-pub__form">
					<div class="calendar-sharing__calendar-bar">
						${this.#getNodeBack()}
						<div class="calendar-sharing__calendar-title-day calendar-pub-ui__typography-title">
							${this.#getEventName()}
						</div>
					</div>
					<div class="calendar-sharing__calendar-block">
						${this.#getNodeWidgetDate()}
					</div>
					${this.#getNodeFormArea()}
				</div>
			`;
			}
			return this.#layout.wrapper;
		}
		#getEventName() {
			return main_core.Loc.getMessage('CALENDAR_SHARING_EVENT_NAME', {
				'#OWNER_NAME#': `${this.#owner.name} ${this.#owner.lastName}`
			});
		}
		#getNodeButtonSend() {
			if (!this.#layout.buttonSend) {
				this.#layout.buttonSend = main_core.Tag.render`
				<div class="calendar-pub-ui__btn">
					<div class="calendar-pub-ui__btn-text">${main_core.Loc.getMessage('CALENDAR_SHARING_CREATE_MEETING')}</div>
				</div>
			`;
				main_core.Event.bind(this.#layout.buttonSend, 'click', () => this.#handleSaveButtonClick());
			}
			return this.#layout.buttonSend;
		}
		async #handleSaveButtonClick() {
			if (main_core.Dom.hasClass(this.#layout.buttonSend, '--wait')) {
				return;
			}
			main_core.Dom.addClass(this.#layout.buttonSend, '--wait');
			this.clearInputErrors();
			if (!this.#validateData()) {
				main_core.Dom.removeClass(this.#layout.buttonSend, '--wait');
				return;
			}
			const isSuccessful = await this.#saveEvent();
			if (isSuccessful) {
				main_core_events.EventEmitter.emit('selectorTypeChange', 'event', {
					eventName: this.#getEventName(),
					from: this.#value.from,
					to: this.#value.to,
					timezone: this.#value.timezone
				});
			}
			main_core.Dom.removeClass(this.#layout.buttonSend, '--wait');
		}
		async #saveEvent() {
			let response = null;
			try {
				if (this.#isFromCrm) {
					response = await BX.ajax.runAction('calendar.api.sharingajax.saveCrmEvent', {
						data: {
							ownerCreated: this.#sharingUser.ownerCreated,
							ownerId: this.#owner.id,
							dateFrom: this.#parseDate(this.#value.from),
							dateTo: this.#parseDate(this.#value.to),
							userName: this.#inputData.authorName,
							userContact: this.#inputData.contactData,
							timezone: this.#value.timezone,
							crmDealLinkHash: this.#link.hash,
							description: this.#inputData.description
						}
					});
				} else {
					response = await BX.ajax.runAction('calendar.api.sharingajax.saveEvent', {
						data: {
							ownerCreated: this.#sharingUser.ownerCreated,
							ownerId: this.#getLinkOwnerId(),
							userName: this.#inputData.authorName,
							userContact: this.#inputData.contactData,
							dateFrom: this.#parseDate(this.#value.from),
							dateTo: this.#parseDate(this.#value.to),
							timezone: this.#value.timezone,
							parentLinkHash: this.#link.hash,
							description: this.#inputData.description
						}
					});
				}
			} catch (e) {
				response = e;
			}
			if (response.errors.length === 0) {
				main_core_events.EventEmitter.emit('onSaveEvent', {
					eventName: this.#getEventName(),
					from: this.#value.from,
					to: this.#value.to,
					timezone: this.#value.timezone,
					eventId: response.data.eventId,
					eventLinkId: response.data.eventLinkId,
					eventLinkHash: response.data.eventLinkHash,
					eventLinkShortUrl: response.data.eventLinkShortUrl,
					userName: this.#inputData.authorName,
					state: 'created',
					isView: false
				});
				return true;
			}
			if (response?.data?.contactDataError || response?.data?.isEmptyContactName) {
				this.#inputErrors.contactDataIncorrect = response.data.contactDataError === true;
				this.#inputErrors.authorNameEmpty = response.data.isEmptyContactName === true;
				this.#renderInputErrors();
				return false;
			}
			main_core_events.EventEmitter.emit('onSaveEvent', {
				eventName: this.#getEventName(),
				from: this.#value.from,
				to: this.#value.to,
				timezone: this.#value.timezone,
				state: 'not-created',
				isView: false
			});
			return false;
		}
		#parseDate(date) {
			const dateInFormat = main_date.DateTimeFormat.format(calendar_util.Util.getDateFormat(), date.getTime() / 1000);
			const timeInFormat = main_date.DateTimeFormat.format(calendar_util.Util.getTimeFormat(), date.getTime() / 1000);
			return `${dateInFormat} ${timeInFormat}`;
		}
		#validateData() {
			if (this.#isCrmAndHasContact()) {
				return true;
			}
			if (this.#inputData.authorName.length === 0) {
				this.#inputErrors.authorNameEmpty = true;
			}
			if (this.#inputData.contactData.length === 0) {
				this.#inputErrors.contactDataEmpty = true;
			}
			if (!this.#inputErrors.contactDataEmpty) {
				this.#inputErrors.contactDataIncorrect = !this.#validatePhone() && !this.#validateEmail();
			}
			this.#renderInputErrors();
			return !this.#inputErrors.authorNameEmpty && !this.#inputErrors.contactDataEmpty && !this.#inputErrors.contactDataIncorrect;
		}
		#validatePhone() {
			if (this.#isMailContactOnly()) {
				return false;
			}
			const phone = this.#inputData.contactData.replace(/[()\s\-]+/g, '');
			const match = phone.match(/(^\+?\d{4,25}$)/i);
			return match?.[0] === phone;
		}
		#validateEmail() {
			if (this.#isPhoneContactOnly()) {
				return false;
			}
			const match = this.#inputData.contactData.match(/(^[^@]+@.+$)/i);
			return match?.[0] === this.#inputData.contactData;
		}
		clearInputErrors() {
			this.#clearContactNameError();
			this.#clearContactDataError();
		}
		#clearContactDataError() {
			this.#inputErrors.contactDataEmpty = false;
			this.#inputErrors.contactDataIncorrect = false;
			this.#renderInputErrors();
		}
		#clearContactNameError() {
			this.#inputErrors.authorNameEmpty = false;
			this.#renderInputErrors();
		}
		#showFullContactPlaceholder() {
			return !this.#isMailContactOnly() && !this.#isPhoneContactOnly();
		}
		#isMailContactOnly() {
			return !this.#isPhoneFeatureEnabled && this.#isMailFeatureEnabled;
		}
		#isPhoneContactOnly() {
			return this.#isPhoneFeatureEnabled && !this.#isMailFeatureEnabled;
		}
		#isCrmAndHasContact() {
			return this.#isFromCrm && this.#hasContactData;
		}
		#getNodeWidgetDate() {
			if (!this.#layout.widgetDate) {
				this.#layout.widgetDate = this.#widgetDate.render();
			}
			return this.#layout.widgetDate;
		}
		#getNodeFormArea() {
			if (!this.#layout.formArea) {
				this.#layout.nameInputError = this.#getNodeInputError();
				this.#layout.contactInputError = this.#getNodeInputError();
				this.#layout.formArea = main_core.Tag.render`
				<div class="calendar-sharing__calendar-block --form">
					<div class="calendar-sharing__form-area">
						<div class="calendar-sharing__form-input">
							${this.#getNodeInputName()}
							<div class="calendar-sharing__form-input-title">${main_core.Loc.getMessage('CALENDAR_SHARING_FORM_INPUT_NAME')}<span>*</span></div>
							${this.#layout.nameInputError}
						</div>
						<div class="calendar-sharing__form-input">
							${this.#getNodeInputContact()}
							<div class="calendar-sharing__form-input-title">${this.#getContactDataPlaceholder()}<span>*</span></div>
							${this.#layout.contactInputError}
						</div>
						<div class="calendar-sharing__form-input">
							${this.#getNodeInputDescription()}
							<div class="calendar-sharing__form-input-title">${main_core.Loc.getMessage('CALENDAR_SHARING_FORM_INPUT_INFO')}</div>
						</div>
					</div>
					<div class="calendar-pub__welcome-bottom">
						${this.#getNodeButtonSend()}
					</div>
				</div>
			`;
			}
			return this.#layout.formArea;
		}
		#getContactDataPlaceholder() {
			let messageCode = 'CALENDAR_SHARING_AUTHOR_CONTACT_DATA_PLACEHOLDER_PHONE_FEATURE_ENABLED';
			if (this.#isMailContactOnly()) {
				messageCode = 'CALENDAR_SHARING_AUTHOR_CONTACT_DATA_PLACEHOLDER_PHONE_FEATURE_DISABLED';
			}
			if (this.#isPhoneContactOnly()) {
				messageCode = 'CALENDAR_SHARING_AUTHOR_CONTACT_DATA_PLACEHOLDER_MAIL_FEATURE_DISABLED';
			}
			return main_core.Loc.getMessage(messageCode);
		}
		#getNodeInputName() {
			if (!this.#layout.inputs.name) {
				this.#layout.inputs.name = main_core.Tag.render`
				<input type="text" placeholder=" " class="calendar-sharing__form-input-area">
			`;
				if (this.#hasContactData) {
					main_core.Dom.addClass(this.#layout.inputs.name, '--hidden');
				} else if (this.#sharingUser?.userName) {
					this.#layout.inputs.name.value = this.#sharingUser?.userName;
				}
				this.#inputData.authorName = this.#layout.inputs.name.value;
				main_core.Event.bind(this.#layout.inputs.name, 'input', () => {
					this.#inputData.authorName = this.#layout.inputs.name.value;
				});
				main_core.Event.bind(this.#layout.inputs.name, 'focus', this.#clearContactNameError.bind(this));
			}
			return this.#layout.inputs.name;
		}
		#getNodeInputContact() {
			if (!this.#layout.inputs.contact) {
				this.#layout.inputs.contact = main_core.Tag.render`
				<input type="text" placeholder=" " class="calendar-sharing__form-input-area">
			`;
				if (this.#isMailContactOnly()) {
					this.#layout.inputs.contact.inputMode = 'email';
				}
				if (this.#isPhoneContactOnly()) {
					this.#layout.inputs.contact.inputMode = 'tel';
				}
				if (this.#hasContactData) {
					main_core.Dom.addClass(this.#layout.inputs.contact, '--hidden');
				} else if (this.#sharingUser) {
					if (this.#isMailFeatureEnabled && this.#sharingUser.personalMailbox) {
						this.#layout.inputs.contact.value = this.#sharingUser?.personalMailbox;
					} else if (this.#isPhoneFeatureEnabled && this.#sharingUser.personalPhone) {
						this.#layout.inputs.contact.value = this.#sharingUser?.personalPhone;
					}
				}
				this.#inputData.contactData = this.#layout.inputs.contact.value;
				main_core.Event.bind(this.#layout.inputs.contact, 'input', event => {
					this.#inputData.contactData = this.#layout.inputs.contact.value;
					this.#onPhoneInput(event);
				});
				main_core.Event.bind(this.#layout.inputs.contact, 'keydown', this.#onPhoneInputKeyDown.bind(this));
				main_core.Event.bind(this.#layout.inputs.contact, 'focus', this.#clearContactDataError.bind(this));
			}
			return this.#layout.inputs.contact;
		}
		#getNodeInputDescription() {
			if (!this.#layout.inputs.description) {
				this.#layout.inputs.description = main_core.Tag.render`
				<textarea type="text" placeholder=" " class="calendar-sharing__form-input-area --textarea"></textarea>
			`;
				this.#inputData.description = this.#layout.inputs.description.value;
				main_core.Event.bind(this.#layout.inputs.description, 'input', () => {
					this.#inputData.description = this.#layout.inputs.description.value;
				});
			}
			return this.#layout.inputs.description;
		}
		#getNodeInputError() {
			return main_core.Tag.render`
			<span class="calendar-sharing__form-input-error"></span>
		`;
		}
		#renderInputErrors() {
			main_core.Dom.removeClass(this.#layout.inputs.name.parentNode, '--error');
			main_core.Dom.removeClass(this.#layout.inputs.contact.parentNode, '--error');
			if (this.#inputErrors.authorNameEmpty) {
				main_core.Dom.addClass(this.#layout.inputs.name.parentNode, '--error');
				this.#layout.nameInputError.innerText = main_core.Loc.getMessage('CALENDAR_SHARING_INPUT_ERROR_REQUIRED');
			}
			if (this.#inputErrors.contactDataEmpty) {
				main_core.Dom.addClass(this.#layout.inputs.contact.parentNode, '--error');
				this.#layout.contactInputError.innerText = main_core.Loc.getMessage('CALENDAR_SHARING_INPUT_ERROR_REQUIRED');
			}
			if (this.#inputErrors.contactDataIncorrect) {
				main_core.Dom.addClass(this.#layout.inputs.contact.parentNode, '--error');
				this.#layout.contactInputError.innerText = main_core.Loc.getMessage('CALENDAR_SHARING_INPUT_ERROR_INCORRECT');
			}
		}
		#getNodeBack() {
			if (!this.#layout.back) {
				this.#layout.back = main_core.Tag.render`
				<div class="calendar-sharing__calendar-back"></div>
			`;
				main_core.Event.bind(this.#layout.back, 'click', () => {
					main_core_events.EventEmitter.emit('selectorTypeChange', 'slot-list');
				});
			}
			return this.#layout.back;
		}

		// phone input
		#onPhoneInput() {
			this.#clearContactDataError();
			if (!this.#isPhoneTypeInput()) {
				return;
			}
			const textBeforeCursor = this.#getTextBeforeCursor(this.#layout.inputs.contact);
			this.#inputData.contactData = this.#formatPhone(this.#inputData.contactData);
			this.#layout.inputs.contact.value = this.#inputData.contactData;
			this.#setCursorToFormattedPosition(this.#layout.inputs.contact, textBeforeCursor);
		}
		#getTextBeforeCursor(input) {
			const selectionStart = input.selectionStart;
			return input.value.slice(0, selectionStart);
		}
		#setCursorToFormattedPosition(input, textBeforeCursor) {
			const firstPart = this.#getTextEscapedForRegex(textBeforeCursor.slice(0, -1));
			const lastCharacter = this.#getTextEscapedForRegex(textBeforeCursor.slice(-1));
			const matches = input.value.match(`${firstPart}.*?${lastCharacter}`);
			if (!matches) {
				return;
			}
			const match = matches[0];
			const formattedPosition = input.value.indexOf(match) + match.length;
			input.setSelectionRange(formattedPosition, formattedPosition);
		}
		#getTextEscapedForRegex(text) {
			return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		}
		#onPhoneInputKeyDown(e) {
			if (!this.#isPhoneTypeInput()) {
				return;
			}
			if (!this.#isDigit(e.key) && !this.#isControlKey(e.key) && !calendar_util.Util.isAnyModifierKeyPressed(e)) {
				e.preventDefault();
			}
		}
		#isPhoneTypeInput() {
			return this.#isPhoneContactOnly() || this.#showFullContactPlaceholder() && this.#inputData.contactData.slice(0, 1) === '+';
		}
		#isDigit(key) {
			return /^\d+$/.test(key);
		}
		#isControlKey(key) {
			return ['Esc', 'Delete', 'Backspace', 'Tab'].indexOf(key) >= 0 || key.includes('Arrow');
		}
		#formatPhone(value) {
			value ??= '';
			const hasPlus = value.indexOf('+') === 0;
			value = value.replace(/\D/g, '');
			if (!hasPlus && value.substr(0, 1) === '8') {
				value = `7${value.substr(1)}`;
			}
			if (!this.#phoneDb) {
				this.#phoneDb = "247,ac,___-____|376,ad,___-___-___|971,ae,___-_-___-____|93,af,__-__-___-____|1268,ag,_ (___) ___-____|1264,ai,_ (___) ___-____|355,al,___ (___) ___-___|374,am,___-__-___-___|599,bq,___-___-____|244,ao,___ (___) ___-___|6721,aq,___-___-___|54,ar,__ (___) ___-____|1684,as,_ (___) ___-____|43,at,__ (___) ___-____|61,au,__-_-____-____|297,aw,___-___-____|994,az,___ (__) ___-__-__|387,ba,___-__-____|1246,bb,_ (___) ___-____|880,bd,___-__-___-___|32,be,__ (___) ___-___|226,bf,___-__-__-____|359,bg,___ (___) ___-___|973,bh,___-____-____|257,bi,___-__-__-____|229,bj,___-__-__-____|1441,bm,_ (___) ___-____|673,bn,___-___-____|591,bo,___-_-___-____|55,br,__-(__)-____-____|1242,bs,_ (___) ___-____|975,bt,___-_-___-___|267,bw,___-__-___-___|375,by,___ (__) ___-__-__|501,bz,___-___-____|243,cd,___ (___) ___-___|236,cf,___-__-__-____|242,cg,___-__-___-____|41,ch,__-__-___-____|225,ci,___-__-___-___|682,ck,___-__-___|56,cl,__-_-____-____|237,cm,___-____-____|86,cn,__ (___) ____-___|57,co,__ (___) ___-____|506,cr,___-____-____|53,cu,__-_-___-____|238,cv,___ (___) __-__|357,cy,___-__-___-___|420,cz,___ (___) ___-___|49,de,__-___-___|253,dj,___-__-__-__-__|45,dk,__-__-__-__-__|1767,dm,_ (___) ___-____|1809,do,_ (___) ___-____|,do,_ (___) ___-____|213,dz,___-__-___-____|593,ec,___-_-___-____|372,ee,___-___-____|20,eg,__ (___) ___-____|291,er,___-_-___-___|34,es,__ (___) ___-___|251,et,___-__-___-____|358,fi,___ (___) ___-__-__|679,fj,___-__-_____|500,fk,___-_____|691,fm,___-___-____|298,fo,___-___-___|262,fr,___-_____-____|33,fr,__ (___) ___-___|508,fr,___-__-____|590,fr,___ (___) ___-___|241,ga,___-_-__-__-__|1473,gd,_ (___) ___-____|995,ge,___ (___) ___-___|594,gf,___-_____-____|233,gh,___ (___) ___-___|350,gi,___-___-_____|299,gl,___-__-__-__|220,gm,___ (___) __-__|224,gn,___-__-___-___|240,gq,___-__-___-____|30,gr,__ (___) ___-____|502,gt,___-_-___-____|1671,gu,_ (___) ___-____|245,gw,___-_-______|592,gy,___-___-____|852,hk,___-____-____|504,hn,___-____-____|385,hr,___-__-___-___|509,ht,___-__-__-____|36,hu,__ (___) ___-___|62,id,__-__-___-__|353,ie,___ (___) ___-___|972,il,___-_-___-____|91,in,__ (____) ___-___|246,io,___-___-____|964,iq,___ (___) ___-____|98,ir,__ (___) ___-____|354,is,___-___-____|39,it,__ (___) ____-___|1876,jm,_ (___) ___-____|962,jo,___-_-____-____|81,jp,__ (___) ___-___|254,ke,___-___-______|996,kg,___ (___) ___-___|855,kh,___ (__) ___-___|686,ki,___-__-___|269,km,___-__-_____|1869,kn,_ (___) ___-____|850,kp,___-___-___|82,kr,__-__-___-____|965,kw,___-____-____|1345,ky,_ (___) ___-____|77,kz,_ (___) ___-__-__|856,la,___-__-___-___|961,lb,___-_-___-___|1758,lc,_ (___) ___-____|423,li,___ (___) ___-____|94,lk,__-__-___-____|231,lr,___-__-___-___|266,ls,___-_-___-____|370,lt,___ (___) __-___|352,lu,___ (___) ___-___|371,lv,___-__-___-___|218,ly,___-__-___-___|212,ma,___-__-____-___|377,mc,___-__-___-___|373,md,___-____-____|382,me,___-__-___-___|261,mg,___-__-__-_____|692,mh,___-___-____|389,mk,___-__-___-___|223,ml,___-__-__-____|95,mm,__-___-___|976,mn,___-__-__-____|853,mo,___-____-____|1670,mp,_ (___) ___-____|596,mq,___ (___) __-__-__|222,mr,___ (__) __-____|1664,ms,_ (___) ___-____|356,mt,___-____-____|230,mu,___-___-____|960,mv,___-___-____|265,mw,___-_-____-____|52,mx,__-__-__-____|60,my,__-_-___-___|258,mz,___-__-___-___|264,na,___-__-___-____|687,nc,___-__-____|227,ne,___-__-__-____|6723,nf,___-___-___|234,ng,___-__-___-__|505,ni,___-____-____|31,nl,__-__-___-____|47,no,__ (___) __-___|977,np,___-__-___-___|674,nr,___-___-____|683,nu,___-____|64,nz,__-__-___-___|968,om,___-__-___-___|507,pa,___-___-____|51,pe,__ (___) ___-___|689,pf,___-__-__-__|675,pg,___ (___) __-___|63,ph,__ (___) ___-____|92,pk,__ (___) ___-____|48,pl,__ (___) ___-___|970,ps,___-__-___-____|351,pt,___-__-___-____|680,pw,___-___-____|595,py,___ (___) ___-___|974,qa,___-____-____|40,ro,__-__-___-____|381,rs,___-__-___-____|7,ru,_ (___) ___-__-__|250,rw,___ (___) ___-___|966,sa,___-_-___-____|677,sb,___-_____|248,sc,___-_-___-___|249,sd,___-__-___-____|46,se,__-__-___-____|65,sg,__-____-____|386,si,___-__-___-___|421,sk,___ (___) ___-___|232,sl,___-__-______|378,sm,___-____-______|221,sn,___-__-___-____|252,so,___-_-___-___|597,sr,___-___-___|211,ss,___-__-___-____|239,st,___-__-_____|503,sv,___-__-__-____|1721,sx,_ (___) ___-____|963,sy,___-__-____-___|268,sz,___ (__) __-____|1649,tc,_ (___) ___-____|235,td,___-__-__-__-__|228,tg,___-__-___-___|66,th,__-__-___-___|992,tj,___-__-___-____|690,tk,___-____|670,tl,___-___-____|993,tm,___-_-___-____|216,tn,___-__-___-___|676,to,___-_____|90,tr,__ (___) ___-____|1868,tt,_ (___) ___-____|688,tv,___-_____|886,tw,___-____-____|255,tz,___-__-___-____|380,ua,___ (__) ___-__-__|256,ug,___ (___) ___-___|44,gb,__-__-____-____|598,uy,___-_-___-__-__|998,uz,___-__-___-____|396698,va,__-_-___-_____|1784,vc,_ (___) ___-____|58,ve,__ (___) ___-____|1284,vg,_ (___) ___-____|1340,vi,_ (___) ___-____|84,vn,__-__-____-___|678,vu,___-_____|681,wf,___-__-____|685,ws,___-__-____|967,ye,___-_-___-___|27,za,__-__-___-____|260,zm,___ (__) ___-____|263,zw,___-_-______|1,us,_ (___) ___-____|".split('|').map(item => {
					item = item.split(',');
					return {
						code: item[0],
						id: item[1],
						mask: item[2]
					};
				});
			}
			if (value.length > 0) {
				let mask = this.#findMask(value);
				mask += `${mask.indexOf('-') >= 0 ? '-' : ' '}__`.repeat(10);
				for (let i = 0; i < value.length; i++) {
					mask = mask.replace('_', value.slice(i, i + 1));
				}
				value = mask.replace(/\D+$/, '').replace(/_/g, '0');
			}
			if (hasPlus || value.length > 0) {
				value = `+${value}`;
			}
			return value;
		}
		#findMask(value) {
			const r = this.#phoneDb.filter(item => {
				return value.indexOf(item.code) === 0;
			}).sort((a, b) => {
				return b.code.length - a.code.length;
			})[0];
			return r ? r.mask : '_ ___ __ __ __';
		}
		#getLinkOwnerId() {
			return this.#link.type === 'group' ? this.#link.hostId : this.#owner.id;
		}
	}

	class EmptyState extends Base {
		#layout;
		constructor(options) {
			super({
				isHiddenOnStart: options.isHiddenOnStart
			});
			this.#layout = {
				content: null
			};
			this.#bindEvents();
		}
		#bindEvents() {}
		getType() {
			return 'empty-state';
		}
		getContent() {
			return this.#getNodeEmptyState();
		}
		#getNodeEmptyState() {
			if (!this.#layout.content) {
				this.#layout.content = main_core.Tag.render`
				<div class="calendar-pub__slots-empty">
					<div class="calendar-pub__slots-empty_title">${main_core.Loc.getMessage('CALENDAR_SHARING_SLOTS_EMPTY')}</div>
					<div class="calendar-pub__slots-empty_info">${main_core.Loc.getMessage('CALENDAR_SHARING_SLOTS_EMPTY_INFO')}</div>
				</div>
			`;
			}
			return this.#layout.content;
		}
	}

	class AccessDenied extends Base {
		#layout;
		constructor(options) {
			super({
				isHiddenOnStart: options.isHiddenOnStart
			});
			this.#layout = {
				content: null
			};
			this.#bindEvents();
		}
		#bindEvents() {}
		getType() {
			return 'access-denied';
		}
		getContent() {
			return this.#getNodeEmptyState();
		}
		#getNodeEmptyState() {
			if (!this.#layout.content) {
				this.#layout.content = main_core.Tag.render`
				<div class="calendar-pub__slots-empty --icon-cross">
					<div class="calendar-pub__slots-empty_title">${main_core.Loc.getMessage('CALENDAR_SHARING_SLOTS_ACCESS_DENIED')}</div>
					<div class="calendar-pub__slots-empty_info">${main_core.Loc.getMessage('CALENDAR_SHARING_SLOTS_ACCESS_DENIED_INFO')}</div>
				</div>
			`;
			}
			return this.#layout.content;
		}
	}

	class SlotItem {
		#layout;
		#selected;
		#value;
		BUTTON_MAX_WIDTH = 123;
		constructor(options) {
			this.#selected = null;
			this.#layout = {
				wrapper: null,
				value: null,
				select: null
			};
			this.#value = options.value;
			this.#bindEvents();
		}
		#bindEvents() {
			main_core.Event.bind(this.#getNodeWrapper(), 'click', this.select.bind(this));
			main_core.Event.bind(this.#getNodeSelect(), 'click', this.showForm.bind(this));
		}
		isSelected() {
			return this.#selected;
		}
		select() {
			this.#selected = true;
			main_core.Dom.addClass(this.#getNodeWrapper(), '--selected');
			main_core_events.EventEmitter.emit('selectSlot', this);
		}
		unSelect() {
			this.#selected = null;
			main_core.Dom.removeClass(this.#getNodeWrapper(), '--selected');
		}
		showForm() {
			main_core_events.EventEmitter.emit('confirmedSelectSlot', {
				value: this.#value
			});
		}
		#getNodeSelect() {
			if (!this.#layout.select) {
				this.#layout.select = main_core.Tag.render`
				<div class="calendar-sharing__slot-select">${main_core.Loc.getMessage('CALENDAR_SHARING_SELECT_SLOT')}</div>
			`;
				document.body.append(this.#layout.select);
				if (this.#layout.select.offsetWidth > this.BUTTON_MAX_WIDTH) {
					main_core.Dom.addClass(this.#layout.select, '--compact');
				}
				this.#layout.select.remove();
			}
			return this.#layout.select;
		}
		#getNodeValue() {
			if (!this.#layout.value) {
				let value = calendar_util.Util.formatTimeInterval(this.#value.from, this.#value.to);
				value = value.replace(/(am|pm)/g, '<span class="calendar-sharing-am-pm">$1</span>');
				this.#layout.value = main_core.Tag.render`
				<div class="calendar-sharing__slot-value">${value}</div>
			`;
			}
			return this.#layout.value;
		}
		#getNodeWrapper() {
			if (!this.#layout.wrapper) {
				this.#layout.wrapper = main_core.Tag.render`
				<div class="calendar-sharing__slot-item">
					${this.#getNodeValue()}
					${this.#getNodeSelect()}
				</div>
			`;
			}
			return this.#layout.wrapper;
		}
		render() {
			return this.#getNodeWrapper();
		}
	}

	class SlotList extends Base {
		#layout;
		#slots;
		#selectedSlot;
		#timezoneNoticeWasUnderstood;
		#ownerTimezoneOffsetUtc;
		#selectedTimezoneOffsetUtc;
		constructor(options) {
			super({
				isHiddenOnStart: options.isHiddenOnStart
			});
			this.#layout = {
				title: null,
				list: null,
				timezoneNotice: null,
				timezoneNoticeOffset: null
			};
			this.#slots = [];
			this.#timezoneNoticeWasUnderstood = false;
			this.#ownerTimezoneOffsetUtc = -options.ownerOffset;
			this.#selectedTimezoneOffsetUtc = new Date().getTimezoneOffset();
			this.#bindEvents();
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('updateSlotsList', event => {
				this.#slots = event.data.slots;
				this.updateSlotsList();
			});
			main_core_events.EventEmitter.subscribe('selectSlot', event => {
				const newSelectedSlot = event.data;
				if (this.#selectedSlot !== newSelectedSlot) {
					this.#selectedSlot?.unSelect();
				}
				this.#selectedSlot = newSelectedSlot;
			});
			main_core_events.EventEmitter.subscribe('updateTimezone', event => {
				this.#selectedTimezoneOffsetUtc = calendar_util.Util.getTimeZoneOffset(event.getData().timezone);
				this.#hideTimezoneNotice();
				if (this.#shouldShowTimezoneNotice()) {
					this.#showTimezoneNotice();
				}
			});
		}
		getType() {
			return 'slot-list';
		}
		getContent() {
			return this.#getNodeSlotList();
		}
		updateSlotsList() {
			main_core.Dom.clean(this.#getNodeList());
			const slotListNode = this.#getNodeListItems();
			main_core.Dom.append(slotListNode, this.#getNodeList());
			main_core.Dom.removeClass(this.#getNodeList(), '--shadow-top');
			main_core.Dom.removeClass(this.#getNodeList(), '--shadow-bottom');
		}
		#getNodeSlotList() {
			if (!this.#layout.slotSelector) {
				this.#layout.slotSelector = main_core.Tag.render`
				<div class="calendar-pub__slot-list-wrap">
					${this.#getNodeTitle()}
					${this.#getNodeList()}
				</div>
			`;
				if (this.#shouldShowTimezoneNotice()) {
					this.#showTimezoneNotice();
				}
			}
			return this.#layout.slotSelector;
		}
		#getNodeTitle() {
			if (!this.#layout.title) {
				this.#layout.title = main_core.Tag.render`
				<div class="calendar-sharing__calendar-bar">
					<div class="calendar-pub-ui__typography-m">${main_core.Loc.getMessage('CALENDAR_SHARING_SLOTS_FREE')}</div>
				</div>
			`;
			}
			return this.#layout.title;
		}
		#getNodeTimezoneNotice() {
			if (!this.#layout.timezoneNotice) {
				this.#layout.timezoneNotice = main_core.Tag.render`
				<div class="calendar-pub-timezone-notice calendar-pub-ui__typography-s">
					${this.#getNodeTimezoneNoticeText()}
					<div class="calendar-pub-timezone-notice-offset">
						${main_core.Loc.getMessage('CALENDAR_SHARING_TIMEZONE_NOTICE_OFFSET')}
					</div>
					${this.#getNodeTimezoneNoticeButton()}
				</div>
			`;
				this.#hideTimezoneNotice();
			}
			return this.#layout.timezoneNotice;
		}
		#getNodeTimezoneNoticeText() {
			if (!this.#layout.timezoneNoticeText) {
				this.#layout.timezoneNoticeText = main_core.Tag.render`
				<div>
					${main_core.Loc.getMessage('CALENDAR_SHARING_TIMEZONE_NOTICE')}
				</div>
			`;
			}
			return this.#layout.timezoneNoticeText;
		}
		#getNodeTimezoneNoticeButton() {
			const button = main_core.Tag.render`
			<div class="calendar-pub-ui__btn --m">
				<div class="calendar-pub-ui__btn-text">
					${main_core.Loc.getMessage('CALENDAR_SHARING_UNDERSTAND')}
				</div>
			</div>
		`;
			main_core.Event.bind(button, 'click', () => {
				this.#hideTimezoneNotice();
				this.#timezoneNoticeWasUnderstood = true;
			});
			return button;
		}
		#shouldShowTimezoneNotice() {
			const timezoneIsVeryDifferent = Math.abs(this.#ownerTimezoneOffsetUtc - this.#selectedTimezoneOffsetUtc) >= 180;
			return !this.#timezoneNoticeWasUnderstood && timezoneIsVeryDifferent;
		}
		#showTimezoneNotice() {
			const offset = this.#ownerTimezoneOffsetUtc - this.#selectedTimezoneOffsetUtc;
			this.#layout.timezoneNoticeText.innerText = this.#getTimezoneNoticeText(offset);
			main_core.Dom.style(this.#layout.timezoneNotice, 'display', '');
		}
		#getTimezoneNoticeText(offset) {
			const sign = offset < 0 ? '+' : '-';
			return main_core.Loc.getMessage('CALENDAR_SHARING_TIMEZONE_NOTICE', {
				'#OFFSET#': `${sign}${calendar_util.Util.formatDuration(Math.abs(offset))}`
			});
		}
		#hideTimezoneNotice() {
			main_core.Dom.style(this.#layout.timezoneNotice, 'display', 'none');
		}
		#getNodeList() {
			if (!this.#layout.slots) {
				this.#layout.slots = main_core.Tag.render`
				<div class="calendar-sharing__calendar-block --overflow-hidden --shadow">
					${this.#getNodeListItems()}
				</div>
			`;
			}
			return this.#layout.slots;
		}
		#getNodeListItems() {
			const currentDaySlots = this.#slots.map(slot => new SlotItem({
				value: {
					from: slot.timeFrom,
					to: slot.timeTo
				}
			}));
			const result = main_core.Tag.render`
			<div class="calendar-sharing__slots">
				${this.#getNodeTimezoneNotice()}
				${currentDaySlots.map(slotItem => slotItem.render())}
			</div>
		`;
			main_core.Event.bind(result, 'scroll', () => {
				if (result.scrollTop > 0) {
					main_core.Dom.addClass(this.#getNodeList(), '--shadow-top');
				} else {
					main_core.Dom.removeClass(this.#getNodeList(), '--shadow-top');
				}
				if (result.scrollHeight > result.offsetHeight && Math.ceil(result.offsetHeight + result.scrollTop) < result.scrollHeight) {
					main_core.Dom.addClass(this.#getNodeList(), '--shadow-bottom');
				} else {
					main_core.Dom.removeClass(this.#getNodeList(), '--shadow-bottom');
				}
			});
			setTimeout(() => {
				if (result.scrollHeight > result.offsetHeight) {
					main_core.Dom.addClass(this.#getNodeList(), '--shadow-bottom');
				}
			});
			return result;
		}
	}

	class EventLayout {
		#props;
		#layout;
		static descriptionCollapsed = true;
		constructor(props) {
			this.#props = props;
			this.#layout = {};
		}
		update(props) {
			this.#props = props;
			this.render();
		}
		render() {
			const wrap = this.#renderEvent();
			this.#layout.wrap?.replaceWith(wrap);
			this.#layout.wrap = wrap;
			return wrap;
		}
		#renderEvent() {
			if (this.#props.eventNotFound) {
				return this.#renderEventNotFound();
			}
			return main_core.Tag.render`
			<div class="calendar-sharing__form-result">
				${this.#renderPoweredLabel()}
				${this.#renderBackButton()}
				<div class="calendar-sharing__calendar-block --form --center">
					${this.#renderNodeIcon()}
					${this.#renderEventNameNode()}
					${this.#renderStateTitleNode()}
				</div>

				<div class="calendar-sharing__calendar-block --form --center">
					${this.#renderWidgetDate()}
					${this.#renderProps()}
				</div>

				<div class="calendar-sharing__calendar-block --form --center">
					${this.#renderCancelContent()}
				</div>

				<div class="calendar-sharing__calendar-block --top-auto">
					${this.#renderBottomButtons()}
				</div>
			</div>
		`;
		}
		#renderEventNotFound() {
			return main_core.Tag.render`
			<div class="calendar-sharing__form-result">
				<div class="calendar-sharing__calendar-block --form --center">
					<div class="calendar-sharing__form-result_icon --decline"></div>
					<div class="calendar-pub-ui__typography-title --center --line-height-normal">
						${this.#props.eventNotFound.title}
					</div>
					<div class="calendar-pub-ui__typography-s --center">
						${this.#props.eventNotFound.subtitle}
					</div>
				</div>
			</div>
		`;
		}
		#renderPoweredLabel() {
			if (!this.#props.poweredLabel) {
				return '';
			}
			return main_core.Tag.render`
			<div class="calendar-pub__block-label ${this.#props.poweredLabel.isRu ? '--ru' : ''}"></div>
		`;
		}
		#renderWidgetDate() {
			const widgetDate = new WidgetDate({
				allAttendees: this.#props.allAttendees,
				filled: this.#props.filled,
				browserTimezone: this.#props.browserTimezone,
				linkContext: this.#props.linkContext
			});
			if (this.#props.from && this.#props.to) {
				widgetDate.updateValue({
					from: this.#props.from,
					to: this.#props.to,
					timezone: this.#props.timezone,
					isFullDay: this.#props.isFullDay,
					rruleDescription: this.#props.rruleDescription,
					members: this.#props.members
				}, this.#props.linkContext);
			}
			return widgetDate.render();
		}
		#renderProps() {
			if (!this.#props.allAttendees) {
				return '';
			}
			return main_core.Tag.render`
			<div class="calendar-pub__event-props">
				${this.#renderMembers()}
				${this.#renderLocation()}
				${this.#renderFiles()}
				${this.#renderDescription()}
			</div>
		`;
		}
		#renderMembers() {
			return new MembersList({
				className: 'calendar-pub__event-prop',
				textClassName: 'calendar-pub-ui__typography-xs',
				avatarSize: 30,
				members: this.#props.members,
				allAttendees: this.#props.allAttendees,
				maxAvatarsCount: 8,
				linkContext: this.#props.linkContext
			}).render();
		}
		#renderLocation() {
			if (!main_core.Type.isStringFilled(this.#props.location)) {
				return '';
			}
			return main_core.Tag.render`
			<div class="calendar-pub__event-prop">
				<div class="calendar-pub-ui__typography-xs">
					${main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_LOCATION')}
				</div>
				<div class="calendar-pub-ui__typography-sm">
					${main_core.Text.encode(this.#props.location)}
				</div>
			</div>
		`;
		}
		#renderDescription() {
			if (!main_core.Type.isStringFilled(this.#props.description)) {
				return '';
			}
			this.#layout.description = main_core.Tag.render`
			<div class="calendar-pub-ui__typography-sm">
				${this.#props.description}
			</div>
		`;
			if (EventLayout.descriptionCollapsed) {
				const collapseHeight = 100;
				this.#layout.description.style.overflow = 'hidden';
				this.#layout.description.style.maxHeight = `${collapseHeight}px`;
				setTimeout(() => this.#collapseDescription(collapseHeight, false));
			} else {
				this.#layout.description.append(this.#renderCollapseButton());
				this.#updateExpandCollapseButtonMargin(this.#layout.collapseButton);
			}
			return main_core.Tag.render`
			<div class="calendar-pub__event-prop">
				<div class="calendar-pub-ui__typography-xs">
					${main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_DESCRIPTION')}
				</div>
				${this.#layout.description}
			</div>
		`;
		}
		#renderFiles() {
			if (!main_core.Type.isArrayFilled(this.#props.files)) {
				return '';
			}
			return main_core.Tag.render`
			<div class="calendar-pub__event-prop">
				<div class="calendar-pub-ui__typography-xs">
					${main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_FILES')}
				</div>
				<div class="calendar-pub-ui__typography-sm">
					${this.#props.files.map(file => this.#renderFile(file))}
				</div>
			</div>
		`;
		}
		#renderFile(file) {
			return main_core.Tag.render`
			<span class="calendar-pub__event-file">
				<a class="calendar-pub__event-file-name" href="${encodeURI(file.link)}">
					${main_core.Text.encode(file.name)}
				</a>
				<span class="calendar-pub__event-file-size">${file.size}</span>
			</span>
		`;
		}
		#collapseDescription(maxHeight, animate = true) {
			this.#setExpandCollapseButtonMargin(this.#layout.expandButton);
			this.#layout.collapseButton?.remove();
			const startHeight = this.#layout.description.offsetHeight;
			const children = [...this.#layout.description.childNodes];
			let lastVisible;
			let height = 0;
			for (let child of children) {
				if (child.nodeName === '#text') {
					const span = main_core.Tag.render`<span>${main_core.Text.encode(child.textContent)}</span>`;
					child.replaceWith(span);
					child = span;
				}
				if (height > maxHeight) {
					child.style.display = 'none';
					continue;
				}
				let childHeight = child.getBoundingClientRect().height;
				if (child.nodeName === 'BR' && child.previousSibling.nodeName !== 'BR') {
					continue;
				}
				if (height < maxHeight && height + childHeight > maxHeight) {
					lastVisible = child;
					child.after(this.#renderExpandButton());
				}
				height += childHeight;
			}
			this.#layout.description.style.height = '';
			this.#layout.description.style.maxHeight = '';
			if (lastVisible) {
				const extraLines = (this.#layout.description.offsetHeight - maxHeight) / 20;
				if (extraLines > 2) {
					lastVisible.innerText = lastVisible.innerText.slice(0, -35 * (extraLines - 1));
				}
				while (this.#layout.description.offsetHeight > maxHeight) {
					lastVisible.innerText = lastVisible.innerText.slice(0, -2);
					if (lastVisible.innerText === '') {
						const previousVisible = lastVisible.previousSibling;
						lastVisible.remove();
						lastVisible = previousVisible;
					}
					lastVisible.innerHTML += '&mldr;';
				}
			}
			this.#updateExpandCollapseButtonMargin(this.#layout.expandButton);
			if (animate) {
				this.#animateDescriptionHeight(startHeight, maxHeight);
			}
			EventLayout.descriptionCollapsed = true;
		}
		#expandDescription() {
			this.#setExpandCollapseButtonMargin(this.#layout.collapseButton);
			const height = this.#layout.description.offsetHeight;
			this.#layout.description.innerHTML = this.#props.description;
			this.#layout.description.append(this.#renderCollapseButton());
			this.#updateExpandCollapseButtonMargin(this.#layout.collapseButton);
			this.#animateDescriptionHeight(height, this.#layout.description.offsetHeight);
			EventLayout.descriptionCollapsed = false;
		}
		#updateExpandCollapseButtonMargin(button) {
			const span = main_core.Tag.render`
			<span>
				${button.previousSibling.cloneNode(true)}
			</span>
		`;
			button.previousSibling.replaceWith(span);
			if (span.offsetTop !== button.offsetTop) {
				main_core.Dom.style(span, 'margin-right', '5px');
				main_core.Dom.style(button, 'margin-left', '');
			}
		}
		#setExpandCollapseButtonMargin(button) {
			main_core.Dom.style(button, 'margin-left', '5px');
		}
		#animateDescriptionHeight(startHeight, endHeight) {
			const animationDuration = 200;
			this.#layout.description.style.height = `${startHeight}px`;
			this.#layout.description.style.transition = `height ${animationDuration}ms ease`;
			setTimeout(() => {
				this.#layout.description.style.height = `${endHeight}px`;
				setTimeout(() => {
					this.#layout.description.style.height = '';
					this.#layout.description.style.transition = '';
				}, animationDuration);
			});
		}
		#renderExpandButton() {
			if (this.#layout.expandButton) {
				return this.#layout.expandButton;
			}
			this.#layout.expandButton = main_core.Tag.render`
			<div class="calendar-pub__link-button" style="margin-left: 5px;">
				${main_core.Loc.getMessage('CALENDAR_SHARING_EXPAND')}
			</div>
		`;
			main_core.Event.bind(this.#layout.expandButton, 'click', () => this.#expandDescription());
			return this.#layout.expandButton;
		}
		#renderCollapseButton() {
			if (this.#layout.collapseButton) {
				return this.#layout.collapseButton;
			}
			this.#layout.collapseButton = main_core.Tag.render`
			<div class="calendar-pub__link-button" style="margin-left: 5px;">
				${main_core.Loc.getMessage('CALENDAR_SHARING_COLLAPSE')}
			</div>
		`;
			main_core.Event.bind(this.#layout.collapseButton, 'click', () => this.#collapseDescription(100));
			return this.#layout.collapseButton;
		}
		#renderNodeIcon() {
			return main_core.Tag.render`
			<div class="calendar-sharing__form-result_icon ${this.#props.iconClassName}"></div>
		`;
		}
		#renderBackButton() {
			if (this.#props.showBackCalendarButton) {
				return main_core.Tag.render`
				<div class="calendar-sharing__calendar-bar --arrow">
					<div class="calendar-sharing__calendar-back" onclick="${this.#onReturnButtonClick.bind(this)}"></div>
				</div>
			`;
			}
			return main_core.Tag.render`<div class="calendar-sharing__calendar-bar --no-margin"></div>`;
		}
		#renderEventNameNode() {
			return main_core.Tag.render`
			<div class="calendar-pub-ui__typography-title --center --line-height-normal">
				${main_core.Text.encode(this.#props.eventName)}
			</div>
		`;
		}
		#renderStateTitleNode() {
			return main_core.Tag.render`
			<div class="calendar-pub-ui__typography-s --center">
				${this.#props.title}
			</div>
		`;
		}
		#renderCancelContent() {
			if (this.#props.onDeleteEvent) {
				return main_core.Tag.render`
				<div onclick="${this.showCancelEventPopup.bind(this)}" class="calendar-pub__form-status --decline">
					<div class="ui-icon-set --undo-1"></div>
					<div class="calendar-pub__form-status_text">
						${main_core.Loc.getMessage('CALENDAR_SHARING_DECLINE_MEETING')}
					</div>
				</div>
			`;
			}
			if (this.#props.onDeclineEvent) {
				return main_core.Tag.render`
				<div onclick="${this.#props.onDeclineEvent}" class="calendar-pub__form-status --decline">
					<div class="ui-icon-set --cross-45"></div>
					<div class="calendar-pub__form-status_text">
						${main_core.Loc.getMessage('CALENDAR_SHARING_DECISION_DECLINE_MEETING')}
					</div>
				</div>
			`;
			}
			if (this.#props.cancelledInfo) {
				const dayMonthFormat = main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT');
				const shortTimeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
				const format = `${dayMonthFormat} ${shortTimeFormat}`;
				const dateFormatted = main_date.DateTimeFormat.format(format, this.#props.cancelledInfo.date.getTime() / 1000);
				const cancelledByEncoded = main_core.Text.encode(this.#props.cancelledInfo.name);
				const cancelledByText = `${main_core.Loc.getMessage('CALENDAR_SHARING_WHO_CANCELED')}: ${cancelledByEncoded}`;
				return main_core.Tag.render`
				<div class="calendar-pub__form-status">
					<div class="calendar-pub__form-status_text">
						${cancelledByText}<br> ${dateFormatted}
					</div>
				</div>
			`;
			}
			return '';
		}
		#renderBottomButtons() {
			return main_core.Tag.render`
			<div>
				${this.#getBottomButtons()}
			</div>
		`;
		}
		#getBottomButtons() {
			const buttons = [];
			if (this.#props.bottomButtons.onAcceptInvitation) {
				buttons.push(this.#renderAcceptButton());
			}
			if (this.#props.bottomButtons.onDeclineInvitation) {
				buttons.push(this.#renderDeclineButton());
			}
			if (this.#props.bottomButtons.onStartVideoconference) {
				buttons.push(this.#renderVideoconferenceButton());
			}
			if (this.#props.bottomButtons.onDownloadIcs) {
				buttons.push(this.#renderIcsButton());
			}
			if (this.#props.bottomButtons.onReturnToCalendar) {
				buttons.push(this.#renderReturnToCalendarButton());
			}
			return buttons;
		}
		#renderAcceptButton() {
			this.#layout.acceptButton = this.#renderButton(main_core.Loc.getMessage('CALENDAR_SHARING_ACCEPT'), this.#onAcceptButtonClick.bind(this));
			return this.#layout.acceptButton;
		}
		async #onAcceptButtonClick() {
			main_core.Dom.addClass(this.#layout.acceptButton, '--wait');
			await this.#props.bottomButtons.onAcceptInvitation();
			main_core.Dom.removeClass(this.#layout.acceptButton, '--wait');
		}
		#renderDeclineButton() {
			this.#layout.declineButton = this.#renderButton(main_core.Loc.getMessage('CALENDAR_SHARING_DECLINE'), this.#onDeclineButtonClick.bind(this), '--light-border');
			return this.#layout.declineButton;
		}
		async #onDeclineButtonClick() {
			main_core.Dom.addClass(this.#layout.declineButton, '--wait');
			await this.#props.bottomButtons.onDeclineInvitation();
			main_core.Dom.removeClass(this.#layout.declineButton, '--wait');
		}
		#renderVideoconferenceButton() {
			this.#layout.videoconferenceButton = this.#renderButton(main_core.Loc.getMessage('CALENDAR_SHARING_OPEN_VIDEOCONFERENCE'), this.#onVideoconferenceButtonClick.bind(this));
			return this.#layout.videoconferenceButton;
		}
		async #onVideoconferenceButtonClick() {
			main_core.Dom.addClass(this.#layout.videoconferenceButton, '--wait');
			await this.#props.bottomButtons.onStartVideoconference();
			main_core.Dom.removeClass(this.#layout.videoconferenceButton, '--wait');
		}
		#renderIcsButton() {
			this.#layout.icsButton = this.#renderButton(main_core.Loc.getMessage('CALENDAR_SHARING_ADD_TO_CALENDAR'), this.#onIcsButtonClick.bind(this), '--light-border');
			return this.#layout.icsButton;
		}
		async #onIcsButtonClick() {
			main_core.Dom.addClass(this.#layout.icsButton, '--wait');
			await this.#props.bottomButtons.onDownloadIcs();
			main_core.Dom.removeClass(this.#layout.icsButton, '--wait');
		}
		#renderReturnToCalendarButton() {
			return this.#renderButton(main_core.Loc.getMessage('CALENDAR_SHARING_RETURN_TO_SLOT_LIST'), this.#onReturnButtonClick.bind(this), '--light-border');
		}
		#onReturnButtonClick() {
			this.#props.bottomButtons.onReturnToCalendar();
		}
		#renderButton(text, action, className) {
			return main_core.Tag.render`
			<div
				onclick="${action}"
				class="calendar-pub-ui__btn ${className} --m calendar-pub-action-btn"
			>
				<div class="calendar-pub-ui__btn-text">${text}</div>
			</div>
		`;
		}
		showCancelEventPopup() {
			this.#getPopup().show();
		}
		#getPopup() {
			if (!this.popup) {
				const popupContent = main_core.Tag.render`
				<div>
					<div class="calendar-pub__cookies-title">${main_core.Loc.getMessage('CALENDAR_SHARING_POPUP_MEETING_CANCELED')}</div>
					<div class="calendar-pub__cookies-info">${main_core.Loc.getMessage('CALENDAR_SHARING_POPUP_MEETING_CANCELED_INFO')}</div>
					<div class="calendar-pub__cookies-buttons ${main_core.Browser.isMobile() ? '--center' : '--flex-end'}">
						<div onclick="${this.#closeCancelEventPopup.bind(this)}" class="calendar-pub-ui__btn --inline --m --light-border">
							<div class="calendar-pub-ui__btn-text">${main_core.Loc.getMessage('CALENDAR_SHARING_POPUP_LEAVE')}</div>
						</div>
						<div onclick="${this.#onDeleteButtonClick.bind(this)}" class="calendar-pub-ui__btn --inline --m --secondary">
							<div class="calendar-pub-ui__btn-text">${main_core.Loc.getMessage('CALENDAR_SHARING_POPUP_CANCEL')}</div>
						</div>
					</div>
				</div>
			`;
				if (main_core.Browser.isMobile()) {
					this.popup = new ui_bottomsheet.BottomSheet({
						className: 'calendar-pub__state',
						content: popupContent,
						padding: '20px 25px'
					});
				} else {
					this.popup = new main_popup.Popup({
						className: 'calendar-pub__popup',
						contentBackground: 'transparent',
						width: 380,
						animation: 'fading-slide',
						content: popupContent,
						overlay: true
					});
				}
			}
			return this.popup;
		}
		#closeCancelEventPopup() {
			this.#getPopup().close();
		}
		async #onDeleteButtonClick() {
			this.#closeCancelEventPopup();
			this.#props.onDeleteEvent();
		}
	}

	class Event extends Base {
		#event;
		#owner;
		#currentTimezone;
		#icsFile;
		#layout;
		#value;
		#state;
		#inDeletedSlider;
		#isView;
		#showBackCalendarButtons;
		#linkContext;
		#eventLayout;
		constructor(options) {
			super({
				isHiddenOnStart: options.isHiddenOnStart
			});
			this.#state = options.state;
			this.#isView = options.isView;
			this.#event = options.event;
			this.#owner = options.owner;
			this.#currentTimezone = options.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
			this.#layout = {
				back: null,
				widgetDate: null,
				eventName: null,
				icon: null,
				stateTitle: null,
				additionalBlock: null,
				bottomButton: null
			};
			this.#value = {
				from: null,
				to: null,
				timezone: null,
				isFullDay: false,
				canceledTimestamp: null,
				canceledUserName: null,
				eventName: null,
				canceledByManager: options.canceledByManager,
				eventLinkHash: options.eventLinkHash,
				eventId: options.eventId,
				members: options.members
			};
			this.#icsFile = null;
			this.#inDeletedSlider = options.inDeletedSlider === true;
			this.#showBackCalendarButtons = options.showBackCalendarButtons;
			this.#linkContext = options.linkContext;
			if (this.#event) {
				this.#initEventData();
			}
			this.#eventLayout = new EventLayout(this.#getLayoutProps());
			if (options.action === 'cancel') {
				setTimeout(() => this.#eventLayout.showCancelEventPopup(), 0);
			}
			if (options.action === 'ics') {
				this.downloadIcsFile();
			}
			if (options.action === 'videoconference') {
				this.startVideoconference();
			}
		}
		getType() {
			return 'event';
		}
		#initEventData() {
			this.#value.from = calendar_util.Util.getTimezoneDateFromTimestampUTC(parseInt(this.#event.timestampFromUTC, 10) * 1000, this.#currentTimezone);
			this.#value.to = calendar_util.Util.getTimezoneDateFromTimestampUTC(parseInt(this.#event.timestampToUTC, 10) * 1000, this.#currentTimezone);
			this.#value.timezone = this.#currentTimezone;
			this.#value.isFullDay = this.#event.isFullDay;
			this.#value.eventName = this.#getEventName();
			this.#value.canceledTimestamp = this.#event.canceledTimestamp;
			this.#value.canceledUserName = this.#event.externalUserName;
		}
		updateValue(data) {
			if (data.from) {
				this.#value.from = data.from;
			}
			if (data.to) {
				this.#value.to = data.to;
			}
			if (data.timezone) {
				this.#value.timezone = data.timezone;
			}
			if (main_core.Type.isBoolean(data.isFullDay)) {
				this.#value.isFullDay = data.isFullDay;
			}
			if (data.eventLinkHash) {
				this.#value.eventLinkHash = data.eventLinkHash;
			}
			if (data.eventName) {
				this.#value.eventName = data.eventName;
			}
			if (data.state) {
				this.#state = data.state;
			}
			if (data.isView) {
				this.#isView = false;
			}
			if (data.eventId) {
				this.#value.eventId = data.eventId;
			}
			if (data.userName) {
				this.#value.canceledUserName = data.userName;
			}
			if (this.#value.canceledByManager === true) {
				this.#value.canceledByManager = false;
			}
			this.#eventLayout.update(this.#getLayoutProps());
		}
		getContent() {
			return this.#eventLayout.render();
		}
		#getLayoutProps() {
			return {
				eventName: this.#value.eventName,
				from: this.#value.from,
				to: this.#value.to,
				timezone: this.#value.timezone,
				isFullDay: this.#value.isFullDay,
				members: this.#value.members,
				title: this.#getStateTitleTextByState(this.#state),
				iconClassName: this.#getIconClassByState(this.#state),
				onDeleteEvent: this.#state === 'created' ? this.deleteEvent.bind(this) : '',
				cancelledInfo: this.#getCancelledInfo(),
				showBackCalendarButton: this.#showBackCalendarButtons,
				bottomButtons: this.#getBottomButtons(),
				linkContext: this.#linkContext
			};
		}
		#getCancelledInfo() {
			if (this.#state === 'declined') {
				const cancelledDate = calendar_util.Util.getTimezoneDateFromTimestampUTC(parseInt(this.#value.canceledTimestamp, 10) * 1000, this.#currentTimezone);
				if (this.#value.canceledByManager) {
					this.#value.canceledUserName = `${this.#owner.name} ${this.#owner.lastName}`;
				}
				if (this.#value.canceledTimestamp && this.#value.canceledUserName && cancelledDate) {
					return {
						date: cancelledDate,
						name: this.#value.canceledUserName
					};
				}
			}
			return null;
		}
		#getBottomButtons() {
			const bottomButtons = {};
			if (this.#state === 'created') {
				bottomButtons.onStartVideoconference = this.startVideoconference.bind(this);
				bottomButtons.onDownloadIcs = this.downloadIcsFile.bind(this);
			}
			if (['not-created', 'declined'].includes(this.#state) && this.#showBackCalendarButtons) {
				bottomButtons.onReturnToCalendar = this.#onReturnButtonClick.bind(this);
			}
			return bottomButtons;
		}
		#getIconClassByState(state) {
			let result = '';
			switch (state) {
				case 'created':
					result = '--accept';
					break;
				case 'not-created':
					result = '--decline';
					break;
				case 'declined':
					result = '--decline';
					break;
			}
			return result;
		}
		#getStateTitleTextByState(state) {
			let result = '';
			switch (state) {
				case 'created':
					if (!this.#isView) {
						result = main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_CREATED');
					}
					break;
				case 'not-created':
					result = main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_NOT_CREATED');
					break;
				case 'declined':
					result = main_core.Loc.getMessage('CALENDAR_SHARING_MEETING_CANCELED');
					break;
			}
			return result;
		}
		async deleteEvent() {
			let response = null;
			try {
				response = await BX.ajax.runAction('calendar.api.sharingajax.deleteEvent', {
					data: {
						eventId: this.#value.eventId,
						eventLinkHash: this.#value.eventLinkHash
					}
				});
			} catch (e) {
				response = e;
			}
			if (response.errors.length === 0) {
				this.#value.canceledTimestamp = Date.now() / 1000;
				this.#state = 'declined';
				this.#eventLayout.update(this.#getLayoutProps());
				main_core_events.EventEmitter.emit('onDeleteEvent');
			}
			return response.errors.length === 0;
		}
		async startVideoconference() {
			let response = null;
			try {
				response = await BX.ajax.runAction('calendar.api.sharingajax.getConferenceLink', {
					data: {
						eventLinkHash: this.#value.eventLinkHash
					}
				});
			} catch (error) {
				console.error(error);
			}
			const conferenceLink = response?.data?.conferenceLink;
			if (conferenceLink) {
				window.location.href = conferenceLink;
			}
		}
		async downloadIcsFile() {
			try {
				if (!this.#icsFile) {
					const response = await BX.ajax.runAction('calendar.api.sharingajax.getIcsFileContent', {
						data: {
							eventLinkHash: this.#value.eventLinkHash
						}
					});
					this.#icsFile = response.data;
				}
				calendar_util.Util.downloadIcsFile(this.#icsFile, 'event');
			} catch (error) {
				console.error(error);
			}
		}
		#onReturnButtonClick() {
			main_core_events.EventEmitter.emit('onCreateAnotherEventButtonClick');
		}
		#getEventName() {
			return main_core.Loc.getMessage('CALENDAR_SHARING_EVENT_NAME', {
				'#OWNER_NAME#': `${this.#owner.name} ${this.#owner.lastName}`
			});
		}
	}

	class SlotSelector {
		#layout;
		#components;
		#selectedTimezoneId;
		#owner;
		#link;
		#sharingUser;
		#isFromCrm;
		#hasContactData;
		#calendarSettings;
		#eventLinkHash;
		#event;
		#members;
		#action;
		#showBackCalendarButtons;
		BLOCK_NAME_FORM = 'form';
		BLOCK_NAME_SLOT_LIST = 'slot-list';
		BLOCK_NAME_EMPTY_STATE = 'empty-state';
		BLOCK_NAME_ACCESS_DENIED = 'access-denied';
		BLOCK_NAME_EVENT = 'event';
		constructor(options) {
			this.#selectedTimezoneId = options.selectedTimezoneId;
			this.#owner = options.owner;
			this.#link = options.link;
			this.#sharingUser = options.sharingUser;
			this.#eventLinkHash = options.eventLinkHash;
			this.#event = options.event;
			this.#members = options.members;
			this.#layout = {
				wrapper: null,
				empty: null,
				title: null,
				slots: null,
				slotSelector: null
			};
			this.#components = {
				form: null,
				slotList: null,
				emptyState: null,
				event: null,
				accessDenied: null
			};
			this.#isFromCrm = this.#link.type === 'crm_deal';
			this.#hasContactData = options.hasContactData;
			this.#calendarSettings = options.calendarSettings;
			this.#showBackCalendarButtons = options.showBackCalendarButtons;
			this.#action = options.action;
			this.#bindEvents();
			// EventEmitter.subscribe('selectorStateChange', this.showForm.bind(this));
			// EventEmitter.subscribe('hideForm', this.hideForm.bind(this));
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('confirmedSelectSlot', event => {
				const data = event.data;
				const value = data.value;
				this.#components.form.updateFormValue({
					from: value.from,
					to: value.to,
					timezone: this.#selectedTimezoneId
				});
				this.openForm();
			});
			main_core_events.EventEmitter.subscribe('switchSlots', event => {
				const slots = event.data.slots ?? [];
				if (slots.length > 0) {
					main_core_events.EventEmitter.emit('updateSlotsList', event);
					this.openSlotList();
				} else {
					this.openEmptyState();
				}
			});
			main_core_events.EventEmitter.subscribe('updateTimezone', event => {
				const data = event.data;
				this.#selectedTimezoneId = data.timezone;
			});
			main_core_events.EventEmitter.subscribe('onSaveEvent', event => {
				const eventData = event.data;
				this.#components.form.cleanDescription();
				this.#components.event.updateValue(eventData);
				this.openEvent();
			});
		}
		openForm() {
			this.#components.form?.clearInputErrors();
			this.openBlock(this.BLOCK_NAME_FORM);
		}
		openSlotList() {
			this.openBlock(this.BLOCK_NAME_SLOT_LIST);
		}
		openEmptyState() {
			this.openBlock(this.BLOCK_NAME_EMPTY_STATE);
		}
		openAccessDenied() {
			this.openBlock(this.BLOCK_NAME_ACCESS_DENIED);
		}
		openEvent() {
			this.openBlock(this.BLOCK_NAME_EVENT);
		}
		openBlock(blockName) {
			main_core_events.EventEmitter.emit('selectorTypeChange', blockName);
		}
		render() {
			if (!this.#components.form) {
				this.#components.form = new Form({
					isHiddenOnStart: true,
					owner: this.#owner,
					link: this.#link,
					sharingUser: this.#sharingUser,
					isFromCrm: this.#isFromCrm,
					hasContactData: this.#hasContactData,
					isPhoneFeatureEnabled: this.#calendarSettings.phoneFeatureEnabled,
					isMailFeatureEnabled: this.#calendarSettings.mailFeatureEnabled
				});
			}
			if (!this.#components.emptyState) {
				this.#components.emptyState = new EmptyState({
					isHiddenOnStart: true
				});
			}
			if (!this.#components.accessDenied) {
				this.#components.accessDenied = new AccessDenied({
					isHiddenOnStart: true
				});
			}
			if (!this.#components.slotList) {
				this.#components.slotList = new SlotList({
					isHiddenOnStart: false,
					ownerOffset: parseInt(this.#calendarSettings.serverOffset, 10)
				});
			}
			if (!this.#components.event) {
				let state = 'created';
				if (this.#link.active === false || this.#event?.meetingStatus === 'N' || this.#event?.deleted === 'Y') {
					state = 'declined';
				}
				let canceledByManager = false;
				if (this.#event?.meetingStatus === 'N') {
					canceledByManager = true;
				}
				this.#components.event = new Event({
					isHiddenOnStart: false,
					owner: this.#owner,
					event: this.#event,
					eventLinkHash: this.#eventLinkHash,
					state,
					eventId: this.#event.id,
					isView: main_core.Type.isString(this.#eventLinkHash),
					canceledByManager,
					showBackCalendarButtons: this.#showBackCalendarButtons,
					action: this.#action,
					members: this.#members,
					linkContext: this.#link.type
				});
			}
			return main_core.Tag.render`
			<div class="calendar-pub__slots">
				${this.#components.slotList.render()}
				${this.#components.form.render()}
				${this.#components.emptyState.render()}
				${this.#components.event.render()}
				${this.#components.accessDenied.render()}
			</div>
		`;
		}
	}

	class PublicV2 {
		#layout;
		#owner;
		#welcomePage;
		#calendar;
		#slotsBlock;
		#linkMembers;
		#eventMembers;
		constructor(options) {
			this.#owner = options.owner || null;
			this.target = main_core.Type.isDomNode(options.target) ? options.target : null;
			this.#layout = {
				wrapper: null,
				animate: null
			};
			this.#welcomePage = null;
			this.#calendar = null;
			this.#slotsBlock = null;
			this.#linkMembers = (options.parentLink || options.link).members;
			this.#eventMembers = options.link.members ?? options.event.members;
			this.#init();
			this.#bindEvents();
			this.showPageWelcome(options);
			if (options.link.type === 'event') {
				if (options.parentLink && options.parentLink.active === true) {
					this.#renderFreeSlots(options);
					this.#welcomePage.handleWelcomePageButtonClick();
					this.#slotsBlock.openEvent();
				} else if (options.event) {
					this.#renderSlotsSelector(options);
					this.#welcomePage.handleWelcomePageButtonClick();
					this.#welcomePage.hideButton();
					this.#welcomePage.setAccessDenied();
					this.#slotsBlock.openEvent();
				} else {
					this.#renderSlotsSelector(options);
					this.#welcomePage.handleWelcomePageButtonClick();
					this.#welcomePage.hideButton();
					this.#slotsBlock.openAccessDenied();
				}
			} else if (options.link.active === true) {
				this.#renderFreeSlots(options);
			} else {
				this.#renderSlotsSelector(options);
				this.#welcomePage.handleWelcomePageButtonClick();
				this.#welcomePage.hideButton();
				this.#slotsBlock.openAccessDenied();
			}
			if (options.action === 'opened') {
				this.#welcomePage.handleWelcomePageButtonClick();
			}

			// this.showFreeSlots();
		}
		#bindEvents() {
			main_core_events.EventEmitter.subscribe('showSlotSelector', this.showFreeSlots.bind(this));
			main_core_events.EventEmitter.subscribe('hideSlotSelector', this.hideFreeSlots.bind(this));
		}
		showPageWelcome(options) {
			if (!options.owner) {
				return;
			}
			this.#welcomePage = new Welcome({
				owner: options.owner,
				link: options.link,
				currentLang: options.currentLang,
				members: this.#linkMembers
			});
			main_core.Dom.append(this.#welcomePage.render(), this.#getNodeWrapper());
		}
		#renderFreeSlots(options) {
			this.#calendar = new Calendar({
				userIds: options.link.userIds,
				accessibility: options.userAccessibility,
				timezoneList: options.timezoneList,
				calendarSettings: options.calendarSettings,
				rule: options.link.rule
			});
			let eventLinkHash = null;
			if (options.link.type === 'event') {
				eventLinkHash = options.link.hash;
			}
			this.#slotsBlock = new SlotSelector({
				selectedTimezoneId: this.#calendar.getSelectedTimezoneId(),
				owner: this.#owner,
				link: options.parentLink || options.link,
				members: this.#eventMembers,
				sharingUser: options.sharingUser,
				hasContactData: options.hasContactData,
				calendarSettings: options.calendarSettings,
				event: options.event,
				showBackCalendarButtons: true,
				eventLinkHash,
				action: options.action
			});
			const firstNodeWrapper = main_core.Tag.render`
			<div class="calendar-pub__block --plus">
				${this.#calendar.render()}
			</div>
		`;
			this.#layout.animate = main_core.Tag.render`
			<div class="calendar-pub__block-animate">
				${firstNodeWrapper}
				<div class="calendar-pub__block">
					${this.#slotsBlock.render()}
				</div>
			</div>
		`;
			main_core_events.EventEmitter.subscribe('selectorTypeChange', ev => {
				if (ev.data === 'form' || ev.data === 'event') {
					main_core.Dom.addClass(firstNodeWrapper, '--hidden');
				} else {
					main_core.Dom.removeClass(firstNodeWrapper, '--hidden');
				}
			});
			main_core.Dom.append(this.#layout.animate, this.#getNodeWrapper());
			if (options.link.type !== 'event') {
				this.#calendar.selectFirstAvailableDay();
			}
		}
		#renderSlotsSelector(options) {
			let eventLinkHash = null;
			if (options.link.type === 'event') {
				eventLinkHash = options.link.hash;
			}
			this.#slotsBlock = new SlotSelector({
				selectedTimezoneId: null,
				owner: this.#owner,
				link: options.link,
				sharingUser: options.sharingUser,
				hasContactData: options.hasContactData,
				calendarSettings: options.calendarSettings,
				event: options.event,
				showBackCalendarButtons: false,
				action: options.action,
				eventLinkHash
			});
			this.#layout.animate = main_core.Tag.render`
			<div class="calendar-pub__block-animate">
				<div class="calendar-pub__block">
					${this.#slotsBlock.render()}
				</div>
			</div>
		`;
			main_core.Dom.append(this.#layout.animate, this.#getNodeWrapper());
		}
		showFreeSlots() {
			main_core.Dom.removeClass(this.#getNodeWrapper(), '--hide');
		}
		hideFreeSlots() {
			main_core.Dom.addClass(this.#getNodeWrapper(), '--hide');
		}
		#getNodeWrapper() {
			if (!this.#layout.wrapper) {
				this.#layout.wrapper = main_core.Tag.render`
				<div class="calendar-pub__wrapper calendar-pub__state --hide"></div>
			`;
				if (main_core.Type.isArrayFilled(this.#linkMembers) || main_core.Type.isArrayFilled(this.#eventMembers)) {
					main_core.Dom.addClass(this.#layout.wrapper, '--large');
				}
			}
			return this.#layout.wrapper;
		}
		#render() {
			if (!this.target) {
				console.warn('BX.Calendar.Sharing: "target" is not defined');
				return;
			}
			if (this.target.parentNode) {
				main_core.Dom.append(this.#getNodeWrapper(), this.target.parentNode);
				main_core.Dom.remove(this.target);
			}
		}
		#init() {
			this.#render();
		}
	}

	exports.EventLayout = EventLayout;
	exports.PublicV2 = PublicV2;
	exports.WidgetDate = WidgetDate;

})(this.BX.Calendar.Sharing = this.BX.Calendar.Sharing || {}, BX, BX.Event, BX, window, BX.Main, BX.UI, BX.Calendar, BX.Main, BX.UI);
//# sourceMappingURL=public-v2.bundle.js.map
