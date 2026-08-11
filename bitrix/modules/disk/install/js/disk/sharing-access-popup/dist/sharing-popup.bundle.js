/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, ui_system_dialog, ui_vue3, ui_vue3_components_button, ui_iconSet_api_vue, ui_notificationPanel, ui_iconSet_api_core, ui_iconSet_main, ui_system_input_vue, ui_system_menu_vue, ui_datePicker, ui_system_typography_vue, main_date, ui_switcher, ui_entitySelector, main_loader) {
	'use strict';

	const SharingAccessWrapper = {
		name: 'SharingAccessWrapper',
		template: `
		<div class="disk-sharing-access-popup__wrapper">
			<slot></slot>
		</div>
	`
	};

	// @vue/component
	const SharingAccessButtons = {
		name: 'SharingAccessButtons',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			isPublic: {
				type: Boolean,
				required: true
			}
		},
		emits: ['update:isPublic'],
		computed: {
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			Outline: () => ui_iconSet_api_vue.Outline
		},
		methods: {
			setPublic(value) {
				this.$emit('update:isPublic', value);
			}
		},
		template: `
		<div class="disk-sharing-access-popup__buttons">
			<UiButton
				text="${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_ACCESSIBILITY_BUTTON')}"
				:leftIcon="Outline.GROUP"
				:size="ButtonSize.MEDIUM"
				:style="!isPublic ? AirButtonStyle.SELECTION : AirButtonStyle.OUTLINE"
				:remove-right-corners="true"
				:wide="true"
				@click="setPublic(false)"
			/>
			<UiButton
				text="${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_ACCESSIBILITY_BUTTON')}"
				:leftIcon="Outline.EARTH"
				:size="ButtonSize.MEDIUM"
				:style="isPublic ? AirButtonStyle.SELECTION : AirButtonStyle.OUTLINE"
				:remove-left-corners="true"
				:wide="true"
				@click="setPublic(true)"
			/>
		</div>
	`
	};

	const AUTO_HIDE_DELAY = 5000;
	let activePanel = null;
	let autoHideTimeout = null;
	function clearAutoHide() {
		if (autoHideTimeout) {
			clearTimeout(autoHideTimeout);
			autoHideTimeout = null;
		}
	}
	function hideActivePanel() {
		clearAutoHide();
		if (activePanel) {
			activePanel.hide();
			activePanel = null;
		}
	}
	function notify(messageKey) {
		hideActivePanel();
		const panel = new ui_notificationPanel.NotificationPanel({
			content: main_core.Loc.getMessage(messageKey),
			backgroundColor: 'var(--ui-color-accent-main-alert)',
			textColor: 'var(--ui-color-base-white-fixed)',
			crossColor: 'var(--ui-color-base-white-fixed)',
			leftIcon: new ui_iconSet_api_core.Icon({
				icon: ui_iconSet_api_core.Main.WARNING_ALARM,
				color: 'var(--ui-color-base-white-fixed)'
			}),
			events: {
				onHide: () => {
					if (activePanel === panel) {
						activePanel = null;
						clearAutoHide();
					}
				}
			}
		});
		activePanel = panel;
		panel.show();
		autoHideTimeout = setTimeout(() => {
			if (activePanel === panel) {
				panel.hide();
			}
		}, AUTO_HIDE_DELAY);
	}

	const ACCESS_PUBLIC_RIGHT_LABELS = {
		read: () => main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_READ'),
		edit: () => main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_EDIT_DELETE')
	};
	function buildPublicAccessItems(rightsList) {
		const uniqueRights = Array.isArray(rightsList) ? [...new Set(rightsList)] : [];
		const unknownRights = [];
		const items = uniqueRights.filter(id => {
			const hasLabel = Boolean(ACCESS_PUBLIC_RIGHT_LABELS[id]);
			if (!hasLabel) {
				unknownRights.push(id);
			}
			return hasLabel;
		}).map(id => ({
			id,
			title: ACCESS_PUBLIC_RIGHT_LABELS[id]()
		}));
		return {
			items,
			unknownRights
		};
	}
	const ACCESS_PRIVATE_SELECT_ITEMS = [{
		id: 'R',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_READ')
	}, {
		id: 'W',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_EDIT_DELETE')
	}, {
		id: 'D',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_DENIED')
	}];
	const ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS = [{
		id: 'disk_access_read',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_VIEW')
	}, {
		id: 'disk_access_add',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_ADD')
	}, {
		id: 'disk_access_edit',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_EDIT_DELETE')
	}, {
		id: 'disk_access_full',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_FULL')
	}];
	const ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS_SHORT = [{
		id: 'disk_access_read',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_VIEW')
	}, {
		id: 'disk_access_add',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_ADD')
	}, {
		id: 'disk_access_edit',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_EDIT_DELETE_SHORT')
	}, {
		id: 'disk_access_full',
		title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_FULL_SHORT')
	}];
	const TASK_WEIGHT = {
		disk_access_read: 2,
		disk_access_add: 3,
		disk_access_edit: 4,
		disk_access_full: 5
	};
	const DEFAULT_MAX_TASK_NAME = 'disk_access_full';
	const PREFERRED_DEFAULT_TASK_NAME = 'disk_access_edit';
	const TYPE_FILE_DOCUMENT = 4;
	const TYPE_FILE_BOARD = 12;
	const HELP_DESK_SLIDER_CODE_DESCRIPTION = '25483894';
	const ACCESS_PRIVATE_SELECT_FULL_TEXT = {
		'R': 'VIEW',
		'W': 'EDIT',
		'D': 'DENIED'
	};

	async function getAccessRights({
		objectId = null,
		uniqueCode = null
	}) {
		if (!objectId && !uniqueCode) {
			throw new Error('getAccessRights: objectId or uniqueCode is required');
		}
		const response = uniqueCode ? await main_core.ajax.runAction('disk.accessrights.getUnified', {
			data: {
				uniqueCode
			}
		}) : await main_core.ajax.runAction('disk.api.accessrights.get', {
			data: {
				objectId
			}
		});
		return response.data;
	}

	async function postAccessPublicRights({
		objectId = null,
		uniqueCode = null
	}, body) {
		if (!objectId && !uniqueCode) {
			throw new Error('postAccessPublicRights: objectId or uniqueCode is required');
		}
		const response = uniqueCode ? await main_core.ajax.runAction('disk.accessrights.setUnifiedPublicLinkRights', {
			getParameters: {
				uniqueCode
			},
			json: body
		}) : await main_core.ajax.runAction('disk.accessrights.setPublicLinkRights', {
			getParameters: {
				fileId: objectId
			},
			json: body
		});
		return response.data;
	}

	async function postAccessPrivateRights(objectId, payload) {
		if (!objectId) {
			throw new Error('getAccessRights: fileId is required');
		}
		const response = await main_core.ajax.runAction('disk.accessRights.set', {
			data: {
				objectId,
				...payload
			}
		});
		return response.data;
	}

	// @vue/component
	const AccessSelect = {
		name: 'AccessSelect',
		components: {
			BInput: ui_system_input_vue.BInput,
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			items: {
				type: Array,
				required: true
			},
			selectedId: {
				type: String,
				required: true
			},
			variant: {
				type: String,
				required: true
			} // 'public' | 'private'
		},
		emits: ['select'],
		data() {
			return {
				isMenuShown: false
			};
		},
		computed: {
			InputDesign: () => ui_system_input_vue.InputDesign,
			InputSize: () => ui_system_input_vue.InputSize,
			rootClass() {
				return `access-${this.variant}-block__select`;
			},
			selectedItem() {
				return this.items.find(item => item.id === this.selectedId) ?? this.items[0];
			}
		},
		methods: {
			getMenuOptions() {
				return {
					bindElement: this.$refs.accessInput,
					closeOnItemClick: false,
					targetContainer: document.body,
					items: this.items.map(item => ({
						title: item.title,
						isSelected: item.id === this.selectedId,
						onClick: () => {
							this.$emit('select', item.id);
							this.isMenuShown = false;
						}
					}))
				};
			},
			openMenu() {
				if (!this.$refs.accessInput) {
					return;
				}
				this.isMenuShown = true;
			}
		},
		template: `
		<div :class="rootClass" ref="accessInput">
			<BInput
				:modelValue="selectedItem.title"
				dropdown
				clickable
				:active="isMenuShown"
				:size="InputSize.Md"
				:design="InputDesign.Primary"
				@click="openMenu"
			/>
			<BMenu
				v-if="isMenuShown"
				:options="getMenuOptions()"
				@close="isMenuShown = false"
			/>
		</div>
	`
	};

	const ACCESS_DAY_MONTH_FORMAT = main_date.DateTimeFormat.getFormat('DAY_MONTH_FORMAT') || 'j F';
	const ACCESS_SHORT_DATE_FORMAT = main_date.DateTimeFormat.getFormat('SHORT_DATE_FORMAT') || 'd.m.Y';
	const ACCESS_SHORT_TIME_FORMAT = main_date.DateTimeFormat.getFormat('SHORT_TIME_FORMAT') || 'H:i';
	function createAccessDate(value) {
		if (!Number.isFinite(value) || value <= 0) {
			return null;
		}
		const date = new Date(value * 1000);
		if (Number.isNaN(date.getTime())) {
			return null;
		}
		return date;
	}
	function formatAccessUntil(value) {
		const date = createAccessDate(value);
		if (!date) {
			return '';
		}
		const formattedDate = main_date.DateTimeFormat.format(ACCESS_DAY_MONTH_FORMAT, date);
		return (main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_UNTIL') ?? '').replace('#DATE#', formattedDate);
	}
	function formatAccessUntilForInput(value) {
		const date = createAccessDate(value);
		if (!date) {
			return '';
		}
		const isCurrentYear = date.getFullYear() === new Date().getFullYear();
		const dateFormat = isCurrentYear ? ACCESS_DAY_MONTH_FORMAT : ACCESS_SHORT_DATE_FORMAT;
		const formattedDate = main_date.DateTimeFormat.format(`${dateFormat} ${ACCESS_SHORT_TIME_FORMAT}`, date);
		return (main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_UNTIL') ?? '').replace('#DATE#', formattedDate);
	}

	const DATE_PICKER_EVENT_SELECT_CHANGE = 'onSelectChange';
	const DATE_PICKER_EVENT_BEFORE_SELECT = 'onBeforeSelect';
	const DATE_PICKER_EVENT_BEFORE_DAY_SELECT = 'onBeforeDaySelect';
	function createPickerDate(year, monthIndex = 0, day = 1, hours = 0, minutes = 0, seconds = 0, ms = 0) {
		const date = new Date(Date.UTC(year, monthIndex, day, hours, minutes, seconds, ms));
		if (year < 100 && year >= 0) {
			date.setUTCFullYear(year);
		}
		date.__utc = true;
		return date;
	}
	function createPickerDateFromTimestamp(value) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) {
			return null;
		}
		return createPickerDate(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
	}

	// @vue/component
	const PublicAccessDateRange = {
		name: 'PublicAccessDateRange',
		components: {
			TextSm: ui_system_typography_vue.TextSm,
			BMenu: ui_system_menu_vue.BMenu,
			BInput: ui_system_input_vue.BInput
		},
		props: {
			modelValue: {
				type: [Number, Boolean],
				default: false
			}
		},
		emits: ['update:modelValue'],
		data() {
			return {
				isMenuShown: false,
				datePicker: null
			};
		},
		watch: {
			modelValue() {
				this.syncDatePickerValue();
			}
		},
		computed: {
			InputSize: () => ui_system_input_vue.InputSize,
			InputDesign: () => ui_system_input_vue.InputDesign,
			foreverTitle() {
				return main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DATE_PICKER_FOREVER_OPTION');
			},
			hasSelectedDate() {
				return this.isTimestampValue(this.modelValue);
			},
			displayValue() {
				if (!this.hasSelectedDate) {
					return this.foreverTitle;
				}
				const label = formatAccessUntilForInput(this.modelValue);
				return label || '';
			}
		},
		mounted() {
			this.initDatePicker();
		},
		beforeUnmount() {
			this.destroyDatePicker();
		},
		methods: {
			isTimestampValue(value) {
				return Number.isFinite(value) && value > 0;
			},
			getDateFromModelValue() {
				if (!this.hasSelectedDate) {
					return null;
				}
				return createPickerDateFromTimestamp(this.modelValue * 1000);
			},
			getInputElement() {
				return this.$refs.dateInputWrap?.querySelector('input');
			},
			getTodayStart() {
				const today = new Date();
				return createPickerDate(today.getFullYear(), today.getMonth(), today.getDate());
			},
			formatTime(hours, minutes = 0) {
				return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
			},
			getRoundedDefaultTime() {
				const nextHour = new Date();
				nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
				return this.formatTime(nextHour.getHours(), nextHour.getMinutes());
			},
			getNextAvailableTodayTimestamp() {
				const now = new Date();
				const nextHour = new Date(now);
				nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
				const isSameDay = nextHour.getFullYear() === now.getFullYear() && nextHour.getMonth() === now.getMonth() && nextHour.getDate() === now.getDate();
				return isSameDay ? Math.floor(nextHour.getTime() / 1000) : false;
			},
			getDateWithTime(date, timeSource) {
				if (!(date instanceof Date) || !(timeSource instanceof Date)) {
					return null;
				}
				return createPickerDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), timeSource.getUTCHours(), timeSource.getUTCMinutes(), timeSource.getUTCSeconds());
			},
			getTimestampFromSelectedDate(date) {
				if (!(date instanceof Date)) {
					return false;
				}
				const localDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
				const timestamp = Math.floor(localDate.getTime() / 1000);
				return timestamp > 0 ? timestamp : false;
			},
			isSamePickerDay(firstDate, secondDate) {
				return firstDate.getUTCFullYear() === secondDate.getUTCFullYear() && firstDate.getUTCMonth() === secondDate.getUTCMonth() && firstDate.getUTCDate() === secondDate.getUTCDate();
			},
			isTodayPickerDate(date) {
				const today = new Date();
				return date.getUTCFullYear() === today.getFullYear() && date.getUTCMonth() === today.getMonth() && date.getUTCDate() === today.getDate();
			},
			initDatePicker() {
				const input = this.getInputElement();
				if (this.datePicker || !input) {
					return;
				}
				const todayStart = this.getTodayStart();
				this.datePicker = ui_vue3.markRaw(new ui_datePicker.DatePicker({
					targetNode: input,
					selectionMode: 'single',
					defaultTime: this.getRoundedDefaultTime(),
					enableTime: true,
					autoHide: true,
					minDate: todayStart,
					dayColors: [{
						matcher: date => {
							const compareDate = createPickerDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
							return compareDate < todayStart;
						},
						textColor: '#A6ABB8',
						bgColor: 'transparent'
					}],
					popupOptions: {
						bindOptions: {
							position: 'top',
							forceBindPosition: true,
							forceTop: true
						},
						offsetTop: 5
					},
					events: {
						[DATE_PICKER_EVENT_SELECT_CHANGE]: event => this.handleDateChange(event),
						[DATE_PICKER_EVENT_BEFORE_DAY_SELECT]: event => this.handleBeforeDaySelect(event),
						[DATE_PICKER_EVENT_BEFORE_SELECT]: event => this.handleBeforeSelect(event)
					}
				}));
				this.syncDatePickerValue();
			},
			destroyDatePicker() {
				if (!this.datePicker) {
					return;
				}
				this.datePicker.destroy();
				this.datePicker = null;
			},
			getMenuOptions() {
				const foreverTitle = main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DATE_PICKER_FOREVER_OPTION');
				const selectTitle = main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DATE_PICKER_SELECT_OPEN');
				const isDateSelected = this.hasSelectedDate;
				const isForeverSelected = !isDateSelected;
				const bindElement = this.$refs.dateInputWrap ?? this.getInputElement();
				return {
					bindElement,
					closeOnItemClick: false,
					targetContainer: document.body,
					items: [{
						title: foreverTitle,
						isSelected: isForeverSelected,
						onClick: () => {
							this.selectForever();
							this.isMenuShown = false;
						}
					}, {
						title: selectTitle,
						isSelected: isDateSelected,
						onClick: () => {
							this.isMenuShown = false;
							this.openDatePicker();
						}
					}]
				};
			},
			openMenu() {
				if (!this.getInputElement()) {
					return;
				}
				if (this.datePicker?.isOpen()) {
					this.datePicker.hide();
				}
				this.isMenuShown = true;
			},
			selectForever() {
				if (this.datePicker) {
					this.datePicker.deselectAll({
						updateInputs: false,
						emitEvents: false,
						render: true
					});
				}
				this.$emit('update:modelValue', false);
			},
			syncDatePickerValue() {
				if (!this.datePicker) {
					return;
				}
				const selectedDate = this.getDateFromModelValue();
				const currentDate = this.datePicker.getSelectedDate();
				if (!selectedDate) {
					if (currentDate) {
						this.datePicker.deselectAll({
							updateInputs: false,
							emitEvents: false,
							render: true
						});
					}
					return;
				}
				if (currentDate && currentDate.getTime() === selectedDate.getTime()) {
					return;
				}
				this.datePicker.selectDate(selectedDate, {
					updateInputs: false,
					emitEvents: false,
					render: true
				});
			},
			openDatePicker() {
				if (!this.datePicker) {
					this.initDatePicker();
				}
				if (!this.datePicker) {
					return;
				}
				this.syncDatePickerValue();
				this.datePicker.setDefaultTime(this.getRoundedDefaultTime());
				this.$nextTick(() => {
					if (this.datePicker) {
						this.datePicker.show();
					}
				});
			},
			handleDateChange(event) {
				const date = event.getTarget().getSelectedDate();
				const value = this.getTimestampFromSelectedDate(date);
				if (value === false) {
					return;
				}
				this.$emit('update:modelValue', value);
			},
			handleBeforeDaySelect(event) {
				if (!this.datePicker) {
					return;
				}
				const {
					date
				} = event.getData();
				const currentDate = this.datePicker.getSelectedDate();
				if (!(date instanceof Date) || !(currentDate instanceof Date)) {
					return;
				}
				if (this.isSamePickerDay(currentDate, date) || !this.isTodayPickerDate(date)) {
					return;
				}
				const dateWithCurrentTime = this.getDateWithTime(date, currentDate);
				const selectedTimestamp = this.getTimestampFromSelectedDate(dateWithCurrentTime);
				if (selectedTimestamp === false || selectedTimestamp > Math.floor(Date.now() / 1000)) {
					return;
				}
				const nextAvailableTodayTimestamp = this.getNextAvailableTodayTimestamp();
				if (nextAvailableTodayTimestamp === false) {
					event.preventDefault();
					return;
				}
				const nextAvailableToday = new Date(nextAvailableTodayTimestamp * 1000);
				this.datePicker.setDefaultTime(this.formatTime(nextAvailableToday.getHours(), nextAvailableToday.getMinutes()));
				this.datePicker.deselectAll({
					updateInputs: false,
					emitEvents: false,
					render: false
				});
			},
			handleBeforeSelect(event) {
				const {
					date
				} = event.getData();
				if (!(date instanceof Date)) {
					return;
				}
				const selectedTimestamp = this.getTimestampFromSelectedDate(date);
				if (selectedTimestamp !== false && selectedTimestamp <= Math.floor(Date.now() / 1000)) {
					event.preventDefault();
				}
			}
		},
		template: `
		<div class="access-public-block__date-picker-wrapper">
			<TextSm
				tag="label"
				className="access-public-block__date-picker-label"
				for="access-public-block__date-picker"
			>
				${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DATE_PICKER_LABEL')}
			</TextSm>
			<div class="access-public-block__input-date-picker" ref="dateInputWrap">
				<BInput
					:modelValue="displayValue"
					readonly
					clickable
					dropdown
					:stretched="true"
					:size="InputSize.Md"
					:design="InputDesign.Primary"
					:active="isMenuShown"
					placeholder="${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DATE_PICKER_PLACEHOLDER')}"
					@click="openMenu"
				/>
			</div>
			<BMenu
				v-if="isMenuShown"
				:options="getMenuOptions()"
				@close="isMenuShown = false"
			/>
		</div>
	`
	};

	const helpDesk = (sliderCode, widthCode = false) => {
		if (!sliderCode) {
			return;
		}
		if (widthCode) {
			const Helper = main_core.Reflection.getClass('top.BX.Helper');
			if (Helper) {
				Helper.show(`redirect=detail&code=${sliderCode}`);
			}
			return;
		}
		const InfoHelper = main_core.Reflection.getClass('top.BX.UI.InfoHelper') || main_core.Reflection.getClass('BX.UI.InfoHelper');
		if (InfoHelper) {
			InfoHelper.show(sliderCode);
		}
	};

	// @vue/component
	const PublicAccessDescription = {
		name: 'PublicAccessDescription',
		components: {
			TextXl: ui_system_typography_vue.TextXl
		},
		props: {
			selectedAccessId: {
				type: String,
				required: true
			},
			entityType: {
				type: String,
				default: 'FILE'
			},
			isActive: {
				type: Boolean,
				required: true
			},
			isFullSettings: {
				type: Boolean,
				required: true
			},
			accessEndDate: {
				type: [Number, Boolean],
				required: true
			},
			isPassword: {
				type: Boolean,
				required: true
			},
			isSettingsBlocked: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			publicDescriptionText() {
				if (!this.isActive) {
					return main_core.Loc.getMessage(`DISK_SHARING_ACCESS_POPUP_DEFAULT_PUBLIC_DESCRIPTION_${this.entityType}`);
				}
				if (this.isFullSettings) {
					return main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_SELECT_ACCESS_PUBLIC_USERS');
				}
				let text = '';
				if (this.selectedAccessId === 'read') {
					text = main_core.Loc.getMessage(`DISK_SHARING_ACCESS_POPUP_ACTIVE_VIEW_PUBLIC_DESCRIPTION_${this.entityType}`);
				} else {
					text = main_core.Loc.getMessage(`DISK_SHARING_ACCESS_POPUP_ACTIVE_EDIT_PUBLIC_DESCRIPTION_${this.entityType}`);
				}
				const until = formatAccessUntil(this.accessEndDate);
				if (until) {
					text = `${text} ${until}`;
				}
				if (this.isPassword) {
					text = `${text}. ${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_DESCRIPTION_PASSWORD_PROTECTED')}`;
				}
				return text;
			}
		},
		methods: {
			openHelpDesk() {
				helpDesk(HELP_DESK_SLIDER_CODE_DESCRIPTION, true);
			},
			onToggleSettings() {
				if (this.isSettingsBlocked) {
					this.$emit('blockedSettings');
					return;
				}
				this.$emit('toggleSettings');
			}
		},
		emits: ['toggleSettings', 'blockedSettings'],
		template: `
		<div class="access-public-block__description">
			<TextXl
				tag="p"
				className="access-public-block__description-text"
			>
				{{ publicDescriptionText }}
			</TextXl>
		</div>
		<button
			v-if="isActive && !isFullSettings"
			type="button"
			@click="onToggleSettings"
			class="access-public-block__open-settings"
			:class="{ 'access-public-block__open-settings--disabled': isSettingsBlocked }"
			:aria-disabled="isSettingsBlocked"
		>
			${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_CHANGE_BUTTON')}
		</button>
		<button
			v-if="isFullSettings"
			type="button"
			@click="openHelpDesk"
			class="access-public-block__open-aside-popup"
		>
			${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_DETAILS_BUTTON')}
		</button>
	`
	};

	// @vue/component
	const PublicAccessFooter = {
		name: 'PublicAccessFooter',
		components: {
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			isDownload: {
				type: Boolean,
				required: true
			}
		},
		emits: ['update:isDownload'],
		methods: {
			onToggle(event) {
				this.$emit('update:isDownload', event.target.checked);
			}
		},
		template: `
		<div class="access-public-block__footer">
			<div class="ui-ctl ui-ctl-checkbox ui-ctl-xs access-public-block__download-wrapper">
				<input
					class="ui-ctl-element"
					type="checkbox"
					:checked="isDownload"
					@change="onToggle"
					id="test"
				>
				<TextSm
					tag="label"
					className="access-public-block__download-label"
					for="test"
				>
					${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_CHECKOUT_DOWNLOAD_ACTION')}
				</TextSm>
			</div>
		</div>
	`
	};

	// @vue/component
	const PublicAccessHeader = {
		name: 'PublicAccessHeader',
		components: {
			TextXl: ui_system_typography_vue.TextXl
		},
		props: {
			isActive: {
				type: Boolean,
				required: true
			},
			isDisabled: {
				type: Boolean,
				default: false
			},
			isToggleBlocked: {
				type: Boolean,
				default: false
			},
			isLoading: {
				type: Boolean,
				default: false
			}
		},
		emits: ['toggle', 'blockedToggle'],
		data() {
			return {
				switcher: null
			};
		},
		watch: {
			isActive() {
				this.syncSwitcherState();
			},
			isDisabled() {
				this.syncSwitcherState();
			},
			isToggleBlocked() {
				this.syncSwitcherState();
			},
			isLoading() {
				this.syncSwitcherState();
			}
		},
		mounted() {
			this.initSwitcher();
		},
		beforeUnmount() {
			this.destroySwitcher();
		},
		methods: {
			initSwitcher() {
				if (this.switcher || !this.$refs.switcherNode) {
					return;
				}
				this.switcher = new ui_switcher.Switcher({
					node: this.$refs.switcherNode,
					checked: this.isActive,
					disabled: this.isDisabled || this.isLoading,
					size: 'small',
					showStateTitle: false,
					useAirDesign: true,
					handlers: {
						toggled: () => {
							const nextValue = this.switcher.isChecked();
							if (this.isToggleBlocked) {
								this.$emit('blockedToggle', nextValue);
								this.switcher.check(this.isActive, false);
								return;
							}
							this.$emit('toggle', nextValue);
						}
					}
				});
				this.syncSwitcherState();
			},
			destroySwitcher() {
				if (!this.switcher) {
					return;
				}
				if (main_core.Type.isFunction(this.switcher.destroy)) {
					this.switcher.destroy();
				}
				this.switcher = null;
			},
			syncSwitcherState() {
				if (!this.switcher) {
					return;
				}
				if (this.switcher.isLoading()) {
					this.switcher.setLoading(false);
				}
				this.switcher.disable(this.isDisabled || this.isLoading, false);
				this.switcher.check(this.isActive, false);
				this.switcher.setLoading(this.isLoading);
			}
		},
		template: `
		<div class="access-public-block__header">
			<div class="access-public-block__switcher" ref="switcherNode"></div>
			<TextXl
				tag="div"
				className="access-public-block__title"
			>
				${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_SWITCHER_ACTION')}
			</TextXl>
		</div>
	`
	};

	// @vue/component
	const PublicAccessPassword = {
		name: 'PublicAccessPassword',
		components: {
			BInput: ui_system_input_vue.BInput,
			TextSm: ui_system_typography_vue.TextSm,
			Text2Xs: ui_system_typography_vue.Text2Xs,
			PasswordField: ui_system_input_vue.PasswordField,
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			isPassword: {
				type: Boolean,
				required: true
			},
			hasSavedPassword: {
				type: Boolean,
				default: false
			},
			password: {
				type: String,
				default: ''
			},
			isSaving: {
				type: Boolean,
				default: false
			}
		},
		emits: ['update:isPassword', 'update:password', 'save'],
		data() {
			return {
				isPasswordStubCleared: false
			};
		},
		computed: {
			InputDesign: () => ui_system_input_vue.InputDesign,
			InputSize: () => ui_system_input_vue.InputSize,
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			passwordPlaceholder: () => main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_PASSWORD_PLACEHOLDER'),
			isSaveDisabled() {
				return this.isSaving || this.password.trim().length < 8;
			},
			showPasswordStub() {
				return this.hasSavedPassword && this.password.length === 0 && !this.isPasswordStubCleared;
			}
		},
		watch: {
			hasSavedPassword(next) {
				if (next) {
					this.isPasswordStubCleared = false;
				}
			},
			isPassword(next) {
				if (!next) {
					this.isPasswordStubCleared = false;
				}
			},
			isSaving(next, prev) {
				if (!prev || next || !this.hasSavedPassword || this.password.length > 0) {
					return;
				}
				this.isPasswordStubCleared = false;
			}
		},
		methods: {
			onToggle(event) {
				if (this.isSaving) {
					return;
				}
				this.$emit('update:isPassword', event.target.checked);
			},
			onPasswordChange(value) {
				this.isPasswordStubCleared = true;
				this.$emit('update:password', value);
			},
			onPasswordFocus() {
				this.isPasswordStubCleared = true;
			},
			onSave() {
				if (this.isSaveDisabled) {
					return;
				}
				this.$emit('save');
			}
		},
		template: `
		<div class="access-public-block__password-wrapper">
			<div class="ui-ctl ui-ctl-checkbox ui-ctl-xs access-public-block__password-checkbox">
				<input
					class="ui-ctl-element"
					type="checkbox"
					:checked="isPassword"
					:disabled="isSaving"
					@change="onToggle"
				>
				<TextSm
					tag="label"
					className="access-public-block__password-label"
				>
					${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_SET_PASSWORD')}
				</TextSm>
			</div>
			<div class="access-public-block__save-wrapper" v-if="isPassword">
				<div class="access-public-block__save-container">
					<div class="access-public-block__password-unput-wrapper">
						<span
							v-if="showPasswordStub"
							class="access-public-block__password-stub"
							aria-hidden="true"
						>
							••••••••
						</span>
						<PasswordField
							:modelValue="password"
							@update:modelValue="onPasswordChange"
							@focus="onPasswordFocus"
							type="password"
							:size="InputSize.Md"
							:design="InputDesign.Primary"
							:stretched="true"
							:disabled="isSaving"
							:placeholder="showPasswordStub ? '' : passwordPlaceholder"
						/>
					</div>
					<UiButton
						text="${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_PASSWORD_SAVE_BUTTON')}"
						:disabled="isSaveDisabled"
						:loading="isSaving"
						:size="ButtonSize.MEDIUM"
						:style="AirButtonStyle.OUTLINE_ACCENT_2"
						@click="onSave"
					/>
				</div>
				<Text2Xs
					tag="label"
					className="access-public-block__password-warning"
					v-if="password.length > 0"
				>
					${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_PASSWORD_LABEL')}
				</Text2Xs>
			</div>
		</div>
	`
	};

	const COPY_SUCCESS_TIMEOUT = 2000;

	// @vue/component
	const AccessCopyLink = {
		name: 'AccessCopyLink',
		components: {
			UiButton: ui_vue3_components_button.Button
		},
		props: {
			link: {
				type: String,
				default: ''
			}
		},
		data() {
			return {
				isCopying: false,
				isCopied: false,
				resetCopiedStateTimeout: null
			};
		},
		computed: {
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize,
			Outline: () => ui_iconSet_api_vue.Outline,
			buttonText() {
				return this.isCopied ? main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_COPY_LINK_BUTTON_SUCCESS') : main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_COPY_LINK_BUTTON');
			},
			buttonStyle() {
				return this.isCopied ? ui_vue3_components_button.AirButtonStyle.FILLED_SUCCESS : ui_vue3_components_button.AirButtonStyle.FILLED;
			},
			toggleIcon() {
				if (this.isCopied) {
					return ui_iconSet_api_vue.Outline.CHECK_M;
				}
				return ui_iconSet_api_vue.Outline.LINK;
			}
		},
		beforeUnmount() {
			clearTimeout(this.resetCopiedStateTimeout);
		},
		methods: {
			async onClick() {
				if (this.isCopying) {
					return;
				}
				this.isCopying = true;
				try {
					await this.copyToClipboard(this.link);
					this.setCopiedState();
				} catch (error) {
					notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_COPY_ERROR_MESSAGE');
					console.error('AccessCopyLink: copy failed', error);
				} finally {
					this.isCopying = false;
				}
			},
			setCopiedState() {
				this.isCopied = true;
				clearTimeout(this.resetCopiedStateTimeout);
				this.resetCopiedStateTimeout = setTimeout(() => {
					this.isCopied = false;
					this.resetCopiedStateTimeout = null;
				}, COPY_SUCCESS_TIMEOUT);
			},
			async copyToClipboard(textToCopy) {
				if (!main_core.Type.isStringFilled(textToCopy)) {
					throw new Error('Link is empty');
				}
				let clipboardError = null;
				if (window.isSecureContext && navigator.clipboard?.writeText) {
					try {
						await navigator.clipboard.writeText(textToCopy);
						return;
					} catch (error) {
						clipboardError = error;
					}
				}
				try {
					this.copyToClipboardFallback(textToCopy);
				} catch (error) {
					throw clipboardError ?? error;
				}
			},
			copyToClipboardFallback(textToCopy) {
				const textArea = document.createElement('textarea');
				const activeElement = document.activeElement;
				const selection = window.getSelection();
				const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
				textArea.value = textToCopy;
				textArea.setAttribute('readonly', '');
				main_core.Dom.style(textArea, 'position', 'fixed');
				main_core.Dom.style(textArea, 'top', '-9999px');
				main_core.Dom.style(textArea, 'left', '-9999px');
				main_core.Dom.style(textArea, 'opacity', '0');
				main_core.Dom.append(textArea, document.body);
				textArea.focus();
				textArea.select();
				textArea.setSelectionRange(0, textArea.value.length);
				let isCopied = false;
				try {
					isCopied = document.execCommand('copy');
				} finally {
					main_core.Dom.remove(textArea);
					if (selection) {
						selection.removeAllRanges();
						if (range) {
							selection.addRange(range);
						}
					}
					if (activeElement instanceof HTMLElement) {
						activeElement.focus();
					}
				}
				if (!isCopied) {
					throw new Error('Fallback copy failed');
				}
			}
		},
		template: `
		<UiButton
			:text="buttonText"
			:leftIcon="toggleIcon"
			:size="ButtonSize.MEDIUM"
			:style="buttonStyle"
			:loading="isCopying"
			@click="onClick"
		/>
	`
	};

	const extensionSettings$1 = main_core.Extension.getSettings('disk.sharing-access-popup');
	const externalLinkDisableReasons = extensionSettings$1.get('externalLinkDisableReasons', {});
	const limitSliders$1 = extensionSettings$1.get('limitSliders', {});

	// @vue/component
	const SharingAccessPublicSettings = {
		name: 'SharingAccessPublicSettings',
		components: {
			PublicAccessHeader,
			PublicAccessDescription,
			PublicAccessSelect: AccessSelect,
			PublicAccessDateRange,
			PublicAccessPassword,
			PublicAccessFooter,
			AccessCopyLink
		},
		props: {
			isPublic: {
				type: Boolean,
				required: true
			},
			accessRights: {
				type: Object,
				default: null
			},
			objectId: {
				type: [Number, String],
				default: null
			},
			uniqueCode: {
				type: String,
				default: null
			},
			entityType: {
				type: String,
				default: 'FILE'
			}
		},
		emits: ['publicLinkChange'],
		data() {
			return {
				isActivePublicLink: false,
				isActivePublicLinkSaving: false,
				isFullSettings: false,
				selectedAccessId: 'read',
				isAccessRightsSaving: false,
				isPassword: false,
				publicPassword: '',
				isPasswordSaving: false,
				isDownload: true,
				accessEndDate: false,
				saveAccessEndDateDebounced: null
			};
		},
		computed: {
			publicLink() {
				return this.accessRights?.publicLink ?? null;
			},
			getPublicLink() {
				return this.publicLink?.link ?? '';
			},
			isCopyLinkHiddenByDisableReason() {
				return [externalLinkDisableReasons.option, externalLinkDisableReasons.feature, externalLinkDisableReasons.fileOption].includes(this.publicLinkDisabledReason);
			},
			visibleCopyLink() {
				return this.isPublic && this.isActivePublicLink && !this.isCopyLinkHiddenByDisableReason;
			},
			hasSavedPassword() {
				return Boolean(this.publicLink?.password);
			},
			publicLinkDisabledReason() {
				return this.publicLink?.disableReason ?? this.publicLink?.disabledReason ?? null;
			},
			isPublicLinkBlockedByPolicy() {
				return Boolean(this.publicLinkDisabledReason);
			},
			accessItems() {
				const publicLink = this.publicLink;
				if (!publicLink?.enabled) {
					return [];
				}
				return buildPublicAccessItems(publicLink.rightsList).items;
			},
			hasEmptyAccessItems() {
				return this.isActivePublicLink && this.isFullSettings && this.accessItems.length === 0;
			}
		},
		watch: {
			accessRights: {
				immediate: true,
				handler(next) {
					this.syncPublicLink(next);
					this.syncAccessRights(next);
					this.syncAccessEndDate(next);
					this.syncIsDownload(next);
					this.syncPassword(next);
				}
			},
			isActivePublicLink(next) {
				if (!next) {
					this.isFullSettings = false;
					this.publicPassword = '';
				}
			}
		},
		created() {
			this.saveAccessEndDateDebounced = main_core.Runtime.debounce(this.saveAccessEndDate, 400, this);
		},
		methods: {
			getTarget() {
				return {
					objectId: this.objectId,
					uniqueCode: this.uniqueCode
				};
			},
			showSettings() {
				if (!this.isFullSettings && this.isPublicLinkBlockedByPolicy) {
					this.handleBlockedPublicLink();
					return;
				}
				this.isFullSettings = !this.isFullSettings;
			},
			applyPublicLink(publicLink) {
				this.$emit('publicLinkChange', publicLink);
			},
			getTariffSliderCode() {
				return limitSliders$1.externalLinkFileTariff;
			},
			openPublicLinkDetails() {
				helpDesk(this.getTariffSliderCode());
			},
			handleBlockedPublicLink(reason = this.publicLinkDisabledReason) {
				if (!reason) {
					return;
				}
				if (reason === externalLinkDisableReasons.feature) {
					helpDesk(this.getTariffSliderCode());
					return;
				}
				if (reason === externalLinkDisableReasons.option || reason === externalLinkDisableReasons.fileOption) {
					return;
				}
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
			},
			onBlockedToggleAttempt() {
				this.handleBlockedPublicLink();
			},
			syncPublicLink(next) {
				const enabled = next?.publicLink?.enabled ?? false;
				this.isActivePublicLink = enabled;
			},
			async onTogglePublicLink(value) {
				if (this.isActivePublicLinkSaving) {
					return;
				}
				if (this.isPublicLinkBlockedByPolicy) {
					this.handleBlockedPublicLink();
					return;
				}
				const prev = this.isActivePublicLink;
				this.isActivePublicLink = value;
				this.isActivePublicLinkSaving = true;
				try {
					const publicLink = await postAccessPublicRights(this.getTarget(), {
						enabled: value
					});
					this.applyPublicLink(publicLink);
				} catch {
					this.isActivePublicLink = prev;
					notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
				} finally {
					this.isActivePublicLinkSaving = false;
				}
			},
			syncAccessRights(next) {
				const publicLink = next?.publicLink;
				if (!publicLink?.enabled) {
					this.selectedAccessId = 'read';
					return;
				}
				const {
					items,
					unknownRights
				} = buildPublicAccessItems(publicLink.rightsList);
				if (unknownRights.length > 0) {
					console.warn('[disk.sharing-access-popup] Unknown public rights codes:', unknownRights);
				}
				if (items.length === 0) {
					this.selectedAccessId = '';
					return;
				}
				const rights = publicLink.rights;
				const currentSelectedExists = items.some(item => item.id === this.selectedAccessId);
				const rightsExists = rights && items.some(item => item.id === rights);
				if (rightsExists) {
					this.selectedAccessId = rights;
					return;
				}
				if (currentSelectedExists) {
					return;
				}
				this.selectedAccessId = items[0].id;
			},
			async onAccessRights(next) {
				if (this.isAccessRightsSaving || this.isActivePublicLinkSaving) {
					return;
				}
				if (!this.isActivePublicLink) {
					return;
				}
				if (this.isPublicLinkBlockedByPolicy) {
					this.handleBlockedPublicLink();
					return;
				}
				const prev = this.selectedAccessId;
				this.selectedAccessId = next;
				this.isAccessRightsSaving = true;
				try {
					const publicLink = await postAccessPublicRights(this.getTarget(), {
						enabled: this.isActivePublicLink,
						rights: next
					});
					this.applyPublicLink(publicLink);
				} catch {
					this.selectedAccessId = prev;
					notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
				} finally {
					this.isAccessRightsSaving = false;
				}
			},
			syncPassword(next) {
				this.isPassword = Boolean(next?.publicLink?.password);
				if (!this.isPassword) {
					this.publicPassword = '';
				}
			},
			normalizeAccessEndDate(value) {
				return Number.isFinite(value) && value > 0 ? Math.floor(value) : false;
			},
			getPersistedAccessEndDate() {
				return this.normalizeAccessEndDate(this.publicLink?.publicLinkTtl);
			},
			async onPasswordToggle(value) {
				if (this.isPasswordSaving || this.isActivePublicLinkSaving || !this.isActivePublicLink) {
					return;
				}
				if (this.isPublicLinkBlockedByPolicy) {
					this.handleBlockedPublicLink();
					return;
				}
				const hadSavedPassword = this.hasSavedPassword;
				if (value) {
					this.isPassword = true;
					return;
				}
				this.publicPassword = '';
				if (!hadSavedPassword) {
					this.isPassword = false;
					return;
				}
				this.isPasswordSaving = true;
				try {
					const publicLink = await postAccessPublicRights(this.getTarget(), {
						enabled: this.isActivePublicLink,
						newPassword: false
					});
					this.applyPublicLink(publicLink);
					this.isPassword = false;
				} catch {
					this.isPassword = true;
					notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
				} finally {
					this.isPasswordSaving = false;
				}
			},
			async savePublicPassword() {
				const password = this.publicPassword.trim();
				if (password.length < 8 || this.isPasswordSaving || !this.isActivePublicLink) {
					return;
				}
				if (this.isPublicLinkBlockedByPolicy) {
					this.handleBlockedPublicLink();
					return;
				}
				this.isPasswordSaving = true;
				try {
					const publicLink = await postAccessPublicRights(this.getTarget(), {
						enabled: this.isActivePublicLink,
						newPassword: password
					});
					this.applyPublicLink(publicLink);
					this.isPassword = true;
					this.publicPassword = '';
				} catch {
					notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
				} finally {
					this.isPasswordSaving = false;
				}
			},
			syncAccessEndDate(next) {
				this.accessEndDate = this.normalizeAccessEndDate(next?.publicLink?.publicLinkTtl);
			},
			onAccessEndDateChange(value) {
				if (!this.isActivePublicLink || this.isActivePublicLinkSaving) {
					return;
				}
				if (this.isPublicLinkBlockedByPolicy) {
					this.handleBlockedPublicLink();
					return;
				}
				const nextValue = this.normalizeAccessEndDate(value);
				if (nextValue === this.accessEndDate) {
					return;
				}
				const previousValue = this.getPersistedAccessEndDate();
				this.accessEndDate = nextValue;
				this.saveAccessEndDateDebounced(nextValue, previousValue);
			},
			async saveAccessEndDate(value, previousValue = this.getPersistedAccessEndDate()) {
				const publicLinkTtl = this.normalizeAccessEndDate(value);
				try {
					const publicLink = await postAccessPublicRights(this.getTarget(), {
						enabled: this.isActivePublicLink,
						publicLinkTtl
					});
					this.applyPublicLink(publicLink);
				} catch {
					this.accessEndDate = previousValue;
					notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
				}
			},
			syncIsDownload(next) {
				this.isDownload = next?.publicLink?.canDownloadWithReadAccess ?? true;
			},
			async onToggleDownload(value) {
				if (this.isPublicLinkBlockedByPolicy) {
					this.handleBlockedPublicLink();
					return;
				}
				const prev = this.isDownload;
				try {
					const publicLink = await postAccessPublicRights(this.getTarget(), {
						enabled: this.isActivePublicLink,
						canDownloadWithReadAccess: value
					});
					this.applyPublicLink(publicLink);
				} catch {
					this.isDownload = prev;
					notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
				}
			}
		},
		// TODO: Открыть footer как будет готова настройка на скачивание на бэке
		template: `
		<div v-if="isPublic" class="access-public-block__wrapper">
			<PublicAccessHeader
				:isActive="isActivePublicLink"
				:isDisabled="isActivePublicLinkSaving"
				:isToggleBlocked="isPublicLinkBlockedByPolicy"
				:isLoading="isActivePublicLinkSaving"
				@toggle="onTogglePublicLink"
				@blockedToggle="onBlockedToggleAttempt"

			/>
			<div class="access-public-block__main" :class="{ 'access-public-block__main--filtered': !isActivePublicLink }">
			<PublicAccessDescription
				:selectedAccessId="selectedAccessId"
				:entityType="entityType"
				:isActive="isActivePublicLink"
				:isFullSettings="isFullSettings"
				:accessEndDate="accessEndDate"
				:isPassword="hasSavedPassword"
				:isSettingsBlocked="isPublicLinkBlockedByPolicy"
				@toggleSettings="showSettings"
				@blockedSettings="handleBlockedPublicLink"
			/>
				<div v-if="isActivePublicLink && isFullSettings" class="access-public-block__inputs">
					<PublicAccessSelect
						v-if="accessItems.length > 0"
						:items="accessItems"
						:selectedId="selectedAccessId"
						variant="public"
						@select="onAccessRights"
					/>
					<div v-if="hasEmptyAccessItems">
						${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PUBLIC_ACCESS_EMPTY')}
					</div>
					<PublicAccessDateRange 
						:modelValue="accessEndDate"
						@update:modelValue="onAccessEndDateChange"
					/>
					<PublicAccessPassword
						:isPassword="isPassword"
						:hasSavedPassword="hasSavedPassword"
						:password="publicPassword"
						:isSaving="isPasswordSaving"
						@update:isPassword="onPasswordToggle"
						@update:password="publicPassword = $event"
						@save="savePublicPassword"
					/>
				</div>
			</div>
			<PublicAccessFooter
				v-if="false"
				:isDownload="isDownload"
				@update:isDownload="onToggleDownload"
			/>
		</div>
		<div v-if="visibleCopyLink" class="access-public-block__copy-link-wrapper">
			<AccessCopyLink :link="getPublicLink" />
		</div>
	`
	};

	function getSelectorItemByAccessCode(accessCode) {
		const value = String(accessCode);
		if (value.startsWith('U')) {
			return ['user', value.slice(1)];
		}
		if (value.startsWith('SG')) {
			return ['project', value.slice(2)];
		}
		if (value.startsWith('DR')) {
			return ['department', value.slice(2)];
		}
		return null;
	}
	function getAccessCodeByDialogItem(item) {
		const entityId = item.getEntityId();
		const id = String(item.getId());
		switch (entityId) {
			case 'user':
				return `U${id}`;
			case 'project':
				return `SG${id}`;
			case 'department':
				return `DR${id}`;
			default:
				return null;
		}
	}

	// @vue/component
	const PrivateUserItem = {
		name: 'PrivateUserItem',
		components: {
			TextSm: ui_system_typography_vue.TextSm,
			BMenu: ui_system_menu_vue.BMenu
		},
		props: {
			title: {
				type: String,
				default: ''
			},
			taskName: {
				type: String,
				default: 'disk_access_read'
			},
			maxTaskName: {
				type: String,
				default: 'disk_access_full'
			},
			readOnly: {
				type: Boolean,
				default: false
			}
		},
		emits: ['changeRight'],
		data() {
			return {
				isMenuShown: false,
				selectedAccessId: 'view',
				accessItems: ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS,
				accessItemsShorts: ACCESS_PRIVATE_LEVEL_ACCESS_ITEMS_SHORT
			};
		},
		computed: {
			selectedAccessLabel() {
				return this.accessItemsShorts.find(item => item.id === this.taskName)?.title ?? this.accessItemsShorts[0]?.title ?? '';
			},
			availableAccessItems() {
				return this.accessItems.filter(item => {
					return TASK_WEIGHT[this.maxTaskName] >= TASK_WEIGHT[item.id];
				});
			}
		},
		methods: {
			openMenu() {
				if (this.readOnly) {
					return;
				}
				this.isMenuShown = true;
			},
			getMenuOptions() {
				return {
					bindElement: this.$refs.accessButton,
					targetContainer: document.body,
					closeOnItemClick: true,
					items: this.availableAccessItems.map(item => ({
						title: item.title,
						isSelected: item.id === this.taskName,
						onClick: () => {
							this.$emit('changeRight', item.id);
							this.isMenuShown = false;
						}
					}))
				};
			}
		},
		template: `
		<div class="access-private-user__wrapper">
			<div class="access-private-user__info-wrapper">
				<TextSm
					tag="p"
					className="access-private-head__user-name"
				>
					{{title}}
				</TextSm>	
			</div>
			<div class="access-private-user__change-access">
				<button
					ref="accessButton"
					type="button"
					class="access-private-user__access-button"
					:disabled="readOnly"
					@click="openMenu"
				>
					{{ selectedAccessLabel }}
				</button>
				<BMenu
					v-if="isMenuShown"
					:options="getMenuOptions()"
					@close="isMenuShown = false"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const PrivateAccessAddEmployess = {
		name: 'PrivateAccessAddEmployess',
		components: {
			UiButton: ui_vue3_components_button.Button,
			TextSm: ui_system_typography_vue.TextSm,
			PrivateUserItem
		},
		props: {
			items: {
				type: Array,
				default: () => []
			},
			isSaving: {
				type: Boolean,
				default: false
			}
		},
		emits: ['selectionChange', 'selectionApply', 'changeRight'],
		data() {
			return {
				dialog: null,
				isUnmounting: false,
				isProjectEntityAvailable: false
			};
		},
		computed: {
			AirButtonStyle: () => ui_vue3_components_button.AirButtonStyle,
			ButtonSize: () => ui_vue3_components_button.ButtonSize
		},
		beforeUnmount() {
			this.isUnmounting = true;
			this.destroyDialog();
		},
		methods: {
			canUseInSelector(item) {
				const selectorItem = getSelectorItemByAccessCode(item.entityId);
				if (!selectorItem) {
					return false;
				}
				return !(selectorItem[0] === 'project' && !this.isProjectEntityAvailable);
			},
			getPreselectedItems() {
				return this.items.filter(item => this.canUseInSelector(item)).map(item => getSelectorItemByAccessCode(item.entityId)).filter(Boolean);
			},
			getUndeselectedItems() {
				return this.items.filter(item => item.readOnly && this.canUseInSelector(item)).map(item => getSelectorItemByAccessCode(item.entityId)).filter(Boolean);
			},
			getUnmanagedCurrentItems() {
				return this.items.filter(item => !this.canUseInSelector(item)).map(item => ({
					entityId: item.entityId,
					title: item.title,
					avatar: item.avatar
				}));
			},
			getSelectionSignature(items) {
				return items.map(item => item.entityId).filter(Boolean).sort().join('|');
			},
			getSelectedMembers() {
				if (!this.dialog) {
					return [];
				}
				return this.dialog.getSelectedItems().map(item => {
					const entityId = getAccessCodeByDialogItem(item);
					if (!entityId) {
						return null;
					}
					return {
						entityId,
						title: item.getTitle(),
						avatar: item.getAvatar()
					};
				}).filter(Boolean);
			},
			getNextItems() {
				return [...this.getSelectedMembers(), ...this.getUnmanagedCurrentItems()];
			},
			emitSelectionChange() {
				const nextItems = this.getNextItems();
				if (this.getSelectionSignature(nextItems) === this.getSelectionSignature(this.items)) {
					return;
				}
				this.$emit('selectionChange', nextItems);
			},
			applySelection() {
				this.$emit('selectionApply', this.getNextItems());
			},
			getDialogEntities() {
				const entities = [{
					id: 'user',
					options: {
						inviteEmployeeLink: false,
						inviteGuestLink: true,
						selectFields: ['workDepartment']
					}
				}, {
					id: 'department',
					options: {
						selectMode: 'usersAndDepartments'
					}
				}];
				if (this.isProjectEntityAvailable) {
					entities.push({
						id: 'project'
					});
				}
				return entities;
			},
			initDialog() {
				if (this.dialog) {
					return;
				}
				const targetNode = this.getTargetNode();
				if (!targetNode) {
					return;
				}
				this.dialog = ui_vue3.markRaw(new ui_entitySelector.Dialog({
					id: 'disk-sharing-private-access-selector',
					targetNode,
					width: 420,
					height: 360,
					multiple: true,
					enableSearch: true,
					compactView: true,
					context: 'DISK_SHARING_PRIVATE_ACCESS',
					preselectedItems: this.getPreselectedItems(),
					undeselectedItems: this.getUndeselectedItems(),
					entities: this.getDialogEntities(),
					events: {
						'Item:onSelect': () => {
							if (!this.isUnmounting) {
								this.emitSelectionChange();
							}
						},
						'Item:onDeselect': () => {
							if (!this.isUnmounting) {
								this.emitSelectionChange();
							}
						},
						onHide: () => {
							if (!this.isUnmounting) {
								this.applySelection();
							}
						},
						onDestroy: () => {
							this.dialog = null;
						}
					}
				}));
			},
			destroyDialog() {
				if (!this.dialog) {
					return;
				}
				if (main_core.Type.isFunction(this.dialog.destroy)) {
					this.dialog.destroy();
				}
				this.dialog = null;
			},
			async openDialog() {
				if (this.isSaving) {
					return;
				}
				this.isProjectEntityAvailable = await main_core.Runtime.loadExtension('socialnetwork.entity-selector').then(() => true).catch(() => false);
				this.destroyDialog();
				this.initDialog();
				if (!this.dialog) {
					return;
				}
				const targetNode = this.getTargetNode();
				if (targetNode) {
					this.dialog.setTargetNode(targetNode);
				}
				this.dialog.show();
			},
			getTargetNode() {
				const buttonComponent = this.$refs.selectButton;
				if (!buttonComponent) {
					return null;
				}
				const button = buttonComponent.button;
				if (button && main_core.Type.isFunction(button.getContainer)) {
					return button.getContainer();
				}
				return buttonComponent.$el ?? buttonComponent;
			}
		},
		template: `
		<div class="access-private-add-employess_wrapper">
			<TextSm
				tag="div"
				className="access-private-add-employess__description"
			>
				${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_EMPLOYEES_LABEL')}
			</TextSm>
			<div class="access-private-add-employess__actions">
				<UiButton
					ref="selectButton"
					text="${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_EMPLOYEES_BUTTON')}"
					:size="ButtonSize.MEDIUM"
					:style="AirButtonStyle.OUTLINE_ACCENT_2"
					:disabled="isSaving"
					@click="openDialog"
				/>
			</div>
		</div>
		<div v-if="items.length" class="access-private-add-employess__selected">
			<div class="access-private-head__menu">
				<TextSm
					tag="p"
					className="access-private-head__user-title"
				>
					${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_USERS_NAME')}
				</TextSm>
				<TextSm
					tag="p"
					className="access-private-head__access-level"
				>
					${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_ACCESS_LEVEL')}
				</TextSm>
			</div>
			<div class="access-private-user__users-container">
				<PrivateUserItem
					v-for="item in items"
					:key="item.entityId"
					:title="item.title"
					:taskName="item.right"
					:maxTaskName="item.maxTaskName"
					:readOnly="item.readOnly"
					@changeRight="$emit('changeRight', { entityId: item.entityId, right: $event })"
				/>
			</div>
		</div>
	`
	};

	// @vue/component
	const PrivateAccessDescription = {
		name: 'PrivateAccessDescription',
		components: {
			TextXl: ui_system_typography_vue.TextXl
		},
		props: {
			isChangeSettings: {
				type: Boolean,
				required: true
			},
			selectedAccessId: {
				type: String
			},
			numberEmployees: {
				type: Number
			},
			entityType: {
				type: String,
				default: 'FILE'
			},
			canChangeRights: {
				type: Boolean,
				default: false
			},
			isSettingsBlocked: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			accessIdToText() {
				return ACCESS_PRIVATE_SELECT_FULL_TEXT[this.selectedAccessId];
			},
			privateDescriptionText() {
				if (this.isChangeSettings) {
					return main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_SELECT_ACCESS_PRIVATE_USERS');
				}
				if (this.numberEmployees > 0) {
					return main_core.Loc.getMessage(`DISK_SHARING_ACCESS_POPUP_EXTENDED_PRIVATE_DESCRIPTION_${this.entityType}`);
				}
				return main_core.Loc.getMessage(`DISK_SHARING_ACCESS_POPUP_DEFAULT_PRIVATE_DESCRIPTION_${this.accessIdToText}_${this.entityType}`);
			}
		},
		emits: ['changeSettings', 'blockedSettings', 'openDetails'],
		methods: {
			onChangeSettingsClick() {
				if (this.isSettingsBlocked) {
					this.$emit('blockedSettings');
					return;
				}
				this.$emit('changeSettings');
			},
			openHelpDesk() {
				helpDesk(HELP_DESK_SLIDER_CODE_DESCRIPTION, true);
			}
		},
		template: `
		<div class="access-private-block__description-wrapper">
			<TextXl
				tag="p"
				className="access-private-block__description-text"
			>
				{{ privateDescriptionText }}
			</TextXl>
		</div>
		<button
			v-if="!isChangeSettings && (canChangeRights || isSettingsBlocked)"
			@click="onChangeSettingsClick"
			class="access-private-block__open-settings"
			:class="{ 'access-private-block__open-settings--disabled': isSettingsBlocked }"
			:aria-disabled="isSettingsBlocked"
		>
			${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_CHANGE_BUTTON')}
		</button>
		<button
			v-if="isChangeSettings"
			@click="openHelpDesk"
			class="access-private-block__open-aside-popup"
		>
			${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_DETAILS_BUTTON')}
		</button>
	`
	};

	const PrivateAccessFullSettingsSwitcher = {
		name: 'PrivateAccessFullSettingsSwitcher',
		components: {
			TextXl: ui_system_typography_vue.TextXl
		},
		props: {
			isActive: {
				type: Boolean,
				required: true
			}
		},
		emits: ['toggle'],
		data() {
			return {
				switcher: null
			};
		},
		watch: {
			isActive(next) {
				if (!this.switcher) {
					return;
				}
				this.switcher.check(next);
			}
		},
		mounted() {
			this.initSwitcher();
		},
		beforeUnmount() {
			this.destroySwitcher();
		},
		methods: {
			initSwitcher() {
				if (this.switcher || !this.$refs.switcherNode) {
					return;
				}
				this.switcher = new ui_switcher.Switcher({
					node: this.$refs.switcherNode,
					checked: this.isActive,
					size: 'small',
					showStateTitle: false,
					useAirDesign: true,
					handlers: {
						toggled: () => {
							this.$emit('toggle', this.switcher.isChecked());
						}
					}
				});
			},
			destroySwitcher() {
				if (!this.switcher) {
					return;
				}
				if (main_core.Type.isFunction(this.switcher.destroy)) {
					this.switcher.destroy();
				}
				this.switcher = null;
			}
		},
		template: `
		<div class="access-private-switcher__wrapper">
			<div class="access-private-block__switcher" ref="switcherNode"></div>
			<TextXl
				tag="p"
				className="access-private-block__title"
			>
				${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_FULL_SETTINGS')}
			</TextXl>
		</div>
	`
	};

	// @vue/component
	const PrivateAccessCheckout = {
		name: 'PrivateAccessCheckout',
		components: {
			TextSm: ui_system_typography_vue.TextSm
		},
		props: {
			isDownload: {
				type: Boolean,
				required: true
			},
			isAllowControl: {
				type: Boolean,
				required: true
			}
		},
		emits: ['update:isAllowControl', 'update:isDownload'],
		methods: {
			onToggleIsAllowControl(event) {
				this.$emit('update:isAllowControl', event.target.checked);
			},
			onToggleIsDownload(event) {
				this.$emit('update:isDownload', event.target.checked);
			}
		},
		template: `
		<div class="access-private-checkout__wrapper">
			<div class="ui-ctl ui-ctl-checkbox ui-ctl-xs access-private-block__allow-control">
				<input
					type="checkbox"
					:checked="isAllowControl"
					@change="onToggleIsAllowControl"
				>
				<TextSm
					tag="label"
					className="access-private-block__access-control-label"
				>
					${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_CHECKOUT_ACCESS_CONTROL_LABEL')}
				</TextSm>
			</div>
			<div v-if="false" class="ui-ctl ui-ctl-checkbox ui-ctl-xs access-private-block__download-wrapper">
				<input
					class="ui-ctl-element"
					type="checkbox"
					:checked="isDownload"
					@change="onToggleIsDownload"
				>
				<TextSm
					tag="label"
					className="access-private-block__download-label"
				>
					${main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_PRIVATE_CHECKOUT_DOWNLOAD_LABEL')}
				</TextSm>
			</div>
		</div>
	`
	};

	const extensionSettings = main_core.Extension.getSettings('disk.sharing-access-popup');
	const membersAccessDisableReasons = extensionSettings.get('membersAccessDisableReasons', {});
	const limitSliders = extensionSettings.get('limitSliders', {});
	function cloneMembers(membersById) {
		const result = {};
		Object.keys(membersById).forEach(entityId => {
			result[entityId] = {
				...membersById[entityId]
			};
		});
		return result;
	}
	function getDefaultTaskName(maxTaskName = DEFAULT_MAX_TASK_NAME) {
		return TASK_WEIGHT[maxTaskName] >= TASK_WEIGHT[PREFERRED_DEFAULT_TASK_NAME] ? PREFERRED_DEFAULT_TASK_NAME : maxTaskName;
	}
	function getMembersDraftByIdFromAccessRights(accessRights) {
		const members = accessRights?.membersAccess?.members ?? [];
		const owner = accessRights?.membersAccess?.owner ?? {};
		const maxTaskName = owner.maxTaskName ?? DEFAULT_MAX_TASK_NAME;
		const readOnly = owner.canOnlyShare === true;
		return members.reduce((acc, member) => {
			acc[member.entityId] = {
				entityId: member.entityId,
				title: member.name,
				avatar: member.avatar,
				right: member.right,
				maxTaskName,
				readOnly
			};
			return acc;
		}, {});
	}
	function stringifyBoolean(value) {
		return String(value === true);
	}

	// @vue/component
	const SharingAccessPrivateSettings = {
		name: 'SharingAccessPrivateSettings',
		components: {
			PrivateAccessDescription,
			PrivateAccessSelect: AccessSelect,
			PrivateAccessFullSettingsSwitcher,
			PrivateAccessCheckout,
			PrivateAccessAddEmployess,
			AccessCopyLink
		},
		props: {
			accessRights: {
				type: Object,
				default: null
			},
			objectId: {
				type: [Number, String],
				required: true
			},
			entityType: {
				type: String,
				default: 'FILE'
			}
		},
		emits: ['reloadAccessRights'],
		data() {
			return {
				isChangeSettings: false,
				selectedAccessId: 'D',
				accessItems: ACCESS_PRIVATE_SELECT_ITEMS,
				isAccessRightsSaving: false,
				isActiveFullSettings: false,
				isDownload: false,
				isAllowControl: false,
				membersDraftById: {}
			};
		},
		computed: {
			getLink() {
				const unifiedLink = this.accessRights?.membersAccess?.unifiedLink;
				return unifiedLink?.link ?? '';
			},
			canChangeRights() {
				return this.accessRights?.membersAccess?.canChangeRights === true;
			},
			membersAccessDisableReason() {
				return this.accessRights?.membersAccessDisableReason ?? null;
			},
			isSettingsBlocked() {
				return this.membersAccessDisableReason === membersAccessDisableReasons.feature;
			},
			memberItems() {
				return Object.values(this.membersDraftById);
			},
			numberEmployees() {
				return this.memberItems.length;
			}
		},
		watch: {
			accessRights: {
				immediate: true,
				handler(next) {
					this.syncPrivateFlags(next);
					this.syncUnifiedLink(next);
					this.syncMembers(next);
				}
			}
		},
		methods: {
			getTariffSliderCode() {
				return limitSliders.membersAccessFileTariff;
			},
			handleBlockedPrivateSettings() {
				if (!this.isSettingsBlocked) {
					return;
				}
				helpDesk(this.getTariffSliderCode());
			},
			toggleSettings() {
				if (!this.canChangeRights) {
					return;
				}
				this.isChangeSettings = !this.isChangeSettings;
			},
			syncPrivateFlags(next) {
				this.isDownload = next?.allowDownloadingWithViewingRights === true;
				this.isAllowControl = next?.allowManagePublicAccessWithViewingRights === true;
			},
			syncUnifiedLink(next) {
				const currentAccessLevel = next?.membersAccess?.unifiedLink?.currentAccessLevel;
				if (currentAccessLevel && this.accessItems.some(item => item.id === currentAccessLevel)) {
					this.selectedAccessId = currentAccessLevel;
				}
			},
			syncMembers(next) {
				this.membersDraftById = getMembersDraftByIdFromAccessRights(next);
				if ((next?.membersAccess?.members?.length ?? 0) > 0) {
					this.isActiveFullSettings = true;
				}
			},
			async onFullSettingsToggle(next) {
				if (this.isAccessRightsSaving || next === this.isActiveFullSettings) {
					return;
				}
				if (next) {
					this.isActiveFullSettings = true;
					return;
				}
				const prevMembersDraftById = cloneMembers(this.membersDraftById);
				const prevIsActiveFullSettings = this.isActiveFullSettings;
				this.isActiveFullSettings = false;
				this.membersDraftById = {};
				try {
					await this.savePrivateRights();
				} catch {
					this.membersDraftById = prevMembersDraftById;
					this.isActiveFullSettings = prevIsActiveFullSettings;
				}
			},
			getMembersSignature(membersById) {
				return Object.values(membersById).map(member => `${member.entityId}:${member.right}`).sort().join('|');
			},
			buildMembersDraftById(items, sourceMembersById = this.membersDraftById) {
				const owner = this.accessRights?.membersAccess?.owner ?? {};
				const savedMembersById = getMembersDraftByIdFromAccessRights(this.accessRights);
				const maxTaskName = owner.maxTaskName ?? DEFAULT_MAX_TASK_NAME;
				const nextDraftById = {};
				items.forEach(item => {
					const existing = sourceMembersById[item.entityId] ?? savedMembersById[item.entityId];
					nextDraftById[item.entityId] = {
						entityId: item.entityId,
						title: item.title,
						avatar: item.avatar,
						right: existing?.right ?? getDefaultTaskName(maxTaskName),
						maxTaskName: existing?.maxTaskName ?? maxTaskName,
						readOnly: existing?.readOnly ?? false
					};
				});
				Object.values({
					...savedMembersById,
					...sourceMembersById
				}).forEach(member => {
					if (member.readOnly && !nextDraftById[member.entityId]) {
						nextDraftById[member.entityId] = member;
					}
				});
				return nextDraftById;
			},
			buildEntityToNewShared(unifiedAccessLevel = this.selectedAccessId) {
				const payload = {};
				if (this.accessRights?.membersAccess?.unifiedLink) {
					payload.unifiedLink = {
						newAccessLevel: unifiedAccessLevel
					};
				}
				Object.values(this.membersDraftById).forEach(member => {
					payload[member.entityId] = {
						right: member.right
					};
				});
				return payload;
			},
			buildSavePayload(unifiedAccessLevel = this.selectedAccessId) {
				return {
					entityToNewShared: this.buildEntityToNewShared(unifiedAccessLevel),
					allowDownloadingWithViewingRights: stringifyBoolean(this.isDownload),
					allowManagePublicAccessWithViewingRights: stringifyBoolean(this.isAllowControl)
				};
			},
			async savePrivateRights(unifiedAccessLevel = this.selectedAccessId) {
				if (this.isAccessRightsSaving) {
					return;
				}
				this.isAccessRightsSaving = true;
				try {
					await postAccessPrivateRights(this.objectId, this.buildSavePayload(unifiedAccessLevel));
					this.$emit('reloadAccessRights');
				} catch (error) {
					notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
					throw error;
				} finally {
					this.isAccessRightsSaving = false;
				}
			},
			async onAccessRights(next) {
				if (this.isAccessRightsSaving || next === this.selectedAccessId) {
					return;
				}
				const prev = this.selectedAccessId;
				this.selectedAccessId = next;
				try {
					await this.savePrivateRights(next);
				} catch {
					this.selectedAccessId = prev;
				}
			},
			async onMembersSelection(items) {
				if (this.isAccessRightsSaving) {
					return;
				}
				const prevSaved = getMembersDraftByIdFromAccessRights(this.accessRights);
				const nextDraftById = this.buildMembersDraftById(items);
				this.membersDraftById = nextDraftById;
				if (this.getMembersSignature(prevSaved) === this.getMembersSignature(nextDraftById)) {
					return;
				}
				try {
					await this.savePrivateRights();
				} catch {
					this.membersDraftById = prevSaved;
				}
			},
			onMembersSelectionChange(items) {
				if (this.isAccessRightsSaving) {
					return;
				}
				const nextDraftById = this.buildMembersDraftById(items);
				if (this.getMembersSignature(this.membersDraftById) === this.getMembersSignature(nextDraftById)) {
					return;
				}
				this.membersDraftById = nextDraftById;
			},
			async onMemberRightChange({
				entityId,
				right
			}) {
				if (this.isAccessRightsSaving) {
					return;
				}
				const prev = cloneMembers(this.membersDraftById);
				const current = prev[entityId];
				if (!current || current.readOnly || current.right === right) {
					return;
				}
				this.membersDraftById = {
					...this.membersDraftById,
					[entityId]: {
						...current,
						right
					}
				};
				try {
					await this.savePrivateRights();
				} catch {
					this.membersDraftById = prev;
				}
			},
			async updatePrivateFlag(flagName, value) {
				if (this.isAccessRightsSaving || this[flagName] === value) {
					return;
				}
				const prev = this[flagName];
				this[flagName] = value;
				try {
					await this.savePrivateRights();
				} catch {
					this[flagName] = prev;
				}
			},
			async onToggleDownload(value) {
				await this.updatePrivateFlag('isDownload', value);
			},
			async onToggleAllowControl(value) {
				await this.updatePrivateFlag('isAllowControl', value);
			}
		},
		template: `
		<div class="access-private-block__wrapper">
			<PrivateAccessDescription
				:isChangeSettings="isChangeSettings"
				:entityType="entityType"
				:selectedAccessId="selectedAccessId"
				:numberEmployees="numberEmployees"
				:canChangeRights="canChangeRights"
				:isSettingsBlocked="isSettingsBlocked"
				@changeSettings="toggleSettings"
				@blockedSettings="handleBlockedPrivateSettings"
			/>
			<PrivateAccessSelect
				v-if="isChangeSettings"
				:items="accessItems"
				variant="private"
				:selectedId="selectedAccessId"
				@select="onAccessRights"
				/>
			</div>
			<div v-if="isChangeSettings" class="access-private-full-settings__wrapper">
				<PrivateAccessFullSettingsSwitcher
					:isActive="isActiveFullSettings"
					@toggle="onFullSettingsToggle"
				/>
				<div v-if="isActiveFullSettings">
					<PrivateAccessAddEmployess
						:items="memberItems"
						:isSaving="isAccessRightsSaving"
						@selectionChange="onMembersSelectionChange"
						@selectionApply="onMembersSelection"
						@changeRight="onMemberRightChange"
					/>
					<PrivateAccessCheckout
						:isDownload="isDownload"
						@update:isDownload="onToggleDownload"
						:isAllowControl="isAllowControl"
						@update:isAllowControl="onToggleAllowControl"
					/>
				</div>
			</div>
		<div class="access-private-block__copy-link-wrapper">
			<AccessCopyLink :link="getLink" />
		</div>
	`
	};

	// @vue/compontents
	const SharingAccessLoader = {
		name: 'SharingAccessLoader',
		created() {
			this.loader = null;
		},
		mounted() {
			this.loader = new main_loader.Loader({
				target: this.$refs.container,
				size: 36,
				mode: 'inline'
			});
			this.loader.show();
		},
		beforeUnmount() {
			this.loader?.destroy();
			this.loader = null;
		},
		template: `
		<div class="disk-sharing-access-popup__loader">
			<span ref="container"></span>
		</div>
	`
	};

	// @vue/component
	const AnimateWrapper = {
		data() {
			return {
				observer: null,
				rafId: 0,
				isReady: false
			};
		},
		mounted() {
			const outer = this.$refs.outer;
			const inner = this.$refs.inner;
			this.observer = new ResizeObserver(([entry]) => {
				const nextHeight = Math.ceil(entry.contentRect.height);
				if (!this.isReady) {
					outer.style.height = `${nextHeight}px`;
					this.isReady = true;
					return;
				}
				const currentHeight = Math.ceil(outer.getBoundingClientRect().height);
				if (currentHeight === nextHeight) {
					return;
				}
				outer.classList.add('--animating');
				outer.style.height = `${currentHeight}px`;
				cancelAnimationFrame(this.rafId);
				this.rafId = requestAnimationFrame(() => {
					outer.style.height = `${nextHeight}px`;
				});
			});
			this.observer.observe(inner);
		},
		beforeUnmount() {
			cancelAnimationFrame(this.rafId);
			this.observer?.disconnect();
		},
		methods: {
			onTransitionEnd(event) {
				if (event.propertyName === 'height') {
					event.currentTarget.classList.remove('--animating');
				}
			}
		},
		template: `
			<div
				ref="outer"
				class="disk-sharing-access-popup__auto-height"
				@transitionend="onTransitionEnd"
			>
				<div ref="inner">
					<slot />
				</div>
			</div>
		`
	};

	// @vue/component
	const SharingAccessMainSettings = {
		name: 'SharingAccessState',
		components: {
			SharingAccessPublicSettings,
			SharingAccessPrivateSettings,
			SharingAccessLoader,
			AnimateWrapper
		},
		props: {
			isPublic: {
				type: Boolean,
				required: true
			},
			objectId: {
				type: [Number, String],
				required: true
			},
			uniqueCode: {
				type: String,
				default: null
			},
			initialAccessRights: {
				type: Object,
				default: null
			},
			mode: {
				type: String,
				default: 'default'
			},
			closeDialog: {
				type: Function,
				required: true
			}
		},
		data() {
			return {
				accessRights: this.initialAccessRights,
				accessRightsLoading: this.initialAccessRights === null
			};
		},
		computed: {
			entityType() {
				const typeFile = this.accessRights?.typeFile;
				if (typeFile === null) {
					return 'FOLDER';
				}
				switch (Number(typeFile)) {
					case TYPE_FILE_DOCUMENT:
						return 'DOCUMENT';
					case TYPE_FILE_BOARD:
						return 'BOARD';
					default:
						return 'FILE';
				}
			}
		},
		mounted() {
			if (this.accessRightsLoading) {
				this.loadAccessRights();
			}
		},
		methods: {
			async loadAccessRights() {
				try {
					this.accessRights = await getAccessRights({
						objectId: this.objectId,
						uniqueCode: this.uniqueCode
					});
				} catch {
					notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
					this.closeDialog();
				} finally {
					this.accessRightsLoading = false;
				}
			},
			applyPublicLink(publicLink) {
				if (!this.accessRights) {
					return;
				}
				this.accessRights = {
					...this.accessRights,
					publicLink
				};
			}
		},
		template: `
		<SharingAccessLoader v-if="accessRightsLoading"/>
		<div v-else-if="accessRights" class="disk-sharing-access-popup__state">
			<AnimateWrapper>
				<SharingAccessPublicSettings
					:objectId="objectId"
					:accessRights="accessRights"
					:uniqueCode="uniqueCode"
					:isPublic="isPublic"
					:entityType="entityType"
					@publicLinkChange="applyPublicLink"
				/>
				<SharingAccessPrivateSettings 
					v-if="!isPublic"
					:accessRights="accessRights"
					:objectId="objectId"
					:entityType="entityType"
					@reloadAccessRights="loadAccessRights"
				/>
			</AnimateWrapper>
		</div>
	`
	};

	// @vue/component
	const RootApp = {
		name: 'SharingAccessRoot',
		components: {
			SharingAccessWrapper,
			SharingAccessButtons,
			SharingAccessMainSettings
		},
		props: {
			objectId: {
				type: [Number, String],
				required: true
			},
			uniqueCode: {
				type: String,
				default: null
			},
			initialTab: {
				type: String,
				default: null
			},
			initialAccessRights: {
				type: Object,
				default: null
			},
			mode: {
				type: String,
				default: 'default'
			},
			closeDialog: {
				type: Function,
				required: true
			}
		},
		data() {
			return {
				isPublic: this.initialTab === 'public'
			};
		},
		template: `
		<SharingAccessWrapper>
			<SharingAccessButtons v-model:isPublic="isPublic" />
			<SharingAccessMainSettings
				:objectId="objectId"
				:uniqueCode="uniqueCode"
				:initialAccessRights="initialAccessRights"
				:mode="mode"
				:closeDialog="closeDialog"
				v-model:isPublic="isPublic"
			/>
		</SharingAccessWrapper>
	`
	};

	class SharingPopupDialog {
		#dialog = null;
		#app = null;
		#container = null;
		#objectId = null;
		#uniqueCode = null;
		#initialTab = null;
		#mode = 'default';
		#onAfterHide = null;
		#initialAccessRights = null;
		async open(params = {}) {
			this.#objectId = params.objectId;
			this.#uniqueCode = params.uniqueCode ?? null;
			this.#initialTab = params.initialTab ?? null;
			this.#mode = params.mode ?? 'default';
			this.#onAfterHide = params.onAfterHide ?? null;
			if (!this.#objectId) {
				throw new Error('SharingPopupDialog.open: objectId is required');
			}
			try {
				this.#initialAccessRights = await getAccessRights({
					objectId: this.#objectId,
					uniqueCode: this.#uniqueCode
				});
			} catch {
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
				return;
			}
			if (!this.#dialog) {
				this.#container = main_core.Tag.render`<div class="disk-sharing-access-popup__content"></div>`;
				this.#dialog = new ui_system_dialog.Dialog({
					title: main_core.Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_DIALOG_TITLE'),
					content: this.#container,
					width: 550,
					hasOverlay: true,
					background: ui_system_dialog.DialogBackground.vibrant,
					events: {
						onAfterShow: () => this.#markPopup(),
						onAfterHide: () => {
							this.#runAfterHide();
							this.#reset();
						}
					}
				});
			}
			if (!this.#app) {
				this.#mount();
			}
			this.#dialog.show();
		}
		#markPopup() {
			const popup = this.#container?.closest('.popup-window');
			if (popup) {
				main_core.Dom.addClass(popup, 'disk-sharing-access-popup');
			}
		}
		close() {
			this.#dialog?.hide();
		}
		#mount() {
			this.#app = ui_vue3.BitrixVue.createApp(RootApp, {
				objectId: this.#objectId,
				uniqueCode: this.#uniqueCode,
				initialTab: this.#initialTab,
				initialAccessRights: this.#initialAccessRights,
				mode: this.#mode,
				closeDialog: this.close.bind(this)
			});
			this.#app.mount(this.#container);
		}
		#runAfterHide() {
			if (typeof this.#onAfterHide === 'function') {
				this.#onAfterHide();
			}
		}
		#unmount() {
			if (this.#app) {
				this.#app.unmount();
				this.#app = null;
				this.#uniqueCode = null;
				this.#initialTab = null;
				this.#initialAccessRights = null;
				this.#mode = 'default';
			}
		}
		#reset() {
			this.#unmount();
			this.#dialog = null;
			this.#container = null;
			this.#objectId = null;
			this.#initialTab = null;
			this.#initialAccessRights = null;
			this.#mode = 'default';
			this.#onAfterHide = null;
		}
	}

	exports.SharingPopupDialog = SharingPopupDialog;

})(this.BX.Disk = this.BX.Disk || {}, BX, BX.UI.System, BX.Vue3, BX.Vue3.Components, BX.UI.IconSet, BX.UI, BX.UI.IconSet, window, BX.UI.System.Input.Vue, BX.UI.System.Menu, BX.UI.DatePicker, BX.UI.System.Typography.Vue, BX.Main, BX.UI, BX.UI.EntitySelector, BX);
//# sourceMappingURL=sharing-popup.bundle.js.map
