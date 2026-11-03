/* eslint-disable */
this.BX = this.BX || {};
this.BX.Tasks = this.BX.Tasks || {};
(function (exports, main_core, main_core_events, main_date, main_popup, ui_formElements_view, tasks_dateRounder, ui_datePicker, ui_buttons, ui_analytics, tasks_intervalSelector) {
	'use strict';

	class DeadlinePicker extends main_core_events.EventEmitter {
		#EVENT_NAMESPACE = 'BX.Tasks.Deadline.Notification.Layout.DeadlinePicker';
		#calendar;
		#datePicker;
		#input;
		#matchWorkTime;
		constructor(options) {
			super();
			this.setEventNamespace(this.#EVENT_NAMESPACE);
			this.subscribeFromOptions(options.events);
			this.#init(options);
		}
		getSelectedDate() {
			return this.#datePicker.getSelectedDate();
		}
		getToday() {
			return this.#datePicker.getToday();
		}
		formatDate(date, format) {
			return this.#datePicker.formatDate(date, format);
		}
		#init(options) {
			const calendar = options.calendar;
			if (calendar instanceof BX.Tasks.Calendar) {
				this.#calendar = calendar;
			}
			const defaultTime = this.#getDefaultTime();
			const input = options.input;
			if (input instanceof HTMLInputElement) {
				this.#input = input;
			}
			const matchWorkTime = options.matchWorkTime;
			this.#matchWorkTime = main_core.Type.isBoolean(matchWorkTime) ? matchWorkTime : false;
			const addZero = unit => `0${unit}`.slice(-2);
			const pickerOptions = {
				defaultTime: `${addZero(defaultTime.getHours())}:${addZero(defaultTime.getMinutes())}`,
				targetNode: this.#input,
				enableTime: true,
				cutZeroTime: false,
				events: {
					onSelect: this.#onSelect.bind(this),
					onHide: this.#onHide.bind(this)
				}
			};
			this.#datePicker = new ui_datePicker.DatePicker({
				...options,
				...pickerOptions
			});
			main_core.Event.bind(this.#input, 'click', this.#datePicker.show.bind(this.#datePicker));
		}
		#getDefaultTime() {
			const now = new Date();
			const workInterval = this.#calendar.getWorkIntervals(now).pop();
			return new Date(workInterval.endDate.toLocaleString('en-US', {
				timeZone: 'UTC'
			}));
		}
		#onSelect(event) {
			const {
				date
			} = event.getData();
			if (!this.#matchWorkTime) {
				this.#setInputValue(date);
				this.emit('onSelect');
				return;
			}
			const closestWorkDate = this.#calendar.getClosestWorkTime(date, true);
			if (date.getTime() !== closestWorkDate.getTime()) {
				this.#datePicker.selectDate(new Date(closestWorkDate.toLocaleString('en-US', {
					timeZone: 'UTC'
				})));
				this.#datePicker.hide();
				this.emit('onMoveDateToWorkTime');
			}
			this.#setInputValue(closestWorkDate);
			this.emit('onSelect');
		}
		#onHide() {
			const date = this.getSelectedDate();
			const now = this.getToday();
			if (main_core.Type.isDate(date) && date < now) {
				this.emit('onLessCurrentDateSelect');
			}
		}
		#setInputValue(date) {
			const dateFormat = this.#getDateFormatByDate(date);
			this.#input.value = this.#datePicker.formatDate(date, dateFormat);
		}
		#getDateFormatByDate(date) {
			const timeFormat = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT');
			const now = new Date();
			let dateFormat = main_date.DateTimeFormat.getFormat('DAY_OF_WEEK_MONTH_FORMAT');
			if (main_core.Type.isDate(date) && now.getFullYear() !== date.getFullYear()) {
				dateFormat = main_date.DateTimeFormat.getFormat('FULL_DATE_FORMAT');
			}
			return `${dateFormat}, ${timeFormat}`;
		}
	}

	class MovedDeadlinePopup extends main_popup.Popup {
		constructor(options) {
			const content = `
			<div class="tasks-deadline-notification-form__content_deadline-selector_moved-toolbar">
				${main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_MOVED_DEADLINE_TOOLTIP')}
			</div>
		`;
			const popupOptions = {
				id: 'deadline-notification-moved-deadline-popup',
				offsetLeft: 30,
				offsetTop: 5,
				angle: true,
				autoHide: true,
				closeByEsc: false,
				closeIcon: true,
				content
			};
			super({
				...options,
				...popupOptions
			});
		}
	}

	class OverdueDeadlinePopup extends main_popup.Popup {
		constructor(options) {
			const content = `
			<div class="tasks-deadline-notification-form__content_deadline-selector_overdue-toolbar">
				${main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_OVERDUE_DEADLINE_TOOLTIP')}
			</div>
		`;
			const popupOptions = {
				id: 'deadline-notification-overdue-deadline-popup',
				offsetLeft: 30,
				offsetTop: 5,
				angle: true,
				autoHide: true,
				closeByEsc: false,
				closeIcon: true,
				content
			};
			super({
				...options,
				...popupOptions
			});
		}
	}

	const DAYS_IN_WEEK = 7;
	class DeadlineSelector extends main_core_events.EventEmitter {
		#EVENT_NAMESPACE = 'BX.Tasks.Deadline.Notification.Layout.DeadlineSelector';
		#calendar;
		#deadlinePicker;
		#input;
		#matchWorkTime;
		#movedDeadlinePopup;
		#overdueDeadlinePopup;
		constructor(options) {
			super();
			this.setEventNamespace(this.#EVENT_NAMESPACE);
			this.subscribeFromOptions(options.events);
			this.#init(options);
		}
		render() {
			return main_core.Tag.render`
			<div class="tasks-deadline-notification-form__content_deadline-selector">
				<div class="ui-ctl ui-ctl-after-icon ui-ctl-datetime ui-ctl-w75">
					<div class="ui-ctl-after ui-ctl-icon-calendar"></div>
					${this.#input}
				</div>
			</div>
		`;
		}
		getInputValue() {
			return this.#input.value;
		}
		getDeadline() {
			return this.#deadlinePicker.getSelectedDate();
		}
		getToday() {
			return this.#deadlinePicker.getToday();
		}
		getFormattedDeadline(format) {
			return this.#deadlinePicker.formatDate(this.getDeadline(), format);
		}
		#init(options) {
			this.#input = main_core.Tag.render`
			<input class="ui-ctl-element" data-id="tasks-deadline-notification-deadline" readonly>
		`;
			const portalSettings = this.#getPortalSettings();
			this.#initCalendar(portalSettings);
			this.#initMatchWorkTime(options, portalSettings);
			this.#initDeadlinePicker(this.#input, this.#calendar, this.#matchWorkTime);
		}
		#initMatchWorkTime(options, portalSettings) {
			this.#matchWorkTime = options.matchWorkTime;
			const weekends = portalSettings.WEEKEND;
			if (!main_core.Type.isArray(weekends)) {
				return;
			}
			const countOfWeekends = weekends.length;
			if (countOfWeekends === DAYS_IN_WEEK) {
				this.#matchWorkTime = false;
			}
		}
		#initCalendar(portalSettings) {
			const adaptedSettings = BX.Tasks.Calendar.adaptSettings(portalSettings);
			this.#calendar = new BX.Tasks.Calendar(adaptedSettings);
		}
		#initDeadlinePicker(input, calendar, matchWorkTime) {
			this.#deadlinePicker = new DeadlinePicker({
				events: {
					onMoveDateToWorkTime: this.#onMoveDateToWorkTime.bind(this),
					onLessCurrentDateSelect: this.#onLessCurrentDateSelect.bind(this),
					onSelect: () => this.emit('onSelect')
				},
				input,
				calendar,
				matchWorkTime
			});
		}
		#onMoveDateToWorkTime() {
			const overdueDeadlinePopup = this.#getOverdueDeadlinePopup();
			if (overdueDeadlinePopup.isShown()) {
				return;
			}
			const movedDeadlinePopup = this.#getMovedDeadlinePopup();
			movedDeadlinePopup.show();
		}
		#onLessCurrentDateSelect() {
			const overdueDeadlinePopup = this.#getOverdueDeadlinePopup();
			overdueDeadlinePopup.show();
		}
		#getOverdueDeadlinePopup() {
			if (!this.#overdueDeadlinePopup) {
				this.#overdueDeadlinePopup = new OverdueDeadlinePopup({
					bindElement: this.#input
				});
			}
			return this.#overdueDeadlinePopup;
		}
		#getMovedDeadlinePopup() {
			if (!this.#movedDeadlinePopup) {
				this.#movedDeadlinePopup = new MovedDeadlinePopup({
					bindElement: this.#input
				});
			}
			return this.#movedDeadlinePopup;
		}
		#getPortalSettings() {
			const settings = main_core.Extension.getSettings('tasks.deadline.notification');
			return settings.get('portalSettings');
		}
	}

	class SkipButtonMenu extends main_core_events.EventEmitter {
		#EVENT_NAMESPACE = 'BX.Tasks.Deadline.Notification.Layout.SkipButtonMenu';
		#ACCEPTED_ITEM_CLASS = 'menu-popup-item-accept';
		#ITEMS_CLASSES = 'menu-popup-icon menu-popup-item-none';
		#button;
		#items;
		#period;
		constructor(options = {}) {
			super();
			this.setEventNamespace(this.#EVENT_NAMESPACE);
			this.subscribeFromOptions(options.events);
			this.#init();
		}
		getMenu() {
			return {
				closeByEsc: true,
				items: this.#items,
				minWidth: 180
			};
		}
		getPeriod() {
			return this.#period;
		}
		setButton(button) {
			this.#button = button;
		}
		#onMenuItemClick(item) {
			const buttonMenu = this.#button?.getMenuWindow();
			if (!buttonMenu) {
				return;
			}
			const period = item.id;
			const text = item.text;
			if (this.#period === period) {
				this.#period = '';
				this.#refreshMenuItemsIcons(buttonMenu.getMenuItems(), this.#period);
				const event = new main_core_events.BaseEvent({
					data: {
						buttonMenu
					}
				});
				this.emit('onMenuItemDeselect', event);
				return;
			}
			this.#period = period;
			this.#refreshMenuItemsIcons(buttonMenu.getMenuItems(), this.#period);
			const event = new main_core_events.BaseEvent({
				data: {
					buttonMenu,
					text
				}
			});
			this.emit('onMenuItemSelect', event);
			ui_analytics.sendData({
				tool: 'tasks',
				category: 'task_operations',
				event: 'period_click_type',
				type: 'popup',
				c_section: 'tasks',
				c_sub_section: 'deadline_popup',
				c_element: item.dataset?.analytics
			});
		}
		#refreshMenuItemsIcons(items, period) {
			items.forEach(item => {
				const node = item.getLayout().item;
				if (!node) {
					return;
				}
				if (item.getId() === period) {
					main_core.Dom.addClass(node, this.#ACCEPTED_ITEM_CLASS);
					return;
				}
				main_core.Dom.removeClass(node, this.#ACCEPTED_ITEM_CLASS);
			});
		}
		#init() {
			this.#items = [{
				dataset: {
					id: 'tasks-deadline-notification-skip-day',
					analytics: 'today_button'
				},
				id: 'day',
				text: main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_DAY'),
				className: this.#ITEMS_CLASSES
			}, {
				dataset: {
					id: 'tasks-deadline-notification-skip-week',
					analytics: 'current_week_button'
				},
				id: 'week',
				text: main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_WEEK'),
				className: this.#ITEMS_CLASSES
			}, {
				dataset: {
					id: 'tasks-deadline-notification-skip-month',
					analytics: 'current_month_button'
				},
				id: 'month',
				text: main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_MONTH'),
				className: this.#ITEMS_CLASSES
			}, {
				dataset: {
					id: 'tasks-deadline-notification-skip-forever',
					analytics: 'never_button'
				},
				id: 'forever',
				text: main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_FOREVER'),
				className: this.#ITEMS_CLASSES
			}];
			this.#items.forEach(item => {
				item.onclick = this.#onMenuItemClick.bind(this, item);
			});
		}
	}

	class Footer extends main_core_events.EventEmitter {
		#EVENT_NAMESPACE = 'BX.Tasks.Deadline.Notification.Layout.Footer';
		#submitButton;
		#cancelButton;
		#skipButton;
		#skipButtonMenu;
		constructor(options = {}) {
			super();
			this.setEventNamespace(this.#EVENT_NAMESPACE);
			this.subscribeFromOptions(options.events);
			this.#init();
		}
		render() {
			return main_core.Tag.render`
			<div class="tasks-deadline-notification-form__footer">
				<div class="tasks-deadline-notification-form__footer_buttons-container">
					${this.#submitButton.render()}
					${this.#cancelButton.render()}
				</div>
				${this.#skipButton.render()}
			</div>
		`;
		}
		getSkipPeriod() {
			return this.#skipButtonMenu.getPeriod();
		}
		updateSkipButtonText(text) {
			const defaultText = main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_SKIP_BUTTON');
			const skipButtonText = text === '' ? defaultText : `${defaultText}, ${text}`;
			this.#skipButton.setText(skipButtonText);
		}
		enableButtons() {
			this.enableSubmitButton();
			this.enableCancelButton();
			this.enableSkipButton();
		}
		disableButtons() {
			this.disableSubmitButton();
			this.disableCancelButton();
			this.disableSkipButton();
		}
		enableSubmitButton() {
			this.#submitButton.setDisabled(false);
			this.#submitButton.setColor(ui_buttons.ButtonColor.PRIMARY);
		}
		disableSubmitButton() {
			this.#submitButton.setDisabled();
			this.#submitButton.setColor();
		}
		enableCancelButton() {
			this.#cancelButton.setDisabled(false);
		}
		disableCancelButton() {
			this.#cancelButton.setDisabled();
		}
		enableSkipButton() {
			this.#skipButton.setDisabled(false);
		}
		disableSkipButton() {
			this.#skipButton.setDisabled();
		}
		#init() {
			this.#submitButton = new ui_buttons.Button({
				dataset: {
					id: 'tasks-deadline-notification-submit'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_SAVE_BUTTON'),
				size: ui_buttons.ButtonSize.SMALL,
				state: ui_buttons.ButtonState.DISABLED,
				noCaps: true,
				round: true,
				onclick: this.#onSubmitButtonClick.bind(this)
			});
			this.#cancelButton = new ui_buttons.Button({
				dataset: {
					id: 'tasks-deadline-notification-cancel'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_CANCEL_BUTTON_MSGVER_1'),
				color: ui_buttons.ButtonColor.LINK,
				size: ui_buttons.ButtonSize.SMALL,
				state: ui_buttons.ButtonState.ACTIVE,
				noCaps: true,
				round: true,
				onclick: this.#onCancelButtonClick.bind(this)
			});
			this.#skipButtonMenu = new SkipButtonMenu({
				events: {
					onMenuItemSelect: this.#onSkipMenuItemSelect.bind(this),
					onMenuItemDeselect: this.#onSkipMenuItemDeselect.bind(this)
				}
			});
			this.#skipButton = new ui_buttons.Button({
				dataset: {
					id: 'tasks-deadline-notification-skip'
				},
				text: main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_SKIP_BUTTON'),
				className: 'tasks-deadline-notification-form__footer_skip-button',
				color: ui_buttons.ButtonColor.LINK,
				noCaps: true,
				dropdown: true,
				menu: this.#skipButtonMenu.getMenu(),
				onclick: this.#onSkipButtonClick.bind(this)
			});
			this.#skipButtonMenu.setButton(this.#skipButton);
		}
		#onSubmitButtonClick() {
			if (this.#submitButton.isDisabled()) {
				return;
			}
			this.emit('onSubmitButtonClick');
			ui_analytics.sendData({
				tool: 'tasks',
				category: 'task_operations',
				event: 'click_save_button',
				type: 'popup',
				c_section: 'tasks',
				c_sub_section: 'deadline_field',
				c_element: 'save_button'
			});
		}
		#onCancelButtonClick() {
			if (this.#cancelButton.isDisabled()) {
				return;
			}
			this.emit('onCancelButtonClick');
			ui_analytics.sendData({
				tool: 'tasks',
				category: 'task_operations',
				event: 'click_no_deadline_button',
				type: 'popup',
				c_section: 'tasks',
				c_sub_section: 'deadline_popup',
				c_element: 'no_deadline_button'
			});
		}
		#onSkipButtonClick() {
			ui_analytics.sendData({
				tool: 'tasks',
				category: 'task_operations',
				event: 'click_no_remind_button',
				type: 'popup',
				c_section: 'tasks',
				c_sub_section: 'deadline_popup',
				c_element: 'no_remind_button'
			});
		}
		#onSkipMenuItemSelect(event) {
			const {
				buttonMenu,
				text
			} = event.getData();
			buttonMenu.close();
			this.updateSkipButtonText(text.toLowerCase());
			this.emit('onSkipMenuItemSelect', event);
		}
		#onSkipMenuItemDeselect(event) {
			const {
				buttonMenu
			} = event.getData();
			buttonMenu.close();
			this.updateSkipButtonText('');
			this.emit('onSkipMenuItemDeselect', event);
		}
	}

	function removeNonNumeric(value) {
		return value.replaceAll(/\D/g, '');
	}
	function clamp(value, min, max) {
		let clampedValue = Math.max(value, min);
		clampedValue = Math.min(clampedValue, max);
		return clampedValue;
	}
	const MAX_INT = 2 ** 32 / 2 - 1;
	const SECONDS_IN_MONTH = 60 * 60 * 24 * 31;
	class DefaultDeadlineSelector {
		#intervalSelector;
		#input;
		constructor() {
			this.#input = main_core.Tag.render`
			<input class="ui-ctl-element" placeholder="0" data-id="tasks-deadline-notification-default-deadline">
		`;
			main_core.Event.bind(this.#input, 'input', this.#onInput.bind(this));
			this.#intervalSelector = new tasks_intervalSelector.IntervalSelector({
				showDropdownIcon: true
			});
		}
		render() {
			return main_core.Tag.render`
			<div hidden>
				<div class="tasks-deadline-notification-form__content_default-deadline-container">
					<div class="ui-ctl ui-ctl-w25">
						${this.#input}
					</div>
					<div
						class="tasks-deadline-notification-form__content_default-deadline-container_interval-selector"
						data-id="tasks-deadline-notification-interval-selector"
					>
						${this.#intervalSelector.render()}
					</div>
				</div>
			</div>
		`;
		}
		isExactDeadlineTime() {
			return ['minutes', 'hours'].includes(this.#intervalSelector.getInterval());
		}
		getDeadlineInSeconds() {
			return Number(this.#input.value) * this.#intervalSelector.getDuration();
		}
		focus() {
			this.#input.focus();
		}
		clear() {
			this.#input.value = '';
		}
		select(deadline) {
			this.#input.value = deadline;
		}
		#onInput() {
			let normalizedValue = removeNonNumeric(this.#input.value);
			normalizedValue = parseInt(normalizedValue, 10);
			const minValue = 1;
			const maxValue = Math.floor(MAX_INT / SECONDS_IN_MONTH);
			normalizedValue = clamp(normalizedValue, minValue, maxValue);
			this.#input.value = normalizedValue || '';
		}
	}

	class Notification extends main_core_events.EventEmitter {
		#EVENT_NAMESPACE = 'BX.Tasks.Deadline.Notification';
		#popup;
		#targetForm;
		#targetInput;
		#targetButton;
		#matchWorkTime;
		#layout;
		constructor(options) {
			super();
			this.setEventNamespace(this.#EVENT_NAMESPACE);
			this.#init(options);
		}
		show() {
			this.#popup.show();
			ui_analytics.sendData({
				tool: 'tasks',
				category: 'task_operations',
				event: 'deadline_popup_show',
				type: 'popup',
				c_section: 'tasks'
			});
		}
		close() {
			this.#popup.close();
		}
		#getPopupContent() {
			const form = main_core.Tag.render`
			<form class="tasks-deadline__notification-form">
				${this.#getTitleContainer()}
				${this.#getErrorsContainer()}
				${this.#getDeadlineContainer()}
				${this.#layout.footer.render()}
			</form>
		`;
			main_core.Event.bind(form, 'submit', e => {
				e.preventDefault();
			});
			return form;
		}
		#getTitleContainer() {
			return main_core.Tag.render`
			<div class="tasks-deadline-notification-form__title">
				<div class="tasks-deadline-notification-form__title_icon"></div>
				<div class="tasks-deadline-notification-form__title_text">
					${main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_TITLE')}
				</div>
			</div>
			<div class="tasks-deadline-notification-form__subtitle">
				${main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_DESCRIPTION')}
			</div>
		`;
		}
		#getErrorsContainer() {
			this.#layout.errorContainer = main_core.Tag.render`
			<div class="tasks-deadline-notification-form__errors" hidden>
				<div class="ui-alert ui-alert-danger">
					<span class="ui-alert-message">${main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_ERROR_MESSAGE')}</span>
				</div>
			</div>
		`;
			return this.#layout.errorContainer;
		}
		#getDeadlineContainer() {
			this.#layout.defaultDeadlineChecker = new ui_formElements_view.Checker({
				id: 'tasks-deadline-notification-default-deadline-checker',
				inputName: 'defaultDeadlineChecker',
				checked: false,
				title: this.#getDefaultDeadlineCheckerTitle(),
				hideSeparator: true,
				size: 'extra-small'
			});
			const defaultDeadlineContainer = this.#layout.defaultDeadlineSelector.render();
			main_core_events.EventEmitter.subscribe(this.#layout.defaultDeadlineChecker, 'change', this.#onDefaultDeadlineCheckerChange.bind(this, defaultDeadlineContainer));
			return main_core.Tag.render`
			<div class="tasks-deadline-notification-form__content">
				<div class="tasks-deadline-notification-form__content_title">
					${main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_DEADLINE_TITLE')}
				</div>
				${this.#layout.deadlineSelector.render()}
				<div class="tasks-deadline-notification-form__content_default-deadline-checker">
					${this.#layout.defaultDeadlineChecker.render()}
				</div>
				${defaultDeadlineContainer}
			</div>
		`;
		}
		#getDefaultDeadlineCheckerTitle() {
			return `
			<div>
				${main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_DEFAULT_DEADLINE_CHECKER')}
			</div>
			<span
				data-id="defaultDeadlineHint"
				class="ui-hint"
				data-hint="${main_core.Loc.getMessage('TASKS_DEADLINE_NOTIFICATION_DEFAULT_DEADLINE_HINT')}"
				data-hint-no-icon
			>
				<span class="ui-hint-icon">
				</span>
			</span>
		`;
		}
		#saveTargetButtonStateInForm() {
			if (!this.#targetButton || !this.#targetButton.name || !this.#targetButton.value) {
				return;
			}
			const targetButtonInput = main_core.Tag.render`
			<input name="${this.#targetButton.name}" value="${this.#targetButton.value}" hidden>
		`;
			main_core.Dom.append(targetButtonInput, this.#targetForm);
		}
		#onSubmitButtonClick() {
			this.#layout.footer.disableButtons();
			const defaultDeadline = this.#layout.defaultDeadlineSelector.getDeadlineInSeconds();
			const isExactDeadlineTime = this.#layout.defaultDeadlineSelector.isExactDeadlineTime();
			const skipPeriod = this.#layout.footer.getSkipPeriod();
			this.#setDefaultDeadline(defaultDeadline, isExactDeadlineTime).then(() => {
				return this.#setSkipNotificationPeriod(skipPeriod);
			}).then(() => {
				this.#setTargetInputValue();
				this.#submit();
			}).catch(() => this.#onPromiseError());
		}
		#onCancelButtonClick() {
			this.#layout.footer.disableButtons();
			this.#submit();
		}
		#onSkipMenuItemSelect() {
			if (this.#layout.deadlineSelector.getInputValue()) {
				return;
			}
			this.#layout.footer.disableButtons();
			const skipPeriod = this.#layout.footer.getSkipPeriod();
			this.#setSkipNotificationPeriod(skipPeriod).then(() => {
				this.#submit();
			}).catch(() => this.#onPromiseError());
		}
		#onDefaultDeadlineCheckerChange(defaultDeadlineContainer, event) {
			const checked = event.getData();
			if (!checked) {
				main_core.Dom.hide(defaultDeadlineContainer);
				return;
			}
			main_core.Dom.show(defaultDeadlineContainer);
			if (!this.#layout.deadlineSelector.getInputValue()) {
				this.#layout.defaultDeadlineSelector.clear();
				this.#layout.defaultDeadlineSelector.focus();
				return;
			}
			const now = this.#layout.deadlineSelector.getToday();
			const selectedDeadline = this.#layout.deadlineSelector.getDeadline();
			const offsetInSeconds = (selectedDeadline - now) / 1000;
			const defaultDeadline = tasks_dateRounder.DateRounder.roundToDays(offsetInSeconds);
			if (defaultDeadline <= 0) {
				this.#layout.defaultDeadlineSelector.clear();
				this.#layout.defaultDeadlineSelector.focus();
				return;
			}
			this.#layout.defaultDeadlineSelector.select(defaultDeadline);
		}
		#onDeadlineSelect() {
			const selectedDate = this.#layout.deadlineSelector.getDeadline();
			if (selectedDate === null) {
				this.#layout.footer.disableSubmitButton();
				return;
			}
			this.#layout.footer.enableSubmitButton();
		}
		#onPopupFirstShow(event) {
			BX.UI.Hint.init(event.getTarget().contentContainer);
		}
		#onPromiseError() {
			this.#layout.footer.enableCancelButton();
			this.#layout.footer.enableSkipButton();
			const selectedDate = this.#layout.deadlineSelector.getDeadline();
			if (!main_core.Type.isNull(selectedDate)) {
				this.#layout.footer.enableSubmitButton();
			}
			main_core.Dom.show(this.#layout.errorContainer);
		}
		#setDefaultDeadline(deadline, isExactDeadlineTime) {
			if (!this.#layout.defaultDeadlineChecker.isChecked()) {
				return new Promise(resolve => {
					resolve();
				});
			}
			const deadlineData = {
				default: deadline,
				isExactTime: isExactDeadlineTime ? 'Y' : 'N'
			};
			return main_core.ajax.runAction('tasks.deadline.Deadline.setDefault', {
				data: {
					deadlineData
				}
			});
		}
		#setSkipNotificationPeriod(skipPeriod) {
			if (!this.#layout.footer.getSkipPeriod()) {
				return new Promise(resolve => {
					resolve();
				});
			}
			const notificationData = {
				skipPeriod
			};
			return main_core.ajax.runAction('tasks.deadline.Notification.skip', {
				data: {
					notificationData
				}
			});
		}
		#submit() {
			this.close();
			this.#saveTargetButtonStateInForm();
			this.emit('onBeforeSubmit');
			this.#targetForm.submit();
		}
		#setTargetInputValue() {
			const dateFormat = main_date.DateTimeFormat.getFormat('FORMAT_DATETIME');
			this.#targetInput.value = this.#layout.deadlineSelector.getFormattedDeadline(dateFormat);
		}
		#init(options) {
			this.#targetForm = options.targetForm;
			this.#targetInput = options.targetInput;
			this.#targetButton = options.targetButton;
			this.#matchWorkTime = options.matchWorkTime;
			this.#layout = {};
			this.#layout.deadlineSelector = new DeadlineSelector({
				matchWorkTime: this.#matchWorkTime,
				events: {
					onSelect: this.#onDeadlineSelect.bind(this)
				}
			});
			this.#layout.defaultDeadlineSelector = new DefaultDeadlineSelector();
			this.#layout.footer = new Footer({
				events: {
					onSubmitButtonClick: this.#onSubmitButtonClick.bind(this),
					onCancelButtonClick: this.#onCancelButtonClick.bind(this),
					onSkipMenuItemSelect: this.#onSkipMenuItemSelect.bind(this)
				}
			});
			this.#popup = new main_popup.Popup({
				id: 'deadline-notification',
				content: this.#getPopupContent(),
				className: 'tasks__deadline-notification-popup',
				overlay: {
					opacity: 40
				},
				width: 600,
				autoHide: false,
				closeIcon: false,
				events: {
					onFirstShow: this.#onPopupFirstShow.bind(this)
				}
			});
		}
	}

	exports.Notification = Notification;

})(this.BX.Tasks.Deadline = this.BX.Tasks.Deadline || {}, BX, BX.Event, BX.Main, BX.Main, BX.UI.FormElements, BX.Tasks, BX.UI.DatePicker, BX.UI, BX.UI.Analytics, BX.Tasks);
//# sourceMappingURL=notification.bundle.js.map
