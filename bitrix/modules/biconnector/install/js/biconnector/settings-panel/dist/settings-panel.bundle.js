/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, date, ui_designTokens, ui_notification, main_popup, ui_datePicker, ui_buttons, ui_countdown, ui_hint, ui_switcher, ui_system_input) {
	'use strict';

	const USER_OPTION_CATEGORY = 'biconnector';
	const USER_OPTION_NAME = 'settings_panel_collapsed';
	class CollapsibleCard {
		#options;
		#container = null;
		#contentWrapper = null;
		#collapsed;
		constructor(options) {
			this.#options = options;
			this.#collapsed = options.collapsed ?? false;
		}
		getLayout() {
			if (this.#container) {
				return this.#container;
			}
			const chevronIcon = main_core.Tag.render`
			<div class="biconnector-settings-card__chevron-wrapper">
				<div class="ui-icon-set --chevron-top-m biconnector-settings-card__chevron"></div>
			</div>
		`;
			this.#contentWrapper = main_core.Tag.render`
			<div class="biconnector-settings-card__content"></div>
		`;
			const header = main_core.Tag.render`
			<div class="biconnector-settings-card__header">
				<div class="ui-icon-set ${this.#options.iconClass} biconnector-settings-card__icon"></div>
				<div class="biconnector-settings-card__title">${this.#options.title}</div>
				${chevronIcon}
			</div>
		`;
			this.#container = main_core.Tag.render`
			<div class="biconnector-settings-card" data-card-id="${this.#options.id}">
				${header}
				${this.#contentWrapper}
			</div>
		`;
			main_core.Event.bind(header, 'click', this.#toggle.bind(this));
			if (this.#collapsed) {
				main_core.Dom.addClass(this.#container, '--collapsed');
			}
			return this.#container;
		}
		getContentContainer() {
			if (!this.#contentWrapper) {
				this.getLayout();
			}
			return this.#contentWrapper;
		}
		isCollapsed() {
			return this.#collapsed;
		}
		#toggle() {
			this.#collapsed = !this.#collapsed;
			if (this.#collapsed) {
				main_core.Dom.addClass(this.#container, '--collapsed');
			} else {
				main_core.Dom.removeClass(this.#container, '--collapsed');
			}
			this.#persistState();
		}
		#persistState() {
			BX.userOptions?.save(USER_OPTION_CATEGORY, USER_OPTION_NAME, this.#options.id, this.#collapsed ? 'Y' : 'N');
		}
	}

	class CardHint {
		#options;
		#container = null;
		constructor(options) {
			this.#options = options;
		}
		getLayout() {
			if (this.#container) {
				return this.#container;
			}
			this.#container = main_core.Tag.render`
			<div class="biconnector-settings-card-hint">
				<span class="biconnector-settings-card-hint__text">
					${main_core.Text.encode(this.#options.text)}
				</span>
			</div>
		`;
			if (this.#options.link) {
				const link = main_core.Tag.render`
				<a class="biconnector-settings-card-hint__link">
					${main_core.Text.encode(this.#options.link.text)}
				</a>
			`;
				const helpCode = this.#options.link.helpCode;
				main_core.Event.bind(link, 'click', e => {
					e.preventDefault();
					top?.BX?.Helper?.show(`redirect=detail&code=${helpCode}`);
				});
				const textNode = this.#container.querySelector('.biconnector-settings-card-hint__text');
				if (textNode) {
					textNode.append(' ');
					main_core.Dom.append(link, textNode);
				}
			}
			return this.#container;
		}
	}

	class SettingsApi {
		static clearCache() {
			return main_core.ajax.runAction('biconnector.superset.clearCache');
		}
		static changeBiToken(componentName, signedParameters) {
			return main_core.ajax.runComponentAction(componentName, 'changeBiToken', {
				mode: 'class',
				signedParameters
			});
		}
		static getDashboardLanguage(componentName, signedParameters) {
			return main_core.ajax.runComponentAction(componentName, 'getDashboardLanguage', {
				mode: 'class',
				signedParameters
			});
		}
		static getTimeZone(componentName, signedParameters) {
			return main_core.ajax.runComponentAction(componentName, 'getTimeZone', {
				mode: 'class',
				signedParameters
			});
		}
		static savePeriodFilter(componentName, signedParameters, data) {
			return main_core.ajax.runComponentAction(componentName, 'savePeriodFilter', {
				mode: 'class',
				signedParameters,
				data: {
					data
				}
			});
		}
		static saveDatasetTyping(componentName, signedParameters, enabled) {
			return main_core.ajax.runComponentAction(componentName, 'saveDatasetTyping', {
				mode: 'class',
				signedParameters,
				data: {
					newTypingValue: enabled ? 'Y' : 'N'
				}
			});
		}
	}

	const RANGE_VALUE = 'range';
	const SAVE_DEBOUNCE_MS = 500;
	class PeriodFilterCard {
		#card;
		#data;
		#componentName;
		#signedParameters;
		#fieldElement = null;
		#fieldValueElement = null;
		#menu = null;
		#rangeBlock = null;
		#startInput = null;
		#endInput = null;
		#contentContainer = null;
		#currentPeriod;
		#datePicker = null;
		#saveTimerId = null;
		constructor(data, componentName, signedParameters, options = {}) {
			this.#data = data;
			this.#currentPeriod = data.currentPeriod;
			this.#componentName = componentName;
			this.#signedParameters = signedParameters;
			this.#card = new CollapsibleCard({
				id: 'period-filter',
				title: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_PERIOD_TITLE') ?? '',
				iconClass: '--o-calendar-with-slots',
				collapsed: options.collapsed
			});
		}
		getLayout() {
			const layout = this.#card.getLayout();
			this.#contentContainer = this.#card.getContentContainer();
			const hint = new CardHint({
				text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_PERIOD_HINT') ?? '',
				link: {
					text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LINK_MORE') ?? '',
					helpCode: '20337242'
				}
			});
			main_core.Dom.append(hint.getLayout(), this.#contentContainer);
			this.#buildSelect();
			this.#buildRangeFields();
			return layout;
		}
		#buildSelect() {
			this.#fieldValueElement = main_core.Tag.render`
			<span class="biconnector-settings-period__select-text"></span>
		`;
			this.#updateFieldLabel();
			const control = main_core.Tag.render`
			<div class="biconnector-settings-period__select" tabindex="0">
				${this.#fieldValueElement}
			</div>
		`;
			this.#fieldElement = main_core.Tag.render`
			<div class="biconnector-settings-period__select-wrapper">
				${control}
				<div class="ui-icon-set --chevron-down-s biconnector-settings-period__select-arrow"></div>
			</div>
		`;
			main_core.Event.bind(this.#fieldElement, 'click', () => {
				this.#toggleMenu();
			});
			main_core.Event.bind(control, 'keydown', event => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					this.#toggleMenu();
				}
			});
			main_core.Dom.append(this.#fieldElement, this.#contentContainer);
		}
		#updateFieldLabel() {
			if (!this.#fieldValueElement) {
				return;
			}
			const current = this.#data.items.find(item => item.value === this.#currentPeriod);
			if (!current) {
				this.#fieldValueElement.textContent = '';
				return;
			}
			if (current.isHtml) {
				this.#fieldValueElement.innerHTML = current.name;
			} else {
				this.#fieldValueElement.textContent = current.name;
			}
		}
		#toggleMenu() {
			if (this.#menu && this.#menu.getPopupWindow().isShown()) {
				this.#menu.close();
				return;
			}
			this.#openMenu();
		}
		#openMenu() {
			if (this.#menu) {
				this.#menu.destroy();
				this.#menu = null;
			}
			const items = this.#data.items.map(item => {
				const itemOptions = {
					attrs: {},
					className: item.value === this.#currentPeriod ? 'menu-popup-no-icon biconnector-settings-period__menu-item --selected' : 'menu-popup-no-icon biconnector-settings-period__menu-item',
					onclick: () => {
						this.#selectPeriod(item.value);
						this.#menu?.close();
						return {};
					}
				};
				if (item.isHtml) {
					itemOptions.html = item.name;
				} else {
					itemOptions.text = item.name;
				}
				return itemOptions;
			});
			const menu = main_popup.MenuManager.create({
				id: `biconnector-settings-period-menu-${this.#componentName}`,
				bindElement: this.#fieldElement,
				items,
				minWidth: this.#fieldElement ? this.#fieldElement.offsetWidth : 0,
				closeByEsc: true,
				angle: false,
				cacheable: false,
				navigationOptions: {
					initialFocusPosition: 'first'
				}
			});
			this.#menu = menu;
			menu.show();
		}
		#selectPeriod(value) {
			if (value === this.#currentPeriod) {
				return;
			}
			this.#currentPeriod = value;
			this.#updateFieldLabel();
			this.#toggleRange();
			this.#scheduleSave();
		}
		#buildRangeFields() {
			this.#startInput = main_core.Tag.render`
			<input
				type="text"
				class="biconnector-settings-period__date-input"
				value="${main_core.Text.encode(this.#data.dateStart)}"
			>
		`;
			this.#endInput = main_core.Tag.render`
			<input
				type="text"
				class="biconnector-settings-period__date-input"
				value="${main_core.Text.encode(this.#data.dateEnd)}"
			>
		`;
			const initialDates = [];
			if (this.#data.dateStart) {
				initialDates.push(this.#data.dateStart);
			}
			if (this.#data.dateEnd) {
				initialDates.push(this.#data.dateEnd);
			}
			this.#datePicker = new ui_datePicker.DatePicker({
				targetNode: this.#startInput,
				selectionMode: 'range',
				rangeStartInput: this.#startInput,
				rangeEndInput: this.#endInput,
				selectedDates: initialDates
			});
			main_core.Event.bind(this.#startInput, 'click', () => {
				this.#datePicker.setTargetNode(this.#startInput);
				this.#datePicker.show();
			});
			main_core.Event.bind(this.#endInput, 'click', () => {
				this.#datePicker.setTargetNode(this.#endInput);
				this.#datePicker.show();
			});
			this.#datePicker.subscribe(ui_datePicker.DatePickerEvent.BEFORE_DAY_SELECT, event => {
				const picker = this.#datePicker;
				if (!picker) {
					return;
				}
				if (picker.getSelectedDates().length === 2) {
					event.preventDefault();
					picker.deselectAll();
					picker.selectRange(event.getData().date);
				}
			});
			this.#datePicker.subscribe(ui_datePicker.DatePickerEvent.SELECT_CHANGE, () => {
				if (this.#datePicker.getSelectedDates().length === 2) {
					this.#datePicker.hide();
					this.#scheduleSave();
				}
			});
			this.#rangeBlock = main_core.Tag.render`
			<div class="biconnector-settings-period__range">
				<div class="biconnector-settings-period__range-field">
					<div class="biconnector-settings-period__range-label">
						${main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_PERIOD_FROM') ?? ''}
					</div>
					<div class="biconnector-settings-period__date-wrapper">
						<div class="ui-icon-set --o-calendar-empty biconnector-settings-period__date-icon"></div>
						${this.#startInput}
					</div>
				</div>
				<div class="biconnector-settings-period__range-divider"></div>
				<div class="biconnector-settings-period__range-field">
					<div class="biconnector-settings-period__range-label">
						${main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_PERIOD_TO') ?? ''}
					</div>
					<div class="biconnector-settings-period__date-wrapper">
						<div class="ui-icon-set --o-calendar-empty biconnector-settings-period__date-icon"></div>
						${this.#endInput}
					</div>
				</div>
			</div>
		`;
			main_core.Dom.append(this.#rangeBlock, this.#contentContainer);
			this.#toggleRange();
		}
		#toggleRange() {
			if (!this.#rangeBlock) {
				return;
			}
			if (this.#currentPeriod === RANGE_VALUE) {
				main_core.Dom.removeClass(this.#rangeBlock, '--hidden');
			} else {
				main_core.Dom.addClass(this.#rangeBlock, '--hidden');
			}
		}
		#scheduleSave() {
			if (this.#saveTimerId !== null) {
				window.clearTimeout(this.#saveTimerId);
			}
			this.#saveTimerId = window.setTimeout(() => {
				this.#saveTimerId = null;
				void this.#save();
			}, SAVE_DEBOUNCE_MS);
		}
		async #save() {
			const data = {
				FILTER_PERIOD: this.#currentPeriod
			};
			if (this.#currentPeriod === RANGE_VALUE) {
				const startFieldName = this.#data.dateStartFieldName ?? 'DATE_FILTER_START';
				const endFieldName = this.#data.dateEndFieldName ?? 'DATE_FILTER_END';
				data[startFieldName] = this.#startInput?.value ?? '';
				data[endFieldName] = this.#endInput?.value ?? '';
			}
			try {
				await SettingsApi.savePeriodFilter(this.#componentName, this.#signedParameters, data);
				BX.UI?.SidePanel?.Wrapper?.reloadGridOnParentPage?.();
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_PERIOD_SAVED'),
					autoHideDelay: 2000
				});
			} catch {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_SAVE_ERROR'),
					autoHideDelay: 2000
				});
			}
		}
	}

	class LanguageTimezoneCard {
		#card;
		#data;
		#componentName;
		#signedParameters;
		#languageValue = null;
		#timezoneValue = null;
		constructor(data, componentName, signedParameters, options = {}) {
			this.#data = data;
			this.#componentName = componentName;
			this.#signedParameters = signedParameters;
			this.#card = new CollapsibleCard({
				id: 'language-timezone',
				title: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LANG_TZ_TITLE') ?? '',
				iconClass: '--o-earth',
				collapsed: options.collapsed
			});
		}
		getLayout() {
			const layout = this.#card.getLayout();
			const content = this.#card.getContentContainer();
			const hint = new CardHint({
				text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LANG_TZ_HINT') ?? ''
			});
			main_core.Dom.append(hint.getLayout(), content);
			this.#languageValue = main_core.Tag.render`
			<span class="biconnector-settings-lang-tz__value">${this.#data.currentLanguage}</span>
		`;
			this.#timezoneValue = main_core.Tag.render`
			<span class="biconnector-settings-lang-tz__value">${this.#data.currentTimeZone}</span>
		`;
			const infoBlock = main_core.Tag.render`
			<div class="biconnector-settings-lang-tz__info">
				<div class="biconnector-settings-lang-tz__row">
					<span class="biconnector-settings-lang-tz__label">
						${main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LANG_TZ_LANGUAGE') ?? ''}
					</span>
					${this.#languageValue}
				</div>
				<div class="biconnector-settings-lang-tz__row">
					<span class="biconnector-settings-lang-tz__label">
						${main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LANG_TZ_TIMEZONE') ?? ''}
					</span>
					${this.#timezoneValue}
				</div>
			</div>
		`;
			main_core.Dom.append(infoBlock, content);
			const button = new ui_buttons.Button({
				text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LANG_TZ_BUTTON') ?? '',
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE_ACCENT_2,
				size: ui_buttons.ButtonSize.SMALL,
				icon: 'o-settings',
				onclick: () => {
					this.#openSettings();
				}
			});
			const buttonContainer = main_core.Tag.render`
			<div class="biconnector-settings-card__action-row"></div>
		`;
			button.renderTo(buttonContainer);
			main_core.Dom.append(buttonContainer, content);
			return layout;
		}
		#openSettings() {
			this.#suppressIntranetReloadAfterClose();
			top.BX.SidePanel.Instance.open(this.#data.settingsUrl, {
				cacheable: false,
				width: 1034,
				events: {
					onCloseComplete: () => {
						void this.#refreshData();
					}
				}
			});
		}
		#suppressIntranetReloadAfterClose() {
			const hostBX = top?.BX;
			const HostEmitter = hostBX?.Event?.EventEmitter;
			if (!HostEmitter) {
				return;
			}
			HostEmitter.subscribeOnce(HostEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onLoad', baseEvent => {
				const slider = baseEvent.getTarget();
				const innerBX = slider?.getWindow?.()?.BX;
				const InnerEmitter = innerBX?.Event?.EventEmitter;
				if (!InnerEmitter) {
					return;
				}
				InnerEmitter.subscribeOnce(InnerEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onSuccessSave', innerEvent => {
					const extraSettings = innerEvent.getData();
					if (extraSettings && typeof extraSettings === 'object') {
						extraSettings.reloadAfterClose = false;
					}
				});
			});
		}
		async #refreshData() {
			try {
				const [langResponse, tzResponse] = await Promise.all([SettingsApi.getDashboardLanguage(this.#componentName, this.#signedParameters), SettingsApi.getTimeZone(this.#componentName, this.#signedParameters)]);
				const language = langResponse.data?.currentLanguage;
				if (main_core.Type.isStringFilled(language) && this.#languageValue) {
					this.#languageValue.textContent = language;
				}
				const timeZone = tzResponse.data?.currentTimeZone;
				if (main_core.Type.isStringFilled(timeZone) && this.#timezoneValue) {
					this.#timezoneValue.textContent = timeZone;
				}
			} catch {
			}
		}
	}

	class ClearCacheCard {
		#card;
		#button = null;
		#canClear;
		#timeout;
		#hint = null;
		constructor(data, options = {}) {
			this.#canClear = data.canClearCache;
			this.#timeout = data.clearCacheTimeout ?? 0;
			this.#card = new CollapsibleCard({
				id: 'clear-cache',
				title: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_TITLE') ?? '',
				iconClass: '--o-refresh',
				collapsed: options.collapsed
			});
		}
		getLayout() {
			const layout = this.#card.getLayout();
			const content = this.#card.getContentContainer();
			const hint = new CardHint({
				text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_HINT') ?? '',
				link: {
					text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LINK_MORE') ?? '',
					helpCode: '21000502'
				}
			});
			main_core.Dom.append(hint.getLayout(), content);
			this.#button = new ui_buttons.Button({
				text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_BUTTON') ?? '',
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE_ACCENT_2,
				size: ui_buttons.ButtonSize.SMALL,
				icon: 'o-refresh',
				onclick: () => {
					this.#clearCache();
				}
			});
			if (!this.#canClear) {
				this.#button.setDisabled(true);
				this.#initCountdown();
			}
			const buttonContainer = main_core.Tag.render`
			<div class="biconnector-settings-card__action-row"></div>
		`;
			this.#button.renderTo(buttonContainer);
			main_core.Dom.append(buttonContainer, content);
			this.#initButtonHint();
			return layout;
		}
		#initButtonHint() {
			if (!this.#button) {
				return;
			}
			const node = this.#button.getContainer();
			this.#hint = BX.UI.Hint.createInstance({
				popupParameters: {
					offsetLeft: -60,
					angle: {
						offset: 160
					}
				}
			});
			main_core.Event.bind(node, 'mouseenter', () => {
				if (this.#timeout > 0) {
					node.setAttribute('data-hint-no-icon', '');
					const minutesLeft = Math.ceil(this.#timeout / 60);
					this.#hint.show(node, main_core.Loc.getMessagePlural('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_HINT_TIME_LEFT', minutesLeft, {
						'#COUNT#': String(minutesLeft)
					}));
				}
			});
			main_core.Event.bind(node, 'mouseleave', () => {
				this.#hint.hide(node);
			});
		}
		async #clearCache() {
			if (!this.#canClear || !this.#button) {
				return;
			}
			this.#setButtonSpinning(true);
			this.#canClear = false;
			try {
				const response = await SettingsApi.clearCache();
				this.#setButtonSpinning(false);
				this.#button.setDisabled(true);
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_SUCCESS'),
					autoHideDelay: 2000
				});
				this.#timeout = response.data.timeoutToNextClearCache;
				this.#initCountdown();
			} catch {
				this.#setButtonSpinning(false);
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_CLEAR_CACHE_ERROR'),
					autoHideDelay: 2000
				});
				this.#button.setDisabled(false);
				this.#canClear = true;
			}
		}
		#setButtonSpinning(spinning) {
			if (!this.#button) {
				return;
			}
			const icon = this.#button.getContainer().querySelector('.ui-icon-set');
			if (icon) {
				main_core.Dom.toggleClass(icon, 'biconnector-settings-card__icon--spinning', spinning);
			}
		}
		#initCountdown() {
			if (this.#timeout <= 0) {
				return;
			}
			new ui_countdown.Countdown({
				seconds: this.#timeout,
				onTimerEnd: () => {
					this.#canClear = true;
					this.#button?.setDisabled(false);
				},
				onTimerUpdate: data => {
					this.#timeout = data.seconds;
				}
			});
		}
	}

	class DatasetTypingCard {
		#card;
		#data;
		#enabled;
		#componentName;
		#signedParameters;
		#switcher = null;
		constructor(data, componentName, signedParameters, options = {}) {
			this.#data = data;
			this.#enabled = data.enabled;
			this.#componentName = componentName;
			this.#signedParameters = signedParameters;
			this.#card = new CollapsibleCard({
				id: 'dataset-typing',
				title: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_DATASET_TYPING_TITLE') ?? '',
				iconClass: '--o-database',
				collapsed: options.collapsed
			});
		}
		getLayout() {
			const layout = this.#card.getLayout();
			const content = this.#card.getContentContainer();
			const hint = new CardHint({
				text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_DATASET_TYPING_HINT') ?? ''
			});
			main_core.Dom.append(hint.getLayout(), content);
			const switcherNode = main_core.Tag.render`
			<div class="biconnector-settings-card__switcher-control"></div>
		`;
			this.#switcher = new ui_switcher.Switcher({
				node: switcherNode,
				size: ui_switcher.SwitcherSize.large,
				useAirDesign: true,
				checked: this.#enabled,
				disabled: this.#data.locked,
				handlers: {
					toggled: () => {
						if (this.#data.locked) {
							return;
						}
						this.#enabled = !this.#enabled;
						void this.#save();
					}
				}
			});
			const optionRow = main_core.Tag.render`
			<div class="biconnector-settings-card__option-row">
				${switcherNode}
				<span class="biconnector-settings-card__option-label">
					${main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_DATASET_TYPING_TOGGLE') ?? ''}
				</span>
			</div>
		`;
			main_core.Dom.append(optionRow, content);
			return layout;
		}
		async #save() {
			try {
				await SettingsApi.saveDatasetTyping(this.#componentName, this.#signedParameters, this.#enabled);
			} catch {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_SAVE_ERROR'),
					autoHideDelay: 2000
				});
				this.#enabled = !this.#enabled;
				this.#switcher?.check(this.#enabled, false);
			}
		}
	}

	class EncryptionKeyCard {
		#card;
		#key;
		#componentName;
		#signedParameters;
		#keyField = null;
		#refreshButton = null;
		constructor(data, componentName, signedParameters, options = {}) {
			this.#key = data.key;
			this.#componentName = componentName;
			this.#signedParameters = signedParameters;
			this.#card = new CollapsibleCard({
				id: 'encryption-key',
				title: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_TITLE') ?? '',
				iconClass: '--o-key',
				collapsed: options.collapsed
			});
		}
		getLayout() {
			const layout = this.#card.getLayout();
			const content = this.#card.getContentContainer();
			const hint = new CardHint({
				text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_HINT') ?? '',
				link: {
					text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_LINK_MORE') ?? '',
					helpCode: '20337242'
				}
			});
			main_core.Dom.append(hint.getLayout(), content);
			this.#keyField = new ui_system_input.PasswordInput({
				value: this.#key,
				copyable: true,
				stretched: true
			});
			const fieldElement = this.#keyField.render();
			main_core.Dom.addClass(fieldElement, 'biconnector-settings-key__field');
			this.#lockInput(fieldElement);
			main_core.Dom.append(fieldElement, content);
			this.#refreshButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_REFRESH') ?? '',
				useAirDesign: true,
				style: ui_buttons.AirButtonStyle.OUTLINE_ACCENT_2,
				size: ui_buttons.ButtonSize.SMALL,
				icon: 'o-refresh',
				onclick: () => {
					void this.#refreshKey();
				}
			});
			const buttonsRow = main_core.Tag.render`
			<div class="biconnector-settings-card__action-row"></div>
		`;
			this.#refreshButton.renderTo(buttonsRow);
			main_core.Dom.append(buttonsRow, content);
			return layout;
		}
		#lockInput(fieldElement) {
			const input = fieldElement.querySelector('input');
			if (input) {
				input.readOnly = true;
			}
		}
		async #refreshKey() {
			this.#setRefreshSpinning(true);
			try {
				const response = await SettingsApi.changeBiToken(this.#componentName, this.#signedParameters);
				const newKey = response.data;
				if (!newKey) {
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_REFRESH_ERROR'),
						autoHideDelay: 2000
					});
					return;
				}
				this.#key = newKey;
				this.#keyField?.setValue(newKey);
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_REFRESHED'),
					autoHideDelay: 2000
				});
			} catch {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SETTINGS_PANEL_KEY_REFRESH_ERROR'),
					autoHideDelay: 2000
				});
			} finally {
				this.#setRefreshSpinning(false);
			}
		}
		#setRefreshSpinning(spinning) {
			if (!this.#refreshButton) {
				return;
			}
			const icon = this.#refreshButton.getContainer().querySelector('.ui-icon-set');
			if (icon) {
				main_core.Dom.toggleClass(icon, 'biconnector-settings-card__icon--spinning', spinning);
			}
		}
	}

	class SettingsPanel {
		#container;
		#cards;
		constructor(options) {
			this.#container = options.container;
			this.#cards = options.cards;
		}
		render() {
			const list = main_core.Tag.render`
			<div class="biconnector-settings-panel__card-list"></div>
		`;
			for (const card of this.#cards) {
				main_core.Dom.append(card.getLayout(), list);
			}
			main_core.Dom.append(list, this.#container);
			this.#installChromiumScrollFreezeWorkaround();
		}
		#installChromiumScrollFreezeWorkaround() {
			const topBX = top?.BX;
			const TopEmitter = topBX?.Event?.EventEmitter;
			if (!TopEmitter) {
				return;
			}
			TopEmitter.subscribe(TopEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onCloseComplete', () => {
				const body = document.body;
				if (!body) {
					return;
				}
				body.style.overflow = 'hidden';
				void body.offsetHeight;
				body.style.overflow = '';
				window.dispatchEvent(new Event('resize'));
			});
		}
	}

	exports.CardHint = CardHint;
	exports.ClearCacheCard = ClearCacheCard;
	exports.CollapsibleCard = CollapsibleCard;
	exports.DatasetTypingCard = DatasetTypingCard;
	exports.EncryptionKeyCard = EncryptionKeyCard;
	exports.LanguageTimezoneCard = LanguageTimezoneCard;
	exports.PeriodFilterCard = PeriodFilterCard;
	exports.SettingsApi = SettingsApi;
	exports.SettingsPanel = SettingsPanel;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX, BX, BX.UI.Notification, BX.Main, BX.UI.DatePicker, BX.UI, BX.UI, BX.UI, BX.UI, BX.UI.System.Input);
//# sourceMappingURL=settings-panel.bundle.js.map
