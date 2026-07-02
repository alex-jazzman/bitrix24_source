/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
(function (exports, main_core_events, main_core, biconnector_apacheSupersetAnalytics, ui_iconSet_main, ui_designTokens, ui_buttons, ui_notification, ui_forms, ui_countdown, biconnector_dashboardParametersSelector, main_loader, main_pageobject, ui_switcher) {
	'use strict';

	/* eslint-disable no-underscore-dangle */
	const SidePanel = BX.SidePanel;
	class SettingController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			this.analytic = settings.config?.dashboardAnalyticInfo ?? {};
			main_core_events.EventEmitter.subscribeOnce('BX.UI.EntityEditor:onInit', event => {
				const [editor] = event.getData();
				editor?._toolPanel.disableSaveButton();
				this.tryFocusSection(editor);
			});
			main_core_events.EventEmitter.subscribeOnce('BX.UI.EntityEditor:onControlChange', event => {
				const [editor] = event.getData();
				editor?._toolPanel.enableSaveButton();
			});
			main_core_events.EventEmitter.subscribeOnce('BX.UI.EntityEditor:onCancel', event => {
				const [, eventArguments] = event.getData();
				eventArguments.enableCloseConfirmation = false;
			});
			main_core_events.EventEmitter.subscribeOnce('BX.UI.EntityEditor:onSave', event => {
				const [, eventArguments] = event.getData();
				eventArguments.enableCloseConfirmation = false;
			});
		}
		onAfterSave() {
			let analyticOptions;
			if (main_core.Type.isStringFilled(this.analytic.type)) {
				analyticOptions = {
					type: this.analytic.type.toLowerCase(),
					p1: biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.buildAppIdForAnalyticRequest(this.analytic.appId),
					p2: this.analytic.id,
					c_element: 'grid_menu',
					status: 'success'
				};
			} else {
				analyticOptions = {
					c_element: 'grid_settings',
					status: 'success'
				};
			}
			biconnector_apacheSupersetAnalytics.ApacheSupersetAnalytics.sendAnalytics('edit', 'report_settings', analyticOptions);
			this?._editor?._modeSwitch.reset();
			this.#sendOnSaveEvent();
			this.innerCancel();
		}
		#sendOnSaveEvent() {
			const datasetTypingValue = this?._editor?._model?.getField?.('DATASET_TYPING_ENABLED');
			const previousSlider = BX.SidePanel.Instance.getPreviousSlider(BX.SidePanel.Instance.getSliderByWindow(window));
			const parent = previousSlider ? previousSlider.getWindow() : top;
			if (!parent.BX.Event) {
				return;
			}
			parent.BX.Event.EventEmitter.emit('BX.BIConnector.Settings:onAfterSave', {
				datasetTypingEnabled: datasetTypingValue === 'Y'
			});
		}
		innerCancel() {
			SidePanel.Instance.close();
		}
		tryFocusSection(editor) {
			const slider = BX.SidePanel.Instance.getSliderByWindow(window);
			const sliderData = slider?.getData?.();
			const focusSection = sliderData && main_core.Type.isFunction(sliderData.get) ? sliderData.get('focusSection') : null;
			if (!main_core.Type.isStringFilled(focusSection)) {
				return;
			}
			const editorContainer = editor?.getContainer();
			const sectionWrapper = editorContainer?.querySelector(`[data-cid="${focusSection}"]`);
			const highlightContainer = sectionWrapper?.querySelector('.ui-entity-editor-section-edit') ?? sectionWrapper;
			if (!main_core.Type.isDomNode(highlightContainer)) {
				return;
			}
			highlightContainer.scrollIntoView({
				block: 'start',
				behavior: 'smooth'
			});
			main_core.Dom.addClass(highlightContainer, '--founded-item');
			setTimeout(() => {
				main_core.Dom.removeClass(highlightContainer, '--founded-item');
				main_core.Dom.addClass(highlightContainer, '--after-founded-item');
				setTimeout(() => {
					main_core.Dom.removeClass(highlightContainer, '--after-founded-item');
				}, 5000);
			}, 1000);
		}
	}

	/* eslint-disable no-underscore-dangle */
	class IconController extends BX.UI.EntityEditorController {
		constructor(id, settings) {
			super();
			this.initialize(id, settings);
			this.#subscribeOnEvents();
		}
		#subscribeOnEvents() {
			main_core_events.EventEmitter.subscribeOnce('BX.UI.EntityEditor:onInit', event => {
				const [editor] = event.getData();
				const control = editor?._controls?.[0];
				if (control?._sections && control._sections.length > 0) {
					this.#fillSectionIcons(control._sections);
				}
			});
		}
		#fillSectionIcons(sectionList) {
			for (const section of sectionList) {
				if (section.getTitle() !== '') {
					this.#setSectionIcon(section);
				}
			}
		}
		#setSectionIcon(section) {
			const container = section._headerContainer;
			if (container === null) {
				return;
			}
			const data = section.getData();
			const headerTitle = container.querySelector('.ui-entity-editor-header-title');
			if (headerTitle && data.iconClass) {
				const icon = main_core.Tag.render`
					<span class="
						superset-settings-section-icon
						ui-icon-set 
						${data.iconClass}
					"></span>
			`;
				main_core.Dom.insertBefore(icon, headerTitle);
			}
		}
	}

	class ControllerFactory {
		constructor(eventName) {
			main_core_events.EventEmitter.subscribe(`${eventName}:onInitialize`, event => {
				const [, eventArgs] = event.getCompatData();
				eventArgs.methods.dashboardSettings = this.factory.bind(this);
			});
		}
		factory(type, controlId, settings) {
			switch (type) {
				case 'settingComponentController':
					return new SettingController(controlId, settings);
				case 'iconController':
					return new IconController(controlId, settings);
				default:
					return null;
			}
		}
	}

	/* eslint-disable no-underscore-dangle */
	class DateFilterField extends BX.UI.EntityEditorList {
		static RANGE_VALUE = 'range';
		constructor(id, settings) {
			super();
			this.dateSelectorBlock = null;
			this.toInput = null;
			this.startInput = null;
		}
		static create(id, settings) {
			const self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		static layout(options = {}) {
			super.layout();
		}
		createTitleNode() {
			return main_core.Tag.render`<span></span>`;
		}
		layout(options) {
			super.layout(options);
			this.layoutRangeField(this.getValue() === DateFilterField.RANGE_VALUE);
			this.layoutHint();
		}
		onItemSelect(e, item) {
			this.layoutRangeField(item.value === DateFilterField.RANGE_VALUE);
			super.onItemSelect(e, item);
		}
		refreshLayout() {
			super.refreshLayout();
			this.layoutRangeField(this.getModel().getField('FILTER_PERIOD') === DateFilterField.RANGE_VALUE);
		}
		layoutRangeField(isRangeSelected) {
			if (this.dateSelectorBlock !== null) {
				main_core.Dom.remove(this.dateSelectorBlock);
				this.dateSelectorBlock = null;
				this.startInput = null;
				this.endInput = null;
			}
			if (isRangeSelected) {
				const dateStartValue = main_core.Text.encode(this.getModel().getField(this.getDateStartFieldName()));
				this.startInput = main_core.Tag.render`<input class="ui-ctl-element" type="text" value="${dateStartValue}" name="${this.getDateStartFieldName()}">`;
				main_core.Event.bind(this.startInput, 'click', () => {
					DateFilterField.showCalendar(this.startInput);
				});
				main_core.Event.bind(this.startInput, 'change', () => {
					this.onChange();
				});
				main_core.Event.bind(this.startInput, 'input', () => {
					this.onChange();
				});
				const dateEndValue = main_core.Text.encode(this.getModel().getField(this.getDateEndFieldName()));
				this.endInput = main_core.Tag.render`<input class="ui-ctl-element" type="text" value="${dateEndValue}" name="${this.getDateEndFieldName()}">`;
				main_core.Event.bind(this.endInput, 'click', () => {
					DateFilterField.showCalendar(this.endInput);
				});
				main_core.Event.bind(this.endInput, 'change', () => {
					this.onChange();
				});
				main_core.Event.bind(this.endInput, 'input', () => {
					this.onChange();
				});
				this.dateSelectorBlock = main_core.Tag.render`
					<div class="ui-ctl-dropdown-range-group">
						<div class="ui-ctl-container">
							<div class="ui-ctl-top">
								<div class="ui-ctl-title">${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_COMMON_RANGE_FROM_TITLE')}</div>
							</div>
							<div class="ui-ctl ui-ctl-before-icon ui-ctl-datetime">
								<div class="ui-ctl-before ui-ctl-icon-calendar"></div>
								${this.startInput}
							</div>
						</div>
						<div class="ui-ctl-container biconnector-superset-settings-panel-range__line-container">
							<div class="ui-ctl-dropdown-range-line">
								<span class="ui-ctl-dropdown-range-line-item"></span>
							</div>
						</div>
						<div class="ui-ctl-container">
							<div class="ui-ctl-top">
								<div class="ui-ctl-title">${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_COMMON_RANGE_TO_TITLE')}</div>
							</div>
							<div class="ui-ctl ui-ctl-before-icon ui-ctl-datetime">
								<div class="ui-ctl-before ui-ctl-icon-calendar"></div>
								${this.endInput}
							</div>
						</div>
					</div>
				`;
				main_core.Dom.append(this.dateSelectorBlock, this._innerWrapper);
			} else {
				main_core.Dom.addClass(this._selectContainer, 'ui-ctl-w100');
				main_core.Dom.removeClass(this._selectContainer, 'ui-ctl-date-range');
			}
		}
		layoutHint() {
			const hintContainer = main_core.Tag.render`
			<div class="biconnector-superset-settings-panel-range__hint">
				${this.getHintText()}
			</div>
		`;
			main_core.Dom.insertBefore(hintContainer, this._container);
		}
		getHintText() {
			const hintLink = `
			<a 
				class="biconnector-superset-settings-panel-range__hint-link"
				onclick="top.BX.Helper.show('redirect=detail&code=20337242&anchor=Defaultreportingperiod')"
			>
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_COMMON_RANGE_FIELD_HINT_LINK')}
			</a>
		`;
			return main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_COMMON_RANGE_FIELD_HINT').replace('#HINT_LINK#', hintLink);
		}
		getDateStartFieldName() {
			return this._schemeElement.getData().dateStartFieldName ?? 'DATE_FILTER_START';
		}
		getDateEndFieldName() {
			return this._schemeElement.getData().dateEndFieldName ?? 'DATE_FILTER_END';
		}
		save() {
			super.save();
			this._model.setField(this.getDateStartFieldName(), null);
			this._model.setField(this.getDateEndFieldName(), null);
			if (main_core.Type.isDomNode(this.endInput)) {
				this._model.setField(this.getDateEndFieldName(), this.endInput.value);
			}
			if (main_core.Type.isDomNode(this.startInput)) {
				this._model.setField(this.getDateStartFieldName(), this.startInput.value);
			}
		}
		static showCalendar(input) {
			BX.calendar.get().Close();
			BX.calendar({
				node: input,
				field: input,
				bTime: false,
				bSetFocus: false
			});
		}
	}

	class DashboardDateFilterField extends DateFilterField {
		getHintText() {
			return main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_DASHBOARD_RANGE_FIELD_HINT');
		}
	}

	/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */
	class KeyInfoField extends BX.UI.EntityEditorCustom {
		static create(id, settings) {
			const self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		createTitleNode() {
			return main_core.Tag.render`<span></span>`;
		}
		layout(options) {
			this.ensureWrapperCreated({
				classNames: ['ui-entity-editor-field-text']
			});
			this.adjustWrapper();
			const message = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_COMMON_KEY_FIELD_HINT_LINK', {
				'#HINT_LINK#': '<link></link>'
			});
			const hint = main_core.Tag.render`
			<div class="biconnector-superset-settings-panel-range__hint">
				${message}
			</div>
		`;
			const link = main_core.Tag.render`
			<a class="biconnector-superset-settings-panel-range__hint-link">
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_DASHBOARD_HINT_LINK')}
			</a>
		`;
			main_core.Event.bind(link, 'click', () => {
				top.BX.Helper.show('redirect=detail&code=20337242&anchor=Encryptionkey');
			});
			main_core.Dom.replace(hint.querySelector('link'), link);
			main_core.Dom.insertBefore(hint, this._container);
			this._innerWrapper = main_core.Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom biconnector-superset-settings-panel-key-info-container'></div>`;
			main_core.Dom.append(this._innerWrapper, this._wrapper);
			const value = main_core.Text.encode(this.getValue());
			this.keyInput = main_core.Tag.render`
			<input type="password" class="ui-ctl-element" readonly value="${value}">
		`;
			this.eyeButton = main_core.Tag.render`
			<button class="ui-btn-link ui-btn">
				<span class="ui-icon-set --crossed-eye"></span>
			</button>
		`;
			main_core.Event.bind(this.eyeButton, 'click', this.toggleKey.bind(this));
			const copyButton = main_core.Tag.render`
			<button class="ui-btn-link ui-btn">
				<span class="ui-icon-set --copy-plates"></span>
			</button>
		`;
			main_core.Event.bind(copyButton, 'click', this.copyText.bind(this));
			const content = main_core.Tag.render`
			<div class="ui-ctl ui-ctl__combined-input ui-ctl-w100">
				<div class="ui-ctl-icon__set ui-ctl-after">
					${this.eyeButton}
					${copyButton}
				</div>
				${this.keyInput}
			</div>
		`;
			main_core.Dom.append(content, this._innerWrapper);
			this.refreshButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_COMMON_KEY_FIELD_REFRESH_BUTTON_MSGVER_1'),
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				size: ui_buttons.ButtonSize.MEDIUM,
				onclick: this.refreshKey.bind(this)
			});
			this.refreshButton.renderTo(this._innerWrapper);
			this.registerLayout(options);
			this._hasLayout = true;
		}
		toggleKey(event) {
			if (!main_core.Type.isDomNode(this.keyInput)) {
				return;
			}
			const eye = this.eyeButton.querySelector('span');
			if (this.keyInput.type === 'password') {
				this.keyInput.type = 'text';
				main_core.Dom.removeClass(eye, '--crossed-eye');
				main_core.Dom.addClass(eye, '--opened-eye');
			} else {
				this.keyInput.type = 'password';
				main_core.Dom.removeClass(eye, '--opened-eye');
				main_core.Dom.addClass(eye, '--crossed-eye');
			}
		}
		copyText(event) {
			if (!main_core.Type.isDomNode(this.keyInput)) {
				return;
			}
			BX.clipboard.copy(this.getValue());
			BX.UI.Notification.Center.notify({
				content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_COMMON_KEY_COPIED'),
				autoHideDelay: 2000
			});
		}
		refreshKey() {
			this.refreshButton.setClocking();
			main_core.ajax.runComponentAction('bitrix:biconnector.apachesuperset.setting', 'changeBiToken', {
				mode: 'class'
			}).then(response => {
				const generatedKey = response.data;
				if (main_core.Type.isStringFilled(generatedKey)) {
					this.keyInput.value = main_core.Text.encode(generatedKey);
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_KEY_UPDATE_SUCCESS'),
						autoHideDelay: 2000
					});
				} else {
					BX.UI.Notification.Center.notify({
						content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_KEY_UPDATE_FAILED'),
						autoHideDelay: 2000
					});
				}
				this.refreshButton.setClocking(false);
			});
		}
	}

	/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */
	class ClearCacheField extends BX.UI.EntityEditorCustom {
		#clearCacheButton;
		#canClearCache = true;
		#clearTimeout = 0;
		static create(id, settings) {
			const self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		initialize(id, settings) {
			super.initialize(id, settings);
			const fieldSettings = settings.model.getData();
			this.#canClearCache = fieldSettings.canClearCache;
			this.#clearTimeout = parseInt(fieldSettings.clearCacheTimeout, 10);
			if (!this.#canClearCache) {
				this.#initCacheTimer();
			}
		}
		#initCacheTimer() {
			const timerContainer = main_core.Tag.render`
			<div class="biconnector-cache-container"></div>
		`;
			const timerProps = {
				seconds: this.#clearTimeout,
				node: timerContainer,
				onTimerEnd: () => {
					this.#canClearCache = true;
					this.#clearCacheButton.setDisabled(false);
				},
				onTimerUpdate: data => {
					this.#updateHintTimer(data);
				}
			};
			new ui_countdown.Countdown(timerProps);
		}
		#updateHintTimer(data) {
			this.#clearTimeout = data.seconds;
		}
		#clearCache() {
			if (!this.#canClearCache) {
				return new Promise(resolve => {
					resolve();
				});
			}
			this.#clearCacheButton.setDisabled();
			this.#canClearCache = false;
			return main_core.ajax.runAction('biconnector.superset.clearCache').then(response => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_CLEAR_CACHE_SUCCESS'),
					autoHideDelay: 2000
				});
				this.#clearTimeout = response.data.timeoutToNextClearCache;
				this.#initCacheTimer();
			}).catch(() => {
				BX.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_CLEAR_CACHE_ERROR'),
					autoHideDelay: 2000
				});
				this.#clearCacheButton.setDisabled(false);
				this.#canClearCache = true;
			});
		}
		layout(options) {
			this.ensureWrapperCreated({
				classNames: ['ui-entity-editor-field-text']
			});
			this.adjustWrapper();
			const message = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_CLEAR_CACHE_HINT_LINK', {
				'#HINT_LINK#': '<link></link>'
			});
			const hint = main_core.Tag.render`
			<div class="biconnector-superset-settings-panel-range__hint">
				${message}
			</div>
		`;
			const link = main_core.Tag.render`
			<a class="biconnector-superset-settings-panel-range__hint-link">
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_DASHBOARD_HINT_LINK')}
			</a>
		`;
			main_core.Event.bind(link, 'click', () => {
				top.BX.Helper.show('redirect=detail&code=21000502');
			});
			main_core.Dom.replace(hint.querySelector('link'), link);
			main_core.Dom.insertBefore(hint, this._container);
			this._innerWrapper = main_core.Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom'></div>`;
			main_core.Dom.append(this._innerWrapper, this._wrapper);
			this.#initClearCacheButton();
			this.registerLayout(options);
			this._hasLayout = true;
		}
		#initClearCacheButton() {
			const buttonContainer = main_core.Tag.render`<div></div>`;
			this.#clearCacheButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_CLEAR_CACHE_BUTTON'),
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				size: ui_buttons.ButtonSize.SMALL,
				onclick: this.#clearCache.bind(this),
				state: this.#canClearCache ? null : ui_buttons.ButtonState.DISABLED
			});
			this.#clearCacheButton.renderTo(buttonContainer);

			// Put the clear button into the section header
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorSection:onLayout', event => {
				if (event.data[1].id === 'CLEAR_CACHE_SECTION') {
					event.data[1].customNodes.push(buttonContainer);
				}
			});
			const node = this.#clearCacheButton.button;
			const hint = BX.UI.Hint.createInstance({
				popupParameters: {
					offsetLeft: -60,
					angle: {
						offset: 160
					}
				}
			});
			main_core.Event.bind(node, 'mouseenter', () => {
				this.#clearCacheButton.button.setAttribute('data-hint-no-icon', '');
				if (this.#clearTimeout) {
					const minutesLeft = Math.ceil(parseInt(this.#clearTimeout, 10) / 60);
					hint.show(node, main_core.Loc.getMessagePlural('BICONNECTOR_SUPERSET_SETTINGS_CLEAR_CACHE_BUTTON_HINT_TIME_LEFT', minutesLeft, {
						'#COUNT#': minutesLeft
					}));
				}
			});
			main_core.Event.bind(node, 'mouseleave', () => {
				hint.hide(node);
			});
		}
	}

	/* eslint-disable no-underscore-dangle,@bitrix24/bitrix24-rules/no-pseudo-private */
	class DashboardGroupsField extends BX.UI.EntityEditorCustom {
		#isAllowedClearGroups = false;
		#groups;
		#scopes;
		#params;
		#paramList;
		#requiredParamList;
		static create(id, settings) {
			const self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		initialize(id, settings) {
			super.initialize(id, settings);
			this.#isAllowedClearGroups = this._model.getField('IS_ALLOWED_CLEAR_GROUPS', false);
			this.#scopes = new Set();
			const scopes = this._model.getField('SCOPE', []);
			scopes.forEach(scopeCode => {
				this.#scopes.add(scopeCode);
			});
			this.#params = new Set();
			const params = this._model.getField('PARAMS', []);
			params.forEach(param => {
				this.#params.add(param);
			});
			this.#groups = new Set();
			const groups = this._model.getField('GROUPS', []);
			groups.forEach(groupId => {
				this.#groups.add(main_core.Text.toNumber(groupId));
			});
			this.#paramList = this._model.getField('PARAM_LIST', {});
			this.#requiredParamList = this._model.getField('REQUIRED_PARAM_LIST', []);
			main_core_events.EventEmitter.subscribe('BIConnector.DashboardParamsSelector:onChange', this.onChange.bind(this));
		}
		layout(options) {
			this.ensureWrapperCreated({
				classNames: ['ui-entity-editor-field-text']
			});
			this.adjustWrapper();
			this._innerWrapper = main_core.Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom'></div>`;
			const messageId = this.#isAllowedClearGroups ? 'BICONNECTOR_SUPERSET_SETTINGS_GROUP_FIELD_HINT_CLEARABLE' : 'BICONNECTOR_SUPERSET_SETTINGS_GROUP_FIELD_HINT';
			const message = main_core.Loc.getMessage(messageId, {
				'#HINT_LINK#': '<link></link>'
			});
			const hint = main_core.Tag.render`
			<div class="biconnector-superset-settings-panel-range__hint">
				${message}
			</div>
		`;
			const link = main_core.Tag.render`
			<a class="biconnector-superset-settings-panel-range__hint-link">
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_DASHBOARD_HINT_LINK')}
			</a>
		`;
			main_core.Event.bind(link, 'click', () => {
				top.BX.Helper.show('redirect=detail&code=25556500');
			});
			main_core.Dom.replace(hint.querySelector('link'), link);
			main_core.Dom.insertBefore(hint, this._container);
			main_core.Dom.append(this._innerWrapper, this._wrapper);
			const selectorParams = {
				groups: this.#groups,
				scopes: this.#scopes,
				params: this.#params,
				paramList: this.#paramList,
				isAllowedClearGroups: this.#isAllowedClearGroups,
				requiredParamList: this.#requiredParamList,
				isNew: false
			};
			const selector = new biconnector_dashboardParametersSelector.DashboardParametersSelector(selectorParams);
			main_core.Dom.append(selector.getLayout(), this._innerWrapper);
			this.registerLayout(options);
			this._hasLayout = true;
		}
		save() {
			if (main_core.Type.isDomNode(this._innerWrapper)) {
				const oldSaveBlock = this._innerWrapper.querySelector('.save-block');
				if (main_core.Type.isDomNode(oldSaveBlock)) {
					main_core.Dom.remove(oldSaveBlock);
				}
				const saveBlock = main_core.Tag.render`<div class="save-block"></div>`;
				for (const group of this.#groups) {
					main_core.Dom.append(main_core.Tag.render`<input type="hidden" name="${this.getName()}[GROUPS][]" value="${group}">`, saveBlock);
				}
				for (const scope of this.#scopes) {
					main_core.Dom.append(main_core.Tag.render`<input type="hidden" name="${this.getName()}[SCOPE][]" value="${scope}">`, saveBlock);
				}
				for (const param of this.#params) {
					main_core.Dom.append(main_core.Tag.render`<input type="hidden" name="${this.getName()}[PARAMS][]" value="${param}">`, saveBlock);
				}
				main_core.Dom.append(saveBlock, this._innerWrapper);
			}
			this._model.setField(this.getName(), [...this.#groups]);
		}
		onChange(params) {
			const {
				isChanged,
				isLocked
			} = params.data;
			if (isChanged) {
				this.markAsChanged();
			} else {
				this._isChanged = false;
			}
			if (isLocked) {
				this.getEditor()?._toolPanel.disableSaveButton();
				return;
			}
			this.getEditor().enableSaveButton();
		}
	}

	class DashboardLanguageField extends BX.UI.EntityEditorCustom {
		#currentLanguage = '';
		#initialLanguage = '';
		#languageChanged = false;
		#languageInfoContainer;
		#loader;
		static create(id, settings) {
			const self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		initialize(id, settings) {
			super.initialize(id, settings);
			const fieldSettings = settings.model.getData();
			this.#currentLanguage = fieldSettings.currentLanguage || '';
			this.#initialLanguage = this.#currentLanguage;
			main_core_events.EventEmitter.subscribe('biconnector:onGlobalSettingsChange', this.#refreshLanguageInfo.bind(this));
		}
		layout(options) {
			this.ensureWrapperCreated({
				classNames: ['ui-entity-editor-field-text']
			});
			this.adjustWrapper();
			this._innerWrapper = main_core.Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom'></div>`;
			main_core.Dom.append(this._innerWrapper, this._wrapper);
			const languageInfoContainer = this.#getLanguageInfoContainer();
			this.#languageInfoContainer = languageInfoContainer;
			main_core.Dom.append(languageInfoContainer, this._innerWrapper);
			this.registerLayout(options);
			this._hasLayout = true;
			this.#ensureSettingsSliderCloseHandler();
		}
		#getCurrentLanguageBlock() {
			return `
			<div class='biconnector-dashboard-language-current-block'>
				${this.#currentLanguage}
			</div>
		`;
		}
		#getCurrentLanguage() {
			return main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_CURRENT_DASHBOARD_LANGUAGE_MSGVER_1').replace('[div]', '<div class="biconnector-dashboard-language-current-title">').replace('[/div]', '</div>').replace('#LANGUAGE#', this.#getCurrentLanguageBlock());
		}
		#getLanguageInfoContainer() {
			return main_core.Tag.render`
			<div class="biconnector-dashboard-language-info">
				<div class="biconnector-dashboard-language-current">
					${this.#getCurrentLanguage()}
				</div>
			</div>
		`;
		}
		#refreshLanguageInfo() {
			if (!main_core.Type.isDomNode(this.#languageInfoContainer)) {
				return;
			}
			this.#showLoader();
			main_core.ajax.runComponentAction('bitrix:biconnector.apachesuperset.setting', 'getDashboardLanguage', {
				mode: 'class'
			}).then(response => {
				const language = response.data?.currentLanguage;
				if (main_core.Type.isStringFilled(language)) {
					this.#currentLanguage = language;
					this.#languageChanged = this.#currentLanguage !== this.#initialLanguage;
					const currentLanguageNode = this.#languageInfoContainer.querySelector('.biconnector-dashboard-language-current');
					if (main_core.Type.isDomNode(currentLanguageNode)) {
						currentLanguageNode.innerHTML = this.#getCurrentLanguage();
					}
				}
				this.#loader?.hide();
			}).catch(() => this.#loader?.hide());
		}
		#showLoader() {
			if (!main_core.Type.isDomNode(this.#languageInfoContainer)) {
				return;
			}
			if (!this.#loader) {
				this.#loader = new main_loader.Loader({
					target: this.#languageInfoContainer,
					size: 40
				});
			}
			this.#loader.show();
		}
		#ensureSettingsSliderCloseHandler() {
			const hostWindow = main_pageobject.PageObject.getRootWindow().window;
			const hostBX = hostWindow?.BX;
			if (!hostBX?.SidePanel?.Instance) {
				return;
			}
			const slider = hostBX.SidePanel.Instance.getSliderByWindow?.(window);
			if (!slider) {
				return;
			}
			const sliderCloseHandler = () => {
				if (this.#shouldReloadHostWindow(hostWindow)) {
					hostWindow.location.reload();
				}
			};
			main_core_events.EventEmitter.subscribeOnce(slider, 'SidePanel.Slider:onCloseComplete', sliderCloseHandler);
		}
		#shouldReloadHostWindow(hostWindow) {
			if (!this.#languageChanged) {
				return false;
			}
			const pathname = hostWindow?.location?.pathname || '';
			return pathname === '/bi/dashboard/';
		}
	}

	/* eslint-disable no-underscore-dangle */
	/* eslint-disable @bitrix24/bitrix24-rules/no-pseudo-private */
	class DatasetTypingField extends BX.UI.EntityEditorCustom {
		#isEnabled;
		#initialEnabled;
		#isLocked;
		static create(id, settings) {
			const self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		initialize(id, settings) {
			super.initialize(id, settings);
			const data = this._schemeElement?.getData?.() ?? {};
			const value = this._model.getField(this.getName(), 'N');
			this.#isLocked = data.disabled === true;
			this.#isEnabled = this.#isLocked ? true : value === 'Y';
			this.#initialEnabled = this.#isEnabled;
		}
		layout(options) {
			this.ensureWrapperCreated({
				classNames: ['ui-entity-editor-field-text']
			});
			this.adjustWrapper();
			this.layoutHint();
			this._innerWrapper = main_core.Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom'></div>`;
			main_core.Dom.append(this._innerWrapper, this._wrapper);
			main_core.Dom.append(this.buildSwitcher(), this._innerWrapper);
			this.registerLayout(options);
			this._hasLayout = true;
		}
		layoutHint() {
			const hintContainer = main_core.Tag.render`
			<div class="biconnector-superset-settings-panel-range__hint">
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_DATASET_TYPING_HINT')}
			</div>
		`;
			main_core.Dom.insertBefore(hintContainer, this._container);
		}
		onChange() {
			if (this.#initialEnabled !== this.#isEnabled) {
				this.markAsChanged();
				return;
			}
			this._isChanged = false;
		}
		save() {
			if (main_core.Type.isDomNode(this._innerWrapper)) {
				const oldSaveBlock = this._innerWrapper.querySelector('.save-block');
				if (main_core.Type.isDomNode(oldSaveBlock)) {
					main_core.Dom.remove(oldSaveBlock);
				}
				const saveBlock = main_core.Tag.render`<div class="save-block"></div>`;
				main_core.Dom.append(main_core.Tag.render`<input type="hidden" name="${this.getName()}" value="${this.#isEnabled ? 'Y' : 'N'}">`, saveBlock);
				main_core.Dom.append(saveBlock, this._innerWrapper);
			}
			this._model.setField(this.getName(), this.#isEnabled ? 'Y' : 'N');
		}
		buildSwitcher() {
			const switcherNode = this.buildSwitcherNode();
			const content = this.buildSwitcherContent(switcherNode);
			this.initTypingSwitcher(switcherNode);
			return content;
		}
		buildSwitcherNode() {
			return main_core.Tag.render`<div class="biconnector-superset-settings-panel-switcher__control"></div>`;
		}
		buildSwitcherContent(switcherNode) {
			const label = main_core.Tag.render`
			<div class="biconnector-superset-settings-panel-switcher__label">
				${main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_DATASET_TYPING_TOGGLE')}
			</div>
		`;
			return main_core.Tag.render`
			<div class="biconnector-superset-settings-panel-switcher">
				${switcherNode}
				${label}
			</div>
		`;
		}
		initTypingSwitcher(switcherNode) {
			new ui_switcher.Switcher({
				node: switcherNode,
				size: ui_switcher.SwitcherSize.extraLarge,
				checked: this.#isEnabled,
				disabled: this.#isLocked,
				handlers: {
					toggled: () => {
						if (this.#isLocked) {
							return;
						}
						this.#isEnabled = !this.#isEnabled;
						this._model.setField(this.getName(), this.#isEnabled ? 'Y' : 'N');
						this.onChange();
					}
				}
			});
		}
	}

	class TimeZoneField extends BX.UI.EntityEditorCustom {
		#currentTimeZone = '';
		#timeZoneInfoContainer;
		#loader;
		static create(id, settings) {
			const self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		initialize(id, settings) {
			super.initialize(id, settings);
			const fieldSettings = settings.model.getData();
			this.#currentTimeZone = fieldSettings.currentTimeZone || '';
			main_core_events.EventEmitter.subscribe('biconnector:onGlobalSettingsChange', this.#refreshTimeZoneInfo.bind(this));
		}
		layout(options) {
			this.ensureWrapperCreated({
				classNames: ['ui-entity-editor-field-text']
			});
			this.adjustWrapper();
			const message = main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_GLOBAL_SETTINGS_SECTION_HINT');
			const hint = main_core.Tag.render`
			<div class="biconnector-superset-settings-panel-range__hint">
				${message}
			</div>
		`;
			main_core.Dom.insertBefore(hint, this._container);
			this._innerWrapper = main_core.Tag.render`<div class='ui-entity-editor-content-block ui-ctl-custom'></div>`;
			main_core.Dom.append(this._innerWrapper, this._wrapper);
			const timeZoneInfoContainer = this.#getTimeZoneInfoContainer();
			this.#timeZoneInfoContainer = timeZoneInfoContainer;
			main_core.Dom.append(timeZoneInfoContainer, this._innerWrapper);
			this.registerLayout(options);
			this._hasLayout = true;
		}
		#getCurrentTimeZoneBlock() {
			return `
			<div class='biconnector-dashboard-timezone-current-block'>
				${this.#currentTimeZone}
			</div>
		`;
		}
		#getCurrentTimeZone() {
			return main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_CURRENT_TIMEZONE').replace('[div]', '<div class="biconnector-dashboard-timezone-current-title">').replace('[/div]', '</div>').replace('#TIME_ZONE#', this.#getCurrentTimeZoneBlock());
		}
		#getTimeZoneInfoContainer() {
			return main_core.Tag.render`
			<div class="biconnector-dashboard-timezone-info">
				<div class="biconnector-dashboard-timezone-current">
					${this.#getCurrentTimeZone()}
				</div>
			</div>
		`;
		}
		#refreshTimeZoneInfo() {
			if (!main_core.Type.isDomNode(this.#timeZoneInfoContainer)) {
				return;
			}
			this.#showLoader();
			main_core.ajax.runComponentAction('bitrix:biconnector.apachesuperset.setting', 'getTimeZone', {
				mode: 'class'
			}).then(response => {
				const timeZone = response.data?.currentTimeZone;
				this.#currentTimeZone = timeZone;
				const currentTimeZoneNode = this.#timeZoneInfoContainer.querySelector('.biconnector-dashboard-timezone-current');
				if (main_core.Type.isDomNode(currentTimeZoneNode)) {
					currentTimeZoneNode.innerHTML = this.#getCurrentTimeZone();
				}
				this.#loader?.hide();
			}).catch(() => this.#loader?.hide());
		}
		#showLoader() {
			if (!main_core.Type.isDomNode(this.#timeZoneInfoContainer)) {
				return;
			}
			if (!this.#loader) {
				this.#loader = new main_loader.Loader({
					target: this.#timeZoneInfoContainer,
					size: 40
				});
			}
			this.#loader.show();
		}
	}

	class GlobalSettingsButtonField extends BX.UI.EntityEditorCustom {
		#settingsUrl;
		#sectionName;
		#changeButton;
		static create(id, settings) {
			const self = new this(id, settings);
			self.initialize(id, settings);
			return self;
		}
		initialize(id, settings) {
			super.initialize(id, settings);
			const fieldSettings = settings.model.getData();
			this.#settingsUrl = fieldSettings.settingsUrl;
			this.#sectionName = fieldSettings.sectionName;
		}
		layout(options) {
			this.ensureWrapperCreated({
				classNames: ['ui-entity-editor-field-text']
			});
			this.adjustWrapper();
			this.setVisible(false);
			this.#initChangeButton();
			this.registerLayout(options);
			this._hasLayout = true;
		}
		#initChangeButton() {
			const buttonContainer = main_core.Tag.render`<div></div>`;
			this.#changeButton = new ui_buttons.Button({
				text: main_core.Loc.getMessage('BICONNECTOR_SUPERSET_SETTINGS_CHANGE_GLOBAL_SETTINGS'),
				color: ui_buttons.ButtonColor.LIGHT_BORDER,
				size: ui_buttons.ButtonSize.SMALL,
				onclick: this.#onChangeClick.bind(this)
			});
			this.#changeButton.renderTo(buttonContainer);
			main_core_events.EventEmitter.subscribe('BX.UI.EntityEditorSection:onLayout', event => {
				if (event.data[1].id === 'DASHBOARD_GLOBAL_SETTINGS') {
					event.data[1].customNodes.push(buttonContainer);
				}
			});
		}
		#onChangeClick() {
			this.#openGlobalSettings();
		}
		#openGlobalSettings() {
			const hostWindow = window.top ?? window;
			const hostBX = hostWindow.BX;
			hostBX?.Event.EventEmitter.subscribeOnce(hostBX?.Event.EventEmitter.GLOBAL_TARGET, 'SidePanel.Slider:onLoad', baseEvent => {
				const slider = baseEvent.getTarget();
				slider.getWindow().BX.Event.EventEmitter.subscribeOnce(slider.getWindow().BX.Event.EventEmitter.GLOBAL_TARGET, 'BX.Intranet.Settings:onSuccessSave', innerBaseEvent => {
					const extraSettings = innerBaseEvent.getData();
					if (main_core.Type.isObject(extraSettings)) {
						extraSettings.reloadAfterClose = false;
					}
				});
			});
			BX.SidePanel.Instance.open(this.#settingsUrl, {
				cacheable: false,
				width: 1034,
				events: {
					onCloseComplete: () => {
						main_core_events.EventEmitter.emit('biconnector:onGlobalSettingsChange');
					}
				}
			});
		}
	}

	class FieldFactory {
		constructor(entityEditorControlFactory = 'BX.UI.EntityEditorControlFactory') {
			main_core_events.EventEmitter.subscribe(`${entityEditorControlFactory}:onInitialize`, event => {
				const [, eventArgs] = event.getCompatData();
				eventArgs.methods.dashboardSettings = this.factory.bind(this);
			});
		}
		factory(type, controlId, settings) {
			switch (type) {
				case 'timePeriod':
					return DateFilterField.create(controlId, settings);
				case 'dashboardTimePeriod':
					return DashboardDateFilterField.create(controlId, settings);
				case 'keyInfo':
					return KeyInfoField.create(controlId, settings);
				case 'dashboardGroupsSelector':
					return DashboardGroupsField.create(controlId, settings);
				case 'clearCache':
					return ClearCacheField.create(controlId, settings);
				case 'dashboardLanguage':
					return DashboardLanguageField.create(controlId, settings);
				case 'datasetTyping':
					return DatasetTypingField.create(controlId, settings);
				case 'timeZone':
					return TimeZoneField.create(controlId, settings);
				case 'globalSettingsButton':
					return GlobalSettingsButtonField.create(controlId, settings);
				default:
					return null;
			}
		}
	}

	class SettingsPanel {
		static registerFieldFactory(entityEditorControlFactory) {
			new FieldFactory(entityEditorControlFactory);
		}
		static registerControllerFactory(entityEditorControllerFactory) {
			new ControllerFactory(entityEditorControllerFactory);
		}
	}

	exports.SettingsPanel = SettingsPanel;

})(this.BX.BIConnector.ApacheSuperset = this.BX.BIConnector.ApacheSuperset || {}, BX.Event, BX, BX.BIConnector, window, BX, BX.UI, BX.UI.Notification, BX, BX.UI, BX.BIConnector, BX, BX, BX.UI);
