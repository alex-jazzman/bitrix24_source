/* eslint-disable */
this.BX = this.BX || {};
(function (exports, calendar_util, calendar_controls, main_core, ui_entitySelector, main_core_events, ui_infoHelper, ui_messagecard) {
	'use strict';

	class SettingsInterface {
		sliderId = 'calendar:settings-slider';
		name = 'SettingsInterface';
		SLIDER_WIDTH = 500;
		SLIDER_DURATION = 80;
		DOM = {};
		HELP_DESK_CODE = 7_218_351;
		HELP_DESK_CODE_LOCATION = 14_326_208;
		constructor(options) {
			this.calendarContext = options.calendarContext;
			this.showPersonalSettings = options.showPersonalSettings;
			this.showGeneralSettings = options.showGeneralSettings;
			this.showAccessControl = options.showAccessControl !== false && main_core.Type.isObjectLike(this.calendarContext.util.config.TYPE_ACCESS);
			this.isExtranet = options.isExtranet;
			this.settings = options.settings;
			this.BX = calendar_util.Util.getBX();
			this.hideMessageBinded = this.hideMessage.bind(this);
		}
		show() {
			this.BX.SidePanel.Instance.open(this.sliderId, {
				contentCallback: this.createContent.bind(this),
				width: this.SLIDER_WIDTH,
				animationDuration: this.SLIDER_DURATION,
				events: {
					onCloseByEsc: this.escHide.bind(this),
					onClose: this.hide.bind(this),
					onCloseComplete: this.destroy.bind(this),
					onLoad: this.onLoadSlider.bind(this)
				}
			});
		}
		escHide(event) {
			if (event && event.getSlider && event.getSlider().getUrl() === this.sliderId && this.denyClose) {
				event.denyAction();
			}
		}
		close() {
			this.isOpenedState = false;
			BX.SidePanel.Instance.close();
		}
		isOpened() {
			return this.isOpenedState;
		}
		hide(event) {
			if (event && event.getSlider && event.getSlider().getUrl() === this.sliderId) {
				BX.removeCustomEvent('SidePanel.Slider:onClose', BX.proxy(this.hide, this));
			}
		}
		denySliderClose() {
			this.denyClose = true;
		}
		allowSliderClose() {
			this.denyClose = false;
		}
		destroy(event) {
			if (event && event.getSlider && event.getSlider().getUrl() === this.sliderId) {
				BX.SidePanel.Instance.destroy(this.sliderId);
				delete this.DOM.sectionListWrap;
			}
		}
		createContent(slider) {
			return new Promise(resolve => {
				top.BX.ajax.runAction('calendar.api.calendarajax.getSettingsSlider', {
					data: {
						showPersonalSettings: this.showPersonalSettings ? 'Y' : 'N',
						showGeneralSettings: this.showGeneralSettings ? 'Y' : 'N',
						showAccessControl: this.showAccessControl ? 'Y' : 'N',
						uid: this.uid
					}
				}).then(response => {
					slider.getData().set('sliderContent', response.data.html);
					const params = response.data.additionalParams;
					this.mailboxList = params.mailboxList;
					this.uid = params.uid;
					resolve(response.data.html);
				});
			});
		}
		onLoadSlider(event) {
			const slider = event.getSlider();
			this.DOM.content = slider.layout.content;
			this.sliderId = slider.getUrl();

			// Used to execute javasctipt and attach CSS from ajax responce
			BX.html(slider.layout.content, slider.getData().get('sliderContent'));
			this.initControls();
			this.setControlsValue();
		}
		initControls() {
			this.DOM.buttonsWrap = this.DOM.content.querySelector('.calendar-form-buttons-fixed');
			BX.ZIndexManager.register(this.DOM.buttonsWrap);
			this.DOM.saveBtn = this.DOM.buttonsWrap.querySelector('[data-role="save_btn"]');
			this.DOM.closeBtn = this.DOM.buttonsWrap.querySelector('[data-role="close_btn"]');
			main_core.Event.bind(this.DOM.saveBtn, 'click', this.save.bind(this));
			main_core.Event.bind(this.DOM.closeBtn, 'click', this.close.bind(this));
			if (this.showPersonalSettings) {
				this.DOM.denyBusyInvitation = this.DOM.content.querySelector('[data-role="deny_busy_invitation"]');
				this.DOM.showWeekNumbers = this.DOM.content.querySelector('[data-role="show_week_numbers"]');
				this.DOM.showDeclined = this.DOM.content.querySelector('[data-role="show_declined"]');
				this.DOM.showTasks = this.DOM.content.querySelector('[data-role="show_tasks"]');
				this.DOM.showCompletedTasks = this.DOM.content.querySelector('[data-role="show_completed_tasks"]');
				this.DOM.timezoneSelect = this.DOM.content.querySelector('[data-role="set_tz_sel"]');
				if (!this.isExtranet) {
					this.DOM.meetSectionSelect = this.DOM.content.querySelector('[data-role="meet_section"]');
					this.DOM.crmSelect = this.DOM.content.querySelector('[data-role="crm_section"]');
					this.DOM.syncTasks = this.DOM.content.querySelector('[data-role="sync_tasks"]');
					this.DOM.sendFromEmailSelect = this.DOM.content.querySelector('[data-role="send_from_email"]');
				}
			}

			// General settings
			if (this.showGeneralSettings) {
				this.DOM.workTimeStart = this.DOM.content.querySelector('[data-role="work_time_start"]');
				this.DOM.workTimeEnd = this.DOM.content.querySelector('[data-role="work_time_end"]');
				this.DOM.weekHolidays = this.DOM.content.querySelector('[data-role="week_holidays"]');
				this.DOM.yearHolidays = this.DOM.content.querySelector('[data-role="year_holidays"]');
				this.DOM.yearWorkdays = this.DOM.content.querySelector('[data-role="year_workdays"]');
			}
			if (this.showAccessControl) {
				this.DOM.accessMessageWrap = this.DOM.content.querySelector('[data-role="type-access-message-card"]');
				this.DOM.accessOuterWrap = this.DOM.content.querySelector('[data-role="type-access-values-cont"]');
				this.DOM.accessHelpIcon = this.DOM.content.querySelector('.calendar-settings-access-hint');
				if (main_core.Type.isElementNode(this.DOM.accessHelpIcon) && this.calendarContext.util.type === 'location') {
					this.initMessageControl();
				} else if (main_core.Type.isElementNode(this.DOM.accessHelpIcon)) {
					this.DOM.accessHelpIcon.remove();
					main_core.Dom.replace(this.DOM.accessMessageWrap, main_core.Tag.render`
					<span onclick="${() => this.openHelpDesk(this.HELP_DESK_CODE)}" class="ui-hint" title="${main_core.Loc.getMessage('EC_CALENDAR_HOW_DOES_IT_WORK')}">
						<span class="ui-hint-icon"></span>
					</span>
				`);
				}
				if (main_core.Type.isElementNode(this.DOM.accessOuterWrap)) {
					this.initAccessController();
				}
			}
			this.handleRestrictions();
			this.handleHints();
		}
		handleRestrictions() {
			if (this.BX.Type.isElementNode(this.DOM.syncTasks) && this.isSettingLocked(this.DOM.syncTasks)) {
				this.DOM.syncTasks.disabled = true;
				this.lockSetting(this.DOM.syncTasks);
			}
			if (this.BX.Type.isElementNode(this.DOM.sendFromEmailSelect)) {
				this.emailSelectorControl = new calendar_controls.EmailSelectorControl({
					selectNode: this.DOM.sendFromEmailSelect,
					allowAddNewEmail: true,
					mailboxList: this.mailboxList
				});
				this.emailSelectorControl.setValue(this.calendarContext.util.getUserOption('sendFromEmail'));
				this.DOM.emailWrap = this.DOM.content.querySelector('.calendar-settings-email-wrap');
				if (BX.Calendar.Util.isEventWithEmailGuestAllowed()) {
					BX.Dom.removeClass(this.DOM.emailWrap, 'lock');
					this.DOM.sendFromEmailSelect.disabled = false;
				} else {
					BX.Dom.addClass(this.DOM.emailWrap, 'lock');
					this.DOM.sendFromEmailSelect.disabled = true;
					main_core.Event.bind(this.DOM.sendFromEmailSelect.parentNode, 'click', () => {
						ui_infoHelper.FeaturePromotersRegistry.getPromoter({
							featureId: 'calendar_events_with_email_guests'
						}).show();
					});
				}
			}
		}
		handleHints() {
			this.DOM.emailHelpIcon = this.DOM.content.querySelector('.calendar-settings-question-email');
			if (this.DOM.emailHelpIcon && BX.Helper) {
				main_core.Event.bind(this.DOM.emailHelpIcon, 'click', () => {
					BX.Helper.show('redirect=detail&code=12070142');
				});
				calendar_util.Util.initHintNode(this.DOM.emailHelpIcon);
			}
			this.DOM.timezoneHelpIcon = this.DOM.content.querySelector('.calendar-settings-question-timezone');
			if (this.DOM.timezoneHelpIcon) {
				calendar_util.Util.initHintNode(this.DOM.timezoneHelpIcon);
			}
		}
		isSettingLocked(node) {
			return this.BX.Type.isElementNode(node.closest('.calendar-field-block.--locked'));
		}
		getSettingLockCode(node) {
			return 'lockCode' in node.dataset ? node.dataset.lockCode : '';
		}
		lockSetting(node) {
			const lockBindElement = node.closest('.calendar-field-block.--locked');
			this.getSettingLockCode(node);
			main_core.Event.bind(lockBindElement, 'click', () => this.showLock(this.getSettingLockCode(node)));
		}
		showLock(featureId, bindElement = null) {
			ui_infoHelper.FeaturePromotersRegistry.getPromoter({
				featureId,
				bindElement
			}).show();
		}
		initMessageControl() {
			const moreMessageButton = main_core.Tag.render`
			<a class="ui-btn ui-btn-primary">${main_core.Loc.getMessage('EC_LOCATION_SETTINGS_MORE_INFO')}</a>
		`;
			main_core.Event.bind(moreMessageButton, 'click', () => this.openHelpDesk(this.HELP_DESK_CODE_LOCATION));
			const header = '';
			const description = main_core.Loc.getMessage('EC_LOCATION_SETTINGS_MESSAGE_DESCRIPTION');
			this.message = new ui_messagecard.MessageCard({
				id: 'locationSettingsInfo',
				header,
				description,
				angle: false,
				hidden: true,
				actionElements: [moreMessageButton]
			});
			main_core_events.EventEmitter.subscribe(this.message, 'onClose', this.hideMessageBinded);
			main_core.Event.bind(this.DOM.accessHelpIcon, 'click', () => {
				this.onClickHint();
			});
			if (this.DOM.accessMessageWrap) {
				this.DOM.accessMessageWrap.appendChild(this.message.getLayout());
				if (!this.calendarContext.util.config.hideSettingsHintLocation) {
					this.showMessage();
				}
			}
		}
		onClickHint() {
			if (!this.message) {
				return;
			}
			if (this.message.isShown()) {
				this.hideMessage();
			} else {
				this.showMessage();
			}
		}
		setControlsValue() {
			// Set personal user settings
			if (this.showPersonalSettings && !this.isExtranet) {
				this.DOM.meetSectionSelect.options.length = 0;
				const sections = this.calendarContext.sectionManager.getSectionListForEdit();
				let crmSection = parseInt(this.calendarContext.util.getUserOption('crmSection'), 10);
				let meetSection = parseInt(this.calendarContext.util.getUserOption('meetSection'), 10);
				let section;
				let selected;
				for (let i = 0; i < sections.length; i++) {
					section = sections[i];
					if (section.belongsToOwner()) {
						if (!meetSection) {
							meetSection = section.id;
						}
						selected = meetSection === parseInt(section.id, 10);
						this.DOM.meetSectionSelect.options.add(new Option(section.name, section.id, selected, selected));
						if (!crmSection) {
							crmSection = section.id;
						}
						selected = crmSection === parseInt(section.id, 10);
						this.DOM.crmSelect.options.add(new Option(section.name, section.id, selected, selected));
					}
				}
			}
			if (this.DOM.showDeclined) {
				this.DOM.showDeclined.checked = this.calendarContext.util.getUserOption('showDeclined');
			}
			const showTasks = this.calendarContext.util.getUserOption('showTasks') === 'Y';
			if (this.DOM.showTasks) {
				this.DOM.showTasks.checked = showTasks;
				main_core.Event.bind(this.DOM.showTasks, 'click', () => {
					if (this.DOM.showCompletedTasks) {
						this.DOM.showCompletedTasks.disabled = !this.DOM.showTasks.checked;
						this.DOM.showCompletedTasks.checked = this.DOM.showCompletedTasks.checked && this.DOM.showTasks.checked;
					}
					if (this.DOM.syncTasks) {
						if (this.isSettingLocked(this.DOM.syncTasks)) {
							this.DOM.syncTasks.checked = false;
							this.DOM.syncTasks.disabled = true;
						} else {
							this.DOM.syncTasks.disabled = !this.DOM.showTasks.checked;
							this.DOM.syncTasks.checked = this.DOM.syncTasks.checked && this.DOM.showTasks.checked;
						}
					}
				});
			}
			if (this.DOM.showCompletedTasks) {
				this.DOM.showCompletedTasks.checked = this.calendarContext.util.getUserOption('showCompletedTasks') === 'Y' && this.DOM.showTasks.checked;
				this.DOM.showCompletedTasks.disabled = !showTasks;
			}
			if (this.DOM.syncTasks) {
				if (this.isSettingLocked(this.DOM.syncTasks)) {
					this.DOM.syncTasks.checked = false;
					this.DOM.syncTasks.disabled = true;
				} else {
					this.DOM.syncTasks.checked = this.calendarContext.util.getUserOption('syncTasks') === 'Y' && this.DOM.showTasks.checked;
					this.DOM.syncTasks.disabled = !showTasks;
				}
			}
			if (this.DOM.denyBusyInvitation) {
				this.DOM.denyBusyInvitation.checked = this.calendarContext.util.getUserOption('denyBusyInvitation');
			}
			if (this.DOM.showWeekNumbers) {
				this.DOM.showWeekNumbers.checked = this.calendarContext.util.showWeekNumber();
			}
			if (this.DOM.timezoneSelect) {
				this.DOM.timezoneSelect.value = this.calendarContext.util.getUserOption('timezoneName') || '';
			}
			if (this.showGeneralSettings) {
				// Set access for calendar type
				this.DOM.workTimeStart.value = this.settings.work_time_start;
				this.DOM.workTimeEnd.value = this.settings.work_time_end;
				if (this.DOM.weekHolidays) {
					for (let i = 0; i < this.DOM.weekHolidays.options.length; i++) {
						// eslint-disable-next-line max-len
						this.DOM.weekHolidays.options[i].selected = this.settings.week_holidays.includes(this.DOM.weekHolidays.options[i].value);
					}
				}
				this.DOM.yearHolidays.value = this.settings.year_holidays;
				this.DOM.yearWorkdays.value = this.settings.year_workdays;
			}

			// Access
			if (this.showAccessControl && main_core.Type.isElementNode(this.DOM.accessOuterWrap)) {
				const typeAccess = this.calendarContext.util.config.TYPE_ACCESS;
				for (const code in typeAccess) {
					if (typeAccess.hasOwnProperty(code)) {
						this.insertAccessRow(this.calendarContext.util.getAccessName(code), code, typeAccess[code]);
					}
				}
			}
		}
		save() {
			const userSettings = this.calendarContext.util.config.userSettings;

			// Save user settings
			if (this.DOM.showDeclined) {
				userSettings.showDeclined = this.DOM.showDeclined.checked ? 1 : 0;
			}
			if (this.DOM.showWeekNumbers) {
				userSettings.showWeekNumbers = this.DOM.showWeekNumbers.checked ? 'Y' : 'N';
			}
			if (this.DOM.showTasks) {
				userSettings.showTasks = this.DOM.showTasks.checked ? 'Y' : 'N';
			}
			if (this.DOM.syncTasks) {
				if (this.isSettingLocked(this.DOM.syncTasks)) {
					userSettings.syncTasks = 'N';
				} else {
					userSettings.syncTasks = this.DOM.syncTasks.checked ? 'Y' : 'N';
				}
			}
			if (this.DOM.showCompletedTasks) {
				userSettings.showCompletedTasks = this.DOM.showCompletedTasks.checked ? 'Y' : 'N';
			}
			if (this.DOM.meetSectionSelect) {
				userSettings.meetSection = this.DOM.meetSectionSelect.value;
			}
			if (this.DOM.crmSelect) {
				userSettings.crmSection = this.DOM.crmSelect.value;
			}
			if (this.DOM.denyBusyInvitation) {
				userSettings.denyBusyInvitation = this.DOM.denyBusyInvitation.checked ? 1 : 0;
			}
			if (this.emailSelectorControl) {
				userSettings.sendFromEmail = this.emailSelectorControl.getValue();
			}
			const data = {
				type: this.calendarContext.util.config.type,
				user_settings: userSettings
			};
			if (this.showGeneralSettings && this.DOM.workTimeStart) {
				data.settings = {
					work_time_start: this.DOM.workTimeStart.value,
					work_time_end: this.DOM.workTimeEnd.value,
					week_holidays: [],
					year_holidays: this.DOM.yearHolidays.value,
					year_workdays: this.DOM.yearWorkdays.value
				};
				for (let i = 0; i < this.DOM.weekHolidays.options.length; i++) {
					if (this.DOM.weekHolidays.options[i].selected) {
						data.settings.week_holidays.push(this.DOM.weekHolidays.options[i].value);
					}
				}
			}
			if (this.showAccessControl) {
				data.type_access = this.access;
			}

			// eslint-disable-next-line promise/catch-or-return
			BX.ajax.runAction('calendar.api.calendarajax.saveSettings', {
				data
			}).then(() => {
				BX.reload();
			});
			this.close();
		}
		initAccessController() {
			this.DOM.accessWrap = this.DOM.accessOuterWrap.appendChild(main_core.Tag.render`
				<div class="calendar-list-slider-access-container shown">
					<div class="calendar-list-slider-access-inner-wrap">
						${this.DOM.accessTable = main_core.Tag.render`
							<table class="calendar-section-slider-access-table" />
						`}
					</div>
					<div class="calendar-list-slider-new-calendar-options-container">
						${this.DOM.accessButton = main_core.Tag.render`
							<span class="calendar-list-slider-new-calendar-option-add">
								${main_core.Loc.getMessage('EC_SEC_SLIDER_ACCESS_ADD')}
							</span>
						`}
					</div>
				</div>
			`);
			this.access = {};
			this.accessControls = {};
			this.accessTasks = this.calendarContext?.util?.getTypeAccessTasks();
			if (this.calendarContext?.util?.config?.accessNames) {
				calendar_util.Util.setAccessNames(this.calendarContext.util.config.accessNames);
			}
			main_core.Event.bind(this.DOM.accessButton, 'click', () => {
				const entities = [{
					id: 'user'
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
				if (calendar_util.Util.isProjectFeatureEnabled()) {
					entities.push({
						id: 'project'
					});
				}
				this.entitySelectorDialog = new ui_entitySelector.Dialog({
					targetNode: this.DOM.accessButton,
					context: 'CALENDAR',
					preselectedItems: [],
					enableSearch: true,
					events: {
						'Item:onSelect': this.handleEntitySelectorChanges.bind(this),
						'Item:onDeselect': this.handleEntitySelectorChanges.bind(this)
					},
					popupOptions: {
						targetContainer: document.body
					},
					entities
				});
				this.entitySelectorDialog.show();
				this.entitySelectorDialog.subscribe('onHide', this.allowSliderClose.bind(this));
				this.denySliderClose();
			});
			main_core.Event.bind(this.DOM.accessWrap, 'click', e => {
				const target = calendar_util.Util.findTargetNode(e.target || e.srcElement, this.DOM.outerWrap);
				if (main_core.Type.isElementNode(target)) {
					if (target.getAttribute('data-bx-calendar-access-selector') !== null) {
						// show selector
						const code = target.getAttribute('data-bx-calendar-access-selector');
						if (this.accessControls[code]) {
							this.showAccessSelectorPopup({
								node: this.accessControls[code].removeIcon,
								setValueCallback: value => {
									if (this.accessTasks[value] && this.accessControls[code]) {
										this.accessControls[code].valueNode.innerHTML = main_core.Text.encode(this.accessTasks[value].title);
										this.access[code] = value;
									}
								}
							});
						}
					} else if (target.getAttribute('data-bx-calendar-access-remove') !== null) {
						const code = target.getAttribute('data-bx-calendar-access-remove');
						if (this.accessControls[code]) {
							main_core.Dom.remove(this.accessControls[code].rowNode);
							this.accessControls[code] = null;
							delete this.access[code];
						}
					}
				}
			});
		}
		handleEntitySelectorChanges() {
			const entityList = this.entitySelectorDialog.getSelectedItems();
			this.entitySelectorDialog.hide();
			if (main_core.Type.isArray(entityList)) {
				entityList.forEach(entity => {
					const title = entity.title.text;
					const code = calendar_util.Util.convertEntityToAccessCode(entity);
					calendar_util.Util.setAccessName(code, title);
					this.insertAccessRow(title, code);
				});
			}
			main_core.Runtime.debounce(() => {
				this.entitySelectorDialog.destroy();
			}, 400)();
		}
		insertAccessRow(title, code, value) {
			if (!this.accessControls[code]) {
				if (value === undefined) {
					for (const taskId in this.accessTasks) {
						if (this.accessTasks.hasOwnProperty(taskId) && this.accessTasks[taskId].name === 'calendar_type_edit') {
							value = taskId;
							break;
						}
					}
				}
				const rowNode = main_core.Dom.adjust(this.DOM.accessTable.insertRow(-1), {
					props: {
						className: 'calendar-section-slider-access-table-row'
					}
				});
				const titleNode = main_core.Dom.adjust(rowNode.insertCell(-1), {
					props: {
						className: 'calendar-section-slider-access-table-cell'
					},
					html: `<span class="calendar-section-slider-access-title" title="${main_core.Text.encode(title)}">${main_core.Text.encode(title)}:</span>`
				});
				const valueCell = main_core.Dom.adjust(rowNode.insertCell(-1), {
					props: {
						className: 'calendar-section-slider-access-table-cell'
					},
					attrs: {
						'data-bx-calendar-access-selector': code
					}
				});
				const selectNode = valueCell.appendChild(main_core.Dom.create('SPAN', {
					props: {
						className: 'calendar-section-slider-access-container'
					}
				}));
				const valueNode = selectNode.appendChild(main_core.Dom.create('SPAN', {
					text: this.accessTasks[value] ? this.accessTasks[value].title : '',
					props: {
						className: 'calendar-section-slider-access-value'
					}
				}));
				const removeIcon = selectNode.appendChild(main_core.Dom.create('SPAN', {
					props: {
						className: 'calendar-section-slider-access-remove'
					},
					attrs: {
						'data-bx-calendar-access-remove': code
					}
				}));
				this.access[code] = value;
				this.accessControls[code] = {
					rowNode,
					titleNode,
					valueNode,
					removeIcon
				};
			}
		}
		checkAccessTableHeight() {
			if (this.checkTableTimeout) {
				this.checkTableTimeout = clearTimeout(this.checkTableTimeout);
			}
			this.checkTableTimeout = setTimeout(() => {
				if (main_core.Dom.hasClass(this.DOM.accessWrap, 'shown')) {
					if (this.DOM.accessWrap.offsetHeight - this.DOM.accessTable.offsetHeight < 36) {
						this.DOM.accessWrap.style.maxHeight = `${parseInt(this.DOM.accessTable.offsetHeight) + 100}px`;
					}
				} else {
					this.DOM.accessWrap.style.maxHeight = '';
				}
			}, 300);
		}
		showAccessSelectorPopup(params) {
			if (this.accessPopupMenu && this.accessPopupMenu.popupWindow && this.accessPopupMenu.popupWindow.getContentContainer()?.offsetWidth > 0 && this.accessPopupMenu.popupWindow.isShown()) {
				return this.accessPopupMenu.close();
			}
			this.accessPopupMenu?.destroy();
			const _this = this;
			const menuItems = [];
			for (const taskId in this.accessTasks) {
				if (this.accessTasks.hasOwnProperty(taskId)) {
					menuItems.push({
						text: this.accessTasks[taskId].title,
						onclick: function (value) {
							return function () {
								params.setValueCallback(value);
								_this.accessPopupMenu.close();
							};
						}(taskId)
					});
				}
			}
			this.accessPopupMenu = this.BX.PopupMenu.create(`section-access-popup${calendar_util.Util.randomInt()}`, params.node, menuItems, {
				closeByEsc: true,
				autoHide: true,
				offsetTop: -5,
				offsetLeft: 0,
				angle: true,
				cacheable: false
			});
			this.accessPopupMenu.show();
		}
		openHelpDesk(helpDeskCode) {
			if (top.BX.Helper) {
				top.BX.Helper.show(`redirect=detail&code=${helpDeskCode}`);
			}
		}
		showMessage() {
			if (this.message) {
				this.message.show();
				this.DOM.accessMessageWrap.style.maxHeight = `${300}px`;
				main_core.Dom.addClass(this.DOM.accessHelpIcon, 'calendar-settings-message-arrow-target');
			}
		}
		hideMessage() {
			if (this.message) {
				main_core.Dom.removeClass(this.DOM.accessHelpIcon, 'calendar-settings-message-arrow-target');
				this.message.hide();
				this.DOM.accessMessageWrap.style.maxHeight = 0;
				if (!this.calendarContext.util.config.hideSettingsHintLocation) {
					BX.ajax.runAction('calendar.api.locationajax.hideSettingsHintLocation', {
						data: {
							value: true
						}
					}).then(() => {});
				}
			}
		}
	}

	exports.SettingsInterface = SettingsInterface;

})(this.BX.Calendar = this.BX.Calendar || {}, BX.Calendar, BX.Calendar.Controls, BX, BX.UI.EntitySelector, BX.Event, BX.UI, BX.UI);
//# sourceMappingURL=settingsinterface.bundle.js.map
