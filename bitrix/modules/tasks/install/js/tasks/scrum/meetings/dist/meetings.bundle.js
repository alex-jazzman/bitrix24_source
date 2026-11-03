/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_core_events, main_loader, main_popup, ui_popupcomponentsmaker, calendar_analytics, socialnetwork_v2_lib_eventSender, ui_dialogs_messagebox) {
	'use strict';

	class Culture {
		static #instance;
		static getInstance() {
			if (!Culture.#instance) {
				Culture.#instance = new Culture();
			}
			return Culture.#instance;
		}
		setData(data) {
			this.data = data;
		}
		getDayMonthFormat() {
			return this.data.dayMonthFormat;
		}
		getLongDateFormat() {
			return this.data.longDateFormat;
		}
		getShortTimeFormat() {
			return this.data.shortTimeFormat;
		}
	}

	class CreatedEvent extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('BX.Tasks.Scrum.CreatedEvent');
			this.node = null;
		}
		render(event) {
			if (event === null) {
				return '';
			}
			event.color = event.color === '' ? '#86b100' : event.color;
			const colorBorder = this.convertHexToRGBA(event.color, 0.5);
			const colorBackground = this.convertHexToRGBA(event.color, 0.15);
			this.node = main_core.Tag.render`
			<div
				class="tasks-scrum__widget-meetings--timetable-content"
				style="background: ${colorBackground}; --meetings-border-color: ${colorBorder};"
			>
				<div class="tasks-scrum__widget-meetings--timetable-navigation">
					<div class="tasks-scrum__widget-meetings--timetable-time">
						${this.getFormattedTime(event.from, event.to)}
					</div>
					${this.renderVideoCallButton()}
				</div>
				<div class="tasks-scrum__widget-meetings--timetable-name">${main_core.Text.encode(event.name)}</div>
				${event.repeatable ? this.renderRepetition() : ''}
			</div>
		`;
			main_core.Event.bind(this.node, 'click', this.openViewCalendarSidePanel.bind(this, event));
			return this.node;
		}
		openViewCalendarSidePanel(event) {
			new window.top.BX.Calendar.SliderLoader(event.id, {
				entryDateFrom: new Date(event.from * 1000)
			}).show();
			this.emit('showView');
		}
		renderVideoCallButton() {
			return '';
		}
		renderRepetition() {
			return main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--timetable-repetition">
				<i class="tasks-scrum__widget-meetings--timetable-repetition-icon"></i>
				<span>${main_core.Loc.getMessage('TSM_REPETITION_TITLE')}</span>
			</div>
		`;
		}
		convertHexToRGBA(hexCode, opacity) {
			let hex = hexCode.replace('#', '');
			if (hex.length === 3) {
				hex = `${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`;
			}
			const r = parseInt(hex.substring(0, 2), 16);
			const g = parseInt(hex.substring(2, 4), 16);
			const b = parseInt(hex.substring(4, 6), 16);
			return `rgba(${r},${g},${b},${opacity})`;
		}
		getFormattedTime(from, to) {
			/* eslint-disable */
			return `${BX.date.format(Culture.getInstance().getShortTimeFormat(), from, null, true)} - ${BX.date.format(Culture.getInstance().getShortTimeFormat(), to, null, true)}`;
			/* eslint-enable */
		}
	}

	class ListEvents extends main_core_events.EventEmitter {
		constructor() {
			super();
			this.setEventNamespace('BX.Tasks.Scrum.ListEvents');
			this.listIsShown = false;
			this.todayEvent = null;
			this.node = null;
			this.listNode = null;
			this.buttonNode = null;
		}
		setTodayEvent(todayEvent) {
			this.todayEvent = todayEvent;
		}
		existsTodayEvent() {
			return this.todayEvent !== null;
		}
		render(listEvents) {
			const visibility = listEvents.length === 0 ? '' : '--visible';
			this.listIsShown = listEvents.length > 0 && !this.existsTodayEvent();
			this.node = main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--plan-content  ${visibility}">
				${this.renderList(listEvents)}
				${this.renderButton()}
			</div>
		`;
			return this.node;
		}
		renderList(listEvents) {
			const list = new Map();
			const groupedList = new Map();
			const sort = new Map();
			listEvents.forEach(event => {
				const key = this.getFormattedDate(event.from);
				const group = groupedList.has(key) ? groupedList.get(key) : new Set();
				group.add(event);
				sort.set(key, event.from);
				groupedList.set(key, group);
			});
			const sortedMap = new Map([...sort.entries()].sort((first, second) => first[1] - second[1]));
			[...sortedMap.keys()].forEach(key => {
				list.set(key, groupedList.get(key));
			});
			const visibility = this.existsTodayEvent() ? '' : '--visible';
			this.listNode = main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--plan ${visibility}">
				${this.renderSeparator()}
				${this.renderEvents(list)}
			</div>
			
		`;
			main_core.Event.bind(this.listNode, 'transitionend', this.onTransitionEnd.bind(this));
			return this.listNode;
		}
		renderSeparator() {
			if (!this.existsTodayEvent()) {
				return '';
			}
			return main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--header-separator">
				<span>${main_core.Loc.getMessage('TSM_PLANNING_EVENTS_TITLE')}</span>
			</div>
		`;
		}
		renderEvents(list) {
			if (list.size === 0) {
				return '';
			}
			return main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--timetable-wrapper">
				${[...list.values()].map((group, index) => {
			return main_core.Tag.render`
							<div class="tasks-scrum__widget-meetings--timetable-day">
								<div class="tasks-scrum__widget-meetings--timetable-title">
									${main_core.Text.encode([...list.keys()][index])}
								</div>
								${[...group.values()].map(event => {
				const createdEvent = new CreatedEvent();
				createdEvent.subscribe('showView', () => this.emit('showView'));
				return createdEvent.render(event);
			})}
							</div>
						`;
		})}
			</div>
		`;
		}
		renderButton() {
			this.buttonNode = main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings-btn-box-center ">
				<button
					class="tasks-scrum__widget-meetings--plan-btn ui-qr-popupcomponentmaker__btn --border --visible"
					data-role="toggle-list-events"
				>
					${this.getButtonText()}
				</button>
			</div>
		`;
			main_core.Event.bind(this.buttonNode, 'click', () => {
				this.listIsShown = !this.listIsShown;
				if (this.listIsShown) {
					this.showList();
				} else {
					this.hideList();
				}
				this.buttonNode.querySelector('button').textContent = this.getButtonText();
			});
			return this.buttonNode;
		}
		showList() {
			this.listNode.style.height = `${this.listNode.scrollHeight}px`;
			main_core.Dom.addClass(this.listNode, '--visible');
		}
		hideList() {
			this.listNode.style.height = `${this.listNode.scrollHeight}px`;
			this.listNode.clientHeight;
			this.listNode.style.height = '0';
			main_core.Dom.removeClass(this.listNode, '--visible');
		}
		onTransitionEnd() {
			if (this.listNode.style.height !== '0px') {
				this.listNode.style.height = 'auto';
			}
		}
		getButtonText() {
			if (this.listIsShown) {
				return main_core.Loc.getMessage('TSM_MEETINGS_SCHEDULED_BUTTON_HIDE');
			} else {
				return main_core.Loc.getMessage('TSM_MEETINGS_SCHEDULED_BUTTON');
			}
		}
		getFormattedDate(ts) {
			/* eslint-disable */
			return BX.date.format(Culture.getInstance().getDayMonthFormat(), ts, null, true);
			/* eslint-enable */
		}
	}

	class RequestSender {
		sendRequest(controller, action, data = {}) {
			return new Promise((resolve, reject) => {
				main_core.ajax.runAction('bitrix:tasks.scrum.' + controller + '.' + action, {
					data: data
				}).then(resolve, reject);
			});
		}
		getMeetings(data) {
			return this.sendRequest('calendar', 'getMeetings', data);
		}
		getChat(data) {
			return this.sendRequest('calendar', 'getChat', data);
		}
		saveEventInfo(data) {
			return this.sendRequest('calendar', 'saveEventInfo', data);
		}
		closeTemplates(data) {
			return this.sendRequest('calendar', 'closeTemplates', data);
		}
		showErrorAlert(response, alertTitle) {
			if (main_core.Type.isUndefined(response.errors)) {
				console.error(response);
				return;
			}
			if (response.errors.length) {
				const firstError = response.errors.shift();
				if (firstError) {
					const errorCode = firstError.code ? firstError.code : '';
					const message = firstError.message + ' ' + errorCode;
					const title = alertTitle ? alertTitle : main_core.Loc.getMessage('TSM_MEETINGS_ERROR_POPUP_TITLE');
					ui_dialogs_messagebox.MessageBox.alert(message, title);
				}
			}
		}
	}

	class Meetings {
		constructor(params) {
			this.groupId = parseInt(params.groupId, 10);
			this.requestSender = new RequestSender();
			this.todayEvent = new CreatedEvent();
			this.listEvents = new ListEvents();
			this.listEvents.subscribe('showView', this.onShowView.bind(this));
			this.menu = null;
			this.eventTemplatesMenu = null;
		}
		showMenu(targetNode) {
			if (this.menu && this.menu.isShown()) {
				this.menu.close();
				return;
			}
			this.sendOpenSectionAnalytics();
			const response = this.requestSender.getMeetings({
				groupId: this.groupId
			}).then(meetingsResponse => {
				Culture.getInstance().setData(meetingsResponse.data.culture);
				return meetingsResponse;
			});
			this.menu = new ui_popupcomponentsmaker.PopupComponentsMaker({
				id: 'tasks-scrum-meetings-widget',
				target: targetNode,
				cacheable: false,
				content: [{
					html: [{
						html: this.renderMeetings(response)
					}]
				}, {
					html: [{
						html: this.renderChats(response)
					}]
				}]
			});
			this.menu.show();
		}
		renderMeetings(response) {
			return response.then(meetingsResponse => {
				this.meetingsNode = main_core.Tag.render`
					<div class="tasks-scrum__widget-meetings tasks-scrum__widget-meetings--scope">
						${this.renderMeetingsHeader(meetingsResponse)}
						${this.renderEventTemplates(meetingsResponse)}
						${this.renderScheduledMeetings(meetingsResponse)}
					</div>
				`;
				return this.meetingsNode;
			}).catch(meetingsResponse => {
				this.requestSender.showErrorAlert(meetingsResponse);
			});
		}
		renderChats(response) {
			return response.then(chatsResponse => {
				const chats = chatsResponse.data.chats;
				return main_core.Tag.render`
					<div class="tasks-scrum__widget-meetings tasks-scrum__widget-meetings--scope">
						<div class="tasks-scrum__widget-meetings--header">
							<div
								class="ui-icon ui-icon-service-livechat tasks-scrum__widget-meetings--icon-chats"
							><i></i></div>
							<div class="tasks-scrum__widget-meetings--header-title">
								${main_core.Loc.getMessage('TSM_CHATS_HEADER_TITLE')}
							</div>
						</div>
						${this.renderChatsList(chats)}
						${this.renderChatsEmpty(chats)}
	
					</div>
				`;
			}).catch(errorResponse => {
				this.requestSender.showErrorAlert(errorResponse);
			});
		}
		renderChatsList(chats) {
			const visibility = chats.length > 0 ? '--visible' : '';
			return main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--chat-content ${visibility}">
				${chats.map(chat => {
			const chatIconClass = chat.icon === '' ? 'default' : '';
			const chatIconStyle = chat.icon === '' ? '' : `background-image: url('${chat.icon}');`;
			const chatNode = main_core.Tag.render`
							<div class="tasks-scrum__widget-meetings--chat-container">
								<div class="ui-icon ui-icon-common-company tasks-scrum__widget-meetings--chat-icon">
									<i
									class="chat-icon ${chatIconClass}"
										style="${chatIconStyle}"
									></i>
								</div>
								<div class="tasks-scrum__widget-meetings--chat-info">
									<div class="tasks-scrum__widget-meetings--chat-name">
										${chat.name}
									</div>
									<div class="users-icon tasks-scrum__widget-meetings--chat-users">
										${this.renderChatUser(chat.users)}
									</div>
								</div>
							</div>
						`;
			main_core.Event.bind(chatNode, 'click', this.openChat.bind(this, chat, chatNode));
			return chatNode;
		})}
			</div>
		`;
		}
		openChat(chat, chatNode) {
			const loader = new main_loader.Loader({
				target: chatNode,
				size: 34,
				mode: 'inline',
				color: 'rgba(82, 92, 105, 0.9)'
			});
			loader.show();
			this.requestSender.getChat({
				groupId: this.groupId,
				chatId: chat.id
			}).then(() => {
				if (top.window.BXIM) {
					top.BXIM.openMessenger(`chat${parseInt(chat.id, 10)}`);
					this.menu.close();
				}
			}).catch(response => {
				this.requestSender.showErrorAlert(response);
			});
		}
		renderChatUser(users) {
			const uiIconClasses = 'tasks-scrum__widget-meetings--chat-icon-user ui-icon ui-icon-common-user';
			return main_core.Tag.render`
			${users.map(user => {
			const src = user.photo ? encodeURI(main_core.Text.encode(user.photo.src)) : null;
			const photoStyle = src ? `background-image: url('${src}');` : '';
			return main_core.Tag.render`
						<div class="user-icon ${uiIconClasses}" title="${main_core.Text.encode(user.name)}">
							<i style="${photoStyle}"></i>
						</div>
					`;
		})}
		`;
		}
		renderChatsEmpty(chats) {
			const visibility = chats.length > 0 ? '' : '--visible';
			return main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--content">
				<div class="tasks-scrum__widget-meetings--empty-chats ${visibility}">
					<div class="tasks-scrum__widget-meetings--empty-name">
						${main_core.Loc.getMessage('TSM_CHATS_EMPTY_TITLE')}
					</div>
					<div class="tasks-scrum__widget-meetings--empty-text">
						${main_core.Loc.getMessage('TSM_CHATS_EMPTY_TEXT')}
					</div>
				</div>
			</div>
		`;
		}
		renderMeetingsHeader(response) {
			const calendarSettings = response.data.calendarSettings;
			const uiClasses = 'ui-btn-split ui-btn-light-border ui-btn-xs ui-btn-light ui-btn-no-caps ui-btn-round';
			const node = main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--header">

				<div class="ui-icon ui-icon-service-calendar tasks-scrum__widget-meetings--icon-calendar">
					<i></i>
				</div>

				<div class="tasks-scrum__widget-meetings--header-title">
					${main_core.Loc.getMessage('TSM_MEETINGS_HEADER_TITLE')}
				</div>

				<div class="tasks-scrum__widget-meetings--btn-create ${uiClasses}">
					<button class="ui-btn-main" data-role="create-default-event">
						${main_core.Loc.getMessage('TSM_MEETINGS_CREATE_BUTTON')}
					</button>
					<div class="ui-btn-menu" data-role="show-menu-event-templates"></div>
				</div>

			</div>
		`;
			const button = node.querySelector('button');
			const menu = node.querySelector('.ui-btn-menu');
			main_core.Event.bind(button, 'click', this.showEventSidePanel.bind(this));
			main_core.Event.bind(menu, 'click', this.showMenuWithEventTemplates.bind(this, button, calendarSettings));
			return node;
		}
		renderEventTemplates(response) {
			const mapCreatedEvents = response.data.mapCreatedEvents;
			const listEvents = response.data.listEvents;
			const isTemplatesClosed = response.data.isTemplatesClosed;
			const calendarSettings = response.data.calendarSettings;
			const templateVisibility = isTemplatesClosed || this.isAllEventsCreated(mapCreatedEvents) ? '' : '--visible';
			const emptyVisibility = isTemplatesClosed && listEvents.length === 0 ? '--visible' : '';
			const contentVisibilityClass = emptyVisibility === '' && templateVisibility === '' ? '--content-hidden' : '';
			const node = main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--content ${contentVisibilityClass}">

				<div class="tasks-scrum__widget-meetings--creation-block ${templateVisibility}">
					<span
						class="tasks-scrum__widget-meetings--creation-close-btn"
						data-role="close-event-templates"
					></span>
					<div class="tasks-scrum__widget-meetings--create-element-info">
						${main_core.Loc.getMessage('TSM_MEETINGS_EVENT_TEMPLATES_INFO')}
					</div>
					${[...this.getEventTemplates(calendarSettings).values()].map(eventTemplate => {
			if (main_core.Type.isArray(mapCreatedEvents) || main_core.Type.isUndefined(mapCreatedEvents[eventTemplate.id])) {
				return this.renderEventTemplate(eventTemplate);
			}
			return '';
		})}
				</div>
	
				<div class="tasks-scrum__widget-meetings--empty-meetings ${emptyVisibility}">
					<div class="tasks-scrum__widget-meetings--empty-name">
						${main_core.Loc.getMessage('TSM_MEETINGS_EMPTY_TITLE')}
					</div>
					<div class="tasks-scrum__widget-meetings--empty-text">
						${main_core.Loc.getMessage('TSM_MEETINGS_EMPTY_TEXT')}
					</div>
					<button class="tasks-scrum__widget-meetings--one-click-btn ui-qr-popupcomponentmaker__btn">
						${main_core.Loc.getMessage('TSM_MEETINGS_CREATE_ONE_CLICK')}
					</button>
				</div>
			</div>
		`;
			const closeButton = node.querySelector('.tasks-scrum__widget-meetings--creation-close-btn');
			const oneClickButton = node.querySelector('.tasks-scrum__widget-meetings--one-click-btn');
			const templatesNode = node.querySelector('.tasks-scrum__widget-meetings--creation-block');
			const emptyNode = node.querySelector('.tasks-scrum__widget-meetings--empty-meetings');
			main_core.Event.bind(closeButton, 'click', () => {
				main_core.Dom.removeClass(templatesNode, '--visible');
				const isExistsEvent = listEvents.length;
				if (!isExistsEvent) {
					main_core.Dom.addClass(emptyNode, '--visible');
				}
				this.requestSender.closeTemplates({
					groupId: this.groupId
				}).catch(errorResponse => {
					this.requestSender.showErrorAlert(errorResponse);
				});
			});
			main_core.Event.bind(oneClickButton, 'click', () => {
				main_core.Dom.addClass(templatesNode, '--visible');
				main_core.Dom.removeClass(emptyNode, '--visible');
			});
			return node;
		}
		renderScheduledMeetings(response) {
			const todayEvent = response.data.todayEvent;
			const listEvents = response.data.listEvents;
			const todayEventVisibility = main_core.Type.isNull(todayEvent) ? '' : '--visible';
			this.listEvents.setTodayEvent(todayEvent);
			return main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--timetable">
				<div class="tasks-scrum__widget-meetings--timetable-container ${todayEventVisibility}">
					<div class="tasks-scrum__widget-meetings--timetable-title">
						${main_core.Loc.getMessage('TSM_TODAY_EVENT_TITLE')}
					</div>
					${this.todayEvent.render(todayEvent)}
				</div>
				${this.listEvents.render(listEvents, todayEvent)}
			</div>
		`;
		}
		renderEventTemplate(eventTemplate) {
			const node = main_core.Tag.render`
			<div class="tasks-scrum__widget-meetings--create-element ${main_core.Text.encode(eventTemplate.uiClass)}">
				<div class="tasks-scrum__widget-meetings--create-element-title">
					<span class="tasks-scrum__widget-meetings--create-element-name">
						${main_core.Text.encode(eventTemplate.name)}
					</span>
					<span class="ui-hint">
						<i
							class="ui-hint-icon"
							data-hint="${eventTemplate.hint}"
							data-hint-no-icon
							data-hint-html
						></i>
					</span>
				</div>
				<div class="tasks-scrum__widget-meetings--create-btn">
					<button
						class="ui-qr-popupcomponentmaker__btn"
						data-role="create-event-template-${eventTemplate.id}"
					>
						${main_core.Loc.getMessage('TSM_MEETINGS_CREATE_BUTTON')}
					</button>
				</div>
			</div>
		`;
			const createButton = node.querySelector('.tasks-scrum__widget-meetings--create-btn');
			main_core.Event.bind(createButton, 'click', this.openCalendarSidePanel.bind(this, eventTemplate));
			this.initHints(node);
			return node;
		}
		onShowView() {
			this.menu.close();
		}
		showEventSidePanel() {
			this.openCalendarSidePanel();
		}
		showMenuWithEventTemplates(targetNode, calendarSettings) {
			if (this.eventTemplatesMenu && this.eventTemplatesMenu.getPopupWindow().isShown()) {
				this.eventTemplatesMenu.close();
				return;
			}
			this.eventTemplatesMenu = new main_popup.Menu({
				id: 'tsm-event-templates-menu',
				bindElement: targetNode,
				closeByEsc: true
			});
			this.eventTemplatesMenu.addMenuItem({
				text: main_core.Loc.getMessage('TSM_MEETINGS_EVENT_TEMPLATE_BLANK'),
				delimiter: true
			});
			this.getEventTemplates(calendarSettings).forEach(eventTemplate => {
				this.eventTemplatesMenu.addMenuItem({
					text: eventTemplate.name,
					onclick: (event, menuItem) => {
						this.openCalendarSidePanel(eventTemplate);
						menuItem.getMenuWindow().close();
					}
				});
			});
			this.eventTemplatesMenu.getPopupWindow().subscribe('onClose', () => {
				this.eventTemplatesMenu.destroy();
			});
			this.eventTemplatesMenu.show();
		}
		openCalendarSidePanel(eventTemplate) {
			this.sendCreateEventAnalytics();
			const participantsEntityList = eventTemplate ? eventTemplate.roles : [];
			const formData = eventTemplate ? {
				name: eventTemplate.name,
				description: eventTemplate.desc,
				from: eventTemplate.from,
				to: eventTemplate.to,
				color: eventTemplate.color,
				rrule: eventTemplate.rrule
			} : {
				name: '',
				description: '',
				color: '#86b100'
			};
			const sliderId = main_core.Text.getRandom();
			new window.top.BX.Calendar.SliderLoader(0, {
				sliderId: sliderId,
				participantsSelectorEntityList: [{
					id: 'user'
				}, {
					id: 'project-roles',
					options: {
						projectId: this.groupId
					},
					dynamicLoad: true
				}],
				formDataValue: formData,
				participantsEntityList: participantsEntityList,
				type: 'group',
				ownerId: this.groupId
			}).show();
			top.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onLoad', event => {
				const [sliderEvent] = event.getCompatData();
				if (sliderId === sliderEvent.getSlider().getUrl().toString()) {
					top.BX.Event.EventEmitter.subscribeOnce('BX.Calendar:onEntrySave', baseEvent => {
						const data = baseEvent.getData();
						if (sliderId === data.sliderId) {
							if (eventTemplate) {
								this.requestSender.saveEventInfo({
									groupId: this.groupId,
									templateId: eventTemplate.id,
									eventId: data.responseData.entryId
								}).then(() => {
									this.menu.close();
								}).catch(response => {
									this.requestSender.showErrorAlert(response);
								});
							}
						}
					});
				}
			});
		}
		sendOpenSectionAnalytics() {
			calendar_analytics.Analytics.sendEvent({
				event: 'open_section',
				cSection: 'project',
				cSubSection: 'meeting',
				cElement: 'meeting_button',
				projectId: this.groupId,
				status: 'success',
				userType: this.getAnalyticsUserType()
			});
		}
		sendCreateEventAnalytics() {
			calendar_analytics.Analytics.sendEvent({
				event: 'click_create_event',
				cSection: 'project',
				cSubSection: 'project_header',
				cElement: 'slider',
				projectId: this.groupId,
				status: 'success',
				userType: this.getAnalyticsUserType()
			});
		}
		getAnalyticsUserType() {
			const settings = main_core.Extension.getSettings('socialnetwork.v2.lib.event-sender') ?? {};
			return main_core.Type.isStringFilled(settings.userType) ? settings.userType : null;
		}
		getEventTemplates(calendarSettings) {
			const eventTemplates = new Set();
			const daysNumberMap = {
				MO: 1,
				TU: 2,
				WE: 3,
				TH: 4,
				FR: 5,
				SA: 6,
				SU: 7
			};
			const weekStartDay = calendarSettings.weekStart[Object.keys(calendarSettings.weekStart)[0]];
			const weekStartDayNumber = daysNumberMap[weekStartDay];
			eventTemplates.add({
				id: 'daily',
				entityId: 'project-roles',
				name: main_core.Loc.getMessage('TSM_MEETINGS_EVENT_TEMPLATE_NAME_DAILY'),
				desc: '',
				from: new Date(new Date().setHours(calendarSettings.workTimeStart, 0, 0)),
				to: new Date(new Date().setHours(calendarSettings.workTimeStart, 15, 0)),
				rrule: {
					FREQ: 'WEEKLY',
					INTERVAL: 1,
					BYDAY: calendarSettings.weekDays
				},
				roles: [{
					id: `${this.groupId}_M`,
					entityId: 'project-roles'
				}, {
					id: `${this.groupId}_E`,
					entityId: 'project-roles'
				}],
				uiClass: 'widget-meetings__sprint-daily',
				color: '#2FC6F6',
				hint: main_core.Loc.getMessage('TSM_MEETINGS_EVENT_TEMPLATE_HINT_DAILY')
			});
			eventTemplates.add({
				id: 'planning',
				entityId: 'project-roles',
				name: main_core.Loc.getMessage('TSM_MEETINGS_EVENT_TEMPLATE_NAME_PLANNING'),
				desc: '',
				from: new Date(this.getNextWeekStartDate(weekStartDayNumber).setHours(calendarSettings.workTimeStart, 0, 0)),
				to: new Date(this.getNextWeekStartDate(weekStartDayNumber).setHours(calendarSettings.workTimeStart + 1, 0, 0)),
				rrule: {
					FREQ: 'WEEKLY',
					INTERVAL: calendarSettings.interval,
					BYDAY: calendarSettings.weekStart
				},
				roles: [{
					id: `${this.groupId}_A`,
					entityId: 'project-roles'
				}, {
					id: `${this.groupId}_M`,
					entityId: 'project-roles'
				}, {
					id: `${this.groupId}_E`,
					entityId: 'project-roles'
				}],
				uiClass: 'widget-meetings__sprint-planning',
				color: '#DA51D4',
				hint: main_core.Loc.getMessage('TSM_MEETINGS_EVENT_TEMPLATE_HINT_PLANNING')
			});
			eventTemplates.add({
				id: 'review',
				entityId: 'project-roles',
				name: main_core.Loc.getMessage('TSM_MEETINGS_EVENT_TEMPLATE_NAME_REVIEW'),
				desc: '',
				from: new Date(this.getNextWeekStartDate(weekStartDayNumber).setHours(calendarSettings.workTimeStart, 0, 0)),
				to: new Date(this.getNextWeekStartDate(weekStartDayNumber).setHours(calendarSettings.workTimeStart + 1, 0, 0)),
				rrule: {
					FREQ: 'WEEKLY',
					INTERVAL: calendarSettings.interval,
					BYDAY: calendarSettings.weekStart
				},
				roles: [{
					id: `${this.groupId}_A`,
					entityId: 'project-roles'
				}, {
					id: `${this.groupId}_M`,
					entityId: 'project-roles'
				}, {
					id: `${this.groupId}_E`,
					entityId: 'project-roles'
				}],
				uiClass: 'widget-meetings__sprint-review',
				color: '#FF5752',
				hint: main_core.Loc.getMessage('TSM_MEETINGS_EVENT_TEMPLATE_HINT_REVIEW')
			});
			eventTemplates.add({
				id: 'retrospective',
				entityId: 'project-roles',
				name: main_core.Loc.getMessage('TSM_MEETINGS_EVENT_TEMPLATE_NAME_RETROSPECTIVE'),
				desc: '',
				from: new Date(this.getNextWeekStartDate(weekStartDayNumber).setHours(calendarSettings.workTimeStart, 0, 0)),
				to: new Date(this.getNextWeekStartDate(weekStartDayNumber).setHours(calendarSettings.workTimeStart + 1, 0, 0)),
				rrule: {
					FREQ: 'WEEKLY',
					INTERVAL: calendarSettings.interval,
					BYDAY: calendarSettings.weekStart
				},
				roles: [{
					id: `${this.groupId}_M`,
					entityId: 'project-roles'
				}, {
					id: `${this.groupId}_E`,
					entityId: 'project-roles'
				}],
				uiClass: 'widget-meetings__sprint-retrospective',
				color: '#FF5752',
				hint: main_core.Loc.getMessage('TSM_MEETINGS_EVENT_TEMPLATE_HINT_RETROSPECTIVE')
			});
			return eventTemplates;
		}
		isAllEventsCreated(mapCreatedEvents) {
			if (main_core.Type.isArray(mapCreatedEvents)) {
				return false;
			}
			return main_core.Type.isInteger(mapCreatedEvents.daily) && main_core.Type.isInteger(mapCreatedEvents.planning) && main_core.Type.isInteger(mapCreatedEvents.review) && main_core.Type.isInteger(mapCreatedEvents.retrospective);
		}
		getNextWeekStartDate(weekStartDayNumber) {
			const date = new Date();
			const targetDate = new Date();
			const delta = weekStartDayNumber - date.getDay();
			if (delta >= 0) {
				targetDate.setDate(date.getDate() + delta);
			} else {
				targetDate.setDate(date.getDate() + 7 + delta);
			}
			return targetDate;
		}
		initHints(node) {
			BX.UI.Hint.init(node);
		}
	}

	exports.Meetings = Meetings;

})(this.BX.Tasks.Scrum = this.BX.Tasks.Scrum || {}, BX, BX.Event, BX, BX.Main, BX.UI, BX.Calendar.Analytics, BX.Socialnetwork.V2.Lib, BX.UI.Dialogs);
//# sourceMappingURL=meetings.bundle.js.map
